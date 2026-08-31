/**
 * ClaudeCommandBuilder — Builds Claude Code CLI commands.
 *
 * SRP Does: Assemble the executable, plugin directory flags, allowed
 * tools flags, and arguments for a Claude Code CLI invocation.
 *
 * SRP Knows About: Claude Code's CLI interface — its --plugin-dir flags,
 * --allowedTools flag, the AI Tool Command (e.g. "/run-jira-workflow") and
 * argument ordering — and that the claude executable itself is found by the
 * injected resolver at build() time (AHQ-211 D4).
 *
 * SRP Knows Nothing About: How the resolver locates claude, I/O
 * marshalling, process spawning, or where the user's project lives (i.e.
 * where the "claude" command will be run from).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import type { CLICommand } from '../../../interfaces/cli-command.js';
import type { MarshalledIOCLICommandBuilder } from '../../../interfaces/marshalled-io-cli-command-builder.js';
import { DefaultCLICommand } from '../../../io/terminal/default-cli-command.js';
import type { Workspace } from '../../../workflow-discovery/interfaces/workspace.js';

import {
  resolveClaudeLaunch,
  type ClaudeLaunch,
  type ResolveClaudeLaunchFn,
} from './claude-executable-resolver.js';

const PLUGINS_SUBDIR = 'plugins';

/**
 * Allowed tools for Claude Code, passed via --allowedTools CLI flag.
 * These tools are auto-approved (no permission prompt) for all workspaces
 * that run via the agentic-hq CLI.
 */
const DEFAULT_ALLOWED_TOOLS = [
  'Bash',
  'Edit',
  'Write',
  'MultiEdit',
  'mcp__mcp-atlassian__jira_get_issue',
  'mcp__mcp-atlassian__jira_create_issue',
  'mcp__mcp-atlassian__jira_add_comment',
  'mcp__mcp-atlassian__confluence_get_page',
  'mcp__mcp-atlassian__confluence_search',
  'mcp__mcp-atlassian__jira_get_transitions',
  'mcp__mcp-atlassian__jira_transition_issue',
  'mcp__mcp-atlassian__jira_search',
  'mcp__mcp-atlassian__jira_update_issue',
  // Since roughly version 2.1.141 Claude Code suddenly needs explicit approval to run
  // a skill from within another skill.  e.g. the self-termination skill being called
  // from within the string-reversal skill - see AHQ-142 bug
  // To get round this adding that skill to this list of allowedTools here.  Need to
  // audit all workflows/skill for any other skills or commands that are called from
  // within skills or commands.
  'Skill(agentic-hq-core-plugin:self-termination)',
];

export class ClaudeCommandBuilder implements MarshalledIOCLICommandBuilder {
  private readonly ahqPackage: Workspace;
  private readonly currentUserWorkspace: Workspace;
  private readonly executable: string | undefined;
  private readonly extraArgs: string[];
  private readonly resolveLaunch: ResolveClaudeLaunchFn;

  /**
   * `executable` undefined (production) means "resolve claude at build()
   * time" — the resolver turns the bare command into an absolute path (plus
   * a legacy npm-shim args prefix when needed) that pty.spawn can run on
   * every platform (AHQ-211 D4). Naming an executable explicitly (the
   * fake-claude test-fixture seam) bypasses resolution: it is spawned
   * exactly as given.
   */
  constructor(
    ahqPackage: Workspace,
    currentUserWorkspace: Workspace,
    executable?: string,
    extraArgs: string[] = [],
    resolveLaunch: ResolveClaudeLaunchFn = resolveClaudeLaunch
  ) {
    this.ahqPackage = ahqPackage;
    this.currentUserWorkspace = currentUserWorkspace;
    this.executable = executable;
    this.extraArgs = extraArgs;
    this.resolveLaunch = resolveLaunch;
  }

  build(aiToolCommand: string, marshallingId: string): CLICommand {
    // Resolved per build() call, never at construction: resolution walks the
    // filesystem and must only run (and only fail) when a launch is happening
    const launch: ClaudeLaunch =
      this.executable !== undefined
        ? { executable: this.executable, argsPrefix: [] }
        : this.resolveLaunch();
    const args = [...launch.argsPrefix, ...this.buildArgsList(aiToolCommand, marshallingId)];

    return new DefaultCLICommand(launch.executable, args);
  }

  private buildArgsList(aiToolCommand: string, marshallingId: string): string[] {
    return [
      ...this.extraArgs,
      ...this.getClaudeCliPluginDirArgs(),
      `--allowedTools=${this.buildAllowedToolsListString()}`,
      // Claude expects the AI tool command plus its argument as the final
      // positional argument. The marshalling session ID (the io-directory) is
      // the ONLY value that crosses the hop (AHQ-210/AHQ-211 D1 deleted the
      // AHQ-197 build-mode/package-root relay), and it is double-quoted
      // because the AI re-splits this prompt on spaces and Windows paths
      // routinely contain them (D5).
      `${aiToolCommand} "${marshallingId}"`,
    ];
  }

  private buildAllowedToolsListString(): string {
    // Workflows need Read access to the agenticHqInstallationRootDir because command .md files and
    // reference docs (README, how-agentic-hq-works, example workflows) live there.
    // When the user's run agentic-hq from a different workspace than the AHQ repo, Claude doesn't
    // auto-approve reads outside the user's current working directory — so we explicitly
    // approve agenticHqInstallationRootDir Read access here.
    // NOTE: This is temporary since AHQ-102 will bundle required resources with each workflow skill,
    // and so at that point we can remove this entire function and just use DEFAULT_ALLOWED_TOOLS again.
    const agenticHqInstallationRootDir = this.ahqPackage.getDotAgenticHqDir();
    return [...DEFAULT_ALLOWED_TOOLS, `Read(${agenticHqInstallationRootDir})`].join(' ');
  }

  // REFACTOR: Later, investigate whether we can simplify this by
  // passing pluginDir explicitly from AhqWorkflow (when doing skill resolution)
  // and from DefaultClaudeCodeTool (when running a command from the workflow runtime)
  // instead of doing what we are doing here: i.e. scanning the two workspace directories
  // for *all* plugins and adding them to the path.  If it's going to be too much work/hassle
  // leave it for now, as this whole "2 workspace" setup is probably temporary for developers to
  // try out AHQ, and in the future we'll probably want some more complex dynamic resolution
  // of plugin directories in multiple (unlimited) workspaces - so may be better to leave doing this
  // "properly" until then and leave this slightly hacky, quick search of 2 workspaces for the moment.
  private getClaudeCliPluginDirArgs(): string[] {
    const ahqPluginsDir = path.join(this.ahqPackage.getDotAgenticHqDir(), PLUGINS_SUBDIR);
    const userPluginsDir = path.join(
      this.currentUserWorkspace.getDotAgenticHqDir(),
      PLUGINS_SUBDIR
    );

    const flags: string[] = [];
    // The user's plugin dirs go FIRST: Claude Code keeps only the first of two --plugin-dir
    // flags that name the same plugin (probed 2026-08-16, AHQ-205), so this order is what makes
    // "local workspace wins" true at the Claude layer, not just in the CLI's subcommand table.
    if (!this.currentUserWorkspace.isAhqPackage()) {
      this.addPluginDirsFrom(userPluginsDir, flags);
    }
    this.addPluginDirsFrom(ahqPluginsDir, flags);
    return flags;
  }

  private addPluginDirsFrom(pluginsDir: string, flags: string[]): void {
    if (!fs.existsSync(pluginsDir)) {
      return;
    }
    const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        flags.push(`--plugin-dir=${path.join(pluginsDir, entry.name)}`);
      }
    }
  }
}

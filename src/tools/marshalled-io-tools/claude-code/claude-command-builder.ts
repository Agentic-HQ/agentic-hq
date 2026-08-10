/**
 * ClaudeCommandBuilder — Builds Claude Code CLI commands.
 *
 * SRP Does: Assemble the executable, plugin directory flags, allowed
 * tools flags, and arguments for a Claude Code CLI invocation.
 *
 * SRP Knows About: Claude Code's CLI interface — its executable name,
 * --plugin-dir flags, --allowedTools flag, the AI Tool Command (e.g. "/run-jira-workflow")
 * and argument ordering.
 *
 * SRP Knows Nothing About: I/O marshalling, process spawning, or where
 * the user's project lives (i.e. where the "claude" command will be
 * run from).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import type { AhqRuntimeParams } from '../../../interfaces/ahq-runtime-params.js';
import type { CLICommand } from '../../../interfaces/cli-command.js';
import type { MarshalledIOCLICommandBuilder } from '../../../interfaces/marshalled-io-cli-command-builder.js';
import { DefaultCLICommand } from '../../../io/terminal/default-cli-command.js';
import type { Workspace } from '../../../workflow-discovery/interfaces/workspace.js';

// Default CLI executable
const DEFAULT_CLAUDE_EXECUTABLE = 'claude';

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
  private readonly ahqWorkspace: Workspace;
  private readonly currentUserWorkspace: Workspace;
  private readonly ahqRuntimeParams: AhqRuntimeParams;
  private readonly executable: string;
  private readonly extraArgs: string[];

  constructor(
    ahqWorkspace: Workspace,
    currentUserWorkspace: Workspace,
    ahqRuntimeParams: AhqRuntimeParams,
    executable: string = DEFAULT_CLAUDE_EXECUTABLE,
    extraArgs: string[] = []
  ) {
    this.ahqWorkspace = ahqWorkspace;
    this.currentUserWorkspace = currentUserWorkspace;
    this.ahqRuntimeParams = ahqRuntimeParams;
    this.executable = executable;
    this.extraArgs = extraArgs;
  }

  build(aiToolCommand: string, marshallingId: string): CLICommand {
    const args = this.buildArgsList(aiToolCommand, marshallingId);

    return new DefaultCLICommand(this.executable, args);
  }

  private buildArgsList(aiToolCommand: string, marshallingId: string): string[] {
    return [
      ...this.extraArgs,
      ...this.getClaudeCliPluginDirArgs(),
      `--allowedTools=${this.buildAllowedToolsListString()}`,
      // Claude expects the AI tool command plus its arguments as the final
      // positional argument: the marshalling session ID, then the build-mode
      // and ahq-package-root the AI relays VERBATIM across the skill hop
      // without interpreting them (AHQ-197) — pure argument plumbing.
      `${aiToolCommand} ${marshallingId} ${this.ahqRuntimeParams.getBuildMode().getValue()} ${this.ahqRuntimeParams.getAhqPackageRoot().getPath()}`,
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
    const agenticHqInstallationRootDir = this.ahqWorkspace.getDotAgenticHqDir();
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
    const ahqPluginsDir = path.join(this.ahqWorkspace.getDotAgenticHqDir(), PLUGINS_SUBDIR);
    const userPluginsDir = path.join(
      this.currentUserWorkspace.getDotAgenticHqDir(),
      PLUGINS_SUBDIR
    );

    const flags: string[] = [];
    this.addPluginDirsFrom(ahqPluginsDir, flags);
    if (!this.currentUserWorkspace.isAhqWorkspace()) {
      this.addPluginDirsFrom(userPluginsDir, flags);
    }
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

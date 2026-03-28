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
import * as path from 'node:path';

import type { AgenticHqInstallation } from '../../../interfaces/agentic-hq-installation.js';
import type { CLICommand } from '../../../interfaces/cli-command.js';
import type { MarshalledIOCLICommandBuilder } from '../../../interfaces/marshalled-io-cli-command-builder.js';
import { DefaultCLICommand } from '../../../io/terminal/default-cli-command.js';

// Default CLI executable
const DEFAULT_CLAUDE_EXECUTABLE = 'claude';

// Plugin directory names within installation.pluginsDir
const PLUGIN_DIR_NAMES = [
  'agentic-hq-core-plugin',
  'agentic-hq-demos-plugin',
  'agentic-hq-utilities-plugin',
];

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
];

export class ClaudeCommandBuilder implements MarshalledIOCLICommandBuilder {
  private readonly agenticHqInstallation: AgenticHqInstallation;
  private readonly executable: string;
  private readonly extraArgs: string[];

  constructor(
    agenticHqInstallation: AgenticHqInstallation,
    executable: string = DEFAULT_CLAUDE_EXECUTABLE,
    extraArgs: string[] = []
  ) {
    this.agenticHqInstallation = agenticHqInstallation;
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
      ...this.getPluginDirFlags(),
      `--allowedTools=${DEFAULT_ALLOWED_TOOLS.join(' ')}`,
      // Claude expects the AI tool command plus marshalling session ID as the final positional argument.
      `${aiToolCommand} ${marshallingId}`,
    ];
  }

  private getPluginDirFlags(): string[] {
    const pluginsDir = path.join(this.agenticHqInstallation.getConfigDir(), 'plugins');
    return PLUGIN_DIR_NAMES.map((name) => `--plugin-dir=${path.join(pluginsDir, name)}`);
  }
}

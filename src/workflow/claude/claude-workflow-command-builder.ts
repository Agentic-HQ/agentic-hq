/**
 * ClaudeWorkflowCommandBuilder — builds workflow commands using Claude skills.
 *
 * SRP Does: Resolve a skill path into a shell command string via Tool
 * (which invokes Claude to interpret the skill), append shell-escaped
 * passthrough args, and return a DefaultWorkflowCommand.
 *
 * SRP Knows About: Skill resolution via Tool, shell escaping of args,
 * and how to construct a DefaultWorkflowCommand.
 *
 * SRP Knows Nothing About: How the Tool resolves skills internally,
 * how the command will be executed, or I/O marshalling details.
 */
import type { CLIWrapper } from '../../interfaces/cli-wrapper.js';
import type { Tool } from '../../interfaces/tool.js';
import type { WorkflowCommandBuilder } from '../../interfaces/workflow-command-builder.js';
import type { WorkflowCommand } from '../../interfaces/workflow-command.js';
import type { Workspace } from '../../workflow-discovery/interfaces/workspace.js';
import { DefaultWorkflowCommand } from '../workflow-command/default-workflow-command.js';

const UNUSED_INPUT_STRING = 'unused input string';

export class ClaudeWorkflowCommandBuilder implements WorkflowCommandBuilder {
  constructor(
    private readonly tool: Tool,
    private readonly cliWrapper: CLIWrapper,
    private readonly workspace: Workspace
  ) {}

  async build(skillPath: string, passthroughArgs: string[]): Promise<WorkflowCommand> {
    const baseCommand = await this.tool.execute(skillPath, UNUSED_INPUT_STRING);
    const commandString =
      passthroughArgs.length > 0
        ? `${baseCommand} ${passthroughArgs.map((a) => this.shellEscape(a)).join(' ')}`
        : baseCommand;
    return new DefaultWorkflowCommand(commandString, this.cliWrapper, this.workspace.getRoot());
  }

  /** Shell-escape an argument by wrapping in single quotes. */
  private shellEscape(arg: string): string {
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }
}

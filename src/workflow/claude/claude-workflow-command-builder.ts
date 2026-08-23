/**
 * ClaudeWorkflowCommandBuilder — builds workflow commands using Claude skills.
 *
 * SRP Does: Resolve a skill path into a shell command string via a Tool
 * minted by the injected ToolFactory for the launched workflow's build mode
 * (per-workflow, AHQ-208 — the tool relays that mode across the skill hop),
 * append shell-escaped passthrough args, and return a DefaultWorkflowCommand.
 *
 * SRP Knows About: Skill resolution via ToolFactory/Tool, shell escaping of
 * args, and how to construct a DefaultWorkflowCommand.
 *
 * SRP Knows Nothing About: How the Tool resolves skills internally,
 * how the command will be executed, or I/O marshalling details.
 */
import type { BuildMode } from '../../interfaces/build-mode.js';
import type { CLIWrapper } from '../../interfaces/cli-wrapper.js';
import type { ToolFactory } from '../../interfaces/tool-factory.js';
import type { WorkflowCommandBuilder } from '../../interfaces/workflow-command-builder.js';
import type { WorkflowCommand } from '../../interfaces/workflow-command.js';
import type { Workspace } from '../../workflow-discovery/interfaces/workspace.js';
import { DefaultWorkflowCommand } from '../workflow-command/default-workflow-command.js';

const UNUSED_INPUT_STRING = 'unused input string';

export class ClaudeWorkflowCommandBuilder implements WorkflowCommandBuilder {
  constructor(
    private readonly toolFactory: ToolFactory,
    private readonly cliWrapper: CLIWrapper,
    private readonly workspace: Workspace
  ) {}

  async build(
    skillPath: string,
    buildMode: BuildMode,
    passthroughArgs: string[]
  ): Promise<WorkflowCommand> {
    const tool = this.toolFactory.createTool(buildMode);
    const baseCommand = await tool.execute(skillPath, UNUSED_INPUT_STRING);
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

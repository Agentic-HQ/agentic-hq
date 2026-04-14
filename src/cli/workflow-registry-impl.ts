import type { Command } from 'commander';

import type { WorkflowCommandBuilder } from '../interfaces/workflow-command-builder.js';
import type { AhqWorkflow } from '../workflow-discovery/interfaces/ahq-workflow.js';
import type { WorkflowRegistry } from '../workflow-discovery/interfaces/workflow-registry.js';

/**
 * WorkflowRegistryImpl — Concrete WorkflowRegistry that wraps a
 * Commander program and registers subcommands from discovered
 * workflows.
 *
 * SRP Does: Register a Commander subcommand for each workflow,
 * using its short name as the command name and wiring its action
 * to call builder.build() with the workflow's full Claude skill
 * command.
 *
 * SRP Knows About: The Commander API for creating subcommands,
 * the builder.build() call signature, and the AhqWorkflow contract.
 *
 * SRP Knows Nothing About: How workflows are discovered, how the
 * builder executes the command, or what the Claude CLI looks like.
 */
export class WorkflowRegistryImpl implements WorkflowRegistry {
  constructor(
    private readonly program: Command,
    private readonly builder: WorkflowCommandBuilder
  ) {}

  /** Register a Commander subcommand for the given workflow. */
  register(workflow: AhqWorkflow): void {
    const shortName = workflow.getShortName().toString();
    const description = workflow.getDescription().toString();
    const fullCommand = workflow.getFullClaudeSkillCommand().toString();

    this.program
      .command(shortName)
      .description(description)
      .passThroughOptions()
      .allowExcessArguments(true)
      .action(async (_options: unknown, cmd: Command) => {
        const command = await this.builder.build(fullCommand, cmd.args);
        await command.execute();
      });
  }
}

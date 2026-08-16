import type { Command } from 'commander';

import type { WorkflowCommandBuilder } from '../interfaces/workflow-command-builder.js';
import { ShortIdAlreadyRegisteredError } from '../workflow-discovery/errors/short-id-already-registered-error.js';
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
 * command. A workflow whose short name the program already has as a
 * subcommand is rejected with ShortIdAlreadyRegisteredError — the
 * first registration wins and is never replaced (AHQ-205); what to do
 * about the rejected one is the caller's decision.
 *
 * SRP Knows About: The Commander API for creating and enumerating
 * subcommands, the builder.build() call signature, and the
 * AhqWorkflow contract.
 *
 * SRP Knows Nothing About: How workflows are discovered, how the
 * builder executes the command, or what the Claude CLI looks like.
 */
export class WorkflowRegistryImpl implements WorkflowRegistry {
  constructor(
    private readonly program: Command,
    private readonly builder: WorkflowCommandBuilder
  ) {}

  /**
   * Register a Commander subcommand for the given workflow.
   *
   * @throws {ShortIdAlreadyRegisteredError} if the short name is already a subcommand — the
   * first registration wins (AHQ-205). Thrown by name here rather than left to Commander's
   * generic `cannot add command 'x' as already have command 'x'`, so the caller can recognise
   * and handle exactly this case. (Commander's own duplicate check also matches aliases;
   * nothing here uses aliases — add `cmd.aliases().includes(...)` to the check if that changes.)
   */
  register(workflow: AhqWorkflow): void {
    const shortName = workflow.getShortName();
    const shortNameString = shortName.toString();
    if (this.program.commands.some((cmd) => cmd.name() === shortNameString)) {
      throw new ShortIdAlreadyRegisteredError(shortName);
    }
    const description = workflow.getDescription().toString();
    const fullCommand = workflow.getFullClaudeSkillCommand().toString();

    this.program
      .command(shortNameString)
      .description(description)
      .passThroughOptions()
      .allowExcessArguments(true)
      .action(async (_options: unknown, cmd: Command) => {
        const command = await this.builder.build(fullCommand, cmd.args);
        await command.execute();
      });
  }
}

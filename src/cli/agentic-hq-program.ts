/**
 * CLI program factory — creates a configured Commander program with injected dependencies.
 *
 * Separated from agentic-hq-cli.ts (the entry point) so that:
 * 1. The program can be tested without triggering program.parse() side effects
 * 2. The WorkflowCommandBuilder and WorkflowSkillsRegistry can be injected for testing or customization
 *
 * The CLI is thin: it parses args, resolves the skill path, and delegates
 * to the injected WorkflowCommandBuilder for workflow command building and execution.
 */

import { Command } from 'commander';

import type { WorkflowCommandBuilder } from '../interfaces/workflow-command-builder.js';
import type { WorkflowSkillsRegistry } from '../workflow/workflow-skills/workflow-skills-registry.js';

/**
 * Create a configured Commander program that delegates workflow execution
 * to the provided WorkflowCommandBuilder, using skills from the provided registry.
 */
export function createProgram(
  builder: WorkflowCommandBuilder,
  registry: WorkflowSkillsRegistry
): Command {
  const program = new Command();

  // enablePositionalOptions is REQUIRED when subcommands use passThroughOptions — without it,
  // Commander throws "passThroughOptions cannot be used without turning on enablePositionalOptions".
  program
    .name('agentic-hq')
    .description('Orchestrate agentic software development with Claude Code')
    .enablePositionalOptions();

  // --- list subcommand ---
  program
    .command('list')
    .description('List available workflow skills')
    .action(() => {
      console.log(registry.formatSkillList());
    });

  // --- short alias subcommands (e.g., agentic-hq math) ---
  for (const skill of registry.getSkills()) {
    program
      .command(skill.shortName)
      .description(skill.description)
      .passThroughOptions()
      .allowExcessArguments(true)
      .action(async (_options: object, cmd: Command) => {
        const command = await builder.build(skill.fullPath, cmd.args);
        await command.execute();
      });
  }

  // --- run workflow by full skill path via --workflow-command-supplier ---
  program
    .option(
      '--workflow-command-supplier <skill>',
      'Skill slash command that returns the workflow command to run'
    )
    .passThroughOptions()
    // allowExcessArguments is REQUIRED despite passThroughOptions — without it, Commander
    // rejects the passthrough args (after --) as "too many arguments" since no positional
    // arguments are declared. Verified by e2e test failure when removed (AHQ-56 REFACTOR).
    .allowExcessArguments(true)
    .action(async (options: { workflowCommandSupplier?: string }, cmd: Command) => {
      if (!options.workflowCommandSupplier) {
        console.error(
          'Error: --workflow-command-supplier is required when not using a subcommand.'
        );
        console.error('Run "agentic-hq list" to see available workflows.');
        process.exit(1);
      }
      const command = await builder.build(options.workflowCommandSupplier, cmd.args);
      await command.execute();
    });

  return program;
}

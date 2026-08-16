/**
 * CLI program factory — creates a configured Commander program with injected dependencies.
 *
 * Separated from main.ts/app.ts (the entry point) so that:
 * 1. The program can be tested without triggering program.parse() side effects
 * 2. The WorkflowCommandBuilder and WorkflowSearchResults can be injected
 *    for testing or customization
 *
 * The CLI is thin: it parses args, resolves the skill path, and delegates
 * to the injected WorkflowCommandBuilder for workflow command building and execution.
 */

import { Command } from 'commander';

import type { WorkflowCommandBuilder } from '../interfaces/workflow-command-builder.js';
import type { WorkflowSearchResults } from '../workflow-discovery/interfaces/workflow-search-results.js';

import { WorkflowRegistryImpl } from './workflow-registry-impl.js';

const PROGRAM_NAME = 'agentic-hq';
const PROGRAM_DESCRIPTION = 'Orchestrate agentic software development with Claude Code';
/** Exported so ListingFormatter can pre-claim it when working out DISABLED entries (AHQ-205). */
export const LIST_SUBCOMMAND_NAME = 'list';
const LIST_SUBCOMMAND_DESCRIPTION = 'List available workflow skills';

/**
 * Create a configured Commander program that delegates workflow execution
 * to the provided WorkflowCommandBuilder, using dynamically discovered workflows.
 */
export function createProgram(
  builder: WorkflowCommandBuilder,
  searchResults: WorkflowSearchResults
): Command {
  const program = new Command();

  // enablePositionalOptions is REQUIRED when subcommands use passThroughOptions — without it,
  // Commander throws "passThroughOptions cannot be used without turning on enablePositionalOptions".
  program.name(PROGRAM_NAME).description(PROGRAM_DESCRIPTION).enablePositionalOptions();

  // --- list subcommand ---
  // Registered BEFORE the discovered workflows on purpose: WorkflowRegistryImpl keeps the first
  // registration of a short name, so this order is what reserves `list` against a workflow
  // that happens to use it as its shortId (AHQ-205).
  program
    .command(LIST_SUBCOMMAND_NAME)
    .description(LIST_SUBCOMMAND_DESCRIPTION)
    .action(() => {
      console.log(searchResults.getWorkflowsListingString());
    });

  // --- register dynamically discovered workflows as short alias subcommands ---
  searchResults.registerWorkflowsWith(new WorkflowRegistryImpl(program, builder));

  return program;
}

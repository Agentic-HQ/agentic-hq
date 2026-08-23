#!/usr/bin/env node
/**
 * CLI: Add Feature Detailed Example — a worked example of a detailed, opinionated
 * seven-stage add-feature workflow based on one creator's development process. It adds
 * a single small feature to an existing codebase via a collaborative 7-agent sequence.
 * (Most users should start with the simple `add-feature` workflow; this is the showcase
 * of how far an AHQ workflow can be customised.)
 *
 * Runs 7 commands sequentially:
 *   01 — Ticket Creator        (optionally splits the feature; establishes ticket-id)
 *   02 — Interrogator          (builds shared understanding of the feature)
 *   03 — Planner               (produces the tests-first Implementation Plan)
 *   04 — Executor              (executes the plan into working code)
 *   05 — Refactoring Planner   (plans the refactoring)
 *   06 — Refactoring Executor  (executes the approved refactors)
 *   07 — Validator             (final double-check that the feature is Done)
 *
 * Re-inject / broadcast pattern (same as create-workflow-cli.ts): the CLI parses the
 * passthrough params and builds Command 01's input string (which carries the AHQ
 * package root). Command 01 returns the combined variables string (now guaranteed to
 * carry ticket-id). That same string is captured as `allVariables` and re-injected
 * into Commands 02-07, whose own outputs are ignored.
 *
 * The framework's required --build-mode / --ahq-package-root options
 * (forwarded by the shared workflow runner) are consumed by
 * DefaultWorkflowRuntime — this file contains only
 * add-feature-detailed-example code.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-143
 * See: https://agentic-hq.atlassian.net/browse/AHQ-209
 */

import { Command } from 'commander';

import { DefaultWorkflowRuntime } from 'agentic-hq/tools/claude-code';

const DEFAULT_VERBOSITY = 'low';
const DEFAULT_SUGGEST_LARGE_REFACTOR = 'false';

const COMMAND_01_TICKET_CREATOR =
  '/agentic-hq-demos-plugin:add-feature-detailed-example:01-ticket-creator';
const COMMAND_02_INTERROGATOR =
  '/agentic-hq-demos-plugin:add-feature-detailed-example:02-interrogator';
const COMMAND_03_PLANNER =
  '/agentic-hq-demos-plugin:add-feature-detailed-example:03-planner';
const COMMAND_04_EXECUTOR =
  '/agentic-hq-demos-plugin:add-feature-detailed-example:04-executor';
const COMMAND_05_REFACTORING_PLANNER =
  '/agentic-hq-demos-plugin:add-feature-detailed-example:05-refactoring-planner';
const COMMAND_06_REFACTORING_EXECUTOR =
  '/agentic-hq-demos-plugin:add-feature-detailed-example:06-refactoring-executor';
const COMMAND_07_VALIDATOR =
  '/agentic-hq-demos-plugin:add-feature-detailed-example:07-validator';

const runtime = new DefaultWorkflowRuntime(process.argv);
const tool = runtime.getClaudeCodeTool();

const program = new Command();

program
  .name('add-feature-detailed-example-cli')
  .description(
    'Worked example of a detailed, opinionated seven-stage add-feature workflow based on one creator\'s development process'
  )
  .option('--verbosity <level>', 'How much each agent narrates (low | medium)', DEFAULT_VERBOSITY)
  .option(
    '--suggest-large-refactor <bool>',
    'Whether the Refactoring Planner should also produce a large structural refactor suggestion',
    DEFAULT_SUGGEST_LARGE_REFACTOR
  )
  .option('--ticket-id <id>', 'Existing ticket id; generated/obtained by Command 01 if omitted')
  .action(
    async (options: {
      verbosity: string;
      suggestLargeRefactor: string;
      ticketId?: string;
    }) => {
      // Build Command 01's input string from the AHQ package root + parsed passthrough params.
      // ticket-id is appended ONLY when supplied — Command 01 generates/obtains it otherwise.
      let command01Input =
        `The variables used in this workflow are: ahq-package-root=${runtime.getAhqPackageRoot().getPath()}` +
        ` and verbosity=${options.verbosity}` +
        ` and suggest-large-refactor=${options.suggestLargeRefactor}`;
      if (options.ticketId) {
        command01Input += ` and ticket-id=${options.ticketId}`;
      }

      // Step 1: Command 01 establishes ticket-id and returns the combined variables string.
      const allVariables = await tool.execute(COMMAND_01_TICKET_CREATOR, command01Input);

      // Steps 2-7: broadcast the same string to each later command (ignore their outputs).
      await tool.execute(COMMAND_02_INTERROGATOR, allVariables);
      await tool.execute(COMMAND_03_PLANNER, allVariables);
      await tool.execute(COMMAND_04_EXECUTOR, allVariables);
      await tool.execute(COMMAND_05_REFACTORING_PLANNER, allVariables);
      await tool.execute(COMMAND_06_REFACTORING_EXECUTOR, allVariables);
      await tool.execute(COMMAND_07_VALIDATOR, allVariables);
    }
  );

program.parse(runtime.getWorkflowArgs());

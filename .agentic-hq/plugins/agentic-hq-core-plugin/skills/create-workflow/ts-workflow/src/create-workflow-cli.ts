#!/usr/bin/env node
/**
 * CLI: Create Workflow — guides a human through creating a new Agentic HQ workflow.
 *
 * Runs 5 commands sequentially:
 *   01 — Explain workflows to user, get workflow details (plugin-id + workflow-id)
 *   02 — Confirm spec approved and build the workflow
 *   03 — Run checks on the workflow against the spec
 *   04 — Document the workflow
 *   05 — Get human to test the workflow
 *
 * The CLI passes the AHQ package root to Command 01.
 * It also accepts an optional `--using <short-id-of-workflow-to-copy>` passthrough param: when
 * supplied, the new workflow is built by copying and modifying an existing one, so the CLI weaves
 * short-id-of-workflow-to-copy into Command 01's input string. When it is omitted, Command 01's
 * input string is exactly as it has always been (the create-from-scratch path).
 * Command 01 returns a combined variables string (package-root + plugin-id + workflow-id).
 * Commands 02-05 all receive that same string as input.
 *
 * The framework's required --build-mode / --ahq-package-root options
 * (forwarded by the shared workflow runner) are consumed by
 * DefaultWorkflowRuntime — this file contains only create-workflow code.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-99
 * See: https://agentic-hq.atlassian.net/browse/AHQ-159 (the --using option)
 * See: https://agentic-hq.atlassian.net/browse/AHQ-209
 */

import { Command } from 'commander';

import { DefaultWorkflowRuntime } from 'agentic-hq/tools/claude-code';

const COMMAND_01_EXPLAIN_AND_GET_DETAILS =
  '/agentic-hq-core-plugin:create-workflow:01-explain-to-user-how-workflows-work-and-get-workflow-details';
const COMMAND_02_CONFIRM_AND_BUILD =
  '/agentic-hq-core-plugin:create-workflow:02-confirm-spec-approved-and-build';
const COMMAND_03_RUN_CHECKS =
  '/agentic-hq-core-plugin:create-workflow:03-run-checks-on-workflow';
const COMMAND_04_DOCUMENT =
  '/agentic-hq-core-plugin:create-workflow:04-document-workflow';
const COMMAND_05_HUMAN_TEST =
  '/agentic-hq-core-plugin:create-workflow:05-get-human-to-test-workflow';

const runtime = new DefaultWorkflowRuntime(process.argv);
const tool = runtime.getClaudeCodeTool();

const program = new Command();

program
  .name('create-workflow-cli')
  .description('Create a new Agentic HQ workflow')
  .option(
    '--using <short-id-of-workflow-to-copy>',
    'short-id of an existing workflow to base the new workflow on'
  )
  .action(async (options: { using?: string }) => {
    // Build Command 01's input string from the AHQ package root + the optional --using
    // passthrough param. When --using is supplied the new workflow is built by copying an
    // existing one, so the short-id-of-workflow-to-copy variable is woven in (and the phrasing
    // turns plural); when it is absent the input string is exactly as it has always been (the
    // create-from-scratch path).
    const ahqPackageRoot = runtime.getAhqPackageRoot().getPath();
    const command01Input = options.using
      ? `The variables used in this workflow creation workflow are: ahq-package-root=${ahqPackageRoot} and short-id-of-workflow-to-copy=${options.using}`
      : `The variable used in this workflow creation workflow is: ahq-package-root=${ahqPackageRoot}`;

    // Step 1: Pass the AHQ package root (+ optional short-id-of-workflow-to-copy) — returns all variables combined string
    const allVariables = await tool.execute(COMMAND_01_EXPLAIN_AND_GET_DETAILS, command01Input);

    // Steps 2-5: Pass the same combined string as input (don't read their output)
    await tool.execute(COMMAND_02_CONFIRM_AND_BUILD, allVariables);
    await tool.execute(COMMAND_03_RUN_CHECKS, allVariables);
    await tool.execute(COMMAND_04_DOCUMENT, allVariables);
    await tool.execute(COMMAND_05_HUMAN_TEST, allVariables);
  });

program.parse(runtime.getWorkflowArgs());

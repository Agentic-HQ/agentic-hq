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
 * The CLI reads AGENTIC_HQ_WORKSPACE_ROOT and passes it to Command 01.
 * Command 01 returns a combined variables string (workspace-root + plugin-id + workflow-id).
 * Commands 02-05 all receive that same string as input.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-99
 */

import { Command } from 'commander';

import { DefaultClaudeCodeTool } from 'agentic-hq/tools/claude-code';

const AGENTIC_HQ_WORKSPACE_ROOT_ENV_VARIABLE_NAME = 'AGENTIC_HQ_WORKSPACE_ROOT';
const ERROR_EXIT_CODE_VALUE = 1;

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

const program = new Command();

program
  .name('create-workflow-cli')
  .description('Create a new Agentic HQ workflow')
  .action(async () => {
    const agenticHqWorkspaceRoot = process.env[AGENTIC_HQ_WORKSPACE_ROOT_ENV_VARIABLE_NAME];
    if (!agenticHqWorkspaceRoot) {
      console.error(
        'Error: AGENTIC_HQ_WORKSPACE_ROOT environment variable is not set.'
      );
      process.exit(ERROR_EXIT_CODE_VALUE);
    }

    const tool = new DefaultClaudeCodeTool();

    // Step 1: Pass workspace root — returns all 3 variables combined string
    const allVariables = await tool.execute(
      COMMAND_01_EXPLAIN_AND_GET_DETAILS,
      `The variable used in this workflow creation workflow is: agentic-hq-workspace-root-dir=${agenticHqWorkspaceRoot}`
    );

    // Steps 2-5: Pass the same combined string as input (don't read their output)
    await tool.execute(COMMAND_02_CONFIRM_AND_BUILD, allVariables);
    await tool.execute(COMMAND_03_RUN_CHECKS, allVariables);
    await tool.execute(COMMAND_04_DOCUMENT, allVariables);
    await tool.execute(COMMAND_05_HUMAN_TEST, allVariables);
  });

program.parse();

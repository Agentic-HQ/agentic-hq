#!/usr/bin/env node
/**
 * string-reversal-copy-for-test-cli — E2E Test Copy of the String Reversal
 * workflow (named by the AHQ-208 program-name convention <skill-id>-cli)
 *
 * Copy of the string-reversal demo workflow for e2e testing of user workspace
 * workflow discovery and execution. This version references the test plugin's
 * reverse-a-string command instead of the demos plugin's.
 *
 * The framework's required --build-mode / --ahq-package-root options
 * (forwarded by the shared workflow runner) are consumed by
 * DefaultWorkflowRuntime — this file contains only workflow code.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-106
 * See: https://agentic-hq.atlassian.net/browse/AHQ-208
 */

import { Command } from 'commander';

import { DefaultWorkflowRuntime } from 'agentic-hq/tools/claude-code';

const REVERSE_STRING_COMMAND =
  '/agentic-hq-temp-e2e-test-plugin:string-reversal-copy-for-test:reverse-a-string';
const DEFAULT_STRING_TO_REVERSE = 'this is the default string to reverse';

const runtime = new DefaultWorkflowRuntime(process.argv);
const tool = runtime.getClaudeCodeTool();

const program = new Command();

program
  .name('string-reversal-copy-for-test-cli')
  .description('Reverse a string using Claude Code (e2e test copy)')
  .option('--string-to-reverse <string>', 'The string to reverse', DEFAULT_STRING_TO_REVERSE)
  .action(async (options: { stringToReverse: string }) => {
    const reversed = await tool.execute(REVERSE_STRING_COMMAND, options.stringToReverse);
    console.log(`Reversed string: ${reversed}`);
  });

program.parse(runtime.getWorkflowArgs());

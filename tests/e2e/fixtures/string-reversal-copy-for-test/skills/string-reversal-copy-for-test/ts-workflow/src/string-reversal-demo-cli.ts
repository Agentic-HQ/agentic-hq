#!/usr/bin/env node
/**
 * E2E Test Copy: String Reversal using Claude Code
 *
 * Copy of the string-reversal demo workflow for e2e testing of user workspace
 * workflow discovery and execution. This version references the test plugin's
 * reverse-a-string command instead of the demos plugin's.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-106
 */

import { Command } from 'commander';

import { DefaultClaudeCodeTool } from 'agentic-hq/tools/claude-code';

const REVERSE_STRING_COMMAND =
  '/agentic-hq-temp-e2e-test-plugin:string-reversal-copy-for-test:reverse-a-string';
const DEFAULT_STRING_TO_REVERSE = 'this is the default string to reverse';

const program = new Command();

program
  .name('string-reversal-copy-for-test')
  .description('Reverse a string using Claude Code (e2e test copy)')
  .option('--string-to-reverse <string>', 'The string to reverse', DEFAULT_STRING_TO_REVERSE)
  .action(async (options: { stringToReverse: string }) => {
    const tool = new DefaultClaudeCodeTool();
    const reversed = await tool.execute(REVERSE_STRING_COMMAND, options.stringToReverse);
    console.log(`Reversed string: ${reversed}`);
  });

program.parse();

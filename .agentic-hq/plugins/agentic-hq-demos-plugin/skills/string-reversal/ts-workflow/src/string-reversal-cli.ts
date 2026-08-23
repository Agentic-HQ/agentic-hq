#!/usr/bin/env node
/**
 * string-reversal-cli — String Reversal demo using Claude Code (named by the
 * AHQ-208 program-name convention <skill-id>-cli)
 *
 * Demonstrates Agentic HQ's ability to orchestrate Claude Code.
 * Accepts a string via --string-to-reverse and outputs the reversed string.
 *
 * This is the plugin-bundled version of the workflow CLI.
 *
 * The framework's required --build-mode / --ahq-package-root options
 * (forwarded by the shared workflow runner) are consumed by
 * DefaultWorkflowRuntime — this file contains only string-reversal code.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-56
 * See: https://agentic-hq.atlassian.net/browse/AHQ-208
 */

import { Command } from 'commander';

import { DefaultWorkflowRuntime } from 'agentic-hq/tools/claude-code';

const REVERSE_STRING_COMMAND = '/agentic-hq-demos-plugin:string-reversal:reverse-a-string';
const DEFAULT_STRING_TO_REVERSE = 'this is the default string to reverse';

const runtime = new DefaultWorkflowRuntime(process.argv);
const tool = runtime.getClaudeCodeTool();

const program = new Command();

program
  .name('string-reversal-cli')
  .description('Reverse a string using Claude Code')
  .option('--string-to-reverse <string>', 'The string to reverse', DEFAULT_STRING_TO_REVERSE)
  .action(async (options: { stringToReverse: string }) => {
    const reversed = await tool.execute(REVERSE_STRING_COMMAND, options.stringToReverse);
    console.log(`Reversed string: ${reversed}`);
  });

program.parse(runtime.getWorkflowArgs());

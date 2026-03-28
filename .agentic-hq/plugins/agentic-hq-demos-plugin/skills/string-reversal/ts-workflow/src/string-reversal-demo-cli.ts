#!/usr/bin/env node
/**
 * Demo CLI: String Reversal using Claude Code
 *
 * Demonstrates Agentic HQ's ability to orchestrate Claude Code.
 * Accepts a string via --string-to-reverse and outputs the reversed string.
 *
 * This is the plugin-bundled version of the workflow CLI.
 * Import uses the agentic-hq package (resolved via file: protocol for local dev).
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-56
 */

import { Command } from 'commander';

import { DefaultClaudeCodeTool } from 'agentic-hq/tools/claude-code';

const REVERSE_STRING_COMMAND = '/agentic-hq-demos-plugin:string-reversal:reverse-a-string';
const DEFAULT_STRING_TO_REVERSE = 'this is the default string to reverse';

const program = new Command();

program
  .name('string-reversal-demo-cli')
  .description('Reverse a string using Claude Code')
  .option('--string-to-reverse <string>', 'The string to reverse', DEFAULT_STRING_TO_REVERSE)
  .action(async (options: { stringToReverse: string; }) => {
    const tool = new DefaultClaudeCodeTool();
    const reversed = await tool.execute(REVERSE_STRING_COMMAND, options.stringToReverse);
    console.log(`Reversed string: ${reversed}`);
  });

program.parse();

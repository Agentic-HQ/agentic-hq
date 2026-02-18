#!/usr/bin/env node
/**
 * Demo CLI: String Reversal using Claude Code
 *
 * Demonstrates Agentic HQ's ability to orchestrate Claude Code.
 * Accepts a string via --string-to-reverse and outputs the reversed string.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-25
 */

import { Command } from 'commander';

import { ClaudeCodeTool } from '../../tools/claude-code/ClaudeCodeTool.js';

const REVERSE_STRING_COMMAND = '/agentic-hq-demos-plugin:string-reversal:reverse-a-string';

const program = new Command();

program
  .name('string-reversal-demo-cli')
  .description('Reverse a string using Claude Code')
  .requiredOption('--string-to-reverse <string>', 'The string to reverse')
  .action(async (options: { stringToReverse: string }) => {
    const tool = new ClaudeCodeTool();
    const reversed = await tool.execute(REVERSE_STRING_COMMAND, options.stringToReverse);
    console.log(`Reversed string: ${reversed}`);
  });

program.parse();

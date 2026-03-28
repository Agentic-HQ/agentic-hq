#!/usr/bin/env node
/**
 * Demo CLI: Math Workflow using Claude Code
 *
 * Demonstrates Agentic HQ's ability to chain multiple Claude Code sessions.
 * Takes an input number and runs it through 3 steps: x2, +3, /5
 *
 * This is the plugin-bundled version of the workflow CLI.
 * Import uses the agentic-hq package (resolved via file: protocol for local dev).
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-81
 */

import { Command } from 'commander';

import { DefaultClaudeCodeTool } from 'agentic-hq/tools/claude-code';

const TIMES_TWO_COMMAND = '/agentic-hq-demos-plugin:math-workflow:times-two';
const PLUS_THREE_COMMAND = '/agentic-hq-demos-plugin:math-workflow:plus-three';
const DIV_FIVE_COMMAND = '/agentic-hq-demos-plugin:math-workflow:div-five';
const DEFAULT_INPUT_NUMBER = '11';

const program = new Command();

program
  .name('math-workflow-demo-cli')
  .description('Run a 3-step math workflow using Claude Code')
  .option('--input-number <number>', 'The input number to process', DEFAULT_INPUT_NUMBER)
  .action(async (options: { inputNumber: string }) => {
    const tool = new DefaultClaudeCodeTool();

    // Step 1: Multiply by 2
    const step1Result = await tool.execute(TIMES_TWO_COMMAND, options.inputNumber);

    // Step 2: Add 3
    const step2Result = await tool.execute(PLUS_THREE_COMMAND, step1Result);

    // Step 3: Divide by 5
    const step3Result = await tool.execute(DIV_FIVE_COMMAND, step2Result);

    console.log(`Output number: ${step3Result}`);
  });

program.parse();

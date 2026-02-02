#!/usr/bin/env node
/**
 * Demo CLI: Math Workflow using Claude Code
 *
 * Demonstrates Agentic HQ's ability to chain multiple Claude Code sessions.
 * Takes an input number and runs it through 3 steps: ×2, +3, ÷5
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-10
 */

import { Command } from 'commander';

import { ClaudeCodeTool } from '../../tools/claude-code/ClaudeCodeTool.js';

const TIMES_TWO_COMMAND = '/agentic-hq-commands:used-in-demos:math-workflow:times-two';
const PLUS_THREE_COMMAND = '/agentic-hq-commands:used-in-demos:math-workflow:plus-three';
const DIV_FIVE_COMMAND = '/agentic-hq-commands:used-in-demos:math-workflow:div-five';

const program = new Command();

program
  .name('math-workflow-demo-cli')
  .description('Run a 3-step math workflow using Claude Code')
  .requiredOption('--input-number <number>', 'The input number to process')
  .action(async (options: { inputNumber: string }) => {
    const tool = new ClaudeCodeTool();

    // Step 1: Multiply by 2
    const step1Result = await tool.execute(TIMES_TWO_COMMAND, options.inputNumber);

    // Step 2: Add 3
    const step2Result = await tool.execute(PLUS_THREE_COMMAND, step1Result);

    // Step 3: Divide by 5
    const step3Result = await tool.execute(DIV_FIVE_COMMAND, step2Result);

    console.log(`Output number: ${step3Result}`);
  });

program.parse();

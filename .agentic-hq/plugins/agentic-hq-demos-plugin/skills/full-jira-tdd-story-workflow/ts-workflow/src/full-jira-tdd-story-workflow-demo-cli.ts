#!/usr/bin/env node
/**
 * Demo CLI: Full Jira TDD Story Workflow using Claude Code
 *
 * Runs the full interactive Jira TDD Story Workflow. Takes a Jira ID,
 * runs Claude Code custom commands: read Jira, then
 * loop over test types (RED, GREEN, REFACTOR-analysis, REFACTOR-execute),
 * then run VALIDATE once at the end.
 *
 * Unlike the quick workflow (AHQ-36), this CLI spawns interactive Claude
 * sessions via PTY - allowing full human interaction within each step.
 *
 * This is the plugin-bundled version of the workflow CLI.
 * Import uses the agentic-hq package (resolved via link: protocol for local dev).
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-43
 */

import { Command } from 'commander';

import { DefaultClaudeCodeTool } from 'agentic-hq/tools/claude-code';

const COMMAND_01_READ_JIRA =
  '/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:01-jira-read-and-question';
const COMMAND_02_RED =
  '/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:02-jira-write-failing-test';
const COMMAND_03_GREEN =
  '/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation';
const COMMAND_04A_REFACTOR_ANALYSIS =
  '/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis';
const COMMAND_04B_REFACTOR_EXECUTE =
  '/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04b-jira-refactor-execute';
const COMMAND_05_VALIDATE =
  '/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:05-jira-validate';

/** Builds the variables string that command files will parse to extract jira-id and optionally test-type */
function buildVariablesString(jiraId: string, testType?: string): string {
  let variablesString = `Your variables for use in this command are jira-id = ${jiraId}`;
  if (testType) {
    variablesString += ` and test-type = ${testType}`;
  }
  return variablesString;
}

const program = new Command();

program
  .name('full-jira-tdd-story-workflow-demo-cli')
  .description('Run the full interactive Jira TDD Story Workflow using Claude Code')
  .requiredOption('--jira-id <string>', 'The Jira ID to implement (e.g. AHQ-41)')
  .action(async (options: { jiraId: string }) => {
    const tool = new DefaultClaudeCodeTool();

    // Step 1: Read Jira, get comma-separated test types
    const testTypesString = await tool.execute(
      COMMAND_01_READ_JIRA,
      buildVariablesString(options.jiraId)
    );

    // Parse comma-separated test types (e.g. "unit, e2e" -> ["unit", "e2e"])
    const testTypes = testTypesString
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // Step 2-4: Loop over each test type: RED -> GREEN -> REFACTOR-analysis -> REFACTOR-execute
    for (const testType of testTypes) {
      await tool.execute(COMMAND_02_RED, buildVariablesString(options.jiraId, testType));

      await tool.execute(COMMAND_03_GREEN, buildVariablesString(options.jiraId, testType));

      await tool.execute(
        COMMAND_04A_REFACTOR_ANALYSIS,
        buildVariablesString(options.jiraId, testType)
      );

      await tool.execute(
        COMMAND_04B_REFACTOR_EXECUTE,
        buildVariablesString(options.jiraId, testType)
      );
    }

    // Step 5: VALIDATE once at the end (command 05 tells the human to commit/merge)
    await tool.execute(COMMAND_05_VALIDATE, buildVariablesString(options.jiraId));
  });

program.parse();

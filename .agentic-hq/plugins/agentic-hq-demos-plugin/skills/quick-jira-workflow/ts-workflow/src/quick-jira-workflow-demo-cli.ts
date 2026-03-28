#!/usr/bin/env node
/**
 * Demo CLI: Quick Jira Workflow using Claude Code
 *
 * Demonstrates Agentic HQ's ability to run a multi-step Jira workflow.
 * Takes a Jira ID, runs Claude Code custom commands:
 * read Jira, then loop over test types (RED, GREEN, REFACTOR),
 * then transition the Jira to Done.
 *
 * This is the plugin-bundled version of the workflow CLI.
 * Import uses the agentic-hq package (resolved via link: protocol for local dev).
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-82
 */

import { Command } from 'commander';

import { DefaultClaudeCodeTool } from 'agentic-hq/tools/claude-code';

const COMMAND_01_READ_JIRA =
  '/agentic-hq-demos-plugin:quick-jira-workflow:01-read-jira-and-plan-tests-and-implementation-understand';
const COMMAND_02_RED = '/agentic-hq-demos-plugin:quick-jira-workflow:02-RED-write-failing-test';
const COMMAND_03_GREEN =
  '/agentic-hq-demos-plugin:quick-jira-workflow:03-GREEN-minimal-implementation';
const COMMAND_04_REFACTOR = '/agentic-hq-demos-plugin:quick-jira-workflow:04-REFACTOR';
const COMMAND_05_TRANSITION_DONE =
  '/agentic-hq-demos-plugin:quick-jira-workflow:05-transition-jira-to-done';

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
  .name('quick-jira-workflow-demo-cli')
  .description('Run a multi-step Jira workflow using Claude Code')
  .requiredOption('--jira-id <string>', 'The Jira ID to implement (e.g. TEST-123)')
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

    // Step 2-4: Loop over each test type: RED -> GREEN -> REFACTOR
    for (const testType of testTypes) {
      await tool.execute(COMMAND_02_RED, buildVariablesString(options.jiraId, testType));

      await tool.execute(COMMAND_03_GREEN, buildVariablesString(options.jiraId, testType));

      await tool.execute(COMMAND_04_REFACTOR, buildVariablesString(options.jiraId, testType));
    }

    // Step 5: Transition Jira to Done
    await tool.execute(COMMAND_05_TRANSITION_DONE, buildVariablesString(options.jiraId));
  });

program.parse();

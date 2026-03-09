#!/usr/bin/env node
/**
 * Demo CLI: Full Jira TDD Story Workflow using Claude Code
 *
 * Runs the full interactive Jira TDD Story Workflow. Takes a Jira ID and
 * optional project root, runs Claude Code custom commands: read Jira, then
 * loop over test types (RED, GREEN, REFACTOR-analysis, REFACTOR-execute),
 * then run VALIDATE once at the end.
 *
 * Unlike the quick workflow (AHQ-36), this CLI spawns interactive Claude
 * sessions via PTY - allowing full human interaction within each step.
 *
 * Usage:
 *   # Explicit project root:
 *   pnpm demo:full-jira-tdd-story-workflow --jira-id=AHQ-41 --project-root=/path/to/project
 *
 *   # Omit --project-root to auto-detect git repo root
 *   # WARNING: This will modify your real project workspace!
 *   # (works from any subdirectory):
 *   pnpm demo:full-jira-tdd-story-workflow --jira-id=AHQ-41
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-41 (Full Jira TDD Story Workflow)
 */

import { Command } from 'commander';

import { AgenticHqConfig } from '../../config/agentic-hq-config.js';
import { ClaudeCodeTool } from '../../tools/claude-code/ClaudeCodeTool.js';

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

/** Builds the variables string that command files will parse to extract jira-id, project-root, and optionally test-type */
function buildVariablesString(jiraId: string, projectRoot: string, testType?: string): string {
  let variablesString = `Your variables for use in this command are jira-id = ${jiraId} and project-root = ${projectRoot}`;
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
  .option('--project-root <string>', 'The project root directory for file operations')
  .action(async (options: { jiraId: string; projectRoot?: string }) => {
    // When --project-root is omitted, detect the git repo root so the CLI
    // works from anywhere inside a repo (AHQ-40, AHQ-79).
    const config = new AgenticHqConfig();
    const projectRoot = options.projectRoot ?? config.getCurrentWorkspaceRoot();

    const tool = new ClaudeCodeTool();

    // Step 1: Read Jira, get comma-separated test types
    const testTypesString = await tool.execute(
      COMMAND_01_READ_JIRA,
      buildVariablesString(options.jiraId, projectRoot)
    );

    // Parse comma-separated test types (e.g. "unit, e2e" -> ["unit", "e2e"])
    const testTypes = testTypesString
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // Step 2-4: Loop over each test type: RED -> GREEN -> REFACTOR-analysis -> REFACTOR-execute
    for (const testType of testTypes) {
      await tool.execute(
        COMMAND_02_RED,
        buildVariablesString(options.jiraId, projectRoot, testType)
      );

      await tool.execute(
        COMMAND_03_GREEN,
        buildVariablesString(options.jiraId, projectRoot, testType)
      );

      await tool.execute(
        COMMAND_04A_REFACTOR_ANALYSIS,
        buildVariablesString(options.jiraId, projectRoot, testType)
      );

      await tool.execute(
        COMMAND_04B_REFACTOR_EXECUTE,
        buildVariablesString(options.jiraId, projectRoot, testType)
      );
    }

    // Step 5: VALIDATE once at the end (command 05 tells the human to commit/merge)
    await tool.execute(COMMAND_05_VALIDATE, buildVariablesString(options.jiraId, projectRoot));
  });

program.parse();

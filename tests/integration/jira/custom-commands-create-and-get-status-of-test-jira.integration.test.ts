/**
 * Integration Test: Create Test Jira and Get Its Status
 *
 * This test verifies that the two custom test helper commands work together:
 * 1. create-test-jira - creates a Jira in the TEST project, returns the Jira ID
 * 2. get-jira-status - queries a Jira's status, returns the status name
 *
 * The test creates a new Jira via create-test-jira, then immediately checks
 * its status via get-jira-status, expecting "Backlog" (the default status
 * for newly created Jiras).
 *
 * Uses REAL Claude Code with Jira MCP tools (not mocked).
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-38
 */

import { describe, it, expect } from 'vitest';

import { DefaultClaudeCodeTool } from '../../../src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.js';

const TEST_TIMEOUT_MS = 300_000; // 300s for real Claude Code + Jira API calls (sometimes slow)

const CREATE_TEST_JIRA_COMMAND =
  '/agentic-hq-commands:used-in-tests:jira-helper-commands:create-test-jira';
const GET_JIRA_STATUS_COMMAND =
  '/agentic-hq-commands:used-in-tests:jira-helper-commands:get-jira-status';
const CREATE_JIRA_INPUT =
  'Title: Integration Test Jira  Description: Auto-created by integration test - can be deleted.';
const JIRA_KEY_PATTERN = /^TEST-\d+$/;
const EXPECTED_NEW_JIRA_STATUS = 'Backlog';

describe('create-test-jira and get-jira-status custom commands', () => {
  it(
    'should create a test Jira and verify its status is Backlog',
    async () => {
      // Arrange
      const tool = new DefaultClaudeCodeTool();

      // Act - Step 1: Create a test Jira in the TEST project
      const testJiraId = await tool.execute(CREATE_TEST_JIRA_COMMAND, CREATE_JIRA_INPUT);

      // Assert - Verify we got a Jira ID back (e.g. "TEST-123")
      expect(testJiraId).toMatch(JIRA_KEY_PATTERN);

      // Act - Step 2: Get the status of the created Jira
      const testJiraStatus = await tool.execute(GET_JIRA_STATUS_COMMAND, testJiraId);

      // Assert - Verify status is Backlog (default for newly created Jiras)
      expect(testJiraStatus).toBe(EXPECTED_NEW_JIRA_STATUS);
    },
    TEST_TIMEOUT_MS
  );
});

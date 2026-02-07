# Plan: AHQ-38 Integration Test - RED Phase

## Goal
Write ONE failing integration test for AHQ-38 that verifies the `create-test-jira` and `get-jira-status` custom commands work together.

## Steps

### Step 0: Copy this approved plan
- Copy this plan to `docs/jira-docs/AHQ-38/workflow-files/integration-test-files/02-red-phase-failing-test-plan.md`

### Step 1: Create the test file
- **File**: `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts`
- Follow the exact pattern from `tests/integration/claude-code-tool/claude-executes-command-using-file-io.integration.test.ts`
- Test structure:
  ```typescript
  import { describe, it, expect } from 'vitest';
  import { ClaudeCodeTool } from '../../../src/tools/claude-code/ClaudeCodeTool';

  const TEST_TIMEOUT_MS = 60_000;

  const CREATE_TEST_JIRA_COMMAND = '/agentic-hq-commands:used-in-tests:jira-helper-commands:create-test-jira';
  const GET_JIRA_STATUS_COMMAND = '/agentic-hq-commands:used-in-tests:helper-commands:get-jira-status';

  describe('create-test-jira and get-jira-status custom commands', () => {
    it('should create a test Jira and verify its status is Backlog', async () => {
      const tool = new ClaudeCodeTool();

      // Step 1: Create a test Jira
      const createInput = 'Title: Integration Test Jira  Description: Auto-created by integration test - can be deleted.';
      const testJiraId = await tool.execute(CREATE_TEST_JIRA_COMMAND, createInput);

      // Verify we got a Jira ID back (e.g. "TEST-123")
      expect(testJiraId).toMatch(/^TEST-\d+$/);

      // Step 2: Get the status of the created Jira
      const testJiraStatus = await tool.execute(GET_JIRA_STATUS_COMMAND, testJiraId);

      // Step 3: Verify status is Backlog
      expect(testJiraStatus).toBe('Backlog');
    }, TEST_TIMEOUT_MS);
  });
  ```

### Step 2: Add pnpm script to package.json
- Add `"test:integration:create-test-jira-and-get-status"` script to `package.json`:
  ```
  "test:integration:create-test-jira-and-get-status": "vitest run --config vitest.integration.config.ts tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts"
  ```
- Place it in the integration test commands section (after existing integration test entries)

### Step 3: Run the test - expect failure (RED)
- Run: `pnpm test:integration:create-test-jira-and-get-status`
- **Expected failure**: The test will fail with a **timeout** because the custom commands don't exist yet:
  - `.claude/commands/agentic-hq-commands/used-in-tests/helper-commands/create-test-jira.md` - doesn't exist
  - `.claude/commands/agentic-hq-commands/used-in-tests/helper-commands/get-jira-status.md` - doesn't exist
- Note: This is NOT a compilation error (since `ClaudeCodeTool` itself exists and compiles fine). The failure is at runtime: Claude Code launches, reports "Unknown skill: agentic-hq-commands:used-in-tests:helper-commands:create-test-jira", never writes `command-output.json`, so `ClaudeCodeTool.execute()` never resolves and the test times out at 60s.
- **Actual failure**: `Error: Test timed out in 60000ms`

### Step 4: Run typecheck
- Run: `pnpm typecheck`
- Verify no TypeScript errors in the test file itself (the test imports `ClaudeCodeTool` which DOES exist, so typecheck should pass)

### Step 5: Complete remaining workflow steps
- Re-read the `/agentic-hq-commands:workflow:jira-story-workflow:02-jira-write-failing-test` command to complete:
  - **Step 8**: Create RED phase document at `docs/jira-docs/AHQ-38/workflow-files/integration-test-files/02-red-phase-failing-tests.md`
  - **Step 9**: Add comment to Jira via MCP
  - **Step 10**: Present summary to human

## Files to create/modify
- **CREATE**: `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts`
- **MODIFY**: `package.json` (add one script entry)

## Key patterns reused
- `ClaudeCodeTool` from `src/tools/claude-code/ClaudeCodeTool.ts` - same `execute(command, input)` API
- Integration test pattern from `tests/integration/claude-code-tool/claude-executes-command-using-file-io.integration.test.ts`
- Vitest integration config from `vitest.integration.config.ts` (already matches `tests/integration/**/*.integration.test.ts`)

## Verification
- `pnpm test:integration:create-test-jira-and-get-status` → should FAIL with timeout (RED phase - commands don't exist, Claude reports "Unknown skill", never writes output file)
- `pnpm typecheck` → should PASS (test file has valid TypeScript)
- `pnpm test` → existing unit tests should still pass (no changes to production code)

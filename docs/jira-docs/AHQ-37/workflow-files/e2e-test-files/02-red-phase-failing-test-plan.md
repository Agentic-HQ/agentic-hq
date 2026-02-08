# RED Phase Plan: AHQ-37 E2E Test

## Context

AHQ-37 requires a "simplest possible single step hello world Jira workflow demo CLI". The e2e test is the acceptance test that drives the entire implementation. This is the RED phase - we write a failing test that imports/references code that doesn't exist yet.

The test will: create a test Jira, run the demo CLI, and verify it produced the expected files and Jira status change.

## Step 0: Save This Plan

Copy this approved plan to `docs/jira-docs/AHQ-37/workflow-files/e2e-test-files/02-red-phase-failing-test-plan.md`.

## Step 1: Add Test pnpm Script to package.json

Add ONE script (test infrastructure only):
- `"test:e2e:demo-quick-jira-workflow": "vitest run --config vitest.e2e.config.ts tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts"`

This goes in the existing `// E2E TEST COMMANDS` section.

**NOT adding** `demo:quick-jira-workflow` - that's production code (GREEN phase work). The test will reference `pnpm demo:quick-jira-workflow` via `execSync` and it will fail because the script doesn't exist - this is the correct RED phase failure.

## Step 2: Write the E2E Test File

**File**: `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts`

The test follows the existing e2e pattern (see `demo-math-workflow-gives-expected-output-number.e2e.test.ts`) but is more complex because it involves Jira operations. It uses `ClaudeCodeTool` directly (like the integration test at `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts`) for the Jira helper commands, and `execSync` for the demo CLI.

**Test structure**:
```
describe('Quick Jira Workflow Demo CLI') {
  it('should implement a test Jira and produce expected files', async () => {
    // Arrange
    // - Create a timestamped+UUID temp project root under temp/test-files/test-project-roots/demo-quick-jira-workflow/
    // - Create a test Jira using ClaudeCodeTool with create-test-jira command
    //   Input: "Title: Simplest Possible Hello World CLI  Description: Write a hello-world.cli.ts in location \"src\" (relative to the project root) that prints \"Hello world\" - no tests, just do it."

    // Act
    // - Run: pnpm demo:quick-jira-workflow --jira-id={testJiraId} --project-root={testProjectRoot}
    //   via execSync with 1200s timeout

    // Assert
    // 1. {testProjectRoot}/src/hello-world.cli.ts exists
    // 2. Running: npx tsx {testProjectRoot}/src/hello-world.cli.ts prints "Hello world"
    // 3. {testProjectRoot}/docs/jira-docs/{testJiraId}/workflow-docs/01-read-jira-implement-and-mark-as-done.summary.md exists
    // 4. Jira status is "Done" (via ClaudeCodeTool with get-jira-status command)
  }, 1_200_000)
}
```

**Key details**:
- Timeout: 1,200,000ms (1200 seconds / 20 minutes)
- Test project root format: `temp/test-files/test-project-roots/demo-quick-jira-workflow/project-root_YYYY-MM-DD_HH-MM-SS_<UUID>`
- Uses `crypto.randomUUID()` for unique directory
- Imports `ClaudeCodeTool` from `../../../src/tools/claude-code/ClaudeCodeTool` (doesn't exist issue - but it DOES exist, so this import will work)
- The CLI script `demo:quick-jira-workflow` references `src/demo/cli/quick-jira-workflow-demo-cli.ts` which does NOT exist yet - this is where the RED phase failure comes from

**Why this test will fail (RED phase)**:
- `pnpm demo:quick-jira-workflow` script doesn't exist in package.json (GREEN phase will add it)
- Even if it did, `src/demo/cli/quick-jira-workflow-demo-cli.ts` doesn't exist
- The `execSync` call will throw an error
- This is the correct RED phase failure - the implementation doesn't exist yet

## Step 3: Run the Test

Run: `pnpm test:e2e:demo-quick-jira-workflow`

Expected failure: The test will fail because `pnpm demo:quick-jira-workflow` script doesn't exist in package.json. The `execSync` call will throw an error.

**Note on Jira creation**: The test uses `ClaudeCodeTool` for Jira creation which involves real Claude invocations. We should run the test and let it fail wherever it fails. If it fails at the Jira creation step (timeout), or at the CLI step (script not found), either way the RED phase failure is confirmed - the implementation doesn't exist.

## Step 4: Run TypeScript Type Checking

Run: `pnpm typecheck`

Verify the test file has no TypeScript errors (imports should be valid since `ClaudeCodeTool` exists, `vitest` exists, `node:fs`, `node:crypto`, `node:child_process` exist).

## Step 5: Complete Remaining Command Steps (8-10)

Re-read the original `/jira-story-workflow:02-jira-write-failing-test` command and complete:
- **Step 8**: Create RED phase document at `docs/jira-docs/AHQ-37/workflow-files/e2e-test-files/02-red-phase-failing-tests.md`
- **Step 9**: Add Jira comment to AHQ-37 via Jira MCP
- **Step 10**: Present results to human

## Verification

- Run `pnpm test:e2e:demo-quick-jira-workflow` - test should fail
- Run `pnpm typecheck` - test file should have no type errors
- The failure reason should be that `pnpm demo:quick-jira-workflow` script/CLI doesn't exist

## Files to Create/Modify

- **Create**: `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts` - the e2e test
- **Modify**: `package.json` - add one test script only (`test:e2e:demo-quick-jira-workflow`)
- **Create**: `docs/jira-docs/AHQ-37/workflow-files/e2e-test-files/02-red-phase-failing-test-plan.md` - this plan
- **Create**: `docs/jira-docs/AHQ-37/workflow-files/e2e-test-files/02-red-phase-failing-tests.md` - RED phase summary

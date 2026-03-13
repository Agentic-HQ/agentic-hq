# RED Phase Plan: AHQ-82 E2E Test

## Context

AHQ-82 converts the quick-jira-workflow from running via `tsx` inside the repo to running via the globally-linked `agentic-hq` CLI from any workspace. This RED phase writes ONE failing e2e test that drives the cross-workspace implementation.

The test follows the established cross-workspace pattern (math-workflow, string-reversal) but adds: MCP Atlassian permissions, Jira creation/status verification, workflow output file assertions, and a longer timeout for the 5-command orchestration.

## Plan Steps

### Step 0: Copy this approved plan to `{red-phase-plan-file-copy}`
Copy this plan to `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/jira-docs/AHQ-82/workflow-files/e2e-test-files/02-red-phase-failing-test-plan-copy.md`

### Step 1: Create the e2e test directory
Create `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/jira-docs/AHQ-82/workflow-files/e2e-test-files/` if it doesn't exist.

### Step 2: Write the ONE e2e test file
**File**: `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts`

Based on the cross-workspace math-workflow pattern (`cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts`) combined with the assertion logic from the old test (`quick-jira-workflow-produces-expected-files.e2e.test.ts`), but adapted for:

- **No `--project-root`**: Per the Jira's "Simplification" section, the temp workspace IS the project root. The `agentic-hq` command omits `--project-root`.
- **MCP Atlassian permissions**: `CLAUDE_SETTINGS_PERMISSIONS` includes `Write` + all MCP Atlassian tools listed in the Jira.
- **Jira creation**: Uses `ClaudeCodeTool.execute(CREATE_TEST_JIRA_COMMAND, ...)` to create a test Jira before running the workflow.
- **Workflow output file assertions**: Checks `docs/jira-docs/{testJiraId}/workflow-docs/` for all expected files (01 summaries + unit/e2e RED/GREEN/REFACTOR summaries).
- **Implementation file assertions**: Checks `src/temp-test-hello-world.ts` and `src/temp-test-hello-world.cli.ts`.
- **Jira status assertion**: Verifies Jira status is `Done` after workflow.
- **Timeout**: 1,500,000ms (25 minutes).

Key differences from math-workflow test:
- Test is `async` (for ClaudeCodeTool calls)
- Uses `--workflow-command-supplier=/agentic-hq-demos-plugin:quick-jira-workflow` (no `--project-root`)
- Passes `-- --jira-id={testJiraId}` only
- Extended CLAUDE_SETTINGS_PERMISSIONS with MCP Atlassian tools
- File assertions for workflow docs + implementation files
- Jira status check at end

### Step 3: Add pnpm script to package.json
Add `test:e2e:cross-workspace-quick-jira-workflow` script pointing to the new test file with `vitest run --config vitest.e2e.config.ts`.

### Step 4: Run the test (expect failure)
Run: `pnpm test:e2e:cross-workspace-quick-jira-workflow`

Expected failure: The test will fail because the `quick-jira-workflow` skill directory doesn't exist yet (no `SKILL.md`, no `ts-workflow/`). The `agentic-hq` CLI won't find the workflow command supplier, causing the test to error. This is a valid RED phase failure.

### Step 5: Run `pnpm typecheck` to verify test TypeScript correctness
Expected: No type errors in the test file itself.

### Step 6: Create RED phase document
Write `docs/jira-docs/AHQ-82/workflow-files/e2e-test-files/02-red-phase-failing-tests.md`

### Step 7: Add Jira comment
Comment on AHQ-82 about RED phase completion.

### Step 8: Present results to human

### Step 9: Write command output JSON

### Step 10: Self-terminate

### Final step: Recheck that all commands have been executed in the 02-jira-write-failing-test.md command

## Key Files
- **New test**: `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts`
- **Pattern source**: `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts`
- **Old test (assertion reference)**: `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts`
- **Helper**: `tests/e2e/helpers/cli-test-helper-functions.ts`
- **Package scripts**: `package.json`

## Verification
- Test file compiles (`pnpm typecheck`)
- Test runs and fails for the RIGHT reason (missing skill/ts-workflow, not a test bug)
- No production code created (RED phase only)

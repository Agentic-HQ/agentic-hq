# RED Phase Plan: AHQ-81 E2E Test

## Context

AHQ-81 requires converting the math workflow to the cross-workspace pattern established in AHQ-56/AHQ-79. This RED phase writes ONE failing e2e test that drives all the implementation work (skill, ts-workflow, package.json scripts, old file deletions).

The test follows the **exact pattern** of `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` but adapted for math workflow specifics (3-step chain, `--input-number`, longer timeout).

## Plan Steps

### Step 0: Copy this approved plan to the workflow directory
Copy this plan to `docs/jira-docs/AHQ-81/workflow-files/e2e-test-files/02-red-phase-failing-test-plan-copy.md`

### Step 1: Write the e2e test file
**File**: `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts`

Following the cross-workspace string-reversal pattern exactly:
- Import `runCliAndLogOutput` from `../helpers/cli-test-helper-functions.js`
- Constants: `TEST_INPUT_NUMBER = 11`, `EXPECTED_OUTPUT_NUMBER = 5`, `TEST_TIMEOUT_MS = 240_000` (3 Claude calls @ ~30s each + install overhead + buffer per human request)
- Setup: Run `install-dev-agentic-hq.sh`, create temp workspace, git init, create `.claude/settings.local.json`
- Run: `agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:math-workflow -- --input-number=11`
- Assert: Output contains `Output number: 5`
- Assert: `.agentic-hq/temp/command-input-output-files/` exists with expected files

**Key differences from string-reversal:**
- `--workflow-command-supplier=/agentic-hq-demos-plugin:math-workflow` (not `:string-reversal`)
- `--input-number=11` (not `--string-to-reverse=...`)
- Expected output: `Output number: 5` (not reversed string)
- Timeout: 240s (3 Claude invocations vs 1, plus buffer per human request)
- Log file label: `cross-workspace-math-workflow`

### Step 2: Add package.json test script
Add `test:e2e:cross-workspace-demo-math-workflow` script pointing to the new test file.

**Do NOT delete** the old `demo:math-workflow` or `test:e2e:demo-math-workflow` scripts yet — that's GREEN phase work (along with creating the skill, ts-workflow, etc.).

### Step 3: Run the test (expect failure)
Run: `pnpm test:e2e:cross-workspace-demo-math-workflow`

**Expected failure**: The test will fail because:
- The math-workflow skill (`/agentic-hq-demos-plugin:math-workflow`) doesn't exist yet
- The `agentic-hq` CLI will fail to find the skill, causing the command to fail
- `runCliAndLogOutput` will throw with the CLI error

This is a valid RED phase failure — the test correctly detects missing implementation.

### Step 4: Run `pnpm typecheck` to verify no TypeScript errors in test file

### Step 5: Create RED phase summary document
Write `docs/jira-docs/AHQ-81/workflow-files/e2e-test-files/02-red-phase-failing-tests.md`

### Step 6: Add comment to Jira AHQ-81

### Step 7: Present results to human

### Step 8: Write command-output.json

### Step 9: Recheck all steps in the 02-jira-write-failing-test command have been executed

### Step 10: Self-terminate

## Files to Create
- `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` — the ONE e2e test
- `docs/jira-docs/AHQ-81/workflow-files/e2e-test-files/02-red-phase-failing-test-plan-copy.md` — plan copy
- `docs/jira-docs/AHQ-81/workflow-files/e2e-test-files/02-red-phase-failing-tests.md` — RED phase summary

## Files to Modify
- `package.json` — add `test:e2e:cross-workspace-demo-math-workflow` script

## Verification
- `pnpm test:e2e:cross-workspace-demo-math-workflow` — must FAIL (skill doesn't exist)
- `pnpm typecheck` — must PASS (test file is valid TypeScript)
- Existing tests must not be affected

# RED Phase Plan: AHQ-72 Unit Test

## Context
AHQ-72 adds `/tmp` log file output to all e2e tests. The core deliverable is a shared helper `runCliAndLogOutput()` at `tests/e2e/helpers/run-cli-and-log-output.ts`. We need a unit test for this helper as the RED phase of TDD.

## Step 0: Copy this approved plan to `docs/jira-docs/AHQ-72/workflow-files/unit-test-files/02-red-phase-failing-test-plan-copy.md`

## Step 1: Create the unit test file

**File**: `tests/unit/e2e-helpers/run-cli-and-log-output.unit.test.ts`

Why this path? The unit test config (`vitest.unit.config.ts`) only includes `tests/unit/**/*.unit.test.ts`. Placing it under `tests/unit/e2e-helpers/` keeps it in the unit test suite while clearly indicating it tests an e2e helper.

**Test content**: One test that:
- Imports `runCliAndLogOutput` from `../../../tests/e2e/helpers/run-cli-and-log-output.ts` (does NOT exist yet)
- Calls `runCliAndLogOutput("echo 'here is some test text'", "e2e-unit-test")`
- Asserts the log file exists at `/tmp/e2e-unit-test.log`
- Asserts the returned string contains "here is some test text"

This matches the AI summary's specified unit test exactly.

## Step 2: Run the test using `pnpm test`

Expect failure: "Cannot find module" because `tests/e2e/helpers/run-cli-and-log-output.ts` doesn't exist.

## Step 3: Run `pnpm typecheck` to verify no test file syntax errors

TypeScript errors for the non-existent import are expected (valid RED phase failure). No syntax errors in the test file itself should exist.

## Step 4: Create RED phase document at `docs/jira-docs/AHQ-72/workflow-files/unit-test-files/02-red-phase-failing-tests.md`

## Step 5: Add comment to Jira AHQ-72

## Step 6: Write command output file and self-terminate

## Recheck
Final step: Recheck that all commands have been executed in the 02-jira-write-failing-test command (Steps 8-12).

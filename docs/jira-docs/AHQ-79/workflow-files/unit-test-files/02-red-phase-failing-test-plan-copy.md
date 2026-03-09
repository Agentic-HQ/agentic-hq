# Plan: RED Phase — Unit Tests for AgenticHqConfig (AHQ-79)

## Context

AHQ-79 requires an `AgenticHqConfig` class that solves the "three roots problem" — distinguishing between the agentic-hq workspace root, the user's current workspace root, and derived paths. The unit tests drive the implementation of this class, which doesn't exist yet.

Per the Jira: all unit tests for AgenticHqConfig are written in **one TDD cycle** (not separate cycles per test).

## Steps

### Step 0: Copy this approved plan to workflow directory
Copy this plan to: `docs/jira-docs/AHQ-79/workflow-files/unit-test-files/02-red-phase-failing-test-plan-copy.md`

### Step 1: Create the unit test file

**File**: `tests/unit/config/agentic-hq-config.unit.test.ts`

Write ONE test file containing all 6 unit tests specified in the AI summary. The test imports from `../../../src/config/agentic-hq-config.js` which doesn't exist yet — causing the expected RED phase failure.

**Tests** (matching the Jira's acceptance criteria + the AI summary's expanded set):
1. `getAgenticHqWorkspaceRoot()` returns env var when `AGENTIC_HQ_WORKSPACE_ROOT` is set
2. `getAgenticHqWorkspaceRoot()` falls back to `git rev-parse` when env var is not set
3. `getAgenticHqPluginsDir()` returns workspace root + `/.agentic-hq/plugins`
4. `getCurrentWorkspaceRoot()` returns git root of current working directory
5. `getAgenticHqTempDir()` returns current workspace root + `/.agentic-hq/temp`
6. `getProjectWorkingDir()` returns current workspace root

**Conventions** (matching existing tests):
- Import `describe, it, expect, afterEach` from `vitest`
- `.js` extension on imports (ESM)
- Arrange-Act-Assert pattern
- Use `process.env` manipulation with cleanup in `afterEach`
- Use `execSync('git rev-parse --show-toplevel')` for expected values in fallback tests

### Step 2: Run the test using AC command `pnpm test:unit`
- Expect failure: "Cannot find module" for `../../../src/config/agentic-hq-config.js`
- This is a VALID RED phase failure (module doesn't exist yet)
- No new scripts needed — `pnpm test:unit` already runs `vitest run --config vitest.unit.config.ts` which includes `tests/unit/**/*.unit.test.ts`

### Step 3: Run `pnpm typecheck` to verify test file TypeScript correctness
- Expected: TypeScript error for the non-existent module import (valid RED phase)
- No other TypeScript errors in the test file itself

### Step 4: Create RED phase summary document
Write `docs/jira-docs/AHQ-79/workflow-files/unit-test-files/02-red-phase-failing-tests.md` with test details and failure output.

### Step 5: Add Jira comment
Add comment to AHQ-79 noting RED phase completion for unit tests.

### Step 6: Present to human and write output file

### Step 7: Recheck that all steps from the 02-jira-write-failing-test command have been executed
Review each Step in the command to ensure nothing was missed.

### Step 8: Self-terminate

## Files to create
- `tests/unit/config/agentic-hq-config.unit.test.ts` (the test)
- `docs/jira-docs/AHQ-79/workflow-files/unit-test-files/02-red-phase-failing-test-plan-copy.md` (plan copy)
- `docs/jira-docs/AHQ-79/workflow-files/unit-test-files/02-red-phase-failing-tests.md` (RED phase doc)

## Files NOT created (GREEN phase work)
- `src/config/agentic-hq-config.ts` — the implementation (that's GREEN phase)

## Verification
- `pnpm test:unit` fails with "Cannot find module" for agentic-hq-config
- All other existing tests still pass
- Test file has no syntax/TypeScript errors of its own

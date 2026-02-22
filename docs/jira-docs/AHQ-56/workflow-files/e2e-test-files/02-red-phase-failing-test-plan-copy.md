# Plan: RED Phase - Write Failing E2E Test for AHQ-56

## Context

AHQ-56 is about creating an `agentic-hq` CLI that runs TypeScript workflow code bundled with a Claude Code Plugin skill. The unit test TDD cycle (RED -> GREEN -> REFACTOR -> VALIDATE) is complete. Now we write the E2E test (RED phase) that calls the real `agentic-hq` command and verifies end-to-end string reversal.

`agentic-hq` is already on the PATH (empty placeholder installed from npmjs.org), so the test will run but produce no useful output - a valid RED phase failure.

## Plan Steps

### Step 0: Copy this approved plan to `docs/jira-docs/AHQ-56/workflow-files/e2e-test-files/02-red-phase-failing-test-plan-copy.md`

### Step 1: Create the e2e-test-files directory
Create `docs/jira-docs/AHQ-56/workflow-files/e2e-test-files/`

### Step 2: Write the E2E test file
Create `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts`

Following the exact pattern of the existing `demo-string-reversal-cli-reverses-string.e2e.test.ts`:
- Import `execSync` from `node:child_process`
- `TEST_TIMEOUT_MS = 30_000` (30s per AC)
- Command: `agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal -- --string-to-reverse="this is a test string"`
- Assert output contains `"gnirts tset a si siht"`
- Uses `execSync` with `encoding: 'utf-8'`

### Step 3: Add pnpm script to package.json
Add `"test:e2e:agentic-hq-cli-string-reversal"` script pointing to the new test file (matching the AC command exactly: `pnpm test:e2e:agentic-hq-cli-string-reversal`).

### Step 4: Run the E2E test - expect failure
Run `pnpm test:e2e:agentic-hq-cli-string-reversal`. Expected: fails because the `agentic-hq` on PATH is the empty npmjs.org placeholder - output won't contain the reversed string.

### Step 5: Verify TypeScript compilation
Run `pnpm typecheck` to confirm test file has no TS errors (it only uses `execSync` and vitest - no imports of non-existent modules).

### Step 6: Create RED Phase Document
Write `docs/jira-docs/AHQ-56/workflow-files/e2e-test-files/02-red-phase-failing-tests.md`

### Step 7: Add comment to Jira AHQ-56

### Step 8: Present to Human

### Step 9: Write command-output.json

### Step 10: Recheck all steps from the 02-jira-write-failing-test command have been executed

### Step 11: Self-terminate via `/agentic-hq-core-plugin:self-termination`

## Key Files
- **New test**: `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts`
- **Modify**: `package.json` (add 1 script)
- **Pattern reference**: `tests/e2e/demo/demo-string-reversal-cli-reverses-string.e2e.test.ts`
- **Vitest config (no changes)**: `vitest.e2e.config.ts`

## Verification
- `pnpm test:e2e:agentic-hq-cli-string-reversal` should FAIL (RED phase)
- `pnpm typecheck` should pass (no TS errors in test file)

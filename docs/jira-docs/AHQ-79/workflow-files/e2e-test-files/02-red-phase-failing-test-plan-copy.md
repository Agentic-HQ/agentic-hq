# Plan: RED Phase - E2E Test for AHQ-79 (Cross-Workspace String Reversal)

## Context

AHQ-79 requires proving that the `agentic-hq` CLI works from a **separate workspace** (not just from within the repo). The unit tests for `AgenticHqConfig` are already complete (RED → GREEN → REFACTOR → VALIDATE done). Now we need the e2e test.

This is the RED phase — we write the failing test only. The test will fail because the implementation doesn't exist yet (`install-dev-agentic-hq.sh` doesn't exist, `bin/agentic-hq.cjs` doesn't set the env var, etc.).

## Step 0: Copy Plan

Copy this approved plan to `docs/jira-docs/AHQ-79/workflow-files/e2e-test-files/02-red-phase-failing-test-plan-copy.md`.

## Step 1: Create e2e-test-files directory

Create `docs/jira-docs/AHQ-79/workflow-files/e2e-test-files/` if it doesn't exist.

## Step 2: Write the E2E test file

Create: `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts`

The test will follow the existing pattern from `agentic-hq-cli-string-reversal.e2e.test.ts` and:

1. Import `runCliAndLogOutput` from `../helpers/cli-test-helper-functions.js`
2. Import `execSync` from `node:child_process` (for setup: running install script, git init)
3. Import `fs` and `path` from `node:` (for directory creation and file assertions)
4. Import `randomUUID` from `node:crypto` (for unique temp workspace name)

**Test structure** (one `describe` block, one `it` block):

```
describe('Cross-Workspace String Reversal via globally-linked agentic-hq binary')
  it('should reverse a string from a separate workspace via the globally-linked binary', () => {
    // Arrange
    // 1. Run scripts/infra/install-dev-agentic-hq.sh from repo root
    // 2. Create temp workspace at /tmp/agentic-hq-test-workspaces/test-ws-{uuid}/
    // 3. Run git init in temp workspace

    // Act
    // Run: agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal -- --string-to-reverse="cross workspace test"
    // from the temp workspace (using runCliAndLogOutput with cwd override)

    // Assert
    // 1. Output contains "tset ecapskrow ssorc"
    // 2. .agentic-hq/temp/command-input-output-files/ exists in temp workspace
    // 3. Contains at least one io-files-* subdirectory
    // 4. That subdirectory contains command-input.json and command-output.json
  }, 90_000)
```

**Key design decision**: Add an optional `workingDirectory` parameter to `runCliAndLogOutput` in `tests/e2e/helpers/cli-test-helper-functions.ts`. When provided, it overrides `process.cwd()` as the `cwd` for `execSync`. Default remains `process.cwd()` so existing tests are unaffected.

**Files that don't exist yet (causing expected RED failure)**:
- `scripts/infra/install-dev-agentic-hq.sh` — the setup script that does `pnpm link --global`
- The env var line in `bin/agentic-hq.cjs` — without this, plugin paths break from another workspace

The test will fail because `scripts/infra/install-dev-agentic-hq.sh` doesn't exist, which is a valid RED phase failure.

## Step 2b: Add optional `workingDirectory` parameter to `runCliAndLogOutput`

Modify: `tests/e2e/helpers/cli-test-helper-functions.ts`

Change the function signature to add optional `workingDirectory` parameter. Change the `execSync` call's `cwd` from `process.cwd()` to `workingDirectory ?? process.cwd()`.

Backward-compatible — existing callers don't pass the 4th argument, so they continue using `process.cwd()`.

## Step 2c: Add unit test for `workingDirectory` parameter

Add a new `it` block in `tests/unit/e2e-helpers/run-cli-and-log-output.unit.test.ts` that tests the `workingDirectory` parameter using `echo` and `pwd` commands.

Mini TDD cycle: write unit test (RED), implement parameter (GREEN), verify both pass.

## Step 3: Add pnpm test script

Add `test:e2e:cross-workspace-string-reversal` to package.json.

## Step 4: Run the e2e test (expect failure)

Expected failure: `scripts/infra/install-dev-agentic-hq.sh` doesn't exist.

## Step 5: Verify TypeScript compilation

Run `pnpm typecheck` — test file should compile cleanly.

## Step 6: Create RED phase document

## Step 7: Add Jira comment

## Step 8: Present to human

## Step 9: Write command output

## Step 10: Self-terminate

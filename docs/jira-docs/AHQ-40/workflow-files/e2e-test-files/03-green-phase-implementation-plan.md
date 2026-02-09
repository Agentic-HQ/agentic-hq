# GREEN Phase Implementation Plan: AHQ-40 (e2e test)

## Context

AHQ-40 requires the quick Jira workflow demo CLI to default `--project-root` to the closest `.git` root directory when the argument is omitted. The RED phase test used a temp git dir approach, but after discussion we're switching to running in the **real workspace** with the test **disabled by default** via `test.runIf(process.env.RUN_DISABLED_MANUAL_E2E)`. This means the test must be modified (re-entering RED) before implementing GREEN.

## Jira Requirements (Numbered)

1. `--project-root` becomes optional on the CLI -> [Step 3: Change requiredOption to option]
2. When `--project-root` is omitted, use `git rev-parse --show-toplevel` to detect git root -> [Step 3: Add git root detection fallback]
3. E2E test passes within 1200s timeout -> [Verification]
4. pnpm script runs the test -> [Step 1b: Rename script to include "manual-disabled" and add RUN_DISABLED_MANUAL_E2E=true]
5. Kebab-case refactoring of CLI and command file -> N/A (REFACTOR phase, not GREEN)
6. Additional Refactoring Task -> N/A (REFACTOR phase, not GREEN)

## Step 0: Copy This Approved Plan

Copy this approved plan to `docs/jira-docs/AHQ-40/workflow-files/e2e-test-files/03-green-phase-implementation-plan.md` before proceeding with implementation.

## Step 1: Modify the Test (Re-RED) - Switch from Temp Git Dir to Real Workspace

**File**: `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts`

Changes:
1. Remove `import { test } from '../../shared/fixtures';`
2. Add `test` to the vitest import: `import { describe, expect, it, test } from 'vitest';`
3. Change `test(` to `test.runIf(process.env.RUN_DISABLED_MANUAL_E2E)(`
4. Change `async ({ tempGitDir })` to `async ()`
5. Add warning: `console.warn('WARNING: This test modifies your REAL workspace.');`
6. Change CLI invocation from absolute tsx path to `pnpm demo:quick-jira-workflow --jira-id=${testJiraId}` (no --project-root, runs from real project root)
7. Change all assertions from `tempGitDir` to `process.cwd()` (real project root)
8. Remove the "no manual cleanup needed" comment

**Note**: `tests/shared/fixtures.ts` still exists but is no longer imported by this file. Cleanup is for REFACTOR phase.

## Step 1b: Update pnpm Script in package.json

**File**: `package.json`

Changes:
1. Rename `test:e2e:demo-quick-jira-workflow:default-project-root-test` to `test:e2e:demo-quick-jira-workflow:manual-disabled:default-project-root-test`
2. Prefix the command with `RUN_DISABLED_MANUAL_E2E=true` so the test is automatically enabled when you explicitly choose to run this script

Before:
```json
"test:e2e:demo-quick-jira-workflow:default-project-root-test": "vitest run --config vitest.e2e.config.ts tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts -t 'should use git directory when project-root not provided'"
```

After:
```json
"test:e2e:demo-quick-jira-workflow:manual-disabled:default-project-root-test": "RUN_DISABLED_MANUAL_E2E=true vitest run --config vitest.e2e.config.ts tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts -t 'should use git directory when project-root not provided'"
```

This means:
- `pnpm test:e2e` (full suite) -> test is SKIPPED (env var not set)
- `pnpm test:e2e:demo-quick-jira-workflow:manual-disabled:default-project-root-test` -> test RUNS (env var baked in)

## Step 2: Verify Test Fails (Re-RED confirmation)

Run: `pnpm test:e2e:demo-quick-jira-workflow:manual-disabled:default-project-root-test`

Expected: FAIL with `required option '--project-root <string>' not specified` (same failure as before, just running in real workspace now)

Also verify: `pnpm test:e2e:demo-quick-jira-workflow` (full file, no env var) -> new test is SKIPPED, existing test runs

## Step 3: Modify CLI - Make `--project-root` Optional with Git Root Default

**File**: `src/demo/cli/quick-jira-workflow-demo-cli.ts`

Changes:
1. Add `import { execSync } from 'node:child_process';`
2. Change `.requiredOption('--project-root <string>', ...)` to `.option('--project-root <string>', ...)`
3. Change type annotation to `options: { jiraId: string; projectRoot?: string }`
4. In the action handler, resolve projectRoot with git root fallback:
   ```typescript
   const projectRoot = options.projectRoot ??
     execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
   ```
5. Use `projectRoot` (not `options.projectRoot`) in the variables string

## Step 4: Run the E2E Test (Expect GREEN)

Run: `pnpm test:e2e:demo-quick-jira-workflow:manual-disabled:default-project-root-test`

Expected: PASS

**Note**: This test will create files in the real workspace:
- `src/hello-world.cli.ts`
- `docs/jira-docs/TEST-XX/workflow-docs/01-read-jira-implement-and-mark-as-done.summary.md`

## Step 5: Skip Full E2E Suite

Per workflow instructions for non-unit test types: skip running full e2e suite to conserve credits.

## Step 6: Document and Update Jira

- Create GREEN phase summary at `docs/jira-docs/AHQ-40/workflow-files/e2e-test-files/03-green-phase-summary-of-what-was-implemented.md`
- Add comment to AHQ-40 Jira via MCP
- Present summary to user

## TODO: After Implementation

Come back and re-read the command file (`/agentic-hq-commands:workflow:jira-story-workflow:03-jira-minimal-implementation`) for testing and documenting instructions (Steps 7-10).

## Verification

1. `pnpm test:e2e:demo-quick-jira-workflow:manual-disabled:default-project-root-test` - should PASS (env var baked into script)
2. `pnpm test:e2e` (full suite) - new test SKIPPED (env var not set), other tests unaffected
3. Existing test unaffected (not run to save credits, but no changes to its code path)

## What Is NOT Being Done (GREEN phase boundaries)

- No kebab-case refactoring (that's REFACTOR phase)
- No changes to the command file `.claude/commands/.../01-read-jira-implement-and-mark-as-done.md`
- No cleanup of `tests/shared/fixtures.ts` (REFACTOR phase)
- No extra features, error handling, or gold-plating

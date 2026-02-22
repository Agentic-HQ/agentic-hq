# REFACTOR Complete: AHQ-56 (e2e test)

**Jira**: [AHQ-56](https://agentic-hq.atlassian.net/browse/AHQ-56)
**Test Type**: e2e
**Phase**: REFACTOR (Complete)
**Generated**: 2026-02-22

---

## Refactoring Summary

| Category | Count | Executed | Skipped | Failed |
|----------|-------|----------|---------|--------|
| Tier 1 (Auto) | 2 | 2 | 0 | 0 |
| Tier 2 (Agreed) | 5 | 4 | 1 | 0 |
| **Total** | 7 | 6 | 1 | 0 |

---

## Tier 1 Refactors Executed

| # | Type | Description | Result |
|---|------|-------------|--------|
| 1.1 | Remove dead code / Add comment | Tested removing `.allowExcessArguments(true)` — e2e test **failed** ("too many arguments"), proving it IS needed. Kept the call and added explanatory comment documenting why it's required despite `.passThroughOptions()`. | Success (comment added) |
| 1.2 | Remove deferred-to-refactor comment | The REFACTOR comment from `runCommandViaPty()` (lines 58-59) was automatically removed when the entire function was replaced by the shared PTY utility in Refactor 2.1. The `getProjectRoot()` REFACTOR comment in ClaudeCodeTool.ts was also removed as part of Refactor 2.2. | Success (removed with 2.1/2.2) |

---

## Agreed Tier 2 Refactors

| # | Source | Description | Decision | Result |
|---|--------|-------------|----------|--------|
| 2.1 | AI | Extract shared PTY runner utility to `src/utils/cli/pty-utils.ts` | EXECUTE | Success |
| 2.2 | AI | Extract shared `getProjectRoot()` to `src/utils/git/git-utils.ts` | EXECUTE | Success |
| 2.3 | AI | Update demo scripts — delete old CLI/test/scripts, create 2 new demo scripts, update README | EXECUTE (modified) | Success |
| 2.4 | AI | Remove global `npm link` dependency — change e2e test to use `node bin/agentic-hq.cjs` directly | EXECUTE | Success |
| H.1 | Human | Replace `shellEscape()` with array-based arg passing | SKIP | Not executed |

---

## Post-Refactor Test Status

**Command**: `pnpm validate` (typecheck + lint + format + unit tests)
**Result**: PASSING (3 unit tests)

**Command**: `pnpm vitest run --config vitest.e2e.config.ts tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts`
**Result**: PASSING (1 e2e test, 53.4s)

**New demo scripts manually verified**:
- `pnpm demo:agentic-hq-cli:string-reversal` — WORKING (output: "gnirts omed a si siht")
- `pnpm demo:plugin-direct:string-reversal` — WORKING (output: "gnirts omed a si siht")

---

## Code Changes Made

### Files Created:
- `src/utils/cli/pty-utils.ts` — Shared PTY runner utility (extracted from agentic-hq-cli.ts and ClaudeCodeTool.ts)
- `src/utils/git/git-utils.ts` — Shared `getProjectRoot()` utility (extracted from ClaudeCodeTool.ts, quick-jira-workflow-demo-cli.ts, full-jira-tdd-story-workflow-demo-cli.ts)

### Files Modified:
- `src/cli/agentic-hq-cli.ts` — Replaced inline PTY code with shared `runPtyProcess()`, added comment explaining why `.allowExcessArguments(true)` is needed
- `src/tools/claude-code/ClaudeCodeTool.ts` — Replaced inline PTY code with shared `runPtyProcess()`, replaced local `getProjectRoot()` with shared import, removed `node-pty` and `execSync` imports
- `src/demo/cli/quick-jira-workflow-demo-cli.ts` — Replaced local `getProjectRoot()` with shared import, removed `execSync` import
- `src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts` — Replaced local `getProjectRoot()` with shared import, removed `execSync` import
- `src/cli/command/workflow-command.ts` — Formatting only (prettier)
- `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts` — Changed command from `agentic-hq` (global PATH) to `node bin/agentic-hq.cjs` (self-contained)
- `tests/unit/cli/agentic-hq-cli-builds-workflow-command.unit.test.ts` — Import order fix (lint)
- `package.json` — Removed old `demo:string-reversal` and `test:e2e:demo-string-reversal` scripts, added `demo:agentic-hq-cli:string-reversal` and `demo:plugin-direct:string-reversal` with comments
- `README.md` — Updated Quick Start to reference new demo script names
- `eslint.config.mjs` — Added ignore for `.agentic-hq/plugins/**/ts-workflow/src/**` (separate tsconfig, tracked in new Jira)
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/04b-jira-refactor-execute.md` — Improved test guidance with concrete examples of failures from this refactor session

### Files Deleted:
- `src/demo/cli/string-reversal-demo-cli.ts` — Old standalone demo CLI from AHQ-25, superseded by plugin ts-workflow version
- `tests/e2e/demo/demo-string-reversal-cli-reverses-string.e2e.test.ts` — Old e2e test for deleted demo CLI

### Cleanup:
- Ran `npm unlink -g agentic-hq` to remove global npm link side effect from GREEN phase

---

## Lessons Learned (captured in 04b command updates)

1. **Always run the test that exercises the changed code path.** Unit tests are necessary but not sufficient. Removing `.allowExcessArguments(true)` passed unit tests but failed the e2e test — because unit tests don't invoke the CLI binary.

2. **Test newly created artifacts.** The initial `demo:plugin-direct:string-reversal` script failed immediately when run because pnpm's `--` separator was being passed through incorrectly. This was only caught by actually running the new script.

3. **Match the real system's command.** The first fix for the plugin-direct script used `npx tsx` directly instead of `pnpm demo:string-reversal` — which "worked" but wasn't running the same code path as the real system. Fixed to use `bash -c` wrapping to match exactly what the PTY executes.

---

## Ready for VALIDATE Phase

Refactoring is complete. Now verify all tests pass:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:05-jira-validate AHQ-56 e2e
```

# AI Summary: AHQ-79

**Jira**: [AHQ-79](https://agentic-hq.atlassian.net/browse/AHQ-79)
**Title**: agentic-hq CLI Runs String Reversal Workflow From A Separate Dev Workspace
**Status**: Transitioned to In Progress
**Generated**: 2026-03-04

---

## My Understanding of This Task

This Jira is about solving the "three roots problem" so that `agentic-hq` can be run from **any workspace** on a developer's machine, not just from within the agentic-hq repository. Currently, `getProjectRoot()` (which calls `git rev-parse --show-toplevel`) is used everywhere and returns the nearest git root — which works when running from within the agentic-hq repo, but breaks when running from a different workspace because plugin paths, temp file paths, and CWD for Claude all resolve to the wrong directory.

The fix involves five coordinated changes: (1) add one line to `bin/agentic-hq.cjs` to set `AGENTIC_HQ_WORKSPACE_ROOT` env var from `__dirname`, (2) create a new `AgenticHqConfig` class with explicit methods for each of the three roots (agentic-hq workspace, current user workspace, project working dir), (3) replace `getProjectRoot()` calls in `ClaudeCodeTool.ts` with the appropriate Config method, (4) same replacement in the two demo CLIs, and (5) create the `install-dev-agentic-hq.sh` setup script.

The scope is intentionally small and pragmatic. There's no Verdaccio, no marketplace, no npm publishing. The approach uses `pnpm link --global` to create a symlink so the `agentic-hq` command runs live source code. The Jira acknowledges this is "smelly" (mutates global pnpm state) but accepts the trade-off. There's also a "One Addition" to create a placeholder `install-prod-agentic-hq.sh` that's entirely commented out.

The Jira specifies two acceptance tests: (1) unit tests for `AgenticHqConfig` methods (all in one TDD cycle, per the Jira's note), and (2) an e2e test that runs the string reversal workflow from a temp workspace via the globally-linked binary. The existing e2e test must also still pass to prove backward compatibility.

## Research Findings

No external research was needed. The Jira is extremely well-specified, and the companion document `docs/jira-docs/AHQ-74/docs/02b-simpler-dev-only-pnpm-and-plugin-running-methods.md` is thorough and comprehensive. It covers the full architecture, the three-roots problem, the `AgenticHqConfig` design, the symlink chain, and the ts-workflow dependency resolution. Everything needed to implement this is already documented.

## Questions for Human (All Resolved)

### Question 1: Should `AgenticHqConfig` be a class instance or use static methods?
**RESOLVED**: Plain class with instance methods. Lightweight, no constructor parameters needed for now.

### Question 2: Should `getProjectRoot()` in `git-utils.ts` be removed or kept?
**RESOLVED**: Remove entirely. `AgenticHqConfig` replaces it. The file `git-utils.ts` will be deleted.

### Question 3: E2E test — should we verify `.agentic-hq/temp` contents in the temp workspace?
**RESOLVED**: Yes — assert `.agentic-hq/temp/command-input-output-files/` exists, contains at least one `io-files-*` subdirectory, and that subdirectory contains `command-input.json` and `command-output.json`.

### Question 4: Should the `math-workflow-demo-cli.ts` also be updated?
**RESOLVED**: Reviewed — `math-workflow-demo-cli.ts` does NOT import `getProjectRoot()`. It only uses `ClaudeCodeTool` (which handles root resolution internally). No changes needed for this file.

---

## Files I Reviewed

- `bin/agentic-hq.cjs` — The CJS entry point that bootstraps via `__dirname`. Currently 22 lines. Only change: add env var line before `execFileSync`.
- `src/utils/git/git-utils.ts` — Defines `getProjectRoot()` (one-liner wrapping `git rev-parse`). Will be replaced by `AgenticHqConfig`.
- `src/tools/claude-code/ClaudeCodeTool.ts` — Main tool class. Uses `getProjectRoot()` in 3 places: plugin paths (line 118-121), CWD (line 135-136), and temp I/O dir (line 148-149). All three need updating to use different Config methods.
- `src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts` — Uses `getProjectRoot()` at line 62 for fallback project root. Needs `config.getCurrentWorkspaceRoot()`.
- `src/demo/cli/quick-jira-workflow-demo-cli.ts` — Same pattern as above, line 55.
- `src/cli/agentic-hq-cli.ts` — The TypeScript CLI entry. Does NOT use `getProjectRoot()` directly (ClaudeCodeTool handles it internally). No changes needed here.
- `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts` — Existing e2e test using `node bin/agentic-hq.cjs` from repo root. Must still pass after changes.
- `tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts` — Existing unit test for ClaudeCodeTool. May need adjustment if constructor changes.
- `tests/e2e/helpers/cli-test-helper-functions.ts` — Shared e2e helper (`runCliAndLogOutput`). Will be reused by the new e2e test.
- `package.json` — Has `bin` entry, test scripts. Will need new test scripts added.
- `docs/jira-docs/AHQ-74/docs/02b-simpler-dev-only-pnpm-and-plugin-running-methods.md` — The essential reference document. Comprehensive design for AgenticHqConfig, the three-roots problem, and the complete architecture.

**Key findings:**
- `getProjectRoot()` is called in exactly 3 source files (excluding docs). The replacement is mechanical.
- `ClaudeCodeTool` uses `getProjectRoot()` for two conceptually different roots (agentic-hq workspace for plugins vs user workspace for CWD/temp) — confirming the three-roots problem.
- The existing e2e test uses `node bin/agentic-hq.cjs` directly (not the global binary), so it tests the within-repo path and should be unaffected by the changes.
- No `src/config/` directory exists yet — it needs to be created for `AgenticHqConfig`.
- No `scripts/infra/` directory exists yet — it needs to be created for the setup scripts (`install-dev-agentic-hq.sh` and `install-prod-agentic-hq.sh`).

## Test Types And Tests We Will Be Implementing

**Test types: `unit, e2e`** (in that order, each with full RED -> GREEN -> REFACTOR -> VALIDATE cycle)

### Unit Tests: `AgenticHqConfig`

Per the Jira's note, all unit tests for AgenticHqConfig will be written in one TDD cycle.

New file: `tests/unit/config/agentic-hq-config.unit.test.ts`

1. **`getAgenticHqWorkspaceRoot() returns env var value when AGENTIC_HQ_WORKSPACE_ROOT is set`**
   - Set `process.env.AGENTIC_HQ_WORKSPACE_ROOT = '/fake/agentic-hq'`
   - Assert `config.getAgenticHqWorkspaceRoot()` returns `'/fake/agentic-hq'`
   - Clean up env var in afterEach

2. **`getAgenticHqWorkspaceRoot() falls back to git rev-parse when env var is not set`**
   - Delete `process.env.AGENTIC_HQ_WORKSPACE_ROOT`
   - Assert `config.getAgenticHqWorkspaceRoot()` returns the actual git root (which during test runs is the agentic-hq repo root)
   - Verify it matches `execSync('git rev-parse --show-toplevel').trim()`

3. **`getAgenticHqPluginsDir() returns workspace root + /.agentic-hq/plugins`**
   - Set `process.env.AGENTIC_HQ_WORKSPACE_ROOT = '/fake/workspace'`
   - Assert `config.getAgenticHqPluginsDir()` returns `'/fake/workspace/.agentic-hq/plugins'`

4. **`getCurrentWorkspaceRoot() returns git root of current working directory`**
   - Assert `config.getCurrentWorkspaceRoot()` returns the actual git root
   - This tests the `git rev-parse --show-toplevel` call

5. **`getAgenticHqTempDir() returns current workspace root + /.agentic-hq/temp`**
   - Assert `config.getAgenticHqTempDir()` returns `getCurrentWorkspaceRoot() + '/.agentic-hq/temp'`

6. **`getProjectWorkingDir() returns current workspace root`**
   - Assert `config.getProjectWorkingDir()` equals `config.getCurrentWorkspaceRoot()`

### E2E Test: Cross-Workspace String Reversal

New file: `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts`
New script: `pnpm test:e2e:cross-workspace-string-reversal`

1. **`should reverse a string via the globally-linked agentic-hq binary from a separate workspace`**
   - Setup: Run `scripts/infra/install-dev-agentic-hq.sh` from repo root
   - Setup: Create temp workspace at `/tmp/agentic-hq-test-workspaces/test-ws-{uuid}/`
   - Setup: Run `git init` in temp workspace
   - Run: `agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal -- --string-to-reverse="cross workspace test"` from temp workspace
   - Assert: Output contains `"tset ecapskrow ssorc"`
   - Assert: `.agentic-hq/temp/command-input-output-files/` exists in temp workspace with at least one `io-files-*` subdirectory
   - Log message that temp workspace won't be cleaned (auto-cleaned by OS)
   - Timeout: 90 seconds

2. **Existing test still passes**: The existing `agentic-hq-cli-string-reversal.e2e.test.ts` must continue to pass (proving backward compatibility via `git rev-parse` fallback). This isn't a new test — just confirmation the existing one isn't broken.

## Ready for Next Step

All questions resolved, test types confirmed. This summary is complete.

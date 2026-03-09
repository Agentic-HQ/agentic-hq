# GREEN Phase Complete: AHQ-79 (e2e test)

**Jira**: [AHQ-79](https://agentic-hq.atlassian.net/browse/AHQ-79)
**Test Type**: e2e
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-03-04

---

## Implementation Created

**Files Created/Modified**:
- `scripts/infra/install-dev-agentic-hq.sh` - Dev setup script (pnpm install + pnpm link --global)
- `scripts/infra/install-prod-agentic-hq.sh` - Placeholder for future Verdaccio-based production install
- `bin/agentic-hq.cjs` - Added AGENTIC_HQ_WORKSPACE_ROOT env var line
- `src/tools/claude-code/ClaudeCodeTool.ts` - Replaced getProjectRoot() with AgenticHqConfig methods
- `src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts` - Replaced getProjectRoot() with AgenticHqConfig
- `src/demo/cli/quick-jira-workflow-demo-cli.ts` - Replaced getProjectRoot() with AgenticHqConfig
- `src/utils/git/git-utils.ts` - Deleted (replaced by AgenticHqConfig)
- `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` - Added prerequisite warnings, timeout catch, .claude/settings.local.json setup, PNPM_HOME PATH fix

**Test Command**: `pnpm test:e2e:cross-workspace-string-reversal`
**Test Result**: PASSING

---

## What Was Implemented

Solved the "three roots problem" so that the `agentic-hq` CLI works from any workspace on a developer's machine, not just from within the agentic-hq repository. The binary now sets `AGENTIC_HQ_WORKSPACE_ROOT` env var, and `ClaudeCodeTool` uses `AgenticHqConfig` to resolve plugin paths from the agentic-hq workspace while resolving CWD/temp paths from the user's workspace.

### Key implementation decisions:

1. **Install script handles PNPM_HOME setup**: The `install-dev-agentic-hq.sh` script detects if `PNPM_HOME` is not set and runs `pnpm setup` automatically, then extracts the configured path from the shell config. This is needed because `pnpm link --global` requires the global bin directory to exist.

2. **Smelly warnings everywhere**: Per human request, both the install script and the e2e test include prominent warnings about `pnpm link --global` mutating global state. The test also prints a prerequisite box at startup and a detailed timeout explanation if it fails.

3. **Test creates .claude/settings.local.json in temp workspace**: Without this, Claude shows a "Do you want to create command-output.json?" permission prompt and hangs. The minimal permission is `"Write"` (matching the README Quick Start guidance).

4. **Test adds PNPM_HOME to PATH**: After running the install script, the test ensures the pnpm global bin directory is on PATH for the current process so `agentic-hq` can be found.

5. **git-utils.ts deleted entirely**: `getProjectRoot()` is fully replaced by `AgenticHqConfig`. No remaining references in the codebase.

### Bugs found and fixed during GREEN:

1. **pnpm link --global failed: "Unable to find the global bin directory"** — Fixed by having `install-dev-agentic-hq.sh` run `pnpm setup` when `PNPM_HOME` is not set, then extracting and exporting the configured path.

2. **Test timed out: Claude trust prompt for temp workspace** — The test creates a new UUID directory each run, and Claude requires manual trust acceptance for each new workspace. Fixed by documenting this as a prerequisite and adding clear timeout error messages. Trust of the parent `/tmp/agentic-hq-test-workspaces` directory propagates to subdirectories.

3. **Test timed out: Claude Write permission prompt in temp workspace** — The temp workspace lacks the `.claude/settings.local.json` that the repo root has. Fixed by having the test create a minimal `settings.local.json` with `"Write"` permission in the temp workspace.

4. **agentic-hq binary not on PATH after pnpm link --global** — The install script sets `PNPM_HOME` and adds it to PATH within its subshell, but those env vars don't persist to the parent test process. Fixed by having the test also add `PNPM_HOME` to `process.env.PATH`.

## Files Created

- `scripts/infra/install-dev-agentic-hq.sh` - Dev setup script with smelly warnings
- `scripts/infra/install-prod-agentic-hq.sh` - Commented-out placeholder for future Verdaccio install

## Files Modified

- `bin/agentic-hq.cjs` - Added 1 line: `process.env.AGENTIC_HQ_WORKSPACE_ROOT = path.join(__dirname, '..');`
- `src/tools/claude-code/ClaudeCodeTool.ts` - Replaced 3x `getProjectRoot()` with `AgenticHqConfig` methods, removed unused constants, updated comments
- `src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts` - Replaced `getProjectRoot()` with `config.getCurrentWorkspaceRoot()`
- `src/demo/cli/quick-jira-workflow-demo-cli.ts` - Same as above
- `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` - Added prerequisite warnings, timeout catch, .claude settings setup, PNPM_HOME PATH fix

## Files Deleted

- `src/utils/git/git-utils.ts` - Replaced by `AgenticHqConfig`
- `src/utils/git/` - Empty directory removed

---

## Ready for REFACTOR Phase

The test is passing. This program should self terminate, and then (if you are running the automated workflow) the following command will be run automatically:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-79 e2e
```

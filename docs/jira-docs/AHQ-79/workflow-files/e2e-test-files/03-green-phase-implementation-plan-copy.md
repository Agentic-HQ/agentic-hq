# GREEN Phase Plan: AHQ-79 (e2e test) — Cross-Workspace String Reversal

## Context

The e2e test `cross-workspace-string-reversal.e2e.test.ts` was written in the RED phase and fails because:
1. `scripts/infra/install-dev-agentic-hq.sh` doesn't exist
2. `bin/agentic-hq.cjs` doesn't set `AGENTIC_HQ_WORKSPACE_ROOT` env var
3. `ClaudeCodeTool.ts` still uses `getProjectRoot()` for all three roots (plugins, CWD, temp) — the "three roots problem"
4. Demo CLIs still use `getProjectRoot()` instead of `AgenticHqConfig`

The `AgenticHqConfig` class already exists (created in unit test GREEN phase) at `src/config/agentic-hq-config.ts`.

---

## Jira Requirements (Numbered)

1. Add 1 line to `bin/agentic-hq.cjs` to set `AGENTIC_HQ_WORKSPACE_ROOT` env var → [Step 2]
2. `AgenticHqConfig` class exists with correct methods → Already done (unit GREEN phase)
3. Replace `getProjectRoot()` in `ClaudeCodeTool.ts` with appropriate Config methods → [Step 3]
4. Replace `getProjectRoot()` in demo CLIs → [Step 4]
5. Create `scripts/infra/install-dev-agentic-hq.sh` → [Step 1]
6. Create `scripts/infra/install-prod-agentic-hq.sh` (placeholder, commented-out) → [Step 5]
7. **AC2**: E2E test passes: `pnpm test:e2e:cross-workspace-string-reversal` → [Verification]
8. Existing e2e test still passes → [Verification]
9. `git-utils.ts` / `getProjectRoot()` to be removed → [Step 6]

---

## Step 0: Copy this approved plan to `docs/jira-docs/AHQ-79/workflow-files/e2e-test-files/03-green-phase-implementation-plan-copy.md`

## Step 1: Create `scripts/infra/install-dev-agentic-hq.sh`

**File**: `scripts/infra/install-dev-agentic-hq.sh` (new)

```bash
#!/bin/bash
# install-dev-agentic-hq.sh — Sets up agentic-hq CLI for dev mode
# Installs dependencies and creates a global symlink to live source code.
# See: https://agentic-hq.atlassian.net/browse/AHQ-79
#
# WARNING: This is smelly! pnpm link --global mutates global pnpm state on
# your entire machine — it rewrites what 'agentic-hq' points to in
# ~/.local/share/pnpm/global/ and ~/.pnpm/_bin/. This is a hidden side-effect
# that reaches outside the project. Running this script (or the e2e test that
# calls it) silently mutates global state on your laptop.
#
# Why we're doing it anyway: It's the simplest way to get cross-workspace
# execution working right now. The alternative (Verdaccio, marketplace, etc.)
# is far more complex for the same result. Pragmatism wins.
#
# When a better mechanism is found, refactor to remove the global state
# dependency. Until then, this is a conscious trade-off.
set -e

echo ""
echo "⚠️  This is smelly. Sorry."
echo "   pnpm link --global mutates global pnpm state on your machine."
echo "   It rewrites what 'agentic-hq' points to in ~/.local/share/pnpm/global/"
echo "   and ~/.pnpm/_bin/. This is a conscious trade-off for dev mode simplicity."
echo "   See: https://agentic-hq.atlassian.net/browse/AHQ-79 (Known Smell section)"
echo ""

cd "$(dirname "$0")/../.."
pnpm install
pnpm link --global
```

- `set -e` so it fails fast on any error
- `cd` to repo root (2 dirs up from `scripts/infra/`) so `pnpm` commands run in the right place
- Includes comment and runtime output explaining the "smelly" global state mutation
- Must be made executable (`chmod +x`)

## Step 2: Add env var to `bin/agentic-hq.cjs`

**File**: `bin/agentic-hq.cjs` (modify)

Add one line before the `try` block:

```javascript
process.env.AGENTIC_HQ_WORKSPACE_ROOT = path.join(__dirname, '..');
```

This tells `AgenticHqConfig.getAgenticHqWorkspaceRoot()` where agentic-hq lives, even when running from a different workspace.

## Step 3: Update `ClaudeCodeTool.ts` — Replace `getProjectRoot()` with Config methods

**File**: `src/tools/claude-code/ClaudeCodeTool.ts` (modify)

Three `getProjectRoot()` calls need replacement:

1. **Line 118 (plugin paths)**: `getProjectRoot()` → `config.getAgenticHqWorkspaceRoot()`
   - Plugin dirs live in the agentic-hq workspace, not the user's workspace

2. **Line 135 (CWD for Claude)**: `getProjectRoot()` → `config.getProjectWorkingDir()`
   - Claude should run in the user's workspace

3. **Line 149 (temp I/O dir)**: `getProjectRoot()` → Replace the manual path.join with `config.getAgenticHqTempDir()`
   - Temp files should go to the user's workspace

Changes needed:
- Remove `import { getProjectRoot }` from git-utils
- Import `AgenticHqConfig` from `../../config/agentic-hq-config.js`
- Create a config instance (either in constructor or as a class field)
- Replace the 3 call sites

Specifically for the temp I/O dir (line 148-154), currently:
```typescript
return path.join(
  getProjectRoot(),
  AGENTIC_HQ_WORKING_DIRECTORY,
  TEMP_DIRECTORY_NAME,
  COMMAND_IO_DIRECTORY_NAME,
  `${IO_FILES_PREFIX}${timestamp}_${uniqueId}`
);
```
Will become:
```typescript
return path.join(
  config.getAgenticHqTempDir(),
  COMMAND_IO_DIRECTORY_NAME,
  `${IO_FILES_PREFIX}${timestamp}_${uniqueId}`
);
```
Note: `config.getAgenticHqTempDir()` already returns `getCurrentWorkspaceRoot() + '/.agentic-hq/temp'`, so we no longer need `AGENTIC_HQ_WORKING_DIRECTORY` or `TEMP_DIRECTORY_NAME` constants.

For plugin paths (line 118-123), the `AGENTIC_HQ_CORE_PLUGIN_DIR` etc. constants already include `.agentic-hq/plugins/...` as subpaths. We just need `config.getAgenticHqWorkspaceRoot()` as the base instead of `getProjectRoot()`.

For CWD (line 135), replace `projectRoot` with `config.getProjectWorkingDir()`.

## Step 4: Update demo CLIs — Replace `getProjectRoot()` with Config

**File**: `src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts` (modify, line 62)
**File**: `src/demo/cli/quick-jira-workflow-demo-cli.ts` (modify, line 55)

Both files have the same pattern:
```typescript
const projectRoot = options.projectRoot ?? getProjectRoot();
```

Replace with:
```typescript
import { AgenticHqConfig } from '../../config/agentic-hq-config.js';
// ...
const config = new AgenticHqConfig();
const projectRoot = options.projectRoot ?? config.getCurrentWorkspaceRoot();
```

Remove the `import { getProjectRoot }` from git-utils in both files.

## Step 5: Create `scripts/infra/install-prod-agentic-hq.sh` (placeholder)

**File**: `scripts/infra/install-prod-agentic-hq.sh` (new)

Entirely commented-out placeholder per the Jira's "One Addition" section. Must be made executable.

## Step 6: Delete `src/utils/git/git-utils.ts`

Per the AI summary (Question 2 resolved): Remove entirely. `AgenticHqConfig` replaces it. Verify no remaining imports reference it first.

## Step 7: Remove unused constants from `ClaudeCodeTool.ts`

After replacing `getProjectRoot()` with Config methods, the following constants may become unused:
- `AGENTIC_HQ_WORKING_DIRECTORY` (`.agentic-hq`) — used in `getCommandIoDir()`, now replaced by `config.getAgenticHqTempDir()`
- `TEMP_DIRECTORY_NAME` (`temp`) — same

Remove if confirmed unused. Keep the comment block about project root detection (lines 57-64) or update it to reference `AgenticHqConfig`.

---

## Verification

1. Run: `pnpm test:e2e:cross-workspace-string-reversal` — must pass
2. Run: `pnpm test:e2e:agentic-hq-cli-string-reversal` — must still pass (backward compatibility)
3. Run: `pnpm test:unit` — all unit tests must still pass (ensure `ClaudeCodeTool` unit test still works)
4. No manual acceptance tests for this test type

---

## Step 8: Add smelly warning comment AND runtime output to the e2e test

**File**: `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` (modify)

Per human request (TDD override granted): Add both:
1. A **comment** near the `execSync(bash ${INSTALL_SCRIPT}, ...)` call (line 43-48) warning about the smelly global state mutation
2. A **`process.stdout.write()` warning** before the execSync call so the test output shows the smell warning when running

---

## TODO: After Step 8, re-read the command file for testing and documenting instructions (Steps 7-12)

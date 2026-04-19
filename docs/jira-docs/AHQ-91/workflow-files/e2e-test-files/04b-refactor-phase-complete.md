# REFACTOR Complete: AHQ-91 (e2e test)

**Jira**: [AHQ-91](https://agentic-hq.atlassian.net/browse/AHQ-91)
**Test Type**: e2e
**Phase**: REFACTOR (Complete)
**Generated**: 2026-04-19

---

## Refactoring Summary

| Category | Count | Executed | Skipped | Failed |
|----------|-------|----------|---------|--------|
| Tier 1 (Auto) | 11 | 11 | 0 | 0 |
| Tier 2 (Agreed) | 5 | 2 | 3 | 0 |
| **Total** | 16 | 13 | 3 | 0 |

---

## Tier 1 Refactors Executed

| # | Type | Description | Result |
|---|------|-------------|--------|
| 1.1 | Delete dead files | Deleted 3 legacy interface files (`git-workspace.ts`, `agentic-hq-installation.ts`, `user-project-workspace.ts`) | Success |
| 1.2 | Delete dead files | Deleted 4 legacy impl/error files (`default-git-workspace.ts`, `default-agentic-hq-installation.ts`, `default-user-project-workspace.ts`, `not-in-git-workspace-error.ts`) and the now-empty `src/workspace/` directory | Success |
| 1.3 | Delete dead tests | Deleted 3 legacy test files and the now-empty `tests/unit/workspace/` directory | Success |
| 1.4 | Remove dead re-exports | Removed 3 `export type` lines from `src/interfaces/index.ts` | Success |
| 1.5 | Migrate consumer | Migrated `CompositionRoot`: dropped `getGitWorkspace()` / `getAgenticHqInstallation()` / `getUserProjectWorkspace()`; injects `AhqWorkspaceImpl` + `CurrentUserWorkspaceImpl` directly | Success |
| 1.6 | Migrate consumer | Migrated `ClaudeCommandBuilder`: constructor now takes two `Workspace` params; swapped `getConfigDir()` → `getDotAgenticHqDir()` on both the AHQ and user workspaces | Success |
| 1.7 | Migrate consumer | Migrated `MarshalledCLITool`: field type `UserProjectWorkspace` → `Workspace` | Success |
| 1.8 | Migrate consumer | Migrated `JsonFileIOMarshallerSessionFactory`: parameter type `UserProjectWorkspace` → `Workspace` | Success |
| 1.9 | Migrate consumer | Migrated `ClaudeWorkflowCommandBuilder`: field type `UserProjectWorkspace` → `Workspace` | Success |
| 1.10 | Update consumer tests | Updated 7 consumer unit test files to use `Workspace` interface / `AhqWorkspaceImpl` + `CurrentUserWorkspaceImpl` | Success |
| 1.11 | Docs cleanup | Removed the `git init` TSDoc step (and renumbered subsequent steps) from all 5 cross-workspace e2e test files | Success |

---

## Agreed Tier 2 Refactors

| # | Source | Description | Decision | Result |
|---|--------|-------------|----------|--------|
| 2.1 | AI | Replace `if (userPluginsDir !== ahqPluginsDir)` in `ClaudeCommandBuilder` with `if (!this.currentUserWorkspace.isAhqWorkspace())` | EXECUTE | Success |
| 2.2 | AI | Unify `getTempDir()` impls behind a shared helper | SKIP | Not executed |
| 2.3 | AI | Rename `userWorkspace` → `currentUserWorkspace` across 4 files | SKIP | Not executed |
| 2.4 | AI | Move `WorkflowSearchResultsImpl` wiring into `CompositionRoot` factory | SKIP | Not executed |
| H.1 | Human | Rename `ClaudeCommandBuilder.getPluginDirFlags()` → `getClaudeCliPluginDirArgs()` (plus internal call site) | EXECUTE | Success |

---

## Post-Refactor Test Status

**Commands**:
- `pnpm validate` (typecheck + lint + format + unit tests): PASSING (128 tests)
- `pnpm test:e2e:cross-workspace-list-workflows`: PASSING (1 test)
- Manual CLI smoke test: `node bin/agentic-hq.cjs list` — PASSING, renders the new "Local Workspace: Same as Agentic HQ Workspace" message, confirming `isAhqWorkspace()` is wired via the 2.1 swap.

> NOTE: Running all 5 cross-workspace e2e tests was skipped to conserve Claude Code plan credits (the other 4 cross-workspace tests invoke Claude and take several minutes each). Please run `pnpm test:e2e` manually if you want a full-suite check.

---

## Code Changes Made

### Files Modified:
- `src/interfaces/index.ts` — removed 3 legacy re-export lines
- `src/kernel/composition-root.ts` — dropped legacy getters, now injects `AhqWorkspaceImpl` + `CurrentUserWorkspaceImpl` directly (both typed as `Workspace`)
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` — constructor swap (two `Workspace` params), `getConfigDir()` → `getDotAgenticHqDir()` swap on both sides of the plugin-dir scan, dedup swap to `!isAhqWorkspace()`, method renamed `getPluginDirFlags()` → `getClaudeCliPluginDirArgs()`, removed now-unused `AGENTIC_HQ_DIR` constant
- `src/tools/marshalled-io-tools/marshalled-cli-tool.ts` — field type `UserProjectWorkspace` → `Workspace`
- `src/io/marshalling/json-file-io-marshaller-session-factory.ts` — parameter type `UserProjectWorkspace` → `Workspace`, updated SRP header comment
- `src/workflow/claude/claude-workflow-command-builder.ts` — field type `UserProjectWorkspace` → `Workspace`
- `tests/unit/tools/claude-code/claude-command-builder.unit.test.ts` — mocks rewritten for `Workspace` interface (two mock factories: `mockAhqWorkspace`, `mockUserWorkspace`)
- `tests/unit/tools/marshalled-cli-tool.unit.test.ts` — mock typed as `Workspace`, added missing methods
- `tests/unit/workflow/claude/claude-workflow-command-builder.unit.test.ts` — mock typed as `Workspace`, added missing methods
- `tests/unit/io/marshalling/json-file-io-marshaller-session.unit.test.ts` — mock typed as `Workspace`, added missing methods
- `tests/unit/claude-code-tool/claude-code-tool-with-injected-config.unit.test.ts` — two `Workspace` literals (ahq + current user)
- `tests/unit/claude-code-tool/claude-code-tool-with-injected-io-marshaller.unit.test.ts` — swapped `DefaultGitWorkspace`/`DefaultAgenticHqInstallation`/`DefaultUserProjectWorkspace` for `AhqWorkspaceImpl` + `CurrentUserWorkspaceImpl`
- `tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts` — same swap as above
- `tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts` — removed `git init` TSDoc step, renumbered subsequent steps
- `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` — same
- `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` — same
- `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts` — same
- `tests/e2e/demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts` — same

### Files Created:
- None

### Files Deleted:
- `src/interfaces/git-workspace.ts`
- `src/interfaces/agentic-hq-installation.ts`
- `src/interfaces/user-project-workspace.ts`
- `src/workspace/default-git-workspace.ts`
- `src/workspace/default-agentic-hq-installation.ts`
- `src/workspace/default-user-project-workspace.ts`
- `src/workspace/not-in-git-workspace-error.ts`
- `src/workspace/` (directory — emptied and removed)
- `tests/unit/workspace/default-git-workspace.unit.test.ts`
- `tests/unit/workspace/default-agentic-hq-installation.unit.test.ts`
- `tests/unit/workspace/default-user-project-workspace.unit.test.ts`
- `tests/unit/workspace/` (directory — emptied and removed)

---

## Ready for VALIDATE Phase

Refactoring is complete. Now verify all tests pass:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:05-jira-validate AHQ-91 e2e
```

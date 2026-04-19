# GREEN Phase Complete: AHQ-91 (e2e test)

**Jira**: [AHQ-91](https://agentic-hq.atlassian.net/browse/AHQ-91)
**Test Type**: e2e
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-04-19

---

## Implementation Created

**Files Created/Modified**:
- `src/kernel/composition-root.ts` — removed `DefaultGitWorkspace` import; replaced `getGitWorkspace()` body with an inline `GitWorkspace` shim (`{ getRoot: () => process.cwd() }`) so the CLI no longer shells out to git on startup.

**Test Command**: `pnpm test:e2e:cross-workspace-list-workflows`
**Test Result**: ✅ PASSING (1/1 in 2.95s)

---

## What Was Implemented

The smallest possible production-path change to let the CLI start in a non-git directory: `CompositionRoot.getGitWorkspace()` stops instantiating `DefaultGitWorkspace` (which would throw `NotInGitWorkspaceError` in a non-git tmp workspace) and returns an inline object that satisfies the `GitWorkspace` interface by reporting `process.cwd()`. Downstream — `DefaultAgenticHqInstallation` still picks up the AHQ root via `process.env.AGENTIC_HQ_WORKSPACE_ROOT` (set by `bin/agentic-hq.cjs`), and `DefaultUserProjectWorkspace` now points at the user's cwd (the tmp workspace in the e2e tests).

### Key implementation decisions:

1. **Inline shim vs. modifying `DefaultGitWorkspace`**: chose inline so the existing `DefaultGitWorkspace` class + its unit test (`tests/unit/workspace/default-git-workspace.unit.test.ts`, which mocks `execSync`) stay untouched. Zero existing tests broken, zero legacy files deleted — all of that work belongs to the REFACTOR phase per the AI summary's Scope Handoff.
2. **`process.cwd()` rather than `env ?? cwd`**: `DefaultUserProjectWorkspace.root = gitWorkspace.getRoot()` must be the user's tmp workspace, not the AHQ install root. Since the bin wrapper always sets `AGENTIC_HQ_WORKSPACE_ROOT` to the AHQ root, an `env ?? cwd` shim would mis-point `DefaultUserProjectWorkspace` at the AHQ install and break the 4 workflow-execution e2e tests. Using plain `cwd` gives the right behaviour for both consumers because `DefaultAgenticHqInstallation` short-circuits the `??` on env var (which is always set in CLI runs).
3. **Comment in the shim points forward at REFACTOR**: makes the half-migrated state explicit so the REFACTOR agent knows to delete the whole `getGitWorkspace()` method and inject `AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl` directly.

### Bugs found and fixed during GREEN:

None — implementation went as planned. Typecheck clean on first run; e2e test passed on first run.

## Files Created

- `docs/jira-docs/AHQ-91/workflow-files/e2e-test-files/03-APPROVED-green-phase-implementation-plan-copy.md` — copy of the approved plan.
- `docs/jira-docs/AHQ-91/workflow-files/e2e-test-files/03-green-phase-summary-of-what-was-implemented.md` — this file.

## Files Modified

- `src/kernel/composition-root.ts` — `DefaultGitWorkspace` import removed (1 line), `getGitWorkspace()` body replaced with a 1-line inline shim + explanatory comment block.

---

## Verification Completed

- `pnpm typecheck` → ✅ zero errors.
- `pnpm test:e2e:cross-workspace-list-workflows` → ✅ 1/1 pass (2.95s). This was the cheapest of the 5 cross-workspace e2e tests and the one proven RED in the RED phase.

## Verification Deferred to Human

Per the GREEN command's Step 7b ("If test-type is e2e: DO NOT run the full suite"), the other 4 cross-workspace e2e tests were NOT run by the agent (each invokes Claude and takes several minutes). All 4 go through the same `CompositionRoot.getGitWorkspace()` startup path as the one that passed, so they should behave the same. Human can run manually:

```
pnpm test:e2e:cross-workspace-string-reversal
pnpm test:e2e:cross-workspace-demo-math-workflow
pnpm test:e2e:cross-workspace-quick-jira-workflow
pnpm test:e2e:user-workspace-workflows
```

Full `pnpm test:e2e` is a full-Jira AC (per Acceptance Criteria) and should be verified as part of the REFACTOR / VALIDATE phases.

---

## Ready for REFACTOR Phase

The test is passing. This program should self terminate, and then (if you are running the automated workflow) the following command will be run automatically:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-91 e2e
```

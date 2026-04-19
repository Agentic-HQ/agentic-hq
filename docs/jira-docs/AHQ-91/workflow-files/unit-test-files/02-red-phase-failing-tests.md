# RED Phase Complete: AHQ-91 (unit test)

**Jira**: [AHQ-91](https://agentic-hq.atlassian.net/browse/AHQ-91)
**Test Type**: unit
**Phase**: RED (Failing Tests Written)
**Generated**: 2026-04-18

---

## Tests Created

Three existing test files expanded (one test file per class, per design requirements). **13 new tests total.** All fail via TypeScript compile errors because the four new `Workspace` methods (`getRoot`, `getTempDir`, `getDotAgenticHqDir`, `isAhqWorkspace`) are not yet declared on the interface.

### File 1: `tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts`

**Tests added (5):**
- `should return rootDir via getRoot()`
- `should return {root}/.agentic-hq/temp via getTempDir()`
- `should return {root}/.agentic-hq via getDotAgenticHqDir()`
- `should return true from isAhqWorkspace() when rootDir equals AGENTIC_HQ_WORKSPACE_ROOT`
- `should return false from isAhqWorkspace() when rootDir differs from AGENTIC_HQ_WORKSPACE_ROOT`

**Purpose**: WorkspaceImpl owns the mechanical logic for all four new Workspace methods; these tests cover the implementation directly.

### File 2: `tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts`

**Tests added (4):**
- `should return AGENTIC_HQ_WORKSPACE_ROOT via getRoot() when env var is set`
- `should fall back to process.cwd() via getRoot() when AGENTIC_HQ_WORKSPACE_ROOT is unset` (covers Q2 explicitly)
- `should return {envVarRoot}/.agentic-hq/temp via getTempDir() (delegation-proof)`
- `should always return true from isAhqWorkspace() even when AGENTIC_HQ_WORKSPACE_ROOT is unset` (semantic override)

**Purpose**: Proves AhqWorkspaceImpl delegates root resolution through WorkspaceImpl (with env-var-else-cwd fallback per Q2) and overrides `isAhqWorkspace` to `true` (semantic: it IS the AHQ workspace by definition).

### File 3: `tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts`

**Tests added (4):**
- `should return process.cwd() via getRoot()`
- `should return {cwd}/.agentic-hq/temp via getTempDir() (delegation-proof)`
- `should return true from isAhqWorkspace() when cwd equals AGENTIC_HQ_WORKSPACE_ROOT`
- `should return false from isAhqWorkspace() when cwd differs from AGENTIC_HQ_WORKSPACE_ROOT`

**Purpose**: Proves CurrentUserWorkspaceImpl delegates all four methods straight through to WorkspaceImpl with cwd as rootDir.

---

## Failure Output

### `pnpm typecheck` — 13 errors, one per new test

```
tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts(66,24): error TS2339: Property 'getRoot' does not exist on type 'Workspace'.
tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts(76,24): error TS2339: Property 'getRoot' does not exist on type 'Workspace'.
tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts(85,24): error TS2339: Property 'getTempDir' does not exist on type 'Workspace'.
tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts(95,24): error TS2339: Property 'isAhqWorkspace' does not exist on type 'Workspace'.
tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts(94,22): error TS2339: Property 'getRoot' does not exist on type 'Workspace'.
tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts(103,24): error TS2339: Property 'getTempDir' does not exist on type 'Workspace'.
tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts(113,24): error TS2339: Property 'isAhqWorkspace' does not exist on type 'Workspace'.
tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts(123,24): error TS2339: Property 'isAhqWorkspace' does not exist on type 'Workspace'.
tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts(86,22): error TS2339: Property 'getRoot' does not exist on type 'Workspace'.
tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts(91,22): error TS2339: Property 'getTempDir' does not exist on type 'Workspace'.
tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts(96,22): error TS2339: Property 'getDotAgenticHqDir' does not exist on type 'Workspace'.
tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts(104,24): error TS2339: Property 'isAhqWorkspace' does not exist on type 'Workspace'.
tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts(113,24): error TS2339: Property 'isAhqWorkspace' does not exist on type 'Workspace'.
ELIFECYCLE  Command failed with exit code 2.
```

### `pnpm test:unit` on the three files — 12 runtime failures (of 23 total tests)

```
Test Files  3 failed (3)
     Tests  12 failed | 11 passed (23)
```

All 12 runtime failures are variants of `TypeError: workspace.<method> is not a function`. One of the 13 new tests (`should return AGENTIC_HQ_WORKSPACE_ROOT via getRoot() when env var is set` on `AhqWorkspaceImpl`) passes at runtime because `AhqWorkspaceImpl.getRoot()` already exists as a `private` method in today's code and TypeScript's `private` keyword is erased at runtime. The typecheck layer catches this correctly — all 13 tests fail at compile time with `Property 'X' does not exist on type 'Workspace'`, which is the authoritative RED signal. Every failure is the intended "missing interface method" class; none are test bugs.

---

## Files Created / Modified This Phase

**Modified (test files — expanded with new tests):**
- `tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts` — +5 tests
- `tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts` — +4 tests
- `tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts` — +4 tests

**Created (workflow-files):**
- `docs/jira-docs/AHQ-91/workflow-files/unit-test-files/02-red-phase-failing-test-plan-copy.md`
- `docs/jira-docs/AHQ-91/workflow-files/unit-test-files/02-red-phase-failing-tests.md` (this file)

**Note**: No skeleton/implementation files created in RED — that's GREEN phase work.

---

## Ready for GREEN Phase

Run the next command for minimal implementation to make these 13 tests pass:

```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-91 unit
```

GREEN will:
1. Add the four new methods (`getRoot`, `getTempDir`, `getDotAgenticHqDir`, `isAhqWorkspace`) to the `Workspace` interface.
2. Implement the real logic in `WorkspaceImpl` (single source of truth — uses stored `rootDir`).
3. Wire `AhqWorkspaceImpl` to delegate three methods + override `isAhqWorkspace` to `true`; promote its existing private `getRoot` to public and switch the `?? ''` fallback to `?? process.cwd()` with an inline comment per Q2.
4. Wire `CurrentUserWorkspaceImpl` to delegate all four methods (and replace its private `isSameAsAhqWorkspace()` with `this.isAhqWorkspace()` — a nice simplification).
5. Run the tests again — expect all 23 to pass.

**Legacy class deletions (`GitWorkspace`, `AgenticHqInstallation`, `UserProjectWorkspace`, etc.) and consumer migration are also GREEN-phase work** — documented in the plan copy. They're not needed to get the 13 new tests passing, but they're prerequisites to the AC sign-off.

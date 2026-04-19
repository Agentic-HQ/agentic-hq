# Plan: AHQ-91 — RED Phase for Unit Tests

## Context

AHQ-91 removes git-based workspace detection (`GitWorkspace` / `DefaultGitWorkspace` / `NotInGitWorkspaceError`) and collapses the two parallel workspace hierarchies (`AgenticHqInstallation` / `UserProjectWorkspace` vs. the workflow-discovery `Workspace`) onto the single `Workspace` interface in `src/workflow-discovery/`. Post-refactor, `Workspace` gains four new public methods: `getRoot()`, `getTempDir()`, `getDotAgenticHqDir()`, `isAhqWorkspace()`. The env-var-then-git fallback for the AHQ root becomes env-var-then-cwd per the human's Q2 answer, with an inline comment explaining that the cwd fallback only fires outside the CLI `bin` wrapper (i.e. from `pnpm` scripts/tests run at the AHQ root).

This command writes the **failing unit tests** that drive the GREEN phase. Per the "one test file per class" design requirement and the Jira's testing plan, this is an expansion of three existing test files — one per class that sees new responsibilities.

## Delegation Pattern (Preserved and Extended)

**`AhqWorkspaceImpl` and `CurrentUserWorkspaceImpl` stay as thin wrappers that delegate almost everything to a fresh `WorkspaceImpl`** — exactly as they do today for `getWorkflowListingString` / `registerWorkflowsWith`. The outer classes' only unique jobs are (1) deciding the root / display name and (2) where semantic override beats delegation (only `AhqWorkspaceImpl.isAhqWorkspace`).

| Method | `WorkspaceImpl` owns the logic | `AhqWorkspaceImpl` behaviour | `CurrentUserWorkspaceImpl` behaviour |
|---|---|---|---|
| `getRoot()` | Returns `this.rootDir` | Delegate (passes env var with cwd fallback as rootDir) | Delegate (passes `process.cwd()` as rootDir) |
| `getTempDir()` | `path.join(this.rootDir, '.agentic-hq', 'temp')` | Delegate | Delegate |
| `getDotAgenticHqDir()` | `path.join(this.rootDir, '.agentic-hq')` | Delegate | Delegate |
| `isAhqWorkspace()` | Compares `this.rootDir === process.env.AGENTIC_HQ_WORKSPACE_ROOT` (string equality, no normalisation per Q5) | **Override** to always return `true` (by definition; avoids false result when env var momentarily unset) | Delegate |

Why `AhqWorkspaceImpl.isAhqWorkspace` overrides instead of delegating: if the env var is unset, `AhqWorkspaceImpl.getRoot()` falls back to `process.cwd()`. The WorkspaceImpl delegate would then compare `cwd === undefined` → `false` — wrong answer, because `AhqWorkspaceImpl` semantically IS the AHQ workspace regardless of env var state. Overriding to `true` keeps the semantics right.

Why this matches the existing design: `AhqWorkspaceImpl` and `CurrentUserWorkspaceImpl` already keep no stored state and produce fresh `WorkspaceImpl` delegates per call. The "avoid cached state" + "tell, don't ask" memory-feedback rules and the existing `WorkspaceImpl.discoverPlugins` pattern both push the outer classes to stay thin. Adding four more delegations follows the established path.

## Concept Table

| Concept | Interface | Impl Class | Purpose |
|---------|-----------|------------|---------|
| A workspace containing plugins | `Workspace` | (three concrete impls below) | Expanded to expose `getRoot()`, `getTempDir()`, `getDotAgenticHqDir()`, `isAhqWorkspace()` |
| Generic workspace at a given root dir | `Workspace` | `WorkspaceImpl` | Owns the mechanical logic for all four new methods — single source of truth |
| The AHQ workspace | `Workspace` | `AhqWorkspaceImpl` | Resolves root from `AGENTIC_HQ_WORKSPACE_ROOT` env var (falling back to `process.cwd()`); delegates to `WorkspaceImpl`; overrides `isAhqWorkspace` to `true` |
| The user's current workspace | `Workspace` | `CurrentUserWorkspaceImpl` | Resolves root from `process.cwd()`; delegates to `WorkspaceImpl` |

**Sub-interface decision (confirmed with human):** `AhqWorkspace` / `CurrentUserWorkspace` sub-interfaces are **NOT created**. With all four new methods on `Workspace`, the sub-interfaces would carry nothing beyond what `Workspace` already has, and TypeScript's structural typing makes empty marker interfaces ineffective at preventing mixups anyway. Runtime differentiation is available via `isAhqWorkspace()`. YAGNI — revisit if a real consumer need emerges.

## Data Dictionary

| Field / Method | Type | Meaning |
|---|---|---|
| `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` | `string` constant | Env var name for the AHQ root. Already exported from `ahq-workspace-impl.ts`. |
| `Workspace.getRoot()` | `(): string` | Absolute path of the workspace root. |
| `Workspace.getTempDir()` | `(): string` | `{root}/.agentic-hq/temp` — workspace's temp-file dir. |
| `Workspace.getDotAgenticHqDir()` | `(): string` | `{root}/.agentic-hq` — workspace's AHQ config dir. Replaces the misleadingly-named legacy `AgenticHqInstallation.getConfigDir()`. Named per Q3 human answer. |
| `Workspace.isAhqWorkspace()` | `(): boolean` | `true` iff this workspace's root equals the AHQ workspace root. Plain string equality per Q5. |
| `WorkspaceImpl.rootDir` | existing field | The workspace root dir. Used by all four new methods. |

## English Language Description

The unit tests construct a concrete **WorkspaceImpl**, **AhqWorkspaceImpl**, or **CurrentUserWorkspaceImpl**, type the reference as the **Workspace** interface, and ask it to *getRoot*, *getTempDir*, *getDotAgenticHqDir*, or *isAhqWorkspace*. The **WorkspaceImpl** owns the real logic: it answers *getRoot* with its stored `rootDir`, *getTempDir* by joining `.agentic-hq/temp` onto `rootDir`, *getDotAgenticHqDir* by joining `.agentic-hq` onto `rootDir`, and *isAhqWorkspace* by comparing `rootDir` to `AGENTIC_HQ_WORKSPACE_ROOT` with plain string equality. The **AhqWorkspaceImpl** answers *getRoot* / *getTempDir* / *getDotAgenticHqDir* by creating a fresh **WorkspaceImpl** delegate (with env-var-else-cwd as `rootDir`) and delegating; it overrides *isAhqWorkspace* to always return `true` so that the AHQ workspace doesn't accidentally report `false` when the env var is unset. The **CurrentUserWorkspaceImpl** creates its delegate with `process.cwd()` as `rootDir` and delegates all four methods straight through; *isAhqWorkspace* then naturally returns `true` iff cwd equals the env var. Because the **Workspace** interface does not yet declare any of the four new methods, TypeScript rejects every new test at compile time — that compile failure IS the RED-phase failure. GREEN adds the four methods to **Workspace**, gives **WorkspaceImpl** the real implementations, promotes the existing private `AhqWorkspaceImpl.getRoot` to public + switches `?? ''` to `?? process.cwd()`, and wires the two outer classes to delegate (with the one override for *isAhqWorkspace* on **AhqWorkspaceImpl**).

## Project Design Requirements Compliance

- **Class/interface per concept**: Tests reference `Workspace` (interface) and instantiate via concrete classes, typing variables as `Workspace`. Matches existing convention.
- **Switchability / `classwitch`**: Tests assert against the interface. A third-party `CustomWorkspaceImpl` replacing `WorkspaceImpl` would still pass the contract tests.
- **Avoid cached state**: Tests construct a fresh impl per test body; outer-class impls already cache-free; `WorkspaceImpl` stores only its constructor args (which don't change at runtime) — matches current pattern.
- **Tell, don't ask**: `isAhqWorkspace()` lives on `Workspace` (canonical example — callers don't compare strings themselves); new methods push work into the workspace object.
- **One test file per class**: Each of three modified classes has its own test file expanded — no new test files, no cross-class tests. Reinforced.
- **Directory structure by entity**: Tests stay under `tests/unit/workflow-discovery/workspace/`.

Requirements deferred to GREEN/REFACTOR (not validatable at unit level): the interface expansion itself, migration of the legacy consumers (`CompositionRoot`, `ClaudeCommandBuilder`, `MarshalledCLITool`, `JsonFileIOMarshallerSessionFactory`, `ClaudeWorkflowCommandBuilder`), deletion of the legacy classes, `isAhqWorkspace()` runtime equality behaviour across consumer paths.

## Plan Steps

**Step 0 — Copy this approved plan** (first action after approval):
- Create `docs/jira-docs/AHQ-91/workflow-files/unit-test-files/` directory.
- Copy this file (`/Users/stevepersonal/.claude/plans/peaceful-cuddling-rossum.md`) to `docs/jira-docs/AHQ-91/workflow-files/unit-test-files/02-red-phase-failing-test-plan-copy.md`.

**Step 1 — Expand `workspace-impl.unit.test.ts`** with 5 new tests (WorkspaceImpl owns the logic, so it needs direct coverage):
- `should return rootDir via getRoot()` — trivial getter, one assertion.
- `should return {root}/.agentic-hq/temp via getTempDir()`.
- `should return {root}/.agentic-hq via getDotAgenticHqDir()`.
- `should return true from isAhqWorkspace() when rootDir equals AGENTIC_HQ_WORKSPACE_ROOT`.
- `should return false from isAhqWorkspace() when rootDir differs from AGENTIC_HQ_WORKSPACE_ROOT`.

**Step 2 — Expand `ahq-workspace-impl.unit.test.ts`** with 4 new tests (delegation + the one semantic override):
- `should return AGENTIC_HQ_WORKSPACE_ROOT via getRoot() when env var is set` — proves env var flows to the delegate.
- `should fall back to process.cwd() via getRoot() when AGENTIC_HQ_WORKSPACE_ROOT is unset` — covers Q2 explicitly.
- `should return {envVarRoot}/.agentic-hq/temp via getTempDir()` — **delegation-proof**: confirms env var flows through WorkspaceImpl's path join.
- `should always return true from isAhqWorkspace() even when AGENTIC_HQ_WORKSPACE_ROOT is unset` — proves the semantic override.

Skipping direct tests for `getDotAgenticHqDir` on AhqWorkspaceImpl — the delegation-proof via `getTempDir` is sufficient; both use the same delegate + same `rootDir` path-joining, so proving one proves the other.

**Step 3 — Expand `current-user-workspace-impl.unit.test.ts`** with 4 new tests:
- `should return process.cwd() via getRoot()` — proves cwd flows to the delegate.
- `should return {cwd}/.agentic-hq/temp via getTempDir()` — **delegation-proof**: confirms cwd flows through WorkspaceImpl's path join.
- `should return true from isAhqWorkspace() when cwd equals AGENTIC_HQ_WORKSPACE_ROOT`.
- `should return false from isAhqWorkspace() when cwd differs from AGENTIC_HQ_WORKSPACE_ROOT`.

Skipping direct tests for `getDotAgenticHqDir` on CurrentUserWorkspaceImpl, same reasoning as Step 2.

**Total new tests this RED: 13** (5 + 4 + 4) across three existing files. One test file per class.

**Step 4 — Brief comment above each new block** explaining what it verifies (1–2 lines tops, per CLAUDE.md "default to writing no comments").

**Step 5 — Run the tests and confirm failure for the right reason**:
- Command: `cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm test:unit tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts`
- Expected: TypeScript compile errors — `Property 'getRoot' does not exist on type 'Workspace'`, same for `getTempDir` / `getDotAgenticHqDir` / `isAhqWorkspace`. Valid RED — the interface methods don't exist yet.
- If any test fails for a different reason (typo, wrong path, bad `process.cwd` override), fix the test and re-run until every failure is the "missing interface method" class.

**Step 6 — Run `pnpm typecheck`** for second-layer confirmation:
- Command: `cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm typecheck`
- Expected: same "Property 'X' does not exist on type 'Workspace'" errors.
- Other unrelated type errors must be investigated before continuing.

**Step 7 — Write the RED phase summary document** at `docs/jira-docs/AHQ-91/workflow-files/unit-test-files/02-red-phase-failing-tests.md`:
- Include test file paths, list of 13 new test names, pasted compile-error output, note that no impl/skeleton files were created, "Ready for GREEN Phase" pointer to command 03.

**Step 8 — Add Jira comment** via `mcp__mcp-atlassian__jira_add_comment`:
- Markdown body: RED phase complete for unit tests, 13 new tests across three files, failure is TypeScript compile errors for the four missing `Workspace` methods, next step is GREEN.

**Step 9 — Present summary to human** with test file paths, count, RED confirmation, failure reasons.

**Step 10 — Write `command-output.json`** at `{command-input-output-files-directory}/command-output.json` with `{ "command-output-string": "RED phase complete for test-type unit" }`.

**Step 11 — Self-terminate** via `agentic-hq-core-plugin:self-termination`.

**Step 12 — Recheck all commands have been executed in the `02-jira-write-failing-test.md` command** (per the command's mandated last plan step).

## Legacy & Consumer Test Deletions / Updates — Deferred To GREEN (Listed Here So They Aren't Forgotten)

**NOT done in RED.** Documented so GREEN picks them up without re-discovering them.

**Test files to DELETE in GREEN** (their classes are deleted at the same time — deletion is tied to the class deletion, not to a RED failure):
- `tests/unit/workspace/default-git-workspace.unit.test.ts` — also covers `NotInGitWorkspaceError` (confirmed via Grep: the error class has no separate test file, only referenced here).
- `tests/unit/workspace/default-agentic-hq-installation.unit.test.ts`
- `tests/unit/workspace/default-user-project-workspace.unit.test.ts`

After these deletions, the `tests/unit/workspace/` directory is empty and should itself be removed.

**Test files to UPDATE in GREEN** (currently construct the legacy types being deleted — they will fail to compile once the legacy classes are gone, which IS the GREEN trigger):
- `tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts`
- `tests/unit/claude-code-tool/claude-code-tool-with-injected-io-marshaller.unit.test.ts`
- `tests/unit/claude-code-tool/claude-code-tool-with-injected-config.unit.test.ts`
- Any other consumer test that constructs `DefaultGitWorkspace` / `DefaultAgenticHqInstallation` / `DefaultUserProjectWorkspace` directly — sweep by Grep during GREEN.

**Production files to DELETE in GREEN:**
- `src/interfaces/git-workspace.ts`
- `src/interfaces/agentic-hq-installation.ts`
- `src/interfaces/user-project-workspace.ts`
- `src/workspace/default-git-workspace.ts`
- `src/workspace/default-agentic-hq-installation.ts`
- `src/workspace/default-user-project-workspace.ts`
- `src/workspace/not-in-git-workspace-error.ts`
- Re-exports in `src/interfaces/index.ts`.

**Production files to MODIFY in GREEN:**
- `src/workflow-discovery/interfaces/workspace.ts` — add the four new methods.
- `src/workflow-discovery/workspace/workspace-impl.ts` — implement the four methods (owns the real logic).
- `src/workflow-discovery/workspace/ahq-workspace-impl.ts` — delegate three methods to `WorkspaceImpl`, override `isAhqWorkspace` to `true`, promote existing `getRoot` to public, switch `?? ''` to `?? process.cwd()` with explanatory comment per Q2.
- `src/workflow-discovery/workspace/current-user-workspace-impl.ts` — delegate all four methods to `WorkspaceImpl`. The existing `isSameAsAhqWorkspace()` private method can be replaced by `this.isAhqWorkspace()` — nice simplification.
- `src/kernel/composition-root.ts` — rewire: remove `getGitWorkspace` / `getAgenticHqInstallation` / `getUserProjectWorkspace`, inject `AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl` directly (both typed as `Workspace`).
- Four consumers: `ClaudeCommandBuilder`, `MarshalledCLITool`, `JsonFileIOMarshallerSessionFactory`, `ClaudeWorkflowCommandBuilder` — replace legacy type params with `Workspace`.

## Files Touched (This Command — Write / Edit)

- `tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts` — +5 `tmpdirTest(...)` blocks + brief comment.
- `tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts` — +4 `tmpdirTest(...)` blocks + brief comment.
- `tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts` — +4 `tmpdirTest(...)` blocks + brief comment.
- `docs/jira-docs/AHQ-91/workflow-files/unit-test-files/` — new directory.
- `docs/jira-docs/AHQ-91/workflow-files/unit-test-files/02-red-phase-failing-test-plan-copy.md` — new (copy of this plan).
- `docs/jira-docs/AHQ-91/workflow-files/unit-test-files/02-red-phase-failing-tests.md` — new (RED summary).

## Files NOT Touched (This Command)

- All `src/workflow-discovery/**` production files — GREEN modifies.
- All `src/interfaces/*.ts` and `src/workspace/*.ts` legacy files — GREEN deletes.
- All legacy test files under `tests/unit/workspace/` — GREEN deletes.
- All `tests/unit/claude-code-tool/*.unit.test.ts` currently constructing legacy types — GREEN updates.
- No new sub-interface files created (`AhqWorkspace` / `CurrentUserWorkspace` skipped per human confirmation).

## Verification

- `pnpm test:unit <three test files>` → fails with TypeScript compile errors for the four missing `Workspace` methods across the 13 new tests.
- `pnpm typecheck` → same compile errors surface via `tsc --noEmit`.
- Other existing tests remain untouched and pass.
- Plan file copied to `unit-test-files/02-red-phase-failing-test-plan-copy.md`.
- RED summary file (`02-red-phase-failing-tests.md`) created with exact failure output pasted verbatim.
- Jira comment added.
- `command-output.json` written with the success string.
- Final self-termination call made.

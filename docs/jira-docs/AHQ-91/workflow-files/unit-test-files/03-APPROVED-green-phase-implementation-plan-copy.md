# Plan: AHQ-91 — GREEN Phase (Unit Tests)

## Context

The RED phase added **13 new unit tests** across three existing test files, asserting four new `Workspace` methods — `getRoot()`, `getTempDir()`, `getDotAgenticHqDir()`, `isAhqWorkspace()` — that do not yet exist. Every test fails with either a TypeScript compile error (`Property 'X' does not exist on type 'Workspace'`) or a runtime `TypeError`. This GREEN phase writes the **minimum** code to turn those 13 tests green without breaking the 10 existing tests in the same three files.

**Scope strictness (GREEN phase): unit tests only.** Deleting the legacy `GitWorkspace` / `AgenticHqInstallation` / `UserProjectWorkspace` hierarchies and rewiring their consumers are documented in the RED plan copy as *also* GREEN phase work — but they are not required to make the 13 new unit tests pass and they belong to the e2e test type's GREEN phase. Per the command spec ("write only enough code to make the test pass, no gold-plating, duplication is acceptable"), this plan implements **only** the four new methods and their wiring.

## Jira Requirements (Numbered)

Every Jira / RED-phase requirement that affects this GREEN phase, numbered, with an arrow pointing to which plan step addresses it.

1. `Workspace.getRoot()` declared on interface → [Step 2]
2. `Workspace.getTempDir()` declared on interface → [Step 2]
3. `Workspace.getDotAgenticHqDir()` declared on interface → [Step 2]
4. `Workspace.isAhqWorkspace()` declared on interface → [Step 2]
5. `WorkspaceImpl.getRoot()` returns `this.rootDir` → [Step 3]
6. `WorkspaceImpl.getTempDir()` returns `path.join(rootDir, '.agentic-hq', 'temp')` → [Step 3]
7. `WorkspaceImpl.getDotAgenticHqDir()` returns `path.join(rootDir, '.agentic-hq')` → [Step 3]
8. `WorkspaceImpl.isAhqWorkspace()` returns `rootDir === process.env.AGENTIC_HQ_WORKSPACE_ROOT` (plain string equality per Q5) → [Step 3]
9. `AhqWorkspaceImpl.getRoot()` promoted from `private` to public, returns env var with `?? process.cwd()` fallback (per Q2) → [Step 4]
10. `AhqWorkspaceImpl.getTempDir()` / `getDotAgenticHqDir()` delegate to a fresh `WorkspaceImpl` (created with the env-var-else-cwd root) → [Step 4]
11. `AhqWorkspaceImpl.isAhqWorkspace()` overrides to always return `true` (semantic: it IS the AHQ workspace by definition) → [Step 4]
12. Inline comment on `AhqWorkspaceImpl.getRoot()` explaining when the cwd fallback fires (per Q2) → [Step 4]
13. `CurrentUserWorkspaceImpl` delegates all four new methods straight through to a fresh `WorkspaceImpl` (created with `process.cwd()` as root) → [Step 5]
14. `CurrentUserWorkspaceImpl.isSameAsAhqWorkspace()` private helper replaced by `this.isAhqWorkspace()` — nice simplification noted in the RED plan → [Step 5]
15. **AC**: unit tests pass after implementation → [Verification: run `pnpm test`]
16. **AC**: `pnpm typecheck` passes → [Verification: run `pnpm typecheck`]
17. **Out of scope for this GREEN** (e2e phase work — do NOT touch): legacy class deletions, consumer migration (`CompositionRoot`, `ClaudeCommandBuilder`, `MarshalledCLITool`, `JsonFileIOMarshallerSessionFactory`, `ClaudeWorkflowCommandBuilder`, `WorkflowSearchResultsImpl`), consumer test updates, the 5 cross-workspace e2e tests' `git init` removal, `pnpm format:check` / `lint:check` → N/A (deferred to e2e phase — see new Step 9.5 below, which puts an explicit "e2e REFACTOR" note in the 01 AI-summary doc so the e2e agent picks up the removals)
18. **New (human ask)**: update the 01 AI-summary doc to make it explicit to the e2e agent that legacy class removal + consumer migration belongs to the **e2e REFACTOR** phase, and that unit + e2e tests must all still pass after that removal → [Step 9.5]

## Project Design Requirements Compliance

| # | Design Requirement | Plan Section Addressing It | Notes |
|---|---|---|---|
| D.1 | Class/interface pair for each concept | No new classes/interfaces added | The `Workspace` / `WorkspaceImpl` / `AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl` pairs already exist and are preserved. The interface just gains four methods. |
| D.2 | Tell, don't ask | Step 3 + Step 5 | `isAhqWorkspace()` lives on `Workspace`, so callers never compare `rootDir === process.env.X` themselves — they tell the workspace to decide. Delegation pattern preserved throughout. |
| D.3 | Avoid cached state / minimal state | Step 4 + Step 5 | `AhqWorkspaceImpl` and `CurrentUserWorkspaceImpl` continue to store no fields; they create a fresh `WorkspaceImpl` delegate per call. `WorkspaceImpl` stores only its constructor args — unchanged. |
| D.4 | Switchability (`classwitch`) | Preserved | All assertions in tests are against the `Workspace` interface; any third-party `CustomWorkspaceImpl` would satisfy the contract. No change. |
| D.5 | One test file per class | Step 1 context | RED phase already expanded the three existing test files (one per class). GREEN doesn't touch tests. |
| D.6 | Directory structure by entity | No directory changes | All files stay in `src/workflow-discovery/workspace/` and `src/workflow-discovery/interfaces/`. |

**Deferred to REFACTOR** (documented here so the REFACTOR phase can act on it):
- **D.3 / D.2 caveat**: `WorkspaceImpl.isAhqWorkspace()` reads `process.env.AGENTIC_HQ_WORKSPACE_ROOT` directly using the bare string literal `'AGENTIC_HQ_WORKSPACE_ROOT'`. GREEN accepts this duplication of the existing `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` constant in `ahq-workspace-impl.ts` because importing it from there into `workspace-impl.ts` would create a circular module dependency. REFACTOR can extract the constant to a shared `workspace-constants.ts` or similar. GREEN accepts the duplication per the command's "duplication and copy-pasting are expected and OK — cleanup happens in REFACTOR" rule.
- **Q6 note**: duplication between `AhqWorkspaceImpl.getTempDir()` and `CurrentUserWorkspaceImpl.getTempDir()` (both delegate identical path-join logic to `WorkspaceImpl`) acknowledged per Q6 as a future-simplification candidate — intentionally not consolidated.

## Plan Steps

**Step 0 — Copy this approved plan** (first action after approval, before any code change):
- Copy this plan file (`/Users/stevepersonal/.claude/plans/ancient-gliding-salamander.md`) to `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/jira-docs/AHQ-91/workflow-files/unit-test-files/03-APPROVED-green-phase-implementation-plan-copy.md`.

**Step 1 — Verify RED state by running the three test files** (baseline check — "run tests BEFORE modifying" per CLAUDE.md):
- Command: `cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm test tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts`
- Expected: 12 failed / 11 passed (the RED-phase baseline per the RED doc).

**Step 2 — Add four method declarations to `Workspace` interface**:
- File: `src/workflow-discovery/interfaces/workspace.ts`
- Add four one-liner method declarations at the bottom of the interface body:
  ```typescript
  getRoot(): string;
  getTempDir(): string;
  getDotAgenticHqDir(): string;
  isAhqWorkspace(): boolean;
  ```
- Single-line TSDoc comment for each (pattern matches the existing `getWorkflowListingString` / `registerWorkflowsWith` style).

**Step 3 — Implement the four methods on `WorkspaceImpl`**:
- File: `src/workflow-discovery/workspace/workspace-impl.ts`
- Add four methods after the existing `registerWorkflowsWith` and before `discoverPlugins`:
  ```typescript
  getRoot(): string { return this.rootDir; }
  getTempDir(): string { return path.join(this.rootDir, '.agentic-hq', 'temp'); }
  getDotAgenticHqDir(): string { return path.join(this.rootDir, '.agentic-hq'); }
  isAhqWorkspace(): boolean { return this.rootDir === process.env.AGENTIC_HQ_WORKSPACE_ROOT; }
  ```
- Use the bare string literal `'AGENTIC_HQ_WORKSPACE_ROOT'` via `process.env.AGENTIC_HQ_WORKSPACE_ROOT` — not the `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` constant, to avoid a circular import between `workspace-impl.ts` and `ahq-workspace-impl.ts`. Duplication flagged for REFACTOR.

**Step 4 — Wire `AhqWorkspaceImpl`** to delegate three methods + override `isAhqWorkspace`:
- File: `src/workflow-discovery/workspace/ahq-workspace-impl.ts`
- Promote existing `private getRoot()` to public (remove the `private` keyword).
- Change `?? ''` to `?? process.cwd()` on the `getRoot()` body. Add a one-line inline comment: `// Fallback to process.cwd() only fires outside the CLI bin wrapper (e.g. from pnpm scripts or tests run at the AHQ root) — the bin wrapper always sets AGENTIC_HQ_WORKSPACE_ROOT.`
- Add three delegating one-liners:
  ```typescript
  getTempDir(): string { return this.createDelegate().getTempDir(); }
  getDotAgenticHqDir(): string { return this.createDelegate().getDotAgenticHqDir(); }
  isAhqWorkspace(): boolean { return true; }
  ```
- `isAhqWorkspace` is an override, not a delegation (semantic: the AHQ workspace IS the AHQ workspace by definition; it must return `true` even if the env var is unset, which is exactly what one of the new tests asserts).

**Step 5 — Wire `CurrentUserWorkspaceImpl`** to delegate all four new methods:
- File: `src/workflow-discovery/workspace/current-user-workspace-impl.ts`
- Add four delegating one-liners:
  ```typescript
  getRoot(): string { return this.createDelegate().getRoot(); }
  getTempDir(): string { return this.createDelegate().getTempDir(); }
  getDotAgenticHqDir(): string { return this.createDelegate().getDotAgenticHqDir(); }
  isAhqWorkspace(): boolean { return this.createDelegate().isAhqWorkspace(); }
  ```
- Replace the existing private `isSameAsAhqWorkspace()` body with `return this.isAhqWorkspace();` (nice simplification per RED plan step 14). Keep the private helper's name for now — it's only called in two places inside this file and renaming isn't needed for GREEN.
- The existing `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` import becomes unused after that replacement — remove it (TypeScript will flag it as unused otherwise).

**Step 6 — Run the three unit test files** (confirm GREEN):
- Command: `cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm test tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts`
- Expected: 23 / 23 pass.
- If any test fails: fix only what the error tells you to fix. Do not add features beyond what the failure requires.

**Step 7 — Run `pnpm typecheck`** for a second-layer confirmation that the new interface methods are satisfied across the codebase:
- Command: `cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm typecheck`
- Expected: zero errors. If there are errors, they may reveal external consumers of `Workspace` that don't implement the new methods — investigate before continuing. The interface is currently consumed only by the three impl classes and a few listing callers (per the RED doc / AI summary), so typecheck should be clean.

**Step 8 — Run the full unit-test suite** (per the command spec's Step 7b for unit test type):
- Command: `cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm test`
- Expected: all unit tests pass.
- If there is any unrelated failure, investigate whether the four-method interface addition caused it — most likely a stub or fake of `Workspace` exists that needs the new methods.

**Step 9 — Write the GREEN phase summary document** at `docs/jira-docs/AHQ-91/workflow-files/unit-test-files/03-green-phase-summary-of-what-was-implemented.md` using the template from the command spec (includes: files modified, test command / result, what was implemented, key decisions, bugs found during GREEN).

**Step 9.5 — Update the 01 AI-summary doc with an explicit e2e-REFACTOR handoff note** (per human ask, Jira requirement #18):
- File: `docs/jira-docs/AHQ-91/workflow-files/ai-summary-of-jiras-and-questions-for-human.md`
- Add a new, prominent section near the top (just below the `## My Understanding of This Task` section, before `## Research Findings`) titled `## IMPORTANT: Scope Handoff — What Belongs to the e2e REFACTOR Phase`. The section must make the following crystal-clear to the future e2e agent:
  - The **unit test cycle** (RED/GREEN/REFACTOR) is scoped to the four new `Workspace` methods only. It does **not** delete legacy classes or touch consumers.
  - The **e2e test cycle** owns ALL of the following removals and migrations. They must be done during the e2e **REFACTOR** phase (i.e. after e2e GREEN has minimally made the 5 cross-workspace tests pass by removing git-root detection from the production path). Splitting into e2e GREEN (minimal) and e2e REFACTOR (cleanup) is deliberate: GREEN only makes the tests green; REFACTOR removes the now-dead legacy classes and migrates consumers.
    - **Delete interfaces**: `src/interfaces/git-workspace.ts`, `src/interfaces/agentic-hq-installation.ts`, `src/interfaces/user-project-workspace.ts`.
    - **Delete impl classes**: `src/workspace/default-git-workspace.ts`, `src/workspace/default-agentic-hq-installation.ts`, `src/workspace/default-user-project-workspace.ts`, `src/workspace/not-in-git-workspace-error.ts`.
    - **Delete legacy test files**: `tests/unit/workspace/default-git-workspace.unit.test.ts`, `tests/unit/workspace/default-agentic-hq-installation.unit.test.ts`, `tests/unit/workspace/default-user-project-workspace.unit.test.ts`. Once emptied, also remove the `tests/unit/workspace/` directory.
    - **Remove re-exports from `src/interfaces/index.ts`** (for the three legacy interfaces).
    - **Migrate consumers** to depend on the new `Workspace` / `AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl` types instead of the legacy types: `src/kernel/composition-root.ts`, `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts`, `src/tools/marshalled-io-tools/marshalled-cli-tool.ts`, `src/io/marshalling/json-file-io-marshaller-session-factory.ts`, `src/workflow/claude/claude-workflow-command-builder.ts`, and any `WorkflowSearchResultsImpl` references.
    - **Update consumer tests** currently constructing the legacy types directly: `tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts`, `tests/unit/claude-code-tool/claude-code-tool-with-injected-io-marshaller.unit.test.ts`, `tests/unit/claude-code-tool/claude-code-tool-with-injected-config.unit.test.ts`, plus any further consumer tests surfaced by the typecheck errors that appear the moment the legacy classes are deleted.
  - **Test gate — the REFACTOR phase is not complete until ALL of the following pass**: `pnpm test` (all unit tests), `pnpm test:e2e` (all e2e tests), `pnpm typecheck`. Any breakage means the migration is incomplete; fix before marking REFACTOR done.
  - **Reason the removal is REFACTOR not GREEN**: the e2e GREEN phase's sole job is to make the 5 cross-workspace e2e tests turn green via the minimum production change (i.e. the CLI must work without git). Cleanup of now-unused legacy classes belongs in REFACTOR per the project's TDD rule (RED → GREEN → REFACTOR → VERIFY).
- Write as a new addition; do not modify other sections of the AI-summary doc.
- Do not mark this step as complete until the summary doc has been saved and the REFACTOR phase expectations are unambiguous.

**Step 10 — Add Jira comment** via `mcp__mcp-atlassian__jira_add_comment` summarising: GREEN phase complete for unit tests, 13 tests now pass, four new methods wired on `Workspace` / `WorkspaceImpl` / `AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl`, next is REFACTOR.

**Step 11 — Present summary to human** with the implementation files modified, test results, and the path to the GREEN-phase doc.

**Step 12 — Write `command-output.json`** at `{command-input-output-files-directory}/command-output.json` with `{ "command-output-string": "GREEN phase complete for test-type unit" }`.

**Step 13 — Self-terminate** via `agentic-hq-core-plugin:self-termination`.

**Step 14 — Re-read `03-jira-minimal-implementation.md`** before doing steps 9–13 to confirm no command instruction was missed (mandated by command spec, deliberately not expanded into this plan to avoid drift).

## Files Touched (This Command — Write / Edit)

- `src/workflow-discovery/interfaces/workspace.ts` — +4 method declarations + TSDoc lines.
- `src/workflow-discovery/workspace/workspace-impl.ts` — +4 method implementations (owns the logic).
- `src/workflow-discovery/workspace/ahq-workspace-impl.ts` — promote `getRoot` to public, change fallback, add 3 delegations + 1 override, add cwd-fallback comment.
- `src/workflow-discovery/workspace/current-user-workspace-impl.ts` — add 4 delegations, replace private helper body, remove unused env-var constant import.
- `docs/jira-docs/AHQ-91/workflow-files/unit-test-files/03-APPROVED-green-phase-implementation-plan-copy.md` — new (copy of this plan).
- `docs/jira-docs/AHQ-91/workflow-files/unit-test-files/03-green-phase-summary-of-what-was-implemented.md` — new (GREEN summary).
- `docs/jira-docs/AHQ-91/workflow-files/ai-summary-of-jiras-and-questions-for-human.md` — append new "Scope Handoff" section so the future e2e agent picks up legacy removal as REFACTOR work.
- `{command-input-output-files-directory}/command-output.json` — new (command success string).

## Files NOT Touched (This Command)

- **All test files** (RED wrote them; GREEN makes them pass — never modifies tests during GREEN).
- Legacy classes (`src/interfaces/git-workspace.ts`, `src/workspace/**`) — e2e GREEN phase work.
- Consumers of legacy types (`CompositionRoot`, `ClaudeCommandBuilder`, etc.) — e2e GREEN phase work.
- `src/workflow-discovery/plugin/**` and other workflow-discovery files — no new responsibilities.

## Verification

- Step 1 baseline: 12 failed / 11 passed across the three test files (matches RED doc).
- Step 6: 23 / 23 pass across the three test files.
- Step 7: `pnpm typecheck` clean.
- Step 8: full `pnpm test` green (no regressions).
- Plan copy saved at `docs/jira-docs/AHQ-91/workflow-files/unit-test-files/03-APPROVED-green-phase-implementation-plan-copy.md`.
- GREEN summary at `docs/jira-docs/AHQ-91/workflow-files/unit-test-files/03-green-phase-summary-of-what-was-implemented.md`.
- Jira comment added.
- `command-output.json` written with the success string.
- Self-termination call made.

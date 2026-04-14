# Rename `WorkflowSearchResults` → `Workspaces` (and `WorkflowSearchResultsImpl` → `WorkspacesImpl`) - AHQ-111

**Status**: Deferred from AHQ-106 e2e REFACTOR phase (2026-04-13)
**Origin**: [AHQ-106](https://agentic-hq.atlassian.net/browse/AHQ-106) — refactor analysis document [`04a-refactor-phase-proposed-refactors.md`](../e2e-test-files/04a-refactor-phase-proposed-refactors.md), Refactor 2.4

UPDATE: Jira created by Steve at https://agentic-hq.atlassian.net/browse/AHQ-111



---

## Background

During AHQ-106 (the unit + e2e phases that delivered dynamic workflow discovery), a new class was introduced called `WorkflowSearchResults` (interface) / `WorkflowSearchResultsImpl` (impl). Its job is to hold the collection of AHQ-aware `Workspace` objects (currently two: the AHQ-installation workspace and the current-user workspace) and expose operations on them (`getWorkflowsListingString()`, `registerWorkflowsWith()`).

The name made sense during the unit-test phase because it was conceptualised as "the results of searching for workflows". After the e2e-phase pivot (dynamic scanning in `ClaudeCommandBuilder`), the class is effectively just "the set of workspaces AHQ knows about" — it isn't really "search results" any more. The human left a REFACTOR comment on `workflow-search-results-impl.ts` proposing the rename, which is the origin of this ticket.

The rename was proposed as Refactor 2.4 in the AHQ-106 e2e REFACTOR analysis but was **rejected (deferred)** for the following reasons:

1. **Non-trivial rename** — ~8 files touched, plus file moves (`workflow-listing/` → `workspace/` or similar).
2. **Premature** — the whole 2-workspace model is marked as potentially temporary (see the REFACTOR comment on `ClaudeCommandBuilder.getPluginDirFlags()`, which notes the "2 workspace" setup is likely a stepping-stone for developers to try AHQ, and that a more dynamic multi-workspace resolution will replace it). Renaming now might itself need to be renamed again soon.
3. **Doc drift risk** — `WorkflowSearchResults` is referenced in a number of analysis / workflow docs that would become stale.
4. **Pure cosmetic** — no correctness or clarity win beyond the name itself.

**May never be done**: if the 2-workspace model is replaced by a more dynamic multi-workspace resolution scheme before this ticket is picked up, the right move will likely be to do this rename (or a different one) as part of that larger change rather than as a standalone mechanical pass.

---

## Scope

Rename the interface, the implementation class, the file, the directory, and every reference.

### Renames

| Current                                                              | New                                                 |
|----------------------------------------------------------------------|-----------------------------------------------------|
| Interface `WorkflowSearchResults`                                    | `Workspaces`                                        |
| Class `WorkflowSearchResultsImpl`                                    | `WorkspacesImpl`                                    |
| File `src/workflow-discovery/interfaces/workflow-search-results.ts`  | `src/workflow-discovery/interfaces/workspaces.ts`   |
| File `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts` | `src/workflow-discovery/workspace/workspaces-impl.ts` (or similar) |
| Directory `src/workflow-discovery/workflow-listing/`                 | `src/workflow-discovery/workspace/` (or merge into existing workspace dir) |
| Test file for the impl                                               | Renamed to match new class name                     |

### Files that will need updating

Non-exhaustive — a grep pass should be done before starting:

- `src/workflow-discovery/interfaces/workflow-search-results.ts` (moved + renamed)
- `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts` (moved + renamed)
- `src/cli/agentic-hq-program.ts` — imports + param type
- `src/cli/agentic-hq-cli.ts` — imports + constructor call
- `src/kernel/composition-root.ts` — if by then `getWorkflowSearchResults()` has been added (see AHQ-106 Refactor 2.2b)
- Any unit test files for the impl or for callers that stub it
- Any analysis / workflow docs that reference the old names (these will go stale but are historical — decide case by case)

---

## Acceptance Criteria

1. All references to `WorkflowSearchResults` / `WorkflowSearchResultsImpl` in `src/` and `tests/` are renamed.
2. The file and directory moves are reflected in imports.
3. `pnpm validate` passes (typecheck + lint + unit tests).
4. `pnpm test:e2e:user-workspace-workflows` passes.
5. No behavioural change — this is a pure rename + file move.
6. Historical docs in `docs/jira-docs/AHQ-106/` are left as-is (they describe the state of the codebase at that time and should not be retrospectively rewritten).

---

## Implementation Notes

- Mechanical rename. Consider using `Grep` first to build a full list of references, then IDE rename or `sed` in a git-reviewable single commit.
- Suggest doing this as a single isolated commit with no other functional changes, so the diff is purely a rename and easy to review.
- Before starting: re-read the `ClaudeCommandBuilder.getPluginDirFlags()` REFACTOR comment and the AHQ-106 analysis doc section P.2 to check whether the 2-workspace model is still the current design. If it's already on its way out, consider folding this into that larger refactor instead.

---

## Non-goals

- No behavioural changes.
- No new tests (existing tests should keep passing unchanged after the rename).
- Do NOT combine with any other refactor — keep the commit pure.

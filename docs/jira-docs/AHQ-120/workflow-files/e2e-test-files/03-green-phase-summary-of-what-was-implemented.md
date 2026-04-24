# GREEN Phase Complete: AHQ-120 (e2e test)

**Jira**: [AHQ-120](https://agentic-hq.atlassian.net/browse/AHQ-120)
**Test Type**: e2e
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-04-24 19:31

---

## Implementation Created

**Files Created/Modified**:
- `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/scripts/infra/install-dev-temp-agentic-hq-with-colours.sh` — install script lifted verbatim from 001 (pnpm install + link --global; corepack check; smell warning referencing AHQ-79).
- `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/bin/temp-agentic-hq-with-colours.cjs` — CJS bin wrapper lifted verbatim from 001 (execFileSync tsx → main.ts; preserves the full AHQ-117 Add-On §9 comment block explaining why `AGENTIC_HQ_WORKSPACE_ROOT` must NOT be set here).
- `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/src/cli/main.ts` — 3-line entry lifted verbatim from 001 (side-effect import of override-registry FIRST, then `import { app } from 'agentic-hq/cli'`, then `app.run()`). Preserves the load-bearing-import-order comment block.
- `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/src/classwitch-registry/override-registry.ts` — override registry lifted verbatim from 001 (calls `rootServiceRegistry.overrideExistingServices({ WorkflowSearchResultsImpl: ... })` with `ColourfulWorkflowSearchResultsImpl`; service key is the concrete class name, not the interface name).
- `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts` — modified constructor to be optional-with-defaults, so classwitch's no-arg `new WorkflowSearchResultsClass()` in `agentic-hq/src/cli/app.ts:72` works. Added import of `AhqWorkspaceImpl`/`CurrentUserWorkspaceImpl` as values. Updated the prior REFACTOR NOTE comment to reflect the change has now been made (history preserved, tense updated, NOT deleted).

**Test Command**: `pnpm test:e2e` (in the 002 override project)
**Test Result**: ✅ PASSING — 1/1 test passes in 5.52s.

**Validate command** (`pnpm validate` = typecheck + 2/2 unit tests): ✅ PASSING.

---

## What Was Implemented

Four new files were added to the 002 override project to wire up the end-to-end Classwitch Override path: install script → globally-linked `temp-agentic-hq-with-colours` bin → CJS wrapper (execs tsx on main.ts) → main.ts (side-effect-imports override-registry then runs `app.run()` from agentic-hq/cli) → registry swap applies → `app.run()` instantiates `ColourfulWorkflowSearchResultsImpl` instead of `WorkflowSearchResultsImpl`. One existing file (the impl) was modified to make its constructor no-arg-safe for classwitch's `new Klass()` call site.

### Key implementation decisions:

1. **Verbatim lift from 001**: Four files (install script, bin wrapper, main.ts, override-registry) were copied verbatim from the AHQ-117 temp test project (`test-agentic-hq-classwitch-override-project-001-with-colours`). The AI summary and Jira both state 001 is the authoritative working reference, and 002 lives at the same directory depth, so the `file:../../agentic-hq` and `file:../../classwitch` paths in `package.json` are identical — no path tweaks required. This honours the "don't fork behaviour from 001" directive in the Jira.

2. **Optional-with-defaults constructor (the REFACTOR-NOTE from unit-GREEN)**: The impl's constructor was changed from required positional args to optional with defaults (`= new AhqWorkspaceImpl()` / `= new CurrentUserWorkspaceImpl()`). This is the pattern described in the how-to-guide Step 3 and is needed because `agentic-hq/src/cli/app.ts:72` calls `new WorkflowSearchResultsClass()` with zero args. Unit tests still pass positional stubs so they continue to exercise the injection path. Value imports of `AhqWorkspaceImpl`/`CurrentUserWorkspaceImpl` were added alongside the existing type-only imports. `agentic-hq/src/index.ts` already exports both as values — no agentic-hq changes required.

3. **Comment preservation and update, not deletion**: Per the "Do not delete existing comments" feedback memory, the prior REFACTOR NOTE in the impl file (which said "Optional-with-defaults will be added in the e2e GREEN cycle") was not removed. It was replaced with a new, fuller CONSTRUCTOR SHAPE comment block that (a) explains why optional-with-defaults is needed (the classwitch no-arg call site in `app.run()`), and (b) records the history: it was deliberately deferred from unit-GREEN because unit tests don't exercise that path. Future readers can see the design intent AND why the deferral happened.

4. **No bin-wrapper env-var mutation**: The bin wrapper deliberately omits any `process.env.X = ...` line — specifically NOT setting `AGENTIC_HQ_WORKSPACE_ROOT`. The comment block explains this is load-bearing (AHQ-117 Add-On §9): `app.run()` self-resolves its own location from `import.meta.url`, so overrides must leave the env var alone, otherwise they hide A's core workflows.

5. **REFACTOR deferrals (per Jira and RED doc)**: `README.md`, `eslint.config.js`, prettier config, how-to-guide review/TODOs, and extending `pnpm validate` to include e2e are all deliberately deferred to the REFACTOR phase. GREEN is minimal by design.

### Bugs found and fixed during GREEN:

None — implementation went as planned. The e2e test passed on first run after creating the four wiring files and making the constructor change. No debugging of log output was required.

## Files Created

- `scripts/infra/install-dev-temp-agentic-hq-with-colours.sh` (chmod +x applied)
- `bin/temp-agentic-hq-with-colours.cjs` (chmod +x applied)
- `src/cli/main.ts`
- `src/classwitch-registry/override-registry.ts`

## Files Modified

- `src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts` — added value imports of `AhqWorkspaceImpl`/`CurrentUserWorkspaceImpl`; made constructor args optional-with-defaults; replaced the interim REFACTOR NOTE with a permanent CONSTRUCTOR SHAPE comment block that preserves the history of why the change was deferred from unit-GREEN.

---

## Ready for REFACTOR Phase

The test is passing. This program should self terminate, and then (if you are running the automated workflow) the following command will be run automatically:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-120 e2e
```

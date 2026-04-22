# RED Phase Complete: AHQ-117 (unit test)

**Jira**: [AHQ-117](https://agentic-hq.atlassian.net/browse/AHQ-117)
**Test Type**: unit
**Phase**: RED (Failing Test Written)
**Generated**: 2026-04-20 16:01

---

## Test Created

**File**: `/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/tests/unit/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.unit.test.ts`

**What it verifies**: `ColourfulWorkflowSearchResultsImpl.getWorkflowsListingString()` wraps the literal header `Available workflows (with colours):` in ANSI green (`\x1b[32m...\x1b[0m`), the AHQ workspace's section in ANSI blue (`\x1b[34m...\x1b[0m`), and the user workspace's section in ANSI red (`\x1b[31m...\x1b[0m`). Uses two constructor-injected stub `Workspace`s with deterministic listing strings (`STUB_AHQ_SECTION` / `STUB_USER_SECTION`) so the assertion can verify the colour-wrapping is applied to the right sections, with no filesystem access.

**Why one test only**: Per Uncle Bob's three laws of TDD — write only as much test code as needed to fail. One failing import gives us a valid RED. The single colour-wrapping `it()` drives all four pieces of unique behaviour (class existence, constructor accepting two `Workspace` args, header text swap, three-colour wrapping). Additional behaviour (`registerWorkflowsWith` delegation, regression coverage of non-coloured behaviour) is covered by the e2e test cycle that follows this one.

**Failure Output** (vitest — module-resolution failure, expected for RED):
```
 ❯ |unit| tests/unit/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.unit.test.ts (0 test)

⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  |unit| tests/unit/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.unit.test.ts
Error: Cannot find module '../../../../src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.js' imported from /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/tests/unit/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.unit.test.ts
 ❯ tests/unit/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.unit.test.ts:10:1
      8| import { describe, expect, it, vi } from 'vitest';
      9|
     10| import { ColourfulWorkflowSearchResultsImpl } from '../../../../src/wo…
       | ^
     11|
     12| // Inline structural type aliases mirroring agentic-hq's Workspace + W…
```

**Failure Output** (`pnpm typecheck` — same root cause, TS2307):
```
tests/unit/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.unit.test.ts(10,52): error TS2307:
  Cannot find module '../../../../src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.js'
  or its corresponding type declarations.
```

Only ONE error in each failure output, and both point at the same missing module — the soon-to-be-implemented `ColourfulWorkflowSearchResultsImpl`. No other test-file-bug noise. ✅ Valid RED.

---

## Files Created

In the new temp override project at `/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/`:

- `package.json` — minimal scaffold (vitest, typescript, tsx, @types/node — versions matching `agentic-hq`).
- `tsconfig.json` — mirrors `agentic-hq`'s tsconfig (strict, ES2022, Bundler resolution, vitest globals).
- `vitest.unit.config.ts` — same shape as `agentic-hq`'s; `name: 'unit'`, `include: ['tests/unit/**/*.unit.test.ts']`.
- `.gitignore` — `node_modules/`, `dist/`.
- `tests/unit/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.unit.test.ts` — THE failing test.
- `node_modules/` (and lockfile) — populated by `pnpm install --ignore-workspace`.

In `agentic-hq/docs/jira-docs/AHQ-117/workflow-files/unit-test-files/`:

- `02-red-phase-failing-test-plan-copy.md` — copy of the approved plan.
- `02-red-phase-failing-tests.md` — this document.

**Note**: No skeleton/implementation files created in RED phase (no `src/...colourful-workflow-search-results-impl.ts`) — that's GREEN phase work.

---

## Approved Deviations From AHQ-120's "More Technical Details" Sketch

Both confirmed with Steve before writing the test (see plan-copy doc Context section):

1. **Constructor injection with optional defaults** chosen over AHQ-120's hard-coded field initialisers. Constructor signature in GREEN must be `constructor(ahqWorkspace?: Workspace, currentUserWorkspace?: Workspace)`, defaulting to `new AhqWorkspaceImpl()` / `new CurrentUserWorkspaceImpl()`. classwitch's no-arg `new Klass()` still works (defaults take over).
2. **Minimal RED scaffolding** — full override-repo layout (bin/, src/cli/, classwitch-registry/, scripts/infra/, README, eslint, prettier) deferred to the e2e RED cycle that follows this unit cycle.

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-117 unit
```

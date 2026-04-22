# Plan: AHQ-117 Unit Test RED Phase — `ColourfulWorkflowSearchResultsImpl`

## Context

We are executing the RED phase of TDD for the **unit** test type of [AHQ-117](https://agentic-hq.atlassian.net/browse/AHQ-117). AHQ-117 converts `agentic-hq` into a Classwitch Root Project and proves the override surface works by hand-building a temp override project at `/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/` whose `ColourfulWorkflowSearchResultsImpl` overrides `WorkflowSearchResults` to print the listing in ANSI colours.

Per the AI summary (Test Types section), there are **no new unit tests in the main `agentic-hq` repo** — the only new unit test for this Jira lives **inside the temp override project**. This RED phase therefore writes ONE unit test in that temp project's `tests/unit/...` tree, importing the not-yet-existing `ColourfulWorkflowSearchResultsImpl` class so it fails to compile/resolve. That is a valid TDD-RED failure (Uncle Bob's three laws: import-resolution failure counts as the RED).

A consequence of choosing this scope: the temp override project does **not exist yet** as a directory. Setting up the minimal scaffolding (directory layout + `package.json` + `tsconfig.json` + `vitest.unit.config.ts` + the test file) is **test infrastructure**, not production code, and is therefore in-scope for the RED phase. The `colourful-workflow-search-results-impl.ts` source file itself is **NOT** created here — that is GREEN phase work.

### Cross-Check Against AHQ-120 (Approved Deviations)

Two design points were cross-checked against [AHQ-120](https://agentic-hq.atlassian.net/browse/AHQ-120) (the sister Jira that builds the "real" temp override) and confirmed with Steve before writing this plan:

1. **Constructor injection with defaults — chosen over AHQ-120's hard-coded field initialisers.** AHQ-120's "More Technical Details" sketch shows `private readonly ahqWorkspace: Workspace = new AhqWorkspaceImpl()` (field-initialised, no constructor args). For this temp test override we instead give `ColourfulWorkflowSearchResultsImpl` an optional-arg constructor: `constructor(ahq?: Workspace, user?: Workspace)` defaulting to `new AhqWorkspaceImpl()` / `new CurrentUserWorkspaceImpl()`. classwitch's no-arg `new Klass()` still works (defaults take over), and the unit test can inject deterministic stubs via the constructor — matching Steve's `feedback_constructor_injection_delegation` preference. Steve approved the deviation.
2. **Minimal scaffolding for this RED phase — full override-repo layout deferred to the e2e cycle.** AHQ-120 §6 recommends structuring this temp test identically to a real override repo (bin/, src/cli/, classwitch-registry/, scripts/infra/) so AHQ-120 becomes "copy + rename + polish". The full structure WILL be created — but in the **e2e RED phase** that follows this unit cycle, since the unit test only needs the vitest scaffold. Steve approved this scoping.

Header text resolved to `Available workflows (with colours):` (with trailing colon) per AI summary Question 1 (Steve's clarification superseding AHQ-120's older sketch).

## Directory & File Layout (to be created)

```
/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/
├── package.json                                        ← scaffolding (RED)
├── tsconfig.json                                       ← scaffolding (RED)
├── vitest.unit.config.ts                               ← scaffolding (RED)
├── .gitignore                                          ← scaffolding (RED) — ignore node_modules
└── tests/
    └── unit/
        └── workflow-discovery/
            └── workflow-listing/
                └── colourful-workflow-search-results-impl.unit.test.ts   ← THE ONE FAILING TEST (RED)

# NOT created in RED (created later in GREEN):
# src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts
```

## Implementation Steps

### Step 0 — Copy this approved plan to the workflow folder (FIRST step after approval)

Copy this file verbatim to:
```
/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/jira-docs/AHQ-117/workflow-files/unit-test-files/02-red-phase-failing-test-plan-copy.md
```

### Step 1 — Create temp override project root

`mkdir -p` the path:
```
/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/tests/unit/workflow-discovery/workflow-listing
```

### Step 2 — Write `package.json` (minimal, vitest-only)

Minimal scaffold — just enough to run a vitest unit test. No `agentic-hq`/`classwitch` deps yet (those come in GREEN once `agentic-hq` exports are widened — for the unit test itself we keep it self-contained via inline structural typing).

Key fields:
- `"name": "temp-agentic-hq-with-colours"`
- `"type": "module"`
- `"private": true`
- Scripts: `"test:unit"`, `"typecheck"`, `"validate"` (matching agentic-hq's conventions; uses `vitest run` — never `vitest` alone, per CLAUDE.md watch-mode ban).
- Engines: pin to `node >=22 <23` and `pnpm >=10` to match the parent project.
- DevDeps: `vitest`, `typescript`, `@types/node`, `tsx`. Pin versions matching agentic-hq's `package.json` (vitest `^4.0.2`, typescript `^5.9.3`, `@types/node` `^25.0.9`, `tsx` `^4.20.6`).

### Step 3 — Write `tsconfig.json`

Mirror agentic-hq's tsconfig (target ES2022, module ESNext, moduleResolution Bundler, strict, noEmit, vitest globals + node types). `include` will list `src/**/*` and `tests/**/*` (`src/` is empty for now — that's fine).

### Step 4 — Write `vitest.unit.config.ts`

Identical shape to agentic-hq's: `name: 'unit'`, `include: ['tests/unit/**/*.unit.test.ts']`, `environment: 'node'`, `globals: true`.

### Step 5 — Write `.gitignore`

Just `node_modules/` and `dist/` — keep the temp project's git noise minimal.

### Step 6 — Write THE ONE failing unit test

File: `tests/unit/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.unit.test.ts`

Design (single `it()` block, asserts observable behaviour only):

- **Arrange**: Build two structural-typed stub objects shaped like `Workspace` (`getWorkflowListingString`, `registerWorkflowsWith`, `getRoot`, `getTempDir`, `getDotAgenticHqDir`, `isAhqWorkspace`). The AHQ stub returns the literal `"STUB_AHQ_SECTION"` from `getWorkflowListingString`; the user stub returns `"STUB_USER_SECTION"`. Both have `vi.fn()` for `registerWorkflowsWith`.
- **Act**: `const result: WorkflowSearchResults = new ColourfulWorkflowSearchResultsImpl(stubAhqWorkspace, stubUserWorkspace); const output = result.getWorkflowsListingString();`
- **Assert** (single `it()`, multiple `expect`s — all behavioural, no `instanceof`/private peeking, per Steve's feedback):
  - `output` contains `\x1b[32mAvailable workflows (with colours):\x1b[0m` (header wrapped in ANSI green)
  - `output` contains `\x1b[34mSTUB_AHQ_SECTION\x1b[0m` (AHQ section wrapped in ANSI blue)
  - `output` contains `\x1b[31mSTUB_USER_SECTION\x1b[0m` (user section wrapped in ANSI red)

Imports:
- `ColourfulWorkflowSearchResultsImpl` from a relative path under `src/...` — **does not exist** → this is the RED failure.
- `WorkflowSearchResults` interface — declared inline as a structural type alias inside the test file (kept self-contained until `agentic-hq` exports are widened in GREEN).
- `Workspace` interface — same: declared inline as a structural type alias matching `src/workflow-discovery/interfaces/workspace.ts:16`.

Why NOT split into a separate `it()` for `registerWorkflowsWith` delegation? Per Uncle Bob's three laws of TDD — write only as much test code as needed to fail. ONE failing import gives us the RED. The remaining behaviour (delegation to both workspaces, prevention of regressions in non-coloured behaviour) will be covered by additional tests in subsequent TDD cycles or — more likely — by the e2e test cycle that follows. The single colour-wrapping test is the highest-value RED because it drives all four pieces of unique behaviour (class existence, constructor accepting two `Workspace` args, header swap, three-colour wrapping).

Brief test header comment (3–4 lines) explaining what the test verifies — for the human reviewer's quick orient.

### Step 7 — Run `pnpm install` inside the temp project

Required so vitest is on `node_modules/.bin`. This is the one command that mutates state in the temp project; it's safe (just installs into the new isolated dir).

### Step 8 — Run the test using the AC-prescribed command

```
cd /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours
pnpm test:unit
```

Expected outcome: ✅ RED-correct failure — vitest reports `Cannot find module '.../src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl'` (or the equivalent ESM "ERR_MODULE_NOT_FOUND" / "Failed to resolve import" form). Capture the exact failure text for the RED phase doc.

If the failure is for any OTHER reason (typo in test, vitest config wrong, missing `@types/node` type errors), fix the **test infrastructure** until the only remaining failure is the missing module.

### Step 9 — Run `pnpm typecheck` inside the temp project

Per command Step 7f. Expected:
- Type errors in the **test file** → fix immediately (e.g. missing `@types/node`).
- Type error of the form "Cannot find module './src/.../colourful-workflow-search-results-impl'" or the structural inline-type version → **expected and correct** — that's the RED.

### Step 10 — Create RED phase document

Write `docs/jira-docs/AHQ-117/workflow-files/unit-test-files/02-red-phase-failing-tests.md` per command Step 8 template (test path, exact failure output captured from Step 8, list of files created, link to next GREEN command).

### Step 11 — Add comment to AHQ-117 in Jira

Use `mcp__mcp-atlassian__jira_add_comment` per command Step 9 template.

### Step 12 — Tell the human what happened

Per command Step 10 — short summary, test path, failure reason, link to RED doc.

### Step 13 — Write `command-output.json`

Write to `{command-input-output-files-directory}/command-output.json` with `{"command-output-string": "RED phase complete for test-type unit"}`.

### Step 14 — Self-terminate

Invoke `/agentic-hq-core-plugin:self-termination`.

### Step 15 — Recheck all command steps executed

Re-read `02-jira-write-failing-test.md` and confirm every step has been done. (This is the command's required final step.)

## English Language Description

When the unit test runs, vitest creates a stub **AhqWorkspace** and a stub **CurrentUserWorkspace** (both structural-typed `Workspace` shapes), pre-loaded so each one *getWorkflowListingString* returns a deterministic string (`"STUB_AHQ_SECTION"` and `"STUB_USER_SECTION"`). The test passes both stubs to a new **ColourfulWorkflowSearchResultsImpl** via constructor injection. The test then asks the **ColourfulWorkflowSearchResultsImpl** to *getWorkflowsListingString*. Internally the **ColourfulWorkflowSearchResultsImpl** asks its AHQ **Workspace** to *getWorkflowListingString*, asks its user **Workspace** to *getWorkflowListingString*, wraps the literal header `Available workflows (with colours):` in ANSI green, wraps the AHQ section in ANSI blue, wraps the user section in ANSI red, and returns the concatenated string. The test inspects the returned string and asserts each of the three sections is wrapped in its prescribed ANSI colour pair. Because **ColourfulWorkflowSearchResultsImpl** does not yet exist on disk, the test never gets to run — vitest reports a module-resolution failure, which is the RED-phase signal that the implementation is missing.

## Project Design Requirements Compliance

Per `docs/dev/project-design-requirements.md`:

- **Class/interface pair for every concept** — Validated: the test imports `ColourfulWorkflowSearchResultsImpl` (the impl) and types its variable as `WorkflowSearchResults` (the interface), proving both halves of the pair exist and are honoured. The `Workspace` stubs are structural-typed against the existing `Workspace` interface.
- **"Make every concrete class switchable"** — Validated indirectly: `ColourfulWorkflowSearchResultsImpl` exists *because* `WorkflowSearchResults` is being made switchable in this Jira; the test is the proof-by-construction of that promise.
- **Constructor injection / "tell, don't ask"** — Validated: the test passes both `Workspace` collaborators in via the constructor (Steve's `feedback_constructor_injection_delegation`) and observes only externally-visible behaviour — the returned string. No `instanceof`, no private-field peeking, no prototype-identity checks (Steve's `feedback_no_instanceof_in_tests`).
- **Avoid cached state** — Validated: the test only inspects the return value of `getWorkflowsListingString()`. It does not assert on internal fields of `ColourfulWorkflowSearchResultsImpl`. The impl, when written in GREEN, is expected to follow the same lazy-delegation pattern as `WorkflowSearchResultsImpl`.
- **State management requirements** (e.g. no extra cached state inside the impl) — cannot be validated at the test level; will be checked in GREEN/REFACTOR by code inspection of the impl file.
- **Tests assert behaviour, not implementation details** — Validated: assertions check the returned string contents. No structural introspection.
- **Data Dictionary / English Language Description sections in the planning doc** — Steve confirmed in the AI summary (Question 6) these are skipped for this conversion Jira (no new concepts introduced; `ColourfulWorkflowSearchResultsImpl` is just a colour-wrapping variant of an existing concept). The ELD section above this one is provided anyway as a sanity-check on the test design.

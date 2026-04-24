# AHQ-120 RED Phase Plan — Unit Tests for `ColourfulWorkflowSearchResultsImpl`

## Context

AHQ-120 creates a **TEMP Classwitch Override Project** at
`/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/`
that overrides `agentic-hq`'s default `WorkflowSearchResultsImpl` with an
ANSI-coloured variant `ColourfulWorkflowSearchResultsImpl` (green header, blue
AHQ section, red user section).

This RED phase writes the failing **unit tests** for the new class. Per the
**human directive in the summary file**:

> "Write BOTH unit tests in the RED phase, and make BOTH pass in the GREEN
> phase. Ignore any 'write one test at a time' instruction."

Both tests go in **one file** (per the "one test file per class" feedback
memory), and both must fail in RED.

Per Uncle Bob's 3 Laws of TDD, we must write **just enough** test infrastructure
to make the test run and fail. The implementation file
(`colourful-workflow-search-results-impl.ts`) will NOT be created in RED — its
absence **IS** the RED-phase failure (compilation / module-not-found).

---

## Data Dictionary

(All concepts already established by AHQ-117 and `agentic-hq` public exports.
No new concepts introduced in this Jira — just a new concrete class.)

| Concept                  | Interface              | Impl Class                          | Notes                                                                  |
| ------------------------ | ---------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| Workflow search results  | `WorkflowSearchResults` | `ColourfulWorkflowSearchResultsImpl` | **New** in 002. Swapped in for the default via Classwitch registry.    |
| A workspace              | `Workspace`            | `AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl` | Imported from `agentic-hq`. Stubbed in unit tests.              |
| Workflow registry        | `WorkflowRegistry`     | (test: stub)                        | Passed into `registerWorkflowsWith`. Stubbed in unit tests.            |

---

## English Language Description

When the overridden `temp-agentic-hq-with-colours list` CLI command runs,
`agentic-hq`'s `app.run()` asks the Classwitch root registry to load a
`WorkflowSearchResults`. Because the override registry has already swapped the
default class, the registry returns a **ColourfulWorkflowSearchResultsImpl**.
The CLI then asks the **ColourfulWorkflowSearchResultsImpl** to
*getWorkflowsListingString*.

The **ColourfulWorkflowSearchResultsImpl** wraps the header literal
`"Available workflows (with colours):"` in green ANSI codes, asks its
injected AHQ **Workspace** to *getWorkflowListingString* and wraps that result
in blue ANSI codes, then asks its injected user **Workspace** to
*getWorkflowListingString* and wraps that result in red ANSI codes. It joins
them with `\n\n` separators and returns the combined string.

When workflow registration is needed, the CLI asks the
**ColourfulWorkflowSearchResultsImpl** to *registerWorkflowsWith* a
**WorkflowRegistry**. The impl asks each of its two injected **Workspace**s to
*registerWorkflowsWith* the same registry.

The unit tests substitute the two **Workspace**s with stubs (plain objects with
`vi.fn()` where needed) and assert on the returned string (Test 1) and on the
method calls made to the stubs (Test 2).

---

## Project Design Requirements Compliance

Read `docs/dev/project-design-requirements.md` (found). How the planned test
approach aligns:

- **Interface / concrete-class pair** — Tests validate that
  `ColourfulWorkflowSearchResultsImpl` *is assignable to* `WorkflowSearchResults`
  (by declaring `const result: WorkflowSearchResults = new ColourfulWorkflowSearchResultsImpl(...)`
  in Test 1). This indirectly validates that the class implements the interface.
- **Tell, don't ask / Avoid cached state** — Test 2 asserts that the impl
  *tells* each Workspace to register workflows, rather than asking for state.
  Cached-state compliance will be enforced in REFACTOR (look at constructor
  fields only; no listing-string cache).
- **Constructor injection + optional-with-defaults** — Both tests pass two
  Workspace stubs into the constructor. The default-arg flavour (no-arg
  `new Klass()`) can't be unit-tested without real filesystem access, so it
  is deferred to the e2e test.
- **No `instanceof` / no structural introspection** — The tests assert on
  observable behaviour: returned string contents (Test 1) and whether stubbed
  method was called (Test 2). No `instanceof`, no private-field peeking.
- **Unit test file per class** — One test file, named for the impl class:
  `colourful-workflow-search-results-impl.unit.test.ts`.
- **Classwitch Root/Override file comments** — Design-intent comments on
  `main.ts`, `bin/*.cjs`, `override-registry.ts`, and the impl file are a
  GREEN/REFACTOR concern — not RED. Noted for REFACTOR list.

Requirements validated only in GREEN/REFACTOR (not at test level): state-cache
avoidance inside the impl, SRP comment header on the impl class, the three
load-bearing comment blocks (main, bin wrapper, override registry).

---

## Plan Steps

### Step 0 — Copy this approved plan

Copy this plan file (`/Users/stevepersonal/.claude/plans/eager-sprouting-lighthouse.md`)
verbatim to:
```
/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/jira-docs/AHQ-120/workflow-files/unit-test-files/02-red-phase-failing-test-plan-copy.md
```

Create the parent directory `unit-test-files/` first.

**This is Step 0 — do it before any other implementation step.**

---

### Step 1 — Create minimal 002 project skeleton

Create directory:
```
/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/
```

Create ONLY the files needed to run the unit tests. Lift verbatim from the 001
reference project (`temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/`),
adjusting only what's needed:

- `package.json` — lift from 001. Fields identical except:
  - `description` updated to reference AHQ-120 (practice run for AHQ-121/122)
    instead of AHQ-117.
  - `file:` paths remain `file:../../agentic-hq` and `file:../../classwitch`
    (002 lives at the same depth as 001 — verified).
- `tsconfig.json` — lift verbatim from 001 (target ES2022, moduleResolution
  Bundler, `allowImportingTsExtensions`, vitest/globals + node types).
- `vitest.unit.config.ts` — lift verbatim from 001.
- `.gitignore` — lift verbatim from 001 (`node_modules/`, `dist/`).

**Deliberately NOT created in RED** (these are GREEN-phase or later-REFACTOR
deliverables):
- `src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts`
  — its absence IS the RED failure
- `src/cli/main.ts`, `src/classwitch-registry/*`, `bin/*.cjs` — not needed to
  run unit tests
- `scripts/infra/install-dev-*.sh` — e2e-phase concern
- `README.md`, `eslint.config.js`, prettier config, `vitest.e2e.config.ts` —
  documented as Jira deliverables for later TDD cycles/REFACTOR

---

### Step 2 — Install dependencies

Run `pnpm install` inside the 002 directory so that `agentic-hq` and
`classwitch` are linked into `node_modules/`. This is **test infrastructure,
not production code** — without it, the test's `import type { … } from 'agentic-hq'`
cannot resolve and we won't get a clean RED signal from the missing impl file.

Expected outcome: `node_modules/agentic-hq` and `node_modules/classwitch`
symlinks are in place.

---

### Step 3 — Write the unit test file

Create:
```
tests/unit/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.unit.test.ts
```

Lift the shape from 001's test, with TWO upgrades:

1. **Replace inline structural type aliases with real imports from
   `'agentic-hq'`** (now possible post AHQ-117). Remove the `interface Workspace`,
   `interface WorkflowRegistry`, `interface WorkflowSearchResults` inline
   declarations. Import them as types from `'agentic-hq'`.
2. **Add Test 2** (register-workflows delegation) — not present in 001's test.

Contents (sketch; final version may differ in minor styling):

```ts
/**
 * Tests ColourfulWorkflowSearchResultsImpl — AHQ-120's ANSI-coloured variant
 * of WorkflowSearchResults. Header → green, AHQ section → blue, user → red.
 * Two tests: one for listing output wrapping, one for register-workflows
 * delegation. Constructor-injected stub Workspaces keep the unit test
 * filesystem-free.
 */
import { describe, expect, it, vi } from 'vitest';
import type {
  Workspace,
  WorkflowRegistry,
  WorkflowSearchResults,
} from 'agentic-hq';

import { ColourfulWorkflowSearchResultsImpl } from '../../../../src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.js';

const STUB_AHQ_LISTING = 'STUB_AHQ_SECTION';
const STUB_USER_LISTING = 'STUB_USER_SECTION';

const makeStubWorkspace = (listing: string, isAhq: boolean): Workspace => ({
  getWorkflowListingString: () => listing,
  registerWorkflowsWith: vi.fn(),
  getRoot: () => (isAhq ? '/stub/ahq' : '/stub/user'),
  getTempDir: () => (isAhq ? '/stub/ahq/.agentic-hq/temp' : '/stub/user/.agentic-hq/temp'),
  getDotAgenticHqDir: () => (isAhq ? '/stub/ahq/.agentic-hq' : '/stub/user/.agentic-hq'),
  isAhqWorkspace: () => isAhq,
});

describe('ColourfulWorkflowSearchResultsImpl', () => {
  it('wraps the header in green, AHQ section in blue, and user section in red ANSI codes', () => {
    const stubAhq = makeStubWorkspace(STUB_AHQ_LISTING, true);
    const stubUser = makeStubWorkspace(STUB_USER_LISTING, false);

    const result: WorkflowSearchResults = new ColourfulWorkflowSearchResultsImpl(
      stubAhq,
      stubUser
    );

    const output = result.getWorkflowsListingString();

    expect(output).toContain('\x1b[32mAvailable workflows (with colours):\x1b[0m');
    expect(output).toContain(`\x1b[34m${STUB_AHQ_LISTING}\x1b[0m`);
    expect(output).toContain(`\x1b[31m${STUB_USER_LISTING}\x1b[0m`);
  });

  it('registerWorkflowsWith delegates to both workspaces with the registry', () => {
    const stubAhq = makeStubWorkspace(STUB_AHQ_LISTING, true);
    const stubUser = makeStubWorkspace(STUB_USER_LISTING, false);
    const stubRegistry = {} as WorkflowRegistry;

    const result: WorkflowSearchResults = new ColourfulWorkflowSearchResultsImpl(
      stubAhq,
      stubUser
    );

    result.registerWorkflowsWith(stubRegistry);

    expect(stubAhq.registerWorkflowsWith).toHaveBeenCalledTimes(1);
    expect(stubAhq.registerWorkflowsWith).toHaveBeenCalledWith(stubRegistry);
    expect(stubUser.registerWorkflowsWith).toHaveBeenCalledTimes(1);
    expect(stubUser.registerWorkflowsWith).toHaveBeenCalledWith(stubRegistry);
  });
});
```

Notes on the Q1 answer already resolved by the human: header text is
**WITH colon** — `"Available workflows (with colours):"` — matching 001's
already-tested pattern.

---

### Step 4 — Run `pnpm test:unit` and confirm RED

From inside 002 directory:
```
pnpm test:unit
```

**Expected failure (valid RED):**
- `Cannot find module '.../src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.js'`
  (the impl file has not been created yet)

If test fails for any reason OTHER than missing impl (e.g. typo in test,
misconfigured vitest, missing `@types/node`), **fix the TEST file** and rerun.
Do NOT create the impl — that's GREEN.

Capture the exact failure message for the RED phase summary doc.

---

### Step 5 — Run `pnpm validate` (typecheck + test) to sanity-check

From inside 002 directory:
```
pnpm validate
```

Expected outcome: typecheck may complain about the missing impl module; that's
the same RED signal as step 4 in a different form. Test suite fails for the
same reason. **Neither should fail from test-file bugs** — if either does, fix
the test and re-run.

---

### Step 6 — Write RED phase summary doc

Create:
```
docs/jira-docs/AHQ-120/workflow-files/unit-test-files/02-red-phase-failing-tests.md
```

Following the template in `02-jira-write-failing-test.md` Step 8 — includes
test file path, tests summary, failure output pasted verbatim, files created
list, and "Ready for GREEN Phase" section.

---

### Step 7 — Add Jira comment

Use `mcp__mcp-atlassian__jira_add_comment` to add:

```
AI Agent has completed RED phase for unit test.
Test Created At: temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/tests/unit/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.unit.test.ts
Test Fails With: Cannot find module colourful-workflow-search-results-impl.js (as expected - impl not created yet).
Documented at: docs/jira-docs/AHQ-120/workflow-files/unit-test-files/02-red-phase-failing-tests.md
Next: GREEN phase to get both tests passing with minimal implementation.
```

---

### Step 8 — Report to human + write command-output.json + self-terminate

- Present the RED-phase completion summary to the human.
- Write `command-output.json` at
  `{command-input-output-files-directory}/command-output.json` with
  `{"command-output-string":"RED phase complete for test-type unit"}`.
- Invoke the self-termination skill `/agentic-hq-core-plugin:self-termination`.

---

### Step 9 — Recheck command completion

**Last step:** Recheck that all commands have been executed in the
`02-jira-write-failing-test.md` command — specifically:

- [ ] Step 0: command-input.json read
- [ ] Step 0b: variables established
- [ ] Step 1: jira-id + test-type validated
- [ ] Step 2: ai-summary file checked (exists)
- [ ] Step 3: unit-test-files directory created
- [ ] Step 4: no pre-existing red-phase file (verified)
- [ ] Step 5: context read (done in exploration phase)
- [ ] Step 6: test identified (per human directive in summary file)
- [ ] Step 7a: plan presented, approved, and copied to workflow dir
- [ ] Step 7b-f: test file written, infra set up, `pnpm test:unit` run, typecheck run
- [ ] Step 8: RED phase summary doc written
- [ ] Step 9: Jira comment added
- [ ] Step 10: human briefed
- [ ] Step 11: command-output.json written
- [ ] Step 12: self-termination invoked

**IMPORTANT — If anything was not addressed, refer back to the full text of
`02-jira-write-failing-test.md` (in
`~/.claude/plugins/cache/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/`)
for the authoritative step instructions. This plan is a condensed
execution guide; the command file is the source of truth.**

---

## Files Created / Modified

### Created

- `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/jira-docs/AHQ-120/workflow-files/unit-test-files/02-red-phase-failing-test-plan-copy.md` (Step 0)
- `/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/` (Step 1, new directory)
- `…002…/package.json` (Step 1)
- `…002…/tsconfig.json` (Step 1)
- `…002…/vitest.unit.config.ts` (Step 1)
- `…002…/.gitignore` (Step 1)
- `…002…/node_modules/` (Step 2, via `pnpm install`)
- `…002…/pnpm-lock.yaml` (Step 2, generated by `pnpm install`)
- `…002…/tests/unit/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.unit.test.ts` (Step 3)
- `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/jira-docs/AHQ-120/workflow-files/unit-test-files/02-red-phase-failing-tests.md` (Step 6)

### Modified

- None (this is a new project skeleton).

### Not Created In RED (deferred to GREEN or later)

- `…002…/src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts` — GREEN
- `…002…/src/cli/main.ts`, `…002…/src/classwitch-registry/override-registry.ts`, `…002…/bin/*.cjs`, install script — needed for e2e test cycle, not unit
- `README.md`, `eslint.config.js`, prettier config, `vitest.e2e.config.ts`, the e2e test itself — e2e test cycle / REFACTOR

---

## Verification

After the plan is executed, verify:

1. `pnpm test:unit` inside 002 fails with a clear "module not found" error for
   `colourful-workflow-search-results-impl.js` (not a test-file bug).
2. The failure message is captured verbatim in the RED phase summary doc.
3. Both tests are present in the single test file (Test 1: colour wrapping;
   Test 2: register-workflows delegation).
4. The test file imports types from `'agentic-hq'` (not inline structural
   aliases).
5. No impl file has been created (RED hygiene).
6. The plan file has been copied to the workflow-files directory as Step 0.

---

## REFACTOR Notes (parked — act on in REFACTOR phase)

- Header-text comment: the Jira literal says "Available workflows (with colours)"
  (no colon) but the resolved answer in the summary file is "with colon". If
  humans want to revisit the Jira literal later, consider a Jira description
  amendment. For now: colon wins per Q1 resolution.
- `commander` as a direct dep in 002's `package.json`: keep (per Q3) but raise a
  note in the how-to guide about whether it's actually needed.
- No prettier/eslint/vitest-e2e configs yet — these are part of later TDD
  cycles / REFACTOR deliverables per Jira AC.
- Lift design-intent comment blocks from 001 into 002's `main.ts`, `bin/*.cjs`,
  `override-registry.ts`, and the impl file — done in GREEN/REFACTOR.

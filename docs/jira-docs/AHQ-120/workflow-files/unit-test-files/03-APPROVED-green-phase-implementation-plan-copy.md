# AHQ-120 GREEN Phase Plan — Minimal Implementation of `ColourfulWorkflowSearchResultsImpl`

## Context

AHQ-120 is building a **TEMP Classwitch Override Project** at
`/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/`
that overrides `agentic-hq`'s default `WorkflowSearchResultsImpl` with an ANSI-coloured variant.

The RED phase has been completed — two failing unit tests exist at
`tests/unit/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.unit.test.ts`,
both currently failing with `Cannot find module '../../../../src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.js'`.

This plan creates the **minimum** `ColourfulWorkflowSearchResultsImpl` class to make both unit tests pass — nothing more. No defaults on the constructor (the e2e cycle will add those), no additional public surface, no CLI wiring, no bin wrapper, no other files.

---

## Jira Requirements (Numbered)

Going through AHQ-120 and pulling out every requirement. Only requirements relevant to the **unit-test GREEN phase** map into this plan; out-of-scope items are flagged explicitly.

1. Create `ColourfulWorkflowSearchResultsImpl` at `src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts` → [Step 1: Create impl file]
2. Class must `implement WorkflowSearchResults` (from `agentic-hq`) → [Step 1: `implements WorkflowSearchResults`]
3. `getWorkflowsListingString()` wraps header in green (`\x1b[32m…\x1b[0m`) → [Step 1: `getWorkflowsListingString()`]
4. Header text is `Available workflows (with colours):` (with colon — per resolved Q1 in AI summary) → [Step 1: `HEADER` constant]
5. AHQ-workspace section wrapped in blue (`\x1b[34m…\x1b[0m`) → [Step 1: `getWorkflowsListingString()`]
6. User-workspace section wrapped in red (`\x1b[31m…\x1b[0m`) → [Step 1: `getWorkflowsListingString()`]
7. `registerWorkflowsWith(registry)` delegates to both workspaces → [Step 1: `registerWorkflowsWith()`]
8. Constructor accepts two `Workspace`s (AHQ + user), constructor-injected → [Step 1: constructor signature]
9. Both tests in the file must pass after GREEN → [Step 2: run `pnpm test:unit`]
10. Optional-with-defaults constructor args (so Classwitch can `new Klass()`) → **Deferred to e2e GREEN cycle.** Tests pass both args explicitly; adding defaults now is gold-plating that would break the e2e RED signal.
11. `main.ts`, `bin/*.cjs`, `override-registry.ts` — load-bearing override plumbing → **Out of scope for unit cycle** (tests don't exercise these). Added in the e2e GREEN cycle.
12. `README.md`, `eslint.config.js`, prettier config, `vitest.e2e.config.ts`, e2e test itself → **Out of scope for unit cycle.** Added in the e2e cycle / REFACTOR.
13. How-to-guide review / fixes → **Out of scope for GREEN.** Noted in REFACTOR list.
14. Unit test must pass 100% → [Step 2: verify all green]
15. `pnpm validate` (typecheck + test) must pass → [Step 3: run `pnpm validate`]
16. **AC**: "TDD methodology followed" — GREEN phase exists and is minimal → [This plan; Step 1 adds only what tests need]

---

## Project Design Requirements Compliance

Source: `docs/dev/project-design-requirements.md` (found). How each relevant requirement maps to this plan:

| #   | Design Requirement                                                                       | Plan Section Addressing It                                                                         | Notes                                                                                                                                                                                           |
| --- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D.1 | Interface / concrete-class pair for every concept                                        | Step 1: class `implements WorkflowSearchResults`                                                   | `WorkflowSearchResults` interface already exists in `agentic-hq`. New concrete class `ColourfulWorkflowSearchResultsImpl` follows the `…Impl` naming convention.                                 |
| D.2 | Tell don't ask                                                                           | Step 1: `getWorkflowsListingString()` asks each Workspace to `getWorkflowListingString()`; `registerWorkflowsWith()` delegates | No state extraction — wraps the returned string and returns; no conditional on workspace internals.                                                                                              |
| D.3 | Avoid cached state / derive on each call                                                 | Step 1: no instance fields cache the listing; every call recomputes from workspace calls           | Only fields are the two injected `Workspace`s (minimal source data).                                                                                                                             |
| D.4 | Switchable concrete classes — keep override points easy                                  | Step 1: constructor injects `Workspace`s via interface type                                        | Third parties can construct with their own `Workspace` impls.                                                                                                                                    |
| D.5 | Classwitch Override file must carry design-intent comment (per feedback memory)          | Step 1: file-level JSDoc block at top of impl file                                                 | Lift the design-intent block from the 001 reference file — it explains why this class exists and how the override registry wires it in.                                                         |
| D.6 | Concept Table / Data Dictionary / English Language Description during planning          | Already present in the RED-phase plan; no new concepts introduced in GREEN                         | GREEN adds no new concepts — `ColourfulWorkflowSearchResultsImpl` was already in the RED Concept Table. Not duplicating the table here.                                                          |
| D.7 | "No instanceof / no private-field peeking" in tests                                      | N/A in GREEN (test code unchanged)                                                                 | Tests observe behaviour (returned string / method-call assertions) — already compliant per RED.                                                                                                  |

**GREEN-phase deferred items** (explicitly not meeting the full design requirement yet — to be addressed in REFACTOR or e2e cycle):

- **Optional-with-defaults constructor args** (needed for Classwitch's no-arg `new Klass()` call site) → deferred to e2e GREEN so the e2e RED properly fails on the missing override wiring rather than pre-working via defaults.

---

## Plan Steps

### Step 0 — Copy this approved plan (FIRST, before any code)

Copy this file to:

```
/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/jira-docs/AHQ-120/workflow-files/unit-test-files/03-APPROVED-green-phase-implementation-plan-copy.md
```

This must happen **before** any implementation work.

---

### Step 1 — Create the impl file

**File**: `/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts`

**Contents** (strictly minimal for tests + required design-intent header comment):

```ts
/**
 * ColourfulWorkflowSearchResultsImpl — AHQ-120's ANSI-coloured variant of
 * agentic-hq's default `WorkflowSearchResultsImpl`.
 *
 * Why this file exists (Classwitch Override surface):
 *   Implements the same `WorkflowSearchResults` interface as the root
 *   `WorkflowSearchResultsImpl` but wraps each section in ANSI colour codes
 *   (green header, blue AHQ section, red user section). The override project's
 *   registry module calls
 *   `rootServiceRegistry.overrideExistingServices({ WorkflowSearchResultsImpl: ... })`
 *   to swap this class in *before* `app.run()` is invoked.
 *
 * SRP Does: Ask each Workspace for its listing string and wrap it (plus the
 *   header literal) in ANSI colour codes.
 * SRP Knows About: The colour codes, the header literal, and the two
 *   Workspaces (constructor-injected).
 * SRP Knows Nothing About: How workspaces find plugins, how the CLI is wired,
 *   or how the override registry plugs this class in.
 *
 * REFACTOR NOTE: constructor args are required in GREEN (strict minimum to
 * pass the unit tests). Optional-with-defaults (needed for Classwitch's no-arg
 * `new Klass()` call site) will be added in the e2e GREEN cycle when that
 * wiring is actually exercised.
 */
import type {
  WorkflowRegistry,
  WorkflowSearchResults,
  Workspace,
} from 'agentic-hq';

const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const HEADER = 'Available workflows (with colours):';
const SECTION_SEPARATOR = '\n\n';

export class ColourfulWorkflowSearchResultsImpl
  implements WorkflowSearchResults
{
  constructor(
    private readonly ahqWorkspace: Workspace,
    private readonly currentUserWorkspace: Workspace
  ) {}

  getWorkflowsListingString(): string {
    const header = `${GREEN}${HEADER}${RESET}`;
    const ahqSection = `${BLUE}${this.ahqWorkspace.getWorkflowListingString()}${RESET}`;
    const userSection = `${RED}${this.currentUserWorkspace.getWorkflowListingString()}${RESET}`;
    return `${header}${SECTION_SEPARATOR}${ahqSection}${SECTION_SEPARATOR}${userSection}`;
  }

  registerWorkflowsWith(registry: WorkflowRegistry): void {
    this.ahqWorkspace.registerWorkflowsWith(registry);
    this.currentUserWorkspace.registerWorkflowsWith(registry);
  }
}
```

**Key implementation decisions:**

1. **Required-args constructor** (not optional-with-defaults) — tests pass both workspaces explicitly; defaults aren't exercised by unit tests. Deferring defaults keeps the e2e RED signal honest (the e2e path uses Classwitch's no-arg construction, which needs the defaults — if I add them now, the e2e RED won't fail for the right reason).
2. **Only `import type`** from `agentic-hq` — no runtime imports needed (no defaults = no need for `AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl`). Keeps the module truly minimal.
3. **Lift colour constants + HEADER literal + section-separator from 001 reference** — identical values, same layout. Tests assert on the exact literal `Available workflows (with colours):` wrapped in green.
4. **Design-intent JSDoc block at top of file** — required by the `feedback_classwitch_root_project_comments.md` memory; this is a Classwitch Override file.
5. **REFACTOR note in the header comment** — documents the deferred defaults decision so future readers (and the e2e GREEN agent) know why they're absent.

---

### Step 2 — Run the unit tests (expect both pass)

From inside the 002 project directory:

```
cd /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120
pnpm test:unit
```

Expected: both tests pass (2/2 green). The previously-failing `Cannot find module` error should be gone.

If a test fails: read the error, fix **only** what the failure indicates, re-run. Do not add any extra code beyond what the failure message requires.

---

### Step 3 — Run `pnpm validate` (typecheck + tests)

```
cd /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120
pnpm validate
```

Expected: typecheck passes, tests pass. (No lint step exists yet — `eslint.config.js` is deferred to the e2e cycle / REFACTOR per AI summary.)

---

### Step 4 — TODO: re-read the command file for documentation/Jira-comment/self-termination steps

After Step 3 is green, re-read
`/Users/stevepersonal/.claude/plugins/cache/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/03-jira-minimal-implementation.md`
(or whatever the invoked command path is) from Step 7b onwards to do:

- Step 7b guidance (unit: `pnpm test` already run as part of validate — nothing more needed).
- Step 7c: check for manual AC tests — none for the unit cycle (all manual ACs live in the e2e/install path).
- Step 8: create the GREEN-phase summary doc at
  `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/jira-docs/AHQ-120/workflow-files/unit-test-files/03-green-phase-summary-of-what-was-implemented.md`.
- Step 9: add a Jira comment to AHQ-120 via `mcp__mcp-atlassian__jira_add_comment`.
- Step 10: tell the human.
- Step 11: write `command-output.json`.
- Step 12: self-terminate via `/agentic-hq-core-plugin:self-termination`.

Do **not** inline those instructions here — the command file is the source of truth.

---

## Files Created / Modified

**Created (1 file)**:

- `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts`

**Modified**: none.

**Documentation (written via follow-up workflow steps 0 and 8, not "code")**:

- `docs/jira-docs/AHQ-120/workflow-files/unit-test-files/03-APPROVED-green-phase-implementation-plan-copy.md` (Step 0 — this plan)
- `docs/jira-docs/AHQ-120/workflow-files/unit-test-files/03-green-phase-summary-of-what-was-implemented.md` (Step 8)

---

## Verification (End-to-End)

1. `pnpm test:unit` from inside the 002 project → 2 tests pass.
2. `pnpm validate` from inside the 002 project → typecheck + tests both pass.
3. Inspect the generated file to confirm it's the minimum that makes the tests pass (no defaults, no runtime imports of `AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl`, design-intent comment preserved).

---

## What's Deliberately Out Of Scope For This GREEN

- `src/cli/main.ts`, `bin/temp-agentic-hq-with-colours.cjs`, `src/classwitch-registry/override-registry.ts`, `scripts/infra/install-dev-*.sh` — e2e cycle.
- `README.md`, `eslint.config.js`, prettier config, `vitest.e2e.config.ts`, `tests/e2e/...` — e2e cycle / REFACTOR.
- Optional-with-defaults constructor args — e2e GREEN.
- How-to-guide review/fixes — REFACTOR.
- Any refactor / tidy-up of the new impl file — REFACTOR phase.

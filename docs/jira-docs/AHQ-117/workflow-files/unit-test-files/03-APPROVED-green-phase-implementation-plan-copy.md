# Plan: AHQ-117 Unit Test GREEN Phase — Minimal `ColourfulWorkflowSearchResultsImpl`

## Context

We are executing the **GREEN phase** of TDD for the **unit** test type of [AHQ-117](https://agentic-hq.atlassian.net/browse/AHQ-117). The RED phase created a single failing unit test at `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/tests/unit/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.unit.test.ts` that imports a not-yet-existing `ColourfulWorkflowSearchResultsImpl` class. `pnpm test:unit` currently fails with `Cannot find module '.../src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.js'` — a valid RED.

GREEN phase goal: write **only** the minimum code to turn that one test green. No CLI wrapper, no `agentic-hq` imports, no constructor defaults, no `registerWorkflowsWith` delegation verification, no override registry wiring. Those all belong to the e2e cycle that follows this unit cycle.

## Jira Requirements (Numbered)

These are the per-requirement bullets that apply *to this unit-GREEN step only* (full Jira has many more items that belong in the e2e cycle):

1. **Test must turn GREEN**: `cd temp-test-workspaces/.../ && pnpm test:unit` passes. → [Step 3: Run test]
2. **Class exists**: `ColourfulWorkflowSearchResultsImpl` exported from `src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts` inside the temp override project. → [Step 2: Create impl]
3. **Constructor accepts two `Workspace` args** (AHQ workspace, current user workspace). → [Step 2: Create impl]
4. **Header wrapped in ANSI green**: output contains `\x1b[32mAvailable workflows (with colours):\x1b[0m` (header literal from Jira AC, green `\x1b[32m` + reset `\x1b[0m`). → [Step 2: Create impl]
5. **AHQ section wrapped in ANSI blue**: output contains `\x1b[34m<ahq-listing>\x1b[0m`. → [Step 2: Create impl]
6. **User section wrapped in ANSI red**: output contains `\x1b[31m<user-listing>\x1b[0m`. → [Step 2: Create impl]
7. **Implements `WorkflowSearchResults` structurally** — the test does `const result: WorkflowSearchResults = new ColourfulWorkflowSearchResultsImpl(...)`, so the class must structurally match (`getWorkflowsListingString()` + `registerWorkflowsWith(registry)`). `registerWorkflowsWith` is required for TypeScript structural-typing to accept the assignment — without it `pnpm typecheck` fails. → [Step 2: Create impl]
8. **`pnpm typecheck` stays green** inside the temp override project. → [Step 4: Run typecheck]
9. **No regressions**: the only existing test (the one we're making pass) continues to pass on re-run. → [Step 3]

### Explicitly DEFERRED (not needed to pass the unit test — will be done in the e2e cycle):

- Optional constructor args with defaults `(ahq?: Workspace = new AhqWorkspaceImpl(), user?: Workspace = new CurrentUserWorkspaceImpl())`. Requires `agentic-hq`'s `package.json` exports widening + `src/index.ts` barrel — that's an e2e cycle concern. The unit test passes stubs explicitly, so required-args is sufficient for now.
- Root project classwitch conversion inside `agentic-hq` itself (6 `new X()` → `rootServiceRegistry.loadClass(...)` swaps, `src/index.ts` barrel, `root-registry.ts`, `package.json` exports widening). All e2e cycle.
- Override registry module inside the temp project (`src/classwitch-registry/...`). E2e cycle.
- CLI wrapper `bin/temp-agentic-hq-with-colours.cjs` + `src/cli/main.ts` + `install-dev-*.sh`. E2e cycle.
- Documentation deliverables (`docs/dev/how-to-guides/...`, README section, classwitch-doc-fixes draft). E2e cycle / post-REFACTOR.
- Regression e2e runs (`pnpm test:e2e:cross-workspace-list-workflows`, etc). E2e cycle.

## Project Design Requirements Compliance

Reference: `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/dev/project-design-requirements.md`

| # | Design Requirement | Plan Section Addressing It | Notes |
|---|-------------------|---------------------------|-------|
| D.1 | Class/interface pair for every concept | Step 2: `ColourfulWorkflowSearchResultsImpl` + implements `WorkflowSearchResults` interface | Interface already exists; impl is the new class pair partner |
| D.2 | Tell, don't ask (delegate to collaborators) | Step 2: `getWorkflowsListingString()` asks each injected `Workspace` for `getWorkflowListingString()` — does not extract state and manipulate | Wraps (concatenates ANSI codes) around the string each workspace returns; does not mutate or introspect |
| D.3 | Avoid cached state | Step 2: impl stores only the two `Workspace` references; re-asks them on each call | Matches `WorkflowSearchResultsImpl`'s existing pattern |
| D.4 | Constructor injection | Step 2: `constructor(ahqWorkspace: Workspace, currentUserWorkspace: Workspace)` | Matches Steve's `feedback_constructor_injection_delegation` |
| D.5 | Switchable concrete classes | N/A at this unit-GREEN step | Switching surface (override registry) is e2e cycle work — the *fact* that this class exists separately from `WorkflowSearchResultsImpl` already proves switchability at type level |
| D.6 | Concept Table / Data Dictionary / English Language Description | Deferred — confirmed in AI summary Q6 (Steve approved skip for this conversion Jira) | No new concepts introduced in this Jira |

**Deferred design requirements (relative to a full ideal implementation):**

- D.5 (switchable) — fully met only once the override registry is wired up in the e2e cycle. For the unit test alone, the class needs only to exist and pass its test.
- Constructor defaults (part of the approved RED-plan deviation #1) — deferred to e2e cycle when `AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl` become importable from `agentic-hq`. Per GREEN-minimal rules, we're not adding them here.

## Directory & File Layout (to be created/modified)

Inside `/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/`:

```
src/                                                            ← NEW dir
└── workflow-discovery/                                          ← NEW dir
    └── workflow-listing/                                        ← NEW dir
        └── colourful-workflow-search-results-impl.ts           ← NEW FILE (THE implementation)
```

No other files modified. No changes to the main `agentic-hq` repo in this step. No touching the test file (TDD forbids modifying the test between RED and GREEN).

## Implementation Steps

### Step 0 — Copy this approved plan to the workflow folder (FIRST step after approval)

`cp /Users/stevepersonal/.claude/plans/adaptive-cooking-unicorn.md /Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/jira-docs/AHQ-117/workflow-files/unit-test-files/03-APPROVED-green-phase-implementation-plan-copy.md`

### Step 1 — Create directories

`mkdir -p /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/src/workflow-discovery/workflow-listing`

### Step 2 — Write the minimal impl file

File: `src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts`

Design:

- Declare three inline structural type aliases: `WorkflowRegistry`, `Workspace`, `WorkflowSearchResults` (mirroring what the test declares inline, so the class is self-contained and doesn't depend on `agentic-hq`'s exports yet — those are widened in the e2e cycle).
- Class `ColourfulWorkflowSearchResultsImpl implements WorkflowSearchResults`.
- Constructor: `(private readonly ahqWorkspace: Workspace, private readonly currentUserWorkspace: Workspace)` — required args, no defaults (defaults deferred to e2e cycle per above).
- Top-of-file "why this exists" comment block (SRP-style, short) explaining this is the temp override's coloured variant of `WorkflowSearchResults` and pointing at the root `WorkflowSearchResultsImpl` it mirrors. (Note: user-memory feedback says Classwitch Root Project files must carry a "why" comment — this file is the override-side equivalent, and the comment should explain its role in the override surface so future readers understand the plug-in pattern.)
- ANSI code constants: `GREEN = '\x1b[32m'`, `BLUE = '\x1b[34m'`, `RED = '\x1b[31m'`, `RESET = '\x1b[0m'`. Header literal: `'Available workflows (with colours):'`.
- `getWorkflowsListingString()`: returns `${GREEN}${HEADER}${RESET}\n\n${BLUE}${ahqSection}${RESET}\n\n${RED}${userSection}${RESET}` where `ahqSection` and `userSection` come from asking each injected workspace for `getWorkflowListingString()`.
- `registerWorkflowsWith(registry: WorkflowRegistry): void`: delegate to both workspaces. Required purely for structural TypeScript compatibility with the test's `WorkflowSearchResults` annotation. Test does not assert on this method's behaviour at unit-GREEN — but leaving the body empty or throwing would violate "implements" contract and later e2e tests would break. Minimal real implementation (two delegated calls) is safer and mirrors `WorkflowSearchResultsImpl`.
- No CLI, no side-effect imports, no `console.log` — pure library code.

### Step 3 — Run the AC-prescribed unit test command

`cd /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours && pnpm test:unit`

Expected: ✅ 1 test pass. If it fails, debug, fix **only** the impl file, re-run. Do NOT modify the test file (TDD).

### Step 4 — Run `pnpm typecheck`

`cd /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours && pnpm typecheck`

Expected: ✅ no type errors. The inline structural types in the impl must match what the test expects.

### Step 5 — Skip full test suite verification

Per command §7b: for `test-type: unit` the full `pnpm test` should be run. In this temp project there's only one unit test (the one we just ran), so Step 3 already covers this. Note this in the GREEN doc.

The main `agentic-hq` repo's full unit test suite is **not** in scope for this step (the Jira scope note says no new unit tests there and no call-site changes have happened yet — those are e2e cycle).

### Step 6 — Manual ACs check

Check AHQ-117 acceptance criteria for manual tests that apply to the unit test phase. Per the AI summary Test Types section, the **unit** test type has no manual acceptance tests (manual e2e is a separate cycle). Note this in the GREEN doc.

### Step 7 — (Post-implementation) Re-read command file for testing & documenting instructions

**TODO after Step 6c**: Re-read `/Users/stevepersonal/dev/agentic-hq/agentic-hq/.claude/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/03-jira-minimal-implementation.md` (or the corresponding installed location) to make sure no steps are missed for:
- Writing `03-green-phase-summary-of-what-was-implemented.md` (command §8 template: what was built, files created/modified, key decisions, bugs found, ready-for-REFACTOR pointer).
- Adding the Jira comment (command §9 template: implementation path, test-passing status, doc link, next-step pointer).
- Presenting a short summary to the human (command §10).
- Writing `command-output.json` with `{"command-output-string": "GREEN phase complete for test-type unit"}` (command §11).
- Self-terminating via `/agentic-hq-core-plugin:self-termination` (command §12).

**Do NOT copy those templates into this plan** — re-read the command file live at the time so nothing is missed.

## Verification

- [ ] `pnpm test:unit` in the temp override project exits 0 with 1/1 passing test.
- [ ] `pnpm typecheck` in the temp override project exits 0.
- [ ] The impl file exists at the exact path the test imports from (`src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts` — note `.ts` on disk, `.js` in the import per TypeScript bundler/ESM convention).
- [ ] The impl does NOT import from `agentic-hq` or from anywhere outside its own file (no exports widening required yet).
- [ ] No files modified inside `/Users/stevepersonal/dev/agentic-hq/agentic-hq/` other than workflow-files docs.

## Risks & Open Questions

- **ANSI stripping in vitest**: Vitest captures `getWorkflowsListingString()`'s return value as a plain string; it does not pipe through a TTY detector. ANSI codes will be preserved in the string — the `toContain('\x1b[32m...')` assertion will match. Confirmed by reading the AI summary's "ANSI Stripping In Node Pipes" note (that caveat is about CLI stdout pipes, not in-process string returns).
- **`registerWorkflowsWith` delegation not asserted**: The test only checks the colour wrapping. That means the GREEN-minimal `registerWorkflowsWith` body (two delegated calls) is **not test-covered**. Accepted — we implement it as the minimum TypeScript-compatible body; the e2e cycle's behaviour tests exercise it end-to-end.
- **Structural types in the impl file duplicate what's in the test**: That is a known temporary state — the e2e cycle will widen `agentic-hq`'s exports and both files will switch to `import type { ... } from 'agentic-hq'`. Acceptable duplication for GREEN-minimal.

## Files Impacted

- **Created**: `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts`
- **Created** (workflow docs, after Step 7): `docs/jira-docs/AHQ-117/workflow-files/unit-test-files/03-APPROVED-green-phase-implementation-plan-copy.md`, `03-green-phase-summary-of-what-was-implemented.md`
- **Modified**: none (including the test file — explicitly forbidden by TDD)

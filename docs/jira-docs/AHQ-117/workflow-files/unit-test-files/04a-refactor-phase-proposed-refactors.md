# REFACTOR Analysis: AHQ-117 (unit test)

**Jira**: [AHQ-117](https://agentic-hq.atlassian.net/browse/AHQ-117)
**Test Type**: unit
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-04-20 16:13

---

## Refactoring Guidance (from Perplexity research)

Refactor in small, safe steps. If more than a few minutes since tests passed, revert and try smaller.

### When TO Refactor

> "The first time you do something, you just do it. The second time, you wince at the duplication, but you do it anyway. The third time, you refactor." — **Don Roberts** (via Martin Fowler)
> So... If you're seeing something that's been copied about and used in 3 places, it's time to tidy that up by refactoring.

> "What's the simplest thing that could possibly work?" - Ward Cunningham
> So... If you're seeing an overly complex solution - or the whole code is starting to look like it's accumulated complexity and messiness, it's time to refactor.

- Magic constants / magic strings — extract to named constants
- Poor variable or function names — rename for clarity
- Duplication within a file — extract to a shared function
- Overly complex conditionals — simplify
- Dead code — delete it
- Long and complex sequences that the system has to go through to achieve something, when you can see a simpler way to do things
- Missing TSDoc — exported classes and public methods should have `/** ... */` comments

### When NOT To Refactor

> "Always implement things when you actually need them, never when you just foresee that you need them." — **Ron Jeffries**
> So...Don't refactor to add things you **think** you'll need later.

> "Over and over, people try to design systems that make tomorrow's work easy. But when tomorrow comes it turns out they didn't quite understand tomorrow's work, and they actually made it harder." — **Ward Cunningham**

> "What's the simplest thing that could possibly work?" - Ward Cunningham
> So... If you're thinking of adding more code/layers to refactor and make the system more generic, ask your self - are you making it simpler or more complex than it needs to be to make it work?

So, avoid refactoring the following things:
- New abstractions or interfaces — unless the pattern appears 3+ times (Rule of Three)
- Extracting to new files/modules — unless the current file is genuinely too large
- Introducing design patterns — unless the problem is already painful without one
- Building "stepping stones" for future features — classic gold-plating
- Making code "more generic" — if only one use case exists, keep it specific

**"Has It Earned It?"** — Before approving, ask: Is this code stable? Is the pattern repeated 3+ times? Will this abstraction actually be used, or is it speculative?

---

## Pre-Refactor Test Status

**Command**: `cd /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours && pnpm test:unit`
**Result**: PASSING (1 test)

Also verified the main `agentic-hq` repo's unit suite is still green: `pnpm test` → 131/131 passed (no regressions from the temp-project work).

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, red-phase plan, red-phase summary, green-phase plan, and green-phase summary for deferred items and opportunities.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | RED plan §"Design Requirements Compliance" line 157: "State management requirements (e.g. no extra cached state inside the impl) — cannot be validated at the test level; will be checked in GREEN/REFACTOR by code inspection of the impl file." | Deferred | Audit the impl for unnecessary cached state. | Already done — the impl stores only the two injected `Workspace` refs and derives all output per call. No cached state to remove. No refactor needed. | Skip — already compliant |
| P.2 | GREEN doc Decision #1: "Inline structural types instead of importing from `agentic-hq`... acceptable temporary duplication — the e2e cycle will swap both files to `import type { ... } from 'agentic-hq'`." | Deferred | Replace inline `WorkflowRegistry` / `Workspace` / `WorkflowSearchResults` duplicated in both impl and test with `import type` from `agentic-hq`. | Correct decision to defer. Requires widening `agentic-hq`'s `package.json` exports and adding `src/index.ts` barrel — both explicitly e2e-cycle scope per the Jira. Doing it at unit-REFACTOR would force e2e scope into this cycle. | Skip — deferred to e2e cycle (correctly) |
| P.3 | GREEN doc Decision #2: "Required constructor args (no defaults)... The e2e cycle will re-open this file to add the defaults once `AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl` are exported." | Deferred | Add optional constructor arg defaults `(ahq?: Workspace = new AhqWorkspaceImpl(), user?: Workspace = new CurrentUserWorkspaceImpl())` to match AHQ-120's sketch and enable classwitch's no-arg `new Klass()` path. | Correct to defer — the imports needed for the defaults (`AhqWorkspaceImpl`, `CurrentUserWorkspaceImpl`) are not yet exported from `agentic-hq`. Will be e2e cycle work. | Skip — deferred to e2e cycle (correctly) |
| P.4 | GREEN doc Decision #3: "`registerWorkflowsWith` implemented (not just declared)... the unit test asserts nothing about `registerWorkflowsWith`." | Observed | The method has zero callers in the temp project right now. No test asserts on it. | Not a code smell — the interface method IS called externally (`src/cli/agentic-hq-program.ts:52` calls `searchResults.registerWorkflowsWith(...)` through the interface). Once the override project's Classwitch wiring is done (e2e cycle), this method will be invoked through the real interface. NOT-YET-WIRED per the audit legend. | Skip — not-yet-wired, keep as-is |
| P.5 | GREEN doc Decision #4: "ANSI codes as module-scope constants, not per-call literals." | Observed | ANSI codes already extracted to `GREEN`/`BLUE`/`RED`/`RESET`. | Already compliant — good naming, module-scope, clear mapping to test assertions. | Skip — already done in GREEN |
| P.6 | GREEN doc Decision #5: "Header and section separator (`\n\n`) hard-coded." | Observed | The `\n\n` separator is used twice inline (line 62 template literal) without a named constant. | Borderline — per the "extract ALL magic constants" rule this should be extracted to `SECTION_SEPARATOR`. But `\n\n` is an extremely common/self-explanatory literal and the mirror class `WorkflowSearchResultsImpl` hard-codes it the same way. Low value to extract; slight consistency improvement. | Tier 1 (see below) |
| P.7 | GREEN doc Decision #6: "Why this file exists comment at the top." | Observed | The header comment (lines 1–26) is 26 lines long, substantial. Includes SRP Does/Knows About/Knows Nothing About blocks plus the Classwitch plug-in explanation. | Correctly follows `feedback_classwitch_root_project_comments` — files on the Classwitch override surface must carry a "why" comment explaining their plug-in role. Mirrors the style of root-project `WorkflowSearchResultsImpl` (which also has SRP blocks). Do not shrink. | Skip — appropriate, intentional |
| P.8 | GREEN doc §"Files Created": the impl has TSDoc-style class header but method bodies have NO TSDoc. | Observed (my own reading) | `getWorkflowsListingString()` (line 58) and `registerWorkflowsWith()` (line 65) have no `/** ... */` comments. The mirror class `WorkflowSearchResultsImpl` has `/** ... */` on each method (lines 34, 40 of its impl). Missing TSDoc is flagged as a Tier 1 refactor type in the guidance. | Worth adding for consistency with the mirrored root class. Tiny change. | Tier 1 (see below) |
| P.9 | AI summary §"Test Types" line 187: existing root-project unit tests must stay green (regression safety net). | Observed | Confirmed — `pnpm test` in root agentic-hq still passes 131/131. No regression. | N/A — verification, not a refactor. | Skip — verified green |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below.

---

## Magic Constants Audit

Impl file (`colourful-workflow-search-results-impl.ts`):

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `colourful-workflow-search-results-impl.ts` | 46 | `'\x1b[32m'` | EXTRACTED | `GREEN` |
| `colourful-workflow-search-results-impl.ts` | 47 | `'\x1b[34m'` | EXTRACTED | `BLUE` |
| `colourful-workflow-search-results-impl.ts` | 48 | `'\x1b[31m'` | EXTRACTED | `RED` |
| `colourful-workflow-search-results-impl.ts` | 49 | `'\x1b[0m'` | EXTRACTED | `RESET` |
| `colourful-workflow-search-results-impl.ts` | 50 | `'Available workflows (with colours):'` | EXTRACTED | `HEADER` |
| `colourful-workflow-search-results-impl.ts` | 62 | `'\n\n'` (×2 in the template literal) | MAGIC | -> `SECTION_SEPARATOR` |

Test file (`colourful-workflow-search-results-impl.unit.test.ts`):

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `colourful-workflow-search-results-impl.unit.test.ts` | 43, 54 | `'STUB_AHQ_SECTION'` (×2) | MAGIC | -> `STUB_AHQ_LISTING` |
| `colourful-workflow-search-results-impl.unit.test.ts` | 44, 55 | `'STUB_USER_SECTION'` (×2) | MAGIC | -> `STUB_USER_LISTING` |
| `colourful-workflow-search-results-impl.unit.test.ts` | 35–38 | `'/stub/ahq'`, `'/stub/user'`, `/.agentic-hq/temp`, `/.agentic-hq` | Used once each | Not worth extracting (single-use test literals) |
| `colourful-workflow-search-results-impl.unit.test.ts` | 53–55 | ANSI escape sequences `\x1b[32m`, `\x1b[34m`, `\x1b[31m`, `\x1b[0m` | Used once each in assertions | Arguable — literal assertions make the test easy to read; extracting them hides what is being asserted. Skip. |

**MAGIC entries above are included in Tier 1 refactors below.**

---

## Audit To Confirm Methods Used In Production Code (Not Just Tests)

Auditing every method on every interface/class created or modified in this Jira.

**Legend**:
- **✓** = used as intended
- **NOT USED THROUGH INTERFACE ⚠️** = interface method only called by `this.method()` inside the implementing class (plus possibly tests) — should be made private + removed from the interface
- **TEST-ONLY ⚠️** = zero production callers — should be deleted
- **NOT-YET-WIRED** = subsystem entry point, deliberately not yet wired into the CLI (will be wired later) — keep

The Jira adds **one new concrete class** (`ColourfulWorkflowSearchResultsImpl`). It implements an existing interface (`WorkflowSearchResults`). The inline type aliases in the impl file are not new interfaces — they're structural mirrors of existing `agentic-hq` interfaces that will be replaced with `import type` in the e2e cycle (see P.2 above).

| Interface / Class | Method | Status | Evidence |
|---|---|---|---|
| `ColourfulWorkflowSearchResultsImpl` | `getWorkflowsListingString()` | ✓ | Called through the `WorkflowSearchResults` interface from the unit test (line 51); in the root project, the same interface method is called from `src/cli/agentic-hq-program.ts:18` (via `searchResults.getWorkflowsListingString()`), so once Classwitch wiring lands in the e2e cycle, the override's version will flow into that call site |
| `ColourfulWorkflowSearchResultsImpl` | `registerWorkflowsWith(registry)` | NOT-YET-WIRED | Root-project callers via interface exist at `src/cli/agentic-hq-program.ts:52`. Once the override project's Classwitch registry module is built (e2e cycle), the override's implementation will be called through there. No caller in the temp project yet, but this is deliberately deferred — the method is not-yet-wired, not dead code. |

**Flagged methods:**
- None — `getWorkflowsListingString` is legitimately used; `registerWorkflowsWith` is the deliberate not-yet-wired override surface that the e2e cycle will plug into.

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.1 | Extract magic constant | Extract the `'\n\n'` inter-section separator (used twice in the template literal on line 62) to a named module-level constant `SECTION_SEPARATOR = '\n\n'`, placed alongside the existing `GREEN` / `BLUE` / `RED` / `RESET` / `HEADER` constants. | `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts` Line: `62` |
| 1.2 | Add missing TSDoc | Add a one-line `/** ... */` TSDoc comment on each public method of `ColourfulWorkflowSearchResultsImpl` — `getWorkflowsListingString()` and `registerWorkflowsWith()` — mirroring the style used in the root `WorkflowSearchResultsImpl` ("Return the full listing string: header + both workspace sections." and "Register all workflows from both workspaces with the registry."). The override variant can add "(ANSI-coloured)" where relevant. | `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts` Line: `58`, `65` |
| 1.3 | Extract test magic constants | Extract the duplicated stub listing strings `'STUB_AHQ_SECTION'` and `'STUB_USER_SECTION'` (each used twice — once when setting up the stub, once in the `toContain` assertion) to two test-scope constants `STUB_AHQ_LISTING` and `STUB_USER_LISTING`. Keeps single-source-of-truth and makes the arrange/assert link obvious. | `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/tests/unit/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.unit.test.ts` Line: `43, 44, 54, 55` |

---

## Tier 2: AI-Identified Potential Refactors

No Tier 2 structural refactors identified. The impl is 70 lines, one class, one interface it mirrors. Most of the "structural" improvements that could apply (inline types → imports from `agentic-hq`, constructor defaults, override registry wiring) are explicitly scoped out of this unit-REFACTOR step and deferred to the e2e cycle per the GREEN-phase summary. Introducing new abstractions, extracting to new files, or moving the inline types ahead of the e2e cycle would pull e2e scope into this cycle and risk duplicated work.

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None". Everything added here will be discussed with the AI before a decision is made.

> **MANDATORY**: You MUST either add refactors here OR write "None" before the execute phase can proceed.

None

---

## Project Design Requirements Compliance Audit

**Design Requirements File**: `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/dev/project-design-requirements.md`

| # | Requirement | Evidence (files, classes, patterns) | Status | Refactoring Proposal (if needed) |
|---|-------------|-------------------------------------|--------|----------------------------------|
| DR.1 | Class/interface pair for every concept | `ColourfulWorkflowSearchResultsImpl` exists (impl) and implements the `WorkflowSearchResults` interface (inline structural copy in this unit phase; will become the real `import type` from `agentic-hq` in the e2e cycle). Both halves of the pair are present. | MET | — |
| DR.2 | Default naming convention (`SomethingImpl` implementing `Something` interface) | Class name is `ColourfulWorkflowSearchResultsImpl` — uses `Impl` suffix. It is an *override* variant of `WorkflowSearchResultsImpl` (the default). Naming style is consistent with the rest of the codebase. | MET | — |
| DR.3 | Tell, don't ask / push work into objects | `getWorkflowsListingString()` asks each injected `Workspace` for `getWorkflowListingString()` and concatenates. This mirrors the pattern used by the root `WorkflowSearchResultsImpl` (lines 35–39 of that file). `registerWorkflowsWith()` delegates entirely to the two workspaces. No state is extracted and manipulated beyond string concatenation with colour wrapping. | MET | — (pattern matches the root class which was approved) |
| DR.4 | Switchability — could a third party replace any concrete class easily? | At type level YES — the class implements the `WorkflowSearchResults` interface and has the expected constructor shape. At runtime NOT YET — the Classwitch registry wiring (both root-side `root-registry.ts` and override-side registry module) is deferred to the e2e cycle. | PARTIALLY MET (by design) | No refactor needed here — the partial-met state is the intentional unit-GREEN scope per the plan. The e2e cycle delivers the runtime switchability. |
| DR.5 | Minimal state — are fields being used to cache intermediate state unnecessarily? | `ColourfulWorkflowSearchResultsImpl` stores only the two injected `Workspace` references (source data, not intermediate state). All output is derived per call — no cached listing string, no flags, no memoisation. | MET | — |
| DR.6 | Balance caveat — is the implementation appropriately balanced (not fractured to the extreme)? | 70-line file, one class, constants co-located, no extracted helpers, no new sub-interfaces. Balanced — does not over-fracture for the override case. | MET | — |
| DR.7 | Constructor injection | `constructor(private readonly ahqWorkspace: Workspace, private readonly currentUserWorkspace: Workspace)` — both collaborators injected, both `readonly`. Matches `feedback_constructor_injection_delegation`. | MET | — |
| DR.8 | Tests assert behaviour, not implementation details | Test uses `toContain` on the returned string (three observable assertions). No `instanceof`, no private-field peeks, no prototype checks. Matches `feedback_no_instanceof_in_tests`. | MET | — |
| DR.9 | Concept Table / Data Dictionary / English Language Description | Explicitly skipped for this conversion Jira per AI summary Question 6 (Steve approved: "Fine to skip"). No new concepts introduced. | NOT APPLICABLE | — |
| DR.10 | Classwitch Root Project files must comment the design intent (user-memory `feedback_classwitch_root_project_comments`) | Top-of-file comment (lines 1–26) explicitly names the override role, the plug-in pattern (`rootServiceRegistry.overrideExistingServices(...)`), and when wiring happens (e2e cycle). Plus standard SRP-Does/Knows-About/Knows-Nothing-About blocks. | MET | — |

**Summary**: 9 of 10 requirements MET, 1 PARTIALLY MET (by design — deferred to e2e cycle), 0 NOT MET, 1 NOT APPLICABLE (of the 10 audited — DR.9 is NOT APPLICABLE per Steve's approved skip).

> **Note to human**: The PARTIALLY MET item (DR.4 switchability) is an intentional deferral that will be completed in the e2e cycle. It is NOT added as a Tier 2 refactor here because bringing it forward would pull e2e scope into this cycle.

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 3 |
| Tier 2 AI-Identified (Pending review) | 0 |
| Design Requirements Audit (items needing action) | 0 |
| **Total identified by AI** | 3 |

---

## Agreed Refactors Discussion Notes

No items required discussion. The human did not mark any item DISCUSS (there were no Tier 2 AI-Identified items to mark) and wrote "None" for Human-Identified Potential Refactors. The three Tier 1 items are auto-approved per the guidance and flow straight into the summary table below without debate.

---

## Agreed Refactors Summary Table

> This is the single source of truth for the execute phase (04b).

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 1.1 | AI (Tier 1) | Extract the `'\n\n'` inter-section separator (used twice in the template literal on line 62 of `colourful-workflow-search-results-impl.ts`) to a named module-level constant `SECTION_SEPARATOR = '\n\n'`, placed alongside the existing `GREEN` / `BLUE` / `RED` / `RESET` / `HEADER` constants. | EXECUTE | Auto-approved Tier 1 — magic-constant extraction |
| 1.2 | AI (Tier 1) | Add a one-line `/** ... */` TSDoc comment on each public method of `ColourfulWorkflowSearchResultsImpl` — `getWorkflowsListingString()` (line 58) and `registerWorkflowsWith()` (line 65) — mirroring the style used in the root `WorkflowSearchResultsImpl`. The override variant can note "(ANSI-coloured)" where relevant. | EXECUTE | Auto-approved Tier 1 — missing TSDoc on exported class's public methods |
| 1.3 | AI (Tier 1) | Extract the duplicated stub listing strings `'STUB_AHQ_SECTION'` and `'STUB_USER_SECTION'` (each used twice — once at stub setup, once in the `toContain` assertion) in `colourful-workflow-search-results-impl.unit.test.ts` to two test-scope constants `STUB_AHQ_LISTING` and `STUB_USER_LISTING`. | EXECUTE | Auto-approved Tier 1 — magic-constant extraction in test file |

---

## Next Steps

1. Review the "Previous Phases" table - if you disagree with any "Skip", add it to Human-Identified Potential Refactors
2. Mark each AI-Identified Tier 2 refactor as APPROVE / REJECT / DISCUSS (note: none in this analysis)
3. Fill in "Human-Identified Potential Refactors" with your own refactors, or write "None"
4. Tell the AI you've completed your review
5. The AI will discuss: any items you marked DISCUSS + all human-identified items
6. After discussion, the AI fills in "Agreed Refactors Discussion Notes" and "Agreed Refactors Summary Table"
7. The execute phase (04b) runs automatically

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-04-20 16:22.

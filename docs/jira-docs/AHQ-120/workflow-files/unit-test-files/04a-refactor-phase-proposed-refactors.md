# REFACTOR Analysis: AHQ-120 (unit test)

**Jira**: [AHQ-120](https://agentic-hq.atlassian.net/browse/AHQ-120)
**Test Type**: unit
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-04-22 22:35

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

**Command**: `pnpm test:unit` (run from inside `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/`)
**Result**: PASSING (2/2 tests — both unit tests for `ColourfulWorkflowSearchResultsImpl`)

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, RED phase plan, RED phase summary, GREEN phase plan, and GREEN phase summary for deferred items and opportunities.

> **Note on scope boundary**: AHQ-120 has TWO full TDD cycles — a **unit cycle** (we're in its REFACTOR phase now) and an **e2e cycle** (still to come). The previous-phase documents explicitly park the bulk of the Jira's deliverables (`main.ts`, bin wrapper, override-registry, install script, e2e test, README, eslint/prettier configs, vitest.e2e.config, how-to-guide review, optional-with-defaults constructor) against the **e2e cycle REFACTOR**, not the unit cycle REFACTOR. Those items are listed below for completeness and flagged **Skip (e2e cycle)** — they are not artificially deferred gold-plating, they are genuinely e2e-phase concerns since they require e2e infrastructure to exist to be meaningful.

| #    | Source                                                        | Deferred or Observed? | Opportunity                                                                                                                                                                                                                        | AI Opinion                                                                                                                                                                                                                                                                                                                                                                                                                                       | Recommendation      |
| ---- | ------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| P.1  | Impl file header comment line 20-23 (GREEN plan line 100-103) | Deferred              | `REFACTOR NOTE:` in impl's JSDoc header says "constructor args are required in GREEN (strict minimum). Optional-with-defaults will be added in the e2e GREEN cycle when that wiring is actually exercised."                  | Correct decision. Adding defaults now would pre-satisfy Classwitch's no-arg `new Klass()` call, so the e2e RED wouldn't fail for the right reason. Keep the impl as-is and keep the REFACTOR NOTE comment (it explains WHY defaults are absent — if I delete it the e2e GREEN agent won't know and may be confused).                                                                                                                           | Skip (e2e cycle)    |
| P.2  | AI summary lines 37, 137-138; Jira description                | Deferred              | Review `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` and either fix inaccuracies or add TODO/REFACTOR comments. AI summary flagged three issues: (a) `commander` dep list confusion, (b) no lint/prettier config section, (c) no `vitest.e2e.config.ts` section. | The AI summary + GREEN summary explicitly punt this to the e2e REFACTOR: *"Will be reviewed/fixed in the REFACTOR phase of the e2e cycle (where the full override flow has been implemented and can be compared against the guide)"*. I agree — reviewing the guide is much more useful AFTER we've actually built the eslint/prettier/vitest.e2e pieces via the e2e RED→GREEN, because THAT is the work the guide documents.                  | Skip (e2e cycle)    |
| P.3  | AI summary Q3 (lines 169, 215); GREEN summary line 97         | Deferred              | `commander` kept as a direct dep in 002's `package.json` per Q3 resolution. Raise a REFACTOR note about whether it's actually needed as a direct dep.                                                                             | Legitimate question, but it's about the `package.json` and the how-to guide — both better addressed during the e2e cycle REFACTOR when the full override is running and we can verify transitive resolution end-to-end. Don't act now.                                                                                                                                                                                                       | Skip (e2e cycle)    |
| P.4  | GREEN plan line 30; GREEN summary lines 88-89                 | Deferred              | Optional-with-defaults constructor args (Classwitch's no-arg `new Klass()` needs them).                                                                                                                                         | Genuinely deferred to the e2e GREEN (not REFACTOR). Adding them now defeats the e2e RED signal. **Skip for THIS unit REFACTOR — the e2e GREEN will add them.** No action here.                                                                                                                                                                                                                                                                 | Skip (e2e cycle)    |
| P.5  | GREEN plan line 31; AI summary line 267                       | Deferred              | `src/cli/main.ts`, `src/classwitch-registry/override-registry.ts`, `bin/temp-agentic-hq-with-colours.cjs`, `scripts/infra/install-dev-*.sh` — all load-bearing override plumbing.                                              | Out of scope for the unit cycle — unit tests don't exercise them. E2E cycle creates them.                                                                                                                                                                                                                                                                                                                                                     | Skip (e2e cycle)    |
| P.6  | GREEN plan line 32; GREEN summary lines 94-95                 | Deferred              | `README.md`, `eslint.config.js`, prettier config, `vitest.e2e.config.ts`, the e2e test itself — all Jira acceptance-criteria deliverables.                                                                                      | Out of scope for unit cycle. E2E cycle / REFACTOR.                                                                                                                                                                                                                                                                                                                                                                                              | Skip (e2e cycle)    |
| P.7  | RED plan line 89-91                                            | Deferred              | "Classwitch Root/Override file comments — design-intent comments on `main.ts`, `bin/*.cjs`, `override-registry.ts`, and the impl file are a GREEN/REFACTOR concern — not RED. Noted for REFACTOR list."                          | The impl file already has its design-intent JSDoc block (GREEN added it). The other three files don't exist yet — they'll be added in e2e GREEN, and design-intent comments will be part of that GREEN (or e2e REFACTOR). Nothing to do in this unit REFACTOR.                                                                                                                                                                                | Skip (e2e cycle)    |
| P.8  | RED plan line 78 (state-cache compliance)                      | Observed              | RED plan said "Cached-state compliance will be enforced in REFACTOR (look at constructor fields only; no listing-string cache)."                                                                                                | Verified compliant — I read the impl: only fields are the two `Workspace` instances (constructor-injected). `getWorkflowsListingString()` re-derives the string on every call. No caching. **No action needed — requirement already satisfied.**                                                                                                                                                                                              | Skip (already met)  |
| P.9  | GREEN plan line 224                                            | Deferred              | "Any refactor / tidy-up of the new impl file — REFACTOR phase."                                                                                                                                                                 | This is the catch-all that brought us here. The impl file was lifted from the 001 reference and is already quite tidy. Specific items I found are captured below in the audits and Tier 1/2 tables — no other file-level tidy-up is needed.                                                                                                                                                                                                  | See Tier 1 / Tier 2 |
| O.1  | Observed: missing per-method TSDoc                             | Observed              | The impl's two public methods (`getWorkflowsListingString()`, `registerWorkflowsWith(registry)`) have no per-method TSDoc. The 001 reference file **did** carry brief one-line TSDoc on each method — dropped when 002 was built. | Cheap, safe win. The file-level JSDoc block documents the class; one-line method TSDocs document each method's contract for readers. The CLAUDE.md Tier-1 rule explicitly requires "Add missing TSDoc" on exported class public methods. **Recommend restoring the two one-line TSDocs from 001** (we already confirmed 001 had them during this analysis).                                                                                 | **Tier 1**          |
| O.2  | Observed: test variable naming                                  | Observed              | In the unit test file, the local `const result: WorkflowSearchResults = new ColourfulWorkflowSearchResultsImpl(...)` uses `result` as the variable name. `result` is a bit generic — the variable is actually the impl instance, not a result of an operation. | Minor naming nit. `colourfulResults` or `searchResults` would read slightly more naturally when the test then does `result.getWorkflowsListingString()`. Very low-value change though. **Surface it; I'd lean mildly toward doing it but I'm unsure it's worth the churn.**                                                                                                                                                                    | **Tier 1** (mild)   |
| O.3  | Observed: JSDoc SRP block duplication vs 001                     | Observed              | The impl's design-intent JSDoc header is slightly longer than 001's (extra "REFACTOR NOTE" section explaining the deferred defaults). Once the e2e GREEN adds the defaults, that REFACTOR NOTE will become stale.               | This is a future concern — when e2e GREEN adds the defaults it should remove the REFACTOR NOTE at the same time. For now it's load-bearing documentation. **No action here — flag for the e2e GREEN agent.**                                                                                                                                                                                                                                   | Skip (e2e cycle)    |
| O.4  | Observed: `makeStubWorkspace` helper in test                     | Observed              | The test file defines a local helper `makeStubWorkspace(listing, isAhq)` that builds a full `Workspace` stub with 6 methods (only 2 of which are exercised). The stub satisfies the TypeScript interface contract but adds incidental complexity.                 | Could be simplified with a cast (e.g. `{ getWorkflowListingString: …, registerWorkflowsWith: vi.fn() } as Workspace`) — but that loses type-safety. The current approach is type-safe and correct. Faithful to the pattern in 001. **I lean toward leaving it as-is** — changing to a cast reduces safety; keeping the full stub makes the test slightly more verbose but TypeScript-correct.                                                | Skip (type-safe)    |
| O.5  | Observed: unused structural fields on the stub (`getRoot`, `getTempDir`, `getDotAgenticHqDir`, `isAhqWorkspace`) | Observed              | The 4 stub methods beyond `getWorkflowListingString` / `registerWorkflowsWith` aren't called by the impl under test. They're there purely to satisfy the `Workspace` interface for TypeScript.                                  | Related to O.4. A more test-focused alternative is a `Partial<Workspace>` cast or a helper like `{ ...stub, ...overrides } as Workspace`. But: the impl contract says "takes a Workspace" — the stub should be a valid Workspace. Type-correctness wins here.                                                                                                                                                                                    | Skip (type-safe)    |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below.

---

## Magic Constants Audit

Literal values in the impl (`src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts`) and test file:

| File           | Line | Magic Value                             | Status    | Constant Name                   |
| -------------- | ---- | --------------------------------------- | --------- | ------------------------------- |
| impl           | 31   | `'\x1b[32m'`                            | EXTRACTED | `GREEN`                         |
| impl           | 32   | `'\x1b[34m'`                            | EXTRACTED | `BLUE`                          |
| impl           | 33   | `'\x1b[31m'`                            | EXTRACTED | `RED`                           |
| impl           | 34   | `'\x1b[0m'`                             | EXTRACTED | `RESET`                         |
| impl           | 35   | `'Available workflows (with colours):'` | EXTRACTED | `HEADER`                        |
| impl           | 36   | `'\n\n'`                                | EXTRACTED | `SECTION_SEPARATOR`             |
| test           | 26   | `'STUB_AHQ_SECTION'`                    | EXTRACTED | `STUB_AHQ_LISTING`              |
| test           | 27   | `'STUB_USER_SECTION'`                   | EXTRACTED | `STUB_USER_LISTING`             |
| test           | 32-37 | `'/stub/ahq'`, `'/stub/user'`, `'/stub/ahq/.agentic-hq/temp'`, `'/stub/user/.agentic-hq/temp'`, `'/stub/ahq/.agentic-hq'`, `'/stub/user/.agentic-hq'` | NOT EXTRACTED — **but intentional** | — |
| test           | 52   | `'\x1b[32mAvailable workflows (with colours):\x1b[0m'` | NOT EXTRACTED — **but intentional** | — |
| test           | 53,54 | `\x1b[34m…`, `\x1b[31m…` template-literal literals | NOT EXTRACTED — **but intentional** | — |

**Why the test literals are intentional (not MAGIC)**: The test literals are the **expected-output assertion values**. Extracting them to constants (especially to constants imported from the impl) would couple the test to the impl's naming — a test should assert on the *expected external shape*, not on "whatever the impl says". Tests being slightly repetitive/literal at the assertion edge is a good thing. Per `feedback_no_instanceof_in_tests.md`: tests must assert on observable behaviour, and "observable" here means the literal escape sequences + literal header string the caller will see.

Similarly, the stub path literals (`/stub/ahq` etc.) are inert test-fixture values that the impl-under-test never inspects — extracting them to constants would be ceremony without benefit.

**Result**: All impl literals are extracted. Test literals are intentional. **No magic-constant refactors needed.**

---

## Audit To Confirm Methods Used In Production Code (Not Just Tests)

Auditing every method on `ColourfulWorkflowSearchResultsImpl` (the only class created in this Jira — no new interfaces).

**Legend**:
- **✓** = used as intended (interface methods: called through the interface from outside the implementing class; class-only methods: any production caller exists)
- **NOT USED THROUGH INTERFACE ⚠️** = interface method only called by `this.method()` from inside the implementing class (plus possibly tests) — should be made private + removed from the interface
- **TEST-ONLY ⚠️** = zero production callers (not even self-calls); only tests reference it — should be deleted
- **NOT-YET-WIRED** = subsystem entry point, deliberately not yet wired into the CLI (will be wired later) — keep

| Interface / Class                      | Method                             | Status         | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------- | ---------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ColourfulWorkflowSearchResultsImpl`   | `constructor(ahqWorkspace, currentUserWorkspace)` | NOT-YET-WIRED | Called by both unit tests. Will also be called by Classwitch's `new Klass()` via the override registry once `src/classwitch-registry/override-registry.ts` is created in the e2e cycle. The class itself IS the override surface — this IS the deliberate API exposed to Classwitch.                                                                                                                                                        |
| `ColourfulWorkflowSearchResultsImpl`   | `getWorkflowsListingString()`      | NOT-YET-WIRED  | Declared on `WorkflowSearchResults` interface (from `agentic-hq`). **The production consumer is `agentic-hq/src/cli/agentic-hq-program.ts:48`** which does `searchResults.getWorkflowsListingString()`. That call reaches our override instance via the Classwitch-registered `WorkflowSearchResults` — which is wired in 002's `override-registry.ts`, not yet created (e2e cycle). Keep — this is the deliberate external API surface.    |
| `ColourfulWorkflowSearchResultsImpl`   | `registerWorkflowsWith(registry)`  | NOT-YET-WIRED  | Same analysis: declared on `WorkflowSearchResults` interface, consumer is `agentic-hq/src/cli/agentic-hq-program.ts:52`. Not yet wired into 002 — will be wired in the e2e cycle.                                                                                                                                                                                                                                                            |

**Flagged methods**: None. All methods on `ColourfulWorkflowSearchResultsImpl` are NOT-YET-WIRED in the deliberate sense — they are the entry points the Classwitch override will plug into `agentic-hq-program.ts`'s existing call sites once the override registry is wired in the e2e cycle. No code smell.

**Conclusion**: No test-only methods. No interface-only-called-by-self methods. Class is clean.

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| #   | Type              | Description                                                                                                                                                                              | File(s) & Line Num                                                                                                           |
| --- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Add missing TSDoc | Add a one-line `/** Return the full listing string: header + both workspace sections (ANSI-coloured). */` TSDoc on `getWorkflowsListingString()` (lifted from 001's reference impl, line 49). | `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts` Line: `46` |
| 1.2 | Add missing TSDoc | Add a one-line `/** Register all workflows from both workspaces with the registry. */` TSDoc on `registerWorkflowsWith(registry)` (lifted from 001's reference impl, line 57).                       | `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts` Line: `53` |
| 1.3 | Naming improvement | Rename the local `result` variable in the unit test to `colourfulResults` (more descriptive — the variable is the constructed impl, not a result of an operation).                     | `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/tests/unit/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.unit.test.ts` Line: `45` and `62` |

---

## Tier 2: AI-Identified Potential Refactors

Include ALL potential structural refactors here — both ones I recommend AND ones I'm unsure about or even think shouldn't be done. The human decides; my job is to surface them all with honest opinions.

### Refactor 2.1: Extract `wrapInColour(colour, text)` helper to remove the `${COLOUR}${...}${RESET}` pattern

**Type**: Duplication removal (within file) — but crossing the minor-abstraction line
**Description**: `getWorkflowsListingString()` repeats the pattern `${COLOUR}${payload}${RESET}` three times (green header, blue AHQ, red user). Extract a small private helper:
```ts
private wrap(colour: string, text: string): string {
  return `${colour}${text}${RESET}`;
}
```
and use `this.wrap(GREEN, HEADER)`, `this.wrap(BLUE, …)`, `this.wrap(RED, …)`.

**AI Recommendation**: **NOT RECOMMENDED** (mildly). Rule of Three applies at 3 uses, but the current pattern is very short (`${X}${Y}${Z}`), reads perfectly as-is, and extracting a helper adds a layer of indirection that actually makes the code marginally *harder* to scan. I'd skip.

**Risk**: Low risk of bugs, but introduces a method that exists purely for internal convenience — classic YAGNI warning if the helper never gets a third caller outside this method.

**Files affected**: `src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.2: Make the colour choices a constructor-injectable "colour scheme" object so third parties can swap colours without replacing the whole class

**Type**: Create new abstraction / introduce design pattern
**Description**: Right now `GREEN`, `BLUE`, `RED` are module-level `const`s. A third party who wants "a red header, a yellow AHQ, a cyan user" has to copy-and-modify the whole `ColourfulWorkflowSearchResultsImpl` file. To satisfy the design requirement *"If someone wants to replace just one small aspect of the feature, could they do it easily?"* more literally, we could introduce a `ColourScheme` concept (interface + default impl) and inject it into `ColourfulWorkflowSearchResultsImpl`.

**AI Recommendation**: **NOT RECOMMENDED** (strongly). Reasons:
1. This is a TEMP practice project that won't be pushed to GitHub — it will be deleted once AHQ-121/122 automate the same job.
2. The design requirement itself contains a balance caveat: *"we are still going to have a class for every 'thing' in our system... but we may choose not to push some functionality into that class if it's more readable to keep it in a bigger function. This has to be based on an assessment and judgement of how likely someone is going to want to extract and replace that little bit of functionality."* Likelihood of someone wanting to swap colour palettes on a throwaway project is effectively zero.
3. Rule of Three: there is ONE override project using these colours (002 / 001's reference). No second override has ever requested different colours.
4. The entire `ColourfulWorkflowSearchResultsImpl` class is itself the Classwitch-switchable unit — if a third party wants different colours, they override `WorkflowSearchResults` with their own `RainbowWorkflowSearchResultsImpl`. The switching already exists, just one level up.

**Risk**: Classic gold-plating / YAGNI. Adds a whole new concept (`ColourScheme`) to the system that has no caller. Makes the class harder to read for no practical gain.

**Files affected**: `src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts` + new `src/workflow-discovery/workflow-listing/colour-scheme.ts` (interface) + `default-colour-scheme-impl.ts` (class).

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None". Everything added here will be discussed with the AI before a decision is made.

> **MANDATORY**: You MUST either add refactors here OR write "None" before the execute phase can proceed.

None

---

## Project Design Requirements Compliance Audit

**Design Requirements File**: `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/dev/project-design-requirements.md`

| #    | Requirement                                                                                                                                                                                                   | Evidence (files, classes, patterns)                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Status                 | Refactoring Proposal (if needed)                                                                                                                                                                                                                                                                                                                                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DR.1 | Class + interface pair for every "concept" — *"we want a class/interface pair for every concept used"*                                                                                                         | `ColourfulWorkflowSearchResultsImpl` (class, new in 002) implements `WorkflowSearchResults` (interface, already in agentic-hq). No new concepts introduced (the impl is a new implementation of an existing concept — see RED plan's Concept Table).                                                                                                                                                                                                                                              | MET                    | —                                                                                                                                                                                                                                                                                                                                                                                             |
| DR.2 | Interface naming convention — *"the interface gets the concept name... and the concrete implementation appends `Impl`"*                                                                                         | Class is `ColourfulWorkflowSearchResultsImpl`, interface is `WorkflowSearchResults`. "Colourful" prefix distinguishes from default `WorkflowSearchResultsImpl`. Matches the root project's pattern of prefixed variants.                                                                                                                                                                                                                                                                            | MET                    | —                                                                                                                                                                                                                                                                                                                                                                                             |
| DR.3 | Tell, don't ask — push work into the thing that can do it                                                                                                                                                    | `registerWorkflowsWith(registry)` cleanly delegates to each Workspace — a pure "tell". `getWorkflowsListingString()` calls `workspace.getWorkflowListingString()` on each Workspace (the workspace produces its own formatted string rather than this class extracting internal state) — aligned with the root project's pattern. The impl's own job (ANSI-wrapping) is genuinely inside this class's responsibility.                                                                             | MET                    | —                                                                                                                                                                                                                                                                                                                                                                                             |
| DR.4 | Switchable concrete classes — *"If someone wants to replace (switch out) just one small aspect of the feature... could they do it easily?"*                                                                  | `ColourfulWorkflowSearchResultsImpl` is itself a Classwitch-switchable override of `WorkflowSearchResultsImpl`. That's the whole point of the class — it proves the switchability mechanism works. **Colour-palette switching specifically** (not the whole class) is not exposed, but see `Tier 2 Refactor 2.2` above for the analysis and the explicit balance-caveat invocation.                                                                                                                | MET                    | See `Refactor 2.2` — adding `ColourScheme` injection would make colour-palette switching explicit. Recommended against (gold-plating for a TEMP project, balance caveat applies).                                                                                                                                                                                                             |
| DR.5 | Avoid cached state — *"Store minimal source data, derive values dynamically on each method call"* (also `feedback_avoid_cached_state.md`)                                                                   | Only fields are the two constructor-injected `Workspace` objects. `getWorkflowsListingString()` re-derives the listing on every call (calls `workspace.getWorkflowListingString()` fresh each time). `registerWorkflowsWith` holds no state. No listing-string cache.                                                                                                                                                                                                                            | MET                    | —                                                                                                                                                                                                                                                                                                                                                                                             |
| DR.6 | Balance caveat — *"we aren't going to fracture our system to the extreme"*                                                                                                                                   | The impl is 55 lines, 2 methods, no helper sub-objects, no over-layering. Constants are at module scope (simple), class is cohesive.                                                                                                                                                                                                                                                                                                                                                                | MET                    | —                                                                                                                                                                                                                                                                                                                                                                                             |
| DR.7 | Every "thing" should be a class/interface, not a primitive                                                                                                                                                    | `Workspace`, `WorkflowRegistry`, `WorkflowSearchResults` are all classes/interfaces (imported as types). The ANSI colour codes and header text are module-level `const` strings — but they aren't *concepts* in the domain sense, they're implementation-detail literals. Treating each ANSI sequence as a class (`GreenAnsiEscape`, `BlueAnsiEscape`...) would be absurd. The balance caveat explicitly covers this.                                                                           | MET                    | —                                                                                                                                                                                                                                                                                                                                                                                             |
| DR.8 | Concept Table / Data Dictionary / English Language Description during planning                                                                                                                                | RED plan (`02-red-phase-failing-test-plan-copy.md` lines 27-36) has a Concept Table. RED plan lines 40-64 has an ELD. GREEN plan says no new concepts introduced. No new design-doc update required for GREEN.                                                                                                                                                                                                                                                                                     | MET                    | —                                                                                                                                                                                                                                                                                                                                                                                             |
| DR.9 | SRP header on every class — *"Read the SRP header of multiple classes and interfaces to see how this is designed and documented."*                                                                              | Impl has a "Why this file exists", "SRP Does", "SRP Knows About", "SRP Knows Nothing About" block (lines 1-24). Matches the convention. Includes a REFACTOR NOTE explaining deferred defaults.                                                                                                                                                                                                                                                                                                    | MET                    | —                                                                                                                                                                                                                                                                                                                                                                                             |

**Summary**: 9 of 9 requirements MET, 0 PARTIALLY MET, 0 NOT MET, 0 NOT APPLICABLE.

> **Note to human**: One proposal (`Refactor 2.2` — colour-scheme injection) was raised by a literal reading of DR.4 and is logged in Tier 2 above for your APPROVE / REJECT / DISCUSS decision. I've recommended against it citing the balance caveat and gold-plating risk on a TEMP project.

---

## Summary

| Category                                          | Count |
| ------------------------------------------------- | ----- |
| Tier 1 (Auto-approved)                            | 3     |
| Tier 2 AI-Identified (Pending review)             | 2     |
| Design Requirements Audit (items needing action)  | 0     |
| **Total identified by AI**                        | **5** |

---

## Agreed Refactors Discussion Notes

No items required discussion. Human rejected both AI-Identified Tier 2 items (2.1 and 2.2) and recorded "None" for Human-Identified refactors, so the straight APPROVE/REJECT outcomes are captured directly in the Agreed Refactors Summary Table below.

---

## Agreed Refactors Summary Table

> For detail on any discussed item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above. (No discussions occurred for this analysis.)

| #   | Source | Description                                                                                                                                                              | Decision | Notes                       |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | --------------------------- |
| 1.1 | AI     | Add one-line TSDoc on `getWorkflowsListingString()` in the impl file (lifted from 001's reference, line 49).                                                             | EXECUTE  | Tier 1 auto-approved        |
| 1.2 | AI     | Add one-line TSDoc on `registerWorkflowsWith(registry)` in the impl file (lifted from 001's reference, line 57).                                                         | EXECUTE  | Tier 1 auto-approved        |
| 1.3 | AI     | Rename `result` → `colourfulResults` in the unit test file (lines 45 and 62).                                                                                            | EXECUTE  | Tier 1 auto-approved        |
| 2.1 | AI     | Extract `wrap(colour, text)` helper in the impl to remove the `${COLOUR}${...}${RESET}` repetition.                                                                     | SKIP     | Rejected by human           |
| 2.2 | AI     | Introduce a `ColourScheme` interface + default impl, inject into `ColourfulWorkflowSearchResultsImpl` to let third parties swap palettes without replacing the class. | SKIP     | Rejected by human           |

---

## Next Steps

1. Review the "Previous Phases" table — if you disagree with any "Skip", add it to Human-Identified Potential Refactors
2. Mark each AI-Identified Tier 2 refactor as APPROVE / REJECT / DISCUSS
3. Fill in "Human-Identified Potential Refactors" with your own refactors, or write "None"
4. Tell the AI you've completed your review
5. The AI will discuss: any items you marked DISCUSS + all human-identified items
6. After discussion, the AI fills in "Agreed Refactors Discussion Notes" and "Agreed Refactors Summary Table"
7. The execute phase (04b) runs automatically

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-04-23.

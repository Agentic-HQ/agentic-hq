# REFACTOR Analysis: AHQ-91 (unit test)

**Jira**: [AHQ-91](https://agentic-hq.atlassian.net/browse/AHQ-91)
**Test Type**: unit
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-04-18

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

**Command**: `pnpm test` (`vitest run --config vitest.unit.config.ts`)
**Result**: PASSING (140 tests across 33 test files — includes all 13 new tests from RED)

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, RED-phase, GREEN-phase plan and GREEN-phase summary for deferred items and opportunities identified by the earlier phases.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | GREEN plan, §"Deferred to REFACTOR" bullet 1 + GREEN summary §"Key implementation decisions" point 1 | Deferred | `WorkspaceImpl.isAhqWorkspace()` uses the bare string literal `'AGENTIC_HQ_WORKSPACE_ROOT'` via `process.env.AGENTIC_HQ_WORKSPACE_ROOT` (line 64 of `workspace-impl.ts`). Duplicates the `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` constant already exported from `ahq-workspace-impl.ts`. Importing from `ahq-workspace-impl.ts` would create a circular dependency (ahq-workspace-impl already imports WorkspaceImpl). The fix is to extract the constant to a new shared module. | Worth doing. The duplication of a magic string across the two files is a real code smell, and the circular-import reason for keeping it is a legitimate structural problem rather than a style choice. Adding one small constants file is cheap and eliminates the footgun of the two files drifting apart. | Tier 2 (introduces a new file) |
| P.2 | GREEN plan, §"Deferred to REFACTOR" Q6 note + AI summary Q6 human response + Acceptance Criteria bullet "REFACTOR note captured for later" | Deferred (explicitly deferred by the human in Q6) | `AhqWorkspaceImpl.getTempDir()` and `CurrentUserWorkspaceImpl.getTempDir()` both contain `return this.createDelegate().getTempDir();` — and the same pattern for `getDotAgenticHqDir`. In fact, ALL four new methods on `AhqWorkspaceImpl` follow exactly the same shape (`return this.createDelegate().X();`) except for `isAhqWorkspace` which overrides, and `CurrentUserWorkspaceImpl` has four identical delegating one-liners too. | Not worth consolidating. Each outer impl has exactly 3–4 one-line delegations; extracting a shared mixin or base class to eliminate them would cost more code than it saves. The two outer impls differ semantically in one method each (AhqWorkspaceImpl.isAhqWorkspace overrides to `true`; CurrentUserWorkspaceImpl.getWorkflowListingString / registerWorkflowsWith skip when same-as-AHQ) — those differences are what justifies keeping them as separate classes at all. The delegation one-liners are the glue, not the smell. Q6 rightly flagged this as "consider later" rather than "must do." | Skip |
| P.3 | GREEN summary §"Key implementation decisions" point 3 ("isSameAsAhqWorkspace() now delegates to this.isAhqWorkspace()"); RED plan §Plan Steps step 14 ("nice simplification"); GREEN plan, Step 5 last paragraph ("Kept the private helper's name for now") | Observed | `CurrentUserWorkspaceImpl.isSameAsAhqWorkspace()` is now a one-line private helper whose body is `return this.isAhqWorkspace();`. It was previously non-trivial (did its own env-var read). Now it adds no behaviour — it's just a rename alias. The two call sites (lines 28, 36) could call `this.isAhqWorkspace()` directly. | Worth inlining. Keeping a private method that is a trivial 1-line rename of another method on the same class is noise: the name `isSameAsAhqWorkspace` and `isAhqWorkspace` convey the same intent inside `CurrentUserWorkspaceImpl` (both answer "is this workspace the AHQ workspace"). Removing the helper saves a method, one self-call, and the mental overhead of wondering whether the two names mean different things. | Tier 2 (semantic change — drops a private method name that may aid readability at call sites) |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below.

---

## Magic Constants Audit

Examining all literal strings and numbers in files modified during this Jira's GREEN phase. The four files changed were `workspace.ts` (interface — no literals), `workspace-impl.ts`, `ahq-workspace-impl.ts`, `current-user-workspace-impl.ts`.

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `src/workflow-discovery/workspace/workspace-impl.ts` | 8 | `'.agentic-hq'` (inside `PLUGINS_DIR = path.join('.agentic-hq', 'plugins')`) | MAGIC (existing, but now DUPLICATED with 2 new usages below — extracting becomes worthwhile) | -> `DOT_AGENTIC_HQ_DIR_NAME` |
| `src/workflow-discovery/workspace/workspace-impl.ts` | 8 | `'plugins'` (inside `PLUGINS_DIR`) | EXTRACTED — `PLUGINS_DIR` already wraps this literal as a named constant used once at line 69 | `PLUGINS_DIR` |
| `src/workflow-discovery/workspace/workspace-impl.ts` | 54 | `'.agentic-hq'` (NEW — inside `getTempDir` path.join) | MAGIC | -> `DOT_AGENTIC_HQ_DIR_NAME` |
| `src/workflow-discovery/workspace/workspace-impl.ts` | 54 | `'temp'` (NEW — inside `getTempDir` path.join) | MAGIC | -> `TEMP_SUBDIR_NAME` |
| `src/workflow-discovery/workspace/workspace-impl.ts` | 59 | `'.agentic-hq'` (NEW — inside `getDotAgenticHqDir` path.join) | MAGIC | -> `DOT_AGENTIC_HQ_DIR_NAME` |
| `src/workflow-discovery/workspace/workspace-impl.ts` | 64 | `'AGENTIC_HQ_WORKSPACE_ROOT'` (NEW — bare string in `process.env.AGENTIC_HQ_WORKSPACE_ROOT`) | MAGIC (duplicated with `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` in `ahq-workspace-impl.ts:6`; circular import prevents reuse) | see P.1 — Tier 2 |
| `src/workflow-discovery/workspace/ahq-workspace-impl.ts` | 6 | `'AGENTIC_HQ_WORKSPACE_ROOT'` | EXTRACTED | `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` |
| `src/workflow-discovery/workspace/ahq-workspace-impl.ts` | 7 | `'Agentic HQ Workspace'` | EXTRACTED | `AHQ_WORKSPACE_DISPLAY_NAME` |
| `src/workflow-discovery/workspace/current-user-workspace-impl.ts` | 6 | `'Local Workspace'` | EXTRACTED | `LOCAL_WORKSPACE_DISPLAY_NAME` |
| `src/workflow-discovery/workspace/current-user-workspace-impl.ts` | 7-8 | `'Local Workspace: Same as Agentic HQ Workspace (...)'` | EXTRACTED | `SAME_AS_AHQ_MESSAGE` |

**MAGIC entries** drive the Tier 1 refactors below (`.agentic-hq` and `temp`). The `AGENTIC_HQ_WORKSPACE_ROOT` bare-string case is P.1 above and becomes Tier 2 because the fix requires a new shared module.

---

## Audit To Confirm Methods Used In Production Code (Not Just Tests)

Auditing every method on the `Workspace` interface and its three implementations. This Jira added four new methods to `Workspace` and modified one private helper in `CurrentUserWorkspaceImpl`.

**Legend**:
- **✓** = used as intended (interface methods: called through the interface from outside the implementing class; class-only methods: any production caller exists)
- **NOT USED THROUGH INTERFACE ⚠️** = interface method only called by `this.method()` from inside the implementing class (plus possibly tests) — should be made private + removed from the interface
- **TEST-ONLY ⚠️** = zero production callers (not even self-calls); only tests reference it — should be deleted
- **NOT-YET-WIRED** = subsystem entry point, deliberately not yet wired into the CLI (will be wired later) — keep

| Interface / Class | Method | Status | Evidence |
|---|---|---|---|
| `Workspace` | `getWorkflowListingString()` | ✓ | External callers: `WorkflowSearchResultsImpl` at `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts:36-37` (both impls) |
| `Workspace` | `registerWorkflowsWith(registry)` | ✓ | External callers: `WorkflowSearchResultsImpl` at `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts:42-43` |
| `Workspace` | `getRoot()` (NEW) | NOT-YET-WIRED | Will replace the existing 4 `userWorkspace.getRoot()` / `workspace.getRoot()` call sites in `marshalled-cli-tool.ts:46`, `claude-workflow-command-builder.ts:36`, `claude-command-builder.ts:108` during the e2e REFACTOR phase. Consumer migration is deliberately scoped to e2e REFACTOR (see ai-summary §"Scope Handoff"). |
| `Workspace` | `getTempDir()` (NEW) | NOT-YET-WIRED | Will replace the existing `workspace.getTempDir()` call in `json-file-io-marshaller-session-factory.ts:21` during the e2e REFACTOR phase. |
| `Workspace` | `getDotAgenticHqDir()` (NEW) | NOT-YET-WIRED | Will replace the existing `agenticHqInstallation.getConfigDir()` call (the misleadingly-named legacy method in `default-agentic-hq-installation.ts`) during the e2e REFACTOR phase. |
| `Workspace` | `isAhqWorkspace()` (NEW) | NOT-YET-WIRED (plus one internal self-call) | Will replace the existing string-comparison dedup logic in `ClaudeCommandBuilder.getPluginDirFlags()` (per ai-summary §"Research Findings" bullet 3) during e2e REFACTOR. Currently has one self-call inside `CurrentUserWorkspaceImpl.isSameAsAhqWorkspace()` (line 63) — see P.3 above. |
| `WorkspaceImpl` | `discoverPlugins()` (private) | ✓ | Called from `this.getWorkflowListingString()` and `this.registerWorkflowsWith()` inside the same class. Pre-existing, not modified by this Jira. |
| `AhqWorkspaceImpl` | `createDelegate()` (private) | ✓ | Called from `this.getWorkflowListingString()`, `this.registerWorkflowsWith()`, `this.getTempDir()`, `this.getDotAgenticHqDir()` inside the same class. |
| `CurrentUserWorkspaceImpl` | `createDelegate()` (private) | ✓ | Called from `this.getWorkflowListingString()`, `this.registerWorkflowsWith()`, `this.getRoot()`, `this.getTempDir()`, `this.getDotAgenticHqDir()`, `this.isAhqWorkspace()` inside the same class. |
| `CurrentUserWorkspaceImpl` | `isSameAsAhqWorkspace()` (private) | ✓ but TRIVIAL (code smell — see P.3) | Called from `this.getWorkflowListingString()` (line 28) and `this.registerWorkflowsWith()` (line 36) inside the same class. Body is a 1-line alias for `this.isAhqWorkspace()`. Candidate for inlining. |

**Flagged methods:**
- None are flagged as NOT USED THROUGH INTERFACE or TEST-ONLY.
- All four NEW interface methods are legitimately NOT-YET-WIRED: the unit test cycle scope deliberately limits itself to adding the methods; wiring-up of consumers (the 5+ existing production call sites already documented in the ai-summary and GREEN plan) belongs to the e2e REFACTOR phase. These methods are **not** speculative API surface — each one has a documented, real, existing production call site that will migrate onto it.
- `CurrentUserWorkspaceImpl.isSameAsAhqWorkspace()` is flagged in P.3 above as a candidate for inlining — surfaced there rather than here because the rename-alias nature (not "unused") is better described as a simplification opportunity.

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.1 | Extract magic constant | Extract `'.agentic-hq'` to a module-level constant `DOT_AGENTIC_HQ_DIR_NAME = '.agentic-hq'` and use it in: (a) the existing `PLUGINS_DIR = path.join(...)` definition, (b) the new `getTempDir` path.join, (c) the new `getDotAgenticHqDir` path.join. After extraction, the string `.agentic-hq` appears only once in the file. | `src/workflow-discovery/workspace/workspace-impl.ts` Lines: `8`, `54`, `59` |
| 1.2 | Extract magic constant | Extract `'temp'` to a module-level constant `TEMP_SUBDIR_NAME = 'temp'` used in the new `getTempDir` path.join. Even though it appears only once, the principle of naming the meaning ("this is the temp subdirectory name") improves grep-ability and keeps the pattern consistent with `PLUGINS_DIR` / `DOT_AGENTIC_HQ_DIR_NAME`. | `src/workflow-discovery/workspace/workspace-impl.ts` Line: `54` |

---

## Tier 2: AI-Identified Potential Refactors

Include ALL potential structural refactors here - both ones you recommend AND ones you're unsure about or even think shouldn't be done. The human decides; your job is to surface them all with honest opinions.

### Refactor 2.1: Replace bare string literal in `workspace-impl.ts` with a locally-declared `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` constant

**Type**: Extract magic constant (local duplication of the constant declaration — no new file, no shared import)
**Description**: In `src/workflow-discovery/workspace/workspace-impl.ts`, declare a module-local constant `const AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR = 'AGENTIC_HQ_WORKSPACE_ROOT';` at the top of the file, alongside the existing `PLUGINS_DIR` constant. Change `isAhqWorkspace()` (line 64) from `return this.rootDir === process.env.AGENTIC_HQ_WORKSPACE_ROOT;` to `return this.rootDir === process.env[AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR];`. The existing constant in `ahq-workspace-impl.ts:6` is left untouched.

Both files end up declaring the same short env-var-name string literal. That's an accepted trade-off: each file stays self-contained (no new shared module, no circular-import risk), and the bare-string magic value in `workspace-impl.ts` is replaced by a named constant that makes the purpose of the string obvious at the usage site.
**AI Recommendation**: RECOMMEND (simplest-thing-that-could-possibly-work form, approved by human during analysis discussion). This removes the magic string from `workspace-impl.ts` while avoiding the ceremony of creating a new shared module. A rename of the env var would touch both files — but that was already true of the current state (bare string in one file, constant in the other), so no regression.
**Risk**: Very low. Localised change in one file; adds one constant declaration and one line edit. No cross-file coupling introduced.
**Files affected**: `src/workflow-discovery/workspace/workspace-impl.ts` (only)

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments**: Approved by human on 2026-04-18 — local per-file constant declaration chosen over new shared module for simplicity.

---

### Refactor 2.2: Inline the `CurrentUserWorkspaceImpl.isSameAsAhqWorkspace()` private helper

**Type**: Remove redundant private method (trivial rename alias)
**Description**: Replace the two call sites (`current-user-workspace-impl.ts:28` and `:36`) with `this.isAhqWorkspace()` directly, then delete the private `isSameAsAhqWorkspace()` method at line 62-64. The method's body is a one-line pass-through to `this.isAhqWorkspace()` and it adds no behaviour or extra context.
**AI Recommendation**: RECOMMEND. This is exactly the kind of residue that a REFACTOR phase is for — a helper whose reason for existence (doing its own env-var read) disappeared in GREEN but whose name survived out of inertia. Now the name is essentially a second label for the same public method.
**Risk**: Tiny loss of readability at the two call sites — `if (this.isSameAsAhqWorkspace())` reads as a yes/no question about "am I in the same place as AHQ?", whereas `if (this.isAhqWorkspace())` reads as "am I the AHQ workspace?" — both convey the same truth but the former is arguably slightly more self-explanatory inside the `CurrentUserWorkspaceImpl` class. If that reading aid matters, keep the helper; if not, delete it.
**Files affected**: `src/workflow-discovery/workspace/current-user-workspace-impl.ts`

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None". Everything added here will be discussed with the AI before a decision is made.

> **MANDATORY**: You MUST either add refactors here OR write "None" before the execute phase can proceed.

None

---

## Project Design Requirements Compliance Audit

**Design Requirements File**: `docs/dev/project-design-requirements.md`

Auditing the code produced in this Jira (the four new methods on `Workspace` and their implementations across three classes) against each distinct requirement in the design requirements doc.

| # | Requirement | Evidence (files, classes, patterns) | Status | Refactoring Proposal (if needed) |
|---|-------------|-------------------------------------|--------|----------------------------------|
| DR.1 | **Class/interface pair for every concept**: every concept in the system should have both an interface and a concrete `Impl` class. | The only concept in scope is "Workspace" — already covered by the `Workspace` interface (`src/workflow-discovery/interfaces/workspace.ts`) and three concrete impls (`WorkspaceImpl`, `AhqWorkspaceImpl`, `CurrentUserWorkspaceImpl`). The four new methods (`getRoot`, `getTempDir`, `getDotAgenticHqDir`, `isAhqWorkspace`) expose existing well-understood concepts (root directory, temp directory, dot-agentic-hq directory, is-this-the-AHQ-workspace) but none of those concepts warrants its own concept-class-per-string — they are path strings returned from a workspace, not standalone concepts. The RED-phase plan explicitly skipped creating `AhqWorkspace`/`CurrentUserWorkspace` sub-interfaces (human confirmed during planning) since they would carry zero methods beyond `Workspace`. | MET | — |
| DR.2 | **Default naming convention**: interface gets the concept name, impl class appends `Impl` (e.g. `WorkflowSearchResults` / `WorkflowSearchResultsImpl`). | All three impls use the `Impl` suffix: `WorkspaceImpl`, `AhqWorkspaceImpl`, `CurrentUserWorkspaceImpl`. The interface is `Workspace`. | MET | — |
| DR.3 | **Tell, don't ask / push work into the object**: prefer `workspace.isAhqWorkspace()` over `workspace.getRoot() === process.env.X` at call sites. | The new `isAhqWorkspace()` method is a textbook example of this requirement — the workspace owns the "am I the AHQ workspace?" question rather than callers doing string comparisons. The fact that the Jira (and human Q5 answer) explicitly asked for this method rather than a getter-based comparison indicates the requirement is front-of-mind. | MET | — |
| DR.4 | **Switchability / `classwitch`**: a third-party impl of `Workspace` could replace any of ours without forcing callers to change. | Tests type variables as the `Workspace` interface (`const workspace: Workspace = new WorkspaceImpl(...)`) — the contract is the interface. All four new methods are declared on the interface before being implemented. A third-party `CustomWorkspaceImpl` implementing `Workspace` would satisfy all current consumers. | MET | — |
| DR.5 | **Minimal state / avoid cached state**: don't cache derived values in fields; compute on each method call. | `WorkspaceImpl` stores only constructor args (`displayName`, `rootDir`) — no derived state. `AhqWorkspaceImpl` and `CurrentUserWorkspaceImpl` store **zero** fields; they re-read env var / cwd on each method call and create a fresh `WorkspaceImpl` delegate each time. This is more aggressive than strictly required (one could cache the delegate) but matches the "avoid cached state" requirement and the existing pattern. | MET | — |
| DR.6 | **Balance caveat**: appropriately balanced — not fractured to the extreme to make every single behaviour switchable. | Four new methods were added to one interface (`Workspace`) rather than spun into four new sub-interfaces or value-object classes like `WorkspaceRoot`, `WorkspaceTempDir`, `WorkspaceDotAgenticHqDir`. This is the correct balance — all four are properties *of the workspace*, and switching one without the others wouldn't make sense. Confirmed by Q4 (human: "Put them on Workspace"). | MET | — |
| DR.7 | **Concept Table / Data Dictionary / ELD requirement**: these are planning-phase artifacts produced by the RED / GREEN plans. Not a refactor-phase audit item, but worth confirming they exist. | Both RED plan and GREEN plan contain a Concept Table, Data Dictionary, and English Language Description. They accurately describe the implementation that shipped. | MET | — |

**Summary**: 7 of 7 requirements MET, 0 PARTIALLY MET, 0 NOT MET, 0 NOT APPLICABLE.

> **Note to human**: No refactor proposals arise from the design-requirements audit — the design is clean and compliant. The Tier 2 items above (constants extraction, private helper inlining) are about implementation hygiene, not design-requirement compliance.

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 2 |
| Tier 2 AI-Identified (Pending review) | 2 |
| Design Requirements Audit (items needing action) | 0 |
| **Total identified by AI** | 4 |

---

## Agreed Refactors Discussion Notes

### Refactor 2.1: Replace bare string literal in `workspace-impl.ts` with a locally-declared `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` constant
**Decision**: EXECUTE (modified from original proposal)
**Summary**: The original proposal was to extract the constant to a new shared module (`workspace-env-vars.ts`) that both `workspace-impl.ts` and `ahq-workspace-impl.ts` would import — dodging the circular-import issue flagged by the GREEN plan. The human pushed back that this felt unnecessary: one short env-var-name string in two places is barely a duplication, the env var name is a stable external contract (set by `bin/agentic-hq.cjs`), and a new file + two imports is more ceremony than it removes. The AI reconsidered and agreed. The human then proposed the simplest-thing-that-could-possibly-work alternative: declare the same constant locally in **both** files, so each file is self-contained (no new file, no import, no circular-import risk). The AI agreed that is a better form of the refactor. Final agreed approach: add `const AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR = 'AGENTIC_HQ_WORKSPACE_ROOT';` at the top of `workspace-impl.ts` and change line 64 to use `process.env[AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR]`. `ahq-workspace-impl.ts` is untouched.

---

## Agreed Refactors Summary Table

> For detail on any discussed item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above.

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 1.1 | AI (Tier 1) | Extract `'.agentic-hq'` string to module-level constant `DOT_AGENTIC_HQ_DIR_NAME` in `workspace-impl.ts` and use it in the 3 usages on lines 8, 54, 59. | EXECUTE | Auto-approved (Tier 1). |
| 1.2 | AI (Tier 1) | Extract `'temp'` string to module-level constant `TEMP_SUBDIR_NAME` in `workspace-impl.ts` line 54. | EXECUTE | Auto-approved (Tier 1). |
| 2.1 | AI (Tier 2) | Declare `const AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR = 'AGENTIC_HQ_WORKSPACE_ROOT';` locally in `workspace-impl.ts` and use `process.env[AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR]` in `isAhqWorkspace()` (line 64). `ahq-workspace-impl.ts` is untouched. | EXECUTE (modified) | Human approved after discussion changed shape from "new shared module" to "local per-file constant declaration". See discussion notes. |
| 2.2 | AI (Tier 2) | Inline the `CurrentUserWorkspaceImpl.isSameAsAhqWorkspace()` private helper: replace its 2 call sites (lines 28, 36) with `this.isAhqWorkspace()` directly and delete the private method at lines 62-64. | EXECUTE | Approved by human. |

---

## Next Steps

1. Review the "Previous Phases" table - if you disagree with any "Skip", add it to Human-Identified Potential Refactors
2. Mark each AI-Identified Tier 2 refactor as APPROVE / REJECT / DISCUSS
3. Fill in "Human-Identified Potential Refactors" with your own refactors, or write "None"
4. Tell the AI you've completed your review
5. The AI will discuss: any items you marked DISCUSS + all human-identified items
6. After discussion, the AI fills in "Agreed Refactors Discussion Notes" and "Agreed Refactors Summary Table"
7. The execute phase (04b) runs automatically

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-04-18.

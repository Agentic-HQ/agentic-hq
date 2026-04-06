# REFACTOR Analysis: AHQ-104 (e2e test)

**Jira**: [AHQ-104](https://agentic-hq.atlassian.net/browse/AHQ-104)
**Test Type**: e2e
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-04-06

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

**Command**: `pnpm test:e2e:cross-workspace-list-workflows`
**Result**: PASSING (1 test)

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, red phase, green phase, and implementation documents for deferred items and opportunities.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | GREEN e2e summary, item 1: "Remove unused private methods `getShortName()` and `getFullClaudeSkillCommand()` from `AhqWorkflowImpl`" | Deferred | Delete the two private methods that are no longer called after the format change from 3-column to 2-line. | Yes, obvious dead code. These were private helpers for the old format's line 1 (`shortName /plugin:skill description`) which no longer exists. | Tier 1 |
| P.2 | GREEN e2e summary, item 2: "Remove now-unused constants `WORKFLOW_LINE_INDENT` and `EXAMPLE_LINE_PREFIX`... associated imports remain" | Deferred | Remove unused type imports (`FullClaudeSkillCommand`, `WorkflowShortName`) and value imports (`FullClaudeSkillCommandImpl`, `WorkflowShortNameImpl`) from `ahq-workflow-impl.ts`. Constants themselves already removed in GREEN. | Yes, these imports only serve the deleted methods from P.1. Clean dead-import removal. | Tier 1 |
| P.3 | GREEN e2e summary, item 3: "Evaluate whether `FullClaudeSkillCommandImpl`, `PluginIdImpl`, `SkillIdImpl` classes + their unit tests should be deleted" | Deferred | Three value-object classes + their interfaces + their unit test files are no longer called from any production code. The only production caller was `AhqWorkflowImpl.getFullClaudeSkillCommand()` which is now dead code (P.1). | Unsure. They ARE dead code right now. BUT short-alias subcommand routing (item 5 below) may need `PluginId`/`SkillId` to resolve `fullPath` for `builder.build()`. Deleting now and re-creating later is wasteful if they're needed within 1-2 Jiras. | Tier 2 |
| P.4 | GREEN e2e summary, item 4: "Replace inline `new WorkflowSearchResultsImpl()` in createProgram's list action with proper DI" | Deferred | The list action at `agentic-hq-program.ts:40` does `new WorkflowSearchResultsImpl()` inline instead of accepting it via injection like `builder` and `registry`. | Not recommended for this Jira. The inline instantiation works and the entire `createProgram` function will evolve when short-alias routing switches to discovery. Refactoring the DI now means redoing it when the function signature changes. | Tier 2 |
| P.5 | GREEN e2e summary, item 5: "Replace `DEMO_SKILLS` + `WorkflowSkillsRegistry` + `WorkflowSkill` stack with discovery-based short-alias subcommand registration" | Deferred | Short-alias subcommands (`agentic-hq math`, etc.) still use the old hardcoded `DEMO_SKILLS` registry. Only `list` uses dynamic discovery. | Out of scope for AHQ-104. This is a separate piece of work that needs its own Jira (likely a subtask of AHQ-103). Would require significant changes to how short-alias routing resolves skill paths. | Skip |
| P.6 | GREEN e2e summary, item 6: "Rename misleading test 'should include at least one indented \"What it does:\" line'" | Deferred | Test at `workflow-search-results-impl.unit.test.ts:44` claims to check for "What it does:" lines but actually checks for any line starting with 2 spaces (`l.startsWith('  ')`). Name is actively misleading. | Yes, easy fix. Either rename to match what it actually checks, or fix the assertion to match the name. I recommend fixing the assertion to actually check `'   What it does:'` since that's more meaningful. | Tier 1 |
| P.7 | GREEN e2e summary, item 7: "Remove old files once short aliases use discovery" | Deferred | Delete `src/demo/demo-skills.ts`, `src/workflow/workflow-skills/workflow-skills-registry.ts`, `src/interfaces/workflow-skill.ts` | Blocked by P.5 — these files are still actively used by short-alias subcommands. Cannot delete until discovery-based routing replaces them. | Skip |
| P.8 | GREEN e2e summary, item 8: "Pre-existing lint warning: unused eslint-disable directive in `src/workflow-discovery/interfaces/workflow-metadata.ts:16`" | Deferred | The `// eslint-disable-next-line @typescript-eslint/no-empty-object-type` comment may be unnecessary if the rule is no longer active. | Worth checking — if lint passes without it, remove it. Small cleanup. | Tier 1 |
| P.9 | GREEN e2e plan, Step 4 note: "the test name is misleading now (there's no column alignment)" | Observed | Same as P.6 — the plan noted this as a concern during the format update but deferred it. | Already captured by P.6. | (duplicate of P.6) |

> **Note to human**: The AI's recommendations are opinions. If you disagree with any "Skip", add it to the Human-Identified Refactors section below.

---

## Magic Constants Audit

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `src/workflow-discovery/workflow/ahq-workflow-impl.ts` | 15 | `'\n   What it does: '` | EXTRACTED | `WHAT_IT_DOES_LINE_PREFIX` |
| `src/cli/agentic-hq-program.ts` | 40 | (no magic constants in changed code) | N/A | — |
| `tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts` | 36 | `60_000` | EXTRACTED | `TEST_TIMEOUT_MS` |
| `tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts` | 37 | `30_000` | EXTRACTED | `INSTALL_SCRIPT_TIMEOUT_MS` |

> All literal values in the files modified during this e2e phase are already extracted to named constants.

---

## Audit To Confirm Methods Used In Production Code (Not Just Tests)

Auditing every method on every interface/class created or modified in this Jira's e2e phase.

**Legend**:
- **checkmark** = used as intended (interface methods: called through the interface from outside the implementing class; class-only methods: any production caller exists)
- **NOT USED THROUGH INTERFACE** = interface method only called by `this.method()` from inside the implementing class (plus possibly tests) — should be made private + removed from the interface
- **TEST-ONLY** = zero production callers (not even self-calls); only tests reference it — should be deleted
- **NOT-YET-WIRED** = subsystem entry point, deliberately not yet wired into the CLI (will be wired later) — keep
- **DEAD CODE** = private method not called by anything — should be deleted

| Interface / Class | Method | Status | Evidence |
|---|---|---|---|
| `AhqWorkflow` | `getWorkflowListingEntryString()` | checkmark | Called by `ahq-workflows-impl.ts:30` via interface |
| `WorkflowSearchResults` | `getWorkflowsListingString()` | checkmark | Called by `agentic-hq-program.ts:40` via interface |
| `AhqWorkflows` | `getWorkflowListingEntriesString()` | checkmark | Called by `workflow-search-results-impl.ts:30` via interface |
| `AhqWorkflowImpl` | `private getShortName()` | DEAD CODE | Not called by any method. Was called by old `getWorkflowListingEntryString()` format but no longer. |
| `AhqWorkflowImpl` | `private getFullClaudeSkillCommand()` | DEAD CODE | Not called by any method. Was called by old `getWorkflowListingEntryString()` format but no longer. |
| `AhqWorkflowImpl` | `private getDescription()` | checkmark | Called by `this.getWorkflowListingEntryString()` at line 57 |
| `AhqWorkflowImpl` | `private getExampleCommand()` | checkmark | Called by `this.getWorkflowListingEntryString()` at line 56 |

**Flagged methods:**
- `AhqWorkflowImpl.getShortName()` — **delete** (dead private method, no callers)
- `AhqWorkflowImpl.getFullClaudeSkillCommand()` — **delete** (dead private method, no callers)

Both are already captured as Tier 1 refactor P.1 above.

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.1 | Remove dead code | Delete unused private method `getShortName()` and its TSDoc comment | `src/workflow-discovery/workflow/ahq-workflow-impl.ts` Lines: 38-41 |
| 1.2 | Remove dead code | Delete unused private method `getFullClaudeSkillCommand()` and its TSDoc comment | `src/workflow-discovery/workflow/ahq-workflow-impl.ts` Lines: 46-49 |
| 1.3 | Remove dead imports | Remove 4 unused imports: `FullClaudeSkillCommand` type, `WorkflowShortName` type, `FullClaudeSkillCommandImpl`, `WorkflowShortNameImpl` (all orphaned by 1.1 + 1.2) | `src/workflow-discovery/workflow/ahq-workflow-impl.ts` Lines: 4, 7, 11, 13 |
| 1.4 | Fix misleading test | Rename test "should include at least one indented 'What it does:' line" and fix its assertion to actually check for `'   What it does:'` prefix instead of generic 2-space indent | `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts` Lines: 44-51 |
| 1.5 | Remove unnecessary lint suppression | Remove the `// eslint-disable-next-line @typescript-eslint/no-empty-object-type` comment if lint passes without it | `src/workflow-discovery/interfaces/workflow-metadata.ts` Line: 16 |

---

## Tier 2: AI-Identified Potential Refactors

Include ALL potential structural refactors here — both ones I recommend AND ones I'm unsure about. The human decides; my job is to surface them all with honest opinions.

### Refactor 2.1: Delete `FullClaudeSkillCommandImpl`, `PluginIdImpl`, `SkillIdImpl` classes + interfaces + unit tests

**Type**: Remove dead production code
**Description**: These three value-object classes (and their interfaces: `FullClaudeSkillCommand`, `PluginId`, `SkillId`) have zero production callers. The only production caller was `AhqWorkflowImpl.getFullClaudeSkillCommand()` (Tier 1 item 1.2 deletes it). Their unit tests exist in isolation — testing classes nothing else uses. That's 6 source files + 3 test files to delete.
**AI Recommendation**: NOT RECOMMENDED — these classes represent real concepts (`PluginId`, `SkillId`, `FullClaudeSkillCommand`) that will almost certainly be needed when short-alias subcommands switch from `DEMO_SKILLS` to discovery-based routing (a future AHQ-103 subtask). Deleting and re-creating them is wasteful churn. They're small, tested, and harmless as-is. The unit tests exercise real validation logic (empty/blank rejection) that would need re-testing if re-created.
**Risk**: If kept, they're dead code that could drift out of sync with reality. If deleted, re-creation is needed soon.
**Files affected**: `src/workflow-discovery/workflow/full-claude-skill-command-impl.ts`, `src/workflow-discovery/workflow/plugin-id-impl.ts`, `src/workflow-discovery/workflow/skill-id-impl.ts`, `src/workflow-discovery/interfaces/full-claude-skill-command.ts`, `src/workflow-discovery/interfaces/plugin-id.ts`, `src/workflow-discovery/interfaces/skill-id.ts`, `tests/unit/workflow-discovery/workflow/full-claude-skill-command-impl.unit.test.ts`, `tests/unit/workflow-discovery/workflow/plugin-id-impl.unit.test.ts`, `tests/unit/workflow-discovery/workflow/skill-id-impl.unit.test.ts`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.2: Replace inline `new WorkflowSearchResultsImpl()` with injected dependency

**Type**: Improve DI consistency
**Description**: `agentic-hq-program.ts:40` creates `new WorkflowSearchResultsImpl()` inline inside the list action, while `builder` and `registry` are properly injected into `createProgram()`. This violates the switchability design requirement — a third party can't easily swap the search results implementation.
**AI Recommendation**: NOT RECOMMENDED for this Jira. The `createProgram()` function signature will change significantly when short-alias routing switches to discovery (replacing `registry` parameter entirely). Refactoring the DI now means redoing it when the function evolves. This is a "stepping stone" refactor that would be undone.
**Risk**: Gold-plating — doing DI cleanup on a function about to change.
**Files affected**: `src/cli/agentic-hq-program.ts`, `src/cli/agentic-hq-cli.ts`, `src/kernel/composition-root.ts`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None". Everything added here will be discussed with the AI before a decision is made.

> **MANDATORY**: You MUST either add refactors here OR write "None" before the execute phase can proceed.

### Refactor H.1: Fix `author` field structure in all 5 `ahq-workflow.json` files to match AHQ-103 spec

**Source**: Human review — parent Jira AHQ-103 specifies `author` as a nested object `{ "name": "Agentic HQ" }`, but all 5 `ahq-workflow.json` files were created with `author` as a flat string `"Agentic HQ"`.
**Description**: Change the `author` field in all 5 `ahq-workflow.json` files from:
```json
"author": "Agentic HQ"
```
to:
```json
"author": {
  "name": "Agentic HQ"
}
```
This matches the structure defined in the parent Jira AHQ-103's technical details section.
**Files affected**: All 5 `ahq-workflow.json` files under `.agentic-hq/plugins/`

---

## Project Design Requirements Compliance Audit

**Design Requirements File**: `docs/dev/project-design-requirements.md`

| # | Requirement | Evidence (files, classes, patterns) | Status | Refactoring Proposal (if needed) |
|---|-------------|-------------------------------------|--------|----------------------------------|
| DR.1 | Every concept gets a class/interface pair | `AhqWorkflow`/`AhqWorkflowImpl`, `WorkflowSearchResults`/`WorkflowSearchResultsImpl`, `AhqWorkflows`/`AhqWorkflowsImpl` — all concepts used in e2e flow have pairs. No new concepts introduced in e2e phase. | MET | — |
| DR.2 | Primitives wrapped immediately, unwrapped at output boundary | `AhqWorkflowImpl.getWorkflowListingEntryString()` delegates to `ExampleCommandImpl` and `WorkflowDescriptionImpl` — value objects render via `toString()` at template-literal boundary in `ahq-workflow-impl.ts:58`. | MET | — |
| DR.3 | Minimal state, delegation, "tell don't ask" | `WorkflowSearchResultsImpl` delegates to `AhqWorkflowsImpl` which delegates to each `AhqWorkflow` — no intermediate state accumulation. `AhqWorkflowImpl` stores only `WorkflowMetadata` (source data). | MET | — |
| DR.4 | Data dictionary and English language description | Completed in unit-test planning phase. E2e phase added no new concepts. | NOT APPLICABLE | — |
| DR.5 | `Impl` naming convention | All concrete classes: `AhqWorkflowImpl`, `WorkflowSearchResultsImpl`, `AhqWorkflowsImpl`, etc. | MET | — |
| DR.6 | Switchability — third party can replace concrete class | `AhqWorkflow`, `AhqWorkflows`, `WorkflowSearchResults` all have interfaces. However, `new WorkflowSearchResultsImpl()` is hard-coded in `agentic-hq-program.ts:40` (not injected). | PARTIALLY MET | See Tier 2 Refactor 2.2 — but per GREEN phase notes, this is intentionally deferred because the `createProgram` function will evolve when short-alias routing switches to discovery. |
| DR.7 | Balance — not fractured to the extreme | The e2e changes are minimal (one format change + one wiring change). The delegation chain is appropriate: `WorkflowSearchResults` → `AhqWorkflows` → `AhqWorkflow` → value objects. Not over-decomposed. | MET | — |

**Summary**: 5 of 7 requirements MET, 1 PARTIALLY MET, 1 NOT APPLICABLE

> **Note to human**: The PARTIALLY MET item (DR.6 switchability) has a corresponding Tier 2 refactor (2.2) for your APPROVE / REJECT / DISCUSS decision. The AI recommends NOT doing it now because the function will change soon.

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 5 |
| Tier 2 AI-Identified (Pending review) | 2 |
| Design Requirements Audit (items needing action) | 1 (same as Tier 2 Refactor 2.2) |
| **Total identified by AI** | 7 |

---

## Agreed Refactors Discussion Notes

### H.1 — Fix `author` field structure + add nested dot-notation support to `JsonFileImpl.get()`
**Decision**: EXECUTE (expanded)
**Summary**: Human identified that all 5 `ahq-workflow.json` files use `"author": "Agentic HQ"` (flat string) but the parent Jira AHQ-103 spec defines it as `"author": { "name": "Agentic HQ" }` (nested object). AI initially proposed custom dot-notation parsing in `get()`, but human asked whether built-in JSON handles nesting — Perplexity confirmed `JSON.parse()` gives a plain JS object where `parsed.author.name` works natively. Human then asked if `get()` can support both top-level and nested in one method — Perplexity confirmed a simple `split('.').reduce()` handles both cases backwards-compatibly. Human requested TSDoc explicitly mention multi-level dot-notation support with an example like `author.name`.

**Final scope of H.1:**
1. Update `JsonFileImpl.get()` to use `split('.').reduce()` for nested path walking (backwards compatible — top-level calls like `get('shortId')` still work)
2. Update TSDoc on `JsonFile` interface and `JsonFileImpl` class to explicitly state support for multi-level dot-notation field IDs (e.g. `author.name`)
3. Add one test to `json-file-impl.unit.test.ts`: `get('author.name')` on `{"author": {"name": "Agentic HQ"}}` returns `"Agentic HQ"`
4. Update all 5 `ahq-workflow.json` files to use nested `author` structure: `{ "name": "Agentic HQ" }`

---

## Agreed Refactors Summary Table

> For detail on any discussed item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above.

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 1.1 | AI | Delete unused private method `getShortName()` from `AhqWorkflowImpl` | EXECUTE | Auto-approved Tier 1 |
| 1.2 | AI | Delete unused private method `getFullClaudeSkillCommand()` from `AhqWorkflowImpl` | EXECUTE | Auto-approved Tier 1 |
| 1.3 | AI | Remove 4 orphaned imports from `ahq-workflow-impl.ts` (`FullClaudeSkillCommand`, `WorkflowShortName` types; `FullClaudeSkillCommandImpl`, `WorkflowShortNameImpl` value imports) | EXECUTE | Auto-approved Tier 1 |
| 1.4 | AI | Fix misleading test name + assertion in `workflow-search-results-impl.unit.test.ts:44` — rename and change assertion to check `'   What it does:'` prefix | EXECUTE | Auto-approved Tier 1 |
| 1.5 | AI | Remove unnecessary `eslint-disable-next-line` in `workflow-metadata.ts:16` if lint passes without it | EXECUTE | Auto-approved Tier 1 |
| 2.1 | AI | Delete `FullClaudeSkillCommandImpl`/`PluginIdImpl`/`SkillIdImpl` + interfaces + tests | SKIP | Rejected by human — likely needed soon for short-alias routing |
| 2.2 | AI | Replace inline `new WorkflowSearchResultsImpl()` with injected DI | SKIP | Rejected by human — function will change when short-alias routing evolves |
| H.1 | Human | Fix `author` field in 5 JSON files to nested object + add dot-notation support to `JsonFileImpl.get()` + update TSDoc + add test | EXECUTE | Discussed — see notes above |

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-04-06.

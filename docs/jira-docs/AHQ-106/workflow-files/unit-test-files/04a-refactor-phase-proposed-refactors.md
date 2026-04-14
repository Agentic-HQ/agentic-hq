# REFACTOR Analysis: AHQ-106 (unit test)

**Jira**: [AHQ-106](https://agentic-hq.atlassian.net/browse/AHQ-106)
**Test Type**: unit
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-04-07

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

**Command**: `pnpm test`
**Result**: PASSING (142 tests, 35 files)

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, red phase, green phase, and implementation documents for deferred items and opportunities.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | GREEN plan (line 22): "Remove old hard-coded code -> Deferred to REFACTOR (per GREEN phase rules)" | Deferred | Wire `registerWorkflowsWith()` into CLI entry point (replacing `DEMO_SKILLS` + `WorkflowSkillsRegistry` stack) and delete old hardcoded code (`demo-skills.ts`, `workflow-skills-registry.ts`, `workflow-skill.ts`). Jira explicitly requires: "All code/tests relating to the old (hard coded method) must be deleted. Done during REFACTOR stage." | This is significant work that crosses CLI/builder boundaries. It requires updating `WorkflowCommandBuilder.build()` to accept a `pluginDir` parameter, rewiring `agentic-hq-cli.ts` and `createProgram()`, and verifying with e2e tests (`pnpm test:e2e:cross-workspace-string-reversal`, `pnpm test:e2e:cross-workspace-list-workflows`). My recommendation: better suited for the **e2e REFACTOR phase** since it requires e2e test verification and modifies the CLI entry point. But the human should decide. | Tier 2 |
| P.2 | GREEN plan (line 38): "Deferred to REFACTOR: Full code quality review, removal of old hardcoded code, and balance assessment." | Deferred | General code quality review — covered by this entire analysis. Balance assessment — covered by DR.7 in the compliance audit below. | This is addressed by the analysis itself. No separate action needed. | Skip (covered by this analysis) |
| P.3 | GREEN summary (lines 79-101): "Suggested REFACTOR: Consolidate AhqWorkspace into Workspace" | Deferred | Delete `AhqWorkflowsImpl` (dead code — no production callers after GREEN), delete `AhqWorkflows` interface (only consumer was `AhqWorkflowsImpl`), remove `AhqWorkspace` interface + `findFiles()` from `AhqWorkspaceImpl` (only caller was `AhqWorkflowsImpl`), update affected tests. | Yes, strongly recommend. `AhqWorkflowsImpl` is genuinely dead — it was replaced by the `Workspace → Plugin → AhqWorkflow` chain. Keeping dead code creates confusion about which path is active. The GREEN summary documents this clearly. | Tier 2 |
| P.4 | AI summary (line 132): "AHQ-104 e2e refactor doc has P.5 ("Replace DEMO_SKILLS with discovery-based short-alias routing") and P.7 ("Remove old files") are directly in scope for this Jira" | Deferred (from AHQ-104) | Same work as P.1 above — these were explicitly "Skip" in AHQ-104 because they were out of scope for that Jira. Now they're in scope for AHQ-106. | See P.1 opinion. | (Duplicate of P.1) |
| P.5 | AI summary (line 74): "AhqWorkflow needs getShortName() and getFullClaudeSkillCommand() re-exposed on its public interface" | Deferred (from AHQ-104 REFACTOR A.2) | These methods were made private in AHQ-104 refactor because they had no production callers then. | Already DONE in GREEN phase — these are now public on the `AhqWorkflow` interface and called by `WorkflowRegistryImpl.register()`. No action needed. | Skip (done) |
| P.6 | RED plan (line 8): "Removing old hardcoded code (REFACTOR stage)" | Deferred | Same as P.1. | See P.1. | (Duplicate of P.1) |

> **Note to human**: P.1/P.4/P.6 are all the same item (wire new code + delete old code). The key decision is: do it in this unit test REFACTOR or defer to the e2e REFACTOR phase?

---

## Magic Constants Audit

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `ahq-workspace-impl.ts` | 44 | `'Agentic HQ Workspace'` | MAGIC | -> `AHQ_WORKSPACE_DISPLAY_NAME` |
| `ahq-workspace-impl.ts` | 49 | `'Agentic HQ Workspace'` | MAGIC | -> `AHQ_WORKSPACE_DISPLAY_NAME` (same, duplicated) |
| `current-user-workspace-impl.ts` | 26 | `'Local Workspace: Same as Agentic HQ Workspace (running from within the AHQ directory)'` | MAGIC | -> `SAME_AS_AHQ_MESSAGE` |
| `current-user-workspace-impl.ts` | 27 | *(implied)* `'Local Workspace'` inside the same-as message | MAGIC | -> Derived from `LOCAL_WORKSPACE_DISPLAY_NAME` |
| `current-user-workspace-impl.ts` | 44 | `'Local Workspace'` | MAGIC | -> `LOCAL_WORKSPACE_DISPLAY_NAME` |
| `plugin-directory-impl.ts` | 8-9 | `PLUGINS_SUBPATH`, `WORKFLOW_FILES_GLOB` | EXTRACTED | Already named constants |
| `workspace-impl.ts` | 8 | `PLUGINS_DIR` | EXTRACTED | Already a named constant |
| `workflow-search-results-impl.ts` | 7 | `WORKFLOWS_LIST_HEADER` | EXTRACTED | Already a named constant |
| `ahq-workspace-impl.ts` | 10 | `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` | EXTRACTED | Already a named constant |
| `ahq-workflow-impl.ts` | 17 | `WHAT_IT_DOES_LINE_PREFIX` | EXTRACTED | Already a named constant |

**3 MAGIC entries above are included in Tier 1 refactors below (1.1 and 1.2).**

---

## Audit To Confirm Methods Used In Production Code (Not Just Tests)

Auditing every method on every interface/class created or modified in this Jira.

**Legend**:
- **✓** = used as intended (interface methods: called through the interface from outside the implementing class; class-only methods: any production caller exists)
- **NOT USED THROUGH INTERFACE ⚠️** = interface method only called by `this.method()` from inside the implementing class (plus possibly tests) — should be made private + removed from the interface
- **TEST-ONLY ⚠️** = zero production callers (not even self-calls); only tests reference it — should be deleted
- **NOT-YET-WIRED** = subsystem entry point, deliberately not yet wired into the CLI (will be wired later) — keep

| Interface / Class | Method | Status | Evidence |
|---|---|---|---|
| `Workspace` | `getWorkflowListingString()` | ✓ | `workflow-search-results-impl.ts:33-34` — called via interface by `WorkflowSearchResultsImpl` |
| `Workspace` | `registerWorkflowsWith()` | NOT-YET-WIRED | `workflow-search-results-impl.ts:39-40` — called via interface but `WorkflowSearchResults.registerWorkflowsWith()` is not yet called from CLI entry point (still uses `DEMO_SKILLS`). Will be wired when P.1 is executed. |
| `WorkflowSearchResults` | `getWorkflowsListingString()` | ✓ | `agentic-hq-program.ts:40` — called from CLI list action |
| `WorkflowSearchResults` | `registerWorkflowsWith()` | NOT-YET-WIRED | No production caller yet. The CLI (`agentic-hq-program.ts:44`) still uses `registry.getSkills()` from `WorkflowSkillsRegistry`. Will be wired when P.1 is executed. |
| `AhqWorkflow` | `getWorkflowListingEntryString()` | ✓ | `plugin-impl.ts:31` — called via interface |
| `AhqWorkflow` | `getShortName()` | NOT-YET-WIRED | `workflow-registry-impl.ts:30` — called via interface but `WorkflowRegistryImpl.register()` is only reached through the not-yet-wired `registerWorkflowsWith()` chain |
| `AhqWorkflow` | `getDescription()` | ✓ | Self-call in `ahq-workflow-impl.ts:68` (via `getWorkflowListingEntryString`) + `workflow-registry-impl.ts:31` (not yet wired) |
| `AhqWorkflow` | `getFullClaudeSkillCommand()` | NOT-YET-WIRED | `workflow-registry-impl.ts:32` — same not-yet-wired chain as `getShortName()` |
| `AhqWorkflow` | `getPluginDirectory()` | NOT-YET-WIRED | `workflow-registry-impl.ts:33` — same not-yet-wired chain |
| `WorkflowRegistry` | `register()` | NOT-YET-WIRED | `plugin-impl.ts:41` — called but through not-yet-wired chain |
| `Plugin` | `getPluginListingString()` | ✓ | `workspace-impl.ts:35` — called via interface |
| `Plugin` | `registerWorkflowsWith()` | NOT-YET-WIRED | `workspace-impl.ts:43` — called but through not-yet-wired chain |
| `PluginDirectory` | `toString()` | ✓ | `workflow-registry-impl.ts:33` (implicitly via pluginDir object) + test assertions |
| `PluginDirectory` | `findWorkflowFiles()` | ✓ | `plugin-impl.ts:30,38` — called from both plugin methods |

**Flagged methods — all NOT-YET-WIRED (not code smells):**

The entire `registerWorkflowsWith()` chain (`WorkflowSearchResults` → `Workspace` → `Plugin` → `WorkflowRegistry.register()`) is deliberately not yet wired into the CLI entry point. These methods are the designed API surface for the execution path. The CLI still uses the old `DEMO_SKILLS` + `WorkflowSkillsRegistry` stack at `agentic-hq-program.ts:44-54`.

These methods are **NOT code smells** — they're the deliberate "new" path that was unit-tested in GREEN and will be wired in when the old stack is replaced (see P.1 in Previous Phases above). `getShortName()`, `getFullClaudeSkillCommand()`, and `getPluginDirectory()` on `AhqWorkflow` exist specifically for `WorkflowRegistryImpl` to use during subcommand registration.

**No methods flagged for deletion or privacy change.**

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.1 | Extract magic constants | Extract `'Agentic HQ Workspace'` (used twice) to `const AHQ_WORKSPACE_DISPLAY_NAME` | `src/workflow-discovery/workspace/ahq-workspace-impl.ts` Lines: 44, 49 |
| 1.2 | Extract magic constants | Extract `'Local Workspace'` to `const LOCAL_WORKSPACE_DISPLAY_NAME` and `'Local Workspace: Same as...'` to `const SAME_AS_AHQ_MESSAGE` | `src/workflow-discovery/workspace/current-user-workspace-impl.ts` Lines: 26, 44 |
| 1.3 | Duplication removal (within file) | Extract private `discoverWorkflows(): AhqWorkflow[]` method in `PluginImpl` — both `getPluginListingString()` and `registerWorkflowsWith()` duplicate the same 3-line discovery sequence: create `PluginDirectoryImpl`, call `findWorkflowFiles()`, map to `AhqWorkflowImpl` | `src/workflow-discovery/plugin/plugin-impl.ts` Lines: 29-31, 37-40 |
| 1.4 | Duplication removal (within file) | Extract private `createDelegate(): WorkspaceImpl` method in `AhqWorkspaceImpl` — both `getWorkflowListingString()` and `registerWorkflowsWith()` create `new WorkspaceImpl('Agentic HQ Workspace', this.root)`. This mirrors the existing `createDelegate()` pattern in `CurrentUserWorkspaceImpl`. | `src/workflow-discovery/workspace/ahq-workspace-impl.ts` Lines: 44, 49 |
| 1.5 | Fix code smell | Replace `.map()` used for side effects with `for...of` in `PluginImpl.registerWorkflowsWith()` — `.map()` creates a return array that is discarded, which is misleading. Use a for loop since we're performing side effects (registering), not transforming data. | `src/workflow-discovery/plugin/plugin-impl.ts` Lines: 39-43 |
| 1.6 | Duplication removal (cross-file) | Extract `StubWorkflowRegistry` test helper to `tests/unit/workflow-discovery/test-fixtures/stub-workflow-registry.ts` — the identical 5-line class is duplicated in 5 test files (workspace-impl, current-user-workspace-impl, plugin-impl, ahq-workspace-impl, workflow-search-results-impl) | 5 test files under `tests/unit/` |

---

## Tier 2: AI-Identified Potential Refactors

Include ALL potential structural refactors here — both ones I recommend AND ones I'm unsure about. The human decides; my job is to surface them all with honest opinions.

### Refactor 2.1: Delete dead `AhqWorkflowsImpl` + `AhqWorkflows` interface

**Type**: Remove dead code (cross-file)
**Description**: `AhqWorkflowsImpl` has zero production callers. It was the old pipeline (`WorkflowSearchResultsImpl` → `AhqWorkflowsImpl` → `AhqWorkspace.findFiles()`). After GREEN, `WorkflowSearchResultsImpl` now delegates to `Workspace` objects which delegate to `PluginImpl` for workflow discovery. `AhqWorkflowsImpl` is orphaned. The `AhqWorkflows` interface is only implemented by `AhqWorkflowsImpl`, so it's also dead.
**AI Recommendation**: RECOMMEND — This is genuinely dead code. No production code calls it. Keeping it creates confusion about which discovery path is active. The GREEN summary explicitly identified this as dead.
**Risk**: Low. Deleting dead code. The only risk is if something in the e2e tests or CLI somehow uses it — but grep confirms no production callers exist.
**Files affected**: `src/workflow-discovery/workflow-listing/ahq-workflows-impl.ts` (DELETE), `src/workflow-discovery/interfaces/ahq-workflows.ts` (DELETE), `tests/unit/workflow-discovery/workflow-listing/ahq-workflows-impl.unit.test.ts` (DELETE)

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.2: Remove `AhqWorkspace` interface and `implements AhqWorkspace` from `AhqWorkspaceImpl`

**Type**: Remove dead code (cross-file)
**Description**: Depends on 2.1. After deleting `AhqWorkflowsImpl`, the only caller of `AhqWorkspace.findFiles()` is gone. `AhqWorkspaceImpl` would still implement `Workspace` (the new interface). The `findFiles()` method, the `rootDirectory` field (an `AhqDirectory` stored only for `findFiles()`), and the 2 existing unit tests that test via `AhqWorkspace` interface (lines 38-94 of `ahq-workspace-impl.unit.test.ts`) all become dead code.
**AI Recommendation**: RECOMMEND (if 2.1 is approved) — Clean removal of dead interface. The 2 test cases testing via `AhqWorkspace` can be safely deleted since the 2 newer tests (lines 96-121) already test via the `Workspace` interface.
**Risk**: Low. Only affects the AhqWorkspace family of code. Need to verify no other consumers exist (grep confirms none).
**Files affected**: `src/workflow-discovery/interfaces/ahq-workspace.ts` (DELETE), `src/workflow-discovery/workspace/ahq-workspace-impl.ts` (remove `implements AhqWorkspace`, remove `findFiles()`, remove `rootDirectory` field), `tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts` (delete 2 old tests)

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.3: Remove cached state from `AhqWorkspaceImpl`

**Type**: Design compliance
**Description**: `AhqWorkspaceImpl` stores `this.root = process.env[...] ?? ''` in the constructor — cached state. `CurrentUserWorkspaceImpl` (the sister class) reads `process.cwd()` and `process.env[...]` fresh each method call with zero fields. The project design requirements say to minimize stored state and derive values dynamically. After 2.2 removes `findFiles()` and `rootDirectory`, the only remaining field would be `root`. This could be replaced with a private method `getRoot()` that reads the env var fresh each call.
**AI Recommendation**: RECOMMEND (if 2.2 is approved) — Makes `AhqWorkspaceImpl` consistent with `CurrentUserWorkspaceImpl`: both read their root dynamically with no stored fields. The env var won't change during program execution, so it's functionally identical — but it's cleaner for consistency.
**Risk**: Very low. Functionally equivalent — env vars don't change mid-execution.
**Files affected**: `src/workflow-discovery/workspace/ahq-workspace-impl.ts` (remove `root` field, add private `getRoot()`)

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.4: Remove cached workspace fields from `WorkflowSearchResultsImpl`

**Type**: Design compliance
**Description**: `WorkflowSearchResultsImpl` stores `ahqWorkspace` and `currentUserWorkspace` as `private readonly` fields created in the constructor. Both `CurrentUserWorkspaceImpl` (no-arg constructor, stateless) and `AhqWorkspaceImpl` (reads env var) could be created fresh in each method call, consistent with the "no stored state" design principle. This matches how `WorkspaceImpl` and `PluginImpl` create their child objects fresh each call.
**AI Recommendation**: UNSURE — The `WorkflowSearchResultsImpl` is typically created, used once, and discarded (`new WorkflowSearchResultsImpl().getWorkflowsListingString()` in `agentic-hq-program.ts:40`). So whether it stores fields or creates dynamically is functionally identical. The design improvement is for consistency and principle adherence. The benefit is small.
**Risk**: Very low. Functionally identical change.
**Files affected**: `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts` (remove fields, create in each method)

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.5: Wire `registerWorkflowsWith()` into CLI and delete old DEMO_SKILLS stack

**Type**: Replace old code with new subsystem (cross-file, significant)
**Description**: The Jira explicitly requires: "All code/tests relating to the old (hard coded method) of listing and running workflows must be deleted and tests run to confirm all still working after deletion. Done during REFACTOR stage." This involves:
1. Update `WorkflowCommandBuilder` interface to accept a `pluginDir` 3rd parameter (currently takes 2 params; `WorkflowRegistryImpl` already calls it with 3)
2. Update `ClaudeWorkflowCommandBuilder` (the concrete impl) to accept and use `pluginDir` for `--plugin-dir` flags
3. Change `createProgram()` to accept `WorkflowSearchResults` instead of `WorkflowSkillsRegistry`, call `searchResults.registerWorkflowsWith(new WorkflowRegistryImpl(program, builder))`
4. Change `agentic-hq-cli.ts` to create and pass `WorkflowSearchResultsImpl` instead of `new WorkflowSkillsRegistry(DEMO_SKILLS)`
5. Delete `src/demo/demo-skills.ts`, `src/workflow/workflow-skills/workflow-skills-registry.ts`, `src/interfaces/workflow-skill.ts`
6. Delete their test files
7. Run e2e tests: `pnpm test:e2e:cross-workspace-string-reversal`, `pnpm test:e2e:cross-workspace-list-workflows`

**AI Recommendation**: RECOMMEND, but consider deferring to the e2e REFACTOR phase. This is explicitly in the Jira's scope (no question about whether to do it). The question is WHEN — doing it now in the unit test REFACTOR means we'd need to run e2e tests to verify (which isn't typical for unit REFACTOR). Doing it in the e2e phase keeps the unit REFACTOR focused on code quality improvements.
**Risk**: Medium. Touches CLI entry point, builder interface, and removes foundational code. If anything breaks, e2e tests catch it — but we must run them.
**Files affected**: `src/interfaces/workflow-command-builder.ts`, `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts`, `src/cli/agentic-hq-program.ts`, `src/cli/agentic-hq-cli.ts`, `src/demo/demo-skills.ts` (DELETE), `src/workflow/workflow-skills/workflow-skills-registry.ts` (DELETE), `src/interfaces/workflow-skill.ts` (DELETE), associated test files

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor now (in unit REFACTOR)
- [ ] **REJECT** - No, defer to e2e REFACTOR phase
- [ ] **DISCUSS** - I want to discuss timing/approach

**Comments** (optional): _deferring to the e2e REFACTOR phase - But please add a section with **all** details about this for the e2e agent in docs/jira-docs/AHQ-104/workflow-files/ai-summary-of-jiras-and-questions-for-human.md which will be read and used to start the e2e work______

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None". Everything added here will be discussed with the AI before a decision is made.

> **MANDATORY**: You MUST either add refactors here OR write "None" before the execute phase can proceed.

None

---

## Project Design Requirements Compliance Audit

**Design Requirements File**: `docs/dev/project-design-requirements.md`

| # | Requirement | Evidence (files, classes, patterns) | Status | Refactoring Proposal (if needed) |
|---|-------------|-------------------------------------|--------|----------------------------------|
| DR.1 | Class/interface pair for every concept | `Workspace`/`WorkspaceImpl`, `Plugin`/`PluginImpl`, `PluginDirectory`/`PluginDirectoryImpl`, `WorkflowRegistry`/`WorkflowRegistryImpl`, `WorkflowSearchResults`/`WorkflowSearchResultsImpl`, `AhqWorkflow`/`AhqWorkflowImpl`. All new concepts from AHQ-106 have interface+impl pairs. `CurrentUserWorkspaceImpl` and `AhqWorkspaceImpl` both implement the shared `Workspace` interface. | MET | — |
| DR.2 | Primitives wrapped in value objects immediately | `getShortName()` returns `WorkflowShortName`, `getDescription()` returns `WorkflowDescription`, `getFullClaudeSkillCommand()` returns `FullClaudeSkillCommand`, `getPluginDirectory()` returns `PluginDirectory`. All stay wrapped until `toString()` at output boundary (`workflow-registry-impl.ts:30-33`, `ahq-workflow-impl.ts:69`). `WorkspaceImpl` constructor takes raw `string` params (`displayName`, `rootDir`) but these are UI labels/paths used immediately for formatting, not domain concepts — wrapping would be overkill per DR.7 balance. | MET | — |
| DR.3 | Minimal state, delegation, "tell don't ask" | **Listing path**: `WorkflowSearchResultsImpl` tells each `Workspace` to `getWorkflowListingString()`. `AhqWorkspaceImpl`/`CurrentUserWorkspaceImpl` create `WorkspaceImpl` fresh per call and delegate. `WorkspaceImpl` discovers plugins fresh per call, tells each `Plugin` to `getPluginListingString()`. No intermediate arrays accumulated across levels. **Execution path**: `registerWorkflowsWith(registry)` chains down through all levels — each level tells the next, nobody accumulates. **State**: `WorkspaceImpl` stores only constructor params (display name + root). `PluginImpl` stores only constructor params. `CurrentUserWorkspaceImpl` stores nothing. `PluginDirectoryImpl` stores only constructor params. **Issue**: `AhqWorkspaceImpl` caches `root` from env var in constructor. `WorkflowSearchResultsImpl` stores workspace instances as fields. See Tier 2 refactors 2.3 and 2.4. | PARTIALLY MET | See refactors 2.3 (AhqWorkspaceImpl cached root) and 2.4 (WorkflowSearchResultsImpl stored fields) in Tier 2 above |
| DR.4 | Data Dictionary + English Language Description | Comprehensive Data Dictionary table and English Language Description created in RED phase plan (`02-red-phase-failing-test-plan-copy.md`). Covers both listing and execution scenarios. Uses correct formatting (bold class names, italic method names, plain narrative verbs). | MET | — |
| DR.5 | Switchability — third party can replace concrete class | All concepts behind interfaces. Tests type variables as interface (e.g., `const workspace: Workspace = new WorkspaceImpl(...)`). Exception: `WorkflowSearchResultsImpl` hard-coded at `agentic-hq-program.ts:40` — not injected via constructor. This was identified in AHQ-104 and deferred because `createProgram()` was expected to evolve. It is evolving now (P.1/2.5). | PARTIALLY MET | Addressed when P.1/2.5 is executed — `createProgram()` will be refactored to accept `WorkflowSearchResults` as a parameter |
| DR.6 | `Impl` naming convention | All new classes: `WorkspaceImpl`, `CurrentUserWorkspaceImpl`, `PluginImpl`, `PluginDirectoryImpl`, `WorkflowRegistryImpl`. All follow `*Impl` suffix. | MET | — |
| DR.7 | Balance — not fractured to the extreme | 4-level hierarchy: `WorkflowSearchResults` → `Workspace` → `Plugin` → `AhqWorkflow`. Each level represents a genuine concept with distinct responsibilities (aggregate results, workspace grouping, plugin grouping, individual workflow). The listing format requires headers at each level, so the decomposition matches the output structure. Not over-decomposed — `WorkspaceImpl` is shared between `AhqWorkspaceImpl` and `CurrentUserWorkspaceImpl`, reducing code. | MET | — |

**Summary**: 5 of 7 requirements MET, 2 PARTIALLY MET

> **Note to human**: Both PARTIALLY MET items have corresponding Tier 2 refactors: DR.3 → refactors 2.3/2.4, DR.5 → refactor 2.5.

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 6 |
| Tier 2 AI-Identified (Pending review) | 5 |
| Design Requirements Audit (items needing action) | 2 (overlapping with Tier 2 items 2.3, 2.4, 2.5) |
| **Total identified by AI** | 11 |

---

## Agreed Refactors Discussion Notes

No items required discussion — all Tier 2 items were straight APPROVE or REJECT, and human wrote "None" for human-identified refactors.

### Refactor 2.5: Wire `registerWorkflowsWith()` into CLI and delete old DEMO_SKILLS stack
**Decision**: SKIP (deferred to e2e REFACTOR phase)
**Summary**: Human deferred this to the e2e REFACTOR phase for AHQ-106. Requested that full details be documented in the AHQ-106 ai-summary file so the e2e agent has everything it needs. Details have been appended to `docs/jira-docs/AHQ-106/workflow-files/ai-summary-of-jiras-and-questions-for-human.md`.

---

## Agreed Refactors Summary Table

> For detail on any discussed item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above.

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 1.1 | AI | Extract `'Agentic HQ Workspace'` to `AHQ_WORKSPACE_DISPLAY_NAME` constant in `ahq-workspace-impl.ts` | EXECUTE | Auto-approved Tier 1 |
| 1.2 | AI | Extract `'Local Workspace'` + same-as message to constants in `current-user-workspace-impl.ts` | EXECUTE | Auto-approved Tier 1 |
| 1.3 | AI | Extract private `discoverWorkflows()` in `PluginImpl` to remove duplication | EXECUTE | Auto-approved Tier 1 |
| 1.4 | AI | Extract private `createDelegate()` in `AhqWorkspaceImpl` (matching `CurrentUserWorkspaceImpl` pattern) | EXECUTE | Auto-approved Tier 1 |
| 1.5 | AI | Replace `.map()` with `for...of` in `PluginImpl.registerWorkflowsWith()` | EXECUTE | Auto-approved Tier 1 |
| 1.6 | AI | Extract `StubWorkflowRegistry` to shared test fixture (5 files) | EXECUTE | Auto-approved Tier 1 |
| 2.1 | AI | Delete dead `AhqWorkflowsImpl` + `AhqWorkflows` interface + test file | EXECUTE | Approved by human |
| 2.2 | AI | Remove `AhqWorkspace` interface + `findFiles()` + `rootDirectory` from `AhqWorkspaceImpl` + delete 2 old tests | EXECUTE | Approved by human |
| 2.3 | AI | Remove cached `root` field from `AhqWorkspaceImpl`, read env var dynamically via private `getRoot()` | EXECUTE | Approved by human |
| 2.4 | AI | Remove cached workspace fields from `WorkflowSearchResultsImpl` | SKIP | Rejected by human |
| 2.5 | AI | Wire `registerWorkflowsWith()` into CLI + delete old DEMO_SKILLS stack | SKIP (deferred) | Deferred to e2e REFACTOR phase. Details documented in AHQ-106 ai-summary for e2e agent. |

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-04-07.

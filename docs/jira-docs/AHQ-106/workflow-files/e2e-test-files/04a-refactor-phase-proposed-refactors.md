# REFACTOR Analysis: AHQ-106 (e2e test)

**Jira**: [AHQ-106](https://agentic-hq.atlassian.net/browse/AHQ-106)
**Test Type**: e2e
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-04-13

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

**Command**: `pnpm test:e2e:user-workspace-workflows` (specific e2e test only — running full suite skipped to conserve credits; human should run `pnpm test:e2e` for a full check)
**Result**: PASSING (2/2 tests) — confirmed on re-run after one flaky failure where Claude's own string-reversal output was off by one character (`tset 2e ecapskrow resu` instead of `tset e2e ecapskrow resu`); re-run passed cleanly.

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, RED phase, GREEN phase plan, and GREEN phase summary for deferred items and opportunities. A recursive search for "REFACTOR" within `docs/jira-docs/AHQ-106/workflow-files/` was also performed.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | Jira description: *"All code/tests relating to the old (hard coded method) of listing and running workflows must be deleted and tests run to confirm all still working after deletion. Done during REFACTOR stage."* Also: AI summary "Deferred Work For E2E Phase: Wire registerWorkflowsWith()..." section (lines 197–276). Also: unit REFACTOR analysis 2.5. Also: GREEN plan step 17 "Delete old hardcoded code → Partially done here (DEMO_SKILLS loop + --workflow-command-supplier removed); **file deletion deferred to REFACTOR**". | Deferred (explicit Jira requirement) | Delete the now-unused `src/demo/demo-skills.ts`, `src/workflow/workflow-skills/workflow-skills-registry.ts`, `src/interfaces/workflow-skill.ts`, the re-export in `src/interfaces/index.ts`, and the test file `tests/unit/cli/agentic-hq-cli-list.unit.test.ts` (which tests the old registry). Verify `pnpm test:e2e:cross-workspace-string-reversal` and `pnpm test:e2e:cross-workspace-list-workflows` still pass (Jira requirement). Also delete the now-empty `src/workflow/workflow-skills/` directory and `src/demo/` directory if they become empty. | **STRONGLY RECOMMEND.** This is an explicit Jira acceptance criterion. The files have no production callers (confirmed by grep). The only remaining coupling is the `WorkflowSkill` type re-export in `src/interfaces/index.ts`. After the GREEN phase cut over `agentic-hq-program.ts` / `agentic-hq-cli.ts` to `WorkflowSearchResults`, this code is pure dead weight. | **Tier 2** (file deletion has slightly higher risk than a pure rename — needs human sign-off via running `pnpm validate` + the two e2e tests named in the Jira). |
| P.2 | `ClaudeCommandBuilder.getPluginDirFlags()` REFACTOR comment (lines 97–105): *"Later, investigate whether we can simplify this by passing pluginDir explicitly from AhqWorkflow... If it's going to be too much work/hassle leave it for now, as this whole '2 workspace' setup is probably temporary..."* | Observed (explicitly marked in code) | Thread a single explicit `PluginDirectory` through `WorkflowCommandBuilder.build(skillPath, args, pluginDir)` and `Tool.execute(...)`, replacing the "scan both workspaces for all plugins" approach. | **NOT RECOMMENDED.** The human already wrote a paragraph in the comment saying *"If it's going to be too much work/hassle leave it for now"*. Threading `pluginDir` through solves only Purpose 1 (skill resolution by `ClaudeWorkflowCommandBuilder`) — Purpose 2 (runtime `DefaultClaudeCodeTool`) has no workflow context and would still need scanning OR a new public API to pass plugin dirs. The current scanning approach is ~30 lines and works. The "proper" explicit-passing approach would touch `Tool`, `MarshalledCLITool`, `MarshalledIOCLICommandBuilder`, `WorkflowCommandBuilder`, and every caller — significant churn. Per the comment, the whole 2-workspace model is temporary anyway. | **Skip** (leave the REFACTOR comment as a pointer for the future; don't touch it now). |
| P.3 | `AhqWorkflowImpl` REFACTOR comment (lines 38–43): *"I don't think pluginDir should be optional. All Workflows must have a plugin directory. That's where they live. Please confirm and fix all tests to pass a PluginDirectory and work out why this happened."* | Observed (explicitly marked in code) | Make `pluginDir` required on `AhqWorkflowImpl` constructor. | **Relevant, but the RIGHT fix is the opposite direction.** The reason `pluginDir` was made optional in the unit REFACTOR is that `getPluginDirectory()` was originally added to `AhqWorkflow` for an earlier plan where `WorkflowRegistryImpl` would call `workflow.getPluginDirectory()` and pass it to `builder.build(..., pluginDir)`. In the e2e GREEN phase, that plan was abandoned in favour of dynamic scanning inside `ClaudeCommandBuilder` (P.2 above). After that pivot, **`getPluginDirectory()` has zero production callers** — it's dead code. See the method audit section below. The right fix is to remove `getPluginDirectory()` from the `AhqWorkflow` interface, remove it from `AhqWorkflowImpl`, and remove the `pluginDir` constructor parameter entirely — which also dissolves the "optional vs required" dilemma that the REFACTOR comment is concerned about. | **Tier 2** (captured as refactor 2.3 below). |
| P.4 | `WorkflowSearchResultsImpl` REFACTOR comment (lines 14–21): *"Rename to WorkspacesImpl (plural) as this object encapsulates all the (currently 2) workspaces that AHQ know about... It's not really a 'SearchResult' any more..."* | Observed (explicitly marked in code) | Rename `WorkflowSearchResults` / `WorkflowSearchResultsImpl` → `Workspaces` / `WorkspacesImpl`. Update SRP headers, all imports/references, interface exports, the test file and the `registerWorkflowsWith` chain. | **UNSURE.** I partially agree — the class is no longer "the results of a search" and the name is now stale. BUT: this is a non-trivial rename (touches the interface, 2 concrete classes, a test file, the CLI wiring, and all the unit REFACTOR analysis docs). And `WorkflowSearchResults` is still used as a type name in `WorkflowRegistry`'s implementation chain. A rename now, without first settling what the long-term shape is (see P.2 — the whole 2-workspace model may change), risks churn. I'd lean towards deferring. | **Tier 2** (captured as refactor 2.4). Defer recommended. |
| P.5 | `tests/e2e/demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts` REFACTOR comment (lines 16–24): *"Re step 5: 'Patch the ts-workflow package.json with the real REPO_ROOT path' - I want to understand better why this is needed and whether the create-workflow workflow instructions need updating..."* Human's own note: *"Probably OK for now while people are just testing/creating/playing with these workflows..."* | Observed | Investigate whether `create-workflow` should set up the `agentic-hq: link:...` dependency automatically. | **NOT IN SCOPE for this REFACTOR.** The comment is a question/investigation for a future Jira about `create-workflow`. It doesn't affect anything in AHQ-106. | **Skip** (the comment itself is the right outcome — leave as a note for the future). |
| P.6 | GREEN summary line 38: *"Dynamic scanning vs threading AhqWorkflow... Marked with REFACTOR comment for later explicit-passing approach."* | Deferred | Same as P.2. | (Duplicate of P.2) | (Duplicate of P.2) |
| P.7 | GREEN plan suggested-REFACTOR section (bottom of `03-APPROVED-green-phase-implementation-plan-copy.md`, starting at line 220): "Consolidate AhqWorkspace into Workspace" — this was a unit-test-phase design issue where `AhqWorkspaceImpl` implements both `AhqWorkspace` (legacy) and `Workspace` (new). | Deferred from unit REFACTOR | Remove `AhqWorkspace` interface and `implements AhqWorkspace` from `AhqWorkspaceImpl`. | **Already done in unit REFACTOR (2.2).** Per `04b-refactor-phase-complete.md`, this was completed during the unit test REFACTOR execution. No action needed. | **Skip (done)**. |
| P.8 | AI summary line 132: *"AHQ-104 e2e refactor doc has P.5 (Replace DEMO_SKILLS with discovery-based short-alias routing) and P.7 (Remove old files) directly in scope"* | Deferred (from AHQ-104, in scope for AHQ-106) | Same as P.1. | (Duplicate of P.1) | (Duplicate of P.1) |

> **Note to human**: P.1/P.6/P.8 are all the same item (delete old DEMO_SKILLS stack). It's captured once as refactor 2.1 below.

---

## Magic Constants Audit

Audit covers all files modified in GREEN phase (per `03-green-phase-summary-of-what-was-implemented.md`).

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` | 25 | `'claude'` | EXTRACTED | `DEFAULT_CLAUDE_EXECUTABLE` |
| `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` | 27 | `'.agentic-hq'` | EXTRACTED | `AGENTIC_HQ_DIR` |
| `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` | 28 | `'plugins'` | EXTRACTED | `PLUGINS_SUBDIR` |
| `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` | 35–49 | allowed tools array | EXTRACTED | `DEFAULT_ALLOWED_TOOLS` |
| `src/cli/workflow-registry-impl.ts` | — | none | — | — |
| `src/cli/agentic-hq-program.ts` | 33 | `'agentic-hq'` (program name) | MAGIC (minor) | → `PROGRAM_NAME` |
| `src/cli/agentic-hq-program.ts` | 34 | `'Orchestrate agentic software development with Claude Code'` | MAGIC (minor) | → `PROGRAM_DESCRIPTION` |
| `src/cli/agentic-hq-program.ts` | 39 | `'list'` / `'List available workflow skills'` | MAGIC (minor) | → `LIST_SUBCOMMAND_NAME` / `LIST_SUBCOMMAND_DESCRIPTION` |
| `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts` | 7 | `'Available workflows:\n\n'` | EXTRACTED | `WORKFLOWS_LIST_HEADER` |
| `tests/e2e/demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts` | 49–72 | all timeouts, input/output strings, paths | EXTRACTED | (already constants) |
| `tests/unit/tools/claude-code/claude-command-builder.unit.test.ts` | 57, 73, 84, 95 | `2`, `3` in `toHaveLength(N)` | TEST DATA (not magic) | — |

**Note on the `agentic-hq-program.ts` entries**: These are on the edge — they're strings in one-shot builder calls that aren't referenced elsewhere in the file. Extracting them would reduce one kind of magic but add boilerplate for no real win. Captured as optional Tier 1 entry 1.1; human can reject if they agree it's noise.

---

## Audit To Confirm Methods Used In Production Code (Not Just Tests)

Audit of every method on every interface/class created or modified in this Jira's e2e phase.

**Legend**:
- **✓** = called from outside the implementing class via the interface
- **NOT USED THROUGH INTERFACE ⚠️** = interface method only called by `this.method()` inside the implementing class
- **TEST-ONLY ⚠️** = zero production callers; only tests reference it
- **NOT-YET-WIRED** = deliberate entry point not yet wired — kept on purpose

| Interface / Class | Method | Status | Evidence |
|---|---|---|---|
| `AhqWorkflow` | `getWorkflowListingEntryString()` | ✓ | `src/workflow-discovery/plugin/plugin-impl.ts:29` |
| `AhqWorkflow` | `getShortName()` | ✓ | `src/cli/workflow-registry-impl.ts:31` |
| `AhqWorkflow` | `getDescription()` | ✓ | `src/cli/workflow-registry-impl.ts:32` |
| `AhqWorkflow` | `getFullClaudeSkillCommand()` | ✓ | `src/cli/workflow-registry-impl.ts:33` |
| `AhqWorkflow` | `getPluginDirectory()` | **TEST-ONLY ⚠️** | No production callers anywhere. Only `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts`, `tests/unit/workflow-discovery/plugin/plugin-impl.unit.test.ts`, `tests/unit/cli/workflow-registry-impl.unit.test.ts`, `tests/unit/cli/agentic-hq-program.unit.test.ts`. The GREEN-phase decision to use dynamic scanning in `ClaudeCommandBuilder` killed off the caller this method was designed for. |
| `WorkflowRegistry` | `register(workflow)` | ✓ | Called indirectly via `Workspace.registerWorkflowsWith()` → `Plugin.registerWorkflowsWith()` chain, ultimately triggered from `agentic-hq-program.ts:46` |
| `WorkflowCommandBuilder` | `build(skillPath, args)` | ✓ | `workflow-registry-impl.ts:41` |
| `ClaudeCommandBuilder` | `build(aiToolCommand, marshallingId)` | ✓ | `MarshalledCLITool` via `MarshalledIOCLICommandBuilder` interface |
| `WorkflowSearchResults` | `getWorkflowsListingString()` | ✓ | `agentic-hq-program.ts:42` (but uses a **new** instance, not the injected one — see refactor 2.2) |
| `WorkflowSearchResults` | `registerWorkflowsWith(registry)` | ✓ | `agentic-hq-program.ts:46` |

**Flagged methods:**
- **`AhqWorkflow.getPluginDirectory()`** — TEST-ONLY. Should be deleted from the interface and from `AhqWorkflowImpl`, and the `pluginDir?` constructor parameter removed. This also dissolves the concern raised by the REFACTOR comment in `ahq-workflow-impl.ts` (P.3 above). Captured as **refactor 2.3** below.

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.1 | Remove stale doctext | The `agentic-hq-cli.ts` file's docblock (lines 9–12) still shows `agentic-hq --workflow-command-supplier=/plugin:skill -- args` as a usage example, but that option was removed in GREEN phase. Delete that line from the docblock. | `src/cli/agentic-hq-cli.ts:12` |
| 1.2 | Fix inconsistency / use injected dep | `agentic-hq-program.ts` line 42 creates a **new** `WorkflowSearchResultsImpl()` inside the `list` action handler instead of using the `searchResults` parameter injected into `createProgram()`. This defeats the point of the injection and is inconsistent with line 46 which correctly uses the injected dep. Replace `new WorkflowSearchResultsImpl()` with `searchResults`. Also remove the now-unused `WorkflowSearchResultsImpl` import. | `src/cli/agentic-hq-program.ts:16, 42` |
| 1.3 | Update SRP header | The SRP header on `WorkflowSearchResultsImpl` is accurate for its current behaviour but has a big REFACTOR comment on top that says "SRP Does - needs updating after rename". If we skip the rename (refactor 2.4), at minimum clean up the leading REFACTOR comment so the header reads cleanly. If we approve 2.4, the header gets rewritten as part of that refactor. | `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts:14–22` |

**Note**: No Tier 1 magic-constant extractions. `agentic-hq-program.ts` string literals (program name / description / list subcommand name) are captured as **optional** entry 1.4 below — human can reject as noise.

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.4 *(optional)* | Extract magic strings | `'agentic-hq'`, `'Orchestrate agentic software development with Claude Code'`, `'list'`, `'List available workflow skills'` → named constants at top of file. **I don't actually recommend this** — they're one-shot builder arguments and extracting adds boilerplate without making anything clearer. Listed only because the Magic Constants Audit flagged them. | `src/cli/agentic-hq-program.ts:33–40` |

HUMAN: Please do this 1.4 refactor anyway.

---

## Tier 2: AI-Identified Potential Refactors

Include ALL potential structural refactors here — both ones I recommend AND ones I'm unsure about or even think shouldn't be done. The human decides; my job is to surface them all with honest opinions.

### Refactor 2.1: Delete the old DEMO_SKILLS / WorkflowSkillsRegistry / WorkflowSkill stack

**Type**: Dead-code deletion
**Description**:
This is the explicit Jira acceptance criterion from AHQ-106's "Additional Requirements" section:

> *"All code/tests relating to the old (hard coded method) of listing and running workflows must be deleted and tests run to confirm all still working after deletion. Done during REFACTOR stage. Must run following after to confirm e2e tests still working: `pnpm test:e2e:cross-workspace-string-reversal` and `pnpm test:e2e:cross-workspace-list-workflows`"*

After the GREEN phase wired `WorkflowSearchResults.registerWorkflowsWith()` into `createProgram()`, nothing in production code uses the old stack. Files to delete:

1. `src/demo/demo-skills.ts` — hardcoded 5-workflow array
2. `src/workflow/workflow-skills/workflow-skills-registry.ts` — old registry class
3. `src/interfaces/workflow-skill.ts` — old `WorkflowSkill` interface
4. `src/interfaces/index.ts` — remove `export type { WorkflowSkill } from './workflow-skill.js';` line
5. `tests/unit/cli/agentic-hq-cli-list.unit.test.ts` — tests the deleted `WorkflowSkillsRegistry` class; remove entirely
6. `src/demo/` directory — delete if empty after step 1
7. `src/workflow/workflow-skills/` directory — delete if empty after step 2

After deletion, run (per Jira requirement):
- `pnpm validate` (typecheck + lint + unit tests)
- `pnpm test:e2e:cross-workspace-string-reversal`
- `pnpm test:e2e:cross-workspace-list-workflows`
- `pnpm test:e2e:user-workspace-workflows` (the test for this Jira)

**AI Recommendation**: **STRONGLY RECOMMEND.** This is the headline Tier 2 refactor and it's an explicit Jira acceptance criterion. Low actual risk — grep confirms zero production callers. The only care needed is removing the `interfaces/index.ts` re-export and making sure no stray test imports the deleted modules.

**Risk**: Very low. If `pnpm validate` passes and the three e2e tests pass, the deletion is safe.

**Files affected**: 5 files deleted, 1 file edited (`src/interfaces/index.ts`)

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.2a: Fix `list` action ignoring injected `searchResults` (bug fix)

**Type**: Bug fix
**Description**: `src/cli/agentic-hq-program.ts` takes `searchResults: WorkflowSearchResults` as an injected param, but inside the `list` action (line 42) it ignores the injected instance and news up its own:

```typescript
// src/cli/agentic-hq-program.ts (current — BUG)
program
  .command('list')
  .description('List available workflow skills')
  .action(() => {
    console.log(new WorkflowSearchResultsImpl().getWorkflowsListingString());
  });
```

This is a silent bug: any test that injects a fake `WorkflowSearchResults` into `createProgram()` is overridden for the `list` path — the fake is honoured by `registerWorkflowsWith()` (line 46) but ignored by `list`. A unit test asserting that `list` prints fake workflow data would either pass for the wrong reason or be impossible to write correctly.

**Fix**:
```typescript
// src/cli/agentic-hq-program.ts (fixed)
program
  .command('list')
  .description('List available workflow skills')
  .action(() => {
    console.log(searchResults.getWorkflowsListingString());
  });
```
Also remove the now-unused `import { WorkflowSearchResultsImpl }` at the top of the file.

**AI Recommendation**: **STRONGLY RECOMMEND.** This is a real bug, not a style preference. DI is load-bearing for testability; bypassing injected deps defeats the entire point of the param.

**Risk**: Very low. Existing e2e tests still pass (they exercise the full real stack, so they never noticed the bypass). Unit tests in `agentic-hq-program.unit.test.ts` should be extended to cover the fake-`searchResults`-honoured-by-`list` case.

**Files affected**: `src/cli/agentic-hq-program.ts`, `tests/unit/cli/agentic-hq-program.unit.test.ts` (add a test)

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.2b: Move `WorkflowSearchResults` construction into `CompositionRoot`

**Type**: Move dependency wiring to the composition root (stylistic consistency)
**Description**: Currently `agentic-hq-cli.ts` line 24 does:
```typescript
createProgram(builder, new WorkflowSearchResultsImpl()).parse();
```
This puts a `new WorkflowSearchResultsImpl()` call in the CLI entry point, not in `CompositionRoot`. Every other component is wired through `CompositionRoot`. A new `getWorkflowSearchResults()` method would make this consistent:

```typescript
// CompositionRoot.ts — add:
getWorkflowSearchResults(): WorkflowSearchResults {
  return new WorkflowSearchResultsImpl();
}

// agentic-hq-cli.ts — becomes:
const root = new CompositionRoot();
createProgram(root.getWorkflowCommandBuilder(), root.getWorkflowSearchResults()).parse();
```

**AI Recommendation**: **LEAN REJECT (for now).** `WorkflowSearchResultsImpl` has a no-arg constructor — there's nothing to wire, so the proposed `getWorkflowSearchResults()` method is pure ceremony (`return new WorkflowSearchResultsImpl()`). A reader learns exactly as much from `new WorkflowSearchResultsImpl()` in `agentic-hq-cli.ts` as they would from `root.getWorkflowSearchResults()`. The DR "switchability" argument only earns its keep once the class grows real constructor dependencies (it currently hardcodes workspace discovery internally — see Refactor 2.5). **Revisit this refactor when `WorkflowSearchResultsImpl` grows ctor deps** — at that point moving it to `CompositionRoot` becomes obviously worth doing.

**Risk**: Very low (if done). Just moves a `new` call.

**Files affected**: `src/kernel/composition-root.ts`, `src/cli/agentic-hq-cli.ts`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.3: Remove `getPluginDirectory()` from `AhqWorkflow` (test-only method)

**Type**: Delete dead API surface
**Description**: The method audit above identified `AhqWorkflow.getPluginDirectory()` as **TEST-ONLY** — no production code calls it. It was originally added in the unit-test RED phase for a planned design where `WorkflowRegistryImpl` would call `workflow.getPluginDirectory()` and pass the result to `builder.build(..., pluginDir)`. The e2e GREEN phase abandoned that plan in favour of dynamic scanning inside `ClaudeCommandBuilder`, leaving `getPluginDirectory()` stranded.

Changes:
1. Remove `getPluginDirectory()` from the `AhqWorkflow` interface.
2. Remove `getPluginDirectory()` from `AhqWorkflowImpl`.
3. Remove the `pluginDir?: PluginDirectory` constructor parameter from `AhqWorkflowImpl` (and the field).
4. Remove the `import type { PluginDirectory }` from `ahq-workflow-impl.ts` and `ahq-workflow.ts`.
5. Remove the REFACTOR comment on lines 38–43 of `ahq-workflow-impl.ts` (it becomes moot).
6. Update callers that construct `AhqWorkflowImpl` to stop passing `pluginDir`. The main one is `PluginImpl.discoverWorkflows()` — verify.
7. Update test mocks in `workflow-registry-impl.unit.test.ts` and `agentic-hq-program.unit.test.ts` to drop the `getPluginDirectory` stub and the `pluginDirPath` helper parameter.
8. Remove/rewrite the "should return plugin directory via getPluginDirectory" test in `ahq-workflow-impl.unit.test.ts`.
9. Remove the `expect(workflow.getPluginDirectory()...` assertion in `plugin-impl.unit.test.ts`.

**AI Recommendation**: **RECOMMEND.** This is a textbook "no test-only production methods" case (per `feedback_no_test_only_production_methods.md`). The method exists only to satisfy tests that were themselves written to exercise the API. It also resolves the REFACTOR comment on `AhqWorkflowImpl` (P.3 above) — the "required vs optional" dilemma goes away because the parameter disappears.

The alternative is to keep it on the interface in anticipation of P.2 being implemented later ("explicit pluginDir threading"). But: (a) the human's own comment in P.2 says "leave it for now", (b) speculative API surface for a refactor that may never happen is YAGNI, and (c) if P.2 is ever done, adding `getPluginDirectory()` back is cheap.

**Risk**: Low. The change is mechanical. The one thing to verify is that `PluginImpl.discoverWorkflows()` (which the audit shows currently constructs `AhqWorkflowImpl` with a `PluginDirectory`) doesn't actually need the directory for any production behaviour. It probably doesn't — but we should check `PluginImpl` code during execution.

**Files affected**:
- `src/workflow-discovery/interfaces/ahq-workflow.ts`
- `src/workflow-discovery/workflow/ahq-workflow-impl.ts`
- `src/workflow-discovery/plugin/plugin-impl.ts` (likely — stops passing `pluginDir`)
- `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts`
- `tests/unit/workflow-discovery/plugin/plugin-impl.unit.test.ts`
- `tests/unit/cli/workflow-registry-impl.unit.test.ts`
- `tests/unit/cli/agentic-hq-program.unit.test.ts`

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.4: Rename `WorkflowSearchResults` → `Workspaces`

**Type**: Interface/class rename
**Description**: Per the human's REFACTOR comment on `workflow-search-results-impl.ts` (P.4 above), the class is no longer "the results of a search" — it's just "the workspaces that AHQ knows about". Rename `WorkflowSearchResults` → `Workspaces` and `WorkflowSearchResultsImpl` → `WorkspacesImpl`. Update the file location (`src/workflow-discovery/workflow-listing/` → `src/workflow-discovery/workspace/` or similar), the interface export, SRP headers, the unit test file, the CLI wiring (`agentic-hq-program.ts`, `agentic-hq-cli.ts`), and every other reference.

**AI Recommendation**: **UNSURE, leaning DEFER.** I agree the name is stale. But:
- Non-trivial rename (~8 files touched, plus moves).
- The whole 2-workspace model is marked as potentially temporary (per the P.2 comment). Renaming now might itself be renamed again soon.
- `WorkflowSearchResults` is still referenced in a lot of test docs / analysis docs — those would still be accurate-ish but would drift out of sync.
- It's pure cosmetic — no correctness or clarity win beyond the name.

Honest gut feeling: defer this until we know the long-term shape. If approved now, it should be a separate mechanical pass.

**Risk**: Medium-low. Rename is mechanical but touches many files. Easy to miss a string ref.

**Files affected**: `src/workflow-discovery/interfaces/workflow-search-results.ts`, `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts`, `src/cli/agentic-hq-program.ts`, `src/cli/agentic-hq-cli.ts`, `tests/unit/cli/agentic-hq-program.unit.test.ts`, `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts` (if it exists), plus any other internal refs.

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

> **Deferred — may be done later (maybe).** A standalone Jira description has been written up at [`../jiras-for-later/rename-WorkflowSearchResults-to-Workspaces-jira-description.md`](../jiras-for-later/rename-WorkflowSearchResults-to-Workspaces-jira-description.md) capturing the scope, rationale, and acceptance criteria. Note the "may never be done" caveat: if the 2-workspace model is replaced by a more dynamic multi-workspace resolution scheme before this is picked up, the right move will be to do this rename as part of that larger change rather than as a standalone pass.

---

### Refactor 2.6: Delete `PluginDirectory.toString()` (dead — downstream of 2.3)

**Type**: Delete dead API surface
**Description**: Re-running the method audit after 2.3 exposes a second dead method on the same dead-code chain.

`PluginDirectory.toString()` has **zero** production callers (confirmed by grep across `src/`). Its only readers are three tests:
- `tests/unit/workflow-discovery/plugin/plugin-directory-impl.unit.test.ts:21`
- `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts:116`
- `tests/unit/workflow-discovery/plugin/plugin-impl.unit.test.ts:67`

The method's whole purpose was to return the absolute plugin directory path so that a caller could pass it as `--plugin-dir=<path>`. After the GREEN pivot, nothing calls this — `ClaudeCommandBuilder` now builds the `--plugin-dir` flags itself by scanning directories, never by asking a `PluginDirectory` object for its path. The two test assertions in `ahq-workflow-impl.unit.test.ts` and `plugin-impl.unit.test.ts` are cascading off refactor 2.3's `getPluginDirectory()` and become irrelevant as soon as 2.3 is executed.

Changes:
1. Remove `toString(): string` from the `PluginDirectory` interface.
2. Remove `toString()` from `PluginDirectoryImpl`.
3. Delete the "should return the full absolute plugin directory path via toString" test in `plugin-directory-impl.unit.test.ts`.
4. Delete the `getPluginDirectory().toString()` assertions in `ahq-workflow-impl.unit.test.ts` and `plugin-impl.unit.test.ts` (these go anyway as part of 2.3).

**AI Recommendation**: **STRONGLY RECOMMEND** — textbook dead code, same category as 2.3. Only surfaces once 2.3 is approved (before that, these callers exist). Both should be executed together.

**Dependencies**: Depends on / bundles with refactor 2.3.

**Risk**: None — deleting a method that nothing calls.

**Files affected**:
- `src/workflow-discovery/plugin/plugin-directory.ts`
- `src/workflow-discovery/plugin/plugin-directory-impl.ts`
- `tests/unit/workflow-discovery/plugin/plugin-directory-impl.unit.test.ts`

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.7: Collapse the `PluginDirectory` / `PluginDirectoryImpl` pair (interface has no real switchability)

**Type**: Delete redundant abstraction (downstream of 2.3 + 2.6)
**Description**: After refactors 2.3 and 2.6 are applied, the `PluginDirectory` interface has exactly one method left (`findWorkflowFiles(): AhqFiles`) with exactly one production caller: `PluginImpl.discoverWorkflows()` at `src/workflow-discovery/plugin/plugin-impl.ts:43`:

```typescript
const pluginDir = new PluginDirectoryImpl(this.pluginName, this.workspaceRoot);
const files = pluginDir.findWorkflowFiles();
return files.map((f) => new AhqWorkflowImpl(f, pluginDir));   // pluginDir arg killed by 2.3
```

`PluginImpl.discoverWorkflows()` instantiates a concrete `PluginDirectoryImpl` via `new`, uses it once, and it never escapes the method. **No external code ever receives a `PluginDirectory` through the interface contract** — which means the interface provides no switchability in practice. Anyone wanting to swap out "how do I find workflow files under a plugin dir" has to replace `PluginImpl` itself.

Per the project design requirements:

> *"If someone wants to replace (switch out) just one small aspect of the feature I've developed with their own concrete class to change the behaviour — could they do it easily? If the answer is 'No, because that small aspect is mixed up with other things inside a function somewhere' — then we've failed to extract that thing as a 'concept' into a class/interface."*

…the existence of the `PluginDirectory` interface looks like it satisfies the requirement, but because the only caller creates the concrete `Impl` directly, it actually doesn't. The interface is ceremony.

Two options — I'm honestly unsure which is right:

**Option A (conservative)**: Delete the `PluginDirectory` interface only; keep `PluginDirectoryImpl` as a concrete helper class, rename to `PluginDirectory` (no `Impl` since no interface). `PluginImpl.discoverWorkflows()` uses the concrete type directly. Keeps `findWorkflowFiles` as a named, testable unit. The `plugin-directory-impl.unit.test.ts::findWorkflowFiles` test survives.

**Option B (aggressive)**: Inline the whole thing into `PluginImpl`. `PluginImpl` already knows `pluginName` and `workspaceRoot`. Replace the helper with direct computation inside `discoverWorkflows()`:

```typescript
private discoverWorkflows(): AhqWorkflowImpl[] {
  const pluginDirPath = path.join(this.workspaceRoot, '.agentic-hq', 'plugins', this.pluginName);
  const files = new AhqDirectoryImpl(pluginDirPath).findMatchingFiles('skills/*/ahq-workflow.json');
  return files.map((f) => new AhqWorkflowImpl(f));
}
```

Deletes `src/workflow-discovery/plugin/plugin-directory.ts`, `plugin-directory-impl.ts`, and `plugin-directory-impl.unit.test.ts` entirely. Moves the `PLUGINS_SUBPATH` and `WORKFLOW_FILES_GLOB` constants into `PluginImpl`.

**AI Recommendation**: **UNSURE, leaning Option A.**
- **For Option A**: It's genuinely a helper — the path resolution + glob delegation is a small coherent unit, and keeping it as a named class is more grep-able and testable than inlining. Low risk, keeps one test alive, drops only the ceremonial interface.
- **For Option B**: It's the more honest call — `PluginImpl` is already the one-and-only caller and is itself small. Inlining removes a whole file, a whole test, and an indirection, which fits the "balance" caveat in the design requirements (don't fracture the system to the extreme). BUT: it couples `PluginImpl` to the `.agentic-hq/plugins/` path convention and the glob pattern, which might be information that belongs somewhere else long-term.
- **Against both**: If this really is the pattern for "how to look under a plugin dir", a future third workspace type (not AHQ, not user's cwd — something new) might want to reuse it. But that's speculative.

My honest gut: **Option A**. It buys the main win (delete a dead interface, make the relationship explicit) without betting on how flat things should be.

**Dependencies**: Depends on / bundles after 2.3 and 2.6.

**Risk**: Low for Option A, low-medium for Option B (touches more files, but mechanical).

**Files affected**:
- Option A: `src/workflow-discovery/plugin/plugin-directory.ts` (DELETE), `src/workflow-discovery/plugin/plugin-directory-impl.ts` (rename + drop `implements`), `src/workflow-discovery/plugin/plugin-impl.ts` (update import), tests update
- Option B: all three files above deleted (`plugin-directory.ts`, `plugin-directory-impl.ts`, `plugin-directory-impl.unit.test.ts`), plus `plugin-impl.ts` updated to inline the logic

**Your Decision**:
- [ ] **APPROVE — Option A** (delete interface, keep concrete helper)
- [ ] **APPROVE — Option B** (inline into PluginImpl, delete all)
- [x] **REJECT** - No, skip this (keep `PluginDirectory` as-is)
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

> **Rejected — fine to leave as-is.** After discussion with the human on 2026-04-13, we agreed this refactor is low-value and the status quo is actively defensible:
>
> - **No correctness or behaviour issue** — it works today and won't rot.
> - **Actually aligned with the project design requirements** — `project-design-requirements.md` asks for a "class/interface pair for every concept in the system". Keeping the `PluginDirectory` / `PluginDirectoryImpl` pair is *aligned* with DR, not violating it.
> - **Interfaces don't need to be actively polymorphic to earn their keep** — the switchability benefit lands the first time someone wants a test double or alt impl. `findWorkflowFiles()` is a legitimate production method (real caller in `PluginImpl.discoverWorkflows()`), not test-only dead code.
> - **The only real smell isn't "interface exists"** — it's that `PluginImpl` creates `new PluginDirectoryImpl` directly instead of receiving it via constructor injection. That's a separate, deeper refactor (touches Plugin/Workspace wiring) and not what 2.7 was about.
> - **After Refactor 2.6 deletes `toString()`**, the interface has exactly one method — small, clean, zero harm.
>
> No jiras-for-later file is being written for this because there's nothing actionable to defer. If someone later needs a test double or alt implementation, the interface is already there waiting — that's exactly the case for which the class/interface pair convention exists.

---

### Refactor 2.5: Remove cached `ahqWorkspace` / `currentUserWorkspace` fields from `WorkflowSearchResultsImpl`

**Type**: Remove cached state
**Description**: Per the "avoid cached state" feedback, `WorkflowSearchResultsImpl` shouldn't hold the two workspaces as fields. Instead, the workspaces should be created on each method call.

```typescript
// BEFORE:
export class WorkflowSearchResultsImpl implements WorkflowSearchResults {
  private readonly ahqWorkspace: Workspace;
  private readonly currentUserWorkspace: Workspace;
  constructor() {
    this.ahqWorkspace = new AhqWorkspaceImpl();
    this.currentUserWorkspace = new CurrentUserWorkspaceImpl();
  }
  getWorkflowsListingString(): string {
    const ahqSection = this.ahqWorkspace.getWorkflowListingString();
    // ...
  }
}

// AFTER:
export class WorkflowSearchResultsImpl implements WorkflowSearchResults {
  getWorkflowsListingString(): string {
    const ahqSection = new AhqWorkspaceImpl().getWorkflowListingString();
    const userSection = new CurrentUserWorkspaceImpl().getWorkflowListingString();
    return `${WORKFLOWS_LIST_HEADER}${ahqSection}\n\n${userSection}`;
  }
  registerWorkflowsWith(registry: WorkflowRegistry): void {
    new AhqWorkspaceImpl().registerWorkflowsWith(registry);
    new CurrentUserWorkspaceImpl().registerWorkflowsWith(registry);
  }
}
```

**AI Recommendation**: **UNSURE.** This was proposed in the unit REFACTOR as 2.4 and **REJECTED by the human** (per `unit-test-files/04a-refactor-phase-proposed-refactors.md:210` — "the [ ] APPROVE checkbox is unticked; this was SKIP in the agreed table"). I'm surfacing it again because the e2e phase hasn't explicitly re-confirmed that decision, but I'd honestly lean toward **keeping the unit-phase decision** — the human already considered this and said no. Only raising it in case the verdict has changed.

**Risk**: Low mechanically, but a subtle semantic change — each method call now re-resolves the workspace root via env var / `process.cwd()`. The human may have rejected this because of that.

**Files affected**: `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this (re-confirms unit phase decision)
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

This e2e REFACTOR focuses on CLI wiring, `ClaudeCommandBuilder` changes, and deletion of old code. No new domain concepts were created in the e2e GREEN phase (the class/interface design work was done in the unit test phase). The audit below focuses on the requirements that apply to the e2e phase's changes, noting that the full audit of the class/interface hierarchy already happened in `unit-test-files/04a-refactor-phase-proposed-refactors.md`.

| # | Requirement | Evidence (files, classes, patterns) | Status | Refactoring Proposal (if needed) |
|---|-------------|-------------------------------------|--------|----------------------------------|
| DR.1 | Class/interface pair for every concept | No new concepts introduced in e2e GREEN phase. `ClaudeCommandBuilder` gained a `UserProjectWorkspace` constructor param (existing interface). | N/A | — |
| DR.2 | Primitives wrapped in value objects | The plugin dir scanning in `ClaudeCommandBuilder` produces raw string paths (`--plugin-dir=/abs/path`). This is at the system edge (building CLI args) and extracting a `PluginDirectoryPath` wrapper here would be gold-plating — the strings are consumed immediately by the child process via CLI. | MET (edge usage) | — |
| DR.3 | Minimal state, delegation, "tell don't ask" | `ClaudeCommandBuilder` stores 4 constructor-injected deps (installation, userWorkspace, executable, extraArgs) — all are directly delegated to, no cached derived state. `WorkflowRegistryImpl` stores program + builder and delegates to both. `WorkflowSearchResultsImpl` caches two workspace objects in fields — debated in refactor 2.5 above (already rejected in unit phase). | MET (mostly; 2.5 debated) | See refactor 2.5 |
| DR.4 | Data Dictionary / English Language Description during planning | The e2e GREEN plan explicitly skipped this: *"Skipped for GREEN — no new classes/interfaces created. The scanning approach adds `UserProjectWorkspace` to `ClaudeCommandBuilder`'s constructor (constructor injection, consistent with existing pattern)."* Reasonable since no new concepts. | MET (correctly deferred to unit phase which did the design work) | — |
| DR.5 | Switchability — third party can replace any concrete class | `ClaudeCommandBuilder`'s plugin-dir scanning is hard-coded inside the class — a third party wanting to change how plugin dirs are resolved would have to override the whole builder. This is the thing the P.2 REFACTOR comment is about: long-term, plugin-dir resolution should be pushed out to a separate concept. **Not fixing now** per the human's own comment in the code. Also: subcommand registration is now switchable via `WorkflowRegistry` — ✓. | PARTIALLY MET (plugin-dir scanning not switchable) | Covered by P.2 which is recommended SKIP. Flag for a future Jira. |
| DR.6 | `Impl` naming convention | `ClaudeCommandBuilder` doesn't follow the `Impl` convention — it's named after the concrete class, not "ClaudeCommandBuilderImpl implements ClaudeCommandBuilder". It implements `MarshalledIOCLICommandBuilder`. Historical naming predates the convention. | PARTIALLY MET | Renaming existing long-standing classes is out of scope for this Jira. Flag for a future chore. |
| DR.7 | Balance — don't fracture the system | `ClaudeCommandBuilder.getPluginDirFlags()` + `addPluginDirsFrom()` is ~30 lines of procedural scanning inside the builder. A stricter reading of the design requirements would extract a `PluginDirectoryScanner` class. But per the balance caveat and the P.2 REFACTOR comment, this scanning is marked as temporary and the human explicitly said "leave it for now". Current choice = pragmatic balance. | MET (deliberate balance call) | — |

**Summary**: 5 of 7 MET, 2 PARTIALLY MET (DR.5, DR.6). Both PARTIALLY MET items are deliberately deferred — DR.5 by the human's own in-code comment, DR.6 out of scope for this Jira.

> **Note to human**: No new Tier 2 refactors surface from this audit that aren't already captured above.

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 3 (+1 optional) |
| Tier 2 AI-Identified (Pending review) | 5 |
| Design Requirements Audit (items needing action) | 0 |
| **Total identified by AI** | 8 (9 with optional) |

---

## Agreed Refactors Discussion Notes

**Review completed**: 2026-04-13
**DISCUSS items**: None — no refactors were marked DISCUSS
**Human-identified refactors**: None
**Decisions confirmed**: 7 approved, 4 rejected

During the review session the following material decisions / splits / defers were agreed:

### 2.2 → split into 2.2a (APPROVE) and 2.2b (REJECT)

The original Refactor 2.2 ("Move `WorkflowSearchResults` wiring into `CompositionRoot`") bundled two separate changes. On inspection these had very different value and were split:

- **2.2a — bug fix in `agentic-hq-program.ts:42`** — the `list` action was newing up its own `WorkflowSearchResultsImpl` instead of using the injected `searchResults` param. A real bug (any test injecting a fake would be silently bypassed by `list`). **APPROVED**. Note: this is the same change already captured as Tier 1 entry **1.2** — the two bookkeeping entries refer to the same code edit and will be executed once, not twice.
- **2.2b — move construction of `WorkflowSearchResultsImpl` into `CompositionRoot`** — stylistic consistency only. The class has a no-arg constructor so the proposed `getWorkflowSearchResults()` method is pure ceremony (`return new WorkflowSearchResultsImpl()`). **REJECTED** — revisit if/when `WorkflowSearchResultsImpl` grows real constructor dependencies.

### 2.4 — Rename `WorkflowSearchResults` → `Workspaces` — REJECTED (deferred, "maybe")

Agreed the name is stale, but:
- Non-trivial rename (~8 files + directory moves)
- The whole 2-workspace model is flagged as potentially temporary per the `ClaudeCommandBuilder.getPluginDirFlags()` REFACTOR comment
- Pure cosmetic — no correctness or clarity win beyond the name

A standalone Jira description was written up at [`../jiras-for-later/rename-WorkflowSearchResults-to-Workspaces-jira-description.md`](../jiras-for-later/rename-WorkflowSearchResults-to-Workspaces-jira-description.md) with scope, rationale, and the "may never be done" caveat — if the 2-workspace model is replaced before this is picked up, the right move will be to do the rename as part of that larger change rather than as a standalone pass.

### 2.7 — Collapse `PluginDirectory` / `PluginDirectoryImpl` pair — REJECTED

On discussion, the status quo was actively defensible:
1. No correctness / behaviour issue — works today, won't rot.
2. Aligned with DR.1 ("class/interface pair for every concept") — keeping the pair is *aligned* with the design requirement, not violating it.
3. Interfaces don't need to be actively polymorphic to earn their keep — the switchability benefit lands the first time someone wants a test double or alt impl. `findWorkflowFiles()` has a real production caller (`PluginImpl.discoverWorkflows()`), so it's not test-only dead code.
4. The only real smell isn't "interface exists" — it's that `PluginImpl` creates `new PluginDirectoryImpl` directly instead of receiving it via ctor injection. Separate, deeper refactor. Not 2.7's concern.
5. After 2.6 deletes `toString()`, the interface has exactly one method — small, clean, zero harm.

No jiras-for-later file written — nothing actionable to defer.

### 1.4 (optional) — Extract magic strings — APPROVED (human override)

AI recommendation was "don't bother — adds boilerplate without making anything clearer". Human directed: *"Please do this 1.4 refactor anyway."* Approved as directed.

### 2.1 — Delete DEMO_SKILLS / WorkflowSkillsRegistry / WorkflowSkill stack — APPROVED

This is the explicit Jira acceptance criterion. No discussion needed.

### 2.3 + 2.6 — Dead-code chain from the e2e GREEN-phase pivot — APPROVED

Both are straightforward dead-code deletions downstream of the GREEN-phase pivot from "thread `PluginDirectory` through `builder.build()`" to "dynamic scanning inside `ClaudeCommandBuilder`". 2.6 depends on 2.3 being applied first.

### 2.5 — Remove cached workspace fields — REJECTED

Re-confirms the same decision made in the unit-test REFACTOR phase. The caching is deliberate and the two workspaces are trivially constructed once; removing the cache would just shift the cost with no benefit.

---

## Agreed Refactors Summary Table

> **Single source of truth for the execute phase (04b).** For detail on any item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above or the original Tier 1 / Tier 2 entries.

**Execution order matters only where noted in the "Depends on" column.** Otherwise items can be executed in any order. Recommended: do 2.1 first (largest deletion, clears the decks), then 2.3 → 2.6 (dead-code chain), then the small Tier 1 items.

| # | Ref | Title | Type | Files affected | Depends on | Notes |
|---|-----|-------|------|----------------|------------|-------|
| 1 | **2.1** | Delete the old DEMO_SKILLS / WorkflowSkillsRegistry / WorkflowSkill stack | Delete dead code | `src/demo/demo-skills.ts` (DELETE), `src/workflow/workflow-skills/workflow-skills-registry.ts` (DELETE), `src/interfaces/workflow-skill.ts` (DELETE), `src/interfaces/index.ts` (remove export), `tests/unit/cli/agentic-hq-cli-list.unit.test.ts` (DELETE) | — | Explicit Jira acceptance criterion. Do first — largest blast radius, clears the decks. |
| 2 | **2.3** | Remove `getPluginDirectory()` from `AhqWorkflow` (test-only method) | Delete dead API surface | `src/workflow-discovery/interfaces/ahq-workflow.ts`, `src/workflow-discovery/workflow/ahq-workflow-impl.ts`, `src/workflow-discovery/plugin/plugin-impl.ts`, `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts`, `tests/unit/workflow-discovery/plugin/plugin-impl.unit.test.ts`, `tests/unit/cli/workflow-registry-impl.unit.test.ts`, `tests/unit/cli/agentic-hq-program.unit.test.ts` | — | Remove method from interface + impl, drop `pluginDir?` ctor param, drop stale `PluginDirectory` import, update test mocks, delete the test-only assertion. See Refactor 2.3 section for full 9-step checklist. |
| 3 | **2.6** | Delete `PluginDirectory.toString()` (dead) | Delete dead API surface | `src/workflow-discovery/plugin/plugin-directory.ts`, `src/workflow-discovery/plugin/plugin-directory-impl.ts`, `tests/unit/workflow-discovery/plugin/plugin-directory-impl.unit.test.ts` | **2.3** | Zero production callers. Only 3 test references. |
| 4 | **1.1** | Remove stale doctext referencing removed `--workflow-command-supplier` option | Doc cleanup | `src/cli/agentic-hq-cli.ts:12` | — | Delete the one stale usage-example line from the top-of-file docblock. |
| 5 | **1.2 / 2.2a** | Fix `list` action ignoring injected `searchResults` (bug fix) | Bug fix | `src/cli/agentic-hq-program.ts` (replace `new WorkflowSearchResultsImpl()` on line 42 with `searchResults`; remove now-unused import on line 16), `tests/unit/cli/agentic-hq-program.unit.test.ts` (add a test that verifies `list` uses the injected dep) | — | **Consolidated**: 1.2 and 2.2a describe the same code change — execute once. Real bug, not a style preference. |
| 6 | **1.3** | Clean up REFACTOR comment / SRP header on `WorkflowSearchResultsImpl` | Doc cleanup | `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts:14–22` | — | Since 2.4 was rejected, the REFACTOR comment referring to the rejected rename should be removed (or replaced with a short pointer to the deferred jira-for-later file). Verify the SRP header reads cleanly afterwards. |
| 7 | **1.4** | Extract magic strings in `agentic-hq-program.ts` to named constants | Extract magic constants | `src/cli/agentic-hq-program.ts:33–40` | — | `'agentic-hq'`, `'Orchestrate agentic software development with Claude Code'`, `'list'`, `'List available workflow skills'` → top-of-file `const` declarations. Human override of AI's "don't bother" recommendation. |

**Total**: 7 refactors (5 Tier 2 approved items consolidated into 3 + 4 Tier 1 items; 1.2 and 2.2a merged).

**Rejected (not in execution list)**: 2.2b (CompositionRoot move — ceremony), 2.4 (Workspaces rename — deferred to jiras-for-later), 2.5 (cached fields — re-confirms unit-phase decision), 2.7 (collapse PluginDirectory pair — aligned with DR.1 as-is).

---

## Review Status: COMPLETE

**Completed**: 2026-04-13
**Ready for 04b execute phase**: Yes
**Execute-phase source of truth**: "Agreed Refactors Summary Table" above

---

## Next Steps

1. Review the "Previous Phases" table — if you disagree with any "Skip", add it to Human-Identified Potential Refactors
2. Mark each AI-Identified Tier 2 refactor as APPROVE / REJECT / DISCUSS
3. Fill in "Human-Identified Potential Refactors" with your own refactors, or write "None"
4. Tell the AI you've completed your review
5. The AI will discuss: any items you marked DISCUSS + all human-identified items
6. After discussion, the AI fills in "Agreed Refactors Discussion Notes" and "Agreed Refactors Summary Table"
7. The execute phase (04b) runs automatically

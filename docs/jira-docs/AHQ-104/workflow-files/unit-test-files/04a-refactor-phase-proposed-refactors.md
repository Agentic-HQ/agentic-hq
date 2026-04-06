# REFACTOR Analysis: AHQ-104 (unit test)

**Jira**: [AHQ-104](https://agentic-hq.atlassian.net/browse/AHQ-104)
**Test Type**: unit
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-04-05

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

**Command**: `pnpm test:unit`
**Result**: PASSING (102 tests across 27 test files)

Also verified: `pnpm format:check` clean, `pnpm lint:check` clean.

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, red phase, green phase, implementation docs, and Jira comments for deferred items and opportunities.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | `02-red-phase-failing-tests.md` line 73-75 ("Refactor List"): _"Create `AhqFiles` interface and `AhqFilesImpl` class. `AhqWorkspace.findFiles()` currently returns `AhqFile[]` (raw array)..."_ | Deferred | Wrap the `AhqFile[]` returned from `AhqWorkspace.findFiles()` in a proper domain collection `AhqFiles` / `AhqFilesImpl`, mirroring the `AhqWorkflows` wrapping pattern. | **UNSURE** — borderline. Design requirements DO say "don't pass around primitives" and an array is arguably primitive-ish. BUT the Rule of Three doesn't apply: this is the ONLY place an `AhqFile[]` is passed around (`AhqWorkspace.findFiles()` → immediately consumed by `AhqWorkflowsImpl.map()`). The only behavior you'd want on `AhqFiles` is "for each, make an AhqWorkflow" — but that's workflow domain behavior, not file-collection behavior. Adds a class for consistency, not for earned value. | Tier 2 (DISCUSS) |
| P.2 | `03-green-phase-implementation-plan-copy.md` line 278 (Step 9b): _"No direct unit test file in GREEN — behavior is fully exercised through `AhqWorkflowImpl` tests ... Add to REFACTOR list: dedicated `json-file-impl.unit.test.ts`."_ | Deferred | Create a dedicated unit test file for `JsonFileImpl`. | **RECOMMEND** — `JsonFileImpl` is a standalone class with two distinct responsibilities (parse JSON / look up fields) currently tested only through `AhqWorkflowImpl`'s happy-path + two edge cases. Your `feedback_unit_test_file_per_class.md` memory explicitly requires one test file per class. JsonFileImpl has untested behavior (e.g., field exists but is not a string, access after constructor with empty `{}` JSON). | Tier 2 (new test file) |
| P.3 | `temp-steve-refactors.md` (human's own notes): _"`getDescription()` … `return WorkflowDescriptionImpl.createFrom(this.jsonFile);` and then WorkflowDescriptionImpl knows how to init itself. Same for all other workflow classes."_ | Human-proposed | Give each value object a static `createFrom(jsonFile: JsonFile)` factory that knows its own JSON field id, so `AhqWorkflowImpl` no longer holds all five `*_JSON_FIELD_ID` constants. | **UNSURE / PART-RECOMMEND** — pushes knowledge into the object (tell-don't-ask win) and removes the "five magic field-id constants in one class" concentration. BUT it couples every value object to `JsonFile`, and `WorkflowShortName` is constructed from *two* sources (JSON for discovery, plain string inside `ExampleCommandImpl`/`AhqWorkflowImpl.getExampleCommand()`), so it'd need *two* constructors/factories. Also introduces a "where does field-id knowledge live?" question — either in the value object class (spreads the JSON schema across 5 files) or in a JSON-schema map (re-concentrates it). Worth discussing the specific shape. | Tier 2 (DISCUSS) |
| P.4 | `03-green-phase-summary-of-what-was-implemented.md` line 43: _"Missing-shortId test failed on first test run — Fixed by adding a single `this.jsonFile.get(SHORT_ID_JSON_FIELD_ID)` call in the constructor ... (the RED test specifically requires the constructor to throw, not just a later getter)."_ | Observed | The `AhqWorkflowImpl` constructor calls `jsonFile.get(SHORT_ID_JSON_FIELD_ID)` and discards the result, purely to make a test about constructor-time validation pass. This is eager validation of ONE field out of five — arbitrary and smelly. | **RECOMMEND discussion** — either validate all fields eagerly (violates minimal state / fail-when-asked principle), or validate none (test must be rewritten to call a getter). Picking `shortId` only is the worst of both worlds. Note: memory `feedback_dont_add_unrequested_work.md` flags eager validation as an anti-pattern. | Tier 2 (DISCUSS) |
| P.5 | `03-green-phase-implementation-plan-copy.md` line 175 (Step 8) "exampleParameters" redesign: _"remove leading space from `exampleParameters` so the space lives in the code that joins them, not in the data"_ | Observed during GREEN | Decision was already made and executed — `ExampleParameters` now holds raw params with no leading space; `ExampleCommandImpl` injects the separator. | **Already done** — no further action. Noting for completeness. | Skip (already done) |
| P.6 | `ai-summary-of-jiras-and-questions-for-human.md` Agreed Decisions 2: _"Only create classes/interfaces that are actually used in this Jira's output. `version` and `author` fields will be in `ahq-workflow.json` but NOT wrapped in value objects until a later Jira needs them."_ | Observed | `WorkflowVersion` / `WorkflowAuthor` deliberately skipped. | **Skip (by design)** — confirmed out of scope per agreed decision. No action. | Skip (by design) |

> **Note to human**: If you disagree with any "Skip" or "UNSURE" above, mark it APPROVE or add your own note to Tier 2 Human-Identified.

---

## Magic Constants Audit

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `src/workflow-discovery/workflow/ahq-workflow-impl.ts` | 18-22 | `'pluginId'`, `'skillId'`, `'shortId'`, `'description'`, `'exampleParameters'` | EXTRACTED | `PLUGIN_ID_JSON_FIELD_ID`, `SKILL_ID_JSON_FIELD_ID`, `SHORT_ID_JSON_FIELD_ID`, `DESCRIPTION_JSON_FIELD_ID`, `EXAMPLE_PARAMETERS_JSON_FIELD_ID` |
| `src/workflow-discovery/workspace/ahq-workspace-impl.ts` | 11 | `'AGENTIC_HQ_WORKSPACE_ROOT'` | MAGIC | → `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` |
| `src/workflow-discovery/workflow-listing/ahq-workflows-impl.ts` | 9 | `'.agentic-hq/plugins/*/skills/*/ahq-workflow.json'` | MAGIC | → `AHQ_WORKFLOW_JSON_GLOB_PATTERN` (or split into its constituent parts) |
| `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts` | 13 | `'Available workflows:\n\n'` | MAGIC | → `WORKFLOWS_LIST_HEADER` |
| `src/workflow-discovery/workflow/example-command-impl.ts` | 13 | `'agentic-hq '` | MAGIC | → `AGENTIC_HQ_COMMAND_NAME` |
| `src/workflow-discovery/workflow/ahq-workflow-impl.ts` | 49 | `'  '` (2-space line prefix), `'\nExample: '` | MAGIC (borderline — presentation glue) | → `WORKFLOW_LINE_INDENT`, `EXAMPLE_LINE_PREFIX` |
| `src/workflow-discovery/workflow/full-claude-skill-command-impl.ts` | 11 | `'/'`, `':'` separators in the skill-command format | NOT MAGIC — format literal, self-evident inline | — |
| `src/workflow-discovery/workspace/ahq-workspace-impl.ts` | 14, 19 | `'/'` (path separator for glob split), `'*'` (wildcard) | NOT MAGIC — domain literal of the glob mini-parser | — |
| `src/workflow-discovery/workspace/ahq-file-impl.ts` | 15 | `'utf-8'` | NOT MAGIC — Node.js API default, self-evident | — |

**5 MAGIC entries above are included in Tier 1 refactors below.**

---

## Audit To Confirm Methods Used In Production Code (Not Just Tests)

Auditing every method on every interface/class created in this Jira to find test-only methods. A method that only exists because a test asserts on it (with no production-code caller) is a code smell per `feedback_no_test_only_production_methods.md`.

**Legend**: ✓ = has production caller · TEST-ONLY = only called from test files · SELF = called only from the same class (internal) · NOT-YET-WIRED = subsystem entry point, not yet wired into CLI (will be wired in e2e phase)

| Interface / Class | Method | Used in Production? | Evidence |
|---|---|---|---|
| `AhqFile` | `getPath()` | **TEST-ONLY** ⚠️ | Only called in `ahq-file-impl.unit.test.ts:26` and `ahq-workspace-impl.unit.test.ts:53`. No production caller. |
| `AhqFile` | `readContent()` | ✓ | `json-file-impl.ts:7` |
| `AhqWorkspace` | `getRoot()` | **SELF only** ⚠️ | Called once internally by `AhqWorkspaceImpl.findFiles()` at line 15 (`this.getRoot()`). No external production caller — only test files call it externally. |
| `AhqWorkspace` | `findFiles()` | ✓ | `ahq-workflows-impl.ts:9` |
| `AhqWorkflow` | `getShortName()` | ✓ (self) | `ahq-workflow-impl.ts:49` (own `displayYourself()`) |
| `AhqWorkflow` | `getDescription()` | ✓ (self) | `ahq-workflow-impl.ts:49` |
| `AhqWorkflow` | `getFullClaudeSkillCommand()` | ✓ (self) | `ahq-workflow-impl.ts:49` |
| `AhqWorkflow` | `getExampleCommand()` | ✓ (self) | `ahq-workflow-impl.ts:49` |
| `AhqWorkflow` | `displayYourself()` | ✓ | `ahq-workflows-impl.ts:13` |
| `AhqWorkflows` | `displayYourselves()` | ✓ | `workflow-search-results-impl.ts:13` |
| `WorkflowSearchResults` | `displayToUser()` | **NOT-YET-WIRED** | Entry point for the whole subsystem — will be wired into `agentic-hq list` in the e2e phase. Currently only tests call it. **Not a code smell — this is the deliberate API surface.** |
| `JsonFile` | `get()` | ✓ | `ahq-workflow-impl.ts:31, 34, 38-39, 44-45` |
| `WorkflowShortName` / `WorkflowDescription` / `ExampleParameters` / `PluginId` / `SkillId` / `FullClaudeSkillCommand` / `ExampleCommand` | `toString()` | ✓ | Called in template literals throughout (implicit coercion) and explicitly in `ahq-workflow-impl.ts:49` and `full-claude-skill-command-impl.ts:11` and `example-command-impl.ts:13`. |

**Flagged for deletion (or consideration):**
- `AhqFile.getPath()` — **delete** (test-only)
- `AhqWorkspace.getRoot()` — **consider inlining** — only called internally; could be replaced with a private field / private method, and removed from the public `AhqWorkspace` interface

These are added as Human-Identified refactors H.2 and H.4 below.

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.1 | Extract magic constant | Extract `'AGENTIC_HQ_WORKSPACE_ROOT'` env var name to a named constant (arguably at module scope and exported so tests can import it instead of duplicating the literal). | `src/workflow-discovery/workspace/ahq-workspace-impl.ts` Line: 11 |
| 1.2 | Extract magic constant | Extract the glob pattern `'.agentic-hq/plugins/*/skills/*/ahq-workflow.json'` to a named constant at top of `ahq-workflows-impl.ts`. | `src/workflow-discovery/workflow-listing/ahq-workflows-impl.ts` Line: 9 |
| 1.3 | Extract magic constant | Extract `'Available workflows:\n\n'` header to a named constant. | `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts` Line: 13 |
| 1.4 | Extract magic constant | Extract `'agentic-hq '` CLI command-name prefix to a named constant. | `src/workflow-discovery/workflow/example-command-impl.ts` Line: 13 |
| 1.5 | Extract magic constant | Extract `'  '` (two-space line indent) and `'\nExample: '` in `displayYourself()` to named constants. | `src/workflow-discovery/workflow/ahq-workflow-impl.ts` Line: 49 |
| 1.6 | Fix stale doc comment | Doc-comment in test file says `displayThemselves` but the production method is named `displayYourselves`. | `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts` Line: 4 |
| 1.7 | Add missing SRP-format TSDoc | None of the 13 Impl classes, 13 interfaces, or their public methods have TSDoc `/**... */` blocks. The pre-existing codebase uses a specific **SRP (Single Responsibility Principle) header format** — see `src/tools/marshalled-io-tools/marshalled-cli-tool.ts` and `src/interfaces/cli-wrapper.ts` as canonical examples. **Format for both classes AND interfaces**: `Name — one-line purpose.` + `SRP Does:` (what the single responsibility IS) + `SRP Knows About:` (what it knows/has in its head) + `SRP Knows Nothing About:` (what it explicitly doesn't know — the boundaries). Interfaces get the same SRP header as classes (see `cli-wrapper.ts`). **Each public method** gets a one-line `/** ... */` comment. Apply this format to all 13 interfaces + 13 Impl classes + their public methods. | All 26 files under `src/workflow-discovery/` |
| 1.8 | Remove in-file duplication | In `ahq-workflow-impl.unit.test.ts` lines 18-30, the helpers `writeTempJsonPath` and `writeTempFilePath` are near-duplicates (same temp dir setup, same filename). Collapse to a single helper and pass content as a parameter. | `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts` Lines: 18-30 |
| 1.9 | Simplify conditional | In `ExampleCommandImpl.toString()` the `separator` ternary can be expressed more directly: `return paramsStr === '' ? `agentic-hq ${name}` : `agentic-hq ${name} ${paramsStr}`;` (two clear branches, no intermediate `separator` variable). Minor readability win. | `src/workflow-discovery/workflow/example-command-impl.ts` Lines: 10-14 |
| 1.10 | Remove redundant code | `displayYourself()` calls `.toString()` explicitly on every value object inside a template literal. JavaScript template literals call `.toString()` automatically. Remove the explicit calls for readability: `` `  ${this.getShortName()} ${this.getFullClaudeSkillCommand()} ${this.getDescription()}\nExample: ${this.getExampleCommand()}` ``. | `src/workflow-discovery/workflow/ahq-workflow-impl.ts` Line: 49 |

---

## Tier 2: AI-Identified Potential Refactors

Include ALL potential structural refactors — both ones I recommend AND ones I'm unsure about. The human decides; my job is to surface them all with honest opinions.

### Refactor 2.1: Dedicated `json-file-impl.unit.test.ts`

**Type**: New test file (one-test-file-per-class per memory)
**Description**: Create `tests/unit/workflow-discovery/workspace/json-file-impl.unit.test.ts` covering `JsonFileImpl` directly: valid JSON + `get()` returns string; invalid JSON throws; missing field throws; non-string field value throws; `get()` with empty string as valid value.
**AI Recommendation**: **RECOMMEND** — compliant with `feedback_unit_test_file_per_class.md`, and `JsonFileImpl` has edge cases (non-string values, empty-string values) not covered by the indirect `AhqWorkflowImpl` tests.
**Risk**: Very low — it's a new isolated test file.
**Files affected**: `tests/unit/workflow-discovery/workspace/json-file-impl.unit.test.ts` (new)

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.2: `AhqFiles` / `AhqFilesImpl` collection wrapper

**Type**: Create new abstraction (interface + Impl pair)
**Description**: Wrap the `AhqFile[]` returned from `AhqWorkspace.findFiles()` in a domain collection `AhqFiles`, mirroring how `AhqWorkflows` wraps a set of workflows. `findFiles()` would return `AhqFiles`; `AhqWorkflowsImpl` would ask it to do something rather than iterating the raw array.
**AI Recommendation**: **UNSURE** — arguments for: design requirements ("pass around classes, not primitives/arrays"), consistency with `AhqWorkflows`. Arguments against: Rule of Three not met (single usage), no behavior earned on the collection yet — `AhqWorkflowsImpl` just needs "for each file, new AhqWorkflowImpl" which is naturally a `.map()` call. Adding it is pure consistency with no current behavioral win.
**Risk**: Low risk to implement, but pure gold-plating risk — a new class exists to satisfy a principle, not to add value.
**Files affected**: 2 new files (`interfaces/ahq-files.ts`, `workspace/ahq-files-impl.ts`), modified: `ahq-workspace.ts` interface, `ahq-workspace-impl.ts`, `ahq-workflows-impl.ts`, `ahq-workspace-impl.unit.test.ts`

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional):  I see the point about "pure gold plating" but (just for this set of work) I've decided I want "an object/interface for **every** concept".  It's kind of an experiment to see what we end up with.  May not do it again, but so far I'm actually impressed with the results.  I look at the code and see **LOTS** of intefaces/classes - but it's very easy for my brain to know what they are.  Then I look at what they each do and it's "obvious" to me the should do it, and they all delegate a *LOT* which makes it easy to see what's going on.  So. Point taken - but I'm going to go ahead with this refactoring as well.  I also think it's very likely that as time goes on we'll realise that we can "push" stuff into AhqFiles which is currently being done by other things - which leads to simplification and further decomposition of the problem (which I like).

---

### Refactor 2.3: Value objects own their JSON-field knowledge via `createFrom(jsonFile)` (your `temp-steve-refactors.md` idea)

**Type**: Redistribute responsibilities across classes
**Description**: Add a static factory `createFrom(jsonFile: JsonFile)` to each value object used in `AhqWorkflowImpl`. Each value object knows its own JSON field id. `AhqWorkflowImpl.getDescription()` becomes `return WorkflowDescriptionImpl.createFrom(this.jsonFile)` rather than `return new WorkflowDescriptionImpl(this.jsonFile.get(DESCRIPTION_JSON_FIELD_ID))`. The five `*_JSON_FIELD_ID` constants move out of `AhqWorkflowImpl` into the respective value-object files.
**AI Recommendation**: **UNSURE** — pushes responsibility into the entity (tell-don't-ask win) and removes the five-constants-in-one-class concentration. **But** three concerns:
  1. Every value object becomes coupled to `JsonFile` — they're no longer pure value objects.
  2. `WorkflowShortName` is constructed in *two* contexts: from JSON (discovery) and from a plain string (inside `AhqWorkflowImpl.getExampleCommand()` it constructs a fresh one). So it'd need both a `new WorkflowShortNameImpl(string)` constructor AND a `createFrom(jsonFile)` — two entry points.
  3. The JSON schema knowledge is now spread across 5 files (each value object class) instead of concentrated in one place. Tradeoff: scattered vs centralised.
**Risk**: Medium — changes the structure of 5 value-object files + `AhqWorkflowImpl`. Needs some design conversation before we execute.
**Files affected**: `workflow-short-name-impl.ts`, `workflow-description-impl.ts`, `example-parameters-impl.ts`, `plugin-id-impl.ts`, `skill-id-impl.ts`, `ahq-workflow-impl.ts`, plus updates to tests.

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): Again - see the point about each object having to "know" about JsonFile, but really they are only "knowing" how to ask something for their string value using an ID.  in the future we could put a WorkflowMetadata interface on JsonFile and the "get" method is then just a "give me my string value for this metadata thing based on this ID I give you".  In fact!!! Hell, let's do it now!!! We shouldn't call the interface JsonFile - we should call it WorkflowMetadata and the implementation class JsonFileWorkflowMetadata (not JsonFileImpl).   JsonFileWorkflowMetadata should just extend JsonFileImpl class, so that the "get" calls just get passed on to it.

---

### Refactor 2.4: Remove the eager `shortId` validation hack in `AhqWorkflowImpl` constructor

**Type**: Fix design smell / rewrite a test
**Description**: Line 28 of `ahq-workflow-impl.ts` calls `this.jsonFile.get(SHORT_ID_JSON_FIELD_ID)` and discards the result, purely so the constructor throws when `shortId` is missing. This is arbitrary eager validation of ONE field out of five — smells bad. Two options: (a) drop the call and rewrite the test to call `workflow.getShortName()` to trigger the throw; (b) keep it but rename it to `validateRequiredFields()` and validate ALL required fields at construction (but this cages the minimal-state principle).
**AI Recommendation**: **RECOMMEND option (a)** — drop the line, rewrite the test. It aligns with the minimal-state / fail-when-asked design, removes arbitrary validation, and honours `feedback_dont_add_unrequested_work.md`. The current test `'should throw on missing required field (shortId)'` can just call `getShortName()`.
**Risk**: Low — it's one test rewrite and one line removed.
**Files affected**: `src/workflow-discovery/workflow/ahq-workflow-impl.ts`, `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts`

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.5: Value-object validation duplication (4 classes with identical `trim() === ''` + throw)

**Type**: Extract shared validation helper (Rule of Three - satisfied 4 times)
**Description**: `WorkflowShortNameImpl`, `WorkflowDescriptionImpl`, `PluginIdImpl`, `SkillIdImpl` each have identical constructor bodies: check `value.trim() === ''`, throw with a class-specific message, store the value, implement `toString()`. Four near-clones. Options: (a) extract a `NonEmptyStringValueObject` abstract base class that subclasses extend; (b) extract a tiny `requireNonBlank(value, fieldName)` helper function; (c) leave it — 4 classes × 10 lines each is cheap to maintain.
**AI Recommendation**: **UNSURE** — Rule of Three is met (4 identical instances), so we COULD extract. But the abstraction makes the value objects feel less "self-contained" and adds a dependency. Option (b) — tiny helper function — is the lightest-touch option and still removes the duplication. Option (c) is also defensible: 4 × 10 trivial lines is readable as-is.
**Risk**: Low.
**Files affected**: The 4 value-object files above + a new shared helper file (or base class).

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.6: Switchability — inject concrete dependencies rather than `new`-ing them inside constructors

**Type**: Dependency inversion / constructor injection
**Description**: Three classes hard-construct their own dependencies with `new`, making them impossible to switch out per design-requirement "could a third party replace any concrete class easily?":
  1. `AhqWorkflowImpl` constructor creates `new JsonFileImpl(file)` inline.
  2. `AhqWorkflowsImpl` constructor creates `new AhqWorkflowImpl(f)` inside `.map()`.
  3. `WorkflowSearchResultsImpl` no-arg constructor creates `new AhqWorkspaceImpl()` + `new AhqWorkflowsImpl(...)` inline.
  A third party wanting to swap in a `YamlFile` (instead of `JsonFile`), or a `GitHubAhqWorkflows` (instead of filesystem-scanning), cannot do so without subclassing and overriding.
**AI Recommendation**: **UNSURE / NOT RECOMMENDED at this scope** — design requirement DR.7 is real. But: (a) these classes are near the root of the composition tree and something has to wire them; (b) switching to injection means either a composition-root class or factory params (both are more code/complexity); (c) the `WorkflowSearchResultsImpl()` no-arg constructor is convenient for the CLI entry point; converting it means changing callers. Deferring to a later Jira when CLI wiring happens (currently out of scope per Jira — CLI wiring is a separate subtask) probably makes more sense. Worth a conversation about whether to tackle even one of the three.
**Risk**: Medium — changes constructor signatures, ripples into tests and any (future) CLI wiring.
**Files affected**: `ahq-workflow-impl.ts`, `ahq-workflows-impl.ts`, `workflow-search-results-impl.ts`, plus tests.

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): When we move to using "classwitch" framework we'll be replacing "new" calls with calls to the framework, and those concrete implementations will then become "switchable".

---

### Refactor 2.7: `AhqFileImpl` validates only `=== ''`, not `.trim() === ''` — inconsistent with other value objects

**Type**: Consistency fix (or deliberate policy)
**Description**: `AhqFileImpl` throws on empty path (`path === ''`) but NOT on whitespace-only path. The other four value objects (`WorkflowShortName`, `WorkflowDescription`, `PluginId`, `SkillId`) all reject both empty and whitespace-only strings. The current `AhqFile` test only asserts empty.
**AI Recommendation**: **NOT RECOMMENDED** — this is unrequested-work territory per `feedback_dont_add_unrequested_work.md`. The test only asks for empty rejection. And whitespace-only file paths are not the same class of concept as whitespace-only workflow names (a `' '` path could technically resolve on some filesystems). Leave as-is unless you think tightening is worthwhile.
**Risk**: Low risk, but it IS adding validation the tests didn't ask for.
**Files affected**: `src/workflow-discovery/workspace/ahq-file-impl.ts`, `tests/unit/workflow-discovery/workspace/ahq-file-impl.unit.test.ts`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.8: `AhqWorkspaceImpl.findFiles()` hand-rolled glob walker

**Type**: Consider using a library (or leave as-is)
**Description**: `findFiles()` manually splits the glob pattern on `/`, walks each segment, expands `*` via `fs.readdirSync`. Works only for this exact pattern shape — no `**`, no `?`, no character classes. A library like `glob` or `fast-glob` would be more robust.
**AI Recommendation**: **NOT RECOMMENDED** — classic YAGNI. Current code handles the exact production pattern (`.agentic-hq/plugins/*/skills/*/ahq-workflow.json`) correctly with zero dependencies. No test exercises any other pattern. Adding a glob library for a feature we don't have is gold-plating. Revisit if/when a more complex pattern is needed.
**Risk**: Adding a dependency for no current benefit.
**Files affected**: `src/workflow-discovery/workspace/ahq-workspace-impl.ts`, `package.json`

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): Also see below that this "glob" or "fast-glob" library should be used in the new AhqDirectoryImpl class we are creating, that this AhqWorkspaceImpl delegates to.

---

### Refactor 2.9: Test fixture duplication between `ahq-workflows-impl.unit.test.ts` and `workflow-search-results-impl.unit.test.ts`

**Type**: Share test fixture
**Description**: Both test files define `createTestWorkspaceFixture(rootDir: string)` with essentially the same structure (alpha plugin with reversal+math+no-workflow skills, beta plugin with quick-task). They're ~60 lines each. Could extract to `tests/unit/workflow-discovery/test-fixtures/workspace-fixture.ts`.
**AI Recommendation**: **UNSURE** — Rule of Three is NOT met (only 2 uses). Test-fixture sharing is a common pattern, but each test file being self-contained is also a virtue (easier to read one file in isolation). Lean: leave as-is until a third test needs the same fixture.
**Risk**: Low, but borderline premature extraction.
**Files affected**: 2 test files + 1 new fixture helper.

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None". Everything added here will be discussed with the AI before a decision is made.

> **MANDATORY**: You MUST either add refactors here OR write "None" before the execute phase can proceed.

These items were added by the human in `temp-steve-refactors.md` and transcribed here for discussion. All items default to DISCUSS.

### Refactor H.1: Compose `createFrom(jsonFile)` recursively through children

**Source**: `temp-steve-refactors.md` lines 20-32
**Description**: Expansion of AI's Refactor 2.3. The factory pattern must compose recursively: not only each leaf value object gets a `createFrom(jsonFile)`, but composite objects like `ExampleCommandImpl` ALSO get a `createFrom(jsonFile)` which internally delegates: `ExampleCommandImpl.createFrom(jsonFile)` calls `WorkflowShortNameImpl.createFrom(jsonFile)` + `ExampleParametersImpl.createFrom(jsonFile)`. Similarly `FullClaudeSkillCommandImpl.createFrom(jsonFile)` would call `PluginIdImpl.createFrom(jsonFile)` + `SkillIdImpl.createFrom(jsonFile)`. Result: `AhqWorkflowImpl.getExampleCommand()` becomes a single line `return ExampleCommandImpl.createFrom(this.jsonFile)`.
**Status**: DISCUSS — the composition shape needs to be worked out with AI. See AI's three concerns noted in 2.3.

Human: Let's discuss, but as I said above - I'd like to go ahead with this.

---

### Refactor H.2: Delete `AhqFile.getPath()` if only used by tests

**Source**: `temp-steve-refactors.md` lines 37-41
**Description**: Per `feedback_no_test_only_production_methods.md`: if a production method is only called from tests, it's a code smell and should be removed.
**AI Finding (from the audit above)**: **Confirmed TEST-ONLY.** `getPath()` is only called in `ahq-file-impl.unit.test.ts:26` and `ahq-workspace-impl.unit.test.ts:53`. No production caller.
**Action if approved**: Remove `getPath()` from `AhqFile` interface and `AhqFileImpl` class. Remove/rewrite the 2 tests that assert on it (the `AhqFile` concept can be verified through behavior that *does* happen in production — e.g., through `readContent()`).
**Status**: DISCUSS / likely APPROVE.

Human: Let's discuss, but thinking APPROVE.

---

### Refactor H.3: Rename `displayYourself()` → `getWorkflowListingEntryString()` and `displayYourselves()` → `getWorkflowListingEntriesString()`

**Source**: `temp-steve-refactors.md` lines 45-53
**Description**: The current `displayYourself()` / `displayYourselves()` method names suggest they actually print/display — but they return a string that the caller later prints. Rename to accurately reflect what they do: return a string representation for the workflow listing output.
**AI Recommendation**: **Mixed.** The rename is more accurate about the return value. BUT the design doc specifically uses "displayYourself" style in its English Language Description pattern (line 119: _"We just say: `workflowSearchResult.displayToUser()`"_) and the plan's English description at line 39 of the red-phase plan uses _"displayYourself"_ / _"displayThemselves"_ to evoke "tell don't ask" / imperative style. Renaming to `getWorkflowListingEntryString` switches from imperative to accessor style — loses the tell-don't-ask flavour. If we make this change, we should probably also rename `displayToUser()` → `getWorkflowsListingString()` for consistency. Worth discussing whether accuracy or the tell-don't-ask flavour is more important.
**Status**: DISCUSS.

Human: We're getting the string, we should rename based on what I said.  If we were telling the thing to print to console, displayToUser would be correct. But we aren't.

---

### Refactor H.4: Remove `AhqWorkspace.getRoot()` from interface if only used by tests

**Source**: `temp-steve-refactors.md` lines 56-59
**Description**: If `getRoot()` is only called by tests (externally), ditch it from the interface.
**AI Finding (from the audit above)**: `getRoot()` is called externally **only in tests** (2 test assertions). Internally, it's called once by `AhqWorkspaceImpl.findFiles()` (line 15) via `this.getRoot()`. So it's SELF-only in production.
**Action if approved**: Make `getRoot()` a private method (or inline `process.env.AGENTIC_HQ_WORKSPACE_ROOT ?? ''` directly into `findFiles()`), and remove it from the `AhqWorkspace` interface. Rewrite the one test that asserts on it by verifying the workspace's behavior through `findFiles()` instead.
**Status**: APPROVED


---

### Refactor H.5: Update command file `04a-jira-refactor-analysis.md` to include "Audit To Confirm Methods Used In Production Code (Not Just Tests)" as a standard step

**Source**: `temp-steve-refactors.md` lines 63-67
**Description**: Add the audit step to the workflow command `04a-jira-refactor-analysis.md` so future Jiras automatically audit methods for test-only usage after the constants audit. (The audit itself has been done for AHQ-104 in the new "Audit To Confirm Methods Used In Production Code (Not Just Tests)" section above.)
**AI Note**: This is a change to the workflow command definition file, not code in this Jira. It's a meta-change for future runs of this command. Probably belongs in its own Jira ticket, but can also be done here as a standalone commit alongside the refactor commits.
**Status**: APPROVED

Human: Just do it please.

---

### Refactor H.6: New `AhqDirectory` interface/class

**Source**: `temp-steve-refactors.md` lines 73-81
**Description**: `AhqWorkspaceImpl` currently owns the manual glob walker (`findFiles(globPattern)`). Extract this into a new `AhqDirectory` interface + `AhqDirectoryImpl` class that provides `findMatchingFilesUsingPattern(pattern: string)`. `AhqWorkspaceImpl` would delegate to it. Place new class + interface in the `workspace/` dir alongside `AhqFile`. Add a new unit test for `AhqDirectoryImpl`.
**AI Recommendation**: **RECOMMEND** — conceptually stronger separation (workspace knows its root; directory knows how to walk itself). Also makes the glob-walker code independently testable. Risk: this does extract code that's currently only used in one place (not Rule of Three), BUT the human is explicitly identifying "walking a directory for matching files" as a distinct concept that deserves its own class per design requirement DR.1 (concept-per-class/interface pair). This is a judgment call I support.
**Status**: DISCUSS — sounds good, let's confirm the API shape and scope.

Human: OK

---

### Refactor H.7: Test library for auto-deleting temp directories

**Source**: `temp-steve-refactors.md` lines 86-95
**Description**: Currently tests use `fs.mkdtempSync(...)` + manual `fs.rmSync(..., { recursive: true, force: true })` in `afterEach()`. The manual cleanup uses a force-recursive delete which is dangerous if the path is wrong. Investigate whether there's a test library (likely vitest-compatible) that auto-cleans temp dirs.
**AI Research Needed**: Options to investigate: `tmp` (https://www.npmjs.com/package/tmp — auto-cleanup on process exit), `tempy` (popular in Node ecosystem), vitest's `vi.useFakeTimers()`-style helpers. There's also `node:fs` native `fs.mkdtempSync` + newer cleanup APIs. The current pattern works but the `rmSync` with `force: true, recursive: true` is indeed a sharp tool.
**AI Recommendation**: **RECOMMEND investigation** — worth replacing dangerous manual `rmSync({recursive: true, force: true})` calls with a library that auto-cleans and guarantees the path is inside `os.tmpdir()` before deletion. Would apply to ~3 test files in `tests/unit/workflow-discovery/`. Small scope, safety win.
**Status**: DISCUSS — let me research the best library option and propose a specific one.

Human: OK, sounds good.

---

---

## Design Detail: Composite `createFrom` Pattern (H.1 + 2.3 combined)

This section documents the agreed design for the combined H.1 + 2.3 refactor in full, so the 04b execute agent has an unambiguous blueprint.

### Rename: `JsonFile` / `JsonFileImpl` → domain-named metadata contract

- **Keep** `JsonFile` interface and `JsonFileImpl` class exactly as they are today (generic JSON-file reading — reusable for any future JSON file).
- **Add** a new domain interface `WorkflowMetadata` that **extends** `JsonFile` (same method signature: `get(fieldId: string): string`). The new name conveys **domain intent** instead of **file format**.
- **Add** a new class `JsonFileWorkflowMetadata extends JsonFileImpl implements WorkflowMetadata`. The body is essentially empty — it inherits `get()` from `JsonFileImpl`. Constructor just calls `super(file)`.
- **Value objects depend on `WorkflowMetadata`**, NOT on `JsonFile`. If we later need YAML metadata, add `YamlFileImpl` + `YamlFileWorkflowMetadata extends YamlFileImpl implements WorkflowMetadata`. Value objects don't change.

**File locations:**
- `src/workflow-discovery/interfaces/workflow-metadata.ts` — the new interface
- `src/workflow-discovery/workspace/json-file-workflow-metadata.ts` — the concrete class (in `workspace/` alongside `JsonFileImpl`)

### Layer 1 — Leaf value objects each own their field id + `createFrom`

Each leaf value object holds its own `*_JSON_FIELD_ID` constant at module scope and gains a static `createFrom(metadata: WorkflowMetadata)` factory.

Example — `WorkflowShortNameImpl`:

```typescript
// src/workflow-discovery/workflow/workflow-short-name-impl.ts
const SHORT_ID_JSON_FIELD_ID = 'shortId';

export class WorkflowShortNameImpl implements WorkflowShortName {
  constructor(private readonly value: string) { /* existing validation */ }

  static createFrom(metadata: WorkflowMetadata): WorkflowShortName {
    return new WorkflowShortNameImpl(metadata.get(SHORT_ID_JSON_FIELD_ID));
  }

  toString(): string { return this.value; }
}
```

Same pattern for: `WorkflowDescriptionImpl`, `ExampleParametersImpl`, `PluginIdImpl`, `SkillIdImpl`. Each owns ONE `*_JSON_FIELD_ID` constant.

### Layer 2 — Composite value objects delegate to their children's `createFrom`

Composites know nothing about field ids — they just ask each child to build itself from the same metadata.

`ExampleCommandImpl` (composite of `WorkflowShortName` + `ExampleParameters`):

```typescript
// src/workflow-discovery/workflow/example-command-impl.ts
export class ExampleCommandImpl implements ExampleCommand {
  constructor(
    private readonly shortName: WorkflowShortName,
    private readonly params: ExampleParameters
  ) {}

  static createFrom(metadata: WorkflowMetadata): ExampleCommand {
    return new ExampleCommandImpl(
      WorkflowShortNameImpl.createFrom(metadata),
      ExampleParametersImpl.createFrom(metadata)
    );
  }

  toString(): string { /* existing formatting logic */ }
}
```

`FullClaudeSkillCommandImpl` (composite of `PluginId` + `SkillId`):

```typescript
// src/workflow-discovery/workflow/full-claude-skill-command-impl.ts
export class FullClaudeSkillCommandImpl implements FullClaudeSkillCommand {
  constructor(
    private readonly pluginId: PluginId,
    private readonly skillId: SkillId
  ) {}

  static createFrom(metadata: WorkflowMetadata): FullClaudeSkillCommand {
    return new FullClaudeSkillCommandImpl(
      PluginIdImpl.createFrom(metadata),
      SkillIdImpl.createFrom(metadata)
    );
  }

  toString(): string { /* existing formatting logic */ }
}
```

### Layer 3 — `AhqWorkflowImpl` collapses to pure delegation

**Before** (today — `AhqWorkflowImpl` holds all 5 field-id constants + does all the wiring):

```typescript
const PLUGIN_ID_JSON_FIELD_ID = 'pluginId';
const SKILL_ID_JSON_FIELD_ID = 'skillId';
const SHORT_ID_JSON_FIELD_ID = 'shortId';
const DESCRIPTION_JSON_FIELD_ID = 'description';
const EXAMPLE_PARAMETERS_JSON_FIELD_ID = 'exampleParameters';

export class AhqWorkflowImpl implements AhqWorkflow {
  private readonly jsonFile: JsonFile;

  constructor(file: AhqFile) {
    this.jsonFile = new JsonFileImpl(file);
    this.jsonFile.get(SHORT_ID_JSON_FIELD_ID); // eager-validation hack
  }

  getShortName(): WorkflowShortName {
    return new WorkflowShortNameImpl(this.jsonFile.get(SHORT_ID_JSON_FIELD_ID));
  }
  getDescription(): WorkflowDescription {
    return new WorkflowDescriptionImpl(this.jsonFile.get(DESCRIPTION_JSON_FIELD_ID));
  }
  getFullClaudeSkillCommand(): FullClaudeSkillCommand {
    return new FullClaudeSkillCommandImpl(
      new PluginIdImpl(this.jsonFile.get(PLUGIN_ID_JSON_FIELD_ID)),
      new SkillIdImpl(this.jsonFile.get(SKILL_ID_JSON_FIELD_ID))
    );
  }
  getExampleCommand(): ExampleCommand {
    return new ExampleCommandImpl(
      new WorkflowShortNameImpl(this.jsonFile.get(SHORT_ID_JSON_FIELD_ID)),
      new ExampleParametersImpl(this.jsonFile.get(EXAMPLE_PARAMETERS_JSON_FIELD_ID))
    );
  }
  // ...
}
```

**After** (no field-id constants in this file; constructor has no eager-validation hack; each getter is a one-liner):

```typescript
export class AhqWorkflowImpl implements AhqWorkflow {
  private readonly metadata: WorkflowMetadata;

  constructor(file: AhqFile) {
    this.metadata = new JsonFileWorkflowMetadata(file);
  }

  getShortName(): WorkflowShortName {
    return WorkflowShortNameImpl.createFrom(this.metadata);
  }
  getDescription(): WorkflowDescription {
    return WorkflowDescriptionImpl.createFrom(this.metadata);
  }
  getFullClaudeSkillCommand(): FullClaudeSkillCommand {
    return FullClaudeSkillCommandImpl.createFrom(this.metadata);
  }
  getExampleCommand(): ExampleCommand {
    return ExampleCommandImpl.createFrom(this.metadata);
  }
  // displayYourself() / getWorkflowListingEntryString() stays as-is (string-returning renderer)
}
```

### What this pattern buys us

1. **Knowledge is distributed, not concentrated** — leaves know their own field id; composites know their own children; `AhqWorkflowImpl` knows nothing about JSON schema.
2. **Each `createFrom` is a one-liner** — `AhqWorkflowImpl` becomes pure delegation.
3. **Schema changes are local** — renaming the JSON field `"shortId"` only touches `workflow-short-name-impl.ts`.
4. **Recursive composition scales** — if `ExampleCommand` later gains a third child, only `ExampleCommandImpl.createFrom` changes.
5. **File-format change is swappable** — value objects depend on the `WorkflowMetadata` domain interface, not `JsonFile`. A future `YamlFileWorkflowMetadata` or `TomlFileWorkflowMetadata` slots in without touching any value object.

### Note on `WorkflowShortName` dual usage

`WorkflowShortName` appears in two contexts:
- (a) As a top-level workflow attribute via `AhqWorkflow.getShortName()`
- (b) As a child of `ExampleCommand`

Both contexts use the same `WorkflowShortNameImpl.createFrom(metadata)` and both read the same `'shortId'` JSON field. Correct — they refer to the same underlying value. If we ever needed two distinct short-name concepts reading from different fields, we'd need two classes. Not a concern today.

### Test-file impact

- Each leaf value object's test file gains a `createFrom(metadata)` test case (stubbing `WorkflowMetadata`).
- `example-command-impl.unit.test.ts` and `full-claude-skill-command-impl.unit.test.ts` gain composite `createFrom` tests.
- `ahq-workflow-impl.unit.test.ts` — the existing getter tests still work (they test `workflow.getShortName()` etc. end-to-end through the real `JsonFileWorkflowMetadata`). The "throws on missing shortId" test is rewritten per Refactor 2.4 to call `workflow.getShortName()` to trigger the throw.

---

## Design Detail: Shared `tmpdirTest` Vitest Fixture (H.7)

Replaces the per-file `beforeEach`/`afterEach` temp-dir boilerplate currently duplicated across 5 test files with a single shared Vitest fixture. **No new dependency added.**

### Research findings (April 2026)

Two Perplexity queries confirmed:

1. **`tmp` npm package does NOT provide materially better safety** than native `fs.mkdtempSync` + `fs.rmSync`. Both use essentially the same underlying mechanism (rimraf / native rm).
2. **Path containment IS the safety guarantee** — `mkdtempSync(path.join(os.tmpdir(), prefix))` creates a unique dir **inside** `os.tmpdir()`, so `fs.rmSync(dir, { recursive: true, force: true })` is scoped to a sandboxed location that cannot escape the OS tmpdir.
3. **Real improvement is DRY**, not library choice — extract to a shared Vitest `test.extend()` fixture reusable across all 5 test files.

### The shared fixture

```typescript
// tests/unit/workflow-discovery/test-fixtures/tmpdir-fixture.ts
import { test } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const tmpdirTest = test.extend<{ tmpdir: string }>({
  tmpdir: async ({}, use) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ahq-test-'));
    await use(dir);
    fs.rmSync(dir, { recursive: true, force: true });
  },
});
```

### Usage in test files

**Before** (current pattern in 5 test files — ~8 lines of duplicated setup each):

```typescript
let tempDir: string;
beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ahq-test-ws-'));
});
afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

it('does something', () => {
  // use tempDir
});
```

**After** (one import + per-test fixture injection):

```typescript
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';

tmpdirTest('does something', ({ tmpdir }) => {
  // use tmpdir
});
```

### Why this beats adding `tmp` or `tempy`

- **Zero new dependencies** — uses only native Node APIs + Vitest built-ins
- **Safety already guaranteed** — path is provably inside `os.tmpdir()` because `mkdtempSync` creates it there
- **Per-test scope** (not per-describe) — each `tmpdirTest(...)` call gets its own fresh temp dir, cleaned up automatically
- **No shared mutable state** — removes the `let tempDir: string` at module scope
- **Harder to accidentally skip cleanup** — fixture manages the lifecycle

### Files affected

- **New file**: `tests/unit/workflow-discovery/test-fixtures/tmpdir-fixture.ts` (~12 lines)
- **Updated** (5 test files — switch from `fs.mkdtempSync` pattern to `tmpdirTest`):
  - `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts`
  - `tests/unit/workflow-discovery/workflow-listing/ahq-workflows-impl.unit.test.ts`
  - `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts`
  - `tests/unit/workflow-discovery/workspace/ahq-file-impl.unit.test.ts`
  - `tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts`

### Interaction with 2.9 (test fixture sharing)

Refactor 2.9 shares `createTestWorkspaceFixture(rootDir: string)` between 2 test files. That fixture can be refactored to use the `tmpdirTest` pattern, unifying both refactors:

```typescript
tmpdirTest('discovers workflows across two plugins', ({ tmpdir }) => {
  createTestWorkspaceFixture(tmpdir);
  // ...
});
```

---

## Design Detail: New `AhqDirectory` + `AhqFiles` (H.6 + 2.2 + 2.8 combined)

Three approved refactors are tightly coupled and are executed together:
- **H.6** — new `AhqDirectory` interface/class, extracts the glob walker out of `AhqWorkspaceImpl`
- **2.2** — new `AhqFiles` domain collection wrapping `AhqFile[]`
- **2.8** — replace the hand-rolled glob walker with `fast-glob` library

### Interface shape

```typescript
// src/workflow-discovery/interfaces/ahq-directory.ts
export interface AhqDirectory {
  findMatchingFiles(pattern: string): AhqFiles;
}

// src/workflow-discovery/interfaces/ahq-files.ts
export interface AhqFiles {
  map<T>(fn: (file: AhqFile) => T): T[];
}
```

Design rationale:
- `findMatchingFiles(pattern)` — parameter type already signals "pattern", so the verb is short.
- `AhqFiles.map<T>()` — functional collection method. Keeps `AhqFiles` general-purpose (no coupling to workflow-domain concepts), still lets us swap the underlying representation later. Rejected alternatives: `toArray()` (exposes the raw array — class with no earned behavior) and `readAllAsWorkflows()` (couples the file-collection class to workflow knowledge).

### Glob library: `fast-glob` (sync mode)

**Why `fast-glob` not native `node:fs/promises.glob()`**: Perplexity research (April 2026) confirmed Node 22.17+ has native async glob, which would be zero-deps and future-proof. However, the native API is async-only, which would force `AhqWorkspace.findFiles()` and the whole discovery chain to become async. Human decision: prefer synchronous API + one dependency (`fast-glob`) over rippling async through the codebase today.

**Usage sketch for `AhqDirectoryImpl`:**

```typescript
// src/workflow-discovery/workspace/ahq-directory-impl.ts
import fg from 'fast-glob';
import path from 'node:path';
import { AhqDirectory } from '../interfaces/ahq-directory.js';
import { AhqFiles } from '../interfaces/ahq-files.js';
import { AhqFilesImpl } from './ahq-files-impl.js';
import { AhqFileImpl } from './ahq-file-impl.js';

export class AhqDirectoryImpl implements AhqDirectory {
  constructor(private readonly root: string) {}

  findMatchingFiles(pattern: string): AhqFiles {
    const relativePaths = fg.sync(pattern, { cwd: this.root });
    const files = relativePaths.map(p => new AhqFileImpl(path.join(this.root, p)));
    return new AhqFilesImpl(files);
  }
}
```

### `AhqWorkspaceImpl` after refactor

The hand-rolled glob walker (lines 14–19 today) is deleted. `AhqWorkspaceImpl` delegates everything to `AhqDirectoryImpl`:

```typescript
// src/workflow-discovery/workspace/ahq-workspace-impl.ts
const AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR = 'AGENTIC_HQ_WORKSPACE_ROOT';

export class AhqWorkspaceImpl implements AhqWorkspace {
  private readonly rootDirectory: AhqDirectory;

  constructor() {
    const root = process.env[AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR] ?? '';
    this.rootDirectory = new AhqDirectoryImpl(root);
  }

  findFiles(globPattern: string): AhqFiles {
    return this.rootDirectory.findMatchingFiles(globPattern);
  }
}
```

Notes:
- `AhqWorkspace.findFiles()` return type changes from `AhqFile[]` to `AhqFiles`.
- `AhqWorkspace.getRoot()` is removed from the public interface (per H.4 — was SELF-only); the env-var read happens once in the constructor.

### `AhqWorkflowsImpl` after refactor

`AhqWorkflowsImpl` now receives an `AhqFiles` and uses its `.map()` method:

```typescript
// src/workflow-discovery/workflow-listing/ahq-workflows-impl.ts
const AHQ_WORKFLOW_JSON_GLOB_PATTERN = '.agentic-hq/plugins/*/skills/*/ahq-workflow.json';

export class AhqWorkflowsImpl implements AhqWorkflows {
  private readonly workflows: AhqWorkflow[];

  constructor(workspace: AhqWorkspace) {
    const files = workspace.findFiles(AHQ_WORKFLOW_JSON_GLOB_PATTERN);
    this.workflows = files.map(file => new AhqWorkflowImpl(file));
  }
  // ...
}
```

### File locations

- `src/workflow-discovery/interfaces/ahq-directory.ts` (new)
- `src/workflow-discovery/interfaces/ahq-files.ts` (new)
- `src/workflow-discovery/workspace/ahq-directory-impl.ts` (new)
- `src/workflow-discovery/workspace/ahq-files-impl.ts` (new)

### Test files

- `tests/unit/workflow-discovery/workspace/ahq-directory-impl.unit.test.ts` (new) — covers pattern matching, `*` wildcards, nested-directory walking, empty-result case.
- `tests/unit/workflow-discovery/workspace/ahq-files-impl.unit.test.ts` (new) — covers `.map()` behavior with an empty collection, single file, multiple files.
- `tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts` — updated: `findFiles()` now returns `AhqFiles`, tests assert through `.map()` or helper that unwraps.

### Dependency addition

- Add `fast-glob` to `dependencies` in `package.json`.
- Verify types ship with the package (they do — `fast-glob` has built-in TypeScript types since v3).

---

## Design Detail: Deleting `AhqFile.getPath()` + Test Rewrites (H.2)

`AhqFile.getPath()` is confirmed TEST-ONLY (the audit found zero production callers — only 2 test assertions). Per `feedback_no_test_only_production_methods.md`, test-only production methods are a code smell. This section documents the full delete + test-rewrite plan.

### Interface and class changes

- **`src/workflow-discovery/interfaces/ahq-file.ts`** — remove the `getPath(): string;` method declaration.
- **`src/workflow-discovery/workspace/ahq-file-impl.ts`** — remove the `getPath()` method body. **Keep** the `path` value as a private field: `AhqFileImpl.readContent()` internally needs it to read the file via `fs.readFileSync(this.path, 'utf-8')`.

### Test rewrites

Both existing assertions on `getPath()` are replaced with behavior-driven tests that exercise the concept through the production-facing API (`readContent()`). This proves the path was stored correctly, but without exposing `getPath()` on the interface.

**`tests/unit/workflow-discovery/workspace/ahq-file-impl.unit.test.ts` (line 26):**
- **Before**: `expect(file.getPath()).toBe(tempFilePath);`
- **After**: Create a real temp file with known contents (e.g. `'hello ahq'`), construct `AhqFileImpl` with that path, call `readContent()`, assert returned string equals the known contents. This verifies the path was stored and used correctly via production behavior.

**`tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts` (line 53):**
- **Before**: Calls `.map(f => f.getPath())` on the results of `findFiles()` to assert paths match expected glob results.
- **After**: Create fixture files with unique contents (e.g. `'alpha-content'`, `'beta-content'`, `'gamma-content'`), run `findFiles()`, then assert the set of `files.map(f => f.readContent())` matches the expected set of contents. This verifies the same thing (findFiles returned the right files) through the production API.

### Test impact

Two test files rewritten (1 assertion each). All other tests unaffected. No production code callers to update.

---

## Design Detail: Renaming `display*` Methods (H.3 extended)

H.3 renames the two `AhqWorkflow` / `AhqWorkflows` methods that return strings. This section extends H.3 to cover the third `display*` method — `WorkflowSearchResults.displayToUser()` — which has the same underlying issue.

### Rename summary

| Before | After |
|---|---|
| `AhqWorkflow.displayYourself()` | `AhqWorkflow.getWorkflowListingEntryString()` |
| `AhqWorkflows.displayYourselves()` | `AhqWorkflows.getWorkflowListingEntriesString()` |
| `WorkflowSearchResults.displayToUser()` | `WorkflowSearchResults.getWorkflowsListingString()` |

**Rationale** (per human): _"We're getting the string, we should rename based on what I said. If we were telling the thing to print to console, displayToUser would be correct. But we aren't."_

All three methods return strings that the caller prints — so all three should be getter-named. This keeps a clean boundary: **subsystem's job = produce the string; CLI command layer's job = print it.**

### Test-file impact

- `ahq-workflow-impl.unit.test.ts` — rename `displayYourself()` → `getWorkflowListingEntryString()` in assertions + test-description strings.
- `ahq-workflows-impl.unit.test.ts` — rename `displayYourselves()` → `getWorkflowListingEntriesString()` in assertions + test-description strings.
- `workflow-search-results-impl.unit.test.ts` — rename `displayToUser()` → `getWorkflowsListingString()` in assertions + test-description strings. Also fixes the stale doc-comment from Refactor 1.6 in the same motion (the fixed comment will reference `getWorkflowListingEntriesString()`).

---

## Project Design Requirements Compliance Audit

**Design Requirements File**: `docs/dev/project-design-requirements.md`

| # | Requirement | Evidence (files, classes, patterns) | Status | Refactoring Proposal (if needed) |
|---|-------------|-------------------------------------|--------|----------------------------------|
| DR.1 | Every concept gets a class/interface pair | 13 concepts, 13 interfaces in `src/workflow-discovery/interfaces/`, 13 `*Impl` classes in `workflow/`, `workflow-listing/`, `workspace/`. WorkflowShortName, WorkflowDescription, ExampleParameters, PluginId, SkillId, FullClaudeSkillCommand, ExampleCommand, AhqWorkflow, AhqWorkflows, AhqFile, JsonFile, AhqWorkspace, WorkflowSearchResults. | MET | — |
| DR.2 | Primitives wrapped immediately as soon as they are parsed | `AhqWorkflowImpl` wraps each raw string from `jsonFile.get()` in a fresh value object on every getter call (`new WorkflowShortNameImpl(...)`, `new WorkflowDescriptionImpl(...)` etc. at line 30-46 of `ahq-workflow-impl.ts`). | MET | — |
| DR.3 | Objects stay as typed objects until they reach the output boundary (`toString()` at the edge) | Value-object interfaces (`WorkflowShortName` etc.) defined as `toString(): string`. Called at the output boundary in `AhqWorkflowImpl.displayYourself()` (line 49) and `FullClaudeSkillCommandImpl.toString()`, `ExampleCommandImpl.toString()`. Value objects are passed by interface throughout. | MET | — |
| DR.4 | "Tell don't ask" / push work into objects | `WorkflowSearchResultsImpl.displayToUser()` tells `AhqWorkflows.displayYourselves()` which tells each `AhqWorkflow.displayYourself()`. No state extraction across boundaries. | MET | — |
| DR.5 | `*Impl` naming convention (project override of the `Default*` convention, per user's memory) | All 13 concrete classes end in `Impl` (e.g. `WorkflowShortNameImpl`, `AhqWorkflowsImpl`, `JsonFileImpl`). | MET | — |
| DR.6 | Switchability — "could a third party replace any concrete class easily?" | The three hard-wired `new` calls (`new JsonFileImpl(file)` in `AhqWorkflowImpl`, `new AhqWorkflowImpl(f)` in `AhqWorkflowsImpl`, `new AhqWorkspaceImpl()` + `new AhqWorkflowsImpl(...)` in `WorkflowSearchResultsImpl`) do currently prevent third-party swap-in via construction. **However** (per human direction): these `new` calls will be replaced when the project adopts the "classwitch" switchability framework in a later Jira. At that point, all three sites become framework-resolved and switchability becomes inherent. The current hard-wiring is a temporary bridge, not a design flaw to fix in-this-Jira. | MET | — |
| DR.7 | Minimal state — avoid caching / use delegation | `AhqWorkflowImpl` stores only `jsonFile: JsonFile`, creates value objects on demand (line 25, 30-46). `AhqWorkflowsImpl` stores `workflows: AhqWorkflow[]` at construction — the discovered list is stored once, which is unavoidable. `WorkflowSearchResultsImpl` stores `workflows: AhqWorkflows` only. `JsonFileImpl` stores the parsed JSON object once (lines 5-12) — acceptable since parsing is an expensive one-time operation and re-parsing on every `get()` would violate readability. | MET | — |
| DR.8 | Data Dictionary + English Description in planning | `03-green-phase-implementation-plan-copy.md` contains both a Data Dictionary table (13 concepts) and an English Language Description paragraph (class names **bold**, verbs *italic*). | MET | — |
| DR.9 | Balance OO purity with readability — not every tiny op gets a class | Simple value objects are thin; `AhqWorkflow`/`AhqWorkflows`/`WorkflowSearchResults` are the aggregation layers where work happens. `displayYourself()` is kept as one template-literal string rather than fragmenting into sub-classes. | MET | — |
| DR.10 | "If it's just a String, it's encapsulated in a class as soon as it's parsed" | 5 string fields from JSON → 5 value-object wrappers at getter-call time. Note: `AhqWorkspace.findFiles()` takes a `globPattern: string` parameter (not a wrapped `GlobPattern` value object) — but this is an internal API call made with a hard-coded string constant, arguably not in violation since the primitive never roams. | MET (with borderline note) | — |
| DR.11 | "I want a complete audit done at the end of this plan and of the implementation of what parts people could switch out" | See DR.6 above — the switchability audit identifies 3 hard-wired constructor calls that reduce switchability. Every other class (value objects, AhqFile, JsonFile, AhqWorkspace) IS switchable because consumers receive it through an interface or construct it themselves. | MET (this audit satisfies it) | — |

**Summary**: 11 of 11 requirements MET, 0 PARTIALLY MET, 0 NOT MET, 0 NOT APPLICABLE

> **DR.6 note**: Per human direction, DR.6 is considered MET — the hard-wired `new` calls in three constructors are a temporary bridge and will be replaced when the project adopts the "classwitch" switchability framework in a later Jira. At that point, all three sites become framework-resolved and switchability becomes inherent. Refactor 2.6 is correspondingly REJECTED in this Jira.
---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 10 |
| Tier 2 AI-Identified (Pending review) | 9 |
| Tier 2 Human-Identified (Pending discussion) | 7 |
| Design Requirements Audit (items needing action) | 1 (Refactor 2.6 — already in Tier 2 AI-Identified) |
| **Total** | 26 (10 auto + 16 pending) |

---

## Agreed Refactors Discussion Notes

### 2.1 — Dedicated `json-file-impl.unit.test.ts`
No checkbox was marked in human review. AI recommended APPROVE (compliant with `feedback_unit_test_file_per_class.md`, untested edge cases). **Decision: APPROVE** — human confirmed.

### 2.3 + H.1 (combined) — `createFrom` factories + rename `JsonFile` → `WorkflowMetadata`
Major discussion. Human approved both but extended the scope: rename `JsonFile` interface to `WorkflowMetadata` (new domain-named contract) and create a new class `JsonFileWorkflowMetadata extends JsonFileImpl implements WorkflowMetadata`. `WorkflowMetadata extends JsonFile` (same signature) which means `JsonFileWorkflowMetadata` satisfies `WorkflowMetadata` automatically via inherited `get()`.

The composite `createFrom` pattern is fully documented in **"Design Detail: Composite `createFrom` Pattern"** above — three layers (leaf value objects own their field id; composites delegate to children; `AhqWorkflowImpl` collapses to pure delegation). Field-id constants (5 of them) move out of `AhqWorkflowImpl` into their respective value-object files.

**Decision: EXECUTE (modified)** — includes the WorkflowMetadata rename.

### 2.4 — Remove eager `shortId` validation hack
Pre-marked APPROVE. No discussion needed. **Decision: EXECUTE** — drop line 28 of `ahq-workflow-impl.ts`; rewrite the "throws on missing shortId" test to call `workflow.getShortName()` instead.

### 2.5 — Value-object validation duplication
Pre-marked REJECT. **Decision: SKIP** — 4 × 10 trivial lines is acceptable as-is.

### 2.6 — Switchability / dependency injection
Pre-marked REJECT. Human rationale: "When we move to using 'classwitch' framework we'll be replacing 'new' calls with calls to the framework, and those concrete implementations will then become 'switchable'." **Decision: SKIP** — defer to classwitch-adoption Jira. DR.6 updated to MET accordingly.

### 2.7 — `AhqFileImpl` whitespace validation
Pre-marked REJECT. **Decision: SKIP** — unrequested work.

### H.2 — Delete `AhqFile.getPath()`
Confirmed TEST-ONLY via the audit. Human happy with the test-rewrite approach (assert via `readContent()` with unique fixture contents instead of path equality). **Decision: EXECUTE** — full details in **"Design Detail: Deleting `AhqFile.getPath()` + Test Rewrites (H.2)"** above.

### H.3 — Rename `display*` methods (extended)
Human chose consistent rename. All three methods renamed to `get*String()` getters (including `displayToUser()` → `getWorkflowsListingString()`). Full details in **"Design Detail: Renaming `display*` Methods (H.3 extended)"** above. **Decision: EXECUTE (modified — extended to cover `displayToUser()`)**.

### H.4 — Remove `AhqWorkspace.getRoot()` from interface
Pre-approved. Confirmed SELF-only via the audit. **Decision: EXECUTE** — inline the env-var read into the constructor (per H.6 design where the root is only used to construct `AhqDirectoryImpl`); remove `getRoot()` from the interface; rewrite the one external test that asserts on it to verify behavior through `findFiles()`.

### H.5 — Update `04a-jira-refactor-analysis.md` command file
Pre-approved. **Decision: EXECUTE** — add "Audit To Confirm Methods Used In Production Code (Not Just Tests)" as a standard step in the 04a command file, after the Magic Constants Audit. Future Jiras will automatically flag test-only methods.

### H.6 + 2.2 + 2.8 (combined) — `AhqDirectory` + `AhqFiles` + glob library
Three approved refactors executed together. Full details in **"Design Detail: New `AhqDirectory` + `AhqFiles` (H.6 + 2.2 + 2.8 combined)"** above. Key decisions reached in discussion:
- **API method name**: `findMatchingFiles(pattern)` (shorter than human's original `findMatchingFilesUsingPattern` — parameter type already signals "pattern").
- **`AhqFiles` API**: option (b) — `.map<T>(fn)` functional method. Keeps `AhqFiles` general-purpose; avoids coupling to workflow-domain concepts.
- **Glob library**: `fast-glob` (sync mode) via `fg.sync()`. Perplexity research flagged Node 22's native `fs/promises.glob()` as zero-deps + future-proof, but native is async-only which would ripple async through the whole discovery chain. Human chose `fast-glob` to keep the codebase synchronous today.
- **Test file**: new `tests/unit/workflow-discovery/workspace/ahq-directory-impl.unit.test.ts`.

**Decision: EXECUTE (modified)** — unified implementation per design detail.

### H.7 — Temp-dir test fixture
Two Perplexity queries investigated whether `tmp` / `tempy` npm packages provide better safety than native `fs.mkdtempSync` + `fs.rmSync`. Answer: **no** — path containment via `path.join(os.tmpdir(), prefix)` is already safe because `mkdtempSync` creates the dir inside the OS tmpdir. The real win is DRY across 5 test files via a shared Vitest `test.extend()` fixture. Full details in **"Design Detail: Shared `tmpdirTest` Vitest Fixture (H.7)"** above.

**Decision: EXECUTE (modified)** — shared `tmpdirTest` fixture, no new dependency.

### 2.9 — Test fixture sharing (between 2 test files)
Pre-marked APPROVE. Unified with H.7 — the shared `createTestWorkspaceFixture(rootDir)` becomes a helper called from tests that use `tmpdirTest`. **Decision: EXECUTE**.

### Previous-phase items (P.1–P.6)
- **P.1** = 2.2 (AhqFiles wrapper) — executed via H.6 combined refactor.
- **P.2** = 2.1 (json-file-impl test) — EXECUTE.
- **P.3** = 2.3 (createFrom factory) — executed via H.1 combined refactor.
- **P.4** = 2.4 (shortId eager validation) — EXECUTE.
- **P.5** (exampleParameters leading space) — already done in GREEN. SKIP.
- **P.6** (WorkflowVersion/WorkflowAuthor) — out of scope by design. SKIP.

---

## Agreed Refactors Summary Table

Single source of truth for the 04b execute phase. For detail on any item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above and/or the relevant "Design Detail" section.

| # | Refactor | Decision | Notes |
|---|----------|----------|-------|
| **Tier 1 (Auto-approved)** | | | |
| 1.1 | Extract `AGENTIC_HQ_WORKSPACE_ROOT` env var name constant | EXECUTE | — |
| 1.2 | Extract glob pattern constant `AHQ_WORKFLOW_JSON_GLOB_PATTERN` | EXECUTE | Lives in `ahq-workflows-impl.ts` |
| 1.3 | Extract `'Available workflows:\n\n'` header constant | EXECUTE | — |
| 1.4 | Extract `'agentic-hq '` command-name prefix constant | EXECUTE | — |
| 1.5 | Extract indent + `'\nExample: '` prefix constants | EXECUTE | — |
| 1.6 | Fix stale `displayThemselves` doc comment | EXECUTE (modified) | Updated comment will reference `getWorkflowListingEntriesString()` per H.3 |
| 1.7 | Add SRP-format TSDoc to all 26 workflow-discovery files | EXECUTE | Format: `SRP Does:` / `SRP Knows About:` / `SRP Knows Nothing About:` |
| 1.8 | Remove `writeTempJsonPath`/`writeTempFilePath` test-helper duplication | EXECUTE | Merge into single helper |
| 1.9 | Simplify `ExampleCommandImpl.toString()` conditional | EXECUTE | — |
| 1.10 | Remove redundant `.toString()` calls in template literal | EXECUTE | In displayYourself → `getWorkflowListingEntryString` (H.3) |
| **Tier 2 AI-Identified** | | | |
| 2.1 | Dedicated `json-file-impl.unit.test.ts` | EXECUTE | New test file |
| 2.2 | `AhqFiles` domain collection | EXECUTE (modified) | Unified with H.6; API is `.map<T>()` |
| 2.3 | `createFrom(jsonFile)` factory pattern | EXECUTE (modified) | Unified with H.1; also renames `JsonFile` → `WorkflowMetadata` |
| 2.4 | Remove eager `shortId` validation hack | EXECUTE | Rewrite the test to call `getShortName()` |
| 2.5 | Value-object validation duplication | SKIP | 4 × 10 trivial lines acceptable as-is |
| 2.6 | Switchability / constructor DI | SKIP | Defer to classwitch-adoption Jira |
| 2.7 | `AhqFileImpl` whitespace validation | SKIP | Unrequested work |
| 2.8 | Replace hand-rolled glob walker | EXECUTE (modified) | Unified with H.6; `fast-glob` sync mode |
| 2.9 | Test fixture sharing between 2 files | EXECUTE | Unified with H.7 fixture pattern |
| **Tier 2 Human-Identified** | | | |
| H.1 | Recursive `createFrom` composition | EXECUTE | Unified with 2.3 |
| H.2 | Delete `AhqFile.getPath()` | EXECUTE | Rewrite 2 tests to assert via `readContent()` |
| H.3 | Rename `display*` methods | EXECUTE (modified) | Extended to all 3 methods including `displayToUser()` → `getWorkflowsListingString()` |
| H.4 | Remove `AhqWorkspace.getRoot()` from interface | EXECUTE | Inline env-var read into constructor |
| H.5 | Add "Audit To Confirm Methods Used In Production Code (Not Just Tests)" step to 04a command file | EXECUTE | Meta-change to the workflow command file |
| H.6 | New `AhqDirectory` interface/class | EXECUTE | Unified with 2.2 + 2.8 |
| H.7 | Temp-dir auto-cleanup | EXECUTE (modified) | Shared `tmpdirTest` Vitest fixture, NO new dependency |
| **Previous-Phase (P.x)** | | | |
| P.1 | AhqFiles wrapper | DUP of 2.2 | — |
| P.2 | json-file-impl test | DUP of 2.1 | — |
| P.3 | createFrom factory | DUP of 2.3 | — |
| P.4 | shortId eager validation | DUP of 2.4 | — |
| P.5 | exampleParameters leading space | SKIP (already done) | — |
| P.6 | WorkflowVersion/WorkflowAuthor | SKIP (by design) | Out of scope per AI summary |

### Summary of outcomes

| Category | Count |
|---|---|
| Tier 1 EXECUTE | 10 |
| Tier 2 AI-Identified EXECUTE | 6 |
| Tier 2 AI-Identified SKIP | 3 |
| Tier 2 Human-Identified EXECUTE | 7 |
| **Total EXECUTE items** | **23** |
| **Total SKIP items** | **3 + 2 (P.5/P.6)** |

### New dependency

- Add `fast-glob` to `dependencies` in `package.json` (per H.6 / 2.8).

### New files (summary)

**Source files (6 new):**
- `src/workflow-discovery/interfaces/workflow-metadata.ts` (2.3/H.1)
- `src/workflow-discovery/interfaces/ahq-directory.ts` (H.6)
- `src/workflow-discovery/interfaces/ahq-files.ts` (2.2)
- `src/workflow-discovery/workspace/json-file-workflow-metadata.ts` (2.3/H.1)
- `src/workflow-discovery/workspace/ahq-directory-impl.ts` (H.6)
- `src/workflow-discovery/workspace/ahq-files-impl.ts` (2.2)

**Test files (3 new):**
- `tests/unit/workflow-discovery/workspace/json-file-impl.unit.test.ts` (2.1)
- `tests/unit/workflow-discovery/workspace/ahq-directory-impl.unit.test.ts` (H.6)
- `tests/unit/workflow-discovery/workspace/ahq-files-impl.unit.test.ts` (2.2)
- `tests/unit/workflow-discovery/workspace/json-file-workflow-metadata.unit.test.ts` (2.3/H.1) — thin wrapper test covering the `extends JsonFileImpl` override class

**Test fixture (1 new):**
- `tests/unit/workflow-discovery/test-fixtures/tmpdir-fixture.ts` (H.7)

### Meta-change (outside src/ and tests/)

- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/04a-jira-refactor-analysis.md` — add "Audit To Confirm Methods Used In Production Code (Not Just Tests)" step (H.5)

### Method/interface renames (summary)

- `JsonFile` → `WorkflowMetadata` (new interface, `JsonFile` remains as its supertype)
- `AhqWorkflow.displayYourself()` → `AhqWorkflow.getWorkflowListingEntryString()`
- `AhqWorkflows.displayYourselves()` → `AhqWorkflows.getWorkflowListingEntriesString()`
- `WorkflowSearchResults.displayToUser()` → `WorkflowSearchResults.getWorkflowsListingString()`

### Method/interface deletions

- `AhqFile.getPath()` — removed from interface; `path` field kept private in `AhqFileImpl`
- `AhqWorkspace.getRoot()` — removed from interface; env-var read moves to constructor

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

Human review and discussion completed on 2026-04-05.

---

## Additional Refactors (Discovered During 04b Execution)

These refactors were not in the original analysis. They were identified while executing 04b, discussed with the human, and approved. Documented here for traceability.

### Additional Refactor A.1: Make value-object constructors private

**Source**: Discovered while executing Phase 7 (createFrom pattern). With the new `createFrom(metadata)` static factories, no production code calls the constructors directly — only tests did. The public constructor became a test-only entry point (violates `feedback_no_test_only_production_methods.md`).
**Description**: Mark the constructors of all 7 value-object `*Impl` classes `private` with a `// Use createFrom(metadata) to construct from workflow metadata.` comment. Rewrite the 7 unit test files to construct via `createFrom(stubMetadata)` instead of `new Impl(string)`. Introduce a shared `stubWorkflowMetadata()` test helper.
**Files affected**: 7 value-object impl files + 7 test files + 1 new `tests/unit/workflow-discovery/test-fixtures/stub-workflow-metadata.ts`.
**Decision**: **EXECUTE** — human approved during execution.

---

### Additional Refactor A.2: Remove test-only getters from `AhqWorkflow` interface

**Source**: Discovered while executing Phase 9 (SRP TSDoc). Reviewing the `AhqWorkflow` interface revealed that `getShortName()`, `getDescription()`, `getFullClaudeSkillCommand()`, and `getExampleCommand()` are called only inside `AhqWorkflowImpl.getWorkflowListingEntryString()` in production code — the tests are the only external callers. Violates `feedback_no_test_only_production_methods.md`.
**Description**: Remove the 4 getters from the `AhqWorkflow` interface so it only exposes `getWorkflowListingEntryString()`. Make the 4 getters `private` in `AhqWorkflowImpl`. Update `ahq-workflow-impl.unit.test.ts` to verify behavior only through `getWorkflowListingEntryString()` (consolidating redundant happy-path tests).
**Files affected**: `src/workflow-discovery/interfaces/ahq-workflow.ts`, `src/workflow-discovery/workflow/ahq-workflow-impl.ts`, `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts`.
**Decision**: **EXECUTE** — human approved during execution.

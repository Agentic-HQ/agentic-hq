# GREEN Phase Plan: AHQ-104 Unit Tests

## Context

AHQ-104 replaces the hardcoded `DEMO_SKILLS` array with dynamic workflow discovery from `ahq-workflow.json` files. The RED phase created 12 unit test files (34 tests) in `tests/unit/workflow-discovery/{workflow,workflow-listing,workspace}/`. All 12 files currently fail with compilation errors because none of the 24 source files exist.

This GREEN phase creates the **minimum** set of interfaces + Impl classes to make all 12 unit test files pass. No wiring into the CLI yet — that's a later phase. No e2e work yet — that's the next test-type cycle.

---

## Jira Requirements (Numbered)

1. **Create `ahq-workflow.json` metadata files** → N/A for unit tests (tests use temp fixtures). Real metadata files will be needed for e2e phase.
2. **New classes go in `src/workflow-discovery/`** → [Step 2: Create source directory structure]
3. **Interfaces in `src/workflow-discovery/interfaces/`** → [Step 2]
4. **Impls grouped by entity: `workflow/`, `workflow-listing/`, `workspace/`** → [Step 2]
5. **Keep current `agentic-hq list` output identical** → Deferred to e2e phase. Unit tests only verify that each value object / entity behaves correctly.
6. **Each concept is a class + interface pair** → [Steps 3-14]
7. **Strings wrapped immediately into value objects** → [Steps 3-7: value objects; Step 10: AhqWorkflow wraps on access]
8. **Minimal state, delegation, "tell don't ask"** → [Step 10: AhqWorkflowImpl stores raw JSON only; Step 12: AhqWorkflowsImpl delegates displayYourselves; Step 13: WorkflowSearchResultsImpl delegates to AhqWorkflows]
9. **`Default*` → `*Impl` naming (per human memory)** → All 12 concrete classes end in `Impl`
10. **No "er" suffix classes (no Parser/Discoverer/Formatter)** → AhqWorkflowImpl reads+parses itself; AhqWorkflowsImpl finds+compiles itself
11. **Test via interface, construct via Impl** → Tests already written this way; interfaces must define the contract the tests exercise
12. **Out of Scope: current-workspace search, new formatting, plugin-dir resolution** → Not touched

---

## Project Design Requirements Compliance

| # | Design Requirement | Plan Section Addressing It | Notes |
|---|-------------------|---------------------------|-------|
| D.1 | Class/interface pair for each concept | Steps 3-14: 13 concepts, 13 interfaces, 13 Impls | 12 from parent Jira + JsonFile (new concept extracted during GREEN) |
| D.2 | Primitives wrapped immediately | Step 10: AhqWorkflowImpl wraps strings into value objects on every getter call | Raw JSON stored; value objects created on-demand |
| D.3 | Minimal state / avoid caching | Step 9b: new JsonFile/JsonFileImpl; Step 10: AhqWorkflowImpl stores only a JsonFile reference, calls jsonFile.get(FIELD_ID) on every getter | Delegates JSON access — no stored parsed data in AhqWorkflowImpl |
| D.4 | Tell-don't-ask, delegation | Steps 12-13: displayYourselves() tells each workflow to displayYourself(); displayToUser() tells AhqWorkflows to displayYourselves() | No state extraction |
| D.5 | `*Impl` naming (per human memory `feedback_impl_suffix_naming.md`) | All 12 classes | WorkflowShortNameImpl not DefaultWorkflowShortName |
| D.6 | Entity-based directory structure (per human memory `feedback_directory_structure_by_entity.md`) | Step 2: `workflow/`, `workflow-listing/`, `workspace/` dirs | Not value-objects/, domain/ |
| D.7 | Test via interface (per human memory `feedback_test_via_interface.md`) | Already done in RED tests | Impls in plan use matching constructor signatures |
| D.8 | Data Dictionary + English Description | See section below | Concepts → class/interface names |

### Data Dictionary

| Concept | Interface | Impl Class | File Location |
|---------|-----------|------------|---------------|
| A JSON file (parsed, queryable) | `JsonFile` | `JsonFileImpl` | `src/workflow-discovery/{interfaces,workspace}/` |
| Workflow short name | `WorkflowShortName` | `WorkflowShortNameImpl` | `src/workflow-discovery/{interfaces,workflow}/` |
| Workflow description | `WorkflowDescription` | `WorkflowDescriptionImpl` | `src/workflow-discovery/{interfaces,workflow}/` |
| Example CLI parameters | `ExampleParameters` | `ExampleParametersImpl` | `src/workflow-discovery/{interfaces,workflow}/` |
| Plugin identifier | `PluginId` | `PluginIdImpl` | `src/workflow-discovery/{interfaces,workflow}/` |
| Skill identifier | `SkillId` | `SkillIdImpl` | `src/workflow-discovery/{interfaces,workflow}/` |
| Full Claude skill command | `FullClaudeSkillCommand` | `FullClaudeSkillCommandImpl` | `src/workflow-discovery/{interfaces,workflow}/` |
| Example `agentic-hq <x>` command | `ExampleCommand` | `ExampleCommandImpl` | `src/workflow-discovery/{interfaces,workflow}/` |
| A single AHQ workflow | `AhqWorkflow` | `AhqWorkflowImpl` | `src/workflow-discovery/{interfaces,workflow}/` |
| File on disk | `AhqFile` | `AhqFileImpl` | `src/workflow-discovery/{interfaces,workspace}/` |
| The AHQ workspace | `AhqWorkspace` | `AhqWorkspaceImpl` | `src/workflow-discovery/{interfaces,workspace}/` |
| Set of discovered workflows | `AhqWorkflows` | `AhqWorkflowsImpl` | `src/workflow-discovery/{interfaces,workflow-listing}/` |
| Overall search result for display | `WorkflowSearchResults` | `WorkflowSearchResultsImpl` | `src/workflow-discovery/{interfaces,workflow-listing}/` |

### English Language Description

When a caller *creates* a **WorkflowSearchResultsImpl**, it *creates* an **AhqWorkspaceImpl** (which *resolves* its root from `AGENTIC_HQ_WORKSPACE_ROOT`) and *creates* an **AhqWorkflowsImpl** by *passing* the **AhqWorkspace**. The **AhqWorkflowsImpl** *asks* the **AhqWorkspace** to *findFiles* matching `.agentic-hq/plugins/*/skills/*/ahq-workflow.json`, *receives* a list of **AhqFile** objects, and *creates* an **AhqWorkflowImpl** from each **AhqFile**. Each **AhqWorkflowImpl** *creates* a **JsonFileImpl** from its **AhqFile** (which *reads* and *parses* the JSON once) and *stores* only that **JsonFile** reference. When `displayToUser()` is called, **WorkflowSearchResultsImpl** *prints* a header and *tells* the **AhqWorkflows** to *displayYourselves*, which *tells* each **AhqWorkflow** to *displayYourself*. Each **AhqWorkflow**, when told to *displayYourself*, *asks* its **JsonFile** to *get* each field value and wraps them in **WorkflowShortName**, **FullClaudeSkillCommand**, **WorkflowDescription**, and **ExampleCommand** value objects on demand — each *renders* itself via `toString()`.

---

## Step 0: Copy This Approved Plan

**Copy this approved plan** to `docs/jira-docs/AHQ-104/workflow-files/unit-test-files/03-green-phase-implementation-plan-copy.md` **before proceeding with implementation.**

---

## Step 1: Pre-flight Checks (Read-Only)

- Verify no source file in `src/workflow-discovery/` exists yet (expected: directory doesn't exist)
- Confirm test command: `pnpm test` (runs all unit tests via vitest)
- Confirm working dir: `/Users/stevepersonal/dev/agentic-hq/agentic-hq`

---

## Step 2: Create Source Directory Structure

```
src/workflow-discovery/
  interfaces/
  workflow/
  workflow-listing/
  workspace/
```

---

## Step 3: Value Object — WorkflowShortName

**Interface** `src/workflow-discovery/interfaces/workflow-short-name.ts`:
```typescript
export interface WorkflowShortName {
  toString(): string;
}
```

**Impl** `src/workflow-discovery/workflow/workflow-short-name-impl.ts`:
```typescript
import type { WorkflowShortName } from '../interfaces/workflow-short-name.js';

export class WorkflowShortNameImpl implements WorkflowShortName {
  private readonly value: string;
  constructor(value: string) {
    if (value.trim() === '') {
      throw new Error('WorkflowShortName cannot be empty or whitespace-only');
    }
    this.value = value;
  }
  toString(): string { return this.value; }
}
```

Tests validated: toString returns value; throws on empty; throws on whitespace-only.

---

## Step 4: Value Object — WorkflowDescription

Same shape as Step 3, class `WorkflowDescriptionImpl` implementing `WorkflowDescription`.

---

## Step 5: Value Object — ExampleParameters

Same shape BUT **empty string IS allowed** (workflows with no params).

```typescript
export class ExampleParametersImpl implements ExampleParameters {
  constructor(private readonly value: string) {} // no validation
  toString(): string { return this.value; }
}
```

Tests validated: toString returns value (including empty string).

---

## Step 6: Value Object — PluginId, SkillId

Same shape as Step 3 (reject empty/whitespace), two separate classes:
- `PluginIdImpl` implementing `PluginId`
- `SkillIdImpl` implementing `SkillId`

---

## Step 7: Composite — FullClaudeSkillCommand

**⚠️ TEST FILE UPDATES REQUIRED** (rename `SkillFullClaudeCommand` → `FullClaudeSkillCommand` for natural English reading):
1. Rename file: `tests/unit/workflow-discovery/workflow/skill-full-claude-command-impl.unit.test.ts` → `tests/unit/workflow-discovery/workflow/full-claude-skill-command-impl.unit.test.ts`
2. In the renamed file: update all `SkillFullClaudeCommand` → `FullClaudeSkillCommand`, `SkillFullClaudeCommandImpl` → `FullClaudeSkillCommandImpl`, and import paths
3. In `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts`: rename `getSkillFullClaudeCommand()` → `getFullClaudeSkillCommand()`

**Interface**:
```typescript
export interface FullClaudeSkillCommand {
  toString(): string;
}
```

**Impl** `src/workflow-discovery/workflow/full-claude-skill-command-impl.ts`:
```typescript
export class FullClaudeSkillCommandImpl implements FullClaudeSkillCommand {
  constructor(private readonly pluginId: PluginId, private readonly skillId: SkillId) {}
  toString(): string {
    return `/${this.pluginId.toString()}:${this.skillId.toString()}`;
  }
}
```

Test validated: `new FullClaudeSkillCommandImpl(PluginIdImpl('agentic-hq-demos-plugin'), SkillIdImpl('math-workflow')).toString()` → `/agentic-hq-demos-plugin:math-workflow`.

---

## Step 8: Composite — ExampleCommand

**⚠️ TEST FILE UPDATES REQUIRED** (remove leading space from `exampleParameters` so the space lives in the code that joins them, not in the data):

1. `tests/unit/workflow-discovery/workflow/example-parameters-impl.unit.test.ts`:
   - `new ExampleParametersImpl(' -- --input-number=54321')` → `new ExampleParametersImpl('-- --input-number=54321')`
   - `expect(params.toString()).toBe(' -- --input-number=54321')` → `expect(params.toString()).toBe('-- --input-number=54321')`
2. `tests/unit/workflow-discovery/workflow/example-command-impl.unit.test.ts`:
   - `new ExampleParametersImpl(' -- --input-number=54321')` → `new ExampleParametersImpl('-- --input-number=54321')`
3. `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts`:
   - `exampleParameters: ' -- --input-number=54321'` → `exampleParameters: '-- --input-number=54321'`
4. `tests/unit/workflow-discovery/workflow-listing/ahq-workflows-impl.unit.test.ts`:
   - `exampleParameters: " -- --string-reverse='hello'"` → `exampleParameters: "-- --string-reverse='hello'"`
   - `exampleParameters: ' -- --input-number=54321'` → `exampleParameters: '-- --input-number=54321'`
5. `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts`:
   - Same two updates as above

**Impl**:
```typescript
export class ExampleCommandImpl implements ExampleCommand {
  constructor(private readonly shortName: WorkflowShortName, private readonly params: ExampleParameters) {}
  toString(): string {
    const paramsStr = this.params.toString();
    const separator = paramsStr === '' ? '' : ' ';
    return `agentic-hq ${this.shortName.toString()}${separator}${paramsStr}`;
  }
}
```

Tests validated: with params (`'-- --input-number=54321'`) → `agentic-hq math -- --input-number=54321`; no params (`''`) → `agentic-hq create-workflow` (no trailing space).

---

## Step 9: AhqFile

**Interface** `src/workflow-discovery/interfaces/ahq-file.ts`:
```typescript
export interface AhqFile {
  getPath(): string;
  readContent(): string;
}
```

**Impl** `src/workflow-discovery/workspace/ahq-file-impl.ts`:
```typescript
import * as fs from 'node:fs';

export class AhqFileImpl implements AhqFile {
  constructor(private readonly path: string) {
    if (path === '') {
      throw new Error('AhqFile path cannot be empty');
    }
  }
  getPath(): string { return this.path; }
  readContent(): string { return fs.readFileSync(this.path, 'utf-8'); }
}
```

Tests validated: getPath returns path; readContent returns content; throws on empty path.

---

## Step 9b: JsonFile (parsed, queryable JSON file)

**New concept extracted per human feedback**: delegates JSON parsing and field access so `AhqWorkflowImpl` doesn't store parsed data.

**Interface** `src/workflow-discovery/interfaces/json-file.ts`:
```typescript
export interface JsonFile {
  get(fieldId: string): string;
}
```

**Impl** `src/workflow-discovery/workspace/json-file-impl.ts`:
- Constructor takes an `AhqFile`. Reads its content, parses JSON once (throws `Invalid JSON` on parse failure), stores the parsed object.
- `get(fieldId)` returns the string value at that top-level key. Throws if the field is missing or non-string. Empty string is valid.

```typescript
import type { AhqFile } from '../interfaces/ahq-file.js';
import type { JsonFile } from '../interfaces/json-file.js';

export class JsonFileImpl implements JsonFile {
  private readonly data: Record<string, unknown>;
  constructor(file: AhqFile) {
    const content = file.readContent();
    try {
      this.data = JSON.parse(content) as Record<string, unknown>;
    } catch {
      throw new Error('Invalid JSON');
    }
  }
  get(fieldId: string): string {
    const value = this.data[fieldId];
    if (typeof value !== 'string') {
      throw new Error(`Missing required field: ${fieldId}`);
    }
    return value;
  }
}
```

**No direct unit test file in GREEN** — behavior is fully exercised through `AhqWorkflowImpl` tests (invalid JSON → throws; missing `shortId` → throws). Add to REFACTOR list: dedicated `json-file-impl.unit.test.ts`.

---

## Step 10: AhqWorkflow (the core entity)

**Interface** `src/workflow-discovery/interfaces/ahq-workflow.ts`:
```typescript
export interface AhqWorkflow {
  getShortName(): WorkflowShortName;
  getDescription(): WorkflowDescription;
  getFullClaudeSkillCommand(): FullClaudeSkillCommand;
  getExampleCommand(): ExampleCommand;
  displayYourself(): string;
}
```

**Impl** `src/workflow-discovery/workflow/ahq-workflow-impl.ts`:
- Constructor takes an `AhqFile`. Creates a `JsonFileImpl` from it (throws `Invalid JSON` via JsonFileImpl if parse fails).
- **Stores only the `JsonFile` reference** — no cached data or value objects.
- Each getter asks the `JsonFile` for the field and wraps the result in a fresh value object on every call. Missing fields throw naturally via `jsonFile.get()` when the getter is invoked.
- Field IDs are top-of-file constants like `PLUGIN_ID_JSON_FIELD_ID = 'pluginId'`.

```typescript
import type { AhqFile } from '../interfaces/ahq-file.js';
import type { AhqWorkflow } from '../interfaces/ahq-workflow.js';
import type { JsonFile } from '../interfaces/json-file.js';
// ... other interface + impl imports ...
import { JsonFileImpl } from '../workspace/json-file-impl.js';

const PLUGIN_ID_JSON_FIELD_ID = 'pluginId';
const SKILL_ID_JSON_FIELD_ID = 'skillId';
const SHORT_ID_JSON_FIELD_ID = 'shortId';
const DESCRIPTION_JSON_FIELD_ID = 'description';
const EXAMPLE_PARAMETERS_JSON_FIELD_ID = 'exampleParameters';

export class AhqWorkflowImpl implements AhqWorkflow {
  private readonly jsonFile: JsonFile;
  constructor(file: AhqFile) {
    this.jsonFile = new JsonFileImpl(file);
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
      new SkillIdImpl(this.jsonFile.get(SKILL_ID_JSON_FIELD_ID)),
    );
  }
  getExampleCommand(): ExampleCommand {
    return new ExampleCommandImpl(
      new WorkflowShortNameImpl(this.jsonFile.get(SHORT_ID_JSON_FIELD_ID)),
      new ExampleParametersImpl(this.jsonFile.get(EXAMPLE_PARAMETERS_JSON_FIELD_ID)),
    );
  }
  displayYourself(): string {
    return `  ${this.getShortName()} ${this.getFullClaudeSkillCommand()} ${this.getDescription()}\nExample: ${this.getExampleCommand()}`;
  }
}
```

Tests validated: constructs from valid JSON; throws on invalid JSON (via JsonFileImpl constructor); missing `shortId` will throw when the test calls a method that triggers `jsonFile.get(SHORT_ID_JSON_FIELD_ID)` — if the RED test expects the **constructor** to throw on missing shortId, we'll discover that at test-run time and add one minimal guard in the constructor. No speculative eager validation up front.

---

## Step 11: AhqWorkspace

**Interface** `src/workflow-discovery/interfaces/ahq-workspace.ts`:
```typescript
export interface AhqWorkspace {
  getRoot(): string;
  findFiles(globPattern: string): AhqFile[];
}
```

**Impl** `src/workflow-discovery/workspace/ahq-workspace-impl.ts`:
- Constructor takes no params.
- `getRoot()` returns `process.env.AGENTIC_HQ_WORKSPACE_ROOT ?? ''` (minimal — the tests only set env var).
- `findFiles(globPattern)` manually walks the directory tree matching the pattern. **Minimal impl**: split pattern by `/`, walk each segment, expand `*` via `fs.readdirSync`, treat literal segments as exact matches.

```typescript
findFiles(globPattern: string): AhqFile[] {
  const segments = globPattern.split('/');
  let currentPaths = [this.getRoot()];
  for (const segment of segments) {
    const nextPaths: string[] = [];
    for (const currentPath of currentPaths) {
      if (segment === '*') {
        if (!fs.existsSync(currentPath)) continue;
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) nextPaths.push(path.join(currentPath, entry.name));
        }
      } else {
        const nextPath = path.join(currentPath, segment);
        if (fs.existsSync(nextPath)) nextPaths.push(nextPath);
      }
    }
    currentPaths = nextPaths;
  }
  return currentPaths.map((p) => new AhqFileImpl(p));
}
```

Tests validated: resolves root from env var; `findFiles` returns array with 1 `AhqFile` whose path contains `ahq-workflow.json`.

---

## Step 12: AhqWorkflows (set of discovered workflows)

**⚠️ TEST FILE UPDATES REQUIRED** — rewrite the RED test file `tests/unit/workflow-discovery/workflow-listing/ahq-workflows-impl.unit.test.ts` so it verifies discovery behavior through `displayYourselves()` (the production surface) rather than through a test-only `count()` method:

1. Rename `displayThemselves` → `displayYourselves` (consistency with singular `displayYourself()`; both use imperative "tell don't ask" style).
2. **Delete** all `workflows.count()` assertions. Rewrite the 3 discovery tests as:
   - **"should discover and compile all workflows from workspace"** → assert `displayYourselves()` output contains `reversal`, `math`, AND `quick`.
   - **"should skip skill directories without ahq-workflow.json"** → assert `displayYourselves()` output does NOT contain `no-workflow` (and still contains the 3 real shortIds).
   - **"should return empty when no ahq-workflow.json files exist"** → assert `displayYourselves()` returns `''` (empty string — no workflows joined).
3. The existing "should display all workflows when told to displayYourselves" test stays as-is after the rename.

**Why:** `count()` was added solely to satisfy test assertions — no production code calls it. Per `feedback_no_test_only_production_methods.md`: test via the methods production code actually uses. `displayYourselves()` is the real production surface.

**Interface** `src/workflow-discovery/interfaces/ahq-workflows.ts`:
```typescript
export interface AhqWorkflows {
  displayYourselves(): string;
}
```

**Impl** `src/workflow-discovery/workflow-listing/ahq-workflows-impl.ts`:
- Constructor takes an `AhqWorkspace`.
- At construction, asks workspace to `findFiles('.agentic-hq/plugins/*/skills/*/ahq-workflow.json')`, stores the resulting list of `AhqWorkflow` objects (by constructing an `AhqWorkflowImpl` for each `AhqFile`).
- `displayYourselves()` → joins each workflow's `displayYourself()` output with newlines. Returns `''` when list is empty.

```typescript
export class AhqWorkflowsImpl implements AhqWorkflows {
  private readonly workflows: AhqWorkflow[];
  constructor(workspace: AhqWorkspace) {
    const files = workspace.findFiles('.agentic-hq/plugins/*/skills/*/ahq-workflow.json');
    this.workflows = files.map((f) => new AhqWorkflowImpl(f));
  }
  displayYourselves(): string { return this.workflows.map((w) => w.displayYourself()).join('\n'); }
}
```

Tests validated: discovery of 3 workflows verified through `displayYourselves()` containing all 3 shortIds; skip-behavior verified through absence of `no-workflow` in output; empty case verified through empty-string output.

---

## Step 13: WorkflowSearchResults

**Interface** `src/workflow-discovery/interfaces/workflow-search-results.ts`:
```typescript
export interface WorkflowSearchResults {
  displayToUser(): string;
}
```

**Impl** `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts`:
- Constructor takes no params.
- At construction: creates `AhqWorkspaceImpl`, then creates `AhqWorkflowsImpl` with that workspace.
- `displayToUser()` returns `"Available workflows:\n\n" + workflows.displayYourselves()`.

```typescript
export class WorkflowSearchResultsImpl implements WorkflowSearchResults {
  private readonly workflows: AhqWorkflows;
  constructor() {
    this.workflows = new AhqWorkflowsImpl(new AhqWorkspaceImpl());
  }
  displayToUser(): string {
    return `Available workflows:\n\n${this.workflows.displayYourselves()}`;
  }
}
```

Tests validated:
- Output matches `/^Available workflows:/`
- Contains `reversal`, `/test-plugin-alpha:reversal-skill`, `Reverses a string`
- 3 lines starting with `Example:`
- Workflow lines start with `  ` (two spaces) — handled by `displayYourself()` returning lines starting with `  `

**NOTE**: The test `should align columns (padded shortName and fullPath)` only checks that **at least one** line starts with two spaces. So `displayYourself()` must produce a line starting with 2 spaces. I will prepend `"  "` to the display string in `displayYourself()`.

Actually looking at test 8 more carefully:
```typescript
expect(display).toContain('Example: agentic-hq math -- --input-number=54321');
```
uses `toContain` so the line CAN have a prefix. I'll format `displayYourself()` as:
```
  {shortName} {fullPath} {description}
Example: {exampleCommand}
```

This is the minimum required — no column padding since no test verifies actual alignment (only that lines start with `  `).

---

## Step 14: Run Tests and Verify

Run: `cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm test`

Expected:
- All 34 new tests in 12 files PASS
- Existing 15 test files (68 tests) still pass — no regressions

If any test fails, fix the minimum necessary and re-run.

---

## Step 15: Run `pnpm validate` (Per CLAUDE.md Requirement)

CLAUDE.md requires running `pnpm validate` (typecheck + lint + format + unit tests) after coding work. Run:
```
cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm validate
```

If lint/format issues in NEW files → fix. If format issues in existing files → DO NOT run `format:fix` (per CLAUDE.md rule), leave them.

**Note on format:check**: Per CLAUDE.md, only run `format:fix` if the changes only apply to new code. If format:check fails on files we didn't touch, report to user and continue.

---

## Step 16: Re-read command instructions and complete remaining steps

**TODO after Step 15**: Re-read `/Users/stevepersonal/dev/agentic-hq/agentic-hq/.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/03-jira-minimal-implementation.md` and complete:
- Step 8: Create GREEN Phase document
- Step 9: Add Jira comment
- Step 10: Present to human
- Step 11: Write command-output.json
- Step 12: Self-terminate

---

## Verification

**How to verify GREEN passes:**
1. `cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm test` → 34 new tests pass, no existing regressions
2. `cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm typecheck` → no TS errors
3. Count passing tests: should be existing 68 + 34 = 102 passing

**Out of scope for unit tests** (will be done in later phases):
- Creating real `ahq-workflow.json` files in actual plugin skill dirs
- Wiring new discovery into `agentic-hq-cli.ts` / `agentic-hq-program.ts`
- Replacing `DEMO_SKILLS` / `WorkflowSkillsRegistry`
- E2E test from cross-workspace

---

## GREEN Phase Minimality Notes

- No column padding/alignment (no test checks it)
- No caching (per design requirement D.3)
- No glob library dependency — minimal manual segment walker
- No graceful error handling beyond what tests require
- `getRoot()` returns empty string if env var unset (minimal — tests always set it)
- `displayYourself()` output format is the minimum that satisfies `toContain` assertions

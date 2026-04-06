# RED Phase Plan: AHQ-104 Unit Tests (Multiple Files)

**Human has given permission to create multiple test files and multiple tests in this RED phase.** All unit tests done together per Jira. One test file per class per project convention.

## ⚠️ NOTE: Most tests already exist — modify in place

All 12 test files already exist at `tests/unit/workflow-discovery/{workflow,workflow-listing,workspace}/`. They import/construct `*Impl` classes directly (currently failing with "Cannot find module" — valid RED).

**Recommended approach: modify existing tests in place, don't delete/recreate.** Reasons:
- Test bodies, fixtures, assertions are correct — only type annotations need adding
- Fixture setup (temp dirs, JSON writing) is complex; safe to leave as-is
- Modifications are mechanical: add interface imports, add type annotations
- Less risk of introducing bugs vs. copy-paste recreation

**Changes needed per file:**
1. **All 12 files**: Add `import type { X } from '.../interfaces/x.js';` for each interface used, then add interface type annotations (`const x: X = new XImpl(...)`)
2. **One file**: Rename `full-path-impl.unit.test.ts` → `skill-full-claude-command-impl.unit.test.ts`. Rename class references `FullPathImpl` → `SkillFullClaudeCommandImpl`, `FullPath` → `SkillFullClaudeCommand`
3. **Two files** (`ahq-workflow-impl.unit.test.ts`, `ahq-workflows-impl.unit.test.ts`): Rename `getFullPath()` → `getSkillFullClaudeCommand()` in any assertions


## Context

AHQ-104 replaces hardcoded `DEMO_SKILLS` array with dynamic workflow discovery from `ahq-workflow.json` files. New OO classes go in `src/workflow-discovery/` (flat structure). Output of `agentic-hq list` must remain identical.

## Key Design Rules (from human feedback)

- **No "er" suffix classes** (Parser, Discoverer, Formatter, etc.) — these are code smells representing "bits of code" not "things". Behavior belongs inside the entity it relates to.
- **Entities encode their own behavior** — e.g., `AhqWorkflow` knows how to construct itself from its `AhqFile`, rather than a separate `AhqWorkflowJsonParser`.
- **Constructor injection** — fixed dependencies provided at construction; methods delegate to contained objects.
- **Entity-based directory structure** — sub-dirs by entity domain (`workflow/`, `workspace/`), not by code type (value-objects/, domain/, etc.).
- **Test via interface, construct via Impl** — tests import the interface and type variables through it; only the constructor uses the concrete `*Impl` class. This validates the contract.

## Step 0: Copy This Approved Plan

Copy to `docs/jira-docs/AHQ-104/workflow-files/unit-test-files/02-red-phase-failing-test-plan-copy.md`.

## English Language Description (class names **bolded**, verbs *italicized*)

When the CLI runs `agentic-hq list`, it *creates* a **WorkflowSearchResultsImpl** (no constructor parameters). The **WorkflowSearchResultsImpl** internally *creates* a **AhqWorkspaceImpl** (which *locates* the AHQ workspace root via `AGENTIC_HQ_WORKSPACE_ROOT` env var or git root), then *creates* a **AhqWorkflowsImpl** by passing the workspace to its constructor. **AhqWorkflowsImpl** IS the set of discovered workflows — it *scans* the **Workspace** for the glob pattern `.agentic-hq/plugins/*/skills/*/ahq-workflow.json`, which *returns* a list of **AhqFile** objects (not raw string paths). For each **AhqFile** found, it *creates* a **AhqWorkflowImpl** by passing the **AhqFile** to its constructor. **AhqWorkflowImpl** *reads* its **AhqFile** and *stores* just the raw JSON string — no cached value objects. When a method like `getShortName()` is called, it *dynamically creates* a **WorkflowShortNameImpl** from the JSON on demand. Similarly, `getSkillFullClaudeCommand()` *dynamically creates* a **SkillFullClaudeCommandImpl** (from a freshly created **PluginIdImpl** and **SkillIdImpl**), and `getExampleCommand()` *dynamically creates* a **ExampleCommandImpl** (from a freshly created **WorkflowShortNameImpl** and **ExampleParametersImpl**). Each value object *renders* itself via `toString()` at the output boundary. Back in **WorkflowSearchResultsImpl**, `displayToUser()` *prints* the header, then *tells* **AhqWorkflows** to *displayThemselves*. **AhqWorkflows** in turn *tells* each **AhqWorkflow** to *displayYourself* — each workflow *renders* its own line by calling its methods (`getShortName()`, `getSkillFullClaudeCommand()`, `getDescription()`, `getExampleCommand()`), which each *dynamically create* and *return* a value object that *renders* itself via `toString()` at the output boundary.

## Step 1: Create 12 Test Files

All imports from `src/workflow-discovery/{interfaces,workflow,workflow-listing,workspace}/` (don't exist) → compilation failure → valid RED. Tests live in `tests/unit/workflow-discovery/{workflow,workflow-listing,workspace}/`, mirroring the Impl layout.

**Test pattern for ALL tests:**
- Import interface as `type` from `interfaces/` dir — used for variable typing
- Import `*Impl` class from its entity dir (`workflow/`, `workflow-listing/`, `workspace/`) — used ONLY for constructor
- Variables typed as interface; methods called through interface contract

### Source file layout (none exist yet):

```
src/workflow-discovery/
  interfaces/
    workflow-short-name.ts
    workflow-description.ts
    example-parameters.ts
    plugin-id.ts
    skill-id.ts
    skill-full-claude-command.ts
    example-command.ts
    ahq-workflow.ts            (a workflow from an ahq-workflow.json file)
    ahq-workflows.ts           (the set of discovered AhqWorkflow objects)
    workflow-search-results.ts (aggregates workspace results + displays)
    ahq-file.ts                (wraps a file path as a domain object)
    ahq-workspace.ts           (knows about the AHQ workspace: root, config dir, etc.)
  workflow/
    workflow-short-name-impl.ts
    workflow-description-impl.ts
    example-parameters-impl.ts
    plugin-id-impl.ts
    skill-id-impl.ts
    skill-full-claude-command-impl.ts
    example-command-impl.ts
    ahq-workflow-impl.ts       (takes an AhqFile, reads + parses internally)
  workflow-listing/
    ahq-workflows-impl.ts      (finds and compiles workflows given an AhqWorkspace)
    workflow-search-results-impl.ts
  workspace/
    ahq-file-impl.ts               (wraps a string path, provides read access)
    ahq-workspace-impl.ts      (resolves workspace root from env var)
```

---

### Test 1: `workflow/workflow-short-name-impl.unit.test.ts`

**Class**: `WorkflowShortNameImpl` implements `WorkflowShortName`
**Constructor**: `new WorkflowShortNameImpl('reversal')`

```typescript
// Import interface for typing, Impl for construction only
import type { WorkflowShortName } from '.../interfaces/workflow-short-name.js';
import { WorkflowShortNameImpl } from '.../workflow/workflow-short-name-impl.js';

it('should return the value via toString()', () => {
  const shortName: WorkflowShortName = new WorkflowShortNameImpl('reversal');
  expect(shortName.toString()).toBe('reversal');
});
it('should throw on empty string', () => {
  expect(() => new WorkflowShortNameImpl('')).toThrow();
});
it('should throw on whitespace-only string', () => {
  expect(() => new WorkflowShortNameImpl('   ')).toThrow();
});
```

---

### Test 2: `workflow/workflow-description-impl.unit.test.ts`

**Class**: `WorkflowDescriptionImpl` implements `WorkflowDescription`
**Constructor**: `new WorkflowDescriptionImpl('Reverses a string (hello world demo)')`

Same pattern: `toString()`, throws on empty/whitespace.

---

### Test 3: `workflow/example-parameters-impl.unit.test.ts`

**Class**: `ExampleParametersImpl` implements `ExampleParameters`
**Constructor**: `new ExampleParametersImpl(' -- --input-number=54321')`

```typescript
it('should return value via toString()', () => {
  const params: ExampleParameters = new ExampleParametersImpl(' -- --input-number=54321');
  expect(params.toString()).toBe(' -- --input-number=54321');
});
it('should allow empty string (workflows with no params)', () => {
  const params: ExampleParameters = new ExampleParametersImpl('');
  expect(params.toString()).toBe('');
});
```

---

### Test 4: `workflow/plugin-id-impl.unit.test.ts`

**Class**: `PluginIdImpl` implements `PluginId`
**Constructor**: `new PluginIdImpl('agentic-hq-demos-plugin')`

Same pattern: `toString()`, throws on empty/whitespace.

---

### Test 5: `workflow/skill-id-impl.unit.test.ts`

**Class**: `SkillIdImpl` implements `SkillId`
**Constructor**: `new SkillIdImpl('math-workflow')`

Same pattern: `toString()`, throws on empty/whitespace.

---

### Test 6: `workflow/skill-full-claude-command-impl.unit.test.ts`

**Class**: `SkillFullClaudeCommandImpl` implements `SkillFullClaudeCommand`
**Constructor**: `new SkillFullClaudeCommandImpl(pluginId, skillId)` — value objects, not strings.

```typescript
it('should construct /{pluginId}:{skillId} via toString()', () => {
  const pluginId: PluginId = new PluginIdImpl('agentic-hq-demos-plugin');
  const skillId: SkillId = new SkillIdImpl('math-workflow');
  const fullPath: SkillFullClaudeCommand = new SkillFullClaudeCommandImpl(pluginId, skillId);
  expect(fullPath.toString()).toBe('/agentic-hq-demos-plugin:math-workflow');
});
```

---

### Test 7: `workflow/example-command-impl.unit.test.ts`

**Class**: `ExampleCommandImpl` implements `ExampleCommand`
**Constructor**: `new ExampleCommandImpl(shortName, exampleParameters)` — value objects.

```typescript
it('should construct "agentic-hq {shortName}{params}" via toString()', () => {
  const shortName: WorkflowShortName = new WorkflowShortNameImpl('math');
  const params: ExampleParameters = new ExampleParametersImpl(' -- --input-number=54321');
  const cmd: ExampleCommand = new ExampleCommandImpl(shortName, params);
  expect(cmd.toString()).toBe('agentic-hq math -- --input-number=54321');
});
it('should handle no parameters', () => {
  const shortName: WorkflowShortName = new WorkflowShortNameImpl('create-workflow');
  const params: ExampleParameters = new ExampleParametersImpl('');
  const cmd: ExampleCommand = new ExampleCommandImpl(shortName, params);
  expect(cmd.toString()).toBe('agentic-hq create-workflow');
});
```

---

### Test 8: `workflow/ahq-workflow-impl.unit.test.ts`

**Class**: `AhqWorkflowImpl` implements `AhqWorkflow`
**Constructor**: `new AhqWorkflowImpl(file: AhqFile)` — takes an `AhqFile` object (not a raw string path), reads it, and parses it internally. The entity knows how to construct itself from its file.

```typescript
it('should construct from ahq-workflow.json AhqFile with correct value objects', () => {
  const file: AhqFile = new AhqFileImpl(writeTempJsonPath({...VALID_JSON}));
  const workflow: AhqWorkflow = new AhqWorkflowImpl(file);
  
  expect(workflow.getShortName().toString()).toBe('math');
  expect(workflow.getSkillFullClaudeCommand().toString()).toBe('/agentic-hq-demos-plugin:math-workflow');
  expect(workflow.getDescription().toString()).toBe('Solves a math problem using an agent team');
  expect(workflow.getExampleCommand().toString()).toBe('agentic-hq math -- --input-number=54321');
});
it('should throw on missing required field (shortId)', () => {
  const file: AhqFile = new AhqFileImpl(writeTempJsonPath({ pluginId: 'p', skillId: 's', description: 'd', exampleParameters: '' }));
  expect(() => new AhqWorkflowImpl(file)).toThrow();
});
it('should throw on invalid JSON content', () => {
  const file: AhqFile = new AhqFileImpl(writeTempFilePath('not json'));
  expect(() => new AhqWorkflowImpl(file)).toThrow();
});
it('should render its own display line when told to displayYourself', () => {
  const file: AhqFile = new AhqFileImpl(writeTempJsonPath({...VALID_JSON}));
  const workflow: AhqWorkflow = new AhqWorkflowImpl(file);
  const display = workflow.displayYourself();
  expect(display).toContain('math');
  expect(display).toContain('/agentic-hq-demos-plugin:math-workflow');
  expect(display).toContain('Solves a math problem using an agent team');
  expect(display).toContain('Example: agentic-hq math -- --input-number=54321');
});
```

**Design**: AhqWorkflow IS the entity — a workflow that exists as an `ahq-workflow.json` file. Takes an `AhqFile` object (wrapped path), reads and stores just the raw JSON string (minimal state). Each method dynamically creates the value object on demand — no cached fields. No separate Parser/"er" class. `version` and `author` present in JSON but not exposed (unused in output per agreed decisions).

---

### Test 9: `workspace/ahq-file-impl.unit.test.ts`

**Class**: `AhqFileImpl` implements `AhqFile`
**Constructor**: `new AhqFileImpl(path: string)` — wraps a file path.

```typescript
it('should return the path via getPath()', () => {
  const file: AhqFile = new AhqFileImpl('/tmp/test/ahq-workflow.json');
  expect(file.getPath()).toBe('/tmp/test/ahq-workflow.json');
});
it('should read file contents via readContent()', () => {
  const file: AhqFile = new AhqFileImpl(writeTempFilePath('hello'));
  expect(file.readContent()).toBe('hello');
});
it('should throw on empty path', () => {
  expect(() => new AhqFileImpl('')).toThrow();
});
```

**Design**: Wraps a raw file path string as a domain object. Provides `readContent()` so that consumers (like `AhqWorkflowImpl`) never deal with raw `fs.readFileSync` calls directly.

---

### Test 10: `workflow-listing/ahq-workflows-impl.unit.test.ts`

**Class**: `AhqWorkflowsImpl` implements `AhqWorkflows`
**Constructor**: `new AhqWorkflowsImpl(workspace: AhqWorkspace)` — takes a workspace, scans its plugin directories for `ahq-workflow.json` files, creates `AhqWorkflowImpl` for each. It IS the set of discovered workflows.

Uses a UID-based temp dir with the fixture structure (2 plugins, 3 workflows + 1 skill dir without json):

```
tempWorkspaceDir-{uid}/
  .agentic-hq/
    plugins/
      test-plugin-alpha/          <- 2 workflows
        skills/
          reversal-skill/
            ahq-workflow.json     -> shortId: "reversal", pluginId: "test-plugin-alpha", ...
          math-skill/
            ahq-workflow.json     -> shortId: "math", pluginId: "test-plugin-alpha", ...
          no-workflow-skill/      <- skill dir WITHOUT ahq-workflow.json (should be skipped)
      test-plugin-beta/           <- 1 workflow
        skills/
          quick-task/
            ahq-workflow.json     -> shortId: "quick", pluginId: "test-plugin-beta", exampleParameters: "", ...
```

```typescript
let tempWorkspaceDir: string;

beforeEach(() => {
  tempWorkspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ahq-test-workflows-'));
  // Build plugin/skill/ahq-workflow.json structure (2 plugins, 3 workflows + 1 skill without json)
  process.env.AGENTIC_HQ_WORKSPACE_ROOT = tempWorkspaceDir;
});
afterEach(() => {
  delete process.env.AGENTIC_HQ_WORKSPACE_ROOT;
  fs.rmSync(tempWorkspaceDir, { recursive: true, force: true });
});

it('should discover and compile all workflows from workspace', () => {
  const workspace: AhqWorkspace = new AhqWorkspaceImpl();
  const workflows: AhqWorkflows = new AhqWorkflowsImpl(workspace);
  expect(workflows.count()).toBe(3);
});
it('should skip skill directories without ahq-workflow.json', () => {
  const workspace: AhqWorkspace = new AhqWorkspaceImpl();
  const workflows: AhqWorkflows = new AhqWorkflowsImpl(workspace);
  // 3 found, not 4 — no-workflow-skill was skipped
  expect(workflows.count()).toBe(3);
});
it('should return empty when no ahq-workflow.json files exist', () => {
  process.env.AGENTIC_HQ_WORKSPACE_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'ahq-test-empty-'));
  const workspace: AhqWorkspace = new AhqWorkspaceImpl();
  const workflows: AhqWorkflows = new AhqWorkflowsImpl(workspace);
  expect(workflows.count()).toBe(0);
});
it('should display all workflows when told to displayThemselves', () => {
  const workspace: AhqWorkspace = new AhqWorkspaceImpl();
  const workflows: AhqWorkflows = new AhqWorkflowsImpl(workspace);
  const output = workflows.displayThemselves();
  expect(output).toContain('reversal');
  expect(output).toContain('math');
  expect(output).toContain('quick');
});
```

**Design**: `AhqWorkflows` IS the set of workflows. It knows how to find and compile them given a workspace. Not a dumb wrapper — it does the scanning work at construction time. It can also be told to `displayThemselves()`, which delegates to each `AhqWorkflow`.

---

### Test 11: `workspace/ahq-workspace-impl.unit.test.ts`

**Class**: `AhqWorkspaceImpl` implements `AhqWorkspace`
**Constructor**: `new AhqWorkspaceImpl()` — no parameters. Resolves AHQ workspace root via `AGENTIC_HQ_WORKSPACE_ROOT` env var.
**Methods**: `getRoot(): string`, `findFiles(globPattern: string): AhqFile[]` — provides workspace info and file search capability.

```typescript
it('should resolve workspace root from AGENTIC_HQ_WORKSPACE_ROOT env var', () => {
  process.env.AGENTIC_HQ_WORKSPACE_ROOT = '/tmp/test-workspace';
  const workspace: AhqWorkspace = new AhqWorkspaceImpl();
  expect(workspace.getRoot()).toBe('/tmp/test-workspace');
});
it('should find files matching a glob pattern and return AhqFile objects', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ahq-test-ws-'));
  process.env.AGENTIC_HQ_WORKSPACE_ROOT = tempDir;
  const workspace: AhqWorkspace = new AhqWorkspaceImpl();
  const files: AhqFile[] = workspace.findFiles('.agentic-hq/plugins/*/skills/*/ahq-workflow.json');
  expect(files).toHaveLength(1);
  expect(files[0]!.getPath()).toContain('ahq-workflow.json');
});
```

**Design**: `AhqWorkspace` knows about the workspace — its root, and can search it for files matching a pattern, returning `AhqFile` objects (not raw strings). The actual workflow-specific scanning logic lives in `AhqWorkflows`, which tells the workspace what pattern to search for.

---

### Test 12: `workflow-listing/workflow-search-results-impl.unit.test.ts`

**Class**: `WorkflowSearchResultsImpl` implements `WorkflowSearchResults`
**Constructor**: `new WorkflowSearchResultsImpl()` — no parameters. Internally *creates* a **AhqWorkspaceImpl**, then *creates* **AhqWorkflowsImpl** (passing the workspace).
**Method**: `displayToUser(): string` — *tells* **AhqWorkflows** to display themselves, producing the column-aligned output.

Uses the same temp dir fixture as Test 10 (2 plugins, 3 workflows), controlled via `AGENTIC_HQ_WORKSPACE_ROOT`.

```typescript
let tempWorkspaceDir: string;

beforeEach(() => {
  tempWorkspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ahq-test-search-result-'));
  // Build same plugin/skill/ahq-workflow.json structure as AhqWorkspace test
  process.env.AGENTIC_HQ_WORKSPACE_ROOT = tempWorkspaceDir;
});
afterEach(() => {
  delete process.env.AGENTIC_HQ_WORKSPACE_ROOT;
  fs.rmSync(tempWorkspaceDir, { recursive: true, force: true });
});

it('should format discovered workflows with header, names, paths, descriptions', () => {
  const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl();
  const output = searchResults.displayToUser();
  
  expect(output).toMatch(/^Available workflows:/);
  expect(output).toContain('reversal');
  expect(output).toContain('/test-plugin-alpha:reversal-skill');
  expect(output).toContain('Reverses a string');
});
it('should include Example: line for each workflow', () => {
  const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl();
  const output = searchResults.displayToUser();
  const exampleLines = output.split('\n').filter((l: string) => l.startsWith('Example:'));
  expect(exampleLines).toHaveLength(3);
});
it('should align columns (padded shortName and fullPath)', () => {
  const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl();
  const output = searchResults.displayToUser();
  const workflowLines = output.split('\n').filter((l: string) => l.startsWith('  '));
  expect(workflowLines.length).toBeGreaterThan(0);
});
it('should return just header when no workflows found', () => {
  process.env.AGENTIC_HQ_WORKSPACE_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'ahq-test-empty-'));
  const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl();
  const output = searchResults.displayToUser();
  expect(output).toMatch(/^Available workflows:/);
});
```

**Design**: `WorkflowSearchResultsImpl` creates workspace + workflows at construction. For display, it *tells* **AhqWorkflows** to display themselves (tell, don't ask) — it doesn't iterate or extract. The delegation chain is: SearchResults → AhqWorkflows → each AhqWorkflow → value objects.

---

## Step 2–8: Remaining Steps

2. **Run tests**: `pnpm test:unit` → expect "Cannot find module" failures (valid RED)
3. **TypeScript check**: `pnpm typecheck` → type errors expected in RED
4. **Create RED phase doc** at `{workflow-files}/unit-test-files/02-red-phase-failing-tests.md`
5. **Add Jira comment** on AHQ-104
6. **Present to human & write output**
7. **Self-terminate**
8. **(LAST)** Recheck all steps from 02-jira-write-failing-test command executed

## Project Design Requirements Compliance

- **Class/interface pairs**: 12 test files for 12 `*Impl` classes implementing interfaces.
- **Primitive wrapping**: Value objects wrap strings at construction, `toString()` at boundary, reject empty.
- **Constructor injection**: `SkillFullClaudeCommandImpl(pluginId, skillId)`, `ExampleCommandImpl(shortName, params)`. `WorkflowSearchResultsImpl()` takes no params — it knows to search the AHQ workspace (via env var).
- **Tell don't ask**: SearchResults *tells* AhqWorkflows to displayThemselves; AhqWorkflows *tells* each AhqWorkflow to displayYourself. Delegation chain, no state extraction.
- **No "er" classes**: `new AhqWorkflowImpl(file)` instead of `AhqWorkflowJsonParser.parse()`. `WorkflowSearchResults.displayToUser()` instead of separate discoverer + listing classes.
- **Entities encode behavior**: Each entity knows how to construct itself and present itself.

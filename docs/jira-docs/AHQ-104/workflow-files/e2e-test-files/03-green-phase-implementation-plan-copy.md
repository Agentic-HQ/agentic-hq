# GREEN Phase Plan: AHQ-104 E2E Test

## Context

AHQ-104 is replacing the hardcoded workflow listing in `agentic-hq list` with dynamic discovery. The unit-test cycle (RED/GREEN/REFACTOR) is complete — 13 interfaces + 13 Impl classes already exist under `src/workflow-discovery/` (116 passing unit tests). The e2e RED test `tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts` runs `agentic-hq list` from a temp workspace via the globally-linked binary and asserts output contains:
1. `Available workflows:`
2. `create-workflow`
3. `What it does: Create` (the NEW 2-line format)

The e2e test fails currently because: (a) no `ahq-workflow.json` metadata files exist in the real plugin skill directories, (b) `AhqWorkflowImpl.getWorkflowListingEntryString()` emits the OLD format (`shortName /plugin:skill description\nExample: ...`), and (c) the CLI's `list` action uses the hardcoded `WorkflowSkillsRegistry(DEMO_SKILLS).formatSkillList()` rather than the new `WorkflowSearchResultsImpl`.

The intended outcome: `agentic-hq list` outputs a 2-line-per-workflow format generated dynamically from discovered `ahq-workflow.json` files, so the e2e test's three assertions all pass.

---

## Jira Requirements (Numbered)

1. **Replace hardcoded DEMO_SKILLS listing with dynamic discovery** → [Step 2: wire `WorkflowSearchResultsImpl` into list action]
2. **Create `ahq-workflow.json` metadata files** in each workflow skill directory (5 files) → [Step 1]
3. **New 2-line-per-workflow output format** (line 1: `agentic-hq <shortName><exampleParameters>`, line 2: `   What it does: <description>`) → [Step 3]
4. **Include `version` and `author` fields in JSON but don't render them** → [Step 1]
5. **Scope: AHQ workspace only** (not current workspace) → existing `AhqWorkspaceImpl` already does this via `AGENTIC_HQ_WORKSPACE_ROOT` env var
6. **Keep short-alias subcommands (`agentic-hq math` etc.) working** → unchanged (still uses `DEMO_SKILLS` registry) — deferred to later Jira
7. **Out of scope: current-workspace search, plugin-dir resolution** → not touched
8. **AC: E2E test `pnpm test:e2e:cross-workspace-list-workflows` passes** → [Verification]

---

## Project Design Requirements Compliance

| # | Design Requirement | Plan Section Addressing It | Notes |
|---|-------------------|----------------------------|-------|
| D.1 | Class/interface pair per concept | No new classes needed — all 13 pairs already exist from unit cycle | AhqWorkflow, WorkflowSearchResults, ExampleCommand, etc. |
| D.2 | Primitives wrapped immediately | Existing `WorkflowDescriptionImpl`, `ExampleCommandImpl` still wrap on read | JSON field values become value objects via `createFrom(metadata)` |
| D.3 | Minimal state / delegation | `AhqWorkflowImpl` still stores only `WorkflowMetadata`; entry-line method delegates to `ExampleCommand` and `WorkflowDescription` | Unchanged — still "tell don't ask" |
| D.4 | Switchable concrete classes | `WorkflowSearchResultsImpl` is what gets instantiated directly in CLI action | Consumer could swap to a `CustomWorkflowSearchResults` in future |
| D.5 | `*Impl` naming | All existing classes already end in `Impl` | No change |
| D.6 | Entity-based directory structure | Existing dirs (`workflow/`, `workflow-listing/`, `workspace/`) | No new dirs |
| D.7 | Test via interface | E2E test is black-box (runs binary, asserts stdout) | N/A |

**Deferred to REFACTOR (GREEN minimality):**
- Removing unused `FullClaudeSkillCommandImpl`/`PluginIdImpl`/`SkillIdImpl` (still used by their own unit tests even if no longer called from `getWorkflowListingEntryString()` — deleting would require deleting those tests; that's REFACTOR work)
- Replacing `DEMO_SKILLS`/`WorkflowSkillsRegistry`/`WorkflowSkill` stack (still used for short-alias subcommands)
- Injecting `WorkflowSearchResults` into `createProgram` rather than instantiating inline in the action
- Improving inline instantiation in list action (direct `new WorkflowSearchResultsImpl()` call)

---

## Step 0: Copy This Approved Plan

**Copy this approved plan** to `docs/jira-docs/AHQ-104/workflow-files/e2e-test-files/03-green-phase-implementation-plan-copy.md` **before proceeding with implementation.**

---

## Step 1: Create 5 `ahq-workflow.json` Metadata Files

Create one `ahq-workflow.json` file per workflow skill directory. Data taken verbatim from `src/demo/demo-skills.ts` (the canonical source of truth for the current hardcoded listing). `version` and `author` fields added (per Jira clarification — present in JSON but not rendered anywhere yet).

The `exampleParameters` fields follow the existing convention (no leading space; `ExampleCommandImpl` injects the separator):

**1. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ahq-workflow.json`**
```json
{
  "pluginId": "agentic-hq-demos-plugin",
  "skillId": "string-reversal",
  "shortId": "reversal",
  "description": "Reverses a string (hello world demo)",
  "exampleParameters": "-- --string-reverse='hello there you'",
  "version": "1.0.0",
  "author": "Agentic HQ"
}
```

**2. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ahq-workflow.json`**
```json
{
  "pluginId": "agentic-hq-demos-plugin",
  "skillId": "math-workflow",
  "shortId": "math",
  "description": "Solves a math problem using an agent team",
  "exampleParameters": "-- --input-number=54321",
  "version": "1.0.0",
  "author": "Agentic HQ"
}
```

**3. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ahq-workflow.json`**
```json
{
  "pluginId": "agentic-hq-demos-plugin",
  "skillId": "quick-jira-workflow",
  "shortId": "quick-jira",
  "description": "Creates and completes a Jira ticket",
  "exampleParameters": "-- --jira-id=TEST-123",
  "version": "1.0.0",
  "author": "Agentic HQ"
}
```

**4. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ahq-workflow.json`**
```json
{
  "pluginId": "agentic-hq-demos-plugin",
  "skillId": "full-jira-tdd-story-workflow",
  "shortId": "full-jira",
  "description": "Full TDD story workflow driven by a Jira ticket",
  "exampleParameters": "-- --jira-id=TEST-123",
  "version": "1.0.0",
  "author": "Agentic HQ"
}
```

**5. `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ahq-workflow.json`**
```json
{
  "pluginId": "agentic-hq-core-plugin",
  "skillId": "create-workflow",
  "shortId": "create-workflow",
  "description": "Create a new Agentic HQ workflow",
  "exampleParameters": "",
  "version": "1.0.0",
  "author": "Agentic HQ"
}
```

---

## Step 2: Wire `WorkflowSearchResultsImpl` Into The CLI's `list` Action

**File**: `src/cli/agentic-hq-program.ts`

Change the `list` subcommand action so it outputs from the new discovery subsystem instead of the hardcoded registry. Minimal change: inline instantiation (DI cleanup deferred to REFACTOR).

**Before** (lines 34-40):
```typescript
program
  .command('list')
  .description('List available workflow skills')
  .action(() => {
    console.log(registry.formatSkillList());
  });
```

**After**:
```typescript
program
  .command('list')
  .description('List available workflow skills')
  .action(() => {
    console.log(new WorkflowSearchResultsImpl().getWorkflowsListingString());
  });
```

Add import at top of file:
```typescript
import { WorkflowSearchResultsImpl } from '../workflow-discovery/workflow-listing/workflow-search-results-impl.js';
```

**Note:** `registry` parameter is still used below this line for short-alias subcommands — leave that alone.

---

## Step 3: Change `AhqWorkflowImpl.getWorkflowListingEntryString()` To New 2-Line Format

**File**: `src/workflow-discovery/workflow/ahq-workflow-impl.ts`

Replace the old single-entry format with the new 2-line format. Drop the `FullClaudeSkillCommand` and `WorkflowShortName` usages (no longer rendered). The line 1 is the `ExampleCommand` (which already renders as `agentic-hq <shortName> <exampleParameters>` with proper trim). Line 2 is 3-space-indented `   What it does: <description>`.

**Before** (constants + method, lines 15-16 and 55-65):
```typescript
const WORKFLOW_LINE_INDENT = '  ';
const EXAMPLE_LINE_PREFIX = '\nExample: ';

// ...

/** Return the workflow's listing entry line (indent + name + skill command + description + example). */
getWorkflowListingEntryString(): string {
  const shortName = this.getShortName();
  const skillCommand = this.getFullClaudeSkillCommand();
  const description = this.getDescription();
  const example = this.getExampleCommand();
  return (
    `${WORKFLOW_LINE_INDENT}${shortName} ${skillCommand} ${description}` +
    `${EXAMPLE_LINE_PREFIX}${example}`
  );
}
```

**After**:
```typescript
const WHAT_IT_DOES_LINE_PREFIX = '\n   What it does: ';

// ...

/** Return the workflow's listing entry — two lines: example command + "What it does: {description}". */
getWorkflowListingEntryString(): string {
  const example = this.getExampleCommand();
  const description = this.getDescription();
  return `${example}${WHAT_IT_DOES_LINE_PREFIX}${description}`;
}
```

The `getShortName()` and `getFullClaudeSkillCommand()` private helpers are now unused **from this method** — but still exist in the class. **Leave them in place** (their deletion is REFACTOR work, and they may be unit-tested). Same reasoning applies to `PluginIdImpl`/`SkillIdImpl`/`FullClaudeSkillCommandImpl` classes themselves.

Actually — checking more carefully: `getShortName` and `getFullClaudeSkillCommand` are `private` methods called only from `getWorkflowListingEntryString()`. Once we stop calling them, TypeScript's `noUnusedLocals`/strict mode lint rule may flag them. I'll delete them only if the linter complains — otherwise leave them for REFACTOR. (Prediction: TS `noUnusedLocals` doesn't flag unused private methods, only unused local variables. But ESLint might. Will check during implementation.)

**Resulting output per workflow**:
```
agentic-hq reversal -- --string-reverse='hello there you'
   What it does: Reverses a string (hello world demo)
```

And for `create-workflow` (empty `exampleParameters`, `trimEnd()` removes trailing space in `ExampleCommandImpl`):
```
agentic-hq create-workflow
   What it does: Create a new Agentic HQ workflow
```

The test assertion `expect(output).toContain('What it does: Create')` matches because `create-workflow`'s description starts with `Create`.

---

## Step 4: Update Existing Unit Tests That Assert The Old Format

Changing `getWorkflowListingEntryString()` breaks assertions in tests that verified the old format. Update them to assert the new format. This is legitimate maintenance when production behavior deliberately changes (not a violation of the "don't modify tests mid-cycle" rule — that applies to the current TDD cycle's test, and these are previous-cycle tests).

### 4a: `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts`

**Change** the assertions in the first test (lines 46-49):

**Before**:
```typescript
expect(display).toContain('math');
expect(display).toContain('/agentic-hq-demos-plugin:math-workflow');
expect(display).toContain('Solves a math problem using an agent team');
expect(display).toContain('Example: agentic-hq math -- --input-number=54321');
```

**After** (assertions matching the new 2-line format):
```typescript
expect(display).toContain('agentic-hq math -- --input-number=54321');
expect(display).toContain('   What it does: Solves a math problem using an agent team');
```

The other two tests in the file (`should throw when missing shortId`, `should throw on invalid JSON`) don't assert on the format — they verify construction/throw behavior. They still pass as-is.

**Wait — concern**: The "should throw when the listing entry is requested with missing shortId" test expects `getWorkflowListingEntryString()` to throw. The new implementation no longer calls `getShortName()` inside `getWorkflowListingEntryString()`, so missing `shortId` wouldn't cause this method itself to throw. However, `getExampleCommand()` still calls `ExampleCommandImpl.createFrom(metadata)` which calls `WorkflowShortNameImpl.createFrom(metadata)` which reads `shortId` and throws if missing/empty. So the method still throws. **Test still passes.**

### 4b: `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts`

**Test 1** (`should format discovered workflows with header, names, paths, descriptions`): the `/test-plugin-alpha:reversal-skill` assertion needs to go because `FullClaudeSkillCommand` is no longer in the output.

**Before** (lines 27-31):
```typescript
expect(output).toMatch(/^Available workflows:/);
expect(output).toContain('reversal');
expect(output).toContain('/test-plugin-alpha:reversal-skill');
expect(output).toContain('Reverses a string');
```

**After**:
```typescript
expect(output).toMatch(/^Available workflows:/);
expect(output).toContain('agentic-hq reversal');
expect(output).toContain('   What it does: Reverses a string');
```

**Test 2** (`should include Example: line for each workflow`): filters for lines starting with `Example:` — this filter will find 0 lines in the new format.

**Before** (lines 34-41):
```typescript
tmpdirTest('should include Example: line for each workflow', ({ tmpdir }) => {
  createTestWorkspaceFixture(tmpdir);
  process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
  const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl();
  const output = searchResults.getWorkflowsListingString();
  const exampleLines = output.split('\n').filter((l: string) => l.startsWith('Example:'));
  expect(exampleLines).toHaveLength(3);
});
```

**After** (rename + update to filter for new "What it does:" lines):
```typescript
tmpdirTest('should include a "What it does:" line for each workflow', ({ tmpdir }) => {
  createTestWorkspaceFixture(tmpdir);
  process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
  const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl();
  const output = searchResults.getWorkflowsListingString();
  const whatItDoesLines = output
    .split('\n')
    .filter((l: string) => l.startsWith('   What it does:'));
  expect(whatItDoesLines).toHaveLength(3);
});
```

**Test 3** (`should align columns (padded shortName and fullPath)`): filters for lines starting with `"  "` (2 spaces). The new format's line 2 starts with 3 spaces, so `.startsWith('  ')` still matches (3 spaces has 2 spaces as prefix). **Test still passes without change** — but the test name is misleading now (there's no column alignment). **Low-priority question**: rename this test? Answer: leave for REFACTOR (the test still technically passes and renaming is cosmetic).

Actually — on reflection, the "aligned columns" name and intent is now totally wrong. I'll rename it as part of this change since we're already updating the file. But keep the logic minimal:

**Before**:
```typescript
tmpdirTest('should align columns (padded shortName and fullPath)', ({ tmpdir }) => {
  // ... same body
  const workflowLines = output.split('\n').filter((l: string) => l.startsWith('  '));
  expect(workflowLines.length).toBeGreaterThan(0);
});
```

**After**:
```typescript
tmpdirTest('should include at least one indented "What it does:" line', ({ tmpdir }) => {
  // ... same body
  const workflowLines = output.split('\n').filter((l: string) => l.startsWith('  '));
  expect(workflowLines.length).toBeGreaterThan(0);
});
```

**Test 4** (`should return just header when no workflows found`): unchanged — still works.

---

## Step 5: Verify Build & Tests

1. **Run unit tests** to verify nothing broke:
   ```
   cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm test
   ```
   Expected: all 116 tests still pass (with the 5 modified assertions in 2 files now matching the new format).

2. **Run the e2e test** (the actual GREEN test):
   ```
   cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm test:e2e:cross-workspace-list-workflows
   ```
   Expected: test passes — all three assertions (`Available workflows:`, `create-workflow`, `What it does: Create`) match the output.

3. **Manual sanity check** (optional, but quick — run the binary locally):
   ```
   cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && node bin/agentic-hq.cjs list
   ```
   Expected: 10 lines of output (header + 5 workflows × 2 lines each) showing the new 2-line format.

---

## TODO: After Step 5 Completes

1. **Re-read the command file** for Steps 7-12 (testing instructions, GREEN doc creation, Jira comment, output file, self-terminate).

2. **Include "Deferred to REFACTOR" section in the GREEN summary doc** (`03-green-phase-summary-of-what-was-implemented.md`) so the REFACTOR agent knows what cleanup work was intentionally deferred:
   - Remove unused private methods `getShortName()` and `getFullClaudeSkillCommand()` from `AhqWorkflowImpl`
   - Remove now-unused `WORKFLOW_LINE_INDENT` and `EXAMPLE_LINE_PREFIX` constants from `AhqWorkflowImpl`
   - Remove associated unused imports (FullClaudeSkillCommand, WorkflowShortName types)
   - Evaluate whether `FullClaudeSkillCommandImpl`, `PluginIdImpl`, `SkillIdImpl` classes + their unit tests should be deleted (no longer used in production code — only tested in isolation)
   - Replace inline `new WorkflowSearchResultsImpl()` in createProgram's list action with proper DI (inject via constructor or parameter)
   - Replace `DEMO_SKILLS` + `WorkflowSkillsRegistry` + `WorkflowSkill` stack with discovery-based short-alias subcommand registration
   - Rename misleading test `should include at least one indented "What it does:" line` (assertion doesn't actually check "What it does:" — it checks for any 2-space-indented line)
   - Remove old `src/demo/demo-skills.ts`, `src/workflow/workflow-skills/workflow-skills-registry.ts`, `src/interfaces/workflow-skill.ts` once short aliases use discovery

---

## Files To Create (5)

- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ahq-workflow.json`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ahq-workflow.json`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ahq-workflow.json`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ahq-workflow.json`
- `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ahq-workflow.json`

## Files To Modify (4)

- `src/workflow-discovery/workflow/ahq-workflow-impl.ts` — new 2-line format in `getWorkflowListingEntryString()`
- `src/cli/agentic-hq-program.ts` — `list` action uses `WorkflowSearchResultsImpl`
- `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts` — update 2 assertions to new format
- `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts` — update 3 tests to new format

## Files NOT Modified (intentionally — REFACTOR scope)

- `src/demo/demo-skills.ts` — still used by short-alias subcommands
- `src/workflow/workflow-skills/workflow-skills-registry.ts` — still used
- `src/interfaces/workflow-skill.ts` — still referenced
- `src/cli/agentic-hq-cli.ts` — still creates registry for short-alias subcommands
- `src/workflow-discovery/workflow/{plugin-id-impl,skill-id-impl,full-claude-skill-command-impl}.ts` — still used by their own unit tests

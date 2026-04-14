# GREEN Phase Plan: AHQ-106 (e2e test) — FINAL

## Context

The e2e execution test fails because Commander doesn't recognize `string-reversal-copy-for-test` as a subcommand. We need to wire dynamic workflow registration AND ensure Claude gets `--plugin-dir` for user workspace plugins.

**Design problem solved**: The `Tool` interface is used for TWO purposes — (1) skill resolution by `ClaudeWorkflowCommandBuilder` and (2) workflow runtime by `DefaultClaudeCodeTool`. Purpose 2 has NO `AhqWorkflow` context. Threading `AhqWorkflow` only solves Purpose 1. Solution: make `ClaudeCommandBuilder` dynamically scan both AHQ installation AND user workspace plugin directories. This solves both purposes without changing `Tool`, `MarshalledCLITool`, `MarshalledIOCLICommandBuilder`, or `WorkflowCommandBuilder` interfaces.

---

## Jira Requirements (Numbered)

1. User workspace workflows show up in listing → Already working
2. User workspace workflow runs via short alias subcommand → [Steps 1-6]
3. `pnpm test:e2e:user-workspace-workflows` passes → [Verification]
4. Existing e2e tests still pass → [Verification]
5. Delete old hardcoded code → Partially done here (DEMO_SKILLS loop + --workflow-command-supplier removed); file deletion deferred to REFACTOR

---

## Project Design Requirements Compliance

Skipped for GREEN — no new classes/interfaces created. The scanning approach adds `UserProjectWorkspace` to `ClaudeCommandBuilder`'s constructor (constructor injection, consistent with existing pattern).

---

## Implementation Steps

### Step 0: Copy approved plan
Copy to `docs/jira-docs/AHQ-106/workflow-files/e2e-test-files/03-APPROVED-green-phase-implementation-plan-copy.md`

### Step 1: Dynamic plugin dir scanning in ClaudeCommandBuilder
**File**: `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts`

Add `UserProjectWorkspace` to constructor. Replace hardcoded `PLUGIN_DIR_NAMES` and `TEMPORARILY_ADDED_PLUGIN_DIR` with dynamic scanning of both directories:

```typescript
// BEFORE constructor:
constructor(agenticHqInstallation, executable?, extraArgs?)

// AFTER constructor:
constructor(agenticHqInstallation, userWorkspace: UserProjectWorkspace, executable?, extraArgs?)

// BEFORE getPluginDirFlags():
// Hardcoded PLUGIN_DIR_NAMES + TEMPORARILY_ADDED_PLUGIN_DIR

// AFTER getPluginDirFlags():
// Scan agenticHqInstallation.getConfigDir()/plugins/* for all subdirs
// Scan userWorkspace.getRoot()/.agentic-hq/plugins/* for all subdirs (if different dir)
// Mark method with REFACTOR comment: "Later, pass pluginDir explicitly from
// AhqWorkflow (for Purpose 1) and from DefaultClaudeCodeTool (for Purpose 2)
// instead of scanning"
```

### Step 2: Wire UserProjectWorkspace in CompositionRoot
**File**: `src/kernel/composition-root.ts`

```typescript
// BEFORE:
new ClaudeCommandBuilder(this.getAgenticHqInstallation())

// AFTER:
new ClaudeCommandBuilder(this.getAgenticHqInstallation(), this.getUserProjectWorkspace())
```

### Step 3: Fix WorkflowRegistryImpl — args bug + simplify builder type
**File**: `src/cli/workflow-registry-impl.ts`

Two changes:
1. Fix action handler: `async (...actionArgs: unknown[])` with `actionArgs.slice(0, -1)` → `async (_options: unknown, cmd: Command)` with `cmd.args`
2. Change builder type from custom 3-param structural type to `WorkflowCommandBuilder` interface (2 params — drop `pluginDir`)

```typescript
// BEFORE:
constructor(
  private readonly program: Command,
  private readonly builder: {
    build: (skillPath: string, args: string[], pluginDir: { toString(): string }) => Promise<{ execute: () => void }>;
  }
)

// AFTER:
constructor(
  private readonly program: Command,
  private readonly builder: WorkflowCommandBuilder
)

// BEFORE action:
.action(async (...actionArgs: unknown[]) => {
    const args = actionArgs.slice(0, -1) as string[];
    const command = await this.builder.build(fullCommand, args, pluginDir);

// AFTER action:
.action(async (_options: unknown, cmd: Command) => {
    const command = await this.builder.build(fullCommand, cmd.args);
```

### Step 4: Remove --workflow-command-supplier + DEMO_SKILLS from createProgram()
**File**: `src/cli/agentic-hq-program.ts`

Remove the DEMO_SKILLS `for` loop (lines 43-54) and `--workflow-command-supplier` option (lines 56-77). Replace with `searchResults.registerWorkflowsWith()`:

```typescript
// BEFORE:
export function createProgram(builder: WorkflowCommandBuilder, registry: WorkflowSkillsRegistry): Command {
  // ... DEMO_SKILLS loop ...
  // ... --workflow-command-supplier option ...
}

// AFTER:
export function createProgram(builder: WorkflowCommandBuilder, searchResults: WorkflowSearchResults): Command {
  // ... program setup + list subcommand (unchanged) ...
  searchResults.registerWorkflowsWith(new WorkflowRegistryImpl(program, builder));
  return program;
}
```

### Step 5: Update entry point
**File**: `src/cli/agentic-hq-cli.ts`

```typescript
// BEFORE:
import { DEMO_SKILLS } from '../demo/demo-skills.js';
import { WorkflowSkillsRegistry } from '../workflow/workflow-skills/workflow-skills-registry.js';
createProgram(builder, new WorkflowSkillsRegistry(DEMO_SKILLS)).parse();

// AFTER:
import { WorkflowSearchResultsImpl } from '../workflow-discovery/workflow-listing/workflow-search-results-impl.js';
createProgram(builder, new WorkflowSearchResultsImpl()).parse();
```

### Step 6: Update e2e tests to use short aliases
4 e2e tests switch from `--workflow-command-supplier=/plugin:skill` to short alias:

| Test file | Before | After |
|-----------|--------|-------|
| `agentic-hq-cli-string-reversal.e2e.test.ts` | `--workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal` | `reversal` |
| `cross-workspace-string-reversal.e2e.test.ts` | `--workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal` | `reversal` |
| `cross-workspace-demo-math-workflow...test.ts` | `--workflow-command-supplier=/agentic-hq-demos-plugin:math-workflow` | `math` |
| `cross-workspace-quick-jira-workflow...test.ts` | `--workflow-command-supplier=/agentic-hq-demos-plugin:quick-jira-workflow` | `quick-jira` |

### Step 7: Update unit tests

**`tests/unit/tools/claude-code/claude-command-builder.unit.test.ts`**:
- Update constructor calls to pass mock `UserProjectWorkspace`
- Tests for hardcoded 4 plugin dirs → change to assert dynamic scanning behavior
- Remove assertions about `TEMPORARILY_ADDED_PLUGIN_DIR`

**`tests/unit/cli/workflow-registry-impl.unit.test.ts`**:
- Change mock builder from 3-param to 2-param (drop pluginDir)
- Update assertion: `expect(mockBuilder.build).toHaveBeenCalledWith('/demos:reversal', expect.any(Array))`

**`tests/unit/cli/agentic-hq-program.unit.test.ts`**:
- Remove test for `--workflow-command-supplier` delegation
- Rewrite: `createProgram(builder, searchResults)` with stub `WorkflowSearchResults`
- Note: These tests will be further cleaned in REFACTOR when DEMO_SKILLS files are deleted

---

## Files Changed (Summary)

| File | Action | Reason |
|------|--------|--------|
| `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` | MODIFY | Accept UserProjectWorkspace, scan for plugins dynamically |
| `src/kernel/composition-root.ts` | MODIFY | Pass UserProjectWorkspace to ClaudeCommandBuilder |
| `src/cli/workflow-registry-impl.ts` | MODIFY | Fix args bug, simplify builder type to WorkflowCommandBuilder |
| `src/cli/agentic-hq-program.ts` | MODIFY | Remove --workflow-command-supplier + DEMO_SKILLS, use searchResults |
| `src/cli/agentic-hq-cli.ts` | MODIFY | Remove DEMO_SKILLS, pass WorkflowSearchResultsImpl |
| `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts` | MODIFY | Use short alias |
| `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` | MODIFY | Use short alias |
| `tests/e2e/demo/cross-workspace-demo-math-workflow...test.ts` | MODIFY | Use short alias |
| `tests/e2e/demo/cross-workspace-quick-jira-workflow...test.ts` | MODIFY | Use short alias |
| `tests/unit/tools/claude-code/claude-command-builder.unit.test.ts` | MODIFY | New constructor + dynamic scanning |
| `tests/unit/cli/workflow-registry-impl.unit.test.ts` | MODIFY | 2-param builder, drop pluginDir |
| `tests/unit/cli/agentic-hq-program.unit.test.ts` | MODIFY | Rewrite for new createProgram() API |

**UNCHANGED** (no changes needed):
- `src/interfaces/tool.ts`
- `src/tools/marshalled-io-tools/marshalled-cli-tool.ts`
- `src/interfaces/marshalled-io-cli-command-builder.ts`
- `src/interfaces/workflow-command-builder.ts`
- `src/workflow/claude/claude-workflow-command-builder.ts`

---

## Verification

1. `pnpm test:unit` — all unit tests pass
2. `pnpm test:e2e:user-workspace-workflows` — both listing and execution tests pass
3. `pnpm test:e2e:cross-workspace-list-workflows` — still passes
4. `pnpm test:e2e:cross-workspace-string-reversal` — still passes (now using short alias)

---

## TODO: Re-read command file for Steps 7-12 after implementation

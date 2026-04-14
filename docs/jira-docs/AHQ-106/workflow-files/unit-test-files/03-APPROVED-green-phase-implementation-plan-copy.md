# GREEN Phase Implementation Plan: AHQ-106 (unit tests)

## Context

AHQ-106 completes the dynamic workflow discovery feature started in AHQ-104. The RED phase created 8 failing test files (5 new, 3 modified) with 26 new tests. This GREEN phase writes the minimal code to make all tests pass. 27 TypeScript compilation errors + runtime assertion failures need to be resolved.

---

## Jira Requirements (Numbered)

1. Same level of high quality OO coding as AHQ-104 -> [Project Design Requirements Compliance]
2. Unit tests that test via the interface -> Already done in RED; GREEN just implements
3. Follow docs/dev/project-design-requirements.md -> [Project Design Requirements Compliance]
4. CurrentUserWorkspace based on process.cwd() -> [Step 8: CurrentUserWorkspaceImpl]
5. When cwd equals AHQ root, show "Same as" message -> [Step 8: CurrentUserWorkspaceImpl]
6. PluginDirectory - no cached state, delegate to dependencies -> [Step 4: PluginDirectoryImpl]
7. Three levels: WorkflowSearchResults > Workspace > Plugin -> [Steps 5-10]
8. Plugin replaces AhqWorkflowsImpl concept -> [Steps 5-6: Plugin interface + PluginImpl]
9. Class/interface pair for every concept -> [Steps 1-6: all new interfaces + impls]
10. Test file per class -> Already done in RED
11. Test command: `pnpm test:unit` -> [Verification]
12. Remove old hard-coded code -> Deferred to REFACTOR (per GREEN phase rules)

---

## Project Design Requirements Compliance

| # | Design Requirement | Plan Section | Notes |
|---|-------------------|-------------|-------|
| D.1 | Class/interface pair for every concept | Steps 1-6 | Workspace, WorkflowRegistry, Plugin, PluginDirectory all get interface+Impl |
| D.2 | Primitives wrapped in value objects | Step 7 (AhqWorkflowImpl) | getShortName() returns WorkflowShortName, getDescription() returns WorkflowDescription, etc. |
| D.3 | Minimal state, delegation, "tell don't ask" | Steps 4,7,8,9 | PluginDirectoryImpl computes path dynamically; WorkspaceImpl discovers plugins per-call; CurrentUserWorkspaceImpl creates WorkspaceImpl fresh each call |
| D.4 | Data Dictionary + English Language Description | Below | |
| D.5 | Switchability | All steps | Every concept is behind an interface; third party can replace any Impl |
| D.6 | Impl naming convention | All steps | WorkspaceImpl, PluginImpl, PluginDirectoryImpl, CurrentUserWorkspaceImpl, WorkflowRegistryImpl |
| D.7 | Balance | N/A | GREEN phase = minimal code; balance assessed in REFACTOR |

**Deferred to REFACTOR**: Full code quality review, removal of old hardcoded code, and balance assessment. GREEN phase only requires minimal passing code.

### Data Dictionary

| Concept | Interface | Impl Class | Purpose |
|---------|-----------|------------|---------|
| A generic workspace containing plugins | `Workspace` | `WorkspaceImpl` | Scans for plugins under `.agentic-hq/plugins/`, formats listing with header |
| The AHQ workspace | `AhqWorkspace` + `Workspace` | `AhqWorkspaceImpl` (modify) | Root from env var; now also implements Workspace |
| The user's current workspace | `Workspace` | `CurrentUserWorkspaceImpl` | Root from `process.cwd()`; "same as" message when dirs match |
| A plugin containing workflows | `Plugin` | `PluginImpl` | Discovers workflows within one plugin, formats plugin listing section |
| A plugin's directory path | `PluginDirectory` | `PluginDirectoryImpl` | Computes path dynamically from workspace root + plugin name |
| Top-level search results | `WorkflowSearchResults` | `WorkflowSearchResultsImpl` (modify) | Contains two Workspaces; header + both workspace listings |
| A discoverable workflow | `AhqWorkflow` (modify) | `AhqWorkflowImpl` (modify) | Now also exposes getShortName, getDescription, getFullClaudeSkillCommand, getPluginDirectory |
| Registry for subcommand registration | `WorkflowRegistry` | `WorkflowRegistryImpl` | Wraps Commander program; registers subcommands from workflows |

### English Language Description

Convention: **Bold** = class/interface names. *Italic* = verbs that represent actual method calls between objects. Plain text = narrative flow. Only real method names go in italics.

#### Scenario 1: Listing workflows (`agentic-hq list`)

When the user runs `agentic-hq list`, the CLI asks the **WorkflowSearchResults** to *getWorkflowsListingString*. The **WorkflowSearchResultsImpl** prints an "Available workflows:" header, then tells each of its two **Workspace**s to *getWorkflowListingString*.

First, the **AhqWorkspaceImpl** is asked. It creates a **WorkspaceImpl** with "Agentic HQ Workspace" as the display name and the `AGENTIC_HQ_WORKSPACE_ROOT` env var as the root directory, then delegates to it. The **WorkspaceImpl** prints a workspace header line (e.g. "Agentic HQ Workspace (directory: /path):-"), then scans the `.agentic-hq/plugins/` directory for subdirectories. For each plugin directory found, it creates a **PluginImpl** and tells it to *getPluginListingString*.

Each **PluginImpl** creates a **PluginDirectoryImpl** from its plugin name and workspace root. The **PluginDirectoryImpl** computes its full path dynamically (workspace root + `.agentic-hq/plugins/` + plugin name) and when told to *findWorkflowFiles*, it delegates to an **AhqDirectoryImpl** to glob for `skills/*/ahq-workflow.json`. For each discovered file, the **PluginImpl** creates an **AhqWorkflowImpl** and tells it to *getWorkflowListingEntryString*. The **AhqWorkflowImpl** delegates to its value objects — **ExampleCommandImpl** and **WorkflowDescriptionImpl** — to format the entry line. The **PluginImpl** assembles these entries under a "Plugin: {name}\nWorkflows:" header and returns the section.

Second, the **CurrentUserWorkspaceImpl** is asked. It checks whether `process.cwd()` equals the `AGENTIC_HQ_WORKSPACE_ROOT` env var. If they match, it returns a short "Local Workspace: Same as Agentic HQ Workspace" message and no plugin listing. If they differ, it creates a **WorkspaceImpl** with "Local Workspace" as the display name and `process.cwd()` as the root, then follows the same delegation chain as above.

The **WorkflowSearchResultsImpl** concatenates both workspace sections and returns the complete listing.

#### Scenario 2: Executing a workflow (`agentic-hq reversal ...`)

During CLI startup, the **WorkflowSearchResults** is told to *registerWorkflowsWith* a **WorkflowRegistry**. It delegates this to each **Workspace** by calling *registerWorkflowsWith* on both.

Each **Workspace** (via **WorkspaceImpl**) discovers its plugins, creates a **PluginImpl** for each, and tells each to *registerWorkflowsWith* the registry. Each **PluginImpl** discovers its workflows (same **PluginDirectoryImpl** → **AhqDirectoryImpl** chain), creates an **AhqWorkflowImpl** for each (passing the **PluginDirectory** as the second constructor argument), and calls *register* on the **WorkflowRegistry** for each workflow.

The **WorkflowRegistryImpl** receives each *register* call. It asks the **AhqWorkflow** to *getShortName* (which returns a **WorkflowShortName**) and to *getDescription* (which returns a **WorkflowDescription**), then creates a Commander subcommand using the short name as the command name and the description as help text.

When the user runs `agentic-hq reversal -- --string-to-reverse=hello`, Commander matches the "reversal" subcommand. The action handler asks the **AhqWorkflow** to *getFullClaudeSkillCommand* (returns a **FullClaudeSkillCommand** like `/agentic-hq-demos-plugin:string-reversal`) and *getPluginDirectory* (returns the **PluginDirectory**), then calls `builder.build()` with both values plus the pass-through args. This builds and executes the Claude CLI command with the correct `--plugin-dir` flag.

---

## Implementation Steps

### Step 0: Copy this approved plan to workflow directory
Copy to `docs/jira-docs/AHQ-106/workflow-files/unit-test-files/03-APPROVED-green-phase-implementation-plan-copy.md`
(Only after user approval — do NOT copy before approval.)

### Step 1: Create Workspace interface
**File**: `src/workflow-discovery/interfaces/workspace.ts` (NEW)
```typescript
import type { WorkflowRegistry } from './workflow-registry.js';
export interface Workspace {
  getWorkflowListingString(): string;
  registerWorkflowsWith(registry: WorkflowRegistry): void;
}
```

### Step 2: Create WorkflowRegistry interface
**File**: `src/workflow-discovery/interfaces/workflow-registry.ts` (NEW)
```typescript
import type { AhqWorkflow } from './ahq-workflow.js';
export interface WorkflowRegistry {
  register(workflow: AhqWorkflow): void;
}
```

### Step 3: Create PluginDirectory interface + Plugin interface
**File**: `src/workflow-discovery/plugin/plugin-directory.ts` (NEW)
```typescript
import type { AhqFiles } from '../interfaces/ahq-files.js';
export interface PluginDirectory {
  toString(): string;
  findWorkflowFiles(): AhqFiles;
}
```

**File**: `src/workflow-discovery/plugin/plugin.ts` (NEW)
```typescript
import type { WorkflowRegistry } from '../interfaces/workflow-registry.js';
export interface Plugin {
  getPluginListingString(): string;
  registerWorkflowsWith(registry: WorkflowRegistry): void;
}
```

### Step 4: Create PluginDirectoryImpl
**File**: `src/workflow-discovery/plugin/plugin-directory-impl.ts` (NEW)
- Constructor: `(pluginName: string, workspaceRoot: string)`
- `toString()`: `path.join(workspaceRoot, '.agentic-hq', 'plugins', pluginName)` — computed each call, not cached
- `findWorkflowFiles()`: creates `AhqDirectoryImpl(this.toString())`, calls `findMatchingFiles('skills/*/ahq-workflow.json')`

### Step 5: Update AhqWorkflow interface
**File**: `src/workflow-discovery/interfaces/ahq-workflow.ts` (MODIFY)
- Add: `getShortName(): WorkflowShortName`
- Add: `getDescription(): WorkflowDescription`
- Add: `getFullClaudeSkillCommand(): FullClaudeSkillCommand`
- Add: `getPluginDirectory(): PluginDirectory`

### Step 6: Update AhqWorkflowImpl
**File**: `src/workflow-discovery/workflow/ahq-workflow-impl.ts` (MODIFY)
- Accept optional second param: `pluginDir?: PluginDirectory`
- Make `getDescription()` public (currently private)
- Add `getShortName()`: delegates to `WorkflowShortNameImpl.createFrom(this.metadata)`
- Add `getFullClaudeSkillCommand()`: delegates to `FullClaudeSkillCommandImpl.createFrom(this.metadata)`
- Add `getPluginDirectory()`: returns stored pluginDir (or throw if not provided)

### Step 7: Create PluginImpl
**File**: `src/workflow-discovery/plugin/plugin-impl.ts` (NEW)
- Constructor: `(pluginName: string, workspaceRoot: string)`
- `getPluginListingString()`: creates PluginDirectoryImpl, finds workflow files, creates AhqWorkflowImpl for each, formats "Plugin: {name}\nWorkflows:\n{entries}"
- `registerWorkflowsWith(registry)`: same discovery, calls `registry.register(workflow)` for each

### Step 8: Create WorkspaceImpl
**File**: `src/workflow-discovery/workspace/workspace-impl.ts` (NEW)
- Constructor: `(displayName: string, rootDir: string)`
- `getWorkflowListingString()`: scans `.agentic-hq/plugins/` dirs, creates PluginImpl for each, concatenates plugin listings under workspace header
- `registerWorkflowsWith(registry)`: scans plugins, delegates to each

Plugin discovery: `fs.readdirSync(path.join(rootDir, '.agentic-hq', 'plugins'))` filtering for directories. If directory doesn't exist, returns empty.

### Step 9: Create CurrentUserWorkspaceImpl
**File**: `src/workflow-discovery/workspace/current-user-workspace-impl.ts` (NEW)
- No-arg constructor
- `getWorkflowListingString()`: if `process.cwd() === process.env.AGENTIC_HQ_WORKSPACE_ROOT`, return "Same as Agentic HQ Workspace" message. Otherwise create `WorkspaceImpl('Local Workspace', process.cwd())` and delegate.
- `registerWorkflowsWith(registry)`: same check — if same dir, register nothing

### Step 10: Update AhqWorkspaceImpl
**File**: `src/workflow-discovery/workspace/ahq-workspace-impl.ts` (MODIFY)
- Add `implements Workspace` (in addition to existing `implements AhqWorkspace`)
- Add `getWorkflowListingString()`: creates `WorkspaceImpl('Agentic HQ Workspace', root)` and delegates
- Add `registerWorkflowsWith(registry)`: same pattern
- Need to expose `root` (currently derived from env var in constructor)

### Step 11: Update WorkflowSearchResultsImpl
**File**: `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts` (MODIFY)
- Replace single AhqWorkflowsImpl with two Workspaces: `AhqWorkspaceImpl` + `CurrentUserWorkspaceImpl`
- `getWorkflowsListingString()`: header + ahqWorkspace.getWorkflowListingString() + "\n" + currentUserWorkspace.getWorkflowListingString()
- Add `registerWorkflowsWith(registry)`: delegates to both workspaces

### Step 12: Update WorkflowSearchResults interface
**File**: `src/workflow-discovery/interfaces/workflow-search-results.ts` (MODIFY)
- Add: `registerWorkflowsWith(registry: WorkflowRegistry): void`

### Step 13: Create WorkflowRegistryImpl
**File**: `src/cli/workflow-registry-impl.ts` (NEW)
- Constructor: `(program: Command, builder: { build: Function })`
- `register(workflow)`: creates Commander subcommand with `workflow.getShortName().toString()`, `.description(workflow.getDescription().toString())`, `.passThroughOptions()`, `.action()` that calls `builder.build(fullCommand, args, pluginDir)`

### Step 14: Verification
- Run `pnpm test:unit` — all tests must pass (existing 118 + new 26 = ~144)

### TODO
Come back and re-read the command file for testing and documenting instructions after implementation (Steps 7-12 of the command).

---

## Key Files Reference

**Existing files to reuse:**
- `src/workflow-discovery/workspace/ahq-directory-impl.ts` — fast-glob file search (reused by PluginDirectoryImpl)
- `src/workflow-discovery/workspace/ahq-file-impl.ts` — file reading
- `src/workflow-discovery/workspace/ahq-files-impl.ts` — file collection
- `src/workflow-discovery/workspace/json-file-workflow-metadata.ts` — JSON metadata
- `src/workflow-discovery/workflow/workflow-short-name-impl.ts` — createFrom(metadata)
- `src/workflow-discovery/workflow/workflow-description-impl.ts` — createFrom(metadata)
- `src/workflow-discovery/workflow/full-claude-skill-command-impl.ts` — createFrom(metadata)
- `src/workflow-discovery/workflow/example-command-impl.ts` — createFrom(metadata)

**Test files (read-only, written in RED):**
- `tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts`
- `tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts`
- `tests/unit/workflow-discovery/plugin/plugin-impl.unit.test.ts`
- `tests/unit/workflow-discovery/plugin/plugin-directory-impl.unit.test.ts`
- `tests/unit/cli/workflow-registry-impl.unit.test.ts`
- `tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts` (modified)
- `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts` (modified)
- `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts` (modified)

---

## Suggested REFACTOR: Consolidate AhqWorkspace into Workspace

**This section documents a design issue identified during GREEN planning. Include this in the GREEN phase summary document so the REFACTOR agent has full context.**

### The Problem: Two Workspace Interfaces With Overlapping Responsibility

After GREEN, `AhqWorkspaceImpl` will implement TWO interfaces:

1. **`AhqWorkspace`** (from AHQ-104) at `src/workflow-discovery/interfaces/ahq-workspace.ts`:
   ```typescript
   export interface AhqWorkspace {
     findFiles(globPattern: string): AhqFiles;
   }
   ```
   - File-system concern: "I can find files by glob pattern"
   - Created in AHQ-104 as the mechanism for `AhqWorkflowsImpl` to discover `ahq-workflow.json` files

2. **`Workspace`** (new in AHQ-106) at `src/workflow-discovery/interfaces/workspace.ts`:
   ```typescript
   export interface Workspace {
     getWorkflowListingString(): string;
     registerWorkflowsWith(registry: WorkflowRegistry): void;
   }
   ```
   - Workflow-discovery concern: "I can display my listing and register my workflows"
   - Used by `WorkflowSearchResultsImpl` to get listings from both AHQ and user workspaces

### Why AhqWorkspace Is Likely Redundant Now

In AHQ-104, the discovery pipeline was:
```
WorkflowSearchResultsImpl → AhqWorkflowsImpl → AhqWorkspace.findFiles(glob)
```
`AhqWorkflowsImpl` used `AhqWorkspace.findFiles()` to glob for ALL `ahq-workflow.json` files across ALL plugins in one shot.

In AHQ-106, the new pipeline is:
```
WorkflowSearchResultsImpl → Workspace.getWorkflowListingString()
  → WorkspaceImpl → discovers plugin dirs → PluginImpl → PluginDirectoryImpl.findWorkflowFiles()
    → AhqDirectoryImpl.findMatchingFiles(glob)
```
File searching now happens at the `PluginDirectoryImpl` level (per-plugin), not at the workspace level. `AhqWorkspace.findFiles()` is no longer called by any new production code path.

### Current Consumers of AhqWorkspace.findFiles()

1. **`AhqWorkflowsImpl`** at `src/workflow-discovery/workflow-listing/ahq-workflows-impl.ts`:
   - Constructor takes `AhqWorkspace`, calls `workspace.findFiles(glob)` to discover workflows
   - Used by the OLD `WorkflowSearchResultsImpl` (pre-AHQ-106)
   - After AHQ-106 GREEN, `WorkflowSearchResultsImpl` will use `Workspace` interface instead
   - `AhqWorkflowsImpl` will have NO production callers — it's dead code

2. **Existing unit tests** at `tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts` (lines 38-94):
   - Two tests type `workspace` as `AhqWorkspace` and call `findFiles()`
   - These are existing GREEN tests from AHQ-104 that must continue to pass

### Suggested REFACTOR Actions

1. **Delete `AhqWorkflowsImpl`** (`src/workflow-discovery/workflow-listing/ahq-workflows-impl.ts`) — it will have no production callers after GREEN. Its role is now split between `WorkspaceImpl` (plugin discovery) and `PluginImpl` (per-plugin workflow discovery).

2. **Delete `AhqWorkflows` interface** (`src/workflow-discovery/interfaces/ahq-workflows.ts`) — no longer needed.

3. **Consider merging `AhqWorkspace.findFiles()` into `Workspace` or removing it**:
   - Option A: Add `findFiles(glob)` to the `Workspace` interface (if other code needs generic file searching from a workspace)
   - Option B: Remove `AhqWorkspace` entirely and update `AhqWorkspaceImpl` to only implement `Workspace`. Move the `findFiles` tests to test via a different path, or delete them if `findFiles` is truly dead.
   - Option C: Keep `AhqWorkspace` as a separate interface for the "file-searching" role (Interface Segregation Principle) if there's a future use case.
   - **Recommendation**: Option B is simplest. `findFiles()` at the workspace level is superseded by `PluginDirectoryImpl.findWorkflowFiles()`. No production code will call it.

4. **Update tests**: The two existing `AhqWorkspace`-typed tests (lines 38-94 of `ahq-workspace-impl.unit.test.ts`) would need to either:
   - Be deleted (if `AhqWorkspace` interface is removed)
   - Be retyped to test via `Workspace` interface instead
   - The two NEW tests added in AHQ-106 RED (lines 96-121) already test via the `Workspace` interface

### Files Affected By This REFACTOR

- `src/workflow-discovery/interfaces/ahq-workspace.ts` — DELETE or merge into Workspace
- `src/workflow-discovery/interfaces/ahq-workflows.ts` — DELETE (dead interface)
- `src/workflow-discovery/workflow-listing/ahq-workflows-impl.ts` — DELETE (dead class)
- `src/workflow-discovery/workspace/ahq-workspace-impl.ts` — Remove `implements AhqWorkspace` if interface deleted
- `tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts` — Update/remove findFiles tests

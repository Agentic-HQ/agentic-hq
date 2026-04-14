# RED Phase Plan: AHQ-106 Unit Tests (One Per Class)

## Context

AHQ-104 built the dynamic workflow-discovery subsystem (16 interfaces, 18 impl classes) that scans `ahq-workflow.json` files and produces a flat listing. The `list` subcommand uses dynamic discovery, but the **execution** path (`agentic-hq reversal`, `agentic-hq math`, etc.) still relies on the hardcoded `DEMO_SKILLS` array, `WorkflowSkillsRegistry`, and hardcoded `PLUGIN_DIR_NAMES` in `ClaudeCommandBuilder`. AHQ-106 completes the feature by:
1. Adding user workspace support (listing grouped by workspace and plugin)
2. Replacing the hardcoded execution path so short-alias subcommands are registered from dynamically discovered workflows, and `ClaudeCommandBuilder` gets its `--plugin-dir` flags dynamically
3. Removing old hardcoded code (REFACTOR stage)

This RED phase writes **failing unit tests** (one test file per new/modified class) that will drive the GREEN implementation.

---

## Step 0: Copy this approved plan to `docs/jira-docs/AHQ-106/workflow-files/unit-test-files/02-red-phase-failing-test-plan-copy.md`

---

## Data Dictionary

### New Concepts

| Concept | Interface | Impl Class | Source File | Test File |
|---------|-----------|------------|-------------|-----------|
| A workspace containing plugins | `Workspace` | `WorkspaceImpl` (generic) | `interfaces/workspace.ts` + `workspace/workspace-impl.ts` | `workspace/workspace-impl.unit.test.ts` |
| User's current workspace | `Workspace` | `CurrentUserWorkspaceImpl` | `workspace/current-user-workspace-impl.ts` | `workspace/current-user-workspace-impl.unit.test.ts` |
| A plugin containing workflows | `Plugin` | `PluginImpl` | `plugin/plugin-impl.ts` | `plugin/plugin-impl.unit.test.ts` |
| A plugin's directory path | `PluginDirectory` | `PluginDirectoryImpl` | `plugin/plugin-directory-impl.ts` | `plugin/plugin-directory-impl.unit.test.ts` |
| A registry that workflows register themselves with | `WorkflowRegistry` | `WorkflowRegistryImpl` | `interfaces/workflow-registry.ts` + `cli/workflow-registry-impl.ts` (impl uses Commander) | `cli/workflow-registry-impl.unit.test.ts` |

All source paths relative to `src/`. All test paths relative to `tests/unit/`. Exception: `WorkflowRegistryImpl` lives in `src/cli/` (it uses Commander) with its test in `tests/unit/cli/`. The `WorkflowRegistry` interface lives in `src/workflow-discovery/interfaces/` (it's what the discovery subsystem talks to).

Plugin interfaces (`plugin.ts`, `plugin-directory.ts`) live in `src/workflow-discovery/plugin/` alongside their impls — grouping by entity/concept.

### Modified Concepts

| Concept | Interface | Impl Class | What Changes |
|---------|-----------|------------|-------------|
| The AHQ workspace | `Workspace` | `AhqWorkspaceImpl` (modify) | Implement `Workspace` by delegating to `WorkspaceImpl` with root from env var |
| Top-level search results | `WorkflowSearchResults` | `WorkflowSearchResultsImpl` (modify) | Contain two Workspaces, format grouped listing, add `registerWorkflowsWith(registry)` |
| A discoverable workflow | `AhqWorkflow` | `AhqWorkflowImpl` (modify) | Add public `getShortName()`, `getDescription()`, `getFullClaudeSkillCommand()`, `getPluginDirectory()`. Constructor gains `PluginDirectory` parameter. |

### Unchanged Concepts (from AHQ-104)

`AhqDirectory`, `AhqFile`, `AhqFiles`, `JsonFile`, `WorkflowMetadata`, `PluginId`, `SkillId`, `WorkflowShortName`, `WorkflowDescription`, `ExampleCommand`, `ExampleParameters`, `FullClaudeSkillCommand` — all stay as-is.

---

## Why "Tell Don't Ask"

The execution path uses a **"tell don't ask"** pattern rather than collecting workflows into arrays. This matters because:

- **"Ask" pattern**: (previous design, now replaced) Each level *asks* the level below "give me your workflows" (`getWorkflows()`), accumulates them into arrays, concatenates arrays at each level, and finally the CLI loops over the big array to register each workflow with Commander. Data flows **up** through 3 levels of array building, then the CLI does the work.

- **"Tell" pattern**: The CLI *tells* `WorkflowSearchResults` "register your workflows with this registry". It *tells* each `Workspace` the same. Each `Workspace` *tells* each `Plugin` the same. Each `Plugin` *tells* the registry "here's a workflow". The registry does the Commander registration right there. No intermediate arrays. No data flowing up. Each level just passes the instruction down.

**Why we prefer "tell"**: It eliminates intermediate state (arrays built at 3 levels, concatenated at 2 levels). It keeps the "what to do with a workflow" logic in one place (`WorkflowRegistry.register()`) rather than in a CLI loop. It aligns with our project design requirement of minimal state and delegation — each object just says "do your thing" to the next object, nobody accumulates data. This is the same pattern used in the listing path where each level just tells the level below to format itself.

---

## English Language Description

### Listing Path: `agentic-hq list`

When the CLI runs `agentic-hq list`, it *creates* a **WorkflowSearchResultsImpl** (no constructor parameters). When *told* to *getWorkflowsListingString()*, **WorkflowSearchResultsImpl** *dynamically creates* an **AhqWorkspaceImpl** and a **CurrentUserWorkspaceImpl**, *tells* each to *getWorkflowListingString()*, and *concatenates* their results under the "Available workflows:" header. No workspaces are stored as fields.

**AhqWorkspaceImpl** implements **Workspace**. When *told* to *getWorkflowListingString()*, it *dynamically resolves* the workspace root from the `AGENTIC_HQ_WORKSPACE_ROOT` env var, *creates* a **WorkspaceImpl** on the fly with that root and the display name "Agentic HQ Workspace", and *delegates* to it. No fields stored.

**CurrentUserWorkspaceImpl** implements **Workspace**. When *told* to *getWorkflowListingString()*, it *dynamically resolves* its root from `process.cwd()`. It first *checks* if its root equals the AHQ workspace root — if so, it *returns* "Local Workspace: Same as Agentic HQ Workspace (running from within the AHQ directory)". Otherwise, it *creates* a **WorkspaceImpl** on the fly with that root and the display name "Local Workspace", and *delegates* to it. No fields stored.

**WorkspaceImpl** is the generic workspace that does all the real work. It *takes* a display name and a root directory path as constructor parameters. When *told* to *getWorkflowListingString()*, it *formats* the workspace header (e.g. "Agentic HQ Workspace (directory: /path):-"), then *dynamically scans* for plugin directories under `.agentic-hq/plugins/*/`, *creates* a **PluginImpl** for each on the fly, *tells* each **Plugin** to *getPluginListingString()*, and *concatenates* the results under the header. No plugins are stored as fields.

**PluginImpl** *takes* a plugin name and a workspace root path as constructor parameters. When *told* to *getPluginListingString()*, it *dynamically creates* a **PluginDirectoryImpl** (which *resolves* its full absolute path from workspace root + `.agentic-hq/plugins/` + plugin name). It then *asks* the **PluginDirectoryImpl** to *findWorkflowFiles()*, which *delegates* to an **AhqDirectoryImpl**. For each discovered file, it *creates* an **AhqWorkflowImpl(file, pluginDirectory)** on the fly. It *formats* its header ("Plugin: <pluginId>\nWorkflows:") and *tells* each **AhqWorkflow** to *getWorkflowListingEntryString()*. No workflows or directories are stored as fields — everything is discovered, created, and used within the single method call.

### Execution Path: `agentic-hq my-short-command`

The execution path uses **"tell don't ask"** — instead of collecting workflows into arrays, we pass a **WorkflowRegistry** down through the levels and each **Plugin** registers its workflows directly.

**At CLI startup:**
1. CLI *creates* a **WorkflowSearchResultsImpl** and a **WorkflowRegistryImpl(program, builder)** (which wraps the Commander program and the `ClaudeCommandBuilder`)
2. CLI *tells* `searchResults.registerWorkflowsWith(registry)`

**How `registerWorkflowsWith()` chains through all levels:**

3. **WorkflowSearchResultsImpl.registerWorkflowsWith(registry)**: *Dynamically creates* an **AhqWorkspaceImpl** and a **CurrentUserWorkspaceImpl**, *tells* each to `registerWorkflowsWith(registry)`. No fields stored.

4. **AhqWorkspaceImpl.registerWorkflowsWith(registry)**: *Dynamically resolves* root from env var, *creates* a **WorkspaceImpl** on the fly, *tells* it to `registerWorkflowsWith(registry)`. No fields stored.

5. **CurrentUserWorkspaceImpl.registerWorkflowsWith(registry)**: *Dynamically resolves* root from `process.cwd()`. If same as AHQ root, *does nothing* (no duplicate registrations). Otherwise *creates* a **WorkspaceImpl** on the fly, *tells* it to `registerWorkflowsWith(registry)`. No fields stored.

6. **WorkspaceImpl.registerWorkflowsWith(registry)**: *Dynamically scans* for plugin dirs, *creates* a **PluginImpl** for each on the fly, *tells* each to `registerWorkflowsWith(registry)`. No fields stored.

7. **PluginImpl.registerWorkflowsWith(registry)**: *Dynamically creates* a **PluginDirectoryImpl**, *asks* it to *findWorkflowFiles()*, *creates* an **AhqWorkflowImpl(file, pluginDirectory)** for each file, and *tells* `registry.register(workflow)` for each. No fields stored.

8. **WorkflowRegistryImpl.register(workflow)**: *Asks* the **AhqWorkflow** for `getShortName()`, `getDescription()`, `getFullClaudeSkillCommand()`, and `getPluginDirectory()`, then *registers* a Commander subcommand that captures the workflow in its action closure.

**When the user runs `agentic-hq reversal -- --string-to-reverse='hello'`:**

9. Commander matches the "reversal" subcommand and fires the action closure
10. Closure *asks* the captured **AhqWorkflow** for `getFullClaudeSkillCommand()` → `/agentic-hq-demos-plugin:string-reversal`
11. Closure *asks* the captured **AhqWorkflow** for `getPluginDirectory()` → full absolute path like `/path/to/.agentic-hq/plugins/agentic-hq-demos-plugin`
12. Both are *passed* to `builder.build(fullClaudeSkillCommand, args, pluginDirectory)`
13. Builder assembles the claude command with `--plugin-dir` flags for: core-plugin (always), utilities-plugin (always), and the dynamic plugin directory from step 11

**How AhqWorkflow gets its PluginDirectory**: **PluginImpl** *passes* its **PluginDirectoryImpl** to the **AhqWorkflowImpl** constructor alongside the **AhqFile**. The `PluginDirectory` is a structural dependency (like metadata), not cached state.

---

## Project Design Requirements Compliance

- **DR.1 (class/interface pair)**: Every new concept has interface + Impl class. Tests type variables as the interface.
- **DR.2 (primitives wrapped)**: `PluginDirectory` wraps the directory path string.
- **DR.3 (minimal state, delegation, tell don't ask)**: No class stores intermediate state. Everything is discovered, created, and used dynamically within each method call. The execution path uses "tell don't ask" — `registerWorkflowsWith(registry)` passes down through the levels; no arrays are accumulated. The listing path follows the same principle — each level tells the level below to format itself.
- **DR.5 (switchability)**: Tests type variables as interfaces, not concrete classes. `WorkflowRegistry` is an interface — anyone can provide an alternative impl.
- **DR.6 (Impl naming)**: All new classes use `*Impl` suffix.
- **DR.7 (balance)**: `Workspace` shared between two impls; `Plugin` replaces `AhqWorkflows` rather than adding another layer.

---

## Test Files To Write (8 files)

For `registerWorkflowsWith()` tests: a simple `StubWorkflowRegistry` test fixture will be created that records registered workflows, allowing assertions on what was registered.

### 1. NEW: `tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts`
**Imports** (will fail — modules don't exist): `WorkspaceImpl`, `Workspace` interface
**Tests**:
- should format listing with workspace header containing display name and directory path
- should discover plugins and include per-plugin sections in listing
- should return empty listing body when no plugins exist in workspace
- should register all workflows from all plugins via registerWorkflowsWith()

### 2. NEW: `tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts`
**Imports** (will fail — modules don't exist): `CurrentUserWorkspaceImpl`, `Workspace` interface
**Tests**:
- should delegate to WorkspaceImpl and return plugin-grouped listing
- should return "Same as Agentic HQ Workspace" message when cwd equals AGENTIC_HQ_WORKSPACE_ROOT
- should return listing with "Local Workspace" header when different from AHQ workspace
- should register no workflows when same as AHQ workspace (no duplicates)

### 3. NEW: `tests/unit/workflow-discovery/plugin/plugin-impl.unit.test.ts`
**Imports** (will fail — modules don't exist): `PluginImpl`, `Plugin` from `src/workflow-discovery/plugin/`
**Tests**:
- should discover workflows within a plugin and return listing entries via getPluginListingString()
- should format listing under "Plugin: <name>" header
- should return empty listing when plugin has no ahq-workflow.json files
- should register each discovered workflow via registerWorkflowsWith(), each with the correct PluginDirectory

### 4. NEW: `tests/unit/workflow-discovery/plugin/plugin-directory-impl.unit.test.ts`
**Imports** (will fail — modules don't exist): `PluginDirectoryImpl`, `PluginDirectory` from `src/workflow-discovery/plugin/`
**Tests**:
- should return the full absolute plugin directory path via toString() (workspace root + .agentic-hq/plugins/ + plugin name)
- should find workflow files by delegating to AhqDirectory

### 5. MODIFY: `tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts`
**New imports** (will fail — `Workspace` doesn't exist): `Workspace` interface
**New tests** (will fail — `AhqWorkspaceImpl` doesn't implement `Workspace` yet):
- should implement Workspace and return listing with "Agentic HQ Workspace" header via getWorkflowListingString()
- should register discovered workflows via registerWorkflowsWith()

### 6. MODIFY: `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts`
**New tests** (will fail — behavior doesn't exist):
- should include both AHQ and user workspace sections with headers in getWorkflowsListingString()
- should show "same as AHQ workspace" message when directories match
- should register all discovered workflows from both workspaces via registerWorkflowsWith()

### 7. MODIFY: `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts`
**New tests** (will fail — methods are currently private / don't exist):
- should return short name via getShortName() (used by WorkflowRegistry for Commander subcommand name)
- should return description via getDescription() (used by WorkflowRegistry for Commander help text)
- should return full Claude skill command via getFullClaudeSkillCommand() (used by WorkflowRegistry for execution)
- should return plugin directory via getPluginDirectory() (used by WorkflowRegistry for `--plugin-dir` flag)

### 8. NEW: `tests/unit/cli/workflow-registry-impl.unit.test.ts`
**Imports** (will fail — modules don't exist): `WorkflowRegistryImpl` from `src/cli/`, `WorkflowRegistry` from `src/workflow-discovery/interfaces/`
**Tests**:
- should register a Commander subcommand when register(workflow) is called, using workflow.getShortName() as command name
- should call builder.build() with workflow.getFullClaudeSkillCommand() and workflow.getPluginDirectory() when the registered subcommand executes

---

## Expected RED Failures

- **New test files (1-4, 8)**: `Cannot find module` errors — the source files don't exist yet
- **Modified test files (5-7)**: Mix of `Cannot find module` (for new `Workspace` interface import) and assertion/type errors (methods don't exist on current classes)

---

## Test Infrastructure

- Reuse existing `tmpdirTest` fixture and `createTestWorkspaceFixture` (creates two plugins: test-plugin-alpha with 2 workflows, test-plugin-beta with 1)
- New `StubWorkflowRegistry` test fixture — implements `WorkflowRegistry`, records registered `AhqWorkflow` objects for test assertions
- Run tests via `pnpm test:unit` (existing vitest.unit.config.ts)
- No new dependencies needed

---

## Verification

1. Run `pnpm test:unit` — new tests should fail with "Cannot find module" or similar
2. Run `pnpm typecheck` — verify test files themselves are syntactically valid TypeScript (import errors are expected)
3. Existing tests must still pass (only adding new test cases, not modifying existing passing ones)

---

## Last Step: Recheck that all commands from 02-jira-write-failing-test.md have been executed
- Create RED phase document at `docs/jira-docs/AHQ-106/workflow-files/unit-test-files/02-red-phase-failing-tests.md`
- Add comment to Jira AHQ-106
- Write command-output.json
- Present to human
- Self-terminate

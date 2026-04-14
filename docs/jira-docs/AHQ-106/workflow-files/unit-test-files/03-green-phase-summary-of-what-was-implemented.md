# GREEN Phase Complete: AHQ-106 (unit test)

**Jira**: [AHQ-106](https://agentic-hq.atlassian.net/browse/AHQ-106)
**Test Type**: unit
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-04-07

---

## Implementation Created

**Files Created/Modified**:
- `src/workflow-discovery/interfaces/workspace.ts` - NEW: Workspace interface
- `src/workflow-discovery/interfaces/workflow-registry.ts` - NEW: WorkflowRegistry interface
- `src/workflow-discovery/interfaces/workflow-search-results.ts` - MODIFIED: added registerWorkflowsWith
- `src/workflow-discovery/interfaces/ahq-workflow.ts` - MODIFIED: added getShortName, getDescription, getFullClaudeSkillCommand, getPluginDirectory
- `src/workflow-discovery/plugin/plugin-directory.ts` - NEW: PluginDirectory interface
- `src/workflow-discovery/plugin/plugin-directory-impl.ts` - NEW: PluginDirectoryImpl class
- `src/workflow-discovery/plugin/plugin.ts` - NEW: Plugin interface
- `src/workflow-discovery/plugin/plugin-impl.ts` - NEW: PluginImpl class
- `src/workflow-discovery/workspace/workspace-impl.ts` - NEW: WorkspaceImpl class
- `src/workflow-discovery/workspace/current-user-workspace-impl.ts` - NEW: CurrentUserWorkspaceImpl class
- `src/workflow-discovery/workspace/ahq-workspace-impl.ts` - MODIFIED: now implements Workspace interface
- `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts` - MODIFIED: uses two Workspaces
- `src/workflow-discovery/workflow/ahq-workflow-impl.ts` - MODIFIED: accepts optional PluginDirectory, public methods
- `src/cli/workflow-registry-impl.ts` - NEW: WorkflowRegistryImpl class

**Test Command**: `pnpm test:unit`
**Test Result**: PASSING (142 tests, 35 files)

---

## What Was Implemented

The dynamic workflow discovery subsystem now supports two workspaces (AHQ + current user), per-plugin grouping, and CLI subcommand registration from discovered workflows. Nine new files were created (4 interfaces + 5 implementations) and five existing files were modified to support the new Workspace/Plugin/PluginDirectory/WorkflowRegistry concepts.

### Key implementation decisions:

1. **WorkspaceImpl is the generic workhorse**: Both `AhqWorkspaceImpl` and `CurrentUserWorkspaceImpl` delegate to `WorkspaceImpl` rather than duplicating plugin discovery logic. WorkspaceImpl scans `.agentic-hq/plugins/` using `fs.readdirSync` and creates `PluginImpl` for each directory found.

2. **PluginDirectoryImpl computes paths dynamically**: Per the "no cached state" design requirement, `toString()` computes the full path from workspace root + `.agentic-hq/plugins/` + plugin name on each call. `findWorkflowFiles()` delegates to `AhqDirectoryImpl` for the glob search.

3. **AhqWorkflowImpl accepts optional PluginDirectory**: The second constructor parameter is optional to preserve backward compatibility with existing code paths. New code (via PluginImpl) always passes a PluginDirectory. The `getPluginDirectory()` method throws if called without one.

4. **WorkflowRegistryImpl uses Commander's passThroughOptions + allowExcessArguments**: This allows args after `--` to be forwarded to `builder.build()` without Commander trying to parse or reject them.

5. **AhqWorkspaceImpl implements both AhqWorkspace and Workspace**: Keeps backward compatibility with existing `findFiles()` callers while adding the new Workspace interface. See REFACTOR suggestion below.

### Bugs found and fixed during GREEN:

1. **WorkflowRegistryImpl test used `{ from: 'user' }` with node/script prefix args** — Commander's `from: 'user'` treats all args as user args (no prefix skipping), so `['node', 'agentic-hq', 'reversal', ...]` failed because Commander tried to match 'node' as a subcommand. Fixed by removing `{ from: 'user' }` so Commander uses default `from: 'node'` which correctly skips the first two args. (`tests/unit/cli/workflow-registry-impl.unit.test.ts`)

2. **WorkflowSearchResults old tests didn't stub `process.cwd()`** — After adding `CurrentUserWorkspaceImpl` to `WorkflowSearchResultsImpl`, old tests that didn't mock `process.cwd()` would scan the real project directory and find 5 extra workflows (8 total instead of expected 3). Fixed by adding `process.cwd = () => tmpdir` to the 4 old tests, making `CurrentUserWorkspaceImpl` return "same as AHQ" message. (`tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts`)

3. **Commander subcommand needed `allowExcessArguments(true)`** — Without this, Commander throws `_excessArguments` when args after `--` are passed to a subcommand that doesn't define positional arguments. (`src/cli/workflow-registry-impl.ts`)

## Files Created

- `src/workflow-discovery/interfaces/workspace.ts` - Workspace interface (getWorkflowListingString, registerWorkflowsWith)
- `src/workflow-discovery/interfaces/workflow-registry.ts` - WorkflowRegistry interface (register)
- `src/workflow-discovery/plugin/plugin-directory.ts` - PluginDirectory interface (toString, findWorkflowFiles)
- `src/workflow-discovery/plugin/plugin-directory-impl.ts` - Computes path dynamically, delegates to AhqDirectoryImpl
- `src/workflow-discovery/plugin/plugin.ts` - Plugin interface (getPluginListingString, registerWorkflowsWith)
- `src/workflow-discovery/plugin/plugin-impl.ts` - Discovers workflows within a plugin, formats listing section
- `src/workflow-discovery/workspace/workspace-impl.ts` - Generic workspace: scans for plugins, delegates listing/registration
- `src/workflow-discovery/workspace/current-user-workspace-impl.ts` - User workspace from process.cwd(), "same as" detection
- `src/cli/workflow-registry-impl.ts` - Commander subcommand registration from discovered workflows

## Files Modified

- `src/workflow-discovery/interfaces/ahq-workflow.ts` - Added 4 new methods to interface
- `src/workflow-discovery/interfaces/workflow-search-results.ts` - Added registerWorkflowsWith method
- `src/workflow-discovery/workflow/ahq-workflow-impl.ts` - Optional PluginDirectory param, public getShortName/getDescription/getFullClaudeSkillCommand/getPluginDirectory
- `src/workflow-discovery/workspace/ahq-workspace-impl.ts` - Now also implements Workspace, delegates to WorkspaceImpl
- `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts` - Uses AhqWorkspaceImpl + CurrentUserWorkspaceImpl instead of single AhqWorkflowsImpl

---

## Suggested REFACTOR: Consolidate AhqWorkspace into Workspace

After GREEN, `AhqWorkspaceImpl` implements TWO interfaces:
- `AhqWorkspace` (from AHQ-104): `findFiles(globPattern)` — file-system concern
- `Workspace` (new in AHQ-106): `getWorkflowListingString()` + `registerWorkflowsWith()` — workflow-discovery concern

`AhqWorkspace.findFiles()` is now likely redundant because:
- Its only consumer `AhqWorkflowsImpl` is dead code (replaced by `PluginImpl` + `PluginDirectoryImpl` pipeline)
- File searching now happens at the `PluginDirectoryImpl` level (per-plugin), not workspace level

**Suggested REFACTOR actions:**
1. Delete `AhqWorkflowsImpl` (`src/workflow-discovery/workflow-listing/ahq-workflows-impl.ts`) — no production callers
2. Delete `AhqWorkflows` interface (`src/workflow-discovery/interfaces/ahq-workflows.ts`) — no longer needed
3. Remove `AhqWorkspace` interface and `implements AhqWorkspace` from `AhqWorkspaceImpl` — `findFiles()` superseded by `PluginDirectoryImpl.findWorkflowFiles()`
4. Update/delete the 2 existing `AhqWorkspace`-typed tests in `ahq-workspace-impl.unit.test.ts` (lines 38-94) — these test via the now-redundant `AhqWorkspace` interface

**Files affected:**
- `src/workflow-discovery/interfaces/ahq-workspace.ts` — DELETE
- `src/workflow-discovery/interfaces/ahq-workflows.ts` — DELETE
- `src/workflow-discovery/workflow-listing/ahq-workflows-impl.ts` — DELETE
- `src/workflow-discovery/workspace/ahq-workspace-impl.ts` — Remove `implements AhqWorkspace`
- `tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts` — Update/remove findFiles tests

---

## Ready for REFACTOR Phase

The test is passing. This program should self terminate, and then (if you are running the automated workflow) the following command will be run automatically:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-106 unit
```

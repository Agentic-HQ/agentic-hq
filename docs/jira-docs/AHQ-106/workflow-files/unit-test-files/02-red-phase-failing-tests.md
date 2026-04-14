# RED Phase Complete: AHQ-106 (unit test)

**Jira**: [AHQ-106](https://agentic-hq.atlassian.net/browse/AHQ-106)
**Test Type**: unit
**Phase**: RED (Failing Tests Written)
**Generated**: 2026-04-06

---

## Tests Created

### New Test Files (5)

| File | Class Under Test | Tests | Failure Reason |
|------|-----------------|-------|----------------|
| `tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts` | WorkspaceImpl | 4 | Cannot find module (WorkspaceImpl, Workspace, WorkflowRegistry don't exist) |
| `tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts` | CurrentUserWorkspaceImpl | 4 | Cannot find module (CurrentUserWorkspaceImpl, Workspace, WorkflowRegistry don't exist) |
| `tests/unit/workflow-discovery/plugin/plugin-impl.unit.test.ts` | PluginImpl | 4 | Cannot find module (PluginImpl, Plugin, WorkflowRegistry don't exist) |
| `tests/unit/workflow-discovery/plugin/plugin-directory-impl.unit.test.ts` | PluginDirectoryImpl | 2 | Cannot find module (PluginDirectoryImpl, PluginDirectory don't exist) |
| `tests/unit/cli/workflow-registry-impl.unit.test.ts` | WorkflowRegistryImpl | 2 | Cannot find module (WorkflowRegistryImpl, WorkflowRegistry don't exist) |

### Modified Test Files (3)

| File | Class Under Test | New Tests | Failure Reason |
|------|-----------------|-----------|----------------|
| `tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts` | AhqWorkspaceImpl | 2 | `workspace.getWorkflowListingString is not a function` / `workspace.registerWorkflowsWith is not a function` (Workspace interface not implemented yet) |
| `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts` | WorkflowSearchResultsImpl | 3 | Assertion failures (no workspace headers in output) / `searchResults.registerWorkflowsWith is not a function` |
| `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts` | AhqWorkflowImpl | 4 | `Expected 1 arguments, but got 2` (constructor doesn't accept PluginDirectory yet) / `Property 'getShortName' does not exist on type 'AhqWorkflow'` etc. |

### Test Run Summary

```
Test Files  8 failed | 27 passed (35)
     Tests  8 failed | 118 passed (126)
```

All 118 existing tests pass. 8 new tests fail for correct RED reasons.

### TypeScript Compilation Summary

27 TypeScript errors — all expected:
- "Cannot find module" for non-existent interfaces/impls (Workspace, WorkflowRegistry, Plugin, PluginDirectory, WorkspaceImpl, CurrentUserWorkspaceImpl, PluginImpl, PluginDirectoryImpl, WorkflowRegistryImpl)
- "Property does not exist on type" for methods not yet on existing interfaces (getShortName, getDescription, getFullClaudeSkillCommand, getPluginDirectory on AhqWorkflow; registerWorkflowsWith on WorkflowSearchResults)
- "Expected 1 arguments, but got 2" for AhqWorkflowImpl constructor (doesn't accept PluginDirectory yet)

---

## Files Created/Modified

### New Files
- `tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts` — Tests generic WorkspaceImpl (listing, plugin discovery, registerWorkflowsWith)
- `tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts` — Tests CurrentUserWorkspaceImpl (delegation, "Same as AHQ" message, "Local Workspace" header)
- `tests/unit/workflow-discovery/plugin/plugin-impl.unit.test.ts` — Tests PluginImpl (workflow discovery, plugin header, registerWorkflowsWith)
- `tests/unit/workflow-discovery/plugin/plugin-directory-impl.unit.test.ts` — Tests PluginDirectoryImpl (full path, find workflow files)
- `tests/unit/cli/workflow-registry-impl.unit.test.ts` — Tests WorkflowRegistryImpl (Commander subcommand registration, builder.build execution)

### Modified Files
- `tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts` — Added Workspace interface tests (getWorkflowListingString, registerWorkflowsWith)
- `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts` — Added workspace grouping and registerWorkflowsWith tests
- `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts` — Added getShortName, getDescription, getFullClaudeSkillCommand, getPluginDirectory tests

**Note**: No skeleton/implementation files created in RED phase -- that's GREEN phase work.

## Ready for GREEN Phase

Run the next command to implement code to pass these tests:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-106 unit
```

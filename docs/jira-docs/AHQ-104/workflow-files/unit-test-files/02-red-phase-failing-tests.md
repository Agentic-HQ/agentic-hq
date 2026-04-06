# RED Phase Complete: AHQ-104 (unit test)

**Jira**: [AHQ-104](https://agentic-hq.atlassian.net/browse/AHQ-104)
**Test Type**: unit
**Phase**: RED (Failing Tests Written)
**Generated**: 2026-04-04

---

## Tests Created (12 files, 34 tests total)

**Test Pattern** (applied to all 12 files):
- Import interface as `type` from `src/workflow-discovery/interfaces/` — used for variable typing
- Import `*Impl` class from its entity dir (`workflow/`, `workflow-listing/`, `workspace/`) — used ONLY for construction
- Variables typed through the interface contract; methods called via the interface

### workflow/ (8 files, 21 tests)
| File | # | Tests |
|------|---|-------|
| `workflow-short-name-impl.unit.test.ts` | 3 | toString() returns value; throws on empty; throws on whitespace-only |
| `workflow-description-impl.unit.test.ts` | 3 | toString() returns value; throws on empty; throws on whitespace-only |
| `example-parameters-impl.unit.test.ts` | 2 | toString() returns value; allows empty string |
| `plugin-id-impl.unit.test.ts` | 3 | toString() returns value; throws on empty; throws on whitespace-only |
| `skill-id-impl.unit.test.ts` | 3 | toString() returns value; throws on empty; throws on whitespace-only |
| `skill-full-claude-command-impl.unit.test.ts` | 1 | constructs `/{pluginId}:{skillId}` via toString() |
| `example-command-impl.unit.test.ts` | 2 | constructs `agentic-hq {name}{params}`; handles no parameters |
| `ahq-workflow-impl.unit.test.ts` | 4 | constructs from AhqFile with value objects; throws on missing shortId; throws on invalid JSON; displayYourself() renders line |

### workspace/ (2 files, 5 tests)
| File | # | Tests |
|------|---|-------|
| `ahq-file-impl.unit.test.ts` | 3 | getPath() returns path; readContent() reads file; throws on empty path |
| `ahq-workspace-impl.unit.test.ts` | 2 | resolves root from AGENTIC_HQ_WORKSPACE_ROOT env var; findFiles() returns AhqFile[] from glob |

### workflow-listing/ (2 files, 8 tests)
| File | # | Tests |
|------|---|-------|
| `ahq-workflows-impl.unit.test.ts` | 4 | discovers & counts workflows; skips skill dirs without ahq-workflow.json; returns empty when none found; displayThemselves() includes all |
| `workflow-search-results-impl.unit.test.ts` | 4 | formats with header/names/paths/descriptions; has Example: line per workflow; aligned columns; header-only when empty |

### Test Fixture Helpers

- `writeTempFilePath(content)` / `writeTempJsonPath(data)` — create a unique-UID temp dir with a single file (used in AhqFile and AhqWorkflow tests)
- `createTestWorkspaceFixture(rootDir)` — builds the `.agentic-hq/plugins/{plugin}/skills/{skill}/ahq-workflow.json` tree with 2 plugins (alpha with 2 workflows + 1 skill without json, beta with 1 workflow) — shared between AhqWorkflows and WorkflowSearchResults tests
- Temp dirs all use `fs.mkdtempSync(path.join(os.tmpdir(), 'ahq-test-...-'))` for unique UIDs to avoid parallel test clashes
- Env var `AGENTIC_HQ_WORKSPACE_ROOT` set in beforeEach, cleared in afterEach

**Failure Output** (all 12 files — compilation error expected, no source files exist yet):
```
Error: Cannot find module '../../../../src/workflow-discovery/interfaces/workflow-short-name.js'
Error: Cannot find module '../../../../src/workflow-discovery/interfaces/workflow-description.js'
Error: Cannot find module '../../../../src/workflow-discovery/interfaces/example-parameters.js'
Error: Cannot find module '../../../../src/workflow-discovery/interfaces/plugin-id.js'
Error: Cannot find module '../../../../src/workflow-discovery/interfaces/skill-id.js'
Error: Cannot find module '../../../../src/workflow-discovery/interfaces/skill-full-claude-command.js'
Error: Cannot find module '../../../../src/workflow-discovery/interfaces/example-command.js'
Error: Cannot find module '../../../../src/workflow-discovery/interfaces/ahq-workflow.js'
Error: Cannot find module '../../../../src/workflow-discovery/interfaces/ahq-workflows.js'
Error: Cannot find module '../../../../src/workflow-discovery/interfaces/ahq-workspace.js'
Error: Cannot find module '../../../../src/workflow-discovery/interfaces/ahq-file.js'
Error: Cannot find module '../../../../src/workflow-discovery/interfaces/workflow-search-results.js'
Error: Cannot find module '../../../../src/workflow-discovery/workflow/workflow-short-name-impl.js'
Error: Cannot find module '../../../../src/workflow-discovery/workflow/ahq-workflow-impl.js'
Error: Cannot find module '../../../../src/workflow-discovery/workspace/ahq-file-impl.js'
Error: Cannot find module '../../../../src/workflow-discovery/workspace/ahq-workspace-impl.js'
Error: Cannot find module '../../../../src/workflow-discovery/workflow-listing/ahq-workflows-impl.js'
Error: Cannot find module '../../../../src/workflow-discovery/workflow-listing/workflow-search-results-impl.js'
(etc. — 12 interfaces + 12 impl classes, all non-existent)
```

---

## Refactor List (for REFACTOR stage)

- **Create `AhqFiles` interface and `AhqFilesImpl` class**: `AhqWorkspace.findFiles()` currently returns `AhqFile[]` (raw array). In the refactor stage, wrap this array in a proper domain collection — `AhqFiles` / `AhqFilesImpl` — following the same pattern as `AhqWorkflows` wrapping a collection of `AhqWorkflow` objects. This avoids passing raw arrays around the system and allows behavior to be pushed into the collection (e.g., `findFiles(...).someCollectionOperation()`).

---

## Files Created

- 12 test files in `tests/unit/workflow-discovery/{workflow,workflow-listing,workspace}/`

**Note**: No implementation files created in RED phase — that's GREEN phase work.

## Ready for GREEN Phase

Run the next command to implement code to pass these tests:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-104 unit
```

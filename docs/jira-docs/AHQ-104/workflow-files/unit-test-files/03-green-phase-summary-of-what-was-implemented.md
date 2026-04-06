# GREEN Phase Complete: AHQ-104 (unit test)

**Jira**: [AHQ-104](https://agentic-hq.atlassian.net/browse/AHQ-104)
**Test Type**: unit
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-04-04

---

## Implementation Created

**Source files created** (13 interfaces + 13 Impl classes in `src/workflow-discovery/`):

Interfaces (`src/workflow-discovery/interfaces/`):
- `workflow-short-name.ts`, `workflow-description.ts`, `example-parameters.ts`, `plugin-id.ts`, `skill-id.ts`, `full-claude-skill-command.ts`, `example-command.ts`, `ahq-workflow.ts`, `ahq-file.ts`, `json-file.ts`, `ahq-workspace.ts`, `ahq-workflows.ts`, `workflow-search-results.ts`

Impls:
- `src/workflow-discovery/workflow/`: `workflow-short-name-impl.ts`, `workflow-description-impl.ts`, `example-parameters-impl.ts`, `plugin-id-impl.ts`, `skill-id-impl.ts`, `full-claude-skill-command-impl.ts`, `example-command-impl.ts`, `ahq-workflow-impl.ts`
- `src/workflow-discovery/workspace/`: `ahq-file-impl.ts`, `json-file-impl.ts`, `ahq-workspace-impl.ts`
- `src/workflow-discovery/workflow-listing/`: `ahq-workflows-impl.ts`, `workflow-search-results-impl.ts`

**Test Command**: `pnpm test`
**Test Result**: ✅ PASSING (102/102 tests, 27 test files)
**Validate Result**: ✅ PASSING (typecheck + lint + format + tests all pass)

---

## What Was Implemented

A dynamic workflow-discovery subsystem that scans an `AhqWorkspace` for `.agentic-hq/plugins/*/skills/*/ahq-workflow.json` files and builds a collection of `AhqWorkflow` objects. Each workflow can render itself for CLI display. The implementation is a deep class/interface pair structure with 13 concepts following the project's OO design rules — minimal state, "tell don't ask" delegation, value objects wrapping every string, and `*Impl` naming.

### Key implementation decisions:

1. **Delegation via `JsonFile`** — `AhqWorkflowImpl` stores *only* a `JsonFile` reference, not parsed fields. Each getter calls `jsonFile.get(FIELD_CONSTANT)` on demand and wraps the result in a fresh value object. This honours design requirement D.3 (minimal state / avoid caching) and was introduced per human feedback during planning.
2. **Field IDs as top-of-file constants** — `PLUGIN_ID_JSON_FIELD_ID = 'pluginId'` etc. in `ahq-workflow-impl.ts` so the JSON-field coupling lives in one visible place.
3. **Minimal `shortId` constructor guard** — `AhqWorkflowImpl` constructor makes one `jsonFile.get(SHORT_ID_JSON_FIELD_ID)` call so the "throws on missing shortId" test fails fast at construction time. No other eager validation (per user: don't add work that wasn't asked for).
4. **Manual glob walker in `AhqWorkspaceImpl.findFiles()`** — splits the pattern by `/`, walks each segment, expands `*` via `fs.readdirSync`. No glob-library dependency. Matches the exact pattern `.agentic-hq/plugins/*/skills/*/ahq-workflow.json` used by the production callers.
5. **`ExampleCommand` separator lives in code, not data** — `ExampleParametersImpl` holds the raw params string (e.g. `-- --input-number=54321`, no leading space); `ExampleCommandImpl` injects a space between shortName and params, omitting it when params is empty.
6. **`count()` removed from `AhqWorkflows`** — initially added to satisfy RED-phase test assertions, but no production code calls it. Removed per `feedback_no_test_only_production_methods.md`. The 3 discovery tests were rewritten to verify behavior through `displayYourselves()` output instead.

### Bugs found and fixed during GREEN:

1. **Missing-shortId test failed** on first test run — `AhqWorkflowImpl` constructor did nothing beyond creating the `JsonFile`, so construction with missing `shortId` didn't throw. Fixed by adding a single `this.jsonFile.get(SHORT_ID_JSON_FIELD_ID)` call in the constructor (the RED test specifically requires the *constructor* to throw, not just a later getter).
2. **Prettier formatting** required on 2 test files after the test-file rewrites — ran prettier on only those 2 modified files (per CLAUDE.md rule, do not mass-format unrelated files).

## Files Created

- 13 interface files under `src/workflow-discovery/interfaces/`
- 13 Impl class files under `src/workflow-discovery/{workflow,workflow-listing,workspace}/`

## Files Modified

- `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts` — renamed `getSkillFullClaudeCommand()` → `getFullClaudeSkillCommand()`; removed leading space from `exampleParameters` test data; prettier-formatted.
- `tests/unit/workflow-discovery/workflow/example-parameters-impl.unit.test.ts` — removed leading space from params string.
- `tests/unit/workflow-discovery/workflow/example-command-impl.unit.test.ts` — removed leading space from params string.
- `tests/unit/workflow-discovery/workflow-listing/ahq-workflows-impl.unit.test.ts` — renamed `displayThemselves()` → `displayYourselves()`; removed `count()` assertions and rewrote the 3 discovery tests to assert via `displayYourselves()` output; removed leading spaces from `exampleParameters` test data; prettier-formatted.
- `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts` — removed leading spaces from `exampleParameters` test data.

## Files Renamed

- `tests/unit/workflow-discovery/workflow/skill-full-claude-command-impl.unit.test.ts` → `full-claude-skill-command-impl.unit.test.ts` (class rename `SkillFullClaudeCommand` → `FullClaudeSkillCommand`).

---

## Ready for REFACTOR Phase

The test is passing. This program should self terminate, and then (if you are running the automated workflow) the following command will be run automatically:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-104 unit
```

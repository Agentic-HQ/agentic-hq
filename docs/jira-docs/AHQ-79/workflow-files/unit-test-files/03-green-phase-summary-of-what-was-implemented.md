# GREEN Phase Complete: AHQ-79 (unit test)

**Jira**: [AHQ-79](https://agentic-hq.atlassian.net/browse/AHQ-79)
**Test Type**: unit
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-03-04

---

## Implementation Created

**Files Created/Modified**:
- `src/config/agentic-hq-config.ts` - New AgenticHqConfig class with 5 methods resolving the three-roots problem

**Test Command**: `pnpm test:unit`
**Test Result**: PASSING (9/9 tests — 6 new + 3 existing)

---

## What Was Implemented

Created the `AgenticHqConfig` class that resolves the "three roots problem" by providing explicit methods for the agentic-hq workspace root (where source + plugins live), the current workspace root (user's git project), and derived paths (plugins dir, temp dir, project working dir). The class reads the `AGENTIC_HQ_WORKSPACE_ROOT` env var when available, falling back to `git rev-parse --show-toplevel`.

### Key implementation decisions:

1. **Minimal class, no constructor**: The class has no constructor parameters — all state comes from env vars and git commands at call time, matching what the tests expect.
2. **No changes to other files**: The unit tests only test `AgenticHqConfig` in isolation. Changes to `bin/agentic-hq.cjs`, `ClaudeCodeTool.ts`, demo CLIs, and install scripts are NOT needed for the unit test to pass and would be gold-plating.
3. **Direct `execSync` calls**: Used `execSync('git rev-parse --show-toplevel')` directly rather than importing from `git-utils.ts`, keeping the implementation self-contained and matching the test expectations.

### Bugs found and fixed during GREEN:

None - implementation went as planned.

## Files Created

- `src/config/agentic-hq-config.ts` - AgenticHqConfig class with `getAgenticHqWorkspaceRoot()`, `getAgenticHqPluginsDir()`, `getCurrentWorkspaceRoot()`, `getAgenticHqTempDir()`, `getProjectWorkingDir()`

## Files Modified

None.

---

## Ready for REFACTOR Phase

The test is passing. This program should self terminate, and then (if you are running the automated workflow) the following command will be run automatically:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-79 unit
```

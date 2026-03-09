# RED Phase Complete: AHQ-79 (unit test)

**Jira**: [AHQ-79](https://agentic-hq.atlassian.net/browse/AHQ-79)
**Test Type**: unit
**Phase**: RED (Failing Test Written)
**Generated**: 2026-03-04

---

## Test Created

**File**: `tests/unit/config/agentic-hq-config.unit.test.ts`

**Tests** (6 tests in one file, per Jira's "one TDD cycle" note):
1. `getAgenticHqWorkspaceRoot()` returns env var value when `AGENTIC_HQ_WORKSPACE_ROOT` is set
2. `getAgenticHqWorkspaceRoot()` falls back to `git rev-parse` when env var is not set
3. `getAgenticHqPluginsDir()` returns workspace root + `/.agentic-hq/plugins`
4. `getCurrentWorkspaceRoot()` returns git root of current working directory
5. `getAgenticHqTempDir()` returns current workspace root + `/.agentic-hq/temp`
6. `getProjectWorkingDir()` returns current workspace root

**Failure Output** (compilation error expected):
```
Error: Cannot find module '../../../src/config/agentic-hq-config.js' imported from '/Users/stevepersonal/dev/agentic-hq/agentic-hq/tests/unit/config/agentic-hq-config.unit.test.ts'
```

**TypeScript check** (`pnpm typecheck`):
```
tests/unit/config/agentic-hq-config.unit.test.ts(19,33): error TS2307: Cannot find module '../../../src/config/agentic-hq-config.js' or its corresponding type declarations.
```

**Existing tests**: All 3 existing unit tests still pass (no regressions).

---

## Files Created

- `tests/unit/config/agentic-hq-config.unit.test.ts` - Unit tests for AgenticHqConfig class

**Note**: No skeleton/implementation files created in RED phase - that's GREEN phase work.

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-79 unit
```

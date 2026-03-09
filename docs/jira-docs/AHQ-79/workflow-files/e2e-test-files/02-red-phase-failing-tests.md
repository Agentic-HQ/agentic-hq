# RED Phase Complete: AHQ-79 (e2e test)

**Jira**: [AHQ-79](https://agentic-hq.atlassian.net/browse/AHQ-79)
**Test Type**: e2e
**Phase**: RED (Failing Test Written)
**Generated**: 2026-03-04

---

## Test Created

**File**: `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts`
**Tests**: Verifies that the agentic-hq CLI can reverse a string when run from a separate workspace via the globally-linked binary, proving the "three roots problem" is solved.

**Failure Output** (missing implementation file — expected):
```
Error: Command failed: bash /Users/stevepersonal/dev/agentic-hq/agentic-hq/scripts/infra/install-dev-agentic-hq.sh
bash: /Users/stevepersonal/dev/agentic-hq/agentic-hq/scripts/infra/install-dev-agentic-hq.sh: No such file or directory
```

---

## Files Created/Modified

- `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` - E2E test for cross-workspace string reversal
- `tests/e2e/helpers/cli-test-helper-functions.ts` - Added optional `workingDirectory` parameter to `runCliAndLogOutput`
- `tests/unit/e2e-helpers/run-cli-and-log-output.unit.test.ts` - Added unit test for `workingDirectory` parameter
- `package.json` - Added `test:e2e:cross-workspace-string-reversal` script

**Note**: No skeleton/implementation files created in RED phase — that's GREEN phase work.

## Test Infrastructure Mini-TDD Cycle

The `runCliAndLogOutput` helper needed a `workingDirectory` parameter (test infrastructure, not production code). Completed a mini-TDD cycle:
- **RED**: Unit test for `workingDirectory` failed (pwd returned repo root, not /tmp)
- **GREEN**: Added optional 4th parameter with `workingDirectory ?? process.cwd()` fallback
- **VERIFY**: All 10 unit tests pass

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-79 e2e
```

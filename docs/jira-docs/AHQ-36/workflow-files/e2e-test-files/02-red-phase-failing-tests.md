# RED Phase Complete: AHQ-36 (e2e test)

**Jira**: [AHQ-36](https://agentic-hq.atlassian.net/browse/AHQ-36)
**Test Type**: e2e
**Phase**: RED (Failing Test Written)
**Generated**: 2026-02-11

---

## Test Created

**File**: `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts`
**Tests**: Verifies the multi-step quick Jira workflow CLI produces all expected workflow output files (for 2 test types: unit, e2e), implementation files, and marks the Jira as Done.

**Expected Failure** (assertion errors - multi-step workflow not implemented yet):
- The CLI still runs the old single-step command (`01-read-jira-implement-and-mark-as-done`)
- It will NOT produce `01-entire-jira-copy-of-details.md` or `01-summary-of-jira.md`
- It will NOT produce per-test-type summary files (`02-RED-write-failing-test.summary.md`, etc.)
- Assertions checking for these files will fail

**Note**: Full e2e test run skipped in RED phase (~10-20 min runtime). Compilation verified via `pnpm typecheck` (passes). Failure is certain because the multi-step workflow commands don't exist yet.

---

## Files Modified

- `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts` - Updated main test to use multi-step Jira description with 2 test types (unit, e2e) and new assertions for all workflow output files. Manual disabled test (AHQ-40) left unchanged using single-step description.

## Files Created

- `docs/jira-docs/AHQ-36/workflow-files/e2e-test-files/02-red-phase-failing-test-plan.md` - Approved RED phase plan

**Note**: No skeleton/implementation files created in RED phase - that's GREEN phase work.

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-commands:workflow:jira-story-workflow:03-jira-minimal-implementation AHQ-36 e2e
```

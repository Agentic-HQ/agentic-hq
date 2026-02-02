# RED Phase Complete: AHQ-10 (e2e test)

**Jira**: [AHQ-10](https://agentic-hq.atlassian.net/browse/AHQ-10)
**Test Type**: e2e
**Phase**: RED (Failing Test Written)
**Generated**: 2026-02-01

---

## Test Created

**File**: `tests/e2e/demo/demo-math-workflow-gives-expected-output-number.e2e.test.ts`
**Tests**: Verifies the math workflow CLI processes input 11 through 3 steps (×2, +3, ÷5) and outputs "Output number: 5"

**Failure Output** (missing script - as expected):
```
Error: Command failed: pnpm demo:math-workflow --input-number=11
 ERR_PNPM_NO_SCRIPT  Missing script: demo:math-workflow
```

---

## Files Created/Modified

- `tests/e2e/demo/demo-math-workflow-gives-expected-output-number.e2e.test.ts` - E2E test that runs the CLI and checks output
- `package.json` - Added `test:e2e:demo-math-workflow` script

**Note**: No implementation files created in RED phase - that's GREEN phase work.

---

## Verification Completed

- ✅ TypeScript compiles (`pnpm typecheck` passes)
- ✅ Test runs and FAILS with expected error (missing `demo:math-workflow` script)
- ✅ All existing tests still pass (`pnpm validate` passes)

---

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-commands:workflow:jira-story-workflow:03-jira-minimal-implementation AHQ-10 e2e
```

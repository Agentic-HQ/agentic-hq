# RED Phase Complete: AHQ-81 (e2e test)

**Jira**: [AHQ-81](https://agentic-hq.atlassian.net/browse/AHQ-81)
**Test Type**: e2e
**Phase**: RED (Failing Test Written)
**Generated**: 2026-03-10

---

## Test Created

**File**: `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts`
**Tests**: Verifies that the math workflow (3-step chain: x2, +3, /5) works from a separate workspace via the globally-linked agentic-hq binary. Input: 11, Expected output: 5 (11 x2=22, +3=25, /5=5).

**Failure Output** (skill not found — implementation doesn't exist yet):
```
Unknown skill: agentic-hq-demos-plugin:math-workflow
```

The test timed out (ETIMEDOUT at 240s) because Claude Code continued running after reporting the unknown skill. The root cause is correct: the math-workflow skill doesn't exist yet.

---

## Files Created

- `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` - Cross-workspace e2e test for math workflow
- `docs/jira-docs/AHQ-81/workflow-files/e2e-test-files/02-red-phase-failing-test-plan-copy.md` - Approved plan copy

## Files Modified

- `package.json` - Added `test:e2e:cross-workspace-demo-math-workflow` script

**Note**: No skeleton/implementation files created in RED phase — that's GREEN phase work.

## TypeScript Validation

`pnpm typecheck` passes with no errors — test file is valid TypeScript.

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-81 e2e
```

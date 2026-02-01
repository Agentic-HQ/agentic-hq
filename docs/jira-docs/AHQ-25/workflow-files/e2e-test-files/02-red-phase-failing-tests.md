# RED Phase Complete: AHQ-25 (e2e test)

**Jira**: [AHQ-25](https://agentic-hq.atlassian.net/browse/AHQ-25)
**Test Type**: e2e
**Phase**: RED (Failing Test Written)
**Generated**: 2026-02-01

---

## Test Created

**File**: `tests/e2e/demo/demo-string-reversal-cli-reverses-string.e2e.test.ts`
**Tests**: Verifies the demo CLI reverses user-provided string and outputs the result

**Failure Output** (script not found - expected):
```
Error: Command failed: pnpm demo:string-reversal --string-to-reverse="this is a test string"
 ERR_PNPM_NO_SCRIPT  Missing script: demo:string-reversal
```

---

## Files Created

- `vitest.e2e.config.ts` - E2E test configuration (no global timeouts, sequential execution)
- `tests/e2e/demo/demo-string-reversal-cli-reverses-string.e2e.test.ts` - E2E test for demo CLI
- Updated `package.json` with `test:e2e` and `test:e2e:demo-string-reversal` scripts

**Note**: No skeleton/implementation files created in RED phase - that's GREEN phase work.

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-commands:workflow:jira-story-workflow:03-jira-minimal-implementation AHQ-25 e2e
```

# RED Phase Complete: AHQ-37 (e2e test)

**Jira**: [AHQ-37](https://agentic-hq.atlassian.net/browse/AHQ-37)
**Test Type**: e2e
**Phase**: RED (Failing Test Written)
**Generated**: 2026-02-08

---

## Test Created

**File**: `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts`
**Tests**: Verifies the quick Jira workflow demo CLI can accept a test Jira ID, run a single-step workflow command, produce expected files (hello-world.cli.ts + summary doc), and transition the Jira to Done.

**Failure Output** (command not found - as expected):
```
Error: Demo CLI failed: pnpm demo:quick-jira-workflow --jira-id=TEST-16 --project-root=...

stdout:
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "demo:quick-jira-workflow" not found
```

The test correctly:
1. Created a test Jira (TEST-16) using the AHQ-38 helper command
2. Failed at `execSync('pnpm demo:quick-jira-workflow ...')` with clear error: `Command "demo:quick-jira-workflow" not found` (pnpm script doesn't exist - that's GREEN phase work)

TypeScript type checking: PASSED (no errors)

---

## Files Created

- `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts` - E2E test file
- `package.json` - Added `test:e2e:demo-quick-jira-workflow` script (test infrastructure only)

**Note**: No skeleton/implementation files created in RED phase - that's GREEN phase work.

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-commands:workflow:jira-story-workflow:03-jira-minimal-implementation AHQ-37 e2e
```

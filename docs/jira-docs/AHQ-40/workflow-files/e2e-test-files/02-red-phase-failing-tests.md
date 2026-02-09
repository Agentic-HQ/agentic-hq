# RED Phase Complete: AHQ-40 (e2e test)

**Jira**: [AHQ-40](https://agentic-hq.atlassian.net/browse/AHQ-40)
**Test Type**: e2e
**Phase**: RED (Failing Test Written)
**Generated**: 2026-02-08

---

## Test Created

**File**: `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts`
**Tests**: Verifies that when the quick Jira workflow demo CLI is run without `--project-root`, it defaults to using the closest `.git` root parent directory as the project root.

**Failure Output** (required option error as expected):
```
Error: Demo CLI failed (without --project-root): /Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.bin/tsx /Users/stevepersonal/dev/agentic-hq/agentic-hq/src/demo/cli/quick-jira-workflow-demo-cli.ts --jira-id=TEST-23

stderr:
error: required option '--project-root <string>' not specified
```

---

## Files Created

- `tests/shared/fixtures.ts` - Shared Vitest `test.extend()` fixture providing a temp git directory with auto-cleanup (reusable by all test types)
- `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts` - Added new test case "should use git directory when project-root not provided"
- `package.json` - Added `test:e2e:demo-quick-jira-workflow:expected-files-test` and `test:e2e:demo-quick-jira-workflow:default-project-root-test` pnpm scripts

**Note**: No skeleton/implementation files created in RED phase - that's GREEN phase work.

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-commands:workflow:jira-story-workflow:03-jira-minimal-implementation AHQ-40 e2e
```

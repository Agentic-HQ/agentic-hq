# RED Phase Complete: AHQ-38 (integration test)

**Jira**: [AHQ-38](https://agentic-hq.atlassian.net/browse/AHQ-38)
**Test Type**: integration
**Phase**: RED (Failing Test Written)
**Generated**: 2026-02-07

---

## Test Created

**File**: `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts`
**Tests**: Verifies that create-test-jira creates a Jira in the TEST project and get-jira-status returns "Backlog" for the newly created Jira.

**Failure Output** (command not found - expected):
```
Unknown skill: agentic-hq-commands:used-in-tests:jira-helper-commands:create-test-jira

Test timed out in 60000ms - Claude Code could not find the command (it doesn't exist yet),
never wrote command-output.json, so ClaudeCodeTool.execute() never resolved.
```

---

## Files Created

- `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts` - Integration test that exercises both custom commands sequentially

## Files Modified

- `package.json` - Added `test:integration:create-test-jira-and-get-status` script

**Note**: No skeleton/implementation files created in RED phase - that's GREEN phase work.

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-commands:workflow:jira-story-workflow:03-jira-minimal-implementation AHQ-38 integration
```

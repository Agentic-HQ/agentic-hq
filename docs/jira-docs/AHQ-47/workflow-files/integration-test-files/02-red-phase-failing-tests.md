# RED Phase Complete: AHQ-47 (integration test)

**Jira**: [AHQ-47](https://agentic-hq.atlassian.net/browse/AHQ-47)
**Test Type**: integration
**Phase**: RED (Failing Test Written)
**Generated**: 2026-02-16

---

## Test Created

**File**: `tests/integration/claude-code-tool/real-claude-self-termination-skill.integration.test.ts`
**Tests**: Verifies that ClaudeCodeTool can execute a command that invokes the self-termination skill, causing Claude to terminate and return control to the test within 30 seconds.

**Failure Output** (timeout - command doesn't exist yet):
```
Unknown skill: agentic-hq-commands:used-in-tests:integration:just-self-terminate-using-skill
Error: Test timed out in 30000ms.
```

---

## Files Created

- `tests/integration/claude-code-tool/real-claude-self-termination-skill.integration.test.ts` - Integration test for self-termination via plugin skill
- `package.json` - Added `test:integration:real-claude-self-termination-skill` script

**Note**: No skeleton/implementation files created in RED phase - that's GREEN phase work.

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-commands:used-in-demos:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-47 integration
```

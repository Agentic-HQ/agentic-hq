# GREEN Phase Complete: AHQ-38 (integration test)

**Jira**: [AHQ-38](https://agentic-hq.atlassian.net/browse/AHQ-38)
**Test Type**: integration
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-02-07

---

## Implementation Created

**Files Created/Modified**:
- `.claude/commands/agentic-hq-commands/used-in-tests/jira-helper-commands/create-test-jira.md` - Custom command that creates a Jira in the TEST project
- `.claude/commands/agentic-hq-commands/used-in-tests/jira-helper-commands/get-jira-status.md` - Custom command that gets a Jira's status
- `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts` - Timeout increased from 60s to 120s

**Test Command**: `pnpm test:integration:create-test-jira-and-get-status`
**Test Result**: ✅ PASSING (56.6s)
**All Integration Tests**: ✅ 4/4 PASSING

---

## What Was Implemented

Two Claude Code custom command markdown files following the established file-based I/O pattern (same as div-five.md and reverse-a-string.md):

1. **create-test-jira.md** - Reads input string with "Title: ... Description: ..." format, creates a Jira in the TEST project using MCP Jira tools, outputs only the Jira key (e.g. "TEST-123")
2. **get-jira-status.md** - Reads Jira ID from input string, gets the issue status using MCP Jira tools, outputs only the status name (e.g. "Backlog")

Both commands self-terminate after writing output.

**Note**: The test timeout was increased from 60s to 120s because real Claude Code + Jira MCP calls take ~57s, leaving insufficient margin at 60s.

**Note**: `mcp__mcp-atlassian__jira_create_issue` permission was added to `.claude/settings.local.json` (by human) to allow the create-test-jira command to work non-interactively.

## Files Created

- `.claude/commands/agentic-hq-commands/used-in-tests/jira-helper-commands/create-test-jira.md` - Custom command to create test Jiras
- `.claude/commands/agentic-hq-commands/used-in-tests/jira-helper-commands/get-jira-status.md` - Custom command to get Jira status

---

## Ready for REFACTOR Phase

The test is passing. Now review and refactor the code:
```
/agentic-hq-commands:workflow:jira-story-workflow:04a-jira-refactor-analysis AHQ-38 integration
```

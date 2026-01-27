# GREEN Phase Complete: AHQ-8 (integration test)

**Jira**: [AHQ-8](https://agentic-hq.atlassian.net/browse/AHQ-8)
**Test Type**: integration
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-01-25 (retroactively documented)

---

## Implementation Created

**Files Created/Modified**:
- `src/tools/claude-code/ClaudeCodeTool.ts` - Added `ExecuteHandle` interface with `finished` promise and `kill()` method
- `.claude/commands/agentic-hq-commands/used-in-tests/integration/just-self-terminate.md` - Command file for self-termination test
- `tests/integration/claude-code-tool/real-claude-self-termination.integration.test.ts` - Integration test using `.finished` pattern
- `package.json` - Added `test:integration:real-claude-self-termination` script

**Test Command**: `pnpm test:integration:real-claude-self-termination`
**Test Result**: PASSING (~11 seconds)

---

## What Was Implemented

### ExecuteHandle Interface

The `execute()` method now returns an `ExecuteHandle` object with two capabilities:

1. **`finished: Promise<string>`** - Resolves when Claude exits naturally (for self-terminating commands)
2. **`kill(): string`** - Kills Claude immediately and returns accumulated output (for commands where Claude waits for more input)

This design supports both test patterns:
- AHQ-8 test: `await tool.execute(cmd).finished` - waits for self-termination
- AHQ-24 test: `handle.kill()` after timeout - for math prompts where Claude doesn't exit

### Command File

Created `.claude/commands/agentic-hq-commands/used-in-tests/integration/just-self-terminate.md` which instructs Claude to call the kill script with `$PPID`.

---

## Files Created

- `src/tools/claude-code/ClaudeCodeTool.ts` - Core implementation with ExecuteHandle
- `.claude/commands/agentic-hq-commands/used-in-tests/integration/just-self-terminate.md` - Self-terminate command
- `tests/integration/claude-code-tool/real-claude-self-termination.integration.test.ts` - Integration test

---

## Ready for REFACTOR Phase

The test is passing. Now review and refactor the code:
```
/agentic-hq-commands:workflow:jira-story-workflow:04a-jira-refactor-analysis AHQ-8 integration
```

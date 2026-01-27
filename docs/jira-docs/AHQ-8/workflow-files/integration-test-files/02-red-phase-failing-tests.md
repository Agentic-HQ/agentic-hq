# RED Phase Complete: AHQ-8 (integration test)

**Jira**: [AHQ-8](https://agentic-hq.atlassian.net/browse/AHQ-8)
**Test Type**: integration
**Phase**: RED (Failing Test Written)
**Generated**: 2026-01-25

---

## Test Created

**File**: `tests/integration/claude-code-tool/real-claude-self-termination.integration.test.ts`
**Tests**: Verifies that `await tool.execute(command)` returns a string when Claude self-terminates

**Failure Output**:
```
AssertionError: expected 'object' to be 'string'
Expected: "string"
Received: "object"
```

**Why it fails**: Currently `execute()` returns an `ExecuteHandle` object synchronously. The test expects it to return `Promise<string>` that resolves when Claude exits.

---

## Test Command Added

Added to `package.json`:
```json
"test:integration:real-claude-self-termination": "vitest run --config vitest.integration.config.ts tests/integration/claude-code-tool/real-claude-self-termination.integration.test.ts"
```

---

## What GREEN Phase Needs to Implement

1. Change `execute()` to return `Promise<string>` instead of `ExecuteHandle`
2. Use PTY's `onExit` callback to resolve the promise when Claude exits
3. Create the command file at `.claude/commands/agentic-hq-commands/used-in-tests/integration/just-self-terminate.md`
4. Update AHQ-24 test if needed (currently uses `handle.kill()` pattern)

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-commands:workflow:jira-story-workflow:03-jira-minimal-implementation AHQ-8 integration
```

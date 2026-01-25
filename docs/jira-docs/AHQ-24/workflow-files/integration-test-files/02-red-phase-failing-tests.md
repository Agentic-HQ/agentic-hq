# RED Phase Complete: AHQ-24 (integration test)

**Jira**: [AHQ-24](https://agentic-hq.atlassian.net/browse/AHQ-24)
**Test Type**: integration
**Phase**: RED (Failing Test Written)
**Generated**: 2026-01-25

---

## Test Created

**File**: `tests/integration/claude-code-tool/claude-executes-math-command.integration.test.ts`
**Command**: `pnpm test:integration:claude-math`

**Tests**: Verifies that `ClaudeCodeTool.execute()` can spawn real Claude Code CLI via PTY, send a math prompt ("What is 123 * 321? Reply with just the number."), and receive output containing "39483".

**Failure Output** (compilation error expected):
```
Error: Cannot find module '../../../src/tools/claude-code/ClaudeCodeTool' imported from '/Users/stevepersonal/dev/agentic-hq/agentic-hq/tests/integration/claude-code-tool/claude-executes-math-command.integration.test.ts'
```

**TypeScript Verification**:
```
tests/integration/claude-code-tool/claude-executes-math-command.integration.test.ts(21,32): error TS2307: Cannot find module '../../../src/tools/claude-code/ClaudeCodeTool' or its corresponding type declarations.
```

---

## Files Created

- `tests/integration/claude-code-tool/claude-executes-math-command.integration.test.ts` - Integration test for ClaudeCodeTool
- `package.json` - Added `test:integration:claude-math` script

**Note**: No skeleton/implementation files created in RED phase - that's GREEN phase work.

---

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-commands:workflow:jira-story-workflow:03-jira-minimal-implementation AHQ-24 integration
```

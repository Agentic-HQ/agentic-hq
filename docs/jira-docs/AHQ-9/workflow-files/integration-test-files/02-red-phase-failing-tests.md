# RED Phase Complete: AHQ-9 Integration Test

## Test Information

| Field | Value |
|-------|-------|
| Jira ID | AHQ-9 |
| Test Type | integration |
| Test File | `tests/integration/claude-code-tool/claude-executes-command-using-file-io.integration.test.ts` |
| Run Command | `pnpm test:integration:claude-file-io` |
| Phase | RED (Failing Test) |
| Status | ✅ VALID FAILURE |

---

## Test Description

Integration test that verifies `ClaudeCodeTool.execute(command, commandInput)` can:
1. Write command input to a JSON file
2. Run a real Claude Code command (slash command format)
3. Claude reads input, reverses the string, writes output to JSON file
4. ClaudeCodeTool reads the output and returns the result

**Uses REAL Claude Code** (not fake fixture).

---

## Test Code

```typescript
import { describe, it, expect } from 'vitest';

import { ClaudeCodeTool } from '../../../src/tools/claude-code/ClaudeCodeTool';

const TEST_TIMEOUT_MS = 1_000;

const REVERSE_STRING_COMMAND =
  '/agentic-hq-commands:used-in-tests:integration:reverse-a-string';

describe('ClaudeCodeTool.execute(command, commandInput) with real Claude', () => {
  it(
    'should reverse a string via file I/O with real Claude Code',
    async () => {
      // Arrange
      const tool = new ClaudeCodeTool();
      const commandInputString = 'this is a test string';
      const expectedCommandOutputString = 'gnirts tset a si siht';

      // Act - call with slash command and input string
      const commandOutputString = await tool.execute(
        REVERSE_STRING_COMMAND,
        commandInputString
      );

      // Assert
      expect(commandOutputString).toBe(expectedCommandOutputString);
    },
    TEST_TIMEOUT_MS
  );
});
```

---

## Failure Output

```
 RUN  v4.0.18 /Users/stevepersonal/dev/agentic-hq/agentic-hq

 ❯ integration tests/integration/claude-code-tool/claude-executes-command-using-file-io.integration.test.ts (1 test | 1 failed) 1008ms
     × should reverse a string via file I/O with real Claude Code 1007ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  integration ... > should reverse a string via file I/O with real Claude Code
Error: Test timed out in 1000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".

 Test Files  1 failed (1)
      Tests  1 failed (1)
   Duration  1.23s

close timed out after 1000ms
Tests closed successfully but something prevents Vite server from exiting
```

**Total execution time: ~3 seconds** (improved from 11+ seconds by setting `teardownTimeout: 1000` in vitest config)

---

## Failure Analysis

### Why It Fails

The test times out because the implementation is incomplete:

1. **Command parameter not passed to Claude**: `executeWithFileIO()` doesn't pass the `command` parameter to Claude Code CLI
2. **No command file exists**: The slash command `.claude/commands/agentic-hq-commands/used-in-tests/integration/reverse-a-string.md` doesn't exist yet
3. **Claude starts interactively**: Without a command, Claude starts in interactive mode waiting for user input

### Why There's a Cleanup Warning

The warning "close timed out after 1000ms" appears because:
- The implementation spawns Claude as a child process
- When the test times out, Vitest aborts the test but the Claude process keeps running
- Vitest waits for `teardownTimeout` (1 second) then exits
- Proper cleanup (killing the child process on timeout) is GREEN phase work

### This is a VALID RED Phase Failure

- ✅ Test correctly defines expected behavior
- ✅ Test times out with clear error message
- ✅ Test exits in reasonable time (~3 seconds)
- ✅ Implementation is incomplete (as expected in RED phase)
- ✅ GREEN phase will fix by implementing the feature

---

## GREEN Phase Requirements

To make this test pass, the GREEN phase must:

1. **Update `executeWithFileIO()`** to pass the `command` parameter to Claude Code CLI
2. **Create the slash command file**: `.claude/commands/agentic-hq-commands/used-in-tests/integration/reverse-a-string.md`
3. **Ensure Claude reads input file**, reverses the string, and writes to output file
4. **(Optional)** Implement proper cleanup with AbortController to eliminate the warning

---

## Configuration Changes

Added to `vitest.integration.config.ts`:

```typescript
export default defineConfig({
  test: {
    // ...
    // Short teardown timeout - exit quickly after test timeout
    teardownTimeout: 1000,
  },
});
```

Added to `package.json`:

```json
"test:integration:claude-file-io": "vitest run --config vitest.integration.config.ts tests/integration/claude-code-tool/claude-executes-command-using-file-io.integration.test.ts"
```

---

## Verification Checklist

- [x] Test file created
- [x] Test script added to package.json
- [x] `pnpm typecheck` passes
- [x] `pnpm test:integration:claude-file-io` runs and **FAILS** (expected - valid RED phase)
- [x] Failure is for the RIGHT reason (timeout due to incomplete implementation)
- [x] Test exits in reasonable time (~3 seconds)
- [x] RED phase document created

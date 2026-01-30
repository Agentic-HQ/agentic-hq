# RED Phase Complete: AHQ-9 (unit test)

**Jira**: [AHQ-9](https://agentic-hq.atlassian.net/browse/AHQ-9)
**Test Type**: unit
**Phase**: RED (Failing Test Written)
**Generated**: 2026-01-28

---

## Test Created

**File**: `tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts`
**Tests**: ClaudeCodeTool.execute(command, commandInput) method - verifies it can execute a command with input and return output via file I/O, using constructor injection to replace real Claude with a fake CLI fixture.

**Failure Output** (compilation error expected):
```
tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts(27,37): error TS2554: Expected 0 arguments, but got 1.
tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts(34,57): error TS2554: Expected 1 arguments, but got 2.
```

**Runtime Failure** (assertion error):
```
AssertionError: expected { finished: Promise{…}, …(1) } to be 'gnirts tset a si siht'
- Current execute() returns ExecuteHandle, not Promise<string>
- Current execute() takes 1 arg (prompt), test passes 2 args (command, input)
- Current constructor takes 0 args, test passes options object
```

---

## Files Created

- `tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts` - Unit test for new execute(command, commandInput) method
- `tests/unit/claude-code-tool/fixtures/fake-claude-cli.reverses-a-string-using-files.fixture.ts` - Fake CLI fixture that simulates Claude reading command-input.json and writing command-output.json

**Note**: No skeleton/implementation files created in RED phase - that's GREEN phase work.

---

## Spec Changes

- **Fixture renamed**: `fake-claude-cli.reverse-a-string-using-files.fixture.ts` → `fake-claude-cli.reverses-a-string-using-files.fixture.ts` (grammatical correction: "reverse" → "reverses")
- **Variable renamed**: `tempDir` → `commandInputOutputFilesDirectory` (clearer intent: this directory holds command input/output files)

---

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-commands:workflow:jira-story-workflow:03-jira-minimal-implementation AHQ-9 unit
```

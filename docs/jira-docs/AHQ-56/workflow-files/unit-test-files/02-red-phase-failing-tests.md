# RED Phase Complete: AHQ-56 (unit test)

**Jira**: [AHQ-56](https://agentic-hq.atlassian.net/browse/AHQ-56)
**Test Type**: unit
**Phase**: RED (Failing Test Written)
**Generated**: 2026-02-21

---

## Test Created

**File**: `tests/unit/cli/agentic-hq-cli-builds-workflow-command.unit.test.ts`
**Tests**: The `buildWorkflowCommand()` function correctly invokes ClaudeCodeTool with a skill command, receives the base workflow command back, and appends passthrough args to form the final command.

**Failure Output** (compilation error expected):
```
Error: Cannot find module '../../../src/cli/agentic-hq-cli.js' imported from '/Users/stevepersonal/dev/agentic-hq/agentic-hq/tests/unit/cli/agentic-hq-cli-builds-workflow-command.unit.test.ts'
```

**TypeScript Confirmation**:
```
tests/unit/cli/agentic-hq-cli-builds-workflow-command.unit.test.ts(19,38): error TS2307: Cannot find module '../../../src/cli/agentic-hq-cli.js' or its corresponding type declarations.
```

---

## Files Created

- `tests/unit/cli/agentic-hq-cli-builds-workflow-command.unit.test.ts` - The unit test importing `buildWorkflowCommand` from non-existent `src/cli/agentic-hq-cli.ts`
- `tests/unit/cli/fixtures/fake-claude-cli.returns-workflow-command.fixture.ts` - Fake skill fixture (test scaffolding) that simulates a skill returning a workflow command via the file I/O pattern

**Note**: No skeleton/implementation files created in RED phase - that's GREEN phase work.

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-56 unit
```

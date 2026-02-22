# GREEN Phase Complete: AHQ-56 (unit test)

**Jira**: [AHQ-56](https://agentic-hq.atlassian.net/browse/AHQ-56)
**Test Type**: unit
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-02-21

---

## Implementation Created

**Files Created/Modified**:
- `src/cli/agentic-hq-cli.ts` - New file exporting `buildWorkflowCommand()` function

**Test Command**: `pnpm test:unit tests/unit/cli/agentic-hq-cli-builds-workflow-command.unit.test.ts`
**Test Result**: PASSING

---

## What Was Implemented

Created `src/cli/agentic-hq-cli.ts` with a single exported function `buildWorkflowCommand(tool, skillCommand, passthroughArgs)` that:

1. Calls `tool.execute(skillCommand, 'unused input string')` to invoke the skill via ClaudeCodeTool and get the base workflow command
2. Appends passthrough args (from Commander's `passThroughOptions()`) to the base command with space separator
3. Returns the final command string ready to execute

This is the minimum code needed to pass the unit test. The function doesn't handle PTY execution, CLI arg parsing, or any other concerns - those are for the E2E test and future work.

## Files Created

- `src/cli/agentic-hq-cli.ts` - Exports `buildWorkflowCommand()` function that invokes a skill via ClaudeCodeTool and appends passthrough args to the returned base command

---

## Ready for REFACTOR Phase

The test is passing. Now review and refactor the code:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-56 unit
```

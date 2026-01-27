# AI Summary: AHQ-8

**Jira**: [AHQ-8](https://agentic-hq.atlassian.net/browse/AHQ-8)
**Title**: Self Terminating Claude Code
**Status**: Transitioned to In Progress
**Generated**: 2026-01-25

---

## My Understanding of This Task

This Jira is about creating an integration test that verifies the "self-termination" capability of Claude Code when called programmatically. The goal is to ensure that when Agentic HQ calls Claude Code with a command, Claude can execute the command and then terminate itself (returning control to the calling program) by invoking the existing kill script.

Two subtasks have already been completed:
1. **AHQ-21**: Created an integration test using a "fake Claude" fixture that verifies the kill script works correctly (the fixture calls the kill script and gets terminated)
2. **AHQ-24**: Created an integration test that spawns real Claude Code, sends it a math prompt, and verifies it responds correctly (but this test forcibly kills Claude after a timeout - Claude doesn't self-terminate)

This Jira (AHQ-8) combines these two capabilities: spawn **real** Claude Code, have it execute a command that **self-terminates** by calling the kill script, and verify that control returns to the test within 30 seconds. The key difference from AHQ-24 is that Claude will terminate itself (via the kill script) rather than being forcibly killed by the test.

The scope is intentionally minimal: no logging (just console), no output parsing (just pass-through), no timeout logic in the implementation (timeout is only in the test). The implementation is "intentionally wrong" in that it accumulates output in a string buffer that could run out of memory - this is explicitly acceptable per the Jira because it will be replaced later.

## Research Findings

No additional research was needed. The existing codebase provides clear patterns:
- The kill script at `tools/scripts/process-control/unix/kill-current-cli-process.sh` is well-documented and tested
- The existing test commands (e.g., `test-print-out-square-root-of-184389241-then-kill-process.md`) show the pattern for commands that self-terminate
- The existing `ClaudeCodeTool.ts` and integration tests provide the implementation pattern

## Questions for Human

I've reviewed the Jira description, the parent Epic (AHQ-1), the completed subtasks, and the existing codebase. I have one question:

### Question 1: Test command location

The Jira specifies creating a test command at:
`.claude/commands/agentic-hq-commands/used-in-tests/integration/just-self-terminate.md`

However, looking at the existing command structure, I see that test-related commands are currently at the root level of `.claude/commands/agentic-hq-commands/` (e.g., `test-print-out-square-root-of-184389241-then-kill-process.md`).

Should I:
1. Create the new directory structure as specified in the Jira (`used-in-tests/integration/`)
2. Place it alongside existing test commands at the root level with a descriptive name like `test-just-self-terminate-for-integration-test.md`

The Jira is explicit about option 1, so I'll default to that unless you prefer otherwise.

**Human's Response**:
> Please use new directory structure - we'll archive those old Spike commands later...

**Agreed**: Will create the command at `.claude/commands/agentic-hq-commands/used-in-tests/integration/just-self-terminate.md`

---

## Files I Reviewed

- `tools/scripts/process-control/unix/kill-current-cli-process.sh` - The kill script that Claude commands call to self-terminate. Well-documented, takes $PPID as argument, sends SIGINT.

- `src/tools/claude-code/ClaudeCodeTool.ts` - The existing ClaudeCodeTool implementation. Spawns Claude via PTY, accumulates output in a string buffer, returns a handle with a `kill()` method. This is what the test will use.

- `tests/integration/claude-code-tool/claude-executes-math-command.integration.test.ts` - The AHQ-24 test. Shows the pattern: create ClaudeCodeTool, call execute(), wait, then forcibly kill. The new test will be similar but wait for Claude to self-terminate instead.

- `tests/integration/process-control/kill-script-terminates-cli-process.integration.test.ts` - The AHQ-21 test. Shows the timeout/exit handling pattern: set up a promise that resolves on process exit OR timeout, then assert the process exited (not timed out).

- `tests/integration/process-control/fixtures/fake-claude-cli.triggers-kill-script.fixture.ts` - The fake Claude fixture. Shows how a process calls the kill script and handles SIGINT.

- `.claude/commands/agentic-hq-commands/test-print-out-square-root-of-184389241-then-kill-process.md` - Example command that self-terminates. Shows the pattern: do task, output result, call kill script with $PPID.

- `package.json` - Current test scripts. I'll need to add `test:integration:real-claude-self-termination` as specified in the Jira acceptance criteria.

**Key findings:**
- The existing `ClaudeCodeTool` returns a handle with `kill()` method but doesn't have a way to detect when Claude exits on its own. For this test, I'll need to either modify the handle to expose an exit event/promise, OR use the PTY's `onExit` callback directly in the test.
- The test pattern from AHQ-21 (promise that resolves on exit or timeout) is exactly what's needed here.

## Ready for Next Step

Human, please:
- Answer the question about command location
- Let me know you've answered it and we'll discuss until resolved.
- Then I'll tell you the next command to run

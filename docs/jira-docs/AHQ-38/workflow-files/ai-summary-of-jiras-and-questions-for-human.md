# AI Summary: AHQ-38

**Jira**: [AHQ-38](https://agentic-hq.atlassian.net/browse/AHQ-38)
**Title**: Test Helper Custom Commands To Create And Check Status Of Test Jiras
**Status**: Transitioned to In Progress
**Generated**: 2026-02-07

---

## My Understanding of This Task

This Jira requires creating **two Claude Code custom commands** that act as test helpers for the broader Quick Jira Workflow Demo CLI (AHQ-36). These commands will be used by integration/e2e tests (specifically those in AHQ-37) to programmatically create test Jiras and check their status, enabling automated testing of the workflow system.

The two commands follow the same file-based I/O pattern used by existing commands like `div-five.md` and `reverse-a-string.md`: they read `command-input.json` from a temp directory (passed as `$0`), do their work, write `command-output.json`, and self-terminate. The key difference is that these commands interact with Jira via MCP tools rather than performing local computation.

**Command 1: `create-test-jira.md`** - Takes a plain-text input string containing a title and description (e.g. "Title: Simplest Possible Hello World CLI  Description: Write a hello-world.cli.ts..."), creates a Jira in the **TEST** project, and outputs **only** the Jira ID (e.g. `TEST-123`).

**Command 2: `get-jira-status.md`** - Takes a Jira ID as input string, queries Jira for its status, and outputs **only** the status name (e.g. `Backlog`).

Additionally, there is **one integration test** that exercises both commands together: it calls `create-test-jira`, gets back a Jira ID, calls `get-jira-status` with that ID, and asserts the status is "Backlog". This test must complete within 60 seconds.

**Scope**: Two `.md` custom command files, one integration test file, and the `package.json` script entry. No CLI programs, no demo code - that's AHQ-37's scope.

## Research Findings

No external research needed - this task uses well-established patterns already in the codebase (ClaudeCodeTool file I/O pattern, MCP Jira tools, vitest integration tests).

## Questions for Human (All Resolved)

### Question 1: TEST project in Jira - does it exist?

**RESOLVED**: TEST project exists at https://agentic-hq.atlassian.net/browse/TEST (Jira Key: TEST). Confirmed by human.

---

### Question 2: Parsing the input string for create-test-jira

**RESOLVED**: Use plain-text string format with "Title:" and "Description:" markers as shown in the Jira. Future Jiras may change `execute()` to accept/return non-String objects, but for now keep it simple with strings.

### Question 3: Test file naming

**RESOLVED**: Use `.integration.test.ts` suffix (Jira was corrected). File: `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts`

## All Questions Resolved - Ready for Next Step

## Files I Reviewed

- `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/div-five.md` - The reference example for command I/O pattern (read input JSON, do work, write output JSON, self-terminate). Both new commands must follow this exact pattern.
- `.claude/commands/agentic-hq-commands/used-in-tests/integration/reverse-a-string.md` - Another example of the same pattern, this one used in integration tests. Confirms the pattern is consistent.
- `.claude/commands/agentic-hq-commands/used-in-tests/integration/just-self-terminate.md` - Simplest possible command example - write output and self-terminate.
- `src/tools/claude-code/ClaudeCodeTool.ts` - The tool that executes these commands. Confirmed it passes the temp dir as the argument (`$0`), writes `command-input.json`, and reads `command-output.json` with the `command-output-string` key.
- `tests/integration/claude-code-tool/claude-executes-command-using-file-io.integration.test.ts` - Integration test pattern: uses `ClaudeCodeTool`, calls `execute()` with a command path and input string, asserts on the output. The new test will follow this exact pattern but call two commands sequentially.
- `package.json` - Checked existing test script naming conventions. Need to add `test:integration:create-test-jira-and-get-status` entry.
- `vitest.integration.config.ts` - Confirmed integration tests match `tests/integration/**/*.integration.test.ts` pattern.

**Key findings**: The codebase has a very consistent pattern for custom commands and their tests. The new commands just need to use Jira MCP tools instead of string manipulation, but the I/O scaffolding is identical.


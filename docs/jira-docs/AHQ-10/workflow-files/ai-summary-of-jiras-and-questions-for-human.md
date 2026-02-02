# AI Summary: AHQ-10

**Jira**: [AHQ-10](https://agentic-hq.atlassian.net/browse/AHQ-10)
**Title**: 3 Step Math Demo CLI Application
**Status**: Transitioned to In Progress
**Generated**: 2026-02-01

---

## My Understanding of This Task

This task is to create a demo CLI application that demonstrates Agentic HQ's ability to chain multiple Claude Code sessions together, passing output from one as input to the next. The CLI takes an input number and runs it through a 3-step math workflow: multiply by 2, add 3, then divide by 5. For example, input 11 produces: 11 * 2 = 22, 22 + 3 = 25, 25 / 5 = 5, so output is 5.

The implementation follows the existing `string-reversal-demo-cli.ts` pattern, but instead of one Claude Code invocation, it chains three sequential invocations. Each step uses a separate Claude Code custom command (`times-two`, `plus-three`, `div-five`) that reads from `command-input.json`, performs its math operation, writes to `command-output.json`, and self-terminates via the kill script.

The scope is intentionally minimal - no error handling, no abstraction, hard-coded values are fine. This is meant to be a simple demonstration that "works" and shows the chaining pattern. The Epic explicitly states this code is expected to be thrown away or heavily rewritten.

The deliverable is driven by a single E2E test that runs `pnpm demo:math-workflow --input-number=11` and verifies the output contains "Output number: 5" within a 90-second timeout (allowing 30 seconds per Claude Code invocation).

## Research Findings

No external research was needed - the existing codebase has clear patterns to follow from AHQ-25 (string reversal demo).

## Questions for Human

I have reviewed the Jira description, acceptance criteria, parent Epic, and existing code patterns. I have no questions - the requirements are clear:

1. **CLI location**: `src/demo/cli/math-workflow-demo-cli.ts` (specified in Jira)
2. **E2E test location**: `tests/e2e/demo/demo-math-workflow-gives-expected-output-number.e2e.test.ts` (specified in Jira)
3. **pnpm commands**: `demo:math-workflow` and `test:e2e:demo-math-workflow` (specified in Jira)
4. **Command names**: `times-two`, `plus-three`, `div-five` (specified in "Description Of User Flow")
5. **Timeout**: 90 seconds for E2E test (specified in Jira)
6. **Test input/output**: input=11, expected output string="Output number: 5" (specified in Jira)
7. **Custom command location**: `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/` (specified by human)

All implementation details are specified or can be inferred from existing patterns.

## Files I Reviewed

- `src/demo/cli/string-reversal-demo-cli.ts` - The pattern to follow: a CLI that takes a command-line argument, creates a `ClaudeCodeTool`, calls `execute()` with a slash command and input, then prints the result. My CLI will do this 3 times sequentially, chaining outputs.

- `tests/e2e/demo/demo-string-reversal-cli-reverses-string.e2e.test.ts` - The E2E test pattern: uses `execSync` to run the pnpm command, captures stdout, asserts it contains the expected output. Uses per-test timeout (30s). My test will use 90s timeout.

- `tests/integration/claude-code-tool/claude-executes-command-using-file-io.integration.test.ts` - Shows how `ClaudeCodeTool.execute()` is used with slash commands. Confirms the file I/O pattern works.

- `src/tools/claude-code/ClaudeCodeTool.ts` - The tool that handles Claude Code execution. Each `execute()` call: creates a unique temp directory, writes `command-input.json`, spawns Claude via PTY, waits for exit, reads `command-output.json`. My CLI will call this 3 times in sequence.

- `.claude/commands/agentic-hq-commands/used-in-tests/integration/reverse-a-string.md` - The slash command pattern for Claude: read input from `$0/command-input.json`, process it, write output to `$0/command-output.json`, self-terminate. I need to create 3 similar commands for the math operations in `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/`.

- `package.json` - Current pnpm scripts. I need to add `demo:math-workflow` and `test:e2e:demo-math-workflow`.

- `vitest.e2e.config.ts` - Confirms E2E tests use per-test timeouts (not global), so I'll set 90s on my test.

**Key Findings:**
1. The existing `ClaudeCodeTool` handles all the complexity - I just call `execute()` for each step
2. Each Claude command is a markdown file in `.claude/commands/` that reads/writes JSON and self-terminates
3. The CLI pattern is simple: parse args with `commander`, loop through steps, print final result
4. The E2E test pattern is simple: `execSync` the pnpm command, assert stdout contains expected text

## Ready for Next Step

Human, please:
- Review this summary
- If you have any questions or corrections, let me know
- Otherwise, confirm you're ready and I'll tell you the next command to run


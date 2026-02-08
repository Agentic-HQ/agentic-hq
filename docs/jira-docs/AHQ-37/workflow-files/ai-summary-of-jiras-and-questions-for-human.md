# AI Summary: AHQ-37

**Jira**: [AHQ-37](https://agentic-hq.atlassian.net/browse/AHQ-37)
**Title**: Simplest Possible Single Step Hello World Jira Workflow Demo CLI
**Status**: Transitioned to In Progress
**Generated**: 2026-02-08

---

## My Understanding of This Task

This Jira is the first real subtask of AHQ-36 (Quick Jira Workflow Demo CLI). The goal is to build the simplest possible end-to-end demo that proves the concept: a CLI program that takes a Jira ID and a project root, runs a single Claude Code custom command to implement the Jira's instructions, and produces verifiable output files. AHQ-38 (test helper commands for creating/checking Jira status) is already done and is a prerequisite.

The deliverables are three things: (1) A demo CLI at `src/demo/cli/quick-jira-workflow-demo-cli.ts` that accepts `--jira-id` and `--project-root` options, uses `ClaudeCodeTool` to execute a single workflow custom command, and passes the variables as a plain English string. (2) A single-step workflow custom command at `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/01-read-jira-implement-and-mark-as-done.md` that reads the Jira via the jira-verbatim-content-extractor sub-agent, implements whatever the Jira says (relative to the project root), writes a summary doc, transitions the Jira to Done, and self-terminates. (3) An e2e test at `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts` that creates a test Jira (using the AHQ-38 helper), constructs a temp project root, runs the CLI, and verifies: `hello-world.cli.ts` exists, it prints "Hello world", the summary doc exists, and the Jira status is "Done".

The scope is deliberately minimal - single step, no loops, no TDD within the workflow, no human interaction. The projectRoot defaults to the git root (found by recursively searching for `.git` directory from cwd upward). The test project root uses a timestamped+UUID temp directory under `temp/test-files/test-project-roots/demo-quick-jira-workflow/`.

**Intentionally simple**: The Jira explicitly says this is "just the first sub-task to get something running and flush out basic decisions." Variables are passed as plain English strings, not structured JSON (that's a future Jira).

## Research Findings

No external research was needed - all patterns are well-established in the codebase from AHQ-38 and prior work.

### Existing Patterns Reviewed

- **ClaudeCodeTool** (`src/tools/claude-code/ClaudeCodeTool.ts`): File-based I/O pattern using `command-input.json`/`command-output.json` in unique temp directories. Commands are executed via PTY with self-termination.
- **Demo CLIs** (`src/demo/cli/math-workflow-demo-cli.ts`): Use Commander.js, `ClaudeCodeTool`, and simple sequential command execution. Pattern is clear and consistent.
- **Custom commands** (e.g., `create-test-jira.md`, `times-two.md`): Markdown instructions with `$0` → `{command-input-output-files-directory}` variable pattern, file-based I/O, and self-termination via kill script.
- **E2E tests** (e.g., `demo-math-workflow...e2e.test.ts`): Use `execSync` to run CLI via `pnpm` script, check stdout, vitest with timeouts.

## Questions for Human

### Question 1: Inconsistent summary doc path in Test Details

The Jira has an inconsistency in the test verification path for the summary doc:

- **Implementation Details** says: `{projectRoot}/docs/jira-docs/{jiraId}/workflow-docs/01-read-jira-implement-and-mark-as-done.summary.md`
- **Test Details** says: `docs/jira-docs/{testJiraId}/01-read-jira-implement-and-mark-as-done.summary.md`

Two differences:
1. Missing `workflow-docs` subdirectory in Test Details
2. Missing `{testProjectRoot}` prefix in Test Details (just says `docs/jira-docs/...`)

I believe the Implementation Details version is the correct one: `{testProjectRoot}/docs/jira-docs/{jiraId}/workflow-docs/01-read-jira-implement-and-mark-as-done.summary.md`. Is that right?

**Human's Response**:
> Well spotted. I've corrected the Jira to: Confirming {testProjectRoot}/docs/jira-docs/{testJiraId}/workflow-docs/01-read-jira-implement-and-mark-as-done.summary.md exists (note that it's testJiraId not jira-id)

---

### Question 2: How should the CLI pass variables to the custom command?

The Jira says the CLI passes variables as a plain English string: `"Your variables for use in this command are jiraId = <jiraId> and projectRoot = <projectRoot>"`.

However, the existing `ClaudeCodeTool.execute(command, commandInput)` takes a command name and a `commandInput` string. Currently, custom commands expect the input string in `command-input.json` via the `command-input-string` key.

The workflow command `01-read-jira-implement-and-mark-as-done.md` is **different** from existing commands - it doesn't need to read `command-input.json` and write `command-output.json` in the same way. It's a "fire and forget" command that does real work on the filesystem rather than returning a value.

**My proposed approach**: The CLI still uses `ClaudeCodeTool.execute()` with the plain English variables string as the `commandInput`. The workflow command reads `command-input.json` to get the variables string, parses out `jiraId` and `projectRoot`, does its work, and writes `command-output.json` with a simple completion message (so `ClaudeCodeTool` doesn't throw an error looking for the output file). This keeps the existing pattern consistent.

Does this approach sound right, or did you have something different in mind?

**Human's Response**:
> Sounds great. that's what I intended.

---

### Question 3: E2E test - how to run hello-world.cli.ts to verify output?

The test needs to verify that running `{testProjectRoot}/src/hello-world.cli.ts` prints "Hello world". Since the test project root is a bare temp directory (not a Node.js project), the file will be a simple TypeScript file.

My proposed approach: run it with `tsx {testProjectRoot}/src/hello-world.cli.ts` (tsx is already a dev dependency and can run TS files without compilation). Does that sound right?

**Human's Response**:
> tsx isn't installed. "npx tsx" works though.

---

### Question 4: E2E test timeout

The e2e test needs to: (1) create a test Jira via Claude (~30s), (2) run the demo CLI which runs Claude to read the Jira, create a file, write a summary, and transition the Jira (~60-120s), (3) verify the Jira status via Claude (~30s).

The Jira parent (AHQ-36) says 1200 seconds (20 minutes) timeout. Given this involves 3+ Claude invocations plus Jira API calls, I'd suggest starting with 300 seconds (5 minutes) and increasing if needed. The parent Jira's 1200s timeout seems very generous for this simple case. What timeout do you want?

**Human's Response**:
> 1200 (20 minutes) was specified in AHQ-36 because it will be a multi-step workflow (in that Jira). Please leave it as it is for that Jira.

---

## Files I Reviewed

- `src/tools/claude-code/ClaudeCodeTool.ts` - Core tool for executing Claude commands; needed to understand how commands receive input and return output
- `src/demo/cli/math-workflow-demo-cli.ts` - Existing demo CLI pattern using Commander.js + ClaudeCodeTool; this is the template for the new CLI
- `tests/e2e/demo/demo-math-workflow-gives-expected-output-number.e2e.test.ts` - Existing e2e test pattern using execSync; template for the new test
- `.claude/commands/agentic-hq-commands/used-in-tests/jira-helper-commands/create-test-jira.md` - AHQ-38 test helper; will be used by the e2e test
- `.claude/commands/agentic-hq-commands/used-in-tests/jira-helper-commands/get-jira-status.md` - AHQ-38 test helper; will be used to verify Jira is Done
- `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/times-two.md` - Example custom command pattern; template for the new workflow command
- `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts` - Integration test showing how ClaudeCodeTool is used with Jira commands
- `package.json` - Existing scripts; need to add `demo:quick-jira-workflow` and `test:e2e:demo-quick-jira-workflow`
- `.gitignore` - Confirmed `temp/` is gitignored (test project root files won't be committed)

**Key findings**: All patterns are well established. The new CLI follows the `math-workflow-demo-cli.ts` pattern exactly. The new custom command follows the `create-test-jira.md` pattern but instead of returning a value, it does filesystem work. The e2e test follows the `demo-math-workflow...e2e.test.ts` pattern but with Jira creation/verification steps added.

## Agreed Decisions

1. **Summary doc path**: `{testProjectRoot}/docs/jira-docs/{testJiraId}/workflow-docs/01-read-jira-implement-and-mark-as-done.summary.md` (Jira corrected)
2. **CLI → command variable passing**: Use `ClaudeCodeTool.execute()` with plain English variables string (`jiraId` and `projectRoot`) in `command-input.json`; workflow command reads it, does work, writes `command-output.json` with completion message
3. **Running hello-world.cli.ts in test**: Use `npx tsx` (not bare `tsx` which isn't installed)
4. **E2E test timeout**: 1200 seconds (20 minutes) as specified in AHQ-36

## Ready for Next Step

All questions resolved. Human should run the next command.

# AI Summary: AHQ-36

**Jira**: [AHQ-36](https://agentic-hq.atlassian.net/browse/AHQ-36)
**Title**: Quick Jira Workflow Demo CLI
**Status**: Transitioned to In Progress
**Generated**: 2026-02-11

---

## My Understanding of This Task

This Jira is about extending the existing single-step quick Jira workflow demo CLI into a **multi-step workflow with looping**. The subtasks AHQ-37 (single-step workflow), AHQ-38 (test helper commands), and AHQ-40 (git root detection) are all Done and provide the foundation. This parent Jira now needs to evolve that foundation into something more sophisticated.

The current state is: CLI (`src/demo/cli/quick-jira-workflow-demo-cli.ts`) invokes ONE command (`01-read-jira-implement-and-mark-as-done.md`) which reads the Jira, implements it, writes a summary, transitions to Done, and self-terminates. The e2e test creates a test Jira asking for a simple "Hello World" CLI and verifies the files were created and Jira marked Done.

The new multi-step workflow will replace the single command with **4 commands** that mirror the real Jira Story Workflow (but simplified and non-interactive):
1. **01-read-jira-and-plan-tests-and-implementation-understand.md** - Reads the Jira, copies full details to `01-entire-jira-copy-of-details.md`, creates `01-summary-of-jira.md`, and returns a comma-separated list of test types as its output string.
2. **02-RED-write-failing-test.md** - Writes a failing test for a given test type (reads Jira from the file, not MCP).
3. **03-GREEN-minimal-implementation.md** - Writes minimal code to pass the test (reads Jira from file).
4. **04-REFACTOR.md** - Refactors the code, running the specific test before and after (reads Jira from file).

The CLI will be modified to: call command 01, parse the comma-separated test types from the output, then **loop** over each test type calling commands 02 → 03 → 04 for each. The VALIDATE phase is intentionally skipped in this quick version.

The e2e test will be updated so the test Jira specifies **2 test types** (unit and e2e), and the test assertions will check for all the workflow output files from each phase for each test type, plus the actual implementation files, plus Jira status = Done.

**Scope**: Modify existing CLI, replace existing single command with 4 new commands, update e2e test. The "manual disabled" test (AHQ-40) should continue to work. File locations, the `ClaudeCodeTool` I/O pattern, and kebab-case conventions are all already established and remain unchanged.

**Out of scope**: The "Full Jira Workflow Demo CLI" (mentioned as "Leaving For Later"), any human interaction during the workflow, the VALIDATE phase.

## Research Findings

No external research was needed. The existing codebase patterns (ClaudeCodeTool file-based I/O, custom command structure, self-termination, kebab-case variables) are well-established and this task follows those same patterns.

## Questions for Human

### Question 1: Test Jira description for 2 test types

The Jira says the e2e test will create a TEST Jira that specifies 2 test types: "unit - tests the helloWorld method in the code" and "e2e - test the whole hello-world.cli.ts script".

The current test creates a Jira with: `"Title: Simplest Possible Hello World CLI  Description: Write a temp-test-hello-world.cli.ts in location "src" (relative to the project root) that prints "Hello world" - no tests, just do it."`

For the multi-step version, the test Jira description needs to include enough information for the AI to know what unit test and e2e test to write. I'm thinking something like:

```
Title: Hello World CLI With Unit And E2E Tests
Description: Create a hello-world module and CLI.
- Create src/temp-test-hello-world.ts exporting a function helloWorld() that returns "Hello world"
- Create src/temp-test-hello-world.cli.ts that calls helloWorld() and prints the result
- Test types: unit, e2e
- Unit test: test that helloWorld() returns "Hello world"
- E2E test: test that running hello-world.cli.ts prints "Hello world"
```

The command 01 would parse "unit, e2e" from the "Test types:" line (or from its own analysis of the Jira). Does this approach look right, or do you have a specific format in mind for how the test types should be specified in the Jira description?

**Human's Response**:
> Sounds great. I've update the names to start with temp-test

---

### Question 2: How should command 01 determine the test types to return?

The Jira says command 01 "returns the comma separated test types" as its output string. Two approaches:

**Option A**: The test Jira description explicitly states `Test types: unit, e2e` and command 01 simply extracts that line.

**Option B**: Command 01 analyzes the Jira content and uses AI judgment to determine what test types are needed, returning its assessment.

Option A is more reliable/deterministic for automated testing. Option B is more "intelligent" but less predictable. Given this is a demo that needs to pass e2e tests reliably, I'd lean toward Option A. What do you prefer?

**Human's Response**:
> Please make the command look for "Test types: <the test types comma separated>" and if it doesn't find that string intelligently determine the test types from the possible list: unit, integration, smoke, e2e and return the relevant ones in that order.  If it can't find any tests it should just return an empty string, which means empty list.  The command must return **just** a comma separated list of test types of this form.

---

### Question 3: What should the test assertions check for the multi-step workflow?

The current test checks: (1) `src/temp-test-hello-world.cli.ts` exists, (2) it prints "Hello world", (3) summary doc exists, (4) Jira status is Done.

For the multi-step version with 2 test types (unit, e2e), I expect the assertions to check:

**Workflow output files** (in `{projectRoot}/docs/jira-docs/{testJiraId}/workflow-docs/`):
- `01-entire-jira-copy-of-details.md` exists
- `01-summary-of-jira.md` exists
- For each test type (unit, e2e):
  - `{test-type}-test-files/02-RED-write-failing-test.summary.md` exists
  - `{test-type}-test-files/03-GREEN-minimal-implementation.summary.md` exists
  - `{test-type}-test-files/04-REFACTOR.summary.md` exists

**Implementation files**:
- `src/hello-world.ts` exists (the module)
- `src/hello-world.cli.ts` exists (the CLI)
- Some test files exist (unit test, e2e test)

**Jira status**: Done

Should I also check that running the CLI prints "Hello world" (like the current test does)? And should I verify the test files actually pass? Or is checking file existence sufficient for the e2e test?

The Jira acceptance criteria says: "Confirm the filesystem at <the temp project root dir> contains the expected changes required by the Story and the expected workflow output files" - which suggests file existence checks are the main thing.

**Human's Response**:
> checking file existence is sufficient for both tests

---

### Question 4: Naming convention for workflow summary files

The Jira mentions the commands as `02-RED-write-failing-test.md` etc. But the workflow output files that each command writes - what should their exact names be?

Current single-step uses: `01-read-jira-implement-and-mark-as-done.summary.md`

For the multi-step, should the summary files follow a similar pattern? E.g.:
- `01-read-jira-and-plan.summary.md`
- `{test-type}-test-files/02-RED-write-failing-test.summary.md`
- `{test-type}-test-files/03-GREEN-minimal-implementation.summary.md`
- `{test-type}-test-files/04-REFACTOR.summary.md`

Or do you have specific names in mind? (I'll use kebab-case for the file names as per your convention.)

**Human's Response**:
> These look good, but I've put CAPS for RED, GREEN and REFACTOR

---

## Files I Reviewed

- `src/demo/cli/quick-jira-workflow-demo-cli.ts` - The existing CLI that needs to be modified to add looping. Currently invokes a single command.
- `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/01-read-jira-implement-and-mark-as-done.md` - The existing single-step workflow command that will be replaced by 4 new commands.
- `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts` - The existing e2e test with 2 test cases (explicit project root + git root detection) that needs to be updated for multi-step assertions.
- `src/tools/claude-code/ClaudeCodeTool.ts` - The file-based I/O tool used by the CLI to invoke commands. This won't change, but I needed to understand the execute pattern (command + input string → output string).
- `.claude/commands/agentic-hq-commands/workflow/jira-story-workflow/02-jira-write-failing-test.md` - The real RED phase command, for reference on what the simplified version should include.
- `.claude/commands/agentic-hq-commands/workflow/jira-story-workflow/03-jira-minimal-implementation.md` - The real GREEN phase command, for reference.
- `.claude/commands/agentic-hq-commands/workflow/jira-story-workflow/04a-jira-refactor-analysis.md` and `04b-jira-refactor-execute.md` - The real REFACTOR commands (split into analysis + execute), for reference. Our simplified version combines these into one command.
- `package.json` - Checked existing scripts: `demo:quick-jira-workflow`, `test:e2e:demo-quick-jira-workflow`, etc. These will need updating.
- `.claude/commands/agentic-hq-commands/used-in-tests/jira-helper-commands/create-test-jira.md` and `get-jira-status.md` - Test helpers used by the e2e test. These won't change.

**Key findings**: The CLI currently calls `tool.execute()` once with a single command. It will need to call it multiple times: once for command 01, then in a loop for commands 02/03/04 per test type. The variables string pattern (`"Your variables for use in this command are..."`) will need to be extended to include test-type for the looped commands. The `ClaudeCodeTool.execute()` returns the `command-output-string` from `command-output.json`, which is how command 01 will communicate the test types back to the CLI.

## Agreed Decisions Summary

1. **Test Jira description**: Files named with `temp-test` prefix (`temp-test-hello-world.ts`, `temp-test-hello-world.cli.ts`). Jira includes `Test types: unit, e2e`.
2. **Test type extraction**: Command 01 looks for explicit `Test types: <csv>` first; if not found, intelligently determines from (unit, integration, smoke, e2e) in that order. Returns **just** comma-separated list, or empty string if none.
3. **Test assertions**: File existence checks only - no need to run CLI or verify test execution.
4. **Summary file naming**: CAPS for phase names: `02-RED-write-failing-test.summary.md`, `03-GREEN-minimal-implementation.summary.md`, `04-REFACTOR.summary.md`.

## Ready for Next Step

All questions resolved. The next command to run is:

```
/agentic-hq-commands:workflow:jira-story-workflow:02-jira-write-failing-test AHQ-36 e2e
```

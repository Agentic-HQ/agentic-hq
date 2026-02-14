# AI Summary: AHQ-41

**Jira**: [AHQ-41](https://agentic-hq.atlassian.net/browse/AHQ-41)
**Title**: Full Jira TDD Story Workflow That I Will Use In My Dev
**Status**: Transitioned to In Progress
**Generated**: 2026-02-12

---

## My Understanding of This Task

This Jira is about creating a **full, interactive** version of the Jira TDD Story Workflow demo CLI. A "quick" non-interactive version already exists (AHQ-36) at `src/demo/cli/quick-jira-workflow-demo-cli.ts` which is used for automated testing. This new CLI will be the real-world tool that Steve uses day-to-day to execute Jira stories through the full TDD workflow.

The new CLI (`src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts`) will run via `pnpm demo:full-jira-tdd-story-workflow --jira-id=TEST-123` and will orchestrate the **full interactive workflow commands** currently at `.claude/commands/agentic-hq-commands/workflow/jira-story-workflow/` (commands 01 through 05, including 04a and 04b). This differs from the quick workflow which uses simplified, non-interactive command variants.

The work has three main parts:

1. **Create the new CLI** (`full-jira-tdd-story-workflow-demo-cli.ts`) - modelled on the existing quick workflow CLI but calling the full workflow commands instead. The key structural difference is that the full workflow has more steps (01, 02, 03, 04a, 04b, 05) compared to the quick workflow (01, 02, 03, 04, 05).

2. **Modify the full workflow command files** to support file-based I/O - each command currently takes parameters directly (via `$0`, `$1`) but needs to be adapted to use the Read Input / Write Output / Self-Terminate pattern used by the quick workflow commands. The command `01-jira-read-and-question.md` also needs to return the list of test types (like the quick workflow's command 01 does).

3. **Move/rename the workflow directory** from `.claude/commands/agentic-hq-commands/workflow/jira-story-workflow` to `.claude/commands/agentic-hq-commands/used-in-demos/full-jira-tdd-story-workflow` using `git mv`, and update all internal cross-references between command files.

**Scope boundaries**: No automated tests for this Jira (explicitly stated). The acceptance test is Steve manually running the full workflow and being satisfied. The underlying command logic itself is already tested via the quick workflow's automated tests.

**Note on TDD**: The Jira explicitly says TDD is being skipped for this one, and the user has confirmed we should skip TDD parts in this flow.

## Research Findings

No external research was needed for this task. The implementation follows established patterns already in the codebase (ClaudeCodeTool, quick-jira-workflow-demo-cli, file-based I/O pattern).

## Questions for Human

### Question 1: Interactive steps and the CLI loop structure

The full workflow has interactive commands where the agent stops and waits for human input (e.g., 01 asks questions and waits for answers, 02/03 use Plan Mode, 04a presents refactors for approval). The quick workflow avoids this by having non-interactive simplified commands that auto-proceed.

Since the full workflow commands are interactive (the human types responses in the Claude session), how should the CLI handle the loop? Specifically:

- In the quick workflow, command 01 returns test types as a simple string, and the CLI parses them and loops. But in the full workflow, command 01 is a long interactive conversation (read Jira, ask questions, discuss with human, etc.) - at the end it currently just tells the human to run the next command manually.
- Should the full workflow CLI still loop automatically (like the quick one), expecting each command to eventually self-terminate and write output? Or should it be more of a "run one command at a time" orchestrator where the human triggers each step?

My assumption is that it should work like the quick workflow: each command reads input from file, does its interactive work with the human, writes output to file, self-terminates, and the CLI picks up the output and runs the next command. The interactive nature happens within each Claude session. Is that correct?

**Human's Response**:
> Correct

---

### Question 2: The Validate step (05) - per test type or once at the end?

In the quick workflow, command 05 is "transition Jira to Done" and runs once at the end. But in the full workflow, there's a `05-jira-validate` command that is meant to run as a quality gate. Looking at the full workflow structure:

- Per test type: 02 (RED) -> 03 (GREEN) -> 04a (REFACTOR analysis) -> 04b (REFACTOR execute) -> 05 (VALIDATE)
- Then loop for next test type

But the current `05-jira-validate.md` only takes `jira-id` (not `test-type`), suggesting it runs once after ALL test types are complete (not per test type). The command references at the end of 04b say to run `05-jira-validate {jira-id} {test-type}` though.

Should the validate step run:
- **A) Once at the very end** after all test type loops are done (current 05 signature suggests this)
- **B) Per test type** in each loop iteration (04b's reference to next step suggests this)

Also: after the validate step, should the CLI also transition the Jira to Done (like the quick workflow does)?

**Human's Response**:
> *A) Once at the very end & the CLI should not transition the Jira to Done (like the quick workflow does) but tell the human to commit the code or merge the branch (depending on the situation).

---

### Question 3: What variables does command 01 need to output for the CLI?

In the quick workflow, command 01 outputs just the test types (e.g., "unit, e2e"). The Jira says 01-jira-read-and-question.md "will have to be changed to return the list of test types like the first command in the quick-jira-workflow."

But in the full workflow, command 01 currently does a lot more (reads Jira, asks questions, discusses with human, creates summary file). After all that interactive work, should it just output the test types in `command-output.json`? Or does the CLI need any additional information from command 01 (e.g., the summary file path, the resolved questions, etc.)?

My assumption: command 01 outputs just the test types string (same as quick workflow). The CLI doesn't need other data because the subsequent commands read the workflow files directly. Is that right?

**Human's Response**:
> command 01 outputs just the test types string

---

## Files I Reviewed

- `src/demo/cli/quick-jira-workflow-demo-cli.ts` - The existing quick workflow CLI that this new CLI will be modelled on. Key patterns: Commander for CLI args, ClaudeCodeTool for execution, buildVariablesString for passing data, loop over test types with RED/GREEN/REFACTOR per type.

- `src/tools/claude-code/ClaudeCodeTool.ts` - The tool that executes Claude commands via PTY with file-based I/O. Key insight: it creates temp dirs, writes command-input.json, spawns Claude, reads command-output.json. This is the same mechanism the new CLI will use.

- `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/*.md` (all 5 commands) - The quick workflow command files. Each uses Read Input / Write Output / Self-Terminate pattern. Command 01 outputs test types, commands 02-04 do RED/GREEN/REFACTOR, command 05 transitions Jira to Done.

- `.claude/commands/agentic-hq-commands/workflow/jira-story-workflow/*.md` (all 7 commands) - The full workflow command files that need modification. Currently use `$0`/`$1` parameter pattern instead of file I/O. Have much richer interactive behaviour (plan mode, human questions, etc.). More steps: 01, 02, 03, 04a, 04b, 05.

- `package.json` (demo scripts section) - Currently has `demo:quick-jira-workflow`. The new `demo:full-jira-tdd-story-workflow` script needs to be added.

**Key observations**:
- The full workflow has **7 command files** vs quick workflow's 5 (04 is split into 04a analysis and 04b execute)
- The full workflow's command naming will change from `jira-story-workflow` to `full-jira-tdd-story-workflow` after the `git mv`
- The file I/O pattern (Read Input / Write Output / Self-Terminate) is well-established in the quick workflow commands and just needs to be replicated
- The full workflow commands have more complex internal structure (plan mode, human interaction, multiple sub-steps) but the I/O wrapper pattern is the same

## Agreed Answers Summary

1. **CLI loop structure**: Auto-loop like quick workflow. Each command self-terminates after interactive work, CLI picks up output and chains to next.
2. **Validate step**: Runs once at the very end (after all test type loops). CLI does NOT transition Jira to Done - instead tells human to commit/merge.
3. **Command 01 output**: Just the test types string (same as quick workflow).

## Ready for Next Step

All questions resolved. Since TDD is being skipped for this Jira, proceed directly to implementation.

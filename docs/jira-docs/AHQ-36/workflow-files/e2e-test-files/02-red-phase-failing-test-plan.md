# RED Phase Plan: AHQ-36 E2E Test

## Context

AHQ-36 is about evolving the quick Jira workflow demo CLI from a single-step workflow into a **multi-step workflow with looping**. The single-step version (AHQ-37, AHQ-40) is Done. This e2e test needs to verify the new multi-step workflow produces the correct output files.

**Current state**: CLI runs ONE command that reads Jira, implements it, writes one summary, marks Done.
**Target state**: CLI runs 4 commands: (1) read Jira + return test types, then loop over each test type with (2) RED, (3) GREEN, (4) REFACTOR.

This is the RED phase - write a failing e2e test that will drive the multi-step implementation.

**Decision**: Skip running the full e2e test (~10-20 min) since the failure is obvious. Just verify compilation via `pnpm typecheck`.

---

## Step -1: Fix the Command To Be Clearer About Plan Scope

Edit `.claude/commands/agentic-hq-commands/workflow/jira-story-workflow/02-jira-write-failing-test.md` to make it explicitly clear that:
- The plan created in Step 7a should contain ONLY the design/approach for the test changes (i.e., what to change and why)
- Steps 7b through 10 (writing the test, running it, creating RED phase doc, Jira comment, presenting to human) should NOT be in the plan
- Those steps are completed by re-reading the command AFTER the plan is approved and implemented

---

## Step 0: Copy This Approved Plan

Copy this approved plan to `docs/jira-docs/AHQ-36/workflow-files/e2e-test-files/02-red-phase-failing-test-plan.md`.

---

## Step 1: Design of E2E Test Changes

**File**: `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts`

### 1a. New test Jira description constant

Create `MULTI_STEP_TEST_JIRA_INPUT` with the multi-step Jira description:

```
Title: Hello World CLI With Unit And E2E Tests  Description: Create a hello-world module and CLI.
- Create src/temp-test-hello-world.ts exporting a function helloWorld() that returns "Hello world"
- Create src/temp-test-hello-world.cli.ts that calls helloWorld() and prints the result
- Test types: unit, e2e
- Unit test: test that helloWorld() returns "Hello world"
- E2E test: test that running temp-test-hello-world.cli.ts prints "Hello world"
```

Keep the old `TEST_JIRA_INPUT` for the manual disabled test (AHQ-40).

### 1b. Updated main test assertions

Modify `"should implement a test Jira and produce expected files"` test to use `MULTI_STEP_TEST_JIRA_INPUT` and check for:

**Workflow output files** (in `{projectRoot}/docs/jira-docs/{testJiraId}/workflow-docs/`):
- `01-entire-jira-copy-of-details.md`
- `01-summary-of-jira.md`
- `unit-test-files/02-RED-write-failing-test.summary.md`
- `unit-test-files/03-GREEN-minimal-implementation.summary.md`
- `unit-test-files/04-REFACTOR.summary.md`
- `e2e-test-files/02-RED-write-failing-test.summary.md`
- `e2e-test-files/03-GREEN-minimal-implementation.summary.md`
- `e2e-test-files/04-REFACTOR.summary.md`

**Implementation files** (in `{projectRoot}/src/`):
- `temp-test-hello-world.ts` (module)
- `temp-test-hello-world.cli.ts` (CLI)

**Jira status**: Done (keep existing check)

Remove old assertions (running CLI output check, old summary doc path).

### 1c. Manual disabled test (AHQ-40) unchanged

Continues using `TEST_JIRA_INPUT` and old assertions. Will be updated in a later GREEN/REFACTOR phase when the CLI itself is modified.

### Why the test will fail (RED phase)

The CLI still uses the old single-step command, so multi-step workflow files won't be created. The assertions for `01-entire-jira-copy-of-details.md`, test-type-specific summary files, etc. will all fail.

---

## Final Step: Re-read Command and Complete Remaining Steps

After implementing the above, re-read `.claude/commands/agentic-hq-commands/workflow/jira-story-workflow/02-jira-write-failing-test.md` and complete all remaining steps (7b through 10): write the test, verify compilation, create RED phase document, add Jira comment, present to human.

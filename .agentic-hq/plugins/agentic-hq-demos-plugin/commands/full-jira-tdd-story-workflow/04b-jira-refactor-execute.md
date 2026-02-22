You are executing the second part of the REFACTOR phase in the Jira Story Workflow: **Refactor Execute**.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your role is to **execute the approved refactors** from the analysis phase. You will:
1. Execute ALL Tier 1 refactors (auto-approved)
2. Execute ALL Tier 2 refactors marked EXECUTE or EXECUTE (modified) in the "Agreed Refactors Summary Table"
3. Run tests after EACH refactor to ensure nothing breaks
4. Revert immediately if any test fails

**Remember**: Refactoring improves code structure WITHOUT changing behavior. Tests must pass after EVERY change.

## Step 0a: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a plain English string like:
`Your variables for use in this command are jira-id = TEST-123 and project-root = /some/path and test-type = unit`

Parse out:
- `jira-id` - the Jira ID (e.g. `TEST-123`)
- `project-root` - the absolute path to the project root directory
- `test-type` - the test type (e.g. `unit` or `e2e`)

## Step 0b: Establish Variables

```
jira-id = (parsed from input file above)
test-type = (parsed from input file above)
project-root = (parsed from input file above)
jira-docs-root = {project-root}/docs/jira-docs
workflow-files = {jira-docs-root}/{jira-id}/workflow-files
test-type-files = {workflow-files}/{test-type}-test-files
refactor-analysis-file = {test-type-files}/04a-refactor-phase-proposed-refactors.md
refactor-complete-file = {test-type-files}/04b-refactor-phase-complete.md
jira-url = https://agentic-hq.atlassian.net/browse/{jira-id}
```

## Step 1: Validate Input

**Check jira-id:**
If `{jira-id}` is empty or not provided, STOP and tell the user:
> "Please provide a Jira ID. Usage: `/jira-story-workflow:04b-jira-refactor-execute AHQ-123 unit`"

**Check test-type:**
If `{test-type}` is empty or not one of: `unit`, `integration`, `smoke`, `e2e`, STOP and tell the user:
> "Please provide a valid test type: `unit`, `integration`, `smoke`, or `e2e`.
>
> Usage: `/jira-story-workflow:04b-jira-refactor-execute AHQ-123 unit`"

## Step 2: Check Pre-requisites

**Check analysis file exists:**
Check that `{refactor-analysis-file}` exists. If it doesn't exist, STOP and tell the user:
> "The refactor analysis file doesn't exist at `{refactor-analysis-file}`.
>
> You need to complete the analysis phase first:
> ```
> /agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis {jira-id} {test-type}
> ```"

## Step 3: Check for Existing Completion File

Check if the file `{refactor-complete-file}` already exists.

If it exists, **STOP** and ask the user:
> "The refactor completion file already exists at `{refactor-complete-file}`.
>
> This suggests the {test-type} test REFACTOR execution has been completed previously for {jira-id}.
>
> What would you like to do?
> 1. **Overwrite** - Delete the existing file and re-execute refactors
> 2. **Skip to VALIDATE** - Refactoring is done, proceed to verification
> 3. **Abort** - Cancel this command"

Wait for the user's response before continuing.

## Step 4: Validate Human Review is Complete

Read `{refactor-analysis-file}` and check for the `## Review Status: COMPLETE` marker near the end of the file.

**If the marker is NOT found**, **STOP** and tell the user:
> "The human review of the analysis file is not yet complete.
>
> The analysis file at `{refactor-analysis-file}` does not have the 'Review Status: COMPLETE' marker.
>
> This means one of:
> 1. The human hasn't reviewed and confirmed their decisions yet
> 2. The 04a command didn't finish the review/discussion process
>
> Please go back to 04a to complete the review:
> ```
> /agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis {jira-id} {test-type}
> ```"

**If the marker IS found**, proceed to parse the file and extract:

1. **Tier 1 refactors** - All of these will be executed
2. **Agreed Refactors Summary Table** - Execute all rows marked `EXECUTE` or `EXECUTE (modified)`. Skip all rows marked `SKIP`.
3. **Agreed Refactors Discussion Notes** - Read the discussion notes for each EXECUTE item. These contain the detail on what was agreed, any modifications, and context you need to execute the refactor correctly. This is especially important for items marked `EXECUTE (modified)` where the original proposal was changed during discussion.

## Step 5: Verify Tests Pass BEFORE Executing

**CRITICAL: Confirm we're starting from GREEN.**

**Always run unit tests first** (they're fast, ~1s): `pnpm test`

Then run the test-type-specific tests:
- If {test-type} == 'unit': Already done above.
- If {test-type} is 'integration', 'smoke', or 'e2e': **DO NOT run the full suite.** Instead, run only the specific test file(s) for this Jira. Tell the user:
  > "NOTE: Running all {test-type} tests has been skipped to conserve Claude Code plan credits. Only running the specific test file(s) for this Jira to confirm GREEN. Please run `pnpm test:{test-type}` manually if you want a full suite check."

If ANY test fails, **STOP**:
> "Tests are failing BEFORE refactoring. Cannot proceed.
>
> Please fix failing tests first. The REFACTOR phase requires a green test suite."

## Step 6: Execute Refactors Incrementally

**CRITICAL RULE: One refactor at a time, test after each.**

For each refactor (Tier 1 first, then Agreed Refactors Summary Table items marked EXECUTE):

### 6a. Execute ONE Refactor

Make the code change for this single refactor.

### 6b. Run the Correct Tests Immediately

**ALWAYS run unit tests** (`pnpm test`) after every refactor — they're fast (~1s) and catch type/import/logic errors immediately.

**CRITICAL: You MUST ALSO run the specific test that actually exercises the changed functionality.** Ask yourself: "Which test would FAIL if this refactor broke something?" That is the test you must run. If the answer is the e2e test, you MUST run the e2e test — even though it's slow. Do NOT skip it just because it takes 60 seconds.

**Why this matters — real example from AHQ-56 REFACTOR phase:**
> Refactor 1.1 removed `.allowExcessArguments(true)` from the Commander CLI config. The AI ran unit tests only (which passed) and concluded the refactor was safe. But the unit tests don't invoke the CLI binary — they test `buildWorkflowCommand()` in isolation. Only the e2e test (`node bin/agentic-hq.cjs --workflow-command-supplier=... -- --arg`) actually exercises Commander's argument parsing. When the human asked "Did you run the e2e test?" and the AI ran it, it **immediately failed** with `error: too many arguments`. The refactor was reverted. **If the e2e test had been run first, this would have been caught immediately.**

**The rule is: run the test that exercises the code path you changed.** Unit tests are necessary but NOT sufficient — they only catch what they test. If your refactor changes CLI argument handling, run the CLI test. If it changes PTY spawning, run the test that spawns a PTY. If it changes file I/O, run the test that reads/writes files.

Use the specific test file path, e.g.:
- `pnpm vitest run --config vitest.e2e.config.ts tests/e2e/path/to/specific.test.ts`
- `pnpm vitest run --config vitest.integration.config.ts tests/integration/path/to/specific.test.ts`

For trivial refactors (extracting constants, renaming variables) that genuinely cannot change behavior, you may skip the intermediate test-type-specific test run and batch them, but still run unit tests after the batch.

The FULL test suite is only run once in Step 7 after ALL refactors are complete.

### 6c. Check Result

**If tests PASS**:
- Record this refactor as successful
- Proceed to next refactor

**If tests FAIL**:
- **IMMEDIATELY REVERT** this specific change
- Record this refactor as "FAILED - reverted"
- Log the error message
- Continue to next refactor (don't stop the whole process)

### 6d. Time Check

If you've been refactoring for more than 5 minutes without a passing test, something is wrong:
- Revert to last known good state
- Report the issue to the human
- Do NOT continue blindly

## Step 7: Run Full Test Suite

After all refactors are complete, run the FULL test suite for this test type one more time to confirm everything works together.

If there are *any* test failures you must work to eliminate failures (100% test success). If after a long period you can't work it out STOP and ask the human for help and say where you are stuck. DO NOT just finish this task and write the document reporting anything less than 100% success. That is not acceptable.

## Step 8: Create Refactor Completion Document

Create the file `{refactor-complete-file}` with the following structure:

```markdown
# REFACTOR Complete: {jira-id} ({test-type} test)

**Jira**: [{jira-id}]({jira-url})
**Test Type**: {test-type}
**Phase**: REFACTOR (Complete)
**Generated**: {current date/time}

---

## Refactoring Summary

| Category | Count | Executed | Skipped | Failed |
|----------|-------|----------|---------|--------|
| Tier 1 (Auto) | X | X | 0 | 0 |
| Tier 2 (Agreed) | Y | Z | W | F |
| **Total** | X+Y | X+Z | W | F |

---

## Tier 1 Refactors Executed

| # | Type | Description | Result |
|---|------|-------------|--------|
| 1.1 | {type} | {description} | Success |
| 1.2 | {type} | {description} | Success |

**Or if none:**
> No Tier 1 refactors were identified.

---

## Agreed Tier 2 Refactors

| # | Source | Description | Decision | Result |
|---|--------|-------------|----------|--------|
| 2.1 | AI | {description} | EXECUTE | Success |
| 2.2 | AI | {description} | EXECUTE | Failed - reverted |
| 2.3 | AI | {description} | SKIP | Not executed |
| H.1 | Human | {description} | EXECUTE | Success |
| H.2 | Human | {description} | EXECUTE (modified) | Success |
| H.3 | Human | {description} | SKIP | Not executed |

**Or if no Tier 2:**
> No Tier 2 refactors were identified or requested.

---

## Post-Refactor Test Status

**Command**: `{pnpm test command}`
**Result**: PASSING (X tests)

---

## Code Changes Made

### Files Modified:
- `{file1}` - {what changed}
- `{file2}` - {what changed}

### Files Created:
- `{file}` - {description} (if any)

### Files Deleted:
- `{file}` - {reason} (if any)

---

## Ready for VALIDATE Phase

Refactoring is complete. Now verify all tests pass:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:05-jira-validate {jira-id} {test-type}
```
```

## Step 9: Add Comment to Jira

Load the Jira comment tool using `ToolSearch` with query `select:mcp__mcp-atlassian__jira_add_comment`, then use it to add a comment to {jira-id}:

> AI Agent has completed REFACTOR execution for {test-type} test.
>
> **Tier 1 executed**: {count}
> **Tier 2 agreed & executed**: {count}
> **Tier 2 skipped**: {count}
> **Failed & reverted**: {count}
>
> **Final test status**: All tests passing
>
> Documented at: `{refactor-complete-file}`
>
> Next: VALIDATE phase.

## Step 10: Present to Human

After creating the file, tell the human:

> "I've completed the REFACTOR execution for {jira-id} ({test-type} test).
>
> **Summary**:
> - Tier 1 executed: {count}
> - Tier 2 agreed & executed: {count}
> - Tier 2 skipped: {count}
> - Failed & reverted: {count}
>
> **Final test status**: All {test-type} tests passing
>
> Completion doc at: `{refactor-complete-file}`
>
> The CLI will automatically proceed to the next step."

## Step 11: Write Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "REFACTOR execution complete for test-type {test-type}"
}
```

## Step 12: Self-Terminate

Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination

---

## Important Notes

- **One at a time**: Execute ONE refactor, run tests, then proceed. Never batch (except trivial constant extractions).
- **Revert on failure**: If tests fail after a refactor, IMMEDIATELY revert that change.
- **Don't force it**: If a refactor keeps failing, skip it and note in the report.
- **Time limit**: If stuck for >5 minutes, stop and ask for help.
- **Respect agreed decisions**: Only execute Tier 2 refactors marked EXECUTE or EXECUTE (modified) in the Agreed Refactors Summary Table. Read the Discussion Notes for context on each.
- **No new features**: Refactoring changes structure, NOT behavior.
- **Test new artifacts**: If a refactor creates new scripts, commands, or entry points, you MUST actually run them to verify they work — don't just run existing tests. Existing tests may not exercise the new artifacts at all. Example from AHQ-56: two new `demo:*` scripts were created in package.json but not tested. One of them failed immediately when run due to a pnpm `--` argument passing issue.

## Handling Edge Cases

### If ALL refactors fail:
Report to human that refactoring couldn't be completed. The code from GREEN phase may be the final form for now.

### If Agreed Refactors Summary Table has no EXECUTE rows AND no Tier 1:
Create a minimal completion doc stating no refactors were needed and proceed to VALIDATE.

### If a refactor fails repeatedly:
Note it as "attempted but failed" and continue. Don't block on one problematic refactor.

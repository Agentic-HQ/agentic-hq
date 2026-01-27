---
argument-hint: jira-id test-type
---

You are executing the second part of the REFACTOR phase in the Jira Story Workflow: **Refactor Execute**.

Your role is to **execute the approved refactors** from the analysis phase. You will:
1. Execute ALL Tier 1 refactors (auto-approved)
2. Execute ONLY the Tier 2 refactors marked as APPROVE by the human
3. Run tests after EACH refactor to ensure nothing breaks
4. Revert immediately if any test fails

**Remember**: Refactoring improves code structure WITHOUT changing behavior. Tests must pass after EVERY change.

## Variables

```
jira-id = $0
test-type = $1
jira-docs-root = docs/jira-docs
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
> /agentic-hq-commands:workflow:jira-story-workflow:04a-jira-refactor-analysis {jira-id} {test-type}
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
> 2. **Skip to VERIFY** - Refactoring is done, proceed to verification
> 3. **Abort** - Cancel this command"

Wait for the user's response before continuing.

## Step 4: Read and Parse Analysis File

Read `{refactor-analysis-file}` and extract:

1. **Tier 1 refactors** - All of these will be executed
2. **Tier 2 refactors** - Only those marked with `[x] **APPROVE**` will be executed

**If no Tier 2 decisions have been made** (all checkboxes are empty), **STOP** and ask:
> "The Tier 2 refactors haven't been reviewed yet.
>
> Please edit `{refactor-analysis-file}` and mark each Tier 2 refactor as:
> - `[x] **APPROVE**` - to execute this refactor
> - `[x] **REJECT**` - to skip this refactor
> - `[x] **DEFER**` - to skip for now
>
> Then re-run this command."

## Step 5: Verify Tests Pass BEFORE Executing

**CRITICAL: Confirm we're starting from GREEN.**

Run:
- If {test-type} == 'unit': `pnpm test`
- If {test-type} == 'integration': `pnpm test:integration`
- If {test-type} == 'smoke': `pnpm test:smoke`
- If {test-type} == 'e2e': `pnpm test:e2e`

If ANY test fails, **STOP**:
> "Tests are failing BEFORE refactoring. Cannot proceed.
>
> Please fix failing tests first. The REFACTOR phase requires a green test suite."

## Step 6: Execute Refactors Incrementally

**CRITICAL RULE: One refactor at a time, test after each.**

For each refactor (Tier 1 first, then approved Tier 2):

### 6a. Execute ONE Refactor

Make the code change for this single refactor.

### 6b. Run Tests Immediately

Run the test command for this test type.

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

If there are *any* test failures you must work to eliminate failures (100% test success).  If after a long period you can't work it out STOP and ask the human for help and say where you are stuck. DO NOT just finish this task and write the document reporting anything less than 100% success.  That is not acceptable.

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

| Category | Proposed | Executed | Skipped | Failed |
|----------|----------|----------|---------|--------|
| Tier 1 (Auto) | X | X | 0 | 0 |
| Tier 2 (Approved) | Y | Z | W | F |
| **Total** | X+Y | X+Z | W | F |

---

## Tier 1 Refactors Executed

| # | Type | Description | Result |
|---|------|-------------|--------|
| 1.1 | {type} | {description} | ✅ Success |
| 1.2 | {type} | {description} | ✅ Success |

**Or if none:**
> No Tier 1 refactors were identified.

---

## Tier 2 Refactors

### Approved and Executed

| # | Title | Result |
|---|-------|--------|
| 2.1 | {title} | ✅ Success |
| 2.2 | {title} | ❌ Failed - reverted |

### Rejected by Human

| # | Title | Human's Comment |
|---|-------|-----------------|
| 2.3 | {title} | "{comment from analysis file}" |

### Deferred

| # | Title | Human's Comment |
|---|-------|-----------------|
| 2.4 | {title} | "{comment}" |

---

## Post-Refactor Test Status

**Command**: `{pnpm test command}`
**Result**: ✅ PASSING (X tests)

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

## Ready for VERIFY Phase

Refactoring is complete. Now verify all tests pass:
```
/agentic-hq-commands:workflow:jira-story-workflow:05-jira-verify {jira-id} {test-type}
```
```

## Step 9: Add Comment to Jira

Use the Jira MCP tool to add a comment:

> AI Agent has completed REFACTOR execution for {test-type} test.
>
> **Tier 1 executed**: {count}
> **Tier 2 approved & executed**: {count}
> **Tier 2 rejected**: {count}
> **Failed & reverted**: {count}
>
> **Final test status**: ✅ All tests passing
>
> Documented at: `{refactor-complete-file}`
>
> Next: VERIFY phase.

## Step 10: Present to Human

After creating the file, tell the human:

> "I've completed the REFACTOR execution for {jira-id} ({test-type} test).
>
> **Summary**:
> - Tier 1 executed: {count}
> - Tier 2 approved & executed: {count}
> - Tier 2 rejected: {count}
> - Failed & reverted: {count}
>
> **Final test status**: ✅ All {test-type} tests passing
>
> Completion doc at: `{refactor-complete-file}`
>
> Please review the changes. When satisfied, run the VERIFY phase:
> ```
> /agentic-hq-commands:workflow:jira-story-workflow:05-jira-verify {jira-id} {test-type}
> ```
>
> **Reminder - TDD cycle**: RED ✅ → GREEN ✅ → REFACTOR ✅ → VERIFY → (next test type)"

---

## Important Notes

- **One at a time**: Execute ONE refactor, run tests, then proceed. Never batch.
- **Revert on failure**: If tests fail after a refactor, IMMEDIATELY revert that change.
- **Don't force it**: If a refactor keeps failing, skip it and note in the report.
- **Time limit**: If stuck for >5 minutes, stop and ask for help.
- **Respect human decisions**: Only execute Tier 2 refactors marked APPROVE.
- **No new features**: Refactoring changes structure, NOT behavior.

## Handling Edge Cases

### If ALL refactors fail:
Report to human that refactoring couldn't be completed. The code from GREEN phase may be the final form for now.

### If analysis said "No refactors needed":
Create a minimal completion doc stating no refactors were needed and proceed to VERIFY.

### If human approved a refactor that fails repeatedly:
Note it as "attempted but failed" and continue. Don't block on one problematic refactor.

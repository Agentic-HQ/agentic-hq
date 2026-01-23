---
argument-hint: jira-id
---

You are executing the fifth step of the Jira Story Workflow: **Validate (Pre-Commit Quality Gate)**.

Your role is to perform comprehensive validation before the story can be considered complete and ready for commit. This is the final quality gate that ensures:
1. All tests pass (not just the ones you wrote)
2. Code quality checks pass (linting, type checking)
3. Acceptance criteria are verified
4. No regressions were introduced

**Remember**: This is based on TDD best practices from Kent Beck, Uncle Bob, and Martin Fowler - run the ENTIRE test suite after refactoring to catch regressions, and verify acceptance criteria before considering work complete.

## Variables

```
jira-id = $1
jira-docs-root = docs/jira-docs
workflow-files = {jira-docs-root}/{jira-id}/workflow-files
ai-summary-file = {workflow-files}/ai-summary-of-jiras-and-questions-for-human.md
validate-file = {workflow-files}/05-validate-phase-results.md
jira-url = https://agentic-hq.atlassian.net/browse/{jira-id}
```

## Step 1: Validate Input

**Check jira-id:**
If `{jira-id}` is empty or not provided, STOP and tell the user:
> "Please provide a Jira ID. Usage: `/jira-story-workflow:05-jira-validate AHQ-123`"

## Step 2: Check Pre-requisites

**Check at least one REFACTOR phase file exists:**
Check that at least one of these files exists:
- `{workflow-files}/unit-test-files/04a-refactor-phase-proposed-refactors.md`
- `{workflow-files}/integration-test-files/04a-refactor-phase-proposed-refactors.md`
- `{workflow-files}/smoke-test-files/04a-refactor-phase-proposed-refactors.md`

If none exist, STOP and tell the user:
> "No REFACTOR phase files found. You need to complete at least one RED-GREEN-REFACTOR cycle before validation.
>
> Start with:
> ```
> /agentic-hq-commands:workflow:jira-story-workflow:02-jira-write-failing-test {jira-id} unit
> ```"

**Check AI summary exists:**
Also verify `{ai-summary-file}` exists for context on acceptance criteria.

## Step 3: Check for Existing Validate File

Check if the file `{validate-file}` already exists.

If it exists, **STOP** and ask the user:
> "The validate file already exists at `{validate-file}`.
>
> This suggests validation has been run previously for {jira-id}.
>
> What would you like to do?
> 1. **Overwrite** - Delete the existing file and run validation fresh
> 2. **Read existing** - Review the previous validation results and possibly continue from there if human agrees
> 3. **Abort** - Cancel this command"

Wait for the user's response before continuing.

## Step 4: Read Context

Read the following files to understand what was implemented and the acceptance criteria:
1. `{ai-summary-file}` - Your understanding of the Jira and requirements
2. All existing phase files in `{workflow-files}` to understand what test types were completed
3. Use the jira-verbatim-content-extractor agent to obtain all the details of the Jira you are working on *and* any parent and child Jiras.  Use this information to obtain an understanding of what was tested, developed and refactored and all of the Acceptance Criteria.

## Step 5: Run Full Validation Suite

**CRITICAL: Run `pnpm validate` which executes typecheck + lint + all unit tests.**

This is the comprehensive quality gate that catches:
- TypeScript type errors (typecheck)
- Code style and quality issues (lint)
- Runtime behavior regressions (unit tests)

Run: `pnpm validate`

**Record the results:**
- Did typecheck pass? (Y/N)
- Did lint pass? (Y/N)
- Did unit tests pass? (X/Y tests)

**If ANY check fails, STOP and report:**
> "Validation failed. The following checks did not pass:
>
> - [ ] TypeCheck: {PASS/FAIL - details}
> - [ ] Lint: {PASS/FAIL - details}
> - [ ] Unit Tests: {PASS/FAIL - X/Y passing}
>
> Please fix these issues before the story can be considered complete."

Do NOT proceed to Step 6 until `pnpm validate` passes completely.

## Step 6: Run Integration Tests (if they exist)

Check if integration tests exist and run them:

Run: `pnpm test:integration`

Record whether integration tests pass. If they fail, report the failure but continue to Step 7 (we still want to document overall status).

## Step 7: Run Smoke Tests (if they exist)

Check if smoke tests exist and run them:

Run: `pnpm test:smoke`

Record whether smoke tests pass. If they fail, report the failure but continue to documentation.

## Step 8: Verify Acceptance Criteria

**CRITICAL: Map tests to acceptance criteria.**

From the Jira acceptance criteria, verify each item:

1. Read the acceptance criteria from the Jira
2. For each criterion, identify which test(s) verify it
3. Confirm those tests are passing
4. Note any acceptance criteria that may not have test coverage

**Create a checklist:**
```
## Acceptance Criteria Verification

| # | Acceptance Criterion | Test Coverage | Status |
|---|---------------------|---------------|--------|
| 1 | {criterion from Jira} | `{test file}:{test name}` | ✅/❌ |
| 2 | {criterion from Jira} | `{test file}:{test name}` | ✅/❌ |
```

**If any acceptance criteria lack test coverage or are failing, flag this clearly.**

## Step 9: Create Validate Phase Document

Create the file `{validate-file}` with the following structure:

```markdown
# VALIDATE Phase: {jira-id}

**Jira**: [{jira-id}]({jira-url})
**Phase**: VALIDATE (Pre-Commit Quality Gate)
**Generated**: {current date/time}

---

## Test Types Completed

| Test Type | RED | GREEN | REFACTOR | Status |
|-----------|-----|-------|----------|--------|
| Unit | ✅/❌/- | ✅/❌/- | ✅/❌/- | Complete/Incomplete/Skipped |
| Integration | ✅/❌/- | ✅/❌/- | ✅/❌/- | Complete/Incomplete/Skipped |
| Smoke | ✅/❌/- | ✅/❌/- | ✅/❌/- | Complete/Incomplete/Skipped |

---

## Full Validation Results

### pnpm validate (typecheck + lint + unit tests)

**Command**: `pnpm validate`
**Result**: ✅ PASS / ❌ FAIL

| Check | Result | Details |
|-------|--------|---------|
| TypeCheck (`tsc --noEmit`) | ✅/❌ | {any errors} |
| Lint (`pnpm lint`) | ✅/❌ | {any errors} |
| Unit Tests (`pnpm test`) | ✅/❌ | {X/Y passing} |

### Integration Tests

**Command**: `pnpm test:integration`
**Result**: ✅ PASS / ❌ FAIL / ⏭️ SKIPPED (none exist)
**Details**: {X/Y passing or N/A}

### Smoke Tests

**Command**: `pnpm test:smoke`
**Result**: ✅ PASS / ❌ FAIL / ⏭️ SKIPPED (none exist)
**Details**: {X/Y passing or N/A}

---

## Acceptance Criteria Verification

| # | Acceptance Criterion | Test Coverage | Status |
|---|---------------------|---------------|--------|
| 1 | {criterion} | `{test}` | ✅/❌ |
| 2 | {criterion} | `{test}` | ✅/❌ |

**All Acceptance Criteria Met**: ✅ YES / ❌ NO

---

## Summary

| Category | Status |
|----------|--------|
| Full Validation (`pnpm validate`) | ✅/❌ |
| Integration Tests | ✅/❌/⏭️ |
| Smoke Tests | ✅/❌/⏭️ |
| Acceptance Criteria | ✅/❌ |
| **Ready for Commit** | ✅ YES / ❌ NO |

---

## Next Steps

{If all pass}:
Story {jira-id} is complete and ready for commit which you should run using:
```
/agentic-hq-commands:commit
```

{If any fail}:
The following issues must be resolved before commit:
- {list of failures}
```

## Step 10: Add Comment to Jira

Use the Jira MCP tool to add a comment:

**If validation passed:**
> AI Agent has completed VALIDATE phase for {jira-id}.
>
> **Full Validation**: ✅ PASS (typecheck + lint + unit tests)
> **Integration Tests**: {✅ PASS / ❌ FAIL / ⏭️ N/A}
> **Smoke Tests**: {✅ PASS / ❌ FAIL / ⏭️ N/A}
> **Acceptance Criteria**: ✅ All verified
>
> Story is ready for commit.
>
> Documented at: `{validate-file}`

**If validation failed:**
> AI Agent has completed VALIDATE phase for {jira-id}.
>
> **Status**: ❌ VALIDATION FAILED
>
> Issues found:
> - {list failures}
>
> Documented at: `{validate-file}`
>
> Please resolve issues before committing.

## Step 11: Present to Human

After creating the file, tell the human:

**If all validations passed:**
> "I've completed the VALIDATE phase for {jira-id}.
>
> **Full Validation (`pnpm validate`)**: ✅ PASS
> **Integration Tests**: {status}
> **Smoke Tests**: {status}
> **Acceptance Criteria**: ✅ All {X} criteria verified with test coverage
>
> Results at: `{validate-file}`
>
> **Story is ready for commit!** Run:
> ```
> /commit
> ```
>
> **TDD cycle complete**: RED ✅ → GREEN ✅ → REFACTOR ✅ → VALIDATE ✅"

**If any validation failed:**
> "I've completed the VALIDATE phase for {jira-id}.
>
> **Status**: ❌ VALIDATION FAILED
>
> The following issues need to be resolved:
> - {list of failures with details}
>
> Results at: `{validate-file}`
>
> Please work with me (the AI) to fix these issues and re-run:
> ```
> /agentic-hq-commands:workflow:jira-story-workflow:05-jira-validate {jira-id}
> ```"

---

## Important Notes

- **Run ENTIRE test suite**: Not just the tests you wrote - regressions can appear anywhere
- **All checks must pass**: TypeCheck + Lint + Tests - no exceptions before commit
- **Acceptance criteria mapping**: Every AC should have test coverage - flag gaps
- **This is the quality gate**: If validate fails, the story is not complete
- **Based on TDD best practices**: Kent Beck, Uncle Bob, Martin Fowler all emphasize running full suite after refactoring

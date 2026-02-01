---
argument-hint: jira-id test-type
---

You are executing the third step of the Jira Story Workflow: **Minimal Implementation (GREEN Phase)**.

Your role is to write the **minimum code necessary** to make the failing test pass. This is the GREEN phase of TDD - quick, dirty, and focused solely on making the test pass. No gold-plating, no extra features, no premature optimization.

**Remember**: You will run REFACTOR after this, so don't worry about code quality yet - just make it work!

## Variables

```
jira-id = $0
test-type = $1
jira-docs-root = docs/jira-docs
workflow-files = {jira-docs-root}/{jira-id}/workflow-files
test-type-files = {workflow-files}/{test-type}-test-files
ai-summary-file = {workflow-files}/ai-summary-of-jiras-and-questions-for-human.md
red-phase-file = {test-type-files}/02-red-phase-failing-tests.md
green-phase-plan-file = {test-type-files}/03-green-phase-implementation-plan.md
green-phase-file = {test-type-files}/03-green-phase-summary-of-what-was-implemented.md
jira-url = https://agentic-hq.atlassian.net/browse/{jira-id}
```

## Step 0: Understand Warning About Plan Mode

WARNING: Don't start implementing **any** code changes until Step 6a (Plan Mode) has been successfully completed and the user has approved your planned implementation.  This is a critical part of the Code Review process - as the user finds it much easier to review code when they have read, understood and approved the plan **before** the code is created. Also catches problems/misunderstandings earlier and faster.

Tell the user you have read "Step 0" and won't be doing any code changes with getting approval from them in Plan Mode first.

## Step 1: Validate Input

**Check jira-id:**
If `{jira-id}` is empty or not provided, STOP and tell the user:
> "Please provide a Jira ID. Usage: `/jira-story-workflow:03-jira-minimal-implementation AHQ-123 unit`"

**Check test-type:**
If `{test-type}` is empty or not one of: `unit`, `integration`, `smoke`, `e2e`, STOP and tell the user:
> "Please provide a valid test type: `unit`, `integration`, `smoke`, or `e2e`.
>
> Usage: `/jira-story-workflow:03-jira-minimal-implementation AHQ-123 unit`"

## Step 2: Check Pre-requisites

**Check RED phase file exists:**
Check that `{red-phase-file}` exists. If it doesn't exist, STOP and tell the user:
> "The RED phase file doesn't exist at `{red-phase-file}`.
>
> You need to complete the RED phase before implementing:
> ```
> /agentic-hq-commands:workflow:jira-story-workflow:02-jira-write-failing-test {jira-id} {test-type}
> ```"

**Check AI summary exists:**
Also verify `{ai-summary-file}` exists for context.

## Step 3: Check for Existing GREEN Phase File

Check if the file `{green-phase-file}` already exists.

If it exists, **STOP** and ask the user:
> "The GREEN phase file already exists at `{green-phase-file}`.
>
> This suggests the {test-type} test GREEN phase has been run previously for {jira-id}.
>
> What would you like to do?
> 1. **Overwrite** - Delete the existing file and start fresh
> 2. **Read existing and continue** - Review where we left off
> 3. **Abort** - Cancel this command"

Wait for the user's response before continuing.

## Step 4: Read Context

Read the following files to understand what needs to be implemented:
1. `{ai-summary-file}` - Your understanding of the Jira and requirements
2. `{red-phase-file}` - The failing test and expected behavior
3. The actual test file(s) mentioned in the RED phase document
4. Use the jira-verbatim-content-extractor agent to obtain all the details of the Jira you are working on *and* any parent and child Jiras.  Use this information to obtain an understanding of what you are implementing and the acceptance criteria and the EXACT commands that you need to run to get GREEN for this test type.

## Step 5: Identify What Code to Write

From the failing test, determine:
1. **What file(s) need to be created** - based on the import paths in the test
2. **What function(s)/class(es) need to exist** - based on what the test calls
3. **What behavior is expected** - based on the assertions

**Example for AHQ-6:**
- Test imports: `import { helloWorld } from '../../src/misc/hello-world.js'`
- Test calls: `helloWorld()`
- Test expects: `'Hello world'`
- Therefore: Create `src/misc/hello-world.ts` with a `helloWorld()` function that returns `'Hello world'`


## Step 6a: Instruct The Human To Put You In Plan Mode And Create The Implementation Plan

Ask the human to put you in Plan Mode for doing the implementation in steps 6b and 6c and once they have done that and told you they have done it, then do the following:

1. Create the plan for the implementation steps 6b and 6c (re-read the instructions in 6b and 6c to be clear)

2. **Create a "Jira Requirements (Numbered)" section** at the top of your plan:
   - Go through *every* single detail in the Jira that defines something that should affect the implementation
   - List each requirement with a number (1, 2, 3, etc.)
   - At the end of each numbered requirement, add an arrow (→) pointing to which section of YOUR plan addresses that requirement
   - Example format:
     ```
     1. CLI location: `src/demo/cli/my-cli.ts` → [Step 3: Create CLI file]
     2. Uses Commander library → [Step 1: Install Commander]
     3. **AC1**: E2E test passes → [Verification: Automated]
     4. Out of scope: error handling → N/A (nothing to implement)
     ```
   - If a requirement doesn't point to any section in your plan, you've missed it - rework the plan to include it
   - Do NOT scatter "Maps to: Req #X" annotations throughout the plan - keep the mapping in ONE place (this section)

3. Add to the end of the Plan a TODO to come back and re-read this command file for testing and documenting instructions after step 6c. IMPORTANT: Do not copy those instructions into the Plan - you will miss bits.

4. Copy the entire plan to {green-phase-plan-file} and tell the human where it is

5. Present the Plan to the user and get their feedback, modify based on feedback

6. When finally approved, re-copy the updated plan to {green-phase-plan-file}

7. Then implement the Plan

## Step 6b: Write the Minimal Implementation

**CRITICAL GREEN PHASE RULES:**
- Write **only** enough code to make the test pass
- **No extra features** beyond what the test checks
- **No premature optimization** - slow and correct is fine
- **No gold-plating** - ugly but working is acceptable
- **Hard-coded values are OK** if that's all the test needs
- **Copy-pasting and duplication are expected and OK** whatever is fastest and easiest (duplication will be removed during REFACTOR stage)
- You can clean it up in the REFACTOR phase

### 6c. Create the Implementation File(s)

Create the minimum files needed. For example:

```typescript
// src/misc/hello-world.ts
/**
 * Returns the Hello world greeting string.
 * AHQ-6: Minimal implementation to pass unit test.
 */
export function helloWorld(): string {
  return 'Hello world';
}
```
An example of Gold Plating here would be to look at the Jira and see that it is talking about a CLI and then making this program work as a CLI.  That is *NOT* permitted since it is *not* the minimum to pass the test. If the test doesn't require a CLI - **DON'T CREATE A CLI** (even if the spec says so).  Your **only** goal is to pass the test.  If the test isn't good enough to make the spec be executed - we will have to come back and improve the test, or add more Jiras/tests. Doing more than the test requires **may break the flow of the next** test, since that test may now pass in the RED phase even though it hasn't been implemented.  Again: this is the reason you **must** only do the minimum that will get the pass you have been told to work on to turn GREEN. 

Another example of Gold Plating is clearing up temp files.  If you think you should delete temp files after you have created them, but the test would still pass if you didn't then: you **must not clear up the temp files**.  The test is **the** spec - and you must only do the **minimum** necessary to make it pass - nothing more.

Thanks.

### 6d. Check Acceptance Criteria for Additional Requirements

**CRITICAL: Read the acceptance criteria again** to check if this test type requires additional setup beyond just the implementation code.

For example, AHQ-6 acceptance criteria includes:
- `pnpm hello-world` - runs hello-world.ts and prints "Hello world"

This means for the **smoke test** (not unit test), you'd also need to set up a CLI entry point. But for the **unit test**, only the function needs to exist.

**Match your implementation to what THIS test type requires.**

## Step 7: Run the Test Using the AC Command (Expect Success)

**CRITICAL: Use the EXACT pnpm command from the acceptance criteria** - NOT `npx vitest` or other shortcuts.

Run the test command (e.g., `pnpm test:hello-world` for the specific test) and verify:
- ✅ The test **passes**
- ✅ No compilation errors
- ✅ The assertion succeeds

**If the test still fails:**
1. Read the error message carefully
2. Fix **only** what's needed to make it pass
3. Run again
4. Repeat until green

**Do NOT add extra code "just in case"** - only fix what the test failure tells you to fix.

## Step 7b: Run all the Tests Of Type {test-type} Using the Command That Runs All Those Test (Expect Success)

To make sure your implementation hasn't broken any of the other tests of type: {test-type} run:

- If {test-type} == 'unit': pnpm test (runs all unit tests)
- If {test-type} == 'integration': pnpm test:integration (runs all integration tests - NOTE: we may have to change our mind if these tests are slow later...?)
- If {test-type} == 'smoke': pnpm test:smoke (runs all smoke tests - NOTE: we may have to change our mind if these tests are slow later...?)
- If {test-type} == 'e2e': pnpm test:e2e (runs all e2e tests - NOTE: we may have to change our mind if these tests are slow later...?)

## Step 7c: Human Verifies Manual Acceptance Tests (if any)

**CRITICAL: GREEN phase is NOT complete until ALL tests pass - including manual tests!**

Check the Jira acceptance criteria for any tests marked as "MANUAL" or "manual test run by the human". If there are manual tests:

1. **Present the manual test instructions to the human** - tell them exactly what commands to run and what to verify
2. **STOP and wait for the human to confirm** each manual test passes
3. **Do NOT proceed to Step 8** until the human confirms ALL manual tests pass

Example prompt to human:
> "The automated tests are passing. Before I can complete GREEN phase, please verify these manual acceptance tests:
>
> **AC2 (Manual)**: Run `pnpm demo:string-reversal --string-to-reverse="test"` and verify you can interrupt Claude mid-execution.
>
> **AC3 (Manual)**: Run the same command and verify Claude displays full screen and resizes correctly.
>
> Please run these tests and let me know the results. GREEN phase cannot be documented as complete until all tests pass."

**If manual tests fail**: Work with the human to fix the implementation, then re-run automated tests and re-verify manual tests.

**If no manual tests exist**: Proceed directly to Step 8.

## Step 8: Create GREEN Phase Document (only after ALL tests pass)

Create the file `{green-phase-file}` with the following structure:

```markdown
# GREEN Phase Complete: {jira-id} ({test-type} test)

**Jira**: [{jira-id}]({jira-url})
**Test Type**: {test-type}
**Phase**: GREEN (Minimal Implementation)
**Generated**: {current date/time}

---

## Implementation Created

**Files Created/Modified**:
- `{path/to/implementation.ts}` - {brief description}

**Test Command**: `{exact pnpm command from AC}`
**Test Result**: ✅ PASSING

---

## What Was Implemented

{Brief description of the minimal code written to pass the test}

## Files Created

- `{path/to/file.ts}` - {description}

---

## Ready for REFACTOR Phase

The test is passing. Now review and refactor the code:
```
/agentic-hq-commands:workflow:jira-story-workflow:04a-jira-refactor-analysis {jira-id} {test-type}
```
```

## Step 9: Add Comment to Jira

Use the Jira MCP agent to add a comment to the Jira:

> AI Agent has completed GREEN phase for {test-type} test.
>
> **Implementation Created**: `{implementation file path}`
> **Test Passing**: ✅ Yes - `{pnpm command}` passes
>
> Documented at: `{green-phase-file}`
>
> Next: REFACTOR phase to clean up the implementation.

## Step 10: Present to Human and STOP

After creating the file, tell the human:

> "I've completed the GREEN phase for {jira-id} ({test-type} test).
>
> **Implementation Created**: `{path/to/implementation.ts}`
> **Test Passing**: ✅ Yes - `{pnpm command}` passes
>
> Summary at: `{green-phase-file}`
>
> Please review the implementation. When you're satisfied that:
> 1. The test passes with the correct command
> 2. The implementation is minimal but correct
> 3. No unnecessary code was added
>
> ...then run the REFACTOR analysis phase:
> ```
> /agentic-hq-commands:workflow:jira-story-workflow:04a-jira-refactor-analysis {jira-id} {test-type}
> ```
>
> **Reminder - TDD cycle**: RED ✅ → GREEN ✅ → REFACTOR → VERIFY → (next test type)"

**🛑 CRITICAL: STOP HERE - DO NOT CONTINUE TO REFACTORING 🛑**

Your work for this command is COMPLETE. Do NOT:
- Start reviewing code for refactoring opportunities
- Begin the REFACTOR phase yourself
- Make any additional code changes

The human will start the REFACTOR phase properly by running the next command. If you start refactoring without that command, you will do it incorrectly because the REFACTOR command has specific instructions and structure that you need to follow.

---

## Important Notes

- **Minimal means minimal**: Only write code that makes the test pass - nothing more
- **Hard-coded is OK**: If the test only checks one value, hard-coding that value is fine
- **Ugly is OK**: Code quality improvements happen in REFACTOR, not GREEN
- **Use AC commands**: Always run tests with the exact pnpm command from acceptance criteria
- **🛑 STOP after Step 10**: Do NOT continue to REFACTOR on your own - wait for the human to run the REFACTOR command

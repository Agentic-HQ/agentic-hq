You are executing the third step of the Jira Story Workflow: **Minimal Implementation (GREEN Phase)**.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your role is to write the **minimum code necessary** to make the failing test pass. This is the GREEN phase of TDD - quick, dirty, and focused solely on making the test pass. No gold-plating, no extra features, no premature optimization.

**Remember**: You will run REFACTOR after this, so don't worry about code quality yet - just make it work!

## Step 0a: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a plain English string like:
`Your variables for use in this command are jira-id = TEST-123 and test-type = unit`

Parse out:
- `jira-id` - the Jira ID (e.g. `TEST-123`)
- `test-type` - the test type (e.g. `unit` or `e2e`)

## Step 0b: Establish Variables

```
jira-id = (parsed from input file above)
test-type = (parsed from input file above)
project-root = (your primary working directory)
jira-docs-root = {project-root}/docs/jira-docs
workflow-files = {jira-docs-root}/{jira-id}/workflow-files
test-type-files = {workflow-files}/{test-type}-test-files
ai-summary-file = {workflow-files}/ai-summary-of-jiras-and-questions-for-human.md
red-phase-file = {test-type-files}/02-red-phase-failing-tests.md
green-phase-plan-file-copy = {test-type-files}/03-green-phase-implementation-plan-copy.md
green-phase-file = {test-type-files}/03-green-phase-summary-of-what-was-implemented.md
jira-url = https://agentic-hq.atlassian.net/browse/{jira-id}
project-design-requirements-filename = project-design-requirements.md
design-requirements-default-path = {project-root}/docs/dev/{project-design-requirements-filename}
```

## Step 0: Understand Warning About Plan Mode

WARNING: Don't start implementing **any** code changes until Step 6a (Plan Mode) has been successfully completed and the user has approved your planned implementation.  This is a critical part of the Code Review process - as the user finds it much easier to review code when they have read, understood and approved the plan **before** the code is created. Also catches problems/misunderstandings earlier and faster.

Tell the user you have read "Step 0" and won't be doing any code changes without getting approval via Plan Mode first.

## Step 1: Validate Input

**Check jira-id:**
If `{jira-id}` is empty or not provided, STOP and tell the user:
> "Please provide a Jira ID. Usage: `/jira-story-workflow:03-jira-minimal-implementation AHQ-123 unit`"

**Check test-type:**
If `{test-type}` is empty or not one of: `unit`, `integration`, `smoke`, `e2e`, `manual`, STOP and tell the user:
> "Please provide a valid test type: `unit`, `integration`, `smoke`, `e2e`, or `manual`.
>
> Usage: `/jira-story-workflow:03-jira-minimal-implementation AHQ-123 unit`"

## Step 2: Check Pre-requisites

**Check RED phase file exists:**
Check that `{red-phase-file}` exists. If it doesn't exist, STOP and tell the user:
> "The RED phase file doesn't exist at `{red-phase-file}`.
>
> You need to complete the RED phase before implementing:
> ```
> /agentic-hq-demos-plugin:full-jira-tdd-story-workflow:02-jira-write-failing-test {jira-id} {test-type}
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
5. Discover and read the project design requirements file: check `{design-requirements-default-path}` first, then search the workspace for `{project-design-requirements-filename}` if not found. If found, read it — these are the project's OO design principles that your implementation plan must address. If not found, note this and continue.

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


## Step 6a: Enter Plan Mode And Create The Implementation Plan

Use the `EnterPlanMode` tool to enter Plan Mode for the implementation in steps 6b and 6c. Once in Plan Mode, do the following:

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

2b. **Add a "## Project Design Requirements Compliance" section** to the plan. If the design requirements file was not found, write "Skipped - no project-design-requirements.md found in workspace" and move on. Otherwise, create a table mapping each relevant requirement to the plan section that addresses it:
   ```
   | # | Design Requirement | Plan Section Addressing It | Notes |
   |---|-------------------|---------------------------|-------|
   | D.1 | Class/interface pair for each concept | Step 2: Create FooInterface + DefaultFoo | Foo is the core concept in this Jira |
   | D.2 | Tell don't ask | Step 3: Push display logic into FooResult.display() | Instead of extracting and manipulating state |
   | D.3 | Minimal state / avoid caching | Step 2: FooResult delegates to sub-objects | No intermediate List<> storage |
   | D.4 | Switchable concrete classes | Step 2: DefaultFoo implements Foo interface | Third party could provide CustomFoo |
   ```
   - Flag any requirements that the plan does NOT meet and explain why (e.g., "This is a utility function, not a domain concept — class/interface pair not warranted per the document's 'balance' caveat")
   - NOTE: This is the GREEN phase. The implementation is intentionally minimal — "ugly but working is acceptable". Not all design requirements need to be fully met here. If deferring, state clearly: "Deferred to REFACTOR: {requirement} because GREEN phase only requires minimal passing code."
   - This section must be presented to the user as part of the plan review so they can verify design requirements are being addressed

3. Add to the end of the Plan a TODO to come back and re-read this command file for testing and documenting instructions after step 6c. IMPORTANT: Do not copy those instructions into the Plan - you will miss bits.

4. Copy the entire plan to {green-phase-plan-file-copy} and tell the human where it is

5.a. **CRITICAL: The plan MUST include as its FIRST step (Step 0): "Copy this approved plan to `{green-phase-plan-file-copy}` before proceeding with implementation"** - this ensures the plan file is saved to the workflow directory

5.b. Present the Plan to the user and get their feedback, modify based on feedback

6. When finally approved, re-copy the updated plan to {green-phase-plan-file-copy}

7. Then implement the Plan

## Step 6b: Write the Minimal Implementation

**CHECKPOINT: Before proceeding, verify you have completed Step 0 from your plan - copying the approved plan to `{green-phase-plan-file-copy}`. If not, do it NOW before continuing.**

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

**If test-type is `manual`:** Skip the automated test commands below. Instead, tell the human:
> "Implementation is complete. Since this is a **manual** test type, please manually test the implementation and confirm it works.
>
> Please let me know when you've tested and whether it passes."

**STOP and WAIT** for human confirmation. If the human reports issues, work with them to fix the implementation and ask them to re-test. Once confirmed working, skip to Step 8.

**For all other test types:**

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

## Step 7b: Run all the Tests Of Type {test-type} (SKIPPED for non-unit and manual)

- If {test-type} == 'manual': **SKIP** — manual testing is handled by the human in Step 7 above.
- If {test-type} == 'unit': Run `pnpm test` (runs all unit tests)
- If {test-type} is 'integration', 'smoke', or 'e2e': **DO NOT run the full suite.** Tell the user:
  > "NOTE: Running all {test-type} tests has been skipped to conserve Claude Code plan credits. Please run `pnpm test:{test-type}` manually if you want to verify no other tests were broken."

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

{Brief summary of what was built and why — 2-3 sentences max. What does the implementation do at a high level?}

### Key implementation decisions:

{List the important design/implementation choices made during GREEN. These help the human reviewer and the REFACTOR agent understand WHY things were done this way — not just what was done.}

1. **{Decision area}**: {What was decided and why}
2. **{Decision area}**: {What was decided and why}

### Bugs found and fixed during GREEN:

{During GREEN phase, you will often hit unexpected issues that require fixes beyond the planned implementation. **Document every bug/issue here** — this section is critical for the human reviewer because it surfaces changes that weren't in the original plan, helping them understand what happened and why. Without this, the human has to reverse-engineer unexpected changes from the git diff.}

{List each bug with: what went wrong, how you fixed it, and which file(s) were affected.}

1. {Problem} - fixed with {solution} in `{file}`
2. {Problem} - {solution}

{If no bugs were encountered, write: "None - implementation went as planned."}

## Files Created

- `{path/to/file.ts}` - {description}

## Files Modified

- `{path/to/existing-file.ts}` - {brief description of what changed}

---

## Ready for REFACTOR Phase

The test is passing. This program should self terminate, and then (if you are running the automated workflow) the following command will be run automatically:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis {jira-id} {test-type}
```
```

## Step 9: Add Comment to Jira

Load the Jira comment tool using `ToolSearch` with query `select:mcp__mcp-atlassian__jira_add_comment`, then use it to add a comment to {jira-id}:

> AI Agent has completed GREEN phase for {test-type} test.
>
> **Implementation Created**: `{implementation file path}`
> **Test Passing**: ✅ Yes - `{pnpm command}` passes
>
> Documented at: `{green-phase-file}`
>
> Next: REFACTOR phase to clean up the implementation.

## Step 10: Present to Human

After creating the file, tell the human:

> "I've completed the GREEN phase for {jira-id} ({test-type} test).
>
> **Implementation Created**: `{path/to/implementation.ts}`
> **Test Passing**: ✅ Yes - `{pnpm command}` passes
>
> Summary at: `{green-phase-file}`
>
> The CLI will automatically proceed to the REFACTOR analysis phase next."

## Step 11: Write Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "GREEN phase complete for test-type {test-type}"
}
```

## Step 12: Self-Terminate

Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination

---

## Important Notes

- **Minimal means minimal**: Only write code that makes the test pass - nothing more
- **Hard-coded is OK**: If the test only checks one value, hard-coding that value is fine
- **Ugly is OK**: Code quality improvements happen in REFACTOR, not GREEN
- **Use AC commands**: Always run tests with the exact pnpm command from acceptance criteria

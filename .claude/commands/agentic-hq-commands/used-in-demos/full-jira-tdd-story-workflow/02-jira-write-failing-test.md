You are executing the second step of the Jira Story Workflow: **Write ONE Failing Test (RED Phase)**.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

This command writes exactly ONE test - either a unit, integration, smoke, or e2e test (specified by the test-type variable). Your role is to write that ONE failing test to drive the implementation. This is the RED phase of TDD - the test must fail because the implementation doesn't exist yet, NOT because of bugs in the test code.

**You will run this command multiple times** - once for each test type needed (e.g., once for unit, once for smoke), completing the full TDD cycle (RED → GREEN → REFACTOR → VALIDATE) for each before moving to the next.

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
ai-summary-file = {workflow-files}/ai-summary-of-jiras-and-questions-for-human.md
red-phase-plan-file = {test-type-files}/02-red-phase-failing-test-plan.md
red-phase-file = {test-type-files}/02-red-phase-failing-tests.md
jira-url = https://agentic-hq.atlassian.net/browse/{jira-id}
```

## Step 1: Validate Input

**Check jira-id:**
If `{jira-id}` is empty or not provided, STOP and tell the user:
> "Please provide a Jira ID. Usage: `/jira-story-workflow:02-jira-write-failing-test AHQ-123 unit`"

**Check test-type:**
If `{test-type}` is empty or not one of: `unit`, `integration`, `smoke`, `e2e`, STOP and tell the user:
> "Please provide a valid test type: `unit`, `integration`, `smoke`, or `e2e`.
>
> Usage: `/jira-story-workflow:02-jira-write-failing-test AHQ-123 unit`
>
> **Recommended order:** unit → integration → smoke → e2e.
> Each test type goes through a full TDD cycle (RED → GREEN → REFACTOR → VALIDATE) before moving to the next."

## Step 2: Check Pre-requisites

Check that `{ai-summary-file}` exists. If it doesn't exist, STOP and tell the user:
> "The summary file doesn't exist at `{ai-summary-file}`.
>
> You need to run the first command before this one:
> ```
> /agentic-hq-commands:used-in-demos:full-jira-tdd-story-workflow:01-jira-read-and-question {jira-id}
> ```"

## Step 3: Create Test Type Directory

Create the directory `{test-type-files}` if it doesn't exist.

## Step 4: Check for Existing RED Phase File

Check if the file `{red-phase-file}` already exists.

If it exists, **STOP** and ask the user:
> "The RED phase file already exists at `{red-phase-file}`.
>
> This suggests the {test-type} test RED phase has been run previously for {jira-id}.
>
> What would you like to do?
> 1. **Overwrite** - Delete the existing file and start fresh
> 2. **Read existing and continue** - We can read the file again together and then continue from where was left off
> 3. **Abort** - Cancel this command"

Wait for the user's response before continuing.

## Step 5: Read Context

Read the following files to understand the task:
1. `{ai-summary-file}` - Your understanding of the Jira and human's answers to questions
2. Use the jira-verbatim-content-extractor agent to obtain all the details of the Jira you are working on *and* any parent and child Jiras.  Use this information to obtain an understanding of what you are implementing and the acceptance criteria and the EXACT commands that will run for the test of this test type = {test-type}.
3. Any existing test files in the project to understand test patterns/conventions

## Step 6: Identify the Test to Write

From the acceptance criteria, identify the ONE {test-type} test to write.

**What each test type drives:**
- **unit**: Core function/method logic (tested in isolation with mocks)
- **integration**: Component wiring and interaction (tests real component integration)
- **smoke**: Quick validation that core features work (tests basic functionality post-build)
- **e2e**: Complete user journeys end-to-end (tests entire application workflow in production-like environment)

**Key principle:** Each test should drive implementation of code that doesn't exist yet:
- Unit test drives the core logic implementation
- Integration test drives component wiring
- Smoke test drives basic functionality validation
- E2e test drives full user journey validation

If the Jira doesn't require a {test-type} test, tell the user:
> "The acceptance criteria for {jira-id} don't appear to require a {test-type} test.
>
> Would you like me to:
> 1. **Skip** - Move on to the next test type
> 2. **Create anyway** - Write a {test-type} test based on my understanding
> 3. **Clarify** - Help me understand what {test-type} test is needed"


## Step 7a: Enter Plan Mode And Create/Copy The Implementation Plan File

Use the `EnterPlanMode` tool to enter Plan Mode. Once in Plan Mode:
- Create a Plan covering ONLY the **design/approach** for the test changes (what to change, what the test looks like, and why)
- **IMPORTANT: The plan must NOT include Steps 7b through 10** (writing the test, running it, creating RED phase doc, Jira comment, presenting to human). Those steps are already defined in this command and will be completed by re-reading this command after the plan is approved and implemented.
- **CRITICAL: The plan MUST include as its FIRST step (Step 0): "Copy this approved plan to `{red-phase-plan-file}` before proceeding with implementation"** - this ensures the plan file is saved to the workflow directory
- The plan's **LAST step** must be: "Re-read this command (`.claude/commands/agentic-hq-commands/used-in-demos/full-jira-tdd-story-workflow/02-jira-write-failing-test.md`) and complete all remaining steps (7b through 10)" - this ensures context is restored after Plan mode may have cleared it
- Present the Plan to the user and then get their feedback on the Plan and modify it based on that feedback (as you always do)
- then implement the Plan based on their feedback from the Plan (as usual)


## Step 7b: Write the ONE Test File (After Plan Is Approved By Human)

**CHECKPOINT: Before proceeding, verify you have completed Step 0 from your plan - copying the approved plan to `{red-phase-plan-file}`. If not, do it NOW before continuing.**

**CRITICAL TDD RULES (Per Uncle Bob's Three Laws):**
- **Law 1**: No production code until a test fails
- **Law 2**: No more test code than needed to fail (or fail to compile)
- **Law 3**: No more production code than needed to pass the test

This means:
- Write **exactly ONE test** for this test type
- **Do NOT create any skeleton/stub files** - that's GREEN phase work
- A **compilation error IS a valid RED phase failure**
- The test, once completed, can import non-existent code → compilation fails → RED phase complete ✅

### 7c. Write the Test File

Create the test file with:
- **A brief comment above the test** explaining what this test verifies (helps human reviewer understand quickly)
- Imports for the module/class that **doesn't exist yet**
- Descriptive test name that explains what behavior is expected
- Arrange-Act-Assert structure:
  - **Arrange**: Set up test data and dependencies
  - **Act**: Call the function/method being tested
  - **Assert**: Verify the expected outcome

Example test (importing non-existent module):
```typescript
// tests/unit/hello-world.test.ts
/**
 * Tests the helloWorld function returns the expected greeting string.
 * This verifies the core "Hello world" functionality for AHQ-6.
 */
import { helloWorld } from '../../src/misc/hello-world'; // Does NOT exist yet!

describe('helloWorld', () => {
  it('should return "Hello world"', () => {
    const result = helloWorld();
    expect(result).toBe('Hello world');
  });
});
```

### 7d. Set Up Test Infrastructure to Match Acceptance Criteria

**CRITICAL: Check the acceptance criteria for the EXACT test commands** (e.g., `pnpm test:hello-world`, `pnpm test`).

Before running the test, you MUST:
1. **Read the AC** to find the exact pnpm command(s) that should run tests
2. **Set up package.json** with the correct scripts matching those commands
3. **Create vitest config** (e.g., `vitest.unit.config.ts`) if needed
4. **Install dependencies** (`pnpm install`) if vitest isn't already installed

**DO NOT use `npx vitest` directly** - the test must run using the EXACT command specified in the acceptance criteria.

### 7e. Run the Test Using the AC Command (Expect Failure)

Run the test **using the exact pnpm command from the acceptance criteria** - it should fail because the implementation is missing or incomplete:

**✅ CORRECT failure reasons (RED phase complete):**
- **Compilation error**: "Cannot find module" / "Module not found" (module doesn't exist yet)
- **Assertion failure**: Expected "Hello world", got undefined/null/wrong value (code exists but doesn't work)
- **Error thrown**: "Not implemented" or similar (skeleton exists but no logic)
- These are VALID failures - the test correctly detects missing/incomplete implementation

**❌ WRONG failure reasons (fix these in RED phase):**
- Syntax errors in the TEST file itself (typos, missing brackets)
- Wrong import path that wouldn't work even if file existed
- Test framework configuration errors
- Unrelated failures from other tests

If test fails for wrong reason (test bug), fix the TEST before proceeding.

**Do NOT create or modify implementation files** - that's the GREEN phase's job.

### 7f. Verify TypeScript Compilation

**CRITICAL: Run `pnpm validate` to verify the test file has no TypeScript errors.**

This catches issues that Vitest won't catch (Vitest transpiles without type-checking):
- Missing type definitions (e.g., `@types/node`)
- Type mismatches
- Import path errors that TypeScript can detect

```bash
pnpm typecheck
```

**Expected results:**
- ✅ **No errors**: The test file is syntactically correct TypeScript
- ❌ **Type errors in TEST file**: Fix these before proceeding (e.g., missing `@types/node`)
- ✅ **Type errors in IMPLEMENTATION**: These are expected if importing non-existent modules (that's the RED phase failure we want)

**Note**: If `pnpm typecheck` or `tsconfig.json` don't exist yet, you may need to set them up:
1. Create `tsconfig.json` with appropriate settings
2. Add `"typecheck": "tsc --noEmit"` to package.json scripts
3. Add `"validate": "pnpm typecheck"` to package.json scripts (linting can be added later/separately)
4. Install `@types/node` if using Node.js APIs


## Step 8: Create RED Phase Document

Create the file `{red-phase-file}` with the following structure:

```markdown
# RED Phase Complete: {jira-id} ({test-type} test)

**Jira**: [{jira-id}]({jira-url})
**Test Type**: {test-type}
**Phase**: RED (Failing Test Written)
**Generated**: {current date/time}

---

## Test Created

**File**: `{path/to/test.ts}`
**Tests**: {What behavior this test verifies}

**Failure Output** (compilation error expected):
```
{Paste the actual failure message - e.g., "Cannot find module '../../src/misc/hello-world'"}
```

---

## Files Created

- `{path/to/test.ts}` - {description}

**Note**: No skeleton/implementation files created in RED phase - that's GREEN phase work.

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-commands:used-in-demos:full-jira-tdd-story-workflow:03-jira-minimal-implementation {jira-id} {test-type}
```
```

## Step 9: Add Comment to Jira

Load the Jira comment tool using `ToolSearch` with query `select:mcp__mcp-atlassian__jira_add_comment`, then use it to add a comment to {jira-id}:

> AI Agent has completed RED phase for {test-type} test.<br />
> Test Created At: {test file path}.<br />
> Test Fails With: [put very brief details of the confirmed failure here e.g. compilation error as expected (module doesn't exist yet).]<br />
> Documented at: {red-phase-file}<br />
> Next: GREEN phase to get test passing with minimal/quick/dirty/easy implementation.


## Step 10: Present to Human

After creating the file, tell the human:

> "I've completed the RED phase for {jira-id} ({test-type} test).
>
> **Test Created**: `{path/to/test.ts}`<br />
> **Test Failing**: ✅ Yes - compilation error (as expected for RED phase)<br />
> **Failure Reason**: {e.g., "Cannot find module '../../src/misc/hello-world'"}<br />
>
> Summary at: `{red-phase-file}`
>
> The CLI will automatically proceed to the GREEN phase next."

## Step 11: Write Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "RED phase complete for test-type {test-type}"
}
```

## Step 12: Self-Terminate

Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination

---

## Important Notes

- **ONE test only**: This command writes exactly ONE {test-type} test
- **Compilation error IS valid failure**: Test importing non-existent module → compilation fails → RED complete ✅
- **RED phase includes all test scaffolding**: mocks, stubs, fixtures, fake processes, temp file setup, test data generators - these are TEST INFRASTRUCTURE, not implementation. Create whatever test scaffolding is needed to make the test runnable (except for the actual implementation being tested).
- **NO production code in RED phase**: Do not create or modify the actual implementation code - that's GREEN phase work. Test scaffolding is NOT production code.
- **Only fix TEST bugs**: If test has syntax errors or wrong paths, fix those. But "module not found" is correct!
- **TDD cycle per test type**: Complete full cycle (RED → GREEN → REFACTOR → VALIDATE) before next test type
- **Recommended order**: unit → integration → smoke → e2e (each test type drives different code)
- **Remember to include this command in the Plan**: otherwise you'll forget to do the last steps (e.g. writing the "red phase" summary file)

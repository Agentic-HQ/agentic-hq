# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## If You're Not Sure, Or Need Help/Research - Use Perplexity MCP Before Asking Human

Perplexity MCP is great.  You almost always get really useful answers from it, that help you and the human progress.  Use it whenever you have something that repeatedly isn't working (e.g. a failing test or an error from a tool that you can't work out) or if you're starting something new or the human/command has instructed you do some research.  It's **GREAT** for research.

## ⚠️ CRITICAL: KEEP CLAUDE.MD CONCISE ⚠️

**RULE: When adding new rules to CLAUDE.md, keep them SHORT (~15-20 lines max, NOT 200+ lines)!**

**Why:**
- CLAUDE.md is included in EVERY prompt at EVERY session start
- Long rules fill up context window quickly → reduces tokens available for actual work
- Long rules get ignored/skipped → defeats the purpose
- **Example violation**: 200+ line rule about function duplication (2025-11-01) - had to cut to 20 lines

**Format for new rules:**
- Core rule statement (1-2 lines)
- Warning signs (3-5 bullets)
- What to do instead (3-5 bullets)
- Real example (1 line showing before/after)
- Total: ~15-20 lines maximum

## 🚨 CRITICAL: NEVER COMMIT WITHOUT EXPLICIT APPROVAL 🚨

**RULE: NEVER run `git add`, `git commit`, or `git push` commands directly!**

- The user has a custom `/commit` command that handles the entire commit workflow
- The `/commit` command creates commit messages, gets approval, then stages/commits/pushes
- **ONLY commit when the user explicitly runs the `/commit` command**
- If you commit without approval, you bypass the review process and may commit unwanted changes
- **NO EXCEPTIONS** - even for "simple fixes" or "quick cleanups"

If you need to commit something, STOP and tell the user:
> "These changes are ready to commit. Please run the `/commit` command when you're ready."

## 🚨 CRITICAL: NEVER RUN FORMATTERS MID-WORK 🚨

**RULE: NEVER run `pnpm format:fix`, `prettier --write`, or any auto-formatters during active work (unless you have checked first using pnpm format:check that the formatting changes only apply to the new code you are working on in this commit)!**

- Running formatters mid-work pollutes the git commit history
- Makes it IMPOSSIBLE to see what real changes were made vs. formatting changes
- **BREAKS TRACEABILITY** of actual code changes
- Formatters should ONLY be run:
  - At the very beginning of a new story (clean slate)
  - At the very end before final commit (after ALL work is done)
  - As a separate, dedicated formatting commit (no code changes mixed in)

**Example of the Problem:**
- You change 1 line of actual code
- Formatter touches 44 files with whitespace/formatting changes
- Git diff shows hundreds of lines changed
- Impossible to review what actually changed
- Code review becomes nightmare

**When asked to check linting/formatting:**
- Run `pnpm lint:check` (read-only check) ✅
- Run `pnpm format:check` (read-only check) ✅
- Report issues found ✅
- **ONLY run `pnpm format:fix` if the changes will format new code you've written in this commit** ❌
- **ONLY run `pnpm lint:fix` if the changes will fix new code you've written in this commit** ❌

**NO EXCEPTIONS** - formatting changes must be isolated from functional changes!

## 🚨 CRITICAL: NEVER CATCH ERRORS AND FALL BACK TO DEFAULTS 🚨

**RULE: NEVER catch errors in critical systems (config, logging, etc.) and silently fall back to default values!**

This is a catastrophic anti-pattern that masks failures and allows the system to run with incorrect configuration.

### ❌ WRONG Pattern (Catch-and-Fallback):

```typescript
// BAD: ConfigManager.ts
async loadConfig(): Promise<Config> {
  try {
    const configModule = await import('../../../../config/config.js');
    this.config = configModule.config;
    return this.config;
  } catch (error) {
    // TERRIBLE: Silently fall back to defaults
    this.logger.warn('Failed to load config, using defaults:', error);
    this.config = DEFAULT_CONFIG;  // ← WRONG!
    return this.config;
  }
}

// BAD: LogLibrary.ts
private static initialize(): void {
  try {
    this.config = this.loadConfigSync();
    log4js.configure({ /* ... */ });
    this.isConfigured = true;
  } catch (error) {
    // TERRIBLE: Silently fall back to hardcoded config
    console.error('Failed to load logging configuration, using defaults:', error);
    log4js.configure({
      // ← WRONG! Hardcoded fallback config
      appenders: { /* ... */ },
      categories: { default: { level: 'info' } }
    });
    this.isConfigured = true;
  }
}
```

### ✅ CORRECT Pattern (Fail Fast):

```typescript
// GOOD: ConfigManager.ts
async loadConfig(): Promise<Config> {
  // Dynamically import config file
  const configModule = await import('../../../../config/config.js');
  const loadedConfig = configModule.config;

  // Validate loaded config
  if (!this.validateConfig(loadedConfig)) {
    throw new Error('Invalid configuration: config file failed validation');
  }

  this.config = loadedConfig;
  this.configLoaded = true;
  return this.config;

  // NO catch block - let errors propagate!
  // If config loading fails, the ENTIRE PROGRAM should fail
}

// GOOD: LogLibrary.ts
private static initialize(): void {
  // Load configuration synchronously
  this.config = this.loadConfigSync(); // Will throw if fails

  // Get pattern based on format setting
  const pattern = this.getPatternForFormat(this.config.format);

  // Configure log4js
  log4js.configure({
    appenders: { /* ... */ },
    categories: { /* ... */ }
  });

  this.isConfigured = true;

  // NO catch block - let errors propagate!
  // If logging config fails, the ENTIRE PROGRAM should fail
}
```

### Why Fail Fast is Critical:

1. **Visibility**: Errors are immediately obvious, not hidden behind "working" defaults
2. **Debugging**: You know exactly what failed and when
3. **Correctness**: System doesn't run with wrong configuration
4. **Trust**: If it runs, you know it loaded the correct config
5. **Spec Compliance**: Fallback configs are NEVER in the spec - they're invented

### When This Rule Applies:

**ALWAYS fail fast for:**
- ✅ Configuration loading (config.ts, logging.config, etc.)
- ✅ Required dependencies/imports
- ✅ Database connections
- ✅ Required environment variables
- ✅ Critical system initialization
- ✅ Validation failures

**Only catch and handle when:**
- ❌ Graceful degradation is EXPLICITLY specified in the requirements
- ❌ You have EXPLICIT approval from the human to add fallback behavior
- ❌ It's EXPLICITLY documented in the spec

### Real Example of This Failure (2025-10-28):

**What Happened:**
- ConfigManager.ts caught config loading errors and fell back to DEFAULT_CONFIG
- LogLibrary.ts caught errors in TWO places and fell back to hardcoded defaults
- Neither fallback was in the spec - both were invented by AI
- System appeared to work but was running with wrong configuration

**Why It's Wrong:**
- Masks real problems (missing config files, permission errors, syntax errors)
- System runs with potentially dangerous default settings
- Violates "fail fast" principle
- Not in specification - invented by AI without approval

**Correct Behavior:**
- Remove ALL try-catch blocks from config/logging initialization
- Let errors propagate to top level
- Program terminates with clear error message
- Human fixes the actual problem (missing file, wrong path, etc.)

**NO EXCEPTIONS** - critical systems must fail fast and loudly!

## 🚨 CRITICAL: NEVER USE UNDERSCORE PREFIX TO SUPPRESS WARNINGS 🚨

**RULE: NEVER prefix variables with underscore (_) just to suppress TypeScript/linting warnings - FIX THE PROBLEM PROPERLY!**

The underscore prefix convention exists to indicate "intentionally unused" parameters in specific scenarios (like interface implementations that don't use all parameters). However, it is frequently MISUSED as a lazy hack to suppress warnings without actually fixing the underlying problem.

### ❌ WRONG Pattern (Underscore Hack to Suppress Warnings):

```typescript
// BAD: Using underscore to suppress "unused variable" warning
private constructor(
  private readonly zeebe: ZeebeClient,
  private readonly processId: string,
  private readonly _worker: ZeebeWorker,  // ← WRONG! Hack to suppress warning
  private readonly logger: Logger,
  private readonly config: ConfigManager
) {}

// The worker is stored but never actually used - that's the REAL problem!
```

**What's Wrong:**
1. ❌ Variable is stored in the class but never used
2. ❌ Underscore prefix just hides the warning without fixing the issue
3. ❌ Wastes memory storing unused references
4. ❌ Creates confusion - why store something if you're never going to use it?
5. ❌ May indicate incomplete implementation (forgot to add cleanup method?)

### ✅ CORRECT Patterns (Proper Fixes):

**Option 1: Remove the unused parameter entirely**
```typescript
// GOOD: If it's truly not needed, don't store it
private constructor(
  private readonly zeebe: ZeebeClient,
  private readonly processId: string,
  // worker removed - not stored if not used
  private readonly logger: Logger,
  private readonly config: ConfigManager
) {}
```

**Option 2: Actually USE the parameter for its intended purpose**
```typescript
// GOOD: Store it AND use it for cleanup
private constructor(
  private readonly zeebe: ZeebeClient,
  private readonly processId: string,
  private readonly worker: ZeebeWorker,  // ✅ No underscore - it IS used!
  private readonly logger: Logger,
  private readonly config: ConfigManager
) {}

/**
 * Close the workflow engine and clean up resources
 *
 * Closes the worker to stop polling for new tasks.
 * Should be called when the engine is no longer needed.
 */
async close(): Promise<void> {
  this.logger.info('Closing workflow engine');
  await this.worker.close();  // ✅ Actually using the stored worker!
  this.logger.info('Workflow engine closed');
}
```

### When Underscore Prefix IS Legitimate:

**ONLY use underscore prefix in these specific scenarios:**

1. **Interface implementation with unused parameters:**
```typescript
// Legitimate: Interface requires parameter but this implementation doesn't use it
interface EventHandler {
  handle(event: Event, context: Context): void;
}

class SimpleHandler implements EventHandler {
  handle(event: Event, _context: Context): void {
    // This implementation doesn't need context, but interface requires it
    console.log(event.type);
  }
}
```

2. **Callback with unused parameters:**
```typescript
// Legitimate: Need third parameter but not first two
array.map((_value, _index, array) => array.length);
```

**Key Difference:** In these cases, you CANNOT remove the parameter (interface/callback signature requires it), so underscore indicates "intentionally unused per API contract."

### How to Recognize the Anti-Pattern:

**Warning Signs:**
1. 🚩 Adding underscore to suppress TypeScript "unused" warning
2. 🚩 Parameter is stored as class property but never accessed
3. 🚩 No interface/callback requiring the parameter to exist
4. 🚩 Comment like "// TODO: use this later" or "// stored for future cleanup"
5. 🚩 You're adding underscore because YOU added the parameter (not required by interface)

**Questions to Ask Yourself:**
- ❓ Is this parameter REQUIRED by an interface or callback signature I must match?
  - **NO**: Don't use underscore - fix the problem properly!
  - **YES**: Underscore is legitimate to indicate intentional non-use
- ❓ Am I storing this parameter in the class?
  - **YES**: Then you MUST use it somewhere - add the method that uses it!
  - **NO**: Consider if you need to store it at all
- ❓ Is there a TODO comment or future plan to use this?
  - **YES**: Implement it NOW, don't defer with underscore hack!

### Real Example of This Failure (2025-10-28):

**What Happened:**
```typescript
// WRONG: AI's first attempt
private constructor(
  private readonly zeebe: ZeebeClient,
  private readonly processId: string,
  private readonly _worker: ZeebeWorker,  // ← Hack to suppress warning
  private readonly _toolHub: ToolHubApi,   // ← Another hack
  private readonly logger: Logger,
  private readonly config: ConfigManager
) {}
```

**Why It's Wrong:**
- Worker is stored for cleanup but no cleanup method exists
- ToolHub is stored but only used during initialization (via closure in task handler)
- Underscore just hides the warnings without fixing the actual problem

**Correct Fix:**
```typescript
// RIGHT: Proper fixes
private constructor(
  private readonly zeebe: ZeebeClient,
  private readonly processId: string,
  private readonly worker: ZeebeWorker,   // ✅ Used in close() method
  // toolHub removed - only needed during initialization
  private readonly logger: Logger,
  private readonly config: ConfigManager
) {}

async close(): Promise<void> {
  await this.worker.close();  // ✅ Now it's actually used!
}
```

### Rules to Prevent This Anti-Pattern:

**MANDATORY RULES:**

1. **Do Not Add Underscore as First Solution**
   - When you see "unused variable" warning, DON'T immediately prefix with underscore
   - Ask: Why is this unused? Should I remove it or implement the code that uses it?

2. **Only Use Underscore for Interface/Callback Contracts**
   - If parameter is REQUIRED by interface/callback: underscore is OK
   - If parameter is YOUR CHOICE: underscore is NOT OK - fix it properly

3. **Stored Parameters Must Be Used**
   - If you store parameter as class property, you MUST use it in a method
   - If you can't find a use for it, DON'T store it

4. **Implement Missing Functionality**
   - If parameter is for "future cleanup", implement cleanup method NOW
   - Don't defer with underscore and TODO comments

5. **Remove Parameters That Aren't Needed**
   - If parameter can be accessed via closure (like toolHub in task handler), don't store it
   - Only store what you actually need to access later

**Before using underscore prefix, ask:**
1. ✅ Is this required by an interface I'm implementing? (OK to use underscore)
2. ✅ Is this required by a callback signature? (OK to use underscore)
3. ❌ Am I just trying to suppress a warning? (NOT OK - fix properly!)
4. ❌ Is this stored but never used? (NOT OK - remove or implement usage!)

**NO EXCEPTIONS** - fix problems properly, don't hide them with underscore hacks!

## 🚨 CRITICAL: UNIT TESTS MUST VERIFY MAIN BEHAVIOR, NOT JUST INITIALIZATION 🚨

**RULE: Unit tests MUST test the primary public methods and their core logic, not just peripheral setup!**

This is a common anti-pattern where AI agents write many shallow unit tests that verify initialization/setup but completely skip testing the actual functionality of the component.

### ❌ WRONG Pattern (Shallow Tests That Don't Test Main Behavior):

**Real Example from Story 10 - CamundaWorkflowEngine (2025-10-28):**

```typescript
// BAD: Test only verifies engine was created, doesn't test runWorkflow() at all!
describe('Process Instance Creation', () => {
  it('should create process instance with workflowMissionId', async () => {
    const engine = await CamundaWorkflowEngine.create(
      mockToolHub,
      mockWorkflowDefinition,
      mockLogger
    );

    // Note: runWorkflow() contains placeholder sleep - skip actual execution in unit test
    // Just test that engine was created successfully
    expect(engine).toBeDefined();

    // TODO: Add full runWorkflow() test after implementing proper workflow completion detection
    // For now, unit tests verify initialization only. Integration tests will verify full execution.
  });

  it('should verify engine initialization completed', async () => {
    const engine = await CamundaWorkflowEngine.create(
      mockToolHub,
      mockWorkflowDefinition,
      mockLogger
    );

    // Verify engine was created and deployment completed
    expect(engine).toBeDefined();
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('deployed successfully')
    );
  });
});
```

**What's Wrong:**
1. ✅ Tests verify `create()` factory method works
2. ✅ Tests verify BPMN deployment happens during initialization
3. ❌ **Tests COMPLETELY SKIP `runWorkflow()` - the PRIMARY public method!**
4. ❌ Tests just check `engine` is defined - trivial assertion
5. ❌ TODO comment admits tests are incomplete
6. ❌ Excuse: "placeholder sleep causes timeout" - should use fake timers instead!
7. ❌ Excuse: "integration tests will verify full execution" - NO! Unit tests must verify behavior too!

**Result:**
- Agent claims "RED phase complete" with 14 passing tests
- Agent moves to GREEN phase and implements `runWorkflow()` method
- **`runWorkflow()` HAS ZERO UNIT TEST COVERAGE!**
- Unit tests verify ~20% of actual functionality (just initialization)
- This violates TDD principles and story acceptance criteria (80% coverage requirement)

### ✅ CORRECT Pattern (Test Main Behavior with Mocked Dependencies):

```typescript
// GOOD: Test the ACTUAL runWorkflow() method behavior
describe('Process Instance Creation', () => {
  it('should create process instance with correct parameters when runWorkflow called', async () => {
    const engine = await CamundaWorkflowEngine.create(
      mockToolHub,
      mockWorkflowDefinition,
      mockLogger
    );

    // Mock workflow completion (instead of skipping the test!)
    vi.mocked(mockZeebeClient.createProcessInstance).mockResolvedValue({
      processInstanceKey: '67890',
      bpmnProcessId: 'test-workflow',
    });

    // Use fake timers to skip placeholder sleep
    vi.useFakeTimers();

    // Call the MAIN method we're testing
    const promise = engine.runWorkflow('TestMission001');

    // Fast-forward through placeholder sleep
    await vi.advanceTimersByTimeAsync(5000);

    const outcome = await promise;

    // Verify createProcessInstance was called with correct parameters
    expect(mockZeebeClient.createProcessInstance).toHaveBeenCalledWith({
      bpmnProcessId: 'test-workflow',
      variables: {
        workflowMissionId: 'TestMission001',
        previousTaskId: 'START',
        previousOutcome: expect.any(TaskOutcome)
      }
    });

    // Verify it returns a TaskOutcome
    expect(outcome).toBeInstanceOf(TaskOutcome);
    expect(outcome.getOutcomeId()).toBe('PASS');

    vi.useRealTimers();
  });

  it('should handle process creation errors', async () => {
    const engine = await CamundaWorkflowEngine.create(
      mockToolHub,
      mockWorkflowDefinition,
      mockLogger
    );

    // Mock error from Zeebe
    mockZeebeClient.createProcessInstance.mockRejectedValue(
      new Error('Process creation failed')
    );

    // Verify error is handled correctly
    await expect(engine.runWorkflow('ErrorMission')).rejects.toThrow(
      'Process creation failed'
    );

    // Verify error was logged
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Workflow execution failed'),
      expect.any(Error)
    );
  });

  it('should log workflow completion', async () => {
    const engine = await CamundaWorkflowEngine.create(
      mockToolHub,
      mockWorkflowDefinition,
      mockLogger
    );

    vi.useFakeTimers();
    const promise = engine.runWorkflow('LogTestMission');
    await vi.advanceTimersByTimeAsync(5000);
    await promise;

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Workflow completed for mission: LogTestMission')
    );

    vi.useRealTimers();
  });
});
```

**What's Right:**
1. ✅ Tests the MAIN public method: `runWorkflow()`
2. ✅ Uses `vi.useFakeTimers()` to handle placeholder sleep (doesn't skip test!)
3. ✅ Verifies method calls SDK correctly (`createProcessInstance` with right params)
4. ✅ Verifies return value (TaskOutcome with expected properties)
5. ✅ Tests error handling (what happens when SDK throws error)
6. ✅ Tests logging behavior (appropriate log messages)
7. ✅ Provides real coverage of main functionality, not just setup

### How to Recognize This Anti-Pattern:

**Warning Signs:**
1. 🚩 Tests only call constructor/factory methods, never call main public methods
2. 🚩 Assertions like `expect(thing).toBeDefined()` with nothing else
3. 🚩 TODO comments saying "will test this later" or "tested in integration tests"
4. 🚩 Excuses about timeouts, sleeps, or async issues preventing tests
5. 🚩 Test descriptions mention "initialization" or "setup" but not actual functionality
6. 🚩 Code coverage report shows main methods are 0% covered
7. 🚩 Test file has many tests but they're all 5-10 lines long with trivial assertions
8. 🚩 Agent claims "RED phase complete" but hasn't tested the primary use case

**Questions to Ask Yourself:**
- ❓ If someone calls the main public method, does my test verify it works?
- ❓ Have I tested the primary use case, or only the setup/initialization?
- ❓ Could I delete the main method implementation and still have passing tests?
- ❓ Are my tests just checking that objects exist, or verifying actual behavior?
- ❓ When I look at my test descriptions, do they describe real functionality?

**If you answer "no" to the first question or "yes" to any others, YOUR TESTS ARE INSUFFICIENT!**

### Rules to Prevent This Anti-Pattern:

**MANDATORY TEST COVERAGE RULES:**

1. **Test Primary Methods First**
   - Identify the main public methods (usually in interface definition)
   - Write tests for PRIMARY methods BEFORE testing helpers/initialization
   - For CamundaWorkflowEngine: `runWorkflow()` is primary, `create()` is setup

2. **Test Real Behavior, Not Just Existence**
   - ❌ `expect(engine).toBeDefined()` - trivial
   - ✅ `expect(engine.runWorkflow('id')).resolves.toBeInstanceOf(TaskOutcome)` - verifies behavior

3. **Handle Test Challenges, Don't Skip Tests**
   - If method has setTimeout/sleep: Use `vi.useFakeTimers()`
   - If method is async: Use `await` and `resolves`/`rejects` matchers
   - If method needs complex mocks: Create the mocks, don't skip the test
   - **NEVER write TODO comments saying "will test later"**

4. **Verify Method Interactions with Dependencies**
   - If method calls SDK: Verify it was called with correct parameters
   - If method logs: Verify appropriate log messages
   - If method transforms data: Verify transformation is correct
   - If method handles errors: Verify error handling behavior

5. **Coverage Metrics Are NOT Sufficient**
   - You can have 80% line coverage and still test nothing meaningful
   - Focus on BEHAVIOR coverage, not just LINE coverage
   - Each primary method needs multiple test cases (happy path, error cases, edge cases)

6. **Integration Tests Are NOT a Substitute**
   - "We'll test it in integration tests" is NOT acceptable
   - Unit tests verify logic/behavior with mocked dependencies
   - Integration tests verify real component interaction
   - **You need BOTH** - they test different things

### Before Claiming "Tests Complete":

**Checklist:**
- [ ] Every public method has at least one test
- [ ] Primary methods have multiple test cases (happy path + errors + edge cases)
- [ ] Tests call the actual methods, not just constructors
- [ ] Tests verify return values/behavior, not just object existence
- [ ] No TODO comments saying "will test later"
- [ ] No excuses about timeouts/async preventing tests (use fake timers/proper async patterns)
- [ ] Test descriptions describe FUNCTIONALITY, not just "initialization" or "setup"
- [ ] If I delete main method implementation, tests would fail (not pass with `toBeDefined()`)

**If ANY checkbox is unchecked, YOUR TESTS ARE INCOMPLETE!**

### Real Impact of This Failure:

**Story 10 - CamundaWorkflowEngine:**
- Agent wrote 14 unit tests
- All 14 tests passed
- Agent claimed RED phase complete
- **BUT**: `runWorkflow()` method had ZERO test coverage
- Human reviewer caught this: *"I see you've said that unit tests only verify initialisation. Is that right? I think unit tests should also verify the main behaviour as well, shouldn't they?"*
- Had to go back and add proper tests before continuing

**Cost:**
- Wasted time implementing without proper tests (violates TDD RED phase)
- False confidence from "14 passing tests" that tested almost nothing
- Required human intervention to catch the problem
- Had to rewrite tests after implementation (backwards from TDD RED-GREEN-REFACTOR)

### Summary:

**Unit tests must verify that the PRIMARY PUBLIC METHODS actually work, not just that objects can be created.**

- ✅ Test main methods with mocked dependencies
- ✅ Verify behavior, return values, error handling, logging
- ✅ Use fake timers, async patterns, proper mocking to handle test challenges
- ❌ Don't skip main methods because they're "too hard to test"
- ❌ Don't write only initialization/setup tests
- ❌ Don't defer to integration tests - unit tests must verify behavior too

**NO EXCEPTIONS** - TDD requires testing actual functionality, not just setup!

## 🚨 CRITICAL: CHECK FOR EXISTING CODE BEFORE CREATING NEW FUNCTIONS 🚨

**RULE: Before creating a new function, search for existing functions that do similar things and NOTE DOWN IN YOUR "REFACTOR LIST" that this happened - then in the REFACTOR stage of TDD review that list and decide whether to refactor out the duplication**

### Warning Signs You're About to Duplicate:
- 🚩 New function has similar name/parameters to existing function
- 🚩 New function reuses existing helper functions extensively
- 🚩 Only difference is a parameter value, timestamp, or simple conditional
- 🚩 You copy-paste code from existing function to start new function

### What to Do Instead:
1. **Search first**: Use Grep to find functions with similar names/purposes
2. **Modify existing**:  NOTE DOWN IN YOUR "REFACTOR LIST": We could add an optional parameter with backward-compatible default
3. **Real Example**: `generateTestMission()` existed but auto-generated timestamped IDs. Instead of creating new `createUnitTestMission(id)` duplicating all the code, we modified existing function to accept optional `{ useTimestamp?: boolean }` parameter

### When NEW Function IS Appropriate:
- Completely different purpose (not just different parameter)
- Different abstraction level or domain/context
- Modifying existing would break single responsibility

**NO EXCEPTIONS** - check for existing code before creating duplicates!

## Project Overview

Agentic HQ is a modular open source framework for orchestrating agentic software development teams. NOTE: It WAS being developed using the BMAD (Breakthrough Method of Agile AI-driven Development) framework, but we're not using much smaller chunks of work defined entirely in Jiras, and have ditched large specs.

## Development Notes

- **TDD MANDATORY**: All code will follow Red-Green-Refactor cycle - write failing test first, verify it fails correctly, then implement, then refactor (NOTE: You don't need to "remember" this any more as it will be enforced by the human or the Agentic HQ workflow engine running 3 separate RED, GREEN, REFACTOR commands for each Jira you work on - so you won't have to "remember" to do this any more - after which I'll delete this directive :-)   )
- Story acceptance criteria must include "TDD Methodology Followed"
- **Aiming eventually for "Everything automated"**: We are aiming (post beta / post launch) for everything to be automated (runs by human or AI running 1 command) - if it takes 2+ commands, note this down in the "REFACTOR LIST" and consider in the REFACTOR stage whether to create a script (if you're unlikely to do this again - then you should decide not to bother - speed is as important as quality!!!).  While in Beta though, we are optimising for speed/agility - so not "everything" will be fully automated.
- All validation and linting must pass before story completion (UPDATE: This will be enforced by the human or the Agentic HQ workflow engine running a new Pre-Commit Quality Checks command, which will run pnpm validate, which runs the unit tests, so you won't have to "remember" to do this any more - after which I'll delete this directive :-)   )
- **WATCH MODE BANNED**: NEVER create `test:watch` scripts or use `--watch` flags - they hang AI test execution. Always use `vitest run` (never `vitest` alone), `jest --no-watch` (never `jest --watch`)

## 🚨 CRITICAL: VALIDATION REQUIRED BEFORE COMMITTING 🚨

**RULE: ALWAYS run `pnpm validate` after ANY coding work and before committing!**

(UPDATE: This will be enforced by the human or the Agentic HQ workflow engine running a new Pre-Commit Quality Checks command so you won't have to "remember" to do this any more - after which I'll delete this directive :-)   )

The `validate` command runs three critical checks in sequence:
1. **Type checking** (`pnpm typecheck` = `tsc --noEmit`) - catches TypeScript type errors
2. **Linting** (`pnpm lint`) - catches code quality and style issues
3. **Unit tests** (`pnpm test:unit`) - verifies runtime behavior

WARNING: Be sure to run this in the correct directory (depends on your context).  

cd <directory of project you are working on>; pnpm validate

If you are doing dev in the root directory of the whole project:

cd /Users/stevepersonal/dev/agentic-hq/agentic-hq; pnpm validate

then that's the directory to run this pnpm command in.

If you are executing a mission then your root directory will be something like this:

cd /Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/mission-docs/HelloWorldE2ETest_20251108_173633/project-output/; pnpm validate

and if you are doing coding work within a spike it will be something like this:

cd /Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project; pnpm validate

If you run it in the root directory: /Users/stevepersonal/dev/agentic-hq/agentic-hq when it should be the mission directory: /Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/mission-docs/HelloWorldE2ETest_20251108_173633/project-output/ then you may KILL THE CURRENT TEST YOU ARE RUNNING WITHIN - which is bad....!!!


### Why All Three Are Required

**Type checking and tests serve different purposes:**
- **Type checking** finds static type errors at compile time
- **Unit tests** validate runtime behavior and logic
- **Linting** enforces code quality and consistency

Vitest/Jest do NOT run TypeScript type checking by default - they only transpile and execute code. This means **tests can pass even with type errors present.**

### Standard Practice (Per Perplexity Research)

Modern TypeScript projects keep these as **separate commands** but run **all three before committing**:

```bash
# Individual commands (run separately during development)
pnpm typecheck  # Check types only
pnpm lint       # Check code quality only
pnpm test:unit  # Run tests only

# Combined validation (run before committing)
cd <directory of project you are working on>; pnpm validate   # Runs all three in sequence
```

### When to Run These Commands

**During development:**
- Run individual commands as needed for fast feedback
- Example: `pnpm test:unit` while writing tests

**Before committing:**
- **ALWAYS run `cd <directory of project you are working on>; pnpm validate`** to catch all issues
- All three checks must pass (typecheck + lint + tests)
- **100% pass rate required** - NO exceptions

**In CI/CD:**
- All three run as separate pipeline stages
- Any failure blocks the build

### Real Example of Why This Matters

**What happened (2025-10-28):**
- Project had 39 TypeScript type errors
- All unit tests passed (256/256)
- Tests don't catch type errors because Vitest only transpiles code
- Type errors only discovered when explicitly running `tsc --noEmit`

**Lesson:**
- Passing tests ≠ no type errors
- Must run BOTH type checking AND tests
- `pnpm validate` ensures nothing is missed

**NO EXCEPTIONS** - run `cd <directory of project you are working on>; pnpm validate` before every commit!

## CRITICAL: Never Update Code Without Running Tests First

**RULE: ALWAYS run tests BEFORE making changes to "fix" them.**

This is fundamental to Test-Driven Development but easily violated when making "obvious" fixes:

### ❌ WRONG Approach:
1. See code that "looks wrong"
2. Decide to "fix" it
3. Make changes
4. Run tests to verify

### ✅ CORRECT Approach:
1. See code that "looks wrong"
2. **RUN THE TEST FIRST** to confirm it actually fails
3. ONLY IF IT FAILS, then make changes
4. Run tests again to verify the fix

### Real Example (2025-10-22):

While working on fixing unit test failures, AI identified that `infrastructure.integration.test.ts` was using `process.cwd()` at line 156 for accessing `docs/mission-docs/`. AI thought this was wrong and should use `ConfigManager.getAgenticHqProjectRoot()` instead.

**What AI Almost Did:**
- Add `import { ConfigManager } from '@spike-00/config-manager'`
- Change `process.cwd()` to `configManager.getAgenticHqProjectRoot()`
- Break a working test

**What Actually Happened:**
- User asked: "Can you run it to make sure it fails first?"
- AI ran the test: **11/11 tests PASSED**
- The test was **CORRECT** - it was testing spike project infrastructure, not repo root infrastructure
- AI's "fix" would have **BROKEN** a working test

**Key Lesson:**
Even when you're "sure" something is wrong, **RUN THE TEST FIRST**. The test might be correct, and your "fix" might break it.

**This applies to:**
- Bug fixes
- Refactoring
- Code cleanup
- "Obvious" corrections
- Everything

**No exceptions.**

## Before Deleting/Renaming/Moving Files: Search for References First

**RULE: Use Grep to search for references BEFORE deleting, renaming, or moving files.** Even files named `.BACKUP`, `DELME`, or `test-*` may be active test fixtures. Grep is faster than running tests and prevents breakage.

## Notes On Refactoring Stage Of Test Driven Development

(NOTE: Soon you won't need to "remember" this any more as it will be enforced by the human or the Agentic HQ workflow engine running the REFACTOR command for each Jira you work on - after which I'll delete this directive :-)   )

Perplexity says REFACTOR phase of TDD means:
    - Improving code structure (modularity, readability, removing duplication) - not just of the code written, but of the whole code base that relates to and includes the code written.
    - **NEVER optimize for performance** unless we *know* things are very slow and need speeding up (premature optimization adds complexity without benefit)
    - Applying design patterns (only if we know they are relevant and important for the code written)
    - Updating internal documentation (inline comments, TSDoc)

If you write a bunch of code and then do proper Refactoring, your output at the end of the Refactor stage should be something like the following, which shows that it did improve the code after doing it:

⏺ Excellent! All 14 tests still pass. The REFACTOR phase is complete with significant improvements:

  Refactoring Summary:
  1. CRITICAL: Replaced all synchronous file operations with async (coding standards compliance)
  2. Extracted constants for magic numbers and directory names
  3. Created helper methods to eliminate code duplication
  4. Added UnknownTaskTypeError for better error handling
  5. Added comprehensive TSDoc documentation
  6. Improved overall code structure and readability

## Don't Invent Things That Aren't In The Spec

If something critical isn't defined in the Jira (or spec if you've been given one): Stop, Ask The Human.  Don't just make stuff up.  Example: while doing a story to create and End To End test the output directory wasn't defined in the spec, so AI decided to make it "docs/mission-docs/<missionId>/project-output/".   In a later story for implemnting the Agents as it wasn't in the spec a new AI decided to just use "current working directory".  This made the system have a bug where the test would check in one directory and the code would write it to a different directory.  (NOTE: I'm not sure how to enforce this - maybe by having a Story Checking Agent that checks that everything before implementation in a Story Definition has a reference to the original spec where that thing was defined - and if the reference isn't there - FAILS the review???  I doubt that this rule will actually stop this happening...)


## Always Make Sure Modules And Tools Version Are NOT Outdated

When starting (or continuing) a project you MUST make sure you are not using outdated libraries, modules or tool version (e.g. Node.js).  Usually the aim is to be running the latest Long Term Support version of what is available, and to avoid bleeding edge, new versions that may be unstable.  Running with outdated or incompatible libraries has wasted **HUGE** amounts of time on previous projects where bugs caused lots of time to be wasted trying to work round the bugs (when they were fixed in recent versions) and so running things like "pnpm outdated" and checking the output and working with the human to decide whether we should upgrade is *critical* - especially when starting up a new project, or starting a big, new chunk work on an existing project.  Please, as standard, do these checks and let the human know the risks/situation when you start a big, new chunk of work on an existing project - or especially when creating a new project.
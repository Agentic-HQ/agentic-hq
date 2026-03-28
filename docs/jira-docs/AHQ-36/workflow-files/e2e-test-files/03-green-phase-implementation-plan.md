# GREEN Phase Implementation Plan: AHQ-36 (e2e test)

## Jira Requirements (Numbered)

1. CLI runs multi-step workflow: read Jira, then loop (RED, GREEN, REFACTOR) per test type → [Step 2: Modify CLI]
2. Command 01 reads Jira, copies full details to `01-entire-jira-copy-of-details.md`, creates `01-summary-of-jira.md` → [Step 3: Create command 01]
3. Command 01 returns comma-separated test types as output → [Step 3: Create command 01]
4. Command 01 looks for "Test types: X, Y" first; if not found, intelligently determines → [Step 3: Create command 01]
5. Commands 02/03/04 read Jira from file (NOT MCP) for speed → [Steps 4, 5, 6: Commands 02/03/04]
6. Command 02 (RED) writes failing test, creates `{test-type}-test-files/02-RED-write-failing-test.summary.md` → [Step 4: Create command 02]
7. Command 03 (GREEN) writes minimal implementation, creates `03-GREEN-minimal-implementation.summary.md` → [Step 5: Create command 03]
8. Command 04 (REFACTOR) refactors, runs test before/after, creates `04-REFACTOR.summary.md` → [Step 6: Create command 04]
9. Workflow docs at `{project-root}/docs/jira-docs/{jira-id}/workflow-docs/` → [All commands]
10. Implementation files `src/temp-test-hello-world.ts` and `src/temp-test-hello-world.cli.ts` created → [Implicit: commands 03 creates these]
11. Jira status = Done after workflow completes → [Step 7: Create command 05]
12. AC: `pnpm test:e2e:demo-quick-jira-workflow:expected-files-test` passes within 1200s → [Step 9: Verification]
13. Workflow commands at `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/` → [Steps 3-7]
14. CLI at `src/demo/cli/quick-jira-workflow-demo-cli.ts` → [Step 2]
15. Variables use kebab-case in commands (`jira-id`, `project-root`, `test-type`) → [All commands]

---

## Step 0: Copy This Approved Plan

Copy this approved plan to `docs/jira-docs/AHQ-36/workflow-files/e2e-test-files/03-green-phase-implementation-plan.md` before proceeding with implementation.

---

## Step 1: Run `pnpm typecheck` Before Changes

Verify the codebase compiles cleanly before making any modifications.

---

## Step 2: Modify CLI

**File**: `src/demo/cli/quick-jira-workflow-demo-cli.ts`

Replace the single `WORKFLOW_COMMAND` with 5 command constants and multi-step execution:

- Define constants for commands 01-05 (all in `/agentic-hq-commands:used-in-demos:quick-jira-workflow:`)
- Extend existing `buildVariablesString` with optional `testType?` parameter. When provided, appends `and test-type = ${testType}` to the string. This avoids creating a second function.
- In the action handler:
  1. Call command 01 with `buildVariablesString(jiraId, projectRoot)` → returns comma-separated test types
  2. Parse the test types string: split by comma, trim, filter empty
  3. Loop over each test type: call commands 02, 03, 04 sequentially with `buildVariablesString(jiraId, projectRoot, testType)`
  4. After loop: call command 05 to transition Jira to Done
- Keep existing git root detection logic and Commander setup
- Update JSDoc comment to say "multi-step" instead of "single-step"

**Note**: The old `WORKFLOW_COMMAND` constant is removed from the CLI. The old command file `01-read-jira-implement-and-mark-as-done.md` is deleted since nothing references it after this change.

---

## Step 2b: Update Disabled Test (AHQ-40)

**File**: `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts`

The disabled test ("should use git directory when project-root not provided") uses the same CLI, so it must be updated to work with the new multi-step workflow:

1. **Change Jira input**: Use `MULTI_STEP_TEST_JIRA_INPUT` instead of `SINGLE_STEP_TEST_JIRA_INPUT` (the single-step description says "no tests, just do it" which would cause command 01 to return empty test types → no implementation created)
2. **Update assertions**: Replace old summary path check (`01-read-jira-implement-and-mark-as-done.summary.md`) with multi-step output checks (same assertions as the main test but using `process.cwd()` as project root)
3. **Keep existing checks**: `temp-test-hello-world.cli.ts` exists, running it prints "Hello world", Jira status is Done

---

## Step 3: Create Command 01 - Read Jira

**File**: `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/01-read-jira-and-plan-tests-and-implementation-understand.md`

Steps in command:
1. Read input → parse `jira-id` and `project-root` from variables string
2. Use jira-verbatim-content-extractor sub-agent to read Jira from MCP
3. Write entire Jira content to `{project-root}/docs/jira-docs/{jira-id}/workflow-docs/01-entire-jira-copy-of-details.md`
4. Extract "Test types: X, Y" from description; if not found, infer from (unit, integration, smoke, e2e); if none found at all, use empty string ""
5. Write summary to `{project-root}/docs/jira-docs/{jira-id}/workflow-docs/01-summary-of-jira.md` - must include the test types discovered and how they were determined (explicit from Jira or inferred)
6. Write output: `command-output-string` = ONLY the comma-separated test types (e.g. `"unit, e2e"`)
7. Self-terminate

**Pattern**: Follows `01-read-jira-implement-and-mark-as-done.md` for I/O and self-termination.

---

## Step 4: Create Command 02 - RED

**File**: `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/02-RED-write-failing-test.md`

Steps in command:
1. Read input → parse `jira-id`, `project-root`, `test-type`
2. Read Jira from file: `{project-root}/docs/jira-docs/{jira-id}/workflow-docs/01-entire-jira-copy-of-details.md`
3. Write a failing test for the given test type, relative to `{project-root}`
4. Run the test and verify it FAILS (this is RED phase - the test must fail)
5. Write summary to `{project-root}/docs/jira-docs/{jira-id}/workflow-docs/{test-type}-test-files/02-RED-write-failing-test.summary.md`
6. Write output, self-terminate

---

## Step 5: Create Command 03 - GREEN

**File**: `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/03-GREEN-minimal-implementation.md`

Steps in command:
1. Read input → parse `jira-id`, `project-root`, `test-type`
2. Read Jira from file + RED summary
3. Write MINIMUM code to make the test pass, relative to `{project-root}`
4. Run the test and verify it PASSES (this is GREEN phase - the test must now pass)
5. Write summary to `{project-root}/docs/jira-docs/{jira-id}/workflow-docs/{test-type}-test-files/03-GREEN-minimal-implementation.summary.md`
6. Write output, self-terminate

---

## Step 6: Create Command 04 - REFACTOR

**File**: `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/04-REFACTOR.md`

Steps in command:
1. Read input → parse `jira-id`, `project-root`, `test-type`
2. Read Jira from file + RED/GREEN summaries
3. Run the specific test before refactoring
4. Refactor code (structure, readability, duplication, extraction of magic constants)
5. Run the specific test after refactoring
6. Write summary to `{project-root}/docs/jira-docs/{jira-id}/workflow-docs/{test-type}-test-files/04-REFACTOR.summary.md`
7. Write output, self-terminate

---

## Step 7: Create Command 05 - Transition to Done

**File**: `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/05-transition-jira-to-done.md`

Steps in command:
1. Read input → parse `jira-id`
2. Use `jira_get_transitions` + `jira_transition_issue` to move Jira to Done
3. Write output, self-terminate

**Why a separate command**: The CLI (TypeScript) doesn't have mcp-atlassian MCP access. Only Claude commands have MCP. The Jira says "4 workflow commands" - this 5th is infrastructure (like the old command's Step 5 was internal).

---

## Step 8: Run `pnpm typecheck` After Changes

Verify the modified CLI compiles correctly.

---

## Step 9: Verification

Run the AC command: `pnpm test:e2e:demo-quick-jira-workflow:expected-files-test`

This creates a real TEST Jira, runs the full multi-step workflow, and checks:
- `01-entire-jira-copy-of-details.md` exists
- `01-summary-of-jira.md` exists
- For each of [unit, e2e]: 3 summary files exist per test type
- `src/temp-test-hello-world.ts` and `src/temp-test-hello-world.cli.ts` exist
- Jira status = Done

---

## Files Summary

| Action | File |
|--------|------|
| MODIFY | `src/demo/cli/quick-jira-workflow-demo-cli.ts` |
| MODIFY | `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts` (disabled test only) |
| CREATE | `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/01-read-jira-and-plan-tests-and-implementation-understand.md` |
| CREATE | `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/02-RED-write-failing-test.md` |
| CREATE | `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/03-GREEN-minimal-implementation.md` |
| CREATE | `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/04-REFACTOR.md` |
| CREATE | `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/05-transition-jira-to-done.md` |
| DELETE | `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/01-read-jira-implement-and-mark-as-done.md` (no longer referenced) |

---

## TODO: After Step 6c Implementation

Come back and re-read the GREEN phase command file (`.claude/commands/agentic-hq-commands/workflow/jira-story-workflow/03-jira-minimal-implementation.md`) for the testing and documenting instructions (Steps 7 through 10).

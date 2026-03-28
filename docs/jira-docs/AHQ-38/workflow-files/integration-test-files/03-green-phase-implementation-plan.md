# GREEN Phase Implementation Plan: AHQ-38 (integration test)

## Jira Requirements (Numbered)

1. **create-test-jira command location**: `.claude/commands/agentic-hq-commands/used-in-tests/jira-helper-commands/create-test-jira.md` → [Step 2]
2. **create-test-jira reads input string** with "Title: ... Description: ..." format → [Step 2]
3. **create-test-jira creates Jira in TEST project** using mcp-atlassian MCP tools → [Step 2]
4. **create-test-jira outputs ONLY the Jira ID** (e.g. `TEST-123`) as `command-output-string` → [Step 2]
5. **get-jira-status command location**: `.claude/commands/agentic-hq-commands/used-in-tests/jira-helper-commands/get-jira-status.md` → [Step 3]
6. **get-jira-status reads Jira ID from input string** → [Step 3]
7. **get-jira-status outputs ONLY the status name** (e.g. `Backlog`) as `command-output-string` → [Step 3]
8. **Both commands follow div-five.md I/O pattern**: read `command-input.json` from `$0`, write `command-output.json` to `$0`, self-terminate → [Steps 2 & 3]
9. **AC1**: `pnpm test:integration:create-test-jira-and-get-status` passes → [Step 4: Verification]
10. **AC1 timeout**: 60 seconds → Already set in test file, nothing to implement

## Step 0: Copy approved plan to workflow file

Copy this approved plan to `docs/jira-docs/AHQ-38/workflow-files/integration-test-files/03-green-phase-implementation-plan.md`

## Step 1: Verify test fails (RED confirmation)

Run `pnpm test:integration:create-test-jira-and-get-status` to confirm the test still fails with "Unknown skill" error before implementing.

## Step 2: Create `create-test-jira.md`

**File**: `.claude/commands/agentic-hq-commands/used-in-tests/jira-helper-commands/create-test-jira.md`

Following the exact pattern from `reverse-a-string.md` and `div-five.md`:

1. Read `$0/command-input.json` and extract `command-input-string`
2. Parse the "Title:" and "Description:" from the input string
3. Use the mcp-atlassian MCP tool to create a new issue in the **TEST** project with the parsed title and description, issue type "Task"
4. Extract ONLY the Jira key (e.g. `TEST-123`) from the result
5. Write `$0/command-output.json` with `{ "command-output-string": "TEST-123" }`
6. Self-terminate using `./tools/scripts/process-control/unix/kill-current-cli-process.sh $PPID`

## Step 3: Create `get-jira-status.md`

**File**: `.claude/commands/agentic-hq-commands/used-in-tests/jira-helper-commands/get-jira-status.md`

Following the exact same pattern:

1. Read `$0/command-input.json` and extract `command-input-string` (this is the Jira ID)
2. Use the mcp-atlassian MCP tool to get the issue details for that Jira ID
3. Extract ONLY the status name (e.g. `Backlog`) from the result
4. Write `$0/command-output.json` with `{ "command-output-string": "Backlog" }`
5. Self-terminate using `./tools/scripts/process-control/unix/kill-current-cli-process.sh $PPID`

## Step 4: Verification

1. Run `pnpm test:integration:create-test-jira-and-get-status` - expect it to pass
2. Run `pnpm test:integration` - expect all integration tests to pass (no regressions)

## Step 5: Post-implementation

TODO: Come back and re-read the GREEN phase command file (03-jira-minimal-implementation) for testing and documenting instructions (Steps 7-10).

## Reference Files

- Pattern to follow: `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/div-five.md`
- Pattern to follow: `.claude/commands/agentic-hq-commands/used-in-tests/integration/reverse-a-string.md`
- Test file: `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts`
- Self-terminate script: `./tools/scripts/process-control/unix/kill-current-cli-process.sh`

## Notes

- This is GREEN phase - minimal implementation only, no gold-plating
- Both commands are markdown files that instruct Claude Code what to do
- No TypeScript code needs to be created - only two `.md` files
- The `jira-helper-commands` directory doesn't exist yet and will be created when writing the files

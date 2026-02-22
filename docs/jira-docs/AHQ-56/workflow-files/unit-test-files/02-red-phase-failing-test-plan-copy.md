# RED Phase Plan: AHQ-56 Unit Test

## Context

AHQ-56 requires an `agentic-hq` CLI that invokes a skill to get a workflow command, then runs it via PTY. This is the RED phase - writing ONE failing unit test to drive the core CLI logic implementation.

**Testing pattern**: This project uses **real ClaudeCodeTool instances with injected fake CLI fixtures** (run via `tsx`) instead of vitest mocks. The fake fixtures simulate Claude's behavior through the file I/O pattern (read `command-input.json`, write `command-output.json`). See existing examples at `tests/unit/claude-code-tool/fixtures/`.

## The ONE Test to Write

**Test**: The `agentic-hq` CLI's core `buildWorkflowCommand()` function correctly:
1. Invokes ClaudeCodeTool (with injected fake skill fixture) to get the base workflow command
2. Appends passthrough args to form the final command

This drives the creation of `src/cli/agentic-hq-cli.ts` - the main TypeScript module that doesn't exist yet.

### How it works (fake fixture approach):

1. Create a **fake skill fixture** (`tests/unit/cli/fixtures/fake-claude-cli.returns-workflow-command.fixture.ts`) that:
   - Ignores `command-input.json` (prints "no need to read command input file - not needed")
   - Writes `command-output.json` with a hardcoded workflow command string (simulating what the real skill would return)

2. The test creates a real `ClaudeCodeTool({ executable: 'tsx', args: [fakePath] })`, passes it to `buildWorkflowCommand()`, and asserts the final command has passthrough args appended.

## Steps

### Step 0: Copy this approved plan to workflow files
Copy to: `docs/jira-docs/AHQ-56/workflow-files/unit-test-files/02-red-phase-failing-test-plan-copy.md`

### Step 1: Create directories
- `docs/jira-docs/AHQ-56/workflow-files/unit-test-files/`
- `tests/unit/cli/fixtures/`

### Step 2: Create the fake skill fixture
Create `tests/unit/cli/fixtures/fake-claude-cli.returns-workflow-command.fixture.ts`:
- Ignores `command-input.json` (prints "no need to read command input file - not needed")
- Writes `command-output.json` with `{ "command-output-string": "cd /fake/ts-workflow && pnpm install --ignore-workspace && pnpm demo:string-reversal" }`
- Follows the same pattern as `tests/unit/claude-code-tool/fixtures/fake-claude-cli.reverses-a-string-using-files.fixture.ts` but simpler (no input reading needed)

This is **test scaffolding** (not production code) - it's legitimate to create in RED phase.

### Step 3: Write the ONE unit test file
Create `tests/unit/cli/agentic-hq-cli-builds-workflow-command.unit.test.ts`

### Step 4: Run the test (expect failure)
Expected failure: `Cannot find module '../../../src/cli/agentic-hq-cli.js'` (correct RED phase failure).

### Step 5: Run typecheck
Confirm type error for the missing module.

### Step 6: Create RED phase document

### Step 7: Add Jira comment

### Step 8: Present to human, write command output

### Step 9: Recheck all steps from 02-jira-write-failing-test command have been executed

### Step 10: Self-terminate

## Verification
- `pnpm test:unit tests/unit/cli/agentic-hq-cli-builds-workflow-command.unit.test.ts` fails with "Cannot find module"
- `pnpm typecheck` shows error for missing module
- No production code created

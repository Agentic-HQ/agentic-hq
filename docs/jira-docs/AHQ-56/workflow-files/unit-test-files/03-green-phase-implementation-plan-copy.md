# GREEN Phase Implementation Plan: AHQ-56 (unit test)

## Context

This is the GREEN phase of TDD for AHQ-56. The RED phase created a failing unit test at `tests/unit/cli/agentic-hq-cli-builds-workflow-command.unit.test.ts` that imports `buildWorkflowCommand` from `src/cli/agentic-hq-cli.ts` (which doesn't exist yet). The test fails with "Cannot find module". We need to write the **minimum code** to make this test pass.

## Jira Requirements (Numbered)

1. `agentic-hq` CLI invokes a skill via ClaudeCodeTool to get the workflow command → [Step 2: `buildWorkflowCommand` calls `tool.execute()`]
2. Skill returns base command via file I/O pattern (command-output-string) → [Already handled by ClaudeCodeTool + fixture]
3. CLI appends passthrough args (after `--`) to the base command → [Step 2: append passthroughArgs]
4. Input string to skill is `"unused input string"` → [Step 2: hardcoded in function]
5. PTY passthrough for running the command → N/A (unit test doesn't test PTY execution)
6. E2E test → N/A (this is the unit test GREEN phase only)
7. SKILL.md creation → N/A (not needed for unit test to pass)
8. `bin/agentic-hq.cjs` entry point → N/A (not needed for unit test to pass)
9. Move TypeScript workflow code to plugin → N/A (not needed for unit test to pass)
10. Workspace exclusion in pnpm-workspace.yaml → N/A (not needed for unit test to pass)

## Implementation Steps

### Step 0: Copy this approved plan to workflow directory
Copy this plan to: `docs/jira-docs/AHQ-56/workflow-files/unit-test-files/03-green-phase-implementation-plan-copy.md`

### Step 1: Create the file `src/cli/agentic-hq-cli.ts`
This is the only file the test imports from. It doesn't exist yet.

### Step 2: Implement `buildWorkflowCommand` function
The test calls:
```typescript
const finalCommand = await buildWorkflowCommand(tool, skillCommand, passthroughArgs);
```

Where:
- `tool` is a `ClaudeCodeTool` instance
- `skillCommand` is `'/agentic-hq-demos-plugin:string-reversal'`
- `passthroughArgs` is `['--string-to-reverse="hello"']`

Expected return: `'cd /fake/ts-workflow && pnpm install --ignore-workspace && pnpm demo:string-reversal --string-to-reverse="hello"'`

The function needs to:
1. Call `tool.execute(skillCommand, 'unused input string')` → gets base command: `'cd /fake/ts-workflow && pnpm install --ignore-workspace && pnpm demo:string-reversal'`
2. Append passthrough args with space separator: `baseCommand + ' ' + passthroughArgs.join(' ')`
3. Return the final command string

The implementation:
```typescript
import { ClaudeCodeTool } from '../tools/claude-code/ClaudeCodeTool.js';

const UNUSED_INPUT_STRING = 'unused input string';

export async function buildWorkflowCommand(
  tool: ClaudeCodeTool,
  skillCommand: string,
  passthroughArgs: string[],
): Promise<string> {
  const baseCommand = await tool.execute(skillCommand, UNUSED_INPUT_STRING);
  if (passthroughArgs.length > 0) {
    return `${baseCommand} ${passthroughArgs.join(' ')}`;
  }
  return baseCommand;
}
```

### Step 3: Run the unit test to verify it passes
Run `pnpm test:unit tests/unit/cli/agentic-hq-cli-builds-workflow-command.unit.test.ts` → should pass

### Step 4: Run all unit tests
Run `pnpm test` → all unit tests should pass

### Step 5: Come back and re-read the command file for testing and documenting instructions
After implementation, re-read Steps 7-12 of the command for documenting, Jira commenting, and output steps.

## Verification
- Run `pnpm test:unit tests/unit/cli/agentic-hq-cli-builds-workflow-command.unit.test.ts` → should pass
- Run `pnpm test` → all unit tests should pass

## Files to Create
- `src/cli/agentic-hq-cli.ts` — exports `buildWorkflowCommand` function

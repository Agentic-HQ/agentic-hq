# RED Phase Plan: AHQ-47 Integration Test for Self-Termination Skill

## Context

AHQ-47 requires creating an "Agentic HQ Core Plugin" with a "Self Termination" skill. This RED phase writes ONE failing integration test that will drive the implementation. The test mirrors the existing `real-claude-self-termination.integration.test.ts` but uses the new skill-based approach instead of calling the kill script directly.

## Step 0: Copy This Approved Plan

Copy this approved plan to `docs/jira-docs/AHQ-47/workflow-files/integration-test-files/02-red-phase-failing-test-plan.md`.

## Step 1: Create the Integration Test File

**File**: `tests/integration/claude-code-tool/real-claude-self-termination-skill.integration.test.ts`

**Based on**: `tests/integration/claude-code-tool/real-claude-self-termination.integration.test.ts` (existing working test)

**Key differences from existing test:**
- Uses command `/agentic-hq-commands:used-in-tests:integration:just-self-terminate-using-skill` (doesn't exist yet - will be created in GREEN phase)
- Same structure: creates `ClaudeCodeTool`, calls `execute()`, expects it to return within 30s timeout
- Same assertion pattern: if we get here, Claude self-terminated successfully

**Test structure:**
```typescript
import { describe, it } from 'vitest';
import { ClaudeCodeTool } from '../../../src/tools/claude-code/ClaudeCodeTool';

const TEST_TIMEOUT_MS = 30_000;
const SELF_TERMINATE_SKILL_COMMAND = '/agentic-hq-commands:used-in-tests:integration:just-self-terminate-using-skill';

describe('ClaudeCodeTool self-termination via skill', () => {
  it('should return control to test when Claude executes self-termination skill command', async () => {
    const tool = new ClaudeCodeTool();
    const commandInput = 'Unused command input string';
    await tool.execute(SELF_TERMINATE_SKILL_COMMAND, commandInput);
    // If we get here, Claude self-terminated (otherwise test times out)
  }, TEST_TIMEOUT_MS);
});
```

## Step 2: Add pnpm Test Script

**File**: `package.json`

Add script:
```json
"test:integration:real-claude-self-termination-skill": "vitest run --config vitest.integration.config.ts tests/integration/claude-code-tool/real-claude-self-termination-skill.integration.test.ts"
```

This matches the exact command from the Jira acceptance criteria: `pnpm test:integration:real-claude-self-termination-skill`.

## Step 3: Run the Test (Expect Failure)

Run: `pnpm test:integration:real-claude-self-termination-skill`

**Expected failure**: The test will fail because the command `/agentic-hq-commands:used-in-tests:integration:just-self-terminate-using-skill` doesn't exist yet. Claude will not find the command and will either error or not self-terminate, causing a timeout or other failure. This is the correct RED phase failure.

Note: This test spawns a REAL Claude CLI process, so the failure may manifest as a timeout (30s) if Claude doesn't find the command and doesn't self-terminate. If the timeout makes the RED phase too slow, we can verify the failure by confirming the command file doesn't exist and that the test would fail.

## Step 4: Verify TypeScript Compilation

Run: `pnpm typecheck`

Expected: No TypeScript errors in the test file itself (it only imports `ClaudeCodeTool` which exists).

## Last Step: Complete Remaining Command Steps

Re-read the command at `.claude/commands/agentic-hq-commands/used-in-demos/full-jira-tdd-story-workflow/02-jira-write-failing-test.md` and complete all remaining steps (7b through 10) — creating the RED phase summary doc, adding Jira comment, presenting to human, writing output file, and self-terminating.

## Verification

- `pnpm test:integration:real-claude-self-termination-skill` runs and FAILS (command not found / timeout)
- `pnpm typecheck` passes (no TS errors in test file)
- RED phase doc created at expected path

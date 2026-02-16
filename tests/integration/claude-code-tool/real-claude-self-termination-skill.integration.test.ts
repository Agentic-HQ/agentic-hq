/**
 * Integration Test: Real Claude Code Self-Termination via Skill
 *
 * This test verifies that:
 * 1. ClaudeCodeTool can run a slash command that invokes the self-termination skill
 * 2. The skill terminates Claude Code (not killed by test)
 * 3. Control returns to the test within 30 seconds
 *
 * The test uses the command at:
 *   .claude/commands/agentic-hq-commands/used-in-tests/integration/just-self-terminate-using-skill.md
 *
 * Which instructs Claude to use the self-termination skill:
 *   /agentic-hq-core-plugin:self-termination
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-47
 */

import { describe, it } from 'vitest';

import { ClaudeCodeTool } from '../../../src/tools/claude-code/ClaudeCodeTool';

/**
 * Timeout in milliseconds for Claude to self-terminate via skill.
 * 30 seconds provides margin for Claude startup and skill execution.
 * If Claude doesn't self-terminate within this time, Vitest will fail the test.
 */
const TEST_TIMEOUT_MS = 30_000;

/**
 * The slash command that tells Claude to self-terminate using the skill.
 * This command file instructs Claude to invoke the self-termination skill.
 */
const SELF_TERMINATE_SKILL_COMMAND =
  '/agentic-hq-commands:used-in-tests:integration:just-self-terminate-using-skill';

describe('ClaudeCodeTool self-termination via skill', () => {
  it(
    'should return control to test when Claude executes self-termination skill command',
    async () => {
      // Arrange
      const tool = new ClaudeCodeTool();

      // Act - Run the self-terminating skill command and wait for it to complete
      const commandInput = 'Unused command input string';
      await tool.execute(SELF_TERMINATE_SKILL_COMMAND, commandInput);

      // Assert - if we get here, Claude self-terminated via skill (otherwise test times out)
    },
    TEST_TIMEOUT_MS
  );
});

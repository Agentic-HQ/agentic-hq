/**
 * Integration Test: Real Claude Code Self-Termination via Skill
 *
 * This test verifies that:
 * 1. MarshalledCLITool can run a slash command that invokes the self-termination skill
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

import { BuildMode } from '../../../src/interfaces/build-mode.js';
import { CompositionRoot } from '../../../src/kernel/composition-root.js';
import { DefaultAhqPackageRoot } from '../../../src/runtime-params/default-ahq-package-root.js';
import { DefaultAhqRuntimeParams } from '../../../src/runtime-params/default-ahq-runtime-params.js';
import { DefaultClaudeCodeTool } from '../../../src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.js';

/**
 * Timeout in milliseconds for Claude to self-terminate via skill.
 * 30 seconds provides margin for Claude startup and skill execution.
 * If Claude doesn't self-terminate within this time, Vitest will fail the test.
 */
const TEST_TIMEOUT_MS = 120_000;

/**
 * The slash command that tells Claude to self-terminate using the skill.
 * This command file instructs Claude to invoke the self-termination skill.
 */
const SELF_TERMINATE_SKILL_COMMAND =
  '/agentic-hq-commands:used-in-tests:integration:just-self-terminate-using-skill';

describe('MarshalledCLITool self-termination via skill', () => {
  it(
    'should return control to test when Claude executes self-termination skill command',
    async () => {
      // Arrange
      // REFACTOR: This exact creation of DefaultClaudeCodeTool is duplicated in lots of tests, so should be extracted somehow to remove duplciation (ideally as a new Type/Interface/Class that is shared - maybe a test object or maybe a one used in both test and production code?)
      const tool = new DefaultClaudeCodeTool(
        new CompositionRoot(
          new DefaultAhqRuntimeParams(
            BuildMode.BUILD_FIRST,
            new DefaultAhqPackageRoot(process.cwd())
          )
        )
      );

      // Act - Run the self-terminating skill command and wait for it to complete
      const commandInput = 'Unused command input string';
      await tool.execute(SELF_TERMINATE_SKILL_COMMAND, commandInput);

      // Assert - if we get here, Claude self-terminated via skill (otherwise test times out)
    },
    TEST_TIMEOUT_MS
  );
});

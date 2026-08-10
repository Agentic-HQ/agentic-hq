/**
 * Integration Test: Claude Executes Command Using File I/O
 *
 * This test verifies that MarshalledCLITool can:
 * 1. Write command input to a JSON file
 * 2. Run a real Claude Code command (slash command format)
 * 3. Claude reads input, reverses the string, writes output to JSON file
 * 4. MarshalledCLITool reads the output and returns the result
 *
 * Uses REAL Claude Code (not fake fixture).
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-9
 */

import { describe, it, expect } from 'vitest';

import { BuildMode } from '../../../src/interfaces/build-mode.js';
import { CompositionRoot } from '../../../src/kernel/composition-root.js';
import { DefaultAhqPackageRoot } from '../../../src/runtime-params/default-ahq-package-root.js';
import { DefaultAhqRuntimeParams } from '../../../src/runtime-params/default-ahq-runtime-params.js';
import { DefaultClaudeCodeTool } from '../../../src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.js';

const TEST_TIMEOUT_MS = 60_000; // 60s for real Claude Code execution

const REVERSE_STRING_COMMAND =
  '/agentic-hq-commands:used-in-tests:integration:reverse-a-string-for-integration-test';

describe('MarshalledCLITool.execute(command, commandInput) with real Claude', () => {
  it(
    'should reverse a string via file I/O with real Claude Code',
    async () => {
      // Arrange
      const tool = new DefaultClaudeCodeTool(
        new CompositionRoot(
          new DefaultAhqRuntimeParams(
            BuildMode.BUILD_FIRST,
            new DefaultAhqPackageRoot(process.cwd())
          )
        )
      );
      const commandInputString = 'this is a test string';
      const expectedCommandOutputString = 'gnirts tset a si siht';

      // Act - call with slash command and input string
      const commandOutputString = await tool.execute(REVERSE_STRING_COMMAND, commandInputString);

      // Assert
      expect(commandOutputString).toBe(expectedCommandOutputString);
    },
    TEST_TIMEOUT_MS
  );
});

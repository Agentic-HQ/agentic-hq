/**
 * Unit Test: Fake Claude Executes Command Using File I/O
 *
 * Tests ClaudeCodeTool.execute(command, commandInput) method with a fake CLI fixture.
 * Uses constructor injection to replace real Claude with fake fixture.
 *
 * Expected RED phase failure:
 * - Constructor doesn't accept options yet
 * - execute() method takes 1 arg (prompt), test passes 2 args (command, input)
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-9
 */

import * as path from 'node:path';

import { describe, it, expect } from 'vitest';

import { ClaudeCodeTool } from '../../../src/tools/claude-code/ClaudeCodeTool.js';

// TypeScript executor for running .ts fixtures directly
const TSX_EXECUTABLE = 'tsx';

// Path to fake CLI fixture (relative to project root)
const FAKE_CLI_PATH = path.join(
  process.cwd(),
  'tests/unit/claude-code-tool/fixtures/fake-claude-cli.reverses-a-string-using-files.fixture.ts'
);

describe('ClaudeCodeTool.execute(command, commandInput)', () => {
  it('should reverse a string via file I/O with fake CLI', async () => {
    // Arrange - inject fake CLI instead of real Claude
    const tool = new ClaudeCodeTool({
      executable: TSX_EXECUTABLE,
      args: [FAKE_CLI_PATH],
    });
    const commandInputString = 'this is a test string';
    const expectedCommandOutputString = 'gnirts tset a si siht';

    // Act - call with command (unused in unit test) and input
    const commandOutputString = await tool.execute(
      'unused-command-name-as-this-is-a-mock',
      commandInputString
    );

    // Assert
    expect(commandOutputString).toBe(expectedCommandOutputString);
  });
});

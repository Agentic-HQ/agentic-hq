/**
 * Unit Test: DefaultClaudeCodeTool
 *
 * Tests that DefaultClaudeCodeTool encapsulates the standard wiring
 * and delegates execute() to CompositionRoot's tool.
 *
 * Mocks child_process.execSync to avoid real git calls during construction.
 */
import { describe, it, expect, vi } from 'vitest';

import { DefaultClaudeCodeTool } from '../../../../src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.js';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(() => '/mock/git/root\n'),
}));

const mockExecute = vi.fn().mockResolvedValue('mock output');

vi.mock('../../../../src/kernel/composition-root.js', () => ({
  CompositionRoot: class {
    getTool() {
      return { execute: mockExecute };
    }
  },
}));

describe('DefaultClaudeCodeTool', () => {
  it('should delegate execute() to CompositionRoot.getTool()', async () => {
    const tool = new DefaultClaudeCodeTool();

    const result = await tool.execute('test-command', 'test input');

    expect(mockExecute).toHaveBeenCalledWith('test-command', 'test input');
    expect(result).toBe('mock output');
  });
});

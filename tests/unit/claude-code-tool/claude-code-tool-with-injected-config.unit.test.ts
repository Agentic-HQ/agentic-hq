/**
 * Unit Test: MarshalledCLITool with ClaudeCommandBuilder defaults.
 *
 * Verifies that ClaudeCommandBuilder's default plugin dirs and allowed tools
 * are correctly passed through to the CLI when used with MarshalledCLITool.
 */
import { describe, expect, it, vi } from 'vitest';

import type { AgenticHqInstallation } from '../../../src/interfaces/agentic-hq-installation.js';
import type { CLICommand } from '../../../src/interfaces/cli-command.js';
import type { CLIWrapper } from '../../../src/interfaces/cli-wrapper.js';
import type { IOMarshallerSessionFactory } from '../../../src/interfaces/io-marshaller-session-factory.js';
import type { UserProjectWorkspace } from '../../../src/interfaces/user-project-workspace.js';
import { ClaudeCommandBuilder } from '../../../src/tools/marshalled-io-tools/claude-code/claude-command-builder.js';
import { MarshalledCLITool } from '../../../src/tools/marshalled-io-tools/marshalled-cli-tool.js';

const mockInstallation: AgenticHqInstallation = {
  getConfigDir: () => '/fake/workspace/.agentic-hq',
};

const mockWorkspace: UserProjectWorkspace = {
  getRoot: () => '/fake/project',
  getTempDir: () => '/fake/project/.agentic-hq/temp',
};

function createMockSessionFactory(): IOMarshallerSessionFactory {
  return {
    create: vi.fn().mockReturnValue({
      getMarshallingId: vi.fn().mockReturnValue('/tmp/mock-io-dir'),
      write: vi.fn(),
      readOutput: vi.fn().mockReturnValue('mock output'),
    }),
  };
}

/** Creates a mock CLIWrapper that captures the args it was called with */
function createMockCliWrapper(): CLIWrapper & { getLastCallArgs: () => string[] } {
  let lastArgs: string[] = [];
  return {
    run: vi.fn().mockImplementation((command: CLICommand, _currentWorkingDirectory: string) => {
      lastArgs = command.args;
      return Promise.resolve();
    }),
    getLastCallArgs: () => lastArgs,
  };
}

describe('MarshalledCLITool with ClaudeCommandBuilder config', () => {
  it('should use default plugin dirs and allowed tools', async () => {
    const mockWrapper = createMockCliWrapper();

    const tool = new MarshalledCLITool(
      createMockSessionFactory(),
      mockWrapper,
      new ClaudeCommandBuilder(mockInstallation),
      mockWorkspace
    );

    await tool.execute('test-command', 'test input');

    const args = mockWrapper.getLastCallArgs();
    // Should contain the hardcoded defaults
    expect(args.join(' ')).toContain('agentic-hq-core-plugin');
    expect(args.join(' ')).toContain('agentic-hq-demos-plugin');
    expect(args.join(' ')).toContain('agentic-hq-utilities-plugin');
    expect(args.join(' ')).toContain('--allowedTools=');
    expect(args.join(' ')).toContain('Bash');
  });
});

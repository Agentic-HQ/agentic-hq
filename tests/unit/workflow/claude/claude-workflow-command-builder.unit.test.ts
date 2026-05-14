/**
 * Unit Test: ClaudeWorkflowCommandBuilder implements WorkflowCommandBuilder.
 *
 * Verifies that ClaudeWorkflowCommandBuilder:
 * 1. Implements the WorkflowCommandBuilder interface
 * 2. Uses Tool to resolve skill path into a command string
 * 3. Appends shell-escaped passthrough args
 * 4. Returns a WorkflowCommand that can be executed
 */
import { describe, expect, it, vi } from 'vitest';

import type { CLICommand } from '../../../../src/interfaces/cli-command.js';
import type { CLIWrapper } from '../../../../src/interfaces/cli-wrapper.js';
import type { Tool } from '../../../../src/interfaces/tool.js';
import type { WorkflowCommandBuilder } from '../../../../src/interfaces/workflow-command-builder.js';
import { ClaudeWorkflowCommandBuilder } from '../../../../src/workflow/claude/claude-workflow-command-builder.js';
import type { Workspace } from '../../../../src/workflow-discovery/interfaces/workspace.js';

const mockWorkspace: Workspace = {
  getDisplayName: () => 'Mock',
  getPlugins: () => [],
  registerWorkflowsWith: () => {},
  getRoot: () => '/mock/project-root',
  getTempDir: () => '/mock/project-root/.agentic-hq/temp',
  getDotAgenticHqDir: () => '/mock/project-root/.agentic-hq',
  isAhqWorkspace: () => false,
};

function createMockTool(resolvedCommand: string): Tool {
  return {
    execute: vi.fn().mockResolvedValue(resolvedCommand),
  };
}

function createMockCliWrapper(): CLIWrapper {
  return {
    run: vi.fn().mockResolvedValue(undefined),
  };
}

describe('ClaudeWorkflowCommandBuilder', () => {
  it('should implement the WorkflowCommandBuilder interface', () => {
    const builder: WorkflowCommandBuilder = new ClaudeWorkflowCommandBuilder(
      createMockTool('echo hello'),
      createMockCliWrapper(),
      mockWorkspace
    );
    expect(builder).toBeDefined();
    expect(typeof builder.build).toBe('function');
  });

  it('should resolve skill path via Tool and return a WorkflowCommand', async () => {
    const mockTool = createMockTool('tsx run-workflow.ts');
    const mockWrapper = createMockCliWrapper();
    const builder = new ClaudeWorkflowCommandBuilder(mockTool, mockWrapper, mockWorkspace);

    const command = await builder.build('/plugin:skill', []);

    expect(mockTool.execute).toHaveBeenCalledWith('/plugin:skill', 'unused input string');
    expect(typeof command.execute).toBe('function');
  });

  it('should return a WorkflowCommand that executes with the resolved command string', async () => {
    const mockTool = createMockTool('tsx run-workflow.ts');
    const mockWrapper = createMockCliWrapper();
    const builder = new ClaudeWorkflowCommandBuilder(mockTool, mockWrapper, mockWorkspace);

    const command = await builder.build('/plugin:skill', []);
    await command.execute();

    expect(mockWrapper.run).toHaveBeenCalledTimes(1);
    const call = vi.mocked(mockWrapper.run).mock.calls[0]!;
    const cliCommand = call[0] as CLICommand;
    expect(cliCommand.executable).toBe('bash');
    expect(cliCommand.args).toEqual(['-c', 'tsx run-workflow.ts']);
    expect(call[1]).toBe('/mock/project-root');
  });

  it('should append shell-escaped passthrough args to the command', async () => {
    const mockTool = createMockTool('tsx run-workflow.ts');
    const mockWrapper = createMockCliWrapper();
    const builder = new ClaudeWorkflowCommandBuilder(mockTool, mockWrapper, mockWorkspace);

    const command = await builder.build('/plugin:skill', ['--arg1=value', '--name=hello world']);
    await command.execute();

    const call = vi.mocked(mockWrapper.run).mock.calls[0]!;
    const cliCommand = call[0] as CLICommand;
    expect(cliCommand.args).toEqual([
      '-c',
      "tsx run-workflow.ts '--arg1=value' '--name=hello world'",
    ]);
  });

  it('should work with any Tool implementation', async () => {
    const customTool = createMockTool('custom-command --flag');
    const mockWrapper = createMockCliWrapper();
    const builder = new ClaudeWorkflowCommandBuilder(customTool, mockWrapper, mockWorkspace);

    const command = await builder.build('/custom:skill', ['extra']);
    await command.execute();

    expect(customTool.execute).toHaveBeenCalledWith('/custom:skill', 'unused input string');
    const call = vi.mocked(mockWrapper.run).mock.calls[0]!;
    const cliCommand = call[0] as CLICommand;
    expect(cliCommand.args).toEqual(['-c', "custom-command --flag 'extra'"]);
  });
});

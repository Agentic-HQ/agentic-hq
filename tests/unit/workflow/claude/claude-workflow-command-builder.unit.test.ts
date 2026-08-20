/**
 * Unit Test: ClaudeWorkflowCommandBuilder implements WorkflowCommandBuilder.
 *
 * Verifies that ClaudeWorkflowCommandBuilder:
 * 1. Implements the WorkflowCommandBuilder interface
 * 2. Obtains its Tool from the injected ToolFactory for the given BuildMode
 *    (per-workflow build-mode, AHQ-208) and uses it to resolve the skill path
 *    into a command string
 * 3. Appends shell-escaped passthrough args
 * 4. Returns a WorkflowCommand that can be executed
 */
import { describe, expect, it, vi } from 'vitest';

import { BuildMode } from '../../../../src/interfaces/build-mode.js';
import type { CLICommand } from '../../../../src/interfaces/cli-command.js';
import type { CLIWrapper } from '../../../../src/interfaces/cli-wrapper.js';
import type { ToolFactory } from '../../../../src/interfaces/tool-factory.js';
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
  isAhqPackage: () => false,
  getBuildMode: () => BuildMode.BUILD_FIRST,
};

function createMockToolFactory(resolvedCommand: string): {
  toolFactory: ToolFactory;
  tool: Tool;
} {
  const tool: Tool = {
    execute: vi.fn().mockResolvedValue(resolvedCommand),
  };
  const toolFactory: ToolFactory = {
    createTool: vi.fn().mockReturnValue(tool),
  };
  return { toolFactory, tool };
}

function createMockCliWrapper(): CLIWrapper {
  return {
    run: vi.fn().mockResolvedValue(undefined),
  };
}

describe('ClaudeWorkflowCommandBuilder', () => {
  it('should implement the WorkflowCommandBuilder interface', () => {
    const builder: WorkflowCommandBuilder = new ClaudeWorkflowCommandBuilder(
      createMockToolFactory('echo hello').toolFactory,
      createMockCliWrapper(),
      mockWorkspace
    );
    expect(builder).toBeDefined();
    expect(typeof builder.build).toBe('function');
  });

  it('should create the tool for the given build mode and resolve the skill path through it', async () => {
    const { toolFactory, tool } = createMockToolFactory('node run-workflow.cjs');
    const mockWrapper = createMockCliWrapper();
    const builder = new ClaudeWorkflowCommandBuilder(toolFactory, mockWrapper, mockWorkspace);

    const command = await builder.build('/plugin:skill', BuildMode.PREBUILT, []);

    expect(toolFactory.createTool).toHaveBeenCalledWith(BuildMode.PREBUILT);
    expect(tool.execute).toHaveBeenCalledWith('/plugin:skill', 'unused input string');
    expect(typeof command.execute).toBe('function');
  });

  it('should return a WorkflowCommand that executes with the resolved command string', async () => {
    const { toolFactory } = createMockToolFactory('node run-workflow.cjs');
    const mockWrapper = createMockCliWrapper();
    const builder = new ClaudeWorkflowCommandBuilder(toolFactory, mockWrapper, mockWorkspace);

    const command = await builder.build('/plugin:skill', BuildMode.BUILD_FIRST, []);
    await command.execute();

    expect(mockWrapper.run).toHaveBeenCalledTimes(1);
    const call = vi.mocked(mockWrapper.run).mock.calls[0]!;
    const cliCommand = call[0] as CLICommand;
    expect(cliCommand.executable).toBe('bash');
    expect(cliCommand.args).toEqual(['-c', 'node run-workflow.cjs']);
    expect(call[1]).toBe('/mock/project-root');
  });

  it('should append shell-escaped passthrough args to the command', async () => {
    const { toolFactory } = createMockToolFactory('node run-workflow.cjs');
    const mockWrapper = createMockCliWrapper();
    const builder = new ClaudeWorkflowCommandBuilder(toolFactory, mockWrapper, mockWorkspace);

    const command = await builder.build('/plugin:skill', BuildMode.BUILD_FIRST, [
      '--arg1=value',
      '--name=hello world',
    ]);
    await command.execute();

    const call = vi.mocked(mockWrapper.run).mock.calls[0]!;
    const cliCommand = call[0] as CLICommand;
    expect(cliCommand.args).toEqual([
      '-c',
      "node run-workflow.cjs '--arg1=value' '--name=hello world'",
    ]);
  });

  it('should work with any ToolFactory implementation', async () => {
    const { toolFactory, tool } = createMockToolFactory('custom-command --flag');
    const mockWrapper = createMockCliWrapper();
    const builder = new ClaudeWorkflowCommandBuilder(toolFactory, mockWrapper, mockWorkspace);

    const command = await builder.build('/custom:skill', BuildMode.BUILD_FIRST, ['extra']);
    await command.execute();

    expect(tool.execute).toHaveBeenCalledWith('/custom:skill', 'unused input string');
    const call = vi.mocked(mockWrapper.run).mock.calls[0]!;
    const cliCommand = call[0] as CLICommand;
    expect(cliCommand.args).toEqual(['-c', "custom-command --flag 'extra'"]);
  });
});

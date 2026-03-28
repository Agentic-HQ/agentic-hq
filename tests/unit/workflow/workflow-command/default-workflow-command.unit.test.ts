/**
 * Unit Test: DefaultWorkflowCommand implements WorkflowCommand interface.
 *
 * Verifies that DefaultWorkflowCommand:
 * 1. Implements the WorkflowCommand interface
 * 2. Creates a CLICommand internally with 'bash -c <commandString>'
 * 3. Executes via CLIWrapper with the correct working directory
 */
import { describe, expect, it, vi } from 'vitest';

import type { CLICommand } from '../../../../src/interfaces/cli-command.js';
import type { CLIWrapper } from '../../../../src/interfaces/cli-wrapper.js';
import type { WorkflowCommand } from '../../../../src/interfaces/workflow-command.js';
import { DefaultWorkflowCommand } from '../../../../src/workflow/workflow-command/default-workflow-command.js';

function createMockCliWrapper(): CLIWrapper {
  return {
    run: vi.fn().mockResolvedValue(undefined),
  };
}

describe('DefaultWorkflowCommand', () => {
  it('should implement the WorkflowCommand interface', () => {
    const mockWrapper = createMockCliWrapper();
    const command: WorkflowCommand = new DefaultWorkflowCommand(
      'tsx run-workflow.ts',
      mockWrapper,
      '/mock/project-root'
    );
    expect(command).toBeDefined();
    expect(typeof command.execute).toBe('function');
  });

  it('should execute via CLIWrapper with bash -c and the command string', async () => {
    const mockWrapper = createMockCliWrapper();
    const command = new DefaultWorkflowCommand(
      'tsx run-workflow.ts',
      mockWrapper,
      '/mock/project-root'
    );

    await command.execute();

    expect(mockWrapper.run).toHaveBeenCalledTimes(1);
    const call = vi.mocked(mockWrapper.run).mock.calls[0]!;
    const cliCommand = call[0] as CLICommand;
    expect(cliCommand.executable).toBe('bash');
    expect(cliCommand.args).toEqual(['-c', 'tsx run-workflow.ts']);
    expect(call[1]).toBe('/mock/project-root');
  });

  it('should pass the command string exactly as provided (no modification)', async () => {
    const mockWrapper = createMockCliWrapper();
    const commandStr = "tsx run-workflow.ts '--arg1=value' '--name=hello world'";
    const command = new DefaultWorkflowCommand(commandStr, mockWrapper, '/other/dir');

    await command.execute();

    const call = vi.mocked(mockWrapper.run).mock.calls[0]!;
    const cliCommand = call[0] as CLICommand;
    expect(cliCommand.args).toEqual(['-c', commandStr]);
    expect(call[1]).toBe('/other/dir');
  });
});

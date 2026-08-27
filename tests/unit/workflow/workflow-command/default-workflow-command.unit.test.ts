/**
 * Unit Test: DefaultWorkflowCommand implements WorkflowCommand interface.
 *
 * Verifies that DefaultWorkflowCommand:
 * 1. Implements the WorkflowCommand interface
 * 2. Spawns the executable + args directly as a CLICommand — no shell of any
 *    kind wraps the launch (`bash -c` was deleted by AHQ-210/AHQ-211 D1)
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
      process.execPath,
      ['run-workflow.cjs', '--build-mode=prebuilt'],
      mockWrapper,
      '/mock/project-root'
    );
    expect(command).toBeDefined();
    expect(typeof command.execute).toBe('function');
  });

  it('should execute the executable and args directly via CLIWrapper (no shell)', async () => {
    const mockWrapper = createMockCliWrapper();
    const command = new DefaultWorkflowCommand(
      process.execPath,
      ['run-workflow.cjs', '--build-mode=prebuilt'],
      mockWrapper,
      '/mock/project-root'
    );

    await command.execute();

    expect(mockWrapper.run).toHaveBeenCalledTimes(1);
    const call = vi.mocked(mockWrapper.run).mock.calls[0]!;
    const cliCommand = call[0] as CLICommand;
    expect(cliCommand.executable).toBe(process.execPath);
    expect(cliCommand.args).toEqual(['run-workflow.cjs', '--build-mode=prebuilt']);
    expect(call[1]).toBe('/mock/project-root');
  });

  it('should pass args exactly as provided — spaces need no quoting in an argv array', async () => {
    const mockWrapper = createMockCliWrapper();
    const args = [
      'run-workflow.cjs',
      '--workflow-dir=C:\\path with spaces\\ts-workflow',
      '--name=hello world',
    ];
    const command = new DefaultWorkflowCommand(process.execPath, args, mockWrapper, '/other/dir');

    await command.execute();

    const call = vi.mocked(mockWrapper.run).mock.calls[0]!;
    const cliCommand = call[0] as CLICommand;
    expect(cliCommand.args).toEqual(args);
    expect(call[1]).toBe('/other/dir');
  });
});

/**
 * MarshalledCLITool unit tests.
 *
 * Tests the generic orchestrator that:
 * 1. Creates a marshalling session
 * 2. Writes input via session
 * 3. Builds and runs CLI command via wrapper
 * 4. Reads output via session
 */
import { describe, expect, it, vi } from 'vitest';

import { BuildMode } from '../../../src/interfaces/build-mode.js';
import type { CLICommand } from '../../../src/interfaces/cli-command.js';
import type { CLIWrapper } from '../../../src/interfaces/cli-wrapper.js';
import type { IOMarshallerSessionFactory } from '../../../src/interfaces/io-marshaller-session-factory.js';
import type { IOMarshallerSession } from '../../../src/interfaces/io-marshaller-session.js';
import type { MarshalledIOCLICommandBuilder } from '../../../src/interfaces/marshalled-io-cli-command-builder.js';
import type { Tool } from '../../../src/interfaces/tool.js';
import { MarshalledCLITool } from '../../../src/tools/marshalled-io-tools/marshalled-cli-tool.js';
import type { Workspace } from '../../../src/workflow-discovery/interfaces/workspace.js';

const mockWorkspace: Workspace = {
  getDisplayName: () => 'Mock',
  getPlugins: () => [],
  registerWorkflowsWith: () => {},
  getRoot: () => '/mock/project',
  getTempDir: () => '/mock/project/.agentic-hq/temp',
  getDotAgenticHqDir: () => '/mock/project/.agentic-hq',
  isAhqPackage: () => false,
  getBuildMode: () => BuildMode.BUILD_FIRST,
};

function createMockSession(): IOMarshallerSession {
  return {
    getMarshallingId: vi.fn().mockReturnValue('/tmp/mock-session-dir'),
    write: vi.fn(),
    readOutput: vi.fn().mockReturnValue('mock output'),
  };
}

function createMockSessionFactory(session?: IOMarshallerSession): IOMarshallerSessionFactory {
  return { create: vi.fn().mockReturnValue(session ?? createMockSession()) };
}

function createMockCommandBuilder(): MarshalledIOCLICommandBuilder {
  return {
    build: vi.fn().mockReturnValue({
      executable: 'claude',
      args: ['--flag', 'test-command /tmp/mock-session-dir'],
      logDebug: vi.fn(),
    } satisfies CLICommand),
  };
}

function createMockCliWrapper(): CLIWrapper {
  return {
    run: vi.fn().mockResolvedValue(undefined),
  };
}

describe('MarshalledCLITool', () => {
  it('should implement the Tool interface', () => {
    const tool: Tool = new MarshalledCLITool(
      createMockSessionFactory(),
      createMockCliWrapper(),
      createMockCommandBuilder(),
      mockWorkspace
    );
    expect(tool).toBeDefined();
    expect(typeof tool.execute).toBe('function');
  });

  it('should create a session via sessionFactory.create() on each execute()', async () => {
    const mockSession = createMockSession();
    const mockFactory = createMockSessionFactory(mockSession);

    const tool = new MarshalledCLITool(
      mockFactory,
      createMockCliWrapper(),
      createMockCommandBuilder(),
      mockWorkspace
    );

    await tool.execute('test-command', 'test input');

    expect(mockFactory.create).toHaveBeenCalledTimes(1);
  });

  it('should call session.write() with the input', async () => {
    const mockSession = createMockSession();
    const mockFactory = createMockSessionFactory(mockSession);

    const tool = new MarshalledCLITool(
      mockFactory,
      createMockCliWrapper(),
      createMockCommandBuilder(),
      mockWorkspace
    );

    await tool.execute('test-command', 'hello world');

    expect(mockSession.write).toHaveBeenCalledWith('hello world');
  });

  it('should call commandBuilder.build() with command and marshalling ID', async () => {
    const mockSession = createMockSession();
    const mockFactory = createMockSessionFactory(mockSession);
    const mockBuilder = createMockCommandBuilder();

    const tool = new MarshalledCLITool(
      mockFactory,
      createMockCliWrapper(),
      mockBuilder,
      mockWorkspace
    );

    await tool.execute('my-command', 'input');

    expect(mockBuilder.build).toHaveBeenCalledWith('my-command', '/tmp/mock-session-dir');
  });

  it('should call cliWrapper.run() with CLICommand and currentWorkingDirectory', async () => {
    const mockSession = createMockSession();
    const mockFactory = createMockSessionFactory(mockSession);
    const mockWrapper = createMockCliWrapper();

    const tool = new MarshalledCLITool(
      mockFactory,
      mockWrapper,
      createMockCommandBuilder(),
      mockWorkspace
    );

    await tool.execute('test-command', 'input');

    expect(mockWrapper.run).toHaveBeenCalledTimes(1);
    const call = vi.mocked(mockWrapper.run).mock.calls[0]!;
    const command = call[0] as CLICommand;
    expect(command.executable).toBe('claude');
    expect(command.args).toEqual(['--flag', 'test-command /tmp/mock-session-dir']);
    expect(call[1]).toBe(mockWorkspace.getRoot());
  });

  it('should call session.readOutput() and return the result', async () => {
    const mockSession = createMockSession();
    const mockFactory = createMockSessionFactory(mockSession);

    const tool = new MarshalledCLITool(
      mockFactory,
      createMockCliWrapper(),
      createMockCommandBuilder(),
      mockWorkspace
    );

    const result = await tool.execute('test-command', 'input');

    expect(mockSession.readOutput).toHaveBeenCalledTimes(1);
    expect(result).toBe('mock output');
  });

  it('should NOT call logDebug() — that is the wrapper responsibility', async () => {
    const mockSession = createMockSession();
    const mockFactory = createMockSessionFactory(mockSession);
    const mockBuilder = createMockCommandBuilder();

    const tool = new MarshalledCLITool(
      mockFactory,
      createMockCliWrapper(),
      mockBuilder,
      mockWorkspace
    );

    await tool.execute('test-command', 'input');

    const builtCmd = vi.mocked(mockBuilder.build).mock.results[0]!.value as CLICommand;
    expect(builtCmd.logDebug).not.toHaveBeenCalled();
  });

  it('should create a new session for each execute() call', async () => {
    const session1 = createMockSession();
    const session2 = createMockSession();
    let callCount = 0;
    const mockFactory: IOMarshallerSessionFactory = {
      create: vi.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? session1 : session2;
      }),
    };

    const tool = new MarshalledCLITool(
      mockFactory,
      createMockCliWrapper(),
      createMockCommandBuilder(),
      mockWorkspace
    );

    await tool.execute('cmd1', 'input1');
    await tool.execute('cmd2', 'input2');

    expect(mockFactory.create).toHaveBeenCalledTimes(2);
    expect(session1.write).toHaveBeenCalledWith('input1');
    expect(session2.write).toHaveBeenCalledWith('input2');
  });
});

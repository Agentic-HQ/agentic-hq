/**
 * Unit Test: DefaultClaudeCodeTool
 *
 * Verifies that after construction with a CompositionRoot, calling execute()
 * routes input through the session factory, CLI wrapper, and current-user
 * workspace supplied by that CompositionRoot, and builds the CLI command via
 * a ClaudeCommandBuilder wired with the ahq and current-user workspaces.
 */
import { describe, expect, it, vi } from 'vitest';

import { BuildMode } from '../../../../src/interfaces/build-mode.js';
import type { CLICommand } from '../../../../src/interfaces/cli-command.js';
import type { CLIWrapper } from '../../../../src/interfaces/cli-wrapper.js';
import type { IOMarshallerSessionFactory } from '../../../../src/interfaces/io-marshaller-session-factory.js';
import type { IOMarshallerSession } from '../../../../src/interfaces/io-marshaller-session.js';
import { CompositionRoot } from '../../../../src/kernel/composition-root.js';
import { DefaultAhqPackageRoot } from '../../../../src/runtime-params/default-ahq-package-root.js';
import { DefaultAhqRuntimeParams } from '../../../../src/runtime-params/default-ahq-runtime-params.js';
import { ClaudeCommandBuilder } from '../../../../src/tools/marshalled-io-tools/claude-code/claude-command-builder.js';
import { DefaultClaudeCodeTool } from '../../../../src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.js';
import type { Workspace } from '../../../../src/workflow-discovery/interfaces/workspace.js';

const SENTINEL_CLI_COMMAND: CLICommand = {
  executable: 'sentinel-claude',
  args: ['sentinel-arg'],
  logDebug: vi.fn(),
};

vi.mock('../../../../src/tools/marshalled-io-tools/claude-code/claude-command-builder.js', () => ({
  ClaudeCommandBuilder: vi.fn(function MockClaudeCommandBuilder(this: {
    build: ReturnType<typeof vi.fn>;
  }) {
    this.build = vi.fn().mockReturnValue(SENTINEL_CLI_COMMAND);
  }),
}));

function fakeWorkspace(root: string, isAhq: boolean): Workspace {
  return {
    getDisplayName: () => 'Mock',
    getPlugins: () => [],
    registerWorkflowsWith: () => {},
    getRoot: () => root,
    getTempDir: () => `${root}/.agentic-hq/temp`,
    getDotAgenticHqDir: () => `${root}/.agentic-hq`,
    isAhqPackage: () => isAhq,
    getBuildMode: () => BuildMode.BUILD_FIRST,
  };
}

function fakeSession(): IOMarshallerSession {
  return {
    getMarshallingId: vi.fn().mockReturnValue('mock-marshalling-id'),
    write: vi.fn(),
    readOutput: vi.fn().mockReturnValue('mock-output'),
  };
}

describe('DefaultClaudeCodeTool', () => {
  it('routes execute() through the injected CompositionRoot (session factory, CLI wrapper, workspaces)', async () => {
    const mySession = fakeSession();
    const mySessionFactory: IOMarshallerSessionFactory = {
      create: vi.fn().mockReturnValue(mySession),
    };
    const myCliWrapper: CLIWrapper = {
      run: vi.fn().mockResolvedValue(undefined),
    };
    const myAhqPackage = fakeWorkspace('/my-ahq-root', true);
    const myCurrentUserWorkspace = fakeWorkspace('/my-cwd-root', false);
    const myRuntimeParams = new DefaultAhqRuntimeParams(
      BuildMode.PREBUILT,
      new DefaultAhqPackageRoot('/my-ahq-package-root')
    );

    const myRoot = {
      getIOMarshallerSessionFactory: vi.fn(() => mySessionFactory),
      getCLIWrapper: vi.fn(() => myCliWrapper),
      getAhqPackage: vi.fn(() => myAhqPackage),
      getCurrentUserWorkspace: vi.fn(() => myCurrentUserWorkspace),
      getAhqRuntimeParams: vi.fn(() => myRuntimeParams),
    } as unknown as CompositionRoot;

    const tool = new DefaultClaudeCodeTool(myRoot);
    const result = await tool.execute('my-command', 'my-input');

    expect(mySessionFactory.create).toHaveBeenCalledTimes(1);
    expect(mySession.write).toHaveBeenCalledWith('my-input');
    expect(mySession.readOutput).toHaveBeenCalledTimes(1);
    expect(result).toBe('mock-output');

    // The builder is wired with the runtime params drawn from the
    // CompositionRoot (AHQ-197) so every Claude launch carries the relay
    expect(ClaudeCommandBuilder).toHaveBeenCalledTimes(1);
    expect(ClaudeCommandBuilder).toHaveBeenCalledWith(
      myAhqPackage,
      myCurrentUserWorkspace,
      myRuntimeParams
    );

    expect(myCliWrapper.run).toHaveBeenCalledTimes(1);
    const [builtCliCommand, runCwd] = vi.mocked(myCliWrapper.run).mock.calls[0]! as [
      CLICommand,
      string,
    ];
    expect(builtCliCommand.executable).toBe('sentinel-claude');
    expect(runCwd).toBe('/my-cwd-root');

    const mockedBuilderInstance = vi.mocked(ClaudeCommandBuilder).mock.results[0]!.value as {
      build: ReturnType<typeof vi.fn>;
    };
    expect(mockedBuilderInstance.build).toHaveBeenCalledWith('my-command', 'mock-marshalling-id');
  });
});

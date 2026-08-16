/**
 * Unit Test: MarshalledCLITool with ClaudeCommandBuilder defaults.
 *
 * Verifies that ClaudeCommandBuilder's dynamically discovered plugin dirs and allowed tools
 * are correctly passed through to the CLI when used with MarshalledCLITool.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BuildMode } from '../../../src/interfaces/build-mode.js';
import type { CLICommand } from '../../../src/interfaces/cli-command.js';
import type { CLIWrapper } from '../../../src/interfaces/cli-wrapper.js';
import type { IOMarshallerSessionFactory } from '../../../src/interfaces/io-marshaller-session-factory.js';
import { DefaultAhqPackageRoot } from '../../../src/runtime-params/default-ahq-package-root.js';
import { DefaultAhqRuntimeParams } from '../../../src/runtime-params/default-ahq-runtime-params.js';
import { ClaudeCommandBuilder } from '../../../src/tools/marshalled-io-tools/claude-code/claude-command-builder.js';
import { MarshalledCLITool } from '../../../src/tools/marshalled-io-tools/marshalled-cli-tool.js';
import type { Workspace } from '../../../src/workflow-discovery/interfaces/workspace.js';

let tmpDir: string;
let ahqConfigDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccb-config-test-'));
  ahqConfigDir = path.join(tmpDir, '.agentic-hq');
  fs.mkdirSync(path.join(ahqConfigDir, 'plugins', 'agentic-hq-core-plugin'), { recursive: true });
  fs.mkdirSync(path.join(ahqConfigDir, 'plugins', 'agentic-hq-demos-plugin'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

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
  it('should discover plugin dirs dynamically and include allowed tools', async () => {
    const mockWrapper = createMockCliWrapper();
    const ahqPackage: Workspace = {
      getDisplayName: () => 'Agentic HQ Package',
      getPlugins: () => [],
      registerWorkflowsWith: () => {},
      getRoot: () => tmpDir,
      getTempDir: () => path.join(tmpDir, '.agentic-hq', 'temp'),
      getDotAgenticHqDir: () => ahqConfigDir,
      isAhqPackage: () => true,
    };
    const currentUserWorkspace: Workspace = {
      getDisplayName: () => 'Local Workspace',
      getPlugins: () => [],
      registerWorkflowsWith: () => {},
      getRoot: () => tmpDir,
      getTempDir: () => path.join(tmpDir, '.agentic-hq', 'temp'),
      getDotAgenticHqDir: () => path.join(tmpDir, '.agentic-hq'),
      isAhqPackage: () => true,
    };

    const tool = new MarshalledCLITool(
      createMockSessionFactory(),
      mockWrapper,
      new ClaudeCommandBuilder(
        ahqPackage,
        currentUserWorkspace,
        new DefaultAhqRuntimeParams(BuildMode.BUILD_FIRST, new DefaultAhqPackageRoot(process.cwd()))
      ),
      currentUserWorkspace
    );

    await tool.execute('test-command', 'test input');

    const args = mockWrapper.getLastCallArgs();
    // Should contain dynamically discovered plugin dirs
    expect(args.join(' ')).toContain('agentic-hq-core-plugin');
    expect(args.join(' ')).toContain('agentic-hq-demos-plugin');
    expect(args.join(' ')).toContain('--allowedTools=');
    expect(args.join(' ')).toContain('Bash');
  });
});

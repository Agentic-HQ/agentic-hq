/**
 * Unit Test: MarshalledCLITool end-to-end with real session factory and fake CLI.
 *
 * Tests the full pipeline: real JSON file I/O marshalling + PTY execution
 * with a fake CLI fixture that reverses strings.
 */
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { BuildMode } from '../../../src/interfaces/build-mode.js';
import { JsonFileIOMarshallerSessionFactory } from '../../../src/io/marshalling/json-file-io-marshaller-session-factory.js';
import { DefaultAhqPackageRoot } from '../../../src/runtime-params/default-ahq-package-root.js';
import { DefaultAhqRuntimeParams } from '../../../src/runtime-params/default-ahq-runtime-params.js';
import { ClaudeCommandBuilder } from '../../../src/tools/marshalled-io-tools/claude-code/claude-command-builder.js';
import { MarshalledCLITool } from '../../../src/tools/marshalled-io-tools/marshalled-cli-tool.js';
import { AhqPackageImpl } from '../../../src/workflow-discovery/workspace/ahq-package-impl.js';
import { CurrentUserWorkspaceImpl } from '../../../src/workflow-discovery/workspace/current-user-workspace-impl.js';

const TSX_EXECUTABLE = 'tsx';
const FAKE_CLI_PATH = path.join(
  process.cwd(),
  'tests/unit/claude-code-tool/fixtures/fake-claude-cli.reverses-a-string-using-files.fixture.ts'
);

describe('MarshalledCLITool with real session factory and fake CLI', () => {
  it('should work end-to-end with real session factory and fake CLI', async () => {
    const { PtyCLIWrapper } = await import('../../../src/io/terminal/pty-cli-wrapper.js');

    const ahqPackageRoot = new DefaultAhqPackageRoot(process.cwd());
    const ahqPackage = new AhqPackageImpl(ahqPackageRoot);
    const currentUserWorkspace = new CurrentUserWorkspaceImpl(ahqPackageRoot);
    const tool = new MarshalledCLITool(
      new JsonFileIOMarshallerSessionFactory(currentUserWorkspace),
      new PtyCLIWrapper(),
      new ClaudeCommandBuilder(
        ahqPackage,
        currentUserWorkspace,
        new DefaultAhqRuntimeParams(BuildMode.BUILD_FIRST, ahqPackageRoot),
        TSX_EXECUTABLE,
        [FAKE_CLI_PATH]
      ),
      currentUserWorkspace
    );

    const result = await tool.execute(
      'unused-command-name-as-this-is-a-mock',
      'this is a test string'
    );
    expect(result).toBe('gnirts tset a si siht');
  });
});

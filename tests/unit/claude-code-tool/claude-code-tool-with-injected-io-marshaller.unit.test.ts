/**
 * Unit Test: MarshalledCLITool end-to-end with real session factory and fake CLI.
 *
 * Tests the full pipeline: real JSON file I/O marshalling + PTY execution
 * with a fake CLI fixture that reverses strings.
 */
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { JsonFileIOMarshallerSessionFactory } from '../../../src/io/marshalling/json-file-io-marshaller-session-factory.js';
import { ClaudeCommandBuilder } from '../../../src/tools/marshalled-io-tools/claude-code/claude-command-builder.js';
import { MarshalledCLITool } from '../../../src/tools/marshalled-io-tools/marshalled-cli-tool.js';
import { AhqWorkspaceImpl } from '../../../src/workflow-discovery/workspace/ahq-workspace-impl.js';
import { CurrentUserWorkspaceImpl } from '../../../src/workflow-discovery/workspace/current-user-workspace-impl.js';

const TSX_EXECUTABLE = 'tsx';
const FAKE_CLI_PATH = path.join(
  process.cwd(),
  'tests/unit/claude-code-tool/fixtures/fake-claude-cli.reverses-a-string-using-files.fixture.ts'
);

describe('MarshalledCLITool with real session factory and fake CLI', () => {
  it('should work end-to-end with real session factory and fake CLI', async () => {
    const { PtyCLIWrapper } = await import('../../../src/io/terminal/pty-cli-wrapper.js');

    const ahqWorkspace = new AhqWorkspaceImpl();
    const currentUserWorkspace = new CurrentUserWorkspaceImpl();
    const tool = new MarshalledCLITool(
      new JsonFileIOMarshallerSessionFactory(currentUserWorkspace),
      new PtyCLIWrapper(),
      new ClaudeCommandBuilder(ahqWorkspace, currentUserWorkspace, TSX_EXECUTABLE, [FAKE_CLI_PATH]),
      currentUserWorkspace
    );

    const result = await tool.execute(
      'unused-command-name-as-this-is-a-mock',
      'this is a test string'
    );
    expect(result).toBe('gnirts tset a si siht');
  });
});

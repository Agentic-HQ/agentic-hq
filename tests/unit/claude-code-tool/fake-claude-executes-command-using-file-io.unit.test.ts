/**
 * Unit Test: Fake Claude Executes Command Using File I/O
 *
 * Tests MarshalledCLITool + ClaudeCommandBuilder end-to-end with a fake CLI fixture.
 * Uses constructor injection to replace real Claude with fake fixture.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-9
 */

import * as path from 'node:path';

import { describe, it, expect } from 'vitest';

import { JsonFileIOMarshallerSessionFactory } from '../../../src/io/marshalling/json-file-io-marshaller-session-factory.js';
import { PtyCLIWrapper } from '../../../src/io/terminal/pty-cli-wrapper.js';
import { ClaudeCommandBuilder } from '../../../src/tools/marshalled-io-tools/claude-code/claude-command-builder.js';
import { MarshalledCLITool } from '../../../src/tools/marshalled-io-tools/marshalled-cli-tool.js';
import { DefaultAgenticHqInstallation } from '../../../src/workspace/default-agentic-hq-installation.js';
import { DefaultGitWorkspace } from '../../../src/workspace/default-git-workspace.js';
import { DefaultUserProjectWorkspace } from '../../../src/workspace/default-user-project-workspace.js';

// TypeScript executor for running .ts fixtures directly
const TSX_EXECUTABLE = 'tsx';

// Path to fake CLI fixture (relative to project root)
const FAKE_CLI_PATH = path.join(
  process.cwd(),
  'tests/unit/claude-code-tool/fixtures/fake-claude-cli.reverses-a-string-using-files.fixture.ts'
);

describe('MarshalledCLITool.execute(command, commandInput)', () => {
  it('should reverse a string via file I/O with fake CLI', async () => {
    // Arrange - inject fake CLI instead of real Claude
    const gitWorkspace = new DefaultGitWorkspace();
    const workspace = new DefaultUserProjectWorkspace(gitWorkspace);
    const tool = new MarshalledCLITool(
      new JsonFileIOMarshallerSessionFactory(workspace),
      new PtyCLIWrapper(),
      new ClaudeCommandBuilder(new DefaultAgenticHqInstallation(gitWorkspace), TSX_EXECUTABLE, [
        FAKE_CLI_PATH,
      ]),
      workspace
    );
    const commandInputString = 'this is a test string';
    const expectedCommandOutputString = 'gnirts tset a si siht';

    // Act - call with command (unused in unit test) and input
    const commandOutputString = await tool.execute(
      'unused-command-name-as-this-is-a-mock',
      commandInputString
    );

    // Assert
    expect(commandOutputString).toBe(expectedCommandOutputString);
  });
});

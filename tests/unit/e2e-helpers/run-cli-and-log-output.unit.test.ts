/**
 * Unit test for the shared e2e helper runCliAndLogOutput().
 *
 * Verifies that the helper:
 * 1. Creates a log file at <os.tmpdir()>/e2e-{label}.log
 * 2. Returns the CLI output as a string (read from the log file)
 *
 * The commands under test are built from process.execPath (the running node
 * binary), so there is nothing shell-specific in them: execSync hands the
 * string to cmd.exe on Windows and /bin/sh on POSIX, and a plain
 * `"<node>" -e "..."` line means the same thing to both (AHQ-211).
 *
 * This imports from tests/e2e/helpers/cli-test-helper-functions.ts.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-72
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, it, expect, afterEach } from 'vitest';

import { runCliAndLogOutput } from '../../e2e/helpers/cli-test-helper-functions.js';

const TEST_LOG_FILE = path.join(os.tmpdir(), 'e2e-unit-test.log');

describe('runCliAndLogOutput', () => {
  afterEach(() => {
    // Clean up the test log file if it was created
    if (fs.existsSync(TEST_LOG_FILE)) {
      fs.unlinkSync(TEST_LOG_FILE);
    }
  });

  it('should create log file at <os.tmpdir()>/e2e-{label}.log and return its contents', () => {
    // Arrange
    const command = `"${process.execPath}" -e "console.log('here is some test text')"`;
    const logFileLabel = 'unit-test';

    // Act
    const output = runCliAndLogOutput(command, logFileLabel);

    // Assert - log file was created at the expected path
    expect(fs.existsSync(TEST_LOG_FILE)).toBe(true);

    // Assert - returned string contains the expected output
    expect(output).toContain('here is some test text');
  });

  it('should execute command in the specified working directory', () => {
    // Arrange - realpathSync because os.tmpdir() can be a symlink (on macOS
    // /var/… → /private/var/…) and the child reports the resolved path
    const workingDirectory = fs.realpathSync(os.tmpdir());
    const command = `"${process.execPath}" -e "console.log('the working directory is ' + process.cwd())"`;

    // Act
    const output = runCliAndLogOutput(command, 'unit-test', undefined, workingDirectory);

    // Assert - the child process ran with the requested working directory
    expect(output).toContain('the working directory is ');
    expect(output).toContain(workingDirectory);
  });
});

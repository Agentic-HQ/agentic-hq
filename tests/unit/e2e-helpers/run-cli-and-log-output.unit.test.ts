/**
 * Unit test for the shared e2e helper runCliAndLogOutput().
 *
 * Verifies that the helper:
 * 1. Creates a log file at /tmp/{label}.log
 * 2. Returns the CLI output as a string (read from the log file)
 *
 * This imports from tests/e2e/helpers/cli-test-helper-functions.ts.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-72
 */

import * as fs from 'node:fs';

import { describe, it, expect, afterEach } from 'vitest';

import { runCliAndLogOutput } from '../../e2e/helpers/cli-test-helper-functions.js';

const TEST_LOG_FILE = '/tmp/e2e-unit-test.log';

describe('runCliAndLogOutput', () => {
  afterEach(() => {
    // Clean up the test log file if it was created
    if (fs.existsSync(TEST_LOG_FILE)) {
      fs.unlinkSync(TEST_LOG_FILE);
    }
  });

  it('should create log file at /tmp/{label}.log and return its contents', () => {
    // Arrange
    const command = "echo 'here is some test text'";
    const logFileLabel = 'unit-test';

    // Act
    const output = runCliAndLogOutput(command, logFileLabel);

    // Assert - log file was created at the expected path
    expect(fs.existsSync(TEST_LOG_FILE)).toBe(true);

    // Assert - returned string contains the expected output
    expect(output).toContain('here is some test text');
  });

  it('should execute command in the specified working directory', () => {
    // Arrange
    const command = "echo 'here is some test text and here is the output of pwd'; pwd";
    const logFileLabel = 'unit-test';
    const workingDirectory = '/tmp';

    // Act
    const output = runCliAndLogOutput(command, logFileLabel, undefined, workingDirectory);

    // Assert - output contains the test text
    expect(output).toContain('here is some test text and here is the output of pwd');

    // Assert - pwd output shows the working directory was /tmp (resolves to /private/tmp on macOS)
    expect(output).toContain('/tmp');
  });
});

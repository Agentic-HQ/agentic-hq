/**
 * E2E Test: agentic-hq CLI String Reversal
 *
 * Verifies the full end-to-end flow of the agentic-hq CLI:
 * 1. Run: agentic-hq reversal -- --string-to-reverse="<input>"
 * 2. The CLI invokes the skill to get the workflow command
 * 3. The workflow runs and reverses the string via the reverse-a-string command
 * 4. The reversed string appears in stdout
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-56
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, it, expect, beforeEach } from 'vitest';

import { runCliAndLogOutput } from '../helpers/cli-test-helper-functions.js';

const TEST_TIMEOUT_MS = 300_000; // 300s because Claude can be reeeeeeeally slow
const LOG_FILE_LABEL = 'string-reversal';

// Test data constants
const TEST_INPUT_STRING = 'this is a test string';
const EXPECTED_REVERSED_STRING = 'gnirts tset a si siht';

// Path to the ts-workflow's node_modules (deleted before each run for a fresh install)
const TS_WORKFLOW_NODE_MODULES = path.join(
  process.cwd(),
  '.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/node_modules'
);

describe('agentic-hq CLI String Reversal', () => {
  beforeEach(() => {
    // Delete ts-workflow node_modules to ensure fresh pnpm install each run
    fs.rmSync(TS_WORKFLOW_NODE_MODULES, { recursive: true, force: true });
  });

  it(
    'should reverse a string via the agentic-hq CLI workflow',
    () => {
      // Arrange — use `node bin/agentic-hq.cjs` directly (self-contained, no global npm link needed)
      const command = `node bin/agentic-hq.cjs reversal -- --string-to-reverse="${TEST_INPUT_STRING}"`;

      // Act - run the agentic-hq CLI and capture stdout via log file
      const output = runCliAndLogOutput(command, LOG_FILE_LABEL, TEST_TIMEOUT_MS);

      // Assert - verify the reversed string appears in the output
      expect(output).toContain(EXPECTED_REVERSED_STRING);
    },
    TEST_TIMEOUT_MS
  );
});

/**
 * E2E Test: Cross-Workspace Math Workflow via globally-linked agentic-hq binary
 *
 * Verifies that the math workflow (3-step chain: x2, +3, /5) works from a
 * SEPARATE workspace via the globally-linked agentic-hq binary:
 * 1. Setup: Run install-dev-agentic-hq.sh to globally link the binary
 * 2. Setup: Create a temp workspace at /tmp/agentic-hq-test-workspaces/test-ws-{uuid}/
 * 3. Run: agentic-hq math -- --input-number=11
 * 4. Assert: Output contains "Output number: 5" (11 x2=22, +3=25, /5=5)
 * 5. Assert: .agentic-hq/temp/command-input-output-files/ exists with expected output files
 *
 * This proves the math workflow works cross-workspace, following the same pattern
 * as the string-reversal cross-workspace test from AHQ-79.
 *
 * NOTE: The setup code in this test is intentionally duplicated across the 3 cross-workspace
 * e2e tests (string-reversal, math-workflow, quick-jira-workflow). These are demo plugin tests
 * and should remain self-contained for readability by other developers. The tests differ slightly
 * and future tests will likely differ further. See AHQ-82 REFACTOR discussion.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-81
 */

import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, it, expect } from 'vitest';

import { runCliAndLogOutput } from '../helpers/cli-test-helper-functions.js';

const TEST_TIMEOUT_MS = 1000_000; // 1000s: as claude can be really slow.
const INSTALL_SCRIPT_TIMEOUT_MS = 30_000; // 30s for pnpm install + pnpm add -g .
const LOG_FILE_LABEL = 'cross-workspace-math-workflow';
const LOG_FILE_PATH = `/tmp/e2e-${LOG_FILE_LABEL}.log`;

// Test data constants
const TEST_INPUT_NUMBER = 11;
const EXPECTED_OUTPUT_NUMBER = 5; // 11 x2=22, +3=25, /5=5

// Paths
const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const INSTALL_SCRIPT = path.join(REPO_ROOT, 'scripts', 'infra', 'install-dev-agentic-hq.sh');
const TEMP_WORKSPACES_BASE = '/tmp/agentic-hq-test-workspaces';
const IO_FILES_DIR_PREFIX = 'io-files-';
const COMMAND_INPUT_FILENAME = 'command-input.json';
const COMMAND_OUTPUT_FILENAME = 'command-output.json';

describe('Cross-Workspace Math Workflow via globally-linked agentic-hq binary', () => {
  it(
    'should process input number through math workflow from a separate workspace via the globally-linked binary',
    () => {
      // WARNING: This is smelly! pnpm add -g . mutates global pnpm state on
      // your machine. See: https://agentic-hq.atlassian.net/browse/AHQ-79 (Known Smell section)
      process.stdout.write(
        '⚠️  SMELLY: This test runs pnpm add -g . which mutates global pnpm state.\n' +
          '   See: https://agentic-hq.atlassian.net/browse/AHQ-79 (Known Smell section)\n\n'
      );

      // Arrange — run install-dev-agentic-hq.sh to put agentic-hq on PATH
      execSync(`bash ${INSTALL_SCRIPT}`, {
        cwd: REPO_ROOT,
        stdio: 'pipe',
        timeout: INSTALL_SCRIPT_TIMEOUT_MS,
      });

      // Ensure pnpm's global bin directory is on PATH for this process, so the
      // 'agentic-hq' binary registered by pnpm add -g . can be found.
      // pnpm 11 places global binaries in $PNPM_HOME/bin.
      const pnpmHome = process.env.PNPM_HOME ?? path.join(process.env.HOME!, 'Library', 'pnpm');
      const pnpmBinDir = path.join(pnpmHome, 'bin');
      if (!process.env.PATH?.includes(pnpmBinDir)) {
        process.env.PATH = `${pnpmBinDir}:${process.env.PATH}`;
      }

      // Arrange — create a unique temp workspace
      const tempWorkspace = path.join(TEMP_WORKSPACES_BASE, `test-ws-${randomUUID()}`);
      fs.mkdirSync(tempWorkspace, { recursive: true });

      // Act — run agentic-hq from the temp workspace (exactly as a developer would)
      const command = `agentic-hq math -- --input-number=${TEST_INPUT_NUMBER}`;

      let output: string;
      try {
        output = runCliAndLogOutput(command, LOG_FILE_LABEL, TEST_TIMEOUT_MS, tempWorkspace);
      } catch (error) {
        // Check if this is a timeout error (ETIMEDOUT) — likely caused by Claude
        // waiting for permission to use a tool not in ALLOWED_TOOLS
        const isTimeout =
          error instanceof Error &&
          (error.message.includes('ETIMEDOUT') ||
            (error.cause instanceof Error && error.cause.message.includes('ETIMEDOUT')));

        if (isTimeout) {
          process.stdout.write(
            '\n' +
              '╔═══════════════════════════════════════════════════════════════════════════╗\n' +
              '║  🔴 TEST TIMED OUT — LIKELY CAUSE: Claude is waiting for permission      ║\n' +
              '╠═══════════════════════════════════════════════════════════════════════════╣\n' +
              '║                                                                           ║\n' +
              `║  Timeout after: ${TEST_TIMEOUT_MS / 1000} seconds\n` +
              `║  Log file: ${LOG_FILE_PATH}\n` +
              '║                                                                           ║\n' +
              '║  The most likely reason is that Claude Code is waiting for permission     ║\n' +
              '║  to use a tool that is not in the ALLOWED_TOOLS list.                    ║\n' +
              '║                                                                           ║\n' +
              '║  TO FIX: Check src/tools/claude-code/claude-command-builder.ts            ║\n' +
              '║  constant to see if a required tool is missing, then re-run this test.   ║\n' +
              '║                                                                           ║\n' +
              '║  Check the log file for details:                                          ║\n' +
              `║    cat ${LOG_FILE_PATH}\n` +
              '╚═══════════════════════════════════════════════════════════════════════════╝\n' +
              '\n'
          );
        }
        throw error;
      }

      // Assert — expected output number appears in output
      expect(output).toContain(`Output number: ${EXPECTED_OUTPUT_NUMBER}`);

      // Assert — .agentic-hq/temp/command-input-output-files/ was created in the temp workspace
      const commandIoDir = path.join(
        tempWorkspace,
        '.agentic-hq',
        'temp',
        'command-input-output-files'
      );
      expect(fs.existsSync(commandIoDir)).toBe(true);

      // Assert — contains at least one io-files-* subdirectory
      const ioSubdirs = fs
        .readdirSync(commandIoDir)
        .filter((entry) => entry.startsWith(IO_FILES_DIR_PREFIX));
      expect(ioSubdirs.length).toBeGreaterThanOrEqual(1);

      // Assert — the subdirectory contains command-input.json and command-output.json
      const firstIoDir = path.join(commandIoDir, ioSubdirs[0]);
      expect(fs.existsSync(path.join(firstIoDir, COMMAND_INPUT_FILENAME))).toBe(true);
      expect(fs.existsSync(path.join(firstIoDir, COMMAND_OUTPUT_FILENAME))).toBe(true);

      // Log — temp workspace won't be cleaned (auto-cleaned by OS from /tmp)
      process.stdout.write(
        `\nTemp workspace created at: ${tempWorkspace}\n` +
          'Not cleaning up — /tmp is auto-cleaned by the OS (on Mac: reboot or files older than 3 days).\n'
      );
    },
    TEST_TIMEOUT_MS
  );
});

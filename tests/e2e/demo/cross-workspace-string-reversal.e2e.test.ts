/**
 * E2E Test: Cross-Workspace String Reversal via globally-linked agentic-hq binary
 *
 * Verifies that the agentic-hq CLI works from a SEPARATE workspace (not within the repo):
 * 1. Setup: Run install-dev-agentic-hq.sh to globally link the binary
 * 2. Setup: Create a temp workspace at /tmp/agentic-hq-test-workspaces/test-ws-{uuid}/
 * 3. Setup: Run git init in the temp workspace
 * 4. Run: agentic-hq --workflow-command-supplier=... -- --string-to-reverse="cross workspace test"
 * 5. Assert: Output contains the reversed string "tset ecapskrow ssorc"
 * 6. Assert: .agentic-hq/temp/command-input-output-files/ exists with expected output files
 *
 * This proves the "three roots problem" is solved — plugin paths resolve to the agentic-hq
 * workspace while temp/CWD paths resolve to the user's workspace.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-79
 */

import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, it, expect } from 'vitest';

import { runCliAndLogOutput } from '../helpers/cli-test-helper-functions.js';

const TEST_TIMEOUT_MS = 90_000; // 90s per acceptance criteria
const INSTALL_SCRIPT_TIMEOUT_MS = 30_000; // 30s for pnpm install + link --global
const LOG_FILE_LABEL = 'cross-workspace-string-reversal';
const LOG_FILE_PATH = `/tmp/e2e-${LOG_FILE_LABEL}.log`;

// Test data constants
const TEST_INPUT_STRING = 'cross workspace test';
const EXPECTED_REVERSED_STRING = 'tset ecapskrow ssorc';

// Paths
const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const INSTALL_SCRIPT = path.join(REPO_ROOT, 'scripts', 'infra', 'install-dev-agentic-hq.sh');
const TEMP_WORKSPACES_BASE = '/tmp/agentic-hq-test-workspaces';

// Claude Code permissions required for the temp workspace — auto-accepts Write so
// Claude doesn't prompt "Do you want to create command-output.json?" and hang.
const CLAUDE_SETTINGS_PERMISSIONS = {
  permissions: {
    allow: ['Write'],
    deny: [],
    ask: [],
  },
};

describe('Cross-Workspace String Reversal via globally-linked agentic-hq binary', () => {
  it(
    'should reverse a string from a separate workspace via the globally-linked binary',
    () => {
      // ═══════════════════════════════════════════════════════════════════════
      // PREREQUISITE WARNING
      // ═══════════════════════════════════════════════════════════════════════
      // This test runs the agentic-hq binary from a temp workspace under
      // /tmp/agentic-hq-test-workspaces/. Claude Code will show a
      // "Yes, I trust this folder" prompt the first time it sees a new
      // workspace directory. Since /tmp is auto-cleaned by the OS every
      // ~3 days (on Mac), this prompt WILL reappear periodically.
      //
      // If you haven't done this recently, this test WILL time out.
      // ═══════════════════════════════════════════════════════════════════════
      process.stdout.write(
        '\n' +
          '╔═══════════════════════════════════════════════════════════════════════╗\n' +
          '║  ⚠️  PREREQUISITE: Claude Code must trust the temp workspace         ║\n' +
          '╠═══════════════════════════════════════════════════════════════════════╣\n' +
          '║                                                                       ║\n' +
          '║  Before this test can pass, you must MANUALLY open Claude Code in:    ║\n' +
          `║    ${TEMP_WORKSPACES_BASE}/\n` +
          '║  and select "Yes, I trust this folder" when prompted.                 ║\n' +
          '║                                                                       ║\n' +
          '║  WHY: Claude shows a trust prompt for new workspaces. Since /tmp is   ║\n' +
          '║  auto-cleaned by the OS every ~3 days (Mac), this prompt reappears    ║\n' +
          '║  periodically. Each test run creates a new subdirectory with a UUID,  ║\n' +
          '║  so the trust prompt appears for every new subdirectory.              ║\n' +
          '║                                                                       ║\n' +
          '║  Hopefully we will find a better way of doing this in the future.     ║\n' +
          '║  This will be added to the Prerequisites in the README for new users. ║\n' +
          '║                                                                       ║\n' +
          '║  See: https://agentic-hq.atlassian.net/browse/AHQ-79                 ║\n' +
          '╚═══════════════════════════════════════════════════════════════════════╝\n' +
          '\n'
      );

      // WARNING: This is smelly! pnpm link --global mutates global pnpm state on
      // your machine. See: https://agentic-hq.atlassian.net/browse/AHQ-79 (Known Smell section)
      process.stdout.write(
        '⚠️  SMELLY: This test runs pnpm link --global which mutates global pnpm state.\n' +
          '   See: https://agentic-hq.atlassian.net/browse/AHQ-79 (Known Smell section)\n\n'
      );

      // Arrange — run install-dev-agentic-hq.sh to put agentic-hq on PATH
      execSync(`bash ${INSTALL_SCRIPT}`, {
        cwd: REPO_ROOT,
        stdio: 'pipe',
        timeout: INSTALL_SCRIPT_TIMEOUT_MS,
      });

      // Ensure the pnpm global bin directory is on PATH for this process,
      // so the 'agentic-hq' binary installed by pnpm link --global can be found.
      const pnpmHome = process.env.PNPM_HOME ?? path.join(process.env.HOME!, 'Library', 'pnpm');
      if (!process.env.PATH?.includes(pnpmHome)) {
        process.env.PATH = `${pnpmHome}:${process.env.PATH}`;
      }

      // Arrange — create a unique temp workspace
      const tempWorkspace = path.join(TEMP_WORKSPACES_BASE, `test-ws-${randomUUID()}`);
      fs.mkdirSync(tempWorkspace, { recursive: true });

      // Arrange — git init in the temp workspace (so getCurrentWorkspaceRoot() works)
      execSync('git init', { cwd: tempWorkspace, stdio: 'pipe' });

      // Arrange — create .claude/settings.local.json to auto-accept Write permissions.
      // Without this, Claude prompts "Do you want to create command-output.json?" and hangs.
      // See README.md Quick Start section for the minimal permissions required.
      const claudeSettingsDir = path.join(tempWorkspace, '.claude');
      fs.mkdirSync(claudeSettingsDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeSettingsDir, 'settings.local.json'),
        JSON.stringify(CLAUDE_SETTINGS_PERMISSIONS)
      );

      // Act — run agentic-hq from the temp workspace (exactly as a developer would)
      const command = `agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal -- --string-to-reverse="${TEST_INPUT_STRING}"`;

      let output: string;
      try {
        output = runCliAndLogOutput(command, LOG_FILE_LABEL, TEST_TIMEOUT_MS, tempWorkspace);
      } catch (error) {
        // Check if this is a timeout error (ETIMEDOUT) — likely caused by Claude hanging
        // on the "Trust this folder?" prompt
        const isTimeout =
          error instanceof Error &&
          (error.message.includes('ETIMEDOUT') ||
            (error.cause instanceof Error && error.cause.message.includes('ETIMEDOUT')));

        if (isTimeout) {
          process.stdout.write(
            '\n' +
              '╔═══════════════════════════════════════════════════════════════════════╗\n' +
              '║  🔴 TEST TIMED OUT — LIKELY CAUSE: Claude is waiting for input       ║\n' +
              '╠═══════════════════════════════════════════════════════════════════════╣\n' +
              '║                                                                       ║\n' +
              `║  Timeout after: ${TEST_TIMEOUT_MS / 1000} seconds\n` +
              `║  Log file: ${LOG_FILE_PATH}\n` +
              '║                                                                       ║\n' +
              '║  The most likely reason is that Claude Code is showing the            ║\n' +
              '║  "Yes, I trust this folder" prompt for the temp workspace and         ║\n' +
              '║  nobody pressed Enter to accept it.                                   ║\n' +
              '║                                                                       ║\n' +
              '║  TO FIX: Open a terminal, run:                                        ║\n' +
              `║    cd ${TEMP_WORKSPACES_BASE} && claude\n` +
              '║  Then select "Yes, I trust this folder" and press Enter.              ║\n' +
              '║  Then re-run this test.                                               ║\n' +
              '║                                                                       ║\n' +
              '║  Check the log file for details:                                      ║\n' +
              `║    cat ${LOG_FILE_PATH}\n` +
              '╚═══════════════════════════════════════════════════════════════════════╝\n' +
              '\n'
          );
        }
        throw error;
      }

      // Assert — reversed string appears in output
      expect(output).toContain(EXPECTED_REVERSED_STRING);

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
        .filter((entry) => entry.startsWith('io-files-'));
      expect(ioSubdirs.length).toBeGreaterThanOrEqual(1);

      // Assert — the subdirectory contains command-input.json and command-output.json
      const firstIoDir = path.join(commandIoDir, ioSubdirs[0]);
      expect(fs.existsSync(path.join(firstIoDir, 'command-input.json'))).toBe(true);
      expect(fs.existsSync(path.join(firstIoDir, 'command-output.json'))).toBe(true);

      // Log — temp workspace won't be cleaned (auto-cleaned by OS from /tmp)
      process.stdout.write(
        `\nTemp workspace created at: ${tempWorkspace}\n` +
          'Not cleaning up — /tmp is auto-cleaned by the OS (on Mac: reboot or files older than 3 days).\n'
      );
    },
    TEST_TIMEOUT_MS
  );
});

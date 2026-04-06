/**
 * E2E Test: Cross-Workspace `agentic-hq list` via globally-linked agentic-hq binary
 *
 * Verifies that `agentic-hq list` discovers and displays workflows in the new
 * 2-line-per-workflow format when run from a SEPARATE workspace via the
 * globally-linked binary:
 * 1. Setup: Run install-dev-agentic-hq.sh to globally link the binary
 * 2. Setup: Create a temp workspace at /tmp/agentic-hq-test-workspaces/test-ws-{uuid}/
 * 3. Setup: Run git init in the temp workspace
 * 4. Run: agentic-hq list
 * 5. Assert: Output contains `Available workflows:` header
 * 6. Assert: Output contains `create-workflow` (stable core workflow — confirms discovery)
 * 7. Assert: Output contains `What it does: Create` (partial match — confirms new format)
 *
 * This is the e2e-phase RED test for AHQ-104. The current CLI produces the OLD
 * hardcoded aligned format (does NOT contain `What it does:` lines), so the
 * third assertion fails until the GREEN-phase refactor wires in the dynamic
 * discovery subsystem and updates `AhqWorkflowImpl.getWorkflowListingEntryString()`
 * to the new 2-line format.
 *
 * NOTE: The setup code is intentionally duplicated across the cross-workspace
 * e2e tests — see AHQ-82 REFACTOR discussion.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-104
 */

import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, it, expect } from 'vitest';

import { runCliAndLogOutput } from '../helpers/cli-test-helper-functions.js';

const TEST_TIMEOUT_MS = 60_000; // 60s — no Claude invocation, just install script + CLI startup
const INSTALL_SCRIPT_TIMEOUT_MS = 30_000; // 30s for pnpm install + link --global
const LOG_FILE_LABEL = 'cross-workspace-list-workflows';
const LOG_FILE_PATH = `/tmp/e2e-${LOG_FILE_LABEL}.log`;

// Paths
const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const INSTALL_SCRIPT = path.join(REPO_ROOT, 'scripts', 'infra', 'install-dev-agentic-hq.sh');
const TEMP_WORKSPACES_BASE = '/tmp/agentic-hq-test-workspaces';

describe('Cross-Workspace agentic-hq list via globally-linked agentic-hq binary', () => {
  it(
    'should list workflows in the new 2-line format from a separate workspace via the globally-linked binary',
    () => {
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

      // Act — run `agentic-hq list` from the temp workspace (exactly as a developer would)
      const command = 'agentic-hq list';

      let output: string;
      try {
        output = runCliAndLogOutput(command, LOG_FILE_LABEL, TEST_TIMEOUT_MS, tempWorkspace);
      } catch (error) {
        // Check if this is a timeout error (ETIMEDOUT)
        const isTimeout =
          error instanceof Error &&
          (error.message.includes('ETIMEDOUT') ||
            (error.cause instanceof Error && error.cause.message.includes('ETIMEDOUT')));

        if (isTimeout) {
          process.stdout.write(
            '\n' +
              '╔═══════════════════════════════════════════════════════════════════════════╗\n' +
              '║  🔴 TEST TIMED OUT                                                        ║\n' +
              '╠═══════════════════════════════════════════════════════════════════════════╣\n' +
              `║  Timeout after: ${TEST_TIMEOUT_MS / 1000} seconds\n` +
              `║  Log file: ${LOG_FILE_PATH}\n` +
              '║  Check the log file for details:                                          ║\n' +
              `║    cat ${LOG_FILE_PATH}\n` +
              '╚═══════════════════════════════════════════════════════════════════════════╝\n' +
              '\n'
          );
        }
        throw error;
      }

      // Assert — `Available workflows:` header is present (proves CLI ran successfully)
      expect(output).toContain('Available workflows:');

      // Assert — `create-workflow` is present (stable core workflow; confirms discovery ran)
      expect(output).toContain('create-workflow');

      // Assert — `What it does: Create` is present (partial match; confirms new 2-line format
      // is in use and is tied to create-workflow's description, without being brittle to
      // future wording tweaks to the full description)
      expect(output).toContain('What it does: Create');

      // Log — temp workspace won't be cleaned (auto-cleaned by OS from /tmp)
      process.stdout.write(
        `\nTemp workspace created at: ${tempWorkspace}\n` +
          'Not cleaning up — /tmp is auto-cleaned by the OS (on Mac: reboot or files older than 3 days).\n'
      );
    },
    TEST_TIMEOUT_MS
  );
});

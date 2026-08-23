/**
 * E2E Test: Cross-Workspace `agentic-hq list` via globally-linked agentic-hq-dev binary
 *
 * Verifies that `agentic-hq list` discovers and displays workflows when run
 * from a SEPARATE workspace via the globally-linked binary:
 * 1. Precondition: `agentic-hq-dev` is already on PATH (installed via README `npm link`)
 * 2. Setup: Create a temp workspace at /tmp/agentic-hq-test-workspaces/test-ws-{uuid}/
 * 3. Run: agentic-hq-dev list
 * 4. Assert: Output contains `Available workflows` title
 * 5. Assert: Output contains `create-workflow` (stable core workflow — confirms discovery)
 * 6. Assert: Output contains create-workflow's description (confirms it's rendered, not just listed)
 *
 * NOTE: The setup code is intentionally duplicated across the cross-workspace
 * e2e tests — see AHQ-82 REFACTOR discussion.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-104
 */

import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, it, expect } from 'vitest';

import { runCliAndLogOutput } from '../helpers/cli-test-helper-functions.js';

const TEST_TIMEOUT_MS = 60_000; // 60s — no Claude invocation, just CLI startup
const LOG_FILE_LABEL = 'cross-workspace-list-workflows';
const LOG_FILE_PATH = `/tmp/e2e-${LOG_FILE_LABEL}.log`;

// Paths
const TEMP_WORKSPACES_BASE = '/tmp/agentic-hq-test-workspaces';

describe('Cross-Workspace agentic-hq list via globally-linked agentic-hq-dev binary', () => {
  it(
    'should list workflows in the new 2-line format from a separate workspace via the globally-linked binary',
    () => {
      // Precondition: the `agentic-hq-dev` CLI must already be on PATH. Contributor setup
      // links it there via `npm link` (setting-up-agentic-hq-for-development.md step 6) — putting it on PATH is the
      // installer's job, not the test's, so we assert it rather than running `npm link`
      // here. A failure means the documented install step wasn't completed on this machine.
      const pathDirs = (process.env.PATH ?? '').split(path.delimiter);
      const agenticHqDevOnPath = pathDirs.some((dir) =>
        fs.existsSync(path.join(dir, 'agentic-hq-dev'))
      );
      expect(
        agenticHqDevOnPath,
        '`agentic-hq-dev` is not on your PATH. It should have been linked during ' +
          'contributor setup — see docs/dev/setting-up-agentic-hq-for-development.md ' +
          'step 6 (`npm link` from the repo root). Run that, then re-run the e2e ' +
          'tests; if it still fails, see docs/user-docs/troubleshooting.md.'
      ).toBe(true);

      // Arrange — create a unique temp workspace
      const tempWorkspace = path.join(TEMP_WORKSPACES_BASE, `test-ws-${randomUUID()}`);
      fs.mkdirSync(tempWorkspace, { recursive: true });

      // Act — run `agentic-hq-dev list` from the temp workspace (exactly as a developer would)
      const command = 'agentic-hq-dev list';

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

      // Assert — title line is present (proves CLI ran successfully)
      expect(output).toContain('Available workflows');

      // Assert — `create-workflow` is present (stable core workflow; confirms discovery ran)
      expect(output).toContain('create-workflow');

      // Assert — create-workflow's description is shown (confirms the 2-line entry format wires
      // the description in under the command). Asserting on the description text rather than a
      // literal "What it does:" prefix keeps this resilient to UI presentation changes.
      expect(output).toContain('Create a new Agentic HQ workflow');

      // Log — temp workspace won't be cleaned (auto-cleaned by OS from /tmp)
      process.stdout.write(
        `\nTemp workspace created at: ${tempWorkspace}\n` +
          'Not cleaning up — /tmp is auto-cleaned by the OS (on Mac: reboot or files older than 3 days).\n'
      );
    },
    TEST_TIMEOUT_MS
  );
});

/**
 * Integration Test: Kill Script Terminates CLI Process
 *
 * This test verifies that the kill script at:
 *   .agentic-hq/plugins/agentic-hq-core-plugin/skills/self-termination/scripts/kill-current-cli-process-node.cjs
 * correctly terminates the CLI process whose PID it is given via the
 * CLAUDE_PID environment variable (Claude Code >= v2.1.214 stamps its own
 * PID into the environment of every process it spawns — the fixture
 * mimics that).
 *
 * WHY NODE-PTY: We use node-pty to spawn the fixture to match how we'll spawn
 * the real Claude Code CLI in production. This ensures our test validates the
 * same process tree behavior. See:
 * https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/10092545#Additional-Technical-Details-About-PTY
 *
 * TEST APPROACH:
 * - Spawn a fake CLI fixture that runs the kill script with CLAUDE_PID set
 *   to the fixture's own PID
 * - If kill script works: fixture dies immediately, test passes
 * - If kill script fails: fixture hangs forever, test times out and fails
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-211 (CLAUDE_PID port;
 * original bash/$PPID mechanism: https://agentic-hq.atlassian.net/browse/AHQ-21)
 */

import * as path from 'node:path';

import { spawn as spawnPty } from 'node-pty';
import { describe, it, expect } from 'vitest';

/**
 * Conversion factor for seconds to milliseconds.
 */
const MILLISECONDS_PER_SECOND = 1000;

/**
 * Timeout in seconds to wait for the fake CLI to be killed.
 * If the kill script works, it should happen almost instantly.
 * 60 seconds provides a safe margin while still being reasonable for CI
 * (widened from 30 for Windows process-spawn speed — AHQ-211).
 */
const FAKE_CLAUDE_KILL_TIMEOUT_SECONDS = 60;

/**
 * Buffer time (in seconds) added to Vitest test timeout beyond internal timeout.
 * Ensures Vitest doesn't kill the test before our internal timeout handler runs.
 */
const TEST_TIMEOUT_BUFFER_SECONDS = 5;

/**
 * Total Vitest test timeout = internal timeout + buffer.
 */
const WHOLE_TEST_TIMEOUT_SECONDS = FAKE_CLAUDE_KILL_TIMEOUT_SECONDS + TEST_TIMEOUT_BUFFER_SECONDS;

/**
 * Path to the fake CLI fixture
 */
const FIXTURE_PATH = path.join(
  __dirname,
  'fixtures',
  'fake-claude-cli.triggers-kill-script.fixture.ts'
);

/**
 * tsx's real JS entry point (from its package.json "bin"). Spawned as
 * `node <entry>` instead of the `node_modules/.bin/tsx` shim: on Windows
 * that shim is a shell script / .cmd wrapper that ConPTY cannot exec
 * directly (error 193, ERROR_BAD_EXE_FORMAT) — the same D4 rule the
 * production claude resolver follows (AHQ-211).
 */
const TSX_JS_ENTRY = path.join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');

/**
 * Expected exit code when the kill script terminates the fixture:
 * - POSIX: the script sends SIGINT; the fixture's handler exits 130
 *   (128 + signal number 2). Must match SIGINT_EXIT_CODE in the fixture.
 * - Windows: the script's process.kill(pid, 'SIGTERM') is an unconditional
 *   TerminateProcess with exit code 1 — no handler involved.
 *
 * NOTE (Windows): 1 is also what the fixture exits with on an early error,
 * so the exit code alone can't prove a kill there. The startup-message
 * assertion covers that: the fixture prints it only after its error checks
 * pass, and once printed, the only non-timeout way to exit is being killed.
 */
const SIGINT_EXIT_CODE = 130;
const WINDOWS_TERMINATE_PROCESS_EXIT_CODE = 1;
const EXPECTED_KILLED_EXIT_CODE =
  process.platform === 'win32' ? WINDOWS_TERMINATE_PROCESS_EXIT_CODE : SIGINT_EXIT_CODE;

describe('kill-current-cli-process-node.cjs', () => {
  it(
    'should terminate the parent process identified by env:CLAUDE_PID',
    async () => {
      // Arrange
      let output = '';
      let processExited = false;

      // Act - Spawn the fixture using node-pty (matching production behavior)
      const ptyProcess = spawnPty(process.execPath, [TSX_JS_ENTRY, FIXTURE_PATH], {
        name: 'xterm-256color',
        cols: 80,
        rows: 30,
        cwd: process.cwd(),
        env: process.env as Record<string, string>,
      });

      // Collect output for assertions and display
      ptyProcess.onData((data: string) => {
        output += data;
        // Show output to user in real-time (acceptance criteria: show full output)
        process.stdout.write(data);
      });

      // Create a promise that resolves when process exits or times out
      const result = await new Promise<{ timedOut: boolean; exitCode: number | null }>(
        (resolve) => {
          // Set up timeout
          const timeout = setTimeout(() => {
            if (!processExited) {
              console.log(
                `\n[TEST] Timeout after ${FAKE_CLAUDE_KILL_TIMEOUT_SECONDS} seconds - killing fixture`
              );
              ptyProcess.kill();
              resolve({ timedOut: true, exitCode: null });
            }
          }, FAKE_CLAUDE_KILL_TIMEOUT_SECONDS * MILLISECONDS_PER_SECOND);

          // Handle process exit
          ptyProcess.onExit(({ exitCode: code, signal }) => {
            processExited = true;
            clearTimeout(timeout);
            console.log(`\n[TEST] Fixture exited with code: ${code}, signal: ${signal}`);
            resolve({ timedOut: false, exitCode: code });
          });
        }
      );

      // Assert
      console.log('\n[TEST] === Full Output ===');
      console.log(output);
      console.log('[TEST] === End Output ===\n');

      // Test should NOT have timed out
      expect(
        result.timedOut,
        `Test timed out after ${FAKE_CLAUDE_KILL_TIMEOUT_SECONDS} seconds. ` +
          `This means the kill script did not terminate the fixture. Output:\n${output}`
      ).toBe(false);

      // Output should contain the startup message — the fixture prints it
      // only after its early error checks, so an error exit can't fake a
      // kill (see EXPECTED_KILLED_EXIT_CODE note re Windows exit code 1)
      expect(output).toContain("Hi I'm fake-claude-cli.triggers-kill-script.fixture.ts");

      // Verify the kill script terminated the fixture.
      //
      // The original test asserted that a failure message was NOT in the output.
      // This was flaky because of a race condition between the SIGINT handler and
      // the child.on('close') callback — under load, the close callback could fire
      // first and print the message before SIGINT was processed.
      //
      // Exit code is deterministic: on POSIX the SIGINT handler always calls
      // process.exit(130) regardless of callback ordering; on Windows
      // TerminateProcess always reports 1. No race condition possible.
      expect(result.exitCode).toBe(EXPECTED_KILLED_EXIT_CODE);
    },
    WHOLE_TEST_TIMEOUT_SECONDS * MILLISECONDS_PER_SECOND
  );
});

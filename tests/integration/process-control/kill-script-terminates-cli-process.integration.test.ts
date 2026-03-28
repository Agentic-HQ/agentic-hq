/**
 * Integration Test: Kill Script Terminates CLI Process
 *
 * This test verifies that the kill script at:
 *   .agentic-hq/plugins/agentic-hq-core-plugin/skills/self-termination/scripts/kill-current-cli-process.sh
 * correctly terminates its parent process when called with $PPID.
 *
 * WHY NODE-PTY: We use node-pty to spawn the fixture to match how we'll spawn
 * the real Claude Code CLI in production. This ensures our test validates the
 * same process tree behavior. See:
 * https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/10092545#Additional-Technical-Details-About-PTY
 *
 * TEST APPROACH:
 * - Spawn a fake CLI fixture that calls the kill script with $PPID
 * - If kill script works: fixture dies immediately, test passes
 * - If kill script fails: fixture hangs forever, test times out and fails
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-21
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
 * 30 seconds provides a safe margin while still being reasonable for CI.
 */
const FAKE_CLAUDE_KILL_TIMEOUT_SECONDS = 30;

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
 * Standard Unix exit code for SIGINT termination.
 * Convention: 128 + signal number. SIGINT = signal 2, so 128 + 2 = 130.
 * Must match SIGINT_EXIT_CODE in the fixture file:
 *   fixtures/fake-claude-cli.triggers-kill-script.fixture.ts
 */
const SIGINT_EXIT_CODE = 130;

describe('kill-current-cli-process.sh', () => {
  it(
    'should terminate the parent process when called with $PPID',
    async () => {
      // Arrange
      let output = '';
      let processExited = false;

      // Act - Spawn the fixture using node-pty (matching production behavior)
      // Use node_modules/.bin/tsx directly to avoid npx resolution issues in PTY
      const tsxPath = path.join(process.cwd(), 'node_modules', '.bin', 'tsx');
      const ptyProcess = spawnPty(tsxPath, [FIXTURE_PATH], {
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

      // Output should contain the startup message
      expect(output).toContain("Hi I'm fake-claude-cli.triggers-kill-script.fixture.ts");

      // Verify the kill script terminated the fixture via SIGINT.
      //
      // The original test asserted that a failure message was NOT in the output.
      // This was flaky because of a race condition between the SIGINT handler and
      // the child.on('close') callback — under load, the close callback could fire
      // first and print the message before SIGINT was processed.
      //
      // Exit code is deterministic: the SIGINT handler always calls process.exit(130),
      // regardless of callback ordering. No race condition possible.
      expect(result.exitCode).toBe(SIGINT_EXIT_CODE);
    },
    WHOLE_TEST_TIMEOUT_SECONDS * MILLISECONDS_PER_SECOND
  );
});

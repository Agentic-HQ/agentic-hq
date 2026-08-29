#!/usr/bin/env tsx
/**
 * Fake Claude CLI Fixture for Integration Testing
 *
 * This fixture mimics Claude Code's behavior for testing the kill script.
 * It runs the kill script the way Claude Code (>= v2.1.214) would: as a
 * `node` child process with CLAUDE_PID stamped into the child's environment
 * (Claude Code sets CLAUDE_PID to its own PID for every process it spawns —
 * here we stamp our own PID the same way).
 *
 * If the kill script works, this process dies immediately after spawning it.
 * If the kill script fails, this process continues and enters an infinite loop
 * waiting for user input (just like Claude does when waiting for next command),
 * and the integration test times out.
 *
 * HOW DEATH ARRIVES (per platform):
 * - POSIX: the kill script sends SIGINT; the handler below exits 130
 *   (128 + signal number 2), mimicking Claude Code's Ctrl+C behavior.
 * - Windows: the kill script's process.kill(pid, 'SIGTERM') is an
 *   unconditional TerminateProcess — no handler runs, the process just dies
 *   with exit code 1.
 *
 * ============================================================================
 * TO RUN MANUALLY (from project root):
 * ============================================================================
 *
 *   pnpm exec tsx tests/integration/process-control/fixtures/fake-claude-cli.triggers-kill-script.fixture.ts
 *
 * EXPECTED BEHAVIOR:
 *   - If kill script works: Process dies immediately after "Running kill-current-cli-process-node.cjs..."
 *   - If kill script fails: You'll see "If you see this then the kill script didn't work"
 *     and the process will hang waiting for input (Ctrl+C to exit)
 * ============================================================================
 *
 * Used by: tests/integration/process-control/kill-script-terminates-cli-process.integration.test.ts
 * See: https://agentic-hq.atlassian.net/browse/AHQ-211 (CLAUDE_PID port; original
 * bash/$PPID mechanism: https://agentic-hq.atlassian.net/browse/AHQ-21)
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

/**
 * Standard Unix exit code for SIGINT termination.
 * Convention: 128 + signal number. SIGINT = signal 2, so 128 + 2 = 130.
 */
const SIGINT_EXIT_CODE = 130;

/**
 * Handle SIGINT (Ctrl+C / kill -INT) by exiting immediately.
 * This mimics how Claude Code CLI responds to SIGINT - it terminates.
 * POSIX-only in practice: on Windows the kill script's SIGTERM is an
 * unconditional TerminateProcess, so no handler ever runs there.
 *
 * WHY THIS IS NEEDED:
 * Node.js processes signals asynchronously via the event loop. When the kill
 * script sends SIGINT to this process, Node queues the signal to be processed
 * on the next event loop tick. Without this handler, Node's default behavior
 * would eventually terminate the process, but not immediately enough - code
 * after the spawn() call could execute before the signal is processed.
 *
 * This explicit handler ensures we exit immediately when SIGINT is received,
 * matching how the real Claude Code CLI behaves.
 */
process.on('SIGINT', () => {
  process.exit(SIGINT_EXIT_CODE);
});

/**
 * Get current timestamp with milliseconds for logging
 */
function timestamp(): string {
  return new Date().toISOString();
}

/**
 * Path to the kill script (resolved dynamically from project root)
 */
const KILL_SCRIPT_PATH = path.join(
  process.cwd(),
  '.agentic-hq',
  'plugins',
  'agentic-hq-core-plugin',
  'skills',
  'self-termination',
  'scripts',
  'kill-current-cli-process-node.cjs'
);

// Validate script exists before attempting to call it.
// DELIBERATELY BEFORE the startup message: on Windows the expected
// "killed" exit code (1, TerminateProcess) is indistinguishable from an
// error exit, so the test tells them apart by the startup message — an
// early error exit must not print it.
if (!existsSync(KILL_SCRIPT_PATH)) {
  console.error(`${timestamp()} - ERROR: Kill script not found at ${KILL_SCRIPT_PATH}`);
  console.error(`${timestamp()} - Current working directory: ${process.cwd()}`);
  process.exit(1);
}

// Step 1: Print startup message
console.log(`${timestamp()} - Hi I'm fake-claude-cli.triggers-kill-script.fixture.ts`);

// Step 2: Print message before calling kill script
console.log(
  `${timestamp()} - Running kill-current-cli-process-node.cjs which should kill me immediately...`
);

// Step 3: Run the kill script as `node <script>` with CLAUDE_PID stamped
// into the child's environment — exactly how Claude Code (>= v2.1.214)
// spawns it via the Self Termination skill. The script reads CLAUDE_PID
// and signals that process (us).
//
// ============================================================================
// CRITICAL: WHY WE USE spawn() NOT spawnSync()
// ============================================================================
// The original implementation used spawnSync(), which BLOCKED the Node.js event
// loop. This caused the test to fail even though the kill script worked correctly:
//
// With spawnSync (BROKEN):
//   1. spawnSync() starts the kill-script child process
//   2. Kill script runs, sends SIGINT to this process (via CLAUDE_PID)
//   3. SIGINT is QUEUED because event loop is blocked by spawnSync
//   4. spawnSync() returns after the child exits
//   5. Code continues to "If you see this..." line
//   6. Event loop resumes, SIGINT handler finally runs
//   7. Process exits - but too late, failure message already printed!
//
// With spawn (CORRECT):
//   1. spawn() starts the kill-script child process (non-blocking)
//   2. Event loop continues running
//   3. Kill script runs, sends SIGINT to this process
//   4. SIGINT is processed IMMEDIATELY by event loop
//   5. SIGINT handler runs, process.exit(130) called
//   6. Process exits BEFORE the child.on('close') callback runs
//
// The real Claude Code CLI doesn't block on child processes, so it receives
// and processes SIGINT immediately. Our fixture must do the same.
// (On Windows the ordering question doesn't arise — TerminateProcess kills
// us regardless of what the event loop is doing.)
// ============================================================================
const child = spawn(process.execPath, [KILL_SCRIPT_PATH], {
  stdio: 'inherit', // Pass through all output so test can see kill script's messages
  env: { ...process.env, CLAUDE_PID: String(process.pid) },
});

// ==============================================================================
// SIGNAL DELIVERY GRACE PERIOD (cosmetic only)
// ==============================================================================
// A race condition in this test was fixed by asserting on exit code
// instead of output — exit code is deterministic regardless of callback order.
// This 1-second timeout just prevents a confusing "didn't work" message on
// stdout; if it fires (extreme load >1s), the test still passes.
//
// Without it, under system load the child.on('close') callback can fire before
// the SIGINT handler and print the failure message — even though SIGINT is
// pending and will arrive moments later. The delay gives the already-pending
// SIGINT time to be processed. If SIGINT fires during the wait, process.exit(130)
// kills everything and this callback never runs.
// ==============================================================================
/**
 * Grace period (in milliseconds) before printing the failure message.
 * Cosmetic only — suppresses misleading output when the close callback
 * fires before the SIGINT handler under system load.
 */
const SIGNAL_DELIVERY_GRACE_PERIOD_MS = 1000;

child.on('close', (code) => {
  setTimeout(() => {
    // Step 4: If we get here, the kill script genuinely didn't work —
    // no signal ever arrived even after the grace period.
    console.log(
      `${timestamp()} - Finished running kill-current-cli-process-node.cjs If you see this then the kill script didn't work :-(`
    );
    console.log(`${timestamp()} - Kill script exit code: ${code}`);

    // Step 5: Enter infinite loop waiting for input (like Claude does)
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    function promptForever(): void {
      console.log(
        `${timestamp()} - Now I'm going to sit here for ever waiting for you to type a prompt (which I'll ignore because I'm a Fake Claude!):`
      );

      rl.question('> ', (answer) => {
        console.log(
          `${timestamp()} - I'm a Fake Claude so I'm going to ignore your prompt "${answer}" and loop back round to ask you again... :)`
        );
        promptForever();
      });
    }

    promptForever();
  }, SIGNAL_DELIVERY_GRACE_PERIOD_MS);
});

#!/usr/bin/env tsx
/**
 * Fake Claude CLI Fixture for Integration Testing
 *
 * This fixture mimics Claude Code's behavior for testing the kill script.
 * It calls the kill script with $PPID, which should terminate this process.
 * If the kill script works, this process dies immediately after calling it.
 * If the kill script fails, this process continues and enters an infinite loop
 * waiting for user input (just like Claude does when waiting for next command).
 *
 * ============================================================================
 * TO RUN MANUALLY (from project root):
 * ============================================================================
 *
 *   pnpm exec tsx tests/integration/process-control/fixtures/fake-claude-cli.triggers-kill-script.fixture.ts
 *
 * EXPECTED BEHAVIOR:
 *   - If kill script works: Process dies immediately after "Calling kill-current-cli-process.sh..."
 *   - If kill script fails: You'll see "If you see this then the kill script didn't work"
 *     and the process will hang waiting for input (Ctrl+C to exit)
 *
 * NOTE: During RED phase TDD, the kill script is disabled, so the fixture will NOT be killed.
 * ============================================================================
 *
 * Used by: tests/integration/process-control/kill-script-terminates-cli-process.integration.test.ts
 * See: https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/10092545/AHQ-21+-+Create+Integration+Test+for+Unix+CLI+Process+Kill+Script
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
  'kill-current-cli-process.sh'
);

// Validate script exists before attempting to call it
if (!existsSync(KILL_SCRIPT_PATH)) {
  console.error(`${timestamp()} - ERROR: Kill script not found at ${KILL_SCRIPT_PATH}`);
  console.error(`${timestamp()} - Current working directory: ${process.cwd()}`);
  process.exit(1);
}

// Step 1: Print startup message
console.log(`${timestamp()} - Hi I'm fake-claude-cli.triggers-kill-script.fixture.ts`);

// Step 2: Print message before calling kill script
console.log(
  `${timestamp()} - Calling kill-current-cli-process.sh which should kill me immediately...`
);

// Step 3: Call the kill script with $PPID
// Using bash -c to ensure $PPID is expanded by the shell to the parent process ID
// This matches how Claude Code would invoke the script
//
// ============================================================================
// CRITICAL: WHY WE USE spawn() NOT spawnSync()
// ============================================================================
// The original implementation used spawnSync(), which BLOCKED the Node.js event
// loop. This caused the test to fail even though the kill script worked correctly:
//
// With spawnSync (BROKEN):
//   1. spawnSync() starts bash child process
//   2. Kill script runs, sends SIGINT to this process (the parent)
//   3. SIGINT is QUEUED because event loop is blocked by spawnSync
//   4. spawnSync() returns after bash exits
//   5. Code continues to "If you see this..." line
//   6. Event loop resumes, SIGINT handler finally runs
//   7. Process exits - but too late, failure message already printed!
//
// With spawn (CORRECT):
//   1. spawn() starts bash child process (non-blocking)
//   2. Event loop continues running
//   3. Kill script runs, sends SIGINT to this process
//   4. SIGINT is processed IMMEDIATELY by event loop
//   5. SIGINT handler runs, process.exit(130) called
//   6. Process exits BEFORE the child.on('close') callback runs
//
// The real Claude Code CLI doesn't block on child processes, so it receives
// and processes SIGINT immediately. Our fixture must do the same.
// ============================================================================
const child = spawn('bash', ['-c', `${KILL_SCRIPT_PATH} $PPID`], {
  stdio: 'inherit', // Pass through all output so test can see kill script's messages
});

child.on('close', (code) => {
  // Step 4: If we get here, the kill script didn't work!
  // (The SIGINT handler should have terminated us before this callback runs)
  console.log(
    `${timestamp()} - Finished calling kill-current-cli-process.sh If you see this then the kill script didn't work :-(`
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
});

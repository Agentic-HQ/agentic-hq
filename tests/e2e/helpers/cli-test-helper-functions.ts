/**
 * Helper functions used in e2e tests that invoke CLI commands.
 *
 * Provides utilities for running CLI commands.
 * For example redirecting output to log files during tests and
 * printing visible banners telling humans how they can
 * monitor long-running tests via `tail -f`
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// The OS temp dir, not a hardcoded /tmp: /tmp does not exist on Windows, and
// even on macOS it is a symlink os.tmpdir() sidesteps (AHQ-211)
const LOG_FILE_DIRECTORY = os.tmpdir();
const LOG_FILE_PREFIX = 'e2e-';
const LOG_FILE_EXTENSION = '.log';
const LOG_FILE_ENCODING = 'utf-8' as const;

const BOLD_RED = '\x1b[1;31m';
const RESET = '\x1b[0m';
const SEPARATOR = '════════════════════════════════════════════════════════════';

/**
 * The log file path runCliAndLogOutput() will write for a given label.
 *
 * Exported so tests that mention the log file in their own output (e.g.
 * timeout diagnostic banners) name the file the helper ACTUALLY writes —
 * before AHQ-211 they hardcoded `/tmp/e2e-<label>.log`, which was wrong on
 * Windows (no /tmp) and stale on macOS (os.tmpdir() is /var/folders/…).
 */
export function getLogFilePath(logFileLabel: string): string {
  return path.join(LOG_FILE_DIRECTORY, `${LOG_FILE_PREFIX}${logFileLabel}${LOG_FILE_EXTENSION}`);
}

/**
 * Prints a bold red banner to stdout showing the log file path and tail -f command.
 *
 * Uses `process.stdout.write()` instead of `console.log()` because console.log
 * stops working after a node-pty PTY execution (vitest intercepts it and the
 * PTY spawn breaks that interception).
 */
function printBanner(logFile: string): void {
  process.stdout.write(`\n${BOLD_RED}${SEPARATOR}${RESET}\n`);
  process.stdout.write(`${BOLD_RED}  Log: ${logFile}${RESET}\n`);
  process.stdout.write(`${BOLD_RED}  Watch: tail -f ${logFile}${RESET}\n`);
  process.stdout.write(`${BOLD_RED}${SEPARATOR}${RESET}\n\n`);
}

/**
 * Runs a CLI command, redirecting stdout and stderr to a log file.
 *
 * Creates a log file at `<os.tmpdir()>/e2e-{logFileLabel}.log`, prints a bold
 * red banner showing the log file path and tail -f command, executes the
 * command with output redirected to that file, and returns the log file
 * contents.
 *
 * @param command - The shell command to execute
 * @param logFileLabel - Label used to name the log file (e.g. 'unit-test' → `<os.tmpdir()>/e2e-unit-test.log`)
 * @param timeoutMs - Optional timeout in milliseconds for the command
 * @param workingDirectory - Optional working directory for command execution (defaults to process.cwd())
 * @returns The contents of the log file after command execution
 * @throws Error with the log file path (not contents) and the original error as `cause`
 */
export function runCliAndLogOutput(
  command: string,
  logFileLabel: string,
  timeoutMs?: number,
  workingDirectory?: string
): string {
  const logFile = getLogFilePath(logFileLabel);
  printBanner(logFile);
  const logFd = fs.openSync(logFile, 'w');
  try {
    execSync(command, {
      cwd: workingDirectory ?? process.cwd(),
      timeout: timeoutMs,
      stdio: ['pipe', logFd, logFd],
    });
  } catch (error) {
    throw new Error(`CLI command failed. Log file: ${logFile}`, { cause: error });
  } finally {
    fs.closeSync(logFd);
  }
  return fs.readFileSync(logFile, LOG_FILE_ENCODING);
}

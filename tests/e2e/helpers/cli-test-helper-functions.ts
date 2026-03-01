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
import * as path from 'node:path';

const LOG_FILE_DIRECTORY = '/tmp';
const LOG_FILE_PREFIX = 'e2e-';
const LOG_FILE_EXTENSION = '.log';
const LOG_FILE_ENCODING = 'utf-8' as const;

const BOLD_RED = '\x1b[1;31m';
const RESET = '\x1b[0m';
const SEPARATOR = '════════════════════════════════════════════════════════════';

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
 * Creates a log file at `/tmp/e2e-{logFileLabel}.log`, prints a bold red banner
 * showing the log file path and tail -f command, executes the command with output
 * redirected to that file, and returns the log file contents.
 *
 * @param command - The shell command to execute
 * @param logFileLabel - Label used to name the log file (e.g. 'unit-test' → `/tmp/e2e-unit-test.log`)
 * @param timeoutMs - Optional timeout in milliseconds for the command
 * @returns The contents of the log file after command execution
 * @throws Error with the log file path (not contents) and the original error as `cause`
 */
export function runCliAndLogOutput(
  command: string,
  logFileLabel: string,
  timeoutMs?: number
): string {
  const logFile = path.join(
    LOG_FILE_DIRECTORY,
    `${LOG_FILE_PREFIX}${logFileLabel}${LOG_FILE_EXTENSION}`
  );
  printBanner(logFile);
  const logFd = fs.openSync(logFile, 'w');
  try {
    execSync(command, {
      cwd: process.cwd(),
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

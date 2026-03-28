/**
 * PtyCLIWrapper — PTY process management and CLI wrapper.
 *
 * SRP Does: Spawn processes via pseudo-terminal (PTY) with full stdin/stdout
 * passthrough, handle terminal resizing, forward control signals, and manage
 * graceful termination. Implements the CLIWrapper interface.
 *
 * SRP Knows About: PTY creation (via node-pty), stdin/stdout passthrough,
 * signal forwarding, terminal resize handling. Exists because some CLIs
 * (like Claude) produce no output unless isatty() returns true.
 *
 * SRP Knows Nothing About: What's being run or why — just spawns
 * whatever cliCommand it's given in the provided working directory.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-56 (extracted during REFACTOR phase)
 */

import { spawn as spawnPty, type IPty } from 'node-pty';

import type { CLICommand } from '../../interfaces/cli-command.js';
import type { CLIWrapper } from '../../interfaces/cli-wrapper.js';

// PTY terminal configuration
const PTY_TERMINAL_TYPE = 'xterm-256color';
const DEFAULT_TERMINAL_COLUMNS = 80;
const DEFAULT_TERMINAL_ROWS = 30;
const EXIT_CODE_SUCCESS = 0;

export class PtyCLIWrapper implements CLIWrapper {
  /**
   * Spawn a process via PTY with full stdin/stdout passthrough.
   *
   * Creates a pseudo-terminal so the spawned process thinks it's in a real
   * terminal (isatty() returns true). Each step is delegated to a private
   * method so this reads like a table of contents.
   */
  async run(cliCommand: CLICommand, currentWorkingDirectory: string): Promise<void> {
    cliCommand.logDebug();
    const ptyProcess = this.spawnPtyWithTerminalSize(cliCommand, currentWorkingDirectory);
    this.streamPtyOutputToStdout(ptyProcess);

    // Guard required: setRawMode() crashes with "Raw mode is not supported" in non-TTY environments (tests, CI)
    if (this.terminalIsInteractive()) {
      this.pipeStdinToPtyInRawMode(ptyProcess);
    }

    await this.waitForPtyExitAndCleanup(ptyProcess);
  }

  /**
   * Detect terminal size, spawn a PTY process, and wire up resize forwarding.
   *
   * Falls back to 80×30 when stdout has no column/row info (e.g. in CI).
   * Attaches a resize listener so the PTY tracks the real terminal size.
   */
  private spawnPtyWithTerminalSize(cliCommand: CLICommand, currentWorkingDirectory: string): IPty {
    const cols = process.stdout.columns || DEFAULT_TERMINAL_COLUMNS;
    const rows = process.stdout.rows || DEFAULT_TERMINAL_ROWS;

    const ptyProcess: IPty = spawnPty(cliCommand.executable, cliCommand.args, {
      name: PTY_TERMINAL_TYPE,
      cols,
      rows,
      cwd: currentWorkingDirectory,
      env: process.env as Record<string, string>,
      handleFlowControl: true,
    });

    // Forward terminal resize events so the PTY stays in sync
    process.stdout.on('resize', () => {
      ptyProcess.resize(process.stdout.columns || cols, process.stdout.rows || rows);
    });

    return ptyProcess;
  }

  /**
   * Stream all PTY output (text + ANSI escape codes) to stdout.
   */
  private streamPtyOutputToStdout(ptyProcess: IPty): void {
    ptyProcess.onData((terminalOutput: string) => {
      process.stdout.write(terminalOutput);
    });
  }

  /**
   * Whether stdin is an interactive terminal (TTY).
   *
   * When false (automated tests, CI, piped stdin), setRawMode() throws
   * "Raw mode is not supported on the current process.stdin". All raw-mode
   * operations must be guarded by this check.
   */
  private terminalIsInteractive(): boolean {
    return !!process.stdin.isTTY;
  }

  /**
   * Pipe stdin to the PTY in raw mode so every keystroke is forwarded.
   *
   * Raw mode disables line buffering — Ctrl-C (0x03) and Ctrl-D (0x04) reach
   * the spawned process directly, allowing natural interactive use.
   * Caller must guard with `terminalIsInteractive()` before calling this.
   */
  private pipeStdinToPtyInRawMode(ptyProcess: IPty): void {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (data: Buffer) => {
      ptyProcess.write(data.toString());
    });
  }

  /**
   * Wait for the PTY process to exit, then restore terminal state.
   *
   * Registers SIGINT/SIGTERM handlers so external signals (e.g. `kill`,
   * kill-current-cli-process.sh) trigger graceful cleanup. On normal exit
   * the handlers are removed and terminal state (raw mode, resize listener)
   * is restored.
   */
  private waitForPtyExitAndCleanup(ptyProcess: IPty): Promise<void> {
    // Restore terminal state: disable raw mode, stop resize forwarding
    const cleanup = () => {
      process.stdout.removeAllListeners('resize');
      if (this.terminalIsInteractive()) {
        process.stdin.setRawMode(false);
        process.stdin.pause();
      }
    };

    // Graceful cleanup on external signals (rarely triggered by the user
    // since raw mode forwards Ctrl-C to the spawned process, not here)
    const signalCleanup = () => {
      cleanup();
      ptyProcess.kill();
      process.exit(EXIT_CODE_SUCCESS);
    };
    process.once('SIGINT', signalCleanup);
    process.once('SIGTERM', signalCleanup);

    return new Promise<void>((resolve) => {
      ptyProcess.onExit(() => {
        cleanup();
        process.removeListener('SIGINT', signalCleanup);
        process.removeListener('SIGTERM', signalCleanup);
        resolve();
      });
    });
  }
}

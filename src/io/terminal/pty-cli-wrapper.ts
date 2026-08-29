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
 *
 * REFACTOR LATER: During AHQ=211 work Steve noticed this PtyCLIWrapper class is not very readable
 * and contains a bunch of private interfaces, and WindowsPtyAgentInternals which contains a bunch
 * of options that I don't understand and find it hard to work out what they are for.  This should be
 * refactored later to follow the patterns of this project where **every** element has its own interface
 * e.g. UseConPtyOption and concrete type e.g. DefaultUseConPtyOption which self documents what it
 * is in it's header.  These should all be in their own directory (interfaces under src/interfaces/pty)
 * so they don't clutter up the main system source directories.  Behaviour should be "pushed" onto
 * whatever concrete classes are created, where appropriate, so the current class doesn't become
 * a big dumping ground for pty related behaviour.  Once this is done, hopefully this class
 * will be much easier to understand and the
 * disposeExitedPty method (which seems to exist purely to work around a bug on Windows?)
 * will be easier for me to understand as it will fit within a type/class
 * structure.  Not doing now as too time consuming, and this project / class hasn't yet "earnt"
 * this level of refactoring work and improvement (and this class is fairly well self contained
 * and so doesn't make the whole project hard to understand).  If AHQ becomes popular and used
 * a lot this kind of refactor can be done then.
 */

import { spawn as spawnPty, type IPty } from 'node-pty';

import type { CLICommand } from '../../interfaces/cli-command.js';
import type { CLIWrapper } from '../../interfaces/cli-wrapper.js';

/**
 * The node-pty WindowsPtyAgent internals that disposeExitedPty() reaches
 * into. Private API — acceptable only because node-pty is pinned to an
 * exact version (see package.json) and upgraded manually after review.
 */
interface WindowsPtyAgentInternals {
  _useConpty: boolean;
  _useConptyDll: boolean;
  _inSocket: { readable: boolean };
  _outSocket: { readable: boolean };
  _ptyNative: { kill: (pty: number, useConptyDll: boolean) => void };
  _pty: number;
  _conoutSocketWorker: { dispose: () => void };
}

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
      // Sets TERM for the child on POSIX; ConPTY ignores it on Windows
      // (harmless — reviewed for AHQ-211 Phase 4)
      name: PTY_TERMINAL_TYPE,
      cols,
      rows,
      cwd: currentWorkingDirectory,
      env: process.env as Record<string, string>,
      // XON/XOFF pause handling in node-pty's JS write path —
      // platform-neutral, works the same under ConPTY (reviewed for AHQ-211)
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
   * Registers signal handlers so external signals (e.g. `kill`, the
   * self-termination kill script) trigger graceful cleanup. On normal exit
   * the handlers are removed, terminal state (raw mode, resize listener) is
   * restored, and the pty itself is killed/disposed.
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
    // since raw mode forwards Ctrl-C to the spawned process, not here).
    // SIGTERM is POSIX-only: Windows never delivers SIGTERM to a JS handler
    // — process.kill(pid, 'SIGTERM') terminates the process unconditionally
    // there (which the AHQ-211 self-termination design relies on), so a
    // listener would be dead code (AHQ-211 Phase 4).
    const signalCleanup = () => {
      cleanup();
      ptyProcess.kill();
      process.exit(EXIT_CODE_SUCCESS);
    };
    const cleanupSignals: NodeJS.Signals[] =
      process.platform === 'win32' ? ['SIGINT'] : ['SIGINT', 'SIGTERM'];
    for (const signal of cleanupSignals) {
      process.once(signal, signalCleanup);
    }

    return new Promise<void>((resolve) => {
      ptyProcess.onExit(() => {
        cleanup();
        for (const signal of cleanupSignals) {
          process.removeListener(signal, signalCleanup);
        }
        this.disposeExitedPty(ptyProcess);
        resolve();
      });
    });
  }

  /**
   * Dispose a pty whose child has ALREADY exited. Required because on
   * Windows the ConPTY agent connection otherwise keeps this Node process
   * alive after the child has exited (observed on Windows 11, AHQ-211
   * Phase 4).
   *
   * On win32 + ConPTY this must not go through node-pty's kill(): kill()
   * forks a conpty_console_list_agent helper to sweep console processes
   * that outlive a LIVE pty (Microsoft/vscode#26807) — but the console died
   * with the child, so AttachConsole fails and the helper crashes with a
   * noisy stderr trace (observed at the end of the otherwise-clean
   * 2026-08-27 Windows demo run; exit code unaffected). No such survivors
   * can exist here, so perform kill()'s remaining cleanup directly — mark
   * the sockets unreadable, release the native ConPTY handle, dispose the
   * conout worker thread (the parts that end the keep-alive) — and skip the
   * fork. Reaching into node-pty internals is acceptable only because
   * node-pty is exact-pinned (see package.json) and upgraded manually.
   */
  private disposeExitedPty(ptyProcess: IPty): void {
    const agent = (ptyProcess as unknown as { _agent?: WindowsPtyAgentInternals })._agent;
    if (
      process.platform === 'win32' &&
      agent !== undefined &&
      agent._useConpty &&
      !agent._useConptyDll
    ) {
      agent._inSocket.readable = false;
      agent._outSocket.readable = false;
      agent._ptyNative.kill(agent._pty, agent._useConptyDll);
      agent._conoutSocketWorker.dispose();
      return;
    }
    // POSIX (kill() swallows ESRCH on dead pids), the legacy winpty backend
    // and the conpty.dll backend are all quiet through plain kill().
    ptyProcess.kill();
  }
}

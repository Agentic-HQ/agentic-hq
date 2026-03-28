/**
 * CLIWrapper — Manages the full lifecycle of a CLI process.
 *
 * SRP Does: Process lifecycle management — start the process, handle
 * terminal resizing, forward control signals (SIGINT, SIGTERM, etc.),
 * and manage graceful termination.
 *
 * SRP Knows About: The contract for spawning and waiting on a process
 * given a CLICommand and working directory.
 *
 * SRP Knows Nothing About: What the process does, what flags it needs,
 * or where its I/O lives.
 */
import type { CLICommand } from './cli-command.js';

export interface CLIWrapper {
  /** Spawn a CLI process and wait for it to complete */
  run(command: CLICommand, currentWorkingDirectory: string): Promise<void>;
}

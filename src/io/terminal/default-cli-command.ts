/**
 * DefaultCLICommand — Default implementation of CLICommand.
 *
 * SRP Does: Carry the executable and args for a CLI invocation, provide
 * a human-readable string representation, and log itself for debugging
 * with ANSI terminal formatting.
 *
 * SRP Knows About: Its own data (executable + args), how to format
 * itself as a string, and ANSI escape codes for debug output.
 *
 * SRP Knows Nothing About: How the command was built, where it will
 * be executed, or how I/O is marshalled.
 */
import type { CLICommand } from '../../interfaces/cli-command.js';

// ANSI escape codes for terminal styling (used for debug logging)
const ANSI_BOLD = '\x1b[1m';
const ANSI_BRIGHT_MAGENTA = '\x1b[95m';
const ANSI_RESET = '\x1b[0m';

export class DefaultCLICommand implements CLICommand {
  constructor(
    readonly executable: string,
    readonly args: string[]
  ) {}

  logDebug(): void {
    console.log(`${ANSI_BOLD}${ANSI_BRIGHT_MAGENTA}[CLICommand] Running: ${this}${ANSI_RESET}`);
  }

  toString(): string {
    const quotedArgs = this.args.map((a) => `"${a}"`).join(' ');
    return `${this.executable} ${quotedArgs}`;
  }
}

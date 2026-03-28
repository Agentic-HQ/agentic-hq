/**
 * CLICommand — The tool-specific parts of a CLI invocation.
 *
 * SRP Does: Data transfer object. Carries the executable and args that
 * are specific to a particular AI tool (e.g., Claude's plugin flags,
 * Codex's model flags).
 *
 * SRP Knows About: The shape of a tool-specific command (executable + args).
 *
 * SRP Knows Nothing About: The working directory (that's an orchestration
 * concern), I/O marshalling, or process spawning. No behaviour, no logic.
 */
export interface CLICommand {
  /** Executable to spawn (e.g., 'claude', 'codex') */
  executable: string;
  /** Arguments specific to the AI tool (e.g., ['--plugin-dir=...', '<command>', '<marshallingId>']) */
  args: string[];
  /** Log the command for debugging (formatted for terminal) */
  logDebug(): void;
}

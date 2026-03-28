/**
 * Tool - Interface for executing commands via an AI tool.
 *
 * Current implementation uses Claude Code CLI with file-based I/O.
 * Alternative implementations could use different AI tools, local models,
 * remote API calls, etc.
 */
export interface Tool {
  /** Execute a command with input and return the output string */
  execute(command: string, input: string): Promise<string>;
}

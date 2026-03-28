/**
 * MarshalledIOCLICommandBuilder — Builds tool-specific CLI commands
 * for tools that use marshalled I/O (like MarshalledCLITool).
 *
 * The build() method takes a marshallingId because this builder is
 * specifically for tools whose I/O is marshalled via an external
 * session (e.g. temp files).  A tool that reads stdin/stdout directly
 * would not need a marshalling ID and would use a different builder
 * interface.
 *
 * SRP Does: Translate a generic tool command string and marshalling ID
 * into the executable + flags needed by a specific AI tool.
 *
 * SRP Knows About: One tool's CLI interface (flags, plugin dirs,
 * permissions, argument ordering).
 *
 * SRP Knows Nothing About: I/O marshalling, process spawning, or where
 * the user's project lives.
 */
import type { CLICommand } from './cli-command.js';

export interface MarshalledIOCLICommandBuilder {
  /** Build a CLI command from an AI tool command string and marshalling session ID */
  build(aiToolCommand: string, marshallingId: string): CLICommand;
}

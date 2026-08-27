/**
 * IOMarshallerSession — A single marshalling session for one tool execution.
 *
 * SRP Does: Read and write command data within one execution session.
 * Initializes itself when created with a unique identity (GUID).
 *
 * SRP Knows About: The contract for storing input and retrieving output
 * for its own session (getMarshallingId, write, readCommandOutput,
 * readSkillOutput). Which read runs is decided statically by the caller:
 * command steps read their output string; the workflow-launch hop reads
 * the typed skill handshake (AHQ-210/AHQ-211 D1). Both reads consume the
 * same transport (for a file marshaller, command-output.json).
 *
 * SRP Knows Nothing About: What tool is being run, how the CLI process
 * is spawned, or where the user's project lives.
 */
import type { SkillOutput } from './skill-output.js';

export interface IOMarshallerSession {
  /**
   * Returns the opaque identifier for this session.
   * For a file marshaller, this is the temp directory path.
   * For a DB marshaller, this would be the record/row ID.
   */
  getMarshallingId(): string;

  /** Write the command input for this session */
  write(input: string): void;

  /** Read a command step's output string for this session */
  readCommandOutput(): string;

  /** Read the workflow-launch handshake for this session — fail fast if it isn't one */
  readSkillOutput(): SkillOutput;
}

/**
 * JsonFileIOMarshallerSession — A marshalling session that stores
 * command I/O as JSON files in a temp directory.
 *
 * SRP Does: For one execution session, generate a GUID, create a temp
 * directory, write command-input.json, read command-output.json.
 *
 * SRP Knows About: File-system I/O, JSON serialization, temp directory
 * layout, the command-input/output file naming convention.
 *
 * SRP Knows Nothing About: What tool produces the output, how the CLI
 * process is spawned, or where the user's project lives.
 */
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import type { IOMarshallerSession } from '../../interfaces/io-marshaller-session.js';

const COMMAND_IO_DIRECTORY_NAME = 'command-input-output-files';
const COMMAND_INPUT_FILENAME = 'command-input.json';
const COMMAND_OUTPUT_FILENAME = 'command-output.json';
const COMMAND_INPUT_STRING_KEY = 'command-input-string';
const COMMAND_OUTPUT_STRING_KEY = 'command-output-string';
const IO_FILES_PREFIX = 'io-files-';
const JSON_INDENT_SPACES = 2;
const TIMESTAMP_FORMAT_LENGTH = 19; // Length of "2026-01-31_15-13-21"

export class JsonFileIOMarshallerSession implements IOMarshallerSession {
  private readonly uniqueSessionDirectoryPath: string;

  constructor(tempDir: string) {
    this.uniqueSessionDirectoryPath = this.buildUniqueSessionDirectoryPath(tempDir);
  }

  /** Build path: temp/command-input-output-files/io-files-<timestamp>_<uuid> */
  private buildUniqueSessionDirectoryPath(tempDir: string): string {
    const timestamp = this.getTimestamp();
    const uniqueId = crypto.randomUUID();
    return path.join(
      tempDir,
      COMMAND_IO_DIRECTORY_NAME,
      `${IO_FILES_PREFIX}${timestamp}_${uniqueId}`
    );
  }

  /** Returns a filesystem-safe timestamp, e.g. "2026-01-31_15-13-21". */
  private getTimestamp(): string {
    return new Date()
      .toISOString()
      .replace('T', '_')
      .replace(/:/g, '-')
      .slice(0, TIMESTAMP_FORMAT_LENGTH);
  }

  /**
   * Returns the unique session directory path as the marshalling
   *  ID — used by the CLI tool to locate its input/output files.
   */
  getMarshallingId(): string {
    return this.uniqueSessionDirectoryPath;
  }

  /** Create the session directory and write command-input.json into it. */
  write(input: string): void {
    fs.mkdirSync(this.uniqueSessionDirectoryPath, { recursive: true });
    fs.writeFileSync(
      path.join(this.uniqueSessionDirectoryPath, COMMAND_INPUT_FILENAME),
      JSON.stringify({ [COMMAND_INPUT_STRING_KEY]: input }, null, JSON_INDENT_SPACES)
    );
  }

  /** Read command-output.json written by the CLI tool. Throws if the file doesn't exist yet. */
  readOutput(): string {
    const outputPath = path.join(this.uniqueSessionDirectoryPath, COMMAND_OUTPUT_FILENAME);
    if (!fs.existsSync(outputPath)) {
      throw new Error(`Output file not found: ${outputPath}`);
    }
    const outputJson = JSON.parse(fs.readFileSync(outputPath, 'utf-8')) as {
      [COMMAND_OUTPUT_STRING_KEY]: string;
    };
    return outputJson[COMMAND_OUTPUT_STRING_KEY];
  }
}

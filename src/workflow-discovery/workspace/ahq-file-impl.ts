import * as fs from 'node:fs';

import type { AhqFile } from '../interfaces/ahq-file.js';

/**
 * AhqFileImpl — Concrete AhqFile backed by a filesystem path; reads
 * content synchronously on demand.
 *
 * SRP Does: Read a file from a given filesystem path synchronously
 * as UTF-8.
 *
 * SRP Knows About: The file path, Node's fs module, and UTF-8
 * encoding.
 *
 * SRP Knows Nothing About: What the content means or how it's parsed.
 */
export class AhqFileImpl implements AhqFile {
  constructor(private readonly path: string) {
    if (path === '') {
      throw new Error('AhqFile path cannot be empty');
    }
  }
  /** Read the file at the stored path as UTF-8 and return its content. */
  readContent(): string {
    return fs.readFileSync(this.path, 'utf-8');
  }
}

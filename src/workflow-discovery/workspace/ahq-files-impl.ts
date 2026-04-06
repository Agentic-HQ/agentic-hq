import type { AhqFile } from '../interfaces/ahq-file.js';
import type { AhqFiles } from '../interfaces/ahq-files.js';

/**
 * AhqFilesImpl — Concrete AhqFiles wrapping a plain AhqFile array
 * and exposing a single `map` method.
 *
 * SRP Does: Wrap a plain AhqFile array and expose a single map method.
 *
 * SRP Knows About: The underlying AhqFile[] and Array.prototype.map
 * semantics.
 *
 * SRP Knows Nothing About: How the files were discovered or what
 * they contain.
 */
export class AhqFilesImpl implements AhqFiles {
  constructor(private readonly files: AhqFile[]) {}
  /** Apply a function to each contained file and return the results in order. */
  map<T>(fn: (file: AhqFile) => T): T[] {
    return this.files.map(fn);
  }
}

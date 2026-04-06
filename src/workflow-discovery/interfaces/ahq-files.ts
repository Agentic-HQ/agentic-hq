import type { AhqFile } from './ahq-file.js';

/**
 * AhqFiles — A domain collection of AhqFile objects supporting
 * mapping without exposing the raw array.
 *
 * SRP Does: Apply a function to each contained file and return the
 * results in order.
 *
 * SRP Knows About: That it holds zero or more AhqFile objects.
 *
 * SRP Knows Nothing About: How the files were discovered, their
 * paths, or their content.
 */
export interface AhqFiles {
  /** Apply a function to each file and return the results in order. */
  map<T>(fn: (file: AhqFile) => T): T[];
}

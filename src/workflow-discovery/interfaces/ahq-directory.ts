import type { AhqFiles } from './ahq-files.js';

/**
 * AhqDirectory — A directory tree rooted at some path that can find
 * files matching a glob pattern.
 *
 * SRP Does: Return all files under the directory matching a given
 * glob pattern.
 *
 * SRP Knows About: That it has a root path and can filter descendants
 * by glob.
 *
 * SRP Knows Nothing About: The glob syntax itself, which glob engine
 * is used, or what the files contain.
 */
export interface AhqDirectory {
  /** Return all files under this directory matching the given glob pattern. */
  findMatchingFiles(pattern: string): AhqFiles;
}

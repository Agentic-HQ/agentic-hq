import * as path from 'node:path';

import fg from 'fast-glob';

import type { AhqDirectory } from '../interfaces/ahq-directory.js';
import type { AhqFiles } from '../interfaces/ahq-files.js';

import { AhqFileImpl } from './ahq-file-impl.js';
import { AhqFilesImpl } from './ahq-files-impl.js';

/**
 * AhqDirectoryImpl — Concrete AhqDirectory that walks a root path
 * using fast-glob and wraps matches as AhqFiles.
 *
 * SRP Does: Walk a root path using fast-glob and wrap matches as
 * an AhqFiles collection.
 *
 * SRP Knows About: The root path, the fast-glob library, and how
 * to join relative matches back to absolute paths.
 *
 * SRP Knows Nothing About: What kind of files are being searched
 * for or what their content means.
 */
export class AhqDirectoryImpl implements AhqDirectory {
  constructor(private readonly root: string) {}
  /** Run fast-glob against the root and return matching files as an AhqFiles collection. */
  findMatchingFiles(pattern: string): AhqFiles {
    const relativePaths = fg.sync(pattern, { cwd: this.root });
    const files = relativePaths.map((p) => new AhqFileImpl(path.join(this.root, p)));
    return new AhqFilesImpl(files);
  }
}

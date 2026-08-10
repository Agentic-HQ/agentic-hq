/**
 * DefaultAhqPackageRoot — the standard AhqPackageRoot value object.
 *
 * SRP Does: Hold the directory the agentic-hq package lives in, rejecting an
 * empty path loudly (fail fast, no defaults — throws uncaught per this
 * repo's catastrophic-failure convention).
 *
 * SRP Knows Nothing About: What lives under the path or how it is used.
 */

import type { AhqPackageRoot } from '../interfaces/ahq-package-root.js';

export class DefaultAhqPackageRoot implements AhqPackageRoot {
  constructor(private readonly path: string) {
    if (!path) {
      throw new Error('DefaultAhqPackageRoot: path must be a non-empty string');
    }
  }

  getPath(): string {
    return this.path;
  }
}

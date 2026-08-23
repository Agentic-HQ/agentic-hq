/**
 * Unit Test: DefaultAhqPackageRoot (AHQ-197)
 *
 * The package-root value object: holds the directory the agentic-hq package
 * lives in (dev: the repo checkout; production: the installed package root)
 * and rejects an empty path loudly.
 */
import { describe, expect, it } from 'vitest';

import { DefaultAhqPackageRoot } from '../../../src/runtime-params/default-ahq-package-root.js';

describe('DefaultAhqPackageRoot', () => {
  it('returns the path it was constructed with', () => {
    expect(new DefaultAhqPackageRoot('/installed/package/root').getPath()).toBe(
      '/installed/package/root'
    );
  });

  it('throws loudly on an empty path', () => {
    expect(() => new DefaultAhqPackageRoot('')).toThrowError(/non-empty/);
  });
});

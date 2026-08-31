/**
 * Tests scripts/publish-preflight.cjs — the `pnpm publish:preflight-checks` gate run at
 * the top of the publish checklist.
 *
 * The npm registry is immutable, and `npm publish` only rejects a version
 * collision AFTER auth and upload ceremony — on 2026-08-31 the 0.3.0 publish
 * walked all the way to §4 before discovering the version was never bumped
 * post-0.2.0. Behaviour under test:
 * - Passes when the working-tree version is not among the published versions,
 *   naming both the current and latest-published versions in its output.
 * - Fails loudly (throws, message says to bump) when the version is already
 *   on the registry.
 * - A never-published package (registry 404) passes — first publish is fine.
 * - Any other registry-query failure propagates — no silent fallback.
 */
import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

const { assertVersionNotPublished } = createRequire(import.meta.url)(
  '../../../scripts/publish-preflight.cjs'
);

function runPreflight(options: {
  currentVersion: string;
  publishedVersions: string[] | null;
}): string {
  const printedChunks: string[] = [];
  assertVersionNotPublished({
    packageName: 'agentic-hq',
    currentVersion: options.currentVersion,
    fetchPublishedVersions: (packageName: string) => {
      expect(packageName).toBe('agentic-hq');
      return options.publishedVersions;
    },
    print: (text: string) => printedChunks.push(text),
  });
  return printedChunks.join('');
}

describe('publish-preflight', () => {
  it('should pass when the current version is not on the registry', () => {
    const printed = runPreflight({
      currentVersion: '0.3.0',
      publishedVersions: ['0.1.0', '0.1.1', '0.2.0'],
    });

    expect(printed).toContain('0.3.0');
    expect(printed).toContain('0.2.0'); // names the latest published version
  });

  it('should fail loudly, telling the user to bump, when the version is already published', () => {
    expect(() =>
      runPreflight({
        currentVersion: '0.2.0',
        publishedVersions: ['0.1.0', '0.1.1', '0.2.0'],
      })
    ).toThrow(/0\.2\.0.*bump/is);
  });

  it('should pass for a never-published package (registry 404)', () => {
    const printed = runPreflight({ currentVersion: '0.1.0', publishedVersions: null });

    expect(printed).toContain('never been published');
  });

  it('should propagate unexpected registry-query failures instead of falling back', () => {
    expect(() =>
      assertVersionNotPublished({
        packageName: 'agentic-hq',
        currentVersion: '0.3.0',
        fetchPublishedVersions: () => {
          throw new Error('registry unreachable');
        },
        print: () => {},
      })
    ).toThrow(/registry unreachable/);
  });
});

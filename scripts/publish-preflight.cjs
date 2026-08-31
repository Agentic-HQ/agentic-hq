#!/usr/bin/env node
/**
 * publish-preflight — refuse to start a publish whose version is already on
 * the registry (publish checklist §1).
 *
 * The registry is immutable and `npm publish` only rejects a version
 * collision at §4, after the whole build/pack/inspect walk and the auth
 * ceremony — the 2026-08-31 0.3.0 publish got exactly that far before
 * discovering the version was never bumped after 0.2.0. This gate moves that
 * discovery to the first minute: run `pnpm publish:preflight-checks` before packing.
 *
 * A never-published package (registry 404) passes — a first publish is fine.
 * Any other registry-query failure propagates loudly — no silent fallback.
 */

const path = require('path');
const { spawnSync } = require('child_process');

function assertVersionNotPublished({ packageName, currentVersion, fetchPublishedVersions, print }) {
  const publishedVersions = fetchPublishedVersions(packageName);
  if (publishedVersions === null) {
    print(`${packageName} has never been published — version ${currentVersion} is free to use.\n`);
    return;
  }
  if (publishedVersions.includes(currentVersion)) {
    throw new Error(
      `Version ${currentVersion} of ${packageName} is ALREADY on the registry ` +
        `(published versions: ${publishedVersions.join(', ')}).\n` +
        `The registry is immutable — bump the version in package.json ` +
        `(and commit) before publishing.`
    );
  }
  const latestPublished = publishedVersions[publishedVersions.length - 1];
  print(`OK: ${currentVersion} is not on the registry (latest published: ${latestPublished}).\n`);
}

/** `npm view <name> versions --json` → array of versions, or null on 404
 * (never published). npm prints a bare string when only one version exists. */
function fetchPublishedVersionsFromRegistry(packageName) {
  const npmView = spawnSync('npm', ['view', packageName, 'versions', '--json'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (npmView.error) {
    throw npmView.error;
  }
  if (npmView.status !== 0) {
    if ((npmView.stderr ?? '').includes('E404')) {
      return null;
    }
    throw new Error(`npm view ${packageName} versions failed:\n${npmView.stderr}`);
  }
  const versions = JSON.parse(npmView.stdout);
  return Array.isArray(versions) ? versions : [versions];
}

module.exports = { assertVersionNotPublished };

if (require.main === module) {
  const rootManifest = require(path.join(__dirname, '..', 'package.json'));
  assertVersionNotPublished({
    packageName: rootManifest.name,
    currentVersion: rootManifest.version,
    fetchPublishedVersions: fetchPublishedVersionsFromRegistry,
    print: (text) => process.stdout.write(text),
  });
}

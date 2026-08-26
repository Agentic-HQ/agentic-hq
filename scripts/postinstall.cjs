#!/usr/bin/env node
/**
 * postinstall — node-pty spawn-helper exec-bit repair (AHQ-198, AHQ-211)
 *
 * posix_spawnp failed on macOS because both pnpm
 * (https://github.com/pnpm/pnpm/issues/7366) and npm extract node-pty's
 * spawn-helper binary with -rw-r--r-- instead of -rwxr-xr-x. Two candidate
 * layouts because installers lay node-pty out differently (AHQ-198): nested
 * inside this package (npm -g), or hoisted to a sibling of the package dir
 * (npx / project-local installs).
 *
 * Mac-only: spawn-helper is a macOS-only binary, and every other platform
 * is a deliberate no-op — a Node script instead of the previous POSIX shell
 * string, which failed under cmd and broke `pnpm install` on Windows
 * (AHQ-211). A missing layout (ENOENT) is normal and skipped — the explicit
 * form of the old `2>/dev/null || true` — but any other fs error propagates
 * loudly; no silent fallback.
 *
 * Shipped plugin .sh exec bits are NOT handled here: they are recorded in
 * the tarball via the release manifest's publishConfig.executableFiles
 * (AHQ-197, see scripts/build-release.cjs).
 */

const fs = require('fs');
const path = require('path');

const MAC_PLATFORM = 'darwin';
const MAC_PREBUILD_DIR_PREFIX = 'darwin-';
const SPAWN_HELPER_FILE_NAME = 'spawn-helper';
const EXECUTABLE_FILE_MODE = 0o755; // rwxr-xr-x

/** Chmod every macOS spawn-helper found in either layout; returns the repaired paths. */
function repairSpawnHelperExecBits({ platform, packageDir }) {
  if (!isMac(platform)) {
    return [];
  }
  return listCandidatePrebuildRoots(packageDir).flatMap(repairSpawnHelpersUnder);
}

function isMac(platform) {
  return platform === MAC_PLATFORM;
}

/** The two places installers put node-pty, relative to this package's root. */
function listCandidatePrebuildRoots(packageDir) {
  return [
    path.join(packageDir, 'node_modules', 'node-pty', 'prebuilds'),
    path.join(packageDir, '..', 'node-pty', 'prebuilds'),
  ];
}

function repairSpawnHelpersUnder(prebuildsRoot) {
  const repaired = [];
  for (const prebuildDir of listMacPrebuildDirs(prebuildsRoot)) {
    const spawnHelper = path.join(prebuildDir, SPAWN_HELPER_FILE_NAME);
    if (makeExecutableIfPresent(spawnHelper)) {
      repaired.push(spawnHelper);
    }
  }
  return repaired;
}

function listMacPrebuildDirs(prebuildsRoot) {
  let entries;
  try {
    entries = fs.readdirSync(prebuildsRoot, { withFileTypes: true });
  } catch (error) {
    if (isMissingPathError(error)) {
      return []; // this layout is not present — normal
    }
    throw error;
  }
  return entries
    .filter((entry) => isMacPrebuildDir(entry))
    .map((entry) => path.join(prebuildsRoot, entry.name));
}

function isMacPrebuildDir(directoryEntry) {
  return directoryEntry.isDirectory() && directoryEntry.name.startsWith(MAC_PREBUILD_DIR_PREFIX);
}

function makeExecutableIfPresent(filePath) {
  try {
    fs.chmodSync(filePath, EXECUTABLE_FILE_MODE);
    return true;
  } catch (error) {
    if (isMissingPathError(error)) {
      return false; // prebuild dir without the helper file — nothing to repair
    }
    throw error;
  }
}

function isMissingPathError(error) {
  return error.code === 'ENOENT';
}

module.exports = { repairSpawnHelperExecBits };

if (require.main === module) {
  repairSpawnHelperExecBits({
    platform: process.platform,
    packageDir: path.join(__dirname, '..'),
  });
}

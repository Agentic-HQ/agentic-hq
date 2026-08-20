/**
 * Shared tarball-install setup for e2e tests (AHQ-208): build the release
 * tree (Framework Build (1) + a Workflow Build (2) per shipped migrated
 * workflow), pack it FROM release/, and npm-install the tarball into an
 * isolated prefix — the way a real npm user gets agentic-hq. Used by the
 * npm-package tarball e2e and the user-workspace fixture e2e (the no-clone
 * collaborator proof).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { runCliAndLogOutput } from './cli-test-helper-functions.js';

const SETUP_TIMEOUT_MS = 600_000; // build + pack + npm registry-style install

export interface TarballInstall {
  tarballPath: string;
  installedPackageRoot: string;
  installedBinPath: string;
}

/** Build release/, pack it into runDir, npm-install the tarball under
 *  `<runDir>/install-prefix`, and return where everything landed. */
export function buildPackAndInstallTarball(runDir: string): TarballInstall {
  const repoRoot = process.cwd();
  fs.mkdirSync(runDir, { recursive: true });

  runCliAndLogOutput('pnpm build', 'prebuilt-tarball-build', SETUP_TIMEOUT_MS, repoRoot);

  // Pack FROM the staged release tree — its manifest is literal, so no
  // pack-time override mechanism is involved
  const releaseDir = path.join(repoRoot, 'release');
  runCliAndLogOutput(
    `pnpm pack --pack-destination "${runDir}"`,
    'prebuilt-tarball-pack',
    SETUP_TIMEOUT_MS,
    releaseDir
  );
  const tarballs = fs.readdirSync(runDir).filter((entry) => entry.endsWith('.tgz'));
  if (tarballs.length !== 1) {
    throw new Error(
      `buildPackAndInstallTarball: expected exactly 1 packed tarball in ${runDir}, found ${tarballs.length}`
    );
  }
  const tarballPath = path.join(runDir, tarballs[0]);

  // Install the tarball the way npm would install from the registry
  const installPrefix = path.join(runDir, 'install-prefix');
  runCliAndLogOutput(
    `npm install -g --prefix "${installPrefix}" "${tarballPath}"`,
    'prebuilt-tarball-npm-install',
    SETUP_TIMEOUT_MS,
    repoRoot
  );

  return {
    tarballPath,
    installedPackageRoot: path.join(installPrefix, 'lib', 'node_modules', 'agentic-hq'),
    installedBinPath: path.join(installPrefix, 'bin', 'agentic-hq'),
  };
}

/**
 * Integration Test: Publish Guards (AHQ-198)
 *
 * The publishable artifact is the staged release/ tree, packed with pnpm —
 * and nothing else. Two prepack guards enforce this at the packer level
 * (both npm and pnpm run `prepack` and abort the pack/publish when it exits
 * non-zero — npm does so even on a private package):
 *
 * 1. Wrong tree: an always-fail `prepack` in the ROOT manifest makes
 *    `npm pack` / `npm publish` at the repo root fail loudly, pointing at
 *    the real flow (`pnpm build && cd release && pnpm pack`). The root's
 *    `private: true` blocks publish but NOT pack — hence the script guard.
 * 2. Wrong packer: a user-agent-checking `prepack` in the GENERATED release
 *    manifest makes `npm pack` / `npm publish` inside release/ fail loudly —
 *    only pnpm applies publishConfig.executableFiles, so an npm-packed
 *    tarball would ship the plugin .sh files non-executable (exit 126 at
 *    runtime, AHQ-196).
 *
 * Neither guard runs at user install time (`prepack` is pack/publish-only),
 * and a tarball publish runs no lifecycle scripts at all, so uploading the
 * pnpm-packed tarball with npm stays unaffected. The positive control proves
 * the blessed flow (pnpm pack from release/) still works — the UA guard must
 * never false-positive on pnpm.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-198
 */

import { execFileSync, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, it, expect, beforeAll } from 'vitest';

const BUILD_TIMEOUT_MS = 300_000; // one full tsc compile of the src graph
const PACK_TIMEOUT_MS = 120_000;

/** Run a packer command as a maintainer's plain terminal would, capturing
 * exit status and combined stdout+stderr (npm routes failed-lifecycle output
 * through either stream depending on foreground-scripts mode — the loud
 * message is what matters, not the stream it travelled on).
 *
 * The npm_* environment is stripped because this test itself runs under
 * pnpm, which exports npm_config_user_agent=pnpm/… — inherited by the
 * spawned npm, that would make the user-agent guard see pnpm and wave the
 * wrong packer through. A real terminal carries none of these variables. */
function runPackCommand(
  command: string,
  args: string[],
  cwd: string
): { status: number | null; output: string } {
  const plainTerminalEnv = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.toLowerCase().startsWith('npm_'))
  );
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf-8',
    timeout: PACK_TIMEOUT_MS,
    env: plainTerminalEnv,
  });
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
}

/** A fresh empty destination directory for one pack attempt. */
function createTempPackDestination(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ahq-publish-guards-'));
}

/** The tarballs a pack attempt actually produced in its destination. */
function listTarballs(destinationDir: string): string[] {
  return fs.readdirSync(destinationDir).filter((entry) => entry.endsWith('.tgz'));
}

describe('Publish guards (AHQ-198)', () => {
  const repoRoot = process.cwd();
  const releaseDir = path.join(repoRoot, 'release');

  beforeAll(() => {
    // Stage the release tree so the generated manifest (and its wrong-packer
    // guard) is the one under test
    execFileSync(process.execPath, [path.join(repoRoot, 'scripts', 'build-release.cjs')], {
      cwd: repoRoot,
      stdio: 'inherit',
    });
  }, BUILD_TIMEOUT_MS);

  it(
    'should fail npm pack at the repo root, pointing at the staged-release flow',
    () => {
      const destination = createTempPackDestination();

      const { status, output } = runPackCommand(
        'npm',
        ['pack', '--pack-destination', destination],
        repoRoot
      );

      expect(status).not.toBe(0);
      expect(output).toContain('never pack/publish the repo root');
      expect(output).toContain('pnpm build && cd release && pnpm pack');
      expect(listTarballs(destination)).toEqual([]);
    },
    PACK_TIMEOUT_MS
  );

  it(
    'should fail npm pack inside release/, naming pnpm and the exec-bit reason',
    () => {
      const destination = createTempPackDestination();

      const { status, output } = runPackCommand(
        'npm',
        ['pack', '--pack-destination', destination],
        releaseDir
      );

      expect(status).not.toBe(0);
      expect(output).toContain('must be packed/published with pnpm');
      expect(output).toContain('publishConfig.executableFiles');
      expect(listTarballs(destination)).toEqual([]);
    },
    PACK_TIMEOUT_MS
  );

  it(
    'should still pack successfully with pnpm inside release/ (positive control)',
    () => {
      const destination = createTempPackDestination();

      const { status, output } = runPackCommand(
        'pnpm',
        ['pack', '--pack-destination', destination],
        releaseDir
      );

      expect(status, `pnpm pack failed:\n${output}`).toBe(0);
      expect(listTarballs(destination)).toHaveLength(1);
    },
    PACK_TIMEOUT_MS
  );
});

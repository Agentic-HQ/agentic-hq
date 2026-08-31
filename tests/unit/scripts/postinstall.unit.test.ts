/**
 * Tests scripts/postinstall.cjs — node-pty spawn-helper exec-bit repair (AHQ-211 Phase 1).
 *
 * Replaces the POSIX shell string (`chmod +x … 2>/dev/null || true`) that broke
 * `pnpm install` on Windows (cmd has neither chmod nor true). Behaviour under test:
 * - darwin-only: on every other platform the repair is a deliberate no-op.
 * - Repairs BOTH node-pty layouts (AHQ-198): nested inside the package (npm -g)
 *   and hoisted to a sibling of the package dir (npx / project-local installs).
 * - Swallows ENOENT only (a missing layout is normal); any other fs error
 *   propagates loudly — no silent fallback.
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { tmpdirTest } from '../workflow-discovery/test-fixtures/tmpdir-fixture.js';

const { repairSpawnHelperExecBits } = createRequire(import.meta.url)(
  '../../../scripts/postinstall.cjs'
);

/** Lay out a fake installed agentic-hq package dir with node-pty prebuilds in the
 * requested layouts, returning the package dir the script operates from. */
function createPackageFixture(
  tmpdir: string,
  layouts: { nested?: string[]; hoisted?: string[] }
): string {
  const packageDir = path.join(tmpdir, 'node_modules', 'agentic-hq');
  fs.mkdirSync(packageDir, { recursive: true });
  for (const prebuild of layouts.nested ?? []) {
    writeSpawnHelper(path.join(packageDir, 'node_modules', 'node-pty', 'prebuilds', prebuild));
  }
  for (const prebuild of layouts.hoisted ?? []) {
    writeSpawnHelper(path.join(tmpdir, 'node_modules', 'node-pty', 'prebuilds', prebuild));
  }
  return packageDir;
}

function writeSpawnHelper(prebuildDir: string): void {
  fs.mkdirSync(prebuildDir, { recursive: true });
  const spawnHelper = path.join(prebuildDir, 'spawn-helper');
  fs.writeFileSync(spawnHelper, 'binary-placeholder');
  fs.chmodSync(spawnHelper, 0o644); // the broken mode npm/pnpm extract with
}

describe('postinstall spawn-helper exec-bit repair', () => {
  tmpdirTest('should repair spawn-helper in both node-pty layouts on darwin', ({ tmpdir }) => {
    const packageDir = createPackageFixture(tmpdir, {
      nested: ['darwin-x64', 'darwin-arm64'],
      hoisted: ['darwin-arm64'],
    });

    const repaired = repairSpawnHelperExecBits({ platform: 'darwin', packageDir });

    expect(repaired).toHaveLength(3);
    expect(repaired).toContain(
      path.join(packageDir, 'node_modules', 'node-pty', 'prebuilds', 'darwin-x64', 'spawn-helper')
    );
    expect(repaired).toContain(
      path.join(tmpdir, 'node_modules', 'node-pty', 'prebuilds', 'darwin-arm64', 'spawn-helper')
    );
    if (process.platform !== 'win32') {
      // NTFS has no POSIX mode bits, so the mode assertion only means anything
      // on POSIX hosts (it runs for real in Linux CI).
      for (const spawnHelper of repaired) {
        expect(fs.statSync(spawnHelper).mode & 0o777).toBe(0o755);
      }
    }
  });

  tmpdirTest('should be a no-op on non-darwin platforms even when layouts exist', ({ tmpdir }) => {
    const packageDir = createPackageFixture(tmpdir, { nested: ['darwin-x64'] });

    expect(repairSpawnHelperExecBits({ platform: 'win32', packageDir })).toEqual([]);
    expect(repairSpawnHelperExecBits({ platform: 'linux', packageDir })).toEqual([]);
  });

  tmpdirTest('should swallow entirely missing node-pty layouts (ENOENT)', ({ tmpdir }) => {
    const packageDir = path.join(tmpdir, 'node_modules', 'agentic-hq');
    fs.mkdirSync(packageDir, { recursive: true });

    expect(repairSpawnHelperExecBits({ platform: 'darwin', packageDir })).toEqual([]);
  });

  tmpdirTest('should skip a darwin prebuild dir that has no spawn-helper file', ({ tmpdir }) => {
    const packageDir = createPackageFixture(tmpdir, { nested: ['darwin-x64'] });
    fs.rmSync(
      path.join(packageDir, 'node_modules', 'node-pty', 'prebuilds', 'darwin-x64', 'spawn-helper')
    );

    expect(repairSpawnHelperExecBits({ platform: 'darwin', packageDir })).toEqual([]);
  });

  tmpdirTest('should propagate non-ENOENT errors instead of falling back', ({ tmpdir }) => {
    const packageDir = path.join(tmpdir, 'node_modules', 'agentic-hq');
    const prebuildsAsFile = path.join(packageDir, 'node_modules', 'node-pty', 'prebuilds');
    fs.mkdirSync(path.dirname(prebuildsAsFile), { recursive: true });
    fs.writeFileSync(prebuildsAsFile, 'not a directory'); // readdir → ENOTDIR

    expect(() => repairSpawnHelperExecBits({ platform: 'darwin', packageDir })).toThrow();
  });

  it('should exit 0 when run as the postinstall CLI on this machine', () => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'postinstall.cjs');

    // execFileSync throws on non-zero exit — this is the exact invocation
    // `pnpm install` runs, on whatever platform the tests run on.
    expect(() => execFileSync(process.execPath, [scriptPath], { stdio: 'pipe' })).not.toThrow();
  });
});

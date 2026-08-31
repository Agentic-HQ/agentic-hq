/**
 * Tests scripts/prepack-guard.cjs — both prepack guards as one Node script (AHQ-211 Phase 1).
 *
 * Replaces the two inline `node -e` prepack strings (root package.json and the
 * generated release manifest) whose nested quoting is cmd-hostile. Modes:
 * - root:    always refuse — the repo root must never be packed/published; the
 *   publishable artifact is the staged release tree (AHQ-198).
 * - release: refuse on win32 first (NTFS has no exec bits, so a Windows-packed
 *   tarball would ship plugin scripts non-executable on Mac/Linux — AHQ-211);
 *   otherwise refuse any packer but pnpm (only pnpm applies
 *   publishConfig.executableFiles — AHQ-198). A missing user agent (plain
 *   terminal) counts as not-pnpm.
 *
 * The message substrings asserted here are the same ones
 * tests/integration/build/publish-guards.integration.test.ts greps out of real
 * `npm pack` output — keep them in sync.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

const { evaluatePrepackGuard } = createRequire(import.meta.url)(
  '../../../scripts/prepack-guard.cjs'
);

const PNPM_USER_AGENT = 'pnpm/11.1.2 npm/? node/v24.15.0 win32 x64';
const NPM_USER_AGENT = 'npm/10.9.3 node/v24.15.0 darwin arm64 workspaces/false';

describe('prepack-guard evaluation', () => {
  it('should always refuse root mode, pointing at the staged-release flow', () => {
    for (const platform of ['darwin', 'linux', 'win32']) {
      const verdict = evaluatePrepackGuard({
        mode: 'root',
        platform,
        userAgent: PNPM_USER_AGENT,
      });

      expect(verdict.allowed).toBe(false);
      expect(verdict.message).toContain('never pack/publish the repo root');
      expect(verdict.message).toContain('pnpm build && cd release && pnpm pack');
    }
  });

  it('should refuse release mode on win32 even under pnpm, naming the exec-bit reason', () => {
    const verdict = evaluatePrepackGuard({
      mode: 'release',
      platform: 'win32',
      userAgent: PNPM_USER_AGENT,
    });

    expect(verdict.allowed).toBe(false);
    expect(verdict.message).toContain('Windows');
    expect(verdict.message).toContain('exec bits');
  });

  it('should refuse release mode under npm, naming pnpm and executableFiles', () => {
    const verdict = evaluatePrepackGuard({
      mode: 'release',
      platform: 'darwin',
      userAgent: NPM_USER_AGENT,
    });

    expect(verdict.allowed).toBe(false);
    expect(verdict.message).toContain('must be packed/published with pnpm');
    expect(verdict.message).toContain('publishConfig.executableFiles');
  });

  it('should refuse release mode with no user agent (plain terminal)', () => {
    const verdict = evaluatePrepackGuard({
      mode: 'release',
      platform: 'darwin',
      userAgent: undefined,
    });

    expect(verdict.allowed).toBe(false);
    expect(verdict.message).toContain('must be packed/published with pnpm');
  });

  it('should allow release mode under pnpm on POSIX', () => {
    for (const platform of ['darwin', 'linux']) {
      const verdict = evaluatePrepackGuard({
        mode: 'release',
        platform,
        userAgent: PNPM_USER_AGENT,
      });

      expect(verdict.allowed).toBe(true);
    }
  });

  it('should throw on a missing or unknown mode', () => {
    expect(() => evaluatePrepackGuard({ mode: undefined, platform: 'darwin' })).toThrow();
    expect(() => evaluatePrepackGuard({ mode: 'staging', platform: 'darwin' })).toThrow();
  });
});

describe('prepack-guard CLI', () => {
  const scriptPath = path.join(process.cwd(), 'scripts', 'prepack-guard.cjs');

  it('should exit 1 in root mode with the message on stderr', () => {
    const result = spawnSync(process.execPath, [scriptPath, 'root'], { encoding: 'utf-8' });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('never pack/publish the repo root');
  });

  it('should apply the real platform in release mode under a pnpm user agent', () => {
    const result = spawnSync(process.execPath, [scriptPath, 'release'], {
      encoding: 'utf-8',
      env: { ...process.env, npm_config_user_agent: PNPM_USER_AGENT },
    });

    if (process.platform === 'win32') {
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Windows');
    } else {
      expect(result.status).toBe(0);
    }
  });
});

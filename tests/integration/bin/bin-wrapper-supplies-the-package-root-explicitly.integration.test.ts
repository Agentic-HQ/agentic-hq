/**
 * Integration Test: bin/agentic-hq.cjs supplies the AHQ package root explicitly (AHQ-200)
 *
 * The bin wrapper is the single structural source of the AHQ package root: it
 * passes its own parent directory as `--ahq-package-root=`, and nothing
 * downstream may work the root out any other way. Nothing covered that wrapper —
 * the only other test invoking it is the deliberately-red string-reversal e2e,
 * and CI's `agentic-hq list` step checks the exit code alone — so neither a
 * dropped parameter nor a changed listing label would be noticed. These tests
 * close that gap, and need no Claude.
 *
 * A missing `--ahq-package-root` is a fail-fast error in `DefaultAhqCommandLine`,
 * so a rendered listing proves the whole explicit-parameter chain — including
 * the dedup guard, which fires here because the test runs from the repo root
 * (the U = P case, where the AHQ package and the user's workspace are one
 * directory).
 *
 * TEMPORARY — DELETE WHEN AHQ-201 IS DONE: the second test probes one specific
 * retired environment variable by name. AHQ-200 removed it from the working
 * system and AHQ-201 removes it from the last unmigrated workflows; once
 * AHQ-201's grep-clean acceptance criterion is met the name exists nowhere and
 * the test is archaeology. Delete then: the second `it(...)` block, the
 * `LEGACY_ENV_VAR_NAME` / `BOGUS_LEGACY_ROOT` constants, this paragraph, and the
 * optional parameter of `runListThroughDevBinWrapper()` (keeping the two lines
 * that strip the variable from the child environment is harmless but pointless).
 * The first test is permanent.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-200
 */

import { spawnSync } from 'node:child_process';
import * as path from 'node:path';

import { describe, it, expect } from 'vitest';

const TEST_TIMEOUT_MS = 60_000; // plain node + tsx subprocess, no Claude

const repoRoot = process.cwd();
const devBinPath = path.join(repoRoot, 'bin', 'agentic-hq.cjs');

const AHQ_PACKAGE_HEADER_LINE = `Agentic HQ Package: ${repoRoot}`;
const SAME_AS_AHQ_PACKAGE_LINE =
  'Same as Agentic HQ Package (running from within the AHQ package directory)';

const LEGACY_ENV_VAR_NAME = 'AGENTIC_HQ_WORKSPACE_ROOT';
const BOGUS_LEGACY_ROOT = path.join(path.sep, 'bogus-legacy-ahq-root-that-must-be-ignored');

/**
 * Run `agentic-hq list` through the dev bin wrapper. The retired environment
 * variable is always stripped from the child's environment; pass a value to
 * poison it instead.
 */
function runListThroughDevBinWrapper(legacyEnvVarValue?: string): {
  status: number | null;
  stdout: string;
  stderr: string;
} {
  const env = { ...process.env };
  delete env[LEGACY_ENV_VAR_NAME];
  if (legacyEnvVarValue !== undefined) {
    env[LEGACY_ENV_VAR_NAME] = legacyEnvVarValue;
  }

  const result = spawnSync(process.execPath, [devBinPath, 'list'], {
    encoding: 'utf-8',
    cwd: repoRoot,
    env,
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe('bin/agentic-hq.cjs supplies the AHQ package root explicitly (AHQ-200)', () => {
  it(
    'should render the listing from the --ahq-package-root the wrapper passes',
    () => {
      const { status, stdout, stderr } = runListThroughDevBinWrapper();

      expect(stderr).not.toContain('ahq-package-root');
      expect(status).toBe(0);
      expect(stdout).toContain(AHQ_PACKAGE_HEADER_LINE);
      expect(stdout).toContain(SAME_AS_AHQ_PACKAGE_LINE);
    },
    TEST_TIMEOUT_MS
  );

  // TEMPORARY — delete when AHQ-201 is done (see the file header).
  it(
    'should take the package root only from that parameter, never from a retired environment variable',
    () => {
      const withoutEnvVar = runListThroughDevBinWrapper();
      const withPoisonedEnvVar = runListThroughDevBinWrapper(BOGUS_LEGACY_ROOT);

      expect(withPoisonedEnvVar.status).toBe(0);
      expect(withPoisonedEnvVar.stdout).not.toContain(BOGUS_LEGACY_ROOT);
      expect(withPoisonedEnvVar.stdout).toContain(AHQ_PACKAGE_HEADER_LINE);
      expect(withPoisonedEnvVar.stdout).toBe(withoutEnvVar.stdout);
    },
    TEST_TIMEOUT_MS
  );
});

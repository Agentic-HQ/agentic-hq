/**
 * Integration Test: run-workflow.cjs validates and executes (AHQ-197)
 *
 * The shared runner is the TERMINUS of the explicit parameter chain — the
 * only code that acts on `build-mode`. This test proves, fast and without
 * any Claude involvement:
 * 1. Missing `--build-mode=` is a loud error (required, no defaults)
 * 2. An invalid `--build-mode=` value is a loud error
 * 3. Happy-path `prebuilt`: against a tiny fake package tree (a stub
 *    workflow JS that echoes its argv) the runner executes the workflow JS
 *    from the package root and forwards `--build-mode`, `--ahq-package-root`
 *    and the passthrough args to the workflow program
 *
 * `build-first` mode (run the shared build, execute from release/) is proven
 * by the cross-workspace math e2e — it needs the real build pipeline.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-197
 */

import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const TEST_TIMEOUT_MS = 30_000; // plain node subprocesses, no Claude

const repoRoot = process.cwd();
const runnerPath = path.join(repoRoot, 'scripts', 'run-workflow.cjs');

// Stub workflow program: prints its argv as JSON so forwarding is observable
const ECHO_ARGV_WORKFLOW_JS = 'echo-argv.cjs';
const ECHO_ARGV_SOURCE = 'console.log(JSON.stringify(process.argv.slice(2)));\n';

/** Run the runner with the given args; returns status, stdout and stderr. */
function runRunner(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [runnerPath, ...args], { encoding: 'utf-8' });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe('run-workflow.cjs validates and executes (AHQ-197)', () => {
  let fakePackageRoot: string;

  beforeAll(() => {
    fakePackageRoot = path.join(
      repoRoot,
      'temp',
      'AHQ-197',
      `runner-integration-${Date.now()}_${randomUUID()}`
    );
    fs.mkdirSync(fakePackageRoot, { recursive: true });
    fs.writeFileSync(path.join(fakePackageRoot, ECHO_ARGV_WORKFLOW_JS), ECHO_ARGV_SOURCE);
  });

  afterAll(() => {
    fs.rmSync(fakePackageRoot, { recursive: true, force: true });
  });

  it(
    'should fail loudly when --build-mode is missing',
    () => {
      const { status, stderr } = runRunner([
        `--ahq-package-root=${fakePackageRoot}`,
        `--workflow-js=${ECHO_ARGV_WORKFLOW_JS}`,
      ]);

      expect(status).not.toBe(0);
      expect(stderr).toContain('--build-mode');
    },
    TEST_TIMEOUT_MS
  );

  it(
    'should fail loudly on an invalid --build-mode value',
    () => {
      const { status, stderr } = runRunner([
        '--build-mode=sideways',
        `--ahq-package-root=${fakePackageRoot}`,
        `--workflow-js=${ECHO_ARGV_WORKFLOW_JS}`,
      ]);

      expect(status).not.toBe(0);
      expect(stderr).toContain('sideways');
    },
    TEST_TIMEOUT_MS
  );

  it(
    'should execute the workflow JS in prebuilt mode, forwarding the params and passthrough args',
    () => {
      const { status, stdout } = runRunner([
        '--build-mode=prebuilt',
        `--ahq-package-root=${fakePackageRoot}`,
        `--workflow-js=${ECHO_ARGV_WORKFLOW_JS}`,
        '--input-number=7',
        'plain-arg',
      ]);

      expect(status).toBe(0);
      const forwardedArgs = JSON.parse(stdout.trim()) as string[];
      expect(forwardedArgs).toEqual([
        '--build-mode=prebuilt',
        `--ahq-package-root=${fakePackageRoot}`,
        '--input-number=7',
        'plain-arg',
      ]);
    },
    TEST_TIMEOUT_MS
  );
});

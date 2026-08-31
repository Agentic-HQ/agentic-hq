/**
 * Integration Test: run-workflow.cjs validates and executes (AHQ-197, AHQ-208)
 *
 * The shared runner is the TERMINUS of the explicit parameter chain — the
 * only code that acts on `build-mode`. Its contract is four named options,
 * all required with loud errors (AHQ-208, design doc 03 §6):
 * `--build-mode`, `--ahq-package-root`, `--workflow-dir`, and `--workflow-js`
 * (relative to `--workflow-dir`; an absolute value is rejected).
 *
 * This test proves, fast and without any Claude involvement:
 * 1. Missing `--build-mode=` is a loud error (required, no defaults)
 * 2. An invalid `--build-mode=` value is a loud error
 * 3. Missing `--workflow-dir=` is a loud error
 * 4. An absolute `--workflow-js=` is a loud error
 * 5. Happy-path `prebuilt`: the runner executes `<workflow-dir>/<workflow-js>`
 *    as-is and forwards `--build-mode`, `--ahq-package-root` and the
 *    passthrough args to the workflow program
 * 6. Happy-path `build-first`: the runner runs the Workflow Build (2) —
 *    pnpm install, the node_modules/agentic-hq symlink, tsc into
 *    `<workflow-dir>/dist/` — against a tiny fake ts-workflow, then executes
 *    the freshly compiled program; and it never builds the framework or
 *    creates a `release/` tree (release/ is publish-only since AHQ-208)
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-208
 */

import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const TEST_TIMEOUT_MS = 30_000; // plain node subprocesses, no Claude
// The build-first case runs a real pnpm install + tsc in the fake workflow
const BUILD_FIRST_TEST_TIMEOUT_MS = 180_000;

const repoRoot = process.cwd();
const runnerPath = path.join(repoRoot, 'scripts', 'run-workflow.cjs');

// Stub workflow program: prints its argv as JSON so forwarding is observable.
// Named by the AHQ-208 program-name convention `<skill-id>-cli` for realism.
const ECHO_ARGV_WORKFLOW_JS = path.join('dist', 'echo-argv-cli.js');
const ECHO_ARGV_COMPILED_SOURCE = 'console.log(JSON.stringify(process.argv.slice(2)));\n';
const ECHO_ARGV_TS_SOURCE = 'console.log(JSON.stringify(process.argv.slice(2)));\nexport {};\n';

// The standard ts-workflow file set (AHQ-208), minus install-policy files the
// test does not need. The pnpm-workspace.yaml is required: it stops pnpm
// walking up from temp/ into the repo's own workspace.
const STANDARD_WORKFLOW_PACKAGE_JSON = `{
  "name": "agentic-hq-demo-echo-argv",
  "version": "0.0.1",
  "type": "module",
  "engines": { "node": "^22.0.0 || ^24.0.0" },
  "devDependencies": { "typescript": "^5.9.3", "@types/node": "^22" }
}
`;
const STANDARD_WORKFLOW_TSCONFIG_JSON = `{
  "compilerOptions": {
    "strict": true,
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "rootDir": "src",
    "outDir": "dist",
    "sourceMap": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
`;
const STANDARD_WORKFLOW_PNPM_WORKSPACE_YAML = `packages:
  - '.'
`;

/** Run the runner with the given args; returns status, stdout and stderr. */
function runRunner(
  args: string[],
  cwd?: string
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [runnerPath, ...args], { encoding: 'utf-8', cwd });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe('run-workflow.cjs validates and executes (AHQ-197, AHQ-208)', () => {
  let testRunDir: string;
  let prebuiltWorkflowDir: string;
  let buildFirstWorkflowDir: string;

  beforeAll(() => {
    testRunDir = path.join(
      repoRoot,
      'temp',
      'test-scratch',
      `runner-integration-${Date.now()}_${randomUUID()}`
    );

    // Prebuilt fake: only a compiled program, exactly like an installed artifact
    prebuiltWorkflowDir = path.join(testRunDir, 'prebuilt-workflow');
    fs.mkdirSync(path.join(prebuiltWorkflowDir, 'dist'), { recursive: true });
    fs.writeFileSync(
      path.join(prebuiltWorkflowDir, ECHO_ARGV_WORKFLOW_JS),
      ECHO_ARGV_COMPILED_SOURCE
    );

    // Build-first fake: TS source + the standard ts-workflow file set, no dist/
    buildFirstWorkflowDir = path.join(testRunDir, 'build-first-workflow');
    fs.mkdirSync(path.join(buildFirstWorkflowDir, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(buildFirstWorkflowDir, 'package.json'),
      STANDARD_WORKFLOW_PACKAGE_JSON
    );
    fs.writeFileSync(
      path.join(buildFirstWorkflowDir, 'tsconfig.json'),
      STANDARD_WORKFLOW_TSCONFIG_JSON
    );
    fs.writeFileSync(
      path.join(buildFirstWorkflowDir, 'pnpm-workspace.yaml'),
      STANDARD_WORKFLOW_PNPM_WORKSPACE_YAML
    );
    fs.writeFileSync(
      path.join(buildFirstWorkflowDir, 'src', 'echo-argv-cli.ts'),
      ECHO_ARGV_TS_SOURCE
    );
  });

  afterAll(() => {
    fs.rmSync(testRunDir, { recursive: true, force: true });
  });

  it(
    'should fail loudly when --build-mode is missing',
    () => {
      const { status, stderr } = runRunner([
        `--ahq-package-root=${repoRoot}`,
        `--workflow-dir=${prebuiltWorkflowDir}`,
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
        `--ahq-package-root=${repoRoot}`,
        `--workflow-dir=${prebuiltWorkflowDir}`,
        `--workflow-js=${ECHO_ARGV_WORKFLOW_JS}`,
      ]);

      expect(status).not.toBe(0);
      expect(stderr).toContain('sideways');
    },
    TEST_TIMEOUT_MS
  );

  it(
    'should fail loudly when --workflow-dir is missing',
    () => {
      const { status, stderr } = runRunner([
        '--build-mode=prebuilt',
        `--ahq-package-root=${repoRoot}`,
        `--workflow-js=${ECHO_ARGV_WORKFLOW_JS}`,
      ]);

      expect(status).not.toBe(0);
      expect(stderr).toContain('--workflow-dir');
    },
    TEST_TIMEOUT_MS
  );

  it(
    'should fail loudly when --workflow-js is an absolute path',
    () => {
      const { status, stderr } = runRunner([
        '--build-mode=prebuilt',
        `--ahq-package-root=${repoRoot}`,
        `--workflow-dir=${prebuiltWorkflowDir}`,
        `--workflow-js=${path.join(prebuiltWorkflowDir, ECHO_ARGV_WORKFLOW_JS)}`,
      ]);

      expect(status).not.toBe(0);
      expect(stderr).toContain('--workflow-js');
      expect(stderr).toContain('relative');
    },
    TEST_TIMEOUT_MS
  );

  it(
    'should execute <workflow-dir>/<workflow-js> in prebuilt mode, forwarding the params and passthrough args',
    () => {
      const { status, stdout } = runRunner([
        '--build-mode=prebuilt',
        `--ahq-package-root=${repoRoot}`,
        `--workflow-dir=${prebuiltWorkflowDir}`,
        `--workflow-js=${ECHO_ARGV_WORKFLOW_JS}`,
        '--input-number=7',
        'plain-arg',
      ]);

      expect(status).toBe(0);
      const forwardedArgs = JSON.parse(stdout.trim()) as string[];
      expect(forwardedArgs).toEqual([
        '--build-mode=prebuilt',
        `--ahq-package-root=${repoRoot}`,
        '--input-number=7',
        'plain-arg',
      ]);
    },
    TEST_TIMEOUT_MS
  );

  it(
    'should resolve relative --ahq-package-root and --workflow-dir against the working directory',
    () => {
      // The npm demo scripts pass these two options relative — cmd.exe has no
      // $PWD to interpolate an absolute path with (AHQ-211). The runner must
      // hand ABSOLUTE paths on to the workflow program.
      const { status, stdout } = runRunner(
        [
          '--build-mode=prebuilt',
          '--ahq-package-root=.',
          '--workflow-dir=prebuilt-workflow',
          `--workflow-js=${ECHO_ARGV_WORKFLOW_JS}`,
        ],
        testRunDir
      );

      expect(status).toBe(0);
      const forwardedArgs = JSON.parse(stdout.trim()) as string[];
      expect(forwardedArgs).toEqual(['--build-mode=prebuilt', `--ahq-package-root=${testRunDir}`]);
    },
    TEST_TIMEOUT_MS
  );

  it(
    'should run the Workflow Build (2) then execute in build-first mode, never creating release/',
    () => {
      const repoReleaseDir = path.join(repoRoot, 'release');
      const releaseExistedBefore = fs.existsSync(repoReleaseDir);

      const { status, stdout } = runRunner([
        '--build-mode=build-first',
        `--ahq-package-root=${repoRoot}`,
        `--workflow-dir=${buildFirstWorkflowDir}`,
        `--workflow-js=${ECHO_ARGV_WORKFLOW_JS}`,
        '--marker-arg=echo-me',
      ]);

      expect(status).toBe(0);

      // The Workflow Build (2) ran: compiled output + the framework symlink
      expect(fs.existsSync(path.join(buildFirstWorkflowDir, ECHO_ARGV_WORKFLOW_JS))).toBe(true);
      const frameworkLink = path.join(buildFirstWorkflowDir, 'node_modules', 'agentic-hq');
      expect(fs.lstatSync(frameworkLink).isSymbolicLink()).toBe(true);
      // realpath, not readlink: on Windows the link is a junction, which
      // readlinks as an NT path (`\\?\C:\...`) — AHQ-211 D3
      expect(fs.realpathSync(frameworkLink)).toBe(fs.realpathSync(repoRoot));

      // The freshly compiled program ran and received the forwarded params
      const stdoutLines = stdout.trim().split('\n');
      const forwardedArgs = JSON.parse(stdoutLines[stdoutLines.length - 1]) as string[];
      expect(forwardedArgs).toEqual([
        '--build-mode=build-first',
        `--ahq-package-root=${repoRoot}`,
        '--marker-arg=echo-me',
      ]);

      // The runner never builds the framework or stages a release tree
      expect(stdout).not.toContain('build-release');
      expect(fs.existsSync(path.join(buildFirstWorkflowDir, 'release'))).toBe(false);
      expect(fs.existsSync(repoReleaseDir)).toBe(releaseExistedBefore);
    },
    BUILD_FIRST_TEST_TIMEOUT_MS
  );
});

/**
 * E2E Test: Prebuilt npm tarball install runs the math workflow (AHQ-196,
 * re-pointed at the staged release tree by AHQ-197)
 *
 * The AHQ-195 tracer bullet: proves a prebuilt, READ-ONLY agentic-hq package
 * installed from an npm tarball runs a shipped workflow end-to-end with the
 * cloned repo out of the picture:
 * 1. Setup: `pnpm build` (assembles the staged release/ tree) → `pnpm pack`
 *    FROM release/ → `npm install -g --prefix <temp/AHQ-196/…>`
 * 2. Assert the artifact shape is right: the tarball's manifest is the single
 *    GENERATED one (no pack-time overrides), only intended files ship (no
 *    io-files/test-plugin/dev-config leak class), no nested package.json
 *    shadows Node package self-reference, shipped scripts are executable
 * 3. Run the INSTALLED bin's `agentic-hq list` from a clean temp workspace
 * 4. Run a full math workflow (3 real Claude steps: x2, +3, /5) from a clean
 *    temp workspace; assert the output number, the io-files in the USER
 *    workspace, and that nothing was written inside the installed package
 *
 * Modeled on cross-workspace-demo-math-workflow-gives-expected-output-number
 * (same timeout/diagnostic pattern), but invoking the installed package's bin
 * by absolute path instead of the globally-linked dev binary.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-196
 * See: https://agentic-hq.atlassian.net/browse/AHQ-197
 */

import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, it, expect, beforeAll } from 'vitest';

import { hashTree } from '../../helpers/file-tree-helper-functions.js';
import { runCliAndLogOutput } from '../helpers/cli-test-helper-functions.js';

const SETUP_TIMEOUT_MS = 600_000; // build + pack + npm registry install
const FAST_TEST_TIMEOUT_MS = 60_000; // no Claude invocation
const MATH_RUN_TIMEOUT_MS = 1000_000; // 3 real Claude steps: claude can be really slow
const MATH_LOG_FILE_LABEL = 'prebuilt-tarball-math-workflow';
const MATH_LOG_FILE_PATH = `/tmp/e2e-${MATH_LOG_FILE_LABEL}.log`;

// Test data constants (11 x2=22, +3=25, /5=5)
const TEST_INPUT_NUMBER = 11;
const EXPECTED_OUTPUT_NUMBER = 5;

// Paths
const TEMP_WORKSPACES_BASE = '/tmp/agentic-hq-test-workspaces';
const IO_FILES_DIR_PREFIX = 'io-files-';
const COMMAND_INPUT_FILENAME = 'command-input.json';
const COMMAND_OUTPUT_FILENAME = 'command-output.json';

// The prebuilt artifact shape the GENERATED release manifest must carry
const EXPECTED_BIN = { 'agentic-hq': 'bin/agentic-hq-prebuilt.cjs' };
const EXPECTED_EXPORTS = {
  './tools/claude-code': './dist/src/tools/marshalled-io-tools/claude-code/index.js',
};
const COMPILED_WORKFLOW_JS_RELATIVE_PATH =
  'dist/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.js';

// Leak-class boundary: exactly what the staged release tree ships, nothing else
const EXPECTED_TARBALL_TOP_LEVEL = [
  '.agentic-hq',
  'LICENSE',
  'README.md',
  'bin',
  'dist',
  'package.json',
  'scripts',
];
const EXPECTED_SHIPPED_PLUGINS = [
  'agentic-hq-core-plugin',
  'agentic-hq-demos-plugin',
  'agentic-hq-utilities-plugin',
];

interface PackageManifest {
  name?: string;
  version?: string;
  type?: string;
  private?: boolean;
  bin?: Record<string, string>;
  exports?: Record<string, string>;
  files?: string[];
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  packageManager?: string;
  publishConfig?: {
    bin?: Record<string, string>;
    exports?: Record<string, string>;
    executableFiles?: string[];
  };
}

/** Recursively list every file under rootDir as sorted relative paths. */
function listFilesRecursively(rootDir: string): string[] {
  const files: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else {
        files.push(path.relative(rootDir, entryPath));
      }
    }
  };
  walk(rootDir);
  return files.sort();
}

/** Create a unique, empty workspace directory a brand-new user might run from. */
function createCleanWorkspace(): string {
  const workspace = path.join(TEMP_WORKSPACES_BASE, `test-ws-${randomUUID()}`);
  fs.mkdirSync(workspace, { recursive: true });
  return workspace;
}

describe('Prebuilt npm tarball install runs math workflow (AHQ-196)', () => {
  const repoRoot = process.cwd();
  // temp/AHQ-196 is the human-approved scratch tree for this ticket's tarball installs
  const runDir = path.join(
    repoRoot,
    'temp',
    'AHQ-196',
    `e2e-tarball-${Date.now()}_${randomUUID()}`
  );
  const installPrefix = path.join(runDir, 'install-prefix');
  const installedPackageRoot = path.join(installPrefix, 'lib', 'node_modules', 'agentic-hq');
  const installedBinPath = path.join(installPrefix, 'bin', 'agentic-hq');

  let rootManifest: PackageManifest;
  let tarballManifest: PackageManifest;
  let tarballFileList: string[];
  let installedPackageHashes: Record<string, string>;

  beforeAll(() => {
    fs.mkdirSync(runDir, { recursive: true });

    // Build the package (compiles the CLI graph + the math workflow and stages
    // the release/ tree with its generated manifest)
    runCliAndLogOutput('pnpm build', 'prebuilt-tarball-build', SETUP_TIMEOUT_MS, repoRoot);

    // Pack the tarball FROM the staged release tree — its manifest is literal,
    // so no pack-time override mechanism is involved any more
    const releaseDir = path.join(repoRoot, 'release');
    runCliAndLogOutput(
      `pnpm pack --pack-destination "${runDir}"`,
      'prebuilt-tarball-pack',
      SETUP_TIMEOUT_MS,
      releaseDir
    );
    const tarballs = fs.readdirSync(runDir).filter((entry) => entry.endsWith('.tgz'));
    expect(tarballs).toHaveLength(1);
    const tarballPath = path.join(runDir, tarballs[0]);

    // The source manifest the generated one is derived from — the shared
    // fields must match it, never be hand-maintained copies that could drift
    rootManifest = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf-8')
    ) as PackageManifest;

    // The tarball's ACTUAL manifest and file list — asserted on directly,
    // never inferred from the staging step
    tarballManifest = JSON.parse(
      execSync(`tar -xOzf "${tarballPath}" package/package.json`, { encoding: 'utf-8' })
    ) as PackageManifest;
    tarballFileList = execSync(`tar -tzf "${tarballPath}"`, { encoding: 'utf-8' })
      .split('\n')
      .filter((entry) => entry.startsWith('package/'))
      .map((entry) => entry.slice('package/'.length))
      .filter((entry) => entry.length > 0)
      .sort();

    // Install the tarball the way npm would install from the registry
    runCliAndLogOutput(
      `npm install -g --prefix "${installPrefix}" "${tarballPath}"`,
      'prebuilt-tarball-npm-install',
      SETUP_TIMEOUT_MS,
      repoRoot
    );

    // Snapshot the installed package's content (relative path → SHA-256) — the
    // math run must not change it
    installedPackageHashes = hashTree(installedPackageRoot);
  }, SETUP_TIMEOUT_MS);

  it(
    'should ship the prebuilt artifact shape: generated manifest, only intended files, no shadowing manifests, executable plugin scripts',
    () => {
      // The tarball carries the GENERATED release manifest: prebuilt bin and
      // compiled-JS exports written in directly (no pack-time override
      // mechanism), with no .ts targets anywhere
      expect(tarballManifest.name).toBe('agentic-hq');
      expect(tarballManifest.type).toBe('module');
      expect(tarballManifest.bin).toEqual(EXPECTED_BIN);
      expect(tarballManifest.exports).toEqual(EXPECTED_EXPORTS);
      for (const exportTarget of Object.values(tarballManifest.exports ?? {})) {
        expect(exportTarget).not.toMatch(/\.ts$/);
      }

      // Shared fields are derived from the root manifest (one source of truth)
      expect(tarballManifest.version).toBe(rootManifest.version);
      expect(tarballManifest.dependencies).toEqual(rootManifest.dependencies);
      expect(tarballManifest.engines?.node).toBe(rootManifest.engines?.node);

      // Dev-only and interim-mechanism fields must NOT ship: no files
      // whitelist, no publishConfig bin/exports overrides, no devDependencies,
      // no packageManager, no engines.pnpm
      expect(tarballManifest.files).toBeUndefined();
      expect(tarballManifest.publishConfig?.bin).toBeUndefined();
      expect(tarballManifest.publishConfig?.exports).toBeUndefined();
      expect(tarballManifest.devDependencies).toBeUndefined();
      expect(tarballManifest.packageManager).toBeUndefined();
      expect(tarballManifest.engines?.pnpm).toBeUndefined();

      // The generated manifest carries the exec-bit mechanism: exact shipped
      // shell-script paths enumerated from the staged tree (pnpm-specific
      // publishConfig.executableFiles — globs are silently ignored, AHQ-196)
      const executableFiles = tarballManifest.publishConfig?.executableFiles ?? [];
      expect(executableFiles.length).toBeGreaterThan(0);
      for (const executableFile of executableFiles) {
        expect(executableFile).toMatch(/^\.agentic-hq\/plugins\/.+\.sh$/);
        expect(tarballFileList).toContain(executableFile);
      }

      // Leak-class boundary: the tarball's top level is exactly the staged
      // release tree — no io-files, no test plugin, no dev configs, no
      // pnpm-only files, no node_modules
      const tarballTopLevel = [
        ...new Set(tarballFileList.map((file) => file.split('/')[0])),
      ].sort();
      expect(tarballTopLevel).toEqual(EXPECTED_TARBALL_TOP_LEVEL);
      const dotAgenticHqEntries = tarballFileList.filter((file) => file.startsWith('.agentic-hq/'));
      expect(dotAgenticHqEntries.length).toBeGreaterThan(0);
      for (const entry of dotAgenticHqEntries) {
        expect(entry).toMatch(/^\.agentic-hq\/plugins\//);
      }
      const shippedPlugins = [
        ...new Set(dotAgenticHqEntries.map((entry) => entry.split('/')[2])),
      ].sort();
      expect(shippedPlugins).toEqual(EXPECTED_SHIPPED_PLUGINS);
      expect(tarballFileList.filter((file) => file.startsWith('scripts/'))).toEqual([
        'scripts/run-workflow.cjs',
      ]);
      for (const file of tarballFileList) {
        expect(file).not.toMatch(/(^|\/)node_modules\//);
      }

      // The compiled workflow JS shipped in the install
      const compiledWorkflowJsPath = path.join(
        installedPackageRoot,
        COMPILED_WORKFLOW_JS_RELATIVE_PATH
      );
      expect(fs.existsSync(compiledWorkflowJsPath)).toBe(true);

      // No package.json ANYWHERE between the compiled workflow JS and the
      // package root: the compiled JS resolves 'agentic-hq/tools/claude-code'
      // via Node package self-reference against the nearest ancestor manifest,
      // which must be the package root's GENERATED manifest itself — any
      // manifest below it would shadow that resolution (AHQ-197 retired the
      // interim dist/package.json that used to sit in between)
      let dir = path.dirname(compiledWorkflowJsPath);
      while (dir !== installedPackageRoot) {
        expect(
          fs.existsSync(path.join(dir, 'package.json')),
          `unexpected nested package.json at ${dir} would shadow the package-root manifest self-reference`
        ).toBe(false);
        dir = path.dirname(dir);
      }

      // Every shipped plugin shell script must be executable: skills invoke them
      // directly at runtime (e.g. self-termination's kill script), and the packer
      // records non-bin files without their execute bit — the package's install
      // step must restore it
      const pluginsRoot = path.join(installedPackageRoot, '.agentic-hq', 'plugins');
      const shippedShellScripts = listFilesRecursively(pluginsRoot).filter((file) =>
        file.endsWith('.sh')
      );
      expect(shippedShellScripts.length).toBeGreaterThan(0);
      for (const script of shippedShellScripts) {
        const mode = fs.statSync(path.join(pluginsRoot, script)).mode;
        expect(mode & 0o100, `${script} must have the owner-execute bit`).toBeTruthy();
      }
    },
    FAST_TEST_TIMEOUT_MS
  );

  it(
    'should list workflows via the installed bin from a clean workspace',
    () => {
      const workspace = createCleanWorkspace();

      const output = runCliAndLogOutput(
        `"${installedBinPath}" list`,
        'prebuilt-tarball-list',
        FAST_TEST_TIMEOUT_MS,
        workspace
      );

      // Title line proves the compiled CLI ran; the math workflow's list entry
      // (short command + description, matching the cross-workspace-list-workflows
      // assertion pattern) proves plugin discovery ran against the INSTALLED
      // package's .agentic-hq/plugins tree
      expect(output).toContain('Available workflows');
      expect(output).toContain('agentic-hq math');
      expect(output).toContain('Passes a number through three chained math steps');
    },
    FAST_TEST_TIMEOUT_MS
  );

  it(
    'should run the full math workflow from a clean workspace and leave the installed package unchanged',
    () => {
      const workspace = createCleanWorkspace();

      // Act — run the installed bin exactly as a brand-new npm user would
      const command = `"${installedBinPath}" math -- --input-number=${TEST_INPUT_NUMBER}`;

      let output: string;
      try {
        output = runCliAndLogOutput(command, MATH_LOG_FILE_LABEL, MATH_RUN_TIMEOUT_MS, workspace);
      } catch (error) {
        // Check if this is a timeout error (ETIMEDOUT) — likely caused by Claude
        // waiting for permission to use a tool not in ALLOWED_TOOLS
        const isTimeout =
          error instanceof Error &&
          (error.message.includes('ETIMEDOUT') ||
            (error.cause instanceof Error && error.cause.message.includes('ETIMEDOUT')));

        if (isTimeout) {
          process.stdout.write(
            '\n' +
              '╔═══════════════════════════════════════════════════════════════════════════╗\n' +
              '║  🔴 TEST TIMED OUT — LIKELY CAUSE: Claude is waiting for permission      ║\n' +
              '╠═══════════════════════════════════════════════════════════════════════════╣\n' +
              '║                                                                           ║\n' +
              `║  Timeout after: ${MATH_RUN_TIMEOUT_MS / 1000} seconds\n` +
              `║  Log file: ${MATH_LOG_FILE_PATH}\n` +
              '║                                                                           ║\n' +
              '║  The most likely reason is that Claude Code is waiting for permission     ║\n' +
              '║  to use a tool that is not in the ALLOWED_TOOLS list.                    ║\n' +
              '║                                                                           ║\n' +
              '║  TO FIX: Check src/tools/claude-code/claude-command-builder.ts            ║\n' +
              '║  constant to see if a required tool is missing, then re-run this test.   ║\n' +
              '║                                                                           ║\n' +
              '║  Check the log file for details:                                          ║\n' +
              `║    cat ${MATH_LOG_FILE_PATH}\n` +
              '╚═══════════════════════════════════════════════════════════════════════════╝\n' +
              '\n'
          );
        }
        throw error;
      }

      // Assert — expected output number appears in output
      expect(output).toContain(`Output number: ${EXPECTED_OUTPUT_NUMBER}`);

      // Assert — io-files were marshalled under the USER workspace
      const commandIoDir = path.join(
        workspace,
        '.agentic-hq',
        'temp',
        'command-input-output-files'
      );
      expect(fs.existsSync(commandIoDir)).toBe(true);
      const ioSubdirs = fs
        .readdirSync(commandIoDir)
        .filter((entry) => entry.startsWith(IO_FILES_DIR_PREFIX));
      expect(ioSubdirs.length).toBeGreaterThanOrEqual(1);
      const firstIoDir = path.join(commandIoDir, ioSubdirs[0]);
      expect(fs.existsSync(path.join(firstIoDir, COMMAND_INPUT_FILENAME))).toBe(true);
      expect(fs.existsSync(path.join(firstIoDir, COMMAND_OUTPUT_FILENAME))).toBe(true);

      // Assert — the installed package is READ-ONLY at runtime: no file was
      // added, removed, or modified in place during the full workflow run
      // (relative-path → SHA-256 map compares both the set of files and their bytes)
      expect(hashTree(installedPackageRoot)).toEqual(installedPackageHashes);

      // Log — temp workspace won't be cleaned (auto-cleaned by OS from /tmp)
      process.stdout.write(
        `\nTemp workspace created at: ${workspace}\n` +
          `Tarball install kept at: ${runDir}\n` +
          "Not cleaning up — temp/AHQ-196 is this ticket's gitignored scratch tree.\n"
      );
    },
    MATH_RUN_TIMEOUT_MS
  );
});

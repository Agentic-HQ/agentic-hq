/**
 * E2E Test: Prebuilt npm tarball install runs the math workflow (AHQ-196)
 *
 * The AHQ-195 tracer bullet: proves a prebuilt, READ-ONLY agentic-hq package
 * installed from an npm tarball runs a shipped workflow end-to-end with the
 * cloned repo out of the picture:
 * 1. Setup: `pnpm build` → `pnpm pack` → `npm install -g --prefix <temp/AHQ-196/…>`
 * 2. Assert the artifact shape is right (pack-time publishConfig overrides really
 *    applied; no nested package.json shadows Node package self-reference)
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
 */

import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, it, expect, beforeAll } from 'vitest';

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

// The prebuilt artifact shape the pack-time publishConfig overrides must produce
const EXPECTED_BIN = { 'agentic-hq': 'bin/agentic-hq-prebuilt.cjs' };
const EXPECTED_EXPORTS = {
  './tools/claude-code': './dist/src/tools/marshalled-io-tools/claude-code/index.js',
};
const COMPILED_WORKFLOW_JS_RELATIVE_PATH =
  'dist/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.js';

interface TarballManifest {
  bin?: Record<string, string>;
  exports?: Record<string, string>;
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

  let tarballManifest: TarballManifest;
  let installedFileListing: string[];

  beforeAll(() => {
    fs.mkdirSync(runDir, { recursive: true });

    // Build the package (compiles the CLI graph + the math workflow to dist/)
    runCliAndLogOutput('pnpm build', 'prebuilt-tarball-build', SETUP_TIMEOUT_MS, repoRoot);

    // Pack the tarball — pnpm pack, NOT npm pack: only pnpm applies the
    // publishConfig bin/exports overrides at pack time (approved plan decision)
    runCliAndLogOutput(
      `pnpm pack --pack-destination "${runDir}"`,
      'prebuilt-tarball-pack',
      SETUP_TIMEOUT_MS,
      repoRoot
    );
    const tarballs = fs.readdirSync(runDir).filter((entry) => entry.endsWith('.tgz'));
    expect(tarballs).toHaveLength(1);
    const tarballPath = path.join(runDir, tarballs[0]);

    // The tarball's ACTUAL manifest — asserted on directly, never inferred from
    // the source package.json (proves the pack-time overrides really applied)
    tarballManifest = JSON.parse(
      execSync(`tar -xOzf "${tarballPath}" package/package.json`, { encoding: 'utf-8' })
    ) as TarballManifest;

    // Install the tarball the way npm would install from the registry
    runCliAndLogOutput(
      `npm install -g --prefix "${installPrefix}" "${tarballPath}"`,
      'prebuilt-tarball-npm-install',
      SETUP_TIMEOUT_MS,
      repoRoot
    );

    // Snapshot the installed package's file listing — the math run must not change it
    installedFileListing = listFilesRecursively(installedPackageRoot);
  }, SETUP_TIMEOUT_MS);

  it(
    'should ship the prebuilt artifact shape: overridden bin/exports and no nested package.json shadowing self-reference',
    () => {
      // The pack-time publishConfig overrides applied: bin points at the prebuilt
      // wrapper and exports at compiled dist JS, with no .ts targets anywhere
      expect(tarballManifest.bin).toEqual(EXPECTED_BIN);
      expect(tarballManifest.exports).toEqual(EXPECTED_EXPORTS);
      for (const exportTarget of Object.values(tarballManifest.exports ?? {})) {
        expect(exportTarget).not.toMatch(/\.ts$/);
      }

      // The compiled workflow JS shipped in the install
      const compiledWorkflowJsPath = path.join(
        installedPackageRoot,
        COMPILED_WORKFLOW_JS_RELATIVE_PATH
      );
      expect(fs.existsSync(compiledWorkflowJsPath)).toBe(true);

      // No package.json on the directory path between the compiled workflow JS and
      // the package root — a nested manifest there would shadow Node package
      // self-reference and break the 'agentic-hq/tools/claude-code' import
      let dir = path.dirname(compiledWorkflowJsPath);
      while (dir !== installedPackageRoot) {
        expect(
          fs.existsSync(path.join(dir, 'package.json')),
          `unexpected nested package.json at ${dir} would shadow package self-reference`
        ).toBe(false);
        dir = path.dirname(dir);
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

      // Assert — the installed package is READ-ONLY at runtime: its file listing
      // is unchanged after the full workflow run
      expect(listFilesRecursively(installedPackageRoot)).toEqual(installedFileListing);

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

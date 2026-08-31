/**
 * E2E Test: Prebuilt npm tarball install runs the math workflow (AHQ-196,
 * re-pointed at the staged release tree by AHQ-197, moved onto the two-builds
 * design by AHQ-208 — the shipped set now also includes string-reversal and a
 * one-Claude-step reversal run; file name kept, it is referenced by
 * package.json and the publish checklist)
 *
 * The AHQ-195 tracer bullet: proves a prebuilt, READ-ONLY agentic-hq package
 * installed from an npm tarball runs shipped workflows end-to-end with the
 * cloned repo out of the picture:
 * 1. Setup: buildPackAndInstallTarball — `pnpm build` (Framework Build (1) +
 *    Workflow Build (2) per shipped migrated workflow, staged into release/)
 *    → `pnpm pack` FROM release/ → `npm install -g --prefix <temp/test-scratch/…>`
 * 2. Assert the artifact shape is right: the tarball's manifest is the single
 *    GENERATED one (no pack-time overrides), only intended files ship (no
 *    io-files/test-plugin/dev-config leak class, no per-workflow install
 *    files inside any ts-workflow/), no nested package.json shadows Node
 *    package self-reference, no shell scripts ship at all (since AHQ-211
 *    Phase 5 replaced the last one with a Node script)
 * 3. Run the INSTALLED bin's `agentic-hq list` from a clean temp workspace
 * 4. Run a full math workflow (3 real Claude steps: x2, +3, /5) and a
 *    string-reversal (1 real Claude step) from clean temp workspaces; assert
 *    the outputs, the io-files in the USER workspace, and that nothing was
 *    written inside the installed package
 *
 * Windows: this suite is SKIPPED — its setup packs the release tree, which
 * the prepack guard refuses on win32 (publish-from-Mac policy, AHQ-211).
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-196
 * See: https://agentic-hq.atlassian.net/browse/AHQ-208
 */

import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, it, expect, beforeAll } from 'vitest';

import { hashTree } from '../../helpers/file-tree-helper-functions.js';
import { getLogFilePath, runCliAndLogOutput } from '../helpers/cli-test-helper-functions.js';
import {
  ALLOW_SCRIPTS_FLAG,
  buildPackAndInstallTarball,
} from '../helpers/tarball-install-helper-functions.js';

// 900s, not 600s: Windows needs headroom for build + pack + npm registry
// install (Defender real-time scanning slows file-heavy steps — AHQ-211)
const SETUP_TIMEOUT_MS = 900_000;
const FAST_TEST_TIMEOUT_MS = 60_000; // no Claude invocation
const HOISTED_INSTALL_TIMEOUT_MS = 120_000; // one extra npm install of the tarball
const MATH_RUN_TIMEOUT_MS = 1000_000; // 3 real Claude steps: claude can be really slow
const REVERSAL_RUN_TIMEOUT_MS = 600_000; // 1 real Claude step
const MATH_LOG_FILE_LABEL = 'prebuilt-tarball-math-workflow';
const MATH_LOG_FILE_PATH = getLogFilePath(MATH_LOG_FILE_LABEL);
const REVERSAL_LOG_FILE_LABEL = 'prebuilt-tarball-string-reversal';

// Test data constants (11 x2=22, +3=25, /5=5)
const TEST_INPUT_NUMBER = 11;
const EXPECTED_OUTPUT_NUMBER = 5;
const TEST_INPUT_STRING = 'tarball install test';
const EXPECTED_REVERSED_STRING = 'tset llatsni llabrat';

// Paths — under os.tmpdir(), never a hardcoded /tmp: /tmp does not exist on
// Windows, where the literal path silently created C:\tmp instead (AHQ-211)
const TEMP_WORKSPACES_BASE = path.join(os.tmpdir(), 'agentic-hq-test-workspaces');
const IO_FILES_DIR_PREFIX = 'io-files-';
const COMMAND_INPUT_FILENAME = 'command-input.json';
const COMMAND_OUTPUT_FILENAME = 'command-output.json';

// The prebuilt artifact shape the GENERATED release manifest must carry —
// types resolve from the shipped .d.ts, runtime from the compiled JS (AHQ-208)
const EXPECTED_BIN = { 'agentic-hq': 'bin/agentic-hq-prebuilt.cjs' };
const EXPECTED_EXPORTS = {
  './tools/claude-code': {
    types: './dist/src/tools/marshalled-io-tools/claude-code/index.d.ts',
    default: './dist/src/tools/marshalled-io-tools/claude-code/index.js',
  },
};
// Each shipped migrated workflow's compiled JS, which since AHQ-208 lives
// inside the workflow's own ts-workflow/dist/
// FUTURE REFACTOR: this should be derived from the shipped workflows' package.json exports and same for the EXPECTED_SHIPPED_SKILLS_BY_PLUGIN below.
const COMPILED_WORKFLOW_JS_RELATIVE_PATHS = [
  '.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/dist/create-workflow-cli.js',
  '.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature-detailed-example/ts-workflow/dist/add-feature-detailed-example-cli.js',
  '.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ts-workflow/dist/add-feature-cli.js',
  '.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/dist/full-jira-tdd-story-workflow-cli.js',
  '.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/dist/math-workflow-cli.js',
  '.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/dist/quick-jira-workflow-cli.js',
  '.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/dist/string-reversal-cli.js',
];
// Per-workflow install files must NOT ship inside any ts-workflow/ (AHQ-208
// stripped layout): a stray ts-workflow/package.json would also shadow the
// package-root manifest for Node package self-reference
const STRIPPED_TS_WORKFLOW_FILE_NAMES = [
  'package.json',
  'pnpm-lock.yaml',
  '.npmrc',
  'pnpm-workspace.yaml',
];

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

// Shipped-skills boundary (AHQ-198, completed by AHQ-209): all seven
// workflows ship — any skill missing from this map, or any new skill
// shipping without this list being updated, fails the publish safety net.
// The utilities plugin has no skills/ directory, so it must not appear here.
const EXPECTED_SHIPPED_SKILLS_BY_PLUGIN: Record<string, string[]> = {
  'agentic-hq-core-plugin': ['create-workflow', 'self-termination'],
  'agentic-hq-demos-plugin': [
    'add-feature',
    'add-feature-detailed-example',
    'full-jira-tdd-story-workflow',
    'math-workflow',
    'quick-jira-workflow',
    'string-reversal',
  ],
};

// Every shipped workflow must surface in the installed `agentic-hq list`
// output — discovery is filesystem-driven against the installed tree.
// Substrings match how each workflow actually renders in the listing.
const SHIPPED_WORKFLOW_LIST_SUBSTRINGS = [
  'quick-jira',
  'full-jira',
  'add-feature-detailed-example',
  'create-workflow',
];

// The two skill-less draft command dirs are dev-only notes and must not ship
// (AHQ-209 Q4(b)) — they have no skill, so they could never run from an
// install anyway.
const EXCLUDED_DRAFT_COMMAND_DIR_PREFIXES = [
  '.agentic-hq/plugins/agentic-hq-demos-plugin/commands/DRAFT-oo-refactoring-workflow/',
  '.agentic-hq/plugins/agentic-hq-demos-plugin/commands/research-plan-implement/',
];

interface PackageManifest {
  name?: string;
  version?: string;
  type?: string;
  private?: boolean;
  bin?: Record<string, string>;
  exports?: Record<string, string | Record<string, string>>;
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

// Skipped on Windows BY POLICY, not as a gap: the setup packs the release
// tree, which the prepack guard refuses on win32 (NTFS has no exec bits —
// publish from Mac now, from CI later, never from Windows; AHQ-211). Without
// the skip this suite would build for minutes and then die at the guard.
const describeSkippedOnWindows = describe.skipIf(process.platform === 'win32');

describeSkippedOnWindows('Prebuilt npm tarball install runs math workflow (AHQ-196)', () => {
  const repoRoot = process.cwd();
  // temp/test-scratch is the tests' gitignored scratch tree for tarball installs
  const runDir = path.join(
    repoRoot,
    'temp',
    'test-scratch',
    `e2e-tarball-${Date.now()}_${randomUUID()}`
  );
  let rootManifest: PackageManifest;
  let tarballManifest: PackageManifest;
  let tarballFileList: string[];
  let installedPackageHashes: Record<string, string>;
  let tarballPath: string;
  let installedPackageRoot: string;
  let installedBinPath: string;

  beforeAll(() => {
    // Build → pack FROM release/ → npm install into an isolated prefix
    // (shared with the user-workspace fixture e2e). The helper owns the
    // platform-specific `npm -g --prefix` layout (POSIX lib/node_modules +
    // bin/ vs win32 node_modules + .cmd shim — AHQ-211)
    ({ tarballPath, installedPackageRoot, installedBinPath } = buildPackAndInstallTarball(runDir));

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

    // Snapshot the installed package's content (relative path → SHA-256) — the
    // workflow runs must not change it
    installedPackageHashes = hashTree(installedPackageRoot);
  }, SETUP_TIMEOUT_MS);

  it(
    'should ship the prebuilt artifact shape: generated manifest, only intended files, no shadowing manifests, no shell scripts',
    () => {
      // The tarball carries the GENERATED release manifest: prebuilt bin and
      // compiled-JS exports written in directly (no pack-time override
      // mechanism), with no .ts targets anywhere
      expect(tarballManifest.name).toBe('agentic-hq');
      expect(tarballManifest.type).toBe('module');
      expect(tarballManifest.bin).toEqual(EXPECTED_BIN);
      expect(tarballManifest.exports).toEqual(EXPECTED_EXPORTS);
      // No .ts source targets anywhere — a `types` condition pointing at a
      // shipped .d.ts is the one allowed .ts-suffixed shape (AHQ-208)
      const exportLeafTargets = Object.values(tarballManifest.exports ?? {}).flatMap((target) =>
        typeof target === 'string' ? [target] : Object.values(target)
      );
      for (const exportTarget of exportLeafTargets) {
        if (exportTarget.endsWith('.ts')) {
          expect(exportTarget).toMatch(/\.d\.ts$/);
        }
      }

      // Shared fields are derived from the root manifest (one source of truth)
      expect(tarballManifest.version).toBe(rootManifest.version);
      expect(tarballManifest.dependencies).toEqual(rootManifest.dependencies);
      expect(tarballManifest.engines?.node).toBe(rootManifest.engines?.node);

      // The published manifest is deliberately un-private (AHQ-198): the root
      // manifest keeps private: true permanently as the structural wrong-tree
      // publish block, and the generated release manifest omits the field
      expect(tarballManifest.private).toBeUndefined();

      // Dev-only and interim-mechanism fields must NOT ship: no files
      // whitelist, no publishConfig bin/exports overrides, no devDependencies,
      // no packageManager, no engines.pnpm
      expect(tarballManifest.files).toBeUndefined();
      expect(tarballManifest.publishConfig?.bin).toBeUndefined();
      expect(tarballManifest.publishConfig?.exports).toBeUndefined();
      expect(tarballManifest.devDependencies).toBeUndefined();
      expect(tarballManifest.packageManager).toBeUndefined();
      expect(tarballManifest.engines?.pnpm).toBeUndefined();

      // The generated manifest still carries the exec-bit mechanism
      // (publishConfig.executableFiles enumerated from the staged tree —
      // AHQ-196), but since AHQ-211 Phase 5 replaced the last shipped shell
      // script with a Node kill script the enumerated list is EMPTY and no
      // .sh ships at all. A .sh reappearing here means a shell script
      // sneaked into the shipped set — it must either be ported to Node or
      // deliberately re-added to this publish safety net. (Removing the
      // now-idle machinery entirely is a Phase 7 follow-up candidate.)
      expect(tarballManifest.publishConfig?.executableFiles).toEqual([]);
      expect(tarballFileList.filter((file) => file.endsWith('.sh'))).toEqual([]);

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

      // Shipped-skills boundary: EXACTLY the migrated workflows, per plugin —
      // any excluded skill appearing here, or any new skill shipping without
      // this list being updated, fails the publish safety net
      const shippedSkillsByPlugin: Record<string, string[]> = {};
      for (const entry of tarballFileList) {
        const match = /^\.agentic-hq\/plugins\/([^/]+)\/skills\/([^/]+)\//.exec(entry);
        if (match) {
          const [, plugin, skill] = match;
          shippedSkillsByPlugin[plugin] ??= [];
          if (!shippedSkillsByPlugin[plugin].includes(skill)) {
            shippedSkillsByPlugin[plugin].push(skill);
          }
        }
      }
      for (const skills of Object.values(shippedSkillsByPlugin)) {
        skills.sort();
      }
      expect(shippedSkillsByPlugin).toEqual(EXPECTED_SHIPPED_SKILLS_BY_PLUGIN);
      // The two skill-less draft command dirs never ship (AHQ-209 Q4(b))
      for (const draftDirPrefix of EXCLUDED_DRAFT_COMMAND_DIR_PREFIXES) {
        expect(
          tarballFileList.filter((file) => file.startsWith(draftDirPrefix)),
          `draft command dir ${draftDirPrefix} must not ship`
        ).toEqual([]);
      }
      // Exactly the four scripts the release stages ship (AHQ-208, AHQ-198,
      // AHQ-211): the runner + the Workflow Build it delegates to, plus the two
      // lifecycle scripts the generated manifest invokes (postinstall =
      // node-pty exec-bit repair, prepack = wrong-packer guard) — the rest of
      // scripts/ is dev-machine tooling
      expect(tarballFileList.filter((file) => file.startsWith('scripts/'))).toEqual([
        'scripts/build-workflow.cjs',
        'scripts/postinstall.cjs',
        'scripts/prepack-guard.cjs',
        'scripts/run-workflow.cjs',
      ]);
      for (const file of tarballFileList) {
        expect(file).not.toMatch(/(^|\/)node_modules\//);
      }

      // dist/ ships compiled JS + source maps + declarations and nothing else;
      // tsc's incremental cache never ships (AHQ-208)
      const distFiles = tarballFileList.filter((file) => file.startsWith('dist/'));
      expect(distFiles.length).toBeGreaterThan(0);
      for (const file of distFiles) {
        expect(file).toMatch(/\.(js|js\.map|d\.ts)$/);
      }
      expect(tarballFileList.filter((file) => file.endsWith('.tsbuildinfo'))).toEqual([]);

      // Stripped layout (AHQ-208, doc 01 §11(a) watch-item): per-workflow
      // install files must not ship inside any ts-workflow/
      for (const file of tarballFileList) {
        const segments = file.split('/');
        if (segments.slice(0, -1).includes('ts-workflow')) {
          expect(
            STRIPPED_TS_WORKFLOW_FILE_NAMES,
            `per-workflow install file ${file} must not ship`
          ).not.toContain(segments[segments.length - 1]);
        }
      }

      // Each shipped migrated workflow's compiled JS shipped in the install,
      // with no package.json ANYWHERE between it and the package root: the
      // compiled JS resolves 'agentic-hq/tools/claude-code' via Node package
      // self-reference against the nearest ancestor manifest, which must be
      // the package root's GENERATED manifest itself — any manifest below it
      // would shadow that resolution
      for (const compiledWorkflowJsRelativePath of COMPILED_WORKFLOW_JS_RELATIVE_PATHS) {
        const compiledWorkflowJsPath = path.join(
          installedPackageRoot,
          compiledWorkflowJsRelativePath
        );
        expect(fs.existsSync(compiledWorkflowJsPath), compiledWorkflowJsRelativePath).toBe(true);

        let dir = path.dirname(compiledWorkflowJsPath);
        while (dir !== installedPackageRoot) {
          expect(
            fs.existsSync(path.join(dir, 'package.json')),
            `unexpected nested package.json at ${dir} would shadow the package-root manifest self-reference`
          ).toBe(false);
          dir = path.dirname(dir);
        }
      }

      // No shell script reaches the installed tree either (the runtime-invoked
      // scripts are all Node since AHQ-211 Phase 5 — nothing needs an exec
      // bit, which is also what makes the install work on Windows/NTFS)
      const pluginsRoot = path.join(installedPackageRoot, '.agentic-hq', 'plugins');
      const installedShellScripts = listFilesRecursively(pluginsRoot).filter((file) =>
        file.endsWith('.sh')
      );
      expect(installedShellScripts).toEqual([]);
    },
    FAST_TEST_TIMEOUT_MS
  );

  it(
    'should leave node-pty spawn-helper executable when the tarball is installed as a hoisted dependency (npx-style layout)',
    () => {
      // npx and project-local installs HOIST node-pty to a sibling of
      // agentic-hq (unlike global installs, which nest it inside the package),
      // and npm extracts spawn-helper without its execute bit — the
      // postinstall exec-bit repair must reach the hoisted layout too (AHQ-198:
      // 0.1.0's nested-only chmod missed it, so every npx run crashed with
      // "posix_spawnp failed" at the first Claude step)
      const projectDir = path.join(runDir, 'hoisted-install');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'ahq-hoisted-install-check', private: true }, null, 2) + '\n'
      );

      runCliAndLogOutput(
        `npm install ${ALLOW_SCRIPTS_FLAG} "${tarballPath}"`,
        'prebuilt-tarball-hoisted-install',
        HOISTED_INSTALL_TIMEOUT_MS,
        projectDir
      );

      const hoistedPrebuildsDir = path.join(projectDir, 'node_modules', 'node-pty', 'prebuilds');
      expect(
        fs.existsSync(hoistedPrebuildsDir),
        'expected node-pty hoisted to the project root node_modules'
      ).toBe(true);
      const darwinPrebuildDirs = fs
        .readdirSync(hoistedPrebuildsDir)
        .filter((entry) => entry.startsWith('darwin-'));
      expect(darwinPrebuildDirs.length).toBeGreaterThan(0);
      for (const prebuildDir of darwinPrebuildDirs) {
        const spawnHelperPath = path.join(hoistedPrebuildsDir, prebuildDir, 'spawn-helper');
        const mode = fs.statSync(spawnHelperPath).mode;
        expect(mode & 0o100, `${spawnHelperPath} must have the owner-execute bit`).toBeTruthy();
      }
    },
    HOISTED_INSTALL_TIMEOUT_MS
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

      // add-feature ships. 'agentic-hq add-feature' is a substring of the
      // detailed-example's command line (also shipped since AHQ-209), so the
      // description line is what proves the plain add-feature entry rendered
      expect(output).toContain('agentic-hq add-feature');
      expect(output).toContain(
        'Add a small feature using a simple four-stage research/plan/implement/review workflow'
      );

      // string-reversal ships again since AHQ-208 (it lists under the short
      // command `agentic-hq reversal`)
      expect(output).toContain('agentic-hq reversal');

      // All four workflows AHQ-209 migrated must render in the installed
      // listing too — the shipped set is all seven
      for (const shippedSubstring of SHIPPED_WORKFLOW_LIST_SUBSTRINGS) {
        expect(output).toContain(shippedSubstring);
      }
    },
    FAST_TEST_TIMEOUT_MS
  );

  it(
    'should run the string-reversal workflow from a clean workspace via the installed bin',
    () => {
      const workspace = createCleanWorkspace();

      const output = runCliAndLogOutput(
        `"${installedBinPath}" reversal -- --string-to-reverse="${TEST_INPUT_STRING}"`,
        REVERSAL_LOG_FILE_LABEL,
        REVERSAL_RUN_TIMEOUT_MS,
        workspace
      );

      expect(output).toContain(EXPECTED_REVERSED_STRING);

      // The installed package stays READ-ONLY at runtime for this workflow too
      expect(hashTree(installedPackageRoot)).toEqual(installedPackageHashes);
    },
    REVERSAL_RUN_TIMEOUT_MS
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
          "Not cleaning up — temp/test-scratch is the tests' gitignored scratch tree.\n"
      );
    },
    MATH_RUN_TIMEOUT_MS
  );
});

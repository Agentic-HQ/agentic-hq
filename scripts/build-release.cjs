#!/usr/bin/env node
/**
 * Shared release build (AHQ-197, reworked onto the two-builds design by AHQ-208)
 *
 * The single build script behind `pnpm build`: runs the Framework Build (1)
 * and a Workflow Build (2) per shipped migrated workflow, then assembles the
 * staged release tree — a directory (`release/`) holding EXACTLY what ships,
 * under a single generated manifest. `release/` is PUBLISH-ONLY: nothing
 * executes from it any more (dev runs execute `<repo>/dist` via the
 * agentic-hq-dev wrapper; workflows execute their own `ts-workflow/dist`).
 * Packing runs from inside `release/`, so there is no pack-time override
 * mechanism and no `files` whitelist: what is staged is what ships.
 *
 * Steps:
 *   1. Clean:   rm -rf release/ AND dist/ — a clean Framework Build every
 *               time (belt-and-braces determinism)
 *   2. Framework Build (1): tsc -p tsconfig.build.json → dist/ (JS + .d.ts
 *               + source maps)
 *   3. Workflow Build (2) for each shipped migrated workflow's ts-workflow/
 *               via scripts/build-workflow.cjs → ts-workflow/dist/
 *   4. Stage:   release/dist ← dist/ minus .tsbuildinfo; the prebuilt bin
 *               wrapper; the runner + workflow-build scripts; the shipped
 *               plugins (minus node_modules and, inside any ts-workflow/,
 *               the per-workflow install files); README/LICENSE
 *   5. Manifest: generate release/package.json from the root package.json —
 *               one source of truth, transformed, never hand-maintained
 *
 * Failures throw uncaught with a full stack trace, per this repo's
 * catastrophic-failure convention.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const releaseDir = path.join(repoRoot, 'release');
const distDir = path.join(repoRoot, 'dist');

// Only these plugins ship — steve-test-plugin and any other local plugin stay dev-only
const SHIPPED_PLUGINS = [
  'agentic-hq-core-plugin',
  'agentic-hq-demos-plugin',
  'agentic-hq-utilities-plugin',
];

// AHQ-209 Q4(b): the two skill-less draft command dirs are dev-only notes —
// they have no skill, so they could never run from an install. Dev mode is
// untouched: dev discovery reads the repo plugins tree, never the staged one.
const EXCLUDED_DRAFT_COMMAND_DIRS = [
  'agentic-hq-demos-plugin/commands/DRAFT-oo-refactoring-workflow',
  'agentic-hq-demos-plugin/commands/research-plan-implement',
];

// Per-workflow install files: needed to BUILD a workflow from source, useless
// and misleading inside the read-only shipped artifact (doc 01 §11(a) — a
// stray ts-workflow/package.json would also break Node package self-reference
// resolution by shadowing the release manifest as nearest-ancestor manifest).
const TS_WORKFLOW_DIR_NAME = 'ts-workflow';
const STRIPPED_TS_WORKFLOW_FILES = [
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  '.gitignore',
];

const pluginsRoot = path.join(repoRoot, '.agentic-hq', 'plugins');

/** Every shipped skill's ts-workflow dir that the Workflow Build must compile. */
function listShippedWorkflowDirs() {
  const workflowDirs = [];
  for (const plugin of SHIPPED_PLUGINS) {
    const skillsDir = path.join(pluginsRoot, plugin, 'skills');
    if (!fs.existsSync(skillsDir)) continue;
    for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const tsWorkflowDir = path.join(skillsDir, entry.name, TS_WORKFLOW_DIR_NAME);
      if (fs.existsSync(tsWorkflowDir)) {
        workflowDirs.push(tsWorkflowDir);
      }
    }
  }
  return workflowDirs;
}

/** Normalize a relative path to POSIX separators. path.relative produces
 * backslashed paths on Windows; comparing those against the POSIX-style
 * constants above matched nothing, so the draft command dirs silently
 * shipped, and executableFiles entries came out backslashed. A Windows build
 * must stage byte-identically to a Linux/macOS one (AHQ-211). */
function toPosixRelativePath(relativePath) {
  return relativePath.split(path.sep).join('/');
}

/** True iff the POSIX-relative path is one of the per-workflow install files inside a ts-workflow dir. */
function isStrippedTsWorkflowFile(posixRelativePath) {
  const segments = posixRelativePath.split('/');
  return (
    segments.slice(0, -1).includes(TS_WORKFLOW_DIR_NAME) &&
    STRIPPED_TS_WORKFLOW_FILES.includes(segments[segments.length - 1])
  );
}

/** The plugin-staging filter, over a path relative to the plugins root:
 * drops node_modules trees, the per-workflow install files and the
 * skill-less draft command dirs; everything else ships verbatim. */
function shouldStagePluginPath(relativePath) {
  const posixPath = toPosixRelativePath(relativePath);
  const segments = posixPath.split('/');
  if (segments[segments.length - 1] === 'node_modules') return false;
  if (isStrippedTsWorkflowFile(posixPath)) return false;
  return !EXCLUDED_DRAFT_COMMAND_DIRS.some(
    (draftDir) => posixPath === draftDir || posixPath.startsWith(draftDir + '/')
  );
}

/** Every staged shipped shell script, as a sorted exact POSIX-relative path
 * list — pnpm's publishConfig.executableFiles ignores globs silently, and
 * enumerating from the staged tree each build means the list cannot go
 * stale. */
function listStagedShellScripts(stagedReleaseDir) {
  const scripts = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (entry.name.endsWith('.sh')) {
        scripts.push(toPosixRelativePath(path.relative(stagedReleaseDir, entryPath)));
      }
    }
  };
  walk(path.join(stagedReleaseDir, '.agentic-hq', 'plugins'));
  return scripts.sort();
}

function buildRelease() {
  // -------------------------------------------------------------------------
  // 1. Clean — release/ and dist/, so both builds start from nothing
  // -------------------------------------------------------------------------
  fs.rmSync(releaseDir, { recursive: true, force: true });
  fs.rmSync(distDir, { recursive: true, force: true });

  // -------------------------------------------------------------------------
  // 2. Framework Build (1) → dist/
  // -------------------------------------------------------------------------
  // Spawned as `node <tsc JS entry>`, not via the node_modules/.bin shim: the
  // extensionless .bin/tsc is a POSIX sh script Windows cannot start, and
  // Node >=20.12 refuses .cmd spawns without a shell (EINVAL, CVE-2024-27980).
  // Same pattern everywhere, no shell involved (AHQ-211 D4).
  execFileSync(
    process.execPath,
    [path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', 'tsconfig.build.json'],
    { cwd: repoRoot, stdio: 'inherit' }
  );

  // -------------------------------------------------------------------------
  // 3. Workflow Build (2) for each shipped migrated workflow
  // -------------------------------------------------------------------------
  for (const workflowDir of listShippedWorkflowDirs()) {
    execFileSync(
      process.execPath,
      [
        path.join(__dirname, 'build-workflow.cjs'),
        `--workflow-dir=${workflowDir}`,
        `--ahq-package-root=${repoRoot}`,
      ],
      { stdio: 'inherit' }
    );
  }

  // -------------------------------------------------------------------------
  // 4. Stage release/
  // -------------------------------------------------------------------------
  fs.mkdirSync(releaseDir, { recursive: true });

  // The Framework Build (1) output, minus tsc's incremental cache (of no use
  // to a consumer — like shipping an .eslintcache). Source maps DO ship: with
  // inlineSources they let an installed package show original TS lines
  // although src/ does not ship.
  fs.cpSync(distDir, path.join(releaseDir, 'dist'), {
    recursive: true,
    filter: (source) => path.basename(source) !== '.tsbuildinfo',
  });

  // The prebuilt bin wrapper only — the dev wrapper (agentic-hq.cjs,
  // installed as agentic-hq-dev, which runs the Framework Build) is
  // deliberately not shipped
  fs.mkdirSync(path.join(releaseDir, 'bin'));
  fs.copyFileSync(
    path.join(repoRoot, 'bin', 'agentic-hq-prebuilt.cjs'),
    path.join(releaseDir, 'bin', 'agentic-hq-prebuilt.cjs')
  );

  // The workflow runner + the Workflow Build it delegates to, plus the two
  // lifecycle scripts the generated manifest invokes (postinstall + prepack
  // guard, AHQ-211) — the rest of scripts/ is dev-machine tooling that must
  // not ship
  fs.mkdirSync(path.join(releaseDir, 'scripts'));
  for (const script of [
    'run-workflow.cjs',
    'build-workflow.cjs',
    'postinstall.cjs',
    'prepack-guard.cjs',
  ]) {
    fs.copyFileSync(path.join(__dirname, script), path.join(releaseDir, 'scripts', script));
  }

  // The shipped plugins, filtered through shouldStagePluginPath above
  for (const plugin of SHIPPED_PLUGINS) {
    fs.cpSync(
      path.join(pluginsRoot, plugin),
      path.join(releaseDir, '.agentic-hq', 'plugins', plugin),
      {
        recursive: true,
        filter: (source) => shouldStagePluginPath(path.relative(pluginsRoot, source)),
      }
    );
  }

  // Packers force-include README and LICENSE from the pack root — without the
  // copy the tarball would lose them (pnpm walks up for LICENSE but not
  // README)
  fs.copyFileSync(path.join(repoRoot, 'README.md'), path.join(releaseDir, 'README.md'));
  fs.copyFileSync(path.join(repoRoot, 'LICENSE'), path.join(releaseDir, 'LICENSE'));

  // -------------------------------------------------------------------------
  // 5. Generate release/package.json
  // -------------------------------------------------------------------------
  generateReleaseManifest();

  process.stdout.write(`build-release: staged ${releaseDir}\n`);
}

function generateReleaseManifest() {
  const rootManifest = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf-8'));

  const releaseManifest = {
    name: rootManifest.name,
    version: rootManifest.version,
    description: rootManifest.description,
    type: rootManifest.type,
    // No `private` field (AHQ-198): the generated release manifest is the ONLY
    // publishable manifest — the root keeps private: true permanently as the
    // structural wrong-tree publish block
    bin: { 'agentic-hq': 'bin/agentic-hq-prebuilt.cjs' },
    // The installed package resolves types from the shipped .d.ts (the root
    // manifest's types condition points at .ts source instead, so a clone's
    // Workflow Build type-checks framework source — AHQ-208 Q6(c))
    exports: {
      './tools/claude-code': {
        types: './dist/src/tools/marshalled-io-tools/claude-code/index.d.ts',
        default: './dist/src/tools/marshalled-io-tools/claude-code/index.js',
      },
    },
    scripts: {
      // Release-mode guard (AHQ-198, AHQ-211): refuses win32 packing (NTFS has
      // no exec bits) and any packer but pnpm (only pnpm applies
      // publishConfig.executableFiles — an npm-packed tarball would ship the
      // plugin .sh files non-executable, exit 126 at runtime — AHQ-196).
      // prepack runs on pack/publish only, never on install — and a tarball
      // publish runs no lifecycle scripts at all, so uploading the pnpm-packed
      // tarball with npm stays unaffected. See scripts/prepack-guard.cjs.
      prepack: 'node scripts/prepack-guard.cjs release',
      // node-pty spawn-helper exec-bit repair only, as a Node script so
      // installs work on Windows too (AHQ-211). darwin-only no-op elsewhere;
      // see scripts/postinstall.cjs (staged above) for the full story
      // (AHQ-198). Shipped plugin .sh files need no chmod here: their exec
      // bits are recorded in the tarball via publishConfig.executableFiles
      // below.
      postinstall: 'node scripts/postinstall.cjs',
    },
    dependencies: rootManifest.dependencies,
    // engines.node only — engines.pnpm is a contributor constraint; installs
    // of the shipped package use plain npm
    engines: { node: rootManifest.engines.node },
    publishConfig: {
      executableFiles: listStagedShellScripts(releaseDir),
    },
  };

  fs.writeFileSync(
    path.join(releaseDir, 'package.json'),
    JSON.stringify(releaseManifest, null, 2) + '\n'
  );
}

if (require.main === module) {
  buildRelease();
}

// Exported for tests (same pattern as postinstall.cjs and build-workflow.cjs);
// the CLI entry above is the only production caller.
module.exports = { shouldStagePluginPath, listStagedShellScripts };

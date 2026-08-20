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

// AHQ-198: unmigrated workflows are excluded from the artifact until AHQ-208/
// AHQ-209 migrate them — their legacy launch commands (pnpm install + tsx
// inside the package) cannot work in the read-only npm install. Entries are
// deleted as each workflow migrates. Dev mode is untouched: dev discovery
// reads the repo plugins tree, never the staged one.
const EXCLUDED_UNMIGRATED_SKILLS = [
  'agentic-hq-core-plugin/skills/create-workflow',
  'agentic-hq-demos-plugin/skills/add-feature-detailed-example',
  'agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow',
  'agentic-hq-demos-plugin/skills/quick-jira-workflow',
];

// Per-workflow install files: needed to BUILD a workflow from source, useless
// and misleading inside the read-only shipped artifact (doc 01 §11(a) — a
// stray ts-workflow/package.json would also break Node package self-reference
// resolution by shadowing the release manifest as nearest-ancestor manifest).
const TS_WORKFLOW_DIR_NAME = 'ts-workflow';
const STRIPPED_TS_WORKFLOW_FILES = [
  'package.json',
  'pnpm-lock.yaml',
  '.npmrc',
  'pnpm-workspace.yaml',
  '.gitignore',
];

// ---------------------------------------------------------------------------
// 1. Clean — release/ and dist/, so both builds start from nothing
// ---------------------------------------------------------------------------
fs.rmSync(releaseDir, { recursive: true, force: true });
fs.rmSync(distDir, { recursive: true, force: true });

// ---------------------------------------------------------------------------
// 2. Framework Build (1) → dist/
// ---------------------------------------------------------------------------
execFileSync(path.join(repoRoot, 'node_modules', '.bin', 'tsc'), ['-p', 'tsconfig.build.json'], {
  cwd: repoRoot,
  stdio: 'inherit',
});

// ---------------------------------------------------------------------------
// 3. Workflow Build (2) for each shipped migrated workflow
// ---------------------------------------------------------------------------
const pluginsRoot = path.join(repoRoot, '.agentic-hq', 'plugins');

/** Every shipped skill's ts-workflow dir that the Workflow Build must compile. */
function listShippedWorkflowDirs() {
  const workflowDirs = [];
  for (const plugin of SHIPPED_PLUGINS) {
    const skillsDir = path.join(pluginsRoot, plugin, 'skills');
    if (!fs.existsSync(skillsDir)) continue;
    for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const skillRelative = `${plugin}/skills/${entry.name}`;
      if (EXCLUDED_UNMIGRATED_SKILLS.includes(skillRelative)) continue;
      const tsWorkflowDir = path.join(skillsDir, entry.name, TS_WORKFLOW_DIR_NAME);
      if (fs.existsSync(tsWorkflowDir)) {
        workflowDirs.push(tsWorkflowDir);
      }
    }
  }
  return workflowDirs;
}

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

// ---------------------------------------------------------------------------
// 4. Stage release/
// ---------------------------------------------------------------------------
fs.mkdirSync(releaseDir, { recursive: true });

// The Framework Build (1) output, minus tsc's incremental cache (of no use to
// a consumer — like shipping an .eslintcache). Source maps DO ship: with
// inlineSources they let an installed package show original TS lines although
// src/ does not ship.
fs.cpSync(distDir, path.join(releaseDir, 'dist'), {
  recursive: true,
  filter: (source) => path.basename(source) !== '.tsbuildinfo',
});

// The prebuilt bin wrapper only — the dev wrapper (agentic-hq.cjs, installed
// as agentic-hq-dev, which runs the Framework Build) is deliberately not
// shipped
fs.mkdirSync(path.join(releaseDir, 'bin'));
fs.copyFileSync(
  path.join(repoRoot, 'bin', 'agentic-hq-prebuilt.cjs'),
  path.join(releaseDir, 'bin', 'agentic-hq-prebuilt.cjs')
);

// The workflow runner + the Workflow Build it delegates to — the rest of
// scripts/ is dev-machine tooling that must not ship
fs.mkdirSync(path.join(releaseDir, 'scripts'));
for (const script of ['run-workflow.cjs', 'build-workflow.cjs']) {
  fs.copyFileSync(path.join(__dirname, script), path.join(releaseDir, 'scripts', script));
}

/** True iff the source path is one of the per-workflow install files inside a ts-workflow dir. */
function isStrippedTsWorkflowFile(relativePath) {
  const segments = relativePath.split(path.sep);
  return (
    segments.slice(0, -1).includes(TS_WORKFLOW_DIR_NAME) &&
    STRIPPED_TS_WORKFLOW_FILES.includes(segments[segments.length - 1])
  );
}

// The shipped plugins, verbatim minus any ts-workflow node_modules, minus the
// per-workflow install files, and minus the excluded unmigrated skills
for (const plugin of SHIPPED_PLUGINS) {
  fs.cpSync(
    path.join(pluginsRoot, plugin),
    path.join(releaseDir, '.agentic-hq', 'plugins', plugin),
    {
      recursive: true,
      filter: (source) => {
        if (path.basename(source) === 'node_modules') return false;
        const rel = path.relative(pluginsRoot, source);
        if (isStrippedTsWorkflowFile(rel)) return false;
        return !EXCLUDED_UNMIGRATED_SKILLS.some(
          (skill) => rel === skill || rel.startsWith(skill + path.sep)
        );
      },
    }
  );
}

// Packers force-include README and LICENSE from the pack root — without the
// copy the tarball would lose them (pnpm walks up for LICENSE but not README)
fs.copyFileSync(path.join(repoRoot, 'README.md'), path.join(releaseDir, 'README.md'));
fs.copyFileSync(path.join(repoRoot, 'LICENSE'), path.join(releaseDir, 'LICENSE'));

// ---------------------------------------------------------------------------
// 5. Generate release/package.json
// ---------------------------------------------------------------------------

/** Every staged shipped shell script, as a sorted exact relative path list —
 * pnpm's publishConfig.executableFiles ignores globs silently, and enumerating
 * from the staged tree each build means the list cannot go stale. */
function listStagedShellScripts() {
  const scripts = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (entry.name.endsWith('.sh')) {
        scripts.push(path.relative(releaseDir, entryPath));
      }
    }
  };
  walk(path.join(releaseDir, '.agentic-hq', 'plugins'));
  return scripts.sort();
}

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
    // Wrong-packer guard (AHQ-198): only pnpm applies
    // publishConfig.executableFiles, so an npm-packed tarball would ship the
    // plugin .sh files non-executable (exit 126 at runtime — AHQ-196).
    // prepack runs on pack/publish only, never on install — and a tarball
    // publish runs no lifecycle scripts at all, so uploading the pnpm-packed
    // tarball with npm stays unaffected.
    prepack:
      "node -e \"const ua=process.env.npm_config_user_agent||''; " +
      "if(!ua.startsWith('pnpm/')){console.error('ERROR: agentic-hq must be packed/published " +
      'with pnpm — npm silently drops publishConfig.executableFiles, so shipped plugin scripts ' +
      'would lose their execute bits. Use: pnpm pack / pnpm publish from release/.\');process.exit(1)}"',
    // node-pty exec-bit repair only (both pnpm and npm extract spawn-helper
    // without its execute bit on macOS — https://github.com/pnpm/pnpm/issues/7366
    // and AHQ-198's npx crash). Two paths because installers lay node-pty out
    // differently: nested inside this package (npm -g), or hoisted to a
    // sibling (npx / project-local installs, where cwd is
    // <root>/node_modules/agentic-hq). Shipped plugin .sh files need no chmod
    // here: their exec bits are recorded in the tarball via
    // publishConfig.executableFiles below.
    postinstall:
      'chmod +x node_modules/node-pty/prebuilds/darwin-*/spawn-helper ../node-pty/prebuilds/darwin-*/spawn-helper 2>/dev/null || true',
  },
  dependencies: rootManifest.dependencies,
  // engines.node only — engines.pnpm is a contributor constraint; installs of
  // the shipped package use plain npm
  engines: { node: rootManifest.engines.node },
  publishConfig: {
    executableFiles: listStagedShellScripts(),
  },
};

fs.writeFileSync(
  path.join(releaseDir, 'package.json'),
  JSON.stringify(releaseManifest, null, 2) + '\n'
);

process.stdout.write(`build-release: staged ${releaseDir}\n`);

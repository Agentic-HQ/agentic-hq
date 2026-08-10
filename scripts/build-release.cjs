#!/usr/bin/env node
/**
 * Shared release build (AHQ-197)
 *
 * The single build script behind `pnpm build`: compiles the CLI graph + the
 * shipped math workflow and assembles the staged release tree — a directory
 * (`release/`) holding EXACTLY what ships, under a single generated manifest.
 * Packing runs from inside `release/`, so there is no pack-time override
 * mechanism and no `files` whitelist: what is staged is what ships.
 *
 * Steps:
 *   1. Clean:   rm -rf release (clean build every time, so outputs of
 *               since-deleted sources can never linger into an artifact)
 *   2. Compile: tsc -p tsconfig.build.json → release/dist. The compiled JS
 *               self-reference-resolves 'agentic-hq/tools/claude-code'
 *               against the generated release manifest (step 4) — the
 *               nearest ancestor manifest — identically in a dev build-first
 *               run and in the installed npm package.
 *   3. Stage:   release/ += generated manifest + prebuilt bin wrapper + the
 *               workflow runner + the shipped plugins + README/LICENSE
 *   4. Manifest: generate release/package.json from the root package.json —
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

// Only these plugins ship — steve-test-plugin and any other local plugin stay dev-only
const SHIPPED_PLUGINS = [
  'agentic-hq-core-plugin',
  'agentic-hq-demos-plugin',
  'agentic-hq-utilities-plugin',
];

// ---------------------------------------------------------------------------
// 1. Clean (also removes any stale repo-root dist/ left by pre-AHQ-197
//    builds, which emitted there)
// ---------------------------------------------------------------------------
fs.rmSync(releaseDir, { recursive: true, force: true });
fs.rmSync(path.join(repoRoot, 'dist'), { recursive: true, force: true });

// ---------------------------------------------------------------------------
// 2. Compile straight into the staged tree (release/dist)
// ---------------------------------------------------------------------------
execFileSync(path.join(repoRoot, 'node_modules', '.bin', 'tsc'), ['-p', 'tsconfig.build.json'], {
  cwd: repoRoot,
  stdio: 'inherit',
});

// ---------------------------------------------------------------------------
// 3. Stage release/
// ---------------------------------------------------------------------------
fs.mkdirSync(releaseDir, { recursive: true });

// The prebuilt bin wrapper only — the dev wrapper (agentic-hq.cjs, which runs
// TS via tsx) is deliberately not shipped
fs.mkdirSync(path.join(releaseDir, 'bin'));
fs.copyFileSync(
  path.join(repoRoot, 'bin', 'agentic-hq-prebuilt.cjs'),
  path.join(releaseDir, 'bin', 'agentic-hq-prebuilt.cjs')
);

// The workflow runner as a single file — the rest of scripts/ is dev-machine
// tooling that must not ship
fs.mkdirSync(path.join(releaseDir, 'scripts'));
fs.copyFileSync(
  path.join(__dirname, 'run-workflow.cjs'),
  path.join(releaseDir, 'scripts', 'run-workflow.cjs')
);

// The shipped plugins, verbatim minus any ts-workflow node_modules
for (const plugin of SHIPPED_PLUGINS) {
  fs.cpSync(
    path.join(repoRoot, '.agentic-hq', 'plugins', plugin),
    path.join(releaseDir, '.agentic-hq', 'plugins', plugin),
    {
      recursive: true,
      filter: (source) => path.basename(source) !== 'node_modules',
    }
  );
}

// Packers force-include README and LICENSE from the pack root — without the
// copy the tarball would lose them (pnpm walks up for LICENSE but not README)
fs.copyFileSync(path.join(repoRoot, 'README.md'), path.join(releaseDir, 'README.md'));
fs.copyFileSync(path.join(repoRoot, 'LICENSE'), path.join(releaseDir, 'LICENSE'));

// ---------------------------------------------------------------------------
// 4. Generate release/package.json
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
  // Kept private until AHQ-198 un-privates deliberately for the real publish
  private: rootManifest.private,
  bin: { 'agentic-hq': 'bin/agentic-hq-prebuilt.cjs' },
  exports: {
    './tools/claude-code': './dist/src/tools/marshalled-io-tools/claude-code/index.js',
  },
  scripts: {
    // node-pty exec-bit repair only (pnpm extracts spawn-helper without its
    // execute bit on macOS — https://github.com/pnpm/pnpm/issues/7366).
    // Shipped plugin .sh files need no chmod here: their exec bits are
    // recorded in the tarball via publishConfig.executableFiles below.
    postinstall:
      'chmod +x node_modules/node-pty/prebuilds/darwin-*/spawn-helper 2>/dev/null || true',
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

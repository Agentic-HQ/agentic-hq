#!/usr/bin/env node
/**
 * agentic-hq DEV CLI entry point — installed as `agentic-hq-dev` (AHQ-208)
 *
 * CJS wrapper referenced by the root package.json "bin" (the file name stays
 * agentic-hq.cjs; the command name is agentic-hq-dev — an npm install of the
 * shipped package provides `agentic-hq` via the prebuilt wrapper instead).
 *
 * This wrapper OWNS the Framework Build (1): incremental tsc of src/ into
 * <repo>/dist (~1 s once warm), then it executes the compiled CLI under plain
 * node — the same dist/src/cli/main.js the shipped package runs. It never
 * builds any workflow (that is the Workflow Build (2), run per-workflow by
 * scripts/run-workflow.cjs) and never touches release/ (publish-only).
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-208
 */

const { execFileSync } = require('child_process');
const path = require('path');
const url = require('url');

const packageRoot = path.join(__dirname, '..');

// Framework Build (1) — owned by this wrapper; a type error stops here
try {
  execFileSync(
    path.join(packageRoot, 'node_modules', '.bin', 'tsc'),
    ['-p', 'tsconfig.build.json'],
    { cwd: packageRoot, stdio: 'inherit' }
  );
} catch (error) {
  // tsc already printed the errors; just propagate the exit code
  process.exit(error.status || 1);
}

process.setSourceMapsEnabled(true);

// The explicit AHQ runtime params (AHQ-197), spliced in ahead of the user's
// args before the CLI reads process.argv. Which wrapper you invoked IS the
// build mode: this is the dev wrapper, so build-first — every workflow launch
// runs that workflow's Workflow Build (2) before executing it.
process.argv.splice(2, 0, '--build-mode=build-first', `--ahq-package-root=${packageRoot}`);

import(url.pathToFileURL(path.join(packageRoot, 'dist', 'src', 'cli', 'main.js')).href);

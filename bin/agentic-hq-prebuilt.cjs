#!/usr/bin/env node
/**
 * agentic-hq PREBUILT CLI entry point (AHQ-196)
 *
 * The shipped tarball's "bin" maps `agentic-hq` here (written directly into
 * the generated release manifest by scripts/build-release.cjs); the working
 * tree's "bin" maps `agentic-hq-dev` to the dev wrapper (agentic-hq.cjs,
 * which runs the Framework Build (1) first — AHQ-208). This wrapper runs the
 * already-compiled JS under plain node — no tsc, no pnpm, no runtime installs;
 * the two wrappers differ by the build step and the build-mode literal alone.
 *
 * Commander reads process.argv itself, so no arg forwarding is needed.
 * Failures throw uncaught with a full stack trace, per this repo's
 * catastrophic-failure convention.
 */

const path = require('path');
const url = require('url');

const packageRoot = path.join(__dirname, '..');

process.setSourceMapsEnabled(true);

// The explicit AHQ runtime params (AHQ-197), spliced in ahead of the user's
// args before the CLI reads process.argv. Which wrapper you invoked IS the
// build mode: this is the shipped prebuilt wrapper, so the installed artifact
// executes as-is.
process.argv.splice(2, 0, '--build-mode=prebuilt', `--ahq-package-root=${packageRoot}`);

import(url.pathToFileURL(path.join(packageRoot, 'dist', 'src', 'cli', 'main.js')).href);

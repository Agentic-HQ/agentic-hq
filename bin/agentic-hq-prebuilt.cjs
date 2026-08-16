#!/usr/bin/env node
/**
 * agentic-hq PREBUILT CLI entry point (AHQ-196)
 *
 * The shipped tarball's "bin" points here (written directly into the
 * generated release manifest by scripts/build-release.cjs); the working
 * tree's "bin" keeps pointing at the dev wrapper (agentic-hq.cjs, which runs
 * TS via tsx). This wrapper runs the compiled JS under plain node — no tsx,
 * no pnpm, no runtime installs.
 *
 * Commander reads process.argv itself, so no arg forwarding is needed.
 * Failures throw uncaught with a full stack trace, per this repo's
 * catastrophic-failure convention.
 */

const path = require('path');
const url = require('url');

const packageRoot = path.join(__dirname, '..');

// The explicit AHQ runtime params (AHQ-197), spliced in ahead of the user's
// args before the CLI reads process.argv. Which wrapper you invoked IS the
// build mode: this is the shipped prebuilt wrapper, so the installed artifact
// executes as-is.
process.argv.splice(2, 0, '--build-mode=prebuilt', `--ahq-package-root=${packageRoot}`);

import(url.pathToFileURL(path.join(packageRoot, 'dist', 'src', 'cli', 'main.js')).href);

#!/usr/bin/env node
/**
 * agentic-hq PREBUILT CLI entry point (AHQ-196)
 *
 * The shipped tarball's "bin" points here (via the pack-time publishConfig
 * override in package.json); the working tree's "bin" keeps pointing at the
 * dev wrapper (agentic-hq.cjs, which runs TS via tsx). This wrapper runs the
 * compiled JS under plain node — no tsx, no pnpm, no runtime installs.
 *
 * Commander reads process.argv itself, so no arg forwarding is needed.
 * Failures throw uncaught with a full stack trace, per this repo's
 * catastrophic-failure convention.
 */

const path = require('path');
const url = require('url');

// Tell directory-functions where the agentic-hq package lives (AHQ-79) so it
// can resolve the paths to the plugins. In the installed artifact this is the
// installed package root. The env-var mechanism is retired by AHQ-200.
process.env.AGENTIC_HQ_WORKSPACE_ROOT = path.join(__dirname, '..');

import(url.pathToFileURL(path.join(__dirname, '..', 'dist', 'src', 'cli', 'main.js')).href);

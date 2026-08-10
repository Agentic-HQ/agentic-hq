#!/usr/bin/env node
/**
 * agentic-hq CLI entry point
 *
 * CJS wrapper that launches the TypeScript CLI via tsx.
 * This file is referenced by the "bin" field in package.json.
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-56
 */

const { execFileSync } = require('child_process');
const path = require('path');

const tsxPath = path.join(__dirname, '..', 'node_modules', '.bin', 'tsx');
const cliPath = path.join(__dirname, '..', 'src', 'cli', 'main.ts');
const packageRoot = path.join(__dirname, '..');

// Tell directory-functions where the agentic-hq workspace lives (AHQ-79)
// so it can resolve the paths to the plugins.
// NOTE RE REFACTOR: In the future would be good to work out what this AGENTIC_HQ_WORKSPACE_ROOT env
// variable does and how it controls the system. May be better to have it as an explicit
// TypeScript parameter that is set on the boundaries of the system and passed inward, instead of
// this "env" variable which is like a global, hidden variable which is harder to test, track,
// understand and control.
// UPDATE (AHQ-197): the explicit parameters now exist (--build-mode/--ahq-package-root below);
// this env var is dual-written only for the LEGACY readers, and AHQ-200 retires it.
process.env.AGENTIC_HQ_WORKSPACE_ROOT = packageRoot;

try {
  // The explicit AHQ runtime params (AHQ-197), inserted ahead of the user's
  // args. Which wrapper you invoked IS the build mode: this is the dev
  // wrapper, so build-first — build the release tree on the fly and execute
  // the byte-identical shippable JS from it.
  execFileSync(
    tsxPath,
    [
      cliPath,
      '--build-mode=build-first',
      `--ahq-package-root=${packageRoot}`,
      ...process.argv.slice(2),
    ],
    { stdio: 'inherit' }
  );
} catch (error) {
  // execFileSync throws on non-zero exit code; just propagate the exit code
  process.exit(error.status || 1);
}

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

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
const cliPath = path.join(__dirname, '..', 'src', 'cli', 'agentic-hq-cli.ts');

// Tell directory-functions where the agentic-hq workspace lives (AHQ-79)
// so it can resolve the paths to the plugins.
process.env.AGENTIC_HQ_WORKSPACE_ROOT = path.join(__dirname, '..');

try {
  execFileSync(tsxPath, [cliPath, ...process.argv.slice(2)], { stdio: 'inherit' });
} catch (error) {
  // execFileSync throws on non-zero exit code; just propagate the exit code
  process.exit(error.status || 1);
}

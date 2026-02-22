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

try {
  execFileSync(tsxPath, [cliPath, ...process.argv.slice(2)], { stdio: 'inherit' });
} catch (error) {
  // execFileSync throws on non-zero exit code; just propagate the exit code
  process.exit(error.status || 1);
}

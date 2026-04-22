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
// Points at the 2-line `main.ts` entry — the Classwitch Root Project pattern:
// `main.ts` just runs `app.run()`, which keeps the entry point trivially tiny.
// Classwitch Override Projects (e.g. the `agentic-hq-with-colours` repo planned
// in AHQ-120) ship their own `bin/<override>.cjs` pointing at their own 3-line
// `main.ts` (override registry side-effect import + `app.run()`).
// See: https://agentic-hq.atlassian.net/browse/AHQ-124
const cliPath = path.join(__dirname, '..', 'src', 'cli', 'main.ts');

// AGENTIC_HQ_WORKSPACE_ROOT is now set inside `app.run()` (src/cli/app.ts) —
// see AHQ-117 Add-On §9. Override Projects must NOT set it in their own bin
// wrappers either; `app.run()` resolves A's own install location.

try {
  execFileSync(tsxPath, [cliPath, ...process.argv.slice(2)], { stdio: 'inherit' });
} catch (error) {
  // execFileSync throws on non-zero exit code; just propagate the exit code
  process.exit(error.status || 1);
}

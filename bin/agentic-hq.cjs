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

// Tell directory-functions where the agentic-hq workspace lives (AHQ-79)
// so it can resolve the paths to the plugins.
// NOTE RE REFACTOR: In the future would be good to work out what this AGENTIC_HQ_WORKSPACE_ROOT env
// variable does and how it controls the system. May be better to have it as an explicit
// Typescript parameter that is set on the boundaries of the system and passed inward, instead of
// this "env" variable which is like a global, hidden variable which is harder to test, track,
// understand and control.  **Also** when a Classwitch Override Project overrides this Classwitch
// Root Project there are complication with what this workspace root is (should it be the new project
// root directory or the original Agentic HQ root project directory???).
process.env.AGENTIC_HQ_WORKSPACE_ROOT = path.join(__dirname, '..');

try {
  execFileSync(tsxPath, [cliPath, ...process.argv.slice(2)], { stdio: 'inherit' });
} catch (error) {
  // execFileSync throws on non-zero exit code; just propagate the exit code
  process.exit(error.status || 1);
}

#!/usr/bin/env node
/**
 * Minimal shared workflow runner (AHQ-196)
 *
 * Runs a compiled workflow program under plain node. Skill SKILL.md files
 * return a command invoking this runner instead of the legacy
 * `pnpm install` + `ln -sfn` + tsx chain, so shipped (read-only, prebuilt)
 * installs need no package manager and no symlinks at runtime.
 *
 * Usage:
 *   node run-workflow.cjs --ahq-package-root=<dir> --workflow-js=<path relative to that root> [workflow args...]
 *
 * Both options are required — missing either is a loud error (fail fast, no
 * defaults). Every remaining arg passes through to the workflow program.
 * AHQ-197 hardens this with build-mode.
 */

const { execFileSync } = require('child_process');
const path = require('path');

const AHQ_PACKAGE_ROOT_OPTION = '--ahq-package-root=';
const WORKFLOW_JS_OPTION = '--workflow-js=';

let ahqPackageRoot;
let workflowJs;
const passthroughArgs = [];

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith(AHQ_PACKAGE_ROOT_OPTION)) {
    ahqPackageRoot = arg.slice(AHQ_PACKAGE_ROOT_OPTION.length);
  } else if (arg.startsWith(WORKFLOW_JS_OPTION)) {
    workflowJs = arg.slice(WORKFLOW_JS_OPTION.length);
  } else {
    passthroughArgs.push(arg);
  }
}

if (!ahqPackageRoot) {
  throw new Error(`run-workflow.cjs: required option ${AHQ_PACKAGE_ROOT_OPTION}<dir> is missing`);
}
if (!workflowJs) {
  throw new Error(
    `run-workflow.cjs: required option ${WORKFLOW_JS_OPTION}<path relative to the package root> is missing`
  );
}

execFileSync(process.execPath, [path.join(ahqPackageRoot, workflowJs), ...passthroughArgs], {
  stdio: 'inherit',
});

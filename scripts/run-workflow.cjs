#!/usr/bin/env node
/**
 * Minimal shared workflow runner (AHQ-196, AHQ-197, AHQ-208)
 *
 * Runs a compiled workflow program under plain node. Skill SKILL.md files
 * return a command invoking this runner, so shipped (read-only, prebuilt)
 * installs need no package manager and no symlinks at runtime.
 *
 * This runner is the TERMINUS of the explicit parameter chain — the only
 * code that acts on `build-mode`, which is the mode of THE WORKFLOW BEING
 * LAUNCHED (per-workflow since AHQ-208):
 *   build-first  Run the Workflow Build (2) for this one workflow —
 *                scripts/build-workflow.cjs: pnpm install, the
 *                node_modules/agentic-hq symlink, tsc into
 *                `<workflow-dir>/dist/` — then execute it.
 *   prebuilt     Execute `<workflow-dir>/<workflow-js>` as-is (the workflow
 *                is already built, e.g. shipped inside the npm artifact).
 *
 * The runner NEVER builds the agentic-hq framework itself — the Framework
 * Build (1) is owned by the dev bin wrapper (agentic-hq-dev) and the release
 * build — and never stages or executes from `release/` (publish-only).
 *
 * Usage:
 *   node run-workflow.cjs --build-mode=<build-first|prebuilt> --ahq-package-root=<dir> --workflow-dir=<dir> --workflow-js=<path relative to --workflow-dir> [workflow args...]
 *
 * All four options are required — missing or invalid options are loud errors
 * (fail fast, no defaults); an absolute --workflow-js is rejected. The
 * workflow program runs with --enable-source-maps and receives `--build-mode`
 * and `--ahq-package-root` plus every remaining arg.
 */

const { execFileSync } = require('child_process');
const path = require('path');

const BUILD_MODE_OPTION = '--build-mode=';
const AHQ_PACKAGE_ROOT_OPTION = '--ahq-package-root=';
const WORKFLOW_DIR_OPTION = '--workflow-dir=';
const WORKFLOW_JS_OPTION = '--workflow-js=';

const BUILD_FIRST = 'build-first';
const PREBUILT = 'prebuilt';
const VALID_BUILD_MODES = [BUILD_FIRST, PREBUILT];

function parseCommandLine(args) {
  let buildMode;
  let ahqPackageRoot;
  let workflowDir;
  let workflowJs;
  const passthroughArgs = [];

  for (const arg of args) {
    if (arg.startsWith(BUILD_MODE_OPTION)) {
      buildMode = arg.slice(BUILD_MODE_OPTION.length);
    } else if (arg.startsWith(AHQ_PACKAGE_ROOT_OPTION)) {
      ahqPackageRoot = arg.slice(AHQ_PACKAGE_ROOT_OPTION.length);
    } else if (arg.startsWith(WORKFLOW_DIR_OPTION)) {
      workflowDir = arg.slice(WORKFLOW_DIR_OPTION.length);
    } else if (arg.startsWith(WORKFLOW_JS_OPTION)) {
      workflowJs = arg.slice(WORKFLOW_JS_OPTION.length);
    } else {
      passthroughArgs.push(arg);
    }
  }

  return { buildMode, ahqPackageRoot, workflowDir, workflowJs, passthroughArgs };
}

function validateOptions({ buildMode, ahqPackageRoot, workflowDir, workflowJs }) {
  if (!buildMode) {
    throw new Error(
      `run-workflow.cjs: required option ${BUILD_MODE_OPTION}<${VALID_BUILD_MODES.join('|')}> is missing`
    );
  }
  if (!VALID_BUILD_MODES.includes(buildMode)) {
    throw new Error(
      `run-workflow.cjs: invalid ${BUILD_MODE_OPTION} value "${buildMode}" (valid: ${VALID_BUILD_MODES.join(', ')})`
    );
  }
  if (!ahqPackageRoot) {
    throw new Error(`run-workflow.cjs: required option ${AHQ_PACKAGE_ROOT_OPTION}<dir> is missing`);
  }
  if (!workflowDir) {
    throw new Error(`run-workflow.cjs: required option ${WORKFLOW_DIR_OPTION}<dir> is missing`);
  }
  if (!workflowJs) {
    throw new Error(
      `run-workflow.cjs: required option ${WORKFLOW_JS_OPTION}<path relative to ${WORKFLOW_DIR_OPTION.slice(0, -1)}> is missing`
    );
  }
  if (path.isAbsolute(workflowJs)) {
    throw new Error(
      `run-workflow.cjs: ${WORKFLOW_JS_OPTION.slice(0, -1)} must be a path relative to ${WORKFLOW_DIR_OPTION.slice(0, -1)} (got absolute "${workflowJs}")`
    );
  }
}

// build-first: run the Workflow Build (2) for THIS workflow before executing
// it — the runner never builds the framework.
function buildWorkflowIfRequired({ buildMode, ahqPackageRoot, workflowDir }) {
  if (buildMode !== BUILD_FIRST) {
    return;
  }
  execFileSync(
    process.execPath,
    [
      path.join(ahqPackageRoot, 'scripts', 'build-workflow.cjs'),
      `${WORKFLOW_DIR_OPTION}${workflowDir}`,
      `${AHQ_PACKAGE_ROOT_OPTION}${ahqPackageRoot}`,
    ],
    { stdio: 'inherit' }
  );
}

function runWorkflowProgram({
  buildMode,
  ahqPackageRoot,
  workflowDir,
  workflowJs,
  passthroughArgs,
}) {
  execFileSync(
    process.execPath,
    [
      '--enable-source-maps',
      path.join(workflowDir, workflowJs),
      `${BUILD_MODE_OPTION}${buildMode}`,
      `${AHQ_PACKAGE_ROOT_OPTION}${ahqPackageRoot}`,
      ...passthroughArgs,
    ],
    { stdio: 'inherit' }
  );
}

const options = parseCommandLine(process.argv.slice(2));
validateOptions(options);
buildWorkflowIfRequired(options);
runWorkflowProgram(options);

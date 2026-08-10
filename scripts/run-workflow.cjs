#!/usr/bin/env node
/**
 * Minimal shared workflow runner (AHQ-196, AHQ-197)
 *
 * Runs a compiled workflow program under plain node. Skill SKILL.md files
 * return a command invoking this runner instead of the legacy
 * `pnpm install` + `ln -sfn` + tsx chain, so shipped (read-only, prebuilt)
 * installs need no package manager and no symlinks at runtime.
 *
 * This runner is the TERMINUS of the explicit parameter chain — the only
 * code that acts on `build-mode`:
 *   build-first  Run the shared release build, then execute the workflow JS
 *                from the freshly staged `<ahq-package-root>/release` tree —
 *                dev runs execute the byte-identical shippable JS.
 *   prebuilt     Execute the workflow JS from `<ahq-package-root>` as-is
 *                (the installed artifact is already the built tree).
 *
 * Usage:
 *   node run-workflow.cjs --build-mode=<build-first|prebuilt> --ahq-package-root=<dir> --workflow-js=<path relative to the execution root> [workflow args...]
 *
 * All three options are required — missing or invalid options are loud
 * errors (fail fast, no defaults). The workflow program receives
 * `--build-mode` and `--ahq-package-root` plus every remaining arg.
 */

const { execFileSync } = require('child_process');
const path = require('path');

const BUILD_MODE_OPTION = '--build-mode=';
const AHQ_PACKAGE_ROOT_OPTION = '--ahq-package-root=';
const WORKFLOW_JS_OPTION = '--workflow-js=';

const BUILD_FIRST = 'build-first';
const PREBUILT = 'prebuilt';
const VALID_BUILD_MODES = [BUILD_FIRST, PREBUILT];

function parseCommandLine(args) {
  let buildMode;
  let ahqPackageRoot;
  let workflowJs;
  const passthroughArgs = [];

  for (const arg of args) {
    if (arg.startsWith(BUILD_MODE_OPTION)) {
      buildMode = arg.slice(BUILD_MODE_OPTION.length);
    } else if (arg.startsWith(AHQ_PACKAGE_ROOT_OPTION)) {
      ahqPackageRoot = arg.slice(AHQ_PACKAGE_ROOT_OPTION.length);
    } else if (arg.startsWith(WORKFLOW_JS_OPTION)) {
      workflowJs = arg.slice(WORKFLOW_JS_OPTION.length);
    } else {
      passthroughArgs.push(arg);
    }
  }

  return { buildMode, ahqPackageRoot, workflowJs, passthroughArgs };
}

function validateOptions({ buildMode, ahqPackageRoot, workflowJs }) {
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
  if (!workflowJs) {
    throw new Error(
      `run-workflow.cjs: required option ${WORKFLOW_JS_OPTION}<path relative to the execution root> is missing`
    );
  }
}

// build-first: a full clean build every run — this is what guarantees the JS
// about to execute is byte-identical to what ships and retires the
// silent-stale-build risk (a few seconds of tsc + staging per dev run).
function resolveExecutionRoot(buildMode, ahqPackageRoot) {
  if (buildMode === BUILD_FIRST) {
    execFileSync(process.execPath, [path.join(ahqPackageRoot, 'scripts', 'build-release.cjs')], {
      stdio: 'inherit',
    });
    return path.join(ahqPackageRoot, 'release');
  }
  return ahqPackageRoot;
}

function runWorkflowProgram(
  executionRoot,
  { buildMode, ahqPackageRoot, workflowJs, passthroughArgs }
) {
  execFileSync(
    process.execPath,
    [
      path.join(executionRoot, workflowJs),
      `${BUILD_MODE_OPTION}${buildMode}`,
      `${AHQ_PACKAGE_ROOT_OPTION}${ahqPackageRoot}`,
      ...passthroughArgs,
    ],
    { stdio: 'inherit' }
  );
}

const options = parseCommandLine(process.argv.slice(2));
validateOptions(options);
const executionRoot = resolveExecutionRoot(options.buildMode, options.ahqPackageRoot);
runWorkflowProgram(executionRoot, options);

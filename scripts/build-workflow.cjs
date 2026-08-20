#!/usr/bin/env node
/**
 * Workflow Build (2) — build ONE workflow's ts-workflow directory (AHQ-208)
 *
 * The single, uniform build for any AHQ workflow, wherever it lives (bundled
 * in the agentic-hq package or in a user's workspace). Shipped in the release
 * (`scripts/build-workflow.cjs`) alongside the runner. Steps, in order:
 *
 *   1. pnpm install in the workflow dir (its own .npmrc makes it frozen;
 *      a no-op after the first run)
 *   2. Ensure `<workflow-dir>/node_modules/agentic-hq` is a symlink to the
 *      AHQ package root — ALWAYS after the install, because pnpm prunes the
 *      foreign entry on every install
 *   3. tsc -p tsconfig.json in the workflow dir → `<workflow-dir>/dist/`,
 *      type-checked against the framework through the symlink
 *
 * Everything it writes stays inside `<workflow-dir>`; nothing is written
 * under the AHQ package root. It never builds the framework itself — that is
 * the Framework Build (1), owned by the dev bin wrapper and the release build.
 *
 * Usage:
 *   node build-workflow.cjs --workflow-dir=<abs dir> --ahq-package-root=<abs dir>
 *
 * Both options are required — missing options are loud errors (fail fast, no
 * defaults). Failures throw uncaught with a full stack trace, per this repo's
 * catastrophic-failure convention.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKFLOW_DIR_OPTION = '--workflow-dir=';
const AHQ_PACKAGE_ROOT_OPTION = '--ahq-package-root=';

function parseCommandLine(args) {
  let workflowDir;
  let ahqPackageRoot;

  for (const arg of args) {
    if (arg.startsWith(WORKFLOW_DIR_OPTION)) {
      workflowDir = arg.slice(WORKFLOW_DIR_OPTION.length);
    } else if (arg.startsWith(AHQ_PACKAGE_ROOT_OPTION)) {
      ahqPackageRoot = arg.slice(AHQ_PACKAGE_ROOT_OPTION.length);
    } else {
      throw new Error(`build-workflow.cjs: unknown argument "${arg}"`);
    }
  }

  if (!workflowDir) {
    throw new Error(`build-workflow.cjs: required option ${WORKFLOW_DIR_OPTION}<dir> is missing`);
  }
  if (!ahqPackageRoot) {
    throw new Error(
      `build-workflow.cjs: required option ${AHQ_PACKAGE_ROOT_OPTION}<dir> is missing`
    );
  }
  return { workflowDir, ahqPackageRoot };
}

// 1. Install the workflow's own dependencies (typescript, commander, ...)
function installDependencies(workflowDir) {
  try {
    execFileSync('pnpm', ['install'], { cwd: workflowDir, stdio: 'inherit' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(
        'build-workflow.cjs: `pnpm` was not found on PATH — the Workflow Build (build-first mode) needs pnpm installed. See https://pnpm.io/installation'
      );
    }
    throw error;
  }
}

// 2. Ensure node_modules/agentic-hq → <ahqPackageRoot>. pnpm prunes this
//    foreign entry on every install, so this must run AFTER the install.
function linkFramework(workflowDir, ahqPackageRoot) {
  const linkPath = path.join(workflowDir, 'node_modules', 'agentic-hq');
  const existing = fs.lstatSync(linkPath, { throwIfNoEntry: false });
  if (existing) {
    if (existing.isSymbolicLink() && fs.readlinkSync(linkPath) === ahqPackageRoot) {
      return; // already correct — leave it alone
    }
    if (existing.isSymbolicLink()) {
      fs.unlinkSync(linkPath);
    } else {
      fs.rmSync(linkPath, { recursive: true, force: true });
    }
  }
  fs.symlinkSync(ahqPackageRoot, linkPath, 'dir');
}

// 3. Compile the workflow → <workflow-dir>/dist/ (+ source maps)
function compileWorkflow(workflowDir) {
  execFileSync(path.join(workflowDir, 'node_modules', '.bin', 'tsc'), ['-p', 'tsconfig.json'], {
    cwd: workflowDir,
    stdio: 'inherit',
  });
}

const { workflowDir, ahqPackageRoot } = parseCommandLine(process.argv.slice(2));
installDependencies(workflowDir);
linkFramework(workflowDir, ahqPackageRoot);
compileWorkflow(workflowDir);

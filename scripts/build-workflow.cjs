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
 *   2. Ensure `<workflow-dir>/node_modules/agentic-hq` is a link to the AHQ
 *      package root (dir symlink; junction on Windows) — ALWAYS after the
 *      install, because pnpm prunes the foreign entry on every install
 *   3. tsc -p tsconfig.json in the workflow dir → `<workflow-dir>/dist/`,
 *      type-checked against the framework through the link
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

// cmd.exe exits with this status when the command name cannot be resolved at
// all — distinct from pnpm's own failures, which use small exit codes.
const WINDOWS_COMMAND_NOT_FOUND_STATUS = 9009;

function isWindows() {
  return process.platform === 'win32';
}

// The JS entry of the package manager this process was launched from, when
// that package manager is pnpm (pnpm run/exec export npm_execpath; a plain
// `node build-workflow.cjs` has none, and under npm/yarn it is not pnpm's —
// this workflow install must be pnpm's, its .npmrc speaks pnpm dialect).
function pnpmJsEntryOfLaunchingPackageManager() {
  const npmExecpath = process.env.npm_execpath;
  if (npmExecpath && path.basename(npmExecpath).includes('pnpm')) {
    return npmExecpath;
  }
  return undefined;
}

// Only a genuinely missing pnpm maps to the friendly install pointer; every
// other failure propagates untouched. A shell-less POSIX spawn reports a
// missing executable as ENOENT; the Windows shell reports it as cmd.exe's
// command-not-found exit status. (Previously ENOENT alone was diagnosed as
// "pnpm not found", which on Windows fired for an INSTALLED pnpm — the .cmd
// shim itself was what could not be spawned — AHQ-211.)
function isPnpmMissingError(error, spawnedThroughShell) {
  return spawnedThroughShell
    ? error.status === WINDOWS_COMMAND_NOT_FOUND_STATUS
    : error.code === 'ENOENT';
}

// 1. Install the workflow's own dependencies (typescript, commander, ...)
//
// pnpm is not a dependency of this package, so there is normally no local JS
// entry to spawn per D4 — but when this build was itself launched from a pnpm
// script, npm_execpath IS pnpm's JS entry: `node <that entry>` needs no shell
// or shim and guarantees the same pnpm version. Otherwise resolve `pnpm` from
// PATH — through a shell on Windows, where pnpm is a .cmd/.ps1 shim that
// CreateProcess cannot start and Node >=20.12 refuses to spawn shell-less
// (EINVAL, CVE-2024-27980). (AHQ-211 D4)
function installDependencies(workflowDir) {
  const pnpmJsEntry = pnpmJsEntryOfLaunchingPackageManager();
  if (pnpmJsEntry) {
    execFileSync(process.execPath, [pnpmJsEntry, 'install'], {
      cwd: workflowDir,
      stdio: 'inherit',
    });
    return;
  }
  const spawnedThroughShell = isWindows();
  try {
    execFileSync('pnpm', ['install'], {
      cwd: workflowDir,
      stdio: 'inherit',
      shell: spawnedThroughShell,
    });
  } catch (error) {
    if (isPnpmMissingError(error, spawnedThroughShell)) {
      throw new Error(
        'build-workflow.cjs: `pnpm` could not be resolved from PATH — the Workflow Build (build-first mode) needs pnpm installed. See https://pnpm.io/installation'
      );
    }
    throw error;
  }
}

// Realpath equality, not readlink string equality: junctions readlink as NT
// paths (`\\?\C:\...`) that never byte-match the configured target, so an
// exact-string comparison would tear down and recreate a perfectly good link
// on every build. A link whose target no longer exists cannot resolve —
// stale, so the caller recreates it.
function linkResolvesTo(linkPath, targetPath) {
  let linkRealPath;
  try {
    linkRealPath = fs.realpathSync(linkPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false; // dangling link
    }
    throw error;
  }
  return linkRealPath === fs.realpathSync(targetPath);
}

// 2. Ensure node_modules/agentic-hq → <ahqPackageRoot>. pnpm prunes this
//    foreign entry on every install, so this must run AFTER the install.
//    A dir symlink on POSIX; on Windows a JUNCTION — dir symlinks need
//    Developer Mode or admin rights there (EPERM without), junctions are
//    unprivileged and resolve identically for Node module resolution
//    (AHQ-211 D3).
function linkFramework(workflowDir, ahqPackageRoot) {
  const linkPath = path.join(workflowDir, 'node_modules', 'agentic-hq');
  const existing = fs.lstatSync(linkPath, { throwIfNoEntry: false });
  if (existing) {
    if (existing.isSymbolicLink() && linkResolvesTo(linkPath, ahqPackageRoot)) {
      return; // already correct — leave it alone
    }
    if (existing.isSymbolicLink()) {
      fs.unlinkSync(linkPath);
    } else {
      fs.rmSync(linkPath, { recursive: true, force: true });
    }
  }
  fs.symlinkSync(ahqPackageRoot, linkPath, isWindows() ? 'junction' : 'dir');
}

// 3. Compile the workflow → <workflow-dir>/dist/ (+ source maps)
//
// Spawned as `node <tsc JS entry>` from the workflow's own typescript
// install, not via the node_modules/.bin shim: the extensionless .bin/tsc is
// a POSIX sh script Windows cannot start, and Node >=20.12 refuses .cmd
// spawns without a shell (EINVAL, CVE-2024-27980). (AHQ-211 D4)
function compileWorkflow(workflowDir) {
  execFileSync(
    process.execPath,
    [path.join(workflowDir, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', 'tsconfig.json'],
    { cwd: workflowDir, stdio: 'inherit' }
  );
}

function main() {
  const { workflowDir, ahqPackageRoot } = parseCommandLine(process.argv.slice(2));
  installDependencies(workflowDir);
  linkFramework(workflowDir, ahqPackageRoot);
  compileWorkflow(workflowDir);
}

if (require.main === module) {
  main();
}

// Exported for tests (same pattern as postinstall.cjs); the CLI entry above
// is the only production caller.
module.exports = { parseCommandLine, installDependencies, linkFramework, compileWorkflow };

/**
 * Integration Test: build-workflow.cjs linkFramework — the framework link
 * (AHQ-208, AHQ-211 D3)
 *
 * Step 2 of the Workflow Build ensures `<workflow-dir>/node_modules/agentic-hq`
 * is a directory link to the AHQ package root — the link every ts-workflow
 * program's `agentic-hq/tools/claude-code` import resolves through. On POSIX
 * that is a plain dir symlink; on Windows it must be a JUNCTION: dir symlinks
 * need Developer Mode or admin rights there (EPERM otherwise), junctions are
 * unprivileged. The freshness check is realpath-based because junctions
 * readlink as NT paths (`\\?\C:\...`) that never byte-equal the configured
 * target — an exact-string readlink comparison would tear down and recreate a
 * perfectly good link on every build.
 *
 * Runs the real linkFramework() against fake framework packages in a temp dir
 * and proves:
 * 1. the import loads through a fresh link (a junction on win32),
 * 2. a correct existing link is left alone (no delete/recreate churn),
 * 3. a link at the wrong target is repaired,
 * 4. a dangling link (target deleted) is repaired,
 * 5. a real directory squatting on the link path is replaced.
 */

import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import * as path from 'node:path';

import { describe, expect } from 'vitest';

import { tmpdirTest } from '../../unit/workflow-discovery/test-fixtures/tmpdir-fixture.js';

const { linkFramework } = createRequire(import.meta.url)('../../../scripts/build-workflow.cjs');

/** Lay out a fake installed framework package exposing the real package's
 * `./tools/claude-code` export, returning its root. The marker identifies
 * WHICH fake framework an import loaded, so the repair tests can tell the
 * link's old and new targets apart. */
function createFakeFrameworkPackage(parentDir: string, name: string, marker: string): string {
  const frameworkRoot = path.join(parentDir, name);
  fs.mkdirSync(path.join(frameworkRoot, 'tools'), { recursive: true });
  fs.writeFileSync(
    path.join(frameworkRoot, 'package.json'),
    JSON.stringify({
      name: 'agentic-hq',
      version: '0.0.0',
      exports: { './tools/claude-code': './tools/claude-code.cjs' },
    })
  );
  fs.writeFileSync(
    path.join(frameworkRoot, 'tools', 'claude-code.cjs'),
    `module.exports = { marker: ${JSON.stringify(marker)} };\n`
  );
  return frameworkRoot;
}

/** A workflow dir in the post-`pnpm install` state linkFramework runs in:
 * node_modules exists, the framework link does not (pnpm prunes it). */
function createWorkflowDir(parentDir: string): string {
  const workflowDir = path.join(parentDir, 'ts-workflow');
  fs.mkdirSync(path.join(workflowDir, 'node_modules'), { recursive: true });
  return workflowDir;
}

function frameworkLinkPath(workflowDir: string): string {
  return path.join(workflowDir, 'node_modules', 'agentic-hq');
}

/** What `import 'agentic-hq/tools/claude-code'` loads from inside the
 * workflow dir — the exact resolution every ts-workflow program performs. */
function importThroughLink(workflowDir: string): { marker: string } {
  const workflowScopedRequire = createRequire(path.join(workflowDir, 'resolution-anchor.cjs'));
  return workflowScopedRequire('agentic-hq/tools/claude-code') as { marker: string };
}

describe('build-workflow.cjs linkFramework (AHQ-208, AHQ-211 D3)', () => {
  tmpdirTest(
    'should create the link so agentic-hq/tools/claude-code loads through it',
    ({ tmpdir }) => {
      const frameworkRoot = createFakeFrameworkPackage(tmpdir, 'framework', 'loaded-through-link');
      const workflowDir = createWorkflowDir(tmpdir);

      linkFramework(workflowDir, frameworkRoot);

      expect(fs.lstatSync(frameworkLinkPath(workflowDir)).isSymbolicLink()).toBe(true);
      expect(fs.realpathSync(frameworkLinkPath(workflowDir))).toBe(fs.realpathSync(frameworkRoot));
      expect(importThroughLink(workflowDir).marker).toBe('loaded-through-link');
    }
  );

  tmpdirTest('should leave an already-correct link in place', ({ tmpdir }) => {
    const frameworkRoot = createFakeFrameworkPackage(tmpdir, 'framework', 'kept');
    const workflowDir = createWorkflowDir(tmpdir);
    linkFramework(workflowDir, frameworkRoot);
    const statsBefore = fs.lstatSync(frameworkLinkPath(workflowDir));

    linkFramework(workflowDir, frameworkRoot);

    // Same inode + creation time = the link itself was not torn down and
    // recreated (a recreate would mint a new one)
    const statsAfter = fs.lstatSync(frameworkLinkPath(workflowDir));
    expect({ ino: statsAfter.ino, birthtimeMs: statsAfter.birthtimeMs }).toEqual({
      ino: statsBefore.ino,
      birthtimeMs: statsBefore.birthtimeMs,
    });
    expect(importThroughLink(workflowDir).marker).toBe('kept');
  });

  tmpdirTest('should repair a link pointing at the wrong target', ({ tmpdir }) => {
    const staleFramework = createFakeFrameworkPackage(tmpdir, 'stale-framework', 'stale');
    const currentFramework = createFakeFrameworkPackage(tmpdir, 'current-framework', 'current');
    const workflowDir = createWorkflowDir(tmpdir);
    linkFramework(workflowDir, staleFramework);

    linkFramework(workflowDir, currentFramework);

    expect(fs.realpathSync(frameworkLinkPath(workflowDir))).toBe(fs.realpathSync(currentFramework));
    expect(importThroughLink(workflowDir).marker).toBe('current');
  });

  tmpdirTest('should repair a dangling link whose target was deleted', ({ tmpdir }) => {
    const deletedFramework = createFakeFrameworkPackage(tmpdir, 'deleted-framework', 'deleted');
    const frameworkRoot = createFakeFrameworkPackage(tmpdir, 'framework', 'repaired');
    const workflowDir = createWorkflowDir(tmpdir);
    linkFramework(workflowDir, deletedFramework);
    fs.rmSync(deletedFramework, { recursive: true, force: true });

    linkFramework(workflowDir, frameworkRoot);

    expect(fs.realpathSync(frameworkLinkPath(workflowDir))).toBe(fs.realpathSync(frameworkRoot));
    expect(importThroughLink(workflowDir).marker).toBe('repaired');
  });

  tmpdirTest('should replace a real directory squatting on the link path', ({ tmpdir }) => {
    const frameworkRoot = createFakeFrameworkPackage(tmpdir, 'framework', 'squatter-replaced');
    const workflowDir = createWorkflowDir(tmpdir);
    fs.mkdirSync(path.join(frameworkLinkPath(workflowDir), 'lib'), { recursive: true });

    linkFramework(workflowDir, frameworkRoot);

    expect(fs.lstatSync(frameworkLinkPath(workflowDir)).isSymbolicLink()).toBe(true);
    expect(importThroughLink(workflowDir).marker).toBe('squatter-replaced');
  });
});

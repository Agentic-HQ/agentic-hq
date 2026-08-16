/**
 * Tests CurrentUserWorkspaceImpl — the user's current workspace based on
 * process.cwd(). Constructed with the injected AhqPackageRoot, which it passes
 * through to its WorkspaceImpl delegate so the same-as-AHQ dedup guard can
 * compare cwd against it. Implements Workspace by delegating to a
 * WorkspaceImpl created on the fly (cwd as rootDir, "Local Workspace" display
 * name). For the four root/path methods (getRoot/getTempDir/
 * getDotAgenticHqDir/isAhqPackage), delegates straight through to
 * WorkspaceImpl — no overrides. registerWorkflowsWith() keeps a same-as-AHQ
 * early-return so workflows aren't registered twice (a domain concern, not
 * formatting). No state beyond the constructor arg — WorkspaceImpl is created
 * fresh each call.
 * Variables typed as Workspace interface; CurrentUserWorkspaceImpl used only for construction.
 */
import * as path from 'node:path';

import { afterEach, describe, expect } from 'vitest';

import { DefaultAhqPackageRoot } from '../../../../src/runtime-params/default-ahq-package-root.js';
import type { Workspace } from '../../../../src/workflow-discovery/interfaces/workspace.js';
import { CurrentUserWorkspaceImpl } from '../../../../src/workflow-discovery/workspace/current-user-workspace-impl.js';
import { StubWorkflowRegistry } from '../test-fixtures/stub-workflow-registry.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';
import { createTestWorkspaceFixture } from '../test-fixtures/workspace-fixture.js';

// The injected AHQ package root for tests where its value is irrelevant
// (everything except the same-as-AHQ dedup-guard comparisons).
const OTHER_AHQ_PACKAGE_ROOT = new DefaultAhqPackageRoot('/some/other/path');

describe('CurrentUserWorkspaceImpl', () => {
  const originalCwd = process.cwd;

  afterEach(() => {
    process.cwd = originalCwd;
  });

  tmpdirTest('should return "Local Workspace" via getDisplayName()', ({ tmpdir }) => {
    process.cwd = () => tmpdir;
    const workspace: Workspace = new CurrentUserWorkspaceImpl(OTHER_AHQ_PACKAGE_ROOT);
    expect(workspace.getDisplayName()).toBe('Local Workspace');
  });

  tmpdirTest('should discover plugins under cwd and expose them via getPlugins()', ({ tmpdir }) => {
    createTestWorkspaceFixture(tmpdir);
    process.cwd = () => tmpdir;

    const workspace: Workspace = new CurrentUserWorkspaceImpl(OTHER_AHQ_PACKAGE_ROOT);
    const pluginNames = workspace.getPlugins().map((p) => p.getName());

    expect(pluginNames).toContain('test-plugin-alpha');
  });

  tmpdirTest(
    'should register no workflows when same as AHQ package (no duplicates)',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      process.cwd = () => tmpdir;

      const workspace: Workspace = new CurrentUserWorkspaceImpl(new DefaultAhqPackageRoot(tmpdir));
      const registry = new StubWorkflowRegistry();

      workspace.registerWorkflowsWith(registry);

      expect(registry.registered).toHaveLength(0);
    }
  );

  tmpdirTest(
    'should register workflows when cwd differs from the injected AhqPackageRoot',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      process.cwd = () => tmpdir;

      const workspace: Workspace = new CurrentUserWorkspaceImpl(OTHER_AHQ_PACKAGE_ROOT);
      const registry = new StubWorkflowRegistry();

      workspace.registerWorkflowsWith(registry);

      // test-plugin-alpha has 2 workflows, test-plugin-beta has 1 = 3 total
      expect(registry.registered).toHaveLength(3);
    }
  );

  // Coverage of the four root/path methods: pure delegation through to WorkspaceImpl
  // (cwd becomes rootDir). isAhqPackage compares cwd to the injected AhqPackageRoot
  // (simple string equality, behaviour preserved from the env-var era).
  tmpdirTest('should return process.cwd() via getRoot()', ({ tmpdir }) => {
    process.cwd = () => tmpdir;
    const workspace: Workspace = new CurrentUserWorkspaceImpl(OTHER_AHQ_PACKAGE_ROOT);
    expect(workspace.getRoot()).toBe(tmpdir);
  });

  tmpdirTest(
    'should return {cwd}/.agentic-hq/temp via getTempDir() (delegation-proof)',
    ({ tmpdir }) => {
      process.cwd = () => tmpdir;
      const workspace: Workspace = new CurrentUserWorkspaceImpl(OTHER_AHQ_PACKAGE_ROOT);
      expect(workspace.getTempDir()).toBe(path.join(tmpdir, '.agentic-hq', 'temp'));
    }
  );

  tmpdirTest(
    'should return true from isAhqPackage() when cwd equals the injected AhqPackageRoot',
    ({ tmpdir }) => {
      process.cwd = () => tmpdir;
      const workspace: Workspace = new CurrentUserWorkspaceImpl(new DefaultAhqPackageRoot(tmpdir));
      expect(workspace.isAhqPackage()).toBe(true);
    }
  );

  tmpdirTest(
    'should return false from isAhqPackage() when cwd differs from the injected AhqPackageRoot',
    ({ tmpdir }) => {
      process.cwd = () => tmpdir;
      const workspace: Workspace = new CurrentUserWorkspaceImpl(OTHER_AHQ_PACKAGE_ROOT);
      expect(workspace.isAhqPackage()).toBe(false);
    }
  );
});

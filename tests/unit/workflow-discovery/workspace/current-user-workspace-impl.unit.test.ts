/**
 * Tests CurrentUserWorkspaceImpl — the user's current workspace based on
 * process.cwd(). Implements Workspace by delegating to a WorkspaceImpl
 * created on the fly (cwd as rootDir, "Local Workspace" display name).
 * For the four root/path methods (getRoot/getTempDir/getDotAgenticHqDir/
 * isAhqWorkspace), delegates straight through to WorkspaceImpl — no
 * overrides. registerWorkflowsWith() keeps a same-as-AHQ early-return so
 * workflows aren't registered twice (a domain concern, not formatting).
 * No fields stored — WorkspaceImpl is created fresh each call.
 * Variables typed as Workspace interface; CurrentUserWorkspaceImpl used only for construction.
 */
import * as path from 'node:path';

import { afterEach, describe, expect } from 'vitest';

import type { Workspace } from '../../../../src/workflow-discovery/interfaces/workspace.js';
import { CurrentUserWorkspaceImpl } from '../../../../src/workflow-discovery/workspace/current-user-workspace-impl.js';
import { StubWorkflowRegistry } from '../test-fixtures/stub-workflow-registry.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';
import { createTestWorkspaceFixture } from '../test-fixtures/workspace-fixture.js';

describe('CurrentUserWorkspaceImpl', () => {
  const originalCwd = process.cwd;

  afterEach(() => {
    process.cwd = originalCwd;
    delete process.env.AGENTIC_HQ_WORKSPACE_ROOT;
  });

  tmpdirTest('should return "Local Workspace" via getDisplayName()', ({ tmpdir }) => {
    process.cwd = () => tmpdir;
    process.env.AGENTIC_HQ_WORKSPACE_ROOT = '/some/other/path';
    const workspace: Workspace = new CurrentUserWorkspaceImpl();
    expect(workspace.getDisplayName()).toBe('Local Workspace');
  });

  tmpdirTest('should discover plugins under cwd and expose them via getPlugins()', ({ tmpdir }) => {
    createTestWorkspaceFixture(tmpdir);
    process.cwd = () => tmpdir;
    process.env.AGENTIC_HQ_WORKSPACE_ROOT = '/some/other/path';

    const workspace: Workspace = new CurrentUserWorkspaceImpl();
    const pluginNames = workspace.getPlugins().map((p) => p.getName());

    expect(pluginNames).toContain('test-plugin-alpha');
  });

  tmpdirTest(
    'should register no workflows when same as AHQ workspace (no duplicates)',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      process.cwd = () => tmpdir;
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;

      const workspace: Workspace = new CurrentUserWorkspaceImpl();
      const registry = new StubWorkflowRegistry();

      workspace.registerWorkflowsWith(registry);

      expect(registry.registered).toHaveLength(0);
    }
  );

  tmpdirTest(
    'should register workflows when cwd differs from AGENTIC_HQ_WORKSPACE_ROOT',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      process.cwd = () => tmpdir;
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = '/some/other/path';

      const workspace: Workspace = new CurrentUserWorkspaceImpl();
      const registry = new StubWorkflowRegistry();

      workspace.registerWorkflowsWith(registry);

      // test-plugin-alpha has 2 workflows, test-plugin-beta has 1 = 3 total
      expect(registry.registered).toHaveLength(3);
    }
  );

  // Coverage of the four root/path methods: pure delegation through to WorkspaceImpl
  // (cwd becomes rootDir). isAhqWorkspace compares cwd to env var per Q5 (simple string equality).
  tmpdirTest('should return process.cwd() via getRoot()', ({ tmpdir }) => {
    process.cwd = () => tmpdir;
    process.env.AGENTIC_HQ_WORKSPACE_ROOT = '/some/other/path';
    const workspace: Workspace = new CurrentUserWorkspaceImpl();
    expect(workspace.getRoot()).toBe(tmpdir);
  });

  tmpdirTest(
    'should return {cwd}/.agentic-hq/temp via getTempDir() (delegation-proof)',
    ({ tmpdir }) => {
      process.cwd = () => tmpdir;
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = '/some/other/path';
      const workspace: Workspace = new CurrentUserWorkspaceImpl();
      expect(workspace.getTempDir()).toBe(path.join(tmpdir, '.agentic-hq', 'temp'));
    }
  );

  tmpdirTest(
    'should return true from isAhqWorkspace() when cwd equals AGENTIC_HQ_WORKSPACE_ROOT',
    ({ tmpdir }) => {
      process.cwd = () => tmpdir;
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
      const workspace: Workspace = new CurrentUserWorkspaceImpl();
      expect(workspace.isAhqWorkspace()).toBe(true);
    }
  );

  tmpdirTest(
    'should return false from isAhqWorkspace() when cwd differs from AGENTIC_HQ_WORKSPACE_ROOT',
    ({ tmpdir }) => {
      process.cwd = () => tmpdir;
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = '/some/other/path';
      const workspace: Workspace = new CurrentUserWorkspaceImpl();
      expect(workspace.isAhqWorkspace()).toBe(false);
    }
  );
});

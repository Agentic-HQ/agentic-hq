/**
 * Tests AhqWorkspaceImpl — reads root from AGENTIC_HQ_WORKSPACE_ROOT env var
 * (falling back to process.cwd() when unset) and implements Workspace by
 * delegating to WorkspaceImpl, except isAhqWorkspace() which is overridden to
 * always return true (semantic: AhqWorkspaceImpl is the AHQ workspace by
 * definition).
 * Variables typed as Workspace interface; AhqWorkspaceImpl used only for construction.
 */
import * as path from 'node:path';

import { afterEach, describe, expect } from 'vitest';

import type { Workspace } from '../../../../src/workflow-discovery/interfaces/workspace.js';
import { AhqWorkspaceImpl } from '../../../../src/workflow-discovery/workspace/ahq-workspace-impl.js';
import { StubWorkflowRegistry } from '../test-fixtures/stub-workflow-registry.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';
import { createTestWorkspaceFixture } from '../test-fixtures/workspace-fixture.js';

describe('AhqWorkspaceImpl', () => {
  const originalEnv = process.env.AGENTIC_HQ_WORKSPACE_ROOT;
  const originalCwd = process.cwd;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.AGENTIC_HQ_WORKSPACE_ROOT;
    } else {
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = originalEnv;
    }
    process.cwd = originalCwd;
  });

  tmpdirTest('should return "Agentic HQ Workspace" via getDisplayName()', ({ tmpdir }) => {
    process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
    const workspace: Workspace = new AhqWorkspaceImpl();
    expect(workspace.getDisplayName()).toBe('Agentic HQ Workspace');
  });

  tmpdirTest(
    'should discover plugins under the env-var root and expose them via getPlugins()',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
      const workspace: Workspace = new AhqWorkspaceImpl();
      const pluginNames = workspace.getPlugins().map((p) => p.getName());

      expect(pluginNames).toContain('test-plugin-alpha');
      expect(pluginNames).toContain('test-plugin-beta');
    }
  );

  tmpdirTest('should register discovered workflows via registerWorkflowsWith', ({ tmpdir }) => {
    createTestWorkspaceFixture(tmpdir);
    process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
    const workspace: Workspace = new AhqWorkspaceImpl();
    const registry = new StubWorkflowRegistry();

    workspace.registerWorkflowsWith(registry);

    // test-plugin-alpha has 2 workflows, test-plugin-beta has 1 = 3 total
    expect(registry.registered).toHaveLength(3);
  });

  // Coverage of the four root/path methods: delegation for getRoot/getTempDir and
  // semantic override for isAhqWorkspace. Q2: getRoot falls back to process.cwd() when
  // env var is unset. Q5: isAhqWorkspace is always true (override, not delegation).
  tmpdirTest(
    'should return AGENTIC_HQ_WORKSPACE_ROOT via getRoot() when env var is set',
    ({ tmpdir }) => {
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
      const workspace: Workspace = new AhqWorkspaceImpl();
      expect(workspace.getRoot()).toBe(tmpdir);
    }
  );

  tmpdirTest(
    'should fall back to process.cwd() via getRoot() when AGENTIC_HQ_WORKSPACE_ROOT is unset',
    ({ tmpdir }) => {
      delete process.env.AGENTIC_HQ_WORKSPACE_ROOT;
      process.cwd = () => tmpdir;
      const workspace: Workspace = new AhqWorkspaceImpl();
      expect(workspace.getRoot()).toBe(tmpdir);
    }
  );

  tmpdirTest(
    'should return {envVarRoot}/.agentic-hq/temp via getTempDir() (delegation-proof)',
    ({ tmpdir }) => {
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
      const workspace: Workspace = new AhqWorkspaceImpl();
      expect(workspace.getTempDir()).toBe(path.join(tmpdir, '.agentic-hq', 'temp'));
    }
  );

  tmpdirTest(
    'should always return true from isAhqWorkspace() even when AGENTIC_HQ_WORKSPACE_ROOT is unset',
    ({ tmpdir }) => {
      delete process.env.AGENTIC_HQ_WORKSPACE_ROOT;
      process.cwd = () => tmpdir;
      const workspace: Workspace = new AhqWorkspaceImpl();
      expect(workspace.isAhqWorkspace()).toBe(true);
    }
  );
});

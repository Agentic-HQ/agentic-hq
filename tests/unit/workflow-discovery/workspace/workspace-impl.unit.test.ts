/**
 * Tests WorkspaceImpl — the generic workspace that does all the real work.
 * Takes a display name and root directory path. Exposes the display name and
 * a list of discovered Plugin entities (via `getDisplayName()` / `getPlugins()`)
 * that downstream consumers (the CLI listing formatter, the registry
 * registration loop) read as plain data. When told to
 * registerWorkflowsWith(registry), dynamically discovers plugins and tells
 * each to register its workflows. Also owns the mechanical logic for
 * Workspace's four root/path methods: getRoot, getTempDir, getDotAgenticHqDir,
 * isAhqWorkspace. No stored state beyond constructor args — everything is
 * discovered fresh within each method call.
 * Variables typed as Workspace interface; WorkspaceImpl used only for construction.
 */
import * as path from 'node:path';

import { afterEach, describe, expect } from 'vitest';

import type { Workspace } from '../../../../src/workflow-discovery/interfaces/workspace.js';
import { WorkspaceImpl } from '../../../../src/workflow-discovery/workspace/workspace-impl.js';
import { StubWorkflowRegistry } from '../test-fixtures/stub-workflow-registry.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';
import { createTestWorkspaceFixture } from '../test-fixtures/workspace-fixture.js';

describe('WorkspaceImpl', () => {
  const originalEnv = process.env.AGENTIC_HQ_WORKSPACE_ROOT;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.AGENTIC_HQ_WORKSPACE_ROOT;
    } else {
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = originalEnv;
    }
  });

  tmpdirTest('should return the constructor display name via getDisplayName()', ({ tmpdir }) => {
    const workspace: Workspace = new WorkspaceImpl('Test Workspace', tmpdir);
    expect(workspace.getDisplayName()).toBe('Test Workspace');
  });

  tmpdirTest('should return the constructor root directory via getRoot()', ({ tmpdir }) => {
    const workspace: Workspace = new WorkspaceImpl('Test Workspace', tmpdir);
    expect(workspace.getRoot()).toBe(tmpdir);
  });

  tmpdirTest(
    'should discover plugins from `.agentic-hq/plugins/` and expose them via getPlugins()',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      const workspace: Workspace = new WorkspaceImpl('Test Workspace', tmpdir);
      const pluginNames = workspace.getPlugins().map((p) => p.getName());

      expect(pluginNames).toContain('test-plugin-alpha');
      expect(pluginNames).toContain('test-plugin-beta');
    }
  );

  tmpdirTest(
    "should expose each discovered plugin's workflows so they reach the formatter",
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      const workspace: Workspace = new WorkspaceImpl('Test Workspace', tmpdir);
      const allShortNames = workspace
        .getPlugins()
        .flatMap((plugin) => plugin.getWorkflows())
        .map((workflow) => workflow.getShortName().toString());

      expect(allShortNames).toContain('reversal');
      expect(allShortNames).toContain('math');
      expect(allShortNames).toContain('quick');
    }
  );

  tmpdirTest(
    'should return an empty plugin list when no plugins exist in workspace',
    ({ tmpdir }) => {
      const workspace: Workspace = new WorkspaceImpl('Empty Workspace', tmpdir);
      expect(workspace.getPlugins()).toEqual([]);
    }
  );

  tmpdirTest(
    'should register all workflows from all plugins via registerWorkflowsWith',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      const workspace: Workspace = new WorkspaceImpl('Test Workspace', tmpdir);
      const registry = new StubWorkflowRegistry();

      workspace.registerWorkflowsWith(registry);

      // test-plugin-alpha has 2 workflows, test-plugin-beta has 1 = 3 total
      expect(registry.registered).toHaveLength(3);
    }
  );

  // Direct coverage of the mechanical logic WorkspaceImpl owns for the four new Workspace
  // methods (getRoot/getTempDir/getDotAgenticHqDir/isAhqWorkspace). Outer impls delegate here.
  tmpdirTest('should return {root}/.agentic-hq/temp via getTempDir()', ({ tmpdir }) => {
    const workspace: Workspace = new WorkspaceImpl('Test Workspace', tmpdir);
    expect(workspace.getTempDir()).toBe(path.join(tmpdir, '.agentic-hq', 'temp'));
  });

  tmpdirTest('should return {root}/.agentic-hq via getDotAgenticHqDir()', ({ tmpdir }) => {
    const workspace: Workspace = new WorkspaceImpl('Test Workspace', tmpdir);
    expect(workspace.getDotAgenticHqDir()).toBe(path.join(tmpdir, '.agentic-hq'));
  });

  tmpdirTest(
    'should return true from isAhqWorkspace() when rootDir equals AGENTIC_HQ_WORKSPACE_ROOT',
    ({ tmpdir }) => {
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
      const workspace: Workspace = new WorkspaceImpl('Test Workspace', tmpdir);
      expect(workspace.isAhqWorkspace()).toBe(true);
    }
  );

  tmpdirTest(
    'should return false from isAhqWorkspace() when rootDir differs from AGENTIC_HQ_WORKSPACE_ROOT',
    ({ tmpdir }) => {
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = '/some/other/path';
      const workspace: Workspace = new WorkspaceImpl('Test Workspace', tmpdir);
      expect(workspace.isAhqWorkspace()).toBe(false);
    }
  );
});

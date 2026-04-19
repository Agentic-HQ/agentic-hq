/**
 * Tests WorkspaceImpl — the generic workspace that does all the real work.
 * Takes a display name and root directory path. When told to getWorkflowListingString(),
 * dynamically scans for plugins, creates PluginImpl for each, tells each to format itself.
 * When told to registerWorkflowsWith(registry), dynamically discovers plugins and tells
 * each to register its workflows with the registry. Also owns the mechanical logic for
 * Workspace's four root/path methods: getRoot, getTempDir, getDotAgenticHqDir, isAhqWorkspace.
 * No stored state beyond constructor args — everything is discovered, created, and used
 * within each method call.
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

  tmpdirTest(
    'should format listing with workspace header containing display name and directory path',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      const workspace: Workspace = new WorkspaceImpl('Test Workspace', tmpdir);
      const output = workspace.getWorkflowListingString();

      expect(output).toContain('Test Workspace');
      expect(output).toContain(`(directory: ${tmpdir})`);
    }
  );

  tmpdirTest('should discover plugins and include per-plugin sections in listing', ({ tmpdir }) => {
    createTestWorkspaceFixture(tmpdir);
    const workspace: Workspace = new WorkspaceImpl('Test Workspace', tmpdir);
    const output = workspace.getWorkflowListingString();

    expect(output).toContain('Plugin: test-plugin-alpha');
    expect(output).toContain('Plugin: test-plugin-beta');
    expect(output).toContain('reversal');
    expect(output).toContain('math');
    expect(output).toContain('quick');
  });

  tmpdirTest(
    'should return empty listing body when no plugins exist in workspace',
    ({ tmpdir }) => {
      const workspace: Workspace = new WorkspaceImpl('Empty Workspace', tmpdir);
      const output = workspace.getWorkflowListingString();

      expect(output).toContain('Empty Workspace');
      expect(output).not.toContain('Plugin:');
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
  tmpdirTest('should return rootDir via getRoot()', ({ tmpdir }) => {
    const workspace: Workspace = new WorkspaceImpl('Test Workspace', tmpdir);
    expect(workspace.getRoot()).toBe(tmpdir);
  });

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

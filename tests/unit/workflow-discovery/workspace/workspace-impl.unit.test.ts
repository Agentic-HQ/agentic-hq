/**
 * Tests WorkspaceImpl — the generic workspace that does all the real work.
 * Takes a display name and root directory path. When told to getWorkflowListingString(),
 * dynamically scans for plugins, creates PluginImpl for each, tells each to format itself.
 * When told to registerWorkflowsWith(registry), dynamically discovers plugins and tells
 * each to register its workflows with the registry. No stored state — everything is
 * discovered, created, and used within each method call.
 * Variables typed as Workspace interface; WorkspaceImpl used only for construction.
 */
import { describe, expect } from 'vitest';

import type { Workspace } from '../../../../src/workflow-discovery/interfaces/workspace.js';
import { WorkspaceImpl } from '../../../../src/workflow-discovery/workspace/workspace-impl.js';
import { StubWorkflowRegistry } from '../test-fixtures/stub-workflow-registry.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';
import { createTestWorkspaceFixture } from '../test-fixtures/workspace-fixture.js';

describe('WorkspaceImpl', () => {
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
});

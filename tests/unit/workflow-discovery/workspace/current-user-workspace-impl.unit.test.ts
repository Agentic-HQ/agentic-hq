/**
 * Tests CurrentUserWorkspaceImpl — the user's current workspace based on process.cwd().
 * Implements Workspace by delegating to a WorkspaceImpl created on the fly.
 * When cwd equals the AHQ workspace root, returns a "same as" message instead of listing.
 * No fields stored — WorkspaceImpl is created fresh each call.
 * Variables typed as Workspace interface; CurrentUserWorkspaceImpl used only for construction.
 */
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

  tmpdirTest('should delegate to WorkspaceImpl and return plugin-grouped listing', ({ tmpdir }) => {
    createTestWorkspaceFixture(tmpdir);
    process.cwd = () => tmpdir;
    // Set AHQ root to a different directory so it doesn't trigger "same as" message
    process.env.AGENTIC_HQ_WORKSPACE_ROOT = '/some/other/path';

    const workspace: Workspace = new CurrentUserWorkspaceImpl();
    const output = workspace.getWorkflowListingString();

    expect(output).toContain('Local Workspace');
    expect(output).toContain('Plugin: test-plugin-alpha');
    expect(output).toContain('reversal');
  });

  tmpdirTest(
    'should return "Same as Agentic HQ Workspace" message when cwd equals AGENTIC_HQ_WORKSPACE_ROOT',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      process.cwd = () => tmpdir;
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;

      const workspace: Workspace = new CurrentUserWorkspaceImpl();
      const output = workspace.getWorkflowListingString();

      expect(output).toContain('Same as Agentic HQ Workspace');
      expect(output).not.toContain('Plugin:');
    }
  );

  tmpdirTest(
    'should return listing with "Local Workspace" header when different from AHQ workspace',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      process.cwd = () => tmpdir;
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = '/some/other/path';

      const workspace: Workspace = new CurrentUserWorkspaceImpl();
      const output = workspace.getWorkflowListingString();

      expect(output).toContain('Local Workspace');
      expect(output).toContain(`(directory: ${tmpdir})`);
    }
  );

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
});

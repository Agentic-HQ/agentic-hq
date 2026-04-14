/**
 * Tests AhqWorkspaceImpl — reads root from AGENTIC_HQ_WORKSPACE_ROOT env var and
 * implements Workspace by delegating to WorkspaceImpl.
 * Variables typed as Workspace interface; AhqWorkspaceImpl used only for construction.
 */
import { afterEach, describe, expect } from 'vitest';

import type { Workspace } from '../../../../src/workflow-discovery/interfaces/workspace.js';
import { AhqWorkspaceImpl } from '../../../../src/workflow-discovery/workspace/ahq-workspace-impl.js';
import { StubWorkflowRegistry } from '../test-fixtures/stub-workflow-registry.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';
import { createTestWorkspaceFixture } from '../test-fixtures/workspace-fixture.js';

describe('AhqWorkspaceImpl', () => {
  const originalEnv = process.env.AGENTIC_HQ_WORKSPACE_ROOT;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.AGENTIC_HQ_WORKSPACE_ROOT;
    } else {
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = originalEnv;
    }
  });

  tmpdirTest(
    'should implement Workspace and return listing with "Agentic HQ Workspace" header via getWorkflowListingString',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
      const workspace: Workspace = new AhqWorkspaceImpl();
      const output = workspace.getWorkflowListingString();

      expect(output).toContain('Agentic HQ Workspace');
      expect(output).toContain(`(directory: ${tmpdir})`);
      expect(output).toContain('Plugin: test-plugin-alpha');
      expect(output).toContain('reversal');
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
});

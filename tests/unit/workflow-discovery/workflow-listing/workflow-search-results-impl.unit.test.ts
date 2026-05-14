/**
 * Tests WorkflowSearchResultsImpl — aggregates workspace search results and displays them.
 * Contains two Workspaces (AhqWorkspaceImpl + CurrentUserWorkspaceImpl) and a
 * ListingFormatter. getWorkflowsListingString() hands both workspaces to the
 * formatter, which reads their getDisplayName/getPlugins data and assembles
 * the string. registerWorkflowsWith(registry) tells each Workspace directly to
 * register its workflows — tell don't ask.
 * Variables typed as WorkflowSearchResults interface; Impl used only for construction.
 */
import { afterEach, describe, expect } from 'vitest';

import type { WorkflowSearchResults } from '../../../../src/workflow-discovery/interfaces/workflow-search-results.js';
import { WorkflowSearchResultsImpl } from '../../../../src/workflow-discovery/workflow-listing/workflow-search-results-impl.js';
import { StubWorkflowRegistry } from '../test-fixtures/stub-workflow-registry.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';
import { createTestWorkspaceFixture } from '../test-fixtures/workspace-fixture.js';

describe('WorkflowSearchResultsImpl', () => {
  const originalCwd = process.cwd;

  afterEach(() => {
    delete process.env.AGENTIC_HQ_WORKSPACE_ROOT;
    process.cwd = originalCwd;
  });

  tmpdirTest(
    'should format discovered workflows with header, names, paths, descriptions',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
      process.cwd = () => tmpdir;
      const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl();
      const output = searchResults.getWorkflowsListingString();

      expect(output).toContain('Available workflows');
      expect(output).toContain('agentic-hq reversal');
      expect(output).toContain('Reverses a string');
    }
  );

  tmpdirTest('should include each workflow description from the fixture', ({ tmpdir }) => {
    createTestWorkspaceFixture(tmpdir);
    process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
    process.cwd = () => tmpdir;
    const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl();
    const output = searchResults.getWorkflowsListingString();
    expect(output).toContain('Reverses a string');
    expect(output).toContain('Solves math problems');
    expect(output).toContain('Quick task runner');
  });

  tmpdirTest(
    'should return only headers (no plugin sections) when no workflows are discovered',
    ({ tmpdir }) => {
      // Empty tmpdir — no plugins exist in either workspace
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
      process.cwd = () => tmpdir;
      const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl();
      const output = searchResults.getWorkflowsListingString();

      expect(output).toContain('Available workflows');
      // The behavioural property: with no workflows, no plugin sections are rendered.
      expect(output).not.toContain('Plugin:');
    }
  );

  tmpdirTest(
    'should include both AHQ and user workspace sections with headers in getWorkflowsListingString',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
      // Stub process.cwd to a different directory with its own plugins
      const originalCwd = process.cwd;
      process.cwd = () => '/some/other/workspace';
      try {
        const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl();
        const output = searchResults.getWorkflowsListingString();

        expect(output).toContain('Agentic HQ Workspace');
        expect(output).toContain('Local Workspace');
      } finally {
        process.cwd = originalCwd;
      }
    }
  );

  tmpdirTest('should show "same as AHQ workspace" message when directories match', ({ tmpdir }) => {
    createTestWorkspaceFixture(tmpdir);
    process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
    const originalCwd = process.cwd;
    process.cwd = () => tmpdir;
    try {
      const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl();
      const output = searchResults.getWorkflowsListingString();

      expect(output).toContain('Agentic HQ Workspace');
      expect(output).toContain('Same as Agentic HQ Workspace');
    } finally {
      process.cwd = originalCwd;
    }
  });

  tmpdirTest(
    'should register all discovered workflows from both workspaces via registerWorkflowsWith',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
      // Same dir so CurrentUserWorkspace registers nothing (no duplicates)
      const originalCwd = process.cwd;
      process.cwd = () => tmpdir;
      try {
        const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl();
        const registry = new StubWorkflowRegistry();

        searchResults.registerWorkflowsWith(registry);

        // Only AHQ workspace workflows (3), no duplicates from CurrentUserWorkspace
        expect(registry.registered).toHaveLength(3);
      } finally {
        process.cwd = originalCwd;
      }
    }
  );
});

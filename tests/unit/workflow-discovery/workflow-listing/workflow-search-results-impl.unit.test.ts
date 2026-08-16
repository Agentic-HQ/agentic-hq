/**
 * Tests WorkflowSearchResultsImpl — aggregates workspace search results and displays them.
 * Constructed with the injected AhqPackageRoot, which it passes into both of
 * its Workspaces (AhqPackageImpl + CurrentUserWorkspaceImpl); also holds a
 * ListingFormatter. getWorkflowsListingString() hands both workspaces to the
 * formatter, which reads their getDisplayName/getPlugins data and assembles
 * the string. registerWorkflowsWith(registry) tells each Workspace directly to
 * register its workflows — tell don't ask.
 * Variables typed as WorkflowSearchResults interface; Impl used only for construction.
 */
import { afterEach, describe, expect } from 'vitest';

import { DefaultAhqPackageRoot } from '../../../../src/runtime-params/default-ahq-package-root.js';
import type { WorkflowSearchResults } from '../../../../src/workflow-discovery/interfaces/workflow-search-results.js';
import { WorkflowSearchResultsImpl } from '../../../../src/workflow-discovery/workflow-listing/workflow-search-results-impl.js';
import { StubWorkflowRegistry } from '../test-fixtures/stub-workflow-registry.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';
import { createTestWorkspaceFixture } from '../test-fixtures/workspace-fixture.js';

describe('WorkflowSearchResultsImpl', () => {
  const originalCwd = process.cwd;

  afterEach(() => {
    process.cwd = originalCwd;
  });

  tmpdirTest(
    'should format discovered workflows with header, names, paths, descriptions',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      process.cwd = () => tmpdir;
      const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl(
        new DefaultAhqPackageRoot(tmpdir)
      );
      const output = searchResults.getWorkflowsListingString();

      expect(output).toContain('Available workflows');
      expect(output).toContain('agentic-hq reversal');
      expect(output).toContain('Reverses a string');
    }
  );

  tmpdirTest('should include each workflow description from the fixture', ({ tmpdir }) => {
    createTestWorkspaceFixture(tmpdir);
    process.cwd = () => tmpdir;
    const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl(
      new DefaultAhqPackageRoot(tmpdir)
    );
    const output = searchResults.getWorkflowsListingString();
    expect(output).toContain('Reverses a string');
    expect(output).toContain('Solves math problems');
    expect(output).toContain('Quick task runner');
  });

  tmpdirTest(
    'should return only headers (no plugin sections) when no workflows are discovered',
    ({ tmpdir }) => {
      // Empty tmpdir — no plugins exist in either workspace
      process.cwd = () => tmpdir;
      const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl(
        new DefaultAhqPackageRoot(tmpdir)
      );
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
      // Stub process.cwd to a different directory with its own plugins
      process.cwd = () => '/some/other/workspace';
      const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl(
        new DefaultAhqPackageRoot(tmpdir)
      );
      const output = searchResults.getWorkflowsListingString();

      expect(output).toContain('Agentic HQ Package');
      expect(output).toContain('Local Workspace');
    }
  );

  tmpdirTest('should show "same as AHQ package" message when directories match', ({ tmpdir }) => {
    createTestWorkspaceFixture(tmpdir);
    process.cwd = () => tmpdir;
    const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl(
      new DefaultAhqPackageRoot(tmpdir)
    );
    const output = searchResults.getWorkflowsListingString();

    expect(output).toContain('Agentic HQ Package');
    expect(output).toContain('Same as Agentic HQ Package');
  });

  tmpdirTest(
    'should register all discovered workflows from both workspaces via registerWorkflowsWith',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      // Same dir so CurrentUserWorkspace registers nothing (no duplicates)
      process.cwd = () => tmpdir;
      const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl(
        new DefaultAhqPackageRoot(tmpdir)
      );
      const registry = new StubWorkflowRegistry();

      searchResults.registerWorkflowsWith(registry);

      // Only AHQ package workflows (3), no duplicates from CurrentUserWorkspace
      expect(registry.registered).toHaveLength(3);
    }
  );
});

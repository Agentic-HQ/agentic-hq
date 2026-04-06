/**
 * Tests WorkflowSearchResultsImpl — aggregates workspace search results and displays them.
 * Creates AhqWorkspaceImpl + AhqWorkflowsImpl internally.
 * getWorkflowsListingString() tells AhqWorkflows to getWorkflowListingEntriesString() — delegation chain.
 * Variables typed as WorkflowSearchResults interface; Impl used only for construction.
 */
import { afterEach, describe, expect } from 'vitest';

import type { WorkflowSearchResults } from '../../../../src/workflow-discovery/interfaces/workflow-search-results.js';
import { WorkflowSearchResultsImpl } from '../../../../src/workflow-discovery/workflow-listing/workflow-search-results-impl.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';
import { createTestWorkspaceFixture } from '../test-fixtures/workspace-fixture.js';

describe('WorkflowSearchResultsImpl', () => {
  afterEach(() => {
    delete process.env.AGENTIC_HQ_WORKSPACE_ROOT;
  });

  tmpdirTest(
    'should format discovered workflows with header, names, paths, descriptions',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
      const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl();
      const output = searchResults.getWorkflowsListingString();

      expect(output).toMatch(/^Available workflows:/);
      expect(output).toContain('agentic-hq reversal');
      expect(output).toContain('   What it does: Reverses a string');
    }
  );

  tmpdirTest('should include a "What it does:" line for each workflow', ({ tmpdir }) => {
    createTestWorkspaceFixture(tmpdir);
    process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
    const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl();
    const output = searchResults.getWorkflowsListingString();
    const whatItDoesLines = output
      .split('\n')
      .filter((l: string) => l.startsWith('   What it does:'));
    expect(whatItDoesLines).toHaveLength(3);
  });

  tmpdirTest('should include at least one line starting with "   What it does: "', ({ tmpdir }) => {
    createTestWorkspaceFixture(tmpdir);
    process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
    const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl();
    const output = searchResults.getWorkflowsListingString();
    const whatItDoesLines = output
      .split('\n')
      .filter((l: string) => l.startsWith('   What it does: '));
    expect(whatItDoesLines.length).toBeGreaterThan(0);
  });

  tmpdirTest('should return just header when no workflows found', ({ tmpdir }) => {
    process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
    const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl();
    const output = searchResults.getWorkflowsListingString();
    expect(output).toMatch(/^Available workflows:/);
  });
});

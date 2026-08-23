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
import * as path from 'node:path';

import { afterEach, describe, expect } from 'vitest';

import { BuildMode } from '../../../../src/interfaces/build-mode.js';
import { DefaultAhqPackageRoot } from '../../../../src/runtime-params/default-ahq-package-root.js';
import { DefaultAhqRuntimeParams } from '../../../../src/runtime-params/default-ahq-runtime-params.js';
import type { WorkflowSearchResults } from '../../../../src/workflow-discovery/interfaces/workflow-search-results.js';
import { WorkflowSearchResultsImpl } from '../../../../src/workflow-discovery/workflow-listing/workflow-search-results-impl.js';
import { StubWorkflowRegistry } from '../test-fixtures/stub-workflow-registry.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';
import {
  createSingleWorkflowFixture,
  createTestWorkspaceFixture,
} from '../test-fixtures/workspace-fixture.js';

/**
 * Two-root fixture (AHQ-205): the AHQ package at `<tmpdir>/package` (the standard fixture,
 * which includes `math`) and a separate local workspace at `<tmpdir>/local` holding ONE
 * workflow whose shortId collides (`math`) under a different plugin id. Returns both roots.
 */
function createPackageAndCollidingLocalRoots(tmpdir: string): {
  packageRoot: string;
  localRoot: string;
} {
  const packageRoot = path.join(tmpdir, 'package');
  const localRoot = path.join(tmpdir, 'local');
  createTestWorkspaceFixture(packageRoot);
  createSingleWorkflowFixture(localRoot, 'local-plugin', 'my-math', {
    shortId: 'math',
    description: 'A LOCAL math that collides with the package one',
    exampleParameters: '-- --input-number=1',
  });
  return { packageRoot, localRoot };
}

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
        new DefaultAhqRuntimeParams(BuildMode.BUILD_FIRST, new DefaultAhqPackageRoot(tmpdir))
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
      new DefaultAhqRuntimeParams(BuildMode.BUILD_FIRST, new DefaultAhqPackageRoot(tmpdir))
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
        new DefaultAhqRuntimeParams(BuildMode.BUILD_FIRST, new DefaultAhqPackageRoot(tmpdir))
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
        new DefaultAhqRuntimeParams(BuildMode.BUILD_FIRST, new DefaultAhqPackageRoot(tmpdir))
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
      new DefaultAhqRuntimeParams(BuildMode.BUILD_FIRST, new DefaultAhqPackageRoot(tmpdir))
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
        new DefaultAhqRuntimeParams(BuildMode.BUILD_FIRST, new DefaultAhqPackageRoot(tmpdir))
      );
      const registry = new StubWorkflowRegistry();

      searchResults.registerWorkflowsWith(registry);

      // Only AHQ package workflows (3), no duplicates from CurrentUserWorkspace
      expect(registry.registered).toHaveLength(3);
    }
  );

  // AHQ-205: the local workspace registers BEFORE the AHQ package. WorkflowRegistryImpl keeps
  // the first registration of a short name, so this order is what makes "local wins" true.
  // (The stub registry does not dedupe — this test pins ORDER; the registry test pins first-wins.)
  tmpdirTest(
    'should register the local workspace workflows before the AHQ package workflows',
    ({ tmpdir }) => {
      const { packageRoot, localRoot } = createPackageAndCollidingLocalRoots(tmpdir);
      process.cwd = () => localRoot;
      const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl(
        new DefaultAhqRuntimeParams(BuildMode.BUILD_FIRST, new DefaultAhqPackageRoot(packageRoot))
      );
      const registry = new StubWorkflowRegistry();

      searchResults.registerWorkflowsWith(registry);

      const fullCommands = registry.registered.map((w) => w.getFullClaudeSkillCommand().toString());
      // 1 local + 3 package — both `math`s present, local one first
      expect(fullCommands).toHaveLength(4);
      expect(fullCommands[0]).toBe('/local-plugin:my-math');
      expect(fullCommands.slice(1)).toContain('/test-plugin-alpha:math-skill');
    }
  );

  // AHQ-205: over real two-root discovery, the listing flags exactly the copy that registration
  // skipped — the AHQ package's `math` — so the listing and the subcommand table agree.
  tmpdirTest(
    'should flag exactly the AHQ package copy as DISABLED in the listing when the local workspace claims the shortId first',
    ({ tmpdir }) => {
      const { packageRoot, localRoot } = createPackageAndCollidingLocalRoots(tmpdir);
      process.cwd = () => localRoot;
      const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl(
        new DefaultAhqRuntimeParams(BuildMode.BUILD_FIRST, new DefaultAhqPackageRoot(packageRoot))
      );

      const output = searchResults.getWorkflowsListingString();
      const lines = output.split('\n');

      const disabledIndexes = lines
        .map((line, index) => (line.includes('DISABLED') ? index : -1))
        .filter((index) => index >= 0);
      const localHeaderIndex = lines.findIndex((line) => line.includes('Local Workspace:'));
      expect(disabledIndexes).toHaveLength(1);
      expect(lines[disabledIndexes[0]!]).toContain("shortId 'math'");
      expect(disabledIndexes[0]!).toBeLessThan(localHeaderIndex);
      expect(lines[disabledIndexes[0]! + 2]).toContain('Solves math problems');
    }
  );
});

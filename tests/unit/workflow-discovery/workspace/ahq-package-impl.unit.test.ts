/**
 * Tests AhqPackageImpl — receives its root as a constructor-injected
 * AhqPackageRoot (required — no env vars, no fallback, per AHQ-200 Q3) and
 * implements Workspace by delegating to WorkspaceImpl, except isAhqPackage()
 * which is overridden to always return true (semantic: AhqPackageImpl is the
 * AHQ package by definition).
 * Variables typed as Workspace interface; AhqPackageImpl used only for construction.
 */
import * as path from 'node:path';

import { describe, expect } from 'vitest';

import { DefaultAhqPackageRoot } from '../../../../src/runtime-params/default-ahq-package-root.js';
import type { Workspace } from '../../../../src/workflow-discovery/interfaces/workspace.js';
import { AhqPackageImpl } from '../../../../src/workflow-discovery/workspace/ahq-package-impl.js';
import { StubWorkflowRegistry } from '../test-fixtures/stub-workflow-registry.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';
import { createTestWorkspaceFixture } from '../test-fixtures/workspace-fixture.js';

describe('AhqPackageImpl', () => {
  tmpdirTest('should return "Agentic HQ Package" via getDisplayName()', ({ tmpdir }) => {
    const workspace: Workspace = new AhqPackageImpl(new DefaultAhqPackageRoot(tmpdir));
    expect(workspace.getDisplayName()).toBe('Agentic HQ Package');
  });

  tmpdirTest(
    'should discover plugins under the injected root and expose them via getPlugins()',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      const workspace: Workspace = new AhqPackageImpl(new DefaultAhqPackageRoot(tmpdir));
      const pluginNames = workspace.getPlugins().map((p) => p.getName());

      expect(pluginNames).toContain('test-plugin-alpha');
      expect(pluginNames).toContain('test-plugin-beta');
    }
  );

  tmpdirTest('should register discovered workflows via registerWorkflowsWith', ({ tmpdir }) => {
    createTestWorkspaceFixture(tmpdir);
    const workspace: Workspace = new AhqPackageImpl(new DefaultAhqPackageRoot(tmpdir));
    const registry = new StubWorkflowRegistry();

    workspace.registerWorkflowsWith(registry);

    // test-plugin-alpha has 2 workflows, test-plugin-beta has 1 = 3 total
    expect(registry.registered).toHaveLength(3);
  });

  // Coverage of the four root/path methods: delegation for getRoot/getTempDir and
  // semantic override for isAhqPackage (always true — override, not delegation).
  // The root comes from the injected AhqPackageRoot — the single sanctioned source
  // (replaces the old env-var read and its cwd fallback; a missing root is now a
  // compile error at the construction site, per AHQ-200 Q3).
  tmpdirTest('should return the injected AhqPackageRoot path via getRoot()', ({ tmpdir }) => {
    const workspace: Workspace = new AhqPackageImpl(new DefaultAhqPackageRoot(tmpdir));
    expect(workspace.getRoot()).toBe(tmpdir);
  });

  tmpdirTest(
    'should return {injectedRoot}/.agentic-hq/temp via getTempDir() (delegation-proof)',
    ({ tmpdir }) => {
      const workspace: Workspace = new AhqPackageImpl(new DefaultAhqPackageRoot(tmpdir));
      expect(workspace.getTempDir()).toBe(path.join(tmpdir, '.agentic-hq', 'temp'));
    }
  );

  tmpdirTest('should always return true from isAhqPackage()', ({ tmpdir }) => {
    const workspace: Workspace = new AhqPackageImpl(new DefaultAhqPackageRoot(tmpdir));
    expect(workspace.isAhqPackage()).toBe(true);
  });
});

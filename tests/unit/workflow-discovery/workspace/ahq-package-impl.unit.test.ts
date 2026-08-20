/**
 * Tests AhqPackageImpl — receives the injected AhqRuntimeParams (required — no
 * env vars, no fallback; AhqPackageRoot + the wrapper's BuildMode, AHQ-208)
 * and implements Workspace by delegating to WorkspaceImpl, except
 * isAhqPackage() which is overridden to always return true (semantic:
 * AhqPackageImpl is the AHQ package by definition). Its getBuildMode() is the
 * WRAPPER'S mode: the AHQ package's workflows run however the invoked binary
 * says (dev wrapper → build-first, shipped wrapper → prebuilt).
 * Variables typed as Workspace interface; AhqPackageImpl used only for construction.
 */
import * as path from 'node:path';

import { describe, expect } from 'vitest';

import { BuildMode } from '../../../../src/interfaces/build-mode.js';
import { DefaultAhqPackageRoot } from '../../../../src/runtime-params/default-ahq-package-root.js';
import { DefaultAhqRuntimeParams } from '../../../../src/runtime-params/default-ahq-runtime-params.js';
import type { Workspace } from '../../../../src/workflow-discovery/interfaces/workspace.js';
import { AhqPackageImpl } from '../../../../src/workflow-discovery/workspace/ahq-package-impl.js';
import { StubWorkflowRegistry } from '../test-fixtures/stub-workflow-registry.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';
import { createTestWorkspaceFixture } from '../test-fixtures/workspace-fixture.js';

function createAhqPackage(tmpdir: string, buildMode = BuildMode.BUILD_FIRST): Workspace {
  return new AhqPackageImpl(
    new DefaultAhqRuntimeParams(buildMode, new DefaultAhqPackageRoot(tmpdir))
  );
}

describe('AhqPackageImpl', () => {
  tmpdirTest('should return "Agentic HQ Package" via getDisplayName()', ({ tmpdir }) => {
    const workspace = createAhqPackage(tmpdir);
    expect(workspace.getDisplayName()).toBe('Agentic HQ Package');
  });

  tmpdirTest(
    'should discover plugins under the injected root and expose them via getPlugins()',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      const workspace = createAhqPackage(tmpdir);
      const pluginNames = workspace.getPlugins().map((p) => p.getName());

      expect(pluginNames).toContain('test-plugin-alpha');
      expect(pluginNames).toContain('test-plugin-beta');
    }
  );

  tmpdirTest('should register discovered workflows via registerWorkflowsWith', ({ tmpdir }) => {
    createTestWorkspaceFixture(tmpdir);
    const workspace = createAhqPackage(tmpdir);
    const registry = new StubWorkflowRegistry();

    workspace.registerWorkflowsWith(registry);

    // test-plugin-alpha has 2 workflows, test-plugin-beta has 1 = 3 total
    expect(registry.registered).toHaveLength(3);
  });

  // The per-workflow build-mode rule (AHQ-208): the AHQ package's workflows
  // INHERIT the wrapper's mode from the injected AhqRuntimeParams.
  tmpdirTest(
    "should return the injected runtime params' BUILD_FIRST mode via getBuildMode()",
    ({ tmpdir }) => {
      const workspace = createAhqPackage(tmpdir, BuildMode.BUILD_FIRST);
      expect(workspace.getBuildMode()).toBe(BuildMode.BUILD_FIRST);
    }
  );

  tmpdirTest(
    "should return the injected runtime params' PREBUILT mode via getBuildMode()",
    ({ tmpdir }) => {
      const workspace = createAhqPackage(tmpdir, BuildMode.PREBUILT);
      expect(workspace.getBuildMode()).toBe(BuildMode.PREBUILT);
    }
  );

  tmpdirTest(
    "should register workflows that carry the wrapper's mode via getBuildMode()",
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      const workspace = createAhqPackage(tmpdir, BuildMode.PREBUILT);
      const registry = new StubWorkflowRegistry();

      workspace.registerWorkflowsWith(registry);

      expect(registry.registered).toHaveLength(3);
      for (const workflow of registry.registered) {
        expect(workflow.getBuildMode()).toBe(BuildMode.PREBUILT);
      }
    }
  );

  // Coverage of the four root/path methods: delegation for getRoot/getTempDir and
  // semantic override for isAhqPackage (always true — override, not delegation).
  // The root comes from the injected runtime params' AhqPackageRoot — the single
  // sanctioned source (replaces the old env-var read and its cwd fallback; a
  // missing root is now a compile error at the construction site, per AHQ-200 Q3).
  tmpdirTest('should return the injected AhqPackageRoot path via getRoot()', ({ tmpdir }) => {
    const workspace = createAhqPackage(tmpdir);
    expect(workspace.getRoot()).toBe(tmpdir);
  });

  tmpdirTest(
    'should return {injectedRoot}/.agentic-hq/temp via getTempDir() (delegation-proof)',
    ({ tmpdir }) => {
      const workspace = createAhqPackage(tmpdir);
      expect(workspace.getTempDir()).toBe(path.join(tmpdir, '.agentic-hq', 'temp'));
    }
  );

  tmpdirTest('should always return true from isAhqPackage()', ({ tmpdir }) => {
    const workspace = createAhqPackage(tmpdir);
    expect(workspace.isAhqPackage()).toBe(true);
  });
});

/**
 * Unit Test: CompositionRoot
 *
 * Verifies the behaviour of the public building-block getters on
 * CompositionRoot: each returns a component whose observable properties
 * match what the concrete wiring guarantees, and the runtime params
 * supplied at construction are exposed to the wiring (AHQ-197) — including
 * the AhqPackageRoot that both workspace getters inject (AHQ-200).
 */
import { describe, expect, it } from 'vitest';

import { BuildMode } from '../../../src/interfaces/build-mode.js';
import { CompositionRoot } from '../../../src/kernel/composition-root.js';
import { DefaultAhqPackageRoot } from '../../../src/runtime-params/default-ahq-package-root.js';
import { DefaultAhqRuntimeParams } from '../../../src/runtime-params/default-ahq-runtime-params.js';

const TEST_RUNTIME_PARAMS = new DefaultAhqRuntimeParams(
  BuildMode.BUILD_FIRST,
  new DefaultAhqPackageRoot('/test-ahq-package-root')
);

describe('CompositionRoot', () => {
  it('getAhqRuntimeParams() returns the params supplied at construction', () => {
    const params = new DefaultAhqRuntimeParams(
      BuildMode.PREBUILT,
      new DefaultAhqPackageRoot('/installed/pkg')
    );

    expect(new CompositionRoot(params).getAhqRuntimeParams()).toBe(params);
  });

  it('getAhqPackage() returns a Workspace rooted at the AhqPackageRoot in the runtime params', () => {
    const ahqPackage = new CompositionRoot(TEST_RUNTIME_PARAMS).getAhqPackage();

    expect(ahqPackage.getRoot()).toBe('/test-ahq-package-root');
    expect(ahqPackage.isAhqPackage()).toBe(true);
  });

  // The per-workflow build-mode rule (AHQ-208): the AHQ package inherits the
  // wrapper's mode from the runtime params; the user's workspace holds source
  // and is always build-first.
  it("getAhqPackage() carries the runtime params' build mode; getCurrentUserWorkspace() is always BUILD_FIRST", () => {
    const prebuiltParams = new DefaultAhqRuntimeParams(
      BuildMode.PREBUILT,
      new DefaultAhqPackageRoot('/installed/pkg')
    );
    const root = new CompositionRoot(prebuiltParams);

    expect(root.getAhqPackage().getBuildMode()).toBe(BuildMode.PREBUILT);
    expect(root.getCurrentUserWorkspace().getBuildMode()).toBe(BuildMode.BUILD_FIRST);
  });

  it('getCurrentUserWorkspace() returns a Workspace rooted at process.cwd()', () => {
    const currentUserWorkspace = new CompositionRoot(TEST_RUNTIME_PARAMS).getCurrentUserWorkspace();

    expect(currentUserWorkspace.getRoot()).toBe(process.cwd());
    expect(currentUserWorkspace.isAhqPackage()).toBe(false);
  });

  it('getIOMarshallerSessionFactory() returns a fresh factory instance on each call', () => {
    const root = new CompositionRoot(TEST_RUNTIME_PARAMS);

    const factoryA = root.getIOMarshallerSessionFactory();
    const factoryB = root.getIOMarshallerSessionFactory();

    expect(factoryA).not.toBe(factoryB);
    expect(typeof factoryA.create).toBe('function');
  });
});

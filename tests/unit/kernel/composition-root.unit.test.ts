/**
 * Unit Test: CompositionRoot
 *
 * Verifies the behaviour of the public building-block getters on
 * CompositionRoot: each returns a component whose observable properties
 * match what the concrete wiring guarantees, and the runtime params
 * supplied at construction are exposed to the wiring (AHQ-197).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BuildMode } from '../../../src/interfaces/build-mode.js';
import { CompositionRoot } from '../../../src/kernel/composition-root.js';
import { DefaultAhqPackageRoot } from '../../../src/runtime-params/default-ahq-package-root.js';
import { DefaultAhqRuntimeParams } from '../../../src/runtime-params/default-ahq-runtime-params.js';
import { AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR } from '../../../src/workflow-discovery/workspace/ahq-workspace-impl.js';

const TEST_RUNTIME_PARAMS = new DefaultAhqRuntimeParams(
  BuildMode.BUILD_FIRST,
  new DefaultAhqPackageRoot('/test-ahq-package-root')
);

describe('CompositionRoot', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('getAhqRuntimeParams() returns the params supplied at construction', () => {
    const params = new DefaultAhqRuntimeParams(
      BuildMode.PREBUILT,
      new DefaultAhqPackageRoot('/installed/pkg')
    );

    expect(new CompositionRoot(params).getAhqRuntimeParams()).toBe(params);
  });

  it('getAhqWorkspace() returns a Workspace rooted at AGENTIC_HQ_WORKSPACE_ROOT', () => {
    vi.stubEnv(AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR, '/test-ahq-root');

    const ahqWorkspace = new CompositionRoot(TEST_RUNTIME_PARAMS).getAhqWorkspace();

    expect(ahqWorkspace.getRoot()).toBe('/test-ahq-root');
    expect(ahqWorkspace.isAhqWorkspace()).toBe(true);
  });

  it('getCurrentUserWorkspace() returns a Workspace rooted at process.cwd()', () => {
    vi.stubEnv(AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR, '/some-other-ahq-root');

    const currentUserWorkspace = new CompositionRoot(TEST_RUNTIME_PARAMS).getCurrentUserWorkspace();

    expect(currentUserWorkspace.getRoot()).toBe(process.cwd());
    expect(currentUserWorkspace.isAhqWorkspace()).toBe(false);
  });

  it('getIOMarshallerSessionFactory() returns a fresh factory instance on each call', () => {
    const root = new CompositionRoot(TEST_RUNTIME_PARAMS);

    const factoryA = root.getIOMarshallerSessionFactory();
    const factoryB = root.getIOMarshallerSessionFactory();

    expect(factoryA).not.toBe(factoryB);
    expect(typeof factoryA.create).toBe('function');
  });
});

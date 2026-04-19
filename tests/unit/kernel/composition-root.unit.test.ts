/**
 * Unit Test: CompositionRoot
 *
 * Verifies the behaviour of the four public building-block getters on
 * CompositionRoot: each returns a component whose observable properties
 * match what the concrete wiring guarantees.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CompositionRoot } from '../../../src/kernel/composition-root.js';
import { AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR } from '../../../src/workflow-discovery/workspace/ahq-workspace-impl.js';

describe('CompositionRoot', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('getAhqWorkspace() returns a Workspace rooted at AGENTIC_HQ_WORKSPACE_ROOT', () => {
    vi.stubEnv(AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR, '/test-ahq-root');

    const ahqWorkspace = new CompositionRoot().getAhqWorkspace();

    expect(ahqWorkspace.getRoot()).toBe('/test-ahq-root');
    expect(ahqWorkspace.isAhqWorkspace()).toBe(true);
  });

  it('getCurrentUserWorkspace() returns a Workspace rooted at process.cwd()', () => {
    vi.stubEnv(AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR, '/some-other-ahq-root');

    const currentUserWorkspace = new CompositionRoot().getCurrentUserWorkspace();

    expect(currentUserWorkspace.getRoot()).toBe(process.cwd());
    expect(currentUserWorkspace.isAhqWorkspace()).toBe(false);
  });

  it('getIOMarshallerSessionFactory() returns a fresh factory instance on each call', () => {
    const root = new CompositionRoot();

    const factoryA = root.getIOMarshallerSessionFactory();
    const factoryB = root.getIOMarshallerSessionFactory();

    expect(factoryA).not.toBe(factoryB);
    expect(typeof factoryA.create).toBe('function');
  });
});

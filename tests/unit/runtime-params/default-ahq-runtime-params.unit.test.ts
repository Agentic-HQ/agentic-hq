/**
 * Unit Test: DefaultAhqRuntimeParams (AHQ-197)
 *
 * The runtime-params aggregate: constructor-injected BuildMode and
 * AhqPackageRoot, exposed through the AhqRuntimeParams getters.
 */
import { describe, expect, it } from 'vitest';

import { BuildMode } from '../../../src/interfaces/build-mode.js';
import { DefaultAhqPackageRoot } from '../../../src/runtime-params/default-ahq-package-root.js';
import { DefaultAhqRuntimeParams } from '../../../src/runtime-params/default-ahq-runtime-params.js';

describe('DefaultAhqRuntimeParams', () => {
  it('returns the build mode and package root it was constructed with', () => {
    const ahqPackageRoot = new DefaultAhqPackageRoot('/installed/pkg');

    const params = new DefaultAhqRuntimeParams(BuildMode.PREBUILT, ahqPackageRoot);

    expect(params.getBuildMode()).toBe(BuildMode.PREBUILT);
    expect(params.getAhqPackageRoot()).toBe(ahqPackageRoot);
  });
});

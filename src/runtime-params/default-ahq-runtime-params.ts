/**
 * DefaultAhqRuntimeParams — the standard AhqRuntimeParams aggregate.
 *
 * SRP Does: Hold a constructor-injected BuildMode and AhqPackageRoot and
 * expose them through the AhqRuntimeParams getters.
 *
 * SRP Knows Nothing About: How either value is obtained (argv extraction,
 * CLI options) or acted upon.
 */

import type { AhqPackageRoot } from '../interfaces/ahq-package-root.js';
import type { AhqRuntimeParams } from '../interfaces/ahq-runtime-params.js';
import type { BuildMode } from '../interfaces/build-mode.js';

export class DefaultAhqRuntimeParams implements AhqRuntimeParams {
  constructor(
    private readonly buildMode: BuildMode,
    private readonly ahqPackageRoot: AhqPackageRoot
  ) {}

  getBuildMode(): BuildMode {
    return this.buildMode;
  }

  getAhqPackageRoot(): AhqPackageRoot {
    return this.ahqPackageRoot;
  }
}

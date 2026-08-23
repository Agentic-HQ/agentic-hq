/**
 * AhqRuntimeParams — the explicit runtime parameters of the AHQ execution
 * chain (AHQ-197).
 *
 * Aggregates the BuildMode and AhqPackageRoot value objects. Both flow
 * VISIBLY from the entry points through the TypeScript, across the
 * Claude/skill hop as an opaque pass-through, to the shared workflow
 * runner — the only code that acts on the build mode. Never sourced from
 * environment variables, required with no defaults (AHQ-195 parent brief).
 */

import type { AhqPackageRoot } from './ahq-package-root.js';
import type { BuildMode } from './build-mode.js';

export interface AhqRuntimeParams {
  getBuildMode(): BuildMode;
  getAhqPackageRoot(): AhqPackageRoot;
}

/**
 * ToolFactory — mints a Tool wired for one workflow launch (AHQ-208).
 *
 * `build-mode` is per-workflow (the mode of the workflow being launched, not
 * of the process), so the Tool that relays it across the skill hop must be
 * created per launch, carrying that workflow's mode. Implementations hold
 * whatever does NOT vary per workflow (e.g. the AhqPackageRoot) and inject
 * the mode at creation time.
 */
import type { BuildMode } from './build-mode.js';
import type { Tool } from './tool.js';

export interface ToolFactory {
  /** Create a Tool whose runtime params carry the given workflow's build mode. */
  createTool(buildMode: BuildMode): Tool;
}

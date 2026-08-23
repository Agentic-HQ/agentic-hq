import type { BuildMode } from '../../interfaces/build-mode.js';
import type { Plugin } from '../plugin/plugin.js';

import type { WorkflowRegistry } from './workflow-registry.js';

/**
 * Workspace — A workspace containing plugins whose workflows can be
 * listed and registered for CLI execution.
 *
 * SRP Does: Expose this workspace's display name, plugins, root path,
 * and AHQ-workspace identity, and register its workflows with a registry.
 *
 * SRP Knows About: That a workspace has a display name, plugins, and
 * a root directory under which `.agentic-hq/` lives.
 *
 * SRP Knows Nothing About: How plugins are discovered, how listings
 * are formatted, or how registration works.
 */
export interface Workspace {
  /** Return this workspace's display name (e.g. `Agentic HQ Package`, `Local Workspace`). */
  getDisplayName(): string;
  /** Return this workspace's plugins in discovery order. */
  getPlugins(): Plugin[];
  /** Tell each plugin in this workspace to register its workflows with the registry. */
  registerWorkflowsWith(registry: WorkflowRegistry): void;
  /** Return the absolute path of this workspace's root directory. */
  getRoot(): string;
  /** Return `{root}/.agentic-hq/temp` — this workspace's temp-file directory. */
  getTempDir(): string;
  /** Return `{root}/.agentic-hq` — this workspace's AHQ config directory. */
  getDotAgenticHqDir(): string;
  /** Return true iff this workspace's root equals the AHQ package root. */
  isAhqPackage(): boolean;
  /** The mode of every workflow discovered under this workspace (AHQ-208): a user workspace holds
   *  source → BUILD_FIRST; the AHQ package's workflows inherit the wrapper's mode. */
  getBuildMode(): BuildMode;
}

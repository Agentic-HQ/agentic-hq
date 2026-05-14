import * as fs from 'node:fs';
import * as path from 'node:path';

import type { WorkflowRegistry } from '../interfaces/workflow-registry.js';
import type { Workspace } from '../interfaces/workspace.js';
import { PluginImpl } from '../plugin/plugin-impl.js';
import type { Plugin } from '../plugin/plugin.js';

const DOT_AGENTIC_HQ_DIR_NAME = '.agentic-hq';
const TEMP_SUBDIR_NAME = 'temp';
const PLUGINS_DIR = path.join(DOT_AGENTIC_HQ_DIR_NAME, 'plugins');
const AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR = 'AGENTIC_HQ_WORKSPACE_ROOT';

/**
 * WorkspaceImpl — Concrete Workspace that scans for plugin directories
 * and exposes them as `Plugin[]` to whoever needs them (the CLI listing
 * formatter, the registry registration loop, etc.).
 *
 * SRP Does: Scan the `.agentic-hq/plugins/` directory for plugin
 * subdirectories, create a PluginImpl for each, and expose them as
 * `Plugin[]`. No stored state — plugins are discovered fresh each
 * method call (see `feedback_avoid_cached_state`).
 *
 * SRP Knows About: The `.agentic-hq/plugins/` directory convention,
 * the workspace display name and root path, and the PluginImpl constructor.
 *
 * SRP Knows Nothing About: How plugins discover workflows, how the
 * listing is formatted, or how registration works.
 */
export class WorkspaceImpl implements Workspace {
  constructor(
    private readonly displayName: string,
    private readonly rootDir: string
  ) {}

  /** Return the workspace's display name (e.g. `Agentic HQ Workspace`, `Local Workspace`). */
  getDisplayName(): string {
    return this.displayName;
  }

  /** Discover and return this workspace's plugins in directory order. */
  getPlugins(): Plugin[] {
    const pluginsPath = path.join(this.rootDir, PLUGINS_DIR);
    if (!fs.existsSync(pluginsPath)) {
      return [];
    }
    const entries = fs.readdirSync(pluginsPath, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => new PluginImpl(e.name, this.rootDir));
  }

  /** Tell each discovered plugin to register its workflows with the registry. */
  registerWorkflowsWith(registry: WorkflowRegistry): void {
    for (const plugin of this.getPlugins()) {
      plugin.registerWorkflowsWith(registry);
    }
  }

  /** Return the absolute path of this workspace's root directory. */
  getRoot(): string {
    return this.rootDir;
  }

  /** Return `{root}/.agentic-hq/temp` — this workspace's temp-file directory. */
  getTempDir(): string {
    return path.join(this.rootDir, DOT_AGENTIC_HQ_DIR_NAME, TEMP_SUBDIR_NAME);
  }

  /** Return `{root}/.agentic-hq` — this workspace's AHQ config directory. */
  getDotAgenticHqDir(): string {
    return path.join(this.rootDir, DOT_AGENTIC_HQ_DIR_NAME);
  }

  /** Return true iff rootDir equals the AGENTIC_HQ_WORKSPACE_ROOT env var (plain string equality, per Q5). */
  isAhqWorkspace(): boolean {
    return this.rootDir === process.env[AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR];
  }
}

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { WorkflowRegistry } from '../interfaces/workflow-registry.js';
import type { Workspace } from '../interfaces/workspace.js';
import { PluginImpl } from '../plugin/plugin-impl.js';

const DOT_AGENTIC_HQ_DIR_NAME = '.agentic-hq';
const TEMP_SUBDIR_NAME = 'temp';
const PLUGINS_DIR = path.join(DOT_AGENTIC_HQ_DIR_NAME, 'plugins');
const AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR = 'AGENTIC_HQ_WORKSPACE_ROOT';

/**
 * WorkspaceImpl — Concrete Workspace that scans for plugin directories
 * and delegates listing and registration to PluginImpl instances.
 *
 * SRP Does: Scan the `.agentic-hq/plugins/` directory for plugin
 * subdirectories, create a PluginImpl for each, and delegate listing
 * or registration to them. No stored state — plugins are discovered
 * fresh each method call.
 *
 * SRP Knows About: The `.agentic-hq/plugins/` directory convention,
 * the workspace header format, and the PluginImpl constructor.
 *
 * SRP Knows Nothing About: How plugins discover workflows, how
 * individual listings are formatted, or how registration works.
 */
export class WorkspaceImpl implements Workspace {
  constructor(
    private readonly displayName: string,
    private readonly rootDir: string
  ) {}

  /** Return the workspace's full listing section (header + per-plugin sections). */
  getWorkflowListingString(): string {
    const header = `${this.displayName} (directory: ${this.rootDir}):-`;
    const plugins = this.discoverPlugins();
    const pluginSections = plugins.map((p) => p.getPluginListingString()).join('\n');
    return pluginSections ? `${header}\n${pluginSections}` : header;
  }

  /** Tell each discovered plugin to register its workflows with the registry. */
  registerWorkflowsWith(registry: WorkflowRegistry): void {
    const plugins = this.discoverPlugins();
    for (const plugin of plugins) {
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

  /** Discover plugin directories under `.agentic-hq/plugins/`. */
  private discoverPlugins(): PluginImpl[] {
    const pluginsPath = path.join(this.rootDir, PLUGINS_DIR);
    if (!fs.existsSync(pluginsPath)) {
      return [];
    }
    const entries = fs.readdirSync(pluginsPath, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => new PluginImpl(e.name, this.rootDir));
  }
}

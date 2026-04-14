import type { WorkflowRegistry } from '../interfaces/workflow-registry.js';
import { AhqWorkflowImpl } from '../workflow/ahq-workflow-impl.js';

import { PluginDirectoryImpl } from './plugin-directory-impl.js';
import type { Plugin } from './plugin.js';

/**
 * PluginImpl — Concrete Plugin that discovers workflows within a
 * single plugin directory and formats the per-plugin listing section.
 *
 * SRP Does: Discover workflow files within a single plugin (via
 * PluginDirectoryImpl), create AhqWorkflowImpl for each, and format
 * the plugin's listing section or register workflows with a registry.
 *
 * SRP Knows About: The plugin name, workspace root, the
 * PluginDirectoryImpl constructor, and the AhqWorkflowImpl constructor.
 *
 * SRP Knows Nothing About: How workflow files are globbed, what the
 * listing header looks like, or how registration works.
 */
export class PluginImpl implements Plugin {
  constructor(
    private readonly pluginName: string,
    private readonly workspaceRoot: string
  ) {}

  /** Return the plugin's listing section: "Plugin: {name}\nWorkflows:\n{entries}". */
  getPluginListingString(): string {
    const entries = this.discoverWorkflows().map((w) => w.getWorkflowListingEntryString());
    return `Plugin: ${this.pluginName}\nWorkflows:\n${entries.join('\n')}`;
  }

  /** Register each discovered workflow with the registry. */
  registerWorkflowsWith(registry: WorkflowRegistry): void {
    for (const workflow of this.discoverWorkflows()) {
      registry.register(workflow);
    }
  }

  /** Discover workflow files in this plugin and create an AhqWorkflow for each. */
  private discoverWorkflows(): AhqWorkflowImpl[] {
    const pluginDir = new PluginDirectoryImpl(this.pluginName, this.workspaceRoot);
    const files = pluginDir.findWorkflowFiles();
    return files.map((f) => new AhqWorkflowImpl(f));
  }
}

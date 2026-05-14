import type { AhqWorkflow } from '../interfaces/ahq-workflow.js';
import type { WorkflowRegistry } from '../interfaces/workflow-registry.js';
import { AhqWorkflowImpl } from '../workflow/ahq-workflow-impl.js';

import { PluginDirectoryImpl } from './plugin-directory-impl.js';
import type { Plugin } from './plugin.js';

/**
 * PluginImpl — Concrete Plugin that discovers workflows within a
 * single plugin directory and exposes them as `AhqWorkflow[]`.
 *
 * SRP Does: Discover workflow files within a single plugin (via
 * PluginDirectoryImpl), create an AhqWorkflowImpl for each, and
 * expose them — either as `AhqWorkflow[]` for the listing formatter
 * or by registering each with a WorkflowRegistry.
 *
 * SRP Knows About: The plugin name, workspace root, the
 * PluginDirectoryImpl constructor, and the AhqWorkflowImpl constructor.
 *
 * SRP Knows Nothing About: How workflow files are globbed, what the
 * listing looks like, or how registration works.
 */
export class PluginImpl implements Plugin {
  constructor(
    private readonly pluginName: string,
    private readonly workspaceRoot: string
  ) {}

  /** Return this plugin's name (the directory name under `.agentic-hq/plugins/`). */
  getName(): string {
    return this.pluginName;
  }

  /** Discover and return this plugin's workflows in glob order. */
  getWorkflows(): AhqWorkflow[] {
    const pluginDir = new PluginDirectoryImpl(this.pluginName, this.workspaceRoot);
    const files = pluginDir.findWorkflowFiles();
    return files.map((f) => new AhqWorkflowImpl(f));
  }

  /** Register each discovered workflow with the registry. */
  registerWorkflowsWith(registry: WorkflowRegistry): void {
    for (const workflow of this.getWorkflows()) {
      registry.register(workflow);
    }
  }
}

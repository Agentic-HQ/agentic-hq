import type { AhqWorkflow } from '../interfaces/ahq-workflow.js';
import type { WorkflowRegistry } from '../interfaces/workflow-registry.js';

/**
 * Plugin — A plugin containing workflows that can be listed and
 * registered for CLI execution.
 *
 * SRP Does: Expose this plugin's name and workflows, and register
 * its workflows with a registry.
 *
 * SRP Knows About: That a plugin has a name and workflows that can
 * be read or registered.
 *
 * SRP Knows Nothing About: How workflows are discovered, how the
 * listing is formatted, or how registration works.
 */
export interface Plugin {
  /** Return this plugin's name (the plugin directory name under `.agentic-hq/plugins/`). */
  getName(): string;
  /** Return this plugin's workflows in discovery order. */
  getWorkflows(): AhqWorkflow[];
  /** Register each workflow in this plugin with the registry. */
  registerWorkflowsWith(registry: WorkflowRegistry): void;
}

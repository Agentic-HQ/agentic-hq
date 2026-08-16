import { ShortIdAlreadyRegisteredError } from '../errors/short-id-already-registered-error.js';
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
 * or by registering each with a WorkflowRegistry, skipping any the
 * registry rejects as already registered (first registration wins,
 * AHQ-205) and carrying on with the rest.
 *
 * SRP Knows About: The plugin name, workspace root, the
 * PluginDirectoryImpl constructor, the AhqWorkflowImpl constructor,
 * and that a WorkflowRegistry signals a duplicate short name with
 * ShortIdAlreadyRegisteredError.
 *
 * SRP Knows Nothing About: How workflow files are globbed, what the
 * listing looks like, or how the registry creates subcommands.
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

  /**
   * Register each discovered workflow with the registry. A workflow the registry rejects
   * because its short name is already registered is skipped — the first registration wins
   * (AHQ-205) and `agentic-hq list` shows the loser as DISABLED — and registration carries
   * on with the next workflow. Any other error propagates.
   */
  registerWorkflowsWith(registry: WorkflowRegistry): void {
    for (const workflow of this.getWorkflows()) {
      try {
        registry.register(workflow);
      } catch (error) {
        if (error instanceof ShortIdAlreadyRegisteredError) {
          // Nothing to do: the short name is already taken by an earlier registration and the
          // first one wins (AHQ-205), so this workflow simply does not become a subcommand.
          // `agentic-hq list` is what tells the user (it flags the loser DISABLED); the remaining
          // workflows in this plugin must still be registered, so move on to the next one.
          continue;
        }
        throw error;
      }
    }
  }
}

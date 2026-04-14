import type { WorkflowRegistry } from '../interfaces/workflow-registry.js';

/**
 * Plugin — A plugin containing workflows that can be listed and
 * registered for CLI execution.
 *
 * Note: this interface is not currently referenced as a declared
 * type by any production code — callers use `PluginImpl` directly
 * (e.g. `WorkspaceImpl.discoverPlugins()` returns `PluginImpl[]`).
 * It is deliberately kept per DR.1 ("class/interface pair for every
 * concept") for future switchability (test doubles / alternative
 * impls). See
 * `docs/jira-docs/AHQ-106/workflow-files/e2e-test-files/04a-refactor-phase-proposed-refactors.md`
 * §`Refactor 2.6: Delete PluginDirectory.toString() (dead — downstream of 2.3)`
 * (and the adjacent 2.7 rejection note) for the rationale — the
 * same "keep the pair rather than collapse it" reasoning applies here.
 *
 * SRP Does: Return the plugin's listing section and register its
 * workflows with a registry.
 *
 * SRP Knows About: That a plugin has a displayable listing section
 * and workflows that can be registered.
 *
 * SRP Knows Nothing About: How workflows are discovered, how the
 * listing is formatted, or how registration works.
 */
export interface Plugin {
  /** Return this plugin's listing section (header + workflow entries). */
  getPluginListingString(): string;
  /** Register each workflow in this plugin with the registry. */
  registerWorkflowsWith(registry: WorkflowRegistry): void;
}

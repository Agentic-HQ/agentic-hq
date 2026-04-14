import type { WorkflowRegistry } from './workflow-registry.js';

/**
 * Workspace — A workspace containing plugins whose workflows can be
 * listed and registered for CLI execution.
 *
 * SRP Does: Return the workspace's workflow listing string and
 * register its workflows with a registry.
 *
 * SRP Knows About: That a workspace has a displayable listing and
 * workflows that can be registered.
 *
 * SRP Knows Nothing About: How plugins are discovered, how listings
 * are formatted, or how registration works.
 */
export interface Workspace {
  /** Return this workspace's full listing section (header + per-plugin entries). */
  getWorkflowListingString(): string;
  /** Tell each plugin in this workspace to register its workflows with the registry. */
  registerWorkflowsWith(registry: WorkflowRegistry): void;
}

import type { WorkflowRegistry } from './workflow-registry.js';

/**
 * WorkflowSearchResults — Results of discovering workflows; returns
 * the full listing (header + entries) for the user and registers
 * workflows for CLI execution.
 *
 * SRP Does: Return the full listing string (header plus entries)
 * ready to show the user, and register all discovered workflows
 * with a WorkflowRegistry.
 *
 * SRP Knows About: That the listing has a header prepended to the
 * per-workspace entries, and that workflows can be registered.
 *
 * SRP Knows Nothing About: How workflows are discovered or how
 * individual entry lines are formatted.
 *
 * Future: a rename to `Workspaces` is captured in
 * docs/jira-docs/AHQ-106/workflow-files/jiras-for-later/rename-WorkflowSearchResults-to-Workspaces-jira-description.md.
 */
export interface WorkflowSearchResults {
  /** Return the full workflow listing string with header. */
  getWorkflowsListingString(): string;
  /** Register all discovered workflows with the given registry. */
  registerWorkflowsWith(registry: WorkflowRegistry): void;
}

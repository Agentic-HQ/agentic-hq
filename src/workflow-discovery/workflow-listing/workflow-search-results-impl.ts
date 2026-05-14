import { ListingFormatter } from '../../cli/listing/listing-formatter.js';
import type { WorkflowRegistry } from '../interfaces/workflow-registry.js';
import type { WorkflowSearchResults } from '../interfaces/workflow-search-results.js';
import type { Workspace } from '../interfaces/workspace.js';
import { AhqWorkspaceImpl } from '../workspace/ahq-workspace-impl.js';
import { CurrentUserWorkspaceImpl } from '../workspace/current-user-workspace-impl.js';

/**
 * WorkflowSearchResultsImpl — Concrete WorkflowSearchResults that
 * wires up the AHQ workspace and current user workspace, and hands
 * them to a ListingFormatter for the listing string or registers
 * their workflows directly with a WorkflowRegistry.
 *
 * SRP Does: Compose AhqWorkspaceImpl + CurrentUserWorkspaceImpl, and
 * delegate listing-string rendering to ListingFormatter and
 * registration to each workspace.
 *
 * SRP Knows About: The default AhqWorkspaceImpl + CurrentUserWorkspaceImpl
 * composition and the ListingFormatter dependency.
 *
 * SRP Knows Nothing About: Where workspace roots are resolved from,
 * how plugins are discovered, what the listing looks like, or how
 * entry lines are formatted.
 *
 * Future: a rename to `WorkspacesImpl` is captured in
 * docs/jira-docs/AHQ-106/workflow-files/jiras-for-later/rename-WorkflowSearchResults-to-Workspaces-jira-description.md.
 */
export class WorkflowSearchResultsImpl implements WorkflowSearchResults {
  private readonly ahqWorkspace: Workspace;
  private readonly currentUserWorkspace: Workspace;
  private readonly formatter: ListingFormatter;
  constructor() {
    this.ahqWorkspace = new AhqWorkspaceImpl();
    this.currentUserWorkspace = new CurrentUserWorkspaceImpl();
    this.formatter = new ListingFormatter();
  }
  /** Return the full listing string (formatter assembles title + both workspace sections). */
  getWorkflowsListingString(): string {
    return this.formatter.formatWorkflowsListing(this.ahqWorkspace, this.currentUserWorkspace);
  }
  /** Register all workflows from both workspaces with the registry. */
  registerWorkflowsWith(registry: WorkflowRegistry): void {
    this.ahqWorkspace.registerWorkflowsWith(registry);
    this.currentUserWorkspace.registerWorkflowsWith(registry);
  }
}

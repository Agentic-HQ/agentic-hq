import { ListingFormatter } from '../../cli/listing/listing-formatter.js';
import type { AhqPackageRoot } from '../../interfaces/ahq-package-root.js';
import type { WorkflowRegistry } from '../interfaces/workflow-registry.js';
import type { WorkflowSearchResults } from '../interfaces/workflow-search-results.js';
import type { Workspace } from '../interfaces/workspace.js';
import { AhqPackageImpl } from '../workspace/ahq-package-impl.js';
import { CurrentUserWorkspaceImpl } from '../workspace/current-user-workspace-impl.js';

/**
 * WorkflowSearchResultsImpl — Concrete WorkflowSearchResults that
 * wires up the AHQ package and current user workspace, and hands
 * them to a ListingFormatter for the listing string or registers
 * their workflows directly with a WorkflowRegistry.
 *
 * SRP Does: Compose AhqPackageImpl + CurrentUserWorkspaceImpl
 * (injecting the AhqPackageRoot received at construction into both),
 * and delegate listing-string rendering to ListingFormatter and
 * registration to each workspace.
 *
 * SRP Knows About: The default AhqPackageImpl + CurrentUserWorkspaceImpl
 * composition, the AhqPackageRoot they need, and the ListingFormatter
 * dependency.
 *
 * SRP Knows Nothing About: How plugins are discovered, what the
 * listing looks like, or how entry lines are formatted.
 *
 * Future: a rename to `WorkspacesImpl` is captured in
 * docs/jira-docs/AHQ-106/workflow-files/jiras-for-later/rename-WorkflowSearchResults-to-Workspaces-jira-description.md.
 */
export class WorkflowSearchResultsImpl implements WorkflowSearchResults {
  private readonly ahqPackage: Workspace;
  private readonly currentUserWorkspace: Workspace;
  private readonly formatter: ListingFormatter;
  constructor(ahqPackageRoot: AhqPackageRoot) {
    this.ahqPackage = new AhqPackageImpl(ahqPackageRoot);
    this.currentUserWorkspace = new CurrentUserWorkspaceImpl(ahqPackageRoot);
    this.formatter = new ListingFormatter();
  }
  /** Return the full listing string (formatter assembles title + both workspace sections). */
  getWorkflowsListingString(): string {
    return this.formatter.formatWorkflowsListing(this.ahqPackage, this.currentUserWorkspace);
  }
  /**
   * Register all workflows from both workspaces with the registry. The local workspace goes
   * FIRST: WorkflowRegistryImpl keeps the first registration of a short name, so this order is
   * what makes the local workspace win a shortId collision with the AHQ package (AHQ-205).
   */
  registerWorkflowsWith(registry: WorkflowRegistry): void {
    this.currentUserWorkspace.registerWorkflowsWith(registry);
    this.ahqPackage.registerWorkflowsWith(registry);
  }
}

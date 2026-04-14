import type { WorkflowRegistry } from '../interfaces/workflow-registry.js';
import type { WorkflowSearchResults } from '../interfaces/workflow-search-results.js';
import type { Workspace } from '../interfaces/workspace.js';
import { AhqWorkspaceImpl } from '../workspace/ahq-workspace-impl.js';
import { CurrentUserWorkspaceImpl } from '../workspace/current-user-workspace-impl.js';

const WORKFLOWS_LIST_HEADER = 'Available workflows:\n\n';

/**
 * WorkflowSearchResultsImpl — Concrete WorkflowSearchResults that
 * wires up the AHQ workspace and current user workspace, then
 * prepends the listing header.
 *
 * SRP Does: Wire up AhqWorkspaceImpl and CurrentUserWorkspaceImpl
 * and prepend the `Available workflows:` header to the combined
 * workspace listings.
 *
 * SRP Knows About: The listing header text and the default
 * AhqWorkspaceImpl + CurrentUserWorkspaceImpl composition.
 *
 * SRP Knows Nothing About: Where the workspace roots are resolved
 * from, how plugins are discovered, or how entry lines are formatted.
 *
 * Future: a rename to `WorkspacesImpl` is captured in
 * docs/jira-docs/AHQ-106/workflow-files/jiras-for-later/rename-WorkflowSearchResults-to-Workspaces-jira-description.md.
 */
export class WorkflowSearchResultsImpl implements WorkflowSearchResults {
  private readonly ahqWorkspace: Workspace;
  private readonly currentUserWorkspace: Workspace;
  constructor() {
    this.ahqWorkspace = new AhqWorkspaceImpl();
    this.currentUserWorkspace = new CurrentUserWorkspaceImpl();
  }
  /** Return the full listing string: header + both workspace sections. */
  getWorkflowsListingString(): string {
    const ahqSection = this.ahqWorkspace.getWorkflowListingString();
    const userSection = this.currentUserWorkspace.getWorkflowListingString();
    return `${WORKFLOWS_LIST_HEADER}${ahqSection}\n\n${userSection}`;
  }
  /** Register all workflows from both workspaces with the registry. */
  registerWorkflowsWith(registry: WorkflowRegistry): void {
    this.ahqWorkspace.registerWorkflowsWith(registry);
    this.currentUserWorkspace.registerWorkflowsWith(registry);
  }
}

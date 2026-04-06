import type { AhqWorkflows } from '../interfaces/ahq-workflows.js';
import type { WorkflowSearchResults } from '../interfaces/workflow-search-results.js';
import { AhqWorkspaceImpl } from '../workspace/ahq-workspace-impl.js';

import { AhqWorkflowsImpl } from './ahq-workflows-impl.js';

const WORKFLOWS_LIST_HEADER = 'Available workflows:\n\n';

/**
 * WorkflowSearchResultsImpl — Concrete WorkflowSearchResults that
 * wires up the default workspace and workflows, then prepends the
 * listing header.
 *
 * SRP Does: Wire up the default AhqWorkspace and AhqWorkflows and
 * prepend the `Available workflows:` header to the listing body.
 *
 * SRP Knows About: The listing header text and the default
 * AhqWorkspaceImpl + AhqWorkflowsImpl composition.
 *
 * SRP Knows Nothing About: Where the workspace root is resolved
 * from, how files are globbed, or how entry lines are formatted.
 */
export class WorkflowSearchResultsImpl implements WorkflowSearchResults {
  private readonly workflows: AhqWorkflows;
  constructor() {
    this.workflows = new AhqWorkflowsImpl(new AhqWorkspaceImpl());
  }
  /** Return the full listing string: header + newline-joined entries. */
  getWorkflowsListingString(): string {
    return `${WORKFLOWS_LIST_HEADER}${this.workflows.getWorkflowListingEntriesString()}`;
  }
}

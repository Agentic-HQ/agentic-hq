import type { WorkflowRegistry } from '../interfaces/workflow-registry.js';
import type { Workspace } from '../interfaces/workspace.js';

import { WorkspaceImpl } from './workspace-impl.js';

export const AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR = 'AGENTIC_HQ_WORKSPACE_ROOT';
const AHQ_WORKSPACE_DISPLAY_NAME = 'Agentic HQ Workspace';

/**
 * AhqWorkspaceImpl — Concrete Workspace that reads the root path
 * from the `AGENTIC_HQ_WORKSPACE_ROOT` env var and delegates
 * listing/registration to a WorkspaceImpl.
 *
 * SRP Does: Read the workspace root path from the
 * `AGENTIC_HQ_WORKSPACE_ROOT` env var and delegate
 * listing/registration to a WorkspaceImpl.
 *
 * SRP Knows About: The `AGENTIC_HQ_WORKSPACE_ROOT` env var name
 * and the WorkspaceImpl constructor.
 *
 * SRP Knows Nothing About: How plugins are discovered or how
 * listings are formatted.
 */
export class AhqWorkspaceImpl implements Workspace {
  /** Return the AHQ workspace's full listing section (delegates to WorkspaceImpl). */
  getWorkflowListingString(): string {
    return this.createDelegate().getWorkflowListingString();
  }

  /** Register all AHQ workspace workflows with the registry (delegates to WorkspaceImpl). */
  registerWorkflowsWith(registry: WorkflowRegistry): void {
    this.createDelegate().registerWorkflowsWith(registry);
  }

  private createDelegate(): WorkspaceImpl {
    return new WorkspaceImpl(AHQ_WORKSPACE_DISPLAY_NAME, this.getRoot());
  }

  private getRoot(): string {
    return process.env[AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR] ?? '';
  }
}

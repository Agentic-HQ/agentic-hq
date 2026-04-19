import type { WorkflowRegistry } from '../interfaces/workflow-registry.js';
import type { Workspace } from '../interfaces/workspace.js';

import { WorkspaceImpl } from './workspace-impl.js';

const LOCAL_WORKSPACE_DISPLAY_NAME = 'Local Workspace';
const SAME_AS_AHQ_MESSAGE =
  'Local Workspace: Same as Agentic HQ Workspace (running from within the AHQ directory)';

/**
 * CurrentUserWorkspaceImpl — Concrete Workspace for the user's
 * current working directory. When cwd equals the AHQ workspace root,
 * returns a "same as" message instead of listing plugins.
 *
 * SRP Does: Check if cwd matches the AHQ workspace root. If so,
 * return a "same as" message. If not, delegate to a WorkspaceImpl
 * created with "Local Workspace" and cwd as root.
 *
 * SRP Knows About: The `AGENTIC_HQ_WORKSPACE_ROOT` env var, the
 * "same as" message format, and the WorkspaceImpl constructor.
 *
 * SRP Knows Nothing About: How plugins are discovered or how
 * listings are formatted (that's WorkspaceImpl's job).
 */
export class CurrentUserWorkspaceImpl implements Workspace {
  /** Return the local workspace listing, or "same as AHQ" message if directories match. */
  getWorkflowListingString(): string {
    if (this.isAhqWorkspace()) {
      return SAME_AS_AHQ_MESSAGE;
    }
    return this.createDelegate().getWorkflowListingString();
  }

  /** Register workflows from local workspace, or nothing if same as AHQ (no duplicates). */
  registerWorkflowsWith(registry: WorkflowRegistry): void {
    if (this.isAhqWorkspace()) {
      return;
    }
    this.createDelegate().registerWorkflowsWith(registry);
  }

  /** Return process.cwd() via delegate. */
  getRoot(): string {
    return this.createDelegate().getRoot();
  }

  /** Return `{cwd}/.agentic-hq/temp` via delegate. */
  getTempDir(): string {
    return this.createDelegate().getTempDir();
  }

  /** Return `{cwd}/.agentic-hq` via delegate. */
  getDotAgenticHqDir(): string {
    return this.createDelegate().getDotAgenticHqDir();
  }

  /** Return true iff cwd equals the AHQ workspace root (via delegate). */
  isAhqWorkspace(): boolean {
    return this.createDelegate().isAhqWorkspace();
  }

  private createDelegate(): WorkspaceImpl {
    return new WorkspaceImpl(LOCAL_WORKSPACE_DISPLAY_NAME, process.cwd());
  }
}

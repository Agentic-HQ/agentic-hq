import type { AhqPackageRoot } from '../../interfaces/ahq-package-root.js';
import type { WorkflowRegistry } from '../interfaces/workflow-registry.js';
import type { Workspace } from '../interfaces/workspace.js';
import type { Plugin } from '../plugin/plugin.js';

import { WorkspaceImpl } from './workspace-impl.js';

const LOCAL_WORKSPACE_DISPLAY_NAME = 'Local Workspace';

/**
 * CurrentUserWorkspaceImpl — Concrete Workspace for the user's
 * current working directory. Delegates to a WorkspaceImpl created
 * on the fly with cwd as rootDir and the injected AhqPackageRoot
 * (used by the same-as-AHQ dedup guard).
 *
 * SRP Does: Build a WorkspaceImpl for the current working directory
 * (with the "Local Workspace" display name) and delegate all Workspace
 * methods to it. The same-as-AHQ duplicate-prevention applies only to
 * `registerWorkflowsWith` (so workflows aren't registered twice) — the
 * listing's "Same as AHQ" message is rendered by `ListingFormatter`,
 * which reads `isAhqPackage()` itself.
 *
 * SRP Knows About: The "Local Workspace" display name, that the
 * cwd is the workspace root, and the injected AhqPackageRoot it
 * passes to its delegate.
 *
 * SRP Knows Nothing About: How plugins are discovered, how listings
 * are formatted, or the "Same as AHQ" message text.
 */
export class CurrentUserWorkspaceImpl implements Workspace {
  constructor(private readonly ahqPackageRoot: AhqPackageRoot) {}

  /** Return the local workspace display name. */
  getDisplayName(): string {
    return this.createDelegate().getDisplayName();
  }

  /** Return the plugins discovered under cwd's `.agentic-hq/plugins/`. */
  getPlugins(): Plugin[] {
    return this.createDelegate().getPlugins();
  }

  /** Register workflows from local workspace, or nothing if same as AHQ (no duplicates). */
  registerWorkflowsWith(registry: WorkflowRegistry): void {
    if (this.isAhqPackage()) {
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

  /** Return true iff cwd equals the AHQ package root (via delegate). */
  isAhqPackage(): boolean {
    return this.createDelegate().isAhqPackage();
  }

  private createDelegate(): WorkspaceImpl {
    return new WorkspaceImpl(LOCAL_WORKSPACE_DISPLAY_NAME, process.cwd(), this.ahqPackageRoot);
  }
}

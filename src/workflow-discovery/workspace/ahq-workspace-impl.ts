import type { WorkflowRegistry } from '../interfaces/workflow-registry.js';
import type { Workspace } from '../interfaces/workspace.js';
import type { Plugin } from '../plugin/plugin.js';

import { WorkspaceImpl } from './workspace-impl.js';

export const AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR = 'AGENTIC_HQ_WORKSPACE_ROOT';
const AHQ_WORKSPACE_DISPLAY_NAME = 'Agentic HQ Workspace';

/**
 * AhqWorkspaceImpl — Concrete Workspace that reads the root path
 * from the `AGENTIC_HQ_WORKSPACE_ROOT` env var and delegates
 * everything to a WorkspaceImpl.
 *
 * SRP Does: Read the workspace root path from the
 * `AGENTIC_HQ_WORKSPACE_ROOT` env var and delegate to a WorkspaceImpl.
 *
 * SRP Knows About: The `AGENTIC_HQ_WORKSPACE_ROOT` env var name,
 * the AHQ display name, and the WorkspaceImpl constructor.
 *
 * SRP Knows Nothing About: How plugins are discovered or how
 * listings are formatted.
 */
export class AhqWorkspaceImpl implements Workspace {
  /** Return the AHQ workspace display name (delegates to WorkspaceImpl). */
  getDisplayName(): string {
    return this.createDelegate().getDisplayName();
  }

  /** Return the AHQ workspace's plugins (delegates to WorkspaceImpl). */
  getPlugins(): Plugin[] {
    return this.createDelegate().getPlugins();
  }

  /** Register all AHQ workspace workflows with the registry (delegates to WorkspaceImpl). */
  registerWorkflowsWith(registry: WorkflowRegistry): void {
    this.createDelegate().registerWorkflowsWith(registry);
  }

  /** Return AHQ workspace root from env var, falling back to process.cwd() when unset. */
  getRoot(): string {
    // Fallback to process.cwd() only fires outside the CLI bin wrapper (e.g. from pnpm
    // scripts or tests run at the AHQ root) — the bin wrapper always sets AGENTIC_HQ_WORKSPACE_ROOT.
    return process.env[AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR] ?? process.cwd();
  }

  /** Return `{root}/.agentic-hq/temp` (delegates to WorkspaceImpl). */
  getTempDir(): string {
    return this.createDelegate().getTempDir();
  }

  /** Return `{root}/.agentic-hq` (delegates to WorkspaceImpl). */
  getDotAgenticHqDir(): string {
    return this.createDelegate().getDotAgenticHqDir();
  }

  /** Always true — this class IS the AHQ workspace by definition (overrides delegate). */
  isAhqWorkspace(): boolean {
    return true;
  }

  private createDelegate(): WorkspaceImpl {
    return new WorkspaceImpl(AHQ_WORKSPACE_DISPLAY_NAME, this.getRoot());
  }
}

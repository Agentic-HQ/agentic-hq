import type { AhqRuntimeParams } from '../../interfaces/ahq-runtime-params.js';
import type { BuildMode } from '../../interfaces/build-mode.js';
import type { WorkflowRegistry } from '../interfaces/workflow-registry.js';
import type { Workspace } from '../interfaces/workspace.js';
import type { Plugin } from '../plugin/plugin.js';

import { WorkspaceImpl } from './workspace-impl.js';

const AHQ_PACKAGE_DISPLAY_NAME = 'Agentic HQ Package';

/**
 * AhqPackageImpl — Concrete Workspace for the AHQ package itself, rooted at
 * the AhqPackageRoot inside the constructor-injected AhqRuntimeParams.
 *
 * SRP Does: Answer getRoot() and getBuildMode() straight from the injected
 * AhqRuntimeParams — the package's workflows INHERIT the wrapper's mode
 * (AHQ-208): dev wrapper → build-first, shipped wrapper → prebuilt — and
 * isAhqPackage() as always true (this class IS the AHQ package by
 * definition — an override, not delegation). Every other Workspace method is
 * delegated to a WorkspaceImpl built with that same root and mode.
 *
 * SRP Knows About: The injected AhqRuntimeParams, the AHQ display name,
 * and the WorkspaceImpl constructor.
 *
 * SRP Knows Nothing About: How plugins are discovered or how
 * listings are formatted.
 *
 * REFACTOR LATER: This class keeps implementing `Workspace` even though the
 * AHQ package is not really a workspace (in production it is a read-only
 * installed artifact that merely contains the shipped plugins). The deeper
 * cleanup — splitting the interface so the type system stops claiming the
 * package is a workspace (e.g. extracting a `PluginSource` interface for the
 * shared plugin-discovery half, with `Workspace` extending it for the user
 * side) — is a clean later refactor, deliberately deferred to
 * https://agentic-hq.atlassian.net/browse/AHQ-206 (description recorded in
 * docs/tickets/AHQ-200/workflow-files/supporting-docs/AHQ-206_later_refactor_jira_description.md).
 * Keeping `Workspace` for now leaves ClaudeCommandBuilder, ListingFormatter,
 * and workflow registration unchanged.
 */
export class AhqPackageImpl implements Workspace {
  constructor(private readonly ahqRuntimeParams: AhqRuntimeParams) {}

  /** Return the AHQ package display name (delegates to WorkspaceImpl). */
  getDisplayName(): string {
    return this.createDelegate().getDisplayName();
  }

  /** Return the AHQ package's plugins (delegates to WorkspaceImpl). */
  getPlugins(): Plugin[] {
    return this.createDelegate().getPlugins();
  }

  /** Register all AHQ package workflows with the registry (delegates to WorkspaceImpl). */
  registerWorkflowsWith(registry: WorkflowRegistry): void {
    this.createDelegate().registerWorkflowsWith(registry);
  }

  /** Return the injected runtime params' AhqPackageRoot path. */
  getRoot(): string {
    return this.ahqRuntimeParams.getAhqPackageRoot().getPath();
  }

  /** Return the wrapper's mode from the injected runtime params (AHQ-208) —
   *  the AHQ package's workflows run however the invoked binary says. */
  getBuildMode(): BuildMode {
    return this.ahqRuntimeParams.getBuildMode();
  }

  /** Return `{root}/.agentic-hq/temp` (delegates to WorkspaceImpl). */
  getTempDir(): string {
    return this.createDelegate().getTempDir();
  }

  /** Return `{root}/.agentic-hq` (delegates to WorkspaceImpl). */
  getDotAgenticHqDir(): string {
    return this.createDelegate().getDotAgenticHqDir();
  }

  /** Always true — this class IS the AHQ package by definition (overrides delegate). */
  isAhqPackage(): boolean {
    return true;
  }

  private createDelegate(): WorkspaceImpl {
    return new WorkspaceImpl(
      AHQ_PACKAGE_DISPLAY_NAME,
      this.getRoot(),
      this.ahqRuntimeParams.getAhqPackageRoot(),
      this.getBuildMode()
    );
  }
}

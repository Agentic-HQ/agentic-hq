/**
 * CompositionRoot — Stateless wiring kernel for generic infrastructure components.
 *
 * SRP Does: Provide factory methods that instantiate and wire the default
 * concrete classes behind each generic infrastructure interface
 * (Workspace × 2, CLIWrapper, IOMarshallerSessionFactory), plus a top-level
 * WorkflowCommandBuilder factory. Each call returns a fresh instance.
 *
 * SRP Knows About: Which concrete class implements each generic infrastructure
 * interface, how to wire them together (dependency order), and the
 * AhqRuntimeParams supplied at construction (AHQ-197) that the wiring
 * exposes to components needing them.
 *
 * SRP Knows Nothing About: Backend-specific tool assembly (that is the
 * responsibility of tool classes such as DefaultClaudeCodeTool), or how any
 * individual component works internally.
 */

import type { AhqRuntimeParams } from '../interfaces/ahq-runtime-params.js';
import type { CLIWrapper } from '../interfaces/cli-wrapper.js';
import type { IOMarshallerSessionFactory } from '../interfaces/io-marshaller-session-factory.js';
import type { WorkflowCommandBuilder } from '../interfaces/workflow-command-builder.js';
import { JsonFileIOMarshallerSessionFactory } from '../io/marshalling/json-file-io-marshaller-session-factory.js';
import { PtyCLIWrapper } from '../io/terminal/pty-cli-wrapper.js';
import { DefaultClaudeCodeToolFactory } from '../tools/marshalled-io-tools/claude-code/default-claude-code-tool-factory.js';
import { ClaudeWorkflowCommandBuilder } from '../workflow/claude/claude-workflow-command-builder.js';
import type { Workspace } from '../workflow-discovery/interfaces/workspace.js';
import { AhqPackageImpl } from '../workflow-discovery/workspace/ahq-package-impl.js';
import { CurrentUserWorkspaceImpl } from '../workflow-discovery/workspace/current-user-workspace-impl.js';

export class CompositionRoot {
  constructor(private readonly ahqRuntimeParams: AhqRuntimeParams) {}

  getAhqRuntimeParams(): AhqRuntimeParams {
    return this.ahqRuntimeParams;
  }

  getAhqPackage(): Workspace {
    return new AhqPackageImpl(this.ahqRuntimeParams);
  }

  getCurrentUserWorkspace(): Workspace {
    return new CurrentUserWorkspaceImpl(this.ahqRuntimeParams.getAhqPackageRoot());
  }

  getCLIWrapper(): CLIWrapper {
    return new PtyCLIWrapper();
  }

  getIOMarshallerSessionFactory(): IOMarshallerSessionFactory {
    return new JsonFileIOMarshallerSessionFactory(this.getCurrentUserWorkspace());
  }

  /** Create a WorkflowCommandBuilder wired to this system's tool factory, CLI wrapper, and
   *  workspace. The factory (not a single tool) is what lets each launched workflow carry its
   *  OWN build mode across the skill hop (AHQ-208). */
  getWorkflowCommandBuilder(): WorkflowCommandBuilder {
    return new ClaudeWorkflowCommandBuilder(
      new DefaultClaudeCodeToolFactory(this.ahqRuntimeParams.getAhqPackageRoot()),
      this.getCLIWrapper(),
      this.getCurrentUserWorkspace()
    );
  }
}

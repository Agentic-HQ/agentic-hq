/**
 * CompositionRoot — Stateless wiring kernel for generic infrastructure components.
 *
 * SRP Does: Provide factory methods that instantiate and wire the default
 * concrete classes behind each generic infrastructure interface
 * (Workspace × 2, CLIWrapper, IOMarshallerSessionFactory), plus a top-level
 * WorkflowCommandBuilder factory. Each call returns a fresh instance.
 *
 * SRP Knows About: Which concrete class implements each generic infrastructure
 * interface, and how to wire them together (dependency order).
 *
 * SRP Knows Nothing About: Backend-specific tool assembly (that is the
 * responsibility of tool classes such as DefaultClaudeCodeTool), or how any
 * individual component works internally.
 */

import { rootServiceRegistry } from '../classwitch-registry/root-registry.js';
import type { CLIWrapper } from '../interfaces/cli-wrapper.js';
import type { IOMarshallerSessionFactory } from '../interfaces/io-marshaller-session-factory.js';
import type { WorkflowCommandBuilder } from '../interfaces/workflow-command-builder.js';
import { JsonFileIOMarshallerSessionFactory } from '../io/marshalling/json-file-io-marshaller-session-factory.js';
import { PtyCLIWrapper } from '../io/terminal/pty-cli-wrapper.js';
import type { Workspace } from '../workflow-discovery/interfaces/workspace.js';
import { AhqWorkspaceImpl } from '../workflow-discovery/workspace/ahq-workspace-impl.js';
import { CurrentUserWorkspaceImpl } from '../workflow-discovery/workspace/current-user-workspace-impl.js';

export class CompositionRoot {
  getAhqWorkspace(): Workspace {
    return new AhqWorkspaceImpl();
  }

  getCurrentUserWorkspace(): Workspace {
    return new CurrentUserWorkspaceImpl();
  }

  getCLIWrapper(): CLIWrapper {
    return new PtyCLIWrapper();
  }

  getIOMarshallerSessionFactory(): IOMarshallerSessionFactory {
    return new JsonFileIOMarshallerSessionFactory(this.getCurrentUserWorkspace());
  }

  /** Create a WorkflowCommandBuilder wired to this system's tool, CLI wrapper, and workspace. */
  getWorkflowCommandBuilder(): WorkflowCommandBuilder {
    const ClaudeCodeToolClass = rootServiceRegistry.loadClass('DefaultClaudeCodeTool');
    const WorkflowCommandBuilderClass = rootServiceRegistry.loadClass(
      'ClaudeWorkflowCommandBuilder'
    );
    return new WorkflowCommandBuilderClass(
      new ClaudeCodeToolClass(this),
      this.getCLIWrapper(),
      this.getCurrentUserWorkspace()
    );
  }
}

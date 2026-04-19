/**
 * CompositionRoot — Stateless wiring class that maps interfaces to concrete implementations.
 *
 * SRP Does: Provide factory methods (get*) that instantiate and wire the default
 * concrete classes behind each interface. Callers get fully-wired components
 * without knowing which classes are involved.
 *
 * SRP Knows About: Which concrete class implements each interface, and how
 * to wire them together (dependency order).
 *
 * SRP Knows Nothing About: How any individual component works internally.
 */

import type { CLIWrapper } from '../interfaces/cli-wrapper.js';
import type { IOMarshallerSessionFactory } from '../interfaces/io-marshaller-session-factory.js';
import type { Tool } from '../interfaces/tool.js';
import type { WorkflowCommandBuilder } from '../interfaces/workflow-command-builder.js';
import { JsonFileIOMarshallerSessionFactory } from '../io/marshalling/json-file-io-marshaller-session-factory.js';
import { PtyCLIWrapper } from '../io/terminal/pty-cli-wrapper.js';
import { ClaudeCommandBuilder } from '../tools/marshalled-io-tools/claude-code/claude-command-builder.js';
import { MarshalledCLITool } from '../tools/marshalled-io-tools/marshalled-cli-tool.js';
import { ClaudeWorkflowCommandBuilder } from '../workflow/claude/claude-workflow-command-builder.js';
import type { Workspace } from '../workflow-discovery/interfaces/workspace.js';
import { AhqWorkspaceImpl } from '../workflow-discovery/workspace/ahq-workspace-impl.js';
import { CurrentUserWorkspaceImpl } from '../workflow-discovery/workspace/current-user-workspace-impl.js';

/** Stateless wiring class — each get* method returns a freshly-wired component. */
export class CompositionRoot {
  private getAhqWorkspace(): Workspace {
    return new AhqWorkspaceImpl();
  }

  private getCurrentUserWorkspace(): Workspace {
    return new CurrentUserWorkspaceImpl();
  }

  private getCLIWrapper(): CLIWrapper {
    return new PtyCLIWrapper();
  }

  private getIOMarshallerSessionFactory(): IOMarshallerSessionFactory {
    return new JsonFileIOMarshallerSessionFactory(this.getCurrentUserWorkspace());
  }

  getTool(): Tool {
    return new MarshalledCLITool(
      this.getIOMarshallerSessionFactory(),
      this.getCLIWrapper(),
      new ClaudeCommandBuilder(this.getAhqWorkspace(), this.getCurrentUserWorkspace()),
      this.getCurrentUserWorkspace()
    );
  }

  /** Create a WorkflowCommandBuilder wired to this system's tool, CLI wrapper, and workspace. */
  getWorkflowCommandBuilder(): WorkflowCommandBuilder {
    return new ClaudeWorkflowCommandBuilder(
      this.getTool(),
      this.getCLIWrapper(),
      this.getCurrentUserWorkspace()
    );
  }
}

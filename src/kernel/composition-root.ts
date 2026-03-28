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

import type { AgenticHqInstallation } from '../interfaces/agentic-hq-installation.js';
import type { CLIWrapper } from '../interfaces/cli-wrapper.js';
import type { GitWorkspace } from '../interfaces/git-workspace.js';
import type { IOMarshallerSessionFactory } from '../interfaces/io-marshaller-session-factory.js';
import type { Tool } from '../interfaces/tool.js';
import type { UserProjectWorkspace } from '../interfaces/user-project-workspace.js';
import type { WorkflowCommandBuilder } from '../interfaces/workflow-command-builder.js';
import { JsonFileIOMarshallerSessionFactory } from '../io/marshalling/json-file-io-marshaller-session-factory.js';
import { PtyCLIWrapper } from '../io/terminal/pty-cli-wrapper.js';
import { ClaudeCommandBuilder } from '../tools/marshalled-io-tools/claude-code/claude-command-builder.js';
import { MarshalledCLITool } from '../tools/marshalled-io-tools/marshalled-cli-tool.js';
import { ClaudeWorkflowCommandBuilder } from '../workflow/claude/claude-workflow-command-builder.js';
import { DefaultAgenticHqInstallation } from '../workspace/default-agentic-hq-installation.js';
import { DefaultGitWorkspace } from '../workspace/default-git-workspace.js';
import { DefaultUserProjectWorkspace } from '../workspace/default-user-project-workspace.js';

/** Stateless wiring class — each get* method returns a freshly-wired component. */
export class CompositionRoot {
  private getGitWorkspace(): GitWorkspace {
    return new DefaultGitWorkspace();
  }

  private getAgenticHqInstallation(): AgenticHqInstallation {
    return new DefaultAgenticHqInstallation(this.getGitWorkspace());
  }

  private getUserProjectWorkspace(): UserProjectWorkspace {
    return new DefaultUserProjectWorkspace(this.getGitWorkspace());
  }

  private getCLIWrapper(): CLIWrapper {
    return new PtyCLIWrapper();
  }

  private getIOMarshallerSessionFactory(): IOMarshallerSessionFactory {
    return new JsonFileIOMarshallerSessionFactory(this.getUserProjectWorkspace());
  }

  getTool(): Tool {
    return new MarshalledCLITool(
      this.getIOMarshallerSessionFactory(),
      this.getCLIWrapper(),
      new ClaudeCommandBuilder(this.getAgenticHqInstallation()),
      this.getUserProjectWorkspace()
    );
  }

  /** Create a WorkflowCommandBuilder wired to this system's tool, CLI wrapper, and workspace. */
  getWorkflowCommandBuilder(): WorkflowCommandBuilder {
    return new ClaudeWorkflowCommandBuilder(
      this.getTool(),
      this.getCLIWrapper(),
      this.getUserProjectWorkspace()
    );
  }
}

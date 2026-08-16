/**
 * DefaultWorkflowRuntime — the standard WorkflowRuntime, constructed from
 * the raw argv the workflow runner forwards (AHQ-197).
 *
 * SRP Does: Give a workflow program its runtime in one line — wraps the
 * launch argv as an AhqCommandLine (fail-fast at construction), and derives
 * from it a wired Claude Code tool and the workflow's own args.
 *
 * SRP Knows About: That the incoming command line carries the framework's
 * runtime params, and that the tool is assembled from a CompositionRoot
 * carrying those params.
 *
 * SRP Knows Nothing About: How the command line is structured or validated
 * (AhqCommandLine's job), what the workflow does with the tool, or how the
 * workflow parses its own remaining arguments.
 */
import type { AhqCommandLine } from '../interfaces/ahq-command-line.js';
import type { AhqPackageRoot } from '../interfaces/ahq-package-root.js';
import type { Tool } from '../interfaces/tool.js';
import type { WorkflowRuntime } from '../interfaces/workflow-runtime.js';
import { CompositionRoot } from '../kernel/composition-root.js';
import { DefaultAhqCommandLine } from '../runtime-params/default-ahq-command-line.js';
import { DefaultClaudeCodeTool } from '../tools/marshalled-io-tools/claude-code/default-claude-code-tool.js';

export class DefaultWorkflowRuntime implements WorkflowRuntime {
  private readonly ahqCommandLine: AhqCommandLine;

  constructor(argv: string[]) {
    this.ahqCommandLine = new DefaultAhqCommandLine(argv);
  }

  getClaudeCodeTool(): Tool {
    return new DefaultClaudeCodeTool(
      new CompositionRoot(this.ahqCommandLine.getAhqRuntimeParams())
    );
  }

  getWorkflowArgs(): string[] {
    return this.ahqCommandLine.getRemainingArgs();
  }

  getAhqPackageRoot(): AhqPackageRoot {
    // REFACTOR: This is called a "train wreck" and is a code smell. We should consider refactoring to something like "this.ahqCommandLine.getPackageRoot();" and
    // do it in all places that use "ahqCommandLine.getAhqRuntimeParams"
    return this.ahqCommandLine.getAhqRuntimeParams().getAhqPackageRoot();
  }
}

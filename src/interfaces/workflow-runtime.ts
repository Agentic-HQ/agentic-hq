import type { AhqPackageRoot } from './ahq-package-root.js';
import type { Tool } from './tool.js';

/**
 * WorkflowRuntime — everything the AHQ framework provides a workflow program
 * at launch (AHQ-197).
 *
 * The workflow runner invokes a workflow program with the framework's
 * required `--build-mode=` / `--ahq-package-root=` options interleaved with
 * the workflow's own arguments. WorkflowRuntime is the workflow-program side
 * of that contract: it consumes the framework's share of argv and yields a
 * fully wired AI tool plus the arguments that belong to the workflow — so a
 * workflow file contains only workflow-specific code, never framework
 * plumbing.
 */
export interface WorkflowRuntime {
  /** A Claude Code tool wired with the runtime params the framework passed */
  getClaudeCodeTool(): Tool;

  /** The argv with the framework's options stripped, order preserved — feed this to the workflow's own Commander parse */
  getWorkflowArgs(): string[];

  /** The AhqPackageRoot the framework passed — where the running agentic-hq package lives */
  getAhqPackageRoot(): AhqPackageRoot;
}

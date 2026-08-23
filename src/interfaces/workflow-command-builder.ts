/**
 * WorkflowCommandBuilder — builds a WorkflowCommand from a skill path, the
 * workflow's own BuildMode (per-workflow since AHQ-208), and args.
 *
 * Different implementations use different strategies to resolve skill paths
 * into executable commands. ClaudeWorkflowCommandBuilder uses Claude skills
 * via Tool; other builders might use config files, REST APIs, etc.
 */
import type { BuildMode } from './build-mode.js';
import type { WorkflowCommand } from './workflow-command.js';

export interface WorkflowCommandBuilder {
  /** Resolve a skill path + the workflow's build mode + passthrough args into a
   *  ready-to-execute WorkflowCommand. */
  build(
    skillPath: string,
    buildMode: BuildMode,
    passthroughArgs: string[]
  ): Promise<WorkflowCommand>;
}

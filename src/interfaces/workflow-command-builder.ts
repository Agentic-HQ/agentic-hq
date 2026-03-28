/**
 * WorkflowCommandBuilder — builds a WorkflowCommand from a skill path and args.
 *
 * Different implementations use different strategies to resolve skill paths
 * into executable commands. ClaudeWorkflowCommandBuilder uses Claude skills
 * via Tool; other builders might use config files, REST APIs, etc.
 */
import type { WorkflowCommand } from './workflow-command.js';

export interface WorkflowCommandBuilder {
  /** Resolve a skill path + passthrough args into a ready-to-execute WorkflowCommand. */
  build(skillPath: string, passthroughArgs: string[]): Promise<WorkflowCommand>;
}

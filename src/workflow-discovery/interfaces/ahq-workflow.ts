import type { FullClaudeSkillCommand } from './full-claude-skill-command.js';
import type { WorkflowDescription } from './workflow-description.js';
import type { WorkflowShortName } from './workflow-short-name.js';

/**
 * AhqWorkflow — A discoverable workflow entity that returns its
 * listing entry line and exposes metadata for CLI subcommand
 * registration and execution.
 *
 * SRP Does: Return this single workflow's line for the workflow
 * listing, and expose its short name, description, and full Claude
 * skill command for execution.
 *
 * SRP Knows About: That each workflow contributes one entry line to
 * the listing and has metadata needed for CLI registration.
 *
 * SRP Knows Nothing About: The full listing, the listing header, other
 * workflows, or how the entry line is assembled.
 */
export interface AhqWorkflow {
  /** Return this workflow's single line for the workflow listing. */
  getWorkflowListingEntryString(): string;
  /** Return the workflow's short name for CLI subcommand registration. */
  getShortName(): WorkflowShortName;
  /** Return the workflow's human-readable description. */
  getDescription(): WorkflowDescription;
  /** Return the full `/pluginId:skillId` command for Claude execution. */
  getFullClaudeSkillCommand(): FullClaudeSkillCommand;
}

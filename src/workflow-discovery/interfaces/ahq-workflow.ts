import type { BuildMode } from '../../interfaces/build-mode.js';

import type { ExampleCommand } from './example-command.js';
import type { FullClaudeSkillCommand } from './full-claude-skill-command.js';
import type { WorkflowDescription } from './workflow-description.js';
import type { WorkflowShortName } from './workflow-short-name.js';

/**
 * AhqWorkflow — A discoverable workflow entity that exposes its
 * metadata (short name, description, example command, full claude
 * skill command) for the CLI to list and register.
 *
 * SRP Does: Expose this single workflow's short name, description,
 * example invocation command, and full Claude skill command.
 *
 * SRP Knows About: That a workflow has metadata that downstream
 * formatters / registrars can read.
 *
 * SRP Knows Nothing About: The listing format, the listing header,
 * other workflows, or how its entry line is assembled.
 */
export interface AhqWorkflow {
  /** Return the workflow's short name for CLI subcommand registration. */
  getShortName(): WorkflowShortName;
  /** Return the workflow's human-readable description. */
  getDescription(): WorkflowDescription;
  /** Return the full `/pluginId:skillId` command for Claude execution. */
  getFullClaudeSkillCommand(): FullClaudeSkillCommand;
  /** Return the example CLI invocation command (e.g. `agentic-hq math -- --input-number=11`). */
  getExampleCommand(): ExampleCommand;
  /** The mode this workflow launches with (AHQ-208) — location is identity: the
   *  workspace it was discovered under decides it. */
  getBuildMode(): BuildMode;
}

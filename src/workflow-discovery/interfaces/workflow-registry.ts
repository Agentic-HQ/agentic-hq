import type { AhqWorkflow } from './ahq-workflow.js';

/**
 * WorkflowRegistry — A registry that accepts workflow registrations
 * for CLI subcommand creation.
 *
 * SRP Does: Accept a workflow and register it as a CLI subcommand.
 *
 * SRP Knows About: That workflows can be registered one at a time.
 *
 * SRP Knows Nothing About: How the subcommand is created, what
 * CLI framework is used, or how the workflow is executed.
 */
export interface WorkflowRegistry {
  /** Register a workflow as a CLI subcommand. */
  register(workflow: AhqWorkflow): void;
}

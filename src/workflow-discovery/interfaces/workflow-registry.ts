import type { AhqWorkflow } from './ahq-workflow.js';

/**
 * WorkflowRegistry — A registry that accepts workflow registrations
 * for CLI subcommand creation.
 *
 * SRP Does: Accept a workflow and register it as a CLI subcommand,
 * rejecting (by throwing ShortIdAlreadyRegisteredError) a workflow
 * whose short name is already registered — two workflows can never
 * share a `shortId` on the CLI (AHQ-205).
 *
 * SRP Knows About: That workflows can be registered one at a time,
 * and that short names must be unique among registrations.
 *
 * SRP Knows Nothing About: How the subcommand is created, what
 * CLI framework is used, how the workflow is executed, or what the
 * caller does about a rejected registration.
 */
export interface WorkflowRegistry {
  /**
   * Register a workflow as a CLI subcommand.
   *
   * @throws {ShortIdAlreadyRegisteredError} if the workflow's short name is already
   * registered; the existing registration is left untouched.
   */
  register(workflow: AhqWorkflow): void;
}

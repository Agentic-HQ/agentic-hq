import type { WorkflowShortName } from '../interfaces/workflow-short-name.js';

/**
 * ShortIdAlreadyRegisteredError — Thrown by a WorkflowRegistry when it is
 * asked to register a workflow whose short name is already a registered
 * subcommand (AHQ-205). Two workflows can never share a `shortId` on the
 * CLI, so the registry rejects the second one by name and leaves the
 * decision about what to do to its caller (see PluginImpl.registerWorkflowsWith).
 *
 * SRP Does: Carry the colliding short name and a message naming it.
 *
 * SRP Knows About: The WorkflowShortName that collided.
 *
 * SRP Knows Nothing About: Which registration came first, why the names
 * collided, or what the caller decides to do about it.
 */
export class ShortIdAlreadyRegisteredError extends Error {
  constructor(private readonly shortName: WorkflowShortName) {
    super(`shortId '${shortName.toString()}' is already registered as a subcommand`);
    this.name = 'ShortIdAlreadyRegisteredError';
  }

  /** Return the short name that was already registered. */
  getShortName(): WorkflowShortName {
    return this.shortName;
  }
}

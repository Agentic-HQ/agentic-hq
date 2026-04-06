import type { ExampleCommand } from '../interfaces/example-command.js';
import type { ExampleParameters } from '../interfaces/example-parameters.js';
import type { WorkflowMetadata } from '../interfaces/workflow-metadata.js';
import type { WorkflowShortName } from '../interfaces/workflow-short-name.js';

import { ExampleParametersImpl } from './example-parameters-impl.js';
import { WorkflowShortNameImpl } from './workflow-short-name-impl.js';

const AGENTIC_HQ_COMMAND_NAME = 'agentic-hq';

/**
 * ExampleCommandImpl — Concrete ExampleCommand composed of a
 * WorkflowShortName and ExampleParameters, formatted as
 * `agentic-hq {shortName} {params}`.
 *
 * SRP Does: Compose a WorkflowShortName and ExampleParameters into
 * the `agentic-hq {shortName} {params}` string (trimming trailing
 * space when params are empty), built via `createFrom(metadata)`
 * delegating to child createFroms.
 *
 * SRP Knows About: The `agentic-hq` command name, the formatting
 * rule, and its WorkflowShortName and ExampleParameters children.
 *
 * SRP Knows Nothing About: Which metadata fields the parts come
 * from (that's the children's job).
 */
export class ExampleCommandImpl implements ExampleCommand {
  // Use createFrom(metadata) to construct from workflow metadata.
  private constructor(
    private readonly shortName: WorkflowShortName,
    private readonly params: ExampleParameters
  ) {}
  /** Build an ExampleCommand by delegating to WorkflowShortNameImpl and ExampleParametersImpl `createFrom`. */
  static createFrom(metadata: WorkflowMetadata): ExampleCommand {
    return new ExampleCommandImpl(
      WorkflowShortNameImpl.createFrom(metadata),
      ExampleParametersImpl.createFrom(metadata)
    );
  }
  /** Return the example command string (trims trailing space when params are empty). */
  toString(): string {
    return `${AGENTIC_HQ_COMMAND_NAME} ${this.shortName.toString()} ${this.params.toString()}`.trimEnd();
  }
}

import type { ExampleCommand } from '../interfaces/example-command.js';
import type { ExampleParameters } from '../interfaces/example-parameters.js';
import type { WorkflowMetadata } from '../interfaces/workflow-metadata.js';
import type { WorkflowShortName } from '../interfaces/workflow-short-name.js';

import { ExampleParametersImpl } from './example-parameters-impl.js';
import { WorkflowShortNameImpl } from './workflow-short-name-impl.js';

const AGENTIC_HQ_COMMAND_NAME = 'agentic-hq';
const ARGS_SEPARATOR_SPACE = ' ';

/**
 * ExampleCommandImpl — Concrete ExampleCommand composed of a
 * WorkflowShortName and ExampleParameters, formatted as
 * `agentic-hq {shortName} {params}`.
 *
 * SRP Does: Compose a WorkflowShortName and ExampleParameters and
 * expose the example command as a whole or split into command-half
 * (`agentic-hq {shortName}`) and args-half (` {params}`), built via
 * `createFrom(metadata)` delegating to child createFroms.
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
  /** Return the `agentic-hq {shortName}` half (no trailing space, no args). */
  getCommandPart(): string {
    return `${AGENTIC_HQ_COMMAND_NAME} ${this.shortName.toString()}`;
  }
  /** Return the args half with its leading separator space, or `""` when there are no params. */
  getArgsPart(): string {
    const params = this.params.toString();
    return params.length === 0 ? '' : ARGS_SEPARATOR_SPACE + params;
  }
  /** Return the full example command string. */
  toString(): string {
    return this.getCommandPart() + this.getArgsPart();
  }
}

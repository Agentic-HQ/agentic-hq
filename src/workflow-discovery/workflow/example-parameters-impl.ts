import type { ExampleParameters } from '../interfaces/example-parameters.js';
import type { WorkflowMetadata } from '../interfaces/workflow-metadata.js';

const EXAMPLE_PARAMETERS_JSON_FIELD_ID = 'exampleParameters';

/**
 * ExampleParametersImpl — Concrete ExampleParameters built from a
 * workflow metadata `exampleParameters` field; empty string is valid.
 *
 * SRP Does: Build an ExampleParameters via `createFrom(metadata)` and
 * return the value via toString() (empty string is valid).
 *
 * SRP Knows About: The `exampleParameters` metadata field name and
 * the WorkflowMetadata contract.
 *
 * SRP Knows Nothing About: Which file the metadata was loaded from,
 * validation rules (there are none), or how params combine with
 * other command parts.
 */
export class ExampleParametersImpl implements ExampleParameters {
  // Use createFrom(metadata) to construct from workflow metadata.
  private constructor(private readonly value: string) {}
  /** Build an ExampleParameters by reading the `exampleParameters` field from metadata. */
  static createFrom(metadata: WorkflowMetadata): ExampleParameters {
    return new ExampleParametersImpl(metadata.get(EXAMPLE_PARAMETERS_JSON_FIELD_ID));
  }
  /** Return the example parameters string (may be empty). */
  toString(): string {
    return this.value;
  }
}

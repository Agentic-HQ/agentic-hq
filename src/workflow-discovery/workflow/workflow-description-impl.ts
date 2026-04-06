import type { WorkflowDescription } from '../interfaces/workflow-description.js';
import type { WorkflowMetadata } from '../interfaces/workflow-metadata.js';

const DESCRIPTION_JSON_FIELD_ID = 'description';

/**
 * WorkflowDescriptionImpl — Concrete WorkflowDescription built from a
 * workflow metadata `description` field, rejecting empty/whitespace values.
 *
 * SRP Does: Build a WorkflowDescription via `createFrom(metadata)`,
 * reject empty/whitespace values, and return the value via toString().
 *
 * SRP Knows About: The `description` metadata field name, the non-empty
 * validation rule, and the WorkflowMetadata contract.
 *
 * SRP Knows Nothing About: Which file the metadata was loaded from
 * or where the description is displayed.
 */
export class WorkflowDescriptionImpl implements WorkflowDescription {
  private readonly value: string;
  // Use createFrom(metadata) to construct from workflow metadata.
  private constructor(value: string) {
    if (value.trim() === '') {
      throw new Error('WorkflowDescription cannot be empty or whitespace-only');
    }
    this.value = value;
  }
  /** Build a WorkflowDescription by reading the `description` field from metadata. */
  static createFrom(metadata: WorkflowMetadata): WorkflowDescription {
    return new WorkflowDescriptionImpl(metadata.get(DESCRIPTION_JSON_FIELD_ID));
  }
  /** Return the description string. */
  toString(): string {
    return this.value;
  }
}

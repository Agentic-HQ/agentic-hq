import type { WorkflowMetadata } from '../interfaces/workflow-metadata.js';
import type { WorkflowShortName } from '../interfaces/workflow-short-name.js';

const SHORT_ID_JSON_FIELD_ID = 'shortId';

/**
 * WorkflowShortNameImpl — Concrete WorkflowShortName built from a
 * workflow metadata `shortId` field, rejecting empty/whitespace values.
 *
 * SRP Does: Build a WorkflowShortName via `createFrom(metadata)`,
 * reject empty/whitespace values, and return the value via toString().
 *
 * SRP Knows About: The `shortId` metadata field name, the non-empty
 * validation rule, and the WorkflowMetadata contract.
 *
 * SRP Knows Nothing About: Which file the metadata was loaded from
 * or how the short name is used downstream.
 */
export class WorkflowShortNameImpl implements WorkflowShortName {
  private readonly value: string;
  // Use createFrom(metadata) to construct from workflow metadata.
  private constructor(value: string) {
    if (value.trim() === '') {
      throw new Error('WorkflowShortName cannot be empty or whitespace-only');
    }
    this.value = value;
  }
  /** Build a WorkflowShortName by reading the `shortId` field from metadata. */
  static createFrom(metadata: WorkflowMetadata): WorkflowShortName {
    return new WorkflowShortNameImpl(metadata.get(SHORT_ID_JSON_FIELD_ID));
  }
  /** Return the short-name string. */
  toString(): string {
    return this.value;
  }
}

import type { SkillId } from '../interfaces/skill-id.js';
import type { WorkflowMetadata } from '../interfaces/workflow-metadata.js';

const SKILL_ID_JSON_FIELD_ID = 'skillId';

/**
 * SkillIdImpl — Concrete SkillId built from a workflow metadata
 * `skillId` field, rejecting empty/whitespace values.
 *
 * SRP Does: Build a SkillId via `createFrom(metadata)`, reject
 * empty/whitespace values, and return the value via toString().
 *
 * SRP Knows About: The `skillId` metadata field name, the non-empty
 * validation rule, and the WorkflowMetadata contract.
 *
 * SRP Knows Nothing About: Which file the metadata was loaded from
 * or how the id is combined into a FullClaudeSkillCommand.
 */
export class SkillIdImpl implements SkillId {
  private readonly value: string;
  // Use createFrom(metadata) to construct from workflow metadata.
  private constructor(value: string) {
    if (value.trim() === '') {
      throw new Error('SkillId cannot be empty or whitespace-only');
    }
    this.value = value;
  }
  /** Build a SkillId by reading the `skillId` field from metadata. */
  static createFrom(metadata: WorkflowMetadata): SkillId {
    return new SkillIdImpl(metadata.get(SKILL_ID_JSON_FIELD_ID));
  }
  /** Return the skill-id string. */
  toString(): string {
    return this.value;
  }
}

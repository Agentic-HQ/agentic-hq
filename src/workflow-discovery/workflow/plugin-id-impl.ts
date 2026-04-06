import type { PluginId } from '../interfaces/plugin-id.js';
import type { WorkflowMetadata } from '../interfaces/workflow-metadata.js';

const PLUGIN_ID_JSON_FIELD_ID = 'pluginId';

/**
 * PluginIdImpl — Concrete PluginId built from a workflow metadata
 * `pluginId` field, rejecting empty/whitespace values.
 *
 * SRP Does: Build a PluginId via `createFrom(metadata)`, reject
 * empty/whitespace values, and return the value via toString().
 *
 * SRP Knows About: The `pluginId` metadata field name, the non-empty
 * validation rule, and the WorkflowMetadata contract.
 *
 * SRP Knows Nothing About: Which file the metadata was loaded from
 * or how the id is combined into a FullClaudeSkillCommand.
 *
 * Future REFACTOR: This whole class is identical to most of the other
 * classes in this directory e.g. SkillIdImpl. We could refactor these
 * classes to be much simpler maybe by creating a new base class or
 * something? Not a big problem so leaving for now.
 */
export class PluginIdImpl implements PluginId {
  private readonly value: string;
  // Use createFrom(metadata) to construct from workflow metadata.
  private constructor(value: string) {
    if (value.trim() === '') {
      throw new Error('PluginId cannot be empty or whitespace-only');
    }
    this.value = value;
  }
  /** Build a PluginId by reading the `pluginId` field from metadata. */
  static createFrom(metadata: WorkflowMetadata): PluginId {
    return new PluginIdImpl(metadata.get(PLUGIN_ID_JSON_FIELD_ID));
  }
  /** Return the plugin-id string. */
  toString(): string {
    return this.value;
  }
}

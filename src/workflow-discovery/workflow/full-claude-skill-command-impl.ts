import type { FullClaudeSkillCommand } from '../interfaces/full-claude-skill-command.js';
import type { PluginId } from '../interfaces/plugin-id.js';
import type { SkillId } from '../interfaces/skill-id.js';
import type { WorkflowMetadata } from '../interfaces/workflow-metadata.js';

import { PluginIdImpl } from './plugin-id-impl.js';
import { SkillIdImpl } from './skill-id-impl.js';

/**
 * FullClaudeSkillCommandImpl — Concrete FullClaudeSkillCommand composed
 * of a PluginId and SkillId, formatted as `/pluginId:skillId`.
 *
 * SRP Does: Compose a PluginId and SkillId into the `/pluginId:skillId`
 * string, built via `createFrom(metadata)` delegating to child createFroms.
 *
 * SRP Knows About: The `/pluginId:skillId` format and its PluginId
 * and SkillId children.
 *
 * SRP Knows Nothing About: Which metadata fields the ids come from
 * or how validation works (that's the children's job).
 */
export class FullClaudeSkillCommandImpl implements FullClaudeSkillCommand {
  // Use createFrom(metadata) to construct from workflow metadata.
  private constructor(
    private readonly pluginId: PluginId,
    private readonly skillId: SkillId
  ) {}
  /** Build a FullClaudeSkillCommand by delegating to PluginIdImpl and SkillIdImpl `createFrom`. */
  static createFrom(metadata: WorkflowMetadata): FullClaudeSkillCommand {
    return new FullClaudeSkillCommandImpl(
      PluginIdImpl.createFrom(metadata),
      SkillIdImpl.createFrom(metadata)
    );
  }
  /** Return the `/pluginId:skillId` string. */
  toString(): string {
    return `/${this.pluginId.toString()}:${this.skillId.toString()}`;
  }
}

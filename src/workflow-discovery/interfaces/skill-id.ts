/**
 * SkillId — A skill identifier (right side of Claude's
 * `/pluginId:skillId` syntax).
 *
 * SRP Does: Represent the skill id and return it as a string.
 *
 * SRP Knows About: That it's an identifier used in the
 * `/pluginId:skillId` command form.
 *
 * SRP Knows Nothing About: Where the id came from or how the full
 * command is assembled.
 */
export interface SkillId {
  /** Return the skill-id string. */
  toString(): string;
}

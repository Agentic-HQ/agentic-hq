/**
 * FullClaudeSkillCommand — The `/pluginId:skillId` command string
 * identifying a Claude skill.
 *
 * SRP Does: Represent the combined skill command and return it as
 * a string.
 *
 * SRP Knows About: The `/pluginId:skillId` format contract.
 *
 * SRP Knows Nothing About: Where the two ids came from or how the
 * string is assembled.
 */
export interface FullClaudeSkillCommand {
  /** Return the `/pluginId:skillId` string. */
  toString(): string;
}

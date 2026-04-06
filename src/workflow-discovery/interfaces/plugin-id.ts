/**
 * PluginId — A plugin identifier (left side of Claude's
 * `/pluginId:skillId` syntax).
 *
 * SRP Does: Represent the plugin id and return it as a string.
 *
 * SRP Knows About: That it's an identifier used in the
 * `/pluginId:skillId` command form.
 *
 * SRP Knows Nothing About: Where the id came from or how the full
 * command is assembled.
 */
export interface PluginId {
  /** Return the plugin-id string. */
  toString(): string;
}

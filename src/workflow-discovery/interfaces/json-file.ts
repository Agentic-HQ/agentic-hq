/**
 * JsonFile — A parsed JSON file exposing string fields by name,
 * with dot-notation support for nested paths.
 *
 * SRP Does: Return the string value at a given field id
 * (throws if missing or non-string). Supports multi-level
 * dot-notation (e.g. `'author.name'`).
 *
 * SRP Knows About: That fields are accessed by id and values are
 * strings.
 *
 * SRP Knows Nothing About: How the JSON was parsed, which file it
 * came from, or what the fields mean.
 */
export interface JsonFile {
  /**
   * Return the string value at the given field id (throws if missing or non-string).
   *
   * Supports dot-notation for nested paths, e.g. `get('author.name')`.
   */
  get(fieldId: string): string;
}

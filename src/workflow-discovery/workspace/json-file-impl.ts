import type { AhqFile } from '../interfaces/ahq-file.js';
import type { JsonFile } from '../interfaces/json-file.js';

/**
 * JsonFileImpl — Concrete JsonFile that parses an AhqFile's content
 * as JSON and returns string fields by name, with dot-notation
 * support for nested paths (e.g. `get('author.name')`).
 *
 * SRP Does: Parse an AhqFile's content as JSON on construction and
 * return string fields by name or dot-notation path (throws if
 * missing or non-string).
 *
 * SRP Knows About: JSON parsing semantics and the string-field
 * lookup contract (flat and nested via dot-notation).
 *
 * SRP Knows Nothing About: Which file was parsed, what fields mean
 * in the domain, or non-string field access.
 */
export class JsonFileImpl implements JsonFile {
  private readonly data: Record<string, unknown>;
  constructor(file: AhqFile) {
    const content = file.readContent();
    try {
      this.data = JSON.parse(content) as Record<string, unknown>;
    } catch {
      throw new Error('Invalid JSON');
    }
  }
  /**
   * Return the string at `fieldId`, throwing if missing or not a string.
   *
   * Supports dot-notation for nested fields (e.g. `'author.name'` resolves
   * `{ "author": { "name": "Agentic HQ" } }` to `"Agentic HQ"`).
   */
  get(fieldId: string): string {
    const value = fieldId.split('.').reduce<unknown>((obj, key) => {
      if (obj !== null && typeof obj === 'object') {
        return (obj as Record<string, unknown>)[key];
      }
      return undefined;
    }, this.data);
    if (typeof value !== 'string') {
      throw new Error(`Missing required field: ${fieldId}`);
    }
    return value;
  }
}

/**
 * Tests JsonFileImpl — parses an AhqFile's content as JSON and exposes string
 * field values via get(fieldId). Rejects invalid JSON and non-string fields.
 * Variables typed as JsonFile interface; JsonFileImpl used only for construction.
 */
import { describe, expect, it } from 'vitest';

import type { AhqFile } from '../../../../src/workflow-discovery/interfaces/ahq-file.js';
import type { JsonFile } from '../../../../src/workflow-discovery/interfaces/json-file.js';
import { JsonFileImpl } from '../../../../src/workflow-discovery/workspace/json-file-impl.js';

class StubAhqFile implements AhqFile {
  constructor(private readonly content: string) {}
  readContent(): string {
    return this.content;
  }
}

describe('JsonFileImpl', () => {
  it('should return a string field value via get()', () => {
    const file = new StubAhqFile('{"name": "reversal"}');
    const jsonFile: JsonFile = new JsonFileImpl(file);
    expect(jsonFile.get('name')).toBe('reversal');
  });

  it('should return different values for different fields', () => {
    const file = new StubAhqFile('{"shortId": "math", "description": "A math demo"}');
    const jsonFile: JsonFile = new JsonFileImpl(file);
    expect(jsonFile.get('shortId')).toBe('math');
    expect(jsonFile.get('description')).toBe('A math demo');
  });

  it('should throw on invalid JSON', () => {
    const file = new StubAhqFile('not json at all');
    expect(() => new JsonFileImpl(file)).toThrow('Invalid JSON');
  });

  it('should throw when a field is missing', () => {
    const file = new StubAhqFile('{"name": "reversal"}');
    const jsonFile: JsonFile = new JsonFileImpl(file);
    expect(() => jsonFile.get('missing')).toThrow('Missing required field: missing');
  });

  it('should throw when a field value is a number, not a string', () => {
    const file = new StubAhqFile('{"count": 42}');
    const jsonFile: JsonFile = new JsonFileImpl(file);
    expect(() => jsonFile.get('count')).toThrow('Missing required field: count');
  });

  it('should throw when a field value is a boolean, not a string', () => {
    const file = new StubAhqFile('{"enabled": true}');
    const jsonFile: JsonFile = new JsonFileImpl(file);
    expect(() => jsonFile.get('enabled')).toThrow('Missing required field: enabled');
  });

  it('should throw when a field value is null, not a string', () => {
    const file = new StubAhqFile('{"name": null}');
    const jsonFile: JsonFile = new JsonFileImpl(file);
    expect(() => jsonFile.get('name')).toThrow('Missing required field: name');
  });

  it('should return a nested string field via dot-notation path', () => {
    const file = new StubAhqFile('{"author": {"name": "Agentic HQ"}}');
    const jsonFile: JsonFile = new JsonFileImpl(file);
    expect(jsonFile.get('author.name')).toBe('Agentic HQ');
  });

  it('should allow empty string as a field value', () => {
    const file = new StubAhqFile('{"name": ""}');
    const jsonFile: JsonFile = new JsonFileImpl(file);
    expect(jsonFile.get('name')).toBe('');
  });
});

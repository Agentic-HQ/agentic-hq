/**
 * Tests AhqFilesImpl — domain collection wrapping a set of AhqFile objects.
 * Provides .map<T>() so consumers can iterate without seeing the raw array.
 * Variables typed as AhqFiles interface; Impl used only for construction.
 */
import { describe, expect, it } from 'vitest';

import type { AhqFile } from '../../../../src/workflow-discovery/interfaces/ahq-file.js';
import type { AhqFiles } from '../../../../src/workflow-discovery/interfaces/ahq-files.js';
import { AhqFilesImpl } from '../../../../src/workflow-discovery/workspace/ahq-files-impl.js';

class StubAhqFile implements AhqFile {
  constructor(private readonly content: string) {}
  readContent(): string {
    return this.content;
  }
}

describe('AhqFilesImpl', () => {
  it('should map an empty collection to an empty array', () => {
    const files: AhqFiles = new AhqFilesImpl([]);
    const result = files.map((f) => f.readContent());
    expect(result).toEqual([]);
  });

  it('should map over a single file', () => {
    const files: AhqFiles = new AhqFilesImpl([new StubAhqFile('alpha')]);
    const result = files.map((f) => f.readContent());
    expect(result).toEqual(['alpha']);
  });

  it('should map over multiple files preserving order', () => {
    const files: AhqFiles = new AhqFilesImpl([
      new StubAhqFile('first'),
      new StubAhqFile('second'),
      new StubAhqFile('third'),
    ]);
    const result = files.map((f) => f.readContent());
    expect(result).toEqual(['first', 'second', 'third']);
  });

  it('should support arbitrary return types from the mapper', () => {
    const files: AhqFiles = new AhqFilesImpl([new StubAhqFile('a'), new StubAhqFile('bb')]);
    const lengths: number[] = files.map((f) => f.readContent().length);
    expect(lengths).toEqual([1, 2]);
  });
});

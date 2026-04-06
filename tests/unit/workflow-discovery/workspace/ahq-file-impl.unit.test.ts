/**
 * Tests AhqFileImpl — wraps a file path as a domain object.
 * Named AhqFile (not File) to avoid conflict with TypeScript's built-in File type.
 * Provides readContent() so consumers never deal with raw fs calls.
 * Variables typed as AhqFile interface; AhqFileImpl used only for construction.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { AhqFile } from '../../../../src/workflow-discovery/interfaces/ahq-file.js';
import { AhqFileImpl } from '../../../../src/workflow-discovery/workspace/ahq-file-impl.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';

describe('AhqFileImpl', () => {
  tmpdirTest('should read contents of the file at its constructed path', ({ tmpdir }) => {
    const filePath = path.join(tmpdir, 'test-file.txt');
    fs.writeFileSync(filePath, 'hello ahq', 'utf-8');
    const file: AhqFile = new AhqFileImpl(filePath);
    expect(file.readContent()).toBe('hello ahq');
  });

  it('should throw on empty path', () => {
    expect(() => new AhqFileImpl('')).toThrow();
  });
});

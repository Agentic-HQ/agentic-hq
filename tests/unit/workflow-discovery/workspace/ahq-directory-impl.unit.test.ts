/**
 * Tests AhqDirectoryImpl — walks a directory tree from a root, matching files
 * against a glob pattern via fast-glob, and returns them wrapped as AhqFiles.
 * Variables typed as AhqDirectory/AhqFiles interfaces; Impl used only for construction.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, expect } from 'vitest';

import type { AhqDirectory } from '../../../../src/workflow-discovery/interfaces/ahq-directory.js';
import type { AhqFiles } from '../../../../src/workflow-discovery/interfaces/ahq-files.js';
import { AhqDirectoryImpl } from '../../../../src/workflow-discovery/workspace/ahq-directory-impl.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';

describe('AhqDirectoryImpl', () => {
  tmpdirTest('should find files matching a simple pattern', ({ tmpdir }) => {
    fs.writeFileSync(path.join(tmpdir, 'alpha.json'), '{"v":"a"}', 'utf-8');
    fs.writeFileSync(path.join(tmpdir, 'beta.json'), '{"v":"b"}', 'utf-8');
    fs.writeFileSync(path.join(tmpdir, 'notes.txt'), 'ignore', 'utf-8');

    const directory: AhqDirectory = new AhqDirectoryImpl(tmpdir);
    const files: AhqFiles = directory.findMatchingFiles('*.json');
    const contents = files.map((f) => f.readContent()).sort();

    expect(contents).toHaveLength(2);
    expect(contents).toEqual(['{"v":"a"}', '{"v":"b"}']);
  });

  tmpdirTest('should walk nested directories matching * wildcards', ({ tmpdir }) => {
    const deepDir = path.join(tmpdir, 'plugins', 'alpha', 'skills', 'reversal');
    fs.mkdirSync(deepDir, { recursive: true });
    fs.writeFileSync(path.join(deepDir, 'ahq-workflow.json'), '{"id":"r"}', 'utf-8');

    const otherDir = path.join(tmpdir, 'plugins', 'beta', 'skills', 'quick');
    fs.mkdirSync(otherDir, { recursive: true });
    fs.writeFileSync(path.join(otherDir, 'ahq-workflow.json'), '{"id":"q"}', 'utf-8');

    const directory: AhqDirectory = new AhqDirectoryImpl(tmpdir);
    const files: AhqFiles = directory.findMatchingFiles('plugins/*/skills/*/ahq-workflow.json');
    const contents = files.map((f) => f.readContent()).sort();

    expect(contents).toHaveLength(2);
    expect(contents).toEqual(['{"id":"q"}', '{"id":"r"}']);
  });

  tmpdirTest('should return an empty collection when no files match', ({ tmpdir }) => {
    fs.writeFileSync(path.join(tmpdir, 'no-match.txt'), 'x', 'utf-8');

    const directory: AhqDirectory = new AhqDirectoryImpl(tmpdir);
    const files: AhqFiles = directory.findMatchingFiles('*.json');
    const contents = files.map((f) => f.readContent());

    expect(contents).toEqual([]);
  });

  tmpdirTest('should skip directories without matching files', ({ tmpdir }) => {
    const matchedDir = path.join(tmpdir, 'plugins', 'alpha', 'skills', 'has-workflow');
    fs.mkdirSync(matchedDir, { recursive: true });
    fs.writeFileSync(path.join(matchedDir, 'ahq-workflow.json'), '{"here":true}', 'utf-8');

    const unmatchedDir = path.join(tmpdir, 'plugins', 'alpha', 'skills', 'no-workflow');
    fs.mkdirSync(unmatchedDir, { recursive: true });
    fs.writeFileSync(path.join(unmatchedDir, 'SKILL.md'), '# no workflow', 'utf-8');

    const directory: AhqDirectory = new AhqDirectoryImpl(tmpdir);
    const files: AhqFiles = directory.findMatchingFiles('plugins/*/skills/*/ahq-workflow.json');
    const contents = files.map((f) => f.readContent());

    expect(contents).toHaveLength(1);
    expect(contents[0]).toContain('here');
  });
});

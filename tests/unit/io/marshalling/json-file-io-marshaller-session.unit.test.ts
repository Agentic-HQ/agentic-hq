/**
 * JsonFileIOMarshallerSession unit tests.
 *
 * Tests the per-execution session that generates a unique marshalling ID,
 * writes command-input.json, and reads command-output.json — either as a
 * command step's output string (readCommandOutput) or as the workflow-launch
 * handshake (readSkillOutput, AHQ-210/AHQ-211 D1).
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterAll, afterEach, describe, expect, it } from 'vitest';

import { BuildMode } from '../../../../src/interfaces/build-mode.js';
import { JsonFileIOMarshallerSessionFactory } from '../../../../src/io/marshalling/json-file-io-marshaller-session-factory.js';
import { JsonFileIOMarshallerSession } from '../../../../src/io/marshalling/json-file-io-marshaller-session.js';
import type { Workspace } from '../../../../src/workflow-discovery/interfaces/workspace.js';

// A real, freshly-created directory under the OS temp dir (the mkdtemp
// pattern from tests/unit/workflow-discovery/test-fixtures/tmpdir-fixture.ts)
// — a hardcoded '/tmp' path is meaningless on Windows (AHQ-211)
const TEST_TEMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ahq-io-marshaller-test-'));

afterAll(() => {
  fs.rmSync(TEST_TEMP_DIR, { recursive: true, force: true });
});

const mockWorkspace: Workspace = {
  getDisplayName: () => 'Mock',
  getPlugins: () => [],
  registerWorkflowsWith: () => {},
  getRoot: () => '/mock/project',
  getTempDir: () => TEST_TEMP_DIR,
  getDotAgenticHqDir: () => '/mock/project/.agentic-hq',
  isAhqPackage: () => false,
  getBuildMode: () => BuildMode.BUILD_FIRST,
};

describe('JsonFileIOMarshallerSession', () => {
  const createdDirs: string[] = [];

  afterEach(() => {
    for (const dir of createdDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true });
      }
    }
    createdDirs.length = 0;
  });

  describe('getMarshallingId', () => {
    it('should return a unique marshalling ID on construction', () => {
      const session = new JsonFileIOMarshallerSession(TEST_TEMP_DIR);
      const id = session.getMarshallingId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should include timestamp and UUID in the marshalling ID', () => {
      const session = new JsonFileIOMarshallerSession(TEST_TEMP_DIR);
      const id = session.getMarshallingId();
      expect(id).toMatch(/io-files-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_[0-9a-f-]+$/);
    });

    it('should return a path under the provided tempDir', () => {
      const session = new JsonFileIOMarshallerSession(TEST_TEMP_DIR);
      const id = session.getMarshallingId();
      expect(id.startsWith(TEST_TEMP_DIR)).toBe(true);
      expect(id).toContain('command-input-output-files');
    });

    it('should generate different IDs for different sessions', () => {
      const session1 = new JsonFileIOMarshallerSession(TEST_TEMP_DIR);
      const session2 = new JsonFileIOMarshallerSession(TEST_TEMP_DIR);
      expect(session1.getMarshallingId()).not.toBe(session2.getMarshallingId());
    });
  });

  describe('write', () => {
    it('should create directory and write command-input.json', () => {
      const session = new JsonFileIOMarshallerSession(TEST_TEMP_DIR);
      const id = session.getMarshallingId();
      createdDirs.push(id);

      session.write('hello world');

      const inputPath = path.join(id, 'command-input.json');
      expect(fs.existsSync(inputPath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
      expect(content['command-input-string']).toBe('hello world');
    });

    it('should write empty string input', () => {
      const session = new JsonFileIOMarshallerSession(TEST_TEMP_DIR);
      const id = session.getMarshallingId();
      createdDirs.push(id);

      session.write('');

      const inputPath = path.join(id, 'command-input.json');
      const content = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
      expect(content['command-input-string']).toBe('');
    });
  });

  describe('readCommandOutput', () => {
    it('should read command-output.json and return the output string', () => {
      const session = new JsonFileIOMarshallerSession(TEST_TEMP_DIR);
      const id = session.getMarshallingId();
      createdDirs.push(id);

      // Simulate what the tool would do: create dir and write output file
      fs.mkdirSync(id, { recursive: true });
      fs.writeFileSync(
        path.join(id, 'command-output.json'),
        JSON.stringify({ 'command-output-string': 'reversed output' }, null, 2)
      );

      const output = session.readCommandOutput();
      expect(output).toBe('reversed output');
    });

    it('should throw if output file does not exist', () => {
      const session = new JsonFileIOMarshallerSession(TEST_TEMP_DIR);
      const id = session.getMarshallingId();
      createdDirs.push(id);

      // Create dir but no output file
      fs.mkdirSync(id, { recursive: true });

      expect(() => session.readCommandOutput()).toThrow('Output file not found');
    });
  });

  describe('readSkillOutput', () => {
    it('should read the skill-base-dir handshake from command-output.json', () => {
      const session = new JsonFileIOMarshallerSession(TEST_TEMP_DIR);
      const id = session.getMarshallingId();
      createdDirs.push(id);

      // Simulate what the workflow SKILL.md writes (AHQ-210 launch handshake)
      fs.mkdirSync(id, { recursive: true });
      fs.writeFileSync(
        path.join(id, 'command-output.json'),
        JSON.stringify({ 'skill-base-dir': '/plugins/demos/skills/math-workflow' }, null, 2)
      );

      const output = session.readSkillOutput();
      expect(output).toEqual({ skillBaseDir: '/plugins/demos/skills/math-workflow' });
    });

    it('should throw if output file does not exist', () => {
      const session = new JsonFileIOMarshallerSession(TEST_TEMP_DIR);
      const id = session.getMarshallingId();
      createdDirs.push(id);

      fs.mkdirSync(id, { recursive: true });

      expect(() => session.readSkillOutput()).toThrow('Output file not found');
    });

    it('should fail fast when the skill-base-dir key is missing or not a string', () => {
      const session = new JsonFileIOMarshallerSession(TEST_TEMP_DIR);
      const id = session.getMarshallingId();
      createdDirs.push(id);

      // A command-step output landed where a launch handshake was expected
      fs.mkdirSync(id, { recursive: true });
      fs.writeFileSync(
        path.join(id, 'command-output.json'),
        JSON.stringify({ 'command-output-string': 'not a handshake' }, null, 2)
      );

      expect(() => session.readSkillOutput()).toThrow('skill-base-dir');
    });
  });
});

describe('JsonFileIOMarshallerSessionFactory', () => {
  it('should create sessions that use the workspace tempDir', () => {
    const factory = new JsonFileIOMarshallerSessionFactory(mockWorkspace);
    const session = factory.create();
    const id = session.getMarshallingId();
    expect(id.startsWith(TEST_TEMP_DIR)).toBe(true);
  });
});

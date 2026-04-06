/**
 * Tests AhqWorkspaceImpl — knows the AHQ workspace root (from env var) and
 * delegates file searches to its root AhqDirectory.
 * Variables typed as AhqWorkspace/AhqFiles interfaces; Impl used only for construction.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { afterEach, describe, expect } from 'vitest';

import type { AhqWorkspace } from '../../../../src/workflow-discovery/interfaces/ahq-workspace.js';
import { AhqWorkspaceImpl } from '../../../../src/workflow-discovery/workspace/ahq-workspace-impl.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';

describe('AhqWorkspaceImpl', () => {
  const originalEnv = process.env.AGENTIC_HQ_WORKSPACE_ROOT;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.AGENTIC_HQ_WORKSPACE_ROOT;
    } else {
      process.env.AGENTIC_HQ_WORKSPACE_ROOT = originalEnv;
    }
  });

  tmpdirTest(
    'should use AGENTIC_HQ_WORKSPACE_ROOT env var as root when resolving files',
    ({ tmpdir }) => {
      const skillDir = path.join(
        tmpdir,
        '.agentic-hq',
        'plugins',
        'test-plugin',
        'skills',
        'test-skill'
      );
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(
        path.join(skillDir, 'ahq-workflow.json'),
        '{"marker": "env-var-root-content"}',
        'utf-8'
      );

      process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
      const workspace: AhqWorkspace = new AhqWorkspaceImpl();
      const contents = workspace
        .findFiles('.agentic-hq/plugins/*/skills/*/ahq-workflow.json')
        .map((f) => f.readContent());

      expect(contents).toHaveLength(1);
      expect(contents[0]).toContain('env-var-root-content');
    }
  );

  tmpdirTest(
    'should find files matching a glob pattern and return AhqFile objects',
    ({ tmpdir }) => {
      const skillDir = path.join(
        tmpdir,
        '.agentic-hq',
        'plugins',
        'test-plugin',
        'skills',
        'test-skill'
      );
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(
        path.join(skillDir, 'ahq-workflow.json'),
        '{"marker": "glob-match-content"}',
        'utf-8'
      );

      process.env.AGENTIC_HQ_WORKSPACE_ROOT = tmpdir;
      const workspace: AhqWorkspace = new AhqWorkspaceImpl();
      const contents = workspace
        .findFiles('.agentic-hq/plugins/*/skills/*/ahq-workflow.json')
        .map((f) => f.readContent());

      expect(contents).toHaveLength(1);
      expect(contents[0]).toContain('glob-match-content');
    }
  );
});

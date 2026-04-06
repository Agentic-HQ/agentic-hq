/**
 * Tests AhqWorkflowImpl — a workflow entity that constructs itself from an
 * ahq-workflow.json AhqFile and returns its listing entry line via
 * getWorkflowListingEntryString(). Value objects are built internally on demand.
 * Variables typed as AhqWorkflow/AhqFile interfaces; Impls used only for construction.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, expect } from 'vitest';

import type { AhqFile } from '../../../../src/workflow-discovery/interfaces/ahq-file.js';
import type { AhqWorkflow } from '../../../../src/workflow-discovery/interfaces/ahq-workflow.js';
import { AhqWorkflowImpl } from '../../../../src/workflow-discovery/workflow/ahq-workflow-impl.js';
import { AhqFileImpl } from '../../../../src/workflow-discovery/workspace/ahq-file-impl.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';

function writeTempWorkflowFile(tmpdir: string, content: string): string {
  const filePath = path.join(tmpdir, 'ahq-workflow.json');
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

function writeTempJsonPath(tmpdir: string, data: Record<string, unknown>): string {
  return writeTempWorkflowFile(tmpdir, JSON.stringify(data));
}

const VALID_WORKFLOW_JSON = {
  pluginId: 'agentic-hq-demos-plugin',
  skillId: 'math-workflow',
  shortId: 'math',
  description: 'Solves a math problem using an agent team',
  exampleParameters: '-- --input-number=54321',
  version: '1.0.0',
  author: 'Agentic HQ',
};

describe('AhqWorkflowImpl', () => {
  tmpdirTest(
    'should return a listing entry string containing all value-object pieces',
    ({ tmpdir }) => {
      const file: AhqFile = new AhqFileImpl(writeTempJsonPath(tmpdir, VALID_WORKFLOW_JSON));
      const workflow: AhqWorkflow = new AhqWorkflowImpl(file);
      const display = workflow.getWorkflowListingEntryString();

      expect(display).toContain('agentic-hq math -- --input-number=54321');
      expect(display).toContain('   What it does: Solves a math problem using an agent team');
    }
  );

  tmpdirTest(
    'should throw when the listing entry is requested with missing shortId',
    ({ tmpdir }) => {
      const file: AhqFile = new AhqFileImpl(
        writeTempJsonPath(tmpdir, {
          pluginId: 'p',
          skillId: 's',
          description: 'd',
          exampleParameters: '',
        })
      );
      const workflow: AhqWorkflow = new AhqWorkflowImpl(file);
      expect(() => workflow.getWorkflowListingEntryString()).toThrow();
    }
  );

  tmpdirTest('should throw on invalid JSON content', ({ tmpdir }) => {
    const file: AhqFile = new AhqFileImpl(writeTempWorkflowFile(tmpdir, 'not json'));
    expect(() => new AhqWorkflowImpl(file)).toThrow();
  });
});

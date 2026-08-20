/**
 * Tests AhqWorkflowImpl — a workflow entity that constructs itself from an
 * ahq-workflow.json AhqFile and exposes its metadata: short name,
 * description, full Claude skill command, and example invocation command.
 * The CLI listing formatter reads `getExampleCommand()` to display the
 * example invocation; the registry reads the other getters for subcommand
 * registration.
 * Variables typed as AhqWorkflow/AhqFile interfaces; Impls used only for construction.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, expect } from 'vitest';

import { BuildMode } from '../../../../src/interfaces/build-mode.js';
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

// The workflow's build mode (AHQ-208) — location is identity: the workspace
// that discovered the workflow decides it. Value irrelevant except in the
// getBuildMode test.
const TEST_BUILD_MODE = BuildMode.BUILD_FIRST;

const VALID_WORKFLOW_JSON = {
  pluginId: 'agentic-hq-demos-plugin',
  skillId: 'math-workflow',
  shortId: 'math',
  description: 'Solves a math problem using an agent team',
  exampleParameters: '-- --input-number=11',
  version: '1.0.0',
  author: 'Agentic HQ',
};

describe('AhqWorkflowImpl', () => {
  tmpdirTest(
    'should return the example invocation command via getExampleCommand() including short name and example parameters',
    ({ tmpdir }) => {
      const file: AhqFile = new AhqFileImpl(writeTempJsonPath(tmpdir, VALID_WORKFLOW_JSON));
      const workflow: AhqWorkflow = new AhqWorkflowImpl(file, TEST_BUILD_MODE);
      const example = workflow.getExampleCommand().toString();

      expect(example).toContain('agentic-hq math');
      expect(example).toContain('-- --input-number=11');
    }
  );

  tmpdirTest(
    'should throw when getExampleCommand() is called with missing shortId',
    ({ tmpdir }) => {
      const file: AhqFile = new AhqFileImpl(
        writeTempJsonPath(tmpdir, {
          pluginId: 'p',
          skillId: 's',
          description: 'd',
          exampleParameters: '',
        })
      );
      const workflow: AhqWorkflow = new AhqWorkflowImpl(file, TEST_BUILD_MODE);
      expect(() => workflow.getExampleCommand()).toThrow();
    }
  );

  tmpdirTest('should throw on invalid JSON content', ({ tmpdir }) => {
    const file: AhqFile = new AhqFileImpl(writeTempWorkflowFile(tmpdir, 'not json'));
    expect(() => new AhqWorkflowImpl(file, TEST_BUILD_MODE)).toThrow();
  });

  tmpdirTest('should return the constructor build mode via getBuildMode', ({ tmpdir }) => {
    const file: AhqFile = new AhqFileImpl(writeTempJsonPath(tmpdir, VALID_WORKFLOW_JSON));
    const workflow: AhqWorkflow = new AhqWorkflowImpl(file, BuildMode.PREBUILT);

    expect(workflow.getBuildMode()).toBe(BuildMode.PREBUILT);
  });

  tmpdirTest('should return short name via getShortName', ({ tmpdir }) => {
    const file: AhqFile = new AhqFileImpl(writeTempJsonPath(tmpdir, VALID_WORKFLOW_JSON));
    const workflow: AhqWorkflow = new AhqWorkflowImpl(file, TEST_BUILD_MODE);

    expect(workflow.getShortName().toString()).toBe('math');
  });

  tmpdirTest('should return description via getDescription', ({ tmpdir }) => {
    const file: AhqFile = new AhqFileImpl(writeTempJsonPath(tmpdir, VALID_WORKFLOW_JSON));
    const workflow: AhqWorkflow = new AhqWorkflowImpl(file, TEST_BUILD_MODE);

    expect(workflow.getDescription().toString()).toBe('Solves a math problem using an agent team');
  });

  tmpdirTest(
    'should return full Claude skill command via getFullClaudeSkillCommand',
    ({ tmpdir }) => {
      const file: AhqFile = new AhqFileImpl(writeTempJsonPath(tmpdir, VALID_WORKFLOW_JSON));
      const workflow: AhqWorkflow = new AhqWorkflowImpl(file, TEST_BUILD_MODE);

      expect(workflow.getFullClaudeSkillCommand().toString()).toBe(
        '/agentic-hq-demos-plugin:math-workflow'
      );
    }
  );
});

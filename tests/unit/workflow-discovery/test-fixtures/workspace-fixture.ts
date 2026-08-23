import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Write one workflow into `<rootDir>/.agentic-hq/plugins/<pluginId>/skills/<skillId>/ahq-workflow.json`.
 * The plugin and skill directory names are the ids (as in every fixture here).
 */
export function createSingleWorkflowFixture(
  rootDir: string,
  pluginId: string,
  skillId: string,
  metadata: { shortId: string; description: string; exampleParameters: string }
): void {
  const skillDir = path.join(rootDir, '.agentic-hq', 'plugins', pluginId, 'skills', skillId);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, 'ahq-workflow.json'),
    JSON.stringify({
      pluginId,
      skillId,
      shortId: metadata.shortId,
      description: metadata.description,
      exampleParameters: metadata.exampleParameters,
      version: '1.0.0',
      author: 'Test',
    }),
    'utf-8'
  );
}

/**
 * The standard two-plugin workspace: `test-plugin-alpha` (reversal + math + one skill dir
 * WITHOUT ahq-workflow.json, which must be skipped) and `test-plugin-beta` (quick, no params).
 */
export function createTestWorkspaceFixture(rootDir: string): void {
  // Plugin alpha: 2 workflows + 1 skill without ahq-workflow.json
  createSingleWorkflowFixture(rootDir, 'test-plugin-alpha', 'reversal-skill', {
    shortId: 'reversal',
    description: 'Reverses a string',
    exampleParameters: "-- --string-reverse='hello'",
  });
  createSingleWorkflowFixture(rootDir, 'test-plugin-alpha', 'math-skill', {
    shortId: 'math',
    description: 'Solves math problems',
    exampleParameters: '-- --input-number=11',
  });

  // Skill dir WITHOUT ahq-workflow.json (should be skipped)
  const noWorkflowDir = path.join(
    rootDir,
    '.agentic-hq',
    'plugins',
    'test-plugin-alpha',
    'skills',
    'no-workflow-skill'
  );
  fs.mkdirSync(noWorkflowDir, { recursive: true });
  fs.writeFileSync(path.join(noWorkflowDir, 'SKILL.md'), '# No workflow here', 'utf-8');

  // Plugin beta: 1 workflow (no params)
  createSingleWorkflowFixture(rootDir, 'test-plugin-beta', 'quick-task', {
    shortId: 'quick',
    description: 'Quick task runner',
    exampleParameters: '',
  });
}

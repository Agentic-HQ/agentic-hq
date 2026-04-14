import * as fs from 'node:fs';
import * as path from 'node:path';

export function createTestWorkspaceFixture(rootDir: string): void {
  const pluginsBase = path.join(rootDir, '.agentic-hq', 'plugins');

  // Plugin alpha: 2 workflows + 1 skill without ahq-workflow.json
  const reversalDir = path.join(pluginsBase, 'test-plugin-alpha', 'skills', 'reversal-skill');
  fs.mkdirSync(reversalDir, { recursive: true });
  fs.writeFileSync(
    path.join(reversalDir, 'ahq-workflow.json'),
    JSON.stringify({
      pluginId: 'test-plugin-alpha',
      skillId: 'reversal-skill',
      shortId: 'reversal',
      description: 'Reverses a string',
      exampleParameters: "-- --string-reverse='hello'",
      version: '1.0.0',
      author: 'Test',
    }),
    'utf-8'
  );

  const mathDir = path.join(pluginsBase, 'test-plugin-alpha', 'skills', 'math-skill');
  fs.mkdirSync(mathDir, { recursive: true });
  fs.writeFileSync(
    path.join(mathDir, 'ahq-workflow.json'),
    JSON.stringify({
      pluginId: 'test-plugin-alpha',
      skillId: 'math-skill',
      shortId: 'math',
      description: 'Solves math problems',
      exampleParameters: '-- --input-number=11',
      version: '1.0.0',
      author: 'Test',
    }),
    'utf-8'
  );

  // Skill dir WITHOUT ahq-workflow.json (should be skipped)
  const noWorkflowDir = path.join(pluginsBase, 'test-plugin-alpha', 'skills', 'no-workflow-skill');
  fs.mkdirSync(noWorkflowDir, { recursive: true });
  fs.writeFileSync(path.join(noWorkflowDir, 'SKILL.md'), '# No workflow here', 'utf-8');

  // Plugin beta: 1 workflow (no params)
  const quickDir = path.join(pluginsBase, 'test-plugin-beta', 'skills', 'quick-task');
  fs.mkdirSync(quickDir, { recursive: true });
  fs.writeFileSync(
    path.join(quickDir, 'ahq-workflow.json'),
    JSON.stringify({
      pluginId: 'test-plugin-beta',
      skillId: 'quick-task',
      shortId: 'quick',
      description: 'Quick task runner',
      exampleParameters: '',
      version: '1.0.0',
      author: 'Test',
    }),
    'utf-8'
  );
}

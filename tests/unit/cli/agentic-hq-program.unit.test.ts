/**
 * Unit Test: CLI program delegates to injected WorkflowCommandBuilder and WorkflowSkillsRegistry.
 *
 * Verifies that the CLI program factory:
 * 1. Accepts a WorkflowCommandBuilder and WorkflowSkillsRegistry via injection
 * 2. Delegates workflow execution to builder.build() + command.execute()
 * 3. Passes the correct skill path and passthrough args
 */
import { describe, expect, it, vi } from 'vitest';

import { createProgram } from '../../../src/cli/agentic-hq-program.js';
import { DEMO_SKILLS } from '../../../src/demo/demo-skills.js';
import type { WorkflowCommandBuilder } from '../../../src/interfaces/workflow-command-builder.js';
import type { WorkflowCommand } from '../../../src/interfaces/workflow-command.js';
import { WorkflowSkillsRegistry } from '../../../src/workflow/workflow-skills/workflow-skills-registry.js';

function createMockBuilder(): { builder: WorkflowCommandBuilder; mockCommand: WorkflowCommand } {
  const mockCommand: WorkflowCommand = {
    execute: vi.fn().mockResolvedValue(undefined),
  };
  const builder: WorkflowCommandBuilder = {
    build: vi.fn().mockResolvedValue(mockCommand),
  };
  return { builder, mockCommand };
}

describe('createProgram with WorkflowCommandBuilder and WorkflowSkillsRegistry injection', () => {
  it('should delegate short alias workflow to builder.build() + command.execute()', async () => {
    const { builder, mockCommand } = createMockBuilder();
    const program = createProgram(builder, new WorkflowSkillsRegistry(DEMO_SKILLS));

    await program.parseAsync(['node', 'agentic-hq', 'reversal']);

    expect(builder.build).toHaveBeenCalledWith('/agentic-hq-demos-plugin:string-reversal', []);
    expect(mockCommand.execute).toHaveBeenCalledTimes(1);
  });

  it('should pass passthrough args to builder.build()', async () => {
    const { builder, mockCommand } = createMockBuilder();
    const program = createProgram(builder, new WorkflowSkillsRegistry(DEMO_SKILLS));

    await program.parseAsync([
      'node',
      'agentic-hq',
      'reversal',
      '--',
      '--string-reverse=hello world',
    ]);

    expect(builder.build).toHaveBeenCalledWith('/agentic-hq-demos-plugin:string-reversal', [
      '--string-reverse=hello world',
    ]);
    expect(mockCommand.execute).toHaveBeenCalledTimes(1);
  });

  it('should delegate --workflow-command-supplier to builder.build()', async () => {
    const { builder, mockCommand } = createMockBuilder();
    const program = createProgram(builder, new WorkflowSkillsRegistry(DEMO_SKILLS));

    await program.parseAsync([
      'node',
      'agentic-hq',
      '--workflow-command-supplier=/custom:skill',
      '--',
      '--extra',
    ]);

    expect(builder.build).toHaveBeenCalledWith('/custom:skill', ['--extra']);
    expect(mockCommand.execute).toHaveBeenCalledTimes(1);
  });

  it('should not call builder.build() for list command', async () => {
    const { builder } = createMockBuilder();
    const program = createProgram(builder, new WorkflowSkillsRegistry(DEMO_SKILLS));

    // Suppress console.log for list output
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'agentic-hq', 'list']);
    spy.mockRestore();

    expect(builder.build).not.toHaveBeenCalled();
  });

  it('should use skills from injected registry, not hardcoded data', async () => {
    const customRegistry = new WorkflowSkillsRegistry([
      {
        shortName: 'custom-skill',
        fullPath: '/custom-plugin:custom',
        description: 'A custom skill',
        example: 'agentic-hq custom-skill',
      },
    ]);
    const { builder, mockCommand } = createMockBuilder();
    const program = createProgram(builder, customRegistry);

    await program.parseAsync(['node', 'agentic-hq', 'custom-skill']);

    expect(builder.build).toHaveBeenCalledWith('/custom-plugin:custom', []);
    expect(mockCommand.execute).toHaveBeenCalledTimes(1);
  });
});

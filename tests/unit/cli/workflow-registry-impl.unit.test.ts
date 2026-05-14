/**
 * Tests WorkflowRegistryImpl — wraps a Commander program and WorkflowCommandBuilder.
 * When register(workflow) is called, it registers a Commander subcommand using
 * workflow.getShortName() as the command name and workflow.getDescription() as help text.
 * When the subcommand executes, it calls builder.build() with workflow.getFullClaudeSkillCommand()
 * and passthrough args.
 * Variables typed as WorkflowRegistry interface; WorkflowRegistryImpl used only for construction.
 */
import { Command } from 'commander';
import { describe, expect, vi } from 'vitest';

import { WorkflowRegistryImpl } from '../../../src/cli/workflow-registry-impl.js';
import type { WorkflowCommandBuilder } from '../../../src/interfaces/workflow-command-builder.js';
import type { WorkflowRegistry } from '../../../src/workflow-discovery/interfaces/workflow-registry.js';

function createStubWorkflow(shortName: string, description: string, fullCommand: string) {
  return {
    getShortName: () => ({ toString: () => shortName }),
    getDescription: () => ({ toString: () => description }),
    getFullClaudeSkillCommand: () => ({ toString: () => fullCommand }),
    getExampleCommand: () => ({
      getCommandPart: () => `agentic-hq ${shortName}`,
      getArgsPart: () => '',
      toString: () => `agentic-hq ${shortName}`,
    }),
  };
}

describe('WorkflowRegistryImpl', () => {
  it('should register a Commander subcommand when register is called, using workflow.getShortName as command name', () => {
    const program = new Command();
    program.enablePositionalOptions();
    const mockBuilder: WorkflowCommandBuilder = {
      build: vi.fn().mockResolvedValue({ execute: vi.fn() }),
    };
    const registry: WorkflowRegistry = new WorkflowRegistryImpl(program, mockBuilder);

    const workflow = createStubWorkflow('reversal', 'Reverses a string', '/demos:reversal');
    registry.register(workflow);

    // Verify Commander has a subcommand named "reversal"
    const subcommand = program.commands.find((cmd: Command) => cmd.name() === 'reversal');
    expect(subcommand).toBeDefined();
  });

  it('should call builder.build with workflow.getFullClaudeSkillCommand and passthrough args when subcommand executes', async () => {
    const program = new Command();
    program.enablePositionalOptions();
    const mockExecute = vi.fn();
    const mockBuilder: WorkflowCommandBuilder = {
      build: vi.fn().mockResolvedValue({ execute: mockExecute }),
    };
    const registry: WorkflowRegistry = new WorkflowRegistryImpl(program, mockBuilder);

    const workflow = createStubWorkflow('reversal', 'Reverses a string', '/demos:reversal');
    registry.register(workflow);

    // Simulate running the subcommand
    await program.parseAsync(['node', 'agentic-hq', 'reversal', '--', '--string-to-reverse=hello']);

    expect(mockBuilder.build).toHaveBeenCalledWith('/demos:reversal', [
      '--string-to-reverse=hello',
    ]);
  });
});

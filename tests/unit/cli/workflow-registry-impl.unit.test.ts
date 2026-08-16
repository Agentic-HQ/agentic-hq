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

  // AHQ-205: the first registration of a short name wins; later ones are not registered
  // (Commander would otherwise throw `cannot add command 'x' as already have command 'x'`).
  it('should keep the first workflow and not throw when a second workflow has the same short name', async () => {
    const program = new Command();
    program.enablePositionalOptions();
    const mockBuilder: WorkflowCommandBuilder = {
      build: vi.fn().mockResolvedValue({ execute: vi.fn() }),
    };
    const registry: WorkflowRegistry = new WorkflowRegistryImpl(program, mockBuilder);

    const first = createStubWorkflow('add-feature', 'Local copy', '/my-local-plugin:add-feature');
    const second = createStubWorkflow(
      'add-feature',
      'Shipped copy',
      '/agentic-hq-demos-plugin:add-feature'
    );
    registry.register(first);
    expect(() => registry.register(second)).not.toThrow();

    const matching = program.commands.filter((cmd: Command) => cmd.name() === 'add-feature');
    expect(matching).toHaveLength(1);

    await program.parseAsync(['node', 'agentic-hq', 'add-feature']);
    expect(mockBuilder.build).toHaveBeenCalledWith('/my-local-plugin:add-feature', []);
  });

  it('should never replace a subcommand the program already has (a workflow named "list" does not shadow the built-in)', async () => {
    const program = new Command();
    program.enablePositionalOptions();
    const builtInListAction = vi.fn();
    program.command('list').action(builtInListAction);
    const mockBuilder: WorkflowCommandBuilder = {
      build: vi.fn().mockResolvedValue({ execute: vi.fn() }),
    };
    const registry: WorkflowRegistry = new WorkflowRegistryImpl(program, mockBuilder);

    const workflowNamedList = createStubWorkflow('list', 'A workflow called list', '/p:list');
    expect(() => registry.register(workflowNamedList)).not.toThrow();

    await program.parseAsync(['node', 'agentic-hq', 'list']);
    expect(builtInListAction).toHaveBeenCalledTimes(1);
    expect(mockBuilder.build).not.toHaveBeenCalled();
  });
});

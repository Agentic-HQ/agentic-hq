/**
 * Unit Test: CLI program delegates to injected WorkflowCommandBuilder and WorkflowSearchResults.
 *
 * Verifies that the CLI program factory:
 * 1. Accepts a WorkflowCommandBuilder and WorkflowSearchResults via injection
 * 2. Calls searchResults.registerWorkflowsWith() to register discovered workflows
 * 3. Does not call builder.build() for the list command
 */
import { describe, expect, it, vi } from 'vitest';

import { createProgram } from '../../../src/cli/agentic-hq-program.js';
import type { WorkflowCommandBuilder } from '../../../src/interfaces/workflow-command-builder.js';
import type { WorkflowCommand } from '../../../src/interfaces/workflow-command.js';
import type { WorkflowRegistry } from '../../../src/workflow-discovery/interfaces/workflow-registry.js';
import type { WorkflowSearchResults } from '../../../src/workflow-discovery/interfaces/workflow-search-results.js';

function createMockBuilder(): { builder: WorkflowCommandBuilder; mockCommand: WorkflowCommand } {
  const mockCommand: WorkflowCommand = {
    execute: vi.fn().mockResolvedValue(undefined),
  };
  const builder: WorkflowCommandBuilder = {
    build: vi.fn().mockResolvedValue(mockCommand),
  };
  return { builder, mockCommand };
}

function createStubSearchResults(
  onRegister?: (registry: WorkflowRegistry) => void
): WorkflowSearchResults {
  return {
    getWorkflowsListingString: () => 'stub listing',
    registerWorkflowsWith: (registry: WorkflowRegistry) => {
      if (onRegister) {
        onRegister(registry);
      }
    },
  };
}

describe('createProgram with WorkflowCommandBuilder and WorkflowSearchResults injection', () => {
  it('should call searchResults.registerWorkflowsWith() during program creation', () => {
    const { builder } = createMockBuilder();
    const registerSpy = vi.fn();
    const searchResults: WorkflowSearchResults = {
      getWorkflowsListingString: () => 'listing',
      registerWorkflowsWith: registerSpy,
    };

    createProgram(builder, searchResults);

    expect(registerSpy).toHaveBeenCalledTimes(1);
  });

  it('should delegate dynamically registered workflow to builder.build() + command.execute()', async () => {
    const { builder, mockCommand } = createMockBuilder();
    const searchResults = createStubSearchResults((registry) => {
      registry.register({
        getShortName: () => ({ toString: () => 'test-wf' }),
        getDescription: () => ({ toString: () => 'A test workflow' }),
        getFullClaudeSkillCommand: () => ({ toString: () => '/test-plugin:test-skill' }),
        getExampleCommand: () => ({
          getCommandPart: () => 'agentic-hq test-wf',
          getArgsPart: () => '',
          toString: () => 'agentic-hq test-wf',
        }),
      });
    });

    const program = createProgram(builder, searchResults);
    await program.parseAsync(['node', 'agentic-hq', 'test-wf']);

    expect(builder.build).toHaveBeenCalledWith('/test-plugin:test-skill', []);
    expect(mockCommand.execute).toHaveBeenCalledTimes(1);
  });

  it('should pass passthrough args to builder.build()', async () => {
    const { builder, mockCommand } = createMockBuilder();
    const searchResults = createStubSearchResults((registry) => {
      registry.register({
        getShortName: () => ({ toString: () => 'test-wf' }),
        getDescription: () => ({ toString: () => 'A test workflow' }),
        getFullClaudeSkillCommand: () => ({ toString: () => '/test-plugin:test-skill' }),
        getExampleCommand: () => ({
          getCommandPart: () => 'agentic-hq test-wf',
          getArgsPart: () => '',
          toString: () => 'agentic-hq test-wf',
        }),
      });
    });

    const program = createProgram(builder, searchResults);
    await program.parseAsync(['node', 'agentic-hq', 'test-wf', '--', '--extra-arg=value']);

    expect(builder.build).toHaveBeenCalledWith('/test-plugin:test-skill', ['--extra-arg=value']);
    expect(mockCommand.execute).toHaveBeenCalledTimes(1);
  });

  it('should not call builder.build() for list command', async () => {
    const { builder } = createMockBuilder();
    const searchResults = createStubSearchResults();

    const program = createProgram(builder, searchResults);

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'agentic-hq', 'list']);
    spy.mockRestore();

    expect(builder.build).not.toHaveBeenCalled();
  });

  it('should use the injected searchResults when handling the list command', async () => {
    const { builder } = createMockBuilder();
    const listingSpy = vi.fn().mockReturnValue('injected-listing-marker');
    const searchResults: WorkflowSearchResults = {
      getWorkflowsListingString: listingSpy,
      registerWorkflowsWith: () => {},
    };

    const program = createProgram(builder, searchResults);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await program.parseAsync(['node', 'agentic-hq', 'list']);

      expect(listingSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('injected-listing-marker');
    } finally {
      consoleSpy.mockRestore();
    }
  });

  // AHQ-205: the built-in `list` is registered before any workflow, and the first registration
  // of a short name wins — so a discovered workflow named `list` must neither crash program
  // creation nor take over the `list` subcommand.
  it('should survive a discovered workflow named "list" and still print the injected listing for the list command', async () => {
    const { builder } = createMockBuilder();
    const listingSpy = vi.fn().mockReturnValue('injected-listing-marker');
    const searchResults: WorkflowSearchResults = {
      getWorkflowsListingString: listingSpy,
      registerWorkflowsWith: (registry: WorkflowRegistry) => {
        registry.register({
          getShortName: () => ({ toString: () => 'list' }),
          getDescription: () => ({ toString: () => 'A workflow that happens to be called list' }),
          getFullClaudeSkillCommand: () => ({ toString: () => '/some-plugin:list' }),
          getExampleCommand: () => ({
            getCommandPart: () => 'agentic-hq list',
            getArgsPart: () => '',
            toString: () => 'agentic-hq list',
          }),
        });
      },
    };

    let program: ReturnType<typeof createProgram> | undefined;
    expect(() => {
      program = createProgram(builder, searchResults);
    }).not.toThrow();

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await program!.parseAsync(['node', 'agentic-hq', 'list']);

      expect(listingSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('injected-listing-marker');
      expect(builder.build).not.toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });
});

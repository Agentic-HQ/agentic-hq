/**
 * Unit Test: CLI program delegates to injected WorkflowCommandBuilder and WorkflowSearchResults.
 *
 * Verifies that the CLI program factory:
 * 1. Accepts a WorkflowCommandBuilder and WorkflowSearchResults via injection
 * 2. Calls searchResults.registerWorkflowsWith() to register discovered workflows
 * 3. Does not call builder.build() for the list command
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createProgram } from '../../../src/cli/agentic-hq-program.js';
import { BuildMode } from '../../../src/interfaces/build-mode.js';
import type { WorkflowCommandBuilder } from '../../../src/interfaces/workflow-command-builder.js';
import type { WorkflowCommand } from '../../../src/interfaces/workflow-command.js';
import { DefaultAhqPackageRoot } from '../../../src/runtime-params/default-ahq-package-root.js';
import { DefaultAhqRuntimeParams } from '../../../src/runtime-params/default-ahq-runtime-params.js';
import type { WorkflowRegistry } from '../../../src/workflow-discovery/interfaces/workflow-registry.js';
import type { WorkflowSearchResults } from '../../../src/workflow-discovery/interfaces/workflow-search-results.js';
import { WorkflowSearchResultsImpl } from '../../../src/workflow-discovery/workflow-listing/workflow-search-results-impl.js';
import { tmpdirTest } from '../workflow-discovery/test-fixtures/tmpdir-fixture.js';
import { createSingleWorkflowFixture } from '../workflow-discovery/test-fixtures/workspace-fixture.js';

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
        getBuildMode: () => BuildMode.BUILD_FIRST,
        getExampleCommand: () => ({
          getCommandPart: () => 'agentic-hq test-wf',
          getArgsPart: () => '',
          toString: () => 'agentic-hq test-wf',
        }),
      });
    });

    const program = createProgram(builder, searchResults);
    await program.parseAsync(['node', 'agentic-hq', 'test-wf']);

    expect(builder.build).toHaveBeenCalledWith(
      '/test-plugin:test-skill',
      BuildMode.BUILD_FIRST,
      []
    );
    expect(mockCommand.execute).toHaveBeenCalledTimes(1);
  });

  it('should pass passthrough args to builder.build()', async () => {
    const { builder, mockCommand } = createMockBuilder();
    const searchResults = createStubSearchResults((registry) => {
      registry.register({
        getShortName: () => ({ toString: () => 'test-wf' }),
        getDescription: () => ({ toString: () => 'A test workflow' }),
        getFullClaudeSkillCommand: () => ({ toString: () => '/test-plugin:test-skill' }),
        getBuildMode: () => BuildMode.BUILD_FIRST,
        getExampleCommand: () => ({
          getCommandPart: () => 'agentic-hq test-wf',
          getArgsPart: () => '',
          toString: () => 'agentic-hq test-wf',
        }),
      });
    });

    const program = createProgram(builder, searchResults);
    await program.parseAsync(['node', 'agentic-hq', 'test-wf', '--', '--extra-arg=value']);

    expect(builder.build).toHaveBeenCalledWith('/test-plugin:test-skill', BuildMode.BUILD_FIRST, [
      '--extra-arg=value',
    ]);
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
  // creation nor take over the `list` subcommand. Uses the REAL discovery chain over a fixture
  // (not a stub) so the whole register → reject → skip path is exercised as it is at runtime.
  describe('with a real WorkflowSearchResultsImpl over a fixture (AHQ-205)', () => {
    const originalCwd = process.cwd;
    afterEach(() => {
      process.cwd = originalCwd;
    });

    tmpdirTest(
      'should survive a discovered workflow named "list", keep the built-in list, and still register the others',
      async ({ tmpdir }) => {
        createSingleWorkflowFixture(tmpdir, 'some-plugin', 'listy', {
          shortId: 'list',
          description: 'A workflow that happens to be called list',
          exampleParameters: '',
        });
        createSingleWorkflowFixture(tmpdir, 'some-plugin', 'reversal-skill', {
          shortId: 'reversal',
          description: 'Reverses a string',
          exampleParameters: '',
        });
        process.cwd = () => tmpdir; // U = P: only the package registers
        const { builder } = createMockBuilder();
        const searchResults: WorkflowSearchResults = new WorkflowSearchResultsImpl(
          new DefaultAhqRuntimeParams(BuildMode.BUILD_FIRST, new DefaultAhqPackageRoot(tmpdir))
        );

        let program: ReturnType<typeof createProgram> | undefined;
        expect(() => {
          program = createProgram(builder, searchResults);
        }).not.toThrow();
        expect(program!.commands.filter((c) => c.name() === 'list')).toHaveLength(1);
        expect(program!.commands.some((c) => c.name() === 'reversal')).toBe(true);

        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        try {
          await program!.parseAsync(['node', 'agentic-hq', 'list']);

          expect(builder.build).not.toHaveBeenCalled();
          expect(consoleSpy).toHaveBeenCalledTimes(1);
          const printed = consoleSpy.mock.calls[0]![0] as string;
          expect(printed).toContain('Available workflows');
          expect(printed).toContain("DISABLED — shortId 'list'");
        } finally {
          consoleSpy.mockRestore();
        }
      }
    );
  });
});

/**
 * Tests PluginImpl — a plugin containing workflows within a workspace.
 * Takes a plugin name and workspace root path. Exposes the plugin name and a
 * list of discovered AhqWorkflow entities (via `getName()` / `getWorkflows()`)
 * which downstream consumers read as plain data — the CLI listing formatter
 * for display, the registry for CLI subcommand registration. When told to
 * registerWorkflowsWith(registry), discovers workflows and registers each.
 * No stored state — everything discovered fresh within each method call.
 * Variables typed as Plugin interface; PluginImpl used only for construction.
 */
import { describe, expect } from 'vitest';

import { BuildMode } from '../../../../src/interfaces/build-mode.js';
import { ShortIdAlreadyRegisteredError } from '../../../../src/workflow-discovery/errors/short-id-already-registered-error.js';
import type { AhqWorkflow } from '../../../../src/workflow-discovery/interfaces/ahq-workflow.js';
import type { WorkflowRegistry } from '../../../../src/workflow-discovery/interfaces/workflow-registry.js';
import { PluginImpl } from '../../../../src/workflow-discovery/plugin/plugin-impl.js';
import type { Plugin } from '../../../../src/workflow-discovery/plugin/plugin.js';
import { StubWorkflowRegistry } from '../test-fixtures/stub-workflow-registry.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';
import { createTestWorkspaceFixture } from '../test-fixtures/workspace-fixture.js';

// The build mode every workflow in the plugin carries (AHQ-208) — its value is
// irrelevant except in the getBuildMode test.
const TEST_BUILD_MODE = BuildMode.BUILD_FIRST;

describe('PluginImpl', () => {
  tmpdirTest('should return the constructor plugin name via getName()', ({ tmpdir }) => {
    const plugin: Plugin = new PluginImpl('test-plugin-alpha', tmpdir, TEST_BUILD_MODE);
    expect(plugin.getName()).toBe('test-plugin-alpha');
  });

  tmpdirTest(
    'should discover workflows within the plugin and expose their short names via getWorkflows()',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      const plugin: Plugin = new PluginImpl('test-plugin-alpha', tmpdir, TEST_BUILD_MODE);
      const shortNames = plugin.getWorkflows().map((w) => w.getShortName().toString());

      expect(shortNames).toContain('reversal');
      expect(shortNames).toContain('math');
    }
  );

  tmpdirTest(
    'should expose workflow descriptions through getWorkflows() so the formatter can display them',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      const plugin: Plugin = new PluginImpl('test-plugin-alpha', tmpdir, TEST_BUILD_MODE);
      const descriptions = plugin.getWorkflows().map((w) => w.getDescription().toString());

      expect(descriptions).toContain('Reverses a string');
    }
  );

  tmpdirTest(
    'should return an empty workflow list when the plugin has no ahq-workflow.json files (so the formatter filters it out)',
    ({ tmpdir }) => {
      // tmpdir has no plugin directories at all
      const plugin: Plugin = new PluginImpl('nonexistent-plugin', tmpdir, TEST_BUILD_MODE);
      expect(plugin.getWorkflows()).toEqual([]);
    }
  );

  // The per-workflow build-mode rule (AHQ-208): a plugin is constructed with its
  // workspace's mode and every workflow it discovers carries that mode.
  tmpdirTest(
    "should expose workflows carrying the plugin's build mode via getBuildMode()",
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      const plugin: Plugin = new PluginImpl('test-plugin-alpha', tmpdir, BuildMode.PREBUILT);
      const workflows = plugin.getWorkflows();

      expect(workflows.length).toBeGreaterThan(0);
      for (const workflow of workflows) {
        expect(workflow.getBuildMode()).toBe(BuildMode.PREBUILT);
      }
    }
  );

  tmpdirTest('should register each discovered workflow via registerWorkflowsWith', ({ tmpdir }) => {
    createTestWorkspaceFixture(tmpdir);
    const plugin: Plugin = new PluginImpl('test-plugin-alpha', tmpdir, TEST_BUILD_MODE);
    const registry = new StubWorkflowRegistry();

    plugin.registerWorkflowsWith(registry);

    // test-plugin-alpha has 2 workflows (reversal + math)
    expect(registry.registered).toHaveLength(2);
  });

  // AHQ-205: the registry rejects an already-registered short name with ShortIdAlreadyRegisteredError;
  // the plugin's answer is "skip it, the first registration wins" and carry on with the rest.
  tmpdirTest(
    'should skip a workflow the registry rejects as already registered and still register the rest',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      const plugin: Plugin = new PluginImpl('test-plugin-alpha', tmpdir, TEST_BUILD_MODE);
      const registry = new RejectingWorkflowRegistry('reversal');

      expect(() => plugin.registerWorkflowsWith(registry)).not.toThrow();

      const registeredShortNames = registry.registered.map((w) => w.getShortName().toString());
      expect(registeredShortNames).toEqual(['math']);
    }
  );

  tmpdirTest('should let any other registry error propagate unchanged', ({ tmpdir }) => {
    createTestWorkspaceFixture(tmpdir);
    const plugin: Plugin = new PluginImpl('test-plugin-alpha', tmpdir, TEST_BUILD_MODE);
    const registry: WorkflowRegistry = {
      register: () => {
        throw new Error('registry is on fire');
      },
    };

    expect(() => plugin.registerWorkflowsWith(registry)).toThrow('registry is on fire');
  });
});

/** Records registrations like StubWorkflowRegistry, but rejects one short name as already taken. */
class RejectingWorkflowRegistry implements WorkflowRegistry {
  readonly registered: AhqWorkflow[] = [];
  constructor(private readonly rejectedShortName: string) {}
  register(workflow: AhqWorkflow): void {
    if (workflow.getShortName().toString() === this.rejectedShortName) {
      throw new ShortIdAlreadyRegisteredError(workflow.getShortName());
    }
    this.registered.push(workflow);
  }
}

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

import { PluginImpl } from '../../../../src/workflow-discovery/plugin/plugin-impl.js';
import type { Plugin } from '../../../../src/workflow-discovery/plugin/plugin.js';
import { StubWorkflowRegistry } from '../test-fixtures/stub-workflow-registry.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';
import { createTestWorkspaceFixture } from '../test-fixtures/workspace-fixture.js';

describe('PluginImpl', () => {
  tmpdirTest('should return the constructor plugin name via getName()', ({ tmpdir }) => {
    const plugin: Plugin = new PluginImpl('test-plugin-alpha', tmpdir);
    expect(plugin.getName()).toBe('test-plugin-alpha');
  });

  tmpdirTest(
    'should discover workflows within the plugin and expose their short names via getWorkflows()',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      const plugin: Plugin = new PluginImpl('test-plugin-alpha', tmpdir);
      const shortNames = plugin.getWorkflows().map((w) => w.getShortName().toString());

      expect(shortNames).toContain('reversal');
      expect(shortNames).toContain('math');
    }
  );

  tmpdirTest(
    'should expose workflow descriptions through getWorkflows() so the formatter can display them',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      const plugin: Plugin = new PluginImpl('test-plugin-alpha', tmpdir);
      const descriptions = plugin.getWorkflows().map((w) => w.getDescription().toString());

      expect(descriptions).toContain('Reverses a string');
    }
  );

  tmpdirTest(
    'should return an empty workflow list when the plugin has no ahq-workflow.json files (so the formatter filters it out)',
    ({ tmpdir }) => {
      // tmpdir has no plugin directories at all
      const plugin: Plugin = new PluginImpl('nonexistent-plugin', tmpdir);
      expect(plugin.getWorkflows()).toEqual([]);
    }
  );

  tmpdirTest('should register each discovered workflow via registerWorkflowsWith', ({ tmpdir }) => {
    createTestWorkspaceFixture(tmpdir);
    const plugin: Plugin = new PluginImpl('test-plugin-alpha', tmpdir);
    const registry = new StubWorkflowRegistry();

    plugin.registerWorkflowsWith(registry);

    // test-plugin-alpha has 2 workflows (reversal + math)
    expect(registry.registered).toHaveLength(2);
  });
});

/**
 * Tests PluginImpl — a plugin containing workflows within a workspace.
 * Takes a plugin name and workspace root path. When told to getPluginListingString(),
 * dynamically creates a PluginDirectoryImpl, discovers workflow files, creates
 * AhqWorkflowImpl for each, and formats the listing. When told to
 * registerWorkflowsWith(registry), discovers workflows and registers each with the registry.
 * No stored state — everything discovered, created, and used within each method call.
 * Variables typed as Plugin interface; PluginImpl used only for construction.
 */
import { describe, expect } from 'vitest';

import { PluginImpl } from '../../../../src/workflow-discovery/plugin/plugin-impl.js';
import type { Plugin } from '../../../../src/workflow-discovery/plugin/plugin.js';
import { StubWorkflowRegistry } from '../test-fixtures/stub-workflow-registry.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';
import { createTestWorkspaceFixture } from '../test-fixtures/workspace-fixture.js';

describe('PluginImpl', () => {
  tmpdirTest(
    'should discover workflows within a plugin and return listing entries via getPluginListingString',
    ({ tmpdir }) => {
      createTestWorkspaceFixture(tmpdir);
      const plugin: Plugin = new PluginImpl('test-plugin-alpha', tmpdir);
      const output = plugin.getPluginListingString();

      expect(output).toContain('reversal');
      expect(output).toContain('math');
      expect(output).toContain('What it does:');
    }
  );

  tmpdirTest('should format listing under "Plugin: <name>" header', ({ tmpdir }) => {
    createTestWorkspaceFixture(tmpdir);
    const plugin: Plugin = new PluginImpl('test-plugin-alpha', tmpdir);
    const output = plugin.getPluginListingString();

    expect(output).toContain('Plugin: test-plugin-alpha');
    expect(output).toContain('Workflows:');
  });

  tmpdirTest(
    'should return empty listing when plugin has no ahq-workflow.json files',
    ({ tmpdir }) => {
      // tmpdir has no plugin directories at all
      const plugin: Plugin = new PluginImpl('nonexistent-plugin', tmpdir);
      const output = plugin.getPluginListingString();

      expect(output).toContain('Plugin: nonexistent-plugin');
      // No workflow entries expected
      expect(output).not.toContain('What it does:');
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

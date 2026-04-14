/**
 * Tests PluginDirectoryImpl — a plugin's directory that can find workflow files
 * by delegating to AhqDirectory.
 * Variables typed as PluginDirectory interface; PluginDirectoryImpl used only for construction.
 */
import { describe, expect } from 'vitest';

import { PluginDirectoryImpl } from '../../../../src/workflow-discovery/plugin/plugin-directory-impl.js';
import type { PluginDirectory } from '../../../../src/workflow-discovery/plugin/plugin-directory.js';
import { tmpdirTest } from '../test-fixtures/tmpdir-fixture.js';
import { createTestWorkspaceFixture } from '../test-fixtures/workspace-fixture.js';

describe('PluginDirectoryImpl', () => {
  tmpdirTest('should find workflow files by delegating to AhqDirectory', ({ tmpdir }) => {
    createTestWorkspaceFixture(tmpdir);
    const pluginDir: PluginDirectory = new PluginDirectoryImpl('test-plugin-alpha', tmpdir);
    const files = pluginDir.findWorkflowFiles();

    // test-plugin-alpha has 2 skills with ahq-workflow.json (reversal + math)
    expect(files.map((f) => f.readContent()).length).toBe(2);
  });
});

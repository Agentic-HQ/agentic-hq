/**
 * Tests PluginIdImpl — wraps a plugin identifier string.
 * Variables typed as PluginId interface; PluginIdImpl used only for construction.
 */
import { describe, expect, it } from 'vitest';

import type { PluginId } from '../../../../src/workflow-discovery/interfaces/plugin-id.js';
import { PluginIdImpl } from '../../../../src/workflow-discovery/workflow/plugin-id-impl.js';
import { stubWorkflowMetadata } from '../test-fixtures/stub-workflow-metadata.js';

describe('PluginIdImpl', () => {
  it('should return the value via toString()', () => {
    const id: PluginId = PluginIdImpl.createFrom(
      stubWorkflowMetadata({ pluginId: 'agentic-hq-demos-plugin' })
    );
    expect(id.toString()).toBe('agentic-hq-demos-plugin');
  });

  it('should throw on empty string', () => {
    expect(() => PluginIdImpl.createFrom(stubWorkflowMetadata({ pluginId: '' }))).toThrow();
  });

  it('should throw on whitespace-only string', () => {
    expect(() => PluginIdImpl.createFrom(stubWorkflowMetadata({ pluginId: '   ' }))).toThrow();
  });
});

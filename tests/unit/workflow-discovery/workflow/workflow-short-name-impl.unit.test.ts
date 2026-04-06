/**
 * Tests WorkflowShortNameImpl — wraps a workflow's short name string.
 * Verifies toString() returns the value and empty/whitespace is rejected.
 * Variables typed as WorkflowShortName interface; WorkflowShortNameImpl used only for construction.
 */
import { describe, expect, it } from 'vitest';

import type { WorkflowShortName } from '../../../../src/workflow-discovery/interfaces/workflow-short-name.js';
import { WorkflowShortNameImpl } from '../../../../src/workflow-discovery/workflow/workflow-short-name-impl.js';
import { stubWorkflowMetadata } from '../test-fixtures/stub-workflow-metadata.js';

describe('WorkflowShortNameImpl', () => {
  it('should return the value via toString()', () => {
    const shortName: WorkflowShortName = WorkflowShortNameImpl.createFrom(
      stubWorkflowMetadata({ shortId: 'reversal' })
    );
    expect(shortName.toString()).toBe('reversal');
  });

  it('should throw on empty string', () => {
    expect(() => WorkflowShortNameImpl.createFrom(stubWorkflowMetadata({ shortId: '' }))).toThrow();
  });

  it('should throw on whitespace-only string', () => {
    expect(() =>
      WorkflowShortNameImpl.createFrom(stubWorkflowMetadata({ shortId: '   ' }))
    ).toThrow();
  });
});

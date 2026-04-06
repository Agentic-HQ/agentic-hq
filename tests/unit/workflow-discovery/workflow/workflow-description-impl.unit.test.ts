/**
 * Tests WorkflowDescriptionImpl — wraps a workflow's description string.
 * Variables typed as WorkflowDescription interface; WorkflowDescriptionImpl used only for construction.
 */
import { describe, expect, it } from 'vitest';

import type { WorkflowDescription } from '../../../../src/workflow-discovery/interfaces/workflow-description.js';
import { WorkflowDescriptionImpl } from '../../../../src/workflow-discovery/workflow/workflow-description-impl.js';
import { stubWorkflowMetadata } from '../test-fixtures/stub-workflow-metadata.js';

describe('WorkflowDescriptionImpl', () => {
  it('should return the value via toString()', () => {
    const desc: WorkflowDescription = WorkflowDescriptionImpl.createFrom(
      stubWorkflowMetadata({ description: 'Reverses a string (hello world demo)' })
    );
    expect(desc.toString()).toBe('Reverses a string (hello world demo)');
  });

  it('should throw on empty string', () => {
    expect(() =>
      WorkflowDescriptionImpl.createFrom(stubWorkflowMetadata({ description: '' }))
    ).toThrow();
  });

  it('should throw on whitespace-only string', () => {
    expect(() =>
      WorkflowDescriptionImpl.createFrom(stubWorkflowMetadata({ description: '   ' }))
    ).toThrow();
  });
});

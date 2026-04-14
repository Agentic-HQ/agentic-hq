/**
 * Tests ExampleParametersImpl — wraps a workflow's example parameters string.
 * Empty string is valid (some workflows have no parameters).
 * Variables typed as ExampleParameters interface; Impl used only for construction.
 */
import { describe, expect, it } from 'vitest';

import type { ExampleParameters } from '../../../../src/workflow-discovery/interfaces/example-parameters.js';
import { ExampleParametersImpl } from '../../../../src/workflow-discovery/workflow/example-parameters-impl.js';
import { stubWorkflowMetadata } from '../test-fixtures/stub-workflow-metadata.js';

describe('ExampleParametersImpl', () => {
  it('should return value via toString()', () => {
    const params: ExampleParameters = ExampleParametersImpl.createFrom(
      stubWorkflowMetadata({ exampleParameters: '-- --input-number=11' })
    );
    expect(params.toString()).toBe('-- --input-number=11');
  });

  it('should allow empty string (workflows with no params)', () => {
    const params: ExampleParameters = ExampleParametersImpl.createFrom(
      stubWorkflowMetadata({ exampleParameters: '' })
    );
    expect(params.toString()).toBe('');
  });
});

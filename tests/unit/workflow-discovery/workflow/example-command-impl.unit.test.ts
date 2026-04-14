/**
 * Tests ExampleCommandImpl — constructs "agentic-hq {shortName}{params}" from
 * WorkflowShortName and ExampleParameters value objects.
 * Variables typed as interfaces; ExampleCommandImpl used only for construction.
 */
import { describe, expect, it } from 'vitest';

import type { ExampleCommand } from '../../../../src/workflow-discovery/interfaces/example-command.js';
import { ExampleCommandImpl } from '../../../../src/workflow-discovery/workflow/example-command-impl.js';
import { stubWorkflowMetadata } from '../test-fixtures/stub-workflow-metadata.js';

describe('ExampleCommandImpl', () => {
  it('should construct "agentic-hq {shortName}{params}" via toString()', () => {
    const cmd: ExampleCommand = ExampleCommandImpl.createFrom(
      stubWorkflowMetadata({
        shortId: 'math',
        exampleParameters: '-- --input-number=11',
      })
    );
    expect(cmd.toString()).toBe('agentic-hq math -- --input-number=11');
  });

  it('should handle no parameters', () => {
    const cmd: ExampleCommand = ExampleCommandImpl.createFrom(
      stubWorkflowMetadata({
        shortId: 'create-workflow',
        exampleParameters: '',
      })
    );
    expect(cmd.toString()).toBe('agentic-hq create-workflow');
  });
});

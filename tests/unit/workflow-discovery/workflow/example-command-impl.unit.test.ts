/**
 * Tests ExampleCommandImpl — constructs "agentic-hq {shortName}{params}" from
 * WorkflowShortName and ExampleParameters value objects. Exposes the command-half
 * and args-half separately via getCommandPart()/getArgsPart() so callers (e.g. the
 * listing formatter) can colour them differently without re-parsing the joined string.
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

  it('should expose the command-half via getCommandPart() as "agentic-hq {shortName}"', () => {
    const cmd: ExampleCommand = ExampleCommandImpl.createFrom(
      stubWorkflowMetadata({
        shortId: 'math',
        exampleParameters: '-- --input-number=11',
      })
    );
    expect(cmd.getCommandPart()).toBe('agentic-hq math');
  });

  it('should expose the args-half via getArgsPart() with the leading separator space included', () => {
    const cmd: ExampleCommand = ExampleCommandImpl.createFrom(
      stubWorkflowMetadata({
        shortId: 'math',
        exampleParameters: '-- --input-number=11',
      })
    );
    expect(cmd.getArgsPart()).toBe(' -- --input-number=11');
  });

  it('should return an empty string from getArgsPart() when there are no parameters', () => {
    const cmd: ExampleCommand = ExampleCommandImpl.createFrom(
      stubWorkflowMetadata({
        shortId: 'create-workflow',
        exampleParameters: '',
      })
    );
    expect(cmd.getArgsPart()).toBe('');
  });

  it('should produce toString() equal to getCommandPart() + getArgsPart()', () => {
    const cmd: ExampleCommand = ExampleCommandImpl.createFrom(
      stubWorkflowMetadata({
        shortId: 'math',
        exampleParameters: '-- --input-number=11',
      })
    );
    expect(cmd.toString()).toBe(cmd.getCommandPart() + cmd.getArgsPart());
  });
});

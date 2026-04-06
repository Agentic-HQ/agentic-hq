/**
 * Tests SkillIdImpl — wraps a skill identifier string.
 * Variables typed as SkillId interface; SkillIdImpl used only for construction.
 */
import { describe, expect, it } from 'vitest';

import type { SkillId } from '../../../../src/workflow-discovery/interfaces/skill-id.js';
import { SkillIdImpl } from '../../../../src/workflow-discovery/workflow/skill-id-impl.js';
import { stubWorkflowMetadata } from '../test-fixtures/stub-workflow-metadata.js';

describe('SkillIdImpl', () => {
  it('should return the value via toString()', () => {
    const id: SkillId = SkillIdImpl.createFrom(stubWorkflowMetadata({ skillId: 'math-workflow' }));
    expect(id.toString()).toBe('math-workflow');
  });

  it('should throw on empty string', () => {
    expect(() => SkillIdImpl.createFrom(stubWorkflowMetadata({ skillId: '' }))).toThrow();
  });

  it('should throw on whitespace-only string', () => {
    expect(() => SkillIdImpl.createFrom(stubWorkflowMetadata({ skillId: '   ' }))).toThrow();
  });
});

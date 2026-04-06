/**
 * Tests FullClaudeSkillCommandImpl — constructs /{pluginId}:{skillId} from PluginId and SkillId value objects.
 * This IS the full Claude command that identifies and runs a skill.
 * Variables typed as interfaces; FullClaudeSkillCommandImpl used only for construction.
 */
import { describe, expect, it } from 'vitest';

import type { FullClaudeSkillCommand } from '../../../../src/workflow-discovery/interfaces/full-claude-skill-command.js';
import { FullClaudeSkillCommandImpl } from '../../../../src/workflow-discovery/workflow/full-claude-skill-command-impl.js';
import { stubWorkflowMetadata } from '../test-fixtures/stub-workflow-metadata.js';

describe('FullClaudeSkillCommandImpl', () => {
  it('should construct /{pluginId}:{skillId} via toString()', () => {
    const cmd: FullClaudeSkillCommand = FullClaudeSkillCommandImpl.createFrom(
      stubWorkflowMetadata({
        pluginId: 'agentic-hq-demos-plugin',
        skillId: 'math-workflow',
      })
    );
    expect(cmd.toString()).toBe('/agentic-hq-demos-plugin:math-workflow');
  });
});

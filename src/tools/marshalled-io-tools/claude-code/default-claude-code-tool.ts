/**
 * DefaultClaudeCodeTool — Stateless facade that delegates to CompositionRoot.
 *
 * SRP Does: Create a CompositionRoot per execute() call and delegate to its tool.
 *
 * SRP Knows About: CompositionRoot (the single place where wiring happens).
 *
 * SRP Knows Nothing About: How any of the individual components work internally,
 * or which concrete classes are wired together.
 *
 * REFACTOR: When I do the refactoring in https://agentic-hq.atlassian.net/browse/AHQ-91 (Remove Git Root Directory Checking)
 * the CompositionRoot class should simplify massively.  At that point the wiring simplifies.
 *
 * I expect at that point it will be easier (in the follow up Jira https://agentic-hq.atlassian.net/browse/AHQ-96) to
 * refactor so that this DefaultClaudeCodeTool
 * actually does some useful stuff - like putting the Claude specific components together i.e. the ClaudeCommandBuilder
 * and whatever marshelling method is returned by compositionRoot.getIOMarshallerSessionFactory() and whatever CLI
 * is returned by compositionRoot.getCLIWrapper().  In fact seems likely that DefaultClaudeCodeTool should be passed a
 * compositionRoot and wire itself a tool up and delegate to that.  This would replace CompositionRoot.getTool()
 *
 */
import type { ClaudeCodeTool } from '../../../interfaces/claude-code-tool.js';
import { CompositionRoot } from '../../../kernel/composition-root.js';

export class DefaultClaudeCodeTool implements ClaudeCodeTool {
  async execute(command: string, input: string): Promise<string> {
    return new CompositionRoot().getTool().execute(command, input);
  }
}

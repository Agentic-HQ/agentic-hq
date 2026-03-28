# Next Refactor: Remove DefaultClaudeCodeTool and Rename CompositionRoot

## Observation

`DefaultClaudeCodeTool` is now a pure pass-through wrapper that does nothing:

```typescript
export class DefaultClaudeCodeTool implements ClaudeCodeTool {
  private readonly tool: ClaudeCodeTool;
  constructor() {
    const root = new CompositionRoot();
    this.tool = root.tool;
  }
  async execute(command: string, input: string): Promise<string> {
    return this.tool.execute(command, input);
  }
}
```

And `ClaudeCodeTool` is an empty interface extension of `Tool`:

```typescript
export interface ClaudeCodeTool extends Tool {}
```

Both can be removed. Consumers would use `new CompositionRoot().tool` instead.

## Rename CompositionRoot

`CompositionRoot` is too generic a name. It's actually **Claude-specific** — it:
1. Creates a `ClaudeCommandBuilder` (Claude-specific CLI flags)
2. Produces a `MarshalledCLITool` wired for Claude Code (i.e. what `DefaultClaudeCodeTool` wraps)
3. Creates a `ClaudeWorkflowCommandBuilder` via `createWorkflowCommandBuilder()`

It's a **Claude tool and workflow builder factory**. A better name would reflect this — something like `ClaudeToolFactory`, `ClaudeSystem`, or `ClaudeCodeSystem`.

## Files to change

### Remove:
- `src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.ts`
- `src/interfaces/claude-code-tool.ts`
- `tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts`
- Remove `ClaudeCodeTool` from `src/interfaces/index.ts` barrel export
- Remove `DefaultClaudeCodeTool` from `src/tools/marshalled-io-tools/claude-code/index.ts` barrel export

### Update consumers (replace `new DefaultClaudeCodeTool()` with `new <RenamedCompositionRoot>().tool`):
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/src/string-reversal-demo-cli.ts`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.ts`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/src/quick-jira-workflow-demo-cli.ts`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/src/full-jira-tdd-story-workflow-demo-cli.ts`
- `tests/integration/claude-code-tool/real-claude-self-termination-skill.integration.test.ts`
- `tests/integration/claude-code-tool/claude-executes-command-using-file-io.integration.test.ts`
- `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts`
- `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts`

### Rename:
- `src/kernel/composition-root.ts` → rename class and file to chosen name
- `tests/unit/kernel/composition-root.unit.test.ts` → update accordingly
- Update `package.json` export path
- Update import in `src/cli/agentic-hq-cli.ts`

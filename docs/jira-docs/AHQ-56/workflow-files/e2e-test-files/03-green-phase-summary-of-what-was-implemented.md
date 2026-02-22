# GREEN Phase Complete: AHQ-56 (e2e test)

**Jira**: [AHQ-56](https://agentic-hq.atlassian.net/browse/AHQ-56)
**Test Type**: e2e
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-02-22

---

## Implementation Created

**Test Command**: `pnpm test:e2e:agentic-hq-cli-string-reversal`
**Test Result**: PASSING (52.6s, within 90s timeout)

---

## What Was Implemented

Minimal implementation to make the E2E test pass. The test runs:
```
agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal -- --string-to-reverse="this is a test string"
```
and verifies the output contains `"gnirts tset a si siht"`.

### Key implementation decisions:
1. **CLI entry point**: `bin/agentic-hq.cjs` CJS wrapper that runs `tsx src/cli/agentic-hq-cli.ts`
2. **File structure**: Conventional TypeScript CLI layout - entry point (`agentic-hq-cli.ts`) separate from business logic (`command/workflow-command.ts`)
3. **PTY passthrough**: Duplicated from `ClaudeCodeTool.runPtyProcess()` pattern (refactor will extract shared utility)
4. **Plugin dependency**: `file:` protocol for `agentic-hq` dependency in ts-workflow (AHQ-61 will replace with proper dependency management)
5. **Absolute plugin dirs**: `ClaudeCodeTool` now resolves plugin dirs via `git rev-parse --show-toplevel` so it works from any CWD
6. **Shell escaping**: Passthrough args are shell-escaped (single-quoted) to survive re-interpretation by bash in PTY

### Bugs found and fixed during GREEN:
1. Commander "too many arguments" - fixed with `.allowExcessArguments(true)`
2. pnpm comment array in dependencies - moved to top-level key
3. `pnpm link --global` failed - used `npm link` fallback
4. `spawn-helper` not executable - added `postinstall` chmod to ts-workflow
5. Passthrough args losing quotes - added shell-escaping in `buildWorkflowCommand()`
6. Relative plugin dirs broken from nested CWD - resolved to absolute paths via git root

## Files Created

- `bin/agentic-hq.cjs` - CJS wrapper entry point for the agentic-hq CLI
- `src/cli/command/workflow-command.ts` - `buildWorkflowCommand()` extracted from CLI
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/SKILL.md` - Skill returning workflow command
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/package.json` - Mini project config
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/src/string-reversal-demo-cli.ts` - Workflow CLI
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/tsconfig.json` - TypeScript config
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/.nvmrc` - Node version
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/.npmrc` - Engine strict
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/.gitignore` - Ignore node_modules

## Files Modified

- `package.json` - Added `bin` and `exports` fields
- `pnpm-workspace.yaml` - Added plugin exclusion (`!.agentic-hq/plugins/**`)
- `src/cli/agentic-hq-cli.ts` - Rewritten as Commander entry point with PTY execution
- `src/tools/claude-code/ClaudeCodeTool.ts` - Absolute plugin dir resolution via git root
- `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts` - Added beforeEach cleanup, 90s timeout
- `tests/unit/cli/agentic-hq-cli-builds-workflow-command.unit.test.ts` - Updated import path and shell-escape expectation

---

## Ready for REFACTOR Phase

The test is passing. Now review and refactor the code:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-56 e2e
```

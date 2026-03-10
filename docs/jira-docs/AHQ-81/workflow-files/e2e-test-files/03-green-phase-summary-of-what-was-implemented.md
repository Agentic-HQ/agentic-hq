# GREEN Phase Complete: AHQ-81 (e2e test)

**Jira**: [AHQ-81](https://agentic-hq.atlassian.net/browse/AHQ-81)
**Test Type**: e2e
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-03-10

---

## Implementation Created

**Files Created/Modified**:
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/SKILL.md` - Skill that returns the command to run the math workflow
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/package.json` - Mini pnpm project for the math workflow CLI
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/tsconfig.json` - TypeScript config for the mini project
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.ts` - 3-step math workflow CLI (x2, +3, /5)
- `package.json` - Updated scripts (added plugin-direct:math-workflow, removed old demo:math-workflow and test:e2e:demo-math-workflow)

**Test Command**: `pnpm test:e2e:cross-workspace-demo-math-workflow`
**Test Result**: PASSING

---

## What Was Implemented

Created the math-workflow skill following the exact same pattern as the string-reversal skill from AHQ-56/AHQ-79. The skill returns a command that runs a self-contained ts-workflow mini-project which chains 3 ClaudeCodeTool.execute() calls (x2, +3, /5). The old direct demo CLI and old e2e test were deleted as they are now superseded by the cross-workspace approach.

### Key implementation decisions:

1. **Exact pattern replication**: Copied string-reversal's SKILL.md, package.json, and tsconfig.json structure verbatim, only changing names and the demo script command.
2. **3-step chain preserved as-is**: The math workflow CLI logic was taken directly from the old `src/demo/cli/math-workflow-demo-cli.ts`, only changing the import path from relative (`../../tools/claude-code/ClaudeCodeTool.js`) to package-based (`agentic-hq/tools/claude-code`).
3. **Stale lock file fix**: Also regenerated string-reversal's ts-workflow `pnpm-lock.yaml` to remove stale `cmd-ts` references left over from before AHQ-77.

### Bugs found and fixed during GREEN:

None - implementation went as planned.

## Files Created

- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/SKILL.md`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/package.json`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/tsconfig.json`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.ts`

## Files Modified

- `package.json` - Added `demo:plugin-direct:math-workflow`, removed `demo:math-workflow` and `test:e2e:demo-math-workflow` scripts
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/pnpm-lock.yaml` - Regenerated to remove stale cmd-ts references

## Files Deleted

- `src/demo/cli/math-workflow-demo-cli.ts` - Logic moved to plugin ts-workflow
- `tests/e2e/demo/demo-math-workflow-gives-expected-output-number.e2e.test.ts` - Replaced by cross-workspace test

---

## Ready for REFACTOR Phase

The test is passing. This program should self terminate, and then (if you are running the automated workflow) the following command will be run automatically:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-81 e2e
```

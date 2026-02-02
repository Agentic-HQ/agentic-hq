# GREEN Phase Complete: AHQ-10 (e2e test)

**Jira**: [AHQ-10](https://agentic-hq.atlassian.net/browse/AHQ-10)
**Test Type**: e2e
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-02-01

---

## Implementation Created

**Files Created/Modified**:
- `package.json` - Added `demo:math-workflow` script
- `src/demo/cli/math-workflow-demo-cli.ts` - CLI that chains 3 Claude Code calls
- `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/times-two.md` - Multiply by 2 command
- `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/plus-three.md` - Add 3 command
- `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/div-five.md` - Divide by 5 command

**Test Command**: `pnpm test:e2e:demo-math-workflow`
**Test Result**: PASSING (57s execution time, within 90s timeout)

---

## What Was Implemented

A minimal CLI that demonstrates chaining multiple Claude Code sessions:

1. **CLI** (`math-workflow-demo-cli.ts`): Takes `--input-number` argument, creates a `ClaudeCodeTool` instance, and calls `execute()` three times sequentially, passing output from each step to the next. Prints final result as "Output number: X".

2. **Three Claude commands** (in `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/`):
   - `times-two.md` - Reads input, multiplies by 2, writes output, self-terminates
   - `plus-three.md` - Reads input, adds 3, writes output, self-terminates
   - `div-five.md` - Reads input, divides by 5, writes output, self-terminates

3. **pnpm script**: `demo:math-workflow` runs the CLI via tsx.

## Files Created

| File | Description |
|------|-------------|
| `src/demo/cli/math-workflow-demo-cli.ts` | CLI entry point |
| `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/times-two.md` | Step 1: ×2 |
| `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/plus-three.md` | Step 2: +3 |
| `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/div-five.md` | Step 3: ÷5 |

---

## Ready for REFACTOR Phase

The test is passing. Now review and refactor the code:
```
/agentic-hq-commands:workflow:jira-story-workflow:04a-jira-refactor-analysis AHQ-10 e2e
```

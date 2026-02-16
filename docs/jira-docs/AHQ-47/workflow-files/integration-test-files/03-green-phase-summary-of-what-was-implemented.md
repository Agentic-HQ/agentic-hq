# GREEN Phase Complete: AHQ-47 (integration test)

**Jira**: [AHQ-47](https://agentic-hq.atlassian.net/browse/AHQ-47)
**Test Type**: integration
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-02-16

---

## Implementation Created

**Files Created/Modified**:
- `.agentic-hq/plugins/agentic-hq-core-plugin/.claude-plugin/plugin.json` - Plugin metadata
- `.agentic-hq/plugins/agentic-hq-core-plugin/skills/self-termination/SKILL.md` - Self-termination skill definition
- `.agentic-hq/plugins/agentic-hq-core-plugin/skills/self-termination/scripts/kill-current-cli-process.sh` - Bundled kill script (copy of original)
- `.claude/commands/agentic-hq-commands/used-in-tests/integration/just-self-terminate-using-skill.md` - Test command that uses the skill
- `src/tools/claude-code/ClaudeCodeTool.ts` - Added hardcoded `--plugin-dir` for core plugin

**Test Command**: `pnpm test:integration:real-claude-self-termination-skill`
**Test Result**: PASSING (21.2s)

---

## What Was Implemented

Minimal implementation to make the integration test pass:

1. **Agentic HQ Core Plugin** - Created at `.agentic-hq/plugins/agentic-hq-core-plugin/` with plugin.json metadata, modelled on the steve-test-plugin.

2. **Self-Termination Skill** - Created SKILL.md that uses `{skill-base-dir}` to locate a bundled copy of the kill script, then runs it with `$PPID` to terminate Claude Code.

3. **Test Command** - Created `just-self-terminate-using-skill.md` that writes a dummy output file then invokes `/agentic-hq-core-plugin:self-termination` skill.

4. **ClaudeCodeTool --plugin-dir** - Hardcoded `--plugin-dir=.agentic-hq/plugins/agentic-hq-core-plugin` in the `runPtyProcess()` args so every Claude invocation loads the core plugin.

## Files Created

- `.agentic-hq/plugins/agentic-hq-core-plugin/.claude-plugin/plugin.json` - Plugin metadata
- `.agentic-hq/plugins/agentic-hq-core-plugin/skills/self-termination/SKILL.md` - Skill definition
- `.agentic-hq/plugins/agentic-hq-core-plugin/skills/self-termination/scripts/kill-current-cli-process.sh` - Bundled kill script
- `.claude/commands/agentic-hq-commands/used-in-tests/integration/just-self-terminate-using-skill.md` - Test command

---

## Ready for REFACTOR Phase

The test is passing. Now review and refactor the code:
```
/agentic-hq-commands:used-in-demos:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-47 integration
```

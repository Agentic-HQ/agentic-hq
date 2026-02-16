# GREEN Phase Implementation Plan: AHQ-47 (integration test)

## Context

AHQ-47 requires creating an "Agentic HQ Core Plugin" with a self-termination skill so Claude Code can terminate itself via a plugin skill rather than a hard-coded script path. The RED phase created an integration test that currently fails with "Unknown skill" because the skill/plugin/command don't exist yet. This GREEN phase implements the minimum code to make that test pass.

## Jira Requirements (Numbered)

1. Plugin at `.agentic-hq/plugins/agentic-hq-core-plugin/` modelled on steve-test-plugin -> [Step 2: Create plugin]
2. Skill at `.agentic-hq/plugins/agentic-hq-core-plugin/skills/self-termination/SKILL.md` -> [Step 3: Create skill]
3. Kill script bundled in skill at `skills/self-termination/scripts/kill-current-cli-process.sh` -> [Step 3: Create skill]
4. Skill variable `kill-current-process-script-path = {skill-base-dir}/scripts/kill-current-cli-process.sh` -> [Step 3: Create skill]
5. Skill instructs Claude to call `{kill-current-process-script-path} $PPID` -> [Step 3: Create skill]
6. Test command `/agentic-hq-commands:used-in-tests:integration:just-self-terminate-using-skill` -> [Step 4: Create command]
7. Command uses skill `/agentic-hq-core-plugin:self-termination` instead of script directly -> [Step 4: Create command]
8. ClaudeCodeTool hardcodes `--plugin-dir=".agentic-hq/plugins/agentic-hq-core-plugin"` -> [Step 5: Modify ClaudeCodeTool]
9. `pnpm test:integration:real-claude-self-termination-skill` passes -> [Step 6: Verification]
10. Move steve-test-plugin from `plugins/` to `.agentic-hq/plugins/` -> N/A (test doesn't check this - REFACTOR/future)
11. Update marketplace.json references -> N/A (test doesn't check this - REFACTOR/future)
12. Add deprecation warnings to old script and old test -> N/A (test doesn't check this - REFACTOR/future)

## Implementation Steps

### Step 0: Copy this approved plan to the green-phase-plan-file
Copy this plan to `docs/jira-docs/AHQ-47/workflow-files/integration-test-files/03-green-phase-implementation-plan.md`

### Step 1: Create plugin directory structure
Create directory: `.agentic-hq/plugins/agentic-hq-core-plugin/`

### Step 2: Create plugin.json
Create `.agentic-hq/plugins/agentic-hq-core-plugin/.claude-plugin/plugin.json`:
```json
{
  "name": "agentic-hq-core-plugin",
  "description": "Core plugin for Agentic HQ providing essential skills like self-termination",
  "version": "0.0.1",
  "author": {
    "name": "Agentic HQ"
  }
}
```
Modelled on: `plugins/steve-test-plugin/.claude-plugin/plugin.json`

### Step 3: Create self-termination skill

UPDATED: disable-model-invocation must be true since commands will instruct the model to invoke this self termination skill in order to return control to Agentic HQ wrapper script.

**3a.** Create `SKILL.md` at `.agentic-hq/plugins/agentic-hq-core-plugin/skills/self-termination/SKILL.md`:
```markdown
---
description: Terminates the current Claude Code CLI process and returns control to the parent process
disable-model-invocation: false
---

## Variables
Set:
skill-base-dir = the skill base directory you were provided with when you ran this skill.
kill-current-process-script-path = {skill-base-dir}/scripts/kill-current-cli-process.sh

## Self-Terminate
Run this command immediately which should terminate Claude Code and return control to the Agentic HQ wrapper script:

{kill-current-process-script-path} $PPID
```
Modelled on: `plugins/steve-test-plugin/skills/investigate-git-stuff/SKILL.md` (uses `{skill-base-dir}` variable pattern)

**3b.** Copy existing kill script to `.agentic-hq/plugins/agentic-hq-core-plugin/skills/self-termination/scripts/kill-current-cli-process.sh`
Source: `tools/scripts/process-control/unix/kill-current-cli-process.sh`
Make executable with `chmod +x`.

### Step 4: Create test command file
Create `.claude/commands/agentic-hq-commands/used-in-tests/integration/just-self-terminate-using-skill.md`:
```markdown
You are an agent being called from an integration test.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

Your job is to:
1. Write a dummy output file
2. Self-terminate by using the self-termination skill

## Step 1: Write Output
Write to: {command-input-output-files-directory}/command-output.json
{
  "command-output-string": "terminated"
}

## Step 2: Self-Terminate Using Skill
Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination
```
Modelled on: `.claude/commands/agentic-hq-commands/used-in-tests/integration/just-self-terminate.md`
Key difference: Uses skill `/agentic-hq-core-plugin:self-termination` instead of calling `kill-current-cli-process.sh $PPID` directly.

### Step 5: Modify ClaudeCodeTool to pass --plugin-dir
File: `src/tools/claude-code/ClaudeCodeTool.ts`

Add a constant:
```typescript
const AGENTIC_HQ_CORE_PLUGIN_DIR = '.agentic-hq/plugins/agentic-hq-core-plugin';
```

In `runPtyProcess()`, change:
```typescript
const fullArgs = [...this.args, commandAndArguments];
```
to:
```typescript
const fullArgs = [...this.args, `--plugin-dir=${AGENTIC_HQ_CORE_PLUGIN_DIR}`, commandAndArguments];
```

This means every Claude invocation includes the core plugin, which is what the Jira specified (human answer: "Hardcoded in ClaudeCodeTool itself").

### Step 6: Verification
Run: `pnpm test:integration:real-claude-self-termination-skill`
Expected: Test passes within 30 seconds.

### Step 7: Run all integration tests (SKIPPED)
Per command instructions: "Running all integration tests has been skipped to conserve Claude Code plan credits."

### TODO: After implementation
Come back and re-read the command file's Steps 7-12 for testing, documentation, Jira comment, and output instructions.

## Files Created/Modified Summary
| File | Action |
|------|--------|
| `.agentic-hq/plugins/agentic-hq-core-plugin/.claude-plugin/plugin.json` | CREATE |
| `.agentic-hq/plugins/agentic-hq-core-plugin/skills/self-termination/SKILL.md` | CREATE |
| `.agentic-hq/plugins/agentic-hq-core-plugin/skills/self-termination/scripts/kill-current-cli-process.sh` | CREATE (copy) |
| `.claude/commands/agentic-hq-commands/used-in-tests/integration/just-self-terminate-using-skill.md` | CREATE |
| `src/tools/claude-code/ClaudeCodeTool.ts` | MODIFY (add --plugin-dir) |

# GREEN Phase Implementation Plan: AHQ-9 Integration Test

**Jira**: [AHQ-9](https://agentic-hq.atlassian.net/browse/AHQ-9)
**Test Type**: integration
**Test Command**: `pnpm test:integration:claude-file-io`

---

## Summary

The integration test fails because:
1. `executeWithFileIO()` doesn't pass the `command` parameter to Claude Code CLI
2. The slash command file doesn't exist

---

## Jira Requirements Checklist

| # | Requirement from Jira | Plan Reference |
|---|----------------------|----------------|
| 1 | Pass command to Claude Code CLI | Change 1 |
| 2 | Create slash command at `.claude/commands/agentic-hq-commands/used-in-tests/integration/reverse-a-string.md` | Change 2 |
| 3 | Command receives temp directory as parameter ($0) | Change 2 |
| 4 | Command reads `command-input.json` with `command-input-string` | Change 2 |
| 5 | Command reverses the string | Change 2 |
| 6 | Command writes `command-output.json` with `command-output-string` | Change 2 |
| 7 | Command self-terminates using kill script | Change 2 |

---

## Implementation Changes

### Change 1: Fix `executeWithFileIO()` in ClaudeCodeTool.ts

**File**: `src/tools/claude-code/ClaudeCodeTool.ts`
**Location**: Lines 100-105

**Current code** (line 102):
```typescript
spawnSync(executable, [...args, tempDir], {
```

**New code**:
```typescript
spawnSync(executable, [...args, command, tempDir], {
```

**Why**: Pass `command` as first arg, `tempDir` as second. Claude CLI concatenates into prompt `/command tempDir`.

---

### Change 1b: Update Fake CLI Fixture (to not break unit test)

**File**: `tests/unit/claude-code-tool/fixtures/fake-claude-cli.reverses-a-string-using-files.fixture.ts`
**Location**: Line 24

**Current code**:
```typescript
const commandInputOutputFilesDirectory = process.argv[2];
```

**New code**:
```typescript
const commandInputOutputFilesDirectory = process.argv[3];
```

**Why**: With the new call pattern `tsx fixture.ts <command> <tempDir>`, tempDir is now `argv[3]` not `argv[2]`.

Also update the USAGE comment (line 9) to reflect the new argument order.

---

### Change 2: Create Slash Command File

**File**: `.claude/commands/agentic-hq-commands/used-in-tests/integration/reverse-a-string.md`

**Content**:
```markdown
You are an agent being called from an integration test.

The temp directory containing command I/O files is: $0

Your job is to:
1. Read the file `command-input.json` from $0
2. Extract the `command-input-string` value
3. Reverse the string (e.g., "hello" becomes "olleh")
4. Write `command-output.json` to $0 with: `{ "command-output-string": "<reversed>" }`
5. Self-terminate

## Step 1: Read Input
Read the file: $0/command-input.json

## Step 2: Reverse String
Take the `command-input-string` value and reverse it character by character.

## Step 3: Write Output
Write to: $0/command-output.json
```json
{
  "command-output-string": "<the reversed string>"
}
```

## Step 4: Self-Terminate
Run this command immediately:

/Users/stevepersonal/dev/agentic-hq/agentic-hq/tools/scripts/process-control/unix/kill-current-cli-process.sh $PPID
```

---

## Verification Steps

1. **Run unit test** (ensure fixture change didn't break it):
   ```bash
   pnpm test tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts
   ```

2. **Run integration test** (the main goal):
   ```bash
   pnpm test:integration:claude-file-io
   ```

3. **Run all integration tests** (no regression):
   ```bash
   pnpm test:integration
   ```

4. **Run typecheck**:
   ```bash
   pnpm typecheck
   ```

---

## Files to Modify/Create

| File | Action |
|------|--------|
| `src/tools/claude-code/ClaudeCodeTool.ts` | Modify line 102 |
| `tests/unit/claude-code-tool/fixtures/fake-claude-cli.reverses-a-string-using-files.fixture.ts` | Modify lines 9, 24 |
| `.claude/commands/agentic-hq-commands/used-in-tests/integration/reverse-a-string.md` | Create new |

---

## Risks

1. **Fixture change breaks unit test**: Mitigated by running unit test first after fixture change
2. **Claude doesn't parse slash command correctly**: Low risk - same pattern as `just-self-terminate.md`
3. **Self-termination timing**: Command must write output BEFORE calling kill script

---

## TODO After Implementation

Come back and re-read the command file `/Users/stevepersonal/dev/agentic-hq/agentic-hq/.claude/commands/agentic-hq-commands/workflow/jira-story-workflow/03-jira-minimal-implementation.md` to follow Steps 7-10 for:
- Running the test with AC command
- Running all integration tests
- Creating GREEN phase documentation
- Adding Jira comment
- Presenting to human

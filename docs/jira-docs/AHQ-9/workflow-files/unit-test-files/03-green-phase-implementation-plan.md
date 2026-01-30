# GREEN Phase Implementation Plan: AHQ-9 Unit Test

**Jira**: [AHQ-9](https://agentic-hq.atlassian.net/browse/AHQ-9)
**Test Type**: unit
**Goal**: Make `fake-claude-executes-command-using-file-io.unit.test.ts` pass

---

## Summary

Add constructor options and a new `execute(command, commandInput)` method overload to `ClaudeCodeTool` that uses file I/O for data exchange instead of stdout parsing.

---

## File to Modify

`src/tools/claude-code/ClaudeCodeTool.ts`

---

## Implementation Steps

### Step 1: Add Imports

Add at top of file:
```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
```

### Step 2: Add Options Interface

Before the class, add:
```typescript
interface ClaudeCodeToolOptions {
  cliExecutable?: string;
}
```

### Step 3: Add Constructor with Optional Options

```typescript
private readonly cliExecutable: string;

constructor(options?: ClaudeCodeToolOptions) {
  this.cliExecutable = options?.cliExecutable ?? 'claude';
}
```

### Step 4: Add Method Overload Signatures

Before the method implementation, add overload signatures:
```typescript
async execute(command: string, commandInput: string): Promise<string>;
execute(prompt: string): ExecuteHandle;
```

### Step 5: Modify execute() to Route Based on Arguments

```typescript
execute(commandOrPrompt: string, commandInput?: string): Promise<string> | ExecuteHandle {
  if (commandInput !== undefined) {
    return this.executeWithFileIO(commandOrPrompt, commandInput);
  }
  return this.executeWithPty(commandOrPrompt);
}
```

### Step 6: Rename Current execute() to executeWithPty()

Rename the existing method body to `private executeWithPty(prompt: string): ExecuteHandle`

### Step 7: Add New executeWithFileIO() Method

```typescript
private async executeWithFileIO(command: string, commandInput: string): Promise<string> {
  // 1. Create temp directory
  const timestamp = Date.now();
  const tempDir = path.join(
    process.cwd(), '.agentic-hq', 'temp', 'command-input-output-files', `io-files-${timestamp}`
  );
  fs.mkdirSync(tempDir, { recursive: true });

  // 2. Write command-input.json
  const inputPath = path.join(tempDir, 'command-input.json');
  fs.writeFileSync(inputPath, JSON.stringify({ 'command-input-string': commandInput }, null, 2));

  // 3. Run CLI passing temp directory as argument
  const [executable, ...args] = this.cliExecutable.split(' ');
  spawnSync(executable, [...args, tempDir], { cwd: process.cwd(), stdio: 'inherit' });

  // 4. Read command-output.json and return the value
  const outputPath = path.join(tempDir, 'command-output.json');
  const outputJson = JSON.parse(fs.readFileSync(outputPath, 'utf-8')) as { 'command-output-string': string };
  return outputJson['command-output-string'];
}
```

---

## Jira Requirements Checklist

From the Jira, the following requirements affect implementation:

1. **Constructor accepts options** - `ClaudeCodeTool({ cliExecutable })` ✓ Step 2-3
2. **execute(command, commandInput) returns Promise<string>** ✓ Step 4-5, 7
3. **Creates temp directory under `.agentic-hq/temp/command-input-output-files/`** ✓ Step 7
4. **Writes command-input.json with `{ "command-input-string": ... }`** ✓ Step 7
5. **Runs CLI passing temp directory as argument ($0)** ✓ Step 7
6. **Reads command-output.json and returns `command-output-string`** ✓ Step 7
7. **Backward compatibility: existing execute(prompt) still works** ✓ Step 4-6
8. **Do NOT delete ExecuteHandle yet (REFACTOR phase work)** ✓ Keeping existing code

---

## Backward Compatibility Check

The existing integration test `real-claude-self-termination.integration.test.ts` uses:
```typescript
const tool = new ClaudeCodeTool();
const output = await tool.execute(SELF_TERMINATE_COMMAND).finished;
```

This will continue to work because:
- Constructor with no args works (options is optional, defaults to `'claude'`)
- `execute(prompt)` with one arg returns `ExecuteHandle` (via overload)

---

## Verification Steps

After implementation:

1. Run the specific unit test:
   ```bash
   pnpm test tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts
   ```

2. Run all unit tests to verify no regressions:
   ```bash
   pnpm test
   ```

---

## TODO After Implementation

Come back and re-read the command file `/Users/stevepersonal/dev/agentic-hq/agentic-hq/.claude/commands/agentic-hq-commands/workflow/jira-story-workflow/03-jira-minimal-implementation.md` to get instructions for:
- Step 7: Run the Test Using the AC Command
- Step 7b: Run all tests of type unit
- Step 8: Create GREEN Phase Document
- Step 9: Add Comment to Jira
- Step 10: Present to Human and STOP

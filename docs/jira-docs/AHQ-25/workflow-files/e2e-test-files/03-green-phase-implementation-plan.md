# GREEN Phase Implementation Plan: AHQ-25 (e2e test)

**Jira**: [AHQ-25](https://agentic-hq.atlassian.net/browse/AHQ-25)
**Tests to pass**:
- `pnpm test:e2e:demo-string-reversal` (automated)
- AC2: Interruptible by human (manual)
- AC3: Full screen, resizable (manual)
**Phase**: GREEN (Minimal Implementation)

---

## Jira Requirements (Numbered)

Every detail from AHQ-25 that affects implementation, with reference to where it's addressed:

1. CLI location: `src/demo/cli/string-reversal-demo-cli.ts` → [Step 3: Create CLI file]
2. CLI command: `pnpm demo:string-reversal --string-to-reverse="<input>"` → [Step 4: Add npm script]
3. Uses Commander library for argument parsing → [Step 1: Install Commander]
4. Calls `ClaudeCodeTool.execute()` with `/agentic-hq-commands:used-in-tests:integration:reverse-a-string` → [Step 3: Create CLI file]
5. Output format: `Reversed string: <result>` → [Step 3: Create CLI file]
6. **AC1**: E2E test passes within 30 seconds → [Verification: Automated]
7. **AC2**: Claude Code is interruptible by human (stdin passthrough) → [Step 2: Modify ClaudeCodeTool.ts]
8. **AC3**: Full screen, resizable (dynamic terminal size + resize handling) → [Step 2: Modify ClaudeCodeTool.ts]
9. Out of scope: error handling, additional logging → N/A (nothing to implement)

---

## Implementation Approach

### Key Design Decision

**Always enable interactive features in `ClaudeCodeTool.ts` - no `interactive` option needed.**

Why this works:
- Stdin passthrough is guarded by `process.stdin.isTTY` - when running in automated tests, there's no TTY, so the raw mode code doesn't run
- Dynamic terminal sizing works in both environments (`process.stdout.columns || 80`)
- Resize handlers are harmless in non-TTY environments

This is simpler than having an `interactive` option because the TTY check naturally handles the difference between automated tests and manual CLI use.

### Files to Create/Modify

| File | Action |
|------|--------|
| `package.json` | Add `commander` dependency |
| `package.json` | Add `demo:string-reversal` script |
| `src/demo/cli/string-reversal-demo-cli.ts` | Create new file |
| `src/tools/claude-code/ClaudeCodeTool.ts` | Add stdin passthrough, dynamic sizing, resize handling |

---

## Step-by-Step Implementation

### Step 1: Install Commander

```bash
pnpm add commander
```

### Step 2: Modify ClaudeCodeTool.ts

Update `runPtyProcess()` to always include:
- Dynamic terminal size: `process.stdout.columns || 80`
- Terminal resize handler
- Stdin passthrough (guarded by `process.stdin.isTTY`)
- Signal cleanup handlers

**Reference implementation**: Use pattern from `temp-test-cli-to-verify-stdin-passthrough-works.ts`

### Step 3: Create CLI file

**File**: `src/demo/cli/string-reversal-demo-cli.ts`

```typescript
#!/usr/bin/env node
/**
 * Demo CLI: String Reversal using Claude Code
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-25
 */

import { Command } from 'commander';
import { ClaudeCodeTool } from '../../tools/claude-code/ClaudeCodeTool.js';

const REVERSE_STRING_COMMAND = '/agentic-hq-commands:used-in-tests:integration:reverse-a-string';

const program = new Command();

program
  .name('demo-string-reversal')
  .description('Reverse a string using Claude Code')
  .requiredOption('--string-to-reverse <string>', 'The string to reverse')
  .action(async (options: { stringToReverse: string }) => {
    const tool = new ClaudeCodeTool();
    const reversed = await tool.execute(REVERSE_STRING_COMMAND, options.stringToReverse);
    console.log(`Reversed string: ${reversed}`);
  });

program.parse();
```

### Step 4: Add npm script

In `package.json`, add to scripts:
```json
"demo:string-reversal": "tsx src/demo/cli/string-reversal-demo-cli.ts"
```

---

## Detailed Changes to ClaudeCodeTool.ts

Replace `runPtyProcess()` with this implementation (always-on interactive features):

```typescript
private async runPtyProcess(commandAndArguments: string): Promise<void> {
  // Detect terminal size with fallbacks
  const cols = process.stdout.columns || 80;
  const rows = process.stdout.rows || 30;

  // Spawn PTY with flow control enabled
  const ptyProcess: IPty = spawnPty(this.executable, [...this.args, commandAndArguments], {
    name: PTY_TERMINAL_TYPE,
    cols,
    rows,
    cwd: process.cwd(),
    env: process.env as Record<string, string>,
    handleFlowControl: true, // Better performance with large output
  });

  // Handle terminal resize events
  const resizeHandler = () => {
    const newCols = process.stdout.columns || cols;
    const newRows = process.stdout.rows || rows;
    ptyProcess.resize(newCols, newRows);
  };
  process.stdout.on('resize', resizeHandler);

  // Stream terminal output (text + ANSI codes) to stdout as Claude runs
  ptyProcess.onData((terminalOutput: string) => {
    process.stdout.write(terminalOutput);
  });

  // STDIN PASSTHROUGH: Pipe user input to PTY (only when running in a TTY)
  //
  // IMPORTANT: The isTTY check is REQUIRED - not optional!
  // If process.stdin.isTTY is false (e.g., in automated tests, CI pipelines,
  // or when stdin is piped), calling setRawMode() throws an error:
  // "Raw mode is not supported on the current process.stdin"
  // This would crash automated tests. The isTTY check prevents this.
  //
  // When isTTY is true (interactive terminal), raw mode sends each keystroke
  // directly without line buffering. This means Ctrl-C (0x03) and Ctrl-D (0x04)
  // are passed through to Claude, allowing the user to quit Claude Code
  // gracefully - they're not intercepted by Node.js as signals.
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (data: Buffer) => {
      ptyProcess.write(data.toString());
    });
  }

  // Cleanup function to restore terminal state
  // Note: isTTY check needed here too - setRawMode(false) also throws if not a TTY
  const cleanup = () => {
    process.stdout.removeListener('resize', resizeHandler);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  };

  // Graceful cleanup on signals (fallback - rarely triggered by user)
  // Since raw mode is enabled, Ctrl-C goes to Claude, not here.
  // These handlers catch signals sent externally, including:
  // - `kill` command from terminal
  // - kill-current-cli-process.sh (used by Claude commands to self-terminate)
  const signalCleanup = () => {
    cleanup();
    ptyProcess.kill();
    process.exit(0);
  };
  process.once('SIGINT', signalCleanup);
  process.once('SIGTERM', signalCleanup);

  // Wait for Claude CLI to exit before returning
  await new Promise<void>((resolve) => {
    ptyProcess.onExit(() => {
      cleanup();
      process.removeListener('SIGINT', signalCleanup);
      process.removeListener('SIGTERM', signalCleanup);
      resolve();
    });
  });
}
```

**Key difference from previous plan**: No `interactive` parameter - just check `process.stdin.isTTY` directly.

---

## Verification

### Automated (AC1)

1. Run the specific e2e test:
   ```bash
   pnpm test:e2e:demo-string-reversal
   ```
   **Expected**: Test passes, output contains "gnirts tset a si siht"

2. Run all e2e tests:
   ```bash
   pnpm test:e2e
   ```
   **Expected**: All e2e tests pass

3. Run validation:
   ```bash
   pnpm validate
   ```
   **Expected**: typecheck + lint + format + unit tests all pass

### Manual (AC2 & AC3)

Human should manually run:
```bash
pnpm demo:string-reversal --string-to-reverse="this is a test string"
```

**AC2 Test**: While Claude is running, try:
- Press keys to see if input goes to Claude
- Try Ctrl-C to interrupt and interact with Claude
- Verify you can type to Claude and it responds

**AC3 Test**:
- Verify Claude displays full screen (not 120x30 box)
- Resize the terminal window while Claude is running
- Verify Claude's display resizes correctly

---

## Impact on Existing Tests

The integration tests will continue to work because:
- `process.stdin.isTTY` is `false` in test environments, so stdin passthrough won't run
- Dynamic terminal sizing is harmless
- Resize handlers are harmless

---

## TODO After Implementation

Come back and re-read the command file at:
`.claude/commands/agentic-hq-commands/workflow/jira-story-workflow/03-jira-minimal-implementation.md`

Follow Steps 7-10 for:
- Running the test using AC command
- Running all e2e tests
- Creating GREEN phase document
- Adding Jira comment
- Presenting to human

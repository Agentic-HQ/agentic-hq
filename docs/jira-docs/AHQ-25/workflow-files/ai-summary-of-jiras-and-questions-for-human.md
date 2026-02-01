# AI Summary: AHQ-25

**Jira**: [AHQ-25](https://agentic-hq.atlassian.net/browse/AHQ-25)
**Title**: Demo CLI Application That Reverses User Provided String
**Status**: Transitioned to In Progress
**Generated**: 2026-02-01

---

## My Understanding of This Task

This Jira asks me to create a demo CLI application that showcases Agentic HQ's ability to orchestrate Claude Code. The CLI will accept a string from the user via command-line argument (`--string-to-reverse="..."`) and use the already-implemented `ClaudeCodeTool.execute()` method to run Claude Code, which will reverse the string and return it via file-based I/O.

The core functionality (`ClaudeCodeTool.execute()`) was already implemented in AHQ-9, along with unit and integration tests. This Jira builds on that work by wrapping it in a user-friendly CLI interface. The CLI needs to:
1. Parse command-line arguments using the Commander library (as specified)
2. Call `ClaudeCodeTool.execute()` with the reverse-a-string command
3. Display the result to the user
4. Support terminal resizing and user interactivity (so users can interrupt Claude Code if needed)

The existing `ClaudeCodeTool.ts` in the main project already streams output to stdout and handles PTY execution, but it uses hardcoded terminal dimensions (120x30). For this CLI to feel like a "native" Claude Code experience (as required by acceptance tests 2 and 3), I need to update it to auto-detect terminal size and handle resize events, similar to the spike project's implementation.

The Jira is explicit about what's **out of scope**: no error handling beyond basic functionality, no additional logging, and no tests that verify Claude's internal behavior - just verify the final reversed string output.

## Research Findings

### Commander Library

I read the Confluence page about Commander (page ID 13991937). Key findings:
- Commander.js handles argument parsing, type casting, automatic help generation, input validation, and action mapping
- It's the most downloaded CLI package in the Node/TypeScript ecosystem (267M downloads/week)
- Installation: `pnpm add commander`
- Provides automatic `--help` generation and professional CLI feel

Example usage pattern for this CLI:
```typescript
import { Command } from 'commander';
const program = new Command();
program
  .name('demo-string-reversal')
  .requiredOption('--string-to-reverse <string>', 'The string to reverse')
  .action((options) => {
    // options.stringToReverse will have the value
  });
program.parse();
```

### Terminal Size & Resize Handling

From the spike project's `ClaudeCodeTool.ts` (lines 223-246), I can see the pattern for:
1. Auto-detecting terminal size: `process.stdout.columns || 80` and `process.stdout.rows || 30`
2. Handling resize events: `process.stdout.on('resize', () => { ptyProcess.resize(newCols, newRows); })`

The current main project's `ClaudeCodeTool.ts` uses hardcoded dimensions (PTY_COLUMNS = 120, PTY_ROWS = 30). This needs updating to match the spike project's dynamic approach.

### User Input Passthrough (RESOLVED via Testing)

**Initial assumption was WRONG**: I initially thought node-pty would naturally inherit stdin from the parent terminal. Testing proved this is NOT the case.

**What we discovered:**
- The spike project's **`ClaudeCodeTool.ts`** does NOT have stdin passthrough (designed for automated agent workflows)
- The spike project's **manual test programs** DO have stdin passthrough (for debugging/interactive testing)
- The current main project's `ClaudeCodeTool.ts` also lacks stdin passthrough
- Without explicit stdin passthrough, user keystrokes appear in the terminal but are NOT sent to Claude

**Confirmed by testing:**
- `pnpm start:v01 hello-world` → **Cannot interact** (uses ClaudeCodeTool without stdin passthrough)
- `npx tsx docs/project-docs/project-spikes/.../Claude.UsingClaudeDirectly.SimplestSquareRootTestProgram.ts` → **Can interact** (manual test has explicit stdin passthrough)

### Why stdin passthrough is NOT automatic (and must be explicit)

**The problem:** When you spawn a PTY with node-pty, the child process (Claude) gets a pseudo-terminal for OUTPUT, but INPUT is not automatically forwarded. Without explicit stdin passthrough:
- User keystrokes appear in the parent terminal (you see what you type)
- But those keystrokes are NOT sent to the PTY/Claude
- Claude never receives your input

**Why the spike's ClaudeCodeTool doesn't have it:**
The spike's ClaudeCodeTool was designed for **automated agent workflows** where:
- Agents run slash commands and self-terminate
- No human interaction is needed during execution
- OutcomeID is parsed from output to determine success/failure

**Why we need it for AHQ-25:**
The demo CLI requires **interactive human use** where:
- Users can interrupt Claude mid-execution
- Users can type to Claude and get responses
- It should feel like running Claude Code directly

**The solution - raw mode stdin passthrough:**
```typescript
// Raw mode sends each keystroke directly without line buffering.
// This means Ctrl-C (0x03) and Ctrl-D (0x04) are passed through to Claude,
// allowing the user to quit Claude Code gracefully - they're not intercepted
// by Node.js as signals. Claude handles these and exits cleanly.
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', (data: Buffer) => {
  ptyProcess.write(data.toString());
});
```

**Why raw mode (not line-buffered mode):**
- **Raw mode**: Each keystroke sent immediately → Claude receives input in real-time
- **Line-buffered mode** (default): Input only sent after Enter → poor interactive experience
- Raw mode also ensures Ctrl-C/Ctrl-D pass through to Claude for graceful exit

**Reference:** The spike's manual test at `components/tool/claude/claude-code-tool/tests/manual-tests/Claude.UsingClaudeDirectly.SimplestSquareRootTestProgram.ts` (lines 426-439) already implements this pattern correctly.

### Perplexity MCP Research: Simplest PTY stdin passthrough

Asked Perplexity MCP if our implementation is the simplest/correct approach. Key findings:

1. **Our approach is production-ready** - `setRawMode(true)` + `ptyProcess.write()` is the standard pattern
2. **Minor improvements added:**
   - `handleFlowControl: true` in spawn options (better performance with large output)
   - SIGINT/SIGTERM cleanup handlers (for external kill signals)
   - Error handling in catch block
3. **Important behavior:** Raw mode means Ctrl-C (0x03) and Ctrl-D (0x04) are passed through to Claude, not intercepted by Node.js - this allows users to quit Claude gracefully
4. **Confirmed:** The kill-current-cli-process.sh script still correctly terminates the process via SIGTERM

## Test CLI Created to Verify stdin Passthrough

We created a test CLI to verify the stdin passthrough approach works:

**File:** `src/experiments/claude-tool-experiments/typescript/temp-test-cli-to-verify-stdin-passthrough-works.ts`

**Run with:**
```bash
pnpm tsx src/experiments/claude-tool-experiments/typescript/temp-test-cli-to-verify-stdin-passthrough-works.ts
```

**Test command created:** `.claude/commands/agentic-hq-commands/experiment-commands/test-stdin-passthrough-works.md`

**What the test CLI implements:**

| Feature | Implementation |
|---------|---------------|
| Dynamic terminal size | `process.stdout.columns \|\| 80`, `process.stdout.rows \|\| 30` |
| Resize handling | `process.stdout.on('resize', () => ptyProcess.resize(...))` |
| Stdin passthrough | `process.stdin.setRawMode(true)` + pipe to `ptyProcess.write()` |
| Flow control | `handleFlowControl: true` in spawn options |
| Signal cleanup | `process.once('SIGINT', cleanup)` / `process.once('SIGTERM', cleanup)` |

**Key code pattern:**
```typescript
// Spawn PTY with flow control enabled
const ptyProcess: IPty = spawnPty('claude', [command], {
  name: 'xterm-256color',
  cols: process.stdout.columns || 80,
  rows: process.stdout.rows || 30,
  cwd: process.cwd(),
  env: process.env as Record<string, string>,
  handleFlowControl: true,
});

// Stream PTY output to stdout
ptyProcess.onData((data: string) => {
  process.stdout.write(data);
});

// STDIN PASSTHROUGH: Raw mode sends keystrokes directly to PTY
// Ctrl-C and Ctrl-D pass through to Claude (not intercepted by Node.js)
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', (data: Buffer) => {
  ptyProcess.write(data.toString());
});

// Handle terminal resize
process.stdout.on('resize', () => {
  ptyProcess.resize(process.stdout.columns || 80, process.stdout.rows || 30);
});

// Cleanup for external signals (kill command, kill-current-cli-process.sh)
const cleanup = () => {
  process.stdin.setRawMode(false);
  process.stdin.pause();
  ptyProcess.kill();
  process.exit(0);
};
process.once('SIGINT', cleanup);
process.once('SIGTERM', cleanup);
```

**Test results:**
- ✅ User input passes through to Claude correctly
- ✅ Terminal resize works
- ✅ Ctrl-C/Ctrl-D passed through to Claude for graceful exit
- ✅ kill-current-cli-process.sh correctly terminates the process

## Questions for Human

### Question 1: User Input Passthrough - Is it already working?

~~The current `ClaudeCodeTool.ts` streams PTY output to `process.stdout`, but I don't see explicit code to pipe `process.stdin` to the PTY for user interactivity.~~

**RESOLVED:** We tested this and confirmed explicit stdin passthrough IS required. The test CLI at `src/experiments/claude-tool-experiments/typescript/temp-test-cli-to-verify-stdin-passthrough-works.ts` demonstrates the working solution.

**Answer:** Yes, we need to add explicit stdin passthrough to `ClaudeCodeTool.ts`. The pattern is documented above.

---

### Question 2: Where should the e2e test file be placed?

The Jira specifies the test filename as `demo-string-reversal-cli-reverses-string.e2e.test.ts`, but I don't see an existing `tests/e2e/` directory in the main project. The project currently has:
- `tests/unit/`
- `tests/integration/`
- `tests/smoke/`

**Should I create `tests/e2e/demo/demo-string-reversal-cli-reverses-string.e2e.test.ts` and a corresponding `vitest.e2e.config.ts`?**

**Human's Response**:
> Yes. Please create

---

### Question 3: How should the CLI display the result?

The acceptance test says the output should "contain the expected reversed string". Options:

1. **JSON output**: `{"reversed-string": "gnirts tset a si siht"}`
2. **Plain text**: Just print `gnirts tset a si siht`
3. **Formatted output**: `Reversed string: gnirts tset a si siht`
4. **Let Claude's output speak for itself**: The CLI shows everything Claude outputs, and the e2e test just checks for the presence of the reversed string in the full output

Option 4 seems most aligned with "feeling like real Claude Code" per acceptance test 3, and is simplest. The e2e test would use `expect(output).toContain('gnirts tset a si siht')`.

**Which approach do you prefer?**

**Human's Response**:
> **Formatted output**: `Reversed string: gnirts tset a si siht` from the demo CLI - and test just checks for the raw reversed string: gnirts tset a si siht (so that formatting won't affect it if it changes in the future)

---

## Files I Reviewed

- `src/tools/claude-code/ClaudeCodeTool.ts` - The main implementation that will be used by the CLI. Has PTY execution but uses hardcoded terminal dimensions that need updating for resize support. **Also missing stdin passthrough.**

- `tests/integration/claude-code-tool/claude-executes-command-using-file-io.integration.test.ts` - Shows how to use `ClaudeCodeTool.execute()` correctly. The CLI code will be very similar to this.

- `.claude/commands/agentic-hq-commands/used-in-tests/integration/reverse-a-string.md` - The slash command that will be executed by the CLI.

- `docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project/components/tool/claude/claude-code-tool/src/ClaudeCodeTool.ts` - Spike implementation showing terminal resize handling pattern (lines 223-246). **Note: Does NOT have stdin passthrough.**

- `package.json` - Confirmed no existing e2e test scripts; Commander library not yet installed.

- Confluence page (ID 13991937) - Commander library documentation and usage patterns.

**Key findings:**
- The spike project has the resize handling code that needs to be ported to the main project's `ClaudeCodeTool.ts`
- **The spike project does NOT have stdin passthrough** - this is new functionality for AHQ-25
- The CLI location should be `src/demo/cli/string-reversal-demo-cli.ts` as specified
- Need to add Commander as a dependency (`pnpm add commander`)
- Need to create e2e test infrastructure (vitest config + test directory)
- Need to update `ClaudeCodeTool.ts` with stdin passthrough + dynamic terminal sizing

## Ready for Next Step

Human, please:
- Answer Questions 2 and 3
- Let me know you've answered them and we'll discuss until resolved.
- Then I'll tell you the next command to run

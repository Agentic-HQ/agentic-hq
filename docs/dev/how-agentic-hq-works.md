# How Agentic HQ Works

This document explains the core architecture of Agentic HQ and how it chains Claude Code sessions together to create automated workflows.

---

## Core Concept

Agentic HQ is a thin TypeScript wrapper around [Claude Code](https://claude.ai/code) that allows you to chain together Custom Commands to automate workflows.

The key insight is that Claude Code can execute slash commands (Custom Commands), and these commands can produce output that becomes input to the next command. This creates a pipeline where each step is handled by a fresh Claude session with specific instructions.

---

## The ClaudeCodeTool

The heart of Agentic HQ is the `ClaudeCodeTool` class (`src/tools/claude-code/ClaudeCodeTool.ts`). It provides a file-based I/O pattern for communicating between workflow steps:

### How It Works

1. **Caller provides a slash command and input string**
   ```typescript
   const tool = new ClaudeCodeTool();
   const result = await tool.execute('/my-command', 'input data');
   ```

2. **Tool writes input to a temp directory**
   - Creates a unique directory under `.agentic-hq/temp/command-input-output-files/`
   - Writes input to `command-input.json`

3. **Tool spawns Claude CLI via PTY**
   - Runs the slash command with the temp directory path as argument
   - Claude reads the input file, processes it, and writes to `command-output.json`

4. **Tool reads and returns the output**
   - Reads `command-output.json` from the temp directory
   - Returns the output string to the caller

### Why PTY?

Claude CLI produces zero output when spawned with piped stdio (standard process spawning). The PTY (pseudo-terminal) creates a fake terminal so Claude thinks it's running in a real terminal (`isatty()` returns true), which enables full output.

---

## Custom Commands

Custom Commands are markdown files in `.claude/commands/` that contain instructions for Claude to follow. When you run a slash command like `/my-commands:do-something`, Claude reads the corresponding markdown file and executes the instructions.

**Location:** `.claude/commands/my-commands/do-something.md`

**Example command structure:**
```markdown
You are an agent performing a specific task.

## Step 1: Read Input
Read the input from the command-input.json file...

## Step 2: Process
Do something with the input...

## Step 3: Write Output
Write the result to command-output.json...
```

---

## Chaining Commands: The Math Workflow Demo

The best way to understand Agentic HQ is to look at the math workflow demo (`src/demo/cli/math-workflow-demo-cli.ts`).

This demo takes an input number and runs it through 3 steps:
- **Step 1:** Multiply by 2
- **Step 2:** Add 3
- **Step 3:** Divide by 5

```typescript
const tool = new ClaudeCodeTool();

// Step 1: Multiply by 2
const step1Result = await tool.execute(
  '/agentic-hq-commands:used-in-demos:math-workflow:times-two',
  options.inputNumber
);

// Step 2: Add 3
const step2Result = await tool.execute(
  '/agentic-hq-commands:used-in-demos:math-workflow:plus-three',
  step1Result
);

// Step 3: Divide by 5
const step3Result = await tool.execute(
  '/agentic-hq-commands:used-in-demos:math-workflow:div-five',
  step2Result
);

console.log(`Output number: ${step3Result}`);
```

**Key pattern:** The output of one command becomes the input to the next. Each step is a fresh Claude session that reads input, processes it, and writes output.

### Running the Demo

```bash
pnpm demo:math-workflow --input-number=11

# Result: ((11 × 2) + 3) ÷ 5 = 5
```

---

## Building Your Own Workflow

To create your own workflow:

1. **Copy the demo program:**
   ```bash
   cp src/demo/cli/math-workflow-demo-cli.ts src/demo/cli/my-workflow-cli.ts
   ```

2. **Copy the demo commands:**
   ```bash
   cp -r .claude/commands/agentic-hq-commands/used-in-demos/math-workflow \
         .claude/commands/my-commands
   ```

3. **Update the command paths** in your CLI to point to your new commands

4. **Modify the commands** to do what you need

5. **Run your workflow:**
   ```bash
   npx tsx src/demo/cli/my-workflow-cli.ts --your-arg-name=your-arg-value
   ```

---

## Directory Structure

```
.agentic-hq/
└── temp/
    └── command-input-output-files/
        └── io-files-TIMESTAMP_UUID/
            ├── command-input.json    # Input for current command
            └── command-output.json   # Output from current command

.claude/
└── commands/
    └── your-commands/
        └── your-command.md           # Custom command instructions

src/
├── tools/
│   └── claude-code/
│       └── ClaudeCodeTool.ts         # Core tool for executing commands
└── demo/
    └── cli/
        └── math-workflow-demo-cli.ts # Example workflow
```

---

## Key Design Principles

1. **File-based I/O:** Commands communicate via JSON files, not memory. This makes debugging easy (you can inspect the files) and allows for workflow resumption in the future.

2. **Fresh context per step:** Each command runs in a fresh Claude session. This keeps context focused and avoids problems with context compaction.

3. **Markdown instructions:** Commands are markdown files that can be version-controlled, reviewed, and iterated on like any other code.

4. **Thin wrapper:** Agentic HQ doesn't try to replace Claude Code - it just provides the glue to chain commands together.

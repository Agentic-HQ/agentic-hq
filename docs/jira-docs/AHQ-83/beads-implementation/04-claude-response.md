# Response to Steve's Suggestion: Further Refactoring of ClaudeCodeTool

## Architectural Decision: SRP Comments on Every Class and Interface

Going forward across the entire AHQ-83 refactor (and beyond), **every class and interface will carry a TSDoc header comment that explicitly states its single responsibility**. This is not limited to the `ClaudeCodeTool` extraction discussed below — it applies to the whole codebase as we touch it.

Each comment follows a consistent pattern:
1. **What it does** — one sentence naming the single responsibility
2. **What it knows about** — the concerns within its boundary
3. **What it knows nothing about** — the concerns deliberately outside its boundary

The "knows nothing about" clause is the enforcement mechanism. If code in a class starts touching something listed in its "knows nothing about" section, that's a clear SRP violation — either the code is in the wrong place, or the responsibility boundary needs revisiting.

This makes SRP concrete and reviewable rather than abstract. Anyone reading the code (human or AI) can immediately see whether a class is staying in its lane.

The full set of header comments for the microkernel architecture is documented in the [SRP Header Comments](#srp-header-comments-for-every-interface-and-class) section below.

---

## Analysis: What's Generic vs Claude-Specific

Looking at `ClaudeCodeTool`, there are two distinct concerns mixed together:

**Generic (reusable for any CLI-based AI tool):**
- The `execute()` orchestration: `new session → writeInput → spawnCli → readOutput`
- Holding references to `CLIWrapper` and `CLICommandBuilder`
- The concept of "run a CLI process and marshal I/O"
- CWD resolution — "where is the user's project?" is the same regardless of which AI tool you use

**Claude-specific (would differ for Codex, Gemini CLI, etc.):**
- Executable name (`'claude'`)
- Plugin dirs (`--plugin-dir=...` flags) — Codex might not even have plugins
- Allowed tools (`--allowedTools=...` flag) — Codex has a completely different permission model
- How CLI args are assembled in `spawnCli()` — every tool has different flags
- The debug logging format

## Proposed Architecture

**Composition over inheritance.** A `MarshalledCLITool` that takes a pluggable "command builder" strategy and creates marshalling sessions per execution:

```
┌─────────────────────────────────────────────────┐
│              Tool (interface)                   │
│  execute(command, input): Promise<string>       │
└─────────────────┬───────────────────────────────┘
                  │ implements
┌─────────────────▼───────────────────────────────┐
│           MarshalledCLITool                     │
│                                                 │
│  - cliWrapper: CLIWrapper                       │
│  - commandBuilder: CLICommandBuilder            │
│                                                 │
│  execute(command, input):                       │
│    1. session = new JsonFileIOMarshallerSession()│
│    2. session.writeInput(input)                 │
│    3. cliCmd = commandBuilder                   │
│         .build(command, session                │
│                  .getMarshallingId())            │
│    4. cliWrapper.run({                          │
│         ...cliCmd,                              │
│         cwd: getProjectWorkingDir()             │
│       })                                        │
│    5. return session.readOutput()               │
└─────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  IOMarshallerSession (interface)                 │
│                                                  │
│  getMarshallingId(): string                      │
│  writeInput(input: string): void                 │
│  readOutput(): string                            │
└──────────────────┬───────────────────────────────┘
                   │ implements
┌──────────────────▼───────────────────────────────┐
│  JsonFileIOMarshallerSession                     │
│                                                  │
│  constructor: generates GUID, creates temp dir   │
│                                                  │
│  getMarshallingId() → tempDir path               │
│  writeInput() → writes command-input.json        │
│  readOutput() → reads command-output.json        │
└──────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│      CLICommandBuilder (interface)              │
│                                                 │
│  build(command: string,                         │
│        marshallingId: string): CLICommand       │
│    returns { executable, args } only            │
│    (cwd is NOT the builder's concern)           │
└──────┬──────────────────────┬───────────────────┘
       │                      │
┌──────▼──────────┐  ┌───────▼───────────────┐
│ ClaudeCommand   │  │ CodexCommand          │
│ Builder         │  │ Builder               │
│                 │  │                       │
│ - pluginDirs    │  │ - model               │
│ - allowedTools  │  │ - approvalMode        │
│                 │  │                       │
│ builds:         │  │ builds:               │
│  executable:    │  │  executable:          │
│    'claude'     │  │    'codex'            │
│  args:          │  │  args:               │
│    --plugin-dir │  │    --model gpt-4.1   │
│    --allowed... │  │    --full-auto       │
│    <command>    │  │    <command>          │
│    <marshId>    │  │    <marshId>         │
└─────────────────┘  └───────────────────────┘
```

**Key design decisions:**

1. **CWD belongs to `MarshalledCLITool`**, not the command builder. CWD answers "where is the user's project?" — that's an orchestration concern, the same regardless of which AI tool you're running. The builder only knows "what executable and what flags."

2. **`IOMarshallerSession` is per-execution.** Each `execute()` call creates a fresh session. The session generates its own GUID internally on construction and owns its own marshalling location. No IDs passed to `writeInput()`/`readOutput()` — the session knows its own identity.

3. **No `IOMarshallerSessionFactory` needed.** Since the session creates its own GUID internally, a factory would just be `() => new JsonFileIOMarshallerSession()` — too trivial to justify an interface. The microkernel's existing factory module convention (`ioMarshallerSessionModule` exporting a `create()` function) already handles pluggable instantiation, just like the other seams.

4. **`CLICommandBuilder.build()` takes `command` and `marshallingId` as separate parameters**, not concatenated into a single string. The builder decides how to incorporate the marshalling ID into the CLI args (e.g., Claude puts it as a trailing arg; another tool might use a `--io-dir` flag).

5. **`CLICommand` is a slim DTO** — just `{ executable, args }`. `MarshalledCLITool` adds `cwd` to produce the full `CLIWrapperOptions` before passing to `cliWrapper.run()`.

With this shape:
- `MarshalledCLITool` owns the generic orchestration **and** CWD
- `CLICommandBuilder` is the seam where tool-specific CLI flags live — nothing more
- `IOMarshallerSession` makes marshalling truly generic — files, database, HTTP, whatever
- The microkernel's factory module convention handles session creation (no separate factory interface)
- Adding a Codex tool = write a `CodexCommandBuilder`, plug it in — zero changes to `MarshalledCLITool`
- The existing `ClaudeCodeTool` is **deleted** — replaced by `MarshalledCLITool` + `ClaudeCommandBuilder`

## New and Updated Interfaces

```typescript
/** The tool-specific parts of a CLI invocation (excludes cwd) */
interface CLICommand {
  executable: string;  // e.g., 'claude', 'codex'
  args: string[];      // e.g., ['--plugin-dir=...', '<command>', '<marshallingId>']
}

/** Strategy for building tool-specific CLI commands */
interface CLICommandBuilder {
  build(command: string, marshallingId: string): CLICommand;
}

/** A single marshalling session — one per tool execution.
 *  Creates its own unique identity (GUID) on construction. */
interface IOMarshallerSession {
  /** Returns the opaque identifier for this session.
   *  For a file marshaller, this is the temp directory path.
   *  For a DB marshaller, this would be the record/row ID. */
  getMarshallingId(): string;
  writeInput(input: string): void;
  readOutput(): string;
}
```

## Decisions Made

### `MarshalledCLITool` replaces `ClaudeCodeTool`

The current `ClaudeCodeTool` class is deleted. What remains is:
- `MarshalledCLITool` (the generic orchestrator) — this is the new `Tool` implementation
- `ClaudeCommandBuilder` (the Claude-specific arg builder) — extracted from `spawnCli()` + constants
- The default tool factory creates `new MarshalledCLITool({ cliWrapper, commandBuilder })`

### CWD belongs to `MarshalledCLITool`, not the builder

CWD answers "where is the user's project?" — that's an orchestration concern, the same regardless of which AI tool you're running. The builder returns `CLICommand` (`{ executable, args }` only). `MarshalledCLITool` adds `cwd` to produce the full `CLIWrapperOptions`.

### `IOMarshallerSession` replaces `IOMarshaller`

The old `IOMarshaller` interface leaked file-system concerns (`createExecutionDir`, `executionDir` params). The new design:
- `IOMarshallerSession` — per-execution, generates its own GUID on construction, truly generic (files, DB, HTTP)
- `JsonFileIOMarshallerSession` — concrete class where the marshalling ID is a temp directory path
- No factory interface needed — the session self-initializes, and the microkernel's existing factory module convention (`ioMarshallerSessionModule` with `create()`) handles pluggable instantiation

### Microkernel config stays simple

One `toolModule` factory that internally wires the command builder. No `commandBuilderModule` in the config for now.

### File locations

- `src/interfaces/cli-command-builder.ts` — `CLICommandBuilder` interface + `CLICommand` type
- `src/interfaces/io-marshaller-session.ts` — `IOMarshallerSession` interface
- `src/interfaces/json-file-io-marshaller-session.ts` — `JsonFileIOMarshallerSession` class
- `src/tools/claude-code/claude-command-builder.ts` — extracted from current `ClaudeCodeTool`
- `src/tools/marshalled-cli-tool.ts` — generic orchestrator
- `src/tools/claude-code/ClaudeCodeTool.ts` — **deleted**
- `src/interfaces/io-marshaller.ts` — **deleted** (replaced by `io-marshaller-session.ts`)
- `src/interfaces/json-file-io-marshaller.ts` — **deleted** (replaced by `json-file-io-marshaller-session.ts`)

## SRP Header Comments for Every Interface and Class

These are the TSDoc comments that will go at the top of each file, making the single responsibility immediately obvious.

### Interfaces

```typescript
/**
 * Tool — Executes a command with string input and returns string output.
 *
 * SRP: Define the contract for command execution. Nothing about HOW
 * commands are executed (CLI, API, in-process) — just that they accept
 * a command + input and produce output.
 */
export interface Tool { ... }
```

```typescript
/**
 * IOMarshallerSession — A single marshalling session for one tool
 * execution.
 *
 * SRP: Read and write command data within one execution session.
 * Initializes itself when created with a unique identity (GUID).
 * Knows nothing about what tool is being run, how the CLI process
 * is spawned, or where the user's project lives — only how to store
 * input and retrieve output for its own session.
 */
export interface IOMarshallerSession { ... }
```

```typescript
/**
 * CLIWrapper — Manages the full lifecycle of a CLI process.
 *
 * SRP: Process lifecycle management — start the process, handle
 * terminal resizing, forward control signals (SIGINT, SIGTERM, etc.),
 * and manage graceful termination. Knows nothing about what the
 * process does, what flags it needs, or where its I/O lives.
 */
export interface CLIWrapper { ... }
```

```typescript
/**
 * CLIWrapperOptions — Configuration for wrapping a CLI process.
 *
 * SRP: Data transfer object. Carries the three things needed to spawn and wrap
 * a CLI process: what to run (executable), how to run it (args), and where
 * to run it (cwd). No behaviour, no logic.
 */
export interface CLIWrapperOptions { ... }
```

```typescript
/**
 * CLICommand — The tool-specific parts of a CLI invocation.
 *
 * SRP: Data transfer object. Carries the executable and args that are
 * specific to a particular AI tool (e.g., Claude's plugin flags, Codex's
 * model flags). Deliberately excludes cwd — that's an orchestration
 * concern, not a tool concern.
 */
export interface CLICommand { ... }
```

```typescript
/**
 * CLICommandBuilder — Builds tool-specific CLI commands from a command
 * string and a marshalling ID.
 *
 * SRP: Translate a generic tool command string and marshalling ID into the
 * executable + flags needed by a specific AI tool. Knows everything
 * about one tool's CLI interface (flags, plugin dirs, permissions).
 * Knows nothing about I/O marshalling, process spawning, or where
 * the user's project lives.
 */
export interface CLICommandBuilder { ... }
```

```typescript
/**
 * Runtime — Orchestrates end-to-end workflow execution.
 *
 * SRP: Top-level workflow coordination. Given a skill path and args,
 * resolve the command, execute it, and handle the result. The entry
 * point that ties everything together.
 */
export interface Runtime { ... }
```

### Classes

```typescript
/**
 * MarshalledCLITool — Orchestrates marshalled I/O around a CLI process.
 *
 * SRP: The execute() pipeline — create a marshalling session, write
 * input, delegate CLI command building, delegates spawning and wrapping
 * the process in the user's project directory, read output. 
 * Owns the orchestration sequence and
 * the CWD decision. Knows nothing about which AI tool is being run
 * (that's the builder's job) or how I/O is marshalled (that's managed by the
 * MarshallerSession and the AI tool), or how the CLI is spawned and wrapped
 * (that's the job of the CLIWrapper)
 */
export class MarshalledCLITool implements Tool { ... }
```

```typescript
/**
 * ClaudeCommandBuilder — Builds Claude Code CLI commands.
 *
 * SRP: Know everything about Claude Code's CLI interface — its
 * executable name, plugin directory flags, allowed tools flags, and
 * argument ordering. Knows nothing about I/O marshalling, process
 * spawning, or where the user's project lives (i.e. where the "claude"
 * command will be run from)
 */
export class ClaudeCommandBuilder implements CLICommandBuilder { ... }
```

```typescript
/**
 * JsonFileIOMarshallerSession — A marshalling session that stores
 * command I/O as JSON files in a temp directory.
 *
 * SRP: For one execution session, generate a GUID, creates a temp
 * directory, writes command-input.json, reads command-output.json.
 * Knows nothing about what tool produces the output or how the CLI
 * process is spawned.
 */
export class JsonFileIOMarshallerSession implements IOMarshallerSession { ... }
```

```typescript
/**
 * PtyCLIWrapper — Manages CLI process lifecycle via pseudo-terminal.
 *
 * SRP: Create a PTY, spawn the process, pipe I/O through the PTY,
 * handle terminal resizing, forward control signals (SIGINT, SIGTERM,
 * etc.), and manage graceful termination. Exists because some CLIs
 * (like Claude) produce no output unless isatty() returns true.
 * Knows nothing about what's being run or why.
 */
export class PtyCLIWrapper implements CLIWrapper { ... }
```

```typescript
/**
 * DefaultRuntime — Default workflow executor.
 *
 * SRP: Resolve a skill path into a shell command (via Tool), then
 * execute that command via PTY. The simplest possible Runtime —
 * no retry logic, no error recovery, no state management.
 */
export class DefaultRuntime implements Runtime { ... }
```

```typescript
/**
 * ColourfulPtyCLIWrapper — Demo plugin: wraps PTY execution with
 * ANSI colour banners.
 *
 * SRP: Prove the CLIWrapper seam is pluggable. Delegates to the real
 * PTY runner but adds coloured banners before and after. Exists purely
 * as a demonstration — not for production use.
 */
export class ColourfulPtyCLIWrapper implements CLIWrapper { ... }
```

## Summary

The `execute()` orchestration pattern (create session → marshal input → spawn CLI → read output) is completely generic and shouldn't be tied to Claude-specific CLI flags or file-system-specific marshalling. The composition approach (`MarshalledCLITool` + `CLICommandBuilder` + `IOMarshallerSession`) keeps it simple, avoids inheritance complexity, and makes "add a new AI tool" a matter of implementing one small interface.

CWD belongs to `MarshalledCLITool` because "where is the user's project?" is an orchestration concern — the same regardless of which AI tool you're using. The builder just knows "what executable and what flags."

Marshalling is now truly generic via `IOMarshallerSession` — the interface says nothing about files, directories, or any specific transport. The session self-initializes with a GUID, so no factory interface is needed — the microkernel's existing factory module convention handles pluggable instantiation.

Shall we make a plan and create Beads tasks for this?

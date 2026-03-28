# Plan: SRP Refactoring of ClaudeCodeTool and IOMarshaller

## Context

The microkernel plugin architecture (AHQ-83) is complete with 4 pluggable seams. However, `ClaudeCodeTool` mixes two concerns: generic I/O orchestration (marshal input → spawn CLI → read output) and Claude-specific CLI flags (plugin dirs, allowed tools, executable). Similarly, `IOMarshaller` leaks file-system concerns (`createExecutionDir`, `executionDir` params) into what should be a transport-agnostic interface.

This refactoring extracts clean SRP boundaries so that adding a new AI tool (e.g., Codex) is just implementing one small interface (`CLICommandBuilder`) rather than copy-pasting an entire class.

All decisions are documented in `docs/jira-docs/AHQ-83/beads-implementation/04-claude-response.md`.

## What Changes

| Old | New | Why |
|-----|-----|-----|
| `ClaudeCodeTool` | `MarshalledCLITool` + `ClaudeCommandBuilder` | Separate orchestration from CLI-specific flags |
| `IOMarshaller` | `IOMarshallerSession` | Per-execution session, transport-agnostic (no file-system leakage) |
| `JsonFileIOMarshaller` | `JsonFileIOMarshallerSession` | Session creates own GUID, owns its temp dir |
| `CLIRunOptions` | `CLIWrapperOptions` | Name reflects it belongs to CLIWrapper |
| — | `CLICommand` + `CLICommandBuilder` | New seam for tool-specific CLI flag building |

## Microkernel Loader Change

Currently the loader creates one `IOMarshaller` instance and passes it to the tool factory. With per-execution sessions, the loader instead passes the `create` **function** (not a created instance) so `MarshalledCLITool` can call it on each `execute()`:

```
BEFORE:  ioMarshaller = ioModule.create()  →  tool = toolModule.create({ ioMarshaller, cliWrapper })
AFTER:   createSession = sessionModule.create  →  tool = toolModule.create({ createSession, cliWrapper })
```

Config field rename: `ioMarshallerModule` → `ioMarshallerSessionModule`

## Implementation Steps (TDD, bottom-up by dependency)

### Step 1: Rename `CLIRunOptions` → `CLIWrapperOptions`

Simple rename across all files. No logic changes.

**Files to update:**
- `src/interfaces/cli-wrapper.ts` — definition + CLIWrapper.run() param type
- `src/interfaces/pty-cli-wrapper.ts` — import + method signature
- `src/kernel/demo-plugins/colourful-pty-cli-wrapper.ts` — import + method signature
- `src/interfaces/index.ts` — re-export
- `tests/unit/interfaces/cli-wrapper.unit.test.ts` — import + usage

Update SRP header comment on `CLIWrapperOptions` per the doc.

**Verify:** `pnpm validate`

### Step 2: Create `IOMarshallerSession` interface + `JsonFileIOMarshallerSession` class (TDD)

**RED:** Create test `tests/unit/interfaces/json-file-io-marshaller-session.unit.test.ts`
- Session generates a unique marshalling ID on construction
- `getMarshallingId()` returns a temp directory path
- `writeInput()` creates directory and writes `command-input.json`
- `readOutput()` reads `command-output.json` and returns string
- `readOutput()` throws if output file doesn't exist
- Two sessions have different marshalling IDs

Run tests, verify they fail (class doesn't exist yet).

**GREEN:** Create the interface and class:
- `src/interfaces/io-marshaller-session.ts` — `IOMarshallerSession` interface with SRP comment
- `src/interfaces/json-file-io-marshaller-session.ts` — `JsonFileIOMarshallerSession` class with SRP comment

The class is essentially `JsonFileIOMarshaller` refactored: constructor generates GUID + creates temp dir path, `writeInput()`/`readOutput()` use `this.marshallingId` instead of receiving `executionDir` param.

Run tests, verify they pass.

**REFACTOR + VERIFY:** Clean up, then `pnpm validate`.

### Step 3: Create `CLICommand` + `CLICommandBuilder` interface + `ClaudeCommandBuilder` class (TDD)

**RED:** Create test `tests/unit/tools/claude-code/claude-command-builder.unit.test.ts`
- `build()` returns `CLICommand` with `executable: 'claude'`
- `build()` includes `--plugin-dir=...` flags for each plugin dir in args
- `build()` includes `--allowedTools=...` flag in args
- `build()` appends command and marshallingId to args
- Default plugin dirs resolve to absolute paths using workspace root
- Custom plugin dirs override defaults
- Custom allowed tools override defaults

Run tests, verify they fail.

**GREEN:** Create the interfaces and class:
- `src/interfaces/cli-command-builder.ts` — `CLICommand` type + `CLICommandBuilder` interface with SRP comments
- `src/tools/claude-code/claude-command-builder.ts` — `ClaudeCommandBuilder` class with SRP comment

`ClaudeCommandBuilder` extracts from `ClaudeCodeTool`: the constants (`DEFAULT_CLAUDE_EXECUTABLE`, plugin dir constants, `DEFAULT_ALLOWED_TOOLS`, ANSI logging), the `getDefaultPluginDirs()` method, and the arg-assembly logic from `spawnCli()`.

Constructor accepts optional `{ executable?, args?, pluginDirs?, allowedTools? }` (same shape as current `ClaudeCodeToolOptions` minus ioMarshaller/cliWrapper).

Run tests, verify they pass.

**REFACTOR + VERIFY:** Clean up, then `pnpm validate`.

### Step 4: Create `MarshalledCLITool` class (TDD)

**RED:** Create test `tests/unit/tools/marshalled-cli-tool.unit.test.ts`
- Implements `Tool` interface (has `execute` method)
- `execute()` creates a session via `createSession` function
- `execute()` calls `session.writeInput()` with the input
- `execute()` calls `commandBuilder.build()` with command and marshalling ID
- `execute()` calls `cliWrapper.run()` with `{ ...cliCmd, cwd }` (CLIWrapperOptions)
- `execute()` calls `session.readOutput()` and returns the result
- CWD is set to `getProjectWorkingDir()`

Use mock/stub dependencies: mock `createSession` function, mock `CLICommandBuilder`, mock `CLIWrapper`.

Run tests, verify they fail.

**GREEN:** Create the class:
- `src/tools/marshalled-cli-tool.ts` — `MarshalledCLITool` class with SRP comment

```typescript
interface MarshalledCLIToolOptions {
  createSession: () => IOMarshallerSession;
  cliWrapper: CLIWrapper;
  commandBuilder: CLICommandBuilder;
}

export class MarshalledCLITool implements Tool {
  constructor(private options: MarshalledCLIToolOptions) {}

  async execute(command: string, input: string): Promise<string> {
    const session = this.options.createSession();
    session.writeInput(input);
    const cliCmd = this.options.commandBuilder.build(command, session.getMarshallingId());
    await this.options.cliWrapper.run({
      ...cliCmd,
      cwd: getProjectWorkingDir(),
    });
    return session.readOutput();
  }
}
```

Run tests, verify they pass.

**REFACTOR + VERIFY:** Clean up, then `pnpm validate`.

### Step 5: Wire up factories, loader, and config

**Update `src/kernel/factories/io-marshaller-session-factory.ts`** (rename from `io-marshaller-factory.ts`):
```typescript
export function create(): IOMarshallerSession {
  return new JsonFileIOMarshallerSession();
}
```

**Update `src/kernel/factories/tool-factory.ts`:**
```typescript
interface ToolDeps {
  createSession: () => IOMarshallerSession;
  cliWrapper: CLIWrapper;
}

export function create(deps: ToolDeps): Tool {
  const commandBuilder = new ClaudeCommandBuilder();
  return new MarshalledCLITool({
    createSession: deps.createSession,
    cliWrapper: deps.cliWrapper,
    commandBuilder,
  });
}
```

**Update `src/kernel/microkernel-loader.ts`:**
- Rename `MicrokernelConfig.ioMarshallerModule` → `ioMarshallerSessionModule`
- Update `DEFAULT_MICROKERNEL_CONFIG` path: `io-marshaller-factory.js` → `io-marshaller-session-factory.js`
- Change loader to pass `create` function instead of calling it:
```typescript
const sessionModule = await import(cfg.ioMarshallerSessionModule);
const cliModule = await import(cfg.cliWrapperModule);
const toolModule = await import(cfg.toolModule);
const runtimeModule = await import(cfg.runtimeModule);

const cliWrapper = cliModule.create();
const tool = toolModule.create({ createSession: sessionModule.create, cliWrapper });
const runtime = runtimeModule.create({ tool });
```

**Update `src/runtime/default-runtime.ts`:**
- Remove `ClaudeCodeTool` import
- Update fallback to create `MarshalledCLITool` with default dependencies:
```typescript
this.tool = options?.tool ?? new MarshalledCLITool({
  createSession: () => new JsonFileIOMarshallerSession(),
  cliWrapper: new PtyCLIWrapper(),
  commandBuilder: new ClaudeCommandBuilder(),
});
```

**Update `.agentic-hq/microkernel.json`:**
- Rename `ioMarshallerModule` → `ioMarshallerSessionModule`
- Update path: `io-marshaller-session-factory.js`

**Update `src/kernel/microkernel-config-loader.ts`:**
- Update validation to check for `ioMarshallerSessionModule` instead of `ioMarshallerModule`

**Update `src/interfaces/index.ts`:**
- Remove `IOMarshaller` export
- Add `IOMarshallerSession` export
- Rename `CLIRunOptions` → `CLIWrapperOptions` (already done in Step 1)
- Add `CLICommand`, `CLICommandBuilder` exports

**Verify:** `pnpm validate`

### Step 6: Update existing tests

**Migrate ClaudeCodeTool tests** in `tests/unit/claude-code-tool/`:
- `claude-code-tool-implements-tool-interface.unit.test.ts` → update to test `MarshalledCLITool` implements `Tool`
- `claude-code-tool-with-injected-io-marshaller.unit.test.ts` → update to test `MarshalledCLITool` with `createSession`
- `claude-code-tool-with-injected-cli-wrapper.unit.test.ts` → update to test `MarshalledCLITool` with `CLIWrapper`
- `claude-code-tool-with-injected-config.unit.test.ts` → move relevant tests to `claude-command-builder.unit.test.ts`
- `fake-claude-executes-command-using-file-io.unit.test.ts` → update to use `MarshalledCLITool` + `ClaudeCommandBuilder`

**Update `tests/unit/interfaces/json-file-io-marshaller.unit.test.ts`** → rename/update to test `JsonFileIOMarshallerSession`

**Update kernel tests:**
- `tests/unit/kernel/microkernel-loader.unit.test.ts` — update config field name, update mock patterns
- `tests/unit/kernel/microkernel-config-loader.unit.test.ts` — update field name in assertions
- `tests/unit/kernel/demo-plugin-loading.unit.test.ts` — update config field name

**Verify:** `pnpm validate`

### Step 7: Delete old files and clean up

**Delete source files:**
- `src/tools/claude-code/ClaudeCodeTool.ts`
- `src/interfaces/io-marshaller.ts`
- `src/interfaces/json-file-io-marshaller.ts`
- `src/kernel/factories/io-marshaller-factory.ts`

**Rename test directories** (if needed):
- `tests/unit/claude-code-tool/` → `tests/unit/tools/` (align with src structure)

**Update any remaining import paths** across the codebase.

**Final verification:** `pnpm validate`

### Step 8: End-to-end verification

- Run `pnpm agentic-hq list` — verify CLI still works
- Create a temp `.agentic-hq/microkernel.override.json` pointing `cliWrapperModule` at the colourful wrapper, run a CLI command, verify coloured output
- Delete the override file, verify system falls back to defaults

## Key Files

| File | Action |
|------|--------|
| `src/interfaces/io-marshaller-session.ts` | **NEW** — `IOMarshallerSession` interface |
| `src/interfaces/json-file-io-marshaller-session.ts` | **NEW** — `JsonFileIOMarshallerSession` class |
| `src/interfaces/cli-command-builder.ts` | **NEW** — `CLICommand` + `CLICommandBuilder` |
| `src/tools/claude-code/claude-command-builder.ts` | **NEW** — `ClaudeCommandBuilder` class |
| `src/tools/marshalled-cli-tool.ts` | **NEW** — `MarshalledCLITool` class |
| `src/kernel/factories/io-marshaller-session-factory.ts` | **NEW** (replaces `io-marshaller-factory.ts`) |
| `src/interfaces/cli-wrapper.ts` | **MODIFY** — rename `CLIRunOptions` → `CLIWrapperOptions` |
| `src/interfaces/pty-cli-wrapper.ts` | **MODIFY** — update import |
| `src/interfaces/index.ts` | **MODIFY** — update exports |
| `src/kernel/microkernel-loader.ts` | **MODIFY** — config field rename, pass `create` function |
| `src/kernel/microkernel-config-loader.ts` | **MODIFY** — update validation field name |
| `src/kernel/factories/tool-factory.ts` | **MODIFY** — use `MarshalledCLITool` + `ClaudeCommandBuilder` |
| `src/runtime/default-runtime.ts` | **MODIFY** — update fallback |
| `src/kernel/demo-plugins/colourful-pty-cli-wrapper.ts` | **MODIFY** — rename import |
| `.agentic-hq/microkernel.json` | **MODIFY** — rename field + update path |
| `src/tools/claude-code/ClaudeCodeTool.ts` | **DELETE** |
| `src/interfaces/io-marshaller.ts` | **DELETE** |
| `src/interfaces/json-file-io-marshaller.ts` | **DELETE** |
| `src/kernel/factories/io-marshaller-factory.ts` | **DELETE** |
| Tests (multiple files) | **MODIFY/MIGRATE** — see Step 6 |

## SRP Header Comments

Every new and modified interface/class gets a TSDoc header comment following the pattern in `04-claude-response.md`:
1. What it does
2. What it knows about
3. What it knows nothing about

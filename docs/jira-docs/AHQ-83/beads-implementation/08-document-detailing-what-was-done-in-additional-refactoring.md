# What Was Done: SRP Refactoring of ClaudeCodeTool and IOMarshaller

This document records what was actually implemented during the SRP refactoring, complementing the plan at `07-verbatim-copy-of-plan.md`.

## Summary

The refactoring separated two god-classes into clean SRP components:

- **`ClaudeCodeTool`** (deleted) was split into **`MarshalledCLITool`** (generic orchestrator) + **`ClaudeCommandBuilder`** (Claude-specific CLI flags).
- **`IOMarshaller` / `JsonFileIOMarshaller`** (deleted) were replaced by **`IOMarshallerSession` / `JsonFileIOMarshallerSession`** (per-execution session, no file-system leakage in the interface).
- **`CLIRunOptions`** was renamed to **`CLIWrapperOptions`** for clarity.
- A new **`CLICommand` + `CLICommandBuilder`** seam was added so that supporting a new AI tool (e.g., Codex) requires implementing one small interface rather than copy-pasting an entire class.

The microkernel loader was updated to pass the session factory **function** (not a created instance) so `MarshalledCLITool` creates a fresh session per `execute()` call.

All work followed TDD (Red-Green-Refactor-Verify) with `pnpm validate` green at every step.

## What Changed vs. the Plan

The plan was followed closely. Deviations were minor:

| Plan said | What actually happened |
|-----------|----------------------|
| Step 7: Rename `tests/unit/claude-code-tool/` to `tests/unit/tools/` | **Not done.** The directory was kept as-is to avoid unnecessary churn. New tests for the new classes were placed in `tests/unit/tools/` (matching `src/` structure), but the existing tests in `tests/unit/claude-code-tool/` were updated in-place. |
| Step 8: Test with `microkernel.override.json` pointing at colourful wrapper | **Not done.** Verified with `pnpm agentic-hq list` and `pnpm validate` only. The colourful wrapper override is a manual/visual test and was skipped. |
| Step 7: Delete old test `json-file-io-marshaller.unit.test.ts` | Plan listed `io-marshaller.unit.test.ts` and `json-file-io-marshaller.unit.test.ts` separately. **Both were deleted.** |

## Files Created (6 new source, 3 new test)

### New interfaces

| File | What it is |
|------|-----------|
| `src/interfaces/io-marshaller-session.ts` | `IOMarshallerSession` interface. Three methods: `getMarshallingId()`, `writeInput()`, `readOutput()`. Transport-agnostic (no file-system in the contract). |
| `src/interfaces/json-file-io-marshaller-session.ts` | `JsonFileIOMarshallerSession` class. Generates a GUID on construction, owns its temp directory path under `.agentic-hq/temp/command-input-output-files/`. |
| `src/interfaces/cli-command-builder.ts` | `CLICommand` type (executable + args DTO, deliberately no `cwd`) + `CLICommandBuilder` interface with `build(command, marshallingId)`. |

### New implementations

| File | What it is |
|------|-----------|
| `src/tools/claude-code/claude-command-builder.ts` | `ClaudeCommandBuilder` class. Extracted from `ClaudeCodeTool`: constants (`DEFAULT_CLAUDE_EXECUTABLE`, plugin dirs, `DEFAULT_ALLOWED_TOOLS`, ANSI logging), `getDefaultPluginDirs()`, and arg-assembly. Constructor accepts optional `{ executable?, args?, pluginDirs?, allowedTools? }`. |
| `src/tools/marshalled-cli-tool.ts` | `MarshalledCLITool` class implementing `Tool`. Generic orchestrator: `execute()` creates a session, writes input, delegates command building, delegates process spawning, reads output. 45 lines total. |
| `src/kernel/factories/io-marshaller-session-factory.ts` | Factory that creates `JsonFileIOMarshallerSession` instances. Used by the microkernel loader. |

### New test files

| File | Tests |
|------|-------|
| `tests/unit/interfaces/json-file-io-marshaller-session.unit.test.ts` | 8 tests: GUID uniqueness, temp dir path, writeInput creates dir and file, readOutput reads file, readOutput throws on missing file, two sessions have different IDs, session isolation. |
| `tests/unit/tools/claude-code/claude-command-builder.unit.test.ts` | 9 tests: default executable, plugin dir flags, allowed tools flag, command + marshallingId appended, absolute path resolution, custom executable, custom pluginDirs, custom allowedTools, extra args before plugin flags. |
| `tests/unit/tools/marshalled-cli-tool.unit.test.ts` | 7 tests: implements Tool, creates session per execute, calls writeInput, calls build, calls cliWrapper.run with CLIWrapperOptions (including cwd), calls readOutput, returns output. |

## Files Modified

### Source files

| File | Change |
|------|--------|
| `src/interfaces/cli-wrapper.ts` | Renamed `CLIRunOptions` to `CLIWrapperOptions`. Added SRP header comment. |
| `src/interfaces/pty-cli-wrapper.ts` | Updated import to `CLIWrapperOptions`. Added SRP header comment. |
| `src/interfaces/index.ts` | Removed `IOMarshaller` export. Added `IOMarshallerSession`, `CLICommand`, `CLICommandBuilder`, `CLIWrapperOptions` exports. Updated module TSDoc to list 5 pluggable seams. |
| `src/kernel/demo-plugins/colourful-pty-cli-wrapper.ts` | Updated import to `CLIWrapperOptions`. Updated SRP header comment. |
| `src/kernel/microkernel-loader.ts` | Config field `ioMarshallerModule` renamed to `ioMarshallerSessionModule`. Loader now passes `sessionModule.create` function (not calling it) to the tool factory. |
| `src/kernel/microkernel-config-loader.ts` | `REQUIRED_CONFIG_KEYS` updated: `ioMarshallerModule` to `ioMarshallerSessionModule`. |
| `src/kernel/factories/tool-factory.ts` | Now creates `MarshalledCLITool` with `ClaudeCommandBuilder`. Deps changed from `{ ioMarshaller, cliWrapper }` to `{ createSession, cliWrapper }`. |
| `src/runtime/default-runtime.ts` | Fallback uses `new MarshalledCLITool({ createSession, cliWrapper, commandBuilder })` with default deps instead of `new ClaudeCodeTool()`. |
| `.agentic-hq/microkernel.json` | Field `ioMarshallerModule` renamed to `ioMarshallerSessionModule`. Path updated to `io-marshaller-session-factory.js`. |
| `src/cli/workflow-command-builder.ts` | Comment updated: `ClaudeCodeTool` to `MarshalledCLITool`. |
| `src/utils/cli/pty-utils.ts` | Comment updated: `ClaudeCodeTool` to `MarshalledCLITool`. |
| `docs/dev/creating-a-plugin.md` | Config example updated: `ioMarshallerModule` to `ioMarshallerSessionModule`, path to `io-marshaller-session-factory.js`. |

### Test files updated

| File | Change |
|------|--------|
| `tests/unit/claude-code-tool/claude-code-tool-implements-tool-interface.unit.test.ts` | Now tests `MarshalledCLITool` implements `Tool` (with mock deps). |
| `tests/unit/claude-code-tool/claude-code-tool-with-injected-io-marshaller.unit.test.ts` | Now tests `MarshalledCLITool` with injected `createSession` function. |
| `tests/unit/claude-code-tool/claude-code-tool-with-injected-cli-wrapper.unit.test.ts` | Now tests `MarshalledCLITool` with injected `CLIWrapper`. |
| `tests/unit/claude-code-tool/claude-code-tool-with-injected-config.unit.test.ts` | Now tests `MarshalledCLITool` with `ClaudeCommandBuilder` config (pluginDirs, allowedTools, defaults). |
| `tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts` | Now uses `MarshalledCLITool` + `ClaudeCommandBuilder` + `PtyCLIWrapper` with the fake CLI fixture. |
| `tests/unit/kernel/microkernel-loader.unit.test.ts` | Config field name updated. Mock patterns updated. |
| `tests/unit/kernel/microkernel-config-loader.unit.test.ts` | Field name in assertions updated. |
| `tests/unit/kernel/demo-plugin-loading.unit.test.ts` | Config field name updated. |
| `tests/unit/runtime/default-runtime.unit.test.ts` | Comment updated about default tool. |
| `tests/unit/cli/workflow-command-builder.unit.test.ts` | Comments and test names updated: `ClaudeCodeTool` to `MarshalledCLITool`. |
| `tests/unit/claude-code-tool/fixtures/fake-claude-cli.reverses-a-string-using-files.fixture.ts` | Comment updated: `ClaudeCodeTool` to `ClaudeCommandBuilder`. |
| `tests/integration/claude-code-tool/claude-executes-command-using-file-io.integration.test.ts` | Replaced `new ClaudeCodeTool()` with `new MarshalledCLITool({ ... })`. |
| `tests/integration/claude-code-tool/real-claude-self-termination-skill.integration.test.ts` | Replaced `new ClaudeCodeTool()` with `new MarshalledCLITool({ ... })`. |
| `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts` | Replaced `new ClaudeCodeTool()` with `new MarshalledCLITool({ ... })`. |
| `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts` | Replaced `new ClaudeCodeTool()` with `new MarshalledCLITool({ ... })`. Updated comments. |
| `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` | Updated error message string: `ClaudeCodeTool.ts` to `claude-command-builder.ts`. |
| `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` | Updated error message string: `ClaudeCodeTool.ts` to `claude-command-builder.ts`. |

## Files Deleted (4 source, 2 test)

| File | What it was |
|------|-----------|
| `src/tools/claude-code/ClaudeCodeTool.ts` | Old god-class mixing orchestration + Claude-specific flags. Replaced by `MarshalledCLITool` + `ClaudeCommandBuilder`. |
| `src/interfaces/io-marshaller.ts` | Old `IOMarshaller` interface with `createExecutionDir()` + `executionDir` params leaking file-system concerns. Replaced by `IOMarshallerSession`. |
| `src/interfaces/json-file-io-marshaller.ts` | Old `JsonFileIOMarshaller` class. Replaced by `JsonFileIOMarshallerSession`. |
| `src/kernel/factories/io-marshaller-factory.ts` | Old factory for `IOMarshaller`. Replaced by `io-marshaller-session-factory.ts`. |
| `tests/unit/interfaces/io-marshaller.unit.test.ts` | Tests for old `IOMarshaller` interface. No longer needed. |
| `tests/unit/interfaces/json-file-io-marshaller.unit.test.ts` | Tests for old `JsonFileIOMarshaller` class. Replaced by `json-file-io-marshaller-session.unit.test.ts`. |

## Final Architecture: 5 Pluggable Seams

After this refactoring, the microkernel has 5 pluggable seams (up from 4):

```
IOMarshallerSession  ──┐
                       ├──▶  MarshalledCLITool  ──▶  Runtime  ──▶  CLI
CLIWrapper  ───────────┤         (Tool)
                       │
CLICommandBuilder  ────┘
```

| Seam | Interface | Default Implementation | Concern |
|------|-----------|----------------------|---------|
| I/O marshalling | `IOMarshallerSession` | `JsonFileIOMarshallerSession` | How command I/O is stored per execution |
| CLI wrapping | `CLIWrapper` | `PtyCLIWrapper` | How CLI processes are spawned |
| Command building | `CLICommandBuilder` | `ClaudeCommandBuilder` | How tool-specific CLI flags are assembled |
| Tool orchestration | `Tool` | `MarshalledCLITool` | The execute pipeline (marshal, build, spawn, read) |
| Workflow runtime | `Runtime` | `DefaultRuntime` | How workflows are discovered and run |

## Test Results

- **21 test files, 87 unit tests passing**
- `pnpm validate` green: typecheck + lint + format + unit tests
- `pnpm agentic-hq list` works correctly (4 workflows listed)

## SRP Header Comments

Every new and modified interface/class has a TSDoc header comment following this pattern (from `04-claude-response.md`):

1. **What it does** (one sentence)
2. **What it knows about** (its responsibilities)
3. **What it knows nothing about** (boundaries it respects)

Example from `MarshalledCLITool`:

```
SRP: The execute() pipeline - create a marshalling session, write
input, delegate CLI command building, delegate spawning and wrapping
the process in the user's project directory, read output.
Owns the orchestration sequence and the CWD decision. Knows nothing
about which AI tool is being run (that's the builder's job) or how
I/O is marshalled (that's managed by the MarshallerSession and the
AI tool), or how the CLI is spawned and wrapped (that's the job of
the CLIWrapper).
```

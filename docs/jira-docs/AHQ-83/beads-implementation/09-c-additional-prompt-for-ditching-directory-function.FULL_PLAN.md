# Plan: Replace directory-functions.ts with Injected Workspace Objects

## Context

The project has been refactored to clean OO (interfaces + concrete classes + dependency injection) everywhere except `src/utils/directory/directory-functions.ts` — 5 free functions that internally call `execSync('git rev-parse')` and read `process.env`. These are called deep inside objects, creating hidden dependencies that make unit testing require global mocking instead of simple object injection.

Additionally, `src/runtime/default-runtime.ts:50` uses raw `process.cwd()` — same smell.

The fix: two immutable, readonly interfaces created once at the Composition Root (`loadRuntime()` in `microkernel-loader.ts`) and injected explicitly through the object graph.

## The Two New Interfaces

```typescript
// src/interfaces/agentic-hq-installation.ts
interface AgenticHqInstallation {
  readonly root: string;        // AHQ installation root (env var or git)
  readonly configDir: string;   // root/.agentic-hq
  readonly pluginsDir: string;  // root/.agentic-hq/plugins
}

// src/interfaces/user-project-workspace.ts
interface UserProjectWorkspace {
  readonly root: string;        // git root of CWD (user's project)
  readonly tempDir: string;     // root/.agentic-hq/temp
}
```

Concrete classes (`DefaultAgenticHqInstallation`, `DefaultUserProjectWorkspace`) resolve all values in the constructor, then `Object.freeze(this)`. Both accept an optional `root` parameter for testability (defaults to env var / git detection).

## Where Things Live

- **Interfaces**: `src/interfaces/agentic-hq-installation.ts`, `src/interfaces/user-project-workspace.ts` (+ barrel export in `index.ts`)
- **Concrete classes**: `src/workspace/default-agentic-hq-installation.ts`, `src/workspace/default-user-project-workspace.ts`
- **Shared helper**: `src/workspace/git-root-detector.ts` (extracts the `execSync('git rev-parse')` call used by both defaults)
- **Tests**: `tests/unit/workspace/default-agentic-hq-installation.unit.test.ts`, `tests/unit/workspace/default-user-project-workspace.unit.test.ts`

## Current Consumers → What Changes

| Consumer File | Currently Calls | After: Receives Via Constructor |
|---|---|---|
| `src/kernel/microkernel-config-loader.ts:42` | `getAgenticHqWorkspaceRoot()` | `installation: AgenticHqInstallation` (function parameter) |
| `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts:81` | `getAgenticHqWorkspaceRoot()` | `installation: AgenticHqInstallation` (constructor param) |
| `src/io/marshalling/json-file-io-marshaller-session.ts:51` | `getAgenticHqTempDir()` | `tempDir: string` (constructor param, from factory which holds `workspace`) |
| `src/tools/marshalled-io-tools/marshalled-cli-tool.ts:47` | `getProjectWorkingDir()` | `workspace: UserProjectWorkspace` (constructor param) |
| `src/runtime/default-runtime.ts:50` | `process.cwd()` | `workspace: UserProjectWorkspace` (in options) |

## Wiring: How Workspace Objects Flow Through loadRuntime()

```
loadRuntime(options?):
  installation = options?.installation ?? new DefaultAgenticHqInstallation()
  workspace    = options?.workspace ?? new DefaultUserProjectWorkspace()
  config       = loadMicrokernelConfig(installation)       // <-- receives installation
  sessionFactory = sessionModule.create({ workspace })     // <-- factory stores workspace
  cliWrapper     = cliModule.create()                      // <-- unchanged
  tool           = toolModule.create({ sessionFactory, cliWrapper, installation, workspace })
  runtime        = runtimeModule.create({ tool, workspace })
```

`agentic-hq-cli.ts` stays thin — still just `const runtime = await loadRuntime()`. The defaults are created inside `loadRuntime()`. Tests can override by passing fakes.

## Key Design Decisions

1. **`IOMarshallerSessionFactory.create()` stays zero-arg** — the interface contract is a plugin API. The factory stores `tempDir` internally (received in its own constructor from the microkernel factory).
2. **`configDir` on AgenticHqInstallation** — centralises the `.agentic-hq` directory name knowledge in one place instead of duplicating it.
3. **DefaultRuntime default construction path gets removed** — it currently creates its own `MarshalledCLITool` internally (a Composition Root concern leaking into a domain class). Since `runtime-factory.ts` always provides deps, the fallback is dead code.
4. **`loadRuntime()` accepts optional installation/workspace overrides** — same pattern as existing optional `config` parameter. Production uses defaults; tests inject fakes.

---

## Task Breakdown (5 tasks, linear dependencies)

### Task 1: Create interfaces + concrete classes (additive, nothing breaks)

**Create:**
- `src/interfaces/agentic-hq-installation.ts` — interface with `readonly root, configDir, pluginsDir`
- `src/interfaces/user-project-workspace.ts` — interface with `readonly root, tempDir`
- `src/interfaces/index.ts` — add barrel exports for both
- `src/workspace/git-root-detector.ts` — shared `detectGitRoot()` function (extracts logic from current `getGitRoot()`)
- `src/workspace/default-agentic-hq-installation.ts` — constructor takes optional `root?`, resolves from env/git, computes derived paths, freezes
- `src/workspace/default-user-project-workspace.ts` — constructor takes optional `root?`, resolves from git, computes derived paths, freezes
- `tests/unit/workspace/default-agentic-hq-installation.unit.test.ts`
- `tests/unit/workspace/default-user-project-workspace.unit.test.ts`

**TDD cycles:** 2 (one per concrete class). Tests verify: explicit root works, env var fallback works, git fallback works, derived paths are correct, object is frozen.

**Done:** New interfaces barrel-exported, new classes tested, existing tests unaffected, `pnpm validate` passes.

### Task 2: Inject AgenticHqInstallation into config-loader + command-builder

**Modify:**
- `src/kernel/microkernel-config-loader.ts` — `loadMicrokernelConfig(installation)` parameter, use `installation.configDir`, remove directory-functions import
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` — constructor takes `installation`, use `this.installation.pluginsDir`, remove directory-functions import
- `src/kernel/factories/tool-factory.ts` — add `installation` to `ToolDeps`, pass to `new ClaudeCommandBuilder(deps.installation)`
- `src/kernel/microkernel-loader.ts` — create `DefaultAgenticHqInstallation`, pass to `loadMicrokernelConfig()` and `toolModule.create()`

**Update tests:**
- `tests/unit/kernel/microkernel-config-loader.unit.test.ts` — inject mock installation instead of manipulating env vars
- `tests/unit/tools/claude-code/claude-command-builder.unit.test.ts` — pass mock installation to constructor
- `tests/unit/kernel/microkernel-loader.unit.test.ts` — verify installation flows through deps
- `tests/unit/kernel/demo-plugin-loading.unit.test.ts` — verify still works with updated loader

**Done:** Two files no longer import directory-functions, `pnpm validate` passes.

### Task 3: Inject UserProjectWorkspace into session-factory + marshalled-cli-tool

**Modify:**
- `src/io/marshalling/json-file-io-marshaller-session.ts` — `JsonFileIOMarshallerSession` takes `tempDir: string` in constructor. `JsonFileIOMarshallerSessionFactory` takes `workspace` in constructor, passes `workspace.tempDir` to sessions. Remove directory-functions import.
- `src/tools/marshalled-io-tools/marshalled-cli-tool.ts` — constructor takes `workspace: UserProjectWorkspace`, use `workspace.root` for CWD. Remove directory-functions import.
- `src/kernel/factories/io-marshaller-session-factory.ts` — `create(deps)` receives `{ workspace }`, passes to factory constructor
- `src/kernel/factories/tool-factory.ts` — add `workspace` to `ToolDeps`, pass to `MarshalledCLITool`
- `src/kernel/microkernel-loader.ts` — create `DefaultUserProjectWorkspace`, pass `workspace` into `sessionModule.create()` and `toolModule.create()`

**Update tests:**
- `tests/unit/interfaces/json-file-io-marshaller-session.unit.test.ts` — pass tempDir to session constructor
- `tests/unit/tools/marshalled-cli-tool.unit.test.ts` — pass mock workspace, assert CWD uses workspace.root
- `tests/unit/kernel/microkernel-loader.unit.test.ts` — verify workspace flows through deps
- `tests/unit/kernel/demo-plugin-loading.unit.test.ts` — verify still works

**Done:** Two more files no longer import directory-functions, `pnpm validate` passes.

### Task 4: Inject UserProjectWorkspace into DefaultRuntime (replace process.cwd)

**Modify:**
- `src/runtime/default-runtime.ts` — add `workspace` to `DefaultRuntimeOptions`, use `this.workspace.root` instead of `process.cwd()`. Remove the default construction path (no more inline `new MarshalledCLITool(...)` fallback — make `tool`, `cliWrapper`, `workspace` required).
- `src/kernel/factories/runtime-factory.ts` — add `workspace` to `RuntimeDeps`, pass to `DefaultRuntime`
- `src/kernel/microkernel-loader.ts` — pass `workspace` into `runtimeModule.create()`

**Update tests:**
- `tests/unit/runtime/default-runtime.unit.test.ts` — pass workspace in options, assert CWD uses workspace.root, remove/update "default construction" test

**Done:** `process.cwd()` no longer used in production code, `pnpm validate` passes.

### Task 5: Delete directory-functions.ts + final cleanup

**Delete:**
- `src/utils/directory/directory-functions.ts`
- `tests/unit/utils/directory/directory-functions.unit.test.ts`
- `src/utils/directory/` directory (if empty)
- `src/utils/` directory (if empty)

**Verify:**
- Grep confirms zero references to `directory-functions` in `src/` and `tests/`
- Grep confirms zero calls to `execSync('git rev-parse')` outside `src/workspace/`
- Grep confirms zero `process.cwd()` in `src/` outside CLI entry point
- `pnpm validate` passes (full: typecheck + lint + tests)

**Done:** Old module deleted, codebase has zero hidden directory/env side effects in non-Composition-Root code.

---

## Verification

After all 5 tasks:
1. `pnpm validate` passes (typecheck + lint + unit tests)
2. `grep -r "directory-functions" src/` returns nothing
3. `grep -r "process\.cwd" src/` returns nothing in production code (only in tests if needed)
4. `grep -r "execSync.*git rev-parse" src/` only hits `src/workspace/git-root-detector.ts`
5. Manual: `npx tsx src/cli/agentic-hq-cli.ts list` still works (the real composition root creates real workspace objects)

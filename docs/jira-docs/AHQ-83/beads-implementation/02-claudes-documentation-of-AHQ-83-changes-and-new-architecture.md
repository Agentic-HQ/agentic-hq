# AHQ-83: Microkernel (Plugin) Architecture — Changes and New Architecture

## Summary

AHQ-83 refactored the Agentic HQ system from a monolithic architecture — where the CLI directly created concrete classes and called them — into a **microkernel (plugin) architecture** with four pluggable seams. Developers can now replace any component (I/O marshalling, CLI process spawning, tool execution, or workflow runtime) by creating a factory module and pointing a JSON config file at it.

**Branch:** `refactor/ahq-83-microkernal-plugin-architecture`
**Commits:** 5 (a830888 → 664fcae)
**Files changed:** 42 (+1,725 / -190 lines)
**New dependency:** `defu` (unjs) for config deep merging

---

## Previous Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        agentic-hq-cli.ts                            │
│  (monolithic entry point — parsing, orchestration, execution)       │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │  new ClaudeCodeTool() │  │  runPtyProcess()     │                │
│  │  (hardcoded)         │  │  (direct import)     │                │
│  └──────────┬───────────┘  └──────────┬───────────┘                │
│             │                         │                             │
│   tool.execute(skill, input)          │  Spawns bash PTY            │
│             │                         │                             │
│   ┌─────────┴─────────────────────────┴───────────┐                │
│   │             ClaudeCodeTool                     │                │
│   │  ┌─────────────────────┐  ┌──────────────┐    │                │
│   │  │  getCommandIoDir()  │  │ runPtyProcess │    │                │
│   │  │  createInputFile()  │  │ (hardcoded    │    │                │
│   │  │  getCommandOutput() │  │  direct call) │    │                │
│   │  │  (all built-in)     │  └──────────────┘    │                │
│   │  └─────────────────────┘                       │                │
│   └────────────────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────────────┘

PROBLEMS:
• CLI did parsing, orchestration AND execution — all tightly coupled
• ClaudeCodeTool owned its own I/O (crypto, fs, path) and CLI spawning
• No way to swap any component without modifying source code
• Untestable: program.parse() ran on import, couldn't inject mocks
```

## New Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  agentic-hq-cli.ts  (2 lines — thin bootstrap)                            │
│    const runtime = await loadRuntime();                                     │
│    createProgram(runtime).parse();                                          │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  MICROKERNEL LOADER  (microkernel-loader.ts)                               │
│                                                                             │
│  Reads config → dynamically imports factory modules → wires dependency chain│
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  CONFIG (microkernel-config-loader.ts)                               │   │
│  │   .agentic-hq/microkernel.json          (base, git-tracked)         │   │
│  │   .agentic-hq/microkernel.override.json (user override, gitignored) │   │
│  │   deep merge via defu (override wins)                                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  WIRING ORDER:                                                              │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐                                        │
│  │ IOMarshaller │  │  CLIWrapper  │    ← create() (no deps)                │
│  │  interface   │  │  interface   │                                        │
│  └──────┬───────┘  └──────┬───────┘                                        │
│         │                 │                                                  │
│         └────────┬────────┘                                                  │
│                  ▼                                                           │
│         ┌──────────────┐                                                    │
│         │     Tool     │               ← create({ ioMarshaller, cliWrapper})│
│         │  interface   │                                                    │
│         └──────┬───────┘                                                    │
│                ▼                                                             │
│         ┌──────────────┐                                                    │
│         │   Runtime    │               ← create({ tool })                   │
│         │  interface   │                                                    │
│         └──────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  CLI PROGRAM  (agentic-hq-program.ts)                                      │
│                                                                             │
│  createProgram(runtime) → Commander program with injected Runtime           │
│  Delegates all workflow execution to runtime.runWorkflow(skillPath, args)   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Four Pluggable Seams

| Seam | Interface | Default Implementation | Responsibility |
|------|-----------|----------------------|----------------|
| **IOMarshaller** | `createExecutionDir()`, `writeInput()`, `readOutput()` | `JsonFileIOMarshaller` | Marshals command I/O between orchestrator and tool. Default uses JSON files in a temp directory. |
| **CLIWrapper** | `run(options: CLIRunOptions)` | `PtyCLIWrapper` | Spawns and manages CLI processes. Default uses `node-pty` pseudo-terminals. |
| **Tool** | `execute(command, input)` | `ClaudeCodeTool` | Executes AI tool commands. Default uses Claude Code CLI with file-based I/O. |
| **Runtime** | `runWorkflow(skillPath, args)` | `DefaultRuntime` | Discovers and runs workflows. Default resolves skill commands via Tool and executes via PTY. |

### Dependency Chain

```
IOMarshaller + CLIWrapper  →  Tool  →  Runtime
     (no deps)              (needs both)  (needs Tool)
```

Modules are loaded and wired in order — each downstream module receives its upstream dependencies via the `create(deps)` factory function.

---

## How the Plugin Module Overloading Works — In Detail

### 1. Factory Module Convention

Every pluggable seam is loaded via a **factory module** — a TypeScript/JavaScript module that exports a `create(deps?)` function. This is the only contract between the microkernel and a plugin:

```typescript
// For IOMarshaller and CLIWrapper (no dependencies):
export function create(): IOMarshaller { ... }
export function create(): CLIWrapper { ... }

// For Tool (receives upstream deps):
export function create(deps: { ioMarshaller: IOMarshaller; cliWrapper: CLIWrapper }): Tool { ... }

// For Runtime (receives upstream deps):
export function create(deps: { tool: Tool }): Runtime { ... }
```

### 2. Config-Driven Dynamic Loading

The microkernel loader (`microkernel-loader.ts`) reads module paths from config and uses ES dynamic `import()`:

```typescript
export async function loadRuntime(config?: MicrokernelConfig): Promise<Runtime> {
  const cfg = config ?? (await loadMicrokernelConfig());

  const ioModule = await import(cfg.ioMarshallerModule);
  const cliModule = await import(cfg.cliWrapperModule);
  const toolModule = await import(cfg.toolModule);
  const runtimeModule = await import(cfg.runtimeModule);

  const ioMarshaller = ioModule.create();
  const cliWrapper = cliModule.create();
  const tool = toolModule.create({ ioMarshaller, cliWrapper });
  const runtime = runtimeModule.create({ tool });

  return runtime;
}
```

### 3. Layered JSON Config

The config loader (`microkernel-config-loader.ts`) loads module paths from two JSON files:

- **`.agentic-hq/microkernel.json`** — Base config (tracked in git, shared with team)
- **`.agentic-hq/microkernel.override.json`** — User-local overrides (gitignored)

The override file is **deep-merged** over the base using `defu` (from the unjs ecosystem, same team behind Nuxt). Only the fields you specify in the override are replaced — everything else comes from base.

**Fallback chain:**
1. If neither file exists → hardcoded `DEFAULT_MICROKERNEL_CONFIG`
2. If only base exists → base config used as-is
3. If both exist → deep merge (override wins)

**Validation:** After merging, all 4 required fields (`ioMarshallerModule`, `cliWrapperModule`, `toolModule`, `runtimeModule`) must be non-empty strings. Fails fast on invalid JSON or missing fields.

### 4. Constructor Injection in ClaudeCodeTool

Beyond the microkernel module loading, `ClaudeCodeTool` itself also supports constructor injection for finer-grained control:

```typescript
const tool = new ClaudeCodeTool({
  ioMarshaller: myCustomMarshaller,   // defaults to JsonFileIOMarshaller
  cliWrapper: myCustomWrapper,         // defaults to PtyCLIWrapper
  pluginDirs: ['/my/plugins'],         // defaults to built-in AHQ plugin dirs
  allowedTools: ['Bash', 'Read'],      // defaults to built-in list
});
```

This means plugins can be swapped at two levels:
- **Microkernel level** — replace entire modules via config (e.g., swap out the entire Tool)
- **Constructor level** — inject dependencies into existing modules (e.g., keep ClaudeCodeTool but change how it spawns processes)

---

## How Developers Can Override a Module

### Step 1: Implement the interface

Create a class that implements one of the four interfaces:

```typescript
import type { CLIWrapper, CLIRunOptions } from 'agentic-hq/interfaces';

export class DockerCLIWrapper implements CLIWrapper {
  async run(options: CLIRunOptions): Promise<void> {
    // Run the CLI process inside a Docker container instead of a PTY
    const { executable, args, cwd } = options;
    await execAsync(`docker run -v ${cwd}:/work -w /work ubuntu ${executable} ${args.join(' ')}`);
  }
}
```

### Step 2: Create a factory module

Export a `create()` function that returns your implementation:

```typescript
import type { CLIWrapper } from 'agentic-hq/interfaces';
import { DockerCLIWrapper } from './docker-cli-wrapper.js';

export function create(): CLIWrapper {
  return new DockerCLIWrapper();
}
```

### Step 3: Point config at your factory

Create or edit `.agentic-hq/microkernel.override.json`:

```json
{
  "cliWrapperModule": "./path/to/docker-cli-wrapper-factory.js"
}
```

That's it. Next time `agentic-hq` starts, it dynamically imports your factory module instead of the default.

### Working Example: ColourfulPtyCLIWrapper

The codebase includes a complete demo plugin at `src/kernel/demo-plugins/`:

**`colourful-pty-cli-wrapper.ts`** — Wraps the default PTY runner with ANSI colour banners:

```typescript
export class ColourfulPtyCLIWrapper implements CLIWrapper {
  private readonly colourCode: string;

  constructor(colourCode: string = '41') {  // red background
    this.colourCode = colourCode;
  }

  async run(options: CLIRunOptions): Promise<void> {
    this.writeBanner();                              // 10 lines of coloured XXXXs
    process.stdout.write(`\x1b[${this.colourCode}m`);
    await runPtyProcess(options);                     // delegate to real PTY
    process.stdout.write('\x1b[0m');                  // reset
    this.writeBanner();                              // 10 lines of coloured XXXXs
  }
}
```

**`colourful-pty-cli-wrapper-factory.ts`** — Factory module:

```typescript
export function create(): CLIWrapper {
  return new ColourfulPtyCLIWrapper();
}
```

**Activation** — create `.agentic-hq/microkernel.override.json`:

```json
{
  "cliWrapperModule": "../kernel/demo-plugins/colourful-pty-cli-wrapper-factory.js"
}
```

---

## What Changed — File by File

### New Files (30 files)

| File | Purpose |
|------|---------|
| **Interfaces** | |
| `src/interfaces/cli-wrapper.ts` | CLIWrapper + CLIRunOptions interface |
| `src/interfaces/io-marshaller.ts` | IOMarshaller interface |
| `src/interfaces/tool.ts` | Tool interface |
| `src/interfaces/runtime.ts` | Runtime interface |
| `src/interfaces/index.ts` | Barrel export for `agentic-hq/interfaces` |
| `src/interfaces/pty-cli-wrapper.ts` | Default CLIWrapper implementation (delegates to `runPtyProcess`) |
| `src/interfaces/json-file-io-marshaller.ts` | Default IOMarshaller implementation (extracted from ClaudeCodeTool) |
| **Kernel** | |
| `src/kernel/microkernel-loader.ts` | Core: config-driven dynamic module loading + wiring |
| `src/kernel/microkernel-config-loader.ts` | JSON config file loading with override support |
| `src/kernel/factories/io-marshaller-factory.ts` | Factory for default IOMarshaller |
| `src/kernel/factories/cli-wrapper-factory.ts` | Factory for default CLIWrapper |
| `src/kernel/factories/tool-factory.ts` | Factory for default Tool (ClaudeCodeTool) |
| `src/kernel/factories/runtime-factory.ts` | Factory for default Runtime |
| `src/kernel/demo-plugins/colourful-pty-cli-wrapper.ts` | Demo plugin: coloured PTY with banners |
| `src/kernel/demo-plugins/colourful-pty-cli-wrapper-factory.ts` | Factory for demo plugin |
| **CLI** | |
| `src/cli/agentic-hq-program.ts` | CLI program factory (testable, accepts Runtime injection) |
| `src/cli/workflow-command-builder.ts` | Pure functions for building workflow commands (accepts Tool interface) |
| **Runtime** | |
| `src/runtime/default-runtime.ts` | Default Runtime implementation |
| **Config** | |
| `.agentic-hq/microkernel.json` | Base config file (git-tracked) |
| **Tests (12 new test files)** | |
| `tests/unit/interfaces/*.unit.test.ts` | Interface contract tests (5 files) |
| `tests/unit/claude-code-tool/*.unit.test.ts` | Injection tests for ClaudeCodeTool (4 files) |
| `tests/unit/cli/*.unit.test.ts` | CLI program + command builder tests (2 files) |
| `tests/unit/kernel/*.unit.test.ts` | Microkernel loader + config + demo plugin tests (3 files) |
| `tests/unit/runtime/*.unit.test.ts` | DefaultRuntime test (1 file) |
| **Docs** | |
| `docs/dev/creating-a-plugin.md` | Developer guide for creating plugins |

### Modified Files (4 files)

| File | Change |
|------|--------|
| `src/cli/agentic-hq-cli.ts` | **Gutted from ~110 lines to 4 lines** — now just `loadRuntime()` + `createProgram(runtime).parse()` |
| `src/tools/claude-code/ClaudeCodeTool.ts` | **Extracted I/O and PTY into injected interfaces** — now accepts `IOMarshaller`, `CLIWrapper`, `pluginDirs`, `allowedTools` via constructor. Implements `Tool` interface. |
| `package.json` | Added `defu` dependency, added `./interfaces` and `./kernel` exports |
| `.gitignore` | Added `.agentic-hq/microkernel.override.json` |

---

## Versioning Risks — What Could Go Wrong

When third-party developers create plugins, versioning becomes critical. Here are the risks:

### 1. Interface Drift (Breaking Changes)

If the Agentic HQ core team changes an interface (e.g., adds a required parameter to `CLIWrapper.run()`), all existing third-party plugins break immediately at runtime.

**Example scenario:**
- v1.0: `CLIWrapper.run(options: CLIRunOptions): Promise<void>`
- v2.0: `CLIWrapper.run(options: CLIRunOptions, context: ExecutionContext): Promise<void>`
- Third-party `DockerCLIWrapper` was built against v1.0 — it only accepts one parameter. When loaded by v2.0 of agentic-hq, it silently ignores the `context` parameter, leading to subtle bugs.

**Mitigation strategies:**
- Semantic versioning: major version bumps for breaking interface changes
- Use TypeScript's `satisfies` or compile-time checks in plugin build tools
- Keep interfaces minimal and stable (avoid "fat interfaces")
- Consider interface versioning (e.g., `CLIWrapperV2` extends `CLIWrapper`)

### 2. Dependency Chain Breakage

Since modules are wired in a chain (`IOMarshaller + CLIWrapper → Tool → Runtime`), a third-party plugin at one level might make assumptions about the implementation at another level.

**Example scenario:**
- Custom `MyTool` assumes `IOMarshaller.readOutput()` returns JSON. A third-party `XmlIOMarshaller` returns XML. `MyTool` crashes with a JSON parse error.

**Mitigation:**
- Document interface contracts thoroughly (not just types, but semantics)
- Provide contract test suites that plugin authors can run against their implementations

### 3. Diamond Dependency Problem

If a plugin imports types from `agentic-hq/interfaces` at build time but the user runs a different version of `agentic-hq` at runtime, types might match but behaviour might differ.

**Mitigation:**
- Plugins should declare `agentic-hq` as a `peerDependency` with a version range
- Publish interface packages separately from implementation packages

### 4. No Runtime Type Checking

Dynamic `import()` performs no type checking. A malformed factory module (missing `create()` function, wrong return type) only fails at runtime.

**Mitigation:**
- Validate factory modules at load time (check `typeof module.create === 'function'`)
- Add a `agentic-hq validate-plugins` CLI command
- Consider a plugin manifest/registration system

---

## What Could Be Improved

### Near-Term

1. **Runtime validation of factory modules** — Currently, if a factory module doesn't export `create()` or returns the wrong type, you get an opaque runtime error. Adding a validation step like `if (typeof module.create !== 'function') throw new PluginError(...)` would improve developer experience.

2. **Plugin discovery** — Currently, plugins must be local file paths. Support for `npm:package-name` or `github:user/repo` module specifiers would allow community distribution.

3. **Plugin lifecycle hooks** — No `init()`, `shutdown()`, or `healthCheck()` methods. Plugins that need setup/teardown (e.g., connecting to a database for I/O marshalling) have no standard way to do it.

4. **Module path resolution** — Module paths in config are relative to the kernel's location, which is fragile. Consider using Node.js `import.meta.resolve()` or a plugin resolver that supports multiple resolution strategies.

### Medium-Term

5. **Host interfaces** — The ChatGPT conversation (Confluence page 2) suggested a bi-directional pattern where parents pass a "Host" interface to children (e.g., `ToolHost` with `log()`, `importModule()`). Currently, the dependency flow is one-directional (parent passes deps down). Adding upward callbacks would enable richer plugin interactions.

6. **Plugin compatibility matrix** — A way to declare which versions of other plugins a plugin is compatible with, similar to `peerDependencies` in npm but at the plugin level.

7. **Tree-based module system** — The current architecture has a flat chain of 4 modules. The ChatGPT conversation envisioned a tree where each node can be replaced, with child/parent interfaces at each edge. This would allow finer-grained plugin replacement (e.g., replacing just the BPMN parser within the Runtime, not the entire Runtime).

### Long-Term

8. **Plugin marketplace/registry** — If the ecosystem grows, a central registry (like npm for plugins) where developers can publish, discover, and rate plugins.

9. **Plugin sandboxing** — Currently, plugins run with full Node.js permissions. For untrusted plugins, sandboxing (e.g., via Node.js `--experimental-permission` or V8 isolates) would improve security.

10. **Distribution bundles** — The Confluence page mentioned "distributions" (like Linux distros) — curated, tested combinations of plugins. A `microkernel.bundle.json` format could declare a set of compatible plugins.

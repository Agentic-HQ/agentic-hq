# Full System State Report: AHQ-83 Branch Analysis

**Branch:** `refactor/ahq-83-microkernal-plugin-architecture`
**Base:** `main`
**Report purpose:** Document exactly what has been done on this branch so that another agent can plan the removal of all microkernel-specific changes while preserving the comprehensive refactoring.

---

## 1. Background

AHQ-83 ("Refactor System To Microkernel (Plugin) Architecture") was a Jira Epic with two goals intertwined:

1. **Comprehensive refactoring** — Break a monolithic codebase into clean OO classes with interfaces, SRP, and dependency injection.
2. **Microkernel plugin architecture** — Allow developers to swap any component at runtime via JSON config files that point to factory modules loaded by dynamic `import()`.

The human now wants to **keep goal 1** (the refactoring) and **completely remove goal 2** (the microkernel). The plugin architecture will be implemented later using a different framework.

---

## 2. High-Level Summary of All Changes

The branch has **110 files changed** (+7,698 / -764 lines vs main) across **5 WIP commits**:

```
55dc4d4 WIP: Add TSDoc comments, extract methods in marshaller session
d21b05b WIP: Introduce WorkflowCommand and WorkflowCommandBuilder concepts
b5e65bf WIP: Promote WorkflowCommandBuilder to pluggable seam, remove Runtime
4ecf1da WIP: Move factories and workflow files to domain directories
1802bba WIP: Extract classes, break circular imports, split mixed-concern file
```

The work falls into **two categories** that are described in detail in sections 3 and 4 below.

---

## 3. What Is "Microkernel" — The Parts To Remove

The microkernel is the **config-driven dynamic module loading system**. It allows users to swap components by editing a JSON file that specifies alternative factory module paths. At startup, the Microkernel class reads the config, dynamically imports the factory modules via `await import()`, and wires the dependency chain.

### 3.1 Architecture Diagram: The Microkernel Loading System

```
                    ┌───────────────────────────────────────────────────────┐
                    │  .agentic-hq/microkernel.json (git-tracked)          │
                    │  .agentic-hq/microkernel.override.json (gitignored)  │
                    │                                                       │
                    │  {                                                    │
                    │    "ioMarshallerSessionModule": "../io/.../factory.js"│
                    │    "cliWrapperModule": "../io/.../factory.js"         │
                    │    "workflowCommandBuilderModule": "../workflow/...js"│
                    │  }                                                    │
                    └──────────────────────┬────────────────────────────────┘
                                           │ read + deep-merge (via defu)
                                           ▼
                    ┌──────────────────────────────────────────────────────┐
                    │  microkernel-config-loader.ts                        │
                    │  loadMicrokernelConfig(installation) → config        │
                    └──────────────────────┬───────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│  Microkernel class  (microkernel.ts)                                           │
│                                                                                │
│  static async create(options?) → Microkernel                                   │
│    • Creates DefaultGitWorkspace, DefaultAgenticHqInstallation,               │
│      DefaultUserProjectWorkspace                                               │
│    • Loads config from JSON files                                              │
│                                                                                │
│  async loadWorkflowCommandBuilder() → WorkflowCommandBuilder                  │
│    • await import(config.ioMarshallerSessionModule)  ← DYNAMIC IMPORT         │
│    • await import(config.cliWrapperModule)            ← DYNAMIC IMPORT         │
│    • await import(config.workflowCommandBuilderModule)← DYNAMIC IMPORT         │
│    • Wires dependency chain:                                                   │
│        sessionFactory + cliWrapper + commandBuilder → MarshalledCLITool        │
│        tool + cliWrapper + workspace → WorkflowCommandBuilder                  │
│    • Returns fully wired WorkflowCommandBuilder                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Microkernel Files — Complete Inventory

These are the files that exist **solely** for the microkernel plugin loading mechanism:

#### Core Microkernel Files

| File | Purpose | Why It's Microkernel |
|------|---------|---------------------|
| `src/kernel/microkernel.ts` | The `Microkernel` class — static `create()` factory + `loadWorkflowCommandBuilder()` that does dynamic imports | **This IS the microkernel.** It reads config, dynamically imports factory modules, and wires the chain. |
| `src/kernel/microkernel-config-loader.ts` | `loadMicrokernelConfig()` — reads JSON files, deep-merges with `defu`, validates | Exists only to support config-driven module swapping |
| `src/kernel/microkernel-config.ts` | `MicrokernelConfig` interface + `DEFAULT_MICROKERNEL_CONFIG` constant | Type definition for the config that drives dynamic loading |
| `.agentic-hq/microkernel.json` | Base config file mapping seam names to module paths | The JSON config file that the microkernel reads |
| `.gitignore` entry | `.agentic-hq/microkernel.override.json` added to gitignore | Supports the override mechanism |

#### Factory Modules (Exist For Dynamic Loading)

These factory modules follow the convention of exporting a `create(deps?)` function. They exist so the microkernel can dynamically import them:

| File | Purpose | Why It's Microkernel |
|------|---------|---------------------|
| `src/io/marshalling/io-marshaller-session-factory.ts` | Exports `create({ workspace })` → `JsonFileIOMarshallerSessionFactory` | Factory module convention for dynamic loading. Without microkernel, you'd just `new JsonFileIOMarshallerSessionFactory(workspace)` directly. |
| `src/io/terminal/cli-wrapper-factory.ts` | Exports `create()` → `PtyCLIWrapper` | Same — trivial factory for dynamic loading |
| `src/workflow/workflow-command-builder-factory.ts` | Exports `create({ tool, cliWrapper, workspace })` → `ClaudeWorkflowCommandBuilder` | Same — factory for dynamic loading |

#### Demo Plugin Files

| File | Purpose | Why It's Microkernel |
|------|---------|---------------------|
| `src/kernel/demo-plugins/colourful-pty-cli-wrapper.ts` | `ColourfulPtyCLIWrapper` — wraps PTY with ANSI colour banners | Exists purely to prove the plugin seam is pluggable |
| `src/kernel/demo-plugins/colourful-pty-cli-wrapper-factory.ts` | Factory for the demo plugin | Factory module for the demo plugin |

#### Documentation

| File | Purpose | Why It's Microkernel |
|------|---------|---------------------|
| `docs/dev/creating-a-plugin.md` | Developer guide for creating plugins | Documents the plugin mechanism |

#### Dependency

| Item | Purpose | Why It's Microkernel |
|------|---------|---------------------|
| `defu` in `package.json` + `pnpm-lock.yaml` | Deep-merging library for config override | Used only by `microkernel-config-loader.ts` for merging base + override config |

#### Tests For Microkernel Components

| File | Tests |
|------|-------|
| `tests/unit/kernel/microkernel.unit.test.ts` | Tests `Microkernel.create()` and `loadWorkflowCommandBuilder()` |
| `tests/unit/kernel/microkernel-config-loader.unit.test.ts` | Tests JSON loading, merging, validation |
| `tests/unit/kernel/demo-plugin-loading.unit.test.ts` | Tests the demo plugin can be loaded via config |

### 3.3 How The Microkernel Is Used (Entry Point)

The CLI entry point (`src/cli/agentic-hq-cli.ts`) currently says:

```typescript
const microkernel = await Microkernel.create();
const builder = await microkernel.loadWorkflowCommandBuilder();
createProgram(builder, new WorkflowSkillsRegistry(DEMO_SKILLS)).parse();
```

**Without the microkernel**, this would need to become direct wiring:

```typescript
// Pseudocode — direct wiring without microkernel
const gitWorkspace = new DefaultGitWorkspace();
const installation = new DefaultAgenticHqInstallation(gitWorkspace);
const workspace = new DefaultUserProjectWorkspace(gitWorkspace);
const sessionFactory = new JsonFileIOMarshallerSessionFactory(workspace);
const cliWrapper = new PtyCLIWrapper();
const commandBuilder = new ClaudeCommandBuilder(installation);
const tool = new MarshalledCLITool(sessionFactory, cliWrapper, commandBuilder, workspace);
const builder = new ClaudeWorkflowCommandBuilder(tool, cliWrapper, workspace);
createProgram(builder, new WorkflowSkillsRegistry(DEMO_SKILLS)).parse();
```

---

## 4. What Is "Refactoring" — The Parts To Keep

The refactoring broke a monolithic codebase into clean, modular classes with interfaces, SRP, and dependency injection. Even without the microkernel's dynamic loading, these classes are valuable for testability, readability, and future extensibility.

### 4.1 Architecture Diagram: Before (main branch)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     agentic-hq-cli.ts (~110 lines)                       │
│             (monolithic: parsing + orchestration + execution)             │
│                                                                          │
│  ┌──────────────────────────────────────────────┐                        │
│  │  ClaudeCodeTool (~190 lines, god-class)      │                        │
│  │                                              │                        │
│  │  - execute(command, input)                   │                        │
│  │  - getCommandIoDir()     ← crypto + fs       │                        │
│  │  - createInputFile()     ← fs.writeFile      │                        │
│  │  - spawnCliViaPty()      ← hardcoded claude   │                        │
│  │  - getCommandOutput()    ← fs.readFile        │                        │
│  │  - getAgenticHqWorkspaceRoot() ← hidden call  │                        │
│  │  - getProjectWorkingDir()      ← hidden call  │                        │
│  └──────────────────────────────────────────────┘                        │
│                                                                          │
│  ┌──────────────────────────────────────────────┐                        │
│  │  runPtyProcess() (~120 lines, free function) │                        │
│  │  in src/utils/cli/pty-utils.ts               │                        │
│  │  - spawns node-pty                           │                        │
│  │  - handles signals, resize, cleanup          │                        │
│  └──────────────────────────────────────────────┘                        │
│                                                                          │
│  ┌──────────────────────────────────────────────┐                        │
│  │  directory-functions.ts (5 free functions)    │                        │
│  │  in src/utils/directory/                      │                        │
│  │  - getAgenticHqWorkspaceRoot()               │                        │
│  │  - getAgenticHqPluginsDir()                  │                        │
│  │  - getCurrentWorkspaceRoot()                 │                        │
│  │  - getAgenticHqTempDir()                     │                        │
│  │  - getProjectWorkingDir()                    │                        │
│  │  ALL call execSync('git rev-parse') or       │                        │
│  │  process.env internally — hidden side effects │                        │
│  └──────────────────────────────────────────────┘                        │
│                                                                          │
│  ┌──────────────────────────────────────────────┐                        │
│  │  demo-workflow-skills-registry.ts            │                        │
│  │  (module-level array + formatSkillList())    │                        │
│  └──────────────────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────────────────┘

PROBLEMS:
 - ClaudeCodeTool mixes I/O marshalling + CLI spawning + Claude-specific flags
 - PTY logic is a free function, not injectable/testable
 - Directory functions are global state calls hidden deep in objects
 - CLI entry point is untestable (program.parse() on import)
 - No interfaces — nothing is swappable or mockable
 - Cannot add a new AI tool without copy-pasting ClaudeCodeTool
```

### 4.2 Architecture Diagram: After Refactoring (branch, excluding microkernel wiring)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  agentic-hq-cli.ts (3 lines — thin bootstrap)                               │
│    [wiring code] → createProgram(builder, registry).parse()                  │
└──────────────────┬───────────────────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  createProgram(builder, registry) → Commander program                        │
│  in src/cli/agentic-hq-program.ts                                            │
│                                                                              │
│  - Testable factory function (no parse() side effect)                        │
│  - Receives WorkflowCommandBuilder + WorkflowSkillsRegistry via args         │
│  - Delegates workflow execution: builder.build(skillPath, args).execute()     │
└──────────────────┬───────────────────────────────────────────────────────────┘
                   │ uses
                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  WorkflowCommandBuilder (interface)                                          │
│  build(skillPath, passthroughArgs) → WorkflowCommand                         │
│                                                                              │
│  ClaudeWorkflowCommandBuilder (concrete)                                     │
│    - Uses Tool to resolve skill path → base command string                   │
│    - Shell-escapes passthrough args                                          │
│    - Returns DefaultWorkflowCommand                                          │
└──────────────────┬───────────────────────────────────────────────────────────┘
                   │ uses
                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  WorkflowCommand (interface)                                                 │
│  execute() → Promise<void>                                                   │
│                                                                              │
│  DefaultWorkflowCommand (concrete)                                           │
│    - Holds resolved command string                                           │
│    - Wraps in 'bash -c' → CLICommand                                        │
│    - Delegates to CLIWrapper                                                 │
└──────────────────┬───────────────────────────────────────────────────────────┘
                   │ uses
                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  Tool (interface)                                                            │
│  execute(command, input) → Promise<string>                                   │
│                                                                              │
│  MarshalledCLITool (concrete)                                                │
│    - Orchestrates: create session → write input → build CLI cmd → run → read │
│    - Knows nothing about which AI tool (Claude/Codex/etc)                    │
│    - Injected: sessionFactory, cliWrapper, commandBuilder, workspace         │
└────────┬──────────────────┬──────────────────┬───────────────────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌────────────────┐ ┌────────────────┐ ┌─────────────────────────────────────┐
│ IOMarshallerSe-│ │ CLIWrapper     │ │ MarshalledIOCLICommandBuilder       │
│ ssionFactory   │ │ (interface)    │ │ (interface)                         │
│ (interface)    │ │                │ │                                     │
│ create()→Sess. │ │ PtyCLIWrapper  │ │ ClaudeCommandBuilder (concrete)    │
│                │ │ (concrete,     │ │  - claude executable                │
│ JsonFileIO-    │ │  149 lines)    │ │  - --plugin-dir flags               │
│ MarshallerSe-  │ │  - PTY spawn   │ │  - --allowedTools flag              │
│ ssionFactory   │ │  - signals     │ │  - arg ordering                     │
│ (concrete)     │ │  - raw mode    │ │                                     │
│                │ │  - cleanup     │ │ (Would add CodexCommandBuilder etc  │
│ JsonFileIO-    │ └────────────────┘ │  for other AI tools)                │
│ MarshallerSe-  │                    └─────────────────────────────────────┘
│ ssion          │
│ (per-execution)│
│  - GUID        │
│  - temp dir    │
│  - write/read  │
└────────────────┘

ALSO:

┌──────────────────────────────────────────────────────────────────────────────┐
│  Workspace Objects (created at Composition Root, injected everywhere)         │
│                                                                              │
│  GitWorkspace (interface) → DefaultGitWorkspace                              │
│    - getRoot() → git rev-parse (eager, frozen)                               │
│                                                                              │
│  AgenticHqInstallation (interface) → DefaultAgenticHqInstallation            │
│    - getConfigDir() → root/.agentic-hq                                       │
│    - root from env var or GitWorkspace                                        │
│                                                                              │
│  UserProjectWorkspace (interface) → DefaultUserProjectWorkspace              │
│    - getRoot() → project root                                                │
│    - getTempDir() → root/.agentic-hq/temp                                    │
│                                                                              │
│  ALL: Immutable, Object.freeze(this), created once, injected explicitly      │
│  Replaces: directory-functions.ts free functions with hidden side effects     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  WorkflowSkillsRegistry (class, immutable)                                   │
│    - Holds list of WorkflowSkill objects                                      │
│    - formatSkillList(), resolveSkillPath(), getSkills()                       │
│    - Replaces: module-level array + free function                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Refactoring Files — Complete Inventory

#### Interfaces (all in `src/interfaces/`)

| File | Interface(s) | Purpose |
|------|-------------|---------|
| `src/interfaces/tool.ts` | `Tool` | Contract for AI tool command execution |
| `src/interfaces/cli-wrapper.ts` | `CLIWrapper` | Contract for CLI process lifecycle management |
| `src/interfaces/cli-command.ts` | `CLICommand` | DTO interface for executable + args |
| `src/interfaces/io-marshaller-session.ts` | `IOMarshallerSession`, `IOMarshallerSessionFactory` | Contract for per-execution I/O marshalling |
| `src/interfaces/marshalled-io-cli-command-builder.ts` | `MarshalledIOCLICommandBuilder` | Contract for building CLI commands for marshalled-IO tools |
| `src/interfaces/workflow-command-builder.ts` | `WorkflowCommandBuilder` | Contract for building workflow commands from skill paths |
| `src/interfaces/workflow-command.ts` | `WorkflowCommand` | Contract for a resolved, executable workflow command |
| `src/interfaces/workflow-skill.ts` | `WorkflowSkill` | Type for a registered workflow skill |
| `src/interfaces/agentic-hq-installation.ts` | `AgenticHqInstallation` | Contract for AHQ installation location |
| `src/interfaces/user-project-workspace.ts` | `UserProjectWorkspace` | Contract for the user's project workspace |
| `src/interfaces/git-workspace.ts` | `GitWorkspace` | Contract for git workspace info |
| `src/interfaces/claude-code-tool.ts` | `ClaudeCodeTool` | Type alias for the Claude Code tool |
| `src/interfaces/index.ts` | (barrel) | Re-exports all interfaces |

#### Concrete Implementations

| File | Class | Purpose |
|------|-------|---------|
| **I/O Marshalling** | | |
| `src/io/marshalling/json-file-io-marshaller-session.ts` | `JsonFileIOMarshallerSessionFactory`, `JsonFileIOMarshallerSession` | File-based I/O marshalling. Factory creates sessions. Session generates GUID, creates temp dir, writes/reads JSON files. |
| **CLI/Terminal** | | |
| `src/io/terminal/pty-cli-wrapper.ts` | `PtyCLIWrapper` | PTY process management (extracted from `pty-utils.ts`). Spawns node-pty, handles signals, raw mode, resize, cleanup. |
| `src/io/terminal/default-cli-command.ts` | `DefaultCLICommand` | Simple CLICommand implementation with debug logging. |
| **Tools** | | |
| `src/tools/marshalled-io-tools/marshalled-cli-tool.ts` | `MarshalledCLITool` | Generic tool orchestrator: session → write → build CLI cmd → run → read output. |
| `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` | `ClaudeCommandBuilder` | Claude-specific CLI command builder: executable, plugin dirs, allowed tools flags. |
| `src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.ts` | (exports) | Convenience module for creating a default Claude Code tool. |
| `src/tools/marshalled-io-tools/claude-code/index.ts` | (barrel) | Re-exports Claude code tool module. |
| **Workflow** | | |
| `src/workflow/claude/claude-workflow-command-builder.ts` | `ClaudeWorkflowCommandBuilder` | Builds workflow commands using Claude skills via Tool. Resolves skill path, appends args. |
| `src/workflow/default-workflow-command.ts` | `DefaultWorkflowCommand` | Holds command string, wraps in bash -c, delegates to CLIWrapper. |
| `src/workflow/workflow-skills-registry.ts` | `WorkflowSkillsRegistry` | Immutable registry of available workflow skills. Replaces old module-level array. |
| **Workspace** | | |
| `src/workspace/default-git-workspace.ts` | `DefaultGitWorkspace` | Eager git root detection via `execSync('git rev-parse')`, frozen. |
| `src/workspace/default-agentic-hq-installation.ts` | `DefaultAgenticHqInstallation` | AHQ root from env var or GitWorkspace, computes configDir, frozen. |
| `src/workspace/default-user-project-workspace.ts` | `DefaultUserProjectWorkspace` | Project root from GitWorkspace, computes tempDir, frozen. |
| `src/workspace/not-in-git-workspace-error.ts` | `NotInGitWorkspaceError` | Error class thrown when not in a git repo. |
| **CLI** | | |
| `src/cli/agentic-hq-program.ts` | `createProgram()` | Testable CLI program factory — receives dependencies, returns Commander instance. |
| **Demo** | | |
| `src/demo/demo-skills.ts` | `DEMO_SKILLS` | Array of WorkflowSkill objects (replaces `demo-workflow-skills-registry.ts`). |

#### Tests For Refactoring Components

| File | What It Tests |
|------|---------------|
| `tests/unit/interfaces/cli-wrapper.unit.test.ts` | CLIWrapper interface contract |
| `tests/unit/interfaces/json-file-io-marshaller-session.unit.test.ts` | Session: GUID, temp dir, write, read |
| `tests/unit/interfaces/pty-cli-wrapper.unit.test.ts` | PtyCLIWrapper interface compliance |
| `tests/unit/interfaces/tool.unit.test.ts` | Tool interface contract |
| `tests/unit/tools/marshalled-cli-tool.unit.test.ts` | MarshalledCLITool execute pipeline |
| `tests/unit/tools/claude-code/claude-command-builder.unit.test.ts` | Claude CLI flag building |
| `tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts` | Default tool creation |
| `tests/unit/workflow/claude/claude-workflow-command-builder.unit.test.ts` | Workflow command building via Tool |
| `tests/unit/workflow/default-workflow-command.unit.test.ts` | Command execution via CLIWrapper |
| `tests/unit/workspace/default-agentic-hq-installation.unit.test.ts` | Installation root + configDir |
| `tests/unit/workspace/default-git-workspace.unit.test.ts` | Git root detection |
| `tests/unit/workspace/default-user-project-workspace.unit.test.ts` | Workspace root + tempDir |
| `tests/unit/cli/agentic-hq-program.unit.test.ts` | CLI program with injected deps |
| `tests/unit/claude-code-tool/claude-code-tool-implements-tool-interface.unit.test.ts` | MarshalledCLITool implements Tool |
| `tests/unit/claude-code-tool/claude-code-tool-with-injected-cli-wrapper.unit.test.ts` | Injection of CLIWrapper |
| `tests/unit/claude-code-tool/claude-code-tool-with-injected-config.unit.test.ts` | Injection of command builder config |
| `tests/unit/claude-code-tool/claude-code-tool-with-injected-io-marshaller.unit.test.ts` | Injection of session factory |
| `tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts` | End-to-end with fake CLI |

---

## 5. Files Deleted From Main

These files existed on `main` and were **deleted** on the branch:

| Deleted File | What It Was | Replaced By |
|-------------|-------------|-------------|
| `src/tools/claude-code/ClaudeCodeTool.ts` | ~190 line god-class mixing I/O marshalling + CLI spawning + Claude flags | `MarshalledCLITool` + `ClaudeCommandBuilder` + `JsonFileIOMarshallerSession` |
| `src/utils/cli/pty-utils.ts` | ~120 line free function `runPtyProcess()` | `PtyCLIWrapper` class in `src/io/terminal/` |
| `src/utils/directory/directory-functions.ts` | 5 free functions with hidden `execSync`/`process.env` calls | `DefaultGitWorkspace` + `DefaultAgenticHqInstallation` + `DefaultUserProjectWorkspace` |
| `src/demo/demo-workflow-skills-registry.ts` | Module-level array + `formatSkillList()` free function | `WorkflowSkillsRegistry` class + `DEMO_SKILLS` constant |
| `tests/unit/utils/directory/directory-functions.unit.test.ts` | Tests for directory functions | `tests/unit/workspace/*.unit.test.ts` |

---

## 6. Files Modified From Main

| Modified File | Nature of Change |
|---------------|-----------------|
| `src/cli/agentic-hq-cli.ts` | **Gutted from ~110 lines to 3 lines.** Now: `Microkernel.create()` → `loadWorkflowCommandBuilder()` → `createProgram().parse()` |
| `package.json` | Added `defu` dependency; added `./interfaces` and `./kernel` exports |
| `pnpm-lock.yaml` | Lock file updated for `defu` |
| `.gitignore` | Added `.agentic-hq/microkernel.override.json` |
| `.claude/commands/git/02-git-perform-minor-WIP-commit-on-branch.md` | Minor edit |
| `tests/unit/cli/agentic-hq-cli-list.unit.test.ts` | Updated to use new WorkflowSkillsRegistry |
| `tests/unit/claude-code-tool/fixtures/fake-claude-cli.reverses-a-string-using-files.fixture.ts` | Updated comment reference |
| `tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts` | Updated to use MarshalledCLITool |
| `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` | Updated error message string reference |
| `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts` | Updated to use MarshalledCLITool |
| `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` | Updated error message string reference |
| `tests/integration/claude-code-tool/claude-executes-command-using-file-io.integration.test.ts` | Updated to use MarshalledCLITool |
| `tests/integration/claude-code-tool/real-claude-self-termination-skill.integration.test.ts` | Updated to use MarshalledCLITool |
| `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts` | Updated to use MarshalledCLITool |
| Multiple demo workflow skill plugin package.json files | Updated for new imports |
| Multiple demo workflow skill source files | Updated for new imports |

---

## 7. The Dependency Chain (Current Branch)

```
                          Composition Root
                          (agentic-hq-cli.ts)
                                │
                                ▼
                          Microkernel.create()
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
              GitWorkspace  Installation  Workspace
              (frozen)      (frozen)      (frozen)
                    │           │           │
                    └─────┬─────┘           │
                          ▼                 │
                   loadMicrokernelConfig()  │
                          │                 │
                          ▼                 │
              loadWorkflowCommandBuilder()  │
                     │                      │
          ┌──────────┼──────────────────────┘
          │          │          │
          ▼          ▼          ▼
   SessionFactory  CLIWrapper  [hard-wired internally:]
          │          │          MarshalledCLITool ← Tool
          │          │               │
          │          │               ├── sessionFactory
          │          │               ├── cliWrapper
          │          │               ├── ClaudeCommandBuilder ← MarshalledIOCLICommandBuilder
          │          │               └── workspace
          │          │
          └────┬─────┘
               ▼
     WorkflowCommandBuilder
          (ClaudeWorkflowCommandBuilder)
               │
               ├── tool
               ├── cliWrapper
               └── workspace
               │
               ▼
         createProgram(builder, registry)
```

**Key observation:** `MarshalledCLITool` and `ClaudeCommandBuilder` are **hard-wired** inside `Microkernel.loadWorkflowCommandBuilder()` — they are NOT dynamically loaded. Only `SessionFactory`, `CLIWrapper`, and `WorkflowCommandBuilder` are loaded from config.

---

## 8. What The Three Pluggable Seams Are

The microkernel config (`MicrokernelConfig`) defines three pluggable seams:

| Config Key | Default Factory | What It Creates | Swappable? |
|-----------|----------------|-----------------|------------|
| `ioMarshallerSessionModule` | `io-marshaller-session-factory.ts` | `JsonFileIOMarshallerSessionFactory` | Yes — could be replaced with DB-based, HTTP-based, etc. |
| `cliWrapperModule` | `cli-wrapper-factory.ts` | `PtyCLIWrapper` | Yes — could be replaced with Docker-based, SSH-based, etc. |
| `workflowCommandBuilderModule` | `workflow-command-builder-factory.ts` | `ClaudeWorkflowCommandBuilder` | Yes — could be replaced with config-file-based, REST-based, etc. |

Note: `Tool` and `MarshalledIOCLICommandBuilder` are NOT configurable seams — they are hard-wired in the microkernel. The original design had more seams but it was simplified.

---

## 9. Notes From Refactoring Conversations

The branch evolved through several rounds of refactoring prompted by the human. Key decisions:

1. **SRP Header Comments** — Every class/interface has a TSDoc header stating "what it does", "what it knows about", "what it knows nothing about" (doc `04`).
2. **`ClaudeCodeTool` split** — Into `MarshalledCLITool` (generic) + `ClaudeCommandBuilder` (Claude-specific) (docs `03`, `04`, `07`, `08`).
3. **`IOMarshallerSession` per-execution** — Each `execute()` gets a fresh session with its own GUID. Factory creates sessions. The microkernel passes the factory function, not an instance (docs `05`, `07`).
4. **Directory functions eliminated** — Replaced by `AgenticHqInstallation` + `UserProjectWorkspace` immutable objects injected from Composition Root (doc `09-c`).
5. **`GitWorkspace` injection** — Even the `detectGitRoot()` free function was replaced by an injectable `GitWorkspace` object (doc `09-d`).
6. **`Runtime` concept removed** — The original `Runtime` interface + `DefaultRuntime` were replaced by `WorkflowCommandBuilder` + `WorkflowCommand` which better represent what the system does (commit `b5e65bf`).
7. **Naming improvements** — `CLIRunOptions` → direct params, `CLICommandBuilder` → `MarshalledIOCLICommandBuilder`, `command` → `aiToolCommand` in builder, etc. (doc `09-b`).

### Note on `GitWorkspace` refactoring marker

Several files on the branch contain comments referencing `AHQ-91`:
```typescript
// Refactor: Due to get rid of this class as not needed - see https://agentic-hq.atlassian.net/browse/AHQ-91
```

These appear in:
- `src/interfaces/git-workspace.ts`
- `src/workspace/default-git-workspace.ts`
- `src/workspace/default-agentic-hq-installation.ts`
- `src/workspace/default-user-project-workspace.ts`

This suggests there was a planned future task to simplify the `GitWorkspace` abstraction.

---

## 10. Complete File Tree of Branch Changes

For reference, here is every file that differs from `main`, organized by type:

### Added Files (sorted by directory)

```
.agentic-hq/microkernel.json                                          ← MICROKERNEL
.agentic-hq/plugins/agentic-hq-demos-plugin/commands/DRAFT-*          ← DOCS (unrelated)
.agentic-hq/plugins/agentic-hq-demos-plugin/commands/research-*       ← DOCS (unrelated)
docs/dev/creating-a-plugin.md                                          ← MICROKERNEL
docs/jira-docs/AHQ-83/beads-implementation/*.md                        ← DOCS (planning/history)
docs/jira-docs/AHQ-89/**/*.md                                          ← DOCS (unrelated)
src/cli/agentic-hq-program.ts                                          ← REFACTORING
src/demo/demo-skills.ts                                                ← REFACTORING
src/interfaces/agentic-hq-installation.ts                              ← REFACTORING
src/interfaces/claude-code-tool.ts                                     ← REFACTORING
src/interfaces/cli-command.ts                                          ← REFACTORING
src/interfaces/cli-wrapper.ts                                          ← REFACTORING
src/interfaces/git-workspace.ts                                        ← REFACTORING
src/interfaces/index.ts                                                ← REFACTORING
src/interfaces/io-marshaller-session.ts                                ← REFACTORING
src/interfaces/marshalled-io-cli-command-builder.ts                    ← REFACTORING
src/interfaces/tool.ts                                                 ← REFACTORING
src/interfaces/user-project-workspace.ts                               ← REFACTORING
src/interfaces/workflow-command-builder.ts                             ← REFACTORING
src/interfaces/workflow-command.ts                                     ← REFACTORING
src/interfaces/workflow-skill.ts                                       ← REFACTORING
src/io/marshalling/io-marshaller-session-factory.ts                    ← MICROKERNEL (factory module)
src/io/marshalling/json-file-io-marshaller-session.ts                  ← REFACTORING
src/io/terminal/cli-wrapper-factory.ts                                 ← MICROKERNEL (factory module)
src/io/terminal/default-cli-command.ts                                 ← REFACTORING
src/io/terminal/pty-cli-wrapper.ts                                     ← REFACTORING
src/kernel/demo-plugins/colourful-pty-cli-wrapper-factory.ts           ← MICROKERNEL
src/kernel/demo-plugins/colourful-pty-cli-wrapper.ts                   ← MICROKERNEL
src/kernel/microkernel-config-loader.ts                                ← MICROKERNEL
src/kernel/microkernel-config.ts                                       ← MICROKERNEL
src/kernel/microkernel.ts                                              ← MICROKERNEL
src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts    ← REFACTORING
src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.ts  ← REFACTORING
src/tools/marshalled-io-tools/claude-code/index.ts                     ← REFACTORING
src/tools/marshalled-io-tools/marshalled-cli-tool.ts                   ← REFACTORING
src/workflow/claude/claude-workflow-command-builder.ts                  ← REFACTORING
src/workflow/default-workflow-command.ts                                ← REFACTORING
src/workflow/workflow-command-builder-factory.ts                        ← MICROKERNEL (factory module)
src/workflow/workflow-skills-registry.ts                                ← REFACTORING
src/workspace/default-agentic-hq-installation.ts                       ← REFACTORING
src/workspace/default-git-workspace.ts                                 ← REFACTORING
src/workspace/default-user-project-workspace.ts                        ← REFACTORING
src/workspace/not-in-git-workspace-error.ts                            ← REFACTORING
tests/unit/cli/agentic-hq-program.unit.test.ts                        ← REFACTORING
tests/unit/claude-code-tool/claude-code-tool-implements-tool-interface.unit.test.ts  ← REFACTORING
tests/unit/claude-code-tool/claude-code-tool-with-injected-cli-wrapper.unit.test.ts ← REFACTORING
tests/unit/claude-code-tool/claude-code-tool-with-injected-config.unit.test.ts      ← REFACTORING
tests/unit/claude-code-tool/claude-code-tool-with-injected-io-marshaller.unit.test.ts ← REFACTORING
tests/unit/interfaces/cli-wrapper.unit.test.ts                         ← REFACTORING
tests/unit/interfaces/json-file-io-marshaller-session.unit.test.ts     ← REFACTORING
tests/unit/interfaces/pty-cli-wrapper.unit.test.ts                     ← REFACTORING
tests/unit/interfaces/tool.unit.test.ts                                ← REFACTORING
tests/unit/kernel/demo-plugin-loading.unit.test.ts                     ← MICROKERNEL
tests/unit/kernel/microkernel-config-loader.unit.test.ts               ← MICROKERNEL
tests/unit/kernel/microkernel.unit.test.ts                             ← MICROKERNEL
tests/unit/tools/claude-code/claude-command-builder.unit.test.ts       ← REFACTORING
tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts     ← REFACTORING
tests/unit/tools/marshalled-cli-tool.unit.test.ts                      ← REFACTORING
tests/unit/workflow/claude/claude-workflow-command-builder.unit.test.ts ← REFACTORING
tests/unit/workflow/default-workflow-command.unit.test.ts               ← REFACTORING
tests/unit/workspace/default-agentic-hq-installation.unit.test.ts      ← REFACTORING
tests/unit/workspace/default-git-workspace.unit.test.ts                ← REFACTORING
tests/unit/workspace/default-user-project-workspace.unit.test.ts       ← REFACTORING
```

### Deleted Files

```
src/demo/demo-workflow-skills-registry.ts        ← replaced by WorkflowSkillsRegistry
src/tools/claude-code/ClaudeCodeTool.ts          ← replaced by MarshalledCLITool + ClaudeCommandBuilder
src/utils/cli/pty-utils.ts                       ← replaced by PtyCLIWrapper
src/utils/directory/directory-functions.ts        ← replaced by workspace objects
tests/unit/utils/directory/directory-functions.unit.test.ts  ← replaced by workspace tests
```

---

## 11. Summary For The Next Agent

**Goal:** Remove all microkernel-specific code while keeping the refactored class structure.

**What to remove:**
- The `src/kernel/` directory entirely (microkernel.ts, config-loader, config type, demo-plugins)
- The three factory module files (`io-marshaller-session-factory.ts`, `cli-wrapper-factory.ts`, `workflow-command-builder-factory.ts`)
- The `.agentic-hq/microkernel.json` config file
- The `.gitignore` entry for `microkernel.override.json`
- The `defu` dependency from `package.json`
- The `docs/dev/creating-a-plugin.md` plugin guide
- The `tests/unit/kernel/` directory entirely
- References to `Microkernel` in any barrel exports or package.json exports

**What to rewrite:**
- `src/cli/agentic-hq-cli.ts` — Replace `Microkernel.create()` + `loadWorkflowCommandBuilder()` with direct wiring of concrete classes (see pseudocode in section 3.3)

**What to keep (the refactoring):**
- All interfaces in `src/interfaces/`
- All concrete implementations in `src/io/`, `src/tools/`, `src/workflow/`, `src/workspace/`
- The testable `createProgram()` in `src/cli/agentic-hq-program.ts`
- `WorkflowSkillsRegistry`, `DEMO_SKILLS`
- All unit tests for the above
- The deletion of old files (`ClaudeCodeTool.ts`, `pty-utils.ts`, `directory-functions.ts`, etc.)

**The key architectural change:** Instead of reading module paths from JSON config and dynamically importing them, the CLI entry point will directly instantiate concrete classes and wire them together. The interfaces remain for testability and future extensibility, but the runtime plugin loading goes away.

# Refactored Architecture: After Microkernel Simplification

**Branch:** `refactor/ahq-83-microkernal-plugin-architecture`
**Date:** 2026-03-25

---

## What Changed

The **Microkernel** class (config-driven dynamic module loading) was simplified into a **CompositionRoot** (direct instantiation). The modular class structure, interfaces, SRP headers, and dependency injection were all preserved. Only the config-driven dynamic loading infrastructure was removed.

**Removed:** JSON config files, `defu` deep-merging library, factory wrapper modules (for `await import()`), demo plugins proving plugin swapping, `MicrokernelConfig` types, config loader.

**Added:** `CompositionRoot` class — same wiring as the Microkernel, but with direct `new` calls instead of dynamic imports. Synchronous (no `async create()` needed).

**Simplified:** `DefaultClaudeCodeTool` now delegates to `CompositionRoot` instead of duplicating the wiring internally. Code duplication eliminated.

---

## Diagram 1: Component Dependency Graph

```
     ┌──────────────────────────────────────────────────────────────────────┐
     │  CompositionRoot  (src/kernel/composition-root.ts)                   │
     │                                                                      │
     │  The single place where all default components are created & wired.  │
     │  constructor() creates everything synchronously via direct new calls.│
     │                                                                      │
     │  Exposes: .tool, .cliWrapper, .workspace, .installation              │
     │  Method:  createWorkflowCommandBuilder() → WorkflowCommandBuilder    │
     └──────────────────┬───────────────────────────────────────────────────┘
                        │ creates
                        ▼
     ┌─────────────────────────────────────────────────────────────────────┐
     │                      Workspace Layer                                │
     │                                                                     │
     │  DefaultGitWorkspace ─────────────────────────────┐                 │
     │    implements GitWorkspace                         │                 │
     │    getRoot() → git rev-parse (eager, frozen)       │                 │
     │                                                    │                 │
     │  DefaultAgenticHqInstallation ◄── GitWorkspace     │                 │
     │    implements AgenticHqInstallation                 │                 │
     │    getConfigDir() → root/.agentic-hq               │                 │
     │                                                    │                 │
     │  DefaultUserProjectWorkspace ◄── GitWorkspace      │                 │
     │    implements UserProjectWorkspace                  │                 │
     │    getRoot(), getTempDir()                          │                 │
     └────────────────────────────────────────────────────┘                 │
                        │                                                   │
                        ▼                                                   │
     ┌─────────────────────────────────────────────────────────────────────┐
     │                      Tool Layer                                     │
     │                                                                     │
     │  JsonFileIOMarshallerSessionFactory ◄── UserProjectWorkspace        │
     │    implements IOMarshallerSessionFactory                             │
     │    create() → JsonFileIOMarshallerSession (per-execution, GUID)     │
     │                                                                     │
     │  PtyCLIWrapper (stateless)                                          │
     │    implements CLIWrapper                                             │
     │    run(command, cwd) → spawns PTY, handles signals/resize           │
     │                                                                     │
     │  ClaudeCommandBuilder ◄── AgenticHqInstallation                     │
     │    implements MarshalledIOCLICommandBuilder                          │
     │    build(aiToolCommand, marshallingId) → CLICommand                 │
     │    (claude executable + --plugin-dir + --allowedTools flags)         │
     │                                                                     │
     │  MarshalledCLITool ◄── SessionFactory + CLIWrapper + Builder + WS   │
     │    implements Tool                                                   │
     │    execute(command, input) → session.write → build → run → read     │
     └─────────────────────────────────────────────────────────────────────┘
                        │
                        ▼
     ┌─────────────────────────────────────────────────────────────────────┐
     │                      Workflow Layer                                 │
     │                                                                     │
     │  ClaudeWorkflowCommandBuilder ◄── Tool + CLIWrapper + Workspace     │
     │    implements WorkflowCommandBuilder                                 │
     │    build(skillPath, args) → DefaultWorkflowCommand                  │
     │    (resolves skill → base command → appends args)                   │
     │                                                                     │
     │  DefaultWorkflowCommand ◄── CLIWrapper + command string             │
     │    implements WorkflowCommand                                        │
     │    execute() → wraps in bash -c → delegates to CLIWrapper           │
     │                                                                     │
     │  WorkflowSkillsRegistry (immutable)                                 │
     │    formatSkillList(), resolveSkillPath(), getSkills()                │
     └─────────────────────────────────────────────────────────────────────┘
                        │
                        ▼
     ┌─────────────────────────────────────────────────────────────────────┐
     │                      CLI Layer                                      │
     │                                                                     │
     │  createProgram(builder, registry) → Commander program               │
     │    (src/cli/agentic-hq-program.ts — testable factory)               │
     │    Receives WorkflowCommandBuilder + WorkflowSkillsRegistry         │
     │    Delegates execution: builder.build(skill, args).execute()         │
     └─────────────────────────────────────────────────────────────────────┘
```

---

## Diagram 2: How CompositionRoot Is Used

```
     ┌──────────────────────────────────────────────────┐
     │  CompositionRoot                                  │
     │  src/kernel/composition-root.ts                   │
     │                                                   │
     │  constructor():                                   │
     │    Creates GitWorkspace, Installation,             │
     │    Workspace, SessionFactory, CLIWrapper,          │
     │    MarshalledCLITool — ALL via direct new calls    │
     │                                                   │
     │  Exposes:                                         │
     │    .tool: Tool                                    │
     │    .cliWrapper: CLIWrapper                        │
     │    .workspace: UserProjectWorkspace                │
     │    .installation: AgenticHqInstallation            │
     │                                                   │
     │  createWorkflowCommandBuilder():                  │
     │    → new ClaudeWorkflowCommandBuilder(...)         │
     └──────────────────────────────────────────────────┘
              │                          │
              ▼                          ▼
     DefaultClaudeCodeTool        CLI entry point
     (for demos & tests):         (agentic-hq-cli.ts):

     const root = new             const root = new
       CompositionRoot();           CompositionRoot();
     this.tool = root.tool;       const builder = root
                                    .createWorkflowCommand
     Used by:                       Builder();
     - string-reversal demo       createProgram(builder,
     - math-workflow demo           registry).parse();
     - quick-jira demo
     - full-jira-tdd demo
     - integration tests
```

---

## Plain English Architecture Description

The **Agentic HQ** system is a CLI-based framework for orchestrating agentic software development workflows. At its heart is a **CompositionRoot** that creates and wires together all the system's components in a single place.

When the CLI starts, the **CompositionRoot** creates three **Workspace** objects: a **GitWorkspace** that detects the git repository root, an **AgenticHqInstallation** that knows where the `.agentic-hq` configuration directory lives, and a **UserProjectWorkspace** that provides the project root and temporary file locations. These are all immutable, frozen objects created once and injected everywhere.

The **CompositionRoot** then wires the tool layer. It creates a **JsonFileIOMarshallerSessionFactory** that can produce per-execution **IOMarshallerSessions** — each session gets a unique GUID, creates a temporary directory, and handles writing input files and reading output files for communication with the AI tool. It creates a **PtyCLIWrapper** that manages the lifecycle of PTY (pseudo-terminal) processes — spawning, signal handling, terminal resize, and cleanup. It creates a **ClaudeCommandBuilder** that knows how to construct the specific CLI command for Claude Code, including `--plugin-dir` flags, `--allowedTools`, and argument ordering. These three components are assembled into a **MarshalledCLITool** — a generic **Tool** that orchestrates the execute pipeline: create session, write input, build CLI command, run via PTY, read output.

For the full CLI workflow, the **CompositionRoot** creates a **ClaudeWorkflowCommandBuilder** — a **WorkflowCommandBuilder** that takes a skill path (like `/agentic-hq-demos-plugin:string-reversal`), calls the **Tool** to resolve it into a base command, appends any passthrough arguments, and produces a **WorkflowCommand**. The **WorkflowCommand** wraps the resolved command in `bash -c` and delegates execution to the **CLIWrapper**.

The CLI entry point passes this **WorkflowCommandBuilder** along with a **WorkflowSkillsRegistry** (an immutable registry of available **WorkflowSkills** with their short aliases and full skill paths) to `createProgram()`, which constructs a testable Commander program. The user runs a command like `agentic-hq reversal`, and the program resolves the alias, builds the workflow command, and executes it.

For consumers who just need the AI tool directly (demo plugins, integration tests), the **DefaultClaudeCodeTool** provides a zero-configuration wrapper — it creates a **CompositionRoot** internally and exposes only the `execute(command, input)` method from the **Tool** interface.

---

## Key Design Decisions

1. **CompositionRoot replaces Microkernel** — Same dependency wiring, but synchronous direct instantiation instead of async config-driven dynamic imports. Simpler, faster, easier to understand.

2. **Interfaces preserved** — All interfaces remain for testability (mock injection via constructor) and future extensibility. The system can still be extended by creating new implementations of any interface.

3. **Single wiring point** — Both the CLI entry point and `DefaultClaudeCodeTool` delegate to `CompositionRoot`, eliminating the code duplication that previously existed.

4. **Frozen objects** — All workspace objects and the CompositionRoot itself are frozen after construction, ensuring immutability.

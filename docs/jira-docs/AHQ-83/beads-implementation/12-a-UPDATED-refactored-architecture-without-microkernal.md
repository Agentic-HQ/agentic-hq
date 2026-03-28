# Refactored Architecture: After Microkernel Simplification (UPDATED)

**Branch:** `refactor/ahq-83-microkernal-plugin-architecture`
**Date:** 2026-03-25
**Supersedes:** `10-e-refactored-architecture-without-microkernal.md`

---

## What Changed Since 10-e

The previous version (`10-e`) described `CompositionRoot` as a class with a constructor that eagerly created all components and stored them as readonly fields (`.tool`, `.cliWrapper`, `.workspace`, `.installation`), with a single factory method `createWorkflowCommandBuilder()`.

Further simplification removed all stored state. **CompositionRoot** is now a **stateless wiring class** with no constructor, no fields — just `get*()` factory methods that create freshly-wired components on each call. **DefaultClaudeCodeTool** was similarly simplified from storing a `tool` field to a one-liner that creates a fresh `CompositionRoot` per `execute()` call.

### Summary of changes since 10-e:

1. **Removed `CompositionRootOptions` interface** — Nothing was passing options; the injection point was unused.
2. **Extracted all constructor wiring into private `get*()` methods** — Each method maps one interface to its concrete implementation: `getGitWorkspace()`, `getAgenticHqInstallation()`, `getUserProjectWorkspace()`, `getCLIWrapper()`, `getIOMarshallerSessionFactory()`.
3. **Removed all stored fields** — `tool`, `cliWrapper`, `workspace`, `installation` are no longer stored. Each `get*()` method creates a fresh instance. This is safe because all concrete classes are stateless and frozen.
4. **Removed constructor and `Object.freeze()`** — No state to initialise or freeze.
5. **Renamed methods** — `getDefaultTool()` → `getTool()`, `createWorkflowCommandBuilder()` → `getWorkflowCommandBuilder()`. Consistent `get*` naming throughout.
6. **Simplified DefaultClaudeCodeTool** — From constructor + stored field to a stateless one-liner: `return new CompositionRoot().getTool().execute(command, input)`.

---

## Diagram 1: Component Dependency Graph

```
     ┌──────────────────────────────────────────────────────────────────────┐
     │  CompositionRoot  (src/kernel/composition-root.ts)                   │
     │                                                                      │
     │  Stateless wiring class — no fields, no constructor.                │
     │  Each get*() method returns a freshly-wired component.              │
     │                                                                      │
     │  Public:   getTool() → Tool                                         │
     │            getWorkflowCommandBuilder() → WorkflowCommandBuilder     │
     │                                                                      │
     │  Private:  getGitWorkspace() → GitWorkspace                         │
     │            getAgenticHqInstallation() → AgenticHqInstallation       │
     │            getUserProjectWorkspace() → UserProjectWorkspace          │
     │            getCLIWrapper() → CLIWrapper                             │
     │            getIOMarshallerSessionFactory() → IOMarshallerSsnFactory │
     └──────────────────┬───────────────────────────────────────────────────┘
                        │ creates (via get* calls)
                        ▼
     ┌─────────────────────────────────────────────────────────────────────┐
     │                      Workspace Layer                                │
     │                                                                     │
     │  DefaultGitWorkspace                                                │
     │    implements GitWorkspace                                          │
     │    getRoot() → git rev-parse (eager, frozen)                        │
     │                                                                     │
     │  DefaultAgenticHqInstallation ◄── GitWorkspace                      │
     │    implements AgenticHqInstallation                                  │
     │    getConfigDir() → root/.agentic-hq                                │
     │                                                                     │
     │  DefaultUserProjectWorkspace ◄── GitWorkspace                       │
     │    implements UserProjectWorkspace                                   │
     │    getRoot(), getTempDir()                                           │
     └─────────────────────────────────────────────────────────────────────┘
                        │
                        ▼
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
     │  No fields. No constructor. No state.             │
     │  Pure get*() factory methods only.                │
     │                                                   │
     │  Public methods:                                  │
     │    getTool() → Tool                               │
     │    getWorkflowCommandBuilder()                    │
     │      → WorkflowCommandBuilder                     │
     └──────────────────────────────────────────────────┘
              │                          │
              ▼                          ▼
     DefaultClaudeCodeTool        CLI entry point
     (stateless facade):          (agentic-hq-cli.ts):

     // No fields, no constructor   const root = new
     execute(cmd, input) {            CompositionRoot();
       return new                   const builder = root
         CompositionRoot()            .getWorkflowCommand
         .getTool()                   Builder();
         .execute(cmd, input);      createProgram(builder,
     }                                registry).parse();

     Used by:                      Used by:
     - string-reversal demo        - agentic-hq CLI binary
     - math-workflow demo
     - quick-jira demo
     - full-jira-tdd demo
     - integration tests
```

---

## Plain English Architecture Description

The **Agentic HQ** system is a CLI-based framework for orchestrating agentic software development workflows. At its heart is a **CompositionRoot** — a stateless wiring class that maps each interface to its concrete implementation through `get*()` factory methods.

The **CompositionRoot** has no constructor, no stored fields, and no mutable state. Each `get*()` method creates a freshly-wired component on every call. This is safe because all the concrete classes it instantiates are themselves stateless and frozen after construction.

At the foundation, `getGitWorkspace()` creates a **DefaultGitWorkspace** that eagerly detects the git repository root. Two other workspace methods depend on it: `getAgenticHqInstallation()` creates a **DefaultAgenticHqInstallation** that knows where the `.agentic-hq` configuration directory lives, and `getUserProjectWorkspace()` creates a **DefaultUserProjectWorkspace** that provides the project root and temporary file locations.

The tool layer is wired through `getTool()`. It calls `getIOMarshallerSessionFactory()` to create a **JsonFileIOMarshallerSessionFactory** (which produces per-execution sessions with unique GUIDs for file-based I/O marshalling), `getCLIWrapper()` to create a **PtyCLIWrapper** (which manages PTY process lifecycle — spawning, signals, terminal resize), and directly instantiates a **ClaudeCommandBuilder** (which constructs the Claude Code CLI command with `--plugin-dir` and `--allowedTools` flags). These three plus the workspace are assembled into a **MarshalledCLITool** — a generic **Tool** that orchestrates the execute pipeline: create session, write input, build CLI command, run via PTY, read output.

For the full CLI workflow, `getWorkflowCommandBuilder()` creates a **ClaudeWorkflowCommandBuilder** — a **WorkflowCommandBuilder** that takes a skill path (like `/agentic-hq-demos-plugin:string-reversal`), calls the **Tool** to resolve it into a base command, appends any passthrough arguments, and produces a **WorkflowCommand**. The **WorkflowCommand** wraps the resolved command in `bash -c` and delegates execution to the **CLIWrapper**.

The CLI entry point (`agentic-hq-cli.ts`) creates a **CompositionRoot**, calls `getWorkflowCommandBuilder()`, and passes the result along with a **WorkflowSkillsRegistry** to `createProgram()`, which constructs a testable Commander program.

For consumers who just need the AI tool directly (demo plugins, integration tests), the **DefaultClaudeCodeTool** provides a zero-configuration, stateless facade. It has no constructor and no fields — each `execute()` call creates a fresh **CompositionRoot**, gets the **Tool**, and delegates. One line of code.

---

## Key Design Decisions

1. **Stateless CompositionRoot** — No constructor, no stored fields. Each `get*()` method creates fresh instances. This is safe because all concrete classes are stateless and frozen. It eliminates any questions about object lifecycle, sharing, or mutation.

2. **`get*` naming convention** — Every factory method follows the pattern `get` + interface name: `getGitWorkspace()`, `getTool()`, `getWorkflowCommandBuilder()`. The method name tells you exactly what interface you get back.

3. **Interfaces preserved** — All interfaces remain for testability (mock injection in tests) and future extensibility. The system can be extended by creating new implementations of any interface.

4. **Single wiring point** — Both the CLI entry point and `DefaultClaudeCodeTool` delegate to `CompositionRoot`, eliminating the code duplication that previously existed when both independently created the same chain of objects.

5. **DefaultClaudeCodeTool as stateless facade** — Creates a fresh `CompositionRoot` per `execute()` call. No caching, no stored state. Simple and predictable.

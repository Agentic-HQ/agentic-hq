# DRAFT: OO Refactoring Patterns — Pre-Commit Workflow Plugin

> **Status**: DRAFT — cataloguing the OO refactoring patterns applied during AHQ-83 (21 commits on `refactor/ahq-83-microkernal-plugin-architecture`). The eventual goal is a workflow plugin that enforces these patterns as pre-commit checks.

JIRA for doing Later this workflow: https://agentic-hq.atlassian.net/browse/AHQ-90


---

## 1. What The Plugin Will Do

A pre-commit workflow that checks code against established OO best practices. It runs as a series of checks — one command per check — with each check pausing to discuss its findings with the human before proceeding to the next. If issues are found, the plugin refactors the code to match the established patterns (with human approval).

**Key design principle**: The plugin is *conversational*, not just a linter. Each check explains *why* the pattern matters, shows the specific code that violates it, and proposes a concrete fix. The human decides whether to accept, modify, or skip each refactoring.

---

## 2. Workflow Steps

The plugin would run these checks in order:

1. **Check: Utility/Free Functions** — Scan for free functions that reach into global state (env vars, `process.cwd()`, `execSync`). Propose replacing them with injected value objects.
2. **Check: Options Bags** — Scan for `*Options` interfaces used as constructor parameters. If they have 3 or fewer fields, propose replacing with direct positional parameters.
3. **Check: SRP Header Comments** — Verify every class has a 3-line TSDoc header ("Does / Knows About / Knows Nothing About"). Propose missing headers.
4. **Check: Interface File Placement** — Flag interfaces that are all dumped in a single `interfaces/` barrel directory. Propose co-locating with implementations.
5. **Check: Long Execute Methods** — Flag public `execute()`/`run()` methods longer than ~5 lines. Propose extracting steps into well-named private methods.
6. **Check: Composition Root** — Verify dependency wiring happens at the composition root, not scattered via `new` inside classes. Flag hidden `new` calls. (NOTE: This doesn't mean you have to be passing round hundreds of classes from the composition root - often what happens is objects get created and **hidden** inside other object, which get created and **hidden** inside other objects - just naturally.  Then they get passed along/around)
7. **Check: Immutable Value Objects** — Scan for context/workspace/config objects that are not frozen. Propose adding `Object.freeze(this)` in constructors and `readonly` on interfaces.
8. **Check: Silent Fallbacks** — Flag `try/catch` blocks in config/init code that fall back to defaults. Propose fail-fast (remove the catch).
9. **Check: Naming Clarity** — Flag vague names (`command`, `options`, `data`, `utils`). Propose domain-specific names.
10. **Check: Long Methods** — Flag methods with more than ~10 lines. Propose extracting private helper methods.
11. **Check: Scattered Files** — Flag small utility files that belong with their primary consumer. Propose consolidation.
12. **Check: Tool-Specific Code in Generic Locations** — Flag concrete tool names (e.g., "Claude") in generic orchestration code. Propose generalising.
13. **Check: Singleton vs Session Lifecycle** — Flag stateful objects reused across executions that should be per-session. Propose session-scoped factories.

---

## 3. Catalogue of OO Refactoring Patterns

### 3.1 Eliminate Utility/Free Functions — Inject Objects

**Motivation**: Free functions that shell out to `git rev-parse` or read `process.env` deep inside objects are the *Service Locator anti-pattern*. They create hidden dependencies that are invisible to callers and impossible to control in tests without mocking globals.

**OO Best Practice**: *Composition Root pattern* + *Dependency Injection*. Resolve all environment state *once at startup*, at the edge of the system, and inject it explicitly through the object graph. Perplexity research confirmed this is the standard approach recommended by Fowler, Seemann, and the Hexagonal Architecture literature.

**Example from this refactoring**:

Before — `src/utils/directory/directory-functions.ts` (5 free functions, now deleted):
```typescript
// Called deep inside ClaudeCommandBuilder.build() — SURPRISE! shells out to git
export function getAgenticHqWorkspaceRoot(): string {
  const envValue = process.env.AGENTIC_HQ_WORKSPACE_ROOT;
  if (envValue) return envValue;
  return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
}

// Called deep inside JsonFileIOMarshallerSession — more hidden side effects
export function getAgenticHqTempDir(): string {
  return path.join(getCurrentWorkspaceRoot(), '.agentic-hq/temp');
}
```

After — two injected, immutable value objects created once at startup:
```typescript
// src/interfaces/agentic-hq-installation.ts
interface AgenticHqInstallation {
  readonly root: string;     // e.g. /Users/steve/dev/agentic-hq
  readonly configDir: string; // root/.agentic-hq
}

// src/workspace/default-agentic-hq-installation.ts
class DefaultAgenticHqInstallation implements AgenticHqInstallation {
  readonly root: string;
  readonly configDir: string;

  constructor(root?: string) {
    this.root = root ?? process.env.AGENTIC_HQ_WORKSPACE_ROOT ?? detectGitRoot();
    this.configDir = path.join(this.root, '.agentic-hq');
    Object.freeze(this);
  }
}
```

The `directory-functions.ts` file was deleted entirely. Five consumers now receive `AgenticHqInstallation` or `UserProjectWorkspace` via constructor injection. Tests pass plain objects — no mocking globals, no git, no env vars.

**Relevant Commit URLs**: WIP (uncommitted on branch) — see planning docs `09-c`

---

### 3.2 Remove Options Bags for ≤3 Parameters

**Motivation**: Options bags (`CLIWrapperOptions`, `ClaudeCommandBuilderOptions`, `DefaultRuntimeOptions`) add an extra layer of indirection for no benefit when there are only 2-3 parameters. They hide what a class actually needs, make the constructor harder to read, and create extra types that need maintaining.

**OO Best Practice**: *KISS principle*. For ≤3 parameters, use direct positional constructor parameters. Options bags are only justified for 4+ parameters or when many are optional.

**Example from this refactoring**:

Before — `CLIWrapperOptions` (deleted in commit `f5e0e9f`):
```typescript
// Extra interface that adds indirection without benefit
interface CLIWrapperOptions {
  executable: string;
  args: string[];
  cwd: string;
}

// Used like: cliWrapper.run(options: CLIWrapperOptions)
```

After — direct parameters:
```typescript
// Clear, simple, no extra type needed
cliWrapper.run(cliCommand: CLICommand, currentWorkingDirectory: string)
```

Same pattern applied to `ClaudeCommandBuilder`:
```typescript
// Before: new ClaudeCommandBuilder({ executable: 'claude', extraArgs: [], installation })
// After:  new ClaudeCommandBuilder(installation, 'claude', [])
```

Three separate `*Options` interfaces were removed across commits `e3c771a`, `f5e0e9f`, and `a4511d4`.

**Relevant Commit URLs**:
- [`e3c771a`](https://github.com/Agentic-HQ/agentic-hq/commit/e3c771a) — Simplify ClaudeCommandBuilder: remove options bag and unused fields
- [`f5e0e9f`](https://github.com/Agentic-HQ/agentic-hq/commit/f5e0e9f) — Remove CLIWrapperOptions, use direct parameters
- [`a4511d4`](https://github.com/Agentic-HQ/agentic-hq/commit/a4511d4) — Refactor to positional params and rename writeInput to write

---

### 3.3 Single Responsibility Principle with Header Comments

**Motivation**: Without explicit SRP documentation, responsibilities creep. A class that "does too much" is hard to spot when you can't articulate what it *should* do. The 3-line TSDoc header forces the developer to state the class's responsibility boundary at the point of definition.

**OO Best Practice**: *Single Responsibility Principle* (the S in SOLID). Every class should have one reason to change. The header format — "Does / Knows About / Knows Nothing About" — makes the SRP boundary explicit and reviewable.

**Example from this refactoring**:

Every class got a header like this (from `MarshalledCLITool`):
```typescript
/**
 * MarshalledCLITool — Orchestrates marshalled I/O around a CLI process.
 *
 * SRP Does: The execute() pipeline — create a marshalling session,
 * write input, run CLI, read output.
 *
 * SRP Knows About: The orchestration sequence (uses the injected
 * workspace root as the CLI working directory).
 *
 * SRP Knows Nothing About: Which AI tool is being run (that's the
 * builder's job), how I/O is marshalled (that's the session's job),
 * or how the CLI is spawned and wrapped (that's the CLIWrapper's job).
 */
```

The "Knows Nothing About" section is the most valuable — it catches SRP violations. If a class starts knowing about something it shouldn't, the header becomes a lie, which is a clear signal to refactor.

**Relevant Commit URL**: [`92ef13b`](https://github.com/Agentic-HQ/agentic-hq/commit/92ef13b) — Refactor to session-scoped IO and generic MarshalledCLITool

---

### 3.4 Don't Put All Interfaces in One Directory

**Motivation**: A catch-all `src/interfaces/` barrel directory becomes a dumping ground. Every new interface goes there regardless of domain, creating artificial coupling and making it hard to find what goes with what.

**OO Best Practice**: *Package by feature, not by layer*. Perplexity research confirmed this is an anti-pattern — interfaces should live near their primary implementation or in a shared domain package. Co-location makes dependencies visible.

**Example from this refactoring**:

The project has `src/interfaces/` with files like `agentic-hq-installation.ts`, `user-project-workspace.ts`, `cli-command.ts`, `tool.ts`, `runtime.ts`, etc. While the current refactoring noted this as a known issue, it was preserved for now to keep the refactoring focused. A future refactoring should co-locate interfaces with their domain (e.g., `src/workspace/workspace.ts` rather than `src/interfaces/user-project-workspace.ts`).

This was confirmed as an anti-pattern worth addressing but deliberately deferred to avoid scope creep.

**Relevant Commit URL**: Deferred — no commit yet

---

### 3.5 Readable Execute Methods (4-Line Story)

**Motivation**: The main public method of a class should read like a short story. If you can't understand what `execute()` does in 4-5 seconds, the method is doing too much or naming things poorly. The reader should see the *what*, not the *how*.

**OO Best Practice**: *Composed Method pattern* (Kent Beck). Break a method into steps at a single level of abstraction, where each step is a well-named private method or collaborator call.

**Example from this refactoring**:

Before — `ClaudeCodeTool.execute()` was a long method mixing marshalling, command building, and process execution:
```typescript
// Mixed concerns — hard to see the pipeline at a glance
async execute(command: string, input: string): Promise<string> {
  const session = this.createSession();
  session.writeInput(command, input);
  const args = this.buildArgs(command, session.getId());
  await this.ptyWrapper.run({ executable: 'claude', args, cwd: getProjectWorkingDir() });
  return session.readOutput();
}
```

After — `MarshalledCLITool.execute()` reads as a 4-line story:
```typescript
async execute(command: string, input: string): Promise<string> {
  const aiToolCommand = command;
  const ioMarshallerSession = this.sessionFactory.create();
  ioMarshallerSession.write(input);
  await this.runMarshalledIOCLICommand(aiToolCommand, ioMarshallerSession);
  return ioMarshallerSession.readOutput();
}
```

Each line is one step at the same level of abstraction: create session, write input, run CLI, read output.

**Relevant Commit URL**: [`92ef13b`](https://github.com/Agentic-HQ/agentic-hq/commit/92ef13b) — Refactor to session-scoped IO and generic MarshalledCLITool

---

### 3.7 Immutable Value Objects

**Motivation**: Context objects (installation paths, workspace paths) represent environment state that was resolved at startup. If they're mutable, code could accidentally change them mid-execution, leading to subtle, hard-to-debug inconsistencies. Immutability makes the contract explicit: *these values were determined at startup and will never change*.

**OO Best Practice**: *Value Object pattern* (Evans, DDD). Immutable objects whose identity is defined by their values, not by reference. TypeScript `readonly` provides compile-time safety; `Object.freeze()` adds runtime protection.

**Example from this refactoring**:

```typescript
// Interface — readonly properties, no setters
interface AgenticHqInstallation {
  readonly root: string;
  readonly configDir: string;
}

// Implementation — frozen in constructor
class DefaultAgenticHqInstallation implements AgenticHqInstallation {
  readonly root: string;
  readonly configDir: string;

  constructor(root?: string) {
    this.root = root ?? process.env.AGENTIC_HQ_WORKSPACE_ROOT ?? detectGitRoot();
    this.configDir = path.join(this.root, '.agentic-hq');
    Object.freeze(this);  // Runtime protection — mutation silently fails
  }
}
```

Both `DefaultAgenticHqInstallation` and `DefaultUserProjectWorkspace` follow this pattern: resolve in constructor, freeze, inject everywhere as read-only.

Perplexity confirmed this is recommended by Fowler (constructor initialisation + no setters) and is idiomatic TypeScript (readonly on interface + Object.freeze in implementation).

**Relevant Commit URLs**: WIP (uncommitted on branch) — see `src/workspace/` files

---

### 3.8 Fail Fast, No Silent Fallbacks

**Motivation**: Catching errors in configuration/initialisation and falling back to defaults *masks real failures*. The system appears to work but runs with wrong configuration. This is especially dangerous for things like directory paths — the system operates on the wrong files silently.

**OO Best Practice**: *Fail Fast principle*. Critical initialisation (config loading, directory resolution, module imports) should throw on failure. If config can't load, the program should crash with a clear error, not limp along with invented defaults.

**Example from this refactoring**:

The `loadRuntime()` composition root has *no try/catch*:
```typescript
export async function loadRuntime(options?: LoadRuntimeOptions): Promise<Runtime> {
  // No try/catch — if any of these fail, the error propagates
  const installation = options?.installation ?? new DefaultAgenticHqInstallation();
  const workspace = options?.workspace ?? new DefaultUserProjectWorkspace();
  const cfg = options?.config ?? (await loadMicrokernelConfig(installation));

  const sessionModule = await import(cfg.ioMarshallerSessionModule);  // throws if module not found
  // ... remaining wiring — all unguarded
}
```

If `detectGitRoot()` fails (not in a git repo), if the config file is missing, if a module path is wrong — the error propagates immediately. No fallback to defaults, no "using default config" warnings that get ignored.

**Relevant Commit URL**: [`8e56eb3`](https://github.com/Agentic-HQ/agentic-hq/commit/8e56eb3) — Add DefaultRuntime, microkernel loader, and CLI program factory

---

### 3.9 Rename for Clarity

**Motivation**: Vague names force the reader to read the implementation to understand intent. Domain-specific names encode *what* something is, not just *that* it exists. A rename costs nothing at development time but saves confusion forever.

**OO Best Practice**: *Intention-Revealing Names* (Clean Code, Uncle Bob). Names should describe the domain concept, not the implementation mechanism. A class named `CLICommandBuilder` could build any CLI command — naming it `MarshalledIOCLICommandBuilder` says exactly what kind.

**Examples from this refactoring**:

| Before | After | Why |
|--------|-------|-----|
| `CLICommandBuilder` | `MarshalledIOCLICommandBuilder` | Clarifies it builds commands specifically for marshalled I/O tools |
| `ClaudeCodeTool` | `MarshalledCLITool` | The tool isn't Claude-specific — it orchestrates any marshalled CLI process |
| `command` (parameter) | `aiToolCommand` | Distinguishes the AI tool command (e.g., `/RunJiraWorkflow`) from the CLI command (e.g., `claude --plugin-dir=...`) |
| `IOMarshaller` | `IOMarshallerSession` | Clarifies lifecycle — each execution creates a new session, not a singleton |
| `writeInput(command, input)` | `write(input)` | Session doesn't need the command — it just writes data to a file |
| `CLIWrapperOptions.cwd` | `currentWorkingDirectory` | Abbreviations obscure meaning; spell it out |

Commit `eb576d0`: Renamed `CLICommandBuilder` → `MarshalledIOCLICommandBuilder` across 14 files.

**Relevant Commit URLs**:
- [`eb576d0`](https://github.com/Agentic-HQ/agentic-hq/commit/eb576d0) — Rename CLICommandBuilder to MarshalledIOCLICommandBuilder
- [`92ef13b`](https://github.com/Agentic-HQ/agentic-hq/commit/92ef13b) — Refactor to session-scoped IO and generic MarshalledCLITool

---

### 3.10 Extract Private Methods for Readability

**Motivation**: Long methods mix multiple levels of abstraction. Extracting well-named private methods lets the public method read as a high-level overview, with implementation details pushed down one level.

**OO Best Practice**: *Composed Method pattern* / *Extract Method refactoring* (Fowler). Each private method should operate at a single level of abstraction and have a name that describes *what* it does, not *how*.

**Examples from this refactoring**:

`PtyCLIWrapper.run()` was refactored from one monolithic method into 4 private methods (commit `b55093a`):
```typescript
// Before: one long run() method doing everything inline
// After: run() calls well-named private methods
class PtyCLIWrapper implements CLIWrapper {
  async run(command: CLICommand, currentWorkingDirectory: string): Promise<void> {
    const pty = this.spawnPtyProcess(command, currentWorkingDirectory);
    this.attachOutputHandler(pty);
    await this.waitForExit(pty);
  }

  private spawnPtyProcess(...) { /* spawning logic */ }
  private attachOutputHandler(...) { /* output handling */ }
  private waitForExit(...) { /* exit waiting with timeout */ }
}
```

Similarly, `ClaudeCommandBuilder.build()` extracted `buildArgsList()` as a private method (commit `899e624`), and `getPluginDirFlags()` was made a private instance method that uses `this.installation.configDir` instead of calling a free function.

**Relevant Commit URLs**:
- [`899e624`](https://github.com/Agentic-HQ/agentic-hq/commit/899e624) — Extract buildArgsList private method in ClaudeCommandBuilder
- [`b55093a`](https://github.com/Agentic-HQ/agentic-hq/commit/b55093a) — CLIWrapper takes CLICommand, extract PtyCLIWrapper private methods

---

### 3.11 Consolidate Scattered Files into Cohesive Modules

**Motivation**: Small utility files scattered across the codebase create navigation overhead and obscure the relationship between closely related code. When a helper function is only used by one class, it belongs *with* that class, not in a separate `utils/` directory.

**OO Best Practice**: *High Cohesion* (GRASP principles). Code that changes together should live together. A file that only exists to serve one consumer should be consolidated into that consumer's module.

**Examples from this refactoring**:

1. **`src/utils/cli/pty-utils.ts` → merged into `src/io/terminal/pty-cli-wrapper.ts`** (commit `54ce50d`): The pty utility functions were only used by `PtyCLIWrapper`, so they were absorbed into it as private methods.

2. **`src/tools/claude-code/` → `src/tools/marshalled-io-tools/claude-code/`** (commit `8183443`): The Claude-specific command builder was moved into the `marshalled-io-tools` directory alongside `MarshalledCLITool`, making the relationship between the generic orchestrator and its concrete command builder visible in the file tree.

3. **`src/tools/default-cli-command.ts` → `src/io/terminal/default-cli-command.ts`** (commit `e264a70`): `DefaultCLICommand` is an I/O terminal concept — it represents a command to be run in a terminal. It was moved from `tools/` to `io/terminal/` where it belongs with `PtyCLIWrapper`.

**Relevant Commit URLs**:
- [`54ce50d`](https://github.com/Agentic-HQ/agentic-hq/commit/54ce50d) — Consolidate pty-utils into pty-cli-wrapper and clean up interfaces
- [`8183443`](https://github.com/Agentic-HQ/agentic-hq/commit/8183443) — Move marshalled I/O tool files into src/tools/marshalled-io-tools/
- [`e264a70`](https://github.com/Agentic-HQ/agentic-hq/commit/e264a70) — Move DefaultCLICommand to src/io/terminal/

---

### 3.12 Generalise Tool-Specific Code

**Motivation**: Code named after a specific tool (e.g., `ClaudeCodeTool`) can't be reused for other tools without renaming. If the orchestration logic is the same regardless of which AI tool is being invoked, the code should be generic.

**OO Best Practice**: *Open/Closed Principle* (the O in SOLID). The orchestration is open for extension (new command builders for different AI tools) but closed for modification (the orchestration pipeline itself doesn't change).

**Example from this refactoring**:

Before — `ClaudeCodeTool` (163 lines, deleted):
```typescript
// Tool-specific name, but the orchestration is generic
export class ClaudeCodeTool implements Tool {
  // Hardcoded Claude-specific knowledge mixed with generic orchestration
  async execute(command: string, input: string): Promise<string> {
    // marshalling + command building + CLI execution all in one class
  }
}
```

After — `MarshalledCLITool` (51 lines) + `ClaudeCommandBuilder` (89 lines):
```typescript
// Generic orchestrator — knows nothing about Claude specifically
export class MarshalledCLITool implements Tool {
  constructor(
    private readonly sessionFactory: IOMarshallerSessionFactory,
    private readonly cliWrapper: CLIWrapper,
    private readonly marshalledIOCLICommandBuilder: MarshalledIOCLICommandBuilder,  // injected
    private readonly workspace: UserProjectWorkspace
  ) {}
}

// Claude-specific knowledge isolated in its own class
export class ClaudeCommandBuilder implements MarshalledIOCLICommandBuilder {
  // Only knows about Claude's CLI flags, plugin dirs, allowed tools
}
```

To support a different AI tool (e.g., Cursor, Copilot), you'd write a new `CommandBuilder` — the `MarshalledCLITool` orchestrator stays unchanged.

**Relevant Commit URL**: [`92ef13b`](https://github.com/Agentic-HQ/agentic-hq/commit/92ef13b) — Refactor to session-scoped IO and generic MarshalledCLITool

---

### 3.13 Session-Scoped Lifecycle

**Motivation**: A singleton `IOMarshaller` that's reused across executions either needs complex state management (resetting between uses) or risks stale state bleeding between executions. Each execution should get its own fresh session with its own temp files.

**OO Best Practice**: *Factory pattern* for per-use lifecycle. Instead of injecting a singleton, inject a factory. Each call to `factory.create()` produces a fresh, independent session. The factory is the long-lived object; the session is short-lived.

**Example from this refactoring**:

Before — `IOMarshaller` as a singleton (commit `92ef13b` removed this):
```typescript
// Singleton — shared across executions, requires careful state management
interface IOMarshaller {
  writeInput(command: string, input: string): string;
  readOutput(marshallingId: string): string;
}

// Each call mutates/reads shared state
const marshaller = new JsonFileIOMarshaller();
marshaller.writeInput(command, input);  // where does this write? depends on internal state
```

After — `IOMarshallerSession` created per execution via factory:
```typescript
// Factory — long-lived, creates fresh sessions
interface IOMarshallerSessionFactory {
  create(): IOMarshallerSession;
}

// Session — short-lived, scoped to one execution
interface IOMarshallerSession {
  write(input: string): void;
  readOutput(): string;
  getMarshallingId(): string;
}

// Usage in MarshalledCLITool.execute():
const session = this.sessionFactory.create();  // fresh session with unique GUID
session.write(input);                          // writes to session-specific temp dir
await this.runCLI(session);
return session.readOutput();                   // reads from same session-specific dir
```

Each session generates a unique directory path (`{tempDir}/command-input-output-files/io-files-{timestamp}_{uuid}`), ensuring no cross-execution contamination. The factory is injected once; sessions are created as needed.

**Relevant Commit URLs**:
- [`92ef13b`](https://github.com/Agentic-HQ/agentic-hq/commit/92ef13b) — Refactor to session-scoped IO and generic MarshalledCLITool
- [`fd27d24`](https://github.com/Agentic-HQ/agentic-hq/commit/fd27d24) — Replace session factory function with IOMarshallerSessionFactory interface

---

## Summary Table

| # | Pattern | SOLID/OO Principle | Commit URLs |
|---|---------|-------------------|-------------|
| 1 | Eliminate Free Functions → Inject Objects | Composition Root, DI | WIP (uncommitted) |
| 2 | Remove Options Bags (≤3 params) | KISS | [`e3c771a`](https://github.com/Agentic-HQ/agentic-hq/commit/e3c771a), [`f5e0e9f`](https://github.com/Agentic-HQ/agentic-hq/commit/f5e0e9f), [`a4511d4`](https://github.com/Agentic-HQ/agentic-hq/commit/a4511d4) |
| 3 | SRP Header Comments | Single Responsibility (S) | [`92ef13b`](https://github.com/Agentic-HQ/agentic-hq/commit/92ef13b) |
| 4 | Don't Barrel Interfaces | Package by Feature | Deferred |
| 5 | Readable Execute Methods (4-line story) | Composed Method | [`92ef13b`](https://github.com/Agentic-HQ/agentic-hq/commit/92ef13b) |
| 6 | Composition Root / Explicit DI | Composition Root, DI | [`8e56eb3`](https://github.com/Agentic-HQ/agentic-hq/commit/8e56eb3), [`92ef13b`](https://github.com/Agentic-HQ/agentic-hq/commit/92ef13b) |
| 7 | Immutable Value Objects | Value Object (DDD) | WIP (uncommitted) |
| 8 | Fail Fast, No Silent Fallbacks | Fail Fast | [`8e56eb3`](https://github.com/Agentic-HQ/agentic-hq/commit/8e56eb3) |
| 9 | Rename for Clarity | Intention-Revealing Names | [`eb576d0`](https://github.com/Agentic-HQ/agentic-hq/commit/eb576d0), [`92ef13b`](https://github.com/Agentic-HQ/agentic-hq/commit/92ef13b) |
| 10 | Extract Private Methods | Extract Method, Composed Method | [`899e624`](https://github.com/Agentic-HQ/agentic-hq/commit/899e624), [`b55093a`](https://github.com/Agentic-HQ/agentic-hq/commit/b55093a) |
| 11 | Consolidate Scattered Files | High Cohesion (GRASP) | [`54ce50d`](https://github.com/Agentic-HQ/agentic-hq/commit/54ce50d), [`8183443`](https://github.com/Agentic-HQ/agentic-hq/commit/8183443), [`e264a70`](https://github.com/Agentic-HQ/agentic-hq/commit/e264a70) |
| 12 | Generalise Tool-Specific Code | Open/Closed (O) | [`92ef13b`](https://github.com/Agentic-HQ/agentic-hq/commit/92ef13b) |
| 13 | Session-Scoped Lifecycle | Factory pattern | [`92ef13b`](https://github.com/Agentic-HQ/agentic-hq/commit/92ef13b), [`fd27d24`](https://github.com/Agentic-HQ/agentic-hq/commit/fd27d24) |

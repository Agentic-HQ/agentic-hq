# AHQ-96: Report on Current Status and Refactoring Potential

**Jira:** https://agentic-hq.atlassian.net/browse/AHQ-96
**Status:** Backlog
**Context:** AHQ-91 (workspace abstraction unification) has just landed (commit `ec5c00c`). The header comment on `DefaultClaudeCodeTool` predicted that AHQ-91 would simplify `CompositionRoot` and make AHQ-96 easier to tackle — so now is the right time to look.

> **✅ Decision:** Option C is **APPROVED** by Steve (2026-04-19). Implementation proceeds per Section 4 ("Suggested scope"). The Jira description has been updated to reflect the approved plan — see `/tmp/AHQ-96-new-Jira-Description.md`.

---

## 1. Current Code

### 1.1 `DefaultClaudeCodeTool`

File: `src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.ts` (29 lines, 1 line of actual behaviour)

```ts
export class DefaultClaudeCodeTool implements ClaudeCodeTool {
  async execute(command: string, input: string): Promise<string> {
    return new CompositionRoot().getTool().execute(command, input);
  }
}
```

That is the entire class. It creates a fresh `CompositionRoot` on every `execute()` call and immediately delegates.

### 1.2 `CompositionRoot`

File: `src/kernel/composition-root.ts` (62 lines)

```ts
export class CompositionRoot {
  private getAhqWorkspace(): Workspace { return new AhqWorkspaceImpl(); }
  private getCurrentUserWorkspace(): Workspace { return new CurrentUserWorkspaceImpl(); }
  private getCLIWrapper(): CLIWrapper { return new PtyCLIWrapper(); }
  private getIOMarshallerSessionFactory(): IOMarshallerSessionFactory {
    return new JsonFileIOMarshallerSessionFactory(this.getCurrentUserWorkspace());
  }

  getTool(): Tool {
    return new MarshalledCLITool(
      this.getIOMarshallerSessionFactory(),
      this.getCLIWrapper(),
      new ClaudeCommandBuilder(this.getAhqWorkspace(), this.getCurrentUserWorkspace()),
      this.getCurrentUserWorkspace()
    );
  }

  getWorkflowCommandBuilder(): WorkflowCommandBuilder {
    return new ClaudeWorkflowCommandBuilder(
      this.getTool(),
      this.getCLIWrapper(),
      this.getCurrentUserWorkspace()
    );
  }
}
```

Post AHQ-91 this is mercifully small. Notes:
- The four `get*` building-block methods are **private**.
- `getTool()` is the only public tool-assembly method.
- The only **Claude-specific** piece inside `getTool()` is `ClaudeCommandBuilder`. Everything else (`MarshalledCLITool`, `PtyCLIWrapper`, `JsonFileIOMarshallerSessionFactory`, `CurrentUserWorkspaceImpl`) is generic infrastructure.

### 1.3 `ClaudeCodeTool` interface

File: `src/interfaces/claude-code-tool.ts` (10 lines)

```ts
export interface ClaudeCodeTool extends Tool {}
```

Empty marker extension of `Tool`. The "Claude-ness" carries no extra API.

### 1.4 `MarshalledCLITool` (the thing `getTool()` actually returns)

File: `src/tools/marshalled-io-tools/marshalled-cli-tool.ts`

Generic orchestrator: `(sessionFactory, cliWrapper, commandBuilder, workspace)`. It has no knowledge of Claude. The Claude-ness is supplied purely by which `MarshalledIOCLICommandBuilder` is passed in.

### 1.5 Callers

`new DefaultClaudeCodeTool()` is instantiated in **11 places**:

| Category | Count | Files |
|---|---|---|
| Skill ts-workflow CLIs (`.agentic-hq/plugins/...`) | 5 | `create-workflow`, `string-reversal` (demo), `math-workflow`, `full-jira-tdd-story-workflow`, `quick-jira-workflow` |
| Integration tests | 3 | `real-claude-self-termination-skill`, `claude-executes-command-using-file-io`, `custom-commands-create-and-get-status-of-test-jira` |
| E2E test | 1 | `cross-workspace-quick-jira-workflow-produces-expected-files` |
| Unit test | 1 | `default-claude-code-tool.unit.test.ts` |
| E2E fixture | 1 | `string-reversal-copy-for-test` |

All callers use the zero-arg form `new DefaultClaudeCodeTool()`.

`new CompositionRoot()` is instantiated in **2 places**: the CLI entry point (`src/cli/agentic-hq-cli.ts`) and inside `DefaultClaudeCodeTool`. The entry point only calls `getWorkflowCommandBuilder()`.

`CompositionRoot.getTool()` is called in **3 places**: from `DefaultClaudeCodeTool`, from `CompositionRoot.getWorkflowCommandBuilder()` internally, and from the unit test for `DefaultClaudeCodeTool`.

---

## 2. Problems / Smells

### 2.1 `DefaultClaudeCodeTool` does nothing and knows nothing about Claude

The class name promises "the default Claude-code tool wiring." The body contains zero Claude-specific code — just delegation. The Claude-specific wiring actually lives in `CompositionRoot.getTool()`. The name lies about where the responsibility is.

### 2.2 `CompositionRoot.getTool()` is secretly "`getClaudeTool()`"

`CompositionRoot` presents `getTool()` as a generic factory method, but it is hard-wired to return `MarshalledCLITool(ClaudeCommandBuilder, ...)`. If a second backend ever appeared (GPT, Gemini, a fake for tests), `getTool()` cannot return it polymorphically — the method name pretends to be generic while the body is specialised. Backend-specific wiring has leaked into the kernel's root composition class.

### 2.3 Per-call `CompositionRoot` construction

`DefaultClaudeCodeTool.execute()` builds a fresh `CompositionRoot`, workspaces, session factory, and CLI wrapper on **every** call. This is not a performance problem (`CompositionRoot` is stateless and cheap) but it is noise that exists only because the facade does nothing else; if the facade actually wired its own tool and held it, the call-site could also hold that facade.

### 2.4 `ClaudeCodeTool` interface is an empty marker — and actively harmful

`ClaudeCodeTool extends Tool {}` adds no methods. Verified empirically:

- **Zero** callsites in current production code use `ClaudeCodeTool` as a type annotation (`: ClaudeCodeTool`, `<ClaudeCodeTool>`, etc.). All matches outside the old `spike-00-fail-fast-minimal-whole-system` tree are documentation prose or the interface file itself.
- The only `implements ClaudeCodeTool` is on `DefaultClaudeCodeTool`.
- All 11 `new DefaultClaudeCodeTool()` callsites write `const tool = new DefaultClaudeCodeTool()` and let TypeScript infer; none declare the variable as `: ClaudeCodeTool`.

So the interface currently earns nothing and costs something: if a future `DefaultCodexTool` is introduced, it cannot plausibly `implements ClaudeCodeTool` — the name is wrong. Either callsite types churn (if anyone *had* used the type), or the interface has to be renamed/deleted. Typing everywhere at `Tool` avoids this entirely.

TypeScript lint (`@typescript-eslint/no-empty-interface`) typically flags this pattern for exactly this reason.

**This interface should be deleted as part of this refactor** — see Section 4.

### 2.5 Private methods the refactor wants to reuse

The Jira description suggests passing a `CompositionRoot` into `DefaultClaudeCodeTool` and calling `getIOMarshallerSessionFactory()` and `getCLIWrapper()` on it. Those methods are currently `private`. Either they become public, or the design goes another way. Not a blocker, but a design choice that should be made deliberately.

### 2.6 Prior thinking pointed the other way

Under `docs/jira-docs/AHQ-83/beads-implementation/11-a-next-refactor-idea.md` there is an earlier proposal to **delete `DefaultClaudeCodeTool` entirely** and have callers use `new CompositionRoot().tool` directly. AHQ-96 as written goes the opposite direction (give `DefaultClaudeCodeTool` real responsibility). Worth deciding which direction is correct, rather than doing both over time.

---

## 3. Refactoring Options

### Option A — As written in the Jira: pass a `CompositionRoot` to `DefaultClaudeCodeTool`

`DefaultClaudeCodeTool` takes a `CompositionRoot`, assembles its own `MarshalledCLITool` from the root's building blocks, and delegates. `CompositionRoot.getTool()` is deleted.

- ✅ `DefaultClaudeCodeTool` finally earns its name — it is the home of Claude-specific wiring.
- ✅ `CompositionRoot` no longer holds backend-specific assembly logic; it exposes generic building blocks only.
- ⚠️ Requires making the four `CompositionRoot` building-block methods public.
- ⚠️ 11 callers need updating (or a default-arg constructor can preserve the zero-arg form — see Option C).

### Option B — Delete `DefaultClaudeCodeTool` entirely

Rename `CompositionRoot` (e.g. `AgenticHqSystem`) and have callers use `new AgenticHqSystem().tool` directly. Proposed in `AHQ-83/11-a-next-refactor-idea.md`.

- ✅ Removes a pass-through class and one level of indirection.
- ⚠️ 11 callers change (including skill ts-workflow CLIs).
- ⚠️ Skill plugins now import from the kernel module. Couples user-facing skill code to an internal concept name.
- ⚠️ Moves in the *opposite* direction from AHQ-96 as written.

### Option C — `DefaultClaudeCodeTool` subclasses `MarshalledCLITool` *(recommended)*

`DefaultClaudeCodeTool` stops being a delegator and becomes a **pre-configured subclass** of `MarshalledCLITool` — a `MarshalledCLITool` that happens to be wired for Claude. Its only job is to supply the right arguments to `super(...)`.

```ts
export class DefaultClaudeCodeTool extends MarshalledCLITool {
  constructor(root: CompositionRoot = new CompositionRoot()) {
    super(
      root.getIOMarshallerSessionFactory(),
      root.getCLIWrapper(),
      new ClaudeCommandBuilder(root.getAhqWorkspace(), root.getCurrentUserWorkspace()),
      root.getCurrentUserWorkspace()
    );
  }
}
```

That is the entire class. No `execute()` method (inherited from parent). No `Tool` field. No delegation. No `implements Tool` declaration needed — it's a `Tool` via inheritance.

And in `CompositionRoot`:

- Make the four building-block methods (`getAhqWorkspace`, `getCurrentUserWorkspace`, `getCLIWrapper`, `getIOMarshallerSessionFactory`) `public`.
- Delete `getTool()` — its assembly logic has moved into `DefaultClaudeCodeTool`'s `super(...)` call.
- `getWorkflowCommandBuilder()`: replace its internal `this.getTool()` with `new DefaultClaudeCodeTool(this)`. Since `DefaultClaudeCodeTool extends MarshalledCLITool` and `MarshalledCLITool implements Tool`, it is directly assignable to `ClaudeWorkflowCommandBuilder`'s `Tool` parameter.
- Delete `src/interfaces/claude-code-tool.ts` and remove its re-export from `src/interfaces/index.ts` (per Section 2.4). `DefaultClaudeCodeTool` no longer implements the marker — it inherits from `MarshalledCLITool`.

**Properties:**

- ✅ All 11 existing `new DefaultClaudeCodeTool()` callsites keep working unchanged — the constructor is still zero-arg.
- ✅ No delegator boilerplate. No `execute()` forwarding method. No `Tool` field on a class whose entire purpose is to be a `Tool`.
- ✅ Claude-specific wiring ends up exactly where the Jira wants it, in one `super(...)` call.
- ✅ `CompositionRoot` becomes purely generic infrastructure — all four public methods are backend-agnostic building blocks; no method's return type or body mentions Claude.
- ✅ Test injection remains easy — `new DefaultClaudeCodeTool(fakeCompositionRoot)` swaps in fake workspaces, CLI wrapper, or session factory.
- ✅ "Cache the assembled tool?" question disappears — there is nothing separate to cache; the object *is* the tool.
- ℹ️ Uses inheritance for configuration. This is legitimate use of inheritance — the is-a relationship is real (`DefaultClaudeCodeTool` IS-A `MarshalledCLITool`, specifically one pre-wired for Claude) — and it is an idiomatic pattern (compare to `Error` subclasses that set a name/code in their constructor). Not a composition-vs-inheritance smell.

### Option D — Do nothing yet

Post-AHQ-91 the code is small and correct. The pain level is cosmetic. If there is higher-priority work, this can wait.

- ✅ Zero risk.
- ⚠️ Keeps the misleading names and empty facade. Delays the point at which the kernel stops knowing about Claude specifically.

---

## 4. Recommendation

**Option C** — make `DefaultClaudeCodeTool` a subclass of `MarshalledCLITool`, pre-configured for Claude via its `super(...)` call. Default-argument constructor preserves zero-config use.

Why:

1. **Simplest possible expression of what this class actually is.** It is a `MarshalledCLITool` pre-wired for Claude — nothing more. Inheritance captures that exactly: no delegator boilerplate, no `Tool` field, no `execute()` forwarding method, no `implements Tool` declaration. After the refactor the class is 8 lines (one `super(...)` call), and every one of those lines pulls its weight.
2. **Puts responsibility where the name says it lives.** `DefaultClaudeCodeTool` becomes the actual home of Claude wiring. The class name stops lying.
3. **Removes backend-specific assembly from the kernel.** `CompositionRoot` becomes purely generic infrastructure — no method's return type or body mentions Claude. `getTool()` — the leaky backend-specific method — disappears.
4. **Also deletes the empty `ClaudeCodeTool` marker interface.** Per Section 2.4 it earns nothing in the current codebase (no callsite uses it as a type) and would actively block a future `DefaultCodexTool` (which could not sensibly `implements ClaudeCodeTool`). After this refactor, swapping in a second backend is a matter of adding one class (`DefaultCodexTool extends MarshalledCLITool`) and changing construction calls — no type-surgery.
5. **Small, mechanical blast radius.** Default-arg constructor means no callsite churn at the 11 `new DefaultClaudeCodeTool()` sites. The actual edits are confined to three files (`default-claude-code-tool.ts`, `composition-root.ts`, delete `interfaces/claude-code-tool.ts` and its re-export) plus the unit tests for the first two.
6. **Rejects Option B.** Deleting `DefaultClaudeCodeTool` makes skill plugins import from `kernel/`, which is the wrong direction — we want skill plugins to depend on a user-facing "this is the Claude tool" abstraction, not on a kernel concept.

### Suggested scope (single Jira)

- Edit `CompositionRoot`:
  - Make `getAhqWorkspace`, `getCurrentUserWorkspace`, `getCLIWrapper`, `getIOMarshallerSessionFactory` public.
  - Delete `getTool()`.
  - Change `getWorkflowCommandBuilder()` to replace its internal `this.getTool()` with `new DefaultClaudeCodeTool(this)`.
- Edit `DefaultClaudeCodeTool`:
  - Change from `implements ClaudeCodeTool` to `extends MarshalledCLITool`.
  - Replace the body with a single constructor that accepts an optional `CompositionRoot` (default `new CompositionRoot()`) and calls `super(...)` with the four wired components.
  - Delete the `execute()` method (inherited from `MarshalledCLITool`).
- Delete the empty marker interface:
  - Delete `src/interfaces/claude-code-tool.ts`.
  - Remove the re-export from `src/interfaces/index.ts`.
- **Update SRP TSDoc headers on every touched class/interface.** The project uses a structured "SRP Does / SRP Knows About / SRP Knows Nothing About" format in file headers — every header for a class/interface whose responsibility or wiring changes must be accurate after the refactor:
  - `DefaultClaudeCodeTool`: rewrite from scratch. Current header describes a delegator to `CompositionRoot` and contains obsolete `REFACTOR:` notes predicting AHQ-91/AHQ-96 — both are now done. New header should describe it as a `MarshalledCLITool` pre-wired for Claude.
  - `CompositionRoot`: update. Current header says it "maps interfaces to concrete implementations." Post-refactor it only exposes generic infrastructure building blocks; backend-specific assembly is gone. Narrow the description accordingly.
  - `MarshalledCLITool`: review — no behaviour change, but confirm the existing "Knows About / Knows Nothing About" bullets remain accurate given that subclassing now wires it up.
  - Any other edited class/interface (including ones only touched for the re-export removal) — check and update as needed.
- Update unit tests for `DefaultClaudeCodeTool` and `CompositionRoot`. Integration/E2E tests should require zero changes.
- Run `pnpm validate` in the project root.

### Not in scope

- Converting `CompositionRoot`'s instance methods to `static`. Although the class is already stateless and the conversion would be trivial, it loses the cheap DI pattern (`new DefaultClaudeCodeTool(fakeRoot)`) that unit tests rely on. Separable change, separate Jira if desired later.
- Renaming `CompositionRoot`.
- Any second AI backend.

---

## 5. Open Questions for the Human

1. **Option C vs Option B.** Option B (delete `DefaultClaudeCodeTool`) was prior thinking in `AHQ-83/11-a-next-refactor-idea.md`. This report recommends the opposite. Is Option C the right call, or should we revisit Option B?
2. **Public-ising all four building-block methods on `CompositionRoot`.** Is that acceptable, or should `DefaultClaudeCodeTool` instead take the three concrete dependencies directly (narrower surface, more constructor params)?
3. **Inheritance vs composition for `DefaultClaudeCodeTool`.** The recommendation uses `extends MarshalledCLITool`. The inheritance is legitimate (the is-a relationship is real) and produces the smallest possible class, but it does couple `DefaultClaudeCodeTool` to the concrete `MarshalledCLITool` rather than the `Tool` interface. Acceptable?

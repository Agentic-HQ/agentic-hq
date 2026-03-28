# Plan: Simplify Microkernel → Composition Root (AHQ-83)

## Context

AHQ-83 branch has a **Microkernel** class that does two things:
1. **Composition Root** (KEEP) — Creates workspace objects, wires the dependency chain, produces a ready-to-use `WorkflowCommandBuilder`
2. **Config-driven dynamic loading** (REMOVE) — Reads JSON config files, dynamically imports factory modules via `await import()`, supports override configs

The Microkernel's modular wiring structure is good. The config-driven dynamic loading is unnecessary complexity. We simplify the Microkernel into a plain **Composition Root** — same wiring, but with direct `new` calls instead of dynamic imports.

This also eliminates the wiring duplication between `Microkernel` and `DefaultClaudeCodeTool`, which both create the same workspace → sessionFactory → cliWrapper → MarshalledCLITool chain independently.

### Dependency Chain Diagram

```
                    ┌─ DefaultGitWorkspace ─┐
                    │                       │
          DefaultAgenticHq          DefaultUserProject
          Installation              Workspace
                │                       │
        ClaudeCommand           JsonFileIOMarshaller
        Builder                 SessionFactory
                │                       │
                └───────┬───────────────┘
                        │
    PtyCLIWrapper ──── MarshalledCLITool ◄── DefaultClaudeCodeTool wraps THIS
    (= CLIWrapper)      (= Tool)              (used by 4 demo plugins + tests)
                        │
                        │  ← CLI entry point needs MORE:
                        ▼
          ClaudeWorkflowCommandBuilder ◄── needs tool + cliWrapper + workspace
                        │
                        ▼
               createProgram(builder, registry)
```

**The problem:** Both `DefaultClaudeCodeTool` and the CLI entry point (`Microkernel`) independently create everything from `DefaultGitWorkspace` down to `MarshalledCLITool`. Code duplication.

### Solution: Single Composition Root

```
     ┌──────────────────────────────────────────────────┐
     │  CompositionRoot (simplified Microkernel)         │
     │  File: src/kernel/composition-root.ts             │
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
     │                                                   │
     │  createWorkflowCommandBuilder():                  │
     │    → new ClaudeWorkflowCommandBuilder(...)         │
     └──────────────────────────────────────────────────┘
              │                          │
              ▼                          ▼
     DefaultClaudeCodeTool        CLI entry point
     (for demos/tests):           (for the program):

     const root = new             const root = new
       CompositionRoot();           CompositionRoot();
     this.tool = root.tool;       const builder = root
                                    .createWorkflowCommand
                                    Builder();
                                  createProgram(builder,
                                    registry).parse();
```

**Current state:** `pnpm validate` passes. `pnpm demo:plugin-direct:string-reversal` works.

---

## Step 0: Add UPDATE to 10-c and Copy Plan to 10-d

- Append an UPDATE section to `docs/jira-docs/AHQ-83/beads-implementation/10-c-prompt-to-read-2-previous-files-and-any-other-critical-files-and-plan-microkernal-removal.md` explaining the refined approach (simplify, don't delete) with both diagrams
- Copy the approved plan to `docs/jira-docs/AHQ-83/beads-implementation/10-d-copy-of-plan-for-removal.md`

---

## Step 1: Create `CompositionRoot` (Simplified Microkernel)

**Create:** `src/kernel/composition-root.ts`

Replace the Microkernel's async config-driven approach with a synchronous direct-wiring constructor:

```typescript
/**
 * CompositionRoot — the single place where all default components are created and wired.
 *
 * SRP Does: Create workspace objects, I/O marshalling, CLI wrapper, and tool;
 * wire them together via constructor injection.
 *
 * SRP Knows About: Which concrete classes to instantiate for the default system.
 *
 * SRP Knows Nothing About: How any individual component works internally.
 */
export class CompositionRoot {
  readonly tool: Tool;
  readonly cliWrapper: CLIWrapper;
  readonly workspace: UserProjectWorkspace;
  readonly installation: AgenticHqInstallation;

  constructor(options?: { installation?: AgenticHqInstallation; workspace?: UserProjectWorkspace }) {
    const gitWorkspace = new DefaultGitWorkspace();
    this.installation = options?.installation ?? new DefaultAgenticHqInstallation(gitWorkspace);
    this.workspace = options?.workspace ?? new DefaultUserProjectWorkspace(gitWorkspace);
    const sessionFactory = new JsonFileIOMarshallerSessionFactory(this.workspace);
    this.cliWrapper = new PtyCLIWrapper();
    this.tool = new MarshalledCLITool(
      sessionFactory, this.cliWrapper, new ClaudeCommandBuilder(this.installation), this.workspace
    );
    Object.freeze(this);
  }

  createWorkflowCommandBuilder(): WorkflowCommandBuilder {
    return new ClaudeWorkflowCommandBuilder(this.tool, this.cliWrapper, this.workspace);
  }
}
```

Key simplifications vs Microkernel:
- **No async** — No config loading or dynamic imports; constructor is synchronous
- **No config** — No `MicrokernelConfig`, no JSON files, no `defu` merging
- **No `create()` factory** — Just `new CompositionRoot()` (sync, so no need for factory)
- **Exposes components** — `tool`, `cliWrapper`, `workspace` are readonly properties (needed by consumers)
- **Preserves DI testability** — Optional `installation` and `workspace` injection for tests

---

## Step 2: Write Tests for CompositionRoot

**Create:** `tests/unit/kernel/composition-root.unit.test.ts`

Test that:
1. Constructor creates a valid CompositionRoot with all properties defined
2. `tool` implements `Tool` interface (has `execute` method)
3. `cliWrapper` implements `CLIWrapper` interface (has `run` method)
4. `createWorkflowCommandBuilder()` returns a `WorkflowCommandBuilder` (has `build` method)
5. Custom `installation`/`workspace` options are respected

---

## Step 3: Simplify `DefaultClaudeCodeTool`

**Modify:** `src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.ts`

Replace its internal wiring (8 lines of constructor code duplicating the composition) with delegation to CompositionRoot:

```typescript
constructor() {
  const root = new CompositionRoot();
  this.tool = root.tool;
}
```

Remove imports: `JsonFileIOMarshallerSessionFactory`, `PtyCLIWrapper`, `DefaultAgenticHqInstallation`, `DefaultGitWorkspace`, `DefaultUserProjectWorkspace`, `ClaudeCommandBuilder`, `MarshalledCLITool`

Add import: `CompositionRoot` from `../../kernel/composition-root.js`

---

## Step 4: Simplify CLI Entry Point

**Modify:** `src/cli/agentic-hq-cli.ts`

Replace Microkernel usage with CompositionRoot:

```typescript
import { CompositionRoot } from '../kernel/composition-root.js';
// ... other existing imports stay

const root = new CompositionRoot();
const builder = root.createWorkflowCommandBuilder();
createProgram(builder, new WorkflowSkillsRegistry(DEMO_SKILLS)).parse();
```

Remove import: `Microkernel` from `../kernel/microkernel.js`

---

## Step 5: Delete Microkernel Infrastructure

### Delete files that only exist for config-driven dynamic loading:

**Config infrastructure (DELETE):**
- `src/kernel/microkernel.ts` — Replaced by `composition-root.ts`
- `src/kernel/microkernel-config.ts` — Config types no longer needed
- `src/kernel/microkernel-config-loader.ts` — Config loading no longer needed

**Factory wrapper modules (DELETE) — exist solely for `await import()`:**
- `src/io/marshalling/io-marshaller-session-factory.ts`
- `src/io/terminal/cli-wrapper-factory.ts`
- `src/workflow/workflow-command-builder-factory.ts`

**Demo plugin (DELETE) — proves plugin swapping which is being removed:**
- `src/kernel/demo-plugins/colourful-pty-cli-wrapper.ts`
- `src/kernel/demo-plugins/colourful-pty-cli-wrapper-factory.ts`
- Remove the empty `src/kernel/demo-plugins/` directory

**Config files (DELETE):**
- `.agentic-hq/microkernel.json`
- `.agentic-hq/microkernel.override.json` (if exists — it's gitignored)

**Documentation (DELETE):**
- `docs/dev/creating-a-plugin.md`

**Tests for deleted components (DELETE):**
- `tests/unit/kernel/microkernel.unit.test.ts`
- `tests/unit/kernel/microkernel-config-loader.unit.test.ts`
- `tests/unit/kernel/demo-plugin-loading.unit.test.ts`

**Verify:** `pnpm typecheck && pnpm test`

---

## Step 6: Update `package.json`

1. **Remove export** (line 14): `"./kernel": "./src/kernel/microkernel.ts"` — Replace with `"./kernel": "./src/kernel/composition-root.ts"`
2. **Remove dependency** (line 65): `"defu": "^6.1.4"` — Only used by deleted config loader
3. **Keep all demo scripts** — They bypass the microkernel entirely
4. **Run:** `pnpm install` to update `pnpm-lock.yaml`

---

## Step 7: Update `.gitignore`

Remove line: `.agentic-hq/microkernel.override.json`

---

## Step 8: Update `src/interfaces/index.ts` Comment

- Line 2: `Plugin architecture interfaces.` → `Core architecture interfaces.`
- Line 4: `the pluggable seams of the agentic-hq microkernel:` → `the pluggable seams of the agentic-hq system:`

Comment-only change. No code changes.

---

## Step 9: Verification

1. `pnpm validate` — must pass (typecheck + lint + format + unit tests)
2. `pnpm demo:plugin-direct:string-reversal` — must produce reversed string output

---

## Step 10: Document Final Architecture

**Create:** `docs/jira-docs/AHQ-83/beads-implementation/10-e-refactored-architecture-without-microkernal.md`

Content:
1. **Diagram 1:** Component dependency graph showing CompositionRoot and all components
2. **Diagram 2:** How CLI entry point and DefaultClaudeCodeTool both use CompositionRoot
3. **Plain English description** in paragraphs with **Bold** interface/concept names showing how the system reads fluently

---

## Files Summary

### CREATE (3 files):
| File | Purpose |
|------|---------|
| `src/kernel/composition-root.ts` | Simplified Microkernel — direct wiring, no config |
| `tests/unit/kernel/composition-root.unit.test.ts` | Tests for CompositionRoot |
| `docs/jira-docs/AHQ-83/beads-implementation/10-e-refactored-architecture-without-microkernal.md` | Final architecture doc |

### MODIFY (5 files):
| File | Change |
|------|--------|
| `src/cli/agentic-hq-cli.ts` | Use CompositionRoot instead of Microkernel |
| `src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.ts` | Delegate to CompositionRoot (eliminate duplication) |
| `package.json` | Update `./kernel` export path, remove `defu` dependency |
| `.gitignore` | Remove override.json entry |
| `src/interfaces/index.ts` | Update comment (remove "microkernel" word) |

### DELETE (14 files):
| File | Why |
|------|-----|
| `src/kernel/microkernel.ts` | Replaced by composition-root.ts |
| `src/kernel/microkernel-config.ts` | Config types no longer needed |
| `src/kernel/microkernel-config-loader.ts` | Config loading no longer needed |
| `src/kernel/demo-plugins/colourful-pty-cli-wrapper.ts` | Demo plugin for removed capability |
| `src/kernel/demo-plugins/colourful-pty-cli-wrapper-factory.ts` | Demo plugin factory |
| `src/io/marshalling/io-marshaller-session-factory.ts` | Factory for dynamic loading |
| `src/io/terminal/cli-wrapper-factory.ts` | Factory for dynamic loading |
| `src/workflow/workflow-command-builder-factory.ts` | Factory for dynamic loading |
| `tests/unit/kernel/microkernel.unit.test.ts` | Tests deleted Microkernel |
| `tests/unit/kernel/microkernel-config-loader.unit.test.ts` | Tests deleted config loader |
| `tests/unit/kernel/demo-plugin-loading.unit.test.ts` | Tests deleted demo plugin |
| `.agentic-hq/microkernel.json` | Config file no longer needed |
| `.agentic-hq/microkernel.override.json` | Override config no longer needed |
| `docs/dev/creating-a-plugin.md` | Plugin docs for removed capability |

### AUTO-UPDATE (1 file):
| File | Change |
|------|--------|
| `pnpm-lock.yaml` | Updated by `pnpm install` after removing defu |

### KEEP (everything else — the refactoring):
All interfaces, concrete implementations, tests, demo skills, CLI program factory — unchanged.

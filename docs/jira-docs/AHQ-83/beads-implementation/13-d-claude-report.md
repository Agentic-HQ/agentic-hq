# 13-d: Same Name for Interface and Class — Deep Dive

## 1. How Common Is This Pattern? Is It Well-Accepted?

**Honest answer: No, it is not widely used or endorsed.**

Perplexity research found:

- **TypeScript Handbook** — Does not mention or demonstrate this pattern.
- **Google TypeScript Style Guide** — Does not recommend it.
- **Total TypeScript (Matt Pocock)** — Advises against legacy prefixes but does not advocate same-name sharing.
- **Major projects (Angular, React, NestJS, VS Code)** — None consistently use it. They prefer distinct names.
- **DEV.to article** — Describes it as a "curious practice" with merits for small-scale code but highlights risks: ambiguity, maintenance issues, and SRP violations.

**Bottom line:** This pattern exists and is technically valid in TypeScript (thanks to structural typing and the type/value namespace split), but it is **niche, not mainstream**. No major style guide explicitly recommends it.

## 2. How Is Confusion Between Interface and Class Avoided?

TypeScript has separate namespaces for types and values. When you write:

```typescript
export interface CLICommand { execute(): void; }
export class CLICommand implements CLICommand { execute() { /* ... */ } }
```

TypeScript resolves:
- `let x: CLICommand` → uses the **interface** (type position)
- `new CLICommand()` → uses the **class** (value position)

**Practical mitigation strategies:**

| Risk | Mitigation |
|---|---|
| Name collisions across files | Co-locate interface and class in the same file |
| Consumer confusion ("which one am I importing?") | Barrel exports hide internals; consumers get one import |
| IDE ambiguity | VS Code IntelliSense shows type vs. value in different contexts |
| Multi-implementation scenario | Breaks down — you'd need to rename the class anyway |

**The key catch:** This only works cleanly when the interface and class are **in the same file**. If they're in separate files (as ours currently are), you get import conflicts and need ugly aliasing like `export { CLICommand as CLICommandClass }`.

## 3. How We Would Do It In This Project

### Current Structure

```
src/
├── interfaces/                    ← Centralized (anti-pattern, moving away from this)
│   ├── index.ts
│   ├── cli-command.ts             ← interface CLICommand
│   ├── claude-code-tool.ts        ← interface ClaudeCodeTool
│   ├── workflow-command.ts        ← interface WorkflowCommand
│   ├── git-workspace.ts           ← interface GitWorkspace
│   ├── agentic-hq-installation.ts ← interface AgenticHqInstallation
│   └── user-project-workspace.ts  ← interface UserProjectWorkspace
│
├── io/terminal/
│   └── default-cli-command.ts     ← class DefaultCLICommand
├── tools/.../claude-code/
│   └── default-claude-code-tool.ts ← class DefaultClaudeCodeTool
├── workflow/
│   └── default-workflow-command.ts ← class DefaultWorkflowCommand
├── workspace/
│   ├── default-git-workspace.ts           ← class DefaultGitWorkspace
│   ├── default-agentic-hq-installation.ts ← class DefaultAgenticHqInstallation
│   └── default-user-project-workspace.ts  ← class DefaultUserProjectWorkspace
```

### What Same-Name Would Look Like (Co-located)

Since we're already planning to co-locate interfaces with their implementations, the same-name approach would mean merging interface and class into one file:

```
src/
├── io/terminal/
│   └── cli-command.ts             ← interface CLICommand + class CLICommand
├── tools/.../claude-code/
│   └── claude-code-tool.ts        ← interface ClaudeCodeTool + class ClaudeCodeTool
├── workflow/
│   └── workflow-command.ts        ← interface WorkflowCommand + class WorkflowCommand
├── workspace/
│   ├── git-workspace.ts           ← interface GitWorkspace + class GitWorkspace
│   ├── agentic-hq-installation.ts ← interface AgenticHqInstallation + class AgenticHqInstallation
│   └── user-project-workspace.ts  ← interface UserProjectWorkspace + class UserProjectWorkspace
```

**Example file (`cli-command.ts`):**

```typescript
// src/io/terminal/cli-command.ts

/** Contract for a CLI command that can be executed by a CLIWrapper. */
export interface CLICommand {
  readonly executable: string;
  readonly args: string[];
  logDebug(): void;
}

/** Default implementation of CLICommand with ANSI terminal styling. */
export class CLICommand implements CLICommand {
  constructor(
    readonly executable: string,
    readonly args: string[],
  ) {}

  logDebug(): void {
    // ANSI styling for terminal output
  }
}
```

**Consumer code:**

```typescript
import { CLICommand } from './io/terminal/cli-command.js';

// As a type (uses the interface):
function runCommand(cmd: CLICommand): void { /* ... */ }

// As a value (uses the class):
const cmd = new CLICommand('git', ['status']);
```

**CompositionRoot wiring:**

```typescript
import { CLICommand } from '../io/terminal/cli-command.js';

// TypeScript knows: CLICommand-as-type = interface, CLICommand-as-value = class
private getCLICommand(executable: string, args: string[]): CLICommand {
  return new CLICommand(executable, args);
}
```

### What Same-Name Would Look Like (Separate Files, Same Directory)

If we want to keep one-class-per-file (which we currently enforce), same-name becomes awkward:

```typescript
// src/io/terminal/cli-command.interface.ts
export interface CLICommand { /* ... */ }

// src/io/terminal/cli-command.ts
import type { CLICommand as ICLICommand } from './cli-command.interface.js';
export class CLICommand implements ICLICommand { /* ... */ }

// src/io/terminal/index.ts (barrel)
export type { CLICommand } from './cli-command.interface.js';      // type export
export { CLICommand as CLICommandClass } from './cli-command.js';  // value export — UGLY
```

This is **worse than what we have now**. Aliasing defeats the purpose.

## 4. Honest Assessment

| Factor | Same Name (Co-located) | `Default*` Prefix (Current) |
|---|---|---|
| **Idiomatic TypeScript?** | Technically valid, but niche | Not idiomatic, but clear |
| **Major project precedent?** | None found | None found |
| **Readability** | Confusing — "which CLICommand?" | Clear — "DefaultCLICommand is the concrete one" |
| **Works with one-class-per-file?** | No (needs same file or ugly aliasing) | Yes |
| **Works for plugin architecture?** | Breaks when user adds 2nd implementation | Works — user creates `MyCLICommand` alongside `DefaultCLICommand` |
| **IDE experience** | Ambiguous autocomplete | Clean autocomplete |
| **Refactoring safety** | Risky — rename affects type and value | Safe — class and interface have distinct names |

### The Plugin Architecture Problem

For our microkernel architecture, same-name is actually **problematic**:

```typescript
// User wants to provide their own implementation:
// With Default* prefix — clean:
import { CLICommand } from 'agentic-hq/interfaces';          // the interface
import { DefaultCLICommand } from 'agentic-hq/io/terminal';  // our implementation (for reference)
export class MyCLICommand implements CLICommand { /* ... */ }  // their implementation

// With same-name — confusing:
import { CLICommand } from 'agentic-hq/io/terminal';  // Wait, is this the interface or the class?
// Need to import both and alias: messy
```

## 5. Recommendation

**The same-name pattern is not a good fit for this project.** Reasons:

1. It's not actually well-accepted (Perplexity confirmed it's niche)
2. It conflicts with our one-class-per-file convention
3. It makes the plugin/extension story worse, not better
4. It creates ambiguity that `Default*` prefix avoids

**Better options for this project (in order of preference):**

### Option A: Keep `Default*` — Do Nothing

The `Default*` prefix is unusual but perfectly communicative for a plugin architecture. It says exactly what it means: "this is the default, you can replace it." The cost of renaming is real; the benefit is aesthetic.

### Option B: Drop the prefix, use a descriptive name

Instead of `DefaultCLICommand`, name the class after *what it does*:

| Current | Proposed | Rationale |
|---|---|---|
| `DefaultCLICommand` | `CLICommand` (just drop Default) | It's the only impl; if someone makes another, they'll name it differently |
| `DefaultClaudeCodeTool` | `ClaudeCodeTool` | Same |
| `DefaultWorkflowCommand` | `BashWorkflowCommand` | Describes HOW it works (wraps bash -c) |
| `DefaultGitWorkspace` | _(being removed in AHQ-91)_ | Don't bother renaming |
| `DefaultAgenticHqInstallation` | _(being simplified in AHQ-91)_ | Don't bother renaming |
| `DefaultUserProjectWorkspace` | _(being simplified in AHQ-91)_ | Don't bother renaming |

This is the **most pragmatic** option: only rename the 3 that aren't being removed/simplified, and use descriptive names rather than same-name-as-interface.

### Option C: Co-locate interface + class in same file, use same name

Only viable if we're willing to abandon one-class-per-file for these pairs. Not recommended given the plugin architecture concerns above.

---

*Sources: TypeScript Handbook (interfaces), Google TypeScript Style Guide, Total TypeScript naming tips, DEV.to "Using one name for both interface and class", AWS CDK TypeScript best practices, typescript-eslint naming-convention rule.*

# 13-b: `Default*` Class Naming Convention — Research Report

## Classes Found

All 6 `Default*` concrete classes are the **sole implementation** of their interface:

| Class | Interface | File |
|---|---|---|
| `DefaultClaudeCodeTool` | `ClaudeCodeTool` | `src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.ts` |
| `DefaultWorkflowCommand` | `WorkflowCommand` | `src/workflow/default-workflow-command.ts` |
| `DefaultGitWorkspace` | `GitWorkspace` | `src/workspace/default-git-workspace.ts` |
| `DefaultAgenticHqInstallation` | `AgenticHqInstallation` | `src/workspace/default-agentic-hq-installation.ts` |
| `DefaultUserProjectWorkspace` | `UserProjectWorkspace` | `src/workspace/default-user-project-workspace.ts` |
| `DefaultCLICommand` | `CLICommand` | `src/io/terminal/default-cli-command.ts` |

**Note:** `DefaultGitWorkspace` and `DefaultAgenticHqInstallation` are scheduled for removal in AHQ-91.

## Perplexity Research: Is `Default*` an Anti-Pattern?

### Short Answer

The `Default` prefix is **not explicitly called an anti-pattern**, but it is **uncommon and not recommended** by major TypeScript style guides or well-known projects. The TypeScript community prefers plain names without prefixes/suffixes.

### What the Guides and Projects Say

- **TypeScript Handbook** — Demonstrates interfaces without prefixes/suffixes; focuses on shape-based typing.
- **Google TypeScript Style Guide** — Advises naming interfaces to express their purpose, avoiding indicators that imply type category. Advises against type-indicating suffixes.
- **Community consensus** (DEV.to, Matt Pocock, typescript-eslint) — Ditch prefixes like `I` or `Default` as Java/C# holdovers. The official handbook omits them.

### What Well-Known Projects Do

- **VS Code** — Uses plain names like `interface ICommand` with `class Command` (no "Default").
- **NestJS** — Uses `interface Logger` with `class Logger` (no prefix), despite being plugin-friendly.
- **Angular** — Prefers `interface Hero` with `class Hero`, no "Default" prefix.

### `Default*` vs `*Impl` — Comparison

| Convention | Pros | Cons |
|---|---|---|
| **`DefaultCLICommand`** | Signals "replaceable default" for plugins; explicit intent | Uncommon in TS; adds noise; conflicts with "avoid prefixes" advice; harder refactoring |
| **`CLICommandImpl`** | Familiar from Java; groups implementations in IDE autocomplete | Seen as verbose/legacy ("Java days" holdover); Google advises against type-indicating suffixes; bloats autocomplete |
| **Same name as interface** | Clean; follows VS Code/Angular conventions; no noise | Requires import aliasing or module-level separation to avoid conflicts |

### Recommendation from Perplexity

For a plugin/microkernel architecture, the recommended TypeScript approach is:

1. **Use plain class names** (same as interface or descriptive noun) — e.g., `class CLICommand` or `class Commander CLICommand`.
2. **Signal replaceability via dependency injection and documentation** (JSDoc, factory functions like `createDefaultCLICommand(): CLICommand`) rather than name-based signaling.
3. If you want to keep the "this is the default, you can swap it" semantics visible in the name, `Default*` is **more communicative** than `*Impl` — but neither is idiomatic TypeScript.

### Our Context: Why We Have This Pattern

We intentionally have many interfaces with a single concrete implementation because:
- We're building a **microkernel/plugin architecture** where every major component is an extension point
- Users should be able to replace our concrete class with their own
- The interface defines the contract; our class is just "the one that ships in the box"

This is a valid architectural reason. The question is purely about **naming convention**, not about whether having interface + single implementation is wrong (it's not — it's standard for plugin architectures).

## Decision Needed

Three options:

1. **Keep `Default*` prefix** — Non-idiomatic but communicative. Everyone on the team immediately knows "this is the out-of-the-box implementation you can replace."

2. **Switch to `*Impl` suffix** — Slightly more common in enterprise TS, but still considered a Java holdover. Less communicative than `Default*` about replaceability.

3. **Drop prefix/suffix entirely** — Most idiomatic TypeScript. Use the same name or a descriptive name. Rely on DI container, factory functions, and documentation to communicate replaceability. Requires more care with imports if interface and class share a name.

---

*Sources: TypeScript Handbook, Google TypeScript Style Guide, typescript-eslint naming-convention rule, DEV.to community discussions, Matt Pocock's TypeScript rules.*

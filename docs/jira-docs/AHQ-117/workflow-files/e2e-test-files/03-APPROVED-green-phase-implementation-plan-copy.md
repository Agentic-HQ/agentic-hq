# GREEN Phase Implementation Plan — AHQ-117 (e2e test)

## Post-Approval Amendment (2026-04-20, mid-implementation)

The Jira was updated after this plan was approved. Two corrections apply to every step that references service names or the `ClaudeCodeTool` interface:

1. **`ClaudeCodeTool` interface is dropped.** `DefaultClaudeCodeTool` implements `Tool` directly (it `extends MarshalledCLITool` which `implements Tool`). Do NOT create `src/interfaces/claude-code-tool.ts`. The barrel in `src/index.ts` exports 15 symbols, not 16 (5 service interfaces instead of 6; the 6 default classes + 4 composition helpers counts unchanged).
2. **Service names are now the concrete class name, not the interface name.** Rationale: two services (`DefaultClaudeCodeTool` and `MarshalledCLITool`) share the same `Tool` interface, so the interface name cannot uniquely identify a service. Updated mapping:

    | Service name (registry key) | Interface | Default class |
    |---|---|---|
    | `DefaultClaudeCodeTool` | `Tool` | `DefaultClaudeCodeTool` |
    | `DefaultCLICommand` | `CLICommand` | `DefaultCLICommand` |
    | `ClaudeWorkflowCommandBuilder` | `WorkflowCommandBuilder` | `ClaudeWorkflowCommandBuilder` |
    | `DefaultWorkflowCommand` | `WorkflowCommand` | `DefaultWorkflowCommand` |
    | `MarshalledCLITool` | `Tool` | `MarshalledCLITool` |
    | `WorkflowSearchResultsImpl` | `WorkflowSearchResults` | `WorkflowSearchResultsImpl` |

3. **Follow-on impact on the temp override project.** `src/classwitch-registry/override-registry.ts` currently keys `overrideExistingServices({ WorkflowSearchResults: ... })` — must change to `{ WorkflowSearchResultsImpl: ... }`. Doc comments referencing `loadClass('WorkflowSearchResults')` in that project's `override-registry.ts`, `main.ts`, and `colourful-workflow-search-results-impl.ts` must also be updated. A new **Step 7b** covers this.

4. **Trailing-comment convention still applies**, now using the new service-name form:

    ```ts
    const WorkflowSearchResultsClass = rootServiceRegistry.loadClass('WorkflowSearchResultsImpl'); // Loads WorkflowSearchResultsImpl (default)
    ```

    In this new form the service-name and the (default) class name usually coincide, but the trailing comment is still required — an override registers under the same service name but swaps in a different class, and the comment names the class that runs unoverridden.

5. **Jira Requirements #3, #5, #6 below are superseded** by this amendment. Where those rows say "6 interfaces" or "service names match interface names exactly," read the amended mapping above instead.

## Context

This is the GREEN phase for the AHQ-117 e2e test. The RED phase (`docs/jira-docs/AHQ-117/workflow-files/e2e-test-files/02-red-phase-failing-tests.md`) has already stood up an override project at `/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/` that fails with 3× `TS2307` + one `ERR_PACKAGE_PATH_NOT_EXPORTED` when you run `node bin/temp-agentic-hq-with-colours.cjs list`. Every failure traces back to the same root cause: the `agentic-hq` repo has not yet been converted into a Classwitch Root Project.

Goal of GREEN: Do the minimum classwitch conversion to `agentic-hq` that makes the override's `list` command print "Available workflows (with colours):" in green, the AHQ section in blue, and the user section in red — while keeping `pnpm validate` green in `agentic-hq` and the two named regression e2e tests green.

Out of GREEN scope (deferred to REFACTOR / later Jira tasks): ESLint `no-restricted-imports` enforcement (Jira Add-On Section 8), README section update, `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md`, classwitch how-to-guide improvements, and the classwitch-doc-fixes draft Jira. These all have independent acceptance but are not required to make the RED test go green.

---

## Jira Requirements (Numbered)

All requirements pulled from the AHQ-117 Jira body, Add-On sections, and AC. Each arrow points at the Step or Plan Section that addresses it. Items marked "Deferred to REFACTOR" or "Deferred to VALIDATE" are explicitly not done in GREEN — they land in later phases of this Jira.

1. **Target: `temp-agentic-hq-with-colours list` prints listing with 3 colours (green header, blue AHQ section, red user section)** → [Step 1 + Step 2 + Step 3 + Step 4 + Step 5 + Step 6 + Step 7; verified in Step 9]
2. **Widen `agentic-hq/package.json` exports to 5 subpaths** (`.`, `./cli`, `./cli/program`, `./classwitch-registry`, `./tools/claude-code`) (Add-On §1) → [Step 1]
3. **Create `src/index.ts` barrel** re-exporting 16 symbols (6 interfaces + 6 default classes + `Workspace`, `WorkflowRegistry`, `AhqWorkspaceImpl`, `CurrentUserWorkspaceImpl`) (Add-On §1) → [Step 2]
4. **Create `src/classwitch-registry/root-registry.ts`** declaring all 6 services and exporting `rootServiceRegistry` (Add-On §1) → [Step 3]
5. **Service names match interface names exactly** (`ClaudeCodeTool`, `CLICommand`, `WorkflowCommandBuilder`, `WorkflowCommand`, `Tool`, `WorkflowSearchResults`) — not `Impl` names (Add-On §2) → [Step 3]
6. **Swap every `new SomeImpl()` call site to `rootServiceRegistry.loadClass('ServiceName')` across ENTIRE codebase** (human-confirmed Q5: "All instances … otherwise what's the point") — 6 hits in 5 files (`src/cli/app.ts`, `src/kernel/composition-root.ts`, `src/workflow/claude/claude-workflow-command-builder.ts`, `src/workflow/workflow-command/default-workflow-command.ts`, `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts`) → [Step 4]
7. **Centralise `AGENTIC_HQ_WORKSPACE_ROOT` resolution in `app.run()`** using `import.meta.url` + walk-up; preserve test-injection guard (`if (!process.env.AGENTIC_HQ_WORKSPACE_ROOT)`) (Add-On §9) → [Step 5]
8. **Delete `process.env.AGENTIC_HQ_WORKSPACE_ROOT = ...` line from `bin/agentic-hq.cjs`** and its NOTE RE REFACTOR comment block (Add-On §9) → [Step 6]
9. **`ColourfulWorkflowSearchResultsImpl` constructor args must be optional-with-defaults** (`AhqWorkspaceImpl`, `CurrentUserWorkspaceImpl`) so classwitch's no-arg `new Klass()` call site (mirroring existing `new WorkflowSearchResultsImpl()`) works. Also swap the inline structural types in that file for cross-package imports from `agentic-hq` (now possible once Step 1–2 land) (Add-On §1; AHQ-120 Add-On §1 sketch) → [Step 7]
10. **Regression e2e safety net**: `pnpm test:e2e:cross-workspace-list-workflows` + `pnpm test:e2e:cross-workspace-demo-math-workflow` must stay green (Jira AC + RED phase GREEN-todo #8) → [Step 9c]
11. **`pnpm validate` in `agentic-hq` must stay green** (typecheck + lint + format + 131 unit tests) (Jira AC) → [Step 9a]
12. **`pnpm typecheck` + `pnpm test:unit` in override project stay green** (regression safety for the unit cycle's work) → [Step 9b]
13. **Design-intent comments** on the new registry file, the barrel, and the centralised-env-var section of `app.run()` (memory feedback: `feedback_classwitch_root_project_comments`) → [Steps 2, 3, 5]
14. **ESLint `no-restricted-imports` enforcement of "no direct `new DefaultX()`"** (Add-On §8) → Deferred to REFACTOR (not required for the RED test to pass; has its own AC that belongs alongside the classwitch rule)
15. **`README.md` new section pointing at new how-to-guide** (Jira AC) → Deferred to VALIDATE
16. **`docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md`** with Intro / worked example / Summary / Troubleshooting (Jira AC; Add-On §3) → Deferred to VALIDATE
17. **Improve `classwitch/docs/how-to-guides/how-to-convert-project-to-root-classwitch-project.md`** (Jira §7) → Deferred to VALIDATE
18. **Draft `docs/jira-docs/AHQ-117/draft-future-jiras/classwitch-jira-draft-for-fixes-and-improvements-to-classwitch-how-to-guide.md`** (Jira §7; human Q4 confirmed path) → Deferred to VALIDATE
19. **Out of scope**: converting concrete classes beyond the 6 listed → N/A
20. **`CompositionRoot` stays internal** (Add-On §1 "Deliberately Not Exported") → Honoured by omission in Step 2

---

## Project Design Requirements Compliance

Design requirements doc: `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/dev/project-design-requirements.md`. Data Dictionary + ELD sections explicitly skipped per AI-summary Q6 human answer ("Fine to skip") — this is a conversion Jira, no new concepts.

| # | Design Requirement | Plan Section Addressing It | Notes |
|---|---|---|---|
| D.1 | Class/interface pair for each concept | Pre-met — all 6 services already have `Interface` + `DefaultImpl` pairs (verified by grep in AI summary). No new pairs needed. | Step 3 registers them as classwitch services, formalising switchability. |
| D.2 | Tell, don't ask | Existing impls already follow this (e.g. `WorkflowSearchResultsImpl` delegates to Workspace objects). Override's `ColourfulWorkflowSearchResultsImpl` mirrors the same style. | Step 7 keeps the delegation pattern when updating constructor defaults. |
| D.3 | Avoid cached state | `ColourfulWorkflowSearchResultsImpl` holds only constructor-injected `Workspace` refs and delegates — no list/entry caching. | Step 7 preserves this when widening constructor signature. |
| D.4 | Switchable concrete classes | **This Jira IS the direct realisation** — after Step 3+4, all 6 services are switchable via `rootServiceRegistry.overrideExistingServices({...})`. | Full design-doc promise landed. |
| D.5 | Concept Table / Data Dictionary / ELD | Skipped per human Q6 answer. The Jira's own 6-service table (reproduced in `/tmp/jira-mcp-output-AHQ-117.txt` §1) serves the same purpose. | N/A for this Jira. |

No deferrals beyond D.5 above. Minimal implementation satisfies all applicable design requirements.

---

## Implementation Steps

### Step 0: Save the approved plan

Copy this plan (once approved) to `docs/jira-docs/AHQ-117/workflow-files/e2e-test-files/03-APPROVED-green-phase-implementation-plan-copy.md`. No other work begins until this is done.

### Step 1: Widen `agentic-hq/package.json` exports

File: `/Users/stevepersonal/dev/agentic-hq/agentic-hq/package.json`

Replace the `"exports"` block with:

```json
"exports": {
  ".": "./src/index.ts",
  "./cli": "./src/cli/app.ts",
  "./cli/program": "./src/cli/agentic-hq-program.ts",
  "./classwitch-registry": "./src/classwitch-registry/root-registry.ts",
  "./tools/claude-code": "./src/tools/marshalled-io-tools/claude-code/index.ts"
}
```

`./cli/program` is exposed for unit tests only — override projects use `./cli`.

### Step 2: Create `src/index.ts` barrel

File (NEW): `/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/index.ts`

Re-export 16 symbols (per the Jira Add-On §1 table). Group by kind:

**6 service interfaces** (type-only re-exports):
- `ClaudeCodeTool` — from `./interfaces/claude-code-tool.ts`
- `CLICommand` — from `./interfaces/cli-command.ts`
- `WorkflowCommandBuilder` — from `./interfaces/workflow-command-builder.ts`
- `WorkflowCommand` — from `./interfaces/workflow-command.ts`
- `Tool` — from `./interfaces/tool.ts`
- `WorkflowSearchResults` — from `./workflow-discovery/interfaces/workflow-search-results.ts`

**6 default classes** (value re-exports):
- `DefaultClaudeCodeTool`, `DefaultCLICommand`, `ClaudeWorkflowCommandBuilder`, `DefaultWorkflowCommand`, `MarshalledCLITool`, `WorkflowSearchResultsImpl`

**4 composition helpers** (2 interfaces type-only, 2 classes value):
- `Workspace`, `WorkflowRegistry` (interfaces)
- `AhqWorkspaceImpl`, `CurrentUserWorkspaceImpl` (classes)

Note 1: `ClaudeCodeTool` and `ClaudeCodeToolInterface` — let me verify the interface file name during implementation. Currently `src/interfaces/` does not contain `claude-code-tool.ts`. **Discovered mismatch**: the Jira Add-On §1 table says `src/interfaces/claude-code-tool.ts` exists — grepping shows it does not. The `ClaudeCodeTool` "interface" role is structurally played by `MarshalledCLITool`'s `Tool` contract. **Action during implementation**: if `ClaudeCodeTool` interface doesn't exist as a named interface, create a minimal `src/interfaces/claude-code-tool.ts` exporting `ClaudeCodeTool` as a re-export of `Tool` (that's the contract `DefaultClaudeCodeTool` satisfies), or check if there's already an equivalent. Clarify mid-implementation; stop + ask human if ambiguous.

Note 2: Same check for `CLICommand` (already exists at `src/interfaces/cli-command.ts` — grep confirmed). `DefaultCLICommand` implements it.

File header (design-intent comment block) must explain: "This barrel is the public API of agentic-hq when used as a dependency. Override projects import interfaces to declare `implements`, default classes to subclass/wrap/reuse. Every classwitch-registered service must appear here (rule: registered = exported). See AHQ-117 Add-On §1."

### Step 3: Create `src/classwitch-registry/root-registry.ts`

File (NEW): `/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/classwitch-registry/root-registry.ts`

Pattern to mirror (proven working): `classwitch/src/demo/root-demo-repo/classwitch-registry/root-demo-registry.ts`.

Contents (sketch):

```ts
import { createEmptyRegistry, serviceThatImplements } from 'classwitch';

import type { ClaudeCodeTool } from '../interfaces/claude-code-tool.js';
import type { CLICommand } from '../interfaces/cli-command.js';
import type { Tool } from '../interfaces/tool.js';
import type { WorkflowCommand } from '../interfaces/workflow-command.js';
import type { WorkflowCommandBuilder } from '../interfaces/workflow-command-builder.js';
import { DefaultCLICommand } from '../io/terminal/default-cli-command.js';
import { DefaultClaudeCodeTool } from '../tools/marshalled-io-tools/claude-code/default-claude-code-tool.js';
import { MarshalledCLITool } from '../tools/marshalled-io-tools/marshalled-cli-tool.js';
import { ClaudeWorkflowCommandBuilder } from '../workflow/claude/claude-workflow-command-builder.js';
import { DefaultWorkflowCommand } from '../workflow/workflow-command/default-workflow-command.js';
import type { WorkflowSearchResults } from '../workflow-discovery/interfaces/workflow-search-results.js';
import { WorkflowSearchResultsImpl } from '../workflow-discovery/workflow-listing/workflow-search-results-impl.js';

export const rootServiceRegistry = createEmptyRegistry().addNewServices({
  ClaudeCodeTool:          serviceThatImplements<ClaudeCodeTool>().interfaceWithClass(DefaultClaudeCodeTool),
  CLICommand:              serviceThatImplements<CLICommand>().interfaceWithClass(DefaultCLICommand),
  WorkflowCommandBuilder:  serviceThatImplements<WorkflowCommandBuilder>().interfaceWithClass(ClaudeWorkflowCommandBuilder),
  WorkflowCommand:         serviceThatImplements<WorkflowCommand>().interfaceWithClass(DefaultWorkflowCommand),
  Tool:                    serviceThatImplements<Tool>().interfaceWithClass(MarshalledCLITool),
  WorkflowSearchResults:   serviceThatImplements<WorkflowSearchResults>().interfaceWithClass(WorkflowSearchResultsImpl),
});
```

File header comment: "The Classwitch root service registry for agentic-hq. All 6 switchable services declared here. Override projects side-effect-import `agentic-hq/classwitch-registry` and call `.overrideExistingServices({...})` on the returned singleton. Service names match their interface names exactly (Add-On §2: renames = breaking API change for downstream overrides)."

Implementation risk: the `ClassConstructor<Interface>` type constraint fires if a class's constructor signature is incompatible. `DefaultClaudeCodeTool` has `constructor(root: CompositionRoot = new CompositionRoot())` — a 0-arg-compatible constructor. `ClaudeWorkflowCommandBuilder` has `constructor(tool, cliWrapper, workspace)` — 3-arg. `DefaultWorkflowCommand` has `constructor(commandString, cliWrapper, workingDirectory)` — 3-arg. `DefaultCLICommand` has `constructor(executable, args)` — 2-arg. `MarshalledCLITool` has `constructor(sessionFactory, cliWrapper, marshalledIOCLICommandBuilder, workspace)` — 4-arg. `WorkflowSearchResultsImpl` has `constructor()` — 0-arg.

**classwitch's `ClassConstructor<Interface>` type must accept classes with any constructor arity** — `loadClass` returns the class, caller `new`s it with the appropriate args (proven by the demo's `new NormalPersonClass('Alice', 35)` → 2-arg). **Verify during implementation by running `pnpm typecheck`** — if it rejects a class for arity reasons, stop and investigate.

### Step 4: Swap every `new DefaultX()` call site to `loadClass(...)`

**Style rule (applies to every `loadClass` line in the entire codebase):** add a trailing comment naming the default concrete class that will be loaded, so a reader doesn't have to open `root-registry.ts` to find out. Format:

```ts
const FooClass = rootServiceRegistry.loadClass('Foo'); // Loads FooImpl (default)
```

Use `Loads <DefaultClassName> (default)`. The "(default)" wording makes it obvious the comment names the *current default* — downstream override projects will legitimately swap it, but the reader can still see at a glance what would run unoverridden. Apply this rule in Steps 4a–4e below *and* in any future `loadClass` call added to this repo.

6 hits in 5 files (confirmed by grep):

**4a. `src/cli/app.ts:46`** — swap `new WorkflowSearchResultsImpl()`
```ts
// Before:
import { WorkflowSearchResultsImpl } from '../workflow-discovery/workflow-listing/workflow-search-results-impl.js';
// ...
createProgram(builder, new WorkflowSearchResultsImpl()).parse();

// After:
import { rootServiceRegistry } from '../classwitch-registry/root-registry.js';
// ...
const WorkflowSearchResultsClass = rootServiceRegistry.loadClass('WorkflowSearchResults'); // Loads WorkflowSearchResultsImpl (default)
createProgram(builder, new WorkflowSearchResultsClass()).parse();
```

Also delete the AHQ-117 "will later convert" comment from the file header (it's now done) — update it to say "AHQ-117 has converted this to a classwitch loadClass call" (one-line edit).

**4b. `src/kernel/composition-root.ts:47-48`** — swap `new ClaudeWorkflowCommandBuilder(...)` and `new DefaultClaudeCodeTool(this)`
```ts
// Before:
return new ClaudeWorkflowCommandBuilder(
  new DefaultClaudeCodeTool(this),
  this.getCLIWrapper(),
  this.getCurrentUserWorkspace()
);

// After:
const ClaudeCodeToolClass = rootServiceRegistry.loadClass('ClaudeCodeTool');
const WorkflowCommandBuilderClass = rootServiceRegistry.loadClass('WorkflowCommandBuilder');
return new WorkflowCommandBuilderClass(
  new ClaudeCodeToolClass(this),
  this.getCLIWrapper(),
  this.getCurrentUserWorkspace()
);
```

Remove the now-unused `DefaultClaudeCodeTool` / `ClaudeWorkflowCommandBuilder` imports; add `rootServiceRegistry`.

**4c. `src/workflow/claude/claude-workflow-command-builder.ts:36`** — swap `new DefaultWorkflowCommand(...)`
```ts
// Before:
return new DefaultWorkflowCommand(commandString, this.cliWrapper, this.workspace.getRoot());

// After:
const WorkflowCommandClass = rootServiceRegistry.loadClass('WorkflowCommand');
return new WorkflowCommandClass(commandString, this.cliWrapper, this.workspace.getRoot());
```

Remove `DefaultWorkflowCommand` import, add `rootServiceRegistry`.

**4d. `src/workflow/workflow-command/default-workflow-command.ts:26`** — swap `new DefaultCLICommand('bash', ['-c', ...])`
```ts
const CLICommandClass = rootServiceRegistry.loadClass('CLICommand');
const command = new CLICommandClass('bash', ['-c', this.commandString]);
```

Remove `DefaultCLICommand` import, add `rootServiceRegistry`.

**4e. `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts:70`** — swap `new DefaultCLICommand(this.executable, args)`
```ts
const CLICommandClass = rootServiceRegistry.loadClass('CLICommand');
return new CLICommandClass(this.executable, args);
```

Remove `DefaultCLICommand` import, add `rootServiceRegistry`.

**Circular-import hazard**: `root-registry.ts` imports all 6 default classes. Three of those (`ClaudeWorkflowCommandBuilder`, `DefaultWorkflowCommand`, `MarshalledCLITool`, `DefaultCLICommand`) would now also import `rootServiceRegistry`. Node ESM handles module cycles as long as the imported symbols aren't accessed at top-level evaluation — and `loadClass` is called inside function bodies (not at module-top), so this is fine. **Verify by running the CLI and the test suite**; if a cycle crashes at load time, the fix is to move the `loadClass` call deeper or split the registry into two layers. Unlikely to be needed.

### Step 4bis: Add the trailing-comment convention to the classwitch how-to guide

File: `/Users/stevepersonal/dev/agentic-hq/classwitch/docs/how-to-guides/how-to-convert-project-to-root-classwitch-project.md`

Scope: this is an *immediate* fix to the classwitch doc — the same precedent as the human's earlier Q5 instruction ("make a change to [the classwitch how-to] to make this very clear for any AI reading it in the future — no need to include in the Jira, needs fixing straight away"). The convention we're baking in: every `loadClass(...)` line should carry a trailing `// Loads <DefaultClassName> (default)` comment so readers don't have to open the registry to see which concrete default is in play.

Changes:

1. **Update the Step 5 "After" code block** (around lines 224–229) to include the trailing comment:
   ```typescript
   import { rootServiceRegistry } from '../classwitch-registry/root-registry.ts';
   // ...
   const ClaudeCodeToolClass = rootServiceRegistry.loadClass('ClaudeCodeTool'); // Loads DefaultClaudeCodeTool (default)
   const tool = new ClaudeCodeToolClass(compositionRoot);
   ```
2. **Add a short convention paragraph** right after the "What changed:" bullet list in Step 5, worded like:
   > **Convention: name the current default in a trailing comment.** After each `loadClass` call, add `// Loads <DefaultClassName> (default)`. The comment names the class that runs *unoverridden* — an override project will legitimately swap it, but readers of the root project shouldn't have to open the registry file to see which concrete default is in play. The word "(default)" flags that the class can be swapped.

This is a doc-only edit inside the classwitch repo — it will be committed on a separate classwitch branch/commit (per the Jira rule that classwitch changes go in their own commits with their own classwitch Jira). **Do not commit this as part of the agentic-hq AHQ-117 commit.** Either stage it on a classwitch working branch locally or leave it uncommitted for the human to review before deciding how to ship it. Flag this to the human at the end of Step 4bis.

No entry needed in the `draft-future-jiras/...classwitch-jira-draft...md` file — per the Q5 precedent, straight-away fixes don't go in the draft.

### Step 5: Centralise `AGENTIC_HQ_WORKSPACE_ROOT` resolution in `app.run()`

File: `/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/cli/app.ts`

Add at the top of `run()`:

```ts
if (!process.env.AGENTIC_HQ_WORKSPACE_ROOT) {
  const thisFileDir = path.dirname(fileURLToPath(import.meta.url));
  process.env.AGENTIC_HQ_WORKSPACE_ROOT = path.resolve(thisFileDir, '..', '..');
}
```

`thisFileDir` is `<agentic-hq-root>/src/cli/`, walking up 2 reaches `<agentic-hq-root>`. When `agentic-hq` is installed as a dep of the override project (`file:../../agentic-hq`), this resolves to `.../node_modules/agentic-hq/` (or the symlinked dep root) — correct target per AHQ-120 Add-On §1.

Add these imports at the top:
```ts
import { fileURLToPath } from 'node:url';
import path from 'node:path';
```

The existing `if (!process.env...)` guard preserves test-injection. Existing e2e tests that already set the env var before calling through the CLI will see their value preserved.

Extend the existing header comment to note: "As of AHQ-117 Add-On §9, `app.run()` resolves its own install directory and sets `AGENTIC_HQ_WORKSPACE_ROOT` (unless already set). This means override projects' `bin/*.cjs` wrappers must NOT set this env var — if they do, they silently point A at the override root and hide A's workflows."

### Step 6: Delete env-var line from `bin/agentic-hq.cjs`

File: `/Users/stevepersonal/dev/agentic-hq/agentic-hq/bin/agentic-hq.cjs`

Delete lines 23–32:
```js
// Tell directory-functions where the agentic-hq workspace lives (AHQ-79)
// ... (NOTE RE REFACTOR block)
process.env.AGENTIC_HQ_WORKSPACE_ROOT = path.join(__dirname, '..');
```

Keep tsx resolution, `cliPath`, `execFileSync`. Add a one-line replacement comment: "AGENTIC_HQ_WORKSPACE_ROOT is now set inside `app.run()` — see AHQ-117 Add-On §9."

### Step 7: Make `ColourfulWorkflowSearchResultsImpl` constructor args optional + switch to cross-package type imports

File: `/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts`

Two changes:

**7a. Replace the inline structural type aliases** (lines 28–44) with real imports from `agentic-hq` (now possible once Step 1 + 2 land):
```ts
import type { WorkflowRegistry, WorkflowSearchResults, Workspace } from 'agentic-hq';
import { AhqWorkspaceImpl, CurrentUserWorkspaceImpl } from 'agentic-hq';
```

**7b. Make the constructor args optional with default instances:**
```ts
constructor(
  private readonly ahqWorkspace: Workspace = new AhqWorkspaceImpl(),
  private readonly currentUserWorkspace: Workspace = new CurrentUserWorkspaceImpl()
) {}
```

Keep the method bodies unchanged — they already delegate correctly.

Update the SRP header comment to reflect the defaulted args and note that the inline type aliases were removed (cross-package imports now available post-conversion).

**Check unit test compatibility**: The existing unit test in the override project (`tests/unit/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.unit.test.ts`) passes stubbed workspaces explicitly. Since defaults are added via `=`, the explicit-arg path still works — test should remain green unchanged.

### Step 8: Check the override project installs A fresh

After the main-repo changes land, run `pnpm install --ignore-workspace` inside `/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/`. This re-syncs the `file:../../agentic-hq` symlink so the widened exports are visible.

### Step 9: Test-then-verify

**9a. `cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm validate`** — typecheck + lint + format + all 131 unit tests must be green.

**9b. `cd /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours && pnpm typecheck && pnpm test:unit`** — override project typecheck + 1 unit test green.

**9c. `cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm test:e2e:cross-workspace-list-workflows && pnpm test:e2e:cross-workspace-demo-math-workflow`** — regression: both e2e tests pass.

**9d. `cd /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours && node bin/temp-agentic-hq-with-colours.cjs list`** — the PRIMARY E2E TEST. Expect output containing:
- `\x1b[32mAvailable workflows (with colours):\x1b[0m` (green header)
- `\x1b[34m...\x1b[0m` wrapping the AHQ workspace section (blue)
- `\x1b[31m...\x1b[0m` wrapping the user workspace section (red)

Capture the raw stdout; assert by grep on the escape codes (since the terminal will *render* the colours, the assertion is on the raw bytes returned). If any of the three colour wrappers is missing, the e2e RED-GREEN test has NOT flipped — stop and diagnose.

### Step 10: TODO — re-read the command file after Step 9

After Steps 0–9 complete (successfully), the `/03-jira-minimal-implementation` command file has instructions for:
- Writing the GREEN phase summary doc (`03-green-phase-summary-of-what-was-implemented.md`)
- Adding a Jira comment
- Presenting to the human
- Writing the `command-output.json`
- Self-terminating

Do not copy those instructions here — re-read the command file at that point to avoid missing anything.

---

## Critical Files

**Modify:**
- `/Users/stevepersonal/dev/agentic-hq/agentic-hq/package.json` (exports widening)
- `/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/cli/app.ts` (loadClass swap + env-var centralisation)
- `/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/kernel/composition-root.ts` (2 swaps)
- `/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/workflow/claude/claude-workflow-command-builder.ts` (1 swap)
- `/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/workflow/workflow-command/default-workflow-command.ts` (1 swap)
- `/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` (1 swap)
- `/Users/stevepersonal/dev/agentic-hq/agentic-hq/bin/agentic-hq.cjs` (delete env-var line + comment)
- `/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts` (cross-package imports + optional defaults)

**Create:**
- `/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/index.ts` (16-symbol barrel)
- `/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/classwitch-registry/root-registry.ts` (6-service registry)
- `/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/interfaces/claude-code-tool.ts` — IF the `ClaudeCodeTool` interface name does not already exist (verify first; see Step 2 Note 1)

## Verification

End-to-end verification run in order (Step 9 expanded):

1. **Typecheck + lint + format + unit tests (main repo)**: `cd agentic-hq && pnpm validate` → green.
2. **Typecheck + unit test (override project)**: `cd temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours && pnpm typecheck && pnpm test:unit` → green.
3. **Regression e2e**: `cd agentic-hq && pnpm test:e2e:cross-workspace-list-workflows && pnpm test:e2e:cross-workspace-demo-math-workflow` → both green.
4. **Primary e2e (RED → GREEN flip)**: `cd temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours && node bin/temp-agentic-hq-with-colours.cjs list` → output contains `\x1b[32m`, `\x1b[34m`, `\x1b[31m` wrapping the header, AHQ section, and user section respectively. Human also visually confirms the terminal shows green/blue/red.

If any step fails, stop and diagnose before moving to the next — don't barrel through.

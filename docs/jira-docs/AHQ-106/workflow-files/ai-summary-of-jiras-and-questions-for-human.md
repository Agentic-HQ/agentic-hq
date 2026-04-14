# AI Summary: AHQ-106

**Jira**: [AHQ-106](https://agentic-hq.atlassian.net/browse/AHQ-106)
**Title**: Do Rest Of Work To Get Dynamic Workflow Discovery Feature Finished
**Status**: Already In Progress (no transition needed)
**Generated**: 2026-04-06 19:35

---

## My Understanding of This Task

AHQ-104 built the foundation of the dynamic workflow-discovery subsystem: 16 interfaces and 18 implementation classes in `src/workflow-discovery/` that scan the AHQ workspace for `ahq-workflow.json` files and produce a flat listing. The `list` subcommand now uses this dynamic discovery, but the **execution** path (`agentic-hq reversal`, `agentic-hq math`, etc.) still relies on the old hardcoded `DEMO_SKILLS` array and `WorkflowSkillsRegistry`, and the listing format is flat (no grouping by workspace or plugin). AHQ-106 finishes the job.

The work has three major themes: (1) **Add user workspace support** so that workflows from the user's current workspace are discovered alongside AHQ's own workflows, with the listing grouped by workspace and plugin. (2) **Replace the hardcoded execution path** so that short-alias subcommands like `agentic-hq reversal` are registered from dynamically discovered workflows, and the `ClaudeCommandBuilder` gets its `--plugin-dir` flags dynamically rather than from a hardcoded list. (3) **Remove all old hardcoded code** (`DEMO_SKILLS`, `WorkflowSkillsRegistry`, `WorkflowSkill`, `PLUGIN_DIR_NAMES`, `TEMPORARILY_ADDED_PLUGIN_DIR`) during the REFACTOR stage.

This involves creating several new concepts (CurrentUserWorkspace, Plugin, PluginDirectory, etc.) following the project's OO design principles: class/interface pairs for every concept, minimal state, delegation/"tell don't ask", `*Impl` naming, and factory `createFrom` patterns. The Jira explicitly acknowledges this is complex and expects significant design thought.

Scope boundary: This Jira completes ALL remaining work for AHQ-103 (the parent story). After this, dynamic workflow discovery is fully operational end-to-end.

## Research Findings

No external research was needed. The codebase, AHQ-104 workflow files, and parent Jira AHQ-103 provide sufficient context for understanding the technical approach.

## Project Design Requirements

**File**: `docs/dev/project-design-requirements.md`

Key requirements relevant to this Jira:

1. **Class/interface pair for every concept** (DR.1) — All new concepts (CurrentUserWorkspace, Plugin, PluginDirectory, Workspace, etc.) must have interface + Impl class pairs. Highly relevant as we're adding many new concepts.

2. **Primitives wrapped immediately into value objects** (DR.2) — Any new string values (e.g. workspace directory paths, plugin directory paths) should be wrapped in typed objects rather than passed as raw strings.

3. **Minimal state, delegation, "tell don't ask"** (DR.3) — The Jira explicitly calls this out for `PluginDirectory`: "should not store/cache fields - it should get them by message passing / delegating to its supplied dependencies." This is the core design constraint.

4. **Data Dictionary + English Language Description** (DR.4) — Must be produced during design/planning phase to validate that all concepts are captured.

5. **Switchability** (DR.5) — Third-party developers should be able to replace any concrete class with their own implementation. Relevant for Workspace, Plugin, and WorkflowSearchResults.

6. **`Impl` naming convention** (DR.6) — All new concrete classes must use `*Impl` suffix.

7. **Balance** (DR.7) — Don't fracture the system to the extreme. The Jira explicitly says "I'm not sure about these categorisations" and wants us to propose the right balance.

## Agreed Decisions (All Questions Resolved)

### Decision 1: Plugin directory passing for execution

**Agreed**: Keep `agentic-hq-core-plugin` and `agentic-hq-utilities-plugin` hardcoded in `PLUGIN_DIR_NAMES` (remove `agentic-hq-demos-plugin`), always added to the command line. These contain cross-cutting concerns (`self-termination` skill, `jira-verbatim-content-extractor` agent) used by workflows across plugins. Additionally, dynamically discovered plugin directories will be passed. A better home for these (e.g. `AhqWorkspaceImpl`) may emerge once the full feature is built.

### Decision 2: User workspace root detection

**Agreed**: Use `process.cwd()` directly as the user’s workspace root. For same-directory detection: when `CurrentUserWorkspaceImpl` is asked to display itself and its directory equals `AGENTIC_HQ_WORKSPACE_ROOT` env var, it simply returns the "Same as AHQ Workspace" message instead of listing plugins/workflows.

### Decision 3: Agreed class/interface hierarchy

**Agreed** (after discussion). Simplified per KISS principle:

| Concept | Interface | Impl Class | Purpose |
|---------|-----------|------------|---------|
| A workspace containing plugins | `Workspace` | (two concrete impls below) | Common contract — has `getWorkflowListingString()`, contains Plugins |
| The AHQ workspace | `Workspace` | `AhqWorkspaceImpl` (modify existing) | Root from `AGENTIC_HQ_WORKSPACE_ROOT` env var (resolved dynamically, not cached) |
| The user’s current workspace | `Workspace` | `CurrentUserWorkspaceImpl` | Root from `process.cwd()` (resolved dynamically). When same dir as AHQ, returns "same as" message |
| A plugin containing workflows | `Plugin` | `PluginImpl` (replaces `AhqWorkflowsImpl`) | Discovers workflows within a plugin, formats per-plugin listing section |
| A plugin’s directory path | `PluginDirectory` | `PluginDirectoryImpl` | Delegates to workspace for root, computes path dynamically (no caching). Can delegate to `AhqDirectory` for file searching |
| Top-level search results | `WorkflowSearchResults` | `WorkflowSearchResultsImpl` (modify existing) | Contains two Workspaces, provides `getWorkflowsListingString()` + `getAllWorkflows()` |

**Ditched** (per discussion):
- `WorkspaceWorkflows` — unnecessary; `Workspace` contains `Plugin`s which contain `AhqWorkflow`s directly. `Workspace.getWorkflowListingString()` is enough (KISS).
- `WorkflowRun` — unnecessary; the existing `WorkflowCommandBuilder.build(skillPath, args)` → `WorkflowCommand.execute()` pipeline handles execution. We just feed it the `fullClaudeSkillCommand` from the discovered `AhqWorkflow`.

**Key design rules** (per human):
- All "resolve root" and similar methods must be **always dynamic** — get the value fresh each time, never store in a field on construction. Simplicity/readability over performance.
- `PluginDirectory` can delegate to `AhqDirectory` for file searching functionality.
- `AhqWorkflow` needs `getShortName()` and `getFullClaudeSkillCommand()` re-exposed on its public interface (they were made private in AHQ-104 REFACTOR A.2 because they had no production callers — now they WILL have production callers for short-alias subcommand registration).

**NOTE FOR RED PHASE AGENT**: The human wants a **detailed exposition** of all classes/interfaces — what they do, how they work, how they interact — as part of the RED phase planning. This is critical to getting the unit tests right. Include a full Data Dictionary table and English Language Description paragraph per the project design requirements.

### Decision 4: Same-workspace display format

**Agreed**: Exact format:
```
Available workflows:

Agentic HQ Workspace (directory: /path/to/ahq):-
Plugin: agentic-hq-demos-plugin
Workflows:
agentic-hq reversal -- --string-to-reverse=’hello there you’
   What it does: Reverses a string (hello world demo)
...

Local Workspace: Same as Agentic HQ Workspace (running from within the AHQ directory)
```

### Decision 5: E2E test assertions

**Agreed**: Minimal assertions (option A). Keep existing checks plus add one or two confirming the new grouped format (e.g., `toContain(‘Plugin:’)`, `toContain(‘Workspace’)`).

---

## Files I Reviewed

- `src/cli/agentic-hq-program.ts` — CLI program factory; creates `list` subcommand + short-alias subcommands from `WorkflowSkillsRegistry`; this is where DEMO_SKILLS meets discovery
- `src/cli/agentic-hq-cli.ts` — Thin entry point wiring `DEMO_SKILLS` + `CompositionRoot` into `createProgram`
- `src/demo/demo-skills.ts` — Hardcoded 5-skill array that must be replaced by dynamic discovery
- `src/workflow/workflow-skills/workflow-skills-registry.ts` — Registry class wrapping DEMO_SKILLS; used for short-alias subcommand registration; to be replaced
- `src/interfaces/workflow-skill.ts` — Interface for WorkflowSkill (shortName, fullPath, description, example)
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` — Builds Claude CLI commands with hardcoded `PLUGIN_DIR_NAMES` + `TEMPORARILY_ADDED_PLUGIN_DIR`; needs dynamic plugin dir resolution
- `src/kernel/composition-root.ts` — Stateless DI wiring; creates `ClaudeCommandBuilder` with `AgenticHqInstallation`
- `src/workspace/default-agentic-hq-installation.ts` — Resolves AHQ root from env var or git root
- `src/interfaces/user-project-workspace.ts` — Existing `UserProjectWorkspace` interface with `getRoot()`/`getTempDir()`
- `src/workspace/default-user-project-workspace.ts` — Resolves user workspace root from git workspace
- `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts` — Current top-level: creates single `AhqWorkspaceImpl` + `AhqWorkflowsImpl`; needs to support two workspaces
- `src/workflow-discovery/workflow-listing/ahq-workflows-impl.ts` — Discovers workflows in a workspace; may be replaced by `PluginImpl`
- `src/workflow-discovery/workflow/ahq-workflow-impl.ts` — Individual workflow entity with listing entry formatting
- `src/workflow-discovery/workspace/ahq-workspace-impl.ts` — Current workspace impl using `AGENTIC_HQ_WORKSPACE_ROOT` env var
- `src/workflow-discovery/workspace/ahq-directory-impl.ts` — Uses `fast-glob` to find files matching a pattern
- `src/workflow-discovery/interfaces/` — All 16 interface files reviewed for contract understanding
- `src/workflow/claude/claude-workflow-command-builder.ts` — How `builder.build(skillPath, args)` resolves and executes workflows
- `tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts` — E2E test for listing; assertions need updating for new format
- `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` — E2E test for execution; must still pass after removing hardcoded plugin dirs
- `docs/jira-docs/AHQ-104/workflow-files/unit-test-files/03-green-phase-implementation-plan-copy.md` — AHQ-104 GREEN plan with data dictionary and English description
- `docs/jira-docs/AHQ-104/workflow-files/unit-test-files/03-green-phase-summary-of-what-was-implemented.md` — What was built in AHQ-104
- `docs/jira-docs/AHQ-104/workflow-files/unit-test-files/04b-refactor-phase-complete.md` — AHQ-104 refactoring summary
- `docs/jira-docs/AHQ-104/workflow-files/e2e-test-files/04a-refactor-phase-proposed-refactors.md` — Deferred refactors from AHQ-104 e2e phase
- `docs/dev/project-design-requirements.md` — OO design requirements: class/interface pairs, minimal state, delegation, switchability
- All 5 `ahq-workflow.json` files — Confirmed format with nested `author` field

**Key findings:**
- The `DEMO_SKILLS` array in `demo-skills.ts` exactly mirrors what's in the 5 `ahq-workflow.json` files — the discovery subsystem already finds these same workflows dynamically
- `ClaudeCommandBuilder` has both `PLUGIN_DIR_NAMES` (hardcoded array of 3 plugin names) and `TEMPORARILY_ADDED_PLUGIN_DIR` (a literal path to a test workspace) — both need replacing
- The `WorkflowSkillsRegistry.resolveSkillPath()` method is NOT actually called anywhere — only `getSkills()` is used (for registering short-alias subcommands). The discovery subsystem already has `FullClaudeSkillCommand` which produces the same format
- The AHQ-104 e2e refactor doc has 8 proposed refactors, of which P.5 ("Replace DEMO_SKILLS with discovery-based short-alias routing") and P.7 ("Remove old files") are directly in scope for this Jira
- `AhqWorkflowsImpl` currently takes an `AhqWorkspace` and discovers ALL workflows across ALL plugins — no per-plugin grouping exists yet

## Test Types And Tests We Will Be Implementing

**Test types: `unit, e2e`** (in that order, each with full RED -> GREEN -> REFACTOR -> VALIDATE cycle)

### Unit Tests

**New concepts to test (class/interface pairs):**

1. **CurrentUserWorkspaceImpl** (`current-user-workspace-impl.unit.test.ts`)
   - should use process.cwd() as workspace root (resolved dynamically each time)
   - should find ahq-workflow.json files in a temp directory structure
   - should return empty files collection when no plugins exist
   - should return "Same as Agentic HQ Workspace" message when cwd equals AGENTIC_HQ_WORKSPACE_ROOT

2. **PluginImpl** (`plugin-impl.unit.test.ts`) — replaces AhqWorkflowsImpl
   - should discover workflows within a single plugin's skills directory
   - should return listing entries grouped under a plugin header ("Plugin: <name>\nWorkflows:")
   - should return getPluginId from the plugin directory name
   - should handle plugin with no workflows (no ahq-workflow.json files)

3. **PluginDirectoryImpl** (`plugin-directory-impl.unit.test.ts`)
   - should resolve to the correct directory path by delegating to workspace (dynamic, no caching)
   - should return its path via toString()

4. **AhqWorkspaceImpl** (modify existing `ahq-workspace-impl.unit.test.ts`)
   - should implement Workspace interface
   - should discover plugins (not workflows directly)
   - should format listing with workspace header ("Agentic HQ Workspace (directory: ...):-")
   - should contain per-plugin sections via getWorkflowListingString()

5. **WorkflowSearchResultsImpl** (modify existing `workflow-search-results-impl.unit.test.ts`)
   - should include both AHQ and user workspace sections
   - should show "same as AHQ workspace" message when directories are the same
   - should display AHQ workspace section before local workspace section
   - should provide getAllWorkflows() for short-alias subcommand registration

6. **AhqWorkflowImpl** (modify existing `ahq-workflow-impl.unit.test.ts`)
   - should re-expose getShortName() and getFullClaudeSkillCommand() on public interface (needed for execution registration)

**Modifications to existing tests:**

7. **AhqWorkflowsImpl tests** — Will be replaced/renamed to PluginImpl tests

8. **Short-alias subcommand registration tests** (in `tests/unit/cli/`)
   - should register subcommands from dynamically discovered workflows (not DEMO_SKILLS)
   - should pass the correct fullPath from getFullClaudeSkillCommand() to builder.build()

**NOTE FOR RED PHASE AGENT**: The human wants a **detailed exposition** of all classes/interfaces — what they do, how they work, how they interact — as part of the RED phase planning. This is essential before writing tests. Include a full Data Dictionary table and English Language Description paragraph per `docs/dev/project-design-requirements.md`.

### E2E Tests

1. **cross-workspace-list-workflows.e2e.test.ts** (modify existing)
   - Update assertions to expect new grouped format:
     - Output contains workspace header(s) (e.g. `Agentic HQ Workspace`)
     - Output contains plugin header(s) (e.g. `Plugin:`)
     - Output still contains `create-workflow` and `What it does: Create`

2. **cross-workspace-string-reversal.e2e.test.ts** (verify still passes)
   - Run existing test after removing all hardcoded code
   - Confirms execution path works with dynamically discovered plugin dirs
   - Bundle this check into the single e2e TDD cycle per Jira instructions

## Deferred Work For E2E Phase: Wire `registerWorkflowsWith()` Into CLI And Delete Old DEMO_SKILLS Stack

**Source**: Unit test REFACTOR phase (04a), Refactor 2.5 — deferred to e2e REFACTOR by human decision.

**Why it was deferred**: This work touches the CLI entry point, builder interface, and removes foundational code. It requires running e2e tests to verify (`pnpm test:e2e:cross-workspace-string-reversal`, `pnpm test:e2e:cross-workspace-list-workflows`), making it better suited for the e2e phase than the unit test phase.

**Jira requirement**: "All code/tests relating to the old (hard coded method) of listing and running workflows must be deleted and tests run to confirm all still working after deletion. Done during REFACTOR stage."

### What Needs To Happen (Step By Step)

1. **Update `WorkflowCommandBuilder` interface** (`src/interfaces/workflow-command-builder.ts`)
   - Currently: `build(skillPath: string, passthroughArgs: string[]): Promise<WorkflowCommand>` (2 params)
   - Change to: `build(skillPath: string, passthroughArgs: string[], pluginDir?: { toString(): string }): Promise<WorkflowCommand>` (3 params, optional for backward compat)
   - `WorkflowRegistryImpl` already calls `builder.build(fullCommand, args, pluginDir)` with 3 params — currently typed inline. After this change it can use the actual interface.

2. **Update `ClaudeWorkflowCommandBuilder`** (`src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts`)
   - Accept the optional `pluginDir` 3rd parameter in `build()`
   - When `pluginDir` is provided, add it to the `--plugin-dir` flags alongside the hardcoded `agentic-hq-core-plugin` and `agentic-hq-utilities-plugin`
   - When `pluginDir` is NOT provided (old code path via `--workflow-command-supplier`), keep existing behavior

3. **Change `createProgram()`** (`src/cli/agentic-hq-program.ts`)
   - Remove `registry: WorkflowSkillsRegistry` parameter
   - Add `searchResults: WorkflowSearchResults` parameter (or create it inline)
   - Replace the `for (const skill of registry.getSkills())` loop (lines 44-54) with: `searchResults.registerWorkflowsWith(new WorkflowRegistryImpl(program, builder))`
   - Keep the `list` subcommand as-is (it already uses `WorkflowSearchResultsImpl`)
   - Keep the `--workflow-command-supplier` action as-is (backward compat for direct skill path invocation)
   - NOTE: `WorkflowRegistryImpl` needs `program.enablePositionalOptions()` to be called before subcommands use `passThroughOptions()` — this is already done at line 30

4. **Change `agentic-hq-cli.ts`** (`src/cli/agentic-hq-cli.ts`)
   - Remove: `import { DEMO_SKILLS } from '../demo/demo-skills.js'`
   - Remove: `import { WorkflowSkillsRegistry } from '../workflow/workflow-skills/workflow-skills-registry.js'`
   - Add: `import { WorkflowSearchResultsImpl } from '../workflow-discovery/workflow-listing/workflow-search-results-impl.js'`
   - Change: `createProgram(builder, new WorkflowSkillsRegistry(DEMO_SKILLS)).parse()` → `createProgram(builder, new WorkflowSearchResultsImpl()).parse()` (or similar, depending on how `createProgram` signature evolves)

5. **Delete old files**:
   - `src/demo/demo-skills.ts` — hardcoded 5-skill array
   - `src/workflow/workflow-skills/workflow-skills-registry.ts` — old registry class
   - `src/interfaces/workflow-skill.ts` — old WorkflowSkill interface
   - Check for and delete any associated test files (grep for `workflow-skills-registry`, `demo-skills`, `workflow-skill` in `tests/`)

6. **Also remove `TEMPORARILY_ADDED_PLUGIN_DIR`** from `ClaudeCommandBuilder`
   - `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` has a hardcoded path: `const TEMPORARILY_ADDED_PLUGIN_DIR = '/Users/stevepersonal/dev/agentic-hq/test-workflow-workspaces/steve-test-workflow-workspace-001'`
   - This was a temporary hack from AHQ-99 — no longer needed once plugin dirs are dynamic
   - Also consider whether `agentic-hq-demos-plugin` can be removed from the hardcoded `PLUGIN_DIR_NAMES` list (it should be discovered dynamically now)

7. **Run e2e tests to verify**:
   - `pnpm test:e2e:cross-workspace-string-reversal` — confirms execution path still works
   - `pnpm test:e2e:cross-workspace-list-workflows` — confirms listing still works

### Key Interface Mismatch To Resolve

`WorkflowRegistryImpl` currently types its builder parameter inline:
```typescript
private readonly builder: { build: (skillPath: string, args: string[], pluginDir: { toString(): string }) => Promise<{ execute: () => void }> }
```

This takes 3 params, but `WorkflowCommandBuilder` interface currently takes 2. Step 1 above resolves this by adding the optional 3rd param to the interface.

### Files Affected

| File | Action |
|------|--------|
| `src/interfaces/workflow-command-builder.ts` | MODIFY — add optional `pluginDir` param |
| `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` | MODIFY — accept `pluginDir`, use it for `--plugin-dir`, remove `TEMPORARILY_ADDED_PLUGIN_DIR` |
| `src/cli/agentic-hq-program.ts` | MODIFY — replace `WorkflowSkillsRegistry` with `WorkflowSearchResults` + `WorkflowRegistryImpl` |
| `src/cli/agentic-hq-cli.ts` | MODIFY — wire `WorkflowSearchResultsImpl` instead of `DEMO_SKILLS` |
| `src/cli/workflow-registry-impl.ts` | MODIFY — use `WorkflowCommandBuilder` interface instead of inline type |
| `src/demo/demo-skills.ts` | DELETE |
| `src/workflow/workflow-skills/workflow-skills-registry.ts` | DELETE |
| `src/interfaces/workflow-skill.ts` | DELETE |
| Associated test files | DELETE or MODIFY |

### What Was Already Done In Unit Test Phase

- `WorkflowRegistryImpl` fully implemented and unit tested — registers Commander subcommands from discovered workflows
- `WorkflowSearchResults.registerWorkflowsWith()` fully implemented — chains through Workspace → Plugin → WorkflowRegistry
- `CurrentUserWorkspaceImpl` handles "same as AHQ" detection (no duplicate registrations)
- All 142 unit tests pass

The unit test phase built and tested all the pieces. The e2e phase just needs to wire them together and delete the old code.

## Ready for Next Step

All questions resolved, test types confirmed. This summary is complete.

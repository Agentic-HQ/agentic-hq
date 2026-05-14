# Plan: Extract listing formatting into a `ListingFormatter` class

## Context

`agentic-hq list` was recently overhauled (colours, hierarchy, single-line workspace headers). The remaining smell is layering: domain entities (`WorkspaceImpl`, `PluginImpl`, `AhqWorkflowImpl`) import colour helpers from `src/cli/colors.js` and own their own listing methods — so the layering arrow points **discovery → CLI**, which is backwards.

The goal: pull every byte of listing assembly into a new `src/cli/listing-formatter.ts`. Domain entities expose **structured data** (`getDisplayName`, `getPlugins`, `getName`, `getWorkflows`, `getExampleCommand`) and stop importing from `src/cli/`. The visual output stays byte-identical.

Steve's explicit asks for `ListingFormatter`:
- DSL-style code — each line reads like English
- Named constants that "inform that language" (literal text + structural punctuation)
- One JSDoc comment per method describing what it produces
- One public method (`formatWorkflowsListing`); everything else private

Verified the plan against current code via Explore — every file path, line range, and call site lines up.

---

## Approach

### 1. New file — `src/cli/listing-formatter.ts`

A `ListingFormatter` class. No constructor deps (it's pure presentation over data). One public method.

**Constants — literal text fragments:**
```
TITLE_TEXT = 'Available workflows'
PLUGIN_LABEL = 'Plugin: '
WORKSPACE_NAME_SUFFIX = ':'
LOCAL_WORKSPACE_LABEL = 'Local Workspace'
SAME_AS_AHQ_MESSAGE_TEXT = 'Same as Agentic HQ Workspace (running from within the AHQ directory)'
```

**Constants — structural punctuation:**
```
LINE_BREAK = '\n'
BLANK_LINE_BETWEEN_BLOCKS = '\n\n'
SPACE = ' '
EXAMPLE_ARGS_SEPARATOR = ' -- '
```

**Public method:**
- `formatWorkflowsListing(ahqWorkspace: Workspace, localWorkspace: Workspace): string`

**Private methods (each with a `/** … */` JSDoc):**
- `titleLine()` — bold-cyan title row
- `workspaceBlock(workspace)` — header + plugin blocks, joined with blank lines
- `localWorkspaceBlock(localWorkspace)` — "Same as AHQ" message or full block, switched on `isAhqWorkspace()`
- `workspaceHeaderLine(workspace)` — `  {name}: {path}`
- `allPluginBlocksIn(workspace)` — `string[]`, empties filtered
- `pluginBlock(plugin)` — heading + workflow entries, or `''` when no workflows
- `pluginHeadingLine(plugin)` — `    Plugin: {name}`
- `workflowEntry(workflow)` — command line + description line
- `workflowCommandLine(workflow)` — bold-green command + dim args
- `workflowDescriptionLine(workflow)` — indented description
- `sameAsAhqMessageLine()` — the one-line "Same as AHQ" row
- `surroundWithBlankLines(content)` — prepends and appends a blank line to `content`; reproduces the leading + trailing blank line the current output has

Top-level shape:
```
return this.surroundWithBlankLines(
  [this.titleLine(), this.workspaceBlock(ahqWs), this.localWorkspaceBlock(localWs)]
    .join(BLANK_LINE_BETWEEN_BLOCKS)
);
```

### 2. Interface changes

`src/workflow-discovery/interfaces/workspace.ts`
- **Remove** `getWorkflowListingString(): string`
- **Add** `getDisplayName(): string`
- **Add** `getPlugins(): Plugin[]`
- Keep `registerWorkflowsWith`, `getRoot`, `getTempDir`, `getDotAgenticHqDir`, `isAhqWorkspace`

`src/workflow-discovery/plugin/plugin.ts`
- **Remove** `getPluginListingString(): string`
- **Add** `getName(): string`
- **Add** `getWorkflows(): AhqWorkflow[]`
- Keep `registerWorkflowsWith`
- Update the "not currently referenced" comment — after this refactor, `Workspace.getPlugins()` returns `Plugin[]`, so the interface **is** referenced.

`src/workflow-discovery/interfaces/ahq-workflow.ts`
- **Remove** `getWorkflowListingEntryString(): string`
- **Add** `getExampleCommand(): ExampleCommand`
- Keep `getShortName`, `getDescription`, `getFullClaudeSkillCommand`

### 3. Impl changes (drop CLI imports)

`src/workflow-discovery/workspace/workspace-impl.ts`
- Drop imports of `workspaceName`, `workspacePath` (colours) and `WORKSPACE_INDENT`
- Remove `getWorkflowListingString()`
- Add `getDisplayName()` returning `this.displayName`
- **Rename** private `discoverPlugins()` → public `getPlugins(): Plugin[]`

`src/workflow-discovery/workspace/ahq-workspace-impl.ts`
- Remove `getWorkflowListingString()`
- Add `getDisplayName()` and `getPlugins()` — both delegate to `createDelegate()`

`src/workflow-discovery/workspace/current-user-workspace-impl.ts`
- Drop imports of `subtle`, `workspaceName`, `WORKSPACE_INDENT`
- Drop `SAME_AS_AHQ_MESSAGE` constant
- Remove `getWorkflowListingString()` entirely (the same-as-AHQ branch moves to the formatter)
- Add `getDisplayName()` and `getPlugins()` — both delegate to `createDelegate()`
- **Keep** `registerWorkflowsWith()`'s same-as-AHQ early-return — that's a domain concern (no duplicate registration), not formatting

`src/workflow-discovery/plugin/plugin-impl.ts`
- Drop imports of `pluginHeading`, `PLUGIN_INDENT`
- Remove `getPluginListingString()`
- Add `getName()` returning `this.pluginName`
- **Rename** private `discoverWorkflows()` → public `getWorkflows(): AhqWorkflow[]`

`src/workflow-discovery/workflow/ahq-workflow-impl.ts`
- Drop imports of `argsText`, `commandText`, `COMMAND_INDENT`, `DESCRIPTION_INDENT`
- Drop `ARGS_SEPARATOR` constant (moves into formatter)
- Remove `getWorkflowListingEntryString()`
- Make `getExampleCommand()` **public** (currently private)

### 4. Orchestrator change

`src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts`
- Drop `title` import and `WORKFLOWS_LIST_TITLE` constant
- Add a `ListingFormatter` field (constructed in the constructor)
- `getWorkflowsListingString()` becomes a one-line delegation:
  ```
  return this.formatter.formatWorkflowsListing(this.ahqWorkspace, this.currentUserWorkspace);
  ```

### 5. Test changes

**Stub fixups — 7 test files have inline `Workspace` stubs typed against the interface; remove `getWorkflowListingString`, add `getDisplayName` + `getPlugins`:**
- `tests/unit/tools/marshalled-cli-tool.unit.test.ts` (1 stub)
- `tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts` (1 stub via `fakeWorkspace` factory)
- `tests/unit/tools/claude-code/claude-command-builder.unit.test.ts` (2 stubs: `mockAhqWorkspace`, `mockUserWorkspace`)
- `tests/unit/io/marshalling/json-file-io-marshaller-session.unit.test.ts` (1 stub)
- `tests/unit/workflow/claude/claude-workflow-command-builder.unit.test.ts` (1 stub)
- `tests/unit/claude-code-tool/claude-code-tool-with-injected-config.unit.test.ts` (2 stubs)

**Stub fixups — 2 test files have inline `AhqWorkflow` stubs; remove `getWorkflowListingEntryString`, add `getExampleCommand`:**
- `tests/unit/cli/agentic-hq-program.unit.test.ts` (2 stubs)
- `tests/unit/cli/workflow-registry-impl.unit.test.ts` (1 stub in `createStubWorkflow` helper)

**Behavioural test rewrites — 5 files lose their listing tests and gain getter-based behavioural tests** (preserve test behavioural intent per `feedback_preserve_test_behavioural_intent_when_modernising`):

- `tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts`
  - Old: `getWorkflowListingString()` contains header / plugin sections / not-contains-plugin when empty
  - New: `getDisplayName()` returns constructor arg; `getPlugins()` returns expected plugin names; `getPlugins()` returns `[]` for empty workspace

- `tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts`
  - Old: listing contains 'Agentic HQ Workspace' / plugins
  - New: `getDisplayName()` returns 'Agentic HQ Workspace'; `getPlugins()` returns env-var-rooted plugins

- `tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts`
  - Old: 'Same as AHQ' listing tests, 'Local Workspace' header tests
  - New: `getDisplayName()` returns 'Local Workspace'; `getPlugins()` returns cwd plugins; `isAhqWorkspace()` true when cwd === env var
  - **Keep** the `registerWorkflowsWith()` no-duplicates test

- `tests/unit/workflow-discovery/plugin/plugin-impl.unit.test.ts`
  - Old: `getPluginListingString()` shape tests
  - New: `getName()` returns plugin name; `getWorkflows()` returns expected workflow short names; `getWorkflows()` returns `[]` when no `ahq-workflow.json` files

- `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts`
  - Old: `getWorkflowListingEntryString()` shape test
  - New: `getExampleCommand().toString()` returns expected string; `getExampleCommand()` throws when `shortId` missing

**`tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts`** — keep existing behavioural assertions (output shape unchanged), update file-level JSDoc to reflect delegation-to-formatter design.

**New file — `tests/unit/cli/listing-formatter.unit.test.ts`** (per `feedback_unit_test_file_per_class`):

Coverage:
- Title appears in output
- Workspace headers use single-line `Name: /path` format
- Plugin headings use `Plugin: ` prefix
- Workflow command + description appear on adjacent lines
- Empty plugins filtered out (no plugin section when `getWorkflows()` is empty)
- When `localWorkspace.isAhqWorkspace()` is `true`, "Same as Agentic HQ Workspace" appears instead of the full local block
- When `localWorkspace.isAhqWorkspace()` is `false`, full local block appears

Use plain object-literal stubs for `Workspace` / `Plugin` / `AhqWorkflow`. Don't assert ANSI codes (TTY check disables colour in test env).

---

## Critical files

**New:**
- `src/cli/listing-formatter.ts`
- `tests/unit/cli/listing-formatter.unit.test.ts`

**Modified (src):**
- `src/workflow-discovery/interfaces/workspace.ts`
- `src/workflow-discovery/interfaces/ahq-workflow.ts`
- `src/workflow-discovery/plugin/plugin.ts`
- `src/workflow-discovery/workspace/workspace-impl.ts`
- `src/workflow-discovery/workspace/ahq-workspace-impl.ts`
- `src/workflow-discovery/workspace/current-user-workspace-impl.ts`
- `src/workflow-discovery/plugin/plugin-impl.ts`
- `src/workflow-discovery/workflow/ahq-workflow-impl.ts`
- `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts`

**Modified (tests):** 7 stub-Workspace files, 2 stub-AhqWorkflow files, 6 behavioural unit-test files (5 rewrites + 1 JSDoc update) — see Section 5 above.

**Reused existing utilities** (already in place from prior refactors — no changes needed):
- `src/cli/colors.ts` — `title`, `workspaceName`, `workspacePath`, `pluginHeading`, `commandText`, `argsText`, `subtle`
- `src/cli/listing-indent.ts` — `WORKSPACE_INDENT`, `PLUGIN_INDENT`, `COMMAND_INDENT`, `DESCRIPTION_INDENT`

---

## Order of operations (minimises broken intermediate states)

1. Create `src/cli/listing-formatter.ts` (transient TS errors expected — it references getters not yet on the interface)
2. Update the 3 interfaces (remove old methods, add new)
3. Update all 5 impls (add getters, remove listing methods, drop CLI imports)
4. Update `WorkflowSearchResultsImpl` to delegate to formatter
5. Update 9 stub-test files (7 Workspace stubs + 2 AhqWorkflow stubs)
6. Rewrite 5 behavioural unit-test files
7. Create `tests/unit/cli/listing-formatter.unit.test.ts`
8. Update JSDoc on `workflow-search-results-impl.unit.test.ts`
9. Update the "not currently referenced" comment on `Plugin` interface

---

## Verification

1. `pnpm typecheck` — earliest signal for missed stub fixups
2. `pnpm validate` — full gate: typecheck + lint + format + tests
3. Run the binary locally in the AHQ repo to confirm output is byte-identical:
   ```
   AGENTIC_HQ_WORKSPACE_ROOT="$(pwd)" node bin/agentic-hq.cjs list
   ```
4. Cross-workspace check — seed a temp workspace with a plugin's `ahq-workflow.json`, run `agentic-hq list` from there with `AGENTIC_HQ_WORKSPACE_ROOT` pointing back to the AHQ repo; confirm both workspaces render correctly (this exercises the "different from AHQ" branch of `localWorkspaceBlock`).
5. Diff the visual output against the pre-refactor output — must be **byte-identical**. If a test breaks because of an output change, fix the formatter, not the test.

---

## Notes / honoured constraints

- **Layering** ends up: CLI → discovery (clean). Domain entities no longer import from `src/cli/`.
- **API change**: `discoverPlugins` / `discoverWorkflows` become public `getPlugins` / `getWorkflows` (rename, not wrap — cleaner per Steve's preference for entity-as-data).
- **Behavioural-intent preservation** (`feedback_preserve_test_behavioural_intent_when_modernising`): each removed assertion's intent is re-expressed in the new getter form, not weakened. E.g. "listing has no `Plugin:`" → "`getPlugins()` returns `[]`".
- **No instanceof / private-field peeking in tests** (`feedback_no_instanceof_in_tests`): formatter tests use plain-object stubs.
- **Unit-test file per class** (`feedback_unit_test_file_per_class`): new formatter test mirrors `src/cli/listing-formatter.ts` at `tests/unit/cli/listing-formatter.unit.test.ts`.
- **Don't commit without `/commit`** — no git operations performed by this work.

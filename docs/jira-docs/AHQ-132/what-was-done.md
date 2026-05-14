# AHQ-132 — What Was Done

## Jira goal

Improve the `agentic-hq list` output so it is easier to scan, and clean up
the underlying design so listing formatting is no longer entangled with
workflow discovery.

The work happened in three stages on this branch:

1. **Visual restyle of the `list` output** (committed as the WIP commit
   `2fe6de3` — colour, indentation, blank-line separators, collapsed
   empty plugins).
2. **Structural refactor — extract `ListingFormatter`** (committed as
   `897fd97` — pulled all listing assembly into a single CLI class so
   domain entities expose data, not formatting).
3. **Push the command/args split down into `ExampleCommand`**
   (uncommitted on this branch — removed the formatter's string-parsing
   of the joined `agentic-hq foo -- args` example by giving
   `ExampleCommand` `getCommandPart()` / `getArgsPart()` accessors).

All three are described below, with a before/after of the design vs `main`.

---

## Stage 1 — visual restyle of the `list` output

### Before (`main`)

```
Available workflows:

Agentic HQ Workspace (directory: /Users/.../agentic-hq):-
Plugin: demos
Workflows:
agentic-hq math -- --input-number=11
   What it does: Solves math problems
agentic-hq reversal -- --string-to-reverse='hi'
   What it does: Reverses a string

Local Workspace: Same as Agentic HQ Workspace (running from within the AHQ directory)
```

- Flat, all-the-same-weight text with `:-` and `\nWhat it does: …` markers.
- No visual hierarchy — workspace, plugin and workflow lines all sit at
  the same indent.
- Empty plugins (no `ahq-workflow.json` files) still printed a `Plugin:`
  heading with an empty workflow list under it.

### After (this branch)

```

  Available workflows

  Agentic HQ Workspace: /Users/.../agentic-hq

    Plugin: demos

      agentic-hq math -- --input-number=11
        Solves math problems

      agentic-hq reversal -- --string-to-reverse='hi'
        Reverses a string

  Local Workspace: Same as Agentic HQ Workspace (running from within the AHQ directory)

```

- Title in **bold cyan**; workspace names **bold**, paths **dim**; plugin
  headings **bold yellow**; example commands **bold green** with the
  ` -- args` portion in **dim**; the "Same as AHQ" message in **dim**.
- Single-line workspace header (`Name: /path`) instead of the previous
  `Name (directory: /path):-`.
- Hierarchical indentation: workspace → plugin → workflow command →
  description.
- Blank lines between workspace blocks, between plugins, and between
  workflow entries — output breathes instead of running together.
- Plugins with zero workflows are filtered out — no orphan headings.
- Colour is auto-disabled when stdout isn't a TTY (piped output, e2e
  tests under `execSync`, `NO_COLOR=1`, `TERM=dumb`).

### Why this is better

- **Scannable.** The eye finds workspace boundaries instantly via the
  bold name + dim path, then drops into plugin headings, then into
  command/description pairs.
- **Hierarchy is now obvious from indentation alone** — even with
  colour stripped (CI logs, piped output), the structure is preserved.
- **No noise from empty plugins** — a plugin with no runnable workflows
  no longer wastes a heading on the screen.

---

## Stage 2 — structural refactor: `ListingFormatter`

### Before (`main`)

Listing formatting was scattered across the domain entities:

| File | Listing concern |
| --- | --- |
| `WorkflowSearchResultsImpl` | Held `WORKFLOWS_LIST_HEADER`; concatenated header + workspace sections with `\n\n`. |
| `WorkspaceImpl` | `getWorkflowListingString()` built the `Name (directory: /path):-` header and joined plugin sections. |
| `CurrentUserWorkspaceImpl` | Owned the `SAME_AS_AHQ_MESSAGE` constant *and* the listing branch that swapped in for the local block. |
| `PluginImpl` | `getPluginListingString()` produced `Plugin: {name}\nWorkflows:\n{entries}`. |
| `AhqWorkflowImpl` | `getWorkflowListingEntryString()` produced the example-command + `What it does:` line, with `WHAT_IT_DOES_LINE_PREFIX` lived in the file. |

The layering arrow ran **domain → CLI**: domain entities imported colour
helpers (`title`, `pluginHeading`, …) and indent constants from
`src/cli/`. That meant any change to the listing's visual contract
required edits in four or five domain files, and the formatting
vocabulary was duplicated across them.

### After (this branch)

A new class — `src/cli/listing/listing-formatter.ts` — owns the entire
listing string assembly. Domain entities expose plain data:

| Interface | Old listing method | New data-shaped methods |
| --- | --- | --- |
| `Workspace` | `getWorkflowListingString()` | `getDisplayName()`, `getPlugins()` |
| `Plugin` | `getPluginListingString()` | `getName()`, `getWorkflows()` |
| `AhqWorkflow` | `getWorkflowListingEntryString()` | `getExampleCommand()` *(now public; was private)* |

`WorkflowSearchResultsImpl` no longer owns any listing strings — it
constructs a `ListingFormatter` and delegates in one line:

```ts
getWorkflowsListingString(): string {
  return this.formatter.formatWorkflowsListing(this.ahqWorkspace, this.currentUserWorkspace);
}
```

`ListingFormatter` has **one public method**
(`formatWorkflowsListing(ahq, local)`) and a small ladder of private
methods written in DSL style — each reads as English over named
constants:

```ts
const body = [
  this.titleLine(),
  this.workspaceBlock(ahqWorkspace),
  this.localWorkspaceBlock(localWorkspace),
].join(BLANK_LINE_BETWEEN_BLOCKS);
return LINE_BREAK + body + LINE_BREAK;
```

Other structural moves done as part of the refactor:

- **All listing files live under `src/cli/listing/`** — formatter,
  colour helpers (`colors.ts`), indent constants (`listing-indent.ts`)
  and their tests under `tests/unit/cli/listing/`. Easy to grep, easy
  to delete as a unit if `list` ever changes shape again.
- **Colour helpers renamed** from noun-form (`title`, `pluginHeading`,
  `subtle`, …) to verb-prefix `formatXxx` form (`formatTitle`,
  `formatPluginHeading`, `formatSameAsAhqMessageLine`, …) — they're
  transformers, so they read better as imperative verbs at call sites.
- **`CurrentUserWorkspaceImpl` no longer owns the "Same as AHQ"
  message text.** The duplicate-prevention behaviour stays in its
  `registerWorkflowsWith` (a domain concern — don't register workflows
  twice), but the listing branch moves to `ListingFormatter`, which
  reads `isAhqWorkspace()` directly.
- **9 stub-test files updated** (Workspace and AhqWorkflow stubs swap
  the old listing methods for the new getters).
- **5 behavioural unit-test files rewritten** to assert through the new
  getter API; the behavioural intent of every removed assertion is
  preserved (per `feedback_preserve_test_behavioural_intent_when_modernising`).
- **New test file** `tests/unit/cli/listing/listing-formatter.unit.test.ts`
  — 9 behavioural tests covering title, workspace headers, plugin
  headings, command/description adjacency, empty-plugin filtering, the
  same-as-AHQ branch, the full-local branch, and leading/trailing
  blank lines.

### Why this is better

- **Layering arrow flips: CLI → discovery (one-way).** Domain entities
  no longer import from `src/cli/`. The presentation layer reads
  domain data; the domain doesn't know presentation exists.
- **Single source of truth for the visual contract.** All text
  fragments (`'Available workflows'`, `'Plugin: '`, `' -- '`, the
  "Same as AHQ" message), all spacing rules, and all colour/indent
  choices live in one file. Changing the visual contract is a
  one-file edit instead of a five-file hunt.
- **Domain entities now have one job each, and it isn't formatting.**
  - `WorkspaceImpl` discovers plugins and exposes them.
  - `PluginImpl` discovers workflows and exposes them.
  - `AhqWorkflowImpl` exposes its metadata value objects.
- **`ListingFormatter` reads like prose.** Named constants
  (`TITLE_TEXT`, `PLUGIN_LABEL`, `BLANK_LINE_BETWEEN_BLOCKS`, …) and a
  ladder of small `titleLine` / `workspaceBlock` / `pluginBlock` /
  `workflowEntry` private methods make the assembly self-documenting.
  A reader can see the whole visual contract by scanning one ~180-line
  file.
- **Tests changed direction with the refactor.** Old tests sat at
  the formatter-leaks-into-domain layer (e.g. "does the workspace's
  listing string contain the plugin heading?"). New tests sit at the
  right layer: domain tests assert data
  (`workspace.getPlugins().map(p => p.getName())`), and formatter
  tests assert the assembled string via plain-object stubs — observing
  behaviour through the public output, not through implementation
  internals (per `feedback_no_instanceof_in_tests`).
- **Output is byte-identical to Stage 1.** The refactor was a pure
  internal reorganisation; verified by diffing the binary's `list`
  output against a pre-refactor baseline (both the same-as-AHQ branch
  and the cross-workspace branch).

---

## Stage 3 — push the command/args split down into `ExampleCommand`

### Before (end of Stage 2)

`ListingFormatter.workflowCommandLine` rendered the example command in
two colours (bold-green command-half, dim args-half) by **re-parsing the
joined string** that `ExampleCommand.toString()` had just assembled:

```ts
private workflowCommandLine(workflow: AhqWorkflow): string {
  const example = workflow.getExampleCommand().toString();
  const separatorIndex = example.indexOf(EXAMPLE_ARGS_SEPARATOR); // ' -- '
  const commandPart = separatorIndex === -1 ? example : example.slice(0, separatorIndex);
  const argsPart = separatorIndex === -1 ? '' : example.slice(separatorIndex);
  return COMMAND_INDENT + formatCommandText(commandPart) + formatArgsText(argsPart);
}
```

The smell: `ExampleCommandImpl` is *already* composed of a
`WorkflowShortName` + `ExampleParameters`. The two parts existed
structurally — but `toString()` joined them and then the formatter had
to undo the join with `indexOf` / `slice` to colour them differently.
Two consequences:

- The formatter held an `EXAMPLE_ARGS_SEPARATOR = ' -- '` constant
  that duplicated the convention baked into the `exampleParameters`
  JSON field. Change the convention in one place, the other breaks.
- `ExampleCommandImpl.toString()` had a `.trimEnd()` hack to clean
  up the trailing space when params were empty — a tell that the
  joining logic was fighting against the structure.

### After (this branch)

`ExampleCommand` exposes the two halves directly:

```ts
export interface ExampleCommand {
  /** Return the `agentic-hq {shortName}` half (no trailing space, no args). */
  getCommandPart(): string;
  /** Return the args half with its leading separator space (` -- {params}`),
   *  or `""` when there are no params. */
  getArgsPart(): string;
  /** Return the full example command string. Equal to `getCommandPart() + getArgsPart()`. */
  toString(): string;
}
```

`ExampleCommandImpl` now reads each half off its child value objects
without string parsing, and `toString()` falls out as a one-line
concatenation (no more `trimEnd()`):

```ts
getCommandPart(): string {
  return `${AGENTIC_HQ_COMMAND_NAME} ${this.shortName.toString()}`;
}
getArgsPart(): string {
  const params = this.params.toString();
  return params.length === 0 ? '' : ARGS_SEPARATOR_SPACE + params;
}
toString(): string {
  return this.getCommandPart() + this.getArgsPart();
}
```

The formatter loses 5 lines of parsing and one stale constant:

```ts
private workflowCommandLine(workflow: AhqWorkflow): string {
  const example = workflow.getExampleCommand();
  return (
    COMMAND_INDENT +
    formatCommandText(example.getCommandPart()) +
    formatArgsText(example.getArgsPart())
  );
}
```

### Why this is better

- **No more "join then re-split" tax.** The value object already knew
  the two halves; the formatter was paying to recover them. Now it
  just asks.
- **`EXAMPLE_ARGS_SEPARATOR` constant deleted.** The `' -- '`
  convention now lives in exactly one place (`ExampleParameters` —
  the JSON field) instead of being duplicated in the formatter.
- **`toString()` simplifies — no `trimEnd()` hack.** The empty-args
  case is handled where it belongs (in `getArgsPart()`), so the join
  doesn't produce a stray trailing space to clean up.
- **Stronger SRP boundary.** `ExampleCommand` represents the example
  invocation; *it* knows how the parts compose. The formatter
  represents visual presentation; it asks for the parts and colours
  them. Neither side reaches into the other's responsibility.
- **Output still byte-identical.** Verified by diffing the binary's
  `list` output against a baseline captured before this stage.

### Tests added/changed

- **4 new behavioural tests** in
  `tests/unit/workflow-discovery/workflow/example-command-impl.unit.test.ts`
  for `getCommandPart()`, `getArgsPart()` (with and without params),
  and the `toString() === getCommandPart() + getArgsPart()` invariant.
- **4 stub call sites updated** to provide the new methods on the
  `ExampleCommand` interface (formatter test, two workflow stubs in
  `agentic-hq-program.unit.test.ts`, one in
  `workflow-registry-impl.unit.test.ts`).
- **Formatter test stub** changed from `example: string` to
  `exampleCommandPart` + `exampleArgsPart` separate fields — forces
  test data to think in the new structural API, not the old joined
  form.

---

## Verification

- `pnpm validate` — green (typecheck + lint + format + 146/146 tests).
- Running the binary against a captured baseline → byte-identical
  (verified at the end of each stage).
- Cross-workspace check (current-dir workspace differs from
  `AGENTIC_HQ_WORKSPACE_ROOT`) exercises the full-local-block branch
  of `localWorkspaceBlock` and renders correctly.

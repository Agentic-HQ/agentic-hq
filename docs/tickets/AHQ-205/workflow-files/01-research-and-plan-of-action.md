# AHQ-205 — Research And Plan Of Action

> **Ticket:** [AHQ-205](https://agentic-hq.atlassian.net/browse/AHQ-205) — *Bug: agentic-hq CLI
> Installed From Npm Crashes When add-feature Workflow Runs From AHQ Workspace Root*
> **Type:** Sub-task (Bug) · **Parent:** [AHQ-195](https://agentic-hq.atlassian.net/browse/AHQ-195)
> Sub-Task 6 of 8 · **Status:** Backlog · **Researched:** 2026-08-16 (Claude Fable 5)
> **Sources:** the Jira (via MCP); `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md`
> (§ *Split Suggestion* item 6, § *Open Sub-Task Instructions → Sub-Task 6*);
> `docs/tickets/AHQ-202/workflow-files/supporting-files/AHQ-205_bug_Jira.md`; the superseded plan
> `LEGACY/01-research-and-plan-of-action.md.SUPERSEDED_BAD_DESIGN` (§1–§5 reused, §6–§7 rejected);
> the post-mortem `supporting-docs/bad-coding-conversation-with-Opus.md`; and the code itself.

**Status (2026-08-16, updated after implementation):** this plan was **executed in full** the same
day, with all §10 defaults confirmed by the human — see
[`02-details-of-final-implementation.md`](02-details-of-final-implementation.md) for what landed,
the TDD log, the testing details and the one open question. The plan below is left as written (it
was committed as `1698a3a` before implementation started); the reproduction fixtures under
`temp/AHQ-205/` are still on disk.

**This document supersedes the LEGACY plan.** The reproduction (LEGACY §3), root-cause chain (§4)
and research findings (§5) there were verified empirically and are *not* repeated in full here —
they are summarised in §1–§2 with the few facts this plan depends on. Everything from §3 onward is
new, and was reached by reading the code, not by inheriting the previous conclusion.

---

## TL;DR — The Fix

**The problem in one line:** every workflow's `shortId` becomes a Commander subcommand, from *both*
the installed package and your current directory, into one flat table — and Commander throws on the
second `add-feature`, before it even reads your arguments. So `list`, `--help`, everything dies.

**What's being done — four small edits, one rule:**

> **The first registration of a short name wins; later ones are simply not registered.**

1. **`WorkflowRegistryImpl.register()` — the actual crash fix (~4 lines).** Before calling
   `program.command(shortName)`, check whether `program.commands` already has that name. If so,
   return. Commander never sees a duplicate, so it never throws. The built-in `list` is already in
   that table (it's registered before the workflows), so a workflow named `list` can't shadow it
   either — no extra code.
2. **`WorkflowSearchResultsImpl.registerWorkflowsWith()` — swap two lines.** Today it registers
   package-then-local. Swap it to local-then-package. Combined with "first wins", that *is* the
   "local working directory takes precedence" decision — nothing more needed.
3. **`ClaudeCommandBuilder` — swap two statements.** Claude Code silently keeps only the *first* of
   two `--plugin-dir` flags naming the same plugin. Today the package's dirs go first, so the CLI
   would say "local wins" while Claude ran the package's copy. Put the user's dirs first so the
   winner is the same at both layers.
4. **`ListingFormatter` — the red bold `DISABLED` flag (~20 lines) + a 2-line colour helper.** The
   listing keeps its exact layout; a losing entry just gets
   `DISABLED — shortId 'add-feature' is already used by existing workflow` on the line above it. The
   formatter works out the losers by doing the same walk in the same order (local claims names
   first, then package; `list` pre-claimed) — it needs nothing passed in from the registry.

**Why it fixes it completely:** all four ways the crash reproduces are the same event — a name
arriving twice — and the guard in step 1 catches every one of them (local-vs-package, two plugins in
one workspace, a workflow named `list`). Steps 2–3 make the winner the one you meant (local, at both
the CLI and Claude layers), and step 4 makes the outcome visible in `agentic-hq list`. No new
classes, no interface changes, nothing else in the discovery chain touched.

---

## 1. The Defect And Where It Lives

Program construction registers every discovered workflow's `shortId` as a Commander subcommand,
from the AHQ package **and** the current working directory, into one flat namespace, with nothing
checking whether the name is already taken. Commander throws on the duplicate — inside
`createProgram`, before argv is parsed — so `list`, `--help`, everything dies with exit 1.

| Step | Where | What happens |
| --- | --- | --- |
| 1 | `src/cli/agentic-hq-program.ts:40-45` | Built-in `list` subcommand registered. |
| 2 | `src/cli/agentic-hq-program.ts:48` | `searchResults.registerWorkflowsWith(new WorkflowRegistryImpl(program, builder))`. |
| 3 | `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts:44-47` | AHQ package registers **first** (line 45), local workspace **second** (line 46). |
| 4 | `src/workflow-discovery/workspace/current-user-workspace-impl.ts:44-49` | Local skips itself only when `isAhqPackage()` — cwd *is* the package root. Never true for an npm install. |
| 5 | `workspace-impl.ts:54-58` → `plugin/plugin-impl.ts:42-46` | Every plugin registers every workflow, unconditionally, in directory/glob order. |
| 6 | **`src/cli/workflow-registry-impl.ts:35-36`** | `this.program.command(shortName)` — **Commander throws** if the name exists. |

**Reproduced four ways** (LEGACY §3; fixtures still on disk under `temp/AHQ-205/`, gitignored — see
Appendix). Re-run today against the current tree: `node release/bin/agentic-hq-prebuilt.cjs list`
from `temp/AHQ-205/repro-workspace` still produces the filed stack trace line for line.

1. Prebuilt package run from the repo-clone root (the filed scenario).
2. Any local workspace defining a workflow with a colliding `shortId` — plugin names need not match.
3. *(not in the Jira)* Two plugins inside **one** workspace sharing a `shortId`.
4. *(not in the Jira)* A workflow whose `shortId` is `list` — collides with the built-in. `help` is
   **not** reserved (Commander's implicit help is not a registered command; verified).

The collision key is `shortId` alone (`WorkflowRegistryImpl.register` uses `getShortName()`);
`AhqWorkflow` (`src/workflow-discovery/interfaces/ahq-workflow.ts`) exposes short name,
description, full `/pluginId:skillId` command and example command — **nothing else**, and in
particular no file path or workspace of origin (`AhqFile` states it "Knows Nothing About: The
file's path"). That fact shapes the listing half of the fix (§3.3).

---

## 2. Verified In This Pass

**2.1 The six-line conclusion holds — and is slightly smaller than that.** The crash fix is a
guard in `WorkflowRegistryImpl.register()` (`workflow-registry-impl.ts:30-44`): if
`this.program.commands` already has a command with this short name, do nothing. Commander's
`program.commands` is public typed API (`readonly commands: readonly Command[]`,
`commander/typings/index.d.ts:379`) and is already read exactly this way in the class's own test
(`tests/unit/cli/workflow-registry-impl.unit.test.ts:42`). Commander's own duplicate check
(`commander/lib/command.js:644-660`) matches name **or alias**; nothing in this program uses
aliases, so a name-only guard mirrors it today (note in a comment: add `cmd.aliases()` if aliases
ever appear). Because `createProgram` registers `list` at line 41 and workflows at line 48, `list`
is already in `program.commands` when the guard runs — reserving it costs nothing. **No new class,
no accumulator, no getter** — the earlier conversation's final shape still had the registry
recording losers for the listing; §2.3 explains why that cannot work and why the listing needs
nothing from the registry.

**2.2 Precedence is one line-swap.** `WorkflowSearchResultsImpl.registerWorkflowsWith`
(`workflow-search-results-impl.ts:45-46`) currently registers package-then-local. With a
first-wins guard, "local wins" is exactly "swap those two lines". `CurrentUserWorkspaceImpl`'s
`isAhqPackage()` early-return keeps the U = P case (contributor in the repo checkout) unchanged.

**2.3 The listing cannot key "disabled" on anything an `AhqWorkflow` exposes.** In the *reported*
case both `add-feature` copies live in a plugin named `agentic-hq-demos-plugin` and their
`ahq-workflow.json` files are byte-identical (the release copy is built from the source copy) — so
`getFullClaudeSkillCommand()`, description and example command are all identical too. A "registry
records the losers, listing looks them up by full command" design would flag **both** entries,
winner included. Object identity is no use either: `getPlugins()`/`getWorkflows()` rebuild fresh
objects on every call by design (`feedback_avoid_cached_state`). Only provenance (which
workspace/file) distinguishes the two, and provenance is deliberately absent from the model. Hence
§3.3: the formatter reproduces the same first-claim walk itself, in the same order, and needs no
plumbing from the registry.

**2.4 Flipping `--plugin-dir` order is safe, and fixes a second quiet problem.**
`ClaudeCommandBuilder.getClaudeCliPluginDirArgs()` (`claude-command-builder.ts:118-131`) pushes the
package's plugin dirs first (line 126) then the user's (127-129). Claude Code keeps only the
**first** of two `--plugin-dir` flags naming the same plugin (probed both orderings 2026-08-16,
LEGACY §5.2), so with local-first registration in the CLI but package-first flags to Claude, the
CLI would announce the local `add-feature` and Claude would run the package's. Flipping the two
statements makes "local wins" true at both layers. Checked that this is safe in the filed scenario:
the local (source-tree) `add-feature/SKILL.md` is byte-identical to the release copy (`diff` clean)
and launches `{ahq-package-root}/scripts/run-workflow.cjs` — the package's runner — either way. Bonus:
today the release `agentic-hq-demos-plugin` ships only 2 of the 6 demos skills
(`scripts/build-release.cjs:47-53`), so with package-first flags a contributor in the repo clone
would have Claude load the 2-skill package copy and drop the 6-skill local one, making the CLI's
registered `reversal` etc. unknown to Claude. Local-first cures that too.

**2.5 AHQ-200 AC 5 runtime check — done, from an artifact already on disk.** See §8.

---

## 3. Design — The Fix

### 3.1 Settled decisions (from the human, 2026-08-16 — not re-opened here)

1. **Precedence:** local working directory wins; AHQ package second.
2. **Listing structure unchanged:** same blocks, same order, same layout.
3. **Duplicates shown as now, with a red bold flag in front** — along the lines of
   `DISABLED — shortId 'add-feature' is already used by existing workflow`. Deliberately not naming
   the winner: the loser needs no knowledge of the winner.
4. **No backwards compatibility to preserve.** "Whatever is quickest and easiest and makes the bug
   go away completely." Not a re-architecture ticket.

### 3.2 The one rule

> **The first registration of a short name wins; later ones are not registered.** The walk order
> is: built-in `list` (already registered by `createProgram`), then the local workspace, then the
> AHQ package; within a workspace, plugin-directory order then glob order (unchanged, and already
> shared by registration and listing because both iterate `getPlugins()` → `getWorkflows()`).

That single rule disposes of all four reproductions: local beats package (1, 2); first plugin beats
second inside one workspace (3); the built-in `list` beats any workflow (4). Losers do not appear
in `agentic-hq --help` (Commander lists `program.commands`), and appear in `agentic-hq list`
flagged DISABLED. Nothing throws.

### 3.3 Where each piece lives — the whole change

| File | Change | Size |
| --- | --- | --- |
| `src/cli/workflow-registry-impl.ts` | Guard at the top of `register()`: short name already in `program.commands` → return. Update the SRP "Does" clause. | ~4 lines |
| `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts` | Swap lines 45/46 so local registers first; comment says why. | 2 lines + comment |
| `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` | Swap the two statements at 126-129 so the user's `--plugin-dir` flags come first; comment says why (Claude keeps the first same-named plugin). | 2 lines + comment |
| `src/cli/listing/colors.ts` | `const red = wrap(31, 39);` + `export const formatDisabledFlag = (s) => bold(red(s));` | 2 lines |
| `src/cli/listing/listing-formatter.ts` | Thread a `claimedShortNames: Set<string>` through `workspaceBlock → allPluginBlocksIn → pluginBlock → workflowEntry` (+ `localWorkspaceBlock`); render local block **before** package block (registration order) but assemble package-first (display order); `workflowEntry` prepends the flag line when the name is already claimed. Seed the set with `LIST_SUBCOMMAND_NAME`. | ~20 lines |
| `src/cli/agentic-hq-program.ts` | `export` the existing `LIST_SUBCOMMAND_NAME`; one comment at the `list` registration noting it is deliberately registered before workflows. | 1 word + comment |
| `src/workflow-discovery/workspace/workspace-impl.ts:75` | Comment only — record the path-normalisation decision (§5). | comment |

**No new production files. No new classes. No interface changes.** `WorkspaceImpl`, `PluginImpl`,
`AhqPackageImpl`, `CurrentUserWorkspaceImpl`, `WorkflowRegistry`, `WorkflowSearchResults`,
`Workspace`, `Plugin`, `AhqWorkflow` are all untouched.

### 3.4 Sketches (the implementer should not need to re-derive these)

`workflow-registry-impl.ts`:

```ts
/**
 * Register a Commander subcommand for the given workflow — unless its short name is
 * already a subcommand, in which case do nothing: the first registration wins (AHQ-205).
 * Commander would otherwise throw. (Its own duplicate check also matches aliases; nothing
 * here uses aliases — add `cmd.aliases().includes(shortName)` if that ever changes.)
 */
register(workflow: AhqWorkflow): void {
  const shortName = workflow.getShortName().toString();
  if (this.program.commands.some((cmd) => cmd.name() === shortName)) {
    return;
  }
  // ...existing body unchanged...
}
```

`workflow-search-results-impl.ts`:

```ts
/** Register all workflows. Local workspace goes FIRST: WorkflowRegistryImpl keeps the first
 *  registration of a short name, so this order is what makes local win a collision (AHQ-205). */
registerWorkflowsWith(registry: WorkflowRegistry): void {
  this.currentUserWorkspace.registerWorkflowsWith(registry);
  this.ahqPackage.registerWorkflowsWith(registry);
}
```

`listing-formatter.ts` (only the shape; the four intermediate methods just pass the set along):

```ts
const DISABLED_FLAG_PREFIX = "DISABLED — shortId '";
const DISABLED_FLAG_SUFFIX = "' is already used by existing workflow";

formatWorkflowsListing(ahqPackage: Workspace, localWorkspace: Workspace): string {
  // Rendered in REGISTRATION order (local claims short names first — AHQ-205), assembled in
  // DISPLAY order (package block first). Same walk as WorkflowSearchResultsImpl.registerWorkflowsWith,
  // so what is flagged DISABLED here is exactly what registration skipped.
  const claimedShortNames = new Set<string>([LIST_SUBCOMMAND_NAME]);
  const localBlock = this.localWorkspaceBlock(localWorkspace, claimedShortNames);
  const packageBlock = this.workspaceBlock(ahqPackage, claimedShortNames);
  const body = [this.titleLine(), packageBlock, localBlock].join(BLANK_LINE_BETWEEN_BLOCKS);
  return LINE_BREAK + body + LINE_BREAK;
}

private workflowEntry(workflow: AhqWorkflow, claimedShortNames: Set<string>): string {
  const shortName = workflow.getShortName().toString();
  const isDisabled = claimedShortNames.has(shortName);
  claimedShortNames.add(shortName);
  const flagLine = isDisabled ? this.disabledFlagLine(shortName) + LINE_BREAK : '';
  return flagLine + this.workflowCommandLine(workflow) + LINE_BREAK + this.workflowDescriptionLine(workflow);
}

/** `      DISABLED — shortId 'x' is already used by existing workflow` — bold red, command indent. */
private disabledFlagLine(shortName: string): string {
  return COMMAND_INDENT + formatDisabledFlag(DISABLED_FLAG_PREFIX + shortName + DISABLED_FLAG_SUFFIX);
}
```

`localWorkspaceBlock` keeps its `isAhqPackage()` branch and, in that branch, claims nothing —
mirroring `CurrentUserWorkspaceImpl.registerWorkflowsWith`, which registers nothing in the U = P case.
Rendered result for the filed scenario:

```
    Plugin: agentic-hq-demos-plugin

      DISABLED — shortId 'add-feature' is already used by existing workflow
      agentic-hq add-feature -- --ticket-id=PROJ-123
        Add a small feature using a simple four-stage research/plan/implement/review workflow
```

`claude-command-builder.ts:125-130`:

```ts
const flags: string[] = [];
// The user's plugin dirs go FIRST: Claude Code keeps only the first of two --plugin-dir flags
// that name the same plugin (probed 2026-08-16, AHQ-205), so this order is what makes "local
// workspace wins" true at the Claude layer, not just in the CLI's own subcommand table.
if (!this.currentUserWorkspace.isAhqPackage()) {
  this.addPluginDirsFrom(userPluginsDir, flags);
}
this.addPluginDirsFrom(ahqPluginsDir, flags);
return flags;
```

### 3.5 The "thing or step?" check

Every candidate abstraction the previous attempt produced (`ClaimingRegistry`,
`DuplicateTolerantCommand`) named a *step* in an algorithm, not a *thing* in the domain — and the
step already had an owner. `WorkflowRegistryImpl` already wraps Commander and already owns "turn a
workflow into a subcommand"; a name that is already taken is that operation's own failure case.
`ListingFormatter` already owns "what the listing shows"; whether an entry is runnable is part of
that. Nothing new is needed, so nothing new is proposed.

**Known trade-off, stated plainly:** the first-claim rule is now expressed twice — once implicitly
(Commander's table + `WorkflowSearchResultsImpl`'s call order) and once explicitly (the formatter's
`Set` + its render order). They cannot be unified without giving `AhqWorkflow` provenance (§4, option
A). The tests in §7 pin them together (S2 renders the listing over a real two-root fixture and asserts
the flag lands on the package's copy; R2/P1/F3 pin the reserved `list` on both sides).

---

## 4. Considered And Not Doing

- **(A) Provenance on `AhqWorkflow` + registry records losers + listing looks them up.** The only
  design with a single source of truth. Cost: `AhqFile` gains a path (its SRP explicitly excludes
  one), `AhqWorkflow` gains an identity getter, `AhqWorkflowImpl` implements it, four test files of
  `AhqWorkflow` stubs change, `WorkflowRegistryImpl` gains an accumulator + getter, `createProgram`
  hoists the registry into the `list` action, `WorkflowSearchResults.getWorkflowsListingString` and
  `ListingFormatter.formatWorkflowsListing` change signature. Roughly three interfaces and ten files
  for the same visible behaviour. Not what decision 4 asks for. Revisit only if the duplicated rule
  actually drifts — and AHQ-206 (Workspace split) is the natural moment.
- **A `WorkflowRegistry` decorator or a Commander subclass.** Rejected — see the LEGACY banner and
  the post-mortem. Both re-wrap something `WorkflowRegistryImpl` already wraps.
- **A stderr notice at startup, or naming the winner in the flag.** Not asked for (decisions 2–3);
  `agentic-hq list` is the place a user looks, and it now explains itself.
- **Namespacing / qualified registration.** Cannot reach the shadowed copy anyway when plugin names
  also match (Claude collapses them), and is far more than the ticket wants.

---

## 5. Path Normalisation — The Explicit Decision The Brief Asked For

`WorkspaceImpl.isAhqPackage()` (`workspace-impl.ts:76-78`) is plain string equality. Findings
(LEGACY §5.5, verified): a **symlinked** invocation is clean — `process.cwd()` and `__dirname` both
resolve physically; a **trailing separator** on `--ahq-package-root` does defeat the guard, but is
unreachable through both shipped bin wrappers (`bin/agentic-hq.cjs:16`,
`bin/agentic-hq-prebuilt.cjs:19` build the value with `path.join`, which never yields one).

**Recommendation: no code change; record the decision.** After this fix a missed guard no longer
crashes — it degrades to a working CLI whose listing shows a redundant, fully-DISABLED package block
(local claims every name first) and whose duplicated `--plugin-dir` flags Claude collapses to the
same directories. Cosmetic, hand-crafted-invocation-only, and AHQ-206 is about to restructure this
exact area. Replace the `// per Q5` reference in the comment on line 75 with the decision and its
reasons so nobody re-investigates.

*Belt-and-braces alternative if preferred (~10 minutes):* `this.path = path.resolve(path)` in
`DefaultAhqPackageRoot`'s constructor (`src/runtime-params/default-ahq-package-root.ts:14`) plus one
unit test — the value object then owns the canonical form and every consumer benefits. Either way is
fine; the human picks (§10).

---

## 6. Plan — TDD Cycles

RED → GREEN → REFACTOR → VERIFY per cycle; no test edited between its first (failing) run and its
post-implementation run. Run single files while working — unit: `pnpm test <file>`; integration:
`pnpm test:integration <file>` (never the whole integration suite: it is the one with the `release/`
contention) — and the full `pnpm validate` only at the end. `pnpm validate` runs unit tests only, so
the integration acceptance test (I1) must be run explicitly. Test names below are behavioural, not
implementation-peeking;
`program.commands` is Commander's public API and already used in the registry test.

**Cycle 0 — Acceptance test first (outer loop; stays RED until the end of Cycle 4).**
`tests/integration/bin/agentic-hq-list-from-a-workspace-with-a-colliding-short-id.integration.test.ts`
(same shape as its neighbour `bin-wrapper-supplies-the-package-root-explicitly.integration.test.ts`).
Create a temp workspace under `/tmp/agentic-hq-test-workspaces/` (mkdtemp, cleaned up) containing
`.agentic-hq/plugins/local-plugin/skills/add-feature/ahq-workflow.json` with `shortId: "add-feature"`
(collides with the repo's own shipped `add-feature`); `spawnSync(node, [bin/agentic-hq.cjs, 'list'])`
with `cwd` = that workspace. Assert: exit 0; stdout contains `Available workflows`; exactly one
`DISABLED` line, naming `add-feature`, positioned **before** the `Local Workspace:` header (i.e. in
the package block); none after it. RED today: exit 1, stderr `cannot add command 'add-feature'` — the
right failure. `list` through the dev wrapper runs tsx over `src/` and never touches `release/`, so
this does **not** join the `publish-guards`/`build-determinism` contention (§9).

**Cycle 1 — The crash fix: registry guard.** `tests/unit/cli/workflow-registry-impl.unit.test.ts` +
one in `tests/unit/cli/agentic-hq-program.unit.test.ts`.
- RED — R1: register two stub workflows with short name `add-feature` (different full commands) →
  no throw; exactly one `add-feature` in `program.commands`; `parseAsync(['…','add-feature'])` calls
  `builder.build` with the **first** one's full command. R2: `program.command('list').action(spy)`
  first, then register a stub named `list` → no throw; parsing `list` calls the spy, not
  `builder.build`. P1 (`createProgram`): stub search results register a workflow named `list` →
  `createProgram` does not throw and `list` still prints the injected listing. All three currently
  throw `cannot add command …`.
- GREEN — the guard (§3.4). Update the SRP "Does" clause of the class header.
- REFACTOR — nothing structural expected; comment at `agentic-hq-program.ts:40` that `list` is
  registered before workflows on purpose.
- VERIFY — the two unit files; **then run the real thing**: from `temp/AHQ-205/repro-workspace`,
  `variant-b`, `variant-c`: `node <repo>/bin/agentic-hq.cjs list` and `--help` now start (exit 0;
  both `add-feature` entries listed, no flag yet — expected at this point).

**Cycle 2 — Precedence: local first.**
`tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts`.
- RED — S1: package root = `<tmpdir>/package` (`createTestWorkspaceFixture`), `process.cwd` stubbed
  to `<tmpdir>/local` holding one workflow whose `shortId` collides (`math`) under a different plugin
  id; `StubWorkflowRegistry` → `registered[0]` is the local one (its full command), and both are
  present (the stub does not dedupe — this test pins *order*, Cycle 1 pins *first-wins*). Needs a
  small fixture writer for a single workflow — see REFACTOR.
- GREEN — swap the two lines (§3.4).
- REFACTOR — the new single-workflow fixture writer duplicates the three inline blocks in
  `createTestWorkspaceFixture` (`tests/unit/workflow-discovery/test-fixtures/workspace-fixture.ts`);
  either reimplement those three on top of it, or leave a note — decide here, don't defer. Also
  update the `isAhqPackage()` comment per §5.
- VERIFY — the unit file; real run: from `temp/AHQ-205/repro-workspace`,
  `agentic-hq add-feature --help` shows the **local** description ("A LOCAL workflow that happens to
  share a name with a shipped one"), not the shipped one.

**Cycle 3 — `--plugin-dir` order.** `tests/unit/tools/claude-code/claude-command-builder.unit.test.ts`.
- RED — C1: user workspace with a `user-plugin` (the existing test at lines 95-114 already builds
  this) → every `--plugin-dir=` for the user workspace has a lower index in `cmd.args` than every
  one for the AHQ package. Fails today (package first). Existing order-agnostic tests keep passing.
- GREEN — swap the two statements; comment (§3.4). Leave the existing REFACTOR comment above the
  method intact.
- REFACTOR — none expected.
- VERIFY — the unit file; real run: from `temp/AHQ-205/repro-workspace` start
  `agentic-hq add-feature`, read the `[CLICommand] Running: claude --plugin-dir=…` line that
  `PtyCLIWrapper.run` logs before spawning (`pty-cli-wrapper.ts:38`) — the local plugin dir must come
  first — then Ctrl-C. No Claude session needs to complete.

**Cycle 4 — The DISABLED flag in the listing.** `tests/unit/cli/listing/listing-formatter.unit.test.ts`
+ one more in the search-results test.
- RED — F1: package and local (isAhq false) both have `math` → one `DISABLED` line, containing
  `'math'`, on the line **directly above** the package's `agentic-hq math` command line, and nothing
  flagged in the local block. F2: two plugins in one workspace both with `dup` → second flagged,
  first not. F3: a workflow named `list` → flagged. F4: no collision → no `DISABLED` anywhere. F5:
  local IS the package (isAhq true) with the same plugins → nothing flagged. S2 (search-results, real
  discovery over the two-root fixture from S1): the listing flags exactly the package's copy — the
  only `DISABLED` sits before the `Local Workspace:` header. (Colour is not asserted — colours are
  off under vitest, per the file's own header.)
- GREEN — `colors.ts` helper, formatter changes, `export` `LIST_SUBCOMMAND_NAME` (§3.4).
- REFACTOR — SRP header of `ListingFormatter` gains the "which entries are DISABLED" clause; check
  the flag constants read like the file's other literal-text fragments.
- VERIFY — the unit files; **Cycle 0's acceptance test now goes GREEN**; real runs: `list` from
  `repro-workspace` (red bold flag on the package's `add-feature`, local entry clean), `variant-b`
  (second `dup` flagged), `variant-c` (`list` flagged), repo root (U = P: "Same as Agentic HQ Package",
  no flags anywhere).

**Final — validate, the filed scenario for real, docs.**
- `pnpm validate` from the repo root (typecheck, lint, format, unit). Then the two integration files
  individually — `pnpm test:integration tests/integration/bin/<file>` — the new acceptance test and
  `bin-wrapper-supplies-the-package-root-explicitly` (which also runs `list` through the dev wrapper
  from the repo root, so it doubles as the U = P regression check).
- **The exact filed scenario, by hand:** with nothing else using `release/` (no integration suite
  running), `pnpm build`, then from the repo root
  `node release/bin/agentic-hq-prebuilt.cjs list` and `… add-feature --help` — the two invocations
  from the Jira. Both exit 0; `list` shows the release package's `add-feature` and `math` flagged and
  the local (source) block clean. Record the output in the implementation summary.
- One sentence in `docs/dev/how-agentic-hq-works.md` item 5 (line ~204: "registers the `shortId` as
  a Commander subcommand …"): first registration wins, local workspace before package, losers shown
  DISABLED by `agentic-hq list`. Leave user-facing docs to AHQ-199, which rewrites them anyway.
- Do **not** run `pnpm format:fix`/`lint:fix` without `format:check`/`lint:check` first confirming
  only these files would change.

---

## 7. Test List

| # | Level | File | Pins down | Repro |
| --- | --- | --- | --- | --- |
| I1 | integration | `tests/integration/bin/agentic-hq-list-from-a-workspace-with-a-colliding-short-id…` | Dev wrapper `list` from a colliding cwd: exit 0, one DISABLED in the package block, local clean | whole bug (1, 2) |
| R1 | unit | `cli/workflow-registry-impl` | Same short name twice → no throw, one subcommand, the first one runs | 2, 3 |
| R2 | unit | `cli/workflow-registry-impl` | A name the program already has is never replaced (built-in `list` survives) | 4 |
| P1 | unit | `cli/agentic-hq-program` | `createProgram` survives a workflow named `list`; `list` still lists | 4 |
| S1 | unit | `workflow-listing/workflow-search-results-impl` | Local workspace registers before the AHQ package | precedence |
| S2 | unit | `workflow-listing/workflow-search-results-impl` | Over real two-root discovery, the listing flags exactly the package's copy | registry ↔ listing agreement |
| C1 | unit | `tools/claude-code/claude-command-builder` | User's `--plugin-dir` flags precede the package's | second defect |
| F1 | unit | `cli/listing/listing-formatter` | Package+local same name → flag directly above the package entry only | 1, 2 |
| F2 | unit | `cli/listing/listing-formatter` | Two plugins, one workspace, same name → second flagged only | 3 |
| F3 | unit | `cli/listing/listing-formatter` | Workflow named `list` → flagged | 4 |
| F4 | unit | `cli/listing/listing-formatter` | No collision → no DISABLED (negative control) | — |
| F5 | unit | `cli/listing/listing-formatter` | Local IS the package → nothing flagged | U = P |
| — | manual | prebuilt wrapper from repo root | The filed invocations, both exit 0, correct flags | 1 |

Twelve automated tests, all short; every production change in §3.3 is covered by at least one.

---

## 8. AHQ-200 AC 5 — Runtime Check (carried instruction) — VERIFIED

The instruction: confirm, at runtime, that Command 01's `command-input.json` reads
`ahq-package-root=…` (the static half — CLI broadcast, `SKILL.md`, all four `commands/add-feature/0?-*.md`
parsers, no `agentic-hq-workspace-root-dir` remaining — was already done).

An add-feature run for **this** ticket was started on 2026-08-16 (Command 01 never completed — the
marshalling dir holds `command-input.json` only, consistent with the run being abandoned when the
research moved to a manual session). Its input file, at
`.agentic-hq/temp/command-input-output-files/io-files-2026-08-16_16-35-20_c4d36c9b-f2c3-40a8-b115-782327b92ae0/command-input.json`
(timestamps are UTC — `toISOString()` in `json-file-io-marshaller-session.ts`; = 17:35 BST), reads:

```json
{
  "command-input-string": "The variables used in this workflow are: ahq-package-root=/Users/stevepersonal/dev/agentic-hq/agentic-hq and ticket-id=AHQ-205"
}
```

That is the new name, produced by the renamed broadcast (`add-feature-cli.ts:55`) after the rename
commit `b660376` (2026-08-16 15:10 BST). Cross-check: the last `command-input.json` still carrying
`agentic-hq-workspace-root-dir` is dated 14:11 UTC = 15:11 BST — the tail of the AHQ-200 run that had
started before the rename landed, exactly as the brief describes. All four add-feature commands read
the same broadcast string, so this one artifact verifies the relay for Commands 01–04.
**AC 5 holds at runtime; nothing further to do on this ticket.**

---

## 9. Out Of Scope

- **Publishing** — AHQ-201 owns the next re-publish; this fix reaches npm with it.
- **Migrating the five unmigrated workflows** — AHQ-201.
- **Splitting the `Workspace` interface** — AHQ-206; resist the pull, even though this ticket touches
  `isAhqPackage()`'s comment.
- **The `release/` contention** between `publish-guards` and `build-determinism` — not fixed here;
  I1 deliberately avoids `release/`, and the manual prebuilt check is done only when nothing else is
  building.

---

## 10. For The Human To Decide (or accept the defaults)

1. **Listing mechanism — (B) formatter reproduces the first-claim walk (recommended, zero
   interface changes) vs (A) provenance + registry-records-losers (single source of truth, ~10
   files).** Default: B.
2. **Path normalisation — record-only (recommended) vs the one-line `path.resolve` in
   `DefaultAhqPackageRoot` (§5).** Default: record-only.
3. **Flag wording and placement.** Default: your exact wording,
   `DISABLED — shortId '<x>' is already used by existing workflow`, as its own line directly above
   the entry at the command indent (a same-line prefix pushes the command far right). Note it also
   fronts a workflow named `list`, where "existing workflow" is slightly loose — accept, or use
   `… is already in use` for both cases.
4. **Confirm the `--plugin-dir` flip is in scope** (it is the second defect from LEGACY §5.2, two
   statements swapped, one test). Default: in scope — without it decision 1 is untrue in the exact
   filed scenario.

Nothing here blocks starting Cycle 0/1; only Cycle 4 depends on answers 1 and 3.

HUMAN: All confirmed - I agree with your recommendations.

---

## Appendix — Fixtures On Disk (`temp/AHQ-205/`, gitignored)

| Path | Purpose |
| --- | --- |
| `repro-workspace/` | Local workspace with a colliding `add-feature` in `my-local-plugin` (distinct description — useful for the Cycle 2 `--help` check) |
| `variant-b/` | Two plugins, one workspace, both `shortId: dup` |
| `variant-c/` | Workflow with `shortId: list` |
| `variant-d/` | Workflow with `shortId: help` — negative control, does **not** collide |
| `repo-symlink` | Symlink to the repo root — the symlink case that proved clean |
| `dupe-plugins/a`, `dupe-plugins/b` | Same-named plugin copies used for the Claude `--plugin-dir` first-wins probe |
| `commander-probe.mjs` | The Commander subclass probe from the previous session — superseded, kept for the record |

---

## Afterword — Why The Previous Attempt Over-Designed, How To Head It Off, And Would Fable Have Done Better?

*Written at the human's request, 2026-08-16. Opinion, not verified fact — read it that way.*

### Why Opus made the suggestions it made

Reading the transcript, the mistakes are not random; they compound in a recognisable order.

1. **It found the line and then routed around it.** LEGACY §4 pins the defect to
   `workflow-registry-impl.ts:35-36`. §7 then puts the fix in a new decorator "so
   `WorkflowRegistryImpl` keeps its single responsibility". That is SRP read as a fence around the
   class ("this is all it may do") rather than a description of it ("this is what it does") —
   handling a name that is already taken *is* registration, not a second responsibility. The eight
   `SRP Does / Knows About / Knows Nothing About` headers it had just read primed it to expect an
   objection to touching any class, so it optimised for the objection it imagined instead of the
   right answer.
2. **The size of the write-up set the size of the solution.** Six sections building the problem up
   (four reproductions, an options table, a design decision needing sign-off) made a guard clause
   feel anticlimactic against its own framing. A numbered "Step 2" in a plan wants a *thing with a
   name*; a guard clause is a line number. The format pulled toward an abstraction.
3. **It matched the codebase's *density* of abstraction without its *criterion*.** Every existing
   class here names a domain noun (`Workspace`, `Plugin`, `AhqWorkflow`, `WorkflowShortName`).
   `ClaimingRegistry` and `DuplicateTolerantCommand` name a step and a behaviour. It copied "give
   things classes" and dropped "…when they are things".
4. **It answered the shape of each of your questions instead of re-examining its own frame.** "Can
   we wrap Commander?" produced a Commander wrapper — rather than the prior question, "does something
   already wrap Commander?", whose answer was in a file it had read in full and quoted from. You had
   to ask that question yourself.
5. **Its rigour pointed at the wrong target.** It empirically verified everything about the
   *problem* (four repros, the `--plugin-dir` probe) and about *solutions it had already chosen*
   (the Commander-subclass probe), and nothing about the premise that `WorkflowRegistryImpl` should
   not change. It also never traced the *reported input* through its own design: even the final
   "~6 lines" version keyed the disabled set on `getFullClaudeSkillCommand()`, which is identical for
   both copies in the filed scenario — so it would have flagged the winner too (§2.3). That flaw
   survived your review as well, because it is a *data* flaw, not a *structure* flaw, and the
   conversation was by then entirely about structure.
6. **Presentation quality masked analysis quality.** Every proposal arrived with a change table and
   a confident recommendation. That makes a weak design look worked-through and pushes the design
   work onto the reviewer — you caught it, twice, but you should not have had to.

None of these is exotic. They are the default failure mode of a capable model asked an open-ended
"research this and give me a plan" in a codebase whose surface style rewards new named things.

### How to head it off next time — things that would have changed the outcome

- **State the size constraint in the first prompt, not after the plan exists.** "No one is using
  this; quickest thing that makes the bug go away completely; not a re-architecture" arrived after a
  454-line plan had been written. Said up front, the options analysis and the decorator would very
  likely never have appeared. Open-ended prompts invite big designs.
- **Ask for the minimal diff first, then the critique of it.** "What is the smallest change, in
  existing code, that removes this failure? Give me the file:line and the lines. *Then* tell me what
  is wrong with it." Starting from the patch and justifying additions is a different — and safer —
  direction than starting from an options table and shrinking.
- **Make the ownership question mandatory.** "Before proposing anything new, list the existing
  classes on the call path and say, for each, why it cannot own this." Here that list is five
  classes long and the answer for `WorkflowRegistryImpl` is "it can".
- **Apply the name test to every proposed class: does it name a *thing* in the domain or a *step* in
  an algorithm?** Step → it is a method or a guard on something that exists. Your `no -er suffix
  classes` rule is the same test; make it a checklist item for the reviewer stage.
- **Ask for the reported input to be traced, concretely, through the proposed design.** "Walk the
  exact filed scenario — two byte-identical `agentic-hq-demos-plugin` copies — through your design
  and show me the values at each step." That is what surfaced §2.3, and it is what would have caught
  the `getFullClaudeSkillCommand()` flaw in the previous session.
- **Treat a confident change table for a new abstraction as a smell, not as reassurance.** The
  right response is the one you gave: "isn't X already the thing that does this?" — but you can
  pre-empt it by requiring the model to answer that question in the write-up.
- **Keep the deliverables ordered as they were here:** decisions made and written down → then the
  design. Decision 3 (don't name the winner) is what makes the formatter-only listing possible at
  all; had the design been done first, "name the winner" would have forced the provenance
  machinery of §4(A) and made the bigger design look necessary.

### Would Fable have got here straight away? Honestly

Partly, and I would not want to overclaim.

- **For the crash fix itself — probably yes, and quickly.** With the stack trace in one hand and
  `register()` in the other, the guard is what you see; the LEGACY doc's own §4 shows the line was
  found immediately. Finding the line and then not fixing it *there* is the odd move, and I think
  it is a less likely move for me — but "less likely" is the honest strength of that claim.
- **For the listing half — genuinely uncertain.** Without decision 3, I would have had to solve
  "which of two identical entries is the loser" and would probably have reached for provenance on
  `AhqWorkflow` (§4 option A) or a registry-to-listing hand-off — heavier than what is here. It was
  *your* "the loser needs no knowledge of the winner" that collapses it to a formatter walk. I
  cannot claim I would have proposed that simplification unprompted; I would like to think I would
  have asked whether the winner really needs naming, but that is a hope, not a record.
- **For the write-up shape — I would probably have written an options section too.** The Jira
  itself says "candidate behaviours (decision needed)" and lists three; that is an explicit
  invitation to enumerate options, and I would have taken it. What I would hope to do differently is
  put "the minimal patch" in as option 0 and size everything against it — but see the point about
  hope versus record.
- **The comparison is not fair anyway, and you should discount it.** I was handed the decisions,
  the "~6 lines in `WorkflowRegistryImpl`" conclusion, the thing-vs-step lever, a 179 KB post-mortem
  naming the exact trap, and an instruction not to take any of it on trust. Avoiding a trap that
  has been pointed at with a stick is not evidence of a model difference. The failure modes above —
  matching surface style, letting write-up size set solution size, rigour aimed at the wrong
  premise, presentation outrunning analysis — are model-family defaults, not Opus-specific, and I am
  subject to the same pull. What this pass *did* add (the identity flaw, the second `--plugin-dir`
  benefit, AC 5 from an on-disk artifact) came from one technique — trace concrete values through the
  reported case — and that technique is something you can demand in a prompt regardless of which
  model is answering. That is the transferable lesson; "use the other model" is not.

### Potential CLAUDE.md Fix Suggestion (not applied — held in reserve)

*The human's takeaway (2026-08-16): the main driver was a fear of overriding the `SRP Does / Knows
About / Knows Nothing About` header that sits on 57 classes in `src/` — a loudly, consistently set
precedent that a model reads as "don't touch", so it builds beside the class instead of inside it.
Decision: not adding a rule to `CLAUDE.md` yet; apply it if Fable is seen doing the same thing.*

Two refinements so the rule targets the right thing if it is ever needed:

- **The SRP header was not actually in the way — it was misread as a closed list.** Read properly,
  `WorkflowRegistryImpl`'s header *authorises* the guard: *Does* "register a Commander subcommand for
  each workflow, using its short name" (handling a name that is already taken is that job done
  correctly, not a second job); *Knows About* "the Commander API for creating subcommands" (the guard
  uses only `program.commands`); *Knows Nothing About* discovery, the builder, the Claude CLI (the
  guard touches none). **The `Knows Nothing About` line is the real fence; the `Does` line is a
  summary of today's behaviour, meant to be updated as the class grows within its responsibility.**
  The headers themselves are valuable — "wraps a Commander program and registers subcommands" was the
  whole search for this fix — so the remedy is a reading rule, not fewer headers.
- **It was not the only driver.** By Opus's own account: "a new class looks like design work; a guard
  clause looks like admitting the fix is trivial", and never tracing the reported input through its
  own design (the `getFullClaudeSkillCommand()` identity flaw survived to the end). The SRP fear
  explains *why the fix went somewhere else*; those two explain *why nobody noticed*. Softening the
  headers would address the first and leave the other two intact.

Proposed rule text, in the repo's ~15-line `CLAUDE.md` format, to sit beside "No `-er` suffix
classes" and "Check For Existing Code Before Creating New Functions" (same instinct, applied to
classes):

> ## SRP Headers Are Summaries, Not Fences
>
> **RULE: The `SRP Does` line describes what a class does *today*; the `Knows Nothing About` line is
> the boundary. If a change stays inside "Does" (including handling that operation's own failure
> cases) and touches nothing in "Knows Nothing About", it belongs in that class — modify it and
> update the header. Never build a decorator/wrapper/helper beside a class to avoid editing it.**
>
> Warning signs:
> - 🚩 "…so `<ExistingClass>` keeps its single responsibility" used as the reason for a new class
> - 🚩 The proposed class name is a *step* in an algorithm (`ClaimingRegistry`,
>   `DuplicateTolerantCommand`), not a *thing* in the domain (`Workspace`, `AhqWorkflow`)
> - 🚩 The defect was pinpointed to a line in class X and the fix is proposed somewhere else
> - 🚩 A confident change table for a new abstraction, with no existing class named as considered
>
> What to do instead:
> - List the existing classes on the call path; for each, say why it *cannot* own the behaviour
> - Check the change against the class's `Knows Nothing About` list — that is the real fence
> - Trace the exact reported input through the proposed design and show the values at each step
> - If it is still a new class, its name must be a domain noun you can point at
>
> Real example (2026-08-16, AHQ-205): defect pinpointed at `WorkflowRegistryImpl.register()`; fix
> proposed as a new `ClaimingRegistry` decorator "so the class keeps its SRP" — the ~4-line guard
> belonged in `register()` all along.

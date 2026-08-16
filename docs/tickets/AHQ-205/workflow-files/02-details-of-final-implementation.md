# AHQ-205 — Details Of Final Implementation

> **Ticket:** [AHQ-205](https://agentic-hq.atlassian.net/browse/AHQ-205) — *Bug: agentic-hq CLI
> Installed From Npm Crashes When add-feature Workflow Runs From AHQ Workspace Root*
> **Type:** Sub-task (Bug) · **Parent:** [AHQ-195](https://agentic-hq.atlassian.net/browse/AHQ-195)
> Sub-Task 6 of 8 · **Implemented:** 2026-08-16 (Claude Fable 5), executing
> [`01-research-and-plan-of-action.md`](01-research-and-plan-of-action.md) with all §10 defaults
> confirmed by the human ("All confirmed - I agree with your recommendations").

**Status (2026-08-16):** implementation **complete and verified** — all five TDD cycles done,
`pnpm validate` green (37 files / 176 unit tests), both `tests/integration/bin/*` files green, the
exact filed scenario re-run by hand through the prebuilt wrapper and confirmed fixed. **Nothing is
committed yet** — the working tree holds 15 modified files + 2 new files (this doc and the I1 test;
see §5); run `/git:02-…` when ready. One question raised by the human mid-implementation is recorded in §6 for
their decision; the code follows the approved plan (silent first-wins) unless they say otherwise.

---

## 1. What Was Done — In One Screen

One rule, four small production edits, twelve tests. Exactly the plan's §3.3, nothing added.

> **The first registration of a short name wins; later ones are not registered.** Walk order:
> built-in `list` (registered first by `createProgram`), then the **local workspace**, then the
> AHQ package; within a workspace, plugin-directory order then glob order.

| # | File | The change (non-comment lines) |
| --- | --- | --- |
| 1 | `src/cli/workflow-registry-impl.ts` | **The crash fix.** Guard at the top of `register()`: `if (this.program.commands.some((cmd) => cmd.name() === shortName)) return;` — 3 lines. SRP header's *Does* and *Knows About* clauses updated. |
| 2 | `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts` | **Precedence.** `registerWorkflowsWith` now calls `currentUserWorkspace` first, then `ahqPackage` (the two lines swapped). |
| 3 | `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` | **Same winner at the Claude layer.** `getClaudeCliPluginDirArgs` pushes the user's `--plugin-dir` flags first, then the package's (the two statements swapped). |
| 4 | `src/cli/listing/listing-formatter.ts` + `colors.ts` + `agentic-hq-program.ts` | **The DISABLED flag.** A `claimedShortNames: Set<string>` (seeded with the exported `LIST_SUBCOMMAND_NAME`) is threaded `formatWorkflowsListing → localWorkspaceBlock/workspaceBlock → allPluginBlocksIn → pluginBlock → workflowEntry`; the local block is *rendered* first (registration order) but *assembled* second (display order); `workflowEntry` prepends `COMMAND_INDENT + formatDisabledFlag("DISABLED — shortId '<x>' is already used by existing workflow")` when the name is already claimed. `colors.ts` gains `red` + `formatDisabledFlag = bold(red(s))`. |
| — | `src/workflow-discovery/workspace/workspace-impl.ts` | Comment only — the plan's §5 path-normalisation decision recorded on `isAhqPackage()` (replaces the stale `per Q5`). |
| — | `src/cli/agentic-hq-program.ts` | Comment at the `list` registration: registered before workflows on purpose. |

**No new production files. No new classes. No interface changes.** `WorkspaceImpl`, `PluginImpl`,
`AhqPackageImpl`, `CurrentUserWorkspaceImpl`, `WorkflowRegistry`, `WorkflowSearchResults`,
`Workspace`, `Plugin`, `AhqWorkflow` — all untouched apart from the one comment above.
Production diff: 7 files, +98 / −29 lines, the large majority of which is comments/JSDoc.

**Why it fixes the bug completely:** all four reproductions (local-vs-package, two plugins in one
workspace, a workflow named `list`, and the filed prebuilt-from-repo-clone case) are the same event
— a short name arriving twice — and edit 1 catches every one before Commander sees it. Edits 2–3
make the winner the one the human decided on (local), at both the CLI and Claude layers. Edit 4
makes the outcome visible in `agentic-hq list`.

---

## 2. The Production Code, As Landed

`src/cli/workflow-registry-impl.ts` — `register()`:

```ts
  /**
   * Register a Commander subcommand for the given workflow — unless its short name is
   * already a subcommand, in which case do nothing: the first registration wins (AHQ-205).
   * Commander would otherwise throw `cannot add command 'x' as already have command 'x'`.
   * (Commander's own duplicate check also matches aliases; nothing here uses aliases —
   * add `cmd.aliases().includes(shortName)` to the guard if that ever changes.)
   */
  register(workflow: AhqWorkflow): void {
    const shortName = workflow.getShortName().toString();
    if (this.program.commands.some((cmd) => cmd.name() === shortName)) {
      return;
    }
    const description = workflow.getDescription().toString();
    // ...unchanged...
```

`src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts`:

```ts
  registerWorkflowsWith(registry: WorkflowRegistry): void {
    this.currentUserWorkspace.registerWorkflowsWith(registry);
    this.ahqPackage.registerWorkflowsWith(registry);
  }
```

`src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` — `getClaudeCliPluginDirArgs()`:

```ts
    const flags: string[] = [];
    // The user's plugin dirs go FIRST: Claude Code keeps only the first of two --plugin-dir
    // flags that name the same plugin (probed 2026-08-16, AHQ-205), so this order is what makes
    // "local workspace wins" true at the Claude layer, not just in the CLI's subcommand table.
    if (!this.currentUserWorkspace.isAhqPackage()) {
      this.addPluginDirsFrom(userPluginsDir, flags);
    }
    this.addPluginDirsFrom(ahqPluginsDir, flags);
    return flags;
```

`src/cli/listing/listing-formatter.ts` — the two new constants and the three methods that changed
in substance (the four intermediate methods just pass `claimedShortNames` along):

```ts
const DISABLED_FLAG_PREFIX = "DISABLED — shortId '";
const DISABLED_FLAG_SUFFIX = "' is already used by existing workflow";

  formatWorkflowsListing(ahqPackage: Workspace, localWorkspace: Workspace): string {
    // Rendered in REGISTRATION order (the local workspace claims short names first — AHQ-205)
    // but assembled in DISPLAY order (package block first). This is the same first-claim walk
    // WorkflowSearchResultsImpl.registerWorkflowsWith performs (`list` is registered before any
    // workflow, so it is pre-claimed), so what is flagged DISABLED here is exactly what
    // registration skipped.
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
    return (
      flagLine +
      this.workflowCommandLine(workflow) +
      LINE_BREAK +
      this.workflowDescriptionLine(workflow)
    );
  }

  private disabledFlagLine(shortName: string): string {
    return (
      COMMAND_INDENT + formatDisabledFlag(DISABLED_FLAG_PREFIX + shortName + DISABLED_FLAG_SUFFIX)
    );
  }
```

`localWorkspaceBlock` keeps its `isAhqPackage()` branch and claims nothing in it — mirroring
`CurrentUserWorkspaceImpl.registerWorkflowsWith`, which registers nothing in the U = P case.

`src/cli/listing/colors.ts`: `const red = wrap(31, 39);` and
`export const formatDisabledFlag = (s: string): string => bold(red(s));`.

`src/cli/agentic-hq-program.ts`: `export const LIST_SUBCOMMAND_NAME = 'list';` (was un-exported).
`listing-formatter.ts` imports it from `../agentic-hq-program.js` — checked: no runtime import
cycle (the program factory only *type*-imports `WorkflowSearchResults`; `WorkflowRegistryImpl` is
type-only downstream), and no `import/no-cycle` rule is configured. ESLint's `import/order`
required the new import to sit in the parent-import group with the type imports (fixed on the first
`pnpm validate` run).

---

## 3. Testing Details

Everything in this section was actually executed in this session; every observation quoted is
from a real run, not inferred. Sub-sections: 3.1 the automated tests added · 3.2 how each level was
run · 3.3 the TDD log · 3.4 full-suite and integration verification · 3.5 manual / real-program
testing · 3.6 what was **not** tested, and why.

### 3.1 Automated tests added — the twelve from the plan, all landed

| # | Level | File | Test name (abridged) | Pins |
| --- | --- | --- | --- | --- |
| I1 | integration | `tests/integration/bin/agentic-hq-list-from-a-workspace-with-a-colliding-short-id.integration.test.ts` **(new)** | should exit 0 and flag exactly one DISABLED entry — the package copy, in the package block | the whole bug, end to end, through the dev bin wrapper |
| R1 | unit | `tests/unit/cli/workflow-registry-impl.unit.test.ts` | should keep the first workflow and not throw when a second workflow has the same short name | first-wins; one subcommand; the *first* full command runs |
| R2 | unit | same | should never replace a subcommand the program already has (a workflow named "list" does not shadow the built-in) | reserved names survive |
| P1 | unit | `tests/unit/cli/agentic-hq-program.unit.test.ts` | should survive a discovered workflow named "list" and still print the injected listing for the list command | `createProgram` + built-in `list` |
| S1 | unit | `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts` | should register the local workspace workflows before the AHQ package workflows | registration order (local first) |
| S2 | unit | same | should flag exactly the AHQ package copy as DISABLED in the listing when the local workspace claims the shortId first | registry ↔ listing agreement over **real** two-root discovery |
| C1 | unit | `tests/unit/tools/claude-code/claude-command-builder.unit.test.ts` | should place every user-workspace --plugin-dir flag before every AHQ-package one | second defect |
| F1 | unit | `tests/unit/cli/listing/listing-formatter.unit.test.ts` | should flag the package copy (not the local one) when package and local share a shortId | flag directly above the package entry only |
| F2 | unit | same | should flag only the second of two plugins in one workspace that share a shortId | repro 3 |
| F3 | unit | same | should flag a workflow whose shortId is "list" (the built-in subcommand is pre-claimed) | repro 4 |
| F4 | unit | same | should show no DISABLED flag anywhere when no shortIds collide | negative control |
| F5 | unit | same | should show no DISABLED flag when local IS the AHQ package even though it has the same plugins | U = P |

Test infrastructure: `tests/unit/workflow-discovery/test-fixtures/workspace-fixture.ts` gained
`createSingleWorkflowFixture(rootDir, pluginId, skillId, { shortId, description, exampleParameters })`,
and — as the Cycle 2 REFACTOR decided on the spot — `createTestWorkspaceFixture` was reimplemented
on top of it (its three inline JSON blocks became three calls; the no-`ahq-workflow.json` skill dir
is unchanged). All 18 workflow-discovery unit files (83 tests, six of which use that fixture) stayed
green across the rewrite. The search-results test gained a small local helper,
`createPackageAndCollidingLocalRoots(tmpdir)`, shared by S1 and S2.

Across the five touched unit files the count went 35 → 46 (+11; measured before and after);
the full unit suite ends at 176. Integration +1. `pnpm validate` runs unit only, so I1 was run
explicitly (§3.4).

### 3.2 How each level was run

Single files while working, the full suite only at the end (per CLAUDE.md "Running Tests
Efficiently"); the whole integration suite was **never** run (it holds the `release/` contention).

| Level | Command used | Notes |
| --- | --- | --- |
| Unit, single file(s) | `pnpm test <file> [<file>…]` (= `vitest run --config vitest.unit.config.ts`) | used for every RED/GREEN/VERIFY step; e.g. `pnpm test tests/unit/cli/workflow-registry-impl.unit.test.ts tests/unit/cli/agentic-hq-program.unit.test.ts` |
| Unit, a directory | `pnpm test tests/unit/workflow-discovery/` | after rewriting the shared fixture (18 files / 83 tests) |
| Unit, everything | `pnpm validate` (typecheck → lint → format → `pnpm test`) | final gate; run three times (see housekeeping in 3.3) |
| Integration, single file | `pnpm test:integration tests/integration/bin/<file>` | I1 (RED at Cycle 0, GREEN after Cycle 4) and the neighbouring `bin-wrapper-supplies-the-package-root-explicitly` |
| Real program, dev wrapper | `node <repo>/bin/agentic-hq.cjs list` / `--help` / `add-feature --help` / `add-feature` from `temp/AHQ-205/{repro-workspace,variant-b,variant-c}` and from the repo root | GREEN-means-run-it checks after Cycles 1–4 |
| Real program, prebuilt wrapper | `pnpm build` then `node release/bin/agentic-hq-prebuilt.cjs list` and `… add-feature --help` from the repo root | the exact filed scenario |
| Colour rendering | `script -q /dev/null node bin/agentic-hq.cjs list \| cat -v` | fakes a TTY so `colors.ts` enables ANSI |

### 3.3 TDD log — cycle by cycle

Every test was run **before** its implementation and observed failing for the stated reason; no
test was edited between its RED run and its post-implementation run. Baseline before any change:
the five unit files to be touched = 35 tests green; `node bin/agentic-hq.cjs list` from
`temp/AHQ-205/repro-workspace` = exit 1, `Error: cannot add command 'add-feature' as already have
command 'add-feature'` at `workflow-registry-impl.ts:36`.

| Cycle | RED (observed) | GREEN | REFACTOR | VERIFY (observed) |
| --- | --- | --- | --- | --- |
| **0** — I1 | Written first; failed at `expect(stderr).not.toContain('cannot add command')` — the full Commander stack trace on stderr, exit 1. Left red until Cycle 4. | — | — | Went green at the end of Cycle 4 (below). |
| **1** — R1, R2, P1 | All three: `cannot add command 'add-feature'` / `'list'` thrown from `register()`. | The 3-line guard + SRP header. | Comment at `agentic-hq-program.ts` `list` registration ("registered BEFORE the discovered workflows on purpose"). | Both files 10/10 green. Real: `list` and `--help` from `repro-workspace`, `variant-b`, `variant-c` all exit 0; both `add-feature`s listed unflagged (expected at this point); `--help` in `variant-c` still shows the built-in `list`. |
| **2** — S1 | `expected '/test-plugin-alpha:math-skill' to be '/local-plugin:my-math'` (package registered first). | The two-line swap + JSDoc. | `createTestWorkspaceFixture` rebuilt on `createSingleWorkflowFixture` (decided here, not deferred); `isAhqPackage()` comment records the plan's §5 decision. | All 18 discovery files 83/83 green after the fixture rewrite. Real: `agentic-hq add-feature --help` from `repro-workspace` prints **"A LOCAL workflow that happens to share a name with a shipped one"** — the local one wins. |
| **3** — C1 | `expected 2 to be less than 0` (user's flag at index 2, package's at 0–1). | The two-statement swap + comment. | None needed (the existing REFACTOR comment above the method left intact). | File 14/14 green. Real: started `agentic-hq add-feature` from `repro-workspace` under `timeout 25` and read the `[CLICommand] Running:` line — `--plugin-dir=…/repro-workspace/.agentic-hq/plugins/my-local-plugin` is now first, followed by the four package plugin dirs. No stray process left behind (checked `ps`). |
| **4** — F1–F5, S2 | F1, F2, F3, S2: `expected [] to have a length of 1` (no DISABLED rendered); F4, F5 passed trivially as negative controls. | `colors.ts` helper, `export LIST_SUBCOMMAND_NAME`, formatter threading. | `ListingFormatter` SRP header gains the DISABLED / walk-order clauses; the two flag constants sit with the file's other literal-text fragments. | 23 unit files (cli + workflow-discovery + tools/claude-code) 123/123 green; **I1 green**. Real runs in §3.5. |
| **Final** | — | — | — | `pnpm validate` green; both integration files green; the filed scenario by hand (§3.5); one sentence in `docs/dev/how-agentic-hq-works.md` item 5. |

Housekeeping during Final: the first `pnpm validate` failed lint (`import/order`: the new
`LIST_SUBCOMMAND_NAME` import needed to join the parent-import group) and then formatting (prettier
flagged **only** `tests/unit/cli/listing/listing-formatter.unit.test.ts`, a file written in this
session — scope confirmed, so `prettier --write` was run on that one file only). Third run clean.

### 3.4 Full-suite and integration verification

**`pnpm validate`** (typecheck + lint + format + unit), repo root: **pass** — `tsc --noEmit` clean,
`eslint .` clean, `prettier . --check` clean, `Test Files 37 passed (37)`, `Tests 176 passed (176)`.

**Integration, run individually** (never the whole suite — `release/` contention):
`agentic-hq-list-from-a-workspace-with-a-colliding-short-id` 1/1 pass;
`bin-wrapper-supplies-the-package-root-explicitly` 2/2 pass (this one runs `list` from the repo
root, so it doubles as the U = P regression check).

### 3.5 Manual / real-program testing

**Real runs through the dev wrapper** (`node bin/agentic-hq.cjs list`, output piped so colours off):

- `temp/AHQ-205/repro-workspace` — package block:
  ```
      Plugin: agentic-hq-demos-plugin

        DISABLED — shortId 'add-feature' is already used by existing workflow
        agentic-hq add-feature -- --ticket-id=PROJ-123
          Add a small feature using a simple four-stage research/plan/implement/review workflow
  ```
  local block clean:
  ```
    Local Workspace: /Users/stevepersonal/dev/agentic-hq/agentic-hq/temp/AHQ-205/repro-workspace

      Plugin: my-local-plugin

        agentic-hq add-feature -- --ticket-id=LOCAL-1
          A LOCAL workflow that happens to share a name with a shipped one
  ```
- `variant-b` (two plugins, one workspace): `plugin-one`'s `dup` clean, `plugin-two`'s `dup`
  flagged `DISABLED — shortId 'dup' is already used by existing workflow`.
- `variant-c` (workflow named `list`): flagged `DISABLED — shortId 'list' is already used by
  existing workflow`; `--help` still lists the built-in `list`.
- Repo root (U = P): zero `DISABLED` lines; `Local Workspace: Same as Agentic HQ Package (…)`.
- Colour check under a pseudo-TTY (`script -q /dev/null …| cat -v`): the flag line is
  `^[[1m^[[31mDISABLED — shortId 'add-feature' …^[[39m^[[22m` — bold + red, closed properly.

**The exact filed scenario, by hand** — with nothing else using `release/` (checked `ps` for
`vitest`/`build-release`: none), `pnpm build` (→ `build-release: staged …/release`), then from the
repo root:

```
$ node release/bin/agentic-hq-prebuilt.cjs list

Available workflows

  Agentic HQ Package: /Users/stevepersonal/dev/agentic-hq/agentic-hq/release

    Plugin: agentic-hq-demos-plugin

      DISABLED — shortId 'add-feature' is already used by existing workflow
      agentic-hq add-feature -- --ticket-id=PROJ-123
        Add a small feature using a simple four-stage research/plan/implement/review workflow

      DISABLED — shortId 'math' is already used by existing workflow
      agentic-hq math -- --input-number=11
        Passes a number through three chained math steps

  Local Workspace: /Users/stevepersonal/dev/agentic-hq/agentic-hq

    Plugin: agentic-hq-core-plugin

      agentic-hq create-workflow
        Create a new Agentic HQ workflow

    Plugin: agentic-hq-demos-plugin

      agentic-hq add-feature -- --ticket-id=PROJ-123
        Add a small feature using a simple four-stage research/plan/implement/review workflow

      agentic-hq add-feature-detailed-example -- --verbosity=low --suggest-large-refactor=false --ticket-id=PROJ-123
        Worked example of a detailed, opinionated seven-stage add-feature workflow based on one creator's development process

      agentic-hq full-jira -- --jira-id=TEST-123
        Full TDD story workflow driven by a Jira ticket

      agentic-hq math -- --input-number=11
        Passes a number through three chained math steps

      agentic-hq quick-jira -- --jira-id=TEST-123
        Reads a Jira ticket and completes it via TDD

      agentic-hq reversal -- --string-to-reverse='hello there you'
        Reverses a string (hello world demo)

EXIT=0

$ node release/bin/agentic-hq-prebuilt.cjs add-feature --help
Usage: agentic-hq add-feature [options]

Add a small feature using a simple four-stage research/plan/implement/review
workflow

Options:
  -h, --help  display help for command
EXIT=0
```

Both invocations from the Jira now exit 0. The release package ships only `add-feature` + `math`
(`EXCLUDED_UNMIGRATED_SKILLS` in `scripts/build-release.cjs`), and both are flagged because the
local (source-tree) copies claimed the names first — exactly what the plan's §2.4 predicted, and
the "bonus" it described: a contributor in the repo clone now gets the full 6-skill local demos
plugin at the Claude layer too, not the 2-skill release copy.

**Real `add-feature` start (Cycle 3):** from `repro-workspace`, `timeout 25 node bin/agentic-hq.cjs
add-feature`; the `[CLICommand] Running:` line logged before the PTY spawn read
`claude --plugin-dir=…/repro-workspace/.agentic-hq/plugins/my-local-plugin --plugin-dir=…/agentic-hq/.agentic-hq/plugins/agentic-hq-core-plugin --plugin-dir=…/agentic-hq-demos-plugin --plugin-dir=…/agentic-hq-utilities-plugin --plugin-dir=…/steve-test-plugin …`
— the local plugin dir first. `ps` afterwards showed no orphaned process from that run.

### 3.6 What was NOT tested, and why

- **The e2e suite** (`pnpm test:e2e`) was not run: it needs the globally-linked `agentic-hq` on
  PATH and, for most files, a live Claude session. Inspected instead: the only e2e that creates a
  local workflow (`string-reversal-workflow-in-new-workspace-lists-and-executes`) uses the unique
  shortId `string-reversal-copy-for-test` — no collision, no listing change; no e2e asserts entry
  order or the absence of extra lines. `cross-workspace-list-workflows` asserts only title, a
  workflow name and its description — unaffected.
- **A Claude session running the winning local `add-feature` to completion** was not done: the
  repro fixture's local plugin has only an `ahq-workflow.json` (no `SKILL.md`), so it was never
  runnable, and the point of Cycle 3 is the flag *order* Claude receives, which the logged command
  line proves. That Claude honours "first `--plugin-dir` wins" was probed empirically in the
  previous session (LEGACY §5.2) and is not re-probed here.
- **`publish-guards` / `build-determinism` integration tests** were not run (out of scope; they
  contend on `release/`). `pnpm build` was run once, alone, for the manual prebuilt check.
- **Alias collisions** — the guard matches `cmd.name()` only. Nothing in the program registers
  Commander aliases today; the JSDoc says what to add if that changes. No test, deliberately.
- **Windows / path-separator edge cases** — not tested (macOS only, as the whole repo currently
  is); path normalisation was decided record-only (plan §5).

---

## 4. Deviations From The Plan (all minor, all stated)

- **Cycle 3's real run** used `timeout 25 node bin/agentic-hq.cjs add-feature …` and captured the
  `[CLICommand] Running:` line non-interactively instead of the plan's "start it and Ctrl-C" —
  same observation, no Claude session needed to complete. Confirmed no orphaned process.
- **`import/order`** placement of the new import in `listing-formatter.ts` (parent group with the
  type imports, blank line before the sibling group) — the plan didn't specify; ESLint did.
- **`createSingleWorkflowFixture` signature** takes `(rootDir, pluginId, skillId, metadata)` and
  derives both directory names from the ids (true of every fixture in the file), rather than a
  path + object — the plan left the shape open.
- Nothing else. No production change beyond §3.3 of the plan; no interface touched; wording of the
  flag is the human's exact wording (decision 3 default), rendered as its own line at the command
  indent (§10.3 default).

---

## 5. Files Changed

**Source — `src/` (7, all modified, none added/deleted)**

| File | Change |
| --- | --- |
| `src/cli/workflow-registry-impl.ts` | the guard; SRP header + JSDoc |
| `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts` | local-first swap; JSDoc |
| `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` | user-dirs-first swap; comment |
| `src/cli/listing/listing-formatter.ts` | `claimedShortNames` threading, DISABLED flag, SRP header |
| `src/cli/listing/colors.ts` | `red`, `formatDisabledFlag` |
| `src/cli/agentic-hq-program.ts` | `export LIST_SUBCOMMAND_NAME`; comment at `list` registration |
| `src/workflow-discovery/workspace/workspace-impl.ts` | comment only (`isAhqPackage()` — path-normalisation decision) |

**Tests — `tests/` (6 modified, 1 added)**

| File | Change |
| --- | --- |
| `tests/integration/bin/agentic-hq-list-from-a-workspace-with-a-colliding-short-id.integration.test.ts` | **added** — I1 |
| `tests/unit/cli/workflow-registry-impl.unit.test.ts` | + R1, R2 |
| `tests/unit/cli/agentic-hq-program.unit.test.ts` | + P1 |
| `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts` | + S1, S2, `createPackageAndCollidingLocalRoots` helper |
| `tests/unit/tools/claude-code/claude-command-builder.unit.test.ts` | + C1 |
| `tests/unit/cli/listing/listing-formatter.unit.test.ts` | + F1–F5 (nested `describe`), prettier-formatted |
| `tests/unit/workflow-discovery/test-fixtures/workspace-fixture.ts` | + `createSingleWorkflowFixture`; `createTestWorkspaceFixture` rebuilt on it |

**Docs (3)**

| File | Change |
| --- | --- |
| `docs/dev/how-agentic-hq-works.md` | one sentence added to item 5 (first-wins, local before package, DISABLED in `list`) |
| `docs/tickets/AHQ-205/workflow-files/01-research-and-plan-of-action.md` | Status block only — now points here; plan body untouched |
| `docs/tickets/AHQ-205/workflow-files/02-details-of-final-implementation.md` | this file (**added**) |

Not touched, deliberately: user-facing docs (AHQ-199 rewrites them), `release/` (build output,
gitignored — was rebuilt for the manual check), the fixtures under `temp/AHQ-205/` (gitignored,
still on disk, still useful).

---

## 6. For The Human — One Open Question, Raised Mid-Implementation

While Cycle 3 was being verified the human asked: *should `register()` throw a named custom
exception (e.g. `ShortIdAlreadyRegisteredException`) that the caller handles or rethrows, rather
than silently returning — isn't a silent return a muted response and an anti-pattern?*

The answer given (recorded here so it is not lost), with the recommendation **not** to do it:

- Under decisions 1 and 3 a duplicate is **not an error — it is the expected outcome of a policy**
  (a local workflow legitimately shadows a shipped one; in the filed scenario it happens on *every*
  invocation, by construction). Throwing on a guaranteed, expected path and catching one frame up is
  exception-as-control-flow. The guard is `putIfAbsent`, not swallowed error handling — it doesn't
  catch Commander's throw, it prevents the precondition.
- **No caller has anything useful to do with it.** The chain is `PluginImpl.registerWorkflowsWith`
  (a `for` loop) → `WorkspaceImpl` → `CurrentUserWorkspaceImpl`/`AhqPackageImpl` →
  `WorkflowSearchResultsImpl` → `createProgram`. "Correct handling" per the decisions is *continue
  with the next workflow*, so the catch would sit in `PluginImpl`'s loop and do nothing —
  behaviourally identical to the `return`, with more moving parts; a rethrow anywhere is the crash
  being fixed.
- It would push the CLI's registration policy into the discovery layer: `WorkflowRegistry` lives in
  `workflow-discovery/interfaces`, so the exception type would too, and `PluginImpl` (whose SRP says
  it *Knows Nothing About* how registration works) would learn a specific registry failure mode.
- The "muted" concern is answered where the user actually looks: the bold-red `DISABLED` line in
  `agentic-hq list`; the code-facing side is a documented contract (JSDoc + SRP header).
- **Cost if wanted anyway:** ~1 hour, ~6 files (exception class, `register()` throws, `PluginImpl`
  catch-and-continue + its SRP header + a test, `StubWorkflowRegistry`, R1/R2/P1 re-expressed). No
  user-visible difference.
- **Proportionate middle ground if a non-silent *code* signal is wanted:** `register()` returns
  `boolean` (registered / skipped) — a result, not an exception; ~1 line each in the interface,
  impl and stub. Nothing consumes it today (the listing computes losers itself, decision B), so it
  is YAGNI, but cheap and honest.

**Decision needed:** keep as implemented (recommended) / add the boolean return / add the exception.
The code as it stands is the plan's silent first-wins.

---

## 7. Out Of Scope (unchanged from the plan)

Publishing (AHQ-201 — this fix reaches npm with the next re-publish); migrating the five
unmigrated workflows (AHQ-201); splitting `Workspace` (AHQ-206); the `release/` contention between
`publish-guards` and `build-determinism` (I1 avoids `release/` entirely; the manual prebuilt check
was done with nothing else building). Path normalisation: record-only, as decided — no code change.

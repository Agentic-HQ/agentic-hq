# AHQ-200 — Feature Brief

## One Sentence Outcome

The `AGENTIC_HQ_WORKSPACE_ROOT` env var is eliminated from the working system — every reader now
receives the explicit `ahq-package-root` parameter instead — and the obsolete "AHQ workspace"
concept is renamed to the honest "AHQ package" (`AhqPackageImpl` / `isAhqPackage()` /
"Agentic HQ Package:" listing label), with zero functionality change beyond that sanctioned label
update.

## User Story

**As a**: developer working on the agentic-hq codebase  
**I want:** the package root to flow as one explicit, visible parameter with honest names  
**So that:** no code depends on hidden environment state and the system tells one consistent story

## Human Prompt

This is a subtask of AHQ-195, and is detailed in the parent ticket at:
docs/tickets/AHQ-195/workflow-files/01-feature-brief.md
Please be sure to read the details of how this was split in that ticket and be especially 
careful to fully read and understand any relevant Addenda

## My Understanding of This Task

AHQ-200 is Sub-Task 5 of AHQ-195: the **isolated, zero-functionality-change refactor** the parent
brief calls the "Final Refactor Stage" — eliminate the `AGENTIC_HQ_WORKSPACE_ROOT` env var from the
**working system** by migrating every remaining legacy reader onto the explicit
`ahq-package-root` / `ahqPackageRoot` parameter that AHQ-197 already threads through the whole
chain (entry-point wrappers → `--ahq-package-root=` → `AhqCommandLine` → `AhqRuntimeParams` →
`CompositionRoot`), then deleting the env-var dual-writes from both bin wrappers. Every reader
already receives the same value by construction, so each step is behavior-preserving; the full
validation suite plus the live e2e proofs (math-workflow, add-feature) are the safety net. The
five still-broken, unmigrated workflows and the create-workflow scaffolder keep their legacy
references — migrating those is explicitly Sub-Task 7's (AHQ-201's) job, so a repo-wide grep only
becomes fully clean after AHQ-201, not after this ticket.

My research (below) verified the parent brief's inventory against today's code: the remaining live
readers are `AhqWorkspaceImpl.getRoot()`, `WorkspaceImpl.isAhqWorkspace()`, and the migrated
`add-feature-cli.ts` (which also relays the value into the command .md files under the doomed name
`agentic-hq-workspace-root-dir`); the writers are the two bin wrappers. The ripple is slightly
wider than the parent brief's "five unit-test files": `WorkflowSearchResultsImpl` constructs both
workspace classes no-arg, as do two further unit-test files, so constructor injection touches
those too. Note the deliberate non-goal: `isAhqWorkspace()` is the neighbourhood of the AHQ-205
name-collision bug — this ticket must migrate its *source of truth* (env var → injected
parameter) with behaviour preserved bit-for-bit, and must **not** attempt the AHQ-205 fix
(deliberately scheduled after this ticket). The ticket also includes a **distinct final rename
stage** (Question 4): the obsolete "AHQ workspace" concept is ditched — `AhqWorkspaceImpl` becomes
`AhqPackageImpl` (still implementing `Workspace`, carrying a REFACTOR LATER comment pointing at
the deferred interface-split refactor,
[AHQ-206](https://agentic-hq.atlassian.net/browse/AHQ-206) — description recorded in
`supporting-docs/`).

## Research Findings

### The new explicit chain is fully in place (AHQ-197/198/202/204 — all complete)

- Both bin wrappers pass `--build-mode=…` and `--ahq-package-root=…` explicitly:
  `bin/agentic-hq.cjs:34-43` (dev, `build-first`) and `bin/agentic-hq-prebuilt.cjs:31` (shipped,
  `prebuilt`). Both **dual-write** the env var for legacy readers only — `agentic-hq.cjs:27`,
  `agentic-hq-prebuilt.cjs:25` — each with a comment saying AHQ-200 retires it (the dev wrapper's
  is the original REFACTOR note at lines 20–26 that first asked for this work).
- `DefaultAhqCommandLine` (`src/runtime-params/default-ahq-command-line.ts`) parses both options
  fail-fast (required, no defaults); `DefaultAhqRuntimeParams` carries the `AhqPackageRoot` value
  object (`src/runtime-params/default-ahq-package-root.ts`); `CompositionRoot` holds the params
  (`src/kernel/composition-root.ts:32`).
- The workflow side: the shared runner `scripts/run-workflow.cjs` forwards both options to the
  workflow JS; `DefaultWorkflowRuntime` (`src/workflow-runtime/default-workflow-runtime.ts`)
  consumes them. The `WorkflowRuntime` interface exposes only `getClaudeCodeTool()` and
  `getWorkflowArgs()` — it does **not** yet expose the package root to workflow programs (the seam
  the add-feature CLI migration needs).

### Remaining live writers/readers of AGENTIC_HQ_WORKSPACE_ROOT (verified 2026-08-14, working system)

1. **Writers (2):** `bin/agentic-hq.cjs:27` and `bin/agentic-hq-prebuilt.cjs:25` (dual-writes to
   delete last).
2. **`AhqWorkspaceImpl.getRoot()`** (`src/workflow-discovery/workspace/ahq-workspace-impl.ts:44`):
   `env var ?? process.cwd()`. Also exports the `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` constant
   (line 7), imported by `tests/unit/kernel/composition-root.unit.test.ts:15`. Constructed no-arg
   in `CompositionRoot.getAhqWorkspace()` (`composition-root.ts:42`, whose comment names AHQ-200),
   in `WorkflowSearchResultsImpl` (`src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts:33`),
   and in unit tests.
3. **`WorkspaceImpl.isAhqWorkspace()`** (`src/workflow-discovery/workspace/workspace-impl.ts:75`):
   string equality with the env var — the dedup guard. Consumers of `isAhqWorkspace()`:
   `CurrentUserWorkspaceImpl` (skip double registration, `current-user-workspace-impl.ts:40`),
   `claude-command-builder.ts:127`, and `listing-formatter.ts:91`. `CurrentUserWorkspaceImpl` is
   itself constructed no-arg in `CompositionRoot` (line 46), `WorkflowSearchResultsImpl` (line 34),
   and unit tests — so the injected root must reach it too.
4. **`add-feature-cli.ts`** (the only *migrated* workflow CLI still reading the env var — AHQ-204
   deliberately left it for this ticket, per `docs/tickets/AHQ-204/01-work-details.md`): reads it
   at lines 33/54, fail-fast check at 55–63, then broadcasts it to all four commands as
   `agentic-hq-workspace-root-dir=…` (line 67). The four
   `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/0?-*.md` files parse that
   variable name from the input string — the parent's final-stage step 2 renames it to match
   (`ahq-package-root`). math-workflow's CLI never reads the env var — nothing to do there.
5. **Unit tests (7 files):** five set/delete the env var
   (`ahq-workspace-impl`, `workspace-impl`, `current-user-workspace-impl`,
   `workflow-search-results-impl`, `composition-root` — the last via the exported constant with
   `vi.stubEnv`), and two more construct the workspace classes no-arg
   (`fake-claude-executes-command-using-file-io`, `claude-code-tool-with-injected-io-marshaller`).
6. **Dev docs (2):** `docs/dev/how-agentic-hq-works.md` (3 mentions, incl. the mermaid diagram at
   line 31) and `docs/dev/project-design-requirements.md` (1 mention, line 165).

### Explicitly out of scope — left for AHQ-201 (parent-brief carve-out: "the still-broken workflows' legacy references are migrated in Sub-Task 7")

- Five unmigrated SKILL.md launch commands using `$AGENTIC_HQ_WORKSPACE_ROOT` (`ln -sfn` pattern):
  string-reversal, quick-jira-workflow, full-jira-tdd-story-workflow, add-feature-detailed-example,
  create-workflow.
- Two unmigrated ts-workflow CLIs reading the env var: `create-workflow-cli.ts`,
  `add-feature-detailed-example-cli.ts` (plus their command .md files using
  `agentic-hq-workspace-root-dir`).
- The create-workflow scaffolding templates (commands 01–05) that embed the legacy patterns into
  new workflows.
- The known-red `test:e2e:agentic-hq-cli-string-reversal` e2e stays red — it is the recorded
  honest marker of the deliberate AHQ-197 break (AHQ-197 review summary), unchanged by this
  ticket.

### Constraints and safety nets

- **Zero functionality change** is the ticket's contract (parent brief "Final Refactor Stage"):
  one legacy reader at a time, tests green after each step; full validation (`pnpm validate`)
  before and after. The added final rename stage (Question 4) keeps the same contract — renames
  are behaviour-preserving — with one possible sanctioned exception: the user-visible listing
  label, pending the Question 5 decision.
- Safety nets available: 165+ unit tests, the build-determinism and runner integration tests, the
  tarball-install and cross-workspace-math e2es, and the registry-proven add-feature interactive
  flow (AHQ-202).
- New-code principles from the parent (binding): explicit, required, no defaults, no env vars —
  which implies the `process.cwd()` fallback in `AhqWorkspaceImpl.getRoot()` (line 44) does not
  survive constructor injection (Question 3).
- End-state note: the parent's "grep returns only historical `docs/jira-docs/` records" is reached
  only after AHQ-201 migrates the carved-out legacy references above; after AHQ-200 a grep still
  shows the unmigrated plugin files (by design). Per the Question 1 answer, this grep-clean
  end-state is now recorded as an explicit AC on AHQ-201 in the parent brief.
- Adjacency warning: `isAhqWorkspace()` dedup is where the AHQ-205 crash lives
  (`docs/tickets/AHQ-202/workflow-files/supporting-files/AHQ-205_bug_Jira.md`). The human ordered
  AHQ-205 *after* AHQ-200 — this ticket preserves the existing (buggy-on-collision) behaviour
  exactly.

## The Three Root Concepts — In-Depth Analysis

All findings below are verified against today's code (file:line references given), not inferred.
The three *root* concepts analysed here — the AHQ package, the AHQ workspace, and the current
user workspace — each have a root directory. (The shipped workflows are a fourth concept in the
full inventory but have no root of their own: they are contents inside the package — see
"Consequences of the model" below.)

### Concept 1: The AHQ package (root: `ahq-package-root` / `AhqPackageRoot`)

**What it is:** the directory where the *currently executing* agentic-hq distribution lives — the
bin wrappers, the CLI code (TS source in dev; compiled `dist/` JS in prod), the shared runner and
build scripts (`scripts/run-workflow.cjs`, `scripts/build-release.cjs`), and the shipped plugins
tree (`.agentic-hq/plugins/`). Its root is set **structurally, never by detection**: each bin
wrapper computes `path.join(__dirname, '..')` — its own parent — so which wrapper you invoked *is*
the answer (`bin/agentic-hq.cjs:16` → the repo checkout; `bin/agentic-hq-prebuilt.cjs:19` → the
npm-installed package directory). It flows as the explicit `--ahq-package-root=` parameter
(AHQ-197), is modelled by the `AhqPackageRoot` value object (`src/interfaces/ahq-package-root.ts`),
and its current direct consumers are the skill-hop relay (`claude-command-builder.ts:93`) and the
shared runner (`scripts/run-workflow.cjs` — locates the build script, the `release/` tree, and the
workflow JS).

### Concept 2: The AHQ workspace (`AhqWorkspaceImpl`, listing label "Agentic HQ Workspace")

**What the concept originally meant (and still means to a human):** the **whole** checked-out AHQ
repo directory — a genuine workspace in every sense. The shipped workflows are a **separate,
contained concept**: the `.agentic-hq/plugins/` payload found *inside* that directory (container
vs contents — not the same thing).

**What the code models today:** `AhqWorkspaceImpl` wraps the **whole root directory of whichever
copy of the CLI was invoked** in the `Workspace` interface. Its verified jobs: discover the
shipped plugins inside it (`{root}/.agentic-hq/plugins/*`, `workspace-impl.ts:42-49`), supply the
`--plugin-dir` flags (`claude-command-builder.ts:119,126`) and the `Read({root}/.agentic-hq)`
allowedTools grant (`claude-command-builder.ts:105-106`), register shipped workflows with the CLI
(`workflow-search-results-impl.ts:43`), and print the "Agentic HQ Workspace: {path}" section of
`agentic-hq list`. Its root today: env var `?? process.cwd()` (`ahq-workspace-impl.ts:44`).

**The conceptual drift this created:** in dev mode the object points at the repo checkout, so the
original concept is intact — the thing labelled "Agentic HQ Workspace" really is the AHQ
workspace. Running the npm-installed CLI, the *same* object with the *same* label points at the
npm package root — where the original concept simply does not apply (a package's internals are
nobody's workspace). The code fakes conceptual continuity by dressing the package root in the old
workspace's clothes so the discovery machinery works unchanged. The original "AHQ workspace"
concept therefore **survives only in dev mode**; in prod there is only a package containing
shipped workflows.

**The key verified fact:** the AHQ workspace root and the AHQ package root are the same directory
**in both modes, always, by construction** — not only in dev. Both bin wrappers compute one
`packageRoot` and write it to *both* channels: the env var (legacy, `agentic-hq.cjs:27`,
`agentic-hq-prebuilt.cjs:25`) and `--ahq-package-root=` (explicit, `agentic-hq.cjs:39`,
`agentic-hq-prebuilt.cjs:31`). There is no code path where the two roots diverge (the
`?? process.cwd()` fallback fires only when no wrapper ran — tests/pnpm scripts — and is
eliminated by this ticket, Question 3).

So `AhqWorkspaceImpl`'s root is **never a third place**: it is the AHQ package root, always, in
both modes. What *dev mode* changes is not this identity but whether the original workspace
concept applies to that directory: in dev it is the repo checkout — a genuine, editable workspace
(and possibly also your cwd); in prod it is a read-only installed artifact that merely *contains*
the workspace-shaped `.agentic-hq/plugins/` payload. The parent brief's (AHQ-195's) Human
Update 3 reached the same conclusion ("it is genuinely no longer a 'workspace'").

### Concept 3: The current user workspace (`CurrentUserWorkspaceImpl`, listing label "Local Workspace")

**What it is:** the user's project directory — always `process.cwd()`, where they invoked
`agentic-hq` (`current-user-workspace-impl.ts:67`). Its verified jobs: discover *user-authored*
plugins (`{cwd}/.agentic-hq/plugins/`), provide the io-files marshalling temp dir
(`{cwd}/.agentic-hq/temp` — `composition-root.ts:54` wires `JsonFileIOMarshallerSessionFactory`
with the *user* workspace, `json-file-io-marshaller-session-factory.ts:21`), and act as the
working directory the Claude process is spawned from (`default-claude-code-tool.ts:41` passes the
user workspace to `MarshalledCLITool`; `marshalled-cli-tool.ts:46` and
`claude-workflow-command-builder.ts:36` run there). Note what this proves: **all runtime writes go
to the user workspace; nothing ever writes into the package/AHQ-workspace directory** — the
read-only-artifact guarantee holds.

### The overlap model: only TWO independent roots

Because ahq-workspace-root ≡ ahq-package-root always, there are exactly two independent roots in
the system: the **package root (P)** and the **user's cwd (U)**. Every situation is one of two
cases:

| Case | Who hits it | What happens |
| --- | --- | --- |
| **U ≠ P** (normal) | Tool users (npm install, run from own project); contributors running cross-workspace | Both workspaces list/register; plugins come from P and U; Claude runs in U; io-files in U |
| **U = P** (coincidence) | Contributors running from the repo checkout — in practice the only way this happens (no user ever stands inside the npm installation's guts) | The package, the AHQ workspace (original sense), and the user workspace are all one directory. The dedup guard `isAhqWorkspace()` (string equality, `workspace-impl.ts:75`) suppresses double registration (`current-user-workspace-impl.ts:40`), the duplicate `--plugin-dir`s (`claude-command-builder.ts:127`), and the listing repeat ("Same as AHQ", `listing-formatter.ts:91`) |

Consequences of the model:

- **The current user workspace *can* be the AHQ package** — in exactly one real situation:
  dev-from-checkout, where U = P = the repo checkout and **the package, the AHQ workspace, and
  the user workspace are all one directory**.
  In prod it effectively cannot happen — no user cd's into the npm installation's internals — so
  the guard's U = P branch is, in practice, a dev-mode-only phenomenon.
- **The AHQ package *is* the AHQ workspace (original sense) in dev mode only.** In dev the package
  root is the repo checkout, i.e. the AHQ workspace in its original whole-directory sense. In prod
  `AhqWorkspaceImpl` still shares the package's root (the code-level root identity holds in both
  modes), but the original workspace concept no longer applies to that directory — see the
  conceptual-drift paragraph in Concept 2.
- **No new root concept is needed:** `AhqPackageRoot` (AHQ-197) already models the one true
  origin, and after this ticket the package class is *explicitly derived* from it (constructor
  injection) instead of secretly equal to it via the env var. The honest inventory is two roots
  (P, U) carrying **four concepts**: the **package** (the whole directory the running CLI lives
  in); the **AHQ workspace** in its original sense (the whole repo checkout — exists only for
  contributors, and is the package root exactly when the dev binary was invoked); the **shipped
  workflows** (the `.agentic-hq/plugins/` payload inside the package — contents, not container);
  and the **user's workspace** (cwd). All flow as visible pass-through parameters. The remaining
  naming wart — `AhqWorkspaceImpl`, `isAhqWorkspace()`, and the "Agentic HQ Workspace:" listing
  label applying the old workspace name to what is, in prod, just the package (a misnomer twice
  over: not a workspace, and not the AHQ repo either) — is resolved by the rename stage decided
  in Question 4.

### Boundary note (AHQ-205 adjacency)

The dedup guard handles only *identity* (U and P are the same path). It does not handle *content
collision* (U ≠ P but both define a workflow with the same name — e.g. an npm-installed CLI run
from a repo clone). That unhandled case is precisely the AHQ-205 crash, scheduled after this
ticket; AHQ-200 migrates the guard's source of truth (env var → injected package root) with its
behaviour preserved exactly, including that limitation.

## Web/Perplexity Research

No external research was required: this is a purely internal refactor whose design, naming, and
staging were already settled in the parent brief (Questions 9/10 and the "Final Refactor Stage"
section), and all findings above came from the local code and docs.

## Plain-English Summary — The Directories, The Concepts, And What Happens To "AHQ Workspace"

*(Added at the human's request, 2026-08-14: the simple explanation of the directory/concept model,
kept here as the readable companion to the in-depth "Three Root Concepts" section above.)*

### The directories that can exist on your disk

Up to three directories are in play, and any combination can exist:

1. **The npm-installed copy of agentic-hq** — created by `npm install -g agentic-hq`, hidden in
   the guts of the npm installation. Contains the built, slimmed-down release artifact: compiled
   code plus the shipped workflows. Read-only, frozen at whatever version was published. Nobody
   ever *goes* there — it's only ever "where the invoked binary happens to live".
2. **The agentic-hq repo checkout** — created by `git clone`. A **superset, not a mirror**:
   everything the npm package ships from, *plus* lots the package never ships (tests, dev docs
   and configs, ticket history, unshipped plugins), and it may be **ahead of** the latest
   published package if there's unreleased work. The npm package is a built snapshot of this
   repo's shippable subset at a release point.
3. **Your current directory** — wherever you `cd` before typing `agentic-hq`. Always exists, but
   not necessarily a distinct third place: it's either your own project directory **or the repo
   checkout itself** (the standard contributor case). Never the npm dir. Whatever it is,
   workflows under its `.agentic-hq/plugins/` count as "your local workflows" for that run.

### The one rule that makes it simple

**A running `agentic-hq` process only ever cares about two places:**

- **"Where do I live?"** — the directory containing the copy of the CLI *you actually invoked*:
  the npm dir if you ran the installed binary, the checkout if you ran the checkout's binary. If
  both copies exist on disk, the one you didn't invoke is **invisible to that run**. This is
  `ahq-package-root`, baked in structurally — each bin wrapper passes its own parent directory,
  no detection, no guessing.
- **"Where is the user standing?"** — your cwd. This is the **current user workspace**: where
  your own workflows are discovered, where temp files go, where Claude runs.

So the question is never "which copies exist, and do they differ?" — only "**which binary did you
type, and where were you standing?**"

### The concepts, mapped

1. **The AHQ package** — the whole directory the running CLI lives in (checkout in dev, npm dir
   in prod). Always exists.
2. **The AHQ workspace** (original sense) — the whole repo checkout, a genuine workspace. Exists
   only for contributors, and it *is* the package exactly when the dev binary was invoked. In
   prod the concept doesn't exist at all. **NOTE:** this concept is being **ditched as a code
   concept in this Jira's work** — see "What we're doing with 'AHQ Workspace'" below and the
   Question 4 decision.
3. **The shipped workflows** — the `.agentic-hq/plugins/` payload *inside* the package. Contents,
   not container — a separate concept from the directory that carries them.
4. **The current user workspace** — your cwd: your project, or the checkout when you're standing
   in it.

The only coincidence case: a contributor standing in the checkout running its dev binary — then
package, AHQ workspace, and current user workspace are all one directory (and the dedup guard
stops the shipped workflows registering twice).

### What we're doing with "AHQ Workspace"

**We're ditching it as a code concept** (Question 4 decision). The code's `AhqWorkspaceImpl` never
really modelled "the AHQ workspace" anyway once npm installs existed: it models *"the package
root, exposing its shipped workflows"*, and in prod the workspace label on that is a misnomer
twice over (not a workspace; not the AHQ repo either). So, as a distinct final stage of AHQ-200
after the env-var elimination is green:

- `AhqWorkspaceImpl` → **`AhqPackageImpl`** (plus `isAhqWorkspace()` renamed to match), where
  "package" = the place AHQ is being run from. No checkout-vs-npm distinction is needed in code —
  the only runtime difference, build-or-not, is already carried by `build-mode`.
- `AhqPackageImpl` **keeps implementing `Workspace`** for now (pure rename, nothing else moves),
  carrying a **REFACTOR LATER** comment explaining the deferral.
- The deeper cleanup — splitting `Workspace` so the type system stops claiming the package is a
  workspace (a `PluginSource` interface for the shared half; `Workspace` extends it for the user
  side) — is parked as [AHQ-206](https://agentic-hq.atlassian.net/browse/AHQ-206), description
  recorded in `supporting-docs/`.
- One loose end — whether the user-visible listing label `"Agentic HQ Workspace:"` also changes —
  is Question 5 below.

The "AHQ workspace" survives only as the *human* description of the contributor's checkout —
which, when it matters to a run, is playing one of the two real roles anyway: the package (dev
binary invoked) or your current workspace (you're standing in it).

## The Parameter Pair Passed Through The Whole Chain — `build-mode` And `ahq-package-root`

Only one of the two replaces the env var: **`ahq-package-root`** is the direct successor to
`AGENTIC_HQ_WORKSPACE_ROOT` (the same information — where the running package lives — carried
explicitly instead of hidden). **`build-mode`** is its sibling, introduced alongside it by
AHQ-197, answering a different question the env var never answered. They travel together through
the identical chain, which is why they feel like a pair.

**The two parameters are the two questions about the AHQ package:**

- **`ahq-package-root`** — *where does the running package live?* A place: the repo checkout (dev
  binary) or the npm-installed dir (prebuilt binary).
- **`build-mode`** (`build-first` | `prebuilt`) — *is that place's executable artifact already
  built, or must it be built now?* This is exactly the one behavioural difference between the
  package's two identities: the checkout holds TypeScript source that must be compiled before
  running; the npm dir holds the already-compiled artifact. It is deliberately named for the one
  behaviour it controls (build or don't) rather than "dev/prod", so nothing else can ever be hung
  off it.

**How they get set — never detected, never absent:** both values are **literals hard-coded into
each entry wrapper**, so which binary you invoked *is* the answer: `bin/agentic-hq.cjs` passes
`--build-mode=build-first` + its own parent as the root; `bin/agentic-hq-prebuilt.cjs` (the
published tarball's `bin`) passes `--build-mode=prebuilt` + its own parent. Both are required
with no default — a missing value is a loud fail-fast error, not a silent guess. They correlate
perfectly (`build-first` ⟺ checkout, `prebuilt` ⟺ npm dir) but no code ever infers one from the
other: both are stated explicitly, because detection/inference is exactly the hidden magic this
design bans.

**Where each flows and terminates:** both travel wrapper → CLI argv → `AhqRuntimeParams` →
`CompositionRoot` → the skill-hop relay (the AI sees both values and relays them **verbatim**,
never interpreting them) → the SKILL.md embeds them in the shared-runner invocation. Then they
diverge: `ahq-package-root` is consumed all along the chain (everything that locates something in
the package reads it), while `build-mode` is acted on by **exactly one piece of code in the whole
system** — the shared runner `scripts/run-workflow.cjs`: `build-first` runs `build-release.cjs`
then executes the compiled workflow JS from the staged `release/` tree; `prebuilt` executes the
installed `dist/` JS as-is.

**The parity guarantee keeps it honest:** `build-first` runs the *same* build the publish step
runs and executes **byte-identical** JavaScript to what a `prebuilt` user gets — the mode changes
*when* the artifact is built, never *what* runs.

## Questions And Answers

### Question 1

**Question:** Do you confirm AHQ-200's scope boundary: migrate only the **working system** (core
`src/` classes, both bin wrappers, `add-feature-cli.ts` + its four command .md files, the 7 unit
test files, the 2 dev docs), leaving all still-broken workflows' legacy references (5 SKILL.mds,
2 unmigrated CLIs, create-workflow scaffolding templates) untouched for AHQ-201 — accepting that a
repo-wide grep for `AGENTIC_HQ_WORKSPACE_ROOT` only becomes fully clean after AHQ-201?

**AI Recommendation:** Yes. This is exactly the parent brief's carve-out ("the still-broken
workflows' legacy references are migrated in Sub-Task 7"), and touching the broken workflows now
would repeat work AHQ-201 does anyway on the locked-down pattern — the exact repeated-work waste
the one-workflow-at-a-time principle exists to prevent.

**Human Answer ('Yes' means follow AI Recommendation):** Yes, but please add a clarifying AC to AHQ-201 details in docs/tickets/AHQ-195/workflow-files/01-feature-brief.md to make sure that AGENTIC_HQ_WORKSPACE_ROOT and its other equivalent names are eliminated when that Jira completes (tested by a grep of the whole workspace, apart from legacy and old conversation/spec files)

### Question 2

**Question:** Should the relayed variable name in the Command 01 input string — currently
`agentic-hq-workspace-root-dir` — be renamed to `ahq-package-root` in this ticket for the
**add-feature workflow only** (its CLI broadcast string plus the four
`commands/add-feature/0?-*.md` files that parse it), with the unmigrated workflows' and
scaffolder's copies renamed later in AHQ-201? (math-workflow — the other already-migrated
workflow — has nothing to do here: verified zero references to the env var or the relayed
variable anywhere in its skill or commands, because its three arithmetic commands need no paths
into the package.)

**AI Recommendation:** Yes. The parent's final-stage step 2 calls for exactly this rename, and
add-feature is the only migrated workflow that relays the value (math-workflow doesn't use it).
Renaming CLI and command .md files together keeps the producer and parsers in lockstep within one
ticket; a live add-feature run (plus the existing e2es) verifies the relay end-to-end.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 3

**Question:** When `AhqWorkspaceImpl` (and the classes it feeds) switch to constructor injection,
should the current `?? process.cwd()` fallback be **eliminated** — making the package root a
required constructor parameter with no default, so every construction site (including
`WorkflowSearchResultsImpl` and the unit tests) must supply it explicitly?

**AI Recommendation:** Yes. "Explicit, required, no default, no env var" is the binding principle
from parent Questions 7/9, and the fallback's only consumers are test/script contexts that the
refactor updates anyway. Observable CLI behaviour is unchanged (the bin wrappers always supplied
the value), and a silent cwd default is precisely the hidden-state pattern this ticket exists to
remove.

**Why this cannot silently break (reassurance, verified against the code):** The fallback isn't
"removed" — the whole resolution step disappears: after injection the class *receives* its root
rather than looking one up, so no "value missing" branch remains for a fallback to guard. Every
construction site that fails to supply a root is a **TypeScript compile error** (caught by
`pnpm typecheck`, the first gate of `pnpm validate`) — the loudest possible failure, not a silent
one — and the sites are a finite, grep-verified list (`CompositionRoot`,
`WorkflowSearchResultsImpl` — constructed in `app.ts` where the params are already in hand — and
four unit-test files); the classes are not exported through the public
`agentic-hq/tools/claude-code` barrel, so nothing outside the repo can construct them. The
injected value is *literally the same value* the env var carried — both channels are written from
the single `packageRoot` line in each bin wrapper — and since AHQ-197 the CLI already fails fast
in `app.ts` before any workspace exists if `--ahq-package-root` is absent. The existing
fallback unit test is deliberately *replaced* (its intent — "root comes from the sanctioned
source" — is re-expressed against injection), not dropped. Finally, the risk actually runs the
other way: today, an unset env var doesn't error — it silently roots the AHQ workspace at
whatever directory you're standing in and discovers the wrong plugins with no complaint. Removing
the fallback **deletes** that only silent-failure path; it does not create one.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 4

**Question:** The three-concepts analysis shows the model becomes structurally honest through this
ticket's injection work alone, but three names still say "workspace" for what is really the AHQ
package: `AhqWorkspaceImpl` (+ its file/tests), `isAhqWorkspace()` on the `Workspace` interface,
and the user-visible listing label `"Agentic HQ Workspace:"`. Should AHQ-200 ditch the "AHQ
workspace" concept and perform these renames?

**AI Recommendation:** Yes — as a **distinct final rename stage**, run only after the env-var
elimination is fully green. Rationale: the injection work already touches essentially every file
the rename touches, so a separate ticket would re-open all the same files; the renames are
provably behaviour-preserving (the listing label — the one observable piece — is Question 5).

**Human Answer ('Yes' means follow AI Recommendation):** Yes (decided 2026-08-14; consolidated
record of the agreed shape):

1. Rename `AhqWorkspaceImpl` → **`AhqPackageImpl`** (file, tests, and construction sites
   included); "package" means the place AHQ is being run from — the repo checkout when running the
   checkout's binary, the npm package dir when running the npm-installed CLI. Rename
   `isAhqWorkspace()` → **`isAhqPackage()`** (decided 2026-08-14) — across the `Workspace`
   interface, all three implementations, and every call site (e.g.
   `currentUserWorkspace.isAhqPackage()`).
2. No new checkout-vs-npm distinction is needed in code (verified in "The Three Root Concepts"):
   the only runtime difference is build-first vs prebuilt, already modelled by `build-mode` and
   acted on solely by the shared runner.
3. `AhqPackageImpl` **keeps implementing `Workspace`** (pure rename — keeps
   `ClaudeCommandBuilder`, `ListingFormatter`, and registration unchanged). The Implementer must
   add a **"REFACTOR LATER:"** extended comment to `AhqPackageImpl` explaining exactly this: the
   deeper interface split (e.g. a `PluginSource` interface for the shared half, with `Workspace`
   extending it for the user side) is a clean later refactor if we ever want the type system to
   stop claiming the package is a workspace.
4. That later interface-split refactor has its own Jira:
   **[AHQ-206](https://agentic-hq.atlassian.net/browse/AHQ-206)** — "Later: Refactor: Split The
   Workspace Interface (PluginSource Extraction)". Repo record of its description:
   `docs/tickets/AHQ-200/workflow-files/supporting-docs/AHQ-206_later_refactor_jira_description.md`.
5. The user-visible listing label is Question 5.

### Question 5

**Question:** The rename's one potentially user-visible piece: should the listing label
`"Agentic HQ Workspace:"` (and the related `"Same as AHQ"` message text) also change in AHQ-200 —
e.g. to `"Agentic HQ Package:"` — as the single, explicitly-sanctioned observable output change,
or stay unchanged so the ticket keeps a strictly zero-observable-change contract (label change
deferred to a later ticket)?

**AI Recommendation:** Change it in AHQ-200. Keeping a label that names a ditched concept would
leave the CLI's most visible surface contradicting the code, the docs, and the parameter names —
and AHQ-199 (docs, last sub-task) would then document a label we already know is wrong. It is a
cosmetic text change, called out explicitly here as the ticket's one observable change; the tests
asserting listing output are updated in the same stage.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

**AI Note (recorded from chat, 2026-08-14 — the exact chosen wording):** the simple relabel, with
no checkout-vs-npm wording added: the header label `Agentic HQ Workspace:` becomes
**`Agentic HQ Package:`**, and the same-directory message becomes
**`Same as Agentic HQ Package (running from within the AHQ package directory)`**. The printed
root path already distinguishes a checkout from an npm install, and identity-aware wording was
rejected because it would make the listing a second consumer of `build-mode` (the shared runner
must remain the only code that acts on it). Listing tests are updated in the same stage.

## Relevant Files Reviewed

Ordered by decreasing relevance (pointers for the Planner):

- `src/workflow-discovery/workspace/ahq-workspace-impl.ts` — the main legacy reader
  (`getRoot()` = env var `?? cwd`) and the class being renamed to `AhqPackageImpl`.
- `src/workflow-discovery/workspace/workspace-impl.ts` — `isAhqWorkspace()` env-var equality (the
  dedup guard), becoming `isAhqPackage()` against the injected root.
- `src/kernel/composition-root.ts` — holds `AhqRuntimeParams`; constructs both workspace classes
  no-arg; the injection point for the explicit root.
- `bin/agentic-hq.cjs` / `bin/agentic-hq-prebuilt.cjs` — the two env-var dual-writes to delete
  last; the structural source of both explicit parameters.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ts-workflow/src/add-feature-cli.ts`
  — the only migrated workflow CLI still reading the env var; producer of the relayed variable
  being renamed.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/01–04*.md` — parse
  `agentic-hq-workspace-root-dir` from the input string; renamed in lockstep with the CLI.
- `src/workflow-runtime/default-workflow-runtime.ts` + `src/interfaces/workflow-runtime.ts` — the
  seam that must expose the package root to workflow programs.
- `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts` — constructs both
  workspace classes no-arg; needs the root threaded in.
- `src/cli/app.ts` — parses the runtime params and constructs `WorkflowSearchResultsImpl` with
  the params already in hand.
- `src/cli/listing/listing-formatter.ts` — the "Agentic HQ Workspace:" label and "Same as…"
  message changing under Question 5.
- `src/runtime-params/` + `src/interfaces/ahq-package-root.ts` / `ahq-runtime-params.ts` — the
  existing explicit parameter chain the readers migrate onto.
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` — `isAhqWorkspace()`
  consumer and the skill-hop relay of both parameters.
- `src/workflow-discovery/workspace/current-user-workspace-impl.ts` — dedup-guard consumer that
  needs the injected root to reach it.
- The 7 unit-test files (5 env-var-stubbing, 2 no-arg-constructing) listed in Research Findings
  item 5.
- `docs/dev/how-agentic-hq-works.md` / `docs/dev/project-design-requirements.md` — the two dev
  docs mentioning the env var.
- `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md` — the parent spec (Final Refactor
  Stage design, Questions 9/10, sub-task list and addenda).
- `docs/tickets/AHQ-204/01-work-details.md` — records that add-feature's env-var read was
  deliberately left for this ticket.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/` — verified clean (no
  env-var or relay-variable references; nothing to do).

## Acceptance Criteria

- A whole-repo grep for `AGENTIC_HQ_WORKSPACE_ROOT` finds it only in the AHQ-201-scoped
  unmigrated workflow files and historical docs — nowhere in the working system (bin wrappers no
  longer set it; core code, migrated workflows, their tests, and dev docs no longer read or
  mention it).
- Zero functionality change: full validation and the existing integration/e2e proofs pass before
  and after, with `agentic-hq list` output identical except the sanctioned label change.
- The "AHQ workspace" name is gone from the code — the package class/method renames are complete,
  with the deferred interface split recorded as a REFACTOR LATER comment pointing at AHQ-206.
- The listing shows "Agentic HQ Package:" (and the matching "Same as…" message) — the ticket's
  single visible change.
- A live add-feature run works end-to-end with the relay variable renamed to `ahq-package-root`.

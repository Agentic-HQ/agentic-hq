# AHQ-201 — Feature Brief

## One Sentence Outcome

Every AHQ workflow — bundled or user-authored, in the agentic-hq clone or in any user workspace — is
built and run by one identical process (dev = build + run, prod = run, byte-identical), all seven
shipped workflows and the `create-workflow` scaffolder work again from an npm install with no clone
anywhere, and `agentic-hq@0.2.0` is published — delivered as two clean sub-tasks split from AHQ-201.

## User Story

**As a**: developer who has npm-installed agentic-hq (or cloned it)  
**I want:** my own custom workflow in my workspace to be built and run exactly the way agentic-hq's bundled workflows are  
**So that:** I can author, share and eventually publish workflows without a clone, and every run executes the same bytes a release would ship

## Human Prompt

This is a subtask of AHQ-195, and is detailed in the parent ticket at:
docs/tickets/AHQ-195/workflow-files/01-feature-brief.md
Please be sure to read the details of how this was split in that ticket and be especially 
careful to fully read and understand any relevant Addenda

**UPDATE (2026-08-17 → 2026-08-18, consolidated from the chat during this Researcher stage).** After
the first draft of this brief (which recommended keeping tsx for user-workspace workflows), the human
redirected the design over a series of exchanges. The key statements, verbatim:

- *"Ideally I want a developer who has created their own custom-workflow in their own workspace to have
  it do the **exact** same process to build and run it as is run in the cloned AGentic HQ workspace to
  build and run the reverse-string workflow. Is that possible? This is partly because I want everything
  to be simple: it's either: (dev) build + run, or (prod) run. and the run is always on the exact same
  byte-identical code. Also it's because I can imagine soon that these developers who create these
  custom workflows will want to do the same as I am and publish their workflows as releases (like I do)
  into npmjs.com or their own npm repo."*
- *"I don't like that the user's custom workflow SKILL.md has --build-mode=build-first hard coded. This
  doesn't mirror our Agentic HQ workspace skills which pass it through. Also means when they want to
  publish the release (which will need to have prebuilt) things will get messy. Can you think hard about
  a much simpler way of doing all this where workflows in my-workspace look identical to ones in the
  Agentic HQ workspace. I think you can do all this without adding two whole new variables. I'm thinking
  the key here may be to split the build of the Agentic HQ core out from the build of the workflow
  typescript **everywhere** (including in the Agentic HQ workspace)."*
- *"I agree that the recommendation should be split, not do all in one ticket."*
- On the runner's variables, after each was examined: *"OK, I think we've justified the existence of all
  4 of these variables exactly as they are."* — keeping `--ahq-package-root` on the runner (*"we are
  actually keeping it for almost all of the chain, just ditching it in one link … That's not really
  gaining much is it? If not - let's forget ditching it"*) and keeping `--workflow-js` with descriptive
  CLI filenames (*"we should keep it because then when I search for add-feature files in my VSCode I
  get"* `add-feature-cli.ts` first).
- On cwd = the AHQ clone: *"If someone wanted their workflow they put in the AHQ clone workspace to run
  against the AHQ code in that workspace, they should know they have to run the agentic-hq that runs
  from that workspace, and not the agentic-hq that has been npm installed."*
- On the dev binary: *"rename the agentic-hq that gets installed that runs from the local repo workspace
  (and rebuilds every time it runs) to agentic-hq-dev - then there is no ambiguity or confusion. if you
  install it via npm you get agentic-hq - if you installed the dev version by npm linking you run
  agentic-hq-dev and you know it rebuilds from scratch/source every time you run"* … *"let's just make
  this part of the plan for the current 201 Jira"*.
- On the split: *"I like this whole plan, but I'm worried I will get very confused by everything if we
  "re-use" AHQ-201 after we've done all these docs and talking for AHQ-201. Let's have 2 clean new
  sub-task Jiras for AHQ-201 (a proper split of AHQ-201, where the first Jira is the re-working of the
  system based on all these conversations we've had in AHQ-201)"*.

The resulting design and its worked examples are recorded in this ticket's supporting docs:
`supporting-docs/01-new-two-separate-builds-architecture-design.md` (current setup, the new plan,
costs, alternatives, relation to AHQ-203, the `agentic-hq-dev` rename),
`supporting-docs/02-four-questions-and-answers-about-new-build-architecture.md`, and
`supporting-docs/03-the-four-combinations-of-example-runs-types-all-explained-and-worked-through.md`
(the 2×2 combination matrix, all four runner variables per combination, cwd variants, and why all four
variables were kept).

## My Understanding of This Task

AHQ-201 is **Sub-Task 7 of the AHQ-195 npm-publish split** ("Migrate All Remaining Workflows And The
Scaffolder Onto The Proven Prebuilt Pattern And Restore Them To Working"). Sub-Tasks 1–6 are done: the
prebuilt/read-only-artifact pattern is proven and published (`agentic-hq@0.1.1`, math-workflow +
add-feature working from the registry), the `AGENTIC_HQ_WORKSPACE_ROOT` env var is gone from the
working system (AHQ-200), and the short-id collision crash is fixed (AHQ-205). What remains is to bring
the **five unmigrated AHQ workflows** (`string-reversal`, `quick-jira-workflow`,
`full-jira-tdd-story-workflow`, `add-feature-detailed-example`, `create-workflow`) and the
**create-workflow scaffolder** back to working, hit the **grep-clean AC**, delete the temporary half of
the AHQ-200 bin-wrapper test, re-verify `agentic-hq create-workflow -- --using=add-feature`, and
**re-publish** — and, per the parent brief's binding instruction, to answer deliberately **how
user-created workflows work against a pure npm install with no clone anywhere** (the acceptance
scenario: an npm-installed author scaffolds → pushes → a collaborator with their own npm install runs
it).

Research showed the "proven pattern" cannot serve user-workspace workflows: the current single build
compiles the framework and its bundled workflows into one tree, and the runner can only execute JS
inside that tree — while the installed package is read-only. During this stage the human redirected the
design to **two separate builds, everywhere** — Build 1 (the framework, owned by the bin wrapper /
publish) and Build 2 (a workflow, one shared script, run by the runner in `build-first` and by the
release build), so that a workflow's files, `SKILL.md` and launch process are **identical** whether it
lives in the agentic-hq repo or in a user's workspace, dev = build + run and prod = run on
byte-identical code, `build-mode` becomes the mode of *the workflow being launched* (set by the CLI from
the root it discovered it under — no new chain variables), and the dev binary becomes `agentic-hq-dev`.
Because this changes the pattern, migrating the five onto the *old* pattern first would be wasted work,
so AHQ-201 becomes an **umbrella split into two new clean sub-task Jiras**: (A) the re-work of the
build/runner system proven on math-workflow, string-reversal and add-feature; (B) migrating the
remaining workflows and the scaffolder onto it, restoring everything to working, and the `0.2.0`
re-publish. This run therefore ends with a `Split Suggestion (Accepted)` and `TERMINATE_WORKFLOW`; the
two sub-tasks each run `add-feature` with this brief (and its supporting docs) as their parent.

## Research Findings

### 1. What "the proven prebuilt pattern" is today (math-workflow / add-feature, AHQ-197 + AHQ-204)

A shipped workflow was migrated by exactly four changes (verified by diffing add-feature vs the five
unmigrated skills; the AHQ-204 work-details record confirms this was the whole add-feature migration):

1. **`SKILL.md`** — Variables gain `build-mode = $1` and `ahq-package-root = $2`; the
   `command-output-string` becomes
   `node "{ahq-package-root}/scripts/run-workflow.cjs" --ahq-package-root="{ahq-package-root}" --build-mode={build-mode} --workflow-js=dist/.agentic-hq/plugins/<plugin>/skills/<skill>/ts-workflow/src/<cli>.js`.
   The `agentic-hq` CLI **already passes `$1`/`$2` to every skill it invokes**
   (`claude-command-builder.ts:93` appends `<marshallingId> <buildMode> <ahqPackageRoot>` to every AI tool
   command) — the unmigrated SKILL.md files simply ignore them.
2. **The ts-workflow CLI** — `new DefaultClaudeCodeTool()` (no-arg; has not compiled since AHQ-197 made
   `CompositionRoot` a required constructor parameter) becomes
   `const runtime = new DefaultWorkflowRuntime(process.argv); const tool = runtime.getClaudeCodeTool();`
   and `program.parse(runtime.getWorkflowArgs())`. `DefaultAhqCommandLine` strips
   `--build-mode=`/`--ahq-package-root=` and fails fast if either is missing.
3. **`tsconfig.build.json`** — the workflow's `ts-workflow/src/**/*` is added to `include` so the single
   `pnpm build` compiles it to `release/dist/...` (a `paths` mapping resolves the
   `agentic-hq/tools/claude-code` self-reference for typecheck).
4. **`scripts/build-release.cjs`** — remove the skill from `EXCLUDED_UNMIGRATED_SKILLS`.

Nothing else changes: the ts-workflow `package.json` (`link:../../../../../..`, tsx, commander), lockfile,
`.npmrc`, `pnpm-workspace.yaml` and (noEmit) `tsconfig.json` are kept and ship in the artifact. Plugin
ts-workflow sources are outside root `pnpm typecheck`/lint scope (`tsconfig.json` includes only
`src/**` + `tests/**`; eslint ignores `.agentic-hq/plugins/**/ts-workflow/src/**`), so the release build
is what typechecks them. No `.d.ts` files are emitted or shipped.

**Runner contract today** (`scripts/run-workflow.cjs`, the only file shipped from `scripts/`):
`--build-mode`, `--ahq-package-root`, `--workflow-js` (relative to the *execution root*) all required;
`build-first` runs `build-release.cjs` and executes from `<root>/release`, `prebuilt` executes from
`<root>`. **Consequence:** the runner can only run JS inside the AHQ package tree — it cannot serve a
workflow living in a user's workspace, and the installed package is read-only.

### 2. State of the five unmigrated workflows

| Workflow | Plugin | CLI legacy usage | Command `.md` files using `agentic-hq-workspace-root-dir` | Other |
| --- | --- | --- | --- | --- |
| `string-reversal` | demos | `new DefaultClaudeCodeTool()` only | none | root `demo:*` scripts + 3 e2e tests target it |
| `quick-jira-workflow` | demos | `new DefaultClaudeCodeTool()` only | none | root `demo:plugin-direct:*` script; 1 e2e test |
| `full-jira-tdd-story-workflow` | demos | `new DefaultClaudeCodeTool()` only | none | root `demo:plugin-direct:*` script |
| `add-feature-detailed-example` | demos | reads `AGENTIC_HQ_WORKSPACE_ROOT` (fail-fast), relays as `agentic-hq-workspace-root-dir` into Command 01 | all 7 (`01`–`07`) parse it | `docs/developer-help-docs/developer-help-doc.md` (3 mentions) |
| `create-workflow` | core | reads `AGENTIC_HQ_WORKSPACE_ROOT` (fail-fast), relays as `agentic-hq-workspace-root-dir` into Command 01 | all 5 (`01`–`05`) parse it — 62 mentions total | the scaffolder — see §3 |

All five SKILL.md files still return the legacy chain
`(cd {skill-base-dir}/ts-workflow && pnpm install && ln -sfn "$AGENTIC_HQ_WORKSPACE_ROOT" node_modules/agentic-hq) && …/tsx … <cli>.ts`
— which now symlinks to an empty path (AHQ-200 deleted the wrappers' env-var dual-write) *and* would run
a CLI that no longer compiles; the parent brief says treat both as one migration. The two "relay" CLIs
(`add-feature-detailed-example`, `create-workflow`) follow the add-feature broadcast pattern, so their
migration mirrors AHQ-200's add-feature rename: CLI broadcasts `ahq-package-root=…` from
`runtime.getAhqPackageRoot().getPath()`; every command `.md` parser and derived-path block renames
`agentic-hq-workspace-root-dir` → `ahq-package-root` in lockstep.

**Skill-less command dirs:** `commands/DRAFT-oo-refactoring-workflow/` (half-finished draft per its
README; its `02-DRAFT-notes-about-refactorings-done.md` quotes old code containing
`process.env.AGENTIC_HQ_WORKSPACE_ROOT` 3×) and `commands/research-plan-implement/` have no skill, are
not AHQ workflows (exactly 7 `ahq-workflow.json` files exist: 2 migrated + these 5), yet ship in the
artifact because `commands/` dirs are copied whole (AHQ-198 review "Improvement 2", left for
AHQ-201/hygiene). See Question 4.

### 3. The create-workflow scaffolder — what it embeds today

`create-workflow` scaffolds **into the user's current workspace** (Commands 01/02:
`plugin-dir = {project-root}/.agentic-hq/plugins/{plugin-id}`; project-root = Claude's cwd, which equals
the AHQ clone only when a contributor runs it from the repo). So "scaffold into the read-only npm
package" is already impossible by construction. But every template it emits or copies is legacy:

- **Command 01** (592 lines): Step 1 sends the agent to read `create-workflow-cli.ts` as *the*
  `AGENTIC_HQ_WORKSPACE_ROOT` env-var pattern; Step 1.5 "four sources of variables" names env vars as
  source (a) and `agentic-hq-workspace-root-dir` as the second root; Step 0c resolves `--using` sources
  across both roots via `{agentic-hq-workspace-root-dir}`; the spec template (Step 5) has "Env vars
  consumed by the TS CLI" fields; Step 7's output string relays `agentic-hq-workspace-root-dir=`.
- **Command 02** (429 lines): Step 4-COPY copies `SKILL.md` and only *renames the CLI filename* in it,
  relying on the "standardized `SKILL.md` carries the `ln -sfn "$AGENTIC_HQ_WORKSPACE_ROOT"` step"
  (AHQ-162 callout, now false); 4c "follow the math-workflow CLI pattern — import
  `DefaultClaudeCodeTool`"; 4d "SKILL.md returns shell command to install deps and run CLI via tsx + the
  `ln -sfn` step"; 4e `package.json`/`pnpm-workspace.yaml`/`.npmrc`/`tsconfig.json` "following the
  existing patterns".
- **Command 03** (276 lines): the checks run `cd {ts-workflow-dir} && pnpm install` and read
  `{agentic-hq-workspace-root-dir}/package.json`.
- **Commands 04/05**: parse `agentic-hq-workspace-root-dir`; 04 points at add-feature help docs under it.

Also embedded: `docs/dev/how-agentic-hq-works.md:242` still shows the legacy launch string;
`docs/dev/npm-commands.md` documents root `demo:plugin-direct:*` scripts that run the legacy chain (now
failing with `DefaultAhqCommandLine: required option --build-mode=… is missing`); README describes
`create-workflow --using=add-feature`, `add-feature-detailed-example`, `quick-jira`/`full-jira` as
runnable. The add-feature Reviewer (Command 04) tells every user to run
`agentic-hq create-workflow -- --using=add-feature` next — currently a dead end for registry users
(AHQ-198 review deferred it here). Under the new design the scaffolder emits **one** SKILL.md template
and one standard ts-workflow file set (only the CLI filename varies), so its rewrite is simpler than any
two-shape alternative.

### 4. How a user-workspace workflow is launched today (the design question's baseline)

The only existing model is `tests/e2e/fixtures/string-reversal-copy-for-test/` (used by
`string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts`): SKILL.md returns
`(cd {skill-base-dir}/ts-workflow && pnpm install) && …/tsx … src/<cli>.ts`; `package.json` depends on
`"agentic-hq": "link:REPO_ROOT_PLACEHOLDER"` patched at test time to the repo root (its comment explains
why a committed lockfile can't hold a `link:`); the CLI is the no-arg `DefaultClaudeCodeTool`. Under
`--using`, the scaffolder copies a shipped `package.json` whose `link:../../../../../..` resolves to the
**user's project root** in a user workspace — harmless only because the SKILL.md's `ln -sfn` overwrote
it. Facts that shaped the answer (all verified): every skill already receives `$1`/`$2`; the release
manifest's `exports` maps `agentic-hq/tools/claude-code` → `dist/src/…/index.js` and the repo root's
→ `.ts` source; Node resolves symlinked modules by real path, so `agentic-hq`'s own deps (`node-pty`,
`fast-glob`, `commander`) load from the install's own `node_modules`; `DefaultWorkflowRuntime` needs
`--build-mode`/`--ahq-package-root` on argv; the two roots are semantically distinct
(`AhqPackageImpl` vs `CurrentUserWorkspaceImpl`; local plugins listed first, AHQ-205 first-wins).

### 5. Existing tests and safety nets the work touches

- **Build/staging:** `tests/integration/build/build-determinism.integration.test.ts` (asserts the staged
  `*-cli.js` files); `publish-guards.integration.test.ts` (known contention with build-determinism on
  `release/` when the suite runs — flagged as needing a Jira in the parent brief; the new design makes
  `release/` publish-only, which defuses it); `tests/integration/runner/run-workflow-validates-and-executes.integration.test.ts`
  (points the real runner at a fake package root via `--ahq-package-root=`).
- **Tarball e2e:** `tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts` holds
  `EXPECTED_SHIPPED_SKILLS_BY_PLUGIN` (exactly `add-feature`,`math-workflow`) and asserts the five
  excluded names do **not** list — both flip as skills ship.
- **String-reversal e2es:** `agentic-hq-cli-string-reversal` (the "honest red marker" of the AHQ-197
  break), `cross-workspace-string-reversal`, the user-workspace fixture test above;
  `cross-workspace-quick-jira-workflow-produces-expected-files`; `cross-workspace-list-workflows`.
  Templates for proofs: `cross-workspace-demo-math-workflow-…` (dev build-first from another directory)
  and the tarball e2e (installed prebuilt). The user-workspace test asserts `agentic-hq` on PATH via
  `npm link` (README step 5) — becomes `agentic-hq-dev`.
- **AHQ-200 bin-wrapper test:** `tests/integration/bin/bin-wrapper-supplies-the-package-root-explicitly.integration.test.ts`
  — delete the second `it(...)` block, `LEGACY_ENV_VAR_NAME`, `BOGUS_LEGACY_ROOT`, the optional parameter
  of `runListThroughDevBinWrapper()`, and the `TEMPORARY` header paragraph once the grep-clean AC holds.

### 6. Grep-clean AC baseline (verified 2026-08-17)

Excluding `docs/jira-docs`, `docs/tickets`, `LEGACY`, `release`, `node_modules`, `temp`, the legacy names
(`AGENTIC_HQ_WORKSPACE_ROOT` | `agentic-hq-workspace-root-dir` | `agenticHqWorkspaceRoot`) occur in
**22 files**: the 5 create-workflow commands (62), `create-workflow` SKILL.md + CLI (9), the 7
add-feature-detailed-example commands (37) + its SKILL.md/CLI/developer-help-doc (11), the other 3
unmigrated SKILL.md files (6), the DRAFT notes file (3), and the bin-wrapper test (1). `src/`, `bin/`,
`docs/dev`, README, the two migrated workflows and all shipped scripts are already clean.

### 7. Publish state and carried checks

- Registry: `0.0.1`, `0.1.0` (deprecated), `0.1.1` = `latest` (2026-08-12; math-workflow + add-feature).
  Local `package.json` is `0.1.1`. AHQ-202 made zero publishes; AHQ-200 and AHQ-205 are unpublished and
  ride on this ticket's re-publish (parent brief and AHQ-205 docs). Procedure:
  `docs/dev/publish-checklist.md` (its §3 tarball inspection currently expects only the migrated skills —
  update alongside).
- **AHQ-200 AC 5 relay check (carried from Sub-Task 6):** verified from an on-disk artifact during
  AHQ-205 (its plan §8) and **confirmed live on this run**: this Researcher's `command-input.json` reads
  `The variables used in this workflow are: ahq-package-root=/Users/stevepersonal/dev/agentic-hq/agentic-hq and ticket-id=AHQ-201`.
- Path normalisation for `isAhqPackage()` was decided record-only in AHQ-205 — not reopened.

### 8. The design decision reached during this stage (summary — details in supporting docs 01–03)

- **Two builds, two owners.** Build 1 (framework): `<repo>/src` → `<repo>/dist` (JS + `.d.ts`), run by
  the dev wrapper on every invocation and by publish; never on a user's machine. Build 2 (workflow): one
  shared `build-workflow.cjs` — `pnpm install` → symlink `node_modules/agentic-hq → {ahq-package-root}` →
  `tsc` → `<that workflow>/ts-workflow/dist/` — identical everywhere; run by the runner in `build-first`
  and by the release build for bundled workflows. The runner never builds the framework; `release/`
  becomes publish-only. Root `exports` → `dist/…js` (+ `types` condition → `.ts` source).
- **One workflow layout, one SKILL.md** (differs only by the CLI filename), with the **four runner
  variables kept exactly as examined**: `--ahq-package-root`, `--build-mode` (the two chain variables,
  relayed verbatim as `$2`/`$1`, forwarded to the program), `--workflow-dir` (from `skill-base-dir`),
  `--workflow-js` (relative to it). No new chain variables.
- **`build-mode` = the mode of the workflow being launched**, set by the CLI from the root it discovered
  the workflow under: user workspace → `build-first`; AHQ package root → the wrapper's mode. The 2×2
  matrix (binary × workflow location) is complete; cwd only affects discovery (dedup / AHQ-205
  precedence), not build/run (doc 03 §7). A clone's workflow runs against the framework whose binary you
  ran — by design.
- **Framework resolution:** `build-first` → the symlink; `prebuilt` (bundled) → Node package
  self-reference, which requires the release to **strip per-workflow install files** (`package.json`,
  lockfile, `.npmrc`, `pnpm-workspace.yaml`); a runner-registered resolve hook is the uniform alternative,
  deferred to AHQ-203 (third-party plugin releases).
- **`agentic-hq-dev`** for the linked dev binary (in scope; recorded in the parent brief).
- **Rejected:** keep tsx for user workflows; hardcode `build-first` in user SKILL.md; runner infers mode
  from paths; declared registry dependency per workflow (AHQ-203 territory); ditching any of the four
  runner variables (doc 03 §8).
- **Split:** A (the re-work, proven on math-workflow + string-reversal + add-feature) → B (migrate the
  remaining four + scaffolder + restore + grep-clean + bin-test cleanup + `0.2.0` re-publish) — two new
  clean sub-task Jiras under the AHQ-201 umbrella; then AHQ-207 and AHQ-199.

## Web/Perplexity Research

No external research was required: everything needed is in the parent brief, the sibling ticket records
(AHQ-197/198/200/202/204/205) and the code; the one registry check was a local `npm view agentic-hq`.
The Node behaviours the design relies on (package self-reference via `exports`, real-path resolution of
symlinked modules, `__dirname`/bin-symlink resolution) are already established and documented in-repo
(AHQ-196 findings, the fixture `package.json` comment, the wrappers).

## Questions And Answers

> The five questions first drafted on 2026-08-17 (built around keeping tsx for user workflows) were
> superseded by the design conversation before being answered and are replaced by the set below.

### Question 1

**Question:** Do we adopt the **two-separate-builds design** in supporting docs 01–03 as the target
pattern for AHQ-201's split — Build 1 (framework) / Build 2 (workflow), one SKILL.md template with the
four runner variables as settled, `build-mode` = the mode of the workflow being launched (set from the
discovery root), the release stripping per-workflow install files, `.d.ts` shipped, `release/`
publish-only, and `agentic-hq-dev` for the linked dev binary — **instead of** migrating the five
workflows onto today's single-build pattern?

**AI Recommendation:** Yes. It is the design that satisfies your stated principles (dev = build + run,
prod = run, byte-identical; workflows identical wherever they live; no new chain variables; no
env vars; the AI relays and never interprets), it makes the scaffolder single-shape, and it is the
largest step toward "users publish workflows to npm" (AHQ-203) that needs no repo re-architecture; the
only deliberately temporary piece is self-reference for prebuilt bundled workflows, which a third-party
release later replaces with a declared dependency or the resolve hook.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 2

**Question:** Do we structure the split as **two new clean sub-task Jiras with AHQ-201 as the umbrella**
(this brief + supporting docs as their parent), this run ending in `TERMINATE_WORKFLOW`, with these
scopes and titles — **(A)** *"Split Framework Build From Workflow Build: Uniform Build+Run For All
Workflows (Proven On math, string-reversal, add-feature)"* (Build 1/Build 2 scripts, runner, CLI
per-workflow mode, `.d.ts`/`exports`, dev wrapper + rename, release build, the three workflows on the
new template, tests incl. the user-workspace fixture e2e against a tarball install, minimal doc
corrections; no publish) and **(B)** *"Migrate Remaining Workflows And create-workflow Scaffolder Onto
Two-Builds Pattern, Restore All To Working, Publish 0.2.0"* (quick-jira, full-jira, add-feature-detailed-example,
create-workflow + relay renames, scaffolder rewrite, `EXCLUDED_UNMIGRATED_SKILLS` gone, grep-clean AC,
bin-wrapper test cleanup, restore-to-working proof incl. the manual `create-workflow -- --using=add-feature`
walk-through, `0.2.0` publish + registry verification)? Sequence A → B → AHQ-207 → AHQ-199.

**AI Recommendation:** Yes. You create both in the Jira UI (the MCP account cannot create AHQ issues) —
Jira Cloud can't nest a Sub-task under a Sub-task, so as sibling Sub-tasks of AHQ-195 with "split from
AHQ-201" in the summary; the brief hierarchy carries the parentage, as AHQ-195's does. Give me the two
IDs (or tell me to leave placeholders) and I'll write them into the `Split Suggestion` before
terminating; the parent brief's Sub-Task 7 entry then gets a one-line pointer to the split.
*(Created 2026-08-18: [AHQ-208](https://agentic-hq.atlassian.net/browse/AHQ-208) = A,
[AHQ-209](https://agentic-hq.atlassian.net/browse/AHQ-209) = B.)*

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 3

**Question:** How much of "restore everything to working" is proven **automatically** vs **manually**?
Proposed — **A automates the mechanics:** build determinism (per-workflow `dist/`, `.d.ts` present),
runner contract, `list` shows the expected set (dev + tarball), math **and string-reversal** end-to-end
in dev `build-first` and from a tarball install, and the **user-workspace fixture e2e repointed to the
new pattern and run against a tarball-installed agentic-hq** (the collaborator half of the acceptance
scenario — no clone). **B automates the rest of the mechanics** (all seven list; runner `--help` smoke
for the interactive workflows) and does the **manual** scaffolding half of the acceptance scenario:
fresh dir + npm/tarball install → `agentic-hq create-workflow -- --using=add-feature` → scaffold →
commit → collaborator run. `quick-jira`, `full-jira`, `add-feature-detailed-example` (Jira MCP / long
interactive runs) get list + smoke only.

**AI Recommendation:** Yes — that split. Every mechanical claim is automated; only the genuinely
interactive scaffolding walk-through is manual, and it is the single most valuable manual check the
parent asks for.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 4

**Question:** The grep-clean AC vs. the two skill-less draft command dirs that ship in the artifact:
`commands/DRAFT-oo-refactoring-workflow/` (half-finished per its README; 3 legacy-name hits inside
quoted old code) and `commands/research-plan-implement/`. Options: **(a)** treat the DRAFT notes as
historical/draft content the AC already exempts (leave its quoted code alone) and change nothing else;
**(b)** additionally stop shipping the two skill-less draft dirs (a small exclusion filter in the release
build where `EXCLUDED_UNMIGRATED_SKILLS` used to be — dead weight only, nothing can invoke them; AHQ-198
review "Improvement 2"); **(c)** move `DRAFT-oo-refactoring-workflow` out of the plugin tree.

**AI Recommendation:** Option (a) is the minimal reading of the AC — the DRAFT file is a note quoting
code that *was* refactored, exactly the "old spec" class the AC exempts. Option (b) is a **separate,
AI-proposed hygiene item** (one list change in the release build + one tarball-e2e expectation, in B)
that removes the only legacy-name text from the *shipped* artifact — worth doing while the exclusion
filter is being removed anyway, but say no if you want B kept strictly to the migration.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 5

**Question:** The re-publish in B: **version** `0.2.0` (minor — five newly working workflows,
`create-workflow` usable from a registry install, the env-var elimination, the AHQ-205 fix; still 0.x)
vs `0.1.2`; and **who runs `npm publish`** — the Implementer prepares everything per
`docs/dev/publish-checklist.md` (build, `pnpm pack`, tarball inspection, checklist updates for the full
skill list) and hands the actual `npm publish` to you in a real Terminal (passkey/OTP hand-off), then
runs the registry verification matrix (npx + prefix-global, Node 22/24; all seven list; string-reversal
end-to-end; the user-workspace scenario against the registry install).

**AI Recommendation:** `0.2.0`, published inside B with that hand-off (publish is in AHQ-201's parent
scope, and AHQ-207 is blocked on "the re-publish that follows AHQ-201").

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 6

**Question:** Four implementation choices for sub-task A — do you want them as recommended? **(a)**
prebuilt framework resolution by package self-reference now (release strips per-workflow install
files), the runner-registered resolve hook deferred to AHQ-203; **(b)** the dev wrapper
(`agentic-hq-dev`) runs the **compiled** CLI from `<repo>/dist` after Build 1 (so even the CLI is
byte-identical to production and tsx leaves the runtime path); **(c)** the root `package.json` `exports`
carries a `types` condition → `.ts` source so contributors' IDEs and Build 2 see live types without a
framework build; **(d)** Build 1 uses incremental `tsc` (output identical to a clean build) so the
per-invocation cost — including `agentic-hq-dev list` — stays ~1 s. The trade-offs behind (a) and (b)
are written up in full in `supporting-docs/01-new-two-separate-builds-architecture-design.md` §11.

**AI Recommendation:** Yes to all four; name any you want changed.

**Human Answer ('Yes' means follow AI Recommendation):** Yes — after reading the §11 trade-offs: (a)
self-reference now, hook deferred to AHQ-203; (b) the compiled CLI from `dist`; (c) the `types`
condition; (d) incremental tsc. All four are decided, not left open.

## Relevant Files Reviewed

Ordered by decreasing relevance (pointers for the Planners of sub-tasks A and B):

- `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md` — the parent brief: Sub-Task 7's scope, the
  "Open Sub-Task Instructions → Sub-Task 7" items (acceptance scenario, `--using=add-feature`
  re-verify, bin-wrapper test cleanup, grep-clean AC), and the new `agentic-hq-dev` line.
- `docs/tickets/AHQ-201/workflow-files/supporting-docs/01|02|03-*.md` — the design, the human's four
  questions and answers, the four combinations with all runner variables, and why all four were kept.
- `scripts/build-release.cjs`, `tsconfig.build.json`, `scripts/run-workflow.cjs` — today's single build,
  its per-workflow `include`/`paths`, `EXCLUDED_UNMIGRATED_SKILLS`, and the runner's execution-root
  contract; the seams sub-task A replaces with Build 1 / Build 2 / the four-option runner.
- `bin/agentic-hq.cjs`, `bin/agentic-hq-prebuilt.cjs` — the two wrappers (baked modes; `__dirname/..`
  root); the dev one gains Build 1 and the `agentic-hq-dev` name.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/{math-workflow,add-feature}/SKILL.md` + their
  `ts-workflow/src/*-cli.ts` — the current migrated pattern (runner form; `DefaultWorkflowRuntime`).
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/{string-reversal,quick-jira-workflow,full-jira-tdd-story-workflow,add-feature-detailed-example}/SKILL.md`,
  `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/SKILL.md` and their
  `ts-workflow/src/*-cli.ts` — the five unmigrated launch commands and CLIs (two with env-var relay).
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01…05-*.md` — the scaffolder
  (Steps 0c/1/1.5/5/7 of 01; 4-COPY/4c/4d/4e of 02; the install check in 03; the relay parsers in
  04/05) and `skills/create-workflow/docs/workflow-help-docs/*.md`.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature-detailed-example/01…07-*.md`,
  `skills/add-feature-detailed-example/docs/developer-help-docs/developer-help-doc.md` — the relay
  rename set.
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` (`$0 $1 $2` relay, plugin-dir
  order), `src/workflow-runtime/default-workflow-runtime.ts`, `src/runtime-params/default-ahq-command-line.ts`,
  `src/workflow/claude/claude-workflow-command-builder.ts` (passthrough args, cwd),
  `src/workflow-discovery/workspace/{workspace-impl,ahq-package-impl,current-user-workspace-impl}.ts`
  (the two roots; where the per-workflow `build-mode` rule lives).
- `package.json` (root: `bin`, `exports` → `.ts`, `type: module`, `demo:*` scripts), the ts-workflow
  `package.json`/`tsconfig.json`/`pnpm-workspace.yaml`/`.npmrc` of a migrated and an unmigrated skill.
- `tests/e2e/fixtures/string-reversal-copy-for-test/**` and
  `tests/e2e/demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts` — the
  user-workspace baseline to repoint; `tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts`
  (shipped-skills map, exclusion assertions); `tests/integration/build/build-determinism.integration.test.ts`;
  `tests/integration/runner/run-workflow-validates-and-executes.integration.test.ts`;
  `tests/integration/bin/bin-wrapper-supplies-the-package-root-explicitly.integration.test.ts`.
- `docs/tickets/AHQ-204/01-work-details.md`, `docs/tickets/AHQ-200/workflow-files/{01-feature-brief,04-review-summary}.md`,
  `docs/tickets/AHQ-198/workflow-files/04-review-summary.md`, `docs/tickets/AHQ-205/workflow-files/*.md`
  — the sibling records carrying instructions into this Sub-Task.
- `docs/dev/{how-agentic-hq-works,npm-commands,publish-checklist}.md`, `README.md` — docs that describe
  the legacy launch chain / `agentic-hq` linking and need correctness edits.

## Acceptance Criteria

- Any workflow — bundled in the agentic-hq repo or in a user's workspace — has identical files and
  `SKILL.md` (bar the CLI filename), and is built by one shared workflow build and run by one runner:
  `build-first` = build then run, `prebuilt` = run, on byte-identical compiled JS.
- The framework and workflows are built separately: the framework by its bin wrapper (dev, now
  `agentic-hq-dev`) or by publish, never on a user's machine; a workflow inside its own `ts-workflow/`.
- A user with an npm-installed agentic-hq scaffolds a workflow with `create-workflow`, and a
  collaborator with their own npm install clones and runs it — no clone of agentic-hq anywhere.
- All seven shipped workflows list and run from both the clone and an npm install; `create-workflow --using=add-feature`
  works from a registry install.
- The legacy names (`AGENTIC_HQ_WORKSPACE_ROOT` and equivalents) exist only in historical files, and the
  temporary half of the AHQ-200 bin-wrapper test is gone.
- `agentic-hq@0.2.0` is published and verified from the registry.

## Split Suggestion (Accepted)

**Record of the decision (2026-08-18):** the Researcher flagged this feature as too large/complex for
one add-feature run and recommended terminating the workflow and splitting the feature. The human
accepted the suggestion, terminated the workflow, and will perform each Sub-Task below as a single
feature implementation — [AHQ-208](https://agentic-hq.atlassian.net/browse/AHQ-208) (Sub-Task A) first,
then [AHQ-209](https://agentic-hq.atlassian.net/browse/AHQ-209) (Sub-Task B) — each as its own
`add-feature` run whose Human Prompt names this brief
(`docs/tickets/AHQ-201/workflow-files/01-feature-brief.md`, with `supporting-docs/01|02|03`) as the
**Parent feature brief**. AHQ-201 remains the umbrella.

This feature is too large/complex for the simple add-feature workflow.

**Why:**

- It changes the **pattern** (two separate builds, a generalised runner, per-workflow `build-mode`,
  `.d.ts` + `exports`, the dev wrapper and its name, the release layout) *and* then applies that
  pattern to five workflows and the ~1,700-line scaffolder — two different kinds of work, the second
  depending on the first being proven.
- It has several independently valuable outcomes: the uniform build/run system (proven on the
  non-interactive workflows), all seven workflows restored, the scaffolder rewritten, the grep-clean
  end-state, and a registry publish.
- It cannot be validated in one pass: sub-task A's tests (build determinism, runner, tarball install,
  user-workspace fixture against a tarball install) must be green before the migrations in B mean
  anything, and B ends in a manual interactive walk-through plus a publish.
- Doing the five migrations on the *old* pattern first would be wasted work — the human's "each design
  change once" rule.

**Split Suggestion** — two clean new sub-task Jiras, created by the human on 2026-08-18:
**[AHQ-208](https://agentic-hq.atlassian.net/browse/AHQ-208)** (Sub-Task A) and
**[AHQ-209](https://agentic-hq.atlassian.net/browse/AHQ-209)** (Sub-Task B), with **AHQ-201 as the
umbrella** and this brief + `supporting-docs/01|02|03` as their parent brief.
Sequence: **AHQ-208 → AHQ-209 → AHQ-207 → AHQ-199.**

### Sub-Task A — [AHQ-208](https://agentic-hq.atlassian.net/browse/AHQ-208) — Split Framework Build From Workflow Build: Uniform Build+Run For All Workflows (Proven On math, string-reversal, add-feature)

*Tracer Bullet / Walking Skeleton — proves the whole new pattern on the non-interactive workflows
(plus add-feature, which AHQ-195 development runs on) before anything else is migrated.*

   - Build 1: `tsconfig.build.json` emits `<repo>/dist` (JS + `.d.ts`), drops the per-workflow
     `include` entries and `paths`; root `package.json` `exports` → `./dist/…js` (+ `types` → `.ts`);
     `dist/` gitignored.
   - Dev wrapper: runs Build 1 then the CLI; root `bin` renamed **`agentic-hq-dev`**.
   - Build 2: `scripts/build-workflow.cjs` (`pnpm install` → symlink `node_modules/agentic-hq →
     {ahq-package-root}` → `tsc` → `ts-workflow/dist/`); the standard ts-workflow file set (emitting
     `tsconfig.json`; `package.json` with `typescript` devDep + `commander`, no `link:`;
     `.npmrc`/`pnpm-workspace.yaml`/lockfile; `dist/` gitignored).
   - Runner: `--build-mode`, `--ahq-package-root`, `--workflow-dir`, `--workflow-js` (relative);
     `build-first` → Build 2 then run; `prebuilt` → run; no framework build; no `release/` execution.
   - CLI: per-workflow `build-mode` at skill launch (AHQ package root → wrapper's mode; user workspace →
     `build-first`), relayed as `$1`.
   - math-workflow, string-reversal and add-feature onto the single SKILL.md template + standard files
     (string-reversal's CLI → `DefaultWorkflowRuntime`; string-reversal leaves
     `EXCLUDED_UNMIGRATED_SKILLS`).
   - Release build: Build 1 + Build 2 per bundled workflow + stage `release/` (framework `dist/`,
     prebuilt bin, both scripts, plugins with `dist/` and *without* per-workflow install files or
     `node_modules`, generated manifest, README/LICENSE); `release/` publish-only.
   - Tests: build determinism (per-workflow `dist/`, `.d.ts`), runner contract, tarball e2e (shipped set;
     math **and** string-reversal end-to-end), cross-workspace e2es green, **the user-workspace fixture
     e2e repointed to the new pattern and run against a tarball-installed agentic-hq** (no clone),
     bin-wrapper test for `agentic-hq-dev`/Build 1, unit tests for the per-workflow mode.
   - Minimal correctness-only doc edits (`how-agentic-hq-works.md` launch chain, publish-checklist
     tarball inspection, `demo:*` scripts, README contributor step → `agentic-hq-dev`). No publish.
   - Decided by the human (Q6): (a) prebuilt framework resolution by package self-reference (release
     strips per-workflow install files; hook deferred to AHQ-203); (b) the dev wrapper runs the compiled
     CLI from `<repo>/dist`; (c) root `exports` `types` condition → `.ts` source; (d) incremental tsc
     for Build 1. Planner inputs: supporting doc 01 (esp. §3, §9, §11) and doc 03.
### Sub-Task B — [AHQ-209](https://agentic-hq.atlassian.net/browse/AHQ-209) — Migrate Remaining Workflows And create-workflow Scaffolder Onto Two-Builds Pattern, Restore All To Working, Publish 0.2.0

*Runs only after Sub-Task A is done and green.*

   - `quick-jira-workflow`, `full-jira-tdd-story-workflow`: SKILL.md template + `DefaultWorkflowRuntime`
     CLI + standard files.
   - `add-feature-detailed-example` and `create-workflow`: the same, plus the
     `agentic-hq-workspace-root-dir` → `ahq-package-root` relay rename through their CLIs, all 7 + 5
     command files and the developer help doc.
   - The scaffolder's templates and teaching rewritten around the single template (Command 01 Steps
     0c/1/1.5/5/7; Command 02 4-COPY copies SKILL.md verbatim + sets the CLI filename and regenerates
     install files from the standard template, 4c/4d/4e; Command 03 runs Build 2; Commands 04/05
     renames; help docs).
   - `EXCLUDED_UNMIGRATED_SKILLS` emptied and deleted; tarball e2e shipped set = all seven;
     `demo:plugin-direct:*` fixed; the two skill-less draft `commands/` dirs no longer shipped (Q4(b));
     grep-clean AC (DRAFT notes exempt as historical, Q4(a)); the temporary half of the AHQ-200
     bin-wrapper test deleted.
   - Restore-to-working proof: `list` shows all seven (dev + tarball); string-reversal e2e (from A);
     runner `--help` smoke for the interactive workflows; **manual acceptance walk-through**: fresh dir
     + npm/tarball install → `agentic-hq create-workflow -- --using=add-feature` → scaffold → commit →
     collaborator run (mechanism proven by A's fixture e2e). Closes the AHQ-198 "add-feature Reviewer
     points at create-workflow" dead end.
   - Re-publish `0.2.0`: build → `cd release && pnpm pack` → tarball inspection → the human runs
     `npm publish` in a real Terminal → registry verification matrix (npx + prefix-global, Node 22/24;
     all seven list; string-reversal end-to-end; the user-workspace scenario against the registry
     install). Unblocks AHQ-207 and AHQ-199.

   **Update (2026-08-19, decided during AHQ-208 planning — read before starting B):**
   - **Every `SKILL.md` is now byte-identical** — there is no per-workflow line at all. The template
     derives `skill-id` from the final path segment of the `skill-base-dir` Claude Code hands every
     skill (= the skill directory name = `skillId` in `ahq-workflow.json`; `shortId` does NOT work),
     sets `workflow-program-name = {skill-id}-cli`, and returns the four-option runner command with
     `--workflow-js=dist/{workflow-program-name}.js`; the frontmatter `description` is generic. The
     exact file is in `docs/tickets/AHQ-208/workflow-files/02-implementation-plan.md` §6 (and lands in
     the repo via AHQ-208 on math-workflow, string-reversal, add-feature and the e2e fixture). For B:
     quick-jira-workflow, full-jira-tdd-story-workflow, add-feature-detailed-example and create-workflow
     get **that identical file** (copy it — do not hand-edit a name into it), and the scaffolder's
     "4-COPY" step **copies `SKILL.md` verbatim with no substitutions** — it no longer "sets the CLI
     filename" in `SKILL.md`.
   - **Standard program-name convention `<skill-id>-cli.ts`** (`src/<skill-id>-cli.ts` → compiled
     `dist/<skill-id>-cli.js`). AHQ-208 renames **all five** `-demo-cli` files — `math-workflow-cli.ts`,
     `string-reversal-cli.ts`, `quick-jira-workflow-cli.ts`, `full-jira-tdd-story-workflow-cli.ts`
     (rename-only for those two; their migration is still B's) and the fixture's
     `string-reversal-copy-for-test-cli.ts` — so B finds every CLI already on the convention
     (add-feature, add-feature-detailed-example and create-workflow complied already) and must keep it:
     the scaffolder names a new workflow's CLI `<skill-id>-cli.ts`, nothing else.
   - The builds are named **Framework Build (1)** and **Workflow Build (2)** everywhere ("Build 1"/"Build
     2" in these AHQ-201 docs are the historical names) — see `docs/glossary.md` *Builds & running* and
     `docs/dev/how-agentic-hq-works.md` *Builds: Framework Build (1) and Workflow Build (2)*; use those
     names in anything B writes (Command 03 "runs the Workflow Build (2)", help docs, comments).

**Recommendation:** terminate this workflow and split the feature as above.

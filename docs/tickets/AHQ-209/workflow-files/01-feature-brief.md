# AHQ-209 — Feature Brief

## One Sentence Outcome

All seven shipped workflows and the `create-workflow` scaffolder work again — migrated onto the
AHQ-208 two-builds pattern, proven from both the clone and a pure npm install with the legacy
workspace-root names eliminated from the live tree — and `agentic-hq@0.2.0` is published and
verified from the registry.

## User Story

**As a**: developer using an npm-installed agentic-hq  
**I want:** every shipped workflow and the `create-workflow` scaffolder to work from my install  
**So that:** I can run any demo workflow and scaffold my own custom workflow without cloning agentic-hq

## Human Prompt

This is a subtask of AHQ-201 (which is itself a subtask of AHQ-195) and is detailed in the parent ticket at:
docs/tickets/AHQ-201/workflow-files/01-feature-brief.md
and it's parent ticket AHQ-195 is documented in:
docs/tickets/AHQ-195/workflow-files/01-feature-brief.md
Please be sure to read the details of how this was split in that ticket and be especially careful to fully read and understand any relevant Addenda

**UPDATE (2026-08-20, appended from chat during this Researcher stage).** Two things surfaced after
the Questions were answered:

1. **The stale global link is a pnpm link, not npm — and the human launched this very run through
   it.** The human: *"but I'm pretty sure I ran "agentic-hq add-feature -- --ticket-id=AHQ-209" -
   pls explain that...?"* Investigation showed `which agentic-hq` resolves to
   `~/Library/pnpm/bin/agentic-hq`, a pnpm shim whose target
   `~/Library/pnpm/global/v11/…/node_modules/agentic-hq` is a **symlink to the clone** (created
   15 Jun by `pnpm link --global`, pre-dating the AHQ-208 `agentic-hq-dev` rename) — so
   `agentic-hq` currently runs the same clone dev wrapper file as `agentic-hq-dev`, and this run is
   a valid dev-mode `build-first` proof. The human: *"aaaaaaaaaaaaaaaaaaaaah, gotcha - so I'm
   running the \*same\* thing agentic-hq-dev would run? But kinda "accidentally" until you do the
   work in this Jira to fix the mess."* Consequence for Question 1: the publish-stage cleanup must
   remove the **pnpm** shim (`pnpm uninstall --global agentic-hq`) — the `npm uninstall -g
   agentic-hq` in AHQ-208's follow-up note would not touch it.

2. **Add-feature workflow meta-work done in-session** (outside AHQ-209 scope; will appear in this
   branch's diff): at the human's request — *"If I ask a question, answer it, then ask whether I'd
   like you to continue with the command (pls update  your command to make that clear)"*, then
   *"Yes, please fix all four  - and move this directive to the "## Important Notes" section in all
   4 (Reviewer currently only one with this)"* — all four `commands/add-feature/0?-*.md` files
   gained a "Human questions" bullet in an end-of-file `## Important Notes` section (section created
   new in 01–03; bullet appended to 04's existing section).

## My Understanding of This Task

AHQ-209 is **Sub-Task B of the AHQ-201 split** (accepted 2026-08-18): with the two-builds system
delivered and human-approved by AHQ-208 on 2026-08-20, migrate the four remaining workflows
(`quick-jira-workflow`, `full-jira-tdd-story-workflow`, `add-feature-detailed-example`,
`create-workflow`) onto that pattern — each gets the byte-identical `SKILL.md` (copied verbatim, no
substitutions), a `DefaultWorkflowRuntime` CLI, and the standard `ts-workflow` file set — with the
two "relay" workflows additionally renaming `agentic-hq-workspace-root-dir` → `ahq-package-root`
through their CLIs and all 12 command files. The `create-workflow` scaffolder's ~1,700 lines of
templates and teaching are rewritten around the single template (SKILL.md copied verbatim; the only
per-workflow variable is the CLI filename `<skill-id>-cli.ts`; Command 03 runs the Workflow Build
(2)). Then everything is restored to working and proven: `EXCLUDED_UNMIGRATED_SKILLS` emptied and
deleted, the tarball e2e's shipped set = all seven, the two broken `demo:plugin-direct:*` scripts
fixed, the two skill-less draft `commands/` dirs no longer shipped (Q4(b)), the grep-clean AC met
(DRAFT notes exempt as historical), the temporary half of the AHQ-200 bin-wrapper test deleted, and
the manual acceptance walk-through run (fresh dir + npm/tarball install →
`agentic-hq create-workflow -- --using=add-feature` → scaffold → commit → collaborator run).
Finally `agentic-hq@0.2.0` is published — the human runs `npm publish` in a real Terminal — and
verified from the registry, unblocking AHQ-207 and AHQ-199.

The binding decisions are all already made in the parent briefs: AHQ-201 Questions 1–6 (design,
split scope, automated-vs-manual proof split, Q4 hygiene options (a)+(b), version 0.2.0 with the
publish hand-off, the four sub-task-A choices) and the AHQ-201 brief's **Update (2026-08-19)**
addendum (byte-identical SKILL.md with runtime `skill-id` derivation; the `<skill-id>-cli.ts`
convention that AHQ-208 already applied to every CLI including quick/full-jira; the "Framework
Build (1)" / "Workflow Build (2)" naming for anything B writes). This run of add-feature is itself
the deferred proof AHQ-208's review left open — see Research Findings §4.

## Research Findings

### 1. What AHQ-208 delivered (the pattern B migrates onto) — done, green, human-approved 2026-08-20

Recorded in `docs/tickets/AHQ-208/workflow-files/03-implementation-summary.md` and
`04-review-summary.md` (approved with two recommended fixes applied; no conditions):

- **Framework Build (1)**: incremental tsc of `src/` → `<repo>/dist` (JS + `.d.ts` + maps), owned by
  the dev wrapper — root `bin` is now **`agentic-hq-dev`** → `bin/agentic-hq.cjs`, which builds then
  runs the compiled `dist/src/cli/main.js` (no tsx). **Workflow Build (2)**: shipped
  `scripts/build-workflow.cjs` (pnpm install → `node_modules/agentic-hq → <ahq-package-root>`
  symlink → tsc → `<workflow-dir>/dist/`). **Four-option runner** `scripts/run-workflow.cjs`
  (`--build-mode`, `--ahq-package-root`, `--workflow-dir`, `--workflow-js` relative; all required);
  never builds the framework, never touches `release/` (publish-only now).
- **The byte-identical `SKILL.md`** deployed to math-workflow, string-reversal, add-feature and the
  e2e fixture — verified on disk today: all three repo copies hash `185b5403…`. The exact file is in
  `docs/tickets/AHQ-208/workflow-files/02-implementation-plan.md` §6; B **copies** it (never
  hand-edits a name into it). It derives `skill-id` from `skill-base-dir`'s final path segment and
  runs `dist/{skill-id}-cli.js`.
- **Standard `ts-workflow` file set** (the model for B's four): `package.json` with `commander` dep
  + `typescript`/`@types/node` devDeps, no `agentic-hq` dep, no tsx, no postinstall; emitting
  `tsconfig.json`; frozen `.npmrc`; minimal `pnpm-workspace.yaml` (`packages: ['.']` +
  `minimumReleaseAge`); `.gitignore`; committed regenerated lockfile.
- **`<skill-id>-cli.ts` convention completed for all CLIs**: AHQ-208 already `git mv`-renamed
  `quick-jira-workflow-cli.ts` and `full-jira-tdd-story-workflow-cli.ts` (rename-only — their
  content is still legacy, migration is B's) and updated every live reference including the three
  create-workflow command files.
- **Per-workflow `build-mode`** in `src/` (user workspace → `BUILD_FIRST` always; AHQ package →
  wrapper's mode), unit-tested; 190/190 unit tests, runner 6/6, bin-wrapper 2/2, build-determinism
  green; tarball/cross-workspace/fixture e2es green on real Claude runs.
  `vitest.integration.config.ts` now has `fileParallelism: false` (fixes the shared
  `dist/`/`release/` race the AHQ-201 brief flagged as "needs a Jira" — defused as predicted).
- **No publish**: `package.json` is still `0.1.1`, `private: true`, prepack guards intact.

### 2. Current state of the four remaining workflows and the scaffolder

- The four `SKILL.md` files each differ from the template and still return the legacy
  `pnpm install && ln -sfn "$AGENTIC_HQ_WORKSPACE_ROOT" … tsx …` chain (doubly broken: the env var
  is gone since AHQ-200, and the CLIs don't compile since AHQ-197). Their CLI *filenames* are
  already on-convention; `quick-jira-workflow-cli.ts` / `full-jira-tdd-story-workflow-cli.ts` still
  use the no-arg `new DefaultClaudeCodeTool()`, and `add-feature-detailed-example-cli.ts` /
  `create-workflow-cli.ts` additionally read `AGENTIC_HQ_WORKSPACE_ROOT` and relay it as
  `agentic-hq-workspace-root-dir` into their Command 01s (rename model: AHQ-200's add-feature
  rename — CLI broadcasts `ahq-package-root=…` from `runtime.getAhqPackageRoot().getPath()`; every
  command-file parser and derived-path block renames in lockstep — 7 command files for
  add-feature-detailed-example + its developer-help-doc, 5 for create-workflow).
- The scaffolder teaching to rewrite is exactly as mapped in the AHQ-201 brief (Command 01 Steps
  0c/1/1.5/5/7; Command 02 Steps 4-COPY/4c/4d/4e — 4-COPY now copies `SKILL.md` verbatim with no
  substitutions; Command 03's checks run the Workflow Build (2); Commands 04/05 rename the relay
  variable) — that mapping predates AHQ-208 but the scaffolder files are untouched since, so it
  stands.
- `EXCLUDED_UNMIGRATED_SKILLS` (`scripts/build-release.cjs:52`) now holds exactly the four; the
  tarball e2e's `EXPECTED_SHIPPED_SKILLS_BY_PLUGIN` correspondingly lists three shipped skills.
- Root `demo:plugin-direct:quick-jira-workflow` and `demo:plugin-direct:full-jira-tdd-story-workflow`
  still run the legacy tsx chain (broken); the math/string-reversal ones show the new form to copy
  (`pnpm build:framework && node scripts/run-workflow.cjs --build-mode=build-first …`).
- The two skill-less draft dirs `commands/DRAFT-oo-refactoring-workflow/` and
  `commands/research-plan-implement/` still exist and still ship (Q4(b): stop shipping them, where
  the exclusion filter is being removed anyway).
- The cross-workspace quick-jira e2e was updated to `agentic-hq-dev` in AHQ-208 but deliberately not
  executed (unmigrated workflow; it creates real test Jiras) — it is currently red by design.

### 3. Grep-clean AC baseline (verified today, 2026-08-20)

With the AC's exclusions (`docs/jira-docs`, `docs/tickets`, `LEGACY`, `release`, `node_modules`,
`temp`), the legacy names occur in **21 files**: the 5 create-workflow commands + its SKILL.md +
CLI, the 7 add-feature-detailed-example commands + its SKILL.md + CLI + developer-help-doc, the
quick-jira and full-jira SKILL.md files, the DRAFT notes file (exempt as historical per Q4(a)), and
the bin-wrapper integration test (whose temporary half B deletes: the second `it(...)`,
`LEGACY_ENV_VAR_NAME`, `BOGUS_LEGACY_ROOT`, the optional parameter of
`runListThroughDevBinWrapper()`, and the `TEMPORARY` header paragraph). Everything else is already
clean — B's migrations account for every non-exempt file.

### 4. This very run is the deferred add-feature proof (and the relay check passes)

AHQ-208's review deferred add-feature's own end-to-end interactive proof under the new pattern to
"the next `agentic-hq-dev add-feature` run (AHQ-209)" — i.e. this run. The launch chain has already
worked (this Researcher is running, launched via the byte-identical SKILL.md → four-option runner →
compiled `dist/add-feature-cli.js`), and this run's `command-input.json` reads
`ahq-package-root=/Users/stevepersonal/dev/agentic-hq/agentic-hq and ticket-id=AHQ-209` — the
correct renamed relay. The proof completes when this workflow runs through all four agents — no
extra action from anyone: the human launched it dev-mode `build-first` from the clone (typed via
the stale `agentic-hq` pnpm shim, which runs the same dev wrapper file as `agentic-hq-dev` — see
the UPDATE in `## Human Prompt`) and the workflow itself is the thing being proven. This is distinct
from AHQ-207 (the human's manual full add-feature run on the Ubuntu VM against a fresh npm install
of the *published* package), which runs after this ticket publishes `0.2.0`.

### 5. Publish state and known follow-ups AHQ-208 left for B

- Registry: `0.1.1` = `latest` (math-workflow + add-feature only); local `package.json` `0.1.1`,
  `private: true`. B publishes `0.2.0` per AHQ-201 Q5: Implementer prepares per
  `docs/dev/publish-checklist.md` (already extended by AHQ-208 for the new artifact shape), the
  human runs `npm publish` in a real Terminal (passkey/OTP does not survive non-TTY), then the
  registry verification matrix runs (npx + prefix-global, Node 22/24, all seven list,
  string-reversal end-to-end, the user-workspace scenario against the registry install).
- AHQ-208's "Out Of Plan Follow-up" notes two items that land on B: **(a)** the stale global
  `agentic-hq` link still points at the clone — investigated during this stage: it is a **pnpm**
  global link (shim in `PNPM_HOME/bin`, target symlinked to the clone since 15 Jun), so removal is
  `pnpm uninstall --global agentic-hq` (not the `npm uninstall -g` AHQ-208's note guessed); removing
  it frees the name for the registry install verification (see Question 1 and the UPDATE in
  `## Human Prompt`); **(b)** `default-workflow-runtime.unit.test.ts:25` still
  uses the retired illustrative path `…/math-workflow-demo-cli.js` as fixture argv data — pure
  fixture, could be tidied in B or AHQ-199 (see Question 3).

## Web/Perplexity Research

No external research was required: AHQ-209's scope, design and decisions are fully specified by the
two parent briefs, the AHQ-201 supporting docs (01–03), the AHQ-208 plan/summary/review, and the
code — all verified locally today.

## Questions And Answers

### Question 1

**Question:** The stale global `agentic-hq` link (from the pre-rename `npm link`) still points at
the clone. Shall B include removing it (`npm uninstall -g agentic-hq`, run by you or with your
approval) as a publish-stage step, so the name is free for the registry verification matrix's
`npm install -g agentic-hq` — and shall the Implementer re-run `npm link` so `agentic-hq-dev` is
freshly linked?

**AI Recommendation:** Yes — do both at B's publish/verification stage (not earlier: the stale link
behaves like `agentic-hq-dev` and is harmless until the registry install needs the name). It is a
one-command cleanup AHQ-208 explicitly left as your call.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

**Clarification (appended 2026-08-20, after the answer):** the stale link turned out to be a
**pnpm** global link, so the removal command is `pnpm uninstall --global agentic-hq` (not
`npm uninstall -g`) — details in the `## Human Prompt` UPDATE and Research Findings §5(a). The
"Yes" stands unchanged: remove it at the publish stage, then re-run `npm link` so `agentic-hq-dev`
is freshly linked.

### Question 2

**Question:** AHQ-201 Q3 gave the interactive workflows (quick-jira, full-jira,
add-feature-detailed-example) "list + runner `--help` smoke only" in B. But the pre-existing
`cross-workspace-quick-jira-workflow-produces-expected-files` e2e — red by design since AHQ-197,
updated to `agentic-hq-dev` in AHQ-208 but not executed — is part of the suite's definition of
"working" and creates a real test Jira when run. After migrating quick-jira, should B run that e2e
once as part of the restore-to-working proof (accepting the test Jira it creates), rather than
leaving it unexecuted?

**AI Recommendation:** Yes. "Restore all to working" should mean the existing suite is green, not
"would probably pass"; it is one real-Claude run and one throwaway test Jira, and it is the only
end-to-end evidence any Jira-MCP workflow gets in B.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 3

**Question:** The AHQ-208 follow-up tidy: `default-workflow-runtime.unit.test.ts:25` uses the
retired name `…/math-workflow-demo-cli.js` as illustrative fixture argv. Fold this one-line rename
into B (with the convention-completion work it belongs to), or leave it for AHQ-199?

**AI Recommendation:** Fold into B — it is a one-line consistency fix already flagged in the
AHQ-208 record, and B is the ticket that finishes the `<skill-id>-cli` convention everywhere.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

## Relevant Files Reviewed

Ordered by decreasing relevance (pointers for the Planner):

- `docs/tickets/AHQ-201/workflow-files/01-feature-brief.md` — the parent brief: B's full scope list
  (Sub-Task B section), the Q1–Q6 decisions, and the binding **Update (2026-08-19)** addendum.
- `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md` — the grandparent: Sub-Task 7's open
  instructions (acceptance scenario, `--using=add-feature` re-verify, bin-wrapper test cleanup,
  grep-clean AC).
- `docs/tickets/AHQ-208/workflow-files/03-implementation-summary.md` — what Sub-Task A actually
  shipped (the pattern, file set, renames, test suites) and the follow-ups B inherits.
- `docs/tickets/AHQ-208/workflow-files/04-review-summary.md` — A's approval record and the deferred
  add-feature proof this run supplies.
- `docs/tickets/AHQ-208/workflow-files/02-implementation-plan.md` — §6 holds the exact
  byte-identical `SKILL.md` to copy (pointed at by the addendum; not re-read this run).
- `scripts/build-release.cjs` — `EXCLUDED_UNMIGRATED_SKILLS` (exactly B's four) and the
  per-workflow stripped install-files list.
- `package.json` — version `0.1.1`, `agentic-hq-dev` bin, the new-form vs still-legacy
  `demo:plugin-direct:*` scripts.
- The seven shipped skills' `SKILL.md` files — hash-compared: three identical on the template
  (`185b5403…`), four still legacy.
- `~/Library/pnpm/bin/agentic-hq` (shim) and its global symlink target — the stale-link
  investigation behind Question 1's clarification.
- `tests/unit/workflow-runtime/default-workflow-runtime.unit.test.ts:25` — Question 3's fixture
  tidy target.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/` (listing) — confirmed the two skill-less
  draft dirs still present and shipping.

## Acceptance Criteria

- All seven shipped workflows list and run from both the clone (`agentic-hq-dev`) and an npm/tarball
  install, on the byte-identical `SKILL.md` template — and the full existing test suite is green,
  including one real run of the cross-workspace quick-jira e2e (Q2).
- The manual acceptance walk-through passes: an npm/tarball-installed user scaffolds via
  `agentic-hq create-workflow -- --using=add-feature`, commits, and a collaborator runs the
  scaffolded workflow from their own install — no agentic-hq clone anywhere.
- The grep-clean AC holds (legacy names only in historical/exempt files), the temporary half of the
  AHQ-200 bin-wrapper test is gone, and the two skill-less draft command dirs no longer ship.
- `agentic-hq@0.2.0` is published (human-run `npm publish`) and verified from the registry per the
  verification matrix — with the stale pnpm `agentic-hq` shim removed first (Q1).

## Brief Approval

The human read the finalized brief and approved it as-is at the Researcher's approval gate on
2026-08-20 (AskUserQuestion: "Approve brief"), with all three Questions answered "Yes" and the
Question 1 clarification and Human Prompt UPDATE already incorporated. The feature was judged a
good size for one run (its scope was fixed by the human at the AHQ-201 split gate). The workflow
continues to the Planner.
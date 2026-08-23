# AHQ-197 — Feature Brief

## One Sentence Outcome

The agentic-hq package is assembled by a staged-release-tree build — a staging directory holding
exactly what ships, under a single generated manifest — and math-workflow runs via an explicit
`build-mode`/`ahq-package-root` parameter chain that makes dev runs build and execute the
byte-identical JavaScript npm users get.

## User Story

**As a**: contributor working on Agentic HQ  
**I want:** dev workflow runs to automatically build and run the exact JavaScript that ships, from an honestly-assembled release tree  
**So that:** what I verify locally is guaranteed to be what npm users run — with no hidden env vars or pack-time patches in between

## Human Prompt

This is a subtask of AHQ-195, and is detailed in the parent ticket at:
docs/tickets/AHQ-195/workflow-files/01-feature-brief.md
Please be sure to read the details of how this was split in that ticket and be especially careful to fully read and understand the Addendum which point to some updates in what is needed for this ticket that were made during the work on the first AHQ-196 (spike) task.  If you read docs/tickets/AHQ-196/workflow-files/02-implementation-plan-supporting-docs/perplexity-questions/02-perplexity-q-and-a-about-dist-package-json.md you'll understand that we've decided to do the "staged-release-tree" stuff now (as part of the main AHQ-195 work) and leave the "true nested packages" refactor to a possible later Refactor Jira in AHQ-203.

I'm sorry, but I still don't fully understand the idea behind this "staged release tree" thing as I'm not familiar with javascript/Typescript builds.  Please add a small "Dummies Guide To Staged Release Tree" section to this doc pointing at a short(ish) guide at docs/tickets/AHQ-197/workflow-files/supporting-docs/dummies-guide-to-staged-release-tree-idea.md that i can read to understand better this idea.

**UPDATE 1 (2026-08-09, from chat, while reading the Dummies Guide):** *"Please include answer to
my additional question: Do people \*ever\* ship typescript in an npm package?  Sounds like very
non-standard and that's what we are avoiding here, yes (just ship javascript)?  Would / /Should we
consider shippting Typescript that gets run on the users machine, or just forget it as an option?
Pls add section answering these questions specifically"* — answered in the Dummies Guide's
"Sidebar: does anyone ever ship TypeScript in an npm package?" section.

**UPDATE 2 (2026-08-09, from chat, challenging a line in the Dummies Guide):** *"You wrote
"Contributors keep running TS via tsx in the repo" - are we not changing the whole "build/run
model" so that when someone runs a workflow they are developing it \*always\* gets built into
shippable javascript and then that is what gets run - which means even in dev mode we are always
running what gets shipped?  This is/was to prevent us using two different ways of running code
-which seems like it could introduce complexity/problems."* — Confirmed correct: under
`build-first`, a dev-mode workflow run always builds and executes the byte-identical shippable
JS; the guide's over-broad sentence was corrected. The surviving TS-direct contexts (unit
tests/typecheck; user-authored workflows per parent-brief Q3/Q6; and — today, pending a Planner
decision recorded below — the CLI wrapper process itself) are now stated precisely in the guide's
"What does NOT change" section.

**UPDATE 3 (2026-08-09, from chat, after asking whether the skill knows shipped vs user-authored
and what mechanism picks build→run JS vs tsx):** *"Yup, please include a section in the Dummies
Guide about how this works, based on what you just said.  It sounds like this "universal funnel
covering user-authored workflows too" would be a good thing to end up with, later..."* — Section
added to the guide ("How the system decides which model to use (and what the AI skill knows)").
The expressed preference — a universal funnel routing user-authored workflows through the same
shared runner script, later — is a design signal for **AHQ-201/AHQ-203** (not this ticket); it is
recorded here so those runs can pick it up, and aligns with the parent brief's AHQ-201 addendum
open question.

## My Understanding of This Task

AHQ-197 is Sub-Task 2 of the AHQ-195 npm-publish split (the parent brief at
`docs/tickets/AHQ-195/workflow-files/01-feature-brief.md` is the source of truth; math-workflow
remains the only working vehicle, all other workflows stay deliberately broken). Per the parent
brief's 2026-08-08 addendum it now has two jobs. **(a) The staged-release-tree restructure** — a
"no behaviour change" packaging refactor in which the build assembles a staging directory
containing exactly what ships, with a single generated manifest at its root, replacing the four
interim mechanisms AHQ-196 committed (the `publishConfig` bin/exports override, the `files`
whitelist, the generated `dist/package.json`, and probably the postinstall chmod). The parent
brief mandates that this Researcher/Planner stage **confirms the design with the human before any
build-pipeline code is written** — that confirmation is Question 1 below. **(b) The explicit
parameter chain** — `build-mode` (`build-first` | `prebuilt`) and `ahq-package-root` flowing
visibly (never via environment variables) from the entry points through the TypeScript, across the
Claude/skill hop as an opaque pass-through, to the shared runner script (the only code that acts on
`build-mode`); dev mode achieves byte-identical parity by running the shared build on the fly; the
entry points dual-write the legacy `AGENTIC_HQ_WORKSPACE_ROOT` env var so untouched legacy readers
keep working until AHQ-200 removes it.

The ticket also retires AHQ-196's accepted interims: the `pnpm build && ` prefix on the
cross-workspace math e2e script, and the silent-stale-`dist/` dev risk the AHQ-196 Reviewer
explicitly deferred to this ticket's `build-first` mode. Full detail is in Research Findings; a
plain-English explainer of the staged-release-tree idea (requested in the Human Prompt) is linked
from the Dummies Guide section below.

## Research Findings

### Inputs read (as mandated by the parent brief's AHQ-197 addendum)

- Parent brief `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md`, including all three
  Updates, the ten Q&As, and the 2026-08-06/08-08 addenda.
- Second Perplexity review:
  `docs/tickets/AHQ-196/workflow-files/02-implementation-plan-supporting-docs/perplexity-questions/02-perplexity-q-and-a-about-dist-package-json.md`
  (verdict: interim fixes defensible; proper end-state = nested packages **or** staged release
  tree; staged tree = "Option B").
- AHQ-196's "Findings For Later Sub-Tasks"
  (`docs/tickets/AHQ-196/workflow-files/03-implementation-summary.md`) and Review Summary
  (`.../04-review-summary.md`, whose Potential Fixes row 1 defers the stale-dist seam here).

### The working interim AHQ-196 left (what this ticket restructures)

- **Build:** `pnpm build` = `rm -rf dist && tsc -p tsconfig.build.json && cp
  scripts/dist-package.json dist/package.json` (`package.json:33`). `tsconfig.build.json` compiles
  `src/**` plus the math ts-workflow to `dist/`, mirroring the repo layout (`rootDir "."`), with a
  typecheck-only `paths` mapping for the self-referencing import. Determinism proven (SHA-256
  double-build integration test).
- **Four interim packaging mechanisms**, each individually commented in the code:
  1. `publishConfig` bin/exports override in `package.json:21-28` — applied by `pnpm pack` at pack
     time only; npm's packer does NOT do this, so packing must stay pnpm.
  2. `files` whitelist `["bin", "dist", "scripts/run-workflow.cjs", ".agentic-hq"]`
     (`package.json:14-19`) — coarse, overrides `.gitignore`; known leak: 117+ dev io-files under
     `.agentic-hq/temp/`, `steve-test-plugin`, pnpm-only files (recorded for AHQ-198).
  3. Generated `dist/package.json` (template `scripts/dist-package.json`) — makes Node package
     self-reference resolve `agentic-hq/tools/claude-code` to compiled JS identically in dev-tree
     and installed runs; must stay minimal and mirrored with the publishConfig exports.
  4. Shipped `postinstall` chmod restoring execute bits on `.agentic-hq/plugins/**/*.sh`
     (`pnpm pack` records non-bin files as 0644).
- **Two bin wrappers:** `bin/agentic-hq.cjs` (dev: sets `AGENTIC_HQ_WORKSPACE_ROOT`, runs
  `src/cli/main.ts` via tsx; carries the original REFACTOR comment about the env var) and
  `bin/agentic-hq-prebuilt.cjs` (shipped via the publishConfig bin override: sets the same env
  var, plain-node imports `dist/src/cli/main.js`).
- **Shared runner** `scripts/run-workflow.cjs`: requires `--ahq-package-root=` and
  `--workflow-js=` (loud error if missing — already born with the new parameter name, reads no env
  var), passes remaining args through; its header comment says "AHQ-197 hardens this with
  build-mode".
- **math-workflow SKILL.md** returns the runner invocation but sources the package root from
  `$AGENTIC_HQ_WORKSPACE_ROOT` (both for the runner's own path and the `--ahq-package-root`
  value) — the last env-var dependency in the new chain, replaced when the explicit relay lands.
- **Safety net (transfers with path re-pointing only):**
  `tests/integration/build/build-determinism.integration.test.ts`;
  `tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts` (artifact shape
  incl. dist-manifest + exec-bit assertions, `list`, full math run, hash-based read-only check);
  `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts`
  (dev path — currently needs the `pnpm build && ` prefix this ticket retires); plus the mandated
  manual `agentic-hq math -- --input-number=11` dev-CLI run (the check that caught what the
  tarball e2e alone missed).

### The parameter-chain seams (where build-mode / ahq-package-root will flow)

- **Entry points (mode literal baked in — structural truth, no detection):** the dev wrapper
  passes `build-first`; the prebuilt wrapper passes `prebuilt`. Which artifact you invoked *is*
  the mode.
- **`src/cli/main.ts` → `app.run()`** (`src/cli/app.ts`): `run()` currently takes zero
  parameters — this is the seam where the explicit parameters enter the TypeScript.
- **`CompositionRoot`** (`src/kernel/composition-root.ts`): currently no-arg;
  `new AhqWorkspaceImpl()` reads the env var internally (legacy Read 1). The new chain carries
  `ahqPackageRoot` explicitly; legacy readers stay untouched (dual-write) until AHQ-200.
- **`ClaudeCommandBuilder`** (`src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts`):
  assembles the claude invocation whose final positional argument is
  `"<aiToolCommand> <marshallingId>"` — today's single opaque pass-through (`$0` in SKILL.md).
  Per parent-brief Q8 (option b), `build-mode` joins as a second opaque pass-through the AI relays
  verbatim but never interprets.
- **Terminus:** the shared runner script — the only code that acts on `build-mode`
  (`build-first` = run the shared build, then execute the built artifact; `prebuilt` = execute
  as-is). Byte-identical builds are already proven, making the parity guarantee testable.

### Binding constraints already decided (parent brief Q&A and Updates — not to be re-litigated)

- Explicit, visible parameters everywhere; **no environment variables in any new code**; required
  with **no defaults** — omission is a loud error (Update 2, Q7).
- Names fixed: `build-mode` = `build-first` | `prebuilt` (Q7); `ahq-package-root` /
  `ahqPackageRoot` (Q9).
- The AI may *see* the build-mode value but never interprets or branches on it (Q8 human answer).
- Strangler pattern (Q10): new code reads only explicit parameters; entry points dual-write the
  env var; legacy readers untouched until AHQ-200's isolated zero-change refactor.
- Packing is `pnpm pack` (AHQ-196 Finding 3). Note for the Planner: once the staged tree's
  manifest is literal (no overrides), the pnpm-only *override* dependency disappears, but
  `publishConfig.executableFiles` remains pnpm-specific — exact paths only, globs silently ignored
  (spike-proven, pnpm 11).

### Expected staged-release-tree shape (from the parent brief addendum; details are the Planner's)

The build assembles exactly-what-ships into a staging directory (e.g. `release/`): compiled CLI
JS, compiled workflow JS, the shipped plugins tree, the bin wrapper and the runner — with a single
generated manifest at its root (generated from the root `package.json`:
name/version/dependencies/engines/postinstall — one source of truth, transformed, never
hand-maintained — with the prebuilt `bin` and compiled-JS `exports` written in directly, and
shipped-`.sh` `publishConfig.executableFiles` exact paths enumerated by the staging step). Packing
runs from the staged tree, retiring the publishConfig override dance and the `files` whitelist
(structurally eliminating the leak class). AHQ-196's outcome-asserting tests make it a provable
no-behaviour-change refactor; no second tracer spike is needed.

### Open decisions deliberately left to the Planner (recorded, not asked now)

- Dev-mode (`build-first`) execution root: repo checkout vs the built package image/staged tree —
  parent-brief Q9 explicitly parked this; strict parity leans toward the staged tree.
- Whether, in `build-first` mode, the **CLI process itself** (today launched via tsx by the dev
  bin wrapper `bin/agentic-hq.cjs`) also runs from the built artifact like the workflow programs
  do. Human Prompt UPDATE 2's stated rationale for parity — preventing two different ways of
  running code — leans toward yes; the cost is a build on dev CLI startup. Planner to decide with
  that principle recorded.
- Staging directory name/location, and the pack mechanism (`cd` + `pnpm pack` vs
  `publishConfig.directory`).
- Postinstall chmod: replaced by `executableFiles` or kept as backup (parent brief: Planner
  decision; the every-shipped-script-is-executable e2e assertion stays either way).
- Whether `build-first` always does a clean build (the simple way to also retire the
  silent-stale-`dist/` risk from AHQ-196 review row 1).

## Dummies Guide To Staged Release Tree

As requested in the Human Prompt, a plain-English explainer — written for a reader not familiar
with JavaScript/TypeScript builds — lives at:

**`docs/tickets/AHQ-197/workflow-files/supporting-docs/dummies-guide-to-staged-release-tree-idea.md`**
([relative link](supporting-docs/dummies-guide-to-staged-release-tree-idea.md))

It covers: the three background facts you need (TypeScript→JavaScript compilation, what an npm
package/manifest actually is, and nearest-manifest import resolution); why one working tree
serving two audiences forced AHQ-196's four "sticking plasters"; the packing-table analogy for the
staged release tree; a table of which plaster each part retires and why; what does *not* change
(contributor dev loop, behaviour); and how this relates to the deferred AHQ-203 nested-packages
end-state. Reading it before answering Question 1 below is recommended.

## Web/Perplexity Research

No new external research was required: this ticket's designated external inputs are the two
Perplexity reviews already performed during AHQ-196
(`01-perplexity-q-and-a-about-plan.md` and `02-perplexity-q-and-a-about-dist-package-json.md`,
both under `docs/tickets/AHQ-196/workflow-files/02-implementation-plan-supporting-docs/perplexity-questions/`),
which were re-read in full as the parent brief's AHQ-197 addendum mandates; local code and ticket
documents answered everything else.

## Questions And Answers

### Question 1

**Question:** This is the confirmation gate the parent brief requires ("confirms (or amends) the
staged-release-tree design … with the human before any build-pipeline code is written"): do you
confirm the staged-release-tree design as recorded in the parent brief's 2026-08-08 addendum and
summarised above in Research Findings → "Expected staged-release-tree shape", with the listed open
details left to the Planner?

**AI Recommendation:** Confirm. The design is the Perplexity review's "Option B", chosen over
nested packages (deferred to AHQ-203) with you on 2026-08-08; re-reading both Perplexity reviews
and AHQ-196's findings for this stage surfaced nothing that undermines it, and AHQ-196's
outcome-asserting tests make it a provable no-behaviour-change refactor. (Reading the Dummies
Guide first may help — it explains in plain English exactly what you would be confirming.)

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 2

**Question:** Sequencing within AHQ-197: should the Planner structure the work as two phases —
Phase 1: the staged-release-tree restructure as an isolated no-behaviour-change refactor (AHQ-196's
tests re-pointed and green before anything else changes), then Phase 2: the
build-mode/ahq-package-root parameter chain built on the settled layout?

**AI Recommendation:** Yes. It honours the isolated-refactor principle you set for this feature
(the same instinct behind AHQ-200), gives the parameter chain a stable layout to target (the
runner invocation and SKILL.md paths depend on where the artifact lives), and makes any Phase 1
breakage unambiguously the restructure's fault.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

## Relevant Files Reviewed

Ordered by decreasing relevance (pointers for the Planner):

- `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md` — parent brief and source of truth; its 2026-08-08 addendum defines this ticket's expanded scope and expected design shape.
- `docs/tickets/AHQ-196/workflow-files/02-implementation-plan-supporting-docs/perplexity-questions/02-perplexity-q-and-a-about-dist-package-json.md` — the second Perplexity review whose "Option B" is the staged-release-tree design confirmed in Question 1.
- `docs/tickets/AHQ-196/workflow-files/03-implementation-summary.md` — Findings For Later Sub-Tasks 1–8: resolution mechanism, determinism, pnpm-pack caveats, the executableFiles exact-paths spike.
- `docs/tickets/AHQ-196/workflow-files/04-review-summary.md` — the deferred-risk rows this ticket owns (notably the stale-`dist/` dev seam).
- `package.json` — build script, `files` whitelist, `publishConfig` overrides, postinstall chmod (the four interim mechanisms), and the e2e convenience scripts this ticket touches.
- `scripts/run-workflow.cjs` — the shared runner: terminus of the parameter chain, gains `build-mode`.
- `bin/agentic-hq.cjs` and `bin/agentic-hq-prebuilt.cjs` — the two entry points where the build-mode literals bake in and the env-var dual-write lives.
- `scripts/dist-package.json` — the generated dist-manifest template the staged tree retires.
- `tsconfig.build.json` — the emit config the staged-tree build extends.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/SKILL.md` — the launch template that switches from `$AGENTIC_HQ_WORKSPACE_ROOT` to relayed explicit parameters.
- `src/cli/main.ts` and `src/cli/app.ts` — the zero-parameter `app.run()` seam where the explicit parameters enter the TypeScript.
- `src/kernel/composition-root.ts` — wiring point that must carry `ahqPackageRoot` explicitly (legacy `AhqWorkspaceImpl` env read stays untouched).
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` — where the opaque pass-through crosses the Claude/skill hop.

## Acceptance Criteria

- The tarball is produced from a staged release tree with a single generated manifest — no
  pack-time bin/exports overrides, no `files` whitelist, no nested `dist/package.json` — and
  contains only intended files (io-files/test-plugin/dev-config leak class gone).
- `build-mode` and `ahq-package-root` flow explicitly through the whole chain — no environment
  variables in new code, required with no defaults — and the AI relays `build-mode` without
  interpreting it.
- A dev-mode math-workflow run automatically builds and executes byte-identical JS to the shipped
  artifact; the stale-`dist/` risk and the e2e script's manual `pnpm build && ` prefix are gone.
- Legacy env-var readers keep working via entry-point dual-write; the other (unmigrated) workflows'
  behaviour is unchanged.
- The existing safety-net checks pass re-pointed at the new layout: determinism integration test,
  tarball-install e2e, cross-workspace dev-path e2e, and the manual `agentic-hq math` CLI run.





# Build Plan: `birgitta-ousterhout-full-build` workflow (create-workflow Command 02, from-scratch mode)

## Context

The APPROVED spec (`docs/artifacts/workflow-creation-artifacts/agentic-hq-demos-plugin/birgitta-ousterhout-full-build/02a-APPROVED-workflow-spec.md`) defines a 12-command Agentic HQ workflow that builds a whole system from a specification in thin vertical slices — prologue (P1–P2), a runtime-length slice loop (L1–L7), epilogue (E1–E3) — steered by 12 inline APoSD Guides and checked by 18 Böckeler-style Sensors. This plan turns that spec into files. Creation mode is **from-scratch** (no Copy Plan in the spec). The plugin `agentic-hq-demos-plugin` already exists — its manifest is left untouched.

Wording raw material (Guide text, red-flag vocabulary, quotations): doc 14 §6.2/§2 and `supporting-docs/full-jo-research-notes.md` — both already read. **Do-not-read list honoured throughout**: no doc 13, no fable-review doc, nothing under `experiment-handoff/`. Command files carry zero references to AHQ-192 material (self-contained rule).

## Resolved variables

```
agentic-hq-workspace-root-dir = /Users/stevepersonal/dev/agentic-hq/agentic-hq
project-root                  = /Users/stevepersonal/dev/agentic-hq/agentic-hq
plugin-id                     = agentic-hq-demos-plugin
workflow-id                   = birgitta-ousterhout-full-build
workflow-short-id             = full-build
plugin-dir     = {project-root}/.agentic-hq/plugins/agentic-hq-demos-plugin
commands-dir   = {plugin-dir}/commands/birgitta-ousterhout-full-build
skills-dir     = {plugin-dir}/skills/birgitta-ousterhout-full-build
sample-docs    = {skills-dir}/docs/sample-docs
artifacts-dir  = {project-root}/docs/artifacts/workflow-creation-artifacts/agentic-hq-demos-plugin/birgitta-ousterhout-full-build
plan-verbatim-copy-file = {artifacts-dir}/02b-approved-workflow-plan-verbatim-copy.md
```

## Build sequence

1. **Step 0**: copy this plan file verbatim to `{plan-verbatim-copy-file}`.
2. Create `{commands-dir}` with 12 command `.md` files (4a).
3. Create `{skills-dir}/ahq-workflow.json` (4b).
4. Create `{skills-dir}/ts-workflow/src/birgitta-ousterhout-full-build-cli.ts` (4c).
5. Create `{skills-dir}/SKILL.md` (4d).
6. Create `{skills-dir}/ts-workflow/`: `package.json`, `pnpm-workspace.yaml` (copied pattern), `.npmrc` (verbatim copy from math-workflow), `tsconfig.json` (copied) (4e).
7. Create the 6 SAMPLE docs under `{sample-docs}/` (spec: skill-bundled assets; success criterion 1).
8. Plugin manifest: exists → leave untouched, report that (4f).
9. Build summary + AskUserQuestion review gate (Step 5), then command-output.json + self-terminate (Steps 6–7).

No `pnpm install` at build time (SKILL.md installs on first run; scaffold ships `.npmrc` frozen-lockfile with no lockfile — first install generates it).

---

## Shared conventions for all 12 command files

Every file has, in order:

1. **`## Intro To Give The Agent Context`** — identical opening sentence in all 12:
   > The **birgitta-ousterhout-full-build workflow** takes a specification for a whole system and builds that system from nothing to working, tested, documented and locally committed — in thin vertical slices, with no human available at any point — and it is run by the **Agentic HQ framework**, which automates AI command workflows by chaining multiple Claude Code commands together so each agent does its part and hands its work on to the next.

   Then "As the <Agent Name> your responsibility is …", then position/hand-off framing (naming the 12-file chain, that commands 03–09 run once per slice in fresh sessions, who hands what to this agent and who consumes its output), no task instructions, ends instructing the agent to introduce itself in a single sentence. Agent names: 01 Spec Interrogator · 02 Shaper · 03 Slice Scoper · 04 Slice Designer · 05 Check Writer · 06 Implementer · 07 Slice Checker · 08 Refactorer · 09 Slice Committer · 10 Big Reviewer · 11 Big Refactorer · 12 Validator.
2. `command-input-output-files-directory = $0` line.
3. **Step 0a Read Input** — parse from `command-input.json`: `agentic-hq-workspace-root-dir`, `spec-file` (all); `pass-number` (03–09); `loop-exit-reason`, `passes-completed` (12).
4. **Step 0b Establish Variables** — full self-contained chain: parsed inputs; `project-root = (your primary working directory)` (= the built repo); `skills-dir = {agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/birgitta-ousterhout-full-build`; `sample-docs-dir = {skills-dir}/docs/sample-docs`; fixed run-artifact paths under `project-root`: `docs/build-run/requirements-checklist.md`, `docs/build-run/decisions-register.md`, `docs/master-design.md`, `docs/build-run/slice-register.md`, `docs/build-run/sensor-manifest.md`, `docs/build-run/slice-findings/slice-<N>.md`, `docs/build-run/big-review-findings.md`, root `RESULTS.md` (each command lists only the ones it touches).
5. **The no-human-available policy, verbatim** (spec wording) + the stopping rule (record blockage, do the unblocked parts, state what was left undone) + the research licence line: *"may use web research if this workspace grants it; must finish without it"*.
6. **Honesty rule** where the stage measures anything: adjusting the measurement to reach the target is the failure mode under test; a sensor that finds nothing says so and says what it would have caught.
7. Numbered work steps, with the stage's Guides **inline** (operative text drawn from doc 14 §6.2 + one supporting APoSD quotation where it strengthens the instruction; task-agnostic wording — payroll-sanity-test every sentence).
8. **Stage commit step** (every command that changes the built repo): one commit, stage-labelled message (e.g. `slice {N} · design: <slice name> — <what/why>`). Never pushes. Failed/dropped slices stay in history.
9. **Write Output step** — `command-output.json` with the exact `command-output-string` per the spec's per-command table.
10. **Self-Terminate step** — `/agentic-hq-core-plugin:self-termination`.

The DESIGN → CHECK-FAILS → CODE → REFACTOR → VERIFY cycle is named where relevant; **never described as TDD** anywhere.

## The 12 command files (outline each)

**01-p1-spec-interrogation.md** (Spec Interrogator)
- Step 1 = environment self-test, fail fast: (a) `{spec-file}` exists/readable/non-empty; (b) inside a git work tree; (c) `git config user.name`/`user.email` non-empty; (d) clean working tree. On any failure → write output `env_check_failed: <semicolon-separated failed checks>` and self-terminate immediately, no other work. No remote/auth checks (run never pushes).
- Then: read the spec; extract every requirement, constraint and stated pitfall into the numbered requirements checklist (per `SAMPLE-requirements-checklist.md`; each entry cites its spec location; pitfall entries must eventually get an implementation site + runtime evidence step); surface ambiguities/contradictions, resolve under the no-human policy, record each in the decisions register (per `SAMPLE-decisions-register.md`) it creates; create `docs/build-run/`. Checklist = tracking oracle; original spec stays readable by every stage.
- Commit (`prologue · spec interrogation: …`). Output: `Completed`.

**02-p2-rough-shape-and-slice-backlog.md** (Shaper)
- The whiteboard pass: skeletal master design doc (per `SAMPLE-master-design-doc.md`) — major modules only, no interfaces, no detail, nothing about slices not yet undertaken; slice register (per `SAMPLE-slice-register.md`) with ordered, explicitly provisional candidate backlog; slice 1 = walking skeleton with the floor stated: (a) touches every architectural layer named in the rough shape, (b) executes end-to-end for real — one real input to one observable output, no mocked layer boundaries, (c) stands up the complete harness. Functional scope may be trivial. No design for slices 2…N, no commitment to the list.
- Commit. Output: `Completed`.

**03-l1-slice-scope-and-loop-control.md** (Slice Scoper)
- Reads checklist, slice register, master design doc. Verdict logic: `no_more_slices` **only** when every checklist entry is satisfied or explicitly recorded unreachable-with-reason; otherwise scope the next slice into the register (`in-progress`), revising the backlog (add/drop/split/resequence, with reasons — an unchanged backlog is evidence of not paying attention). Failed previous slice → re-scope smaller or drop, recorded; if the dropped slice left the build broken, first act of the pass is `git revert` of its commits, recorded. `run_unsalvageable` permitted only with register record of what is broken, what was tried, why no smaller re-scope can proceed (also the escape if core run artifacts are missing/corrupt).
- **Output = the bare verdict sentinel and nothing else** (`more_slices` / `no_more_slices` / `run_unsalvageable`); everything else to files. Commit.
- Help-doc note (for Command 04 later): natural human review point.

**04-l2-slice-design.md** (Slice Designer)
- Designs this slice's increment only, straight into the master design doc — writing the entry *is* the design work (G5 at system scale). Interfaces first; interface comments before code; may revise existing abstractions. Records the materially different rejected alternative + why (G3), or explicitly "trivial slice — no alternative required". Never designs ahead.
- Guides inline: **G1, G2, G3, G4, G5, G7, G10, G11, G12**. Commit. Output: `Completed`.

**05-l3-failing-check.md** (Check Writer)
- Writes this slice's executable checks first, derived from L2's design (records the design's expectations, does not invent them); runs them; confirms they fail **for the right reason** (compilation error because the module doesn't exist = valid; broken check = not); records observed failure reason in slice register. Stacks without a test framework: any executable check that fails first and passes after. Never called TDD — cycle named as DESIGN → CHECK-FAILS → CODE → REFACTOR → VERIFY.
- Commit. Output: `Completed`.

**06-l4-implementation.md** (Implementer)
- Builds **what L2 designed** — explicitly not the minimum that turns the check green. Runs the checks **and runs the actual system** (checks passing ≠ working). Slice 1 additionally: stand up the harness — detect the real stack; build with warnings-as-errors; static analysis with the size/complexity rule family switched on explicitly (max function/file length, cyclomatic complexity, max arguments — presets leave these off); custom what-to-do failure messages where tooling allows; clone detector if the stack has one; test runner; one runnable check command; write the sensor manifest (per `SAMPLE-sensor-manifest.md`) admitting which sensors exist and which don't. Slice 1 must satisfy the walking-skeleton floor incl. ≥1 genuine end-to-end check.
- Guides inline: **G7, G8, G10, G11**. Commit. Output: `Completed`.

**07-l5-slice-check.md** (Slice Checker)
- Runs computational sensors per sensor manifest: **S1** clean build (warnings-as-errors) · **S2** static analysis incl. size/complexity family · **S3** this slice's checks pass · **S4** regression: every earlier slice's checks · **S5** runs from clean · **S6** idempotence & re-run · **S15** design-it-twice evidence ("trivial slice — no alternative required" is a passing outcome, stated as such) · **S17** design drift vs accretion (**advisory, never a failure**). Computes **S7** coverage delta: which checklist entries this slice newly satisfied; updates their status.
- Writes the remediation-ready findings list to `docs/build-run/slice-findings/slice-<N>.md`: every finding `file:line`/named module + what-to-do + severity; raw tool output summarised never pasted; a sensor that finds nothing says so and says what it would have caught. Commit.
- **Output: `coverage-delta=<n>` and nothing else.**

**08-l6-refactor-and-reconcile.md** (Refactorer)
- Acts on L5's findings in severity order with explicit stopping point + what-was-left recorded; may record **accepted** findings with reasons. Improve the design as a design: if this slice made an existing abstraction wrong, fix the abstraction, don't work around it. **Re-runs checks afterwards (VERIFY)**. Reconciles master design doc with what was actually built; updates slice register entry (planned vs delivered, what sensors caught). Guarded against feedback overload.
- Guides inline: **G2, G6, G9 (strongest wording — load-bearing), G10**. Commit (message summarises what sensors caught + what the refactor changed → pure refactor diff). Output: `Completed`.

**09-l7-slice-commit.md** (Slice Committer)
- Close-out: verify working tree clean (anything uncommitted = a stage didn't finish — record in register, include in close-out commit rather than leave loose). Mark slice `done`; close-out commit whose message summarises the slice (what it added, design changes + why, what sensors caught). Governs the built repo only.
- Output: `Completed`.

**10-e1-big-review.md** (Big Reviewer)
- Whole-system inferential sweep: **S8** module depth & layer abstraction · **S9** change amplification & near-duplicates (pick 3 plausible spec-implied changes; count places that must change together) · **S10** cognitive load & unknown unknowns · **S11** information leakage · **S12** comment quality · **S13** documentation honesty · **S14** design doc fidelity · **S16** naming consistency · **S18** test verification depth (**not optional**; mutation testing where the stack affords it, summarised through a query script; otherwise inferential: sample public behaviours, name **which check fails if this breaks** — no answer is a finding; "executed is not verified"; includes the 100%-coverage/no-unit-tests cautionary case).
- Findings filed in the fourteen red-flag vocabulary (full list inline), severity-ranked, each with citation + what-to-do, to `docs/build-run/big-review-findings.md`. Commit. Output: `Completed`. Help-doc note: natural human review point.

**11-e2-big-refactor.md** (Big Refactorer)
- Acts on E1 top-down by severity; stated stopping point; records what it consciously did not do and why; accepted-with-reason permitted (false positives on legitimate patterns train the next agent to ignore the sensor). Remit is repair, not a spiral of over-engineered refactorings (Ousterhout's moderation quotation inline). **Re-runs the full check suite afterwards.** Final design-doc update; dispositions recorded in the findings doc.
- Guides inline: **G1, G2, G3, G6, G11, G12** (+G10). Commit. Output: `Completed`.

**12-e3-validate-report-commit.md** (Validator)
- Clean-clone validation: `git clone` the built repo **locally** into a temp dir; follow its documented build-and-run path. Self-assessment against the spec's own acceptance criteria, pass/fail per criterion, unmet reported as unmet. Writes `RESULTS.md` (per `SAMPLE-RESULTS.md`): what was built; clean-clone build/run instructions; measured headline results; self-assessment; known gaps and shortcuts; **loop exit reason — prominently if `max_passes_reached` / `no_progress` / `run_unsalvageable`**. Final commit — **no push** (pushing is the operator's post-run step). Runs on every exit path.
- Output: `Completed`.

## The 6 SAMPLE docs (`{sample-docs}/`)

Generic example domain: a small **payroll calculator CLI** (non-network, non-TailCut, matches the spec's own sanity-test domain). Each SAMPLE shows structure with 2–3 example entries + a header comment saying it's a shape template, not content to copy.

1. `SAMPLE-requirements-checklist.md` — numbered entries, spec-location citation, status `open` / `satisfied (slice N)` / `unreachable (reason)`; pitfall entries carry implementation-site + runtime-evidence-step fields.
2. `SAMPLE-decisions-register.md` — decision · alternatives · reason · which stage decided.
3. `SAMPLE-master-design-doc.md` — module sections with interface comments; per-slice design entries incl. rejected alternative + why; visible rule: never describes a slice not yet undertaken.
4. `SAMPLE-slice-register.md` — per slice: planned · delivered · checklist entries satisfied · sensor findings summary · status (`scoped`/`in-progress`/`done`/`failed`/`dropped`/`re-scoped`) · backlog changes with reasons. Current slice = newest `in-progress` entry.
5. `SAMPLE-sensor-manifest.md` — which sensors exist for this stack, how each is run (command), which are absent + why.
6. `SAMPLE-RESULTS.md` — what was built · clean-clone build/run · measured headline results · pass/fail self-assessment vs spec's acceptance criteria · known gaps/shortcuts · loop exit reason.

## ahq-workflow.json (`{skills-dir}/ahq-workflow.json`)

```json
{
  "pluginId": "agentic-hq-demos-plugin",
  "skillId": "birgitta-ousterhout-full-build",
  "shortId": "full-build",
  "description": "Builds a whole system from a specification in thin vertical slices, steered by APoSD Guides and checked by Birgitta Böckeler-style Sensors.",
  "exampleParameters": "-- --spec-file=./docs/spec.md",
  "version": "1.0.0",
  "author": { "name": "Agentic HQ" }
}
```
(`exampleParameters` starts with `-- ` ✓.) Verify valid JSON + all 7 fields after writing.

## TypeScript CLI (`{skills-dir}/ts-workflow/src/birgitta-ousterhout-full-build-cli.ts`)

full-jira pattern extended with a `do…while` loop; imports `Command` (commander) + `DefaultClaudeCodeTool` (agentic-hq); `.name('birgitta-ousterhout-full-build-cli')`.

- **Constants**: the 12 `COMMAND_NN_*` constants exactly as enumerated in the spec (numbering prefixes included).
- **Options**: `--spec-file <path>` default `'./docs/spec.md'`; `--max-passes <n>` default `'40'` — parsed with an explicit integer check that **throws** on NaN/`< 1` (a NaN cap would silently never fire).
- **Helper** `buildVariablesString(workspaceRoot, specFile, extras?)` → `Your variables for use in this command are: agentic-hq-workspace-root-dir=<…> and spec-file=<…>` + ` and pass-number=<n>` / ` and loop-exit-reason=<r> and passes-completed=<n>` as needed.
- **Control flow** — exactly the spec's pseudocode:
  - P1 → output prefix-checked: `startsWith('env_check_failed')` on trimmed output → `throw new Error(fullOutput)` (uncaught).
  - P2.
  - Loop: cap check at top (`while (passes >= maxPasses)`: readline/promises stdin prompt `Limit of {maxPasses} passes hit. Continue another 20? (y/N) `; answer `y` → `maxPasses += 20` and re-check; anything else/Enter → `exitReason='max_passes_reached'`, break outer; **non-TTY stdin → treated as No without prompting**, per "EOF/non-interactive = No").
  - L1 verdict: **exact match on trimmed output** (`===`, never `.includes()` — `no_more_slices` contains `more_slices`); `no_more_slices`/`run_unsalvageable` set exitReason + break; anything else but `more_slices` → throw with full output (uncaught).
  - `passes += 1`; L2→L4; L5 output must match `/^coverage-delta=(\d+)$/` on trimmed output else throw with full output; L6; L7 (pass always completes through commit); delta 0 → `zeroDeltaStreak++`, at 2 → `exitReason='no_progress'`, break; else streak reset.
  - `exitReason !== 'run_unsalvageable'` → E1, E2. **E3 always runs** with `loop-exit-reason` + `passes-completed`.
- No boundary catch anywhere; catastrophic failures throw uncaught with full command output (AHQ convention).

## SKILL.md (`{skills-dir}/SKILL.md`)

math-workflow pattern verbatim structure: `disable-model-invocation: true`; output command = `(cd {skill-base-dir}/ts-workflow && pnpm install && ln -sfn "$AGENTIC_HQ_WORKSPACE_ROOT" node_modules/agentic-hq) && …tsx --tsconfig … src/birgitta-ousterhout-full-build-cli.ts`; the INFO note; self-terminate. (AHQ appends the user's `-- …` passthrough params to this command itself.)

## ts-workflow config files

- `package.json` — name `agentic-hq-demo-birgitta-ousterhout-full-build`, same engines/postinstall-chmod/deps as math (`agentic-hq: link:../../../../../..`, `tsx`, `commander`), script `run:full-build: tsx src/birgitta-ousterhout-full-build-cli.ts`, the TEMPORARY-LOCAL-DEPENDENCY comment block.
- `pnpm-workspace.yaml` — math pattern: `packages: ['.']`, `allowBuilds` (agentic-hq true / node-pty false / esbuild false), `minimumReleaseAge: 10080`, comments intact.
- `.npmrc` — **verbatim copy** of math-workflow's (AHQ-152 frozen-lockfile standard). No lockfile shipped — first install generates it.
- `tsconfig.json` — copy of math-workflow's.

## Plugin manifest

`{plugin-dir}/.claude-plugin/plugin.json` exists → left untouched; report "Plugin already exists; manifest left as-is."

## After the build (Steps 5–7 of Command 02)

1. Build summary: what was built, flat file list grouped (commands / skill files / manifest note / plan copy), APPROVED spec location, the two review directories.
2. AskUserQuestion gate: "Approve And Move To Next 03-run-checks-on-workflow.md Command" vs "Discuss Problems Or Improvements/Changes Identified". Iterate until approved; no output/self-termination while unapproved.
3. On approval: write `command-output.json` = `{"command-output-string": "birgitta-ousterhout-full-build"}`; run `/agentic-hq-core-plugin:self-termination`.

## Verification (within this command)

- `ahq-workflow.json` parsed as JSON; 7 fields present; `exampleParameters` starts `-- `.
- Every CLI `COMMAND_NN_*` path string checked 1:1 against the actual filenames created in `{commands-dir}` (the classic Unknown-skill break).
- Command-file self-containment sweep: grep the new files for `AHQ-192`, `doc 14`, `TailCut`, `TDD` (TDD may appear only in "this is not TDD" phrasing — spec requires the disclaimer), and for un-substituted `{placeholders}`.
- TypeScript syntax check if cheaply possible without installing (no `pnpm install` at build time); otherwise deferred to Command 03 (run-checks), which is the designed verification stage. Full loop exercise against a throwaway spec = success criterion 3, owned by Commands 03/05.

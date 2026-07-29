# Workflow Spec: birgitta-ousterhout-full-build

**Description**: Builds a whole system from a specification in thin vertical slices, steered by APoSD Guides and checked by Birgitta Böckeler-style Sensors.
**Plugin**: agentic-hq-demos-plugin
**Status**: APPROVED

> **Source-of-truth note.** This spec was drafted from the frozen kick-off guidance
> `docs/jira-docs/AHQ-192/14-birgitta-ousterhout-full-build-kick-off-guidance.md` (doc 14). From now on
> **this spec is the source of truth** for the workflow build: changes land here, never back in doc 14, and
> where the two disagree this spec wins. Doc 14 and `docs/jira-docs/AHQ-192/supporting-docs/full-jo-research-notes.md`
> remain **read-only raw material** for wording the command files (Guide quotations, red-flag vocabulary, policy text).
>
> **To the execution agent (Command 02): a do-not-read list applies while building this workflow.** Do NOT read
> `docs/jira-docs/AHQ-192/13-experiment-protocol-and-judging-rubric.md`,
> `docs/jira-docs/AHQ-192/supporting-docs/fable-review-and-recommendations-for-opus-5.md`, or anything under
> `docs/jira-docs/AHQ-192/supporting-docs/experiment-handoff/`. Doc 13 is the frozen measuring instrument for the
> experiment this workflow will be judged by; a workflow built by someone reading the marking scheme measures the
> marking scheme. In the AHQ-192 folder, read only doc 12, doc 14 and `supporting-docs/full-jo-research-notes.md`.

---

## Plugin Metadata

- **plugin-id**: agentic-hq-demos-plugin
- **plugin-dir**: /Users/stevepersonal/dev/agentic-hq/agentic-hq/.agentic-hq/plugins/agentic-hq-demos-plugin
- **plugin-manifest-filename**: /Users/stevepersonal/dev/agentic-hq/agentic-hq/.agentic-hq/plugins/agentic-hq-demos-plugin/.claude-plugin/plugin.json
- **plugin-description**: Demo workflows for Agentic HQ showcasing orchestration capabilities
- **plugin-version**: 0.0.1
- **plugin-author-name**: Agentic HQ

The plugin already exists — Command 02 will leave the existing manifest untouched.

---

## Workflow Metadata

- **workflow-short-id**: full-build
- **exampleParameters**: `-- --spec-file=./docs/spec.md`

These values will be written to `{skills-dir}/ahq-workflow.json` in Command 02.

---

## Variable Flow & Runtime Context

This section makes the variable plumbing of the workflow explicit. Terminology: throughout this spec,
**"the built repo"** means the repository the workflow builds a system into (= `project-root` at runtime),
which is a different repository from the AHQ install and from the repo this spec lives in.

### Roots used

- **`project-root`** — Claude's primary working directory (= the user's `cwd` when they ran `agentic-hq full-build`).
  This is **the built repo**: the (typically empty) repository the system is built into from nothing. All run
  artifacts, code, tests, docs and commits land here.
- **`agentic-hq-workspace-root-dir`** — read by the TS CLI from `AGENTIC_HQ_WORKSPACE_ROOT`. Used to locate the
  skill-bundled SAMPLE templates under `{skills-dir}/docs/sample-docs/` (see below). Propagated to every command.

### Inputs from the environment / CLI

- **Env vars consumed by the TS CLI**: `AGENTIC_HQ_WORKSPACE_ROOT` (required — CLI exits with an error if unset,
  matching `create-workflow-cli.ts`).
- **CLI passthrough parameters**:
  - `--spec-file <path>` — path to the specification of the system to build, relative to `project-root`
    (absolute also accepted). **Default when not passed: `./docs/spec.md`** (decided, doc 14 Q3).
  - `--max-passes <n>` — optional override of the slice loop's hard cap. **Default: 40.** The experiment
    invocation never passes it; it exists so the runaway guard can be exercised in the loop test (AI Q5).

### Skill-bundled assets used at runtime

SAMPLE templates under `{skills-dir}/docs/sample-docs/` — one per run artifact with a fixed shape, so the shape
lives in a template rather than drifting prose (each SAMPLE uses a generic non-network, non-TailCut example
domain, per the task-agnostic constraint):

1. `SAMPLE-requirements-checklist.md` — numbered entries, each citing its spec location, with a status field
   (`open` / `satisfied (slice N)` / `unreachable (reason)`).
2. `SAMPLE-decisions-register.md` — decision, alternatives, reason, which stage decided.
3. `SAMPLE-master-design-doc.md` — the skeletal shape P2 creates; module sections, interface comments,
   per-slice design entries including the rejected alternative (G3).
4. `SAMPLE-slice-register.md` — per slice: planned, delivered, checklist entries satisfied, sensor findings summary,
   status (`scoped` / `in-progress` / `done` / `failed` / `dropped` / `re-scoped`), and any backlog changes with reasons.
5. `SAMPLE-sensor-manifest.md` — which sensors exist for this stack, how each is run, and which are absent with reasons.
6. `SAMPLE-RESULTS.md` — what was built, clean-clone build/run instructions, measured headline results,
   pass/fail self-assessment against the spec's own acceptance criteria, known gaps and shortcuts,
   loop exit reason.

### Runtime artifacts in the built repo (fixed paths)

| Artifact | Path in built repo | Created by | Updated by |
|---|---|---|---|
| Requirements checklist | `docs/build-run/requirements-checklist.md` | P1 | L5 (status changes), L1 (unreachable rulings) |
| Decisions register | `docs/build-run/decisions-register.md` | P1 | every stage that decides anything |
| Master design doc | `docs/master-design.md` | P2 (skeletal) | L2 (design forward one slice), L6 (reconcile), E2 (final update) |
| Slice register | `docs/build-run/slice-register.md` | P2 | L1, L6, L7 |
| Sensor manifest | `docs/build-run/sensor-manifest.md` | L4 of slice 1 (harness standup) | L4/L6 of later slices if sensors are added |
| Slice findings | `docs/build-run/slice-findings/slice-<N>.md` | L5 (per slice) | L6 (dispositions: fixed / accepted-with-reason / left, with reasons) |
| Big Review findings | `docs/build-run/big-review-findings.md` | E1 | E2 (dispositions: fixed / accepted-with-reason / not-done-because) |
| RESULTS.md | `RESULTS.md` (repo root) | E3 | — |

The current slice is **not** a separate file: it is the newest `in-progress` entry in the slice register
(one source of truth; a second artifact would mean a second hand-off to keep true).

### Per-command variable flow

The CLI builds a **fresh input string per invocation** (full-jira pattern). Base string for every command:
`Your variables for use in this command are: agentic-hq-workspace-root-dir=<abs path> and spec-file=<path>`;
loop commands get ` and pass-number=<n>` appended (1-based); E3 gets
` and loop-exit-reason=<reason> and passes-completed=<n>` appended.

| Command | Extra input vars | Output string (parsed by CLI?) | Bundled assets read | Artifacts written (built repo) |
|---|---|---|---|---|
| 01 (P1) | — | **`Completed`, or `env_check_failed: <reasons>` (prefix-checked — fail fast)** | SAMPLEs 1, 2 | requirements checklist; decisions register; `docs/build-run/` dir |
| 02 (P2) | — | `Completed` (ignored) | SAMPLEs 3, 4 | skeletal master design doc; slice register with candidate backlog |
| 03 (L1) | pass-number | **verdict — exactly one of `more_slices` / `no_more_slices` / `run_unsalvageable` (parsed)** | none | slice register (scoped slice, backlog revisions, failed-slice rulings) |
| 04 (L2) | pass-number | `Completed` (ignored) | none | master design doc (this slice's design + rejected alternative) |
| 05 (L3) | pass-number | `Completed` (ignored) | none | failing checks (code); recorded failure reason (slice register) |
| 06 (L4) | pass-number | `Completed` (ignored) | SAMPLE 5 (slice 1 only) | working code; run evidence; sensor manifest (slice 1) |
| 07 (L5) | pass-number | **`coverage-delta=<n>` (parsed)** | none | findings list for L6; checklist status updates |
| 08 (L6) | pass-number | `Completed` (ignored) | none | refactored code; reconciled design doc; updated slice register |
| 09 (L7) | pass-number | `Completed` (ignored) | none | slice marked `done`; close-out commit with the slice summary message |
| 10 (E1) | — | `Completed` (ignored) | none | big-review findings doc |
| 11 (E2) | — | `Completed` (ignored) | none | repaired system; findings dispositions; final design-doc update |
| 12 (E3) | loop-exit-reason, passes-completed | `Completed` (ignored) | SAMPLE 6 | RESULTS.md; final commit (no push) |

Work product always travels in files; the inter-command strings above carry only identity, configuration and
control signals (doc 14 §4.4). **Every command that changes the built repo ends with its stage commit** — see
"Commit cadence" under Workflow Overview.

---

## TypeScript CLI

Command 02 of `create-workflow` will create this at
`{skills-dir}/ts-workflow/src/birgitta-ousterhout-full-build-cli.ts`.

### Pattern to follow

**Custom — the `full-jira-tdd-story-workflow-demo-cli.ts` pattern extended with a `do…while` loop.** full-jira
proves the two ingredients: per-invocation input strings built by a helper, and command output consumed as a
control signal (its lines 55–81 loop over test types discovered at runtime). This CLI does the same with a loop
whose iteration count is unknown up front: L1's verdict decides whether the loop body runs again. Broadcast
(`create-workflow` pattern) is wrong here because the loop-control command's output is data the CLI must parse.

### Env vars consumed

`AGENTIC_HQ_WORKSPACE_ROOT` (required — CLI exits with a clear error if unset).

### CLI passthrough parameters

`--spec-file <path>`, default `./docs/spec.md`; `--max-passes <n>`, default `40` (AI Question 5: agreed —
exists so the runaway guard can be observed firing in the loop test; the experiment invocation never passes
it). Both are Commander `.option()` defaults — the CLI never asks.

### Command invocation order

Prologue (once): `01-p1-spec-interrogation` → `02-p2-rough-shape-and-slice-backlog`.
Loop (once per slice, in fresh sessions every pass): `03-l1` → `04-l2` → `05-l3` → `06-l4` → `07-l5` → `08-l6` → `09-l7`.
Epilogue (once): `10-e1-big-review` → `11-e2-big-refactor` → `12-e3-validate-report-commit`.
Total invocations: 2 + 7N + 3 (12 command files; the seven-stage loop body stands as written — doc 14 Q2).

### Control flow (the part the workflow exists for — exact contract)

```
MAX_PASSES = --max-passes ?? 40       // runaway guard, not a target; CLI option per AI Q5, default 40 (Steve)
NO_PROGRESS_LIMIT = 2                 // consecutive zero-delta passes that end the loop

p1out = execute(01_P1, base)          // base = workspace-root + spec-file
if p1out.trim() starts with 'env_check_failed': throw Error(p1out)   // fail fast — env self-test failed
execute(02_P2, base)

passes = 0; zeroDeltaStreak = 0; exitReason = null
loop:
  if passes >= MAX_PASSES:
      answer = prompt("Limit of {MAX_PASSES} passes hit. Continue another 20? (y/N) ")  // stdin; default No
      if answer is 'y':               MAX_PASSES += 20        // repeatable — asks again at the new cap
      else:                           exitReason = 'max_passes_reached'; break
  verdict = execute(03_L1, base + pass-number).trim()
  if verdict == 'no_more_slices':     exitReason = 'no_more_slices'; break
  if verdict == 'run_unsalvageable':  exitReason = 'run_unsalvageable'; break   // see AI Question 4
  if verdict != 'more_slices':        throw Error (unrecognised verdict — full output in message, uncaught)
  passes += 1
  execute(04_L2 … 06_L4, base + pass-number)
  l5out = execute(07_L5, base + pass-number)
  delta = parse integer from 'coverage-delta=<n>' in l5out   // unparseable → throw, uncaught
  execute(08_L6, base + pass-number)
  execute(09_L7, base + pass-number)                          // the pass always completes through commit
  if delta == 0: zeroDeltaStreak += 1
                 if zeroDeltaStreak >= NO_PROGRESS_LIMIT: exitReason = 'no_progress'; break
  else:          zeroDeltaStreak = 0

if exitReason != 'run_unsalvageable':  execute(10_E1, base); execute(11_E2, base)
execute(12_E3, base + loop-exit-reason + passes-completed)     // E3 ALWAYS runs — an honest RESULTS.md and
                                                               // the final local commit happen on every exit path
```

Contract details, all deterministic in TypeScript (doc 14 §4.4 — loop bounds and stop conditions never live in
a prompt):

- **P1's output is prefix-checked for `env_check_failed`** — the fail-fast gate: a broken environment (missing
  spec file, no git repo, no git identity, dirty tree) costs seconds, not a half-run of tokens. Any other P1
  output means the environment passed.
- **Verdict parsing is exact-match on the trimmed output string.** Never substring matching:
  `"no_more_slices".includes("more_slices")` is `true`, so `.includes()` would read every stop as a continue.
  L1's command file instructs: the output string is the bare sentinel and nothing else; everything else L1
  produces goes to files.
- **`coverage-delta=<n>`** is L5's count of requirements-checklist entries newly satisfied by this slice
  (sensor S7). The CLI tracks it; two consecutive zero-delta passes end the loop after the in-flight pass
  completes L7 — so no-progress never leaves an uncommitted slice behind.
- **Unrecognised verdict / unparseable delta → throw with the full command output in the message, uncaught**
  (AHQ convention: catastrophic failures print the full stack trace as the bug report; no boundary catch,
  no logging system).
- **At the cap the CLI asks, in the terminal: `Limit of N passes hit. Continue another 20? (y/N)`** — `y`
  extends the cap by 20 and the loop carries on (asked again at the new cap); anything else, Enter, or
  EOF/non-interactive stdin means No. This is the one deliberate human touch-point, and it lives in the
  **TypeScript between stages**, so every Claude stage remains fully unattended. If nobody is at the keyboard,
  the worst case is the epilogue waits for the answer — every completed slice is already committed, so nothing
  is lost (Steve's requirement: never lose a 12-hour run to the cap).
- **`max_passes_reached` is loud, never silent**: the exit reason is passed to E3, whose command file requires
  RESULTS.md to state it prominently — a silent truncation reads as completion (doc 14 §5.2, §4.6).

### Initial input string passed to Command 01

```
Your variables for use in this command are: agentic-hq-workspace-root-dir=${agenticHqWorkspaceRoot} and spec-file=${specFile}
```

### Output handling

**Hybrid, per command** (see the per-command table above): outputs of 01 (env-check verdict, prefix-checked),
03 (verdict, exact-matched) and 07 (coverage-delta, integer-parsed) are control signals; all other outputs are
ignored (`Completed` by convention). Inputs are rebuilt fresh per invocation by a
`buildVariablesString(...)`-style helper, as in full-jira.

### Command name constants

```typescript
const COMMAND_01_P1_SPEC_INTERROGATION =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:01-p1-spec-interrogation';
const COMMAND_02_P2_ROUGH_SHAPE_AND_SLICE_BACKLOG =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:02-p2-rough-shape-and-slice-backlog';
const COMMAND_03_L1_SLICE_SCOPE_AND_LOOP_CONTROL =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:03-l1-slice-scope-and-loop-control';
const COMMAND_04_L2_SLICE_DESIGN =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:04-l2-slice-design';
const COMMAND_05_L3_FAILING_CHECK =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:05-l3-failing-check';
const COMMAND_06_L4_IMPLEMENTATION =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:06-l4-implementation';
const COMMAND_07_L5_SLICE_CHECK =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:07-l5-slice-check';
const COMMAND_08_L6_REFACTOR_AND_RECONCILE =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:08-l6-refactor-and-reconcile';
const COMMAND_09_L7_SLICE_COMMIT =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:09-l7-slice-commit';
const COMMAND_10_E1_BIG_REVIEW =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:10-e1-big-review';
const COMMAND_11_E2_BIG_REFACTOR =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:11-e2-big-refactor';
const COMMAND_12_E3_VALIDATE_REPORT_COMMIT =
  '/agentic-hq-demos-plugin:birgitta-ousterhout-full-build:12-e3-validate-report-commit';
```

---

## Workflow Overview

`birgitta-ousterhout-full-build` takes a specification for a whole system and builds that system from nothing to
working, tested, documented and fully committed, in a single fully-automated run with no human available at any
point (pushing is the operator's post-run step — see Commit cadence below). It
builds in thin vertical slices — a short prologue (spec interrogation, rough shape, provisional slice backlog),
then a runtime-length slice loop (scope → design → failing check → implement → check → refactor → commit, one
commit per slice), then a whole-system big review, big refactor and final validate/report/push. Its
distinguishing content is a harness in Birgitta Böckeler's sense: twelve named **Guides** (G1–G12, drawn from
John Ousterhout's *A Philosophy of Software Design*) steer each stage before it acts, and eighteen named
**Sensors** (S1–S18) check the work after it exists and drive self-correction.

**The cycle is DESIGN → CHECK-FAILS → CODE → REFACTOR → VERIFY. This is not TDD and must never be described as
TDD** — in any command file, in this spec, or in anything the built system's docs say about its own process. The
design drives the development: L2 designs the whole slice against the Guides before any check exists, and L4
builds what L2 designed, not the minimum that turns a check green. The failing check stays on the narrower
ground that a check never observed failing is not yet evidence — which matters when one unattended process
writes both the code and the checks (doc 14 §2.3, §5.4, Q5).

### Hard constraints (all six inherited from doc 14 §4 — restated here because this spec is now the source of truth)

1. **Task-agnostic.** No content from any particular target system anywhere in the workflow — no domain terms,
   no named pitfalls, no example values from the experiment's benchmark task. Sanity test for every command-file
   sentence: *would this still make sense pointed at a spec for a payroll system?* The legitimate generic form
   is wanted: "extract every constraint and stated pitfall from the spec into an explicit checklist, and verify
   each entry has an implementation site and a runtime evidence step."
2. **Fully unattended, end to end.** Every stage finishes without asking anything. The no-human-available policy
   (below) appears in every command file.
3. **No Jira/Confluence/ticket dependency.** No stage requires a ticket or stalls trying to create one.
4. **Runs on AHQ mechanics as they are.** Fresh session per command; hand-off by file; small inter-command
   strings; loop bounds in TypeScript; every command self-terminates via
   `/agentic-hq-core-plugin:self-termination`; **every command file is fully self-contained** — no references to
   this spec, to doc 14, or to any AHQ-192 material.
5. **Fixed tool grant.** Sensors must be things `Bash` can run or things a Claude session can judge by reading.
   The workflow **may use** web research where a workspace happens to grant it, but **no stage may require it**
   to finish — and no sensor may depend on the network.
6. **Honest by construction.** Unmet targets are reported as unmet — every measuring stage is told that adjusting
   the measurement to reach the target is the failure mode under test. A sensor that finds nothing says so and
   says what it would have caught. A silent pass is indistinguishable from a sensor that never ran.

### The no-human-available policy (verbatim, in every command file)

> There is no human available at any point in this run. Do not ask questions and do not wait for approval.
> Wherever you would normally ask, choose the option you would have recommended, write the decision and its
> reason into the decisions register, and continue.

Plus the stopping rule: a stage that cannot finish records the blockage, does the parts that are not blocked,
and states plainly what was left undone. HITL is out of scope for this build, but each stage's help doc marks
where a human review point would naturally go (L1's verdict and E1's findings are the obvious two).

Each command file's preamble also carries the research licence (AI Q2): *"may use web research if this
workspace grants it; must finish without it"* — a licence any stage has, never a requirement, and there is no
dedicated research stage.

### Commit cadence — the history is a deliverable

**Every stage that changes the built repo ends by committing its own work** (local commits only — the run never
pushes; see Decisions Taken):

- **Prologue**: P1 (checklist + registers), P2 (skeletal design doc + slice backlog).
- **Per slice**: L1 (scope), L2 (design), L3 (failing checks, observed failing), L4 (implementation), L5 (sensor
  findings + checklist statuses), L6 (refactor + reconciled design doc), L7 (close-out).
- **Epilogue**: E1 (big-review findings), E2 (big refactor), E3 (RESULTS.md, the final commit).

Why per-stage rather than per-slice (supersedes doc 14 §5.7 — Steve's decision, this session): the boundaries
make the interesting diffs **pure**. Each slice's L5→L6 diff is exactly what the refactoring agent did with the
sensors' findings, and the E1→E2 diff is the same at system scale — the power of the refactor stages becomes
directly visible in `git log`, and design-before-code is visible per slice (L2's commit precedes L3's). One
commit per stage, not fifty micro-commits within one — doc 14's legibility caution still applies inside a stage.

**Commit messages are part of the product**: stage-labelled and specific, e.g.
`slice 3 · design: <slice name> — <what/why in one line>`. L6's message summarises what the sensors caught and
what the refactor changed; E2's summarises findings fixed / accepted-with-reason / consciously left.

**Failed or dropped slices stay in history** (an honest record); L1 records the drop in the register, and if the
dropped slice left the build broken, the next pass's first act is a `git revert` of its commits, recorded.

### Guides — where each bites (inline in the command files at these stages)

Operative Guide text goes **inline** in each command file at the stage(s) where it bites (doc 14 §6.3: hybrid
leaning heavily on inline — duplication in prompts is much cheaper than a pointer the agent skips). Wording is
drafted in Command 02 from doc 14 §6.2 and the research notes.

| Guide | Bites at |
|---|---|
| G1 · Modules Should Be Deep | L2, E2 |
| G2 · Information Hiding | L2, L6, E2 |
| G3 · Design It Twice | L2, E2 |
| G4 · Define Errors Out Of Existence | L2 |
| G5 · Comments As Design | L2 |
| G6 · General-Purpose Modules Are Deeper | L6, E2 |
| G7 · Choosing Names & Consistency | L2, L4 |
| G8 · Comments Describe What The Code Cannot | L4 |
| G9 · Increments Are Abstractions, Not Features (**load-bearing — strongest wording**) | L6 |
| G10 · Strategic, Not Tactical | every build stage (L2–L6, E2) |
| G11 · Different Layers, Different Abstractions | L2, L4, E2 |
| G12 · Pull Complexity Downward | L2, E2 |

### Sensors — where each runs

- **L5, every slice (computational):** S1 Clean Build · S2 Static Analysis (incl. the size/complexity rule
  family the presets leave off) · S3 This Slice's Checks Pass · S4 Regression (every earlier slice's checks) ·
  S5 Runs From Clean · S6 Idempotence & Re-run · S7 Constraint Coverage Delta (the parsed number) ·
  S15 Design-It-Twice Evidence ("trivial slice — no alternative required" is a passing outcome, stated as such) ·
  S17 Design Drift vs Accretion (**advisory, never a failure**).
- **E1, once (inferential — each finding carries a citation, findings filed in APoSD's fourteen red-flag
  vocabulary):** S8 Module Depth & Layer Abstraction · S9 Change Amplification & Near-Duplicates ·
  S10 Cognitive Load & Unknown Unknowns · S11 Information Leakage · S12 Comment Quality ·
  S13 Documentation Honesty · S14 Design Doc Fidelity · S16 Naming Consistency ·
  S18 Test Verification Depth (**not optional** — the same unattended process writes code and tests and nobody
  reviews either; "executed is not verified").

Sensor output shape (all sensors): every finding carries `file:line` or a named module, what to do about it, and
a severity; raw tool output is summarised, never pasted. L6/E2 may record an **accepted** finding with a reason
(not only fix-or-drop), and both have severity-ordering plus an explicit stopping rule with what-was-left-undone
recorded.

---

## Commands

### Command 01: p1-spec-interrogation
- **File**: `{commands-dir}/01-p1-spec-interrogation.md`
- **Description**: **Step 1 is an environment self-test that fails fast** — before any other work, verify:
  (a) `{spec-file}` exists, is readable and non-empty; (b) the working directory is inside a git work tree;
  (c) git identity is configured (`git config user.name` and `user.email` both non-empty — every stage's
  commits fail without them); (d) the working tree is clean (otherwise stage commits would entangle
  pre-existing changes). Deliberately no remote/auth checks — the run never pushes (see Decisions Taken).
  On any failure: write `command-output.json` with
  `env_check_failed: <semicolon-separated list of failed checks>` and self-terminate immediately, doing no
  interrogation work — the CLI treats that output as fatal, so a doomed run costs seconds, not a half-run.
  Then the real work: reads the spec at `{spec-file}`. Extracts every requirement, constraint and stated pitfall
  into the numbered requirements checklist (each entry cites its spec location; each pitfall entry must
  eventually have both an implementation site and a runtime evidence step). Surfaces ambiguities and
  contradictions and resolves them under the no-human policy, recording each in the decisions register it
  creates. Creates `docs/build-run/`. Later stages treat the checklist as the completeness oracle (it is what
  L1 judges against), while the original spec at `{spec-file}` remains available to every stage — the
  checklist's citations lead straight back to it, so it is never a lossy replacement (AI Q1). May use web
  research if the workspace grants it; must finish without it.
- **Input parameters**: `agentic-hq-workspace-root-dir`, `spec-file`
- **Output parameters**: `Completed`, or `env_check_failed: <reasons>` — parsed by the CLI (fail fast)

### Command 02: p2-rough-shape-and-slice-backlog
- **File**: `{commands-dir}/02-p2-rough-shape-and-slice-backlog.md`
- **Description**: The whiteboard pass. Writes the skeletal master design doc — a rough sketch of the major
  modules, whiteboard-level, **no interfaces, no detail, nothing about slices not yet undertaken** — and the
  slice register with a candidate list of vertical slices: ordered, explicitly provisional, slice 1 identified
  as the walking skeleton. Slice 1's floor (AI Q3, enforced again at L4): (a) touches every architectural layer
  the rough shape names; (b) actually executes end to end — one real input to one observable output through the
  real path, no mocked layer boundaries; (c) stands up the complete harness. Its functional scope may be
  trivial — a walking skeleton that does almost nothing is correct. No full decomposition, no design for slices
  2…N, no commitment to the list.
- **Input parameters**: `agentic-hq-workspace-root-dir`, `spec-file`
- **Output parameters**: `Completed` (unused)

### Command 03: l1-slice-scope-and-loop-control
- **File**: `{commands-dir}/03-l1-slice-scope-and-loop-control.md`
- **Description**: Reads the requirements checklist, slice register and master design doc. Decides against the
  objective oracle: `no_more_slices` **only** when every checklist entry is satisfied or explicitly recorded
  unreachable with a reason — "it feels done" is not a verdict. Otherwise scopes the next slice into the slice
  register (marking it `in-progress`), revising the backlog (add/drop/split/resequence, with reasons) as what
  was learned demands — a backlog that survives unchanged is evidence of not paying attention. Handles a failed
  previous slice by re-scoping it smaller or dropping it, recorded. **The output string is the bare verdict
  sentinel and nothing else**; everything else goes to files.
- **Input parameters**: `agentic-hq-workspace-root-dir`, `spec-file`, `pass-number`
- **Output parameters**: exactly one of `more_slices` / `no_more_slices` / `run_unsalvageable` — parsed by the CLI

### Command 04: l2-slice-design
- **File**: `{commands-dir}/04-l2-slice-design.md`
- **Description**: Designs **this slice's increment only**, against the Guides (G1–G5, G7, G10–G12 inline) —
  interfaces first, errors defined out of existence, interface comments written before code. May revise existing
  abstractions; that is the point. **Writes the design straight into the master design doc** — writing the entry
  *is* how the design gets done (G5 at system scale); a shape that cannot be described cleanly needs changing.
  Records the materially different rejected alternative and why (G3), except where it explicitly records
  "trivial slice — no alternative required". Never designs ahead of this slice.
- **Input parameters**: `agentic-hq-workspace-root-dir`, `spec-file`, `pass-number`
- **Output parameters**: `Completed` (unused)

### Command 05: l3-failing-check
- **File**: `{commands-dir}/05-l3-failing-check.md`
- **Description**: Writes the executable checks for this slice **first**, derived from L2's design (the check
  records the design's expectations, it does not invent them), runs them, and confirms they fail **for the right
  reason** — a compilation error because the module does not exist yet is a valid failure; a check failing
  because the check itself is broken is not. Records the observed failure reason in the slice register. On
  stacks without a test framework the requirement is any executable check that fails first and passes after
  (script, end-to-end assertion). Never describes this as TDD.
- **Input parameters**: `agentic-hq-workspace-root-dir`, `spec-file`, `pass-number`
- **Output parameters**: `Completed` (unused)

### Command 06: l4-implementation
- **File**: `{commands-dir}/06-l4-implementation.md`
- **Description**: Builds **what L2 designed**, scoped to this slice — explicitly *not* the minimum that turns
  the check green (G7, G8, G10, G11 inline). Runs the checks **and runs the actual system** — checks passing is
  not the same as the thing working. **Slice 1 additionally stands up the harness**: detect the real stack,
  build with warnings-as-errors, static analysis with the size/complexity rule family switched on explicitly
  (max function/file length, cyclomatic complexity, max arguments — presets leave these off), custom
  what-to-do-text in failure messages where the tooling allows, a clone detector if the stack has one, a test
  runner, one runnable check command — and writes the sensor manifest admitting which sensors exist and which do
  not. Slice 1 must also satisfy the walking-skeleton floor (AI Q3): every layer touched, real end-to-end
  execution with no mocked boundaries, and at least one genuine end-to-end check among its checks.
- **Input parameters**: `agentic-hq-workspace-root-dir`, `spec-file`, `pass-number`
- **Output parameters**: `Completed` (unused)

### Command 07: l5-slice-check
- **File**: `{commands-dir}/07-l5-slice-check.md`
- **Description**: Runs the computational sensors per the sensor manifest — S1–S6 plus S15 and S17 (advisory) —
  including **every earlier slice's checks** (S4), the regression net that makes incremental building safe.
  Computes S7: which checklist entries this slice newly satisfied, updating their status in the checklist.
  Produces the remediation-ready findings list for L6 (`file:line`, what is wrong, what to do, severity). A
  sensor that finds nothing says so and says what it would have caught.
- **Input parameters**: `agentic-hq-workspace-root-dir`, `spec-file`, `pass-number`
- **Output parameters**: `coverage-delta=<n>` — parsed by the CLI for the no-progress stop

### Command 08: l6-refactor-and-reconcile
- **File**: `{commands-dir}/08-l6-refactor-and-reconcile.md`
- **Description**: Acts on L5's findings in severity order, with an explicit stopping point and what-was-left
  recorded. Improves the design as a design (G2, G6, G9 — strongest wording — G10 inline): if this slice made an
  existing abstraction wrong, fix the abstraction, do not work around it. May record an accepted finding with a
  reason. **Re-runs the checks afterwards** (VERIFY — refactoring breaks things; a cycle ending at REFACTOR does
  not know whether it did). **Reconciles the master design doc with what was actually built** — L2 wrote intent,
  this stage makes it true — and updates the slice register entry (planned vs delivered, what the sensors caught).
- **Input parameters**: `agentic-hq-workspace-root-dir`, `spec-file`, `pass-number`
- **Output parameters**: `Completed` (unused)

### Command 09: l7-slice-commit
- **File**: `{commands-dir}/09-l7-slice-commit.md`
- **Description**: The slice close-out. Verifies the working tree is clean — every stage commits its own work,
  so anything uncommitted here means a stage didn't finish its job: record it in the register and include it in
  the close-out commit rather than leaving it loose. Marks the slice `done` in the register and makes the
  **close-out commit**, whose message summarises the whole slice: what it added, what changed in the design and
  why, what the sensors caught — the per-stage history plus this summary is how `git log` shows the system
  growing. This governs the **built repo only** — AHQ's own only-Steve-commits rule is untouched.
- **Input parameters**: `agentic-hq-workspace-root-dir`, `spec-file`, `pass-number`
- **Output parameters**: `Completed` (unused)

### Command 10: e1-big-review
- **File**: `{commands-dir}/10-e1-big-review.md`
- **Description**: The whole-system inferential sensor sweep — S8–S14, S16, S18 — over properties no single
  slice could see. Findings filed in APoSD's fourteen red-flag vocabulary (Shallow Module, Information Leakage,
  Temporal Decomposition, Overexposure, Pass-Through Method, Repetition, Special-General Mixture, Conjoined
  Methods, Comment Repeats Code, Implementation Documentation Contaminates Interface, Vague Name, Hard To Pick
  Name, Hard To Describe, Nonobvious Code), severity-ranked, each with a citation and a what-to-do. S18 runs
  mutation testing where the stack affords it (summarised through a query script, never pasted raw); otherwise
  inferentially: sample public behaviours and name **which check fails if this breaks** — no answer is a finding.
- **Input parameters**: `agentic-hq-workspace-root-dir`, `spec-file`
- **Output parameters**: `Completed` (unused)

### Command 11: e2-big-refactor
- **File**: `{commands-dir}/11-e2-big-refactor.md`
- **Description**: Acts on E1's findings top-down by severity (G1–G3, G6, G11, G12 inline), with a stated
  stopping point; records what it consciously did not do and why, and may mark findings accepted-with-reason
  (false positives on legitimate patterns train the next agent to ignore the sensor). Guarded against feedback
  overload — the remit is repair, not a spiral of over-engineered refactorings. **Re-runs the full check suite
  afterwards.** Final design-doc update.
- **Input parameters**: `agentic-hq-workspace-root-dir`, `spec-file`
- **Output parameters**: `Completed` (unused)

### Command 12: e3-validate-report-commit
- **File**: `{commands-dir}/12-e3-validate-report-commit.md`
- **Description**: Full clean-clone validation (clone the built repo *locally* into a temp directory and follow
  its documented build-and-run path — catches "works in the agent's directory"; no remote involved).
  Self-assessment against the spec's own acceptance criteria, pass/fail per criterion, unmet reported as unmet.
  Writes `RESULTS.md` (per the SAMPLE): what was built, how to build/run from a clean clone, measured headline
  results, the self-assessment, known gaps and shortcuts, **and the loop exit reason — prominently if it was
  `max_passes_reached`, `no_progress` or `run_unsalvageable`**. Makes the **final commit — no push**: pushing is
  the operator's post-run step, so the run has zero network/auth dependency. Runs on every exit path, including
  unsalvageable runs (an honest report of a failed run is a deliverable; a vanished run is not).
- **Input parameters**: `agentic-hq-workspace-root-dir`, `spec-file`, `loop-exit-reason`, `passes-completed`
- **Output parameters**: `Completed` (unused)

---

## What Success Looks Like

From doc 14 §9, now owned by this spec:

1. The workflow exists under `{plugin-dir}/commands/birgitta-ousterhout-full-build/` and
   `{plugin-dir}/skills/birgitta-ousterhout-full-build/` with `ahq-workflow.json`, `SKILL.md`, the CLI,
   `package.json`, `tsconfig.json`, `.npmrc`, `pnpm-workspace.yaml`, and the six SAMPLE docs.
2. `agentic-hq list` shows it; `agentic-hq full-build` resolves.
3. **The loop actually loops** — exercised against a tiny throwaway spec: the `do…while`, the sentinel parse
   (all three verdicts), the `coverage-delta` parse, the `MAX_PASSES` guard (both answers to its
   continue-prompt), the no-progress stop and the `env_check_failed` fail-fast gate each observed at least
   once. This is the only honest way to know the control flow works before the real run.
4. Each command file stands alone: variables at the top, work in the middle, output written, self-termination at
   the end; the no-human policy and its stage's Guides inline; zero references to AHQ-192 material.
5. Documented like other AHQ workflows: a `00-birgitta-ousterhout-full-build-user-help-doc.md` overview plus
   per-command help docs, each marking where a human review point would naturally go.
6. Smoke-tested as far as the Mac allows (full VM proof is plan step 4.6, outside this build).
7. A run of the workflow produces, in the built repo: a current master design doc, a stage-by-stage commit
   history (design-before-code visible per slice; **pure refactor diffs at L6 every slice and at E2**), and
   `RESULTS.md` at the root — all committed **locally**. Pushing is the operator's deliberate post-run step;
   the run itself has zero network/auth dependency. (Overrides doc 14 §9.7's "committed and pushed" — this
   spec wins.)

---

## Decisions Taken

- **Identity five-tuple** (plugin `agentic-hq-demos-plugin`, workflow-id `birgitta-ousterhout-full-build`,
  short-id `full-build`, the one-sentence description with Birgitta Böckeler's full name, `exampleParameters`
  `-- --spec-file=./docs/spec.md` with `./docs/spec.md` as default) — confirmed by Steve in this session;
  sources: doc 12 Phase 3, doc 14 §1 + Q1 + Q3.
- **Build from scratch, no `--using`** — doc 12 Phase 3: every existing workflow adds a small feature to an
  existing codebase; copy-and-adapt would drag per-feature assumptions in.
- **Stage shape 2 + 7N + 3, twelve command files; seven-stage loop body stands** — doc 14 §5.1 and Q2 (Steve:
  "7 in the loop body is fine. Leave as is.").
- **The cycle is DESIGN → CHECK-FAILS → CODE → REFACTOR → VERIFY and is never called TDD** — doc 14 Q5 (Steve),
  §2.3, §5.4. Carried into every command description above and into all wording Command 02 produces.
- **Walking skeleton stands up the harness inside slice 1** (no separate harness prologue stage) — doc 14 Q4
  (Steve: agree); the stack is real rather than guessed.
- **CLI pattern: full-jira extended with `do…while`; verdicts/deltas parsed; everything else ignored** — doc 14
  §4.4 names full-jira as the pattern the slice loop needs; broadcast can't carry a control signal.
- **Verdict parse is exact-match on trimmed output; L1 outputs the bare sentinel only** — deterministic, and
  `.includes()` is a footgun (`no_more_slices` contains `more_slices`). Slice scope travels in the slice
  register, not the output string (doc 14 §4.4: output strings carry control signals; work product in files).
- **No-progress stop: L5 emits `coverage-delta=<n>` (S7); the CLI ends the loop after 2 consecutive zero-delta
  passes, after the in-flight pass completes L7** — implements doc 14 §5.2's no-progress rule deterministically
  in TypeScript with data from a command output, rather than as prompt advice L1 could talk itself out of.
- **`MAX_PASSES = 40`, overridable via optional `--max-passes <n>`** — doc 14 §5.2 suggested a generous 20;
  Steve raised the default to 40 this session (a real run could just reach 20). Loud in RESULTS.md if hit; the
  override exists to make the guard testable (AI Question 5: agreed).
- **At the cap, the CLI prompts `Continue another 20? (y/N)` on stdin** — Steve, this session: never lose a
  long run to the cap. Default No (Enter/EOF/non-interactive = No → epilogue runs as normal). Lives in the
  TypeScript between stages, so no Claude stage ever waits on a human. Rejected alternatives: silent stop only
  (loses the continuation option) and a P1/P2 re-entry rule enabling continue-by-re-running (Steve: more
  complex than needed).
- **Malformed control outputs throw uncaught with the full command output in the message** — AHQ convention:
  catastrophic workflow-CLI failures are uncaught full-stack-trace bug reports; no boundary catch.
- **E3 always runs, on every exit path** — an honest RESULTS.md and the final local commit are the deliverable
  even for a failed run; E1/E2 are skipped only on `run_unsalvageable` (AI Question 4: agreed).
- **Run-artifact locations in the built repo** as tabled above (`docs/build-run/*`, `docs/master-design.md`,
  root `RESULTS.md`) — RESULTS.md at root is doc 14 §9.7; the rest groups process artifacts away from the
  system's own docs. Current slice = newest `in-progress` register entry, not a separate file (one source of
  truth per artifact, mirroring doc 14 §5.5's one-document argument).
- **Guides delivered inline at the stage where they bite; red flags as E1's finding taxonomy, not 14 more
  sensors** — doc 14 §6.3 (Böckeler: pointers get skipped; duplication in prompts is cheap) and §2.4.
- **Sensor split: S1–S7 + S15 + S17 at L5 (computational, every slice); S8–S14 + S16 + S18 at E1 (inferential,
  once)** — doc 14 §7.3/§7.4; S17 advisory-only; S18 mandatory.
- **`AGENTIC_HQ_WORKSPACE_ROOT` propagated to every command; fixed-shape run artifacts get bundled SAMPLE
  templates under `{skills-dir}/docs/sample-docs/`** — create-workflow's own env-var pattern; a SAMPLE beats
  shape-describing prose that drifts (create-workflow Command 01 Step 1.5). SAMPLEs use a generic example domain
  (task-agnostic constraint).
- **Command filenames carry the stage code** (`03-l1-slice-scope-and-loop-control.md`) — the P/L/E vocabulary is
  the workflow's own (defined in its help docs, self-contained), and it makes file listings and the CLI
  constants self-explanatory.
- **Sensors constrained to Bash-runnable or judgeable-by-reading; web research permitted-never-required;
  no sensor depends on the network** — doc 14 §4.5.
- **Environment self-test at the top of P1, hard-fail-fast** (spec file present/non-empty; inside a git work
  tree; git identity set; clean working tree) with the `env_check_failed:` output prefix-checked by the CLI —
  Steve, this session: a doomed run must cost seconds, not fail half way through.
- **Per-stage commits, not per-slice** — every stage that changes the built repo commits its own work, with
  stage-labelled messages; L7 becomes the slice close-out commit. Steve, this session, superseding doc 14
  §5.7's one-commit-per-slice: the stage boundaries make the L5→L6 and E1→E2 diffs pure refactor diffs, which
  is the visible evidence of what the refactor stages contribute.
- **Local commits only; the run never pushes** — pushing is the operator's post-run step. Steve, this session
  (concurring AI recommendation): deletes the unattended run's entire network/auth failure class (an expired
  `gh` auth at E3 after hours of building; an env check at t=0 cannot prevent mid-run expiry), makes the
  workflow portable to repos with no remote, and costs nothing — doc 12 Phase 6 already verifies pushes before
  any snapshot restore. Overrides doc 14 §9.7; this spec wins.

---

## AI Questions

~~**AI Question 1**: Does P1 rewrite the spec into a form later stages read, or does every stage read the original spec? (doc 14 §5.8)~~

**AI Recommendation**: Both, with distinct roles: the requirements checklist is the **tracking oracle** (numbered entries, statuses, spec-location citations — what L1 judges completeness against), while the original spec at `{spec-file}` stays available and any stage (especially L2/L4) may consult it directly. The checklist is never a lossy replacement — its entries cite spec locations precisely so a stage can follow them back. No stage re-derives the requirement list from scratch.

**Human's Answer**: Agree

**RESOLVED**: Checklist = tracking oracle, original spec stays readable by every stage — folded into Command 01's (P1) description.

---

~~**AI Question 2**: Where does research (web, docs) belong — a stage of its own, or a licence any stage has? (doc 14 §5.8)~~

**AI Recommendation**: A licence any stage has — stated once in each command file's preamble as "may use web research if this workspace grants it; must finish without it" (per hard constraint 5). No dedicated research stage: it would either stall when tools are absent (the default state) or produce a research doc nobody's stage is forced to read. P1 (spec ambiguities) and slice-1 L4 (stack/tooling choices) are where it plausibly pays off, and both already have the licence.

**Human's Answer**: Agree

**RESOLVED**: Research is a licence any stage has, never a requirement; no dedicated research stage — folded into the no-human-available policy section (the licence line every command file's preamble carries).

---

~~**AI Question 3**: How thin is slice 1 (the walking skeleton) allowed to be before it stops proving anything? (doc 14 §5.8)~~

**AI Recommendation**: Floor, written into P2's and L4's command files: slice 1 must (a) touch **every architectural layer** the rough shape names, (b) **actually execute end to end** — one real input produces one observable output through the real path, no mocked layer boundaries, and (c) stand up the **complete harness** (build, static analysis, test runner, one runnable check command, sensor manifest). Its functional scope may be trivial — a walking skeleton that does almost nothing is correct — but none of (a)–(c) may be skipped, and its checks must include at least one genuine end-to-end assertion.

**Human's Answer**: Agree

**RESOLVED**: Slice-1 floor (every layer touched; real end-to-end execution, no mocked boundaries; complete harness; at least one genuine end-to-end check) — folded into Command 02's (P2) and Command 06's (L4) descriptions.

---

~~**AI Question 4**: Should L1 be allowed to declare the run unsalvageable and stop cleanly, rather than pushing a broken system through the epilogue? (doc 14 §5.8)~~

**AI Recommendation**: Yes — third verdict sentinel `run_unsalvageable`, permitted only when L1 records in the register **what is broken, what was tried, and why no smaller re-scope can proceed**. The CLI then skips E1/E2 (reviewing and refactoring a corpse wastes the run's remaining budget) but **always runs E3**, so even an unsalvageable run ends with an honest RESULTS.md, a final commit and a push. The alternative — no such verdict — risks a confused loop burning all 20 passes on a doomed build and is exactly the "neither finishes nor admits it" failure §8 warns about.

**Human's Answer**: Agree

**RESOLVED**: `run_unsalvageable` is a permitted third verdict; CLI skips E1/E2 but always runs E3 — already wired through the CLI control flow, Command 03's (L1) description and the Decisions list.

---

~~**AI Question 5**: Should the CLI take an optional `--max-passes <n>` passthrough parameter (default 20)?~~

**AI Recommendation**: Yes. Success criterion 3 requires the `MAX_PASSES` guard to be *observed firing* at least once, and with the cap hardcoded the only way to see that is a 20-pass run; `--max-passes=1` against a throwaway spec proves it in minutes. It's optional with a default, so `exampleParameters` and the experiment invocation stay exactly `-- --spec-file=./docs/spec.md` (doc 14 Q3's single self-documenting line is untouched — the experiment never passes it).

**Human's Answer**: Agree

**RESOLVED**: Optional `--max-passes <n>` passthrough added — folded into the CLI passthrough parameters and control-flow pseudocode; `exampleParameters` unchanged. Default subsequently raised from 20 to 40 by Steve (see Decisions Taken).

---

## Human Additions

> Add any ad-hoc points, requirements, corrections, or clarifications here that don't fit cleanly under another section — the AI will read these and fold them into the spec.

_(No human additions yet. Human: add bullets below this line as needed.)_

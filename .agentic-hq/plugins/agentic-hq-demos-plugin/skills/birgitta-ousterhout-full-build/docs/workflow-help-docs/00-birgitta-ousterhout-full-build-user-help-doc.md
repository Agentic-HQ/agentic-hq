# Birgitta-Ousterhout Full Build Workflow — User Help

This is the main user help doc for the **birgitta-ousterhout-full-build** workflow. It explains what
the workflow is for, how it's structured, and what it produces — the things worth understanding before
you start it (or while a run is in flight). Each of the twelve stages also has its own help doc, linked
below. Open any of these in a Markdown-friendly viewer (e.g. VS Code).

- **Description**: Builds a whole system from a specification in thin vertical slices, steered by APoSD
  Guides and checked by Birgitta Böckeler-style Sensors.
- **Version**: 1.0.0 · **Author**: Agentic HQ · **CLI short alias**: `full-build`

**The stage docs:**

- [01 — P1 · Spec Interrogation (Spec Interrogator)](01-p1-spec-interrogation-help-doc.md)
- [02 — P2 · Rough Shape & Slice Backlog (Shaper)](02-p2-rough-shape-and-slice-backlog-help-doc.md)
- [03 — L1 · Slice Scope & Loop Control (Slice Scoper)](03-l1-slice-scope-and-loop-control-help-doc.md)
- [04 — L2 · Slice Design (Slice Designer)](04-l2-slice-design-help-doc.md)
- [05 — L3 · Failing Check (Check Writer)](05-l3-failing-check-help-doc.md)
- [06 — L4 · Implementation (Implementer)](06-l4-implementation-help-doc.md)
- [07 — L5 · Slice Check (Slice Checker)](07-l5-slice-check-help-doc.md)
- [08 — L6 · Refactor & Reconcile (Refactorer)](08-l6-refactor-and-reconcile-help-doc.md)
- [09 — L7 · Slice Commit (Slice Committer)](09-l7-slice-commit-help-doc.md)
- [10 — E1 · Big Review (Big Reviewer)](10-e1-big-review-help-doc.md)
- [11 — E2 · Big Refactor (Big Refactorer)](11-e2-big-refactor-help-doc.md)
- [12 — E3 · Validate, Report & Commit (Validator)](12-e3-validate-report-commit-help-doc.md)

## What This Workflow Does

The **birgitta-ousterhout-full-build** workflow takes a specification for a **whole system** and builds
that system **from nothing** to working, tested, documented and locally committed — in one
fully-automated run with **no human available at any point**. It is run by the **Agentic HQ framework**,
which automates AI command workflows — chaining multiple Claude Code commands together so each agent
does its part and hands its work on to the next, each in a fresh session whose entire inheritance is
what the previous agents wrote to disk.

It builds in **thin vertical slices**: a short prologue (spec interrogation, rough shape, provisional
slice backlog), then a slice loop whose length is decided at runtime (scope → design → failing check →
implement → check → refactor → commit, once per slice), then a whole-system big review, big refactor,
and a final clean-clone validation and report. The per-slice cycle is
**DESIGN → CHECK-FAILS → CODE → REFACTOR → VERIFY**: the design drives the development — each slice is
designed in full before any check or code exists, and the implementation builds what was designed, not
the minimum that turns a check green. (This is deliberately **not** test-driven development; the failing
check exists on the narrower ground that a check never observed failing is not yet evidence.)

Its distinguishing content is a harness in Birgitta Böckeler's sense: twelve named **Guides** (G1–G12,
drawn from John Ousterhout's *A Philosophy of Software Design*, each with its own guide doc bundled in
the skill) steer each stage **before** it acts, and eighteen named **Sensors** (S1–S18) check the work
**after** it exists and drive self-correction — computational sensors on every slice, inferential
sensors once over the whole system. Honesty is a design constraint throughout: every measuring stage is
told that adjusting the measurement to reach the target is the failure mode under test, and unmet
targets are reported as unmet.

## How To Run It

Run the following from the **root of the repository the system should be built into** (typically a
fresh, empty git repository — this is where all code, docs and commits will land):

```
agentic-hq full-build -- --spec-file=./docs/spec.md
```

- `--spec-file` — path to the specification of the system to build, relative to the directory you run
  from (absolute also accepted). **Default: `./docs/spec.md`** — so if your spec is at that path, plain
  `agentic-hq full-build` works.
- `--max-passes <n>` *(optional)* — hard cap on slice-loop passes. **Default: 40.** This is a runaway
  guard, not a target; you'll rarely need to pass it.

**Before you start**, make sure of the four things the first stage's environment self-test checks (a
failure stops the run in seconds, by design): the spec file exists and is non-empty; you are inside a
git work tree; `git config user.name` and `user.email` are set (every stage commits); and the working
tree is **clean**. There are deliberately no remote or authentication requirements — the run **never
pushes**.

## The Stages

**Prologue** (once):

1. **Spec Interrogator (P1)** — environment self-test (fail fast), then turns the spec into the
   numbered **requirements checklist** (the run's completeness oracle) and the **decisions register**.
2. **Shaper (P2)** — the whiteboard pass: a skeletal **master design doc** (major modules only) and a
   provisional backlog of candidate vertical slices, slice 1 being the **walking skeleton**.

**Slice loop** (once per slice, each stage a fresh session; the orchestrator decides at runtime how many
passes happen):

3. **Slice Scoper (L1)** — judges completeness against the checklist and either scopes the next slice
   or ends the loop. Its verdict is the loop's steering signal.
4. **Slice Designer (L2)** — designs **this slice only**, by writing it into the master design doc.
5. **Check Writer (L3)** — writes the slice's executable checks first and observes them **failing for
   the right reason**.
6. **Implementer (L4)** — builds what was designed; on slice 1 also stands up the full tooling harness
   and the sensor manifest.
7. **Slice Checker (L5)** — runs the computational sensors (S1–S7, S15, S17) and computes the
   **coverage delta** the orchestrator uses to detect a run that has stopped progressing.
8. **Refactorer (L6)** — acts on the findings in severity order, then **reconciles the design doc with
   what was actually built**, and re-runs all checks.
9. **Slice Committer (L7)** — marks the slice done and makes the close-out commit that summarises it.

**Epilogue** (once):

10. **Big Reviewer (E1)** — the whole-system inferential sensor sweep (S8–S14, S16, S18), findings
    filed under APoSD's fourteen red flags.
11. **Big Refactorer (E2)** — repairs the system-scale findings top-down by severity, then re-runs the
    full check suite.
12. **Validator (E3)** — clean-clone validation, honest self-assessment against the spec's own
    acceptance criteria, **RESULTS.md**, and the final local commit. Runs on **every** exit path.

**How the loop ends** — one of four ways, all decided deterministically by the TypeScript orchestrator:
the Slice Scoper rules every checklist entry satisfied or unreachable (`no_more_slices`); two
consecutive passes satisfy nothing new (`no_progress`); the pass cap is hit (`max_passes_reached`); or
the Slice Scoper declares the run unsalvageable (`run_unsalvageable` — the big review and big refactor
are then skipped, but the Validator still runs). Whatever the exit reason, RESULTS.md states it.

## Your Touch-Points

This workflow is **fully unattended**: no stage asks you anything or waits for approval. Every stage
carries the no-human-available policy — wherever it would normally ask, it chooses the option it would
have recommended and records the decision and reason in the decisions register.

The **one** interactive moment lives in the orchestrator, between stages, not in any AI stage: if the
run hits the pass cap, the terminal asks `Limit of N passes hit. Continue another 20? (y/N)`. Default is
**No** — Enter, any other answer, or nobody being at the keyboard all decline, and the epilogue runs as
normal. Nothing is lost either way: every completed slice is already committed.

Each stage's help doc also marks **where a human review point would naturally go** if you were adapting
this workflow to include human-in-the-loop gates — the two most natural being the Slice Scoper's verdict
and the Big Reviewer's findings.

## The Files It Produces

Everything lands in the repository you ran from (the "built repo") — the system's own code, checks and
docs, plus these run artifacts at fixed paths:

```text
RESULTS.md                                  (Validator — the run's honest final report)
docs/master-design.md                       (Shaper creates; Slice Designer/Refactorer/Big Refactorer keep true)
docs/build-run/
├── requirements-checklist.md               (Spec Interrogator — the completeness oracle)
├── decisions-register.md                   (every stage that decides anything)
├── slice-register.md                       (the backlog and per-slice story)
├── sensor-manifest.md                      (which sensors exist for this stack, and which don't)
├── slice-findings/slice-<N>.md             (per-slice sensor findings + dispositions)
└── big-review-findings.md                  (whole-system findings + dispositions)
```

**The git history is itself a deliverable.** Every stage that changes the repo makes one stage-labelled
commit, so `git log` shows the system growing: design-before-code visible per slice, and the
refactor-stage diffs (L6 each slice, E2 once) are *pure* records of what the sensors' findings changed.
All commits are **local** — pushing is your deliberate post-run step, so the run has zero network or
auth dependency.

## Customizing This Workflow

If you want a variant — different Guides, extra sensors, or human approval gates at the natural review
points marked in the stage docs — copy it and make it your own:

```
agentic-hq create-workflow -- --using=full-build
```

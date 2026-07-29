# 12 — E3 · Validate, Report & Commit (Validator) — Help

This is the help doc for the **Validator**, the twelfth and last of the twelve agents in the
**birgitta-ousterhout-full-build** workflow (epilogue stage E3). See the
[workflow overview](00-birgitta-ousterhout-full-build-user-help-doc.md) for how the whole run fits
together.

## What This Stage Does

The Validator is the run's **final accounting**, and it runs on **every** exit path — a completed run, a
run that hit its pass cap, a run that stopped progressing, even a run declared unsalvageable — because
an honest report of a failed run is a deliverable, and a vanished run is not. Its honesty rule is the
workflow's in its bluntest form: **unmet targets are reported as unmet**; a RESULTS.md that rounds a
partial result up to a pass is worth less than no report at all.

Its three jobs:

1. **Clean-clone validation.** It `git clone`s the built repo **locally** into a temp directory (no
   remote involved) and follows the repo's *documented* build-and-run path exactly as written — catching
   "works in the agent's directory". A documented step that fails in the clone is a finding; if cheaply
   fixable (a missing doc step, a path assumption) it fixes it, re-validates, and notes the fix. For an
   unsalvageable run the clone may not build at all — it records precisely how far it gets; that record
   is the deliverable.
2. **Self-assessment against the spec's own acceptance criteria.** Pass or fail per criterion, each
   with its evidence — a passing check, an observed run, a measured number.
3. **RESULTS.md** at the repo root, following the bundled SAMPLE's shape: what was built; the exact
   build-and-run commands the clean clone validated; measured headline results (real numbers from real
   runs, not aspirations); the per-criterion pass/fail table; known gaps and shortcuts (drawn from the
   decisions register, the unreachable rulings, and the findings files' left-undone records); and the
   **loop exit reason** after how many passes — stated **prominently at the top** if it was
   `max_passes_reached`, `no_progress` or `run_unsalvageable`, because a silent truncation reads as
   completion.

It ends with the **final local commit — and no push**. Pushing is deliberately the operator's post-run
step: the run has zero network or auth dependency by design.

## What It Reads and Writes

- **Reads**: the spec (its acceptance criteria), the requirements checklist, the slice register, and
  the SAMPLE-RESULTS template; plus the exit reason and pass count handed to it by the orchestrator.
- **Writes**: `RESULTS.md` at the repo root, any cheap doc/path fixes the clean clone exposed, and the
  final stage-labelled local commit (e.g.
  `epilogue · validate & report: <headline> — exit: <reason> after <n> passes`).

## Where It Pauses for the Human

Nowhere — fully unattended. After this stage the run ends.

**Where a human review point would naturally go**: RESULTS.md itself is written to be that review — the
first thing to read after any run. The natural human step that follows is yours already: inspect the
repo and its history, and **push** if and when you choose to.

## What Happens Next

Nothing — the run is over. The built repo holds the system, its docs, its run artifacts, a
stage-by-stage local commit history, and RESULTS.md at the root.

# 03 — L1 · Slice Scope & Loop Control (Slice Scoper) — Help

This is the help doc for the **Slice Scoper**, the third of the twelve agents in the
**birgitta-ousterhout-full-build** workflow, and the first stage of the slice loop (L1) — it runs **once
per pass**, in a fresh session each time. See the
[workflow overview](00-birgitta-ousterhout-full-build-user-help-doc.md) for how the whole run fits
together.

## What This Stage Does

The Slice Scoper makes the loop's **steering decision**. It is the only agent whose output string is a
control signal: the TypeScript orchestrator exact-matches its verdict and decides whether the slice loop
runs again.

Each pass it:

1. **Handles the previous slice's outcome.** If the previous slice failed, it decides whether to
   re-scope it smaller or drop it (recorded, with reasons); if the failure left the build broken, its
   first act is a `git revert` of that slice's commits so the tip is a working system again. Failed
   slices stay in history — the record is honest, never rewritten.
2. **Judges completeness against the requirements checklist.** `no_more_slices` is permitted **only**
   when every entry is `satisfied` or explicitly `unreachable` with a reason a reader would accept —
   "it feels done" is not a verdict, and the stage's honesty rule names the trap directly: marking an
   entry unreachable to make the verdict true is the failure mode under test.
3. **Scopes the next slice** (if the system is incomplete). It first revises the backlog — add, drop,
   split, resequence, each change with its reason; a backlog that survives unchanged is evidence of not
   paying attention — then writes the top slice's scope into the slice register and marks it
   `in-progress`. The newest `in-progress` entry is how every later stage in the pass knows what the
   current slice is; the output string carries no slice content.

The three verdicts: **`more_slices`** (a slice is scoped; the loop runs again), **`no_more_slices`**
(the run moves to the Big Reviewer), and **`run_unsalvageable`** — the escape valve, permitted only when
the register records what is broken, what was tried, and why no smaller re-scope can proceed. On that
verdict the orchestrator skips the big review and big refactor but still runs the Validator, because an
honest report of a failed run is a deliverable.

## What It Reads and Writes

- **Reads**: the requirements checklist, the slice register, the master design doc (and the decisions
  register when recording rulings).
- **Writes**: slice register updates (scoped slice, backlog revisions, failed-slice rulings), any
  reverts, then one stage-labelled local commit. Its `command-output.json` is the bare verdict sentinel
  and nothing else.

## Where It Pauses for the Human

Nowhere — fully unattended.

**Where a human review point would naturally go**: **this is one of the two most natural gates in the
whole workflow.** A human-in-the-loop variant would pause on the verdict and the newly scoped slice —
confirming the completeness ruling (especially any `unreachable` markings) and the slice's scope before
five build stages spend effort on it.

## What Happens Next

On `more_slices`, the **Slice Designer** (stage 04, L2) designs the scoped slice. On `no_more_slices`,
the run moves to the **Big Reviewer** (stage 10, E1). On `run_unsalvageable`, it moves straight to the
**Validator** (stage 12, E3).

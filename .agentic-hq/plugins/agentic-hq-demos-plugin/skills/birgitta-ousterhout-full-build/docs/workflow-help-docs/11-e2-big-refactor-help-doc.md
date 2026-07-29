# 11 — E2 · Big Refactor (Big Refactorer) — Help

This is the help doc for the **Big Refactorer**, the eleventh of the twelve agents in the
**birgitta-ousterhout-full-build** workflow (epilogue stage E2, run once). See the
[workflow overview](00-birgitta-ousterhout-full-build-user-help-doc.md) for how the whole run fits
together.

## What This Stage Does

The Big Refactorer acts on the Big Reviewer's findings **top-down by severity**, repairing the
system-scale design problems no single slice could see. Its remit is **repair** — and the moderation to
stop is as much a part of the job as the fixing.

It reads seven guide docs before touching anything — G1 · Modules Should Be Deep (repairing a Shallow
Module means deepening or merging, never adding another layer), G2 · Information Hiding (repair leakage
by moving the boundary, never by synchronising the copies), G3 · Design It Twice (for any substantial
repair, sketch a materially different second approach first), G6 · General-Purpose Modules Are Deeper
(with the whole system visible, extract where near-duplicates drifted), G10 · Strategic Not Tactical,
G11 · Different Layers Different Abstractions (remove pass-through methods or give them a reason to
exist), G12 · Pull Complexity Downward — plus Ousterhout's own moderation rule, quoted in the command:
every principle taken to its extreme ends in a bad place. The characteristic failure of an automated
refactor stage with nobody to say "enough" is a spiral of over-engineered refactorings, and this stage
is explicitly guarded against it.

Each finding gets a recorded disposition: **fixed** (as a design change — repair the abstraction, don't
silence the symptom), **accepted-with-reason** (an honest acceptance of a deliberate, sound pattern
keeps the sensor credible), or **not-done-because** (the stopping point stated explicitly, so severity
order plus a stated stopping point keep this stage from becoming a rewrite).

It closes with **VERIFY** — the complete check suite re-run, fixing anything that broke — and the
**final design-doc update**, so the master design doc describes the system as it now exists before the
Validator and any later reader inherit it.

## What It Reads and Writes

- **Reads**: `docs/build-run/big-review-findings.md`, the master design doc, and its seven guide docs.
- **Writes**: the repaired code, every finding's disposition in the findings file, the updated design
  doc; then one stage-labelled local commit (e.g.
  `epilogue · big refactor: <x> fixed, <y> accepted, <z> left — <headline>`). Because the Big Reviewer
  committed before it started, **this commit's diff is a pure record of what the big refactor
  contributed** — the system-scale counterpart of each slice's L5→L6 diff.

## Where It Pauses for the Human

Nowhere — fully unattended.

**Where a human review point would naturally go**: over the dispositions and the E1→E2 diff — what was
fixed, what was accepted with a reason, and what was consciously left — the run's last substantive
change before the final report.

## What Happens Next

The **Validator** (stage 12, E3) clean-clone-validates the system and writes the final report. (If the
loop ended `run_unsalvageable`, this stage and the Big Reviewer are skipped and the run goes straight to
the Validator.)

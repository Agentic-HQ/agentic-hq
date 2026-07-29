# 04 — L2 · Slice Design (Slice Designer) — Help

This is the help doc for the **Slice Designer**, the fourth of the twelve agents in the
**birgitta-ousterhout-full-build** workflow (slice-loop stage L2, once per slice in a fresh session).
See the [workflow overview](00-birgitta-ousterhout-full-build-user-help-doc.md) for how the whole run
fits together.

## What This Stage Does

The Slice Designer designs **this slice's increment only** — and it does the designing **by writing it
into the master design doc**. Writing the entry *is* how the design gets done, not a summary written
afterwards: a shape that cannot be described cleanly needs changing. The design it writes drives
everything after it in the pass — the Check Writer derives the slice's checks from it, and the
Implementer builds what it designed, not the minimum that satisfies a check.

Before designing it reads its nine Guides from the skill's bundled guide docs — G1 · Modules Should Be
Deep, G2 · Information Hiding, G3 · Design It Twice, G4 · Define Errors Out Of Existence, G5 · Comments
As Design, G7 · Choosing Names & Consistency, G10 · Strategic Not Tactical, G11 · Different Layers
Different Abstractions, G12 · Pull Complexity Downward — each applied through a stage-specific note in
the command. The later sensor stages judge what it produces against those same documents, so designer
and checker share one definition of every principle.

The rules of the design:

- **Interfaces first.** Each new or changed interface gets its interface comment written **before any
  code exists** — if the comment is hard to write, the interface is wrong (G5).
- **Existing abstractions may be revised — that is the point.** If this slice's needs show an existing
  module's boundary is wrong, the boundary gets redesigned here, not worked around; the doc is updated
  to describe one coherent design, not layers of amendments.
- **The rejected alternative is recorded** (G3): a materially different second approach and why the
  chosen one won — or the explicit ruling "trivial slice — no alternative required".
- **Never design ahead.** Only this slice; the design doc never describes a slice not yet undertaken.

## What It Reads and Writes

- **Reads**: the slice register (the newest `in-progress` entry is the slice), the master design doc,
  the checklist entries the slice targets, the spec where citations lead back to it, and its nine guide
  docs.
- **Writes**: this slice's design entry (and any revised sections) in `docs/master-design.md`; any
  decisions worth recording in the decisions register; then one stage-labelled local commit (e.g.
  `slice {N} · design: <slice name> — <what/why>`).

## Where It Pauses for the Human

Nowhere — fully unattended.

**Where a human review point would naturally go**: over the slice's design entry — interfaces, comments
and the rejected alternative — before any check or code exists. Design review before implementation is
the classic human gate, and this stage's commit is exactly the artifact such a review would read.

## What Happens Next

The **Check Writer** (stage 05, L3) derives the slice's executable checks from the design entry just
written.

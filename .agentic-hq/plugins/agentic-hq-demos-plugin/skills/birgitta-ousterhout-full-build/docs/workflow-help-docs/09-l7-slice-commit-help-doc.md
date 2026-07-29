# 09 — L7 · Slice Commit (Slice Committer) — Help

This is the help doc for the **Slice Committer**, the ninth of the twelve agents in the
**birgitta-ousterhout-full-build** workflow (slice-loop stage L7, once per slice in a fresh session —
the last stage of each pass). See the
[workflow overview](00-birgitta-ousterhout-full-build-user-help-doc.md) for how the whole run fits
together.

## What This Stage Does

The Slice Committer is the slice's **close-out**. In this workflow the git history is a deliverable — a
reader who was not there should be able to run `git log` and watch the system grow slice by slice — and
this stage writes each slice's closing chapter.

It does three things:

1. **Verifies the working tree is clean.** Every stage of the pass commits its own work, so anything
   uncommitted here means a stage did not finish its job. Loose changes are never discarded: it records
   in the slice register what was found and which stage most plausibly left it, and includes the
   changes in the close-out commit.
2. **Marks the slice `done`** in the slice register. By now the entry should tell the slice's whole
   story — planned, delivered, checklist entries satisfied, sensor findings summary, backlog changes —
   and it fills any gap it can see from the artifacts in front of it.
3. **Makes the close-out commit**, whose message summarises the whole slice: what it added, what
   changed in the design and why, and what the sensors caught (e.g.
   `slice {N} · close-out: <slice name> — added <what>; design: <change + why>; sensors caught
   <summary>`). A message reading `wip` would throw away most of the value of having committed at all.

Everything it does governs the built repo only, and — like every stage — the commit is local; the run
never pushes.

## What It Reads and Writes

- **Reads**: the slice's register entry and the slice's findings file.
- **Writes**: the register status change (`in-progress` → `done`) and the close-out commit.

## Where It Pauses for the Human

Nowhere — fully unattended.

**Where a human review point would naturally go**: reading the slice's stretch of `git log` — the
per-stage commits plus this summary are designed to be reviewable as a unit, so an end-of-slice
sign-off would sit here before the next pass begins.

## What Happens Next

The orchestrator either starts the next pass with a fresh **Slice Scoper** (stage 03, L1), or — if this
pass's verdict already ended the loop, or the no-progress rule now fires — moves to the **Big
Reviewer** (stage 10, E1). Either way, the pass always completes through this commit first: no slice is
ever left uncommitted behind.

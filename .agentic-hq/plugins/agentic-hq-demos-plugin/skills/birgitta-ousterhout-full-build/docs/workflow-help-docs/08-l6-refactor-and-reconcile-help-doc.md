# 08 — L6 · Refactor & Reconcile (Refactorer) — Help

This is the help doc for the **Refactorer**, the eighth of the twelve agents in the
**birgitta-ousterhout-full-build** workflow (slice-loop stage L6, once per slice in a fresh session).
See the [workflow overview](00-birgitta-ousterhout-full-build-user-help-doc.md) for how the whole run
fits together.

## What This Stage Does

The Refactorer acts on the Slice Checker's findings **in severity order**, improves the design **as a
design**, and then makes the master design doc true again. This stage is the reason the slice loop is
incremental *design* rather than incremental feature accretion — it is the stage a run under pressure is
most tempted to shortchange, and shortchanging it forfeits the workflow's entire argument for building
in slices.

Its Guides (read from the skill's bundled guide docs) make the remit concrete:

- **G9 · Increments Are Abstractions, Not Features** — the load-bearing Guide of the whole workflow,
  and this is the stage where it lives or dies: if this slice made an existing abstraction wrong, **fix
  the abstraction, don't work around it**.
- **G2 · Information Hiding** — where two modules share knowledge of one decision, move the boundary;
  don't patch both sites.
- **G6 · General-Purpose Modules Are Deeper** — a near-duplicate of something an earlier slice built
  means the second case has revealed the axis of variation: now the shared abstraction gets extracted.
- **G10 · Strategic, Not Tactical** — the run is not being timed; a clean structure beats a patch.

Three dispositions are legitimate for each finding, all recorded in the findings file: **fixed** (as a
design change, not the smallest patch that silences the sensor), **accepted-with-reason** (a false
positive on a deliberate, sound pattern — "fixing" good code trains the next agent to ignore the
sensor), and **left** (with the stopping point stated explicitly — left-undone-and-recorded is honest;
left-undone-and-silent is the failure mode). It also guards against feedback overload: the remit is
repair driven by the findings, not a spiral of speculative refactorings.

Then the two closing duties: **VERIFY** — re-run the full check suite (this slice's and all earlier
slices'), because refactoring breaks things and a cycle that ends at refactor doesn't know whether it
did — and **reconcile**: update the master design doc so it describes the system that actually exists
now, and update the slice register entry (planned vs delivered, what the sensors caught, what the
refactor changed).

## What It Reads and Writes

- **Reads**: the slice findings file, the slice's register entry, the master design doc, and its four
  guide docs.
- **Writes**: the refactored code, finding dispositions in the findings file, the reconciled design
  doc, the updated register entry; then one stage-labelled local commit. Because the Implementer
  committed before the sensors ran, **this commit's diff is a pure record of what the refactor
  contributed** — one of the workflow's showcase artifacts in `git log`.

## Where It Pauses for the Human

Nowhere — fully unattended.

**Where a human review point would naturally go**: over the dispositions — especially anything marked
accepted-with-reason or left — and over the L5→L6 diff itself, which shows exactly what the sensors'
findings bought.

## What Happens Next

The **Slice Committer** (stage 09, L7) closes the slice out.

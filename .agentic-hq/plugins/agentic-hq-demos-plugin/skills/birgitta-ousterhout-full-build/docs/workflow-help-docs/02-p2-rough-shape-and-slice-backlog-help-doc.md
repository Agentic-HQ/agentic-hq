# 02 — P2 · Rough Shape & Slice Backlog (Shaper) — Help

This is the help doc for the **Shaper**, the second of the twelve agents in the
**birgitta-ousterhout-full-build** workflow (prologue stage P2). See the
[workflow overview](00-birgitta-ousterhout-full-build-user-help-doc.md) for how the whole run fits
together.

## What This Stage Does

The Shaper is the **whiteboard pass** — a deliberately rough sketch, and nothing more. It resists the
pull to design everything up front, because an up-front design is written at the moment of least
knowledge: the genuinely hard parts of a spec reveal themselves on contact with code, and later agents
design each slice when they reach it, able to see what earlier slices actually built.

Before shaping, it reads the workflow's **five load-bearing Guides** (G9 · Increments Are Abstractions,
G1 · Modules Should Be Deep, G2 · Information Hiding, G3 · Design It Twice, G10 · Strategic Not
Tactical) from the skill's bundled guide docs — held at whiteboard level, they steer the shape without
licensing detailed design.

It then writes two artifacts:

- **The skeletal master design doc** — the major modules at whiteboard level, a paragraph each.
  Deliberately shallow: no interfaces, no detail, and — the document's absolute rule, established here —
  **nothing about slices not yet undertaken**. That rule is what stops big-design-up-front creeping back
  in through the documentation.
- **The slice register with the candidate backlog** — an ordered, explicitly provisional list of
  **vertical** slices (each a thin end-to-end path a user-visible behaviour travels, never a horizontal
  layer). **Slice 1 is the walking skeleton**, with a fixed floor: it touches every architectural layer
  the rough shape names, it actually executes end to end with no mocked boundaries, and it stands up the
  complete tooling harness. Its functional scope may be trivial — that's correct. Slices 2…N are
  candidate headings only; the Slice Scoper revises the list freely on every pass.

## What It Reads and Writes

- **Reads**: the spec, the requirements checklist, the decisions register, the five load-bearing guide
  docs, and the SAMPLE templates for both artifacts' shapes.
- **Writes**: `docs/master-design.md` (skeletal) and `docs/build-run/slice-register.md` (candidate
  backlog), then one stage-labelled local commit (e.g.
  `prologue · rough shape: <n> major modules, <m> candidate slices`).

## Where It Pauses for the Human

Nowhere — fully unattended; any decision worth recording (a stack choice, a shape ruled out) goes into
the decisions register with its reason.

**Where a human review point would naturally go**: over the rough shape and the candidate backlog —
especially the choice and ordering of slices and whether slice 1's walking-skeleton scope is right. This
is the cheapest moment to steer the build's overall direction.

## What Happens Next

The slice loop begins: the **Slice Scoper** (stage 03, L1) reads the backlog on every pass, revises it
in the light of what the run has learned, and scopes the first slice.

# 10 — E1 · Big Review (Big Reviewer) — Help

This is the help doc for the **Big Reviewer**, the tenth of the twelve agents in the
**birgitta-ousterhout-full-build** workflow (epilogue stage E1, run once, after the slice loop ends).
See the [workflow overview](00-birgitta-ousterhout-full-build-user-help-doc.md) for how the whole run
fits together.

## What This Stage Does

The Big Reviewer is the **whole-system inferential sensor sweep** — the properties no single slice could
see: how far a change propagates, which design decisions ended up known in three places, what a newcomer
must know that is written down nowhere, and whether the tests actually verify anything. It arrives as a
genuinely fresh reader, which is exactly what makes its judgement of obviousness and cognitive load
worth having. It reads the whole repository — the code in front of it, never metrics alone — plus all
twelve bundled guide docs, the design canon the system was built against.

The sensors:

- **S8 · Module Depth & Layer Abstraction** — interface size vs what it hides; wrappers; pass-through
  methods; whether adjacent layers present different abstractions.
- **S9 · Change Amplification & Near-Duplicates** — pick three plausible changes the spec implies and
  count the places each must touch; find near-copies that have started to drift.
- **S10 · Cognitive Load & Unknown Unknowns** — what must someone know to change this system safely
  that is written down nowhere?
- **S11 · Information Leakage** — which design decisions are known in more than one place?
- **S12 · Comment Quality** — comments that repeat code; non-obvious things with no comment; interface
  comments contaminated with implementation detail.
- **S13 · Documentation Honesty** — does the README describe the system that exists? Do stated numbers
  match measured ones?
- **S14 · Design Doc Fidelity** — does the master design doc describe the system that actually exists,
  or the one it was expected to become?
- **S16 · Naming Consistency** — concepts named more than one way; names vague enough that the thing
  named is probably not one thing.
- **S18 · Test Verification Depth** — **not optional**: the same unattended process wrote the code and
  the tests, and nobody reviewed either. Mutation testing where the stack affords it (summarised, never
  pasted raw); otherwise inferential — sample public behaviours and name **which check fails if this
  breaks**; no answer is a finding. Executed is not verified: a coverage figure is evidence a line ran,
  not evidence anything would have failed had it been wrong.

Every finding is filed under one of **APoSD's fourteen red flags** (Shallow Module, Information Leakage,
Temporal Decomposition, Overexposure, Pass-Through Method, Repetition, Special-General Mixture,
Conjoined Methods, Comment Repeats Code, Implementation Documentation Contaminates Interface, Vague
Name, Hard To Pick Name, Hard To Describe, Nonobvious Code) so findings can be counted and compared —
each with a citation, a what-to-do, and a severity, ranked most severe first. Findings against the five
load-bearing Guides (G9, G1, G2, G3, G10) weigh heavier in severity, other things equal. The honesty
rule applies in full: a sensor that finds nothing says so and says what it would have caught — and if
every sensor comes back clean on a system built in one unattended run, that is itself suspicious and
worth saying.

## What It Reads and Writes

- **Reads**: the master design doc, slice register, sensor manifest, requirements checklist, README and
  docs, the code itself, and all twelve guide docs.
- **Writes**: `docs/build-run/big-review-findings.md`, then one stage-labelled local commit (e.g.
  `epilogue · big review: <f> findings across <s> sensors`).

## Where It Pauses for the Human

Nowhere — fully unattended.

**Where a human review point would naturally go**: **this is one of the two most natural gates in the
whole workflow** (with the Slice Scoper's verdict). A human-in-the-loop variant would review the
findings file here — trimming false positives and re-ranking severities — before the Big Refactorer
spends its budget on them.

## What Happens Next

The **Big Refactorer** (stage 11, E2) acts on the findings top-down by severity.

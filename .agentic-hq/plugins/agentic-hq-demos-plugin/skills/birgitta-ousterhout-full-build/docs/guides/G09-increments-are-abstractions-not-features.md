# G9 · Increments Are Abstractions, Not Features

> One of the twelve Guides steering this workflow. The command that sent you here says how it applies at your stage; this document is the Guide's single authoritative definition.

**Load-bearing — one of the five Guides this workflow leans on hardest.** This is the single Guide that separates incremental *design* from feature accretion, and the failure it names is the one this entire workflow was built to prevent.

## The rule

Building in increments is right; letting the increments be *features bolted onto whatever exists* is the trap. Each increment should add or improve an **abstraction**. A slice may — must, when needed — *change* the existing design, not merely add to it: if new work shows an existing abstraction is wrong, fix the abstraction rather than working around it. The standard is unforgiving and clear: after each change, the system should look as if it had been designed from the start with that change in mind. Deferring this, pass after pass, is precisely how an incremental loop degenerates into tactical programming.

## In Ousterhout's words

> "Developing incrementally is generally a good idea, but the increments of development should be abstractions, not features."

> "Ideally, when you have finished with each change, the system will have the structure it would have had if you had designed it from the start with that change in mind."

> "Whenever you modify any code, try to find a way to improve the system design at least a little bit in the process. If you're not making the design better, you are probably making it worse."

## Example

The bonus-pay slice discovers that gross pay is not "hours × rate" after all — it is a *sum of pay components*. The right move reshapes `GrossPay` into a composition of components and migrates the existing overtime code onto the new abstraction. The slice delivered a feature *and* left behind a design the next slice inherits gladly.

## Counterexample

The same slice instead threads a `bonusCents` parameter through every existing signature, because reshaping the abstraction "felt like scope creep". The feature works; the design is now wrong in more places than before the slice started — and the next slice will pay for it, with interest.

## Checked by

**S17 · Design Drift vs Accretion** (slice check, advisory): did this slice modify any existing abstraction, or only add new files? Pure accretion can be legitimate for a genuinely orthogonal slice — the sensor exists so the question is *considered* every pass, never silently skipped.

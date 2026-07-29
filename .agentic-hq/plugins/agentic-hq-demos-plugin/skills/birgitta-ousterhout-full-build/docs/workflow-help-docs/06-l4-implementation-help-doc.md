# 06 — L4 · Implementation (Implementer) — Help

This is the help doc for the **Implementer**, the sixth of the twelve agents in the
**birgitta-ousterhout-full-build** workflow (slice-loop stage L4, once per slice in a fresh session).
See the [workflow overview](00-birgitta-ousterhout-full-build-user-help-doc.md) for how the whole run
fits together.

## What This Stage Does

The Implementer builds **what the Slice Designer designed**, scoped to this slice — explicitly *not*
the minimum that turns the Check Writer's checks green. The design is the specification for this stage;
the checks are the evidence, not the target. If the design proves wrong on contact with the code, it
makes the smallest sound correction, records it in the decisions register, and leaves a note so the
Refactorer reconciles the design doc.

It works under four Guides read from the skill's bundled guide docs — G7 · Choosing Names & Consistency
(use the design doc's names everywhere), G8 · Comments Describe What The Code Cannot, G10 · Strategic
Not Tactical, G11 · Different Layers Different Abstractions — and it finishes by running the checks
**and running the actual system** the way a user would, because checks passing is not the same as the
thing working. What it ran and what it observed goes into the slice register as **run evidence**.

**Slice 1 additionally stands up the harness** that will police every later slice. Having just chosen
the real stack (not one guessed from the spec), it wires up, wherever the stack affords it:

- the build with **warnings-as-errors** at the strictest reasonable setting;
- **static analysis** with the size/complexity rule family switched on explicitly — max function
  length, max file length, cyclomatic complexity, max argument count — the rules presets leave off and
  that target exactly how automated coders fail;
- **custom what-to-do text** in failure messages where the tooling allows;
- a **clone detector** if the stack has a usable one; a **test runner**; and **one runnable check
  command** for the whole suite;
- the **sensor manifest** — an honest record of which sensors exist for this stack, the exact command
  that runs each, and which are absent, with reasons.

Slice 1 must also satisfy the walking-skeleton floor: every architectural layer touched, real
end-to-end execution with no mocked boundaries, and at least one genuine end-to-end check. On later
slices the harness step shrinks to: extend the harness and manifest if the slice introduced a new
language or tool.

## What It Reads and Writes

- **Reads**: the master design doc (this slice's entry), the slice register entry (including the
  recorded failure reasons), the checks themselves, the spec where cited, and its four guide docs.
- **Writes**: the slice's working code; run evidence in the slice register; on slice 1 the harness
  config and `docs/build-run/sensor-manifest.md`; then one stage-labelled local commit (e.g.
  `slice {N} · implement: <slice name> — <what was built>`).

## Where It Pauses for the Human

Nowhere — fully unattended.

**Where a human review point would naturally go**: over the run evidence (did the system observably do
the slice's behaviour, end to end?) — and on slice 1, over the harness configuration and the sensor
manifest, since every later slice's checking depends on what was stood up here.

## What Happens Next

The **Slice Checker** (stage 07, L5) runs the computational sensor suite over what was just built, using
the sensor manifest.

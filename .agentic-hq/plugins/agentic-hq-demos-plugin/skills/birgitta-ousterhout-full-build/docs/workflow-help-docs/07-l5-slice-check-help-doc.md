# 07 — L5 · Slice Check (Slice Checker) — Help

This is the help doc for the **Slice Checker**, the seventh of the twelve agents in the
**birgitta-ousterhout-full-build** workflow (slice-loop stage L5, once per slice in a fresh session).
See the [workflow overview](00-birgitta-ousterhout-full-build-user-help-doc.md) for how the whole run
fits together.

## What This Stage Does

The Slice Checker runs the **computational sensors** over what the Implementer just built and produces
the remediation-ready findings list the Refactorer acts on. It judges; it does not fix — the fixing
belongs to the Refactorer, in a fresh session, so work is never marked by its own author in the same
context.

The sensors, run per the sensor manifest (any the manifest records as absent are noted, never silently
skipped):

- **S1 · Clean Build** — warnings-as-errors at the configured strictness.
- **S2 · Static Analysis** — every configured analyser, including the size/complexity rule family.
- **S3 · This Slice's Checks Pass**.
- **S4 · Regression** — **every earlier slice's checks still pass** — the full suite, not a sample; the
  net that makes incremental building safe.
- **S5 · Runs From Clean** — the documented build-and-run path works from a fresh clone into a temp
  directory, catching "works in the agent's directory".
- **S6 · Idempotence & Re-run** — setup/teardown-style operations survive being run twice.
- **S15 · Design-It-Twice Evidence** — does this slice's design entry record a materially different
  rejected alternative (judged by the G3 guide doc's definition)? The recorded ruling "trivial slice —
  no alternative required" is a *passing* outcome, stated as such.
- **S17 · Design Drift vs Accretion** — did the slice modify any existing abstraction, or only add new
  files? **Advisory, never a failure** — it exists to make the Refactorer consider whether an
  abstraction should have moved (the G9 guide doc is its reference).

It then computes **S7 · Constraint Coverage Delta**: which requirements-checklist entries this slice
**newly satisfied** — evidenced by a passing check or observed runtime behaviour, not "code exists that
looks related" — moving each to `satisfied (slice N)` and filling in pitfall entries' implementation
site and runtime evidence fields. The count of newly satisfied entries is the **coverage delta**, the
one number the orchestrator parses from this stage: two consecutive zero-delta passes end the loop, so
an honest zero matters — the stage's honesty rule says so twice, and every sensor that finds nothing
must say so *and say what it would have caught*.

## What It Reads and Writes

- **Reads**: the sensor manifest, the slice's register entry, the requirements checklist, the master
  design doc, and the G3/G9 guide docs (for S15/S17).
- **Writes**: `docs/build-run/slice-findings/slice-<N>.md` — every finding with a `file:line` or named
  module, what to do about it, and a severity, ranked most severe first, raw tool output summarised
  never pasted — plus the checklist status updates; then one stage-labelled local commit. Its
  `command-output.json` is exactly `coverage-delta=<n>` and nothing else.

## Where It Pauses for the Human

Nowhere — fully unattended.

**Where a human review point would naturally go**: over the findings file and the coverage delta —
checking that the delta is evidenced (no soft "satisfied" markings) and that the severity ranking sends
the Refactorer at the right problems first.

## What Happens Next

The **Refactorer** (stage 08, L6) works the findings file top-down by severity.

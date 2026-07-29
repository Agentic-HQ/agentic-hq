# 01 — P1 · Spec Interrogation (Spec Interrogator) — Help

This is the help doc for the **Spec Interrogator**, the first of the twelve agents in the
**birgitta-ousterhout-full-build** workflow (prologue stage P1). See the
[workflow overview](00-birgitta-ousterhout-full-build-user-help-doc.md) for how the whole run fits
together.

## What This Stage Does

The Spec Interrogator does two jobs: it proves the environment can sustain the run at all, and it turns
the specification into the run's two founding artifacts.

**First, the environment self-test — fail fast.** Before any other work it verifies four things: the
spec file exists, is readable and is non-empty; the working directory is inside a git work tree; git
identity (`user.name` / `user.email`) is configured, because every stage commits; and the working tree
is clean, so stage commits can't entangle pre-existing changes. If any check fails it reports
`env_check_failed` and stops immediately — the orchestrator treats that as fatal, so a doomed run costs
seconds rather than failing hours in. There are deliberately no remote or auth checks: the run never
pushes.

**Then, the interrogation.** It reads the spec in full and extracts **every requirement, constraint and
stated pitfall** into the numbered **requirements checklist**. Every entry cites its spec location and
starts at status `open`; pitfall entries additionally carry two fields to be filled in as the build
progresses — the implementation site and the runtime evidence step. It then goes back through the spec
hunting ambiguities and contradictions, resolves each one under the no-human policy (choose the option
it would have recommended), and records every ruling in the **decisions register** it creates.

The checklist becomes the run's **completeness oracle**: the Slice Scoper judges the whole system
against it on every pass, so a requirement that never became an entry is invisible to every later stage.
It is a tracking layer, never a lossy replacement — its citations lead straight back to the original
spec, which stays readable by every stage.

## What It Reads and Writes

- **Reads**: the spec file (`--spec-file`, default `./docs/spec.md`); the bundled SAMPLE templates for
  the two artifacts' shapes.
- **Writes**: `docs/build-run/requirements-checklist.md` and `docs/build-run/decisions-register.md` in
  the built repo, then one stage-labelled local commit (e.g.
  `prologue · spec interrogation: <n> checklist entries, <m> decisions recorded`).

## Where It Pauses for the Human

Nowhere — like every stage of this workflow it is fully unattended, resolving ambiguities itself and
recording each ruling with its reason in the decisions register.

**Where a human review point would naturally go**: right after this stage, over the requirements
checklist and the seeded decisions register — everything downstream builds on how the spec was read, so
a human would want to catch a missed requirement or a wrong ambiguity ruling here, before any slice
exists.

## What Happens Next

The **Shaper** (stage 02, P2) reads the checklist and register and does the whiteboard pass: the
skeletal master design doc and the provisional slice backlog.

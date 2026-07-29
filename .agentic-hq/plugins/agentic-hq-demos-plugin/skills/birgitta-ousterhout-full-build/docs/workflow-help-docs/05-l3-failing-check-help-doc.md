# 05 — L3 · Failing Check (Check Writer) — Help

This is the help doc for the **Check Writer**, the fifth of the twelve agents in the
**birgitta-ousterhout-full-build** workflow (slice-loop stage L3, once per slice in a fresh session).
See the [workflow overview](00-birgitta-ousterhout-full-build-user-help-doc.md) for how the whole run
fits together.

## What This Stage Does

The Check Writer writes this slice's executable checks **before the code exists**, runs them, and
confirms they fail **for the right reason**.

The checks are **derived from the design** the Slice Designer just wrote — its interfaces, stated
behaviours and error handling. The Check Writer does not invent expectations the design doesn't state;
if the design is missing an expectation the slice clearly needs, that's a design gap — it records the
gap, makes the minimal reasonable ruling, and reflects it in the design doc so the document stays true.

**A note on what this is not.** The slice loop's cycle is DESIGN → CHECK-FAILS → CODE → REFACTOR →
VERIFY, and this stage is CHECK-FAILS — it is **not** test-driven development. In TDD the tests drive
the design; here the design drives the development, and the checks record the design's expectations
rather than invent them. The failing check earns its place on one narrow claim: a check never observed
failing is not yet evidence that it *can* fail — and in a run where one unattended process writes both
the code and the checks and nobody reviews either, observing the failure is the only cheap proof that
the checks can catch anything at all.

What "fail for the right reason" means:

- **Valid failure** — one the missing implementation explains: a compilation or import error because the
  module doesn't exist yet, an assertion failing because the behaviour is absent.
- **Invalid failure** — one the check itself explains: a syntax error in the check, a wrong path, an
  assertion that could never pass. Those get fixed and re-run — a broken check observed failing proves
  nothing.

On stacks without a test framework the requirement is unchanged in substance: any executable check that
fails first and passes after (a verification script, an end-to-end assertion) qualifies. Slice 1's
checks must include at least one **genuine end-to-end check** — one real input through the real path, no
mocked layer boundaries.

## What It Reads and Writes

- **Reads**: the master design doc (this slice's entry), the slice's register entry, the spec where the
  design cites it.
- **Writes**: the slice's checks (code), the **observed failure reason** recorded in the slice register
  (which checks ran, why they failed — what makes this stage's claim auditable later), then one
  stage-labelled local commit (e.g. `slice {N} · check-fails: <n> checks written, observed failing`).

## Where It Pauses for the Human

Nowhere — fully unattended.

**Where a human review point would naturally go**: over the checks themselves — do they faithfully
record the design's expectations, and are the recorded failure reasons the right ones? In a run where
the same process writes code and checks, this is the artifact an outside reviewer would most want to
inspect.

## What Happens Next

The **Implementer** (stage 06, L4) builds what the design calls for and uses these checks as the
evidence it works.

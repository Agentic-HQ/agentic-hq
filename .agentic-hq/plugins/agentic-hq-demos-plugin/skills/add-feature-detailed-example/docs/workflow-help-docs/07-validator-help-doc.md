# 07 — Validator — Help

The Validator is the **seventh and final** of the add-feature-detailed-example workflow's 7 agents
(Ticket Creator → Interrogator → Planner → Executor → Refactoring Planner → Refactoring Executor →
**Validator**). The Refactoring Executor (06) before it has finished the code and the refactors; there is no
agent after it. The Validator closes out the workflow once the human is happy the feature is Done.

## What This Step Does

The Validator does a **final, quick, human-assisted double-check** that the feature in the ticket was
implemented as specified and that the main, important tests pass — and then helps the human confirm it Done.
It deliberately does **not** write any product code: it re-runs tests, summarises what was done, and asks the
human to verify. Concretely it:

- re-runs the **New Tests** (the individual tests created or updated for this feature) and the project's
  **Quick Validation / Quick Unit Test** command, to confirm nothing is broken;
- reads the original **Prompt** and **Ticket** and summarises, for the human, **how the feature was
  implemented** (so the ticket can be marked Done) and **how each Acceptance Criterion was met**;
- asks the human to check that summary, optionally test the feature manually, optionally do a quick manual
  regression check around the changed parts, and **confirm Done**;
- records all of this in the **Validator Summary** document.

It is the lightest of the seven agents by design — a last quick confirmation, not a heavyweight re-test.

## Final Double Check Of Tests

The automated part of validation is deliberately **quick**. It runs only two things: the **New Tests** for
this feature, and a fast **Quick Validation** command for the whole system. It does **not** run the full
end-to-end suite — a full e2e run can take many minutes and burn a large amount of the token budget, and a
check that slow tends to get skipped. The whole point of keeping this final check fast is that it is cheap
enough to actually run every time, as a genuine last line of defence rather than a box-ticking ritual.

The two things it runs are:

- **The New Tests** — the tests the Executor (04) created or updated for this feature, identified from the
  Execution Document (and the Refactoring Execution Document). These directly exercise the new behaviour.
- **The Quick Validation / Quick Unit Test command** — a **fast** (a few seconds) whole-system check. In a
  pnpm project this might be `pnpm validate` (unit tests + lint + format + types) or `pnpm unit`. Because this
  workflow is **language- and test-system-agnostic**, the agent works the command out from the project's
  `CLAUDE.md` or package setup — and if it genuinely cannot determine it, it **stops and asks** rather than
  guessing.

If either check **fails**, the agent records the failure and **raises it with the human** instead of quietly
signing the feature off. A final check that reports "all green" over a red suite would be worse than no check
at all, so a failure here blocks the Done confirmation until it is resolved.

## Manual Testing Of Feature

Automated tests passing is **not** the same as the feature actually working the way the human wanted.
Tests check what they were written to check; they can all pass while the feature still behaves wrongly in some
way nobody encoded a test for. So the Validator asks the human — **if they think it is worthwhile** — to run
the system manually and confirm the feature really does what they asked for. It is optional and quick, and
what gets tested is recorded in the Validator Summary.

## Basic Manual Regression Testing

Adding a feature can quietly break **existing** behaviour near the code that changed, without any current
test failing (because no test covers that exact interaction). The Validator therefore asks the human — again,
**if they deem it necessary** — to do a quick manual check of the functionality **around the parts that were
changed**, to confirm nothing nearby regressed. This is a lightweight, manual stand-in; a fuller automated
regression-testing step is noted as future work for this workflow, not part of it today.

## Human Confirmation Of Done

The decision that the feature is **Done** belongs to the **human, not the AI**. After the agent has presented
the how-it-was-implemented summary and the per-Acceptance-Criterion list, the human checks that list, checks
the tests / code / docs are all good, optionally does the manual and regression checks above, and then
confirms they are happy. The agent **stops and waits** for that explicit confirmation — iterating on anything
the human raises — and only then records it in the `Human Confirmation Of Done` section of the Validator
Summary. Once that confirmation is recorded, the add-feature-detailed-example workflow is complete.

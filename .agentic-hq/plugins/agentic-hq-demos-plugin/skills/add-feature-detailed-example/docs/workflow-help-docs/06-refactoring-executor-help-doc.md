# 06 — Refactoring Executor — Help

The Refactoring Executor is the **sixth** of the add-feature-detailed-example workflow's 7 agents
(Ticket Creator → Interrogator → Planner → Executor → Refactoring Planner → **Refactoring Executor** →
Validator). It is the partner of the Refactoring Planner (05): the Planner **decided** which refactors to
do and got your approval; this agent **does them**. After it, the Validator (07) does the final check that
the feature is Done.

## What This Step Does

The Refactoring Planner (05) produced a Refactoring Plan and you approved a specific set of refactors in
it. This agent **carries those approved refactors out** — it plans nothing new of its own. It works
through the approved list **one refactor at a time**, runs a quick test command after each to make sure
nothing broke, and records everything it does in a **Refactoring Execution Document** so there is a clear,
reviewable account of what changed.

Two principles shape the whole step:

- **Only the approved refactors.** The agent executes only the items the plan marks **APPROVED** (plus the
  bulk-approved Magic Constants). Rejected or skipped items are left alone. It reads the **Agreed Refactors
  Summary Table** at the end of the plan to know exactly what was agreed.
- **Structure, not behaviour.** Refactoring improves the shape of the code (names, duplication, decomposition,
  constants, comments) — it never adds new features or changes what the code *does*. The tests that passed
  before must still pass after.

It documents the Refactoring Execution Document **as it goes**, not at the end, so that if its memory is
compacted mid-run there is always an up-to-date record of what has and hasn't been done.

## Testing Between Refactors

The single most important safety habit here is running a quick test command **between every refactor** —
not just at the start and end. The reason is **localisation**: if you do ten refactors and then run the
tests and something is red, you don't know which of the ten broke it. If you run the quick check after
*each* one, a failure points straight at the refactor that caused it, so you can revert just that one
change.

Because this workflow is **language- and test-system-agnostic** (it doesn't know if you're in TypeScript,
Python, Go, …), it can't hard-code a command like `pnpm validate`. Instead it identifies two things up
front:

- **The New Tests** — the tests the Executor (04) created or updated for this feature. These are run in
  full **before** refactoring starts and again **after** all refactoring is done. They may be a bit
  slower, which is fine — they only run at the two ends.
- **The Quick Validation / Quick Unit Test command** — a **fast** (a few seconds) whole-system check that
  runs **between** every refactor. In a pnpm project this might be `pnpm validate` (unit tests + lint +
  format + types) or `pnpm unit`. The agent works it out from the project's `CLAUDE.md` or package setup —
  and if it genuinely can't, it **stops and asks you** rather than guessing.

The one exception to "between every refactor" is **trivial constant extraction**: pulling magic numbers
and strings out into named constants is so low-risk that the agent batches them into a single group and
tests before and after the group, rather than after each individual constant. Everything else is strictly
one-at-a-time.

## Large Refactor (Done Last)

If the Refactoring Plan included an approved **Large Refactor** (a bigger structural change to a whole set
of related code, rather than a small localised tidy-up), it is deliberately done **last**, after all the
small refactors are complete. A large structural change is the highest-risk thing in the stage, so:

- The agent **recommends you commit your work locally first**, giving you a clean point to revert to if the
  large refactor goes wrong, and then **waits** for your go-ahead before starting.
- The Large Refactor's details are recorded in the document's `Large Refactor` section **even if it was not
  carried out** (and why) — so there's always a record of what was considered.

## Failed Refactors

Sometimes a refactor in the plan can't actually be carried out as written — the plan was slightly wrong, or
the change breaks a test. When that happens the discipline is strict:

1. **Revert** the attempted refactor immediately.
2. Record it as **FAILED** in the `Refactors Executed` table.
3. Raise it at the **Plan Deviation Discussion Gate** for you to decide what to do.

What the agent must **never** do is silently try a *different, unplanned* refactor to make things work the
way it thinks they should. That would inject changes you never agreed to — changes you might miss at review
and that could cause problems later. Quietly substituting your own idea for the agreed plan is a forbidden
**anti-pattern**; the correct move is always to stop and surface the problem.

## Plan Deviation Discussion Gate

A **deviation** is any departure from the agreed plan — a refactor that FAILED, or one that turned out not
to be possible as planned. At this gate the agent highlights every deviation and discusses each with you,
and together you agree one of:

- an **alternative plan** for carrying that refactor out, or
- marking it **ABANDONED**, with your agreement and the reason recorded in the document.

If there were no deviations and every approved refactor went through cleanly, the agent simply records that
and moves on — there's nothing to discuss. (This discussion happens in the document and in normal chat, not
through pop-up prompts.)

## Human Approval Gate

Finally, the agent asks you to review **the Refactoring Execution Document and all the code changes** it
made, and **stops until you explicitly approve** — iterating on anything you raise. Once you approve, it
records that in the document's `Human Approval Details` section. Then control passes to the Validator (07)
for the final check that the feature is Done.

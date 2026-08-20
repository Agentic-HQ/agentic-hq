# 03 — Implementer — Help

This is the help doc for the **Implementer**, the third of the four agents in the **Add Feature**
workflow. The agent reads this doc when you say **"Tell Me More"**, so it can explain its reasoning in
more depth. You can also open it yourself in a Markdown-friendly viewer (e.g. VS Code) any time.

## What This Step Does

The Implementer turns the Planner's **approved implementation plan** into working code, and records
exactly what it did in a compact **implementation summary** —
`docs/tickets/{ticket-id}/workflow-files/03-implementation-summary.md`. It:

1. Reads the approved `02-implementation-plan.md` — its tests, implementation changes, and your
   recorded approval — as its primary instruction set, plus the `01-feature-brief.md` for background.
2. Writes or updates the **planned tests** (running them first to confirm they fail where the plan
   chose test-first).
3. Implements the **minimum code** needed to make them pass.
4. Runs the planned tests and a **quick validation** (e.g. running the CLI by hand), then writes the
   summary.
5. **Pauses at an approval gate** so you can review the work and ask questions or request changes
   before the stage finishes.

It is the **third** of four agents (Researcher → Planner → Implementer → Reviewer), and the **only**
one that writes production code — the Planner before it agreed *what* to build, and the Reviewer after
it checks the result.

## The Implementation Summary

Everything the Implementer records goes into **one compact document**, the implementation summary. It
is deliberately short and factual — a record of what happened, not an essay — and contains:

- **Summary Of Work Done** — a short description of what was built;
- **Files Changed/Added/Deleted** — the files touched, each marked changed / added / deleted;
- **Tests Added/Updated And Test Results** — the tests and their results, including any manual testing
  the AI did (with the exact commands and outcomes);
- **Approved Deviations From The Plan** — any plan changes agreed with you (or "None");
- **Out Of Plan Follow-up Ideas/Concerns** — useful work deliberately left out of scope (or "None");
- **Approval Gate Changes** — added only if the approval-gate discussion led to code changes: what was
  discussed, what changed, and why;
- **Human Approval Confirmation** — filled in when you approve at the approval gate: what was approved
  and that you approved it (with any conditions you attached).

## Follows The Approved Plan

The Implementer implements the **approved plan and nothing more**. If, while building, it spots useful
work that is outside the plan, it records that as a **follow-up** rather than doing it — keeping the
change small and predictable. This is what keeps the workflow conservative: the scope was agreed with
you at the Planner stage, and the Implementer holds to it.

If the planned tests **won't go green within the plan's scope**, the Implementer keeps iterating
within scope; if it is still blocked, it **stops and agrees a plan change with you** (recorded as an
UPDATE in `02-implementation-plan.md` and under *Approved Deviations From The Plan*) rather than
quietly going off-plan. It **never weakens, deletes, or skips a failing test** to force a pass — a
failing test is information for you, not an obstacle to remove.

## Tests And RED → GREEN

The Implementer follows the **test sequence the Planner chose**. Where the plan is test-first, it
writes the tests, runs them to confirm they fail for the expected reason (**RED**), implements the
minimum code, and runs them again to confirm they pass (**GREEN**). If the plan defined a **manual
validation step** instead of automated tests (because no automated test was practical), the
Implementer runs that instead.

It does **not** add its own **REFACTOR** pass — this simple workflow deliberately skips the third TDD
stage to keep things lightweight. A team that wants a refactor step adds a Refactor agent to its own
customized version of the workflow.

## The Approval Gate (Before Finishing)

Before the stage ends, the Implementer **pauses and asks you to approve** what it built. The idea is
simple: if you spot a problem or have a question, the best agent to explain *why* the code is the way
it is is the one that just wrote it — not the downstream Reviewer, which didn't make the change. So you
get one brief checkpoint with the implementing agent still in context.

It gives you a short recap plus the path to the summary and the changed files, then asks via a quick
multiple-choice prompt:

- **Implementation Approved** — the default (just press Enter): your approval is recorded in the
  summary's *Human Approval Confirmation* section, then the stage finishes and hands on to the
  Reviewer.
- **Implementation Not Approved - Discuss Further** — the agent asks what you'd like to discuss or
  change, answers your questions, and makes any changes you agree (within plan scope directly; a plan
  deviation is recorded as an approved change first). If the discussion changes any code, it adds an
  **Approval Gate Changes** section to the summary, then **asks again** — repeating until you approve.

This keeps the workflow fast on the common path (one keystroke to approve) while giving you a real
chance to course-correct with the person who actually did the work.

## What Happens Next

Once you've approved at the gate, the workflow moves on to the **Reviewer** (agent 04), which reads the
brief, the plan, this summary, and the actual changed files, and does a concise, evidence-backed
review.

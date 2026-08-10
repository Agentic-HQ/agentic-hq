# 04 — Reviewer — Help

This is the help doc for the **Reviewer**, the fourth and final of the four agents in the **Add
Feature** workflow. The agent reads this doc when you say **"Tell Me More"**, so it can explain its
reasoning in more depth. You can also open it yourself in a Markdown-friendly viewer (e.g. VS Code) any
time.

## What This Step Does

The Reviewer looks at the feature that was just built and gives you a concise, **evidence-backed**
review, recorded in `docs/tickets/{ticket-id}/workflow-files/04-review-summary.md`. It:

1. Reads the `01-feature-brief.md` (the outcome and acceptance criteria), the approved
   `02-implementation-plan.md`, the `03-implementation-summary.md`, **and the actual changed files** —
   so it reviews the real code, not just the summary's description of it.
2. Reviews the change like a **pragmatic senior developer**: did the intended behaviour ship, were the
   tests and regression checks good enough, what is the risk of this change, and what could be improved.
3. Writes a compact `04-review-summary.md` with its findings, risks, and improvement suggestions.
4. **Pauses for you to mark which findings (if any) to fix now** — it never fixes things silently.

It is the **fourth and final** of the four agents (Researcher → Planner → Implementer → Reviewer), and
the only one that reviews the shipped code. After it, the workflow ends.

## The Review Summary

Everything the Reviewer records goes into **one compact document**, the review summary. It is
deliberately short and **evidence-backed** — never a generic "looks good" — and contains:

- **Review Summary** — a short outcome summary;
- **Checks Passed** — a table (columns **Area | Evidence | Result**) of everything the Reviewer
  verified is fine: acceptance criteria that passed, the test evidence, and where regression coverage is
  good enough. There is nothing to fix here, so this table has no **Fix?** column;
- **Potential Fixes** — a table (columns **Area | Evidence | Result / Risk | Recommendation | Fix?**) of
  anything that could be fixed or improved: failed or unvalidated acceptance criteria, regression-
  coverage gaps, the highest-risk changed area, and **at least two improvement suggestions** whose
  labels end with `(RECOMMENDED)` or `(NOT RECOMMENDED)`. The **Fix?** column is where *you* mark what
  you want fixed (see below);
- **Selected Fixes Applied** — what the Reviewer fixed at the gate, or "None";
- **Final Human Confirmation** — your final decision;
- **Customization Next Step** — how to make this workflow your own (see below).

## Evidence, Not Rubber-Stamping

The Reviewer only adds value if every judgment is backed by **evidence** — a file, a behaviour, a test
command and its result, or a manual check. Where it can't point to evidence, it says **`Not validated`**
rather than guessing (and such a row belongs in **Potential Fixes**). Its regression-coverage judgment
never just repeats the test commands: it names the changed areas it inspected, then either records it
under **Checks Passed** with *why* the existing coverage is good enough, or puts it under **Potential
Fixes** with concrete suggested tests where coverage is weak or missing. If it recommends doing nothing
about a finding, it explains why the risk or cost doesn't justify more work. It does **not**
rubber-stamp.

## Never Fixes Silently (The Fix Gate)

The Reviewer writes its findings **first**, then hands the decision to you. In the **Potential Fixes**
table, write **`Yes`** in the **`Fix?`** column of any row you want fixed now, leave the rest blank,
**save the file**, and say **"done"**.

- **If you mark nothing** — the Reviewer records that no fixes were chosen and the workflow ends. The
  unmarked findings simply stand in the table; they are **not** tracked as separate follow-ups (if you
  don't want it fixed now by this Reviewer, it's forgotten).
- **If you mark one or more rows** — the Reviewer agrees a small fix plan with you, applies **only**
  those fixes, then **re-runs all the tests the Implementer recorded** to confirm they still pass (so a
  fix can't quietly break something), and records exactly what it changed — and the test result — under
  *Selected Fixes Applied*. It then pauses at a **second gate**: it presents the applied changes and
  test results and waits for your **explicit approval** — your chance to discuss any problems or agree
  further changes (which it applies under the same rules, then re-presents). Only once you approve can
  the workflow end.

This keeps the review honest and conservative: nothing gets changed without your explicit mark, the
Reviewer never applies fixes you didn't mark, it never weakens or deletes a failing test to force a
pass, and it deliberately avoids full redesigns and exhaustive architecture audits — it is a focused
review of *this* change.

## What Happens Next — Customizing This Workflow

The Reviewer is the **last** agent. If you marked nothing to fix, the workflow ends with that
decision; if fixes were applied, it ends once you have approved them at the second gate.

If this workflow was useful but felt **too minimal** for your process, that's by design — it's a small
starting point. To make it your own, run `agentic-hq create-workflow -- --using=add-feature` to copy it and
add your own stages, rules, and approval gates. For a worked example of a heavily-customized personal
workflow, inspect or try out `agentic-hq add-feature-detailed-example`.

# 02 — Planner — Help

This is the help doc for the **Planner**, the second of the four agents in the **Add Feature**
workflow. The agent reads this doc when you say **"Tell Me More"**, so it can explain its reasoning in
more depth. You can also open it yourself in a Markdown-friendly viewer (e.g. VS Code) any time.

## What This Step Does

The Planner turns the Researcher's **feature brief** into a compact, approved **implementation plan**
— `docs/tickets/{ticket-id}/workflow-files/02-implementation-plan.md` — that the Implementer then
builds from. It:

1. Reads the finalized `01-feature-brief.md` — the outcome, your prompt, the
   research, the Q&A and the acceptance criteria — as its entire starting context.
2. **Inspects the most relevant code** itself (starting from the brief's *Relevant Files Reviewed*)
   so the plan fits the real codebase.
3. Decides the **minimum useful** way to build the feature and the **minimum useful** tests to prove
   it.
4. Writes the compact plan and **pauses for your approval** before any code is written.

It is the **second** of four agents (Researcher → Planner → Implementer → Reviewer). Crucially, the
Planner writes **no production code** — its whole job is to agree *what* will be built and *how* it
will be checked, so the Implementer has a clear, approved target.

## The Implementation Plan

Everything the Planner produces goes into **one compact document**, the implementation plan. It is
deliberately short and scannable — a plan, not a design essay — and contains:

- **Tests Being Created** — the small set of tests that will prove the feature works, tied to the
  acceptance criteria where possible;
- **Implementation Changes** — the minimal code changes (which files/seams to touch and the
  approach), with short code excerpts where they make the plan clearer;
- **Risks/Unknowns/Concerns** — anything that could derail the change (or "None");
- **Follow-up Ideas** — useful work being deliberately left out of scope (or "None");
- **Human Approval Confirmation** — a record of your approval, filled in once you give it.

## Minimum-Useful Planning

The Planner aims for the **smallest change that delivers the acceptance criteria**, and the smallest
set of tests that meaningfully prove them — no gold-plating. This is a deliberately lightweight
workflow, so the plan stays focused on one small feature.

If the Researcher had flagged the feature as too big but you chose to **continue anyway** (a
`Split Suggestion (Rejected)` in the brief), the Planner may use that suggested split as
**sequencing guidance** — an order in which to build things — but it does **not** turn it into
separate Sub-Tasks or change the scope. It still produces one plan for this one ticket.

## Tests First (Pragmatically)

The Planner recommends writing or confirming the tests **first** when that is the safest path — but
it phrases this pragmatically, not as a rigid rule. If no automated test is practical for a
particular feature, it says so plainly and defines a concrete **manual validation step** instead, so
there is always *some* agreed way to check the feature actually works.

## Human Approval Before Code

The Planner **must not write any code**. Once the plan is ready it gives you the path to
`02-implementation-plan.md`, asks for your **explicit approval**, and waits. When you approve, it
records what you approved (and any conditions) in the **Human Approval Confirmation** section. If you
want changes, it revises the plan and asks again — it only finishes once your approval is recorded.
This is the gate that keeps the workflow conservative: nothing gets built until you've signed off on
the plan.

## What Happens Next

Once you've approved the plan, the workflow moves on to the **Implementer** (agent 03), which reads
the approved plan and writes the code and tests to make it real.

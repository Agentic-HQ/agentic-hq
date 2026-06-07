# 03 — Planner — Help

This is the help doc for the **Planner**, the third of the seven agents in the Add Feature workflow. The
agent reads this doc when you run with `verbosity=medium` or say "Tell Me More", so it can explain its
reasoning in more depth. You can also read it yourself in a Markdown-friendly viewer (e.g. VS Code) any
time.

## What This Step Does

The Interrogator (agent 02) built a shared understanding of the feature with you and recorded it in the
interrogation summary. The Planner's job is to turn that understanding into an **Implementation Plan** —
the tests, and the minimal code those tests drive — that the Executor (agent 04) will then carry out.

The Planner works with you to:

1. **Gather** any remaining information it needs (read the relevant code, optionally do a little more
   research).
2. Write an **Implementation Plan** structured around TDD: Write Tests → RED → Write Code → GREEN, plus
   Appendices that record the reasoning, audits and follow-ups.
3. **Iterate** the plan with you until you explicitly approve it.

Crucially, the Planner **generates no code itself** — only the plan. All the production code is written by
the Executor next, from the approved plan.

## The Implementation Plan — And Why The Planner Writes Everything Down

The Planner is not allowed to write any of the code, tests or other artefacts — only the Implementation
Plan (and any supporting planning documents). That can feel odd, because the back-and-forth you have while
planning seems useful for actually doing the work. But planning conversations wander through options and
ideas and finally **settle** on a decision — and that final decision is the **only** thing the Executor
really needs. Everything else is noise we deliberately throw away so the Executor starts with a clean,
compressed context.

There's a second, equally important reason for forcing everything into the plan file: it puts every
important decision **on disk**, committed alongside the code. If a decision lived only in the chat, it
would be lost the moment the context was wiped — and a future developer (or AI) would have no record of
**why** the change was made the way it was. With the plan on disk, anyone can find the git commit for a
change and read the Implementation Plan to understand the full "why" and "how".

So the Planner's job is to **compress** into the plan everything of use the Executor will need (apart from
the code it will re-read anyway), plus just enough explanation for a future reader to understand the
reasons behind the decisions.

## Use Of Appendices (Keeping The Main Section Short)

The Implementation Plan is split into a short **Main Section** and a set of **Appendices** at the end.

If the Main Section gets long, you'll learn to skim-read it — which defeats the point. So any long or
complex reasoning is pushed down into the Appendices, leaving the Main Section as a concise summary of
what will change. That way you can comfortably read the **entire** Main Section to confirm the plan looks
right, and merely **skim** the Appendices to confirm the detailed reasoning is captured (which the
Executor may find useful, and which future readers may find very interesting — it explains why the change
was made this way rather than another).

## TDD As Default — And Why

The Planner plans **test-first** by default: a minimal set of tests that force the feature into existence,
then the minimum code to make them pass — and nothing to make the code "good" (that's the Refactoring
agents' job). This suits AI coding specifically because, left to its own devices, AI tends to:

- **Write too many tests** — many useless, redundant, or gold-plating. A minimal set keeps the tests
  focused on driving the code into existence, and keeps them few enough that you actually read them and
  ask "do these really cover and drive the implementation?"
- **Write too much code** — adding "nice to have" features or elaborate mechanisms. Restricting it to
  "only enough code to pass the tests" keeps the implementation minimal.

Two useful signals fall out of this:

- If it takes **a lot** of tests and they're complex to write, that's a "smell" that the feature is too
  big and should be broken into Sub-Tasks.
- If the tests are **hard to write at all**, that often means the code isn't modular enough to be
  testable — a sign to stop and refactor for testability (or to knowingly take on a little technical debt
  for now).

**`REFACTOR:` notes.** Anything you or the AI spot that would improve the code but isn't part of the
minimal implementation is recorded as a `REFACTOR:` note — in **both** the plan and (at execution time) as
a comment in the code. The Refactoring Planner greps every document and all the code for `REFACTOR:` and
folds those into its analysis.

**Non-TDD option.** If you'd rather use a different testing methodology, you don't edit anything
yourself — just **ask the AI to change this Planner command for you**. It modifies the command file,
reloads from it, and continues the workflow.

## The Appendices Explained (A–D)

- **Appendix A — English Language Description.** A plain-English walkthrough of how the system will work,
  with **class/interface names in bold** and *only true method-call verbs in italics*. It's a quick,
  readable description of the design — and a diagnostic: if it doesn't read naturally, the understanding
  or the naming may be weak; something not in **bold** may be a missing abstraction; an action not in
  *italics* may be a missing method. New names get fixed in the plan; existing ones become `REFACTOR:`
  items.
- **Appendix B — Project Design Requirements Compliance Audit.** A table auditing the plan against the
  project's design requirements. If your project has a `docs/dev/project-design-requirements.md`, that's
  used; if not, the Planner asks whether to create one, use the Agentic HQ TypeScript OO design
  requirements instead, or skip the audit.
- **Appendix C — Acceptance Criteria Audit.** A table mapping each Acceptance Criterion from the ticket to
  the plan section(s) that satisfy it and how.
- **Appendix D — List For Refactor Planner.** Items we deliberately **don't** want the Executor to do, but
  **do** want the Refactoring Planner to consider later — name changes in existing code, documentation,
  and any requirements/improvements not forced into existence by the tests.

## What Happens Next

Once you've approved the Implementation Plan, the workflow continues to the **Executor** (agent 04), which
follows the plan's Steps in order — writing the tests, getting them to RED, writing the minimal code, and
confirming GREEN — turning the plan you approved here into working code.

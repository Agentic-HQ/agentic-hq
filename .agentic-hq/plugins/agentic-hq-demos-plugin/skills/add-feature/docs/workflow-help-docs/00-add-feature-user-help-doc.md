# Add Feature Workflow — User Help

This is the main user help doc for the **Add Feature** workflow. It explains what the workflow is for,
how it's structured, and where it pauses for you — the things worth understanding while you're running
it (or just before). Each of the four agents also has its own help doc, linked below. Open any of these
in a Markdown-friendly viewer (e.g. VS Code).

- [01 — Researcher](01-researcher-help-doc.md)
- [02 — Planner](02-planner-help-doc.md)
- [03 — Implementer](03-implementer-help-doc.md)
- [04 — Reviewer](04-reviewer-help-doc.md)

## What The Add Feature Workflow Does

The Add Feature workflow adds a **single, small feature** to an existing codebase, as a simple
**four-stage** sequence of AI agents (**research → plan → implement → review**). It is run by the
**Agentic HQ framework**, which automates AI command workflows — chaining multiple Claude Code commands
together so each agent does its part and hands its work on to the next.

It is deliberately **minimal**: four agents, one concise Markdown document per stage.
The aim is a fast, conservative loop for small features — small enough that you can keep the
change in your head and validate it in one pass.

It is also **issue-tracker-agnostic**. The `ticket-id` you give it is just a **label** used to name the
folder its documents live in — so you can use it with **any issue tracker, or none**. Create a ticket on
your issue tracker system to generate an id, or simply make one up, and then start the workflow.

## The Four Agents

The workflow runs four agents in order. Each reads the previous agent's document and writes its own, so
context stays sharp and every important decision is recorded on disk:

1. **[Researcher](01-researcher-help-doc.md)** → `01-feature-brief.md` — turns your request into a
   clear, well-scoped feature brief (your prompt, its understanding, bounded research, any questions,
   and a short acceptance-criteria checklist), then decides whether the feature is a good size to do in
   one run. Its size decision **gates** the workflow.
2. **[Planner](02-planner-help-doc.md)** → `02-implementation-plan.md` — turns the brief into a compact,
   **approved** implementation plan: the minimum-useful tests and the minimal code those tests drive. It
   writes **no production code**, and pauses for your approval before any code is written.
3. **[Implementer](03-implementer-help-doc.md)** → writes `03-implementation-summary.md` **plus the actual
   code and tests** — implements the approved plan (and nothing more), runs the tests, and records
   exactly what changed.
4. **[Reviewer](04-reviewer-help-doc.md)** → `04-review-summary.md` — gives a concise, **evidence-backed**
   review of what shipped, then lets you decide what (if anything) to fix. It is the only agent that
   reviews the shipped code, and after it the workflow ends.

## How To Run It

Run the following command from the **root directory of the project you want to add the feature to**:

```
agentic-hq add-feature -- --ticket-id=PROJ-123
```

`--ticket-id` is the **label** for this feature — it names the folder the workflow's documents are
written into (`docs/tickets/{ticket-id}/workflow-files/`). It is **required**; set it to your tracker's
id, or any id you like if you aren't using a tracker.

## The Files It Produces

All of the workflow's documents are plain Markdown, written under the ticket's folder:

```text
docs/tickets/{ticket-id}/workflow-files/
├── 01-feature-brief.md          (Researcher)
├── 02-implementation-plan.md    (Planner)
├── 03-implementation-summary.md (Implementer)
└── 04-review-summary.md         (Reviewer)
```

Each agent reads the file(s) before it and writes the next one, so the shared understanding of the
feature lives on disk rather than being lost when an agent's context is wiped. The actual code and tests,
of course, land in your codebase as normal.

## Your Touch-Points (The Gates)

The workflow is conservative: it pauses for you at several points, so nothing significant happens
without your say-so.

- **Researcher — write your feature request (the Human Prompt)**: right at the start, the Researcher
  creates the brief with an empty **Human Prompt** section and **waits for you** to write your feature
  request into it and confirm — everything downstream is built from this. If it then needs anything
  clarified, it adds a short **Questions And Answers** section and again waits for you to type your
  answers directly into the brief.
- **Researcher — size check** *(only if the feature looks too big)*: it pauses, explains why, adds a
  **Split Suggestion** to the brief, and asks you (via a multiple-choice prompt) whether to **terminate
  and split** *(recommended)* or **continue anyway** at higher risk. For a normal, good-size feature
  there's no prompt — it just continues to the Planner.
- **Planner — plan approval**: you must **explicitly approve** the implementation plan before any code is
  written. The Planner gives you the path to `02-implementation-plan.md`, waits, and records your
  approval (and any conditions) in the plan.
- **Implementer — approval gate**: once the code is written and the tests are green, it pauses and asks
  you to **approve** or **discuss further**. *Approve* (the default — just press Enter) finishes the
  stage; *discuss further* lets you ask the agent that actually wrote the code questions or request
  changes, after which it asks again — repeating until you approve.
- **Reviewer — fix gate**: it writes its findings into two tables — **Checks Passed** (things that are
  fine) and **Potential Fixes** (anything that could be fixed or improved). To get something fixed, you
  write **`Yes`** in the **`Fix?`** column of that Potential Fixes row, save the file, and say **"done"**.
  It then applies **only** the rows you marked and re-runs the Implementer's tests to confirm nothing
  broke. Mark nothing and the workflow simply ends — unmarked findings are left as-is, not tracked as
  follow-ups.

## "Tell Me More"

Each agent introduces itself in a single sentence and gets on with the work. At **any** point, just say
**"Tell Me More"** and the current agent re-reads its own help doc and explains the current stage in more
depth, then carries on. You can also open any of the help docs (linked at the top) yourself at any time.

## Customizing This Workflow

This workflow is a deliberately **small starting point**. If it's useful but feels **too minimal** for
your process, make it your own: run

```
agentic-hq create-workflow --using=add-feature
```

to copy it and add your own stages, rules, and approval gates.

For a worked example of how far an Agentic HQ workflow can go once it's been shaped around one creator's
personal way of building software, inspect or try out `agentic-hq add-feature-detailed-example`. Treat
that one as a **showcase**, not the recommended next step — most people are better served starting from
this simple workflow and growing it to fit.

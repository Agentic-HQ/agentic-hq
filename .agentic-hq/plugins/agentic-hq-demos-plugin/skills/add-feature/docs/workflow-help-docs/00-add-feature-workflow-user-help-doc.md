# Add Feature Workflow — User Help

This is the main user help doc for the **Add Feature workflow**. It explains what the workflow is for,
how it's structured, and the thinking behind how it works — the things worth understanding while you're
running it (or just before). Each of the seven agents also has its own help doc, linked below. Open any
of these in a Markdown-friendly viewer (e.g. VS Code).

## What The Add Feature Workflow Does

The Add Feature workflow adds a **single, small feature** to an existing codebase, as a linear sequence
of 7 collaborative AI agents. It is run by the **Agentic HQ framework**, which automates AI command
workflows — chaining multiple Claude Code commands together so each agent does its part and hands its
work on to the next.

It is a generic, **issue-tracker-agnostic** descendant of the Full Jira TDD Story workflow: it keeps the
good ideas (sharply-pinned context, questioning/clarification, minimal tests, minimal code, a dedicated
plan-then-execute refactoring stage, and documenting everything for the future) while dropping the Jira
lock-in. Tickets are just local Markdown files identified by a ticket id, so you can use it with any
issue tracker, or none.

Each agent does some **expansion** (exploring code, research, options with you) and then **compresses**
the result into a Markdown document that the next agent loads — so context stays sharp, and every
important decision is recorded on disk rather than lost when an agent's context is wiped.

## The 7 Agents

1. [Ticket Creator](01-ticket-creator-help-doc.md) — attempts to split the feature into smaller
   Sub-Tasks, then creates the ticket. May end the workflow early if the feature should become an Epic.
2. [Interrogator](02-interrogator-help-doc.md) — builds a shared understanding of the feature and asks
   you a list of clarifying questions.
3. [Planner](03-planner-help-doc.md) — works with you to produce the Implementation Plan (minimal tests
   plus the code those tests drive — TDD by default).
4. [Executor](04-executor-help-doc.md) — executes the plan step by step, documenting as it goes, and
   stops at an approval gate.
5. [Refactoring Planner](05-refactoring-planner-help-doc.md) — plans refactoring into a single Refactor
   Suggestion List (optionally including a large, structural refactor).
6. [Refactoring Executor](06-refactoring-executor-help-doc.md) — executes the approved refactors one at
   a time, keeping tests green between each.
7. [Validator](07-validator-help-doc.md) — a final, quick double-check that the feature is done, tests
   pass, and you're happy.

## How To Run It

Run the following command from the root directory of the project you want to add the feature to:

```
agentic-hq add-feature -- --verbosity=low --suggest-large-refactor=false --ticket-id=PROJ-123
```

All three parameters are **optional**:

- `--verbosity` — `low` (default) or `medium`. See below.
- `--suggest-large-refactor` — `false` (default) or `true`. See below.
- `--ticket-id` — the id for this feature. Create a ticket on your issue tracking system to auto-generate
an ID and then provide it here.  If omitted, the Ticket Creator helps you provide or generate one.

## The `verbosity` Option

The workflow is designed to keep the amount you have to **read** to a minimum, so each iteration is
fast — which in turn encourages you to keep features small.

- **`verbosity=low` (default):** each agent introduces itself in a single sentence and gets on with the
  work, showing you only what you need.
- **`verbosity=medium`:** each agent also reads its help doc and explains the reasoning behind how it
  works — useful the **first** time you run the workflow.
- **"Tell Me More":** at any point, just say "Tell Me More" and the current agent re-reads its help doc
  and explains the current stage in more depth, then carries on.

## The `suggest-large-refactor` Option

Defaults to `false`. When `true`, the Refactoring Planner additionally attempts a **large, structural**
refactoring suggestion — looking at the structure of the system around your change for opportunities to
simplify it or make it easier to understand. This costs extra time and tokens (which is why it's off by
default), but it's how you pay down technical debt; it's worth turning on for at least some tickets. If
you forget the flag, you can instead add a line `suggest-large-refactor=true` to the ticket and the
Refactoring Planner will pick it up.

## Principles That Shape The Workflow

- **Tokens are cheap, your attention is expensive.** The workflow deliberately shows you the **minimum**
  text and writes only what you'll actually read. The aim is to avoid duplication of information - so that
  the human only reads information **once** and at the point where it's most relevant.
- **Decomposition / reduced cycle time.** The Ticket Creator and Interrogator both push to split work
  into the smallest sensible Sub-Tasks (ideally a Tracer Bullet first), because smaller chunks give
  faster feedback and fit in both your head and the AI's context window. The trade-off is per-feature
  **overhead**: the workflow aims to be small enough to encourage small tasks, but big enough to do
  genuinely useful analysis.
- **Expansion and compression.** Each stage expands (explores code, research, options) and then
  compresses the result into a document for the next agent. That keeps each agent's context clean, and
  permanently records the decisions and the reasoning behind them alongside the code.

## Human/AI Collaboration In This Workflow

This workflow aims for a balanced middle ground between two common (and unsatisfying) AI-development
styles: the over-structured "master/slave" / spec-driven approach, and the over-loose "let's just vibe"
approach. Instead, the AI and you collaborate continuously, each playing to your strengths:

- **The AI** is great at finding things in files fast, working through checklists, knowing how libraries
  work, and writing code/docs quickly.
- **You** are great at judgement about keeping things minimal, spotting how to simplify messy parts, and
  the wider context the AI hasn't been told about.

The workflow keeps the quick, iterative feedback of vibe coding, but adds the structure of documents,
checklists, audits, and explicit human approval gates.

# 01 — Researcher — Help

This is the help doc for the **Researcher**, the first of the four agents in the **Add Feature**
workflow. The agent reads this doc when you say **"Tell Me More"**, so it can explain its reasoning in
more depth. You can also open it yourself in a Markdown-friendly viewer (e.g. VS Code) any time.

## What This Step Does

The Researcher turns your feature request into a single **feature brief** —
`docs/tickets/{ticket-id}/workflow-files/01-feature-brief.md` — that the rest of the workflow builds
on. It:

1. Creates the brief with an empty **Human Prompt** section for you to fill in.
2. Does **bounded research** — reads the relevant code and local docs, and (only when it needs to)
   does a little web/Perplexity research — to understand the feature.
3. Writes its **understanding** and **findings**, and asks you any **questions** it needs answered.
4. Once you've answered, **finalizes** the brief (outcome, acceptance criteria, files reviewed).
5. Makes a **size decision**: is this a good size to do in one run, or is it too big and better split?
6. Asks you to **approve the brief** — a single multiple-choice gate that always happens; when a
   split is suggested, the brief approval and the split decision are **combined into one question**.

It is the **first** of four agents (Researcher → Planner → Implementer → Reviewer), and its decision
**gates** the workflow — it either lets the workflow continue to the Planner (with your approved
brief), or stops it so you can split the feature into smaller pieces.

## The Feature Brief

Everything the Researcher does goes into **one growing document**, the feature brief. By the end it
contains, top to bottom:

- **One Sentence Outcome**, an optional **User Story**
  (added at the top once everything is understood);
- your **Human Prompt**;
- the AI's **My Understanding of This Task**;
- **Research Findings** and a **Web/Perplexity Research** note;
- **Questions And Answers** (if any were needed);
- **Relevant Files Reviewed** (at the bottom, mainly Planner pointers);
- A short **Acceptance Criteria** checklist
- and one record of your approval: a short **Brief Approval** section (good-size path), or — only if
  the feature is too big — a **Split Suggestion** section whose header records your combined
  brief-and-split decision.

This one file is what the Planner reads next, so it's where the shared understanding of the feature
lives.

## The Human Prompt

The Researcher creates the brief with an **empty Human Prompt section** and asks **you** to write
your feature request into it — what you want to add, plus any context, links, or constraints. It
doesn't need to be a full spec; just your initial idea(s).

Two things to know:

- **Your Human Prompt is preserved verbatim.** The AI never rewrites it. If something important comes
  up in chat, the AI **appends** it as an `UPDATE` entry quoting you, rather than editing your
  original words.
- **Substantive questions belong in the document, not the chat.** Quick approvals are fine in chat,
  but anything that matters is recorded in the brief so nothing is lost when the AI's context is later
  wiped, and so every later agent can read it.

## Research (Folded Into The Brief)

The Researcher does **enough** research to understand the feature — not to plan it (that's the
Planner's job). It looks at the relevant code and local project docs, and **only when local context
isn't enough** to understand an external API, library, framework, standard, or domain concept does it
do a little **web/Perplexity research**, kept short and targeted.

Unlike heavier workflows, this simple one keeps all research **inside the brief** — there are no
separate research files. The findings go in **Research Findings**, and any external research is
summarised (with links or a short note) in **Web/Perplexity Research**. If no external research was
needed, that section just says so in a sentence.

## Questions And Answers

If the AI needs input from you, it adds a **Questions And Answers** section to the brief — usually
**2–3 questions** (up to 8 for a genuinely complex or underspecified feature). Each question comes
with an **AI Recommendation**, and you can accept that recommendation by simply answering **"Yes"**.

You write your answers **directly in the document**, under each question's
`**Human Answer ('Yes' means follow AI Recommendation):**` line. The questions and your answers are
kept **verbatim** — the AI won't delete them or "fold them in"; it may append clarifications, but the
original Q&A always stays. After you answer, the AI re-reads the brief, updates its understanding and
findings where the answers change things, and asks follow-up questions only if it genuinely needs to.

## Finalizing The Brief

Once it has everything it needs, the Researcher adds the framing the downstream agents rely on:

- at the **top**: a **One Sentence Outcome**, an optional **User Story**
- at the **bottom**: **Relevant Files Reviewed** (ordered by relevance, mainly to give the Planner
  pointers) and **Acceptance Criteria** — a short, scannable checklist of the few **key, observable outcomes**, not a re-spec of everything
  already in your Human Prompt and the Q&A;

## The Size Decision & Brief Approval

Finally, the Researcher decides whether the feature is a **good size to do in one run**, and then
asks you to **approve the brief** — always as a **single** multiple-choice question, whichever way
the size decision went:

- **Good size (the common case):** no `Split Suggestion` is added. You're pointed at the finished
  brief and asked to choose:
  1. **Approve brief** *(recommended, the default)* — your approval is recorded in the brief and the
     workflow continues to the **Planner**.
  2. **Request changes** — give feedback in chat and/or edit the brief directly; the AI incorporates
     it, re-checks the size, and asks again.
- **Too large/complex:** the AI pauses, explains why, and adds a **Split Suggestion** to the brief —
  **2–6 smaller Sub-Tasks**, usually starting with a **Tracer Bullet / Walking Skeleton** (a minimal
  end-to-end slice). The brief approval and the split decision are then **one combined question**
  (you're never asked "approve the brief?" and "approve the split?" separately):
  1. **Approve brief & terminate to split** *(recommended, the default)* — the workflow stops
     cleanly, and you rerun `add-feature` for **each** Sub-Task, pointing each one's Human Prompt at
     this brief as the **parent feature brief**.
  2. **Approve brief, continue oversized** *(not recommended)* — the workflow carries on to the
     Planner with the oversized feature, at higher risk; the Planner may use the Split Suggestion as
     sequencing guidance.
  3. **Request changes** — feedback on the brief and/or the split; the AI incorporates it, re-checks
     the size (your feedback may have shrunk the feature to a good size), and asks again.

**Feedback is never treated as approval**: if your answer contains changes, the AI incorporates them
and asks again — nothing is recorded as approved, and the workflow can't move on (or terminate),
until you explicitly pick an approval option on the final version.

## What Happens Next

Once you've approved the brief — and the feature is a good size (or you chose to continue anyway) —
the workflow moves on to the **Planner** (agent 02), which reads the finalized brief and turns it
into a compact, approved implementation plan before any code is written.

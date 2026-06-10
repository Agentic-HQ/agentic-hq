# 02 — Interrogator — Help

This is the help doc for the **Interrogator**, the second of the seven agents in the Add Feature Detailed Example
workflow. The agent reads this doc when you run with `verbosity=medium` or say "Tell Me More", so it
can explain its reasoning in more depth. You can also read it yourself in a Markdown-friendly viewer
(e.g. VS Code) any time.

## What This Step Does

The Ticket Creator (agent 01) captured your idea and decided whether the feature was one ticket or an
Epic. The Interrogator's job is to **build a shared understanding of the feature with you** — and fill
in any holes about *what* needs to be done and roughly *how* — **before** the Planner (agent 03) writes
the implementation plan. It works with you to:

1. **Research** the relevant code (and, optionally, the web/Perplexity) — just enough to understand the
   feature, not to plan it.
2. Write a short **interrogation summary** that shows you its understanding, asks you a numbered list of
   **questions**, and lists what it looked at.
3. Read your answers, **update** the summary, and discuss anything still unclear.
4. Make a final **Re-Split Decision** — a second chance to break the feature up now that the real
   complexity is visible.

It deliberately does **not** plan the implementation, to avoid duplicating effort between this Agent and
the Planner.

## Building A Shared Understanding Of The Feature

The heart of this step is the **Summary Of My Understanding Of Feature**: the AI's understanding of the
feature and a high-level view of what completing it could involve — what it changes about the
functionality and/or the structure of the system, and the value that adds.

**Why it is deliberately kept high-level:** if this summary becomes a detailed plan, you'll learn to
skim-read it — *and* then skim-read the Planner's plan too, because they overlap. Keeping it high-level
means you actually read **all** of it and spot problems early, while they're cheap to fix. The detailed
plan is the Planner's job, done at the point where you'll really read and review it.

The summary includes a **Testing** subsection: the automated and manual tests the AI thinks the feature
should have (e2e where applicable, and unit tests, at a minimum). If your prompt and ticket said nothing
about testing, the AI won't silently decide — it raises a question recommending a test set for you to
confirm.

## Filling In The Holes

Below the summary is **Questions For Human** — a numbered list (Q1, Q2, …) of the things the AI genuinely
needs your input on. Each question spells out the options ((A), (B), …) where relevant, states the AI's
preference if it has one, and ends with a **Human's Response** placeholder. Answering simply **"Yes"**
means "go with the AI's preferred option".

Two things make this work well:

- **The questions and your answers live in the document, not just the chat.** They're recorded
  permanently, so nothing important is lost when the AI's context is later wiped, and every later agent
  can read them. You write your answers **directly into the file**, under each placeholder.
- **You can also comment inline.** Add comments on new lines anywhere in the Summary, prefixed `HUMAN:`,
  and the AI will pick them up when it reviews your answers.

After you've answered, the AI re-reads the file, **keeps your questions and answers in place unchanged**,
updates the Summary with anything new, discusses any remaining unclear points with you in normal chat,
and records the outcome of those discussions in a **Summary Of Discussions** section (without duplicating
what's already written elsewhere).

## Research Files

Before doing any research of its own, the Interrogator **checks the `research-files` directory for
anything the Ticket Creator already recorded** — there may be none, and what's there may or may not be
relevant — and reads what's useful, so it doesn't repeat work that's already been done.

When the AI does do its own Perplexity/web research, it records it under the feature's `research-files`
directory so the full detail is on disk but doesn't bloat anyone's context:

- **Manual** research (where you paste the question into Perplexity yourself) is saved as
  `<index>-<subject>-Perplexity-Manual-Research.md` with the question and a placeholder for the answer.
- **MCP** research (automatic) is saved as `<index>-<subject>-Perplexity-MCP-Research.md` with the full
  question and answer.

Either way, the **summary** in the interrogation document carries the gist and points to the file — so
downstream agents get the findings without loading every transcript, and open an individual research
file only when they need its full detail.

There's also a **Code/Files I Reviewed** list — the files the AI looked at, ordered by relevance, one
sentence each, tagged `Relevance: HIGH|MEDIUM|LOW|NONE`. You don't need to read it; its main purpose is
to give the Planner helpful pointers to what may be most (and least) relevant.

## The Interrogation Summary

Putting it together, the single interrogation summary file contains:

- **Summary Of My Understanding Of Feature** (high-level), with a **Testing** subsection and a **Human
  Comments** placeholder;
- **Questions For Human** (numbered, with options, AI preference, and your response placeholders);
- **Perplexity/Web Research Done** (a short summary pointing at the research files);
- **Code/Files I Reviewed** (relevance-ranked);
- after your answers: a **Summary Of Discussions** section;
- finally, a **Re-Split Decision** section (see below).

This one document is what the Planner reads next, so it's where the shared understanding is captured.

## The Re-Split Decision

The Ticket Creator already tried to split the feature once, before anyone understood it deeply. The
Interrogator gets a **second** chance — because by now you and the AI have uncovered the real complexity,
which sometimes only becomes obvious during the questioning. A strong sign a feature should be re-split
is that it took **a lot** of clarifying — e.g. **five or more questions** and plenty of technical
back-and-forth.

To avoid wasting your attention, this decision is **asymmetric**:

- **If the AI concludes it should *not* re-split** (the common case), it simply records why the feature is
  still low complexity and moves on — it doesn't ask you anything.
- **If the AI concludes it *should* re-split**, it writes out a proposed **Sub-Task list** — a **Tracer
  Bullet** (a minimal, skeletal end-to-end version) first, then Sub-Tasks that build on that skeleton,
  each just a **Name** and a **Single Sentence Outcome** — and *only then* asks you to choose: **Split**
  (its recommendation, pre-selected) or **Don't Split**.

If you split, the original ticket is rewritten as an **Epic** listing the Sub-Tasks, the workflow ends
here, and you run the Add Feature Detailed Example workflow on each Sub-Task individually (stop the workflow with Ctrl-C
first). If you don't split, the AI records the decision and the workflow carries on to the Planner.

## What Happens Next

Once you've approved the final interrogation summary (and not re-split), the workflow continues to the
**Planner** (agent 03), which turns the shared understanding you've built here into a minimal,
test-driven implementation plan for you to review.

# 05 — Refactoring Planner — Help

This is the help doc for the **Refactoring Planner**, the fifth of the seven agents in the Add Feature
workflow. The agent reads this doc when you run with `verbosity=medium` or say "Tell Me More", so it can
explain its reasoning in more depth. You can also read it yourself in a Markdown-friendly viewer (e.g. VS
Code) any time.

## What This Step Does

The Executor (agent 04) wrote the **minimal** code needed to pass the tests — and **nothing** to make that
code "good" for the long term. The Refactoring Planner's job is to look at that freshly-written code (and the
related code around it) and **plan** the improvements: it produces a single, reviewable **Refactor Suggestion
List** in a Refactoring Plan document.

Crucially, this agent **plans only — it changes no code**. You review and approve the list; the **Refactoring
Executor** (agent 06) carries out the approved items afterwards. So this step is a collaboration: the AI
surfaces every opportunity it can find (and is honest about which it would and wouldn't do), and you decide
what actually happens.

## A Comment On The Power Of Refactoring

The most common complaint about AI coding is that "it's just not that good". There's something real behind
that. Humans tend to **care** about the long-term quality of the code going into a system, because they're
likely to still be there in six months when a messy design has become harder and harder to change. AI, by
default, doesn't share that concern — its focus is almost entirely on **getting the one task it's been given
done, and done fast** (which makes sense — if AI routinely spent 10× the tokens polishing structure, every
feature would look 10× more expensive and slower).

On top of that, AI on its own may not be especially good at judging how hard a piece of code is to understand,
how badly structured it is, or how it could be simplified — areas where experienced humans can be quite
strong. So at least for now, the formula that grows a system sustainably is **human + AI**, not AI alone. We
may not yet be at the "dark factory" stage where no human is needed to keep a design clean.

That's the whole reason this agent exists, and the reason it offers a **Large Refactor** option: to
deliberately push the AI to do the structural thinking it won't do voluntarily, with you in the loop. As every
experienced developer knows — if you don't pay off your technical debt, you usually end up regretting it.

## The `suggest-large-refactor` Option

There are two kinds of refactoring this agent can do:

- the **everyday** refactors (renames, removing duplication, extracting magic constants, missing docs, basic
  structural tidy-ups) — always done; and
- a **large, structural** refactoring of the area around your change — done **only** when you opt in via the
  `suggest-large-refactor` option.

`suggest-large-refactor` **defaults to `false`**. That's deliberate: a large refactor adds significant extra
time and tokens, and if it were always on it would quietly push people away from keeping features small and
low-complexity — which is the opposite of what this workflow wants. So it's a tension we accept for now: small
features by default, and a structural refactor when you consciously ask for one.

It's surfaced in the command-line docs as `--suggest-large-refactor=false` precisely so you can see it and try
turning it on. You can enable it in **two** ways:

- pass `--suggest-large-refactor=true` on the command line; or
- if you forgot, add a line `suggest-large-refactor=true` (on its own) to the **ticket file**, then tell the
  agent — it checks the ticket as well as the parameters.

A good habit is to turn it on for at least **some** of your tickets, so the AI periodically helps you pay down
technical debt rather than only ever adding to it.

## Large Refactor Suggestion

When `suggest-large-refactor` is on, the agent is **forced** to attempt a structural refactoring — and the
"forced" matters. Left to its own devices, an AI asked to "refactor" will find the easy wins (extract a
method, rename a variable, maybe extract a class) and stop there. It won't stand back and ask the harder
question: *now that we've added this feature, has the surrounding structure become a tangled "rat's nest"
that's hard to understand?* Yet that's where the real value of refactoring is — spotting where the system's
structure and naming no longer match what it actually does, and untangling it into simpler, well-named
abstractions.

So the agent is made to work through explicit stages, one at a time, and document each:

- pick a **"Set"** of related code that surrounds (and includes) part of your change;
- describe the files involved and the structure/relationships within the Set;
- score it out of 10 for **Simplicity**, out of 10 for **Understandability** (how well entities and their
  method-relationships are named), and out of 10 for **SRP** (Single Responsibility) for **each** entity, plus
  a **combined** score — each with a comment;
- propose a concrete improvement (simpler, easier to understand, better decomposed, entities obeying SRP);
- **obligatorily** flag what it's **unsure** about and any **alternatives**, and ask you — because a human is
  often better at judging how to simplify complexity (this is the human/AI teamwork the workflow is built
  around).

Finally it weighs **risk/work against benefit** and recommends one of: do it **now** (if small/safe enough),
do it in a **separate ticket** once this feature is committed (for larger/riskier work — possibly as its own
dedicated `add-feature` run), or **reject** it (if, honestly, the cost outweighs the benefit). You get the
final say via a `now / ticket / reject` choice.

> A real-world example of where this would have helped: the leaked Claude Code source contained a single
> **3,167-line print function**. A Large Refactor Suggestion is exactly the mechanism meant to catch that kind
> of accumulated structural debt before it gets that far.

## The Refactor Suggestion List

The old Jira refactor command split the analysis the human had to read into **two overlapping sections** — an
up-front categorised analysis (with "skip" options), and then a separate summary table that re-listed many of
the same items. Reading both, with the overlap, was a lot of duplicated effort.

This workflow simplifies that to **one** thing you read and approve: a single **Refactor Suggestion List**.
You mark each suggestion **APPROVE / REJECT / DISCUSS** right there in the list (and give a single **bulk**
decision for the magic-constants), and discuss anything marked DISCUSS until the list is final. The list is
gathered from several sources:

- **From Requirements** — things the requirements asked for that weren't driven by tests (e.g. documentation)
  and so were deferred to this stage.
- **From "REFACTOR:" Notes** — every `REFACTOR:` note the Planner and Executor left (in the workflow documents
  and in the code), plus every item in the Implementation Plan's **Appendix D — List For Refactor Planner**.
- **Magic Constants Audit** — literal values that should be named constants, lumped together for one **bulk**
  approval.
- **Missing Comments (e.g. TSDoc)** — the standard doc-comments expected for each changed file.
- **Project Design Requirements Compliance Audit** — the changed code checked against your project's design
  requirements; any gap becomes a suggestion.
- **Basic Refactoring Audit** — see below.
- **Documentation** — any User / Developer / API documentation the feature warrants that isn't already covered.
- **Human-Identified** — space for you to add refactors the AI missed.

The agent surfaces **everything** — including refactors it's unsure about, or thinks shouldn't be done —
because **you** decide; its job is to list them all with an honest opinion (RECOMMEND / UNSURE / NOT
RECOMMENDED) and the risk of each.

## Basic Refactoring Audit

Part of the analysis is a fixed checklist applied to all the code added (and the existing, related code around
it), recorded as an audit table. The checks are:

- Poor variable or function names — rename for clarity
- Duplication within a file — extract to a shared function
- Overly complex conditionals — simplify
- Dead code — delete it
- Long and complex sequences, where a simpler way is visible
- Long functions — split into multiple functions or push complexity into new types/abstractions
- Overly complex classes — split into multiple classes, each obeying the Single Responsibility Principle

Each row records what was checked, a **PASS** or **FAIL**, and a comment. Every **FAIL** turns into its own
Refactor Suggestion in the list above, so nothing that's flagged gets lost.

## The Approval Gate / What Happens Next

When the suggestions are gathered, the agent writes the Refactoring Plan and asks you to review it. You mark
each suggestion (and the one bulk magic-constants decision), and discuss any DISCUSS items with the agent until
you're happy — this is a real two-way discussion, and the agent will push back if it thinks a suggestion is a
bad idea. **Nothing proceeds without your explicit approval** — even if the agent found zero refactors, it
still stops here for you.

**Only after** you've approved does the agent produce a short **Agreed Refactors Summary Table** at the bottom
of the plan and stamp it `Review Status: COMPLETE`. That table is a **record only** — you don't have to read or
approve anything in it; it's there so you can glance at what was decided, and so the **Refactoring Executor**
(agent 06) knows exactly which items to carry out next.

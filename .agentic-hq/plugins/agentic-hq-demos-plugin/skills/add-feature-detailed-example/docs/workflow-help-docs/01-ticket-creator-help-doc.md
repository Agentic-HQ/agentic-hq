# 01 — Ticket Creator — Help

This is the help doc for the **Ticket Creator**, the first of the seven agents in the Add Feature Detailed Example
workflow. The agent reads this doc when you run with `verbosity=medium` or say "Tell Me More", so it
can explain its reasoning in more depth. You can also read it yourself in a Markdown-friendly viewer
(e.g. VS Code) any time.

## What This Step Does

The Ticket Creator is the entry point to the workflow. You can start it without having properly
defined — or even thought through — what you want done, how to do it, or whether it's a good idea. This
agent works with you to:

1. Establish a **ticket id** for the feature (you provide one, or the AI generates one).
2. Capture your initial idea(s) in a short **kick-off prompt** file that you fill in.
3. Gain just enough lightweight context to **scope** the feature (not plan it).
4. Make a **mandatory attempt** to split the feature into smaller Sub-Tasks (ideally starting with a
   Tracer Bullet), and recommend whether to split or not.
5. Write a short **ticket file** — either an **Epic** (a pointer to a list of Sub-Tasks) or a
   **single-feature** ticket — and review it with you.

It deliberately does **not** plan the implementation. That's the Planner's job (agent 03). Keeping this
stage light is what makes it cheap to run the whole workflow on small features.

## The Ticketing System

People use many different issue trackers (Jira, Linear, GitHub Issues, …), and this workflow doesn't
communicate with any of those systems directly. Instead, every feature is identified by a **ticket id**, and the ticket
itself is written as a **local Markdown file** under `docs/tickets/{ticket-id}/`. You can mirror that
into your real tracker if you use one — or use the workflow with no tracker at all.

If you do use an issue tracker system, create a new ticket on it, copy the ticket id and start the add-feature-detailed-example 
workflow passing in that ticket id (see usage instructions in [00-add-feature-detailed-example-workflow-user-help-doc.md](00-add-feature-detailed-example-workflow-user-help-doc.md))

If you don't pass `--ticket-id` when you start the workflow, the Ticket Creator offers two ways to get
one:

- **You provide it** — create an issue in your tracker (title prefixed `DRAFT:`, description `TBA`) and
  paste the auto-generated id; or just make one up (recommended format `<PROJECT-SHORT-ID>-001`, e.g.
  `PROJ-001`).
- **The AI searches and increments** — it scans the existing tickets directory, finds the highest index
  in use, and generates the next one.

## The Prompt File

The kick-off prompt is **your** initial idea for the feature, written into a placeholder file the agent
creates for you (the agent never writes the prompt content itself). It should **not** be a complete
spec — full details and implementation planning are best left to the Planner, who will work on them when
you'll actually read and review the plan.

Guidance on a good kick-off prompt:

- **Length:** anything from three words ("Make more colourful") to a 50-sentence brain dump. It's up to
  you.
- **Optionally include** whatever's on your mind, e.g.: your motivation for the idea; who'll find it
  useful; what inspired it; initial thoughts on technical details; ideas on what to research; whether
  you suspect it's a good or bad idea; whether it might want splitting into sub-tasks.
- The AI will attempt to split it into Sub-Tasks regardless of how small it is.

**Example kick-off prompt:**

> I'd like to make the CLI UI more colourful. Not sure how, but it's a bit drab at the moment. I don't
> know anything about CLI colouring, but maybe there are some libraries that could be used — or maybe it
> could be done natively (I prefer that option, if it's nice and simple). Aim is to make it look more
> attractive and also make the different types of things (e.g. plugins, workflows, folder) use the same
> colour so the structure of the output is clearer to the user.

## Quick AI Scoping Questions

After you've filled in the prompt, the agent does a light analysis — a quick look at the codebase and
relevant tickets, optional web/Perplexity research — purely to **scope** the feature (it is **not**
planning the implementation here; doing that now would duplicate the Planner's work).

If anything essential to scoping is unclear, the agent asks up to **three** quick questions. Rather than
only asking in chat, it writes them into your prompt file under a `## Quick AI Scoping Questions`
heading, each with a placeholder for your answer. This way the questions and your answers are **recorded
permanently** and act as an **extension of the prompt** that every later agent can read — nothing
important gets lost when the agent's context is later wiped.

## Breaking The Feature Up (Splitting Into Sub-Tasks)

No matter how small or simple the feature is, the agent **always attempts** to split it into Sub-Tasks.
This is mandatory because — as Martin Fowler puts it — "our best form of leverage" is "reduced cycle
time", which means smaller tasks are better. Smaller tickets:

- fit inside both your head and the AI's context window (overstuffed context pushes the AI into the
  "dumb zone");
- give you much faster **feedback** on your ideas and the implementation, so you can embrace change
  cheaply;
- protect you from the way tickets mysteriously expand as unforeseen problems and complexity appear.

You can always reject the split and do the feature in one shot — the attempt just makes sure you're
deliberately choosing to.

### Tracer Bullet first

The aim is for the first (or an early) Sub-Task to be a **Tracer Bullet**: a super-cut-down, skeletal
version of the full feature that does the whole thing end-to-end, but with minimal functionality. The
point is to get feedback and learning as early as possible, and to leave a working skeleton to build the
remaining changes onto.

- **Full feature:** Colourful CLI — improve the entire CLI to be colourful with configurable colour
  schemes.
- **Tracer Bullet:** Change the colour of **just** the welcome screen text using **hard-coded** colours.

**Anti-pattern** — breaking the work into "horizontal" sequential layers where nothing actually runs
end-to-end until the last task:

- Implement a Config Subsystem
- Implement the Colour Scheme Config Subsystem
- Implement CLI pages to use the Colour Config Subsystem

That gives you no feedback about how the system looks, works, or integrates until the very end — i.e.
too late.

### Sub-Tasks are name + one sentence only

Each Sub-Task is strictly limited to a **Name** and a **Single Sentence Outcome** — no tickets, no
detail. The reasons:

- You should read **every word** of the list and agree with or fix it. A long list gets skim-read or
  skipped.
- Detail belongs to the moment each Sub-Task is actually run through this workflow, not now.
- We **expect and embrace change** — the Sub-Task list will get revised, so keeping it short and sweet
  makes it cheap to change.

**Example** Sub-Task list for the "Colourful CLI" feature:

| Name | Single Sentence Outcome |
| --- | --- |
| Research And Assess Colouring And Config Libraries | Research document covering what libraries we could use for CLI colouring (and whether a library is even a good idea), plus potential config libraries for storing colour schemes. |
| Tracer Bullet: Hard-Coded Colouring Of Workflow Listing Screen | The 3 entity types (plugins, workflows, paths) on the Workflow Listing Screen are coloured. |
| Implement Colour Scheme Config File | The colours on the Workflow Listing Screen are configurable in a colour-scheme config file that maps the 3 entity types to a colour. |
| Colour All Screens | The colour-scheme config maps entities to colours for all pages in the CLI app, and those pages use the mapped colours. |

## Split vs Don't Split vs Borderline

Once it has attempted the split, the agent assesses the result and recommends one of:

- **Splitting Recommended** — the feature split cleanly into reasonable Sub-Tasks, so it should become
  an **Epic** (a pointer to the Sub-Task list) rather than a single feature. (Some Sub-Tasks may still
  be large — that's fine; they'll be split again when run through the workflow.)
- **Splitting Not Recommended** — the AI struggled to produce multiple sensibly-sized Sub-Tasks, so the
  feature is best done as a single task.
- **Borderline** — the Sub-Tasks are OK but maybe a bit trivial, or there are only a couple; the AI
  explains why it can't decide.

You're then offered a menu. When the AI has a clear recommendation, that's the default (just hit Enter),
with the opposite available as an explicit override. When it's Borderline, the options are **Split**
(default) / **Don't Split**.

## The Ticket File (Epic vs Single Feature)

The ticket is written to `docs/tickets/{ticket-id}/workflow-files/01-ticket-creator/02-ticket-file.md`,
using one of two templates:

- **If splitting (Epic):** a Single Sentence Outcome plus a Sub-Tasks bullet list. Each line is
  `HUMAN_REPLACES_SUB_TASK_TICKET_ID_HERE - <Name> - <Single Sentence Outcome>`. The Epic holds **only**
  the outcome and the Sub-Task list — no implementation or requirement detail (that lives in each
  Sub-Task's own ticket).
- **If not splitting (single feature):** a Single Sentence Outcome, a User Story (As a / I want / So
  that), and Acceptance Criteria. It must **not** include any implementation/code detail — those are
  recorded in the Implementation Plan later, and discussed with you only then. Duplicating them here
  creates confusion and wastes time. (If your prompt included implementation pointers, they stay
  available to the later agents via the prompt file; they're just not copied into the ticket.)

Keeping the ticket short is deliberate: **tokens are cheap, your attention is expensive.** A ticket that
seems to need lots of detail is a strong sign the feature should be **split**.

## What Happens Next

- **If you split into an Epic**, the workflow ends here. You stop the workflow (Ctrl-C multiple times), create a ticket
  for each Sub-Task, replace each `HUMAN_REPLACES_SUB_TASK_TICKET_ID_HERE` placeholder with the real id,
  and run the Add Feature Detailed Example workflow on each Sub-Task individually (some may split again).
- **If you don't split**, you copy the ticket into your tracker (if you use one) and press Enter. The
  workflow continues to the **Interrogator** (agent 02), which builds a shared understanding of the
  feature and asks you any clarifying questions before the Planner plans the implementation.

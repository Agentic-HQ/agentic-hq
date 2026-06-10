# 04 — Executor — Help

This is the help doc for the **Executor**, the fourth of the seven agents in the Add Feature Detailed Example workflow. The
agent reads this doc when you run with `verbosity=medium` or say "Tell Me More", so it can explain its
reasoning in more depth. You can also read it yourself in a Markdown-friendly viewer (e.g. VS Code) any
time.

## What This Step Does

The Planner (agent 03) produced an approved **Implementation Plan** — a minimal set of tests and the minimal
code those tests drive. The Executor's job is to **turn that plan into working code**: it follows the plan's
Steps in order, writing the tests, getting them to fail (RED), writing just enough code to make them pass
(GREEN), and recording what it did as it goes.

The Executor works largely on its own — there isn't much back-and-forth during this stage — and ends at a
**Human Approval Gate** where you confirm you're happy with the tests, the code, and the record of what was
done before the workflow moves on to the Refactoring agents.

## Test-Driven Development (Red → Green → Refactor, Kept Minimal)

The plan is structured around TDD, and the Executor follows it that way:

1. **Write Tests** — the minimal set the Planner specified.
2. **RED** — run them and confirm they all fail (the feature doesn't exist yet).
3. **Write Code** — the **minimum** code needed to make those tests pass, and **nothing more**.
4. **GREEN** — run the tests again and confirm they all pass.

"Nothing more" is deliberate. Making the code "good" for the long term — better names, better structure,
documentation, untested embellishments — is **not** the Executor's job. All of that is deferred to the
Refactoring agents (05 and 06), which is what keeps the implementation honest and minimal.

## The Execution Document

As it works, the Executor keeps an **Execution Document** (`01-execution-document.md` in its own
`04-executor` folder) with a section for each Step it carries out, plus a **Brief Summary Of What Was Done**
at the end.

The important rule is that the Executor fills this in **as it executes — not at the end**. The reason is
**compaction**: an AI agent's working memory can be summarised and trimmed at any moment, and if it left all
its note-taking until the end, a compaction midway through could wipe out the memory of what it had already
done. So after **every** Step it immediately writes that Step up — what it did, and any deviations from the
plan or interesting additions — and only then moves on. That way the work is always safe to resume.

You don't need to read the Execution Document in detail — a quick skim is enough. It exists mainly as a
record for future AI or humans who want to understand what was done and why, committed to disk alongside the
code.

## The Human's Role While It Works

There isn't much for you to do while the Executor runs, but you can watch the code being generated and check
it's what you expected and that you're happy with it. If you're not, you have three options:

- **Drop a `REFACTOR:` comment** into the code — the Refactoring Planner will pick it up later.
- **Stop the agent and redirect it** — tell it how you'd like something done differently. It adds the
  change/correction to the Implementation Plan (so the plan stays the source of truth) and notes it in the
  Execution Document too.
- **Wait for the Approval Gate** and raise it there.

## If A Problem Is Hit

The Implementation Plan is often slightly incomplete or incorrect, so when the tests or code actually run, a
problem, bug, or inconsistency can surface. That's expected — what matters is how it's handled.

**The anti-pattern** is the AI deciding its job is to *make things work* and quietly changing course to do
so — doing something different from the plan, downloading and installing an alternative library, or
refactoring a whole swathe of existing code. The trouble is you could be off making a cup of tea and come
back to a codebase that's half the changes you expected and half changes you didn't — and possibly didn't
want.

**The correct way** is for the Executor to stop and involve you: investigate the problem *without changing
things*, write it up in a **Problems Hit** section of the Execution Document (the problem, a suggested fix,
and a space for your feedback), **STOP**, and wait. Once you've weighed in, it discusses the fix, updates the
plan if needed, gets your approval of the updated plan, and only then continues. This keeps you in control of
anything that wasn't in the plan you approved.

## "REFACTOR:" Notes (Deferred To The Refactoring Stage)

Because the implementation is kept to the absolute minimum that passes the tests, anything that would
*improve* the code but isn't needed to pass a test is **not** done here — it's recorded as a `REFACTOR:`
note, written **both** as a comment in the code **and** in the Execution Document. The Refactoring Planner
(05) greps every document and all the code for `REFACTOR:` and folds those into its analysis. So nothing good
is lost — it's just deferred to the stage that's actually responsible for improving the code.

## The Approval Gate — And What Happens Next

When all the plan's Steps are done, the Executor writes a **Brief Summary Of What Was Done**, shows it to
you, and asks you to review the tests and code and the Execution Document. You either type **"Approved"** or
discuss anything you want changed; it iterates until you approve. Once approved, it marks the Execution
Document accordingly and the workflow moves on to the **Refactoring Planner** (agent 05), which reviews the
code you've just accepted for refactoring opportunities.

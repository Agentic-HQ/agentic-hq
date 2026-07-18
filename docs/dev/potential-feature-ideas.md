# Potential Feature Ideas

This doc contains some idea on features that could be added to AHQ.  This isn't a Roadmap because we want to add features that are useful to people as we go along, so we can get good feedback on them, rather than thinking up and implementing ideas that *may* be useful.

## High Priority - Talk To People About Their Current Uses Of AI And Find The Problems AHQ Could Solve - Then Solve Them

The book [The Mom Test](https://www.momtestbook.com/) says that asking people what products/features they want doesn't work.  They don't know.  But chatting to them about their daily lives and what they do and where they have problems that could be solved does work.  So I'm going to do that and I'd like people who get involved with the project to do the same. Potential routes for chatting to people:
- Existing contacts I already have (from meetups) - reach out and get their feedback/ideas
- Direct email/contact to people I've seen on YouTube who are working in this space and may have things they could find AHQ useful for.
- Discord - dedicated Agentic HQ server - seems like best/great way to discuss things.
- Discord - existing groups for related things (AI software dev/AI usage/Claude Code users)
- Physical events - plenty of AI Software Developer events in London I can go to...
- Virtual events - meetings online where AI software developer and users of Claude Code and other agents meet and discuss ideas/workflows/work.
- YouTube interactive live stream - I could do one of these (later) and invite people to discuss their dev workflows
- YouTube comments - if I/we read and respond to them, they could be useful/interesting.
- Plenty of others (please submit a PR with ones I've missed and I'll merge it in...)

This technique seems the most fun, and possibly most useful, way of finding the features to work on next.  The ideas in the sections below are from me thinking "That would be useful!" - but as I don't really need them I would be working in a vacuum creating them and I wouldn't be able to get real feedback on whether they are useful.  So they are marked as Lower Priority.

## Lower Priority - Composable Commands/Skills (Partially Completed)

We often use the exact same set of instructions in multiple Skills, for example the instructions to load and parse input from the input file at the start of every Skill in a Workflow.

At the moment we just duplicate the instructions across the Skill files, and then if they need updating we have to do that across multiple files.

An alternative is to ask the AI to load the instructions from a single, shared file - but that complicates the Skill and requires the Agent to do more work.  It also makes the instructions harder to read and edit for the human.

A useful feature in AHQ could be something that parses the Skill file to detect included files and then dynamically includes them and provides them to the Agent.  When the human reads the files the includes should automatically be included.  This is something that Steve has experimented with in the partially completed [Spike-02 - Dynamic Prompt Runtime](https://github.com/Agentic-HQ/agentic-hq-archive-001/tree/main/docs/project-docs/project-spikes/spike-02-dynamic-prompt-runtime) (this material lives in the project's private archive repo — [contact the project founder](../../README.md#support) for access) in which a working example of an expandable prompt fragment viewer was created using VSCode's Markdown Preview Enhanced (MPE) extension. This allowed viewing nested, collapsible prompt fragments with up to 10 levels of depth.

**What was completed:**
- Expandable/collapsible fragments using HTML `<details>` elements
- Nested fragment imports using MPE's `@import` syntax
- CSS styling for visual differentiation at each nesting level
- Expand All / Contract All buttons

**What remains:**
- Conditional compilation (show/hide sections based on runtime conditions)
- Integration with the command execution pipeline
- Compiler implementation to build and run final commands from fragments

IMPORTANT: This idea is just "from my head" and I don't actually have a strong need for it - hence it is Lower Priority than features that we can find from real people with a real problem to solve.

## Lower Priority - Resumable Workflows

If you're in the middle of a Workflow and something goes wrong that causes the current Skill to abort/die or your computer crashes, it's hard to work out how to resume the Workflow.  You have to work out what state things were in and then either run the remaining Skills manually, or modify your TypeScript to resume, or just start the Workflow again from the start.

To avoid this problem it could be good to have some means of resuming the workflow from where you left off.  This could some kind of custom AHQ code that you add to your TypeScript Workflow program if you want this resumable workflow?  It could use a library like https://temporal.io/ - although that could involve quite a large number of limiting changes to the project, which may make it more complex or harder to add other features to.  Ideally any change to AHQ that allows this to be implemented would require zero changes to the core workflow engine, and just be an optional add-on that people can use (or not use) in the Agent Implementation.

This type of failure doesn't happen very often, and so it doesn't seem a high priority at the moment, but if we end up with long, complex, business critical workflows it will become more important.

**Background:** We initially used Camunda as a workflow engine in [Spike-00](https://github.com/Agentic-HQ/agentic-hq-archive-001/tree/main/docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system) (in the project's private archive repo — [contact the project founder](../../README.md#support) for access) but found it wasn't a good fit because:-
- BPMN/XML has a steep learning curve
- Workflow-as-diagrams doesn't align with our developer-centric approach - TypeScript seems a much simpler/better fit for building workflows.
- Lots of things about how Camunda deals with failures, errors and timeouts that were very hard to manage/understand/code around.

**Potential Library:** [Temporal](https://temporal.io/) because:
- Workflows are implemented as real TypeScript code, not diagrams
- Provides deterministic replay for exact logical continuation
- Better fit for developers who want to write code, not draw diagrams
- May not be good fit if it introduces too many restrictions/complications when developers are writing workflows (could be OK as an optional add-on?)

IMPORTANT: This idea is just "from my head" and I don't actually have a strong need for it - hence it is Lower Priority than features that we can find from real people with a real problem to solve.

## Very Low Priority - Slack / Human-In-The-Loop Notifications

There's an early spike at [`docs/project-docs/project-spikes/spike-01-slack`](https://github.com/Agentic-HQ/agentic-hq-archive-001/tree/main/docs/project-docs/project-spikes/spike-01-slack) (this material lives in the project's private archive repo — [contact the project founder](../../README.md#support) for access) that explored hooking a workflow up to Slack so the human gets a notification when the workflow needs review or finishes a long-running step. See [`spike-01-slack/README.md`](https://github.com/Agentic-HQ/agentic-hq-archive-001/blob/main/docs/project-docs/project-spikes/spike-01-slack/README.md) for where the original spike was paused and a May 2026 update describing a working one-shot Codex implementation on the archive repo's `experiments/codex-slack-spike-one-shot-01` branch (plus the [`notify-human-via-slack.sh`](https://github.com/Agentic-HQ/agentic-hq-archive-001/blob/main/.agentic-hq/agent-files/spike-agent-files/scripts/notify-human-via-slack.sh) helper, also in the archive repo) — that's the most likely starting point if this gets picked up.

Marked **very low priority** because I no longer think long, fire-and-forget chunks of AI work are a good development model. The interaction I want when developing is close, continuous collaboration between the human and the AI — the human staying aware of what the AI is doing, steering it as it goes. "Fire off a workflow, walk away, come back when Slack pings me" trades the steering for nothing useful in return.

If notifications turn out to make sense at all, it's more likely for narrow, genuinely-unattended cases (e.g. a long e2e test finishing, or a CI-style overnight run) — not as the primary developer experience.

---

## Contributing

If you're interested in contributing to any of these features, please contact Steve (the repo owner) via the contact form at https://agentichq.ai/.

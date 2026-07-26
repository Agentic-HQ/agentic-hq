# AHQ-192 — TailCut: a real-world benchmark project for testing Agentic HQ (workflow vs one-shot)

*(This ticket began life as "research the Homa Linux module" with its true purpose deliberately withheld, so the research wouldn't be polluted by knowledge of the end goal — per the Research/Plan/Implement idea of context isolation. The research phase is complete and the intent is now public: this ticket covers the whole arc.)*

## Intent

Produce a realistic, design-rich, objectively-scoreable coding project — **TailCut** — and build it twice: once by one-shotting Fable in an empty workspace, once via an Agentic HQ workflow (**birgitta-ousterhout-dev**: John Ousterhout's *A Philosophy of Software Design* principles encoded as Böckeler-style Guides & Sensors). Compare the two results with a pre-registered, blind-judged rubric to test whether the AHQ workflow measurably improves output quality. Send the resulting repos + reports to John Ousterhout.

**TailCut itself:** a transparent Linux tail-latency cutter — an eBPF byte-counting DSCP marker (PIAS-style) + DCTCP/ECN + switch priority queues — that lets small RPCs jump the queues behind bulk transfers, with zero application changes. Deliverable for this ticket: the single-VM benchmark rig proving the mechanism (relative numbers), per the executable spec. Target archetype: Criteo-shaped companies (own metal, RTB fan-out, hard auction deadlines — a stuck 700ms RPC is a lost bid). Domain tailcut.dev is registered.

## How it got here (the doc trail is the record — don't duplicate it here)

All documents live in the agentic-hq repo under [docs/jira-docs/AHQ-192/](https://github.com/Agentic-HQ/agentic-hq/tree/main/docs/jira-docs/AHQ-192):

- **01–04** — the blind Homa research: [detailed research](https://github.com/Agentic-HQ/agentic-hq/blob/main/docs/jira-docs/AHQ-192/02-homa-detailed-research-document.md), [summary](https://github.com/Agentic-HQ/agentic-hq/blob/main/docs/jira-docs/AHQ-192/03-homa-summary-research-document.md), and [why is nobody funding Homa](https://github.com/Agentic-HQ/agentic-hq/blob/main/docs/jira-docs/AHQ-192/04-why-is-nobody-funding-homa.md) (economics/adoption analysis).
- **05–07** — thought experiment: [what should Ousterhout pivot to](https://github.com/Agentic-HQ/agentic-hq/blob/main/docs/jira-docs/AHQ-192/06-what-you-would-pivot-to-if-you-were-john.md), plus the [steelman for staying the course](https://github.com/Agentic-HQ/agentic-hq/blob/main/docs/jira-docs/AHQ-192/07-steelman-for-staying-the-course.md).
- **08** — [the reveal](https://github.com/Agentic-HQ/agentic-hq/blob/main/docs/jira-docs/AHQ-192/08-now-the-fun-bit----the-big-reveal.md): the research was groundwork for an AHQ benchmark experiment.
- **09–11** — experiment design: the Amoh proxy idea [proposed and pressure-tested](https://github.com/Agentic-HQ/agentic-hq/blob/main/docs/jira-docs/AHQ-192/09-claudes-thoughts-and-questions-on-the-proposed-plan.md), then superseded by TailCut ([failure-map and transparency-map analyses](https://github.com/Agentic-HQ/agentic-hq/blob/main/docs/jira-docs/AHQ-192/10-claude-notes-on-continued-conversation.md)); [targets pinned](https://github.com/Agentic-HQ/agentic-hq/blob/main/docs/jira-docs/AHQ-192/11-new-focussing-in-on-the-targets.md) (Criteo archetype + the 700ms scenario).
- **12** — [the plan of action](https://github.com/Agentic-HQ/agentic-hq/blob/main/docs/jira-docs/AHQ-192/12-plan-of-action.md), with status ledger.
- **supporting-docs** — the [TailCut design conversation transcript](https://github.com/Agentic-HQ/agentic-hq/blob/main/docs/jira-docs/AHQ-192/supporting-docs/docs-from-conversation-about-tailcut-with-claude-web-agent/TailCut-Building_a_simpler_Homa_alternative___Claude_Web_Conversation.md) (from a separate Claude-web session), the [executable benchmark spec](https://github.com/Agentic-HQ/agentic-hq/blob/main/docs/jira-docs/AHQ-192/supporting-docs/docs-from-conversation-about-tailcut-with-claude-web-agent/tailcut-benchmark-spec.md), and the [fresh-agent orientation doc](https://github.com/Agentic-HQ/agentic-hq/blob/main/docs/jira-docs/AHQ-192/supporting-docs/section-12-post-clear-agent-reading-list-and-pointers-orientation.md).

## Where to start (for any human or agent picking this up)

1. [12-plan-of-action.md](https://github.com/Agentic-HQ/agentic-hq/blob/main/docs/jira-docs/AHQ-192/12-plan-of-action.md) — the agreed next steps and status ledger.
2. [The fresh-agent orientation doc](https://github.com/Agentic-HQ/agentic-hq/blob/main/docs/jira-docs/AHQ-192/supporting-docs/section-12-post-clear-agent-reading-list-and-pointers-orientation.md) — orientation + prioritised reading list; agents read this before doing anything.
3. [tailcut-benchmark-spec.md](https://github.com/Agentic-HQ/agentic-hq/blob/main/docs/jira-docs/AHQ-192/supporting-docs/docs-from-conversation-about-tailcut-with-claude-web-agent/tailcut-benchmark-spec.md) — the spec both experiment arms will receive.

## Remaining scope (summary — the plan doc is authoritative)

1. Freeze the experiment protocol + blind-judging rubric **before any run** (doc 13).
2. De-contaminate the spec handoff (arms get the spec only, in clean workspaces).
3. Build the birgitta-ousterhout-dev workflow (Guides/Sensors mapping; greenfield adaptation; no-HITL policy) — possibly its own ticket.
4. Prep environments (Ubuntu 26.04 VM per spec §2; clean arm-1 HOME).
5. Run both arms → blind judging → comparison report → email package to John Ousterhout.

**Done when:** both arms have run against the identical spec, the blind-judged comparison report exists, and the package has been sent to John.

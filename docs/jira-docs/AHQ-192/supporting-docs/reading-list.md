# Fresh-Session Reading List (for a brand-new agent picking up AHQ-192)

> **This document is a reading list and nothing else.**
>
> The single source of truth for current state, decisions, environment, rules and next steps is **[../12-plan-of-action.md](../12-plan-of-action.md)**. Read this page to work out *what to read*, then go there.
>
> ⚠️ **Do not add plan content, status, decisions or warnings to this file.** It previously accumulated a copy of the plan and the two drifted apart. If you find yourself about to record a decision here, it belongs in the plan doc.

## What this Jira is (the one-paragraph version)

AHQ-192 started as deep research into John Ousterhout's **Homa** datacenter transport protocol — but that was a setup (revealed in doc 08): the real goal is a **benchmark task for testing Agentic HQ**, comparing a one-shot Fable build against the **birgitta-ousterhout-full-build** workflow (APoSD-based Guides & Sensors, per Birgitta Böckeler's harness-engineering and sensors-for-coding-agents articles). The task both arms build is **TailCut**: a transparent, eBPF-based tail-latency cutter for Linux (PIAS-style byte-count DSCP marking + DCTCP/ECN + priority queues), demonstrated via a single-VM network-namespace benchmark rig. Designed in a separate Claude-web conversation; target company archetype: **Criteo**; target scenario: the **700 ms queue-stuck RPC** that costs an RTB bidder its auction.

## Read in this order (stop when you have what you need)

| # | Doc | Why / when |
|---|---|---|
| 1 | [../12-plan-of-action.md](../12-plan-of-action.md) | **The plan and the single source of truth** — phases, golden rules, status ledger, open decisions. Always read, first. |
| 2 | [../08-now-the-fun-bit----the-big-reveal.md](../08-now-the-fun-bit----the-big-reveal.md) | The reveal + the experiment's original four-step shape. 1 page. Always read. |
| 3 | [../11-new-focussing-in-on-the-targets.md](../11-new-focussing-in-on-the-targets.md) | The pinned targets: Criteo (and why), the 700 ms scenario, the money math. Always read. |
| 4 | [docs-from-conversation-about-tailcut-with-claude-web-agent/tailcut-benchmark-spec.md](docs-from-conversation-about-tailcut-with-claude-web-agent/tailcut-benchmark-spec.md) | **The deliverable spec both arms receive.** Read before touching anything experiment-related. |
| 5 | [../10-claude-notes-on-continued-conversation.md](../10-claude-notes-on-continued-conversation.md) | The two decision tables: the failure map (where RPCs get stuck) and the transparency map. Read for any "why TailCut and not X" question. |
| 6 | [../09-claudes-thoughts-and-questions-on-the-proposed-plan.md](../09-claudes-thoughts-and-questions-on-the-proposed-plan.md) | The experiment-design questions and Steve's answers. **Dated 2026-07-23 — parts are superseded; the plan doc says which.** Never follow doc 09 over the plan. |
| 7 | [docs-from-conversation-about-tailcut-with-claude-web-agent/TailCut-Building_a_simpler_Homa_alternative___Claude_Web_Conversation.md](docs-from-conversation-about-tailcut-with-claude-web-agent/TailCut-Building_a_simpler_Homa_alternative___Claude_Web_Conversation.md) | Full TailCut design conversation (hyperscaler research, why-nobody-built-it, Criteo digging, naming, rollout risk). Long; read sections on demand. |
| 8 | [../03-homa-summary-research-document.md](../03-homa-summary-research-document.md) → [../04-why-is-nobody-funding-homa.md](../04-why-is-nobody-funding-homa.md) | Homa background + economics. Only for research-depth questions. |
| 9 | [../06-…pivot…](../06-what-you-would-pivot-to-if-you-were-john.md) / [../07-…steelman…](../07-steelman-for-staying-the-course.md) / [../02-…detailed…](../02-homa-detailed-research-document.md) | Deep background; 02 is ~40K tokens — read targeted sections via its ToC. Mainly relevant to the eventual John email package. †|

† On doc 02: the web research elsewhere says Homa stalled at v12 (Jul 2025); doc 02's Patchwork-verified account says v19 (Apr 2026). **Doc 02 is authoritative.**

## About this doc folder

Docs are numbered in reading/creation order, **01–15**: 01–12 exist today, and the plan creates 13 (protocol + rubric), 14 (workflow kick-off guidance) and 15 (comparison report). **Next free number: 13.**

Three conversations produced the folder: a research session wrote 01–04 (the Homa deep-dive); a second wrote 05–12 (pivot analysis, the reveal, experiment design, targets, the plan); and a separate **Claude-web conversation** designed TailCut itself, whose transcript and spec live in [docs-from-conversation-about-tailcut-with-claude-web-agent/](docs-from-conversation-about-tailcut-with-claude-web-agent/). The docs written *by Steve as prompts* are 01, 05 and 08, plus the in-place **Answer:** lines in 09's Questions section; the rest are agent-written responses.

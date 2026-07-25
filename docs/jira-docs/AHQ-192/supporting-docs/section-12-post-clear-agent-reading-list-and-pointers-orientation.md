# Fresh-Session Orientation: Reading List & Pointers (for a brand-new agent picking up AHQ-192)

> Written 2026-07-25. Purpose: get a **brand-new agent — empty context, no chat history from earlier sessions** — fully up to speed on AHQ-192 without re-reading 100K+ of research. Everything you need is in this folder plus the repo's CLAUDE.md and auto-memory; nothing depends on conversation history. Companion to [../12-plan-of-action.md](../12-plan-of-action.md).

## How this work was produced (so the docs make sense)

Three conversations created this folder: (1) a research session wrote docs 01–04 (the Homa deep-dive); (2) a second session wrote docs 05–12 (the pivot analysis, the reveal, the experiment design, the TailCut comparison, the targets, this plan); (3) a separate **Claude-web conversation** designed TailCut itself — its full transcript and the benchmark spec live in [docs-from-conversation-about-tailcut-with-claude-web-agent/](docs-from-conversation-about-tailcut-with-claude-web-agent/). Convention: docs are numbered in order; the ones written *by Steve as prompts* are 01, 05, 08 (and the answers-in-place in 09's Questions section); the rest are agent-written responses. **Your first actions:** read the plan of action (next section's item 2), then check `git status` / `git log` / `git branch --show-current` on `docs/jira-docs/AHQ-192/` — plan step 1 is a **WIP commit on a feature branch** (merged to main later), so check both whether it happened and whether it has merged yet.

## What this Jira actually is (the one-paragraph version)

AHQ-192 started as deep research into John Ousterhout's **Homa** datacenter transport protocol — but that was a setup (revealed in doc 08): the real goal is a **benchmark task for testing Agentic HQ**, comparing a one-shot Fable build against the (yet-to-be-built) **birgitta-ousterhout-dev** workflow (APoSD-based Guides & Sensors, per Birgitta Böckeler's harness-engineering article). The task both arms will build is **TailCut**: a transparent, eBPF-based tail-latency cutter for Linux (PIAS-style byte-count DSCP marking + DCTCP/ECN + priority queues), demonstrated via a single-VM network-namespace benchmark rig. Designed in a separate Claude-web conversation; target company archetype: **Criteo**; target scenario: the **700 ms queue-stuck RPC** that costs an RTB bidder its auction.

## Read in this order (stop when you have what you need)

| # | Doc | Why / when |
|---|---|---|
| 1 | [../08-now-the-fun-bit----the-big-reveal.md](../08-now-the-fun-bit----the-big-reveal.md) | The reveal + the experiment's four-step plan. 1 page. Always read. |
| 2 | [../12-plan-of-action.md](../12-plan-of-action.md) | Current plan of action and next step. Always read. |
| 3 | [../11-new-focussing-in-on-the-targets.md](../11-new-focussing-in-on-the-targets.md) | The pinned targets: Criteo (and why), the 700 ms scenario, the money math, project state. Always read. |
| 4 | [docs-from-conversation-about-tailcut-with-claude-web-agent/tailcut-benchmark-spec.md](docs-from-conversation-about-tailcut-with-claude-web-agent/tailcut-benchmark-spec.md) | **The deliverable spec both arms will receive.** Renamed+revised 2026-07-25 (see its revision note). Read before touching anything experiment-related. |
| 5 | [../10-claude-notes-on-continued-conversation.md](../10-claude-notes-on-continued-conversation.md) | The two decision tables: the failure map (where RPCs get stuck; Homa/Tailcut/Amoh/hedging) and the transparency map (teams-in-critical-path). Read for any "why TailCut and not X" question. |
| 6 | [../09-claudes-thoughts-and-questions-on-the-proposed-plan.md](../09-claudes-thoughts-and-questions-on-the-proposed-plan.md) | The experiment-design questions. **Status: Q1–Q4 superseded** (TailCut's spec replaced the Amoh requirement-doc plan); **Q5–Q10 still live** and are closed by plan-of-action step 2. |
| 7 | [docs-from-conversation-about-tailcut-with-claude-web-agent/TailCut-Building_a_simpler_Homa_alternative___Claude_Web_Conversation.md](docs-from-conversation-about-tailcut-with-claude-web-agent/TailCut-Building_a_simpler_Homa_alternative___Claude_Web_Conversation.md) | Full TailCut design conversation (incl. the hyperscaler research report, why-nobody-built-it, Criteo digging, naming, rollout-risk analysis). Long; read sections on demand. |
| 8 | [../03-homa-summary-research-document.md](../03-homa-summary-research-document.md) → [../04-why-is-nobody-funding-homa.md](../04-why-is-nobody-funding-homa.md) | Homa background + economics. Only for research-depth questions. |
| 9 | [../06-…pivot…](../06-what-you-would-pivot-to-if-you-were-john.md) / [../07-…steelman…](../07-steelman-for-staying-the-course.md) / [../02-…detailed…](../02-homa-detailed-research-document.md) | Deep background; 02 is ~40K tokens — only read targeted sections via its ToC. Relevant mainly for the eventual John email package. |

## Key state facts (as of 2026-07-25)

- **TailCut** named and collision-checked; **tailcut.dev registered** (£15/yr); repo destined for the Agentic-HQ GitHub namespace.
- Spec renamed `pias-lite-benchmark-spec.md` → `tailcut-benchmark-spec.md` and substantively revised (bulk-goodput ≤10% criterion; deadline-miss metric at 100/200 ms; S5+S6 now required; idle re-promotion now core). Originals backed up locally by Steve (outside the repo).
- The **birgitta-ousterhout-dev workflow does not exist yet** — building it is plan step 4; base it on `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature-detailed-example/ts-workflow/src/add-feature-detailed-example-cli.ts` (7 sequential skills, re-inject pattern — note it's per-small-feature; TailCut needs a greenfield adaptation).
- The **judging rubric is not yet written** — it MUST be frozen before either arm runs (plan step 2). Both design conversations independently required pre-registration.
- Small discrepancy on record: the web research said Homa stalled at v12 (Jul 2025); our Patchwork-verified 02 doc says v19 (Apr 2026) — **02 is authoritative**.
- **Jira update pending:** the rewritten AHQ-192 ticket description is [AHQ-192-updated-Description.md](AHQ-192-updated-Description.md) (this folder) — Steve pastes it into the Jira manually. Its GitHub links point at `blob/main/`, so they 404 until the WIP branch merges to main; if the Jira still shows the old "research Homa" description, the paste hasn't happened yet.

## Warnings / trip-hazards for the new agent

1. **Do not leak AHQ-192 context into the experiment arms.** Both arms receive ONLY the spec, in clean workspaces. The spec's revision note references "AHQ-192 docs 09–11" — strip that note from the copy handed to arms, or guarantee the workspaces can't reach this repo (plan step 3).
2. **Arm 1 must not inherit `~/.claude/CLAUDE.md`** — its never-commit / never-install / stop-and-ask rules break unattended runs (doc 09 Q5). Clean HOME + purpose-built autonomy settings, matched for arm 2.
3. **This folder is destined for a public repo** — nothing personal, no non-public company info; keep the Criteo material sourced to their public engineering output only.
4. **Doc numbering:** 01–12 exist (no gaps). Next free number: 13.
5. Steve's global rules apply as ever: no commits except via `/commit`; TDD for any code written in this repo; scratch work in `<repo>/temp/<task>/`, not /tmp.

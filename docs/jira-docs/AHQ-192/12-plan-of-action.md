# Plan of Action — The Dummies-Guide Runbook (all work now inside the Ubuntu VM)

> Written 2026-07-25 (revised same day for the VM switch). Takes AHQ-192 from "targets pinned" (doc 11) to "experiment run, judged, and sent to John".
>
> **New agent: read [supporting-docs/section-12-post-clear-agent-reading-list-and-pointers-orientation.md](supporting-docs/section-12-post-clear-agent-reading-list-and-pointers-orientation.md) FIRST** — what this Jira is, the reading list, key facts, trip-hazards. Do not start work from this plan alone.
>
> **How to read this runbook:** every step is tagged. **🧑 STEVE** = human-only (VMware GUI, the user-only `/git:*` commands, verifying Jira rendering in the UI, starting sessions, email). **🤖 AGENT** = the agent does it in the VM. **🤖→🧑** = the agent prepares everything and then instructs Steve exactly what to type/click, at the moment it's needed. Steve wants to be *guided* — the agent drives, Steve executes only what's marked for him.

## TL;DR — the shape of the plan (read this even if you read nothing else)

**Goal:** build **TailCut** twice — Arm 1: one-shot Fable in an empty workspace; Arm 2: the birgitta-ousterhout-dev workflow (built first, under AHQ-193) — then blind-judge both results against a rubric frozen *before* any run, produce a comparison report, and send the whole package to John Ousterhout.

**How it runs:** everything inside the Ubuntu VM. The agent drives and tells Steve exactly what to do at each 🧑 step (VMware snapshots, `/git:*` commands, Jira UI checks, starting sessions, sending the email). Jira/Confluence reads and writes are the agent's job via the Atlassian MCP. All state lives in files + GitHub — sessions are disposable: after every snapshot restore, Steve starts a fresh `claude` and pastes one standard kickoff message.

**Phases at a glance:**

- **0** — 🧑 Boot VM, pull branch, start `claude`, paste the kickoff message.
- **1** — 🤖 Agent orients itself (docs, git state, VM survey).
- **2** — 🧑 Merge to main (`/git:03`) so links work; 🤖 updates the AHQ-192 Jira description via MCP (🧑 just eyeballs the rendering in the UI).
- **3** — 🤖 Doc 13: experiment protocol + judging rubric, **frozen before any run**; stripped spec copy for the arms (no breadcrumbs to this research).
- **4** — (AHQ-193) 🤖 writes doc 14, a **Kick-Off Guidance (Not Plan)** for the Guides/Sensors workflow; 🧑 runs AHQ's create-workflow, which drafts **its own Plan with Steve — the source of truth for the build** (guidance stays frozen input).
- **5** — 🤖 Install benchmark packages (one 🧑 approval), create clean arm1/arm2 users + arm GitHub repos; 🧑 snapshot `tailcut-01-baseline`.
- **6** — Arm 1 runs → push results → 🧑 snapshot `tailcut-02-arm1-complete` → restore baseline → Arm 2 runs → push → 🧑 snapshot `tailcut-03-arm2-complete`.
- **7** — 🤖 Blind fresh-session judges score both repos → comparison report (doc 15) → 🧑 email John.

**Safety rails:** nothing survives a snapshot restore except what's pushed to GitHub — the agent only says "✅ safe to restore" after verifying pushes, and never restores over an unsnapshotted state (hence the three indexed snapshots). The experiment arms never see this repo or any AHQ-192 context. Commits happen only via Steve's `/git:02` / `/git:03`.

## Golden Rules (agent: enforce these throughout)

1. **Everything happens inside the Ubuntu 26.04 VM** (VMware on Steve's Mac). `gh` and `claude` are already installed and authed there; Agentic HQ is set up. No Mac-side anything except VMware snapshot operations.
2. **The Snapshot Law: nothing survives a snapshot restore except what has been pushed to GitHub.** Before ever instructing a restore: commit + push everything (including this repo's branch and any arm-output repos), verify with `git log origin/<branch>` / `gh repo view`, and only then tell Steve "✅ safe to restore". Never instruct a restore without saying that sentence. **Belt and braces: never restore over an unsnapshotted state** — every restore instruction is immediately preceded by taking a fresh snapshot (next index) of the current state, so even a missed push can never lose anything. Three snapshots are planned: `tailcut-01-baseline` (Phase 5.6), `tailcut-02-arm1-complete` (Phase 6.2), `tailcut-03-arm2-complete` (Phase 6.5).
3. **Sessions are disposable.** Snapshots are taken with the VM powered off; every snapshot/restore cycle means: push → clean shutdown → Steve snapshots/restores in VMware → boot → Steve starts a fresh `claude` and pastes the standard kickoff message (Phase 0.4). All state lives in files and GitHub, never in a conversation. **When instructing a snapshot, always give Steve both fields VMware asks for:** a **Snapshot Name** — indexed in order, `tailcut-NN-<short-slug>` (the first is `tailcut-01-baseline`) — and a **Snapshot Description** (2–3 sentences: which plan phase the VM is at, what's inside it, and what it's safe to restore this snapshot for).
4. **Git discipline:** commits to this repo only via Steve running `/git:02` (WIP) and `/git:03` (PR + squash-merge); the agent prompts Steve at each commit point but never runs `git add/commit/push` itself in this repo. (Arm-output repos during the experiment are governed by doc 13, not this rule.)
5. **Installs need one approval:** present the full spec-§2 package list to Steve once, get a yes, then install and verify. No other unapproved installs.
6. **Contamination wall:** the experiment arms must never see AHQ-192 content, this repo, or any conversation context. Arms receive only the stripped handoff spec, in clean workspaces/users.
7. **No memories exist.** Nothing was migrated from the Mac-side agent. This folder + the repo CLAUDE.md are the entire context. Trust the docs, not assumptions.

---

## Phase 0 — 🧑 STEVE: boot everything (no agent exists yet)

0.1 🧑 Open VMware on the Mac → start the Ubuntu VM → log in → open a terminal.
0.2 🧑 Get the repo current (first time: `git clone https://github.com/Agentic-HQ/agentic-hq.git && cd agentic-hq`; otherwise `cd agentic-hq && git fetch`). Then: `git checkout feature/ahq-192-tailcut-test-of-ahq-workflows && git pull` (or the current working branch if this one has merged — check with `git branch -r`).
0.3 🧑 Start Claude Code in the repo root: `claude`
0.4 🧑 Paste this kickoff message (also used after every snapshot restore):

```
Please read docs/jira-docs/AHQ-192/12-plan-of-action.md and the orientation doc
it points to, then take over as the driving agent. We are inside the Ubuntu VM.
Work out from the status ledger and git state which phase we're in, and guide me
step-by-step through every step marked STEVE — exact instructions, at the moment
each one is needed.
```

## Phase 1 — 🤖 AGENT: orientation & environment survey

1.1 🤖 Read the orientation doc, this plan, and doc 13 if it exists; check `git status`, `git branch --show-current`, `git log --oneline -5`.
1.2 🤖 Survey the VM: `gh auth status`; `claude --version`; verify the **Atlassian MCP server** (it IS configured and working in the VM's Claude — do a cheap read, e.g. fetch AHQ-192, to confirm; the agent handles Jira/Confluence reads and writes itself). Two known MCP gotchas to respect: (a) `jira_transition_issue`'s comment parameter requires ADF and errors on Markdown — always add comments separately via `jira_add_comment` (Markdown fine there); (b) MCP read-back of issue descriptions shows mangled formatting (escaped `**`, dropped chars) even when the Jira UI renders fine — never "fix" formatting based on read-back alone; have Steve check the UI. Also check whether `~/.claude/CLAUDE.md` exists in the VM and read it if so (Steve's global rules may or may not have been copied).
1.3 🤖 Survey against spec §2: `uname -r` (need ≥ 6.8), which of the packages are present. Report findings — **do not install anything yet** (that's Phase 5).
1.4 🤖 Report state to Steve: current phase per the status ledger, anything unexpected, and the next step.

## Phase 2 — Housekeeping: merge + Jira

2.1 🧑 STEVE (agent prompts, recommended now): run `/git:03-git-create-PR-and-squash-merge-to-main` — merging makes the GitHub links in the Jira description resolve. Then `/git:01-git-branch` to start the next feature branch for the ongoing work.
2.2 🤖→🧑 Agent updates the AHQ-192 Jira itself via MCP: description ← contents of `supporting-docs/AHQ-192-updated-Description.md` (and summary ← its H1, if Steve agrees). Then 🧑 Steve eyeballs the rendered result in the Jira UI — if the MCP write mangled the formatting, fall back to manual copy-paste from the file.

## Phase 3 — Protocol + rubric (doc 13) — the pre-registration gate

3.1 🤖 Write `13-experiment-protocol-and-judging-rubric.md`: closes doc-09 Q5–Q10 (arm-1 clean user/HOME, web-access parity, judging mechanics, runs per arm, workflow prerequisites, John email shape); **objective gates first** (builds; `run_all.sh` completes unattended; S1 tail is real, P99 ≥ 10× P50; spec acceptance criteria 1–7; the four traps: ECN mask 0xFC, TSO/GSO/GRO off, RED `bandwidth` param, S6 idle re-promotion); then design-quality scoring (APoSD criteria **plus** framework-neutral ones); blind judging (2–3 fresh sessions, randomised repo-a/repo-b, order swapped, judges re-run the benchmark); per-arm capture (tokens, cost, wall-clock, RESULTS.md).
3.2 🧑 Review and approve doc 13 (answer any open questions in-place, doc-01 style).
3.3 🤖 Create the stripped handoff spec: copy `tailcut-benchmark-spec.md` to `supporting-docs/experiment-handoff/tailcut-benchmark-spec.md` **with the revision note removed** (no AHQ-192 breadcrumbs). This exact file is what both arms receive.
3.4 🧑 Run `/git:02-git-perform-minor-WIP-commit-on-branch`.

## Phase 4 — Build the birgitta-ousterhout-dev workflow (Jira: [AHQ-193](https://agentic-hq.atlassian.net/browse/AHQ-193), sub-task of AHQ-192)

Per AHQ-193, this phase is done by **Steve manually running AHQ's create-workflow workflow on the VM** — "the workflow builds the workflow" — pointed at this plan doc for context plus a **Kick-Off Guidance** for what to build. The driving agent prepares that guidance and supports; it does NOT scaffold the workflow itself.

**⚠️ Source-of-truth rule (learned the hard way — plans controlling plans controlling code rots):** doc 14 is a **Kick-Off Guidance, NOT a plan**. It is frozen input, handed over once. The create-workflow agent drafts **its own actual Plan, with Steve, inside its own session** — and from that moment *that* plan is the single source of truth for the workflow build. Decision changes made during the build land in the create-workflow plan, never back in doc 14; if the two disagree, the create-workflow plan wins (it was drafted with Steve, later, with more context). Doc 14 is never updated to compete.

4.1 🤖 Read both source articles first — Birgitta Böckeler's [harness-engineering](https://martinfowler.com/articles/harness-engineering.html) **and** [sensors-for-coding-agents](https://martinfowler.com/articles/sensors-for-coding-agents.html) (the second is cited by AHQ-193 and not yet reflected in these docs) — plus doc 13.
4.2 🤖 Write doc 14: `14-birgitta-ousterhout-dev-kick-off-guidance.md`, titled **"Kick-Off Guidance (Not Plan)"** and saying so in its header. Contents — guidance, not prescriptions: what birgitta-ousterhout-dev is (multi-stage, separate Skills, builds a whole system from a spec in one fully-automated run — no HITL for this experiment, so every skill needs the no-human-available policy: take the recommended option, record it); the candidate mapping of APoSD principles → named **Guides** (deep modules, information hiding, define-errors-out-of-existence, design-it-twice, comments-as-design) and Böckeler-style **Sensors** (complexity symptoms: change amplification / cognitive load / unknown unknowns; comment-quality checks; module-depth review); and the greenfield shape (contrast with the per-small-feature base workflow). Framed throughout as input for the create-workflow agent's own planning, open to revision there.
4.3 🧑 Review/approve doc 14 (the mapping is the intellectual heart — worth real review), then `/git:02`. Doc 14 is now frozen.
4.4 🧑 Run the **create-workflow** workflow inside AHQ on the VM, pointing it at `docs/jira-docs/AHQ-192/12-plan-of-action.md` for context and doc 14 as the kick-off guidance. **Draft the workflow's actual Plan with the create-workflow agent in that session** — the source of truth from here on. Workflow sessions are interactive; the driving agent stands by between stages to help interpret questions (against the guidance's *intent*, not as an authority).
4.5 🤖 Review the generated workflow against **the create-workflow plan** (the source of truth), with doc 14 only as an intent cross-check; smoke-test whatever is testable without running the real experiment; propose fix-ups.
4.6 🧑 `/git:02` WIP commits at sensible checkpoints (agent prompts). 🤖 Agent keeps AHQ-193 updated via MCP as the phase progresses — status transitions and comments, with comments added separately from transitions per the Phase-1.2 gotchas.

## Phase 5 — Experiment environment prep

5.1 🤖→🧑 Present the spec-§2 package list → Steve approves once → 🤖 `sudo apt install ...` and verify each tool runs (clang, bpftool, iperf3, etc.).
5.2 🤖 Create the arm environments per doc 13 (e.g. pristine `arm1`/`arm2` Linux users: empty HOMEs, minimal purpose-built Claude settings allowing autonomous work, no access to this repo clone).
5.3 🤖→🧑 Create the two arm-output GitHub repos in the Agentic-HQ namespace (`gh repo create` — agent runs it after Steve okays names, e.g. `tailcut-oneshot` / `tailcut-workflow`).
5.4 🤖 Stage each arm's workspace: the stripped handoff spec + the exact kickoff prompt for that arm (written to a file now, per doc 13, so run-day is copy-paste only).
5.5 🤖 Pre-flight checklist: arms can't reach this repo; capture tooling ready; doc-13 boxes ticked. Then prompt 🧑 `/git:02`, verify pushed.
5.6 🤖→🧑 **SNAPSHOT POINT.** Agent says: "✅ safe to snapshot. Steve: exit claude, run `sudo shutdown now`; in VMware snapshot the powered-off VM with —
   - **Snapshot Name:** `tailcut-01-baseline`
   - **Snapshot Description:** *AHQ-192 experiment baseline. Powered-off snapshot at end of Phase 5 prep: spec §2 packages installed, clean arm1/arm2 users with staged workspaces, arm GitHub repos created, all work committed and pushed. Restore this to get an identical clean starting state for each experiment arm (Phases 6.1 and 6.4).*
   — then boot the VM again, restart claude, paste the kickoff message." (Any later snapshot follows the same pattern: next index `tailcut-02-…`, fresh description.)

## Phase 6 — The runs (one arm, restore, other arm)

6.1 🤖→🧑 Arm 1 (one-shot): agent gives Steve the exact commands: switch to the `arm1` user, `claude` in the staged workspace, paste the prepared arm-1 prompt. Then **leave it alone** until done.
6.2 🤖→🧑 On completion: capture metrics per doc 13 (`/cost`, wall-clock, RESULTS.md); push the arm-1 output to its GitHub repo; record metrics in this repo; 🧑 `/git:02`. Agent verifies both pushes, then: "✅ safe to snapshot & restore. Steve: exit claude, `sudo shutdown now`; in VMware **first take a snapshot** —
   - **Snapshot Name:** `tailcut-02-arm1-complete`
   - **Snapshot Description:** *Arm 1 (one-shot) finished — full end state preserved, including the arm's session transcript, logs and workspace, in case anything wasn't pushed. Taken immediately before restoring to tailcut-01-baseline for arm 2. Restore this to revisit arm 1's environment.*
   — **then restore** snapshot `tailcut-01-baseline`; boot; fresh claude; kickoff message."
6.3 🧑 Restore → boot → fresh session (Phase 0.3–0.4). New agent lands here via the ledger.
6.4 🤖→🧑 Arm 2 (workflow): same pattern with the arm-2 runner per doc 13 (single fully-automated pass). Capture, push, `/git:02`, verify.
6.5 🤖→🧑 Final safety snapshot before judging: "✅ safe to snapshot. Steve: shutdown; in VMware take —
   - **Snapshot Name:** `tailcut-03-arm2-complete`
   - **Snapshot Description:** *Arm 2 (workflow) finished — full end state preserved before the judging phase touches anything. Both arm outputs pushed to their GitHub repos. Restore this to revisit arm 2's environment or to recover from judging-phase mishaps.*
   — then boot, fresh claude, kickoff message." Agent then declares runs complete in the ledger. (No restore after arm 2 unless doc 13 says otherwise.)

## Phase 7 — Judging, report, John

7.1 🤖→🧑 Blind judging per doc 13: fresh `claude` sessions with zero AHQ-192 context (Steve starts them with agent-prepared judge prompts; repos presented as randomised repo-a/repo-b; judges re-run the benchmark).
7.2 🤖 Comparison report (doc 15): criteria met, traps sprung, blind scores, cost/tokens — the table, not a vibe. Only after blind scores are in do Steve + agent add their own opinionated comparison.
7.3 🤖 Draft the John email package (repos + reports + these docs), with the framing from doc 09 Q10: acknowledge the blunter research passages, state the limits (n=1, automated, no HITL), and the courtesy question about using his name (same for Birgitta Böckeler if public).
7.4 🧑 Review, then send the email. 🧑 Final `/git:02` and `/git:03` to merge everything home.

---

## Status ledger (agent: update this as phases complete, via Steve's WIP commits)

| Phase | What | Status |
|---|---|---|
| — | Initial WIP commit of docs 01–12 + spec + handover | ✅ done — `1f6ff1a` on `feature/ahq-192-tailcut-test-of-ahq-workflows` |
| — | This runbook revision committed | ☐ pending (Steve's next `/git:02`) |
| 2 | Merge to main + Jira description updated via MCP (rendering verified by Steve) | ☐ not started |
| 3 | Doc 13 (protocol + rubric) frozen; stripped handoff spec created | ☐ not started — **first real task for the VM agent** |
| 4 | birgitta-ousterhout-dev workflow built via create-workflow under AHQ-193 (doc 14 kick-off guidance + generated skills; create-workflow's own plan = source of truth) | ☐ not started |
| 5 | Environment prep + **tailcut-baseline snapshot** | ☐ not started |
| 6 | Arm 1 run → restore → Arm 2 run (outputs pushed) | ☐ blocked on 3–5 |
| 7 | Blind judging → report (doc 15) → John email sent | ☐ blocked on 6 |

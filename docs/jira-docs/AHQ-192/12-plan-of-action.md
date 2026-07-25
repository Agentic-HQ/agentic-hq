# Plan of Action — The Dummies-Guide Runbook (all work now inside the Ubuntu VM)

> Written 2026-07-25 (revised same day for the VM switch). Takes AHQ-192 from "targets pinned" (doc 11) to "experiment run, judged, and sent to John".
>
> **New agent: read [supporting-docs/section-12-post-clear-agent-reading-list-and-pointers-orientation.md](supporting-docs/section-12-post-clear-agent-reading-list-and-pointers-orientation.md) FIRST** — what this Jira is, the reading list, key facts, trip-hazards. Do not start work from this plan alone.
>
> **How to read this runbook:** every step is tagged. **🧑 STEVE** = human-only (VMware GUI, the user-only `/git:*` commands, Jira pasting, starting sessions, email). **🤖 AGENT** = the agent does it in the VM. **🤖→🧑** = the agent prepares everything and then instructs Steve exactly what to type/click, at the moment it's needed. Steve wants to be *guided* — the agent drives, Steve executes only what's marked for him.

## Golden Rules (agent: enforce these throughout)

1. **Everything happens inside the Ubuntu 24.04 VM** (VMware on Steve's Mac). `gh` and `claude` are already installed and authed there; Agentic HQ is set up. No Mac-side anything except VMware snapshot operations.
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
1.2 🤖 Survey the VM: `gh auth status`; `claude --version`; check whether an Atlassian/Jira MCP is configured (if not, **all Jira edits become 🧑 steps**); check whether `~/.claude/CLAUDE.md` exists in the VM and read it if so (Steve's global rules may or may not have been copied).
1.3 🤖 Survey against spec §2: `uname -r` (need ≥ 6.8), which of the packages are present. Report findings — **do not install anything yet** (that's Phase 5).
1.4 🤖 Report state to Steve: current phase per the status ledger, anything unexpected, and the next step.

## Phase 2 — Housekeeping: merge + Jira

2.1 🧑 STEVE (agent prompts, recommended now): run `/git:03-git-create-PR-and-squash-merge-to-main` — merging makes the GitHub links in the Jira description resolve. Then `/git:01-git-branch` to start the next feature branch for the ongoing work.
2.2 🤖→🧑 Agent opens/echoes `supporting-docs/AHQ-192-updated-Description.md`; Steve copies it into the AHQ-192 Jira description (VM browser is fine). Also update the Jira summary/title to the doc's H1 if desired.

## Phase 3 — Protocol + rubric (doc 13) — the pre-registration gate

3.1 🤖 Write `13-experiment-protocol-and-judging-rubric.md`: closes doc-09 Q5–Q10 (arm-1 clean user/HOME, web-access parity, judging mechanics, runs per arm, workflow prerequisites, John email shape); **objective gates first** (builds; `run_all.sh` completes unattended; S1 tail is real, P99 ≥ 10× P50; spec acceptance criteria 1–7; the four traps: ECN mask 0xFC, TSO/GSO/GRO off, RED `bandwidth` param, S6 idle re-promotion); then design-quality scoring (APoSD criteria **plus** framework-neutral ones); blind judging (2–3 fresh sessions, randomised repo-a/repo-b, order swapped, judges re-run the benchmark); per-arm capture (tokens, cost, wall-clock, RESULTS.md).
3.2 🧑 Review and approve doc 13 (answer any open questions in-place, doc-01 style).
3.3 🤖 Create the stripped handoff spec: copy `tailcut-benchmark-spec.md` to `supporting-docs/experiment-handoff/tailcut-benchmark-spec.md` **with the revision note removed** (no AHQ-192 breadcrumbs). This exact file is what both arms receive.
3.4 🧑 Run `/git:02-git-perform-minor-WIP-commit-on-branch`.

## Phase 4 — Build the birgitta-ousterhout-dev workflow

4.1 🤖 Write the Guides/Sensors design doc (14): APoSD principles → named Guides (deep modules, information hiding, define-errors-out-of-existence, design-it-twice, comments-as-design) and Sensors (complexity symptoms, comment-quality checks, module-depth review); plus the greenfield adaptation (base workflow is per-small-feature — likely: Planner emits feature list, execution loops) and the no-HITL policy every skill needs (no human available → take recommended option, record it).
4.2 🧑 Approve the mapping (this is the intellectual heart — worth real review). Decide: own Jira ticket for the workflow build? (If Atlassian MCP exists the agent drafts it; otherwise 🧑.)
4.3 🤖 Scaffold via create-workflow and build the skills per doc 14. Smoke-test whatever is testable without running the real experiment.
4.4 🧑 `/git:02` WIP commits at sensible checkpoints (agent prompts).

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
| 2 | Merge to main + Jira description pasted | ☐ not started |
| 3 | Doc 13 (protocol + rubric) frozen; stripped handoff spec created | ☐ not started — **first real task for the VM agent** |
| 4 | birgitta-ousterhout-dev workflow built (doc 14 + skills) | ☐ not started |
| 5 | Environment prep + **tailcut-baseline snapshot** | ☐ not started |
| 6 | Arm 1 run → restore → Arm 2 run (outputs pushed) | ☐ blocked on 3–5 |
| 7 | Blind judging → report (doc 15) → John email sent | ☐ blocked on 6 |

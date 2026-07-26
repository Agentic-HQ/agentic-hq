# Plan of Action — AHQ-192 (Part A on the Mac, Part B in the Ubuntu VM)

> Written 2026-07-25, revised 2026-07-26. Takes AHQ-192 from "targets pinned" (doc 11) to "experiment run, judged, and sent to John".
>
> ## ⛔ ONE PLAN, ONE FILE
>
> **This file is the whole plan.** State, decisions, rules, status — all of it, only here.
>
> **Do not create or maintain any second copy** — not a summary doc, not a status doc, not a Jira description, not a Confluence page. If something needs recording, it goes *in this file*. If you catch yourself writing "see also" between two docs that both describe the plan, you have already made the mistake.
>
> The **only** other document about this work is [the reading list](supporting-docs/reading-list.md) — a pointer for a fresh agent to find the research docs. It holds no plan, no state, no decisions, and must never be given any. Jira descriptions are Steve's: a one-line summary plus a link here.
>
> **Tags:** **🧑 STEVE** = human-only (VMware, `/git:*`, starting sessions, running create-workflow, email). **🤖 AGENT** = the agent does it. **🤖→🧑** = agent prepares, then tells Steve exactly what to type, when it's needed. Each phase is tagged **💻 MAC** or **🐧 VM**; the machine changes once, at Phase 4.

## TL;DR

**Goal:** build **TailCut** twice — Arm 1: one-shot Fable in an empty workspace; Arm 2: the **birgitta-ousterhout-full-build** workflow (built first, under AHQ-193) — then blind-judge both against a rubric frozen *before* any run, write a comparison report, and send the package to John Ousterhout.

**Split by machine:** Part A (Phases 1–3) on the **Mac** — all the typing-heavy interactive work: the rubric, the guidance doc, and the create-workflow session. Part B (Phases 4–7) in the **Ubuntu VM** — only what needs it: eBPF/netns installs, the two runs, the judges re-running the benchmark. The VM has lagging keystrokes (per AHQ-193); that's the whole reason for the split. The bridge is **git**: Part A is pushed on the Mac, pulled in the VM at 4.2.

- **1** 💻 Agent orients itself.
- **2** 💻 Doc 13: experiment protocol + judging rubric, **frozen before any run**; stripped spec copy for the arms.
- **3** 💻 (AHQ-193) Doc 14 kick-off guidance → 🧑 runs create-workflow **from scratch** → `birgitta-ousterhout-full-build`, pushed.
- **4** 🐧 Boot VM, pull, survey — **and prove the new workflow runs there**.
- **5** 🐧 🧑 creates the two arm repos; 🤖 installs packages and builds matched arm environments; snapshot `tailcut-01-baseline`.
- **6** 🐧 Arm 1 runs → snapshot `tailcut-02-arm1-complete` → restore baseline → Arm 2 runs → snapshot `tailcut-03-arm2-complete`.
- **7** 🐧 Blind judges score both → comparison report (doc 15) → 🧑 emails John → **the single merge to main**.

**Scope:** a quick, practical test — n=1, fully automated, no HITL. Experimental purity is deliberately not chased (Golden Rule 1), and cost/tokens are not measured at all (Rule 8). All work stays on the feature branch until 7.4.

## Golden Rules

1. **Proportionality — this is a quick test, not a scientific study.** Steve's decision, 2026-07-26. The point is a practical read on whether AHQ improves design quality. It is n=1, fully automated, and nobody's life depends on it. **Experimental purity is explicitly NOT a concern:** repo names that give the game away, git history, commit authorship, the arms sitting next to this repo, workflow-generated files, an arm that could in principle read the research — all **acceptable**. Do not raise them as blockers, do not design elaborate isolation, and do not ask Steve to pick between purity options. Take the cheap route, note it in one sentence in doc 15, move on. **Only two controls are worth keeping, because both are cheap and load-bearing:** (a) the rubric is frozen before either arm runs — it's the difference between measuring and marking your own homework; (b) arm 1 can actually work (permission parity, step 5.3) — without it there is no second arm to compare. Everything else: don't gold-plate it.
2. **Know which machine you are on.** Phases 1–3 on the **Mac**; Phases 4–7 in the **Ubuntu 26.04 VM**, where `gh`, `claude` and Agentic HQ are already set up. Never move interactive, question-and-answer work into the VM to "save a step" — the keystroke lag is why the split exists.
3. **The Snapshot Law (Part B): nothing survives a snapshot restore except what has been pushed to GitHub.** Before instructing any restore: commit + push everything, verify with `git log origin/<branch>` / `gh repo view`, then say "✅ safe to restore" — never instruct a restore without that sentence. **Never restore over an unsnapshotted state**: every restore is immediately preceded by snapshotting the current state. Three snapshots: `tailcut-01-baseline` (5.6), `tailcut-02-arm1-complete` (6.2), `tailcut-03-arm2-complete` (6.5).
4. **VM sessions are disposable.** Snapshots are taken powered-off: push → shutdown → snapshot/restore in VMware → boot → fresh `claude` + the kickoff message (4.3). State lives in files and GitHub, never in a conversation. **Every snapshot instruction gives Steve both VMware fields:** a **Name** (`tailcut-NN-<slug>`, indexed) and a **Description** (2–3 sentences: which phase, what's inside, what it's safe to restore for).
5. **Git discipline: all work stays on the feature branch until the very end.** There is no mid-plan merge to main — the single squash-merge happens at 7.4, once everything is done. Commits only via Steve running `/git:02` (WIP) and `/git:03` (final PR); the agent prompts at each commit point but never runs `git add/commit/push` in this repo. (Arm-output repos are governed by doc 13, not this rule.) **Part A must end pushed** — the VM gets Part A by `git pull`, so anything uncommitted on the Mac does not exist in Part B.
6. **Installs need one approval:** present the spec-§2 package list once, get a yes, install, verify. No other unapproved installs.
7. **Don't hand the arms the research.** Each arm gets the stripped handoff spec and its kickoff prompt — that's it. That single cheap step is the whole contamination control; per Rule 1, do not build anything more elaborate on top of it.
8. **Cost and token measurement is OUT OF SCOPE — do not reintroduce it.** Steve's decision, 2026-07-26: subscription plans hide tokens and prices and the workarounds aren't worth the time. No cost comparison and no quality-per-pound framing anywhere. **This supersedes doc 09's fairness confound 2** — do not follow doc 09 on this point. Doc 15 simply states cost was not measured.
9. **Nothing carries across machines or sessions.** No agent memory was migrated to the VM. This folder + the repo CLAUDE.md are the entire context.
10. **This folder is destined for a public repo.** Nothing personal, no non-public company information; keep the Criteo material sourced to their public engineering output.

---

# PART A — 💻 MAC (Phases 1–3)

*On Steve's Mac, in this repo, on the feature branch. No VM involvement.*

## Phase 1 — 💻 Orientation

1.1 🤖 Read this plan; use the reading list to find anything else the task needs; read docs 13/14 if they exist. Check `git status`, `git branch --show-current`, `git log --oneline -5`.
1.2 🤖 Verify the Atlassian MCP with a cheap read. Two gotchas: (a) `jira_transition_issue`'s comment parameter needs ADF and errors on Markdown — add comments separately via `jira_add_comment`; (b) MCP read-back of descriptions shows mangled formatting (escaped `**`, dropped chars) even when the UI renders fine — never "fix" formatting from a read-back alone.
1.3 🤖 Report state to Steve: current phase per the ledger, anything unexpected, next step.

## Phase 2 — 💻 Protocol + rubric (doc 13) — the pre-registration gate

2.1 🤖 Write `13-experiment-protocol-and-judging-rubric.md`, closing doc-09 Q5–Q10 (arm environments, web-access parity, judging mechanics, runs per arm, John email shape). Contents:
   - **Objective gates first** — builds; `run_all.sh` completes unattended; S1 tail is real (P99 ≥ 10× P50); spec acceptance criteria 1–7; the four traps (ECN mask `0xFC`, TSO/GSO/GRO off, RED `bandwidth` param, S6 idle re-promotion).
   - **Then design-quality scoring** — APoSD criteria **plus** framework-neutral ones.
   - **Blind judging** — 2–3 fresh sessions, randomised repo-a/repo-b, order swapped, judges re-run the benchmark.
   - **Per-arm capture** — the arm's own `RESULTS.md` and benchmark output. **No tokens or cost** (Golden Rule 8).
   - **Pre-register how performance numbers are treated** — each arm's figures are read *within its own rig* and are **not** cross-comparable, because each arm builds its own harness (see 7.2). Decide this now: deciding it after the numbers arrive would look like explaining away an unwelcome result.
2.2 🧑 Review and approve doc 13 (answer open questions in-place, doc-01 style).
2.3 🤖 Create the stripped handoff spec: copy `tailcut-benchmark-spec.md` to `supporting-docs/experiment-handoff/tailcut-benchmark-spec.md` **with the revision note removed** (it name-drops AHQ-192). This exact file is what both arms receive.
2.4 🧑 `/git:02`.

> **Why the rubric precedes the workflow build:** doc 13 is frozen while the intervention does not yet exist, which keeps the measuring instrument honest.

## Phase 3 — 💻 Build birgitta-ousterhout-full-build ([AHQ-193](https://agentic-hq.atlassian.net/browse/AHQ-193))

Done by **Steve manually running create-workflow on the Mac** — "the workflow builds the workflow" — pointed at this plan for context plus a kick-off guidance for what to build. The driving agent prepares the guidance and supports; it does not scaffold the workflow itself.

**Two shape decisions (2026-07-26):**

- **Name: `birgitta-ousterhout-full-build`** (was `birgitta-ousterhout-dev`) — the name states what makes it different from everything else in AHQ.
- **Build from scratch — no `create-workflow --using=<existing>`.** Every existing AHQ workflow adds a *single small feature to an existing codebase*; this one does a *full build of a whole system from a spec*. Copy-and-adapt would start from the wrong shape and drag per-feature assumptions in with it. `add-feature-detailed-example` stays a reference for AHQ **mechanics** (7 sequential skills, re-inject pattern, one fresh session per stage), not a template to mutate.

**⚠️ Source-of-truth rule (plans controlling plans controlling code rots):** doc 14 is a **Kick-Off Guidance, NOT a plan** — frozen input, handed over once. The create-workflow agent drafts **its own Plan with Steve, in its own session**, and from that moment *that* plan is the source of truth for the workflow build. Changes land there, never back in doc 14; if they disagree, the create-workflow plan wins. Doc 14 is never updated to compete.

3.1 🤖 Read both source articles — Böckeler's [harness-engineering](https://martinfowler.com/articles/harness-engineering.html) **and** [sensors-for-coding-agents](https://martinfowler.com/articles/sensors-for-coding-agents.html) (the second is cited by AHQ-193 and not yet reflected in these docs) — plus doc 13.
3.2 🤖 Write doc 14, `14-birgitta-ousterhout-full-build-kick-off-guidance.md`, titled **"Kick-Off Guidance (Not Plan)"** and saying so in its header. Guidance, not prescriptions:
   - What it is: multi-stage, separate Skills, **builds a whole system from a spec in one fully-automated run**. No HITL for this experiment, so every skill needs a no-human-available policy: take the recommended option, record the choice.
   - **The full-build stage shape is the primary design question** — what the stages of a greenfield system build actually are (spec interrogation, system decomposition, per-module design, implementation loop, integration, review) rather than a per-feature sequence.
   - The candidate mapping: APoSD principles → named **Guides** (deep modules, information hiding, define-errors-out-of-existence, design-it-twice, comments-as-design) and Böckeler-style **Sensors** (complexity symptoms — change amplification, cognitive load, unknown unknowns; comment-quality checks; module-depth review).
3.3 🧑 Review/approve doc 14 — the mapping is the intellectual heart, worth real review — then `/git:02`. Doc 14 is now frozen.
3.4 🧑 Run `agentic-hq create-workflow` (no `--using`) on the Mac, pointed at this plan for context and doc 14 as the kick-off guidance. **Draft the workflow's actual Plan with that agent** — the source of truth from here on. Workflow sessions are interactive; the driving agent stands by between stages to help interpret questions against the guidance's *intent*, not as an authority.
3.5 🤖 Review the generated workflow against **the create-workflow plan**, with doc 14 only as an intent cross-check; smoke-test what's testable on the Mac; propose fix-ups.
3.6 🧑 `/git:02` at sensible checkpoints. 🤖 Keeps AHQ-193 updated via MCP — transitions, and comments added separately from transitions (1.2).
3.7 🤖→🧑 **Part A exit gate.** Verify the branch is pushed and say: "✅ Part A complete and pushed — Phase 4 can start in the VM."

---

# PART B — 🐧 UBUNTU VM (Phases 4–7)

*Keep VM typing minimal: paste the kickoff, run prepared commands, leave long runs alone.*

## Phase 4 — 🐧 VM start-up & survey

4.1 🧑 Open VMware → start the VM → log in → terminal.
4.2 🧑 Get the repo current (first time `git clone https://github.com/Agentic-HQ/agentic-hq.git`), check out the working branch, `git pull` — **this is how Part A's docs and the new workflow arrive**. `git branch -r` if the branch name has moved on.
4.3 🧑 Start `claude` in the repo root and paste this kickoff (also used after every snapshot restore):

```
Please read docs/jira-docs/AHQ-192/12-plan-of-action.md, then take over as the
driving agent. We are inside the Ubuntu VM, in Part B of the plan. Work out from
the status ledger and git state which phase we're in, and guide me step-by-step
through every step marked STEVE — exact instructions, at the moment each is needed.
```

4.4 🤖 Orient: read this plan, docs 13 and 14; check git state. Confirm docs 13/14 and the new workflow are present — if not, Part A wasn't pushed; stop and tell Steve.
4.5 🤖 Survey the VM: `gh auth status`; `claude --version`; Atlassian MCP check (gotchas per 1.2); `ls -al ~/.claude` and `cat ~/.claude/settings.json`. **Verified 2026-07-26: no `~/.claude/CLAUDE.md` on the VM** — Steve's global rules were never copied — but re-confirm rather than assume. **Also inspect `~/.claude.json`** (user-scope config; sits *beside* `~/.claude/`, so `ls ~/.claude` misses it) and list which **MCP servers** it configures — that's a contamination question, not just a config one (see 5.3).
4.6 🤖 **Survey the AHQ toolchain — the VM must now *run* a workflow, not just a benchmark.** `node -v` (22 or 24 LTS line), `corepack enable`, `pnpm install` at the repo root, `npm link`, then `agentic-hq list` and confirm **`birgitta-ousterhout-full-build` appears**. Also `pnpm install` in the new workflow's own `ts-workflow/`. Report gaps to Steve rather than fixing silently — finding this broken now is the entire point of doing it before Phase 6.
4.7 🤖 Survey against spec §2: `uname -r` (≥ 6.8), which packages are present. **Install nothing yet** — that's Phase 5.
4.8 🤖 Report state to Steve.

## Phase 5 — 🐧 Experiment environment prep

5.1 🤖→🧑 Present the spec-§2 package list → Steve approves once → 🤖 `sudo apt install ...`, verify each tool runs.

**The two arms (Steve creates both; decided 2026-07-26):**

| Arm | What it is | GitHub repo (Agentic-HQ org) | Workspace in the VM |
|---|---|---|---|
| **Arm 1** | one-shot Fable, no workflow | `tailcut-no-workflow` | `~/dev/claude/agentic-hq/tailcut-no-workflow` |
| **Arm 2** | `birgitta-ousterhout-full-build` | `tailcut` | `~/dev/claude/agentic-hq/tailcut` |

Arm 2 takes the plain `tailcut` name because it is the candidate real product. Both sit next door to the AHQ repo at `~/dev/claude/agentic-hq/agentic-hq` — see the open decision.

5.2 🧑 Steve creates the two repos and clones each to its path above (per doc 09 Q5: repos pre-created by Steve; `gh` available to the arms so they can push). 🤖 Verifies both exist and are writable.
5.3 🤖 Set up each arm's run environment per doc 13. **The requirement changed on 2026-07-26 after two checks — read before designing it:**

   - ✅ **The `~/.claude/CLAUDE.md` problem is moot** — verified absent on the VM, so there is nothing for the arms to inherit.
   - ⚠️ **The live fairness risk is permission parity, in the opposite direction.** Arm 2 runs via the `agentic-hq` CLI, which passes `--allowedTools` granting `Bash`, `Edit`, `Write`, `MultiEdit`, eight Atlassian MCP tools, `Skill(agentic-hq-core-plugin:self-termination)` and `Read(<workspace>/.agentic-hq)` (verified in `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts`). Arm 1, as a plain `claude`, gets **none** of it and stalls on its first permission prompt. **Arm 1 needs a matched grant via explicit `--allowedTools`.**
   - ❌ **Not `--dangerously-skip-permissions`** — arm 2 is *confined* to that list, so a blanket flag would give arm 1 strictly more freedom. Match the list, don't exceed it.
   - ℹ️ The granted list includes Atlassian MCP tools, so an arm could in principle search Jira and find AHQ-192. **Per Golden Rule 1, accepted — no need to neutralise it.** Just give both arms the same grant so they're on equal footing, and mention it in doc 15's limitations sentence.
   - 🤖 Record the grant used in doc 13, so doc 15 can state what each arm was allowed to do.

5.4 🤖 Stage each arm's workspace: the stripped handoff spec + that arm's exact kickoff prompt, written to a file now so run-day is copy-paste only.
5.5 🤖 Pre-flight: both repos pushable; arm permissions matched and MCP neutralised; arm 2 can run the workflow end to end; doc-13 boxes ticked. Then 🧑 `/git:02`, verify pushed.
5.6 🤖→🧑 **SNAPSHOT POINT.** "✅ safe to snapshot. Steve: exit claude, `sudo shutdown now`; in VMware snapshot the powered-off VM with —
   - **Name:** `tailcut-01-baseline`
   - **Description:** *AHQ-192 experiment baseline. End of Phase 5 prep: spec §2 packages installed, both arm workspaces staged, arm GitHub repos created, all work pushed. Restore this for an identical clean starting state for each arm (6.1 and 6.4).*
   — then boot, restart claude, paste the kickoff."

## Phase 6 — 🐧 The runs (one arm, restore, other arm)

6.1 🤖→🧑 Arm 1: exact commands — `claude` in `~/dev/claude/agentic-hq/tailcut-no-workflow` **with the matched `--allowedTools` grant from 5.3** (without it, arm 1 stalls immediately) — then paste the prepared arm-1 prompt and **leave it alone**.
6.2 🤖→🧑 On completion: capture the arm's `RESULTS.md` and benchmark output (**not tokens or cost**); confirm the output is pushed to `Agentic-HQ/tailcut-no-workflow`; note the outcome; 🧑 `/git:02`. Agent verifies both pushes, then: "✅ safe to snapshot & restore. Steve: exit claude, `sudo shutdown now`; in VMware **first take a snapshot** —
   - **Name:** `tailcut-02-arm1-complete`
   - **Description:** *Arm 1 (one-shot) finished — full end state preserved, including session transcript, logs and workspace, in case anything wasn't pushed. Taken immediately before restoring to tailcut-01-baseline for arm 2.*
   — **then restore** `tailcut-01-baseline`; boot; fresh claude; kickoff."
6.3 🧑 Restore → boot → fresh session (4.3). The new agent lands here via the ledger.
6.4 🤖→🧑 Arm 2: same pattern per doc 13 — a single fully-automated pass of `birgitta-ousterhout-full-build` in `~/dev/claude/agentic-hq/tailcut`, output to `Agentic-HQ/tailcut`. Capture, push, `/git:02`, verify.
6.5 🤖→🧑 Final safety snapshot before judging: "✅ safe to snapshot. Steve: shutdown; in VMware take —
   - **Name:** `tailcut-03-arm2-complete`
   - **Description:** *Arm 2 (workflow) finished — full end state preserved before judging touches anything. Both arm outputs pushed. Restore to revisit arm 2's environment or recover from judging mishaps.*
   — then boot, fresh claude, kickoff." Agent declares runs complete in the ledger.

## Phase 7 — 🐧 Judging, report, John

7.1 🤖→🧑 Blind judging per doc 13: fresh `claude` sessions with zero AHQ-192 context, agent-prepared judge prompts, repos presented as randomised repo-a/repo-b, judges re-run the benchmark.

> Copy each repo's working tree to `repo-a`/`repo-b` (randomised) so the judge isn't reading `tailcut-no-workflow` in the prompt. That's the extent of the blinding — per Golden Rule 1, don't scrub git history, authorship or workflow-generated files; just note in doc 15 that the blinding was light.

7.2 🤖 Comparison report (doc 15) — the table, not a vibe. **Three dimensions, kept separate** so a strong result in one isn't smuggled into another:
   1. **Objective gates** — spec acceptance criteria 1–7, per arm, pass/fail.
   2. **Traps sprung** — ECN mask `0xFC`, TSO/GSO/GRO off, RED `bandwidth`, S6 idle re-promotion. Objective, pass/fail, and the sharpest discriminator available: exactly the class of thing Guides/Sensors should catch and a one-shot may not.
   3. **Design quality** — blind rubric scores, with judge-to-judge agreement shown, not just the mean.

   **Not a dimension: cost** (Golden Rule 8) — doc 15 states it wasn't measured and makes no efficiency claim either way.

   > **⚠️ Performance numbers do NOT compare cleanly across arms — say so in doc 15.** Each arm builds *its own rig*, so the two headline ratios come from different measuring instruments and the more forgiving harness wins for reasons unrelated to TailCut. Report each arm's numbers **within its own rig**; treat only gates, traps and reproducibility as cross-comparable. *(Option for doc 13 once both outputs exist, not a commitment: cross-run the rigs to separate implementation quality from harness quality — may be impossible if the two chose incompatible interfaces.)*

   Steve + agent add their own opinionated comparison **only after** the blind scores are in. **Git history is excluded from blind judging** (biggest provenance leak, see 7.1), so commit hygiene, if assessed, is done here, non-blind, and labelled as such.
7.3 🤖 Draft the John email package (repos + reports + these docs), framing per doc 09 Q10: acknowledge the blunter research passages, state the limits (n=1, automated, no HITL), and ask the courtesy question about using his name (same for Birgitta Böckeler if public).
7.4 🧑 Review, send the email. Then the **single merge to main**: `/git:02` and `/git:03`.

---

## Layout note (decided — not an open question)

The arm workspaces sit next door to this repo:

```
~/dev/claude/agentic-hq/
├── agentic-hq/              ← the AHQ repo (also the Agentic HQ install arm 2 runs from)
├── tailcut-no-workflow/     ← arm 1 workspace
└── tailcut/                 ← arm 2 workspace
```

That adjacency is deliberate: AHQ finds workflows by scanning `.agentic-hq/plugins/` in the install workspace, so arm 2 needs a reachable install and this is the simplest one. It also means the research docs are one `cd` away from both arms. **Per Golden Rule 1 that is accepted, not a problem to solve** — one sentence in doc 15 noting isolation was by convention, and nothing more.

---

## Status ledger (agent: update as phases complete, via Steve's WIP commits)

| Phase | Machine | What | Status |
|---|---|---|---|
| — | 💻 | Docs 01–12 + spec committed | ✅ `1f6ff1a` |
| — | 💻 | VM-switch runbook revision | ✅ `42dd9b7` |
| — | 💻 | Mac/VM split, rename, one-plan cleanup | ☐ pending (next `/git:02`) |
| 1 | 💻 | Orientation | ☐ not started |
| 2 | 💻 | Doc 13 frozen; stripped handoff spec created | ☐ not started — **first real task** |
| 3 | 💻 | `birgitta-ousterhout-full-build` built via create-workflow (from scratch) under AHQ-193; pushed | ☐ not started |
| 4 | 🐧 | VM start-up, survey, proof the workflow runs there | ☐ blocked on 3 |
| 5 | 🐧 | Arm repos + environment prep + `tailcut-01-baseline` | ☐ blocked on 4 |
| 6 | 🐧 | Arm 1 run → restore → Arm 2 run (outputs pushed) | ☐ blocked on 2–5 |
| 7 | 🐧 | Blind judging → doc 15 → John email → **merge to main** | ☐ blocked on 6 |

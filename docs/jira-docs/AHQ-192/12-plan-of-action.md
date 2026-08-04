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

**Goal:** build **TailCut** twice — Arm 1: one shot in an empty workspace, no workflow; Arm 2: the **birgitta-ousterhout-full-build** workflow (built first, under AHQ-193) — then blind-judge both against a rubric frozen *before* any run, write a comparison report, and send the package to John Ousterhout.

**Split by machine:** Part A (Phases 1–3) on the **Mac** — all the typing-heavy interactive work: the rubric, the guidance doc, and the create-workflow session. Part B (Phases 4–7) in the **Ubuntu VM** — only what needs it: eBPF/netns installs, the two runs, the judges re-running the benchmark. The VM has lagging keystrokes (per AHQ-193); that's the whole reason for the split. The bridge is **git**: Part A is pushed on the Mac, pulled in the VM at 4.2.

- **1** 💻 Agent orients itself.
- **2** 💻 Doc 13: experiment protocol + judging rubric, **frozen before any run**; stripped spec copy for the arms.
- **3** 💻 (AHQ-193) Doc 14 kick-off guidance → 🧑 runs create-workflow **from scratch** → `birgitta-ousterhout-full-build`, pushed.
- **4** 🐧 Boot VM, pull, survey — **and prove the new workflow runs there**.
- **5** 🐧 🧑 creates the two arm repos; 🤖 installs packages and builds matched arm environments; snapshot `tailcut-01-baseline`.
- **6** 🐧 Arm 1 runs → snapshot `tailcut-02-arm1-complete` → restore baseline → Arm 2 runs → snapshot `tailcut-03-arm2-complete`.
- **7** 🐧 Blind judges score both → comparison report (doc 15) → 🧑 emails John → **the single merge to main**.

**Scope:** a quick, practical test — n=1, fully automated, no HITL. Experimental purity is deliberately not chased (Golden Rule 1), and cost/tokens are not measured at all (Rule 8). All work stays on the feature branch until 7.4.

## Starting a session (🧑 Steve pastes this)

Every session begins the same way — a fresh `claude` in the repo root, then this message. Use it on the Mac, in the VM, and after every snapshot restore; the agent works out where it is and what's next.

```
Please read docs/jira-docs/AHQ-192/12-plan-of-action.md and take over as the
driving agent. Work out from the status ledger and git state which phase we are
in, then drive it: do every step marked AGENT yourself, and for every step marked
STEVE give me exact instructions at the moment each one is needed.
```

## Golden Rules

1. **Proportionality — this is a quick test, not a scientific study.** Steve's decision, 2026-07-26. The point is a practical read on whether AHQ improves design quality. It is n=1, fully automated, and nobody's life depends on it. **Experimental purity is explicitly NOT a concern:** repo names that give the game away, git history, commit authorship, the arms sitting next to this repo, workflow-generated files, an arm that could in principle read the research — all **acceptable**. Do not raise them as blockers, do not design elaborate isolation, and do not ask Steve to pick between purity options. Take the cheap route, note it in one sentence in doc 15, move on. **Only two controls are worth keeping, because both are cheap and load-bearing:** (a) the rubric is frozen before either arm runs — it's the difference between measuring and marking your own homework; (b) arm 1 can actually work (permission parity, step 5.3) — without it there is no second arm to compare. Everything else: don't gold-plate it.
2. **Know which machine you are on.** Phases 1–3 on the **Mac**; Phases 4–7 in the **Ubuntu 26.04 VM**, where `gh`, `claude` and Agentic HQ are already set up. Never move interactive, question-and-answer work into the VM to "save a step" — the keystroke lag is why the split exists.
3. **The Snapshot Law (Part B): nothing survives a snapshot restore except what has been pushed to GitHub.** Before instructing any restore: commit + push everything, verify with `git log origin/<branch>` / `gh repo view`, then say "✅ safe to restore" — never instruct a restore without that sentence. **Never restore over an unsnapshotted state**: every restore is immediately preceded by snapshotting the current state. Three snapshots: `tailcut-01-baseline` (5.6), `tailcut-02-arm1-complete` (6.2), `tailcut-03-arm2-complete` (6.5). **Plus one pre-existing fallback, taken by Steve 2026-07-26 before any experiment work: `Snapshot 7 — MCP added, claude updated, sudo granted`.** It is not part of the experiment sequence; it is the restore point for "the VM got broken before `tailcut-01-baseline` existed", and it already contains Claude Code 2.1.220, the MCP config and the passwordless-sudo drop-in.
4. **VM sessions are disposable.** Snapshots are taken powered-off: push → shutdown → snapshot/restore in VMware → boot → fresh `claude` + the kickoff message (4.3). State lives in files and GitHub, never in a conversation. **Every snapshot instruction gives Steve both VMware fields:** a **Name** (`tailcut-NN-<slug>`, indexed) and a **Description** (2–3 sentences: which phase, what's inside, what it's safe to restore for).
5. **Git discipline: all work stays on the feature branch until the very end.** There is no mid-plan merge to main — the single squash-merge happens at 7.4, once everything is done. Commits only via Steve running `/git:02` (WIP) and `/git:03` (final PR); the agent prompts at each commit point but never runs `git add/commit/push` in this repo. (Arm-output repos are governed by doc 13, not this rule.) **Part A must end pushed** — the VM gets Part A by `git pull`, so anything uncommitted on the Mac does not exist in Part B.
6. **Installs need one approval:** present the spec-§2 package list once, get a yes, install, verify. No other unapproved installs.
7. **Don't hand the arms the research.** Each arm gets the stripped handoff spec and its kickoff prompt — that's it. That single cheap step is the whole contamination control; per Rule 1, do not build anything more elaborate on top of it.
8. **Cost and token measurement is OUT OF SCOPE — do not reintroduce it.** Steve's decision, 2026-07-26: subscription plans hide tokens and prices and the workarounds aren't worth the time. No cost comparison and no quality-per-pound framing anywhere. **This supersedes doc 09's fairness confound 2** — do not follow doc 09 on this point. Doc 15 simply states cost was not measured.
9. **Nothing carries across machines or sessions.** No agent memory was migrated to the VM. This folder + the repo CLAUDE.md are the entire context.
10. **This folder is destined for a public repo.** Nothing personal, no non-public company information; keep the Criteo material sourced to their public engineering output.
11. **Minimal bandwidth (Steve's constraint, 2026-08-04: on holiday, on a limited/metered connection).** No `apt update`/`apt upgrade`, no unnecessary downloads, no re-installs of things that already work. Automatic APT upgrades are already disabled (5.1) — leave them off. Everything the experiment needs was installed and verified in Phase 5; if something new genuinely must be downloaded, tell Steve the approximate size and get a yes first. Git push/pull of this repo and the arm repos is fine — it's small and load-bearing.

---

# PART A — 💻 MAC (Phases 1–3)

*On Steve's Mac, in this repo, on the feature branch. No VM involvement.*

## Phase 1 — 💻 Orientation

1.1 🤖 **Work out which machine you are on before anything else** — the plan is split by machine and the phases differ. The working directory tells you: `/Users/…` = the Mac (Part A), `/home/…` = the Ubuntu VM (Part B). If you are in the VM, you are not in Phase 1 — go to Phase 4.
1.2 🤖 Read this plan; use the reading list to find anything else the task needs; read docs 13/14 if they exist. Check `git status`, `git branch --show-current`, `git log --oneline -5`.
1.3 🤖 Verify the Atlassian MCP with a cheap read. Two gotchas: (a) `jira_transition_issue`'s comment parameter needs ADF and errors on Markdown — add comments separately via `jira_add_comment`; (b) MCP read-back of descriptions shows mangled formatting (escaped `**`, dropped chars) even when the UI renders fine — never "fix" formatting from a read-back alone.
1.4 🤖 Report state to Steve: current phase per the ledger, anything unexpected, next step.

## Phase 2 — 💻 Protocol + rubric (doc 13) — the pre-registration gate

> **⚠️ Read doc 09 with the Golden Rules in hand.** Doc 09 is dated 2026-07-23 and argues at length for experimental rigour — token/cost accounting, tight isolation, careful de-confounding. **Golden Rules 1 and 8 supersede all of that**: this is a quick test, purity is not chased, cost is not measured. Take doc 09's *questions* and Steve's *answers*; do not reinstate its rigour recommendations. Where they conflict, the Golden Rules win.

2.1 🤖 Write `13-experiment-protocol-and-judging-rubric.md`, closing doc-09 Q5–Q10 (arm environments, web-access parity, judging mechanics, runs per arm, John email shape). Contents:
   - **Objective gates first** — builds; `run_all.sh` completes unattended; S1 tail is real (P99 ≥ 10× P50); spec acceptance criteria 1–7; the four traps (ECN mask `0xFC`, TSO/GSO/GRO off, RED `bandwidth` param, S6 idle re-promotion).
   - **Then design-quality scoring** — APoSD criteria **plus** framework-neutral ones.
   - **Blind judging** — 3 fresh sessions, randomised repo-a/repo-b, order counterbalanced. Judges run `verify.sh` + one scenario per repo; **the full benchmark reproduction is an objective gate the driving agent runs**, not a judge task (doc 13 §5.3 — trimmed 2026-07-26 to keep the rigour on design quality and off the hours).
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
   - **The full-build stage shape — decided by Steve, 2026-07-27: thin vertical slices, not design-everything-then-build-everything.** A short prologue (spec interrogation; a *rough* module sketch and a *provisional* slice list — no full decomposition, no interfaces for modules that don't exist yet), then a **runtime-length slice loop** — scope → design → failing tests → implement → check → refactor + update the master design doc → commit — returning `more_slices` / `no_more_slices` each pass, so the system gets fatter until complete. Then a big review, big refactor, and final validate/report/push. Slice 1 is a **walking skeleton**. Each slice ends in **one commit**, so `git log` shows the system evolving (this matters for what John is sent). Doc 14 §3 and §5 hold the detail.
   - **This is not TDD, and must never be called TDD** — decided by Steve 2026-07-27 (doc 14 Q5). Ousterhout rejects TDD in print, and his objection is specifically to *tests driving the design*. Here **the design drives the development**: L2 designs the whole slice against the Guides before any check exists, and L4 builds what L2 designed rather than the minimum that turns a check green. The failing check at L3 stays, on the narrower ground that a check never observed failing is not yet evidence — which matters when one unattended process writes both the code and the checks. The cycle is **DESIGN → CHECK-FAILS → CODE → REFACTOR → VERIFY** (doc 14 §2.3 and §5.4).
   - **Runtime-length loops are supported** — an AHQ workflow CLI is a plain TypeScript program that can parse each command's returned output and branch or loop on it (`full-jira-tdd-story-workflow-demo-cli.ts:55-81` iterates test types discovered at runtime). The loop cap and stop conditions live in the TypeScript, where they are deterministic.
   - The mapping, now formalised in **doc 14 §2**: sixteen **Ousterhout Design Principles** (O1–O16), each properly named, referenced and quoted from a public source, plus APoSD's own fourteen **red flags** as the sensors' shared finding vocabulary. Those principles become named **Guides** (G1–G12, each named for its principle) and Böckeler-style **Sensors** (S1–S18), audited end to end in §7.5 as **Principle → Guide → Sensor** so a principle nobody made a Guide cannot hide. Four principles are deliberately sensed-but-not-guided, with reasons. Research pile: [supporting-docs/full-jo-research-notes.md](supporting-docs/full-jo-research-notes.md).
3.3 🧑 Review/approve doc 14 — the mapping is the intellectual heart, worth real review — then `/git:02`. Doc 14 is now frozen.
3.4 🧑 Run `agentic-hq create-workflow` (no `--using`) on the Mac, pointed at this plan for context and doc 14 as the kick-off guidance. **Draft the workflow's actual Plan with that agent** — the source of truth from here on. Workflow sessions are interactive; the driving agent stands by between stages to help interpret questions against the guidance's *intent*, not as an authority.
3.5 🤖 Review the generated workflow against **the create-workflow plan**, with doc 14 only as an intent cross-check; smoke-test what's testable on the Mac; propose fix-ups.
3.6 🧑 `/git:02` at sensible checkpoints. 🤖 Keeps AHQ-193 updated via MCP — transitions, and comments added separately from transitions (1.3).
3.7 🤖→🧑 **Part A exit gate.** Verify the branch is pushed and say: "✅ Part A complete and pushed — Phase 4 can start in the VM."

---

# PART B — 🐧 UBUNTU VM (Phases 4–7)

*Keep VM typing minimal: paste the kickoff, run prepared commands, leave long runs alone.*

## Phase 4 — 🐧 VM start-up & survey

4.1 🧑 Open VMware → start the VM → log in → terminal.
4.2 🧑 Get the repo current (first time `git clone https://github.com/Agentic-HQ/agentic-hq.git`), check out the working branch, `git pull` — **this is how Part A's docs and the new workflow arrive**. `git branch -r` if the branch name has moved on.
4.3 🧑 Start a fresh `claude` in the repo root and paste the standard kickoff message (see *Starting a session*, top of this file). Same message every time, including after every snapshot restore.
4.4 🤖 Orient: read this plan, docs 13 and 14; check git state. Confirm docs 13/14 and the new workflow are present — if not, Part A wasn't pushed; stop and tell Steve.
4.5 🤖 Survey the VM: `gh auth status`; `claude --version` (**expected `2.1.220`**); Atlassian MCP check (gotchas per 1.3); `ls -al ~/.claude` and `cat ~/.claude/settings.json`. **Record the default model and the reasoning effort** — expected **Opus 5 / high**, set by Steve on 2026-07-26; both arms and all judges inherit them, so they are the parity contract (doc 13 §2.2), not trivia. **Verified 2026-07-26: no `~/.claude/CLAUDE.md` on the VM** — Steve's global rules were never copied — but re-confirm rather than assume. **Also inspect `~/.claude.json`** (user-scope config; sits *beside* `~/.claude/`, so `ls ~/.claude` misses it) and list which **MCP servers** it configures — that's a contamination question, not just a config one (see 5.3). **Steve added MCP to the VM on 2026-07-26, so expect servers to be present.** Two things to confirm, not assume: (a) **which** servers; (b) that they are configured at **user scope**, not in a project-scoped `.mcp.json` inside a repo — user scope is what makes both arms see the identical set, and a repo-scoped config would be a silent asymmetry (doc 13 §2.2).
4.6 🤖 **Survey the AHQ toolchain — the VM must now *run* a workflow, not just a benchmark.** `node -v` (22 or 24 LTS line), `corepack enable`, `pnpm install` at the repo root, `npm link`, then `agentic-hq list` and confirm **`birgitta-ousterhout-full-build` appears**. Also `pnpm install` in the new workflow's own `ts-workflow/`. Report gaps to Steve rather than fixing silently — finding this broken now is the entire point of doing it before Phase 6.
4.7 🤖 Survey against spec §2: `uname -r` (≥ 6.8), which packages are present. **Install nothing yet** — that's Phase 5.
4.8 🤖 Report state to Steve.

## Phase 5 — 🐧 Experiment environment prep

5.1 🤖→🧑 Present the spec-§2 package list → Steve approves once → 🤖 `sudo apt install ...`, verify each tool runs.

**The two arms (Steve creates both; decided 2026-07-26):**

| Arm | What it is | GitHub repo (Agentic-HQ org) | Workspace in the VM |
|---|---|---|---|
| **Arm 1** | one shot, no workflow | `tailcut-no-workflow` | `~/dev/claude/agentic-hq/tailcut-no-workflow` |
| **Arm 2** | `birgitta-ousterhout-full-build` | `tailcut` | `~/dev/claude/agentic-hq/tailcut` |

Arm 2 takes the plain `tailcut` name because it is the candidate real product. Both sit next door to the AHQ repo at `~/dev/claude/agentic-hq/agentic-hq` — see the open decision.

5.2 🧑 Steve creates the two repos and clones each to its path above (per doc 09 Q5: repos pre-created by Steve; `gh` available to the arms so they can push). 🤖 Verifies both exist and are writable.
5.3 🤖 Set up each arm's run environment per doc 13. **The requirement changed on 2026-07-26 after two checks — read before designing it:**

   - ✅ **The `~/.claude/CLAUDE.md` problem is moot** — verified absent on the VM, so there is nothing for the arms to inherit.
   - ⚠️ **The live fairness risk is permission parity, in the opposite direction.** Arm 2 runs via the `agentic-hq` CLI, which passes `--allowedTools` granting `Bash`, `Edit`, `Write`, `MultiEdit`, **nine** Atlassian MCP tools, `Skill(agentic-hq-core-plugin:self-termination)` and `Read(<workspace>/.agentic-hq)` (verified in `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts`; the verbatim list is in doc 13 §2.2). Arm 1, as a plain `claude`, gets **none** of it and stalls on its first permission prompt. **Arm 1 needs a matched grant via explicit `--allowedTools`.**
   - ❌ **Not `--dangerously-skip-permissions`** — arm 2 is *confined* to that list, so a blanket flag would give arm 1 strictly more freedom. Match the list, don't exceed it.
   - ℹ️ The granted list includes Atlassian MCP tools, so an arm could in principle search Jira and find AHQ-192. **Per Golden Rule 1, accepted — no need to neutralise it.** Just give both arms the same grant so they're on equal footing, and mention it in doc 15's limitations sentence.
   - ✅ **Web tools (decided, doc 13 Q1):** write an identical `.claude/settings.local.json` granting `WebSearch` + `WebFetch` into **each** arm workspace — same mechanism both sides. Without it, both arms stall on a permission prompt mid-run.
   - ✅ **Passwordless sudo (decided, doc 13 Q4): already done — `/etc/sudoers.d/99-tailcut-nopasswd`, applied and verified on the VM 2026-07-26**, long before the `tailcut-01-baseline` snapshot, so both arms inherit it. Re-confirm with `sudo -k && sudo -n true` in the 5.5 pre-flight rather than trusting this line — a sudoers rule can be valid, read, and still never match.
   - 🤖 Record the grant used in doc 13, so doc 15 can state what each arm was allowed to do.

5.4 🤖 Stage each arm's workspace: the stripped handoff spec + that arm's exact kickoff prompt, written to a file now so run-day is copy-paste only.
5.5 🤖 Pre-flight: both repos pushable; arm permissions **matched** (matched, *not* neutralised — per Golden Rule 1 and doc 13 §2.2, both arms simply get the identical grant, MCP tools included); arm 2 can run the workflow end to end; doc-13 boxes ticked. Then 🧑 `/git:02`, verify pushed.
5.6 🤖→🧑 **SNAPSHOT POINT.** "✅ safe to snapshot. Steve: exit claude, `sudo shutdown now`; in VMware snapshot the powered-off VM with —
   - **Name:** `tailcut-01-baseline`
   - **Description:** *AHQ-192 experiment baseline. End of Phase 5 prep: spec §2 packages installed, both arm workspaces staged, arm GitHub repos created, all work pushed. Restore this for an identical clean starting state for each arm (6.1 and 6.4).*
   — then boot, restart claude, paste the kickoff."

## Phase 6 — 🐧 The runs (one arm, restore, other arm)

6.1 🤖→🧑 Arm 1: exact commands — `claude` in `~/dev/claude/agentic-hq/tailcut-no-workflow` **with the matched `--allowedTools` grant from 5.3** (without it, arm 1 stalls immediately) — then paste the prepared arm-1 prompt and **leave it alone**.
6.2 🤖→🧑 On completion: capture the arm's `RESULTS.md` and benchmark output (**not tokens or cost**) **into `docs/jira-docs/AHQ-192/experiment-results/arm-1/` per doc 13 §6.1** — an uncommitted capture does not survive the restore that follows it; confirm the output is pushed to `Agentic-HQ/tailcut-no-workflow`; note the outcome; 🧑 `/git:02`. Agent verifies both pushes, then: "✅ safe to snapshot & restore. Steve: exit claude, `sudo shutdown now`; in VMware **first take a snapshot** —
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

7.1 🤖→🧑 Blind judging per doc 13: three fresh `claude` sessions with zero AHQ-192 context, agent-prepared judge prompts, repos presented as randomised repo-a/repo-b. Judges run `verify.sh` + one scenario per repo — not the full benchmark (doc 13 §5.3).

> Copy each repo's working tree to `repo-a`/`repo-b` (randomised) so the judge isn't reading `tailcut-no-workflow` in the prompt. That's the extent of the blinding — per Golden Rule 1, don't scrub git history, authorship or workflow-generated files; just note in doc 15 that the blinding was light.

7.2 🤖 Comparison report (doc 15) — the table, not a vibe. **Three dimensions, kept separate** so a strong result in one isn't smuggled into another:
   1. **Objective gates** — spec acceptance criteria 1–7, per arm, pass/fail.
   2. **Traps sprung** — ECN mask `0xFC`, TSO/GSO/GRO off, RED `bandwidth`, S6 idle re-promotion. Objective, pass/fail, and the sharpest discriminator available: exactly the class of thing Guides/Sensors should catch and a one-shot may not.
   3. **Design quality** — blind rubric scores, with judge-to-judge agreement shown, not just the mean.

   **Not a dimension: cost** (Golden Rule 8) — doc 15 states it wasn't measured and makes no efficiency claim either way.

   > **⚠️ Performance numbers do NOT compare cleanly across arms — say so in doc 15.** Each arm builds *its own rig*, so the two headline ratios come from different measuring instruments and the more forgiving harness wins for reasons unrelated to TailCut. Report each arm's numbers **within its own rig**; treat only gates, traps and reproducibility as cross-comparable. *(Option for doc 13 once both outputs exist, not a commitment: cross-run the rigs to separate implementation quality from harness quality — may be impossible if the two chose incompatible interfaces.)*

   **Three disclosures doc 15 must carry** (noted here so they are not forgotten by then): (a) the whole of doc 13 §10 — the rubric was frozen at `be0d017`, amended six times on 2026-07-27 **before either arm ran**, and untouched after; (b) that two of the workflow's own sensors (doc 14's S15 design-it-twice evidence, S16 naming consistency) police Guides that correspond to rubric criteria — legitimate, since both Guides predate the coverage audit and the rubric froze before doc 14 existed, but a reader deserves to be told rather than to notice; (c) cost was not measured (Golden Rule 8).

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

*(Phases only — `git log` is the record of commits, so don't track them here.)*

| Phase | Machine | What | Status |
|---|---|---|---|
| 1 | 💻 | Orientation | ✅ done 2026-07-26 — Mac, branch in sync with origin, MCP verified |
| 2 | 💻 | Doc 13 frozen; stripped handoff spec created | ✅ agent work done 2026-07-26 — doc 13 written (2.1), **approved by Steve with all four open questions agreed (2.2)**, stripped handoff spec created (2.3). **Frozen by the `/git:02` at 2.4.** |
| 3 | 💻 | `birgitta-ousterhout-full-build` built via create-workflow (from scratch) under AHQ-193; pushed | ✅ done 2026-08-04 — 3.1–3.3: doc 14 written, approved and frozen (`e1010c9`). 3.4 (2026-07-29): Steve ran create-workflow from scratch — spec approved ([02a](../../artifacts/workflow-creation-artifacts/agentic-hq-demos-plugin/birgitta-ousterhout-full-build/02a-APPROVED-workflow-spec.md), do-not-read list kept doc 13 out of the build agent's context); 12 commands + TS CLI + SKILL.md + 6 SAMPLEs; all 28 checks PASS (03a); amendment 03b-R4 moved Guide canon to 12 per-Guide docs (`skills/…/docs/guides/G01–G12`, five load-bearing), stage notes inline; help docs written. 3.5 (2026-08-04): driving-agent review — no deviations; Mac smoke tests pass (typecheck, `agentic-hq list`, self-containment greps); decisions-register/findings path fix-up applied to commands 07/09/10/12 (`3d70a95`). **Steve's decision 2026-08-04: Mac loop-test (create-workflow Command 05 / workflow-spec success criterion 3) skipped — first full exercise is the experiment run; 4.6's VM proof is the only pre-run check.** 3.6: AHQ-193 comment added via MCP 2026-08-04. 3.7: Part A exit gate declared — all pushed through `3d70a95` (+ this ledger close-out in the following `/git:02`). |
| 4 | 🐧 | VM start-up, survey, proof the workflow runs there | ✅ done 2026-08-04 — 4.1–4.3 by Steve (VM booted, repo pulled to `0e18fe5`, kickoff pasted). 4.4: docs 13/14 and the workflow all present. 4.5: `gh` authed (`halso`); Claude Code `2.1.220`; **no `~/.claude/CLAUDE.md`** (re-confirmed); model/effort resolved **empirically** — `claude-opus-5[1m]` / `high`, pinned in no config file, so identical by default for both arms (recorded in doc 13 §2.2, §2.6); **MCP parity confirmed** — one server (`mcp-atlassian`), **user scope**, no repo `.mcp.json`. 4.6: node 24.18.0, pnpm 11.1.2, root install already up to date, `npm link` intact, **`agentic-hq full-build` appears in `agentic-hq list`**, and the exact command SKILL.md emits was executed end-to-end (`--help`) from an unrelated cwd — it runs. **One real defect found and fixed:** the workflow's `ts-workflow` install silently completed with `@esbuild/linux-x64` missing (pnpm exited 0 on a failed optional-dep fetch), so `tsx` could not run at all; a clean reinstall fixed it. 4.7: kernel `7.0.0-27` (≥ 6.8 ✓), 2 vCPU, 5 GB RAM; **5 of the 12 spec-§2 packages missing** — `clang`, `llvm`, `libbpf-dev`, `iperf3`, `python3-matplotlib`. |
| 5 | 🐧 | Arm repos + environment prep + `tailcut-01-baseline` | ✅ done 2026-08-04 — **5.6: `tailcut-01-baseline` snapshot taken by Steve 2026-08-04** (powered-off, after push verified at `86d1af9`). 5.1: all 12 spec-§2 packages installed **and each verified to run** — including an eBPF compile against a generated `vmlinux.h` and a netns/veth/tc/ethtool exercise, so no arm discovers a broken toolchain (doc 13 §2.1). **Automatic APT upgrades disabled** before baseline — they had auto-started on boot, held the dpkg lock, and were mid-download of a *kernel* upgrade that would have moved `uname -r` off the spec's `linux-headers-$(uname -r)`. 5.2: both repos created by Steve (private for now; **Steve to flip to public before 7.3**), verified ADMIN + push-tested; both left on `main` with one empty `Initial commit`. 5.3: identical `.claude/settings.local.json` (`WebSearch`+`WebFetch`, md5 `8404ac70…`) in each workspace, repo-local git identity set identically, **web-tools pick-up for arm 2 verified by source** (AHQ launches Claude with `cwd = process.cwd()`, so the `cd` into the arm workspace is load-bearing). 5.4: byte-identical spec staged in both (md5 `f2309082…`); **both exact launch commands written into `experiment-results/run-commands/`** so they survive the restores. **AM7 (Steve, 2026-08-04):** arm 1's frozen prompt amended — commit to `main`, no branches/PRs, use the configured git identity; arm 2 needed no counterpart (verified: `branch`/`checkout`/`PR` appear nowhere in its 12 command files). **Known asymmetry, decided not to "fix":** arm 2 never pushes (by design — *"zero network/auth dependency"*), so **the operator pushes it at 6.4**; the workflow was deliberately not modified, since altering the intervention pre-run is the one change that could invalidate the comparison. 5.5 pre-flight all green: passwordless sudo re-confirmed, both repos pushable, workspaces byte-identical, workflow discoverable from arm 2's workspace. |
| 6 | 🐧 | Arm 1 run → restore → Arm 2 run (outputs pushed) | 🔄 6.1: arm 1 launched 2026-08-04 20:38 per `run-commands/arm-1-launch.md`. **AM8 at ~72k tokens** (doc 13 §10): VM default model is actually `claude-fable-5[1m]` (Steve pinned it pre-snapshot; doc 13's Opus record was stale), and `autoCompactWindow: 200000` added to both arms' `settings.local.json` — arm 1 exited/resumed to pick it up, arm 2 gets it via step 0 of `arm-2-launch.md` post-restore. |
| 7 | 🐧 | Blind judging → doc 15 → John email → **merge to main** | ☐ blocked on 6 |

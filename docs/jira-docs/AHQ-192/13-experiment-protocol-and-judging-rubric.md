# 13 — Experiment Protocol & Judging Rubric

> Written 2026-07-26 on the Mac, during **Phase 2** of [12-plan-of-action.md](12-plan-of-action.md).
>
> **This is the measuring instrument.** It is written and frozen *before* the `birgitta-ousterhout-full-build` workflow exists (Phase 3) and long before either arm runs (Phase 6). That ordering is the entire point: a rubric written after the results are in is not a measurement, it is a rationalisation.
>
> **Authority:** the plan doc's [Golden Rules](12-plan-of-action.md#golden-rules) outrank this document, and both outrank [doc 09](09-claudes-thoughts-and-questions-on-the-proposed-plan.md). Doc 09 supplied the *questions* (Q5–Q10) and Steve's *answers*; its rigour recommendations are superseded — **no token/cost accounting (Rule 8)** and **no elaborate isolation (Rule 1)**.
>
> **Not a plan.** State, phases and next steps live only in doc 12. This document holds the protocol and the rubric. Nothing else.

---

## 0. Freeze status

| | |
|---|---|
| **Drafted** | 2026-07-26 (Phase 2.1) |
| **Approved by Steve** | ✅ 2026-07-26 (Phase 2.2) — all four open questions agreed as recommended; answers on the record in §9, decisions folded into §2 and §5 |
| **Frozen at** | **commit `be0d017`** — *"WIP: AHQ-192 Phase 2 — freeze protocol & judging rubric"*, pushed 2026-07-26 (Phase 2.4). Everything in this document existed, in full, before the `birgitta-ousterhout-full-build` workflow was built and before either arm ran. That is checkable: `git show be0d017`. |
| **Amendable after freeze?** | Only for things that cannot change a score: typos, clarifying wording, and filling in facts the protocol pre-committed to recording (the model name, the permission grant actually used, the a/b assignment). **Any change to a gate, a criterion, a weight or the interpretation table after arm 1 starts must be recorded as an amendment in §10, with a reason and a date, and repeated in doc 15.** |

**§10 is not empty** — six amendments were made on 2026-07-27, all of them **before either arm ran**, following an adversarial review of this document. Doc 15 must reproduce the whole §10 list. The claim available is therefore the precise one: *the rubric was frozen at commit `be0d017`, amended six times before any arm ran, and never touched afterwards* — which is worth stating exactly, and worth not overstating.

---

## 1. What is being compared

| | Arm 1 | Arm 2 |
|---|---|---|
| **Intervention** | none — one-shot, single context | `birgitta-ousterhout-full-build` (multi-stage, Guides & Sensors) |
| **Launched by** | plain `claude` in an empty workspace | `agentic-hq` CLI |
| **Workspace** | `~/dev/claude/agentic-hq/tailcut-no-workflow` | `~/dev/claude/agentic-hq/tailcut` |
| **Output repo** | `Agentic-HQ/tailcut-no-workflow` | `Agentic-HQ/tailcut` |
| **Runs** | 1 | 1 |
| **Human in the loop** | none | none |

Both build **the same thing**: the TailCut single-VM tail-latency benchmark rig, from the same stripped spec (§2.3).

**n = 1 per arm.** Two runs of the *same* arm could differ substantially; this protocol produces a datapoint, not a verdict. Doc 15 and the John email must both say so plainly (doc 09 Q8).

---

## 2. Run configuration — the parity contract

Everything in this section applies **identically to both arms** unless the row says otherwise. Differences here are confounds; the intervention is supposed to be the only difference.

### 2.1 Machine & environment

- One Ubuntu 26.04 VM (VMware on the Mac), the same VM for both arms, restored to the **`tailcut-01-baseline`** snapshot before each arm so the starting state is byte-identical.
- Spec §2 packages pre-installed at baseline. Neither arm should need to install anything; if an arm does install something, that is allowed and gets noted in doc 15.
- Nothing else running in the VM during a run; the Mac kept quiet (spec §11 — VMware timing jitter).
- **Automatic APT upgrades disabled, 2026-08-04, before the baseline snapshot — so both arms inherit the quiet state identically.** On the 2026-08-04 boot, `apt-daily-upgrade.timer` auto-started `unattended-upgrades`, which ran for ~30 minutes and fetched 70 MB before being stopped during its download phase (nothing unpacked; `dpkg --audit` clean afterwards). `apt-daily.timer` and `apt-daily-upgrade.timer` are now **disabled**. Three reasons this belongs in the parity contract rather than in a bandwidth footnote: (a) it holds the dpkg lock, so an arm that tried to install anything mid-run would fail or block; (b) it mutates the environment *during* a run, and would almost certainly hit the two arms at different points, which is precisely the silent asymmetry §2.2 exists to prevent; (c) the package it was midway through fetching was **`linux-modules-7.0.0-28`, a kernel upgrade** — installing it would have moved `uname -r` off `7.0.0-27` and out from under the spec-§2 `linux-headers-$(uname -r)` requirement, breaking the eBPF build. Each restore of `tailcut-01-baseline` inherits the disabled timers, so this does not need redoing per arm.
- **Spec §2 toolchain verified working, not merely installed (2026-08-04, step 5.1):** all twelve packages `install ok installed`; every tool runs; `matplotlib` renders a PNG under the `Agg` backend (which is what AC 1's `chart.png` needs on a headless VM); and a minimal `SEC("tc")` eBPF program with a `BPF_MAP_TYPE_HASH` map **compiles cleanly** against a `bpftool`-generated `vmlinux.h` (166,945 lines) producing a valid object with `tc`, `.maps` and BTF sections. `ip netns` + `veth` + `tc qdisc` + `ethtool -K … tso off gso off gro off` all exercised and torn down. Neither arm should discover a broken toolchain.
- **`"verbose": true` added to `~/.claude/settings.json` on 2026-08-04, before the baseline snapshot** (Steve's request), so the file now reads `{"theme":"dark","verbose":true}`. Its purpose is the **token counter** in the Claude Code footer — per the official status-line docs, verbose mode is what puts it there; it is not a `statusLine` script, and no `statusLine` key exists anywhere on this VM. It is recorded here because `~/.claude/settings.json` is **user scope**, so it is inherited identically by both arms and all three judges — which keeps §2.2's parity contract intact, but makes it a baseline fact rather than a local preference. **Confirmed not to affect arm 2's orchestration:** AHQ hands work between stages entirely through files (`readOutput()` reads `command-output.json` from disk) and detects stage completion by the PTY process exiting — it never scrapes terminal text — so a change in rendered verbosity cannot alter the workflow's control flow. Its only effect on the experiment is that the operator can watch context pressure during the unattended runs.
- **No `~/.claude/CLAUDE.md` on the VM** (verified 2026-07-26; **re-verified 2026-08-04 at plan step 4.5 — still absent**). Doc 09's fairness confound 1 is therefore moot: there is no global instruction file for either arm to inherit.

### 2.2 Permissions, tools, model — matched by construction

**Arm 2's grant is fixed by the AHQ CLI and cannot be varied**, so it is the reference and arm 1 is matched to it. Verbatim from `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` (`DEFAULT_ALLOWED_TOOLS`, read 2026-07-26):

```
Bash
Edit
Write
MultiEdit
mcp__mcp-atlassian__jira_get_issue
mcp__mcp-atlassian__jira_create_issue
mcp__mcp-atlassian__jira_add_comment
mcp__mcp-atlassian__confluence_get_page
mcp__mcp-atlassian__confluence_search
mcp__mcp-atlassian__jira_get_transitions
mcp__mcp-atlassian__jira_transition_issue
mcp__mcp-atlassian__jira_search
mcp__mcp-atlassian__jira_update_issue
Skill(agentic-hq-core-plugin:self-termination)
Read(<ahq-install>/.agentic-hq)
```

*(That is **nine** Atlassian MCP tools, not eight. An earlier doc 12 draft said eight; it was corrected in the same commit that froze this document, so doc 12 and this list now agree. The list above is the counted, verified one.)*

Rules that follow from it:

- **Arm 1 is launched with the same list via explicit `--allowedTools`**, minus the two arm-2-only entries (`Skill(agentic-hq-core-plugin:self-termination)` and `Read(<ahq-install>/.agentic-hq)`), which exist to make the *workflow machinery* work and grant no capability toward building TailCut. The exact command line used is recorded in §2.6 and reproduced in doc 15.
- **Not `--dangerously-skip-permissions`.** Arm 2 is confined to the list; a blanket flag would hand arm 1 strictly more freedom and quietly invert the comparison.
- **The Atlassian MCP tools are in the grant, so either arm could in principle search Jira and find AHQ-192.** Per Golden Rule 1 this is **accepted, not neutralised** — the point is that both arms have the identical grant. Doc 15's limitations sentence says so. *(An earlier doc 12 draft of step 5.5 said "MCP neutralised"; it was corrected to "matched, not neutralised" in the same commit that froze this document. Recorded here only so a reader of the older wording knows which one governs: this paragraph does.)*
  **Steve added MCP to the VM on 2026-07-26**, so this is now a live capability rather than an inert grant — the tools in the list above can actually reach a server. Still accepted; still matched. **But it raises one parity check for 4.5:** confirm the MCP servers are configured at **user scope** (`~/.claude.json`) and not in a project-scoped `.mcp.json` inside a repo. User scope means both arms see the identical set. A project-scoped config sitting in the AHQ repo would be visible to whichever arm runs from a directory that inherits it and not the other — a silent asymmetry in exactly the dimension this section is meant to pin down. Record which servers are configured, and their scope, in doc 15.
  **Checked 2026-08-04 (4.5) — parity holds.** Exactly **one** MCP server is configured, **`mcp-atlassian`** (`uvx mcp-atlassian`, Jira + Confluence against `agentic-hq.atlassian.net`), and it is configured at **user scope** in `~/.claude.json`'s top-level `mcpServers`. There is **no `.mcp.json`** in the AHQ repo, and both project entries in `~/.claude.json` carry `mcpServers: {}` with empty `enabledMcpjsonServers`/`disabledMcpjsonServers`. So both arms see the identical single server, and no repo-scoped config exists to create the asymmetry this check was written to catch. *(Health-check note: `claude mcp list` timed out once on 2026-08-04 while the link was saturated by an unrelated download, then connected in 6.7 s once the link was free — a transient, not a configuration fault. `uvx mcp-atlassian` itself starts from cache with no network fetch.)*
- **Model parity:** AHQ passes **no `--model` flag** (verified — `claude-command-builder.ts` builds plugin-dir args, the allowed-tools flag and the command only), so arm 2 runs on the VM's configured default model. **Arm 1 is therefore also launched with no `--model` flag**, and parity holds by construction.
  **The VM, as of 2026-07-26 (Steve): Claude Code `2.1.220`, default model Opus 5, reasoning effort high.** Both arms and all three judges therefore run **Opus 5 at high reasoning effort**, inherited from the VM's own configuration rather than set per-arm — which is what makes them identical.
  **Re-verified 2026-08-04 at plan step 4.5, empirically rather than from config** — because neither the model nor the effort is pinned in any settings file (`~/.claude/settings.json` contains only `{"theme":"dark"}`, and `~/.claude.json` has no `model` key), so both are CLI defaults that a fresh session resolves for itself. A fresh `claude -p` session with the parent session's `CLAUDE_*` environment stripped resolves to **model `claude-opus-5[1m]`** (Opus 5, 1M-context variant — the precise id, worth naming exactly in doc 15) and **`CLAUDE_EFFORT=high`**. Because nothing pins them, *both arms and all judges resolve the identical defaults by the same mechanism*, which is what §2.2 requires; the risk this row guards against would be a per-session override, and there is none. **Reasoning effort is part of the parity contract, not just the model:** if it were set per-session anywhere, one arm could quietly get more thinking than the other. Re-verify model *and* effort at plan step 4.5, and state both in doc 15.
  *Consequence for the write-up:* arm 1 is **"one-shot Opus 5 (high reasoning)"**, not "one-shot Fable" — doc 08 and the early docs pre-date this choice. Doc 15 and the John email must name the actual model.
- **Web access — granted to both** (Q1, agreed 2026-07-26). Neither `WebSearch` nor `WebFetch` is in the AHQ grant above, so without this both arms would stall on a permission prompt mid-run. Both are granted by the **same mechanism in both arms** — an identical `.claude/settings.local.json` in each arm's workspace:

  ```json
  { "permissions": { "allow": ["WebSearch", "WebFetch"] } }
  ```

  Deliberately *not* granted via arm 1's `--allowedTools`: using one mechanism for arm 1 and a different one for arm 2 invites exactly the sort of asymmetry this section exists to prevent. Arm 1's `--allowedTools` carries only the matched AHQ list. **Pre-flight check (plan 5.5): confirm the file is actually picked up in arm 2's case** — the AHQ CLI runs `claude` from the workspace the operator invokes it in, so verify that is the arm's workspace and not the AHQ repo.
- **Unattended `sudo` — passwordless** (Q4, agreed 2026-07-26). The rig needs root for netns/eBPF/tc throughout (spec §2, §11), and an unattended arm that meets a password prompt is dead on the spot. A single `/etc/sudoers.d/99-tailcut-nopasswd` drop-in granting the VM user `NOPASSWD:ALL`. This is a throwaway experiment VM with nothing on it. Not run-as-root: that changes `$HOME`, which would change the configuration both arms load.
  **✅ Applied and verified on the VM, 2026-07-26** — `sudo -k && sudo -n true` passes, and `sudo -l` lists the `NOPASSWD: ALL` rule. It is in place well before the `tailcut-01-baseline` snapshot, so both arms inherit it identically. *(It took two attempts: the first drop-in named a user that did not exist, so sudo silently ignored the rule — valid syntax, read by `@includedir`, never matched. Exactly the failure mode that would have killed an unattended arm hours into a run, which is why 5.5 re-checks it rather than trusting this note.)*

### 2.3 What each arm receives

1. **`tailcut-benchmark-spec.md`** — the stripped copy at `supporting-docs/experiment-handoff/tailcut-benchmark-spec.md` (revision note removed; it name-drops AHQ-192). Copied into the arm's workspace at plan step 5.4. **This exact file, identical for both arms.**
2. **Its kickoff prompt** (§2.5).

**Nothing else.** No research docs, no plan, no rubric, no Homa material, no APoSD material for arm 1 (that *is* the intervention). This one cheap step is the whole contamination control — Golden Rule 7 says do not build anything more elaborate on top of it.

The arms sit one `cd` from this repo (see doc 12's layout note) and could in principle read it. Accepted per Golden Rule 1; noted in doc 15.

### 2.4 What each arm must produce

Spec §12 already defines the deliverable file set. The protocol adds exactly one experiment-level artifact, **required identically of both arms**:

**`RESULTS.md` at the repo root**, containing:
1. What was built, in the arm's own words (≤ 1 page).
2. How to build and run it, from a clean clone.
3. Headline numbers as measured *by the arm, in its own rig*: per-scenario P50/P99/P99.9, deadline-miss rates, bulk goodput.
4. A self-assessment against spec §12 acceptance criteria 1–7 — pass/fail/not-reached, honestly.
5. Known gaps, shortcuts, and anything not finished.

Everything must be **committed and pushed** to the arm's GitHub repo. Unpushed work does not exist (the VM is snapshot-restored between arms).

### 2.5 Kickoff prompts (frozen wording)

Arm 1's prompt is deliberately **thin and design-neutral**: naming design principles in it would leak the intervention; making it vague would hobble the baseline dishonestly. It states the task, the autonomy policy, and the deliverables — nothing about *how* to design.

**Arm 1 — pasted into a fresh `claude` in `~/dev/claude/agentic-hq/tailcut-no-workflow`:**

```
Build the system described in ./tailcut-benchmark-spec.md, in this repository.

You are running fully autonomously — there is no human available for the whole
run. Do not ask questions and do not wait for approval. Wherever you would
normally ask, choose the option you would have recommended, write the decision
and its reason down, and continue.

Deliverables:
  - Everything listed in the spec's "Deliverables & acceptance criteria" section.
  - RESULTS.md at the repo root containing: what you built; how to build and run
    it from a clean clone; your measured headline numbers (per-scenario P50, P99,
    P99.9, deadline-miss rates, bulk goodput); a pass/fail self-assessment
    against the spec's acceptance criteria 1-7; and a list of known gaps and
    shortcuts.
  - All of it committed and pushed to this repository's GitHub remote (gh is
    installed and authenticated). Work that is not pushed will be lost.
    Commit directly to the main branch - do not create feature branches and do
    not open pull requests. Use the git identity already configured in this
    repository; do not set user.name or user.email yourself.

Run the benchmark yourself and report the real numbers. If a target is not met,
report that honestly rather than adjusting the measurement to reach it.

Stop when the deliverables are complete and pushed.
```

**Arm 2 — the same content, delivered the AHQ way.** Arm 2 is started by running `birgitta-ousterhout-full-build` against the same workspace and spec. The workflow interrogates and stages the work itself; the operator does not hand it design guidance beyond what the workflow contains. The three properties above that are *not* design guidance — **full autonomy with no human available, the `RESULTS.md` requirement, and push-or-it-never-happened** — must reach arm 2 too, via the workflow's own kickoff input. The exact invocation is written to a file at plan step 5.4 and pasted verbatim into doc 15.

> **Asymmetry, stated up front:** the two prompts cannot be literally identical — one launches a plain session, the other launches a workflow. That difference *is* the experiment. What must match is the task, the spec, the deliverables, the autonomy policy and the tool grant.

### 2.6 Recorded at run time (fill in, do not infer later)

| Item | Arm 1 | Arm 2 |
|---|---|---|
| Exact launch command line | **Written and frozen 2026-08-04** (5.4/5.5) → [`experiment-results/run-commands/arm-1-launch.md`](experiment-results/run-commands/arm-1-launch.md). `claude --allowedTools="Bash Edit Write MultiEdit"` + the nine `mcp__mcp-atlassian__*` tools; no `--model`; no `--dangerously-skip-permissions`. *(Confirm at 6.1 that this is what was run.)* | **Written and frozen 2026-08-04** → [`experiment-results/run-commands/arm-2-launch.md`](experiment-results/run-commands/arm-2-launch.md). `agentic-hq full-build -- --spec-file=./tailcut-benchmark-spec.md`, **run from `~/dev/claude/agentic-hq/tailcut`**. *(Confirm at 6.4.)* |
| Web tools mechanism verified | Identical `.claude/settings.local.json` in the workspace (md5 `8404ac70…`) | Same file, same md5. **Pick-up verified by source inspection 2026-08-04:** the AHQ CLI launches Claude Code with `cwd = process.cwd()` (`ClaudeWorkflowCommandBuilder` ← `getCurrentUserWorkspace().getRoot()`), so launching from the arm's workspace is what makes the grant apply — hence the `cd` in the arm-2 procedure is load-bearing. |
| Spec file handed over | `tailcut-benchmark-spec.md`, md5 `f2309082dc009aa0b46454b436317a50` | **Byte-identical** — same md5, same filename, same location |
| Claude Code version | **`2.1.220`** — confirmed on the VM 2026-08-04 (4.5) | *(same VM, same binary)* |
| Resolved model + reasoning effort | **`claude-opus-5[1m]` (Opus 5, 1M context) / effort `high`** — confirmed 2026-08-04 (4.5) | *(same — inherited from the same VM default)* |
| Web tools granted (Q1 outcome) | *(fill)* | *(fill)* |
| Wall-clock start / end | *(fill)* | *(fill)* |
| Ended by | *(completed / stalled / crashed)* | *(completed / stalled / crashed)* |
| Snapshot restored from | `tailcut-01-baseline` | `tailcut-01-baseline` |

**No tokens. No cost. No quality-per-pound.** Golden Rule 8 — do not reintroduce it, not even "just for interest".

---

## 3. Part 1 — Objective gates (pass / fail, no judgement)

> **What these are for (Steve, 2026-07-26): the gates are a *functional floor*, not the headline.** The thing being compared is **design and code quality**. The gates exist to establish that both arms built roughly the same functional thing — so that the design comparison is between two working systems rather than between a system and a sketch. They are not a co-equal scoring dimension, and doc 15 must not lead with the gate count. Read §8 with that weighting in mind.

Evaluated **once per arm by the driving agent**, mechanically, from a **fresh clone of the arm's pushed GitHub repo** into a clean directory — not from the arm's working tree. If it isn't in the push, it doesn't count.

This evaluation is **not blind** — the driving agent knows which repo is which. That is acceptable because every gate below is a mechanical observation with no scoring latitude, and doc 15 states it.

### 3.1 Gates

| # | Gate | Source | Evidence required |
|---|---|---|---|
| **G1** | `make` succeeds from a clean clone | §12 | build log |
| **G2** | `sudo ./run_all.sh` completes **unattended** and emits `results/report.md` **and** `results/chart.png` | AC 1 | run log + both files |
| **G3** | Rig validity: **S1 P99 ≥ 10× S1 P50** | AC 2 | report table |
| **G4** | Headline: **S4 P99 ≤ S1 P99 ÷ 3** | AC 3 | report table |
| **G5** | S2 reported prominently beside S4 (the "how much was just DCTCP" check) | AC 4 | report |
| **G6** | Bulk unharmed: **S4 bulk goodput ≥ 90% of S1's** | AC 5 | iperf3 JSON / report |
| **G7** | Persistent connections: **S6 P99 within ~1.5× of S4's** | AC 6 | report |
| **G8** | `verify.sh` passes in **every** scenario; `teardown.sh` leaves the VM clean; a re-run works | AC 7 | verify + teardown + second run logs |
| **G9** | **All six** scenarios S1–S6 implemented and actually executed | §8 | report has six rows |
| **G10** | Deliverable file set complete | §12 | `ls` of the clone |
| **G11** | Report contains **both** fixed honesty notes: (a) S2's share of S4's win, (b) S5/fq_codel is partly a VM artefact | §9 | report |
| **G12** | Report contains the **deadline-miss table** (100 ms and 200 ms) and the **bulk-goodput table** | §9 | report |

**Scoring:** each gate is PASS, FAIL, or NOT REACHED (the run never got far enough). Report the count, and list the failures individually — "8/12" hides which eight.

**G4 is a target, not a disqualifier.** The spec itself says to report honestly if it isn't met. An arm that misses G4 and says so scores better on honesty criteria (N4) than an arm that hits it by weakening the measurement — and **§3.3 exists to catch exactly that**.

### 3.2 Measurement integrity (the anti-fiction check)

Before any gate result is believed, confirm per arm:

- The numbers in `RESULTS.md` and `results/report.md` **match the output of the driving agent's own re-run**, within VM jitter. Material divergence is a finding, reported prominently in doc 15.
- The rig actually measures what it claims: the baseline (S1) is a **plain deep FIFO**, not fq_codel or anything else that rescues small flows for free (spec §4's "important confound"); the RPC client really opens fresh connections in S1–S5 and really persists in S6; warm-up discard and 3 reps are actually implemented, not just described.
- No scenario's result is hard-coded, cached, or synthesised.

An arm that manufactured its numbers fails this check and doc 15 leads with that, regardless of every other score.

### 3.3 The four traps

Pre-registered because they are the sharpest available discriminator: each is a small, specific, easy-to-get-wrong detail whose absence silently produces plausible-looking-but-wrong results. Exactly the class of thing Guides and Sensors are supposed to catch and a single-context one-shot may not.

| # | Trap | Static evidence | Runtime evidence |
|---|---|---|---|
| **T1** | ECN bits preserved when writing DSCP (**mask `0xFC`**) | marker source preserves the low 2 bits of the ToS byte | ECT observed on data packets in S2/S4/S6 (sanity 4); `ss -ti` shows `dctcp` (sanity 2) |
| **T2** | **TSO/GSO/GRO off** on *all* veth ends | `ethtool -K ... tso off gso off gro off` in topology setup | `ethtool -k` verification passes for every veth (sanity 5) |
| **T3** | RED configured with the **`bandwidth`** parameter | `bandwidth 100mbit` present in the RED qdisc line | `tc -s qdisc` shows non-zero ECN marking in S2/S4/S6 |
| **T4** | **S6 idle re-promotion** (reset byte count after > 50 ms idle) | idle-reset logic present in the marker | map dump shows the reset across an idle gap, or tcpdump shows tos `0xb8` regained (sanity 7) |

Each trap is **SPRUNG** (handled correctly, with evidence) or **HIT** (missing, or present in code but unevidenced at runtime). "In the code but never verified" counts as HIT — the spec asks for the evidence, and unverified correctness is the failure mode under test.

> **Honesty note, pre-registered:** all four traps are **stated in the spec** (§4, §6, §11) — they are not hidden. So this dimension measures **thoroughness and compliance**, not discovery. Doc 15 must say that sentence; it is materially different from "the workflow found things the one-shot missed".

A fifth pitfall (prio-as-child-of-HTB classid plumbing, §11) and any others observed are reported as **commentary only** — not scored, because they were not pre-registered.

---

## 4. Part 2 — Design-quality rubric (scored blind)

Two blocks, **scored and reported separately, never merged into one number**.

Block A is APoSD — the hypothesis. Block N is framework-neutral — the check against tautology. **Judging purely by APoSD criteria would favour the APoSD-encoded workflow by construction**; if arm 2 wins A but not N, that is a much weaker result than winning both, and doc 15 must say so.

### 4.1 Scale

**1–5 per criterion.** 1 = poor or absent · 3 = adequate, what a competent engineer would produce without thinking hard about it · 5 = exemplary. 2 and 4 are the in-betweens. `N/A` is allowed only where the arm produced nothing to judge (e.g. it never wrote a marker at all); an `N/A` is reported, not silently dropped from the mean.

**Every score needs evidence** — at least one concrete `file:line` or a named function/module. A score with no citation is discarded and re-requested. This is the main defence against vibes.

### 4.2 Block A — APoSD criteria

| # | Criterion | A 5 looks like | A 1 looks like |
|---|---|---|---|
| **A1** | **Module depth** — functionality behind interface | The marker, the topology and the analysis each sit behind a small interface hiding substantial machinery | Thin pass-through wrappers; every module's interface is nearly as large as its implementation |
| **A2** | **Information hiding** | DSCP values, qdisc handles, band numbers and map layout are each known in exactly one place | Magic ToS bytes and band numbers scattered across shell, C and Python |
| **A3** | **Change amplification** | Changing a threshold, a band mapping or a scenario touches one place | Adding a scenario means editing five files consistently or it silently misbehaves |
| **A4** | **Cognitive load / unknown unknowns** | A newcomer can tell what to touch and what will bite them; the non-obvious couplings are called out | Correct usage depends on knowledge that exists nowhere in the repo |
| **A5** | **Define errors out of existence** | Idempotent teardown, setup that cannot half-succeed, config validated once at the edge | Every caller re-checks the same failure; teardown that errors if run twice |
| **A6** | **General-purpose over special-purpose** | The scenario runner is parameterised over the qdisc/CC/mode dimensions rather than six near-copies | Six copy-pasted scenario scripts diverging in small ways |
| **A7** | **Comments as design** | Interface comments state the abstraction and the *why*; the non-obvious traps are documented where they bite | Comments restate the code (`// increment bytes`); the ECN mask has no explanation |
| **A8** | **Naming & consistency** | Precise, consistent names across C, shell and Python | The same concept named three ways; vague `data`/`tmp`/`do_it` |
| **A9** | **Design-it-twice evidence** | Somewhere — docs, comments, commits — an alternative was considered and rejected with a reason | No sign any choice was ever weighed |

### 4.3 Block N — framework-neutral criteria

| # | Criterion | A 5 looks like | A 1 looks like |
|---|---|---|---|
| **N1** | **Would a senior engineer accept this PR?** (holistic) | Yes, with minor comments | Would be sent back wholesale |
| **N2** | **Correctness & robustness** | Error paths handled; partial failures leave a clean VM; no silent fallbacks | Happy path only; failure leaves stray namespaces and qdiscs |
| **N3** | **Reproducibility & operability** | One command, clean clone to report; useful diagnostics when a scenario fails | Undocumented manual steps; failures produce nothing to act on |
| **N4** | **Documentation accuracy & honesty** | README matches reality; claims match measured numbers; limitations stated unprompted | README describes a system that isn't there; unmet targets glossed |
| **N5** | **Verification depth** | `verify.sh` genuinely proves each mechanism is live, not just that commands exited 0 | `verify.sh` greps for a string and declares success |
| **N6** | **Soundness of the measuring rig** | Warm-up, repetitions, pooled percentiles, retransmit deltas — all real; a sceptic would trust the table | Single short run; percentiles from a handful of samples |

### 4.4 Reporting the scores

For each arm report: **Block A mean, Block N mean, and every individual criterion** — never a single combined "design score". Alongside each criterion: the **spread across judges** (max − min). Any criterion where judges differ by **≥ 2** is flagged in doc 15 and quoted, not averaged away — disagreement is a result, and averaging is how it gets hidden.

---

## 5. Part 3 — Blind judging mechanics

### 5.1 Setup

- **Three judges** (Q2, agreed 2026-07-26), each a **fresh `claude` session with zero AHQ-192 context**, started outside this repo so the research docs are not one `cd` away.
- Each judge sees **both** repos, as `repo-a` and `repo-b`, in a dedicated judging directory: `~/judging/judge-N/repo-a`, `~/judging/judge-N/repo-b`.
- The repos are **copied working trees** (`.git` removed) so the judge is not reading `tailcut-no-workflow` in a remote URL or a commit message. **That is the extent of the blinding.** Per Golden Rule 1: no scrubbing of workflow-generated files, no rewriting of history, no laundering of authorship. Doc 15 states the blinding was light.
- **All three judges are launched identically** — the same command, from their own `~/judging/judge-N/` directory, differing only in `N`. The grant is **`Bash` and `Write` and nothing else**: `Bash` to run `verify.sh` and a scenario (§5.3), `Write` to produce `verdict.md`. **No `WebSearch`, no `WebFetch`, and no `.claude/settings.local.json` in any judging directory** — for the arms web access was a parity question, but for judges it is a *blinding* question: a judge with web access can unblind itself in one query, and "judge only what is in front of you" implies no web anyway. No `--model` flag, as everywhere else (§2.2). The exact command is written down during plan step 7.1 prep and reproduced in doc 15 beside the two arm command lines.
- **Assignment randomised**, then **counterbalanced**: judge 1 and judge 3 receive one ordering, judge 2 the reverse, so `repo-a` is not always the same arm and position effects cancel. The mapping is written to `experiment-results/judging/assignment.md` **in this repo** (§6.1 — which no judge can see) before judging starts, and is not opened until all judge outputs are saved.
- **Git history is excluded from blind judging** — it is the biggest provenance leak (`.agentic-hq` artifacts, commit cadence, authorship). Commit hygiene, if assessed at all, is assessed **later, non-blind, by Steve and the driving agent**, and labelled as such in doc 15 (plan step 7.2).

### 5.2 Judge prompt (frozen wording)

```
You are reviewing two independent implementations of the same specification.
They were produced by two different processes; you are not told which, and you
should not try to work it out. Judge only what is in front of you.

  ./spec.md    the specification both were given
  ./repo-a     implementation A
  ./repo-b     implementation B
  ./rubric.md  the scoring rubric

Read the spec first, then each repo in the order they are listed above. Score
BOTH repos against EVERY criterion in rubric.md, 1-5.

Before scoring, run things. In each repo: run ./verify.sh, and run ONE scenario
of your choice - the SAME scenario in both repos - using whatever commands that
repo's own documentation tells you to use. sudo is available without a password.
Use what happens as evidence for the reproducibility and verification-depth
criteria. If something fails to run, that is evidence too: record what you tried
and what happened, and score accordingly.

For every single score you must cite concrete evidence: a file:line, or a named
function or module. A score without evidence is not usable.

Score the two repos independently against the rubric's descriptions of 1, 3 and
5 - do not grade on a curve against each other, and do not feel obliged to
separate them if they are genuinely similar.

Write your answer to ./verdict.md in this format:

  ## Block A - APoSD
  | # | repo-a | evidence | repo-b | evidence |
  ## Block N - Framework-neutral
  | # | repo-a | evidence | repo-b | evidence |
  ## Notes
  - anything that struck you that the rubric did not ask about
  - anything you could not assess, and why

Do not summarise your conclusion as a winner. Just score and cite.
```

The judge receives: the stripped spec, both repo copies, and a **judge-facing extract of §4 only** (`rubric.md` — scale, Block A, Block N). **Not** this whole document: §1, §2, §3.3 and §8 would tell the judge what the experiment is and what the "right" answer looks like.

### 5.3 Reproduction by judges

The **objective reproduction** (gates G1–G12, §3) is done once per arm by the driving agent and is **not** the judges' job — no judge re-runs the full `run_all.sh`. Judges assess **design**, plus one runtime task each: run `verify.sh` and one scenario of their choice in each repo, so N3 and N5 are grounded in something executed rather than read. That is enough to catch "this doesn't actually run", which is the only thing a judge needs execution for; the reproducibility question is already answered mechanically in §3.

Judges run in the same VM, after `tailcut-03-arm2-complete` is taken (plan step 6.5) — so a judge that wrecks the netns state costs nothing.

### 5.4 If a judge session fails

If a judge stalls, refuses, or returns unusable output (no citations), **discard it entirely and run a replacement judge with a fresh session**, and record in doc 15 that it happened. Do not repair a partial verdict by hand — a half-hand-written verdict is not a blind score.

---

## 6. Part 4 — Per-arm capture

Captured after each arm completes, before the snapshot (plan steps 6.2 / 6.4):

1. The arm's **`RESULTS.md`** and its `results/` directory (`report.md`, `chart.png`, raw CSVs, iperf3 JSON).
2. The driving agent's **own re-run output** from a fresh clone (§3) — logs, `results/`, and the gate table.
3. The **verify.sh** output per scenario.
4. **Wall-clock** start/end and how the run ended (completed / stalled / crashed) — §2.6.
5. Anything the arm installed, changed outside its workspace, or did that the protocol did not anticipate.

**Not captured: tokens, cost, price, or any efficiency proxy** (Golden Rule 8). Doc 15 states cost was not measured and makes **no** efficiency claim in either direction.

### 6.1 Where captured artifacts go

Everything above lands under **one** parent directory in this repo:

```
docs/jira-docs/AHQ-192/experiment-results/
├── arm-1/          RESULTS.md, results/, driving agent's re-run logs, gate table, verify output
├── arm-2/          the same
└── judging/        assignment.md, judge-1..3 verdict.md, the judge launch command
```

**The Snapshot Law makes this load-bearing, not tidiness.** Every capture must be committed via `/git:02` and pushed **before any snapshot restore** — a gate log or a judge verdict sitting in an uncommitted working tree does not survive the restore that follows it, and cannot be regenerated once the VM is back at baseline.

---

## 7. Part 5 — How performance numbers are treated (pre-registered)

**Decided now, before any number exists**, because deciding it afterwards would look exactly like explaining away an unwelcome result.

- **Each arm builds its own measuring rig.** The two headline ratios therefore come from **different instruments**. A more forgiving harness — shorter runs, gentler bulk load, a baseline that isn't quite a plain deep FIFO — produces a bigger ratio for reasons that have nothing to do with TailCut.
- **Consequence:** performance figures are reported **within each arm's own rig** and are **NOT cross-comparable**. Doc 15 must not contain a sentence of the form "arm 2 achieved 7.2× versus arm 1's 4.1×, so arm 2 built a better system."
- **Cross-comparable dimensions are only:** the objective gates (§3.1), the traps (§3.3), measurement integrity (§3.2), and the blind design scores (§4).
- **Optional, not a commitment:** once both outputs exist, cross-running the rigs — arm 1's implementation in arm 2's harness and vice versa — would separate implementation quality from harness quality. It may be impossible if the two chose incompatible interfaces. If it is cheap, do it and report it as a bonus; if not, drop it without comment.

---

## 8. Part 6 — What counts as a result (pre-registered interpretation)

Written before the runs so the conclusion is a lookup, not an argument.

**The headline is design quality (§4).** Gates and traps are the qualifier — they establish that both arms built a comparably functional system, and they change the *wording* of the result rather than being averaged into it.

**Step 1 — is the comparison valid at all?**

| | Condition | Consequence |
|---|---|---|
| **Void** | Either arm stalled, crashed, or failed §3.2 measurement integrity | No comparison. Report what happened instead — a stalled arm is a finding about *unattended operation*, not about design. |
| **Lopsided** | One arm's gate result is so much worse that the two systems aren't functionally comparable (e.g. one never got the rig running at all) | The design scores are reported **with that stated in the same breath**: comparing a working system to a partial one flatters the working one on nearly every criterion. |
| **Comparable** | Both arms produced a system that builds and runs, with broadly similar gate results | Proceed to step 2 and let the design scores carry the result. |

**Step 2 — the design-quality result** (given "comparable").

**Three definitions, fixed here so nothing is decided by interpretation later:**

- **ΔA** = arm 2's Block A mean − arm 1's Block A mean, pooled across the three judges. **ΔN** likewise for Block N. Positive favours arm 2.
- A block **favours** an arm when |Δ| **> 0.5** in that arm's direction. Otherwise that block is **level**.
- A **reversal** is a judge whose *own* Block A mean **and** *own* Block N mean **both** favour the arm opposite to the overall direction of Δ. One block disagreeing is not a reversal; a whole judge pointing the other way is.

**The rule is total — every (ΔA, ΔN, reversal) combination lands on exactly one row. First matching row wins.**

| # | Outcome | Condition | How doc 15 states it |
|---|---|---|---|
| 1 | **Clear win for AHQ** | ΔA ≥ +0.75 **and** ΔN ≥ +0.75 **and** no reversal | "The workflow produced a materially better-designed system on this task." |
| 2 | **Clear loss** | ΔA ≤ −0.75 **and** ΔN ≤ −0.75 **and** no reversal | Reported as plainly as a win would be — in doc 15 **and** in the email to John. |
| 3 | **Wash** | \|ΔA\| ≤ 0.5 **and** \|ΔN\| ≤ 0.5 | "No detectable difference in design quality on this task at n=1." No spin. |
| 4 | **Mixed** | everything else | Both Δs reported, with the mandatory wording for the sub-case below. Never a footnote. |

**Row 4 sub-cases — also total, because "both blocks level" is unreachable here (row 3 catches it):**

| Sub-case | Mandatory framing in doc 15 |
|---|---|
| **Both blocks favour arm 2** (so it missed row 1 on margin, or on a reversal) | "Directional, below the pre-registered bar." If a reversal exists, say so in the same sentence. |
| **Both blocks favour arm 1** | The mirror, stated as plainly. |
| **Block A favours arm 2, Block N level** | Reported as ***possibly tautological*** — an APoSD rubric flattering an APoSD workflow. This is the weakest form of a positive result and must not be written as anything stronger. |
| **Block N favours arm 2, Block A level** | "Better code, but not distinctively APoSD-shaped — **the hypothesis is not supported even though the product is better**." |
| **Block A favours arm 1, Block N level** | The mirror of the tautology case. |
| **Block N favours arm 1, Block A level** | The mirror. |
| **The two blocks favour opposite arms** | Report both, and state that this is the strongest available evidence that **the two blocks are measuring different things** — which is exactly what Block N exists to detect. Draw no overall winner. |

*(Sanity-checked against adversarial pairs before freezing: ΔA = −0.2 / ΔN = +0.9 → row 4, "Block N favours arm 2, Block A level". ΔA = ΔN = +0.6 → row 4, "directional, below the bar". ΔA = +0.9 / ΔN = −0.9 → row 4, opposite arms. ΔA = ΔN = +0.5 → row 3, Wash.)*

**Traps (§3.3)** are reported alongside as **supporting evidence for the design story**, not as a score: they are the concrete, checkable instances of "did this process catch the fiddly thing", and a trap result that contradicts the design scores is worth more discussion than either number alone.

**Pre-committed:** the result is written up and sent whichever way it falls. This is recorded here specifically so that a disappointing result cannot later be quietly reframed as "the experiment needs redesigning".

---

## 9. Open questions for Steve — **all closed 2026-07-26**

*(doc-01 convention: recommendation first, answer in-place. Kept verbatim as the record of what was decided and why; the operative versions of these decisions live in §2 and §5 — if they ever disagree, §2/§5 are what the runs follow.)*

### Q1. Web access — grant it to both arms, or deny it to both?

Doc 09 Q6 was answered "yes, both, equally", but the AHQ CLI grant contains **no `WebSearch` and no `WebFetch`**, so as things stand both arms would hit a permission prompt and, unattended, stall or be denied. Two ways to honour "equally":

- **(a) Grant both** — add `WebSearch` and `WebFetch` to arm 1's `--allowedTools`, and to arm 2 via a `.claude/settings.local.json` in **each** arm workspace (equal by construction, no AHQ source change). Closest to doc 09's answer and to how real developers work.
- **(b) Deny both** — leave the grant as-is and state that neither arm had web access. Simpler, and the spec is self-contained enough to build from — but it is a different experiment from the one doc 09 approved, and an arm that *wants* to look something up may burn its run stalling on a prompt.

**Recommended answer: (a) — grant both.** It matches the approved answer, it removes a stall risk, and the settings-file route keeps the two arms identical without touching AHQ code.

**Answer:** Agreed

### Q2. How many judges, and how much do they re-run?

**Revised 2026-07-26 after Steve's steer** ("design/code quality is the headline; the other stuff just needs to be roughly similar"). Judge count is where rigour buys the headline result — three independent scorers is what makes a design difference believable rather than one session's opinion. Re-running the benchmark is "other stuff", and it is where the hours go: a full `run_all.sh` is ≈ 20 min *minimum* (6 scenarios × 60 s × 3 reps + setup), so judge re-runs would add 1–3 hours of VM babysitting and tell us nothing the objective gates haven't already established.

**Recommended answer: three judges, and no judge re-runs the full benchmark.** Each judge runs only `verify.sh` plus one scenario in each repo — enough to ground the "does it actually run" criteria in something executed. The full reproduction is done once per arm by me as gate G2/G3.

**Cost to you: three pasted prompts, no long waits.** 

**Answer:** Agreed

### Q3. Model parity — confirm the "no `--model` anywhere" approach?

AHQ passes no `--model`, so arm 2 gets the VM's default. Launching arm 1 without `--model` too makes them identical by construction, whatever that default happens to be.

**Update 2026-07-26 (Steve):** the VM is now on Claude Code **2.1.220** with default model **Opus 5, high reasoning effort** — set at the VM level, so both arms and all judges inherit it. That is the "change the default before the baseline snapshot" step already taken, and it makes the parity question concrete rather than hypothetical.

**Recommended answer: yes — no `--model` flag anywhere, for either arm or any judge.** Confirm model *and* reasoning effort at plan step 4.5, and state both in doc 15. One knock-on: arm 1 is **"one-shot Opus 5 (high reasoning)"** — the earlier docs' "one-shot Fable" wording is now wrong and the write-up must name the real model.

**Answer:** Agreed

### Q4. Unattended `sudo` in the VM

The rig needs root throughout (spec §2, §11). An unattended arm that meets a `sudo` password prompt is dead on the spot.

**Recommended answer: give the VM user passwordless sudo** (a single `/etc/sudoers.d/` drop-in), verified in the plan's 5.5 pre-flight before the baseline snapshot, so it is identical for both arms. The alternative — running the arm sessions as root — makes Claude Code complain and changes `$HOME`, which changes the config both arms load. This is a throwaway experiment VM, not a machine with secrets on it.

**Answer:** Agreed

---

## 10. Amendments after freeze

*(Any entry here needs: date, what changed, why, and whether any arm had already run. Repeat the whole list in doc 15.)*

**All six amendments below were made on 2026-07-27, before any arm had run** — the `birgitta-ousterhout-full-build` workflow did not yet exist and neither arm had been started. They arise from an adversarial review of this document by a separate Claude Fable 5 session, commissioned by Steve for exactly this purpose. None of them changes a gate, a criterion or a weight; AM2 makes an existing interpretation rule total rather than altering where its thresholds sit.

> **Note on IDs.** Amendments are **AM1–AM6**. They are deliberately *not* numbered A1–A6, because **A1–A9 already mean the Block A rubric criteria** in §4.2 — and doc 15 has to reproduce both this table and the per-criterion scores. The bracketed reference in each row is the item number used by the Fable 5 review document, kept so the two can be matched up.

| # | Date | Arm run? | What changed | Why |
|---|---|---|---|---|
| **AM1** *(review A1)* | 2026-07-27 | No | **§5.2 judge prompt** — added a paragraph instructing judges to run `verify.sh` and one scenario, **the same scenario in both repos**, before scoring; noted passwordless sudo; made a failure-to-run an evidenced outcome rather than a blocker. | §5.3 required judges to execute something — it is the entire basis for grounding N3 and N5 in observation rather than reading — but the frozen prompt never told them to. As frozen, all three judges would have scored from reading alone and the gap would have surfaced at plan step 7.1, too late to fix without unfreezing mid-judging. |
| **AM2** *(review A2)* | 2026-07-27 | No | **§8 Step 2** — replaced the four-outcome table with a **total** decision rule: explicit definitions of ΔA/ΔN, "favours" (\|Δ\| > 0.5) and "reversal"; four first-match rows; seven exhaustive Mixed sub-cases with mandatory wording. | The original was not total. At least three real outcomes mapped to no row — ahead on both blocks but by 0.5–0.75; ahead on Block N but not Block A (the reverse-tautology case, arguably the most informative result available); and an ambiguity in "ahead on A but not N". A pre-registered lookup with holes forces post-hoc judgement at precisely the moment pre-registration exists to prevent it. **Thresholds are unchanged** — 0.75 for a clear result, 0.5 for a wash — so no outcome that had a row before has moved. |
| **AM3** *(review A3)* | 2026-07-27 | No | **§5.1** — added judge session mechanics: all three launched identically from `~/judging/judge-N/`, granted **`Bash` and `Write` only**, explicitly **no web tools and no `settings.local.json`** in judging directories, no `--model`; exact command recorded in doc 15. | §2.2 pinned the arms' permissions to the word and said nothing about judges, leaving judging-day improvisation and the real risk of three unmatched judges. Web access is a **blinding** question for judges rather than a parity one: a judge with `WebSearch` can unblind itself in a single query, and the prompt's "judge only what is in front of you" already implies no web. |
| **AM4** *(review A4)* | 2026-07-27 | No | **This entry** retires doc 09 Q8's rider: **no second round regardless of closeness.** | Doc 09 Q8's agreed answer included "pre-commit to a second round only if the result is close". This document carried n=1 forward but never explicitly rescinded the rider, and the Wash row is exactly where it would have been invoked. Retired under Golden Rule 1 (proportionality) — a second round is a second full run of an arm, which is not a proportionate response to a close result in a deliberately quick test. Doc 15 states n=1 with no contingent second round. |
| **AM5** *(review A5)* | 2026-07-27 | No | **§2.2** — two parentheticals rewritten to mark them as historical (the "doc 12 says eight" note and the "MCP neutralised" note). | Both described doc 12 as it stood *before* commit `be0d017`, which itself corrected doc 12 to nine and to "matched, not neutralised". A cold-start agent told to treat doc 12 as the source of truth would have found both claims false and had no way to tell which document was stale. Clarifying wording only — the permitted class under §0. |
| **AM6** *(review A6)* | 2026-07-27 | No | **New §6.1** — one parent directory for all captured artifacts (`docs/jira-docs/AHQ-192/experiment-results/` with `arm-1/`, `arm-2/`, `judging/`), and §5.1's `assignment.md` path updated to match. | §6 listed five things to capture per arm and gave no destination. Under the Snapshot Law an uncommitted capture does not survive the restore that immediately follows it, and cannot be regenerated once the VM is back at baseline — so "where does this file go" is a data-loss question, not a filing one. |
| **AM7** | 2026-08-04 | **No** — found at plan step 5.3/5.5 pre-flight, before either arm started | **§2.5 arm-1 kickoff prompt** — three operational sentences added to the deliverables bullet: commit **directly to `main`**, do not create feature branches or open pull requests, and use the repository's already-configured git identity rather than setting `user.name`/`user.email`. **Steve's decision, 2026-08-04**, after he raised the branching risk directly. | Two failure modes, both of which void an arm rather than score it. **(a) Branching.** §3 evaluates every gate from a **fresh clone of the pushed repo**, which checks out `main`. An arm that did its work on a feature branch and opened a PR would present an empty `main` and score **FAIL on all twelve gates** despite having built a working system — an artefact of git workflow, measuring nothing the rubric is about. Arm 1's frozen prompt was silent on branches while handing it an authenticated `gh`, which is precisely the setup that invites a PR. **(b) Git identity.** A commit authored with a private email is rejected by GitHub (`GH007`) when push protection is on; an unattended arm meeting that has no way past it and loses the run. **Why this does not favour arm 1:** both sentences are operational plumbing, incapable of improving its *design* score on any Block A or Block N criterion — and both merely give arm 1, in words, guarantees **arm 2 already has structurally** (see the note below the table). The amendment equalises the arms; it does not differentiate them. |

**What arm 2 has structurally, and why AM7 needed no counterpart in the workflow.** Both guarantees AM7 gives arm 1 in words, arm 2 already holds by construction — verified 2026-08-04 by reading all twelve command files:

- **Branching:** the strings `branch`, `checkout`, `pull request` and `PR` **do not appear anywhere in the twelve command files.** Every committing stage says only "make one commit in `{project-root}`", so the workflow commits on whatever branch is checked out — `main` — and has no mechanism by which it could wander onto another. Adding a "use main" instruction to the workflow would have changed the intervention to state something it already guarantees.
- **Git identity:** neither arm sets one. Both workspaces carry a repo-local `user.name`/`user.email` (the `…@users.noreply.github.com` form) written at plan step 5.3, identically, before the baseline snapshot.

**The one genuine asymmetry: who pushes.** Arm 1 pushes its own work; **arm 2 never pushes at all.** This is deliberate in the intervention, not an oversight — command 12 (E3) carries a step titled *"Final Commit — No Push"* and states *"Pushing is the operator's deliberate post-run step; the run has zero network/auth dependency by design."* Arm 2's output is therefore pushed **by the operator** at plan step 6.4, which is the workflow's own documented procedure rather than a workaround.

Three things follow, and doc 15 must carry all of them:

1. **Nothing the rubric scores depends on who pushed.** Gates are evaluated from a fresh clone of the pushed repo (§3); both repos are pushed by the time that happens. No Block A or Block N criterion asks whether the agent performed the push itself.
2. **The workflow was deliberately not modified to push.** Changing a command file on the eve of the run is the one class of change with real power to invalidate the comparison — everything else adjusted at plan steps 4.x/5.x is environment, identical for both arms. The "zero network/auth dependency" property is a considered design decision of the intervention, and removing it to tidy the experiment's bookkeeping would mean destroying a property in order to measure more conveniently.
3. **It cuts slightly in arm 2's favour, and that is the honest way to report it.** Arm 1 spends part of its run on push mechanics and *can fail at them* — a botched push loses the run outright; arm 2 cannot fail that way. That difference in robustness is a real property of the intervention rather than an artefact of the protocol, and doc 15 should say so plainly instead of burying it.

**Operational consequence, recorded here because forgetting it is unrecoverable:** under the Snapshot Law an unpushed arm-2 run is destroyed by the restore that follows it. The driving agent must never issue the words "safe to snapshot" or "safe to restore" for arm 2 without first confirming `git log origin/main` on `Agentic-HQ/tailcut` shows the run's commits.

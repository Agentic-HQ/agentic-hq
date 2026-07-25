# Plan of Action

> Written 2026-07-25, immediately before this session was closed — the next session starts with a **brand-new agent and a clean context**. This is the agreed sequence for taking AHQ-192 from "targets pinned" (doc 11) to "experiment run, judged, and sent to John".
>
> **New agent: read [supporting-docs/section-12-post-clear-agent-reading-list-and-pointers-orientation.md](supporting-docs/section-12-post-clear-agent-reading-list-and-pointers-orientation.md) FIRST** — it explains what this Jira is, how the docs were produced, the fast-orientation reading list, key state facts, and trip-hazards. Do not start work from this plan alone.

## Step 1 — Commit the AHQ-192 work *(immediate; Steve runs `/commit`)*

The entire `docs/jira-docs/AHQ-192/` folder (docs 01–12, the revised spec, the full transcript) is untracked. Commit before anything else so no work rides on session memory. This lands as a **WIP commit on a feature branch**, merged to main later. Two follow-ons tied to it: paste [supporting-docs/AHQ-192-updated-Description.md](supporting-docs/AHQ-192-updated-Description.md) into the Jira as its new description (its GitHub links point at `main`, so they resolve only after the merge), and note the Jira then describes the *whole* experiment, not just the original research.

## Step 2 — Freeze the experiment protocol + judging rubric *(the new session's first task; highest leverage)*

One new doc (13 is the next free number), written **before either arm runs** — pre-registration was the one requirement both design conversations independently insisted on. It must:

- **Close the still-live doc-09 questions:** arm-1 clean environment (Q5), web-access parity (Q6), judging protocol (Q7), runs per arm (Q8), workflow prerequisites (Q9), John email shape (Q10). (Q1–Q4 are dead — TailCut's spec replaced the Amoh requirement-doc plan.)
- **Define the rubric, objective gates first:** builds; `run_all.sh` completes unattended; S1 manufactures a real tail (P99 ≥ 10× P50); spec acceptance criteria 1–7 met; the four planted traps dodged (ECN-bit mask 0xFC, TSO/GSO/GRO off, RED `bandwidth` param, S6 idle re-promotion). Then design-quality scoring: APoSD criteria (deep modules, information hiding, comment quality) *plus* framework-neutral criteria ("would a senior engineer accept this PR", correctness, reproducibility, docs accuracy) — pairing them avoids the tautology of judging an APoSD workflow only by APoSD standards.
- **Define the judging mechanics:** 2–3 blind, fresh Fable sessions with zero AHQ-192 context; repos presented as randomised `repo-a`/`repo-b`; order swapped between judges; judges re-run the benchmark and check claimed numbers reproduce; Steve's and my opinionated comparison happens only *after* blind scores are in.
- **Record per-arm capture requirements:** tokens, cost, wall-clock, RESULTS.md (criteria passed / traps sprung) — so the outcome is a table, not a vibe.

## Step 3 — De-contaminate the spec handoff *(quick, do alongside step 2)*

The revision note atop `tailcut-benchmark-spec.md` references "AHQ-192 docs 09–11" — a breadcrumb to the entire research and design discussion. Before handing the spec to the arms: strip the revision note from the copy they receive, and ensure both workspaces are truly empty and cannot reach this repo. Both arms receive the **identical** stripped spec file and nothing else.

## Step 4 — Build the birgitta-ousterhout-dev workflow *(the big AHQ-side prerequisite; probably its own Jira)*

- Scaffold via create-workflow, based on the add-feature-detailed-example CLI (7 sequential skills, re-inject pattern).
- Write the short design doc mapping APoSD principles onto named **Guides** (deep modules, information hiding, define-errors-out-of-existence, design-it-twice, comments-as-design) and **Sensors** (complexity symptoms: change amplification / cognitive load / unknown unknowns; comment-quality checks; module-depth review) — this mapping is the intellectual heart of AHQ's side of the experiment.
- Decide the **greenfield adaptation**: the base workflow is per-small-feature; TailCut is a whole system. Likely shape: Planner emits a feature list, execution loops over it.
- Give every skill an explicit **no-human-available policy** (take the recommended option, record the choice) so the fully-automated single pass can't stall on a question.

## Step 5 — Prep the run environments

- **The VM (Steve):** Ubuntu 24.04 under VMware, kernel ≥ 6.8, spec §2 packages installed, root available.
- **Arm 1 (one-shot):** clean environment — fresh HOME so the global CLAUDE.md's never-commit / never-install / stop-and-ask rules can't break an unattended run — plus minimal purpose-built settings permitting autonomous work (git, in-workspace installs).
- **Arm 2 (workflow):** equivalent autonomy settings, so neither arm is differentially hobbled. Web access allowed for both arms equally (decided in step 2).

## Step 6 — Run, judge, report, send

1. **Arm 1:** hand the stripped spec verbatim to Fable in an empty workspace with VM access; "come back when it's cooked". Capture the step-2 metrics.
2. **Arm 2:** single fully-automated pass of the workflow, same spec, same capture.
3. **Blind judging** per the frozen rubric; then the comparison report (the workflow-vs-one-shot table: criteria met, traps sprung, quality scores, cost).
4. **The John email package:** repos + reports + these docs, with the doc-09 Q10 framing — a note acknowledging the research docs' blunter passages, the experiment's limits (n=1, automated, no HITL), and the courtesy question about using his name on the workflow (same courtesy to Birgitta Böckeler if it goes public).

## Status ledger

| Step | Owner | Status |
|---|---|---|
| 1. `/commit` the folder | Steve | ☐ pending |
| 2. Protocol + rubric doc (13) | Claude | ☐ not started — **first task for the new session's agent** |
| 3. Spec handoff de-contamination | Claude | ☐ not started |
| 4. birgitta-ousterhout-dev workflow | Steve + Claude | ☐ not started (own Jira?) |
| 5. Environments (VM, clean HOMEs) | Steve (VM) + Claude (settings) | ☐ not started |
| 6. Runs → judging → report → John | both | ☐ blocked on 2–5 |

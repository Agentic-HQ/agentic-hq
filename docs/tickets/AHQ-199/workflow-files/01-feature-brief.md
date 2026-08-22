# AHQ-199 — Feature Brief

## Human Prompt

This is a subtask of AHQ-195, and is detailed in the parent ticket at:
docs/tickets/AHQ-195/workflow-files/01-feature-brief.md
Please be sure to read the details of how this was split in that ticket and be especially 
careful to fully read and understand any relevant Addenda

NOTE: AHQ-201 and both it's sub-tasks: AHQ-208 and AHQ-209 have been completed - please mark them as done in this:
docs/tickets/AHQ-195/workflow-files/01-feature-brief.md
doc.  You may need to read their implementation docs to help you write the documentation now. NOTE: The workflow user docs were updated by the agents that did those tasks, so I don't think you'll need to do them.  Pretty sure you'll probably need to fix/update some of the docs in docs directory and docs/dev though - and definitely the main README.md
The main thing will be that the README.md Quick Start should no longer involve the clone of the repo, but now be instruction and pre-requisites for the npm installation and use.  To clarify: we now have **two** groups of users: Normal Users (who use the agentic-hq CLI command installed from npm to do development on their own projects and who don't check out the AHQ repo) and Contributors (who check out the AHQ repo and then use the agentic-hq-dev command to run Agentic HQ using the code in their checked out repo).  

IMPORTANT: In this Jira we are moving all the instructions for prerequisites and checking out the repo and getting agentic-hq-dev working, and a section clarifying the different users into a new:
docs/dev/setting-up-agentic-hq-for-development.md
doc which must be linked to from a new section in CONTRIBUTING.md

This should leave the simple npm Quick Start instructions in the main README.md which will make it shorter and easier to follow (the sections with links to other docs etc etc should remain in the README.md)

NOTE: Some of this may contradict the list of instructions for this AHQ-199 Jira in: docs/tickets/AHQ-195/workflow-files/01-feature-brief.md - if it does let's discuss it and I'll align the text in docs/tickets/AHQ-195/workflow-files/01-feature-brief.md with you until it's consistent.

**UPDATE 1 (2026-08-22, given in chat after the Researcher's questions were presented):**

> pls fix: "one line says the sequence is "…AHQ-207 → AHQ-199" while everything else (and this run) puts AHQ-199 first" as we changed that recently because we wanted to document everything and then I would follow the documntation exactly in AHQ-207 in the Ubuntu VM

## My Understanding of This Task

AHQ-199 is the docs Sub-Task (Sub-Task 8) of AHQ-195: now that the whole npm pipeline works end-to-end (AHQ-196 → AHQ-209), rewrite the user-facing documentation around the **two user groups** — **Normal Users**, who `npm install -g agentic-hq` (or `npx`) and never clone the repo, and **Contributors**, who clone the repo and use `agentic-hq-dev`. Concretely: (1) the README Quick Start becomes a short npm-based install-and-run guide (prerequisites, `npm install -g agentic-hq`, folder-trust note, run `reversal`/`add-feature`/`create-workflow` via the `agentic-hq` binary), keeping the README's other sections and doc links; (2) all the clone/corepack/pnpm/`npm link`/`agentic-hq-dev` setup instructions move into a new `docs/dev/setting-up-agentic-hq-for-development.md`, which also contains the section clarifying the two user groups, and is linked from a new section in CONTRIBUTING.md; (3) knock-on updates across the docs that reference the old clone-based Quick Start — most notably `troubleshooting-quickstart.md` (entirely clone-centric today), `ci-configuration.md` (maps CI steps to README step numbers), `docs/README.md` (index), CONTRIBUTING.md's existing "Local development setup" summary, and the glossary's root-model link retarget mandated by the parent brief.

Two pieces of housekeeping ride along, per the Human Prompt: mark AHQ-201/AHQ-208/AHQ-209 as done in the AHQ-195 parent brief (and resolve one internal contradiction there — see Question 1), and reconcile anything in this prompt that conflicts with the parent's Sub-Task 8 instructions (I found no real conflicts — the Human Prompt extends rather than contradicts them; the only genuine wrinkle is the not-yet-published 0.2.0, see Question 2). AHQ-207 (fresh-Ubuntu-VM run following the new README Quickstart as written) runs after this ticket and will treat any gap it finds in these docs as an AHQ-199 defect — so the npm Quick Start must be accurate for a machine with no repo clone, including the Linux node-pty build-toolchain prerequisite.

## Research Findings

### State of the completed work this documents (AHQ-201 umbrella = AHQ-208 + AHQ-209)

- **AHQ-208** (two-builds split): all shipped workflows launch via one byte-identical SKILL.md → shared runner → compiled `dist/<skill-id>-cli.js`; the clone's dev binary was renamed **`agentic-hq-dev`** (rebuilds framework on every run); `agentic-hq` is reserved for the npm-installed prebuilt package. Its docs pass already updated README (to `agentic-hq-dev`), `how-agentic-hq-works.md`, `glossary.md`, `npm-commands.md` (new Builds section), `publish-checklist.md`, `troubleshooting-quickstart.md`, `overview-of-workflows.md`, and the CI smoke step.
- **AHQ-209** (migrate remaining four workflows, restore all to working): done and human-approved (review stage skipped by the human, recorded in its summary). All seven workflows ship and pass e2e, grep-clean AC holds, version bumped to **0.2.0**, `release/agentic-hq-0.2.0.tgz` built and checklist-inspected — **but the actual `npm publish` of 0.2.0 and the registry verification matrix are still pending** ("done with the human after the Approval Gate"), and the manual create-workflow acceptance walk-through is likewise pending.
- **npm registry today (checked 2026-08-22):** published versions are 0.0.1, 0.1.0 (deprecated: "npx runs crash (posix_spawnp failed) — use >=0.1.1"), and **0.1.1 (latest, 2026-08-12)** — which predates the AHQ-208/209 migrations and ships only math + add-feature as working workflows. So the npm route the new Quick Start documents delivers the full seven-workflow experience only once 0.2.0 is published (Question 2).

### README.md today (what moves, what stays, what changes)

- The whole Quick Start is clone-based: Prerequisites (Claude Code, git, gh; Linux build toolchain), then Install Node → clone → `corepack enable` → `pnpm install` → `npm link` (installs `agentic-hq-dev`) → `pnpm validate` → run `reversal`. Steps 2–6 move to the new dev doc; the npm path replaces them.
- The add-feature / create-workflow / "Running Workflows From Your Own Workspaces" / "Further Exploration" sections all use `agentic-hq-dev …` example commands — under the new model these are Normal-User sections and should use `agentic-hq …` (matching `overview-of-workflows.md`, which already uses plain `agentic-hq` throughout).
- The README TIP suggesting you run add-feature "from within the Agentic HQ workspace" if you have no project handy needs rework for users with no clone (any empty directory works).
- Sections that stay in README per the Human Prompt: OS support, Why Use, Other Uses, Further Exploration, Further Documentation, Support, Forking, Developer Documentation (plus the auto-approved-permissions CAUTION, which is user-facing).
- The folder-trust note ("Do you trust the files in this folder?") already exists at the smoke-test step and must survive into the npm Quickstart (parent-brief instruction).
- Anchor/step-number dependencies that break on restructure: `troubleshooting-quickstart.md` links to `README.md#installation`/`#quick-start` and mirrors its step order; `ci-configuration.md` has a "README step ↔ CI step" table keyed to the clone-flow step numbers (its CI flow *is* the contributor flow, so it should retarget to the new dev doc).

### Tool-user (npm) facts the new Quick Start must state

- Prerequisites per the parent brief: Claude Code CLI (installed and authenticated) and, on Linux, a C/C++ toolchain + Python (`build-essential python3`) because node-pty compiles from source during `npm install -g agentic-hq`; macOS needs ≥ 13.5 (node-pty prebuilds). Node 22/24 LTS engines constraint applies to the installed package too. Whether git/gh stay listed as prerequisites for Normal Users is a content decision (today's README lists both; workflows like commit/PR helpers use them).
- End users need neither pnpm nor corepack (AHQ-195 AC), and nothing is written inside the installed package at runtime.
- Registry state to document correctly (parent instruction): 0.1.0 is deprecated; 0.1.1+ is the working line.

### Other docs needing work (verified by grep/read)

- `docs/user-docs/troubleshooting-quickstart.md` — entirely structured around the clone flow (corepack, `pnpm install`, `npm link`, `pnpm validate`); needs an npm-install-user troubleshooting path (npx/global install, node-pty gyp failures at npm install time, `claude: command not found`, folder trust, PATH) with the contributor material moved/kept for the dev-doc flow.
- `CONTRIBUTING.md` — "Local development setup" currently summarises the README Quick Start and links to it; the Human Prompt wants a new section linking to the new dev doc (Question 3). Also stale: "currently v0.1.0".
- `docs/README.md` (docs index) — needs the new dev doc listed and its "start with the top-level README for setup" framing adjusted for the two audiences.
- `docs/glossary.md:96` — still sends readers to `tickets/AHQ-200/workflow-files/01-feature-brief.md#the-three-root-concepts…` for the two-roots model; parent brief says retarget (durable section in `how-agentic-hq-works.md`, or inline in the glossary). `how-agentic-hq-works.md` §"Builds"/"four combinations" is otherwise current post-AHQ-208 and needs no structural work.
- `docs/dev/ci-configuration.md:28` — minor staleness: says `npm link` installs "the `agentic-hq` binary" (it's `agentic-hq-dev` now).
- `docs/user-docs/workflow-descriptions/overview-of-workflows.md` — already npm-user-voiced (`agentic-hq` commands); likely needs only a cross-check.
- `docs/dev/publish-checklist.md` — current (updated in AHQ-209 for all seven skills); a starting reference, not a work item.

### Parent-brief housekeeping requested in the Human Prompt

- Mark AHQ-201/AHQ-208/AHQ-209 done in `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md`: the Sub-Task 7 entry and the "Open Sub-Task Instructions" intro ("Sub-Tasks 1–5 are complete") need updating.
- One internal contradiction found while checking for conflicts (the human asked me to raise any): the Sub-Task 7 section says "Sequence: AHQ-208 → AHQ-209 → **AHQ-207 → AHQ-199**", while Sub-Task 8/9 text (and reality — this run) has AHQ-199 before AHQ-207 ("Moved from fifth to last (2026-08-14)" … AHQ-207 "follows the README Quickstart as written", finding doc gaps "comes back to AHQ-199 as a defect"). See Question 1.
- No contradictions found between the Human Prompt and the parent's Sub-Task 8 instruction list — the new dev-setup doc + CONTRIBUTING section is an extension of "README npm/npx Quickstart vs contributor split", not a conflict.

## Web/Perplexity Research

None required — everything needed was in the repo docs, the completed tickets' summaries, and two read-only local `npm view` registry checks (versions/deprecation state of `agentic-hq`).

## Questions And Answers

### Question 1

**Question:** The AHQ-195 parent brief contradicts itself on ordering: the Sub-Task 7 section says "Sequence: AHQ-208 → AHQ-209 → AHQ-207 → AHQ-199", but Sub-Tasks 8/9 (and this very run) put AHQ-199 *before* AHQ-207. When I mark AHQ-201/208/209 as done in that doc, shall I also correct that line to "AHQ-208 → AHQ-209 → AHQ-199 → AHQ-207", and shall I make these parent-doc edits now, during this Researcher stage (since you asked for them in the prompt and alignment is a discussion with me)?

**AI Recommendation:** Yes — fix the sequence line to put AHQ-199 before AHQ-207, and I make both parent-doc edits (done-markers + sequence fix) as soon as you approve these answers, so the parent doc is consistent before the Planner reads anything.

**Human Answer ('Yes' means follow AI Recommendation):** 

**AI Note (appended 2026-08-22):** the sequence-fix half of this question was actioned immediately per the chat instruction recorded as UPDATE 1 in the Human Prompt — the parent brief's sequence line now reads AHQ-208 → AHQ-209 → AHQ-199 → AHQ-207, with a dated correction note explaining the rationale (document everything first, then AHQ-207 follows the docs exactly on the Ubuntu VM). Still open from this question: whether I also mark AHQ-201/AHQ-208/AHQ-209 as done in the parent brief now, during this Researcher stage.

### Question 2

**Question:** The npm registry still has 0.1.1 as latest (published 2026-08-12, before the migrations — only math + add-feature work in it); AHQ-209's 0.2.0 publish + registry verification matrix are pending as a with-the-human step. The new README Quick Start will tell users `npm install -g agentic-hq`, which is only fully true once 0.2.0 is live. Do we write all AHQ-199 docs against the 0.2.0 state, on the understanding that you run the pending AHQ-209 publish (per `docs/dev/publish-checklist.md`) before or immediately after these docs land on main — and should version references (e.g. CONTRIBUTING's stale "currently v0.1.0") say 0.2.0?

**AI Recommendation:** Yes — write against 0.2.0 (documenting anything else would be instantly wrong), update stale version references to 0.2.0, and complete the pending AHQ-209 publish before AHQ-207 runs the docs on the Ubuntu VM. The publish itself stays out of AHQ-199's scope (it is AHQ-209's pending Slice 5).

**Human Answer ('Yes' means follow AI Recommendation):** 

### Question 3

**Question:** CONTRIBUTING.md already has a "Local development setup" section that summarises the README Quick Start. You asked for the new dev doc to be "linked to from a new section in CONTRIBUTING.md" — should we repurpose that existing section (rename/rewrite it to introduce the two user groups briefly and link to `docs/dev/setting-up-agentic-hq-for-development.md`), rather than adding a second, overlapping section?

**AI Recommendation:** Yes — repurpose the existing "Local development setup" section into the linking section (its current summary content moves into the new dev doc), so CONTRIBUTING has exactly one place pointing at dev setup.

**Human Answer ('Yes' means follow AI Recommendation):** 

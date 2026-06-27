# AHQ-158 — Understanding Of Task & Questions

> Source ticket: [AHQ-158 — Update README.md And Other Docs To Reflect New Workflows](https://agentic-hq.atlassian.net/browse/AHQ-158)
> This doc is my (the AI's) understanding of the task plus a Questions section with recommended answers at the bottom. It is a planning artifact — **no docs have been changed yet.**

---

## 1. What This Task Is

The developer/user docs need to catch up with three things that have changed in the codebase, and — more importantly — the **guided path we present to a first-time user needs re-authoring**. The ticket is explicit that this is *"really a rewrite (not just additions) in terms of the guided path for a first time user, because a lot of things are changing from what is there already."* A lot is changing in shape, not just in content, so I'm treating the README's guided path as something to re-author rather than patch.

### The three changes to reflect

1. **`add-feature`** ([AHQ-157](https://agentic-hq.atlassian.net/browse/AHQ-157)) — the new **flagship** workflow. A minimal, issue-tracker-agnostic, four-stage loop (**research → plan → implement → review**) that adds *one small feature* to an existing codebase. This is meant to be the **first real workflow a developer runs**.
2. **`add-feature-detailed-example`** ([AHQ-149](https://agentic-hq.atlassian.net/browse/AHQ-149)) — a worked example of a **highly customised, opinionated seven-stage** workflow (ticket → interrogate → plan → execute → refactor-plan → refactor-execute → validate) built around one developer's (Steve's) process. It's the "power user" exemplar of how detailed and opinionated a workflow can get.
3. **`create-workflow --using=<short-id>`** ([AHQ-159](https://agentic-hq.atlassian.net/browse/AHQ-159)) — a new option on the existing `create-workflow` workflow that **copies and modifies an existing workflow** instead of building from scratch. This is the system's core *customisation* path: run a workflow, like it, then make it your own. Invoked as `agentic-hq create-workflow -- --using=add-feature`.

### The new first-time-user narrative

The point of the rewrite is to lead with real value. The guided path becomes **two headline beats**:

1. **Run a real workflow** — `add-feature` against your own existing project.
2. **Customise it** — `create-workflow -- --using=add-feature` to copy-and-modify it into your own.

**Everything else moves down into "further exploration":**

- The **power-user `add-feature-detailed-example`**. It's intentionally *not* in the headline path: for most people it's overkill and not what they'll want — it's customised to Steve's own development practices — but it's worth keeping as an exploration pointer because it shows how detailed and opinionated a workflow can get.
- The **toy demos** (`reversal`, `math`) — previously the centre of the Quick Start, now demoted to quick optional runs.
- **Building a workflow from scratch** with `create-workflow` (no `--using`).

### In scope per the ticket

- The main **`README.md`**.
- The **relevant dev/user docs under `docs/`** — the ticket says *"please decide which ones as part of planning"*, so choosing the doc set is part of this task (see §3 and Q4).

---

## 2. Current State (what I found)

- **Neither `add-feature` nor `add-feature-detailed-example` is mentioned anywhere** in `README.md`, `docs/user-docs/`, or `docs/dev/` (`grep` returns nothing). Both exist and run today under `agentic-hq-demos-plugin`, each with bundled help docs.
- **`README.md` Quick Start** (lines ~56–116) is currently **install-and-toy-demo oriented**: clone → `pnpm install` → install the dev CLI → `pnpm validate` → `agentic-hq list` → run `reversal` (the ~20s smoke test) → run `math`. It carries an important **auto-approved-permissions `[!CAUTION]`** callout at the top. This whole section is what flips to the new two-beat narrative.
- **`README.md` "Create Your Own Workflow"** (lines ~128–149) hand-describes an opinionated multi-step dev workflow (discover → plan → execute → audit → refactor-plan → refactor-execute → commit). That description is now effectively **embodied by `add-feature-detailed-example`**, and it predates both the new `add-feature` and the `--using` option — so it needs reframing, not just a tweak.
- **`README.md` "Setting Up Sooperset Atlassian MCP Server For Jira"** (lines ~151–165) is a top-level `##` section that is **already just a pointer + "short version"** of the complete, self-contained [`setting-up-jira-mcp-server.md`](../../user-docs/workflow-descriptions/setting-up-jira-mcp-server.md) (verified: that doc has Why-it's-needed → Which-workflows → Prerequisites → Installation-with-the-script-command → Verifying → Troubleshooting). It supports the `quick-jira`/`full-jira` demo workflows — which the re-prioritisation **demotes** — so a top-level MCP-setup section is disproportionate in an `add-feature`-focused README, and duplicative of the dedicated doc.
- **The Jira demo workflows (`quick-jira`, `full-jira`) themselves are documented** in `overview-of-workflows.md` (verified: both entries link to the MCP setup doc), but under the new plan they'd otherwise be **entirely unmentioned in the README** — and they *used to be the flagship*, so they warrant a deliberate small pointer rather than silent removal.
- **`README.md` "Hello World CLI"** (lines ~118–126, a `###` subsection under Quick Start) documents a throwaway test program (`pnpm hello` → `src/hello-world/`). **The underlying code is already gone** (verified: no `src/hello-world/` directory, no `hello` script in `package.json`), so this section is now **stale documentation pointing at deleted code**. **Steve has confirmed it should be ditched** — removed outright. No separate code cleanup is needed; deleting the section is fully doc-scoped (it's already dead docs).
- **`docs/user-docs/workflow-descriptions/overview-of-workflows.md`** is the human-readable workflow catalogue. It lists `create-workflow`, `string-reversal`, `math-workflow`, `quick-jira-workflow`, `full-jira-tdd-story-workflow` — but **not** the two new workflows, and its `create-workflow` entry **doesn't mention `--using`**. TOC + entries need updating.
- **`docs/user-docs/troubleshooting-quickstart.md`** is **coupled to the current Quick Start's step numbering** — it's organised as "Step 2 — `pnpm install`", "Step 3 — install script", "Step 4 — `pnpm validate`", "Step 5 — `agentic-hq list`", and "**Steps 6 & 7 — running the demo workflows**". Re-authoring the Quick Start (relocating install steps, demoting `reversal`/`math`, leading with `add-feature`) **breaks this numbering and the "demo workflows" framing**, so this doc has to be re-synced alongside the README. *(This is the one knock-on doc the rest of the sweep turned up.)*
- **Bundled help docs already exist** (so the README carries the TLDR commands and links to these for the deep detail, rather than reproducing it):
  - `add-feature`: a user help doc + four per-agent help docs.
  - `add-feature-detailed-example`: a user help doc, seven per-agent help docs, **and a developer help doc** (the AHQ-149 deliverable — the deep-dive for people who want to *modify* it).
  - `create-workflow`: per AHQ-159, `00-create-workflow-user-help-doc.md` + `using-existing-workflow-help-doc.md` under its skill `docs/`.
- **`docs/dev/how-agentic-hq-works.md`** uses `math-workflow` as its architecture teaching example. It's an *architecture explainer*, not a workflow catalogue, so it likely needs **little or no change**.
- **`docs/glossary.md`** cites `string-reversal`/`math-workflow` as example workflows — optional light touch only.
- Minor pre-existing nit: `overview-of-workflows.md` links to `README.md#installation`, but the README has no `## Installation` heading (closest are `## Prerequisites` / `## Quick Start`). Worth fixing while we're here.
- **Rest of `docs/` swept and clears** (excluding `project-docs/`, `ARCHIVED/`, `LATER/`, `artifacts/`, and the per-ticket `jira-docs/`) — no change needed: `docs/README.md` (docs index — points at the top-level README for the Quick Start, doesn't enumerate workflows), `dev/npm-commands.md` (its `reversal`/`math` references are the still-present `pnpm demo:*` dev scripts), `dev/potential-feature-ideas.md`, `dev/project-design-requirements.md`, `dev/project-philosophy-and-origin-story.md`, and `user-docs/WARNING-re-auto-approved-claude-permissions.md` (the permission list is unchanged — it just becomes more prominent).

---

## 3. Proposed Scope Of Doc Changes (for approval)

Items 1–4 are **README changes** (re-authoring the first-time-user guided path + pruning now-misplaced sections); items 5–7 are other-doc updates (item 6 is a forced knock-on of the Quick Start re-author).

**Guiding principle — the README stays a TLDR.** Every step in the README carries its **copy-pasteable command(s) inline** (e.g. `agentic-hq add-feature -- --ticket-id=…`, `agentic-hq create-workflow -- --using=add-feature`) plus a one-line "what it does", and then **links out** to the bundled help docs / `overview-of-workflows.md` for anyone who wants the depth. What we *don't* reproduce in the README is the **deep detail** — the per-agent help docs, design rationale, and step-by-step "how each stage works / why" — that already lives in the bundled docs. (That's what "internals don't need re-documenting" means: skip the detail, keep the commands.)

1. **`README.md` — Quick Start (re-author into three subsections).** Collapse the separate `## Prerequisites` and the inline install steps into a single `## Quick Start` umbrella with three `###` subsections:
   - **`### Installation`** — absorbs today's `## Prerequisites`. Opens with the platform requirement (*"you need a Mac — macOS 13.5+"*), then the install sequence (Node 22/24 + corepack/pnpm, clone, `pnpm install`, install-dev CLI, `pnpm validate`). The standalone `## Prerequisites` top-level section goes away.
   - **`### Running the add-feature Workflow`** — `cd` into an existing project and run `agentic-hq add-feature -- --ticket-id=…`. The auto-approved-permissions `[!CAUTION]` moves here — it matters most at the point a workflow first writes to the user's **own** project (see Q3).
   - **`### Build Your Own add-feature Workflow`** — customise it via `agentic-hq create-workflow -- --using=add-feature` (the `--using` copy-and-modify path).

   The other things currently inside Quick Start move or go: the `reversal`/`math` demos drop down to Further Exploration; the old `### Create Your Own Workflow` is removed (per Q5); and the **`### Hello World CLI` section is removed outright** (APPROVED) — a throwaway-test-program leftover, not relocated anywhere.
2. **`README.md` — "Create Your Own Workflow" (remove the section).** Delete it as a standalone section. Its content is already absorbed by the new narrative: the customise-with-`create-workflow` step *is* the headline path's beat 2 (`--using`), so a separate "how to build a workflow" section would just duplicate it; the from-scratch mode and the opinionated worked example (`add-feature-detailed-example`) both move to Further Exploration. The one genuinely useful nugget worth keeping — *"bring your own coding rules/guidelines and they get bundled into the new workflow's skill `docs/`"* — relocates to the `create-workflow` help doc / its `overview-of-workflows.md` entry rather than the README.
3. **`README.md` — "Setting Up Sooperset Atlassian MCP Server For Jira" (remove the section — APPROVED).** **Steve approved deleting this section.** It's a duplicate "short version" of the already-complete `setting-up-jira-mcp-server.md`, and a flagship-level MCP-setup section is disproportionate now that the Jira workflows are demoted. Nothing is lost: the dedicated doc stays, and the `overview-of-workflows.md` Jira entries already link to it. (The Jira workflows get a pointer via item 4.)
4. **`README.md` — "Further exploration" pointers.** Add a pointer set that is now the home of everything demoted from the headline path: the **power-user `add-feature-detailed-example`** (framed as *"a detailed, opinionated example built around one developer's own practices; overkill for most, but it shows how far a workflow can be customised"*, + a link to its developer help doc); the **Jira-driven workflows** (`quick-jira`, `full-jira`) via a single bullet pointing to their `overview-of-workflows.md` entries (which carry the one-time MCP-setup link) — so the former flagship stays discoverable without a top-level section; quick runs of `reversal` and `math`; and building a workflow from scratch with `create-workflow`.
5. **`overview-of-workflows.md`.** Add `add-feature` (flagship — list it first) and `add-feature-detailed-example` entries; update the `create-workflow` entry to document `--using`; refresh the TOC; fix the `#installation` anchor.
6. **`troubleshooting-quickstart.md` (re-sync with the new Quick Start).** Forced by item 1: this doc's section headings mirror the *current* numbered Quick Start steps ("Step 2 — `pnpm install`" … "Steps 6 & 7 — running the demo workflows"). Since the re-authored Quick Start uses **named subsections** instead of numbered steps, regroup this doc to match: the install-failure content (corepack, Node version, `node-pty`, `PNPM_HOME`, `pnpm validate`) sits under an **Installation** heading, and the "Steps 6 & 7 — running the demo workflows" section is re-framed around **Running the add-feature workflow** (the troubleshooting content itself — `claude: command not found`, the trust prompt, hangs/permissions — stays valid). It also becomes the natural home for the deeper install-rationale/edge-cases pulled out of the condensed `### Installation` (see Q1).
7. **(Light / confirm)** `glossary.md` — optionally add `add-feature` as the headline example workflow. `how-agentic-hq-works.md` and `docs/README.md` (docs index) — expected no change.

I do **not** plan to touch the bundled per-workflow help docs (already written and owned by AHQ-157/149/159) beyond linking to them.

---

## 4. Questions (with recommended answers)

For each, answering **"Yes"** accepts my recommendation.

### Question 1 — Quick Start structure (DECIDED) + how much install detail to keep inline.

**Decided (in discussion):** `## Quick Start` becomes a single umbrella with three `###` subsections — **Installation** (Mac requirement + install sequence, absorbing the old `## Prerequisites`), **Running the add-feature Workflow**, **Build Your Own add-feature Workflow**. No separate `## Prerequisites` or `## Installation` top-level sections. (See §3 item 1.)

**Residual question:** Today's `## Prerequisites` is fairly verbose (the macOS 13.5+ rationale, the full nvm walkthrough, `corepack enable`, pnpm version-pinning notes). Fold it in **condensed** — a tight Mac → Node → pnpm → clone → install → validate happy-path — and push the deeper rationale/edge-cases down to `troubleshooting-quickstart.md`, keeping `### Installation` short?

**AI Recommendation:** Yes — condense. A long install essay inside Quick Start fights the TLDR goal, and `troubleshooting-quickstart.md` already exists as the home for the corepack/Node/`node-pty`/`PNPM_HOME` edge cases, so `### Installation` can stay a tight happy-path sequence that links there.

**Human Answer ('Yes' = follow recommendation):** Yes (very good point!!!)

### Question 2 — Keep `reversal` as a post-install smoke test?

**Question:** `reversal` is currently the ~20-second smoke test that proves the CLI works and Claude Code launches *before* you point a real workflow at your real project. Keep a single `reversal` smoke-test step right after install (and demote only `math` to further exploration)?

**AI Recommendation:** Yes — keep one `reversal` smoke test immediately after install as a "confirm it works" gate, then go straight into `add-feature`. Running a brand-new install straight at a real codebase with no confidence-check is riskier than one extra 20s step.

**Human Answer ('Yes' = follow recommendation):** Yes (gives the user a "quick win" feeling that they have AHQ up and running end to end within 2 mins)

### Question 3 — Strengthen the "this writes real code" warning?

**Question:** The new headline path runs `add-feature` against the user's **own existing project**, where it writes real code and creates files under `docs/tickets/<ticket-id>/`. Should we (a) keep/relocate the auto-approved-permissions `[!CAUTION]`, and (b) add a short note recommending users run it on a **clean git working tree / feature branch** so changes are easy to review and revert?

**AI Recommendation:** Yes to both. The permissions caution matters more once a real project is being modified, and a "run on a branch / commit first" nudge is cheap insurance and good practice.

**Human Answer ('Yes' = follow recommendation):** Yes

### Question 4 — Confirm the doc set to change.

**Question:** Do you agree with the scope in §3 — **change**: `README.md`, `overview-of-workflows.md`, and `troubleshooting-quickstart.md` (forced by the Quick Start re-author); **light/optional**: `glossary.md`; **no change**: `how-agentic-hq-works.md` (architecture explainer), `docs/README.md` (index), `dev/npm-commands.md`, `WARNING-re-auto-approved-claude-permissions.md`, and the other `dev/` docs — plus **linking to** (not rewriting) the existing bundled help docs?

**AI Recommendation:** Yes. The sweep of `docs/` confirms only those three are coupled to the change; this avoids re-documenting workflow detail that AHQ-157/149/159 already own, and surfaces the deeper docs via links for those who want them.

**Human Answer ('Yes' = follow recommendation):** Yes

### Question 5 — Remove the "Create Your Own Workflow" README section entirely?

**Question:** Now that the headline path's beat 2 already *is* `create-workflow -- --using=add-feature`, should the standalone "Create Your Own Workflow" section be **removed** rather than reframed — delegating its remaining content to Further Exploration (from-scratch `create-workflow`, the `add-feature-detailed-example` worked example) and relocating its useful "bring your own coding rules" guidance into the `create-workflow` help doc / `overview` entry?

**AI Recommendation:** Yes. Keeping it would duplicate the headline customise beat and re-introduce a competing "how to build a workflow" narrative immediately after we've already shown it. Removing it tightens the README to the two-beat focus and pushes the secondary from-scratch path down to where the other demoted material lives.

**Human Answer ('Yes' = follow recommendation):** Yes

### Question 6 — `ticket-id` in the `add-feature` Quick Start example.

**Question:** `add-feature` requires `-- --ticket-id=<id>` (its example is `--ticket-id=PROJ-123`). It's issue-tracker-agnostic — the id is just a label for the output folder. For the Quick Start example, use a made-up placeholder (e.g. `--ticket-id=PROJ-1`) and note in one line that it can be any label (real ticket or invented), no issue tracker required?

**AI Recommendation:** Yes. A placeholder id with a one-line "it's just a label" note keeps the example copy-pasteable without implying Jira/Linear is a prerequisite.

**Human Answer ('Yes' = follow recommendation):** Yes

### Question 7 — Keep the README / `overview` split?

**Question:** Today the README is the landing page and `overview-of-workflows.md` is the fuller human-readable catalogue. Keep that split (README = lead-with-`add-feature` narrative + links; `overview` = the complete per-workflow catalogue), rather than expanding the README itself into a full catalogue?

**AI Recommendation:** Yes — keep the split. The README stays a focused on-ramp; the catalogue stays the single place that mirrors `agentic-hq list`. This matches the existing structure and avoids two competing full lists drifting apart.

**Human Answer ('Yes' = follow recommendation):** Yes

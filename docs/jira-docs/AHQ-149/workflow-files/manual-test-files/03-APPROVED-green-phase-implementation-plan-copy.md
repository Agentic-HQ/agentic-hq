# GREEN Phase Plan: AHQ-149 (manual test) — Write the `add-feature-detailed-example` Developer Help Doc

## Context

The `add-feature-detailed-example` workflow was built under AHQ-143. Writing its **Developer Help Doc**
was judged too much work to do in that build, so it was deferred to **this** Jira (AHQ-149). Today the
file exists only as a **6-line stub** that points at AHQ-149:

`.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature-detailed-example/docs/developer-help-docs/developer-help-doc.md`

The job is to replace that stub with the **real content**: a single consolidated Markdown doc that
explains *how and why* this workflow was built the way it was, for a developer who wants to **modify or
extend it**. It is distinct from the already-written **User Help Doc** (for someone *running* the
workflow) and the 7 per-agent help docs.

This is a **curation + adaptation** task, not new design work: the "deeper why" / design-rationale /
build-architecture material is pulled from the AHQ-143 planning doc
(`docs/jira-docs/AHQ-143/initial-spec/01-DRAFT-add-feature-workflow-description.md`, 1534 lines) and the
workflow it produced, then shaped into clean developer-facing prose. The planning doc remains the
canonical full archive; this doc points there for granular history rather than reproducing all 1534 lines.

**Test type is `manual`** — there is no automated test. The "test" is Steve reading the finished doc and
confirming it explains the how/why usefully, uses `add-feature-detailed-example` naming throughout, and
that its links resolve. GREEN is "the doc is written to the agreed scope"; this is intentionally a
content task, so "minimal" means *the agreed outline, faithfully written, and nothing beyond it*.

The outline and four scope decisions below were already agreed with the human (AHQ-149 AI summary, Q1–Q4):
- **Q1** — single consolidated `developer-help-doc.md` (no split).
- **Q2** — the doc is the deeper "why" reference; it may restate User-Help-Doc topics at greater depth,
  but **cross-links** to the short version rather than copy-pasting identical paragraphs.
- **Q3 (depth steer)** — convey the **main reasoning / philosophy** so a developer grasps the point and
  can modify the workflow. Do **not** include intricate build-time decision archaeology or personal
  thought-process asides (e.g. the "old validate command felt like box-ticking" comparison, "I'm a gold
  plater" anecdotes). State the *principle* behind a decision, not its history; the planning doc stays
  the home of that history.
- **Q4 (discoverability)** — add **one short link** from the User Help Doc to the new Developer Help Doc
  (it's otherwise an orphan). This is the only edit outside the doc itself.

---

## Jira Requirements (Numbered)

1. Deliverable is the Developer Help Doc at
   `.../add-feature-detailed-example/docs/developer-help-docs/developer-help-doc.md`, replacing the stub
   → [Step 1: Write the Developer Help Doc]
2. Audience = a developer who wants to understand **how & why** the workflow was built, because they may
   **modify or extend** it → [Step 1, Section 1 "What this doc is & who it's for"]
3. Source material = the AHQ-143 planning doc **and** the code/docs AHQ-143 produced; copy the
   "deeper why" sections that suit a modifier (spec line 374) → [Step 1, all sections — curated from
   planning doc + produced workflow]
4. All naming must use **`add-feature-detailed-example`** (renamed from `add-feature` in AHQ-155)
   → [Step 1, applied throughout + Step 3 link-and-naming check]
5. Distinct from the User Help Doc; may go deeper but cross-link, don't duplicate (Q2)
   → [Step 1, Section 1 + cross-links; Step 3 verifies no copy-paste duplication]
6. Depth = main reasoning/philosophy only; no build-time archaeology / personal asides (Q3)
   → [Step 1, Sections 2–9 written at principle level; planning-doc pointer for granular history]
7. Single consolidated file (Q1) → [Step 1 — one file]
8. Point to the AHQ-143 planning doc as the full archive for granular detail
   → [Step 1, Section 1 + Section 9]
9. Add one discoverability link from the User Help Doc → Developer Help Doc (Q4)
   → [Step 2: Add cross-link to User Help Doc]
10. Out of scope: README and `docs/*` discoverability (AHQ-158); the 7 agent help docs; any workflow
    command/code/CLI changes → N/A (explicitly NOT touched — see "Scope discipline")
11. **AC / manual test**: human reads the finished doc and confirms it explains the how/why, naming is
    correct, links resolve, curation matches what was wanted → [Verification: Manual, by human]

---

## Project Design Requirements Compliance

**N/A — documentation-only task.** `docs/dev/project-design-requirements.md` exists and was read, but it
is entirely about TypeScript object-oriented **code** design (class/interface pairs per concept, SRP,
"tell don't ask", Data Dictionary / English Language Description, no "-er" suffix classes, unit-test-file-
per-class, etc.). This Jira produces **one Markdown document and no production code** — there are no
classes, interfaces, tests, or runtime logic to audit. The only transferable idea is *stylistic*: the doc
should be clear, well-structured, and not over-engineered. No formal design requirement applies.

---

## Step 0: Copy this approved plan (FIRST, before any other work)

Copy this approved plan to:
`docs/jira-docs/AHQ-149/workflow-files/manual-test-files/03-APPROVED-green-phase-implementation-plan-copy.md`

---

## Step 1: Write the Developer Help Doc

**File:** `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature-detailed-example/docs/developer-help-docs/developer-help-doc.md`
(overwrite the stub).

One consolidated, developer-facing Markdown doc. House style matches the existing User Help Doc
(clear prose, `##` sections, relative links, "worked example not the starting point" framing). Naming is
`add-feature-detailed-example` throughout. Sections follow the agreed Q-resolved outline:

1. **What this doc is & who it's for** — a *modifier's* reference (how/why, for someone changing or
   extending the workflow); explicitly *not* the User Help Doc (cross-link to it for the running-it view);
   names the AHQ-143 planning doc as the **full archive** for anyone wanting the granular history.

2. **Why this workflow exists & its philosophy** — a deliberately-opinionated **worked example** showing
   how far an AHQ workflow can be shaped around one creator's process; the central **balance** of
   per-feature overhead vs decomposition; honest note that the first version is intentionally heavy and
   meant to be trimmed/tuned over time. (Principle only — no personal-process asides.)

3. **Design principles (the deeper versions)** — the *why* behind each, deeper than the User Help Doc's
   short list, cross-linked to it: Tokens cheap / attention expensive; Make It Fast / reduced cycle time
   (Fowler); Decomposition (Fowler, Ousterhout, Farley); Expansion & Compression; Ditching the
   Master/Slave dynamic; Human+AI collaboration. Keep the source links (Fowler/Ousterhout/Farley videos).

4. **Lineage: how it differs from the Full Jira TDD Story Workflow** — stated as design choices, not a
   blow-by-blow. *Kept:* sharp pinned context, questioning/clarification, Perplexity research, templates,
   minimal tests/code, plan-then-execute refactoring, documenting-for-the-future. *Changed/ditched:*
   merged RED+GREEN into one Planner; single Refactor Suggestion List instead of Tier 1/Tier 2; simpler
   Validator; no issue-tracker MCP (so issue-tracker-agnostic, local Markdown tickets).

5. **Build architecture (for anyone modifying it)** — built **by** `create-workflow` (build-time inputs
   plugin-id/workflow-id); the **self-sufficiency rule** (build-time references are inlined; runtime
   agents never cross-refer to other workflows or external docs); the **staged build** (walking-skeleton
   two passes → deepen one agent at a time); allocating each passage of content between command files vs
   help docs.

6. **Runtime architecture** — the TypeScript CLI **capture-01-output → broadcast `allVariables`, ignore
   02–07** pattern (with the real `add-feature-detailed-example-cli.ts` as the concrete example); the
   variable-flow chain (`ticket-id` is the one variable agent 01 adds; everything else is read from files
   earlier agents wrote); skill-bundled asset resolution via `AGENTIC_HQ_WORKSPACE_ROOT`; the help-doc /
   `verbosity=medium` / "Tell Me More" mechanism; templates kept as separate `*.TEMPLATE.md` files.

7. **Per-agent design rationale** — the *principle* behind each of the 7 agents (not the decision
   archaeology): Ticket Creator's mandatory split attempt + Tracer Bullet; Interrogator's summary kept
   deliberately high-level so the human actually reads it; Planner writes-everything-to-disk so context
   loss is safe + TDD-by-default + appendices; Executor's "document as you go / STOP on problems / no
   silent workarounds"; Refactoring Planner's Power-of-Refactoring reasoning + the large-refactor option;
   Refactoring Executor's one-at-a-time + tests-between-refactors; why the Validator is deliberately
   minimal/quick.

8. **The Planner's design appendices** — what each is and why it exists: English Language Description,
   Project Design Requirements Compliance Audit, Acceptance Criteria Audit, and the List For Refactor
   Planner hand-off.

9. **Deferred to "The Future"** — purist single-test TDD; a fast RED-GREEN-REFACTOR sub-workflow;
   context caching ([AHQ-148](https://agentic-hq.atlassian.net/browse/AHQ-148)); automated/manual
   regression testing; executable acceptance criteria; optional issue-tracker MCP integration;
   speed/overhead tuning knobs. Closes by pointing again to the AHQ-143 planning doc as the full archive.

**Depth discipline (Q3):** every section states the principle/reasoning, then — where granular history
exists — points to the AHQ-143 planning doc rather than retelling it. No build-time-only asides, no
"why I compared this to the old command" archaeology, no personal-process anecdotes.

---

## Step 2: Add the discoverability cross-link to the User Help Doc (Q4)

**File:** `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature-detailed-example/docs/workflow-help-docs/00-add-feature-detailed-example-workflow-user-help-doc.md`

Add **one** short pointer near the top (after the intro paragraph) along the lines of:
> *Modifying or extending this workflow? See the [Developer Help Doc](../developer-help-docs/developer-help-doc.md).*

Relative path verified: user help doc is in `docs/workflow-help-docs/`, developer doc in
`docs/developer-help-docs/`, so `../developer-help-docs/developer-help-doc.md` resolves. This is the
**only** change outside the doc itself.

---

## Step 3: Link & naming check (read-only verification of my own output)

- Confirm every internal link in the new doc resolves (the User Help Doc cross-link, the per-agent help
  doc links if referenced, and the relative/repo path to the AHQ-143 planning doc).
- Confirm naming is `add-feature-detailed-example` throughout (no stray bare `add-feature` that should be
  the detailed example — grep the new doc).
- Confirm no copy-pasted identical paragraphs from the User Help Doc (Q2 — deeper, cross-linked, not
  duplicated).

---

## Scope discipline (what this GREEN phase does NOT touch)

- **No** README or `docs/*` changes — that's AHQ-158.
- **No** changes to the 7 agent help docs or the templates.
- **No** changes to any command `.md`, the CLI, `ahq-workflow.json`, or any code.
- Only **two files** change: the Developer Help Doc (Step 1) and the User Help Doc cross-link (Step 2).
- Any polish/restructuring ideas noticed while writing are left as `REFACTOR:`-style notes for the
  REFACTOR phase, not done now.

---

## Verification

- **Automated:** none — test type is `manual` (no code, no test command).
- **Manual (human):** Steve opens the finished `developer-help-doc.md` in a Markdown viewer and confirms:
  (1) it explains *how & why* the workflow was built, for a modifier; (2) it doesn't merely duplicate the
  User Help Doc; (3) `add-feature-detailed-example` naming is used throughout and all links (incl. the
  AHQ-143 planning-doc pointer) resolve; (4) the curated content selection matches what was wanted
  (right planning-doc material in, build-time-only noise out). GREEN is documented as complete only after
  Steve confirms.

---

## TODO after Step 2 (do NOT inline the instructions — re-read the command file)

After writing the doc and the cross-link, **re-read this command file**
(`03-jira-minimal-implementation`) for its exact testing & documenting instructions (Steps 7–12: present
to human for manual confirmation, write the GREEN phase summary doc, add the Jira comment, write
command-output.json, self-terminate). Follow them from the file — do not rely on memory.

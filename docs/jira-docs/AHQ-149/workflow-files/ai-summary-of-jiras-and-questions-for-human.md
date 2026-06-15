# AI Summary: AHQ-149

**Jira**: [AHQ-149](https://agentic-hq.atlassian.net/browse/AHQ-149)
**Title**: Create add-feature-detailed-example Developer Docs
**Status**: Already In Progress (no transition needed); now assigned to Steve Halso
**Generated**: 2026-06-14

---

## My Understanding of This Task

This is a **documentation-only, manual-test** task. The job is to replace the current **stub** Developer Help Doc — at `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature-detailed-example/docs/developer-help-docs/developer-help-doc.md` (which today is 6 lines pointing at this very Jira) — with the real content. The audience is explicitly stated in the Jira and the source spec: **a developer who wants to understand more deeply how and why this workflow was developed the way it was, because they are thinking of modifying it or adding to it.** It is distinct from the already-written **User Help Doc** (which is for someone *running* the workflow) and from the **7 per-agent help docs**.

The source material is the **1535-line DRAFT planning doc** at `docs/jira-docs/AHQ-143/initial-spec/01-DRAFT-add-feature-workflow-description.md`, plus the workflow that AHQ-143 actually produced (the skill at `skills/add-feature-detailed-example/`, its CLI, `SKILL.md`, templates, and the 8 user/agent help docs). The guiding instruction (spec line 374) is: *"A lot of the sections of this spec that don't seem that relevant to the AI building this workflow, or the user using it — but do seem useful to anyone wanting to understand the deeper reasons for how it will be done — will be copied into that Developer Help Doc."* So this is fundamentally a **curation + adaptation** task: pull the "deeper why" / design-rationale / build-architecture / deferred-future material out of the planning doc and shape it into a coherent developer-facing reference.

**Scope boundary I'm reading from the spec:** the workflow was renamed `add-feature` → `add-feature-detailed-example` in [AHQ-155](https://agentic-hq.atlassian.net/browse/AHQ-155) (now Done), and a separate *simpler* `add-feature` workflow was created in [AHQ-157](https://agentic-hq.atlassian.net/browse/AHQ-157) (now merged). So all naming in the new doc must use **`add-feature-detailed-example`**, and the doc should make clear this is the deliberately-heavy "worked example", not the lightweight starter workflow. README/`docs/*` updates are explicitly **out of scope** here (those are [AHQ-158](https://agentic-hq.atlassian.net/browse/AHQ-158)) — this Jira only fills in the one skill-bundled developer doc.

**My planned approach to faithfulness:** I will **adapt** the planning-doc passages into clean developer-audience prose rather than copy them verbatim, because a literal copy would drag in build-time "To the execution agent…" framing that makes no sense in a shipped doc. I will treat the **AHQ-143 planning doc as the canonical full archive** and have the developer doc point to it for the exhaustive detail, rather than reproducing all 1535 lines. (Note: the self-sufficiency rule that forbids cross-references applies to *runtime agent command files* — this developer doc is for humans, so pointing them to the planning doc is fine.)

**Depth steer (from Q3, agreed):** the doc must convey the **main reasoning / philosophy** behind the workflow so a developer understands *the point* and can then modify it themselves — it must **not** bore them with the intricate build-time decision history or personal thought-process asides (e.g. blow-by-blow comparisons to specific old commands, "this felt like box-ticking" anecdotes). Where a decision matters, state the *principle* behind it, not the archaeology. The AHQ-143 planning doc remains the home for anyone who wants that granular history.

### Proposed Developer Help Doc Outline (the highest-value thing to sanity-check)

This is the content selection I'd propose. **Agreed depth (per Q3):** each section conveys the *main reasoning/philosophy* — enough for a developer to grasp the point and modify the workflow — and deliberately leaves the granular decision-history in the AHQ-143 planning doc.

1. **What this doc is & who it's for** — modifier's reference; not the User Help Doc; points to the AHQ-143 planning doc as the full archive for anyone wanting the granular history.
2. **Why this workflow exists & its philosophy** — it's a deliberately-opinionated *worked example*; the core balance of per-feature overhead vs decomposition; honest acknowledgement that the first version is intentionally heavy and meant to be trimmed. (Keep the *principle*; drop the personal-process asides.)
3. **Design principles (the deeper versions)** — Tokens cheap / attention expensive; Make It Fast / reduced cycle time (Fowler); Decomposition (Fowler, Ousterhout, Farley); Expansion & Compression; Ditching the Master/Slave dynamic; Human+AI collaboration.
4. **Lineage: how it differs from the Full Jira TDD Story Workflow** — what was *kept* (sharp pinned context, questioning/clarification, Perplexity research, templates, minimal tests/code, plan-then-execute refactoring, documenting-for-the-future) and what was *deliberately changed/ditched* (merged RED+GREEN into one Planner, single Refactor Suggestion List instead of Tier 1/Tier 2, simpler/quicker Validator, no issue-tracker MCP). Stated as design choices, not blow-by-blow comparison.
5. **Build architecture (for anyone modifying it)** — built *by* `create-workflow`; the self-sufficiency rule (build-time references vs runtime, inline everything); the staged build (walking-skeleton two passes → deepen one agent at a time); allocating content between command files and help docs.
6. **Runtime architecture** — the TypeScript CLI pattern (capture-01-output → broadcast `allVariables`, ignore 02–07 outputs); the variable-flow chain; skill-bundled asset resolution via `AGENTIC_HQ_WORKSPACE_ROOT`; the help-doc / `verbosity=medium` / "Tell Me More" mechanism; templates as separate files.
7. **Per-agent design rationale** — the *why* behind each of the 7 agents at the philosophy level (mandatory split attempt + Tracer Bullet; Interrogator's summary kept deliberately high-level; Planner writes-everything-to-disk so context loss is safe; Executor's "document as you go / STOP on problems / no silent workarounds"; the Power-of-Refactoring reasoning + large-refactor option; why the Validator is deliberately minimal). The *principle* per agent — not the decision archaeology.
8. **The Planner's design appendices** — English Language Description, Project Design Requirements Compliance Audit, Acceptance Criteria Audit (why each exists).
9. **Deferred to "The Future"** — purist single-test TDD, fast RED-GREEN-REFACTOR sub-workflow, context caching ([AHQ-148](https://agentic-hq.atlassian.net/browse/AHQ-148)), automated/manual regression testing, executable acceptance criteria, optional issue-tracker MCP integration, speed/overhead tuning knobs.

## Research Findings

No external/web/Perplexity research was needed. This is an internal documentation task whose entire source material lives in the repo (the AHQ-143 planning doc + the produced workflow) and in three Jiras (AHQ-143, AHQ-155, AHQ-149), all of which I have read in full. The only "research" was reading those sources and the existing User Help Doc to match the established house style.

## Project Design Requirements

**File**: `docs/dev/project-design-requirements.md` (found at the default path)

This file is **entirely about TypeScript object-oriented *code* design** — class/interface pairs per concept, Single Responsibility Principle, "tell don't ask", avoiding cached state, the Concept Table / Data Dictionary / English Language Description, naming conventions (no "-er" suffix classes, plural collection names), unit-test-file-per-class, etc.

**Relevance to AHQ-149: essentially Not Applicable.** This Jira produces **a single Markdown document and no production code** — there are no classes, interfaces, tests, or runtime logic to audit against these requirements. In subsequent phases the "Design Requirements Compliance" sections should therefore be marked **N/A (documentation-only task)** rather than skipped silently. The one transferable idea is *stylistic*: the doc itself should be clear, well-structured and not over-engineered — but there is no formal requirement here to satisfy.

## Questions for Human

I checked the Jira description, AHQ-143 / AHQ-155 / AHQ-157 / AHQ-158, the DRAFT planning doc, and the existing User Help Doc before asking each of these. They are all genuine choices the source material leaves open.

### Question 1: One file, or split into several?

The spec defines exactly one deliverable variable, `developer-help-doc = {developer-help-docs-dir}/developer-help-doc.md`, and the current stub is that single file. But the directory is named `developer-help-docs` (plural), and the proposed content above is substantial (likely 400–700 lines).

Do you want it as **one consolidated `developer-help-doc.md`** (my recommendation — keeps the defined path/variable intact and gives the modifier a single place to read top-to-bottom), or **split into several linked files** inside `developer-help-docs/` with `developer-help-doc.md` as a short index that links to them?

**My recommendation**: single consolidated file.

**Human's Response**:
> single consolidated file.

---

### Question 2: How much overlap with the User Help Doc is OK?

The User Help Doc already summarises several of the principles at a high level (decomposition, expansion/compression, tokens-cheap, human/AI collaboration). The spec says the deeper versions should be **"copied into"** the Developer Help Doc — but that bumps against your strong "avoid duplication / make the human read it once" principle.

Two options:
- **(A)** Developer doc is the **deep "why" reference** and is *allowed* to restate those topics at greater depth (different audience, different depth), with a one-line "see the User Help Doc for the short version" cross-link at the top. — *my recommendation*
- **(B)** Keep it **lean**: don't re-explain anything already in the User Help Doc; only cross-reference it and add purely *new* deeper material on top.

**My recommendation**: (A) — the audiences and depth genuinely differ, so some overlap is justified, but I'll cross-link rather than copy-paste identical paragraphs.

**Human's Response**:
> I agree

---

### Question 3: Should "build-time decision history" that the spec marked "do NOT put in the Help Doc" go into the Developer Help Doc?

A few passages in the planning doc are explicitly tagged as **build-time-only decision history** with instructions like *"do NOT surface this to runtime agents or users, and do NOT put it in the command file or the Help Doc"* (e.g. the Validator section's note comparing it to the old Full-Jira "validate" command, spec ~line 1484). That guidance was written to keep such reasoning out of the *agent command files* and *per-agent help docs*.

But this material — *"why the Validator was deliberately made minimal"* — is **exactly the kind of design rationale this Developer Help Doc is meant to capture** for a future modifier. So there's a genuine conflict between the general rule (deeper-why → developer doc) and those specific "keep it out of help docs" tags.

How would you like me to handle it?
- **(A)** Include this decision history in the Developer Help Doc — it's design rationale and the developer doc is its natural home (the "keep out of help docs" tags were about the *runtime agent* docs). — *my recommendation*
- **(B)** Keep it out of the Developer Help Doc too; instead the developer doc *points to* the AHQ-143 planning doc as the home of that build-time decision history.

**My recommendation**: (A), but I'll clearly frame those bits as "design history / rationale" so they're never mistaken for runtime instructions.

**Human's Response**:
> Avoid boring developers with the intimite details of my thought process - this doc is really just to help them with the main reasoning / philosophy behind the workflow so they can understand the point and then modify it themselves if they want.

---

### Question 4: Discoverability — should anything link *to* the new Developer Help Doc?

Right now nothing points to the developer doc — the User Help Doc links to the 7 agent help docs but not to it, so once written it's only findable by knowing the path. README / `docs/*` discoverability is out of scope (that's AHQ-158).

Do you want me to add a single link to the Developer Help Doc from the **User Help Doc** (so it's reachable), or leave it **standalone** for now and let AHQ-158 handle discoverability? (Adding the link touches the User Help Doc, which is borderline AHQ-158 territory — hence asking rather than assuming.)

**My recommendation**: add one short link near the top of the User Help Doc ("Modifying this workflow? See the Developer Help Doc."), since it's cheap and the doc is otherwise orphaned — but happy to defer to AHQ-158 if you'd rather keep this Jira purely additive.

**Human's Response**:
> Yup, that's good.

---

## Agreed Answers (Resolved)

- **Q1 — File structure:** Single consolidated `developer-help-doc.md` (one file, no split).
- **Q2 — Overlap with User Help Doc:** Option (A) — the developer doc is the deeper "why" reference and may restate User-Help-Doc topics at greater depth, with a cross-link to the short version; cross-link rather than copy-paste identical paragraphs.
- **Q3 — Build-time decision history / depth:** Keep the doc to the **main reasoning / philosophy** so a developer grasps the point and can modify the workflow themselves. **Do not** include the intricate build-time decision history or personal thought-process asides. State the principle behind a decision, not the archaeology; the AHQ-143 planning doc stays the home of the granular history.
- **Q4 — Discoverability:** Yes — add a short link to the Developer Help Doc from the **User Help Doc** (done in a later phase of this Jira, as part of GREEN/REFACTOR, not in this read-only step).

## Files I Reviewed

- `docs/jira-docs/AHQ-143/initial-spec/01-DRAFT-add-feature-workflow-description.md` (read in full, 1535 lines) — **the primary source**; this is the doc I'll curate the developer content from. It already flags (line 374–376) which kind of content belongs in the developer doc and that the doc is deferred to AHQ-149.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature-detailed-example/docs/developer-help-docs/developer-help-doc.md` — the current **stub** (6 lines, points at AHQ-149); this is the file I'll be filling in.
- `.agentic-hq/plugins/.../skills/add-feature-detailed-example/docs/workflow-help-docs/00-...-user-help-doc.md` — the existing **User Help Doc**; read to (a) understand house style/tone and (b) see exactly what's already covered, so the developer doc complements rather than duplicates it.
- Skill layout (`SKILL.md`, `ahq-workflow.json`, `ts-workflow/src/add-feature-detailed-example-cli.ts`, `resources/templates/*`, the 7 agent help docs) — listed to confirm what the workflow actually shipped, so the developer doc describes the real artifacts.
- `docs/dev/project-design-requirements.md` — the project design requirements (read in full); concluded they're code-design rules, N/A to this docs task.
- Jira **AHQ-143** (source/parent work, now Done), **AHQ-155** (the rename, now Done), **AHQ-149** (this task) — read in full via the verbatim extractor for scope and naming.

**Most important findings:** (1) the developer doc is a *curation* of existing planning-doc material, not new design work; (2) all naming must be `add-feature-detailed-example` (post-AHQ-155); (3) the task is manual-test only and produces no code, so design-requirements audits are N/A; (4) there's a documentation-conflict to resolve (Q3) about whether explicitly-build-time-only rationale belongs in this doc.

> **Minor observation (not a blocker):** AHQ-143's description once said the docs would be done in "AHQ-156", but every other source — AHQ-149's own description, the spec (line 374–376), and the stub file itself — points to **AHQ-149** as the developer-docs Jira. I'm treating AHQ-149 as correct (the weight of evidence is unanimous) and flag the AHQ-156 mention only for your awareness.

## Test Types And Tests We Will Be Implementing

**Test types: `manual`** (full RED → GREEN → REFACTOR → VALIDATE cycle, manual-test style)

This is explicitly specified in the Jira: *"Test type: manual (the only test will be me reading it)."* There are no automated tests — the deliverable is a Markdown document.

- **What the AI will implement (GREEN):** the real content of `developer-help-doc.md`, replacing the stub, following the agreed outline above and your answers to Q1–Q4.
- **Manual test (what you, the human, will verify):**
  1. Open the finished `developer-help-doc.md` in a Markdown-friendly viewer (e.g. VS Code preview).
  2. Read it end-to-end and confirm it accurately and usefully explains *how and why* the `add-feature-detailed-example` workflow was built the way it was, from the perspective of someone wanting to modify or extend it.
  3. Confirm it doesn't merely duplicate the User Help Doc, uses the correct `add-feature-detailed-example` naming throughout, and that all internal links (and the pointer to the AHQ-143 planning doc) resolve.
  4. Confirm the curated content selection matches what you wanted (i.e. the right planning-doc sections made it in, and build-time-only noise stayed out).
- **The "failing test" (RED) state:** the doc currently exists only as a stub pointing at this Jira — reading it does not yet satisfy "a developer can understand the deeper how/why," so the manual test "fails" until the content is written.

## Ready for Next Step

Test type confirmed (`manual`). **Four questions await your input** (Q1–Q4 above) before we proceed to writing the doc. Please write your answers directly under each `**Human's Response**` placeholder and let me know.

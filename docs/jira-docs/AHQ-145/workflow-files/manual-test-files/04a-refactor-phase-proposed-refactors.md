# REFACTOR Analysis: AHQ-145 (manual test)

**Jira**: [AHQ-145](https://agentic-hq.atlassian.net/browse/AHQ-145)
**Test Type**: manual
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-05-17 21:55

---

## Refactoring Guidance (from Perplexity research)

Refactor in small, safe steps. If more than a few minutes since tests passed, revert and try smaller.

### When TO Refactor

> "The first time you do something, you just do it. The second time, you wince at the duplication, but you do it anyway. The third time, you refactor." — **Don Roberts** (via Martin Fowler)
> So... If you're seeing something that's been copied about and used in 3 places, it's time to tidy that up by refactoring.

> "What's the simplest thing that could possibly work?" - Ward Cunningham
> So... If you're seeing an overly complex solution - or the whole code is starting to look like it's accumulated complexity and messiness, it's time to refactor.

- Magic constants / magic strings — extract to named constants
- Poor variable or function names — rename for clarity
- Duplication within a file — extract to a shared function
- Overly complex conditionals — simplify
- Dead code — delete it
- Long and complex sequences that the system has to go through to achieve something, when you can see a simpler way to do things
- Missing TSDoc — exported classes and public methods should have `/** ... */` comments

### When NOT To Refactor

> "Always implement things when you actually need them, never when you just foresee that you need them." — **Ron Jeffries**
> So...Don't refactor to add things you **think** you'll need later.

> "Over and over, people try to design systems that make tomorrow's work easy. But when tomorrow comes it turns out they didn't quite understand tomorrow's work, and they actually made it harder." — **Ward Cunningham**

> "What's the simplest thing that could possibly work?" - Ward Cunningham
> So... If you're thinking of adding more code/layers to refactor and make the system more generic, ask your self - are you making it simpler or more complex than it needs to be to make it work?

So, avoid refactoring the following things:
- New abstractions or interfaces — unless the pattern appears 3+ times (Rule of Three)
- Extracting to new files/modules — unless the current file is genuinely too large
- Introducing design patterns — unless the problem is already painful without one
- Building "stepping stones" for future features — classic gold-plating
- Making code "more generic" — if only one use case exists, keep it specific

**"Has It Earned It?"** — Before approving, ask: Is this code stable? Is the pattern repeated 3+ times? Will this abstraction actually be used, or is it speculative?

---

## Nature of this Jira — read this first

AHQ-145 is a **configuration + documentation + research** Jira. **No application logic
(`src/**`) was changed** — confirmed against the GREEN-phase summary's "Files Modified /
Created / Deleted" lists and the working tree. The entire change set is:

- JSON config edits — root `package.json` (`engines.node`, `@types/node` + pseudo-comment),
  6 × `ts-workflow/package.json` (`engines.node`), 7 × `tsconfig.json` (`target` + comment).
- A new `.nvmrc` (one-line version file) and the deletion of a redundant `ts-workflow/.nvmrc`.
- A regenerated `pnpm-lock.yaml` (side-effect of the `@types/node` change — Decision B).
- Prose updates to `README.md`, `CONTRIBUTING.md`, `docs/dev/npm-commands.md`,
  `docs/user-docs/troubleshooting-quickstart.md`, `CLAUDE.md`, and the AHQ-42 audit doc.
- One shell script: `docs/jira-docs/AHQ-145/scripts/manual-node-22-to-24-machine-upgrade-script.sh`
  — a **one-time, manual, line-by-line** machine-upgrade script that **has already been run
  successfully** by the maintainer (evidence: `docs/jira-docs/AHQ-145/scripts/script-output.txt`).
- Research artefacts under `additional-reports/` and a follow-up Jira description.

There are **no TypeScript classes, interfaces, methods, functions, or magic constants in code**
to refactor. The classic REFACTOR targets (extract constants, rename, dedupe within a file,
simplify conditionals, design-requirements compliance) **mostly do not apply**. This is a case
where **"zero refactors" is the expected and valid outcome** — the analysis below confirms that
rigorously rather than inventing work.

---

## Pre-Refactor Test Status

**Command**: `manual` — no automated tests for this Jira (RED phase confirmed manual testing
only). The acceptance test is the maintainer running the upgrade script and the AC checklist.
**Result**: PASSING — confirmed by the human on 2026-05-17. The upgrade script ran end-to-end
on Node 24.15.0: `pnpm validate` clean (146/146 unit tests, 32 files), `agentic-hq reversal`
→ `olleh`, dev/prod install scripts smoke-tested, all machine-state ACs met. Evidence:
`docs/jira-docs/AHQ-145/scripts/script-output.txt`.

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, RED phase, GREEN phase plan, GREEN phase summary, and the Jira
itself for deferred items and opportunities. A recursive case-insensitive search of
`docs/jira-docs/AHQ-145/workflow-files/` for "refactor" returned **only boilerplate** ("## Ready
for REFACTOR Phase" and the 04a command line in the GREEN summary) — no deferred refactor notes.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | GREEN summary `03-green-phase-summary-of-what-was-implemented.md` lines 17 & 101–102, and plan **Decision C**: all say the script lives at `docs/jira-docs/AHQ-145/manual-node-22-to-24-machine-upgrade-script.sh` | Observed | The script (and its `script-output.txt`) actually live one level deeper, in `docs/jira-docs/AHQ-145/scripts/`. The plan's Decision C and the GREEN summary's "Test Command" + "Files Created" entries all quote the wrong (AHQ-145-root) path. A future reader following those docs would not find the script. | Real but minor doc-accuracy defect. The `scripts/` location is fine (it co-locates the script with its `script-output.txt`). Cleanest fix: correct the 3 path references in the GREEN summary so the record points at the real file — **leave the script where it is**, don't move it (it's already run; `script-output.txt` is colocated). Honest caveat: the GREEN summary is a historical phase record and team practice is to avoid editing phase docs casually — but a path that points at a non-existent file is actively misleading, so a factual correction is justified. | Tier 1 (with human confirmation — see note) |
| P.2 | GREEN summary **Decision E** / **"`.nvmrc` left as a bare version file — no explanatory comment"** | Deferred-rationale (not a refactor) | The `.nvmrc` pin rationale is *deliberately* not inline-commented (nvm ≤ 0.39.x reads line 1 as the version; the maintainer is on 0.39.7). The reasoning lives in Decision E, the Perplexity Q&A doc, and the README/CONTRIBUTING `.nvmrc` notes. | This was a correct, researched decision — **not** a refactor opportunity. Listed only so the human sees it was considered and consciously closed. Adding a comment would break `nvm use` on older nvm. | Skip — correct as-is |
| P.3 | GREEN summary "AC deviations" (Decisions D & E) — `engines.node` = `"^22.0.0 \|\| ^24.0.0"` and `.nvmrc` = `24.15.0` | Observed | Both deviate from the Jira AC's literal text (`">=22.0.0 <25.0.0"` and `24`). The AC checklist will show a literal mismatch. | Not a code refactor — these are deliberate, researched, human-approved decisions, fully documented in the GREEN summary, the Jira comment, and two Perplexity Q&A docs. The only open action is **optional**: the human may update the Jira AC text to match. That is a Jira-admin task, not a code change for 04b. | Skip — out of refactor scope (optional Jira-text update by human) |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below.

---

## Magic Constants Audit

The only **code** artefact in this Jira is the shell script
`docs/jira-docs/AHQ-145/scripts/manual-node-22-to-24-machine-upgrade-script.sh`. JSON config
files (`package.json`, `tsconfig.json`, `.nvmrc`) hold *configuration values*, not magic
constants — there is no named-constant mechanism in JSON and their literal values (`"^22.0.0
|| ^24.0.0"`, `"ES2023"`, `24.15.0`) are the deliverable itself.

| File | Line | Literal Value | Status | Notes |
|------|------|---------------|--------|-------|
| `...scripts/manual-node-22-to-24-machine-upgrade-script.sh` | 149 (+ comments 25, 32) | `pnpm@11.1.2` | INTENTIONALLY INLINE | Could be a `PNPM_VERSION` variable, but the script's stated design (header lines 12–19) is "run MANUALLY, ONE LINE AT A TIME" — each line must be self-contained and human-readable. A variable would force the human to have run an earlier assignment line, breaking the line-by-line model. |
| `...manual-node-22-to-24-machine-upgrade-script.sh` | many | `24` (Node major) | INTENTIONALLY INLINE | Same reasoning. |
| `...manual-node-22-to-24-machine-upgrade-script.sh` | 40, 53 | `$HOME/dev/agentic-hq/agentic-hq`, `$HOME/ahq-145-backup` | ALREADY EXTRACTED | Held in `PROJECT_DIR` / `BACKUP_DIR` shell variables. |

> **No magic constants to extract.** The script's literals are deliberately inline by design
> (a manual, run-line-by-line script), the script is a one-time artefact that has already been
> executed, and the JSON config values are the deliverable, not extractable constants. No
> Tier 1 entry results from this audit.

---

## Audit To Confirm Methods Used In Production Code (Not Just Tests)

**Not applicable.** AHQ-145 created or modified **no interfaces, classes, or methods** — there
are no `src/**` changes. There is nothing with a public method surface to audit.

> No interfaces or classes in scope. Audit skipped — no code concepts exist for this Jira.

---

## Tier 1: Auto-Approved Refactors

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.1 | Fix obvious doc inaccuracy | Correct the upgrade-script path in the GREEN-phase summary from `docs/jira-docs/AHQ-145/manual-node-22-to-24-machine-upgrade-script.sh` to the real `docs/jira-docs/AHQ-145/scripts/manual-node-22-to-24-machine-upgrade-script.sh`. (See P.1.) | `03-green-phase-summary-of-what-was-implemented.md` Lines: `17`, `101–102` |

> **Note on 1.1**: This edits a historical phase document. It is classified Tier 1 because it
> is a pure factual correction (a path that currently points at a non-existent file), but
> because team practice cautions against editing phase docs casually, the human should still
> confirm it during review. If you would rather leave the historical record untouched, mark it
> for the Human-Identified section as a "Skip".

---

## Tier 2: AI-Identified Potential Refactors

### Refactor 2.1: Make the 6 `ts-workflow/tsconfig.json` files `extends` a shared base tsconfig

**Type**: Extract to new file / introduce shared base config
**Description**: The 6 `ts-workflow/tsconfig.json` files (and the root one) now each carry an
identical `// ES2023: ...` comment plus `"target": "ES2023"`. They could be made to `extends`
a single shared base `tsconfig.json` so the `target` (and other common options) live in one
place.
**AI Recommendation**: **NOT RECOMMENDED.** The `ts-workflow` directories are deliberately
*self-contained* sub-projects — each is a plugin workflow that is installed/run independently
(one of the six is even an e2e test fixture under `tests/e2e/fixtures/`). They each have their
own `package.json` and `node_modules`. Coupling them to a repo-root base tsconfig via
`extends` would break that self-containedness — a copied/distributed plugin would suddenly
depend on a file outside its own tree. The duplication here is *intentional decoupling*, not
an accident. This is also out of scope for AHQ-145 (a Node-version Jira). Surfaced only for
completeness.
**Risk**: Breaks the self-contained-sub-project design; a distributed plugin would fail to
type-check without a file from the parent repo. Classic over-DRY at the cost of a real
architectural property.
**Files affected**: 7 × `tsconfig.json`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.2: De-duplicate the `engines.node` range string across the 7 `package.json` files

**Type**: Duplication removal (cross-file)
**Description**: The string `"^22.0.0 || ^24.0.0"` now appears in 7 `package.json` files (root
+ 6 `ts-workflow`). One could imagine a single source of truth.
**AI Recommendation**: **NOT RECOMMENDED.** `package.json` is strict JSON with no
include/reference mechanism — `engines.node` *must* be a literal in each file. There is no
non-fragile way to DRY this (a generator script would be far more machinery than the problem
warrants, and would itself need maintaining). The duplication is inherent to the format and
to the deliberate self-containment of the sub-projects (same reasoning as 2.1). Surfaced only
for completeness so the human sees it was considered.
**Risk**: Any abstraction here (codegen, sync script) is pure gold-plating — more moving parts
than the 7 literal strings it replaces.
**Files affected**: 7 × `package.json`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None".
Everything added here will be discussed with the AI before a decision is made.

> **MANDATORY**: You MUST either add refactors here OR write "None" before the execute phase
> can proceed.

None

---

## Project Design Requirements Compliance Audit

**Design Requirements File**: `docs/dev/project-design-requirements.md`

The design requirements doc governs **object-oriented design** of TypeScript code
(class/interface pairs per concept, `Impl` naming, tell-don't-ask, avoid cached state, Concept
Table, Data Dictionary, English Language Description, switchability). AHQ-145 changed **no
TypeScript code** — it is JSON config, a `.nvmrc`, prose docs, a shell script and research
artefacts. Every requirement is therefore **NOT APPLICABLE**, consistent with the AI summary,
the RED phase and the GREEN plan all reaching the same conclusion.

| # | Requirement | Evidence (files, classes, patterns) | Status | Refactoring Proposal (if needed) |
|---|-------------|-------------------------------------|--------|----------------------------------|
| DR.1 | A class/interface pair for every "concept" in the system | No new concepts — change set is JSON config, `.nvmrc`, docs, one shell script. No `src/**` files touched. | NOT APPLICABLE | — |
| DR.2 | Interface gets the concept name; impl appends `Impl` (switchability) | No new interfaces or classes created. | NOT APPLICABLE | — |
| DR.3 | Tell-don't-ask / push work into the object | No behaviour-bearing objects in scope. | NOT APPLICABLE | — |
| DR.4 | Avoid cached/intermediate state in fields | No classes or fields created. (The shell script's `BACKUP_DIR`/`PROJECT_DIR` are ordinary shell vars in a one-shot script, not object state.) | NOT APPLICABLE | — |
| DR.5 | Switchability — a third party can replace any concrete class | No classes created. | NOT APPLICABLE | — |
| DR.6 | Concept Table | Nothing to map — no concepts. | NOT APPLICABLE | — |
| DR.7 | Data Dictionary + English Language Description | No interfaces/classes designed. | NOT APPLICABLE | — |
| DR.8 | Balance caveat — appropriately balanced, not over-fractured | No code structure to assess. | NOT APPLICABLE | — |

**Summary**: 0 of 8 requirements MET, 0 PARTIALLY MET, 0 NOT MET, **8 NOT APPLICABLE**.

> **Note to human**: No refactoring proposals arise from this audit — there is no code to
> design. This matches the stance recorded in the AI summary and GREEN plan.

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 1 |
| Tier 2 AI-Identified (Pending review) | 2 |
| Design Requirements Audit (items needing action) | 0 |
| **Total identified by AI** | 3 |

> The single Tier 1 item is a minor doc-path correction. Both Tier 2 items are explicitly
> **NOT RECOMMENDED** by the AI — they are surfaced only so the human can see they were
> considered and consciously rejected. This is, correctly, a near-zero-refactor outcome for a
> config/documentation/script Jira.

---

## Agreed Refactors Discussion Notes

**No discussion was needed.** The human's review marked both AI-Identified Tier 2 refactors
(2.1, 2.2) as **REJECT** — no items were marked DISCUSS — and the Human-Identified Potential
Refactors section was filled in as **"None"**. Per the workflow, with no DISCUSS marks and no
human-identified items, the discussion step is skipped and the Agreed Refactors table is
produced directly.

The Tier 1 item (1.1) was auto-approved and not contested; it carries straight through to
EXECUTE.

---

## Agreed Refactors Summary Table

> For detail on any item, see the corresponding entry in "Tier 1: Auto-Approved Refactors" /
> "Tier 2: AI-Identified Potential Refactors" above. No items required discussion.

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 1.1 | AI (Tier 1) | Correct the upgrade-script path in the GREEN-phase summary `03-green-phase-summary-of-what-was-implemented.md` (lines 17, 101–102) from `docs/jira-docs/AHQ-145/manual-node-22-to-24-machine-upgrade-script.sh` to the real `docs/jira-docs/AHQ-145/scripts/manual-node-22-to-24-machine-upgrade-script.sh`. | EXECUTE | Tier 1 auto-approved; not contested by the human. Pure factual doc-path correction — the script is **not** moved. |
| 2.1 | AI | Make the 6 `ts-workflow/tsconfig.json` files `extends` a shared base tsconfig. | SKIP | Rejected by human. (AI also recommended NOT RECOMMENDED — would break the self-contained sub-project design.) |
| 2.2 | AI | De-duplicate the `engines.node` range string across the 7 `package.json` files. | SKIP | Rejected by human. (AI also recommended NOT RECOMMENDED — JSON has no include mechanism; any abstraction is gold-plating.) |

**Net result for 04b**: execute exactly **one** refactor — item **1.1** (a 3-line doc-path
correction). Items 2.1 and 2.2 are SKIP.

---

## Next Steps

1. Review the "Previous Phases" table - if you disagree with any "Skip", add it to Human-Identified Potential Refactors
2. Mark each AI-Identified Tier 2 refactor as APPROVE / REJECT / DISCUSS
3. Fill in "Human-Identified Potential Refactors" with your own refactors, or write "None"
4. Tell the AI you've completed your review
5. The AI will discuss: any items you marked DISCUSS + all human-identified items
6. After discussion, the AI fills in "Agreed Refactors Discussion Notes" and "Agreed Refactors Summary Table"
7. The execute phase (04b) runs automatically

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-05-18 00:05.

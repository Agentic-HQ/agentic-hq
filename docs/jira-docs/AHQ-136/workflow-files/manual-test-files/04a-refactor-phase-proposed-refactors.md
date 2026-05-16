# REFACTOR Analysis: AHQ-136 (manual test)

**Jira**: [AHQ-136](https://agentic-hq.atlassian.net/browse/AHQ-136)
**Test Type**: manual
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-05-16 15:52

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

## Pre-Refactor Test Status

**Command**: `manual` test type — there is no automated test command for this Jira.
**Result**: PASSING — the human confirmed (2026-05-16) that the implementation has been manually tested and verified working. The GREEN-phase manual verification table (`03-green-phase-summary-of-what-was-implemented.md`) records every check passing: `pnpm --version` → `11.1.2`, `pnpm validate` (typecheck + lint + format + 146 unit tests) passed, all 6 `ts-workflow` sub-projects install clean, `install-dev-agentic-hq.sh` works, `agentic-hq list` + `reversal` end-to-end smoke test passed, no "Update available!" nag.

> **How GREEN stays GREEN through REFACTOR**: this is a config-only change verified by manual checklist. Any refactor that touches a config file (`pnpm-workspace.yaml`, `package.json`) must be re-verified by `pnpm install` + `pnpm validate` from the affected directory. Any refactor that touches the 5 e2e test files must be re-verified by `pnpm typecheck` + `pnpm lint:check` + `pnpm format:check` (the e2e suite itself is gated behind a real Claude invocation and is not run for free).

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, red phase, green phase plan, green phase summary, and the retrospective doc for deferred items and opportunities. A recursive search of `docs/jira-docs/AHQ-136/workflow-files/` for `refactor` returned only `03-green-phase-summary-of-what-was-implemented.md` and `additional-docs/later-jira-description-for-switching-to-pnpm-add.md` — neither contains a deferred-to-REFACTOR item; both hits are boilerplate ("Ready for REFACTOR Phase" / a phase reference).

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | GREEN summary + retrospective: "AHQ-144 ... is now done **within AHQ-136** — it should be closed as completed-by-AHQ-136." | Observed | Jira housekeeping, not code: AHQ-144 (switch `pnpm link --global` → `pnpm add -g .`) was folded into AHQ-136 during GREEN. AHQ-144 should be transitioned to Done / "completed by AHQ-136". | Not a code refactor — it's Jira admin. Worth doing so the backlog is accurate, but it changes no files in the repo. Flagging it here only so the human doesn't lose track of it. | Skip (as a refactor — handle as Jira housekeeping, outside 04b's remit) |
| P.2 | `additional-docs/later-jira-description-for-switching-to-pnpm-add.md` | Observed | That draft doc is the *description for AHQ-144*. Since AHQ-144's work was completed inside AHQ-136 (see P.1), this draft is now obsolete. | The additional-docs folder is a research/history record for this Jira; obsolete drafts in it still have archival value (they show why a decision was made). Deleting it is cleanup, not a refactor of delivered code, and risks losing the audit trail. | Skip — leave as workflow history (or delete as housekeeping if the human prefers; not a 04b task) |
| P.3 | GREEN plan Replan Note B / GREEN summary bug #2: "A 6th `ts-workflow` ... the AI summary's '5 sub-projects' list missed." | Observed | The 6th sub-project (`tests/e2e/fixtures/string-reversal-copy-for-test/.../ts-workflow/`) was found mid-GREEN and migrated. Confirmed: all 6 `ts-workflow/pnpm-workspace.yaml` files now exist and are byte-identical; all 6 `package.json` files had the dead `pnpm` block removed. Nothing left undone. | Already fully handled in GREEN. No residual refactor. Listed so the human can see it was verified, not forgotten. | Skip — already complete and verified |
| P.4 | Retrospective Section 2 — a 7-item pre-upgrade checklist for the *next* upgrade. | Observed | The retrospective records lessons for future upgrades (read the whole migration guide, grep the codebase, back up machine state, etc.). | This is forward-looking process guidance, already written down in `03-green-phase-retrospective-and-lessons-learnt.md`. It is not a refactor of AHQ-136's code. The retrospective itself is the deliverable. | Skip — lessons-learnt doc is already complete |
| P.5 | **Not from a phase doc — observed in the working tree.** `git status` shows `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/01-jira-read-and-question.md` is **modified on this branch**. | Observed | That edit adds guidance to *not* use the `AskUserQuestion` tool in the workflow's Step 12/13. It has **nothing to do with the pnpm upgrade** — it is not in the AHQ-136 plan, summary, or any phase doc. It appears to be an unrelated change that landed in the working tree. | This is a **commit-hygiene** concern, not a refactor. AHQ-136's commit should contain only pnpm-upgrade changes; an unrelated workflow-command edit mixed in makes the diff misleading and the change hard to attribute later. The AI cannot decide where it belongs — the human must. | **FLAG to human** — decide whether this edit belongs to a different Jira / separate commit, or revert it. Not a 04b task; surfaced here so it isn't committed silently. |
| P.6 | Observed across the 6 new `ts-workflow/pnpm-workspace.yaml` files. | Observed | All 6 files are byte-identical (a 25-line doc-comment + `packages: ['.']` + a 3-key `allowBuilds` map). A reader might wonder whether this duplication should be DRY'd into one shared file. | It should **not** be deduplicated. pnpm resolves `pnpm-workspace.yaml` by walking up from the install directory and stopping at the *nearest* one — each sub-project genuinely needs its own physical file in its own directory for isolation to work. This also matches the project principle that scaffolded/config files must be self-contained (`feedback_command_files_must_be_self_contained`). The identical comment block is a feature, not duplication-debt. | Skip — intentional and required; deduplication would break pnpm's resolution model |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below. **P.5 in particular wants a human decision** — it is the only item that could affect what gets committed.

---

## Magic Constants Audit

The only **code** files touched by AHQ-136 are the 5 `tests/e2e/demo/*.e2e.test.ts` files. All other changes are config files (`pnpm-workspace.yaml`, `package.json`), Markdown command/skill files, a bash script, and `README.md` — none of which carry "magic constants" in the code sense. The e2e test files were audited line-by-line for the lines AHQ-136 added/changed:

| File (×5 — all identical) | Line context | Magic Value | Status | Constant Name |
|------|-------------|-------------|--------|---------------|
| `tests/e2e/demo/*.e2e.test.ts` | `process.env.PNPM_HOME ?? path.join(process.env.HOME!, 'Library', 'pnpm')` | `'Library'` | MAGIC (pre-existing, not introduced by AHQ-136) | → see note below |
| `tests/e2e/demo/*.e2e.test.ts` | same line | `'pnpm'` | MAGIC (pre-existing) | → see note below |
| `tests/e2e/demo/*.e2e.test.ts` | `path.join(pnpmHome, 'bin')` — **added by AHQ-136** | `'bin'` | MAGIC (new in AHQ-136) | → see note below |

**Note — these are deliberately NOT placed in Tier 1.** All three strings live inside a ~6-line PNPM_HOME-resolution block that is duplicated verbatim across all 5 e2e files. Extracting them as per-file `const`s would create 15 constants (3 × 5 files) — making the duplication *worse*, not better. Their correct single home is the shared helper proposed in **Tier 2 R2.1**: if R2.1 is approved, the block (and these three strings as named constants) moves into `tests/e2e/helpers/cli-test-helper-functions.ts` once. Per the analysis guidance "When in doubt, classify as Tier 2", cross-file duplicated magic strings belong with the cross-file extraction, not as a standalone Tier-1 item. If R2.1 is rejected, the fallback is per-file constants — but that is the inferior outcome.

`INSTALL_SCRIPT_TIMEOUT_MS = 30_000` already *is* a named constant in each file (also duplicated 5× — folded into R2.1).

---

## Audit To Confirm Methods Used In Production Code (Not Just Tests)

AHQ-136 is a **config-only package-manager upgrade**. It creates and modifies no interfaces, classes, or methods anywhere under `src/`. The only code files touched are 5 e2e test files, and those changes are limited to comment text and a PATH string (`$PNPM_HOME` → `$PNPM_HOME/bin`) — no new methods, no interface changes.

> No interfaces or classes were created or modified in this Jira. The methods-used-through-interface audit is **not applicable**. No test-only methods, no unused-interface-method smells possible.

---

## Tier 1: Auto-Approved Refactors

> No Tier 1 refactors identified.
>
> AHQ-136 is a config-only change. The config files (`pnpm-workspace.yaml`, `package.json`) are well-commented and minimal; the doc-comment blocks were deliberately updated for pnpm 11 during GREEN. The only code touched (5 e2e test files) has one genuine issue — cross-file duplication — which is correctly a **Tier 2** item (R2.1), not Tier 1, because the safe fix spans 5 files plus a helper module. The magic strings found in the audit are folded into R2.1 for the same reason. Zero Tier 1 is a valid outcome here.

---

## Tier 2: AI-Identified Potential Refactors

### Refactor 2.1: Extract the duplicated dev-install + PATH-setup block from the 5 e2e tests into a shared helper

**Type**: Duplication removal (cross-file) + extract magic constants
**Description**: The 5 `tests/e2e/demo/*.e2e.test.ts` files each repeat the same block of test-setup code:
- `const INSTALL_SCRIPT_TIMEOUT_MS = 30_000;`
- the `⚠️ SMELLY: ...` warning written to `process.stdout`
- the `runCliAndLogOutput(...)` call that runs `scripts/infra/install-dev-agentic-hq.sh`
- the ~6-line block that resolves `PNPM_HOME`, appends `/bin`, and prepends it to `process.env.PATH`

AHQ-136 had to hand-edit this same block in all 5 files (and the GREEN retrospective explicitly notes 5 of them carried a *latent wrong-PATH bug* — `$PNPM_HOME` instead of `$PNPM_HOME/bin` — that had to be fixed 5 times). The refactor: extract the block into `tests/e2e/helpers/cli-test-helper-functions.ts` (where `runCliAndLogOutput` already lives) as a single function — e.g. `runDevInstallScriptAndPutCliOnPath()` — and give the path segments (`'Library'`, `'pnpm'`, `'bin'`) named constants there. Each test then calls one helper.

**AI Recommendation**: UNSURE, leaning RECOMMEND. *For*: the Rule of Three is comfortably met (5 copies), and AHQ-136 is itself the proof of the maintenance cost — a one-line pnpm-11 path change became a 5-file edit, and a latent bug had to be squashed 5 times. *Against*: this duplication **predates AHQ-136**; pulling it into a "pnpm upgrade" Jira widens the scope and mixes a test-infrastructure refactor into a config-upgrade commit. It would be equally legitimate as its own small dedicated tidy-up Jira. The honest call depends on how strictly you want AHQ-136's commit to stay "pnpm only".

**Risk**: Low *technical* risk — it is a mechanical extract-function with no behaviour change, and `typecheck`/`lint`/`format` re-verify it cheaply (the e2e suite need not be run). The real risk is **scope creep**: AHQ-136's stated scope and "out of scope" discipline (the Jira deliberately kept eslint/typescript bumps separate so regressions are attributable) argue for keeping the commit narrow.

**Files affected**: `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts`, `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts`, `tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts`, `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts`, `tests/e2e/demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts`, `tests/e2e/helpers/cli-test-helper-functions.ts`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): Not bothered about duplication in these tests right now (longer term maybe worth it...?)

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None". Everything added here will be discussed with the AI before a decision is made.

> **MANDATORY**: You MUST either add refactors here OR write "None" before the execute phase can proceed.

None

---

## Project Design Requirements Compliance Audit

**Design Requirements File**: `docs/dev/project-design-requirements.md` (found at the default location, read in full).

The design requirements document is **entirely about object-oriented design of the codebase** — a class/interface pair for every concept, "tell don't ask", constructor injection, avoiding cached state, the Concept Table / Data Dictionary / English Language Description design artefacts, etc.

AHQ-136 introduces **no new code, no classes, no interfaces, no concepts**. It edits config files (`package.json`, `pnpm-workspace.yaml` ×7), Markdown command/skill files, a bash script and `README.md`, and regenerates lockfiles. There is nothing to model as objects. Every requirement is therefore **NOT APPLICABLE** — this is a genuine assessment, not an oversight (the GREEN plan reached the same conclusion in its own D.1–D.7 table).

| # | Requirement | Evidence (files, classes, patterns) | Status | Refactoring Proposal (if needed) |
|---|-------------|-------------------------------------|--------|----------------------------------|
| DR.1 | Class/interface pair for every concept in the system | No concepts/classes introduced — only config files changed | NOT APPLICABLE | — |
| DR.2 | `DefaultFoo` implements `Foo` interface naming convention | No interfaces or implementations created | NOT APPLICABLE | — |
| DR.3 | "Tell don't ask" / push work into objects | No methods or objects written | NOT APPLICABLE | — |
| DR.4 | Switchability — a third party can replace any concrete class easily | No classes written | NOT APPLICABLE | — |
| DR.5 | Minimal state — no fields caching intermediate state | No code/objects written | NOT APPLICABLE | — |
| DR.6 | Concept Table mapping concepts → interface + impl class | No concepts to map | NOT APPLICABLE | — |
| DR.7 | Data Dictionary + English Language Description design artefacts | No object interactions to describe | NOT APPLICABLE | — |
| DR.8 | Balance caveat — not fractured to the extreme | No design produced to balance | NOT APPLICABLE | — |

**Summary**: 0 of 8 requirements MET, 0 PARTIALLY MET, 0 NOT MET, 8 NOT APPLICABLE — as expected for a config-only package-manager upgrade.

> **Note to human**: No refactoring proposals arose from this audit (nothing is PARTIALLY MET or NOT MET), so nothing was added to Tier 2 from here.

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 0 |
| Tier 2 AI-Identified (Pending review) | 1 |
| Design Requirements Audit (items needing action) | 0 |
| **Total identified by AI** | 1 |

Plus 6 previous-phase observations (P.1–P.6) — 5 are "Skip" (housekeeping / already-done / intentional), and **P.5 is flagged for a human decision** (an unrelated `01-jira-read-and-question.md` edit sitting in the working tree).

---

## Agreed Refactors Discussion Notes

No items required discussion:

- **R2.1** was a straight **REJECT** by the human — no discussion needed. Human's comment: *"Not bothered about duplication in these tests right now (longer term maybe worth it...?)"* — agreed; the duplication predates AHQ-136 and is not worth folding into a pnpm-upgrade commit. It may be revisited as its own tidy-up task later.
- The **Human-Identified Potential Refactors** section was filled in with **"None"**.

Therefore there were no DISCUSS marks and no human-identified items, so per the 04a process the discussion step is skipped and the summary table below is produced directly.

> The previous-phase observations P.1–P.6 are **not** refactors of AHQ-136's delivered code, so they do not appear in the execute-phase table below. P.5 (the unrelated `01-jira-read-and-question.md` working-tree change) remains a flagged commit-hygiene decision for the human — it is outside 04b's remit.

---

## Agreed Refactors Summary Table

> For detail on any discussed item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above.

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 2.1 | AI | Extract the duplicated dev-install + PATH-setup block from the 5 e2e tests into a shared helper | SKIP | Rejected by human — not worth touching this test duplication now (human may revisit longer-term) |

**Net result: 0 refactors to execute.** The execute phase (04b) has nothing to do — AHQ-136 is a config-only upgrade with no agreed refactors.

---

## Next Steps

1. Review the "Previous Phases" table - if you disagree with any "Skip", add it to Human-Identified Potential Refactors. **Note P.5 in particular** — it needs your decision on the unrelated working-tree change.
2. Mark the AI-Identified Tier 2 refactor (R2.1) as APPROVE / REJECT / DISCUSS
3. Fill in "Human-Identified Potential Refactors" with your own refactors, or write "None"
4. Tell the AI you've completed your review
5. The AI will discuss: any items you marked DISCUSS + all human-identified items
6. After discussion, the AI fills in "Agreed Refactors Discussion Notes" and "Agreed Refactors Summary Table"
7. The execute phase (04b) runs automatically

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-05-16 16:01.

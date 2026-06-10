# REFACTOR Analysis: AHQ-155 (manual test)

**Jira**: [AHQ-155](https://agentic-hq.atlassian.net/browse/AHQ-155)
**Test Type**: manual
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-06-10 22:12

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

**Command**: N/A — `test-type: manual` (no automated tests for this rename + doc-reframing task)
**Result**: PASSING — human confirmed the manual test (this command's Step 4). The renamed workflow runs:
- `agentic-hq list` shows `add-feature-detailed-example` with the new description and no stale `add-feature` entry
- Command 01 (Ticket Creator) → Command 02 (Interrogator) chain resolves and runs
- The bundled docs read as a *detailed example* and point to the simple `add-feature` / `create-workflow --using=add-feature` paths

**AI-side drift verification performed for this analysis** (re-run, not relying on GREEN's claim):
- `grep` of the renamed skill + command directories: **139** `add-feature-detailed-example` references, and **zero** stale bare `add-feature` identifiers. The only bare `add-feature` strings are the **intentional** pointers to the future simple workflow in `00-add-feature-detailed-example-workflow-user-help-doc.md` (lines 5–7: "start with the simple add-feature" / "`create-workflow --using=add-feature`").

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, red phase, green phase plan, and green phase summary for deferred items and opportunities.

A recursive search of `docs/jira-docs/AHQ-155/workflow-files/` for "refactor" returned **only** the boilerplate next-command line (`04a-jira-refactor-analysis`) — i.e. **nothing was explicitly deferred to REFACTOR**. The GREEN summary states "implementation went as planned, no bugs". Every phase document is consistent that this is a pure rename + prose-reframing task with **no new production logic**, so there is no minimal-implementation backlog to clean up.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | GREEN summary: "implementation went as planned, no bugs" + recursive "refactor" search of `workflow-files` found only boilerplate | Deferred | No items were deferred to REFACTOR. | Nothing to do — this confirms a clean GREEN, not a gap. | Skip (nothing deferred) |
| P.2 | GREEN plan Step 3 / Step 5 + CLI `.description()` vs `ahq-workflow.json` `description` | Observed | The pre-specified description string ("Worked example of a detailed, opinionated seven-stage add-feature workflow…") is duplicated verbatim in `ahq-workflow.json` (`description`) and the CLI `.description(...)`. | These are two distinct surfaces (the `list`/manifest entry vs. the CLI `--help` output) that happen to share wording. They are not "the same constant used twice in one module" — they live in different files in different languages (JSON manifest vs TS) and are read by different consumers. No clean shared source exists without inventing cross-file coupling. Pre-existing pattern from AHQ-143; not introduced by this rename. | Skip (not true duplication; would add cross-file coupling) |
| P.3 | CLI `add-feature-detailed-example-cli.ts` — `command01Input` template fragments + the `AGENTIC_HQ_WORKSPACE_ROOT` error message | Observed | The variables-string fragments (`'The variables used in this workflow are: agentic-hq-workspace-root-dir='`, `' and verbosity='`, `' and suggest-large-refactor='`, `' and ticket-id='`) and the error message are inline string literals, not named constants. | These are **pre-existing** (authored in AHQ-143), **untouched** by this rename, and follow the exact same inline style as the sibling `create-workflow-cli.ts`. See Magic Constants Audit + Refactor 2.1 below. | Tier 2 (surfaced for human; AI **does not** recommend — out of scope for a rename) |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below.

---

## Magic Constants Audit

Implementation file touched in this Jira: `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature-detailed-example/ts-workflow/src/add-feature-detailed-example-cli.ts`.

**Important scope note**: This Jira is a **rename**. The only code values it changed were the *values* of already-named constants (the 7 `COMMAND_0X_*` slash-command strings, the commander `.name()`/`.description()`). It introduced **no new literals**. The literals flagged MAGIC below are **pre-existing from AHQ-143** and were not modified by this work.

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `…-cli.ts` | 33 | `'AGENTIC_HQ_WORKSPACE_ROOT'` | EXTRACTED | `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VARIABLE_NAME` |
| `…-cli.ts` | 34 | `1` (error exit code) | EXTRACTED | `ERROR_EXIT_CODE_VALUE` |
| `…-cli.ts` | 36 | `'low'` | EXTRACTED | `DEFAULT_VERBOSITY` |
| `…-cli.ts` | 37 | `'false'` | EXTRACTED | `DEFAULT_SUGGEST_LARGE_REFACTOR` |
| `…-cli.ts` | 39–53 | 7 slash-command strings | EXTRACTED | `COMMAND_01_TICKET_CREATOR` … `COMMAND_07_VALIDATOR` (the rename targets) |
| `…-cli.ts` | ~85–90 | `'The variables used in this workflow are: agentic-hq-workspace-root-dir='`, `' and verbosity='`, `' and suggest-large-refactor='`, `' and ticket-id='` | MAGIC (pre-existing, AHQ-143) | — see Refactor 2.1 |
| `…-cli.ts` | ~80 | `'Error: AGENTIC_HQ_WORKSPACE_ROOT environment variable is not set.'` | MAGIC (pre-existing, AHQ-143) | — see Refactor 2.1 |

**The MAGIC entries above are pre-existing and out of scope for this rename. They are surfaced as Tier 2 Refactor 2.1 (not auto-approved) rather than Tier 1, because extracting them would mix unrelated AHQ-143 cleanup into a rename diff (scope-discipline rule in CLAUDE.md). The constants this Jira actually touched are all already extracted.**

---

## Audit To Confirm Methods Used In Production Code (Not Just Tests)

**No interfaces or classes were created or modified in this Jira.** The only implementation file is the thin orchestrator CLI (`add-feature-detailed-example-cli.ts`), which is a procedural commander script — consistent with its sibling `create-workflow-cli.ts`. It declares no classes/interfaces of its own and adds no methods. It consumes one external collaborator, `DefaultClaudeCodeTool` (from the `agentic-hq` package), calling `.execute()` — that class is not owned or modified by this Jira.

| Interface / Class | Method | Status | Evidence |
|---|---|---|---|
| (none created/modified in this Jira) | — | — | — |

> All literal values that this Jira touched are already extracted; no interface methods were added. No test-only methods (there are no automated tests, by design). Audit is clean / not applicable.

---

## Tier 1: Auto-Approved Refactors

> No Tier 1 refactors identified. This Jira is a clean, consistent rename: the constants it touched are already extracted, the rename has zero drift (grep-verified: 139 renamed references, 0 stale identifiers, intentional simple-workflow pointers preserved), and there is no new logic to clean up. "Zero refactors is a valid outcome" — that is the case here.

---

## Tier 2: AI-Identified Potential Refactors

### Refactor 2.1: Extract pre-existing inline string literals in the CLI to named constants

**Type**: Extract magic constants (within file)
**Description**: Extract the `command01Input` template fragments (`'The variables used in this workflow are: agentic-hq-workspace-root-dir='`, `' and verbosity='`, `' and suggest-large-refactor='`, `' and ticket-id='`) and the `AGENTIC_HQ_WORKSPACE_ROOT`-missing error message into named constants at the top of `add-feature-detailed-example-cli.ts`.
**AI Recommendation**: **NOT RECOMMENDED** (for this Jira). Three reasons: (1) **Scope** — these literals are pre-existing from AHQ-143 and were not touched by this rename; extracting them mixes unrelated cleanup into a rename diff, which the project's scope-discipline rule warns against. (2) **Consistency** — the sibling orchestrator `create-workflow-cli.ts` uses the exact same inline style; changing only this one creates inconsistency between two files that are meant to read as a pair. (3) **Low value** — each fragment is used exactly once, in one place, so there is no duplication and no Rule-of-Three justification; named constants here would add indirection without removing repetition. If the team wants these tidied, it is better done as a deliberate, separate pass across **both** demo CLIs (or folded into AHQ-143's own follow-up), not snuck into AHQ-155.
**Risk**: Low technical risk, but it expands a surgical rename into unrelated churn and desyncs the two sibling CLIs' style.
**Files affected**: `…/skills/add-feature-detailed-example/ts-workflow/src/add-feature-detailed-example-cli.ts`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): REJECT

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None". Everything added here will be discussed with the AI before a decision is made.

> **MANDATORY**: You MUST either add refactors here OR write "None" before the execute phase can proceed.

None

---

## Project Design Requirements Compliance Audit

**Design Requirements File**: `docs/dev/project-design-requirements.md`

The design requirements document is almost entirely about **code** design (mapping real-world concepts to interface/class pairs, "tell don't ask", minimal state, switchability, data dictionary / English-Language-Description during planning, "-er"-suffix avoidance). This Jira introduces **no new production code and no new domain concepts** — it renames an existing identifier across string constants and rewrites Markdown/JSON prose. Therefore most requirements are **NOT APPLICABLE**, and the one that does apply (naming consistency / no drift) is the entire point of the task.

| # | Requirement | Evidence (files, classes, patterns) | Status | Refactoring Proposal (if needed) |
|---|-------------|-------------------------------------|--------|----------------------------------|
| DR.1 | Every "concept" gets an interface + `…Impl` class pair | No new concept introduced; pure rename of an existing workflow identifier | NOT APPLICABLE | — |
| DR.2 | `DefaultFoo`/`Foo` naming convention for new concepts | No new concept/class introduced | NOT APPLICABLE | — |
| DR.3 | Tell-don't-ask / push work into objects | No new behaviour; CLI is an existing thin commander orchestrator (sibling of `create-workflow-cli.ts`) | NOT APPLICABLE | — |
| DR.4 | Switchability — third party can replace a concrete class | No new class; nothing to make switchable | NOT APPLICABLE | — |
| DR.5 | Minimal state — no unnecessary cached fields | CLI holds no state; builds `command01Input` locally and broadcasts `allVariables` — no fields cached | MET (unchanged; nothing introduced) | — |
| DR.6 | Balance caveat — not fractured to the extreme | A single procedural orchestrator CLI, deliberately not over-decomposed; matches sibling demo CLI | MET | — |
| DR.7 | Naming consistency / no drift (the relevant requirement) | Full rename applied in lockstep: skill dir, command dir, CLI filename, 7 slash constants, `.name()`, `ahq-workflow.json` `skillId`/`shortId`/`description`, `SKILL.md`, `package.json` `name` + `demo:` script, all 7 command files' `current-workflow-id` + help-doc variable, bundled help/developer docs, and the one external referrer (`create-workflow/02` line 155). Re-verified by grep: 139 renamed refs, 0 stale identifiers, intentional simple-workflow pointers preserved. | MET | — |

**Summary**: 0 MET-with-gaps. Of 7 requirements: **2 MET** (DR.5, DR.6 unchanged; DR.7 fully satisfied → actually 3 MET), **4 NOT APPLICABLE** (DR.1–DR.4). No PARTIALLY MET or NOT MET items → **no refactoring proposals arise from this audit.**

> **Note to human**: This audit produced no refactoring proposals (no gaps found), so nothing was added to Tier 2 from it. It is here for awareness and traceability.

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 0 |
| Tier 2 AI-Identified (Pending review) | 1 (Refactor 2.1 — AI recommends REJECT) |
| Design Requirements Audit (items needing action) | 0 |
| **Total identified by AI** | 1 |

---

## Agreed Refactors Discussion Notes

No items required discussion. The single AI-identified Tier 2 item (2.1) was a straight **REJECT** by the human (matching the AI's NOT RECOMMENDED recommendation), and the Human-Identified section was "None". There were therefore no DISCUSS marks and no human-added items to talk through. See the Agreed Refactors Summary Table below.

---

## Agreed Refactors Summary Table

> This is the single source of truth for the execute phase (04b). For detail on any discussed item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above.

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 2.1 | AI | Extract pre-existing inline CLI string literals (`command01Input` fragments + env-var error message) to named constants | SKIP | Rejected by human (matches AI's NOT RECOMMENDED — out of scope for a rename; pre-existing AHQ-143 code; no Rule-of-Three justification) |

**There are no EXECUTE items.** 04b will run with an empty execute list — no code changes to make. This is the expected outcome for a clean rename Jira: the rename itself was the work, GREEN had zero deferred items, and the only surfaced opportunity was out-of-scope pre-existing cleanup that the human (and AI) chose to skip.

---

## Next Steps

1. Review the "Previous Phases" table - if you disagree with any "Skip", add it to Human-Identified Potential Refactors
2. Mark the AI-Identified Tier 2 refactor (2.1) as APPROVE / REJECT / DISCUSS
3. Fill in "Human-Identified Potential Refactors" with your own refactors, or write "None"
4. Tell the AI you've completed your review
5. The AI will discuss: any items you marked DISCUSS + all human-identified items
6. After discussion, the AI fills in "Agreed Refactors Discussion Notes" and "Agreed Refactors Summary Table"
7. The execute phase (04b) runs automatically

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-06-10 22:12.

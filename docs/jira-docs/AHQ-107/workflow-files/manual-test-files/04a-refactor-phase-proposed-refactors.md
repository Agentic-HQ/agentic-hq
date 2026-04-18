# REFACTOR Analysis: AHQ-107 (manual test)

**Jira**: [AHQ-107](https://agentic-hq.atlassian.net/browse/AHQ-107)
**Test Type**: manual
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-04-18

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

**Command**: N/A (test-type = manual)
**Result**: Human confirmed they are happy to proceed with REFACTOR analysis without re-running manual test. Per the Jira: "No need to test this create-workflow workflow again after you've made this change — I'll be using it again soon and will confirm it works and fix it if it doesn't."

The implementation is markdown-only edits to 5 command-instruction files. No TypeScript code was changed, so `pnpm validate` is not relevant here.

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, red phase, green phase plan, and green phase summary for deferred items and opportunities.

Grep for `REFACTOR` / `refactor` / `Refactor` inside `docs/jira-docs/AHQ-107/workflow-files` returned only the boilerplate "Ready for REFACTOR Phase" link at the end of the GREEN summary — no explicit deferrals.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | AI summary Q1 answer: "If we implement a feature that allows multiple objects/strings to be safely passed between commands (e.g. in a Json file) we may revisit this" | Deferred (future) | Convert command-input-output-string from plain-English to JSON so `exampleParameters` (and future multi-value fields) can be passed cleanly between commands instead of being read from the spec file | This is a larger infrastructure change across the whole CLI, not just this Jira. Definitely out of scope for REFACTOR here. Worth a separate Jira if/when we hit more problems like this. | Skip (out of scope) |
| P.2 | Green-phase summary "key decision 2": `ahq-workflow-metadata-filename` is declared in every command for consistency, even though Commands 04/05 don't reference it | Observed | Commands 04 and 05 declare `ahq-workflow-metadata-filename` on line 34 but never use it anywhere else. This is a dead/unused variable. | The Jira literally required "Every command ... should have: new variable: ahq-workflow-metadata-filename". So the Jira itself specified this. That said, the principle is "don't declare unused variables" — if Commands 04/05 genuinely don't need it, the declaration just adds noise. See Tier 2 refactor 2.1 below for human decision. | Tier 2 (human judgement) |
| P.3 | Green-phase plan Risks section: "Renumbering risk: Multiple renumbering operations" | Observed | Now that renumbering is done, verify consistency — no stray references to old numbers (e.g. old `3c` for description, old `4b` for TS CLI, old items 6/7/8 in Command 03) | I re-read each edited file in full — no stray references found. All cross-references use variable names (e.g. `{ahq-workflow-metadata-filename}`) rather than section numbers, which is good. | Skip (already clean) |
| P.4 | Green-phase plan 2.3: "`ahq-workflow-metadata-filename` must be declared in Step 4 in Command 01 — not Step 0b" (because `skills-dir` isn't in scope in Step 0b of Command 01) | Observed | Command 01 has the variable in Step 4 while Commands 02–05 have it in Step 0b. Minor asymmetry. | This is forced by the structure of Command 01 (user supplies `plugin-id` etc. in Step 3, so `skills-dir` can't exist until Step 4). Keeping it in Step 4 is correct. Moving it would break the dependency chain. | Skip (not a refactor — it's the right structure) |
| P.5 | Green-phase summary "key decision 6": "Explicit `-- ` prefix enforcement and empty-string `""` convention ... were added as CRITICAL instructions in Command 01 Step 5" | Observed | The `-- ` prefix rule is repeated in three places: Command 01 Step 5 (authored), Command 02 Step 4b (consumed), Command 03 Step 2 item 6 (validated). Rule of Three → potentially extract. | Each command is meant to be self-contained (an AI reading one command shouldn't have to chase external docs). The rule being co-located with where it's applied is actually helpful, not harmful. However, if the rule ever changes, three places must be updated in lock-step. | Tier 2 (human judgement) — see 2.2 |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below.

---

## Magic Constants Audit

These files are markdown AI-instruction templates, not executable code. "Magic constants" here means literal values that could drift out-of-sync if the same value is duplicated across files.

| File | Line | Literal Value | Status | Notes |
|------|------|---------------|--------|-------|
| `02-confirm-spec-approved-and-build.md` | 166 | `"1.0.0"` (JSON version) | Not duplicated elsewhere | Only appears in Command 02's template. Fine. |
| `02-confirm-spec-approved-and-build.md` | 167 | `"Agentic HQ"` (author name) | Not duplicated elsewhere | Only appears in Command 02's template. Fine. |
| All 5 command files | — | `ahq-workflow.json` | Already extracted to `ahq-workflow-metadata-filename` variable | Good — filename is in a named variable in every command. |
| `02-confirm-spec-approved-and-build.md` line 82 + item 4b (lines 143–172) | — | The 7 field names (`pluginId`, `skillId`, `shortId`, `description`, `exampleParameters`, `version`, `author.name`) | Listed in 3 places (Command 02 plan bullet 2 — "7 required fields"; Command 02 template 4b — enumerated; Command 03 Step 2 item 6 — enumerated) | Rule of Three — see Tier 2 refactor 2.3 below. |
| Command 01 Step 5 | 142 | `"agentic-hq full-jira -- --jira-id=AHQ-107"` (example command) | Illustrative example only | Fine — concrete example helps the AI understand. |

**Summary**: No extractable magic constants for Tier 1. The one candidate (the 7 field-name list) is a larger structural question — escalated to Tier 2 refactor 2.3.

---

## Audit To Confirm Methods Used In Production Code (Not Just Tests)

**Not applicable** — this Jira touches only markdown instruction files. No interfaces, classes, or methods were created or modified.

The closest analogue in markdown-instruction land is "variables declared but not used", which is covered by Tier 2 refactor 2.1 (unused `ahq-workflow-metadata-filename` in Commands 04 and 05).

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| — | — | No Tier 1 refactors identified. | — |

**Rationale**: The GREEN implementation is small, targeted, and already clean. All literal values that matter are already extracted to named variables (`ahq-workflow-metadata-filename`). Naming is clear. Nothing is obviously dead in the sense of "code that will never run" (the variables in Commands 04/05 are declared-but-unused, but that's a Tier 2 judgement because the Jira explicitly required them).

---

## Tier 2: AI-Identified Potential Refactors

### Refactor 2.1: Remove unused `ahq-workflow-metadata-filename` declaration from Commands 04 and 05

**Type**: Dead variable removal
**Description**: Commands 04 (`04-document-workflow.md`) and 05 (`05-get-human-to-test-workflow.md`) declare `ahq-workflow-metadata-filename = {skills-dir}/ahq-workflow.json` in Step 0b (line 34 in each) but the variable is never referenced elsewhere in either file. Remove the line from both.
**AI Recommendation**: **UNSURE**. The Jira says "Every command in ... should have: new variable: ahq-workflow-metadata-filename". So strictly following the Jira, we should keep it. But the principle of "don't declare unused variables" pulls the other way. Arguments:
  - **For removing**: Clutter. Declaring a variable only to not use it is confusing — future AIs reading the command wonder what it's for, maybe accidentally re-derive it, etc. Similar anti-pattern to unused class fields prefixed with `_`.
  - **For keeping**: (a) The Jira literally asked for it. (b) Consistency across all 5 commands means future edits (e.g. if Command 04 later needs to reference the metadata file for generating docs) won't require adding it back. (c) Command 04 arguably *could* use it — the user-facing help doc could link to the metadata file.
**Risk**: If we remove it and later want to reference it in Command 04 (e.g. to include metadata details in user-facing docs), we have to add it back.
**Files affected**: `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/04-document-workflow.md`, `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/05-get-human-to-test-workflow.md`

**Your Decision**:
- [ ] **APPROVE** - Remove from Commands 04 and 05
- [x] **REJECT** - Keep as-is (matches Jira literal requirement)
- [ ] **DISCUSS** - Let's talk about whether Command 04 should actually use the metadata file

**Comments** (optional): _______________

---

### Refactor 2.2: Extract the `-- ` prefix + empty-string convention to a single canonical place

**Type**: Duplication removal across files
**Description**: The `exampleParameters` convention ("starts with `-- ` when non-empty, empty string `""` when no parameters") is stated in three places:
  1. Command 01 Step 5 — where the value is first elicited from the user (authored)
  2. Command 02 Step 4b — where the value is consumed from the spec (re-validated)
  3. Command 03 Step 2 item 6 — where the output file is validated
Options:
  - **Option A — Extract to a single "conventions" doc** (e.g. `docs/dev/ahq-workflow-json-conventions.md`) and reference it from each of the three commands.
  - **Option B — Keep in Command 01 only** (the authoring place) and have Commands 02 and 03 simply reference "per the convention stated in Command 01 Step 5".
  - **Option C — Leave as-is.**
**AI Recommendation**: **NOT RECOMMENDED — leave as-is**. Reasoning:
  - Command instruction files are meant to be self-contained. Each AI session only sees one command at a time, so having the rule *right where it's applied* is genuinely useful.
  - The rule is two sentences long — the cost of duplication is tiny.
  - "Has It Earned It?" — the rule is stable; it's unlikely to change. If we extract now, we create an indirection that pays off only if the rule changes, and adds cognitive overhead every time someone reads a command.
  - Classic Rule-of-Three caveat: the "three places" are not three callers of the same function — they are three *different roles* (author, consume, validate). Some variation in phrasing is actually appropriate.
**Risk**: Extracting would add file reads to each command and create a "where is this defined?" question the AI has to chase down.
**Files affected**: Commands 01, 02, 03

**Your Decision**:
- [ ] **APPROVE** - Extract to a shared conventions doc
- [x] **REJECT** - Leave as-is (AI recommendation)
- [ ] **DISCUSS** - I want to talk through options

**Comments** (optional): _______________

---

### Refactor 2.3: Extract the 7-field JSON schema list to a single canonical place

**Type**: Duplication removal across files
**Description**: The list of 7 required fields (`pluginId`, `skillId`, `shortId`, `description`, `exampleParameters`, `version`, `author.name`) appears enumerated in two commands:
  1. Command 02 Step 4b (lines 147–154) — with field-source mappings — and again in the template (lines 158–169)
  2. Command 03 Step 2 item 6 (line 72) — as the validation list
Plus a "7 required fields" mention in Command 02 Step 3 bullet 2 (line 82).
If we add an 8th field to `ahq-workflow.json` in a future Jira, we must update both places in lock-step.
Options:
  - **Option A — Extract template to a canonical file** (e.g. `docs/dev/ahq-workflow-json-schema.md`) and reference from Commands 02 and 03.
  - **Option B — Leave as-is.** Rely on the fact that adding a field is a deliberate act that will include updating both places.
**AI Recommendation**: **NOT RECOMMENDED — leave as-is**. Reasoning:
  - The schema is stable (AHQ-103 locked it; every existing workflow uses the same 7 fields).
  - Two places is not "rule of three" territory yet.
  - The template in Command 02 and the validation list in Command 03 serve *different purposes* (generate vs. validate) — keeping them side-by-side in their respective contexts is clearer than an indirection.
  - If/when a schema change happens, both edits are a single mechanical operation guided by the Jira.
**Risk**: Low either way. Cost of extraction is the same "self-containedness" argument as 2.2.
**Files affected**: Commands 02, 03

**Your Decision**:
- [ ] **APPROVE** - Extract schema to a canonical file
- [x] **REJECT** - Leave as-is (AI recommendation)
- [ ] **DISCUSS** - I want to talk through options

**Comments** (optional): _______________

---

### Refactor 2.4: Command 04 should surface `ahq-workflow.json` details in user-facing help doc

**Type**: Use existing-but-unused variable / scope expansion
**Description**: Command 04 creates `user-facing-help-doc.md` but currently doesn't include workflow metadata (e.g. the `shortId`, `exampleParameters`, author, version) from `ahq-workflow.json`. Since the metadata file now exists for every workflow, the user-facing help doc could read it and surface those values directly — which would make it more useful and would also give Command 04 a reason to actually use the `ahq-workflow-metadata-filename` variable it declares.
**AI Recommendation**: **UNSURE**. This is technically a scope expansion beyond AHQ-107, but it's a small, coherent improvement that follows naturally from what AHQ-107 just added. Could also be a separate Jira.
**Risk**: Scope creep — this isn't strictly in the AHQ-107 Jira.
**Files affected**: `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/04-document-workflow.md`

**Your Decision**:
- [x] **APPROVE** - Do it now as part of REFACTOR (small, follows naturally)
- [ ] **REJECT** - Out of scope; create a separate Jira if it matters
- [ ] **DISCUSS** - Worth thinking about

**Comments** (optional): Good spot!

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None". Everything added here will be discussed with the AI before a decision is made.

> **MANDATORY**: You MUST either add refactors here OR write "None" before the execute phase can proceed.

None

---

## Project Design Requirements Compliance Audit

**Design Requirements File**: `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/dev/project-design-requirements.md`

The design requirements document concerns OO TypeScript code (class/interface pairs, tell-don't-ask, avoiding cached state, concept tables, data dictionaries, ELD). **This Jira edits only markdown command-instruction files — no TypeScript classes, interfaces, or methods were created or modified.** The GREEN plan Step "Project Design Requirements Compliance" reached the same conclusion (all D.1–D.5 marked N/A; only D.6 "general clarity & consistency" applies).

| # | Requirement | Evidence (files, classes, patterns) | Status | Refactoring Proposal (if needed) |
|---|-------------|-------------------------------------|--------|----------------------------------|
| DR.1 | Class/interface pair for every concept | No classes/interfaces created or modified in this Jira | NOT APPLICABLE | — |
| DR.2 | Tell-don't-ask / push work into objects | No code changed | NOT APPLICABLE | — |
| DR.3 | Avoid cached state | No code changed | NOT APPLICABLE | — |
| DR.4 | Switchable concrete classes | No code changed | NOT APPLICABLE | — |
| DR.5 | Concept Table / Data Dictionary / ELD | Required only when classes/interfaces change | NOT APPLICABLE | — |
| DR.6 | General clarity & consistency of instruction templates | The 5 edited command files follow the existing Step 0a/0b/…/self-terminate pattern. Variables are kebab-case. The `Step 0a` input format in Commands 02–05 is now consistent (all four parse the same 4 variables). `ahq-workflow-metadata-filename` is placed at the correct point in the variable chain in each command (Step 4 in Command 01 — because `skills-dir` isn't in scope until then — and Step 0b in Commands 02–05). | MET | — |

**Summary**: 0 of 6 requirements MET (applicable) + 1 additional DR.6 MET + 5 NOT APPLICABLE. No compliance refactorings needed.

> **Note to human**: Any refactoring proposals in this audit would have been added to Tier 2 above for your APPROVE / REJECT / DISCUSS decision. None were needed for this Jira.

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 0 |
| Tier 2 AI-Identified (Pending review) | 4 |
| Design Requirements Audit (items needing action) | 0 |
| **Total identified by AI** | 4 |

---

## Agreed Refactors Discussion Notes

No items were marked DISCUSS, and the human marked "None" for Human-Identified Refactors. Straight APPROVE / REJECT decisions only — no discussion was required. See the summary table below.

---

## Agreed Refactors Summary Table

> For detail on any discussed item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above. (No items were discussed in this round.)

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 2.1 | AI | Remove unused `ahq-workflow-metadata-filename` declaration from Commands 04 and 05 | SKIP | Rejected by human — keep to match Jira literal requirement ("Every command ... should have: new variable") |
| 2.2 | AI | Extract the `-- ` prefix + empty-string convention to a single canonical place | SKIP | Rejected by human — AI recommendation (self-contained commands better) accepted |
| 2.3 | AI | Extract the 7-field JSON schema list to a single canonical place | SKIP | Rejected by human — AI recommendation (not yet rule-of-three) accepted |
| 2.4 | AI | Command 04 should surface `ahq-workflow.json` details in user-facing help doc | EXECUTE | Approved by human ("Good spot!") — Command 04 will read `{ahq-workflow-metadata-filename}` and include `shortId`, `exampleParameters`, `version`, and `author.name` in the user-facing help doc |

**Only 1 refactor to execute in 04b: Refactor 2.4.**

---

## Next Steps

1. ✅ Human review complete — all 4 Tier 2 items decided.
2. ✅ Discussion skipped — no DISCUSS marks, no human-identified items.
3. ✅ Agreed Refactors Summary Table filled in (1 EXECUTE, 3 SKIP).
4. The execute phase (04b) will run and implement Refactor 2.4.

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-04-18.

# AHQ-134 — Audit & Analysis of CLAUDE.md Files

**Date:** 2026-05-11
**Auditor:** Claude (Opus 4.7)
**Scope:** Two CLAUDE.md files loaded into every Claude Code session

## Files Audited

| File | Lines | Approx Tokens |
| --- | --- | --- |
| `~/.claude/CLAUDE.md` (user global, all projects) | 179 | ~4.2k |
| `/Users/stevepersonal/dev/agentic-hq/agentic-hq/CLAUDE.md` (project) | 831 | ~14.4k |
| **Total loaded every session** | **1,010** | **~18.6k** |

For reference, Claude Code's context budget for the project is 200k tokens. ~18.6k spent purely on rule-reminders before any work begins is a meaningful chunk — and several rules below are stale, duplicated, or already enforced by tooling.

## Backups Taken Before Edits

- **Global file:** human backed up `~/.claude/CLAUDE.md` to `~/.claude/CLAUDE.md.backup.12thMay2026_Pre_AHQ-134-Audit-And-Cleanup` before starting edits.

---

## How To Use This Document

For each finding:

1. Read the **Quick Summary** and **Claude's Recommendation**.
2. Fill in **Human's Decision** with one of:
   - **LEAVE** — keep as-is.
   - **REDUCE** — keep the rule but cut it down (Claude proposes how).
   - **DITCH** — remove entirely.
3. Optionally add a comment.

Once decisions are filled in, a follow-up edit pass can apply them mechanically.

---

# Section 1 — Global File: `~/.claude/CLAUDE.md`

This file is loaded for **every project**, so the bar for inclusion should be high: it must be useful across many codebases, not just Agentic HQ. Some Agentic-HQ-specific examples have leaked in.

## G-01 — File header has no purpose statement

- **Severity:** NOTE
- **Location:** L1 (just `# CLAUDE.md`)
- **Quick Summary:** No one-line description of what this file is or who it's for. A reader (human or AI) has to infer.
- **Claude's Recommendation:** REDUCE — add one line under the heading: `> Global Claude rules applied to every project on this machine.`
- **Human's Decision:** DO
- **Human's Comment:** _(optional)_

## G-02 — "Never Download/Install Tools Without Approval" (L3-5)

- **Quick Summary:** 3 lines. Tight, clear, broadly applicable.
- **Claude's Recommendation:** LEAVE — exemplar of how a global rule should look.
- **Human's Decision:** LEAVE
- **Human's Comment:** _(optional)_

## G-03 — "NEVER Modify User Environment Files" (L7-23)

- **Quick Summary:** ~17 lines, includes a Real Violation from 2026-03-04. Within the "~15-20 lines max" budget the project file recommends. Useful, machine-wide.
- **Claude's Recommendation:** LEAVE — slightly over budget but the violation example is load-bearing for "why" — drop the example only if absolutely needed.
- **Human's Decision:** LEAVE
- **Human's Comment:** _(optional)_

## G-04 — "Rules From Human Coder" — two unrelated rules glued together (L25-28)

- **Severity:** NOTE
- **Quick Summary:** Section contains (a) "all docs in docs folder except README.md" and (b) a long paragraph re-defining TDD from scratch. They're unrelated, and (b) duplicates the next section ("THE COMPLETE TDD CYCLE").
- **Claude's Recommendation:** REDUCE — split: keep the docs-folder bullet as its own short section; delete the TDD definition (covered by the next section + project file).
- **Human's Decision:** REDUCE
- **Human's Comment:** I've moved the TDD paragraph into the next section. Please just fix the section title for the "Docs" rule.

## G-05 — "THE COMPLETE TDD CYCLE" (L30-60)

- **Severity:** STALE / REDUNDANT
- **Quick Summary:** ~30 lines of TDD-cycle reminders. The opening parenthetical (L34) admits this whole section is meant to be deleted once the workflow engine enforces RED/GREEN/REFACTOR via separate commands. The project file's "Development Notes" repeats the same sentiment.
- **Claude's Recommendation:** REDUCE — the cycle is enforced by the AHQ workflow (3 separate commands per Jira, per recent commits like AHQ-123 / AHQ-128). Compress to a 4-line stub: "TDD is enforced by the AHQ workflow engine. If running outside the workflow, follow RED → GREEN → REFACTOR → VERIFY." Keep the 2026-03-14 Commander.js real-example only if it's actually being referred to.
- **Human's Decision:** LEAVE
- **Human's Comment:** As it's my main dev mode - and sometimes I don't use the TDD Workflow - I'm leaving this in place.

## G-06 — "ALWAYS RUN CODE BEFORE AND AFTER MODIFICATIONS" (L62-111)

- **Severity:** REDUNDANT / OVERLONG
- **Quick Summary:** 50 lines. Substantially overlaps with the TDD-cycle section ("GREEN means more than unit tests passing") and with the project file's "Never Update Code Without Running Tests First". Has heavy markdown emphasis (🚨, ✅, NO EXCEPTIONS) that doesn't aid an AI reader.
- **Claude's Recommendation:** REDUCE — collapse to a single 5-line rule: "Before changing code, run it (or its tests) to confirm current behaviour. After changing, run again. This applies to test code and scripts too, not just prod." Drop the 2025-10-28 console-logger example unless still referenced.
- **Human's Decision:** REDUCE
- **Human's Comment:** 

## G-07 — "100% Test Pass Requirement" (L113-126) — stale, now enforced

- **Severity:** STALE
- **Quick Summary:** L115 already admits this is being moved into a Pre-Commit Quality Checks command. The project's `/commit` command already runs `pnpm validate` (which runs the unit tests) — see AHQ-7.
- **Claude's Recommendation:** DITCH — enforced by tooling. If you want a single-line reminder for non-AHQ projects, leave one bullet under a "Test Discipline" mini-section.
- **Human's Decision:** DITCH
- **Human's Comment:** _(optional)_

## G-08 — "Playwright Test Configuration" (L128-136)

- **Quick Summary:** 8 lines, specific, actionable, machine-wide. No issues.
- **Claude's Recommendation:** LEAVE.
- **Human's Decision:** DITCH
- **Human's Comment:** I don't use Playwright any more. If I start again and hit a problem I'll put a new rule in.

## G-09 — "Running Tests Efficiently" (L138-146)

- **Quick Summary:** 8 lines. Good general advice but "10x faster" claim is unverified hand-wave.
- **Claude's Recommendation:** LEAVE — trim "10x faster" claim if you want to be precise.
- **Human's Decision:** LEAVE
- **Human's Comment:** When you've got 10 long tests, running only 1 is (on average) 10x faster...

## G-10 — "Test Watch Mode - NEVER USE" (L148-154)

- **Quick Summary:** 6 lines. Useful machine-wide.
- **Claude's Recommendation:** LEAVE.
- **Human's Decision:** LEAVE
- **Human's Comment:** _(optional)_

## G-11 — "Never Fix Bugs By Removing Features" (L156-179)

- **Quick Summary:** ~24 lines, useful, broadly applicable. Includes a 2025-12-31 sticky-headers example that justifies the rule.
- **Claude's Recommendation:** LEAVE — the example is doing real work explaining "this is what the trap looks like".
- **Human's Decision:** LEAVE
- **Human's Comment:** _(optional)_

## G-12 — Overall: global file has Agentic-HQ-specific references

- **Severity:** NOTE
- **Quick Summary:** The TDD section (L34) references "the Agentic HQ workflow engine". That's a *project*-specific tool, not something every project on this machine has. Doesn't belong in the user-global file.
- **Claude's Recommendation:** REDUCE — strip AHQ-specific parentheticals from the global file. If TDD enforcement is project-specific, the rule for global only says "follow TDD"; the "is enforced by workflow" caveat belongs in the project file.
- **Human's Decision:** LEAVE
- **Human's Comment:** I've updated this comment already.

---

# Section 2 — Project File: `/Users/stevepersonal/dev/agentic-hq/agentic-hq/CLAUDE.md`

This file is loaded for every Claude Code session in the Agentic HQ repo. At 831 lines / ~14.4k tokens, it's the dominant cost. Several rules massively exceed the file's own conciseness budget.

## P-01 — File violates its own conciseness meta-rule

- **Severity:** NOTE (already raised in Jira)
- **Location:** L9-24 (meta-rule: "~15-20 lines max") vs whole file.
- **Quick Summary:** The meta-rule says new rules should be 15-20 lines. Three sections grossly violate this:
  - "Never Catch Errors and Fall Back to Defaults" — ~130 lines (P-06)
  - "Never Use Underscore Prefix" — ~180 lines (P-07)
  - "Unit Tests Must Verify Main Behavior" — ~260 lines (P-08)
- **Claude's Recommendation:** REDUCE — compress those three rules per the meta-rule's targets (see P-06, P-07, P-08 below). Either that, or delete the meta-rule and accept that some rules are essays. Keeping both is the only bad option.
- **Human's Decision:** See below (we will reduce those rules)
- **Human's Comment:** _(optional)_

## P-02 — Use Perplexity MCP advice (L5-7)

- **Quick Summary:** 3 lines, useful, well-targeted.
- **Claude's Recommendation:** LEAVE.
- **Human's Decision:** LEAVE
- **Human's Comment:** I've updated the rule (as MCP not available on my machine)

## P-03 — "KEEP CLAUDE.MD CONCISE" (L9-24)

- **Quick Summary:** ~16 lines. Itself compliant with its rule. Useful guardrail when future rules are added.
- **Claude's Recommendation:** LEAVE.
- **Human's Decision:** LEAVE
- **Human's Comment:** _(optional)_

## P-04 — "NEVER COMMIT WITHOUT EXPLICIT APPROVAL" (L26-37)

- **Quick Summary:** 11 lines. Compliant, useful.
- **Claude's Recommendation:** LEAVE.
- **Human's Decision:** LEAVE
- **Human's Comment:** _(optional)_

## P-05 — "Running Formatters: Only After Confirming Scope" (L39-62)

- **Quick Summary:** ~24 lines. Slightly over budget but explains a non-obvious scope-discipline rule.
- **Claude's Recommendation:** LEAVE — could be tightened to ~15 lines (drop the "problem we're avoiding" recap, the workflow already shows the failure mode). But not a high-value cut.
- **Human's Decision:** LEAVE
- **Human's Comment:** _(optional)_

## P-06 — "NEVER CATCH ERRORS AND FALL BACK TO DEFAULTS" (L64-192)

- **Severity:** OVERLONG (meta-rule violation, ~130 lines)
- **Quick Summary:** Two giant code blocks (BAD ConfigManager / GOOD ConfigManager), and a similar BAD/GOOD pair for LogLibrary. The rule itself is one sentence; the rest is examples for one specific 2025-10-28 incident.
- **Claude's Recommendation:** REDUCE — cut to ~15-20 lines:
  - State the rule (1-2 lines).
  - One short BAD/GOOD code snippet (~6 lines each), not two.
  - List "always fail fast for" and "only catch when" as 2 short bullets each.
  - Drop the 2025-10-28 narrative (the rule is the rule; the incident is git history).
- **Human's Decision:** REDUCE
- **Human's Comment:** _(optional)_

## P-07 — "NEVER USE UNDERSCORE PREFIX TO SUPPRESS WARNINGS" (L194-373)

- **Severity:** OVERLONG (meta-rule violation, ~180 lines)
- **Quick Summary:** Five large code blocks (wrong pattern, two correct patterns, two legit underscore examples, real-world failure). Question-checklist. Rules-to-prevent list. Final ask-yourself checklist. Repeats the same idea from five angles.
- **Claude's Recommendation:** REDUCE — cut to ~15-20 lines:
  - Rule statement (1 line).
  - One short BAD/GOOD snippet (≤10 lines combined).
  - One bullet listing the *only* legit cases (interface/callback signature constraints).
  - Single decision rule: "Stored as field? Must be used somewhere. Required by signature you can't change? Underscore OK. Otherwise: fix properly."
- **Human's Decision:** REDUCE
- **Human's Comment:** _(optional)_

## P-08 — "UNIT TESTS MUST VERIFY MAIN BEHAVIOR" (L375-633)

- **Severity:** OVERLONG (meta-rule violation, ~260 lines — the worst offender)
- **Quick Summary:** Massive walkthrough of the Story 10 CamundaWorkflowEngine incident with full BAD/GOOD code examples (~80 lines of code each), warning signs list, questions list, mandatory rules list, "before claiming complete" checklist, real-impact section, summary. The same point is restated 6+ times.
- **Claude's Recommendation:** REDUCE — cut to ~20 lines:
  - Rule (1-2 lines): "Unit tests must call the primary public methods and assert behaviour, not just that the constructor returned an object."
  - One short BAD/GOOD contrast (~8 lines combined).
  - 4-5 bullets on red flags (`expect(x).toBeDefined()` as sole assertion, TODO-test-later comments, "we'll cover it in integration tests", etc.).
  - Drop the 2025-10-28 Story 10 narrative — git history has it.
- **Human's Decision:** REDUCE
- **Human's Comment:** _(optional)_

## P-09 — "CHECK FOR EXISTING CODE BEFORE CREATING NEW FUNCTIONS" (L635-655)

- **Quick Summary:** ~21 lines. Borderline but useful and references a specific pattern (REFACTOR LIST).
- **Claude's Recommendation:** LEAVE.
- **Human's Decision:** LEAVE
- **Human's Comment:** _(optional)_

## P-10 — "Project Overview" typo + outdated framing (L657-659)

- **Severity:** WRONG (already raised in Jira as Finding 24)
- **Quick Summary:** L659: "we're not using much smaller chunks" — typo, intent is "we're **now** using". Also still mentions BMAD as the prior framework, which is fine context but slightly stale.
- **Claude's Recommendation:** REDUCE — fix typo (`not` → `now`). Consider trimming the BMAD reference to a single sentence, e.g. "Agentic HQ is a modular open-source framework for orchestrating agentic software development teams. Work is broken into small Jira-defined chunks."
- **Human's Decision:** DONE BY HUMAN
- **Human's Comment:**  the top and reduced it, so can be left as is now.

## P-11 — "Development Notes" — stale parentheticals (L661-667)

- **Severity:** STALE (related to Jira Finding 23)
- **Quick Summary:** Two "you won't have to remember this any more" parentheticals plus references to AHQ-7 (now merged). Bullet on "All validation must pass" admits it's already enforced by `/commit`.
- **Claude's Recommendation:** REDUCE — delete the parentheticals (they're maintenance notes to the human, not Claude). Convert the "all validation must pass" bullet into "Validation is enforced by `/commit` (runs `pnpm validate`)." Drop the AHQ-7 link, it's history.
- **Human's Decision:** DONE BY HUMAN
- **Human's Comment:** I've moved this to ## Development And Testing Rules - and updated the text, so can be left as is now.

## P-12 — "VALIDATION REQUIRED BEFORE COMMITTING" — multiple issues (L669-752)

- **Severity:** WRONG + STALE + OVERLONG (~90 lines; matches Jira Findings 23/25/26/27)
- **Quick Summary:** Several distinct problems in one section:
  1. **WRONG** (L675-678): says `pnpm validate` runs three things. Actual package.json: `pnpm typecheck && pnpm lint:check && pnpm format:check && pnpm test` — that's **four**. Missing `format:check`.
  2. **STALE** parenthetical (L673): "you won't have to remember this any more".
  3. **STALE** (L692): hardcoded `HelloWorldE2ETest_20251108_173633` timestamp dir.
  4. **NOTE** (L696): spike-00 path reference reads as internal artefact.
  5. **REDUNDANT** (L701-737): repeats "why all three are required" / "standard practice" / "when to run" — same idea three times.
- **Claude's Recommendation:** REDUCE — rewrite to ~15-20 lines:
  - Fix the count to 4 and list all four checks.
  - Drop the parenthetical, the hardcoded mission timestamp (use `<MissionId>` placeholder), and the spike path (use `<spike-dir>` placeholder).
  - Drop the "Standard Practice (Per Perplexity)" + "When to Run These Commands" + "Real Example" sub-sections — they all say the same thing. Keep just the rule + the directory-disambiguation warning (which IS load-bearing — running `pnpm validate` in the wrong dir can kill an in-flight mission test).
- **Human's Decision:** REDUCE
- **Human's Comment:** _(optional)_

## P-13 — "Never Update Code Without Running Tests First" — spike-specific example (L754-797)

- **Severity:** STALE (Jira Finding 28)
- **Quick Summary:** Real-example references `infrastructure.integration.test.ts` and `@spike-00/config-manager` — both inside the spike workspace, not the main codebase. Confusing for a top-level rule.
- **Claude's Recommendation:** REDUCE — keep the rule (~6 lines), drop the spike-specific narrative or rephrase it generically: "Real example: an AI was about to swap `process.cwd()` for a ConfigManager helper. Running the test first showed it was already correct — the swap would have broken it." Total target: ~10 lines.
- **Human's Decision:** REDUCE
- **Human's Comment:** _(optional)_

## P-14 — "Before Deleting/Renaming/Moving Files" (L799-801)

- **Quick Summary:** 2 lines. Tight, useful.
- **Claude's Recommendation:** LEAVE.
- **Human's Decision:** LEAVE
- **Human's Comment:** _(optional)_

## P-15 — "Notes On Refactoring Stage Of TDD" — stale parenthetical + verbose (L803-823)

- **Severity:** STALE
- **Quick Summary:** Stale "you won't have to remember this any more" parenthetical (L805). The "example output" block (L815-823) is one specific REFACTOR summary preserved verbatim — useful as a template, but stale-dated.
- **Claude's Recommendation:** REDUCE — drop the parenthetical. Keep the 4-bullet definition of REFACTOR. Replace the canned example with a generic 3-bullet template, or drop the example entirely. Target: ~10 lines.
- **Human's Decision:** HUMAN HAS DELETED
- **Human's Comment:** All refactoring done now as part of TDD Jira (or other workflow) which has all the instructions in it.

## P-16 — "Don't Invent Things That Aren't In The Spec" — stream-of-consciousness (L825-827)

- **Severity:** NOTE (Jira Finding 29)
- **Quick Summary:** Rule is buried in one long paragraph with "(NOTE: I'm not sure how to enforce this... I doubt that this rule will actually stop this happening...)" tacked on the end. Reads like a private memo.
- **Claude's Recommendation:** REDUCE — turn into a directive in 4-6 lines:
  - Rule (1 line).
  - One real example sentence: "AHQ once had a mission test that wrote outputs to `docs/mission-docs/<id>/project-output/` while the production code wrote to `cwd()` — different dirs, silent bug."
  - Drop the self-doubt meta-commentary (move it to a private notes file if useful to you).
- **Human's Decision:** HUMAN HAS DELETED
- **Human's Comment:** not required any more (models have got better)

## P-17 — "Always Make Sure Modules And Tools Versions Are NOT Outdated" (L830-832)

- **Quick Summary:** One long paragraph (~3 lines wrapped). Useful but rambling.
- **Claude's Recommendation:** REDUCE — tighten to ~6 lines as 3-4 bullets: when to check (`pnpm outdated` at start of new project or big chunk), goal (latest LTS, avoid bleeding edge), why (past time-sink), what to do (raise upgrade decisions with the human).
- **Human's Decision:** HUMAN HAS DELETED
- **Human's Comment:** Because AI will never do this check realistically (as this project will never be "new" again...)

## P-18 — Project file must stand alone (meta principle)

- **Severity:** META
- **Quick Summary:** The concrete workflow-enforced drop (validation section) is handled by P-12. What's left as a meta finding is one principle worth keeping in mind for future audits:

The project CLAUDE.md is loaded for **every contributor** working in this repo, not just its author. The user-global `~/.claude/CLAUDE.md` only exists on one developer's machine. So "drop X from project because global covers it" is **wrong** — it leaves every other contributor missing the rule. The only legitimate "already covered" basis for dropping a project-file rule is **in-repo tooling** (skills, hooks, scripts, CI) that every contributor inherits.

- **Claude's Recommendation:** No action — just a principle to remember next time the project file is trimmed.
- **Human's Decision:** LEAVE
- **Human's Comment:** _(optional)_

## P-19 — Emoji / shouting density

- **Severity:** NOTE

### Current Header Inventory

Project file has **8 active `CRITICAL:` headers** (counting the meta-rule). At that density "CRITICAL" stops meaning anything — it's just header decoration. Listed with where I'd land each:

| File | Header (current text) | Current line | Recommended new form |
| --- | --- | --- | --- |
| Project | `## ⚠️ CRITICAL: KEEP CLAUDE.MD CONCISE ⚠️` | L23 | `## Keep CLAUDE.md Concise` |
| Project | `## 🚨 CRITICAL: NEVER COMMIT WITHOUT EXPLICIT APPROVAL 🚨` | L40 | **Keep CRITICAL** → `## CRITICAL: Never Commit Without Explicit Approval` (drop 🚨) |
| Project | `## 🚨 CRITICAL: NEVER CATCH ERRORS AND FALL BACK TO DEFAULTS 🚨` | L78 | **Keep CRITICAL** → `## CRITICAL: Never Catch Errors And Fall Back To Defaults` (drop 🚨) |
| Project | `## 🚨 CRITICAL: NEVER USE UNDERSCORE PREFIX TO SUPPRESS WARNINGS 🚨` | L208 | `## Never Use Underscore Prefix To Suppress Warnings` |
| Project | `## 🚨 CRITICAL: UNIT TESTS MUST VERIFY MAIN BEHAVIOR, NOT JUST INITIALIZATION 🚨` | L389 | `## Unit Tests Must Verify Behaviour, Not Just Initialisation` |
| Project | `## 🚨 CRITICAL: CHECK FOR EXISTING CODE BEFORE CREATING NEW FUNCTIONS 🚨` | L649 | `## Check For Existing Code Before Creating New Functions` |
| Project | `## 🚨 CRITICAL: VALIDATION REQUIRED BEFORE COMMITTING 🚨` | L672 | (becomes `## Validate Before Committing` per P-18; or drops entirely) |
| Project | `## CRITICAL: Never Update Code Without Running Tests First` | L757 | `## Never Update Code Without Running Tests First` |
| Global | `## 🔴🟢🔧✅ CRITICAL: THE COMPLETE TDD CYCLE` | L30 (global) | `## The Complete TDD Cycle` (content stays per G-05 LEAVE; just decoration goes) |

Net: **2 CRITICALs** remain (commit approval, fail-fast) — both genuinely catastrophic if broken. Six demoted.

HUMAN: I think I did most of these changes now - feel free to fix if I missed anything.

### Inline Cleanup

Once P-06 / P-07 / P-08 reduce the big sections, most embedded ❌/✅ disappears with the code blocks. What's left to clean up by hand:

- **`**NO EXCEPTIONS**` trailing line** — appears at the end of every major rule (L48, L206, L387, L647, L669, L755, L800). Adds nothing once the rule itself is tight. Strip all of them.
- **🚩 warning-sign bullets** — fine when the list genuinely *is* "warning signs to watch for" (P-09 list at L654-657 is one). Drop where the section is now ~15 lines and a single sub-heading does the same job.
- **`❓` question-checklist blocks** (e.g. L310-318 in the underscore rule) — these dissolve naturally when P-07 is REDUCED to ~15 lines.

HUMAN: OK - fine.

- **Claude's Recommendation:** REDUCE — apply all header rewrites in the table above (both files), strip trailing `**NO EXCEPTIONS**` lines from each rule, leave inline ❌/✅ where it's doing real work in code contrast.
- **Human's Decision:** REDUCE
- **Human's Comment:** _(optional)_

---

# Section 3 — Whole-Document Findings

These items are about the audit overall. S-01, S-02 and S-04 are read-only summary; S-03 is a real decision and uses the strict format.

## S-01 — Findings tally (post-decisions)

Informational only — these reflect choices you've already made above:

| Status | Findings |
| --- | --- |
| LEAVE (human kept as-is) | G-02, G-03, G-05, G-09, G-10, G-11, G-12, P-02, P-03, P-04, P-05, P-09, P-14, P-18 |
| REDUCE (compression to apply) | G-01, G-04, G-06, P-06, P-07, P-08, P-12, P-13, P-19 |
| DITCH (queued for removal) | G-07, G-08 |
| DONE BY HUMAN (already applied) | P-10, P-11, P-15, P-16, P-17 |

## S-02 — Estimated reduction if all REDUCE/DITCH applied

Informational only — projected outcome of the decisions above. Project file is already down from 831 → 804 lines (P-15/P-16/P-17 done). After the remaining REDUCEs (P-06, P-07, P-08 are the big three — together ~570 lines of the current file — plus P-12 ~80 lines, P-13 ~45 lines):

| File | Original | Current | Estimated Final | Saving vs original |
| --- | --- | --- | --- | --- |
| Global | 179 | 179 | ~115 (~36% smaller) | ~1.5k tokens |
| Project | 831 | 804 | ~180 (~78% smaller) | ~11.3k tokens |
| **Total saved per session** | | | | **~12.8k tokens** |

That's ~6.4% of Claude's 200k context budget back, every session — and roughly **70% of the current ~18.6k CLAUDE.md overhead removed**.

## S-03 — Suggested order of operations

- **Severity:** SUMMARY
- **Details:** Suggested order for applying the queued changes, each step independently committable:

1. **Apply the small REDUCEs:** G-01 (add header line), G-04 (fix Docs section title), G-06 (collapse 50-line rule to 5), P-13 (genericise spike-specific example).
2. **DITCH G-07 and G-08** (global): one-liner cuts.
3. **Compress the three offenders:** P-06, P-07, P-08 — biggest single win (~570 lines → ~55).
4. **Compress P-12** (validation section, ~80 → ~6).
5. **Polish pass:** P-19 header rewrites + strip trailing `**NO EXCEPTIONS**` lines.

- **Claude's Recommendation:** Follow this order. Small wins first builds confidence the strict-format process is working before tackling the big rewrites. Each step is a clean commit.
- **Human's Decision:** ACCEPT
- **Human's Comment:** _(optional)_

## S-04 — Coverage of original Jira findings

Informational only — confirms all eight findings raised in the Jira description are represented somewhere in the audit:

| Jira finding | Where addressed in this audit |
| --- | --- |
| 22 — meta-rule violation | P-01, P-06, P-07, P-08 |
| 23 — "Soon you won't need to remember" parentheticals | G-05, G-07, P-11, P-12, P-15 |
| 24 — typo `not` → `now` | P-10 |
| 25 — `pnpm validate` 3 vs 4 steps | P-12 |
| 26 — hardcoded mission timestamp | P-12 |
| 27 — spike-00 path reference | P-12 |
| 28 — `@spike-00/config-manager` real-example | P-13 |
| 29 — stream-of-consciousness "Don't Invent" | P-16 |

Additional findings new to this audit (not in Jira): G-01, G-04, G-06, G-12, P-09, P-18, P-19.

---

# Section 4 — Summary Of Changes Applied

Applied on **2026-05-12** by Claude (Opus 4.7), following S-03's accepted order. Both files rewritten in place.

## Global File Changes

| Finding | Action | Detail |
| --- | --- | --- |
| G-01 | ADDED | Header line under `# CLAUDE.md`: `> Global Claude rules applied to every project on this machine.` |
| G-04 | RENAMED | `## Rules From Human Coder` → `## Documentation Location` (TDD paragraph already moved by human into next section) |
| G-05 | HEADER DEMOTED | `## 🔴🟢🔧✅ CRITICAL: THE COMPLETE TDD CYCLE` → `## The Complete TDD Cycle` (content kept per G-05 LEAVE) |
| G-06 | COMPRESSED | "Always Run Code Before And After Modifications" — ~50 lines → 3 lines, plain header |
| G-07 | DELETED | "100% Test Pass Requirement" — already enforced by `/commit` running `pnpm validate` |
| G-08 | DELETED | "Playwright Test Configuration" — Playwright no longer in use |

Other global sections (G-02, G-03, G-09, G-10, G-11, G-12) kept as-is per the audit decisions, including their existing `CRITICAL:` headers (not in P-19's rewrite table).

## Project File Changes

| Finding | Action | Detail |
| --- | --- | --- |
| P-06 | COMPRESSED | "Never Catch Errors And Fall Back To Defaults" — ~130 lines → ~17 lines. **Kept `CRITICAL:`** prefix (per P-19), dropped 🚨 emojis. One BAD/GOOD snippet, fail-fast / catch-when bullets. |
| P-07 | COMPRESSED | "Never Use Underscore Prefix To Suppress Warnings" — ~180 lines → ~18 lines. Dropped CRITICAL+🚨. One BAD/GOOD snippet, legit-case bullet, decision-rule line. |
| P-08 | COMPRESSED | "Unit Tests Must Verify Behaviour, Not Just Initialisation" — ~260 lines → ~20 lines. Dropped CRITICAL+🚨. One BAD/GOOD snippet, red-flag bullets, sanity-check line. |
| P-12 | COMPRESSED + FIXED | "Validate Before Committing" — ~80 lines → ~16 lines. **Fixed step count to 4** (`typecheck` + `lint:check` + `format:check` + `test`). Replaced hardcoded mission timestamp and spike path with `<MissionId>` / `<project-or-mission-or-spike-dir>` placeholders. Dropped stale parenthetical, "Standard Practice", "When To Run", "Real Example" subsections. |
| P-13 | COMPRESSED | "Don't Update Code Without Running Tests First" — ~45 lines → ~10 lines. Spike-specific narrative genericised: now just "AI was about to swap `process.cwd()` for a config-manager helper. Running the test first showed it was already correct." |
| P-19 | APPLIED | Header rewrites per the table: title-cased the remaining all-caps headers (`KEEP CLAUDE.MD CONCISE` → `Keep CLAUDE.md Concise`, etc.); dropped 🚨 emojis everywhere; kept `CRITICAL:` prefix on exactly two sections — `Never Commit Without Explicit Approval` and `Never Catch Errors And Fall Back To Defaults`. Stripped trailing `**NO EXCEPTIONS**` lines from sections kept by P-04 and P-09. |

## Actual Reduction Achieved

| File | Before | After | % Reduction | Detail |
| --- | --- | --- | --- | --- |
| `~/.claude/CLAUDE.md` (global) | 179 lines | 110 lines | **~39%** | 69 lines removed |
| `/Users/stevepersonal/dev/agentic-hq/agentic-hq/CLAUDE.md` (project) | 831 lines (804 after human pre-edits) | 190 lines | **~77%** | 641 lines removed vs original (614 vs post-pre-edit) |
| **Total loaded per session** | 1,010 lines / ~18.6k tokens | 300 lines / ~5.5k tokens | **~70%** | ~13.1k tokens reclaimed (~6.5% of 200k context budget) |

Actual saving slightly better than the S-02 estimate (~12.8k tokens projected).


## What Was NOT Changed (Per Decisions)

- **Kept content as-is:** G-02, G-03, G-05 (content only), G-09, G-10, G-11, G-12, P-02, P-03, P-04, P-05, P-09, P-14, P-18.
- **Already done by human pre-edit:** P-10, P-11, P-15, P-16, P-17 (sections deleted or rewritten by human before Claude's apply pass).

## Verification

- Both files written via `Write` tool; line counts confirmed via `wc -l`.
- No automated tests apply to CLAUDE.md content (it is metadata for the AI, not executable code).
- The backup file `~/.claude/CLAUDE.md.backup.12thMay2026_Pre_AHQ-134-Audit-And-Cleanup` is retained against the original 179-line global file should rollback be needed.

## Suggested Next Steps

1. **Commit the changes** via `/commit` (one commit covering both files, plus this audit doc update).
2. **Resolve AHQ-134** once committed.
3. **Possible follow-up Jira:** the human mentioned in the AHQ-134 description that some rules might belong in the workflow commands rather than CLAUDE.md. Worth a separate Jira to audit whether (e.g.) the TDD cycle reminder in the global file can be removed once all dev runs through the workflow.

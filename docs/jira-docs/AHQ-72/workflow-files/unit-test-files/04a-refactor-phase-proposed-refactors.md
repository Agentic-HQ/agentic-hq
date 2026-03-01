# REFACTOR Analysis: AHQ-72 (unit test)

**Jira**: [AHQ-72](https://agentic-hq.atlassian.net/browse/AHQ-72)
**Test Type**: unit
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-02-28

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

**Command**: `pnpm test` (all unit tests)
**Result**: PASSING (3 tests across 3 files)

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, red phase, green phase, and implementation documents for deferred items and opportunities.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | GREEN phase summary: "The banner will be added during REFACTOR or when e2e tests are updated." | Deferred | Add the bold red `process.stdout.write()` banner (`printBanner`) to `runCliAndLogOutput()` — this is a core Jira requirement (AC item 2) that was deliberately omitted in GREEN because the unit test doesn't assert on it. | **I think we should add it.** It's an explicit acceptance criterion of the Jira: "Each test prints a bold red 4-line banner (separator, log path, tail -f command, separator) using `process.stdout.write()`". The unit test won't break (it doesn't assert on stdout), but the banner is the whole point of the feature for the human running the tests. | Tier 2 |
| P.2 | GREEN phase plan: "No error wrapping beyond what execSync already throws... These will be added when the e2e tests are updated (separate Jira work or REFACTOR)" | Deferred | Add error wrapping to `runCliAndLogOutput()` so that on command failure, the error message includes the log file **path** (not contents) and preserves the original error via `{ cause: error }`. | **I think we should NOT add it now.** The AI summary explicitly resolved that the error wrapping bug in the existing quick-jira inline function dumps the entire log file contents into the error message. The shared helper should handle this differently. However, the unit test doesn't test error behaviour, and adding error wrapping without a test violates TDD. If we want this, we'd need a new test first (which is scope creep for this REFACTOR phase). Leave for when e2e tests are updated. | Skip |
| P.3 | AI summary: "extract the existing inline `runCliAndLogOutput` from the quick-jira test into a shared utility... update all 3 e2e tests to use it" | Observed | The quick-jira e2e test (`tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts:62-82`) still has its own inline `runCliAndLogOutput()` function. The Jira's full scope is to replace all 3 e2e tests' approaches with the shared helper. | **NOT for this REFACTOR phase.** The unit TDD cycle is only about the shared helper module itself. Updating the 3 e2e tests to use the shared helper is the remaining Jira work after this unit TDD cycle completes. This is not a refactoring opportunity — it's the next phase of work. | Skip |
| P.4 | AI summary: "Fix `console.log` -> `process.stdout.write()` (the bug fix)" in existing quick-jira test | Observed | The existing quick-jira inline `runCliAndLogOutput` uses `console.log` for its banner (line 64-65), which is the known bug. | **Same as P.3 — not for this phase.** Fixing the quick-jira inline function is part of updating the e2e tests to use the shared helper, not part of refactoring the shared helper itself. | Skip |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below.

---

## Magic Constants Audit

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `tests/e2e/helpers/run-cli-and-log-output.ts` | 5 | `'/tmp'` | EXTRACTED | `LOG_FILE_DIRECTORY` |
| `tests/e2e/helpers/run-cli-and-log-output.ts` | 12 | `'e2e-'` | MAGIC | -> `LOG_FILE_PREFIX` |
| `tests/e2e/helpers/run-cli-and-log-output.ts` | 12 | `'.log'` | MAGIC | -> `LOG_FILE_EXTENSION` |
| `tests/e2e/helpers/run-cli-and-log-output.ts` | 13 | `'w'` | OK | Standard `fs.openSync` flag — no extraction needed |
| `tests/e2e/helpers/run-cli-and-log-output.ts` | 23 | `'utf-8'` | MAGIC | -> `LOG_FILE_ENCODING` |
| `tests/unit/e2e-helpers/run-cli-and-log-output.unit.test.ts` | 20 | `'/tmp/e2e-unit-test.log'` | EXTRACTED | `TEST_LOG_FILE` |
| `tests/unit/e2e-helpers/run-cli-and-log-output.unit.test.ts` | 32 | `"echo 'here is some test text'"` | OK | Test fixture data — extracting adds noise, not clarity |
| `tests/unit/e2e-helpers/run-cli-and-log-output.unit.test.ts` | 33 | `'unit-test'` | OK | Test fixture data — matches `TEST_LOG_FILE` path |

**MAGIC entries `'e2e-'`, `'.log'`, `'utf-8'` are included in Tier 1 refactors below.**

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.1 | Extract magic constant | Extract `'e2e-'` prefix to `LOG_FILE_PREFIX` constant | `tests/e2e/helpers/run-cli-and-log-output.ts` Line: 12 |
| 1.2 | Extract magic constant | Extract `'.log'` extension to `LOG_FILE_EXTENSION` constant | `tests/e2e/helpers/run-cli-and-log-output.ts` Line: 12 |
| 1.3 | Extract magic constant | Extract `'utf-8'` to `LOG_FILE_ENCODING` constant | `tests/e2e/helpers/run-cli-and-log-output.ts` Line: 23 |
| 1.4 | Add TSDoc | Add JSDoc/TSDoc comment to `runCliAndLogOutput()` explaining what it does, its parameters, and return value. Currently the function has zero documentation. | `tests/e2e/helpers/run-cli-and-log-output.ts` Line: 7 |

---

## Tier 2: AI-Identified Potential Refactors

### Refactor 2.1: Add Bold Red Banner (Deferred from GREEN - Jira AC Item)

**Type**: Add missing feature (deferred from GREEN)
**Description**: Add the `printBanner()` function that prints a bold red 4-line banner to stdout using `process.stdout.write()` — showing the log file path and `tail -f` command. This is Jira acceptance criterion #2: "Each test prints a bold red 4-line banner (separator, log path, tail -f command, separator) using `process.stdout.write()`". The GREEN phase deliberately omitted it because the unit test doesn't assert on stdout output. The banner would be called inside `runCliAndLogOutput()` before writing to the log file.
**AI Recommendation**: RECOMMEND — This is an explicit acceptance criterion of the Jira, not speculative future functionality. The code for it is already specified in the Jira description. The unit test won't break because it doesn't assert on stdout. However, this is technically adding new behaviour to a function that already passes its test, so it's your call whether this belongs in REFACTOR or is "remaining Jira work" done after all TDD cycles complete.
**Risk**: Low — adds stdout output that no test asserts on. Could be considered "adding behaviour" rather than "refactoring" since it changes what the function does. But it's a requirement, not gold-plating.
**Files affected**: `tests/e2e/helpers/run-cli-and-log-output.ts`

**Your Decision**:
- [X] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None". Everything added here will be discussed with the AI before a decision is made.

> **MANDATORY**: You MUST either add refactors here OR write "None" before the execute phase can proceed.

I want P.2 and P.3 and P.4 done please and a plan put in here for doing them. I don't want this done in a separate jira or have tests for these as they are test helper code and not production code.  I don't need tests for all my tests. That's overkill.

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 4 |
| Tier 2 AI-Identified (Pending review) | 1 |
| **Total identified by AI** | 5 |

---

## Agreed Refactors Discussion Notes

### Refactor 2.1: Add Bold Red Banner
**Decision**: EXECUTE
**Summary**: Human approved directly. No discussion needed. Add `printBanner()` helper and call it from `runCliAndLogOutput()` before writing to the log file. Uses `process.stdout.write()` per Jira AC.

### Refactor H.1 (was P.2): Add Error Wrapping to Shared Helper
**Decision**: EXECUTE
**Summary**: AI originally recommended Skip because adding error wrapping without a unit test violates TDD. Human overruled: this is test helper code, not production code — "I don't need tests for all my tests. That's overkill." Agreed. The error wrapping will: catch `execSync` errors, include the log file **path** (NOT contents — that was the bug in the existing inline version) in the error message, and preserve the original error via `{ cause: error }`.

### Refactor H.2 (was P.3): Update All 3 E2E Tests to Use Shared Helper
**Decision**: EXECUTE
**Summary**: AI originally recommended Skip as "remaining Jira work, not refactoring." Human overruled: wants it done in this refactor phase, no separate Jira. Agreed. The 3 files to update:

**1. `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts`**
- Replace `execSync(command, { cwd: process.cwd(), encoding: 'utf-8' })` (lines 44-47) with `runCliAndLogOutput(command, 'string-reversal', TEST_TIMEOUT_MS)`
- Add import: `import { runCliAndLogOutput } from '../helpers/run-cli-and-log-output.js';`
- Remove unused `import { execSync } from 'node:child_process';` (line 13)
- Remove unused `import * as fs from 'node:fs';` and `import * as path from 'node:path';` if no longer needed
- Note: The `beforeEach` that deletes `node_modules` still uses `fs.rmSync`, so `fs` import stays. But `path` is used for `TS_WORKFLOW_NODE_MODULES`, so both stay.
- Actually: `execSync` import can be removed since it's only used on line 44. `fs` and `path` stay for the `beforeEach`.

**2. `tests/e2e/demo/demo-math-workflow-gives-expected-output-number.e2e.test.ts`**
- Replace `execSync(command, { cwd: process.cwd(), encoding: 'utf-8' })` (lines 29-32) with `runCliAndLogOutput(command, 'math-workflow', TEST_TIMEOUT_MS)`
- Add import: `import { runCliAndLogOutput } from '../helpers/run-cli-and-log-output.js';`
- Remove unused `import { execSync } from 'node:child_process';` (line 10)

**3. `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts`**
- Delete the entire inline `runCliAndLogOutput` function (lines 62-82)
- Add import: `import { runCliAndLogOutput } from '../helpers/run-cli-and-log-output.js';`
- Update call on line 120: `runCliAndLogOutput(command, testJiraId)` → `runCliAndLogOutput(command, 'quick-jira-workflow-' + testJiraId, TEST_TIMEOUT_MS)`
  - The label changes from bare `testJiraId` to `'quick-jira-workflow-' + testJiraId` to match the existing log file naming pattern (`/tmp/quick-jira-workflow-TEST-123.log` → `/tmp/e2e-quick-jira-workflow-TEST-123.log`)
  - The timeout was previously hardcoded inside the inline function as `TEST_TIMEOUT_MS`; now passed explicitly
  - The inline function's `errorContext` parameter is dropped — the shared helper's error wrapping (from H.1) includes the log file path which is sufficient context
- Update call on line 157: `runCliAndLogOutput(command, testJiraId, 'without --project-root')` → `runCliAndLogOutput(command, 'quick-jira-workflow-' + testJiraId, TEST_TIMEOUT_MS)`
  - Same changes. The `'without --project-root'` errorContext string is dropped.
- Remove the now-unused `LOG_FILE_DIRECTORY` constant (line 43) — it's defined in the shared helper
- The `import { execSync } from 'node:child_process';` on line 15 stays — it's still used by the disabled manual test on line 171 (`execSync(\`npx tsx ...\`)`)

### Refactor H.3 (was P.4): Fix console.log -> process.stdout.write() in Quick-Jira Test
**Decision**: EXECUTE (absorbed into H.2)
**Summary**: This is not a separate refactor — it's a natural consequence of H.2. When the inline `runCliAndLogOutput` function (which uses `console.log` on lines 64-65) is deleted and replaced with the shared helper (which uses `process.stdout.write()` via the banner from 2.1), the `console.log` bug is fixed automatically. No separate action needed.

---

## Agreed Refactors Summary Table

> For detail on any discussed item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above.

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 1.1 | AI | Extract `'e2e-'` prefix to `LOG_FILE_PREFIX` constant | EXECUTE | Tier 1 auto-approved |
| 1.2 | AI | Extract `'.log'` extension to `LOG_FILE_EXTENSION` constant | EXECUTE | Tier 1 auto-approved |
| 1.3 | AI | Extract `'utf-8'` to `LOG_FILE_ENCODING` constant | EXECUTE | Tier 1 auto-approved |
| 1.4 | AI | Add TSDoc to `runCliAndLogOutput()` | EXECUTE | Tier 1 auto-approved |
| 2.1 | AI | Add bold red `printBanner()` using `process.stdout.write()` | EXECUTE | Approved by human |
| H.1 | Human | Add error wrapping: catch errors, include log file path (not contents), preserve via `{ cause: error }` | EXECUTE | See discussion notes |
| H.2 | Human | Update all 3 e2e tests to import and use shared helper, delete inline function from quick-jira | EXECUTE | See discussion notes for per-file details |
| H.3 | Human | Fix `console.log` -> `process.stdout.write()` in quick-jira test | EXECUTE (absorbed into H.2) | Automatic consequence of H.2 |

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-02-28.

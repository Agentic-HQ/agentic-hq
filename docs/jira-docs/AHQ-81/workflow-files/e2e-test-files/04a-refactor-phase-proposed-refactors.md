# REFACTOR Analysis: AHQ-81 (e2e test)

**Jira**: [AHQ-81](https://agentic-hq.atlassian.net/browse/AHQ-81)
**Test Type**: e2e
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-03-10

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

**Command**: `pnpm test:e2e:cross-workspace-demo-math-workflow`
**Result**: PASSING (1 test, 119.7s)

**Command**: `pnpm test` (unit tests)
**Result**: PASSING (10 tests)

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, red phase, green phase, and implementation documents for deferred items and opportunities.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | AI Summary: "This is a mechanical adaptation of the string-reversal cross-workspace pattern... All patterns, infrastructure, and tooling already exist." | Observed | The GREEN phase explicitly copied the string-reversal pattern verbatim. The e2e test file (`cross-workspace-demo-math-workflow...`) is ~200 lines of which ~150 lines are identical to `cross-workspace-string-reversal.e2e.test.ts` (install script setup, temp workspace creation, git init, Claude settings, PNPM_HOME path handling, timeout error handling with box art). This is a 2-test duplication — Rule of Three says wait for a 3rd, but it's worth surfacing. | This is 2 instances, not 3. Rule of Three says wait. BUT the duplication is substantial (~150 lines of identical setup/teardown/error-handling code). If a 3rd cross-workspace test is likely soon, extracting now would save time. If not, wait. | Tier 2 |
| P.2 | Green Phase Plan: "Step 4b: Regenerate string-reversal ts-workflow lock file to remove stale cmd-ts references left over from before AHQ-77" | Observed | This was a cleanup done during GREEN — the string-reversal `pnpm-lock.yaml` was regenerated to remove stale `cmd-ts` references. Already completed, no further action needed. | Already done. No refactor needed. | Skip |
| P.3 | AI Summary: Q3 answer from human: "From now on we'll just have the cross workspace test (including this one)." | Observed | The human has established a policy: going forward, only cross-workspace tests for new workflows. This means a 3rd cross-workspace test is likely when the next workflow is added, making extraction of shared test infrastructure more justifiable. | This strengthens the case for P.1 (extracting shared cross-workspace test setup) but doesn't change the fact that we're currently at 2 instances. The human should decide whether to extract now (anticipating the 3rd) or wait. | Tier 2 (linked to P.1) |
| P.4 | Green Phase Summary: "Exact pattern replication — Copied string-reversal's SKILL.md, package.json, and tsconfig.json structure verbatim" | Observed | The SKILL.md files for math-workflow and string-reversal are identical except for the description and `base-command` variable. The package.json files are identical except for `name` and script name. Could consider a template/generator, but with only 2 skills this would be over-engineering. | Not worth it with 2 instances. Wait for a 3rd skill. | Skip |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below.

---

## Magic Constants Audit

### File: `math-workflow-demo-cli.ts`

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `math-workflow-demo-cli.ts` | 18 | `'/agentic-hq-demos-plugin:math-workflow:times-two'` | EXTRACTED | `TIMES_TWO_COMMAND` |
| `math-workflow-demo-cli.ts` | 19 | `'/agentic-hq-demos-plugin:math-workflow:plus-three'` | EXTRACTED | `PLUS_THREE_COMMAND` |
| `math-workflow-demo-cli.ts` | 20 | `'/agentic-hq-demos-plugin:math-workflow:div-five'` | EXTRACTED | `DIV_FIVE_COMMAND` |

### File: `cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts`

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `cross-workspace-...e2e.test.ts` | 28 | `240_000` | EXTRACTED | `TEST_TIMEOUT_MS` |
| `cross-workspace-...e2e.test.ts` | 29 | `30_000` | EXTRACTED | `INSTALL_SCRIPT_TIMEOUT_MS` |
| `cross-workspace-...e2e.test.ts` | 30 | `'cross-workspace-math-workflow'` | EXTRACTED | `LOG_FILE_LABEL` |
| `cross-workspace-...e2e.test.ts` | 34 | `11` | EXTRACTED | `TEST_INPUT_NUMBER` |
| `cross-workspace-...e2e.test.ts` | 35 | `5` | EXTRACTED | `EXPECTED_OUTPUT_NUMBER` |
| `cross-workspace-...e2e.test.ts` | 40 | `'/tmp/agentic-hq-test-workspaces'` | EXTRACTED | `TEMP_WORKSPACES_BASE` |
| `cross-workspace-...e2e.test.ts` | 184 | `'io-files-'` | MAGIC | -> `IO_FILES_DIR_PREFIX` |
| `cross-workspace-...e2e.test.ts` | 189-190 | `'command-input.json'`, `'command-output.json'` | MAGIC | -> `COMMAND_INPUT_FILENAME`, `COMMAND_OUTPUT_FILENAME` |

> All literal values are already extracted to named constants **except** the file/directory name strings `'io-files-'`, `'command-input.json'`, and `'command-output.json'` on lines 184, 189-190.

> **However**, the same magic strings also appear in `cross-workspace-string-reversal.e2e.test.ts` at the same relative positions. These are file convention names used by the `agentic-hq` framework. Extracting them in one test file but not the other would create inconsistency. If we extract them, we should do it in both files (or extract to the shared helper).

**Any MAGIC entries above are included in Tier 1 refactors below.**

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.1 | Extract magic constants | Extract `'io-files-'`, `'command-input.json'`, `'command-output.json'` to named constants (`IO_FILES_DIR_PREFIX`, `COMMAND_INPUT_FILENAME`, `COMMAND_OUTPUT_FILENAME`) in BOTH cross-workspace test files for consistency. | `cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` Lines: 184, 189, 190 AND `cross-workspace-string-reversal.e2e.test.ts` Lines: 184, 189, 190 |
| 1.2 | Add missing TSDoc | The `CLAUDE_SETTINGS_PERMISSIONS` constant (line 44) has an inline comment explaining what it does but no TSDoc. Add a `/** ... */` comment for clarity. Same applies to string-reversal test for consistency. | `cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` Line: 44 AND `cross-workspace-string-reversal.e2e.test.ts` Line: 43 |

---

## Tier 2: AI-Identified Potential Refactors

Include ALL potential structural refactors here - both ones you recommend AND ones you're unsure about or even think shouldn't be done. The human decides; your job is to surface them all with honest opinions.

### Refactor 2.1: Extract Shared Cross-Workspace E2E Test Setup to Helper

**Type**: Extract to new file / Create helper function
**Description**: The two cross-workspace e2e tests (`cross-workspace-string-reversal.e2e.test.ts` and `cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts`) share ~150 lines of identical code:
- Install script execution + PNPM_HOME PATH handling (~12 lines)
- Temp workspace creation + git init + Claude settings setup (~14 lines)
- Timeout error handling with box art (~25 lines)
- Prerequisite warning box art (~20 lines)
- Smelly warning banner (~4 lines)
- Assertion of `.agentic-hq/temp/command-input-output-files/` structure (~15 lines)
- Cleanup log message (~4 lines)

A shared helper (e.g., in `tests/e2e/helpers/cross-workspace-test-helper.ts`) could provide:
- `setupCrossWorkspaceTest()` — install script, temp workspace, git init, Claude settings
- `assertCommandIoFilesExist(tempWorkspace)` — shared assertions
- `runCrossWorkspaceCommand(command, label, timeout, tempWorkspace)` — wraps `runCliAndLogOutput` with timeout error handling

Each test would shrink from ~200 lines to ~30-40 lines of workflow-specific logic.

**AI Recommendation**: UNSURE — Rule of Three says wait for a 3rd cross-workspace test. BUT: (a) the human confirmed "from now on we'll just have the cross workspace test" — so a 3rd is coming; (b) the duplication is massive (~150 lines identical); (c) if we extract now, the 3rd test becomes trivial to write. Counter-argument: the tests are readable as-is, and premature abstraction could make debugging harder.

**Risk**: Could be considered gold-plating / premature abstraction. Only 2 instances exist. Extraction adds indirection that may make individual test failures harder to debug.
**Files affected**: `cross-workspace-string-reversal.e2e.test.ts`, `cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts`, new `tests/e2e/helpers/cross-workspace-test-helper.ts`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [X] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): A lot of this is "temp" code (warnings etc) and I need to move fast, so leave this for now please.

---

### Refactor 2.2: Jira Link in Prerequisite Box Art Should Reference the Specific Jira

**Type**: Naming improvement / Fix copy-paste oversight
**Description**: The prerequisite warning box art in `cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` line 85 says `See: https://agentic-hq.atlassian.net/browse/AHQ-81`. The string-reversal test says `See: https://agentic-hq.atlassian.net/browse/AHQ-79`. Both are correct for their respective tests. However, if these are extracted to a shared helper (Refactor 2.1), the Jira link should become a parameter. If NOT extracted, both are already correct. This is only relevant if 2.1 is approved.

**AI Recommendation**: NOT RECOMMENDED as standalone — this is only relevant if Refactor 2.1 is approved. Both tests already reference the correct Jira. No action needed if 2.1 is rejected.
**Risk**: None — but it's not a standalone refactor.
**Files affected**: Only relevant if 2.1 is approved.

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [X] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None". Everything added here will be discussed with the AI before a decision is made.

> **MANDATORY**: You MUST either add refactors here OR write "None" before the execute phase can proceed.

None

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 2 |
| Tier 2 AI-Identified (Pending review) | 2 |
| **Total identified by AI** | 4 |

---

## Agreed Refactors Discussion Notes

No items required discussion. Both Tier 2 refactors were REJECT, human-identified was "None", and no DISCUSS marks were set.

---

## Agreed Refactors Summary Table

> For detail on any discussed item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above.

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 1.1 | AI (Tier 1) | Extract magic constants `'io-files-'`, `'command-input.json'`, `'command-output.json'` to named constants in both cross-workspace test files | EXECUTE | Auto-approved (Tier 1) |
| 1.2 | AI (Tier 1) | Add TSDoc to `CLAUDE_SETTINGS_PERMISSIONS` constant in both cross-workspace test files | EXECUTE | Auto-approved (Tier 1) |
| 2.1 | AI (Tier 2) | Extract shared cross-workspace e2e test setup to helper | SKIP | Rejected by human — "temp code, need to move fast" |
| 2.2 | AI (Tier 2) | Jira link parameterization in box art | SKIP | Rejected by human — dependent on 2.1 |

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-03-10.

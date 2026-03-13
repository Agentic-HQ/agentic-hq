# REFACTOR Analysis: AHQ-82 (e2e test)

**Jira**: [AHQ-82](https://agentic-hq.atlassian.net/browse/AHQ-82)
**Test Type**: e2e
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-03-13

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

**Command**: `pnpm test:e2e:cross-workspace-quick-jira-workflow`
**Result**: PASSING (confirmed by human, 11 min run)

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, red phase, green phase, 03b human additions, and implementation documents for deferred items and opportunities.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | Jira AHQ-82: "REFACTOR: In the 'REFACTOR' stage of this TDD process for this Jira this should be factored out into a common helper class ClaudeSettingsTestHelper" | Deferred | Extract `CLAUDE_SETTINGS_PERMISSIONS` into shared `ClaudeSettingsTestHelper` class | **No longer applicable.** The entire `.claude/settings.local.json` approach was discovered to have NEVER worked (see 03b doc). Permissions now go via `--allowedTools` CLI flag in `ClaudeCodeTool.ts`. The code is commented out and should simply be deleted, not extracted. | Skip — superseded by the `--allowedTools` fix |
| P.2 | 03b doc: "REFACTOR: Plan is that in the REFACTOR stage we will remove all the redundant code and tidy up so anything related to this .claude folder in these tests workspaces is removed." | Deferred | Remove all commented-out `.claude/settings.local.json` setup code and `CLAUDE_SETTINGS_PERMISSIONS` constants from all 3 cross-workspace test files | Absolutely yes. This is ~141 lines of dead commented-out code across 3 files. It serves no purpose now that `--allowedTools` handles permissions. | Tier 1 (see 1.1) |
| P.3 | 03b doc: "We must also review the README.md for outdated instructions about setting permissions in the user workspaces" | Deferred | Update README Quick Start permissions instructions | Yes, but needs human review on exact wording. The README currently tells users to create `.claude/settings.local.json` with `"Write"` permission, which is no longer needed for cross-workspace usage. | Tier 2 (see 2.2) |
| P.4 | 03b doc: "We should replace the instructions with a big WARNING that all workspaces that run using our tools will have the permissions set in ClaudeCodeTool.ts ALLOWED_TOOLS constant and they should check it" | Deferred | Add WARNING to README about auto-approved ALLOWED_TOOLS permissions | Yes, users should know what permissions are auto-approved. This is a security transparency thing. | Tier 2 (see 2.2) |
| P.5 | 03b doc: "Finally we should convert ALLOWED_TOOLS into a nice readable vertical list (still with spaces separating the items)" | Deferred | Format `ALLOWED_TOOLS` constant in `ClaudeCodeTool.ts` as a readable vertical list | Yes, the current single-line string is unreadable. | Tier 1 (see 1.4) |
| P.6 | GREEN phase summary: "REFACTOR phase will clean up the now-redundant `.claude` folder setup code in the test files." | Deferred | Same as P.2 — remove dead .claude setup code | Covered by P.2 / Tier 1 item 1.1. | Tier 1 (see 1.1) |
| P.7 | AI summary: "CLAUDE_SETTINGS_PERMISSIONS refactoring into shared ClaudeSettingsTestHelper during the REFACTOR phase, since 3 tests now have it" | Deferred | Same as P.1 — extract shared helper | No longer applicable per P.1 reasoning. However, there IS other substantial duplication across the 3 tests (setup, warnings, error handling) that would benefit from extraction. | Tier 2 (see 2.1) — repurposed from permissions helper to general cross-workspace test helper |
| P.8 | GREEN phase plan, line 14: "CLAUDE_SETTINGS_PERMISSIONS refactoring into shared helper -> N/A (REFACTOR phase)" | Deferred | Same as P.1/P.7 | Already noted as no longer applicable. | Skip — covered above |
| P.9 | Observed: `cross-workspace-string-reversal.e2e.test.ts` line 26 imports `ClaudeCodeTool` but never uses it | Observed | Remove unused import | Yes, likely left over from when the settings.local.json code was active. Lint should catch this. | Tier 1 (see 1.2) |
| P.10 | Observed: README "Building Your Own Workflow" section references deleted files (`src/demo/cli/math-workflow-demo-cli.ts`) and old command paths (`.claude/commands/agentic-hq-commands/used-in-demos/math-workflow`) | Observed | Update or remove outdated README section | Yes, these files/paths no longer exist after AHQ-81 moved them to the plugin structure. Also `pnpm demo:math-workflow --input-number=11` references a deleted script. | Tier 2 (see 2.2) |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below.

---

## Magic Constants Audit

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts` | 223, 235 | `/tmp/e2e-${LOG_FILE_LABEL}.log` | MAGIC | -> `LOG_FILE_PATH` (matching pattern in other 2 tests) |
| `src/tools/claude-code/ClaudeCodeTool.ts` | 67 | Long single-line string | EXTRACTED | `ALLOWED_TOOLS` (exists but needs formatting — see Tier 1) |
| `.agentic-hq/plugins/.../quick-jira-workflow-demo-cli.ts` | All values | N/A | EXTRACTED | All extracted to named constants |

**1 MAGIC entry above is included in Tier 1 refactors below.**

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.1 | Remove dead code | Remove ALL commented-out `CLAUDE_SETTINGS_PERMISSIONS` code, commented-out `.claude/settings.local.json` creation code, and associated "UPDATE: REFACTOR:" comments from all 3 cross-workspace test files. ~141 lines of dead code total. | `cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts` Lines 59-95, 183-194; `cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` Lines 44-83, 151-164; `cross-workspace-string-reversal.e2e.test.ts` Lines 44-83, 152-163 |
| 1.2 | Remove dead code | Remove unused `import { ClaudeCodeTool }` that was left over from when settings.local.json code was active. | `cross-workspace-string-reversal.e2e.test.ts` Line 26 |
| 1.3 | Extract magic constant | Extract inline log file path `/tmp/e2e-${LOG_FILE_LABEL}.log` to `LOG_FILE_PATH` constant (matching the pattern in the other 2 cross-workspace tests). | `cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts` Lines 223, 235 |
| 1.4 | Improve readability | Format `ALLOWED_TOOLS` as a readable vertical array joined by spaces (per human's explicit request in 03b doc). Convert from one unreadable 300+ char line to a clear vertical list. | `src/tools/claude-code/ClaudeCodeTool.ts` Line 67 |

---

## Tier 2: AI-Identified Potential Refactors

### Refactor 2.1: Extract shared cross-workspace test setup into helper module

**Type**: Extract to new file
**Description**: All 3 cross-workspace tests duplicate substantial setup code (~100+ lines each): install script execution, PNPM_HOME PATH detection, temp workspace creation, git init, prerequisite warning box (~30 lines), smelly warning, timeout error handler (~25 lines), cleanup message, and shared constants (TEMP_WORKSPACES_BASE, REPO_ROOT, INSTALL_SCRIPT, INSTALL_SCRIPT_TIMEOUT_MS). Create `tests/e2e/helpers/cross-workspace-test-setup.ts` with shared setup function and constants.
**AI Recommendation**: RECOMMEND — Rule of Three applies (3 tests). The duplication is substantial and stable. More cross-workspace tests are likely. This is the spiritual successor to the Jira's `ClaudeSettingsTestHelper` request, but focused on the real duplication (setup code) rather than the now-dead permissions code.
**Risk**: Moderate — touching 3 test files + creating new module. But the extraction is mechanical (move identical code) so low logic risk.
**Files affected**: `cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts`, `cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts`, `cross-workspace-string-reversal.e2e.test.ts`, new `tests/e2e/helpers/cross-workspace-test-setup.ts`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [X] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): Please add a comment to all three files saying that Human doesn't want to refactor these common things out because these are tests for Demo plugins and if we move test functionality into our core they will become harder to understand for other developers. Also they differ slightly and future tests will probably differ as well (hope to not make too many more demos in this core package as well)

---

### Refactor 2.2: Update README.md for outdated instructions and add ALLOWED_TOOLS warning

**Type**: Documentation update
**Description**: Multiple README sections are outdated after AHQ-81 and AHQ-82 changes:
1. **Quick Start** tells users to create `.claude/settings.local.json` with `"Write"` permission — no longer needed since `--allowedTools` handles this automatically
2. **Quick Start** references `pnpm demo:math-workflow --input-number=11` — this script was deleted in AHQ-81
3. **"Building Your Own Workflow"** section references `src/demo/cli/math-workflow-demo-cli.ts` and `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow` — both deleted/moved in AHQ-81
4. Per 03b doc: add WARNING that all workspaces running via `agentic-hq` will have the tools listed in `ClaudeCodeTool.ts` `ALLOWED_TOOLS` constant auto-approved, and list the current permissions as of 13th March 2026
5. **"Other workspaces"** note says users need `"Write"` permission in their workspaces — no longer needed

**AI Recommendation**: RECOMMEND — the README is the first thing users see, and it currently tells them to do things that are no longer needed and references files that don't exist. The 03b doc explicitly requests the ALLOWED_TOOLS warning.
**Risk**: Low — documentation only, no code behavior changes. But needs careful wording review.
**Files affected**: `README.md`

**Your Decision**:
- [X] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.3: Update demo:plugin-direct pnpm scripts for string-reversal and math-workflow to use subshell pattern

**Type**: Consistency fix
**Description**: The `demo:plugin-direct:string-reversal` and `demo:plugin-direct:math-workflow` pnpm scripts still use the old `cd && install && run` pattern, while `demo:plugin-direct:quick-jira-workflow` uses the new subshell pattern. The SKILL.md files for all 3 have already been updated to the subshell pattern.
**AI Recommendation**: NOT RECOMMENDED — These scripts are dev-only convenience commands that run from the repo root, so the CWD issue that motivated the subshell pattern doesn't apply here. The old pattern works correctly for this use case. Also, string-reversal and math-workflow use `pnpm demo:...` (a script defined in their ts-workflow's package.json), while quick-jira-workflow invokes tsx directly — so they're structurally different for good reason.
**Risk**: Low functionally, but changes working scripts for no real benefit.
**Files affected**: `package.json` lines 30-31

**Your Decision**:
- [X] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): Want them all consistent and the pnpm commands to use the "correct" direct call that the SKILL tells agentic-hq to run.

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None". Everything added here will be discussed with the AI before a decision is made.

> **MANDATORY**: You MUST either add refactors here OR write "None" before the execute phase can proceed.

None

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 4 |
| Tier 2 AI-Identified (Pending review) | 3 |
| **Total identified by AI** | 7 |

---

## Agreed Refactors Discussion Notes

> No items were marked DISCUSS and no human-identified items were added. All decisions were straight APPROVE or REJECT.

### Refactor 2.1: Extract shared cross-workspace test setup into helper module
**Decision**: SKIP
**Summary**: Human rejected this. Reasoning: these are tests for Demo plugins and extracting shared test setup into core helpers would make them harder to understand for other developers. The tests differ slightly and future tests will probably differ further. Also hope to not add many more demos in the core package. Instead, add a comment to all 3 test files explaining the intentional duplication.

### Refactor 2.2: Update README.md for outdated instructions and add ALLOWED_TOOLS warning
**Decision**: EXECUTE
**Summary**: Approved by human without comment.

### Refactor 2.3: Update demo:plugin-direct pnpm scripts to use subshell pattern
**Decision**: EXECUTE
**Summary**: Approved by human. Human wants all 3 demo:plugin-direct scripts to be consistent and match the "correct" direct call that the SKILL.md tells agentic-hq to run.

---

## Agreed Refactors Summary Table

> For detail on any discussed item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above.

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 1.1 | AI Tier 1 | Remove ALL commented-out `CLAUDE_SETTINGS_PERMISSIONS` code, commented-out `.claude/settings.local.json` creation code, and associated "UPDATE: REFACTOR:" comments from all 3 cross-workspace test files (~141 lines total) | EXECUTE | Auto-approved |
| 1.2 | AI Tier 1 | Remove unused `import { ClaudeCodeTool }` from `cross-workspace-string-reversal.e2e.test.ts` | EXECUTE | Auto-approved |
| 1.3 | AI Tier 1 | Extract inline log file path to `LOG_FILE_PATH` constant in quick-jira-workflow test | EXECUTE | Auto-approved |
| 1.4 | AI Tier 1 | Format `ALLOWED_TOOLS` in `ClaudeCodeTool.ts` as readable vertical list (per human request in 03b) | EXECUTE | Auto-approved |
| 1.5 | Human (from 2.1 rejection) | Add comment to all 3 cross-workspace test files explaining that the duplicated setup code is intentionally NOT extracted to a shared helper — these are demo plugin tests and should remain self-contained for readability by other developers | EXECUTE | New item from 2.1 rejection |
| 2.1 | AI Tier 2 | Extract shared cross-workspace test setup into helper module | SKIP | Rejected by human — demo tests should stay self-contained |
| 2.2 | AI Tier 2 | Update README.md for outdated instructions and add ALLOWED_TOOLS warning | EXECUTE | Approved by human |
| 2.3 | AI Tier 2 | Update `demo:plugin-direct:string-reversal` and `demo:plugin-direct:math-workflow` pnpm scripts to use subshell pattern matching SKILL.md | EXECUTE | Approved by human — wants consistency |

**Total EXECUTE items: 7** (1.1, 1.2, 1.3, 1.4, 1.5, 2.2, 2.3)
**Total SKIP items: 1** (2.1)

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-03-13.

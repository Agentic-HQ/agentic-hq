# REFACTOR Analysis: AHQ-36 (e2e test)

**Jira**: [AHQ-36](https://agentic-hq.atlassian.net/browse/AHQ-36)
**Test Type**: e2e
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-02-12

---

## Guidance for Human Reviewer

### The "Has It Earned It?" Question

Before approving Tier 2 refactors, ask yourself:
- **Is this code stable?** Will it change significantly in the next few stories?
- **Is this pattern repeated?** Rule of Three - only abstract when pattern appears 3+ times
- **Is this code important?** Is it core functionality or a one-off utility?
- **Will this abstraction be used?** Or is it speculative "just in case" design?

### Research on Limiting Refactoring (from Perplexity)

**Key principle**: Refactor in small, safe steps. If more than a few minutes since tests passed, revert and try smaller steps.

**Always-safe refactors** (low risk of over-engineering):
- Removing duplication within a single function or small module
- Improving variable/function names for clarity
- Simplifying conditionals or extracting constants

**Requires caution** (prone to gold-plating):
- Creating new abstractions or interfaces
- Extracting methods into separate classes
- Introducing design patterns
- Building "stepping stones" toward future features

**The anti-pattern to avoid**: "Beware of gold plating" - building intermediate functionality to make future work easier when that future work may never come.

**Rule of Three**: Only create an abstraction when the same pattern appears 3+ times in the codebase, not speculatively.

---

## Pre-Refactor Test Status

**Command**: `pnpm test:e2e:demo-quick-jira-workflow:expected-files-test`
**Result**: ✅ PASSING (564s) — confirmed in GREEN phase. Full re-run skipped here due to ~10 min runtime; will re-run after refactor execution to confirm nothing broke.

---

## Magic Constants Audit

### `src/demo/cli/quick-jira-workflow-demo-cli.ts`

| File | Line | Value | Status | Constant Name |
|------|------|-------|--------|---------------|
| CLI | 28-29 | `'/agentic-hq-commands:...:01-read-jira...'` | ✅ EXTRACTED | `COMMAND_01_READ_JIRA` |
| CLI | 30-31 | `'/agentic-hq-commands:...:02-RED...'` | ✅ EXTRACTED | `COMMAND_02_RED` |
| CLI | 32-33 | `'/agentic-hq-commands:...:03-GREEN...'` | ✅ EXTRACTED | `COMMAND_03_GREEN` |
| CLI | 34-35 | `'/agentic-hq-commands:...:04-REFACTOR'` | ✅ EXTRACTED | `COMMAND_04_REFACTOR` |
| CLI | 36-37 | `'/agentic-hq-commands:...:05-transition...'` | ✅ EXTRACTED | `COMMAND_05_TRANSITION_DONE` |
| CLI | 39 | `'git rev-parse --show-toplevel'` | ✅ EXTRACTED | `GIT_ROOT_DETECTION_COMMAND` |

**ZERO magic constants in CLI.** All values already extracted.

### `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts`

| File | Line | Value | Status | Constant Name |
|------|------|-------|--------|---------------|
| Test | 24 | `1_200_000` | ✅ EXTRACTED | `TEST_TIMEOUT_MS` |
| Test | 26-29 | Command paths | ✅ EXTRACTED | `CREATE_TEST_JIRA_COMMAND`, `GET_JIRA_STATUS_COMMAND` |
| Test | 33-39 | Test Jira description | ✅ EXTRACTED | `MULTI_STEP_TEST_JIRA_INPUT` |
| Test | 41 | `/^TEST-\d+$/` | ✅ EXTRACTED | `JIRA_KEY_PATTERN` |
| Test | 42 | `'Done'` | ✅ EXTRACTED | `EXPECTED_JIRA_STATUS` |
| Test | 44-49 | Path segments | ✅ EXTRACTED | `TEST_PROJECT_ROOT_BASE` |
| Test | 75 | `'/tmp'` | ⚠️ MAGIC | Log file temp directory (duplicated at line 152) |
| Test | 108 | `['unit', 'e2e']` | ⚠️ MAGIC | Expected test types (duplicated at line 187) |
| Test | 152 | `'/tmp'` | ⚠️ MAGIC | Same as line 75 |
| Test | 187 | `['unit', 'e2e']` | ⚠️ MAGIC | Same as line 108 |

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------|
| 1.1 | Remove dead comments | Remove 6 leftover `// REFACTOR` comments from GREEN phase. These are TODO-style comments that served their purpose as GREEN-phase notes but should not remain in committed code. The refactors they suggest (extracting every `tool.execute` into its own function) would actually over-engineer a 109-line sequential CLI script — the linear flow is already clear. | `quick-jira-workflow-demo-cli.ts` Lines: 47, 64, 67, 68, 83, 100 |
| 1.2 | Naming improvement | Rename local variable `vars` → `variablesString` in `buildVariablesString()` function for clarity (the REFACTOR comment on line 47 correctly identified this). | `quick-jira-workflow-demo-cli.ts` Lines: 43, 48 |
| 1.3 | Extract magic constant | Extract `'/tmp'` (used twice) to `const LOG_FILE_DIRECTORY = '/tmp'` at top of test file. | `...expected-files.e2e.test.ts` Lines: 75, 152 |
| 1.4 | Extract magic constant + remove duplication | Extract `['unit', 'e2e']` (used twice) to `const EXPECTED_TEST_TYPES = ['unit', 'e2e']` at top of test file. | `...expected-files.e2e.test.ts` Lines: 108, 187 |

---

## Tier 2: Proposed Refactors (Require Approval)

### Refactor 2.1: Extract "execute CLI and log to file" test helper

**Type**: Extract helper function (within same file)
**Description**: Lines 74-92 (main test) and 151-170 (disabled test) contain nearly identical ~18-line blocks that: create a log file path, open a file descriptor, run `execSync` with the CLI command, catch errors with log output, and close the fd. This could be extracted to a helper function like `runCliAndLogOutput(command: string, testJiraId: string): void`.
**Justification**: Two occurrences of ~18 identical lines is meaningful duplication within the same file.
**Risk**: Low — it's within the same file and is a straightforward extraction. However, the disabled test (AHQ-40) may diverge in future, at which point the helper may need parameters that make it less clean.
**Files affected**: `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts`

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, code hasn't earned this yet
- [ ] **DEFER** - Maybe later, not now

**Comments** (optional): _______________

---

### Refactor 2.2: Extract workflow file assertion helper

**Type**: Extract helper function (within same file)
**Description**: Lines 94-118 (main test) and 172-197 (disabled test) contain nearly identical assertion blocks that check for `01-entire-jira-copy-of-details.md`, `01-summary-of-jira.md`, and per-test-type summary files. This could be extracted to a helper like `assertWorkflowOutputFilesExist(projectRoot: string, testJiraId: string): void`.
**Justification**: Two occurrences of ~25 identical assertion lines within the same file.
**Risk**: Low — same file, straightforward extraction. Same caveat as 2.1 about potential future divergence of the disabled test.
**Files affected**: `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts`

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, code hasn't earned this yet
- [ ] **DEFER** - Maybe later, not now

**Comments** (optional): _______________

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 4 |
| Tier 2 (Pending approval) | 2 |
| **Total proposed** | 6 |

---

## Next Steps

1. Review the Tier 2 refactors above
2. Mark each as APPROVE / REJECT / DEFER
3. Add any comments explaining your decision
4. Run the execute command:
```
/agentic-hq-commands:workflow:jira-story-workflow:04b-jira-refactor-execute AHQ-36 e2e
```

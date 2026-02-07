# REFACTOR Analysis: AHQ-38 (integration test)

**Jira**: [AHQ-38](https://agentic-hq.atlassian.net/browse/AHQ-38)
**Test Type**: integration
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-02-07

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

**Command**: `pnpm test:integration`
**Result**: ✅ PASSING (4 tests, 4 passed)

---

## Magic Constants Audit

The GREEN phase created two types of files: markdown command instructions and a TypeScript test file. Markdown files are natural language instructions for an AI agent - magic constant extraction doesn't apply to prose.

### Test File: `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts`

| File | Line | Value | Status | Notes |
|------|------|-------|--------|-------|
| test file | 21 | `120_000` | ✅ EXTRACTED | `TEST_TIMEOUT_MS` |
| test file | 23-24 | `'/agentic-hq-commands:used-in-tests:jira-helper-commands:create-test-jira'` | ✅ EXTRACTED | `CREATE_TEST_JIRA_COMMAND` |
| test file | 25-26 | `'/agentic-hq-commands:used-in-tests:jira-helper-commands:get-jira-status'` | ✅ EXTRACTED | `GET_JIRA_STATUS_COMMAND` |
| test file | 35 | `'Title: Integration Test Jira  Description: Auto-created by ...'` | ⚠️ INLINE | Test input data - see Tier 1.1 |
| test file | 41 | `/^TEST-\d+$/` | ⚠️ INLINE | Regex pattern - see Tier 1.2 |
| test file | 47 | `'Backlog'` | ⚠️ INLINE | Expected status - see Tier 1.3 |

### Command Files: `create-test-jira.md` and `get-jira-status.md`

These are markdown prose instructions. Values like "TEST" (project key), "Task" (issue type), and "Backlog" appear in natural language context and don't benefit from extraction.

---

## Tier 1: Auto-Approved Refactors

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------|
| 1.1 | Extract magic constant | Extract test input string `'Title: Integration Test Jira  Description: Auto-created by integration test - can be deleted.'` to a named constant `CREATE_JIRA_INPUT` at top of file | `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts` Line: `35` |
| 1.2 | Extract magic constant | Extract regex `/^TEST-\d+$/` to a named constant `JIRA_KEY_PATTERN` at top of file | `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts` Line: `41` |
| 1.3 | Extract magic constant | Extract `'Backlog'` to a named constant `EXPECTED_NEW_JIRA_STATUS` at top of file | `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts` Line: `47` |

---

## Tier 2: Proposed Refactors (Require Approval)

> No Tier 2 refactors identified. The code is minimal, follows established patterns, and doesn't warrant structural changes at this stage.
>
> Rationale:
> - The markdown commands closely follow the `div-five.md` and `reverse-a-string.md` patterns - no unnecessary divergence
> - The test file is a single, short integration test with clear structure
> - No duplication across files (each command does something different)
> - No abstractions warranted - this is the 2nd usage of the custom command pattern, not yet at the Rule of Three threshold

---

## Human Proposed Refactor - Replace $0 With {command-input-output-files-directory} In Custom Commands

All of the custom commands like:

.claude/commands/agentic-hq-commands/used-in-tests/jira-helper-commands/create-test-jira.md

that have:

"The temp directory containing command I/O files is: $0"

then go on to use it like this:

"1. Read the file `command-input.json` from $0"

This is fine for the AI to read as $0 gets replaced with the arguments string.  But it's hard to read for the human checking it.

I'd like the 2 commands written today **and** all the other ones written previously that have:

"The temp directory containing command I/O files is: $0"

to be refactored to use the proposed command-input-output-files-directory variables name from https://agentic-hq.atlassian.net/browse/AHQ-9 and so say:

"Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)"

and then replace:
$0
in the rest of the command with:
{command-input-output-files-directory}

The AI should be able to interpret this fine.  We will be running the integration test at the end of refactoring to confirm this.


## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 3 |
| Tier 2 (Pending approval) | 0 |
| **Total proposed** | 3 |

---

## Next Steps

1. Review the Tier 1 refactors above (auto-approved, will execute automatically)
2. Run the execute command:
```
/agentic-hq-commands:workflow:jira-story-workflow:04b-jira-refactor-execute AHQ-38 integration
```

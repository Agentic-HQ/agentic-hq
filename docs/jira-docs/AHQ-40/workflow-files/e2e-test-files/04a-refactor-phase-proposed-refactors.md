# REFACTOR Analysis: AHQ-40 (e2e test)

**Jira**: [AHQ-40](https://agentic-hq.atlassian.net/browse/AHQ-40)
**Test Type**: e2e
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-02-09

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

**Command**: `pnpm test:e2e:demo-quick-jira-workflow:manual-disabled:default-project-root-test`
**Result**: PASSING (1 passed, 1 skipped - 126s)

---

## Magic Constants Audit

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `quick-jira-workflow-demo-cli.ts` | 18-19 | `'/agentic-hq-commands:used-in-demos:quick-jira-workflow:01-read-jira-implement-and-mark-as-done'` | EXTRACTED | `WORKFLOW_COMMAND` |
| `quick-jira-workflow-demo-cli.ts` | 35 | `'Your variables for use in this command are jiraId = ... and projectRoot = ...'` | MAGIC | See Tier 1 #1.1 |
| `quick-jira-workflow-demo-cli.ts` | 31 | `'git rev-parse --show-toplevel'` | MAGIC | See Tier 1 #1.2 |
| `quick-jira-workflow-demo-cli.ts` | 31 | `'utf-8'` | OK | Standard encoding param, no extraction needed |
| `...e2e.test.ts` | 23 | `1_200_000` | EXTRACTED | `TEST_TIMEOUT_MS` |
| `...e2e.test.ts` | 25-26 | Command strings | EXTRACTED | `CREATE_TEST_JIRA_COMMAND`, `GET_JIRA_STATUS_COMMAND` |
| `...e2e.test.ts` | 30-32 | Test Jira input string | EXTRACTED | `TEST_JIRA_INPUT` |
| `...e2e.test.ts` | 34 | `/^TEST-\d+$/` | EXTRACTED | `JIRA_KEY_PATTERN` |
| `...e2e.test.ts` | 35 | `'Done'` | EXTRACTED | `EXPECTED_JIRA_STATUS` |
| `...e2e.test.ts` | 37-42 | Path segments | EXTRACTED | `TEST_PROJECT_ROOT_BASE` |

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------|
| 1.1 | Extract magic constant | Extract the variables string template `'Your variables for use in this command are jiraId = ... and projectRoot = ...'` to a named function or template constant. The string format is a magic structure that couples the CLI to the command file's parsing expectations. | `src/demo/cli/quick-jira-workflow-demo-cli.ts` Line: 35 |
| 1.2 | Extract magic constant | Extract `'git rev-parse --show-toplevel'` to a named constant like `GIT_ROOT_DETECTION_COMMAND` | `src/demo/cli/quick-jira-workflow-demo-cli.ts` Line: 31 |
| 1.3 | Remove dead code | Delete `tests/shared/fixtures.ts` - this file was created in the RED phase for the temp git dir approach, but the GREEN phase switched to the real workspace approach. It is NOT imported by any test file (confirmed via grep). | `tests/shared/fixtures.ts` (entire file) |
| 1.4 | Improve inline comment | Add a clear comment above the `projectRoot` resolution line explaining the fallback behaviour: when `--project-root` is omitted, detect the git repo root so the CLI works from anywhere inside a repo. Current code has no comment. | `src/demo/cli/quick-jira-workflow-demo-cli.ts` Line: 29-31 |
| 1.5 | Improve file-level JSDoc | Update the top-of-file JSDoc to include usage examples showing both invocation styles (`--project-root` explicit vs omitted/git-root default) and mention AHQ-40 alongside AHQ-37. Current JSDoc only references AHQ-37 and doesn't mention the optional `--project-root` behaviour. | `src/demo/cli/quick-jira-workflow-demo-cli.ts` Line: 1-10 |

---

## Tier 2: Proposed Refactors (Require Approval)

These require your approval before execution:

### Refactor 2.1: Kebab-case refactoring of CLI variables string and command file

**Type**: Cross-file refactoring (CLI + command file)
**Description**: The Jira explicitly requires refactoring the CLI (`src/demo/cli/quick-jira-workflow-demo-cli.ts`) and command file (`.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/01-read-jira-implement-and-mark-as-done.md`) to use kebab-case for custom command variables. Currently:
- CLI emits: `jiraId = TEST-123 and projectRoot = /some/path`
- Command file parses: `jiraId`, `projectRoot`, `commandInputOutputFilesDirectory`, `jiraWorkflowFilesDirectory`, `summaryDocFilename`

After refactoring:
- CLI emits: `jira-id = TEST-123 and project-root = /some/path`
- Command file parses: `jira-id`, `project-root`, `command-input-output-files-directory`, `jira-workflow-files-directory`, `summary-doc-filename`

TypeScript internal variables remain camelCase.

**Justification**: Explicitly listed in the Jira as "Additional Refactoring Task" and part of a project-wide convention decision. Not speculative - it's a requirement.
**Risk**: Cross-file change (CLI + command file). The existing e2e test with `--project-root` (the AHQ-37 test) would also need to pass after this change since it exercises the same command file. However, `commandInputOutputFilesDirectory` is set by `$0` (the CLI tool framework), not by the variables string, so that variable name in the command file is parsed differently and may need special consideration.
**Files affected**: `src/demo/cli/quick-jira-workflow-demo-cli.ts`, `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/01-read-jira-implement-and-mark-as-done.md`

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, code hasn't earned this yet
- [ ] **DEFER** - Maybe later, not now

**Comments** (optional): _______________

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 5 |
| Tier 2 (Pending approval) | 1 |
| **Total proposed** | 6 |

---

## Next Steps

1. Review the Tier 2 refactors above
2. Mark each as APPROVE / REJECT / DEFER
3. Add any comments explaining your decision
4. Run the execute command:
```
/agentic-hq-commands:workflow:jira-story-workflow:04b-jira-refactor-execute AHQ-40 e2e
```

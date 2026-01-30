# REFACTOR Analysis: AHQ-9 (unit test)

**Jira**: [AHQ-9](https://agentic-hq.atlassian.net/browse/AHQ-9)
**Test Type**: unit
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-01-29

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

**Command**: `pnpm test`
**Result**: ✅ PASSING (2 tests)

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) |
|---|------|-------------|---------|
| 1.1 | Extract constant | Extract magic string `'command-input-output-files'` to a named constant | `ClaudeCodeTool.ts` |
| 1.2 | Extract constant | Extract magic strings `'command-input.json'` and `'command-output.json'` to named constants | `ClaudeCodeTool.ts` |
| 1.3 | Extract constant | Extract magic strings `'command-input-string'` and `'command-output-string'` to named constants | `ClaudeCodeTool.ts` |

---

## Tier 2: Proposed Refactors (Require Approval)

These require your approval before execution:

### Refactor 2.1: Delete ExecuteHandle interface and executeWithPty method (Jira specifies this)

**Type**: Remove redundant code
**Description**: The Jira explicitly states in "Additional Task To Remove Redundant And Complex Code During Refactor Stage" that `ExecuteHandle` interface and the PTY-based execution should be deleted because AHQ-24 is now redundant. This would remove:
- `ExecuteHandle` interface (lines 27-32)
- `executeWithPty()` method (lines 112-149)
- The method overload complexity (simplify to just one `execute()` method)
- `node-pty` import and dependency

**Justification**: Jira AHQ-9 explicitly requires this cleanup. The old approach (stdout parsing) was "painful and fragile" and is superseded by file I/O.

**Risk**: This is a BREAKING CHANGE if anything else uses the old `execute(prompt): ExecuteHandle` signature. Need to verify no other code depends on it.

**Files affected**: `src/tools/claude-code/ClaudeCodeTool.ts`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, not ready yet (maybe wait until integration test also passes?)
- [X] **DEFER** - Do this after all test types (unit, integration, smoke, e2e) are complete

**Comments** (optional): _______________

---

### Refactor 2.2: Delete redundant integration test from AHQ-24

**Type**: Remove redundant test
**Description**: The Jira explicitly states to delete `claude-executes-math-command.integration.test.ts` because "our new test supersedes it". This test was created for AHQ-24/AHQ-8 and uses the old `execute(prompt)` pattern with `handle.kill()`.

**Justification**: Jira AHQ-9 explicitly requires this cleanup.

**Risk**: Need to verify this test is truly redundant and not testing something unique. Also, should wait until the new integration test is written and passing.

**Files affected**: `tests/integration/claude-code-tool/claude-executes-math-command.integration.test.ts`

**Your Decision**:
- [ ] **APPROVE** - Yes, delete now
- [ ] **REJECT** - No, keep it
- [X] **DEFER** - Wait until integration test phase is complete for AHQ-9

**Comments** (optional): _______________

---

### Refactor 2.3: Move ClaudeCodeToolOptions interface to a types file

**Type**: Extract to new file
**Description**: Move `ClaudeCodeToolOptions` interface to a separate types file for better organization.

**Justification**: Separates type definitions from implementation.

**Risk**: Over-modularization for a single small interface. May be YAGNI.

**Files affected**: `src/tools/claude-code/ClaudeCodeTool.ts`, new `src/tools/claude-code/types.ts`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [X] **REJECT** - No, code hasn't earned this yet
- [ ] **DEFER** - Maybe later, not now (RECOMMENDED - interface is small and co-located is fine)

**Comments** (optional): _______________

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 3 |
| Tier 2 (Pending approval) | 3 |
| **Total proposed** | 8 |

---

## Important Note About Tier 2 Refactors

**Refactors 2.1 and 2.2 are explicitly required by the Jira**, but I've listed them as Tier 2 because:

1. **2.1 (Delete ExecuteHandle/executeWithPty)**: This is a breaking change. You may want to DEFER this until AFTER the integration test is written and passing, so we can verify the new file I/O approach works with real Claude before removing the old approach.

2. **2.2 (Delete old integration test)**: Should probably wait until the NEW integration test (`claude-executes-command-using-file-io.integration.test.ts`) is written and passing, otherwise we'd be deleting a test with no replacement.

**My Recommendation**:
- For the UNIT test refactor phase: Execute Tier 1 only
- DEFER 2.1 and 2.2 until INTEGRATION test phase is complete

---

## Next Steps

1. Review the Tier 2 refactors above
2. Mark each as APPROVE / REJECT / DEFER
3. Add any comments explaining your decision
4. Run the execute command:
```
/agentic-hq-commands:workflow:jira-story-workflow:04b-jira-refactor-execute AHQ-9 unit
```

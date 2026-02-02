# REFACTOR Analysis: AHQ-10 (e2e test)

**Jira**: [AHQ-10](https://agentic-hq.atlassian.net/browse/AHQ-10)
**Test Type**: e2e
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-02-02

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

**Command**: `pnpm test:e2e`
**Result**: ✅ PASSING (2 tests, 75.41s)

---

## Magic Constants Audit

### File: `src/demo/cli/math-workflow-demo-cli.ts`

| Line | Value | Status | Constant Name |
|------|-------|--------|---------------|
| 15 | `/agentic-hq-commands:used-in-demos:math-workflow:times-two` | ✅ EXTRACTED | `TIMES_TWO_COMMAND` |
| 16 | `/agentic-hq-commands:used-in-demos:math-workflow:plus-three` | ✅ EXTRACTED | `PLUS_THREE_COMMAND` |
| 17 | `/agentic-hq-commands:used-in-demos:math-workflow:div-five` | ✅ EXTRACTED | `DIV_FIVE_COMMAND` |
| 22 | `'math-workflow-demo-cli'` | ✅ OK | Commander pattern - CLI name matches filename |
| 23 | `'Run a 3-step math workflow...'` | ✅ OK | Commander pattern - help text |
| 24 | `'--input-number <number>'` | ✅ OK | Commander pattern - argument spec |
| 37 | `'Output number: ${...}'` | ✅ OK | Output format - matches test expectation |

### File: `tests/e2e/demo/demo-math-workflow-gives-expected-output-number.e2e.test.ts`

| Line | Value | Status | Constant Name |
|------|-------|--------|---------------|
| 14 | `90_000` | ✅ EXTRACTED | `TEST_TIMEOUT_MS` (with explanatory comment) |
| 16 | `11` | ✅ EXTRACTED | `TEST_INPUT_NUMBER` |
| 17 | `5` | ✅ EXTRACTED | `EXPECTED_OUTPUT_NUMBER` |

**Summary**: All critical magic constants have been extracted. Remaining inline strings are Commander conventions and simple format strings that don't need extraction.

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

> **No Tier 1 refactors identified.** Code is already clean at this level.

The GREEN phase implementation is minimal and well-structured:
- ✅ Command strings extracted to constants
- ✅ Test values extracted to named constants
- ✅ No duplication within files
- ✅ Clear variable names
- ✅ No dead code
- ✅ No obvious code smells
- ✅ Follows existing patterns (`string-reversal-demo-cli.ts`)

---

## Tier 2: Proposed Refactors (Require Approval)

### Refactor 2.1: Extract Output Format Prefix

**Type**: Extract constant
**Description**: The string `'Output number: '` appears in both the CLI (line 37) and the test (line 25). Could extract to a shared constant.
**Justification**: DRY principle - same string in two places
**Risk**: Premature abstraction - only 2 uses (Rule of Three says wait for 3). Also, test SHOULD hardcode expected output to verify the CLI produces correct format.
**Files affected**: `math-workflow-demo-cli.ts`, `demo-math-workflow-gives-expected-output-number.e2e.test.ts`

**AI Recommendation**: REJECT - The test intentionally hardcodes the expected format to verify the CLI output is correct. Sharing the constant would reduce test independence and violate Rule of Three.

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, code hasn't earned this yet (AI recommended)
- [ ] **DEFER** - Maybe later, not now

**Comments** (optional): _______________

---

### Refactor 2.2: Template for Claude Commands

**Type**: Create new abstraction
**Description**: The three Claude command markdown files (`times-two.md`, `plus-three.md`, `div-five.md`) are nearly identical, differing only in the math operation. Could create a template or generator.
**Justification**: DRY principle - 3 similar files
**Risk**: Over-engineering - these are markdown files for Claude, not code. The Epic states this demo code "is expected to be thrown away or heavily rewritten." Adding templating adds complexity to throwaway code.
**Files affected**: `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/*.md`

**AI Recommendation**: REJECT - This is demo/throwaway code per the Epic. The commands are intentionally separate to demonstrate chaining. Templating would add complexity without value.

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, code hasn't earned this yet (AI recommended)
- [ ] **DEFER** - Maybe later, not now

**Comments** (optional): _______________

---

### Refactor 2.3: Workflow Step Abstraction

**Type**: Create new abstraction
**Description**: The CLI has 3 similar patterns: `await tool.execute(COMMAND, previousResult)`. Could create a `runWorkflowStep()` helper or a workflow runner.
**Justification**: Could improve readability and make it easier to add more steps
**Risk**: Classic gold-plating - "make it easier to add steps" when we don't know if we'll ever add more steps. The current code is 41 lines and crystal clear. An abstraction would add complexity without proven benefit.
**Files affected**: `src/demo/cli/math-workflow-demo-cli.ts`

**AI Recommendation**: REJECT - The code is minimal (41 lines) and clear. Adding an abstraction for 3 sequential calls would be over-engineering. If the pattern appears in more CLIs, we can abstract then.

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, code hasn't earned this yet (AI recommended)
- [ ] **DEFER** - Maybe later, not now

**Comments** (optional): _______________

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 0 |
| Tier 2 (Pending approval) | 3 (all AI-recommended REJECT) |
| **Total proposed** | 3 |

---

## Analysis Result

The GREEN phase implementation is already clean and follows existing patterns. The code is:
- ✅ Minimal (41-line CLI, 40-line test)
- ✅ Well-named (constants extracted, clear variable names)
- ✅ Pattern-consistent (matches `string-reversal-demo-cli.ts`)
- ✅ No duplication within files
- ✅ No magic constants (all extracted)

The three Tier 2 refactors are all **gold-plating candidates** that would add complexity to simple, throwaway demo code. Per the Epic: "this code is expected to be thrown away or heavily rewritten."

**Recommendation**: No refactors needed. Proceed to VERIFY.

---

## Next Steps

Since the AI recommends no refactors, you have two options:

### Option A: Accept "No Refactors" and Skip to VERIFY
If you agree no refactors are needed, proceed directly to verification:
```
/agentic-hq-commands:workflow:jira-story-workflow:05-jira-validate AHQ-10 e2e
```

### Option B: Override and Execute Specific Refactors
If you want any Tier 2 refactors executed, mark them as APPROVE above and run:
```
/agentic-hq-commands:workflow:jira-story-workflow:04b-jira-refactor-execute AHQ-10 e2e
```

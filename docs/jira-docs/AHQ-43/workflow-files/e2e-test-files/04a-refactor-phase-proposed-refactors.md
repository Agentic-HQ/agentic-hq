# REFACTOR Analysis: AHQ-43 (e2e test)

**Jira**: [AHQ-43](https://agentic-hq.atlassian.net/browse/AHQ-43)
**Test Type**: e2e
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-03-14

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

**Command**: `pnpm validate`
**Result**: PASSING (9 unit tests, typecheck, lint, format all clean)

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, red phase, green phase, and implementation documents for deferred items and opportunities.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | AI Summary: "**REFACTOR consideration**: During the REFACTOR phase, we should also update the quick workflow commands (from AHQ-82) to match this pattern — restoring `project-root` as a self-determined variable so both workflows are consistent." | Deferred | Update the 5 quick-jira-workflow command files to use `project-root` as a self-determined variable (like the full workflow commands now do), instead of having no `project-root` variable and using relative paths. This was also explicitly called out in the Jira description: "During the REFACTOR phase of this Jira, we should also update the quick workflow command files (from AHQ-82) to restore `project-root` as a self-determined variable, so both workflows are consistent." | **Should do.** This was explicitly agreed between AI and human during the Read & Question phase, and is also stated in the Jira description. The quick workflow commands currently use relative paths (e.g. `docs/jira-docs/{jira-id}/...`) while the full workflow commands use `{project-root}/docs/jira-docs/{jira-id}/...`. Making them consistent makes it clearer for Claude where files are. The quick workflow commands also have vestigial text mentioning "project root" in step descriptions (e.g. "Read the input file to get the Jira ID, project root, and test type") which should be cleaned up at the same time. | Tier 2 |
| P.2 | AI Summary: "Intentionally out of scope: No e2e test for this workflow" | Observed | There's no automated test for this full workflow. The quick workflow has an e2e test (`cross-workspace-quick-jira-workflow.e2e.test.ts`). | **Skip.** The Jira explicitly says no automated test — manual testing only. Creating one would be scope creep. AHQ-75 (follow-up Jira) will expand the workflow and may be a better time to add one. | Skip |
| P.3 | GREEN phase plan: CLI was "moved" from `src/demo/cli/` to skill's `ts-workflow/src/` with 4 tweaks | Observed | The `buildVariablesString` function is **duplicated identically** between `quick-jira-workflow-demo-cli.ts` (lines 30-36) and `full-jira-tdd-story-workflow-demo-cli.ts` (lines 37-43). Both have the exact same signature, body, and TSDoc. | **Not yet — Rule of Three.** Currently exists in exactly 2 files. Unless a third workflow CLI is imminent, extracting to a shared module adds complexity (shared dependency, import paths from link: protocol mini-projects) without clear benefit. Worth noting for the future, but not worth doing now. | Skip |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below.

---

## Magic Constants Audit

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `full-jira-tdd-story-workflow-demo-cli.ts` | 38 | `'Your variables for use in this command are jira-id = '` | OK | N/A — this is a human-readable protocol string shared with command .md files; extracting it would make it harder to read and match between .ts and .md |
| `full-jira-tdd-story-workflow-demo-cli.ts` | 40 | `' and test-type = '` | OK | N/A — same reasoning as above |
| `full-jira-tdd-story-workflow-demo-cli.ts` | 64 | `','` | OK | N/A — standard CSV split character |

> All literal values are already extracted to named constants (the 6 command paths are all named constants). The remaining string literals are protocol formatting strings that are intentionally inline for readability.

---

## Tier 1: Auto-Approved Refactors

> No Tier 1 refactors identified. Code is already clean at this level.

The implementation is minimal and well-structured:
- All 6 command paths are extracted as named constants
- The `buildVariablesString` function is well-named with TSDoc
- No dead code, no unused variables, no overly complex conditionals
- TSDoc is present on the function and file-level comments are comprehensive
- No magic constants that need extracting

---

## Tier 2: AI-Identified Potential Refactors

### Refactor 2.1: Update Quick Workflow Commands to Use `project-root` as Self-Determined Variable

**Type**: Cross-file consistency refactoring
**Description**: Update all 5 quick-jira-workflow command files (`.agentic-hq/plugins/agentic-hq-demos-plugin/commands/quick-jira-workflow/*.md`) to match the full workflow's `project-root` pattern:
1. Add `project-root = (your primary working directory)` to each file's variable section
2. Change relative paths (e.g. `docs/jira-docs/{jira-id}/...`) to absolute paths using `{project-root}/docs/jira-docs/{jira-id}/...`
3. Clean up vestigial text in files 01-04 that still says "Read the input file to get the Jira ID, project root, and test type" — this is misleading since `project-root` is NOT parsed from the input

**AI Recommendation**: RECOMMEND — This was explicitly agreed during Read & Question phase AND stated in the Jira description itself. Both workflows should be consistent. The quick workflow commands currently have a confusing mix of vestigial "project root" text in descriptions but no actual `project-root` variable or absolute paths, which is worse than either approach.

**Risk**: Low. Changes are to markdown instruction files only (not code). The quick workflow e2e test verifies the CLI behavior, not the content of command files. However, a full e2e run of the quick workflow after this change would be ideal to confirm Claude still behaves correctly with the updated instructions.

**Files affected**:
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/quick-jira-workflow/01-read-jira-and-plan-tests-and-implementation-understand.md`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/quick-jira-workflow/02-RED-write-failing-test.md`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/quick-jira-workflow/03-GREEN-minimal-implementation.md`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/quick-jira-workflow/04-REFACTOR.md`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/quick-jira-workflow/05-transition-jira-to-done.md`

**Your Decision**:
- [X] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
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
| Tier 1 (Auto-approved) | 0 |
| Tier 2 AI-Identified (Pending review) | 1 |
| **Total identified by AI** | 1 |

---

## Agreed Refactors Discussion Notes

No discussion was needed — Refactor 2.1 was straight APPROVED by the human, no DISCUSS items were marked, and no human-identified refactors were added.

---

## Agreed Refactors Summary Table

> For detail on any discussed item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above.

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 2.1 | AI | Update all 5 quick-jira-workflow command files to use `project-root` as a self-determined variable (matching the full workflow pattern): (1) Add `project-root = (your primary working directory)` to variable sections, (2) Change relative paths to `{project-root}/...` absolute paths, (3) Clean up vestigial "project root" text in step descriptions | EXECUTE | Approved by human |

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-03-14.

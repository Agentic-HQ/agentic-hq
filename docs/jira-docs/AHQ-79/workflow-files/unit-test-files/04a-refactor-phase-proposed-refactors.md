# REFACTOR Analysis: AHQ-79 (unit test)

**Jira**: [AHQ-79](https://agentic-hq.atlassian.net/browse/AHQ-79)
**Test Type**: unit
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-03-04

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

**Command**: `pnpm test:unit`
**Result**: PASSING (9 tests — 6 new AgenticHqConfig + 3 existing)

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, red phase, green phase, and implementation documents for deferred items and opportunities.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | AI Summary: "Remove entirely. AgenticHqConfig replaces it. The file git-utils.ts will be deleted." (Question 2 answer) | Deferred | `git-utils.ts` and `getProjectRoot()` are now superseded by `AgenticHqConfig`. The AI summary explicitly resolved that `git-utils.ts` should be deleted and all callers updated. However, `getProjectRoot()` is still imported and used in 3 source files: `ClaudeCodeTool.ts`, `full-jira-tdd-story-workflow-demo-cli.ts`, `quick-jira-workflow-demo-cli.ts`. | This is a real but **large** change for the unit test REFACTOR phase — it touches 3 files beyond what this Jira's unit tests cover. The Jira's own "Implementation Guidance" (Changes 3 and 4) describes exactly these replacements. I think this belongs in the **e2e test phase** of this same Jira (where the cross-workspace test will actually exercise these code paths), NOT in the unit test refactor. Doing it here would be changing untested code paths. | Skip for unit test REFACTOR — pick up in e2e phase (Changes 3 & 4 in the Jira) |
| P.2 | GREEN Phase Plan: "Changes 1, 3, 4, 5 from the Jira (bin/agentic-hq.cjs, ClaudeCodeTool.ts, demo CLIs, install scripts) → N/A for unit test GREEN phase — those are NOT tested by the unit test" | Deferred | The GREEN phase explicitly noted that Jira Changes 1, 3, 4, 5 were out of scope for the unit test. These are all implementation work for the e2e test phase. | Correct — these are not refactors, they're new implementation work that belongs in the e2e RED/GREEN/REFACTOR cycle. | Skip — e2e phase work, not unit test refactoring |
| P.3 | GREEN Phase Summary: "Direct execSync calls: Used execSync('git rev-parse --show-toplevel') directly rather than importing from git-utils.ts, keeping the implementation self-contained" | Observed | `AgenticHqConfig` duplicates the `git rev-parse --show-toplevel` call that already exists in `git-utils.ts`. The same command string appears in two places: `git-utils.ts` line 13 and `agentic-hq-config.ts` lines 9, 17. | This is technically duplication, but `git-utils.ts` is destined for deletion (per P.1 above). Extracting a shared constant now would be wasted effort. The duplication resolves itself when `git-utils.ts` is deleted in the e2e phase. For now, extracting the magic string within `agentic-hq-config.ts` itself is worthwhile (see Tier 1 below). | Tier 1 (extract constant within agentic-hq-config.ts only) |
| P.4 | Test file: RED phase comment `// Does NOT exist yet!` on line 19 | Observed | The import comment `// Does NOT exist yet!` on line 19 of the test file is now stale — the module DOES exist. | Trivial cleanup, but stale comments are misleading. | Tier 1 |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below.

---

## Magic Constants Audit

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `src/config/agentic-hq-config.ts` | 9 | `'git rev-parse --show-toplevel'` | MAGIC (x2, also line 17) | -> `GIT_ROOT_DETECTION_COMMAND` |
| `src/config/agentic-hq-config.ts` | 13 | `'/.agentic-hq/plugins'` | MAGIC | -> `AGENTIC_HQ_PLUGINS_SUBPATH` |
| `src/config/agentic-hq-config.ts` | 21 | `'/.agentic-hq/temp'` | MAGIC | -> `AGENTIC_HQ_TEMP_SUBPATH` |
| `src/config/agentic-hq-config.ts` | 5 | `'AGENTIC_HQ_WORKSPACE_ROOT'` (env var name, accessed via `process.env`) | OK | N/A — accessing `process.env.AGENTIC_HQ_WORKSPACE_ROOT` directly is idiomatic. Extracting the string `'AGENTIC_HQ_WORKSPACE_ROOT'` to a constant adds no clarity. |

**3 MAGIC entries above are included in Tier 1 refactors below.**

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.1 | Extract magic constant | Extract `'git rev-parse --show-toplevel'` to a named constant `GIT_ROOT_DETECTION_COMMAND` (used on lines 9 and 17 — deduplicates too) | `src/config/agentic-hq-config.ts` Lines: 9, 17 |
| 1.2 | Extract magic constant | Extract `'/.agentic-hq/plugins'` to a named constant `AGENTIC_HQ_PLUGINS_SUBPATH` | `src/config/agentic-hq-config.ts` Line: 13 |
| 1.3 | Extract magic constant | Extract `'/.agentic-hq/temp'` to a named constant `AGENTIC_HQ_TEMP_SUBPATH` | `src/config/agentic-hq-config.ts` Line: 21 |
| 1.4 | Remove stale comment | Remove the `// Does NOT exist yet!` comment from the import — the module now exists | `tests/unit/config/agentic-hq-config.unit.test.ts` Line: 19 |
| 1.5 | Add TSDoc | Add brief TSDoc comments to the class and its 5 public methods (this is a new public API — it deserves minimal documentation explaining what each "root" means) | `src/config/agentic-hq-config.ts` Lines: 3, 4, 12, 16, 20, 24 |

---

## Tier 2: AI-Identified Potential Refactors

Include ALL potential structural refactors here - both ones you recommend AND ones you're unsure about or even think shouldn't be done. The human decides; your job is to surface them all with honest opinions.

### Refactor 2.1: Extract a private helper for the `execSync` git call

**Type**: Duplication removal (within file)
**Description**: Lines 9 and 17 in `agentic-hq-config.ts` both call `execSync(GIT_ROOT_DETECTION_COMMAND, { encoding: 'utf-8' }).trim()` — identical code. Could extract a `private getGitRoot(): string` method to call it once and DRY it up.
**AI Recommendation**: RECOMMEND — The duplication is real (identical 1-liner called twice), the extraction is trivial, and it makes the class slightly cleaner. It's within the same file so risk is very low.
**Risk**: Minimal. The only question is whether this is over-engineering for 2 call sites (Rule of Three says wait for 3). But it's a private helper within the same class, not a new abstraction — so the threshold is lower.
**Files affected**: `src/config/agentic-hq-config.ts`

**Your Decision**:
- [X] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.2: Make `AgenticHqConfig` a singleton or use dependency injection

**Type**: Introduce design pattern
**Description**: Currently callers create `new AgenticHqConfig()` each time they need it. The class has no state, so every instance is identical. Could make it a singleton, or pass it via constructor injection to classes that need it.
**AI Recommendation**: NOT RECOMMENDED — The class is stateless and cheap to instantiate. Singleton adds complexity for no benefit. DI is a good pattern but there's only one consumer right now (the test). Wait until the e2e phase wires it into `ClaudeCodeTool` and the demo CLIs — then we'll see whether DI makes sense.
**Risk**: Classic premature abstraction. Only one consumer exists. Adding DI infrastructure now is gold-plating.
**Files affected**: `src/config/agentic-hq-config.ts`, potentially all consumers

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [X] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.3: Add an `AGENTIC_HQ_WORKSPACE_ROOT` env var name constant

**Type**: Extract magic constant
**Description**: The env var name `AGENTIC_HQ_WORKSPACE_ROOT` is used as `process.env.AGENTIC_HQ_WORKSPACE_ROOT` in the implementation and as a string in the test. Could extract to a named export like `ENV_AGENTIC_HQ_WORKSPACE_ROOT = 'AGENTIC_HQ_WORKSPACE_ROOT'` and use it in both the implementation and test.
**AI Recommendation**: NOT RECOMMENDED — `process.env.AGENTIC_HQ_WORKSPACE_ROOT` is perfectly idiomatic TypeScript. Extracting the string adds a layer of indirection that makes the code harder to read, not easier. The env var name is unlikely to change (it's part of the contract with `bin/agentic-hq.cjs`).
**Risk**: Over-engineering. Adds complexity without improving clarity.
**Files affected**: `src/config/agentic-hq-config.ts`, `tests/unit/config/agentic-hq-config.unit.test.ts`

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
| Tier 1 (Auto-approved) | 5 |
| Tier 2 AI-Identified (Pending review) | 3 |
| **Total identified by AI** | 8 |

---

## Agreed Refactors Discussion Notes

No items required discussion. All Tier 2 decisions were straight APPROVE or REJECT with no DISCUSS marks. Human wrote "None" for human-identified refactors.

---

## Agreed Refactors Summary Table

> For detail on any discussed item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above.

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 1.1 | AI (Tier 1) | Extract `'git rev-parse --show-toplevel'` to `GIT_ROOT_DETECTION_COMMAND` constant | EXECUTE | Auto-approved |
| 1.2 | AI (Tier 1) | Extract `'/.agentic-hq/plugins'` to `AGENTIC_HQ_PLUGINS_SUBPATH` constant | EXECUTE | Auto-approved |
| 1.3 | AI (Tier 1) | Extract `'/.agentic-hq/temp'` to `AGENTIC_HQ_TEMP_SUBPATH` constant | EXECUTE | Auto-approved |
| 1.4 | AI (Tier 1) | Remove stale `// Does NOT exist yet!` comment from test import | EXECUTE | Auto-approved |
| 1.5 | AI (Tier 1) | Add TSDoc to class and 5 public methods | EXECUTE | Auto-approved |
| 2.1 | AI (Tier 2) | Extract private `getGitRoot()` helper to deduplicate `execSync` git call | EXECUTE | Approved by human |
| 2.2 | AI (Tier 2) | Make AgenticHqConfig singleton or use DI | SKIP | Rejected by human |
| 2.3 | AI (Tier 2) | Extract env var name to constant | SKIP | Rejected by human |

**Total to execute: 6** | **Total skipped: 2**

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-03-04.

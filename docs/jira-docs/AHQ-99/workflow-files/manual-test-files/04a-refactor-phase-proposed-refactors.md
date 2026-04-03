# REFACTOR Analysis: AHQ-99 (manual test)

**Jira**: [AHQ-99](https://agentic-hq.atlassian.net/browse/AHQ-99)
**Test Type**: manual
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-04-03

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

**Command**: Manual testing confirmed by human ("Amazing. It worked really well.")
**Result**: PASSING (manual verification)

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, red phase, green phase, and implementation documents for deferred items and opportunities.

Searched all files in `docs/jira-docs/AHQ-99/workflow-files/` for "refactor"/"REFACTOR" mentions. Results below.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | GREEN phase summary line 41 + GREEN phase plan line 267: "Semantically wrong (it's a core skill, not a demo), but it's the minimum change for GREEN. **Flagged for REFACTOR** — should split into `CORE_SKILLS` + `DEMO_SKILLS`" | Deferred | Split `DEMO_SKILLS` in `demo-skills.ts` into separate `CORE_SKILLS` + `DEMO_SKILLS` arrays, then merge in `agentic-hq-cli.ts`. Currently `create-workflow` (a core tool) lives in the `DEMO_SKILLS` array. | **UNSURE.** Semantically correct — `create-workflow` IS core, not a demo. But Rule of Three: there's only 1 core skill so far. The array is 5 items total. Adding a new file + merge logic for 1 item feels like premature separation. A simpler fix would be to rename `DEMO_SKILLS` to something like `REGISTERED_SKILLS` or `WORKFLOW_SKILLS` (since it's now a mix of demos and core). | Tier 2 |
| P.2 | `claude-command-builder.ts` lines 32-34 + Jira description "Testing update": `TEMPORARILY_ADDED_PLUGIN_DIR` pointing to `/Users/stevepersonal/dev/agentic-hq/test-workflow-workspaces/steve-test-workflow-workspace-001` | Deferred to AHQ-103 | Remove `TEMPORARILY_ADDED_PLUGIN_DIR` and its usage in `getPluginDirFlags()`, plus the test assertion for `steve-test-new-plugin-001` | This is explicitly scoped to [AHQ-103](https://agentic-hq.atlassian.net/browse/AHQ-103) (plugin discovery). Should NOT be done here — removing it now would break manual testing of workflows from non-AHQ workspaces until AHQ-103 lands. | Skip (AHQ-103) |
| P.3 | `claude-command-builder.ts` lines 88-98 comment: "This is temporary since AHQ-102 will bundle required resources with each workflow skill" | Deferred to AHQ-102 | Remove `buildAllowedToolsListString()` method and revert to `DEFAULT_ALLOWED_TOOLS.join(' ')` | This is explicitly scoped to [AHQ-102](https://agentic-hq.atlassian.net/browse/AHQ-102) (bundle resources with workflows). Should NOT be done here — removing it now would break Read permissions for workflows running from non-AHQ workspaces. | Skip (AHQ-102) |
| P.4 | `agentic-hq-installation.ts` line 9: "REFACTOR - getConfigDir is a terrible name. It should be getRoot() or getAgenticHqDir()" | Observed (pre-existing) | Rename `getConfigDir()` on the `AgenticHqInstallation` interface to a clearer name | Pre-existing tech debt. Not created by AHQ-99. Renaming would touch every file that uses this interface — a cross-cutting refactor well beyond AHQ-99's scope. | Skip (out of scope, separate Jira) |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below.

---

## Magic Constants Audit

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `create-workflow-cli.ts` | 40 | `'AGENTIC_HQ_WORKSPACE_ROOT'` | MAGIC | -> `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VARIABLE_NAME` |
| `create-workflow-cli.ts` | 46 | `1` (in `process.exit(1)`) | MAGIC | -> `ERROR_EXIT_CODE_VALUE` |
| `claude-command-builder.ts` | 97 | `'Read('` prefix in template string | EXTRACTED | Part of template logic, not a standalone constant |
| `demo-skills.ts` | 33-37 | All values in typed object properties | EXTRACTED | Properties of `WorkflowSkill` interface |
| `package.json` | 6 | `">=22.0.0"` | EXTRACTED | Standard `engines` field (not code) |

**2 MAGIC entries found.** Both are in `create-workflow-cli.ts`. Included in Tier 1 below.

**AI note on these magic constants:** Both are borderline. `process.exit(1)` is a universally understood convention. `AGENTIC_HQ_WORKSPACE_ROOT` is used once and is descriptive enough inline. I include them because the audit requires it, but I'd be comfortable if the human rejects them.

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.1 | Extract magic constant | Extract `'AGENTIC_HQ_WORKSPACE_ROOT'` to `const AGENTIC_HQ_WORKSPACE_ROOT_ENV_VARIABLE_NAME = 'AGENTIC_HQ_WORKSPACE_ROOT'` | `create-workflow-cli.ts` Line: 40 |
| 1.2 | Extract magic constant | Extract `1` from `process.exit(1)` to `const ERROR_EXIT_CODE_VALUE = 1` | `create-workflow-cli.ts` Line: 46 |

---

## Tier 2: AI-Identified Potential Refactors

### Refactor 2.1: Rename `DEMO_SKILLS` and `demo-skills.ts` to reflect mixed content

**Type**: Naming improvement (file + export rename)
**Description**: `demo-skills.ts` now contains both demo skills (reversal, math, quick-jira, full-jira) and a core skill (create-workflow). Rename the file from `demo-skills.ts` to `registered-skills.ts` (or `workflow-skills.ts`) and the export from `DEMO_SKILLS` to `REGISTERED_SKILLS`. This is a simpler alternative to the full split proposed during GREEN (which would require a new file + merge logic for just 1 core skill).
**AI Recommendation**: RECOMMEND — it's a low-risk rename that fixes the semantic mismatch without adding complexity. The GREEN phase flagged this for refactoring and this is the minimal version that addresses it. Finding and updating imports is straightforward (only a few files reference `DEMO_SKILLS`).
**Risk**: Low — it's a rename, not a structural change. All references need updating but the compiler will catch any misses.
**Files affected**: `src/demo/demo-skills.ts` (rename file + export), any files that import `DEMO_SKILLS`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional):   This manually created skills list in demo-skills.ts will disappear soon with dynamic plugin and workflow discovery in https://agentic-hq.atlassian.net/browse/AHQ-103 and so not worth fixing now.

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
| Tier 2 AI-Identified (Pending review) | 1 |
| **Total identified by AI** | 3 |

---

## Agreed Refactors Discussion Notes

No discussion was needed — no items were marked DISCUSS and human wrote "None" for their refactors.

---

## Agreed Refactors Summary Table

> For detail on any discussed item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above.

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 1.1 | AI | Extract `'AGENTIC_HQ_WORKSPACE_ROOT'` to `const AGENTIC_HQ_WORKSPACE_ROOT_ENV_VARIABLE_NAME` in `create-workflow-cli.ts` | EXECUTE | Tier 1 auto-approved, human renamed constant |
| 1.2 | AI | Extract `1` from `process.exit(1)` to `const ERROR_EXIT_CODE_VALUE` in `create-workflow-cli.ts` | EXECUTE | Tier 1 auto-approved, human renamed constant |
| 2.1 | AI | Rename `DEMO_SKILLS`/`demo-skills.ts` to `REGISTERED_SKILLS`/`registered-skills.ts` | SKIP | Rejected by human — this list will disappear with dynamic plugin/workflow discovery in AHQ-103 |

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-04-03.

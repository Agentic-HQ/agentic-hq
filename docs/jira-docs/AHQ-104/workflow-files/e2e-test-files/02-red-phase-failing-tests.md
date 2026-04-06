# RED Phase Complete: AHQ-104 (e2e test)

**Jira**: [AHQ-104](https://agentic-hq.atlassian.net/browse/AHQ-104)
**Test Type**: e2e
**Phase**: RED (Failing Test Written)
**Generated**: 2026-04-05 21:44

---

## Test Created

**File**: `tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts`

**Test**: `should list workflows in the new 2-line format from a separate workspace via the globally-linked binary`

**What it verifies**: When `agentic-hq list` is run from a temp workspace (via the globally-linked binary from `install-dev-agentic-hq.sh`), the output contains:
1. `Available workflows:` header
2. `create-workflow` (stable core workflow — confirms discovery ran)
3. `What it does: Create` (partial match — confirms new 2-line format is in use)

Three non-brittle assertions; deliberately tolerates future description-text tweaks.

---

## Test Run Output

**Command**: `pnpm test:e2e:cross-workspace-list-workflows`

**Result**: ✅ FAILED (as expected for RED phase)

**Assertions 1 & 2 passed** (header and `create-workflow` both found in current output).

**Assertion 3 failed** (the genuine RED failure):

```
AssertionError: expected 'Available workflows:\n\n  reversal   …' to contain 'What it does: Create'

- Expected
+ Received

- What it does: Create
+ Available workflows:
+
+   reversal         /agentic-hq-demos-plugin:string-reversal               Reverses a string (hello world demo)
+ Example: agentic-hq reversal -- --string-reverse='hello there you'
+   math             /agentic-hq-demos-plugin:math-workflow                 Solves a math problem using an agent team
+ Example: agentic-hq math -- --input-number=54321
+   quick-jira       /agentic-hq-demos-plugin:quick-jira-workflow           Creates and completes a Jira ticket
+ Example: agentic-hq quick-jira -- --jira-id=TEST-123
+   full-jira        /agentic-hq-demos-plugin:full-jira-tdd-story-workflow  Full TDD story workflow driven by a Jira ticket
+ Example: agentic-hq full-jira -- --jira-id=TEST-123
+   create-workflow  /agentic-hq-core-plugin:create-workflow                Create a new Agentic HQ workflow
+ Example: agentic-hq create-workflow
```

This is a true traditional RED failure — current CLI uses the old hardcoded aligned 3-column format with `Example:` prefix, and does NOT yet produce the new 2-line `What it does:` format.

---

## TypeScript Check

**Command**: `pnpm typecheck`

**Result**: ✅ PASSING (no type errors in new test file)

---

## Scope Note

This Jira slightly expands scope to ship the new 2-line output format (per user decision, to avoid wasted work reproducing the old aligned format that would be immediately undone in the next Jira per parent AHQ-103). The Jira's "Out of Scope" restriction on format changes was intentionally loosened for this subtask.

The new format per workflow is:
- Line 1 (no indent): `agentic-hq <shortName><exampleParameters>`
- Line 2 (3-space indent): `   What it does: <description>`

---

## Files Created

- `tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts` — The ONE e2e test file

## Files Modified

- `package.json` — added `test:e2e:cross-workspace-list-workflows` script

**Note**: No skeleton/implementation files created in RED phase — that's GREEN phase work.

---

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-104 e2e
```

GREEN-phase work will include:
- Creating 5 `ahq-workflow.json` metadata files (one per skill directory)
- One-line change to `AhqWorkflowImpl.getWorkflowListingEntryString()` to emit the new 2-line format
- Wiring `WorkflowSearchResultsImpl` into `src/cli/agentic-hq-cli.ts` (replacing hardcoded `DEMO_SKILLS`)
- Deleting unused classes/interfaces/tests (candidates: `FullClaudeSkillCommand`, possibly `PluginId`/`SkillId`, and the old `DEMO_SKILLS`/`WorkflowSkillsRegistry`/`WorkflowSkill` stack)

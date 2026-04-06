# GREEN Phase Complete: AHQ-104 (e2e test)

**Jira**: [AHQ-104](https://agentic-hq.atlassian.net/browse/AHQ-104)
**Test Type**: e2e
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-04-06

---

## Implementation Created

**Files Created/Modified**:
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ahq-workflow.json` - workflow metadata
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ahq-workflow.json` - workflow metadata
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ahq-workflow.json` - workflow metadata
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ahq-workflow.json` - workflow metadata
- `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ahq-workflow.json` - workflow metadata
- `src/workflow-discovery/workflow/ahq-workflow-impl.ts` - new 2-line listing format
- `src/cli/agentic-hq-program.ts` - list action wired to WorkflowSearchResultsImpl
- `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts` - assertions updated for new format
- `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts` - assertions updated for new format

**Test Command**: `pnpm test:e2e:cross-workspace-list-workflows`
**Test Result**: PASSING

---

## What Was Implemented

The `agentic-hq list` command now uses dynamic workflow discovery via `WorkflowSearchResultsImpl` instead of the hardcoded `DEMO_SKILLS` array. Five `ahq-workflow.json` metadata files were created (one per existing workflow), and the output format changed to a new 2-line-per-workflow layout (line 1: example command, line 2: "What it does: description").

### Key implementation decisions:

1. **Inline instantiation in list action**: `new WorkflowSearchResultsImpl()` is created directly inside the list action in `createProgram()`. This bypasses proper DI — acceptable for GREEN phase, deferred to REFACTOR for proper injection.
2. **DEMO_SKILLS + WorkflowSkillsRegistry kept alive**: Short-alias subcommands (`agentic-hq math`, etc.) still use the old hardcoded `DEMO_SKILLS` registry. Only the `list` action uses dynamic discovery. Full replacement is REFACTOR work.
3. **Unused private methods left in AhqWorkflowImpl**: `getShortName()` and `getFullClaudeSkillCommand()` are no longer called by `getWorkflowListingEntryString()` but remain in the class. They don't cause lint/compile errors (TypeScript doesn't flag unused private methods). Deletion is REFACTOR work.
4. **Unit test assertions updated**: Two test files were updated to assert the new 2-line format instead of the old 3-column format. This is legitimate maintenance when production behavior deliberately changes.

### Bugs found and fixed during GREEN:

1. **ESLint import order** — the new `WorkflowSearchResultsImpl` import was placed before the `WorkflowSkillsRegistry` type import, violating the `import/order` rule. Fixed by reordering (type imports first, then value imports).

## Files Created

- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ahq-workflow.json`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ahq-workflow.json`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ahq-workflow.json`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ahq-workflow.json`
- `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ahq-workflow.json`

## Files Modified

- `src/workflow-discovery/workflow/ahq-workflow-impl.ts` — replaced old 3-column+Example format with new 2-line format (example command + "What it does: description")
- `src/cli/agentic-hq-program.ts` — list action now uses `WorkflowSearchResultsImpl` instead of `registry.formatSkillList()`
- `tests/unit/workflow-discovery/workflow/ahq-workflow-impl.unit.test.ts` — updated 2 assertions to match new format
- `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts` — updated 3 tests to match new format (Example: -> What it does:, removed fullPath assertion, renamed test names)

---

## Deferred to REFACTOR

The following items were intentionally left for the REFACTOR phase:

1. **Remove unused private methods** `getShortName()` and `getFullClaudeSkillCommand()` from `AhqWorkflowImpl`
2. **Remove now-unused constants** `WORKFLOW_LINE_INDENT` and `EXAMPLE_LINE_PREFIX` from `AhqWorkflowImpl` (already removed — but associated imports remain: `FullClaudeSkillCommand`, `WorkflowShortName` types, `FullClaudeSkillCommandImpl`, `WorkflowShortNameImpl` value imports)
3. **Evaluate whether `FullClaudeSkillCommandImpl`, `PluginIdImpl`, `SkillIdImpl` classes + their unit tests should be deleted** — no longer used in production code (only tested in isolation)
4. **Replace inline `new WorkflowSearchResultsImpl()`** in createProgram's list action with proper DI (inject via constructor or parameter)
5. **Replace `DEMO_SKILLS` + `WorkflowSkillsRegistry` + `WorkflowSkill` stack** with discovery-based short-alias subcommand registration
6. **Rename misleading test** `should include at least one indented "What it does:" line` (assertion doesn't actually check "What it does:" — it checks for any 2-space-indented line)
7. **Remove old files** once short aliases use discovery: `src/demo/demo-skills.ts`, `src/workflow/workflow-skills/workflow-skills-registry.ts`, `src/interfaces/workflow-skill.ts`
8. **Pre-existing lint warning**: unused eslint-disable directive in `src/workflow-discovery/interfaces/workflow-metadata.ts:16`

---

## Ready for REFACTOR Phase

The test is passing. This program should self terminate, and then (if you are running the automated workflow) the following command will be run automatically:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-104 e2e
```

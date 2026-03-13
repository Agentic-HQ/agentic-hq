# RED Phase Complete: AHQ-82 (e2e test)

**Jira**: [AHQ-82](https://agentic-hq.atlassian.net/browse/AHQ-82)
**Test Type**: e2e
**Phase**: RED (Failing Test Written)
**Generated**: 2026-03-11

---

## Test Created

**File**: `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts`
**Tests**: Verifies the quick Jira TDD workflow works from a separate workspace via the globally-linked `agentic-hq` binary — creates a test Jira, runs the 5-command orchestration (read -> loop over test types: RED/GREEN/REFACTOR -> transition to Done), and asserts workflow output files + implementation files + Jira status is Done.

**Failure Output** (skill resolution error expected — quick-jira-workflow skill doesn't exist yet):
```
The agentic-hq CLI will fail to resolve --workflow-command-supplier=/agentic-hq-demos-plugin:quick-jira-workflow
because the skill directory .agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ does not exist.
No SKILL.md, no ts-workflow/ directory, no CLI to run.
```

**TypeScript compilation**: Passes (`pnpm typecheck` clean)

---

## Files Created/Modified

- `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts` — New cross-workspace e2e test
- `package.json` — Added `test:e2e:cross-workspace-quick-jira-workflow` script

**Note**: No skeleton/implementation files created in RED phase — that's GREEN phase work.

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-82 e2e
```

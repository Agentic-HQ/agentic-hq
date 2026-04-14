# RED Phase Complete: AHQ-106 (e2e test)

**Jira**: [AHQ-106](https://agentic-hq.atlassian.net/browse/AHQ-106)
**Test Type**: e2e
**Phase**: RED (Failing Test Written)
**Generated**: 2026-04-08

---

## Test Created

**File**: `tests/e2e/demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts`
**Tests**:
1. **Listing** (PASSES): Verifies that a workflow installed in a user's temp workspace appears in `agentic-hq list` output — confirms dynamic discovery works end-to-end from user workspaces
2. **Execution** (FAILS): Verifies that `agentic-hq string-reversal-copy-for-test -- --string-to-reverse="user workspace e2e test"` executes and returns the reversed string — this fails because the CLI still uses `DEMO_SKILLS` for subcommand registration

**Failure Output** (execution test — CLI error as expected):
```
Error: --workflow-command-supplier is required when not using a subcommand.
Run "agentic-hq list" to see available workflows.
```

**Why this is the correct RED failure**: Commander doesn't recognize `string-reversal-copy-for-test` as a subcommand because short-alias registration still uses the old hardcoded `DEMO_SKILLS` array. The command falls through to the main program action which requires `--workflow-command-supplier`. After GREEN wires `registerWorkflowsWith()` into `createProgram()`, dynamically discovered workflows will be registered as Commander subcommands and this test will pass.

---

## Files Created

- `tests/e2e/demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts` — E2e test with 2 test cases (listing + execution)
- `tests/e2e/fixtures/string-reversal-copy-for-test/` — Self-contained fixture plugin directory:
  - `.claude-plugin/plugin.json` — Test plugin metadata
  - `commands/string-reversal-copy-for-test/reverse-a-string.md` — Claude command that reverses a string
  - `skills/string-reversal-copy-for-test/ahq-workflow.json` — Workflow metadata for discovery
  - `skills/string-reversal-copy-for-test/SKILL.md` — Returns ts-workflow run command
  - `skills/string-reversal-copy-for-test/ts-workflow/` — TypeScript workflow (package.json, tsconfig.json, src/string-reversal-demo-cli.ts)

## Files Modified

- `package.json` — Added `test:e2e:user-workspace-workflows` script
- `tsconfig.json` — Excluded `tests/e2e/fixtures` from main project compilation (fixture has its own tsconfig)

**Note**: No skeleton/implementation files created in RED phase — that's GREEN phase work.

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-106 e2e
```

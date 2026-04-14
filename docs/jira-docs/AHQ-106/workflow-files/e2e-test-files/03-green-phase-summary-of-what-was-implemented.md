# GREEN Phase Complete: AHQ-106 (e2e test)

**Jira**: [AHQ-106](https://agentic-hq.atlassian.net/browse/AHQ-106)
**Test Type**: e2e
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-04-08

---

## Implementation Created

**Files Created/Modified**:
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` - Added `UserProjectWorkspace` to constructor, dynamic plugin dir scanning
- `src/kernel/composition-root.ts` - Pass `UserProjectWorkspace` to `ClaudeCommandBuilder`
- `src/cli/workflow-registry-impl.ts` - Fix args bug, simplify builder type to `WorkflowCommandBuilder`
- `src/cli/agentic-hq-program.ts` - Remove `--workflow-command-supplier` + `DEMO_SKILLS`, use `searchResults.registerWorkflowsWith()`
- `src/cli/agentic-hq-cli.ts` - Remove `DEMO_SKILLS`, pass `WorkflowSearchResultsImpl`
- `eslint.config.mjs` - Add e2e fixture ts-workflow to ignores
- `tests/e2e/demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts` - Fix `replaceAll` bug + expected string typo
- `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts` - Use short alias
- `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` - Use short alias
- `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` - Use short alias
- `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts` - Use short alias
- `tests/unit/tools/claude-code/claude-command-builder.unit.test.ts` - Rewrite for new constructor + dynamic scanning
- `tests/unit/cli/agentic-hq-program.unit.test.ts` - Rewrite for new `createProgram()` API
- `tests/unit/cli/workflow-registry-impl.unit.test.ts` - 2-param builder, drop pluginDir
- `tests/unit/claude-code-tool/claude-code-tool-with-injected-config.unit.test.ts` - Add workspace param
- `tests/unit/claude-code-tool/claude-code-tool-with-injected-io-marshaller.unit.test.ts` - Add workspace param
- `tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts` - Add workspace param

**Test Command**: `pnpm test:e2e:user-workspace-workflows`
**Test Result**: PASSING (2/2 tests)

---

## What Was Implemented

Dynamic plugin directory scanning in `ClaudeCommandBuilder` solves both purposes of the `Tool` interface — skill resolution (Purpose 1, via `ClaudeWorkflowCommandBuilder`) and workflow runtime (Purpose 2, via `DefaultClaudeCodeTool`) — without changing any interfaces. The old hardcoded `DEMO_SKILLS` loop and `--workflow-command-supplier` CLI option were removed, replaced by `WorkflowSearchResultsImpl.registerWorkflowsWith()` which dynamically discovers and registers workflows as Commander subcommands.

### Key implementation decisions:

1. **Dynamic scanning vs threading AhqWorkflow**: Instead of passing `AhqWorkflow` through the builder chain (which only solves Purpose 1), `ClaudeCommandBuilder` now scans both AHQ installation and user workspace plugin directories. This solves both purposes. Marked with REFACTOR comment for later explicit-passing approach.

2. **WorkflowRegistryImpl args fix**: Changed from `(...actionArgs: unknown[])` with `actionArgs.slice(0, -1)` to `(_options: unknown, cmd: Command)` with `cmd.args` — fixes Commander passthrough args extraction.

3. **Builder type simplification**: Changed `WorkflowRegistryImpl`'s builder from a custom 3-param structural type to the existing `WorkflowCommandBuilder` interface (2 params — dropped pluginDir since scanning handles it).

4. **Dedup logic**: When user workspace root equals AHQ installation root (same directory), plugin dirs are only scanned once to avoid duplicates.

### Bugs found and fixed during GREEN:

1. `.replace()` only replaces first occurrence — the test fixture's `package.json` has `REPO_ROOT_PLACEHOLDER` in both a comment (line 8) and the actual dependency (line 14). `.replace()` only replaced the comment, leaving the dependency broken. Fixed with `.replaceAll()` in the e2e test's `beforeAll`.

2. Expected reversed string typo — `'tset 2ee ecapskrow resu'` should be `'tset e2e ecapskrow resu'` (the substring `e2e` is a palindrome). This was a RED phase test data bug.

## Files Created

- `docs/jira-docs/AHQ-106/workflow-files/e2e-test-files/03-APPROVED-green-phase-implementation-plan-copy.md` - Approved implementation plan

## Files Modified

- See "Files Created/Modified" list above (17 files total)

---

## Ready for REFACTOR Phase

The test is passing. This program should self terminate, and then (if you are running the automated workflow) the following command will be run automatically:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-106 e2e
```

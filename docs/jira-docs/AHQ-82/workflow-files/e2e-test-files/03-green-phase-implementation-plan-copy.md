# GREEN Phase Implementation Plan: AHQ-82 (e2e test)

## Context

AHQ-82 converts the Quick Jira Workflow from a "runs via tsx from within the repo" approach to the "runs via globally-linked agentic-hq CLI from any workspace" approach. The RED phase created a cross-workspace e2e test at `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts`. The test fails because the `quick-jira-workflow` skill directory doesn't exist yet. GREEN phase creates the minimum code to make that test pass.

---

## Jira Requirements (Numbered)

1. Create quick-jira-workflow SKILL.md using subshell install pattern (not the old `cd && install && run` pattern) -> [Step 2]
2. Create ts-workflow mini-project (package.json, tsconfig.json) -> [Step 3]
3. Create ts-workflow CLI that orchestrates 5 commands with loop over test types -> [Step 4]
4. No `--project-root` parameter — CLI only takes `--jira-id` (required) -> [Step 4]
5. Remove `project-root` from command files 01-05.md variable parsing/paths -> [Step 5]
6. `buildVariablesString` simplified — only passes `jira-id` and optionally `test-type` -> [Step 4]
7. Update string-reversal/SKILL.md to subshell + --tsconfig pattern -> [Step 6]
8. Update math-workflow/SKILL.md to subshell + --tsconfig pattern -> [Step 6]
9. Add `demo:plugin-direct:quick-jira-workflow` pnpm script -> [Step 7]
10. Delete old `src/demo/cli/quick-jira-workflow-demo-cli.ts` -> [Step 8]
11. Delete old `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts` -> [Step 8]
12. Remove old pnpm scripts (`demo:quick-jira-workflow`, `test:e2e:demo-quick-jira-workflow`, sub-scripts) -> [Step 7]
13. MCP Atlassian permissions in test's CLAUDE_SETTINGS_PERMISSIONS -> Already done in RED phase test
14. CLAUDE_SETTINGS_PERMISSIONS refactoring into shared helper -> N/A (REFACTOR phase)
15. E2E test: no `--project-root` in CLI command -> Already done in RED phase test
16. tsx flag is `--tsconfig` NOT `--project` -> [Step 2]

---

## Step 0: Copy This Approved Plan

Copy this approved plan to `docs/jira-docs/AHQ-82/workflow-files/e2e-test-files/03-green-phase-implementation-plan-copy.md`

---

## Step 1: Run the e2e test to confirm RED (failing)

Run `pnpm test:e2e:cross-workspace-quick-jira-workflow` briefly to confirm it fails (skill not found). We expect it to fail quickly (not timeout) since the skill directory doesn't exist.

Actually — since this is an e2e test that creates a Jira and runs a full workflow, running it in RED would waste 25 minutes just to confirm failure. The RED phase doc already confirms the failure reason: "skill directory does not exist". Skip running it and proceed to implementation.

---

## Step 2: Create SKILL.md for quick-jira-workflow

**File**: `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/SKILL.md`

Uses the **subshell install pattern** from the Jira (not the old `cd && install && run`):

```markdown
---
description: Returns the command to run the quick-jira-workflow TypeScript workflow
disable-model-invocation: true
---

## Variables

Set:
skill-base-dir = the skill base directory you were provided with when you ran this skill.
command-input-output-files-directory = $0

## Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "(cd {skill-base-dir}/ts-workflow && pnpm install --ignore-workspace) && {skill-base-dir}/ts-workflow/node_modules/.bin/tsx --tsconfig {skill-base-dir}/ts-workflow/tsconfig.json {skill-base-dir}/ts-workflow/src/quick-jira-workflow-demo-cli.ts"
}
```

## Self-Terminate

/agentic-hq-core-plugin:self-termination
```

**Key difference from math-workflow/string-reversal**: Subshell `(cd ... && install)` keeps the `cd` isolated. tsx runs from user's CWD with explicit `--tsconfig` path.

---

## Step 3: Create ts-workflow mini-project

**File**: `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/package.json`

Following math-workflow pattern exactly. No `demo:quick-jira-workflow` pnpm script needed since SKILL.md invokes tsx directly.

**File**: `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/tsconfig.json`

Copy from math-workflow verbatim.

---

## Step 4: Create ts-workflow CLI

**File**: `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/src/quick-jira-workflow-demo-cli.ts`

Based on old `src/demo/cli/quick-jira-workflow-demo-cli.ts` but:
- Import `ClaudeCodeTool` from `'agentic-hq/tools/claude-code'` (package import, not relative)
- Only `--jira-id` required option (no `--project-root`)
- `buildVariablesString()` only passes `jira-id` and optionally `test-type`
- Same 5-command orchestration with loop

```typescript
function buildVariablesString(jiraId: string, testType?: string): string {
  let variablesString = `Your variables for use in this command are jira-id = ${jiraId}`;
  if (testType) {
    variablesString += ` and test-type = ${testType}`;
  }
  return variablesString;
}
```

---

## Step 5: Update command files 01-05.md to remove project-root

**5 files** at `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/quick-jira-workflow/`:

### 01-read-jira-and-plan-tests-and-implementation-understand.md
- Remove `and project-root = /some/path` from example input string
- Remove `project-root` variable parsing bullet
- Change `{project-root}/docs/jira-docs/{jira-id}/workflow-docs` -> `docs/jira-docs/{jira-id}/workflow-docs`

### 02-RED-write-failing-test.md
- Remove `and project-root = /some/path` from example input string
- Remove `project-root` variable parsing bullet
- Change `{project-root}/docs/jira-docs/...` -> `docs/jira-docs/...`
- Change `Write the test file(s) relative to '{project-root}'.` -> `Write the test file(s) relative to the project root.`
- Change `{project-root}/docs/jira-docs/{jira-id}/workflow-docs/{test-type}-test-files` -> `docs/jira-docs/{jira-id}/workflow-docs/{test-type}-test-files`

### 03-GREEN-minimal-implementation.md
- Same pattern: remove project-root from example/parsing, replace `{project-root}/` with nothing in paths
- Change `Write all implementation files relative to '{project-root}'.` -> `Write all implementation files relative to the project root.`

### 04-REFACTOR.md
- Same pattern: remove project-root from example/parsing, replace `{project-root}/` with nothing in paths

### 05-transition-jira-to-done.md
- Only change: remove `and project-root = /some/path` from example input string (it never used project-root)

---

## Step 6: Update existing SKILL.md files to subshell pattern

### `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/SKILL.md`

Change output command from:
```
"cd {skill-base-dir}/ts-workflow && {base-command}"
```
To subshell pattern (also remove the `base-command` variable line since it's no longer used):
```
"(cd {skill-base-dir}/ts-workflow && pnpm install --ignore-workspace) && {skill-base-dir}/ts-workflow/node_modules/.bin/tsx --tsconfig {skill-base-dir}/ts-workflow/tsconfig.json {skill-base-dir}/ts-workflow/src/string-reversal-demo-cli.ts"
```

### `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/SKILL.md`

Same change — remove `base-command` variable, use subshell pattern:
```
"(cd {skill-base-dir}/ts-workflow && pnpm install --ignore-workspace) && {skill-base-dir}/ts-workflow/node_modules/.bin/tsx --tsconfig {skill-base-dir}/ts-workflow/tsconfig.json {skill-base-dir}/ts-workflow/src/math-workflow-demo-cli.ts"
```

---

## Step 7: Update package.json scripts

**Add:**
- `demo:plugin-direct:quick-jira-workflow` — using new subshell pattern

**Remove:**
- `demo:quick-jira-workflow` — old tsx CLI
- `test:e2e:demo-quick-jira-workflow` — old e2e test
- `test:e2e:demo-quick-jira-workflow:expected-files-test` — old sub-script
- `test:e2e:demo-quick-jira-workflow:manual-disabled:default-project-root-test` — old disabled test

**Keep** (already added in RED phase):
- `test:e2e:cross-workspace-quick-jira-workflow`

---

## Step 8: Delete old files

- `src/demo/cli/quick-jira-workflow-demo-cli.ts`
- `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts`

---

## Step 9: Run `pnpm validate` (root project)

Note: No manual `pnpm install` needed for ts-workflow — the SKILL.md command includes `pnpm install --ignore-workspace` which runs automatically when the e2e test executes.

Verify typecheck, lint, format, and unit tests all pass after the file changes.

---

## Step 10: Run the e2e test

Run `pnpm test:e2e:cross-workspace-quick-jira-workflow` and verify it passes.

---

## Step 11: Run existing cross-workspace tests

The Jira says to run all 3 cross-workspace tests after updating the SKILL.md files:
- `pnpm test:e2e:cross-workspace-string-reversal`
- `pnpm test:e2e:cross-workspace-demo-math-workflow`

**NOTE**: These are e2e tests. Per the command instructions (Step 7b), for non-unit test types we should skip running the full suite and tell the user to run manually. I'll note this.

---

## Step 12: Documentation and output

Come back and re-read the command file for testing and documenting instructions (Steps 7-12 of the original command).

---

## Verification

1. `pnpm validate` passes (typecheck + lint + format + unit tests)
2. `pnpm test:e2e:cross-workspace-quick-jira-workflow` passes
3. Notify user to manually run other 2 cross-workspace tests if desired

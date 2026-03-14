# GREEN Phase Plan: AHQ-43 (e2e) - Full Jira TDD Workflow CLI Conversion

## Context

AHQ-43 converts the Full Jira TDD Story Workflow from a standalone demo CLI (`src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts`) to the cross-workspace plugin-based skill pattern established by AHQ-82. This allows developers to run the full TDD workflow from any workspace using the `agentic-hq` CLI. There is no automated test — this is a manual-testing-only Jira where the RED phase was skipped.

## Jira Requirements (Numbered)

1. Developer can run the full Agentic HQ TDD workflow from their own workspace using `agentic-hq` CLI → [Step 2: Create SKILL.md + ts-workflow CLI]
2. Follow the exact same pattern as AHQ-82 (quick workflow conversion) → [All steps follow quick-jira-workflow pattern]
3. Full workflow has 6 commands: 01, 02, 03, 04a, 04b, 05 → [Step 2: ts-workflow CLI with 6 commands]
4. REFACTOR split into analysis (04a) and execute (04b) → [Step 2: CLI loop body has 4 steps]
5. Final step is VALIDATE (05) not "transition to Done" → [Step 2: CLI runs 05 at end]
6. Remove `project-root` as a **parsed parameter** (not passed via buildVariablesString) → [Step 2: CLI buildVariablesString has no project-root] + [Step 3: Command files updated]
7. Retain `project-root` as a **self-determined variable** (Claude sets from CWD) → [Step 3: Command files keep `{project-root}` paths but change parse instruction]
8. Delete old demo CLI at `src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts` → [Step 4: Delete old CLI]
9. Update package.json scripts → [Step 5: Replace old script with new]
10. No automated test → N/A (manual verification only)

---

## Step 0: Copy This Approved Plan

Copy this approved plan to `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/jira-docs/AHQ-43/workflow-files/e2e-test-files/03-green-phase-implementation-plan-copy.md`

## Step 1: Create Skill Directory Structure

Create the skill directory at:
`.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/`

With subdirectory:
`.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/src/`

## Step 2: Create Skill Files (3 files)

### 2a: SKILL.md
Path: `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/SKILL.md`

Identical pattern to quick-jira-workflow SKILL.md but pointing to `full-jira-tdd-story-workflow-demo-cli.ts`.

### 2b: ts-workflow/package.json
Path: `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/package.json`

Same as quick-jira-workflow package.json but with name `agentic-hq-demo-full-jira-tdd-story-workflow`.

### 2c: ts-workflow/tsconfig.json
Path: `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/tsconfig.json`

Identical to quick-jira-workflow tsconfig.json.

### 2d: ts-workflow/src/full-jira-tdd-story-workflow-demo-cli.ts
Path: `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/src/full-jira-tdd-story-workflow-demo-cli.ts`

**This is essentially the existing `src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts` moved to its new location**, with these 4 tweaks to match the cross-workspace pattern:

1. **Import path**: `import { ClaudeCodeTool } from '../../tools/claude-code/ClaudeCodeTool.js'` → `import { ClaudeCodeTool } from 'agentic-hq/tools/claude-code'`
2. **Remove** `import { getCurrentWorkspaceRoot }` — no longer needed
3. **Remove** `--project-root` option from Commander program, remove `projectRoot` variable and `getCurrentWorkspaceRoot()` fallback
4. **Remove** `projectRoot` from `buildVariablesString()` — signature becomes `(jiraId, testType?)` and the string no longer includes `and project-root = ...`

Everything else stays the same: 6 command constants, loop structure (RED/GREEN/04a/04b), final VALIDATE step.

## Step 3: Update 6 Command Files

For each of the 6 command files in `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/`:

**Change**: Remove `project-root` as a parsed parameter, retain as a self-determined variable.

### What changes in each file:

**In Step 0a (Read Input) — change the example and Parse out list:**

From:
```
`Your variables for use in this command are jira-id = TEST-123 and project-root = /some/path`

Parse out:
- `jira-id` - the Jira ID (e.g. `TEST-123`)
- `project-root` - the absolute path to the project root directory
```

To (for files WITHOUT test-type: 01, 05):
```
`Your variables for use in this command are jira-id = TEST-123`

Parse out:
- `jira-id` - the Jira ID (e.g. `TEST-123`)
```

To (for files WITH test-type: 02, 03, 04a, 04b):
```
`Your variables for use in this command are jira-id = TEST-123 and test-type = unit`

Parse out:
- `jira-id` - the Jira ID (e.g. `TEST-123`)
- `test-type` - the test type (e.g. `unit` or `e2e`)
```

**In Step 0b (Establish Variables) — change project-root from parsed to self-determined:**

From:
```
project-root = (parsed from input file above)
```

To:
```
project-root = (your primary working directory)
```

All `{project-root}/...` path references throughout the file remain UNCHANGED.

### Files and their categories:
- **01-jira-read-and-question.md** — no test-type (jira-id only)
- **02-jira-write-failing-test.md** — has test-type
- **03-jira-minimal-implementation.md** — has test-type
- **04a-jira-refactor-analysis.md** — has test-type
- **04b-jira-refactor-execute.md** — has test-type
- **05-jira-validate.md** — no test-type (jira-id only)

## Step 4: Delete Old Demo CLI

Delete: `src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts`

## Step 5: Update package.json Scripts

In root `package.json`:

**Remove:**
```
"demo:full-jira-tdd-story-workflow": "tsx src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts",
```

**Add:**
```
"demo:plugin-direct:full-jira-tdd-story-workflow": "(cd .agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow && pnpm install --ignore-workspace) && .agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/node_modules/.bin/tsx --tsconfig .agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/tsconfig.json .agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/src/full-jira-tdd-story-workflow-demo-cli.ts",
```

## Step 6: Run `pnpm validate`

Run `pnpm validate` from the project root to verify typecheck + lint + unit tests all pass.

## Step 7: Come Back and Re-read the Command File

After completing all implementation, re-read the GREEN phase command instructions for testing and documentation steps (Steps 7-12).

---

## Verification

1. `pnpm validate` passes (typecheck + lint + 10+ unit tests)
2. Manual: Human verifies from a separate workspace using `agentic-hq --workflow-command-supplier=...`

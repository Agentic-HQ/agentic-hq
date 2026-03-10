# GREEN Phase Plan: AHQ-81 (e2e test)

## Context

The e2e test `cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` was created in the RED phase. It fails because the `agentic-hq-demos-plugin:math-workflow` skill doesn't exist yet. We need to create the math-workflow skill (following the string-reversal pattern exactly) so the test passes.

The test runs: `agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:math-workflow -- --input-number=11` from a temp workspace and expects `Output number: 5`.

## Jira Requirements (Numbered)

1. Math workflow skill returns command to run ts-workflow project -> [Step 2: Create SKILL.md]
2. ts-workflow mini-project chains 3 ClaudeCodeTool.execute() calls (x2, +3, /5) -> [Step 3: Create ts-workflow project]
3. `demo:math-workflow` replaced by `demo:plugin-direct:math-workflow` -> [Step 4: Update package.json]
4. Old e2e test replaced by cross-workspace test -> [Step 5: Delete old files]
5. Old direct demo CLI (`src/demo/cli/math-workflow-demo-cli.ts`) deleted -> [Step 5: Delete old files]
6. `test:e2e:demo-math-workflow` replaced with `test:e2e:cross-workspace-demo-math-workflow` -> Already done in RED phase (package.json already has this script)
7. Cross-workspace e2e test passes -> [Step 6: Verification]

## Steps

### Step 0: Copy this approved plan to workflow directory
Copy plan to `docs/jira-docs/AHQ-81/workflow-files/e2e-test-files/03-green-phase-implementation-plan-copy.md`

### Step 1: Create skill directory structure
Create: `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/`

### Step 2: Create SKILL.md
**File**: `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/SKILL.md`

Copy string-reversal's SKILL.md pattern exactly, changing only:
- `description`: "Returns the command to run the math-workflow TypeScript workflow"
- `base-command`: `pnpm install --ignore-workspace && pnpm demo:math-workflow`
- Output command: `cd {skill-base-dir}/ts-workflow && {base-command}`

### Step 3: Create ts-workflow mini-project

**3a. `ts-workflow/package.json`**
Copy string-reversal's package.json, changing:
- `name`: `agentic-hq-demo-math-workflow`
- `scripts.demo:math-workflow`: `tsx src/math-workflow-demo-cli.ts`
- Same dependencies: `agentic-hq: file:../../../../../..`, `tsx`, `commander`
- Same postinstall node-pty fix
- Same pnpm.onlyBuiltDependencies

**3b. `ts-workflow/tsconfig.json`**
Exact copy of string-reversal's tsconfig.json (identical config).

**3c. `ts-workflow/src/math-workflow-demo-cli.ts`**
Adapt from existing `src/demo/cli/math-workflow-demo-cli.ts` but:
- Change import from relative path to `'agentic-hq/tools/claude-code'`
- Keep the 3-step chain logic (x2 -> +3 -> /5)
- Keep `--input-number` option
- Keep `Output number: ${step3Result}` output format
- Update JSDoc to reference AHQ-81

### Step 4: Update package.json scripts
- Add: `demo:plugin-direct:math-workflow` script (bash -c cd to ts-workflow, pnpm install, pnpm demo:math-workflow)
- Change: `demo:math-workflow` to point to plugin-direct version OR remove old script
- Note: `test:e2e:cross-workspace-demo-math-workflow` already exists from RED phase

### Step 4b: Regenerate string-reversal ts-workflow lock file
Run `pnpm install --ignore-workspace` in `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/` to remove stale `cmd-ts` references from its `pnpm-lock.yaml` (leftover from before AHQ-77).

### Step 5: Delete old files
- Delete: `src/demo/cli/math-workflow-demo-cli.ts` (logic moved to plugin ts-workflow)
- Delete: `tests/e2e/demo/demo-math-workflow-gives-expected-output-number.e2e.test.ts` (replaced by cross-workspace test)
- Remove: `test:e2e:demo-math-workflow` script from package.json
- Remove: `demo:math-workflow` script from package.json (replaced by `demo:plugin-direct:math-workflow`)

### Step 6: Run the test
Run: `pnpm test:e2e:cross-workspace-demo-math-workflow`
Expect: Test passes with `Output number: 5`

### Step 7: Run pnpm validate
Run `pnpm validate` to ensure no type errors, lint issues, or test failures.

### Step 8: Come back and re-read the command file for testing and documenting instructions (Steps 7b, 7c, 8, 9, 10, 11, 12)

## Key Files to Create
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/SKILL.md`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/package.json`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/tsconfig.json`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.ts`

## Key Files to Modify
- `package.json` - Update scripts (add plugin-direct, remove old demo and old test scripts)

## Key Files to Delete
- `src/demo/cli/math-workflow-demo-cli.ts`
- `tests/e2e/demo/demo-math-workflow-gives-expected-output-number.e2e.test.ts`

## Pattern Reference
- String-reversal SKILL.md: `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/SKILL.md`
- String-reversal ts-workflow: `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/`
- Existing math demo CLI: `src/demo/cli/math-workflow-demo-cli.ts`

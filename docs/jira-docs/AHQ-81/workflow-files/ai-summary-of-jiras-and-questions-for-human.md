# AI Summary: AHQ-81

**Jira**: [AHQ-81](https://agentic-hq.atlassian.net/browse/AHQ-81)
**Title**: agentic-hq CLI Runs Maths Demo Workflow In Any Dev Workspace
**Status**: Transitioned to In Progress
**Generated**: 2026-03-09

---

## My Understanding of This Task

This Jira is a direct follow-on from AHQ-79 (cross-workspace string reversal) and AHQ-56 (original CLI). The goal is to make the **math workflow** (a 3-step chain: x2, +3, /5) work via the `agentic-hq` CLI from any developer workspace — exactly as string reversal already does.

Currently, the math workflow exists as a "legacy" direct demo CLI at `src/demo/cli/math-workflow-demo-cli.ts` that uses `tsx` to run and directly chains 3 `ClaudeCodeTool.execute()` calls. This needs to be converted to the plugin-bundled pattern established in AHQ-56/AHQ-79: a SKILL.md that returns a command string, a self-contained ts-workflow mini-project inside the plugin, and a cross-workspace e2e test that proves it works from a separate `/tmp` workspace via the globally-linked `agentic-hq` binary.

**By the end, three replacements happen:**
1. `demo:math-workflow` (runs tsx directly) -> `demo:plugin-direct:math-workflow` (runs the plugin's ts-workflow code directly, like `demo:plugin-direct:string-reversal`)
2. `demo-math-workflow-gives-expected-output-number.e2e.test.ts` -> `cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` (calls `agentic-hq` CLI cross-workspace)
3. `test:e2e:demo-math-workflow` -> `test:e2e:cross-workspace-demo-math-workflow`

**What's in scope:** Creating the math-workflow skill + ts-workflow project (following string-reversal pattern), updating package.json scripts, replacing the old e2e test with a cross-workspace one, and removing the old direct demo CLI.

**What's out of scope:** No changes to the CLI itself, no changes to AgenticHqConfig (already done in AHQ-79), no Verdaccio/publishing work.

## Research Findings

No external research needed. This is a mechanical adaptation of the string-reversal cross-workspace pattern (AHQ-56 + AHQ-79) to the math workflow. All patterns, infrastructure, and tooling already exist.

### Key Differences: Math Workflow vs String Reversal

The string reversal workflow is a **single-step** workflow (one `ClaudeCodeTool.execute()` call). The math workflow is a **3-step chain** (x2 -> +3 -> /5), where each step's output feeds into the next. The ts-workflow CLI for math will need to chain 3 calls, importing from `agentic-hq/tools/claude-code` (same as string-reversal).

The math workflow also takes `--input-number` instead of `--string-to-reverse`, and outputs `Output number: X` instead of `Reversed string: X`.

## Questions for Human

### Question 1: What happens to the old direct demo CLI?

The Jira says `demo:math-workflow` is "replaced by" `demo:plugin-direct:math-workflow`. Should I:
- **Delete** `src/demo/cli/math-workflow-demo-cli.ts` entirely (since its logic moves into the plugin's ts-workflow)?
- **Keep it** alongside the new approach?

I'm 95% sure "replaced" means delete, but want to confirm since the string-reversal equivalent (`src/demo/cli/string-reversal-demo-cli.ts`) appears to have already been removed in AHQ-56.

**Human's Response**:
> Yup, delete.

---

### Question 2: What happens to the old e2e test?

Similarly, the old `tests/e2e/demo/demo-math-workflow-gives-expected-output-number.e2e.test.ts` is "replaced with" the cross-workspace version. Should I delete the old test entirely, or keep it as a backward-compatibility test (similar to how `agentic-hq-cli-string-reversal.e2e.test.ts` was kept alongside `cross-workspace-string-reversal.e2e.test.ts` in AHQ-79)?

**Human's Response**:
> Yup, delete

---

### Question 3: Should there also be a same-workspace agentic-hq CLI test?

For string reversal, there are **two** e2e tests:
- `agentic-hq-cli-string-reversal.e2e.test.ts` — runs `node bin/agentic-hq.cjs` from within the repo
- `cross-workspace-string-reversal.e2e.test.ts` — runs `agentic-hq` from a temp workspace

Should math workflow also get both (a same-workspace test via `node bin/agentic-hq.cjs` AND a cross-workspace test)? Or is just the cross-workspace test sufficient since the same-workspace path is already proven by string reversal?

**Human's Response**:
> Good question.  From now on we'll just have the cross workspace test (including this one).

---

## Files I Reviewed

- `src/demo/cli/math-workflow-demo-cli.ts` — Current direct demo CLI that chains 3 ClaudeCodeTool calls (x2, +3, /5). This is the code whose logic needs to move into the plugin ts-workflow.
- `tests/e2e/demo/demo-math-workflow-gives-expected-output-number.e2e.test.ts` — Current e2e test using `pnpm demo:math-workflow --input-number=11`, expects output 5. Tests the old direct approach.
- `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` — The **pattern to follow**: runs install-dev-agentic-hq.sh, creates temp workspace, git init, sets up Claude permissions, runs `agentic-hq` CLI, asserts output + temp file creation. ~200 lines.
- `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts` — Same-workspace string reversal test using `node bin/agentic-hq.cjs`. Simpler pattern.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/SKILL.md` — Skill template that returns the command to run. Uses `disable-model-invocation: true`. Key pattern: writes `cd {skill-base-dir}/ts-workflow && pnpm install --ignore-workspace && pnpm demo:string-reversal` to command-output.json.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/package.json` — Mini pnpm project with `file:../../../../../..` dependency on agentic-hq, `demo:string-reversal` script, node-pty postinstall fix.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/src/string-reversal-demo-cli.ts` — Plugin-bundled CLI using `import { ClaudeCodeTool } from 'agentic-hq/tools/claude-code'`. Single execute call.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/math-workflow/times-two.md`, `plus-three.md`, `div-five.md` — The 3 Claude commands. Each reads input, does math, writes output, self-terminates. These don't change.
- `src/cli/agentic-hq-cli.ts` — The agentic-hq CLI entry point. Parses `--workflow-command-supplier`, gets command via skill, runs via PTY. No changes needed.
- `src/cli/command/workflow-command.ts` — Builds the final command by invoking the skill and appending passthrough args. No changes needed.
- `package.json` — Current scripts to rename/replace. Has `demo:math-workflow`, `test:e2e:demo-math-workflow`.
- `tests/e2e/helpers/cli-test-helper-functions.ts` — `runCliAndLogOutput()` helper with optional `workingDirectory` param. Already supports cross-workspace testing.

**Most important findings:**
- The math-workflow skill directory doesn't exist yet — it needs to be created from scratch following string-reversal's pattern
- The math workflow ts-workflow CLI will be a 3-step chain (vs string-reversal's 1-step), which is the key difference
- All infrastructure (CLI, ClaudeCodeTool, test helpers, install script) already exists from AHQ-56/AHQ-79
- The math workflow commands (times-two, plus-three, div-five) don't need any changes

## Test Types And Tests We Will Be Implementing

**Test types: `e2e`** (with full RED -> GREEN -> REFACTOR -> VALIDATE cycle)

### E2E Test: Cross-Workspace Math Workflow

**File**: `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts`

**Tests:**

1. **`should process input number through math workflow from a separate workspace via the globally-linked binary`**
   - Setup: Run `install-dev-agentic-hq.sh`, create temp workspace, git init, create `.claude/settings.local.json`
   - Run: `agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:math-workflow -- --input-number=11`
   - Assert: Output contains `Output number: 5` (11 x2=22, +3=25, /5=5)
   - Assert: `.agentic-hq/temp/command-input-output-files/` exists in temp workspace with expected files
   - Timeout: 120s (3 Claude invocations @ ~30s each, plus install overhead)

**Test infrastructure needed:**
- Math-workflow SKILL.md (returns `cd {skill-base-dir}/ts-workflow && pnpm install --ignore-workspace && pnpm demo:math-workflow`)
- Math-workflow ts-workflow mini project (package.json + src/math-workflow-demo-cli.ts)
- Updated package.json scripts

**Pattern follows**: `cross-workspace-string-reversal.e2e.test.ts` almost exactly, with math-specific constants (input number, expected output, timeouts, command args).

## Agreed Decisions

1. **Delete old demo CLI** (`src/demo/cli/math-workflow-demo-cli.ts`) — logic moves into plugin ts-workflow
2. **Delete old e2e test** (`demo-math-workflow-gives-expected-output-number.e2e.test.ts`) — replaced by cross-workspace test
3. **Cross-workspace test only** — no same-workspace test needed (going forward, only cross-workspace tests for new workflows)

## Ready for Next Step

All questions resolved, test types confirmed: **e2e**. This summary is complete.

# AI Summary: AHQ-82

**Jira**: [AHQ-82](https://agentic-hq.atlassian.net/browse/AHQ-82)
**Title**: agentic-hq CLI Runs Quick Demo TDD Workflow In Any Dev Workspace
**Status**: Transitioned to In Progress
**Generated**: 2026-03-11

---

## My Understanding of This Task

This Jira follows the exact same conversion pattern as [AHQ-81](https://agentic-hq.atlassian.net/browse/AHQ-81) (math workflow), but applied to the **Quick Jira Workflow**. The goal is to convert the quick-jira-workflow demo CLI (`src/demo/cli/quick-jira-workflow-demo-cli.ts`) from a "runs via tsx from within the repo" approach to the "runs via globally-linked agentic-hq CLI from any workspace" approach, with a cross-workspace e2e test.

The quick-jira-workflow is a multi-step TDD orchestrator: it reads a Jira, extracts test types, then loops over each test type doing RED -> GREEN -> REFACTOR, and finally transitions the Jira to Done. Unlike the math workflow (which chains 3 simple tool calls), this is a 5-command orchestration with a loop. However, the conversion pattern is identical: create a SKILL.md + ts-workflow mini-project inside the plugin, replace pnpm scripts, replace the e2e test with a cross-workspace version, and delete the old demo CLI.

**What's in scope:** Creating the quick-jira-workflow skill + ts-workflow project (following the pattern of math-workflow/string-reversal), updating package.json scripts, replacing the old e2e test with a cross-workspace one, adding MCP Atlassian permissions to the Claude settings, deleting the old demo CLI and test, and refactoring `CLAUDE_SETTINGS_PERMISSIONS` into a shared helper (as explicitly called out in the Jira).

**What's out of scope:** No changes to the agentic-hq CLI itself, no changes to the workflow commands (01-05 markdown files), no changes to AgenticHqConfig.

## Research Findings

No external research needed. This is a mechanical adaptation of the established cross-workspace pattern (AHQ-56 + AHQ-79 + AHQ-81) to the quick-jira-workflow.

### Key Differences: Quick Jira Workflow vs Math Workflow Conversion

The math workflow conversion was straightforward because:
- 3-step chain (x2, +3, /5), single ClaudeCodeTool execution flow
- No external service dependencies (no Jira, no MCP tools)
- Simple assertions (output number, IO files)

The quick-jira-workflow conversion has these **additional complexities**:

1. **Orchestration complexity**: The ts-workflow CLI must replicate the 5-command orchestration with a loop over test types — 8+ ClaudeCodeTool.execute() calls vs 3. The logic is: command 01 (read Jira, get test types) -> for each test type: command 02 (RED), 03 (GREEN), 04 (REFACTOR) -> command 05 (transition to Done).

2. **`AgenticHqConfig` dependency**: The old CLI uses `AgenticHqConfig.getCurrentWorkspaceRoot()` as a fallback when `--project-root` is omitted. However, `AgenticHqConfig` is **NOT exported** from the agentic-hq package (only `./tools/claude-code` is in `package.json` exports). Furthermore, since the ts-workflow runs from `{skill-base-dir}/ts-workflow` (inside the agentic-hq repo), git root detection would return the agentic-hq repo root, NOT the user's workspace. **Solution**: Make `--project-root` required in the ts-workflow CLI. The passthrough args from `agentic-hq` CLI supply it.

3. **MCP Atlassian permissions**: The workflow commands (01-05) use Jira MCP tools (get_issue, create_issue, add_comment, get_transitions, transition_issue, search, update_issue) and Confluence tools. The `.claude/settings.local.json` in the temp workspace must pre-approve all these tools. The Jira explicitly provides the permissions list.

4. **Test setup complexity**: The test must create a test Jira before running the workflow (async ClaudeCodeTool.execute()) and verify Jira status after. Math/string-reversal tests had no such setup.

5. **Timeout**: The old test uses 20 minutes (1,200,000ms). Cross-workspace adds install overhead. Should be ~25 minutes.

6. **CLAUDE_SETTINGS_PERMISSIONS refactoring**: The Jira explicitly says to refactor this into a shared `ClaudeSettingsTestHelper` during the REFACTOR phase, since 3 tests now need it.

## Questions for Human

### Question 1: Delete old demo CLI and old e2e test?

Same as AHQ-81: the Jira says "converting" the quick-jira-workflow. I'm 99% sure this means delete `src/demo/cli/quick-jira-workflow-demo-cli.ts` and `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts` (logic moves to plugin ts-workflow and cross-workspace test respectively).

Confirmed by AHQ-81 precedent where both were deleted.

**Human's Response**:
> Yes

---

### Question 2: Drop the disabled manual test (AHQ-40)?

The old test has a `test.runIf` disabled variant that tests omitting `--project-root` (auto-detects git root). In the cross-workspace pattern, this feature **cannot work correctly** because:
- The ts-workflow CLI runs from `{skill-base-dir}/ts-workflow` (inside agentic-hq repo)
- Git root detection from there returns the agentic-hq repo root, NOT the user's workspace
- `AgenticHqConfig` is not exported from the package

So `--project-root` must always be explicitly provided for cross-workspace usage. I propose dropping this disabled test variant entirely.

**Human's Response**:
> Yes (but see details below)

---

### Question 3: What pnpm script name for the cross-workspace e2e test?

Following the AHQ-81 pattern, I'd name it: `test:e2e:cross-workspace-quick-jira-workflow`

The test file would be: `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts`

And the sub-scripts (`expected-files-test`, `manual-disabled:default-project-root-test`) would be dropped since:
- There's only one test case now (no need for a specific test selector)
- The disabled manual test is dropped per Question 2

Is this naming right?

**Human's Response**:
> Yes

---

### Additional Section From Human About quick-jira-workflow-demo-cli.ts And quick-jira-workflow-produces-expected-files.e2e.test.ts

In the above you said:

**Solution**: Make `--project-root` required in the ts-workflow CLI. The passthrough args from `agentic-hq` CLI supply it.

I'm not sure, but I think a simpler solution that may work is to ditch --project-root altogether?

--project-root was only there so that in:

src/demo/cli/quick-jira-workflow-demo-cli.ts

we could specify a temp project directory **inside** the AHQ where we want the project work to happen:

/** Generates a unique test project root directory path with timestamp and UUID */
function createTestProjectRootPath(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace('T', '_').replace(/:/g, '-').slice(0, 19);
  const uniqueId = crypto.randomUUID();
  return path.join(TEST_PROJECT_ROOT_BASE, `project-root_${timestamp}_${uniqueId}`);
}

Now we are *always* running this workflow in a separate, temporary dedicated workspace (either in the e2e test where we create a tmp test workspace, or the user running in this in their own workspace) this is no longer needed.

This means we should **also** remove the need to pass a project root to the commands in:

.agentic-hq/plugins/agentic-hq-demos-plugin/commands/quick-jira-workflow/

because they will (by default) always just work in whatever project they are in (that's how Claude works normally).

This means the commands where they specify:

{project-root}/

in a path that should be replace with nothing, so the path is relative the project root.

And where it says:

Write all implementation files relative to `{project-root}`.
and:
Write all test files relative to `{project-root}`.

it should say:

Write all implementation files relative to the project root.
and:
Write all test files relative to the project root.

(because Claude will know where the project root is and do this by default)

This whole thing should lead to a simpler buildVariablesString function, less tests, less pnpm command and much simpler, clearer code.

Please let me know if this all makes sense, and once we have discussed it please put a new 

## Jira Subsection About Getting Rid Of project-root Parameter Etc For Human To Add To Jira

_The following section is formatted for pasting into the Jira description:_

---

### Simplification: Remove `--project-root` Parameter

During the Read & Question phase, we discovered that `--project-root` is no longer needed. It only existed so the old demo CLI could target a temp directory **inside** the agentic-hq repo. Now that we always run in a separate workspace (either a temp workspace in the e2e test, or the user's own workspace), Claude Code naturally works relative to the project it's running in.

**What changes:**

1. **SKILL.md uses subshell install pattern** — The existing SKILL.md pattern (`cd ts-workflow && install && run`) causes the ts-workflow CLI to run from inside the agentic-hq repo, which makes ClaudeCodeTool detect the wrong workspace. The fix uses a subshell for install so the CLI runs from the user's CWD:

   ```
   # Old pattern (math-workflow, string-reversal):
   cd {skill-base-dir}/ts-workflow && pnpm install --ignore-workspace && pnpm demo:math-workflow

   # New pattern (quick-jira-workflow):
   (cd {skill-base-dir}/ts-workflow && pnpm install --ignore-workspace) && {skill-base-dir}/ts-workflow/node_modules/.bin/tsx --tsconfig {skill-base-dir}/ts-workflow/tsconfig.json {skill-base-dir}/ts-workflow/src/quick-jira-workflow-demo-cli.ts
   ```

   The parentheses keep the `cd` in a subshell. tsx runs from the user's CWD. The `--tsconfig` flag is required because tsx/TypeScript resolves `tsconfig.json` from CWD (not the script's directory), so we must point it explicitly. Node module resolution is fine — it resolves from the script file's directory.

2. **ts-workflow CLI** — No `--project-root` parameter, no `AgenticHqConfig` import. Just `--jira-id` (required) and optionally `--test-type`. ClaudeCodeTool auto-detects the correct workspace via `git rev-parse --show-toplevel` from the user's CWD.

3. **Command files (01-05.md)** — Remove `project-root` from variable parsing. Replace `{project-root}/` path prefixes with nothing (relative paths). Replace "Write all implementation files relative to `{project-root}`" with "Write all implementation files relative to the project root." Claude naturally works relative to the project root.

4. **`buildVariablesString` simplified** — Only passes `jira-id` and optionally `test-type`:
   ```typescript
   // Old:
   `Your variables for use in this command are jira-id = ${jiraId} and project-root = ${projectRoot}`
   // New:
   `Your variables for use in this command are jira-id = ${jiraId}`
   ```

5. **E2e test simplified** — No `--project-root` in the agentic-hq CLI command. No `createTestProjectRootPath()`. The temp workspace IS the project root.

6. **pnpm scripts simplified** — `demo:plugin-direct:quick-jira-workflow` uses the new subshell pattern. No `--project-root` to pass.

**Evidence this is needed (verified manually):** When running `agentic-hq` from `/tmp/tmp-Steve-Workspace-001`, the first Claude invocation (SKILL.md) correctly uses the tmp workspace, but the second Claude invocation (from the ts-workflow CLI) uses `~/dev/agentic-hq/agentic-hq` as its project root — because the `cd` in the SKILL.md command changed the CWD to the ts-workflow dir inside the agentic-hq repo.

**Proof-of-concept test (string-reversal, reverted after testing):**

We temporarily applied the subshell pattern to the string-reversal SKILL.md and tested from `/tmp/tmp-Steve-Workspace-001`:

- **First attempt** used `--project` flag (a `tsc` flag): `bad option: --project` error from tsx
- **Second attempt** used `--tsconfig` flag (the correct `tsx` flag): **SUCCESS**
- Claude's first invocation (SKILL.md) correctly detected `/private/tmp/tmp-Steve-Workspace-001` as primary working directory
- Claude's second invocation (reverse-a-string command) also correctly detected `/private/tmp/tmp-Steve-Workspace-001` as primary working directory (confirmed by interrupting and asking)
- The full workflow completed successfully, producing the reversed string output
- **Key learning**: The tsx flag is `--tsconfig`, NOT `--project`

The SKILL.md change was reverted after confirming the pattern works. The quick-jira-workflow will use this proven pattern.

### Also fix existing string-reversal and math-workflow SKILLs

The CWD bug affects **all** skills that use `cd {skill-base-dir}/ts-workflow && ...`, not just quick-jira-workflow. The existing string-reversal and math-workflow SKILLs have the same problem — they just don't notice it because their workflows don't depend on being in the user's workspace (they only do simple string/number operations).

However, it's the right thing to fix all three at once so the pattern is consistent and correct. During implementation we should:

1. **Update `string-reversal/SKILL.md`** — Apply the proven subshell + `--tsconfig` pattern
2. **Update `math-workflow/SKILL.md`** — Apply the same pattern
3. **Create `quick-jira-workflow/SKILL.md`** — Use the new pattern from the start
4. **Run all 3 cross-workspace e2e tests** at the end of implementation to confirm nothing is broken:
   - `test:e2e:cross-workspace-string-reversal`
   - `test:e2e:cross-workspace-math-workflow`
   - `test:e2e:cross-workspace-quick-jira-workflow` (new)

---


## Files I Reviewed

- `src/demo/cli/quick-jira-workflow-demo-cli.ts` — The current demo CLI that orchestrates the 5-command quick jira workflow. This is the code whose logic needs to move into the plugin ts-workflow. Key: it imports AgenticHqConfig for fallback project root detection, and uses buildVariablesString() to pass params to commands.

- `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts` — Current e2e test that creates a test Jira, runs the workflow via `pnpm demo:quick-jira-workflow`, asserts workflow output files + implementation files + Jira status Done. Has a disabled manual variant for AHQ-40.

- `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` — The **cross-workspace pattern to follow**: install script, temp workspace, git init, Claude permissions, runs `agentic-hq` CLI, asserts output. This is the template for our new test, with additions for MCP permissions, Jira creation, file assertions, and Jira status check.

- `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` — Another cross-workspace reference with identical setup pattern. Both have `CLAUDE_SETTINGS_PERMISSIONS` with only `Write` — we'll need to extend this.

- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/SKILL.md` — Skill template pattern: returns `cd {skill-base-dir}/ts-workflow && pnpm install --ignore-workspace && pnpm demo:math-workflow`. Quick-jira-workflow SKILL.md follows this exactly.

- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/package.json` — Mini-project pattern: `link:../../../../../..` dependency on agentic-hq, tsx, commander, postinstall for node-pty fix.

- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.ts` — Plugin-bundled CLI pattern using `import { ClaudeCodeTool } from 'agentic-hq/tools/claude-code'`. Quick-jira-workflow ts-workflow follows this but with 5-command orchestration + loop.

- `src/cli/agentic-hq-cli.ts` — The agentic-hq CLI entry point. Runs with `cwd: process.cwd()` but the skill command `cd`s to ts-workflow dir. Confirms --project-root must be explicit.

- `src/cli/command/workflow-command.ts` — Builds final command by invoking skill + appending passthrough args. Confirms --jira-id and --project-root get passed through.

- `src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts` — The FULL workflow CLI (separate from quick). Similar pattern but with REFACTOR-analysis/execute split and VALIDATE. NOT being converted in this Jira.

- `package.json` — Current scripts including `demo:quick-jira-workflow`, `test:e2e:demo-quick-jira-workflow`, etc. that need replacing.

- `tests/e2e/helpers/cli-test-helper-functions.ts` — `runCliAndLogOutput()` helper with optional `workingDirectory` param. Already supports cross-workspace testing.

- `docs/jira-docs/AHQ-81/workflow-files/ai-summary-of-jiras-and-questions-for-human.md` — AHQ-81 summary showing the conversion decisions made (delete old CLI, delete old test, cross-workspace only going forward).

- `docs/jira-docs/AHQ-81/workflow-files/e2e-test-files/03-green-phase-summary-of-what-was-implemented.md` — AHQ-81 GREEN phase showing exact files created/modified/deleted during math workflow conversion.

- `docs/jira-docs/AHQ-81/workflow-files/e2e-test-files/04b-refactor-phase-complete.md` — AHQ-81 REFACTOR phase showing extracted constants and TSDoc additions.

**Most important findings:**
- The quick-jira-workflow skill directory doesn't exist yet — needs creating from scratch following math-workflow pattern
- The ts-workflow CLI will be significantly more complex than math-workflow's (5 commands with loop vs 3 simple calls)
- `--project-root` must be required (no AgenticHqConfig export, wrong git root from ts-workflow dir)
- MCP Atlassian permissions are needed in the temp workspace's Claude settings
- The CLAUDE_SETTINGS_PERMISSIONS refactoring into ClaudeSettingsTestHelper is explicitly called out in the Jira for REFACTOR phase

## Test Types And Tests We Will Be Implementing

**Test types: `e2e`** (with full RED -> GREEN -> REFACTOR -> VALIDATE cycle)

### E2E Test: Cross-Workspace Quick Jira Workflow

**File**: `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts`

**Tests:**

1. **`should implement a test Jira and produce expected files from a separate workspace via the globally-linked binary`**
   - **Arrange**: Run `install-dev-agentic-hq.sh` to globally link the binary
   - **Arrange**: Create temp workspace at `/tmp/agentic-hq-test-workspaces/test-ws-{uuid}/`
   - **Arrange**: Run `git init` in temp workspace
   - **Arrange**: Create `.claude/settings.local.json` with extended permissions (Write + all MCP Atlassian tools)
   - **Arrange**: Create test Jira via `ClaudeCodeTool.execute(CREATE_TEST_JIRA_COMMAND, ...)` (async)
   - **Act**: Run `agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:quick-jira-workflow -- --jira-id={testJiraId} --project-root={tempWorkspace}`
   - **Assert**: Workflow output files exist at `{tempWorkspace}/docs/jira-docs/{testJiraId}/workflow-docs/`:
     - `01-entire-jira-copy-of-details.md`
     - `01-summary-of-jira.md`
     - `unit-test-files/02-RED-write-failing-test.summary.md`
     - `unit-test-files/03-GREEN-minimal-implementation.summary.md`
     - `unit-test-files/04-REFACTOR.summary.md`
     - `e2e-test-files/02-RED-write-failing-test.summary.md`
     - `e2e-test-files/03-GREEN-minimal-implementation.summary.md`
     - `e2e-test-files/04-REFACTOR.summary.md`
   - **Assert**: Implementation files exist at `{tempWorkspace}/src/temp-test-hello-world.ts` and `{tempWorkspace}/src/temp-test-hello-world.cli.ts`
   - **Assert**: Jira status is `Done` (via `ClaudeCodeTool.execute(GET_JIRA_STATUS_COMMAND, ...)`)
   - **Timeout**: 1,500,000ms (25 minutes — 20 min base workflow + install overhead + API latency buffer)

**Test infrastructure needed (created in GREEN phase):**
- `quick-jira-workflow/SKILL.md` — Returns command: `cd {skill-base-dir}/ts-workflow && pnpm install --ignore-workspace && pnpm demo:quick-jira-workflow`
- `quick-jira-workflow/ts-workflow/package.json` — Mini pnpm project with `link:../../../../../..` dep on agentic-hq
- `quick-jira-workflow/ts-workflow/tsconfig.json` — TypeScript config
- `quick-jira-workflow/ts-workflow/src/quick-jira-workflow-demo-cli.ts` — Orchestration CLI: parses --jira-id + --project-root (both required), executes 5 commands with loop over test types
- Updated `package.json` scripts (add `demo:plugin-direct:quick-jira-workflow`, `test:e2e:cross-workspace-quick-jira-workflow`; remove old scripts)

**Pattern follows**: `cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` for setup/teardown structure, combined with `quick-jira-workflow-produces-expected-files.e2e.test.ts` for assertion logic (workflow files + implementation files + Jira status).

## Ready for Next Step

Awaiting human responses to questions, then test types will be confirmed and this summary will be complete.

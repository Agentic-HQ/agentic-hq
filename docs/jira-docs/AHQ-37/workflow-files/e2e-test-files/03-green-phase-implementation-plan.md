# GREEN Phase Implementation Plan: AHQ-37 (e2e test)

## Context

AHQ-37 is the "Simplest Possible Single Step Hello World Jira Workflow Demo CLI". The RED phase is complete - we have a failing e2e test at `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts` that fails because `pnpm demo:quick-jira-workflow` doesn't exist. This plan covers the minimal GREEN phase implementation to make the test pass.

---

## Jira Requirements (Numbered)

1. Demo CLI location: `src/demo/cli/quick-jira-workflow-demo-cli.ts` → [Step 2: Create demo CLI]
2. CLI accepts `--jira-id` option (kebab-case) → [Step 2: Create demo CLI]
3. CLI accepts `--project-root` option (kebab-case) → [Step 2: Create demo CLI]
4. CLI uses `ClaudeCodeTool` to execute single workflow command → [Step 2: Create demo CLI]
5. CLI passes variables as plain English string: `"Your variables for use in this command are jiraId = <jiraId> and projectRoot = <projectRoot>"` → [Step 2: Create demo CLI]
6. CLI defaults projectRoot to git root (recursive .git search) → N/A for this cycle. **Decision**: Skip for e2e GREEN phase (test always provides `--project-root`). Will be implemented in a separate "manual" test type RED-GREEN-REFACTOR cycle, where AHQ-36 AC2 (manual human test that runs CLI without `--project-root`) drives the implementation.
7. Workflow command location: `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/01-read-jira-implement-and-mark-as-done.md` → [Step 3: Create workflow command]
8. Workflow command reads Jira via jira-verbatim-content-extractor sub-agent → [Step 3: Create workflow command]
9. Workflow command does work relative to projectRoot → [Step 3: Create workflow command]
10. Workflow command sets `jira-workflow-files-directory = {projectRoot}/docs/jira-docs/{jiraId}/workflow-docs` → [Step 3: Create workflow command]
11. Workflow command writes summary doc at `{jira-workflow-files-directory}/01-read-jira-implement-and-mark-as-done.summary.md` → [Step 3: Create workflow command]
12. Workflow command transitions Jira to Done → [Step 3: Create workflow command]
13. pnpm script `demo:quick-jira-workflow` runs the CLI → [Step 1: Add pnpm script]
14. Command-line args use kebab case, internal variables use camelCase → [Steps 2, 3]
15. Workflow command writes `command-output.json` (required by ClaudeCodeTool) → [Step 3: Create workflow command]
16. Workflow command self-terminates → [Step 3: Create workflow command]
17. Workflow is non-interactive (zero human interaction) → [Step 3: Create workflow command]
18. **AC1**: E2E test passes (`pnpm test:e2e:demo-quick-jira-workflow`) → [Verification]

---

## Implementation Steps

### Step 0: Copy this approved plan to `docs/jira-docs/AHQ-37/workflow-files/e2e-test-files/03-green-phase-implementation-plan.md`

Before proceeding with any implementation.

### Step 1: Add `demo:quick-jira-workflow` pnpm script to `package.json`

Add to the `// CLI COMMANDS` section:
```json
"demo:quick-jira-workflow": "tsx src/demo/cli/quick-jira-workflow-demo-cli.ts"
```

**Pattern**: Same as existing `"demo:math-workflow": "tsx src/demo/cli/math-workflow-demo-cli.ts"`

### Step 2: Create demo CLI at `src/demo/cli/quick-jira-workflow-demo-cli.ts`

**Pattern to follow**: `src/demo/cli/math-workflow-demo-cli.ts` (lines 1-40)

The CLI will:
- Use Commander.js (already a dependency)
- Accept `--jira-id <string>` (required option)
- Accept `--project-root <string>` (required option - not implementing default git root since test always provides it)
- Instantiate `ClaudeCodeTool` (from `../../tools/claude-code/ClaudeCodeTool.js`)
- Execute the workflow command: `/agentic-hq-commands:used-in-demos:quick-jira-workflow:01-read-jira-implement-and-mark-as-done`
- Pass variables as plain English string per Req #5

**Note on `--project-root` default**: The Jira says it should default to git root, but the e2e test always provides `--project-root` explicitly. Per strict TDD GREEN phase rules, we make it required (no default). The git root default will be implemented in a separate "manual" test type cycle driven by AHQ-36 AC2 (which runs the CLI without `--project-root`).

### Step 3: Create workflow custom command at `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/01-read-jira-implement-and-mark-as-done.md`

**Patterns to follow**:
- `create-test-jira.md` (file I/O pattern, self-termination)
- `times-two.md` (command-input-output-files-directory pattern)

This is a markdown instruction file for Claude. **All variables inside the command use camelCase** (new convention from this Jira onwards, per Jira note on camelCase vs kebab-case).

Variable: `commandInputOutputFilesDirectory` = $0

It instructs Claude to:

1. **Read input**: Read `{commandInputOutputFilesDirectory}/command-input.json`, extract `command-input-string`
2. **Parse variables**: Extract `jiraId` and `projectRoot` from the plain English string
3. **Read Jira**: Use the jira-verbatim-content-extractor sub-agent (Task tool) to read the Jira at `https://agentic-hq.atlassian.net/browse/{jiraId}`
4. **Implement Jira instructions**: Do whatever the Jira says, creating files relative to `{projectRoot}`
5. **Set variables**: `jiraWorkflowFilesDirectory` = `{projectRoot}/docs/jira-docs/{jiraId}/workflow-docs`, `summaryDocFilename` = `{jiraWorkflowFilesDirectory}/01-read-jira-implement-and-mark-as-done.summary.md`
6. **Write summary doc**: Create directory and write summary at `{summaryDocFilename}`
7. **Transition Jira to Done**: Use Jira MCP tools (`jira_get_transitions` then `jira_transition_issue`)
8. **Write output**: Write `command-output.json` to `{commandInputOutputFilesDirectory}` with completion message
9. **Self-terminate**: Run `./tools/scripts/process-control/unix/kill-current-cli-process.sh $PPID`

### Step 4: Verification

Re-read the GREEN phase command file (steps 7-10) for testing and documenting instructions:
- Run `pnpm test:e2e:demo-quick-jira-workflow` (Step 7 - specific test)
- Run `pnpm test:e2e` (Step 7b - all e2e tests)
- Check for manual acceptance tests (Step 7c)
- Create GREEN phase summary document (Step 8)
- Add Jira comment (Step 9)
- Present to human (Step 10)

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| Modify | `package.json` | Add `demo:quick-jira-workflow` script |
| Create | `src/demo/cli/quick-jira-workflow-demo-cli.ts` | Demo CLI |
| Create | `.claude/commands/agentic-hq-commands/used-in-demos/quick-jira-workflow/01-read-jira-implement-and-mark-as-done.md` | Workflow custom command |

## Existing Code to Reuse

- `ClaudeCodeTool` from `src/tools/claude-code/ClaudeCodeTool.ts` - used by the CLI
- `Commander` from `commander` package - CLI argument parsing
- CLI pattern from `src/demo/cli/math-workflow-demo-cli.ts`
- Custom command pattern from `.claude/commands/agentic-hq-commands/used-in-demos/math-workflow/times-two.md` and `.claude/commands/agentic-hq-commands/used-in-tests/jira-helper-commands/create-test-jira.md` — **WARNING**: These older commands use kebab-case variables (e.g. `command-input-output-files-directory`). Our new command uses camelCase (e.g. `commandInputOutputFilesDirectory`). Follow the pattern structure but use camelCase for all variable names.
- Self-termination script: `./tools/scripts/process-control/unix/kill-current-cli-process.sh`

## TODO

After implementation (Step 4), come back and re-read the original `/agentic-hq-commands:workflow:jira-story-workflow:03-jira-minimal-implementation` command file for the full testing and documenting instructions (Steps 7-10).

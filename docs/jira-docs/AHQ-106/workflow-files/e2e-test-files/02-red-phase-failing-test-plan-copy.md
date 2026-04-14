# RED Phase Plan: AHQ-106 (e2e test)

## Context

AHQ-106 completes dynamic workflow discovery. The unit test phase built and tested the full subsystem (142 tests pass): `WorkflowSearchResultsImpl` → `Workspace` → `Plugin` → `AhqWorkflow` discovery chain, plus `WorkflowRegistryImpl` for Commander subcommand registration. But the CLI entry point still uses the old `DEMO_SKILLS` + `WorkflowSkillsRegistry` stack for short-alias subcommands. The e2e RED phase writes a test that proves user workspace workflows are discovered in listings (already works) AND can be executed via short alias (doesn't work yet — drives GREEN).

## Step 0: Copy this approved plan to workflow directory

Copy to `docs/jira-docs/AHQ-106/workflow-files/e2e-test-files/02-red-phase-failing-test-plan-copy.md`

## Step 1: Create fixture files

Create `tests/e2e/fixtures/string-reversal-copy-for-test/` with the plugin structure that will be copied into temp workspaces during tests.

**Directory layout:**
```
tests/e2e/fixtures/string-reversal-copy-for-test/
├── .claude-plugin/
│   └── plugin.json                    — Test plugin metadata
├── commands/
│   └── string-reversal-copy-for-test/
│       └── reverse-a-string.md        — Claude command that reverses a string
├── skills/
│   └── string-reversal-copy-for-test/
│       ├── ahq-workflow.json          — Workflow metadata for discovery
│       ├── SKILL.md                   — Returns ts-workflow run command
│       └── ts-workflow/
│           ├── package.json           — Dependencies (agentic-hq link: placeholder)
│           ├── tsconfig.json          — TypeScript config
│           └── src/
│               └── string-reversal-demo-cli.ts  — CLI that reverses a string
```

**Key decisions:**
- `ahq-workflow.json`: `shortId` = `"string-reversal-copy-for-test"`, `pluginId` = `"agentic-hq-temp-e2e-test-plugin"`
- `ts-workflow/package.json`: Uses `"agentic-hq": "link:REPO_ROOT_PLACEHOLDER"` — test patches this dynamically with the real `REPO_ROOT` absolute path after copying to temp workspace
- `string-reversal-demo-cli.ts`: References `/agentic-hq-temp-e2e-test-plugin:string-reversal-copy-for-test:reverse-a-string` as the reverse command (self-contained within the test plugin)
- `reverse-a-string.md`: Identical to the existing one in `agentic-hq-demos-plugin/commands/string-reversal/reverse-a-string.md`
- Fixture stored separately per Jira requirement ("seems better than relying on copying from the 'real' demo place")

**Files to base fixtures on (originals):**
- `plugin.json`: Based on `.agentic-hq/plugins/agentic-hq-demos-plugin/.claude-plugin/plugin.json`
- `ahq-workflow.json`: Based on `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ahq-workflow.json`
- `SKILL.md`: Based on `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/SKILL.md`
- `reverse-a-string.md`: Copy of `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/string-reversal/reverse-a-string.md`
- `ts-workflow/*`: Based on `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/*`

## Step 2: Write the test file

Create `tests/e2e/demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts`

**Structure:**
```typescript
describe('User Workspace Workflow Discovery and Execution via globally-linked agentic-hq binary', () => {
  // Constants: timeouts, paths, test data
  // LISTING_TIMEOUT_MS = 60_000 (no Claude invocation, same as existing list test)
  // EXECUTION_TIMEOUT_MS = 300_000 (Claude invocation, same as existing reversal test)

  // Shared setup (beforeAll or inline per test):
  // 1. Run install-dev-agentic-hq.sh
  // 2. Ensure pnpm global bin on PATH
  // 3. Create temp workspace at /tmp/agentic-hq-test-workspaces/test-ws-{uuid}/
  // 4. git init in temp workspace
  // 5. Copy fixture files to <tempWorkspace>/.agentic-hq/plugins/agentic-hq-temp-e2e-test-plugin/
  // 6. Patch ts-workflow/package.json: replace REPO_ROOT_PLACEHOLDER with real REPO_ROOT

  it('should list user workspace workflow when running agentic-hq list from that workspace', () => {
    // Act: runCliAndLogOutput('agentic-hq list', ..., LISTING_TIMEOUT_MS, tempWorkspace)
    // Assert: output contains 'string-reversal-copy-for-test'
    // Assert: output contains 'agentic-hq-temp-e2e-test-plugin'
    // Assert: output contains 'Local Workspace'
  }, LISTING_TIMEOUT_MS);

  it('should execute user workspace workflow via short alias subcommand', () => {
    // Act: runCliAndLogOutput('agentic-hq string-reversal-copy-for-test -- --string-to-reverse="user workspace e2e test"', ..., EXECUTION_TIMEOUT_MS, tempWorkspace)
    // Assert: output contains 'tset 2ee ecapskrow resu' (reversed string)
  }, EXECUTION_TIMEOUT_MS);
});
```

**Reuses:** `runCliAndLogOutput` from `tests/e2e/helpers/cli-test-helper-functions.ts`
**Follows patterns from:** `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts`

## Step 3: Add package.json script

Add to `package.json`:
```json
"test:e2e:user-workspace-workflows": "vitest run --config vitest.e2e.config.ts tests/e2e/demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts"
```

## Step 4: Run the test (expect failure)

Run: `pnpm test:e2e:user-workspace-workflows`

**Expected results:**
- Listing test: **PASSES** — dynamic discovery already works (unit test phase built the subsystem)
- Execution test: **FAILS** — Commander doesn't know `string-reversal-copy-for-test` (not in `DEMO_SKILLS`); falls through to main action which errors: "Error: --workflow-command-supplier is required when not using a subcommand."

This is a valid RED: execution test fails because the CLI wiring (Refactor 2.5 from unit REFACTOR) hasn't been done yet.

## Step 5: Run `pnpm typecheck`

Verify the test file has no TypeScript errors. Expected: clean (test file uses standard vitest + node imports).

## Step 6: Create RED phase document

Write `docs/jira-docs/AHQ-106/workflow-files/e2e-test-files/02-red-phase-failing-tests.md`

## Step 7: Add Jira comment

## Step 8: Present to human

## Step 9: Write command output file

## Step 10: Recheck all steps from the 02-jira-write-failing-test command have been executed

## Step 11: Self-terminate

---

## English Language Description

When the user runs `agentic-hq list` from their workspace, the binary sets `AGENTIC_HQ_WORKSPACE_ROOT` to the AHQ repo root, then the CLI asks a **WorkflowSearchResultsImpl** to *getWorkflowsListingString*. The **WorkflowSearchResultsImpl** asks each **Workspace** to *getWorkflowListingString*. The **AhqWorkspaceImpl** reads the env var, creates a **WorkspaceImpl** with that root, and delegates. The **CurrentUserWorkspaceImpl** checks if `process.cwd()` matches the env var — if different (as in our temp workspace), it creates a **WorkspaceImpl** with `process.cwd()` as root and delegates. Each **WorkspaceImpl** scans `.agentic-hq/plugins/` for directories, creates a **PluginImpl** for each, and asks it to *getPluginListingString*. Each **PluginImpl** creates a **PluginDirectoryImpl** and asks it to *findWorkflowFiles*, then creates an **AhqWorkflowImpl** for each and asks it to *getWorkflowListingEntryString*. The listing shows both workspaces' workflows grouped by plugin.

When the user runs `agentic-hq string-reversal-copy-for-test -- --string-to-reverse="test"`, the CLI currently falls through to the main action (which requires `--workflow-command-supplier`) because `string-reversal-copy-for-test` is NOT a registered subcommand. After GREEN wires `registerWorkflowsWith()` into `createProgram()`, the **WorkflowSearchResultsImpl** will ask each **Workspace** to *registerWorkflowsWith* a **WorkflowRegistryImpl**. Each **Workspace** chains through its **Plugin**s, which call *register* on the **WorkflowRegistryImpl** for each **AhqWorkflow**. The **WorkflowRegistryImpl** registers a Commander subcommand using the workflow's *getShortName*, *getDescription*, *getFullClaudeSkillCommand*, and *getPluginDirectory*. When the subcommand matches, the action calls `builder.build(fullCommand, args, pluginDir)`.

## Project Design Requirements Compliance

- **DR.1 (class/interface pairs)**: Test imports and validates behavior through the full object chain; fixture `ahq-workflow.json` drives `AhqWorkflowImpl` creation
- **DR.3 (minimal state, delegation)**: E2e test validates the delegation chain end-to-end — listing output proves `WorkflowSearchResults` → `Workspace` → `Plugin` → `AhqWorkflow` delegation works with real files
- **DR.5 (switchability)**: Tests validate the subsystem works through its public interface (`agentic-hq list` CLI output); the internal wiring is transparent to the user
- **DR.7 (balance)**: Test validates the 4-level hierarchy produces correct output format (workspace headers, plugin headers, workflow entries)
- State management and no-caching (DR.3) validated at unit test level, not directly testable at e2e level
- The execution test drives implementation of the `registerWorkflowsWith()` wiring (Refactor 2.5) which is the key missing piece for DR.5 switchability of the subcommand registration

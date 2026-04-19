# Plan: AHQ-91 — e2e RED Phase (Delete `git init` Setup From 5 Cross-Workspace Tests)

## Context

We are at the **e2e RED phase** of AHQ-91 (Remove Git Root Directory Checking And Refactor Workspace Classes). The unit cycle is already complete (RED → GREEN → REFACTOR → VALIDATE, 140 tests green).

Per the Testing Plan the human wrote into the Jira, **no new e2e tests are written in this RED phase**. Instead, we **delete** the `execSync('git init', ...)` setup line (and its preceding inline comment) from each of the **5 existing cross-workspace e2e tests**. That's the RED action — the code under test (`DefaultGitWorkspace`) is still live, so with no `.git/` directory in the tmp workspaces those tests now fail at CLI startup with `NotInGitWorkspaceError`. That's a genuine failing-test state that the e2e GREEN phase will then resolve.

Authoritative references:
- Testing Plan with the 5 files + exact line numbers: AHQ-91 description (reproduced in `ai-summary-of-jiras-and-questions-for-human.md`, line 305+).
- Scope handoff section (unit vs. e2e ownership): same summary file, "IMPORTANT: Scope Handoff — What Belongs to the e2e REFACTOR Phase", line 50+.
- Why RED actually fails: `src/kernel/composition-root.ts:40–42` still wires `DefaultUserProjectWorkspace(this.getGitWorkspace())`, and `DefaultGitWorkspace`'s constructor runs `execSync('git rev-parse --show-toplevel')` which throws `NotInGitWorkspaceError` when there's no `.git/`.

## Execution Plan

### Step 0 — Copy this approved plan to the workflow directory (FIRST STEP, before any other work)

Copy this file to `docs/jira-docs/AHQ-91/workflow-files/e2e-test-files/02-red-phase-failing-test-plan-copy.md`. This preserves the approved plan alongside the RED-phase outputs.

### Step 1 — Delete the `git init` setup lines from 5 e2e test files

For each file below, delete exactly two lines: the `execSync('git init', ...)` line and the preceding inline `// Arrange — git init …` comment. **Do not** touch any other lines in these files (including the TSDoc header comments that mention `git init`; leaving those is out of scope per the literal Testing Plan — they become a separate REFACTOR-phase candidate).

| File | Line to delete (`execSync`) | Preceding comment to delete |
|---|---|---|
| `tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts` | line 76 | line 75 |
| `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` | line 80 | line 79 |
| `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` | line 79 | line 78 |
| `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts` | line 113 | line 112 |
| `tests/e2e/demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts` | line 91 | line 90 |

Each Edit targets the 2-line block:
```
      // Arrange — git init in the temp workspace (so …)
      execSync('git init', { cwd: tempWorkspace, stdio: 'pipe' });
```
(The two-line block — comment + execSync — is unique in each file per grep, so Edit with that 2-line `old_string` is safe.)

### Step 2 — Verify TypeScript still compiles

Run `pnpm typecheck` — deleting these lines removes the only `execSync` usage in some files, but `execSync` is still imported for the install-script call, so no import-related errors are expected.

Expected: zero errors.

### Step 3 — Run ONE representative e2e test to confirm RED

Run the **cheapest** of the 5 modified tests (the list test — "no Claude invocation, just install script + CLI startup"):
```
pnpm test:e2e:cross-workspace-list-workflows
```
Expected: test **fails**. Failure mode: the CLI exits with a non-zero status (or empty stdout) because `DefaultGitWorkspace`'s constructor throws `NotInGitWorkspaceError` when the tmp workspace has no `.git/`. The assertion `expect(output).toContain('Available workflows:')` then fails.

We do **not** run all 5 — they're expensive (multi-minute install-script + real Claude invocations), and running one representative test is sufficient to prove RED. The other 4 will be verified at e2e GREEN/VALIDATE time.

### Step 4 — Write the RED phase summary document

Write `docs/jira-docs/AHQ-91/workflow-files/e2e-test-files/02-red-phase-failing-tests.md` per the template in the command's Step 8. Include:
- The 5 files modified (with the 2-line deletion in each).
- The actual failure output captured from Step 3 (paste verbatim).
- A note that only 1 of the 5 tests was run to prove RED (cheapest one).

### Step 5 — Add comment to AHQ-91 Jira

Use `mcp__mcp-atlassian__jira_add_comment` (already in the Known MCP Tools memory) with a comment describing: test files modified, one representative test confirmed failing, next step GREEN.

### Step 6 — Write command output file & self-terminate

Write `{command-input-output-files-directory}/command-output.json` with `{"command-output-string": "RED phase complete for test-type e2e"}`, then invoke the self-termination skill.

### Step 7 — Recheck that all steps in `02-jira-write-failing-test.md` have been executed

Walk through the command's Steps 0–12 and confirm each is done, especially the outputs (plan-copy file exists, red-phase file exists, Jira comment added, output file written).

## English Language Description

When `pnpm test:e2e:cross-workspace-list-workflows` runs, **Vitest** starts the test. The test uses **fs** to *mkdirSync* a fresh tmp workspace directory under `/tmp/agentic-hq-test-workspaces/`. Post-RED, the `git init` setup line is gone, so the tmp workspace has **no `.git/` directory**.

The test then asks **runCliAndLogOutput** to execute `agentic-hq list` with cwd set to that tmp workspace. The `agentic-hq` wrapper (`bin/agentic-hq.cjs`) unconditionally sets `process.env.AGENTIC_HQ_WORKSPACE_ROOT` to the installation root, then spawns the TypeScript CLI. The CLI entry point *constructs* a **CompositionRoot**. When the CLI asks the **CompositionRoot** to *getTool*, it in turn asks itself to *getUserProjectWorkspace*, which creates a **DefaultUserProjectWorkspace** passing in a new **DefaultGitWorkspace**. **DefaultGitWorkspace**'s constructor runs `execSync('git rev-parse --show-toplevel')` in the tmp workspace's cwd. Because there is no `.git/`, the shell command exits non-zero, `execSync` throws, and **DefaultGitWorkspace** catches the throw and re-throws **NotInGitWorkspaceError**. This bubbles up through `DefaultUserProjectWorkspace` → `CompositionRoot` → the CLI entry point → the child process exits with a non-zero status.

Back in the test, **runCliAndLogOutput** sees the non-zero exit (or captures the error output) and the assertion `expect(output).toContain('Available workflows:')` fails — which is the intended RED signal.

The other 4 cross-workspace tests follow the same flow (they all go through the same `DefaultGitWorkspace` constructor at CLI startup), but we only run the cheapest one to keep the RED phase fast.

## Project Design Requirements Compliance

Skipped — this RED phase **deletes** two lines per test file. No new classes, interfaces, or abstractions are introduced. Design requirements will be revisited in the e2e REFACTOR phase when the legacy `GitWorkspace` / `AgenticHqInstallation` / `UserProjectWorkspace` interfaces and impls are deleted and consumers migrated to the expanded `Workspace` interface from the unit cycle.

(Also: the human's Testing Plan is already the authoritative spec for this phase — the plan literally lists the lines to delete. Design-requirements compliance for the broader refactor lives in the unit-cycle plan copy and the Jira description.)

## Critical Files To Be Modified

- `tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts` — delete lines 75–76.
- `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` — delete lines 79–80.
- `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` — delete lines 78–79.
- `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts` — delete lines 112–113.
- `tests/e2e/demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts` — delete lines 90–91.

New files created:
- `docs/jira-docs/AHQ-91/workflow-files/e2e-test-files/02-red-phase-failing-test-plan-copy.md` (this plan, copied).
- `docs/jira-docs/AHQ-91/workflow-files/e2e-test-files/02-red-phase-failing-tests.md` (RED phase summary).
- `{command-input-output-files-directory}/command-output.json` (command output handshake).

## Verification

- `pnpm typecheck` — zero errors (type system shouldn't care about the deleted runtime lines).
- `pnpm test:e2e:cross-workspace-list-workflows` — fails. Paste the failure output into the RED phase summary document.
- `docs/jira-docs/AHQ-91/workflow-files/e2e-test-files/02-red-phase-failing-test-plan-copy.md` exists and matches this plan.
- `docs/jira-docs/AHQ-91/workflow-files/e2e-test-files/02-red-phase-failing-tests.md` exists with the correct template fields filled in.
- AHQ-91 has a new comment noting "AI Agent has completed RED phase for e2e tests."
- `command-output.json` contains `{"command-output-string": "RED phase complete for test-type e2e"}`.

## Notes / Open Questions For Human Review

1. **Should I also update the TSDoc header comments** (e.g. line 9 of `cross-workspace-list-workflows.e2e.test.ts`: `* 3. Setup: Run git init in the temp workspace`)? The Testing Plan doesn't list them, so by default I will **not** touch them. They become a REFACTOR-phase candidate (cheap doc cleanup). Reply "also update docstrings" if you want them cleaned up now.
2. **Scope of the test run to prove RED**: I'm proposing to run **only 1 of 5** (the cheapest). If you'd rather I run all 5 to prove RED in every test, reply "run all 5 for RED" and I'll accommodate (expect ~10+ minutes of install + CLI-startup runtime).

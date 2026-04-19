# RED Phase Complete: AHQ-91 (e2e test)

**Jira**: [AHQ-91](https://agentic-hq.atlassian.net/browse/AHQ-91)
**Test Type**: e2e
**Phase**: RED (Failing Tests Written — via deletion of `git init` setup lines)
**Generated**: 2026-04-19

---

## Tests Created

**No new e2e tests written.** Per the human's Testing Plan in the Jira, the e2e RED action is to **delete** the `execSync('git init', ...)` setup line (and its preceding inline `// Arrange — git init …` comment) from each of the 5 existing cross-workspace e2e tests. With `DefaultGitWorkspace` still live in production code, the tmp workspaces now have no `.git/` directory, so the CLI startup throws `NotInGitWorkspaceError` and each test fails.

**Files modified (2 lines deleted from each)**:

| File | Deleted lines |
|---|---|
| `tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts` | Former lines 75–76 (`// Arrange — git init …` comment + `execSync('git init', …)`) |
| `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` | Former lines 79–80 (same 2-line block) |
| `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` | Former lines 78–79 (same 2-line block) |
| `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts` | Former lines 112–113 (`// Arrange — git init …` comment + `execSync('git init', …)`, comment wording: "so workspace root detection works") |
| `tests/e2e/demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts` | Former lines 90–91 (same 2-line block) |

**Tests whose behaviour now changes**: all 5 above — each will fail at CLI startup until the e2e GREEN phase removes git-root detection.

---

## Representative Test Run (RED proof)

Only **1 of 5** tests was executed to confirm RED. Reason: the other 4 invoke Claude and take several minutes each; running the cheapest one is sufficient to prove RED because all 5 go through the same `DefaultGitWorkspace` constructor at CLI startup. The remaining 4 will be executed at e2e GREEN / VALIDATE time.

**Command run**:
```
pnpm test:e2e:cross-workspace-list-workflows
```

**Vitest summary**:
```
 FAIL  |e2e| tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts > Cross-Workspace agentic-hq list via globally-linked agentic-hq binary > should list workflows in the new 2-line format from a separate workspace via the globally-linked binary
Error: CLI command failed. Log file: /tmp/e2e-cross-workspace-list-workflows.log

Caused by: Error: Command failed: agentic-hq list
Serialized Error: { status: 1, signal: null, output: [ null, null, null ], pid: 49085, stdout: null, stderr: null }

 Test Files  1 failed (1)
      Tests  1 failed (1)
   Duration  3.04s
```

**Root cause from CLI log (`/tmp/e2e-cross-workspace-list-workflows.log`)**:
```
fatal: not a git repository (or any of the parent directories): .git
/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/workspace/default-git-workspace.ts:30
      throw new NotInGitWorkspaceError();
            ^

NotInGitWorkspaceError: Not in a git repository.

Agentic HQ must be run from within a git workspace.
Please cd into a git repository and try again, or run `git init` to create one.
    at new DefaultGitWorkspace (…/default-git-workspace.ts:30:13)
    at CompositionRoot.getGitWorkspace (…/composition-root.ts:33:12)
    at CompositionRoot.getUserProjectWorkspace (…/composition-root.ts:41:49)
    at CompositionRoot.getIOMarshallerSessionFactory (…/composition-root.ts:49:56)
    at CompositionRoot.getTool (…/composition-root.ts:54:12)
    at CompositionRoot.getWorkflowCommandBuilder (…/composition-root.ts:64:12)
    at <anonymous> (…/src/cli/agentic-hq-cli.ts:22:22)
```

This is the intended RED failure — the CLI attempts to construct a `DefaultGitWorkspace` via `CompositionRoot`, the `.git/` directory doesn't exist in the tmp workspace, and `NotInGitWorkspaceError` is thrown.

---

## Files Created

- `docs/jira-docs/AHQ-91/workflow-files/e2e-test-files/02-red-phase-failing-test-plan-copy.md` — approved plan (copied from `/Users/stevepersonal/.claude/plans/graceful-greeting-frog.md`).
- `docs/jira-docs/AHQ-91/workflow-files/e2e-test-files/02-red-phase-failing-tests.md` — this file.

**Note**: No skeleton/implementation files created in RED phase — that's GREEN phase work. The GREEN phase will remove git-root detection from the production path so these 5 tests pass without `git init`.

---

## Ready for GREEN Phase

Run the next command to remove git-root detection from the production path and get the 5 cross-workspace e2e tests passing:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-91 e2e
```

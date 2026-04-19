# GREEN Phase Plan: AHQ-91 (e2e test)

**Jira**: [AHQ-91](https://agentic-hq.atlassian.net/browse/AHQ-91) — Remove Git Root Directory Checking And Refactor Workspace Classes
**Test Type**: e2e
**Phase**: GREEN (Minimal Implementation)

---

## Context

The RED phase deleted `execSync('git init', …)` setup lines from 5 cross-workspace e2e tests. Those tests now create a tmp workspace without `.git/` and run `agentic-hq list`/workflow CLI commands. The CLI fails at startup because `CompositionRoot.getGitWorkspace()` calls `new DefaultGitWorkspace()`, whose constructor shells out to `git rev-parse --show-toplevel` and throws `NotInGitWorkspaceError` when no git repo is present.

The GREEN goal per the AI summary's "Scope Handoff" section (unit REFACTOR already produced it) is **minimal**: remove git-root detection from the production CLI startup path so those 5 e2e tests pass. Class deletions, consumer migrations, and legacy test deletions are explicitly deferred to the e2e REFACTOR phase. Ugly / half-migrated state is acceptable here.

---

## Jira Requirements (Numbered)

The GREEN phase is scoped by the AI summary's Scope Handoff. The authoritative requirements for **this phase only** are a subset of the full Jira ACs. Full-Jira ACs (class deletions, index.ts cleanup, consumer migration, test deletions) are mapped to "Deferred to e2e REFACTOR".

1. **The 5 cross-workspace e2e tests pass without `git init`** (full-Jira AC "The 5 cross-workspace e2e tests no longer call `git init`" + "`agentic-hq` CLI runs from a non-git directory" + "`pnpm test:e2e` passes") → [Step 1: Modify CompositionRoot.getGitWorkspace]
2. **Git-based detection removed from the production CLI startup path** (full-Jira AC "Git-based workspace-root detection is fully removed from production code" — partially met: CLI no longer invokes git at startup; full removal of the class itself deferred) → [Step 1: Modify CompositionRoot.getGitWorkspace]
3. **Existing unit tests (140) continue to pass** — no test changes in GREEN (AC "pnpm validate passes" — partial: e2e GREEN focuses on the 5 e2e tests; full-suite `pnpm test:e2e` run is the human's manual verification per command instructions) → [Verification: Automated typecheck + focused e2e test]
4. **TDD methodology followed** (AC) — the deletion of `git init` lines was the RED; making the CLI tolerate non-git dirs is the GREEN → [Entire plan satisfies]
5. **Out of scope — deferred to e2e REFACTOR** (per AI summary Scope Handoff):
   - Delete `src/interfaces/git-workspace.ts`, `src/interfaces/agentic-hq-installation.ts`, `src/interfaces/user-project-workspace.ts`
   - Delete `src/workspace/default-git-workspace.ts`, `src/workspace/default-agentic-hq-installation.ts`, `src/workspace/default-user-project-workspace.ts`, `src/workspace/not-in-git-workspace-error.ts`
   - Delete `tests/unit/workspace/*.unit.test.ts`
   - Remove re-exports from `src/interfaces/index.ts`
   - Migrate `ClaudeCommandBuilder`, `MarshalledCLITool`, `JsonFileIOMarshallerSessionFactory`, `ClaudeWorkflowCommandBuilder`, `WorkflowSearchResultsImpl` to depend on `Workspace` / `AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl`
   - Update consumer tests that construct legacy types directly
   → N/A (explicitly deferred; tracked in the AI summary's Scope Handoff section)

---

## Project Design Requirements Compliance

Design requirements file: `docs/dev/project-design-requirements.md` (read).

| # | Design Requirement | Plan Section Addressing It | Notes |
|---|---|---|---|
| D.1 | Class/interface pair for each concept | (Deferred) | The inline `{ getRoot: () => process.cwd() }` does NOT get its own class — it's a stop-gap shim that only lives until REFACTOR deletes the whole `getGitWorkspace()` method and wires `AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl` directly. Proper class/interface per concept is realised in REFACTOR via the expanded `Workspace` interface already built in the unit phase. |
| D.2 | Tell, don't ask | (Met at target state, not GREEN) | Callers of `gitWorkspace.getRoot()` in `DefaultAgenticHqInstallation` / `DefaultUserProjectWorkspace` are unchanged in GREEN. REFACTOR replaces both legacy classes so the remaining callers ask the `Workspace` directly. |
| D.3 | Avoid cached state | Step 1 returns `process.cwd()` at call time | The inline shim evaluates `process.cwd()` lazily on each `getRoot()` call — matches `AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl` behaviour. |
| D.4 | Switchable concrete classes | (Deferred) | `DefaultGitWorkspace` remains in the tree during GREEN so existing unit tests keep mocking `execSync`. REFACTOR deletes it entirely and callers depend on `Workspace` — fully switchable at that point. |
| D.5 | Concept Table / Data Dictionary / ELD | **Deferred to REFACTOR** because GREEN phase only requires minimal passing code. The full concept mapping was produced during the unit-phase planning (see `docs/jira-docs/AHQ-91/workflow-files/unit-test-files/03-APPROVED-green-phase-implementation-plan-copy.md`) and will be re-applied when legacy classes are deleted in REFACTOR. |
| D.6 | One test file per class | (Met — no new test files) | No new tests in GREEN. |
| D.7 | Directory structure by entity | (Not affected) | No directory changes. |

**Rationale for deferrals**: The AI summary's "IMPORTANT: Scope Handoff" section deliberately splits GREEN (minimal, keep legacy classes alive) from REFACTOR (delete legacy classes, migrate consumers). Doing design-compliance work at GREEN would bleed into REFACTOR's scope, duplicating the code-review surface.

---

## Step 0 (CRITICAL — FIRST ACTION)

**Copy this approved plan to** `docs/jira-docs/AHQ-91/workflow-files/e2e-test-files/03-APPROVED-green-phase-implementation-plan-copy.md` **before proceeding with any code changes.**

Source: `/Users/stevepersonal/.claude/plans/generic-meandering-clock.md`
Destination: `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/jira-docs/AHQ-91/workflow-files/e2e-test-files/03-APPROVED-green-phase-implementation-plan-copy.md`

Use the Read tool then Write tool (or `cp` via Bash).

---

## Step 1: Modify `CompositionRoot.getGitWorkspace()` to stop instantiating `DefaultGitWorkspace`

**File**: `src/kernel/composition-root.ts`

**Change**: Replace `return new DefaultGitWorkspace()` with an inline object literal that satisfies the `GitWorkspace` interface by returning `process.cwd()`. Also remove the now-unused `DefaultGitWorkspace` import (otherwise lint/typecheck will flag it).

**Before** (lines 27 and 32–34):
```ts
import { DefaultGitWorkspace } from '../workspace/default-git-workspace.js';
...
  private getGitWorkspace(): GitWorkspace {
    return new DefaultGitWorkspace();
  }
```

**After**:
```ts
// (DefaultGitWorkspace import removed)
...
  private getGitWorkspace(): GitWorkspace {
    // GREEN-phase shim for AHQ-91: CLI must no longer require `git init`.
    // Returns process.cwd() so DefaultUserProjectWorkspace picks up the user's current
    // workspace. DefaultAgenticHqInstallation already prefers process.env.AGENTIC_HQ_WORKSPACE_ROOT
    // (set by bin/agentic-hq.cjs), so its behaviour is unchanged when the env var is present.
    // REFACTOR phase will delete this whole method and inject AhqWorkspaceImpl /
    // CurrentUserWorkspaceImpl directly per the Scope Handoff in the AI summary.
    return { getRoot: () => process.cwd() };
  }
```

**Why this is minimal**:
- **1 file modified**. No class creation, no deletion.
- `DefaultGitWorkspace` class + its unit test (`tests/unit/workspace/default-git-workspace.unit.test.ts`) untouched. The unit test mocks `execSync` so it continues to pass regardless of production call-site.
- `DefaultAgenticHqInstallation` + `DefaultUserProjectWorkspace` unchanged. Their unit tests unchanged.
- No `interfaces/index.ts` changes — `GitWorkspace` interface still referenced by `CompositionRoot` typing and the legacy classes.
- Comment explicitly flags this as a GREEN-phase shim, so the REFACTOR agent sees what needs ripping out.

**Why `process.cwd()` and not `env ?? cwd`**:
- For the CLI tests: env var is set to the AHQ install root by the bin wrapper (`bin/agentic-hq.cjs:19`). `DefaultUserProjectWorkspace` needs the **user's** cwd (the tmp workspace), not the AHQ root. If the shim returned env, `DefaultUserProjectWorkspace.getRoot()` would point at the AHQ install, breaking the 4 workflow-execution e2e tests.
- `DefaultAgenticHqInstallation` ignores `gitWorkspace.getRoot()` when env var is set (the `??` short-circuits), so it gets the AHQ root correctly.

---

## Step 2: Verify with the RED-proof test

Run the exact pnpm command that proved RED:

```
pnpm test:e2e:cross-workspace-list-workflows
```

**Expected**: ✅ passes. Output should contain `Available workflows:`, `create-workflow`, and `What it does: Create`.

Rationale for running only this one of the 5 cross-workspace e2e tests: the other 4 invoke Claude and take several minutes each. The command instructions for this GREEN command explicitly say: _"If {test-type} is 'integration', 'smoke', or 'e2e': DO NOT run the full suite."_ So this one passing is sufficient evidence the CLI startup path no longer needs git. The full `pnpm test:e2e` gate is part of the full-Jira AC and is a **manual** verification step I'll flag to the human.

---

## Step 3: Verify typecheck

```
pnpm typecheck
```

**Expected**: ✅ zero errors. The inline object literal `{ getRoot: () => process.cwd() }` structurally matches the `GitWorkspace` interface (single method `getRoot(): string`).

Lint/format are not required by the GREEN phase command, but the inline object matches prevailing code style in this file (arrow fns, no trailing commas in single-line literals) so no lint issues expected.

---

## Step 4: Human manual verification of the other 4 cross-workspace e2e tests

Per the command's Step 7b guidance, I'll **not** run the full e2e suite to conserve Claude Code plan credits. Tell the human:

> "I've passed `pnpm test:e2e:cross-workspace-list-workflows`. Please run the other 4 cross-workspace tests manually if you want to verify end-to-end — they invoke Claude and take several minutes each:
>
>     pnpm test:e2e:cross-workspace-string-reversal
>     pnpm test:e2e:cross-workspace-demo-math-workflow
>     pnpm test:e2e:cross-workspace-quick-jira-workflow
>     pnpm test:e2e:user-workspace-workflows
>
> GREEN phase is considered minimal-complete once the one fast test passes; the other 4 go through the same `CompositionRoot.getGitWorkspace()` startup path so they should behave the same."

No manual "human must test" AC is listed in the Jira for e2e GREEN specifically — the Jira's manual-test hooks (if any) are full-Jira ACs that the REFACTOR / VALIDATE phases handle. So I'll treat the 4 extra tests as optional human verification, not a GREEN gate.

---

## Step 5: Write GREEN phase summary document

Write `docs/jira-docs/AHQ-91/workflow-files/e2e-test-files/03-green-phase-summary-of-what-was-implemented.md` per the template in the GREEN command, covering:
- File modified: `src/kernel/composition-root.ts`
- Test command that passed: `pnpm test:e2e:cross-workspace-list-workflows`
- Key decisions: why inline shim (vs modifying `DefaultGitWorkspace`), why `process.cwd()` (vs `env ?? cwd`)
- Bugs found: (expect "None — implementation went as planned")

---

## Step 6: Add comment to Jira AHQ-91

Use `mcp__mcp-atlassian__jira_add_comment` (via `ToolSearch select:mcp__mcp-atlassian__jira_add_comment`) to post the standard GREEN-complete comment with the implementation file path and test command.

---

## Step 7: Present to human, write command-output.json, self-terminate

Per the GREEN command's Steps 10–12. Output string: `"GREEN phase complete for test-type e2e"`. Then invoke the self-termination skill.

---

## TODO: Re-read command file for test/doc instructions after Step 1

After implementing Step 1 (the code change), re-read `.claude/plugins/repo/agentic-hq-plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/commands/03-jira-minimal-implementation.md` (or the equivalent loaded command prompt) for any test/documentation detail I may miss from memory when writing Steps 2–7.

---

## Critical files to be modified

- `src/kernel/composition-root.ts` — remove `DefaultGitWorkspace` import; replace `getGitWorkspace()` body with inline shim returning `process.cwd()`.

## Files to be created

- `docs/jira-docs/AHQ-91/workflow-files/e2e-test-files/03-APPROVED-green-phase-implementation-plan-copy.md` (Step 0)
- `docs/jira-docs/AHQ-91/workflow-files/e2e-test-files/03-green-phase-summary-of-what-was-implemented.md` (Step 5)

## Files intentionally NOT modified in GREEN (REFACTOR scope)

- `src/workspace/default-git-workspace.ts`, `src/workspace/default-agentic-hq-installation.ts`, `src/workspace/default-user-project-workspace.ts`, `src/workspace/not-in-git-workspace-error.ts`
- `src/interfaces/git-workspace.ts`, `src/interfaces/agentic-hq-installation.ts`, `src/interfaces/user-project-workspace.ts`
- `src/interfaces/index.ts`
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts`
- `src/tools/marshalled-io-tools/marshalled-cli-tool.ts`
- `src/io/marshalling/json-file-io-marshaller-session-factory.ts`
- `src/workflow/claude/claude-workflow-command-builder.ts`
- `tests/unit/workspace/*.unit.test.ts` (all three)
- `tests/unit/claude-code-tool/*.unit.test.ts` (consumer tests)

## Verification summary

- `pnpm test:e2e:cross-workspace-list-workflows` → ✅ pass (was ✗ in RED)
- `pnpm typecheck` → ✅ zero errors
- `pnpm test` (all unit tests) → not re-run by agent (nothing unit-level changed); human can run if they want, but CompositionRoot has no unit test and `DefaultGitWorkspace`'s unit test mocks its own `execSync` so 140/140 should remain green
- Other 4 cross-workspace e2e tests → human manual verification (flagged in Step 4)

# AI Summary: AHQ-43

**Jira**: [AHQ-43](https://agentic-hq.atlassian.net/browse/AHQ-43)
**Title**: agentic-hq CLI Runs Full Demo TDD Workflow In Any Dev Workspace
**Status**: Already In Progress (no transition needed)
**Generated**: 2026-03-14

---

## My Understanding of This Task

This is a mechanical conversion of the **Full Jira TDD Story Workflow** to run via the agentic-hq CLI from any developer workspace, following the exact same pattern established in [AHQ-82](https://agentic-hq.atlassian.net/browse/AHQ-82) (which did this for the Quick workflow). The goal is: a developer can run the full TDD workflow from their own project workspace using the globally-linked `agentic-hq` CLI binary, rather than needing to be inside the agentic-hq repo and using `tsx` directly.

The full workflow has 6 commands (vs quick's 5): `01-jira-read-and-question`, `02-jira-write-failing-test` (RED), `03-jira-minimal-implementation` (GREEN), `04a-jira-refactor-analysis`, `04b-jira-refactor-execute`, and `05-jira-validate`. The key structural difference from the quick workflow is the REFACTOR phase is split into analysis (04a) and execute (04b), and the final step is VALIDATE rather than "transition to Done".

The conversion involves: (1) creating a new `full-jira-tdd-story-workflow` skill with SKILL.md and ts-workflow mini-project (following the quick-jira-workflow/math-workflow pattern), (2) updating the 6 command files to remove `project-root` as a **parsed parameter** but retain it as a **self-determined variable** (Claude sets it from its working directory), (3) deleting the old demo CLI at `src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts`, and (4) updating package.json scripts.

**Intentionally out of scope**: No e2e test for this workflow (Jira explicitly says manual testing only, as it's very long and almost identical to the quick workflow). The test type will be "cheated" as `e2e` with RED phase skipped, GREEN phase done without tests, and REFACTOR phase still performed. Follow-up [AHQ-75](https://agentic-hq.atlassian.net/browse/AHQ-75) will expand this to work with custom Jira/GitHub instances.

## Research Findings

No external research needed. This is a mechanical adaptation of the established cross-workspace pattern (AHQ-82) to the full workflow.

### Key Differences: Full vs Quick Workflow Conversion

The full workflow conversion is structurally identical to the quick workflow conversion, with these differences:

1. **6 commands instead of 5**: The REFACTOR phase is split into analysis (04a) and execute (04b). The loop body is: RED (02) -> GREEN (03) -> REFACTOR-analysis (04a) -> REFACTOR-execute (04b).

2. **VALIDATE instead of "transition to Done"**: Command 05 runs validation rather than transitioning the Jira status.

3. **No `--test-type` CLI parameter needed**: Same as quick workflow - the test types come from command 01's output, not from CLI args.

### Approach: `project-root` as Self-Determined Variable (Not Passed Parameter)

**Agreed with human during Read & Question phase.**

AHQ-82 removed `project-root` entirely from the quick workflow command files — both as a parsed parameter AND as a variable. Paths changed from `{project-root}/docs/jira-docs/...` to just `docs/jira-docs/...`.

For the full workflow, we're taking a better approach:

- **Remove `project-root` as a parsed parameter** — it's NOT passed via `buildVariablesString` from the ts-workflow CLI, and NOT parsed from `command-input-string`
- **Retain `project-root` as a variable** in the command files — but Claude determines the value itself from its primary working directory (e.g., `project-root = (your primary working directory)`)
- **All `{project-root}/...` paths remain** in the commands — complete, absolute, unambiguous

This gives us: simple CLI wiring (no parameter passing), but explicit unambiguous paths in the command instructions.

**REFACTOR consideration**: During the REFACTOR phase, we should also update the quick workflow commands (from AHQ-82) to match this pattern — restoring `project-root` as a self-determined variable so both workflows are consistent.

## Questions for Human

### Question 1: Confirm no e2e test approach

The Jira says "there is no test for this" and to "cheat by returning e2e as the test type". Just to confirm: the workflow for this Jira will be:

- RED phase: **Skip entirely** (no test to write)
- GREEN phase: Create the skill (SKILL.md, ts-workflow CLI, update command files, delete old CLI, update package.json scripts) - but no automated test
- REFACTOR phase: Still perform refactoring analysis and execution on the GREEN phase code

Is that correct?

**Human's Response**:
> Yes

---

### Question 2: Manual testing approach

Since there's no automated test, how would you like to manually verify the conversion works? My suggestion:

1. After GREEN phase, run `pnpm demo:plugin-direct:full-jira-tdd-story-workflow -- --jira-id=AHQ-43` from the agentic-hq repo to verify it starts and runs command 01 correctly
2. Optionally test from a separate workspace using `agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:full-jira-tdd-story-workflow -- --jira-id=<some-test-jira>`

Or would you prefer a different verification approach?

**Human's Response**:
> I'll do option 2 from a fresh, empty workspace.

---

## Files I Reviewed

- `src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts` — The current demo CLI being converted. Has 6 command constants, `buildVariablesString()` with `project-root`, uses `getCurrentWorkspaceRoot()` fallback. This is the code whose logic moves to the plugin ts-workflow.

- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/*.md` (all 6 files) — All 6 command files still parse `project-root` from input and use `{project-root}/` path prefixes. Need updating: remove as parsed parameter, keep as self-determined variable.

- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/SKILL.md` — The reference pattern: uses subshell install + `--tsconfig` tsx pattern. Full workflow SKILL.md will be identical except pointing to `full-jira-tdd-story-workflow-demo-cli.ts`.

- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/src/quick-jira-workflow-demo-cli.ts` — Reference CLI: 5 commands, loop over test types (RED/GREEN/REFACTOR), no `--project-root`. Full workflow ts-workflow CLI will be similar but with 6 commands (04a+04b instead of single 04).

- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/package.json` — Reference package.json with `link:../../../../../..` dep on agentic-hq, tsx, commander, postinstall node-pty fix.

- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/tsconfig.json` — Reference tsconfig.

- `docs/jira-docs/AHQ-82/workflow-files/ai-summary-of-jiras-and-questions-for-human.md` — AHQ-82 summary showing the conversion pattern, subshell discovery, project-root removal rationale.

- `docs/jira-docs/AHQ-82/workflow-files/e2e-test-files/03-green-phase-summary-of-what-was-implemented.md` — AHQ-82 GREEN phase showing exact files created/modified/deleted during quick workflow conversion.

- `docs/jira-docs/AHQ-82/workflow-files/e2e-test-files/03b-HUMAN_addition_to_plan_about_permissions.md` — Documents the `--allowedTools` CLI parameter discovery (workspace `.claude/settings.local.json` never worked for auto-approving tools).

- `docs/jira-docs/AHQ-82/workflow-files/e2e-test-files/04b-refactor-phase-complete.md` — AHQ-82 REFACTOR phase showing dead code removal, README updates, pnpm script fixes.

- `package.json` — Has `demo:full-jira-tdd-story-workflow` script using `tsx src/demo/cli/full-jira-tdd-story-workflow-demo-cli.ts`. Needs replacing with `demo:plugin-direct:full-jira-tdd-story-workflow`.

**Most important findings:**
- The full-jira-tdd-story-workflow skill directory doesn't exist yet — needs creating from scratch following quick-jira-workflow pattern
- The ts-workflow CLI will be very similar to quick-jira-workflow's but with 6 commands instead of 5 (04a + 04b instead of single 04)
- All 6 command files: remove `project-root` as parsed parameter, retain as self-determined variable, keep `{project-root}/` path prefixes
- No `--project-root` parameter in the new CLI — Claude determines it from its working directory
- No e2e test needed — manual verification only
- REFACTOR should also update quick workflow commands to match this approach for consistency

## Test Types And Tests We Will Be Implementing

**Test types: `e2e`** (but with RED phase skipped, GREEN phase without automated tests, REFACTOR phase still performed)

### E2E "Test" (Manual Only - No Automated Test)

Per the Jira's explicit instruction:
- **RED phase**: Skip entirely - no automated test to write
- **GREEN phase**: Implement the skill conversion (SKILL.md, ts-workflow CLI, update command files, delete old CLI, update package.json) - verify manually
- **REFACTOR phase**: Still perform refactoring analysis and execution on the implementation code. Includes updating quick workflow commands to use the `project-root` as self-determined variable pattern for consistency.

**Manual verification plan:**
1. Run `pnpm validate` to ensure typecheck/lint/tests pass
2. Run `pnpm demo:plugin-direct:full-jira-tdd-story-workflow -- --jira-id=<test-jira>` to verify skill loads and first command executes - HUMAN: Please do this yourself (and then kill the command)
3. Optionally verify from a separate workspace using `agentic-hq` CLI - HUMAN: I'll do this.

## Ready for Next Step

Awaiting human responses to questions, then this summary will be complete.

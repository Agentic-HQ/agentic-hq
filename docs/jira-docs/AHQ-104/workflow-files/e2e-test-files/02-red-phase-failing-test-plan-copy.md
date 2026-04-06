# Plan: RED Phase (e2e test) for AHQ-104

**Jira**: [AHQ-104](https://agentic-hq.atlassian.net/browse/AHQ-104) — Refactor Current Workflow Listing To Use Dynamic Discovery
**Test Type**: e2e
**Phase**: RED

---

## Context

**Why this change is being made**

AHQ-104 is replacing the hardcoded `DEMO_SKILLS` array (in `src/demo/demo-skills.ts`) that drives `agentic-hq list` with a dynamic discovery mechanism that scans `.agentic-hq/plugins/*/skills/*/ahq-workflow.json` files in the AHQ workspace. The unit-test TDD cycle for the new discovery subsystem (`src/workflow-discovery/`) is already complete (RED → GREEN → REFACTOR → VALIDATE). We are now starting the e2e-test TDD cycle, beginning with RED.

**Scope decision (confirmed with user)**

User chose to take a minimal-change shortcut: rather than adding column-padding to the new classes to reproduce the current aligned 3-column output format, AHQ-104 will ship a simpler new output format that the new classes naturally produce (with one tiny tweak to `AhqWorkflowImpl`). This means AHQ-104 slightly expands scope beyond "exactly the same output" — the *content* stays equivalent, but the *format* changes to a simpler 2-line-per-workflow layout. User explicitly wants to avoid "doing work to change the new classes to make them output the old format (which will be undone in the next Jira)."

**What this RED phase must produce**

Per the Jira: "If there isn't an e2e test that tests this CLI function by running `agentic-hq list` then one should be written…". There is currently no e2e test for `agentic-hq list`. This RED phase creates one. Because the target output format differs from today's hardcoded output, this is a **genuine RED test** — it will fail today and drive the GREEN-phase refactor.

---

## Target output (what the e2e test asserts)

```
Available workflows:

agentic-hq reversal -- --string-reverse='hello there you'
   What it does: Reverses a string (hello world demo)
agentic-hq math -- --input-number=54321
   What it does: Solves a math problem using an agent team
agentic-hq quick-jira -- --jira-id=TEST-123
   What it does: Creates and completes a Jira ticket
agentic-hq full-jira -- --jira-id=TEST-123
   What it does: Full TDD story workflow driven by a Jira ticket
agentic-hq create-workflow
   What it does: Create a new Agentic HQ workflow
```

**Per-workflow format (2 lines)**:
- Line 1 (no indent): `agentic-hq <shortName><exampleParameters>`
- Line 2 (3-space indent): `   What it does: <description>`

**Header**: `Available workflows:\n\n` — unchanged from what `WorkflowSearchResultsImpl` already emits.

**Entries joined by**: `\n` (single newline, no blank line between workflows) — unchanged from what `AhqWorkflowsImpl.getWorkflowListingEntriesString()` already does.

**GREEN-phase production change** (NOT part of this RED phase — just documenting the expected direction):
- One-line change in `AhqWorkflowImpl.getWorkflowListingEntryString()`:
  - OLD: `${WORKFLOW_LINE_INDENT}${shortName} ${skillCommand} ${description}${EXAMPLE_LINE_PREFIX}${example}`
  - NEW: `${example}\n${WHAT_IT_DOES_PREFIX}${description}` where `WHAT_IT_DOES_PREFIX = '   What it does: '`
- Wire `WorkflowSearchResultsImpl` into `src/cli/agentic-hq-cli.ts` (replacing hardcoded `DEMO_SKILLS` + `WorkflowSkillsRegistry.formatSkillList()` for the `list` action). Short-alias subcommand routing still needs a shortName→full-skill-path mapping — GREEN phase will need to decide whether to reuse the existing `FullClaudeSkillCommand`/`PluginId`/`SkillId` chain for that, or resolve differently.
- Create 5 `ahq-workflow.json` files under `.agentic-hq/plugins/*/skills/*/`.

**GREEN-phase deletion of unused classes/interfaces/tests** (user-confirmed):

The new 2-line format drops the displayed `shortName + skillCommand + description` line, so some classes in `src/workflow-discovery/` may become unreferenced. GREEN phase will audit and delete everything no longer used in production. Candidates for deletion (subject to confirmation in GREEN — some may still be needed for short-alias routing):
- **Likely unused (production-code-wise)**: `FullClaudeSkillCommand` + `FullClaudeSkillCommandImpl` (only rendered the `/pluginId:skillId` for old line-1 display). If short-alias routing uses a different path, also `PluginId` + `PluginIdImpl` and `SkillId` + `SkillIdImpl` (they only feed into `FullClaudeSkillCommand`).
- **Still needed**: `WorkflowShortName` (used by `ExampleCommandImpl`), `WorkflowDescription` (used in new line 2), `ExampleCommand` + `ExampleParameters` (used in new line 1).
- **Also delete**: The corresponding unit test files for anything removed.

GREEN will also delete `src/demo/demo-skills.ts`, `src/workflow/workflow-skills/workflow-skills-registry.ts`, `src/interfaces/workflow-skill.ts`, and their unit tests.

---

## Test To Write

**File**: `tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts`

**Pattern**: Cross-workspace (human-confirmed option 2). Mirrors the pattern in `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` and `cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts`.

**The ONE test**: `should list all 5 workflows in the new format from a separate workspace via the globally-linked binary`

**Steps the test performs**:
1. Run `bash scripts/infra/install-dev-agentic-hq.sh` to pnpm-link the CLI globally.
2. Create a unique temp workspace at `/tmp/agentic-hq-test-workspaces/test-ws-{uuid}/`, `git init` it.
3. Run `agentic-hq list` from that temp workspace (via `runCliAndLogOutput` helper).
4. Assert the output matches the new format.

**Assertions (minimal, non-brittle — tolerate description-text changes)**:
- Output contains `Available workflows:` header.
- Output contains `create-workflow` — chosen because it's the core/stable workflow most likely to persist, and its shortName appearing in output confirms discovery worked end-to-end.
- Output contains `What it does: Create` — partial match on create-workflow's description first word, confirming (a) the new `What it does:` format is in use, and (b) the line is tied to create-workflow (description starts "Create a new…"). Partial-match insulates the test from future wording tweaks to the full description.

That's it — 3 assertions. Deliberately avoids: checking specific example-command strings (fragile to parameter tweaks), asserting absences of old-format artifacts (fragile to minor future tweaks), and checking all 5 workflows by exact line (fragile to any workflow rename/addition/removal).

Per-Jira note: the Jira suggested `math-workflow` as an example, but the user prefers `create-workflow` for the assertion since it's the most stable workflow (core plugin, not a demo).

**Timeout**: 60_000ms (the command does not invoke Claude; only the install script + CLI startup matter). Install script has its own 30s timeout.

**Helpers reused (no new infra)**:
- `runCliAndLogOutput` from `tests/e2e/helpers/cli-test-helper-functions.ts`
- Constants mirrored from `cross-workspace-string-reversal.e2e.test.ts`: `TEMP_WORKSPACES_BASE`, `REPO_ROOT`, `INSTALL_SCRIPT`, `PNPM_HOME`/`PATH` handling, `ETIMEDOUT` diagnostic banner.

**package.json script to add**: `"test:e2e:cross-workspace-list-workflows": "vitest run --config vitest.e2e.config.ts tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts"` — mirrors existing per-test e2e scripts.

---

## Expected RED-phase outcome

Running `pnpm test:e2e:cross-workspace-list-workflows` today:
- The test **FAILS** — current `agentic-hq list` output uses the old hardcoded format (`  reversal   /…  Reverses a string…\nExample: …`) and does **not** contain `What it does:` lines. This is a genuine RED failure.
- Failure reason will be an assertion failure like: `expected "…" to contain "   What it does: Solves a math problem using an agent team"`.

This is true traditional RED: the test fails because the production code doesn't yet produce the target behavior.

`pnpm typecheck` — must pass (no type errors in the new test file). No production code changes in this phase.

---

## English Language Description

When the test runs, it *invokes* `bash install-dev-agentic-hq.sh`, which *pnpm-links* the **agentic-hq** binary globally. It then *creates* a unique temp workspace directory under `/tmp/agentic-hq-test-workspaces/` and *git-inits* it. The test then *runs* the globally-linked **agentic-hq** binary with the `list` subcommand from that temp workspace. Internally **agentic-hq** *parses* the CLI args via its **Commander program**, which (after the GREEN-phase refactor) will *create* a new **WorkflowSearchResultsImpl**, *ask* it to `getWorkflowsListingString()` — which *prints* the `Available workflows:` header and then *delegates* to its contained **AhqWorkflowsImpl** to `getWorkflowListingEntriesString()`, which *scans* the **AhqWorkspaceImpl** (via its **AhqDirectoryImpl** reading the `AGENTIC_HQ_WORKSPACE_ROOT` env var and globbing `.agentic-hq/plugins/*/skills/*/ahq-workflow.json`), *wraps* each discovered file in an **AhqWorkflowImpl**, then *tells* each **AhqWorkflowImpl** to `getWorkflowListingEntryString()` — which *renders* the workflow's two-line entry by *asking* its contained **ExampleCommandImpl** and **WorkflowDescriptionImpl** (both *built* on-demand via `createFrom` from a **JsonFileWorkflowMetadata** view of the **AhqFileImpl**) to `toString()` at the output boundary. The test then *captures* stdout via `runCliAndLogOutput` and makes three non-brittle *assertions*: the `Available workflows:` header is present, `create-workflow` is present (proving discovery ran and picked up the stable core workflow), and `What it does: Create` is present (partial-match, confirming the new format is in use and tied to create-workflow's description).

---

## Project Design Requirements Compliance

The e2e test validates design adherence **indirectly** at the output level (it can't directly inspect internal class structure from a CLI invocation):

- **Delegation chain validated end-to-end** — the assertion on the new two-line format proves the entire delegation chain (`WorkflowSearchResultsImpl` → `AhqWorkflowsImpl` → `AhqWorkflowImpl` → `ExampleCommandImpl`/`WorkflowDescriptionImpl` → `toString()`) produces correct output. "Tell, don't ask" is enforced because each value object renders itself at the output boundary.
- **Value-object chain at output boundary** — the test asserts the final `toString()`-rendered output. Each value object (`WorkflowShortName`, `WorkflowDescription`, `ExampleCommand`, `ExampleParameters`) is rendered at the output boundary as required by the "Primitives wrapped immediately, unwrapped only at the edge" requirement.
- **Discovery via `AGENTIC_HQ_WORKSPACE_ROOT` env var** — the cross-workspace pattern exercises the env-var-based workspace resolution in `AhqWorkspaceImpl`, proving that the list works from any workspace location (human confirmed this must not regress).

Design requirements that **cannot** be validated at the e2e level and are deferred to GREEN/REFACTOR:
- Switchability (every concrete class is replaceable) — validated by inspection and unit tests, not e2e.
- Minimal state / no caching — validated by unit tests and code review. Already verified by the completed unit-test phase.
- Class-per-concept structure — already verified by the completed unit-test phase.

---

## Execution Steps (follow in order — refer to step numbers in `02-jira-write-failing-test.md` for full details)

**Step 0** — **Copy this approved plan** to `docs/jira-docs/AHQ-104/workflow-files/e2e-test-files/02-red-phase-failing-test-plan-copy.md` (must be the FIRST thing done after ExitPlanMode is approved).

**Step 3** — Create the `e2e-test-files` directory if not already created by Step 0.

**Step 7b–7c** — Write the single e2e test file: `tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts` following the pattern in `cross-workspace-string-reversal.e2e.test.ts`. One `describe`, one `it`, the assertions listed above, a brief header comment describing what it verifies.

**Step 7d** — Add `test:e2e:cross-workspace-list-workflows` script to `package.json` matching existing cross-workspace e2e scripts. No new vitest config or dependencies required (reuse `vitest.e2e.config.ts`).

**Step 7e** — Run the test using the AC-style command: `pnpm test:e2e:cross-workspace-list-workflows`. Capture output.
  - Expected: test **fails** with assertion errors (new format not yet produced by CLI). This IS the RED failure.
  - If it fails for a test-file bug (syntax, import path typo), fix the test file only and re-run.
  - Do NOT touch production code in this phase.

**Step 7f** — Run `pnpm typecheck` to confirm no TypeScript errors in the new test file.

**Step 8** — Create `docs/jira-docs/AHQ-104/workflow-files/e2e-test-files/02-red-phase-failing-tests.md` summarising what was created, the test command run, and the RED failure output.

**Step 9** — Add Jira comment via `mcp__mcp-atlassian__jira_add_comment` noting RED phase complete for e2e test type, including a note that this Jira slightly expands scope to ship the new 2-line output format (per user decision, to avoid wasted work reproducing the old aligned format).

**Step 10** — Report to the human.

**Step 11** — Write output file `command-output.json`.

**Step 12** — **Recheck that all steps in `02-jira-write-failing-test.md` have been executed** (explicit final plan step), then self-terminate via `/agentic-hq-core-plugin:self-termination`.

---

## Critical files

**Will be created:**
- `tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts` (the ONE e2e test file)
- `docs/jira-docs/AHQ-104/workflow-files/e2e-test-files/02-red-phase-failing-test-plan-copy.md` (this plan, copied)
- `docs/jira-docs/AHQ-104/workflow-files/e2e-test-files/02-red-phase-failing-tests.md` (RED summary)

**Will be modified:**
- `package.json` — add `test:e2e:cross-workspace-list-workflows` script only

**Reference (no changes in RED phase):**
- `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts` (pattern source)
- `tests/e2e/helpers/cli-test-helper-functions.ts` (`runCliAndLogOutput` helper)
- `scripts/infra/install-dev-agentic-hq.sh` (invoked by test)
- `src/workflow-discovery/workflow/ahq-workflow-impl.ts` (will change in GREEN — one line)
- `src/cli/agentic-hq-cli.ts` (will change in GREEN — swap wiring)
- `src/demo/demo-skills.ts` (will be removed in GREEN)
- `src/workflow/workflow-skills/workflow-skills-registry.ts` (will be removed/replaced in GREEN)

---

## Verification

How to run this test end-to-end:
```
pnpm test:e2e:cross-workspace-list-workflows
```

Expected: test **fails** with assertion errors. Log file at `/tmp/e2e-cross-workspace-list-workflows.log` shows full stdout of the `agentic-hq list` invocation from the temp workspace.

`pnpm typecheck` — must pass (no type errors in the new test file).

The test does **NOT** run `pnpm validate` (validate runs unit tests, not e2e). Per package.json, validate = typecheck + lint:check + format:check + test (unit).

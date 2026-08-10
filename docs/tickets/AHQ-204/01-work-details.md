# AHQ-204 — Interim: Early-Migrate add-feature Onto The Prebuilt Pattern

**Jira:** https://agentic-hq.atlassian.net/browse/AHQ-204 (Sub-task of
[AHQ-195](https://agentic-hq.atlassian.net/browse/AHQ-195))
**Completed:** 2026-08-10
**Related:** [AHQ-197](https://agentic-hq.atlassian.net/browse/AHQ-197) (the pattern),
[AHQ-202](https://agentic-hq.atlassian.net/browse/AHQ-202) (retains the registry-install proof),
[AHQ-201](https://agentic-hq.atlassian.net/browse/AHQ-201) (the remaining five workflows)

## Why (context)

AHQ-197 introduced the explicit parameter chain (`--build-mode` / `--ahq-package-root`) and made
`CompositionRoot` a required constructor parameter of `DefaultClaudeCodeTool`. Only math-workflow
was migrated; every other workflow CLI still called `new DefaultClaudeCodeTool()` and crashed at
startup with `TypeError: Cannot read properties of undefined (reading
'getIOMarshallerSessionFactory')` — an accepted mid-migration break.

However, AHQ-195 development itself uses the add-feature workflow (e.g. to run AHQ-198), so
add-feature had to work immediately — it could not wait for AHQ-202's planned slot (after the
first publish is proven). This Sub-Task pulled the migration portion of AHQ-202 forward.

## Changes

1. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ts-workflow/src/add-feature-cli.ts`
   — constructs the tool via `new DefaultWorkflowRuntime(process.argv)` /
   `runtime.getClaudeCodeTool()` and parses workflow args via
   `program.parse(runtime.getWorkflowArgs())` (the proven math-workflow pattern from AHQ-197).
   The `AGENTIC_HQ_WORKSPACE_ROOT` fail-fast check is unchanged — the env var is still
   dual-written by the bin wrappers until AHQ-200 retires it.
2. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/SKILL.md` — Variables gain
   `build-mode = $1` and `ahq-package-root = $2` (the `agentic-hq` CLI already passes both to
   every workflow skill); the command-output-string switches from the legacy
   `pnpm install && ln -sfn && tsx` chain to the shared `run-workflow.cjs` runner, mirroring
   math-workflow's SKILL.md.
3. `tsconfig.build.json` — add-feature's `ts-workflow/src/**/*` added to `include`, so the build
   compiles it into the staged release tree (`release/dist/...`). No `build-release.cjs` change
   was needed — it has no per-workflow logic.
4. `tests/integration/build/build-determinism.integration.test.ts` — staged-artifact assertion
   for the compiled `add-feature-cli.js` (and the math constant renamed to
   `MATH_WORKFLOW_JS_RELATIVE_PATH` now that there are two).
5. `src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.ts` — comment-only fix:
   the unmigrated-CLI break note pointed at "AHQ-200/201"; the remaining legacy CLIs are
   AHQ-201's scope (AHQ-200 is the env-var elimination), and add-feature is no longer among
   them.

## TDD record

- **Baseline**: `pnpm test:integration:build-determinism` green before any change.
- **RED**: added the staged `add-feature-cli.js` assertion; test failed on exactly that
  assertion (the staged tree lacked the file).
- **GREEN**: CLI migration + `tsconfig.build.json` include; test green. (Both were required
  together: compiling the unmigrated CLI is a type error, since the zero-arg
  `new DefaultClaudeCodeTool()` call no longer typechecks.)
- **Smoke runs** (compiled JS via the real `run-workflow.cjs`, plain node, no Claude):
  `--help` prints usage and exits 0 (proves module resolution + CompositionRoot wiring from the
  staged tree); missing `--ticket-id` produces commander's required-option error; `--ticket-id`
  with `AGENTIC_HQ_WORKSPACE_ROOT` unset hits the intended fail-fast error message.
- **REFACTOR + VERIFY**: comment fix above; integration test re-run green; `pnpm validate`
  fully green (typecheck, lint, format, 165 unit tests).
- The full interactive end-to-end (real Claude sessions) is exercised by the next
  `agentic-hq add-feature` run during AHQ-195 development.

## Documentation updates

- `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md` — Sub-Task list item 4 (AHQ-202)
  gained an inline **Updated 2026-08-10** note pointing at AHQ-204, and a dated addendum
  *"Update (2026-08-10) — add-feature Migration Pulled Forward As AHQ-204"* was appended
  recording the decision, the AHQ-204/AHQ-202 scope split, and the knock-on for AHQ-198 (the
  first publish now carries two migrated workflows).
- The Jira Sub-task itself was created by the human in the UI (2026-08-10) — the Jira MCP
  account lacked issue-create permission in the AHQ project.

## Out of scope (stays in AHQ-202)

Republishing a patch version and proving the full interactive four-agent add-feature flow runs
from a registry-installed package in a clean directory.

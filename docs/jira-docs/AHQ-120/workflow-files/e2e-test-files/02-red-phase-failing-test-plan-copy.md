# Plan: AHQ-120 — E2E RED Phase (Write ONE Failing E2E Test)

## Context

We are in the **e2e RED phase** of the TDD cycle for AHQ-120 ("TEMP Agentic HQ With Colours" Classwitch Override Project). The **unit RED → GREEN → REFACTOR cycle is already complete** — `ColourfulWorkflowSearchResultsImpl` exists and passes 2 unit tests in `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/`.

Now we need to drive the **remaining packaging/wiring** deliverables (`bin/*.cjs`, `src/cli/main.ts`, `src/classwitch-registry/override-registry.ts`, `scripts/infra/install-dev-*.sh`, `vitest.e2e.config.ts`, `test:e2e` script) via a single failing e2e test.

This is the RED phase only: write the test, watch it fail for the correct reason, do **not** build any of the missing implementation files — those are GREEN's job.

## Approach

**Minimal scaffold + ONE end-to-end test + confirmed failure.** Mirror the proven template at `agentic-hq/tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts` but:
- Use the override's (future) install script path
- Use the override's binary name `temp-agentic-hq-with-colours`
- Assert **ANSI colour codes + `Available workflows (with colours):` + `create-workflow`**
- Inline `runCliAndLogOutput` locally (can't import across package boundaries)

The test **will fail at the `install-dev-temp-agentic-hq-with-colours.sh` invocation** because that script does not exist yet — this IS the correct RED-phase failure. (Back-up failure mode: if something unexpectedly lets the install script invocation succeed, the subsequent `temp-agentic-hq-with-colours list` call will fail because the binary isn't linked. Either is a valid RED signal that "the Classwitch override wiring isn't in place yet".)

## Step 0 — Copy Approved Plan To Workflow Directory

**FIRST STEP AFTER PLAN APPROVAL** — before implementing anything:

Copy this plan file to `docs/jira-docs/AHQ-120/workflow-files/e2e-test-files/02-red-phase-failing-test-plan-copy.md` so it is preserved in the workflow record alongside the unit cycle's equivalent copy.

## Critical Files To Create (RED phase — test infra only, NO production files)

| File | Purpose |
| --- | --- |
| `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/vitest.e2e.config.ts` | E2E vitest config — mirror the existing `vitest.unit.config.ts` but include `tests/e2e/**/*.e2e.test.ts` |
| `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts` | **THE failing e2e test** |

## Critical Files To Modify (RED phase — packaging scripts)

| File | Change |
| --- | --- |
| `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/package.json` | Add `test:e2e` script. Consider leaving `validate` unchanged (it stays typecheck + `test:unit`) so that `pnpm validate` continues to be runnable during RED/GREEN cycles, and only promote e2e into validation at the e2e REFACTOR/VALIDATE stage. |

## Files NOT To Create In RED (deferred to GREEN)

- `bin/temp-agentic-hq-with-colours.cjs`
- `src/cli/main.ts`
- `src/classwitch-registry/override-registry.ts`
- `scripts/infra/install-dev-temp-agentic-hq-with-colours.sh`
- `README.md`, `eslint.config.js`, prettier config — **REFACTOR, not GREEN** (per feedback memory: VALIDATE is verification-only)

## Data Dictionary (Mini — for e2e RED)

Nothing new introduced; all concepts already exist from the unit cycle and AHQ-117:

| Concept | Interface | Impl | Notes |
| --- | --- | --- | --- |
| Colourful workflow listing results | `WorkflowSearchResults` | `ColourfulWorkflowSearchResultsImpl` | Already built in unit GREEN |
| Override's CLI bootstrap | *(shared)* `app` (from `agentic-hq/cli`) | `app.run()` — inherited, not re-implemented in override | — |
| Classwitch root registry | — | `rootServiceRegistry` (from `agentic-hq/classwitch-registry`) | Mutated at load time by override-registry side-effect import |
| Classwitch service factory | — | `serviceThatImplements<T>().interfaceWithClass(X)` (from `classwitch`) | Used by override-registry |

No new interfaces or classes needed in this e2e RED cycle.

## English Language Description

When the e2e test runs, it first *execSync*s `bash install-dev-temp-agentic-hq-with-colours.sh` from the 002 project root, which is expected to `pnpm install` and then `pnpm link --global` the 002 project's `temp-agentic-hq-with-colours` binary. It then creates a throwaway temp workspace under `/tmp/agentic-hq-test-workspaces/test-ws-{uuid}/`, resolves `PNPM_HOME` onto the test process's PATH, and invokes `temp-agentic-hq-with-colours list` from inside that temp workspace. Under the hood the globally-linked `temp-agentic-hq-with-colours.cjs` wrapper uses the 002 project's own `tsx` to run `src/cli/main.ts`, which side-effect-imports `override-registry.ts` (mutating **rootServiceRegistry** to bind the `WorkflowSearchResultsImpl` slot to **ColourfulWorkflowSearchResultsImpl**) BEFORE importing `{ app } from 'agentic-hq/cli'`, and finally calls `app.run()`. The shared **app** object asks the Classwitch registry to *loadClass* `WorkflowSearchResultsImpl`, gets back the overridden **ColourfulWorkflowSearchResultsImpl**, and asks it to *getWorkflowsListingString*. The **ColourfulWorkflowSearchResultsImpl** asks each of its two **Workspace**s to *getWorkflowListingString*, wraps the AHQ section in blue ANSI codes and the user section in red ANSI codes, and prepends a green-wrapped `Available workflows (with colours):` header. The resulting stdout is captured by the test and asserted to contain all three ANSI colour escape codes, the literal header text, and at least one known workflow name (`create-workflow`) as proof that the AHQ workspace's plugin tree is still being discovered through the override. In RED phase none of the plumbing from `bin/*.cjs` through `override-registry.ts` exists yet, so the test fails at the install-script invocation step.

## Project Design Requirements Compliance

Most design requirements from `docs/dev/project-design-requirements.md` are either already satisfied by the unit GREEN or will be validated during the e2e GREEN phase:

- **Interface / concrete-class pair for every concept** — Satisfied: `WorkflowSearchResults` + `ColourfulWorkflowSearchResultsImpl` already exist. No new concepts introduced at the e2e test level.
- **Tell, don't ask** — The e2e test exercises observable CLI output (stdout contents). It does NOT reach inside the impl's state — it treats the CLI as a black box and asserts on what the user sees. This is the purest possible "tell, don't ask" test shape.
- **No `instanceof` / private-field peeking in tests** (`feedback_no_instanceof_in_tests.md`) — Trivially satisfied: a black-box CLI test cannot possibly introspect types.
- **Classwitch Override files must carry design-intent comments** (`feedback_classwitch_root_project_comments.md`) — Design-intent comments are a **GREEN/REFACTOR** concern (when the files get created). Flag at top of e2e test file that the **absence** of `FORCE_COLOR=1` environment manipulation is deliberate (ColourfulWorkflowSearchResultsImpl emits ANSI unconditionally per AHQ-120 Add-On §3).
- **Avoid cached state** (`feedback_avoid_cached_state.md`) — Satisfied by construction at the unit-test level; not measurable at the e2e level.
- **Unique temp dirs** (`feedback_temp_dirs_need_uid.md`) — **Honoured**: the test uses `randomUUID()` to generate a fresh `test-ws-{uuid}` directory, following the `cross-workspace-list-workflows.e2e.test.ts` pattern verbatim.
- **Constructor injection + optional-with-defaults** (`feedback_constructor_injection_delegation.md`) — Not relevant at the e2e test level; the impl itself will need optional-with-defaults added during e2e GREEN (since Classwitch's no-arg `new Klass()` callsite requires it — deferred from unit GREEN per the `REFACTOR NOTE` already in the impl file).

What the e2e test CANNOT validate at its level (deferred to GREEN/REFACTOR review):
- Design-intent comment blocks in `main.ts`, `bin/*.cjs`, `override-registry.ts` (created in GREEN)
- How-to guide accuracy (reviewed in REFACTOR)
- Optional-with-defaults constructor on the impl (added in GREEN)

## Test File Detailed Design

**Path**: `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts`

**Shape** — 3 phases:

1. **Arrange** —
   - Emit `⚠️ SMELLY: pnpm link --global mutates global pnpm state` banner (copy from template)
   - `execSync('bash <scripts/infra/install-dev-temp-agentic-hq-with-colours.sh>', { cwd: REPO_ROOT, stdio: 'pipe', timeout: 30_000 })` — **this call fails in RED** (file does not exist)
   - Ensure `PNPM_HOME` is on PATH
   - Create `/tmp/agentic-hq-test-workspaces/test-ws-{randomUUID()}/` with `fs.mkdirSync(..., { recursive: true })`
2. **Act** —
   - Inline mini-helper (`runCliAndLogOutputLocal`) that matches the signature of `runCliAndLogOutput` in `agentic-hq/tests/e2e/helpers/cli-test-helper-functions.ts` — writes stdout+stderr to `/tmp/e2e-temp-agentic-hq-with-colours-list.log`, returns the file contents. Duplication over cross-package import is deliberate (same justification as AHQ-82 REFACTOR in the template).
   - Call `runCliAndLogOutputLocal('temp-agentic-hq-with-colours list', 'temp-agentic-hq-with-colours-list', 60_000, tempWorkspace)`
3. **Assert** — five `.toContain(...)` assertions:
   - `'\x1b[32mAvailable workflows (with colours):\x1b[0m'` — green header literal (colon per resolved Q1=b)
   - `'\x1b[34m'` — blue ANSI code appears somewhere (AHQ section)
   - `'\x1b[31m'` — red ANSI code appears somewhere (user section)
   - `'Available workflows (with colours)'` — header text (agnostic to colour wrapping — guards against wrong text)
   - `'create-workflow'` — proves AHQ workspace discovery is reachable through the override (resolved Q2=yes)

**Timeouts**: 60_000ms per test (test timeout), 30_000ms on install-script execSync. Mirrors the template exactly.

**Paths**:
- `REPO_ROOT = path.resolve(import.meta.dirname, '..', '..')` — the 002 project root
- `INSTALL_SCRIPT = path.join(REPO_ROOT, 'scripts', 'infra', 'install-dev-temp-agentic-hq-with-colours.sh')`

**Design-intent comments in the test file**:
- File header explains: "expects the install script and the full override wiring chain (bin → main → registry) to exist — this file will fail in RED until all of those exist in GREEN"
- Inline comment on the install-script `execSync` call: "RED: this fails at the file-not-found mode until `install-dev-*.sh` is created"

## Config File Design

**`vitest.e2e.config.ts`** — minimal, mirrors `vitest.unit.config.ts` shape:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'e2e',
    include: ['tests/e2e/**/*.e2e.test.ts'],
    environment: 'node',
    globals: true,
    pool: 'forks',
    fileParallelism: false,
    sequence: { concurrent: false },
    // No global timeout — each test sets its own via `it(..., 60_000)`
  },
});
```

No custom sequencer needed (we have only one e2e test, unlike agentic-hq's config).

## package.json Change

**Add** a single script entry:
```json
"test:e2e": "vitest run --config vitest.e2e.config.ts"
```

**Do NOT** change `validate` in this RED cycle — keep it as `pnpm typecheck && pnpm test:unit`. Reasoning: `pnpm validate` needs to stay runnable during RED/GREEN (ultrathink — if validate tries to run the e2e test while in RED, the whole `pnpm validate` pipeline fails, breaking unrelated tooling). Extending `validate` to include e2e is an e2e-REFACTOR / VALIDATE decision, not a RED-phase one.

## Run & Verify Failure (RED signal)

After writing everything:

1. Run `pnpm test:e2e` from the 002 project root. Expected: **failure** — `execSync` throws because `install-dev-temp-agentic-hq-with-colours.sh` does not exist (`ENOENT` / "No such file or directory"). This is the correct RED signal.
2. Run `pnpm typecheck` (or `pnpm validate`). Expected: **passes** — the test file's TypeScript compiles cleanly. The failing RED signal is runtime, not static.
3. If typecheck fails, fix the test file (import paths, types) — that's a TEST bug that must be fixed before we can claim RED.

## Verification Checklist Before Claiming RED Complete

- [ ] Plan file copied to `docs/jira-docs/AHQ-120/workflow-files/e2e-test-files/02-red-phase-failing-test-plan-copy.md`
- [ ] `vitest.e2e.config.ts` exists and is valid
- [ ] `package.json` has `test:e2e` script
- [ ] E2E test file exists and imports compile cleanly (`pnpm typecheck` passes)
- [ ] `pnpm test:e2e` fails for the CORRECT reason (install script not found, or equivalent chain-of-missing-files failure)
- [ ] `pnpm validate` still passes (typecheck + 2/2 unit tests green)
- [ ] No production-code files created (bin/, src/cli/, src/classwitch-registry/, scripts/infra/)
- [ ] `02-red-phase-failing-tests.md` summary doc written
- [ ] Jira comment posted
- [ ] `command-output.json` written
- [ ] Self-terminate skill invoked

## Last Step (Final Command Check)

**Recheck that all commands have been executed in the 02-jira-write-failing-test.md command** — including copying the plan file, creating output directories, adding Jira comment, writing command-output.json, and self-terminating.

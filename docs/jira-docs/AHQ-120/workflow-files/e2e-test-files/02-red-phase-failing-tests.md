# RED Phase Complete: AHQ-120 (e2e test)

**Jira**: [AHQ-120](https://agentic-hq.atlassian.net/browse/AHQ-120)
**Test Type**: e2e
**Phase**: RED (Failing Test Written)
**Generated**: 2026-04-23 21:00

---

## Test Created

**File**: `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts`

**Test**: `temp-agentic-hq-with-colours list via globally-linked override binary > prints a colourful listing (green header, blue AHQ section, red user section) that still includes core workflows from a separate workspace`

What this test verifies (once GREEN):
1. The install script (`scripts/infra/install-dev-temp-agentic-hq-with-colours.sh`) globally links the override's binary via `pnpm link --global`.
2. Running `temp-agentic-hq-with-colours list` from a fresh temp workspace under `/tmp/agentic-hq-test-workspaces/test-ws-{uuid}/` invokes the full Classwitch override wiring: `bin/*.cjs` → `src/cli/main.ts` (side-effect import of `override-registry.ts` BEFORE importing `app` from `agentic-hq/cli`) → `app.run()` → registry-loaded `ColourfulWorkflowSearchResultsImpl`.
3. stdout contains:
   - `\x1b[32mAvailable workflows (with colours):\x1b[0m` — green-wrapped header (colon per resolved Q1=b)
   - `\x1b[34m` — blue ANSI code (AHQ section wrapping)
   - `\x1b[31m` — red ANSI code (user section wrapping)
   - `Available workflows (with colours)` — literal header text (ANSI-agnostic, guards against text changes)
   - `create-workflow` — core workflow from A, proves discovery still works through the override (resolved Q2=yes)

**Failure Output** (ENOENT from missing install script — correct RED signal):

```
FAIL  |e2e| tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts
  > temp-agentic-hq-with-colours list via globally-linked override binary
    > prints a colourful listing (green header, blue AHQ section, red user section) that still includes core workflows from a separate workspace

Error: Command failed: bash /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/scripts/infra/install-dev-temp-agentic-hq-with-colours.sh
bash: /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/scripts/infra/install-dev-temp-agentic-hq-with-colours.sh: No such file or directory

  at tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts:110:7
```

**Why this is a VALID RED**: the test fails at runtime because the install script (and the entire Classwitch override wiring chain — `bin/*.cjs`, `src/cli/main.ts`, `src/classwitch-registry/override-registry.ts`) does not exist yet. This is exactly the failure mode the test is meant to drive out of existence during GREEN. No test bugs, no typecheck errors.

---

## Files Created

- `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/vitest.e2e.config.ts` — minimal e2e vitest config (`tests/e2e/**/*.e2e.test.ts`, forked, sequential, no global timeout).
- `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts` — the failing e2e test (modelled on `agentic-hq/tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts`).

## Files Modified

- `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/package.json` — added `"test:e2e": "vitest run --config vitest.e2e.config.ts"`. `validate` **deliberately unchanged** — still `pnpm typecheck && pnpm test:unit`, so `pnpm validate` remains runnable during e2e RED/GREEN cycles. Extending `validate` to include e2e is an e2e-REFACTOR/VALIDATE decision, not RED.

**Note**: No production files created in RED — that is GREEN-phase work. Specifically, these files do NOT exist yet and MUST be created in GREEN:
- `bin/temp-agentic-hq-with-colours.cjs`
- `src/cli/main.ts`
- `src/classwitch-registry/override-registry.ts`
- `scripts/infra/install-dev-temp-agentic-hq-with-colours.sh`

(Plus the impl's constructor likely needs optional-with-defaults added in GREEN — see the REFACTOR NOTE in `colourful-workflow-search-results-impl.ts`.)

Other deliverables (`README.md`, `eslint.config.js`, prettier config, how-to-guide review) are **REFACTOR**-phase work, not GREEN.

---

## Verification Results

| Check | Command | Result |
| --- | --- | --- |
| Typecheck clean | `pnpm typecheck` | ✅ Pass |
| E2E test fails (RED signal) | `pnpm test:e2e` | 🔴 Fails with `ENOENT` on install script (expected) |
| Unit tests still pass | `pnpm test:unit` | ✅ 2/2 pass |
| `pnpm validate` still green | `pnpm validate` | ✅ Pass (typecheck + 2/2 unit tests) |

---

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-120 e2e
```

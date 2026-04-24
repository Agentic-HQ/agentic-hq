# RED Phase Complete: AHQ-117 (e2e test)

**Jira**: [AHQ-117](https://agentic-hq.atlassian.net/browse/AHQ-117)
**Test Type**: e2e (manual AI-driven verification — NOT automated `pnpm e2e`)
**Phase**: RED (Failing Test Written)
**Generated**: 2026-04-20 19:37

---

## What The "Test" Is

Per the Jira AC, the e2e test for AHQ-117 is **manually run by the AI** (not an automated `pnpm test:e2e:*` spec). The procedure:

1. Stand up the temp override project at `/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/` with all the scaffolding a real Classwitch Override Project needs (bin wrapper, CLI main, override registry, install script, `file:` deps on `agentic-hq` + `classwitch`).
2. Run `temp-agentic-hq-with-colours list` and check the output.
3. **GREEN expectation**: listing with green header (`Available workflows (with colours):`), blue AHQ section, red user section.
4. **RED expectation**: hard failure because the main `agentic-hq` repo is not yet classwitch-converted (no widened exports, no root registry, no barrel, `app.ts` still `new WorkflowSearchResultsImpl()`).

For RED we invoke via `node bin/temp-agentic-hq-with-colours.cjs list` directly — no `pnpm link --global`, no global-state mutation.

---

## Test Scaffolding Created

All files are **test infrastructure only** (inside the temp override project) — zero changes to `/Users/stevepersonal/dev/agentic-hq/agentic-hq/**` or `/Users/stevepersonal/dev/agentic-hq/classwitch/**`.

### New files in the temp override project

| File | Purpose |
|---|---|
| `bin/temp-agentic-hq-with-colours.cjs` | CJS bin wrapper. Execs `tsx` against `src/cli/main.ts`. **Deliberately does not mutate `process.env`** — per AHQ-117 Add-On Section 9, workspace-root resolution is A's internal concern (GREEN-phase change to A's `src/cli/app.ts`). Carries a design-intent comment making the env-var-free contract explicit so future contributors don't "fix" it. |
| `src/cli/main.ts` | 3-line override CLI entry. Side-effect imports `../classwitch-registry/override-registry.js`, imports `{ app } from 'agentic-hq/cli'`, calls `app.run()`. Load-bearing import order: registry must come first. |
| `src/classwitch-registry/override-registry.ts` | Side-effect module. Imports `rootServiceRegistry` from `agentic-hq/classwitch-registry`, `ColourfulWorkflowSearchResultsImpl` locally, `serviceThatImplements` from `classwitch`, and the `WorkflowSearchResults` interface type from `agentic-hq`. Calls `rootServiceRegistry.overrideExistingServices({ WorkflowSearchResults: serviceThatImplements<WorkflowSearchResults>().interfaceWithClass(ColourfulWorkflowSearchResultsImpl) })`. No exports. |
| `scripts/infra/install-dev-temp-agentic-hq-with-colours.sh` | Mirrors `agentic-hq/scripts/infra/install-dev-agentic-hq.sh`, including the "⚠️ smelly" global-state warning and the `corepack`/`pnpm install`/`pnpm link --global` sequence. **Not run in RED** — documented for GREEN or user invocation. |

### Modified files in the temp override project

| File | Change |
|---|---|
| `package.json` | Added `bin` field (`"temp-agentic-hq-with-colours": "bin/temp-agentic-hq-with-colours.cjs"`) and `dependencies` block (`"agentic-hq": "file:../../agentic-hq"`, `"classwitch": "file:../../classwitch"`, `"commander": "^14.0.3"`). |
| `tsconfig.json` | Added `"allowImportingTsExtensions": true`. Needed because classwitch ships TS source only and its internal `.ts` imports trigger TS5097 otherwise. This is a TS-environment fix (per Jira Add-On Section 3 bullet on tsconfig requirements for consuming classwitch), not a main-repo concern. Without it, even a fully GREEN main repo could not be consumed by this override. |

### Not modified (critical — main-repo changes are GREEN's job)

- Anything under `/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/**`
- `/Users/stevepersonal/dev/agentic-hq/agentic-hq/package.json`
- Anything under `/Users/stevepersonal/dev/agentic-hq/classwitch/**`
- `/Users/stevepersonal/dev/agentic-hq/agentic-hq/bin/agentic-hq.cjs` (AHQ-117 Add-On Section 9 moves env-var logic out of this file in GREEN)

---

## Failure Output (RED evidence)

### 1. `pnpm typecheck` (`cd temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours && pnpm typecheck`)

```
src/classwitch-registry/override-registry.ts(31,37): error TS2307: Cannot find module 'agentic-hq/classwitch-registry' or its corresponding type declarations.
src/classwitch-registry/override-registry.ts(32,44): error TS2307: Cannot find module 'agentic-hq' or its corresponding type declarations.
src/cli/main.ts(28,21): error TS2307: Cannot find module 'agentic-hq/cli' or its corresponding type declarations.
 ELIFECYCLE  Command failed with exit code 2.
```

Three errors, all TS2307, all pointing at the missing subpath exports that GREEN will add to `agentic-hq/package.json` (`.`, `./cli`, `./classwitch-registry`). No test-infrastructure noise.

### 2. `node bin/temp-agentic-hq-with-colours.cjs list` (runtime)

```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './cli' is not defined by "exports" in /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/node_modules/agentic-hq/package.json imported from /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/src/cli/main.ts
    at exportsNotFound (node:internal/modules/esm/resolve:313:10)
    at packageExportsResolve (node:internal/modules/esm/resolve:660:9)
    at packageResolve (node:internal/modules/esm/resolve:773:12)
    ...
  code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'
```

Node's ESM resolver rejects the `agentic-hq/cli` subpath because it is not in `agentic-hq/package.json`'s `exports`. A clean, unambiguous RED signal.

---

## Why This Is A Valid RED

- **Every failure traces to the main `agentic-hq` repo's missing classwitch surface**, not to bugs in the new scaffolding files:
  - `agentic-hq/cli` not exported → GREEN fix: widen `agentic-hq/package.json` exports (Jira Add-On Section 1).
  - `agentic-hq/classwitch-registry` not exported → GREEN fix: create `src/classwitch-registry/root-registry.ts` in A and add it to `exports`.
  - `agentic-hq` bare specifier (`import type { WorkflowSearchResults } from 'agentic-hq'`) has no `.` subpath in `exports` → GREEN fix: create `src/index.ts` barrel in A and add `.` to `exports` with all 16 symbols (6 interfaces + 6 default classes + 4 composition helpers).
- **No scaffolding bugs caused the failure.** The override's code imports are all syntactically correct; they fail at module-resolution because the target subpaths don't exist in the dep yet.
- **Main repo unchanged.** `cd agentic-hq && pnpm test` reports **131/131 passing** — no regressions, because no main-repo files were touched.

---

## Sanity Checks

- `pnpm install --ignore-workspace` inside the override project succeeds; `agentic-hq@file:../../agentic-hq`, `classwitch@file:../../classwitch`, and `commander@14.0.3` all resolve to local symlinks.
- Override project unit test from the earlier unit-TDD cycle still passes (`pnpm test:unit` → 1/1). No regression.
- Main agentic-hq repo: `cd agentic-hq && pnpm test` → 131/131 passing. No regression.
- `grep` for `AGENTIC_HQ_WORKSPACE_ROOT` across the new scaffolding files returns nothing — honours the env-var-free contract from AHQ-117 Add-On Section 9.

---

## Ready for GREEN Phase

GREEN must:

1. **Widen `agentic-hq/package.json` exports** to include `.`, `./cli`, `./cli/program`, `./classwitch-registry`, plus the existing `./tools/claude-code`.
2. **Create `src/index.ts` barrel** in A exporting the 16 symbols (6 interfaces + 6 default classes + `Workspace`, `WorkflowRegistry`, `AhqWorkspaceImpl`, `CurrentUserWorkspaceImpl`).
3. **Create `src/classwitch-registry/root-registry.ts`** in A declaring all 6 services and exporting `rootServiceRegistry`.
4. **Swap every `new SomeImpl()` call site** (all 6 services, across `composition-root.ts`, `app.ts`, `claude-workflow-command-builder.ts`, `default-workflow-command.ts`, `claude-command-builder.ts`, etc.) to `rootServiceRegistry.loadClass('ServiceName')`.
5. **Centralise `AGENTIC_HQ_WORKSPACE_ROOT` resolution inside `app.run()`** (Jira Add-On Section 9) and delete the env-var line from `bin/agentic-hq.cjs`.
6. **Make `ColourfulWorkflowSearchResultsImpl`'s constructor args optional with defaults** (`AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl`) so classwitch's no-arg `new Klass()` works once the override is actually invoked.
7. Ensure `temp-agentic-hq-with-colours list` prints the colourful listing.
8. (Regression) `pnpm test:e2e:cross-workspace-list-workflows` and `pnpm test:e2e:cross-workspace-demo-math-workflow` still green.

Run the next command:

```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-117 e2e
```

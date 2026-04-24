# Plan: AHQ-117 — e2e RED Phase (Manual "Run `temp-agentic-hq-with-colours list`" test)

## Context

AHQ-117 converts the `agentic-hq` repo into a **Classwitch Root Project** (experiment branch only; not merged). The unit-TDD cycle is already complete — `ColourfulWorkflowSearchResultsImpl` exists in the temp override project at `/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/` with its own unit test (REFACTOR complete, 131/131 root tests green, no regressions).

This plan is for the **e2e RED phase**. The e2e "test" is **not** an automated `pnpm e2e` — it is an AI-driven manual verification: run `temp-agentic-hq-with-colours list` from the temp override project and observe the output. GREEN expectation is a colourful listing (green header, blue AHQ section, red user section). RED expectation is a hard failure **because the main `agentic-hq` repo has not been classwitch-converted yet** (subpath exports missing, root registry missing, `app.ts` still `new WorkflowSearchResultsImpl()`).

Per the Jira AC and per Uncle Bob's three laws, **RED writes only the test scaffolding** (bin wrapper, CLI main, override-registry module, install script, `file:` deps on `agentic-hq` and `classwitch`). It makes **zero changes** to the main `agentic-hq` source tree. That is GREEN's job.

**Failure mode RED captures:** running `node bin/temp-agentic-hq-with-colours.cjs list` invokes tsx on `src/cli/main.ts`, which tries to `import { app } from 'agentic-hq/cli'` and `import './classwitch-registry/override-registry.ts'` (which itself imports `rootServiceRegistry` from `'agentic-hq/classwitch-registry'`). Both subpaths are **not** in `agentic-hq/package.json`'s `exports` (only `./tools/claude-code` is). Expected failure: `Cannot find package 'agentic-hq/cli'` (or `/classwitch-registry`) — a clean, unambiguous RED signal.

---

## English Language Description

When the user runs `temp-agentic-hq-with-colours list`, the OS invokes the **`temp-agentic-hq-with-colours.cjs`** wrapper, which execs `tsx` against the override's **`main.ts`**. The **`main.ts`** first side-effect-imports **`override-registry.ts`**, which asks the shared **`rootServiceRegistry`** (imported from `agentic-hq/classwitch-registry`) to *overrideExistingServices* with `{ WorkflowSearchResults: ColourfulWorkflowSearchResultsImpl }`. The **`main.ts`** then imports the **`app`** object (from `agentic-hq/cli`) and *runs* it. The **`app`** (post-conversion; GREEN) asks the registry to *loadClass('WorkflowSearchResults')*, receives `ColourfulWorkflowSearchResultsImpl` (not the default `WorkflowSearchResultsImpl`), constructs it, and passes it into *createProgram*. When Commander dispatches `list`, the **`agentic-hq` program** asks the override instance to *getWorkflowsListingString*, which asks each injected **`Workspace`** to *getWorkflowListingString*, wraps them in ANSI blue/red, and prepends the green-wrapped `"Available workflows (with colours):"` header.

At RED time, that whole chain short-circuits on the very first subpath import (`agentic-hq/cli` / `agentic-hq/classwitch-registry`) — no registry lookup, no class construction, no output — because `agentic-hq` has not yet been classwitch-converted.

---

## Project Design Requirements Compliance

- **Class/interface pair** — the override class `ColourfulWorkflowSearchResultsImpl` already `implements WorkflowSearchResults` (the same interface the root default implements). Validated in the unit cycle.
- **"Switchable by a third-party developer"** — the whole point of this e2e. The RED test drives the override-side scaffolding (bin/cjs, main.ts, override-registry) that proves switchability *is* easy for a third party. If RED is reproducible and the failure is solely "main repo exports aren't widened yet", we've confirmed the override-side surface is minimal — the third-party pain-point really is just "did the root project expose the registry + `app`?" and nothing hidden in `agentic-hq` internals.
- **Tell-don't-ask / avoid cached state** — the new `main.ts` and `override-registry.ts` stay thin and declarative: side-effect import the override module, call `app.run()`. No caching, no state manipulation.
- Requirements that apply at **GREEN/REFACTOR level** (not this RED): ELD vs implementation alignment, the `no-restricted-imports` ESLint rule (Section 8 of the Jira), widened exports, and the new `how-to-create-your-own-classwitch-override-project.md`. Noted but out of RED scope.

---

## Step 0 — Copy This Approved Plan Into The Workflow Folder (MUST BE FIRST)

After the user approves this plan, **before doing anything else**:

- Write the approved plan to `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/jira-docs/AHQ-117/workflow-files/e2e-test-files/02-red-phase-failing-test-plan-copy.md`

*(Create the `e2e-test-files/` directory if it doesn't exist.)*

---

## Step 1 — Refer Back To Command For Full Step Details

The agent executing this plan **must** refer back to `02-jira-write-failing-test.md` (the command definition) for full details on every step — this plan summarises but does not duplicate. In particular, Steps 7b, 7d, 7e, 7f, 8, 9, 10, 11, 12 of the command define the acceptance shape for the RED-phase deliverables and the self-termination contract.

---

## Step 2 — Expand The Temp Override Project's Package Scaffolding

Edit `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/package.json` to add:

- `"bin": { "temp-agentic-hq-with-colours": "bin/temp-agentic-hq-with-colours.cjs" }`
- Under `dependencies`:
  - `"agentic-hq": "file:../../agentic-hq"`
  - `"classwitch": "file:../../classwitch"`
  - `"commander": "^14.0.3"` *(matches root agentic-hq; imported transitively via `app.run()`)*

Keep `devDependencies` (vitest/tsx/typescript/@types/node) as-is — they were set up in the unit cycle.

---

## Step 3 — Create The `bin/` CJS Wrapper

Create `bin/temp-agentic-hq-with-colours.cjs` mirroring `agentic-hq/bin/agentic-hq.cjs`, but:

- Points at the **override's own** `src/cli/main.ts` (not `agentic-hq`'s)
- Does **NOT** mutate `process.env` — per AHQ-117 Add-On Section 9 (new) and Section 3's corrected first bullet, workspace-root resolution is now A's internal concern, handled inside `app.run()` in the root project (a GREEN-phase change to `src/cli/app.ts`). The override wrapper leaves env vars alone; the absence of any `process.env.X = ...` line is load-bearing. Carry a short design-intent comment citing AHQ-117 Add-On Section 9, explaining that the wrapper is deliberately env-var-free and that workspace-root resolution is A's responsibility.
- Uses the override's own `node_modules/.bin/tsx` (installed via `file:` dep chain)

---

## Step 4 — Create The Override's CLI Entry

Create `src/cli/main.ts` — 3 lines (side-effect import ordering is load-bearing):

```ts
import '../classwitch-registry/override-registry.js';
import { app } from 'agentic-hq/cli';
app.run();
```

The `.js` extension on the registry import is Node-ESM-style (matches `agentic-hq`'s import convention; tsx resolves it to the `.ts` source).

---

## Step 5 — Create The Override Registry Module

Create `src/classwitch-registry/override-registry.ts`. Side-effect import that:

- Imports `rootServiceRegistry` from `agentic-hq/classwitch-registry`
- Imports `ColourfulWorkflowSearchResultsImpl` from `../workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.js`
- Imports `serviceThatImplements` from `classwitch`
- Imports the `WorkflowSearchResults` interface type from `agentic-hq`
- Calls `rootServiceRegistry.overrideExistingServices({ WorkflowSearchResults: serviceThatImplements<WorkflowSearchResults>().interfaceWithClass(ColourfulWorkflowSearchResultsImpl) })`
- Carries a clear "why this file exists" comment explaining it's the override-side plug-in point and the load-bearing nature of the side-effect-import ordering

This module has NO `export` (intentional — it's side-effect-only).

**Note:** `ColourfulWorkflowSearchResultsImpl`'s current constructor accepts two `Workspace` arguments. The registry binding is a class-level binding — classwitch `loadClass` gives back the class, the caller (`app.run()` post-GREEN) decides how to construct it. If the root `app.run()` post-conversion passes no args (relying on classwitch's no-arg `new Klass()`), we'll need to make the `ColourfulWorkflowSearchResultsImpl` constructor args optional with defaults (`new AhqWorkspaceImpl()` / `new CurrentUserWorkspaceImpl()`). **That defaulting work is GREEN, not RED.** For RED, the registry binding compiling (or the attempt failing at the import-resolution step *before* we get to construction) is what we need.

---

## Step 6 — Create The Install Script (But Do NOT Run `pnpm link --global`)

Create `scripts/infra/install-dev-temp-agentic-hq-with-colours.sh` mirroring `agentic-hq/scripts/infra/install-dev-agentic-hq.sh`, including:

- The "⚠️ This is smelly" warning block (re pnpm link --global mutating global state)
- `corepack` check
- `pnpm install` and `pnpm link --global`

**DO NOT run** `pnpm link --global` from this plan — that mutates global pnpm state on the user's machine (per `CLAUDE.md` and user-global rules). We will only run `pnpm install` (local, safe, creates `node_modules/agentic-hq` and `node_modules/classwitch` symlinks via `file:` deps). The global-link step stays documented for GREEN or user-run.

---

## Step 7 — Run The Test (Expect Failure)

Two failure captures, run from inside `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/`:

**7a.** `pnpm install --ignore-workspace` — should succeed; creates the node_modules symlinks to `file:` deps. If this itself fails (e.g. because pnpm refuses the file: link), capture that as the RED signal and document.

**7b.** `pnpm typecheck` — expected to fail with TS2307 or similar because:
- `import { app } from 'agentic-hq/cli'` — subpath not in `exports`
- `import { rootServiceRegistry } from 'agentic-hq/classwitch-registry'` — subpath not in `exports`
- `import type { WorkflowSearchResults } from 'agentic-hq'` — no `.` subpath in `exports`

**7c.** `node bin/temp-agentic-hq-with-colours.cjs list` — expected to fail at runtime with `Cannot find package 'agentic-hq/cli'` (or `/classwitch-registry`).

Capture the full stderr of both 7b and 7c — that's the documented RED evidence.

**What counts as a "valid RED":** any failure that traces to missing subpath exports / missing registry / missing barrel in the main `agentic-hq` repo. What counts as an "invalid RED" (must be fixed in RED): any failure caused by a typo/bug in the new override scaffolding files themselves. If the failure is invalid-RED, fix the scaffolding and re-run until failure is traced to the main repo's missing classwitch surface.

---

## Step 8 — Verify Main `agentic-hq` Unit Tests Still Green

Run `cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm test` — 131/131 expected (the override scaffolding lives outside agentic-hq, so it should not affect these).

---

## Step 9 — Write The RED-Phase Document

Create `docs/jira-docs/AHQ-117/workflow-files/e2e-test-files/02-red-phase-failing-tests.md` following the shape in Step 8 of the command — test file(s) created, test-type (`e2e`), failure output (from Step 7b + 7c), files created inventory, "Note: no main-repo changes in RED", and the "Ready for GREEN" block.

---

## Step 10 — Add Jira Comment On AHQ-117

Load `mcp__mcp-atlassian__jira_add_comment` via ToolSearch and post the comment per Step 9 of the command. Include: test type, file path(s), failure reason summary, and the red-phase doc path.

---

## Step 11 — Write Command Output JSON + Self-Terminate

- Write `{ "command-output-string": "RED phase complete for test-type e2e" }` to `command-output.json` in the input-output directory.
- Invoke `/agentic-hq-core-plugin:self-termination`.

---

## Step 12 — Recheck That All Command Steps Are Done

Read `02-jira-write-failing-test.md` one more time and tick off every Step — verify nothing was skipped (plan file copied, test written, test failing for the right reason, typecheck attempted, RED-phase doc written, Jira comment added, output JSON written, self-termination invoked).

---

## Files Created / Modified (Inventory)

**Created (test scaffolding only, all in the temp override project):**

- `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/bin/temp-agentic-hq-with-colours.cjs`
- `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/src/cli/main.ts`
- `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/src/classwitch-registry/override-registry.ts`
- `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/scripts/infra/install-dev-temp-agentic-hq-with-colours.sh`
- `docs/jira-docs/AHQ-117/workflow-files/e2e-test-files/02-red-phase-failing-test-plan-copy.md` *(Step 0)*
- `docs/jira-docs/AHQ-117/workflow-files/e2e-test-files/02-red-phase-failing-tests.md` *(Step 9)*

**Modified (scaffolding only — all in the temp override project):**

- `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/package.json` *(adds bin field + file: deps + commander)*

**Not modified (critical — this is what GREEN is for):**

- Anything under `/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/**`
- `/Users/stevepersonal/dev/agentic-hq/agentic-hq/package.json`
- `/Users/stevepersonal/dev/agentic-hq/classwitch/**`

---

## Verification (End-To-End)

- **RED evidence 1:** `pnpm typecheck` inside the override project fails with module-resolution error against `agentic-hq/cli` / `agentic-hq/classwitch-registry` / `agentic-hq` subpaths.
- **RED evidence 2:** `node bin/temp-agentic-hq-with-colours.cjs list` inside the override project fails at runtime with `Cannot find package 'agentic-hq/cli'` (or the equivalent subpath error).
- **Regression safety:** root `agentic-hq` `pnpm test` → 131/131 green. No agentic-hq files changed.
- **Main repo left untouched:** `git status` inside `/Users/stevepersonal/dev/agentic-hq/agentic-hq` shows no changes under `src/` and no changes to `agentic-hq/package.json`. Only additions under `docs/jira-docs/AHQ-117/workflow-files/e2e-test-files/`.
- **Plan-copy file present:** `docs/jira-docs/AHQ-117/workflow-files/e2e-test-files/02-red-phase-failing-test-plan-copy.md` exists.

---

## Out Of Scope (Deferred To GREEN Or Later)

- Running `pnpm link --global` to install the override binary globally on PATH — for RED we invoke via direct `node bin/...cjs` path.
- Widening `agentic-hq/package.json` exports.
- Creating `src/index.ts` barrel in `agentic-hq`.
- Creating `src/classwitch-registry/root-registry.ts` in `agentic-hq`.
- Swapping the 6 `new SomeImpl()` call sites in `agentic-hq` to `rootServiceRegistry.loadClass(...)`.
- `no-restricted-imports` ESLint rule (Section 8 of the Jira).
- The new `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md`.
- README section linking to the how-to.
- Regression e2e runs (`pnpm test:e2e:cross-workspace-list-workflows`, `…-demo-math-workflow`) — post-GREEN.
- Making `ColourfulWorkflowSearchResultsImpl`'s constructor args optional-with-defaults so classwitch's no-arg `new Klass()` works — GREEN.

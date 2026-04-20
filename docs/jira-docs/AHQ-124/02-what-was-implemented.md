# AHQ-124 — What Was Implemented

**Jira:** https://agentic-hq.atlassian.net/browse/AHQ-124
**Approved plan:** [`verbatim-plan-copy.md`](./verbatim-plan-copy.md)
**Branch:** `main` (no feature branch — per reporter's instruction for this refactor)

## Summary

Refactored the `agentic-hq` CLI entry point from a single monolithic file (`src/cli/agentic-hq-cli.ts`) into a **2-line `main.ts`** plus an **`app.ts`** that exports `const app = { run() {...} }` — matching the classwitch demo's bootstrap shape exactly.

This is a **pure file-shape refactor** — zero behaviour change. Every existing unit and e2e test continues to exercise the same code paths through the new file layout, and manual smoke tests of `agentic-hq list` / `agentic-hq math` produce identical pre-refactor output.

## Why

This refactor is the structural enabler for AHQ-117 (classwitch conversion of `agentic-hq`) and AHQ-120 (the `agentic-hq-with-colours` override repo):

- **AHQ-117** now becomes a surgical content swap inside `app.run()`: add a `src/classwitch-registry/root-registry.ts` file, and replace each `new SomeImpl()` call with a `rootServiceRegistry.loadClass(...)` call. The `main.ts`/`app.ts`/`bin` shape doesn't change.
- **AHQ-120**'s override repo can adopt the exact 3-line `main.ts` pattern from the classwitch demo (side-effect-import override registry + `import { app }` + `app.run()`) as soon as AHQ-117 is done, with no further changes needed to `agentic-hq` itself.

## The 5 File Changes

### 1. NEW `src/cli/main.ts` — 2-line entry point

```typescript
import { app } from './app.js';

app.run();
```

Plus a file-level comment (per reporter's "commenting requirement" for Classwitch Root Project files) explaining the main → app split: why it's deliberately tiny, how Override Projects reuse the same `app`, and pointing at the classwitch demo this mirrors.

### 2. NEW `src/cli/app.ts` — bootstrap const

```typescript
import { CompositionRoot } from '../kernel/composition-root.js';
import { WorkflowSearchResultsImpl } from '../workflow-discovery/workflow-listing/workflow-search-results-impl.js';
import { createProgram } from './agentic-hq-program.js';

export const app = {
  run(): void {
    const root = new CompositionRoot();
    const builder = root.getWorkflowCommandBuilder();
    createProgram(builder, new WorkflowSearchResultsImpl()).parse();
  },
};
```

Plus a JSDoc on the `app` export (per reporter's commenting requirement) explaining:
- Why this is a Classwitch Root Project pattern.
- Why the shape is a plain `const` with a `run` method — deliberately **not** an `App` interface with an `AppImpl` class (the interface/class layer would dilute the teaching signal and add ceremony with no functional benefit — see AHQ-124 discussion).
- How Override Projects plug in (side-effect import + `import { app } from 'agentic-hq/cli'` + `app.run()`).
- That AHQ-117 will later swap the `new WorkflowSearchResultsImpl()` call (and 5 other `new SomeImpl()` calls elsewhere) for `rootServiceRegistry.loadClass(...)` — not in scope here.

### 3. EDITED `bin/agentic-hq.cjs` — 1-line path change + comment

- Line 15 `cliPath` repointed from `src/cli/agentic-hq-cli.ts` → `src/cli/main.ts`.
- Added short comment above the line noting this points at the Classwitch Root Project's 2-line `main.ts` entry, and that Override Projects ship their own `bin/<override>.cjs` pointing at their own `main.ts`.
- Nothing else in the file changes — the `AGENTIC_HQ_WORKSPACE_ROOT` env var setup and `execFileSync` call are untouched.

### 4. EDITED `src/cli/agentic-hq-program.ts` — JSDoc only

- JSDoc updated from "Separated from agentic-hq-cli.ts (the entry point)" → "Separated from main.ts/app.ts (the entry point)".
- Added one short sentence explaining why keeping `createProgram` as its own factory matters for the Classwitch Root Project shape: it stays directly test-friendly for both the root and any Override Project that reuses it via `app.run()`.
- **Function body, signature, and exports of `createProgram` are untouched.** All 5 existing unit tests in `tests/unit/cli/agentic-hq-program.unit.test.ts` pass unchanged.

### 5. DELETED `src/cli/agentic-hq-cli.ts`

The original 23-line entry file is gone. Grep confirmed no code references remain in `src/` or `tests/`.

## Verification

Baseline green on current `main` before changes:
- ✅ `pnpm validate` (already confirmed by reporter before implementation)
- ✅ `pnpm test:e2e:cross-workspace-list-workflows` — 1/1 pass (3.27s)
- ✅ `pnpm test:e2e:cross-workspace-demo-math-workflow` — 1/1 pass (79.59s)

After refactor:
- ✅ `pnpm validate` — typecheck + lint + format + **131/131 unit tests** (1.17s)
- ✅ `pnpm test:e2e:cross-workspace-list-workflows` — 1/1 pass (3.01s)
- ✅ `pnpm test:e2e:cross-workspace-demo-math-workflow` — 1/1 pass (77.16s)
- ✅ Manual smoke: `agentic-hq list` produces identical pre-refactor output
- ✅ Manual smoke: `agentic-hq math` correctly dispatches through the real bin → `main.ts` → `app.run()` → `createProgram(...).parse()` path and spawns the Claude CLI as before
- ✅ Grep confirmation: no `agentic-hq-cli` references in `src/` or `tests/` (only surviving filename is the out-of-scope e2e test `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts` — cosmetic, invokes the bin, not a direct import)

## Intentionally Out Of Scope (per the Jira and the plan)

- Classwitch registration of services — that's AHQ-117.
- The `agentic-hq-with-colours` override repo — that's AHQ-120.
- Rename of `package.json` script keys containing `agentic-hq-cli` (e.g. `demo:agentic-hq-cli:string-reversal`) — they invoke `node bin/agentic-hq.cjs ...`, not the TS file directly, so they continue to work. Cosmetic rename is out of scope.
- Rename of `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts` — same reason. Cosmetic.
- Restructuring the `demo:plugin-direct:*` scripts — they invoke plugins directly, not through the main CLI.

## Acceptance Criteria Checklist

- [x] `src/cli/main.ts` exists with only the two lines `import { app } from './app.js'; app.run();` (plus required "why" file-level comment).
- [x] `src/cli/app.ts` exists exporting a `const app` with a single `run()` method containing the bootstrap previously in `agentic-hq-cli.ts` (plus required "why" JSDoc).
- [x] `src/cli/agentic-hq-program.ts` and `createProgram` are unchanged modulo the JSDoc reference update + one sentence of Classwitch rationale.
- [x] `bin/agentic-hq.cjs` points at `src/cli/main.ts` (line 15).
- [x] `src/cli/agentic-hq-cli.ts` deleted. No remaining code references in `src/` or `tests/`.
- [x] All existing unit tests pass via `pnpm validate` (131/131).
- [x] `pnpm test:e2e:cross-workspace-list-workflows` passes.
- [x] `pnpm test:e2e:cross-workspace-demo-math-workflow` passes.
- [x] Manual `agentic-hq list` and `agentic-hq math` produce pre-refactor output.

## Files In This Directory

- [`verbatim-plan-copy.md`](./verbatim-plan-copy.md) — the plan that was approved before implementation.
- [`02-what-was-implemented.md`](./02-what-was-implemented.md) — this file.

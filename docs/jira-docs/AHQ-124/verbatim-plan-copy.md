# AHQ-124 — Refactor Agentic HQ CLI to `app.run()` Bootstrap

Jira: https://agentic-hq.atlassian.net/browse/AHQ-124
Prior handoff notes (already agreed in previous session): `/tmp/ahq-124-impl-details.md`

## Context

The classwitch demo project (`classwitch/src/demo/root-demo-repo/app/`) uses a 2-line `main.ts` that imports an `app` const and calls `app.run()`. Override demos plug in an override registry with one extra side-effect import and otherwise reuse the same `app`.

AHQ-124 refactors `agentic-hq`'s CLI entry to the same shape so that **AHQ-117** (classwitch conversion of `agentic-hq`) becomes a surgical content swap inside `app.run()`, and **AHQ-120**'s `agentic-hq-with-colours` override repo can adopt the 3-line `main.ts` pattern without further changes to this repo.

Pure file-shape refactor — **zero behaviour change**. No new tests; existing unit + e2e suites already cover the full `bin → TS entry → createProgram → parse` path.

## Branch

Work directly on `main` (per user — no feature branch for this refactor).

## Verification Baseline (run BEFORE any edits)

User has already run `pnpm validate` on current `main` and confirmed it passes. Skipping that baseline step.

Still run the two e2e baselines from `/Users/stevepersonal/dev/agentic-hq/agentic-hq` to confirm pre-refactor behaviour:

1. `pnpm test:e2e:cross-workspace-list-workflows`
2. `pnpm test:e2e:cross-workspace-demo-math-workflow`

If either fails, stop and raise — the refactor can't claim "nothing broke" without a green baseline.

## The 5 File Changes

### 1. CREATE `src/cli/main.ts`

```typescript
import { app } from './app.js';

app.run();
```

**Required file-level comment** explaining the main → app split:
- This repo is a Classwitch **Root Project**. The entry point is deliberately just two lines (`import { app }; app.run();`) so that Classwitch **Override Projects** (e.g. the `agentic-hq-with-colours` repo planned in AHQ-120) can create their own `main.ts` that side-effect-imports an override registry and then runs the same `app` — exactly matching the classwitch demo pattern at `classwitch/src/demo/override-repos/first-override-repo/app/main.ts`.
- All bootstrap logic lives in `app.ts`. This file holds nothing an override would want to replace.

### 2. CREATE `src/cli/app.ts`

Lift the body of the existing `agentic-hq-cli.ts` into a `const app` export:

```typescript
import { CompositionRoot } from '../kernel/composition-root.js';
import { WorkflowSearchResultsImpl } from '../workflow-discovery/workflow-listing/workflow-search-results-impl.js';
import { createProgram } from './agentic-hq-program.js';

export const app = {
  run() {
    const root = new CompositionRoot();
    const builder = root.getWorkflowCommandBuilder();
    createProgram(builder, new WorkflowSearchResultsImpl()).parse();
  },
};
```

**Required JSDoc** on the `app` export explaining the design, including:
- This repo is a Classwitch **Root Project**. Exposing the bootstrap as a `const app = { run() {...} }` — rather than inlining it into the entry point — is the pattern that makes Classwitch **Override Projects** trivially cheap: an override repo's `main.ts` just side-effect-imports its override registry and then calls `app.run()`.
- Shape mirrors `classwitch/src/demo/root-demo-repo/app/app.ts` deliberately (plain `const` with a `run` method, not `App` interface + `AppImpl` class — see AHQ-124 discussion on why an interface/class layer would dilute the teaching signal).
- Override repos (AHQ-120) will `import { app } from 'agentic-hq/cli'` after side-effect-importing their override registry.
- AHQ-117 will later swap the `new WorkflowSearchResultsImpl()` construction (and 5 other `new SomeImpl()` calls elsewhere) for `rootServiceRegistry.loadClass(...)`. **Not in scope here.**

### 3. DELETE `src/cli/agentic-hq-cli.ts`

Current content (verified) — 23 lines, ends with `createProgram(builder, new WorkflowSearchResultsImpl()).parse();` at line 23.

After delete, grep must return no hits in `src/` or `tests/` code files:

```bash
# Only surviving hits should be the JSDoc at src/cli/agentic-hq-program.ts:4 (fixed in step 5),
# package.json script keys (out of scope), and the e2e test filename (out of scope).
```

### 4. EDIT `bin/agentic-hq.cjs` — 1 line + short comment

Line 15:

```diff
- const cliPath = path.join(__dirname, '..', 'src', 'cli', 'agentic-hq-cli.ts');
+ const cliPath = path.join(__dirname, '..', 'src', 'cli', 'main.ts');
```

Add a short comment above that line noting this points at the Classwitch Root Project's 2-line `main.ts` entry (which just runs `app.run()`), and that Classwitch Override Projects ship their own `bin/...cjs` pointing at their own 3-line `main.ts`.

Everything else (the `AGENTIC_HQ_WORKSPACE_ROOT` env var on line 19, the `execFileSync` call on line 22) stays untouched.

### 5. EDIT `src/cli/agentic-hq-program.ts` — JSDoc

Line 4:

```diff
- * Separated from agentic-hq-cli.ts (the entry point) so that:
+ * Separated from main.ts/app.ts (the entry point) so that:
```

While updating that JSDoc, also add one short sentence noting that the main.ts/app.ts split exists because this repo is a Classwitch Root Project, and keeping `createProgram` separate (rather than folded into `app.run()`) preserves its test-friendliness for both the root and any override.

Function body, signature, and exports of `createProgram` are untouched.

## Do Not Touch

- `src/cli/agentic-hq-program.ts` — `createProgram` body/signature/exports (only the 1 JSDoc line above).
- Any test file. The existing suites exercise the same paths:
  - `tests/unit/cli/agentic-hq-program.unit.test.ts` — 5 tests on `createProgram` with injected mocks.
  - `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts` — 7 tests.
  - All e2e tests in `tests/e2e/demo/` — spawn the real bin.
- `package.json` script keys containing `agentic-hq-cli` (lines ~26, 28, 48). They invoke `node bin/agentic-hq.cjs ...`, not the TS file directly. Rename is **cosmetic, out of scope**.
- The e2e test filename `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts`. Same reason — goes through the bin. Rename is **cosmetic, out of scope**.

## Verification (run AFTER edits)

From `/Users/stevepersonal/dev/agentic-hq/agentic-hq`:

1. `pnpm validate` — must pass 100%.
2. `pnpm test:e2e:cross-workspace-list-workflows` — exercises `agentic-hq list` via real bin.
3. `pnpm test:e2e:cross-workspace-demo-math-workflow` — exercises `agentic-hq math` via real bin.
4. Manual smoke (fresh terminal):
   - `agentic-hq list` → identical output to pre-refactor.
   - `agentic-hq math` → identical output to pre-refactor.
   - If `agentic-hq` not on PATH: `bash scripts/infra/install-dev-agentic-hq.sh` first.
5. Grep confirmation — must return no hits in `src/` or `tests/` code:
   - Content grep for `agentic-hq-cli` in `src/` and `tests/`: only surviving hit allowed is the updated JSDoc in `agentic-hq-program.ts` (should now say `main.ts/app.ts`, i.e. `agentic-hq-cli` gone).
   - Glob `**/agentic-hq-cli*` may still match the e2e test filename and the `package.json` keys — these are the known out-of-scope cosmetic items.

## Commit Workflow

Per project CLAUDE.md: **no direct `git add` / `git commit` / `git push`.**

When verification passes, report ready and ask the human to run `/commit`.

## Acceptance Criteria Checklist

- [ ] `src/cli/main.ts` exists, only the two lines `import { app } from './app.js'; app.run();` (plus optional file-level comment).
- [ ] `src/cli/app.ts` exists, exports `const app` with a single `run()` method containing the bootstrap previously in `agentic-hq-cli.ts`.
- [ ] `src/cli/agentic-hq-program.ts` and `createProgram` unchanged except for the 1-line JSDoc reference update.
- [ ] `bin/agentic-hq.cjs` line 15 points at `src/cli/main.ts`.
- [ ] `src/cli/agentic-hq-cli.ts` deleted. No code references in `src/` or `tests/`.
- [ ] `pnpm validate` passes.
- [ ] `pnpm test:e2e:cross-workspace-list-workflows` passes.
- [ ] `pnpm test:e2e:cross-workspace-demo-math-workflow` passes.
- [ ] Manual `agentic-hq list` and `agentic-hq math` produce pre-refactor output.

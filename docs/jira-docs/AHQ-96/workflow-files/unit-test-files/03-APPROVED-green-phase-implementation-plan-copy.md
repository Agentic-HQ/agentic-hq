# GREEN Phase Plan: AHQ-96 (unit test) — Minimal Implementation

## Context

[AHQ-96](https://agentic-hq.atlassian.net/browse/AHQ-96) is a structural refactor. Right now `DefaultClaudeCodeTool` is a 1-line pass-through (`new CompositionRoot().getTool().execute(...)`) and the actual Claude wiring lives inside `CompositionRoot.getTool()` — a method that pretends to be generic but is hard-wired to Claude. The class name lies.

Two RED-phase test files currently fail (5 TS errors + 1 runtime failure) and drive this refactor:

- `tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts` — a behavioural test that calls `new DefaultClaudeCodeTool(fakeRoot)` with a fake `CompositionRoot`. Fails at compile with `TS2554: Expected 0 arguments, but got 1`, and at runtime because pre-refactor `execute()` ignores the injected root.
- `tests/unit/kernel/composition-root.unit.test.ts` — three behavioural tests on public getters. Fails typecheck with 4× `TS2341: Property is private`.

The GREEN task is the minimum set of source changes that flips all 5 typecheck errors and the 1 runtime failure to green, while leaving all 11 existing `new DefaultClaudeCodeTool()` callsites and all integration/E2E tests untouched.

The post-refactor shape is dictated verbatim by the Jira description — there is no design freedom here at GREEN; the plan is mechanical.

## Jira Requirements (Numbered)

1. `DefaultClaudeCodeTool` `extends MarshalledCLITool`; class body is a single constructor calling `super(...)` with four wired components. No `execute()` method, no `Tool` field, no `implements` clause. → [Step 4]
2. `DefaultClaudeCodeTool`'s constructor accepts an optional `CompositionRoot` (default `new CompositionRoot()`). → [Step 4]
3. `CompositionRoot.getAhqWorkspace`, `getCurrentUserWorkspace`, `getCLIWrapper`, `getIOMarshallerSessionFactory` are public. → [Step 1]
4. `CompositionRoot.getTool()` is deleted. → [Step 2]
5. `CompositionRoot.getWorkflowCommandBuilder()` uses `new DefaultClaudeCodeTool(this)` internally. → [Step 3]
6. `src/interfaces/claude-code-tool.ts` is deleted. → [Step 5]
7. Re-export of `ClaudeCodeTool` is removed from `src/interfaces/index.ts`. → [Step 6]
8. All 11 existing `new DefaultClaudeCodeTool()` callsites continue to work unchanged (zero callsite edits required). → Guaranteed by default-arg constructor in [Step 4]; verified via `pnpm validate` in [Step 9].
9. SRP TSDoc headers are updated on every class/interface whose responsibility/wiring changes:
   - `DefaultClaudeCodeTool` — rewrite header. → [Step 4]
   - `CompositionRoot` — update header. → [Step 1]
   - `MarshalledCLITool` — review header. → [Step 7]
10. Unit tests for `DefaultClaudeCodeTool` and `CompositionRoot` are updated to reflect the new shape. → Already done in RED phase; GREEN just makes them pass.
11. Integration and E2E tests require zero changes and continue to pass. → Guaranteed by [Step 4]'s default-arg constructor and by not editing any non-target files; verified via `pnpm validate` in [Step 9].
12. `pnpm validate` passes in the project root. → [Step 9]
13. TDD methodology followed (Red → Green → Refactor → Verify). → This document is the GREEN phase; REFACTOR runs next.
14. **Out of scope**: converting `CompositionRoot` methods to `static`, renaming `CompositionRoot`, any second AI backend. → Not in plan.

## Project Design Requirements Compliance

Design requirements doc read at `docs/dev/project-design-requirements.md`. Relevant items and how this GREEN plan addresses them:

| # | Design Requirement | Plan Section Addressing It | Notes |
|---|-------------------|---------------------------|-------|
| D.1 | "A class/interface pair for every concept" | [Step 5]: delete empty `ClaudeCodeTool` interface | Deferred from strict interpretation: the interface is an empty marker, no callsite uses it as a type annotation, and its name would actively block `DefaultCodexTool`. The doc's own "balance" caveat covers this — the concept "Claude-specific tool" is carried by the class name `DefaultClaudeCodeTool` (which `extends MarshalledCLITool`). Steve has pre-approved (2026-04-19 decision log in AI summary). |
| D.2 | "Tell, don't ask" — push work into objects | [Step 4]: `DefaultClaudeCodeTool` *is* the wired tool (constructor-injected via `super(...)`) instead of *holding* one and forwarding | Aligns well. |
| D.3 | "Avoid cached state" — store minimal source data, derive dynamically | [Step 4]: wiring happens once in the constructor (legitimate initialisation, not cached mutable state). Pre-refactor, `execute()` wastefully instantiated a fresh `CompositionRoot` every call | Improved. |
| D.4 | Switchable concrete classes (classwitch) | [Steps 1, 2, 4]: `CompositionRoot` becomes purely generic; swapping in `DefaultCodexTool extends MarshalledCLITool` becomes "add one class" | Improved. |
| D.5 | SRP headers ("Does / Knows About / Knows Nothing About") | [Steps 1, 4, 7]: rewrite/update headers on all touched classes | Explicit AC bullet (#9 above). |

**GREEN-phase caveat**: This is the minimum-implementation phase. Per the harness rules ("ugly but working is acceptable"), deeper polish (e.g. naming nits, comment cleanup beyond the SRP headers, or extracting further interfaces) is deferred to REFACTOR. Nothing here is deferred that's required by the Jira ACs.

## Implementation Steps

### Step 0 — Copy approved plan to workflow dir (MANDATORY FIRST STEP)

Copy this plan file to:
`docs/jira-docs/AHQ-96/workflow-files/unit-test-files/03-APPROVED-green-phase-implementation-plan-copy.md`

Do this before any source edits.

### Step 1 — `src/kernel/composition-root.ts`: promote 4 getters to public, update header

Change the four `private` getters to `public` (just remove the `private` keyword):

```ts
getAhqWorkspace(): Workspace {
  return new AhqWorkspaceImpl();
}

getCurrentUserWorkspace(): Workspace {
  return new CurrentUserWorkspaceImpl();
}

getCLIWrapper(): CLIWrapper {
  return new PtyCLIWrapper();
}

getIOMarshallerSessionFactory(): IOMarshallerSessionFactory {
  return new JsonFileIOMarshallerSessionFactory(this.getCurrentUserWorkspace());
}
```

Update the SRP TSDoc header to reflect that it now exposes only generic infrastructure building blocks and no longer assembles backend-specific tools:

```ts
/**
 * CompositionRoot — Stateless wiring kernel for generic infrastructure components.
 *
 * SRP Does: Provide factory methods that instantiate and wire the default
 * concrete classes behind each generic infrastructure interface
 * (Workspace × 2, CLIWrapper, IOMarshallerSessionFactory), plus a top-level
 * WorkflowCommandBuilder factory. Each call returns a fresh instance.
 *
 * SRP Knows About: Which concrete class implements each generic infrastructure
 * interface, and how to wire them together (dependency order).
 *
 * SRP Knows Nothing About: Backend-specific tool assembly (that is the
 * responsibility of tool classes such as DefaultClaudeCodeTool), or how any
 * individual component works internally.
 */
```

### Step 2 — `src/kernel/composition-root.ts`: delete `getTool()`

Remove the entire method:

```ts
getTool(): Tool {
  return new MarshalledCLITool(
    this.getIOMarshallerSessionFactory(),
    this.getCLIWrapper(),
    new ClaudeCommandBuilder(this.getAhqWorkspace(), this.getCurrentUserWorkspace()),
    this.getCurrentUserWorkspace()
  );
}
```

Also remove the now-unused imports from the top of the file:

- `import type { Tool } from '../interfaces/tool.js';` (no longer referenced)
- `import { MarshalledCLITool } from '../tools/marshalled-io-tools/marshalled-cli-tool.js';` (no longer referenced)
- `import { ClaudeCommandBuilder } from '../tools/marshalled-io-tools/claude-code/claude-command-builder.js';` (no longer referenced)

### Step 3 — `src/kernel/composition-root.ts`: rewire `getWorkflowCommandBuilder()`

Change:
```ts
return new ClaudeWorkflowCommandBuilder(
  this.getTool(),
  this.getCLIWrapper(),
  this.getCurrentUserWorkspace()
);
```
to:
```ts
return new ClaudeWorkflowCommandBuilder(
  new DefaultClaudeCodeTool(this),
  this.getCLIWrapper(),
  this.getCurrentUserWorkspace()
);
```

Add the import:
```ts
import { DefaultClaudeCodeTool } from '../tools/marshalled-io-tools/claude-code/default-claude-code-tool.js';
```

### Step 4 — `src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.ts`: rewrite as MarshalledCLITool subclass

Replace the file's entire contents with:

```ts
/**
 * DefaultClaudeCodeTool — MarshalledCLITool pre-wired for Claude Code.
 *
 * SRP Does: Supply the four Claude-specific wiring arguments to
 * MarshalledCLITool's constructor — the session factory, CLI wrapper,
 * ClaudeCommandBuilder, and current-user workspace — sourced from a
 * CompositionRoot.
 *
 * SRP Knows About: That Claude's CLI command is built by
 * ClaudeCommandBuilder (wired with the AHQ + current-user workspaces),
 * and that the rest of the pipeline (session, CLI wrapper, working
 * directory) is shared generic infrastructure drawn from CompositionRoot.
 *
 * SRP Knows Nothing About: How MarshalledCLITool orchestrates the
 * execute() pipeline, how ClaudeCommandBuilder assembles Claude's CLI
 * arguments internally, or how I/O is marshalled.
 */
import { CompositionRoot } from '../../../kernel/composition-root.js';
import { MarshalledCLITool } from '../marshalled-cli-tool.js';

import { ClaudeCommandBuilder } from './claude-command-builder.js';

export class DefaultClaudeCodeTool extends MarshalledCLITool {
  constructor(root: CompositionRoot = new CompositionRoot()) {
    super(
      root.getIOMarshallerSessionFactory(),
      root.getCLIWrapper(),
      new ClaudeCommandBuilder(root.getAhqWorkspace(), root.getCurrentUserWorkspace()),
      root.getCurrentUserWorkspace()
    );
  }
}
```

Notes:
- No `execute()` method (inherited from `MarshalledCLITool`).
- No `implements ClaudeCodeTool` (interface will be deleted in Step 5).
- No `Tool` field (the object *is* the tool via inheritance).
- Default-arg constructor preserves all 11 zero-arg callsites.

### Step 5 — Delete `src/interfaces/claude-code-tool.ts`

Delete the file. It is the empty marker interface `ClaudeCodeTool extends Tool {}` with zero production type-annotation uses (verified via Grep: only the `implements` clause in `default-claude-code-tool.ts`, which Step 4 removes).

### Step 6 — Remove `ClaudeCodeTool` re-export from `src/interfaces/index.ts`

Delete line 21:
```ts
export type { ClaudeCodeTool } from './claude-code-tool.js';
```

### Step 7 — Review `src/tools/marshalled-io-tools/marshalled-cli-tool.ts` SRP header

The current header on `MarshalledCLITool` does not mention subclasses or layering with "Claude-specific". Read it, check whether subclassing by `DefaultClaudeCodeTool` introduces any contradiction, and only edit if a real contradiction exists. Expectation from my read: no edit required (the header describes the orchestration pipeline generically; subclasses supply constructor args but do not change what the class *does* at runtime).

If an edit is needed (determined at implementation time), the conservative addition would be a single clarifying line in the existing `SRP Knows Nothing About` block, e.g. "…or which backend-specific wiring a subclass supplies via constructor arguments." No structural rewrite.

### Step 8 — Run `pnpm typecheck` and `pnpm test:unit`

From project root (`/Users/stevepersonal/dev/agentic-hq/agentic-hq`):

- `pnpm typecheck` — expect the 5 TS errors from the RED phase to be gone.
- `pnpm test:unit` — expect all 4 new/rewritten tests (1 in `default-claude-code-tool.unit.test.ts` + 3 in `composition-root.unit.test.ts`) to pass, and no other unit tests to have regressed.

If any failure: fix the **minimum** necessary (GREEN rules — no gold-plating, no unplanned cleanup). Repeat until green.

### Step 9 — Run full `pnpm validate`

From project root:

```
pnpm validate
```

This runs typecheck + lint + all unit tests. All must pass.

Per AC #11, integration/E2E tests require zero changes — but `pnpm validate` only runs unit tests, so integration/E2E are implicitly not regressed by this refactor (no integration/E2E file is edited; the callsite contract is preserved by the default-arg constructor). Steve has already confirmed (AI summary Q2) that this Jira's `Test types: unit`, so running full integration/E2E suites is out of scope for GREEN.

### Step 10 — TODO: re-read `03-jira-minimal-implementation.md` command file

After Step 9 passes, re-read
`.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/03-jira-minimal-implementation.md`
(or the invoked command-file path) and execute its remaining instructions:

- Write the GREEN summary to `docs/jira-docs/AHQ-96/workflow-files/unit-test-files/03-green-phase-summary-of-what-was-implemented.md`.
- Add Jira comment via `mcp__mcp-atlassian__jira_add_comment` on AHQ-96.
- Present results to human.
- Write `command-output.json`.
- Self-terminate via `/agentic-hq-core-plugin:self-termination`.

Do **not** paraphrase the command file's instructions into this plan — re-read it so nothing is missed.

## What This GREEN Phase Does vs. What Is Deferred to REFACTOR

### Done at GREEN (even if not driven by a failing test)

Several AC bullets are not protected by a failing test but are still done at GREEN because they are **explicit Jira ACs** — leaving them for REFACTOR would mean GREEN ends with AC bullets unmet, and the automated workflow does not revisit ACs at REFACTOR. Specifically:

- [Step 2] Delete `CompositionRoot.getTool()` — explicit AC. Tests pass either way; deletion is mandatory per the Jira.
- [Step 3] Rewire `getWorkflowCommandBuilder()` to use `new DefaultClaudeCodeTool(this)` — explicit AC. Caught by typecheck (old body references deleted `getTool()`) but not by a unit test assertion.
- [Step 5] Delete `src/interfaces/claude-code-tool.ts` — explicit AC. Typecheck would be green if we left the empty file; deletion is the AC.
- [Step 6] Remove the `ClaudeCodeTool` re-export from `src/interfaces/index.ts` — explicit AC. Must follow Step 5 (the file's gone).
- [Steps 1, 4] SRP TSDoc header rewrites on `DefaultClaudeCodeTool` and `CompositionRoot` — explicit AC. Not protected by any test; verified by code review.
- [Step 7] `MarshalledCLITool` SRP header — review-only. Included at GREEN because the AC says "every class/interface whose responsibility or wiring changes". Edit only if a contradiction is found.

### Deferred to REFACTOR phase

Things that are legitimate polish opportunities but are **not** explicit ACs and have no failing test driving them. These are left for the REFACTOR agent to consider:

1. **Tone / depth polish of the SRP headers** — Step 4's new header and Step 1's updated header are functionally accurate but written quickly in GREEN. REFACTOR should re-read them alongside the whole file and tighten wording, remove any redundancy, and consider whether `MarshalledCLITool` would benefit from an explicit "designed to be subclassed by pre-configured variants like `DefaultClaudeCodeTool`" clarification (Step 7 conservatively left that out).
2. **Existing `REFACTOR:` comment in `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts:96-103`** — predates AHQ-96 and discusses plugin-dir scanning. Not part of AHQ-96, but a REFACTOR pass should glance at it to confirm no AHQ-96-specific obsolescence (e.g. "and from DefaultClaudeCodeTool (when running a command from the workflow runtime)" — this reference becomes slightly outdated once Claude wiring moves into `DefaultClaudeCodeTool` itself).
3. **Test-coverage gaps on `CompositionRoot`** — the RED v4 plan deliberately left `getCLIWrapper()` and `getWorkflowCommandBuilder()` without direct behavioural tests (rationale: `getCLIWrapper()` has nothing meaningful to assert beyond "has a `run` function"; `getWorkflowCommandBuilder()` is exercised indirectly via File 1). REFACTOR should revisit whether adding one more assertion (e.g. that `getWorkflowCommandBuilder()` produces a builder whose produced `WorkflowCommand` is runnable) would strengthen the suite.
4. **Shared `fakeWorkspace()` / `fakeSession()` helpers** — currently local to `default-claude-code-tool.unit.test.ts`. Other unit tests in the repo may benefit from a shared test helper. REFACTOR should check for duplication and extract if warranted.
5. **Import ordering / minor lint nits in the edited files** — GREEN does the minimum to compile; REFACTOR can run `pnpm format:check` (read-only) and clean up anything introduced by the edit.
6. **Constructor field redeclaration in `DefaultClaudeCodeTool`** — the new class has no fields of its own; super handles all wiring. No further refactor expected here, but REFACTOR should verify.

### Explicitly NOT in scope (per the Jira "Out of scope" section)

These are **neither** GREEN **nor** REFACTOR — they belong to future Jiras:

- Converting `CompositionRoot`'s instance methods to `static`.
- Renaming `CompositionRoot`.
- Any second AI backend (`DefaultCodexTool` etc.).

## Files Modified

- `src/kernel/composition-root.ts` — 4 getters made public; `getTool()` deleted; `getWorkflowCommandBuilder()` rewired; imports cleaned up; SRP header updated.
- `src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.ts` — rewritten.
- `src/interfaces/index.ts` — one line deleted.

## Files Deleted

- `src/interfaces/claude-code-tool.ts`

## Files Possibly Touched (header-review only)

- `src/tools/marshalled-io-tools/marshalled-cli-tool.ts` — read, decide whether a one-line clarification is needed; edit only if so.

## Verification (end-to-end)

1. **Typecheck passes**: `cd /Users/stevepersonal/dev/agentic-hq/agentic-hq; pnpm typecheck` → exit 0.
2. **Unit tests pass**: `cd /Users/stevepersonal/dev/agentic-hq/agentic-hq; pnpm test:unit` → all pass; specifically the 4 RED-phase tests flip from red to green.
3. **Full validate passes**: `cd /Users/stevepersonal/dev/agentic-hq/agentic-hq; pnpm validate` → typecheck + lint + unit tests all green.
4. **Callsite smoke**: no callsite changes made. A quick `grep -R "new DefaultClaudeCodeTool" src .agentic-hq tests | wc -l` should still show the original 11+ callsites untouched.

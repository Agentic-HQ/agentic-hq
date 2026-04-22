# AI Summary: AHQ-117

**Jira**: [AHQ-117](https://agentic-hq.atlassian.net/browse/AHQ-117)
**Title**: Convert Agentic HQ To A Classwitch Root Project (Experiment Branch Commit Only)
**Status**: Transitioned to In Progress (and assigned to Steve)
**Generated**: 2026-04-20 12:05

---

## My Understanding of This Task

This is an **experiment-branch-only** conversion of the `agentic-hq` repo into a **Classwitch Root Project**. The work lives solely on `experiment/ahq-117-convert-ahq-to-classwitch-root-project` and is explicitly **not** merged to main — the real conversion happens later in AHQ-121 via the automated `classwitch-converter-workflow`. The point of doing it manually now is to prove the conversion works end-to-end and produce a fully working example that the later AHQ-121 workflow can be built from.

The conversion touches 6 specific concrete classes (`DefaultClaudeCodeTool`, `DefaultCLICommand`, `ClaudeWorkflowCommandBuilder`, `DefaultWorkflowCommand`, `MarshalledCLITool`, `WorkflowSearchResultsImpl`). For each, the `new SomeImpl()` call sites (I've grepped them — they live in `composition-root.ts`, `app.ts`, `claude-workflow-command-builder.ts`, `default-workflow-command.ts`, and `claude-command-builder.ts`) get replaced with `rootServiceRegistry.loadClass('ServiceName')` calls. A new `src/classwitch-registry/root-registry.ts` declares the services, and a new `src/index.ts` barrel re-exports the 16 symbols (6 interfaces + 6 default classes + 4 composition helpers: `Workspace`, `WorkflowRegistry`, `AhqWorkspaceImpl`, `CurrentUserWorkspaceImpl`). `package.json` `exports` is widened to five subpaths (`.`, `./cli`, `./cli/program`, `./classwitch-registry`, `./tools/claude-code`).

On top of the root-project conversion, this Jira also builds a temporary, throwaway Classwitch Override Project at `/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours`. It overrides `WorkflowSearchResults` with a `ColourfulWorkflowSearchResultsImpl` that prints the listing with ANSI colours (header green, AHQ section blue, user section red). The purpose is to prove the override surface actually works — if the temp override can be built with just scaffolding files (`bin/*.cjs`, `src/cli/main.ts`, override-registry module, package.json) and no further changes back in `agentic-hq`, the conversion is sound. This is the "eat-your-own-dogfood" verification step.

Documentation deliverables: (1) a new `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` with intro, step-by-step worked example, and troubleshooting sections; (2) a new section in the main `README.md` pointing at that how-to; (3) improvements/fixes to the classwitch how-to guide at `/Users/stevepersonal/dev/agentic-hq/classwitch/docs/how-to-guides/how-to-convert-project-to-root-classwitch-project.md` as we find problems with it during the conversion; (4) a draft for a new classwitch-project Jira capturing those fixes. AHQ-124 (the `main.ts` → `app.run()` split) is already merged to main, so the structural CLI shape this Jira relies on is already in place — this Jira is the *content* swap inside `app.run()`.

## Research Findings

### Classwitch Framework Mechanics

I read `/Users/stevepersonal/dev/agentic-hq/classwitch/src/demo/root-demo-repo/` and `override-repos/first-override-repo/` to confirm the pattern. Summary:

- **Root registry shape**: `createEmptyRegistry().addNewServices({ ServiceName: serviceThatImplements<Interface>().interfaceWithClass(DefaultClass), ... })` returns a singleton `rootServiceRegistry`.
- **Call sites**: `const Klass = rootServiceRegistry.loadClass('ServiceName'); new Klass(...args)`. Constructor arguments stay identical — classwitch only swaps the class, not the construction signature.
- **Override projects**: side-effect-import a registry module that does `rootServiceRegistry.overrideExistingServices({ ... })` **before** `app.run()` runs. Ordering is load-bearing; mis-ordering silently defeats the override.
- **Type safety**: TypeScript refuses to compile if a class registered as `SomeService` doesn't actually `implement SomeInterface`, or if a service-name string literal is typo'd at a call site.
- **Runtime requirements**: classwitch ships TS source only — consumers need `tsx`/`ts-node`/vitest/bundler (not raw `node` on compiled JS). `agentic-hq` already runs through `tsx` via `bin/agentic-hq.cjs`, so this is fine.

### Classwitch How-To Guide Quality

The existing guide at `classwitch/docs/how-to-guides/how-to-convert-project-to-root-classwitch-project.md` uses **agentic-hq itself as the running example** and is largely accurate for the 5 classes it lists, but it has at least one known gap already visible from reading: it only covers 5 classes (this Jira is adding `WorkflowSearchResults` as a 6th), and it hand-waves the `package.json` `exports` widening as a single-line change when in practice a whole barrel file (`src/index.ts`) is required. We'll find more gaps during the actual conversion and capture them in the AHQ-124 doc-fixes Jira draft.

### ANSI Stripping In Node Pipes

When a CLI is spawned via `execFile`/`spawn` in a Node test (not a TTY), `stdout` is not a terminal and many libraries suppress ANSI codes. For the e2e test of the temp override's colourful listing, the `ColourfulWorkflowSearchResultsImpl` should emit raw `\x1b[...m` sequences unconditionally (hard-coded, no colour-detection) — that's more robust than trying to set `FORCE_COLOR=1` in the test environment, and it matches AHQ-120's approach.

### Verified: AHQ-124 Is Done

`git log main..HEAD` is empty, and the most recent commit on main (`f082593`) is "AHQ-124 Refactor: Agentic HQ CLI To Use Generic app.run() Bootstrap Model". I've read `src/cli/main.ts` and `src/cli/app.ts` — the `app = { run() { ... } }` shape is in place and the `new WorkflowSearchResultsImpl()` swap point is clearly called out in the file header as "AHQ-117 will later convert this". This Jira lands cleanly on top of AHQ-124 with no prior-art cleanup needed.

## Project Design Requirements

**File**: `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/dev/project-design-requirements.md`

The most relevant requirements for this Jira:

- **"Class/interface pair for every concept"** — this Jira is the direct realization of the design-doc promise that every concrete class should be switchable. The 6 services being registered already have interfaces (verified by grep), so the precondition is met.
- **"Make every concrete class switchable by a third-party developer via classwitch"** — literally quoted in the design doc (line 57–60). AHQ-117 is where this promise starts being delivered on for the first 6 classes.
- **"If someone wants to replace just one small aspect with their own concrete class, could they do it easily?"** — the temp override project is the direct test of this. If the override can be built with scaffolding-only files and no changes back to `agentic-hq`, we pass the test.
- **"Tell, don't ask" / avoid cached state** — relevant when writing the new `root-registry.ts` and the new `ColourfulWorkflowSearchResultsImpl`: both should stay thin, delegating to the workspace objects rather than accumulating state. The current `WorkflowSearchResultsImpl` (which we're keeping as the *default* while also making it switchable) already follows this pattern, so the override should mirror its style.

**Potentially challenging**: the "Concept Table" and "Data Dictionary" + "English Language Description" sections in the design doc are specified as planning-doc requirements. This Jira doesn't introduce new concepts (every class already exists) so it's debatable whether these are required for a conversion Jira. See question 6 below.

## Questions for Human

### Question 1: Header wording for the temp override — which spelling?

The AHQ-117 acceptance criteria say the override prints:

> `Available workflows (with colours):`

but the AHQ-120 code sketch (reproduced in AHQ-120's body) uses:

> `Available (colourful) workflows:`

These are different strings. The AHQ-117 temp test is what this Jira is building, so I'll default to the AHQ-117 wording unless you say otherwise. Confirm?

**Human's Response**:
> I've fixed https://agentic-hq.atlassian.net/browse/AHQ-120 to match "Available workflows (with colours):"

---

### Question 2: CLI binary name for the temp override — `agentic-hq-with-colours` or `temp-agentic-hq-with-colours`?

AHQ-117 AC literally says:

> run "agentic-hq-with-colours list"

(no `temp-` prefix). AHQ-120's add-on uses `temp-agentic-hq-with-colours` because AHQ-120 is *itself* the temp practice project and wants to reserve `agentic-hq-with-colours` for the future published-for-real project.

For this Jira's temp override, I'll default to **`agentic-hq-with-colours`** (matching AHQ-117 AC verbatim). This also means AHQ-120 will need to rename if it wants `temp-` — but that's AHQ-120's problem. Confirm?

**Human's Response**:
> I've fixed the AHQ-117 Jira to use temp-agentic-hq-with-colours everywhere.

---

### Question 4: The classwitch-doc-fixes Jira draft — where should it live?

The Jira text (Section 7) says to put the draft at:

```
docs/jira-docs/AHQ-124/classwitch-jira-draft-for-fixes-and-improvements-to-classwitch-how-to-guide.md
```

— but AHQ-124 is **already Done** (it's the `main.ts`/`app.run()` refactor, unrelated to the classwitch docs). Putting a draft for a new classwitch Jira inside an unrelated closed Jira's doc folder feels wrong. Options:

- **(a)** Follow the Jira literally and put it under `docs/jira-docs/AHQ-124/...` even though it's odd.
- **(b)** Put it under this Jira's workflow folder: `docs/jira-docs/AHQ-117/workflow-files/classwitch-jira-draft-for-fixes-and-improvements-to-classwitch-how-to-guide.md` — which is where discovery of the issues actually happened.
- **(c)** Put it somewhere else.

My recommendation: **(b)**. The Jira body probably meant "under a docs/jira-docs subfolder" and the AHQ-124 reference is a typo/stale.

**Human's Response**:
> Fixed in Jira to docs/jira-docs/AHQ-117/draft-future-jiras/classwitch-jira-draft-for-fixes-and-improvements-to-classwitch-how-to-guide.md - please use that.

---

### Question 5: `CompositionRoot`'s internal wiring after the conversion — `new` or `loadClass`?

Currently `src/kernel/composition-root.ts` centrally constructs the default impls:

```ts
getWorkflowCommandBuilder(): WorkflowCommandBuilder {
  return new ClaudeWorkflowCommandBuilder(
    new DefaultClaudeCodeTool(this),
    this.getCLIWrapper(),
    this.getCurrentUserWorkspace()
  );
}
```

After AHQ-117, `CompositionRoot` is listed in the Jira's "Deliberately Not Exported" section — so it stays as **internal** wiring. But *inside* `CompositionRoot`, do the `new DefaultClaudeCodeTool(this)` / `new ClaudeWorkflowCommandBuilder(...)` calls stay as `new`, or do they become `rootServiceRegistry.loadClass('ClaudeCodeTool')` too?

My read of the Jira: every `new SomeImpl()` for the 6 target classes gets converted, **including** the ones inside `CompositionRoot`. Otherwise `CompositionRoot` silently blocks overrides by always constructing the defaults directly. So I'll default to **convert `CompositionRoot`'s internal `new` calls to `loadClass` too**. Confirm?

(Side effect: `CompositionRoot` becomes a much thinner wrapper, and some of its factory methods — like `getWorkflowCommandBuilder()` — might become redundant. I won't delete anything in this Jira; cleanup can be a later refactor.)

**Human's Response**:
> **All** instances of "new <class>" must be converted across the entire codebase, otherwise what's the point of making them switchable?  Please make a change to the /Users/stevepersonal/dev/agentic-hq/classwitch/docs/how-to-guides/how-to-convert-project-to-root-classwitch-project.md doc to make this **very** clear for any AI reading it in the future (no need to include in the Jira - needs fixing straight away please)

---

### Question 6: Data Dictionary / English Language Description — required for a *conversion* Jira?

The project design requirements (`project-design-requirements.md`) specify that planning should produce a "Data Dictionary" table and an "English Language Description" paragraph. Those sections are framed around introducing *new* concepts during design. This Jira doesn't add concepts — every class and interface already exists; we're just making them switchable.

My default: **skip** formal Data Dictionary / ELD sections for this Jira. Instead, the existing classwitch How-To Guide's Step 2 table (which already lists the 5 classes) plus the table in the Jira body (6 services) serves the same purpose. Agree?

**Human's Response**:
> Fine to skip.

---

## Files I Reviewed

- `package.json` — current `exports` block is minimal (one subpath). Widening it is item #1 on the Jira.
- `src/cli/main.ts` — confirmed AHQ-124's 2-line entry is already in place.
- `src/cli/app.ts` — confirmed `app.run()` exists and already has an inline comment flagging the `new WorkflowSearchResultsImpl()` swap point for this Jira.
- `src/cli/agentic-hq-program.ts` — `createProgram(builder, searchResults)` factory; stays as-is, used by unit tests.
- `src/kernel/composition-root.ts` — currently central wiring with `new DefaultClaudeCodeTool`, `new ClaudeWorkflowCommandBuilder` etc. Key file for this Jira (see question 5).
- `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts` — the class being registered as `WorkflowSearchResults` service. Currently `new`'d in `app.ts:46`.
- `src/workflow-discovery/interfaces/workflow-search-results.ts` — the interface the override must implement.
- `src/workflow/claude/claude-workflow-command-builder.ts:36` — `new DefaultWorkflowCommand(...)` call site.
- `src/workflow/workflow-command/default-workflow-command.ts:26` — `new DefaultCLICommand(...)` call site.
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts:70` — another `new DefaultCLICommand(...)` call site.
- `bin/agentic-hq.cjs` — points at `src/cli/main.ts` (post AHQ-124). Sets `AGENTIC_HQ_WORKSPACE_ROOT` env var — relevant when writing the override's `bin/*.cjs` wrapper (must point at *override's* root, not the dep root).
- `scripts/infra/install-dev-agentic-hq.sh` — pattern to mirror in the override's `install-dev-<override>.sh`. Includes a "smelly, mutates global pnpm state" warning block that the override's script should also carry.
- `README.md` — need to add a new section pointing at the new how-to guide.
- `classwitch/docs/how-to-guides/how-to-convert-project-to-root-classwitch-project.md` — the guide we're following; known to be 5-class only and to gloss over exports details.
- `classwitch/src/demo/root-demo-repo/app/app.ts` + `root-demo-repo/classwitch-registry/root-demo-registry.ts` + `override-repos/first-override-repo/classwitch-registry/first-override-registry.ts` — confirmed the exact pattern to mirror.
- `docs/dev/project-design-requirements.md` — surfaced relevant design principles (class/interface pair per concept, tell-don't-ask, avoid cached state).

### Most Important Takeaways

1. **AHQ-124 is already done and on main** — the `main.ts` → `app.ts` → `app.run()` shape is in place. This Jira is the *content* swap inside `app.run()`, not a structural change. No prior-art cleanup needed.
2. **Only 6 grep hits for `new DefaultX/MarshalledCLITool/WorkflowSearchResultsImpl` outside tests** — scope is small and surgical. They live in 5 source files.
3. **Every target class already `implements` a formal interface** — Step 3 of the classwitch how-to is a no-op for this project.
4. **The hard dependency chain** for this Jira is: (a) widen `package.json` exports → (b) create `src/index.ts` barrel → (c) create `src/classwitch-registry/root-registry.ts` → (d) swap the 6 call sites → (e) build the temp override project at `temp-test-workspaces/...` → (f) verify existing tests still green + new override's unit + e2e tests green → (g) write the docs.

## Test Types And Tests We Will Be Implementing

**Test types: `unit, e2e`** (in that order, each with full RED → GREEN → REFACTOR → VALIDATE cycle)

Per the updated Jira Testing section, the model is deliberately asymmetric: **no new unit tests in the main `agentic-hq` project**, and the e2e test is a **manually run** verification against a hand-created temp override project — not a `pnpm e2e` automated test in the main repo.

### Unit Tests

**Scope**: only in the temp override project. No new unit tests in `agentic-hq` itself.

**In `agentic-hq` repo** — existing unit tests must stay green (regression safety net), but we are **not writing any new unit tests here**:

- `tests/unit/cli/agentic-hq-program.unit.test.ts` — existing 5 tests for `createProgram`; expected to stay green after the classwitch swap.
- `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts` — existing 7 tests for `WorkflowSearchResultsImpl`; expected to stay green.
- `tests/unit/**` for each of the 6 target classes — classes themselves don't change, only how they're constructed in call sites; expected to stay green.
- `pnpm validate` must stay green end-to-end (type-check + lint + unit tests).

**In the temp override project (`/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/`):**

- **New**: `tests/unit/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.unit.test.ts` — verifies:
  - `getWorkflowsListingString()` emits the header literal `Available workflows (with colours):` wrapped in ANSI green `\x1b[32m...\x1b[0m`.
  - AHQ section wrapped in ANSI blue `\x1b[34m...\x1b[0m`.
  - User section wrapped in ANSI red `\x1b[31m...\x1b[0m`.
  - `registerWorkflowsWith(registry)` delegates to both workspaces (spy on workspace, assert both `registerWorkflowsWith` calls happen).
- The override project will have its own `vitest.unit.config.ts` so its tests run with `pnpm test:unit` inside that dir.

### E2E Tests

**Primary e2e (manual, not automated pnpm e2e)**

During the e2e RED phase, we hand-create the temp override project at:

```
/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/
```

with its own `temp-agentic-hq-with-colours` CLI binary, and its `ColourfulWorkflowSearchResultsImpl` override of `WorkflowSearchResults`. The e2e test procedure:

- **RED**: Run `temp-agentic-hq-with-colours list`. Expected to **FAIL** before the main-project classwitch conversion is complete — document the failure (and its exact cause) as evidence RED is genuine.
- **GREEN**: After the classwitch conversion in the main project is in place and the override project is fully wired up, run the same command again. Expected to **SUCCEED** and print the listing with the green header, blue AHQ section, and red user section — all three colours visible in the terminal.

This is **not** an automated `pnpm e2e` test. It is an AI-driven manual verification: the AI runs the command, captures the output, confirms the colours are present. No Playwright, no vitest config in the main repo pointing at the override project.

**Regression e2e (post-GREEN, in main `agentic-hq` repo)**

Part of the same e2e cycle (run after GREEN implementation work is done) — prove no regressions by running the two existing automated e2e tests:

- `pnpm test:e2e:cross-workspace-list-workflows` — `agentic-hq list` still produces the same output as before the conversion.
- `pnpm test:e2e:cross-workspace-demo-math-workflow` — `agentic-hq math` still produces the same output.

Both must be green. (The other e2e tests — `cross-workspace-string-reversal`, `cross-workspace-quick-jira-workflow`, `string-reversal-workflow-in-new-workspace-lists-and-executes`, `agentic-hq-cli-string-reversal` — all go through the same `main.ts → app.run() → createProgram().parse()` path, so they should also stay green as a broader safety net, but only the two above are Jira-AC-named.)

## Agreed Answers (Resolved)

1. **Header wording** — use `Available workflows (with colours):`. Human has updated AHQ-120's Jira body to match so it's consistent across both Jiras.
2. **CLI binary name** — use `temp-agentic-hq-with-colours`. Human has updated AHQ-117's Jira AC accordingly (confirmed by re-reading the Jira post-edit).
4. **Classwitch-doc-fixes draft path** — `docs/jira-docs/AHQ-117/draft-future-jiras/classwitch-jira-draft-for-fixes-and-improvements-to-classwitch-how-to-guide.md`. Human has updated AHQ-117's Jira body to reflect this.
5. **Scope of `new` → `loadClass` conversion** — **ALL instances across the entire codebase** must be converted, including `CompositionRoot`'s internal wiring and any other helper/builder that hard-codes `new DefaultSomething()`. A partial conversion silently defeats overrides with no error message. The classwitch How-To Guide at `/Users/stevepersonal/dev/agentic-hq/classwitch/docs/how-to-guides/how-to-convert-project-to-root-classwitch-project.md` has been updated **immediately** with a prominent ⚠️ callout block at the start of Step 5 making this rule unmistakable for future AI agents. (This classwitch-doc fix is separate from — and not included in — this Jira's scope, per human's request.)
6. **Data Dictionary / ELD sections** — skipped for this conversion Jira. The service tables in the Jira body and the classwitch How-To Guide's Step 2 table serve the same purpose.

## Ready for Next Step

All questions above need your response. Once resolved, I'll update this summary with the agreed answers and move on to the next step (test-writing phase).

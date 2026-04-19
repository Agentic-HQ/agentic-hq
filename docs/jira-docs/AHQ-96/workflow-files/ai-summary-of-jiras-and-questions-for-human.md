# AI Summary: AHQ-96

**Jira**: [AHQ-96](https://agentic-hq.atlassian.net/browse/AHQ-96)
**Title**: Refactor DefaultClaudeCodeTool so it actually owns Claude-specific wiring
**Status**: Transitioned to In Progress, assigned to Steve Halso
**Generated**: 2026-04-19

---

## My Understanding of This Task

This is a small, tightly-scoped **structural refactor** (no behaviour change). Right now `DefaultClaudeCodeTool` is a 1-line pass-through that creates a fresh `CompositionRoot` on every `execute()` call and delegates to `CompositionRoot.getTool()`. The class name lies: it contains zero Claude-specific code, and the actual Claude wiring (specifically `ClaudeCommandBuilder`) has leaked into `CompositionRoot.getTool()` — a method that *pretends* to be a generic tool factory but is hard-wired to Claude.

The fix (Option C from the pre-existing report — already approved by Steve on 2026-04-19) is to turn `DefaultClaudeCodeTool` into a **pre-configured subclass** of `MarshalledCLITool`. Its entire body becomes one constructor that calls `super(...)` with the four Claude-wired components. No `execute()` method (inherited), no `Tool` field, no `implements` clause. The default-arg constructor (`root: CompositionRoot = new CompositionRoot()`) preserves all 11 existing zero-arg callsites verbatim.

In parallel, `CompositionRoot` becomes purely generic: the four building-block getters (`getAhqWorkspace`, `getCurrentUserWorkspace`, `getCLIWrapper`, `getIOMarshallerSessionFactory`) go public, `getTool()` is deleted, and `getWorkflowCommandBuilder()` is rewired to use `new DefaultClaudeCodeTool(this)`. The empty marker interface `ClaudeCodeTool extends Tool {}` is deleted along with its re-export from `src/interfaces/index.ts` — it is not used as a type annotation anywhere in production code, and would actively block a future `DefaultCodexTool` (which couldn't sensibly `implements ClaudeCodeTool`).

**In scope**: `default-claude-code-tool.ts`, `composition-root.ts`, delete `src/interfaces/claude-code-tool.ts` and its re-export; update SRP TSDoc headers on every touched class/interface; update unit tests. **Out of scope**: making `CompositionRoot`'s methods `static`, renaming `CompositionRoot`, any second AI backend. **Explicitly zero** callsite edits required — all 11 `new DefaultClaudeCodeTool()` sites continue to work untouched. **Explicitly zero** integration/E2E test changes.

## Research Findings

No external research required. The Jira description is unusually complete: the target code shape, the reasoning, the design alternatives, and the blast radius are all specified. The pre-existing report at `docs/jira-docs/AHQ-96/report-on-current-status-and-refactoring-potential.md` documents Options A–D in detail, and Steve has explicitly approved Option C (matches the Jira description verbatim).

**Design-requirements compatibility note** (not a question — just flagging for awareness): the `project-design-requirements.md` doc emphasises "a class/interface pair for every concept" and "leaning toward providing future developers classes they can override/replace." The deletion of the empty `ClaudeCodeTool` marker interface runs against that grain *in the abstract*, but the report addresses this directly in §2.4: the interface is empty, zero callsites use it as a type annotation, and its name would actively block a future `DefaultCodexTool`. So the right lens here is the design doc's own caveat: "we aren't going to fracture our system to the extreme… at the expense of readability and elegance." Deleting the interface *simplifies* the system; the concept it supposedly represents (Claude-specific tool) is captured instead by `DefaultClaudeCodeTool extends MarshalledCLITool`, where the class name carries the meaning.

## Project Design Requirements

**File**: `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/dev/project-design-requirements.md`

Found. Relevant extracts for this refactor:

1. **"A class/interface pair for every concept"** — relevant because we're *deleting* the `ClaudeCodeTool` interface. Analysed above under Research Findings; the report's §2.4 answers this (empty marker, no callsite uses it, name blocks future backends). Not a blocker; flagged for transparency.
2. **"Tell, don't ask" / pushing work into objects** — relevant because `DefaultClaudeCodeTool` currently *asks* `CompositionRoot` to build a `Tool` then forwards the call. The refactor pushes the composition work into the constructor via `super(...)`, so the object *is* the tool rather than *holds* one. Aligns well.
3. **"Avoid cached state"** — mildly relevant. Pre-refactor, `DefaultClaudeCodeTool` creates a fresh `CompositionRoot` on every `execute()` call (no caching, but wasteful). Post-refactor, the tool and its wiring are assembled once in the constructor and reused; this is legitimate initialisation, not cached mutable state. Aligns well.
4. **"Switchability" by third-party developers (classwitch)** — relevant and *improved* by this refactor. After the change, swapping in `DefaultCodexTool extends MarshalledCLITool` becomes "add one class"; the path to pluggable backends is cleared.
5. **SRP headers ("SRP Does / SRP Knows About / SRP Knows Nothing About")** — directly relevant. One AC bullet explicitly requires updating these on every touched class/interface. I'll rewrite `DefaultClaudeCodeTool`'s header (currently contains obsolete `REFACTOR:` notes predicting AHQ-91/AHQ-96 — both done), narrow `CompositionRoot`'s, and review `MarshalledCLITool`'s for layer-contradiction.

## Questions for Human

### Question 1: Unit test for `CompositionRoot` — create or just update existing?

The Jira AC reads: *"Unit tests for `DefaultClaudeCodeTool` and `CompositionRoot` are updated to reflect the new shape."*

I checked — there is currently **no** unit test file for `CompositionRoot`. The only reference to it in any test lives inside `tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts`, which mocks `CompositionRoot` rather than testing it.

So "are updated" is ambiguous:

- **(a)** Literal reading: the AC expects a `composition-root.unit.test.ts` to exist. Combined with the project's "one test file per class" convention (referenced in the design-doc memory index), this suggests we should **create** a new unit test file for `CompositionRoot`.
- **(b)** Lighter reading: the AC is loose wording, and "update" means "make sure the existing test-suite reflects the new shape" — i.e. just fix up `default-claude-code-tool.unit.test.ts` and call it done.

My vote: **(a)** — create `tests/unit/kernel/composition-root.unit.test.ts`. It's cheap (~3 tiny tests: `getWorkflowCommandBuilder()` returns a `ClaudeWorkflowCommandBuilder`, the four public getters return the expected concrete types, `getTool()` no longer exists / isn't needed). It also fixes the "test coverage fig leaf" problem where currently `CompositionRoot` is entirely exercised by integration/E2E tests with no unit-level sanity check.

**Human's Response**:
> I agree with you.

**✅ Agreed Resolution**: Create a new `tests/unit/kernel/composition-root.unit.test.ts` file with the tests described in the "Test Types And Tests We Will Be Implementing" section below.

---

### Question 2: Test types confirmation

The Jira description does **not** contain an explicit `Test types: X, Y` line. However, the acceptance criteria clearly imply:

- **Unit tests**: must be updated (explicit AC bullet).
- **Integration / E2E tests**: must require zero changes and continue to pass (explicit AC bullet).

So the intent appears to be: **`Test types: unit`** (refactor the unit tests; validate everything else via `pnpm validate` which includes typecheck + lint + unit tests).

Is that right? Or should I treat this as `unit` + something else (e.g. a manual sanity-check pass)?

**Human's Response**:
> unit

**✅ Agreed Resolution**: `Test types: unit`. Only the unit-test test type will be developed in this Jira (rewrite of `default-claude-code-tool.unit.test.ts` + new `composition-root.unit.test.ts`). Integration + E2E tests remain untouched and must continue to pass under `pnpm validate`.

---

## Files I Reviewed

- `docs/jira-docs/AHQ-96/report-on-current-status-and-refactoring-potential.md` — the pre-existing approved design report (Option C). Summarises current code, problems, options A–D, and the approved scope.
- `docs/dev/project-design-requirements.md` — project design philosophy (OO design, class/interface pairs, "tell don't ask", avoid cached state, SRP headers, classwitch).
- `src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.ts` — the target of the refactor. Currently 29 lines, 1 line of behaviour. Header has obsolete `REFACTOR:` notes to be removed.
- `src/kernel/composition-root.ts` — the other target. Currently 62 lines; four private getters, `getTool()` (to be deleted), and `getWorkflowCommandBuilder()` (to be rewired).
- `src/interfaces/claude-code-tool.ts` — the empty marker interface (to be deleted).
- `src/interfaces/index.ts` — re-exports `ClaudeCodeTool` (re-export to be removed).
- `src/tools/marshalled-io-tools/marshalled-cli-tool.ts` — the superclass `DefaultClaudeCodeTool` will extend. Constructor signature: `(sessionFactory, cliWrapper, marshalledIOCLICommandBuilder, workspace)` — confirms the four-arg `super(...)` call in the Jira description is correct.
- `src/workflow/claude/claude-workflow-command-builder.ts` — confirmed it takes `tool: Tool` (not `ClaudeCodeTool`), so swapping `this.getTool()` → `new DefaultClaudeCodeTool(this)` is type-compatible (since `DefaultClaudeCodeTool extends MarshalledCLITool implements Tool`).
- `tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts` — the existing unit test. Mocks `CompositionRoot.getTool()`; needs a complete rewrite because the mocked method is being deleted and `getTool()` moves into `super(...)`.
- **Callsite audit** via Grep of `new DefaultClaudeCodeTool(`: confirmed **11 callsites** (5 skill CLIs, 3 integration tests, 1 E2E test, 1 unit test, 1 E2E fixture) — all use the zero-arg form, matching the report exactly. Default-arg constructor preserves them all.
- **`ClaudeCodeTool` type-use audit** via Grep of `: ClaudeCodeTool|<ClaudeCodeTool>|implements ClaudeCodeTool`: confirmed the only production `implements` is on `DefaultClaudeCodeTool` itself. Zero type annotations in production code outside the dead spike-00 tree. Safe to delete.

### Key findings

- The Jira is unusually self-contained and the design has been pre-decided. The refactor is mechanical.
- Zero callsite churn is achievable because (a) the default-arg constructor, and (b) `ClaudeWorkflowCommandBuilder` already takes the generic `Tool` interface, not `ClaudeCodeTool`.
- The existing unit test for `DefaultClaudeCodeTool` must be rewritten (not just edited) because its entire strategy — mocking `CompositionRoot.getTool()` — targets a method that's being deleted.

## Test Types And Tests We Will Be Implementing

**Test types: `unit`** (the only test type — full RED → GREEN → REFACTOR → VALIDATE cycle). ✅ Confirmed by human (Q2).

### Unit tests — to rewrite / create

#### `tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts` (rewrite)

The existing test mocks `CompositionRoot.getTool()` and verifies delegation. Both are going away. New tests:

1. **`should construct a MarshalledCLITool wired with the Claude components when given a CompositionRoot`**
   - Arrange: create a fake `CompositionRoot` whose four public getters return sentinel fakes (fake session factory, fake CLI wrapper, fake ahq workspace, fake current-user workspace).
   - Act: `new DefaultClaudeCodeTool(fakeRoot)`.
   - Assert: the resulting instance is an `instanceof MarshalledCLITool` (and thus `instanceof DefaultClaudeCodeTool`).
   - Assert: verify the superclass was called with the expected four components — done by spying on the fakes (e.g. `fakeRoot.getIOMarshallerSessionFactory` called once, `fakeRoot.getCLIWrapper` called once, `fakeRoot.getAhqWorkspace` + `fakeRoot.getCurrentUserWorkspace` both called — the latter called twice, once for `ClaudeCommandBuilder`, once for the superclass's `workspace` param).

2. **`should wire a ClaudeCommandBuilder (not a bare MarshalledIOCLICommandBuilder) as the builder argument`**
   - Arrange: as above, plus spy the `ClaudeCommandBuilder` constructor (via `vi.mock` of the builder module).
   - Act: `new DefaultClaudeCodeTool(fakeRoot)`.
   - Assert: the `ClaudeCommandBuilder` constructor was called exactly once with `(fakeAhqWorkspace, fakeCurrentUserWorkspace)`.

3. **`should default the CompositionRoot argument to a real CompositionRoot when no argument is passed`**
   - Arrange: spy the `CompositionRoot` constructor.
   - Act: `new DefaultClaudeCodeTool()`.
   - Assert: `CompositionRoot` was instantiated exactly once. (Covers the "zero callsite churn" guarantee — the 11 zero-arg callsites still work.)

4. **`should be a Tool via inheritance from MarshalledCLITool`**
   - Trivial but documents the contract: `expect(new DefaultClaudeCodeTool(fakeRoot)).toHaveProperty('execute')` and a `typeof execute === 'function'` check. (Confirms `execute()` is inherited, not re-declared.)

**Rationale:** these tests verify the *shape* of the wiring without spinning up real Claude or a real PTY — the constructor is the entire public behaviour of the class, so the constructor is exactly what we should test.

#### `tests/unit/kernel/composition-root.unit.test.ts` (create — pending confirmation in Q1)

1. **`getAhqWorkspace() should return an AhqWorkspaceImpl`** — `expect(root.getAhqWorkspace()).toBeInstanceOf(AhqWorkspaceImpl)`.
2. **`getCurrentUserWorkspace() should return a CurrentUserWorkspaceImpl`** — likewise.
3. **`getCLIWrapper() should return a PtyCLIWrapper`** — likewise.
4. **`getIOMarshallerSessionFactory() should return a JsonFileIOMarshallerSessionFactory wired to the current user workspace`** — likewise, plus a smoke check that calling it twice returns fresh instances (per the "stateless, each call fresh" contract in the header).
5. **`getWorkflowCommandBuilder() should return a ClaudeWorkflowCommandBuilder wired to a DefaultClaudeCodeTool`** — `expect(root.getWorkflowCommandBuilder()).toBeInstanceOf(ClaudeWorkflowCommandBuilder)`; optionally peek the private `tool` field via test-double injection or via behaviour (the builder's `tool.execute` should be the `DefaultClaudeCodeTool.execute` inherited from `MarshalledCLITool`).
6. **`should NOT expose a getTool() method`** — `expect(root).not.toHaveProperty('getTool')` / `expect((root as any).getTool).toBeUndefined()`. Documents the deletion.

**Rationale:** these tests are cheap, fast, and pin the *structural* contract of `CompositionRoot` after the refactor. They will catch any accidental re-introduction of `getTool()` or mis-wiring of `getWorkflowCommandBuilder()`.

### Integration and E2E tests

**No changes.** Per the Jira AC: "Integration and E2E tests require zero changes and continue to pass." They will be validated to still pass as part of `pnpm validate` / the REFACTOR-VALIDATE step, but no new tests are written and no existing tests are edited.

## Ready for Next Step

✅ Both questions resolved by human. ✅ Test types confirmed: `unit`. This summary is complete — proceeding to 02-red-phase.

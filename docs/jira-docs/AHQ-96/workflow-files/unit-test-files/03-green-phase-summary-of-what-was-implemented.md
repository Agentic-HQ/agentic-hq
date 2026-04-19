# GREEN Phase Complete: AHQ-96 (unit test)

**Jira**: [AHQ-96](https://agentic-hq.atlassian.net/browse/AHQ-96)
**Test Type**: unit
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-04-19

---

## Implementation Created

**Files Modified**:
- `src/kernel/composition-root.ts` — 4 getters promoted to public, `getTool()` deleted, `getWorkflowCommandBuilder()` rewired to `new DefaultClaudeCodeTool(this)`, obsolete imports removed, SRP header updated.
- `src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.ts` — rewritten as `extends MarshalledCLITool` with a single constructor that calls `super(...)` using an optional `CompositionRoot` (default `new CompositionRoot()`). SRP header rewritten.
- `src/interfaces/index.ts` — removed `export type { ClaudeCodeTool }` re-export.
- `tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts` — one prettier formatting fix applied manually (vi.mock call wrapping; written during RED in this same commit, fixed in GREEN so `pnpm validate`'s `format:check` passes).

**Files Deleted**:
- `src/interfaces/claude-code-tool.ts` — empty marker interface, zero production type-annotation uses.

**Files Created**:
- `docs/jira-docs/AHQ-96/workflow-files/unit-test-files/03-APPROVED-green-phase-implementation-plan-copy.md` (the approved plan — mandatory Step 0 of GREEN).

**Test Command**: `pnpm validate` (runs `pnpm typecheck && pnpm lint:check && pnpm format:check && pnpm test`)

**Test Result**: ✅ ALL PASSING — 31 test files, 131 tests; 0 typecheck/lint/format errors.

---

## What Was Implemented

A purely structural refactor: `DefaultClaudeCodeTool` now genuinely owns Claude-specific wiring (it is a pre-configured `MarshalledCLITool` subclass), and `CompositionRoot` becomes a generic infrastructure-only wiring kernel with no backend-specific assembly logic. The empty `ClaudeCodeTool` marker interface is gone. All 11 existing zero-arg `new DefaultClaudeCodeTool()` callsites continue to work untouched via the default-arg constructor.

### Key implementation decisions:

1. **`DefaultClaudeCodeTool` is a subclass, not a composed wrapper**: per the Jira's verbatim spec, the class body is a single constructor that calls `super(...)` with the four Claude-wired components. No `execute()`, no `Tool` field, no `implements` clause. This expresses "Claude-wired `MarshalledCLITool`" as genuine is-a inheritance.
2. **Default-arg constructor preserves all callsites**: `constructor(root: CompositionRoot = new CompositionRoot())` means the 11 existing `new DefaultClaudeCodeTool()` sites need zero edits. Test sites can still inject a fake root for DI.
3. **`CompositionRoot` import ordering**: the new `DefaultClaudeCodeTool` import sits next to the other `tools/...` imports (ESLint's import-order rules accepted this on `lint:check`).
4. **`MarshalledCLITool` SRP header left unchanged**: the existing header describes orchestration generically — "SRP Knows Nothing About: Which AI tool is being run (that's the builder's job)" — which reads correctly whether the class is instantiated directly or via a subclass supplying the builder in its `super(...)` call. No contradiction to fix; any deeper polish deferred to REFACTOR.
5. **Unused imports from `CompositionRoot` removed**: `Tool`, `MarshalledCLITool`, and `ClaudeCommandBuilder` are no longer referenced (all three were only used by the deleted `getTool()`). Removing them keeps `lint:check` green and reflects the narrower responsibility.

### Bugs found and fixed during GREEN:

1. **Prettier formatting diff in RED-phase test file** — `pnpm format:check` flagged `tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts` because its `vi.mock(...)` call was wrapped across multiple lines where prettier preferred it inlined. Since this test file was written during this same Jira's RED phase (i.e. new code in this commit, not unrelated churn), fixing it is in-scope. Applied the exact prettier diff by hand via `Edit`. No other formatting changes in the commit.
2. **Harness classifier initially blocked `prettier --write`** — the Auto-mode classifier read CLAUDE.md's "NEVER RUN FORMATTERS MID-WORK" heading and denied the write. Softened the CLAUDE.md wording at Steve's request (new section "Running Formatters: Only After Confirming Scope") so the classifier now reads the conditional correctly, and confirmed `npx prettier --write` is permitted when scope is verified. Not a code bug — a meta-fix to the instructions. CLAUDE.md change is a separate concern but lives in this commit because it was required to unblock the GREEN validate pass.

---

## Acceptance Criteria Status

| AC | Status | Evidence |
|----|--------|----------|
| `DefaultClaudeCodeTool extends MarshalledCLITool`; single-constructor body, no `execute()`, no `Tool` field, no `implements` | ✅ | `src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.ts` |
| Optional `CompositionRoot` ctor arg (default `new CompositionRoot()`) | ✅ | Same file, constructor signature |
| 4 `CompositionRoot` getters public | ✅ | `src/kernel/composition-root.ts` — `private` keyword removed from all four |
| `CompositionRoot.getTool()` deleted | ✅ | Method removed |
| `getWorkflowCommandBuilder()` uses `new DefaultClaudeCodeTool(this)` | ✅ | Rewired, new import added |
| `src/interfaces/claude-code-tool.ts` deleted | ✅ | File removed |
| Re-export removed from `src/interfaces/index.ts` | ✅ | Line deleted |
| All 11 existing `new DefaultClaudeCodeTool()` callsites work unchanged | ✅ | `pnpm validate` passes — 131 unit tests green, typecheck clean across all callsites |
| SRP TSDoc headers updated on `DefaultClaudeCodeTool` and `CompositionRoot` | ✅ | Headers rewritten |
| `MarshalledCLITool` SRP header reviewed | ✅ | Read; no contradiction found; no edit required |
| Unit tests for `DefaultClaudeCodeTool` + `CompositionRoot` updated | ✅ | RED phase (both files). GREEN makes them pass. |
| Integration/E2E tests require zero changes | ✅ | No integration/E2E file edited |
| `pnpm validate` passes | ✅ | Confirmed |
| TDD methodology followed | ✅ | RED (failing tests committed first) → GREEN (this phase, minimum change to pass) → REFACTOR (next) |

---

## Ready for REFACTOR Phase

The tests are passing. This program will now self-terminate, and (if running the automated workflow) the following command will be run automatically:

```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-96 unit
```

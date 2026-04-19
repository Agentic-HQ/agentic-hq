# RED Phase Complete: AHQ-96 (unit test)

**Jira**: [AHQ-96](https://agentic-hq.atlassian.net/browse/AHQ-96)
**Test Type**: unit
**Phase**: RED (Failing Test Written)
**Generated**: 2026-04-19

---

## Tests Created / Rewritten

### File 1 (rewrite): `tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts`

**Test**: `routes execute() through the injected CompositionRoot (session factory, CLI wrapper, workspaces)`

Verifies that after construction with a `CompositionRoot`, calling `execute()` routes input through the session factory, CLI wrapper, and current-user workspace supplied by that root, and builds the CLI command via a `ClaudeCommandBuilder` wired with the ahq and current-user workspaces.

### File 2 (create): `tests/unit/kernel/composition-root.unit.test.ts`

1. `getAhqWorkspace() returns a Workspace rooted at AGENTIC_HQ_WORKSPACE_ROOT`
2. `getCurrentUserWorkspace() returns a Workspace rooted at process.cwd()`
3. `getIOMarshallerSessionFactory() returns a fresh factory instance on each call`

## Failure Output (RED signals — confirmed)

### `pnpm typecheck` — 5 errors

```
tests/unit/kernel/composition-root.unit.test.ts(20,48): error TS2341: Property 'getAhqWorkspace' is private and only accessible within class 'CompositionRoot'.
tests/unit/kernel/composition-root.unit.test.ts(27,56): error TS2341: Property 'getCurrentUserWorkspace' is private and only accessible within class 'CompositionRoot'.
tests/unit/kernel/composition-root.unit.test.ts(35,27): error TS2341: Property 'getIOMarshallerSessionFactory' is private and only accessible within class 'CompositionRoot'.
tests/unit/kernel/composition-root.unit.test.ts(36,27): error TS2341: Property 'getIOMarshallerSessionFactory' is private and only accessible within class 'CompositionRoot'.
tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts(75,44): error TS2554: Expected 0 arguments, but got 1.
```

These drive the ACs:
- The 4 `TS2341` errors drive *"`CompositionRoot.getAhqWorkspace`, `getCurrentUserWorkspace`, `getCLIWrapper`, `getIOMarshallerSessionFactory` are public."* (3 of the 4 public getters actually exercised; `getCLIWrapper()` publicness is covered indirectly via the File 1 test.)
- The `TS2554` error drives *"`DefaultClaudeCodeTool`'s constructor accepts an optional `CompositionRoot`"*.

### `pnpm test:unit` runtime results

- **File 1**: `1 failed`. Failure: `Error: Output file not found: .../io-files-...`. Pre-refactor `DefaultClaudeCodeTool.execute()` calls `new CompositionRoot().getTool().execute(...)` — ignoring the injected fake `CompositionRoot` — which invokes the real `JsonFileIOMarshallerSession`. The test's fake session is never used. Post-refactor, the injected fake root's spies will be exercised and the test will pass cleanly.
- **File 2**: `3 passed` at runtime. TypeScript `private` is compile-only, so the runtime behaviour is already correct — the real `AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl` / `JsonFileIOMarshallerSessionFactory` instances returned by the current impl already satisfy the behavioural assertions. The RED signal for File 2 is the **typecheck**, not the runtime.

## Files Touched

- `tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts` — rewritten
- `tests/unit/kernel/composition-root.unit.test.ts` — created

**Note**: No source files (`src/**`) were modified — that is GREEN-phase work.

## Scope note (for context)

This is a **refactor**, not a new feature. Per Steve's guidance, the test set is deliberately lean — we wrote only the tests we'd want for the post-refactor implementation. Aspects of the refactor with no observable behavioural difference (which subclass `getWorkflowCommandBuilder()` wires internally, deletion of `getTool()`, interface-file deletion) are enforced by `pnpm validate` + code review at REFACTOR time, not by RED-phase tests.

## Ready for GREEN Phase

```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-96 unit
```

# RED Phase Plan: AHQ-96 (unit test) — v4 (minimal)

## Context

**Jira**: [AHQ-96](https://agentic-hq.atlassian.net/browse/AHQ-96) — refactor `DefaultClaudeCodeTool` to be a pre-configured subclass of `MarshalledCLITool`; promote `CompositionRoot`'s four building-block getters to public, delete `getTool()`, rewire `getWorkflowCommandBuilder()`; delete empty `ClaudeCodeTool` interface.

This is a **refactor**, not a new feature. Per Steve's guidance: "just write the actual tests you need that will test this implementation — no need to create a failing test for everything." So this plan keeps the test set lean (the tests we'd want to have post-refactor) and doesn't chase a RED signal for every AC bullet. The structural aspects without observable behavioral difference (e.g. which concrete subclass `getWorkflowCommandBuilder()` wires, deletion of `getTool()`, interface file deletion) are enforced by `pnpm validate` typecheck + code review, not by tests.

All assertions are **behavioral** (per Steve's earlier feedback): no `instanceof`, no prototype-identity, no private-field peeking.

## Step 0 — Copy this approved plan

Before writing tests, copy this plan to
`docs/jira-docs/AHQ-96/workflow-files/unit-test-files/02-red-phase-failing-test-plan-copy.md`.

## Tests to Write

### File 1 (rewrite): `tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts`

**Single test**:

**`execute() routes input through the injected CompositionRoot's session factory, CLI wrapper, and current-user workspace, building the CLI command via ClaudeCommandBuilder with the ahq and current-user workspaces`**

- Arrange: `vi.mock('.../claude-command-builder.js')` so its constructor is a spy and `build()` returns a sentinel `CLICommand`. Build a fake `CompositionRoot` (cast `as unknown as CompositionRoot`) whose four public getters return spied `sessionFactory`, spied `cliWrapper`, and two recognisable `Workspace` fakes (ahq + current-user with distinct roots).
- Act: `await new DefaultClaudeCodeTool(fakeRoot).execute('cmd', 'input')`.
- Assert:
  - `sessionFactory.create` called; session's `write` called with `'input'`; session's `readOutput` called; returned result equals the session's output sentinel.
  - mocked `ClaudeCommandBuilder` constructor called once with `(fakeAhqWorkspace, fakeCurrentUserWorkspace)`.
  - `cliWrapper.run` called once; first arg is the sentinel `CLICommand` built by the mocked builder; second arg is `fakeCurrentUserWorkspace.getRoot()`.

One test, one `it()` block. Covers the shape of the post-refactor `DefaultClaudeCodeTool` in one behavioral sweep.

### File 2 (create): `tests/unit/kernel/composition-root.unit.test.ts`

**Three tests**:

1. **`getAhqWorkspace() returns a Workspace rooted at AGENTIC_HQ_WORKSPACE_ROOT`**
   - `vi.stubEnv('AGENTIC_HQ_WORKSPACE_ROOT', '/test-ahq-root')`.
   - `const ws = new CompositionRoot().getAhqWorkspace();`
   - `expect(ws.getRoot()).toBe('/test-ahq-root');`  `expect(ws.isAhqWorkspace()).toBe(true);`

2. **`getCurrentUserWorkspace() returns a Workspace rooted at process.cwd()`**
   - `expect(new CompositionRoot().getCurrentUserWorkspace().getRoot()).toBe(process.cwd());`

3. **`getIOMarshallerSessionFactory() returns a fresh factory instance on each call`**
   - `const root = new CompositionRoot();`
   - `expect(root.getIOMarshallerSessionFactory()).not.toBe(root.getIOMarshallerSessionFactory());`
   - `expect(typeof root.getIOMarshallerSessionFactory().create).toBe('function');`

(`getCLIWrapper()` isn't tested here — calling `getCLIWrapper()` in the test imports `node-pty` indirectly which is fine, but there's nothing meaningful to assert behaviorally beyond "has a `run` function", which is implementation-trivia. Its public-ness is still needed and is validated indirectly: it's called inside `DefaultClaudeCodeTool`'s constructor, which we exercise in File 1. If Steve wants it covered, I'll add it.)

## Test-infrastructure work

- No `package.json` edits. Both files match the `tests/unit/**/*.unit.test.ts` glob.
- `tests/unit/kernel/` directory does not exist — created implicitly.
- No vitest config changes.

## Remaining RED-phase steps

1. ✅ Copy this approved plan to the workflow-files dir.
2. Rewrite `tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts` (the one test above).
3. Create `tests/unit/kernel/composition-root.unit.test.ts` (the three tests above).
4. Run `pnpm test` — capture current failures.
5. Run `pnpm typecheck` — capture current errors (expected: private-access errors in file 2; arg-to-no-arg-ctor in file 1).
6. Write `02-red-phase-failing-tests.md` summary with captured output.
7. Add Jira comment via `mcp__mcp-atlassian__jira_add_comment`.
8. Write `command-output.json`; self-terminate via `/agentic-hq-core-plugin:self-termination`.
9. Recheck that all commands in `02-jira-write-failing-test.md` have been executed.

## Verification

- `pnpm test` on the two files shows failing assertions/errors (refactor not done yet).
- `pnpm typecheck` shows errors only in the two test files.
- `src/` untouched in RED phase.

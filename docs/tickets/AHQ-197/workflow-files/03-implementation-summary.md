# AHQ-197 — Implementation Summary

## Summary Of Work Done

Both phases of the approved plan are implemented and green.

**Phase 1 — staged release tree.** `pnpm build` now runs the new shared build script
`scripts/build-release.cjs`, which compiles and assembles `release/` — a staging directory holding
exactly what ships, under a single manifest **generated** from the root `package.json` (one source
of truth, transformed). Packing runs from inside `release/` (`cd release && pnpm pack`), so three
interim mechanisms retired: the pack-time `publishConfig` bin/exports overrides, the `files`
whitelist (the io-files/test-plugin/dev-config leak class is now structurally impossible), and the
plugin-`.sh` half of the postinstall chmod (replaced by generated
`publishConfig.executableFiles` exact paths enumerated from the staged tree each build). The
planner's gate check was run first: a hand-assembled `release/` stub packed correctly from inside
the pnpm workspace before any pipeline code was written.

**Phase 2 — explicit parameter chain + build-first parity.** `--build-mode`
(`build-first`|`prebuilt`) and `--ahq-package-root` now flow visibly through the whole chain: baked
into each bin wrapper (which wrapper you invoked IS the mode) → stripped from argv by
`extractAhqRuntimeParams()` before Commander parses → carried by `CompositionRoot` (required
constructor param, no defaults) → relayed VERBATIM by `ClaudeCommandBuilder` as two extra tokens on
the final positional argument (the AI never interprets them) → acted on ONLY by
`scripts/run-workflow.cjs`: `build-first` runs a full clean build then executes from
`<repo>/release`, `prebuilt` executes the installed artifact in place. The build now emits straight
to `release/dist`; the remaining interims retired: the generated `dist/package.json` (compiled JS
self-reference-resolves against the generated release manifest directly), the math-workflow
SKILL.md's `$AGENTIC_HQ_WORKSPACE_ROOT` reads (replaced by `$1`/`$2` relay parameters), and the
`pnpm build && ` prefix on the cross-workspace e2e script. Dev runs now build and execute the
byte-identical shippable JS from nothing — the silent-stale-`dist/` risk is gone. The bin wrappers
still dual-write the legacy env var for untouched legacy readers (retired by AHQ-200).

## Files Changed/Added/Deleted

**Phase 1 (build pipeline + configs):**

- `scripts/build-release.cjs` — **added** (the shared build: clean → compile → stage → generate manifest)
- `package.json` — **changed** (build script → build-release.cjs; `files` whitelist and `publishConfig` overrides deleted; postinstall trimmed to the node-pty half; Phase 2: e2e script prefix removed; comments updated)
- `.gitignore`, `.prettierignore`, `eslint.config.mjs`, `tsconfig.json`, `pnpm-workspace.yaml` — **changed** (`release/` ignored/excluded everywhere; workspace exclusion prevents the generated manifest colliding with the root package)

**Phase 2 (parameter chain):**

- `src/interfaces/ahq-runtime-params.ts`, `src/interfaces/build-mode.ts`, `src/interfaces/ahq-package-root.ts` — **added** (the runtime-params interfaces; value-object shape per Approval Gate Changes below)
- `src/runtime-params/default-ahq-runtime-params.ts`, `src/runtime-params/default-ahq-package-root.ts` — **added** (the `Default*` value-object classes)
- `src/interfaces/ahq-command-line.ts`, `src/runtime-params/default-ahq-command-line.ts` — **added** (gate change 4: the `AhqCommandLine` concept — see Approval Gate Changes; an interim free function `extractAhqRuntimeParams` existed from Phase 2 through gate change 3 and was replaced by this class)
- `src/interfaces/workflow-runtime.ts`, `src/workflow-runtime/default-workflow-runtime.ts` — **added** (gate change 3: the `WorkflowRuntime` concept — see Approval Gate Changes; holds and delegates to an `AhqCommandLine` since gate change 4)
- `src/cli/main.ts`, `src/cli/app.ts` — **changed** (`app.run(process.argv)`; extract → `new CompositionRoot(params)` → parse remaining)
- `src/kernel/composition-root.ts` — **changed** (required `ahqRuntimeParams` + `getAhqRuntimeParams()`)
- `src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.ts` — **changed** (`root` REQUIRED, no default; wires params into the builder)
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` — **changed** (required `ahqRuntimeParams`; final positional arg now `"<cmd> <marshallingId> <buildMode> <ahqPackageRoot>"`)
- `src/tools/marshalled-io-tools/claude-code/index.ts` — **changed** (barrel also exports `CompositionRoot`, `AhqRuntimeParams`, `BuildMode`, and — gate changes 3/4 — `WorkflowRuntime`/`DefaultWorkflowRuntime`/`Tool`/`AhqCommandLine`/`DefaultAhqCommandLine`)
- `bin/agentic-hq.cjs`, `bin/agentic-hq-prebuilt.cjs` — **changed** (insert `--build-mode`/`--ahq-package-root`; keep legacy env-var dual-write)
- `scripts/run-workflow.cjs` — **changed** (required validated `--build-mode`; build-first builds then runs from `release/`; forwards both params + passthrough args; gate change 4: split into self-documenting functions per the human's in-code REFACTOR note)
- `scripts/dist-package.json` — **deleted** (grep confirmed no remaining references outside historical ticket docs)
- `tsconfig.build.json` — **changed** (`outDir` → `release/dist`)
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/SKILL.md` — **changed** (`build-mode = $1`, `ahq-package-root = $2`; command uses only explicit params; info panel rewritten to timeless runtime facts)
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.ts` — **changed** (gate change 3: bootstraps via `new DefaultWorkflowRuntime(process.argv)` — no framework option declarations or tool assembly; the file contains only math-workflow code)

**Tests:**

- `tests/unit/runtime-params/default-ahq-command-line.unit.test.ts` — **added** (gate change 4; carries forward the five behaviours of the deleted extractor test, re-expressed on the object API)
- `tests/unit/workflow-runtime/default-workflow-runtime.unit.test.ts` — **added** (gate change 3)
- `tests/unit/interfaces/build-mode.unit.test.ts`, `tests/unit/runtime-params/default-ahq-runtime-params.unit.test.ts`, `tests/unit/runtime-params/default-ahq-package-root.unit.test.ts` — **added** (approval-gate value objects)
- `tests/integration/runner/run-workflow-validates-and-executes.integration.test.ts` — **added**
- `tests/integration/build/build-determinism.integration.test.ts` — **changed** (runs the shared build twice, hashes the whole `release/` tree)
- `tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts` — **changed** (packs from `release/`; generated-manifest + leak-class assertions; dist-manifest assertions replaced by a no-manifest-between-JS-and-package-root walk)
- `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts` — **changed** (deletes `release/` first so green PROVES build-first builds from nothing)
- `tests/unit/kernel/composition-root.unit.test.ts`, `tests/unit/tools/claude-code/claude-command-builder.unit.test.ts`, `tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts` — **changed** (new constructor params + relay/getter assertions)
- `tests/unit/claude-code-tool/{claude-code-tool-with-injected-config, fake-claude-executes-command-using-file-io, claude-code-tool-with-injected-io-marshaller}.unit.test.ts`, `tests/integration/claude-code-tool/{claude-executes-command-using-file-io, real-claude-self-termination-skill}.integration.test.ts`, `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts`, `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts` — **changed** (mechanical: explicit params at construction so `pnpm typecheck` passes — see Approved Deviations)

**Docs:**

- `docs/tickets/AHQ-197/workflow-files/02-implementation-plan.md` — **changed** (UPDATEs 1–3 recorded)

## Tests Added/Updated And Test Results

Both phases ran test-first: each phase's tests were updated/added and run RED (verified failing for
the expected reason) before the code, then GREEN after.

| Check | Command | Result |
| --- | --- | --- |
| Phase 1 gate check | stub `release/` + `pnpm pack` from inside it | Packed stub manifest correctly (also learned: pnpm force-includes repo-root LICENSE but not README — the copy step covers both) |
| Build determinism (both phases) | `pnpm test:integration:build-determinism` | PASS — byte-identical `release/` trees across two builds, generated manifest included |
| Runner validation/forwarding | `pnpm test:integration tests/integration/runner/run-workflow-validates-and-executes.integration.test.ts` | PASS 3/3 (missing/invalid `--build-mode` loud errors; prebuilt executes + forwards params) |
| Unit suite | `pnpm test` | PASS — 165/165 after gate change 3 (160/160 after the value-object refactor; 152/152 at phase end) |
| Tarball e2e (run at BOTH phase ends) | `pnpm test:e2e:prebuilt-tarball-math-workflow` | PASS 3/3 both times — generated manifest, leak-class boundary, exec bits via `executableFiles`, `list`, full math run (`Output number: 5`), installed package byte-unchanged |
| Cross-workspace dev e2e (both phase ends) | `pnpm test:e2e:cross-workspace-demo-math-workflow` | PASS both times; Phase 2 run deleted `release/` first and the script has NO build prefix — proves build-first builds from nothing |
| Legacy regression (documentation run) | `pnpm test:e2e:agentic-hq-cli-string-reversal` | RED as accepted in plan UPDATE 1: skill-resolution hop completed (relayed extra args inert), then the legacy CLI crashed at `new DefaultClaudeCodeTool()` with the predicted TypeError |
| Manual CLI run (both phase ends) | `agentic-hq math -- --input-number=11` from a clean `/tmp/agentic-hq-test-workspaces/...` workspace | `Output number: 5` both times |
| Manual smoke | `node bin/agentic-hq.cjs list`; `pnpm exec tsx src/cli/main.ts list` (no params) | `list` works through the new chain; direct invocation fails loudly naming the missing `--build-mode` option |
| Full validate | `pnpm validate` | PASS (typecheck + lint + format + unit) |

## Approved Deviations From The Plan

**Plan UPDATE 1 (cross-reference `02-implementation-plan.md` → UPDATES):** the planned
required-`root` change to `DefaultClaudeCodeTool` conflicts with the plan's own
string-reversal regression net — six unmigrated legacy workflow CLIs call
`new DefaultClaudeCodeTool()` with no args against live `.ts` source. Offered a
legacy-env-var-shim alternative, the human chose **"Proceed as planned"** (AskUserQuestion,
2026-08-10): `root` is strictly required; the six legacy workflow CLIs and the string-reversal
regression e2e are accepted broken until AHQ-200/201; the failing e2e is left in place, not
weakened or skipped. Mechanical fallout, also recorded in UPDATE 1: seven repo test files that
construct the tool/builder directly were updated to pass explicit params so `pnpm typecheck` (a
mandated validate gate covering `tests/**`) passes.

Minor measurement note (same property, honest measurement point): the plan worded the leak-class
assertion as "installed top level is exactly {…}"; the test asserts the **tarball's** top level
instead, because npm itself creates `node_modules/` inside a globally-installed package directory —
the tarball is what ships.

## Approval Gate Changes

At the approval gate the human requested (before approving) that the ticket's stored primitives
become proper interfaces and classes, then — after a design discussion — chose the
companion-object shape for the closed build-mode set ("Variant A"). Recorded as **plan UPDATE 2**.
What changed:

- **`AhqRuntimeParams`** is now a getter interface (`getBuildMode()`, `getAhqPackageRoot()`)
  implemented by **`DefaultAhqRuntimeParams`** (`src/runtime-params/default-ahq-runtime-params.ts`,
  added).
- **`ahqPackageRoot`** is now interface **`AhqPackageRoot`** (`src/interfaces/ahq-package-root.ts`,
  added) + **`DefaultAhqPackageRoot`** (`src/runtime-params/default-ahq-package-root.ts`, added);
  an empty path throws loudly.
- **`BuildMode`** (`src/interfaces/build-mode.ts`) is now an interface with declaration-merged
  companion constants: `BuildMode.BUILD_FIRST` and `BuildMode.PREBUILT` are the only instances
  (non-exported implementation class), and `BuildMode.fromValue()` is the single validation point
  for raw strings at the argv/CLI boundaries. An intermediate exported `DefaultBuildMode` class
  existed briefly during the gate discussion and was replaced by this shape at the human's choice.
- Consumers updated: `extract-ahq-runtime-params.ts`, `claude-command-builder.ts` (relay now reads
  the getters — the emitted relay string is byte-identical), the barrel (exports the new
  interfaces/classes; `BuildMode` as a **value** export so the constants survive), and
  `math-workflow-demo-cli.ts`.
- Tests: new `tests/unit/interfaces/build-mode.unit.test.ts`,
  `tests/unit/runtime-params/default-ahq-package-root.unit.test.ts`,
  `tests/unit/runtime-params/default-ahq-runtime-params.unit.test.ts` (one file per class,
  mirroring src); 11 existing test files re-pointed at the object API.
- **Not** changed (pre-existing primitives outside this ticket's code, flagged as follow-up):
  `ClaudeCommandBuilder.executable`/`extraArgs`, `CLICommand.executable`/`args`. The runner and bin
  wrappers are plain CJS scripts — no TypeScript interfaces apply.
- Re-verified after the change: 160/160 unit tests, runner integration test, build determinism,
  typecheck/lint/format, cross-workspace math e2e, tarball e2e, and the manual
  `agentic-hq math -- --input-number=11` run (results in the table above remain accurate; reruns
  gave identical outcomes).

**Gate change 3 — hide framework plumbing behind `WorkflowRuntime` (plan UPDATE 3).** The human
rejected the gate-2 shape of `math-workflow-demo-cli.ts`: every workflow file would have to
duplicate the framework's mandatory `--build-mode`/`--ahq-package-root` Option declarations, five
framework imports, and the
`new DefaultClaudeCodeTool(new CompositionRoot(new DefaultAhqRuntimeParams(...)))` assembly —
"generic framework code that … should be **hidden** by the framework". After discussion the human
chose a *concept* over a factory function (an anonymous `{tool, remainingArgs}` return being
itself a missed concept), named **`WorkflowRuntime`**. What changed:

- **`WorkflowRuntime`** (`src/interfaces/workflow-runtime.ts`, added) — the workflow-program side
  of the runner→workflow contract: `getClaudeCodeTool(): Tool` and `getWorkflowArgs(): string[]`.
- **`DefaultWorkflowRuntime`** (`src/workflow-runtime/default-workflow-runtime.ts`, added) —
  constructed from raw `process.argv`; extracts + validates the framework options via
  `extractAhqRuntimeParams` (fail-fast at construction, loud uncaught errors preserved), derives a
  fully wired tool per `getClaudeCodeTool()` call, returns the framework-stripped argv for the
  workflow's own Commander parse.
- **`extract-ahq-runtime-params.ts` moved** `src/cli/` → `src/runtime-params/` (now shared by the
  main CLI and the workflow runtime; `app.ts` import updated; error wording made neutral about
  which entry-point wrapper — bin wrapper or workflow runner — inserts the options). Unit test
  moved to mirror.
- **Barrel** exports `WorkflowRuntime` (type), `DefaultWorkflowRuntime` (value), and `Tool` (type).
- **`math-workflow-demo-cli.ts`** now contains only math-workflow code: one framework import, one
  `new DefaultWorkflowRuntime(process.argv)` line, its own `--input-number` option, and
  `program.parse(runtime.getWorkflowArgs())`.
- The runner→workflow argv contract, relay string, SKILL.md, and bin wrappers are byte-unchanged —
  this is TypeScript-side hiding only; the params stay explicit on argv.
- Tests: new `tests/unit/workflow-runtime/default-workflow-runtime.unit.test.ts` (RED-first:
  module-not-found; arg-splitting, three fail-fast throws, and tool wiring asserted by spying the
  `DefaultClaudeCodeTool` dependency and checking the extracted params reach its
  `CompositionRoot`).
- Re-verified after the change: 165/165 unit tests, `pnpm validate`, runner integration test 3/3,
  build determinism, cross-workspace math e2e, tarball e2e, and the manual
  `agentic-hq math -- --input-number=11` run.

**Gate change 4 — the `AhqCommandLine` concept replaces the `extractAhqRuntimeParams` free
function (plan UPDATE 4).** The human rejected the free function as procedural ("Behaviour should
be hidden within and encapsulated in Types/Objects") and asked whether an existing class already
represents a command line. **It does not — and the distinction matters:**

> **Which command line `AhqCommandLine` represents, and why it is NOT `CLICommand` or
> `WorkflowCommand`:** `AhqCommandLine` is the **INCOMING** command line — the entire raw
> `process.argv` this process was launched with, as composed by an AHQ entry-point wrapper (the
> bin wrappers for the main CLI, the workflow runner for workflow programs). The repo's two
> existing command types are both **OUTGOING** — commands this process runs against something
> else: `CLICommand` is a deliberately behaviour-free executable+args DTO used to *spawn a child
> process* (e.g. launching Claude), and `WorkflowCommand` is a resolved, ready-to-`execute()`
> workflow command. `AhqCommandLine` is the opposite direction: the command line somebody else
> composed to launch *us*. It owns the invariant "an AHQ entry-point wrapper composed me, so the
> framework options are present and valid", and yields the whole command line's two interpreted
> views — the typed runtime params and the remaining args. The same explanation lives in the SRP
> header of `src/interfaces/ahq-command-line.ts`, per the human's instruction.

What changed:

- **`AhqCommandLine`** (`src/interfaces/ahq-command-line.ts`, added; name chosen by the human
  over `AhqArgv`): `getAhqRuntimeParams()` and `getRemainingArgs()`.
- **`DefaultAhqCommandLine`** (`src/runtime-params/default-ahq-command-line.ts`, added; replaces
  `extract-ahq-runtime-params.ts` in the same directory): constructor takes the entire raw argv;
  option-presence validation fail-fast in the constructor (class-prefixed loud messages); value
  validation stays delegated to `BuildMode.fromValue()` / `DefaultAhqPackageRoot`.
- **Consumers are now delegation, not procedure calls**: `app.run()` constructs one and reads
  both views; `DefaultWorkflowRuntime` keeps its raw-argv constructor (workflow files stay
  one-line) and internally holds a readonly `AhqCommandLine` it delegates to.
- The free function and its unit test are **deleted**; its five behaviours are carried forward
  verbatim in `tests/unit/runtime-params/default-ahq-command-line.unit.test.ts` (RED-first:
  module-not-found).
- **Also in this gate round**: the human left an in-code REFACTOR note in
  `scripts/run-workflow.cjs` ("Should be split into multiple self documenting functions so it's
  very clear what each function does"). The runner was refactored into `parseCommandLine` /
  `validateOptions` / `resolveExecutionRoot` / `runWorkflowProgram` with a four-line main flow —
  behaviour identical, runner integration tests green immediately before and after, and the note
  removed as fulfilled.
- Re-verified after the change: 165/165 unit tests, `pnpm validate`, runner integration test 3/3,
  build determinism, cross-workspace math e2e, tarball e2e, and the manual
  `agentic-hq math -- --input-number=11` run.

## Out Of Plan Follow-up Ideas/Concerns

- **FOR THE REVIEWER (next stage) — human-directed at final approval.** The human approved this
  implementation **subject to** the in-code REFACTOR note at
  `tests/integration/claude-code-tool/real-claude-self-termination-skill.integration.test.ts:45`
  being recorded here so the Reviewer performs the refactor in the next stage. The note (verbatim
  intent): the exact creation of `DefaultClaudeCodeTool` —
  `new DefaultClaudeCodeTool(new CompositionRoot(new DefaultAhqRuntimeParams(BuildMode.BUILD_FIRST, new DefaultAhqPackageRoot(process.cwd()))))`
  — is duplicated in lots of tests and should be extracted to remove the duplication, ideally as a
  new shared Type/Interface/Class (maybe a test object, or maybe one used in both test and
  production code). Known duplication sites (grep for `new DefaultClaudeCodeTool(`):
  `tests/integration/claude-code-tool/real-claude-self-termination-skill.integration.test.ts`,
  `tests/integration/claude-code-tool/claude-executes-command-using-file-io.integration.test.ts`,
  `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts`,
  `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts` (the
  unit test `tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts` constructs it
  with a mock root — judge separately; the string-reversal e2e fixture copy is legacy/untouched).
  The in-code REFACTOR note must be preserved until the refactor fulfils it.
- **All six legacy workflow CLIs now crash at tool construction** when run (string-reversal,
  quick-jira, full-jira-tdd-story, add-feature, add-feature-detailed-example, create-workflow, plus
  the string-reversal e2e test fixture copy). Their cross-workspace e2es will be red until
  AHQ-200/201 migrate them to the explicit chain.
- **`demo:plugin-direct:math-workflow`** (package.json convenience script) bypasses the runner, so
  it now exits with `DefaultWorkflowRuntime`'s loud missing-`--build-mode` error. Callers can
  append `-- --build-mode=build-first --ahq-package-root=<repo>` or the script can be
  updated/retired with AHQ-201's universal funnel.
- Empirical note: before the `!release/**` workspace exclusion was added, `pnpm -r ls` did NOT
  actually auto-detect the stub `release/package.json` as a workspace member — the exclusion is
  belt-and-braces, kept per plan.
- The plan's own follow-ups stand: AHQ-198 (publish guards, registry hygiene, un-private),
  AHQ-200 (retire env-var dual-write), AHQ-201 (universal funnel; revisit dev-CLI-process parity),
  incremental build option if dev latency annoys, npm convenience script for the new runner
  integration test.

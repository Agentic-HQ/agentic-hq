# AHQ-197 — Implementation Plan

Two phases, per the approved brief Question 2: **Phase 1** — the staged-release-tree restructure
as an isolated, no-behaviour-change packaging refactor (dev path untouched, AHQ-196's tests
re-pointed and green). **Phase 2** — the explicit `build-mode` / `ahq-package-root` parameter
chain, dev-mode `build-first` parity, and retirement of the remaining interims.

Each phase runs **test-first (TDD)**: this repo mandates Red-Green-Refactor, and both phases have
outcome-asserting tests (AHQ-196's safety net) that can be re-pointed *before* the code changes,
giving a genuine RED that proves the tests are watching the new behaviour. Sequence per phase:
**RED** (update/add tests, run, confirm they fail for the right reason) → **CODE** → **GREEN**
(tests pass **and** the real commands are run by hand).

> NOTE: No REFACTOR stage as it adds too much complexity for this simple add-feature workflow (do this in your own custom workflow if reqd)

**One deliberate amendment to the brief's expected shape (please confirm with approval):** the
generated `dist/package.json` (interim mechanism 3) retires in **Phase 2, not Phase 1**. Reason:
it can only die once dev-mode workflow execution moves into the staged tree (otherwise compiled
JS in the dev tree resolves `agentic-hq/tools/claude-code` against the root manifest's `.ts`
exports and breaks under plain node), and moving dev execution requires the runner to know its
execution root — which is exactly what `build-mode` provides. Retiring it in Phase 1 would force
either a dev-path breakage between phases or a filesystem-sniffing hack. All four interims are
still gone by end of ticket.

## Decisions On The Brief's Parked Items

1. **Dev-mode execution root:** the workflow JS executes from the staged tree
   (`<repo>/release/dist/…`), so resolution structure and bytes are identical to an installed
   run. The `ahq-package-root` *value* stays the repo checkout in dev (production: the installed
   package root) — `release/` is an internal build location, never a package-root value.
2. **Dev CLI process:** stays on tsx this ticket. The parity that matters to users is the shipped
   execution path, and under `build-first` that whole path — runner, workflow JS, and the
   compiled `src/` library the workflow imports (most of the codebase) — is byte-identical. The
   compiled CLI is exercised on every tarball e2e run. Building on every dev CLI invocation
   (including `agentic-hq list`) plus a second build inside the runner would be real cost/
   complexity for marginal gain. Revisit with AHQ-201's universal-funnel work.
3. **Staging dir & pack mechanism:** `release/` at the repo root (gitignored); packing is
   `pnpm pack` run **with cwd = `release/`** (no `publishConfig.directory` indirection).
4. **Postinstall chmod:** the plugin-`.sh` half is **replaced** by generated
   `publishConfig.executableFiles` exact paths (enumerated from the staged tree each build, so it
   cannot go stale). Keeping the chmod as backup would mask any `executableFiles` regression from
   the e2e's exec-bit assertion. The node-pty spawn-helper half stays (different problem).
5. **`build-first` build freshness:** always a full clean build (clean → compile → stage). This
   is what retires the silent-stale-`dist/` risk (AHQ-196 review row 1). Seconds per dev run;
   an incremental option is a follow-up if it ever annoys.

## Tests Being Created

### Phase 1 (re-pointed/extended — no dev-path change)

- **`tests/integration/build/build-determinism.integration.test.ts`** (updated) — runs the new
  shared build script twice, hashes the whole `release/` tree each time, asserts identical maps
  and that the key artifacts exist (`release/package.json`, `release/dist/src/cli/main.js`, the
  compiled math workflow JS). Now also proves manifest generation is deterministic. *(AC:
  determinism safety net re-pointed.)*
- **`tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts`** (updated) —
  `beforeAll` packs **from `release/`**; the artifact-shape test now asserts the tarball's
  manifest is the *generated* one (name, version, `type: module`, dependencies, engines.node,
  prebuilt `bin`, compiled-JS `exports`, no `.ts` targets — same constants as today) and adds the
  **leak-class assertions**: installed top level is exactly
  `{package.json, README.md, LICENSE, bin, dist, scripts, .agentic-hq}`, `.agentic-hq` contains
  only `plugins/`, plugins are exactly the three shipped ones — so no `.agentic-hq/temp` io-files,
  no `steve-test-plugin`, no tests/dev configs/pnpm-only files. Exec-bit assertions stay verbatim
  (now proving `executableFiles`); the `dist/package.json` assertions stay **in this phase**.
  `list` + full math run + hash-based read-only assertions unchanged. *(ACs: staged tree with
  single generated manifest; only intended files ship.)*
- **Unchanged nets run at phase end:** `pnpm test:e2e:cross-workspace-demo-math-workflow` (still
  with its `pnpm build &&` prefix this phase), manual `agentic-hq math -- --input-number=11`
  from a clean temp workspace, `pnpm validate`.

### Phase 2 (parameter chain + parity)

- **`tests/unit/cli/extract-ahq-runtime-params.unit.test.ts`** (new) — the argv extraction:
  valid argv → `{buildMode, ahqPackageRoot}` + remaining args (order preserved); missing either
  option → throws loudly; invalid `build-mode` value → throws loudly. *(AC: explicit, required,
  no defaults.)*
- **`tests/unit/tools/claude-code/claude-command-builder.unit.test.ts`** (updated) — the final
  positional argument is now
  `"<aiToolCommand> <marshallingId> <buildMode> <ahqPackageRoot>"`. *(AC: AI relays build-mode
  without interpreting it — the relay is pure argument plumbing.)*
- **`tests/unit/kernel/composition-root.unit.test.ts`** and
  **`tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts`** (updated) — construct
  with the new required params; the tool test additionally asserts `ClaudeCommandBuilder` is
  wired with the params from the CompositionRoot.
- **`tests/integration/runner/run-workflow-validates-and-executes.integration.test.ts`** (new,
  fast, no Claude) — missing `--build-mode` → loud error; invalid value → loud error; happy-path
  `prebuilt` against a tiny fake package tree (stub workflow JS that echoes its argv) → executes
  it and forwards `--build-mode`, `--ahq-package-root` and the passthrough args. *(ACs: required
  with no defaults at the terminus; runner is the only code acting on build-mode.)*
- **`tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts`**
  (updated) — the npm script **loses its `pnpm build && ` prefix**, and the test first deletes
  `release/` so a green run *proves* `build-first` builds from nothing on the fly. *(ACs:
  dev run auto-builds byte-identical JS; stale-dist risk and manual prefix gone.)*
- **Tarball e2e** (updated again) — `dist/package.json` assertions replaced by: **no
  `package.json` anywhere between the compiled workflow JS and the package root** (the walk now
  goes all the way up). Re-run in full (SKILL.md changed, so the installed path must re-prove).
- **Unmigrated-workflow regression:** one run of
  `pnpm test:e2e:agentic-hq-cli-string-reversal` — proves the two extra relayed positional args
  are ignored by legacy skills/commands. *(AC: other workflows' behaviour unchanged.)*
- **Phase-end nets:** manual `agentic-hq math -- --input-number=11` (dev binary),
  `pnpm validate`.

## Implementation Changes

### Phase 1 — staged release tree (retires publishConfig overrides, files whitelist, plugin chmod)

> **AI-recommended gate check** (proposed by the Planner in the approval discussion, not a
> human-added requirement): before wiring the pipeline, spend two minutes hand-assembling a
> minimal `release/` stub (a generated-style manifest + one dummy file) and run `pnpm pack` from
> inside it — proving the pack-from-staged-tree mechanism works inside this pnpm workspace before
> building on it. Same "gate check first" move that paid off in AHQ-196.

**New `scripts/build-release.cjs`** — the single shared build script (style-matched to
`run-workflow.cjs`; `scripts/` is outside tsconfig/eslint):

1. Clean: `rm -rf dist release`.
2. Compile: `node_modules/.bin/tsc -p tsconfig.build.json` (emits to `dist/` as today) and copy
   `scripts/dist-package.json` → `dist/package.json` (unchanged this phase — dev path untouched).
3. Stage `release/`: generated manifest (below) + `bin/agentic-hq-prebuilt.cjs` (dev wrapper is
   deliberately not shipped) + `scripts/run-workflow.cjs` + `dist/` (verbatim copy) + the three
   shipped plugins `agentic-hq-core-plugin`, `agentic-hq-demos-plugin`,
   `agentic-hq-utilities-plugin` under `.agentic-hq/plugins/` (verbatim, minus any
   `node_modules/`) + `README.md` + `LICENSE` (packers force-include these from the pack root —
   without the copy the tarball would lose them).
4. Generate `release/package.json` from the root manifest — one source of truth, transformed,
   never hand-maintained: copy `name`, `version`, `description`, `type`, `dependencies`,
   `engines.node`, `private` (kept `true` until AHQ-198 un-privates deliberately); write in
   directly `bin: {"agentic-hq": "bin/agentic-hq-prebuilt.cjs"}`, the compiled-JS `exports`, a
   `postinstall` containing only the node-pty spawn-helper chmod, and
   `publishConfig.executableFiles` listing the exact path of every staged
   `.agentic-hq/plugins/**/*.sh`. Omit `files`, `publishConfig` overrides, `packageManager`,
   `devDependencies`, scripts other than postinstall, `engines.pnpm`.

**`package.json` (root)** — `"build": "node scripts/build-release.cjs"`; delete the `files`
whitelist and `publishConfig` overrides (+ their `//` comments — retired, no longer true); trim
`postinstall` to the node-pty half and update its comment (the plugin-`.sh` half's job moved to
the generated manifest's `executableFiles`).

**Ignore/workspace configs** — `.gitignore` add `/release/`; `.prettierignore` add `release/`;
`eslint.config.mjs` ignores add `release/**`; root `tsconfig.json` exclude adds `release`;
**`pnpm-workspace.yaml` adds `- '!release/**'`** — without this, pnpm auto-detects
`release/package.json` as a workspace member named `agentic-hq`, colliding with the root package.

Nothing else changes in Phase 1: SKILL.md, both bin wrappers, the runner, `tsconfig.build.json`,
`scripts/dist-package.json`, and the whole dev path are untouched.

### Phase 2 — explicit parameter chain, build-first parity (retires dist/package.json, env-var relay in SKILL.md, e2e build prefix)

**New `src/interfaces/ahq-runtime-params.ts`** —

```ts
export type BuildMode = 'build-first' | 'prebuilt';
export interface AhqRuntimeParams {
  readonly buildMode: BuildMode;
  readonly ahqPackageRoot: string;
}
```

**Entry points (mode literal baked in; dual-write kept):**

- `bin/agentic-hq.cjs` — inserts `--build-mode=build-first` and
  `--ahq-package-root=<parent of bin/>` as the first CLI args in the existing `execFileSync`
  call; keeps setting `AGENTIC_HQ_WORKSPACE_ROOT` (legacy readers, until AHQ-200).
- `bin/agentic-hq-prebuilt.cjs` — splices the same two args (values: `prebuilt`, its package
  root) into `process.argv` before the dynamic import, with a comment; keeps the env-var write.

**`src/cli/main.ts`** — becomes `app.run(process.argv)`.

**New `src/cli/extract-ahq-runtime-params.ts`** — `extractAhqRuntimeParams(argv)` returns
`{ params, remainingArgs }`; missing option or invalid `build-mode` value throws (uncaught, per
the repo's catastrophic-failure convention). Commander never sees these options — they are
stripped before parsing, so no interaction with `enablePositionalOptions`/`passThroughOptions`.

**`src/cli/app.ts`** — `run(argv: string[])`: extract params, `new CompositionRoot(params)`,
pass `remainingArgs` to `.parse(...)`.

**`src/kernel/composition-root.ts`** — constructor takes required
`private readonly ahqRuntimeParams: AhqRuntimeParams`; new getter `getAhqRuntimeParams()`;
`getWorkflowCommandBuilder()` unchanged otherwise. Legacy `AhqWorkspaceImpl` env read untouched.

**`src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.ts`** — `root` parameter
becomes required (the `= new CompositionRoot()` default can no longer exist and silent defaults
are banned anyway); wires `new ClaudeCommandBuilder(root.getAhqWorkspace(),
root.getCurrentUserWorkspace(), root.getAhqRuntimeParams())`.

**`claude-command-builder.ts`** — constructor gains required `ahqRuntimeParams` (before the
optional `executable`/`extraArgs`); final positional argument becomes:

```ts
`${aiToolCommand} ${marshallingId} ${this.ahqRuntimeParams.buildMode} ${this.ahqRuntimeParams.ahqPackageRoot}`
```

Every Claude launch (CLI skill resolution *and* workflow-program inner commands) now carries the
relay; command `.md` files read only `$0` and ignore the extras (verified: `times-two.md` etc.).

**`index.ts` barrel (`agentic-hq/tools/claude-code`)** — additionally export `CompositionRoot`,
`BuildMode`, `AhqRuntimeParams` so workflow programs can construct the tool.

**math-workflow SKILL.md** — Variables gain `build-mode = $1` and `ahq-package-root = $2`; the
returned command drops all `$AGENTIC_HQ_WORKSPACE_ROOT` use:

```
node "{ahq-package-root}/scripts/run-workflow.cjs" --ahq-package-root="{ahq-package-root}" --build-mode={build-mode} --workflow-js=dist/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.js
```

Info panel rewritten to timelessly-true runtime facts only.

**`scripts/run-workflow.cjs`** — new required `--build-mode=` (validated `build-first` |
`prebuilt`, loud error otherwise, like the existing two options).
`build-first`: run `node <ahqPackageRoot>/scripts/build-release.cjs`, then execution root =
`<ahqPackageRoot>/release`. `prebuilt`: execution root = `<ahqPackageRoot>`. Executes
`<executionRoot>/<workflow-js>`, forwarding `--build-mode`, `--ahq-package-root` and the
passthrough args to the workflow program.

**`math-workflow-demo-cli.ts`** — gains required `--build-mode` / `--ahq-package-root` options
(validated); constructs `new DefaultClaudeCodeTool(new CompositionRoot({ buildMode,
ahqPackageRoot }))`.

**Build/emit re-target** — `tsconfig.build.json` `outDir` → `release/dist`;
`build-release.cjs` drops the repo-`dist/` step and the manifest copy; **delete
`scripts/dist-package.json`** (grep first for remaining references and update them: build script,
comments, tarball e2e). Repo-root `dist/` ceases to exist.

**`package.json`** — `test:e2e:cross-workspace-demo-math-workflow` loses its `pnpm build && `
prefix and its interim `//` comment.

**Test updates** — as listed under Tests Being Created.

## Risks/Unknowns/Concerns

- **`pnpm pack` from `release/` inside the pnpm workspace** — expected to behave as a plain
  package pack once `release/` is workspace-excluded; the tarball e2e proves it either way. If
  pnpm surprises us here, fallback is packing via a temp copy outside the repo (would be raised
  before implementing).
- **Extra positional args to legacy skills** — unmigrated workflows' SKILL.mds and all command
  `.md` files read only `$0`; the two extra relayed tokens should be inert. The string-reversal
  e2e is the regression proof. Worst case: a legacy skill's AI mentions the unexpected args in
  chat output (cosmetic).
- **Paths with spaces in the skill-hop relay** — the whitespace-separated positional relay
  already can't carry a space-containing io-files path today; `ahq-package-root` joins that
  existing limitation class (not new engineering; noted for honesty).
- **Commander regression risk** — the new options never reach Commander, but per the 2026-03-14
  lesson the binary is run by hand in GREEN, not just unit-tested.
- **Dev-run build latency** — every dev workflow run now does a clean build (a few seconds of
  tsc + staging) before launching. Accepted cost of the parity guarantee (Decision 5).
- **The tarball e2e is the only full proof of several Phase 1 behaviours** (pack-from-release,
  executableFiles bits) — it takes ~2 minutes and involves 3 real Claude steps; the known
  `div-five` flake (AHQ-196) may need a re-run.

## Follow-up Ideas

- **AHQ-198:** guards blocking `pack`/`publish` from the repo root; publish checklist becomes
  `pnpm build` + `cd release && pnpm publish`; consider trimming inert ts-workflow sources and
  plugin-local pnpm files from the staged plugins; un-private + registry hygiene fields
  (`license`, `repository`, `keywords`).
- **AHQ-200:** legacy env-var readers migrate to constructor-injected `ahqPackageRoot`; the
  wrappers' dual-write and the dev wrapper's REFACTOR comment retire.
- **AHQ-201:** universal funnel — route user-authored workflows through the same runner (human
  preference recorded in brief UPDATE 3); revisit Decision 2 (dev CLI process parity) with it.
- Incremental/`tsc --build` mode for `build-first` if dev latency ever matters.
- npm convenience script for the new runner integration test (repo convention).

## UPDATES

**UPDATE 1 (2026-08-10, agreed with the human at the Implementer stage, via AskUserQuestion:
"Proceed as planned"):** During implementation the Implementer found an internal conflict in this
plan: making `DefaultClaudeCodeTool`'s `root` parameter required (as planned) crashes the six
unmigrated legacy workflow CLIs that call `new DefaultClaudeCodeTool()` with no arguments
(string-reversal, quick-jira, full-jira-tdd-story, add-feature, add-feature-detailed-example,
create-workflow — all resolve the repo's live `.ts` source at runtime via the `ln -sfn` + tsx
path). That in turn makes the plan's own Phase 2 regression net
`pnpm test:e2e:agentic-hq-cli-string-reversal` (verified green immediately before the change) go
red, and relaxes the "other workflows' behaviour unchanged" AC. The human was offered a
legacy-env-var-shim alternative and chose to **proceed as planned**: `root` is strictly required,
the six legacy workflow CLIs are accepted as broken, and the string-reversal regression e2e is
accepted red until AHQ-200/201 migrate the legacy workflows. The failing e2e is left in place
(not weakened, deleted, or skipped). Mechanical fallout: four repo test files that construct the
tool directly (`claude-executes-command-using-file-io`, `real-claude-self-termination-skill`,
`custom-commands-create-and-get-status-of-test-jira` integration tests and the
`cross-workspace-quick-jira-workflow` e2e) were updated to pass an explicit
`new CompositionRoot({ buildMode: 'build-first', ahqPackageRoot: process.cwd() })` so
`pnpm typecheck` (a mandated validate gate covering `tests/**`) still passes.

**UPDATE 2 (2026-08-10, requested by the human at the Implementer approval gate):** the plan's
primitive-typed runtime params (`AhqRuntimeParams` as a plain data interface with
`buildMode: 'build-first' | 'prebuilt'` and `ahqPackageRoot: string`) are replaced by value
objects, per the human's instruction to turn stored primitives into interfaces and classes:
`AhqRuntimeParams` becomes a getter interface implemented by `DefaultAhqRuntimeParams`
(`src/runtime-params/`); `ahqPackageRoot` becomes interface `AhqPackageRoot` +
`DefaultAhqPackageRoot` (empty path throws); `BuildMode` becomes an interface with
declaration-merged companion constants — `BuildMode.BUILD_FIRST` / `BuildMode.PREBUILT` are the
only instances (hidden implementation class, human chose this "Variant A" companion-object shape
over an exported `DefaultBuildMode` class after discussion) and `BuildMode.fromValue()` is the
single validation point at the argv/CLI boundaries. The relay string, SKILL.md contract, runner
(plain CJS), and bin wrappers are unchanged — this is a TypeScript-internal API reshape. Scope
note: pre-existing primitive-typed fields (e.g. `ClaudeCommandBuilder.executable`/`extraArgs`,
`CLICommand.executable`/`args`) predate this ticket and are left for a follow-up.

**UPDATE 3 (2026-08-10, requested by the human at the Implementer approval gate):** the plan's
Phase 2 shape for the math workflow CLI — each workflow file declaring the mandatory
`--build-mode`/`--ahq-package-root` Commander options and hand-assembling
`new DefaultClaudeCodeTool(new CompositionRoot(new DefaultAhqRuntimeParams(...)))` — is rejected:
"every single new workflow Typescript class will need all this code duplicated into it … it's just
generic framework code that shouldn't be copied and duplicated into every typescript — it should be
**hidden** by the framework." The human further asked for a missing *concept* rather than a bare
factory function, and chose the name **`WorkflowRuntime`**: a new interface
(`src/interfaces/workflow-runtime.ts`, methods `getClaudeCodeTool(): Tool` and
`getWorkflowArgs(): string[]`) implemented by **`DefaultWorkflowRuntime`**
(`src/workflow-runtime/`), constructed from raw `process.argv`. The constructor extracts and
validates the framework options via `extractAhqRuntimeParams` (fail-fast at construction);
`getClaudeCodeTool()` derives a fully wired tool per call; `getWorkflowArgs()` returns the argv
with the framework options stripped, for the workflow's own Commander parse. Both are exported
from the `agentic-hq/tools/claude-code` barrel — a workflow file now contains only
workflow-specific code plus one bootstrap line. Supporting refactor:
`extract-ahq-runtime-params.ts` moves from `src/cli/` to `src/runtime-params/` (it is now shared
by the main CLI and the workflow runtime, not CLI-specific), with its unit test moved to mirror
and its error wording made neutral about which entry-point wrapper inserts the options. The
runner→workflow argv contract, relay string, SKILL.md, and bin wrappers are unchanged. Scope
notes: the six legacy workflow CLIs stay as accepted in UPDATE 1;
`demo:plugin-direct:math-workflow` remains a recorded follow-up (the options are still genuinely
required — the runtime throws loudly without them, by design).

**UPDATE 4 (2026-08-10, requested by the human at the Implementer approval gate):** the free
function `extractAhqRuntimeParams` (created in Phase 2, relocated by UPDATE 3) is rejected as
procedural — "Behaviour should be hidden within and encapsulated in Types/Objects". The human
chose a further missing concept: the **incoming** command line this process was launched with
(the existing `CLICommand`/`WorkflowCommand` types are both *outgoing* — commands we spawn/run).
New interface **`AhqCommandLine`** (`src/interfaces/ahq-command-line.ts`, name chosen by the
human over `AhqArgv`): constructed from the entire raw `process.argv`, it owns the invariant
"an AHQ entry-point wrapper composed me" and yields two views — `getAhqRuntimeParams()` and
`getRemainingArgs()`. Implemented by **`DefaultAhqCommandLine`**
(`src/runtime-params/default-ahq-command-line.ts`, replacing
`extract-ahq-runtime-params.ts` in the same directory); presence validation fail-fast in the
constructor with class-prefixed messages, value validation still delegated to
`BuildMode.fromValue()` / `DefaultAhqPackageRoot`. Consumers become delegation: `app.run()`
constructs one and reads both views; `DefaultWorkflowRuntime` keeps its raw-argv constructor
(so workflow files stay one-line) and internally holds a readonly `AhqCommandLine` it delegates
to. The free function and its unit test are deleted; the five extractor behaviours are
re-expressed verbatim against the object API in
`tests/unit/runtime-params/default-ahq-command-line.unit.test.ts`. The human attached a
documentation condition: both the implementation summary and the `AhqCommandLine` SRP header must
make very clear which command line the type represents and why it is considered different from
the existing `CLICommand` and `WorkflowCommand` types. Additionally during this gate round the
human left a REFACTOR note in `scripts/run-workflow.cjs` ("Should be split into multiple self
documenting functions"); the runner was refactored accordingly (parseCommandLine /
validateOptions / resolveExecutionRoot / runWorkflowProgram, behaviour identical, integration
tests green before and after, note removed as fulfilled).

## Human Approval Confirmation

**Approved by the human, 2026-08-10, in chat: "plan approved".** The approval question explicitly
covered: the plan as written, the deliberate amendment moving the `dist/package.json` retirement
to Phase 2, and the five recorded decisions on the brief's parked items. No conditions were
attached. Before approving, the human asked for a risk assessment ("any of this I should be
worried about?"); the Planner's answer ranked the pack-from-`release/` mechanism, the AI-relay
hop, and the dev-run clean-build latency as the top watch-items, and offered the pre-implementation
`pnpm pack` sanity check now recorded above as an AI-recommended (not human-mandated) gate check.

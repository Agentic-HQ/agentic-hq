# AHQ-208 — Implementation Plan

Implements the settled two-builds design (AHQ-201 supporting docs 01 §3/§9/§10/§11 and 03 §6) on
math-workflow, string-reversal and add-feature. Nothing architectural is reopened here; the only two
Planner-level decisions (doc 01 §9) are called out under *Implementation Changes → 0*.

Work is **test-first per slice** (each slice: RED → CODE → GREEN, then the next slice), in tracer-bullet
order so that the framework/runner contract is proven before any workflow moves onto it, and
add-feature — which this very run executes out of `release/` — moves **last**.

> NOTE: No REFACTOR stage as it adds too much complexity for this simple add-feature workflow (do this in your own custom workflow if reqd)

## Tests Being Created

Acceptance criteria (AC) numbering follows the brief: AC1 separate builds / runner; AC2 three workflows
on the template (dev + tarball, string-reversal green); AC3 user-workspace fixture against a tarball
install; AC4 per-workflow `build-mode` unit-tested; AC5 suites green + docs + no publish.

**Unit (`tests/unit/**`, `pnpm test`) — AC4, the per-workflow mode rule and its plumbing**

- `workflow-discovery/workspace/ahq-package-impl.unit.test.ts` — `getBuildMode()` returns the wrapper's
  mode from the injected `AhqRuntimeParams` (both `BUILD_FIRST` and `PREBUILT`), and the workflows it
  registers carry that mode.
- `workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts` — `getBuildMode()` is
  `BUILD_FIRST` whatever the wrapper's mode; registered workflows carry `BUILD_FIRST`.
- `workflow-discovery/workspace/workspace-impl.unit.test.ts` — returns the injected mode; every plugin's
  workflows carry it.
- `workflow-discovery/plugin/plugin-impl.unit.test.ts`, `workflow/ahq-workflow-impl.unit.test.ts` —
  `AhqWorkflow.getBuildMode()` is the mode the plugin/workspace was built with.
- `cli/workflow-registry-impl.unit.test.ts` — the subcommand action calls
  `builder.build(fullCommand, workflow.getBuildMode(), passthroughArgs)`.
- `workflow/claude/claude-workflow-command-builder.unit.test.ts` — `build()` obtains its tool from
  `toolFactory.createTool(buildMode)` and resolves the skill through that tool.
- `tools/claude-code/default-claude-code-tool-factory.unit.test.ts` (new) — `createTool(mode)` wires a
  `ClaudeCommandBuilder` whose runtime params carry `mode` and the unchanged package root (same
  `vi.mock` pattern as `default-claude-code-tool.unit.test.ts`).
- `kernel/composition-root.unit.test.ts`, `workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts`
  — constructor/getter updates (`AhqPackageImpl` now takes `AhqRuntimeParams`).
- Mechanical: every `Workspace` / `AhqWorkflow` literal stub in tests gains `getBuildMode`.

**Integration (`tests/integration/**`) — AC1**

- `runner/run-workflow-validates-and-executes.integration.test.ts` — the four-option contract:
  missing `--workflow-dir` is a loud error; an absolute `--workflow-js` is a loud error; `prebuilt`
  executes `<workflow-dir>/<workflow-js>` forwarding `--build-mode`, `--ahq-package-root` and
  passthrough args; **`build-first` runs Build 2 then executes** — against a tiny fake `ts-workflow`
  created in `temp/AHQ-208/…` (standard `package.json`/`tsconfig.json`, `src/echo-argv-cli.ts`), it
  asserts `dist/echo-argv-cli.js` was produced, `node_modules/agentic-hq` is a symlink to the given
  `--ahq-package-root`, and the echoed argv — and that nothing named `release/` was created.
- `build/build-determinism.integration.test.ts` — staged artefacts now asserted: `dist/src/cli/main.js`,
  `dist/src/tools/marshalled-io-tools/claude-code/index.d.ts`, and each shipped workflow's
  `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/<wf>/ts-workflow/dist/<cli>.js` (math, string-reversal,
  add-feature); two builds still hash-identical.
- `bin/bin-wrapper-supplies-the-package-root-explicitly.integration.test.ts` — header/describe →
  `agentic-hq-dev`; first test additionally deletes `<repo>/dist` up front and asserts the run leaves
  `dist/src/cli/main.js` + a `.d.ts` behind (Build 1 ran, compiled CLI executed) and creates no
  `release/`. The TEMPORARY second test is untouched (AHQ-209 deletes it).

**E2E (`tests/e2e/**`) — AC2, AC3, AC5**

- `npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts` (file name kept — it is
  referenced by `package.json` and the publish checklist): shipped set gains `string-reversal`
  (`EXPECTED_SHIPPED_SKILLS_BY_PLUGIN`; `'reversal'` leaves `EXCLUDED_WORKFLOW_LIST_SUBSTRINGS` and
  `agentic-hq reversal` is asserted present); `scripts/` ships exactly `run-workflow.cjs` +
  `build-workflow.cjs`; `exports` = `{types: …/index.d.ts, default: …/index.js}` (the "no `.ts`"
  check becomes "no `.ts` that is not a `.d.ts`"); the compiled JS path is now
  `…/skills/<wf>/ts-workflow/dist/<cli>.js` and the "no `package.json` between compiled JS and the
  package root" walk runs for all three; **stripped layout** (doc 01 §11(a) watch-item): no
  `package.json`, `pnpm-lock.yaml`, `.npmrc`, `pnpm-workspace.yaml` anywhere under
  `.agentic-hq/plugins/**/ts-workflow/`; **new test: `reversal` end-to-end from the install** (one Claude
  step) alongside the math run.
- `demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts` — **the no-clone
  collaborator proof (AC3)**: `beforeAll` builds + packs + installs the tarball into a temp prefix under
  `temp/AHQ-208/…` (shared helper, see below), copies the repointed fixture into a clean
  `/tmp/agentic-hq-test-workspaces/test-ws-<uuid>` workspace (no placeholder patching any more), then
  runs **the installed bin** (`<prefix>/bin/agentic-hq`): `list` shows the fixture under *Local
  Workspace*; `string-reversal-copy-for-test -- --string-to-reverse=…` prints the reversed string;
  afterwards `<ws>/…/ts-workflow/dist/string-reversal-demo-cli.js` exists and
  `<ws>/…/ts-workflow/node_modules/agentic-hq` is a symlink to the **installed** package root (Build 2
  ran in the workspace, `build-first` from a `prebuilt` wrapper — the AC4 rule end-to-end); the
  installed package's `hashTree` is unchanged. The "`agentic-hq` on PATH" precondition is removed from
  this test.
  - New shared helper `tests/e2e/helpers/tarball-install-helper-functions.ts`
    (`buildPackAndInstallTarball(runDir)` → `{ tarballPath, installedPackageRoot, installedBinPath }`),
    extracted from the tarball e2e's `beforeAll` and used by both.
- `demo/cross-workspace-demo-math-workflow-…`, `cross-workspace-list-workflows`,
  `cross-workspace-string-reversal`, `cross-workspace-quick-jira-workflow-…` — the PATH precondition and
  commands become `agentic-hq-dev …`; the math one now deletes `<repo>/dist` and math's
  `ts-workflow/dist` (instead of `release/`) so a green run proves both builds from nothing.
  quick-jira stays red (AHQ-209).
- `demo/agentic-hq-cli-string-reversal.e2e.test.ts` — unchanged command (`node bin/agentic-hq.cjs
  reversal …`); goes green once string-reversal is migrated; header note updated.

**Manual validation (no automated test is practical)**

- After the rename: `npm link` from the repo, then `agentic-hq-dev list` from another directory.
- add-feature's own migration is smoke-tested the AHQ-204 way (plain node, no Claude):
  `node scripts/run-workflow.cjs --build-mode=build-first --ahq-package-root=<repo> --workflow-dir=<repo>/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ts-workflow --workflow-js=dist/add-feature-cli.js --help`
  prints usage; the full interactive proof is the next `agentic-hq-dev add-feature` run (AHQ-209).

## Implementation Changes

### 0. Decisions left to the Planner (doc 01 §9) — recommendations for your approval

- **Build 2 installs with `pnpm`** (not npm): keeps the AHQ-152 controls (`frozen-lockfile`,
  `minimumReleaseAge`) and the committed `.npmrc`/`pnpm-workspace.yaml`/lockfile exactly as today; the
  legacy chain already required pnpm, and Corepack/pnpm is the documented prerequisite. Build 2 fails
  loudly (uncaught, naming pnpm) if `pnpm` is not on PATH.
- **Source maps: yes, dev-only.** `tsconfig.build.json` sets `sourceMap: true`; the dev wrapper calls
  `process.setSourceMapsEnabled(true)` before importing the compiled CLI (so dev stack traces point at
  `.ts` lines, the companion to Q6(b)); the release build copies `dist/` **excluding `*.map` and the
  `.tsbuildinfo`**, so nothing extra ships.

### 1. Build 1 — framework (`tsconfig.build.json`, root `package.json`, `.gitignore` verified)

`tsconfig.build.json` loses the per-workflow `include` entries and the `paths` mapping:

```jsonc
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "rootDir": ".",                 // keeps dist/src/cli/main.js — the path both wrappers and exports use
    "outDir": "dist",
    "declaration": true,
    "sourceMap": true,
    "incremental": true,
    "tsBuildInfoFile": "dist/.tsbuildinfo",   // lives inside dist/ so `rm -rf dist` can never leave a stale buildinfo that suppresses emit
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

Root `package.json`: `bin` → `{ "agentic-hq-dev": "bin/agentic-hq.cjs" }` (file name kept; design §10);
`exports` → `{ "./tools/claude-code": { "types": "./src/tools/marshalled-io-tools/claude-code/index.ts", "default": "./dist/src/tools/marshalled-io-tools/claude-code/index.js" } }`
(Q6(c)); new script `"build:framework": "tsc -p tsconfig.build.json"` (used by the two fixed
`demo:plugin-direct:*` scripts and by humans); `"// BUILD"` comment updated. `.gitignore` already
ignores `dist` (any level), `*.tsbuildinfo`, `node_modules/`, `/release/` — verified, nothing to add.
Root `private: true`, `prepack` guard, `engines`, `packageManager` unchanged. `tsx` stays a devDependency
(git scripts and the kill-script integration test still use it).

### 2. Dev wrapper `bin/agentic-hq.cjs` — Build 1, then the compiled CLI (Q6(b), Q6(d))

```js
const packageRoot = path.join(__dirname, '..');
// Build 1 — owned by this wrapper: incremental tsc (~1 s after the first run); a type error stops here
try {
  execFileSync(path.join(packageRoot, 'node_modules', '.bin', 'tsc'), ['-p', 'tsconfig.build.json'],
    { cwd: packageRoot, stdio: 'inherit' });
} catch (error) { process.exit(error.status || 1); }   // tsc already printed the errors
process.setSourceMapsEnabled(true);
process.argv.splice(2, 0, '--build-mode=build-first', `--ahq-package-root=${packageRoot}`);
import(url.pathToFileURL(path.join(packageRoot, 'dist', 'src', 'cli', 'main.js')).href);
```

The two wrappers now differ only by the build step, the mode literal and the source-map line;
`bin/agentic-hq-prebuilt.cjs` is unchanged.

### 3. Build 2 — `scripts/build-workflow.cjs` (new, shipped in the release)

`node build-workflow.cjs --workflow-dir=<abs> --ahq-package-root=<abs>` (named options, same style and
fail-fast validation as the runner; both required). Steps, in this order:

1. `execFileSync('pnpm', ['install'], { cwd: workflowDir, stdio: 'inherit' })` — the workflow's own
   `.npmrc` makes it frozen; a no-op after the first run. `ENOENT` is re-thrown as an error that says
   pnpm must be on PATH for `build-first`.
2. Ensure `<workflowDir>/node_modules/agentic-hq → <ahqPackageRoot>`: `lstat` — a symlink already
   pointing at the root is left alone; any other symlink is unlinked, a real directory removed; then
   `fs.symlinkSync(ahqPackageRoot, link, 'dir')`. Always after step 1, because pnpm prunes the foreign
   entry (the legacy `ln -sfn`-after-install reason).
3. `execFileSync(path.join(workflowDir, 'node_modules', '.bin', 'tsc'), ['-p', 'tsconfig.json'], { cwd: workflowDir, stdio: 'inherit' })`
   → `<workflowDir>/dist/<cli>.js`, type-checked against the framework through the symlink.

Everything it writes stays inside `<workflowDir>`; nothing is written under the package root.

### 4. Runner `scripts/run-workflow.cjs` — the four-option contract (doc 03 §6)

`--build-mode`, `--ahq-package-root`, `--workflow-dir`, `--workflow-js` (relative to `--workflow-dir`;
an absolute value is rejected) — all required, loud errors. `build-first` →
`node <ahqPackageRoot>/scripts/build-workflow.cjs --workflow-dir=… --ahq-package-root=…` then run;
`prebuilt` → run. Run = `node <workflow-dir>/<workflow-js> --build-mode=<…> --ahq-package-root=<…> [passthrough…]`.
`resolveExecutionRoot`/`build-release.cjs`/`release/` disappear from the runner; header comment rewritten.

### 5. Per-workflow `build-mode` in the CLI (doc 01 §3.6) — one visible rule, threaded to the skill hop

```ts
// src/workflow-discovery/interfaces/workspace.ts
/** The mode of every workflow discovered under this workspace (AHQ-208): a user workspace holds
 *  source → BUILD_FIRST; the AHQ package's workflows inherit the wrapper's mode. */
getBuildMode(): BuildMode;
```

- `AhqPackageImpl(ahqRuntimeParams: AhqRuntimeParams)` (was `AhqPackageRoot`): `getBuildMode()` →
  `params.getBuildMode()`; `getRoot()` → `params.getAhqPackageRoot().getPath()`.
- `CurrentUserWorkspaceImpl(ahqPackageRoot)`: `getBuildMode()` → `BuildMode.BUILD_FIRST`.
- `WorkspaceImpl(displayName, rootDir, ahqPackageRoot, buildMode)`: returns it and builds
  `new PluginImpl(name, rootDir, buildMode)`; `PluginImpl` builds `new AhqWorkflowImpl(file, buildMode)`;
  `AhqWorkflow.getBuildMode(): BuildMode` (location is identity).
- `WorkflowCommandBuilder.build(skillPath, buildMode, passthroughArgs)`; `WorkflowRegistryImpl`'s action
  passes `workflow.getBuildMode()`.
- `ClaudeWorkflowCommandBuilder(toolFactory: ToolFactory, cliWrapper, workspace)` — `build()` does
  `this.toolFactory.createTool(buildMode).execute(skillPath, UNUSED_INPUT_STRING)`.
- New `src/interfaces/tool-factory.ts`: `interface ToolFactory { createTool(buildMode: BuildMode): Tool }`;
  new `src/tools/marshalled-io-tools/claude-code/default-claude-code-tool-factory.ts`:

  ```ts
  export class DefaultClaudeCodeToolFactory implements ToolFactory {
    constructor(private readonly ahqPackageRoot: AhqPackageRoot) {}
    createTool(buildMode: BuildMode): Tool {
      return new DefaultClaudeCodeTool(
        new CompositionRoot(new DefaultAhqRuntimeParams(buildMode, this.ahqPackageRoot)));
    }
  }
  ```
- `CompositionRoot.getAhqPackage()` → `new AhqPackageImpl(this.ahqRuntimeParams)`;
  `getWorkflowCommandBuilder()` → `new ClaudeWorkflowCommandBuilder(new DefaultClaudeCodeToolFactory(params.getAhqPackageRoot()), …)`.
  `WorkflowSearchResultsImpl(ahqRuntimeParams)`; `app.run` passes `ahqCommandLine.getAhqRuntimeParams()`.
- Untouched: `ClaudeCommandBuilder` (still appends `<marshallingId> <buildMode> <root>` from its params —
  it just receives per-workflow params now), `Tool`, `DefaultClaudeCodeTool`, `DefaultWorkflowRuntime`
  (inside a workflow program the runner-forwarded mode *is* the workflow's mode), AHQ-205 first-wins
  registration and plugin-dir ordering.

### 6. The single `SKILL.md` template + standard `ts-workflow` file set (math, string-reversal, add-feature, fixture)

`SKILL.md` — identical for all, bar the CLI filename; `build-mode = $1`, `ahq-package-root = $2`
relayed verbatim as today:

```
"command-output-string": "node \"{ahq-package-root}/scripts/run-workflow.cjs\" --ahq-package-root=\"{ahq-package-root}\" --build-mode={build-mode} --workflow-dir=\"{skill-base-dir}/ts-workflow\" --workflow-js=dist/<wf>-cli.js"
```

The "INFO FOR YOU ONLY" paragraph is reworded: `build-first` = build **this workflow** (Build 2) then run;
`prebuilt` = run; the runner never builds the framework.

Standard `ts-workflow/` files (same bytes everywhere; only `package.json` `name` differs):

```jsonc
// package.json — no agentic-hq dependency, no link:, no tsx, no postinstall, no scripts
{ "name": "agentic-hq-demo-<wf>", "version": "0.0.1", "type": "module",
  "engines": { "node": "^22.0.0 || ^24.0.0" },
  "dependencies": { "commander": "^14.0.3" },
  "devDependencies": { "typescript": "^5.9.3", "@types/node": "^22" } }
// tsconfig.json — today's options minus noEmit, plus rootDir/outDir
{ "compilerOptions": { "strict": true, "target": "ES2023", "module": "ESNext", "moduleResolution": "Bundler",
    "rootDir": "src", "outDir": "dist", "skipLibCheck": true, "esModuleInterop": true,
    "allowSyntheticDefaultImports": true, "isolatedModules": true, "types": ["node"] },
  "include": ["src/**/*"] }
```

plus `.npmrc` (unchanged, `frozen-lockfile=true`), `pnpm-workspace.yaml` (rewritten: `packages: ['.']`
+ `minimumReleaseAge: 10080` with a short AHQ-152 note — the `allowBuilds` entries for agentic-hq /
node-pty / esbuild no longer apply and go), `.gitignore` (`node_modules/`, `dist/`), and a regenerated
`pnpm-lock.yaml` (delete the old one, delete any old `node_modules/`, run Build 2 once — pnpm 11 creates
a fresh lockfile under `frozen-lockfile` when none exists — commit it). `@types/node` is required:
`process`/`console` in the CLI and the framework's `node:*` types are resolved from the workflow's own
`node_modules` in a user workspace with no clone.

- **math-workflow**: SKILL.md template; standard files; CLI unchanged.
- **string-reversal**: SKILL.md template; CLI onto `new DefaultWorkflowRuntime(process.argv)` /
  `runtime.getClaudeCodeTool()` / `program.parse(runtime.getWorkflowArgs())` (math's shape); standard
  files; its entry leaves `EXCLUDED_UNMIGRATED_SKILLS` (the other four stay for AHQ-209).
- **add-feature** (last): SKILL.md template; standard files; CLI unchanged.
- **Fixture** `tests/e2e/fixtures/string-reversal-copy-for-test/…/ts-workflow`: same template + standard
  files (a committed lockfile is now fine — the depth-relative `link:` that forbade it is gone, so the
  exact-pin workaround and `REPO_ROOT_PLACEHOLDER` go); CLI onto `DefaultWorkflowRuntime`.

### 7. Release build `scripts/build-release.cjs` (doc 01 §3.8, §11(a))

1. Clean `release/` and `dist/` (clean Build 1 for belt-and-braces determinism).
2. Build 1: `tsc -p tsconfig.build.json`.
3. Build 2 for each `skills/*/ts-workflow/` of every `SHIPPED_PLUGINS` entry not in
   `EXCLUDED_UNMIGRATED_SKILLS`: `node scripts/build-workflow.cjs --workflow-dir=<abs> --ahq-package-root=<repo>`.
4. Stage: `release/dist` ← `dist/` minus `*.map` and `.tsbuildinfo`; `release/bin/agentic-hq-prebuilt.cjs`;
   `release/scripts/{run-workflow,build-workflow}.cjs`; plugins copied with the existing filter extended
   to drop, **inside any `ts-workflow/` directory**, `package.json`, `pnpm-lock.yaml`, `.npmrc`,
   `pnpm-workspace.yaml`, `.gitignore` (and `node_modules` as today); README/LICENSE.
5. Manifest: `exports` → `{ "./tools/claude-code": { "types": "./dist/src/tools/marshalled-io-tools/claude-code/index.d.ts", "default": "./dist/src/tools/marshalled-io-tools/claude-code/index.js" } }`;
   everything else as today (`bin` → `agentic-hq` → prebuilt wrapper is already generated here, so the
   shipped name is untouched by the rename).

### 8. Minimal correctness-only edits (no publish)

- `package.json`: `demo:plugin-direct:string-reversal|math-workflow` → `pnpm build:framework && node scripts/run-workflow.cjs --build-mode=build-first --ahq-package-root="$PWD" --workflow-dir="$PWD/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/<wf>/ts-workflow" --workflow-js=dist/<cli>.js`
  (quick/full-jira ones are AHQ-209's); comments for `demo:agentic-hq-cli` mention `agentic-hq-dev`.
- `.github/workflows/ci.yml`: smoke step `agentic-hq list` → `agentic-hq-dev list` (+ comment).
- `README.md` step 5/7: `agentic-hq-dev list`, `agentic-hq-dev reversal …`, one line saying the linked
  clone binary is `agentic-hq-dev` (rebuilds from source every run) while an npm install gives `agentic-hq`;
  `docs/user-docs/troubleshooting-quickstart.md` `npm link` headings mention `agentic-hq-dev`.
- `docs/dev/how-agentic-hq-works.md`: CLI-dispatch step 1 (wrapper runs Build 1 then the compiled CLI),
  worked-example step 2 (runner command) and step 4 snippet (`DefaultWorkflowRuntime`).
- `docs/dev/publish-checklist.md` §3: expected skills now include `agentic-hq-demos-plugin/string-reversal`;
  `exports` may carry `types` → `.d.ts`; file-list checks add `scripts/build-workflow.cjs`, a `.d.ts`
  spot-check, and "no `ts-workflow/package.json|pnpm-lock.yaml|.npmrc|pnpm-workspace.yaml` in the tarball".
- `docs/dev/npm-commands.md`: add `build:framework`.

### Sequence (each slice RED → CODE → GREEN; baseline runs first)

0. Baseline: `pnpm validate`, `pnpm test:integration:bin-wrapper`, `pnpm test:integration:build-determinism`,
   the runner integration test — record current state before touching anything.
1. Build 1 + dev wrapper + rename (§1, §2): RED = bin-wrapper test's new `dist/` assertions; GREEN =
   tests + `npm link` → `agentic-hq-dev list` from another directory + `pnpm validate`.
2. Build 2 + runner (§3, §4): RED = runner integration test (four options, build-first against the fake
   workflow); GREEN = it passes, run the runner by hand once.
3. Per-workflow mode (§5): RED = the unit tests; GREEN = `pnpm validate`.
4. Release build + math-workflow (§7, §6-math): RED = build-determinism + cross-workspace math e2e;
   GREEN = both, plus `agentic-hq-dev math -- --input-number=11` from a temp workspace.
5. string-reversal (§6, `EXCLUDED_UNMIGRATED_SKILLS`, demo scripts): RED = tarball e2e + the two
   string-reversal e2es; GREEN = all three.
6. User-workspace fixture against the tarball (§6-fixture, shared helper): RED = rewritten e2e; GREEN.
7. add-feature last (§6-add-feature), then the remaining e2e renames, CI, docs (§8); `--help` smoke via
   the runner; final `pnpm validate` + `pnpm test:integration` + the e2e set above (quick-jira stays red).

## Risks/Unknowns/Concerns

- **First-ever `.d.ts` emit** may surface TS4xxx "has or is using private name" errors in `src/`; fix by
  exporting the named type, never by widening to `any`.
- **Build 2 in the clone type-checks framework *source*** (the root `types` condition → `.ts`, Q6(c)):
  a few seconds per run and framework type errors surface inside a workflow build — by design (the
  framework is already strict-clean; against an npm install it reads the shipped `.d.ts`). This is
  already how today's `link:` set-ups type-check, so the mechanics are proven; only emit is new.
- **pnpm prunes the foreign `node_modules/agentic-hq` symlink** on install, so Build 2 must re-link after
  every install (step order is the guard). Existing `node_modules/` in add-feature/string-reversal from
  the old `link:` installs should be removed before the first new Build 2.
- **This run executes add-feature out of `release/`** (old runner): the running program is already in
  memory, so rebuilding/wiping `release/` during the work is safe, but add-feature's own files move last
  and its full proof is the next `agentic-hq-dev add-feature` run (AHQ-204 precedent).
- **`npm link` must be re-run** after the `bin` rename to get `agentic-hq-dev` on PATH; the stale
  `agentic-hq` link in your prefix still points at the clone until you remove it
  (`npm uninstall -g agentic-hq`) — your call when, it is what frees the name for the registry install.
- **Tarball / determinism / publish-guards tests get slower**: the release build now runs `pnpm install`
  in three skill dirs and the tarball e2e runs two Claude workflows.
- **Frozen lockfile regeneration** relies on pnpm 11 creating a lockfile when none exists under
  `frozen-lockfile=true` (verified 2026-06-24, AHQ-164); if that ever changes, regenerate with an
  explicit `pnpm install --no-frozen-lockfile` once and commit.
- `@types/node` as a workflow devDependency is a Planner addition to the standard file set (needed for
  the no-clone case) — flagging it so it is a conscious yes.

## Follow-up Ideas

- AHQ-209: remaining four workflows + scaffolder onto this template, `EXCLUDED_UNMIGRATED_SKILLS` gone,
  TEMPORARY half of the bin-wrapper test deleted, `demo:plugin-direct:quick|full-jira` fixed, `0.2.0`.
- AHQ-203: runner-registered resolve hook replacing self-reference for third-party plugin releases.
- Rename `prebuilt-tarball-install-runs-math-workflow.e2e.test.ts` (it now runs math + reversal) once its
  references (script name, publish checklist) can move together.
- AHQ-206 (`Workspace` vs `PluginSource` split) — `getBuildMode()` belongs on the discovery-root side of
  that split.
- AHQ-199: the README/docs pass with the final names.

## Human Approval Confirmation

_Awaiting human approval._

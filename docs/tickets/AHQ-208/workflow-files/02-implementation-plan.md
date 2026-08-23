# AHQ-208 — Implementation Plan

Implements the settled two-builds design (AHQ-201 supporting docs 01 §3/§9/§10/§11 and 03 §6) on
math-workflow, string-reversal and add-feature. Nothing architectural is reopened here; the only
Planner-level decisions (doc 01 §9) are called out under *Implementation Changes → 0*.

**Naming standard (agreed 2026-08-19):** the two builds are **Framework Build (1)** and **Workflow Build
(2)** — in the plan, in code comments, scripts and docs. "(1)"/"(2)" mark *dependency order* (a Workflow
Build always compiles against the output of a Framework Build that has already happened), not "both always
run". `docs/glossary.md` (section *Builds & running*) and `docs/dev/how-agentic-hq-works.md` (section
*Builds: Framework Build (1) and Workflow Build (2)*) now define and explain both, together with
`build-mode`, the shared runner, `ts-workflow/`, the staged release tree and `agentic-hq-dev` vs
`agentic-hq`; the AHQ-201 design docs keep their historical "Build 1"/"Build 2" wording. The Implementer
uses the standard names everywhere new text is written (code comments, scripts, tests, docs).

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
  passthrough args; **`build-first` runs the Workflow Build (2) then executes** — against a tiny fake
  `ts-workflow` created in `temp/AHQ-208/…` (standard `package.json`/`tsconfig.json`,
  `src/echo-argv-cli.ts`), it asserts `dist/echo-argv-cli.js` was produced, `node_modules/agentic-hq`
  is a symlink to the given `--ahq-package-root`, and the echoed argv — and that nothing named
  `release/` was created.
- `build/build-determinism.integration.test.ts` — staged artefacts now asserted: `dist/src/cli/main.js`,
  `dist/src/cli/main.js.map`, `dist/src/tools/marshalled-io-tools/claude-code/index.d.ts`, and each
  shipped workflow's `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/<wf>/ts-workflow/dist/<cli>.js`
  (math, string-reversal, add-feature); no `.tsbuildinfo` anywhere in `release/`; two builds still
  hash-identical.
- `bin/bin-wrapper-supplies-the-package-root-explicitly.integration.test.ts` — header/describe →
  `agentic-hq-dev`; first test additionally deletes `<repo>/dist` up front and asserts the run leaves
  `dist/src/cli/main.js` + a `.d.ts` behind (Framework Build (1) ran, compiled CLI executed) and creates
  no `release/`. The TEMPORARY second test is untouched (AHQ-209 deletes it).

**E2E (`tests/e2e/**`) — AC2, AC3, AC5**

- `npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts` (file name kept — it is
  referenced by `package.json` and the publish checklist): shipped set gains `string-reversal`
  (`EXPECTED_SHIPPED_SKILLS_BY_PLUGIN`; `'reversal'` leaves `EXCLUDED_WORKFLOW_LIST_SUBSTRINGS` and
  `agentic-hq reversal` is asserted present); `scripts/` ships exactly `run-workflow.cjs` +
  `build-workflow.cjs`; `exports` = `{types: …/index.d.ts, default: …/index.js}` (the "no `.ts`"
  check becomes "no `.ts` that is not a `.d.ts`"); `dist/` ships `.js`, `.js.map` and `.d.ts` and no
  `.tsbuildinfo`; the compiled JS path is now `…/skills/<wf>/ts-workflow/dist/<cli>.js` and the "no
  `package.json` between compiled JS and the package root" walk runs for all three; **stripped
  layout** (doc 01 §11(a) watch-item): no `package.json`, `pnpm-lock.yaml`, `.npmrc`,
  `pnpm-workspace.yaml` anywhere under `.agentic-hq/plugins/**/ts-workflow/`; **new test: `reversal`
  end-to-end from the install** (one Claude step) alongside the math run.
- `demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts` — **the no-clone
  collaborator proof (AC3)**: `beforeAll` builds + packs + installs the tarball into a temp prefix under
  `temp/AHQ-208/…` (shared helper, see below), copies the repointed fixture into a clean
  `/tmp/agentic-hq-test-workspaces/test-ws-<uuid>` workspace (no placeholder patching any more), then
  runs **the installed bin** (`<prefix>/bin/agentic-hq`): `list` shows the fixture under *Local
  Workspace*; `string-reversal-copy-for-test -- --string-to-reverse=…` prints the reversed string;
  afterwards `<ws>/…/ts-workflow/dist/string-reversal-copy-for-test-cli.js` exists and
  `<ws>/…/ts-workflow/node_modules/agentic-hq` is a symlink to the **installed** package root (the
  Workflow Build (2) ran in the workspace, `build-first` from a `prebuilt` wrapper — the AC4 rule
  end-to-end); the installed package's `hashTree` is unchanged. The "`agentic-hq` on PATH"
  precondition is removed from this test.
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

### 0. Decisions left to the Planner (doc 01 §9) — **APPROVED by the human 2026-08-19** (see *Human Approval Confirmation*)

- **Workflow Build (2) installs with `pnpm`** (not npm) — approved: keeps the AHQ-152 controls
  (`frozen-lockfile`, `minimumReleaseAge`) and the committed `.npmrc`/`pnpm-workspace.yaml`/lockfile
  exactly as today; the legacy chain already required pnpm, and Corepack/pnpm is the documented
  prerequisite. The build fails loudly (uncaught, naming pnpm) if `pnpm` is not on PATH.
- **Source maps: emit, ship and enable them** (revised 2026-08-19 from "dev-only" at the human's
  prompting; approved): the Framework Build
  sets `sourceMap: true` + `inlineSources: true` (the `.ts` text rides inside each `.js.map`, so an
  installed package can show original lines although `src/` does not ship — measured: ~97 KB of JS
  gains ~199 KB of maps; `sources` paths are relative, no machine paths); the release copies `dist/`
  **including `*.map`** and excluding only `.tsbuildinfo` (tsc's incremental cache — of no use to a
  consumer, like shipping an `.eslintcache`). Both bin wrappers call `process.setSourceMapsEnabled(true)`
  before importing the compiled CLI; the runner spawns workflow programs with `--enable-source-maps`;
  the standard `ts-workflow/tsconfig.json` also sets `sourceMap: true`, so workflow authors' own traces
  point at their `.ts` too.

### 1. Framework Build (1) — `tsconfig.build.json`, root `package.json`, `.gitignore` verified

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
    "inlineSources": true,
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

### 2. Dev wrapper `bin/agentic-hq.cjs` — Framework Build (1), then the compiled CLI (Q6(b), Q6(d))

```js
const packageRoot = path.join(__dirname, '..');
// Framework Build (1) — owned by this wrapper: incremental tsc (~1 s once warm); a type error stops here
try {
  execFileSync(path.join(packageRoot, 'node_modules', '.bin', 'tsc'), ['-p', 'tsconfig.build.json'],
    { cwd: packageRoot, stdio: 'inherit' });
} catch (error) { process.exit(error.status || 1); }   // tsc already printed the errors
process.setSourceMapsEnabled(true);
process.argv.splice(2, 0, '--build-mode=build-first', `--ahq-package-root=${packageRoot}`);
import(url.pathToFileURL(path.join(packageRoot, 'dist', 'src', 'cli', 'main.js')).href);
```

`bin/agentic-hq-prebuilt.cjs` gains only the `process.setSourceMapsEnabled(true)` line; the two wrappers
now differ by the build step and the mode literal alone.

### 3. Workflow Build (2) — `scripts/build-workflow.cjs` (new, shipped in the release)

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
   → `<workflowDir>/dist/<cli>.js` (+ `.js.map`), type-checked against the framework through the symlink.

Everything it writes stays inside `<workflowDir>`; nothing is written under the package root.

### 4. Runner `scripts/run-workflow.cjs` — the four-option contract (doc 03 §6)

`--build-mode`, `--ahq-package-root`, `--workflow-dir`, `--workflow-js` (relative to `--workflow-dir`;
an absolute value is rejected) — all required, loud errors. `build-first` →
`node <ahqPackageRoot>/scripts/build-workflow.cjs --workflow-dir=… --ahq-package-root=…` then run;
`prebuilt` → run. Run = `node --enable-source-maps <workflow-dir>/<workflow-js> --build-mode=<…> --ahq-package-root=<…> [passthrough…]`.
`resolveExecutionRoot`/`build-release.cjs`/`release/` disappear from the runner; header comment rewritten
("never builds the framework").

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

`SKILL.md` — **byte-identical for every workflow** (decided 2026-08-19): no per-workflow line at all.
The skill derives `skill-id` from the `skill-base-dir` Claude Code already hands every skill (its final
path segment is the skill directory name, which is the `skillId` of `ahq-workflow.json` — verified for
all eight workflows; `shortId` would not work), and the TypeScript program name follows the **standard
program-name convention `<skill-id>-cli.ts`** (`workflow-program-name = {skill-id}-cli`). The
frontmatter `description` is generic (nothing reads it functionally — `disable-model-invocation:
true`, the skill name carries the workflow name, `agentic-hq list` reads `ahq-workflow.json`);
`build-mode = $1` / `ahq-package-root = $2` are relayed verbatim as today; no new chain variable and no
code change is needed for this. The complete file, identical for math-workflow, string-reversal,
add-feature and the e2e fixture:

````markdown
---
description: Returns the command that runs this workflow's TypeScript program via the shared agentic-hq workflow runner
disable-model-invocation: true
---

## Variables

Set:
skill-base-dir = the skill base directory you were provided with when you ran this skill.
skill-id = the final path segment of {skill-base-dir} (this skill's directory name, which is its skill id)
workflow-program-name = {skill-id}-cli
command-input-output-files-directory = $0
build-mode = $1
ahq-package-root = $2

List the variable names and values for the user, and explain where they came from.

## Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "node \"{ahq-package-root}/scripts/run-workflow.cjs\" --ahq-package-root=\"{ahq-package-root}\" --build-mode={build-mode} --workflow-dir=\"{skill-base-dir}/ts-workflow\" --workflow-js=dist/{workflow-program-name}.js"
}
```

INFO FOR YOU ONLY (Don't tell user): The command above invokes the shared workflow runner with the values you were handed — you relay `build-mode` and `ahq-package-root` VERBATIM without interpreting or acting on them; `skill-base-dir` names this workflow's own `ts-workflow/` directory, and `skill-id` (its final path segment) names this workflow's TypeScript program by convention: `src/{skill-id}-cli.ts`, compiled to `dist/{skill-id}-cli.js`. The runner is the only code that acts on `build-mode`: `build-first` runs the Workflow Build for THIS workflow (pnpm install → symlink node_modules/agentic-hq → tsc into ts-workflow/dist/) and then runs it; `prebuilt` just runs the already-built dist/. The runner never builds the agentic-hq framework itself. Everything runs under plain node — no environment variables.

Tell the user:
- What file you have written the output to
- The contents of the file
- What the file contents will be used to do: construct the command used to run the TypeScript program that runs the full workflow.

## Self-Terminate

/agentic-hq-core-plugin:self-termination
````

Standard `ts-workflow/` files (same bytes everywhere; only `package.json` `name` differs):

```jsonc
// package.json — no agentic-hq dependency, no link:, no tsx, no postinstall, no scripts
{ "name": "agentic-hq-demo-<wf>", "version": "0.0.1", "type": "module",
  "engines": { "node": "^22.0.0 || ^24.0.0" },
  "dependencies": { "commander": "^14.0.3" },
  "devDependencies": { "typescript": "^5.9.3", "@types/node": "^22" } }
// tsconfig.json — today's options minus noEmit, plus rootDir/outDir/sourceMap
{ "compilerOptions": { "strict": true, "target": "ES2023", "module": "ESNext", "moduleResolution": "Bundler",
    "rootDir": "src", "outDir": "dist", "sourceMap": true, "skipLibCheck": true, "esModuleInterop": true,
    "allowSyntheticDefaultImports": true, "isolatedModules": true, "types": ["node"] },
  "include": ["src/**/*"] }
```

plus `.npmrc` (unchanged, `frozen-lockfile=true`), `pnpm-workspace.yaml` (rewritten: `packages: ['.']`
+ `minimumReleaseAge: 10080` with a short AHQ-152 note — the `allowBuilds` entries for agentic-hq /
node-pty / esbuild no longer apply and go), `.gitignore` (`node_modules/`, `dist/`), and a regenerated
`pnpm-lock.yaml` (delete the old one, delete any old `node_modules/`, run the Workflow Build once —
pnpm 11 creates a fresh lockfile under `frozen-lockfile` when none exists — commit it). `@types/node` is
required: `process`/`console` in the CLI and the framework's `node:*` types are resolved from the
workflow's own `node_modules` in a user workspace with no clone.

**Program-name convention `<skill-id>-cli.ts` — every `-demo-cli` file is renamed in this ticket**
(`git mv`; `program.name(…)` and header comments follow the new name; historical records under
`docs/jira-docs/` and earlier `docs/tickets/` are left alone). Verified 2026-08-19 across all eight
workflows: `skillId` equals the skill directory name everywhere (it must — the `/pluginId:skillId`
invocation is built from it), `shortId` differs for four (so it cannot be the source), and the CLI file
already complies for add-feature, add-feature-detailed-example and create-workflow. The five renames
and their live references (found by grep):

- `math-workflow-demo-cli.ts` → `math-workflow-cli.ts` (slice 4) and `string-reversal-demo-cli.ts` →
  `string-reversal-cli.ts` (slice 5) — the workflows being migrated; references: root `package.json`
  demo scripts; `tests/integration/build/build-determinism.integration.test.ts` and
  `tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts` path constants;
  `docs/dev/how-agentic-hq-works.md` (diagram, layout tree, links, worked example);
  `docs/user-docs/workflow-descriptions/overview-of-workflows.md` (links); and the three
  `create-workflow` command files that cite `math-workflow-demo-cli.ts` as their example file
  (`01-…` lines 36/419, `02-…` lines 42/304, `03-…` line 61 — file-name-only edits; the scaffolder
  itself is AHQ-209's).
- the fixture's `string-reversal-demo-cli.ts` → `string-reversal-copy-for-test-cli.ts` (slice 6).
- `quick-jira-workflow-demo-cli.ts` → `quick-jira-workflow-cli.ts` and
  `full-jira-tdd-story-workflow-demo-cli.ts` → `full-jira-tdd-story-workflow-cli.ts` (slice 5, with
  the demo scripts) — **rename only, these two workflows stay unmigrated/legacy for AHQ-209**;
  file-name-only edits in: their legacy `SKILL.md` command strings, their `program.name(…)`, the two
  root `package.json` `demo:plugin-direct:*` scripts, and two links in
  `docs/user-docs/workflow-descriptions/overview-of-workflows.md`.

- **math-workflow**: the identical SKILL.md; CLI renamed as above, logic unchanged; standard files.
- **string-reversal**: the identical SKILL.md; CLI renamed and moved onto
  `new DefaultWorkflowRuntime(process.argv)` / `runtime.getClaudeCodeTool()` /
  `program.parse(runtime.getWorkflowArgs())` (math's shape); standard files; its entry leaves
  `EXCLUDED_UNMIGRATED_SKILLS` (the other four stay for AHQ-209).
- **add-feature** (last): the identical SKILL.md; standard files; CLI unchanged.
- **Fixture** `tests/e2e/fixtures/string-reversal-copy-for-test/…/ts-workflow`: the identical SKILL.md
  + standard files (a committed lockfile is now fine —
  the depth-relative `link:` that forbade it is gone, so the exact-pin workaround and
  `REPO_ROOT_PLACEHOLDER` go); CLI renamed as above and moved onto `DefaultWorkflowRuntime`.

### 7. Release build `scripts/build-release.cjs` (doc 01 §3.8, §11(a))

1. Clean `release/` and `dist/` (clean Framework Build for belt-and-braces determinism).
2. Framework Build (1): `tsc -p tsconfig.build.json`.
3. Workflow Build (2) for each `skills/*/ts-workflow/` of every `SHIPPED_PLUGINS` entry not in
   `EXCLUDED_UNMIGRATED_SKILLS`: `node scripts/build-workflow.cjs --workflow-dir=<abs> --ahq-package-root=<repo>`.
4. Stage: `release/dist` ← `dist/` minus `.tsbuildinfo` only (maps ship); `release/bin/agentic-hq-prebuilt.cjs`;
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
- `docs/dev/how-agentic-hq-works.md`: **already updated by the Planner at the human's request** —
  architecture diagram, plugin-layout tree, a new *Builds: Framework Build (1) and Workflow Build (2)*
  section (both builds, the (1)/(2) dependency-order caveat, `build-mode`, the shared runner, framework
  resolution, the four combinations, the two binaries and `release/`), CLI-dispatch steps 1 and 5, and
  the worked example (runner command, `DefaultWorkflowRuntime`). The Implementer re-checks every claim
  in it against what was actually built (paths, option names, the `--help`/runner behaviour) and fixes
  any drift.
- `docs/dev/publish-checklist.md` §3: expected skills now include `agentic-hq-demos-plugin/string-reversal`;
  `exports` may carry `types` → `.d.ts`; file-list checks add `scripts/build-workflow.cjs`, a `.d.ts` and
  `.js.map` spot-check, "no `.tsbuildinfo`", and "no `ts-workflow/package.json|pnpm-lock.yaml|.npmrc|pnpm-workspace.yaml`
  in the tarball".
- `docs/dev/npm-commands.md`: add `build:framework`.
- `docs/glossary.md`: **already updated by the Planner at the human's request** (new *Builds & running*
  section + *Where things live* rows); the Implementer only re-checks it against what was built.

### Sequence (each slice RED → CODE → GREEN; baseline runs first)

0. Baseline: `pnpm validate`, `pnpm test:integration:bin-wrapper`, `pnpm test:integration:build-determinism`,
   the runner integration test — record current state before touching anything.
1. Framework Build (1) + dev wrapper + rename (§1, §2): RED = bin-wrapper test's new `dist/`
   assertions; GREEN = tests + `npm link` → `agentic-hq-dev list` from another directory + `pnpm validate`.
2. Workflow Build (2) + runner (§3, §4): RED = runner integration test (four options, build-first against
   the fake workflow); GREEN = it passes, run the runner by hand once.
3. Per-workflow mode (§5): RED = the unit tests; GREEN = `pnpm validate`.
4. Release build + math-workflow (§7, §6-math — incl. `git mv math-workflow-demo-cli.ts
   math-workflow-cli.ts` + its references): RED = build-determinism + cross-workspace math e2e;
   GREEN = both, plus `agentic-hq-dev math -- --input-number=11` from a temp workspace.
5. string-reversal (§6 — incl. `git mv string-reversal-demo-cli.ts string-reversal-cli.ts`,
   `EXCLUDED_UNMIGRATED_SKILLS`, demo scripts) **plus the rename-only pass over the two legacy CLIs**
   (`quick-jira-workflow-demo-cli.ts`, `full-jira-tdd-story-workflow-demo-cli.ts` → `<skill-id>-cli.ts`
   with their file-name-only reference edits): RED = tarball e2e + the two string-reversal e2es;
   GREEN = all three (quick-jira e2e stays red as before).
6. User-workspace fixture against the tarball (§6-fixture — incl. `git mv` of its CLI to
   `string-reversal-copy-for-test-cli.ts`, shared helper): RED = rewritten e2e; GREEN.
7. add-feature last (§6-add-feature), then the remaining e2e renames, CI, docs (§8); `--help` smoke via
   the runner; final `pnpm validate` + `pnpm test:integration` + the e2e set above (quick-jira stays red).

## Risks/Unknowns/Concerns

- **First-ever `.d.ts` emit** may surface TS4xxx "has or is using private name" errors in `src/`; fix by
  exporting the named type, never by widening to `any`.
- **The Workflow Build in the clone type-checks framework *source*** (the root `types` condition → `.ts`,
  Q6(c)): a few seconds per run and framework type errors surface inside a workflow build — by design
  (the framework is already strict-clean; against an npm install it reads the shipped `.d.ts`). This is
  already how today's `link:` set-ups type-check, so the mechanics are proven; only emit is new.
- **pnpm prunes the foreign `node_modules/agentic-hq` symlink** on install, so the Workflow Build must
  re-link after every install (step order is the guard). Existing `node_modules/` in
  add-feature/string-reversal from the old `link:` installs should be removed before the first new build.
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
  the no-clone case) — raised explicitly and **approved** with the plan (2026-08-19).
- `docs/glossary.md` and `docs/dev/how-agentic-hq-works.md` now describe the target state ahead of the
  code (by request); until slice 7 lands they lead the implementation rather than trailing it, and the
  Implementer must reconcile them with what was built rather than trust them blindly.

## Follow-up Ideas

- AHQ-209: remaining four workflows + scaffolder onto this template, `EXCLUDED_UNMIGRATED_SKILLS` gone,
  TEMPORARY half of the bin-wrapper test deleted, `demo:plugin-direct:quick|full-jira` fixed, `0.2.0`.
- AHQ-203: runner-registered resolve hook replacing self-reference for third-party plugin releases.
- Rename `prebuilt-tarball-install-runs-math-workflow.e2e.test.ts` (it now runs math + reversal) once its
  references (script name, publish checklist) can move together.
- AHQ-206 (`Workspace` vs `PluginSource` split) — `getBuildMode()` belongs on the discovery-root side of
  that split.
- AHQ-209: with `SKILL.md` now byte-identical and every CLI already named `<skill-id>-cli.ts`, the
  scaffolder copies `SKILL.md` verbatim and only has to name the CLI file by the convention.
- AHQ-199: the README/docs pass with the final names. (Also noticed, not build-related and left alone:
  the glossary's `DefaultClaudeCodeTool` entry still says workflow code uses it directly — since AHQ-197
  workflow programs go through `DefaultWorkflowRuntime`.)

## Human Approval Confirmation

**Approved by the human on 2026-08-19** ("Plan approved"), after an iterative review in the Planner
session. What was approved is this document as it stands, specifically including:

1. The implementation of the settled two-builds design on math-workflow, string-reversal and add-feature
   as laid out in §1–§8, test-first in the seven slices of the *Sequence* (RED → CODE → GREEN per slice,
   no REFACTOR stage), add-feature migrated last, **no publish**.
2. The Planner-level decisions (§0 and §6), all approved as written:
   - **pnpm** for the Workflow Build (2) install step (loud error if pnpm is not on PATH);
   - **`@types/node`** added to the standard `ts-workflow/package.json` devDependencies alongside
     `typescript`;
   - **source maps** emitted (`sourceMap` + `inlineSources`) and **shipped** in the release, enabled in
     both bin wrappers (`process.setSourceMapsEnabled(true)`) and in the runner (`--enable-source-maps`),
     `sourceMap: true` in the standard workflow tsconfig; **`.tsbuildinfo` is not shipped**;
   - the naming standard **Framework Build (1)** / **Workflow Build (2)** everywhere (glossary and
     how-agentic-hq-works already updated);
   - the **byte-identical `SKILL.md`**: `skill-id` derived from the final path segment of
     `skill-base-dir`, `workflow-program-name = {skill-id}-cli`, generic frontmatter `description`, no
     new chain variable;
   - the **program-name convention `<skill-id>-cli.ts`** with **all five** `-demo-cli` files renamed in
     this ticket (math-workflow, string-reversal, the e2e fixture, and rename-only for
     quick-jira-workflow and full-jira-tdd-story-workflow, whose migration stays in AHQ-209).
3. The documentation edits made by the Planner during the session at the human's explicit request —
   `docs/glossary.md` (*Builds & running* + *Where things live* rows), `docs/dev/how-agentic-hq-works.md`
   (the new *Builds* section and the corrected launch chain), and the dated update appended to
   Sub-Task B in `docs/tickets/AHQ-201/workflow-files/01-feature-brief.md` — with the understanding that
   these docs now lead the code and the Implementer reconciles them against what is actually built.

No conditions were attached beyond "update the doc to clarify the bits that are approved", which this
section and the approval markers in §0 and *Risks* satisfy. The Implementer (agent 03) may proceed.

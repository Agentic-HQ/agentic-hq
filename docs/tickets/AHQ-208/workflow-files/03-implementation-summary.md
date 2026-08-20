# AHQ-208 — Implementation Summary

## Summary Of Work Done

Implemented the settled two-builds design end-to-end, exactly per the approved plan's seven slices
(each RED → CODE → GREEN, no REFACTOR stage), with add-feature migrated last and **no publish**:

- **Framework Build (1)** — `tsconfig.build.json` now compiles `src/` only into `<repo>/dist`
  (JS + `.d.ts` + source maps with inlined sources, incremental, `.tsbuildinfo` inside `dist/`).
  The dev bin wrapper (`bin/agentic-hq.cjs`, renamed to **`agentic-hq-dev`** in root `bin`) owns it:
  incremental tsc, then the compiled `dist/src/cli/main.js` under plain node — no tsx. Both wrappers
  call `process.setSourceMapsEnabled(true)`. Root `exports` gained a `types` → `.ts`-source /
  `default` → compiled-JS pair; new `build:framework` script.
- **Workflow Build (2)** — new `scripts/build-workflow.cjs` (shipped): `pnpm install` (ENOENT
  re-thrown naming pnpm) → ensure `node_modules/agentic-hq → <ahq-package-root>` symlink (always
  after the install) → `tsc` into `<workflow-dir>/dist/`. Writes nothing outside the workflow dir.
- **Four-option runner** — `scripts/run-workflow.cjs` reworked: `--build-mode`,
  `--ahq-package-root`, `--workflow-dir`, `--workflow-js` (relative; absolute rejected), all
  required with loud errors; `build-first` runs the Workflow Build then executes, `prebuilt` just
  executes; programs run with `--enable-source-maps`. It never builds the framework and never
  touches `release/` (now publish-only).
- **Per-workflow `build-mode`** — `Workspace.getBuildMode()` / `AhqWorkflow.getBuildMode()`:
  user-workspace workflows are always `BUILD_FIRST`; AHQ-package workflows inherit the wrapper's
  mode from `AhqRuntimeParams` (now injected whole into `AhqPackageImpl` and
  `WorkflowSearchResultsImpl`). The registry action passes `workflow.getBuildMode()` into
  `WorkflowCommandBuilder.build(skillPath, buildMode, args)`; `ClaudeWorkflowCommandBuilder` mints a
  per-launch tool via the new `ToolFactory` / `DefaultClaudeCodeToolFactory`, whose runtime params
  carry that workflow's mode across the skill hop. `ClaudeCommandBuilder`, `DefaultClaudeCodeTool`,
  `DefaultWorkflowRuntime` and AHQ-205 first-wins registration are untouched.
- **Single byte-identical `SKILL.md`** — deployed verbatim to math-workflow, string-reversal,
  add-feature and the e2e fixture: `skill-id` derived from `skill-base-dir`'s final path segment,
  `workflow-program-name = {skill-id}-cli`, `$1`/`$2` relayed verbatim into the four-option runner
  command.
- **Standard `ts-workflow` file set** on all four: package.json (`commander` dep; `typescript` +
  `@types/node` devDeps; no `agentic-hq` dep, no tsx, no postinstall), emitting tsconfig, unchanged
  `.npmrc` (frozen), rewritten minimal `pnpm-workspace.yaml` (`packages: ['.']` +
  `minimumReleaseAge`, allowBuilds gone), `.gitignore`, regenerated committed lockfiles (the fixture
  now has one too — `REPO_ROOT_PLACEHOLDER` and the exact-pin workaround are gone).
- **Program-name convention `<skill-id>-cli.ts`** — all five `-demo-cli` files renamed via `git mv`
  (math-workflow, string-reversal, the fixture — plus rename-only for quick-jira-workflow and
  full-jira-tdd-story-workflow, whose migration stays in AHQ-209), with every live reference updated
  (demo scripts, tests, docs, the three create-workflow command files). string-reversal's CLI moved
  onto `DefaultWorkflowRuntime`; the fixture's too.
- **Release build** — `scripts/build-release.cjs`: clean `release/`+`dist/` → Framework Build (1) →
  Workflow Build (2) per shipped migrated workflow → stage (`release/dist` minus `.tsbuildinfo`,
  maps ship; prebuilt wrapper; both runner scripts; plugins with per-workflow install files stripped
  inside any `ts-workflow/`); generated manifest's `exports` now carries `types` → shipped `.d.ts`.
  string-reversal left `EXCLUDED_UNMIGRATED_SKILLS` and ships again.
- **Docs/CI (§8)** — CI smoke step → `agentic-hq-dev list`; README Quick-Start/clone-flow commands →
  `agentic-hq-dev` plus the one-line dev-vs-installed binary note; troubleshooting `npm link`
  headings; publish-checklist §3 extended (string-reversal in the expected skills, `types` → `.d.ts`
  allowed, `build-workflow.cjs`/`.d.ts`/`.js.map` spot-checks, no `.tsbuildinfo`, no per-workflow
  install files in the tarball); npm-commands gained a Builds section; `docs/glossary.md` and
  `docs/dev/how-agentic-hq-works.md` (pre-written by the Planner) re-checked claim-by-claim against
  what was built — no drift found, only the CLI file-name references needed the rename.

## Files Changed/Added/Deleted

**Added:** `scripts/build-workflow.cjs`; `src/interfaces/tool-factory.ts`;
`src/tools/marshalled-io-tools/claude-code/default-claude-code-tool-factory.ts`;
`tests/e2e/helpers/tarball-install-helper-functions.ts`;
`tests/unit/tools/claude-code/default-claude-code-tool-factory.unit.test.ts`; `.gitignore` +
(fixture only) `.npmrc` + `pnpm-lock.yaml` in the math/add-feature/fixture ts-workflow dirs.

**Renamed (`git mv`, content updated where migrated):** the five workflow CLIs —
`math-workflow-cli.ts`, `string-reversal-cli.ts` (rewritten onto `DefaultWorkflowRuntime`),
`string-reversal-copy-for-test-cli.ts` (fixture, rewritten), `quick-jira-workflow-cli.ts` and
`full-jira-tdd-story-workflow-cli.ts` (rename-only, still legacy for AHQ-209).

**Changed — build/run chain:** `tsconfig.build.json`, `package.json` (bin/exports/scripts),
`bin/agentic-hq.cjs`, `bin/agentic-hq-prebuilt.cjs`, `scripts/run-workflow.cjs`,
`scripts/build-release.cjs`.

**Changed — src (per-workflow mode):** `workspace.ts` + `ahq-workflow.ts` interfaces,
`workspace-impl.ts`, `ahq-package-impl.ts`, `current-user-workspace-impl.ts`, `plugin-impl.ts`,
`ahq-workflow-impl.ts`, `workflow-search-results-impl.ts`, `workflow-command-builder.ts`,
`workflow-registry-impl.ts`, `claude-workflow-command-builder.ts`, `composition-root.ts`,
`app.ts`.

**Changed — workflows:** `SKILL.md` + full standard `ts-workflow` file set for math-workflow,
string-reversal, add-feature and the e2e fixture; quick/full-jira `SKILL.md`s (file-name-only).

**Changed — tests:** the runner, bin-wrapper and build-determinism integration tests (rewritten to
the new contracts); the tarball, fixture, cross-workspace (math/list/string-reversal/quick-jira) and
agentic-hq-cli-string-reversal e2es; 18 unit test files (new mode tests + mechanical
`getBuildMode` stubs/constructor updates).

**Changed — test infra:** `vitest.integration.config.ts` gained `fileParallelism: false` — the
first full-suite `pnpm test:integration` run exposed a race: test FILES run in parallel by default,
and build-determinism, publish-guards and the (AHQ-208-extended) bin-wrapper test all mutate the
shared `dist/`/`release/` trees, so `build-release.cjs` died mid-stage when another file deleted
`dist/` under it (the pre-existing publish-guards/build-determinism contention the AHQ-201 brief
noted, widened by the bin-wrapper test's new delete-and-rebuild proof). Serializing integration
files makes the suite deterministic; each file passed standalone before and after.

**Changed — docs/CI:** `.github/workflows/ci.yml`, `README.md`, `docs/dev/how-agentic-hq-works.md`,
`docs/glossary.md`, `docs/dev/publish-checklist.md`, `docs/dev/npm-commands.md`,
`docs/user-docs/troubleshooting-quickstart.md`,
`docs/user-docs/workflow-descriptions/overview-of-workflows.md`, the three create-workflow command
files (file-name-only).

**Changed — add-feature workflow meta-work (outside the AHQ-208 plan, same commit; noted by the
Reviewer):** `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/03-implementer.md`
and `.../skills/add-feature/docs/workflow-help-docs/03-implementer-help-doc.md` — the Implementer
command now records human approval in the summary's `## Human Approval Confirmation` section (per
the commit message).

**Deleted:** the old `link:`-era lockfiles/`node_modules` in the three migrated bundled workflows
(lockfiles regenerated fresh); the fixture's `REPO_ROOT_PLACEHOLDER` mechanism.

## Tests Added/Updated And Test Results

Slice-by-slice, each RED verified failing for the expected reason before implementation:

- **Unit (`pnpm test`)** — 190 tests / 38 files **green** (was 178/37 at baseline; new:
  `default-claude-code-tool-factory.unit.test.ts` plus per-workflow-mode tests across the
  workspace/plugin/workflow/registry/builder/composition-root suites).
- **`pnpm validate`** — typecheck + lint + format + unit tests, all **green** (final run after all
  slices).
- **Runner integration** (`run-workflow-validates-and-executes`) — rewritten to the four-option
  contract incl. a real `build-first` Workflow Build against a fake ts-workflow: **6/6 green**.
- **Bin-wrapper integration** — dev wrapper now proves Framework Build (1) from a deleted `dist/`,
  compiled-CLI execution, and no `release/` creation: **2/2 green** (TEMPORARY second test untouched).
- **Build-determinism integration** — staged artefacts now: compiled CLI + `.js.map` + shipped
  `.d.ts`, all three workflows' `ts-workflow/dist/<cli>.js`, no `.tsbuildinfo`; two builds
  hash-identical: **green**.
- **Tarball e2e** (`prebuilt-tarball-install-runs-math-workflow`, name kept) — new artifact-shape
  assertions (nested `exports`, `scripts/` = runner + workflow-build, dist file kinds, stripped
  ts-workflow layout, self-reference walk per workflow), string-reversal in the shipped set +
  listing, **new one-Claude-step reversal run from the install**: **5/5 green** (real Claude runs);
  final all-three-workflows assertion re-run pending below.
- **Cross-workspace math e2e** — `agentic-hq-dev`, deletes `dist/` + math's `ts-workflow/dist` so a
  green run proves both builds from nothing: **green** (real 3-step Claude run, output number 5).
- **`agentic-hq-cli-string-reversal` e2e** — **green again** (the honest red marker since AHQ-197).
- **Cross-workspace string-reversal e2e** — `agentic-hq-dev`: **green** (real Claude run).
- **User-workspace fixture e2e** (the AC3 no-clone collaborator proof) — rewritten onto
  `buildPackAndInstallTarball` (new shared helper), runs the INSTALLED bin, asserts the reversed
  string, the in-workspace `dist/string-reversal-copy-for-test-cli.js`, the
  `node_modules/agentic-hq` symlink to the INSTALLED package root, and the installed tree unchanged:
  **2/2 green** (real Claude run).

**Manual validation (exact commands):**

- `npm link` from the repo, then `agentic-hq-dev list` from
  `/tmp/agentic-hq-test-workspaces/ahq-208-manual-check` — full listing rendered.
- One by-hand runner invocation against a scratch workflow in `temp/AHQ-208/…`:
  `node scripts/run-workflow.cjs --build-mode=build-first --ahq-package-root="$PWD" --workflow-dir=… --workflow-js=dist/manual-check-cli.js --hello=world`
  — installed, symlinked, compiled and echoed the forwarded args.
- add-feature `--help` smoke (AHQ-204 style, plain node, no Claude):
  `node scripts/run-workflow.cjs --build-mode=build-first --ahq-package-root=<repo> --workflow-dir=<repo>/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ts-workflow --workflow-js=dist/add-feature-cli.js --help`
  — printed usage. The full interactive proof is the next `agentic-hq-dev add-feature` run (AHQ-209),
  per plan.

**Final verification (slice 7), all green:**

- `pnpm validate` — green (typecheck, lint, format, 190 unit tests).
- `pnpm test:integration` (serialized) — 16/17 on the gating run; the one failure,
  `real-claude-self-termination-skill`, hit its 120 s timeout and passed on an immediate standalone
  re-run (a known-slow real-Claude test; it had passed in the earlier parallel run and no AHQ-208
  change touches its path) — recorded as a timing flake, not weakened or skipped.
- Tarball e2e re-run with add-feature shipped and built — 5/5 green (all three workflows'
  `ts-workflow/dist/<cli>.js` staged, self-reference walk clean for each).
- Cross-workspace `agentic-hq-dev list` e2e — green.
- Cross-workspace quick-jira e2e deliberately not executed: red by design until AHQ-209 (unmigrated
  workflow) and it creates real test Jiras.

## Approved Deviations From The Plan

None. One sequencing note within scope, recorded for transparency rather than as a deviation: the
plan's own slice gates (build-determinism at slice 4, the tarball e2e at slice 5) assert per-workflow
staged output that only exists once a workflow migrates, so the tests' workflow lists GREW per slice
(math → +string-reversal → +add-feature) and the release build carried a clearly-marked TEMPORARY
`WORKFLOW_BUILD_PENDING_SKILLS = ['…/add-feature']` scaffold between slices 4 and 7 — deleted in
slice 7 when add-feature migrated. Every final file matches the plan's specified end state exactly,
and the human-approved "add-feature's own files move last" ordering was preserved.

## Out Of Plan Follow-up Ideas/Concerns

- `tests/unit/workflow-runtime/default-workflow-runtime.unit.test.ts` uses the illustrative fake
  argv path `…/math-workflow-demo-cli.js`; it is pure fixture data (not a live reference) so it was
  left alone — AHQ-209/AHQ-199 could tidy it for consistency.
- Between AHQ-208 and AHQ-209, the shipped `agentic-hq list` shows the four still-excluded
  workflows' absence but the README's add-feature sections describe running from the clone via
  `agentic-hq-dev` — consistent, but the full README/docs naming pass remains AHQ-199 as planned.
- The stale global `agentic-hq` link from the pre-rename `npm link` still points at the clone (it
  runs the same dev wrapper file, so it behaves like `agentic-hq-dev`). Removing it
  (`npm uninstall -g agentic-hq`) is the human's call — it is what frees the name for a registry
  install (plan's risk note).
- The cross-workspace quick-jira e2e stays red by design (workflow unmigrated until AHQ-209); it was
  updated to `agentic-hq-dev` but deliberately not executed in this run — it creates real test Jiras.

## Human Approval Confirmation

Approved by the human at the Approval Gate on 2026-08-20. The gate discussion covered questions only
(the add-feature lockfile shrinkage, the new two-builds process, the prebuilt wrapper's debug/source-map
options, and the `passthroughArgs: string[]` parameter — left as-is by the human's decision); no code
changes were requested and no conditions were attached.

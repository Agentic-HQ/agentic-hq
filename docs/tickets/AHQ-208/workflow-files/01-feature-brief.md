# AHQ-208 — Feature Brief

## One Sentence Outcome

The agentic-hq framework build (Build 1) and the workflow build (Build 2) are split apart everywhere
— one shared `SKILL.md` template, a standard ts-workflow file set, a four-option runner, per-workflow
`build-mode`, and the dev binary renamed `agentic-hq-dev` — proven end-to-end on math-workflow,
string-reversal and add-feature (dev `build-first` and tarball install, including the user-workspace
fixture with no clone anywhere), with no publish.

## User Story

**As a**: developer running or authoring an AHQ workflow — bundled in the agentic-hq repo or in my own workspace  
**I want:** the framework and each workflow built by two separate, uniform builds behind one identical launch process  
**So that:** every workflow runs the same byte-identical compiled code wherever it lives, and my own workflows work against a pure npm install with no agentic-hq clone

## Human Prompt
This is a subtask of AHQ-201 (which is itself a subtask of AHQ-195) and is detailed in the parent ticket at:
docs/tickets/AHQ-201/workflow-files/01-feature-brief.md
and it's parent ticket AHQ-195 is documented in:
docs/tickets/AHQ-195/workflow-files/01-feature-brief.md
Please be sure to read the details of how this was split in that ticket and be especially careful to fully read and understand any relevant Addenda

## My Understanding of This Task

AHQ-208 is **Sub-Task A of the AHQ-201 split** (AHQ-201 being Sub-Task 7 of the AHQ-195 npm-publish
programme): the re-work of the build/runner system onto the **two-separate-builds design**, proven on
exactly three workflows — **math-workflow, string-reversal, add-feature** — before AHQ-209 migrates
the remaining four and the scaffolder. The design is fully specified and was **adopted by the human on
2026-08-18**: the architecture, the four runner variables, `build-mode` as the mode of *the workflow
being launched* (set from the discovery root), and the four implementation choices (self-reference for
prebuilt bundled workflows, dev wrapper runs the compiled CLI from `dist/`, `types` export condition →
`.ts` source, incremental tsc) were all decided via the parent brief's Questions 1–6. So this ticket
is **implementation of a settled design, not design work**: Build 1 (framework → `<repo>/dist`, JS +
`.d.ts`, owned by the dev wrapper and publish), Build 2 (`scripts/build-workflow.cjs`, identical for
every workflow wherever it lives), the reworked runner (never builds the framework, never executes
from `release/`), per-workflow `build-mode` in the CLI, the `agentic-hq-dev` rename, the release build
looping Build 2 over bundled workflows and stripping per-workflow install files, the three workflows
on the single `SKILL.md` template, the test suite moved onto the new pattern (including the
user-workspace fixture e2e run against a tarball install — the no-clone collaborator proof), and
minimal correctness-only doc edits. **No publish** — `0.2.0` ships in AHQ-209.

The authoritative inputs are the parent brief's `Split Suggestion (Accepted) → Sub-Task A` item list
and the three supporting docs
(`docs/tickets/AHQ-201/workflow-files/supporting-docs/01|02|03-*.md`) — doc 01 §3 (the design),
§9 (the only decisions left to the Planner: pnpm-vs-npm for Build 2's install, source maps), §10
(`agentic-hq-dev`), §11 (the decided trade-offs), and doc 03 §6 (the settled runner contract) + §2–§5
(the four worked combinations). `Research Findings` below verifies the current state of every seam
this ticket touches (as of 2026-08-19) rather than re-deriving the design.

## Research Findings

All research below is **verification of the current code state** against what the parent design docs
assume — the deep research and rationale live in the AHQ-201 brief and its supporting docs and are not
repeated here.

### 1. The authoritative scope list (parent brief, Sub-Task A)

The parent brief's `## Split Suggestion (Accepted)` → *Sub-Task A — AHQ-208* section is the item-level
scope: Build 1 (tsconfig/`exports`/gitignore), dev wrapper + `agentic-hq-dev` rename, Build 2 +
standard ts-workflow file set, the four-option runner, per-workflow `build-mode` in the CLI, the three
workflows onto the single template (string-reversal's CLI → `DefaultWorkflowRuntime`; string-reversal
*leaves* `EXCLUDED_UNMIGRATED_SKILLS`), the release build rework, the test list, minimal doc edits, no
publish, and the four decided Q6 choices. The settled runner contract and per-combination variable
values are in supporting doc 03 §6 and §2–§5.

### 2. Current state of the build/run chain (verified 2026-08-19)

- **Root `package.json`**: `bin` = `{ "agentic-hq": "bin/agentic-hq.cjs" }` (the rename target);
  `exports` → `./src/tools/marshalled-io-tools/claude-code/index.ts` (`.ts` source — becomes
  `./dist/…js` + `types` condition); `version` 0.1.1, `private: true`, root `prepack` guard blocks
  packing the root (stays); `engines.pnpm >= 11`, `packageManager` pnpm@11.1.2.
- **`tsconfig.build.json`**: `outDir: release/dist`, `rootDir: "."`, per-workflow `include` entries
  (math-workflow, add-feature) and the typecheck-only `paths` mapping — all three things Build 1
  removes. No `declaration` option today (no `.d.ts` anywhere). Root `tsconfig.json` is
  noEmit and includes only `src/**` + `tests/**`.
- **`scripts/run-workflow.cjs`**: three required options (`--build-mode`, `--ahq-package-root`,
  `--workflow-js` relative to the *execution root*); `build-first` runs `build-release.cjs` and
  executes from `<root>/release`; `prebuilt` executes from `<root>`. Becomes the four-option contract
  (doc 03 §6): `--workflow-dir` added, `--workflow-js` becomes relative to it, Build 2 replaces the
  release build, no `release/` execution.
- **`scripts/build-release.cjs`**: single tsc into `release/dist` + staging; `SHIPPED_PLUGINS` (3),
  `EXCLUDED_UNMIGRATED_SKILLS` (5 — string-reversal's entry is deleted here; the other 4 stay for
  AHQ-209); generated manifest (`bin` → prebuilt wrapper, `exports` → `dist/…js`,
  `publishConfig.executableFiles` from staged `.sh` files, pnpm-only prepack guard). Gains: Build 1 +
  Build 2 loop + per-workflow install-file stripping (`package.json`, lockfile, `.npmrc`,
  `pnpm-workspace.yaml` — the self-reference watch-item in doc 01 §11(a)); its `rm -rf dist` clean
  step now targets Build 1's real output rather than a stale leftover.
- **`scripts/build-workflow.cjs` does not exist yet.**
- **`bin/agentic-hq.cjs`** (dev): runs tsx on `src/cli/main.ts`, injects
  `--build-mode=build-first --ahq-package-root=<repo>`. Gains Build 1, runs compiled
  `dist/src/cli/main.js` (Q6b), renamed to `agentic-hq-dev` in root `bin`.
  **`bin/agentic-hq-prebuilt.cjs`**: already argv-splices the params and imports
  `dist/src/cli/main.js` — near-unchanged; the two wrappers converge (doc 01 §11(b)).
- **`.gitignore`**: a bare `dist` entry already ignores `dist/` at any level (repo root *and*
  ts-workflow dirs), and `*.tsbuildinfo` (incremental tsc) and `/release/` are already ignored — the
  "gitignored" AC items are mostly already satisfied; verify rather than re-add.

### 3. The per-workflow build-mode seam

`claude-command-builder.ts:93` is the **only live consumer** of `AhqRuntimeParams.getBuildMode()` in
`src/` — it appends `<marshallingId> <buildMode> <ahqPackageRoot>` to every AI tool command. Today
that is the *global* (wrapper) mode. The new rule — workspace-discovered workflows are `build-first`,
AHQ-package workflows inherit the wrapper's mode (doc 01 §3.6) — needs "which root was this workflow
discovered under" available at the *skill-launch* hop. Registration currently discards it: the chain
is `Workspace.registerWorkflowsWith(registry)` → `Plugin.registerWorkflowsWith(registry)`, and neither
the plugin nor the registered workflow carries its source workspace. The natural seams are
`src/workflow-discovery/interfaces/workspace.ts` (+ `AhqPackageImpl` / `CurrentUserWorkspaceImpl` —
e.g. a `getBuildMode()` the design sketches) and whatever threads it to the builder; the *command*
hop needs no change — inside the workflow program the same builder runs with the runner-forwarded
mode from `DefaultWorkflowRuntime(process.argv)`, so it relays the workflow's own mode automatically.
AHQ-205's first-wins registration and the builder's local-plugins-first `--plugin-dir` ordering are
adjacent behaviour to preserve (its unit tests will say if broken).

### 4. Current state of the three workflows

- **math-workflow / add-feature** (migrated, AHQ-197/204 pattern): `SKILL.md` relays `$1`/`$2` into
  the runner with a package-relative
  `--workflow-js=dist/.agentic-hq/plugins/…/ts-workflow/src/<cli>.js`; CLI uses
  `DefaultWorkflowRuntime`. Template change per doc 01 §3.4: `--workflow-dir="{skill-base-dir}/ts-workflow"`
  + `--workflow-js=dist/<cli>.js`. Their ts-workflow `package.json`s still carry `link:` + tsx —
  replaced by the standard file set (deps `commander`, devDep `typescript`, no `agentic-hq` dep;
  emitting `tsconfig.json`).
- **string-reversal** (fully legacy): `SKILL.md` still returns the
  `pnpm install && ln -sfn "$AGENTIC_HQ_WORKSPACE_ROOT" … && tsx` chain (broken twice over: the env
  var no longer exists, and the CLI is the no-arg `new DefaultClaudeCodeTool()` which hasn't compiled
  since AHQ-197); `package.json` has `"agentic-hq": "link:../../../../../.."` + tsx + a node-pty
  postinstall. Migration = new SKILL.md from the template, CLI onto
  `DefaultWorkflowRuntime`/`runtime.getWorkflowArgs()`, standard file set. Its
  `EXCLUDED_UNMIGRATED_SKILLS` entry is deleted (it ships again); the tarball e2e's
  `EXPECTED_SHIPPED_SKILLS_BY_PLUGIN` and exclusion assertions flip in lockstep.

### 5. Tests touched (inventory verified in the AHQ-201 stage; spot-checked today)

- `tests/integration/build/build-determinism.integration.test.ts` — asserts staged `*-cli.js`; extends
  to per-workflow `dist/` + `.d.ts` presence. `publish-guards.integration.test.ts` — its known
  `release/` contention with build-determinism is defused by `release/` becoming publish-only.
- `tests/integration/runner/run-workflow-validates-and-executes.integration.test.ts` — the runner
  contract test; gains `--workflow-dir` and the Build 2 path.
- `tests/integration/bin/bin-wrapper-supplies-the-package-root-explicitly.integration.test.ts` — dev
  wrapper coverage; becomes `agentic-hq-dev` + Build 1. Its `TEMPORARY` second half is deleted in
  **AHQ-209** (grep-clean AC), not here.
- `tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts` — shipped-set map +
  stripped-layout assertions (doc 01 §11(a) watch-item: no `package.json` between a shipped `dist/`
  and the package root); extends to string-reversal end-to-end.
- `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts` (the honest red marker of the AHQ-197
  break), `cross-workspace-string-reversal`, `cross-workspace-demo-math-workflow-…`,
  `cross-workspace-quick-jira-workflow-…` (stays red-flagged for AHQ-209 — its workflow isn't
  migrated here), `cross-workspace-list-workflows` — green on the new pattern.
- `tests/e2e/demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts` +
  `tests/e2e/fixtures/string-reversal-copy-for-test/` — the user-workspace fixture (today:
  `REPO_ROOT_PLACEHOLDER` `link:` + tsx + no-arg CLI): repointed to the new pattern and **run against
  a tarball-installed agentic-hq** (the collaborator half of the acceptance scenario, per parent
  Q3); its `npm link` PATH precondition becomes `agentic-hq-dev`.
- Unit tests for the per-workflow mode rule (new), plus existing workspace/builder unit suites.

### 6. Operational notes for the Planner/Implementer

- **This very AHQ-208 run executes add-feature out of `release/`** (build-first runs stage and run
  from there today). Rebuilds during the run wipe and restage `release/`; the running compiled
  workflow program is already loaded in memory, but sequencing add-feature's own migration late and
  verifying with a fresh run is the safe shape (AHQ-204 precedent). Under the new design this footgun
  disappears (`release/` publish-only).
- `demo:agentic-hq-cli:string-reversal` uses `node bin/agentic-hq.cjs` directly (survives the rename);
  `demo:plugin-direct:string-reversal|math-workflow` embed the legacy tsx chain — correctness edits
  here are in scope, the quick/full-jira ones are AHQ-209's.
- Root `pnpm typecheck` never covered plugin ts-workflow sources (root include is `src/**`+`tests/**`)
  — under the new design each workflow's Build 2 tsc is its typecheck, everywhere.
- Only two decisions were left open for the Planner (doc 01 §9): **pnpm vs npm for Build 2's install
  step** (repo standard is pnpm + frozen lockfile, AHQ-152) and **source maps +
  `--enable-source-maps` in the dev wrapper** (natural companion to Q6(b)). Everything else is
  decided — do not reopen.

## Web/Perplexity Research

No external research was required: the design, its rationale, and the Node behaviours it relies on
(package self-reference via `exports`, real-path resolution of symlinked modules, incremental tsc)
were established and recorded during the AHQ-201 Researcher stage (supporting docs 01–03); this stage
only verified the current code state locally.

## Relevant Files Reviewed

Ordered by decreasing relevance (pointers for the Planner):

- `docs/tickets/AHQ-201/workflow-files/01-feature-brief.md` — the parent brief: the accepted split,
  Sub-Task A's item list, Questions 1–6 (all answered Yes).
- `docs/tickets/AHQ-201/workflow-files/supporting-docs/01-new-two-separate-builds-architecture-design.md`
  — the adopted design (§3 plan, §9 Planner-only leftovers, §10 `agentic-hq-dev`, §11 decided trade-offs).
- `docs/tickets/AHQ-201/workflow-files/supporting-docs/03-the-four-combinations-of-example-runs-types-all-explained-and-worked-through.md`
  — the settled runner contract (§6) and all four combinations hop-by-hop (§2–§5, §7 variants, §8 why
  all four variables stay).
- `docs/tickets/AHQ-201/workflow-files/supporting-docs/02-four-questions-and-answers-about-new-build-architecture.md`
  — the human's four architecture questions and answers (effort honesty, AHQ-203 relation).
- `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md` — the grandparent: Sub-Task 7 instructions
  (incl. the `agentic-hq-dev` scope line and the acceptance scenario) and the split pointer to AHQ-208/209.
- `scripts/build-release.cjs`, `tsconfig.build.json`, `scripts/run-workflow.cjs` — the single-build
  chain this ticket replaces with Build 1 / Build 2 / the four-option runner.
- `bin/agentic-hq.cjs`, `bin/agentic-hq-prebuilt.cjs` — the two wrappers; the dev one gains Build 1,
  the compiled CLI, and the `agentic-hq-dev` name.
- `package.json` (root) — `bin`, `exports` (→ `.ts` today), demo scripts, engines/packageManager.
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts:93` — the sole live
  `getBuildMode()` consumer; where the per-workflow mode lands.
- `src/workflow-discovery/workspace/{workspace-impl,ahq-package-impl,current-user-workspace-impl}.ts`
  + `interfaces/workspace.ts` — the two roots and the registration chain the discovery-root rule
  threads through.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/{math-workflow,add-feature}/SKILL.md` — the
  current migrated template; `skills/string-reversal/{SKILL.md,ts-workflow/**}` — the legacy shape
  being migrated.
- `.gitignore` — `dist`, `*.tsbuildinfo`, `/release/` already ignored.
- The test files listed in Research Findings §5.

## Acceptance Criteria

- The framework and workflow builds are separate everywhere: `agentic-hq-dev` (renamed) builds the
  framework to `<repo>/dist` (JS + `.d.ts`) and runs the compiled CLI; the runner runs Build 2 for
  `build-first` and never builds the framework or executes from `release/` (publish-only).
- math-workflow, string-reversal and add-feature run on the single `SKILL.md` template + standard
  ts-workflow file set via the four-option runner — in dev `build-first` and from a tarball install
  (string-reversal ships and its e2es are green again).
- A user-workspace workflow builds and runs identically with no clone anywhere — the fixture e2e,
  repointed to the new pattern, passes against a tarball-installed agentic-hq.
- `build-mode` is the mode of the workflow being launched (workspace → `build-first`; AHQ package →
  the wrapper's mode), unit-tested, with the chain variables unchanged.
- Build-determinism, runner, tarball, cross-workspace and bin-wrapper suites are green on the new
  pattern; minimal correctness-only doc edits done; no publish.

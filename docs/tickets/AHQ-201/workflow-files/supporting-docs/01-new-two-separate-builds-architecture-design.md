# AHQ-201 — Two Separate Builds: Architecture Design

> **Status:** design written 2026-08-17 during the Researcher stage of the AHQ-201 `add-feature` run,
> after a design conversation with the human; **adopted by the human on 2026-08-18** (feature brief
> Question 1 = Yes; the four implementation choices in §11 decided via Question 6; the runner's four
> variables settled in doc 03 §6/§8; `agentic-hq-dev` in scope per §10). Companions:
> `02-four-questions-and-answers-about-new-build-architecture.md` (the human's four questions about
> this design and the answers given) and
> `03-the-four-combinations-of-example-runs-types-all-explained-and-worked-through.md`.
>
> **Parent context:** [AHQ-195](https://agentic-hq.atlassian.net/browse/AHQ-195) Sub-Task 7 —
> `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md`, "Open Sub-Task Instructions → Sub-Task 7",
> whose first item asks this Sub-Task to answer deliberately *how user-created workflows work against a
> pure npm install, with no agentic-hq clone anywhere*.

## 1. Why this document exists

The prebuilt/read-only-artifact pattern proven in AHQ-196/197/198/202 builds the agentic-hq framework
**and** its bundled workflows in **one** build, into **one** tree, and the shared runner can only execute
workflow JS that lives inside that tree. That works for the workflows shipped inside the agentic-hq
package, but it cannot serve a workflow a user has scaffolded into their own workspace: the installed
package is read-only, and the user's workflow is not part of it.

The human's requirement (stated during this Researcher stage) is that a custom workflow in a user's
workspace should follow **exactly the same process** as a bundled workflow in the agentic-hq clone —
**dev = build + run, prod = run, always on byte-identical code** — with the workflow's files (including
`SKILL.md`) **identical** wherever the workflow lives, and **no new chain variables**. The human's key
insight: **split the build of the agentic-hq framework from the build of the workflow TypeScript,
everywhere** — then it makes no difference whether a workflow lives in the agentic-hq workspace or in
`my-workspace`. This document records the current setup, the proposed design, and its consequences.

## 2. The current setup (as of AHQ-200 + AHQ-205, 2026-08-17)

### 2.1 Two entry points; `build-mode` is "which wrapper you invoked"

| You run… | Wrapper | Inserts | Runs |
| --- | --- | --- | --- |
| `agentic-hq …` from the cloned repo (`npm link`) | `bin/agentic-hq.cjs` (dev) | `--build-mode=build-first --ahq-package-root=<repo>` | the TS CLI via **tsx** (`src/cli/main.ts`) |
| `agentic-hq …` from an npm install | `bin/agentic-hq-prebuilt.cjs` (shipped) | `--build-mode=prebuilt --ahq-package-root=<installed pkg dir>` | the compiled CLI (`dist/src/cli/main.js`) |

Both values flow explicitly (never env vars): wrapper → CLI (`DefaultAhqCommandLine`) → every Claude
invocation as positional args after the command (`<io-dir> <build-mode> <ahq-package-root>`,
`claude-command-builder.ts:93`) → the skill relays them verbatim as `$1`/`$2` → the runner → the workflow
program's `DefaultWorkflowRuntime`. Nothing in `src/` acts on `build-mode` except that relay; the
runner is the sole consumer.

### 2.2 One build: `scripts/build-release.cjs` (+ `tsconfig.build.json`)

`pnpm build` wipes `release/` and stages exactly what ships:

- `tsc -p tsconfig.build.json` compiles **the framework `src/` and the bundled migrated workflows'
  `ts-workflow/src`** (each listed explicitly in `include`) into `release/dist/…`, mirroring the repo
  layout (`rootDir: "."`), so compiled workflow JS lands at
  `release/dist/.agentic-hq/plugins/<plugin>/skills/<wf>/ts-workflow/src/<cli>.js`. A typecheck-only
  `paths` mapping resolves the workflow's `agentic-hq/tools/claude-code` import during compilation.
- Copies in the prebuilt bin wrapper, `scripts/run-workflow.cjs`, the shipped plugins verbatim (minus
  `node_modules`, minus the `EXCLUDED_UNMIGRATED_SKILLS`), README/LICENSE, and generates
  `release/package.json` (bin → prebuilt wrapper, `exports` → `dist/src/tools/…/index.js`, runtime deps,
  `publishConfig.executableFiles`).
- No `.d.ts` files are emitted or shipped.

### 2.3 How a shipped workflow is launched

`SKILL.md` (math-workflow, add-feature) returns:

```
node "{ahq-package-root}/scripts/run-workflow.cjs" --ahq-package-root="{ahq-package-root}" \
     --build-mode={build-mode} --workflow-js=dist/.agentic-hq/plugins/…/ts-workflow/src/<cli>.js
```

`run-workflow.cjs`: `build-first` → run `build-release.cjs`, then execute
`<ahq-package-root>/release/<workflow-js>`; `prebuilt` → execute `<ahq-package-root>/<workflow-js>`.
So in dev, **the runner rebuilds the whole package on every workflow launch and executes out of
`release/`**; `--workflow-js` is always relative to that execution root, i.e. the runner can only run
JS inside the agentic-hq package tree.

### 2.4 How compiled workflow JS finds the framework today

Node **package self-reference**: the compiled workflow JS sits under `<root>/dist/…` with no
intervening `package.json`, so its nearest ancestor manifest is agentic-hq's own, and
`import 'agentic-hq/tools/claude-code'` resolves through that manifest's `exports` (AHQ-196's finding).
`commander` resolves by the normal upward walk to `<root>/node_modules`.

### 2.5 User-workspace workflows today (legacy, and broken)

The only user-workspace model is the e2e fixture `tests/e2e/fixtures/string-reversal-copy-for-test/`
and what `create-workflow` scaffolds: `SKILL.md` returns
`(cd {skill-base-dir}/ts-workflow && pnpm install && ln -sfn "$AGENTIC_HQ_WORKSPACE_ROOT" node_modules/agentic-hq) && …/tsx … src/<cli>.ts`;
`package.json` has `"agentic-hq": "link:../../../../../.."` (six levels up — the repo root in the AHQ
clone, the *user's project root* in a user workspace, harmless only because `ln -sfn` overwrote it);
the CLI is the no-arg `new DefaultClaudeCodeTool()`. It presumes an agentic-hq clone (via an env var
that no longer exists since AHQ-200), pnpm and tsx, and it does not typecheck.

### 2.6 Why extending the current pattern as-is was rejected

Two designs were considered and rejected during this Researcher stage:

- **Keep tsx for user-workspace workflows, feed the symlink from `$2`.** Smallest change, but it
  creates two run models (runner + compiled JS vs symlink + tsx), two `SKILL.md` shapes the scaffolder
  must transform between, no typechecking, no publishable artifact — and it would be redone under a
  future workflow-publishing model.
- **Runner builds user workflows, but the user's `SKILL.md` hardcodes `--build-mode=build-first`.**
  Rejected by the human: it doesn't mirror the agentic-hq skills (which relay `$1`), and publishing a
  plugin release (which must say `prebuilt`) gets messy.

## 3. The new plan: two separate builds

### 3.1 Principles (the human's, binding)

1. Dev = **build + run**; prod = **run**; the run is always on the byte-identical code that ships.
2. A workflow's files — including `SKILL.md` — are **identical** whether it lives in the agentic-hq
   workspace or in `my-workspace`.
3. **No new chain variables** and no env vars; explicit parameters everywhere; the AI relays, never
   interprets.
4. Split the framework build from the workflow build **everywhere**, including inside the agentic-hq
   workspace.

### 3.2 Build 1 — the Framework build

- **What:** compile agentic-hq `src/` → `dist/` (JS **and `.d.ts`**). The framework's `package.json`
  `exports` maps `agentic-hq/tools/claude-code` → `./dist/src/tools/marshalled-io-tools/claude-code/index.js`
  in **both** the repo and the installed package (the release manifest is generated from the root one).
  In the repo, a `types` export condition points at the `.ts` source so contributors' IDEs stay live
  without a build (decided — brief Q6(c)).
- **Owner:** the *framework's* entry point. The **dev wrapper** runs it on every dev invocation (that is
  what "clone = build-first" means for the framework); the **publish build** runs it for release. **The
  runner never builds the framework.** On a user's machine the framework is never built — it arrives
  prebuilt in the installed package's `dist/`.
- **From → to (dev):** `<repo>/src/**/*.ts` → `<repo>/dist/src/**/*.js` + `*.d.ts`. Incremental `tsc`
  keeps the per-invocation cost ~1 s; the output is identical to a clean build.

### 3.3 Build 2 — the Workflow build

- **What:** one small shared script, `scripts/build-workflow.cjs <workflow-dir> <ahq-package-root>`:
  1. `pnpm install` in `<workflow-dir>` (devDependencies: `typescript`; dependency: `commander`) — a
     no-op after the first run;
  2. ensure `<workflow-dir>/node_modules/agentic-hq → <ahq-package-root>` (a symlink made from the
     explicit parameter — never an env var, never a depth-relative `link:`);
  3. `tsc -p <workflow-dir>/tsconfig.json` → `<workflow-dir>/dist/<cli>.js`, typechecked against the
     framework's `.d.ts` through that symlink. A type error stops here, loudly.
- **Identical for every workflow, wherever it lives** — bundled in the agentic-hq repo or in a user's
  workspace. Used by the runner in `build-first`, and looped over the bundled workflows by the release
  build. Byte-identical by construction: same script, same compiler, same config, same source.
- **From → to:** `<its own>/ts-workflow/src/<cli>.ts` → `<its own>/ts-workflow/dist/<cli>.js`
  (`dist/` and `node_modules/` are generated and gitignored, in the AHQ repo too).
- Everything Build 2 writes lands inside the workflow's own `ts-workflow/` directory. Nothing is ever
  written into the agentic-hq package.

### 3.4 One workflow layout, one `SKILL.md`

The agentic-hq repo's bundled workflows and a user's workflows become literally the same files (only
the package `name` and the CLI filename differ):

```
skills/<wf>/
  SKILL.md, ahq-workflow.json
  ts-workflow/
    package.json          deps: commander; devDeps: typescript — NO agentic-hq dependency, no link:
    tsconfig.json         emits src → dist  (today's noEmit config becomes an emitting one)
    .npmrc, pnpm-workspace.yaml, pnpm-lock.yaml
    src/<wf>-cli.ts       identical program shape: new DefaultWorkflowRuntime(process.argv) …
    dist/, node_modules/  generated, gitignored
```

The single `SKILL.md` template, relaying `$1`/`$2` exactly as today:

```
node "{ahq-package-root}/scripts/run-workflow.cjs" --ahq-package-root="{ahq-package-root}" \
     --build-mode={build-mode} --workflow-dir="{skill-base-dir}/ts-workflow" --workflow-js=dist/<wf>-cli.js
```

No literal mode anywhere. The only textual change from today's shipped `SKILL.md` is `--workflow-dir`
(from `skill-base-dir`, which every skill is already given) replacing the package-relative
`--workflow-js=dist/.agentic-hq/plugins/…`. `--workflow-dir` is a runner-local option, not a new chain
variable. (Alternative: an absolute `--workflow-js` with the runner deriving the dir — less explicit;
Planner's call.)

### 3.5 The runner

`run-workflow.cjs --build-mode=<$1> --ahq-package-root=<$2> --workflow-dir=<abs> --workflow-js=<rel to workflow-dir> [args…]`:

- `build-first` → run Build 2 on `--workflow-dir`, then run;
- `prebuilt` → run;
- run = `node <workflow-dir>/<workflow-js> --build-mode=<…> --ahq-package-root=<…> [args…]`.

The runner never builds the framework and never executes out of `release/`. It remains the only code
that acts on `build-mode`.

### 3.6 `build-mode` = the mode of *the workflow being launched*

Today `$1` is "the framework's mode". For bundled workflows that coincides with the workflow's mode,
which is why it never mattered. It stops coinciding in exactly the acceptance scenario: an npm-installed
agentic-hq (`prebuilt`) launching a workflow that is *source* in `my-workspace`. Something must say
"build this workflow", without a literal in `SKILL.md` and without a new variable.

**Rule:** the CLI passes each skill the mode of the workflow it is launching, derived from **which root
it discovered it under** — the same structural principle as the wrappers ("where it lives *is* its
mode"):

| Discovered under | Mode passed as `$1` |
| --- | --- |
| the agentic-hq package root | the wrapper's mode (`build-first` in the clone, `prebuilt` in the npm install) |
| the user's workspace | `build-first` — a workspace holds source; there is nothing prebuilt in a workspace |
| (future) an installed-plugins root | `prebuilt` |

One visible rule in TypeScript (e.g. `Workspace.getBuildMode()` on `AhqPackageImpl` /
`CurrentUserWorkspaceImpl`); the AI relays it verbatim exactly as now; no variable is added; the runner
obeys it. A future plugin release is not messy: the author's `SKILL.md` is untouched (it still relays
`$1`), and whoever installs the release gets `prebuilt` from their CLI. (Alternative considered: the
runner infers "outside the package ⇒ source" by path containment — rejected: it makes the runner
second-guess `--build-mode` and adds a path heuristic; the CLI already knows the root.)

### 3.7 How workflow JS finds the framework under the new design

The compiled workflow JS says `import … from 'agentic-hq/tools/claude-code'`. Three situations:

1. **`build-first`, anywhere** (bundled in the clone, or a user workspace with either kind of install):
   Build 2 has just created `ts-workflow/node_modules/agentic-hq → <ahq-package-root>`. Resolves to
   `<root>/dist/…js`; tsc/IDE get the `.d.ts`. This is what the depth-relative `link:` did today by
   accident; making it explicit from `$2` is the same move AHQ-200 made for the env var.
2. **`prebuilt`, bundled in the npm install** — read-only, no `node_modules` inside plugins. **Node
   package self-reference** (already how AHQ-196 made prebuilt work) resolves it, provided the release
   **does not ship the per-workflow install files** (`package.json`, `pnpm-lock.yaml`, `.npmrc`,
   `pnpm-workspace.yaml` — install-time files are meaningless in a prebuilt release; `src/`, `dist/`,
   `SKILL.md`, commands and docs still ship). With them absent, the nearest ancestor manifest above
   `…/ts-workflow/dist/<cli>.js` is agentic-hq's own; the workflow JS is ESM via that manifest's
   `"type": "module"`; `commander` resolves from `<root>/node_modules` by the upward walk. Consequence:
   `--using` copies from a registry install regenerate the install files from the scaffolder's template
   — which is arguably right regardless, since those files are identical for every workflow.
3. **`prebuilt`, a user's future plugin release** — see §7: resolved the standard npm way (a declared
   peer dependency), or by the runner telling Node where the framework is. Not in scope.

A uniform-now alternative — the runner registers a small Node resolve hook (`module.register` via
`--import`) mapping `agentic-hq/*` to `--ahq-package-root` for every run — would cover 1–3 with one
mechanism, but it is one more moving part; recommended to leave for AHQ-203. Both options keep the
`SKILL.md` and layout identical.

### 3.8 The release build and publishing

`pnpm build` (`build-release.cjs`) becomes: Build 1 (framework `dist/` + `.d.ts`) → Build 2 for each
bundled workflow → stage `release/` = generated manifest, prebuilt bin wrapper, `scripts/run-workflow.cjs`
+ `scripts/build-workflow.cjs`, framework `dist/`, the shipped plugins with each `ts-workflow/dist/`
included and their install files and `node_modules` excluded, README/LICENSE. `cd release && pnpm pack`
→ `npm publish` (real Terminal, per `docs/dev/publish-checklist.md`). `release/` is publish-only; dev
runs never touch it. `EXCLUDED_UNMIGRATED_SKILLS`, the per-workflow `include` list and the `paths`
mapping in `tsconfig.build.json` all disappear.

A user publishing their own plugin later runs the same recipe (Build 2 per workflow, ship the tree) —
by hand at first, or via a future `agentic-hq build-plugin`-style command.

### 3.9 The dev wrapper

`bin/agentic-hq.cjs` runs Build 1, then the CLI, with `--build-mode=build-first --ahq-package-root=<repo>`
(unchanged root: discovery of all repo plugins incl. dev-only ones, the `.agentic-hq` read grant, and the
`ahq-package-root=` relay into command inputs all keep working). It runs the compiled
`<repo>/dist/src/cli/main.js` rather than tsx (decided — brief Q6(b)), so even the CLI is byte-identical
to production and tsx leaves the runtime path entirely; Build 1 is incremental tsc (decided — Q6(d)).

## 4. End-to-end walkthroughs

### 4.1 `my-custom-workflow` in `my-workspace`, **npm-installed** agentic-hq

```
<AHQ> = ~/.nvm/versions/node/v24.15.0/lib/node_modules/agentic-hq/      (read-only release tree)
  package.json                       exports: agentic-hq/tools/claude-code → ./dist/src/tools/…/index.js
  bin/agentic-hq-prebuilt.cjs
  scripts/run-workflow.cjs, scripts/build-workflow.cjs
  dist/src/**/*.js + *.d.ts          ← FRAMEWORK: built from src/ in the maintainer's clone at PUBLISH
                                         time → <clone>/dist → release/dist → tarball → here.
                                         NEVER built on the user's machine.
  .agentic-hq/plugins/…/skills/math-workflow/ts-workflow/{src/, dist/}   ← bundled workflows, prebuilt
  node_modules/{commander, fast-glob, node-pty}

~/dev/my-workspace/                                                       (the user's git repo)
  .agentic-hq/plugins/my-plugin/
    commands/my-custom-workflow/01-….md …
    skills/my-custom-workflow/
      SKILL.md, ahq-workflow.json
      ts-workflow/
        package.json, tsconfig.json, .npmrc, pnpm-workspace.yaml, pnpm-lock.yaml
        src/my-custom-workflow-cli.ts        ← WORKFLOW: built FROM here…
        dist/my-custom-workflow-cli.js       ← …TO here (same ts-workflow dir; gitignored)
        node_modules/{typescript, commander, agentic-hq → <AHQ>}   (generated; gitignored)
```

`cd ~/dev/my-workspace && agentic-hq my-custom-workflow -- --ticket-id=X`:

1. Shell → `<AHQ>/bin/agentic-hq-prebuilt.cjs` → inserts `--build-mode=prebuilt --ahq-package-root=<AHQ>`
   → runs `<AHQ>/dist/src/cli/main.js`. (Framework: nothing to build.)
2. CLI discovers workflows under `<AHQ>/.agentic-hq/plugins` and `~/dev/my-workspace/.agentic-hq/plugins`;
   finds `my-custom-workflow` under the workspace → its mode is `build-first`.
3. CLI starts a Claude session and runs the workflow's `SKILL.md` with `$0`=io-dir, `$1`=`build-first`,
   `$2`=`<AHQ>`.
4. `SKILL.md` writes the launch command (template, no decisions):
   `node "<AHQ>/scripts/run-workflow.cjs" --ahq-package-root="<AHQ>" --build-mode=build-first --workflow-dir="…/my-custom-workflow/ts-workflow" --workflow-js=dist/my-custom-workflow-cli.js`
5. CLI executes it (+ `'--ticket-id=X'`), cwd `~/dev/my-workspace`.
6. Runner, `build-first` → Build 2 on `--workflow-dir`: `pnpm install` → symlink `node_modules/agentic-hq → <AHQ>`
   → `tsc` compiles `src/my-custom-workflow-cli.ts` → `dist/my-custom-workflow-cli.js`, typechecked
   against `<AHQ>/dist/**/*.d.ts`. All writes stay inside the user's `ts-workflow/`.
7. Runner runs `node …/ts-workflow/dist/my-custom-workflow-cli.js --build-mode=build-first --ahq-package-root=<AHQ> --ticket-id=X`.
   The framework import resolves through the symlink to `<AHQ>/dist/…`; the framework's own deps load
   from `<AHQ>/node_modules`. The program calls `tool.execute('/my-plugin:my-custom-workflow:01-…')` per
   command → Claude sessions → done.
8. Next run: install no-op, symlink idempotent, tsc ~1–2 s — always fresh compiled code from current
   source. That is "dev = build + run".

A collaborator who clones `my-workspace` and has their own `<AHQ'>`: identical, with step 6's symlink
pointing at `<AHQ'>`. No agentic-hq clone anywhere.

### 4.2 Same workflow, agentic-hq running from the **cloned repo**

`<repo>` = `~/dev/agentic-hq/agentic-hq`, on PATH via `npm link`.

1. Shell → `<repo>/bin/agentic-hq.cjs` (dev wrapper). **Build 1 first: `<repo>/src/` → `<repo>/dist/`
   (JS + `.d.ts`)** — every invocation, so dev always runs code compiled from the current source. Then
   the CLI, with `--build-mode=build-first --ahq-package-root=<repo>`.
2. Discovery: `<repo>/.agentic-hq/plugins` (bundled → the wrapper's mode, `build-first`) and
   `~/dev/my-workspace/.agentic-hq/plugins` (workspace → `build-first`).
3–5. As §4.1 with `$2 = <repo>`.
6. Build 2 in `~/dev/my-workspace/…/my-custom-workflow/ts-workflow`: install → symlink
   `node_modules/agentic-hq → <repo>` (whose `exports` → `<repo>/dist/*.js`; `types` → `src/*.ts`, so
   IDEs and tsc see live source types) → tsc → `…/ts-workflow/dist/` inside `my-workspace`. Framework
   code used at run time = `<repo>/dist`, freshly built in step 1.
7. Run — as §4.1.

Running a **bundled** workflow with the clone (e.g. `agentic-hq reversal`) is exactly the same, except
the ts-workflow dir is `<repo>/.agentic-hq/plugins/…/string-reversal/ts-workflow/` (its `dist/` and
`node_modules/` live there, gitignored). Bundled and custom workflows are indistinguishable to the runner.

### 4.3 Side by side

| Step | Bundled string-reversal, AHQ clone | `my-custom-workflow`, my-workspace, npm agentic-hq |
| --- | --- | --- |
| wrapper | dev: **Build 1 → `<repo>/dist`**, runs CLI, `--build-mode=build-first --ahq-package-root=<repo>` | prebuilt: runs installed CLI, `--build-mode=prebuilt --ahq-package-root=<AHQ>` |
| discovery | found under AHQ root → workflow mode `build-first` | found under workspace → workflow mode `build-first` |
| SKILL.md | identical file, relays `$1=build-first`, `$2=<repo>` | identical file, relays `$1=build-first`, `$2=<AHQ>` |
| runner Build 2 | install, symlink → `<repo>`, tsc → `ts-workflow/dist` | install, symlink → `<AHQ>`, tsc → `ts-workflow/dist` |
| run | `node …/dist/string-reversal-demo-cli.js …` | `node …/dist/my-custom-workflow-cli.js …` |

Same for the npm-installed bundled string-reversal, except `$1=prebuilt` → Build 2 skipped and
self-reference resolves the framework.

## 5. What gets simpler, what it costs

**Simpler:** one workflow shape and one `SKILL.md` template (the scaffolder transforms nothing);
`EXCLUDED_UNMIGRATED_SKILLS`, the per-workflow `tsconfig.build.json` `include` list and its `paths`
mapping go; dev never executes out of `release/` (publish-only — which also defuses the known
`release/` contention between `publish-guards` and `build-determinism` integration tests); no `link:`
dependencies; typechecked workflow builds everywhere; a straight line to plugin publishing without a
re-architecture.

**Costs:** `.d.ts` emission and framework `exports` → `dist` (with a `types` condition for live IDEs);
`build-workflow.cjs` and `--workflow-dir`; per-workflow build-mode in the CLI; the dev wrapper builds
the framework on every invocation (incl. `list` — incremental tsc keeps it ~1 s); the release build loops
Build 2 over bundled workflows and strips their install files; the scaffolder regenerates install files
from its template instead of copying them; workflow authors need a package manager and get a TypeScript
compiler installed per workflow (today: tsx — same class of prerequisite); tool users still need nothing.

Relative to the minimal "old pattern + tsx" route: **roughly 1.5–2× the work**, almost all of it in the
bounded, non-interactively testable build/runner refactor — and it avoids doing the five migrations and
the scaffolder rewrite twice.

## 6. Alternatives considered and rejected

| Alternative | Why rejected |
| --- | --- |
| Keep symlink + tsx for user workflows (feed the symlink from `$2`) | two run models, two `SKILL.md` shapes, no typecheck, no artifact; redone later |
| Hardcode `--build-mode=build-first` in user `SKILL.md` | doesn't mirror agentic-hq skills; messy at plugin release time (human's veto) |
| Runner infers "outside the package ⇒ build" from paths | runner second-guesses `--build-mode`; path heuristic; the CLI already knows the root |
| Runner builds user workflows via tsx (fused build+run) | not byte-identical/publishable — the human's core objection |
| Scaffold a real registry dependency on `agentic-hq` | second copy of the framework per workflow (node-pty rebuilt), version skew, contributors' workspace workflows would run the published framework not local source; this is AHQ-203's territory |
| Runner-registered Node resolve hook for all runtime resolution | viable and uniform, but one more moving part; noted for AHQ-203 |

## 7. Relation to AHQ-203 (what is deliberately temporary)

The end-state for "users publish workflows to npm" is what
[AHQ-203](https://agentic-hq.atlassian.net/browse/AHQ-203) already names: a plugin is a real npm
package with its own manifest and build, declaring agentic-hq as a normal (peer) dependency, resolved by
standard `node_modules` rules. This design carries over to that unchanged: the layout, Build 2, the
`SKILL.md`, the runner, per-workflow `dist/`, and the release recipe. The **only** deliberately temporary
piece is §3.7 case 2 — self-reference for prebuilt workflows *inside* the agentic-hq package — which a
third-party release replaces with a declared dependency (or the resolve hook). Nothing else moves. One
genuinely good property of the runner-made symlink for source workflows: the workflow always runs against
**the framework that launched it** — no version skew, no second node-pty build — which is what peer
dependencies approximate.

## 8. Proposed split of AHQ-201 (for the Step 7 size decision)

Because this changes the pattern, migrating the five workflows onto the *old* pattern first would be
wasted work (the human's "each design change once" rule). Proposed:

- **A — [AHQ-208](https://agentic-hq.atlassian.net/browse/AHQ-208) — the redesign itself**, proven the
  AHQ-197 way on math-workflow + string-reversal + add-feature (string-reversal doubling as the
  user-workspace fixture, run against a tarball install with no clone): Build 1/Build 2 scripts, runner,
  per-workflow build-mode, `.d.ts`, `exports`, dev wrapper + `agentic-hq-dev`, release build, tests.
- **B — [AHQ-209](https://agentic-hq.atlassian.net/browse/AHQ-209) — migrate the remaining workflows**
  (quick-jira, full-jira, add-feature-detailed-example, create-workflow) + rewrite the scaffolder onto
  the single template + grep-clean AC + bin-wrapper test cleanup + the human's
  `create-workflow -- --using=add-feature` acceptance walk-through + the `0.2.0` re-publish.

Created by the human on 2026-08-18 as two clean sub-task Jiras with AHQ-201 as the umbrella; the full
item lists are in the brief's `Split Suggestion`.

## 9. Decisions left to the Planner (not architecture)

- ~~`--workflow-dir` + relative `--workflow-js` vs a single absolute `--workflow-js`.~~ **Settled
  2026-08-18:** all four runner options kept exactly as in §3.4/§3.5 — see
  `03-the-four-combinations-of-example-runs-types-all-explained-and-worked-through.md` §6 (contract)
  and §8 (why none were ditched).
- ~~Prebuilt framework resolution: self-reference vs resolve hook.~~ **Decided 2026-08-18 (brief Q6a):
  self-reference now, hook deferred to AHQ-203** — rationale in §11(a).
- ~~Dev wrapper runs the compiled CLI from `dist/` vs keeps tsx for the CLI.~~ **Decided (Q6b): compiled
  CLI from `dist/`** — §11(b).
- ~~Root `exports` `types` condition → `.ts` source vs `.d.ts` only.~~ **Decided (Q6c): `types` → `.ts`
  source** — §11(c).
- ~~Incremental vs clean tsc for Build 1 per dev invocation.~~ **Decided (Q6d): incremental** — §11(d).
- Whether the release build also strips the two skill-less draft `commands/` dirs (the brief's Q4 —
  answered "Yes": option (a) plus the AI-proposed hygiene item (b), in sub-task B).
- pnpm vs npm for Build 2's install step (today's standard: pnpm + frozen lockfile, AHQ-152).
- Source maps for the compiled framework/CLI (`sourceMap: true` + `node --enable-source-maps` in the dev
  wrapper) so dev stack traces point at `.ts` lines — a natural companion to §11(b).

## 10. In scope for AHQ-201 — rename the dev binary to `agentic-hq-dev`

Proposed by the human on 2026-08-18 and made **part of the AHQ-201 plan** the same day (it belongs in
sub-task A, where the dev wrapper is already being changed). Rename the binary that runs from the cloned
repo (the dev wrapper `bin/agentic-hq.cjs`, installed on PATH via `npm link`, which rebuilds from source
on every run) to **`agentic-hq-dev`**, leaving `agentic-hq` for the npm-installed prebuilt release. Then:
install via npm → you run `agentic-hq` (prebuilt, just runs); link the clone → you run `agentic-hq-dev`
and you know it rebuilds from source every time (edit code or workflow files and run — no build step to
remember).

Why it belongs in this ticket rather than later:

- **The two binaries currently fight over one name.** `npm link` from the clone and
  `npm install -g agentic-hq` both claim `<prefix>/bin/agentic-hq`, so the linked dev build and the
  registry build cannot coexist in one Node prefix — awkward for exactly the person who needs both (the
  maintainer testing the npm route while developing). With distinct names they coexist.
- **The name becomes the truth**, consistent with the design's first principle ("which artifact you
  invoked IS the truth"): no `which agentic-hq` needed to know whether a run will rebuild; the
  "npm binary launched from inside a clone" case (doc 03 §7.4) becomes hard to do by accident.
- **Cheap.** Root `package.json` `bin` → `{ "agentic-hq-dev": "bin/agentic-hq.cjs" }`; the generated
  release manifest already writes its own `bin` (`agentic-hq` → `bin/agentic-hq-prebuilt.cjs`), so the
  shipped name is untouched. Nothing in the runtime chain invokes the binary by name (SKILL.md files and
  commands use `{ahq-package-root}` paths), so no workflow files change. What moves: the e2e
  "`agentic-hq` on PATH" precondition, `pnpm demo:*` comments, contributor docs; shipped command files
  that tell *tool users* what to run next (e.g. add-feature Command 04's
  `agentic-hq create-workflow -- --using=add-feature`) stay as they are, and contributor docs note the
  substitution.
- **Sequencing:** AHQ-199 (README/docs) runs after AHQ-201, so landing the rename inside AHQ-201
  means the docs are written once with the final names.
- **The collision would bite during AHQ-201's own verification** — proving the registry/tarball
  install while the linked dev binary is on PATH is exactly the both-at-once situation AHQ-198 had to
  dodge with temp prefixes.

Recorded in the parent brief's Sub-Task 7 instructions (`docs/tickets/AHQ-195/workflow-files/01-feature-brief.md`).

## 11. The brief's Question 6 in depth — the four choices, decided by the human on 2026-08-18

The human read the trade-offs below and **decided all four as recommended** (brief Q6): **(a)**
self-reference now, hook deferred to AHQ-203; **(b)** the compiled CLI from `dist/`; **(c)** the `types`
condition → `.ts` source; **(d)** incremental tsc. The analysis is kept as the rationale for the
Planner of sub-task A (who plans the *how*, which the human then approves); the "lean" lines record
what was recommended and chosen.

### (a) How a *prebuilt* workflow's JS finds the framework — self-reference vs resolve hook

The compiled workflow at `<AHQ>/.agentic-hq/plugins/…/ts-workflow/dist/<x>.js` says
`import … from 'agentic-hq/tools/claude-code'`. In a read-only install with no `node_modules` inside
the plugin, Node has to be told where that is.

**Self-reference (recommended; decided Q6a).** Node lets a file import *its own package* by name
through the package's `exports`, where "its own package" is the nearest ancestor `package.json`.
Today's shipped workflows already rely on this (AHQ-196's finding — their JS sits under `<AHQ>/dist/`
with no manifest in between). Under the new layout the JS sits inside `ts-workflow/`, so the release
must **not ship `ts-workflow/package.json`** (nor its lockfile / `.npmrc` / `pnpm-workspace.yaml`);
then the nearest manifest is `<AHQ>/package.json`, self-reference resolves, `"type": "module"` makes the
JS ESM, and `commander` is found by the upward walk to `<AHQ>/node_modules` (also correct for the npx
sibling layout).

- *Pros:* zero runtime machinery — a pure property of the release layout; already proven; a release is
  prebuilt so its install files are meaningless there anyway (and stripping them shrinks the artifact).
- *Cons:* the shipped `ts-workflow/` differs from the source one (`src/`, `dist/`, `tsconfig.json`
  only), so `--using` copies from a registry install regenerate the install files from the scaffolder's
  template — arguably right, since they are identical for every workflow, but it is a consequence to
  design for; dev uses the symlink and prod uses self-reference (two mechanisms, one per mode); and it
  works **only for workflows inside the agentic-hq package** — a third-party plugin release installed
  elsewhere cannot self-reference `agentic-hq`, so AHQ-203 must add something then.
- *Watch-item:* nothing may introduce a `package.json` between a shipped workflow's `dist/` and the
  package root; the tarball e2e should assert the stripped layout.

**A runner-registered resolve hook.** The runner spawns the workflow as
`node --import <root>/scripts/agentic-hq-resolve.mjs …`; that file calls Node's `module.register()`
with a resolver mapping `agentic-hq` / `agentic-hq/*` to `--ahq-package-root` (it can read the same
explicit argv the runner forwards — no env var, no derivation).

- *Pros:* **one** mechanism for every situation — dev, workspace, prebuilt bundled, *and* future
  third-party releases; no stripped files (the shipped tree equals the source tree plus `dist/`); no
  symlink needed at run time (Build 2 still creates it for tsc types).
- *Cons:* more moving parts (a hook file, an `--import` flag, and a new debugging surface — resolution
  failures now involve hooks); the customization-hooks API is documented as *release-candidate*
  stability in Node 22/24 (widely used — tsx itself is built on it — but not marked stable); ~tens of
  ms of startup; and it is a bit of magic in exactly the place the human likes plain.

*Recommended and decided (Q6a):* self-reference now, hook when third-party releases arrive (AHQ-203) —
at which point it *replaces* self-reference uniformly rather than adding to it. Both keep the SKILL.md
and layout identical, so nothing else in the plan moves. (Also considered and not recommended: a
build-time rewrite of the
compiled import specifiers to relative paths — needs a post-processing step and still leaves dev on the
symlink.)

### (b) The dev wrapper runs the *compiled* CLI from `<repo>/dist` — vs keeps running the TS CLI via tsx

Under the new design the dev wrapper runs Build 1 on every invocation anyway (workflows import the
framework from `<repo>/dist`). The question is only whether the CLI process itself then runs from
`dist/src/cli/main.js` (like production) or from `src/cli/main.ts` via tsx (like today).

- *For running from `dist` (recommended; decided Q6b):* the dev CLI becomes byte-identical to the shipped CLI
  (parity for the last piece that isn't today); the two wrappers become near-identical (both
  `import(dist/main.js)` after splicing argv — the dev one just builds first and says `build-first`);
  tsx leaves the runtime path entirely (it stays a devDependency only if something else needs it); a
  framework type error stops the dev CLI loudly (`agentic-hq-dev list` included) — the correct
  fail-fast, rather than tsx running type-broken code.
- *Consequences to plan for:* stack traces from the dev CLI point at `dist` lines unless the build emits
  source maps and the wrapper runs `node --enable-source-maps` (small; see §9); every CLI call pays the
  incremental build (~1 s — that is (d)); the dev CLI cannot run while the framework has a type error
  (arguably a feature).
- *The alternative* (build for workflows but still run the CLI via tsx) keeps a second execution
  mechanism and forgoes CLI parity for no gain but tsx-style traces — not recommended.

### (c) Root `package.json` `exports` carries a `types` condition → `.ts` source

So contributors' IDEs and Build 2's `tsc` see live source types without a framework build having run.
Node ignores the `types` condition; TypeScript honours it. Near-free; the alternative (`.d.ts` only)
means types are stale/absent until the next Build 1. The release manifest (generated) points `types` at
the shipped `.d.ts` instead.

### (d) Build 1 uses incremental `tsc`

`tsc --incremental` (a `.tsbuildinfo` alongside `dist/`) makes the per-invocation framework build ~1 s
after the first run, with output identical to a clean build. Near-free; the alternative (clean build
per invocation) costs several seconds on every `agentic-hq-dev …`, including `list`. The publish build
may still do a clean build for belt-and-braces determinism (the existing build-determinism test
compares two builds' hashes).

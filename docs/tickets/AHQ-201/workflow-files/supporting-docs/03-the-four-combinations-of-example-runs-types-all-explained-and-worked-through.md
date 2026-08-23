# AHQ-201 — The Four Combinations Of Example Runs, All Explained And Worked Through

> Written 2026-08-18 during the Researcher stage of the AHQ-201 `add-feature` run, as the third
> supporting document for the two-separate-builds design
> (`01-new-two-separate-builds-architecture-design.md`; the human's four questions about it are in
> `02-four-questions-and-answers-about-new-build-architecture.md`). This document walks every
> combination of *which agentic-hq binary launched the run* × *where the workflow lives*, showing the
> example directories, the four runner variables and their values, and the hop-by-hop flow — and ends
> with the record of why all four variables were kept.
>
> **Status:** describes the *proposed* design (not yet implemented). Everything below assumes the
> design in doc 01 with the runner contract settled in §6 of this document.

## 1. The combination matrix

Two independent axes decide everything about a run:

- **Axis 1 — which agentic-hq binary launched the run.** Either the **cloned repo's dev wrapper**
  (`<repo>/bin/agentic-hq.cjs`, on PATH via `npm link`; the framework is *source*, so the wrapper
  builds it first: framework mode `build-first`) or the **npm-installed prebuilt wrapper**
  (`<AHQ>/bin/agentic-hq-prebuilt.cjs`; the framework is a *release*: framework mode `prebuilt`).
- **Axis 2 — where the workflow being run lives.** Either **bundled inside the agentic-hq package**
  (found by discovery under `{ahq-package-root}/.agentic-hq/plugins/…`) or **in the user's workspace**
  (found under `{cwd}/.agentic-hq/plugins/…`).

| | Workflow **bundled** in the agentic-hq package | Workflow in the **user's workspace** |
| --- | --- | --- |
| **npm-installed** agentic-hq (`<AHQ>`) | **D** — §5. `build-mode = prebuilt`. Nothing built; runs the shipped `dist/`; framework found by package self-reference. | **A** — §2. `build-mode = build-first`. Build 2 in the user's workflow dir; symlink → `<AHQ>`. |
| **cloned** agentic-hq (`<repo>`) | **C** — §4. `build-mode = build-first`. Build 1 by the wrapper; Build 2 inside the repo's own skill dir; symlink → `<repo>`. | **B** — §3. `build-mode = build-first`. Build 1 by the wrapper; Build 2 in the user's workflow dir; symlink → `<repo>`. |

The matrix is complete for the two axes: every run is one of A–D. Two rules generate the whole table:

1. **`ahq-package-root`** = the root of whichever agentic-hq launched the run (`<AHQ>` or `<repo>`) —
   born in the wrapper, relayed unchanged.
2. **`build-mode`** = the mode of *the workflow being launched*: a workflow found under the **user's
   workspace is always `build-first`** (a workspace holds source); a workflow found under the
   **agentic-hq package root inherits the wrapper's mode** (`build-first` for the clone, `prebuilt` for
   the npm install), because it is part of that package.

The remaining variations (cwd = the clone itself, an npm binary run from inside a clone, npx, a
collaborator's machine, a future installed-plugins root) are *variants* of A–D along other axes, not
new cells — they are worked through in §7 so nothing is left implicit.

### Terms used throughout

| Term | Example value | Meaning |
| --- | --- | --- |
| `<AHQ>` | `~/.nvm/versions/node/v24.15.0/lib/node_modules/agentic-hq` | an npm-installed agentic-hq package (a read-only release tree). Absolute in reality. |
| `<repo>` | `~/dev/agentic-hq/agentic-hq` | the cloned agentic-hq repository, on PATH via `npm link` |
| `<ws>` | `~/dev/my-workspace` | the user's own project (a git repo), also the cwd unless stated |
| `<io-dir>` | `<ws>/.agentic-hq/temp/command-input-output-files/io-files-<timestamp>_<uuid>` | the marshalling dir the CLI creates per Claude invocation, always under the cwd, never inside `<AHQ>`; handed to skills/commands as `$0` |
| Build 1 | | the **framework** build: `<repo>/src` → `<repo>/dist` (JS + `.d.ts`); dev wrapper on every invocation; publish for release; never on a user's machine |
| Build 2 | | the **workflow** build: `pnpm install` + symlink `node_modules/agentic-hq → {ahq-package-root}` + `tsc` → `<that workflow>/ts-workflow/dist/`; identical everywhere |

### The four runner variables (the settled contract — see §6)

The SKILL.md of **every** workflow returns this template (only the CLI filename differs per workflow):

```
node "{ahq-package-root}/scripts/run-workflow.cjs" --ahq-package-root="{ahq-package-root}" --build-mode={build-mode} \
     --workflow-dir="{skill-base-dir}/ts-workflow" --workflow-js=dist/<name>-cli.js
```

| # | Variable | What it is | Born where | Terminates where |
| --- | --- | --- | --- | --- |
| 1 | `--ahq-package-root` | the root of the agentic-hq that launched the run | bin wrapper | relayed as `$2` to skills → runner → forwarded to the workflow program → relayed to every command |
| 2 | `--build-mode` | the mode of the workflow being launched | bin wrapper (framework mode) → **re-derived per workflow at discovery** | relayed as `$1` → runner (the only code that acts on it) → forwarded to the program → relayed to commands |
| 3 | `--workflow-dir` | the workflow's `ts-workflow` directory | SKILL.md, from `skill-base-dir` (Claude gives every skill its own dir) | runner |
| 4 | `--workflow-js` | the compiled entry file, relative to `--workflow-dir` | SKILL.md | runner |

## 2. Combination A — `my-custom-workflow` in `<ws>`, npm-installed agentic-hq

**The acceptance scenario** from the parent brief (an npm-installed author scaffolds → pushes → a
collaborator with their own npm install runs it; no clone anywhere).

### 2.1 Directories

```
<AHQ> = ~/.nvm/versions/node/v24.15.0/lib/node_modules/agentic-hq/      (read-only release tree)
  package.json                        exports: agentic-hq/tools/claude-code → ./dist/src/tools/…/index.js
  bin/agentic-hq-prebuilt.cjs
  scripts/run-workflow.cjs, scripts/build-workflow.cjs
  dist/src/**/*.js + *.d.ts           ← FRAMEWORK: built at PUBLISH time on the maintainer's machine
                                          (<repo>/src → <repo>/dist → release/dist → tarball → here).
                                          NEVER built on the user's machine.
  .agentic-hq/plugins/…/skills/string-reversal/ts-workflow/{src/, dist/}   ← bundled workflows, prebuilt
  node_modules/{commander, fast-glob, node-pty}

<ws> = ~/dev/my-workspace/                                                (the user's git repo; cwd)
  .agentic-hq/plugins/my-plugin/
    .claude-plugin/plugin.json
    commands/my-custom-workflow/01-….md …
    skills/my-custom-workflow/
      SKILL.md, ahq-workflow.json
      ts-workflow/
        package.json, tsconfig.json, .npmrc, pnpm-workspace.yaml, pnpm-lock.yaml   (committed)
        src/my-custom-workflow-cli.ts        ← WORKFLOW: built FROM here…
        dist/my-custom-workflow-cli.js       ← …TO here (gitignored)
        node_modules/{typescript, commander, agentic-hq → <AHQ>}                   (gitignored)
```

### 2.2 The four variables

| # | Variable | Value |
| --- | --- | --- |
| 1 | `--ahq-package-root` | `<AHQ>` = `~/.nvm/versions/node/v24.15.0/lib/node_modules/agentic-hq` |
| 2 | `--build-mode` | `build-first` from discovery onward (the wrapper said `prebuilt` — see the note below) |
| 3 | `--workflow-dir` | `<ws>/.agentic-hq/plugins/my-plugin/skills/my-custom-workflow/ts-workflow` |
| 4 | `--workflow-js` | `dist/my-custom-workflow-cli.js` |

### 2.3 Hop by hop — `cd ~/dev/my-workspace && agentic-hq my-custom-workflow -- --ticket-id=X`

1. **Wrapper → CLI.** Shell resolves `agentic-hq` to `<AHQ>/bin/agentic-hq-prebuilt.cjs`, which inserts
   the framework params and runs the compiled CLI:
   `node <AHQ>/dist/src/cli/main.js --build-mode=prebuilt --ahq-package-root=<AHQ> my-custom-workflow -- --ticket-id=X`
   (Framework: nothing to build — it is a release.)
2. **Discovery.** The CLI scans `<AHQ>/.agentic-hq/plugins/*` (bundled) and `<ws>/.agentic-hq/plugins/*`
   (yours, first) for `skills/*/ahq-workflow.json`; matches `my-custom-workflow` **under the workspace →
   its mode is `build-first`**.
3. **CLI → Claude (the skill hop).** The CLI starts a Claude session with `--plugin-dir` for every
   plugin in both roots and runs the skill; the last positional argument is
   `/my-plugin:my-custom-workflow <io-dir> build-first <AHQ>` — i.e. `$0 $1 $2`.
4. **SKILL.md → `command-output.json`.** The skill fills the template (no decisions) and writes:
   `node "<AHQ>/scripts/run-workflow.cjs" --ahq-package-root="<AHQ>" --build-mode=build-first --workflow-dir="<ws>/.agentic-hq/plugins/my-plugin/skills/my-custom-workflow/ts-workflow" --workflow-js=dist/my-custom-workflow-cli.js`
   then self-terminates.
5. **CLI → shell.** The CLI appends the shell-escaped passthrough args and executes the string with
   cwd `<ws>`: `… --workflow-js=dist/my-custom-workflow-cli.js '--ticket-id=X'`.
6. **Runner — `build-first` → Build 2 on `--workflow-dir`:**
   `pnpm install` (typescript, commander — a no-op after the first run) → ensure
   `node_modules/agentic-hq → <AHQ>` (from `--ahq-package-root`) → `tsc` compiles
   `src/my-custom-workflow-cli.ts` → `dist/my-custom-workflow-cli.js`, typechecked against
   `<AHQ>/dist/**/*.d.ts` through the symlink (a type error stops here, loudly). Everything written stays
   inside the user's `ts-workflow/`; nothing is written into `<AHQ>`.
7. **Runner → program.**
   `node <ws>/…/my-custom-workflow/ts-workflow/dist/my-custom-workflow-cli.js --build-mode=build-first --ahq-package-root=<AHQ> --ticket-id=X`.
   `new DefaultWorkflowRuntime(process.argv)` consumes #1 and #2; commander gets `--ticket-id=X`. The
   `import 'agentic-hq/tools/claude-code'` resolves through the symlink to `<AHQ>/dist/…`; the
   framework's own dependencies (`node-pty`, `fast-glob`, `commander`) load from `<AHQ>/node_modules`
   because Node follows the symlink to the real path.
8. **Program → commands.** Each `tool.execute('/my-plugin:my-custom-workflow:01-…', input)` launches a
   Claude session whose command line ends `<new io-dir> build-first <AHQ>` — the same relay shape.
   Commands ignore `$1`/`$2`; they parse their `command-input.json`.
9. **Next run:** install no-op, symlink idempotent, `tsc` ~1–2 s — always freshly compiled from the
   current source. That is "dev = build + run" for a workflow author.

**Note on `build-mode` in this combination:** it is *not* constant across the chain — the wrapper says
`prebuilt` (about the framework), and from discovery onward it says `build-first` (about the workflow).
Everything downstream relays that value verbatim; only the CLI's "which root did I find it under" rule
sets it. That is what lets the same SKILL.md be correct in every tree without a second variable.

**Summary — what is built where:** Build 1: nowhere (prebuilt in `<AHQ>/dist`). Build 2: in
`<ws>/…/my-custom-workflow/ts-workflow/` (`node_modules/`, `dist/`). Run from that `dist/`. Framework
resolved via `node_modules/agentic-hq → <AHQ>`.

## 3. Combination B — `my-custom-workflow` in `<ws>`, cloned agentic-hq

A contributor (or anyone with the repo linked) running the same user-workspace workflow.

### 3.1 Directories

```
<repo> = ~/dev/agentic-hq/agentic-hq/                                     (the clone; on PATH via npm link)
  package.json                        exports: agentic-hq/tools/claude-code → ./dist/src/…/index.js
                                      (types condition → ./src/…/index.ts, so IDEs see live source)
  bin/agentic-hq.cjs (dev wrapper), bin/agentic-hq-prebuilt.cjs (shipped only)
  scripts/run-workflow.cjs, scripts/build-workflow.cjs, scripts/build-release.cjs
  src/**/*.ts                         ← FRAMEWORK source
  dist/src/**/*.js + *.d.ts           ← Build 1 output, rebuilt by the dev wrapper on every invocation (gitignored)
  .agentic-hq/plugins/…               ← bundled workflows (source; each with its own gitignored dist/)
  release/                            ← publish-only staging; NOT used by dev runs

<ws> = ~/dev/my-workspace/                                                (identical to §2.1)
  .agentic-hq/plugins/my-plugin/skills/my-custom-workflow/ts-workflow/{src/, dist/, node_modules/agentic-hq → <repo>}
```

### 3.2 The four variables

| # | Variable | Value |
| --- | --- | --- |
| 1 | `--ahq-package-root` | `<repo>` = `~/dev/agentic-hq/agentic-hq` |
| 2 | `--build-mode` | `build-first` at every hop (wrapper: framework is source; discovery: workspace is source — they coincide) |
| 3 | `--workflow-dir` | `<ws>/.agentic-hq/plugins/my-plugin/skills/my-custom-workflow/ts-workflow` — **identical to A** |
| 4 | `--workflow-js` | `dist/my-custom-workflow-cli.js` — identical to A |

### 3.3 Hop by hop — `cd ~/dev/my-workspace && agentic-hq my-custom-workflow -- --ticket-id=X`

1. **Wrapper → CLI.** `<repo>/bin/agentic-hq.cjs` **first runs Build 1** (`<repo>/src` → `<repo>/dist`,
   JS + `.d.ts`; incremental tsc keeps this ~1 s, output identical to a clean build), then runs the CLI —
   recommended from the compiled tree so even the CLI is byte-identical to production:
   `node <repo>/dist/src/cli/main.js --build-mode=build-first --ahq-package-root=<repo> my-custom-workflow -- --ticket-id=X`
2. **Discovery.** `<repo>/.agentic-hq/plugins/*` (bundled → the wrapper's mode, `build-first`) and
   `<ws>/.agentic-hq/plugins/*` (workspace → `build-first`); matches `my-custom-workflow` under `<ws>`.
3. **CLI → Claude.** `/my-plugin:my-custom-workflow <io-dir> build-first <repo>`.
4. **SKILL.md → `command-output.json`** — the identical template, only `$2` differs from A:
   `node "<repo>/scripts/run-workflow.cjs" --ahq-package-root="<repo>" --build-mode=build-first --workflow-dir="<ws>/…/my-custom-workflow/ts-workflow" --workflow-js=dist/my-custom-workflow-cli.js`
5. **CLI → shell.** + `'--ticket-id=X'`, cwd `<ws>`.
6. **Runner — Build 2** in `<ws>/…/my-custom-workflow/ts-workflow`: install → symlink
   `node_modules/agentic-hq → <repo>` (resolves to `<repo>/dist/*.js` for Node; `src/*.ts` types for tsc/IDE
   via the `types` condition) → tsc → `dist/my-custom-workflow-cli.js` **inside `<ws>`**.
7. **Runner → program.**
   `node <ws>/…/ts-workflow/dist/my-custom-workflow-cli.js --build-mode=build-first --ahq-package-root=<repo> --ticket-id=X`.
   Framework code used at run time = `<repo>/dist`, freshly built in step 1.
8. **Program → commands.** Relays `<new io-dir> build-first <repo>`.

**Differences from A:** `<AHQ>` → `<repo>` in #1 (hence the symlink target and the runner's path); the
framework got built in step 1 instead of arriving prebuilt; `build-mode` is `build-first` from the very
first hop instead of flipping at discovery. Steps 3–7 — the SKILL.md, the runner's work in the user's
workspace, the compiled JS's location — are the same.

**Summary — what is built where:** Build 1: `<repo>/src` → `<repo>/dist`. Build 2: in
`<ws>/…/my-custom-workflow/ts-workflow/`. Run from that `dist/`. Framework resolved via
`node_modules/agentic-hq → <repo>`.

## 4. Combination C — bundled `string-reversal`, cloned agentic-hq

The everyday contributor case (e.g. the existing cross-workspace e2e tests): a bundled workflow run
from the clone, from any cwd.

### 4.1 Directories

```
<repo> = ~/dev/agentic-hq/agentic-hq/                                     (as §3.1)
  dist/src/**                         ← Build 1 output
  .agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/
    SKILL.md, ahq-workflow.json
    ts-workflow/
      package.json, tsconfig.json, .npmrc, pnpm-workspace.yaml, pnpm-lock.yaml   (committed)
      src/string-reversal-demo-cli.ts       ← WORKFLOW: built FROM here…
      dist/string-reversal-demo-cli.js      ← …TO here (gitignored, inside the repo)
      node_modules/{typescript, commander, agentic-hq → <repo>}                   (gitignored)

<ws> = ~/dev/my-workspace/    (cwd; only <io-dir> is written here — the workflow has nothing to do with it)
```

### 4.2 The four variables

| # | Variable | Value |
| --- | --- | --- |
| 1 | `--ahq-package-root` | `<repo>` = `~/dev/agentic-hq/agentic-hq` |
| 2 | `--build-mode` | `build-first` throughout (wrapper: source; found under the AHQ package root → inherits the wrapper's mode) |
| 3 | `--workflow-dir` | `<repo>/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow` |
| 4 | `--workflow-js` | `dist/string-reversal-demo-cli.js` |

### 4.3 Hop by hop — `cd ~/dev/my-workspace && agentic-hq reversal -- --string-to-reverse=abc`

1. **Wrapper → CLI.** Build 1 (`<repo>/src` → `<repo>/dist`), then
   `node <repo>/dist/src/cli/main.js --build-mode=build-first --ahq-package-root=<repo> reversal -- --string-to-reverse=abc`
2. **Discovery.** Matches `string-reversal` (short id `reversal`) **under the AHQ package root → inherits
   the wrapper's mode, `build-first`**.
3. **CLI → Claude.** `/agentic-hq-demos-plugin:string-reversal <io-dir> build-first <repo>` — `<io-dir>`
   under the cwd as always.
4. **SKILL.md → `command-output.json`** — the identical template, now with `skill-base-dir` inside the repo:
   `node "<repo>/scripts/run-workflow.cjs" --ahq-package-root="<repo>" --build-mode=build-first --workflow-dir="<repo>/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow" --workflow-js=dist/string-reversal-demo-cli.js`
5. **CLI → shell.** + `'--string-to-reverse=abc'`, cwd `<ws>`.
6. **Runner — Build 2 *inside the repo's own skill folder*:** `pnpm install` there → symlink
   `<repo>/…/string-reversal/ts-workflow/node_modules/agentic-hq → <repo>` (a symlink from inside the repo
   back to its own root — exactly what the old depth-relative `link:../../../../../..` did implicitly) →
   tsc → `<repo>/…/string-reversal/ts-workflow/dist/string-reversal-demo-cli.js` (gitignored).
7. **Runner → program.**
   `node <repo>/…/string-reversal/ts-workflow/dist/string-reversal-demo-cli.js --build-mode=build-first --ahq-package-root=<repo> --string-to-reverse=abc`
8. **Program → commands.** Relays `<new io-dir> build-first <repo>` to
   `/agentic-hq-demos-plugin:string-reversal:reverse-a-string`.

**Difference from B:** only #3 — the ts-workflow directory is inside `<repo>` instead of inside `<ws>`.
Template, runner, build steps, symlink target, forwarded params are identical. This is the "bundled and
custom workflows are indistinguishable to the runner" property.

**Summary — what is built where:** Build 1: `<repo>/src` → `<repo>/dist`. Build 2: in
`<repo>/…/string-reversal/ts-workflow/`. Run from that `dist/`. Framework resolved via
`node_modules/agentic-hq → <repo>`.

## 5. Combination D — bundled `string-reversal`, npm-installed agentic-hq

The tool-user case: the only combination in which **nothing is built** and the runner just runs.

### 5.1 Directories

```
<AHQ> = ~/.nvm/versions/node/v24.15.0/lib/node_modules/agentic-hq/      (read-only release tree)
  package.json                        "type": "module"; exports → ./dist/src/…/index.js
  dist/src/**/*.js + *.d.ts           ← framework, prebuilt at publish
  scripts/run-workflow.cjs
  .agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/
    SKILL.md, ahq-workflow.json
    ts-workflow/
      src/string-reversal-demo-cli.ts       ← shipped for reference / --using copies
      dist/string-reversal-demo-cli.js      ← Build 2 output, produced at PUBLISH time in the maintainer's clone
      (NO package.json / lockfile / .npmrc / pnpm-workspace.yaml — install files are stripped by the release build;
       NO node_modules — nothing to install in a release)
  node_modules/{commander, fast-glob, node-pty}

<ws> = ~/dev/my-workspace/    (cwd; only <io-dir> is written here)
```

### 5.2 The four variables

| # | Variable | Value |
| --- | --- | --- |
| 1 | `--ahq-package-root` | `<AHQ>` |
| 2 | `--build-mode` | `prebuilt` throughout (wrapper: release; found under the AHQ package root → inherits it) |
| 3 | `--workflow-dir` | `<AHQ>/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow` |
| 4 | `--workflow-js` | `dist/string-reversal-demo-cli.js` |

### 5.3 Hop by hop — `cd ~/dev/my-workspace && agentic-hq reversal -- --string-to-reverse=abc`

1. **Wrapper → CLI.** `<AHQ>/bin/agentic-hq-prebuilt.cjs` — no build of anything —
   `node <AHQ>/dist/src/cli/main.js --build-mode=prebuilt --ahq-package-root=<AHQ> reversal -- --string-to-reverse=abc`
2. **Discovery.** Matches `string-reversal` under the AHQ package root → inherits `prebuilt`.
3. **CLI → Claude.** `/agentic-hq-demos-plugin:string-reversal <io-dir> prebuilt <AHQ>` — `<io-dir>`
   still under *the user's* cwd, never inside `<AHQ>`.
4. **SKILL.md → `command-output.json`** — the identical template:
   `node "<AHQ>/scripts/run-workflow.cjs" --ahq-package-root="<AHQ>" --build-mode=prebuilt --workflow-dir="<AHQ>/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow" --workflow-js=dist/string-reversal-demo-cli.js`
5. **CLI → shell.** + `'--string-to-reverse=abc'`, cwd `<ws>`.
6. **Runner — `prebuilt` → Build 2 skipped entirely** (no install, no symlink, no tsc; nothing is written
   anywhere), straight to
   `node <AHQ>/…/string-reversal/ts-workflow/dist/string-reversal-demo-cli.js --build-mode=prebuilt --ahq-package-root=<AHQ> --string-to-reverse=abc`
7. **Resolution.** That `dist/` was produced by Build 2 in the maintainer's clone at publish time and
   shipped in the tarball. Its `import 'agentic-hq/tools/claude-code'` resolves by **Node package
   self-reference**: the folder ships with no `node_modules` and no `package.json`, so the nearest
   manifest above the JS is `<AHQ>/package.json` itself, whose `exports` points at `<AHQ>/dist/…` (and
   whose `"type": "module"` makes the `.js` ESM). `commander` resolves from `<AHQ>/node_modules` by the
   normal upward walk (also correct for the npx layout, where `agentic-hq` and `commander` are siblings
   under the cache's `node_modules`).
8. **Program → commands.** Relays `<new io-dir> prebuilt <AHQ>`.

**Summary — what is built where:** Build 1: nowhere. Build 2: nowhere. Run from the shipped
`<AHQ>/…/string-reversal/ts-workflow/dist/`. Framework resolved by self-reference.

## 6. The settled runner contract (all four variables)

```
node "{ahq-package-root}/scripts/run-workflow.cjs" --ahq-package-root="{ahq-package-root}" --build-mode={build-mode} \
     --workflow-dir="{skill-base-dir}/ts-workflow" --workflow-js=dist/<name>-cli.js
```

- `--ahq-package-root`, `--build-mode` — the two chain variables, relayed verbatim (`$2`, `$1`) and
  forwarded on to the workflow program (`--build-mode=… --ahq-package-root=…` on its argv, consumed by
  `new DefaultWorkflowRuntime(process.argv)`).
- `--workflow-dir` — runner-local; where the workflow is; from `skill-base-dir`.
- `--workflow-js` — runner-local; which compiled file to run, relative to `--workflow-dir`.
- Runner behaviour: `build-first` → Build 2 on `--workflow-dir` (with `--ahq-package-root` as the symlink
  target), then run; `prebuilt` → run. Run = `node <workflow-dir>/<workflow-js> --build-mode=<…> --ahq-package-root=<…> [passthrough args]`.
- All four required, no defaults, loud errors — as today.

Across all four combinations: the SKILL.md template, the runner, and #4's shape never change; #3 is
always "this workflow's own `ts-workflow/`"; #1 is whichever agentic-hq launched it; #2 is
`build-first` for anything that is source (the clone's bundled workflows and every workspace workflow)
and `prebuilt` only for bundled workflows inside an npm install.

## 7. Variants along other axes (not new cells — but worth having written down)

### 7.1 A, run by a collaborator on another machine

Identical to A with `<AHQ'>` (their install path, possibly a different Node version prefix). Their CLI
hands `$2 = <AHQ'>`; Build 2's symlink points at *their* install; the committed `pnpm-lock.yaml` pins
`typescript`/`commander`. No agentic-hq clone anywhere. This is the mechanical half of the parent
brief's acceptance scenario.

### 7.2 A or D via `npx agentic-hq …` instead of a global install

Same as A/D with `<AHQ>` = the npx cache path (e.g. `~/.npm/_npx/<hash>/node_modules/agentic-hq`).
Discovery, `$2`, the runner and Build 2 all use that path. In D the upward walk for `commander` reaches
the cache's `node_modules` where it is a sibling — the layout AHQ-198's postinstall already handles.

### 7.3 cwd = the agentic-hq clone itself, run with the clone (C from inside `<repo>`)

The user's workspace *is* the AHQ package. `WorkspaceImpl.isAhqPackage()` dedups (the plugins are not
registered twice, `--plugin-dir` flags are emitted once). Every workflow is found under the AHQ package
root → wrapper's mode `build-first`; `<io-dir>` lands under `<repo>/.agentic-hq/temp/…` (as it does for
this very AHQ-201 run). Otherwise identical to C.

### 7.4 npm-installed agentic-hq, run from inside a *clone* of agentic-hq (the AHQ-205 shape)

Two `add-feature`s are discovered: the local workspace copy (`<clone>/.agentic-hq/plugins/…`) and the
shipped one (`<AHQ>/.agentic-hq/plugins/…`). Per AHQ-205, **first registration wins and the local
workspace is walked first**, and the CLI's `--plugin-dir` order also puts the local plugin first. So the
*local* copy runs, and — being found under the user's workspace — its mode is `build-first`: Build 2 runs
in `<clone>/…/add-feature/ts-workflow/` with `node_modules/agentic-hq → <AHQ>` — i.e. **the clone's
workflow *source* builds and runs against the npm-installed framework**, not the clone's framework
source. That is the consistent outcome of the two rules ("the workflow is source; the framework that
launched it is the npm one") and of the design's first principle — *which artifact you invoked IS the
truth*: the framework you get is always the one whose binary you ran. Anyone who wants a workflow in
their AHQ clone to run against that clone's framework code runs that clone's `agentic-hq` (→ C / 7.3),
not an npm-installed one. Not a surprise; just the rule.

### 7.5 A user workflow copied into the AHQ clone's plugins directory

It is then found under the AHQ package root, so it inherits the wrapper's mode and behaves exactly like
a bundled workflow (C in the clone; and it would ship as D if `build-release.cjs` staged it). Location
is identity.

### 7.6 Future: a plugin installed from a registry (AHQ-203 territory — not in scope)

A third root ("installed plugins") whose workflows are releases → the CLI would pass `prebuilt`, the
runner would just run the plugin's shipped `dist/`, and the framework would be resolved the standard npm
way (a declared peer dependency, or the runner telling Node where the framework is) rather than by
self-reference. The SKILL.md template, runner contract and Build 2 are unchanged in that future — only
the "how does a prebuilt *third-party* workflow find the framework" mechanism is added (doc 01 §7).

## 8. Why we kept all four variables (the record of the "can we ditch any?" review)

On 2026-08-18 the human asked whether the variables could be made simpler or one or two ditched. Each
was examined; the outcome is **keep all four, exactly as they are**. The reasoning, per variable:

### `--build-mode` — keep (never in doubt)

It is the one fact the runner cannot know structurally: *is this workflow source or release?* Every way
of deriving it inside the runner is either detection (is `dist/` present? is the dir writable? are the
install files stripped?) — which reintroduces the silent-stale-build risk the whole design exists to
retire — or a path-containment heuristic ("outside my package ⇒ source") that makes the runner
second-guess an explicit parameter and adds path-normalisation fragility. The CLI knows the answer
(which root it found the workflow under) and hands it down as `$1`. Kept.

### `--workflow-dir` — keep (never in doubt)

The other fact the runner cannot know: *where is the workflow?* Only the SKILL.md knows its own
`skill-base-dir`. Making the runner infer it from cwd (`cd` first in the SKILL.md) was rejected because
the workflow *program's* cwd must remain the user's workspace (io marshalling dirs and user-workspace
plugin discovery both hang off `process.cwd()`), and cwd tricks are exactly the hidden context the
design bans. Kept.

### `--ahq-package-root` on the runner — considered ditching, kept

The runner is `<root>/scripts/run-workflow.cjs`, so it *could* derive the root from its own location
(`__dirname/..`), the technique both bin wrappers use where the value is born. But: (1) it would remove
the variable from **one hop out of six** — the wrapper, CLI, `$2` relay, program and command hops all
keep it, and the SKILL.md must still use `$2` to *find* the runner — so the gain was one token in the
template; (2) it would make the runner treat its two chain inputs asymmetrically (mode passed, root
derived), mid-chain, for no functional benefit; (3) the runner's options are effectively a public
contract copied into users' SKILL.md files, so a later need to pass the root again (e.g. a runner not
co-located with the framework) would mean a compat shim; (4) the runner integration test points the
runner at a fake root via this option. The human's verdict: "we are keeping it for almost all of the
chain, just ditching it in one link — that's not really gaining much." Kept, passed explicitly at every
hop like `build-mode`.

### `--workflow-js` — considered ditching, kept

It could be removed by fixing the entry filename by convention (`src/cli.ts` → `dist/cli.js`), which is
idiomatic in JS (`index.js`, `main.ts`, `page.tsx`, agentic-hq's own `src/cli/main.ts`) and would have
made the SKILL.md byte-identical across all workflows and removed the `--using` "rename the CLI file"
step. The human vetoed it for a concrete daily reason: **VS Code Quick Open ranks filename matches
first**, so typing `add-feat` lands directly on `add-feature-cli.ts`; with every entry file called
`cli.ts` the CLI file for a given workflow is buried among path matches. Descriptive filenames stay,
so the SKILL.md names the file. The scaffolder already knows how to set that one token (it rewrites the
CLI filename in `SKILL.md` on `--using` copies today). A middle ground — keep descriptive names but fix
the *suffix* (`*-cli.ts`) and have the runner run "the single `dist/*-cli.js`", failing loudly on zero
or several — was noted as available but not adopted: explicit is simpler to explain. Kept.

### Further cuts examined and deliberately not taken

- **Stop forwarding `build-mode` into the workflow program.** Nothing past the runner acts on it (the
  program only relays it to commands, which ignore it), so `DefaultWorkflowRuntime` could shrink to one
  parameter. Not taken now: it churns the AHQ-197 chain (`AhqRuntimeParams`, `DefaultAhqCommandLine`,
  `ClaudeCommandBuilder`, tests) for conceptual tidiness only. Noted as a possible later clean-up.
- **Remove `$1`/`$2` from the SKILL.md entirely**, either by having the CLI append `--build-mode` to the
  returned command (reverses the parent brief's Q8 answer, where the human chose the
  AI-relays-verbatim model) or by making the runner a CLI subcommand invoked as `agentic-hq …` (relies
  on PATH resolving to the *same* install inside the spawned shell — fragile with nvm/npx — and hides
  the values the human wants visible). Not taken.

**Net:** the chain variables remain exactly the two the parent brief established (`build-mode`,
`ahq-package-root`); the runner adds two runner-local options (`--workflow-dir`, `--workflow-js`) that
replace today's single package-relative `--workflow-js`; nothing new flows through the chain.

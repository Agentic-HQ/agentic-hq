# AHQ-201 — Four Questions And Answers About The New Build Architecture

> Asked by the human on 2026-08-17, during the Researcher stage of the AHQ-201 `add-feature` run,
> after the two-separate-builds design in
> `01-new-two-separate-builds-architecture-design.md` had been explained. Answers by the AI
> (Claude Fable 5, the Researcher). Questions are quoted verbatim; answers are as given, lightly
> tidied for reading. Terms: `<AHQ>` = an npm-installed agentic-hq package directory; `<repo>` = the
> cloned agentic-hq repository; "Build 1" = the framework build; "Build 2" = the workflow build.

## Question 1

> Do you think this is the best architectural design, especially given users will want to release
> to npm their workflows?

**Answer:** It is the right architecture **for now, and the largest honest step toward the true
end-state without a repo re-architecture.** Separating the two:

- **The end-state** for "users publish workflows to npm" is what AHQ-203 already names: a
  workflow-bearing plugin is a real npm package with its own manifest and build, declaring agentic-hq
  as a normal (peer) dependency, resolved by standard `node_modules` rules — the idiomatic npm plugin
  model (eslint/vite plugins work this way).
- **What this design gets right relative to that end-state:** every workflow already has one layout,
  one build script, one `SKILL.md`, its own compiled `dist/`, and a runner that only knows "build this
  workflow dir if build-first, then run its dist". A plugin author's release build is literally "run
  Build 2 per workflow, ship the tree" — the same recipe agentic-hq's own release uses. All of that
  carries over to AHQ-203 unchanged.
- **The one deliberately temporary piece:** how a *prebuilt* workflow's JS finds the framework. Inside
  the agentic-hq package the design uses Node's package self-reference (already proven by AHQ-196) —
  but that only works for workflows *inside* the agentic-hq package. A third-party plugin release will
  resolve agentic-hq the standard way (a declared peer dependency, or the runner telling Node where the
  framework is). That is a contained, well-understood swap later; nothing else moves. There is a
  uniform-now alternative — the runner registers a small Node resolve hook mapping `agentic-hq/*` to
  `--ahq-package-root` for every run — which would already cover third-party releases, but it is one
  more moving part and better left out of this ticket. Both keep the `SKILL.md` and layout identical.

One genuinely good property of the runner-made symlink for *source* workflows: the workflow always runs
against **the framework that launched it** — no version skew, no second node-pty build. Peer
dependencies are the npm world's approximation of exactly that.

So: yes, build this. The only place to stop short of calling it "final" is the
resolution-in-third-party-releases piece, and that is AHQ-203's problem by design.

## Question 2

> Also: is it still quite simple and not **tooooo** much work to do now...?

**Answer:** Simple to *explain*: two builds, two owners; one workflow shape; `build-mode` = the mode of
the workflow you're launching. That is the whole mental model.

Work, honestly: **moderately more than the minimal "old pattern + tsx" route — roughly 1.5–2×** — and
nearly all of the extra is in one bounded, non-interactively-testable place (the build/runner refactor):

- Framework build emits `dist/` + `.d.ts` at repo root; root `exports` → dist (with a `types` condition
  → `.ts` for live IDEs); the dev wrapper builds then runs; the release build copies `dist/` and loops
  Build 2 over the bundled workflows, stripping their install files.
- New `build-workflow.cjs` (~40 lines) + runner change (`--workflow-dir`, no framework build, no
  `release/` execution).
- The CLI passes a per-workflow build-mode (one small class change + tests).
- Then the same work the minimal route needed anyway: five workflows migrated (two with command-file
  renames), the scaffolder rewritten (the biggest editing job either way — and *simpler* under this
  design because there is one template), tests, publish.

What it *avoids*: doing the five migrations + scaffolder twice (once now on the old pattern, again
under AHQ-203) — the human's own "each design change once" rule.

## Question 3

> Also please show me (again) the end to end run for a user running my-custom-workflow in
> my-workspace where they are using the npm installed agentic-hq CLI - with this new design. I
> especially want to understand where the (a) Agentic HQ source code is being built from -> to (b)
> where the workflow typescript source is being built from and put to (the directory).

**Answer:** Two trees, with where each thing is built from → to:

```
<AHQ> = ~/.nvm/versions/node/v24.15.0/lib/node_modules/agentic-hq/   (read-only release tree)
  package.json                       exports: agentic-hq/tools/claude-code → ./dist/src/tools/…/index.js
  bin/agentic-hq-prebuilt.cjs
  scripts/run-workflow.cjs, scripts/build-workflow.cjs
  dist/src/**/*.js + *.d.ts          ← (a) FRAMEWORK: built from src/ in the maintainer's clone at
                                          PUBLISH time → <clone>/dist → release/dist → tarball → here.
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
        src/my-custom-workflow-cli.ts        ← (b) WORKFLOW: built FROM here…
        dist/my-custom-workflow-cli.js       ← …TO here (same ts-workflow dir; gitignored)
        node_modules/{typescript, commander, agentic-hq → <AHQ>}   (generated; gitignored)
```

The run, `cd ~/dev/my-workspace && agentic-hq my-custom-workflow -- --ticket-id=X`:

1. Shell → `<AHQ>/bin/agentic-hq-prebuilt.cjs` → inserts `--build-mode=prebuilt --ahq-package-root=<AHQ>`
   → runs `<AHQ>/dist/src/cli/main.js`. (Framework: nothing to build.)
2. CLI discovers workflows under `<AHQ>/.agentic-hq/plugins` and `~/dev/my-workspace/.agentic-hq/plugins`;
   finds yours **under the workspace → its mode is `build-first`**.
3. CLI starts a Claude session, runs your `SKILL.md` with `$0`=io-dir, `$1`=`build-first`, `$2`=`<AHQ>`.
4. `SKILL.md` writes the launch command (template, no thinking):
   `node "<AHQ>/scripts/run-workflow.cjs" --ahq-package-root="<AHQ>" --build-mode=build-first --workflow-dir="…/my-custom-workflow/ts-workflow" --workflow-js=dist/my-custom-workflow-cli.js`
5. CLI executes it (+ `'--ticket-id=X'`), cwd = `~/dev/my-workspace`.
6. **Runner, build-first → Build 2 on `--workflow-dir`:** `pnpm install` (typescript, commander — no-op
   after first run) → `node_modules/agentic-hq → <AHQ>` symlink (from the explicit `$2`) → `tsc` compiles
   `src/my-custom-workflow-cli.ts` → `dist/my-custom-workflow-cli.js`, typechecked against
   `<AHQ>/dist/**/*.d.ts` through the symlink. Everything written stays inside *your* `ts-workflow/`.
7. **Runner runs:** `node …/ts-workflow/dist/my-custom-workflow-cli.js --build-mode=build-first --ahq-package-root=<AHQ> --ticket-id=X`.
   The `import 'agentic-hq/tools/claude-code'` resolves through the symlink to `<AHQ>/dist/…`; the
   framework's own deps load from `<AHQ>/node_modules`. Your program calls
   `tool.execute('/my-plugin:my-custom-workflow:01-…')` per command → Claude sessions → done.
8. Next run: install no-op, symlink idempotent, tsc ~1–2 s → always fresh compiled code from your
   current source.

Collaborator with their own `<AHQ'>`: identical; step 6's symlink points at `<AHQ'>`. No clone anywhere.

## Question 4

> And finally (!) one extra bit explaining what happens when they are using the agentic-hq that is
> running from the cloned repo (I'm guessing here that when they run the workflow it will cause an
> automatic complete rebuild of Agentic HQ source, which then gets used to run the workflow, which is
> also rebuilt from scratch, but in their my-workspace directory somewhere?)

**Answer:** The guess is right, with the exact locations. `<repo>` = `~/dev/agentic-hq/agentic-hq`, on
PATH via `npm link`.

1. Shell → `<repo>/bin/agentic-hq.cjs` (dev wrapper). **It first builds the framework: `<repo>/src/` →
   `<repo>/dist/` (JS + `.d.ts`)** — every invocation, so dev always runs code compiled from the current
   source (incremental tsc keeps this ~1 s; output identical to a clean build). Then it runs the CLI with
   `--build-mode=build-first --ahq-package-root=<repo>` — recommended to run the compiled
   `<repo>/dist/src/cli/main.js` rather than tsx, so even the CLI is byte-identical to production
   (subsequently decided — brief Q6(b); today the dev CLI runs via tsx).
2. Discovery: `<repo>/.agentic-hq/plugins` (bundled → mode `build-first`, i.e. the wrapper's) and
   `~/dev/my-workspace/.agentic-hq/plugins` (workspace → `build-first`).
3–5. Identical to Question 3, with `$2 = <repo>`.
6. Build 2 in `~/dev/my-workspace/…/my-custom-workflow/ts-workflow`: install → symlink
   `node_modules/agentic-hq → <repo>` (whose `exports` → `<repo>/dist/*.js`; `types` → `src/*.ts`, so
   IDEs and tsc see live source types) → tsc → `…/ts-workflow/dist/` **inside my-workspace**. Framework
   code used at run time = `<repo>/dist`, freshly built in step 1.
7. Run — same as Question 3.

Two supplementary points:

- **Running a *bundled* workflow with the clone** (e.g. `agentic-hq reversal`): exactly the same, except
  the ts-workflow dir is `<repo>/.agentic-hq/plugins/…/string-reversal/ts-workflow/` — its `dist/` and
  `node_modules/` live there (gitignored). Bundled and custom workflows are indistinguishable to the
  runner.
- **`release/` becomes publish-only.** `pnpm build` = framework build → `dist/` + Build 2 for each
  bundled workflow + stage `release/` (framework dist, bin, scripts, plugins with their `dist/` and
  *without* their install files, generated manifest) → `cd release && pnpm pack` → publish. Dev runs
  never execute out of `release/` any more.

So: **(a) framework** — from `<repo>/src` to `<repo>/dist` (dev, every invocation) or, on user
machines, never built — it arrives prebuilt in `<AHQ>/dist`. **(b) workflow** — from
`<its own>/ts-workflow/src` to `<its own>/ts-workflow/dist`, by the same script, wherever it lives,
whenever build-first.

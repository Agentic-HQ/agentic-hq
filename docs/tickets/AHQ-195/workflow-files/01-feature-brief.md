# AHQ-195 — Feature Brief

> **Note:** This is a reorganised version of the original working brief, which had grown out of
> order as updates and responses accumulated. The original — including superseded AI
> recommendations and the full Gemini notes — is preserved at
> `LEGACY/01-feature-brief.md.OLD_MESSIER_VERSION`.

## One Sentence Outcome

Anyone can try or install Agentic HQ straight from npm (`npx agentic-hq …` / `npm install -g agentic-hq`) with no cloned repo, no pnpm, and no runtime installs — running the same prebuilt, read-only artifact that contributors' dev mode rebuilds byte-identically on the fly.

## User Story

**As a**: developer who's heard about Agentic HQ  
**I want:** to try it with a single npx/npm command  
**So that:** I can run real workflows within minutes, without cloning or building the repo

## Human Prompt

Publish the agentic-hq tool to npm so people can:

- Try it using npx (without installing it)
- Install it using npm and then run it using the usual "agentic-hq" cli

### Context

This is being done now because of the following feedback from a friend in email about Agentic HQ, which currently can only be run by cloning the repo and following a set of installation instruction:

*"Also, it's probably worth making a distinction between users who might want to play with / extend / contribute the source code and users who might naturally expect to be able to use it as an off-the-shelf tool without actually cloning the repo. So to this end, I would have thought you could lower the friction a bit by publishing the built tool to npm, so that users can install / run it as a tool like that. Anything which makes an Installation section of a project Readme smaller (or indeed help provide a separate Quickstart section) generally helps encourage more devs reading docs to actually try something out."*

I agree. We want to make **trying** the tool a lot easier. People should just be able to try it very quickly by running:

```
npm install -g agentic-hq
cd my-workspace-dir
agentic-hq add-feature -- --ticket-id=PROJ-123
```

*[Editor's note: the original prompt also included Gemini-generated notes on npx/npm mechanics.
Summary: both `npx agentic-hq …` and `npm install -g agentic-hq` work once the package is
published, provided `package.json` has a `bin` entry pointing at an entry file with a
`#!/usr/bin/env node` shebang — both of which this repo already has. Full text in the LEGACY
copy.]*

### Additional Notes From Human About Complexities In This Task

There's quite a lot of complexity to this, so I'd like a reasonable amount of research done before deciding whether and how to split out sub-tasks. As it's quite complex and there's quite a lot of technology involved, I'm thinking it may be good to have some spike investigations as part of the research. You try things out in temp directories or in AHQ workspace, then roll back, to see if they work, just to get feedback before trying things properly in the tasks. The complexity I'm thinking of is the workflows and how they are stored and run. Currently a user can change directory into their dev workspace and run the agentic-hq CLI, which is added to the path, and they have the abililty to run all of the "demo" and "core" workflows that are stored in the main Agentic HQ workspace elsewhere on their disk. This is done by agentic-hq starting up Claude CLI with the paths to the plugins added on the Claude CLI command line manually. Getting this all so it works **without** having the cloned repo on disk is going to be challenging.

My original idea on how this was going to work was that the user would "install" my demo and core workflow plugins using the Claude Code Marketplace. Plugins in the marketplace can be installed by the user on their laptop, and then all the skills that are part of that plugin are then available. When those Skills run they have access to the bundled docs and commands and scripts, which are all part of the Plugin. It's not simple though. It's likely that would be the best way of doing all this. Not sure if there's a good alternative? I don't think I can see a way of having the workflows downloaded and accessible from Claude code if they're installed by NPM.

What I'm really kind of saying is that this is a very non-trivial task. It sounds very easy because it's all working now. We just want to make it so people can run it and install it from NPM. Sounds simple, but it's not. Over to you...

## My Understanding of This Task

Make Agentic HQ installable and runnable from npm (`npx agentic-hq …` and `npm install -g agentic-hq`) so people can try it without cloning the repo — replacing today's clone → `pnpm install` → `npm link` installation path for "just try it" users, while keeping the cloned-repo path for contributors. Research showed the feared "how do workflows get onto the user's disk?" problem has a clean answer with no Marketplace step needed: the entire runtime chain resolves every path relative to the package's own root, and `npm pack` already includes `.agentic-hq/plugins/` — so the npm-installed package directory can simply *be* the **`ahq-package-root`** (the explicit parameter that, per Questions 9 and 10, supersedes the misnamed `AGENTIC_HQ_WORKSPACE_ROOT` env var — details in Research Findings).

The target model — arrived at through Human Updates 1–3 below and **confirmed by the answers to all ten Questions** — is a **prebuilt, read-only artifact**: a publish-time build compiles the CLI and all shipped workflow programs to JavaScript (Q2, Q6); shipped plugins travel inside the npm package, no Marketplace step (Q1); a centralized runner script shared by all skills launches workflows, and nothing is ever installed or written inside the package directory at runtime — end users need neither pnpm nor corepack (Q3, Q6). Dev/prod parity is guaranteed by dev mode running the *same* shared build on the fly and executing byte-identical output. Two explicit parameters — never environment variables — flow visibly through the whole chain: **`build-mode`** (`build-first` | `prebuilt`), required with no default (Q7), crossing the Claude/skill hop as an opaque pass-through the AI relays but never interprets (Q8); and **`ahq-package-root`** (Q9), used by all *new* code from day one while legacy readers keep the env var until the final zero-change refactor eliminates it (Q10 — see "Final Refactor Stage" below). Publishing is manual for v1 (Q5). The task is confirmed too large for one run and will be split, starting with a tracer-bullet spike (Q4).

## Research Findings

### How the runtime chain works today (all paths package-root-relative)

1. **`bin/agentic-hq.cjs`** (the `bin` entry in `package.json`, shebang already present) sets `process.env.AGENTIC_HQ_WORKSPACE_ROOT = path.join(__dirname, '..')` — i.e. *the package's own root* — then runs `node_modules/.bin/tsx src/cli/main.ts`. There is **no build step**: the CLI runs TypeScript source via tsx.
2. **Workflow discovery** (`src/workflow-discovery/workspace/*.ts`) scans two workspaces for `.agentic-hq/plugins/*` — the AHQ workspace (from `AGENTIC_HQ_WORKSPACE_ROOT`) and the user's current directory.
3. **`ClaudeCommandBuilder`** (`src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts`) launches the `claude` CLI with one `--plugin-dir=<abs path>` flag per discovered plugin, plus `--allowedTools=…` including `Read(<ahq-root>/.agentic-hq)`.
4. The workflow's **SKILL.md** (e.g. `add-feature`) returns a launch command via file-IO marshalling: `cd {skill}/ts-workflow && pnpm install && ln -sfn "$AGENTIC_HQ_WORKSPACE_ROOT" node_modules/agentic-hq && tsx … <workflow>-cli.ts`. The ts-workflow's `package.json` depends on `"agentic-hq": "link:../../../../../.."` — six levels up, the package root *in any install location*.
5. The ts-workflow program imports `agentic-hq/tools/claude-code` — served by the root `package.json` `exports` map, which points at **`.ts` source** (works because ts-workflows run under their own `tsx` dependency).

**Implication:** nothing in the chain hardcodes "the cloned repo" — it hardcodes "the directory the package lives in". A tarball containing `bin/`, the built code, and `.agentic-hq/plugins/` is structurally identical to the cloned repo minus dev files.

### Spike results (read-only, performed during research)

- **npm name:** `agentic-hq@0.0.1` already exists on npmjs.org, owned by `halso` (published 2025-08-11 as a placeholder "first test package") — **the name is already yours**; publishing is an update, not a new claim.
- **`npm pack --dry-run` (works despite `private: true`):** 732 files, 1.7 MB tarball / 5.8 MB unpacked. It **does include** `.agentic-hq/plugins/` (131 files — dot-directories are packed by default) and **auto-excludes** all `node_modules`. But it also includes things that must not ship: `tests/` (the bulk of the file count), `steve-test-plugin` (15 files), vitest configs, and the root `.npmrc` whose pnpm-only `frozen-lockfile` key makes npm print a warning on every command.

### Blockers / gaps that remain to address

1. **`"private": true`** blocks `npm publish`; no `files` whitelist and no `prepublishOnly` safety net exists. *(Packaging sub-task.)*
2. **`node-pty`** (pinned, native): compiles from source on Linux at install time → `npm install -g agentic-hq` on Linux needs `build-essential`/Python (already a documented repo prereq; becomes a *tool-user* prereq too). *(Docs sub-task.)*
3. **Prereq on `claude` CLI** being installed/authenticated remains regardless of install method.
4. **Docs:** README currently has one clone-based Installation section; the friend's feedback asks for a low-friction Quickstart (npm/npx) vs contributor (clone) split. *(Docs sub-task.)*

*(Two further blockers found in the initial research — `tsx` being a devDependency the bin wrapper
needs at runtime, and workflows running `pnpm install` inside the installed package — were
dissolved outright by the prebuilt read-only artifact decision; see the Update 1 response. A
suspected third — the command-input/output temp files possibly being written inside the installed
package — was checked and cleared: `composition-root.ts:41–43` writes them under the user's
current project directory, so it just works.)*

### Existing assets that help

- All four plugins already have `.claude-plugin/plugin.json` manifests (marketplace-shaped, if that route is ever wanted later).
- Cross-workspace e2e tests exist (`tests/e2e/demo/cross-workspace-*.e2e.test.ts`) proving the "run from another directory" model — a template for "run from an npm-installed copy" tests.
- `bin/agentic-hq.cjs` already has the `#!/usr/bin/env node` shebang and correct `bin` mapping.

## Human Update 1 — Ship a prebuilt read-only artifact instead? (from chat)

*"I'm halfway through reading this, and I've got a little bit of a question. It seems like there may be some complexity around the idea that we ship the workflows inside the tarball that lands on the user's machines. When those workflows are run, they actually have to compile and run inside that directory, which then changes that directory. This sounds like something that's very non-standard, and maybe we should avoid it. I don't know."*

*"I'm wondering whether it's actually the correct thing to do to create a build tarball that includes compiled versions of all the workflows, and we stop that then becoming a read-only artefact. Does that sound like maybe the correct way of doing this versus the kind of hacky way we're looking at now?"*

### AI Response to Update 1

The instinct is assessed as **correct**: mutating an installed npm package at runtime is
non-standard and fragile — the global prefix may be root-owned; the npx cache is ephemeral (any
runtime install is throwaway and repeated per run); pnpm-based global installs use a
content-addressed store with hard links, where in-place mutation can corrupt shared state; and
mid-workflow install failures are far more confusing to users than install-time failures.

A **publish-time build producing a read-only artifact** dissolved two of the research-phase
blockers at once: the runtime-`tsx` problem (tsx was a devDependency the bin wrapper needed at
runtime) disappears when the main CLI is compiled too, and the runtime-`pnpm install`
problem disappears entirely for shipped plugins — a compiled workflow's only third-party import
(`commander`) resolves by Node's normal upward `node_modules` walk to the package root's own
dependencies, so no per-workflow install is needed at all. The one build-time problem to solve is
the `import 'agentic-hq/tools/claude-code'` specifier in workflow programs (options: rewrite to
relative paths at build time, bundle each workflow, or drop the nested `package.json` from the
shipped copy so Node package self-reference applies) — exactly what the tracer-bullet spike should
prove.

Costs acknowledged: a build pipeline where none exists; the shipped SKILL.md launch commands change;
and the create-workflow scaffolder embeds the current command template. **User-authored workflows in
the user's own workspace keep the current mutable tsx/pnpm model** — the read-only constraint
applies only to the shipped artifact. (How dev mode relates to the built artifact was settled by
Update 2: dev runs the same build on the fly — there are *not* two long-lived execution models for
shipped workflows.)

## Human Update 2 — Dev/prod parity, explicit parameters, shared runner script

I've read through the document, and it looks good. My only concern is that this is going to involve a lot of changes. And it would be good to handle that as well as possible. My other concern is that if we create two different routes, things go down depending on whether you're in dev mode or in production mode. One where you're running already-built JavaScript and the other where you're building it on the fly. I want that to be handled really well. And I want it to do exactly the same thing when you're in dev mode as happens in production mode. I want it so that when you run a workflow in dev mode, it basically, on the fly, automatically does the build and produces the byte-identical JavaScript that you would end up with in production. That way, a dev will always be guaranteed to get exactly what someone who is running the code in production gets. Now, I don't want this controlled using hidden environment variables because I hate that, because they can just pop up anywhere. They're hidden, and it's not explicit in the code where they're coming from or how they get passed. I don't like that at all. I want explicit variables that pass through the whole chain explicitly and are visible and are not environment variables. They are command-line parameters to CLIs. They are method parameters in JavaScript, and they are completely visible. This is a system for developers, written by developers and worked on by developers. It's fine to have things related to whether it's running in a dev environment or running in a production environment visible throughout the programme. I also want this to be as simple as possible. For example, when the skill runs and tries to run the code, it needs to run the same code and pass in the parameter that tells it whether it is production or test. The AI shouldn't know anything about whether it's running production or dev.

The script that it's calling should be a generic script that then controls deterministically whether a build gets done and the results of that build are run (which is what happens when it's in dev mode), or whether, if you're in production mode, obviously you don't need to do the build. You just run the built artefact. This needs to be in a centralised script that's shared amongst all of the different skills. Now, we don't have to do this right now, but there's another change I want to add, bolted on at the end, and that's the agentic-hq workspace variable name. This is currently an environment parameter that's one of these horrible hidden-away parameters that disappears and then reappears and gets used. I want that gone, and I want it replaced with a parameter that is entirely visible throughout the system and explicit, not hidden away, not an environment variable. And as we are having this discussion, it's becoming very clear that this thing that we used to use, this environment variable for an agentic-hq workspace, is now no longer the workspace. It's actually the root of the build artefact, or the root of something. We shouldn't try and do too much in one go, so let's refactor this at the end, but remember it as something to do. I think it should probably be refactored in a stage where we are changing nothing else and everything else is working. So let's park the environment variable rename for the agentic-hq workspace, but bear it in mind. Let's discuss now the really important thing, which is how to get this system so that it's controlled based on whether you're running in dev mode or you're running the production deployed version of it. We should get the naming around that accurate first and think about that. Let's think about what the standards are for doing this, and let's think about how to name this variable and its values. Also think about how to name the variable and where it will flow.

### AI Response to Update 2

**Parity model.** Both modes run the same built JavaScript — dev mode simply runs the
(deterministic, byte-identical) build first, then executes the same artifact production users get.
One shared build script (used by both the publish step and dev-mode runs — single source of truth)
is what makes "byte-identical" achievable: tsc/esbuild produce identical output for identical
inputs, config, and tool versions. The tracer-bullet spike should verify determinism (build twice,
compare hashes).

**Parameter-flow requirements (from the human, binding):**

- No hidden environment variables. The mode is an **explicit, visible parameter** everywhere: a
  literal in each entry point, constructor/method parameters through the TypeScript, and a
  command-line parameter to the shared runner script.
- The mode's value originates **structurally, not by detection**: the repo's dev entry point passes
  the dev value; the *build-generated* published entry point passes the production value. Which
  artifact you invoked is the truth — nothing sniffs the filesystem or environment to guess.
- **One centralized runner script shared by all skills** replaces every per-SKILL.md command blob.
  It deterministically either builds-then-runs (dev) or just runs the built artifact (production).
- **The AI/skill passes the mode value on without interpreting it** — per the Question 8 answer,
  the AI may *see* the value (it relays it verbatim, like the io-files directory today), but must
  never think about it or change behavior based on it; only the shared runner script acts on it.

**Naming research (standards reviewed):** `NODE_ENV=development|production` (env var — excluded;
also connotes *behavioral* differences, the opposite of the parity guarantee); Vite/webpack
`--mode development|production` (CLI-visible, but describes *different build outputs* — ours are
identical); Cargo `dev`/`release` profiles and C++/.NET Debug/Release (different optimization
artifacts — again ours are identical). The closest true analog is `cargo run` (build-if-needed,
then run) vs running a released binary — where the difference is *which entry command you invoked*,
not an environment. Conclusion: name the parameter for the **one behavior it controls** (build
before running, or not), not "dev/prod environment" — see Question 7.

**Where it flows:** (1) entry points, as baked literals; (2) through the TypeScript as
constructor/method parameters; (3) across the Claude/skill hop as an opaque pass-through argument
the skill embeds verbatim in the shared-runner invocation (Question 8); (4) terminus: the shared
runner script, the only code that acts on it.

## Human Update 3 — About Replacing AGENTIC_HQ_WORKSPACE_ROOT Now

I really like your build-mode={build-first|prebuilt} naming and plan. Especially that it's self documenting, and I like your plan for passing it through the whole chain. I'm wondering whether we should think about just creating a new variable *now* to supercede AGENTIC_HQ_WORKSPACE_ROOT which flows along with it, and is named equally well (self documenting). What actually *is* AGENTIC_HQ_WORKSPACE_ROOT used for, and what will it point to (sementically) once we are doing this new build -> run system?

### AI Response to Update 3

Verified usage inventory (live code only; the many `docs/jira-docs/` hits are historical records):

- **Set in exactly one place:** `bin/agentic-hq.cjs` sets it to the package's own root (parent of
  `bin/`).
- **Read 1 — `AhqWorkspaceImpl.getRoot()`** (`src/workflow-discovery/workspace/ahq-workspace-impl.ts:44`,
  env var ?? `process.cwd()`): the root from which the CLI derives (a) shipped-plugin discovery
  (`{root}/.agentic-hq/plugins/*` → the `list` command and workflow registry), (b) the
  `--plugin-dir` flags for Claude launches, and (c) the `Read({root}/.agentic-hq)` allowedTools
  grant.
- **Read 2 — `WorkspaceImpl.isAhqWorkspace()`** (string equality with the env var): dedup guard so
  that when the user runs the CLI *from* the AHQ root itself, its plugins aren't registered twice.
- **Read 3 — 7 SKILL.md launch commands** (shell `$AGENTIC_HQ_WORKSPACE_ROOT`):
  `ln -sfn "$AGENTIC_HQ_WORKSPACE_ROOT" node_modules/agentic-hq` — locates the agentic-hq *package*
  so ts-workflow imports resolve. **This use disappears entirely under the prebuilt model.**
- **Read 4 — 3 ts-workflow CLI programs** (add-feature, add-feature-detailed-example,
  create-workflow): read the env var and pass it into their Command 01 input as
  `agentic-hq-workspace-root-dir`, which the command .md files use to locate plugin-bundled help
  docs and skills dirs.
- **Read 5 — create-workflow scaffolding templates** embed the same patterns into newly scaffolded
  workflows.
- Plus: 2 dev docs describe it; 5 unit test files exercise it.

**What it means today:** one variable conflating three roles — "where the shipped plugins live"
(Reads 1, 4, 5), "where the agentic-hq package resolves from" (Read 3), and "workspace identity for
dedup" (Read 2).

**What it points to semantically under the build→run model:** *the root directory of the
agentic-hq package as currently executed* — in production the npm-installed package directory; in
dev the repo checkout (or its built package image — a Planner decision on strict parity). The
module-resolution role (Read 3) vanishes; the remaining roles are all "locate things inside the
agentic-hq package" plus the dedup identity check. It is genuinely **no longer a "workspace"** —
the user's workspace is a separate, already-distinct concept (`CurrentUserWorkspaceImpl`).

Naming and introduction timing are Questions 9 and 10. Note: the REFACTOR comment in
`bin/agentic-hq.cjs` (lines 17–23) already flags this exact env var as needing this exact
treatment.

## Final Refactor Stage — Eliminating AGENTIC_HQ_WORKSPACE_ROOT (zero functionality change)

Confirmed by Questions 9 and 10: the env var's successor is **`ahq-package-root`** /
**`ahqPackageRoot`**, introduced **now for all new code**, with the env var eliminated in an
**isolated final refactor stage**. The stage design:

**The transition state (deliberate, in place until the final stage).** Both mechanisms coexist:

- The entry points **dual-write**: they pass `ahqPackageRoot` explicitly into the new chain
  (`app.run(…)` parameters → constructors → shared-runner `--ahq-package-root=…`) *and* keep
  setting `process.env.AGENTIC_HQ_WORKSPACE_ROOT` for the legacy readers.
- **New code** (build-mode chain, shared runner script, rewritten SKILL.md templates, build
  pipeline) reads **only** the explicit parameter — it is born clean and never touches the env var.
- **Legacy readers** (Reads 1, 2, 4, 5 in the Update 3 response: `AhqWorkspaceImpl.getRoot()`,
  `isAhqWorkspace()`, the three ts-workflow CLIs, the create-workflow scaffolding templates — plus
  their tests and the two dev docs) keep working **unchanged** off the env var.

This is what keeps churn near zero through the main feature work: no existing call site is touched
before the final stage, both worlds run green side by side the whole time, and every sub-task ships
against a stable system.

**The final stage (a pure, mechanical migration — removing the env var changes zero
functionality).** With everything already working via both mechanisms, the last stage only:

1. Threads `ahqPackageRoot` explicitly into each legacy reader (constructor injection replacing the
   env-var read), one class at a time, tests green after each.
2. Updates the ts-workflow CLIs and scaffolding templates to receive it as an explicit input
   (the Command 01 input string already carries it as `agentic-hq-workspace-root-dir` — that
   variable name is renamed to match).
3. Updates the five unit-test files and the two dev docs (`how-agentic-hq-works.md`,
   `project-design-requirements.md`).
4. Deletes the env-var write from the entry points and the constant definitions — at which point a
   repo-wide grep for `AGENTIC_HQ_WORKSPACE_ROOT` returns only historical `docs/jira-docs/` records.

Because every reader was already receiving the same value, each step is behavior-preserving by
construction; the full validation suite runs before and after, and the stage contains no other
changes of any kind. (The REFACTOR comment in `bin/agentic-hq.cjs:17-23` — which asked for exactly
this — is retired with it.)

## Web/Perplexity Research

No web/Perplexity research was required beyond two live npm-registry checks run locally: `npm view agentic-hq` (confirmed the name is already owned by `halso`, placeholder v0.0.1 published 2025-08-11) and `npm pack --dry-run` (tarball contents in Spike results). Naming-standards analysis (NODE_ENV, Vite/webpack modes, Cargo profiles) was done from local knowledge; no external lookup was needed.

## Questions And Answers

> Questions appear in their **current** form; recommendations superseded by Updates 1–3 have been
> removed (they are preserved in the LEGACY copy). Numbering is unchanged from the original
> document.

### Question 1

**Question:** For v1, should the demo/core workflow plugins be distributed *inside the npm package itself* (the installed package directory becomes the "AHQ root" — every runtime path already resolves relative to the package root), rather than via the Claude Code Marketplace?

**AI Recommendation:** Yes — ship plugins inside the npm package for v1. It requires no new distribution channel and no changes to the plugin-discovery/`--plugin-dir` model. Keep the Marketplace as a possible later feature (the plugins are already marketplace-shaped with `.claude-plugin/plugin.json` manifests), not a blocker for npm publishing.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 2

**Question:** Should the published package be **built to `dist/`** (a publish-time build, with `bin` and the `exports` map repointed at built JS) rather than shipping TypeScript source with `tsx` as a runtime dependency?

**AI Recommendation:** Yes — the build step (this is the packaging half of the prebuilt read-only artifact model; Question 6 covers the full model). Compiling everything removes both the runtime-`tsx` and runtime-`pnpm install` problems, at the cost of a build pipeline.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 3

**Question:** Do we confirm that under the prebuilt model, end users need **neither pnpm nor corepack** — compiled workflows need no runtime install at all, pnpm remains a *contributor-only* prerequisite, and user-authored workflows in the user's own workspace keep the current pnpm model (their directory is theirs to mutate)?

**AI Recommendation:** Yes — confirm that framing.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 4

**Question:** This looks too large for one add-feature run. Should the split start with a **Tracer Bullet sub-task** — `npm pack` the repo, install the tarball into a temp prefix (not global), and get `agentic-hq list` + the string-reversal workflow running from a clean directory with the cloned repo out of the picture — before any packaging/docs sub-tasks are locked in?

**AI Recommendation:** Yes. The tracer bullet validates the riskiest assumptions (installed-package-dir-as-AHQ-root, the prebuilt-workflow execution model, build determinism) for a few hours' work, and its findings will reshape the remaining sub-tasks far more cheaply than discovering problems mid-build. Note: actually running it means installing the tarball + registry deps into a temp directory — I'd ask before running that step, per your no-installs-without-approval rule.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

**AI Note (appended 2026-08-06, during the AHQ-196 Researcher stage):** the tracer vehicle was
subsequently fixed as **math-workflow** (not string-reversal) when the plan was revised to prove
the infrastructure on a non-interactive multi-command workflow — see `## Split Suggestion
(Accepted)` for the rationale.

### Question 5

**Question:** For v1, is the publish process itself manual (you run a documented `npm publish` checklist locally, as `halso`), with CI/GitHub-Actions-based release automation explicitly out of scope?

**AI Recommendation:** Yes — manual, documented publish for v1 (with `prepublishOnly` guard scripts so a bad publish is hard). Release automation is a separate feature once the package shape has settled.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 6

**Question:** Do we adopt the **prebuilt read-only artifact** as the target model — a publish-time build compiles the CLI and all shipped workflow programs to JS; shipped SKILL.md launch commands invoke the centralized shared runner script; the installed package directory is never written to at runtime; and dev mode achieves parity by running the *same* shared build on the fly and executing the byte-identical artifact (only user-authored workflows in the user's own workspace keep the current tsx/`pnpm install` model)?

**AI Recommendation:** Yes. It is the standard, robust shape for a published npm CLI, removes the runtime-install and runtime-tsx problems entirely, and confines the cost to a build pipeline plus the (deliberately minimized) build-first/prebuilt distinction. The tracer-bullet spike (Question 4) should validate this model specifically — including how the `agentic-hq/tools/claude-code` import is resolved in compiled workflows.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 7

**Question:** What do we name the mode parameter and its two values? Leading options: (a) name it for the behavior it controls — `build-mode` (CLI: `--build-mode=…`; TS: `buildMode`) with values **`build-first`** (dev: run the shared build, then execute the built artifact) and **`prebuilt`** (production: execute the built artifact as-is); (b) conventional naming — `mode` with values `dev`/`release` or `dev`/`prod`, familiar from Vite/Cargo but connoting *different artifacts or behaviors*, which contradicts the byte-identical parity guarantee.

**AI Recommendation:** Option (a): `build-mode` = `build-first` | `prebuilt`, and make it a **required parameter with no default** at every link in the chain (entry-point literal → constructor/method parameters → `--build-mode=…` on the shared runner script), so omission is a loud error rather than a silent wrong default. Naming the behavior rather than the environment makes the parity guarantee structural: nobody can later hang "dev-only behavior" off a parameter whose name only speaks about building, whereas a `dev|prod` flag invites exactly that divergence. *(Human Update 3 opens with "I really like your build-mode={build-first|prebuilt} naming and plan" — please confirm formally here.)*

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 8

**Question:** How does the mode cross the Claude/skill hop while keeping the AI ignorant of it: (a) the SKILL.md returns a mode-agnostic invocation of the shared runner script, and the TypeScript runtime — which holds the mode — appends `--build-mode=<value>` to the returned command before executing it (the AI never sees, relays, or interprets the value); or (b) the skill relays it verbatim as an opaque positional argument, like `$0` (the io-files directory) today?

**AI Recommendation:** Option (a). It literally satisfies "the AI shouldn't know anything about whether it's running production or dev" — the value never enters the AI's context — and it keeps SKILL.md templates one parameter simpler. Option (b) works but makes the AI a (blind) carrier of the value, one more thing a template edit could break.

**Human Answer ('Yes' means follow AI Recommendation):** Please don't take "the AI shouldn't know anything about whether it's running production or dev" fully literally. I'd expect it to have visibility into the value of build-mode, but it shouldn't have to **think** about that or how to behave based on it. It should just pass that value on...

**AI Note (acknowledged):** This selects **option (b)** — the skill receives the build-mode value as an opaque pass-through argument (alongside the io-files directory it already relays as `$0` today) and embeds it verbatim in the shared-runner invocation it returns (e.g. `--build-mode=$1`). The AI has visibility of the value but never interprets it or branches on it; only the shared runner script acts on it.

### Question 9

**Question:** What do we name the successor to `AGENTIC_HQ_WORKSPACE_ROOT`, given its post-build→run semantics — "the root directory of the agentic-hq package as currently executed" (production: the npm-installed package dir; dev: the repo checkout or its built package image)? Options: (a) **`ahq-package-root`** (TS: `ahqPackageRoot`) — npm-accurate and true in both modes; (b) **`ahq-artifact-root`** — pairs nicely with `build-mode`, but is only strictly accurate if dev mode points at the *built image* (undecided Planner detail), and is wrong if dev resolves plugins from the repo source; (c) `ahq-install-root` / `ahq-home` — "install" is untrue in dev, and `-home` has env-var (JAVA_HOME) connotations.

**AI Recommendation:** Option (a): `ahq-package-root` / `ahqPackageRoot`. It answers exactly the question every reader has ("where is the agentic-hq package I'm running?"), it is correct in both modes regardless of how the dev-mode plugin-source question lands, and — like `build-mode` — it names a *thing* rather than an *environment*, so it can't drift. Same flow rules as `build-mode`: explicit, required, no default, no env var.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 10

**Question:** When do we introduce the new variable: (a) **now, for all NEW code** — the build-mode chain, shared runner script, entry points, and rewritten SKILL.md templates carry `ahq-package-root` explicitly from day one (they all need this value anyway, and their templates/interfaces should not be written against a doomed name), while existing legacy call sites keep reading the env var (the entry point dual-writes both during the transition); the parked end-stage refactor then shrinks to "migrate the remaining legacy readers and delete the env var"; or (b) keep the original plan — new code also uses the env var, and everything is renamed in the parked end-stage refactor?

**AI Recommendation:** Option (a) — the strangler pattern. The new seams (runner script CLI, SKILL.md command templates, entry-point signatures) are being designed in this feature and are expensive to re-touch later, so they should be born with the right name; meanwhile nothing existing is churned, which honors the "isolated refactor stage at the end, changing nothing else" instinct. The end-stage refactor becomes a purely mechanical migration of Reads 1, 2, 4, and 5 (see Update 3 response) plus env-var deletion.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

## Relevant Files Reviewed

Ordered by decreasing relevance (pointers for the Planner):

- `package.json` — `private: true`, `bin` mapping, `exports` map pointing at `.ts` source, `tsx` as devDependency, `engines`/`packageManager` fields, node-pty pin.
- `bin/agentic-hq.cjs` — the entry point: sets `AGENTIC_HQ_WORKSPACE_ROOT` to its parent, runs tsx on `src/cli/main.ts`; carries the REFACTOR comment about the env var.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/SKILL.md` — representative launch-command template (`pnpm install` + `ln -sfn` + tsx) that the shared runner replaces; six siblings follow the same pattern.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ts-workflow/package.json` — the `"agentic-hq": "link:../../../../../.."` dependency, own tsx dep, postinstall chmod.
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` — builds the `claude` invocation: `--plugin-dir` per plugin, `--allowedTools` incl. `Read(<ahq-root>/.agentic-hq)`.
- `src/workflow-discovery/workspace/ahq-workspace-impl.ts` — env-var Read 1 (`getRoot()`, fallback `process.cwd()`).
- `src/workflow-discovery/workspace/workspace-impl.ts` — plugin-directory scanning and env-var Read 2 (`isAhqWorkspace()`).
- `src/kernel/composition-root.ts` — wiring; proves marshalling temp dirs come from the *user* workspace.
- `src/cli/main.ts` + `src/cli/app.ts` — the 2-line entry and `app.run()` seam where explicit parameters enter.
- Three ts-workflow CLIs (`add-feature`, `add-feature-detailed-example`, `create-workflow`) — env-var Read 4 (relay into Command 01 inputs).
- `README.md` — the clone-based Installation section the npm Quickstart splits from.
- `.agentic-hq/plugins/*/.claude-plugin/plugin.json` — marketplace-shaped manifests (all four plugins).

## Acceptance Criteria

- On a machine without the cloned repo (Claude CLI installed), `npx agentic-hq list` works, and `npm install -g agentic-hq` then `agentic-hq add-feature -- --ticket-id=…` runs the workflow from a user project directory.
- End users need neither pnpm nor corepack, and nothing is written inside the installed package directory at runtime.
- A dev-mode workflow run builds on the fly and executes byte-identical JavaScript to the published artifact.
- `build-mode` and `ahq-package-root` flow explicitly through the whole chain (no environment variables in any new code), and the final refactor stage removes `AGENTIC_HQ_WORKSPACE_ROOT` with zero functionality change.
- The README offers a short npm/npx Quickstart for tool users, separate from the contributor clone-and-build path.
- The published package contains no dev-only content (tests, `steve-test-plugin`, dev configs).

## Split Suggestion (Accepted)

**Record of the decision:** the Researcher flagged this feature as too large/complex for one
add-feature run and recommended terminating the workflow and splitting the feature. The human gave
explicit approval of the split plan, terminated the workflow, and performs each Sub-Task below as
its own single feature implementation. On 2026-08-06, during the AHQ-196 Researcher stage, the
human gave full approval to revise the plan into its current form: the infrastructure is proven on
**math-workflow** first — taken as far as possible, including a real npm publish and
registry-install verification — add-feature is converted only once everything is proven and
working, and the remaining workflows are migrated in one final pass. (Earlier revisions of this
plan are in git history.)

**Guiding principle (applies to every Sub-Task, set by the human):** one workflow at a time, taken
fully end-to-end. Sub-Tasks 1–3 prove the whole infrastructure chain on **math-workflow** only —
from local build through tarball install to a real npm publish; Sub-Task 4 converts **add-feature**
onto the pattern once the pipeline is proven; all other shipped workflows are **deliberately left
broken** until Sub-Task 7 (AHQ-201) migrates them onto the locked-down pattern in one pass. Rationale
(the human's): migrating every workflow as we go would mean repeating each design change or
improvement across all of them — a massive waste of time.

**Why math-workflow is the proving vehicle (chosen over add-feature, 2026-08-06):**

- It runs **end-to-end with no human in the loop** — three chained Claude commands (×2, +3, ÷5)
  producing an assertable output number — so every infrastructure iteration in Sub-Tasks 1–2 is a
  fast, fully automatable run. add-feature's Researcher stops to wait for a human, which would have
  forced an artificial "abort at first agent handshake" proof point and a human-attended Claude
  session per iteration.
- Failures point at the **infrastructure** (build, import resolution, runner script, plugin
  discovery, io marshalling) rather than at workflow content — and the infrastructure is exactly
  what Sub-Tasks 1–2 exist to prove.
- It **ships** in the published package (it is a user-facing demo), so it can serve as the
  installed-package smoke-test workflow permanently. A dedicated test plugin was considered and
  rejected: it would near-duplicate math-workflow, and — like `steve-test-plugin` — it would
  presumably be excluded from the published files whitelist, making it useless for post-publish
  tarball testing. An existing e2e test
  (`tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts`)
  is the template for the installed-package check.
- Deferred risk, accepted: add-feature-specific surfaces (interactive stops, the four-agent chain,
  help-doc paths located via the workspace-root relay) stay unproven until Sub-Task 4 — retiring
  them is that Sub-Task's purpose.

**Why the first publish (Sub-Task 3) precedes the add-feature conversion (Sub-Task 4):** publishing
is itself infrastructure with its own failure modes (npx cache behaviour, global-install
permissions, node-pty installing on a clean machine, the `files` whitelist producing a correct
tarball) — exactly the class of problem the tracer approach exists to surface cheaply, so it is
proven with math-workflow too. A quiet 0.x publish advertises nothing: the README/docs only start
pointing users at the npm route in Sub-Task 8 (AHQ-199), after add-feature works.

Why the split:

- It touches every layer: packaging, a new build pipeline, the CLI entry chain, SKILL.md templates,
  the create-workflow scaffolder, docs, and the publish process itself.
- It has several independently valuable outcomes (a working tarball, the build/parity system, a
  published package, user docs, the env-var elimination), each separately verifiable.
- It would be impossible to validate in one pass — the tracer bullet exists precisely to produce
  findings that reshape the later work.

Sub-Tasks (Jira IDs assigned by the human; each links to its Jira issue):

1. **[AHQ-196](https://agentic-hq.atlassian.net/browse/AHQ-196) — Tracer Bullet: Prove Prebuilt math-workflow Runs From an npm-Installed Tarball
   (No Cloned Repo)** — minimal build (CLI + the math-workflow ts-workflow) + minimal shared
   runner; `npm pack`; install the tarball into a temp prefix; prove `agentic-hq list` works and
   math-workflow runs end-to-end non-interactively (correct output number) from a clean directory
   with the cloned repo out of the picture. Must answer: how the `agentic-hq/tools/claude-code`
   import resolves in compiled workflows, and that the build is deterministic (build twice,
   compare hashes).
2. **[AHQ-197](https://agentic-hq.atlassian.net/browse/AHQ-197) — Build Pipeline And Explicit Parameter Chain (build-mode, ahq-package-root) For
   math-workflow** — implement `build-mode` and `ahq-package-root` through entry points →
   TypeScript → the math-workflow SKILL.md → shared runner; dev-mode parity (`build-first`);
   entry-point dual-write of the legacy env var. Other workflows remain on the old pattern
   (broken). It also owned the **staged-release-tree restructure**: the build assembles exactly what
   ships into `release/` under a single generated manifest, packing runs from that staged tree, and
   the generated manifest's `publishConfig.executableFiles` carries the shipped scripts' exec bits —
   retiring AHQ-196's `publishConfig` override dance, the `files` whitelist, and the plugin-script
   chmod. **Done.**
3. **[AHQ-198](https://agentic-hq.atlassian.net/browse/AHQ-198) — Package Hygiene And First npm Publish (files Whitelist, Un-private, Publish Guards And
   Checklist)** — `files` whitelist (drop tests, `steve-test-plugin`, dev configs, `.npmrc`),
   remove `private: true`, `prepublishOnly` guards, engines cleanup, documented manual publish
   checklist, then a quiet 0.x publish as `halso` with **math-workflow as the only working
   workflow** — verified from the real registry: `npx agentic-hq` / `npm install -g agentic-hq`
   from npmjs.org in a clean directory, running math-workflow end-to-end. Nothing advertises the
   npm route until AHQ-199. (How the not-yet-migrated workflows are handled in the published
   package — excluded vs present-but-marked — is a Planner decision for that Sub-Task.)
4. **[AHQ-202](https://agentic-hq.atlassian.net/browse/AHQ-202) — Convert add-feature Onto The Proven Prebuilt Pattern (First
   Interactive Multi-Agent Workflow)** — only once the whole pipeline (build → pack → publish →
   registry install → run) is proven and we are happy with it: migrate add-feature (the flagship
   workflow) onto the locked-down pattern, republish a patch version, and prove the full
   interactive four-agent flow runs from a registry-installed package in a clean directory;
   retires the add-feature-specific risks (interactive stops, the four-agent chain, help-doc paths
   located via the workspace-root relay). The migration portion was pulled forward and completed as
   [AHQ-204](https://agentic-hq.atlassian.net/browse/AHQ-204) (2026-08-10, because AHQ-195
   development itself uses add-feature and AHQ-197 had deliberately broken every unmigrated workflow
   CLI); work details in `docs/tickets/AHQ-204/01-work-details.md`. AHQ-202 retained the republish
   and the registry-install interactive proof. **Both done.**
5. **[AHQ-200](https://agentic-hq.atlassian.net/browse/AHQ-200) — Isolated Zero-Change Refactor: Eliminate The AGENTIC_HQ_WORKSPACE_ROOT Env Var** — eliminate
   `AGENTIC_HQ_WORKSPACE_ROOT` (zero functionality change for the working system — see the "Final
   Refactor Stage" section; the still-broken workflows' legacy references are migrated in
   Sub-Task 7).
6. **[AHQ-205](https://agentic-hq.atlassian.net/browse/AHQ-205) — Bug: agentic-hq CLI Installed From Npm Crashes When add-feature Workflow Runs From
   AHQ Workspace Root** — added 2026-08-14, found during AHQ-202's registry-install proof: the
   installed CLI crashes at startup (`cannot add command 'add-feature' as already have command
   'add-feature'`) when run from a directory whose local workspace defines a workflow named the
   same as a shipped one (e.g. the agentic-hq repo clone itself) — workflow registration has no
   name-collision handling, so every invocation from such a directory fails, including `list` and
   `--help`. Full description:
   `docs/tickets/AHQ-202/workflow-files/supporting-files/AHQ-205_bug_Jira.md`. Further instructions
   for this Sub-Task are in *Open Sub-Task Instructions* below. **Done** (outside the add-feature
   workflow — docs in `docs/tickets/AHQ-205/`; AHQ-208 builds on its first-wins registration fix).
7. **[AHQ-201](https://agentic-hq.atlassian.net/browse/AHQ-201) — Migrate All Remaining Workflows And The Scaffolder Onto The Proven Prebuilt Pattern And
   Restore Them To Working** — with the pattern locked down, migrate the remaining five skills
   (string-reversal, quick-jira-workflow, full-jira-tdd-story-workflow,
   add-feature-detailed-example, create-workflow) and the create-workflow scaffolder templates onto
   it; extend the build to all shipped plugins; restore everything to working; full validation and
   (re)publish. **AC added 2026-08-14 (during the AHQ-200 Researcher stage, at the human's
   request):** on completion, `AGENTIC_HQ_WORKSPACE_ROOT` and its equivalent names (e.g.
   `agentic-hq-workspace-root-dir`, `agenticHqWorkspaceRoot`) are fully eliminated — verified by a
   grep of the whole workspace that finds them only in legacy and old conversation/spec files
   (e.g. `docs/jira-docs/`, ticket history under `docs/tickets/`, `LEGACY/` copies). **Done**
   (delivered as AHQ-208 + AHQ-209 — see the Sub-Task 7 section below).
8. **[AHQ-199](https://agentic-hq.atlassian.net/browse/AHQ-199) — README And Docs: npm/npx Quickstart For Tool Users, Separate From Contributor Clone Path** —
   README npm/npx Quickstart vs contributor split, tool-user prerequisites (Claude CLI; Linux build
   toolchain for node-pty), troubleshooting updates — written against the working add-feature flow.
   **Moved from fifth to last (2026-08-14)**, so the docs are written once against the fully
   restored system (all workflows migrated, AHQ-205 fixed, the legacy env var already removed by
   AHQ-200). Further instructions for this Sub-Task are in *Open Sub-Task Instructions* below.
9. **[AHQ-207](https://agentic-hq.atlassian.net/browse/AHQ-207) — Full add-feature Run Of The npm-Installed agentic-hq On The Ubuntu VM** —
   added 2026-08-16: the closing proof for AHQ-195. Everything so far was verified on macOS, and the
   one add-feature run from a registry install (AHQ-202) was deliberately stopped at the first
   interactive stop; this Sub-Task installs the published package on a fresh Ubuntu VM and drives
   `add-feature` through all four agents to completion. Runs last — after AHQ-201 and the
   re-publish that follows it (and after AHQ-199, since it follows the README Quickstart as
   written). **AHQ-195 is not done until this is.** Unlike the other Sub-Tasks, **the details are in
   the Jira ticket, not in this document** — the Jira is the source of truth for AHQ-207.

## Open Sub-Task Instructions (consolidated 2026-08-16)

Sub-Tasks 1–7 are **complete**: AHQ-196, AHQ-197, AHQ-198, AHQ-202 (with its migration half done as
AHQ-204), AHQ-200, AHQ-205 (done outside the add-feature workflow — docs in
`docs/tickets/AHQ-205/`), and AHQ-201 (umbrella, delivered as AHQ-208 + AHQ-209;
`agentic-hq@0.2.0` published and registry-verified 2026-08-22). This section holds only what a
**remaining** Sub-Task agent needs in order to do the right thing — read the Sub-Task list above
for scope, then your own Sub-Task's items here.

> Eight dated "Update …" sections appended between 2026-08-06 and 2026-08-16 were consolidated into
> this one on 2026-08-16, at the human's request: decision narratives, superseded scheduling,
> Perplexity review write-ups, and instructions for Sub-Tasks that have since completed. Nothing
> still-actionable was dropped. If the reasoning behind an instruction below is ever needed, it is in
> git history: `git log -p -- docs/tickets/AHQ-195/workflow-files/01-feature-brief.md`.

### Sub-Task 6 — AHQ-205 (bug: workflow name-collision crash)

- **Full bug description:** `docs/tickets/AHQ-202/workflow-files/supporting-files/AHQ-205_bug_Jira.md`.
  Found during AHQ-202's registry-install proof and reproduced twice against the registry-installed
  `agentic-hq@0.1.1`.
- **Decide path normalisation explicitly.** `WorkspaceImpl.isAhqPackage()` compares raw strings
  (`this.rootDir === this.ahqPackageRoot.getPath()`), so a trailing slash or a symlinked invocation
  makes the dedup guard silently miss. AHQ-200 preserved this bit-for-bit while migrating the guard's
  source of truth from the env var to the injected root, leaving the decision to this Sub-Task.
- **Verify AHQ-200's AC 5 on this ticket's own add-feature run.** AHQ-200 renamed the add-feature
  relay variable to `ahq-package-root` (CLI broadcast plus all four `commands/add-feature/0?-*.md`
  parsers, verified in lockstep), but the rename was never exercised end-to-end: the AHQ-200 workflow
  process had started before the rename landed, so it relayed the old `agentic-hq-workspace-root-dir=`
  name for its whole run. Confirm Command 01's `command-input.json` reads `ahq-package-root=…` and
  record it. If this Sub-Task is not run via add-feature, carry the check to whichever one is.

### Sub-Task 7 — AHQ-201 (migrate the remaining workflows and the scaffolder)

**Done (2026-08-22):** delivered as AHQ-208 (approved 2026-08-20) and AHQ-209 (approved
2026-08-22; the human skipped the review stage, recorded in its summary). All seven shipped
workflows migrated and restored to working, the grep-clean AC verified, and `agentic-hq@0.2.0`
published and registry-verified on 2026-08-22 — see
`docs/tickets/AHQ-209/workflow-files/03-implementation-summary.md` (§ Publish Completion). The
items below are retained as the historical instruction record.

- **Open design question this Sub-Task must answer deliberately: how do user-created workflows work
  against a pure npm install, with no agentic-hq clone anywhere?** Today's mechanism (scaffolded
  `pnpm install` + `ln -sfn "$AGENTIC_HQ_WORKSPACE_ROOT" node_modules/agentic-hq` + tsx on `.ts`
  source) presumes pnpm and the tsx toolchain on every machine that runs the workflow, plus an
  agentic-hq installation for the symlink to point at. The prebuilt pattern (compiling workflows into
  the package's `dist/`) cannot cover user-workspace workflows — the installed package is read-only.
  - **The human's acceptance scenario for "restore everything to working"** (test it, don't assume
    it): a developer npm-installs agentic-hq → runs `agentic-hq create-workflow` in an empty
    workspace → commits/pushes the scaffolded workflow to GitHub → a collaborator clones that project
    and runs the workflow using their own npm-installed agentic-hq — with no agentic-hq clone
    anywhere in the scenario.
  - **Consequence to design for:** with an npm install, scaffolding *into the AHQ package* is
    impossible (read-only), so the user workspace becomes the only scaffold destination for
    npm-installed users; clone users keep both options.
  - **Candidate mechanisms (not decided):** (a) keep symlink+tsx for user-authored workflows,
    accepting pnpm as a workflow-*author* prerequisite (distinct from the tool-user path, which needs
    none); (b) scaffold workflows with a real declared dependency on the published agentic-hq package
    (plain `npm install` in the workflow dir — a step toward AHQ-203, but it raises the
    two-copies/version-match question between the workflow's agentic-hq copy and the CLI's own).
- **The unmigrated workflows now have no env-var supply at all.** AHQ-200 deleted the bin wrappers'
  `AGENTIC_HQ_WORKSPACE_ROOT` dual-write, so the five unmigrated SKILL.md launch commands built
  around `ln -sfn "$AGENTIC_HQ_WORKSPACE_ROOT"` (e.g. `skills/create-workflow/SKILL.md:18`, whose
  comment still calls it "the env var the `agentic-hq` CLI exports on every run") now resolve it to
  empty. **Not a regression** — those workflows were already broken by AHQ-197
  (`create-workflow-cli.ts:60` calls `new DefaultClaudeCodeTool()` no-arg, but that constructor has
  required a `CompositionRoot` since AHQ-197). Treat the SKILL.md `ln -sfn` pattern and the CLIs' own
  env-var reads as one migration, and don't spend time diagnosing the empty-symlink failure from
  scratch.
- **`create-workflow` is what the add-feature Reviewer tells users to run next.** Command 04's
  mandated *Customization Next Step* recommends `agentic-hq create-workflow -- --using=add-feature`,
  so re-verify precisely that invocation as part of the restore-to-working proof.
- **Delete the temporary half of the AHQ-200 bin-wrapper test once the grep-clean AC above holds.**
  `tests/integration/bin/bin-wrapper-supplies-the-package-root-explicitly.integration.test.ts` has two
  tests. The first — the wrapper renders a listing from the `--ahq-package-root` it passes — is
  **permanent**. The second, *"should take the package root only from that parameter, never from a
  retired environment variable"*, exists only for the migration window: it poisons
  `AGENTIC_HQ_WORKSPACE_ROOT` and proves nothing reads it. Once the grep-clean AC holds, that name
  exists nowhere in the repo and the test is archaeology that costs a future reader time. Delete the
  second `it(...)` block, the `LEGACY_ENV_VAR_NAME` and `BOGUS_LEGACY_ROOT` constants, the optional
  parameter of `runListThroughDevBinWrapper()`, and the `TEMPORARY` paragraph in the file header
  (which repeats these instructions in place).
- **Also in scope (added 2026-08-18, during the AHQ-201 Researcher stage, at the human's request):
  rename the dev binary to `agentic-hq-dev`.** The clone's dev wrapper (`bin/agentic-hq.cjs`, on PATH via
  `npm link`, rebuilds from source on every run) is installed as `agentic-hq-dev`; `agentic-hq` is
  reserved for the npm-installed prebuilt release. Root `package.json` `bin` changes; the generated
  release manifest's `bin` (`agentic-hq` → prebuilt wrapper) is untouched; nothing in the runtime chain
  invokes the binary by name. Rationale and details:
  `docs/tickets/AHQ-201/workflow-files/supporting-docs/01-new-two-separate-builds-architecture-design.md` §10.
  Done inside AHQ-201 (not a separate Jira) so AHQ-199 writes the docs once with the final names.
- **AHQ-201 was split (2026-08-18) into two clean sub-task Jiras, with AHQ-201 as the umbrella:**
  [AHQ-208](https://agentic-hq.atlassian.net/browse/AHQ-208) — *Split Framework Build From Workflow
  Build: Uniform Build+Run For All Workflows (Proven On math, string-reversal, add-feature)* — the
  re-work of the build/runner system (two separate builds; one SKILL.md template; per-workflow
  `build-mode`; `agentic-hq-dev`), then [AHQ-209](https://agentic-hq.atlassian.net/browse/AHQ-209) —
  *Migrate Remaining Workflows And create-workflow Scaffolder Onto Two-Builds Pattern, Restore All To
  Working, Publish 0.2.0* — which delivers everything listed for Sub-Task 7 above. Sequence:
  AHQ-208 → AHQ-209 → AHQ-199 → AHQ-207 *(corrected 2026-08-22 during the AHQ-199 Researcher
  stage — everything is documented first in AHQ-199, then the human follows that documentation
  exactly in AHQ-207 on the Ubuntu VM)*. The parent brief for both is
  `docs/tickets/AHQ-201/workflow-files/01-feature-brief.md` (+ its `supporting-docs/01|02|03`); read
  its `Split Suggestion (Accepted)` first.

### Sub-Task 8 — AHQ-199 (README and docs)

- **Starting reference points:** AHQ-198's registry verification matrix (`npx --yes agentic-hq` and
  prefix-global `npm install -g`, each on Node 22 and Node 24, math end-to-end),
  `docs/dev/publish-checklist.md`, and `docs/user-docs/troubleshooting-quickstart.md`.
- **Registry state to document correctly:** `agentic-hq@0.1.0` is deprecated (npx crash) — 0.1.1+ is
  the working line.
- **Mention Claude Code's folder-trust prompt** on first run in a fresh directory (an AHQ-198
  follow-up) in the Quickstart.
- **The Linux install-and-run check is now its own Sub-Task —
  [AHQ-207](https://agentic-hq.atlassian.net/browse/AHQ-207)** (added 2026-08-16; details in that
  Jira, not here). It follows the README Quickstart *as written* on a fresh Ubuntu VM, so any gap it
  finds in the docs comes back to AHQ-199 as a defect. Sub-Tasks 1–3 verified on macOS only, and
  Linux node-pty compiles from source (build toolchain + Python — see this brief's Blockers), so the
  prerequisites section written here is what AHQ-207 will test.
- **Retarget the glossary's root-model link.** `docs/glossary.md` (rewritten during AHQ-200) sends
  readers to `tickets/AHQ-200/workflow-files/01-feature-brief.md#the-three-root-concepts--in-depth-analysis`
  for the two-roots model. The link resolves today, but a user-facing glossary should not depend on a
  per-ticket AI workflow artifact. Either add a durable roots section to
  `docs/dev/how-agentic-hq-works.md` (which has no equivalent section today — verified 2026-08-16)
  and point there, or inline the explanation into the glossary.

### Sub-Task 9 — AHQ-207 (full add-feature run on the Ubuntu VM)

- **No instructions here by design.** For this Sub-Task the
  [Jira ticket](https://agentic-hq.atlassian.net/browse/AHQ-207) is the source of truth — scope,
  acceptance criteria, sequencing (blocked by AHQ-201 and the re-publish after it) and runner
  notes all live there. Read the Jira, not this document.

### After AHQ-195 closes

- **[AHQ-203](https://agentic-hq.atlassian.net/browse/AHQ-203) — workflows as true nested packages**
  (own manifests and builds, pnpm workspace, `workspace:*` dependency on agentic-hq). Deliberately
  deferred until the npm route works for developers: its payoff is post-launch (per-workflow
  independence and third-party workflow authoring), it is a genuine re-architecture rather than a
  no-behaviour-change step, and the published package's public contract (`bin` plus the
  `agentic-hq/tools/claude-code` export) insulates npm users from a later internal re-layout — so
  deferring costs internal rework only, never a breaking change. **Its single source of truth is the
  Jira issue itself**; there is deliberately no repo ticket file for it unless/until it is worked on.
- **[AHQ-206](https://agentic-hq.atlassian.net/browse/AHQ-206) — split the `Workspace` interface**
  (extract `PluginSource` for the shared plugin-discovery half, with `Workspace` extending it for the
  user side) so the type system stops claiming the AHQ package is a workspace. Description:
  `docs/tickets/AHQ-200/workflow-files/supporting-docs/AHQ-206_later_refactor_jira_description.md`;
  a `REFACTOR LATER` comment on `AhqPackageImpl` points at it. Concrete symptom to cite: `WorkspaceImpl`
  takes `AhqPackageRoot` as a third constructor parameter used by exactly one method
  (`isAhqPackage()`), and `AhqPackageImpl.createDelegate()` passes it down even though
  `AhqPackageImpl` overrides `isAhqPackage()` to `return true`.

### Needs a Jira — flagged for the human (found during the AHQ-200 review, 2026-08-16)

1. **Integration-suite contention on the `release/` tree.**
   `tests/integration/build/publish-guards.integration.test.ts` fails in `beforeAll` when the whole
   suite runs, but passes 3/3 on its own — it and `build-determinism.integration.test.ts` both invoke
   `scripts/build-release.cjs` against the same `release/` directory. Pre-existing and unrelated to
   AHQ-200 (verified by stashing all AHQ-200 changes and reproducing the failure on the clean tree).
   Likely fix: stage into per-test directories, or serialise those two files.
2. **CI runs unit tests only.** `.github/workflows/ci.yml` runs `pnpm validate` (typecheck + lint +
   format + **unit** tests) plus a bare `agentic-hq list` smoke step that checks the **exit code
   only**. `pnpm test:integration` and `pnpm test:e2e` never run in CI, so every integration/e2e test
   is a local-only guard. Worth a deliberate decision (a nightly job, or a Claude-free subset in CI)
   rather than leaving it implicit.

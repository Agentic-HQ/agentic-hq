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
   (broken). **Updated 2026-08-08:** this Sub-Task now opens with the architecture refactor
   discussion and also owns the **staged-release-tree restructure** — see the addendum
   *"Update (2026-08-08, appended during the AHQ-196 Reviewer stage) — Architecture Decision"*
   at the bottom of this brief.
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
   located via the workspace-root relay). **Updated 2026-08-10:** the migration portion of this
   Sub-Task was pulled forward and completed as
   [AHQ-204](https://agentic-hq.atlassian.net/browse/AHQ-204) — see the addendum *"Update
   (2026-08-10) — add-feature Migration Pulled Forward As AHQ-204"* at the bottom of this brief.
   AHQ-202 retains the republish and the registry-install interactive proof.
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
   `docs/tickets/AHQ-202/workflow-files/supporting-files/AHQ-205_bug_Jira.md`. See the addendum
   *"Update (2026-08-14, appended during the AHQ-202 Implementer stage)"* at the bottom of this
   brief.
7. **[AHQ-201](https://agentic-hq.atlassian.net/browse/AHQ-201) — Migrate All Remaining Workflows And The Scaffolder Onto The Proven Prebuilt Pattern And
   Restore Them To Working** — with the pattern locked down, migrate the remaining five skills
   (string-reversal, quick-jira-workflow, full-jira-tdd-story-workflow,
   add-feature-detailed-example, create-workflow) and the create-workflow scaffolder templates onto
   it; extend the build to all shipped plugins; restore everything to working; full validation and
   (re)publish. **AC added 2026-08-14 (during the AHQ-200 Researcher stage, at the human's
   request):** on completion, `AGENTIC_HQ_WORKSPACE_ROOT` and its equivalent names (e.g.
   `agentic-hq-workspace-root-dir`, `agenticHqWorkspaceRoot`) are fully eliminated — verified by a
   grep of the whole workspace that finds them only in legacy and old conversation/spec files
   (e.g. `docs/jira-docs/`, ticket history under `docs/tickets/`, `LEGACY/` copies).
8. **[AHQ-199](https://agentic-hq.atlassian.net/browse/AHQ-199) — README And Docs: npm/npx Quickstart For Tool Users, Separate From Contributor Clone Path** —
   README npm/npx Quickstart vs contributor split, tool-user prerequisites (Claude CLI; Linux build
   toolchain for node-pty), troubleshooting updates — written against the working add-feature flow.
   **Updated 2026-08-14:** moved from fifth to **last**, so the docs are written once against the
   fully restored system (all workflows migrated, AHQ-205 fixed, the legacy env var already
   removed by AHQ-200) — see the addendum *"Update (2026-08-14, appended during the AHQ-199
   Researcher stage)"* at the bottom of this brief.

## Update (2026-08-06, appended during the AHQ-196 Planner stage) — Sub-Task Addenda From The Perplexity Plan Review

A Perplexity second-opinion review of the AHQ-196 tracer-bullet plan (full Q&A:
`docs/tickets/AHQ-196/workflow-files/02-implementation-plan-supporting-docs/perplexity-questions/01-perplexity-q-and-a-about-plan.md`)
endorsed the prebuilt design but raised items belonging to later Sub-Tasks. They are recorded
here — as AI/Perplexity-proposed addenda, for the human to confirm when each Sub-Task runs —
because Sub-Task runs read this brief, not AHQ-196's documents.

**Addendum to Sub-Task 3 (AHQ-198 — Package Hygiene And First npm Publish):**

- Add a release guard preventing `npm pack` / `npm publish` from being run against the source
  tree. AHQ-196 establishes that the tarball must be produced by **pnpm** (`pnpm pack` /
  `pnpm publish`): only pnpm applies the `publishConfig` `bin`/`exports` overrides — an
  npm-produced tarball would silently ship the dev (tsx/`.ts`) `bin` and `exports` and be
  unusable, with no error at pack time.
- Pin the pnpm version in the publish checklist: the override behaviour is package-manager
  behaviour, not an npm-registry contract, so a pnpm major bump is a publish-pipeline change to
  re-verify, not a routine upgrade.
- Publish checks must inspect the packed tarball's **actual** `package/package.json` (prebuilt
  `bin`, dist-JS `exports`, no `.ts` targets) rather than inferring from the source manifest —
  AHQ-196 lands an e2e assertion of exactly this shape that the publish checklist can reuse.
- Registry verification should include both `npx --yes agentic-hq` and a global
  `npm install -g agentic-hq`, on Node 22 and Node 24.

**Addendum to Sub-Task 8 (AHQ-199 — README And Docs):**

- Sub-Tasks 1–3 verify on macOS only. Beyond documenting the existing Linux node-pty
  prerequisite (compile-from-source: build toolchain + Python — already in this brief's
  Blockers), consider an actual Linux install-and-run check (here or as part of AHQ-198's
  registry verification, whichever the human prefers) before the npm route is advertised to
  users.

## Update (2026-08-08, appended during the AHQ-196 Implementer stage) — Architecture Recommendation From The Second Perplexity Review

During AHQ-196's approval gate, two defects were found and fixed with interim mechanisms (a
build-generated `dist/package.json` for self-reference; a postinstall chmod for shipped-script
execute bits — full story in `docs/tickets/AHQ-196/workflow-files/03-implementation-summary.md`).
A second Perplexity review of those fixes (full Q&A:
`docs/tickets/AHQ-196/workflow-files/02-implementation-plan-supporting-docs/perplexity-questions/02-perplexity-q-and-a-about-dist-package-json.md`)
judged them defensible interims and recommended an architectural end-state. Recorded here as
AI/Perplexity-proposed addenda for the human to confirm when the relevant work runs.

**Cross-cutting architecture recommendation (schedule before or during Sub-Task 2 / AHQ-197, or
as its own refactor ticket):**

- The proper end-state for "runnable sub-programs shipped inside a package" is either **workflows
  as true nested packages** (own manifests and builds, pnpm workspace, `workspace:*` dependency
  on agentic-hq) or a **staged release tree** assembled at pack time with a single generated
  manifest. The current generated `dist/package.json` is a blessed transitional step toward
  either. The human's decision (2026-08-08): commit the working interim now and hold a separate
  **"no behaviour change" refactor discussion** armed with these findings.

**Addendum to Sub-Task 3 (AHQ-198 — Package Hygiene And First npm Publish):**

- Consider switching shipped-script execute bits from the postinstall chmod to pnpm's standard
  `publishConfig.executableFiles` once the shipped script list stabilises (it shrinks when
  `steve-test-plugin` is excluded). Spike-verified in AHQ-196: `pnpm pack` (pnpm 11) honours it
  for **exact paths only — globs are silently ignored**. It makes the tarball itself carry the
  bits (correct under any installer); AHQ-196's e2e assertion (every shipped `.sh` executable)
  guards against a script being added but not listed.

## Update (2026-08-08, appended during the AHQ-196 Reviewer stage) — Architecture Decision: Staged Release Tree In AHQ-197; Nested Packages Deferred Post-AHQ-195

This resolves the scheduling question the previous addendum left open ("before or during
Sub-Task 2 / AHQ-197, or as its own refactor ticket"). Decided with the human during the AHQ-196
review (2026-08-08).

**Addendum to Sub-Task 2 (AHQ-197 — Build Pipeline And Explicit Parameter Chain):**

- **AHQ-197 opens with the "no behaviour change" refactor discussion** the human called for at
  the AHQ-196 approval gate: its Researcher/Planner stage takes the second Perplexity review
  (`docs/tickets/AHQ-196/workflow-files/02-implementation-plan-supporting-docs/perplexity-questions/02-perplexity-q-and-a-about-dist-package-json.md`)
  and AHQ-196's Findings For Later Sub-Tasks as inputs, and confirms (or amends) the
  staged-release-tree design below with the human before any build-pipeline code is written.
- **AHQ-197 now also owns the staged-release-tree restructure.** Expected shape (details are the
  AHQ-197 Planner's to finalise):
  - The build assembles **exactly what ships** into a staging directory (e.g. `release/`):
    compiled CLI JS, compiled workflow JS, the shipped plugins tree, the bin wrapper and the
    runner — with a **single generated manifest at its root**. That manifest is the evolution of
    today's generated `dist/package.json`, promoted to the package's real manifest: generated
    from the root `package.json` (name/version/dependencies/engines/postinstall — one source of
    truth, transformed, never hand-maintained) with the prebuilt `bin` and compiled-JS `exports`
    written in directly.
  - **Packing runs from the staged tree**, so two AHQ-196 mechanisms retire together: the
    `publishConfig` `bin`/`exports` override dance (the generated manifest simply contains the
    prebuilt values) and the `files` whitelist (what ships is what was staged). This structurally
    eliminates the whitelist-vs-gitignore leak class AHQ-196 found (the `.agentic-hq/temp/`
    io-files, `steve-test-plugin`, pnpm-only files can no longer ship by accident).
  - Exec bits: the staging step can enumerate every shipped `.sh` and write
    `publishConfig.executableFiles` **exact paths** into the generated manifest (spike-proven in
    AHQ-196: exact paths honoured, globs silently ignored), retiring the postinstall chmod.
    Whether that replaces or merely backs up the chmod is a Planner decision; the e2e's
    every-shipped-script-is-executable assertion stays as the guard either way.
  - AHQ-196's tests are the safety net that makes this a provable no-behaviour-change refactor:
    the build-determinism integration test and the tarball-install e2e assert
    architecture-agnostic outcomes and transfer with path re-pointing only. No second tracer
    spike is needed.
- **Why inside AHQ-195 rather than after it:** every later Sub-Task gets cheaper once the layout
  is settled — AHQ-198's hygiene work shrinks to "stage the right things" plus publish guards,
  and the AHQ-202/AHQ-201 migrations happen once, onto the final layout. Deferring past AHQ-201
  would mean re-migrating seven workflows — exactly the repeated-work waste the
  one-workflow-at-a-time principle exists to prevent.
- Knock-on: Sub-Task 3's (AHQ-198) `files`-whitelist wording in the Sub-Task list above predates
  this decision — its hygiene *goal* stands unchanged; the *mechanism* becomes the staged tree.

**Nested-packages end-state — deferred until after AHQ-195 (decision + why):**

- The second Perplexity review's other, maximal option — **workflows as true nested packages**
  (own manifests and builds, pnpm workspace, `workspace:*` dependency on agentic-hq; described in
  `docs/tickets/AHQ-196/workflow-files/02-implementation-plan-supporting-docs/perplexity-questions/02-perplexity-q-and-a-about-dist-package-json.md`)
  — is **deferred until after AHQ-195 completes**, i.e. after the npm route works for
  developers.
- Why deferred: its main payoff is per-workflow independence — isolated builds and tests,
  independent versioning, and above all **third-party workflow authoring** against agentic-hq as
  a declared dependency — which is a post-launch concern; it is a genuine re-architecture that
  reshapes the dev flow, not a no-behaviour-change step; and nothing in AHQ-195's goal depends
  on it — the published package's public contract (`bin` + the `agentic-hq/tools/claude-code`
  export) insulates npm users from a later internal re-layout, so deferring costs internal
  rework only, never a breaking change. The requirements will also be better understood after
  add-feature (interactive, four agents, help docs) and the scaffolder have been through the
  migration.
- The deferred ticket exists:
  **[AHQ-203](https://agentic-hq.atlassian.net/browse/AHQ-203)** (created by the human
  2026-08-08, scheduled to run after AHQ-195 closes). Its **single source of truth is the Jira
  issue itself**: https://agentic-hq.atlassian.net/browse/AHQ-203 — a repo brief file drafted
  during the AHQ-196 review session was deliberately deleted by the human just before commit
  (confirmed 2026-08-09 during the AHQ-197 Researcher stage); no repo ticket file exists for
  AHQ-203 unless/until it is worked on.

**Addendum to Sub-Task 7 (AHQ-201 — Migrate All Remaining Workflows And The Scaffolder),
surfaced by the human during the AHQ-196 review:**

- **Open design question AHQ-201 must answer deliberately: how do user-created workflows work
  against a pure npm install (no agentic-hq clone anywhere)?** Today's user-workspace mechanism
  (scaffolded `pnpm install` + `ln -sfn "$AGENTIC_HQ_WORKSPACE_ROOT" node_modules/agentic-hq` +
  tsx on `.ts` source) is retained through AHQ-195, but it presumes pnpm and the tsx toolchain
  on every machine that runs the workflow, and an agentic-hq installation for the symlink to
  point at. The prebuilt pattern (compile workflows into the package's `dist/`) cannot cover
  user-workspace workflows — the installed package is read-only.
- **The human's acceptance scenario for "restore everything to working" (record it so it is
  tested, not assumed):** a developer npm-installs agentic-hq → runs
  `agentic-hq create-workflow` in an empty workspace → commits/pushes the scaffolded workflow to
  GitHub → a collaborator clones that project and runs the workflow using their own
  npm-installed agentic-hq — with no agentic-hq clone anywhere in the scenario.
- Related consequence to design for: with an npm install, scaffolding **into the AHQ workspace**
  is no longer possible (the installed package is read-only) — the user workspace becomes the
  only scaffold destination for npm-installed users; clone users keep both options.
- Candidate mechanisms for that Sub-Task's Planner (not decided): (a) keep symlink+tsx for
  user-authored workflows, accepting pnpm as a workflow-*author* prerequisite (distinct from the
  tool-user path, which needs none); (b) scaffold workflows with a real declared dependency on
  the published agentic-hq package (plain `npm install` in the workflow dir — a step toward
  AHQ-203, but it raises the two-copies/version-match question between the workflow's agentic-hq
  copy and the CLI's own). The full end-state is
  [AHQ-203](https://agentic-hq.atlassian.net/browse/AHQ-203).

## Update (2026-08-10) — add-feature Migration Pulled Forward As AHQ-204

Running add-feature (to start AHQ-198) crashed at startup: AHQ-197's explicit parameter chain
deliberately broke every unmigrated workflow CLI (`new DefaultClaudeCodeTool()` now requires a
`CompositionRoot`), and add-feature had not yet been migrated. Since AHQ-195 development itself
uses add-feature, waiting for Sub-Task 4's (AHQ-202) planned slot — after the first publish is
proven — was not viable.

**Decided with the human (2026-08-10):** pull the migration portion of Sub-Task 4 (AHQ-202)
forward as its own Sub-Task,
**[AHQ-204](https://agentic-hq.atlassian.net/browse/AHQ-204) — Interim: Early-Migrate
add-feature Onto The Prebuilt Pattern (Pulled Forward From AHQ-202 To Keep add-feature Usable
During AHQ-195)** (created by the human 2026-08-10 — the MCP account lacked issue-create
permission). Completed the same day; work details: `docs/tickets/AHQ-204/01-work-details.md`.

- **What moved to AHQ-204 (done):** add-feature-cli.ts onto `DefaultWorkflowRuntime`; the
  add-feature SKILL.md onto the shared `run-workflow.cjs` runner; `tsconfig.build.json` now
  compiles add-feature into the staged release tree; a staged-artifact assertion for the
  compiled add-feature JS added to the build-determinism integration test.
- **What stays in AHQ-202:** republish a patch version and prove the full interactive
  four-agent flow runs from a registry-installed package in a clean directory.
- **Knock-on for Sub-Task 3 (AHQ-198):** the first publish now carries two migrated workflows
  (math-workflow and add-feature) rather than math-workflow only — add-feature's
  registry-install proof still belongs to AHQ-202.

## Update (2026-08-14, appended during the AHQ-202 Implementer stage) — New Final Sub-Task AHQ-205: Registry-Install Workflow Name-Collision Crash

During AHQ-202's proof (Phase 1, the clean prefix-global install of `agentic-hq@0.1.1`), the
installed CLI was found to crash at startup with an uncaught
`Error: cannot add command 'add-feature' as already have command 'add-feature'` when run from a
directory whose local workspace defines a workflow named the same as a shipped one — e.g. the
agentic-hq repo clone itself. Workflow registration aggregates the installed package's workspace
and the local workspace with no name-collision handling, and the crash happens during CLI program
construction, so **every** invocation from such a directory fails (`list`, `add-feature`, even
`--help`). Reproduced twice against the registry-installed 0.1.1.

**Decided with the human (2026-08-14):** split out as its own bug Sub-Task,
**[AHQ-205](https://agentic-hq.atlassian.net/browse/AHQ-205)** (created by the human 2026-08-14),
now the last Sub-Task of AHQ-195 *(superseded later the same day: AHQ-205 is now Sub-Task 6 and
AHQ-199 moved last — see the next addendum)* — rather than triggering AHQ-202's contingent
fix-and-republish path, because AHQ-202's planned proof contexts (a neutral directory and a
scratch project with no local plugins) cannot collide and are unaffected. Full bug description,
reproduction steps, and fix-locating notes:
`docs/tickets/AHQ-202/workflow-files/supporting-files/AHQ-205_bug_Jira.md`.

## Update (2026-08-14, appended during the AHQ-199 Researcher stage) — AHQ-199 (Docs) Moved To Last Sub-Task

During the AHQ-199 Researcher's initial research, the human asked (chat, verbatim): *"One
question: should we do all the documentation (README etc) - once we've completed all the
workflows - AHQ-201  and fixed the major bug in AHQ-205 ?  So move this to last  sub-task of
AHQ-195?"* — later adding: *"also may reduce churn as we won't have to document the
AGENTIC_HQ_WORKSPACE_ROOT as it will have been removed by AHQ-200."* The Researcher recommended
yes; the human accepted, and the AHQ-199 workflow run was terminated cleanly
(`TERMINATE_WORKFLOW`). The human deleted that run's `docs/tickets/AHQ-199/` files (AHQ-199
starts fresh in its new final slot), so the deferral reasoning is recorded in full here. The
Sub-Task list above has been renumbered to the new order — items 1–4 (all complete) unchanged,
then AHQ-200 (5), AHQ-205 (6), AHQ-201 (7), and **AHQ-199 last (8)**. Placing AHQ-205 just
before AHQ-201 was the human's follow-up decision (chat, verbatim): *"I've also moved AHQ-205 to
just before AHQ-201 in case fixing it involves per-workflow changes.  This is so all workflows
get the right shape, (nearly last), then documented (really last)"*.

Why docs-last is right (Researcher findings, agreed by the human):

1. **Docs written now would describe a temporary state and need a full second pass after
   AHQ-201.** The published `agentic-hq@0.1.1` ships only math-workflow and add-feature
   (`EXCLUDED_UNMIGRATED_SKILLS` in `scripts/build-release.cjs`), and the five unmigrated
   workflows are deliberately broken even in the clone — including `reversal`, the README's own
   step-7 smoke test (verified during this run: `string-reversal-demo-cli.ts` still calls
   `new DefaultClaudeCodeTool()` with no arguments, the pre-AHQ-197 pattern).
2. **AHQ-205 hits exactly the audience the Quickstart targets.** The npm-installed CLI crashes on
   every invocation (`list`, `--help`, any workflow) from a directory whose local workspace
   defines a workflow named the same as a shipped one — and the current README TIP even suggests
   running add-feature from within the AHQ workspace, which for an npm-install user is precisely
   the crashing case. Advertising the npm route before the fix would mean documenting a known
   startup crash as a caveat and unpicking it later.
3. **The env-var churn disappears (the human's point):** with AHQ-200 complete first, the docs
   never need to document `AGENTIC_HQ_WORKSPACE_ROOT` at all — it will already have been
   eliminated.
4. **The Addendum to Sub-Task 8 above already leans this way:** it asks for a real Linux
   install-and-run check to be considered *before the npm route is advertised to users*, and
   AHQ-202's approved deviation anticipates a future Ubuntu VM full-run Jira. Docs-last lets that
   verification land first, so the docs only advertise what is proven.
5. **Deferring costs nothing user-facing:** the 0.1.x publishes are deliberately quiet (nothing
   advertises the npm route until AHQ-199 runs — by design), and the public `main` README is
   unaffected until this feature branch merges.

Carried-forward notes for the AHQ-199 re-run (recorded here so this Researcher's research is not
lost with the deleted run files): the Quickstart should mention Claude Code's folder-trust prompt
on first run in a fresh directory (an AHQ-198 follow-up); AHQ-198's registry verification matrix
(`npx --yes agentic-hq` and prefix-global `npm install -g`, each on Node 22 and Node 24, math
end-to-end), `docs/dev/publish-checklist.md`, and
`docs/user-docs/troubleshooting-quickstart.md` are the starting reference points; and
`agentic-hq@0.1.0` is deprecated on the registry (npx crash) — 0.1.1+ is the working line.



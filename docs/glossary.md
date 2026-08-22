# Agentic HQ Glossary

A single-page reference for the terms used throughout the Agentic HQ docs and
codebase. If you see a term in another doc and aren't sure what it means, it
should be defined here.

Terms are grouped roughly by topic, not strictly alphabetised, so related
concepts sit next to each other.

---

## Core concepts

### Agentic HQ (AHQ)

The project itself — a thin TypeScript wrapper around Claude Code that lets you
chain together multiple Claude Code sessions into a workflow. "Agentic HQ" in
prose; "AHQ" as the informal abbreviation thereafter.

### Workflow

A multi-step process, written as a TypeScript program, that calls Claude Code
one or more times to get a job done. Each call gets a fresh Claude session.
The workflow's TS program is responsible for passing the output of one step
into the input of the next.

(Not to be confused with a _GitHub Actions_ workflow — the repo's CI
configuration in `.github/workflows/`; see
[dev/ci-configuration.md](dev/ci-configuration.md). "Workflow" on its own
always means an Agentic HQ workflow in these docs.)

Examples shipped in this repo: `add-feature` (4 steps — the flagship
workflow), `string-reversal` (1 step), `math-workflow` (3 steps),
`full-jira-tdd-story-workflow` (many steps).

### Step

One Claude Code invocation inside a workflow. Each step runs in a fresh
Claude session, reads its input from a JSON file, does whatever its
[command](#command) tells it to, and writes its output to a JSON file.

### Plugin

A self-contained directory under `.agentic-hq/plugins/` that bundles one or
more workflows and their per-step commands. Plugins follow the standard
Claude Code [Plugin format](https://code.claude.com/docs/en/plugins) so they
can also be distributed via Claude Code Plugin Marketplaces.

### Skill

The entry-point launcher file (`SKILL.md`) for a workflow. Calling a skill
returns the shell command that runs the workflow's TypeScript program.

> Note: in current Claude Code terminology, "skill" has replaced "command" in
> some places. AHQ docs often use "skill" for the `SKILL.md` entry-point and
> "command" for the per-step `.md` files. Both terms appear in the codebase
> and are interchangeable in casual prose.

### Command

One per-step instruction file — a markdown file under a plugin's `commands/`
directory that tells Claude exactly what to do for one step (read input, do
the thing, write output). Versioned, reviewable, editable like any other
code.

### Agent

Two related uses you'll see:

- **Subagent** — a Claude Code subagent invoked from inside a step (see
  `agents/` directories inside plugins). Used for focused side tasks like
  "extract the verbatim content of this Jira ticket".
- **Workflow agent** — informal phrase for a step's role: "the planning
  agent", "the RED agent", etc. These aren't separate Claude features;
  they're just steps written to act in a particular role.

---

## Filesystem & layout

### AHQ package

The directory the currently executing copy of agentic-hq lives in: its CLI code,
its compiled framework (`dist/`, the output of the
[Framework Build](#framework-build-1)), the shared workflow runner, and the
shipped plugins under `.agentic-hq/plugins/`.
Which copy that is follows from which binary you invoked — the repo checkout for
the dev binary, the npm-installed directory for the installed one. Never
detected or guessed: each bin wrapper passes its own parent directory as
[`ahq-package-root`](#ahq-package-root-ahq-package-root). One of the system's
two roots, the other being your [local workspace](#local-workspace). Modelled in
code by `AhqPackageImpl`.

(For how these roots relate — including when the package and your local
workspace are the same directory — see *The two roots* in
[how-agentic-hq-works.md](dev/how-agentic-hq-works.md#the-two-roots).)

### AHQ package root (`ahq-package-root`)

The path of the [AHQ package](#ahq-package) — one of the system's two roots.
Flows visibly as the `--ahq-package-root=` option from the bin wrapper, through
the CLI and `AhqRuntimeParams`, and verbatim across the Claude/skill hop to the
shared runner. It is **required, with no default**, so a missing value fails
loudly instead of silently resolving to the wrong directory. Modelled by the
`AhqPackageRoot` value object.

### Local workspace

Your current directory — wherever you ran `agentic-hq <workflow>` from. This is
where *your* plugins are discovered (`.agentic-hq/plugins/`), where per-run temp
files are written, and the working directory Claude itself is launched in.
Nothing at runtime ever writes into the AHQ package, so an installed copy stays
a read-only artifact.

The CLI looks for plugins in **both** the AHQ package and the local workspace,
so you can ship workflows in either place. (This dual-search is a transitional
design — see *Two-workspace plugin search* in
[how-agentic-hq-works.md](dev/how-agentic-hq-works.md#transitional-design-notes).)

The two overlap when you run `agentic-hq` from the root of your clone of the AHQ
repo: that one directory is then both your local workspace *and* the
[AHQ package](#ahq-package). The CLI spots this and searches it once rather than
twice, so the shipped plugins aren't registered or listed twice — `agentic-hq
list` shows `Same as Agentic HQ Package` in place of a repeated block.

### Agentic HQ workspace

An informal, human name for a contributor's clone of the `agentic-hq` repo —
handy in conversation, but not something the CLI or the code models. When it
matters to a run, that checkout is playing one of the two real roles: the
[AHQ package](#ahq-package) (you invoked its binary) or your
[local workspace](#local-workspace) (you're standing in it).

### `agentic-hq` install dir

The directory containing the `agentic-hq` CLI on your machine — the same
directory as the [AHQ package root](#ahq-package-root-ahq-package-root), named
this way in the permissions context. Used in the auto-appended
`Read(<agentic-hq install dir>/.agentic-hq)` grant so Claude can read shipped
command files from outside the user's local workspace.

### `ahq-workflow.json`

The metadata file for a workflow, sitting at
`<plugin>/skills/<workflow>/ahq-workflow.json`. Declares the workflow's
`shortId`, `description`, and `exampleParameters`. `agentic-hq list` reads
these.

### `shortId`

The short alias used to invoke a workflow. For example, the `string-reversal`
workflow has `shortId: "reversal"`, so `agentic-hq reversal` works as
shorthand for the full id.

---

## Execution

### Marshalling

Serialising the input and output of a step to/from JSON files on disk, so a
fresh Claude session can read it, act on it, and write its result back.
Each step's input is "marshalled out" to `command-input.json` before Claude
runs; Claude's response is "marshalled in" from `command-output.json` once
the session ends. Because every step is a separate process talking through
files, steps are independently inspectable.

### Marshalling ID / IO files directory

The unique temp directory that holds a single step's marshalling files,
e.g. `.agentic-hq/temp/command-input-output-files/io-files-<timestamp>_<uuid>/`.
Its path is also the argument passed to the slash command so Claude knows
where to read/write.

### `MarshalledCLITool`

The execution-engine class that does one `execute(command, input)` call:
create a marshalling session, write the input JSON, run Claude Code, read
the output JSON. Lives at
`src/tools/marshalled-io-tools/marshalled-cli-tool.ts`.

### `DefaultClaudeCodeTool`

A pre-wired wrapper around `MarshalledCLITool` that workflow code typically
uses directly. Pulls its dependencies from `CompositionRoot`.

### PTY / pseudo-terminal

A virtual terminal device. AHQ launches Claude Code inside a PTY (using
`node-pty`) so Claude's `isatty()` check returns *yes* and it streams its
full output. Without a PTY, piped stdio fools Claude into silent mode and
AHQ has nothing to read. See `PtyCLIWrapper` in `src/io/terminal/`.

---

## Builds & running

Two separate builds, two owners. "(1)" and "(2)" mark **dependency order** — a
Workflow Build always compiles against the output of a Framework Build that has
already happened (moments earlier in a clone; at publish time for an npm
install) — *not* that both run on every invocation: `agentic-hq-dev list` runs
only the Framework Build, a local-workspace workflow launched from an
npm-installed agentic-hq runs only the Workflow Build, and a bundled workflow
run from an npm install runs neither. (Earlier design docs under
`docs/tickets/AHQ-201/` call these "Build 1" and "Build 2".)

### Framework Build (1)

Compiling the agentic-hq framework's own `src/` into `<AHQ package root>/dist/`
— JS, `.d.ts` and source maps. Owned by the framework's entry points only: the
[`agentic-hq-dev`](#agentic-hq-dev-vs-agentic-hq) binary runs it (incremental
`tsc`, ~1 s once warm) on every invocation before running the compiled CLI, and
the release build runs it when publishing. It **never runs on a user's
machine** — an npm-installed package arrives with `dist/` already built.

### Workflow Build (2)

Compiling one workflow's `ts-workflow/src/` into that workflow's own
`ts-workflow/dist/`, by one shared script — `scripts/build-workflow.cjs`:
`pnpm install` → ensure `node_modules/agentic-hq → <AHQ package root>` (a
symlink made from the explicit parameter) → `tsc` — identical for every
workflow wherever it lives (bundled in the AHQ package or in your local
workspace). Run by the [shared workflow runner](#shared-workflow-runner-scriptsrun-workflowcjs)
when `build-mode` is `build-first`, and by the release build for each bundled
workflow. Everything it writes stays inside that workflow's `ts-workflow/`;
nothing is ever written into the AHQ package.

### `build-mode` (`build-first` / `prebuilt`)

The mode of *the workflow being launched*: `build-first` = run the Workflow
Build, then run the workflow; `prebuilt` = just run it. The CLI sets it from the
root it discovered the workflow under — a [local workspace](#local-workspace)
workflow is always `build-first` (a workspace holds source); a workflow bundled
in the [AHQ package](#ahq-package) inherits the binary's mode (`build-first`
under `agentic-hq-dev`, `prebuilt` under the npm-installed `agentic-hq`).
Relayed verbatim across the Claude/skill hop (as `$1`) and forwarded to the
workflow program; only the shared runner acts on it. Modelled by the
`BuildMode` value object.

### Shared workflow runner (`scripts/run-workflow.cjs`)

The one script every workflow's `SKILL.md` returns a call to, with four
options: `--build-mode`, `--ahq-package-root` (the two chain variables, relayed
verbatim), `--workflow-dir` (the workflow's `ts-workflow/`, from the skill's own
directory) and `--workflow-js` (the compiled entry file, relative to it). The
terminus of the explicit parameter chain and the only code that acts on
`build-mode`. It never builds the framework and never executes from the
[staged release tree](#staged-release-tree-release).

### `ts-workflow/`

A workflow's TypeScript sub-project: `src/<skill-id>-cli.ts` (the program is
named after the skill directory / `skillId` by convention, so every `SKILL.md`
can be byte-identical) plus a standard, identical-everywhere file set — `package.json` (`commander`; dev `typescript`
and `@types/node`; **no** `agentic-hq` dependency, the Workflow Build's symlink
supplies it), `tsconfig.json` (emits `src` → `dist`), `.npmrc`,
`pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.gitignore`. `dist/` and
`node_modules/` are generated by the Workflow Build and gitignored. An
npm-installed (prebuilt) package ships only each bundled workflow's `src/`,
`dist/` and `tsconfig.json` — the install-time files are stripped so the
compiled JS resolves `agentic-hq` by Node package self-reference against the
package's own manifest.

### Staged release tree (`release/`)

The directory `pnpm build` (`scripts/build-release.cjs`) assembles: Framework
Build → Workflow Build for each bundled workflow → stage exactly what ships (the
generated manifest, the prebuilt bin wrapper, the runner and workflow-build
scripts, `dist/`, the shipped plugins with their `ts-workflow/dist/` and without
install files or `node_modules`, README/LICENSE). **Publish-only**:
`cd release && pnpm pack`; no dev run ever executes from it.

### `agentic-hq-dev` vs `agentic-hq`

The two binaries. **`agentic-hq-dev`** is the clone's dev binary, on PATH via
`npm link` from the repo root: it runs the Framework Build and then the compiled
CLI, with `build-mode` `build-first` — edit code or workflow files and run, no
build step to remember. **`agentic-hq`** is the npm-installed package's binary:
it just runs the compiled CLI, with `build-mode` `prebuilt`. Which binary you
invoked *is* the truth about the framework — nothing is detected or guessed —
and the distinct names let a linked clone and a registry install coexist.

---

## Where things live

| Term | Path |
|---|---|
| AHQ package root | the copy of AHQ you invoked — this checkout, or the npm-installed dir |
| Plugins dir | `.agentic-hq/plugins/` |
| Per-run temp dir | `.agentic-hq/temp/command-input-output-files/io-files-<ts>_<uuid>/` |
| `agentic-hq` CLI source | `src/cli/` |
| Execution engine | `src/tools/marshalled-io-tools/`, `src/io/` |
| Framework Build output | `<AHQ package root>/dist/` (`tsconfig.build.json`) |
| Workflow Build output | `<plugin>/skills/<workflow>/ts-workflow/dist/` |
| Build scripts | `scripts/build-workflow.cjs` (Workflow Build), `scripts/build-release.cjs` (release) |
| Shared workflow runner | `scripts/run-workflow.cjs` |
| Staged release tree | `release/` (publish-only) |

---

## See also

- [How Agentic HQ Works](dev/how-agentic-hq-works.md) — full architecture
  walkthrough using these terms.
- [Overview of Workflows](user-docs/workflow-descriptions/overview-of-workflows.md) —
  the shipped workflows, described in user terms.

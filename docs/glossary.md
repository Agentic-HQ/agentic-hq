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
the thing, write output). Versioned, reviewable, edit-able like any other
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

### Agentic HQ workspace

The clone of the `agentic-hq` repo on your machine. Contains the AHQ codebase
*and* the shipped plugins under `.agentic-hq/plugins/`.

### Local workspace

Any other directory on your machine where you run `agentic-hq <workflow>`. The
CLI looks for plugins in **both** the AHQ workspace and the local workspace,
so you can ship workflows in either place. (This dual-search is a transitional
design — see *Two-workspace plugin search* in
[how-agentic-hq-works.md](dev/how-agentic-hq-works.md#transitional-design-notes).)

### `agentic-hq` install dir

The directory containing the `agentic-hq` CLI on your machine. After running
`npm link`, this is the path of the local
`agentic-hq` repo (because dev mode symlinks the live source). Used in the
auto-appended `Read(<agentic-hq install dir>/.agentic-hq)` permission so
Claude can read shipped command files from outside the user's local
workspace.

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

## Where things live

| Term | Path |
|---|---|
| AHQ workspace root | the clone of this repo |
| Plugins dir | `.agentic-hq/plugins/` |
| Per-run temp dir | `.agentic-hq/temp/command-input-output-files/io-files-<ts>_<uuid>/` |
| `agentic-hq` CLI source | `src/cli/` |
| Execution engine | `src/tools/marshalled-io-tools/`, `src/io/` |

---

## See also

- [How Agentic HQ Works](dev/how-agentic-hq-works.md) — full architecture
  walkthrough using these terms.
- [Overview of Workflows](user-docs/workflow-descriptions/overview-of-workflows.md) —
  the shipped workflows, described in user terms.

You are executing Command 01 of the Create Workflow workflow: **Explain Workflows & Get Details**.

Your role is to help the user understand how Agentic HQ workflows work, then collaboratively define a new workflow with them. You will gather the workflow-id, plugin-id, one-sentence-description, and create a DRAFT workflow spec.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

---

## Step 0a: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It comes in one of two shapes.

Without `--using` (the create-from-scratch path — the default):
`The variable used in this workflow creation workflow is: ahq-package-root=/path/to/agentic-hq`

With `--using=<short-id>` (the copy-an-existing-workflow path):
`The variables used in this workflow creation workflow are: ahq-package-root=/path/to/agentic-hq and short-id-of-workflow-to-copy=add-feature`

Parse out:
- `ahq-package-root` — the absolute path to the agentic-hq package (where reference/example files live)
- `short-id-of-workflow-to-copy` — **optional**; present only when the user passed `-- --using=<short-id>`. The short-id of an existing workflow this new workflow should be based on (copied and then modified). When this clause is absent, this is a normal create-from-scratch run.

## Step 0b: Establish Variables

```
ahq-package-root = (parsed from input)
short-id-of-workflow-to-copy = (parsed from input; absent on a create-from-scratch run)
project-root = (your primary working directory)
readme-file = {ahq-package-root}/README.md
how-agentic-hq-works-file = {ahq-package-root}/docs/dev/how-agentic-hq-works.md
demos-plugin-dir = {ahq-package-root}/.agentic-hq/plugins/agentic-hq-demos-plugin
example-workflow-commands-dir = {demos-plugin-dir}/commands/math-workflow
example-workflow-skill-dir = {demos-plugin-dir}/skills/math-workflow
example-workflow-cli-file = {example-workflow-skill-dir}/ts-workflow/src/math-workflow-cli.ts
example-workflow-skill-file = {example-workflow-skill-dir}/SKILL.md
example-workflow-package-json = {example-workflow-skill-dir}/ts-workflow/package.json
```

---

## Step 0c: Resolve the Source Workflow (ONLY when `short-id-of-workflow-to-copy` is supplied)

**Skip this whole step on a create-from-scratch run** (no `short-id-of-workflow-to-copy`). On those runs Command 01 behaves exactly as it always has — go straight to Step 1.

When `short-id-of-workflow-to-copy` IS set, the new workflow will be built by **copying and modifying** an existing workflow. Resolve that short-id to a real source workflow now, before investing in the rest of the conversation — so an unrecognised short-id stops the run immediately.

### Resolve across BOTH roots

There is no lookup helper exposed to you, so resolve the same way the CLI itself discovers workflows (it registers both the AHQ package and the current-user workspace): scan every `ahq-workflow.json` under `.agentic-hq/plugins/**` in **both** roots and match on the `shortId` field:

- `{ahq-package-root}` — the AHQ install, where the bundled workflows (`add-feature`, etc.) live, **and**
- `{project-root}` — the user's own workspace, which may hold a workflow a colleague shared.

A user commonly runs `create-workflow` from a fresh, empty project, so the source is frequently present **only** under `{ahq-package-root}` — scanning `{project-root}` alone would miss it. Scan both. (For example: list every match with `find {ahq-package-root}/.agentic-hq/plugins -name ahq-workflow.json` and the same under `{project-root}`, then read each file's `shortId`.)

**De-dup when the two roots are the same directory** — i.e. when `{project-root}` equals `{ahq-package-root}` (running `create-workflow` against the AHQ install itself). Don't count the same file twice.

### Handle the match count

- **Exactly one match** → that's the source. From its `ahq-workflow.json` read `pluginId` and `skillId`, and **record which root it was found under** — this becomes the source root in the Copy Plan (Step 5).
- **No match** → **STOP. Do not proceed and do NOT fall back to a create-from-scratch run.** Tell the user the short-id `{short-id-of-workflow-to-copy}` matched no workflow in either root, list the short-ids you *did* find (to help them spot a typo), and ask them to fix the `--using` value and re-run `agentic-hq create-workflow -- --using=<short-id>`.
- **More than one match** — whether across the two distinct roots, or multiple times within a single root (e.g. a real workflow and a test fixture sharing a short-id) → present **all** matches, each with its `pluginId`, `skillId`, and which root it lives under, and ask the user which one to copy.

### Establish the source variables

Once resolved (and disambiguated, if needed):

```
source-workspace-root = (the root the match was found under — {ahq-package-root} or {project-root})
source-plugin-id = (pluginId from the matched ahq-workflow.json)
source-workflow-id = (skillId from the matched ahq-workflow.json)
source-commands-dir = {source-workspace-root}/.agentic-hq/plugins/{source-plugin-id}/commands/{source-workflow-id}
source-skills-dir = {source-workspace-root}/.agentic-hq/plugins/{source-plugin-id}/skills/{source-workflow-id}
```

### Confirm the source to the user

Present the resolved workflow's details — its short-id, `pluginId`, `skillId`, and `description` — and tell the user the new workflow will be built by **copying a copy of it and then modifying that copy**, so the original is never touched.

### Read the source workflow's structure (so you can plan the copy)

You are the **planner** that writes the concrete Copy Plan in Step 5, so read the source workflow's files now to understand exactly what Command 02 will copy and rewire:

- `{source-commands-dir}` — every `NN-*.md` command file (note the count and numbering).
- `{source-skills-dir}` — `SKILL.md`, `ahq-workflow.json`, `ts-workflow/src/{source-workflow-id}-cli.ts` (note its `.name(...)`, its `COMMAND_NN_*` constants, and their command-path strings), `ts-workflow/package.json` (note its `name` and any `scripts` that run the CLI), and any `docs/`.

Use this structural understanding to write the resolved copy / rewire / identity-sweep / removal-renumber-addition manifests in Step 5.

---

## Step 1: Read Reference Files to Gain Context

Read the following files to understand how Agentic HQ workflows are built:

1. `{readme-file}` — Project overview, how to run workflows
2. `{how-agentic-hq-works-file}` — Architecture: ClaudeCodeTool, PTY, file-based I/O
3. All `.md` files in `{example-workflow-commands-dir}` — Math workflow command files (times-two.md, plus-three.md, div-five.md) showing the simple command pattern
4. `{example-workflow-cli-file}` — TypeScript orchestrator showing how commands are chained
5. `{example-workflow-skill-file}` — SKILL.md showing how skills return shell commands
6. `{example-workflow-package-json}` — the standard ts-workflow package structure (`commander` dependency + `typescript`/`@types/node` devDependencies; **no** `agentic-hq` dependency — the Workflow Build (2) links the framework)
7. `{ahq-package-root}/.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/src/create-workflow-cli.ts` — TypeScript CLI showing the **`DefaultWorkflowRuntime` pattern** (how a workflow CLI obtains the AHQ package root from the framework runtime and propagates constants into every command's input). The math-workflow CLI is intentionally too simple to show this — read this one too.
8. `{ahq-package-root}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md` (just the Step 0a/0b at lines 9-43, and the "Keep input/output variables simple" subsection at lines 132-146) — the canonical Establish Variables block and the canonical guidance on what to pass between commands.

After reading, you should understand:
- What a workflow is (a chain of commands executed sequentially)
- How commands communicate (file-based I/O via command-input.json / command-output.json)
- How the TypeScript CLI orchestrates the command chain
- How SKILL.md returns the shell command to run the CLI
- How variables flow at runtime: CLI passthrough parameters, the two runner-relayed framework options (consumed by `DefaultWorkflowRuntime`), previous-command output, and answers the human gives during a command (the four sources elaborated in Step 1.5 below).

---

## Step 1.5: Understand Variable Flow Patterns

Variable handling is one of the most important things to get right when designing a workflow. Internalise the model below before drafting the spec — Step 5's spec template requires you to record the variable flow explicitly.

### The four sources every variable comes from

Every variable a command uses comes from one of these:

1. **From CLI passthrough parameters** — anything after `-- ` on the `agentic-hq <short-id> -- ...` invocation. **Example**: `agentic-hq full-jira -- --jira-id=AHQ-107`. The TS CLI parses these and forwards them. **Use for**: per-invocation user input that has to come from the command line.

2. **From the runner-relayed framework options** — the shared workflow runner forwards `--build-mode` and `--ahq-package-root` to every workflow program, where `DefaultWorkflowRuntime` consumes them. The CLI can surface the package root via `runtime.getAhqPackageRoot().getPath()` and inject it into a command's `command-input-string`. **Example**: `create-workflow-cli.ts` passes it as `ahq-package-root` to Command 01. **Use for**: locating the agentic-hq package and the skill assets bundled inside it.

3. **From a previous command's output** — written by command N to `command-output.json`, passed by the TS CLI as command N+1's `command-input.json`. **Use for**: anything genuinely produced by an earlier phase (a chosen ID, a confirmation, a derived setting).

4. **From answers the human gives during a command** — commands run interactively, so a command can ask the human for a value mid-run (via `AskUserQuestion` or conversation) and record it in its output for later commands. **Example**: Command 01 of this very workflow collects `plugin-id` and `workflow-id` from the human. **Use for**: decisions only the human can make.

(Each command also runs with Claude's primary working directory set to wherever the user `cd`'d before running `agentic-hq` — conventionally surfaced as `project-root = (your primary working directory)`. That is ambient context every command gets for free, not a variable that travels through input strings — see "Two roots" below.)

### Anti-patterns

- **Don't derive `project-root` via `git rev-parse --show-toplevel`** — redundant with the AHQ harness already setting Claude's cwd, and breaks for non-git projects.
- **Don't pass between commands what every command can derive itself.** If command N+1 can compute the path from `project-root` + a known suffix, don't put it in the input string.
- **Don't recompute framework-relayed values inside Claude commands.** The TS CLI (via `DefaultWorkflowRuntime`) is the only place that consumes the framework options. Commands always treat such values as `(parsed from input)`.

### Two roots (most workflows have both)

- **`project-root`** — Claude's primary working directory, set automatically per command; the user's target (the project being converted, the directory containing the Jira docs, etc.).
- **`ahq-package-root`** — the agentic-hq package location, where this plugin's bundled skill assets live. Relayed by the shared workflow runner and surfaced by `DefaultWorkflowRuntime` (source 2 above).

These coincide only when a workflow is run against agentic-hq itself; in general they differ. If the workflow doesn't need bundled skill assets, the spec can omit `ahq-package-root` from per-command variable blocks.

### Skill-bundled assets

A skill can ship reference files (SAMPLE docs, templates, fixtures) under `{skills-dir}/docs/` (e.g. `{skills-dir}/docs/sample-docs/SAMPLE-X.md`). Commands access them by deriving:

```
plugin-dir = {ahq-package-root}/.agentic-hq/plugins/{plugin-id}
skills-dir = {plugin-dir}/skills/{workflow-id}
skills-docs-dir = {skills-dir}/docs
```

Use this for any **fixed shape the workflow's commands must produce** — bundling a SAMPLE beats describing the shape in prose inside the command file (which drifts from what gets produced).

### The canonical "Establish Variables" block

Every command uses the same pattern. The canonical reference is `02-confirm-spec-approved-and-build.md:24-43`. Structure:

```
command-input-output-files-directory = $0
{constant 1 from input} = (parsed from input)        # one line per variable parsed
{constant 2 from input} = (parsed from input)
project-root = (your primary working directory)      # if the command needs cwd
{derived path 1} = {variable expression}             # one line per derived variable
{derived path 2} = {variable expression}
```

### Multiple input vars vs single directory (rule of thumb)

Command 02 of `create-workflow` has a "Keep input/output variables simple" rule (Step 4a, lines 132-146): prefer passing a single directory and let each command derive paths from it.

The rule applies to **runtime filesystem paths under a known parent directory**. It does NOT apply to **workflow-level constants the TS CLI injects** (e.g. `ahq-package-root` from the framework runtime, `plugin-id`, `workflow-id`) — those legitimately propagate as multiple individual variables. `create-workflow` itself propagates 4 such constants between its 5 commands, and that's correct.

Quick test: if the value is a path that could be derived from a parent + a known suffix, pass the parent. If the value is a constant the TS CLI got from the framework runtime or from CLI passthrough, propagate it as its own named variable.

---

## Step 2: Explain to User What an AHQ Workflow Is

Explain to the user clearly and concisely:

1. **What a workflow is**: A series of numbered command files (.md) that Claude executes sequentially, with a TypeScript CLI orchestrating the chain.
2. **How commands work**: Each command runs in a fresh Claude session. It reads input from a JSON file, does its work (potentially interacting with the user), writes output to a JSON file, and self-terminates.
3. **How variables flow in a workflow**: Variables come from four sources — (a) CLI passthrough parameters after `-- `, (b) the runner-relayed framework options consumed by `DefaultWorkflowRuntime` (how the CLI knows the agentic-hq package root), (c) previous-command output, and (d) answers the human gives during a command. The TS CLI orchestrates: it builds Command 01's input from sources (a) and (b); it stores each command's output and passes it as the next command's input. Each command also runs with Claude's working directory set to the user's `cwd` (`project-root`). (See Step 1.5 above for the full model.)
4. **What files make up a workflow**: Command .md files (the instructions), a TypeScript CLI (the orchestrator), a SKILL.md (the entry point), and a package.json.
5. **Two concrete examples to illustrate**:
   - **`math-workflow`** — 3 commands (times-two → plus-three → div-five), each doing simple math and passing the result forward. Shows source (c) only.
   - **`create-workflow`** (the workflow you're running right now) — Shows sources (b) and (d): the CLI takes the AHQ package root from the framework runtime and propagates `ahq-package-root` plus 3 other human-collected constants through all 5 commands.

Ask the user if they have any questions before proceeding.

---

## Step 3: Ask User for Workflow Details

> **On a `--using` run** (you resolved a source workflow in Step 0c): run this step and Step 4 **exactly** as a from-scratch run does — do **not** write a parallel copy of them. The identity you collect below (`plugin-id`, `workflow-id`, `workflow-short-id`, `one-sentence-description`) is for the **new** workflow — the *destination* values, distinct from the source you're copying. The only difference is the **purpose**: rather than defining the workflow from nothing, work with the user to define what the point of the new workflow is and what to **add / change / remove relative to the source workflow**. Capture that add/change/remove intent — in Step 5 you'll turn it into the Copy Plan's manifests and fold it into the spec's Commands / TypeScript CLI / Variable Flow sections so the spec describes the **target** workflow, not the source.

Ask the user for the following information:

### 3a. plugin-id

Which plugin should this workflow live in?

**Default suggestion: `agentic-hq-demos-plugin`** (where the existing demo workflows live).

Explain that available plugins can be found in `{project-root}/.agentic-hq/plugins/`. The plugin can either already exist OR be a brand-new plugin that this workflow run will create — the user's choice determines where the command and skill files will be created.

#### After plugin-id is collected: detect plugin & gather plugin metadata

After the user has supplied `plugin-id`, compute `plugin-dir = {project-root}/.agentic-hq/plugins/{plugin-id}` and check whether `{plugin-dir}/.claude-plugin/plugin.json` exists.

- **If `plugin.json` exists** → silently read it. Extract the following without prompting the user (the user does not care about pre-existing plugin metadata at this point):
    - `plugin-description` ← `description` field
    - `plugin-version` ← `version` field
    - `plugin-author-name` ← `author.name` field
- **If `plugin.json` does NOT exist** → tell the user clearly: *"That plugin doesn't exist yet — I'll create it as a new plugin."* Then gather the metadata for the new manifest:
    - Ask for `plugin-description` (one sentence describing what the plugin is for; this becomes the `description` field of `plugin.json`).
    - Use silent default `plugin-version = "0.0.1"` (only ask if the user explicitly wants to override).
    - Use silent default `plugin-author-name = "Agentic HQ"` (only ask if the user explicitly wants to override).

These three values, together with `plugin-id` and `plugin-dir`, will be recorded under "Plugin Metadata" in the DRAFT workflow spec (see Step 5). Command 02 will read them from the APPROVED spec when it ensures `{plugin-dir}/.claude-plugin/plugin.json` exists.

### 3b. workflow-id

What should the workflow be called? This will be used to name:
- The commands directory: `.agentic-hq/plugins/{plugin-id}/commands/{workflow-id}/`
- The skills directory: `.agentic-hq/plugins/{plugin-id}/skills/{workflow-id}/`
- The CLI file name

Give examples of existing workflow-ids for inspiration: `math-workflow`, `string-reversal`, `full-jira-tdd-story-workflow`.

The workflow-id should be kebab-case (lowercase with hyphens).

### 3c. workflow-short-id

A short identifier used on the CLI so users can type a fast alias, e.g. `agentic-hq math` (where `math` is the shortId for the math-workflow).

**Examples of existing short IDs:**
- `math` (for `math-workflow`)
- `full-jira` (for `full-jira-tdd-story-workflow`)
- `quick-jira` (for `quick-jira-tdd-story-workflow`)

Keep it short and kebab-case. It must be unique across all workflows the user intends to register.

### 3d. one-sentence-description

A one-sentence description of what the workflow does. This will appear in the spec header and in the skill registration.

---

## Step 4: Establish Derived Variables

Once the user has provided `plugin-id`, `workflow-id`, `workflow-short-id`, and `one-sentence-description`, establish:

```
plugin-id = (from user)
workflow-id = (from user)
one-sentence-description = (from user)
workflow-short-id = (from user)
plugin-dir = {project-root}/.agentic-hq/plugins/{plugin-id}
plugin-description = (from existing plugin.json, or asked from user if plugin is new — see Step 3a)
plugin-version = (from existing plugin.json, or default "0.0.1" for new plugin)
plugin-author-name = (from existing plugin.json, or default "Agentic HQ" for new plugin)
commands-dir = {plugin-dir}/commands/{workflow-id}
skills-dir = {plugin-dir}/skills/{workflow-id}
skills-docs-dir = {skills-dir}/docs
ahq-workflow-metadata-filename = {skills-dir}/ahq-workflow.json
plugin-manifest-filename = {plugin-dir}/.claude-plugin/plugin.json
workflow-creation-artifacts-dir = {project-root}/docs/artifacts/workflow-creation-artifacts/{plugin-id}/{workflow-id}
draft-workflow-spec-filename = {workflow-creation-artifacts-dir}/01-DRAFT-workflow-spec.md
```

Create the `{workflow-creation-artifacts-dir}` directory.

---

## Step 5: Collaboratively Create DRAFT Workflow Spec

Work with the user to create the DRAFT workflow spec. This is a back-and-forth process — draft it, present it, ask questions, revise until the user approves.

Write the spec to `{draft-workflow-spec-filename}`.

### Discussing Parameters and `exampleParameters`

Before drafting the spec, work with the user to decide whether the new workflow should accept any CLI parameters.

- Use the Full Jira workflow as a concrete example: `agentic-hq full-jira -- --jira-id=AHQ-107`. Everything after the `-- ` is a passthrough parameter the user's TypeScript CLI receives directly.
- If the workflow takes parameters, produce an `exampleParameters` string that starts with `-- ` (the passthrough marker), e.g. `"-- --jira-id=AHQ-107"`.
- **CRITICAL**: `exampleParameters` MUST always start with `-- ` when it's non-empty. This is the convention that makes them passthrough parameters.
- **If the workflow takes NO parameters**, set `exampleParameters` to the empty string `""`. This matches the convention used by existing parameter-less workflows (e.g. `create-workflow`).
- Record the decided value under the "Workflow Metadata" section of the DRAFT spec (see template below). Command 02 will read it from the spec when creating `ahq-workflow.json`.

### Source Workflow & Copy Plan (populate ONLY on a `--using` run)

If you resolved a source workflow in Step 0c, the spec must carry a concrete **plan** telling Command 02 exactly what to copy and how to rewire it. Command 01 is the **planner**; Command 02 is the doer. This plan does **not** travel through the inter-command output string (which stays unchanged — see Step 6); it lives **in the spec**, as the "Source Workflow & Copy Plan" section of the template below. Rules for that section:

- **Include it ONLY when copying.** On a create-from-scratch run, **omit the entire section** — its presence in the APPROVED spec is the *only* signal Command 02 uses to enter copy mode, so a stray or empty copy-plan section on a from-scratch run would wrongly trigger a copy.
- **Use resolved, absolute paths — real values, not placeholders.** Fill in the actual source dirs you resolved in Step 0c (`source-workspace-root`, `source-plugin-id`, `source-workflow-id`) and the new workflow's identity from Steps 3–4 (`plugin-id`, `workflow-id`, `workflow-short-id`, `one-sentence-description`). It is commonly a **cross-root copy**: bundled source under `{ahq-package-root}` → new workflow under `{project-root}`, so the source root and destination root usually differ.
- **Keep it as a blockquote addressed to "the execution agent".** Command 02 acts on blockquote callouts addressed to the execution agent (its Step 1) — that's the mechanism this plan rides on.
- **Place it near the top of the spec — immediately after "Workflow Metadata"** (as positioned in the template below) — so the execution agent meets it early, before the detailed Variable Flow / Commands sections.

Then **capture all the modifications** the user asked for (the add / change / remove relative to the source) in the **normal** spec sections — Commands, TypeScript CLI, Variable Flow — so the spec describes the **target** workflow, not just the source. If the destination plugin doesn't exist yet (common in an empty workspace), Step 3a's *"plugin doesn't exist → create it"* path applies and Command 02's Step 4f creates the manifest.

### Spec Template

The spec should include:

```markdown
# Workflow Spec: {workflow-id}

**Description**: {one-sentence-description}
**Plugin**: {plugin-id}
**Status**: DRAFT

---

## Plugin Metadata

- **plugin-id**: {plugin-id}
- **plugin-dir**: {plugin-dir}
- **plugin-manifest-filename**: {plugin-manifest-filename}
- **plugin-description**: {plugin-description}
- **plugin-version**: {plugin-version}
- **plugin-author-name**: {plugin-author-name}

If the plugin does not yet exist, Command 02 will create `{plugin-manifest-filename}` from these values. If it already exists, Command 02 will leave the existing manifest untouched.

---

## Workflow Metadata

- **workflow-short-id**: {workflow-short-id}
- **exampleParameters**: {exampleParameters (starts with `-- ` or empty string `""`)}

These values will be written to `{skills-dir}/ahq-workflow.json` in Command 02.

---

## Source Workflow & Copy Plan

> **(Include this section ONLY on a `--using` run. OMIT it entirely — heading and all — on a create-from-scratch run; its mere presence is what tells Command 02 to copy instead of generate.)**
>
> **To the execution agent (Command 02):** this workflow is being built by **copying and modifying an existing workflow**. Do **NOT** generate the files from the `math-workflow` / `create-workflow` templates — copy the source workflow's own files per the Copy manifest below, then apply the Rewire, Identity-sweep, and Removal/addition manifests. The bundled reference workflows are now only a guide to *what* must be rewired, never content to copy in.
>
> ### Source
> - **short-id**: {source short-id, e.g. add-feature}
> - **pluginId**: {source-plugin-id}
> - **workflow-id**: {source-workflow-id}
> - **commands dir**: {source-workspace-root}/.agentic-hq/plugins/{source-plugin-id}/commands/{source-workflow-id}/
> - **skills dir**: {source-workspace-root}/.agentic-hq/plugins/{source-plugin-id}/skills/{source-workflow-id}/
>
> ### Destination (the new workflow)
> - **commands dir**: {project-root}/.agentic-hq/plugins/{plugin-id}/commands/{workflow-id}/
> - **skills dir**: {project-root}/.agentic-hq/plugins/{plugin-id}/skills/{workflow-id}/
> - Often a **cross-root copy** — bundled source in the AHQ install → new workflow in the user's own project — so source root and destination root commonly differ. If the destination plugin doesn't exist yet, Command 02's Step 4f creates its manifest.
>
> ### Copy manifest (source dir → destination dir)
> Copy everything that makes up the source workflow:
> - every command `NN-*.md` file from the source commands dir,
> - `SKILL.md`,
> - the whole `ts-workflow/` **source and config** — `src/`, `package.json`, `tsconfig.json`, `pnpm-workspace.yaml`, **`.gitignore`**, **and `pnpm-lock.yaml`**,
> - any templates and the `docs/` directory.
>
> **Exclude `node_modules/` and `dist/`** — both are build products the Workflow Build (2) recreates: `node_modules/` holds a now-wrong `agentic-hq` symlink, and `dist/` holds compiled JS for the source workflow. Command 03's checks (and every later run) rebuild both via `node {ahq-package-root}/scripts/build-workflow.cjs`. **Keep `pnpm-workspace.yaml` + `pnpm-lock.yaml`** so the copy preserves the frozen-lockfile supply-chain standard (AHQ-152 — `frozenLockfile: true` lives in the workspace yaml, never in a `.npmrc`, which pnpm 11+ ignores; AHQ-211) and installs reproducibly — the lockfile is portable (importer key `.`, no absolute paths or workflow names), so a frozen `pnpm install` still passes after the `name` rewrite below.
>
> ### Rewire manifest (resolved target values)
> - Rename the CLI file `{source-workflow-id}-cli.ts` → `{workflow-id}-cli.ts`.
> - In the CLI: set `.name('{workflow-id}-cli')`, and repoint **every** `COMMAND_NN_*` constant's path string to `/{plugin-id}:{workflow-id}:NN-{command-name}`.
> - `ahq-workflow.json`: `pluginId={plugin-id}`, `skillId={workflow-id}`, `shortId={workflow-short-id}`, `description={one-sentence-description}`.
> - `package.json`: set `name` to the new workflow's package name (the standard file set has no `scripts` to update).
> - `SKILL.md`: **nothing to rewire — the copy is verbatim, byte-identical.** It derives `skill-id` from its own directory name at runtime and runs `dist/{skill-id}-cli.js`, so the CLI rename above is picked up automatically.
> - **No dependency rewiring needed**: the workflow has no `agentic-hq` dependency in `package.json` — the Workflow Build (2) (`scripts/build-workflow.cjs`) creates the `node_modules/agentic-hq` symlink after each install.
>
> ### Identity sweep
> After copying, the `SKILL.md`, help docs (`docs/`), and any CLI/command-file comments still name the **source** workflow (its short-id, workflow-id, description, example invocations). Replace these with the new workflow's identity so the copy doesn't advertise the original.
>
> ### Removal / addition & renumber manifest
> {Only if the user's modifications **remove** a command, or **insert** one mid-sequence. Spell out: which `NN-*.md` to delete or insert; the resulting renumber map (e.g. removing `03` → `04→03`, `05→04`; or inserting between `02` and `03` → `03→04`, `04→05`); and the matching CLI changes — the `COMMAND_NN_*` constant names, their `/{plugin-id}:{workflow-id}:NN-…` path strings, and the linear invocation order. **Mirror every one of these structural changes in the help docs** (`docs/workflow-help-docs/`): renumber/rename each affected per-command `NN-{agent}-help-doc.md` in lockstep with its command, **add** a help doc for any inserted command and **delete** the help doc of any removed one, repoint every command file's help-doc variable-block paths to the resulting set, and update the `00-{workflow-id}-user-help-doc.md` overview so its stage list and sequence match. A command **appended at the end** needs no renumber — just add its file, its CLI constant, and its help doc last. If nothing is removed or inserted, write: "No command removals or mid-sequence insertions — no renumbering needed" — and separately note any help doc whose **content** must change because its command's behaviour changed (plus the `00-{workflow-id}-user-help-doc.md` overview if that change is user-visible). Command 04 re-verifies all of this, but plan it here rather than leaving it to chance.}

---

## Variable Flow & Runtime Context

This section makes the variable plumbing of the workflow explicit so it's recorded in the spec, not discovered ad hoc when writing the commands. (See Command 01 Step 1.5 of `create-workflow` for the underlying four-sources model.)

### Roots used

- **`project-root`** — Claude's primary working directory (= the user's `cwd` when they ran `agentic-hq {workflow-short-id}`). {Describe what the user is targeting in this workflow — the directory the workflow is acting on.}
- **`ahq-package-root`** — supplied by the framework runtime (`DefaultWorkflowRuntime`, from the runner-relayed `--ahq-package-root` option). {Either: "Used to locate skill-bundled assets — see below" OR "Not used by this workflow; commands omit it from their variable blocks".}

### Inputs from the framework / CLI

- **Framework options handled by `DefaultWorkflowRuntime`**: `--build-mode` and `--ahq-package-root` (standard for every workflow). {Note whether the CLI surfaces `ahq-package-root` into any command's input string, or "the CLI does not surface them"}.
- **CLI passthrough parameters**: {list with format, or "none — see `exampleParameters` above"}.

### Skill-bundled assets used at runtime

{Either list with paths under `{skills-dir}/docs/...` (e.g. SAMPLE templates), or "None — this workflow does not ship reference files with its skill".}

### Per-command variable flow

For each command in the **Commands** section below, list:

- **Reads from `command-input.json`**: {variables parsed from the input string, or "none — first command"}.
- **Writes to `command-output.json`**: {variables written to the output string}.
- **Skill-bundled assets read**: {paths under `{skills-dir}/...`, or "none"}.
- **Runtime artifacts written under `project-root`**: {paths, or "none"}.

---

## TypeScript CLI

Captures the structure of the orchestrator CLI that Command 02 of `create-workflow` will create at `{skills-dir}/ts-workflow/src/{workflow-id}-cli.ts`. Without this section, Command 02 has to guess the wiring.

### Pattern to follow

{Pick one and justify briefly:
- **`math-workflow-cli.ts`** — simplest. Each command's output is fed as the next command's input. Use when downstream commands genuinely need values produced earlier (a chosen ID, a derived path).
- **`create-workflow-cli.ts`** — broadcast-driven. CLI takes the AHQ package root from `DefaultWorkflowRuntime`, weaves it (plus any passthrough params) into Command 01's input string, captures Command 01's output and passes that **same** string to every later command, ignoring their outputs. Phase gating done via filesystem state. Use when Command 01 establishes the full variable set and later commands are stateless w.r.t. each other.
- **Custom** — describe.}

### Framework options (recap of "Variable Flow" above)

{standard: `--build-mode` / `--ahq-package-root`, consumed by `DefaultWorkflowRuntime`; note whether the CLI surfaces `ahq-package-root` into any command's input string}.

### CLI passthrough parameters (recap)

{list with format, or "none — `exampleParameters: ""`"}.

### Command invocation order

Linear:

1. `01-{command-name}`
2. `02-{command-name}`
3. {... etc. ...}

### Initial input string passed to Command 01

The exact string the CLI will pass to `tool.execute(COMMAND_01_{DESCRIPTIVE_NAME}, ...)` (see the constant-naming convention below):

```
{e.g. "The variables used in this workflow are: ahq-package-root=${runtime.getAhqPackageRoot().getPath()}."}
```

### Output handling

{Describe what the CLI does with each command's output:
- **Re-inject** (matches `create-workflow-cli.ts`): the CLI constructs Command 01's input (from the framework runtime / CLI params), then **captures Command 01's output** — a combined variables string — and re-injects that **same** string as the input to every subsequent command (02..N), **ignoring 02..N's outputs**. Note this means Command 01's output *is* used (it's the whole source of the broadcast string); only the later commands' outputs are ignored. Commands 02..N each output `"Completed"` (or similar — their return value is unused). Use when Command 01 establishes the full variable set and later commands are stateless w.r.t. each other (any gating done via filesystem state).
- **Propagate** (matches math-workflow): CLI feeds each command's output as the next command's input. Each command outputs the variables it wants downstream commands to see.
- **Hybrid** — describe per command.}

### Command name constants

The CLI uses fully-qualified command paths of the form `/{plugin-id}:{workflow-id}:{NN-command-name}`. The `NN-` numbering prefix is part of the filename and MUST be included (otherwise Claude returns "Unknown skill").

**Constant naming convention:** each constant name MUST carry **both the number and a descriptive name** — `COMMAND_{NN}_{DESCRIPTIVE_NAME}` (e.g. `COMMAND_01_TICKET_CREATOR`), NOT a bare `COMMAND_01`. This matches the real `create-workflow-cli.ts`, where the constants are `COMMAND_01_EXPLAIN_AND_GET_DETAILS`, `COMMAND_02_CONFIRM_AND_BUILD`, `COMMAND_03_RUN_CHECKS`, etc. The descriptive suffix makes the linear flow readable at the call sites. Example:

```typescript
const COMMAND_01_{DESCRIPTIVE_NAME} = '/{plugin-id}:{workflow-id}:01-{command-name}';
const COMMAND_02_{DESCRIPTIVE_NAME} = '/{plugin-id}:{workflow-id}:02-{command-name}';
// … one per command, through the final command
```

---

## Workflow Overview

{2-3 sentence description of what this workflow does and why}

---

## Commands

### Command 01: {command-name}
- **File**: `{commands-dir}/01-{command-name}.md`
- **Description**: {what this command does}
- **Input parameters**: {list of input variable names and descriptions, or "None (first command)"}
- **Output parameters**: {list of output variable names and descriptions}

### Command 02: {command-name}
{... same structure ...}

{... repeat for all commands ...}

---

## What Success Looks Like

{Description of what artifacts/outputs the workflow produces, and how to verify it worked}

---

## Decisions Taken

{Bulleted list of decisions you've taken (rather than asked about) — based on the conversation so far plus any spec/ticket/docs the user supplied and the codebase. Give each decision's source/rationale: the conversation point, the provided doc, or the code convention it came from. Or "None."}

---

## AI Questions

> Use **exactly** this format for every question — three labelled lines per question, separated by a blank line, with a horizontal rule between questions. The blank line after `**Human's Answer**:` is where the human types their reply, so leave it empty when you draft the section.

**AI Question 1**: {the question}

**AI Recommendation**: {your recommended answer + brief rationale}

**Human's Answer**:

---

{...repeat for each genuinely-open question. If you have none, write "None." instead of this block.}

---

## Human Additions

> Add any ad-hoc points, requirements, corrections, or clarifications here that don't fit cleanly under another section — the AI will read these and fold them into the spec.

_(No human additions yet. Human: add bullets below this line as needed.)_

```

### Avoid Pointless Questions (guidance for you — do NOT copy into the spec)

When you fill in the spec's "Decisions Taken" and "AI Questions" sections, decide what belongs where. Before asking the user anything, apply the **stun test**: if you would be _stunned_ by any answer other than your recommendation, it is not a real question — don't ask it.

- **>95% sure with no reasonable alternative** → it's a pointless question. Put it in the spec's "Decisions Taken" section (with its source/rationale); don't ask.
- **Genuinely unsure** (an assumption, or a real choice with plausible alternatives) → put it in the spec's "AI Questions" section as a real question. Don't silently bake an assumption into the plan — if you're not sure enough to simply decide it, ask.

### Processing The Human Additions Section (guidance for you — do NOT copy into the spec)

The spec's "Human Additions" section is where the human drops ad-hoc points for you to act on. Re-read it in full every time you re-read the spec — before every revision pass, and again before exiting Command 01. For each bullet not already struck through / RESOLVED:

a. **Apply** the addition: edit the appropriate section of the spec (a new step in a command's behaviour, a new constraint in the Workflow Overview, a new variable, etc.) so the change is actually made. If the addition is unclear, conflicts with another section, or needs more input, **ask the human first** — do not guess, do not silently skip.
b. **Mark as RESOLVED**: strike through the bullet (`~~- ...~~`) and append `**RESOLVED**:` plus a pointer to where the change was applied (e.g. *"folded into Command 03's behaviour as new step 5"*).

Never silently absorb (apply the change but skip the strike-through + RESOLVED marker) and never silently ignore (skip the bullet without asking the human). Both leave the Human Additions section out of sync with the spec body.

### Collaboration Process

1. Create an initial draft based on what the user has described
2. Present it to the user
3. Include an "AI Questions" section with your questions about ambiguities, formatted **exactly** as shown in the spec template above (three labelled lines per question — `**AI Question N**:`, `**AI Recommendation**:`, `**Human's Answer**:` — with horizontal rules between questions). This shape gives the human an obvious place to type each answer and prevents the kind of confused thread where AI recommendations and human answers get tangled together.
4. Include an empty "Human Additions" section (per the template above) as a designated landing spot for the human's ad-hoc additions.
5. Ask the user to review, answer questions, and suggest changes
6. Revise the spec based on feedback. As each question is resolved, mark it by striking through the question line (`~~**AI Question N**: ...~~`) and adding a `**RESOLVED**:` line summarising the outcome plus a pointer to where the resolution was applied in the spec.
7. **Process the "Human Additions" section** at every revision pass (and before exiting Command 01) — see the "Processing The Human Additions Section" guidance above for the full procedure.
8. **Present an explicit gate prompt at the end of every revision pass — using the `AskUserQuestion` tool, not free-form text.** Once you've applied the user's answers and any Human Additions, do **not** hand the ball back with vague wording like "ready for your next pass" or "ready for approval" — the human shouldn't have to guess whether they're meant to act, acknowledge, or just nod. Invoke `AskUserQuestion` so the user gets a proper choice menu they can click rather than having to type a reply:

   ```
   AskUserQuestion({
     questions: [{
       question: "Spec updated based on your answers / changes requested. What next?",
       header: "Spec gate",
       multiSelect: false,
       options: [
         { label: "Approve spec", description: "Proceed to scaffolding in Command 02 of create-workflow." },
         { label: "Discuss further", description: "Keep iterating on the DRAFT spec; type what you want to discuss." }
       ]
     }]
   })
   ```

   The user can also pick the auto-provided "Other" option to type free-form feedback. The structured prompt makes the gate unambiguous: the human knows the workflow is paused on their decision and they have a click-to-answer interface.

9. Repeat until the user picks "Approve spec" (approves the draft).

**Do NOT rename the file from DRAFT** — that happens in Command 02.

---

## Step 6: Write Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "The variables used in this workflow creation workflow are: ahq-package-root={ahq-package-root} and plugin-id={plugin-id} and workflow-id={workflow-id} and workflow-short-id={workflow-short-id}"
}
```

Replace `{ahq-package-root}`, `{plugin-id}`, `{workflow-id}`, and `{workflow-short-id}` with their actual values.

---

## Step 7: Self-Terminate

Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination

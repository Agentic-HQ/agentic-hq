You are executing Command 02 of the Create Workflow workflow: **Confirm Spec Approved and Build**.

Your role is to confirm the DRAFT workflow spec with the user, rename it to APPROVED, then build the actual workflow files (commands, CLI, SKILL.md, package.json).

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

---

## Step 0a: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a string like:
`The variables used in this workflow creation workflow are: ahq-package-root=/path/to/agentic-hq and plugin-id=agentic-hq-demos-plugin and workflow-id=my-workflow and workflow-short-id=my`

Parse out:
- `ahq-package-root` — the absolute path to the agentic-hq package (where reference/example files live)
- `plugin-id` — the plugin where the workflow will live
- `workflow-id` — the workflow identifier
- `workflow-short-id` — the short CLI alias for the workflow (e.g. `math`, `full-jira`)

## Step 0b: Establish Variables

```
ahq-package-root = (parsed from input)
plugin-id = (parsed from input)
workflow-id = (parsed from input)
workflow-short-id = (parsed from input)
project-root = (your primary working directory)
plugin-dir = {project-root}/.agentic-hq/plugins/{plugin-id}
plugin-manifest-filename = {plugin-dir}/.claude-plugin/plugin.json
commands-dir = {plugin-dir}/commands/{workflow-id}
skills-dir = {plugin-dir}/skills/{workflow-id}
skills-docs-dir = {skills-dir}/docs
ahq-workflow-metadata-filename = {skills-dir}/ahq-workflow.json
workflow-creation-artifacts-dir = {project-root}/docs/artifacts/workflow-creation-artifacts/{plugin-id}/{workflow-id}
draft-workflow-spec-filename = {workflow-creation-artifacts-dir}/01-DRAFT-workflow-spec.md
approved-workflow-spec-filename = {workflow-creation-artifacts-dir}/02a-APPROVED-workflow-spec.md
plan-verbatim-copy-file = {workflow-creation-artifacts-dir}/02b-approved-workflow-plan-verbatim-copy.md
example-workflow-commands-dir = {ahq-package-root}/.agentic-hq/plugins/agentic-hq-demos-plugin/commands/math-workflow
example-workflow-skill-dir = {ahq-package-root}/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow
example-workflow-cli-file = {example-workflow-skill-dir}/ts-workflow/src/math-workflow-cli.ts
```

---

## Step 1: Read All Context

Read the following to gain full context:

1. **Previous command file**: `{ahq-package-root}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md` — to understand what Command 01 did
2. **All files in `{workflow-creation-artifacts-dir}`** — the DRAFT spec and any other docs created so far. **While reading the DRAFT spec, extract the values from the "Plugin Metadata" section** — they will be used in Step 4f to ensure the plugin manifest exists:
   - `plugin-description`
   - `plugin-version`
   - `plugin-author-name`

   Also: if the spec contains any blockquote callout addressed to **"the execution agent"**, that's instructions written specifically for YOU — read it carefully and act on it. In particular, a **"Source Workflow & Copy Plan"** section is such a callout — its presence means this is a *copy-an-existing-workflow* run (see "Determine the creation mode" below); its absence means a normal create-from-scratch run.
3. **Reference / source files for the build** — **what you read here depends on the creation mode** (determined just below):

   **`from-scratch` mode (no Copy Plan in the spec)** — read the bundled reference workflows as **templates**. Two are bundled with Agentic HQ; pick whichever matches the shape of the workflow you're building (or read both, if it spans both shapes):

   **A. Simple workflow — math-workflow** (3 sequential pure-data-transform commands, no user interaction, output of one feeds input of next):
   - All `.md` files in `{example-workflow-commands-dir}` — command file patterns
   - `{example-workflow-cli-file}` — TS CLI **propagation** pattern (each command's output → next command's input)
   - `{example-workflow-skill-dir}/SKILL.md` — SKILL.md pattern
   - `{example-workflow-skill-dir}/ts-workflow/package.json` — package.json pattern (`commander` dep + `typescript`/`@types/node` devDeps; no `agentic-hq` dep — the Workflow Build (2) links the framework)
   - `{example-workflow-skill-dir}/ts-workflow/pnpm-workspace.yaml` — pnpm-workspace.yaml pattern (per-directory `packages: ['.']` + `minimumReleaseAge`)
   - `{example-workflow-skill-dir}/ts-workflow/.npmrc` — `.npmrc` pattern (the `frozen-lockfile=true` supply-chain standard, AHQ-152). Copy this file **verbatim** into the new workflow in Step 4e.
   - `{example-workflow-skill-dir}/ts-workflow/.gitignore` — ignores the two build products (`node_modules/`, `dist/`)

   **B. Substantial workflow — create-workflow** (multiple commands with user interaction, plan mode, file-system gating, no output-propagation):
   - All `.md` files in `{ahq-package-root}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/` — command file patterns for substantial workflows
   - `{ahq-package-root}/.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/src/create-workflow-cli.ts` — TS CLI **re-inject** pattern (take the AHQ package root from `DefaultWorkflowRuntime`, build one input string, capture Command 01's output and pass that same string to every later command, ignoring their outputs; phase gating via filesystem state)

   The DRAFT spec's "TypeScript CLI" section tells you which CLI pattern to follow (propagation vs re-inject). When in doubt, study both.

   **`from-existing` mode (the spec has a Copy Plan)** — the **source workflow is the template**, so read **its** files at the **absolute paths the Copy Plan gives you** (the Plan's *Source* commands dir and skills dir): every `NN-*.md` command file, `SKILL.md`, `ts-workflow/src/{source-workflow-id}-cli.ts`, `ts-workflow/package.json`, and any `docs/`. Read the bundled reference workflows above **only as a guide to *what* gets rewired** (CLI constant paths, `package.json` `name`/scripts, SKILL.md CLI filename) — **never copy their content in**.

---

### Determine the creation mode (`from-scratch` vs `from-existing`)

The `--using` short-id never reaches this command via `command-input.json` (Command 01's output string is deliberately unchanged). The **only** signal that this is a copy run is the **presence of a "Source Workflow & Copy Plan" section in the spec** you just read. So set the mode now, right after reading the spec:

```
creation-mode = (spec contains a "Source Workflow & Copy Plan" section) ? from-existing : from-scratch
```

- **`from-scratch`** — no Copy Plan section. Behave exactly as this command always has: generate every file fresh from the `math-workflow` / `create-workflow` reference patterns.
- **`from-existing`** — the spec carries a Copy Plan. Build by **copying the source workflow's own files and rewiring them** (per that Plan), **not** by generating from the templates.

The two modes diverge at exactly **three** points downstream — Step 1's reference reading (item 3 above), Step 3 (plan mode), and the file-creation block in Step 4 (4a/4c/4d/4e vs the dedicated copy block **4-COPY**). **Everything else is shared and unbranched**: Step 0a/0b, Step 2 (rename), Step 4's Step 0 (plan-copy), 4b (`ahq-workflow.json`), 4f (plugin manifest), and Steps 5–7. Carry `creation-mode` forward and consult it at those three points only.

---

## Step 2: Confirm Spec with User

Present the DRAFT spec to the user and ask them to confirm:

> "Here is the DRAFT workflow spec from Command 01. Please review it one final time before I build the workflow.
>
> **Is this spec approved?** If you want changes, let me know. Otherwise, I'll rename it from DRAFT to APPROVED and proceed to build."

If the user wants changes, make them to the DRAFT file and ask again.

Once approved:
1. Rename `{draft-workflow-spec-filename}` to `{approved-workflow-spec-filename}` (change the file, update the status from DRAFT to APPROVED inside)
2. Tell the user: "Spec approved and renamed to APPROVED."

---

## Step 3: Enter Plan Mode

Use the `EnterPlanMode` tool to plan the implementation. **The shape of your plan depends on `creation-mode`** (set in Step 1).

**Item 0 is shared by both modes:**

0. Copying the Plan file (once approved) **verbatim** (exact copy, no modifications) to: `{plan-verbatim-copy-file}`

### If `creation-mode` = `from-scratch` — plan to generate from the templates

Your plan should cover:

1. **What command files to create** — one `.md` file per command defined in the spec, following the math-workflow command pattern
2. **`ahq-workflow.json`** — the workflow metadata file, placed at `{ahq-workflow-metadata-filename}`, containing the 7 required fields
3. **What the TypeScript CLI looks like** — command constants, linear flow, variable passing
4. **SKILL.md** — returns the shell command to run the CLI
5. **package.json + pnpm-workspace.yaml + `.npmrc` + `.gitignore`** — the standard file set: `commander` dependency + `typescript`/`@types/node` devDependencies (**no** `agentic-hq` dependency, no tsx, no postinstall — the Workflow Build (2) links the framework); a minimal per-directory `pnpm-workspace.yaml` carrying `packages: ['.']` and `minimumReleaseAge`; a `.npmrc` carrying `frozen-lockfile=true` (the AHQ-152 supply-chain standard every workflow ships); and a `.gitignore` for the build products (`node_modules/`, `dist/`)
6. **tsconfig.json** — standard emitting config (`rootDir: src`, `outDir: dist`, `sourceMap`)
7. **Plugin manifest (`{plugin-manifest-filename}`)** — created from the "Plugin Metadata" section of the APPROVED spec only if `{plugin-manifest-filename}` does not already exist (idempotent — never clobbers an existing manifest). Required for Claude Code's `--plugin-dir` flag to load the plugin's commands/skills.

For each command file, outline:
- The Step 0b variables block (full chain from plugin-id/workflow-id)
- The key steps the command performs
- What it reads for context
- What it outputs

### If `creation-mode` = `from-existing` — plan to execute the Copy Plan

Do **not** plan to generate files from the template. Plan to **execute the spec's "Source Workflow & Copy Plan"** (you'll do this in the dedicated **Step 4-COPY** block), in this order:

1. **Copy** every file/dir in the Plan's *Copy manifest* from the absolute **source** dirs to the absolute **destination** dirs (a cross-root copy when the source is in the AHQ install — the Plan's paths already account for that). Exclude `node_modules/` and `dist/` (build products).
2. **Rewire** the copied files per the Plan's *Rewire manifest*: rename the CLI file `{source-workflow-id}-cli.ts` → `{workflow-id}-cli.ts` (the `<skill-id>-cli.ts` convention); repoint every `COMMAND_NN_*` constant path to `/{plugin-id}:{workflow-id}:NN-…`; update `package.json` `name`. `SKILL.md` needs **no** rewiring — it is the byte-identical template and derives `skill-id` from its directory name at runtime.
3. **Identity sweep** per the Plan: replace the source workflow's identity (short-id, workflow-id, description, example invocations) in `SKILL.md`, help docs (`docs/`), and CLI/command-file comments with the new workflow's identity.
4. **Removal / addition & renumber** — only if the Plan's manifest lists any: delete/insert `NN-*.md` files, renumber so the sequence stays gapless, and rewire the CLI's `COMMAND_NN_*` constants + invocation order to match.
5. Plus the **shared** steps that run in both modes: **`ahq-workflow.json` (Step 4b)** — written fresh from the new workflow's identity, **not** copied; and the **plugin manifest (Step 4f)**.

Outline which source files map to which destination files, and the concrete rewire edits using the resolved target values already spelled out in the Copy Plan.

### Both modes

Present the plan to the user and get approval before building.

---

## Step 4: Build the Workflow

Once the plan is approved, create all the workflow files.

### Step 0: Copy the Approved Plan

Before building anything, copy the **plan file** (the one created during plan mode) **verbatim** (exact copy, no modifications) to:
`{plan-verbatim-copy-file}`

This preserves an immutable record of the approved implementation plan before building begins. This is the **plan**, not the spec — the spec is already saved as the APPROVED spec file.

### Choose the build path based on `creation-mode`

- **`from-existing`** → do **Step 4-COPY** (immediately below), then **skip 4a, 4c, 4d and 4e entirely** — the source workflow's own files replace what those steps would have generated. You still do the shared **4b** (`ahq-workflow.json`) and **4f** (plugin manifest).
- **`from-scratch`** → skip Step 4-COPY; do **4a → 4f** as written.

### Step 4-COPY: Copy and Rewire the Source Workflow (`from-existing` mode only)

> **Skip this entire block in `from-scratch` mode.**

This single block replaces the from-scratch file-generation steps 4a/4c/4d/4e. Execute the spec's **"Source Workflow & Copy Plan"** — you are the **doer**; Command 01 already resolved every path and target value, so do **not** re-resolve the short-id or re-derive paths. Copying a TypeScript workflow is **not** a plain `cp` — copy first, then rewire.

**1. Copy (the Copy manifest).** Create the destination `{commands-dir}` and `{skills-dir}` first, then copy every file/dir the Plan lists from its absolute **source** dirs to those absolute **destination** dirs — a cross-root copy when the source lives in the AHQ install (the Plan's paths already account for that). Copy: every command `NN-*.md`, `SKILL.md` (**verbatim, byte-identical — no substitutions**), the whole `ts-workflow/` **source and config** (`src/`, `package.json`, `tsconfig.json`, `pnpm-workspace.yaml`, `.npmrc`, `.gitignore`, **and `pnpm-lock.yaml`**), any templates, and the `docs/` directory. **Exclude `node_modules/` and `dist/`** — both are build products the Workflow Build (2) recreates (`node_modules/` holds a now-wrong `agentic-hq` symlink; `dist/` holds the source workflow's compiled JS). Keeping `.npmrc` + `pnpm-lock.yaml` preserves the frozen-lockfile supply-chain standard (AHQ-152) and a reproducible install.

> **The copied workflow runs in the new (often non-AHQ) workspace automatically.** The byte-identical `SKILL.md` template returns a command invoking the shared workflow runner, and the Workflow Build (2) (`scripts/build-workflow.cjs`, run by the runner in `build-first` mode) does `pnpm install`, creates the `node_modules/agentic-hq` symlink to the AHQ package root, and compiles into `dist/` — so the copy resolves the framework from any workspace and needs **no** dependency rewiring.

**2. Rewire (the Rewire manifest).** Apply the resolved target values from the Plan:
- Rename the CLI file `{source-workflow-id}-cli.ts` → `{workflow-id}-cli.ts` (the `<skill-id>-cli.ts` convention — the template `SKILL.md` runs `dist/{skill-id}-cli.js`, so the filename must match the skill directory name).
- In the CLI, set `.name('{workflow-id}-cli')` and repoint **every** `COMMAND_NN_*` constant's path to `/{plugin-id}:{workflow-id}:NN-{command-name}`. (Mis-numbered or mis-named constants are the classic break — Claude returns "Unknown skill" when a constant points at a filename that no longer exists.)
- `package.json`: set `name` to the new package name (the standard file set has no `scripts` to update).
- `SKILL.md`: **nothing to rewire — never edit the copied template.** It derives `skill-id` from its own directory name at runtime, so the CLI rename above is picked up automatically.

**3. Identity sweep (the Identity-sweep manifest).** The copied `SKILL.md`, help docs (`docs/`), and any CLI/command-file comments still name the **source** workflow (its short-id, workflow-id, description, example invocations). Replace these with the new workflow's identity so the copy doesn't advertise the original.

**4. Removal / addition & renumber (only if the Plan lists any).** Execute the Plan's manifest, using your workflow understanding to keep the result consistent:
- **Removal**: delete the removed command's `NN-*.md` file(s); **renumber** the remaining `NN-` files so the sequence stays gapless and contiguous (e.g. removing `03` shifts `04→03`, `05→04`); rewire the CLI to match — update the `COMMAND_NN_*` constant names, their `/{plugin-id}:{workflow-id}:NN-…` path strings, and the linear invocation order; carry the renumbering through any per-command references in the help docs. (Some removals are just *within* a command — then there's no file to delete and no renumbering.)
- **Addition**: a command **appended at the end** needs no renumber — add its `NN-*.md` and its `COMMAND_NN_*` constant last. A command **inserted mid-sequence** uses the same renumber machinery in reverse — shift the later `NN-` files up to make room (`03→04`, `04→05`, …), then rewire the CLI's `COMMAND_NN_*` constant names, path strings, and invocation order to match.

**5. Apply the spec's other modifications.** Beyond the mechanical rewire, apply any additions/changes the spec's Commands / TypeScript CLI / Variable Flow sections describe (new behaviour in a command, a changed input string, etc.).

After Step 4-COPY, **continue at Step 4b** (`ahq-workflow.json`) — do **not** run 4a/4c/4d/4e.

### 4a. Create Command Files

> **`from-scratch` mode only.** In `from-existing` mode the command files were copied and rewired in Step 4-COPY — skip 4a.

For each command defined in the approved spec, create a `.md` file in `{commands-dir}/`.

Each command file should follow this structure:
- `## Intro To Give The Agent Context` — agent-facing context (see "#### The `## Intro To Give The Agent Context` section" below for the full convention — **required in every command of every workflow**)
- `command-input-output-files-directory = $0`
- `## Step 0a: Read Input` (parse variables from command-input.json)
- `## Step 0b: Establish Variables` (full self-contained variable chain)
- `## Step 1: Validate Input`, `## Step 2: Check Pre-requisites`, then `## Step 3…N` — the actual work
- Write Output step
- Self-Terminate step (`/agentic-hq-core-plugin:self-termination`)

#### The `## Intro To Give The Agent Context` section (required in every command)

Every command's opening section MUST be a heading literally titled `## Intro To Give The Agent Context`. This replaces the old free-form "introduction" paragraph and is **mandatory for every command in every workflow from now on**.

**What it is — and is NOT:**
- It is **context written for the agent** (the fresh Claude session running this command), **NOT** copy to be shown to the user. The wording addresses the agent ("Your responsibility is…", "You are the 3rd of 5 agents…").
- It is **NOT an instruction or a Step**. `## Step 0a: Read Input` is the first actual step the agent performs. The Intro carries no numbered steps and no task instructions — those all live under the `## Step …` headings.

**The point of it:** each command runs in a brand-new Claude session with no memory of the other commands. The Intro is what orients that fresh agent — it tells it what situation it has woken up into, where it sits in the overall chain (which agents ran before it and which come after), and what it is responsible for — *before* it starts doing any work. A well-written Intro is the difference between an agent that understands its place in the workflow and one that blindly follows steps.

**Rules for every command's Intro:**
- It **must begin with one sentence explaining what the workflow is and what system runs it** — what this whole workflow does, and that it is run by the **Agentic HQ framework, which automates AI command workflows** (chaining multiple Claude Code commands together so each agent does its part and hands its work on to the next). Keep this opening sentence the **same in every command** of the workflow, so a fresh agent — which has no memory of the other commands — always knows what it has woken up into.
- It then states this agent's single responsibility, beginning "**As the &lt;Agent Name&gt; your responsibility is …**" — a crisp statement of the agent's single responsibility, naming the agent so a fresh session immediately knows which role it is playing (e.g. "As the Planner your responsibility is to work with the human to produce the Implementation Plan — the tests, and the minimal code those tests drive — without writing any production code yourself").
- It then gives the background and where this agent sits in the flow: state the total count and this agent's position (e.g. "the **third** of 7 agents"), and name the agents immediately before and after it **together with what each contributes** — what the previous agent has handed this one, and what the next agent does with this one's output (e.g. "the Interrogator before you has established a shared understanding of the feature, and the Executor after you turns the plan you write into working code"). This hand-off framing orients the agent far better than a bare list of names.
- It must contain **no** task instructions or numbered steps.
- It **ends by instructing the agent to introduce itself to the user** with a **single sentence** describing its role.

**Worked example — read this before writing your Intros:** `{ahq-package-root}/.agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature-detailed-example/03-planner.md` contains a complete, real `## Intro To Give The Agent Context` section that follows every rule above — its opening workflow + Agentic-HQ-framework sentence, its "As the Planner your responsibility is …" line, and its before/after hand-off framing. Read that file's Intro and mirror its shape for each command you build. (The inline examples in the bullets above are quoted verbatim from that file — keep them in sync if it changes.)

Commands beyond the first should include a context-loading step that reads:
- Previous command files (to understand the overall workflow)
- All files in `{workflow-creation-artifacts-dir}` (process docs)
- Any generated workflow code

#### Keep input/output variables simple

When designing what gets passed between commands, prefer passing a **single directory or path** that each command can derive its own filenames from. Each command knows its own naming convention and can construct the paths it needs.

**Anti-pattern** — passing every file path individually between commands:
```
Input: "session-dir=/path/to/session and check-in-file-path=/path/to/session/01-check-in.md and exploration-file-path=/path/to/session/02-explore.md and reframe-file-path=/path/to/session/03-reframe.md"
```
This is verbose, error-prone, and scales poorly as you add more commands.

**Preferred** — pass a single directory and let each command derive what it needs:
```
Input: "session-dir=/path/to/session"
```
Each command then constructs `{session-dir}/01-check-in.md`, `{session-dir}/02-explore.md`, etc. on its own.

**Exception — workflow-level constants the TS CLI injects**: things like `ahq-package-root` (taken from the framework runtime by the TS CLI), `plugin-id`, and `workflow-id` legitimately propagate as multiple individual variables. They aren't filesystem paths derivable from a parent directory — they're separate constants. `create-workflow` itself propagates 4 such constants between its 5 commands and that's correct. The "single directory, derive paths" rule applies to **runtime filesystem paths under a known parent**, not to constants the TS CLI got from the framework runtime or from CLI passthrough parameters. See Command 01 Step 1.5 for the full model.

### 4b. Create ahq-workflow.json

> **Both modes** (shared — not branched). This is the authoritative `ahq-workflow.json` step. In `from-existing` mode, write it **fresh from the new workflow's identity** here — do **not** rely on any copied source `ahq-workflow.json`; if a recursive copy brought one across, this step overwrites it. Because every field below comes from the new workflow's variables, the result is identical whether the workflow was generated or copied. (This is why `ahq-workflow.json` is **not** in the Copy Plan's copy manifest.)

Create the workflow metadata file at `{ahq-workflow-metadata-filename}` (i.e. `{skills-dir}/ahq-workflow.json`).

**Source for each field:**
- `pluginId` — the `plugin-id` variable.
- `skillId` — the `workflow-id` variable.
- `shortId` — the `workflow-short-id` variable.
- `description` — the `one-sentence-description` from the APPROVED spec header.
- `exampleParameters` — read from the "Workflow Metadata" section of `{approved-workflow-spec-filename}`. If the spec records it as empty (`""`), write an empty string. **When non-empty, the value MUST start with `-- `** — if it doesn't, fix the spec before proceeding (this indicates the `-- ` prefix convention wasn't applied in Command 01).
- `version` — constant `"1.0.0"` for new workflows.
- `author.name` — constant `"Agentic HQ"` for new workflows.

**Template:**

```json
{
  "pluginId": "{plugin-id}",
  "skillId": "{workflow-id}",
  "shortId": "{workflow-short-id}",
  "description": "{one-sentence-description}",
  "exampleParameters": "{exampleParameters-from-spec}",
  "version": "1.0.0",
  "author": {
    "name": "Agentic HQ"
  }
}
```

After writing the file, verify it contains valid JSON and all seven fields are present.

### 4c. Create TypeScript CLI

> **`from-scratch` mode only.** In `from-existing` mode the CLI was copied and rewired (renamed file, repointed `COMMAND_NN_*` paths) in Step 4-COPY — skip 4c.

Create the orchestrator CLI at `{skills-dir}/ts-workflow/src/{workflow-id}-cli.ts`.

> **WARNING — Command name constants in the TypeScript CLI MUST include the numbering prefix:**
> When defining the `const COMMAND_XX = '...'` strings in the TypeScript CLI file, the command name
> is derived from the `.md` filename: strip `.md`, replace `/` with `:`, and prefix with `/{plugin-id}:`.
> You MUST include the `01-`, `02-`, etc. numbering prefix — it is part of the filename and therefore part of the command name.
>
> **Correct TypeScript**: `const COMMAND_01 = '/my-plugin:my-workflow:01-do-first-thing';` (matches `commands/my-workflow/01-do-first-thing.md`)
> **WRONG TypeScript**: `const COMMAND_01 = '/my-plugin:my-workflow:do-first-thing';` (missing `01-` prefix — Claude will say "Unknown skill")
>
> Look at the actual filenames you created in step 4a and use them **exactly** in your TypeScript constants.

Follow the math-workflow-cli.ts pattern (the `DefaultWorkflowRuntime` pattern — read that file as *the* reference):
- Import `Command` from commander and `DefaultWorkflowRuntime` from `agentic-hq/tools/claude-code`
- Construct the runtime from raw argv (`new DefaultWorkflowRuntime(process.argv)`) and get the tool from it (`runtime.getClaudeCodeTool()`) — the runtime consumes the framework's `--build-mode` / `--ahq-package-root` options so the CLI contains only workflow code
- Define constants for each command path
- Simple linear flow: execute commands sequentially
- Pass variables between commands as plain English strings
- End with `program.parse(runtime.getWorkflowArgs())` (the framework options already stripped)

### 4d. Create SKILL.md

> **`from-scratch` mode only.** In `from-existing` mode `SKILL.md` was copied, rewired (CLI filename) and identity-swept in Step 4-COPY — skip 4d.

**Copy** `{example-workflow-skill-dir}/SKILL.md` **verbatim** to `{skills-dir}/SKILL.md` — **never author or edit a SKILL.md**. Every workflow ships the same byte-identical template: it derives `skill-id` from its own directory name at runtime and returns a command invoking the shared workflow runner on `dist/{skill-id}-cli.js`, so it needs **no** per-workflow substitutions. (That is also why the CLI filename must follow the `{workflow-id}-cli.ts` convention from 4c.) After copying, verify the copy is byte-identical to the source (e.g. compare `shasum` output).

### 4e. Create package.json, pnpm-workspace.yaml, .npmrc, .gitignore and tsconfig.json

> **`from-scratch` mode only.** In `from-existing` mode these were all copied (and `package.json` rewired — `name`) in Step 4-COPY — skip 4e.

Create the standard ts-workflow file set — `{skills-dir}/ts-workflow/package.json`, `pnpm-workspace.yaml`, `.npmrc`, `.gitignore` and `tsconfig.json` — following the math-workflow reference files (Step 1's list):

- **`package.json`** — copy the math-workflow one and fix `name`: `commander` dependency + `typescript`/`@types/node` devDependencies, **no** `agentic-hq` dependency (the Workflow Build (2) symlinks the framework), no tsx, no `scripts`.
- **`tsconfig.json`** — the standard **emitting** config (`rootDir: src`, `outDir: dist`, `sourceMap: true`); the Workflow Build compiles `src/` into `dist/`.
- **`pnpm-workspace.yaml`** — required under pnpm 11 so a plain `pnpm install` run in the `ts-workflow` directory treats it as its own workspace root (pnpm stops at the nearest `pnpm-workspace.yaml`). Follow the math-workflow pattern: `packages: ['.']` plus `minimumReleaseAge` (the AHQ-152 supply-chain cooldown). Nothing else — the standard dependency set needs no build-script approvals.
- **`.npmrc`** — carries `frozen-lockfile=true`, the AHQ-152 supply-chain standard **every** workflow ships, so dependency-version changes stay deliberate and visible in `package.json` / `pnpm-lock.yaml` diffs. Copy it **verbatim** from the math-workflow reference (`{example-workflow-skill-dir}/ts-workflow/.npmrc`) — do not hand-write it. A freshly-scaffolded workflow has **no `pnpm-lock.yaml` yet**, and that's fine: pnpm only enforces `frozen-lockfile` against an *existing, out-of-sync* lockfile, so the first `pnpm install` (run by the Workflow Build in Command 03's checks) installs cleanly and generates the lockfile; later installs are then frozen against it.
- **`.gitignore`** — copy the math-workflow one: the two build products (`node_modules/`, `dist/`).

### 4f. Ensure Plugin Manifest Exists

Some workflows are scaffolded into a brand-new plugin (one that didn't exist before this `create-workflow` run). For those cases the Claude Code plugin manifest also needs to exist or Claude Code's `--plugin-dir` flag won't load the plugin's commands/skills.

Check whether `{plugin-manifest-filename}` (i.e. `{plugin-dir}/.claude-plugin/plugin.json`) exists.

- **If it does NOT exist** → create it. Use the values extracted from the APPROVED spec's "Plugin Metadata" section in Step 1:

  ```json
  {
    "name": "{plugin-id}",
    "description": "{plugin-description}",
    "version": "{plugin-version}",
    "author": {
      "name": "{plugin-author-name}"
    }
  }
  ```

  Tell the user clearly: *"Created new plugin: {plugin-id} (manifest at `{plugin-manifest-filename}`)"*.

- **If it already exists** → leave it untouched. Tell the user: *"Plugin already exists; manifest left as-is."*

This step is idempotent — it MUST NOT clobber an existing `plugin.json`. After this step, both the plugin directory and its manifest are guaranteed to exist, so Claude Code's `--plugin-dir` flag will discover the new workflow's commands/skills.

---

## Step 5: Build Summary and Human Review Gate

The build is complete. Before letting the workflow advance to Command 03 (`run-checks-on-workflow`), give the human one last look.

### 5a. Print a build summary inline

Tell the user, in this order:

1. **What was built** — the workflow-id and plugin-id, plus a one-line confirmation that scaffolding finished cleanly.
2. **Files written** — a flat list with absolute paths, grouped:
   - **Command files**: every `{commands-dir}/NN-...md` (generated in Step 4a, or copied/renumbered in Step 4-COPY).
   - **Skill files**: `{ahq-workflow-metadata-filename}`, the TypeScript CLI, `{skills-dir}/SKILL.md`, the `ts-workflow/package.json`, the `ts-workflow/pnpm-workspace.yaml`, the `ts-workflow/.npmrc`, the `ts-workflow/.gitignore`, the `ts-workflow/tsconfig.json`.
   - **Plugin manifest**: either the path to the newly-created `{plugin-manifest-filename}` (if Step 4f created it) **or** the literal note "left untouched (already existed)".
   - **Plan-verbatim copy**: `{plan-verbatim-copy-file}`.
3. **APPROVED spec location**: `{approved-workflow-spec-filename}` — point the user there in case they want to re-read the spec while reviewing the generated files.
4. **Pointers to where to look** — tell the user the two directories that contain everything they should review: `{commands-dir}` and `{skills-dir}`.

Keep the summary compact (no walls of text — paths + counts).

### 5b. Ask the human to review and gate the next step

Use the `AskUserQuestion` tool to present a structured choice — not a free-form prompt. The user clicks an option rather than typing. Exact shape:

```
AskUserQuestion({
  questions: [{
    question: "Build complete. Please review the generated command files and TypeScript CLI under {commands-dir}/ and {skills-dir}/. What next?",
    header: "Build review",
    multiSelect: false,
    options: [
      {
        label: "Approve And Move To Next 03-run-checks-on-workflow.md Command",
        description: "All looks good. Write command-output.json and self-terminate; the orchestrator will then run Command 03 (run-checks-on-workflow)."
      },
      {
        label: "Discuss Problems Or Improvements/Changes Identified",
        description: "Pause here. Tell me what to change. I'll iterate; the orchestrator will NOT advance until you re-approve."
      }
    ]
  }]
})
```

Substitute `{commands-dir}` and `{skills-dir}` with the resolved paths in the actual question text so the user sees the absolute locations.

### 5c. Branch on the answer

- **If the user picks "Approve And Move To Next 03-run-checks-on-workflow.md Command"** (or selects "Other" with an unambiguous approval) → continue to Step 6 (Write Output) and Step 7 (Self-Terminate).

- **If the user picks "Discuss Problems Or Improvements/Changes Identified"** → engage with their feedback. Iterate on whatever they raise (edit command files, fix the TS CLI, tweak the SKILL.md, etc.). After each iteration, re-present the same `AskUserQuestion` gate. Loop until they pick "Approve".

  **CRITICAL — abandon-path semantics**: while the user is in the "Discuss" branch and has not yet approved, do **NOT** write `command-output.json`, do **NOT** call the self-termination skill. Self-terminating would let the TS CLI orchestrator advance to Command 03 against an unapproved build. If the user wants to fully abandon (not just iterate), tell them: *"Stopping. Hit Ctrl-C multiple times in a row to also kill the TypeScript Workflow program — that will halt the chain so Command 03 doesn't run on this build."*

  Only proceed past this gate when the user has explicitly picked "Approve".

---

## Step 6: Write Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "{workflow-id}"
}
```

---

## Step 7: Self-Terminate

Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination

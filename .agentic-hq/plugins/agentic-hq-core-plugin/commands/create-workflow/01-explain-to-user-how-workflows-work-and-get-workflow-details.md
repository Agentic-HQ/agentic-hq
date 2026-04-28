You are executing Command 01 of the Create Workflow workflow: **Explain Workflows & Get Details**.

Your role is to help the user understand how Agentic HQ workflows work, then collaboratively define a new workflow with them. You will gather the workflow-id, plugin-id, one-sentence-description, and create a DRAFT workflow spec.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

---

## Step 0a: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a string like:
`The variable used in this workflow creation workflow is: agentic-hq-workspace-root-dir=/path/to/agentic-hq`

Parse out:
- `agentic-hq-workspace-root-dir` — the absolute path to the Agentic HQ workspace (where reference/example files live)

## Step 0b: Establish Variables

```
agentic-hq-workspace-root-dir = (parsed from input)
project-root = (your primary working directory)
readme-file = {agentic-hq-workspace-root-dir}/README.md
how-agentic-hq-works-file = {agentic-hq-workspace-root-dir}/docs/dev/how-agentic-hq-works.md
demos-plugin-dir = {agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-demos-plugin
example-workflow-commands-dir = {demos-plugin-dir}/commands/math-workflow
example-workflow-skill-dir = {demos-plugin-dir}/skills/math-workflow
example-workflow-cli-file = {example-workflow-skill-dir}/ts-workflow/src/math-workflow-demo-cli.ts
example-workflow-skill-file = {example-workflow-skill-dir}/SKILL.md
example-workflow-package-json = {example-workflow-skill-dir}/ts-workflow/package.json
```

---

## Step 1: Read Reference Files to Gain Context

Read the following files to understand how Agentic HQ workflows are built:

1. `{readme-file}` — Project overview, how to run workflows
2. `{how-agentic-hq-works-file}` — Architecture: ClaudeCodeTool, PTY, file-based I/O
3. All `.md` files in `{example-workflow-commands-dir}` — Math workflow command files (times-two.md, plus-three.md, div-five.md) showing the simple command pattern
4. `{example-workflow-cli-file}` — TypeScript orchestrator showing how commands are chained
5. `{example-workflow-skill-file}` — SKILL.md showing how skills return shell commands
6. `{example-workflow-package-json}` — Package structure with link: protocol
7. `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/src/create-workflow-cli.ts` — TypeScript CLI showing the **`AGENTIC_HQ_WORKSPACE_ROOT` env-var pattern** (how a workflow CLI reads from the user's environment and propagates constants into every command's input). The math-workflow CLI is intentionally too simple to show this — read this one too.
8. `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md` (just the Step 0a/0b at lines 9-43, and the "Keep input/output variables simple" subsection at lines 132-146) — the canonical Establish Variables block and the canonical guidance on what to pass between commands.

After reading, you should understand:
- What a workflow is (a chain of commands executed sequentially)
- How commands communicate (file-based I/O via command-input.json / command-output.json)
- How the TypeScript CLI orchestrates the command chain
- How SKILL.md returns the shell command to run the CLI
- How variables flow at runtime: env vars (read by the CLI), CLI passthrough parameters, Claude's primary working directory, and previous-command output (the four sources elaborated in Step 1.5 below).

---

## Step 1.5: Understand Variable Flow Patterns

Variable handling is one of the most important things to get right when designing a workflow. Internalise the model below before drafting the spec — Step 5's spec template requires you to record the variable flow explicitly.

### The four sources every variable comes from

Every variable a command uses comes from one of these:

1. **From the user's environment** — env vars read by the workflow's TypeScript CLI via `process.env.X` and then injected into every command's `command-input-string`. **Example**: `create-workflow-cli.ts:43-49` reads `AGENTIC_HQ_WORKSPACE_ROOT` and passes it as `agentic-hq-workspace-root-dir` to Command 01. **Use for**: install-time constants (paths to AHQ itself, paths to credentials, etc.).

2. **From CLI passthrough parameters** — anything after `-- ` on the `agentic-hq <short-id> -- ...` invocation. **Example**: `agentic-hq full-jira -- --jira-id=AHQ-107`. The TS CLI parses these and forwards them. **Use for**: per-invocation user input that has to come from the command line.

3. **From Claude's primary working directory** — set automatically per command. Conventionally surfaced as `project-root = (your primary working directory)`. This is wherever the user `cd`'d before running `agentic-hq`. **Use for**: the directory the user is targeting (the project being converted, the directory containing the Jira docs, etc.).

4. **From a previous command's output** — written by command N to `command-output.json`, passed by the TS CLI as command N+1's `command-input.json`. **Use for**: anything genuinely produced by an earlier phase (a chosen ID, a confirmation, a derived setting).

### Anti-patterns

- **Don't derive `project-root` via `git rev-parse --show-toplevel`** — redundant with the AHQ harness already setting Claude's cwd, and breaks for non-git projects.
- **Don't pass between commands what every command can derive itself.** If command N+1 can compute the path from `project-root` + a known suffix, don't put it in the input string.
- **Don't recompute env-var-derived values inside Claude commands.** The TS CLI is the only place that reads `process.env`. Commands always treat such values as `(parsed from input)`.

### Two roots (most workflows have both)

- **`project-root`** — Claude's primary working directory; the user's target.
- **`agentic-hq-workspace-root-dir`** — the AHQ install location, where this plugin's bundled skill assets live. Read from `AGENTIC_HQ_WORKSPACE_ROOT`.

These coincide only when a workflow is run against agentic-hq itself; in general they differ. If the workflow doesn't need bundled skill assets, the spec can omit `agentic-hq-workspace-root-dir` from per-command variable blocks.

### Skill-bundled assets

A skill can ship reference files (SAMPLE docs, templates, fixtures) under `{skills-dir}/docs/` (e.g. `{skills-dir}/docs/sample-docs/SAMPLE-X.md`). Commands access them by deriving:

```
plugin-dir = {agentic-hq-workspace-root-dir}/.agentic-hq/plugins/{plugin-id}
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

The rule applies to **runtime filesystem paths under a known parent directory**. It does NOT apply to **install-time constants the TS CLI reads from the user's environment** (e.g. `agentic-hq-workspace-root-dir`, `plugin-id`, `workflow-id`) — those legitimately propagate as multiple individual variables. `create-workflow` itself propagates 4 such constants between its 5 commands, and that's correct.

Quick test: if the value is a path that could be derived from a parent + a known suffix, pass the parent. If the value is a constant the TS CLI got from `process.env` or from CLI passthrough, propagate it as its own named variable.

---

## Step 2: Explain to User What an AHQ Workflow Is

Explain to the user clearly and concisely:

1. **What a workflow is**: A series of numbered command files (.md) that Claude executes sequentially, with a TypeScript CLI orchestrating the chain.
2. **How commands work**: Each command runs in a fresh Claude session. It reads input from a JSON file, does its work (potentially interacting with the user), writes output to a JSON file, and self-terminates.
3. **How variables flow in a workflow**: Variables come from four sources — (a) the user's environment via env vars read by the workflow's TS CLI, (b) CLI passthrough parameters after `-- `, (c) Claude's primary working directory (the user's `cwd`), and (d) previous-command output. The TS CLI orchestrates: it reads env vars and forwards them in every command's input; it stores each command's output and passes it as the next command's input. (See Step 1.5 above for the full model.)
4. **What files make up a workflow**: Command .md files (the instructions), a TypeScript CLI (the orchestrator), a SKILL.md (the entry point), and a package.json.
5. **Two concrete examples to illustrate**:
   - **`math-workflow`** — 3 commands (times-two → plus-three → div-five), each doing simple math and passing the result forward. Shows source (d) only.
   - **`create-workflow`** (the workflow you're running right now) — Shows source (a): the CLI reads `AGENTIC_HQ_WORKSPACE_ROOT` and propagates `agentic-hq-workspace-root-dir` plus 3 other constants through all 5 commands.

Ask the user if they have any questions before proceeding.

---

## Step 3: Ask User for Workflow Details

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
workflow-creation-docs-dir = {project-root}/docs/workflow-creation-docs/{plugin-id}/{workflow-id}
draft-workflow-spec-filename = {workflow-creation-docs-dir}/01-DRAFT-workflow-spec.md
```

Create the `{workflow-creation-docs-dir}` directory.

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

## Variable Flow & Runtime Context

This section makes the variable plumbing of the workflow explicit so it's recorded in the spec, not discovered ad hoc when writing the commands. (See Command 01 Step 1.5 of `create-workflow` for the underlying four-sources model.)

### Roots used

- **`project-root`** — Claude's primary working directory (= the user's `cwd` when they ran `agentic-hq {workflow-short-id}`). {Describe what the user is targeting in this workflow — the directory the workflow is acting on.}
- **`agentic-hq-workspace-root-dir`** — read by the TS CLI from `AGENTIC_HQ_WORKSPACE_ROOT`. {Either: "Used to locate skill-bundled assets — see below" OR "Not used by this workflow; commands omit it from their variable blocks".}

### Inputs from the environment / CLI

- **Env vars consumed by the TS CLI**: {list, e.g. `AGENTIC_HQ_WORKSPACE_ROOT`, or "none beyond the standard"}.
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
- **`math-workflow-demo-cli.ts`** — simplest. Each command's output is fed as the next command's input. Use when downstream commands genuinely need values produced earlier (a chosen ID, a derived path).
- **`create-workflow-cli.ts`** — env-var-driven. CLI reads an env var, constructs one input string, passes the **same** string to every command, ignores per-command outputs. Phase gating done via filesystem state. Use when commands are stateless w.r.t. each other and gating is on disk.
- **Custom** — describe.}

### Env vars consumed (recap of "Variable Flow" above)

{list, e.g. `AGENTIC_HQ_WORKSPACE_ROOT` (required — CLI exits with error if unset)}.

### CLI passthrough parameters (recap)

{list with format, or "none — `exampleParameters: ""`"}.

### Command invocation order

Linear:

1. `01-{command-name}`
2. `02-{command-name}`
3. {... etc. ...}

### Initial input string passed to Command 01

The exact string the CLI will pass to `tool.execute(COMMAND_01, ...)`:

```
{e.g. "The variables used in this workflow are: agentic-hq-workspace-root-dir=${agenticHqWorkspaceRoot}."}
```

### Output handling

{Describe what the CLI does with each command's output:
- **Re-inject** (matches `create-workflow-cli.ts`): CLI ignores command outputs; each command receives the same constructed input string. Each command outputs `"Completed"` (or similar — value is unused).
- **Propagate** (matches math-workflow): CLI feeds each command's output as the next command's input. Each command outputs the variables it wants downstream commands to see.
- **Hybrid** — describe per command.}

### Command name constants

The CLI uses fully-qualified command paths of the form `/{plugin-id}:{workflow-id}:{NN-command-name}`. The `NN-` numbering prefix is part of the filename and MUST be included (otherwise Claude returns "Unknown skill"). Example:

```typescript
const COMMAND_01 = '/{plugin-id}:{workflow-id}:01-{command-name}';
const COMMAND_02 = '/{plugin-id}:{workflow-id}:02-{command-name}';
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

## AI Questions

> Use **exactly** this format for every question — three labelled lines per question, separated by a blank line, with a horizontal rule between questions. The blank line after `**Human's Answer**:` is where the human types their reply, so leave it empty when you draft the section.

**AI Question 1**: {the question}

**AI Recommendation**: {your recommended answer + brief rationale}

**Human's Answer**:

---

**AI Question 2**: {the question}

**AI Recommendation**: {your recommended answer + brief rationale}

**Human's Answer**:

---

{...repeat for each question. If you have no questions, write "None." instead of this block.}

---

## Human Additions

> The human will use this section to add ad-hoc points, requirements, corrections, or clarifications that don't fit cleanly under any other section. The AI MUST scan this section every time it re-reads the spec (e.g. before each revision pass, before transitioning to plan mode in Command 02, before scaffolding command files). Every entry here must either be folded into the appropriate section of the spec (and then struck through here with a `**RESOLVED**:` pointer) or explicitly acknowledged with the human before being skipped — never silently absorbed and never silently ignored.

_(No human additions yet. Human: add bullets below this line as needed.)_

```

### Collaboration Process

1. Create an initial draft based on what the user has described
2. Present it to the user
3. Include an "AI Questions" section with your questions about ambiguities, formatted **exactly** as shown in the spec template above (three labelled lines per question — `**AI Question N**:`, `**AI Recommendation**:`, `**Human's Answer**:` — with horizontal rules between questions). This shape gives the human an obvious place to type each answer and prevents the kind of confused thread where AI recommendations and human answers get tangled together.
4. Include an empty "Human Additions" section (per the template above) as a designated landing spot for the human's ad-hoc additions.
5. Ask the user to review, answer questions, and suggest changes
6. Revise the spec based on feedback. As each question is resolved, mark it by striking through the question line (`~~**AI Question N**: ...~~`) and adding a `**RESOLVED**:` line summarising the outcome plus a pointer to where the resolution was applied in the spec.
7. **Processing the Human Additions section** — before every revision pass, and again before exiting Command 01, re-read the "Human Additions" section in full. For each bullet that is not already struck through / RESOLVED, follow this two-step procedure in order:
   a. **Apply** the addition: edit the appropriate section of the spec (a new step in a command's Behaviour outline, a new constraint in the Workflow Overview, a new variable in the canonical block, etc.) so the change is actually made. If the addition is unclear, conflicts with another section, or needs more input, **ask the human first** — do not guess, do not silently skip.
   b. **Mark as RESOLVED**: strike through the bullet (`~~- ...~~`) and append `**RESOLVED**:` plus a pointer to where in the spec the change was applied (e.g. *"folded into Command 03's Behaviour outline as new step 5"*).

   Never silently absorb (apply the change but skip the strike-through + RESOLVED marker) and never silently ignore (skip the bullet without asking the human). Both leave the Human Additions section out of sync with the spec body.
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
  "command-output-string": "The variables used in this workflow creation workflow are: agentic-hq-workspace-root-dir={agentic-hq-workspace-root-dir} and plugin-id={plugin-id} and workflow-id={workflow-id} and workflow-short-id={workflow-short-id}"
}
```

Replace `{agentic-hq-workspace-root-dir}`, `{plugin-id}`, `{workflow-id}`, and `{workflow-short-id}` with their actual values.

---

## Step 7: Self-Terminate

Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination

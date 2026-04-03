You are executing Command 02 of the Create Workflow workflow: **Confirm Spec Approved and Build**.

Your role is to confirm the DRAFT workflow spec with the user, rename it to APPROVED, then build the actual workflow files (commands, CLI, SKILL.md, package.json).

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

---

## Step 0a: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a string like:
`The variables used in this workflow creation workflow are: agentic-hq-workspace-root-dir=/path/to/agentic-hq and plugin-id=agentic-hq-demos-plugin and workflow-id=my-workflow`

Parse out:
- `agentic-hq-workspace-root-dir` — the absolute path to the Agentic HQ workspace (where reference/example files live)
- `plugin-id` — the plugin where the workflow will live
- `workflow-id` — the workflow identifier

## Step 0b: Establish Variables

```
agentic-hq-workspace-root-dir = (parsed from input)
plugin-id = (parsed from input)
workflow-id = (parsed from input)
project-root = (your primary working directory)
plugin-dir = {project-root}/.agentic-hq/plugins/{plugin-id}
commands-dir = {plugin-dir}/commands/{workflow-id}
skills-dir = {plugin-dir}/skills/{workflow-id}
skills-docs-dir = {skills-dir}/docs
workflow-creation-docs-dir = {project-root}/docs/workflow-creation-docs/{plugin-id}/{workflow-id}
draft-workflow-spec-filename = {workflow-creation-docs-dir}/01-DRAFT-workflow-spec.md
approved-workflow-spec-filename = {workflow-creation-docs-dir}/02a-APPROVED-workflow-spec.md
plan-verbatim-copy-file = {workflow-creation-docs-dir}/02b-approved-workflow-plan-verbatim-copy.md
example-workflow-commands-dir = {agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-demos-plugin/commands/math-workflow
example-workflow-skill-dir = {agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow
example-workflow-cli-file = {example-workflow-skill-dir}/ts-workflow/src/math-workflow-demo-cli.ts
```

---

## Step 1: Read All Context

Read the following to gain full context:

1. **Previous command file**: `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md` — to understand what Command 01 did
2. **All files in `{workflow-creation-docs-dir}`** — the DRAFT spec and any other docs created so far
3. **Example workflow files** for patterns:
   - All `.md` files in `{example-workflow-commands-dir}` — command file patterns
   - `{example-workflow-cli-file}` — TypeScript CLI pattern
   - `{example-workflow-skill-dir}/SKILL.md` — SKILL.md pattern
   - `{example-workflow-skill-dir}/ts-workflow/package.json` — package.json pattern

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

Use the `EnterPlanMode` tool to plan the implementation. Your plan should cover:

0. Copying the Plan file (once approved) **verbatim** (exact copy, no modifications) to: `{plan-verbatim-copy-file}`
1. **What command files to create** — one `.md` file per command defined in the spec, following the math-workflow command pattern
2. **What the TypeScript CLI looks like** — command constants, linear flow, variable passing
3. **SKILL.md** — returns the shell command to run the CLI
4. **package.json** — dependencies (agentic-hq via link:, tsx, commander)
5. **tsconfig.json** — standard config

For each command file, outline:
- The Step 0b variables block (full chain from plugin-id/workflow-id)
- The key steps the command performs
- What it reads for context
- What it outputs

Present the plan to the user and get approval before building.

---

## Step 4: Build the Workflow

Once the plan is approved, create all the workflow files.

### Step 0: Copy the Approved Plan

Before building anything, copy the **plan file** (the one created during plan mode) **verbatim** (exact copy, no modifications) to:
`{plan-verbatim-copy-file}`

This preserves an immutable record of the approved implementation plan before building begins. This is the **plan**, not the spec — the spec is already saved as the APPROVED spec file.

### 4a. Create Command Files

For each command defined in the approved spec, create a `.md` file in `{commands-dir}/`.

Each command file should follow this structure:
- Introduction explaining what this command does
- `command-input-output-files-directory = $0`
- Step 0a: Read Input (parse variables from command-input.json)
- Step 0b: Establish Variables (full self-contained variable chain)
- Steps 1-N: The actual work
- Write Output step
- Self-Terminate step (`/agentic-hq-core-plugin:self-termination`)

Commands beyond the first should include a context-loading step that reads:
- Previous command files (to understand the overall workflow)
- All files in `{workflow-creation-docs-dir}` (process docs)
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

### 4b. Create TypeScript CLI

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

Follow the math-workflow-demo-cli.ts pattern:
- Import `Command` from commander and `DefaultClaudeCodeTool` from agentic-hq
- Define constants for each command path
- Simple linear flow: execute commands sequentially
- Pass variables between commands as plain English strings

### 4c. Create SKILL.md

Create `{skills-dir}/SKILL.md` following the math-workflow SKILL.md pattern:
- `disable-model-invocation: true`
- Returns shell command to install deps and run CLI via tsx

### 4d. Create package.json and tsconfig.json

Create `{skills-dir}/ts-workflow/package.json` and `{skills-dir}/ts-workflow/tsconfig.json` following the existing patterns.

---

## Step 5: Write Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "{workflow-id}"
}
```

---

## Step 6: Self-Terminate

Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination

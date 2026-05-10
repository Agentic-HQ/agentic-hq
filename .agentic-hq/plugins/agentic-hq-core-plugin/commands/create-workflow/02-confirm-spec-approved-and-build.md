You are executing Command 02 of the Create Workflow workflow: **Confirm Spec Approved and Build**.

Your role is to confirm the DRAFT workflow spec with the user, rename it to APPROVED, then build the actual workflow files (commands, CLI, SKILL.md, package.json).

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

---

## Step 0a: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a string like:
`The variables used in this workflow creation workflow are: agentic-hq-workspace-root-dir=/path/to/agentic-hq and plugin-id=agentic-hq-demos-plugin and workflow-id=my-workflow and workflow-short-id=my`

Parse out:
- `agentic-hq-workspace-root-dir` — the absolute path to the Agentic HQ workspace (where reference/example files live)
- `plugin-id` — the plugin where the workflow will live
- `workflow-id` — the workflow identifier
- `workflow-short-id` — the short CLI alias for the workflow (e.g. `math`, `full-jira`)

## Step 0b: Establish Variables

```
agentic-hq-workspace-root-dir = (parsed from input)
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
example-workflow-commands-dir = {agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-demos-plugin/commands/math-workflow
example-workflow-skill-dir = {agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow
example-workflow-cli-file = {example-workflow-skill-dir}/ts-workflow/src/math-workflow-demo-cli.ts
```

---

## Step 1: Read All Context

Read the following to gain full context:

1. **Previous command file**: `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md` — to understand what Command 01 did
2. **All files in `{workflow-creation-artifacts-dir}`** — the DRAFT spec and any other docs created so far. **While reading the DRAFT spec, extract the values from the "Plugin Metadata" section** — they will be used in Step 4f to ensure the plugin manifest exists:
   - `plugin-description`
   - `plugin-version`
   - `plugin-author-name`

   Also: if the spec contains any blockquote callout addressed to **"the execution agent"**, that's instructions written specifically for YOU — read it carefully and act on it.
3. **Example workflow files** for patterns. Two reference workflows are bundled with Agentic HQ — pick whichever matches the shape of the workflow you're building (or read both, if the workflow spans both shapes):

   **A. Simple workflow — math-workflow** (3 sequential pure-data-transform commands, no user interaction, output of one feeds input of next):
   - All `.md` files in `{example-workflow-commands-dir}` — command file patterns
   - `{example-workflow-cli-file}` — TS CLI **propagation** pattern (each command's output → next command's input)
   - `{example-workflow-skill-dir}/SKILL.md` — SKILL.md pattern
   - `{example-workflow-skill-dir}/ts-workflow/package.json` — package.json pattern

   **B. Substantial workflow — create-workflow** (multiple commands with user interaction, plan mode, file-system gating, no output-propagation):
   - All `.md` files in `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/` — command file patterns for substantial workflows
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/src/create-workflow-cli.ts` — TS CLI **re-inject** pattern (read env var once, build one input string, pass it to every command, ignore each command's output; phase gating via filesystem state)

   The DRAFT spec's "TypeScript CLI" section tells you which CLI pattern to follow (propagation vs re-inject). When in doubt, study both.

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
2. **`ahq-workflow.json`** — the workflow metadata file, placed at `{ahq-workflow-metadata-filename}`, containing the 7 required fields
3. **What the TypeScript CLI looks like** — command constants, linear flow, variable passing
4. **SKILL.md** — returns the shell command to run the CLI
5. **package.json** — dependencies (agentic-hq via link:, tsx, commander)
6. **tsconfig.json** — standard config
7. **Plugin manifest (`{plugin-manifest-filename}`)** — created from the "Plugin Metadata" section of the APPROVED spec only if `{plugin-manifest-filename}` does not already exist (idempotent — never clobbers an existing manifest). Required for Claude Code's `--plugin-dir` flag to load the plugin's commands/skills.

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

**Exception — install-time constants from the user's environment**: things like `agentic-hq-workspace-root-dir` (read from `AGENTIC_HQ_WORKSPACE_ROOT` by the TS CLI), `plugin-id`, and `workflow-id` legitimately propagate as multiple individual variables. They aren't filesystem paths derivable from a parent directory — they're separate constants. `create-workflow` itself propagates 4 such constants between its 5 commands and that's correct. The "single directory, derive paths" rule applies to **runtime filesystem paths under a known parent**, not to constants the TS CLI got from `process.env` or from CLI passthrough parameters. See Command 01 Step 1.5 for the full model.

### 4b. Create ahq-workflow.json

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

### 4d. Create SKILL.md

Create `{skills-dir}/SKILL.md` following the math-workflow SKILL.md pattern:
- `disable-model-invocation: true`
- Returns shell command to install deps and run CLI via tsx

### 4e. Create package.json and tsconfig.json

Create `{skills-dir}/ts-workflow/package.json` and `{skills-dir}/ts-workflow/tsconfig.json` following the existing patterns.

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
   - **Command files**: every `{commands-dir}/NN-...md` written in Step 4a.
   - **Skill files**: `{ahq-workflow-metadata-filename}`, the TypeScript CLI, `{skills-dir}/SKILL.md`, the `ts-workflow/package.json`, the `ts-workflow/tsconfig.json`.
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

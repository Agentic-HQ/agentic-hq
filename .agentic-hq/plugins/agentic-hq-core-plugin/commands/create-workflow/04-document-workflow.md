You are executing Command 04 of the Create Workflow workflow: **Document Workflow**.

Your role is to create user-facing documentation that explains how to use the workflow that was built in the previous commands.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

---

## Step 0a: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a string like:
`The variables used in this workflow creation workflow are: agentic-hq-workspace-root-dir=/path/to/agentic-hq and plugin-id=agentic-hq-demos-plugin and workflow-id=my-workflow and workflow-short-id=my`

Parse out:
- `agentic-hq-workspace-root-dir` — the absolute path to the Agentic HQ workspace (where reference/example files live)
- `plugin-id` — the plugin where the workflow lives
- `workflow-id` — the workflow identifier
- `workflow-short-id` — the short CLI alias for the workflow

## Step 0b: Establish Variables

```
agentic-hq-workspace-root-dir = (parsed from input)
plugin-id = (parsed from input)
workflow-id = (parsed from input)
workflow-short-id = (parsed from input)
project-root = (your primary working directory)
plugin-dir = {project-root}/.agentic-hq/plugins/{plugin-id}
commands-dir = {plugin-dir}/commands/{workflow-id}
skills-dir = {plugin-dir}/skills/{workflow-id}
skills-docs-dir = {skills-dir}/docs
ahq-workflow-metadata-filename = {skills-dir}/ahq-workflow.json
workflow-creation-artifacts-dir = {project-root}/docs/artifacts/workflow-creation-artifacts/{plugin-id}/{workflow-id}
approved-workflow-spec-filename = {workflow-creation-artifacts-dir}/02a-APPROVED-workflow-spec.md
user-facing-help-doc-filename = {skills-docs-dir}/user-facing-help-doc.md
```

---

## Step 1: Read All Context

Read the following to gain full context:

1. **Previous command files**:
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md`
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md`
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/03-run-checks-on-workflow.md`
2. **Workflow metadata file**: `{ahq-workflow-metadata-filename}` — read this JSON file and extract the following fields, which will be surfaced in the user-facing help doc in Step 2:
   - `shortId` — the short CLI alias
   - `description` — the one-sentence description
   - `exampleParameters` — the example invocation parameters (starts with `-- ` when non-empty, or an empty string `""` for parameterless workflows)
   - `version` — the workflow version
   - `author.name` — the author name
3. **All files in `{workflow-creation-artifacts-dir}`** — spec, approval list, refactorings, etc.
4. **All generated workflow code**:
   - All files in `{commands-dir}` — the command .md files
   - All files in `{skills-dir}` — SKILL.md, CLI .ts, package.json, tsconfig.json

---

## Step 2: Create User-Facing Help Documentation

Create the directory `{skills-docs-dir}` if it doesn't exist.

Create `{user-facing-help-doc-filename}` with clear, user-friendly documentation. Use the values extracted from `{ahq-workflow-metadata-filename}` in Step 1 (`shortId`, `description`, `exampleParameters`, `version`, `author.name`) to populate the placeholders marked `[from ahq-workflow.json]` below:

```markdown
# {workflow-id} Workflow

{description — from ahq-workflow.json}

**Version**: {version — from ahq-workflow.json}
**Author**: {author.name — from ahq-workflow.json}
**CLI short alias**: `{shortId — from ahq-workflow.json}`

---

## What This Workflow Does

{2-3 paragraph explanation of what the workflow does, written for someone who has never used it before}

---

## How to Run

Run the workflow using the short alias (the `shortId` from `ahq-workflow.json`):

```
agentic-hq {shortId — from ahq-workflow.json} {exampleParameters — from ahq-workflow.json}
```

{If `exampleParameters` is an empty string, omit the trailing space and note that this workflow takes no parameters. If non-empty, explain what each parameter means.}

IMPORTANT: Only emit the `shortId` form — do NOT also emit an `agentic-hq {workflow-id} ...` line. The `agentic-hq` CLI registers each workflow under its `shortId` only, so the full `workflow-id` is not a runnable command. (This note is for you, the command author — do not repeat this rationale in the user-facing doc.)

---

## Verify It's Installed

Run `agentic-hq list` from the workspace root to confirm the workflow is registered. Your new workflow will appear under its plugin (`{plugin-id}`). Example output (abridged — other plugins and workflows will also appear):

```
$ agentic-hq list
Available workflows:

Agentic HQ Workspace (directory: /path/to/your/agentic-hq):-
Plugin: {plugin-id}
Workflows:
...
agentic-hq {shortId — from ahq-workflow.json} {exampleParameters — from ahq-workflow.json}
   What it does: {description — from ahq-workflow.json}
...
```

If the workflow does not appear, check that `{ahq-workflow-metadata-filename}` exists and is valid JSON.

---

## What to Expect

The workflow runs through the following steps:

1. **Command 01: {name}** — {brief description of what happens and any user interaction required}
2. **Command 02: {name}** — {brief description}
{... for all commands ...}

---

## Files Created

The workflow creates the following files/directories:

- {list of output files/directories with descriptions}

---

## Tips

- {Any useful tips for getting the best results from this workflow}
```

Present the documentation to the user for review. Make any requested changes.

---

## Step 3: Write Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "{workflow-id}"
}
```

---

## Step 4: Self-Terminate

Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination

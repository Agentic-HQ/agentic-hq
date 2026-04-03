You are executing Command 04 of the Create Workflow workflow: **Document Workflow**.

Your role is to create user-facing documentation that explains how to use the workflow that was built in the previous commands.

Remember the following variable you will use in the rest of this command: command-input-output-files-directory = $0 (This is the temp directory containing the command input and output files)

---

## Step 0a: Read Input

Read the file: {command-input-output-files-directory}/command-input.json

Extract the `command-input-string` value. It will be a string like:
`The variables used in this workflow creation workflow are: agentic-hq-workspace-root-dir=/path/to/agentic-hq and plugin-id=agentic-hq-demos-plugin and workflow-id=my-workflow`

Parse out:
- `agentic-hq-workspace-root-dir` — the absolute path to the Agentic HQ workspace (where reference/example files live)
- `plugin-id` — the plugin where the workflow lives
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
approved-workflow-spec-filename = {workflow-creation-docs-dir}/02a-APPROVED-workflow-spec.md
user-facing-help-doc-filename = {skills-docs-dir}/user-facing-help-doc.md
```

---

## Step 1: Read All Context

Read the following to gain full context:

1. **Previous command files**:
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md`
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md`
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/03-run-checks-on-workflow.md`
2. **All files in `{workflow-creation-docs-dir}`** — spec, approval list, refactorings, etc.
3. **All generated workflow code**:
   - All files in `{commands-dir}` — the command .md files
   - All files in `{skills-dir}` — SKILL.md, CLI .ts, package.json, tsconfig.json

---

## Step 2: Create User-Facing Help Documentation

Create the directory `{skills-docs-dir}` if it doesn't exist.

Create `{user-facing-help-doc-filename}` with clear, user-friendly documentation:

```markdown
# {workflow-id} Workflow

{one-sentence-description from the spec}

---

## What This Workflow Does

{2-3 paragraph explanation of what the workflow does, written for someone who has never used it before}

---

## How to Run

{Exact command(s) to run the workflow, based on how it's registered}

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

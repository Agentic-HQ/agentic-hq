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

After reading, you should understand:
- What a workflow is (a chain of commands executed sequentially)
- How commands communicate (file-based I/O via command-input.json / command-output.json)
- How the TypeScript CLI orchestrates the command chain
- How SKILL.md returns the shell command to run the CLI
- How variables are passed between commands as plain English strings

---

## Step 2: Explain to User What an AHQ Workflow Is

Explain to the user clearly and concisely:

1. **What a workflow is**: A series of numbered command files (.md) that Claude executes sequentially, with a TypeScript CLI orchestrating the chain.
2. **How commands work**: Each command runs in a fresh Claude session. It reads input from a JSON file, does its work (potentially interacting with the user), writes output to a JSON file, and self-terminates.
3. **How variables pass between commands**: The CLI stores output from one command and passes it as input to the next, using plain English strings like "Your variables are workflow-id = my-workflow".
4. **What files make up a workflow**: Command .md files (the instructions), a TypeScript CLI (the orchestrator), a SKILL.md (the entry point), and a package.json.
5. **Use the math-workflow as a concrete example** to illustrate: 3 commands (times-two → plus-three → div-five), each doing simple math and passing the result forward.

Ask the user if they have any questions before proceeding.

---

## Step 3: Ask User for Workflow Details

Ask the user for the following information:

### 3a. plugin-id

Which plugin should this workflow live in?

**Default suggestion: `agentic-hq-demos-plugin`** (where the existing demo workflows live).

Explain that available plugins can be found in `{project-root}/.agentic-hq/plugins/` and the choice determines where the command and skill files will be created.

### 3b. workflow-id

What should the workflow be called? This will be used to name:
- The commands directory: `.agentic-hq/plugins/{plugin-id}/commands/{workflow-id}/`
- The skills directory: `.agentic-hq/plugins/{plugin-id}/skills/{workflow-id}/`
- The CLI file name

Give examples of existing workflow-ids for inspiration: `math-workflow`, `string-reversal`, `full-jira-tdd-story-workflow`.

The workflow-id should be kebab-case (lowercase with hyphens).

### 3c. one-sentence-description

A one-sentence description of what the workflow does. This will appear in the spec header and in the skill registration.

---

## Step 4: Establish Derived Variables

Once the user has provided `plugin-id`, `workflow-id`, and `one-sentence-description`, establish:

```
plugin-id = (from user)
workflow-id = (from user)
one-sentence-description = (from user)
plugin-dir = {project-root}/.agentic-hq/plugins/{plugin-id}
commands-dir = {plugin-dir}/commands/{workflow-id}
skills-dir = {plugin-dir}/skills/{workflow-id}
skills-docs-dir = {skills-dir}/docs
workflow-creation-docs-dir = {project-root}/docs/workflow-creation-docs/{plugin-id}/{workflow-id}
draft-workflow-spec-filename = {workflow-creation-docs-dir}/01-DRAFT-workflow-spec.md
```

Create the `{workflow-creation-docs-dir}` directory.

---

## Step 5: Collaboratively Create DRAFT Workflow Spec

Work with the user to create the DRAFT workflow spec. This is a back-and-forth process — draft it, present it, ask questions, revise until the user approves.

Write the spec to `{draft-workflow-spec-filename}`.

### Spec Template

The spec should include:

```markdown
# Workflow Spec: {workflow-id}

**Description**: {one-sentence-description}
**Plugin**: {plugin-id}
**Status**: DRAFT

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

{Questions the AI has about the spec that the user should answer}
```

### Collaboration Process

1. Create an initial draft based on what the user has described
2. Present it to the user
3. Include an "AI Questions" section with your questions about ambiguities
4. Ask the user to review, answer questions, and suggest changes
5. Revise the spec based on feedback
6. Repeat until the user says they approve the draft

**Do NOT rename the file from DRAFT** — that happens in Command 02.

---

## Step 6: Write Output

Write to: {command-input-output-files-directory}/command-output.json

```json
{
  "command-output-string": "The variables used in this workflow creation workflow are: agentic-hq-workspace-root-dir={agentic-hq-workspace-root-dir} and plugin-id={plugin-id} and workflow-id={workflow-id}"
}
```

Replace `{agentic-hq-workspace-root-dir}`, `{plugin-id}`, and `{workflow-id}` with their actual values.

---

## Step 7: Self-Terminate

Run the self-termination skill immediately:

/agentic-hq-core-plugin:self-termination

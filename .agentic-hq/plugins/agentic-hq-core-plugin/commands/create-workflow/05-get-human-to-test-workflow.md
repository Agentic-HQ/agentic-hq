You are executing Command 05 of the Create Workflow workflow: **Get Human to Test Workflow**.

Your role is to guide the user through manually testing the workflow that was created, and collect their feedback.

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
user-facing-help-doc-filename = {skills-docs-dir}/user-facing-help-doc.md
human-manual-testing-feedback-file = {workflow-creation-docs-dir}/05-human-manual-testing-feedback-and-AI-analysis.md
```

---

## Step 1: Read All Context

Read the following to gain full context:

1. **Previous command files**:
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md`
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md`
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/03-run-checks-on-workflow.md`
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/04-document-workflow.md`
2. **All files in `{workflow-creation-docs-dir}`** — spec, approval list, refactorings, etc.
3. **All generated workflow code**:
   - All files in `{commands-dir}` — the command .md files
   - All files in `{skills-dir}` — SKILL.md, CLI .ts, package.json, tsconfig.json, docs
4. **User-facing documentation**: `{user-facing-help-doc-filename}`

---

## Step 2: Instruct User How to Test

Tell the user clearly how to run and test the workflow, including the iterative improvement loop:

> "Your workflow `{workflow-id}` has been created and documented. Now it's time to test it!
>
> **How to run your workflow:**
>
> {Provide the exact command(s) to run the workflow — this depends on how it was registered. If it was registered as a skill, it might be runnable via `agentic-hq {workflow-id}` or via the slash command.}
>
> **What to test:**
>
> 1. Does each command in the workflow execute correctly?
> 2. Do variables pass correctly between commands?
> 3. Does the workflow produce the expected output/artifacts?
> 4. Is the user experience smooth (clear instructions, appropriate pauses for input)?
> 5. Does the workflow self-terminate correctly at each step?
>
> ---
>
> **How to iteratively improve as you test (the test-and-fix loop):**
>
> You'll likely discover improvements while testing. Here's the workflow for making changes on the fly:
>
> **You'll use two CLI sessions side by side:**
> - **Session A** — the *create-workflow* session (this one) where I can make edits for you
> - **Session B** — the *testing* session where you're running the new workflow
>
> **The loop:**
>
> 1. **In Session B**: Run the workflow and notice something you want to improve (e.g., a command could give better instructions, ask a better question, etc.)
>
> 2. **Come back to Session A** (this session): Tell me what to change. For example:
>    - *"In command 02, add a step that asks the user to review the report before continuing"*
>    - *"The summary command should also include a list of action items"*
>    I'll edit the command `.md` file for you. The command files live at:
>    `{commands-dir}/`
>
> 3. **Go back to Session B**: Tell the running Claude session to reload the updated command by saying:
>    > *"Find the markdown file for the command you are running and reload it — it has been updated."*
>    Claude will re-read the `.md` file and pick up your improvements immediately.
>
> 4. **Repeat** until you're happy with how each command behaves.
>
> This loop lets you refine the workflow interactively without restarting the whole thing from scratch.
>
> ---
>
> **Alternative: Get the testing AI to fix its own command**
>
> Sometimes the AI running in Session B makes a mistake or does something you don't like — and that AI has the full context of what went wrong. Instead of coming back to Session A and explaining the problem, you can ask the AI in Session B to fix the command itself:
>
> > *"The way you handled X wasn't right. Please find the markdown file for the command you are running and update it so that it does Y instead. Then reload it and try again."*
>
> This can be more effective because the AI that made the mistake already knows exactly what happened — you don't have to re-explain the context. Use whichever approach feels easier for the issue at hand.
>
> ---
>
> **Please run the workflow now and note any issues, suggestions, or feedback.**"

---

## Step 3: Collect Feedback

**STOP and wait** for the user to come back after testing. When they return, ask them:

> "How did the testing go? Give me a quick summary — even just a sentence or two is fine."

Also ask the user: **Where did you run the workflow?** You need the path to the workspace directory where the workflow was tested, so you can examine the output files.

Once you have their summary and the workspace path, proceed to Step 4.

---

## Step 4: Write the Feedback Document

Rather than asking the user to fill in a template, **you write the feedback document yourself** by examining the test workspace.

### 4a. Examine the Test Workspace

Read through all the files in the workspace directory the user provided. Look at:
- All session/output files the workflow created
- The command `.md` files (to understand what each step was supposed to do)
- The CLI `.ts` file (to understand the overall flow)

### 4b. Analyse and Write the Document

Based on what you find, create `{human-manual-testing-feedback-file}` with the following structure:

```markdown
# Manual Testing Feedback and AI Analysis: {workflow-id}

**Date**: {current date}
**Workspace tested**: {path the user provided}

## What This Doc Is

This document contains three things:
1. **Human feedback** — the user's own words and observations from testing the workflow
2. **AI analysis** — the AI's examination of the workflow output files, what worked well, and what could be improved
3. **Discussion points** — a Q&A between the AI and the human about how the new workflow performed and what to change

---

## Overall Verdict

{The user's own words about how it went — quote them directly}

---

## What the Workflow Produced

{List each output file found in the workspace, with a brief summary of what it contains and whether it looks complete/well-formed}

---

## What Worked Well

{Based on examining the output files, what aspects of the workflow produced good results? Be specific — reference actual content from the files.}

---

## Potential Improvements for the Future

{Based on examining the output and the command files, what could be improved? Think about: flow, user experience, missing steps, things that could be clearer, content quality, etc.}

---

## Q&A with the Human

{See Step 4c below — this section is filled in after the conversation}
```

### 4c. Ask the User Questions

After writing the initial document, ask the user 3-5 questions about how the testing went. For example:
- Which command/step felt the most useful?
- Was there any point where the flow felt awkward or confusing?
- Did the workflow produce the kind of output you were hoping for?
- Would you change the order of any steps?
- Is there anything you'd add or remove?

Have a short conversation, then **update the "Q&A with the Human" section** of the feedback document with a summary of the Q&A.

Tell the user:

> "I've written the feedback document at:
> `{human-manual-testing-feedback-file}`
>
> The workflow creation process is now complete!"

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

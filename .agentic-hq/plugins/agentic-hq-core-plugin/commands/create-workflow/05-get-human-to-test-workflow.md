You are executing Command 05 of the Create Workflow workflow: **Get Human to Test Workflow**.

Your role is to guide the user through manually testing the workflow that was created, and collect their feedback.

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
user-facing-help-doc-filename = {skills-docs-dir}/user-facing-help-doc.md
human-manual-testing-feedback-file = {workflow-creation-artifacts-dir}/05-human-manual-testing-feedback-and-AI-analysis.md
```

---

## Step 1: Read All Context

Read the following to gain full context:

1. **Previous command files**:
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md`
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md`
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/03-run-checks-on-workflow.md`
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/04-document-workflow.md`
2. **All files in `{workflow-creation-artifacts-dir}`** — spec, approval list, refactorings, etc.
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
> {Provide the exact command to run the workflow. It should be run using: `agentic-hq {workflow-short-id}` and you should tell the user about any parameters, their format and give examples}
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

### 4b. Mine the Agent Summaries — for What Worked AND What Glitched

The documents the workflow's own agents wrote during the run — **especially the per-stage *summary* documents** (e.g. an implementation-summary, a refactor-summary, a review-summary) — are the single richest source of evidence about how the workflow *actually behaved*, far more telling than the user's after-the-fact recollection. Agents are candid in their own files: they record what they did well, but also where they got stuck, what they had to work around, and where an **earlier stage left them short**. Read them with two hats on:

- **For "what worked well"** — the clean, confident summaries, the green test runs, the decisions that flowed smoothly. These feed the feedback doc's *What Worked Well* section (4c).
- **For "problems / glitches"** — hunt **deliberately** for self-reported friction; each instance usually points at a concrete flaw in the *created workflow* you can fix. Pay special attention to a *downstream* agent reporting trouble caused by an *upstream* stage. Tell-tale sections and phrasings: **"Approved Deviations From The Plan"**, "Deviations", "Risks", "Concerns", "Follow-up", "Out of scope", and any "I had to…", "the plan didn't account for…", "wasn't told…", "tripped up by…".

**A really simple worked example.** The workflow you just created could do *anything*, so this is only an illustration of the move — your workflow's stages and documents will differ. Picture a created workflow that builds a code feature through several stages, two of which are a **Planner** (which writes an implementation plan) and, right after it, an **Implementer** (which writes the code from that plan); the user has also given the workflow a project *Design Rules* file the code must follow. The Implementer was told to obey those rules — but the Planner was *not* told to plan against them. So the Planner produces a plan that contradicts the rules, and the Implementer has to depart from the plan to obey them. Here is how that surfaces in the documents, and the fix it points to:

- **Symptom (in a document):** the Implementer's `…-implementation-summary.md` noted, under *"Approved Deviations From The Plan"*, that it had to change the plan to satisfy a design rule (e.g. making something a class that the plan had written as a plain function).
- **Root cause (an earlier command):** the **Planner command never reads the Design Rules file**, so it can't plan in line with the rules.
- **Fix (to the created workflow):** update the Planner command to read the Design Rules file and plan against it — so the plan no longer contradicts the rules, and the Implementer has nothing to deviate from.

Make this same move for every problem you spot: trace the symptom in a stage's document back to the **command** that caused it, then propose a concrete edit to *that command `.md` file* (not merely to the code the test run produced).

**Then talk it through with the user.** For each problem found this way, tell them the evidence (which document, which section), your read of the root-cause command, and your suggested workflow fix — and offer to apply it now (you can edit the workflow's command files in this session). Record each finding in the feedback document's *Potential Improvements for the Future* section (4c) as *symptom → root-cause command → suggested fix*.

### 4c. Analyse and Write the Document

Based on what you find, create `{human-manual-testing-feedback-file}` with the following structure:

```markdown
# Manual Testing Feedback and AI Analysis: {workflow-id}

**Date**: {current date}
**Workspace tested**: {path the user provided}

## What This Doc Is

This document contains four things:
1. **Human feedback** — the user's own words and observations from testing the workflow
2. **AI analysis** — the AI's examination of the workflow output files, what worked well, and what could be improved
3. **Discussion points** — a Q&A between the AI and the human about how the new workflow performed and what to change
4. **Details of improvements made** — the fixes the human chose to apply to the created workflow as a result of this testing (or a note that none were made)

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

{See Step 4d below — this section is filled in after the conversation}

---

## Details Of Improvements Made

{Filled in by Step 4e, after the human picks which improvements to apply — lists each improvement actually made to the created workflow (what changed, in which file, and why), or a single sentence if no improvements were made and why.}
```

### 4d. Ask the User Questions

After writing the initial document, ask the user 3-5 questions about how the testing went. For example:
- Which command/step felt the most useful?
- Was there any point where the flow felt awkward or confusing?
- Did the workflow produce the kind of output you were hoping for?
- Would you change the order of any steps?
- Is there anything you'd add or remove?

Have a short conversation, then **update the "Q&A with the Human" section** of the feedback document with a summary of the Q&A.

---

### 4e. Apply the Selected Improvements

The feedback document now records concrete *Potential Improvements for the Future* — but a list of improvements no one acts on is wasted. This is the step where you actually **fix the created workflow**.

1. **Present a numbered list.** Show the human a numbered list of the improvements from the document's *Potential Improvements for the Future* section (include any new ones that came out of the 4d conversation). Keep each item short, but show its *symptom → root-cause command → suggested fix* so they can choose with the full picture.

2. **Ask which to apply.** Ask the human to reply with the numbers they want done (e.g. "1 and 3"), "all", or "none". **STOP and wait** for their answer.

3. **Apply the chosen fixes.** For each number the human picked, make the concrete edit to the relevant command `.md` file (or the CLI / docs) of the **created workflow** under `{commands-dir}` / `{skills-dir}` — the same *symptom → root-cause → fix* move the 4b worked example describes. Briefly confirm to the human what you changed, and where, after each one.

4. **Record what you did.** Append a new **`## Details Of Improvements Made`** section to the **end** of `{human-manual-testing-feedback-file}`. For each improvement applied, record which improvement it was (cross-reference its number), what you changed, in which file, and why. **If no improvements were made** (the human chose "none", or none were found), write a single sentence stating that no improvements were made and why.

**Finally, close out — with an Approval Gate if you changed anything.**

- **If you applied one or more improvements** (you edited the created workflow), give the human a chance to review and/or re-test before you finish. Tell them what you changed and where — point them at the *Details Of Improvements Made* section of `{human-manual-testing-feedback-file}` and the specific command files you edited — and remind them they can re-run the workflow (the Session B test-and-reload loop from Step 2) to try the changes for real. Then present an **Approval Gate** with the `AskUserQuestion` tool:

  ```
  AskUserQuestion({
    questions: [{
      question: "I've applied the improvements you selected (see the Details Of Improvements Made section of the feedback doc, and the edited command files). Review or re-test them — what would you like to do?",
      header: "Improvements gate",
      multiSelect: false,
      options: [
        { label: "Approve — finish", description: "The changes look good. Finalise and end the create-workflow process here." },
        { label: "Discuss / change more", description: "Pause. I'll tell you what else to change; you apply it and ask again. Don't finish until I approve." }
      ]
    }]
  })
  ```

  - **Approve — finish** (or an unambiguous approval via "Other") → continue to Step 5 (Write Output) and Step 6 (Self-Terminate).
  - **Discuss / change more** → engage with their feedback, apply any further fixes, **update the *Details Of Improvements Made* section** to match, then **re-present this same gate**. Loop until they approve. **Until they approve, do NOT write `command-output.json` and do NOT run the self-termination skill** — finishing now would end the create-workflow process before the human has signed off on the changes you made.

- **If you applied no improvements** (nothing about the workflow changed) → no gate is needed. Just tell the user:

  > "I've written the feedback document at `{human-manual-testing-feedback-file}` (no workflow changes were made — its *Details Of Improvements Made* section says why). The workflow creation process is now complete!"

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

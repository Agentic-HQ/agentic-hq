You are executing Command 04 of the Create Workflow workflow: **Document Workflow**.

Your role is to ensure the workflow ships its user-facing help-doc set under `docs/workflow-help-docs/` — **verifying and repairing** the copied docs if this workflow was built by copying an existing one (`--using`), or **generating** them if it was built from scratch.

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
workflow-help-docs-dir = {skills-docs-dir}/workflow-help-docs
overview-help-doc-filename = {workflow-help-docs-dir}/00-{workflow-id}-user-help-doc.md
ahq-workflow-metadata-filename = {skills-dir}/ahq-workflow.json
workflow-creation-artifacts-dir = {project-root}/docs/artifacts/workflow-creation-artifacts/{plugin-id}/{workflow-id}
approved-workflow-spec-filename = {workflow-creation-artifacts-dir}/02a-APPROVED-workflow-spec.md
```

---

## Step 1: Read All Context

Read the following to gain full context:

1. **Previous command files**:
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md`
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md`
   - `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/03-run-checks-on-workflow.md`
2. **Workflow metadata file**: `{ahq-workflow-metadata-filename}` — read this JSON file and extract the following fields, used in the help docs in Step 2:
   - `shortId` — the short CLI alias
   - `description` — the one-sentence description
   - `exampleParameters` — the example invocation parameters (starts with `-- ` when non-empty, or an empty string `""` for parameterless workflows)
   - `version` — the workflow version
   - `author.name` — the author name
3. **All files in `{workflow-creation-artifacts-dir}`** — spec, approval list, refactorings, etc.
4. **All generated workflow code**:
   - All files in `{commands-dir}` — the command .md files
   - All files in `{skills-dir}` — SKILL.md, CLI .ts, package.json, tsconfig.json

### Determine the creation mode

Use the **same test Command 02 uses**: read `{approved-workflow-spec-filename}` and check whether it contains a **"Source Workflow & Copy Plan"** section.

```
creation-mode = (approved spec contains a "Source Workflow & Copy Plan" section) ? from-existing : from-scratch
```

- **`from-existing`** — this workflow was **copied** from an existing one with `--using`. Its help docs were already copied and adapted in Command 02 (the spec's Copy Plan planned the renumber/rename/add), so Step 2 **verifies and repairs** them rather than regenerating.
- **`from-scratch`** — the workflow was generated fresh from the reference templates, so no help docs exist yet and Step 2 **generates** them.

Carry `creation-mode` into Step 2.

---

## Step 2: Ensure the Workflow Ships Its Help-Doc Set

Every Agentic HQ workflow documents itself with a **`docs/workflow-help-docs/`** set:

- **`00-{workflow-id}-user-help-doc.md`** — the overview user help doc (what the workflow does, how to run it, the stages, the files it produces, the human gates), and
- one **`NN-{command}-help-doc.md`** per command — a short per-stage doc the running agent surfaces to the user (e.g. via "Tell Me More").

What you do depends on `creation-mode` (from Step 1).

### If `creation-mode` = `from-existing` — VERIFY and repair the copied help docs

The help docs were copied from the source workflow and adapted in Command 02 (the spec's Copy Plan planned the renumber/rename/add). Your job is to **confirm that happened correctly** and fix any gaps — do **not** regenerate them from scratch (that would throw away good, already-adapted content). Check each of the following against `{workflow-help-docs-dir}` and `{commands-dir}`, and fix anything that fails:

1. **The set is complete.** `{workflow-help-docs-dir}` exists and contains `00-{workflow-id}-user-help-doc.md` plus exactly one `NN-{command}-help-doc.md` for every command file in `{commands-dir}`, numbered to match (e.g. command `04-refactorer.md` ⇄ `04-refactorer-help-doc.md`). No missing docs; no orphan docs for commands that no longer exist.
2. **No source-workflow identity leaks.** Grep the set for the **source** workflow's short-id / workflow-id, its old stage count or sequence wording, its old example invocations, and any stale help-doc filenames. None should remain. (Deliberate references to *other* workflows — e.g. "this is a copy of X" or "see workflow Y" — are fine; the test is that the docs describe THIS workflow, not still advertise the source's own identity.)
3. **Command variable blocks are aligned.** Every command file in `{commands-dir}` references the current help-doc filenames (the `00-…` overview + its own `NN-…-help-doc.md`) — no leftover pre-renumber paths.
4. **The overview matches what was built.** `00-{workflow-id}-user-help-doc.md`'s stage list/sequence, its `agentic-hq {shortId} {exampleParameters}` run line, and its description match the values in `{ahq-workflow-metadata-filename}` and the actual command set.

Report what you checked and what (if anything) you repaired.

### If `creation-mode` = `from-scratch` — GENERATE the help-doc set

The workflow was generated fresh, so no help docs exist yet. Create `{workflow-help-docs-dir}` and write the full set, using the values from `{ahq-workflow-metadata-filename}` (`shortId`, `description`, `exampleParameters`, `version`, `author.name`) and what you read in Step 1.

**First, read the reference format.** Before writing anything, read the flagship `add-feature` workflow's help docs to learn the house style, structure, and tone — the overview doc plus one per-command doc:

- `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/docs/workflow-help-docs/00-add-feature-user-help-doc.md` — the **overview** (`00-…`) format.
- `{agentic-hq-workspace-root-dir}/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/docs/workflow-help-docs/01-researcher-help-doc.md` — a **per-command** (`NN-…`) help-doc format.

Match their shape and tone, but write for **your** workflow — these are a format reference, not content to copy.

**`00-{workflow-id}-user-help-doc.md` — the overview.** Written for someone who has never run it, cover:

- a one-line title plus the `description`, `version`, `author.name`, and CLI short alias (`shortId`);
- **What This Workflow Does** — 2-3 plain-language paragraphs;
- **How To Run** — the run line `agentic-hq {shortId} {exampleParameters}`. Emit **only** the `shortId` form — the `agentic-hq` CLI registers each workflow under its `shortId`, so the full `workflow-id` is **not** a runnable command (don't repeat this rationale in the doc). If `exampleParameters` is empty, say the workflow takes no parameters; otherwise explain each parameter;
- **The Stages** — one short bullet per command, in order, naming any human interaction / approval gate;
- **The Files It Produces** — the runtime artifacts each stage writes;
- a link to each per-command help doc.

**`NN-{command}-help-doc.md` — one per command.** For every command file in `{commands-dir}`, write a short doc (same number + a slug of the command name) explaining what that stage does, what it reads and writes, and where it pauses for the human — pitched as the "Tell Me More" deep-dive for that stage.

(Out of scope: a `docs/developer-help-docs/` deep-dive — that's an optional, heavyweight "why/how it was built" extra some workflows add by hand, not something this command generates.)

### Both modes

Present a short summary of the help-doc set (verified or generated) to the user for review, and make any changes they request.

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

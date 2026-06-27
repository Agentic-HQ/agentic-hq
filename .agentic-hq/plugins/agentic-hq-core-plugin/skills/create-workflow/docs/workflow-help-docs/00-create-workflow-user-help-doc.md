# Create Workflow — User Help

This is the main user help doc for the **Create Workflow** workflow. It explains what the workflow is
for, how it's structured, where it pauses for you, and the two ways to start it. Open this (and the
specialist doc linked below) in a Markdown-friendly viewer (e.g. VS Code).

- [Using an existing workflow as a starting point (`--using`)](using-existing-workflow-help-doc.md)

## What The Create Workflow Workflow Does

The Create Workflow workflow helps you **build a brand-new Agentic HQ workflow** — collaboratively, in
five stages. It is itself run by the **Agentic HQ framework**, which automates AI command workflows —
chaining multiple Claude Code commands together so each agent does its part and hands its work on to the
next. (So this is a workflow that builds workflows.)

A workflow it produces is a chain of numbered command `.md` files that Claude runs in order, a small
TypeScript CLI that orchestrates that chain, a `SKILL.md` entry point, and the package/config files that
let it run. Create Workflow walks you from an idea to all of those files, with a check, documentation, and
a test at the end.

There are **two ways** to use it:

- **From scratch** — design a new workflow with the AI from a blank page.
- **From an existing workflow** (`--using`) — take a workflow you already have (a colleague's, or the
  flagship `add-feature`), copy it, and adapt it into your own. This is the recommended way to get a
  capable workflow quickly — see the [specialist doc](using-existing-workflow-help-doc.md).

## The Five Agents

The workflow runs five agents in order. Each reads what the previous ones produced and writes its own
artifacts, so the shared understanding lives on disk:

1. **Explain & Get Details** → `01-DRAFT-workflow-spec.md` — explains how workflows work, then works with
   you to define the new workflow's identity (plugin, id, short-id, one-sentence description) and draft a
   spec. On a `--using` run it first resolves and confirms the source workflow you're copying, then helps
   you define what to **add / change / remove** relative to it. Ends at a **spec approval** gate.
2. **Confirm Spec & Build** → the APPROVED spec **plus the actual workflow files** — re-confirms the spec,
   plans the build (in plan mode), then creates the command files, the TypeScript CLI, `SKILL.md`,
   `ahq-workflow.json`, `package.json`/config, and (if needed) the plugin manifest. On a `--using` run it
   **copies and rewires** the source workflow instead of generating from a template. Ends at a
   **build review** gate.
3. **Run Checks** → `03a-workflow-implementation-approval-list.md` + `03b-workflow-potential-refactorings.md`
   — verifies the built workflow matches the approved spec and follows conventions, then suggests optional
   refactorings for you to approve.
4. **Document** → user-facing help docs for the **new** workflow — so whoever runs it later knows how.
5. **Get Human to Test** — guides you through running the new workflow manually and collects your feedback.

## How To Run It

Run from the **root directory of the project you want the new workflow to live in**.

**From scratch:**

```
agentic-hq create-workflow
```

**Basing it on an existing workflow** (copy-and-adapt — recommended):

```
agentic-hq create-workflow -- --using=add-feature
```

`--using` is **optional** and takes the **short-id** of any existing workflow. The `-- ` before it is
required — it marks everything after it as a passthrough parameter. See the
[specialist doc](using-existing-workflow-help-doc.md) for exactly how the copy/adapt path works.

## The Files It Produces

Two kinds of output. **Process artifacts** (the spec and the build's working docs) are written under:

```text
docs/artifacts/workflow-creation-artifacts/{plugin-id}/{workflow-id}/
├── 01-DRAFT-workflow-spec.md                     (Explain & Get Details)
├── 02a-APPROVED-workflow-spec.md                 (renamed once you approve)
├── 02b-approved-workflow-plan-verbatim-copy.md   (the approved build plan)
├── 03a-workflow-implementation-approval-list.md  (Run Checks)
└── 03b-workflow-potential-refactorings.md        (Run Checks)
```

And **the workflow itself** — the files that make it real and runnable — under your project's
`.agentic-hq/plugins/{plugin-id}/`:

```text
.agentic-hq/plugins/{plugin-id}/
├── commands/{workflow-id}/NN-*.md   (the command files)
└── skills/{workflow-id}/            (SKILL.md, ahq-workflow.json, ts-workflow/ with the CLI + config)
```

## Your Touch-Points (The Gates)

Create Workflow is collaborative and conservative — it pauses for you, so nothing significant happens
without your say-so:

- **Spec approval (Explain & Get Details)**: you iterate on the DRAFT spec with the AI and must explicitly
  **Approve spec** (via a click-to-answer prompt) before the build begins.
- **Build plan + build review (Confirm Spec & Build)**: the builder re-confirms the spec, presents its
  **plan** for your approval, builds, then pauses at a **build review** gate so you can inspect the
  generated files before the workflow advances. If you want changes it iterates and re-asks — it will not
  advance until you approve.
- **Refactoring approval (Run Checks)**: any suggested refactorings are yours to approve or decline.
- **Manual test (Get Human to Test)**: you run the new workflow yourself and give feedback.

## "Tell Me More"

Each agent introduces itself in a sentence and gets on with the work. At **any** point, just say
**"Tell Me More"** and the current agent explains the current stage in more depth, then carries on. You
can also open this doc or the [specialist `--using` doc](using-existing-workflow-help-doc.md) yourself at
any time.

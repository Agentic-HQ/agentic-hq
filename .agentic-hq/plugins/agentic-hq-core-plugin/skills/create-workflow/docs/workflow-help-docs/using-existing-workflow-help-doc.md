# Create Workflow — Basing A New Workflow On An Existing One (`--using`)

This is the specialist help doc for the **`--using`** option of the
[Create Workflow](00-create-workflow-user-help-doc.md) workflow. It explains how to take a workflow that
already exists — a colleague's, or the flagship `add-feature` — and turn it into **your own** by copying
and adapting it.

This is the core customisation path of Agentic HQ: **run a workflow to try it, then make it your own.**
Starting from a workflow that already works is almost always faster than designing one from a blank page.

## How To Run It

Run from the **root directory of the project you want your new workflow to live in**:

```
agentic-hq create-workflow -- --using=add-feature
```

- `--using` takes the **short-id** of the workflow you want to base yours on (here, `add-feature`).
- The `-- ` in front is **required**. It marks everything after it as a passthrough parameter handed
  straight to the workflow — exactly like `agentic-hq full-jira -- --jira-id=AHQ-107`. Without the `-- `,
  the option won't reach the workflow.
- `--using` is **optional**. Leave it off and Create Workflow builds a new workflow from scratch instead.

## What Happens

### 1. It finds the workflow you named

Create Workflow resolves the short-id you gave by looking through **both** the Agentic HQ install (where
the bundled workflows like `add-feature` live) **and** your current project (where a workflow a colleague
shared with you might live). This means **you can run it from a brand-new, empty project** — it will still
find `add-feature` in the AHQ install.

- If the short-id **matches one** workflow, it shows you the details and confirms it's the one to copy.
- If it **matches none**, it tells you, lists the short-ids it *did* find (in case of a typo), and stops
  so you can fix the `--using` value and re-run. It will not silently build something else.
- If it **matches more than one** (rare), it lists them and asks which one you mean.

The original is never touched — you always work on a **copy**.

### 2. You define what to change

Instead of designing from nothing, you tell the AI the **point** of your new workflow and what to
**add, change, or remove** relative to the one you're copying — for example:

- add a new stage (e.g. a security-review agent after the implementer),
- remove a stage you don't want,
- change an existing agent's instructions, gates, or wording,
- give it your own name, short-id, and description.

You work this out collaboratively, and it's captured in the spec. **You describe the changes; the AI then
does the work** — copying the source, wiring up your new identity, and applying your add/change/remove
list.

### 3. It copies and adapts the workflow for you

Once you approve the spec, Create Workflow copies the source workflow's files into your project under your
new workflow's id and **rewires** them so the copy is genuinely yours and runnable — it renames the CLI,
repoints the internal command references, and rewrites the metadata (`ahq-workflow.json`, `package.json`)
to your new identity (`SKILL.md` needs no rewiring — it is the same template in every workflow and picks
up the new name from its directory automatically). It also **sweeps the copied docs and comments** so they
describe your workflow, not the original.

If your changes **remove** a command (or **insert** one in the middle), it also renumbers the remaining
command files and keeps the CLI's internal wiring in step, so the result runs end-to-end without errors.

The copy runs in your project automatically — even if your project isn't the agentic-hq package — because
every run builds the workflow in place (the framework's Workflow Build installs its dependencies, links
the `agentic-hq` framework from your install, and compiles it before running).

## The Result

A new workflow in **your** project, with **your** short-id, that you can run straight away:

```
agentic-hq <your-new-short-id> -- ...
```

It's a faithful, rewired copy of the source plus the changes you asked for — yours to keep evolving (run
`create-workflow --using` again on *your* workflow to take it further).

## Your Touch-Points (The Gates)

The `--using` path uses the same gates as the rest of [Create Workflow](00-create-workflow-user-help-doc.md):
you confirm the source, **approve the spec** (including your add/change/remove list), **approve the build
plan**, **review the built files**, approve any suggested refactorings, and finally **test it yourself**.
Nothing significant happens without your say-so.

## "Tell Me More"

At any point during a `--using` run, say **"Tell Me More"** and the current agent explains the current
stage in more depth, then carries on.

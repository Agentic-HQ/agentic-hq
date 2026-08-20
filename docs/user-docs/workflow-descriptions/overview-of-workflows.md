# Overview of Workflows

## Table of Contents

- [Plugin: `agentic-hq-core-plugin`](#plugin-agentic-hq-core-plugin)
  - [`create-workflow` — Create a new Agentic HQ workflow](#create-workflow--create-a-new-agentic-hq-workflow)
- [Plugin: `agentic-hq-demos-plugin`](#plugin-agentic-hq-demos-plugin)
  - [`add-feature` — Add a small feature to an existing codebase](#add-feature--add-a-small-feature-to-an-existing-codebase)
  - [`add-feature-detailed-example` — A detailed, opinionated seven-stage worked example](#add-feature-detailed-example--a-detailed-opinionated-seven-stage-worked-example)
  - [`string-reversal` — Reverses a string (hello world demo)](#string-reversal--reverses-a-string-hello-world-demo)
  - [`math-workflow` — Passes a number through three chained math steps](#math-workflow--passes-a-number-through-three-chained-math-steps)
  - [`quick-jira-workflow` — Reads a Jira ticket and completes it via TDD](#quick-jira-workflow--reads-a-jira-ticket-and-completes-it-via-tdd)
  - [`full-jira-tdd-story-workflow` — Full TDD story workflow driven by a Jira ticket](#full-jira-tdd-story-workflow--full-tdd-story-workflow-driven-by-a-jira-ticket)
- [Other plugins (no top-level workflows)](#other-plugins-no-top-level-workflows)
- [Adding a new workflow](#adding-a-new-workflow)

---

This page lists every workflow shipped with Agentic HQ, organised by **Plugin → Workflow**, with how to run it and what it does.

> **Prerequisites:** before running these workflows be sure to complete the install steps in the [README](../../../README.md#installation) (Node.js, `pnpm`, the `agentic-hq` CLI, and Claude Code itself).

> **Source of truth:** the authoritative live list is produced by:
>
> ```bash
> agentic-hq list
> ```
>
> Run it any time to see what is actually installed in your workspace (descriptions and aliases come straight from each plugin's `ahq-workflow.json`). This page is the human-readable companion to that command.

> **Mental model:** Agentic HQ is organised as **plugins → skills → workflows → commands** — a plugin bundles related skills; each skill packages one workflow; the workflow's TypeScript program runs by chaining a sequence of commands (Claude Code prompt files), one fresh Claude session per step. See [how-agentic-hq-works.md](../../dev/how-agentic-hq-works.md) for the full architecture (marshalling, plugin discovery, design principles).

> **Naming convention:** This page identifies each workflow by its **full skill id** (e.g. `string-reversal`) — the directory name under `skills/` and the `skillId` field in its `ahq-workflow.json`. To **run** a workflow you use its **short id** (e.g. `reversal`) — the `shortId` field, which is what `agentic-hq list` prints and the only form the `agentic-hq` CLI accepts. For some workflows the two are different (e.g. `string-reversal` runs as `reversal`); for others (`create-workflow`, `add-feature`, `add-feature-detailed-example`) the short id is identical to the skill id.

---

## Plugin: `agentic-hq-core-plugin`

Core workflows shipped with Agentic HQ itself.

### `create-workflow` — Create a new Agentic HQ workflow

Run:

```bash
agentic-hq create-workflow
```

A workflow that builds workflows. It walks you through specifying, scaffolding, refactoring, documenting and human-testing a brand-new Agentic HQ workflow end to end. You can build from a blank page, or **copy and adapt an existing workflow** with the `--using` option (see [Basing a new workflow on an existing one](#basing-a-new-workflow-on-an-existing-one---using) below).

Steps:

1. **Explain & gather details** — explains how AHQ workflows work, then collaborates with you to produce a DRAFT spec (plugin-id, workflow-id, one-sentence description, command list with inputs/outputs, success criteria).
2. **Confirm spec & build** — renames the spec from DRAFT to APPROVED, presents a final Plan, then scaffolds the new skill, commands and TypeScript workflow code.
3. **Run checks** — verifies the implementation against the spec, suggests refactorings, lets you approve/reject each, then applies the approved ones.
4. **Document** — generates a user-facing help doc for the new workflow.
5. **Get human to test** — guides you through running the new workflow in a separate CLI session, returning to make improvements, and reloading commands in the test session.

#### Basing a new workflow on an existing one (`--using`)

Instead of starting from a blank page, you can copy an existing workflow — the flagship [`add-feature`](#add-feature--add-a-small-feature-to-an-existing-codebase), a colleague's, or one of your own — and make it yours:

```bash
agentic-hq create-workflow -- --using=add-feature
```

This is the core **customisation** path of Agentic HQ: run a workflow to try it, then make it your own. `--using` takes the **short-id** of the workflow to base yours on, and resolves it by searching **both** the Agentic HQ install (where bundled workflows like `add-feature` live) and your current project — so it works even from a brand-new, empty project. Leave `--using` off and Create Workflow builds from scratch instead.

You describe the **point** of your new workflow and what to **add, change, or remove** (a new stage, an extra approval gate, different wording, a new name); Create Workflow then copies the source and rewires it — renaming the CLI, repointing internal command references, rewriting metadata (`ahq-workflow.json`, `package.json`, `SKILL.md`), renumbering commands if you inserted or removed any, and sweeping the copied docs and comments to describe *your* workflow. The original is never touched, and the result runs end to end straight away. If you have existing **coding rules, guidelines, or refactoring techniques**, supply them — they get bundled into the new workflow's Skill `docs/` directory and referred to as the workflow runs.

For the full details, see the bundled [`--using` help doc](../../../.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/docs/workflow-help-docs/using-existing-workflow-help-doc.md).

Source files:

- [Workflow Commands](../../../.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow)
- [Workflow Skill File](../../../.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/SKILL.md)
- [Workflow TypeScript Program](../../../.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/src/create-workflow-cli.ts)
- [Bundled help docs](../../../.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/docs/workflow-help-docs) (user help + the `--using` help doc)

See also [AHQ-99](https://agentic-hq.atlassian.net/browse/AHQ-99) and [AHQ-159](https://agentic-hq.atlassian.net/browse/AHQ-159) (the `--using` option).

---

## Plugin: `agentic-hq-demos-plugin`

Bundled demo workflows used both for hello-world testing of Agentic HQ and as working reference implementations when building your own workflows.

### `add-feature` — Add a small feature to an existing codebase

Run (from the root of the project you want to add the feature to):

```bash
agentic-hq add-feature -- --ticket-id=PROJ-123
```

The **flagship** workflow and the recommended starting point. It adds a **single, small feature** to an existing codebase as a deliberately minimal **four-stage** sequence of agents — **research → plan → implement → review** — small enough that you can keep the change in your head and validate it in one pass. It is **issue-tracker-agnostic**: `--ticket-id` is just a label that names the output folder (`docs/tickets/<ticket-id>/workflow-files/`), so use any tracker's id or simply make one up — no issue tracker required.

How it runs — each agent reads the previous agent's document, writes its own, and pauses for you at its gate:

1. **Researcher** → `01-feature-brief.md` — turns your feature request into a scoped brief with acceptance criteria, then decides whether the feature is a good size to do in one run (this size check **gates** the workflow). Waits for you to write your feature request, to answer any clarifying questions it raises, and to **approve the finished brief** (combined with the split decision in one question, if a split is suggested).
2. **Planner** → `02-implementation-plan.md` — turns the brief into a compact, test-first implementation plan: the minimum-useful tests and the minimal code those tests drive. It writes **no production code** and pauses for your explicit approval before any code is written.
3. **Implementer** → `03-implementation-summary.md` plus the actual code and tests — implements the approved plan (and nothing more), runs the tests, and records exactly what changed. Pauses for you to approve or discuss further.
4. **Reviewer** → `04-review-summary.md` — gives a concise, evidence-backed review, then applies **only** the fixes you mark and re-runs the tests to confirm nothing broke. After it, the workflow ends.

For the full walkthrough — every gate, the "Tell Me More" command, and the files it produces — see the bundled [Add Feature user help doc](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/docs/workflow-help-docs/00-add-feature-user-help-doc.md). To copy and adapt it into your own workflow, see [`create-workflow --using`](#create-workflow--create-a-new-agentic-hq-workflow).

Source files:

- [Workflow Commands](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature)
- [Workflow Skill File](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/SKILL.md)
- [Workflow TypeScript Program](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ts-workflow/src/add-feature-cli.ts)
- [Bundled help docs](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/docs/workflow-help-docs) (user help + one per agent)

### `add-feature-detailed-example` — A detailed, opinionated seven-stage worked example

Run (from the root of the project you want to add the feature to):

```bash
agentic-hq add-feature-detailed-example -- --verbosity=low --suggest-large-refactor=false --ticket-id=PROJ-123
```

A worked example of how far an Agentic HQ workflow can go once it has been shaped around one creator's (Steve's) personal way of building software. Where [`add-feature`](#add-feature--add-a-small-feature-to-an-existing-codebase) is a minimal four stages, this is a fuller **seven-stage** loop — **ticket → interrogate → plan → execute → refactor-plan → refactor-execute → validate** — with extra gates, a built-in refactoring pass, and tunable behaviour (e.g. `--verbosity`, `--suggest-large-refactor`). Treat it as a **showcase** of what's possible, not the recommended next step: most people are better served starting from the simple `add-feature` workflow and growing it to fit. It is the practical answer to "how detailed and opinionated can a workflow get?".

For the deep dive on how it's built and how to adapt it, see its [developer help doc](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature-detailed-example/docs/developer-help-docs/developer-help-doc.md).

Source files:

- [Workflow Commands](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature-detailed-example)
- [Workflow Skill File](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature-detailed-example/SKILL.md)
- [Workflow TypeScript Program](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature-detailed-example/ts-workflow/src/add-feature-detailed-example-cli.ts)
- [Bundled help docs](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature-detailed-example/docs) (user help, one per agent, plus a developer help doc)

### `string-reversal` — Reverses a string (hello world demo)

Run:

```bash
agentic-hq reversal -- --string-to-reverse='hello there you'
```

Single-step (~20 second) workflow that asks Claude to reverse the input string. Use it to confirm the `agentic-hq` CLI is working and that Claude Code launches successfully in your environment.

Source files:

- [Workflow Commands](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/commands/string-reversal)
- [Workflow Skill File](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/SKILL.md)
- [Workflow TypeScript Program](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/src/string-reversal-demo-cli.ts)

### `math-workflow` — Passes a number through three chained math steps

Run:

```bash
agentic-hq math -- --input-number=11
```

Three-step (~80 second) workflow chaining Claude commands that pass a number through `× 2 → + 3 → ÷ 5`. The simplest example showing how variables flow between commands — the **canonical reference** used by `create-workflow` when scaffolding new workflows.

Source files:

- [Workflow Commands](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/commands/math-workflow)
- [Workflow Skill File](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/SKILL.md)
- [Workflow TypeScript Program](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-cli.ts)

### `quick-jira-workflow` — Reads a Jira ticket and completes it via TDD

Run:

```bash
agentic-hq quick-jira -- --jira-id=TEST-123
```

A Jira-driven TDD workflow that runs without human interaction, so it can be used in an automated e2e test. Requires the Sooperset Atlassian MCP server — see [Setting Up the Sooperset Atlassian MCP Server (Jira + Confluence)](setting-up-jira-mcp-server.md).

**Runs fully unattended** — none of the commands stop to ask the human for input. That is what makes it suitable as the e2e test driver: the e2e test would hang if the workflow ever paused for human approval. Use [`full-jira-tdd-story-workflow`](#full-jira-tdd-story-workflow--full-tdd-story-workflow-driven-by-a-jira-ticket) instead when you want human-in-the-loop pauses (plan reviews, refactor approval, validation-level choice).

How it runs:

1. **Read & plan the Jira** — command 01 reads the ticket and produces a comma-separated list of **test types** the feature needs (e.g. `unit, e2e`). The list comes from a field on the Jira itself, so you control per-ticket which test levels to cover.
2. **Loop over each test type** — for every test type in that list, the workflow runs a full RED → GREEN → REFACTOR cycle before moving on:
   - **02 RED** — write a failing test of that test type
   - **03 GREEN** — minimal implementation to make it pass
   - **04 REFACTOR** — clean up the code (single combined refactor step; the fuller [`full-jira-tdd-story-workflow`](#full-jira-tdd-story-workflow--full-tdd-story-workflow-driven-by-a-jira-ticket) splits this into analysis + execute)
3. **Transition the Jira to Done** — after the loop completes, command 05 transitions the Jira's status to Done.

> **Why this workflow exists:** it was originally created as the smallest realistic Jira-driven TDD workflow we could automate end-to-end in a test — i.e. it backs an e2e test that drives the *whole* `agentic-hq` CLI from a separate workspace, runs the workflow against a real Jira via the Sooperset MCP server, and checks the resulting files and Jira status.
>
> The test lives at [`tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts`](../../../tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts) and takes **roughly 10 minutes** to run (timeout set to 60 min for headroom). It is painfully slow, but it is the only thing that proves a Jira-driven workflow runs cleanly end to end — including MCP auth, cross-workspace CLI install, multi-test-type loop, and Jira-state transitions.
>
> The custom e2e sequencer ([`tests/e2e/e2e-test-sequencer.ts`](../../../tests/e2e/e2e-test-sequencer.ts)) puts this test **last** in `pnpm test:e2e`, so the faster e2e tests still produce useful results if this one hangs or gets killed. To run it on its own:
>
> ```bash
> pnpm test:e2e:cross-workspace-quick-jira-workflow
> ```

Source files:

- [Workflow Commands](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/commands/quick-jira-workflow)
- [Workflow Skill File](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/SKILL.md)
- [Workflow TypeScript Program](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/src/quick-jira-workflow-cli.ts)

### `full-jira-tdd-story-workflow` — Full TDD story workflow driven by a Jira ticket

Run:

```bash
agentic-hq full-jira -- --jira-id=TEST-123
```

The fuller TDD-by-Jira workflow. Use this to execute a complete TDD story for a Jira ticket using Agentic HQ. Requires the Sooperset Atlassian MCP server — see [Setting Up the Sooperset Atlassian MCP Server (Jira + Confluence)](setting-up-jira-mcp-server.md).

**Very interactive — human-in-the-loop at multiple stages.** If you want a fully unattended Jira workflow, use [`quick-jira-workflow`](#quick-jira-workflow--reads-a-jira-ticket-and-completes-it-via-tdd) instead.

How it runs:

1. **Read & question the Jira** — command 01 reads the ticket and produces a comma-separated list of **test types** the feature needs (e.g. `unit, integration, e2e`). The list comes from a field on the Jira itself, so you control per-ticket whether the feature needs unit tests only, unit + integration, or the full unit → integration → e2e set. **Pauses to ask you any clarifying questions raised by the Jira before continuing.**
2. **Loop over each test type** — for every test type in that list, the workflow runs the inner RED → GREEN → REFACTOR cycle end to end before moving on:
   - **02 RED** — write a failing test of that test type. **Enters Plan Mode first so you can review/tweak the test plan before any test code is written.**
   - **03 GREEN** — minimal implementation to make it pass. **Enters Plan Mode again so you can sign off on the implementation plan before coding starts.**
   - **04a Refactor analysis** — propose refactorings. **Gives you a document to review and approve each of the proposed refactorings**
   - **04b Refactor execute** — apply approved refactorings. **After execution, offers you a manual sanity-check before moving on.**
3. **Validate once** — after the loop completes, command 05 runs a final validation pass and tells you the story is ready to commit/merge.

Net effect: a single Jira ticket can describe a feature that needs full plans, implementations and tests at *each* level — unit, then integration, then e2e — and you get a complete TDD pass per level rather than mixing them up. Test types you don't list on the Jira are simply skipped.

> **Real-world usage in this repo:** the majority of features in Agentic HQ itself were implemented using this workflow. Each run leaves a per-Jira folder of plans, RED/GREEN/REFACTOR notes and validation results under [`docs/jira-docs/`](../../../docs/jira-docs) — handy as worked examples of the workflow in action. The first one was [AHQ-6](https://agentic-hq.atlassian.net/browse/AHQ-6); see its [AI summary of the Jira and questions for the human](../../../docs/jira-docs/AHQ-6/workflow-files/ai-summary-of-jiras-and-questions-for-human.md) as a starting-point example.

Source files:

- [Workflow Commands](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow)
- [Workflow Skill File](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/SKILL.md)
- [Workflow TypeScript Program](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/src/full-jira-tdd-story-workflow-cli.ts)

---

## Other plugins (no top-level workflows)

These plugins ship with Agentic HQ but currently expose only utility skills/commands rather than top-level workflows. They will not appear under any plugin heading in `agentic-hq list`'s workflow output, but their skills are invoked from inside other workflows or directly via Claude Code:

- **`agentic-hq-utilities-plugin`** — utility skills used by other workflows (e.g. the Jira verbatim content extractor).
- **`steve-test-plugin`** — internal smoke-test skills used while developing Agentic HQ itself.

---

## Adding a new workflow

Use [`create-workflow`](#create-workflow--create-a-new-agentic-hq-workflow) — either from a blank page or by [copying an existing workflow with `--using`](#basing-a-new-workflow-on-an-existing-one---using). The README walks through the copy-and-modify path in [Build Your Own add-feature Workflow](../../../README.md#build-your-own-add-feature-workflow).

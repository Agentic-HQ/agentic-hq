# Overview of Workflows

## Table of Contents

- [Plugin: `agentic-hq-core-plugin`](#plugin-agentic-hq-core-plugin)
  - [`create-workflow` — Create a new Agentic HQ workflow](#create-workflow--create-a-new-agentic-hq-workflow)
- [Plugin: `agentic-hq-demos-plugin`](#plugin-agentic-hq-demos-plugin)
  - [`string-reversal` — Reverses a string (hello world demo)](#string-reversal--reverses-a-string-hello-world-demo)
  - [`math-workflow` — Solves a math problem using an agent team](#math-workflow--solves-a-math-problem-using-an-agent-team)
  - [`quick-jira-workflow` — Creates and completes a Jira ticket](#quick-jira-workflow--creates-and-completes-a-jira-ticket)
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

> **Naming convention:** This page identifies each workflow by its **full skill id** (e.g. `string-reversal`) — the directory name under `skills/` and the `skillId` field in its `ahq-workflow.json`. To **run** a workflow you use its **short id** (e.g. `reversal`) — the `shortId` field, which is what `agentic-hq list` prints and the only form the `agentic-hq` CLI accepts. The two are usually different (only `create-workflow` happens to share the same value for both).

---

## Plugin: `agentic-hq-core-plugin`

Core workflows shipped with Agentic HQ itself.

### `create-workflow` — Create a new Agentic HQ workflow

Run:

```bash
agentic-hq create-workflow
```

A workflow that builds workflows. It walks you through specifying, scaffolding, refactoring, documenting and human-testing a brand-new Agentic HQ workflow end to end.

Steps:

1. **Explain & gather details** — explains how AHQ workflows work, then collaborates with you to produce a DRAFT spec (plugin-id, workflow-id, one-sentence description, command list with inputs/outputs, success criteria).
2. **Confirm spec & build** — renames the spec from DRAFT to APPROVED, presents a final Plan, then scaffolds the new skill, commands and TypeScript workflow code.
3. **Run checks** — verifies the implementation against the spec, suggests refactorings, lets you approve/reject each, then applies the approved ones.
4. **Document** — generates a user-facing help doc for the new workflow.
5. **Get human to test** — guides you through running the new workflow in a separate CLI session, returning to make improvements, and reloading commands in the test session.

Source files:

- [Workflow Commands](../../../.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow)
- [Workflow Skill File](../../../.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/SKILL.md)
- [Workflow TypeScript Program](../../../.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/src/create-workflow-cli.ts)

See also [AHQ-99](https://agentic-hq.atlassian.net/browse/AHQ-99).

---

## Plugin: `agentic-hq-demos-plugin`

Bundled demo workflows used both for hello-world testing of Agentic HQ and as working reference implementations when building your own workflows.

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

### `math-workflow` — Solves a math problem using an agent team

Run:

```bash
agentic-hq math -- --input-number=11
```

Three-step (~80 second) workflow chaining Claude commands that pass a number through `× 2 → + 3 → ÷ 5`. The simplest example showing how variables flow between commands — the **canonical reference** used by `create-workflow` when scaffolding new workflows.

Source files:

- [Workflow Commands](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/commands/math-workflow)
- [Workflow Skill File](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/SKILL.md)
- [Workflow TypeScript Program](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.ts)

### `quick-jira-workflow` — Creates and completes a Jira ticket

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
- [Workflow TypeScript Program](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/src/quick-jira-workflow-demo-cli.ts)

### `full-jira-tdd-story-workflow` — Full TDD story workflow driven by a Jira ticket

Run:

```bash
agentic-hq full-jira -- --jira-id=TEST-123
```

The fuller TDD-by-Jira workflow. Use this to execute a complete TDD story for a Jira ticket using Agentic HQ. Requires the Sooperset Atlassian MCP server — see [Setting Up the Sooperset Atlassian MCP Server (Jira + Confluence)](setting-up-jira-mcp-server.md).

**Very interactive — human-in-the-loop at multiple stages.** If you want a fully unattended Jira workflow, use [`quick-jira-workflow`](#quick-jira-workflow--creates-and-completes-a-jira-ticket) instead.

How it runs:

1. **Read & question the Jira** — command 01 reads the ticket and produces a comma-separated list of **test types** the feature needs (e.g. `unit, integration, e2e`). The list comes from a field on the Jira itself, so you control per-ticket whether the feature needs unit tests only, unit + integration, or the full unit → integration → e2e set. **Pauses to ask you any clarifying questions raised by the Jira before continuing.**
2. **Loop over each test type** — for every test type in that list, the workflow runs the inner RED → GREEN → REFACTOR cycle end to end before moving on:
   - **02 RED** — write a failing test of that test type. **Enters Plan Mode first so you can review/tweak the test plan before any test code is written.**
   - **03 GREEN** — minimal implementation to make it pass. **Enters Plan Mode again so you can sign off on the implementation plan before coding starts.**
   - **04a Refactor analysis** — propose refactorings. **Gives you a document to review and approve each of the proposed refactorings**
   - **04b Refactor execute** — apply approved refactorings. **After execution, offers you a manual sanity-check before moving on.**
3. **Validate once** — after the loop completes, command 05 runs a final validation pass and tells you the story is ready to commit/merge.

Net effect: a single Jira ticket can describe a feature that needs full plans, implementations and tests at *each* level — unit, then integration, then e2e — and you get a complete TDD pass per level rather than mixing them up. Test types you don't list on the Jira are simply skipped.

> **Real-world usage in this repo:** the majority of features in Agentic HQ itself were implemented using this workflow. Each run leaves a per-Jira folder of plans, RED/GREEN/REFACTOR notes and validation results under [`docs/jira-docs/`](../../../docs/jira-docs) (37 such folders at time of writing) — handy as worked examples of the workflow in action. The first one was [AHQ-6](https://agentic-hq.atlassian.net/browse/AHQ-6); see its [AI summary of the Jira and questions for the human](../../../docs/jira-docs/AHQ-6/workflow-files/ai-summary-of-jiras-and-questions-for-human.md) as a starting-point example.

Source files:

- [Workflow Commands](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow)
- [Workflow Skill File](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/SKILL.md)
- [Workflow TypeScript Program](../../../.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/src/full-jira-tdd-story-workflow-demo-cli.ts)

---

## Other plugins (no top-level workflows)

These plugins ship with Agentic HQ but currently expose only utility skills/commands rather than top-level workflows. They will not appear under any plugin heading in `agentic-hq list`'s workflow output, but their skills are invoked from inside other workflows or directly via Claude Code:

- **`agentic-hq-utilities-plugin`** — utility skills used by other workflows (e.g. the Jira verbatim content extractor).
- **`steve-test-plugin`** — internal smoke-test skills used while developing Agentic HQ itself.

---

## Adding a new workflow

Use [`create-workflow`](#create-workflow--create-a-new-agentic-hq-workflow) — see the README's [Create Your Own Workflow](../../../README.md#create-your-own-workflow) section.

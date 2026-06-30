# Welcome to the Agentic HQ Project

Agentic HQ gives you control of your AI development workflow.

It does this by allowing you to chain together a series of Claude Code Skills, each of which start in a new session and load only the context they need for their particlular task.

The workflow is run using a simple Typescript program that runs Skills and passes variables between them.  The Skills use these variables and markdown files to save and load context.

To try it out follow the Quick Start to get installed, then add a feature to an existing project and create your own customised workflow.

## Quick Start

### Installation

> [!NOTE]
> Requires macOS 13.5 or newer (tested on 15.7.5). Other operating systems may work with small changes. Linux is most likely to work with little or no changes. If you have Windows then try with WSL.

1. **Install Node.js 24 LTS.** - using the nvm installer at https://nodejs.org/en/download After installation confirm with `node -v`. Node.js 22 is also supported.

2. **Clone the repo:**

   ```bash
   git clone https://github.com/Agentic-HQ/agentic-hq
   cd agentic-hq
   ```

3. **Enable pnpm via Corepack.** `pnpm` is this project's package manager. It ships with Node.js through Corepack.  Run the following to enable it:

   ```bash
   corepack enable
   ```

   Corepack auto-manages the exact pnpm version pinned in `package.json` and does **not** modify your shell config. (Re-run `corepack enable` whenever you switch Node version.)

4. **Install dependencies:**

   ```bash
   pnpm install
   ```

5. **Install the `agentic-hq` CLI onto your `PATH`** so you can run workflows from any directory:

   ```bash
   npm link
   ```

   Verify it's on your `PATH`:

   ```bash
   agentic-hq list
   ```

6. **Run unit tests** run the unit tests and other validation (should take less than 5 seconds):

   ```bash
   pnpm validate
   ```

7. **Run simplest workflow** run the string-reversal demo workflow — a single-step (~20 second) workflow that just asks Claude to reverse a string. This is a quick win that confirms the CLI works and Claude Code launches *before* you point a real workflow at your own code:

   ```bash
   agentic-hq reversal -- --string-to-reverse="wow this is amazing"
   ```

   The first time you run a workflow in a folder, Claude Code asks **"Do you trust the files in this folder?"** — choose **Yes**. Running a workflow also auto-approves a curated set of Claude Code tools so it can run unattended — see the caution in [Running the add-feature Workflow](#running-the-add-feature-workflow) below and the full list in [WARNING-re-auto-approved-claude-permissions.md](docs/user-docs/WARNING-re-auto-approved-claude-permissions.md).

If any step above fails, see [Quick Start Troubleshooting](docs/user-docs/troubleshooting-quickstart.md).

### Run The add-feature Workflow

`add-feature` is the flagship workflow and the best place to start. It adds a **single, small feature** to an existing codebase as a simple **four-stage** sequence of AI agents — **research → plan → implement → review** — pausing for your approval at each key gate so nothing significant happens without your say-so.

> [!CAUTION]
> **Auto-approved Claude Code tool permissions.** Running workflows via the `agentic-hq` CLI automatically approves a set of Claude Code, Jira, and Confluence tools necessary for running bash commands, reading and writing files and accessing MCP servers — no permission prompt is shown. This matters most here, where a workflow writes real code into a project of **your own**.
>
> **We recommend you check the full list at [docs/user-docs/WARNING-re-auto-approved-claude-permissions.md](docs/user-docs/WARNING-re-auto-approved-claude-permissions.md) before running any workflow to confirm you are happy with these permissions.**

`cd` into the root of an existing project you'd like to add a small feature to, then run:

```bash
agentic-hq add-feature -- --ticket-id=PROJ-1
```

- **`--ticket-id`** - set this to the ticket id from your issue tracking system, or make one up.  It is used as a directory name in (`docs/tickets/<ticket-id>/workflow-files/`).
- **Commit first** — commit or back up your project first, since the workflow will make changes to your project that you may want to revert.

Each of the four agents reads the previous agent's document and writes its own, so the shared understanding lives on disk (under `docs/tickets/<ticket-id>/workflow-files/`) while the actual code and tests land in your codebase as normal. For the full walkthrough — what each agent does, where it pauses for you, and the files it produces — see the [Add Feature user help doc](.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/docs/workflow-help-docs/00-add-feature-user-help-doc.md).

### Build Your Own add-feature Workflow

Once you've run `add-feature`, you can make your own version of it.

This is the core customisation path of Agentic HQ: run a workflow you like, then copy and adapt it to your own needs.

Change directory into the root of the project you want your new workflow to live in and then run:

```bash
agentic-hq create-workflow -- --using=add-feature
```

`--using` takes the **short-id** of the workflow to base yours on. It finds the `add-feature` workflow (looking in both the Agentic HQ install directory and your own project directory).  You then it work with Claude to modify it.  You may want to add a new Agent, enforce your own rules, add approval or review gates. It copies and rewires the workflow into a new one that's genuinely yours and runnable straight away; the original is never touched.

For the full details of the copy-and-modify path, see the [`--using` help doc](.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/docs/workflow-help-docs/using-existing-workflow-help-doc.md). 

To build a workflow from scratch, run `create-workflow` with no `--using` (see [Further Exploration](#further-exploration)) below.

## Running Workflows From Your Own Workspaces

After completing the Quick Start above, the `agentic-hq` command is available globally. You can `cd` into any workspace on your machine and run workflows from there.

### Listing Available Workflows

```bash
agentic-hq list
```

This shows all available workflows grouped by plugin, with example usage for each. It lists workflows from both the Agentic HQ workspace and (if different) your current local workspace.

For full details of all the workflows and links to their source files — see [docs/user-docs/workflow-descriptions/overview-of-workflows.md](docs/user-docs/workflow-descriptions/overview-of-workflows.md).

### Usage

```bash

agentic-hq <short-name> -- [passthrough args]

```

- Everything after `--` is passed through to the workflow as arguments

### Example

```bash
# Create a temporary workspace and run the string reversal demo from it
mkdir /tmp/my-temp-workspace
cd /tmp/my-temp-workspace
agentic-hq reversal -- --string-to-reverse="this is working well"
```

## Why Use Agentic HQ?

3 reasons:-
- **Context Control** - each Skill in the workflow starts with an empty context and loads only the exact information it needs to complete its task.  
- **Rule Enforcement** - Each Skill can include task-specific rules and checks to ensure the AI is always producing software that matches your standards.  
- **Enjoyment** - Create workflows that enable you to [collaborate closely and enjoyably with the AI](https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/20414465/Point+Of+AHQ+-+14th+Feb+2026), so that when the task is done you really understand well what has been built and your unique human insight has been combined with the AI's unique abilities to build the best thing possible.

### Other Uses Of Agentic HQ: AI Based Software Systems

Software development is just one example of a complex, multi-stage process that requires Human In The Loop. Agentic HQ (AHQ) could also be used to create an AI Based Software System that executes a multi-stage workflow process, with human in the loop for guidance/checking/control. YouTube content creator and developer Ben Holmes talks about writing and running complex systems using markdown files on [a video on his Nerd Snipe channel](https://www.youtube.com/watch?v=EwOu8xtErEc&t=4393s).  He discusses an open source front end design tool called [Impeccable](https://github.com/pbakaus/impeccable) which includes complex, multi-step Skills like the ["teach" Skill](https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/reference/teach.md).  This 6 step Skill is an example of something that may benefit from being split into 6 separate Skills and chained together using Agentic HQ.

## Further Exploration

Here's the rest of what Agentic HQ ships with:

- **A detailed, opinionated workflow — `add-feature-detailed-example`.** A worked example of how far a workflow can be shaped around one developer's own way of building software: a seven-stage loop (ticket → interrogate → plan → execute → refactor-plan → refactor-execute → validate). It's deliberately overkill for most people — treat it as a showcase of what's possible, not the recommended starting point.

  ```bash
  agentic-hq add-feature-detailed-example -- --verbosity=low --suggest-large-refactor=false --ticket-id=PROJ-1
  ```

  See its [developer help doc](.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature-detailed-example/docs/developer-help-docs/developer-help-doc.md) for how it's built and how to adapt it.

- **Jira-driven workflows — `quick-jira` and `full-jira`.** TDD-by-Jira workflows (one fully unattended, one human-in-the-loop) that read a ticket, drive a RED → GREEN → REFACTOR cycle per test type, and update the ticket. These were Agentic HQ's original flagship. They need a one-time MCP-server setup — see their entries in [overview-of-workflows.md](docs/user-docs/workflow-descriptions/overview-of-workflows.md), which link to the [Jira MCP setup guide](docs/user-docs/workflow-descriptions/setting-up-jira-mcp-server.md).

- **Build a workflow from scratch.** Run `agentic-hq create-workflow` with no `--using` to design a brand-new workflow collaboratively from a blank slate (rather than copying an existing one).

- **Quick demos — `reversal` and `math`.** Tiny throwaway workflows, handy for confirming things work or seeing how variables flow from one step to the next:

  ```bash
  # reversal — single-step (~20s) workflow that asks Claude to reverse the input string
  agentic-hq reversal -- --string-to-reverse="wow this is amazing"

  # math — three-step (~80s) workflow that runs a number through ×2 → +3 → ÷5
  agentic-hq math -- --input-number=11
  ```

For the full catalogue — every shipped workflow, what it does, and links to its source — see [overview-of-workflows.md](docs/user-docs/workflow-descriptions/overview-of-workflows.md).

## Further Documentation

You can also:
- Read more about [How Agentic HQ Works](docs/dev/how-agentic-hq-works.md)
- Look up terms in the [Glossary](docs/glossary.md)
- See the list of [Potential Feature Ideas](docs/dev/potential-feature-ideas.md)
- Refer to the [NPM Commands](docs/dev/npm-commands.md) documentation
- If you're interested, you can read the founder's [Project Philosophy & Origin Story](docs/dev/project-philosophy-and-origin-story.md).
- See the [Quickstart Troubleshooting](docs/user-docs/troubleshooting-quickstart.md) guide if a Quick Start step fails

## Support

While this repo is still private please contact Steve (the repo owner) for support using the contact form at https://agentichq.ai/. 

Support will be provided via Question and Bug Jiras on the Agentic HQ Jira project at https://agentic-hq.atlassian.net/browse/AHQ once the repo is live.

## Developer Documentation

While this repo is still private please contact Steve (the repo owner) using the contact form at https://agentichq.ai/ if you're interested in working on the project.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to file issues, propose changes, and submit pull requests. Security vulnerabilities → [SECURITY.md](SECURITY.md). Community conduct → [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

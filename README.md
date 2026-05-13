# Welcome to the Agentic HQ Project!

Agentic HQ is a thin Typescript wrapper around Claude Code that allows you to create and run Typescript programs that chain together multiple Claude Code Skills.

## Uses

### Developer Workflows

Automate developer workflows to give you better control of the AI and its context.  Each Skill in the workflow starts with an empty context and loads only the exact information it needs to complete its task.  Includes task-specific rules and checks to ensure the AI is always producing software that matches your standards.  Create workflows that enable you to [collaborate closely and enjoyably with the AI](https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/20414465/Point+Of+AHQ+-+14th+Feb+2026), so that when the task is done you really understand well what has been built and your unique human insight has been combined with the AI's unique abilities to build the best thing possible.

### AI Based Software Systems

Agentic HQ (AHQ) could also be used to create an AI Based Software System that executes a multi-stage workflow process, with human in the loop for guidance/checking/control.  The human could be taken through a multi-step, complex workflow where they interact with Claude Code at the necessary stages, to achieve an arbitrarily complex task.  Fine grained control over Claude's context can be achieved by keeping each Skill small and focussed and by only loading the text required for that task from markdown files.

## Prerequisites

### Mac OS

These instructions have **only** been created for and tested on MacOS 15.5.  Other operating systems haven't yet been tested, but may work with small modifications (Linux is most likely to work with minimal or zero changes, and if you're running Windows then Windows Subsystem for Linux (WSL) may be worth trying first)

### Node.js

Requires Node.js v22.x (LTS) or higher.

To install go to https://nodejs.org/en/download and follow the instructions to install nvm (Node Version Manager) with npm.

After installing run: 
```bash
node --version
```
to confirm version 22 or higher.

### pnpm (Package Manager)

This project requires pnpm, which is already included in Node.js 22 or higher, but needs to be enabled using corepack using the following commands.

Corepack automatically manages the pnpm version used by the project, which is set in `package.json` file.

To enable corepack and then confirm the pnpm version do:

```bash
# Enable corepack (one-time setup, does NOT modify shell config files)
corepack enable

# Verify — should show the version from package.json (currently 10.33.0)
pnpm --version
```

## Quick Start

> [!CAUTION]
> **Auto-approved Claude Code tool permissions.** Running workflows via the `agentic-hq` CLI automatically approves a set of Claude Code, Jira, and Confluence tools necessary for running bash commands, reading and writing files and accessing MCP servers — no permission prompt is shown.
>
> **We recommend you check the full list at [docs/user-docs/WARNING-re-auto-approved-claude-permissions.md](docs/user-docs/WARNING-re-auto-approved-claude-permissions.md) before running any workflow to confirm you are happy with these permissions.**


1. Clone the repo:

   ```bash
   git clone https://github.com/Agentic-HQ/agentic-hq
   cd agentic-hq
   ```

2. Install dependencies (corepack auto-downloads the pinned pnpm version):

   ```bash
   pnpm install
   ```

3. Run install-dev-agentic-hq.sh to install the dev version of the `agentic-hq` CLI to your `PATH` so you can run it from any directory:

   ```bash
   scripts/infra/install-dev-agentic-hq.sh
   ```

   The script uses `pnpm link --global` to symlink the CLI into your global pnpm bin directory; it does not require `sudo` and does not modify your shell config.

4. Verify everything works by running checks and quick unit tests:

   ```bash
   pnpm validate
   ```

5. See what workflows are available (each workflow comes with an example usage):

   ```bash
   agentic-hq list
   ```

6. Run the string reversal demo which is a single step workflow (20 seconds) that gets Claude to reverse the input string. (NOTE: The first time you run this, Claude Code will ask if you trust this folder — choose **Yes** to continue):

   ```bash
   agentic-hq reversal -- --string-to-reverse="wow this is amazing"
   ```

    To look at the code for this workflow see: [Claude Skill](.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/SKILL.md), [Typescript program](.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/src/string-reversal-demo-cli.ts), [Claude Command](.agentic-hq/plugins/agentic-hq-demos-plugin/commands/string-reversal/reverse-a-string.md)

7. Run the math workflow demo which is a 3 step workflow (80 seconds) that gets Claude to do 3 mathematical operations on your input number: multiply by 2, add 3, divide by 5:

   ```bash
   agentic-hq math -- --input-number=11
   ```

    To look at the code for this workflow see: [Claude Skill](.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/SKILL.md), [Typescript program](.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.ts), [3 Claude Commands](.agentic-hq/plugins/agentic-hq-demos-plugin/commands/math-workflow)

If any of the steps above fail, see [Quick Start Troubleshooting](docs/user-docs/troubleshooting-quickstart.md).

### Create Your Own Workflow

To create your own workflow run:

```bash
agentic-hq create-workflow
```

This workflow works with you to specify, build, document and test a new workflow end to end.  I suggest you run this command in the Agentic HQ workspace so the workflow is created in that workspace.  You will then be able to run the workflow from any other workspace on your computer, e.g. a new or existing workspace of your own.

If you are a software developer I suggest you try creating a workflow that follows your typical process for working on a new software feature, which could involve something like the following separate steps:
- discover - investigate/discuss/question what doing the feature involves and create a description (for use as a Jira/Linear ticket)
- plan - plan the details of the feature implementation based on rules human requires (stored in pre-existing file)
- execute - implement the plan and document implementation
- audit - audit the implementation to confirm all rules (stored in pre-existing file) adhered to and test pass and document the audit
- plan refactoring - create a refactoring plan to improve the whole system, including the new implementation (to pay off technical debt)
- execute refactoring - execute the refactoring plan, run tests and document the work done.
- commit - with detailed message

If you want to keep it simple just create a basic 3 step workflow: plan, implement, refactor

If you have existing coding rules or guidelines, or techniques you use to get the AI to refactor, be sure to supply them.  These will be bundled with the workflow in its Skill "docs" directory and referred to as the workflow progresses.

## Setting Up Sooperset Atlassian MCP Server For Jira

The `quick-jira` and `full-jira` demo workflows talk to Jira and Confluence via the [Sooperset Atlassian MCP server](https://github.com/sooperset/mcp-atlassian). Before running either workflow, install and configure that MCP server at **user** scope so it's available in every workspace on your machine.

Full instructions, including prerequisites, troubleshooting, and what the install script does, are in:

**→ [docs/user-docs/workflow-descriptions/setting-up-jira-mcp-server.md](docs/user-docs/workflow-descriptions/setting-up-jira-mcp-server.md)**

Short version: from this repo, run

```bash
scripts/mcp-scripts/install-or-update-sooperset-mcp-atlassian.sh
```

and follow the prompts (you will need an Atlassian API token).

## Running Workflows From Your Own Workspaces

After completing the Quick Start above, the `agentic-hq` command is available globally. You can `cd` into any workspace on your machine and run workflows from there.

### Listing Available Workflows

```bash
agentic-hq list
```

This shows all available workflows grouped by plugin, with example usage for each. It lists workflows from both the Agentic HQ workspace and (if different) your current local workspace:

```
Available workflows:

Agentic HQ Workspace (directory: /Users/stevepersonal/dev/agentic-hq/agentic-hq):-
Plugin: agentic-hq-core-plugin
Workflows:
agentic-hq create-workflow
   What it does: Create a new Agentic HQ workflow
Plugin: agentic-hq-demos-plugin
Workflows:
agentic-hq full-jira -- --jira-id=TEST-123
   What it does: Full TDD story workflow driven by a Jira ticket
agentic-hq math -- --input-number=11
   What it does: Solves a math problem using an agent team
agentic-hq quick-jira -- --jira-id=TEST-123
   What it does: Creates and completes a Jira ticket
agentic-hq reversal -- --string-to-reverse='hello there you'
   What it does: Reverses a string (hello world demo)
Plugin: agentic-hq-utilities-plugin
Workflows:

Plugin: steve-test-plugin
Workflows:


Local Workspace: Same as Agentic HQ Workspace (running from within the AHQ directory)
```

For a human-readable companion to this list — what each workflow does, how it runs step-by-step, and links to its source files — see [docs/user-docs/workflow-descriptions/overview-of-workflows.md](docs/user-docs/workflow-descriptions/overview-of-workflows.md).

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
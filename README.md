# Welcome to the Agentic HQ Project!

Agentic HQ is a thin Typescript wrapper around Claude Code that allows you to chain together your Custom Commands to automate your Claude Code workflows.

The long term aim of Agentic HQ is to provide a powerful toolset that enables developers to collaborate closely, and enjoyably, with LLMS to produce better software faster (as Dave Farley says in https://www.youtube.com/watch?v=eoaDr5PpT2c&t=447s)

The [Roadmap](docs/roadmap.md) contains the following planned enhancements:
- a Jira Story Workflow that runs all the Commands required to complete a single Jira Story.
- the ability to compile Commands programatically from a library of Command Fragments.
- the ability to resume long running workflows, so that crashes/failures don't leave you with half completed workflows.

## Prerequisites

### Mac OS

These instructions have **only** been created for and tested on MacOS 15.5.  Other operating systems aren't yet supported, but may work with small modifications.

### Node.js
Requires Node.js v22.x (LTS). 

To install to go https://nodejs.org/en/download and follow the instructions to install nvm (Node Version Manager - recommended) and then version 22, or just download the binary installer.

To confirm version 22 is installed run: `node --version`.

### pnpm (Package Manager)
This project uses pnpm. **You must use pnpm 10.28.1 or later.**

```bash
# Check your pnpm version
pnpm --version

# If outdated, update using corepack (built into Node.js 22+):
corepack use pnpm@10.28.1
```

**Why pnpm 10.28.1+?** Earlier versions have bugs with peer dependency resolution and build script handling that cause issues with this project's dependencies.

## Quick Start

```bash
# Clone the repo
git clone https://github.com/Agentic-HQ/agentic-hq
cd agentic-hq
```

> **WARNING: Auto-approved tool permissions.** When you run workflows via the `agentic-hq` CLI, the following Claude Code tools are **automatically approved** (no permission prompt) via the `--allowedTools` flag in `src/tools/claude-code/ClaudeCodeTool.ts`:
>
CLAUDE TODO: Please put this as a nicely formatted human readable list:
> `Bash`, `Edit`, `Write`, `MultiEdit`, `mcp__mcp-atlassian__jira_get_issue`, `mcp__mcp-atlassian__jira_create_issue`, `mcp__mcp-atlassian__jira_add_comment`, `mcp__mcp-atlassian__confluence_get_page`, `mcp__mcp-atlassian__confluence_search`, `mcp__mcp-atlassian__jira_get_transitions`, `mcp__mcp-atlassian__jira_transition_issue`, `mcp__mcp-atlassian__jira_search`, `mcp__mcp-atlassian__jira_update_issue`
>
> This applies to **all workspaces** that run via the `agentic-hq` CLI. You do **not** need to create `.claude/settings.local.json` — permissions are handled by the CLI automatically. Check the `ALLOWED_TOOLS` constant in `ClaudeCodeTool.ts` for the current list.

```bash

# Get pnpm set up so that when scripts/infra/install-dev-agentic-hq.sh runs it will 
# already be set up
# (That script runs this anyway, but better that user does this and knows it has been done as it
# modifies user's ~/.zshrc file to add pnpm settings)
pnpm setup

# Install dependencies
pnpm install

# Run the script to install the dev version of agentic-hq CLI to your path
# so that you can run it from any of your own git project workspaces
scripts/infra/install-dev-agentic-hq.sh

# Verify everything works by running checks and quick unit tests
pnpm validate

# See what workflows are available
agentic-hq list

# Run the string reversal demo via short alias
# NOTE: The first time you run this Claude Code will ask if you trust this folder and to
# continue you will have to choose Yes
agentic-hq reversal

# Run with custom args
agentic-hq reversal -- --string-to-reverse='hello world'

# Or run the plugin's TypeScript workflow directly (bypasses the agentic-hq CLI)
pnpm demo:plugin-direct:string-reversal

# Run the math workflow demo (3 step chain: x2, +3, /5) via the plugin directly
pnpm demo:plugin-direct:math-workflow
```

### Building Your Own Workflow

Workflows are implemented as **plugin skills** under `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/`. To create your own:

1. **Copy an existing skill** (e.g., math-workflow), excluding `node_modules`:
   ```bash
   rsync -a --exclude node_modules \
         .agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ \
         .agentic-hq/plugins/agentic-hq-demos-plugin/skills/my-temp-workflow/
   ```

2. **Rename the files** in `my-temp-workflow/ts-workflow/src/` to match your workflow name (e.g., `math-workflow-demo-cli.ts` → `my-temp-workflow-demo-cli.ts`)

3. **Update `my-temp-workflow/SKILL.md`** — change the file paths in the command-output-string to point to your renamed files

4. **Update `my-temp-workflow/ts-workflow/package.json`** — change the `name`, `description`, and `demo:*` script to match your workflow

5. **Modify the TypeScript code** in `my-temp-workflow/ts-workflow/src/` to do what you need

6. **Add a `demo:plugin-direct:my-temp-workflow` script** to the root `package.json` to run it directly:
   ```json
   "demo:plugin-direct:my-temp-workflow": "bash -c \"(cd .agentic-hq/plugins/agentic-hq-demos-plugin/skills/my-temp-workflow/ts-workflow && pnpm install --ignore-workspace) && .agentic-hq/plugins/agentic-hq-demos-plugin/skills/my-temp-workflow/ts-workflow/node_modules/.bin/tsx --tsconfig .agentic-hq/plugins/agentic-hq-demos-plugin/skills/my-temp-workflow/ts-workflow/tsconfig.json .agentic-hq/plugins/agentic-hq-demos-plugin/skills/my-temp-workflow/ts-workflow/src/my-temp-workflow-demo-cli.ts\""
   ```

7. **Optionally register a short alias** — add an entry to `WORKFLOW_SKILLS_REGISTRY` in `src/demo/demo-workflow-skills-registry.ts` so you can run it with `agentic-hq my-temp-workflow` instead of the full path

8. **Run your workflow** — either directly or via the agentic-hq CLI:
   ```bash
   # Direct (bypasses agentic-hq CLI):
   pnpm demo:plugin-direct:my-temp-workflow

   # Via agentic-hq CLI short alias (if registered in step 7):
   agentic-hq my-temp-workflow -- --your-arg=value

   # Via agentic-hq CLI full skill path (always works):
   agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:my-temp-workflow -- --your-arg=value
   ```

## Setting Up sooperset Atlassian MCP Server For Jira

TODO:

Have to document this to show how to set up and configure sooperset MCP Server at **user** level (so available in all workspaces).  Some of the docs are at:

https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/6586383/Jira+Admin#30th-Jan-2026---Fixing-Problem-With-Jira-MCP-Reauth-By-Switching-To-sooperset-Atlassian-MCP-Server

These are used in the Quick and Full TDD Jira Workflow demos.


## Running Workflows From Your Own Workspaces

After completing the Quick Start above, the `agentic-hq` command is available globally. You can `cd` into any git repository on your machine and run workflows from there.

### Listing Available Workflows

```bash
agentic-hq list
```

This shows all available workflows with their short aliases, full skill paths, and usage examples:

```
Available workflows:

  reversal    /agentic-hq-demos-plugin:string-reversal               Reverses a string (hello world demo)
Example: agentic-hq reversal -- --string-reverse='hello there you'
  math        /agentic-hq-demos-plugin:math-workflow                 Solves a math problem using an agent team
Example: agentic-hq math -- --input-number=54321
  quick-jira  /agentic-hq-demos-plugin:quick-jira-workflow           Creates and completes a Jira ticket
Example: agentic-hq quick-jira -- --jira-id=TEST-123
  full-jira   /agentic-hq-demos-plugin:full-jira-tdd-story-workflow  Full TDD story workflow driven by a Jira ticket
Example: agentic-hq full-jira -- --jira-id=TEST-123
```

### Usage

```bash
# Run by short alias (recommended)
agentic-hq <short-name> -- [passthrough args]

# Run by full skill path (also works)
agentic-hq --workflow-command-supplier=/<plugin>:<skill> -- [passthrough args]
```

- Everything after `--` is passed through to the workflow as arguments

**Requirements:** Your current directory must be inside a **git repository** (the CLI uses `git rev-parse` to find the workspace root).

### Examples

```bash
# Create a temporary workspace and run the string reversal demo from it
mkdir /tmp/tmp-Steve-Workspace-001
cd /tmp/tmp-Steve-Workspace-001
git init
agentic-hq reversal -- --string-to-reverse="this is working well"

# Or use the full skill path (equivalent)
agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal -- --string-to-reverse="this is working well"
```


## Further Documentation

You can also:
- Read more about [How Agentic HQ Works](docs/dev/how-agentic-hq-works.md)
- Check out the [Roadmap](docs/roadmap.md)
- Refer to the [NPM Commands](docs/dev/npm-commands.md) documentation

## Support

While this repo is still private please contact Steve (the repo owner) for support using the contact form at https://agentichq.ai/. 

Support will be provided via Question and Bug Jiras on the Agentic HQ Jira project at https://agentic-hq.atlassian.net/browse/AHQ once the repo is live.

## Developer Documentation

While this repo is still private please contact Steve (the repo owner) using the contact form at https://agentichq.ai/ if you're interested in working on the project.

Before making the repo public we'll be adding a CONTRIBUTING.md file for developers to use.
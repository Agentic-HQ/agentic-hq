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

To allow the:
- integration tests to run
- the demo CLI programs to run without giving permission to Claude Code to write files and run the kill script

you should now:
- create a .claude/settings.local.json file with the following contents:

```json
{
  "permissions": {
    "allow": [
      "Write"
    ],
    "deny": [],
    "ask": []
  }
}
```
This gives Claude Code the permission:
- to write files *ONLY* into this workspace directory
- to run the kill-current-cli-process.sh bash script that kills the Claude Code process

**Other workspaces:** If you run `agentic-hq` from your own workspaces, you'll need the same `"Write"` permission in those workspaces too (many will already have this enabled). Claude needs it to write temporary output files to `.agentic-hq/temp/command-input-output-files`.

**E2E tests:** The cross-workspace e2e tests create temp workspaces under `/tmp/agentic-hq-test-workspaces/`. Before running them for the first time, you must manually trust this folder:
```bash
cd /tmp/agentic-hq-test-workspaces
claude
# Select "Yes, I trust this folder" when Claude Code prompts
```
> **Note:** `/tmp` is periodically cleaned by the OS, so this trust prompt may reappear every few days — causing e2e tests to hang with a timeout until you re-trust the folder.


> **WARNING** Read `kill-current-cli-process.sh` to confirm you're happy with Claude Code running it.

> **Note:** If you're not comfortable with setting these permissions straight away, that's fine. It only means the integration tests will time out and error, and you'll be asked for permission by Claude Code when you run the demo programs. You can still run all the demo programs.

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

# Run the string reversal demo via the agentic-hq CLI
# NOTE: The first time you run this Claude Code will ask if you trust this folder and to
# continue you will have to choose Yes
pnpm demo:agentic-hq-cli:string-reversal

# Or run the plugin's TypeScript workflow directly (bypasses the agentic-hq CLI)
pnpm demo:plugin-direct:string-reversal

# Run the demo math workflow program at src/demo/cli/math-workflow-demo-cli.ts to 
# see a simple 3 step workflow that uses output from one custom command as input to the next
pnpm demo:math-workflow --input-number=11
```

### Building Your Own Workflow

To create your own workflow:

1. **Copy the demo program:**
   ```bash
   cp src/demo/cli/math-workflow-demo-cli.ts src/demo/cli/my-workflow-cli.ts
   ```

2. **Copy the demo commands:**
   ```bash
   cp -r .claude/commands/agentic-hq-commands/used-in-demos/math-workflow \
         .claude/commands/my-commands
   ```

3. **Update the command paths** in your CLI to point to your new commands
by replacing:
   ```
   /agentic-hq-commands:used-in-demos:math-workflow:
   ```
   with:
   ```
   /my-commands:
   ```

4. **Modify the commands** to do what you need and modify the input arguments to your program

5. **Run your workflow:**
   ```bash
   npx tsx src/demo/cli/my-workflow-cli.ts --your-arg-name=your-arg-value
   ```

## Running Workflows From Your Own Workspaces

After completing the Quick Start above, the `agentic-hq` command is available globally. You can `cd` into any git repository on your machine and run workflows from there.

### Usage

```bash
agentic-hq --workflow-command-supplier=/<plugin>:<skill> -- [passthrough args]
```

- `--workflow-command-supplier` (required) — the plugin skill that supplies the workflow command to run
- Everything after `--` is passed through to the workflow as arguments

**Requirements:** Your current directory must be inside a **git repository** (the CLI uses `git rev-parse` to find the workspace root).

### Example

```bash
# Create a temporary workspace and run the string reversal demo from it
mkdir /tmp/tmp-Steve-Workspace-001
cd /tmp/tmp-Steve-Workspace-001
git init
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
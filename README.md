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
      "Write",
      "Bash(./tools/scripts/process-control/unix/kill-current-cli-process.sh:*)"
    ],
    "deny": [],
    "ask": []
  }
}
```
This gives Claude Code the permission:
- to write files *ONLY* into this workspace directory
- to run the kill-current-cli-process.sh bash script that kills the Claude Code process

**WARNING:** Read the kill-current-cli-process.sh script to confirm you're happy with Claude Code running it. If you're not comfortable with setting these permission straight away, that's fine. It only means the integration tests will time out and error, and you'll be asked for permission by Claude Code when you run the demo programs.  You can still run all the demo programs.

```bash
# Install dependencies
pnpm install

# Verify everything works by running checks and quick unit tests
pnpm validate

# Run the demo string reversal program at src/demo/cli/string-reversal-demo-cli.ts
# NOTE: The first time you run this Claude Code will ask if you trust this folder and to 
# continue you will have to choose Yes
pnpm demo:string-reversal --string-to-reverse="hello there"

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
   tsx src/demo/cli/my-workflow-cli.ts --your-arg-name=your-arg-value
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
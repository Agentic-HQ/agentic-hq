# Auto-Approved Claude Code Tool Permissions

When you run a workflow, the `agentic-hq` CLI launches Claude Code sessions to execute each workflow step. So that a multi-step workflow can run without repeatedly stopping to ask you to approve each tool use, the CLI passes a fixed, curated list of tools to each of those sessions via the `claude` CLI's `--allowedTools` flag. The tools on that list are auto-approved for the session: no permission prompt is shown.

This page explains what is approved, why each entry is there, and what it does — and doesn't — mean for your machine.

## The key facts

- **Per-run only — nothing is persisted.** The approval is a command-line flag on the Claude Code sessions that `agentic-hq` launches. It never modifies your Claude Code settings files, and it has no effect on your own interactive `claude` sessions.
- **It's a fixed allow-list, not blanket approval.** Only the tools listed below are auto-approved. Anything else follows Claude Code's standard permission model — you'll be prompted for approval as normal.
- **The Jira/Confluence entries do nothing unless you've set up the Atlassian MCP server.** If you haven't configured it (see [setting-up-jira-mcp-server.md](workflow-descriptions/setting-up-jira-mcp-server.md)), those tools don't exist in the session, so the approvals grant nothing.
- **Commit (or back up) your project before running a workflow.** `Bash`, `Edit` and `Write` are real permissions — changing files in your project and running commands like tests is precisely what workflows are for. Run them in a committed project so any change you don't like is easy to revert.

The source of truth for the list is the `DEFAULT_ALLOWED_TOOLS` constant in [`claude-command-builder.ts`](../../src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts). Each entry is explained below.

## Claude Code built-in tools

- `Bash` — Shell command execution. Workflows use this for the commands you would otherwise run yourself: installing dependencies, running tests, builds, git status checks.
- `Edit` — File editing.
- `Write` — File creation.
- `MultiEdit` — Multiple file edits in one operation.

These are the same capabilities you would be approving prompt-by-prompt if you asked Claude Code interactively to implement a feature; the workflow approves them up front so it isn't interrupted at every command and file edit.

## Jira (via Sooperset MCP Atlassian MCP Tool)

Used by the Jira workflows (e.g. `full-jira-tdd-story-workflow`) to read stories, post progress comments, and move issues between statuses. These entries are inert unless you have configured the Atlassian MCP server.

- `mcp__mcp-atlassian__jira_get_issue` — Read an issue's fields, description and comments.
- `mcp__mcp-atlassian__jira_create_issue` — Create a new issue.
- `mcp__mcp-atlassian__jira_add_comment` — Post a comment on an issue.
- `mcp__mcp-atlassian__jira_get_transitions` — List the workflow transitions available on an issue.
- `mcp__mcp-atlassian__jira_transition_issue` — Move an issue between statuses (e.g. To Do → In Progress → Done).
- `mcp__mcp-atlassian__jira_search` — Run a JQL search.
- `mcp__mcp-atlassian__jira_update_issue` — Update fields on an existing issue (summary, description, labels, etc.).

## Confluence (via Sooperset MCP Atlassian MCP Tool)

Lets the Jira workflows read specs linked from a story. Also inert unless the Atlassian MCP server is configured.

- `mcp__mcp-atlassian__confluence_get_page` — Read the content of a Confluence page.
- `mcp__mcp-atlassian__confluence_search` — Search Confluence pages.

## Workflow plumbing

- `Skill(agentic-hq-core-plugin:self-termination)` — When a workflow step finishes, the Claude Code session running it uses this skill to exit, handing control back to the AHQ program so the workflow can move on to the next step. It ends the session; it does nothing else. (Explicit approval is needed because, since roughly Claude Code 2.1.141, a skill invoked from within another skill requires it — see [AHQ-142](https://agentic-hq.atlassian.net/browse/AHQ-142).)

## Read access to the `.agentic-hq` directory in the Agentic HQ workspace

In addition to `DEFAULT_ALLOWED_TOOLS` above, the CLI appends one extra permission to `--allowedTools` for every workflow run:

- `Read(<agentic-hq install dir>/.agentic-hq)` — explicit Read approval for the `.agentic-hq` directory in the Agentic HQ workspace where the `agentic-hq` binary is installed.

This is needed because workflow command `.md` files and reference docs live inside the `.agentic-hq` dir inside the Agentic HQ workspace.  If you run the agentic-hq CLI from a different workspace Claude will not have access to this directory and so won't be able to read the Documentation it needs for the different workflow skills.

NOTE: this is a temporary measure until [AHQ-102](https://agentic-hq.atlassian.net/browse/AHQ-102) is implemented.  After that has been implemented all resources and documents required to run a Skill will be bundled with that Skill and this extra permission will be removed.

## What is NOT auto-approved

Everything else. Any tool not on the list — other MCP servers, web tools, and so on — follows Claude Code's standard permission model: you'll be prompted to approve it as normal. If you build your own workflow that needs an extra tool, add it to `DEFAULT_ALLOWED_TOOLS` in [`claude-command-builder.ts`](../../src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts).

## Making these permissions more granular

For launch the model is deliberately simple: one shared list for all workflows. The downside is that the list is broader than any single workflow needs.  For example, the Jira tools are on the allow-list even for workflows that never touch Jira. Making permissions more granular (per-workflow permission sets, and/or a way to print a workflow's permission set before running it) is tracked in [AHQ-183](https://agentic-hq.atlassian.net/browse/AHQ-183), planned post-launch so it can be shaped by feedback from real users. If the current permissions model gives you pause, that feedback is exactly what we're after — see [Support](../../README.md#support).
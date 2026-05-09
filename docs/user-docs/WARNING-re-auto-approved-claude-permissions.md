# WARNING: Auto-approved Claude Code Tool Permissions

When you run workflows via the `agentic-hq` CLI, the following Claude Code tools are **automatically approved** by passing the list in the `--allowedTools` flag to the `claude` CLI command.  This means you don't have to manually set the permissions required for each workspace you run the AHQ workflows in, but also means you should understand what permissions the workflow are given.

Check the `DEFAULT_ALLOWED_TOOLS` constant in [`claude-command-builder.ts`](../../src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts) for the current list of automatically allowed tools.

Here we explain why they are included:-

## Claude Code built-in tools

- `Bash` — Shell command execution
- `Edit` — File editing
- `Write` — File creation
- `MultiEdit` — Multiple file edits in one operation

## Jira (via Sooperset MCP Atlassian MCP Tool)

NOTE: Only relevant when running Jira related workflows e.g. full-jira-tdd-story-workflow

- `mcp__mcp-atlassian__jira_get_issue` — Read an issue's fields, description and comments.
- `mcp__mcp-atlassian__jira_create_issue` — Create a new issue.
- `mcp__mcp-atlassian__jira_add_comment` — Post a comment on an issue.
- `mcp__mcp-atlassian__jira_get_transitions` — List the workflow transitions available on an issue.
- `mcp__mcp-atlassian__jira_transition_issue` — Move an issue between statuses (e.g. To Do → In Progress → Done).
- `mcp__mcp-atlassian__jira_search` — Run a JQL search.
- `mcp__mcp-atlassian__jira_update_issue` — Update fields on an existing issue (summary, description, labels, etc.).

## Confluence (via Sooperset MCP Atlassian MCP Tool)

NOTE: Only relevant when running Jira related workflows e.g.full-jira-tdd-story-workflow

- `mcp__mcp-atlassian__confluence_get_page` — Read the content of a Confluence page.
- `mcp__mcp-atlassian__confluence_search` — Search Confluence pages.

## File-system Read access (added at runtime)

In addition to `DEFAULT_ALLOWED_TOOLS` above, the CLI appends one extra permission to `--allowedTools` for every workflow run:

- `Read(<agentic-hq install dir>/.agentic-hq)` — explicit Read approval for the `.agentic-hq` directory under wherever `agentic-hq` is installed.

This is needed because workflow command `.md` files and reference docs live inside the `agentic-hq` install dir, and Claude does not auto-approve reads outside the user's current working directory when the user runs `agentic-hq` from a different workspace. It is a temporary measure tracked in [AHQ-102](https://agentic-hq.atlassian.net/browse/AHQ-102) — once required resources are bundled per-skill, this extra permission can be removed and the auto-approved set will collapse back to `DEFAULT_ALLOWED_TOOLS` as listed above.

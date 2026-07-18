# Setting Up the Sooperset Atlassian MCP Server (Jira + Confluence)

## Table of Contents

- [Why this is needed](#why-this-is-needed)
- [Why Sooperset and not the official Atlassian MCP server?](#why-sooperset-and-not-the-official-atlassian-mcp-server)
- [Which workflows use this MCP server](#which-workflows-use-this-mcp-server)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [What the script does](#what-the-script-does)
- [Verifying it worked](#verifying-it-worked)
- [Re-running / updating](#re-running--updating)
- [Troubleshooting](#troubleshooting)

---

## Why this is needed

Some Agentic HQ workflows interact with Jira (read tickets, transition status, add comments) and Confluence (read pages, search). Claude Code talks to those services via the **[sooperset/mcp-atlassian](https://github.com/sooperset/mcp-atlassian)** MCP server, which Claude does not have built in.

Until you install and configure that MCP server, any workflow that calls a `jira_*` or `confluence_*` tool will fail because the underlying tool simply isn't available.

The server is configured at **user scope** in `~/.claude.json`, so once installed it is available in every workspace on your machine — you do not need to install it per project.

For the list of Jira/Confluence MCP tools that Agentic HQ auto-approves, see [WARNING-re-auto-approved-claude-permissions.md](../WARNING-re-auto-approved-claude-permissions.md).

## Why Sooperset and not the official Atlassian MCP server?

Atlassian publishes an [official MCP server](https://www.atlassian.com/platform/remote-mcp-server) — we deliberately do **not** use it.

On macOS the official server kept forgetting its authentication token between sessions, forcing a re-auth every time it was used. The bug went unfixed for months, so we abandoned the official server and switched to the community-maintained [sooperset/mcp-atlassian](https://github.com/sooperset/mcp-atlassian), which authenticates with a static API token configured once in `~/.claude.json` and is stable on Mac.

If/when the official server's macOS auth issue is fixed, this is the place we will revisit.

## Which workflows use this MCP server

You only need this if you plan to run a workflow that talks to Jira or Confluence. The workflows that do are:

- [`quick-jira-workflow`](overview-of-workflows.md#quick-jira-workflow--reads-a-jira-ticket-and-completes-it-via-tdd) — short Jira-driven TDD demo
- [`full-jira-tdd-story-workflow`](overview-of-workflows.md#full-jira-tdd-story-workflow--full-tdd-story-workflow-driven-by-a-jira-ticket) — full TDD-by-Jira workflow

The hello-world demos (`string-reversal`, `math-workflow`) and the `create-workflow` workflow do **not** require this server.

## Prerequisites

1. **An Atlassian account** with access to the Jira/Confluence site you want to use.
2. **An Atlassian API token.** Create one at <https://id.atlassian.com/manage-profile/security/api-tokens> following the instructions at <https://github.com/sooperset/mcp-atlassian#1-get-your-api-token>. Keep it on screen until you are ready to copy and paste it while following the instructions below (WARNING: Once you dismiss the screen you won't ever be able to get it again, and will have to delete it and generate a new token)
3. **`uvx`** must be installed and on your `PATH` — the MCP server is launched by `uvx mcp-atlassian`. If you do not have `uv`/`uvx`, install per the official instructions at <https://docs.astral.sh/uv/>. macOS quick-start: `brew install uv`; on Ubuntu/Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`.
4. **Claude Code CLI** must be installed (since the script uses `claude mcp add-json`).

## Installation

From the root of the Agentic HQ workspace, run:

```bash
scripts/mcp-scripts/install-or-update-sooperset-mcp-atlassian.sh
```

The script will:

1. Prompt you for your **Atlassian site URL** (e.g. `https://your-team.atlassian.net`). The default is `https://agentic-hq.atlassian.net` — press Enter to accept it. The Confluence URL is derived automatically by appending `/wiki`.
2. Prompt you for your **Atlassian username** (no default — usually your email address). The script will keep asking until you supply a non-empty value.
3. Back up your existing `~/.claude.json` to `~/.claude.json.<timestamp>.bak`.
4. Prompt you to paste your **Atlassian API token**. The token is read with `getpass`, so it is **not** echoed to the terminal and **not** stored in your shell history.
5. Remove any previous `mcp-atlassian` MCP configuration from `~/.claude.json` (you may see an "error" if there wasn't one — that is safe to ignore).
6. Add a fresh `mcp-atlassian` MCP configuration at **user scope**, wired to the site URL, derived Confluence URL, username and token you just supplied.
7. Print the installed MCP servers so you can confirm `mcp-atlassian` is **Connected**.

## What the script does

The script is the codified version of step 2 of the upstream Sooperset instructions (<https://github.com/sooperset/mcp-atlassian#2-configure-your-ide>). It produces an entry like this in `~/.claude.json` under `mcpServers`:

```json
"mcp-atlassian": {
  "command": "uvx",
  "args": ["mcp-atlassian"],
  "env": {
    "JIRA_URL": "<your-site-url>",
    "JIRA_USERNAME": "<your-username>",
    "JIRA_API_TOKEN": "***",
    "CONFLUENCE_URL": "<your-site-url>/wiki",
    "CONFLUENCE_USERNAME": "<your-username>",
    "CONFLUENCE_API_TOKEN": "***"
  }
}
```

The same API token is used for both `JIRA_API_TOKEN` and `CONFLUENCE_API_TOKEN` — Atlassian uses one token across both products.

Doing this through the script (rather than editing `~/.claude.json` by hand) means:

- Your token is never written to your shell history.
- Your previous Claude settings are backed up before any change.
- The `mcp add-json` call is idempotent — safe to re-run.

## Verifying it worked

The script ends by running `claude mcp list | grep mcp-atlassian`. You should see something like:

```
mcp-atlassian: uvx mcp-atlassian — Connected
```

If it says **Connected**, you are good. Run a Jira-aware workflow such as:

```bash
agentic-hq quick-jira -- --jira-id=YOUR-PROJECT-123
```

## Re-running / updating

Re-run the same script any time you need to:

- Rotate the API token.
- Switch to a different Atlassian site or username — just enter the new values when prompted.
- Recover after `~/.claude.json` got into a bad state — the script removes the old `mcp-atlassian` block before adding a new one, and a timestamped backup is taken every run.

## Troubleshooting

- **`claude: command not found`** — install Claude Code first; the script depends on its CLI.
- **`uvx: command not found`** — install `uv` (see <https://docs.astral.sh/uv/>); `uvx` is needed to actually launch the MCP server when Claude Code calls it.
- **`mcp-atlassian` shows as `Failed` or `Disconnected` in `claude mcp list`** — the API token, username or site URL is wrong. Re-run the script and double-check the values you enter at the prompts (and try a freshly-generated token).
- **`401 Unauthorized` from Jira/Confluence inside a workflow** — same as above; the token is invalid, expired or doesn't have permission for the site.
- **Existing config wasn't removed cleanly** — restore from the timestamped `~/.claude.json.<timestamp>.bak` and re-run.

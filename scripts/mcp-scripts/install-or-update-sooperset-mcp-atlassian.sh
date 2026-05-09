#!/bin/bash
# Why sooperset/mcp-atlassian and not the official Atlassian MCP server?
# ----------------------------------------------------------------------
# We deliberately use the third-party sooperset/mcp-atlassian server
# (https://github.com/sooperset/mcp-atlassian) instead of Atlassian's official
# MCP server. On macOS the official server kept forgetting its authentication
# token between sessions, forcing a re-auth dance every time. The bug went
# unfixed for months, so we abandoned the official server and switched to
# sooperset/mcp-atlassian, which uses a static API token in the config and is
# stable on Mac.
#
# This script performs Step 2 of the sooperset installation instructions
# at https://github.com/sooperset/mcp-atlassian#2-configure-your-ide
#
# That step instructs the user to add a new section of JSON to their Claude
# settings file (~/.claude.json), including the access token for the Atlassian
# API.
#
# This script adds that new section of JSON to the Claude settings file using
# the `claude mcp add-json` command and asking the user to input the Atlassian
# API token.  This prevents the token from being stored in the user's command
# history.
#
# Usage:
# ./scripts/mcp-scripts/install-or-update-sooperset-mcp-atlassian.sh

date;
echo "install-or-update-sooperset-mcp-atlassian.sh started\n";
echo "Why this script uses sooperset/mcp-atlassian instead of the official Atlassian MCP server:"
echo "  On macOS the official Atlassian MCP server kept forgetting its authentication"
echo "  token between sessions, forcing a re-auth every time. The bug went unfixed"
echo "  for months, so we switched to sooperset/mcp-atlassian"
echo "  (https://github.com/sooperset/mcp-atlassian), which uses a static API token"
echo "  and is stable on Mac."
echo ""
echo "This script will:"
echo "  - Ask you for your Atlassian site URL and username (the API token is asked for separately, securely)."
echo "  - Back up your existing Claude settings file (~/.claude.json)."
echo "  - Prompt you for your Atlassian API token securely (your token will not be shown or stored in your shell history)."
echo "  - Remove any previous 'mcp-atlassian' Claude MCP configuration."
echo "  - Add a new 'mcp-atlassian' configuration section to your Claude settings with your site/username/API token."
echo "  - Display the MCP server list so you can confirm the new server is installed and connected."
echo ""
echo "Before starting,read instructions at https://github.com/sooperset/mcp-atlassian#1-get-your-api-token to "
echo "get your Atlassian API token from https://id.atlassian.com/manage-profile/security/api-tokens\n";

# Prompt for the Jira site URL (Confluence URL is derived as <site>/wiki).
# Defaults to the Agentic HQ site for convenience.
DEFAULT_JIRA_URL="https://agentic-hq.atlassian.net"
printf "Atlassian site URL [%s]: " "${DEFAULT_JIRA_URL}"
read -r JIRA_URL
JIRA_URL="${JIRA_URL:-${DEFAULT_JIRA_URL}}"
# Strip any trailing slash so we can cleanly append /wiki for the Confluence URL.
JIRA_URL="${JIRA_URL%/}"
CONFLUENCE_URL="${JIRA_URL}/wiki"

# Prompt for the Atlassian username. No default — but it's almost always your email address.
ATLASSIAN_USERNAME=""
while [ -z "${ATLASSIAN_USERNAME}" ]; do
  printf "Atlassian username (usually your email address): "
  read -r ATLASSIAN_USERNAME
done

echo ""
echo "Will configure mcp-atlassian with:"
echo "  JIRA_URL       = ${JIRA_URL}"
echo "  CONFLUENCE_URL = ${CONFLUENCE_URL}"
echo "  USERNAME       = ${ATLASSIAN_USERNAME}"
echo ""

export JIRA_URL CONFLUENCE_URL ATLASSIAN_USERNAME

export TIMESTAMP=$(date +%Y%m%d%H%M%S);
echo "Backing up your Claude settings file to ~/.claude.json.${TIMESTAMP}.bak.\n";
cp ~/.claude.json ~/.claude.json.${TIMESTAMP}.bak;

printf "When you have your Atlassian API token, press Enter to continue\n"
read -r

# Remove the existing MCP server
# This is necessary because the claude mcp add-json command will fail if the server is already installed

echo "Removing any previous 'mcp-atlassian' Claude MCP configuration (if it doesn't already exist you will see an error message but that can be ignored)\n";
claude mcp remove mcp-atlassian

# Add the new section of JSON to the Claude settings file.
# Site URL and username come in via environment variables; the API token is read
# inside Python via getpass so it never appears in shell history or process args.
python3 -c '
import json
import os
import getpass
import subprocess

jira_url = os.environ["JIRA_URL"]
confluence_url = os.environ["CONFLUENCE_URL"]
username = os.environ["ATLASSIAN_USERNAME"]

# Prompt the user for their Atlassian API token without echoing it
token = getpass.getpass("Atlassian API token: ")

# Prepare the configuration dictionary
cfg = {
    "command": "uvx",
    "args": ["mcp-atlassian"],
    "env": {
        "JIRA_URL": jira_url,
        "JIRA_USERNAME": username,
        "JIRA_API_TOKEN": token,
        "CONFLUENCE_URL": confluence_url,
        "CONFLUENCE_USERNAME": username,
        "CONFLUENCE_API_TOKEN": token
    }
}

# Add the JSON config to claude settings
subprocess.run(
    [
        "claude", "mcp", "add-json", "mcp-atlassian", "--scope", "user", json.dumps(cfg)
    ],
    check=True
)
'

# List the installed MCP servers
echo "Check the following to confirm the MCP server is installed and Connected:\n\n";
claude mcp list | egrep "mcp-atlassian"
echo ""

date;
echo "install-or-update-sooperset-mcp-atlassian.sh finished";
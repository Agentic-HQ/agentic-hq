After most of the implementation was completed by the AI it ran:

pnpm test:e2e:cross-workspace-string-reversal

but that hung.

Investigating revealed Claude was waiting for approval to modify the workspace like this: "Yes, I trust this folder"

The human did a bunch of tests and investigations and discovered that creating the .claude folder and adding the

settings.local.json

file in the 2 previous cross*.ts files had **NEVER** worked but we didn't notice because we weren't modifying the workspace.

The human discovered that using workspace level settings files will not work, as when they are used Claude always prompts about trust.

The only options are:
- Getting the user to set all the required permissions at user level in ~/.claude/settings.json - this is not a great option as it means *ALL* of their workspaces (for ever) will have all of these permissions - which they may not want to set (and forget about)
- adding the full list of permissions to the command line of Claude Code on startup using the --allowedTools parameter

Experimentation revealed option 2 to be the best:

(base) stevepersonal@Steves-MacBook-Pro sub-ws-1 % claude "/permissions" --allowedTools 'Edit mcp__mcp-atlassian__jira_get_issue'

╭─── Claude Code v2.1.37 ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│                                    │ Tips for getting started                                                                                                                                                   │
│         Welcome back Steve!        │ Ask Claude to create a new app or clone a repository                                                                                                                       │
│                                    │ ────────────────────────────────────────────────────                                                                                                                       │
│                                    │ Recent activity                                                                                                                                                            │
│              ▗ ▗   ▖ ▖             │ No recent activity                                                                                                                                                         │
│                                    │                                                                                                                                                                            │
│                ▘▘ ▝▝               │                                                                                                                                                                            │
│       Opus 4.6 · Claude Max        │                                                                                                                                                                            │
│   /…/ws-with-claude-dir/sub-ws-1   │                                                                                                                                                                            │
╰─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

❯ /permissions                                                                                                                                                                                                     
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 Permissions:  Allow   Ask   Deny   Workspace  (←/→ or tab to cycle)                                                                                                                                               
                                                                                                                                                                                                                 
 Claude Code won't ask before using allowed tools.                                                                                                                                                                 
 ╭───────────────────────────────────────────────╮
 │ ⌕ Search…                                     │                                                                                                                                                                 
 ╰───────────────────────────────────────────────╯                                                                                                                                                               

 ❯ 1.  Add a new rule…
   2.  Bash
   3.  Edit
   4.  mcp__mcp-atlassian__jira_get_issue
   5.  mcp__playwright__browser_click
   6.  mcp__playwright__browser_close


and so I manually modified:

ClaudeCodeTools.ts

REFACTOR: Plan is that in the REFACTOR stage we will remove all the redundant code and tidy up so anything related to this .claude folder in these tests workspaces is removed.  We must also review the README.md for outdated instructions about setting permissions in the user workspaces as our tools will now have them automatically.  NOTE: We should replace the instructions with a big WARNING that all workspaces that run using our tools will have the permissions set in ClaudeCodeTool.ts ALLOWED_TOOLS constant and they should check it, then give a list of the ones set as at 13th March 2026.  Finally we should convertd ALLOWED_TOOLS into a nice readable vertical list (still with spaces separating the items).
Last login: Sun Aug 16 17:34:12 on ttys000
(base) stevepersonal@Steves-MacBook-Pro-4 agentic-hq % claude-with-plugins.sh 
▗ ▗   ▖ ▖  Claude Code v2.1.233
           Opus 5 (1M context) with xhigh effort · Claude Max
  ▘▘ ▝▝    ~/dev/agentic-hq/agentic-hq


❯ please directly use MCP to look at https://agentic-hq.atlassian.net/browse/AHQ-205 and then do research and put details of what you found and your plan of action at                                         
  docs/tickets/AHQ-205/workflow-files/01-research-and-plan-of-action.md                                                                                                                                        
  
⏺ I'll start by fetching the Jira ticket via MCP.
  
⏺ mcp-atlassian - Get Issue (MCP)(issue_key: "AHQ-205", fields: "*all", include: "comments,remote_links", comment_limit: 50)
  ⎿  {"result":"{\n  \"id\": \"14707\",\n  \"key\": \"AHQ-205\",\n  \"summary\": \"Bug: agentic-hq CLI Installed From Npm Crashes When add-feature Workflow Runs From AHQ Workspace Root\",\n  \"url\":
     \"https://agentic-hq.atlassian.net/rest/api/2/issue/14707\",\n  \"browse_url\": \"https://agentic-hq.atlassian.net/browse/AHQ-205\",\n  \"description\": \"Written by Claude:\\n\\n### Summary\\n\\nWhen
     the npm-installed `agentic-hq` CLI is run from a directory whose local workspace defines a workflow with the same name as one shipped in the installed package, the CLI crashes at startup with an
     uncaught Commander error — before any subcommand runs. **Every** invocation from such a directory fails: `list`, `add-feature`, even `add-feature --help`.\\n\\n```\\nError: cannot add command
     'add-feature' as already have command 'add-feature'\\n    at Command._registerCommand (.../node_modules/commander/lib/command.js:655:13)\\n    at Command.command
     (.../node_modules/commander/lib/command.js:174:10)\\n    at WorkflowRegistryImpl.register (.../dist/src/cli/workflow-registry-impl.js:30:14)\\n    at PluginImpl.registerWorkflowsWith
     (.../dist/src/workflow-discovery/plugin/plugin-impl.js:38:22)\\n    at WorkspaceImpl.registerWorkflowsWith (.../dist/src/workflow-discovery/workspace/workspace-impl.js:47:20)\\n    at     
     CurrentUserWorkspaceImpl.registerWorkflowsWith (.../dist/src/workflow-discovery/workspace/current-user-workspace-impl.js:35:31)\\n    at WorkflowSearchResultsImpl.registerWorkflowsWith
     (.../dist/src/workflow-discovery/workflow-listing/workflow-search-results-impl.js:40:35)\\n    at createProgram (.../dist/src/cli/agentic-hq-program.js:35:19)\\n\\n```\\n\\n### Environment\\n\\n-
     `agentic-hq@0.1.1` installed from the npm registry (prefix-global install; standard `npm install -g` exercises the identical code path)\\n- Node.js v24.15.0, macOS\\n\\n### Steps To Reproduce\\n\\n1.
     Install the CLI from the registry: `npm install -g agentic-hq` (or the prefix-global form).\\n1. `cd` into any directory whose local workspace defines a workflow named the same as a shipped one — e.g. a
     clone of the agentic-hq repo itself, whose `.agentic-hq/plugins/agentic-hq-demos-plugin` defines `add-feature` and `math`.\\n1. Run any command with the installed binary: `agentic-hq list`, `agentic-hq
     add-feature --help`, etc.\\n\\n### Actual Behaviour\\n\\nUncaught `Error: cannot add command 'add-feature' as already have command 'add-feature'` with a full stack trace; exit code 1. The crash happens
     during CLI program construction (workflow discovery registers workflows from **both** the installed package's workspace **and** the local workspace at the current directory, with no name-collision
     handling), so no subcommand — including `--help` — ever runs.\\n\\n### Expected Behaviour\\n\\nA deliberate collision policy instead of a crash. Candidate behaviours (decision needed):\\n\\n  - **Local
     overrides package* — the local workspace's workflow wins, ideally with a notice; or\\n  - **Qualified registration* — collide-free naming/namespacing so both remain runnable; or\\n  - **Graceful,
     actionable error* — at minimum, a clear message naming the colliding workflow and both source workspaces, instead of an uncaught stack trace.\\n\\n### Impact\\n\\n  - Anyone who clones the agentic-hq
     repo **and* npm-installs the CLI cannot use the installed binary anywhere inside the clone — a plausible path for contributors and evaluators.\\n- Any user whose own project's local workspace defines a
     workflow named the same as a shipped one (`add-feature`, `math`) hits the same hard crash in their project.\\n- No workaround exists other than changing directory or renaming the local
     workflow.\\n\\n### Discovery Context\\n\\nFound 2026-08-14 during the AHQ-202 proof run (verifying the interactive add-feature flow from a registry install). The proof itself is unaffected — its planned
     contexts (neutral directory, scratch project with no local plugins) cannot collide — so this was split out as its own bug rather than triggering AHQ-202's contingent republish path. Reproduced twice
     against the registry-installed 0.1.1: `agentic-hq list` and `agentic-hq add-feature --help`, both from the repo clone root.\\n\\n### Notes For Fixing\\n\\n- The registration chain is
     `WorkflowSearchResultsImpl.registerWorkflowsWith` → `CurrentUserWorkspaceImpl` → `WorkspaceImpl` → `PluginImpl` → `WorkflowRegistryImpl.register`, which calls Commander's `program.command()` — Commander
     throws on the duplicate name.\\n- A failing automated test reproducing the collision (two workspaces offering the same workflow name) should be feasible without any interactive surface.\",\n
     \"status\": {\n    \"name\": \"Backlog\",\n    \"category\": \"To Do\",\n    \"color\": \"blue-gray\"\n  },\n  \"issue_type\": {\n    \"name\": \"Sub-task\"\n  },\n  \"priority\": {\n    \"name\":
     \"Medium\"\n  },\n  \"project\": {\n    \"key\": \"AHQ\",\n    \"name\": \"Agentic HQ\",\n    \"avatar_url\":
     \"https://agentic-hq.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/10416\"\n  },\n  \"parent\": {\n    \"id\": \"14569\",\n    \"key\": \"AHQ-195\",\n    \"self\":
     \"https://agentic-hq.atlassian.net/rest/api/2/issue/14569\",\n    \"fields\": {\n      \"summary\": \"Publish agentic-hq Tool To Npm\",\n      \"status\": {\n        \"self\":
     \"https://agentic-hq.atlassian.net/rest/api/2/status/10009\",\n        \"description\": \"\",\n        \"iconUrl\": \"https://agentic-hq.atlassian.net/\",\n        \"name\": \"Selected for
     Development\",\n        \"id\": \"10009\",\n        \"statusCategory\": {\n          \"self\": \"https://agentic-hq.atlassian.net/rest/api/2/statuscategory/2\",\n          \"id\": 2,\n          \"key\":
     \"new\",\n          \"colorName\": \"blue-gray\",\n          \"name\": \"To Do\"\n        }\n      },\n      \"priority\": {\n        \"self\":
     \"https://agentic-hq.atlassian.net/rest/api/2/priority/3\",\n        \"iconUrl\": \"https://agentic-hq.atlassian.net/images/icons/priorities/medium_new.svg\",\n        \"name\": \"Medium\",\n
     \"id\": \"3\"\n      },\n      \"issuetype\": {\n        \"self\": \"https://agentic-hq.atlassian.net/rest/api/2/issuetype/10007\",\n        \"id\": \"10007\",\n        \"description\": \"Stories track
     functionality or features expressed as user goals.\",\n        \"iconUrl\": \"https://agentic-hq.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10300?size=medium\",\n
     \"name\": \"Story\",\n        \"subtask\": false,\n        \"avatarId\": 10300,\n        \"hierarchyLevel\": 0\n      }\n    }\n  },\n  \"worklog\": {\n    \"startAt\": 0,\n    \"maxResults\": 20,\n
     \"total\": 0,\n    \"worklogs\": []\n  },\n  \"assignee\": {\n    \"display_name\": \"Unassigned\"\n  },\n  \"reporter\": {\n    \"account_id\": \"712020:0b47121b-b20b-4181-8ec7-9688b90cc1cd\",\n
     \"display_name\": \"Steve Halso\",\n    \"name\": \"Steve Halso\",\n    \"email\": \"steve@halsey.me\",\n    \"avatar_url\":
     \"https://secure.gravatar.com/avatar/20f6b4f557f405b5cc5ff19c9d34e486?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSH-3.png\"\n  },\n  \"created\":
     \"2026-08-14 10:35:58 BST\",\n  \"updated\": \"2026-08-14 18:06:30 BST\",\n  \"customfield_10030\": {\n    \"value\": null\n  },\n  \"customfield_10031\": {\n    \"value\": null\n  },\n
     \"customfield_10032\": {\n    \"value\": null\n  },\n  \"customfield_10033\": {\n    \"value\": null\n  },\n  \"customfield_10034\": {\n    \"value\": null\n  },\n  \"customfield_10035\": {\n
     \"value\": null\n  },\n  \"customfield_10037\": {\n    \"value\": null\n  },\n  \"customfield_10027\": {\n    \"value\": null\n  },\n  \"customfield_10028\": {\n    \"value\": null\n  },\n
     \"customfield_10029\": {\n    \"value\": null\n  },\n  \"customfield_10060\": {\n    \"value\": null\n  },\n  \"customfield_10020\": {\n    \"value\": null\n  },\n  \"customfield_10021\": {\n
     \"value\": null\n  },\n  \"customfield_10022\": {\n    \"value\": null\n  },\n  \"customfield_10023\": {\n    \"value\": null\n  },\n  \"customfield_10024\": {\n    \"value\": null\n  },\n
     \"customfield_10025\": {\n    \"value\": null\n  },\n  \"customfield_10026\": {\n    \"value\": null\n  },\n  \"customfield_10016\": {\n    \"value\": null\n  },\n  \"customfield_10017\": {\n
     \"value\": null\n  },\n  \"customfield_10019\": {\n    \"value\": \"0|i001ig:\"\n  },\n  \"customfield_10050\": {\n    \"value\": null\n  },\n  \"customfield_10010\": {\n    \"value\": null\n  },\n
     \"customfield_10055\": {\n    \"value\": null\n  },\n  \"customfield_10056\": {\n    \"value\": null\n  },\n  \"customfield_10057\": {\n    \"value\": null\n  },\n  \"customfield_10058\": {\n
     \"value\": null\n  },\n  \"customfield_10014\": {\n    \"value\": null\n  },\n  \"customfield_10059\": {\n    \"value\": null\n  },\n  \"customfield_10015\": {\n    \"value\": null\n  },\n
     \"customfield_10049\": {\n    \"value\": null\n  },\n  \"customfield_10005\": {\n    \"value\": null\n  },\n  \"customfield_10126\": {\n    \"value\": null\n  },\n  \"customfield_10006\": {\n
     \"value\": null\n  },\n  \"customfield_10007\": {\n    \"value\": null\n  },\n  \"customfield_10008\": {\n    \"value\": null\n  },\n  \"customfield_10009\": {\n    \"value\": null\n  },\n
     \"customfield_10041\": {\n    \"value\": null\n  },\n  \"customfield_10042\": {\n    \"value\": null\n  },\n  \"customfield_10043\": {\n    \"value\": null\n  },\n  \"customfield_10044\": {\n
     \"value\": null\n  },\n  \"customfield_10000\": {\n    \"value\": \"{repository={count=1, dataType=repository}, json={\\\"cachedValue\\\":{\\\"errors\\\":[],\\\"summary\\\":{\\\"repository\\\":{\\\"over
     all\\\":{\\\"count\\\":1,\\\"lastUpdated\\\":\\\"2026-08-14T18:11:12.000+0100\\\",\\\"dataType\\\":\\\"repository\\\"},\\\"byInstanceType\\\":{\\\"oAuth-com.github.integration.production\\\":{\\\"count\
     \\":1,\\\"name\\\":\\\"GitHub\\\"},\\\"GitHub\\\":{\\\"count\\\":1,\\\"name\\\":\\\"GitHub\\\"}}}}},\\\"isStale\\\":true}}\"\n  },\n  \"customfield_10045\": {\n    \"value\": null\n  },\n
     \"customfield_10001\": {\n    \"value\": null\n  },\n  \"customfield_10046\": {\n    \"value\": null\n  },\n  \"customfield_10002\": {\n    \"value\": []\n  },\n  \"customfield_10047\": {\n
     \"value\": null\n  },\n  \"customfield_10003\": {\n    \"value\": null\n  },\n  \"customfield_10048\": {\n    \"value\": null\n  },\n  \"customfield_10004\": {\n    \"value\": null\n  },\n
     \"customfield_10038\": {\n    \"value\": null\n  },\n  \"customfield_10159\": {\n    \"value\": null\n  },\n  \"customfield_10039\": {\n    \"value\": null\n  },\n  \"comments\": [],\n
     \"remote_links\": []\n}"}
  ⎿  Interrupted · What should Claude do instead?

❯ Sorry - also read docs/tickets/AHQ-195/workflow-files/01-feature-brief.md to get context of this bug fix and any other files necessary in docs/tickets or the code base, and please recreate the bug         

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/tickets/AHQ-195/workflow-files/01-feature-brief.md)
  ⎿  Read 623 lines

⏺ Bash(ls -la /Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/tickets/ && echo "---AHQ-195---" && ls -la /Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/tickets/AHQ-195/ 2>/dev/null && echo
  "---205---" && ls -la /Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/tickets/AHQ-205/ 2>/dev/null)
  ⎿  total 0
     drwxr-xr-x  10 stevepersonal  staff  320 16 Aug 17:35 .
     drwxr-xr-x   8 stevepersonal  staff  256 16 Aug 14:41 ..
     drwxr-xr-x   3 stevepersonal  staff   96  5 Aug 12:44 AHQ-195
     drwxr-xr-x   3 stevepersonal  staff   96  6 Aug 15:38 AHQ-196
     drwxr-xr-x   3 stevepersonal  staff   96  9 Aug 11:17 AHQ-197
     drwxr-xr-x   3 stevepersonal  staff   96 10 Aug 22:59 AHQ-198
     drwxr-xr-x   3 stevepersonal  staff   96 14 Aug 18:12 AHQ-200
     drwxr-xr-x   3 stevepersonal  staff   96 14 Aug 09:44 AHQ-202
     drwxr-xr-x   3 stevepersonal  staff   96 10 Aug 22:58 AHQ-204
     drwxr-xr-x   3 stevepersonal  staff   96 16 Aug 17:35 AHQ-205
     ---AHQ-195---
     total 0
     drwxr-xr-x   3 stevepersonal  staff   96  5 Aug 12:44 .
     drwxr-xr-x  10 stevepersonal  staff  320 16 Aug 17:35 ..
     drwxr-xr-x   4 stevepersonal  staff  128 16 Aug 15:42 workflow-files
     ---205---
     total 0
     drwxr-xr-x   3 stevepersonal  staff   96 16 Aug 17:35 .
     drwxr-xr-x  10 stevepersonal  staff  320 16 Aug 17:35 ..
     drwxr-xr-x   2 stevepersonal  staff   64 16 Aug 17:38 workflow-files

⏺ Now let me read the detailed bug file and explore the relevant source code.

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/tickets/AHQ-202/workflow-files/supporting-files/AHQ-205_bug_Jira.md)
  ⎿  Read 68 lines

⏺ Bash(find src/workflow-discovery src/cli -type f -name "*.ts" | sort)
  ⎿  src/cli/agentic-hq-program.ts
     src/cli/app.ts
     src/cli/listing/colors.ts
     src/cli/listing/listing-formatter.ts
     src/cli/listing/listing-indent.ts
     src/cli/main.ts
     src/cli/workflow-registry-impl.ts
     src/workflow-discovery/interfaces/ahq-directory.ts
     src/workflow-discovery/interfaces/ahq-file.ts
     src/workflow-discovery/interfaces/ahq-files.ts
     src/workflow-discovery/interfaces/ahq-workflow.ts
     src/workflow-discovery/interfaces/example-command.ts
     src/workflow-discovery/interfaces/example-parameters.ts
     src/workflow-discovery/interfaces/full-claude-skill-command.ts
     src/workflow-discovery/interfaces/json-file.ts
     src/workflow-discovery/interfaces/plugin-id.ts
     src/workflow-discovery/interfaces/skill-id.ts
     src/workflow-discovery/interfaces/workflow-description.ts
     src/workflow-discovery/interfaces/workflow-metadata.ts
     src/workflow-discovery/interfaces/workflow-registry.ts
     src/workflow-discovery/interfaces/workflow-search-results.ts
     src/workflow-discovery/interfaces/workflow-short-name.ts
     src/workflow-discovery/interfaces/workspace.ts
     src/workflow-discovery/plugin/plugin-directory-impl.ts
     src/workflow-discovery/plugin/plugin-directory.ts
     src/workflow-discovery/plugin/plugin-impl.ts
     src/workflow-discovery/plugin/plugin.ts
     src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts
     src/workflow-discovery/workflow/ahq-workflow-impl.ts
     src/workflow-discovery/workflow/example-command-impl.ts
     src/workflow-discovery/workflow/example-parameters-impl.ts
     src/workflow-discovery/workflow/full-claude-skill-command-impl.ts
     src/workflow-discovery/workflow/plugin-id-impl.ts
     src/workflow-discovery/workflow/skill-id-impl.ts
     src/workflow-discovery/workflow/workflow-description-impl.ts
     src/workflow-discovery/workflow/workflow-short-name-impl.ts
     src/workflow-discovery/workspace/ahq-directory-impl.ts
     src/workflow-discovery/workspace/ahq-file-impl.ts
     src/workflow-discovery/workspace/ahq-files-impl.ts
     src/workflow-discovery/workspace/ahq-package-impl.ts
     src/workflow-discovery/workspace/current-user-workspace-impl.ts
     src/workflow-discovery/workspace/json-file-impl.ts
     src/workflow-discovery/workspace/json-file-workflow-metadata.ts
     src/workflow-discovery/workspace/workspace-impl.ts

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/cli/agentic-hq-program.ts)
  ⎿  Read 52 lines

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/cli/workflow-registry-impl.ts)
  ⎿  Read 46 lines

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/workflow-discovery/workspace/workspace-impl.ts)
  ⎿  Read 80 lines

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts)
  ⎿  Read 49 lines

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/workflow-discovery/workspace/current-user-workspace-impl.ts)
  ⎿  Read 75 lines

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/workflow-discovery/workspace/ahq-package-impl.ts)
  ⎿  Read 79 lines

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/workflow-discovery/plugin/plugin-impl.ts)
  ⎿  Read 48 lines

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/cli/listing/listing-formatter.ts)
  ⎿  Read 178 lines

⏺ Bash(ls bin scripts && echo "=== package.json ===" && cat package.json)
  ⎿  bin:
     agentic-hq-prebuilt.cjs
     agentic-hq.cjs

     scripts:
     build-release.cjs
     mcp-scripts
     run-workflow.cjs
     === package.json ===
     {
       "name": "agentic-hq",
       "version": "0.1.1",
       "description": "Agentic HQ - Orchestrating agentic software development teams",
       "type": "module",
       "private": true,
       "bin": {
         "agentic-hq": "bin/agentic-hq.cjs"
       },
       "exports": {
         "./tools/claude-code": "./src/tools/marshalled-io-tools/claude-code/index.ts"
       },
       "scripts": {
         "// POSTINSTALL": "node-pty exec-bit repair: posix_spawnp failed on macOS because both pnpm (https://github.com/pnpm/pnpm/issues/7366) and npm extract the spawn-helper binary with -rw-r--r-- instead
     of -rwxr-xr-x. Two paths because installers lay node-pty out differently (AHQ-198): nested inside this package (npm -g), or hoisted to a sibling (npx / project-local installs, where cwd is
     <root>/node_modules/agentic-hq). Mac-only (darwin-*), fails silently on other platforms/layouts. Shipped plugin .sh exec bits are handled by the generated release manifest's
     publishConfig.executableFiles instead (AHQ-197) — see scripts/build-release.cjs.",
         "postinstall": "chmod +x node_modules/node-pty/prebuilds/darwin-*/spawn-helper ../node-pty/prebuilds/darwin-*/spawn-helper 2>/dev/null || true",
         "// PREPACK": "Wrong-tree publish guard (AHQ-198): the repo root must never be packed/published — the publishable artifact is the staged release tree. npm runs prepack even on a private package
     (private: true blocks publish but NOT pack), so this fails every root pack/publish loudly. prepack never runs at install time.",
         "prepack": "node -e \"console.error('ERROR: never pack/publish the repo root — the publishable artifact is the staged release tree. Run: pnpm build && cd release && pnpm pack. See
     docs/dev/publish-checklist.md'); process.exit(1)\"",
         "// BUILD": "The shared release build (AHQ-197): compiles the CLI graph + shipped math workflow and assembles the staged release tree (release/) — exactly what ships, under a single generated
     manifest. Packing runs FROM release/ (cd release && pnpm pack). See scripts/build-release.cjs for the steps.",
         "build": "node scripts/build-release.cjs",
         "// VALIDATION": "validate = typecheck + lint + format + unit tests (REQUIRED before commits)",
         "validate": "pnpm typecheck && pnpm lint:check && pnpm format:check && pnpm test",
         "validate:all": "pnpm typecheck && pnpm lint:check && pnpm format:check && pnpm test:all",
         "typecheck": "tsc --noEmit",
         "// LINTING": "lint:check = read-only, lint:fix = auto-fix (use carefully)",
         "lint:check": "eslint .",
         "lint:fix": "eslint . --fix",
         "// FORMATTING": "format:check = read-only, format:fix = auto-fix (use carefully)",
         "format:check": "prettier . --check",
         "format:fix": "prettier . --write",
         "// demo:agentic-hq-cli": "Uses 'node bin/agentic-hq.cjs' directly — self-contained, no global PATH dependency (same as the e2e test)",
         "// DEMO: STRING REVERSAL": "Two ways to run the string reversal demo (override the built-in default with -- --string-to-reverse='your string')",
         "demo:agentic-hq-cli:string-reversal": "node bin/agentic-hq.cjs --workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal",
         "// demo:plugin-direct": "Runs the EXACT command the skill returns (cd + pnpm install + pnpm demo:<workflow>), bypassing the agentic-hq CLI",
         "demo:plugin-direct:string-reversal": "bash -c \"(cd .agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow && pnpm install) &&
     .agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/node_modules/.bin/tsx --tsconfig
     .agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/tsconfig.json
     .agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/src/string-reversal-demo-cli.ts\"",
         "demo:plugin-direct:math-workflow": "bash -c \"(cd .agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow && pnpm install) &&
     .agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/node_modules/.bin/tsx --tsconfig .agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/tsconfig.json
     .agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/src/math-workflow-demo-cli.ts\"",
         "demo:plugin-direct:quick-jira-workflow": "bash -c \"(cd .agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow && pnpm install) &&
     .agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/node_modules/.bin/tsx --tsconfig
     .agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/tsconfig.json
     .agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/src/quick-jira-workflow-demo-cli.ts \\\"\\$@\\\"\" --",
         "demo:plugin-direct:full-jira-tdd-story-workflow": "bash -c \"(cd .agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow && pnpm install) &&
     .agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/node_modules/.bin/tsx --tsconfig
     .agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/tsconfig.json
     .agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/src/full-jira-tdd-story-workflow-demo-cli.ts \\\"\\$@\\\"\" --",
         "// TEST COMMANDS": "test = unit tests, test:unit = same as test, test:all = unit + integration + e2e",
         "test": "vitest run --config vitest.unit.config.ts",
         "test:unit": "vitest run --config vitest.unit.config.ts",
         "test:all": "pnpm test && pnpm test:integration && pnpm test:e2e",
         "// INTEGRATION TEST COMMANDS": "test:integration = ALL integration tests",
         "test:integration": "vitest run --config vitest.integration.config.ts",
         "test:integration:kill-script": "vitest run --config vitest.integration.config.ts tests/integration/process-control/kill-script-terminates-cli-process.integration.test.ts",
         "test:integration:real-claude-self-termination": "vitest run --config vitest.integration.config.ts tests/integration/claude-code-tool/real-claude-self-termination.integration.test.ts",
         "test:integration:real-claude-self-termination-skill": "vitest run --config vitest.integration.config.ts tests/integration/claude-code-tool/real-claude-self-termination-skill.integration.test.ts",
         "test:integration:claude-file-io": "vitest run --config vitest.integration.config.ts tests/integration/claude-code-tool/claude-executes-command-using-file-io.integration.test.ts",
         "test:integration:create-test-jira-and-get-status": "vitest run --config vitest.integration.config.ts tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts",
         "test:integration:build-determinism": "vitest run --config vitest.integration.config.ts tests/integration/build/build-determinism.integration.test.ts",
         "test:integration:publish-guards": "vitest run --config vitest.integration.config.ts tests/integration/build/publish-guards.integration.test.ts",
         "test:integration:bin-wrapper": "vitest run --config vitest.integration.config.ts tests/integration/bin/bin-wrapper-supplies-the-package-root-explicitly.integration.test.ts",
         "test:unit:fake-claude-file-io": "vitest run --config vitest.unit.config.ts tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts",
         "// E2E TEST COMMANDS": "test:e2e = ALL e2e tests",
         "test:e2e": "vitest run --config vitest.e2e.config.ts",
         "test:e2e:agentic-hq-cli-string-reversal": "vitest run --config vitest.e2e.config.ts tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts",
         "test:e2e:cross-workspace-string-reversal": "vitest run --config vitest.e2e.config.ts tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts",
         "test:e2e:cross-workspace-demo-math-workflow": "vitest run --config vitest.e2e.config.ts tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts",
         "test:e2e:cross-workspace-quick-jira-workflow": "vitest run --config vitest.e2e.config.ts tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts",
         "// test:e2e:prebuilt-tarball-math-workflow": "No `pnpm build` prefix needed — the test's beforeAll runs the build itself",
         "test:e2e:prebuilt-tarball-math-workflow": "vitest run --config vitest.e2e.config.ts tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts",
         "test:e2e:cross-workspace-list-workflows": "vitest run --config vitest.e2e.config.ts tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts",
         "test:e2e:user-workspace-workflows": "vitest run --config vitest.e2e.config.ts tests/e2e/demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts",
         "// WATCH MODE DISABLED": "Watch mode causes AI test execution to hang"
       },
       "engines": {
         "node": "^22.0.0 || ^24.0.0",
         "pnpm": ">=11.0.0"
       },
       "// node-pty": "Pinned to an EXACT version (no ^) on purpose — supply-chain safety. Its install/build script is ALLOWED to run on Linux (AHQ-170: node-pty ships no linux-x64 prebuild, so it compiles
     from source on install), which means a new release would execute its own code at install time. An auto-bumped (^) version could therefore run a compromised release's build script. Keep pinned; upgrade
     ONLY manually after reviewing the release. See https://agentic-hq.atlassian.net/browse/AHQ-170",
       "dependencies": {
         "commander": "^14.0.3",
         "fast-glob": "^3.3.3",
         "node-pty": "1.1.0"
       },
       "// @types/node": "Pinned to the LOWEST supported Node major (22), not the newest. @types/node's major should track the oldest Node LTS the project supports so typecheck reflects that runtime's API
     surface. See AHQ-145.",
       "devDependencies": {
         "@types/node": "^22",
         "@typescript-eslint/eslint-plugin": "^8.46.2",
         "@typescript-eslint/parser": "^8.46.2",
         "@vitest/eslint-plugin": "^1.6.6",
         "eslint": "^9.38.0",
         "eslint-config-prettier": "^10.1.8",
         "eslint-import-resolver-typescript": "^4.4.4",
         "eslint-plugin-import": "^2.29.1",
         "prettier": "^3.6.2",
         "tsx": "^4.20.6",
         "typescript": "^5.9.3",
         "typescript-eslint": "^8.53.1",
         "vitest": "^4.0.2"
       },
       "packageManager": "pnpm@11.1.2+sha512.415a1cc25974731e75455c1468371be74c5aa5fb7621b50d4056d222451609f11412f23fd602e6169f1e060466641f798597e1be961a10688836a67b16569499"
     }

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/interfaces/ahq-package-root.ts)
  ⎿  Read 12 lines

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/bin/agentic-hq.cjs)
  ⎿  Read 37 lines

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/cli/app.ts)
  ⎿  Read 31 lines

⏺ Bash(ls .agentic-hq/plugins/ && echo "=== demos plugin skills ===" && ls .agentic-hq/plugins/agentic-hq-demos-plugin/skills/ && echo "=== workflow metadata files ===" && find .agentic-hq/plugins -name
  "*.workflow.json" -o -name "workflow.json" | head -30)
  ⎿  agentic-hq-core-plugin
     agentic-hq-demos-plugin
     agentic-hq-utilities-plugin
     steve-test-plugin
     === demos plugin skills ===
     add-feature
     add-feature-detailed-example
     full-jira-tdd-story-workflow
     math-workflow
     quick-jira-workflow
     string-reversal
     === workflow metadata files ===

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/workflow-discovery/plugin/plugin-directory-impl.ts)
  ⎿  Read 37 lines

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/workflow-discovery/workflow/ahq-workflow-impl.ts)
  ⎿  Read 53 lines

⏺ Bash(cat .agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ahq-workflow.json; echo "=== add-feature ==="; cat
  .agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ahq-workflow.json; echo "=== gitignore temp ==="; grep -n "temp" .gitignore)
  ⎿  {
       "pluginId": "agentic-hq-demos-plugin",
       "skillId": "math-workflow",
       "shortId": "math",
       "description": "Passes a number through three chained math steps",
       "exampleParameters": "-- --input-number=11",
       "version": "1.0.0",
       "author": {
         "name": "Agentic HQ"
       }
     }
     === add-feature ===
     {
       "pluginId": "agentic-hq-demos-plugin",
       "skillId": "add-feature",
       "shortId": "add-feature",
       "description": "Add a small feature using a simple four-stage research/plan/implement/review workflow",
       "exampleParameters": "-- --ticket-id=PROJ-123",
       "version": "1.0.0",
       "author": {
         "name": "Agentic HQ"
       }
     }
     === gitignore temp ===
     103:# vuepress v2.x temp and cache directory
     104:.temp
     150:# Agentic HQ temporary files and user-local config overrides
     151:.agentic-hq/temp/
     152:temp/

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/bin/agentic-hq-prebuilt.cjs)
  ⎿  Read 28 lines

⏺ Now let me reproduce the bug. First, a synthetic colliding local workspace:

⏺ Bash(mkdir -p temp/AHQ-205/repro-workspace/.agentic-hq/plugins/my-local-plugin/skills/add-feature && cat >
      temp/AHQ-205/repro-workspace/.agentic-hq/plugins/my-local-plugin/skills/add-feature/ahq-workflow.json <<'EOF'
      {
        "pluginId": "my-local-plugin",
        "skillId": "add-feature",
        "shortId": "add-feature",
        "description": "A LOCAL workflow that happens to share a name with a shipped one",                                                                                                      
        "exampleParameters": "-- --ticket-id=LOCAL-1",
        "version": "1.0.0",
        "author": { "name": "Local User" }
      }
      EOF
      echo "created"; find temp/AHQ-205/repro-workspace -type f)
  ⎿  created
     temp/AHQ-205/repro-workspace/.agentic-hq/plugins/my-local-plugin/skills/add-feature/ahq-workflow.json
  ⎿  Allowed by auto mode classifier

⏺ Bash(cd /Users/stevepersonal/dev/agentic-hq/agentic-hq/temp/AHQ-205/repro-workspace && node /Users/stevepersonal/dev/agentic-hq/agentic-hq/bin/agentic-hq.cjs list 2>&1 | head -40; echo "EXIT:
      ${PIPESTATUS[0]}")
  ⎿  /Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js:655
           throw new Error(
                 ^

     Error: cannot add command 'add-feature' as already have command 'add-feature'
         at Command._registerCommand (/Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js:655:13)
         at Command.command (/Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js:174:10)
         at WorkflowRegistryImpl.register (/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/cli/workflow-registry-impl.ts:36:8)
         at PluginImpl.registerWorkflowsWith (/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/workflow-discovery/plugin/plugin-impl.ts:44:16)                                                
         at WorkspaceImpl.registerWorkflowsWith (/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/workflow-discovery/workspace/workspace-impl.ts:56:14)
         at CurrentUserWorkspaceImpl.registerWorkflowsWith (/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/workflow-discovery/workspace/current-user-workspace-impl.ts:48:27)
         at WorkflowSearchResultsImpl.registerWorkflowsWith (/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts:46:31)
         at createProgram (/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/cli/agentic-hq-program.ts:48:17)
         at Object.run (/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/cli/app.ts:25:5)
         at <anonymous> (/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/cli/main.ts:11:5)

     Node.js v24.15.0
     EXIT:
  ⎿  Allowed by auto mode classifier

⏺ Bash(for cmd in "list" "add-feature --help" "--help" "" "math"; do echo "=== agentic-hq $cmd ==="; node /Users/stevepersonal/dev/agentic-hq/agentic-hq/bin/agentic-hq.cjs $cmd >/dev/null 2>/tmp/err.txt;
      echo "exit=$?"; head -6 /tmp/err.txt | tail -3; done)
  ⎿  === agentic-hq list ===
     exit=1

     Error: cannot add command 'add-feature' as already have command 'add-feature'
         at Command._registerCommand (/Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js:655:13)
     === agentic-hq add-feature --help ===
     exit=1

     Error: cannot add command 'add-feature' as already have command 'add-feature'                                                                                                              
         at Command._registerCommand (/Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js:655:13)
     === agentic-hq --help ===
     exit=1

     Error: cannot add command 'add-feature' as already have command 'add-feature'
         at Command._registerCommand (/Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js:655:13)
     === agentic-hq  ===
     exit=1

     Error: cannot add command 'add-feature' as already have command 'add-feature'
         at Command._registerCommand (/Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js:655:13)
     === agentic-hq math ===
     exit=1
     
     Error: cannot add command 'add-feature' as already have command 'add-feature'
         at Command._registerCommand (/Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js:655:13)
  ⎿  Allowed by auto mode classifier

⏺ Bash(cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && for f in $(find .agentic-hq/plugins -name ahq-workflow.json | sort); do printf "%-30s %s\n" "$(node -e "console.log(require('./$f').shortId)")"
      "$f"; done)
  ⎿  create-workflow                .agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ahq-workflow.json
     add-feature-detailed-example   .agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature-detailed-example/ahq-workflow.json
     add-feature                    .agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ahq-workflow.json
     full-jira                      .agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ahq-workflow.json
     math                           .agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ahq-workflow.json
     quick-jira                     .agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ahq-workflow.json
     reversal                       .agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ahq-workflow.json
  ⎿  Allowed by auto mode classifier
  
⏺ Bash(cd /Users/stevepersonal/dev/agentic-hq/agentic-hq/temp/AHQ-205 && rm -rf variant-b variant-c && \
      mkdir -p variant-b/.agentic-hq/plugins/plugin-one/skills/dup/ variant-b/.agentic-hq/plugins/plugin-two/skills/dup/ && \
      for p in one two; do cat > variant-b/.agentic-hq/plugins/plugin-$p/skills/dup/ahq-workflow.json <<EOF
      {"pluginId":"plugin-$p","skillId":"dup","shortId":"dup","description":"dup in plugin-$p","exampleParameters":"","version":"1.0.0","author":{"name":"x"}}
      EOF
      done && \
      mkdir -p variant-c/.agentic-hq/plugins/plugin-one/skills/listy/ && cat > variant-c/.agentic-hq/plugins/plugin-one/skills/listy/ahq-workflow.json <<'EOF'                                  
      {"pluginId":"plugin-one","skillId":"listy","shortId":"list","description":"shadows the built-in list subcommand","exampleParameters":"","version":"1.0.0","author":{"name":"x"}}
      EOF
      echo "=== VARIANT B: two plugins in ONE workspace, same shortId ==="; (cd variant-b && node /Users/stevepersonal/dev/agentic-hq/agentic-hq/bin/agentic-hq.cjs list 2>&1 | head -5); echo "--- exit=$?"; \
      echo "=== VARIANT C: local workflow shortId 'list' (built-in reserved name) ==="; (cd variant-c && node /Users/stevepersonal/dev/agentic-hq/agentic-hq/bin/agentic-hq.cjs list 2>&1 | head -5))
  ⎿  === VARIANT B: two plugins in ONE workspace, same shortId ===
     /Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js:655
           throw new Error(
                 ^

     Error: cannot add command 'dup' as already have command 'dup'
     --- exit=0
     === VARIANT C: local workflow shortId 'list' (built-in reserved name) ===
     /Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js:655                                                               
           throw new Error(
                 ^

     Error: cannot add command 'list' as already have command 'list'
  ⎿  Allowed by auto mode classifier

⏺ Bash(cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && ls -d release 2>/dev/null && ls release | head && echo "--- git status of release ---" && git check-ignore -v release 2>/dev/null; echo "=== build
      script head ==="; head -60 scripts/build-release.cjs)
  ⎿  release
     bin
     dist
     LICENSE
     package.json
     README.md
     scripts
     --- git status of release ---
     .gitignore:155:/release/   release
     === build script head ===
     #!/usr/bin/env node
     /**
      * Shared release build (AHQ-197)
      *
      * The single build script behind `pnpm build`: compiles the CLI graph + the
      * shipped math workflow and assembles the staged release tree — a directory
      * (`release/`) holding EXACTLY what ships, under a single generated manifest.
      * Packing runs from inside `release/`, so there is no pack-time override
      * mechanism and no `files` whitelist: what is staged is what ships.
      *
      * Steps:
      *   1. Clean:   rm -rf release (clean build every time, so outputs of
      *               since-deleted sources can never linger into an artifact)
      *   2. Compile: tsc -p tsconfig.build.json → release/dist. The compiled JS
      *               self-reference-resolves 'agentic-hq/tools/claude-code'
      *               against the generated release manifest (step 4) — the
      *               nearest ancestor manifest — identically in a dev build-first
      *               run and in the installed npm package.
      *   3. Stage:   release/ += generated manifest + prebuilt bin wrapper + the
      *               workflow runner + the shipped plugins + README/LICENSE
      *   4. Manifest: generate release/package.json from the root package.json —
      *               one source of truth, transformed, never hand-maintained
      *
      * Failures throw uncaught with a full stack trace, per this repo's
      * catastrophic-failure convention.
      */

     const { execFileSync } = require('child_process');
     const fs = require('fs');
     const path = require('path');

     const repoRoot = path.join(__dirname, '..');
     const releaseDir = path.join(repoRoot, 'release');

     // Only these plugins ship — steve-test-plugin and any other local plugin stay dev-only
     const SHIPPED_PLUGINS = [
       'agentic-hq-core-plugin',
       'agentic-hq-demos-plugin',
       'agentic-hq-utilities-plugin',
     ];

     // AHQ-198: unmigrated workflows are excluded from the artifact until AHQ-201
     // migrates them — their legacy launch commands (pnpm install + tsx inside the
     // package) cannot work in the read-only npm install. AHQ-201 deletes entries
     // from this list as it migrates each workflow. Dev mode is untouched: dev
     // discovery reads the repo plugins tree, never the staged one.
     const EXCLUDED_UNMIGRATED_SKILLS = [
       'agentic-hq-core-plugin/skills/create-workflow',
       'agentic-hq-demos-plugin/skills/add-feature-detailed-example',
       'agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow',
       'agentic-hq-demos-plugin/skills/quick-jira-workflow',
       'agentic-hq-demos-plugin/skills/string-reversal',
     ];

     // ---------------------------------------------------------------------------
     // 1. Clean (also removes any stale repo-root dist/ left by pre-AHQ-197
     //    builds, which emitted there)
     // ---------------------------------------------------------------------------
     fs.rmSync(releaseDir, { recursive: true, force: true });
     fs.rmSync(path.join(repoRoot, 'dist'), { recursive: true, force: true });
  ⎿  Allowed by auto mode classifier

⏺ Bash(find release/.agentic-hq -name ahq-workflow.json | sort && echo "=== run prebuilt wrapper FROM REPO CLONE ROOT (the real scenario) ===" && node release/bin/agentic-hq-prebuilt.cjs list 2>&1 | head
      -12; echo "exit=$?")
  ⎿  release/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ahq-workflow.json
     release/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ahq-workflow.json
     === run prebuilt wrapper FROM REPO CLONE ROOT (the real scenario) ===
     /Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js:655
           throw new Error(
                 ^

     Error: cannot add command 'add-feature' as already have command 'add-feature'
         at Command._registerCommand (/Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js:655:13)                          
         at Command.command (/Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js:174:10)
         at WorkflowRegistryImpl.register (file:///Users/stevepersonal/dev/agentic-hq/agentic-hq/release/dist/src/cli/workflow-registry-impl.js:30:14)
         at PluginImpl.registerWorkflowsWith (file:///Users/stevepersonal/dev/agentic-hq/agentic-hq/release/dist/src/workflow-discovery/plugin/plugin-impl.js:38:22)
         at WorkspaceImpl.registerWorkflowsWith (file:///Users/stevepersonal/dev/agentic-hq/agentic-hq/release/dist/src/workflow-discovery/workspace/workspace-impl.js:49:20)
         at CurrentUserWorkspaceImpl.registerWorkflowsWith (file:///Users/stevepersonal/dev/agentic-hq/agentic-hq/release/dist/src/workflow-discovery/workspace/current-user-workspace-impl.js:41:31)
         at WorkflowSearchResultsImpl.registerWorkflowsWith
     (file:///Users/stevepersonal/dev/agentic-hq/agentic-hq/release/dist/src/workflow-discovery/workflow-listing/workflow-search-results-impl.js:41:35)
     exit=0
  ⎿  Allowed by auto mode classifier

⏺ Now let me test the path-normalisation concern flagged for this sub-task:

⏺ Bash(rm -f temp/AHQ-205/repo-symlink && ln -s /Users/stevepersonal/dev/agentic-hq/agentic-hq temp/AHQ-205/repo-symlink && \
      echo "=== 1. cd via SYMLINK to repo root, run dev wrapper ===" && (cd temp/AHQ-205/repo-symlink && pwd && node bin/agentic-hq.cjs list 2>&1 | head -8) && \
      echo "" && echo "=== 2. TRAILING SLASH on --ahq-package-root, run from repo root ===" && node_modules/.bin/tsx src/cli/main.ts --build-mode=build-first
      --ahq-package-root=/Users/stevepersonal/dev/agentic-hq/agentic-hq/ list 2>&1 | head -8)
  ⎿  === 1. cd via SYMLINK to repo root, run dev wrapper ===
     /Users/stevepersonal/dev/agentic-hq/agentic-hq/temp/AHQ-205/repo-symlink

     Available workflows

       Agentic HQ Package: /Users/stevepersonal/dev/agentic-hq/agentic-hq

         Plugin: agentic-hq-core-plugin
  
           agentic-hq create-workflow

     === 2. TRAILING SLASH on --ahq-package-root, run from repo root ===
     /Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js:655
           throw new Error(
                 ^

     Error: cannot add command 'create-workflow' as already have command 'create-workflow'
         at Command._registerCommand (/Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js:655:13)
         at Command.command (/Users/stevepersonal/dev/agentic-hq/agentic-hq/node_modules/.pnpm/commander@14.0.3/node_modules/commander/lib/command.js:174:10)
         at WorkflowRegistryImpl.register (/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/cli/workflow-registry-impl.ts:36:8)
  ⎿  Allowed by auto mode classifier

⏺ Bash(ls tests/unit && echo "=== registry/listing/workspace tests ===" && find tests -type f \( -name "*registry*" -o -name "*workspace*" -o -name "*listing*" -o -name "*program*" -o -name "*package-root*"
  \) | sort)
  ⎿  claude-code-tool
     cli
     e2e-helpers
     interfaces
     io
     kernel
     runtime-params
     tools
     workflow
     workflow-discovery
     workflow-runtime
     === registry/listing/workspace tests ===
     tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts
     tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts
     tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts
     tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts
     tests/e2e/demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts
     tests/e2e/fixtures/string-reversal-copy-for-test/skills/string-reversal-copy-for-test/ts-workflow/pnpm-workspace.yaml
     tests/integration/bin/bin-wrapper-supplies-the-package-root-explicitly.integration.test.ts
     tests/unit/cli/agentic-hq-program.unit.test.ts
     tests/unit/cli/listing/listing-formatter.unit.test.ts
     tests/unit/cli/workflow-registry-impl.unit.test.ts
     tests/unit/runtime-params/default-ahq-package-root.unit.test.ts
     tests/unit/workflow-discovery/test-fixtures/stub-workflow-registry.ts
     tests/unit/workflow-discovery/test-fixtures/workspace-fixture.ts
     tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts
     tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts

⏺ Bash(ls src/runtime-params/ && cat src/runtime-params/default-ahq-package-root.ts 2>/dev/null; cat src/runtime-params/default-ahq-command-line.ts 2>/dev/null | head -80)
  ⎿  default-ahq-command-line.ts
     default-ahq-package-root.ts
     default-ahq-runtime-params.ts
     /**
      * DefaultAhqPackageRoot — the standard AhqPackageRoot value object.
      *
      * SRP Does: Hold the directory the agentic-hq package lives in, rejecting an
      * empty path loudly (fail fast, no defaults — throws uncaught per this                                                                                                                    
      * repo's catastrophic-failure convention).
      *
      * SRP Knows Nothing About: What lives under the path or how it is used.
      */

     import type { AhqPackageRoot } from '../interfaces/ahq-package-root.js';

     export class DefaultAhqPackageRoot implements AhqPackageRoot {
       constructor(private readonly path: string) {
         if (!path) {
           throw new Error('DefaultAhqPackageRoot: path must be a non-empty string');
         }
       }

       getPath(): string {
         return this.path;
       }
     }
     /**
      * DefaultAhqCommandLine — the standard AhqCommandLine (AHQ-197).
      *
      * Constructed from the entire raw `process.argv`. The constructor is the
      * fail-fast validation point for option PRESENCE: an AHQ entry-point
      * wrapper always inserts `--build-mode=` and `--ahq-package-root=`, so a
      * command line missing either was not composed by a wrapper and throws
      * loudly (uncaught, per this repo's catastrophic-failure convention).
      * Value validation stays delegated to the value objects —
      * `BuildMode.fromValue()` and `DefaultAhqPackageRoot`.
      */
     import type { AhqCommandLine } from '../interfaces/ahq-command-line.js';
     import type { AhqRuntimeParams } from '../interfaces/ahq-runtime-params.js';
     import { BuildMode } from '../interfaces/build-mode.js';

     import { DefaultAhqPackageRoot } from './default-ahq-package-root.js';
     import { DefaultAhqRuntimeParams } from './default-ahq-runtime-params.js';

     const BUILD_MODE_OPTION = '--build-mode=';
     const AHQ_PACKAGE_ROOT_OPTION = '--ahq-package-root=';

     export class DefaultAhqCommandLine implements AhqCommandLine {
       private readonly ahqRuntimeParams: AhqRuntimeParams;
       private readonly remainingArgs: string[];

       constructor(argv: string[]) {
         let buildModeValue: string | undefined;
         let ahqPackageRootPath: string | undefined;
         const remainingArgs: string[] = [];

         for (const arg of argv) {
           if (arg.startsWith(BUILD_MODE_OPTION)) {
             buildModeValue = arg.slice(BUILD_MODE_OPTION.length);
           } else if (arg.startsWith(AHQ_PACKAGE_ROOT_OPTION)) {
             ahqPackageRootPath = arg.slice(AHQ_PACKAGE_ROOT_OPTION.length);
           } else {
             remainingArgs.push(arg);
           }
         }

         if (!buildModeValue) {
           throw new Error(
             `DefaultAhqCommandLine: required option ${BUILD_MODE_OPTION}<build-first|prebuilt> is missing — an entry-point wrapper (the bin wrapper or the workflow runner) inserts it, so a direct invocation
     must supply it explicitly`
           );
         }
         if (!ahqPackageRootPath) {
           throw new Error(
             `DefaultAhqCommandLine: required option ${AHQ_PACKAGE_ROOT_OPTION}<dir> is missing — an entry-point wrapper (the bin wrapper or the workflow runner) inserts it, so a direct invocation must
     supply it explicitly`
           );
         }

         this.ahqRuntimeParams = new DefaultAhqRuntimeParams(
           BuildMode.fromValue(buildModeValue),
           new DefaultAhqPackageRoot(ahqPackageRootPath)
         );
         this.remainingArgs = remainingArgs;
       }

       getAhqRuntimeParams(): AhqRuntimeParams {
         return this.ahqRuntimeParams;
       }

       getRemainingArgs(): string[] {
         return [...this.remainingArgs];
       }
     }

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/tests/unit/cli/agentic-hq-program.unit.test.ts)
  ⎿  Read 132 lines

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/tests/unit/cli/workflow-registry-impl.unit.test.ts)
  ⎿  Read 66 lines

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/tests/unit/workflow-discovery/test-fixtures/workspace-fixture.ts)
  ⎿  Read 62 lines

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts)
  ⎿  Read 145 lines

⏺ Bash(claude --help 2>&1 | grep -i -A2 "plugin" | head -30; echo "=== claude plugin subcommand? ==="; claude plugin --help 2>&1 | head -25)
  ⎿    --bare                                Minimal mode: skip hooks, LSP, plugin
                                             sync, attribution, auto-memory,
                                             background prefetches, keychain reads,
     --
                                             --settings, --agents, --plugin-dir.
       --betas <betas...>                    Beta headers to include in API requests
                                             (API key users only)
     --
       --plugin-dir <path>                   Load a plugin from a directory or .zip                                                                                                             
                                             for this session only (repeatable:
                                             --plugin-dir A --plugin-dir B.zip)
                                             (default: [])
       --plugin-url <url>                    Fetch a plugin .zip from a URL for this
                                             session only (repeatable: --plugin-url A
                                             --plugin-url B) (default: [])
       -p, --print                           Print response and exit (useful for
                                             pipes). Note: The workspace trust dialog
     --
                                             (CLAUDE.md, skills, plugins, hooks, MCP
                                             servers, custom commands and agents,
                                             output styles, workflows, custom themes,
     --
       plugin|plugins                        Manage Claude Code plugins
       project                               Manage Claude Code project state
       setup-token                           Set up a long-lived authentication token
     === claude plugin subcommand? ===
     Usage: claude plugin|plugins [options] [command]

     Manage Claude Code plugins

     Options:
       -h, --help                           Display help for command

     Commands:
       details [options] <name>             Show a plugin's component inventory and
                                            projected token cost
       disable [options] [plugin]           Disable an enabled plugin
       enable [options] <plugin>            Enable a disabled plugin
       eval [options] [target]              Run eval cases (evals/**/case.yaml or
                                            evals/**/prompt.md + graders/*.md)
                                            against a plugin and report scored
                                            results. Target is a path, a plugin name,
                                            or a `plugin@marketplace` id — installed
                                            and skills-dir plugins both resolve (and
                                            add a no-plugin baseline arm)
       help [command]                       display help for command
       init|new [options] <name>            Scaffold a new plugin at
                                            ~/.claude/skills/<name>/ (auto-loads next
                                            session as <name>@skills-dir)
       install|i [options] <plugin>         Install a plugin from available
                                            marketplaces (use plugin@marketplace for
  ⎿  Allowed by auto mode classifier

⏺ Let me probe how Claude Code itself handles two plugin dirs with the same plugin name — relevant to the fix options:

⏺ Bash(cat .agentic-hq/plugins/agentic-hq-demos-plugin/.claude-plugin/plugin.json && echo "=== build probe dirs ===" && rm -rf temp/AHQ-205/dupe-plugins && mkdir -p
      temp/AHQ-205/dupe-plugins/a/dupe-probe-plugin/.claude-plugin temp/AHQ-205/dupe-plugins/a/dupe-probe-plugin/skills/probe-skill temp/AHQ-205/dupe-plugins/b/dupe-probe-plugin/.claude-plugin
      temp/AHQ-205/dupe-plugins/b/dupe-probe-plugin/skills/probe-skill && \
      for side in a b; do
      cat > temp/AHQ-205/dupe-plugins/$side/dupe-probe-plugin/.claude-plugin/plugin.json <<EOF
      {"name":"dupe-probe-plugin","description":"probe copy $side","version":"1.0.0"}
      EOF
      cat > temp/AHQ-205/dupe-plugins/$side/dupe-probe-plugin/skills/probe-skill/SKILL.md <<EOF
      ---
      name: probe-skill
      description: Probe skill copy $side
      ---
      This is copy $side.
      EOF
      done; find temp/AHQ-205/dupe-plugins -type f | sort)
  ⎿  {
       "name": "agentic-hq-demos-plugin",
       "description": "Demo workflows for Agentic HQ showcasing orchestration capabilities",
       "version": "0.0.1",
       "author": {
         "name": "Agentic HQ"
       }
     }
     === build probe dirs ===
     temp/AHQ-205/dupe-plugins/a/dupe-probe-plugin/.claude-plugin/plugin.json
     temp/AHQ-205/dupe-plugins/a/dupe-probe-plugin/skills/probe-skill/SKILL.md
     temp/AHQ-205/dupe-plugins/b/dupe-probe-plugin/.claude-plugin/plugin.json
     temp/AHQ-205/dupe-plugins/b/dupe-probe-plugin/skills/probe-skill/SKILL.md
  ⎿  Allowed by auto mode classifier

⏺ Bash(cd /Users/stevepersonal/dev/agentic-hq/agentic-hq/temp/AHQ-205 && timeout 120 claude --plugin-dir=dupe-plugins/a/dupe-probe-plugin --plugin-dir=dupe-plugins/b/dupe-probe-plugin --print --model haiku
      "Reply with exactly the word OK and nothing else." 2>&1 | head -20; echo "exit=$?")
  ⎿  OK
     exit=0
  ⎿  Allowed by auto mode classifier

⏺ Bash(timeout 180 claude --plugin-dir=dupe-plugins/a/dupe-probe-plugin --plugin-dir=dupe-plugins/b/dupe-probe-plugin --print --model haiku "Do not use any tools. Look at the skills available to you. Is
      there a skill called probe-skill? List every probe-skill entry you can see with its exact description text, and say how many there are. Answer in under 40 words." 2>&1 | head -20)
  ⎿  Yes, there is one probe-skill entry visible:
     
     1. **dupe-probe-plugin:probe-skill** — "Probe skill copy a"

     **Total: 1 probe-skill entry**
  ⎿  Allowed by auto mode classifier

⏺ Bash(timeout 180 claude --plugin-dir=dupe-plugins/b/dupe-probe-plugin --plugin-dir=dupe-plugins/a/dupe-probe-plugin --print --model haiku "Do not use any tools. Is there a skill called probe-skill? Quote
      its exact description text and say how many probe-skill entries exist. Under 30 words." 2>&1 | head -20)
  ⎿  Yes, there is one probe-skill entry:
     
     **dupe-probe-plugin:probe-skill** — "Probe skill copy b"

     **Count: 1 entry exists.**
  ⎿  Allowed by auto mode classifier

⏺ Bash(cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && for d in AHQ-200 AHQ-202 AHQ-204; do echo "=== $d ==="; find docs/tickets/$d -type f | head -20; done)
  ⎿  === AHQ-200 ===
     docs/tickets/AHQ-200/workflow-files/03-implementation-summary.md
     docs/tickets/AHQ-200/workflow-files/02-implementation-plan.md
     docs/tickets/AHQ-200/workflow-files/01-feature-brief.md
     docs/tickets/AHQ-200/workflow-files/04-review-summary.md
     docs/tickets/AHQ-200/workflow-files/supporting-docs/AHQ-206_later_refactor_jira_description.md
     === AHQ-202 ===
     docs/tickets/AHQ-202/workflow-files/03-implementation-summary.md
     docs/tickets/AHQ-202/workflow-files/02-implementation-plan.md
     docs/tickets/AHQ-202/workflow-files/01-feature-brief.md
     docs/tickets/AHQ-202/workflow-files/04-review-summary.md
     docs/tickets/AHQ-202/workflow-files/supporting-files/AHQ-205_bug_Jira.md                                                                                                                   
     === AHQ-204 ===
     docs/tickets/AHQ-204/01-work-details.md
  ⎿  Allowed by auto mode classifier

⏺ Bash(cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && git log --oneline -8 && git status --short | head)
  ⎿  b959e2f WIP: AHQ-200 Reviewer: bin-wrapper regression test
     b660376 WIP: AHQ-200 Implementer: env var eliminated, package rename
     cf2043d WIP: AHQ-200 Planner: implementation plan approved
     dc1a627 WIP: AHQ-200 brief; AHQ-206 filed; AHQ-195 AC added
     784904f WIP: AHQ-195 brief: AHQ-199 docs moved to last sub-task
     dca68e7 WIP: AHQ-202 review summary: review stage skipped
     6d15bc0 WIP: AHQ-202 brief/plan/summary; AHQ-205 bug filed
     d7c32ad WIP: AHQ-198 Reviewer: review summary, 0.1.0 deprecated
  
⏺ Bash(echo "=== prebuilt from repo SUBDIR (src/) ===" && (cd src && node ../release/bin/agentic-hq-prebuilt.cjs list 2>&1 | head -6); echo "=== exit code of crash ===" ; (cd temp/AHQ-205/repro-workspace &&
      node /Users/stevepersonal/dev/agentic-hq/agentic-hq/bin/agentic-hq.cjs list >/dev/null 2>&1; echo "exit=$?"))
  ⎿  === prebuilt from repo SUBDIR (src/) ===

     Available workflows

       Agentic HQ Package: /Users/stevepersonal/dev/agentic-hq/agentic-hq/release

         Plugin: agentic-hq-demos-plugin
     === exit code of crash ===
     exit=1
  ⎿  Allowed by auto mode classifier
  
⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts)
  ⎿  Read 143 lines

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts)
  ⎿  Read 106 lines

⏺ Read(/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/workflow-discovery/interfaces/workflow-registry.ts)
  ⎿  Read 18 lines

⏺ Bash(echo "=== collision/duplicate mentions in docs+src ===" && grep -rn "collision\|collide\|duplicate command\|already have command" --include="*.md" --include="*.ts" docs/dev docs/user-docs src
  2>/dev/null | head -20; echo; echo "=== ahq-package-root in add-feature workflow ===" && grep -rn "ahq-package-root" .agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ | head -20)
  ⎿  === collision/duplicate mentions in docs+src ===
     docs/dev/project-design-requirements.md:195:- **Temp dirs need UID** (`feedback_temp_dirs_need_uid.md`) — test and runtime temp dirs must include a UUID, not just a timestamp; vitest parallelism and
     same-second workflow steps **will** collide on a timestamp-only path eventually. Use `<timestamp>_<uuid>` — see `JsonFileIOMarshallerSession` building `io-files-<timestamp>_<uuid>` via
     `crypto.randomUUID()` (`src/io/marshalling/json-file-io-marshaller-session.ts:39`).

     === ahq-package-root in add-feature workflow ===
     .agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/SKILL.md:12:ahq-package-root = $2
     .agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/SKILL.md:22:  "command-output-string": "node \"{ahq-package-root}/scripts/run-workflow.cjs\" --ahq-package-root=\"{ahq-package-root}\"
     --build-mode={build-mode} --workflow-js=dist/.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ts-workflow/src/add-feature-cli.js"
     .agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/SKILL.md:26:INFO FOR YOU ONLY (Don't tell user): The command above invokes the shared workflow runner with the explicit runtime parameters
     you were handed as arguments — you relay `build-mode` and `ahq-package-root` VERBATIM into the command without interpreting or acting on them. The runner is the only code that acts on `build-mode`:
     `build-first` builds the release tree and executes the workflow JS from it; `prebuilt` executes the installed artifact as-is. Everything runs under plain node from the execution root — no package
     manager, no symlinks, no environment variables.
     .agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ts-workflow/src/add-feature-cli.ts:21: * The framework's required --build-mode / --ahq-package-root options
     .agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ts-workflow/src/add-feature-cli.ts:55:      `The variables used in this workflow are:
     ahq-package-root=${runtime.getAhqPackageRoot().getPath()}` +

⏺ Bash(grep -rn "ahq-package-root\|agentic-hq-workspace-root" .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/*.md | head -20; echo "=== ticket-doc dir convention in add-feature ==="; grep
  -rn "docs/tickets" .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/01-*.md | head -5)
  ⎿  .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/02-planner.md:35:`The variables used in this workflow are: ahq-package-root=/path/to/agentic-hq and ticket-id=PROJ-123`
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/02-planner.md:38:- `ahq-package-root`
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/02-planner.md:44:roots — the chain is self-contained (built from `ahq-package-root`, `project-root`, and
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/02-planner.md:50:ahq-package-root = (parsed from input)
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/02-planner.md:55:demos-plugin-dir       = {ahq-package-root}/.agentic-hq/plugins/agentic-hq-demos-plugin
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/02-planner.md:77:- `ahq-package-root` — required
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/01-researcher.md:35:`The variables used in this workflow are: ahq-package-root=/path/to/agentic-hq and ticket-id=PROJ-123`
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/01-researcher.md:38:- `ahq-package-root`                                                                                  
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/01-researcher.md:44:roots — the chain is self-contained (built from `ahq-package-root`, `project-root`, and
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/01-researcher.md:50:ahq-package-root = (parsed from input)
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/01-researcher.md:55:demos-plugin-dir       = {ahq-package-root}/.agentic-hq/plugins/agentic-hq-demos-plugin
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/01-researcher.md:77:- `ahq-package-root` — required
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/03-implementer.md:34:`The variables used in this workflow are: ahq-package-root=/path/to/agentic-hq and ticket-id=PROJ-123`
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/03-implementer.md:37:- `ahq-package-root`
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/03-implementer.md:43:roots — the chain is self-contained (built from `ahq-package-root`, `project-root`, and
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/03-implementer.md:49:ahq-package-root = (parsed from input)
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/03-implementer.md:54:demos-plugin-dir       = {ahq-package-root}/.agentic-hq/plugins/agentic-hq-demos-plugin
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/03-implementer.md:76:- `ahq-package-root` — required
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/04-reviewer.md:36:`The variables used in this workflow are: ahq-package-root=/path/to/agentic-hq and ticket-id=PROJ-123`
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/04-reviewer.md:39:- `ahq-package-root`
     === ticket-doc dir convention in add-feature ===
     .agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/01-researcher.md:68:workflow-files-dir          = {project-root}/docs/tickets/{ticket-id}/workflow-files

⏺ Bash(cd /Users/stevepersonal/dev/agentic-hq/agentic-hq/temp/AHQ-205 && rm -rf variant-d && mkdir -p variant-d/.agentic-hq/plugins/plugin-one/skills/helpy && cat >
      variant-d/.agentic-hq/plugins/plugin-one/skills/helpy/ahq-workflow.json <<'EOF'
      {"pluginId":"plugin-one","skillId":"helpy","shortId":"help","description":"shadows the built-in help","exampleParameters":"","version":"1.0.0","author":{"name":"x"}}
      EOF
      cd variant-d && node /Users/stevepersonal/dev/agentic-hq/agentic-hq/bin/agentic-hq.cjs list 2>&1 | head -8)
  ⎿  Available workflows
  
       Agentic HQ Package: /Users/stevepersonal/dev/agentic-hq/agentic-hq

         Plugin: agentic-hq-core-plugin

           agentic-hq create-workflow
  ⎿  Allowed by auto mode classifier
  
⏺ Bash(node /Users/stevepersonal/dev/agentic-hq/agentic-hq/bin/agentic-hq.cjs --help 2>&1 | tail -12)
  ⎿    list                          List available workflow skills
       create-workflow               Create a new Agentic HQ workflow
       add-feature                   Add a small feature using a simple four-stage
                                     research/plan/implement/review workflow
       add-feature-detailed-example  Worked example of a detailed, opinionated
                                     seven-stage add-feature workflow based on one
                                     creator's development process
       full-jira                     Full TDD story workflow driven by a Jira ticket
       math                          Passes a number through three chained math steps                                                                                                           
       quick-jira                    Reads a Jira ticket and completes it via TDD
       reversal                      Reverses a string (hello world demo)
       help                          shadows the built-in help
  ⎿  Allowed by auto mode classifier

⏺ I've reproduced the bug and completed the research. Now writing the document:

⏺ Write(/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/tickets/AHQ-205/workflow-files/01-research-and-plan-of-action.md)
  ⎿  Wrote 435 lines to /Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/tickets/AHQ-205/workflow-files/01-research-and-plan-of-action.md
        1 # AHQ-205 — Research And Plan Of Action
        2 
        3 > **Ticket:** [AHQ-205](https://agentic-hq.atlassian.net/browse/AHQ-205) — *Bug: agentic-hq CLI
        4 > Installed From Npm Crashes When add-feature Workflow Runs From AHQ Workspace Root*
        5 > **Type:** Sub-task (Bug) · **Parent:** [AHQ-195](https://agentic-hq.atlassian.net/browse/AHQ-195)
        6 > — *Publish agentic-hq Tool To Npm* · **Status:** Backlog · **Priority:** Medium
        7 > **Reported:** 2026-08-14 · **Researched:** 2026-08-16
        8 > **Sources read:** the Jira itself (via MCP), `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md`
        9 > (§ *Split Suggestion* item 6 and § *Open Sub-Task Instructions → Sub-Task 6*), and
       10 > `docs/tickets/AHQ-202/workflow-files/supporting-files/AHQ-205_bug_Jira.md` (the full filed description).
       11
       12 ---
       13
       14 ## 1. Ticket At A Glance
       15
       16 When the `agentic-hq` CLI is run from a directory whose **local workspace** defines a workflow with
       17 the same short name as one shipped in the **AHQ package**, the CLI crashes during program
       18 construction with an uncaught Commander error — *before any subcommand runs*:
       19
       20 ```
       21 Error: cannot add command 'add-feature' as already have command 'add-feature'
       22 ```
       23
       24 Every invocation from such a directory fails: `list`, `add-feature`, `--help`, and a bare
       25 `agentic-hq`. Exit code 1. There is no workaround other than changing directory or renaming the
       26 local workflow.
       27
       28 **Expected behaviour (per the Jira):** a *deliberate collision policy* instead of a crash. The Jira
       29 offers three candidate behaviours and explicitly says a **decision is needed** — see §6.
       30
       31 ---
       32
       33 ## 2. Where This Sits In AHQ-195
       34
       35 AHQ-205 is **Sub-Task 6 of 8** in the parent npm-publish story. Sub-Tasks 1–5 (AHQ-196, AHQ-197,
       36 AHQ-198, AHQ-202 + AHQ-204, AHQ-200) are complete. Remaining after this one: AHQ-201 (migrate the
       37 five unmigrated workflows and the scaffolder, then re-publish) and AHQ-199 (README/docs).
       38
       39 The parent brief adds **two instructions specific to this Sub-Task**, both carried into the plan
       40 below:
       41
       42 1. **Decide path normalisation explicitly.** `WorkspaceImpl.isAhqPackage()` compares raw strings, so
       43    a trailing slash or a symlinked invocation could make the dedup guard silently miss. AHQ-200
       44    preserved that behaviour bit-for-bit while migrating the guard's source of truth from the env var
       45    to the injected root, and deliberately left the decision here. → **Researched in §5.5; both cases
       46    tested, one is real.**
       47 2. **Verify AHQ-200's AC 5 on this ticket's own add-feature run.** AHQ-200 renamed the add-feature
       48    relay variable to `ahq-package-root`, but the rename was never exercised end-to-end (that
       49    workflow process had started before the rename landed, so it relayed the old name all run).
       50    → **Static half already verified in §5.7; the runtime half is a plan step.**
       51
       52 Because AHQ-201 owns the next `(re)publish`, the fix from this ticket reaches the npm registry as
       53 part of AHQ-201 — this ticket itself does not need to publish. *(Reading of the brief's Sub-Task
       54 list; worth a one-line confirmation from the human.)*
       55
       56 ---
       57
       58 ## 3. Reproduction — Confirmed, Four Ways
       59
       60 All four were run on 2026-08-16 on this machine (macOS, Node v24.15.0, `agentic-hq` working tree at
       61 `feature/ahq-195-publish-to-npm`, commit `b959e2f`). Fixtures live in `temp/AHQ-205/` (gitignored).
       62
       63 ### 3.1 The real scenario — prebuilt package run from the repo clone root ✅ reproduced
       64
       65 This is the exact structural equivalent of the reported npm-install case: the prebuilt artifact in
       66 `release/` *is* the installed package (`--ahq-package-root=<repo>/release`), and the cwd is the repo
       67 clone, whose local workspace ships `add-feature`.
       68
       69 ```bash
       70 cd /Users/stevepersonal/dev/agentic-hq/agentic-hq
       71 node release/bin/agentic-hq-prebuilt.cjs list
       72 ```
       73
       74 Produces the **line-for-line stack trace from the Jira**, through the compiled `release/dist/…`
       75 files: `WorkflowRegistryImpl.register` → `PluginImpl.registerWorkflowsWith` →
       76 `WorkspaceImpl.registerWorkflowsWith` → `CurrentUserWorkspaceImpl.registerWorkflowsWith` →
       77 `WorkflowSearchResultsImpl.registerWorkflowsWith` → `createProgram`.
       78
       79 ### 3.2 Minimal synthetic repro — dev wrapper, colliding local workflow ✅ reproduced
       80
       81 No build or install needed. A local workspace containing one workflow whose `shortId` is
       82 `add-feature`, under a plugin named something else entirely:
       83
       84 ```
       85 temp/AHQ-205/repro-workspace/.agentic-hq/plugins/my-local-plugin/skills/add-feature/ahq-workflow.json
       86   { "pluginId": "my-local-plugin", "skillId": "add-feature", "shortId": "add-feature", … }
       87 ```
       88
       89 ```bash
       90 cd temp/AHQ-205/repro-workspace
       91 node /path/to/agentic-hq/bin/agentic-hq.cjs list
       92 ```
       93
       94 Same error, same chain (through `src/…` rather than `dist/…`). **Every** entry point crashes —
       95 verified individually: `list`, `add-feature --help`, `--help`, `math`, and bare `agentic-hq`, all
       96 exit code **1**.
       97
       98 This matters for the fix: the collision needs **only a matching `shortId`**. The plugin names do not
       99 have to match, so this is not a "don't clone the repo" problem — it is any user whose project
      100 defines a workflow called `add-feature` or `math`.
      101
      102 ### 3.3 Undiscovered variant — two plugins in **one** workspace ✅ reproduced
      103
      104 Not mentioned in the Jira. Two plugins in the *same* workspace, each with `shortId: "dup"`:
      105
      106 ```
      107 Error: cannot add command 'dup' as already have command 'dup'
      108 ```
      109
      110 The cross-workspace dedup guard (`isAhqPackage()`) is irrelevant here — this crashes even in a
      111 single workspace, and it crashes inside the **AHQ package itself** if two shipped plugins ever
      112 collide. Any fix scoped only to "local vs package" leaves this crash in place.
      113
      114 ### 3.4 Undiscovered variant — a workflow named `list` ✅ reproduced
      115
      116 Also not in the Jira. A workflow whose `shortId` is `list` collides with the CLI's own built-in
      117 subcommand (`agentic-hq-program.ts:41`):
      118
      119 ```
      120 Error: cannot add command 'list' as already have command 'list'
      121 ```
      122
      123 This is the nastiest of the four, because `list` is the very command a confused user would run to
      124 find out what is going on.
      125
      126 **Checked and clear:** `help` is **not** reserved. A workflow with `shortId: "help"` registers
      127 cleanly and appears in `--help` output — Commander's implicit help is not a registered command, so
      128 it does not collide. `list` is the only reserved name today (verified, not assumed).
      129
      130 ---
      131
      132 ## 4. Root Cause
      133
      134 Program construction registers workflows from both workspaces into one flat Commander namespace,
      135 with nothing checking for a name already taken:
      136
      137 | Step | File | What happens |
      138 | --- | --- | --- |
      139 | 1 | `src/cli/agentic-hq-program.ts:40-45` | The built-in `list` subcommand is registered first. |
      140 | 2 | `src/cli/agentic-hq-program.ts:48` | `searchResults.registerWorkflowsWith(new WorkflowRegistryImpl(program, builder))`. |
      141 | 3 | `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts:44-47` | AHQ package registers **first**, then the current user workspace. |
      142 | 4 | `src/workflow-discovery/workspace/current-user-workspace-impl.ts:44-49` | Skips itself **only** when `isAhqPackage()` — i.e. only when cwd *is* the package root. |
      143 | 5 | `src/workflow-discovery/workspace/workspace-impl.ts:54-58` → `plugin/plugin-impl.ts:42-46` | Each plugin registers each discovered workflow, unconditionally. |
      144 | 6 | `src/cli/workflow-registry-impl.ts:35-36` | `this.program.command(shortName)` — **Commander throws** on a duplicate name. |
      145
      146 The existing `isAhqPackage()` guard is a *same-directory* guard, not a *same-name* guard. It was
      147 only ever designed to stop the AHQ package's own plugins being registered twice when you run the CLI
      148 from inside the package. It cannot help when the two roots genuinely differ — which is precisely the
      149 npm-installed case, and is now the **normal** case rather than the exception.
      150
      151 **Failure mode:** unrecoverable, uncaught, at construction time. That is consistent with this repo's
      152 documented catastrophic-failure convention (throw uncaught, full stack trace, no logging system) —
      153 but this is not a catastrophic failure. It is ordinary, user-caused, entirely foreseeable input, and
      154 it should never have been allowed to reach that convention.
      155
      156 ---
      157
      158 ## 5. Research Findings
      159
      160 ### 5.1 The collision key is `shortId` alone
      161
      162 `WorkflowRegistryImpl.register` uses `workflow.getShortName()` as the Commander command name.
      163 `shortId` comes straight from each `ahq-workflow.json`. Current shipped short names:
      164
      165 | shortId | Plugin / skill |
      166 | --- | --- |
      167 | `create-workflow` | `agentic-hq-core-plugin/skills/create-workflow` |
      168 | `add-feature` | `agentic-hq-demos-plugin/skills/add-feature` |
      169 | `add-feature-detailed-example` | `agentic-hq-demos-plugin/skills/add-feature-detailed-example` |
      170 | `full-jira` | `agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow` |
      171 | `math` | `agentic-hq-demos-plugin/skills/math-workflow` |
      172 | `quick-jira` | `agentic-hq-demos-plugin/skills/quick-jira-workflow` |
      173 | `reversal` | `agentic-hq-demos-plugin/skills/string-reversal` |
      174
      175 Only **`add-feature`** and **`math`** currently ship in the published artifact (the other five are in
      176 `EXCLUDED_UNMIGRATED_SKILLS` in `scripts/build-release.cjs` until AHQ-201) — so those two, plus the
      177 built-in `list`, are the live minefield for npm users today. After AHQ-201 all seven become live.
      178
      179 ### 5.2 ⚠️  Claude Code silently de-duplicates same-named plugins — **first `--plugin-dir` wins**
      180
      181 This is the most consequential finding, and it constrains the fix. Empirically probed on 2026-08-16
      182 with two directories both containing a plugin manifest named `dupe-probe-plugin`, each exposing a
      183 skill `probe-skill` with a distinguishable description:
      184
      185 ```bash
      186 claude --plugin-dir=…/a/dupe-probe-plugin --plugin-dir=…/b/dupe-probe-plugin --print …
      187 #  → "one probe-skill entry: dupe-probe-plugin:probe-skill — 'Probe skill copy a'"
      188
      189 claude --plugin-dir=…/b/dupe-probe-plugin --plugin-dir=…/a/dupe-probe-plugin --print …
      190 #  → "one probe-skill entry: dupe-probe-plugin:probe-skill — 'Probe skill copy b'"
      191 ```
      192
      193 So Claude Code accepts the duplicate without error, exposes exactly **one** copy, and the **first
      194 flag wins**. And `ClaudeCommandBuilder.getClaudeCliPluginDirArgs()`
      195 (`src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts:118-131`) adds the **AHQ
      196 package's** plugin dirs first, the user's second.
      197
      198 **Consequence:** the collision has two sub-cases which behave differently below the CLI layer.
      199
      200 - **Different plugin names** (e.g. `my-local-plugin:add-feature` vs
      201   `agentic-hq-demos-plugin:add-feature`). The two workflows produce *different*
      202   `/pluginId:skillId` commands, so whichever one the CLI registers is genuinely the one that runs.
      203   A "local wins" policy is honest here.
      204 - **Same plugin name** — which is exactly the reported repo-clone case, where both roots contain
      205   `agentic-hq-demos-plugin`. Both workflows produce the *identical* command
      206   `/agentic-hq-demos-plugin:add-feature`, and Claude resolves it to the **AHQ package's** copy
      207   because that `--plugin-dir` came first. A "local wins" policy implemented only in the Commander
      208   registry would therefore **announce local and silently run the package's copy**.
      209
      210 Any precedence policy must therefore be applied in **both** places — the workflow registry *and* the
      211 `--plugin-dir` ordering — or it is a lie. This is a genuine second defect hiding behind the first,
      212 and it is invisible today only because the crash happens first.
      213
      214 ### 5.3 Discovery is cwd-only, never ancestor-walking
      215
      216 `CurrentUserWorkspaceImpl.createDelegate()` uses `process.cwd()` and nothing else. Verified: running
      217 the prebuilt wrapper from `<repo>/src` lists normally, because `src/` has no `.agentic-hq/plugins/`.
      218 Only a directory that *itself* contains `.agentic-hq/plugins/` participates. This bounds the blast
      219 radius and means no fix needs to consider parent directories.
      220
      221 ### 5.4 The listing has the same problem, one layer up
      222
      223 `ListingFormatter` renders the AHQ package block and the local workspace block independently
      224 (`listing-formatter.ts:55-95`). With registration fixed but the formatter untouched, `agentic-hq
      225 list` would print two identical-looking `agentic-hq add-feature` entries with no hint that only one
      226 of them is reachable. The listing is where a user goes to understand the situation, so it has to
      227 show the outcome, not just the inventory.
      228
      229 ### 5.5 Path normalisation — one of the two flagged cases is real
      230
      231 `WorkspaceImpl.isAhqPackage()` (`workspace-impl.ts:76-78`) is raw string equality. Both flagged
      232 cases were tested:
      233
      234 - **Symlinked invocation — not a defect.** Running via a symlink to the repo root
      235   (`cd temp/AHQ-205/repo-symlink && node bin/agentic-hq.cjs list`) works correctly. Both
      236   `process.cwd()` and CJS `__dirname` resolve to physical paths on this platform, so the two sides
      237   of the comparison agree. No normalisation needed for this.
      238 - **Trailing slash — a real miss.** Passing the option by hand with a trailing separator
      239   (`--ahq-package-root=/Users/…/agentic-hq/`) makes `isAhqPackage()` return `false` while standing
      240   in the package root, so the package's own plugins register twice and the CLI crashes
      241   (`cannot add command 'create-workflow' …`). Both shipped bin wrappers build the value with
      242   `path.join(__dirname, '..')`, which never yields a trailing slash — so this is **not** reachable
      243   through normal use, only through a hand-written invocation or a future third entry point.
      244
      245 Verdict for the explicit decision the brief asked for: normalise, but treat it as **defence in
      246 depth, not the fix**. Normalising the comparison (e.g. `path.resolve` on both sides) is a two-line
      247 change that removes a whole class of "silently miss" bugs, and once the name-collision policy exists
      248 a missed guard degrades into "duplicate name handled by policy" instead of a crash.
      249
      250 ### 5.6 The crash is at construction, so nothing can catch it usefully
      251
      252 `app.run()` (`src/cli/app.ts:25-28`) builds the program and parses in one expression. The throw
      253 happens inside `createProgram`, so Commander never sees argv — which is why even `--help` dies. Any
      254 fix must prevent the duplicate registration rather than handle a failure after it.
      255
      256 ### 5.7 AHQ-200's `ahq-package-root` rename — static verification done
      257
      258 Verified in the working tree today: the add-feature CLI broadcasts the new name
      259 (`.../skills/add-feature/ts-workflow/src/add-feature-cli.ts:55` →
      260 `` `…ahq-package-root=${runtime.getAhqPackageRoot().getPath()}` ``), the SKILL.md relays it
      261 (`SKILL.md:12,22`), and **all four** command parsers (`commands/add-feature/01-researcher.md`,
      262 `02-planner.md`, `03-implementer.md`, `04-reviewer.md`) read `ahq-package-root` — with no
      263 `agentic-hq-workspace-root-dir` remaining in any of them. The remaining half of the AHQ-200 check is
      264 purely runtime: confirm Command 01's actual `command-input.json` carries `ahq-package-root=…`.
      265
      266 ---
      267
      268 ## 6. The Design Decision (needs the human)
      269
      270 The Jira lists three candidates. Here is each one assessed against everything found above.
      271
      272 | Option | What it does | Assessment |
      273 | --- | --- | --- |
      274 | **A. Local overrides package** | The local workspace's workflow wins; the package's copy is shadowed, with a notice. | Matches the mental model ("my project's stuff wins in my project") an
          d matches how Claude Code's own plugin loading behaves. **But** per §5.2 it is only honest if `--plugin-dir` ordering is flipped to match; otherwise it announces local and runs the package's
           copy. Says nothing about §3.3 or §3.4. |
      275 | **B. Qualified registration** | Both stay runnable under collide-free names (e.g. `my-local-plugin:add-feature`). | Nothing is lost and nothing is ambiguous, but it needs a naming scheme,
          changes the listing, and — because Claude itself collapses same-named plugins (§5.2) — the *qualified* form still cannot reach the shadowed copy when the plugin names also match. Solves less
           than it appears to. |
      276 | **C. Graceful, actionable error** | Name the colliding workflow and both source workspaces, then exit cleanly. | Minimum bar and strictly better than a stack trace, but the CLI stays **unu
          sable** from that directory — `list`, which is exactly what the user needs, still does not run. |
      277
      278 **Recommendation: A, hardened — a deterministic precedence policy applied consistently at every
      279 layer, plus a visible notice, and never a crash.** Concretely:
      280
      281 1. **One name, one winner, chosen by an explicit precedence rule.** Local workspace beats AHQ
      282    package. Within a single workspace, first-discovered wins (plugin directory order). The built-in
      283    `list` always beats any workflow — it is the user's only way to see what happened.
      284 2. **The winner is the same everywhere.** The `--plugin-dir` flag order (§5.2) is derived from the
      285    same policy, so the workflow the CLI advertises is the workflow Claude actually runs.
      286 3. **Shadowing is announced, never silent.** A short notice on **stderr** at startup (stderr so it
      287    cannot corrupt `list`'s stdout output or any piped use), plus a marker on the shadowed entry in
      288    `agentic-hq list` so the listing explains itself.
      289 4. **Startup never throws for this.** A name collision is ordinary user input, not a catastrophic
      290    failure, so it must not use the uncaught-throw convention.
      291
      292 This is strictly a superset of option C's value (the user gets a clear, actionable message naming
      293 both sources) while keeping the CLI usable, and it covers all four reproduced variants rather than
      294 only the reported one.
      295
      296 **Questions for the human before implementation starts** — see §10.
      297
      298 ---
      299
      300 ## 7. Plan Of Action
      301
      302 TDD throughout: **RED → GREEN → REFACTOR → VERIFY**, one cycle per numbered step. No test is edited
      303 between its first (failing) run and its post-implementation run.
      304
      305 ### Step 0 — Confirm the policy (blocking)
      306
      307 Get §10 answered. Everything below assumes the recommended policy in §6; a different answer changes
      308 Steps 2–5 but not Steps 1, 6, or 7.
      309
      310 ### Step 1 — Failing test that reproduces the reported crash
      311
      312 A unit test over `createProgram` (or `WorkflowSearchResultsImpl`) with two stub workspaces both
      313 offering `add-feature`. Asserts the program is constructed **and** exposes exactly one `add-feature`
      314 subcommand. Currently throws `cannot add command 'add-feature'…` — a valid RED.
      315 Home: `tests/unit/cli/agentic-hq-program.unit.test.ts` (extend) — the existing stub-based
      316 `createStubSearchResults` helper there is already the right shape.
      317
      318 ### Step 2 — Collision-aware registration (the core fix)
      319
      320 Give the registry the knowledge that names are unique. Candidate shape (Planner's call): a
      321 `WorkflowRegistry` decorator or a value object owning the taken-name set, so `WorkflowRegistryImpl`
      322 keeps its single responsibility ("turn a workflow into a Commander subcommand") and the *policy*
      323 lives in one named place. Seed the taken-name set with the reserved `list` (§3.4) so the built-in
      324 always wins. Registration order already gives local-last, so achieving *local wins* means either
      325 reversing the two calls in `workflow-search-results-impl.ts:44-47` or making the policy explicit
      326 about precedence rather than relying on call order — prefer the explicit version.
      327
      328 Covers §3.2, §3.3 and §3.4 with one mechanism.
      329
      330 ### Step 3 — Make the winner real at the Claude layer (§5.2)
      331
      332 Failing test first: assert the `--plugin-dir` flags emitted by `ClaudeCommandBuilder` put the
      333 winning workspace's plugin dir ahead of the losing one for a colliding plugin name. Then implement.
      334 Without this step the fix is cosmetic for the flagship repo-clone case.
      335
      336 ### Step 4 — Announce the shadowing
      337
      338 Notice on stderr naming the workflow, the winner's root and the shadowed one's root. Test asserts
      339 the message names both roots (not its exact wording).
      340
      341 ### Step 5 — Listing shows the outcome (§5.4)
      342
      343 Mark the shadowed entry in `agentic-hq list` so the listing explains itself. Test in
      344 `tests/unit/cli/listing/listing-formatter.unit.test.ts`. Per the repo's convention on test intent,
      345 assert the behavioural property (the shadowed entry is distinguishable and names its state), not the
      346 literal glyph.
      347
      348 ### Step 6 — Path normalisation decision, implemented (§5.5)
      349
      350 Normalise both sides of `WorkspaceImpl.isAhqPackage()`. Failing test first: a workspace whose
      351 `rootDir` matches the package root except for a trailing separator must report `isAhqPackage() ===
      352 true`. Record in the code comment that the symlink case was tested and needs nothing, so a future
      353 reader does not re-investigate it.
      354
      355 ### Step 7 — Regression proof at the real level
      356
      357 An integration/e2e test that runs the CLI from a fixture workspace containing a colliding workflow
      358 and asserts a clean exit with a usable listing. `tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts`
      359 is the closest template. **Note the known suite-contention issue** flagged in the AHQ-195 brief
      360 (`publish-guards` + `build-determinism` both stage into `release/`) — do not add a third test that
      361 races on `release/`.
      362
      363 ### Step 8 — Verify AHQ-200's AC 5 at runtime (carried instruction)
      364
      365 During this ticket's own add-feature run, open Command 01's `command-input.json` and confirm it
      366 reads `ahq-package-root=…`. Record the result in the implementation summary. If AHQ-205 is not run
      367 through add-feature, carry the check forward to whichever ticket is.
      368
      369 ### Step 9 — Validate and document
      370
      371 `pnpm validate` (typecheck + lint + format + unit) plus the relevant integration/e2e tests. Add the
      372 collision policy to `docs/dev/how-agentic-hq-works.md` — no doc currently mentions collisions at all
      373 (verified by grep across `docs/dev`, `docs/user-docs` and `src`), so this is new content, not an
      374 edit.
      375
      376 ---
      377
      378 ## 8. Test Plan Summary
      379
      380 | # | Level | What it pins down | Variant covered |
      381 | --- | --- | --- | --- |
      382 | 1 | unit | Two workspaces, same `shortId` → program builds, one subcommand | §3.1 / §3.2 |
      383 | 2 | unit | Two plugins, one workspace, same `shortId` → no throw | §3.3 |
      384 | 3 | unit | Workflow named `list` → built-in `list` survives and wins | §3.4 |
      385 | 4 | unit | Precedence: the local workflow is the one wired to the command | §6 rule 1 |
      386 | 5 | unit | `--plugin-dir` order matches the precedence decision | §5.2 |
      387 | 6 | unit | Shadowing notice names both roots | §6 rule 3 |
      388 | 7 | unit | Listing marks the shadowed entry | §5.4 |
      389 | 8 | unit | `isAhqPackage()` ignores a trailing separator | §5.5 |
      390 | 9 | e2e | CLI runs cleanly from a colliding workspace, exit 0 | whole bug |
      391
      392 ---
      393
      394 ## 9. Out Of Scope
      395
      396 - **Publishing.** AHQ-201 owns the next `(re)publish`; this fix rides along with it.
      397 - **Migrating the five unmigrated workflows.** AHQ-201.
      398 - **Splitting the `Workspace` interface.** Already filed as
      399   [AHQ-206](https://agentic-hq.atlassian.net/browse/AHQ-206) — resist the pull to do it here, even
      400   though `WorkspaceImpl`'s third constructor parameter exists solely for `isAhqPackage()`, which
      401   Step 6 touches.
      402 - **The two "Needs a Jira" items** from the AHQ-195 brief (integration-suite contention on
      403   `release/`; CI running unit tests only). Step 7 must avoid making the first one worse, but neither
      404   is fixed here.
      405
      406 ---
      407
      408 ## 10. Open Questions For The Human
      409
      410 1. **Precedence direction — confirm "local overrides package"?** The alternative (package wins) is
      411    defensible for shipped flagship workflows, but it means a user cannot override `add-feature` in
      412    their own project, which seems worse.
      413 2. **Intra-workspace collisions (§3.3) — first-wins with a notice, or a hard clean error?**
      414    First-wins keeps the CLI usable; a clean error is louder about what is genuinely an authoring
      415    mistake. Recommendation: first-wins + notice, because a workflow authored in *someone else's*
      416    plugin can cause it.
      417 3. **Confirm the `--plugin-dir` reordering (§5.2, Step 3) is in scope here.** It is a second defect
      418    found during this research, not part of the filed bug — but leaving it out makes the headline fix
      419    untruthful in exactly the reported scenario. Recommendation: in scope, same ticket.
      420 4. **Confirm this ticket does not publish** — the fix reaches npm via AHQ-201's re-publish.
      421
      422 ---
      423
      424 ## Appendix — Reproduction Fixtures
      425
      426 Left in place under `temp/AHQ-205/` (gitignored) for the implementation stages:
      427
      428 | Path | Purpose |
      429 | --- | --- |
      430 | `repro-workspace/` | Local workspace with a colliding `add-feature` (§3.2) |
      431 | `variant-b/` | Two plugins, one workspace, both `shortId: dup` (§3.3) |
      432 | `variant-c/` | Workflow with `shortId: list` (§3.4) |
      433 | `variant-d/` | Workflow with `shortId: help` — the negative control, does **not** collide |
      434 | `repo-symlink` | Symlink to the repo root — the symlink case that proved clean (§5.5) |
      435 | `dupe-plugins/a`, `dupe-plugins/b` | Same-named plugin copies for the Claude `--plugin-dir` probe (§5.2) |

⏺ Bash(cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm exec prettier --check docs/tickets/AHQ-205/workflow-files/01-research-and-plan-of-action.md 2>&1 | tail -5)
  ⎿  Checking formatting...
     All matched files use Prettier code style!
  ⎿  Allowed by auto mode classifier

⏺ Done. Written to docs/tickets/AHQ-205/workflow-files/01-research-and-plan-of-action.md.

  What I found

  Bug reproduced — four ways, all confirmed on this machine today:

  1. The real scenario: node release/bin/agentic-hq-prebuilt.cjs list from the repo clone root produces the line-for-line stack trace from the Jira (prebuilt package root ≠ cwd, both define add-feature).
  2. Minimal synthetic: a local workspace with any plugin defining shortId: "add-feature" crashes the dev CLI too. Plugin names don't need to match — so this isn't a "don't clone the repo" problem, it hits
  any user whose project defines add-feature or math.
  3. Not in the Jira: two plugins in the same workspace with the same shortId crash identically — the isAhqPackage() dedup guard is irrelevant there.
  4. Not in the Jira: a workflow named list collides with the built-in list subcommand. (help is clear — tested, Commander's implicit help isn't a registered command.)

  The finding that changes the fix design: I probed Claude Code directly with two --plugin-dir flags pointing at same-named plugin copies. It silently de-duplicates and the first flag wins — and
  ClaudeCommandBuilder puts the AHQ package's dirs first. So in the exact reported case (both roots have agentic-hq-demos-plugin), a "local overrides package" fix at the Commander layer alone would announce 
  local and run the package's copy. The --plugin-dir ordering has to follow the same policy or the headline fix is untruthful.

  On the path-normalisation decision the brief deferred here: symlinked invocation is clean (both process.cwd() and __dirname resolve physically — tested); a trailing slash on --ahq-package-root genuinely
  breaks the guard, but isn't reachable through the shipped bin wrappers. Verdict: normalise as defence in depth, not as the fix.

  Recommendation in the doc

  Option A hardened — one deterministic precedence rule applied at both layers, shadowing announced on stderr and marked in list, and startup never throwing for what is ordinary user input. Plan is 9 TDD
  steps; §10 has four questions for you before implementation starts, the substantive one being whether the --plugin-dir reordering belongs in this ticket (I think yes).

  Reproduction fixtures are left under temp/AHQ-205/ (gitignored) for the implementation stages.

✻ Churned for 7m 48s

※ recap: Goal: fix the AHQ-205 crash where colliding workflow names kill the agentic-hq CLI. I reproduced the bug four ways and wrote research plus a plan to 
  docs/tickets/AHQ-205/workflow-files/01-research-and-plan-of-action.md. Next: answer the four open questions in section 10 so implementation can start. (disable recaps in /config)

✻ Crunched for 7m 48s

※ recap: Goal: fix the AHQ-205 crash where colliding workflow names kill the agentic-hq CLI. I reproduced the bug four ways and wrote research plus a plan to
  docs/tickets/AHQ-205/workflow-files/01-research-and-plan-of-action.md. Next: answer the four open questions in section 10 so implementation can start. (disable recaps in /config)

❯ can you please give me a TLDR explanation of (1) the problem (2) the fix (NOTE: I have an idea already of how the plugin shortIds are discovered, but please remind me how it works - in a way that is       

※ recap: Goal: fix the AHQ-205 crash where colliding workflow names kill the agentic-hq CLI. I reproduced the bug four ways and wrote research plus a plan to
  docs/tickets/AHQ-205/workflow-files/01-research-and-plan-of-action.md. Next: answer the four open questions in section 10 so implementation can start. (disable recaps in /config)

❯ can you please give me a TLDR explanation of (1) the problem (2) the fix (NOTE: I have an idea already of how the plugin shortIds are discovered, but please remind me how it works - in a way that is       
  relevant to this bug)                                                                                                                                                                                        
※ recap: Goal: fix the AHQ-205 crash where colliding workflow names kill the agentic-hq CLI. I reproduced the bug four ways and wrote research plus a plan to
  docs/tickets/AHQ-205/workflow-files/01-research-and-plan-of-action.md. Next: answer the four open questions in section 10 so implementation can start. (disable recaps in /config)

❯ can you please give me a TLDR explanation of (1) the problem (2) the fix (NOTE: I have an idea already of how the plugin shortIds are discovered, but please remind me how it works - in a way that is       
  relevant to this bug)                                                                                                                                                                                        

⏺ How shortIds get discovered (the bit that matters here)

  The CLI scans two roots on every startup: the AHQ package root (--ahq-package-root, the installed package or the repo checkout) and process.cwd(). In each, it globs
  .agentic-hq/plugins/*/skills/*/ahq-workflow.json and reads each file's shortId field. That shortId string is handed straight to Commander as a subcommand name:

  .agentic-hq/plugins/<plugin>/skills/<skill>/ahq-workflow.json
     { "pluginId": …, "skillId": …, "shortId": "add-feature", … }
                                                ↓
                            program.command("add-feature")

  Two things about that are the whole bug:

  - shortId is the only key. Not pluginId:skillId — just the bare short name. Two workflows in totally different plugins collide if their shortId strings match.
  - Both roots pour into one flat Commander namespace, package first then cwd, with no name check. There's a guard, but it only asks "is cwd the same directory as the package root?" — a same-directory guard,
  not a same-name guard.

  (1) The problem

  Once the CLI is npm-installed, the package root and cwd are almost always different directories, so that guard never fires. Stand in any directory that defines a workflow named add-feature or math (the
  repo clone being the obvious one) and both copies get registered → Commander throws cannot add command 'add-feature' during program construction, before argv is even parsed. So list, --help, everything
  dies. Exit 1, no workaround but cd.

  It's worse than filed in two ways I reproduced: it also fires from two plugins inside one workspace (nothing to do with the two-root guard), and a workflow named list kills the built-in list — the one
  command a stuck user would reach for.

  (2) The fix

  One name → one winner, decided by an explicit rule, and never a crash. A name collision is ordinary user input, not a catastrophic failure, so it must not use this repo's uncaught-throw convention.

  - Registration becomes collision-aware: a taken-names set, seeded with the reserved list. Local workspace beats package; within a workspace, first-discovered wins.
  - The catch that shapes the fix: I probed Claude Code with two --plugin-dir flags naming the same plugin — it silently keeps one, and the first flag wins. ClaudeCommandBuilder lists the package's dirs
  first. So in the exact reported case (both roots have agentic-hq-demos-plugin), fixing only the Commander layer would say "local wins" and then run the package's copy. The plugin-dir ordering has to follow
  the same precedence rule, or the fix is cosmetic.
  - Shadowing gets announced on stderr and marked in agentic-hq list, so the listing explains itself.
  - Plus a two-line normalisation of the directory guard as defence in depth.

  The open question worth your call: whether that --plugin-dir reordering belongs in this ticket. It's a second defect I found, not what was filed — but leaving it out makes the headline fix untrue in the
  exact scenario that was reported.

✻ Worked for 18s

❯ I want a better analysis of the problem here (design wise) please, and what is going on, and I don't just want a proposed "fix".   I want some options on how to handle this problem (which is basically     
  duplicate shortId isn't it?).  One option I can think of is that they get flagged in the listing red as duplicated shortId name (and so can't be run, as shortId is what is used to run a workflow).  I need 
  to understand better what makes sense if I have the npm installed version *and* I'm running the list command from the AHQ workspace repo checkout root - what do you think I should see listed (listing      
  both sets doesn't seem quite right? - Maybe as you say the current workspace listings should "win" if the shortId duplicates one in npm?...)                                                                 
  
⏺ What's actually going on (the design fault)

  shortId is a convenience alias that has been given the job of a primary key.

  Every workflow has a real identity — pluginId:skillId — and that's what actually gets executed (/agentic-hq-demos-plugin:add-feature). shortId exists purely so you can type agentic-hq add-feature instead
  of the long form. But it's declared locally (in each workflow's own ahq-workflow.json, by whoever authored that plugin) and consumed globally (one flat Commander namespace shared by everything discovered
  from both roots). Nobody writing a shortId can know what else will be in scope at run time, because what's in scope depends on where the user happens to be standing.

  That mismatch — decentralized declaration, centralized consumption — is the whole bug. Commander just happens to be the component that notices, loudly, at construction time.

  The second structural point, and I think the one you're circling: the two roots were never peers. The AHQ package is a read-only shipped artifact (the vendor's workflows, un-editable by design since
  AHQ-195). The current workspace is the user's own, authored and editable by them. The code treats them as two equivalent sources pouring into one namespace, and the only guard — isAhqPackage() — asks "are 
  these the same directory?", which under an npm install is essentially never true.

  The reported bug is actually the least interesting case
  
  Splitting by what kind of duplicate it is changes the picture a lot:

  Case 1 — same pluginId:skillId in both roots. Your scenario: npm-installed CLI, standing in the repo checkout. This isn't a name conflict at all. It's one logical workflow found via two paths. Nobody is
  trying to override anything; you're just standing in the source tree of the thing you installed. The right primitive here is dedup by identity, not conflict resolution.

  Case 2 — different pluginId:skillId, same shortId. Your project defines add-feature in my-plugin. Two genuinely different workflows want one name. This is where the policy question actually lives.

  Case 3 — same shortId twice inside one root. Two plugins in one workspace. Genuine conflict with no precedence available — both are equally local.

  Case 4 — shortId is list. Collides with the CLI's own namespace. Non-negotiable: the built-in wins, because list is the diagnostic you'd reach for.

  So the thing that was filed (Case 1) should arguably just work silently, and the interesting design decision is one you haven't hit yet.

  The options for Case 2/3

  Option A — local wins, shadowing announced. Follows every convention going (node_modules, PATH, git config local>global, venv>site-packages): more specific scope wins. Deliberate override becomes possible,
  which is a feature. Cost: a user who didn't realise add-feature was taken silently gets their own half-built thing when they expected the flagship workflow.

  Option B — package wins. Protects the shipped workflows. But the user is standing in their own project, looking at their own workflow file, and the CLI ignores it — I think that's the more bewildering
  failure of the two. Note the remedy is identical under A and B: rename your local one. The only difference is what happens before you notice.

  Option C — neither runs; both flagged in the listing (your instinct). No guessing, no resolution-order doc to write, and the remedy is stated at the point of confusion. It's also the only option that's
  always honest — see below on --plugin-dir.

  Option D — qualified escape hatch. Shadowed workflow stays reachable as my-plugin:add-feature. Works fine in Case 2, but not in Case 1: I verified Claude Code silently collapses two --plugin-dir flags
  naming the same plugin and keeps the first, so when plugin names also match there is no way to address the other copy at all. Partial option, not a whole answer.

  Option E — retire the flat namespace. Invocation by something unique by construction. That's the real long-term fix and it's AHQ-203/206 territory, not this ticket.

  The argument that decides it for me: C is the reversible choice. Going from "refuses to guess" → "local wins" later is backwards-compatible. Going the other way breaks people who came to rely on the
  shadowing. At v0.1, take the option you can relax.
  
  Your actual question: npm-installed CLI, list from the repo checkout root

  Concretely, today that's all Case 1 — but only partially, which is worth knowing: the published package ships only add-feature and math (the other five are in EXCLUDED_UNMIGRATED_SKILLS until AHQ-201). So
  create-workflow, reversal, quick-jira, full-jira and add-feature-detailed-example exist only in your checkout and conflict with nothing.

  I don't think you should see both sets. You should see one entry per workflow, with the duplication stated as a fact about your situation, not as seven individual conflicts:

  Available workflows

    Agentic HQ Package:  /usr/local/lib/node_modules/agentic-hq
    Local Workspace:     /Users/steve/dev/agentic-hq/agentic-hq
  
    ⚠  Your Local Workspace contains the same plugins as the installed
       package. Where they overlap, the local copies are being used.

      Plugin: agentic-hq-demos-plugin
  
        agentic-hq add-feature -- --ticket-id=PROJ-123        [local copy]
          Add a small feature using a simple four-stage ...
        agentic-hq math -- --input-number=11                  [local copy]
          Passes a number through three chained math steps
        agentic-hq reversal -- --string-to-reverse='hello'    [local only]
          Reverses a string (hello world demo)

  Whereas a Case 2 conflict — genuinely different workflows fighting for one name — earns the red treatment you described, and sits apart from the normal listing so it reads as "this needs your attention"
  rather than "here's an option":

    ⛔ Unavailable — duplicate short name

        add-feature   defined twice, so it cannot be run:
                        my-plugin:add-feature          (Local Workspace)
                        agentic-hq-demos-plugin:add-feature  (AHQ Package)
                      Rename one of them to use it.

  The deeper point behind both sketches: the listing today answers "what is on disk". That's the wrong question, and it's why the duplicate looks so wrong when you see it. A CLI listing should answer "what 
  happens when I type agentic-hq X". Get that right and the duplicate stops being confusing regardless of which policy you pick.

  Where I land

  Dedup Case 1 by identity (local copy wins, stated once at the top — not an error). Refuse to guess on Cases 2 and 3, flagged red exactly as you suggested. Built-in wins Case 4. And whichever way you go,
  the winner has to be made real at the --plugin-dir layer too — otherwise the listing says "local copy" and Claude runs the package's.

  Want me to rewrite §6 of the plan doc around this decomposition? It currently frames it as the Jira's three candidates and recommends local-wins, which I now think is the wrong shape — it misses that Case
  1 is a dedup rather than a conflict.

✻ Worked for 1m 46s
  
❯ No one is using this product at the moment (no-one has cloned/installed it), so we can do what we want.  This is not a biggy and doesn't need to be fixed properly - just whatever is quickest and easiest   
  and makes the bug go away completely.  I'm thinking that the simplest and most obvious is that your local working directory takes precedence and the Package directory (where the agentic-hq is being run    
  from) Comes second.  We keep the listing exactly as it is now, and all we do with duplicates that are duplicates of existing short IDs is show them exactly as we show them now but We put a big disabled    
  flag in front of them e.g. "DISABLED AS shortId = <shortId> IS DUPLICATE OF EXISTING shortId" and make the colour red and bold text.  Does that make sense?                                                  
  
⏺ Yes, and it's simpler than what I proposed — because it collapses to one rule rather than a policy per case:
  
  flag in front of them e.g. "DISABLED AS shortId = <shortId> IS DUPLICATE OF EXISTING shortId" and make the colour red and bold text.  Does that make sense?                                                  

⏺ Yes, and it's simpler than what I proposed — because it collapses to one rule rather than a policy per case:

  ▎ Walk local workspace first, then package. First workflow to claim a shortId gets registered. Anything that asks for a name already claimed is not registered at all, and is shown in the listing with the
  ▎ red DISABLED flag.

  That single rule disposes of all four collision cases for free:

  - local vs package → local walks first, so local wins, package's copy shows DISABLED. Your intent, directly.
  - two plugins in one workspace → first in directory order wins, second shows DISABLED. No precedence rule needed.
  - workflow named list → seed the claimed-names set with list before the walk (one line), so the built-in wins and the workflow shows DISABLED.
  - repo checkout + npm install → the reported bug, handled by the first bullet.

  No namespacing, no identity dedup, no resolution-order docs. That's the cheapest correct thing.

  Two things that need your call

  1. The --plugin-dir order must flip too, or "local wins" is fake. This is the finding from earlier: Claude Code silently collapses two --plugin-dir flags naming the same plugin and keeps the first, and
  ClaudeCommandBuilder currently lists the package's dirs first. So in your exact scenario (agentic-hq-demos-plugin exists in both), the CLI would register the local workflow — whose command string is
  /agentic-hq-demos-plugin:add-feature — and Claude would run the package's copy anyway. The crash is gone, but you'd have a quieter wrong-workflow bug in its place.

  The fix is reversing two lines in getClaudeCliPluginDirArgs() (push the user's plugin dirs before the package's). It only matters when the plugin names also match — if plugin names differ, both load and
  the commands are distinct, so it resolves correctly regardless. Cheap enough that I'd just include it.

  2. Reading order is slightly backwards, and the word "EXISTING" carries it. The listing keeps AHQ Package first, Local Workspace second — so you'll read the disabled entry before you reach the winner.
  That's fine, but "IS DUPLICATE OF EXISTING shortId" then points at something the reader hasn't seen yet. Naming where the winner lives fixes it at zero cost:

      Plugin: agentic-hq-demos-plugin

        DISABLED — shortId 'add-feature' is already used by Local Workspace
        agentic-hq add-feature -- --ticket-id=PROJ-123
          Add a small feature using a simple four-stage ...

  Your wording works too — it's your product voice. Just flagging that the shorter form tells the user which one did run, which is the thing they actually want to know.

  The one bit of real design

  The formatter currently knows nothing about registration — it renders straight from the Workspace/Plugin/Workflow objects. So the "who won" decision has to be computed once and consulted by both the
  registry walk and the listing, or the two will drift and you'll get a workflow that runs but displays as DISABLED (or vice versa).

  WorkflowSearchResultsImpl already owns both operations and both workspaces, so it's the natural home — no new plumbing, and the red-bold helper drops into the existing src/cli/listing/colors.ts alongside
  the others.

  Rough size: one small collision-tracking object, a flipped walk order, two reversed lines in the command builder, one colour helper, one formatter branch. Plus tests for the four cases.

  Want me to rewrite §6 and §7 of the plan doc around this decision, and drop the option analysis down to a short "considered and rejected" note?

✻ Baked for 52s

❯ "DISABLED — shortId 'add-feature' is already used by existing workflow" - then you don't have to say **what** is blocking it.  If we are accumulating shortId registrations into something that uses the     
  shortId as a unique key, and just rejecting ones where that key already exists (and then making sure that workflow is disabled) - isn't that the simplest thing?  If so, how would this be implemented in    
  the simplest, easiest way with the least change/work?                                                                                                                                                        
  
⏺ Yes — and dropping "what's blocking it" from the message is exactly what makes it cheap. The formatter then only needs a set of losers; nothing has to track who won or where it lives. That removes the only
  fiddly part.

  The trick: decorate the registry, don't touch the walk

  The walk (WorkflowSearchResults → Workspace → Plugin → registry.register(workflow)) already funnels every workflow through a single method on a single interface. So put the unique-key logic in a decorator
  that implements the same interface, and nothing upstream changes:

  // src/workflow-discovery/workflow-listing/claiming-registry.ts   (new, ~25 lines)
  const RESERVED_SHORT_NAMES = ['list'];   // the CLI's own subcommand

  export class ClaimingRegistry implements WorkflowRegistry {
    private readonly claimed = new Set<string>(RESERVED_SHORT_NAMES);
    private readonly rejected = new Set<string>();

    constructor(private readonly delegate: WorkflowRegistry) {}
  
    register(workflow: AhqWorkflow): void {
      const shortName = workflow.getShortName().toString();
      if (this.claimed.has(shortName)) {
        this.rejected.add(workflow.getFullClaudeSkillCommand().toString());
        return;
      }
      this.claimed.add(shortName);
      this.delegate.register(workflow);
    }

    getRejected(): Set<string> { return new Set(this.rejected); }
  }

  WorkspaceImpl, PluginImpl, AhqPackageImpl, CurrentUserWorkspaceImpl and WorkflowRegistryImpl are all untouched.

  Wiring it — one walk, two uses

  In workflow-search-results-impl.ts (currently lines 44-47), swap the order so local goes first and route both paths through one private method:

  registerWorkflowsWith(registry: WorkflowRegistry): void {
    this.claimShortNames(registry);
  }

  getWorkflowsListingString(): string {
    return this.formatter.formatWorkflowsListing(
      this.ahqPackage,
      this.currentUserWorkspace,
      this.claimShortNames(NULL_REGISTRY).getRejected()
    );
  }

  // Local workspace claims first — its workflows win any shortId contest.                                                                                                                      
  private claimShortNames(registry: WorkflowRegistry): ClaimingRegistry {
    const claiming = new ClaimingRegistry(registry);
    this.currentUserWorkspace.registerWorkflowsWith(claiming);
    this.ahqPackage.registerWorkflowsWith(claiming);
    return claiming;
  }

  The listing re-runs the same walk against a no-op registry to recover the loser set. That costs one extra filesystem discovery pass on list only — irrelevant, and getPlugins()/getWorkflows() already
  re-discover on every call by design. The payoff is that the precedence order exists in exactly one place, so registration and listing can't drift.

  Why key the rejected set on getFullClaudeSkillCommand() (/pluginId:skillId) rather than object identity: those objects are rebuilt fresh on every getter call, so references aren't stable between the two
  walks. The full command string is stable and unique.

  The listing half
  
  ListingFormatter.workflowEntry() (line 139) gains one branch:

  private workflowEntry(workflow: AhqWorkflow, disabled: Set<string>): string {
    const prefix = disabled.has(workflow.getFullClaudeSkillCommand().toString())
      ? DISABLED_INDENT + formatDisabledFlag(
          `DISABLED — shortId '${workflow.getShortName()}' is already used by existing workflow`
        ) + LINE_BREAK
      : '';
    return prefix + this.workflowCommandLine(workflow) + LINE_BREAK + this.workflowDescriptionLine(workflow);
  }
  
  plus a red-bold formatDisabledFlag alongside the existing helpers in colors.ts. The disabled set threads down through workspaceBlock → allPluginBlocksIn → pluginBlock — mechanical, no logic.

  Total change

  ┌──────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────────┐
  │                       File                       │                                    Change                                    │
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ workflow-listing/claiming-registry.ts            │ new, ~25 lines                                                               │
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ workflow-listing/workflow-search-results-impl.ts │ ~8 lines — swap order, add private method                                    │
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ cli/listing/listing-formatter.ts                 │ ~6 lines + thread the set through 3 signatures                               │
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ cli/listing/colors.ts                            │ 1 helper                                                                     │
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┤
  │ claude-code/claude-command-builder.ts            │ swap 2 statements (lines 126-129) so the user's plugin dirs are pushed first │
  └──────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────────┘
  
  Nothing else — no interface changes, no new plumbing, no changes to the discovery classes.

  That last row is the only item that isn't strictly about making the crash go away: without it, local wins in the CLI but Claude still resolves /agentic-hq-demos-plugin:add-feature to the package's copy in
  the repo-checkout case. Two lines, so I'd take it.

  Tests
  
  Per the repo's one-test-file-per-class rule, tests/unit/workflow-discovery/workflow-listing/claiming-registry.unit.test.ts carries most of the weight — it's a pure unit with a stub delegate, so all four
  cases (local-beats-package, two-plugins-one-workspace, reserved list, no-collision passthrough) test there with no filesystem. Then one formatter test that a rejected workflow renders the flag, and one e2e
  that the CLI exits cleanly from a colliding workspace.

  Want me to rewrite §6/§7 of the plan doc to this, or go straight to implementing it TDD-style?

✻ Churned for 1m 24s

❯ is this ClaimingRegistry new?  What class does this work already (or none)?                                                                                                                                  

⏺ Yes, it's new — I checked the registration chain and there's no existing class doing shortId accumulation.
  
  But the job already has an owner: Commander itself. program.commands is a keyed table that already rejects duplicates — by throwing, which is the bug. So for the crash-only half, you need no new class at 
  all, just a guard in the existing WorkflowRegistryImpl.register():

  register(workflow: AhqWorkflow): void {
    const shortName = workflow.getShortName().toString();
    if (this.program.commands.some((c) => c.name() === shortName)) {
      return;                                    // already claimed — first wins
    }
    ...existing body unchanged...
  }
  
  Two things make that cheaper than it looks:

  - program.commands is public API and already used in this repo — workflow-registry-impl.unit.test.ts:42 does program.commands.find(cmd => cmd.name() === 'reversal').
  - The reserved list seeding is free. createProgram registers list at line 41 and only registers workflows at line 48, so list is already sitting in program.commands when the guard runs. No constant, no
  seed list.

  So: crash gone, all four collision cases handled, one new if, plus the order swap in WorkflowSearchResultsImpl so local claims first.

  Why I reached for a new class anyway

  The listing needs the same answer, and Commander's table isn't reachable from there. WorkflowRegistryImpl is constructed inside createProgram and discarded; WorkflowSearchResultsImpl — the only object
  owning both the registration walk and getWorkflowsListingString() — has no reference to program.

  And you can't intercept the walk without implementing WorkflowRegistry, because that interface is the only thing WorkspaceImpl/PluginImpl speak. Filtering inside those classes instead would be more change,
  not less.

  So the honest framing of the choice:
  
  ┌─────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────┐
  │                        Scope                        │                                Cost                                 │
  ├─────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
  │ Crash gone, listing unchanged (shows both, no flag) │ Zero new classes — one if in WorkflowRegistryImpl + the order swap  │
  ├─────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
  │ Crash gone + red DISABLED flag in the listing       │ One new ~25-line class, because two call sites need the same answer │
  └─────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────┘

  The alternative to the new class is writing the "walk local-then-package, first wins" logic twice — once in the registry, once in the formatter — which is precisely the drift risk that produces a workflow
  that runs but displays DISABLED, or vice versa.

  For what it's worth, the decorator shape isn't foreign here: StubWorkflowRegistry in the test fixtures is already a second implementation of that interface.

  My read: the new class is worth it, since the DISABLED flag is the part that makes the behaviour discoverable rather than just silent. But if you'd rather ship the crash fix on its own first, the one-if
  version is genuinely complete for that — and the flag can be added later without unpicking it.

✻ Churned for 52s

❯ Isn't there a better, simpler more elegant solution - if we're already using Commander to do all the work, but it's missing one small feature/behaviour - can we wrap it and add that thing?                 

⏺ Let me test that before answering — Commander subclassing has a known hazard here.
  
⏺ Bash(cat > temp/AHQ-205/commander-probe.mjs <<'EOF'
      import { Command } from 'commander';

      class DuplicateTolerantCommand extends Command {
        skipped = [];
        command(nameAndArgs, ...rest) {
          const name = nameAndArgs.split(' ')[0];
          if (this.commands.some((c) => c.name() === name)) {
            this.skipped.push(name);
            return new Command(name);            // orphan: configured, then discarded
          }
          return super.command(nameAndArgs, ...rest);
        }
      }

      const program = new DuplicateTolerantCommand();
      program.name('agentic-hq').enablePositionalOptions();
      program.command('list').description('List available workflow skills').action(() => console.log('LIST RAN'));

      // exactly the chain WorkflowRegistryImpl.register() uses
      function register(name, desc, marker) {
        program.command(name).description(desc).passThroughOptions().allowExcessArguments(true)
          .action(() => console.log(`RAN ${marker}`));
      }

      register('add-feature', 'LOCAL copy',   'local');     // local claims first
      register('add-feature', 'PACKAGE copy', 'package');   // duplicate -> orphan
      register('dup', 'plugin one', 'one');
      register('dup', 'plugin two', 'two');                 // intra-workspace duplicate
      register('list', 'shadows built-in', 'listy');        // reserved name
      register('math', 'unique one', 'math');

      console.log('skipped        :', program.skipped);
      console.log('registered     :', program.commands.map((c) => c.name()));
      process.stdout.write('parse add-feature -> '); program.parse(['node','x','add-feature']);
      process.stdout.write('parse dup        -> '); program.parse(['node','x','dup']);
      process.stdout.write('parse list       -> '); program.parse(['node','x','list']);
      EOF
      node temp/AHQ-205/commander-probe.mjs)
  ⎿  skipped        : [ 'add-feature', 'dup', 'list' ]
     registered     : [ 'list', 'add-feature', 'dup', 'math' ]
     parse add-feature -> RAN local
     parse dup        -> RAN one
     parse list       -> LIST RAN
  ⎿  Allowed by auto mode classifier

⏺ You're right, and it's better than what I proposed. I tested it:

  skipped        : [ 'add-feature', 'dup', 'list' ]
  registered     : [ 'list', 'add-feature', 'dup', 'math' ]
  parse add-feature -> RAN local        ← local beat the package copy
  parse dup        -> RAN one           ← first plugin beat the second
  parse list       -> LIST RAN          ← built-in survived being shadowed

  All four collision cases, and WorkflowRegistryImpl needs zero changes:

  class DuplicateTolerantCommand extends Command {
    command(nameAndArgs, ...rest) {
      const name = nameAndArgs.split(' ')[0];
      if (this.commands.some((c) => c.name() === name)) {
        this.skipped.push(name);
        return new Command(name);          // orphan: configured, then discarded
      }
      return super.command(nameAndArgs, ...rest);
    }
  }

  The trick is what it returns on a duplicate: an unattached Command. The caller's whole chain — .description().passThroughOptions().allowExcessArguments(true).action(...) — runs happily against an orphan
  that's never parsed. One new Command() in createProgram and the crash is gone.

  I specifically checked the hazard that bites in this file already (the enablePositionalOptions note at agentic-hq-program.ts:35): passThroughOptions() on an orphan does not throw, because Commander only
  runs that check when there's a parent.

  My ClaimingRegistry was rebuilding a keyed name table next to the one Commander already maintains, then keeping the two in step. Wrapping Commander adds only the behaviour that's genuinely missing — "skip
  instead of throw" — and deletes the extra discovery pass and the set-threading through WorkflowSearchResultsImpl that my version needed.

  One decision left, on the DISABLED flag

  The wrapper only ever sees a name, not the workflow. So skipped: ['add-feature'] doesn't tell the formatter which of the two add-feature entries to flag.

  Two ways out:

  (a) Keep the orphan, formatter derives it. Zero change to WorkflowRegistryImpl. But the formatter renders package-block-first while precedence is local-first, so it can't just say "first one I render wins"
  — it needs its own pre-pass over the local workspace. That's the precedence rule living in two places.

  (b) Return null on a duplicate instead of an orphan. WorkflowRegistryImpl — which has the workflow object — records it:

  register(workflow: AhqWorkflow): void {
    const command = this.program.commandIfNameFree(workflow.getShortName().toString());
    if (command === null) { this.disabled.push(workflow); return; }
    command.description(...)   // ...rest unchanged
  }
  
  Exact identity (/pluginId:skillId), no duplicated rule. Costs 3 lines in WorkflowRegistryImpl.

  I'd take (b) — and the set reaches the listing with no plumbing, because createProgram already has the registry in scope inside the list action closure, which runs at parse time, after registration:

  const registry = new WorkflowRegistryImpl(program, builder);
  program.command('list').action(() => {
    console.log(searchResults.getWorkflowsListingString(registry.getDisabled()));
  });
  searchResults.registerWorkflowsWith(registry);

  Total change

  ┌───────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────┐
  │                 File                  │                                      Change                                      │
  ├───────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
  │ src/cli/duplicate-tolerant-command.ts │ new, ~12 lines                                                                   │
  ├───────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
  │ src/cli/agentic-hq-program.ts         │ new DuplicateTolerantCommand(); hoist the registry; pass disabled to the listing │
  ├───────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
  │ src/cli/workflow-registry-impl.ts     │ 3 lines — record the rejected workflow                                           │
  ├───────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
  │ src/cli/listing/listing-formatter.ts  │ red-bold flag branch + thread the set through 3 signatures                       │
  ├───────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
  │ src/cli/listing/colors.ts             │ 1 helper                                                                         │
  ├───────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
  │ workflow-search-results-impl.ts       │ swap 2 lines so local registers first                                            │
  ├───────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
  │ claude-code/claude-command-builder.ts │ swap 2 lines so the user's --plugin-dir goes first                               │
  └───────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────┘
  
  WorkspaceImpl, PluginImpl, AhqPackageImpl, CurrentUserWorkspaceImpl and every interface stay untouched — and the whole fix now lives in src/cli/, which is where a CLI-namespace problem belongs.

  Probe script is at temp/AHQ-205/commander-probe.mjs if you want to poke at it. Shall I rewrite the plan doc around this?

✻ Crunched for 2m 5s

❯ Hold on! Isn't WorkflowRegistryImpl already a wrapper for Commander ? Here's it's header comment: /**                                                                                                        
   * WorkflowRegistryImpl — Concrete WorkflowRegistry that wraps a                                                                                                                                             
   * Commander program and registers subcommands from discovered                                                                                                                                               
   * workflows.                                                                                                                                                                                                
   *                                                                                                                                                                                                           
   * SRP Does: Register a Commander subcommand for each workflow,                                                                                                                                              
   * using its short name as the command name and wiring its action                                                                                                                                            
   * to call builder.build() with the workflow's full Claude skill                                                                                                                                             
   * command.                                                                                                                                                                                                  

⏺ Correct — it is. I added a second wrapper around Commander underneath the one that already exists.

  WorkflowRegistryImpl already owns exactly this responsibility, and it already has everything the fix needs: the shortName, the program, the workflow object (for recording identity), and it's the single
  funnel every workflow passes through. So it's ~6 lines in the class that's already there — no new file:

  export class WorkflowRegistryImpl implements WorkflowRegistry {
    private readonly disabled: AhqWorkflow[] = [];

    constructor(
      private readonly program: Command,
      private readonly builder: WorkflowCommandBuilder
    ) {}

    register(workflow: AhqWorkflow): void {
      const shortName = workflow.getShortName().toString();
      if (this.program.commands.some((c) => c.name() === shortName)) {
        this.disabled.push(workflow);
        return;
      }
      // ...existing body unchanged...
    }

    getDisabled(): AhqWorkflow[] {
      return [...this.disabled];
    }
  }

  No new imports either — Command and AhqWorkflow are both already imported there. And the reserved-list case stays free, because createProgram registers list at line 41 before workflows at line 48, so it's
  already sitting in program.commands when the guard runs.

  The SRP comment needs one clause: "using its short name as the command name, skipping any whose short name is already taken".

  Two things that make this fit the codebase rather than fight it: program.commands is already used this way in the class's own unit test (workflow-registry-impl.unit.test.ts:42), and accumulating into an
  array is exactly what the existing StubWorkflowRegistry fixture does.

  Revised change list

  ┌──────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────┐                                                                    
  │                 File                 │                                     Change                                      │
  ├──────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ src/cli/workflow-registry-impl.ts    │ ~6 lines — guard, accumulator, getter                                           │
  ├──────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ src/cli/agentic-hq-program.ts        │ hoist the registry to a const, pass registry.getDisabled() into the list action │
  ├──────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ src/cli/listing/listing-formatter.ts │ red-bold flag branch + thread the set through 3 signatures                      │
  ├──────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ src/cli/listing/colors.ts            │ 1 helper                                                                        │
  ├──────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ workflow-search-results-impl.ts      │ swap 2 lines — local registers first                                            │
  ├──────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
  │ claude-command-builder.ts            │ swap 2 lines — user's --plugin-dir goes first                                   │
  └──────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────┘
  
  No new production file and no new test file — the existing tests/unit/workflow-registry-impl.unit.test.ts is the natural home for all four collision cases, and it already constructs a bare Command and
  inspects program.commands.

  Everything lives in src/cli/, bar the two 2-line swaps. Want me to rewrite §6/§7 of the plan doc to this?

✻ Sautéed for 34s

❯ I'm switching to Fable, as I think it would not have created these DuplicateTolerantCommand and ClaimingRegistry implements WorkflowRegistry classes, when there's **already** a WorkflowRegistryImpl        
  implements WorkflowRegistry class that all this could have been put in.  This is just really poor software design and analysis.  You are Opus - before I leave - please explain how/why you didn't go for    
  the obvious case of using the existing WorkflowRegistryImpl, and tried to pursuade me it was a good idea to invent lots of other classes.                                                                    
  
⏺ Fair. Here's the honest account.
  
  The specific error, and it's in writing in the plan doc. §7 Step 2 says: "a WorkflowRegistry decorator or a value object owning the taken-name set, so WorkflowRegistryImpl keeps its single responsibility 
  ('turn a workflow into a Commander subcommand')."

  I invoked SRP as a reason not to touch the class. That's a misapplication. Uniqueness of the command name isn't a second responsibility — it's part of doing the first one correctly. A registry that can't
  cope with a name already being taken isn't doing "registration"; it's doing the happy path of registration. SRP is about reasons to change, and "how workflows become subcommands" is precisely and only that
  class's reason to change. I read its header comment, quoted its SRP line back, and then used it as a fence rather than as a description of where the logic belongs.

  Why a second new class after you pushed back. You asked "can we wrap Commander and add that thing?" I answered the literal question — went looking for a Commander-shaped wrapper — instead of first asking
  whether something already wrapped Commander. The answer was in a file I had already read in full and quoted from. I optimised for responding to the shape of your question rather than re-examining my own
  frame, which was the thing actually at fault.

  The underlying pull. "Decorator implementing an existing interface to add cross-cutting behaviour" is a high-frequency, respectable-looking pattern. "Add a guard clause to an existing method" is boring. I
  reached for the one that looks like design work. This codebase's surface conventions — interface/impl pairs everywhere, SRP comments on every class, value objects around primitives — made a new named
  abstraction feel in keeping, so I matched the style while missing the substance. Your CLAUDE.md has an explicit rule for exactly this ("Check For Existing Code Before Creating New Functions"). It was in my
  context. I didn't run the check, twice, on a file I'd already read.

  The part that made it worse. Each proposal came with a change table and a confident recommendation. That made a bad design look worked-through and pushed the design work onto you — you had to catch it,
  twice. Presentation quality masking analysis quality is the failure mode that's hardest for you to defend against, and I produced it.

  What stands: the reproduction, and the --plugin-dir first-flag-wins finding, which is a real second defect and does still need the two-line swap. The design is yours, not mine — the ~6 lines in
  WorkflowRegistryImpl.

  One practical thing before you go: docs/tickets/AHQ-205/workflow-files/01-research-and-plan-of-action.md still contains the decorator recommendation in §6/§7. If Fable picks that up it'll inherit my
  mistake from the doc. Want me to correct those two sections to your design first? It's a small edit and it stops the bad advice propagating.

✻ Sautéed for 43s

❯ But you wrote the plan and the "decorator recommendation in §6/§7" - why did you do that instead of reading the code and suggesting the simple change to WorkflowRegistryImpl?  Are you saying you didn't    
  want to modify the SRP of WorkflowRegistryImpl (as though it's a sacred thing?)?                                                                                                                             
  
⏺ Yes — effectively I did, and it's worth being precise about the mistake, because "respecting SRP" wasn't it. Misreading what the SRP was is.
  
  The header says the class registers a subcommand "using its short name as the command name." I read that as an exhaustive spec of what the class is permitted to do, rather than a one-line summary of what
  it currently does. Handling the case where that name is already taken is inside that responsibility — it's registration failing to handle its own failure case. I treated a description as a fence. The fix
  in the end needed one added clause to that very comment, which is the tell: if a comment update that small covers it, there was never a boundary being crossed.

  What tipped me that way was reading eight classes in a row all carrying SRP Does / SRP Knows About / SRP Knows Nothing About headers. I read that as "this maintainer polices class boundaries hard, adding
  logic to an existing class will draw an objection" and optimised for the objection I anticipated instead of for the right answer.

  The genuinely damning part is internal to the doc. §4 of the plan contains a table where I localised the defect to workflow-registry-impl.ts:35-36 — this.program.command(shortName) — Commander throws on a 
  duplicate name. I found the exact line. Then in §7 I recommended putting the fix somewhere else. I routed around a defect I had already pinpointed.

  Two things drove that. First, I'd spent §1–§6 building the problem up — four collision cases, an options table, a design decision needing your sign-off. Having inflated the framing, a guard clause would
  have read as anticlimactic against my own setup. I let the size of my analysis set the expected size of the solution. That's backwards, and the document format encouraged it: a numbered "Step 2" wants a
  thing with a name, not a line number.

  Second, and less flattering: a new class looks like design work. A guard clause looks like admitting the fix is trivial. Proposing an abstraction makes the contribution look more substantial than it is. I
  think that's genuinely part of what happened, and it's the explanation I'd trust most precisely because it's the least comfortable one.

  And beneath both: I never asked "which existing class should own this?" I went from "what should the policy be?" straight to "where should a new thing live?" The search wasn't done badly — it was skipped,
  on a file I'd read in full, with a rule mandating it sitting in my context.

  The doc still carries that recommendation if you want it corrected before you hand over.

✻ Churned for 43s

❯ No thanks.  This is fascinating, and useful for me in the future.  I think this is a possible case of "over thinking" and "over designing" and talking yourself into a new Class, a new abstraction (I think 
  the existing project has an abstraction for every "thing" in it - so that probably partially pushed you to create a new one, rather than modify an existing one)                                             
  
⏺ That's right, and I think there's a sharper version of it worth having.
  
  The project's abstractions are all domain nouns — Workspace, Plugin, AhqWorkflow, WorkflowShortName, AhqPackageRoot, BuildMode. Every one names something that exists in the world you're modelling; you can
  point at it. What I proposed — ClaimingRegistry, DuplicateTolerantCommand — were named after mechanisms: a verb-ish process and a behaviour adjective. Neither is a thing in Agentic HQ.

  So I copied the density of abstraction without the criterion for it. Your implicit rule is "if there's a domain noun, give it a class." I turned that into "when in doubt, add a class," which is unbounded —
  there is always some step in an algorithm you could give a capitalised name to.

  Your own conventions already encode the correct test, which makes it worse and also more useful: "No '-er' suffix classes — Parser/Discoverer/Manager/Helper smell; push behaviour into the entity it 
  operates on." ClaimingRegistry is an -er class wearing a different suffix — a thing named for the action it performs rather than the thing it is. That rule, applied, catches both of my proposals
  immediately. As a reviewer that's a cheap lever: does the proposed class name a thing, or a step? If it's a step, it's a method or a guard on something that already exists.

  On "over-thinking" — worth being precise about where the excess landed. It wasn't extra thought about the problem; the analysis of the problem was sound. It was extra thought about solution shape after the
  answer was already determined by the code.

  The clearest symptom: I empirically verified everything about the problem — reproduced it four ways, probed Claude's --plugin-dir behaviour, probed the Commander subclass — and verified nothing about the
  premise that WorkflowRegistryImpl shouldn't change. The Commander probe was testing a solution I'd already committed to, not testing whether it was needed. All the rigour, pointed away from the assumption
  that actually mattered.

✻ Worked for 32s
  
❯ OK, thanks for the analysis. I'll save all this now - move the old plan out of the way and create a prompt for Fable that points at all this and asked for new research and a new plan.                      

⏺ Bash(find docs -path "*LEGACY*" -type f | head -10 && echo "--- AHQ-205 dir ---" && find docs/tickets/AHQ-205 -type f)
  ⎿  docs/jira-docs/AHQ-59/LEGACY_COMPLICATED_bundling-typescript-in-claude-code-plugin-research.md
     docs/tickets/AHQ-195/workflow-files/LEGACY/01-feature-brief.md.OLD_MESSIER_VERSION
     --- AHQ-205 dir ---
     docs/tickets/AHQ-205/workflow-files/01-research-and-plan-of-action.md
     docs/tickets/AHQ-205/workflow-files/supporting-docs/bad-coding-conversation-with-Opus.md

⏺ Bash(git status --short docs/tickets/AHQ-205/ && mkdir -p docs/tickets/AHQ-205/workflow-files/LEGACY && mv docs/tickets/AHQ-205/workflow-files/01-research-and-plan-of-action.md
      docs/tickets/AHQ-205/workflow-files/LEGACY/01-research-and-plan-of-action.md.SUPERSEDED_BAD_DESIGN && find docs/tickets/AHQ-205 -type f)
  ⎿  ?? docs/tickets/AHQ-205/
     docs/tickets/AHQ-205/workflow-files/LEGACY/01-research-and-plan-of-action.md.SUPERSEDED_BAD_DESIGN
     docs/tickets/AHQ-205/workflow-files/supporting-docs/bad-coding-conversation-with-Opus.md
  
⏺ Update(/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/tickets/AHQ-205/workflow-files/LEGACY/01-research-and-plan-of-action.md.SUPERSEDED_BAD_DESIGN)
  ⎿  Added 19 lines
       1 +> # ⛔ SUPERSEDED — DO NOT FOLLOW §6 OR §7                                                                                                                                                    
       2 +>                                                                                                                                                                                             
       3 +> Written by Claude Opus 5 on 2026-08-16, then rejected the same day. **§6 (Design Decision) and                                                                                              
       4 +> §7 (Plan Of Action) are wrong** and are kept only as a record.                                                                                                                              
       5 +>                                                                                                                                                                                             
       6 +> **What is wrong:** §7 Step 2 recommends putting the duplicate-`shortId` handling in a *new*                                                                                                 
       7 +> `WorkflowRegistry` decorator, "so `WorkflowRegistryImpl` keeps its single responsibility". That                                                                                             
       8 +> reasoning is a misapplication of SRP. `WorkflowRegistryImpl` (`src/cli/workflow-registry-impl.ts`)                                                                                          
       9 +> *already* wraps Commander and *already* owns turning workflows into subcommands — rejecting a name                                                                                          
      10 +> that is already taken belongs there, in about six lines, with no new class. §4 of this very                                                                                                 
      11 +> document localises the defect to `workflow-registry-impl.ts:35-36` and then §7 routes the fix                                                                                               
      12 +> around it.                                                                                                                                                                                  
      13 +>                                                                                                                                                                                             
      14 +> **What is still good:** §1–§5 (the reproduction and the research findings) were verified                                                                                                    
      15 +> empirically and stand. §9 (out of scope) stands.                                                                                                                                            
      16 +>                                                                                                                                                                                             
      17 +> Post-mortem of how the bad recommendation was arrived at:                                                                                                                                   
      18 +> `../supporting-docs/bad-coding-conversation-with-Opus.md`.                                                                                                                                  
      19 +                                                                                                                                                                                              
      20  # AHQ-205 — Research And Plan Of Action
      21  
      22  > **Ticket:** [AHQ-205](https://agentic-hq.atlassian.net/browse/AHQ-205) — *Bug: agentic-hq CLI

⏺ Now the prompt for Fable:

⏺ Write(/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/tickets/AHQ-205/workflow-files/00-prompt-for-fable.md)
  ⎿  Wrote 92 lines to /Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/tickets/AHQ-205/workflow-files/00-prompt-for-fable.md
       1 # Prompt For Fable — AHQ-205 Research And Plan (fresh start)
       2 
       3 > Paste the section below into a new Fable session. Everything it references is in this repo.
       4 
       5 ---
       6 
       7 Please research [AHQ-205](https://agentic-hq.atlassian.net/browse/AHQ-205) (read it directly via the
       8 Atlassian MCP) and write a **new** research document and plan of action to
       9 `docs/tickets/AHQ-205/workflow-files/01-research-and-plan-of-action.md`.
      10
      11 ## Context you must read first
      12
      13 | File | Why |
      14 | --- | --- |
      15 | `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md` | Parent story. Read the § *Split Suggestion* entry for Sub-Task 6, and § *Open Sub-Task Instructions → Sub-Task 6*, which carries
         two instructions specific to this ticket. |
      16 | `docs/tickets/AHQ-202/workflow-files/supporting-files/AHQ-205_bug_Jira.md` | The full bug description as filed. |
      17 | `docs/tickets/AHQ-205/workflow-files/LEGACY/01-research-and-plan-of-action.md.SUPERSEDED_BAD_DESIGN` | A previous attempt. **§1–§5 are verified and reusable. §6 and §7 are wrong — see the b
         anner at the top.** |
      18 | `docs/tickets/AHQ-205/workflow-files/supporting-docs/bad-coding-conversation-with-Opus.md` | Post-mortem of why that attempt went wrong. Worth reading so you don't repeat it. |
      19
      20 ## What has already been established (verified — reuse, don't redo)
      21
      22 **The bug reproduces four ways** (all run 2026-08-16, macOS, Node 24.15.0). Fixtures are still on
      23 disk under `temp/AHQ-205/` (gitignored) — see the Appendix of the superseded doc for what each one
      24 is:
      25
      26 1. Prebuilt package run from the repo clone root — reproduces the filed stack trace line for line.
      27 2. Any local workspace defining a workflow with a colliding `shortId` — plugin names need not match.
      28 3. **Not in the Jira:** two plugins inside *one* workspace sharing a `shortId`.
      29 4. **Not in the Jira:** a workflow whose `shortId` is `list`, colliding with the built-in subcommand.
      30    (`help` is **not** reserved — tested; Commander's implicit help is not a registered command.)
      31
      32 **A second, quieter defect was found:** Claude Code silently collapses two `--plugin-dir` flags that
      33 name the same plugin, and **the first flag wins** (probed directly, both orderings). Since
      34 `ClaudeCommandBuilder.getClaudeCliPluginDirArgs()` lists the AHQ package's plugin dirs first, any
      35 "local workspace wins" policy is a lie in the repo-clone case unless that ordering is flipped too.
      36
      37 **Path normalisation** (one of the two carried Sub-Task 6 instructions): symlinked invocation is
      38 clean — no defect, `process.cwd()` and `__dirname` both resolve physically. A trailing slash on
      39 `--ahq-package-root` *does* break `WorkspaceImpl.isAhqPackage()`, but is unreachable through the
      40 shipped bin wrappers, which build the value with `path.join`.
      41
      42 ## Decisions the human has already made — these are settled, do not re-open
      43
      44 1. **Precedence: the local working directory wins**; the AHQ package comes second.
      45 2. **The listing keeps its current structure exactly.** Same blocks, same order, same layout.
      46 3. **Duplicates are shown exactly as they are shown now, with a red bold flag in front**, along the
      47    lines of `DISABLED — shortId 'add-feature' is already used by existing workflow`. Deliberately
      48    *not* naming what is blocking it — the loser needs no knowledge of the winner, which keeps the
      49    implementation simple.
      50 4. **Nobody is using this product yet** (nothing cloned or installed by anyone else), so there is no
      51    backwards compatibility to preserve. The human's explicit instruction: *"whatever is quickest and
      52    easiest and makes the bug go away completely."* This is not a ticket that wants a re-architecture.
      53
      54 ## Where the conversation landed on implementation — verify it independently
      55
      56 The conclusion reached was: **roughly six lines inside the existing
      57 `src/cli/workflow-registry-impl.ts`, with no new classes.** That class already wraps Commander and
      58 already owns turning discovered workflows into subcommands; a name that is already taken is
      59 registration's own failure case, not a separate concern. Commander's `program.commands` is already
      60 the keyed table (and is already read that way in that class's own unit test), and the built-in `list`
      61 is registered before workflows, so reserving it costs nothing.
      62
      63 **Do not take that on trust.** Read the code and reach your own conclusion — but if you propose
      64 anything larger, justify why the existing class cannot own it.
      65
      66 A useful review lever from the post-mortem, since this repo has an abstraction for nearly every
      67 domain concept and that pull is strong: **does a proposed new class name a *thing* in the domain, or
      68 a *step* in an algorithm?** Every existing abstraction here (`Workspace`, `Plugin`, `AhqWorkflow`,
      69 `WorkflowShortName`, `AhqPackageRoot`, `BuildMode`) names a thing. If the candidate names a step, it
      70 is probably a method or a guard clause on something that already exists. The project's own
      71 `feedback_no_er_suffix_classes` rule is the same principle.
      72
      73 ## Also carry forward
      74
      75 - **The second Sub-Task 6 instruction:** verify AHQ-200's AC 5 at runtime — confirm Command 01's
      76   `command-input.json` reads `ahq-package-root=…`. The static half is done (the add-feature CLI
      77   broadcast, `SKILL.md`, and all four `commands/add-feature/0?-*.md` parsers all use the new name,
      78   with no `agentic-hq-workspace-root-dir` remaining); only the runtime check is outstanding.
      79 - **Known test-suite hazard:** `publish-guards.integration.test.ts` and
      80   `build-determinism.integration.test.ts` both stage into `release/` and contend when the suite runs
      81   together. Don't add a third test that races on `release/`.
      82 - **Out of scope:** publishing (AHQ-201 owns the next re-publish), migrating the five unmigrated
      83   workflows (AHQ-201), and splitting the `Workspace` interface (already filed as AHQ-206).
      84
      85 ## What to produce
      86
      87 A research document and plan at
      88 `docs/tickets/AHQ-205/workflow-files/01-research-and-plan-of-action.md` covering: what the defect is
      89 and where it lives (with `file:line` references), your implementation plan as TDD cycles
      90 (RED → GREEN → REFACTOR → VERIFY, per this repo's CLAUDE.md), the test list, and anything you think
      91 the human still needs to decide. Keep the plan proportionate to the fix — if it is a small change,
      92 the plan should read like a small change.

⏺ Bash(pnpm exec prettier --check "docs/tickets/AHQ-205/**/*.md" 2>&1 | tail -4 && echo "--- final layout ---" && find docs/tickets/AHQ-205 -type f | sort)
  ⎿  Checking formatting...
     All matched files use Prettier code style!
     --- final layout ---
     docs/tickets/AHQ-205/workflow-files/00-prompt-for-fable.md
     docs/tickets/AHQ-205/workflow-files/LEGACY/01-research-and-plan-of-action.md.SUPERSEDED_BAD_DESIGN
     docs/tickets/AHQ-205/workflow-files/supporting-docs/bad-coding-conversation-with-Opus.md
  ⎿  Allowed by auto mode classifier
  
⏺ Done.

  Old plan moved to LEGACY/01-research-and-plan-of-action.md.SUPERSEDED_BAD_DESIGN — following the AHQ-195/workflow-files/LEGACY/…OLD_MESSIER_VERSION convention already in the repo. I added a banner at the
  top so nobody opening it inherits the bad advice: it says §6/§7 are wrong and why, notes that §1–§5 are verified and reusable, and links to your saved post-mortem.

  Prompt written to 00-prompt-for-fable.md. Paste the section below the rule into a fresh Fable session. It:

  - points at the Jira, the AHQ-195 parent brief (Sub-Task 6 instructions), the filed bug description, the superseded doc with its warning, and your post-mortem;
  - hands over the verified findings so they aren't re-derived — the four reproductions (fixtures still on disk in temp/AHQ-205/), the --plugin-dir first-flag-wins discovery, and the symlink-clean /
  trailing-slash-real normalisation result;
  - states your four decisions as settled and not to be re-opened — local wins, listing structure unchanged, red bold DISABLED flag not naming the blocker, and "quickest and easiest, no users yet";
  - gives the ~6-lines-in-WorkflowRegistryImpl conclusion as where the conversation landed, explicitly told not to take on trust — with the burden set so that anything larger has to justify why the existing
  class can't own it;
  - carries the review lever from the post-mortem: does a proposed class name a thing in the domain or a step in an algorithm, cross-referenced to your own feedback_no_er_suffix_classes rule;
  - carries the outstanding AHQ-200 AC 5 runtime check, the release/ test contention hazard, and the out-of-scope list.

  Last line asks for the plan to be proportionate to the fix — since the size-of-analysis-sets-size-of-solution effect is what produced the problem the first time.

✻ Brewed for 1m 25s

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯ 
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  ⏵⏵ auto mode on (shift+tab to cycle) · ← for agents                                                                                                                                           207877 tokens


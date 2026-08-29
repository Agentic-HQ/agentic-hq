# Troubleshooting

This page lists the most common problems and what to do about them, grouped by
audience:

- [Setup Troubleshooting](#setup-troubleshooting) — installing the
  `agentic-hq` CLI from npm, or something from initial setup missing.
- [Tool Troubleshooting](#tool-troubleshooting) — using the installed
  `agentic-hq` tool to run workflows.
- [Contributor Troubleshooting](#contributor-troubleshooting) — working on a
  clone of the Agentic HQ repo itself.

If your problem isn't here, see the [Support](../../README.md#support)
section of the main README.

---

## Setup Troubleshooting

This section is for **Normal Users** installing the tool from npm and following the README's
[Quick Start](../../README.md#quick-start) — covers installation and initial setup.

### `npm install -g agentic-hq` fails

#### `Unsupported engine` warning or hard error

- **Cause:** Your Node.js version doesn't match the package's `engines`
  constraint (`^22.0.0 || ^24.0.0` — Node 22 or 24 LTS).
- **Fix:** Install Node 24 LTS (recommended) or Node 22 LTS. Confirm with
  `node --version`. If you use a version manager (nvm / nvm-windows / fnm /
  asdf), switch to the v22 or v24 line. (On nvm-windows, remember a version
  switch drops global installs — see the
  [Windows entry below](#windows-agentic-hq-stops-being-recognized-after-a-node-version-switch).)

#### `EACCES` / permission errors

- **Cause:** A previous `sudo npm` command left files owned by root inside
  `~/.npm` or npm's global prefix.
- **Fix:** Don't use `sudo` with npm. Fix the ownership of the offending
  directory (e.g. `sudo chown -R $(whoami) ~/.npm`) and re-run
  `npm install -g agentic-hq`. Installing Node via nvm avoids this entirely —
  nvm keeps the global prefix inside your home directory.

#### `node-pty` build fails on Linux — `gyp ERR! ... not found: make` (or "Could not find any Python")

- **Cause:** On Linux `node-pty` has no prebuilt binary, so it compiles from
  source via `node-gyp` — which needs a C/C++ build toolchain. A clean Linux
  box (or a minimal/container image) is missing `make`/`gcc`/`g++`
  (`not found: make`) and/or `python3` (`Could not find any Python
  installation to use`).
- **Fix (Ubuntu/Debian):** install the toolchain, then re-run the install:
  ```bash
  sudo apt-get update && sudo apt-get install -y build-essential python3
  npm install -g agentic-hq
  ```
  `build-essential` provides `make`/`gcc`/`g++`/`libc6-dev`; `python3` is
  needed by node-gyp's configure step. Verify the install works with
  `agentic-hq list`.

#### `Failed to load native module: pty.node` on Linux — every command crashes at startup

- **Symptom:** The install reported success, but every `agentic-hq` command —
  including `agentic-hq list` — exits immediately with:
  ```
  Error: Failed to load native module: pty.node, checked: build/Release, build/Debug, prebuilds/linux-x64
  ```
- **Cause:** You installed without `--allow-scripts` on **npm 12 or newer**,
  which blocks package install scripts by default. On Linux `node-pty` has
  no prebuilt binary, so its blocked install script never compiled one —
  and npm still reported a successful install.
- **Fix:** reinstall with the flag:
  ```bash
  npm install -g --allow-scripts=agentic-hq,node-pty agentic-hq
  ```
  Check your npm version with `npm -v`. This cannot happen on npm 11, where
  install scripts still run (you get a warning instead of a block).
- **Using `npx` instead of installing?** It fetches and installs the same way,
  so it needs the same flag:
  `npx --yes --allow-scripts=agentic-hq,node-pty agentic-hq list`

#### `posix_spawnp failed` at runtime on macOS

Two different causes — check the npm one first, as it is by far the more
common now.

- **Cause 1 — install scripts blocked (npm 12+).** You installed without
  `--allow-scripts` on npm 12 or newer. Unlike Linux, macOS *does* have a
  prebuilt `node-pty` binary, so the CLI starts and `agentic-hq list` works
  normally — but Agentic HQ's blocked install script never marked the
  binding's `spawn-helper` executable, so the failure only appears when a
  workflow launches Claude Code.
- **Fix:** reinstall with the flag:
  ```bash
  npm install -g --allow-scripts=agentic-hq,node-pty agentic-hq
  ```
- **Cause 2 — macOS older than 13.5.** The `node-pty` dependency ships
  prebuilt native binaries that require macOS 13.5 or newer; on older macOS
  the install fails to produce a working `node-pty`, or you hit a runtime
  `Error: posix_spawnp failed` when a workflow starts Claude Code.
- **Fix:** Agentic HQ requires **macOS 13.5 or newer**. Check your version
  with `sw_vers --productVersion`; if it is below 13.5, upgrade macOS or
  use a machine that meets the floor.

### Windows: `npm.ps1 cannot be loaded` (or `pnpm.ps1`) in PowerShell

- **Cause:** Some Node install routes put `.ps1` shims on your `PATH`, and
  PowerShell's default `Restricted` execution policy blocks all scripts.
  This only affects commands **you** type in PowerShell — Agentic HQ's own
  subprocesses never go through PowerShell.
- **Fix (recommended, one-time):**
  ```powershell
  Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
  — the fix most Windows dev guides use, and the one the README's
  [Windows notes](../../README.md#windows-notes) walk you through. It is a
  Windows security setting, so it's your call: `RemoteSigned` lets locally
  created scripts (like npm's shims) run, while downloaded scripts must
  still be signed.
- **Fallback if you'd rather not change the policy:** still in PowerShell,
  append `.cmd` to the blocked command (`npm.cmd` / `npx.cmd`) — the `.cmd`
  shims sit alongside the `.ps1` ones and are never blocked.

### Windows: `agentic-hq` stops being recognized after a Node version switch

- **Symptom:** `'agentic-hq' is not recognized as the name of a cmdlet…`
  even though the install previously worked.
- **Cause:** nvm-windows keeps a **separate set of global packages per Node
  version**, so switching or upgrading Node silently drops everything you
  installed with `npm install -g` — including `agentic-hq`. (nvm-windows
  never switches by itself; this happens after an `nvm install`/`nvm use`.)
- **Fix:** re-run the install under the new Node version:
  ```powershell
  npm install -g --allow-scripts=agentic-hq,node-pty agentic-hq
  ```

### `agentic-hq: command not found`

- **Cause:** npm's global bin directory isn't on your `PATH`, or your current
  shell hasn't picked up the newly installed binary. Under nvm this dir is
  the active Node version's `bin` and is normally already on `PATH`; on a
  system-Node setup it occasionally isn't.
- **Fix:** Open a new terminal window and try again. If it still fails, check
  where npm puts global binaries and confirm that dir is on your `PATH`:
  ```bash
  npm prefix -g   # the global bin dir is <that path>/bin
  ```
  Make sure `<npm prefix -g>/bin` is on your `PATH`. (On Windows the shims
  sit **directly in** the prefix directory, not under `bin\` — that
  directory itself must be on `PATH`.)

### `claude: command not found`

- **Cause:** Claude Code CLI is not installed — it's a prerequisite, but the
  error only surfaces the first time a workflow launches Claude Code as a
  subprocess.
- **Fix:** Install Claude Code from <https://claude.ai/code>, then re-run
  the workflow.

### Old or broken versions on the registry

- `agentic-hq@0.1.0` is **deprecated** — its `npx` runs crash
  (`posix_spawnp failed`). Version 0.1.1 was the first working release, and
  the current release is **0.2.0**. `npm install -g agentic-hq` and
  `npx --yes agentic-hq` fetch the latest version by default; if you're
  somehow on 0.1.0, upgrade with
  `npm install -g --allow-scripts=agentic-hq,node-pty agentic-hq@latest`.

---

## Tool Troubleshooting

This section is for anyone **running workflows** with the npm-installed `agentic-hq` tool.

### *"Do you trust the files in this folder?"*

- **Cause:** First time Claude Code has been run in this folder — it recurs
  in every new folder you run a workflow from, not just during the Quick
  Start.
- **Fix:** Choose **Yes**.

### Workflow hangs or produces no output

- **Cause:** Claude Code may be waiting on a permission prompt that AHQ
  can't see. AHQ auto-approves a curated tool list; if a workflow uses a
  tool outside that list, the prompt blocks the run.
- **Fix:** See [WARNING-re-auto-approved-claude-permissions.md](WARNING-re-auto-approved-claude-permissions.md)
  for what's auto-approved. If you've added a workflow that needs an extra
  tool, it will need to be added to `DEFAULT_ALLOWED_TOOLS` in
  `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts`.

### Jira-driven workflows: `mcp__mcp-atlassian__*` not available

- **Cause:** The Sooperset Atlassian MCP server isn't configured. The
  `quick-jira` and `full-jira` workflows need it.
- **Fix:** Run the install script as described in
  [setting-up-jira-mcp-server.md](workflow-descriptions/setting-up-jira-mcp-server.md).

### Windows: workflow build fails creating the framework link (`EPERM` / `EBUSY` / junction errors)

- **Cause:** Agentic HQ connects each workflow to the framework with an NTFS
  **directory junction**, which only works on a **local NTFS volume**.
  Junction creation fails on network drives (UNC paths like `\\server\…`)
  and FAT32/exFAT volumes (USB sticks, some SD cards); OneDrive- or
  Dropbox-synced folders can also throw **transient** `EPERM`/`EBUSY`
  errors while the sync client holds files open.
- **Fix:** Run workflows from a workspace on a local NTFS drive (e.g.
  somewhere under `C:\Users\<you>\`), outside any cloud-synced folder. If a
  synced folder is unavoidable and the error is transient, pausing sync and
  re-running usually clears it. Note junctions need **no** Developer Mode
  and **no** admin rights — if you were told to enable Developer Mode for
  symlinks, that doesn't apply here.

### Windows: first workflow run (or install) is very slow

- **Cause:** Windows Defender's real-time scanning inspects every file the
  install and first workflow build create — thousands of small files.
- **Fix:** Nothing is wrong — later runs are much faster because the
  builds are cached. If it bothers you, an antivirus exclusion for your
  workspace folder speeds things up (standard developer practice, at your
  discretion).

### Windows: a workflow's Claude session can't run `bash` commands

- **Cause:** On Windows, Claude Code only offers its Bash tool when it can
  find Git Bash; without Git installed, Claude works in PowerShell mode.
  All workflows shipped with Agentic HQ work in both modes — but a workflow
  you wrote (or copied) whose instructions genuinely need `bash`/`git` will
  fail without it. Separately, if Git IS installed somewhere non-standard,
  Claude Code may fail to find it.
- **Fix:** Install [Git for Windows](https://git-scm.com/download/win) if
  the workflow needs it. For a non-standard Git location, point Claude Code
  at it via the `CLAUDE_CODE_GIT_BASH_PATH` environment variable (settable
  in Claude Code's `settings.json` under `env`).

---

## Contributor Troubleshooting

This section is for **Contributors** working on a clone of the repo and following 
the ([setting-up-agentic-hq-for-development.md](../dev/setting-up-agentic-hq-for-development.md) guide

### `pnpm install` fails (contributor setup step 5)

#### `pnpm: command not found`

- **Cause:** Corepack is not enabled (contributor setup step 4). Corepack ships with
  Node.js 22+ but is inactive until you turn it on; once enabled it provides
  the pnpm version pinned in `package.json`.
- **Fix:**
  ```bash
  corepack enable
  pnpm --version   # should print the version pinned in package.json
  ```

#### `Unsupported engine` warning or hard error

- Same cause as the
  [Setup Troubleshooting entry](#unsupported-engine-warning-or-hard-error) —
  in the clone, the repo's root `.nvmrc` pins Node 24 (currently `24.15.0`),
  so `nvm use` selects a supported version automatically.

#### `EACCES` / permission errors

- **Cause:** A previous `npm install -g` or `sudo` command left files owned
  by root inside `~/.npm` or the project's `node_modules`.
- **Fix:** Delete the offending directory and re-run `pnpm install`. Don't
  use `sudo` with pnpm.

#### `node-pty` build fails on Linux

- Same toolchain cause and fix as the
  [Setup Troubleshooting entry](#node-pty-build-fails-on-linux--gyp-err--not-found-make-or-could-not-find-any-python),
  except the re-run in a clone is `rm -rf node_modules && pnpm install`.
  Verify the binary was produced:
  `ls node_modules/.pnpm/node-pty@*/node_modules/node-pty/build/Release/pty.node`.

### Installing the `agentic-hq-dev` CLI (`npm link`, contributor setup step 6) fails

#### `agentic-hq-dev: command not found` after `npm link`

- **Cause:** npm's global bin directory isn't on your `PATH`, or your current
  shell hasn't picked up the new symlink. Under nvm this dir is the active
  Node version's `bin` and is normally already on `PATH`; on a system-Node
  setup it occasionally isn't.
- **Fix:** Open a new terminal window and try again. If it still fails, check
  where npm puts global binaries and confirm that dir is on your `PATH`:
  ```bash
  npm prefix -g   # the global bin dir is <that path>/bin
  ```
  Make sure `<npm prefix -g>/bin` is on your `PATH`. (On Windows the shims —
  `agentic-hq-dev.cmd` etc. — sit **directly in** the prefix directory, not
  under `bin\`; that directory itself must be on `PATH`, which nvm-windows
  sets up automatically.)

#### Windows: `agentic-hq-dev` stops being recognized after a Node version switch

- **Cause:** nvm-windows keeps separate global packages per Node version, so
  an `nvm install`/`nvm use` drops the `npm link` you made under the old
  version (same mechanism as the
  [user-side entry](#windows-agentic-hq-stops-being-recognized-after-a-node-version-switch)).
- **Fix:** re-run `npm link` from the repo root under the new Node version.

#### `npm link` prints an `allow-scripts` warning (Linux/Windows)

- **Cause:** A benign warning from running `npm` in a pnpm repo:
  *`allow-scripts … postinstall: node scripts/postinstall.cjs`* is npm's
  supply-chain gate deferring the project's `postinstall`. That script only
  marks the **macOS** node-pty prebuild executable; on Linux and Windows it
  is a no-op. No need to approve it.
- **Fix:** None needed — ignore it. `npm link` still succeeds ("added 1
  package") and `agentic-hq-dev` is on your `PATH`.

#### `npm link` prints a `packageManager` / pnpm warning

- **Cause:** This repo pins pnpm via the `packageManager` field, so npm may
  print a benign warning when you run `npm link`. This is expected.
- **Fix:** Ignore it. `npm link` only registers the global `agentic-hq-dev`
  command via the package's `bin` field; pnpm still owns `node_modules`. To
  undo the link later, run `npm unlink -g agentic-hq`.

### `pnpm validate` fails (contributor setup step 7)

`pnpm validate` runs four checks: typecheck, lint, format, unit tests. The
output names which one failed.

- **Typecheck failures** typically mean dependencies didn't install
  cleanly — re-run `pnpm install` and try again.
- **Format check failures** on a fresh clone are unexpected; please report.
- **Unit test failures** on a fresh clone are unexpected; please report.

If the failure is unrelated to the contributor setup, see
[`docs/dev/npm-commands.md`](../dev/npm-commands.md) for what each script
does.

### `agentic-hq-dev list` shows nothing or errors

#### `command not found: agentic-hq-dev`

- **Cause:** Same as the *`agentic-hq-dev: command not found` after `npm link`*
  case above.
- **Fix:** Open a new terminal; check that `<npm prefix -g>/bin` is on
  `PATH`.

#### Listing is empty / missing plugins

- **Cause:** A stale or failed `npm link`. The shipped plugins are located
  via the invoked binary's own package root — not your current directory —
  so `agentic-hq-dev list` shows them from anywhere. If they're missing, the
  `agentic-hq-dev` on your `PATH` isn't a working link to your clone (e.g.
  the clone was moved or deleted since linking, or the link step failed).
- **Fix:** Check what you're actually invoking with `which agentic-hq-dev`,
  then re-run `npm link` from the repo root and try again.

### Why aren't my changes having any effect?

- **Cause:** You have **both** binaries on your `PATH` (the npm-installed
  package plus your linked clone) and ran `agentic-hq`, which runs the
  npm-installed framework and its shipped workflows — edits made in your
  clone have zero effect when run through it.
- **Fix:** Always use `agentic-hq-dev` to run your workspace code. Check
  which binary you invoked (`which agentic-hq` / `which agentic-hq-dev`;
  on Windows PowerShell: `Get-Command agentic-hq-dev`).
  See also the dual-install NOTE in
  [setting-up-agentic-hq-for-development.md](../dev/setting-up-agentic-hq-for-development.md).

---

## Still stuck?

See the [Support](../../README.md#support) section of the main README for
how to get help.

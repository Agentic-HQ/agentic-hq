# Quickstart Troubleshooting

If a step in the README's [Quick Start](../../README.md#quick-start) fails — whether
**installing** Agentic HQ or **running a workflow** — this page lists the most common
causes and what to do. It is grouped to mirror the Quick Start: first the
[Installation](#installation) steps, then [Running a workflow](#running-a-workflow).

If your problem isn't here, see the [Support](../../README.md#support)
section of the main README.

---

## Installation

Covers everything from `pnpm install` through the string-reversal smoke test at the
end of the README's [Installation](../../README.md#installation) steps.

### `pnpm install` fails

#### `pnpm: command not found`

- **Cause:** Corepack is not enabled. pnpm ships with Node.js 22+ but is
  inactive until you turn corepack on.
- **Fix:**
  ```bash
  corepack enable
  pnpm --version   # should print the version pinned in package.json
  ```

#### `Unsupported engine` warning or hard error

- **Cause:** Your Node.js version doesn't match the project's `engines`
  constraint (`^22.0.0 || ^24.0.0` — Node 22 or 24 LTS).
- **Fix:** Install Node 24 LTS (recommended) or Node 22 LTS. Confirm with
  `node --version`. If you use a version manager (nvm / fnm / asdf), switch
  to the v22 or v24 line — the repo's root `.nvmrc` pins Node 24
  (currently `24.15.0`), so `nvm use` selects it automatically.

#### `EACCES` / permission errors

- **Cause:** A previous `npm install -g` or `sudo` command left files owned
  by root inside `~/.npm` or the project's `node_modules`.
- **Fix:** Delete the offending directory and re-run `pnpm install`. Don't
  use `sudo` with pnpm.

#### `node-pty` build fails on Linux — `gyp ERR! ... not found: make` (or "Could not find any Python")

- **Cause:** On Linux `node-pty` has no prebuilt binary, so it compiles from
  source via `node-gyp` — which needs a C/C++ build toolchain. A clean Linux
  box (or a minimal/container image) is missing `make`/`gcc`/`g++`
  (`not found: make`) and/or `python3` (`Could not find any Python
  installation to use`).
- **Fix (Ubuntu/Debian):** install the toolchain, then re-run the install:
  ```bash
  sudo apt-get update && sudo apt-get install -y build-essential python3
  rm -rf node_modules && pnpm install
  ```
  `build-essential` provides `make`/`gcc`/`g++`/`libc6-dev`; `python3` is
  needed by node-gyp's configure step. Verify the binary was produced:
  `ls node_modules/.pnpm/node-pty@*/node_modules/node-pty/build/Release/pty.node`.

#### `node-pty` install fails / `posix_spawnp failed` at runtime (older macOS)

- **Cause:** Your macOS version is older than **13.5**. The `node-pty`
  dependency ships prebuilt native binaries that require macOS 13.5 or
  newer; on older macOS the install fails to produce a working `node-pty`,
  or you hit a runtime `Error: posix_spawnp failed` when a workflow starts
  Claude Code.
- **Fix:** Agentic HQ requires **macOS 13.5 or newer**. Check your version
  with `sw_vers --productVersion`; if it is below 13.5, upgrade macOS or
  use a machine that meets the floor.

### On Windows: install fails or behaves unexpectedly

- **Cause:** Windows is unsupported. Agentic HQ runs on macOS 13.5+ (tested
  on 15.7.5) and Linux (tested on Ubuntu 24.04 LTS); native Windows path
  handling is likely to
  break during install or at runtime.
- **Fix:** Run Agentic HQ on a supported OS. The tested route for Windows
  users is free **VMware + Ubuntu 24.04 LTS**, which works out of the box.
  **WSL** is untested but may work if paths behave the same as native Linux
  — if you try it, please report back on the
  [Discord server](https://discord.gg/fnR7SJt2d7).

### Installing the `agentic-hq` CLI (`npm link`) fails

#### `agentic-hq: command not found` after `npm link`

- **Cause:** npm's global bin directory isn't on your `PATH`, or your current
  shell hasn't picked up the new symlink. Under nvm this dir is the active
  Node version's `bin` and is normally already on `PATH`; on a system-Node
  setup it occasionally isn't.
- **Fix:** Open a new terminal window and try again. If it still fails, check
  where npm puts global binaries and confirm that dir is on your `PATH`:
  ```bash
  npm prefix -g   # the global bin dir is <that path>/bin
  ```
  Make sure `<npm prefix -g>/bin` is on your `PATH`.

#### `npm link` prints `Unknown project config "frozen-lockfile"` and/or an `allow-scripts` warning (Linux)

- **Cause:** Two benign warnings from running `npm` in a pnpm repo:
  - *`Unknown project config "frozen-lockfile"`* — `frozen-lockfile` is a
    **pnpm** key in the shared `.npmrc`; npm doesn't recognise it and warns.
    pnpm still enforces it; npm ignores it.
  - *`allow-scripts … postinstall: chmod +x … node-pty/prebuilds/darwin-*/…`*
    — npm's supply-chain gate deferring the project's `postinstall`. That
    script only marks the **macOS** node-pty prebuild executable; on Linux the
    `darwin-*` glob matches nothing, so it's a no-op. No need to approve it.
- **Fix:** None needed — ignore both. `npm link` still succeeds ("added 1
  package") and `agentic-hq` is on your `PATH`.

#### `npm link` prints a `packageManager` / pnpm warning

- **Cause:** This repo pins pnpm via the `packageManager` field, so npm may
  print a benign warning when you run `npm link`. This is expected.
- **Fix:** Ignore it. `npm link` only registers the global `agentic-hq`
  command via the package's `bin` field; pnpm still owns `node_modules`. To
  undo the link later, run `npm unlink -g agentic-hq`.

### `pnpm validate` fails

`pnpm validate` runs four checks: typecheck, lint, format, unit tests. The
output names which one failed.

- **Typecheck failures** typically mean dependencies didn't install
  cleanly — re-run `pnpm install` and try again.
- **Format check failures** on a fresh clone are unexpected; please report.
- **Unit test failures** on a fresh clone are unexpected; please report.

If the failure is unrelated to the README quickstart, see
[`docs/dev/npm-commands.md`](../dev/npm-commands.md) for what each script
does.

### `agentic-hq list` shows nothing or errors

#### `command not found: agentic-hq`

- **Cause:** Same as the *`agentic-hq: command not found` after `npm link`*
  case above.
- **Fix:** Open a new terminal; check that `<npm prefix -g>/bin` is on
  `PATH`.

#### Listing is empty / missing plugins

- **Cause:** You're running `agentic-hq` from a directory that isn't the AHQ
  workspace and your local workspace doesn't contain a `.agentic-hq/plugins/`
  directory.
- **Fix:** `cd` back into the cloned `agentic-hq` repo and try again. The
  list shown there will include all shipped plugins.

---

## Running a workflow

These apply to **any** workflow run — the `reversal` smoke test in the install
steps, the flagship `add-feature` workflow, and the Jira-driven demos alike.

### `claude: command not found`

- **Cause:** Claude Code CLI is not installed. AHQ launches it as a
  subprocess.
- **Fix:** Install Claude Code from <https://claude.ai/code>, then re-run
  the workflow.

### *"Do you trust the files in this folder?"*

- **Cause:** First time Claude Code has been run in this workspace.
- **Fix:** Choose **Yes**. (The README notes this at the string-reversal
  smoke-test step of [Installation](../../README.md#installation).)

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

---

## Still stuck?

See the [Support](../../README.md#support) section of the main README for
how to get help.

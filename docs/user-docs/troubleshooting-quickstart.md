# Quickstart Troubleshooting

If a step in the [README Quick Start](../../README.md#quick-start) fails,
this page lists the most common causes and what to do.

If your problem isn't here, see the [Support](../../README.md#support)
section of the main README.

---

## Step 2 — `pnpm install` fails

### `pnpm: command not found`

- **Cause:** Corepack is not enabled. pnpm ships with Node.js 22+ but is
  inactive until you turn corepack on.
- **Fix:**
  ```bash
  corepack enable
  pnpm --version   # should print the version pinned in package.json
  ```

### `Unsupported engine` warning or hard error

- **Cause:** Your Node.js version doesn't match the project's `engines`
  constraint (`>=22.0.0 <23.0.0`).
- **Fix:** Install Node v22 LTS. Confirm with `node --version`. If you use a
  version manager (nvm / fnm / asdf), switch to the v22 line.

### `EACCES` / permission errors

- **Cause:** A previous `npm install -g` or `sudo` command left files owned
  by root inside `~/.npm` or the project's `node_modules`.
- **Fix:** Delete the offending directory and re-run `pnpm install`. Don't
  use `sudo` with pnpm.

---

## Step 3 — `install-dev-agentic-hq.sh` fails

### `corepack is required but not found`

- **Cause:** Same as the Step 2 case above — corepack not on PATH.
- **Fix:** Run `corepack enable` and re-run the script.

### `pnpm link --global` errors about `PNPM_HOME`

- **Cause:** pnpm's global bin directory hasn't been set up yet. This is a
  one-time-per-machine setup.
- **Fix:** The standard fix is to run `pnpm setup`, but be aware: it will
  modify your shell config (`~/.zshrc` or `~/.bashrc`) to set `PNPM_HOME`
  and add it to `PATH`. If you'd rather not let it touch your shell config,
  set the env vars manually with whatever mechanism you normally use.

### Script exits silently or with `Permission denied`

- **Cause:** Script not executable.
- **Fix:** Run via `bash` explicitly:
  ```bash
  bash scripts/infra/install-dev-agentic-hq.sh
  ```

### `agentic-hq: command not found` after script completes

- **Cause:** pnpm's global bin directory isn't on your `PATH`, or your
  current shell hasn't picked up the new symlink.
- **Fix:** Open a new terminal window and try again. If it still fails:
  ```bash
  pnpm bin --global   # prints the global bin dir
  ```
  Make sure that dir is on your `PATH`.

---

## Step 4 — `pnpm validate` fails

`pnpm validate` runs four checks: typecheck, lint, format, unit tests. The
output names which one failed.

- **Typecheck failures** typically mean dependencies didn't install
  cleanly — re-run `pnpm install` and try again.
- **Format check failures** on a fresh clone are unexpected; please report.
- **Unit test failures** on a fresh clone are unexpected; please report.

If the failure is unrelated to the README quickstart, see
[`docs/dev/npm-commands.md`](../dev/npm-commands.md) for what each script
does.

---

## Step 5 — `agentic-hq list` shows nothing or errors

### `command not found: agentic-hq`

- **Cause:** Same as the *agentic-hq command not found* case in Step 3.
- **Fix:** Open a new terminal; check `pnpm bin --global` is on `PATH`.

### Listing is empty / missing plugins

- **Cause:** You're running `agentic-hq` from a directory that isn't the AHQ
  workspace and your local workspace doesn't contain a `.agentic-hq/plugins/`
  directory.
- **Fix:** `cd` back into the cloned `agentic-hq` repo and try again. The
  list shown there will include all shipped plugins.

---

## Steps 6 & 7 — running the demo workflows

### `claude: command not found`

- **Cause:** Claude Code CLI is not installed. AHQ launches it as a
  subprocess.
- **Fix:** Install Claude Code from <https://claude.ai/code>, then re-run
  the workflow.

### *"Do you trust the files in this folder?"*

- **Cause:** First time Claude Code has been run in this workspace.
- **Fix:** Choose **Yes**. (This is documented in step 6 of the README.)

### Workflow hangs or produces no output

- **Cause:** Claude Code may be waiting on a permission prompt that AHQ
  can't see. AHQ auto-approves a curated tool list; if a workflow uses a
  tool outside that list, the prompt blocks the run.
- **Fix:** See [WARNING-re-auto-approved-claude-permissions.md](WARNING-re-auto-approved-claude-permissions.md)
  for what's auto-approved. If you've added a workflow that needs an extra
  tool, it will need to be added to `DEFAULT_ALLOWED_TOOLS` in
  `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts`.

### Jira-driven workflows: `mcp__mcp-atlassian__*` not available

- **Cause:** The Sooperset Atlassian MCP server isn't configured.
- **Fix:** Run the install script as described in
  [setting-up-jira-mcp-server.md](workflow-descriptions/setting-up-jira-mcp-server.md).

---

## Still stuck?

See the [Support](../../README.md#support) section of the main README for
how to get help.

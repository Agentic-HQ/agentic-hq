# Setting Up Agentic HQ For Development

This guide takes a **contributor** from nothing to a working clone of the
Agentic HQ repo, with the `agentic-hq-dev` CLI on their `PATH` and the
validation suite passing.

If you just want to **use** Agentic HQ as a development tool on your own projects, you don't need 
to follow this guide and should just follow the [Quick Start](../../README.md#quick-start).

Not sure which group you're in? See the appendix
[The Two Types Of Agentic HQ User](#appendix-the-two-types-of-agentic-hq-user)
at the bottom of this page.

One thing to clarify before we start:
- **`agentic-hq-dev`** is the CLI you must use when Contributing to Agentic HQ as it points at the Agentic HQ workspace and recompiles everything when you run it
- **`agentic-hq`** is the CLI installed by npm and so can't be used for compiling/running Agentic HQ framework code and demo workflows.  It just runs the read only binaries installed by npm. 
This means that if a document in the repo says to run `agentic-hq` but you want to run the development version in the Agentic HQ workspace, you must instead use `agentic-hq-dev`

## Setup Steps

### 1. Prerequisites

The following are prerequisites:

- Claude Code - https://code.claude.com/docs/en/quickstart
- git - https://git-scm.com/install/
- gh - The GitHub CLI from https://cli.github.com/ (contributors use it for
  PRs and for the `gh run` CI-log commands — see
  [ci-configuration.md](ci-configuration.md))

Linux only:

- A C/C++ build toolchain (`make`, a compiler, and Python). This is for
  compiling `node-pty` from source during `pnpm install`. On Ubuntu/Debian
  simply run:
  - `sudo apt-get update && sudo apt-get install -y build-essential python3`

macOS only:

- macOS **13.5 or newer** is required (`node-pty`'s prebuilt native binaries
  need it; the maintainer develops on 15.7.5).

Windows only (tested on Windows 11):

- Install Git with the standard [Git for Windows](https://git-scm.com/install/) installer, which
  includes **Git Bash** — the repo's internal Claude Code git skills (`/git:*`) run `.sh` scripts
  that need it. Minimal Git distributions (e.g. MinGit) omit Git Bash — avoid them.
- PowerShell is the supported shell. Its default policy blocks the `.ps1`
  shims npm/corepack put on `PATH` (`…ps1 cannot be loaded`) — run
  `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` once (the
  recommended one-time setup; `.cmd` variants like `pnpm.cmd` are the
  fallback if you can't change the policy) — see
  [Setup Troubleshooting](../user-docs/troubleshooting.md#windows-npmps1-cannot-be-loaded-or-pnpmps1-in-powershell).

### 2. Install Node.js 24 LTS

Go to https://nodejs.org/en/download and follow the default path to install
nvm (on Windows, [nvm-windows](https://github.com/coreybutler/nvm-windows) is
what AHQ is tested with). If you already have Node.js, please confirm it is
version 22 or 24 (the only supported lines — other versions, including 23 and
25+, are unsupported). The repo has a root `.nvmrc` pinned to Node 24, so
`nvm use` selects the right version automatically. (nvm-windows keeps
**separate global packages per Node version** — after any later version
switch, redo step 4's `corepack enable` and step 6's `npm link`.) After
installation confirm success by running:

```bash
node -v
```

### 3. Clone the repo and cd into the directory

```bash
git clone https://github.com/Agentic-HQ/agentic-hq
cd agentic-hq
```

### 4. Enable pnpm via Corepack

```bash
corepack enable
```

NOTE: Corepack auto-manages the exact pnpm version pinned in `package.json` and
so you must re-run `corepack enable` if you switch to a different Node version.

### 5. Install dependencies

```bash
pnpm install
```

> [!NOTE]
> **Keeping your clone current:** `pnpm install` is not one-off.
> `node_modules/` is local to your machine and git never touches it, so after
> a `git pull` or branch switch that changed `pnpm-lock.yaml`, re-run
> `pnpm install`. It's near-instant when nothing changed, and skipping it
> when something *did* change is a classic source of confusing failures.
> (This repo's `pnpm-workspace.yaml` sets `frozenLockfile: true`, pinning
> installs to the lockfile, so the plain command is always safe to re-run.)

### 6. Install the `agentic-hq-dev` CLI onto your `PATH`

This lets you run workflows from any directory:

```bash
npm link
```

The linked clone's binary is **`agentic-hq-dev`** (it rebuilds the framework
from source on every run); an npm install of the published package gives you
**`agentic-hq`** instead.

> [!NOTE]
> **Linux and Windows users:** `npm link` prints an *allow-scripts* warning about the project's `postinstall`. It's expected and safe to ignore — that script only marks the macOS node-pty prebuild executable, and no-ops everywhere else. (On Windows, remember a later nvm-windows version switch silently drops this link — just re-run `npm link`.)

Verify it's on your `PATH`:

```bash
agentic-hq-dev list
```

> [!NOTE]
> **If you also have the published package installed from npm**, both binaries
> are now on your `PATH`. `agentic-hq` runs the npm-installed framework and
> its shipped workflows, so edits made in your clone have **zero effect** when
> run through it — always use `agentic-hq-dev` to run your workspace code. If
> your changes ever seem to be doing nothing, see
> [Why aren't my changes having any effect?](../user-docs/troubleshooting.md#why-arent-my-changes-having-any-effect)
> in Contributor Troubleshooting.

### 7. Run unit tests and other validation

Should take less than 10 seconds:

```bash
pnpm validate
```

### 8. Run the simplest workflow (smoke test)

Run the string-reversal demo workflow — a single-step (~20 second) workflow
that just asks Claude to reverse a string and validates Claude Code is wired up
correctly:

```bash
agentic-hq-dev reversal -- --string-to-reverse="wow this is amazing"
```

NOTE: The first time you run a workflow in a folder, Claude Code asks **"Do
you trust the files in this folder?"** — choose **Yes**. Running a workflow
also auto-approves a curated set of Claude Code tools so it can run unattended
(the approval is per-run — your Claude Code settings are never modified) — see
the full list of permissions in
[WARNING-re-auto-approved-claude-permissions.md](../user-docs/WARNING-re-auto-approved-claude-permissions.md).

### 9. Trust the e2e test workspace dir (one-time, before running any e2e test)

E2e (and some integration) tests spawn real Claude Code sessions inside
throwaway workspaces under `<os.tmpdir()>/agentic-hq-test-workspaces`. Claude
Code must already trust that folder — the test sessions run under a PTY where
nobody can answer the trust prompt, so an untrusted folder makes those tests
**hang until they time out** with no visible error. Same command on every OS:

```bash
pnpm setup:trust-tmp-dir
```

It prints the folder's full path (and where that is on your OS), then opens
Claude Code inside it — select **"Yes, I trust this folder"**, then exit with
`/exit`. Once per machine per user.

After Claude exits, the script tells you how to confirm the trust took — by
running the quickest Claude-spawning e2e test (a single-step string reversal
from a workspace under that folder, ~1 min):

```bash
pnpm test:e2e:cross-workspace-string-reversal
```

If it passes, all e2e tests can run on this machine; if it hangs for minutes
and times out, the folder is still untrusted — run `pnpm setup:trust-tmp-dir` again.

If any step above fails, see
[Contributor Troubleshooting](../user-docs/troubleshooting.md#contributor-troubleshooting).

## Appendix: The Two Types Of Agentic HQ User

Agentic HQ has two kinds of user — this doc exists for the second kind:

- **Normal Users** install the published package from npm
  (`npm install -g agentic-hq`), run workflows with the **`agentic-hq`**
  command, and never clone this repo. Their setup is the main README's
  [Quick Start](../../README.md#quick-start).
- **Contributors** clone this repo and run the code in their checked-out
  working copy with the **`agentic-hq-dev`** command (installed by `npm link`
  in step 6 above), which rebuilds the framework from source on every run so
  edits take effect immediately.
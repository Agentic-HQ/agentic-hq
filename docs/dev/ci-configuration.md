# CI Configuration

Agentic HQ's Continuous Integration (CI) runs on GitHub Actions. The workflow
file is [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml); it
appears as the check named **CI / validate** on commits and pull requests.

**When it runs:** on every push to `main`, and on every pull request targeting
`main` (draft PRs included). Each push to an open PR's branch re-runs it
automatically. A typical run takes under a minute.

**Why it exists:** contributors get a visible green check on their PRs, and
anyone browsing the repo gets evidence that the project installs and tests
cleanly on a machine that isn't the maintainer's (AHQ-176).

## What CI Runs

Guiding principle: **CI follows, as closely as possible, what a real dev does
on a fresh Ubuntu machine following the README Quick Start** — minus the
Claude-dependent steps. Each CI step maps onto a numbered step of the
[README](../../README.md) Quick Start:

| README step       | CI step                 | Notes                                                                                                              |
| ----------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 2 (clone + cd)    | `actions/checkout`      | Gets the code onto the VM (runs first so `.nvmrc` exists for the next step).                                         |
| 1 (install Node)  | `actions/setup-node`    | Node version read from [`.nvmrc`](../../.nvmrc) — the same single source of truth a dev's nvm uses.                  |
| 3 (enable pnpm)   | `corepack enable`       | Installs the exact pnpm pinned in `package.json`'s `packageManager` field, verified against its embedded sha512 hash. |
| 4 (install deps)  | `pnpm install`          | Frozen install (the repo `.npmrc` sets `frozen-lockfile=true`). node-pty compiles from source on Linux (AHQ-170).     |
| 5 (CLI onto PATH) | `npm link`              | Installs the `agentic-hq` binary onto `PATH`. Its two documented Linux warnings (see README step 5) don't fail CI.    |
| 5 (verify)        | `agentic-hq list`       | The smoke test: exercises real CLI startup (Commander parsing, plugin/workflow discovery), which unit tests never do. |
| 6 (validate)      | `pnpm validate`         | The hard gate: typecheck + lint + format + unit tests.                                                               |
| 7 (run workflow)  | — not run —             | Needs real Claude Code — out of scope; a separate optional/manual e2e workflow is tracked in AHQ-177.                 |

## CI Must Pass Before Merge

A green **CI / validate** check is required before a PR is merged to `main`.
Run `pnpm validate` locally before pushing — it's the same gate and much
faster feedback than waiting for CI. See
[CONTRIBUTING.md](../../CONTRIBUTING.md) for the full PR workflow.

## What Is Deliberately Absent

- **No `apt-get install build-essential python3` step**, despite the README's
  Linux-only prerequisite for compiling node-pty. GitHub's ubuntu-24.04 runner
  image ships the full toolchain preinstalled (gcc/g++, make, Python — per the
  [`actions/runner-images`](https://github.com/actions/runner-images)
  manifest). An explicit install would either no-op or silently _upgrade_ the
  toolchain mid-run, which conflicts with the project's pinning philosophy
  (AHQ-152).
- **No Claude-dependent tests** — nothing in CI needs Claude Code, Jira, or
  any credentials (AHQ-177 covers those separately).
- **No extra logging/echo steps** — GitHub captures every step's full
  stdout/stderr automatically (see "Viewing CI Runs and Logs" below).

## CI Script Hardening

The following are the defensive 'hardening' settings in .github/workflows/ci.yml
that limit the damage a CI run can do if
something goes wrong (a compromised dependency, a hung test, a supply-chain
attack):-

- `permissions: contents: read` — the workflow's GitHub token is read-only;
  code running inside CI cannot push to or modify the repo (AHQ-152
  supply-chain posture).
- `timeout-minutes: 15` — kills hung runs (e.g. anything accidentally
  entering test watch mode) instead of burning runner minutes.
- Frozen lockfile plus pnpm's build-script blocking (only node-pty's build
  script is allow-listed, in
  [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml)) bound what dependency
  code can execute at install time.

## Viewing CI Runs and Logs

- **Per-workflow page (usually the quickest route):**
  <https://github.com/Agentic-HQ/agentic-hq/actions/workflows/ci.yml> — lists
  every CI run. Click a run → click the **validate** job → every stage with
  its tick mark, each expandable to that command's full log.
- **From a PR:** Checks tab → click the **validate** job name in the left
  sidebar → same expandable step view. Logs live-stream while a run is in
  progress. The gear icon (top right) offers "View raw logs" and a download.
- **From the command line** (handy for AI-assisted debugging):
  - `gh run list` — recent runs and their status
  - `gh run watch <run-id>` — follow a run live until it finishes
  - `gh run view <run-id> --log` — full logs of a finished run
  - `gh run view <run-id> --log-failed` — logs of the failed steps only

## Reproducing CI Locally

CI runs nothing exotic — it's the README Quick Start. On your own checkout:

```bash
corepack enable   # once per Node version
pnpm install
pnpm validate
agentic-hq list   # assuming the CLI is linked (README step 5)
```

If CI fails on a step that passes locally, the difference is almost always
"fresh machine vs your machine": a dependency your machine has but a clean
Ubuntu VM doesn't, or something not committed. The failing step's log names
the missing piece directly.

## Maintenance Notes

Single sources of truth — CI reads these rather than duplicating them:

- **Node version:** [`.nvmrc`](../../.nvmrc)
- **pnpm version:** the `packageManager` field in
  [`package.json`](../../package.json)
- **What `validate` runs:** the `validate` script in `package.json`

The only versions pinned in the workflow itself are the two official GitHub
actions (`actions/checkout`, `actions/setup-node`), pinned to major versions.
Bump them deliberately, not automatically.

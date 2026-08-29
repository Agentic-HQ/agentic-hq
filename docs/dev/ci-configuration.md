# CI Configuration

Agentic HQ's Continuous Integration (CI) runs on GitHub Actions. The workflow
file is [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml); it
appears as two checks on commits and pull requests: **CI / validate**
(Ubuntu) and **CI / validate-windows** (Windows, AHQ-211).

**When it runs:** on every push to `main`, and on every pull request targeting
`main` (draft PRs included). Each push to an open PR's branch re-runs it
automatically. A typical ubuntu run takes under a minute; the windows job
takes several minutes (slower runner, plus it also runs integration suites —
see below).

**Why it exists:** contributors get a visible green check on their PRs, and
anyone browsing the repo gets evidence that the project installs and tests
cleanly on a machine that isn't the maintainer's (AHQ-176).

## What CI Runs

Guiding principle: **CI follows, as closely as possible, what a contributor
does on a fresh Ubuntu machine following the contributor setup doc,
[`setting-up-agentic-hq-for-development.md`](setting-up-agentic-hq-for-development.md)**
— minus the Claude-dependent steps. Each CI step maps onto a numbered step of
that doc:

| Contributor setup step    | CI step                 | Notes                                                                                                              |
| ----------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 3 (clone + cd)    | `actions/checkout`      | Gets the code onto the VM (runs first so `.nvmrc` exists for the next step).                                         |
| 2 (install Node)  | `actions/setup-node`    | Node version read from [`.nvmrc`](../../.nvmrc) — the same single source of truth a dev's nvm uses.                  |
| 4 (enable pnpm)   | `corepack enable`       | Installs the exact pnpm pinned in `package.json`'s `packageManager` field, verified against its embedded sha512 hash. |
| 5 (install deps)  | `pnpm install`          | Frozen install (the repo `pnpm-workspace.yaml` sets `frozenLockfile: true`; pnpm also forces it on when `CI=true`). node-pty compiles from source on Linux (AHQ-170).     |
| 6 (CLI onto PATH) | `npm link`              | Installs the `agentic-hq-dev` binary onto `PATH`. Its documented allow-scripts warning (see contributor setup step 6) doesn't fail CI. |
| 6 (verify)        | `agentic-hq-dev list`   | The smoke test: exercises real CLI startup (Commander parsing, plugin/workflow discovery), which unit tests never do. |
| 7 (validate)      | `pnpm validate`         | The hard gate: typecheck + lint + format + unit tests.                                                               |
| 8 (run workflow)  | — not run —             | Needs real Claude Code — out of scope; a separate optional/manual e2e workflow is tracked in AHQ-177.                 |

## The Windows Job (`validate-windows`, AHQ-211)

The same contributor steps run a second time on a `windows-latest` runner —
same `.nvmrc` Node version, same commands — so the Windows support claim is
continuously tested, not a one-time port. On Windows the steps exercise
genuinely different machinery: `npm link` writes `.cmd` shims instead of a
symlinked executable, `agentic-hq-dev list` resolves the shim, and node-pty
uses its prebuilt ConPTY binaries (so no compiler toolchain is needed —
deliberately no Windows equivalent of the Linux toolchain note). There is
also deliberately no `Set-ExecutionPolicy` step: the `.ps1`-shim blocking
that hits users is client Windows' `Restricted` default, and windows-latest
runners are Windows **Server**, which defaults to `RemoteSigned` — the
`npm link` step echoes exactly this into the run log so readers of a green
run know it doesn't prove the client-defaults experience (that's covered by
the README's recommended one-time `Set-ExecutionPolicy RemoteSigned
-Scope CurrentUser` step, validated manually on a clean client machine).
Considered and declined (2026-08-29): simulating `Restricted` in CI
(process-scoped it no-ops across steps, and persisted it blocks the
runner's own generated step scripts), and a `windows-11-arm` job (the only
client-Windows hosted image — real Windows 11 Desktop, arm64, free on
public repos; declined for now to keep CI simple — no x64 client image
exists at all).

After `pnpm validate`, the Windows job additionally runs the four non-Claude
integration suites that guard the surfaces Windows support actually changed:

| Step | What it guards |
| ---- | -------------- |
| `test:integration:build-determinism` | The release build stages byte-identically (runs the full build twice and compares hashes — POSIX-normalised paths, no CRLF drift). |
| `test:integration:publish-guards`    | The publish guards, **including the win32-only test that packing is refused on Windows** (publishing is Mac-now/CI-later, never Windows). |
| `test:integration:bin-wrapper`       | The bin wrapper supplies the package root explicitly. |
| `test:integration:kill-script`       | The cross-platform self-termination kill script (Phase 5). |

Each suite is its **own step**, deliberately: the runner's default `pwsh`
shell only propagates the LAST command's exit code out of a multi-line `run:`
block, so one combined step would mask mid-block failures. The job's
`timeout-minutes: 45` (vs ubuntu's 15) covers the slower runner (Defender
real-time scanning) plus build-determinism's double release build.

## CI Must Pass Before Merge

Green **CI / validate** and **CI / validate-windows** checks are required
before a PR is merged to `main`.
Run `pnpm validate` locally before pushing — it's the same gate and much
faster feedback than waiting for CI. See
[CONTRIBUTING.md](../../CONTRIBUTING.md) for the full PR workflow.

## What Is Deliberately Absent

- **No `apt-get install build-essential python3` step**, despite the contributor setup
  doc's Linux-only prerequisite for compiling node-pty. GitHub's ubuntu-24.04 runner
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
- `timeout-minutes: 15` (ubuntu) / `45` (windows) — kills hung runs (e.g.
  anything accidentally entering test watch mode) instead of burning runner
  minutes.
- Frozen lockfile plus pnpm's build-script blocking (only node-pty's build
  script is allow-listed, in
  [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml)) bound what dependency
  code can execute at install time.

## Viewing CI Runs and Logs

- **Per-workflow page (usually the quickest route):**
  <https://github.com/Agentic-HQ/agentic-hq/actions/workflows/ci.yml> — lists
  every CI run. Click a run → click the **validate** or **validate-windows**
  job → every stage with its tick mark, each expandable to that command's
  full log.
- **From a PR:** Checks tab → click the job name (**validate** /
  **validate-windows**) in the left sidebar → same expandable step view.
  Logs live-stream while a run is in progress. The gear icon (top right)
  offers "View raw logs" and a download.
- **From the command line** (handy for AI-assisted debugging):
  - `gh run list` — recent runs and their status
  - `gh run watch <run-id>` — follow a run live until it finishes
  - `gh run view <run-id> --log` — full logs of a finished run
  - `gh run view <run-id> --log-failed` — logs of the failed steps only

## Reproducing CI Locally

CI runs nothing exotic — it's the contributor setup from
[`setting-up-agentic-hq-for-development.md`](setting-up-agentic-hq-for-development.md).
On your own checkout:

```bash
corepack enable       # once per Node version
pnpm install
pnpm validate
agentic-hq-dev list   # assuming the CLI is linked (contributor setup step 6)
```

The same commands work verbatim in Windows PowerShell (if it blocks `pnpm`,
see the execution-policy note in the contributor setup doc's Windows
prerequisites). To reproduce the windows job's extra
integration steps:

```powershell
pnpm test:integration:build-determinism
pnpm test:integration:publish-guards
pnpm test:integration:bin-wrapper
pnpm test:integration:kill-script
```

If CI fails on a step that passes locally, the difference is almost always
"fresh machine vs your machine": a dependency your machine has but a clean
VM doesn't, or something not committed. The failing step's log names
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

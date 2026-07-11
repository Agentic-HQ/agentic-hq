# AHQ-176 — Fable Notes: Minimal CI (Without Real Claude Code)

Author: Claude Code (Fable 5), 2026-07-11.

## 1. Intro

[AHQ-176](https://agentic-hq.atlassian.net/browse/AHQ-176) asks for a minimal
launch CI, originating from the AHQ-160 Codex report finding #5 ("There is no
visible CI"). The repo had issue/PR templates but no `.github/workflows/*`, so
there was no public evidence that the project works anywhere other than the
maintainer's machine.

**What was done:** a single new file, [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml).

**Guiding principle (agreed with Steve, 2026-07-11):** CI follows, as closely
as possible, what a real dev does on a fresh Ubuntu machine following the
README Quick Start — minus the Claude-dependent steps. The job's steps map
one-to-one onto the README's numbered steps, in the README's order: get Node
(from `.nvmrc`), get the code, `corepack enable`, `pnpm install`, `npm link` +
`agentic-hq list` (the smoke test), `pnpm validate`. README step 7 (the
reversal workflow) needs real Claude and stays out of scope (AHQ-177).

This supersedes the ticket's original smoke-test suggestion
(`node bin/agentic-hq.cjs list`), which exercised the CLI code but bypassed
the README's `npm link` install step — see §4.

**Current status (2026-07-11):** reviewed, WIP-committed (`4b0bb89`) and
pushed on `feature/ahq-176-minimal-ci`; draft PR
[#1](https://github.com/Agentic-HQ/agentic-hq/pull/1) opened to trigger CI;
the **first run was green on the first attempt** (41 seconds — see §7).
The follow-up documentation work (§9) was completed 2026-07-11 and rides in
the same PR. Remaining: Steve re-titles and squash-merges the PR (`git:03`).

## 2. CI Primer (for someone new to CI)

CI (Continuous Integration) here means **GitHub Actions**, GitHub's built-in
automation service. The core idea:

- GitHub watches the `.github/workflows/` folder of the repo. Each `.yml` file
  in there is a **workflow** — a recipe of shell commands plus the events that
  trigger it.
- When a trigger fires (for this workflow: a push to `main`, or a pull request
  targeting `main`), GitHub spins up a **fresh, empty Ubuntu virtual machine in
  its cloud** and runs the workflow's steps top to bottom.
- If every step exits successfully, the commit/PR gets a **green tick ✓**. If
  any step fails, it gets a **red X** with full logs showing exactly which step
  broke and why.

That green tick is the point of the ticket: contributors see their PR pass
checks, and anyone browsing the repo sees evidence the project installs and
tests cleanly on a machine that isn't the maintainer's.

Key properties worth knowing:

- **The VM is throwaway.** Nothing a CI run does can affect the repo or any
  real machine. A failed run costs nothing — you fix the problem, push again,
  and a fresh run starts.
- **Every run starts from zero.** No Node, no pnpm, no `node_modules` — which
  is exactly why it proves the install instructions actually work.
- **Cost:** free for public repos; private repos get 2,000 free minutes/month.
  This workflow should take roughly 2–4 minutes per run.

## 3. What the Workflow Does, Step by Step

File: [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml)

Each CI step maps onto a numbered step of the README Quick Start:

| README step          | CI step                 | What it does                                                                                                                                                           |
| -------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2 (clone + cd)       | `actions/checkout@v7`   | Downloads the repo's code onto the VM.                                                                                                                                   |
| 1 (install Node)     | `actions/setup-node@v6` | Installs Node — version read from `.nvmrc` (currently 24.15.0), the same single source of truth a real dev's nvm uses.                                                   |
| 3 (enable pnpm)      | `corepack enable`       | Activates Corepack, which reads the `packageManager` field in `package.json` and installs that **exact** pnpm version, verified against its embedded sha512 hash.        |
| 4 (install deps)     | `pnpm install`          | The repo's `.npmrc` (`frozen-lockfile=true`) forces an exact `pnpm-lock.yaml` install. node-pty compiles from source on Linux (AHQ-170).                                 |
| 5 (CLI onto PATH)    | `npm link`              | Installs the `agentic-hq` binary onto `PATH` — the exact path where Linux issues surfaced before (AHQ-169, AHQ-172). Its two documented Linux warnings don't fail CI.    |
| 5 (verify)           | `agentic-hq list`       | The smoke test. Exercises real CLI startup (Commander parsing, plugin/workflow discovery) — things unit tests never touch, per the 2026-03-14 `passThroughOptions` lesson. |
| 6 (validate)         | `pnpm validate`         | The existing hard gate: typecheck + lint + format + unit tests.                                                                                                          |
| 7 (run workflow)     | —                       | OUT OF SCOPE: needs real Claude Code (AHQ-177).                                                                                                                          |

(Steps 1 and 2 run in swapped order in CI — checkout must come first so
`.nvmrc` exists for setup-node to read.)

Hardening in the workflow (aligned with the repo's AHQ-152 supply-chain
posture):

- `permissions: contents: read` — the workflow's GitHub token is read-only; a
  compromised dependency running inside CI couldn't push code or modify the
  repo.
- `timeout-minutes: 15` — guard against hangs (e.g. anything accidentally
  entering watch mode); GitHub kills the run instead of burning minutes.

## 4. Design Decisions (and What Was Deliberately Left Out)

Decisions made:

- **Mirror the README Quick Start, in its order** (agreed 2026-07-11) — CI
  should follow as closely as possible what a real dev does on a fresh Ubuntu
  machine following our instructions. This changed the smoke test from the
  ticket's original `node bin/agentic-hq.cjs list` (which bypasses `npm link`)
  to the README's own step 5: `npm link` then `agentic-hq list`. The steps
  also run in README order (link + smoke test before `pnpm validate`).
- **No `apt-get install build-essential python3` step**, despite the README's
  Linux prerequisite — the toolchain is preinstalled on the runner image
  (verified, see §5), and on a provisioned image the command would either
  no-op or silently *upgrade* the toolchain mid-run, which conflicts with the
  project's pinning philosophy (AHQ-152).
- **Corepack rather than a pnpm setup action** — the ticket explicitly asked
  for Corepack, and it reuses the existing `packageManager` pin (version +
  integrity hash) with no new third-party action.
- **Node version from `.nvmrc`** via `node-version-file` — no duplicated
  version number to drift.
- **Plain `pnpm install`** — no `--frozen-lockfile` flag needed because
  `.npmrc` already enforces it repo-wide.
- **Action versions verified, not remembered** — `checkout@v7` and
  `setup-node@v6` confirmed as the current majors via the GitHub API on
  2026-07-11.

Deliberately NOT bundled in (each would be a separate, explicitly-approved
change — none are in the ticket):

- **Node 22/24 matrix** — `engines` claims both LTS lines but CI currently only
  proves Node 24.
- **SHA-pinning the actions** — `@v7`/`@v6` are moving tags; pinning to full
  commit SHAs would match the repo's supply-chain posture at the cost of manual
  bumps.
- **`workflow_dispatch` trigger** — would allow manual runs from the Actions
  tab.
- **pnpm store caching** — faster runs, more workflow complexity.

## 5. Testing Details (What Was and Wasn't Verified)

A workflow file is essentially a list of shell commands plus GitHub glue. The
commands were all verified locally on 2026-07-11:

- **`pnpm validate`** — ran fully green: typecheck, lint, format, then 146 unit
  tests across 32 files.
- **`agentic-hq list`** — ran successfully (exit 0), listing all plugins and
  workflows. (Via Steve's existing pnpm-managed link at `~/Library/pnpm/bin` —
  see the `npm link` caveat below. The ticket's original suggestion,
  `node bin/agentic-hq.cjs list`, was also run successfully.)
- **YAML validity + formatting** — `prettier --check` passes on the file.
  Prettier parses the YAML to check it, so this also confirms the syntax is
  valid (relevant because `pnpm format:check` covers this file from now on).
- **Action majors** — `gh api repos/actions/checkout/releases/latest` →
  `v7.0.0`; same for setup-node → `v6.4.0`.

What could NOT be verified locally:

- **The workflow actually executing.** GitHub Actions only runs in GitHub's
  cloud after a push — there is no local runner. (A third-party simulator
  called `act` exists but wasn't installed, and it's imperfect anyway.)
- **`npm link`.** Deliberately not run locally: Steve's machine already has an
  agentic-hq link managed by **pnpm** (`~/Library/pnpm/bin/agentic-hq`), and
  running `npm link` would create a second, npm-managed global link alongside
  it. It gets its first exercise in CI's throwaway VM — which is exactly where
  we want it tested, since a fresh machine is what the README describes.
- **The Linux-specific install path.** Local verification was on macOS, where
  node-pty uses a prebuilt binary. On the Ubuntu VM it compiles from source
  (no linux-x64 prebuild — AHQ-170). The README's Linux prerequisite for this
  (`build-essential` + `python3`) is already satisfied on the CI VM — verified
  against GitHub's official runner-image manifest for ubuntu-24.04
  (`actions/runner-images` repo): gcc/g++ 13.2, make 4.3 and Python 3.12.3 are
  preinstalled, so the workflow needs no `apt-get install` step. AHQ-170's
  Ubuntu testing already exercised the compile itself, but CI's first run is
  the first proof inside GitHub Actions.

So: **the first push is the real end-to-end test.**

## 6. Instructions for Steve to Test

Current state: the changes sit uncommitted on the `feature/ahq-176-minimal-ci`
branch.

### 6.1 How the triggers interact with the branch

- A WIP commit pushed to the branch **alone does NOT trigger CI** — nothing
  happens. The triggers are push-to-`main` and PRs-targeting-`main`.
- Opening a PR from the branch to `main` (a **draft** PR counts) triggers CI
  immediately, and re-runs it on every later push to the branch. For
  `pull_request` events GitHub uses the workflow file **from the PR branch**,
  so this works even though `main` has no workflow file yet.
- The squash-merge landing on `main` triggers one final run — `main`'s first
  green ✓.

### 6.2 Claude can watch runs and read failure logs

No extra access needs setting up: the repo's `gh` CLI is authenticated
(account `halso`) with the `repo` scope, which covers reading Actions runs and
logs (verified 2026-07-11 — `gh run list` works):

- `gh run list` — runs and their pass/fail status
- `gh run watch <id>` — follow a run live until it finishes
- `gh run view <id> --log-failed` — logs of just the failed steps

The token also has the `workflow` scope, which GitHub requires before it will
accept a push that adds or modifies workflow files — so the push won't be
rejected on those grounds.

### 6.3 Suggested test sequence

1. **Steve:** review `.github/workflows/ci.yml` (~55 lines, heavily
   commented), then WIP-commit and push the branch (the `git:02` skill —
   Claude doesn't commit, per repo rules).
2. **Claude:** open a **draft** PR to `main` via `gh pr create --draft`.
   Draft rather than the `git:03` skill, because that skill also
   squash-merges — for testing we only want to trigger CI, not merge.
3. **Claude:** `gh run watch` the run and report back — either the green
   tick, or the failing step's logs plus a proposed fix.
4. **Iterate** — fix → WIP commit → push → CI re-runs on the PR
   automatically — until green.
5. **Steve:** take over for the real PR title and merge when happy (`git:03`
   skill). The squash-merge triggers the final run on `main`.

### 6.4 What success/failure looks like

- **Watching manually:** repo on GitHub → **Actions** tab → a "CI" run
  appears within seconds of the PR opening. Click it → click the **validate**
  job → each step's live logs are expandable.
- **Success:** every step gets a green tick; the PR shows a "CI / validate" ✓
  near the merge button.
- **Failure:** a red X on the failing step; click it to read the log. Fix
  locally, push again — a fresh run starts automatically. Failed runs have no
  side effects; iterating is free.
- **Most likely first-run failure points:** (a) the `pnpm install` step,
  because node-pty compiles from source on Linux — unlikely, since the
  toolchain the README requires is preinstalled on the runner (verified, see
  §5); and (b) the `npm link` step — Linux quirks have appeared there before
  (AHQ-169, AHQ-172), and it's the one command not exercised locally. Either
  way, the failed-step log will name the missing tool or error directly.

## 7. First Run Results and Where the CI Logs Live (2026-07-11)

### 7.1 First run: green on the first attempt

- Draft PR [#1](https://github.com/Agentic-HQ/agentic-hq/pull/1) (created with
  `gh pr create --draft`) triggered run
  [29162968525](https://github.com/Agentic-HQ/agentic-hq/actions/runs/29162968525).
- **Every step passed; the whole `validate` job took 41 seconds** — including
  the node-pty source compile (the preinstalled toolchain did its job) and
  `npm link` (the historically risky step — clean).
- Observed in the logs: `npm link` printed the README-documented
  `npm warn Unknown project config "frozen-lockfile"` warning (harmless, as
  documented); `pnpm validate` ran 32 test files / 146 unit tests, all green —
  the suite's first pass on Linux CI.

### 7.2 Where the logs live (nothing extra needed in the workflow)

GitHub auto-captures the **full stdout/stderr of every step** — no
`echo`/logging steps need adding to the workflow. The PR's `/checks` tab only
shows a summary panel, which is easy to mistake for "no logs". To reach them:

- **UI route:** PR → Checks tab → click the **`validate` job name in the left
  sidebar** → each step is an expandable row containing that command's full
  log (live-streaming while a run is in progress). The gear icon (top right)
  offers "View raw logs" and a download.
- **Direct URLs:** run page
  `https://github.com/Agentic-HQ/agentic-hq/actions/runs/<run-id>`; the
  Actions tab lists all runs.
- **Per-workflow page (Steve's preferred route):**
  <https://github.com/Agentic-HQ/agentic-hq/actions/workflows/ci.yml> — lists
  only CI runs. Click a run → click the **validate** job → all stages with
  tick marks, each expandable to its full log.
- **CLI route (what Claude uses):** `gh run list` (runs + status),
  `gh run watch <id>` (follow live), `gh run view <id> --log` (full logs),
  `gh run view <id> --log-failed` (failed steps only).

Deliberately NOT added: a "show versions" / extra-output step (`node -v`,
`pnpm -v`, etc.). The logs already show every command and its complete
output; add such a step later only if a real debugging need appears.

## 8. Relationship to Other Tickets

- **AHQ-160** — the Codex report that spawned this ticket (finding #5).
- **AHQ-170** — node-pty supply-chain decision; why its build script is the
  only one allow-listed and why Linux compiles from source.
- **AHQ-152** — supply-chain posture (frozen lockfile, blocked build scripts,
  minimumReleaseAge) that the workflow's read-only permissions follow.
- **AHQ-177** — OUT OF SCOPE here: the separate optional/manual workflow for
  slow e2e tests needing real Claude/Jira credentials.

## 9. Follow-Up Work (Completed 2026-07-11)

All items below were completed on 2026-07-11, on the same branch as the
workflow:

1. Create `docs/dev/ci-configuration.md` — maintained developer doc for the CI
   (this file is a working note, not the maintained doc). MUST include a
   "Viewing CI runs and logs" section covering the material in §7.2: full
   per-step logs are auto-captured; UI navigation from a PR's Checks tab
   (click the `validate` job in the left sidebar, expand steps); direct
   Actions URLs; and the `gh run list` / `watch` / `view --log` /
   `--log-failed` CLI routes.
2. `CONTRIBUTING.md` — add a CI section linking to that doc; state that CI must
   pass on PRs before merge; fix the now-stale line "There is no CI running
   this automatically yet."
3. `ci.yml` — add a header-comment link to the new doc.
4. `.github/pull_request_template.md` — reference CI in the checklist.
5. `docs/README.md` — index the new doc under Developer Documentation.
6. Verify everything with `pnpm format:check`.

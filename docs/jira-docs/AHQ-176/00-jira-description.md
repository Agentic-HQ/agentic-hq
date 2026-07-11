# Title

Add Minimal CI (Continuous Integration) Tests (Without Real Claude Code)

# Description

From:

docs/jira-docs/AHQ-160/01-task-tracking-doc-copy-of-01-codex-report-on-what-im-doing-wrong-etc.md

## 5. There is no visible CI

There are issue templates and a PR template, but no `.github/workflows/*`.

Local `pnpm validate` passing is good. Public launch without CI is not good. Contributors need a visible green check. Users browsing the repo need evidence that the project is not just locally working on your machine.

## Minimum Launch CI (updated 2026-07-11)

**Principle: CI follows, as closely as possible, what a real dev does on a fresh Ubuntu machine following the README Quick Start — minus the Claude-dependent steps.** Each CI step maps onto a README Quick Start step, in the README's order:

- Install Node from `.nvmrc` (README step 1 — `actions/setup-node` is CI's nvm equivalent)
- Check out the repo (README step 2)
- `corepack enable` — installs the exact pnpm pinned in `packageManager`, verified against its embedded sha512 hash (README step 3)
- `pnpm install` — frozen lockfile via the repo `.npmrc`; node-pty compiles from source on Linux, [AHQ-170](https://agentic-hq.atlassian.net/browse/AHQ-170) (README step 4)
- `npm link` then `agentic-hq list` — **this is the non-Claude smoke test**; `npm link` is the exact path where Linux issues surfaced before ([AHQ-169](https://agentic-hq.atlassian.net/browse/AHQ-169), [AHQ-172](https://agentic-hq.atlassian.net/browse/AHQ-172)), and its two documented Linux warnings are harmless and do not fail the step (README step 5)
- `pnpm validate` — typecheck + lint + format + unit tests (README step 6)

README step 7 (the reversal demo workflow) needs real Claude Code → out of scope, see below.

Update 2026-07-11: this list supersedes the original smoke-test suggestion (`node bin/agentic-hq.cjs list`), which exercised the CLI code but bypassed the README's `npm link` install step.

## Note — Linux Toolchain Prerequisite (added 2026-07-11)

The README (since AHQ-172) lists a Linux-only prerequisite: a C/C++ build toolchain (`build-essential` + `python3`) for compiling node-pty from source during `pnpm install`. CI needs **no** `apt-get` step for this: GitHub's ubuntu-24.04 runner image ships gcc/g++ 13.2, make 4.3 and Python 3.12.3 preinstalled (verified against the `actions/runner-images` manifest, 2026-07-11). An explicit `apt-get install` was deliberately not added — on an already-provisioned image it would either no-op or silently upgrade the toolchain mid-run, which conflicts with the project's pinning philosophy ([AHQ-152](https://agentic-hq.atlassian.net/browse/AHQ-152)).

## Hardening

- `permissions: contents: read` — the workflow's GitHub token is read-only (AHQ-152 supply-chain posture)
- `timeout-minutes: 15` — guard against hangs (e.g. anything accidentally entering watch mode)

## Documentation (added 2026-07-11)

Once the workflow is proven green, document the CI properly:

- **`docs/dev/ci-configuration.md`** — new maintained developer doc: what CI runs and why (each step mapped to its README Quick Start step), the security posture (read-only token, timeout, node-pty Linux source-compile), what's out of scope (AHQ-177), and how to reproduce CI locally.
- **`CONTRIBUTING.md`** — new CI section linking to that doc; state that CI must pass on PRs before merge; fix the now-stale line "There is no CI running this automatically yet."
- **`.github/workflows/ci.yml`** — header comment links to the new doc.
- **`.github/pull_request_template.md`** — reference CI passing in the checklist.
- **`docs/README.md`** — index the new doc under Developer Documentation.

## Working Notes

Full design decisions, testing details, and test instructions: `docs/jira-docs/AHQ-176/01-fable-notes.md` (on the `feature/ahq-176-minimal-ci` branch).

## Out Of Scope — Tests That Run Using Real Claude Code

- A separate optional/manual workflow for slow e2e tests that need Claude/Jira credentials. This will be worked on "Later" in [AHQ-177](https://agentic-hq.atlassian.net/browse/AHQ-177)

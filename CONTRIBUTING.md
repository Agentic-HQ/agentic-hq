# Contributing to Agentic HQ

Author: Claude Code, with human assistance.  Based on a selection of existing Open Source project CONTRIBUTING.md files.

Welcome, and thank you for your interest in Agentic HQ. This is a small, opinionated project built collaboratively with [Claude Code](https://www.anthropic.com/claude-code), and we're glad to have you here.

**tl;dr.** Agentic HQ welcomes human and AI-assisted contributions. Create issues on GitHub. Include tests. Run `pnpm validate` before submission. CI must pass on your PR. Human oversight and understanding of AI generated submissions is required.

This document describes:
- The One Rule (Human understanding of PRs)
- Project Status
- Ways You Contribute
- How to report issues and propose new features
- How to set up your local environment
- Continuous Integration (CI must pass before merge)
- How PRs are reviewed.

## The One Rule

**You (the human) must understand your code.** If you cannot explain what your change does and why, your PR will not be merged.

AI-assisted contributions are welcome, but the human submitting the PR is expected to understand the code being submitted, anticipate the consequences, and defend the design choices in review.

## Project status & maintainer bandwidth

Agentic HQ is **pre-1.0** (currently v0.2.0). Expect rough edges, evolving APIs, and the occasional rename.

It runs on **macOS 13.5 or newer** (developed and tested on 15.7.5) and **Linux** (tested on Ubuntu 24.04 LTS). Windows is unsupported — the tested route for Windows users is free VMware + Ubuntu 24.04 LTS; WSL is untested but may work. Platform-expansion contributions (native Windows / WSL) are explicitly invited — see "Ways to contribute" below.

It is **maintained by one person** right now, so please calibrate expectations:

- Response times are in **days, not hours**.
- High-signal bug reports and well-scoped PRs will be reviewed first.
- Incomplete or low-effort reports may be closed, or left untriaged until additional detail is provided.

If your contribution lands well, we'll do our best to respond promptly. If you're proposing something large, talk to us first via an issue so you don't invest a week on something we'd ultimately decline.  The [Agentic HQ Discord Server](https://discord.gg/fnR7SJt2d7) is the best place for you to propose and discuss your new feature and get an idea of whether it's worth investing the time in.

## Ways to contribute

Ways you can contribute (ordered by how likely they are to get merged/considered quickly):-

- **Report bugs** with clear reproduction steps (see "Reporting issues" below).
- **Improve documentation** — typo fixes, clearer explanations, missing setup steps. Doc-only PRs are likely to be merged quickly.
- **Behaviour-preserving refactors** that genuinely improve readability or remove duplication.
- **Fix bugs** with a regression test that fails before your fix and passes after.
- **Propose features** — open an issue first to scope it out before writing code (see "Proposing changes").
- **Platform expansion** — native Windows support and WSL fixes. Particularly valuable; coordinate via an issue first to avoid duplicate work.
- **Share what you built with AHQ** — pop into the [Agentic HQ Discord Server](https://discord.gg/fnR7SJt2d7) and tell us. Real-world use shapes the roadmap.

## Reporting issues

For **bugs**, use [GitHub Issues](https://github.com/Agentic-HQ/agentic-hq/issues/new/choose) with the bug-report template. The template asks for steps to reproduce, expected vs. actual behaviour, and your environment (OS and version — e.g. macOS or Ubuntu — plus Node / pnpm versions). Issues without reproduction steps are hard to action and may be closed with a request for more detail.

For **feature ideas**, use the feature-request template. Describe the problem you're trying to solve before proposing a solution — it helps us discuss alternatives.

For **questions, ideas, or community chat**, please use the [Agentic HQ Discord Server](https://discord.gg/fnR7SJt2d7) rather than filing an issue. Discussion-style threads belong there.

For **security vulnerabilities**, do **not** file a public issue. See [`SECURITY.md`](./SECURITY.md) for private reporting channels.

## Proposing changes

- **Small bug-fix PRs** — go ahead and open one directly. Reference the issue you're fixing (or just describe the bug if there isn't one yet). Must include test that fails before the fix and passes after it.
- **Larger features** — please **open an issue first** to discuss the scope and approach. Surprise PRs that overhaul a subsystem are unlikely to be merged, regardless of code quality.

You do not need to ask for permission to work on an existing open issue. If you'd like to claim it, leave a comment so others know.

## Local development setup

Agentic HQ has two kinds of user: **Normal Users**, who install the published `agentic-hq` package from npm and never clone this repo (their setup is the [`README.md`](./README.md) Quick Start), and **Contributors**, who clone this repo and run their working copy via the `agentic-hq-dev` command.

The full Contributor setup — prerequisites, clone, Corepack/pnpm, `npm link`, validation, and a smoke test — is in [`docs/dev/setting-up-agentic-hq-for-development.md`](./docs/dev/setting-up-agentic-hq-for-development.md).

If anything in that setup fails, see [Contributor Troubleshooting](./docs/user-docs/troubleshooting.md#contributor-troubleshooting).

## Tests and `pnpm validate`

Before opening a PR, run:

```bash
pnpm validate
```

This is a **hard gate**. It runs, in sequence:

1. `pnpm typecheck` — TypeScript type checking (`tsc --noEmit`)
2. `pnpm lint:check` — ESLint
3. `pnpm format:check` — Prettier formatting
4. `pnpm test:unit` — Vitest unit tests

All four must pass. If your PR doesn't pass `pnpm validate` locally, it will not pass review.

CI runs this same gate automatically on your PR (see "Continuous Integration (CI)" below) — but please still run it locally before pushing: it's much faster feedback than CI, and it keeps review focused on your change rather than a broken build.

If `pnpm validate` fails on `format:check`, please run `pnpm format:check` to confirm only your in-progress files would be reformatted, then run `pnpm format:fix` to fix those files. Mixing unrelated whole-repo formatting into a code PR makes the diff impossible to review, and so it will be rejected.

## Continuous Integration (CI)

Every PR targeting `main` (and every push to `main`) automatically runs the CI workflow on a fresh Ubuntu VM via GitHub Actions. It follows the same steps a new contributor follows in [`docs/dev/setting-up-agentic-hq-for-development.md`](./docs/dev/setting-up-agentic-hq-for-development.md) — pinned pnpm via Corepack, frozen `pnpm install`, `npm link`, an `agentic-hq-dev list` smoke test, and `pnpm validate` — everything except the Claude-dependent steps.

**A green "CI / validate" check is required before a PR is merged.** If CI fails, open the failing step's log from the PR's Checks tab (click the `validate` job in the left sidebar, then expand the red step), fix, and push again — CI re-runs automatically on every push to the PR branch.

Full details — exactly what CI runs and why, what's deliberately absent, the security posture, and how to view run logs — are in [`docs/dev/ci-configuration.md`](./docs/dev/ci-configuration.md).

## TDD

This project follows **strict Test-Driven Development** for behavioural changes: write a failing test first, watch it fail for the right reason, write the minimal code to make it pass, then refactor (NOTE: The project [`CLAUDE.md`](./CLAUDE.md) enforces this Red-Green-Refactor cycle)

In practical terms for contributors:

- **Behavioural changes** (anything that alters observable program behaviour) must be driven by tests. PRs that add behaviour without meaningful test coverage will not be merged. Regression tests that show the change didn't break any functionality related to the change are also welcome.
- **Pure refactors** (behaviour unchanged) and **documentation-only changes** are exempt — the existing test suite is enough to confirm you didn't break anything.
- **Bug fixes** must include a test that demonstrates the bug before the fix.  Additional regression tests that show the fix didn't break any functionality related to the code changes are also welcome.

Please avoid submitting unnecessary tests.   The RED stage in TDD involves writing a single test that must fail, and GREEN involves writing only enough code (no more) to make that test pass.  This keeps tests to the absolute minimum and code to the absolute minimum.  It prevents AI from being overly verbose.  A PR can (of course) contain multiple tests that cover all the functionality added for that PR (one RED->GREEN->REFACTOR cycle at a time).

Reviewer judgement decides whether test coverage is appropriate and meaningful.

## Submitting a PR

1. **Fork** the repo, create a branch, push your changes.
2. **PR title** — use [Conventional Commits](https://www.conventionalcommits.org/) format: `fix:`, `feat:`, `docs:`, `refactor:`, `test:`, `chore:`. The PR title becomes the squashed commit message on `main`. Include the GitHub issue number followed by the issue summary e.g. "refactor: #123 Move Claude-specific wiring into DefaultClaudeCodeTool"
3. **Fill in the PR template checkboxes** honestly — including the AI-assistance disclosure. We don't penalise AI use; we do penalise opaque AI use.
4. **Wait for CI to go green.** The CI workflow runs automatically when you open the PR; a green check is required before merge (see "Continuous Integration (CI)" above).
5. **Be ready to discuss.** Reviewers will ask questions. If you can't answer them, that's the One Rule biting — please slow down, understand the code, and respond.

PRs are merged via **squash and merge**, so commit history inside the PR is flattened. Don't worry about producing a clean commit history during development.

External contributors do not need to use the internal Agentic HQ `/agentic-hq-commands:commit` Claude Code skill, but can if they want to.

## AI-assisted contributions

This project was built collaboratively with Claude Code. Contributions where AI did some or all of the typing are welcome, on three conditions:

1. **You (the human) understand the code.**
2. **You disclose meaningful AI assistance** in the PR description. By "meaningful" we mean Claude/Copilot/Cursor/etc. shaped the design or wrote substantial code — not routine autocomplete or formatting suggestions. There's no penalty for disclosure; there is for hiding it.
3. **You've actually run and manually tested the code.** This catches the dominant failure mode of AI contributions, which is plausible-looking diffs that don't actually work.

**If you built your contribution using an Agentic HQ workflow** — please mention it. We'd love to understand whether the project is being used on itself ("dogfooding").

## Code of Conduct

Participation in this project is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md) (Contributor Covenant v3.0). By contributing, you agree to abide by it.

## License

Agentic HQ is licensed under the [MIT License](./LICENSE). By submitting a contribution you agree that your code is provided under the same licence.

## GitHub Issues Vs Jira

Pre-launch this project was developed using Jira as the issue tracking system and there are still many outstanding Tasks/Features logged in Jira.  The Jira server is currently private but an application has been made to make it public as an Open Source project.  

In the first phase of this project contributors will be asked to raise bugs on GitHub because AI can do that easily and automatically using the `gh` command line tool. As the project matures we will decide whether to continue using both GitHub and Jira, or to align on only one issue tracking system.

## FAQ

**Why must I disclose AI use?** Because the project's *subject matter* is AI-assisted development. We owe contributors and users honesty about how the code was built — and we want to see real-world patterns of AI-assisted contribution.

**Which platforms are tested?** macOS (15.7.5) - that's where the maintainer develops. Installs and runs on Linux (Ubuntu 24.04 LTS). Windows is unsupported; the tested route for Windows users is VMware + Ubuntu 24.04 LTS, and WSL/Windows contributions and bug reports are explicitly welcome (see "Ways to contribute").
# Contributing to Agentic HQ

Author: Claude Code, with human assistance.  Based on a selection of existing Open Source project CONTRIBUTING.md files.

Welcome, and thank you for your interest in Agentic HQ. This is a small, opinionated project built collaboratively with [Claude Code](https://www.anthropic.com/claude-code), and we're glad to have you here.

**tl;dr.** Agentic HQ welcomes human and AI-assisted contributions. Create issues on GitHub. Include tests. Run `pnpm validate` before submission. Human oversight and understanding of AI generated submissions is required.

This document describes:
- The One Rule (Human understanding of PRs)
- Project Status
- Ways You Contribute
- How to report issues and propose new features
- How to set up your local environment
- How PRs are reviewed.

## The One Rule

**You (the human) must understand your code.** If you cannot explain what your change does and why, your PR will not be merged.

AI-assisted contributions are welcome, but the human submitting the PR is expected to understand the code being submitted, anticipate the consequences, and defend the design choices in review.

## Project status & maintainer bandwidth

Agentic HQ is **pre-1.0** (currently v0.1.0). Expect rough edges, evolving APIs, and the occasional rename.

It is **tested on macOS only** at the moment. Linux is likely to work with minimal changes; Windows is best-effort via WSL. Platform-expansion contributions are explicitly invited — see "Ways to contribute" below.

It is **maintained by one person** right now, so please calibrate expectations:

- Response times are in **days, not hours**.
- High-signal bug reports and well-scoped PRs will be reviewed first.
- Incomplete or low-effort reports may be closed, or left untriaged until additional detail is provided.

If your contribution lands well, we'll do our best to respond promptly. If you're proposing something large, talk to us first via an issue so you don't invest a week on something we'd ultimately decline.  Once Discord is up and running (at project launch) that will be the best place for you to propose and discuss your new feature and get an idea of whether it's worth investing the time in.

## Ways to contribute

Ways you can contribute (ordered by how likely they are to get merged/considered quickly):-

- **Report bugs** with clear reproduction steps (see "Reporting issues" below).
- **Improve documentation** — typo fixes, clearer explanations, missing setup steps. Doc-only PRs are likely to be merged quickly.
- **Behaviour-preserving refactors** that genuinely improve readability or remove duplication.
- **Fix bugs** with a regression test that fails before your fix and passes after.
- **Propose features** — open an issue first to scope it out before writing code (see "Proposing changes").
- **Platform expansion** — Linux compatibility, WSL fixes, Windows support. Particularly valuable; coordinate via an issue first to avoid duplicate work.
- **Share what you built with AHQ** — pop into Discord and tell us. Real-world use shapes the roadmap.

## Reporting issues

For **bugs**, use [GitHub Issues](https://github.com/Agentic-HQ/agentic-hq/issues/new/choose) with the bug-report template. The template asks for steps to reproduce, expected vs. actual behaviour, and your environment (macOS / Node / pnpm versions). Issues without reproduction steps are hard to action and may be closed with a request for more detail.

For **feature ideas**, use the feature-request template. Describe the problem you're trying to solve before proposing a solution — it helps us discuss alternatives.

For **questions, ideas, or community chat**, please use our Discord server once it is set up (`<DISCORD_INVITE_URL>` to be put here) rather than filing an issue. Discussion-style threads belong there.

For **security vulnerabilities**, do **not** file a public issue. See [`SECURITY.md`](./SECURITY.md) for private reporting channels.

## Proposing changes

- **Small bug-fix PRs** — go ahead and open one directly. Reference the issue you're fixing (or just describe the bug if there isn't one yet). Must include test that fails before the fix and passes after it.
- **Larger features** — please **open an issue first** to discuss the scope and approach. Surprise PRs that overhaul a subsystem are unlikely to be merged, regardless of code quality.

You do not need to ask for permission to work on an existing open issue. If you'd like to claim it, leave a comment so others know.

## Local development setup

The full setup is in the [`README.md`](./README.md) Quick Start section. Summarised here:

- **macOS 15.7.5** — macOS **13.5 or newer** is required (`node-pty`'s prebuilt native binaries need it); other platforms are untested but contributions to support them are welcome
- **Node.js 24 LTS** (default/recommended) — Node 22 and 24 LTS are both supported (not Node 23); install via [nvm](https://github.com/nvm-sh/nvm) (the repo has a root `.nvmrc` pinned to Node 24, currently `24.15.0`)
- **pnpm** via `corepack enable` (corepack ships with Node 22 and 24; it auto-installs the pinned pnpm version from `package.json`)
- Then `pnpm install` to install dependencies

If anything in the Quick Start fails, see [`docs/user-docs/troubleshooting-quickstart.md`](./docs/user-docs/troubleshooting-quickstart.md). If it's not covered there, that's a documentation bug — please report it.

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

There is no CI running this automatically yet. Until that lands, the burden is on you to run it before pushing. Reviewers will run it again on their machine before merging.

If `pnpm validate` fails on `format:check`, please run `pnpm format:check` to confirm only your in-progress files would be reformatted, then run `pnpm format:fix` to fix those files. Mixing unrelated whole-repo formatting into a code PR makes the diff impossible to review, and so it will be rejected.

## TDD

This project follows **strict Test-Driven Development** for behavioural changes: write a failing test first, watch it fail for the right reason, write the minimal code to make it pass, then refactor (NOTE: The project [`CLAUDE.md`](./CLAUDE.md) enforces this Red-Green-Refactor cycle)

In practical terms for contributors:

- **Behavioural changes** (anything that alters observable program behaviour) must be driven by tests. PRs that add behaviour without meaningful test coverage will not be merged. Regression tests that show the change didn't break any functionality related to the change are also welcome.
- **Pure refactors** (behaviour unchanged) and **documentation-only changes** are exempt — the existing test suite is enough to confirm you didn't break anything.
- **Bug fixes** must include a test that demonstrates the bug before the fix.  Additional regression tests that show the fix didn't break any functionality related to the code changes are also welcome.

Please avoid submitting unnecessary tests.   The RED stage in TDD involves writing a single test that must fail, and GREEN involve writing only enough code (no more) to make that test pass.  This keeps tests to the absolute minimum and code to the absolute minimum.  It prevents AI from being overly verbose.  A PR can (of course) contain multiple tests that cover all the functionality added for that PR (one RED->GREEN->REFACTOR cycle at a time).

Reviewer judgement decides whether test coverage is appropriate and meaningful.

## Submitting a PR

1. **Fork** the repo, create a branch, push your changes.
2. **PR title** — use [Conventional Commits](https://www.conventionalcommits.org/) format: `fix:`, `feat:`, `docs:`, `refactor:`, `test:`, `chore:`. The PR title becomes the squashed commit message on `main`. Include the GitHub issue number followed by the issue summary e.g. "refactor: #123 Move Claude-specific wiring into DefaultClaudeCodeTool"
3. **Fill in the PR template checkboxes** honestly — including the AI-assistance disclosure. We don't penalise AI use; we do penalise opaque AI use.
4. **Be ready to discuss.** Reviewers will ask questions. If you can't answer them, that's the One Rule biting — please slow down, understand the code, and respond.

PRs are merged via **squash and merge**, so commit history inside the PR is flattened. Don't worry about producing a clean commit history during development.

External contributors do not need to use the internal Agentic HQ `/agentic-hq-commands:commit` Claude Code skill, but can if they want to.

## AI-assisted contributions

This project was built collaboratively with Claude Code. Contributions where AI did some or all of the typing are welcome, on three conditions:

1. **You (the human) understand the code.**
2. **You disclose meaningful AI assistance** in the PR description. By "meaningful" we mean Claude/Copilot/Cursor/etc. shaped the design or wrote substantial code — not routine autocomplete or formatting suggestions. There's no penalty for disclosure; there is for hiding it.
3. **You've actually run and manually tested the code.** This catches the dominant failure mode of AI contributions, which is plausible-looking diffs that don't actually work.

**If you built your contribution using an Agentic HQ workflow** — please mention it. We'd love to understand whether the project is being used on itself ("dog fooding").

## Code of Conduct

Participation in this project is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md) (Contributor Covenant v3.0). By contributing, you agree to abide by it.

## License

Agentic HQ is licensed under the [MIT License](./LICENSE). By submitting a contribution you agree that your code is provided under the same licence.

## FAQ

**Why must I disclose AI use?** Because the project's *subject matter* is AI-assisted development. We owe contributors and users honesty about how the code was built — and we want to see real-world patterns of AI-assisted contribution.

**Why is macOS the only tested platform?** That's where the maintainer develops. Linux/WSL/Windows contributions and bug reports are explicitly welcome (see "Ways to contribute").
# NPM Commands

This document covers the main npm scripts in the project, organised by category.

> **One-time setup:** on a fresh checkout, run `pnpm install` (not `npm install`) to install dependencies. Corepack auto-fetches the pinned pnpm version from `package.json`'s `packageManager` field.
>
> **Node.js version:** Agentic HQ defaults to **Node.js 24 LTS** (recommended); **Node.js 22 LTS** is also supported (Node 22 and 24 only — not Node 23). The repo's root `.nvmrc` pins Node 24 (currently `24.15.0`) — run `nvm use` to switch to it.

For the full, authoritative list (including every individual test runner), use:

```bash
pnpm run                    # all scripts
pnpm run | grep test:e2e    # filter to a category
```

`package.json` is the source of truth — if anything in this doc disagrees with it, trust `package.json`.

---

## Validation (Pre-Commit Quality Gate)

These commands ensure code quality before committing. **Always run `pnpm validate` before committing.**

CI (GitHub Actions) runs `pnpm validate` automatically on every PR targeting `main` and every push to `main` — see [ci-configuration.md](ci-configuration.md). Running it locally first is much faster feedback.

```bash
# Run all checks: typecheck + lint + format + unit tests (REQUIRED before commits)
pnpm validate

# Run ALL checks including integration + e2e tests (slow — runs real Claude Code)
pnpm validate:all

# Run TypeScript type checking only
pnpm typecheck
```

---

## Builds

The two builds are explained in
[how-agentic-hq-works.md](how-agentic-hq-works.md#builds-framework-build-1-and-workflow-build-2);
you rarely run either by hand — the `agentic-hq-dev` binary runs the Framework
Build (1) automatically before every run, and the shared runner runs the
Workflow Build (2) per workflow when `build-mode` is `build-first`.

```bash
# Framework Build (1): incremental tsc of src/ into <repo>/dist (JS + .d.ts + maps)
pnpm build:framework

# Release build (publish-only): Framework Build (1) + a Workflow Build (2) per
# shipped migrated workflow + stage the release/ tree
pnpm build
```

---

## Linting (ESLint)

```bash
# Read-only check - always safe to run
pnpm lint:check

# Auto-fix linting issues
# WARNING: Run lint:check first to confirm only your files would change.
# DON'T fix unrelated stuff from previous commits!
pnpm lint:fix
```

---

## Formatting (Prettier)

```bash
# Read-only check - always safe to run
pnpm format:check

# Auto-fix formatting issues
# WARNING: Run format:check first to confirm only your files would change.
# DON'T fix unrelated stuff from previous commits!
pnpm format:fix
```

---

## Demo CLIs

Programs that demonstrate Agentic HQ capabilities. Good starting points for understanding how the system works.

```bash
# String reversal demo via the agentic-hq CLI (uses built-in default string)
# NOTE: usually better to just run `agentic-hq-dev reversal` directly — it's
# shorter and exercises the linked CLI the same way a user would.
# This pnpm script is mainly useful when working inside this repo without
# the CLI on PATH.
pnpm demo:agentic-hq-cli:string-reversal

# Override the default string:
pnpm demo:agentic-hq-cli:string-reversal -- --string-to-reverse="hello there"
# (equivalent: agentic-hq-dev reversal -- --string-to-reverse="hello there")

# Run a plugin's workflow directly (bypasses the agentic-hq CLI):
pnpm demo:plugin-direct:string-reversal
pnpm demo:plugin-direct:math-workflow
pnpm demo:plugin-direct:quick-jira-workflow
pnpm demo:plugin-direct:full-jira-tdd-story-workflow

# List all demo scripts
pnpm run | grep '^  demo:'
```

---

## Unit Tests

Fast tests that run in isolation with mocks. No external dependencies.

```bash
# Run ALL unit tests (test and test:unit are aliases)
pnpm test
pnpm test:unit

# List all unit-test scripts
pnpm run | grep test:unit
```

---

## Integration Tests

Tests that verify real component interaction (real Claude CLI, real Jira, etc.). Slower than unit tests.

```bash
# Run ALL integration tests
pnpm test:integration

# List all integration-test scripts (to run individually)
pnpm run | grep test:integration
```

---

## E2E Tests

End-to-end tests that exercise complete workflows as a user would.

**WARNING**: These are slow — the longest single e2e test takes approx 10 minutes. Expect `pnpm test:e2e` to take significantly longer.

```bash
# Run ALL e2e tests
pnpm test:e2e

# List all e2e-test scripts (to run individually)
pnpm run | grep test:e2e
```

---

## All Tests Combined

```bash
# Run unit + integration + e2e tests. Slow — uses real Claude Code.
pnpm test:all
```

---

## Notes

### Watch Mode Disabled

Watch mode (`--watch`) is intentionally disabled in this project. Watch mode causes AI-driven test execution to hang because it waits for user input. All test commands use `vitest run` which exits after tests complete.

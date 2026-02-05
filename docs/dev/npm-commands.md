# NPM Commands

This document lists all available npm scripts in the project, organized by category.

---

## Validation (Pre-Commit Quality Gate)

These commands ensure code quality before committing. **Always run `pnpm validate` before committing.**

```bash
# Run all checks: typecheck + lint + format + unit tests (REQUIRED before commits)
pnpm validate

# Run ALL checks including smoke and integration tests (warning: slow as includes integration tests that run Claude Code commands)
pnpm validate:all

# Run TypeScript type checking only
pnpm typecheck
```

---

## Linting (ESLint)

ESLint checks for code quality issues and enforces coding standards.

```bash
# Read-only check - always safe to run
pnpm lint:check

# Auto-fix linting issues
# WARNING: Run lint:check first to see what will change. DON'T fix stuff from previous commits!!!
pnpm lint:fix
```

---

## Formatting (Prettier)

Prettier ensures consistent code formatting across the project.

```bash
# Read-only check - always safe to run
pnpm format:check

# Auto-fix formatting issues
# WARNING: Run format:check first to see what will change. DON'T fix stuff from previous commits!!!
pnpm format:fix
```

---

## Demo CLIs

Programs that demonstrate Agentic HQ capabilities. These are good starting points for understanding how the system works.

```bash
# Simple hello world example (created initially just to test tech stack works)
pnpm hello-world

# Single step string reversal demo using Claude Code
pnpm demo:string-reversal

# 3-step math workflow demonstrating command chaining
# Takes an input number and runs: (input × 2 + 3) ÷ 5
pnpm demo:math-workflow --input-number=11
```

---

## Unit Tests

Fast tests that run in isolation with mocks. These test individual functions and classes without external dependencies.

```bash
# Run ALL unit tests
pnpm test

# Run only the hello-world unit test
pnpm test:hello-world

# Test ClaudeCodeTool with a fake Claude CLI (for testing file I/O pattern)
pnpm test:unit:fake-claude-file-io
```

---

## Smoke Tests

Quick validation tests that verify basic functionality works after a build. Faster than full integration tests.

```bash
# Run ALL smoke tests
pnpm test:smoke

# Run only the hello-world smoke test
pnpm test:smoke:hello-world
```

---

## Integration Tests

Tests that verify real component interaction. These use actual dependencies (like the real Claude CLI) and take longer to run.

```bash
# Run ALL integration tests
pnpm test:integration

# Test the kill script (bash) that terminates CLI processes
pnpm test:integration:kill-script

# Test self-termination capability with the real Claude CLI
pnpm test:integration:real-claude-self-termination

# Test ClaudeCodeTool with the real Claude CLI
pnpm test:integration:claude-file-io
```

---

## E2E Tests

End-to-end tests that verify complete workflows from start to finish. These test the entire application as a user would experience it.

```bash
# Run ALL e2e tests
pnpm test:e2e

# Test the string reversal demo CLI end-to-end
pnpm test:e2e:demo-string-reversal

# Test the math workflow demo CLI end-to-end
pnpm test:e2e:demo-math-workflow
```

---

## All Tests Combined

```bash
# Run unit + smoke + integration tests (excludes e2e). Warning: slow as includes integration tests that use real Claude Code
pnpm test:all
```

---

## Notes

### Watch Mode Disabled

Watch mode (`--watch`) is intentionally disabled in this project. Watch mode causes AI-driven test execution to hang because it waits for user input. All test commands use `vitest run` which exits after tests complete.

### Test Order for TDD

When following TDD for a Jira story, write failing tests and then get them to pass (by running the pnpm commands above) in the following order:
1. **Unit tests** - Core logic in isolation
2. **Integration tests** - Component interaction
3. **Smoke tests** - Basic functionality validation
4. **E2E tests** - Complete user journeys

Each test type goes through the full TDD cycle (RED → GREEN → REFACTOR → VERIFY) before moving to the next.

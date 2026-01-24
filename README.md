# agentic-hq
Agentic HQ: A modular open source framework for orchestrating an agentic software development team

## Prerequisites

### Node.js
Requires Node.js v22.x (LTS). Check with `node --version`.

### pnpm (Package Manager)
This project uses pnpm. **You must use pnpm 10.28.1 or later.**

```bash
# Check your pnpm version
pnpm --version

# If outdated, update using corepack (built into Node.js 22+):
corepack use pnpm@10.28.1
```

**Why pnpm 10.28.1+?** Earlier versions have bugs with peer dependency resolution and build script handling that cause issues with this project's dependencies.

### First-time Setup

```bash
# Clone the repo
git clone <repo-url>
cd agentic-hq

# Install dependencies
pnpm install

# Verify everything works
pnpm validate
```

## Available Commands

### Validation

```bash
# Run all checks (typecheck + lint + tests) - REQUIRED before commits
pnpm validate
```

### Linting (ESLint)

```bash
# Read-only check - always safe to run
pnpm lint:check

# Auto-fix linting issues
# WARNING: Run lint:check first to confirm changes are only for current work
pnpm lint:fix
```

### Formatting (Prettier)

```bash
# Read-only check - always safe to run
pnpm format:check

# Auto-fix formatting issues
# WARNING: Run format:check first to confirm changes are only for current work
pnpm format:fix
```

### Type Checking

```bash
# Run TypeScript type checking
pnpm typecheck
```

### Tests

```bash
# Run all unit tests
pnpm test

# Run specific unit test
pnpm test:hello-world

# Run smoke tests
pnpm test:smoke
```

### CLI Programs

```bash
# Run hello world example
pnpm hello-world
```

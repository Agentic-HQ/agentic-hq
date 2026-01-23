# AHQ-7 Execution Plan: Add Code Quality Tools

**Jira**: [AHQ-7](https://agentic-hq.atlassian.net/browse/AHQ-7)
**Created**: 2026-01-23

---

## Overview

Add ESLint v9 and Prettier 3.x code quality tooling to the main Agentic HQ project, with intentionally relaxed strictness rules during early development phase.

## Files to Create

### 1. `eslint.config.mjs` (root)

Copy from `docs/jira-docs/AHQ-7/workflow-files/jira-attachments/eslint.config.FOR_MAIN_PROJECT_START.mjs` with one change:
- Remove redundant `'node_modules/**'` line (keep only `'**/node_modules/**'`)

Key features:
- ESLint v9 Flat Config format
- TypeScript support via `typescript-eslint`
- Import ordering via `eslint-plugin-import`
- Vitest rules for test files
- Prettier conflict prevention via `eslint-config-prettier`
- **Intentionally relaxed rules** with inline documentation:
  - `@typescript-eslint/no-floating-promises` - commented out
  - `@typescript-eslint/no-explicit-any` - commented out
  - `no-console` - set to `'warn'`
- Test files have `'no-console': 'off'`

### 2. `.prettierrc` (root)

Copy from `docs/project-docs/project-spikes/spike-00-fail-fast-minimal-whole-system/project/.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "proseWrap": "preserve"
}
```

## Files to Modify

### 3. `package.json` - Add devDependencies

Add these packages (versions from Spike-00, which are current):

```json
"devDependencies": {
  "@typescript-eslint/eslint-plugin": "^8.46.2",
  "@typescript-eslint/parser": "^8.46.2",
  "eslint": "^9.38.0",
  "eslint-config-prettier": "^10.1.8",
  "eslint-import-resolver-typescript": "^3.6.1",
  "eslint-plugin-import": "^2.29.1",
  "eslint-plugin-vitest": "^0.5.0",
  "prettier": "^3.6.2"
}
```

### 4. `package.json` - Add/Update Scripts

```json
"scripts": {
  "// VALIDATION": "validate = typecheck + lint + unit tests",
  "validate": "pnpm typecheck && pnpm lint:check && pnpm test",
  "typecheck": "tsc --noEmit",
  "// LINTING": "lint:check = read-only, lint:fix = auto-fix (use carefully)",
  "lint:check": "eslint .",
  "lint:fix": "eslint . --fix",
  "// FORMATTING": "format:check = read-only, format:fix = auto-fix (use carefully)",
  "format:check": "prettier . --check",
  "format:fix": "prettier . --write",
  // ... existing scripts unchanged
}
```

### 5. `.claude/commands/agentic-hq-commands/commit.md`

Add section requiring `pnpm validate` before committing. Insert after the "Analyse the files" steps:

```markdown
### Pre-Commit Validation

Before creating the commit message, run validation:

1. Run `pnpm validate` to check:
   - TypeScript types (`pnpm typecheck`)
   - Linting rules (`pnpm lint:check`)
   - Unit tests (`pnpm test`)

2. If validation fails:
   - STOP and report the failures to the human
   - Do NOT proceed with the commit until validation passes
   - Help fix the issues if requested

3. Only proceed with commit message creation if `pnpm validate` passes
```

### 6. `README.md` - Add Commands Documentation

Add section documenting available commands (as specified in Jira):

```markdown
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

### Tests
```bash
# Run all unit tests
pnpm test

# Run specific test
pnpm test:hello-world
```
```

## Execution Order

1. **Install dependencies first** - Run `pnpm install` after updating package.json
2. **Create config files** - eslint.config.mjs, .prettierrc
3. **Update package.json** - scripts section
4. **Update commit.md** - add validation requirement
5. **Update README.md** - add commands documentation
6. **Run validation** - `pnpm validate` to verify everything works

## Verification

After implementation, verify:

1. `pnpm lint:check` - Should run without errors (or only warnings for intentionally relaxed rules)
2. `pnpm format:check` - Should pass or show files needing formatting
3. `pnpm validate` - Should run all three checks (typecheck + lint + test) and pass
4. Verify relaxed rules work:
   - Code with `any` types should only warn, not error
   - Code with `console.log` should only warn, not error
   - Unhandled promises should not error (rule disabled)

## TDD Note

This Jira is primarily configuration/tooling setup. The "tests" for this work are:
- Running `pnpm validate` successfully
- Verifying each command works as documented
- Confirming the relaxed rules behave as specified

No new unit test files need to be written - the acceptance criteria are verified by running the commands themselves.

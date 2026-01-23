# AHQ-7 Implementation and Testing Details

**Jira**: [AHQ-7](https://agentic-hq.atlassian.net/browse/AHQ-7)
**Title**: Add Code Quality Tools (Linting, Prettier etc)
**Completed**: 2026-01-23

---

## Summary

Added ESLint v9 and Prettier 3.x to the main Agentic HQ project with intentionally relaxed rules for early-stage development.

---

## Files Created

| File | Purpose |
|------|---------|
| `eslint.config.mjs` | ESLint v9 flat config with TypeScript, import ordering, Vitest rules |
| `.prettierrc` | Prettier config (semi, singleQuote, 100 printWidth, etc.) |
| `.prettierignore` | Excludes docs, markdown, experiments, config files, lock files |

## Files Modified

| File | Changes |
|------|---------|
| `package.json` | Added 9 devDependencies + 6 new scripts |
| `.claude/commands/agentic-hq-commands/commit.md` | Added pre-commit validation requirement |
| `README.md` | Added commands documentation |
| `tests/smoke/hello-world.smoke.test.ts` | Fixed import ordering (auto-fixed) |
| `src/scripts/.../perform-squash-merge-on-branch.ts` | Fixed import ordering + Prettier formatting |

---

## Issues Discovered During Testing

### Issue 1: Missing `typescript-eslint` Package

**When discovered**: First run of `pnpm lint:check`

**Error**:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'typescript-eslint'
```

**Cause**: The eslint config imports from `typescript-eslint` (the combined package for ESLint 9), but I only added `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser`.

**Fix**: Added `typescript-eslint` package:
```bash
pnpm add -D typescript-eslint
```

---

### Issue 2: Spike Projects Not in tsconfig.json

**When discovered**: Second run of `pnpm lint:check`

**Error**:
```
Parsing error: "parserOptions.project" has been provided for @typescript-eslint/parser.
The file was not found in any of the provided project(s): docs/project-docs/project-spikes/...
```

**Cause**: ESLint was trying to lint TypeScript files in the spike projects, but those have their own separate `tsconfig.json` files and aren't included in the main project's tsconfig.

**Fix**: Added `docs/project-docs/project-spikes/**` to eslint ignores:
```javascript
ignores: [
  // ...
  'docs/project-docs/project-spikes/**', // Spike projects have their own eslint configs
]
```

---

### Issue 3: Vitest Config Files Not in tsconfig.json

**When discovered**: Third run of `pnpm lint:check`

**Error**:
```
Parsing error: "parserOptions.project" has been provided for @typescript-eslint/parser.
The file was not found in any of the provided project(s): vitest.smoke.config.ts
```

**Cause**: The root-level `vitest.unit.config.ts` and `vitest.smoke.config.ts` files are not in the tsconfig.json `include` paths (which only covers `src/**/*` and `tests/**/*`).

**Fix**: Added config files to eslint ignores:
```javascript
ignores: [
  // ...
  '*.config.ts', // Config files in root (vitest.*.config.ts) - not in tsconfig.json
  '*.config.mjs', // Config files in root (eslint.config.mjs)
]
```

---

### Issue 4: Old Experiments Have Lint Errors

**When discovered**: Fourth run of `pnpm lint:check`

**Errors**: 29 errors in `src/experiments/` directory - import ordering issues and unused variables in old experiment files.

**Cause**: Pre-existing code in `src/experiments/` that was written before linting was added.

**Decision**: Per CLAUDE.md rules about not auto-fixing code outside the current Jira, I chose to ignore this directory rather than fix it.

**Fix**: Added experiments to eslint ignores:
```javascript
ignores: [
  // ...
  'src/experiments/**', // Old experiments - to be cleaned up in separate chore Jira
]
```

---

### Issue 5: Import Ordering Errors in Active Code

**When discovered**: Fifth run of `pnpm lint:check`

**Errors**: 4 import/order errors in 2 files:
- `src/scripts/git-scripts/branching/03-squash-merge-branch/perform-squash-merge-on-branch.ts`
- `tests/smoke/hello-world.smoke.test.ts`

**Cause**: Pre-existing import ordering that didn't follow the new `eslint-plugin-import` rules.

**Decision**: Since there were only 4 errors in 2 files, and they were simple auto-fixable ordering issues (not substantive code changes), I fixed them.

**Fix**: Ran ESLint auto-fix on the specific files:
```bash
pnpm eslint --fix src/scripts/.../perform-squash-merge-on-branch.ts tests/smoke/hello-world.smoke.test.ts
```

---

### Issue 6: Prettier Finding Issues in Many Markdown Files

**When discovered**: First run of `pnpm format:check`

**Errors**: Warnings for 50+ markdown files in `.claude/`, `.agentic-hq/`, `docs/`, etc.

**Cause**: Pre-existing markdown files with formatting that doesn't match Prettier's preferences.

**Decision**: Markdown formatting is subjective and these are documentation/command files. Created `.prettierignore` to exclude them.

**Fix**: Created `.prettierignore` with exclusions for docs, commands, and markdown:
```
docs/
.claude/
.agentic-hq/
*.md
```

---

### Issue 7: pnpm-lock.yaml Formatting Warning

**When discovered**: Second run of `pnpm format:check`

**Error**: Prettier warning for `pnpm-lock.yaml`

**Cause**: Lock files are auto-generated and shouldn't be formatted.

**Fix**: Added to `.prettierignore`:
```
pnpm-lock.yaml
```

---

### Issue 8: TypeScript File Still Failing format:check

**When discovered**: User ran `pnpm format:check` after initial implementation

**Error**: `perform-squash-merge-on-branch.ts` still showing as needing formatting.

**Cause**: ESLint had fixed import ordering, but Prettier also wanted to:
- Reorder imports (node built-ins before external packages)
- Wrap long function signatures
- Remove extra blank line before `catch`

**Fix**: Ran Prettier on the file to complete the formatting:
```bash
pnpm prettier --write src/scripts/.../perform-squash-merge-on-branch.ts
```

---

### Issue 9: 91 `no-console` Warnings Creating Noise

**When discovered**: User observed that `pnpm lint:check` output was very long with warnings.

**Problem**: Setting `no-console: 'warn'` produced 91 warning messages, making lint output noisy and hard to read.

**Rationale for change**:
- Warnings that are intentionally being ignored create noise without value
- The lint output should show actionable issues
- We've deliberately decided console usage is acceptable for now

**Fix**: Changed from `'warn'` to `'off'` and updated the comment:
```javascript
// Set to 'off' (not 'warn') to keep lint output clean and readable.
// Warnings for 90+ console statements create noise without actionable value
// since we've intentionally decided console usage is acceptable for now.
'no-console': 'off',
```

---

## Testing Performed

### Test 1: Individual Command Verification

| Command | Result |
|---------|--------|
| `pnpm typecheck` | ✅ Passes |
| `pnpm lint:check` | ✅ Passes (clean output) |
| `pnpm lint:fix` | ✅ Works |
| `pnpm format:check` | ✅ Passes |
| `pnpm format:fix` | ✅ Works |
| `pnpm test` | ✅ 1 test passes |

### Test 2: Full Validation

```bash
pnpm validate
```

**Result**: ✅ Passes - runs typecheck + lint:check + test sequentially, all pass.

### Test 3: Intentionally Relaxed Rules Verification

Verified that the following do NOT cause errors (as intended per Jira):
- `@typescript-eslint/no-explicit-any` - disabled (commented out)
- `@typescript-eslint/no-floating-promises` - disabled (commented out)
- `no-console` - disabled ('off')

### Test 4: Test Files Have Relaxed Rules

Verified test files configuration:
- `no-console: 'off'` for test files
- `vitest/valid-expect: 'off'` (due to plugin bug)

---

## Final State

### Commands Available

```bash
pnpm validate      # typecheck + lint + test (REQUIRED before commits)
pnpm typecheck     # TypeScript type checking only
pnpm lint:check    # ESLint read-only check
pnpm lint:fix      # ESLint auto-fix
pnpm format:check  # Prettier read-only check
pnpm format:fix    # Prettier auto-fix
```

### ESLint Ignores

```javascript
ignores: [
  'dist/**',
  'coverage/**',
  '**/*.d.ts',
  '**/node_modules/**',
  'scripts/**',
  'docs/**',
  '*.config.ts',
  '*.config.mjs',
  'src/experiments/**',
]
```

### Prettier Ignores

```
dist/
coverage/
node_modules/
pnpm-lock.yaml
*.md
docs/
*.config.ts
*.config.mjs
src/experiments/
.claude/
.agentic-hq/
.git/
```

---

## Acceptance Criteria Verification

| Criteria | Status |
|----------|--------|
| `pnpm validate` runs typecheck + lint + tests | ✅ |
| `lint:check` and `lint:fix` work | ✅ |
| `format:check` and `format:fix` work | ✅ |
| commit.md requires `pnpm validate` | ✅ |
| README.md has commands documentation | ✅ |
| Intentionally relaxed rules with documentation | ✅ |
| References to AHQ-5 for future tightening | ✅ |

---

## Dependencies Added

```json
"devDependencies": {
  "@typescript-eslint/eslint-plugin": "^8.46.2",
  "@typescript-eslint/parser": "^8.46.2",
  "eslint": "^9.38.0",
  "eslint-config-prettier": "^10.1.8",
  "eslint-import-resolver-typescript": "^3.6.1",
  "eslint-plugin-import": "^2.29.1",
  "eslint-plugin-vitest": "^0.5.0",
  "prettier": "^3.6.2",
  "typescript-eslint": "^8.53.1"
}
```

---

## Lessons Learned

1. **ESLint 9 flat config requires `typescript-eslint` package** - not just the separate parser and plugin packages.

2. **Projects with multiple tsconfigs need careful eslint ignore configuration** - files not in the main tsconfig.json will cause parsing errors.

3. **Pre-existing code may have lint errors** - decide whether to fix them (if simple) or ignore the directory (if extensive).

4. **`'warn'` creates noise for intentionally-ignored rules** - use `'off'` when you've deliberately decided to allow something.

5. **Prettier and ESLint may both want to reorder imports** - run both tools to fully format code.

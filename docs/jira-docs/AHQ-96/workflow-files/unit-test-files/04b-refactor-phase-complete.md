# REFACTOR Complete: AHQ-96 (unit test)

**Jira**: [AHQ-96](https://agentic-hq.atlassian.net/browse/AHQ-96)
**Test Type**: unit
**Phase**: REFACTOR (Complete)
**Generated**: 2026-04-19 17:35

---

## Refactoring Summary

| Category | Count | Executed | Skipped | Failed |
|----------|-------|----------|---------|--------|
| Tier 1 (Auto) | 3 | 3 | 0 | 0 |
| Tier 2 (Agreed) | 0 | 0 | 3 | 0 |
| **Total** | 6 | 3 | 3 | 0 |

> Note: Refactor 1.3 was first executed exactly as specified, failed (revealed an environment-coupling issue — `AGENTIC_HQ_WORKSPACE_ROOT` is set to PWD in this dev environment, so `isAhqWorkspace()` returned `true`, not `false`). It was reverted, then re-executed in modified form by also stubbing the env var to a non-cwd value (matching the symmetry intent of the analysis). The modified version passed.

---

## Tier 1 Refactors Executed

| # | Type | Description | Result |
|---|------|-------------|--------|
| 1.1 | Extract magic constant | Replaced `'AGENTIC_HQ_WORKSPACE_ROOT'` string literal in `composition-root.unit.test.ts:18` with import + use of `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` constant from `ahq-workspace-impl.ts` | Success |
| 1.2 | Remove dead code (redundant comment) | Deleted redundant inline TSDoc `/** Stateless wiring class — each get* method returns a freshly-wired component. */` on `composition-root.ts:28` (content already in SRP header) | Success |
| 1.3 | Symmetry fix / stronger assertion | Added `expect(currentUserWorkspace.isAhqWorkspace()).toBe(false)` to `getCurrentUserWorkspace()` test, plus `vi.stubEnv(AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR, '/some-other-ahq-root')` to ensure the assertion is meaningful (not coupled to dev env state) | Success (modified) |

---

## Agreed Tier 2 Refactors

| # | Source | Description | Decision | Result |
|---|--------|-------------|----------|--------|
| 2.1 | AI | Add a clarifier line to `MarshalledCLITool`'s SRP header about the subclassing pattern | SKIP | Not executed |
| 2.2 | AI | Add a regression test asserting `CompositionRoot.getTool()` does not exist | SKIP | Not executed |
| 2.3 | AI | Extract shared `fakeWorkspace()` / `fakeSession()` test helpers | SKIP | Not executed |

---

## Post-Refactor Test Status

**Command**: `pnpm validate` (typecheck + lint:check + format:check + `vitest run --config vitest.unit.config.ts`)
**Result**: PASSING (31 test files, 131 tests)

---

## Code Changes Made

### Files Modified:
- `tests/unit/kernel/composition-root.unit.test.ts` — added import of `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR`; replaced magic-string `'AGENTIC_HQ_WORKSPACE_ROOT'` with the constant in `vi.stubEnv(...)` call (Refactor 1.1); added env-var stub + `isAhqWorkspace()` assertion to `getCurrentUserWorkspace()` test (Refactor 1.3 modified)
- `src/kernel/composition-root.ts` — removed redundant inline TSDoc comment above the class declaration (Refactor 1.2)

### Files Created:
- None

### Files Deleted:
- None

---

## Ready for VALIDATE Phase

Refactoring is complete. Now verify all tests pass:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:05-jira-validate AHQ-96 unit
```

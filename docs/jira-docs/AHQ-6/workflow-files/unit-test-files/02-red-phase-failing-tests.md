# RED Phase Complete: AHQ-6 (unit test)

**Jira**: [AHQ-6](https://agentic-hq.atlassian.net/browse/AHQ-6)
**Test Type**: unit
**Phase**: RED (Failing Test Written)
**Generated**: 2026-01-20 18:55 UTC

---

## Test Created

**File**: `tests/unit/hello-world.unit.test.ts`
**Tests**: Verifies that the `helloWorld()` function returns the string "Hello world"

**Failure Output** (module not found - as expected):
```
Error: Cannot find module '../../src/misc/hello-world.js' imported from '/Users/stevepersonal/dev/agentic-hq/agentic-hq/tests/unit/hello-world.unit.test.ts'
```

**Commands verified**:
- `pnpm test:hello-world` - runs this specific test ✅
- `pnpm test` - runs all unit tests ✅

---

## Files Created

- `tests/unit/hello-world.unit.test.ts` - Unit test for helloWorld function
- `vitest.unit.config.ts` - Vitest configuration for unit tests
- `package.json` - Updated with test scripts and vitest dependency

**Note**: No skeleton/implementation files created in RED phase - that's GREEN phase work.

---

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-commands:workflow:jira-story-workflow:03-jira-minimal-implementation AHQ-6 unit
```

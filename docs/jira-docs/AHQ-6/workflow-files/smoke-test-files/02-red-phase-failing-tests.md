# RED Phase Complete: AHQ-6 (smoke test)

**Jira**: [AHQ-6](https://agentic-hq.atlassian.net/browse/AHQ-6)
**Test Type**: smoke
**Phase**: RED (Failing Test Written)
**Generated**: 2026-01-21 21:57 UTC

---

## Test Created

**File**: `tests/smoke/hello-world.smoke.test.ts`
**Tests**: Runs `pnpm hello-world` CLI command and verifies "Hello world" is printed to stdout

**Failure Output** (command not found - as expected):
```
Error: Command failed: pnpm hello-world

 ❯ tests/smoke/hello-world.smoke.test.ts:20:20
     18|
     19|     // Act - run the CLI command and capture stdout
     20|     const output = execSync('pnpm hello-world', {
       |                    ^
     21|       cwd: process.cwd(),
     22|       encoding: 'utf-8',
```

**Why this is correct**: The `pnpm hello-world` script doesn't exist yet. The smoke test correctly detects that the CLI implementation is missing. GREEN phase will add the `hello-world` script to package.json.

---

## Files Created

- `tests/smoke/hello-world.smoke.test.ts` - Smoke test that runs CLI and verifies output
- `vitest.smoke.config.ts` - Vitest configuration for smoke tests

## Files Modified

- `package.json` - Added `test:smoke` and `test:smoke:hello-world` scripts

**Note**: No `hello-world` CLI script created in RED phase - that's GREEN phase work.

---

## Acceptance Criteria Coverage

From AHQ-6:
- ✅ `pnpm test:smoke:hello-world` runs the smoke test
- ❌ Test fails because `pnpm hello-world` doesn't exist yet (expected for RED phase)

From AHQ-1 (Epic):
- ✅ `pnpm test:smoke` runs all smoke tests (infrastructure ready)

---

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-commands:workflow:jira-story-workflow:03-jira-minimal-implementation AHQ-6 smoke
```

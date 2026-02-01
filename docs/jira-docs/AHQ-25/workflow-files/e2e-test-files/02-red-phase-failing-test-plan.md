# Plan: AHQ-25 E2E Test (RED Phase)

## Summary

Create an e2e test that runs `pnpm demo:string-reversal --string-to-reverse="this is a test string"` and verifies the output contains `gnirts tset a si siht`. The test should fail in RED phase because the CLI doesn't exist yet.

## Files to Create/Modify

### 1. Create `vitest.e2e.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

/**
 * E2E test configuration for Agentic HQ
 *
 * IMPORTANT: Do NOT set global testTimeout/hookTimeout here.
 * E2E tests vary widely in duration (some take seconds, others minutes).
 * Each test should specify its own timeout using the third argument to it().
 */
export default defineConfig({
  test: {
    name: 'e2e',
    include: ['tests/e2e/**/*.e2e.test.ts'],
    environment: 'node',
    globals: true,
    pool: 'forks',
    fileParallelism: false,
    sequence: { concurrent: false },
    // NO global timeout - each test specifies its own via it('...', async () => {}, TIMEOUT_MS)
  },
});
```

### 2. Create `tests/e2e/demo/demo-string-reversal-cli-reverses-string.e2e.test.ts`

Uses `execSync` pattern from `hello-world.smoke.test.ts`:
- Run `pnpm demo:string-reversal --string-to-reverse="this is a test string"`
- Assert output contains `gnirts tset a si siht`
- **Per-test timeout of 30 seconds** (specified as 3rd argument to `it()`)

```typescript
const TEST_TIMEOUT_MS = 30_000; // 30s per Jira AC

it('should reverse a user-provided string...', () => {
  // test code
}, TEST_TIMEOUT_MS);
```

### 3. Modify `package.json`

Add scripts:
```json
"test:e2e": "vitest run --config vitest.e2e.config.ts",
"test:e2e:demo-string-reversal": "vitest run --config vitest.e2e.config.ts tests/e2e/demo/demo-string-reversal-cli-reverses-string.e2e.test.ts"
```

**Note:** Do NOT add `demo:string-reversal` script - that's GREEN phase work.

## Expected RED Phase Failure

```
Error: Command failed: pnpm demo:string-reversal --string-to-reverse="this is a test string"
 ERR_PNPM_NO_SCRIPT  Missing script: demo:string-reversal
```

This is the correct TDD failure - the test fails because the thing being tested doesn't exist.

## Steps to Execute

1. Create `vitest.e2e.config.ts`
2. Create directory `tests/e2e/demo/`
3. Create test file `demo-string-reversal-cli-reverses-string.e2e.test.ts`
4. Add test scripts to `package.json`
5. Run `pnpm test:e2e:demo-string-reversal` - verify it fails with "Missing script"
6. Run `pnpm typecheck` - verify no TypeScript errors
7. Create RED phase summary document at `docs/jira-docs/AHQ-25/workflow-files/e2e-test-files/02-red-phase-failing-tests.md`
8. Add comment to Jira AHQ-25

## Verification

```bash
pnpm test:e2e:demo-string-reversal  # Should fail with "Missing script: demo:string-reversal"
pnpm typecheck                       # Should pass (no TS errors in test file)
```

## Reference Files

- `tests/smoke/hello-world.smoke.test.ts` - execSync pattern
- `vitest.smoke.config.ts` - config structure
- `package.json` - script naming patterns

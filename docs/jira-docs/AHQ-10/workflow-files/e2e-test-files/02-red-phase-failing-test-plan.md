# RED Phase Plan: AHQ-10 E2E Test

**Jira**: [AHQ-10](https://agentic-hq.atlassian.net/browse/AHQ-10)
**Phase**: RED (Write ONE Failing E2E Test)
**Test**: `pnpm demo:math-workflow --input-number=11` outputs "Output number: 5"

---

## Files to Modify

### 1. CREATE: `tests/e2e/demo/demo-math-workflow-gives-expected-output-number.e2e.test.ts`

```typescript
/**
 * E2E Test: Demo Math Workflow CLI
 *
 * Verifies the math workflow CLI processes input through 3 steps:
 * 11 * 2 = 22 -> 22 + 3 = 25 -> 25 / 5 = 5
 *
 * See: https://agentic-hq.atlassian.net/browse/AHQ-10
 */

import { execSync } from 'node:child_process';

import { describe, it, expect } from 'vitest';

const TEST_TIMEOUT_MS = 90_000; // 90s per Jira AC (30s per Claude invocation)

const TEST_INPUT_NUMBER = 11;
const EXPECTED_OUTPUT_NUMBER = 5;

describe('Demo Math Workflow CLI', () => {
  it(
    'should process input number through workflow and output the expected result',
    () => {
      // Arrange
      const inputNumber = TEST_INPUT_NUMBER;
      const expectedOutput = `Output number: ${EXPECTED_OUTPUT_NUMBER}`;
      const command = `pnpm demo:math-workflow --input-number=${inputNumber}`;

      // Act - run the CLI command and capture stdout
      const output = execSync(command, {
        cwd: process.cwd(),
        encoding: 'utf-8',
      });

      // Assert - verify the output number appears in the output
      expect(output).toContain(expectedOutput);
    },
    TEST_TIMEOUT_MS
  );
});
```

### 2. MODIFY: `package.json`

Add ONE script in the E2E TEST COMMANDS section (after `test:e2e:demo-string-reversal`):

```json
"test:e2e:demo-math-workflow": "vitest run --config vitest.e2e.config.ts tests/e2e/demo/demo-math-workflow-gives-expected-output-number.e2e.test.ts",
```

**Note**: Do NOT add `demo:math-workflow` script - that's production code for GREEN phase.

---

## Expected Failure

When running `pnpm test:e2e:demo-math-workflow`:

1. Test file compiles successfully (only uses Node.js + Vitest)
2. Test executes and calls `execSync(pnpm demo:math-workflow...)`
3. **FAILS** with: `ERR_PNPM_NO_SCRIPT Missing script: demo:math-workflow`

This is the correct RED phase failure - the test expects a CLI that doesn't exist yet.

---

## Verification Steps

```bash
# 1. TypeScript compiles the test
pnpm typecheck

# 2. Run the new E2E test (expect FAILURE)
pnpm test:e2e:demo-math-workflow

# 3. Existing tests still pass
pnpm validate
```

---

## After Implementation

1. Create RED phase summary at: `docs/jira-docs/AHQ-10/workflow-files/e2e-test-files/02-red-phase-failing-tests.md`
2. Add comment to Jira AHQ-10 documenting RED phase completion
3. Present to human for review before GREEN phase

---

## Command to Continue (After RED Phase Approved)

Next command for GREEN phase:
```
/agentic-hq-commands:workflow:jira-story-workflow:03-jira-minimal-implementation AHQ-10 e2e
```

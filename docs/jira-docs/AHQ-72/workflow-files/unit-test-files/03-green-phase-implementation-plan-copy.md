# GREEN Phase Plan: AHQ-72 (unit test)

## Context

AHQ-72 is about adding `/tmp` log file output to all e2e tests. The RED phase wrote a unit test for a shared helper `runCliAndLogOutput()` that doesn't exist yet. The test fails with "Cannot find module". This GREEN phase creates the minimal implementation to make that unit test pass.

## Jira Requirements (Numbered)

1. Create shared helper at `tests/e2e/helpers/run-cli-and-log-output.ts` → [Step 2]
2. Helper writes CLI output to `/tmp` log file → [Step 2: execSync with stdio to file]
3. Helper uses `process.stdout.write()` NOT `console.log` for banner → N/A (unit test doesn't test banner output, so not implementing banner in GREEN - minimum only)
4. Helper returns output string (read from file) → [Step 2: readFileSync return]
5. Log file path format: `/tmp/e2e-{logFileLabel}.log` → [Step 2: path construction]
6. AC: Unit test passes → [Step 3: Verification]
7. No manual cleanup needed (OS handles `/tmp`) → N/A (nothing to implement)

## Plan

### Step 0: Copy this approved plan to `docs/jira-docs/AHQ-72/workflow-files/unit-test-files/03-green-phase-implementation-plan-copy.md`

### Step 1: Create directory

Create `tests/e2e/helpers/` directory (doesn't exist yet).

### Step 2: Create `tests/e2e/helpers/run-cli-and-log-output.ts`

Minimal implementation - only what the test requires:

```typescript
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const LOG_FILE_DIRECTORY = '/tmp';

export function runCliAndLogOutput(
  command: string,
  logFileLabel: string,
  timeoutMs?: number,
): string {
  const logFile = path.join(LOG_FILE_DIRECTORY, `e2e-${logFileLabel}.log`);
  const logFd = fs.openSync(logFile, 'w');
  try {
    execSync(command, {
      cwd: process.cwd(),
      timeout: timeoutMs,
      stdio: ['pipe', logFd, logFd],
    });
  } finally {
    fs.closeSync(logFd);
  }
  return fs.readFileSync(logFile, 'utf-8');
}
```

**What's deliberately NOT included (GREEN = minimum to pass test):**
- No bold red banner (`printBanner`) - the unit test doesn't assert on stdout banner output
- No error wrapping beyond what execSync already throws
- These will be added when the e2e tests are updated (separate Jira work or REFACTOR)

### Step 3: Verification

1. Run `pnpm test tests/unit/e2e-helpers/run-cli-and-log-output.unit.test.ts` (the specific test)
2. If passing, run `pnpm test` (all unit tests) to check for regressions

### Step 4: Post-implementation

- Re-read the command file for documentation and output instructions
- Create GREEN phase summary document
- Add Jira comment
- Write command output file
- Self-terminate

## Files to Create

- `tests/e2e/helpers/run-cli-and-log-output.ts` — the shared helper module

## Files NOT Modified

No existing files are modified. This is a new file only.

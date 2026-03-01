# AI Summary: AHQ-72

**Jira**: [AHQ-72](https://agentic-hq.atlassian.net/browse/AHQ-72)
**Title**: Add /tmp log file output to all e2e tests for tail -f monitoring
**Status**: Transitioned to In Progress
**Generated**: 2026-02-28

---

## My Understanding of This Task

The core problem is developer experience: when running long e2e tests (30-90 seconds), vitest shows only a spinner with no visible output, leaving the user "flying blind". The solution is to redirect all e2e test CLI output to `/tmp` log files and print a bold red banner telling the user where to `tail -f`.

There's a critical technical finding already proven by manual testing: `console.log` stops working after a node-pty PTY execution (used by `ClaudeCodeTool.execute()`), because vitest intercepts `console.log` and the PTY spawn breaks that interception. The fix is to use `process.stdout.write()` instead, which bypasses vitest's interception entirely.

The implementation is a refactoring task: extract the existing inline `runCliAndLogOutput()` function from the quick-jira e2e test into a shared helper at `tests/e2e/helpers/run-cli-and-log-output.ts`, enhance it to return the output string (so callers can assert on it), fix it to use `process.stdout.write()` instead of `console.log`, and then update all 3 e2e tests to use it. The `/tmp` files are cleaned up automatically on OS reboot, so no manual cleanup logic is needed.

The scope is limited to the 3 existing e2e test files plus the new shared helper. No production code changes.

## Research Findings

No external research was needed. The Jira is very thorough - it includes the root cause analysis, proven fix, existing pattern reference, and full implementation suggestion with code.

## Questions for Human

No questions - all resolved during discussion.

### Resolved: Error wrapping approach

**Original concern**: The Jira's suggested implementation stripped the error wrapping from the existing quick-jira function, creating unnecessary complexity about how callers would access the log file path.

**Resolution**: Keep the existing function's structure (it's already self-contained), just make it generic:
- Rename `testJiraId` param to `logFileLabel` — caller passes the full label including test type prefix (e.g. `"e2e-quick-workflow-TEST-123"`, `"e2e-string-reversal"`, `"e2e-math-workflow"`), and the helper just does `/tmp/${logFileLabel}.log`
- Accept `timeoutMs` as a parameter instead of using the `TEST_TIMEOUT_MS` constant
- Fix `console.log` -> `process.stdout.write()` (the bug fix)
- Add a return value (read file contents after successful execution)
- **Fix error wrapping bug**: The current catch block reads the entire (potentially multi-megabyte) log file and dumps it into the error message. This was a misunderstanding - only the log file **path** should be included, not the contents. The error should preserve the original error via `{ cause: error }` and tell you where to look, not dump the whole log.

---

## Files I Reviewed

- `tests/e2e/demo/quick-jira-workflow-produces-expected-files.e2e.test.ts` - Contains the existing inline `runCliAndLogOutput()` (lines 62-82) that will be extracted. Uses `console.log` for the banner (the bug). Has custom error wrapping on lines 73-78.
- `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts` - Uses bare `execSync` with `encoding: 'utf-8'`. Asserts `expect(output).toContain(EXPECTED_REVERSED_STRING)` - needs the return value from the new helper.
- `tests/e2e/demo/demo-math-workflow-gives-expected-output-number.e2e.test.ts` - Uses bare `execSync` with `encoding: 'utf-8'`. Asserts `expect(output).toContain(expectedOutput)` - also needs the return value.
- `vitest.e2e.config.ts` - E2e config: sequential execution, no global timeout, tests specify their own timeouts.
- `tsconfig.json` - TypeScript config includes `tests/**/*`, so the new helper will be type-checked.
- `package.json` - Has individual `test:e2e:*` scripts for running each e2e test separately.

Key findings:
- No `tests/e2e/helpers/` directory exists yet - needs to be created.
- The string-reversal and math-workflow tests both capture output via `execSync` return value and assert on it, so the shared helper MUST return the output string (which the Jira's implementation already does).
- The quick-jira test does NOT assert on the output content - it only checks that files exist on disk. So it can ignore the return value.
- The quick-jira test has a `beforeEach` that creates a test Jira, and the `testJiraId` is used as the log file label. The other tests use fixed labels.

## Test Types And Tests We Will Be Implementing

**Test types: `unit`** (with full RED -> GREEN -> REFACTOR -> VALIDATE cycle)

### Unit Test for the shared helper (`tests/e2e/helpers/run-cli-and-log-output.test.ts`)

Since we're creating a new module (`run-cli-and-log-output.ts`), TDD requires we write a unit test for it:

1. **`should create log file at /tmp/{label}.log and return its contents`** - Call `runCliAndLogOutput("echo 'here is some test text'", "e2e-unit-test")`, verify the log file exists at `/tmp/e2e-unit-test.log` and the returned string contains "here is some test text".

Note: The e2e tests themselves serve as integration verification - after refactoring them to use the shared helper, running `pnpm test:e2e` confirms everything still works end-to-end. No separate integration/e2e test type is needed for this Jira.

## Ready for Next Step

All questions resolved, test types confirmed as `unit`. This summary is complete.

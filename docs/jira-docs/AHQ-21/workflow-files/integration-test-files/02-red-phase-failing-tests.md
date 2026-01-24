# RED Phase Complete: AHQ-21 (integration test)

**Jira**: [AHQ-21](https://agentic-hq.atlassian.net/browse/AHQ-21)
**Test Type**: integration
**Phase**: RED (Failing Test Written)
**Generated**: 2026-01-24

---

## Test Created

**File**: `tests/integration/process-control/kill-script-terminates-cli-process.integration.test.ts`
**Fixture**: `tests/integration/process-control/fixtures/fake-claude-cli.triggers-kill-script.fixture.ts`
**Tests**: Verifies that `kill-current-cli-process.sh` correctly terminates its parent process when called with $PPID

**Failure Output** (timeout expected - kill script is disabled for RED phase):
```
FAIL  tests/integration/process-control/kill-script-terminates-cli-process.integration.test.ts > kill-current-cli-process.sh > should terminate the parent process when called with $PPID
AssertionError: Test timed out after 30 seconds. This means the kill script did not terminate the fixture.
expected true to be false
```

**Why this is correct RED phase failure:**
- The kill script at `tools/scripts/process-control/unix/kill-current-cli-process.sh` has a TDD blocker that exits early
- The test correctly detects that the fixture was NOT killed (it timed out instead)
- GREEN phase will remove the blocker and enable the actual kill functionality

---

## Files Created/Modified

- `tests/integration/process-control/kill-script-terminates-cli-process.integration.test.ts` - Integration test using node-pty
- `tests/integration/process-control/fixtures/fake-claude-cli.triggers-kill-script.fixture.ts` - Fake CLI fixture that calls the kill script
- `vitest.integration.config.ts` - Vitest configuration for integration tests
- `package.json` - Added `test:integration` and `test:integration:kill-script` scripts

**Note**: The kill script already exists but has a RED phase blocker - that's GREEN phase work to remove.

---

## Blocker Encountered & Resolved

During RED phase, encountered `posix_spawnp failed` error from node-pty due to pnpm not preserving execute permissions on native binaries. This was split out and fixed in [AHQ-23](https://agentic-hq.atlassian.net/browse/AHQ-23).

---

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-commands:workflow:jira-story-workflow:03-jira-minimal-implementation AHQ-21 integration
```

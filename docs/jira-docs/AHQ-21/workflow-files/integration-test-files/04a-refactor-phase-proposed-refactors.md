# REFACTOR Analysis: AHQ-21 (integration test)

**Jira**: [AHQ-21](https://agentic-hq.atlassian.net/browse/AHQ-21)
**Test Type**: integration
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-01-24

---

## Guidance for Human Reviewer

### The "Has It Earned It?" Question

Before approving Tier 2 refactors, ask yourself:
- **Is this code stable?** Will it change significantly in the next few stories?
- **Is this pattern repeated?** Rule of Three - only abstract when pattern appears 3+ times
- **Is this code important?** Is it core functionality or a one-off utility?
- **Will this abstraction be used?** Or is it speculative "just in case" design?

---

## Pre-Refactor Test Status

**Command**: `pnpm test:integration`
**Result**: PASSING (1 test)

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) |
|---|------|-------------|---------|
| 1.1 | Extract constants | Extract magic numbers: `5000` → `TEST_TIMEOUT_BUFFER_SECONDS`, `1000` → `MILLISECONDS_PER_SECOND`, add `WHOLE_TEST_TIMEOUT_SECONDS` | `kill-script-terminates-cli-process.integration.test.ts` |
| 1.2 | Extract constant | Extract magic number `130` (SIGINT exit code) to `SIGINT_EXIT_CODE` | `fake-claude-cli.triggers-kill-script.fixture.ts` |

---

### Details for 1.1:

**File**: `tests/integration/process-control/kill-script-terminates-cli-process.integration.test.ts`

**Current code (lines 31 and 102):**
```typescript
const FAKE_CLAUDE_KILL_TIMEOUT_SECONDS = 30;

// ... later at end of test:
}, FAKE_CLAUDE_KILL_TIMEOUT_SECONDS * 1000 + 5000); // Test timeout slightly longer than our internal timeout
```

**Refactored code:**
```typescript
/**
 * Conversion factor for seconds to milliseconds.
 */
const MILLISECONDS_PER_SECOND = 1000;

/**
 * Timeout in seconds to wait for the fake CLI to be killed.
 * If the kill script works, it should happen almost instantly.
 * 30 seconds provides a safe margin while still being reasonable for CI.
 */
const FAKE_CLAUDE_KILL_TIMEOUT_SECONDS = 30;

/**
 * Buffer time (in seconds) added to Vitest test timeout beyond internal timeout.
 * Ensures Vitest doesn't kill the test before our internal timeout handler runs.
 */
const TEST_TIMEOUT_BUFFER_SECONDS = 5;

/**
 * Total Vitest test timeout = internal timeout + buffer.
 */
const WHOLE_TEST_TIMEOUT_SECONDS = FAKE_CLAUDE_KILL_TIMEOUT_SECONDS + TEST_TIMEOUT_BUFFER_SECONDS;

// ... internal timeout (line 75):
}, FAKE_CLAUDE_KILL_TIMEOUT_SECONDS * MILLISECONDS_PER_SECOND);

// ... vitest test timeout (line 102):
}, WHOLE_TEST_TIMEOUT_SECONDS * MILLISECONDS_PER_SECOND);
```

**Why this is a valid refactor:**
- Magic numbers `5000` and `1000` extracted to named constants
- All timeout values defined together at top with clear relationships
- Test timeout lines are now simple and self-documenting
- Easy to understand: whole test timeout = kill timeout + buffer

---

### Details for 1.2:

**File**: `tests/integration/process-control/fixtures/fake-claude-cli.triggers-kill-script.fixture.ts`

**Current code (lines 48-50):**
```typescript
process.on('SIGINT', () => {
  process.exit(130); // 128 + 2 (SIGINT) = standard exit code for SIGINT
});
```

**Refactored code:**
```typescript
/**
 * Standard Unix exit code for SIGINT termination.
 * Convention: 128 + signal number. SIGINT = signal 2, so 128 + 2 = 130.
 */
const SIGINT_EXIT_CODE = 130;

// ... later in the handler:
process.on('SIGINT', () => {
  process.exit(SIGINT_EXIT_CODE);
});
```

**Why this is a valid refactor:**
- Magic numbers should be named constants (basic code quality)
- The comment already explains what 130 means - a constant makes it self-documenting
- Common Unix convention that's worth making explicit

---

## Tier 2: Proposed Refactors (Require Approval)

> No Tier 2 refactors identified. The code structure is appropriate for its purpose.

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 2 |
| Tier 2 (Pending approval) | 0 |
| **Total proposed** | 2 |

---

## Next Steps

1. The Tier 1 refactors will be auto-executed (extract magic numbers to constants)
2. Run the execute command:
```
/agentic-hq-commands:workflow:jira-story-workflow:04b-jira-refactor-execute AHQ-21 integration
```

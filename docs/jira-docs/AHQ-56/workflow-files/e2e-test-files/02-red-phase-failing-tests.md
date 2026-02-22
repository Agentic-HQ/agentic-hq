# RED Phase Complete: AHQ-56 (e2e test)

**Jira**: [AHQ-56](https://agentic-hq.atlassian.net/browse/AHQ-56)
**Test Type**: e2e
**Phase**: RED (Failing Test Written)
**Generated**: 2026-02-21

---

## Test Created

**File**: `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts`
**Tests**: Verifies the full end-to-end flow: running `agentic-hq --workflow-command-supplier=/agentic-hq-demos-plugin:string-reversal -- --string-to-reverse="this is a test string"` and confirming the output contains `"gnirts tset a si siht"`.

**Failure Output** (assertion error expected - empty placeholder CLI on PATH):
```
AssertionError: expected 'This is the Agentic HQ CLI app: orche…' to contain 'gnirts tset a si siht'

- Expected
+ Received

- gnirts tset a si siht
+ This is the Agentic HQ CLI app: orchestrating your agentic software development team. Check https://agentichq.ai for more information.
```

The `agentic-hq` command on PATH is the empty placeholder installed from npmjs.org. It doesn't process any workflow - just prints a placeholder message. The test correctly fails because the output doesn't contain the reversed string.

---

## Files Created

- `tests/e2e/demo/agentic-hq-cli-string-reversal.e2e.test.ts` - E2E test that calls `agentic-hq` CLI and asserts reversed string output

## Files Modified

- `package.json` - Added `test:e2e:agentic-hq-cli-string-reversal` script

**Note**: No skeleton/implementation files created in RED phase - that's GREEN phase work.

## Ready for GREEN Phase

Run the next command to implement code to pass this test:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation AHQ-56 e2e
```

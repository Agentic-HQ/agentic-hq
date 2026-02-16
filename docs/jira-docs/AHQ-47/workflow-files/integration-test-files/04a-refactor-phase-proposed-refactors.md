# REFACTOR Analysis: AHQ-47 (integration test)

**Jira**: [AHQ-47](https://agentic-hq.atlassian.net/browse/AHQ-47)
**Test Type**: integration
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-02-16

---

## Pre-Refactor Test Status

**Command**: `pnpm test:integration:real-claude-self-termination-skill`
**Result**: PASSING (1 test, 18.76s)

---

## Magic Constants Audit

The GREEN phase touched 6 files. Here is the audit:

### ClaudeCodeTool.ts (the only TypeScript implementation file modified)

| File | Line | Value | Status | Constant Name |
|------|------|-------|--------|---------------|
| `ClaudeCodeTool.ts` | 39 | `'.agentic-hq/plugins/agentic-hq-core-plugin'` | EXTRACTED | `AGENTIC_HQ_CORE_PLUGIN_DIR` |

All other constants in this file were already extracted before the GREEN phase. The GREEN phase added exactly ONE constant and ONE line change (line 113). Clean.

### Integration Test File

| File | Line | Value | Status | Constant Name |
|------|------|-------|--------|---------------|
| `real-claude-self-termination-skill.integration.test.ts` | 27 | `30_000` | EXTRACTED | `TEST_TIMEOUT_MS` |
| `real-claude-self-termination-skill.integration.test.ts` | 33-34 | `'/agentic-hq-commands:...'` | EXTRACTED | `SELF_TERMINATE_SKILL_COMMAND` |
| `real-claude-self-termination-skill.integration.test.ts` | 44 | `'Unused command input string'` | BORDERLINE | See note below |

**Note on `'Unused command input string'`**: This string is self-documenting (it literally says what it is). The same pattern exists in the older `real-claude-self-termination.integration.test.ts` at line 44. Extracting to a constant like `UNUSED_COMMAND_INPUT` adds no clarity since the string already describes itself. However, if we do extract it, both tests should be consistent.

### Non-TypeScript Files (markdown, JSON, shell script)

| File | Status | Notes |
|------|--------|-------|
| `plugin.json` | N/A | JSON metadata - no code constants to extract |
| `SKILL.md` | N/A | Uses `{skill-base-dir}` variable pattern correctly |
| `kill-current-cli-process.sh` | N/A | Exact copy of existing script - not modified in GREEN |
| `just-self-terminate-using-skill.md` | N/A | Command template for AI - no TypeScript constants |

---

## Tier 1: Auto-Approved Refactors

> No Tier 1 refactors identified. Code is already clean at this level.

**Justification**: The GREEN phase was truly minimal:
- `ClaudeCodeTool.ts`: Added 1 well-named constant + 1 line change. All magic values already extracted from prior work.
- Integration test: Follows exact pattern of existing test, all values extracted to constants.
- Other files: JSON metadata, markdown templates, and a shell script copy - none contain extractable magic constants.

The one borderline item (`'Unused command input string'`) is self-documenting and matches the pattern in the existing older test. Extracting it would add noise without improving clarity.

---

## Tier 2: Proposed Refactors (Require Approval)

> No Tier 2 refactors identified.

**Note on deferred Jira items**: The GREEN implementation plan noted items 10-12 from the Jira were deferred:
- Move `steve-test-plugin` from `plugins/` to `.agentic-hq/plugins/`
- Update `marketplace.json` references
- Add deprecation warnings to old script and old test

These are **new work/features**, NOT refactors of the GREEN phase code. They don't improve the structure of existing code - they add new functionality. They should be handled as separate tasks or a follow-up Jira, not in the REFACTOR phase of TDD.

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 0 |
| Tier 2 (Pending approval) | 0 |
| **Total proposed** | 0 |

---

## Analysis Result: No Refactors Needed

The code created in the GREEN phase is already clean:
- ZERO (or borderline 1 self-documenting) magic constants - all values extracted to named constants
- No duplication detected within the new files
- Names are clear and descriptive (e.g., `AGENTIC_HQ_CORE_PLUGIN_DIR`, `SELF_TERMINATE_SKILL_COMMAND`)
- No obvious code smells
- No structural improvements warranted at this stage (Rule of Three not met for any abstractions)

**Recommendation**: Skip the refactor execute phase and proceed to VALIDATE.

---

## Next Steps

Since no refactors are needed, proceed directly to verification:
```
/agentic-hq-commands:used-in-demos:full-jira-tdd-story-workflow:05-jira-validate AHQ-47 integration
```

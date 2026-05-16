# VALIDATE Phase: AHQ-136

**Jira**: [AHQ-136](https://agentic-hq.atlassian.net/browse/AHQ-136)
**Phase**: VALIDATE (Pre-Commit Quality Gate)
**Generated**: 2026-05-16

---

## Test Types Completed

| Test Type | RED | GREEN | REFACTOR | Status |
|-----------|-----|-------|----------|--------|
| Unit | - | - | - | Skipped (not applicable — config-only upgrade) |
| Integration | - | - | - | Skipped (not applicable) |
| Smoke | - | - | - | Skipped (not applicable) |
| E2E | - | - | - | Skipped (not applicable) |
| Manual | ✅ | ✅ | ✅ | Complete (human-verified) |

AHQ-136 specifies `test-type = manual`. It is a config-only package-manager upgrade
(pnpm 10 → 11) with no production code, no classes and no behaviour change — so there
are no automated tests for this Jira. RED recorded the manual-testing decision, GREEN
implemented the config edits and the human verified the manual checklist, and REFACTOR
(04a/04b) executed zero refactors (the one AI-identified Tier 2 item was REJECTed by the
human).

---

## Full Validation Results

**Validation Level**: Option 1 — Lite

For test type `manual` there is no `pnpm test:manual` suite and no Jira-specific automated
test file, so Lite validation here is `pnpm validate` only.

### pnpm validate (typecheck + lint + format check + unit tests)

**Command**: `pnpm validate`
**Result**: ✅ PASS

| Check | Result | Details |
|-------|--------|---------|
| TypeCheck (`tsc --noEmit`) | ✅ | No type errors |
| Lint (`eslint .`) | ✅ | No lint errors |
| Format (`prettier . --check`) | ✅ | All matched files use Prettier code style |
| Unit Tests (`vitest run`) | ✅ | 146/146 passing (32 test files) |

### Integration Tests

**Command**: `pnpm test:integration`
**Result**: ⏭️ SKIPPED (credit saving — run manually with `pnpm test:integration`)
**Details**: N/A — no integration tests authored for this Jira (`manual` test type).

### Smoke Tests

**Command**: `pnpm test:smoke`
**Result**: ⏭️ SKIPPED (credit saving — run manually with `pnpm test:smoke`)
**Details**: N/A — no smoke tests authored for this Jira (`manual` test type).

### E2E Tests

**Command**: `pnpm test:e2e`
**Result**: ⏭️ SKIPPED (credit saving — run manually with `pnpm test:e2e`)
**Details**: N/A — no e2e tests authored for this Jira. Note: the 5 existing
`tests/e2e/demo/*.e2e.test.ts` files had their PNPM_HOME PATH fallback edited by AHQ-136
(`$PNPM_HOME` → `$PNPM_HOME/bin`); those edits were re-verified by typecheck + lint +
format above. The e2e suite itself is gated behind a real Claude invocation and was not
run here per the Lite validation level.

---

## Acceptance Criteria Verification

The Jira acceptance criteria for a `manual`-test config upgrade are verified by the
GREEN-phase manual verification table (`manual-test-files/03-green-phase-summary-of-what-was-implemented.md`),
human-confirmed on 2026-05-16. AC4 (`pnpm validate`) is additionally re-verified by this
VALIDATE run.

| # | Acceptance Criterion | Test Coverage | Status |
|---|---------------------|---------------|--------|
| 1 | `package.json` `packageManager` updated to `pnpm@11.x` latest patch | Manual: GREEN table — `pnpm -version` → `11.1.2` | ✅ |
| 2 | `pnpm-workspace.yaml` migrated `onlyBuiltDependencies:` → `allowBuilds:` (same packages), doc-comment updated to pnpm 11 | Manual: GREEN summary "Files Modified"; verified by `pnpm install` | ✅ |
| 3 | `pnpm install` succeeds cleanly, no `onlyBuiltDependencies`-removed warnings | Manual: GREEN table — clean install confirmed | ✅ |
| 4 | `pnpm validate` passes (typecheck + lint + format + unit tests) | **This VALIDATE run** — `pnpm validate` ✅ PASS (146/146) | ✅ |
| 5 | `install-dev-agentic-hq.sh` re-runs successfully; `agentic-hq` CLI works from a fresh terminal in any directory | Manual: GREEN table — script clean, `which agentic-hq` + `agentic-hq list` ✅ | ✅ |
| 6 | One workflow smoke-tested end-to-end (`agentic-hq reversal`) | Manual: GREEN table — `reversal` → `tset ekoms edargpu` ✅ | ✅ |
| 7 | No "Update available!" nag printed during workflow runs | Manual: GREEN table — nag absent ✅ | ✅ |
| 8 | `pnpm link --global` script tweak documented in `install-dev-agentic-hq.sh` comments | Manual: GREEN summary — `pnpm link --global` → `pnpm add -g .`, header comment + output rewritten for pnpm 11 | ✅ |
| 9 | pnpm 11 is the corepack **global default** (`cd /tmp; pnpm list -g` lists `agentic-hq`) | Manual: GREEN table — `corepack install -g pnpm@11.1.2`; `cd /tmp; pnpm -version` → `11.1.2`, `pnpm list -g` lists `agentic-hq@0.1.0` ✅ | ✅ |

**Additional human-run smoke test during VALIDATE (2026-05-16):**

The maintainer ran a workflow end-to-end from a brand-new throwaway workspace outside the
repo, confirming the corepack global default (AC9) and end-to-end workflow run (AC6) once
more:

```
mkdir /tmp/tmp-test-ws-001
cd /tmp/tmp-test-ws-001
agentic-hq math -- --input-number=100
```

Result: worked fine — `Output number: 40.6`. Confirms `agentic-hq` resolves and runs a
workflow correctly under pnpm 11 from a fresh directory with no `packageManager` pin.

**Additional in-scope deliverables verified (from the AI summary, beyond the AC list):**

- 6 × `ts-workflow` sub-projects migrated — dead `pnpm.onlyBuiltDependencies` block removed,
  per-directory `pnpm-workspace.yaml` with `allowBuilds:` map added (the 6th fixture
  sub-project was found mid-GREEN and migrated). Verified by GREEN install of each.
- `create-workflow` Command 02 (`02-confirm-spec-approved-and-build.md`) updated to scaffold
  a `pnpm-workspace.yaml` for new workflows. AHQ-136's remit is the **edit only**;
  end-to-end scaffolding verification is owned by [AHQ-143](https://agentic-hq.atlassian.net/browse/AHQ-143).

**All Acceptance Criteria Met**: ✅ YES

---

## Design Requirements Compliance

**Audit Completed In**: `manual-test-files/04a-refactor-phase-proposed-refactors.md`
(section "Project Design Requirements Compliance Audit")

**Design Requirements File**: `docs/dev/project-design-requirements.md` (found at the
default location).

**Result**: 0 of 8 requirements MET, 0 PARTIALLY MET, 0 NOT MET, **8 NOT APPLICABLE**.

The design requirements document is entirely about object-oriented design of the codebase
(class/interface pairs, "tell don't ask", constructor injection, Concept Table / Data
Dictionary artefacts). AHQ-136 introduces no new code, no classes, no interfaces and no
concepts — it edits config files and regenerates lockfiles. Every requirement is therefore
genuinely NOT APPLICABLE, not skipped by oversight (the GREEN plan reached the same
conclusion independently). No NOT MET items, so no refactoring proposals arose.

**Final Compliance Status**: ✅ All requirements addressed (8/8 NOT APPLICABLE — nothing
deferred).

---

## Summary

| Category | Status |
|----------|--------|
| Full Validation (`pnpm validate`) | ✅ |
| Integration Tests | ⏭️ (N/A — no tests for this Jira) |
| Smoke Tests | ⏭️ (N/A — no tests for this Jira) |
| E2E Tests | ⏭️ (N/A — no tests for this Jira) |
| Acceptance Criteria | ✅ (9/9 verified) |
| Design Requirements | ✅ (8/8 NOT APPLICABLE) |
| **Ready for Commit** | ✅ YES |

---

## Commit-Hygiene Flag (carried over from 04a P.5 / 04b)

The working tree contains a modified
`.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/01-jira-read-and-question.md`
that is **unrelated to the pnpm upgrade** (it adds `AskUserQuestion` guidance to the
workflow command). This was flagged in 04a (P.5) and 04b as a human decision: decide
whether that edit belongs to a different Jira / separate commit, or revert it, **before**
running `/commit` — so it is not committed silently as part of AHQ-136.

This does not affect validation status — it is a commit-scope decision, not a quality gate
failure.

---

## Next Steps

Story AHQ-136 is complete and ready for commit. Before committing, decide what to do with
the unrelated `01-jira-read-and-question.md` working-tree change (see Commit-Hygiene Flag
above), then run:

```
/agentic-hq-commands:commit
```

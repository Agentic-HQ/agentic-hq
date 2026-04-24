# REFACTOR Complete: AHQ-120 (e2e test)

**Jira**: [AHQ-120](https://agentic-hq.atlassian.net/browse/AHQ-120)
**Test Type**: e2e
**Phase**: REFACTOR (Complete)
**Generated**: 2026-04-24 22:18

---

## Refactoring Summary

| Category      | Count | Executed | Skipped | Failed |
|---------------|-------|----------|---------|--------|
| Tier 1 (Auto) | 1     | 1        | 0       | 0      |
| Tier 2 (Agreed) | 7   | 4*       | 3       | 0      |
| **Total**     | 8     | 5*       | 3       | 0      |

\* 2.4 and H.2 are counted as a single merged execution (H.2 was explicitly merged into 2.4's scope during review).

---

## Tier 1 Refactors Executed

| #   | Type                       | Description                                                                                                                                                                                                  | Result  |
|-----|----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------|
| 1.1 | Remove small duplication   | Dropped the `LOG_FILE_LABEL` constant and the path re-derivation inside `runCliAndLogOutputLocal`. `LOG_FILE_PATH` is now a hardcoded single source of truth; the helper takes a full path instead of a label. | Success |

---

## Agreed Tier 2 Refactors

| #   | Source | Description                                                                                                                                                                                                                                                      | Decision           | Result           |
|-----|--------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------|------------------|
| 2.1 | AI     | Create `README.md` for the 002 override project.                                                                                                                                                                                                                 | EXECUTE            | Success          |
| 2.2 | AI     | Create minimal `eslint.config.js` for 002.                                                                                                                                                                                                                       | SKIP               | Not executed     |
| 2.3 | AI     | Create prettier config for 002.                                                                                                                                                                                                                                  | SKIP               | Not executed     |
| 2.4 | AI     | Review how-to-create-your-own-classwitch-override-project.md (generic filter); address commander-transitive, no eslint/prettier section, no generic e2e section, `/path/to/` placeholder wording, spawn-helper gotcha (H.2).                                     | EXECUTE            | Success          |
| 2.5 | AI     | Extend `pnpm validate` in 002 to include `test:e2e`.                                                                                                                                                                                                             | SKIP               | Not executed     |
| H.1 | Human  | Add `.pnpm`-qualified `postinstall chmod +x spawn-helper` hook to 002's `package.json`.                                                                                                                                                                          | EXECUTE            | Success          |
| H.2 | Human  | Document the spawn-helper gotcha in the how-to guide.                                                                                                                                                                                                            | EXECUTE (merged into 2.4) | Success (via 2.4) |

---

## Post-Refactor Test Status

**Commands (run in `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/`)**:

- `pnpm validate` → PASSING (typecheck + 2/2 unit tests, ~0.4s)
- `pnpm test:e2e` → PASSING (1/1 e2e test, ~4.8s)

> NOTE: Running all e2e tests across the main agentic-hq repo has been skipped to conserve Claude Code plan credits. Only the specific e2e test file for this Jira (`tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts` in 002) was run to confirm GREEN. The 002 override project's full `pnpm test:e2e` suite only contains this one test anyway, so there is no meaningful gap here.

Post-install hook verified separately: `pnpm install` in 002 was run once after adding the hook; it fired the `chmod +x …/spawn-helper 2>/dev/null || true` line cleanly (exit 0) and the subsequent e2e test passed.

---

## Code Changes Made

### Files Modified:

- `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts` — Refactor 1.1: removed `LOG_FILE_LABEL`, hardcoded `LOG_FILE_PATH`, changed `runCliAndLogOutputLocal` signature from `logFileLabel: string` → `logFile: string` and removed the internal `path.join` re-derivation.
- `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/package.json` — Refactor H.1: added `"// POSTINSTALL"` comment and `"postinstall": "chmod +x node_modules/.pnpm/node-pty@*/node_modules/node-pty/prebuilds/darwin-*/spawn-helper 2>/dev/null || true"` script.
- `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` — Refactor 2.4+H.2: (i) removed `commander` from the Step 1 sample `package.json` and added a "Why no commander dependency?" note; (ii) changed the `file:../path/to/…` placeholder wording to `file:<path-to-…>` with angle brackets and a clarifying line underneath; (iii) added a `postinstall chmod +x` line to Step 1's sample `package.json` with a "Why the postinstall chmod +x?" explanation; (iv) added a new `## Not covered by this guide` section with bullets on linting/formatting and end-to-end testing (with a REFACTOR TODO comment for the generic e2e-scaffolding section); (v) added a new Troubleshooting entry `### Error: posix_spawnp failed.` keyed on the visible error text.

### Files Created:

- `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/README.md` — Refactor 2.1: covers project purpose (TEMP practice, not for publishing, precursor to AHQ-121/122), how to run the CLI via `install-dev-*.sh`, unit/e2e test commands, `pnpm validate` scope (deliberately excludes e2e per AHQ-79), brief classwitch-override explanation linking to the how-to guide, and the AHQ-79 smelly-install caveat.

### Files Deleted:

None.

---

## Ready for VALIDATE Phase

Refactoring is complete. Now verify all tests pass:

```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:05-jira-validate AHQ-120 e2e
```

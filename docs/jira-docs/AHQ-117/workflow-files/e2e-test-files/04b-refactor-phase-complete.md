# REFACTOR Complete: AHQ-117 (e2e test)

**Jira**: [AHQ-117](https://agentic-hq.atlassian.net/browse/AHQ-117)
**Test Type**: e2e
**Phase**: REFACTOR (Complete)
**Generated**: 2026-04-22

---

## Refactoring Summary

| Category           | Count | Executed | Skipped | Failed |
| ------------------ | ----- | -------- | ------- | ------ |
| Tier 1 (Auto)      | 1     | 1        | 0       | 0      |
| Tier 2 (Agreed)    | 5     | 5        | 0       | 0      |
| **Total**          | 6     | 6        | 0       | 0      |

---

## Tier 1 Refactors Executed

| #   | Type                  | Description                                                                                                                                                          | Result  |
| --- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1.1 | Use existing constant | `src/cli/app.ts` lines 63, 65 — replaced the two `'AGENTIC_HQ_WORKSPACE_ROOT'` string literals with the exported `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` constant. | Success |

---

## Agreed Tier 2 Refactors

| #   | Source    | Description                                                                                                                                                                                                                                                                   | Decision | Result  |
| --- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| 2.1 | AI        | Added ESLint `no-restricted-syntax` rule in `eslint.config.mjs` forbidding direct `new DefaultX()` for the 6 registered services in `src/` (exempting `src/classwitch-registry/`; tests scoped out by the existing test-files block). Rule verified to fire + to respect the exemption. | EXECUTE  | Success |
| 2.2 | AI        | Wrote `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` — full how-to covering service-name convention, load-bearing import order, env-var footgun, optional-default constructors, `allowImportingTsExtensions`, services table, worked example via the temp override project. | EXECUTE  | Success |
| 2.3 | AI        | Added a new **"Extending via Classwitch Override Projects"** section to `README.md` linking to the new how-to guide. Avoids duplicating the services table.                                                                                                                   | EXECUTE  | Success |
| 2.4 | AI        | Wrote `docs/jira-docs/AHQ-117/draft-future-jiras/classwitch-jira-draft-for-fixes-and-improvements-to-classwitch-how-to-guide.md`. Mid-execution the human decided to do the work now rather than defer, so the draft was rewritten to describe what was committed to classwitch. | EXECUTE (modified) | Success |
| 2.5 | AI        | Removed the `// Loads <DefaultClassName> (default)` trailing-comment convention from all 6 `loadClass` call sites in `src/`; deleted `memory/feedback_classwitch_loadclass_trailing_comment.md`; removed its pointer from `MEMORY.md`. Classwitch-side guide edits landed on a separate classwitch-repo commit.                                                                  | EXECUTE  | Success |

---

## Classwitch-side work (separate repo, separate commit)

Refactor 2.4 was upgraded from "draft for future Jira" to "do it now" mid-execute at the human's direction. All 6 items the draft had captured were implemented in the classwitch repo and landed as a single commit:

- **Classwitch commit**: `f31b132` on `classwitch/main` — `AHQ-127 - Improve how-to-guide based on AHQ-117 conversion feedback`
- **File changed**: `classwitch/docs/how-to-guides/how-to-convert-project-to-root-classwitch-project.md` (+107/-46)
- **Jira to file**: AHQ-127 (draft description is in `docs/jira-docs/AHQ-117/draft-future-jiras/classwitch-jira-draft-for-fixes-and-improvements-to-classwitch-how-to-guide.md` — paste it in when creating the real Jira).

The classwitch-side commit is entirely separate from AHQ-117's agentic-hq commit — they do not mix.

---

## Post-Refactor Test Status

**agentic-hq unit + typecheck + lint**: `pnpm validate` → **131/131 passing**, 0 type errors, 0 lint errors.

**Primary e2e (manual — AHQ-117's acceptance test)**:
```
cd /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours
node bin/temp-agentic-hq-with-colours.cjs list
```
Output contains all three ANSI colour wrappers: `\x1b[32m` (green header), `\x1b[34m` (blue AHQ section), `\x1b[31m` (red user section). The override class is flowing through classwitch into `app.run()` correctly.

**Override-project validate**: `pnpm validate` in the temp override project → **1/1 passing**, 0 type errors.

**Regression e2e** (`test:e2e:cross-workspace-list-workflows`, `test:e2e:cross-workspace-demo-math-workflow`): not re-run per command guidance (conserves Claude Code plan credits). GREEN-phase summary recorded both as passing immediately before REFACTOR started; no code paths those tests exercise were changed in REFACTOR.

---

## Code Changes Made

### Files Modified (agentic-hq, uncommitted)

- `src/cli/app.ts` — 1.1 (env-var constant), 2.5 (removed trailing comment).
- `src/kernel/composition-root.ts` — 2.5 (removed trailing comments on both `loadClass` lines).
- `src/workflow/claude/claude-workflow-command-builder.ts` — 2.5.
- `src/workflow/workflow-command/default-workflow-command.ts` — 2.5.
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` — 2.5.
- `eslint.config.mjs` — 2.1 (new `no-restricted-syntax` rule + block comment explaining scope).
- `README.md` — 2.3 (new "Extending via Classwitch Override Projects" section).

### Files Created (agentic-hq, uncommitted)

- `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` — 2.2.
- `docs/jira-docs/AHQ-117/draft-future-jiras/classwitch-jira-draft-for-fixes-and-improvements-to-classwitch-how-to-guide.md` — 2.4 (rewritten to describe the AHQ-127 commit).

### Files Deleted

- `/Users/stevepersonal/.claude/projects/-Users-stevepersonal-dev-agentic-hq-agentic-hq/memory/feedback_classwitch_loadclass_trailing_comment.md` — part of 2.5 (user-memory, not tracked in git).

### Classwitch-side (already committed on classwitch main)

- `classwitch/docs/how-to-guides/how-to-convert-project-to-root-classwitch-project.md` — commit `f31b132`, AHQ-127.

---

## Ready for VALIDATE Phase

Refactoring is complete. Agentic-hq-side changes are staged for the AHQ-117 commit but not yet committed — the user's `/commit` flow handles that after VALIDATE. Now verify all tests pass:

```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:05-jira-validate AHQ-117 e2e
```

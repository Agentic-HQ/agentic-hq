# AHQ-131 — Summary Of What Was Done

**Jira:** [AHQ-131 — Remove classwitch Related Plugins, Workflows, Docs And Changes](https://agentic-hq.atlassian.net/browse/AHQ-131)
**Companion docs:** [`01-summary-and-questions.md`](01-summary-and-questions.md) (research + Q&A) and [`02-verbtim-approved-plan-copy.md`](02-verbtim-approved-plan-copy.md) (the approved 13-step plan, byte-identical copy of `~/.claude/plans/ok-i-ve-switched-to-parallel-garden.md`).

This doc records what actually happened when the plan was executed, including one beyond-plan deviation and a couple of notes.

---

## Mapping: Plan Steps → Outcomes

| Step | Action | Outcome |
|---|---|---|
| 0 | Copy plan to `docs/jira-docs/AHQ-131/verbtim-approved-plan-copy.md` (typo intentional) | Done. Now renamed to `02-verbtim-approved-plan-copy.md`. |
| 1 | Verify archive branch reachable on local + origin | ✓ Both shas matched: `06d3b2f6ed89b89f4eabb69aeb00c7c6e594c3eb` |
| 2 | `rm -rf .agentic-hq/plugins/agentic-hq-classwitch-plugin/` | ✓ 27 files deleted (plugin manifest, both skills, both `commands/` folders, both `ts-workflow/` trees, sample docs) |
| 3 | `rm -rf docs/workflow-creation-docs/` | ✓ 11 files deleted (the `agentic-hq-classwitch-plugin/` planning artifacts — only subdir present) |
| 4 | `rm docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` | ✓ Deleted. **Note:** `docs/dev/how-to-guides/` is now empty; git doesn't track empty dirs so it won't appear in commits. Left in place per plan scope. |
| 5 | Variable + path rename across 5 `create-workflow` command files | ✓ `workflow-creation-docs-dir` → `workflow-creation-artifacts-dir` everywhere; RHS path → `{project-root}/docs/artifacts/workflow-creation-artifacts/{plugin-id}/{workflow-id}`. **Plan correction:** plan said file 05 had no `=` definition line — actually it did (line 35), and was renamed correctly. |
| 6 | Delete `Classwitch Root Project pattern.` bullet in `docs/dev/how-agentic-hq-works.md` | ✓ Lines 331–341 removed; the `Env-var workspace root.` bullet immediately after was preserved. |
| 7 | Rewrite headers in `src/cli/main.ts`, `src/cli/app.ts`, `src/cli/agentic-hq-program.ts` | ✓ All three replaced with generic test-seam justifications (Q5 Option B). |
| 8 | Update `README.md` line 15 + delete classwitch listing at lines 165–170 | ✓ Both done. |
| 9 | Delete `docs/README.md` line 52 (`workflow-creation-docs/` listing) | ✓ Done. |
| 10 | `pnpm validate` | ✓ Typecheck + lint + format + 131/131 unit tests, all green. |
| 11 | Final `git grep` verification | ✓ `git grep -i classwitch` outside the allow-list (`docs/jira-docs/`, `temp-test-workspaces/`, README.md archive-pointer) returned zero. `git grep workflow-creation-docs` outside `docs/jira-docs/` and `.agentic-hq/temp/git-diffs/` returned zero. |
| 12 | Tell user to run `/commit` for AHQ repo | ✓ User ran `/commit` (or will). No `git add`/`git commit`/`git push` from me. |
| 13 | Add ABANDONED banner to classwitch repo `README.md` | ✓ Banner prepended; classwitch repo has only `README.md` modified, awaiting separate `/commit` from that working directory. |

---

## Beyond-Plan: `bin/agentic-hq.cjs`

The plan's enumeration of files-with-classwitch-framing missed `bin/agentic-hq.cjs`. The Step 11 `git grep` sweep caught three classwitch references in this file. Treatment matched the spirit of Step 7:

- **Comment block above `cliPath = ...` (lines 15–20 in original):** classwitch-only justification of the `main.ts` shape — deleted in full. The next line (`const cliPath = path.join(...)`) is self-explanatory without it.
- **`AGENTIC_HQ_WORKSPACE_ROOT` REFACTOR note (lines 25–31 in original):** preserved per the user's "don't delete REFACTOR comments" rule. Only the trailing `**Also** when a Classwitch Override Project overrides this Classwitch Root Project there are complication...` sentence — which described a complication that no longer exists — was dropped.

Re-ran `pnpm validate` after the bin edits: still 131/131 green.

---

## Files Touched (final tally)

**AHQ repo deletions (39 files):**
- `.agentic-hq/plugins/agentic-hq-classwitch-plugin/` — entire tree (27 files)
- `docs/workflow-creation-docs/` — entire tree (11 files)
- `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` (1 file)

**AHQ repo edits (12 files):**
- `README.md`
- `docs/README.md`
- `docs/dev/how-agentic-hq-works.md`
- `bin/agentic-hq.cjs` *(beyond-plan)*
- `src/cli/main.ts`
- `src/cli/app.ts`
- `src/cli/agentic-hq-program.ts`
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md`
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md`
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/03-run-checks-on-workflow.md`
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/04-document-workflow.md`
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/05-get-human-to-test-workflow.md`

**AHQ repo new files (this Jira's docs):**
- `docs/jira-docs/AHQ-131/01-summary-and-questions.md`
- `docs/jira-docs/AHQ-131/02-verbtim-approved-plan-copy.md`
- `docs/jira-docs/AHQ-131/03-summary-of-what-was-done.md` *(this file)*

**AHQ repo seen-as-modified-but-pre-existing-manual-edit:**
- `docs/dev/project-design-requirements.md` — Q4 in `01-summary-and-questions.md` was answered "I've edited it manually, so no further action required." That manual edit was already in the working tree before this work began; it's untouched by execution but will be picked up by the AHQ-131 `/commit`.

**Separate `classwitch` repo edits (1 file):**
- `/Users/stevepersonal/dev/agentic-hq/classwitch/README.md` — ABANDONED banner prepended at the top.

---

## Verification Results

- **`pnpm validate`** → 100% green: typecheck ✓, lint ✓, format ✓, 131/131 unit tests ✓ (run twice — once after Step 10, once after the beyond-plan `bin/agentic-hq.cjs` edits)
- **`node bin/agentic-hq.cjs list`** → runs cleanly; classwitch plugin no longer in listing; matches the updated README sample output
- **`git grep -i classwitch`** outside the allow-list → zero matches
- **`git grep workflow-creation-docs`** outside the allow-list → zero matches

The acceptance criteria added to the Jira (per Q9 in `01-summary-and-questions.md`) all hold.

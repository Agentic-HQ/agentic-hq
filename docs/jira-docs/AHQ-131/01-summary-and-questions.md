# AHQ-131 — Summary & Questions

**Jira:** [AHQ-131 — Remove classwitch Related Plugins, Workflows, Docs And Changes](https://agentic-hq.atlassian.net/browse/AHQ-131)
**Status:** In Progress
**Type:** Task
**Reporter:** Steve Halso

> **Plan changed 2026-05-10:** original plan was to *rename* the classwitch plugin/workflows to `LEGACY-*`. Revised plan is to **delete** them outright and leave a one-line pointer in the main README to the pre-deletion archive branch. This file has been rewritten against the new plan; the LEGACY-rename version is in git history if you need it.

---

## My Understanding Of The Task

Three buckets:

### 1. Delete the classwitch plugin and both its workflows

- Delete the entire `.agentic-hq/plugins/agentic-hq-classwitch-plugin/` tree (plugin manifest, both skills' `SKILL.md` / `ahq-workflow.json` / `ts-workflow/`, both `commands/` folders, sample docs).
- The pre-deletion versions are preserved on the existing archive branch [`archive/feature/ahq-123-create-classwitch-override-workflow`](https://github.com/Agentic-HQ/agentic-hq/tree/archive/feature/ahq-123-create-classwitch-override-workflow). I confirmed both local and `origin` have this branch already, so no branch-creation work is needed.

### 2. Strip classwitch from the rest of the AHQ codebase + docs

Because we are no longer converting agentic-hq itself into a "Classwitch Root Project". The pattern (tiny `main.ts` → `app.ts` with `run()`, etc.) was put in *for* classwitch override-project support. With classwitch abandoned, those comments and the `Transitional Design Notes` bullet are misleading.

**In-scope:**
- Delete `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` and references to it.
- Delete the `Classwitch Root Project pattern.` bullet in `docs/dev/how-agentic-hq-works.md` Transitional Design Notes.
- Strip classwitch framing from `src/cli/main.ts`, `src/cli/app.ts`, `src/cli/agentic-hq-program.ts` header comments.
- Handle the classwitch paragraph in `docs/dev/project-design-requirements.md`.
- Sweep the rest of `docs/` for any remaining classwitch mentions.

**Out-of-scope (left as-is):**
- Historical references in `docs/jira-docs/...` and `docs/workflow-creation-docs/agentic-hq-classwitch-plugin/...`.
- The one specific README sentence (line 15) — **kept but updated** to point at the archive branch instead of the now-deleted plugin path.

### 3. Update the separate `classwitch` repo's README

- Add a prominent `⚠️ ABANDONED` banner at the top of `/Users/stevepersonal/dev/agentic-hq/classwitch/README.md`, linking back to AHQ-131 and the *classwitchAlternatives* Confluence page.
- Committed inside the classwitch repo as a separate commit (separate Git history from the AHQ commits in this repo).

---

## What I Found On Disk

### Plugin tree to delete

`.agentic-hq/plugins/agentic-hq-classwitch-plugin/` — full deletion. Includes:
- `.claude-plugin/plugin.json`
- `commands/classwitch-converter-workflow/{01-04}.md` (4 command files)
- `commands/classwitch-override-workflow/{01-06}.md` (6 command files)
- `skills/classwitch-converter-workflow/{ahq-workflow.json,SKILL.md,ts-workflow/,docs/}` (incl. `ts-workflow/src/classwitch-converter-workflow-cli.ts` and `docs/sample-docs/SAMPLE-01-conversion-plan.DRAFT.md` and `docs/user-facing-help-doc.md`)
- `skills/classwitch-override-workflow/{ahq-workflow.json,SKILL.md,ts-workflow/,docs/}` (incl. `ts-workflow/src/classwitch-override-workflow-cli.ts` and `docs/sample-docs/SAMPLE-README.md`, `SAMPLE-override-project-spec.DRAFT.md` and `docs/user-facing-help-doc.md`)
- The two `ts-workflow/node_modules/` trees go too — they're regenerated from `package.json` if anyone ever needs them off the archive branch.

### Code refs (non-plugin) to classwitch

| File | What | Action |
|---|---|---|
| `src/cli/main.ts` | Header comment block (lines 5–19) frames the file as a Classwitch Root Project entry point. | Rewrite without classwitch framing (Q5). |
| `src/cli/app.ts` | Header comment block (lines 6–29) explains app/main split exists for Classwitch Override Projects. | Rewrite without classwitch framing (Q5). |
| `src/cli/agentic-hq-program.ts` | Header comment (lines 9–11) referencing Classwitch Root Project shape. | Rewrite without classwitch framing (Q5). |

(No `classwitch-registry/` folder exists in `src/` — it was only ever referenced as a future path inside the to-be-deleted how-to guide.)

### Docs refs (non-jira-docs, non-workflow-creation-docs) to classwitch

| File | What | Action |
|---|---|---|
| `README.md` line 15 | NOTE about the classwitch workflows being the only examples of this type. | **Kept but updated** to point at the archive branch (Q3). |
| `README.md` lines 165–170 | "Plugin: agentic-hq-classwitch-plugin" listing in the workflows section. | **Delete the listing** (plugin no longer exists). |
| `docs/dev/how-agentic-hq-works.md` lines 331–341 | `Classwitch Root Project pattern.` bullet inside Transitional Design Notes. | Delete. |
| `docs/dev/project-design-requirements.md` lines 60–75 | Paragraph framing class-extraction discipline as motivated by classwitch switchability. | Rewrite to keep the discipline message, drop the classwitch motivation (Q4). |
| `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` | Whole file. | Delete. |
| `docs/glossary.md` | No classwitch references found. | Nothing to do. |
| `.claude/settings.local.json` line 45 | `additionalDirectories` entry for `/Users/stevepersonal/dev/agentic-hq/classwitch`. | Personal config, leave alone. |

### Untouched (per Jira)

- `docs/jira-docs/AHQ-{42,91,96,104,117,120,124,128}/...` — historical planning artifacts.
- `docs/workflow-creation-docs/agentic-hq-classwitch-plugin/...` — workflow-creation planning artifacts (per Q6 below, propose: leave alone as historical).
- `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/` and `test-classwitch-override-project-002-for-ahq-120/` — local-only test fixtures (per Q7 below, propose: leave alone).
- The separate `/Users/stevepersonal/dev/agentic-hq/classwitch/` repo — README banner only (per Q8 below).

---

## Questions Before I Start

### 1. ~~LEGACY naming convention~~ — RESOLVED (no longer applicable)

Plan changed from rename to outright delete. No naming question to answer.

### 2. ~~Workflow runtime dependencies~~ — RESOLVED (no longer applicable)

Previous concern was that the override workflow read `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` at runtime. Since both the workflow **and** the file are being deleted in lockstep, there's no contradiction — the dependency disappears with the dependent.

### 3. README.md line 15 — exact replacement text

Current text:

> NOTE: The only 2 examples of this type of workflow are the [classwitch conversion workflows](.agentic-hq/plugins/agentic-hq-classwitch-plugin) which were successfully written and run to do a complex code conversion process, but since then the classwitch conversion has been abandoned, and so these aren't as relevant. The focus has mainly been on AI Developer Workflows (see above)

Proposed replacement (please tweak):

> NOTE: Two earlier examples of this type of workflow — the **classwitch conversion** and **classwitch override** workflows — have been removed from `main`. They were complex multi-step technical-process workflows that worked end-to-end (see [AHQ-117](https://agentic-hq.atlassian.net/browse/AHQ-117), [AHQ-120](https://agentic-hq.atlassian.net/browse/AHQ-120), [AHQ-123](https://agentic-hq.atlassian.net/browse/AHQ-123)), but the underlying classwitch project they targeted has been abandoned (see [AHQ-131](https://agentic-hq.atlassian.net/browse/AHQ-131) and [classwitchAlternatives](https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/57081857/classwitchAlternatives)). If you want to read or run them, check out the archive branch [`archive/feature/ahq-123-create-classwitch-override-workflow`](https://github.com/Agentic-HQ/agentic-hq/tree/archive/feature/ahq-123-create-classwitch-override-workflow). The current focus is AI Developer Workflows (see above).

OK, or want it shorter / phrased differently?

HUMAN: Looks good

### 4. `docs/dev/project-design-requirements.md` lines 60–75 — full delete or rewrite?

Currently the paragraph mashes together two ideas:

a. We are *soon* going to be using classwitch to make every concrete class switchable. → no longer true.
b. So always think "could a third party replace just one small aspect of this with their own class?" / "Tell, don't ask" / extract concepts into classes/interfaces. → still a valid coding discipline.

Options:
- **Option A:** delete the whole block (60–75) — loses the design-discipline message.
- **Option B (recommend):** rewrite to keep the "always think in extractable classes/interfaces" / "Tell, don't ask" message but drop the classwitch motivation. New justification can be testability / replaceability in isolation.
- **Option C:** something else.

HUMAN: I've edited it manually, so no further action required.

### 5. CLI source-code header comments — full delete or rewrite?

`src/cli/main.ts`, `src/cli/app.ts`, `src/cli/agentic-hq-program.ts` all have multi-line header comments framing the file shape as "Classwitch Root Project pattern". The shape itself (tiny entry → `app.run()`) is still the shape — but the *reason* for it (override projects via classwitch) no longer applies.

- **Option A:** delete the comments entirely. Risk: future maintainer wonders "why is `main.ts` only 2 lines?" and may collapse it.
- **Option B (recommend):** rewrite the comments to give a generic justification for the small entry shape (e.g. "tiny entry-point so the test surface stays at `app.ts`; deliberately separate from `main.ts` for testability") without mentioning classwitch.
- **Option C:** delete the file split entirely — collapse `main.ts` / `app.ts` / `agentic-hq-program.ts` into one or two files. *Out of scope of this Jira IMO.*

HUMAN: Option B for now, and we'll see what it looks like in the end.

### 6. Should `docs/workflow-creation-docs/agentic-hq-classwitch-plugin/` stay?

This directory contains all the workflow planning/spec artifacts (02a APPROVED spec, 02b plan, 03a/03b refactor lists, 05 manual-test feedback). Same spirit as `docs/jira-docs/` — historical. Plan: **leave alone**. Confirm?

HUMAN: Pls ditch "docs/workflow-creation-docs" entirely.  Also update every command at:
.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow
from:
workflow-creation-docs-dir = {project-root}/docs/workflow-creation-docs/{plugin-id}/{workflow-id}
to:
workflow-creation-artifacts-dir = {project-root}/docs/artifacts/workflow-creation-artifacts/{plugin-id}/{workflow-id}
as the /docs/workflow-creation-docs/ naming is confusing - it sounds like it would contain docs **about** how to create workflows - but it in fact contains artifacts created during workflow creation.

#### Q6 follow-up — scope investigation done

What I found:

- `docs/workflow-creation-docs/` currently has only one subdirectory: `agentic-hq-classwitch-plugin/`. So "ditch entirely" deletes that one tree (already on the chopping block as part of the classwitch cleanup).
- 4 of the 5 `create-workflow` command files contain the `workflow-creation-docs-dir = ...` definition line and need editing. Files: `01-explain-...:211`, `02-confirm-...:36`, `03-run-checks-...:37`, `04-document-...:35`. (File `05-get-human-...` only references the `{workflow-creation-docs-dir}` variable, no path-definition line.)
- `docs/README.md:52` has a listing entry: `[workflow-creation-docs/](workflow-creation-docs/) — Per-workflow design`. This will be **stale** after the move.
- No other code/scripts/tests reference the path. Just the 4 command files + the docs README listing.
- `docs/artifacts/` does not exist yet — will be created on first workflow run after this change.

#### Q6 sub-questions (please confirm before I start)

**Q6.1 — `docs/README.md` listing.** What should I do with line 52?
- (a) **Delete the listing** entirely — `docs/artifacts/` won't exist on a fresh clone (it's generated by `agentic-hq create-workflow`), so listing it would be misleading.
- (b) **Update to `docs/artifacts/`** with a description like *"Generated artifacts from workflow runs (e.g. workflow-creation artifacts). Created on demand."*
- (c) **Update to `docs/artifacts/workflow-creation-artifacts/`** with the existing description.

Lean: **(a)** for now — keep the public docs index pointing at user-meaningful directories, not auto-generated ones. Confirm?

HUMAN: Yes.(a) delete.

**Q6.2 — Variable name.** Your instruction kept the variable name `workflow-creation-docs-dir` and only changed the right-hand-side path. To double-check: should I also rename the variable to e.g. `workflow-creation-artifacts-dir` for consistency with the new conceptual framing, or leave the variable name alone? *Lean: leave the variable name alone* — it's just an internal label, and renaming it ripples through every command file's variable usage too.

HUMAN: I like your idea of changing the variable name and the directory so that it becomes:

workflow-creation-artifacts-dir = {project-root}/docs/artifacts/workflow-creation-artifacts/{plugin-id}/{workflow-id}

even though the changes ripple through all the commands, this is better.  Please be sure to confirm "workflow-creation-docs" doesn't exist anywhere in the commands after (apart from historical docs)

**Q6.3 — Backwards compatibility.** Anyone with an in-flight `agentic-hq create-workflow` session in another repo that has already written artifacts under their `docs/workflow-creation-docs/` will have those artifacts in the *old* location after this change. Probably acceptable (it's a beta tool, no users), but worth flagging. No action needed unless you tell me otherwise.

HUMAN: There are no "in-flight" workflows.  I'm the only user currently.

### 7. Are the `temp-test-workspaces/test-*-classwitch-override-project-*` directories in scope?

These two sibling workspaces exist as additional working directories in this session, used during AHQ-120/AHQ-123 development. The how-to guide that motivated them is being deleted. Options:

- **(a) Leave them alone** — they're local test fixtures, not shipped, not visible to users.
- **(b) Delete them** — for consistency with the rest of the cleanup.

Lean: **(a)** — they're harmless and not part of the public surface. Confirm?

HUMAN: Yes. Leave

### 8. Classwitch repo README banner — wording

Draft I'll use unless you tweak:

```markdown
> ⚠️ **PROJECT ABANDONED — 2026-05-10**
>
> classwitch is no longer being developed. It was originally written to make
> Typescript classes "switchable" by third-party fork projects without
> changing the original codebase. After using it inside [agentic-hq](https://github.com/Agentic-HQ/agentic-hq),
> the conclusion was that fundamentally changing how Typescript is written is
> probably the wrong approach for AI-assisted creation and maintenance of
> forked open-source projects.
>
> The original goal — making forks easier to create and maintain with AI,
> without big changes to either the original or the forked project — is
> still interesting, and may be revisited under a different design. See
> [classwitchAlternatives](https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/57081857/classwitchAlternatives)
> for early thinking.
>
> Ticket in which classwitch project official abandoned: [AHQ-131](https://agentic-hq.atlassian.net/browse/AHQ-131).
```

Wording OK? Date OK (2026-04-30 is the AHQ-131 *Created* date — i.e. when the abandonment decision was recorded)?

### 9. Acceptance criteria — add to Jira?

Suggested ACs:

1. `.agentic-hq/plugins/agentic-hq-classwitch-plugin/` directory deleted.
2. `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` deleted.
3. `Classwitch Root Project pattern.` bullet removed from `docs/dev/how-agentic-hq-works.md`.
4. `docs/dev/project-design-requirements.md` classwitch paragraph handled per Q4.
5. `src/cli/main.ts`, `app.ts`, `agentic-hq-program.ts` header comments handled per Q5.
6. `README.md` line 15 updated to archive-branch pointer (Q3); workflows listing at lines 165–170 has the classwitch entry deleted.
7. classwitch repo `README.md` has the `⚠️ ABANDONED` banner (Q8); committed inside that repo.
8. `pnpm validate` passes from project root.
9. `pnpm typecheck` from `.agentic-hq/plugins/` passes (the classwitch plugin's `ts-workflow` packages no longer in workspace, so confirm `pnpm-workspace.yaml` and any path globs still resolve).
10. `git grep -i classwitch` from project root returns matches only inside `docs/jira-docs/`, `docs/workflow-creation-docs/`, `temp-test-workspaces/` and the README.md archive-branch pointer.

Add to Jira via MCP, or just track locally?

HUMAN: I've edited  `.claude/settings.local.json` already manually to remove classwitch references.  I've added ACs to the Jira.

---

## Recommended Order Of Operations (once Q6 sub-questions confirmed)

1. **Verify** the archive branch is fully pushed and reachable: `git fetch origin archive/feature/ahq-123-create-classwitch-override-workflow` and confirm sha matches local. *(Already confirmed both exist; this is a safety re-check immediately before the deletion commit.)*
2. **Delete** the entire `.agentic-hq/plugins/agentic-hq-classwitch-plugin/` directory (one `rm -rf`, then `git rm -r`). Also remove its `ts-workflow` paths from `pnpm-workspace.yaml` if listed.
3. **Delete** `docs/workflow-creation-docs/` entirely (per Q6 — this also removes its only subdir, the `agentic-hq-classwitch-plugin/` tree of planning artifacts).
4. **Delete** `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md`.
5. **Update** all **5** `create-workflow` command files (per Q6 — variable rename ripples through all uses, not just the 4 with the `=` definition line):
   - **Variable rename** everywhere it's used: `{workflow-creation-docs-dir}` → `{workflow-creation-artifacts-dir}`, `workflow-creation-docs-dir` → `workflow-creation-artifacts-dir`.
   - **Path rename** in the 4 files with the `=` definition (01:211, 02:36, 03:37, 04:35): RHS becomes `{project-root}/docs/artifacts/workflow-creation-artifacts/{plugin-id}/{workflow-id}`.
   - File 05 (`05-get-human-...`) only uses the variable (no `=` definition), so just the variable rename applies there.
6. **Edit** `docs/dev/how-agentic-hq-works.md` (delete the bullet) and the three CLI header comments per Q5 (Option B — rewrite without classwitch framing). *Skip `project-design-requirements.md` — already done by user (Q4).*
7. **Edit** `README.md` line 15 per Q3 and remove the classwitch listing at lines 165–170. **Edit** `docs/README.md:52` per Q6.1 outcome.
8. **Run `pnpm validate`** from project root. Fix anything that breaks (e.g. workspace globs pointing at the deleted `ts-workflow`s).
9. **Final sweep:** `git grep -i classwitch` against the agreed allow-list (`docs/jira-docs/`, `temp-test-workspaces/`, the README archive-branch pointer, AHQ-131's own summary doc). **Plus** `git grep "workflow-creation-docs"` to confirm zero live references remain (only `docs/jira-docs/` historical refs, the `.agentic-hq/temp/git-diffs/` local dev artifacts, and AHQ-131's own summary doc may match).
10. **Commit** in the AHQ repo via `/commit`.
11. **Update** the classwitch repo's `README.md` with the banner (per Q8), in `/Users/stevepersonal/dev/agentic-hq/classwitch/`, separate commit.

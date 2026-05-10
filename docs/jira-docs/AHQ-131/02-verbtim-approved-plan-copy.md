# AHQ-131 — Implementation Plan

**Jira:** [AHQ-131 — Remove classwitch Related Plugins, Workflows, Docs And Changes](https://agentic-hq.atlassian.net/browse/AHQ-131)
**Branch target:** `main` (after PR review)
**Companion doc:** `docs/jira-docs/AHQ-131/summary-and-questions.md` — contains all the prior research, user-answered design questions, and decisions this plan is built on.

## Context

`classwitch` (a separate repo of Steve's that makes TypeScript classes "switchable" by third-party fork projects) is being abandoned. Steve concluded that fundamentally changing how TypeScript is written is the wrong approach for AI-assisted creation/maintenance of forked open-source projects. The `classwitchAlternatives` Confluence page sketches potential successor ideas.

Three consequences:

1. The two `classwitch-*` workflows in `agentic-hq-classwitch-plugin` were built to *help users build classwitch override projects*. They worked end-to-end but the underlying use-case is now dead. They will be deleted; the pre-deletion versions are preserved on the existing archive branch `archive/feature/ahq-123-create-classwitch-override-workflow` (already on local + origin).
2. AHQ's CLI files (`src/cli/main.ts`, `app.ts`, `agentic-hq-program.ts`) carry header comments framing the file shape as the "Classwitch Root Project pattern". The shape is fine; the framing is misleading and gets stripped.
3. The `docs/workflow-creation-docs/` directory name is misleading (it sounds like docs *about* creating workflows, but actually contains *artifacts created during* workflow creation). The directory and its only subdir (the now-deleted classwitch plugin's planning artifacts) get deleted; future runs of `agentic-hq create-workflow` write to a clearer path under `docs/artifacts/workflow-creation-artifacts/` with a renamed variable.

The separate `classwitch` repo at `/Users/stevepersonal/dev/agentic-hq/classwitch/` gets a prominent abandonment banner committed in its own Git history.

## Step 0 — Copy this plan verbatim into the AHQ-131 jira-docs folder

Before any other action, copy this file verbatim to:

```
/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/jira-docs/AHQ-131/verbtim-approved-plan-copy.md
```

(filename spelled `verbtim-` intentionally per user instruction — do not "correct" the typo).

Use `cp` rather than re-typing — must be byte-identical to the approved plan file.

## Step 1 — Safety re-check the archive branch

Before deleting anything, confirm the pre-deletion code is preserved:

```bash
git fetch origin archive/feature/ahq-123-create-classwitch-override-workflow
git rev-parse origin/archive/feature/ahq-123-create-classwitch-override-workflow
git rev-parse archive/feature/ahq-123-create-classwitch-override-workflow
```

Both shas should resolve. (Already verified during research, but cheap re-check.)

## Step 2 — Delete the classwitch plugin

```bash
rm -rf .agentic-hq/plugins/agentic-hq-classwitch-plugin/
```

(Plain `rm`, **not** `git rm` — `git rm` stages the deletion immediately, which conflicts with this repo's rule that all staging is left to the `/commit` flow. The deletion shows as unstaged in `git status` and gets picked up at commit time.)

Removes:
- `.claude-plugin/plugin.json`
- 4 `commands/classwitch-converter-workflow/*.md` files
- 6 `commands/classwitch-override-workflow/*.md` files
- Both skills' `ahq-workflow.json`, `SKILL.md`, `ts-workflow/`, `docs/`
- Both `ts-workflow/node_modules/` trees (regenerable from `package.json` if anyone needs them off the archive branch)

**No `pnpm-workspace.yaml` update needed** — `pnpm-workspace.yaml` already excludes `'!.agentic-hq/plugins/**'`, so deletion is transparent to the workspace.

## Step 3 — Delete `docs/workflow-creation-docs/` entirely

```bash
rm -rf docs/workflow-creation-docs/
```

Currently has only one subdir (`agentic-hq-classwitch-plugin/`, the planning artifacts for the just-deleted classwitch workflows).

## Step 4 — Delete the classwitch override how-to guide

```bash
rm docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md
```

## Step 5 — Rename `workflow-creation-docs-dir` → `workflow-creation-artifacts-dir` across `create-workflow` plugin commands

**Variable rename** (every occurrence in all 5 command files):
- `workflow-creation-docs-dir` → `workflow-creation-artifacts-dir`
- `{workflow-creation-docs-dir}` → `{workflow-creation-artifacts-dir}`

**Path rename** in the 4 files with the `=` definition line:
- RHS becomes `{project-root}/docs/artifacts/workflow-creation-artifacts/{plugin-id}/{workflow-id}`

Files to edit (all under `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/`):

| File | Definition line | Other variable refs |
|---|---|---|
| `01-explain-to-user-how-workflows-work-and-get-workflow-details.md` | line 211 | lines 212, 215 |
| `02-confirm-spec-approved-and-build.md` | line 36 | lines 37, 38, 39, 52, 139 |
| `03-run-checks-on-workflow.md` | line 37 | lines 38, 39, 40, 54 |
| `04-document-workflow.md` | line 35 | lines 36, 56 |
| `05-get-human-to-test-workflow.md` | (none — uses only) | lines 37, 51 |

Use `Edit` with `replace_all: true` per file for each of the two strings (variable-with-braces and variable-without-braces), then a separate Edit for the RHS path on each definition line.

## Step 6 — Strip classwitch framing from `docs/dev/how-agentic-hq-works.md`

Delete lines 331–341 — the entire `Classwitch Root Project pattern.` bullet inside Transitional Design Notes:

```
- **Classwitch Root Project pattern.** The deliberately-tiny entry shape
  (`bin/agentic-hq.cjs` → 2-line `main.ts` → `app.ts` exposing `const app`
  with a `run()` method) is so that **Classwitch Override Projects** —
  e.g. the `agentic-hq-with-colours` repo planned in
  [AHQ-120](https://agentic-hq.atlassian.net/browse/AHQ-120) — can ship
  their own `bin/...cjs` and `main.ts` that side-effect-import an override
  registry and then call the same `app.run()`. The shape itself is the
  pattern; see the long comments in `main.ts` and `app.ts`, and
  [AHQ-124](https://agentic-hq.atlassian.net/browse/AHQ-124) for the
  rationale. AHQ-117 will later swap several `new SomeImpl()` calls for
  `rootServiceRegistry.loadClass(...)` — same shape, different content.
```

The `Env-var workspace root.` bullet immediately after stays (unrelated).

## Step 7 — Rewrite the three CLI header comments (Q5 Option B)

### `src/cli/main.ts` (lines 1–22)

Replace the entire 22-line header comment with:

```typescript
/**
 * agentic-hq CLI entry point — 2-line main program.
 *
 * Bootstrap logic lives in `app.ts`. Keeping this file tiny means the entry
 * point holds nothing test-relevant, while `app.run()` stays a clean,
 * importable seam for tests and any future alternative entry points.
 */
```

### `src/cli/app.ts` (lines 1–35)

Replace the entire 35-line header comment with:

```typescript
/**
 * `app` — the bootstrap object for the agentic-hq CLI.
 *
 * Exposed as `const app = { run() {...} }` rather than inlined into `main.ts`
 * so tests can import and exercise `app.run()` without going through the
 * binary entry point. The plain-const shape (no `App` interface, no `AppImpl`
 * class) is deliberate: an interface/class layer would add ceremony with no
 * functional benefit at this layer.
 */
```

### `src/cli/agentic-hq-program.ts` (lines 1–15)

Replace the entire 15-line header comment with:

```typescript
/**
 * CLI program factory — creates a configured Commander program with injected dependencies.
 *
 * Separated from main.ts/app.ts (the entry point) so that:
 * 1. The program can be tested without triggering program.parse() side effects
 * 2. The WorkflowCommandBuilder and WorkflowSearchResults can be injected
 *    for testing or customization
 *
 * The CLI is thin: it parses args, resolves the skill path, and delegates
 * to the injected WorkflowCommandBuilder for workflow command building and execution.
 */
```

(Removes the "Classwitch Root Project shape" paragraph at lines 8–12; keeps the rest as-is.)

## Step 8 — Update `README.md`

### Line 15 (Q3 — kept, replaced wording):

```markdown
NOTE: Two earlier examples of this type of workflow — the **classwitch conversion** and **classwitch override** workflows — have been removed from `main`. They were complex multi-step technical-process workflows that worked end-to-end (see [AHQ-117](https://agentic-hq.atlassian.net/browse/AHQ-117), [AHQ-120](https://agentic-hq.atlassian.net/browse/AHQ-120), [AHQ-123](https://agentic-hq.atlassian.net/browse/AHQ-123)), but the underlying classwitch project they targeted has been abandoned (see [AHQ-131](https://agentic-hq.atlassian.net/browse/AHQ-131) and [classwitchAlternatives](https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/57081857/classwitchAlternatives)). If you want to read or run them, check out the archive branch [`archive/feature/ahq-123-create-classwitch-override-workflow`](https://github.com/Agentic-HQ/agentic-hq/tree/archive/feature/ahq-123-create-classwitch-override-workflow). The current focus is AI Developer Workflows (see above).
```

### Lines 165–170: delete the `Plugin: agentic-hq-classwitch-plugin` listing entirely

(plugin no longer exists). Re-read the surrounding section before editing to verify section-header context isn't broken by the deletion.

## Step 9 — Update `docs/README.md` (Q6.1)

Delete line 52 (`[workflow-creation-docs/](workflow-creation-docs/) — Per-workflow design`). The directory no longer exists; `docs/artifacts/` won't exist on a fresh clone (created on first `agentic-hq create-workflow` run), so listing it would mislead.

## Step 10 — Run `pnpm validate`

```bash
cd /Users/stevepersonal/dev/agentic-hq/agentic-hq
pnpm validate
```

Must show 100% pass on typecheck + lint + unit tests. Any breakage from the deleted plugin / renamed variable gets fixed here before continuing.

## Step 11 — Final verification sweeps

```bash
# 1. classwitch refs — should match only allow-listed locations
git grep -i 'classwitch'
```

Allow-list:
- `docs/jira-docs/...` — historical planning artifacts
- `temp-test-workspaces/test-*-classwitch-override-project-*` — local-only test fixtures
- `README.md` — the archive-branch pointer text from Step 8
- `docs/jira-docs/AHQ-131/summary-and-questions.md` and `verbtim-approved-plan-copy.md` — this Jira's own docs

```bash
# 2. workflow-creation-docs refs — should be zero, except:
git grep 'workflow-creation-docs'
```

Allow-list:
- `docs/jira-docs/...` — historical
- `.agentic-hq/temp/git-diffs/` — local dev artifacts
- `docs/jira-docs/AHQ-131/...` — this Jira's own docs

If anything outside those allow-lists matches, fix before committing.

## Step 12 — Commit (AHQ repo) via `/commit`

Per `CLAUDE.md` rule: never run `git add` / `git commit` / `git push` directly. Stop, tell the user the changes are ready, and wait for them to run `/commit`.

## Step 13 — Update the `classwitch` repo's `README.md` (Q8)

In `/Users/stevepersonal/dev/agentic-hq/classwitch/`, prepend the agreed banner block to `README.md`:

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

Then, in the classwitch repo (separate Git history): tell the user the classwitch README is updated and ready to commit. They run `/commit` from the classwitch repo's working directory.

## Out of scope (per Q&A in the companion doc)

- **`docs/dev/project-design-requirements.md`** — already edited manually by the user (Q4). Do not touch.
- **`.claude/settings.local.json`** — already edited manually by the user. Do not touch.
- **`temp-test-workspaces/test-*-classwitch-override-project-*`** — local-only test fixtures. Leave alone (Q7).
- **`docs/jira-docs/...`** — historical references. Leave alone.
- **`workflow-docs-directory` / `workflow-docs/` references** in idea-workflow / quick-jira-workflow — separate, unrelated naming, *not* part of this Jira's rename scope.
- **The classwitch repo's content** beyond the README banner — out of scope.

## Critical files modified

Edits:
- `src/cli/main.ts` (Step 7)
- `src/cli/app.ts` (Step 7)
- `src/cli/agentic-hq-program.ts` (Step 7)
- `docs/dev/how-agentic-hq-works.md` (Step 6)
- `README.md` (Step 8)
- `docs/README.md` (Step 9)
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/*.md` × 5 (Step 5)
- `/Users/stevepersonal/dev/agentic-hq/classwitch/README.md` (Step 13 — separate repo)

Deletions:
- `.agentic-hq/plugins/agentic-hq-classwitch-plugin/` (entire tree, Step 2)
- `docs/workflow-creation-docs/` (entire tree, Step 3)
- `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` (Step 4)

## Verification

End-to-end checks at Step 10 and Step 11:

1. **`pnpm validate`** at AHQ project root passes (typecheck + lint + unit tests at 100%).
2. **`agentic-hq list`** at the CLI runs without listing the classwitch plugin and without erroring.
3. **`git grep -i classwitch`** matches only the allow-listed locations.
4. **`git grep 'workflow-creation-docs'`** matches only `docs/jira-docs/`, `.agentic-hq/temp/git-diffs/`, and `docs/jira-docs/AHQ-131/`.
5. **`agentic-hq create-workflow --help`** runs without error (smoke test that the rename didn't break the create-workflow plugin's discoverability).
6. The classwitch repo's `README.md` renders the banner correctly (visual GitHub render check after pushing).

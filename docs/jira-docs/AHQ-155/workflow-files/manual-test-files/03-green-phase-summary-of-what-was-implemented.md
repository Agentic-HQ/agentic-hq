# GREEN Phase Complete: AHQ-155 (manual test)

**Jira**: [AHQ-155](https://agentic-hq.atlassian.net/browse/AHQ-155)
**Test Type**: manual
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-06-10

---

## Implementation Created

Renamed the seven-agent `add-feature` workflow to `add-feature-detailed-example` (full rename, Option A)
and reframed its self-descriptions to bill it as a *worked example* rather than the recommended default.

**Test Command**: N/A — `test-type: manual` (no automated tests). Human ran the first workflow stages and read the docs.
**Test Result**: ✅ PASSING — human confirmed "all looks good and tests pass".

---

## What Was Implemented

The whole workflow's identifier (`add-feature`) and framing were renamed/reworded to `add-feature-detailed-example`
across its command files, skill files (manifest, `SKILL.md`, CLI, `package.json`), and bundled docs, plus the one
external referrer in `create-workflow`. This frees the `add-feature` name for the future simple flagship workflow
(AHQ-157, out of scope) and rebills this heavy workflow as a showcase of a deeply customised, opinionated workflow.

### Key implementation decisions:

1. **Full rename (Q1 Option A)**: Renamed not just user-visible surface but internal identifiers too (CLI filename,
   commander `.name()`, package `name` + `demo:` script, the one help-doc filename embedding the name) so nothing
   `add-feature-*` lingers and AHQ-157 can claim the `add-feature` name with zero collision risk.
2. **Scope beyond the literal manual test**: The manual test only exercises stages 01→02, but I renamed all of 01–07
   + CLI + skill assets, because a partial rename leaves stages 03–07 broken (dangling slash-chain, broken
   `current-workflow-id` paths). This matches the Jira's "complete audit + full rename" agreement. Approved in plan review.
3. **Runtime-critical path mechanics**: `current-workflow-id` (feeds `…/skills/{current-workflow-id}`) and the
   help-doc variable (key + value) were updated in lockstep across all 7 command files — these fail only at runtime,
   which is exactly what the manual run verified.
4. **Reframing lives in the docs**: The "worked example, not the default" positioning + pointers to the simple
   `add-feature` and `create-workflow --using=add-feature` were placed prominently in the `00` user help doc (and the
   CLI header/description), rather than bloating every command Intro at `verbosity=low`. The `list` description uses
   the pre-specified wording from the AHQ-157 source doc.
5. **Q2 referrer**: Repointed `create-workflow/02-…` line 155 to `add-feature-detailed-example/03-planner.md`.
6. **Intentional bare `add-feature` retained**: The new pointers to the *simple* workflow / `create-workflow --using=add-feature`
   deliberately keep the bare `add-feature` name — they reference the future simple workflow, not this one.

### Bugs found and fixed during GREEN:

None — implementation went as planned. (One mechanical nuance handled: some `Add Feature workflow` references in the
help docs wrap across two lines, so a per-line `s/Add Feature workflow/.../` would miss them; used case-specific
blanket replacements within those doc files instead, then grep-verified no drift and no double-replacement.)

## Files Created

- `docs/jira-docs/AHQ-155/workflow-files/manual-test-files/03-APPROVED-green-phase-implementation-plan-copy.md` — the approved plan
- (this summary)

## Files Renamed

- `…/skills/add-feature/` → `…/skills/add-feature-detailed-example/`
- `…/commands/add-feature/` → `…/commands/add-feature-detailed-example/`
- `…/ts-workflow/src/add-feature-cli.ts` → `…/add-feature-detailed-example-cli.ts`
- `…/docs/workflow-help-docs/00-add-feature-workflow-user-help-doc.md` → `…/00-add-feature-detailed-example-workflow-user-help-doc.md`

## Files Modified

- `…/skills/add-feature-detailed-example/ahq-workflow.json` — `skillId`/`shortId` + `description`
- `…/skills/add-feature-detailed-example/SKILL.md` — description + CLI path
- `…/ts-workflow/package.json` — `name` + `demo:` script
- `…/ts-workflow/src/add-feature-detailed-example-cli.ts` — 7 slash constants, `.name()`, `.description()`, header
- `…/commands/add-feature-detailed-example/01-…07-…md` (7 files) — H1, Intro prose, `current-workflow-id`, help-doc variable, re-run prose
- `…/docs/workflow-help-docs/00-…` — retitled + reframed (worked-example positioning + pointers); `01-…07-…-help-doc.md` + `developer-help-docs/developer-help-doc.md` — name references
- `…/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md` — line 155 path repointed

## AI-side verification performed

- `tsx add-feature-detailed-example-cli.ts --help` → runs, shows new name + description, imports resolve through the symlink
- `agentic-hq list` → shows `add-feature-detailed-example` + new description, no stale `add-feature` entry
- Drift grep → no stale `add-feature` in-scope (only intentional simple-workflow pointers; remaining old refs confined to out-of-scope `.agentic-hq/temp/**`)

---

## Ready for REFACTOR Phase

The manual test is passing (human-confirmed). This program should self terminate, and then (if you are running the automated workflow) the following command will be run automatically:
```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-155 manual
```

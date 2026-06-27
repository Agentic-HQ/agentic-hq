# AHQ-159 — What Was Implemented & Verification Details

**Jira:** https://agentic-hq.atlassian.net/browse/AHQ-159 — *Add `--using` Option To create-workflow To Allow It To Use Existing Workflow*
**Approved spec:** [`AHQ-159-APPROVED-spec.md`](./AHQ-159-APPROVED-spec.md)
**Branch:** `feature/ahq-159-add-using-option-to-create-workflow`

## Summary

Added an optional `--using <short-id-of-workflow-to-copy>` passthrough parameter to the `create-workflow`
workflow. This is the **copy-and-modify customisation path**: take an existing workflow (a colleague's, or
the flagship `add-feature`), copy it to a new id, rewire its metadata/wiring, and adapt it into your own.

```bash
agentic-hq create-workflow -- --using=add-feature   # copy-and-modify an existing workflow
agentic-hq create-workflow                           # unchanged: build from scratch
```

The feature threads mainly through Commands **01 → 02** (resolve/plan → copy/rewire). Command **04**
(document-workflow) also needed a copy-aware fix — discovered while manually testing the `--using` run —
so it now verifies/repairs the copied help docs instead of regenerating them; Commands 03 and 05 are
untouched. When `--using` is **not** supplied, `create-workflow` behaves exactly as before (AC-3).

The only executable change is the CLI (statically verified below); everything else is agent-facing
Markdown, so the resolve / copy / rewire / document behaviour is **human-verified end-to-end** (per the
spec's test approach and resolved AI Question 2 — no automated unit test for this ticket).

## How The Pieces Fit Together

The `--using` short-id flows in through the CLI, is **resolved and planned** by Command 01, and is
**executed** by Command 02:

1. **CLI** weaves `short-id-of-workflow-to-copy=<id>` into Command 01's input string.
2. **Command 01** (the *planner*) resolves the short-id to a real source workflow across both roots,
   confirms it, and writes a concrete **"Source Workflow & Copy Plan"** section into the spec (resolved
   absolute paths + copy/rewire/identity-sweep/removal-renumber manifests). Command 01's *output string*
   is deliberately **unchanged**.
3. **Command 02** (the *doer*) detects the Copy Plan in the approved spec, switches to `from-existing`
   mode, and copies + rewires the source workflow rather than generating from a template.

The reason the signal rides **in the spec** (not in `command-input.json`) is that Command 01's output
string is intentionally left unchanged — so Command 02 sets its mode from the *presence of the Copy Plan
section in the spec*, the one place the copy intent reliably reaches it.

## The Changes (4 edited, 2 new)

### 1. EDITED — `create-workflow-cli.ts` (§1)

`.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/src/create-workflow-cli.ts`

- Added the Commander option `--using <short-id-of-workflow-to-copy>`.
- Built Command 01's input string conditionally (inline — no helper, no unit test, per resolved Q2):
  - **with `--using`** → `The variables used in this workflow creation workflow are: agentic-hq-workspace-root-dir=… and short-id-of-workflow-to-copy=…` (plural phrasing).
  - **without `--using`** → the **byte-for-byte original** string (`The variable used … is: agentic-hq-workspace-root-dir=…`). This is what guarantees AC-3.
- Commands 02–05 still receive Command 01's **output** (the broadcast pattern is unchanged).
- Updated the file header comment to describe the optional `--using` weaving + added the AHQ-159 link.

### 2. EDITED — Command 01 `01-explain-to-user-how-workflows-work-and-get-workflow-details.md` (§2)

`.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-…-get-workflow-details.md`

- **Step 0a / 0b** — documented the two input shapes and parse the **optional** `short-id-of-workflow-to-copy`.
- **New Step 0c: Resolve the Source Workflow** (runs *only* when `short-id-of-workflow-to-copy` is set):
  - Resolves the short-id by scanning every `ahq-workflow.json` under `.agentic-hq/plugins/**` in **both**
    `{agentic-hq-workspace-root-dir}` (the AHQ install) **and** `{project-root}` (the user's workspace) —
    mirroring how the CLI's workflow-discovery registers both roots. This is what makes a run from a
    **fresh, empty project** work, since the source (e.g. `add-feature`) lives only under the AHQ install.
  - De-dups when the two roots are the same dir.
  - **No match → STOP** (informs the user, lists the short-ids it did find, asks them to fix `--using` and
    re-run; does **not** fall back to from-scratch) — this is AC-2.
  - **Multiple matches → present all and ask** which to copy.
  - Confirms the resolved source to the user, then reads the source workflow's structure so it can plan
    the copy. Establishes `source-workspace-root / source-plugin-id / source-workflow-id / source-commands-dir / source-skills-dir`.
- **Step 3** — added a `--using` note: reuse Step 3 + Step 4 **exactly** as a from-scratch run (no parallel
  copy); the identity collected is the **new** workflow's; the difference is framing the **purpose** as
  add / change / remove relative to the source.
- **Step 5** — added (a) a prose subsection explaining how to populate the Copy Plan and to capture the
  modifications in the normal spec sections, and (b) the **"Source Workflow & Copy Plan"** section in the
  spec template itself, placed **immediately after "Workflow Metadata"**, as a blockquote **addressed to
  "the execution agent"** containing the resolved Source / Destination / Copy / Rewire / Identity-sweep /
  Removal-addition-renumber manifests. It is explicitly marked **"include ONLY on a `--using` run; OMIT
  entirely on a from-scratch run"** — because its mere presence is the copy-mode signal for Command 02.
- **Output string** — left exactly as today (unchanged broadcast of workspace-root + plugin-id + workflow-id + workflow-short-id).

### 3. EDITED — Command 02 `02-confirm-spec-approved-and-build.md` (§3)

`.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md`

- **Step 1** — after the spec is read, set the mode:
  `creation-mode = (spec contains a "Source Workflow & Copy Plan" section) ? from-existing : from-scratch`,
  with a "Determine the creation mode" subsection that names the exactly-three divergence points and lists
  what stays shared/unbranched. Forked Step 1's reference reading (item 3): `from-scratch` reads the
  bundled `math-workflow`/`create-workflow` as **templates**; `from-existing` reads the **source workflow**
  at the Copy Plan's absolute paths (the reference workflows become only a guide to *what* to rewire).
- **Step 3 (plan mode)** — forked: `from-scratch` keeps the original generate-from-template plan (items
  1–7, unchanged); `from-existing` plans to **execute the Copy Plan** (copy → rewire → identity sweep →
  removal/renumber/addition + the shared 4b/4f). Shared item 0 (verbatim plan copy) kept single.
- **New Step 4-COPY block** (file-creation fork) — a single block that, in `from-existing` mode, replaces
  the from-scratch steps 4a/4c/4d/4e: copy the manifest (**exclude only `node_modules/`**; **keep `.npmrc`
  + `pnpm-lock.yaml`**), rewire (rename CLI file, repoint `COMMAND_NN_*` paths, `package.json` name +
  scripts, `SKILL.md` CLI filename), identity sweep, removal/addition & renumber (AC-5), then apply the
  spec's other modifications. Includes the AHQ-162 env-var-symlink callout (the copy runs cross-root with
  no dependency rewiring).
- **Scoped** each existing "following the math-workflow … pattern" step (4a/4c/4d/4e) to `from-scratch`
  with a per-step marker; clarified **4b** (`ahq-workflow.json`) writes fresh from the new identity in
  **both** modes (so it's *not* in the copy manifest), and **4f** (plugin manifest) stays shared.
- Did **not** split Command 02 into two parallel Step 4 sections — the linear structure is preserved and
  the modes fork only at the three points the spec calls out.

### 4. EDITED — Command 04 `04-document-workflow.md` (copy-aware documentation; found in manual testing)

`.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/04-document-workflow.md`

**Not part of the original implementation pass** (the spec scoped `--using` to Commands 01→02). While
manually testing the `--using` run, Command 04 was found to be **stale for the copy path** — it
regenerated a single `user-facing-help-doc.md` from a from-scratch template, which neither matched the
modern `docs/workflow-help-docs/` set nor the docs the copy already carried. It was fixed (by the agent
running the workflow, on this branch) so the documentation stage matches the copy path end-to-end:

- Adds **`creation-mode` detection** using the **same** "Source Workflow & Copy Plan" test as Command 02,
  then forks:
  - **`from-existing`** → **verify and repair** the help-doc set that was copied + adapted in Command 02
    (set is complete + numbered to match the commands, no source-identity leaks, command variable blocks
    aligned, overview matches what was built) — it does **not** regenerate from scratch and discard the
    already-adapted content.
  - **`from-scratch`** → **generate** the full set, reading `add-feature`'s help docs as the format
    reference.
- Also **modernised the from-scratch path**: replaced the old single `user-facing-help-doc.md` output with
  the standard **`docs/workflow-help-docs/`** set — an overview `00-{workflow-id}-user-help-doc.md` plus one
  `NN-{command}-help-doc.md` per command — matching the `add-feature` convention (and the structure
  Command 01's Copy Plan copies across).

### 5. NEW — `00-create-workflow-user-help-doc.md` (AC-6)

`.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/docs/workflow-help-docs/00-create-workflow-user-help-doc.md`

Whole-workflow user help: what `create-workflow` does, its five agents, both run modes (from-scratch and
`-- --using=add-feature`), the artifacts it produces, and its gates. Links to the specialist `--using`
doc. (`docs/` under `create-workflow` is net-new — this is the first doc there.)

### 6. NEW — `using-existing-workflow-help-doc.md` (AC-6)

`.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/docs/workflow-help-docs/using-existing-workflow-help-doc.md`

The specialist doc for `--using`: the `-- --using=<short-id>` syntax (and why the `-- ` is required), how
resolution scans both roots (so it works from an empty project), how you collaborate with the AI to define
add/change/remove, and what the copy/rewire produces. Both docs mirror `add-feature`'s help-doc style.

## Verification

**`create-workflow-cli.ts` (the one code change).** It is deliberately isolated from the main build
(eslint-ignores `.agentic-hq/plugins/**/ts-workflow/src/**`, the root `tsconfig.json` includes only
`src/**`+`tests/**`, and `.prettierignore` covers `.agentic-hq/`), so `pnpm validate` does **not**
typecheck/lint it. It was therefore verified directly:

- ✅ **Typecheck** — ran `tsc --noEmit -p tsconfig.json` against the workflow's own tsconfig (using the
  repo-root `tsc`, since the workflow ships only `tsx`): **clean**.
- ✅ **Loads & parses** — `tsx src/create-workflow-cli.ts --help` runs cleanly and lists the new option:
  `--using <short-id-of-workflow-to-copy>  short-id of an existing workflow to base the new workflow on`.
  This exercises Commander's parsing (the real failure mode for CLI changes).

**Whole-repo regression (the tracked `src/`/`tests/` baseline).** None of the changed files are part of
the tracked build, so a regression here is structurally impossible — confirmed anyway:

- ✅ `pnpm validate` — typecheck clean, `eslint .` clean, `prettier . --check` clean, **146/146 unit tests
  pass** (32 files, ~2.6s).

**Command-file + doc edits.** These are agent-facing Markdown (prettier-ignored, not part of the build),
so per the spec's test approach and resolved AI Question 2 the resolve / copy / rewire / customise
behaviour is **human-verified end-to-end** — see "Human verification still to do" below.

## Human Verification Still To Do (AC-1, AC-2, AC-4, AC-5)

The agent-driven behaviour is verified by Steve running the workflow (matching `create-workflow`'s
existing human-verified test approach). Suggested run, ideally **from a separate empty project** to
exercise the cross-root copy:

```bash
agentic-hq create-workflow -- --using=add-feature
```

Then confirm:

- **AC-1** — `add-feature` resolves (even from an empty workspace, where it exists only under the AHQ
  install), is confirmed, and the run proceeds down the copy path; the copy lands under `{project-root}`.
- **AC-2** — `-- --using=does-not-exist` informs and **stops** (does not proceed / fall back).
- **AC-4** — the produced workflow is a rewired copy (renamed CLI, repointed command constants, rewritten
  `ahq-workflow.json`/`package.json`/`SKILL.md`) plus the spec's modifications, and **runs end-to-end** via
  its new short-id.
- **AC-5** — a spec that **removes** a command yields gapless renumbered `NN-` files and a CLI whose
  `COMMAND_NN_*` constants + invocation order match, running without an "Unknown skill" error.

## Acceptance Criteria Status

- [~] **AC-1** — resolve + confirm + copy path (incl. from an empty workspace, cross-root). *Code in place; human e2e pending.*
- [~] **AC-2** — unrecognised short-id informs and stops. *Code in place (Step 0c no-match → STOP); human e2e pending.*
- [x] **AC-3** — no `--using` behaves exactly as before. *Verified: CLI input string byte-for-byte unchanged; Commands 01/02 unbranched on the from-scratch path; `pnpm validate` green.*
- [~] **AC-4** — produced workflow is a rewired copy + spec mods, runnable via new short-id. *Code in place (Step 4-COPY); human e2e pending.*
- [~] **AC-5** — command removal → gapless renumber + matching CLI; runs without "Unknown skill". *Code in place (Copy Plan removal/renumber manifest + Step 4-COPY item 4); human e2e pending.*
- [x] **AC-6** — the two `create-workflow` help docs exist and cover `--using`.
- [x] **AC-7** — *(already done before this ticket)* the four `add-feature` / `add-feature-detailed-example` docs use the working `-- --using` syntax.

`[x]` = complete & verified · `[~]` = code complete, awaiting human end-to-end run.

## Notes / Decisions Honoured

- **Resolved AI Question 1 (copy manifest):** the copy **keeps both `.npmrc` and `pnpm-lock.yaml`**,
  excluding **only** `node_modules/` — reflected in Command 01's Copy Plan template and Command 02's
  Step 4-COPY. (The lockfile is portable, so a frozen `pnpm install` still passes after the `name` rewrite.)
- **Resolved AI Question 2 (no unit test):** the CLI change is inline (Commander option + conditional
  input clause); no helper extracted and no `*.unit.test.ts` added. Testing is manual.
- **`exampleParameters` left as `""`** for `create-workflow` (decision in the spec) — `--using` is optional
  and not the primary use, so it should not show as the `agentic-hq list` example.
- **Interaction with AHQ-164:** the orthogonal *from-scratch* `.npmrc` generation (and the `add-feature`
  `.npmrc` backfill) is handled by AHQ-164, committed separately on this same branch. AHQ-159's copy path
  preserves `.npmrc` via the copy manifest above.

## Files In This Directory

- [`AHQ-159-APPROVED-spec.md`](./AHQ-159-APPROVED-spec.md) — the approved spec (source of truth; includes the resolved AI Questions).
- [`AHQ-159-details-of-what-was-implemented-and-verification-details.md`](./AHQ-159-details-of-what-was-implemented-and-verification-details.md) — this file.

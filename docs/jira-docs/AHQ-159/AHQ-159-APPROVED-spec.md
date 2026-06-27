# AHQ-159 Spec (APPROVED)

This is the APPROVED spec for https://agentic-hq.atlassian.net/browse/AHQ-159 - "Add --using Option To create-workflow To Allow It To Use Existing Workflow"

## Goal

Add a `--using` option to the `create-workflow` workflow that takes the **short-id of an existing workflow** to base a new workflow on. This is the core customisation path for Agentic HQ: take an existing workflow (a friend's, a co-worker's, or the flagship `add-feature` workflow), run it to try it, then copy-and-modify it to make it your own.

This is the action `add-feature` already tells developers to take at the end of its run (see `04-reviewer.md` and its help docs), so this ticket implements a contract `add-feature` already advertises.

## Invocation

`--using` is a **passthrough parameter**, so it must follow the `-- ` marker, exactly like every other Agentic HQ workflow parameter (`agentic-hq full-jira -- --jira-id=AHQ-107`):

```bash
agentic-hq create-workflow -- --using=<short-id-of-workflow-to-copy>
```

Example using the `add-feature` workflow:

```bash
agentic-hq create-workflow -- --using=add-feature
```

`--using` is **optional**. With no `--using`, `create-workflow` behaves exactly as it does today.

## Changes required

> **Read first (to understand what you're modifying):** all 5 `create-workflow` command files, its `SKILL.md` + `create-workflow-cli.ts`, the DRAFT-spec template in Command 01 **Step 5**, and one example workflow end-to-end (`add-feature`). The `--using` path only threads through Commands 01→02; the rest of `create-workflow` is unchanged.

### 1. `create-workflow-cli.ts`

File: `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/src/create-workflow-cli.ts`

The CLI currently reads only the `AGENTIC_HQ_WORKSPACE_ROOT` env var and passes no parameters. Change it to:

- Add a Commander option: `.option('--using <short-id-of-workflow-to-copy>', 'short-id of an existing workflow to base the new workflow on')`.
- Read its value in the action.
- Weave it into Command 01's input string as `short-id-of-workflow-to-copy`. When `--using` is supplied:

  ```
  The variables used in this workflow creation workflow are: agentic-hq-workspace-root-dir=${agenticHqWorkspaceRoot} and short-id-of-workflow-to-copy=${using}
  ```

  When `--using` is **not** supplied, pass the existing input string unchanged (no `short-id-of-workflow-to-copy` clause).

- Commands 02–05 continue to receive Command 01's **output** string (the broadcast pattern is unchanged).

### 2. Command 01 — `01-explain-to-user-how-workflows-work-and-get-workflow-details.md`

File: `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01-explain-to-user-how-workflows-work-and-get-workflow-details.md`

Command 01 must behave differently when `short-id-of-workflow-to-copy` is present in its input (add it to the variables parsed in **Step 0a**, alongside `agentic-hq-workspace-root-dir`).

**If `short-id-of-workflow-to-copy` IS supplied:**

- **Resolve the short-id to a source workflow — scanning BOTH roots.** There is no lookup helper exposed to the command agent, so resolve the same way the CLI itself discovers workflows (`WorkflowSearchResultsImpl` registers `AhqWorkspaceImpl` **and** `CurrentUserWorkspaceImpl`): scan every `ahq-workflow.json` under `.agentic-hq/plugins/**` in **both**
  - `{agentic-hq-workspace-root-dir}` — the AHQ install, where the bundled workflows (`add-feature`, etc.) live, **and**
  - `{project-root}` — the user's own workspace, which may hold a workflow a colleague shared.

  for one whose `shortId` matches. **A user commonly runs `create-workflow` from a fresh, empty project**, so the source is frequently present *only* under `{agentic-hq-workspace-root-dir}` — scanning `{project-root}` alone would fail to find it. From the matched file, read `pluginId` and `skillId` to locate the source directories, and **record which root it was found under** — this becomes the source paths in the Copy Plan below. De-dup when the two roots are the same directory (running against AHQ itself — mirrors the CLI's `isAhqWorkspace()` guard). If **more than one** workflow matches the `shortId` — whether across **both** distinct roots, or **multiple times within a single root** (e.g. a real workflow and a test fixture sharing a short-id) — present **all** matches (each with its `pluginId`, `skillId`, and which root it lives under) and ask the user which one to copy.
- **Confirm it exists.** Present the matched workflow's details (plugin, skill, description) to the user and tell them the new workflow will be built by copying and modifying a copy of it. **If no match is found**, inform the user, ask them to investigate/fix, and have them re-run the workflow — do not proceed.
- **Still go through Command 01's normal variable-discovery process — reuse it, do NOT duplicate it.** Run the existing **Step 3** (collect the new workflow's identity: `plugin-id`, `workflow-id`, `workflow-short-id`, `one-sentence-description`) and **Step 4** (establish derived variables) exactly as a no-`--using` run does — do **not** write a parallel copy of those steps for the `--using` path. The only difference is that the **source** workflow's variable-flow is carried over as the starting point to edit, rather than being built from scratch.
- **Instead of defining the workflow's purpose from scratch**, the user works with the AI to define what the point of the new workflow is and what to **add / change / remove** relative to the source workflow.
- **Command 01 is the planner — write a concrete Copy Plan into the DRAFT spec.** The plan does **not** travel through the inter-command output string. Instead, record everything Command 02 needs as an explicit **"Source Workflow & Copy Plan"** section of the DRAFT spec, using **resolved, absolute file paths** (real values, not placeholders). Add this as a new section in Command 01's **Step 5 spec template**, placed **near the top of the spec — immediately after the "Workflow Metadata" section** (so the execution agent meets it early, before the detailed Variable Flow / Commands sections). Populate it only on `--using` runs, and mark it as a blockquote callout addressed to **the execution agent** so Command 02 reliably acts on it (Command 02 already honours such callouts — its Step 1.2). It must contain:
  - **Source** (as resolved above): short-id, `pluginId`, `workflow-id`, and the absolute source dirs `{source-workspace-root}/.agentic-hq/plugins/{source-plugin-id}/commands/{source-workflow-id}/` and `…/skills/{source-workflow-id}/`.
  - **Destination** (the new workflow): the absolute dest dirs `{project-root}/.agentic-hq/plugins/{plugin-id}/commands/{workflow-id}/` and `…/skills/{workflow-id}/`. Often a **cross-root copy** — bundled source in the AHQ install → new workflow in the user's own project — so the source root and dest root commonly differ. If the destination plugin doesn't exist yet (common in an empty workspace), Command 01's existing Step 3a *"plugin doesn't exist → create it"* path applies.
  - **Copy manifest**: exactly what to copy — the command `.md` files, `SKILL.md`, the `ts-workflow/` **source and config** (`src/`, `package.json`, `tsconfig.json`, `pnpm-workspace.yaml`, **`.npmrc`**, and **`pnpm-lock.yaml`**), templates, and `docs/`. **Exclude only `node_modules/`** — it is ~12 MB and contains a now-wrong `agentic-hq` symlink; the copied `SKILL.md` rebuilds deps with `pnpm install` (and re-links `agentic-hq`) on first run via the env-var symlink standard fixed & committed in [AHQ-162](https://agentic-hq.atlassian.net/browse/AHQ-162). **Keep `.npmrc` + `pnpm-lock.yaml`** so the copy preserves the frozen-lockfile supply-chain standard (AHQ-152) and installs reproducibly — the lockfile is portable (importer key is `.`, `agentic-hq` recorded as a depth-relative `link:`, no absolute paths or workflow names), so a frozen `pnpm install` still passes after the `name` rewrite. (See the resolved **AI Question 1** at the foot of this spec.)
  - **Rewire manifest**, with the resolved target values spelled out: rename `{source-workflow-id}-cli.ts` → `{workflow-id}-cli.ts`; the new `COMMAND_NN_*` constant paths `/{plugin-id}:{workflow-id}:NN-{command-name}`; the `ahq-workflow.json` field values (`pluginId`, `skillId`, `shortId`, `description`); `package.json` `name` **and any `scripts` that still run the old CLI file** (e.g. `tsx src/{source-workflow-id}-cli.ts`); the `SKILL.md` skill-base-dir / CLI filename.
  - **Identity sweep**: the copied `SKILL.md`, help docs (`docs/`), and any CLI/command-file comments still name the **source** workflow (its short-id, workflow-id, description, example invocations) — replace these with the new workflow's identity so the copy doesn't advertise the original.
  - **Removal/addition & renumber manifest** (only if commands are removed, or inserted mid-sequence): which `NN-*.md` to delete or insert, the resulting renumber map, and the matching CLI constant/order changes — see §3. (A command simply appended at the **end** needs no renumber.)
- **Then capture all the modifications** (additions/changes to the copy, including documentation) in the normal spec sections (Commands, TypeScript CLI, Variable Flow), so the spec describes the **target** workflow, not just the source.

**Output string — unchanged.** Command 01's output string stays exactly as today (the existing broadcast of `agentic-hq-workspace-root-dir`, `plugin-id`, `workflow-id`, `workflow-short-id`). Command 02 already derives the spec's location from `project-root` + `plugin-id` + `workflow-id` and reads the APPROVED spec there — so the Copy Plan reaches Command 02 **through the spec**, not through new output variables.

**If `short-id-of-workflow-to-copy` is NOT supplied:** Command 01 behaves exactly as today.

### 3. Command 02 — the copy + rewire (build phase)

File: `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md`

**Command 02 today only knows how to build from scratch — `--using` adds a second, mutually-exclusive mode, and the split must be made explicit in the command file.** As written, Command 02 generates every file fresh by mimicking the bundled `math-workflow` / `create-workflow` reference patterns — see its Step 1.3, Step 3, and Steps 4a/4c/4d/4e, all of which say *"following the math-workflow … pattern"*. The implementer must add a clear decision point at the start of the build phase (Step 3 / Step 4) so a fresh agent picks **exactly one** path, and must scope the existing template-mimicking instructions to from-scratch mode so they don't fire on a copy run:

- **Copy mode** — the approved spec **contains** a "Source Workflow & Copy Plan" section. Command 02 copies the **source workflow's own files** (per the plan) and rewires them. The template-based generation in Steps 4a/4c/4d/4e is **superseded** — the source workflow *is* the template, so the agent must **NOT** regenerate those files from `math-workflow`. (The bundled reference workflows stay useful only as a guide to *what* must be rewired, never as content to copy in.)
- **Create-from-scratch mode** — **no** "Source Workflow & Copy Plan" section. Command 02 behaves exactly as it does today: generate every file from the `math-workflow` / `create-workflow` patterns.

The two paths re-converge once the files exist: the plugin-manifest step (4f), the build summary + human-review gate (Step 5), Write Output, and Self-Terminate are identical in both modes.

#### Suggested implementation: a `creation-mode` variable + one clean fork (modify-in-place, don't fully refactor)

This is a recommendation for *how* to wire the branch, not a hard requirement — but it keeps the diff small and avoids two-sources-of-truth drift:

- **The mode signal is in the spec, not the input.** Command 01's output string is deliberately unchanged (§2), so the `--using` short-id never reaches Command 02 via `command-input.json`. The **only** signal that this is a copy run is the presence of the **"Source Workflow & Copy Plan"** section in the **APPROVED** spec. Therefore `creation-mode` cannot be set in Step 0a/0b — set it **right after the spec is read** (Step 1, where the spec and its execution-agent callouts are already being parsed):

  ```
  creation-mode = (APPROVED spec contains a "Source Workflow & Copy Plan" section) ? from-existing : from-scratch
  ```

- **Branch at only the points that genuinely diverge — most of the command is shared.** Walking the command, the modes differ at exactly **three** places; everything else (Step 0a/0b, Step 2 rename, Step 4-Step 0 plan-copy, 4b `ahq-workflow.json`, 4f plugin manifest, Step 5 gate, Step 6 output, Step 7 terminate) stays **single and unbranched**:
  1. **Step 1.3 (read context)** — `from-scratch`: read `math-workflow` / `create-workflow` as **templates**; `from-existing`: read the **source workflow** at the plan's absolute paths (the reference workflows are now only a guide to *what to rewire*, not content to copy in).
  2. **Step 3 (plan mode)** — `from-scratch`: plan what to generate from the template; `from-existing`: plan to **execute the Copy Plan**.
  3. **File creation (Steps 4a/4c/4d/4e)** — fork as a **single block**, not four interleaved `if/else`s: in `from-existing` these four collapse into one action — *copy the source's files, then apply the rewire + identity-sweep + removal/renumber manifests* — so a copy-mode agent should jump straight to that block and skip 4a/4c/4d/4e entirely, rather than ping-ponging past four from-scratch halves.

- **Don't split Command 02 into two parallel `## Step 4 (copy)` / `## Step 4 (from-scratch)` sections.** That duplicates the shared steps (plan-copy, 4b, 4f, Step 5–7) and creates the exact drift the project guards against. Keep the familiar linear structure, introduce `creation-mode`, and fork surgically at the three points above (point 3 being a clean block-level fork). Scope each existing *"following the math-workflow … pattern"* instruction to the `from-scratch` branch so it doesn't fire on a copy run.

**In copy mode, Command 02 is the doer:** it executes the plan, performing the copy **before** applying modifications. It does **not** re-resolve the short-id or re-derive paths — Command 01 already planned all of that. Command 02 does need enough understanding of workflow structure to apply each step correctly, because copying a TypeScript workflow is **not** a plain `cp` — it must be rewired. Executing the plan means:

- Copy every file/dir in the plan's **copy manifest** from the plan's absolute source dirs to its absolute destination dirs (a cross-root copy when the source is in the AHQ install — the plan's paths already account for that).
- Rename the CLI file `{source-workflow-id}-cli.ts` → `{new-workflow-id}-cli.ts`.
- Repoint the `COMMAND_NN_*` command-path constants inside the CLI to the new `/{plugin-id}:{workflow-id}:NN-…` paths.
- Rewrite `ahq-workflow.json` (`pluginId`, `skillId`, `shortId`, `description`).
- Update `package.json` `name` and the `SKILL.md` skill-base-dir path / CLI filename.

> **The copied workflow runs in the new (often non-AHQ) workspace automatically.** The standardized `SKILL.md` carries an `agentic-hq` env-var symlink step that resolves the framework from the AHQ install regardless of where the workflow lives, so the copy needs **no** special dependency rewiring. (This env-var symlink standard was fixed & committed in [AHQ-162](https://agentic-hq.atlassian.net/browse/AHQ-162).)

Then apply the modifications captured in the spec — **additions, changes, and removals**.

**Command removal is in scope for launch.** Command 01 captures any removal in the plan's **removal & renumber manifest** (which `NN-*.md` to delete, the renumber map, the resulting CLI constant/order changes). Command 02 executes that manifest, using its workflow understanding to keep the result consistent:

- Delete the removed command's `NN-*.md` file(s).
- **Renumber** the remaining `NN-` command files so the sequence stays gapless and contiguous (e.g. removing `03` shifts `04→03`, `05→04`).
- **Rewire the CLI to match the new numbering**: update the `COMMAND_NN_*` constant names and their `/{plugin-id}:{workflow-id}:NN-…` path strings, and the linear invocation order, so they reference the renumbered files. (Mis-numbered constants are the classic break — Claude returns "Unknown skill" if a constant points at a filename that no longer exists.)
- Carry the same renumbering through any per-command references in the help docs.

NOTE: Some removals may just be within a command, in which case there is no need for this renumbering.

**Command addition.** Adding a whole new command is also supported. Two cases: **appended at the end** (e.g. a new final command) needs **no** renumbering — just add the `NN-*.md` file and its `COMMAND_NN_*` constant at the end of the CLI's invocation order. **Inserted mid-sequence** (e.g. a new command between `02` and `03`) uses the **same renumber machinery as removal, in reverse**: shift the subsequent `NN-` files up to make room (`03→04`, `04→05`, …), then rewire the CLI's `COMMAND_NN_*` constant names, `/{plugin-id}:{workflow-id}:NN-…` path strings, and invocation order to match. Command 01 captures whichever case applies in the plan (alongside the removal & renumber manifest); Command 02 executes it.

## Background

When Steve asked a coder at a meetup whether they could imagine finding Agentic HQ useful he was told it may not be that useful because "everyone has their own workflow". This `create-workflow --using` is the core customisation feature of the system that lets people take an existing workflow (a friend's, a co-worker's, the flagship simple `add-feature` workflow), run it to try it, then easily make it their own.

For launch, `--using` does not need to solve every possible customisation request. It does need to make the path credible:

- accept the `--using` option,
- copy the source workflow to a new id,
- update metadata (rewire as in §3),
- customise the workflow,
- provide help docs covering the `--using` behaviour (basing a new workflow on an existing one) — see Documentation / AC 6.

## Documentation

Create-workflow help docs should be created and include coverage for `--using`. They live with the `create-workflow` skill, which is in **`agentic-hq-core-plugin`** (not the demos plugin):

```text
.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/docs/
└── workflow-help-docs/
    ├── 00-create-workflow-user-help-doc.md
    └── using-existing-workflow-help-doc.md
```

(This `docs/workflow-help-docs/` structure matches the pattern already used by `add-feature`. No `docs/` dir exists under `create-workflow` yet, so this is net-new.)

- **`using-existing-workflow-help-doc.md`** should explain `agentic-hq create-workflow -- --using=add-feature`, how it copies/adapts an existing workflow, and how you work with the AI to spec out the changes you want made (the AI then does that work for you).
- **`00-create-workflow-user-help-doc.md`** should document the whole `create-workflow` workflow and refer to `using-existing-workflow-help-doc.md` as the specialist doc for the `--using` option.

**✅ Already done (committed ahead of this ticket).** Four already-shipped docs showed the non-working bare syntax `agentic-hq create-workflow --using=add-feature` and have been corrected to the working `agentic-hq create-workflow -- --using=add-feature` form:

- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/docs/workflow-help-docs/00-add-feature-user-help-doc.md`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/docs/workflow-help-docs/04-reviewer-help-doc.md`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/04-reviewer.md`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature-detailed-example/docs/workflow-help-docs/00-add-feature-detailed-example-workflow-user-help-doc.md`

## Acceptance criteria

1. `agentic-hq create-workflow -- --using=add-feature` resolves the `add-feature` workflow, confirms it to the user, and proceeds down the copy-and-modify path — **including when run from a separate, empty workspace**, where `add-feature` exists only under the AHQ install root (`{agentic-hq-workspace-root-dir}`) and not under `{project-root}`. The resulting copy is created under `{project-root}` (cross-root copy) and runs there because its `SKILL.md` resolves `agentic-hq` via the env-var symlink standard fixed & committed in [AHQ-162](https://agentic-hq.atlassian.net/browse/AHQ-162).
2. An unrecognised short-id (e.g. `-- --using=does-not-exist`) informs the user and stops, asking them to fix and re-run — it does not proceed.
3. `agentic-hq create-workflow` (no `--using`) behaves exactly as before.
4. The produced new workflow is a rewired copy of the source (renamed CLI, repointed command constants, rewritten `ahq-workflow.json` / `package.json` / `SKILL.md`) plus the spec's modifications, and is runnable end-to-end via its new short-id.
5. A spec that **removes** one or more commands produces a copy with gapless renumbered `NN-` files and a CLI whose `COMMAND_NN_*` constants and invocation order match — and the resulting workflow runs end-to-end without an "Unknown skill" error.
6. The two `create-workflow` help docs exist and cover `--using`.
7. _(Already done — see Documentation.)_ The four `add-feature` / `add-feature-detailed-example` docs use the working `-- --using` syntax.

## Test approach (TDD-mandatory project)

- **No automated unit test for this ticket (see resolved AI Question 2):** the `create-workflow-cli.ts` change is just the `--using` Commander option plus the conditional `short-id-of-workflow-to-copy` clause in Command 01's input string — the same inline pattern already shipped (untested) by `add-feature-detailed-example-cli.ts`. Per the decision, the `--using` parsing (present and absent cases) is verified **manually**, not via a `*.unit.test.ts`.
- **Human-verified end-to-end:** the agent-driven resolve / copy / rewire / customise behaviour — verified by running `agentic-hq create-workflow -- --using=add-feature` and checking the produced workflow is runnable (AC 1 & 4).

## Decisions taken

**Command subtraction / renumbering — IN SCOPE for launch.** The copy-and-modify flow supports add / change / **remove**. Command removal carries renumbering of the `NN-` files and rewiring of the CLI's command constants + invocation order — see §3 and AC 5.

**`create-workflow` `exampleParameters` — leave as `""`.** Do **not** set it to `-- --using=add-feature`. `--using` is optional and not the primary use of `create-workflow`; surfacing it as the `agentic-hq list` example would imply it's required.

---

## Implementer Questions (added by Claude — 2026-06-24)

Two points surfaced while building context that the spec doesn't fully resolve. Each has a recommended answer — I'm happy to proceed on the recommendations once you confirm (or redirect). Everything else in the spec is clear and I'll implement it as written.

> Use the **Human's Answer** line under each to reply (or just tell me in chat).

### AI Question 1 — Copy manifest: also exclude a frozen `.npmrc`?

**Context.** The copy manifest (§2, "Copy manifest" bullet) excludes `node_modules/` and `pnpm-lock.yaml`, relying on the copied `SKILL.md` to run a fresh `pnpm install` on first run. But some source workflows also ship a `ts-workflow/.npmrc` containing **`frozen-lockfile=true`** — `create-workflow` itself does. (`add-feature`, the AC-1 / AC-4 target, does **not** ship an `.npmrc`, so the headline ACs are unaffected; this only bites when someone copies a source that has one, e.g. `--using=create-workflow`.) A frozen `.npmrc` **+** an excluded lockfile means the new workflow's first `pnpm install` **fails** (a frozen install with no lockfile errors out). I've hit this exact failure mode before on a fresh scaffold.

**AI Recommendation.** Add a frozen `.npmrc` to the exclusion list — i.e. exclude `node_modules/`, `pnpm-lock.yaml`, **and** any `.npmrc` that sets `frozen-lockfile=true`. The copy then does a clean fresh install and generates its own lockfile, which is exactly the intent behind excluding the lockfile. (Rejected alternative: copy the lockfile too — directly contradicts the spec's explicit "Exclude `pnpm-lock.yaml`".) This adds `.npmrc` to the §2 copy-manifest exclusions and to Command 02's copy step.

**Human's Answer:** **RESOLVED (2026-06-24).** Do **not** exclude `.npmrc`, and do **not** exclude the lockfile either — the copy keeps **both** `.npmrc` *and* `pnpm-lock.yaml`, excluding **only** `node_modules/`. Every AHQ workflow is meant to ship the frozen-lockfile `.npmrc` + a lockfile (the AHQ-152 supply-chain standard), and the lockfile was verified portable (importer key is `.`, `agentic-hq` recorded as the depth-relative `link:`, no absolute paths or workflow names), so a frozen `pnpm install` still passes after the copy's `name` rewrite. This **supersedes the AI Recommendation above** and **overrides §2's "Copy manifest" line**: change *"Exclude `node_modules/` and `pnpm-lock.yaml`"* to **exclude only `node_modules/`** (copy `.npmrc` + `pnpm-lock.yaml`). (Separately, the *from-scratch* path's missing-`.npmrc` bug — `create-workflow` never generating one, which is why `add-feature` lacked it — is fixed under [AHQ-164](https://agentic-hq.atlassian.net/browse/AHQ-164).)

---

### AI Question 2 — Where should the `create-workflow-cli.ts` unit test live and run?

**Context.** The Test approach calls for a RED-first unit test of `--using` parsing + Command 01 input-string construction. But: (a) **no `ts-workflow` package anywhere has a test framework** (no vitest, no `test` script, no `*.test.ts`); (b) the existing `add-feature-detailed-example-cli.ts` does the identical conditional-param-append for `--ticket-id` and was shipped **without** a unit test; (c) the main unit suite (`tests/unit/**` — the only tests `pnpm validate` runs) does **not** currently import any `ts-workflow` code, which is deliberately isolated (eslint-ignored + its own tsconfig).

**AI Recommendation.** Extract the input-string construction into a small **pure, dependency-free** helper module in the create-workflow `ts-workflow/src/` (e.g. `command-01-input.ts` exporting `buildCommand01Input(workspaceRoot, using?)`), have `create-workflow-cli.ts` call it, and add `tests/unit/create-workflow/command-01-input.unit.test.ts` asserting both the present and absent `--using` cases. This keeps the test inside `pnpm validate` with real behavioural assertions (I've verified vitest/`tsc`/eslint all handle the one cross-boundary relative import cleanly). **Caveat:** it makes the main unit suite reach across into a single `ts-workflow` source file — the one boundary the project otherwise keeps hard. If you'd rather keep that boundary intact, the alternative is to add vitest to the `ts-workflow` package and test there, but then `pnpm validate` won't run it. I'll go with the `tests/unit/**` approach unless you object.

**Human's Answer:**. No unit tests required for this Jira, thanks - going to do all the testing manually myself afterwards.

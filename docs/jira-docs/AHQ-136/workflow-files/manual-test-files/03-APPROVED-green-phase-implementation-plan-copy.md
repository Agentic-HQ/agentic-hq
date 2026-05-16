# GREEN Phase Plan: AHQ-136 — Upgrade pnpm 10 → 11 (manual test)

## Context

**Why this change is being made:** The repo pins pnpm `10.33.0` via `package.json`'s `packageManager` field. pnpm 11 has shipped (latest `11.1.2`), and pnpm prints an "Update available!" nag on every install/workflow run. pnpm 11 also brings supply-chain hardening (`minimumReleaseAge`, `blockExoticSubdeps`, `strictDepBuilds`) and faster installs. This Jira upgrades the package manager, migrates the one removed config setting (`onlyBuiltDependencies` → `allowBuilds`), and verifies the dev-CLI install path still works.

**Test type is `manual`** — there are no automated tests. The "implementation" is config-file edits + lockfile regeneration. Verification is a manual checklist (the human + AI run it per the agreed Q3 split).

**Intended outcome:** `pnpm install` / `pnpm validate` succeed under pnpm 11 with no `onlyBuiltDependencies` warning and no "Update available!" nag; the plugin `ts-workflow` sub-projects install cleanly under pnpm 11; the dev-CLI install script + end-to-end workflow still work; and the `create-workflow` scaffolding command is updated so every future workflow is born pnpm-11-correct.

---

## Replan Note — pnpm 11 `--ignore-workspace` Incompatibility (added 2026-05-15, mid-GREEN)

**The originally-approved plan was wrong on one assumption** and is being revised here. What happened:

1. Steps 1–3 went fine: root `pnpm-workspace.yaml` migrated, `engines.pnpm` bumped, `corepack use pnpm@11.1.2` rewrote the `packageManager` pin. (`corepack use`'s own install aborted with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` because pnpm 11 wants to purge the pnpm-10-era `node_modules` and needs TTY confirmation — resolved by running `CI=true pnpm install`, a one-shot env var, no config/env file touched. Root install then succeeded cleanly.)
2. Step 4–5 hit a real bug. The original plan kept `pnpm install --ignore-workspace` for the sub-projects (the long-standing way they install). Under pnpm 11 that **fails**: `[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild@0.27.7`. pnpm even **overwrote** the hand-written `allowBuilds` map with a placeholder.
3. **Root cause** (confirmed empirically *and* by Perplexity research — see [`perplexity-answer-about-ignore-workspace.md`](../additional-docs/perplexity-answer-about-ignore-workspace.md)): in pnpm 11, `--ignore-workspace` is a "do not use workspace config" mode. It makes pnpm skip the `pnpm-workspace.yaml` in the **current** directory too — so the local `allowBuilds` is never read, and `strictDepBuilds: true` then fails the install. There is **no** supported way to keep `--ignore-workspace` and still honour `allowBuilds`.
4. **The fix** (confirmed working — plain `pnpm install` in a sub-project dir returned exit 0, esbuild's postinstall ran): drop `--ignore-workspace` from every install invocation. Once a sub-project has its **own** `pnpm-workspace.yaml`, a plain `pnpm install` stops at that nearest workspace file and treats the directory as its own workspace root — isolation from the repo-root workspace is preserved, and `allowBuilds` is honoured.

**Two consequences fold into the revised plan below:**

- **A.** Each sub-project `pnpm-workspace.yaml` also declares `packages: ['.']` (Perplexity: "clearer and more robust" for a single-package workspace root). And `--ignore-workspace` must be dropped from **all** install invocations (root `package.json` scripts, `SKILL.md` files, `create-workflow` command 03, doc comments) — see new **Step 4b**.
- **B.** A **6th `ts-workflow`** was found that the AI summary's "5 sub-projects" list missed: `tests/e2e/fixtures/string-reversal-copy-for-test/skills/string-reversal-copy-for-test/ts-workflow/`. It is a self-contained copy of the string-reversal workflow used by the cross-workspace e2e tests, its `package.json` carries the same dead `pnpm.onlyBuiltDependencies` block, and its `SKILL.md` uses `--ignore-workspace`. If not migrated, the e2e suite breaks under pnpm 11. **Recommended in scope** — it is now included below (flagged here for human review since it extends the AI summary's stated scope).

---

## Resolution Note — pnpm 11 global-bin PATH change (added 2026-05-16)

During manual verification (Step 8), `scripts/infra/install-dev-agentic-hq.sh` failed at the `pnpm link --global` step: `[ERROR] The configured global bin directory ".../Library/pnpm/bin" is not in PATH`. pnpm 11 moved the global bin directory from `$PNPM_HOME` to `$PNPM_HOME/bin`; the maintainer's PATH (from an old pnpm-10 `pnpm setup`) only had `$PNPM_HOME`. Research: [`perplexity-answer-about-pnpm-link-global-migration.md`](../additional-docs/perplexity-answer-about-pnpm-link-global-migration.md) and a contradicting [`gemini-second-opinion.md`](../additional-docs/gemini-second-opinion.md).

**Decisions settled with the human (2026-05-16):**

- **D1 — install script:** Option (a). Keep the `pnpm link --global` command as-is (the error was purely the PATH pre-check; the command itself still runs once PATH is fixed). Fix only the script's **factually-wrong comment block** — it referenced `~/.local/share/pnpm/global/` and `~/.pnpm/_bin/`, neither of which exists; corrected to `$PNPM_HOME/bin` and a pnpm-11 `pnpm setup` note added. This is the AC-mandated "documented in the script's comments" tweak. Escalate to `pnpm add -g .` (option b) only if `pnpm link --global` still fails after the human runs `pnpm setup`. **Option (b) — proactively switching to `pnpm add -g .` (pnpm 11's recommended mechanism) — is deferred to follow-up Jira [AHQ-144](https://agentic-hq.atlassian.net/browse/AHQ-144).** Description also at [`../additional-docs/later-jira-description-for-switching-to-pnpm-add.md`](../additional-docs/later-jira-description-for-switching-to-pnpm-add.md). It is deferred because it needs verification that `pnpm add -g .` produces a live-source symlink (not a copy), which is beyond GREEN-phase minimality.
- **D2 — README note:** In scope. Added a `[!NOTE]` callout to Quick Start step 3 (pnpm 11 stores globals in `$PNPM_HOME/bin`; run `pnpm setup` once if the install errors; old pnpm-10 globals can stay). Also corrected the stale `pnpm --version` comment (`10.33.0` → `11.1.2`).
- **Old pnpm-10 global binaries — NOT cleaned up.** Perplexity and Gemini contradicted each other (leave vs. clean up). Reconciliation: the human's 3 old globals are all `link:` deps (near-zero disk footprint, so Gemini's disk argument is moot), and pnpm-11 `pnpm setup` rewrites its own managed `# pnpm` PATH block — so the old top-level shims become orphaned-but-unreachable, i.e. harmless, as Perplexity says. No cleanup is a repo change anyway; it is machine state, out of AC scope. Instead, Step 8 gains a **verify-don't-clean** check: `which agentic-hq` must resolve to `$PNPM_HOME/bin/agentic-hq`.
  - **Confirmed empirically 2026-05-16:** after `pnpm --force setup`, `echo $PATH` showed `/Users/.../Library/pnpm` was **replaced** by `/Users/.../Library/pnpm/bin` (not added alongside). The old pnpm-10 directory is no longer on PATH at all, so the orphaned pnpm-10 shims are unreachable — no PATH shadowing is possible. This empirically settles the Gemini-vs-Perplexity debate in favour of "leave them".

Files changed by this resolution: `scripts/infra/install-dev-agentic-hq.sh` (comments only), `README.md` (pnpm-11 note + version-comment fix).

**`pnpm setup` actually needed `--force` (observed 2026-05-16).** The research said re-running `pnpm setup` would cleanly manage its own shell block. In practice, pnpm 11's `pnpm setup` **refused** because `~/.zshrc` still held the pnpm-10 `# pnpm` block: `[ERR_PNPM_BAD_SHELL_SECTION] ... already contains a pnpm section but with other configuration`. The maintainer backed up `~/.zshrc` and re-ran `pnpm --force setup`, which replaced the block. The `diff` confirmed the change was minimal and exactly as diagnosed — only the PATH line, on two lines:

```diff
<   *":$PNPM_HOME/bin:"*) ;;
<   *) export PATH="$PNPM_HOME/bin:$PATH" ;;
---
>   *":$PNPM_HOME:"*) ;;
>   *) export PATH="$PNPM_HOME:$PATH" ;;
```

`PNPM_HOME` itself was unchanged. The install-script comment and README note were updated to tell users to back up their rc file and use `pnpm --force setup` if they hit `ERR_PNPM_BAD_SHELL_SECTION`.

---

## Resolution Note 2 — `pnpm link --global` removed in pnpm 11 → switched to `pnpm add -g .` (added 2026-05-16)

D1 option (a) assumed `pnpm link --global` still works under pnpm 11. **It does not.** pnpm 11 removed the bare `pnpm link --global` form — `pnpm link --help` shows `Usage: pnpm link <dir>` with no `--global` flag. Re-running the install script produced `[ERR_PNPM_LINK_BAD_PARAMS] You must provide a parameter`. (The separate `[WARN] Using --global skips the package manager check` line is benign — see below.)

Because the install script is genuinely broken under pnpm 11, AHQ-136 cannot ship the upgrade without fixing it — so **D1 escalates from option (a) to option (b): switch `pnpm link --global` → `pnpm add -g .`** (pnpm 11's documented replacement). With `pnpm link --global` removed, this is now the *minimal* fix, not gold-plating.

**Verified live-source symlink** (AHQ-144 AC1): after `pnpm add -g .`, `~/Library/pnpm/global/v11/<hash>/node_modules/agentic-hq` is a symlink to `/Users/.../dev/agentic-hq/agentic-hq`, and the bin shim execs through it. Dev mode works.

**The `[WARN] Using --global skips the package manager check for this project`** is benign — it appears only because the command runs from the repo root (a project with a pinned `packageManager`); pnpm does not enforce that pin for a `--global` install. Researched in [`../additional-docs/perplexity-answer-about-global-package-manager-check-warning.md`](../additional-docs/perplexity-answer-about-global-package-manager-check-warning.md). Decision: keep `pnpm add -g .` run from the repo root, accept the warning, and have the install script's own output explain it is expected.

**AHQ-144** (the deferred "switch to `pnpm add -g .`" Jira) is now done **within AHQ-136** — it should be closed as completed-by-AHQ-136.

**Also fixed (user-approved scope extension):** the 5 `tests/e2e/demo/*.e2e.test.ts` files each had a PATH fallback adding `$PNPM_HOME` (pnpm 10 layout) instead of `$PNPM_HOME/bin` (pnpm 11), plus stale `pnpm link --global` comments/console strings. All 5 updated.

Files changed by this resolution: `scripts/infra/install-dev-agentic-hq.sh`, `README.md`, and 5 × `tests/e2e/demo/*.e2e.test.ts`. `pnpm validate` passed afterwards.

---

## Resolution Note 3 — scope change: pnpm 11 as corepack global default (added 2026-05-16)

**The human changed the scope of AHQ-136.** New title: *"Upgrade pnpm From 10 To 11 As
Global Default, In Agentic HQ And Workflow Typescript Projects"*.

**Why.** There is exactly one `pnpm` on the machine — the corepack shim — and corepack
resolves the pnpm version **per-directory** from each project's `packageManager` field.
Inside `agentic-hq/` (pins `pnpm@11.1.2`) corepack runs pnpm 11.1.2; in an unpinned
directory (e.g. `/tmp`) it runs its **global default**, which was still pnpm 10.33.0.
Because pnpm 10 and 11 disagree about the global bin directory (`$PNPM_HOME` vs
`$PNPM_HOME/bin`), `cd /tmp; pnpm list -g` invoked pnpm 10.33.0, which errored
(`global bin directory ... is not in PATH`) and did not list the globally-installed
`agentic-hq`.

**Resolution.** A new requirement (Req 16 below) is added: pnpm 11 must also become the
corepack **global default**. This is a global machine change, so — like the smoke test —
it is delivered as **human-run instructions**: the human runs `corepack install -g
pnpm@11.1.2` and verifies `cd /tmp; pnpm list -g` works and lists `agentic-hq`. The AI
must NOT run it. The Jira title + description update is recorded in
[`../additional-docs/jira-update-for-scope-change.md`](../additional-docs/jira-update-for-scope-change.md)
for the human to apply.

No repo files change for this requirement — it is purely a corepack-default machine change
plus its verification.

---

## Jira Requirements (Numbered)

1. `package.json` `packageManager` bumped to `pnpm@11.1.2` (latest patch — AC allows "latest patch at time of work"; `npm view pnpm version` = `11.1.2`) → **[Step 3 — DONE]**
2. `engines.pnpm` bumped from `>=10.0.0` to `>=11.0.0` (per AI-summary Q1: "Yes, bump it") → **[Step 2 — DONE]**
3. Root `pnpm-workspace.yaml` migrated from `onlyBuiltDependencies:` (list) to `allowBuilds:` (map) — same 3 packages → **[Step 1 — DONE]**
4. Root `pnpm-workspace.yaml` doc-comment block updated to reference pnpm 11 → **[Step 1 — DONE]**
5. `pnpm install` succeeds cleanly, no `onlyBuiltDependencies`-removed warning; regenerates `pnpm-lock.yaml` → **[Step 3 — DONE, Step 7]**
6. `pnpm validate` passes (typecheck / lint / format / unit tests) → **[Step 7]**
7. The plugin `ts-workflow` sub-projects migrated: dead `"pnpm": { "onlyBuiltDependencies": [...] }` block removed from each `package.json`, replaced by a per-directory `pnpm-workspace.yaml` with `packages: ['.']` + `allowBuilds:` → **[Step 4]**
8. Each sub-project installs cleanly under pnpm 11 — requires dropping `--ignore-workspace` (see Replan Note) → **[Step 4b, Step 5]**
9. `create-workflow` Command 02 (`02-confirm-spec-approved-and-build.md`) updated so the scaffolding agent also creates a `pnpm-workspace.yaml` (with `packages: ['.']` + `allowBuilds`) for new workflows and uses plain `pnpm install` → **[Step 6]**
10. `scripts/infra/install-dev-agentic-hq.sh` re-run successfully; `agentic-hq` CLI reachable from a fresh terminal → **[Step 8 — manual, AI runs with human go-ahead per Q3]**
11. One workflow smoke-tested end-to-end (`agentic-hq reversal -- --string-to-reverse="upgrade smoke test"`) → **[Step 8 — manual, AI runs with human go-ahead per Q3]**
12. No "Update available!" nag printed during workflow runs → **[Step 8 — verified during the smoke test]**
13. If `pnpm link --global` semantics needed a script tweak, document it in the script's comments → **[Step 8 — only if Step 8 reveals a break; no change anticipated]**
14. Out of scope: eslint 9→10, typescript 5.9→6, patch bumps, Node 24 (AHQ-135) → **N/A (nothing to implement)**
15. `create-workflow` end-to-end verification (running it to confirm a generated workflow gets a working `pnpm-workspace.yaml`) is **owned by AHQ-143**, not this Jira → **N/A (AHQ-136 only reviews the Command 02 edit — Step 6)**
16. **(Scope change 2026-05-16 — see Resolution Note 3)** pnpm 11 must become the corepack **global default** so that from any directory `pnpm` is v11 and `cd /tmp; pnpm list -g` runs without error and lists `agentic-hq`. Global machine change → **[Step 8 — human runs `corepack install -g pnpm@11.1.2` and verifies; AI must not run it]**

---

## Project Design Requirements Compliance

`docs/dev/project-design-requirements.md` was found and read in full. It is **entirely about object-oriented code design** — class/interface pairs per concept, "tell don't ask", constructor injection, avoiding cached state, and the Concept Table / Data Dictionary / English Language Description sections required during design.

**None of it applies to AHQ-136.** This Jira introduces **no new code, no classes, no concepts** — it edits config files (`package.json`, `pnpm-workspace.yaml` files) and one workflow command `.md` file, and regenerates lockfiles. There is nothing to model as objects.

| # | Design Requirement | Applies? | Notes |
|---|-------------------|----------|-------|
| D.1 | Class/interface pair per concept | No | No concepts/classes introduced — config-only change |
| D.2 | Tell don't ask | No | No code/methods written |
| D.3 | Minimal state / avoid caching | No | No code/objects written |
| D.4 | Switchable concrete classes | No | No code/classes written |
| D.5 | Concept Table | No | No concepts to map |
| D.6 | Data Dictionary section | No | No concepts/classes to dictionary |
| D.7 | English Language Description | No | No object interactions to describe |

The Concept Table / Data Dictionary / English Language Description sections are **legitimately skipped** — genuinely not applicable to a config-only change, not omitted by oversight. Confirmed in the AI summary.

---

## Implementation Steps

### Step 0: Copy this approved plan — DONE (re-copied after this replan)
The plan was copied to `docs/jira-docs/AHQ-136/workflow-files/manual-test-files/03-APPROVED-green-phase-implementation-plan-copy.md` at Step 0; it is re-copied there now that this replan revision is complete.

### Step 1: Migrate root `pnpm-workspace.yaml` — DONE
File: `pnpm-workspace.yaml`
- `onlyBuiltDependencies:` list → `allowBuilds:` map (same 3 packages `node-pty`, `esbuild`, `unrs-resolver`).
- Doc-comment updated: pnpm 10.x → pnpm 11.x wording; socket.dev pnpm-10 link → `https://pnpm.io/11.x/migration`.
- **Still to do here (Step 4b):** line ~26 comment "...self-contained mini projects, use `--ignore-workspace`" is now wrong — update it.

### Step 2: Bump `engines.pnpm` in root `package.json` — DONE
`"pnpm": ">=10.0.0"` → `">=11.0.0"`.

### Step 3: Bump `packageManager` + regenerate lockfile — DONE
- `corepack use pnpm@11.1.2` rewrote `packageManager` with the full `+sha512.…` hash.
- `CI=true pnpm install` regenerated `node_modules`/lockfile under pnpm 11; clean, no `onlyBuiltDependencies` warning. `pnpm --version` → `11.1.2`.

### Step 4: Migrate the 6 `ts-workflow` sub-projects
The 5 plugin sub-projects **plus** the 1 e2e-fixture sub-project (see Replan Note B):
- `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/`
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/`
- `tests/e2e/fixtures/string-reversal-copy-for-test/skills/string-reversal-copy-for-test/ts-workflow/`

For **each**:
1. **Remove** the dead `"pnpm": { "onlyBuiltDependencies": [...] }` block from `package.json` (pnpm 11 ignores `package.json#pnpm` entirely). *(The 5 plugin `package.json` files — DONE; the e2e-fixture `package.json` — still to do.)*
2. **Create** a `pnpm-workspace.yaml` in the same `ts-workflow/` directory:
   ```yaml
   # =============================================================================
   # pnpm Workspace Configuration — standalone ts-workflow sub-project
   # =============================================================================
   #
   # This ts-workflow is a self-contained single-package project. It carries its
   # own pnpm-workspace.yaml so that a plain `pnpm install` run in this directory
   # treats THIS directory as the workspace root (pnpm stops at the nearest
   # pnpm-workspace.yaml and never walks up to the repo root).
   #
   # pnpm 11 no longer reads the `pnpm` field of package.json, so build-script
   # approvals must live here in pnpm-workspace.yaml. Note: `--ignore-workspace`
   # must NOT be used — it makes pnpm treat the install as non-workspace and skip
   # this file's allowBuilds, causing strictDepBuilds to fail the install.
   #
   # Why these packages need build scripts:
   # - agentic-hq: local link: dependency with a postinstall (chmod fix for node-pty)
   # - node-pty:   compiles native binaries for PTY terminal emulation
   # - esbuild:    compiles native binaries for fast JS/TS bundling
   #
   # See: https://pnpm.io/11.x/migration
   # =============================================================================

   packages:
     - '.'

   allowBuilds:
     agentic-hq: true
     node-pty: true
     esbuild: true
   ```
   *(The 5 plugin `pnpm-workspace.yaml` files exist but currently lack the `packages: ['.']` line — add it. The e2e-fixture `pnpm-workspace.yaml` — still to create.)*
   (Package set `agentic-hq, node-pty, esbuild` = each sub-project's former `onlyBuiltDependencies` list — verified identical across all 6.)

### Step 4b: Drop `--ignore-workspace` from all install invocations
`--ignore-workspace` is incompatible with the local-`pnpm-workspace.yaml` approach (see Replan Note). Change `pnpm install --ignore-workspace` → `pnpm install` in:
- **Root `package.json`** — the 4 `demo:plugin-direct:*` scripts (string-reversal, math-workflow, quick-jira-workflow, full-jira-tdd-story-workflow).
- **5 plugin `SKILL.md` files** — `create-workflow`, `math-workflow`, `string-reversal`, `quick-jira-workflow`, `full-jira-tdd-story-workflow` (the `command-output-string` install command).
- **e2e-fixture `SKILL.md`** — `tests/e2e/fixtures/string-reversal-copy-for-test/skills/string-reversal-copy-for-test/SKILL.md`.
- **`create-workflow/03-run-checks-on-workflow.md`** — the `pnpm install --ignore-workspace` command (~line 135) and the explanatory line about `--ignore-workspace` (~line 138) — reword to explain the local `pnpm-workspace.yaml` provides isolation.
- **Root `pnpm-workspace.yaml`** — the line ~26 comment "...self-contained mini projects, use `--ignore-workspace`" — reword (each sub-project now has its own `pnpm-workspace.yaml`; plain `pnpm install`).

### Step 5: Install each sub-project under pnpm 11
- Run plain `pnpm install` (NO `--ignore-workspace`) in each of the 6 `ts-workflow/` directories; confirm each succeeds (builds `node-pty`/`esbuild`, no `strictDepBuilds` failure). `CI=true` may be needed for the modules-purge confirmation, as in Step 3.

### Step 6: Update `create-workflow` Command 02
File: `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md`
- **Step 1 reference list** (math-workflow reference bullets, ~line 64): add `ts-workflow/pnpm-workspace.yaml` alongside `package.json` as a pattern to read.
- **Step 3 plan outline** (~line 99): mention `pnpm-workspace.yaml` so the plan covers it.
- **Step 4e** (`### 4e. Create package.json and tsconfig.json`, ~line 217): broaden so the scaffolding agent also creates `ts-workflow/pnpm-workspace.yaml` (with `packages: ['.']` + the `allowBuilds` map). Update the 4e heading/body.
- **Step 5a build summary "Skill files" list** (~line 259): add `ts-workflow/pnpm-workspace.yaml`.
- Documentation/command edit only; end-to-end verification owned by AHQ-143 (Req 15).

### Step 7: Validate
- Run `pnpm validate` from the repo root (typecheck + lint:check + format:check + unit tests). All four must pass 100%.
- `format:check` may flag the edited files — if so, and **only** files changed in this Jira are flagged, run `prettier --write` on just those (per project CLAUDE.md scoped-formatter rule). If unrelated files are flagged, leave them.

### Step 8: Manual verification gate (human + AI per Q3)
This is the `manual` test. Present the verification checklist to the human. Per AI-summary Q3, the AI runs **all** of it but the two global-state/real-Claude steps need explicit human go-ahead first, and the AI reports results back:
- AI runs immediately (project-local): `pnpm install` clean, `pnpm --version` = `11.1.2`, `pnpm validate` passes, 6 sub-projects install clean with plain `pnpm install`, no `onlyBuiltDependencies` warning.
- **Human runs (global machine change — Req 16, scope change):** `corepack install -g pnpm@11.1.2` to make pnpm 11 the corepack global default, then verifies `cd /tmp; pnpm -version` is 11.x and `cd /tmp; pnpm list -g` runs without error and lists `agentic-hq`. The AI must NOT run this.
- AI runs **after explicit human go-ahead** (global state): `scripts/infra/install-dev-agentic-hq.sh` (does `pnpm add -g .`).
- AI runs **after explicit human go-ahead** (real Claude invocation): the end-to-end smoke test — fresh terminal `which agentic-hq` (must resolve to `$PNPM_HOME/bin/agentic-hq`, not a stale pnpm-10 shim — see Resolution Note), then `agentic-hq list`, then `agentic-hq reversal -- --string-to-reverse="upgrade smoke test"`; confirm reversed output AND no "Update available!" nag.
- The `pnpm link --global` script tweak (D1) and README note (D2) are settled — see Resolution Note above (Req 13).
- GREEN phase is **not complete** until the human confirms all manual checks pass.

### Step 9: Re-read this command file
After Step 6 implementation, re-read `03-jira-minimal-implementation.md` (Steps 7–12) and follow it: write the GREEN phase summary doc, add the Jira comment, present to human, write `command-output.json`, self-terminate. Do **not** rely on memory.

---

## Files Modified / Created

**Modified:**
- `pnpm-workspace.yaml` — `onlyBuiltDependencies` → `allowBuilds`, doc-comment to pnpm 11, line-26 comment reworded (Step 4b)
- `package.json` — `packageManager` → `pnpm@11.1.2+sha512.…`, `engines.pnpm` → `>=11.0.0`, 4 `demo:plugin-direct:*` scripts drop `--ignore-workspace`
- `pnpm-lock.yaml` — regenerated by `pnpm install`
- 6 × `ts-workflow/package.json` (5 plugin + 1 e2e fixture) — remove dead `pnpm` block
- 6 × `SKILL.md` (5 plugin + 1 e2e fixture) — drop `--ignore-workspace` from the install command
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/03-run-checks-on-workflow.md` — drop `--ignore-workspace`, reword its explanatory line
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/02-confirm-spec-approved-and-build.md` — scaffold `pnpm-workspace.yaml` (with `packages: ['.']` + `allowBuilds`) for new workflows; plain `pnpm install`

**Created:**
- 6 × `ts-workflow/pnpm-workspace.yaml` — per-sub-project `packages: ['.']` + `allowBuilds` map
- `docs/jira-docs/AHQ-136/workflow-files/manual-test-files/03-APPROVED-green-phase-implementation-plan-copy.md` (Step 0; re-copied after this replan)
- `docs/jira-docs/AHQ-136/workflow-files/manual-test-files/03-green-phase-summary-of-what-was-implemented.md` (command Step 8 — after all checks pass)
- `docs/jira-docs/AHQ-136/workflow-files/additional-docs/perplexity-answer-about-ignore-workspace.md` (research that drove this replan)

Each sub-project lock file (`ts-workflow/pnpm-lock.yaml`) also refreshes when Step 5 installs run.

---

## Verification

The `manual` test = the Step 8 checklist. End-to-end success criteria:
1. `pnpm install` clean — no `onlyBuiltDependencies` warning, regenerates `pnpm-lock.yaml`.
2. `pnpm --version` → `11.1.2`.
3. `pnpm validate` passes (typecheck + lint + format + unit tests).
4. Each of the 6 `ts-workflow` sub-projects → plain `pnpm install` succeeds (esbuild/node-pty build, no `strictDepBuilds` failure).
5. `install-dev-agentic-hq.sh` re-runs OK; `agentic-hq list` works from a fresh terminal.
6. `agentic-hq reversal -- --string-to-reverse="upgrade smoke test"` produces expected reversed output.
7. No "Update available!" nag in workflow output.
8. Root `pnpm-workspace.yaml` doc-comment references pnpm 11.
9. `create-workflow` Command 02 now instructs scaffolding of `pnpm-workspace.yaml` (review-only; full e2e verification owned by AHQ-143).

---

## TODO (post-implementation)
- [ ] After Step 6 implementation, re-read `03-jira-minimal-implementation.md` (Steps 7–12) and follow it: write the GREEN phase summary doc, add the Jira comment, present to human, write `command-output.json`, self-terminate. (Step 9 above.)

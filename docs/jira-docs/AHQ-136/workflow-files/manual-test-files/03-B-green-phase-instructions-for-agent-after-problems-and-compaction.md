# GREEN Phase Handoff — AHQ-136 (pnpm 10 → 11), after problems + compaction

**Written:** 2026-05-16 by the GREEN-phase agent, just before context compaction.
**For:** the next agent picking up the GREEN phase of AHQ-136.
**Test type:** `manual`. **Jira:** https://agentic-hq.atlassian.net/browse/AHQ-136

You are part-way through executing the command
`/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation`
(jira-id = `AHQ-136`, test-type = `manual`). Read this whole doc first, then continue.

---

## 0. Orientation — read these first

- **The approved (revised) plan:** `docs/jira-docs/AHQ-136/workflow-files/manual-test-files/03-APPROVED-green-phase-implementation-plan-copy.md` — read it fully. It was re-planned mid-GREEN; it has a "Replan Note" section.
- **The AI summary of the Jira:** `docs/jira-docs/AHQ-136/workflow-files/ai-summary-of-jiras-and-questions-for-human.md` — Jira understanding + the 3 resolved human questions (Q1 bump `engines.pnpm`; Q2 skip `minimumReleaseAge` docs; Q3 the AI runs the manual smoke tests but only with explicit human go-ahead for each).
- **The command file** (for the remaining Steps 7–12 of GREEN): `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/03-jira-minimal-implementation.md` — re-read its Steps 7–12 before doing the wrap-up; do not rely on this handoff alone for the doc/Jira-comment templates.
- **Research docs** (all in `docs/jira-docs/AHQ-136/workflow-files/additional-docs/`):
  - `perplexity-answer-about-onlyBuiltDependencies.md` — drove the `onlyBuiltDependencies` → `allowBuilds` migration.
  - `perplexity-answer-about-ignore-workspace.md` — drove the `--ignore-workspace` removal.
  - `perplexity-answer-about-pnpm-link-global-migration.md` — drove the `pnpm link --global` / PATH conclusions below. **Read this one in full** — it includes follow-up Q&A from the human.

**command-input-output-files-directory** (needed for Steps 11–12):
`/Users/stevepersonal/dev/agentic-hq/agentic-hq/.agentic-hq/temp/command-input-output-files/io-files-2026-05-15_20-45-17_493e5d57-9e92-44be-8fe6-284336704bf2`

**Hard constraints (from CLAUDE.md — do NOT violate):**
- **NEVER** run `pnpm setup`, and **NEVER** modify `~/.zshrc` or any shell/env file. If something needs a PATH change, STOP and ask the human to do it.
- **NEVER** `git add` / `git commit` / `git push`. The human commits via their own `/commit` command.
- `corepack use` aborts in non-interactive shells (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`); use `CI=true pnpm install` (a one-shot env var — does not modify any file).

---

## 1. What is ALREADY DONE (do not redo)

All implementation edits below are complete and `pnpm validate` passed (typecheck + eslint + prettier + 146 unit tests) **before** the manual-verification problem was hit.

**Root project:**
- `package.json` — `packageManager` → `pnpm@11.1.2+sha512.…` (via `corepack use`); `engines.pnpm` → `>=11.0.0`; the 4 `demo:plugin-direct:*` scripts had `--ignore-workspace` dropped.
- `pnpm-workspace.yaml` — `onlyBuiltDependencies:` list → `allowBuilds:` map (`node-pty`, `esbuild`, `unrs-resolver`); doc-comment updated to pnpm 11; the line-26 exclusion comment reworded (no longer says "use `--ignore-workspace`").
- `pnpm-lock.yaml` — **unchanged** (pnpm 11 still uses lockfileVersion 9.0, no dep versions changed → nothing to regenerate; this is expected, not a miss).
- Root `pnpm install` ran clean under pnpm 11 (`CI=true pnpm install`); `pnpm --version` → `11.1.2`.

**6 `ts-workflow` sub-projects migrated** (5 plugin + 1 e2e fixture):
1. `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/`
2. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/`
3. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/`
4. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/`
5. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/`
6. `tests/e2e/fixtures/string-reversal-copy-for-test/skills/string-reversal-copy-for-test/ts-workflow/`

For each: the dead `"pnpm": { "onlyBuiltDependencies": [...] }` block was removed from `package.json`, and a new `pnpm-workspace.yaml` was created with `packages: ['.']` + `allowBuilds: { agentic-hq: true, node-pty: true, esbuild: true }`.

**`--ignore-workspace` dropped everywhere** (it makes pnpm 11 skip the local `pnpm-workspace.yaml`'s `allowBuilds`, breaking installs — see `perplexity-answer-about-ignore-workspace.md`):
- root `package.json` 4 scripts; 6 `SKILL.md` files (5 plugin + e2e fixture); `create-workflow/03-run-checks-on-workflow.md` (command + explanatory text); root `pnpm-workspace.yaml` comment.

**`create-workflow/02-confirm-spec-approved-and-build.md`** updated (4 edits) so newly-scaffolded workflows get a `pnpm-workspace.yaml` (`packages: ['.']` + `allowBuilds`) and use plain `pnpm install`.

**Verified:** the 5 plugin sub-projects each install cleanly with plain `pnpm install` under pnpm 11 (esbuild/node-pty build, no `strictDepBuilds` failure). The e2e fixture (#6) cannot be installed standalone — its `agentic-hq` dep is `link:REPO_ROOT_PLACEHOLDER`, substituted only at e2e-test runtime — so it is exercised by the e2e suite, not here.

**`pnpm validate`** → PASSED 100%.

---

## 2. The OPEN PROBLEM — manual verification (GREEN Step 8) is blocked

Per AI-summary Q3, the human chose "I'll run both myself" for the two side-effecting manual checks. The human ran `scripts/infra/install-dev-agentic-hq.sh`:
- `pnpm install` part → OK.
- `pnpm link --global` part → **FAILED**:
  ```
  [ERROR] The configured global bin directory "/Users/stevepersonal/Library/pnpm/bin" is not in PATH
  Run "pnpm setup" to update your shell configuration.
  ```

**Diagnosis (confirmed):** pnpm 11 moved the global bin directory from `$PNPM_HOME` to `$PNPM_HOME/bin`. The human's `PNPM_HOME=~/Library/pnpm` is set and `~/Library/pnpm` is on PATH (from an old pnpm-10 `pnpm setup`), but `~/Library/pnpm/bin` is **not** on PATH. Under pnpm 10 the `agentic-hq` shim landed directly in `~/Library/pnpm/` (still there, orphaned). pnpm 11 wants `~/Library/pnpm/bin/`.

**Research conclusions** (full detail + citations in `perplexity-answer-about-pnpm-link-global-migration.md`, including 3 human follow-up questions):
1. This is a **documented pnpm 11 change**. The correct migration step is to run `pnpm setup` once after upgrading, so `$PNPM_HOME/bin` is added to PATH.
2. ~~Re-running `pnpm setup` manages its own shell-config block — the human does **not** need to manually delete the old `# pnpm` block first.~~ **CORRECTED 2026-05-16:** in practice pnpm 11's `pnpm setup` *refused* to touch the pre-existing pnpm-10 block — `[ERR_PNPM_BAD_SHELL_SECTION] ... already contains a pnpm section but with other configuration`. The human must back up their shell rc file and re-run as `pnpm --force setup`, which replaces the old block (the only diff is the PATH line: `$PNPM_HOME` → `$PNPM_HOME/bin`; `PNPM_HOME` unchanged).
3. Existing users **leave their other pnpm-10 global packages alone** — pnpm 10→11 is NOT a mass-uninstall/reinstall. The human explicitly decided: **leave old pnpm-10 binaries on disk; do not auto-clean anything.**
4. An install script should **not** auto-run `pnpm setup` (it changes the user's shell config). Recommended pattern: detect the missing PATH entry and print an actionable message.
5. pnpm's v11-recommended way to expose a local package's binary globally is `pnpm add -g .`; Perplexity describes `pnpm link --global` as superseded. **However** — empirically the error above was purely the PATH check; the `pnpm link --global` command itself still ran. So it is likely `pnpm link --global` will still succeed once the human's PATH includes `$PNPM_HOME/bin`. This is unconfirmed — see decisions below.

---

## 3. What REMAINS to finish GREEN

### 3a. Human action (their machine — you must NOT do this)
The human needs to run `pnpm setup` themselves (it edits `~/.zshrc`; you must not). If it errors with `ERR_PNPM_BAD_SHELL_SECTION` (a stale pnpm-10 `# pnpm` block), they back up `~/.zshrc` and re-run `pnpm --force setup`. Then open a fresh terminal so `$PNPM_HOME/bin` is on PATH. Ask them to do this when you resume. **DONE 2026-05-16** — the human ran `pnpm --force setup`; `~/.zshrc` updated (PATH line `$PNPM_HOME` → `$PNPM_HOME/bin`).

### 3b. Decisions to settle WITH THE HUMAN before finishing

**RESOLVED 2026-05-16** — D2 = in scope (README `[!NOTE]` added). Old pnpm-10 globals NOT cleaned up (verify-don't-clean: Step 3d gains a `which agentic-hq` check). **D1 = option (b)**: `pnpm link --global` turned out to be *removed* in pnpm 11 (install script failed with `[ERR_PNPM_LINK_BAD_PARAMS]`), so the script was switched to `pnpm add -g .` — its live-source symlink was verified. AHQ-144's work is therefore done within AHQ-136. The 5 e2e tests' `$PNPM_HOME` PATH fallback was also fixed to `$PNPM_HOME/bin`. See "Resolution Note 2" in `03-APPROVED-green-phase-implementation-plan-copy.md`. The original D1 options are kept below for reference.

Present these and get answers (AskUserQuestion is fine):

- **D1 — Install script (`scripts/infra/install-dev-agentic-hq.sh`).** Options:
  - (a) **Minimal:** leave the `pnpm link --global` command as-is — once the human runs `pnpm setup`, re-running the script should make `pnpm link --global` succeed. Then only fix the script's now-**factually-wrong comment block** (lines ~7–11 and ~24–25 reference `~/.local/share/pnpm/global/` and `~/.pnpm/_bin/` — neither exists; pnpm 11 uses `$PNPM_HOME/bin`). Comment fix is squarely in the Jira AC ("if `pnpm link --global` … needed a script tweak, the change is documented in the script's comments").
  - (b) Also switch `pnpm link --global` → `pnpm add -g .` (pnpm's v11-recommended command). **Risk:** must verify `pnpm add -g .` still gives a *live-source* install (the script's whole purpose is a symlink to live source for dev mode); if it copies instead of symlinks, dev mode breaks. Test before adopting.
  - (c) Also add a pre-flight check: if `pnpm bin -g` / `$PNPM_HOME/bin` is not on PATH, print an actionable "run `pnpm setup` once" message and exit cleanly.
  - **Recommendation:** do (a) first. Have the human run `pnpm setup` + re-run the script; if `pnpm link --global` then succeeds, (a) (comment fix only) is the minimal correct GREEN change. Escalate to (b)/(c) only if it still fails.
- **D2 — README / docs note.** Perplexity recommends a short note that pnpm 11 stores globals in `$PNPM_HOME/bin` and users should run `pnpm setup` once after upgrading. Is that in scope for AHQ-136? (Compare AI-summary Q2, where a `CONTRIBUTING.md` note was ruled out of scope — but this PATH change is more central to the install flow.) Get a ruling.

### 3c. Apply agreed changes, then update the plan copy
- Make whatever script/doc edits D1/D2 settle on.
- Update `docs/jira-docs/AHQ-136/workflow-files/manual-test-files/03-APPROVED-green-phase-implementation-plan-copy.md` to record the resolution (add a short note under the Replan Note, or a new dated note).
- If any non-`.sh` files changed, re-run `pnpm validate` (it does not lint shell scripts, but harmless).

### 3d. Human completes manual verification (GREEN Step 8 / command Step 7)
Ask the human to (after `pnpm setup` + fresh terminal):
1. Re-run `scripts/infra/install-dev-agentic-hq.sh` → completes cleanly.
2. From a fresh terminal, any directory: `which agentic-hq` → resolves to `$PNPM_HOME/bin/agentic-hq` (NOT a stale pnpm-10 shim directly under `$PNPM_HOME`). If it resolves to a stale shim, that is a finding — the human can delete just that shim file by hand (machine state, not a repo change).
3. From a fresh terminal, any directory: `agentic-hq list` → works.
4. `agentic-hq reversal -- --string-to-reverse="upgrade smoke test"` → reversed output `tset ekoms edargpu`, and **no "Update available!" nag** anywhere in the output.
STOP and WAIT for the human to confirm all pass. GREEN is not complete until they do.

### 3e. Wrap-up (command Steps 8–12 — re-read the command file for exact templates)
Once the human confirms all manual checks pass:
1. **Write the GREEN phase summary doc** at `docs/jira-docs/AHQ-136/workflow-files/manual-test-files/03-green-phase-summary-of-what-was-implemented.md` — use the template in command Step 8. **Crucially**, fill in the "Bugs found and fixed during GREEN" section: (i) `--ignore-workspace` incompatibility with pnpm 11 `allowBuilds`; (ii) the e2e-fixture 6th `ts-workflow` the AI summary missed; (iii) the `pnpm link --global` / `$PNPM_HOME/bin` PATH change.
2. **Add a Jira comment** to AHQ-136 — load `mcp__mcp-atlassian__jira_add_comment` via ToolSearch, use the Step 9 template.
3. **Present to human** (Step 10).
4. **Write `command-output.json`** (Step 11) to the command-input-output-files-directory above, content: `{"command-output-string": "GREEN phase complete for test-type manual"}`.
5. **Self-terminate** (Step 12): run the `/agentic-hq-core-plugin:self-termination` skill.

---

## 4. Change-set sanity check

`git status` will show ~17 modified + ~6 new `pnpm-workspace.yaml` + the `docs/jira-docs/AHQ-136/` tree. One pre-existing modified file is **NOT** part of AHQ-136 and must be left alone:
`.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/01-jira-read-and-question.md` (it was already modified before this Jira's work began).

Do not commit anything — the human runs `/commit` themselves.

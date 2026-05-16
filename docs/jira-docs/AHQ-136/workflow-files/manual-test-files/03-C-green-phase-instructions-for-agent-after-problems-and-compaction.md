# GREEN Phase Handoff (C) — AHQ-136 (pnpm 10 → 11), after scope change + compaction

**Written:** 2026-05-16 by the GREEN-phase agent, just before context compaction.
**For:** the next agent continuing the GREEN phase of AHQ-136.
**Relationship to earlier handoff:** `03-B-green-phase-instructions-for-agent-after-problems-and-compaction.md`
is HISTORY — read it for background, but **this 03-C doc is the current state** and supersedes
03-B's "what remains" section.
**Test type:** `manual`. **Jira:** https://agentic-hq.atlassian.net/browse/AHQ-136

You are part-way through executing
`/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation`
(jira-id = `AHQ-136`, test-type = `manual`). Read this whole doc first, then continue.

---

## 0. Orientation — read these first

- **Approved (revised) plan:** `docs/jira-docs/AHQ-136/workflow-files/manual-test-files/03-APPROVED-green-phase-implementation-plan-copy.md`
  — read it fully. It has a "Replan Note", a "Resolution Note", and a "Resolution Note 2".
- **Earlier handoff (history):** `03-B-green-phase-instructions-for-agent-after-problems-and-compaction.md`.
- **The command file** (for wrap-up Steps 7–12 of GREEN):
  `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/03-jira-minimal-implementation.md`
  — re-read its Steps 8–12 before the wrap-up; do not rely on this handoff alone for the
  doc / Jira-comment templates.
- **Research docs** (all in `docs/jira-docs/AHQ-136/workflow-files/additional-docs/`):
  - `perplexity-answer-about-onlyBuiltDependencies.md` — drove `onlyBuiltDependencies` → `allowBuilds`.
  - `perplexity-answer-about-ignore-workspace.md` — drove the `--ignore-workspace` removal.
  - `perplexity-answer-about-pnpm-link-global-migration.md` — drove the `pnpm link --global` / PATH work.
  - `perplexity-answer-about-global-package-manager-check-warning.md` — drove the `[WARN]` handling.
  - `gemini-second-opinion.md` — second opinion on cleaning up old pnpm-10 globals (we did NOT clean up).
  - `later-jira-description-for-switching-to-pnpm-add.md` — AHQ-144 draft (now done within AHQ-136).

**command-input-output-files-directory** (needed for wrap-up Steps 11–12):
`/Users/stevepersonal/dev/agentic-hq/agentic-hq/.agentic-hq/temp/command-input-output-files/io-files-2026-05-15_20-45-17_493e5d57-9e92-44be-8fe6-284336704bf2`

**Hard constraints (from CLAUDE.md — do NOT violate):**
- **NEVER** run `pnpm setup`, `corepack install -g`, `corepack enable`, or anything that
  mutates the user's shell config or global machine state. Those are **human** steps —
  give the human instructions and STOP.
- **NEVER** `git add` / `git commit` / `git push`. The human commits via their `/commit` command.
- `corepack use` aborts in non-interactive shells; use `CI=true pnpm install` if a modules
  purge needs confirming (a one-shot env var — modifies no file).

---

## 1. SCOPE CHANGE (2026-05-16) — read carefully

The human **changed the scope of AHQ-136**. New title:

> **Upgrade pnpm From 10 To 11 As Global Default, In Agentic HQ And Workflow Typescript Projects**

**Why.** Investigation found there is exactly **one** `pnpm` on the machine — the **corepack
shim** (`~/.nvm/.../bin/pnpm` → `corepack/dist/pnpm.js`). corepack resolves the pnpm version
**per-directory** from each project's `packageManager` field:

- Inside `agentic-hq/` (pins `pnpm@11.1.2`) → corepack runs **pnpm 11.1.2** ✅
- In an unpinned directory (e.g. `/tmp`) → corepack runs its **global default**, still
  **pnpm 10.33.0** ❌

Because pnpm 10 and 11 disagree about the global bin directory (`$PNPM_HOME` vs
`$PNPM_HOME/bin`), running `cd /tmp; pnpm list -g` invokes pnpm 10.33.0, which errors
(`global bin directory ... is not in PATH`) and does not list the globally-installed
`agentic-hq`.

**NEW REQUIREMENT added to AHQ-136:** pnpm 11 must also become the **corepack global
default**, so that from *any* directory `pnpm` is v11 and `cd /tmp; pnpm list -g` works and
lists `agentic-hq`.

This is a **global machine change** (it changes corepack's default) — the AI must NOT do it.
It is delivered as **human-run instructions** (section 4a) which the human runs and verifies.

**Actions for the next agent (do these before the wrap-up):**

a. **Update the AHQ-136 Jira** — title to the new title above, and add the new requirement
   to the description. Load `mcp__mcp-atlassian__jira_update_issue` via ToolSearch. If
   unsure about editing the description, confirm wording with the human first.
b. **Update the plan copy** (`03-APPROVED-...-plan-copy.md`): add a numbered requirement
   for "pnpm 11 as corepack global default; `cd /tmp; pnpm list -g` lists agentic-hq", and
   add a short **"Resolution Note 3"** summarising this scope change.
c. Optionally refresh `docs/jira-docs/AHQ-136/workflow-files/ai-summary-of-jiras-and-questions-for-human.md`
   to mention the new scope.

---

## 2. What is ALREADY DONE (do not redo)

`pnpm validate` (typecheck + eslint + prettier + 146 unit tests) **passed** after every batch
of changes below.

**Root project:**
- `package.json` — `packageManager` → `pnpm@11.1.2+sha512.…`; `engines.pnpm` → `>=11.0.0`;
  the 4 `demo:plugin-direct:*` scripts had `--ignore-workspace` dropped.
- `pnpm-workspace.yaml` — `onlyBuiltDependencies:` list → `allowBuilds:` map (`node-pty`,
  `esbuild`, `unrs-resolver`); doc-comment updated to pnpm 11; line-26 exclusion comment reworded.
- `pnpm-lock.yaml` — **unchanged** (pnpm 11 still uses lockfileVersion 9.0 — expected, not a miss).

**6 `ts-workflow` sub-projects migrated** (5 plugin + 1 e2e fixture):
1. `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/`
2. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/`
3. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/`
4. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/`
5. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/`
6. `tests/e2e/fixtures/string-reversal-copy-for-test/skills/string-reversal-copy-for-test/ts-workflow/`

For each: dead `"pnpm": { "onlyBuiltDependencies": [...] }` block removed from `package.json`;
new `pnpm-workspace.yaml` created (`packages: ['.']` + `allowBuilds: { agentic-hq, node-pty, esbuild }`).

**`--ignore-workspace` dropped everywhere** — root `package.json` 4 scripts, 6 `SKILL.md`
files, `create-workflow/03-run-checks-on-workflow.md`, root `pnpm-workspace.yaml` comment.

**`create-workflow/02-confirm-spec-approved-and-build.md`** updated (4 edits) so new
workflows are scaffolded with a `pnpm-workspace.yaml` and use plain `pnpm install`.

**`scripts/infra/install-dev-agentic-hq.sh`** — `pnpm link --global` → **`pnpm add -g .`**
(see Decision D1 below). Header comment block rewritten with pnpm 11 notes
(`$PNPM_HOME/bin`, `pnpm setup`, `pnpm --force setup` for `ERR_PNPM_BAD_SHELL_SECTION`).
The `echo` output now explains that the `[WARN] Using --global skips the package manager
check` line is expected and harmless.

**`README.md`** — `pnpm --version` comment `10.33.0` → `11.1.2`; a `[!NOTE]` callout added
to Quick Start step 3 (pnpm 11 stores globals in `$PNPM_HOME/bin`, run `pnpm setup` /
`pnpm --force setup`, old pnpm-10 globals can stay); the line describing the script updated
from `pnpm link --global` to `pnpm add -g .`.

**5 e2e test files** (`tests/e2e/demo/*.e2e.test.ts`) — each had a PATH fallback adding
`$PNPM_HOME` (pnpm 10 layout); fixed to `$PNPM_HOME/bin` (new `pnpmBinDir` const). Stale
`pnpm link --global` comments / `console.warn` strings / the `INSTALL_SCRIPT_TIMEOUT_MS`
comment updated to `pnpm add -g .`.

**Docs:** plan copy has "Resolution Note" + "Resolution Note 2"; `later-jira-description-for-switching-to-pnpm-add.md`
created (AHQ-144) then marked "completed within AHQ-136"; two new Perplexity docs created
(`pnpm-link-global-migration`, `global-package-manager-check-warning`); 03-B handoff updated.

---

## 3. Decisions already settled (do not reopen)

- **D1 — install script command.** `pnpm link --global` is **removed** in pnpm 11 (`pnpm link`
  now requires a `<dir>` arg; `[ERR_PNPM_LINK_BAD_PARAMS]`). Switched to **`pnpm add -g .`**,
  pnpm 11's documented replacement. **Verified** it produces a *live-source symlink*
  (`global/v11/<hash>/node_modules/agentic-hq` → the repo) — dev mode works. AHQ-144's work
  is therefore done within AHQ-136; AHQ-144 should be closed as done-by-AHQ-136.
- **D2 — README pnpm-11 note.** In scope; done.
- **Old pnpm-10 global binaries — NOT cleaned up.** Confirmed harmless: `pnpm --force setup`
  replaced the old `$PNPM_HOME` PATH entry with `$PNPM_HOME/bin`, so the old shims are
  orphaned-and-unreachable. (Perplexity and Gemini disagreed; reconciled in favour of "leave".)
- **The `[WARN] Using --global skips the package manager check`** is benign — it appears only
  because `pnpm add -g .` runs from the repo root (a project with a `packageManager` pin).
  Decision: keep `pnpm add -g .` from the repo root; the install script's output explains it.
- **`pnpm setup` already done.** The human ran `pnpm --force setup` (plain `pnpm setup` failed
  with `ERR_PNPM_BAD_SHELL_SECTION`). `~/.zshrc` now puts `$PNPM_HOME/bin` on PATH (a backup
  was taken first). The human also already ran `pnpm add -g .` manually once (the global
  `agentic-hq` is currently installed).

---

## 4. What REMAINS — human-run manual verification (GREEN Step 8)

This is the `manual` test. Two human-run parts. Present them, STOP, and WAIT for the human to
report results. GREEN is not complete until all checks pass.

### 4a. Make pnpm 11 the corepack global default (the NEW scope requirement)

Tell the human to run:

```bash
corepack install -g pnpm@11.1.2
```

(Installs pnpm 11.1.2 and sets it as corepack's **global default** for directories that have
no `packageManager` pin. `corepack install -g pnpm@latest` is also acceptable if they prefer
the newest 11.x. This changes corepack's global state — a human step, not an AI step.)

Then verify (no new terminal needed — the corepack shim reads the default dynamically):

```bash
cd /tmp
pnpm -version          # EXPECT: 11.x  (was 10.33.0)
pnpm list -g           # EXPECT: no error, and 'agentic-hq' is listed
cd ~/dev/agentic-hq/agentic-hq
pnpm -version          # EXPECT: still 11.1.2 (the project pin — unchanged)
```

The acceptance condition for the new scope: `cd /tmp; pnpm list -g` runs without the
`global bin directory ... is not in PATH` error and lists `agentic-hq`.

### 4b. Re-run the dev install script + smoke test

```bash
scripts/infra/install-dev-agentic-hq.sh
# EXPECT: completes cleanly. The "[WARN] Using --global skips the package manager
# check for this project" line WILL appear — it is expected and harmless; the
# script's own output explains why.

which agentic-hq
# EXPECT: /Users/<user>/Library/pnpm/bin/agentic-hq  (NOT a stale pnpm-10 shim
# directly under .../Library/pnpm/)

agentic-hq list
# EXPECT: works, lists workflows

agentic-hq reversal -- --string-to-reverse="upgrade smoke test"
# EXPECT: reversed output "tset ekoms edargpu", and NO "Update available!" nag anywhere
```

STOP and WAIT for the human to confirm 4a and 4b all pass. If anything fails, fix and ask
the human to re-test.

---

## 5. Wrap-up (command Steps 8–12) — only after ALL manual checks pass

Re-read the command file's Steps 8–12 for exact templates; do not rely on this handoff alone.

1. **Write the GREEN phase summary doc** at
   `docs/jira-docs/AHQ-136/workflow-files/manual-test-files/03-green-phase-summary-of-what-was-implemented.md`
   (template in command Step 8). Fill in the **"Bugs found and fixed during GREEN"** section —
   it must include:
   1. `--ignore-workspace` incompatible with pnpm 11 `allowBuilds`.
   2. A 6th `ts-workflow` (e2e fixture) the AI summary's "5 sub-projects" list missed.
   3. pnpm 11 moved the global bin dir to `$PNPM_HOME/bin` → `pnpm setup` required.
   4. `pnpm setup` needed `pnpm --force setup` (`ERR_PNPM_BAD_SHELL_SECTION`).
   5. `pnpm link --global` removed in pnpm 11 → switched to `pnpm add -g .`.
   6. 5 e2e tests' `$PNPM_HOME` PATH fallback was wrong under pnpm 11 → fixed to `$PNPM_HOME/bin`.
   7. corepack's global default was still pnpm 10.33.0 → scope expanded to make pnpm 11 the
      global default (corepack install -g).
2. **Add a Jira comment** to AHQ-136 — load `mcp__mcp-atlassian__jira_add_comment` via ToolSearch.
3. **Present to human** (command Step 10).
4. **Write `command-output.json`** to the command-input-output-files-directory (section 0),
   content: `{"command-output-string": "GREEN phase complete for test-type manual"}`.
5. **Self-terminate** — run the `/agentic-hq-core-plugin:self-termination` skill.

---

## 6. Change-set sanity check

`git status` will show the AHQ-136 changes plus the `docs/jira-docs/AHQ-136/` tree. One
pre-existing modified file is **NOT** part of AHQ-136 and must be left alone:
`.agentic-hq/plugins/agentic-hq-demos-plugin/commands/full-jira-tdd-story-workflow/01-jira-read-and-question.md`.

Do not commit anything — the human runs `/commit` themselves.

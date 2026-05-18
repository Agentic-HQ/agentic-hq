# GREEN Phase Plan: AHQ-145 (manual test) — Upgrade to Node 24 LTS

## Context

[AHQ-145](https://agentic-hq.atlassian.net/browse/AHQ-145) moves the project — and the maintainer's
machine — to **default to Node 24 LTS** while still *accepting* Node 22. The `node-pty`-on-Node-24
risk was already smoke-tested and verified (2026-05-16). Test type is **`manual`**: the RED phase
confirmed there are no automated tests; verification is the human running the AC checklist and a
manual upgrade script on Node 24.

This is a **config + documentation + research** Jira — no application logic. "Minimal" for this
GREEN phase means **producing exactly the AC deliverables, nothing more** (no Node 26, no
other-platform verification, no CI matrix, no `nvm uninstall 22` — the human keeps Node 22).

## Status: mandatory pre-implementation research is COMPLETE

The Jira (Section 4) mandates three research reports *before* any code is written. These are written
under `docs/jira-docs/AHQ-145/additional-reports/`:

1. `full-report-on-relevant-node-22-to-24-migration-documentation.md` — RTFM: 33 Node 23/24 breaking changes; **zero require a source-code change**.
2. `full-report-on-code-and-documentation-exploration-relevant-to-node-22-to-24-migration.md` — authoritative grep-derived file list. **Cross-referenced against Report 1 on 2026-05-17.**
3. `report-on-backup-and-rollback-plan-for-node-22-to-24-migration.md` — machine-state backup + rollback procedure.

Two **Perplexity Q&A** research artefacts were also produced and are written under
`additional-reports/` (the Perplexity MCP is unavailable; the maintainer ran them on perplexity.ai,
2026-05-17):
- `perplexity-qa-engines-node-range.md` — recommends `engines.node` = `"^22.0.0 || ^24.0.0"` (see **Decision D**).
- `perplexity-qa-pnpm-7366-spawn-helper.md` — verdict: the `postinstall` `chmod` hook is **still needed** on pnpm 11.1.2 (pnpm bug #7366 not confirmed fixed) — confirms Requirement 24.

The file list in Step 1 below is the authoritative change set from the updated Report 2.

---

## Jira Requirements (Numbered)

1. Root `package.json` `engines.node` `">=22.0.0 <23.0.0"` → **`"^22.0.0 || ^24.0.0"`** (researched deviation from the Jira's literal `">=22.0.0 <25.0.0"` — see **Decision D**); leave `engines.pnpm` untouched → **[Step 1]**
2. All **six** `ts-workflow/package.json` `engines.node` `">=22.0.0"` → **`"^22.0.0 || ^24.0.0"`** (5 plugin + 1 e2e fixture; count grep-confirmed) → **[Step 1]**
3. New `.nvmrc` at repo root containing `24` → **[Step 1]**
4. `README.md` line 23 reworded: Node 24 LTS recommended, Node 22 also supported → **[Step 1]**
5. `README.md` Node.js section: add `.nvmrc` note (`nvm use`) + caution to re-run `corepack enable` after switching Node versions → **[Step 1]**
6. `docs/dev/npm-commands.md`: note Node 24 LTS recommended / Node 22 supported → **[Step 1]**
7. Root `package.json` `@types/node` `"^25.0.9"` → `"^22"`, **with explanatory `"// ..."` pseudo-comment** → **[Step 1 + Decision A]**
8. `tsconfig.json` `compilerOptions.target` `"ES2022"` → `"ES2023"`, **with explanatory `//` comment** → **[Step 1]**
9. Three research reports by separate research agents → **DONE (see "Status" above)**
10. Manual line-by-line upgrade script: `#`-commented, backup section first, per-step verification with expected output, rollback section commented at end → **[Step 3]**
11. Upgrade script covers machine work: verify Node 24 present, `nvm alias default 24`, `corepack enable`, `corepack install -g pnpm@11.1.2` if needed, `pnpm` resolves inside+outside project → **[Step 3]**
12. Upgrade script ends with repo verification: `pnpm validate` + `agentic-hq reversal -- --string-to-reverse=hello`, plus dev/prod install-script smoke tests, all on Node 24 → **[Step 3]**
13. AHQ-136 retrospective's 7 lessons each addressed → **[AHQ-136 Lessons Mapping section below]**
14. AHQ-42 audit doc Finding 6 marked resolved; Findings 7 & 8 confirmed already resolved → **[Step 4]**
15. Machine-state ACs (Node 24 = nvm default, Corepack enabled, `pnpm` resolves, `pnpm validate` + `agentic-hq reversal` pass on Node 24, install scripts smoke-tested) → **[Step 5: human runs the script — option (a), agreed in the AI summary]**
16. Out of scope: narrowing `engines` to 24-only; `project-spikes/**` & `ARCHIVED/**`; Node 26; `nvm uninstall 22` (human keeps Node 22) → **N/A — nothing to implement**
17. Must NOT change: `docs/jira-docs/**` & `docs/mission-docs/**` *auto-generated* files, hand-edited lock files → **N/A — see Decision B (lockfile regeneration) and Step 4 (the AHQ-42 audit doc is an intended edit)**

### Scope items beyond the Jira's candidate list (from Report 2, confirmed with the human)

18. **All 7 `tsconfig.json`** files bumped `ES2022` → `ES2023` (root + 6 `ts-workflow`), not just root → **[Step 1]** *(human chose "All 7")*
19. The pre-existing redundant `.nvmrc` in `string-reversal/ts-workflow/` (`22`) is **deleted** — the new root `.nvmrc` supersedes it (nvm/fnm traverse up the directory tree). Result: no `ts-workflow` dir carries its own `.nvmrc` → **[Step 1]** *(human chose "Root only; delete the redundant one")*
20. `CONTRIBUTING.md` Node-version claim updated → **[Step 1]** *(human approved)*
21. `docs/user-docs/troubleshooting-quickstart.md` — quoted literal `engines` string + remediation text updated; **also add a macOS-version troubleshooting entry for the macOS 13.5+ prebuilt-Node floor** (users on macOS < 13.5 will hit install/runtime failures — give them the symptom + the floor) → **[Step 1]** *(human approved)*
22. `CLAUDE.md` — one-line "defaults to Node 24 LTS; supports Node 22 and 24 LTS" note added → **[Step 1]** *(human approved; Jira-optional, report 2 recommended)*
23. `README.md` `### Mac OS` section + `CONTRIBUTING.md` macOS line — augment with the **macOS 13.5+ prebuilt-Node floor** (surfaced by the Report 1 ↔ Report 2 cross-reference) → **[Step 1]**
25. `README.md:19` + `CONTRIBUTING.md:70` — update the "tested on macOS **15.5**" version to **15.7.5** (the maintainer's current macOS — confirmed 2026-05-17). Only these 2 occurrences exist (grep-verified) → **[Step 1]**
24. Root `package.json` `postinstall` `chmod` hook (lines 14–15) — **must be PRESERVED verbatim** (pnpm-bug workaround, not Node-related; **confirmed still needed by the pnpm #7366 Perplexity research** — pnpm bug not fixed in pnpm 11.x) → **[Step 1: explicit do-NOT-touch]**

---

## AHQ-136 Lessons Mapping (Requirement 13)

| # | AHQ-136 lesson | Addressed by |
|---|----------------|--------------|
| 1 | RTFM fully, up front | Research report 1 — done |
| 2 | Grep whole codebase for every changing string | Research report 2 — done; covered `.agentic-hq/plugins/**` + `tests/**` |
| 3 | Back up global/machine state before starting | Research report 3 + backup section of the upgrade script (Step 3) |
| 4 | Distinguish project pin vs machine default; Corepack-per-Node-install | Step 1 (engines/.nvmrc/docs) vs Step 3 (`corepack enable` / `corepack install -g`) |
| 5 | Verify install/dev-tooling path early | Step 3 — upgrade script smoke-tests dev + prod install scripts |
| 6 | Check removed/deprecated commands against new version | Research report 1 |
| 7 | Budget context deliberately | Front-loading the reports was the biggest token lever |

---

## Project Design Requirements Compliance

Design requirements file: `docs/dev/project-design-requirements.md` — governs **OO design**
(class/interface pairs per concept, "tell don't ask", Concept Table, Data Dictionary, English
Language Description).

**Not applicable to this Jira.** The work is JSON `engines`/`@types/node` edits, `.nvmrc` files,
`tsconfig.json` `target` edits, README/docs prose, research artefacts and one shell script. **No new
TypeScript classes or interfaces** — no code concepts to model.

| # | Design requirement | Status |
|---|--------------------|--------|
| D.1 | Class/interface pair per concept | N/A — no new code concepts |
| D.2 | Concept Table | Skipped — nothing to map (per the doc's "balance" caveat) |
| D.3 | Data Dictionary + English Language Description | Skipped — no classes/interfaces designed |
| D.4 | Tell-don't-ask / avoid cached state | N/A — no behaviour-bearing objects in scope |

---

## Decisions

**Decision A — `"// @types/node"` pseudo-comment placement.** Every existing `"// ..."` pseudo-comment
in `package.json` lives inside the `scripts` block, where arbitrary keys are harmless. A `"// ..."`
key placed *inside* `devDependencies` is unsafe — pnpm treats every `devDependencies` key as a
package to install. **Plan: add a top-level `"// @types/node"` key immediately *before* the
`"devDependencies"` block** (a sibling of `devDependencies`, ignored by pnpm).

**Decision B — lockfile regeneration.** Changing `@types/node` `^25.0.9` → `^22` makes `package.json`
and `pnpm-lock.yaml` inconsistent. Step 2 runs `pnpm install` once to regenerate the lockfile +
`node_modules`. This is a *regeneration side-effect of a legitimate dependency change*, not a
hand-edit. `pnpm-lock.yaml` will appear in the diff and that is correct. (The `engines.node` change
does **not** affect the lockfile.)

**Decision C — upgrade script location.**
`docs/jira-docs/AHQ-145/manual-node-22-to-24-machine-upgrade-script.sh` (AHQ-145 root — a top-level
deliverable, not a "report").

**Decision D — `engines.node` range = `"^22.0.0 || ^24.0.0"` (researched).** The Jira AC mandates
`">=22.0.0 <25.0.0"` verbatim (4 places). On the human's instruction to do "the right thing", a
Perplexity research question was raised. Perplexity's recommendation: **`"^22.0.0 || ^24.0.0"`** — a
disjoint range that precisely expresses "the two LTS lines, 22 and 24" and deliberately excludes
Node 23 (odd, Current-only, now EOL — the project does not test it). The contiguous
`">=22.0.0 <25.0.0"` would *overstate* support by silently admitting Node 23. **This is a
deliberate, human-approved deviation from the Jira AC's literal text.** It will be: (i) recorded in
the Perplexity Q&A doc written to `docs/jira-docs/AHQ-145/additional-reports/perplexity-qa-engines-node-range.md`
(question + full answer + decision); (ii) called out in the Jira comment and the GREEN phase
summary so the AC checklist's literal mismatch is explained; (iii) left for the human to optionally
update the Jira AC text to match.

---

## Implementation Steps

### Step 0 — Copy this approved plan (FIRST, before any other work)
Copy this approved plan to
`docs/jira-docs/AHQ-145/workflow-files/manual-test-files/03-APPROVED-green-phase-implementation-plan-copy.md`.

### Step 1 — Repo edits

(The two Perplexity Q&A docs are **already written** under `additional-reports/` — see the Status
section. No action needed for them here.)

**`package.json` (root):**
- `engines.node` → `"^22.0.0 || ^24.0.0"` (Decision D); leave `engines.pnpm` as-is.
- `@types/node` → `"^22"`; add a top-level `"// @types/node"` pseudo-comment per **Decision A**.
- **Do NOT touch** the `"// POSTINSTALL"` / `postinstall` lines (14–15) — Requirement 24.

**Six `ts-workflow/package.json` — `engines.node` `">=22.0.0"` → `"^22.0.0 || ^24.0.0"`:**
1. `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/package.json`
2. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/package.json`
3. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/package.json`
4. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/package.json`
5. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/package.json`
6. `tests/e2e/fixtures/string-reversal-copy-for-test/skills/string-reversal-copy-for-test/ts-workflow/package.json`

**Seven `tsconfig.json` — `target` `"ES2022"` → `"ES2023"`** (root + the 6 `ts-workflow/tsconfig.json`
matching the dirs above). Add the explanatory `//` JSONC comment above the `target` line — to the
root (Jira-mandated) and to all 6 `ts-workflow` ones too, for consistency.

**`.nvmrc`:**
- **Create** `.nvmrc` at repo root containing `24`.
- **Delete** `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/.nvmrc`
  (currently `22`) — redundant once the root `.nvmrc` exists, since nvm/fnm walk up the tree. First
  grep for any references to it (none expected — `.nvmrc` is a plain version file). Result: no
  `ts-workflow` dir carries its own `.nvmrc` (Requirement 19).

**Docs:**
- `README.md` — Node.js section: reword line 23 (Node 24 LTS recommended / Node 22 supported); add
  a `.nvmrc` note (`nvm use`) + the re-run-`corepack enable`-after-switching-Node caution.
  `### Mac OS` section (L19): update "tested on MacOS **15.5**" → **15.7.5**, and augment with the
  macOS 13.5+ prebuilt-Node floor.
- `CONTRIBUTING.md` — update the `Node.js v22.x (LTS)` claim → Node 24 default / Node 22 and 24 LTS supported;
  update the macOS line (L70) "**15.5**" → "**15.7.5**" and augment it with the 13.5+ floor.
- `docs/dev/npm-commands.md` — add a short Node version note (Node 24 LTS recommended / 22 supported).
- `docs/user-docs/troubleshooting-quickstart.md` — update the quoted `engines` string
  `>=22.0.0 <23.0.0` → `^22.0.0 || ^24.0.0` and the Node 22-only remediation text → Node 22 and 24.
  **Also add a new troubleshooting entry for the macOS 13.5+ floor**: a user on macOS earlier
  than 13.5 will hit `node-pty`/prebuilt-binary install or runtime failures — describe the
  symptom and state that macOS 13.5+ is required, so they aren't left guessing.
- `CLAUDE.md` — add one line: defaults to Node 24 LTS; supports Node 22 and 24 LTS (not Node 23).

### Step 2 — Sync lockfile and sanity-check on Node 22
- Run `pnpm install` once (root) to regenerate `pnpm-lock.yaml` + `node_modules` after the
  `@types/node` change (**Decision B**).
- Run `pnpm typecheck` and `pnpm test` on the current Node 22 session to confirm the `@types/node`
  downgrade and the `ES2023` target bump do not break the build. (Local due-diligence; authoritative
  Node-24 verification is the human's job in Step 5.)

### Step 3 — Create the manual upgrade script (Requirements 10–12)
Create `docs/jira-docs/AHQ-145/manual-node-22-to-24-machine-upgrade-script.sh`, driven by research
report 3:
- **Backup section first**: timestamped `$BACKUP_DIR`; `~/.zshrc` copy; record `nvm ls`, default
  alias, `which node`, `$PATH`, global package list, Corepack default, `pnpm --version` in/out of
  the project.
- Each command on its own line, `#`-commented; after every state-changing command a verification
  command with its **expected output** in a comment.
- Machine steps: verify Node 24 already installed (do **not** re-install), `nvm alias default 24`,
  `corepack enable`, `corepack install -g pnpm@11.1.2` if needed, verify `pnpm` resolves inside +
  outside the project.
- Repo verification: `pnpm validate`, `agentic-hq reversal -- --string-to-reverse=hello`, and
  smoke-test `scripts/infra/install-dev-agentic-hq.sh` + `install-prod-agentic-hq.sh` — all on Node 24.
- **Rollback section** at the end, commented out, ready to use (reverse order).
- **No `nvm uninstall 22`** — a one-line comment notes Node 22 is kept intentionally.

**Then: stay engaged while the human runs it.** After creating the script, hand it to the human
and do **not** treat Step 3 as finished. Wait for the human to run it line-by-line, get their
feedback on progress, actively help debug any failure they hit (script bug, unexpected output,
machine-state surprise), fix the script if needed, and only consider this step complete once the
**human explicitly confirms the upgrade ran successfully end-to-end**. This is an iterative
back-and-forth, not a fire-and-forget handover.

### Step 4 — Update the AHQ-42 audit doc (Requirement 14)
In `docs/jira-docs/AHQ-42/documentation-thorough-audit-doc.md`:
- Finding 6 (`:97`): update **Status** to mark it **resolved** under AHQ-145.
- Findings 7 & 8 (`:105`, `:114`): add a one-line confirmation they were verified already resolved
  in the current README (no work needed).
(An intended edit the Jira explicitly asks for — the "must not change" rule targets *auto-generated*
workflow files, not an audit doc.)

### Step 5 — Re-read the command file, then hand over for manual verification
**TODO: after Step 4, re-read the command file
`agentic-hq-demos-plugin:full-jira-tdd-story-workflow/03-jira-minimal-implementation` for the exact
testing/documenting instructions (its Steps 7–12) — do not rely on memory.**

Because test type is `manual`: the upgrade script's run is the manual acceptance test, and it was
already driven to a **human-confirmed successful end-to-end run** as the closing part of Step 3
(the iterative wait/feedback/help loop). Step 5 does not re-run anything — it confirms that the
human's Step 3 sign-off covers every machine-state AC (Node 24 = nvm default, Corepack enabled,
`pnpm` resolves in + out of the project, `pnpm validate` on Node 24, `agentic-hq reversal` on
Node 24, dev/prod install-script smoke tests). If any AC was not exercised, ask the human to
verify it before proceeding. Only once all ACs are human-confirmed is the GREEN phase document
written (recording the **Decision D deviation**), the Jira comment added (also noting the
deviation), and the program self-terminated.

---

## Verification

- **Local (Node 22, this session):** `pnpm typecheck` + `pnpm test` pass after the repo edits
  (Step 2) — confirms no build breakage from the `@types/node` / `tsconfig.json` changes.
- **Manual (Node 24, human):** the human runs the upgrade script and confirms each AC — the real
  acceptance test for this `manual`-type Jira.
- The three research reports, the Perplexity Q&A doc, and the upgrade script exist on disk as
  required deliverables.

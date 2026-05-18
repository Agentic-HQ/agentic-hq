# AHQ-145 — Authoritative Grep-Derived File List for the Node 22→24 Migration

## Purpose / Provenance

This is **Research Report 2 of 3** for Jira **AHQ-145** ("Upgrade Agentic HQ to default to Node 24 LTS, supporting Node 22-24"), produced as a mandatory deliverable per AHQ-145 Section 4. It was written by a **separate research agent with fresh context**, deliberately isolated from the implementation plan. The AHQ-136 retrospective recorded a previous upgrade that **missed a file because the plan trusted a prose count instead of `grep`**. To prevent a repeat, **every file in this report was derived from an actual `grep`/`find`/`git ls-files` sweep of the working tree** (`/Users/stevepersonal/dev/agentic-hq/agentic-hq`) on 2026-05-16, not from prose. The candidate list in AHQ-145 Section 7 was treated as unverified input and was independently confirmed and expanded below.

> **Cross-reference revision — 2026-05-17.** The three AHQ-145 research reports were originally produced by three agents running **fully in parallel with isolated context**. That was a process mistake: this report (Report 2 — the authoritative grep-derived "files to change" list) did **not** receive **Report 1** (`additional-reports/full-report-on-relevant-node-22-to-24-migration-documentation.md` — the Node 22→24 breaking-changes RTFM report) as input, even though Report 2's file list should have been informed by Report 1's findings. On **2026-05-17** this report was cross-referenced against Report 1 in full and augmented. The new material is consolidated in **Section 6 ("Cross-Reference With Report 1")** and folded into Sections 1, 3 and 5 so the change set stays internally consistent. Report 1's net conclusion — **zero source-code files need changing** — is consistent with this report's grep sweep, and the cross-reference adds **one new documentation item** (the macOS 13.5+ prebuilt-binary floor) plus several explicit "confirmed / do NOT change" annotations.

### Sweep scope

- **Search terms:** `engines`, `node`, `Node`, `v22`, `v24`, `22.0.0`, `24.0.0`, `.nvmrc`, `@types/node`, `ES2022`, `node-version`, `nodejs`.
- **Included:** the whole repo, explicitly including `.agentic-hq/plugins/**` and `tests/**`.
- **Excluded (out of scope, legacy/artifact):** `docs/project-docs/project-spikes/**`, `docs/ARCHIVED/**`, `docs/jira-docs/**`, `docs/mission-docs/**`, `node_modules/**`, `.git/**`, lock files (`pnpm-lock.yaml`), `temp/**`, and `.agentic-hq/temp/**`.

---

## 1. Authoritative list of files to CHANGE

Every file below is **git-tracked** and **in scope**. Paths are relative to the repo root.

### 1a. `package.json` — `engines.node` version constraints (7 files)

The Jira candidate list said "root + six `ts-workflow/package.json`". Grep **confirms exactly 7 tracked `package.json` files carry an `engines.node` field** — 1 root, 5 under `.agentic-hq/plugins/**`, 1 test fixture under `tests/**`. (The candidate list's "six `ts-workflow`" count is numerically correct for the non-root files, but note 1 of those 6 is a **test fixture**, not a plugin skill — see the table.)

| # | File | Current `engines.node` | Change to | Why |
|---|------|------------------------|-----------|-----|
| 1 | `package.json` (root) | `">=22.0.0 <23.0.0"` | `">=22.0.0 <25.0.0"` | Root project engine constraint. Widen the upper bound so Node 24 is allowed while keeping the floor at Node 22. |
| 2 | `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/package.json` | `">=22.0.0"` | `">=22.0.0 <25.0.0"` | Plugin skill `ts-workflow`. Tighten to an explicit `22–24` window for consistency with root. **Also the scaffold template** that `create-workflow` copies for new workflows — fixing it propagates the correct range to every future generated workflow. |
| 3 | `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/package.json` | `">=22.0.0"` | `">=22.0.0 <25.0.0"` | Demo plugin skill `ts-workflow`. |
| 4 | `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/package.json` | `">=22.0.0"` | `">=22.0.0 <25.0.0"` | Demo plugin skill `ts-workflow`. |
| 5 | `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/package.json` | `">=22.0.0"` | `">=22.0.0 <25.0.0"` | Demo plugin skill `ts-workflow`. |
| 6 | `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/package.json` | `">=22.0.0"` | `">=22.0.0 <25.0.0"` | Demo plugin skill `ts-workflow`. |
| 7 | `tests/e2e/fixtures/string-reversal-copy-for-test/skills/string-reversal-copy-for-test/ts-workflow/package.json` | `">=22.0.0"` | `">=22.0.0 <25.0.0"` | **E2E test fixture** `ts-workflow` (NOT a plugin skill). The Jira's "six `ts-workflow/package.json`" count includes this fixture. It must change too so the fixture matches real-world plugin output the tests exercise. |

> **Decision point for the planner:** files 2–7 currently use an open-ended `">=22.0.0"` (no upper bound). The table proposes tightening them to `">=22.0.0 <25.0.0"` to match the root and the Jira's stated intent ("supporting Node 22-24"). If the planner instead wants them left open-ended, that is a conscious choice — but it would diverge from the root constraint. Recommend tightening all 7 to the same string.

### 1b. `package.json` — `devDependencies."@types/node"` (1 file)

Grep across `git ls-files` confirms **`@types/node` appears in exactly one tracked, in-scope `package.json`**: the root. The 6 `ts-workflow` package.json files do **not** declare `@types/node` (they get Node types transitively / via `tsconfig` `"types": ["node"]`).

| File | Current | Change to | Why |
|------|---------|-----------|-----|
| `package.json` (root), `devDependencies` | `"@types/node": "^25.0.9"` | `"@types/node": "^22"` | Per AHQ-145 Section 7. `@types/node` major should track the **minimum supported runtime** (Node 22), not the latest. `^25` is ahead of the supported range and can surface APIs not present on Node 22. `^22` keeps type-checking honest to the floor while still being forward-compatible within the 22–24 window. |

### 1c. `tsconfig.json` — `compilerOptions.target` (7 files)

The Jira candidate list mentions **only the root `tsconfig.json`**. Grep found **7 tracked, in-scope `tsconfig.json` files all using `"target": "ES2022"`** — the same 1 root + 5 plugin + 1 fixture set as the package.json files. **This is a candidate-list gap (see Section 3).**

| # | File | Current | Change to | Why |
|---|------|---------|-----------|-----|
| 1 | `tsconfig.json` (root) | `"target": "ES2022"` | `"target": "ES2023"` | Node 24 (and Node 22) fully support the ES2023 language/library features (e.g. `Array.prototype.findLast`, `toSorted`, `Array.fromAsync`). Raising the target lets the codebase use them without downlevelling. |
| 2 | `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/tsconfig.json` | `"target": "ES2022"` | `"target": "ES2023"` | Keep plugin `ts-workflow` build target aligned with root. Also the scaffold template for new workflows. |
| 3 | `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/tsconfig.json` | `"target": "ES2022"` | `"target": "ES2023"` | Align demo plugin skill build target. |
| 4 | `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/tsconfig.json` | `"target": "ES2022"` | `"target": "ES2023"` | Align demo plugin skill build target. |
| 5 | `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/tsconfig.json` | `"target": "ES2022"` | `"target": "ES2023"` | Align demo plugin skill build target. |
| 6 | `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/tsconfig.json` | `"target": "ES2022"` | `"target": "ES2023"` | Align demo plugin skill build target. |
| 7 | `tests/e2e/fixtures/string-reversal-copy-for-test/skills/string-reversal-copy-for-test/ts-workflow/tsconfig.json` | `"target": "ES2022"` | `"target": "ES2023"` | E2E test fixture — keep it identical to real plugin output the tests verify. |

> **Decision point for the planner:** changing only the root `tsconfig.json` (as the candidate list implies) would leave the 6 `ts-workflow` builds on `ES2022`, creating an inconsistency. Recommend updating **all 7** together. If the planner wants to limit blast radius to the root only, that should be a recorded conscious choice — but it is divergent.

### 1d. `.nvmrc` — new file at repo root (1 NEW file) + 1 EXISTING file

| File | State | Action | Why |
|------|-------|--------|-----|
| `.nvmrc` (repo root) | **Does NOT exist** — confirmed by `ls` and `find`. | **CREATE** containing `24` (or `lts/jod` is the v22 alias — for Node 24 the alias is `lts/krypton`; prefer the bare major `24`). | AHQ-145 wants Node 24 to be the **default**. A root `.nvmrc` gives nvm/fnm/asdf users one-command-to-correct-Node. Pin to `24` because the Jira's stated default is Node 24 LTS. (Note: prior spike docs AHQ-42/AHQ-56 recommended pinning to `22`; that predates the "default to 24" decision in AHQ-145 — follow AHQ-145.) |
| `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/.nvmrc` | **EXISTS**, git-tracked, contains `22`. | **UPDATE** to `24` (or leave at `22` — see note). | A pre-existing `.nvmrc` the candidate list did not mention (**candidate-list gap**). It currently pins the string-reversal demo workflow to Node `22`. For consistency with a Node-24 default it should become `24`. At minimum it must be a **conscious decision** — leaving one workflow pinned to `22` while the project defaults to `24` is the exact "missed file" failure mode AHQ-136 warned about. |

> Note: only **one** `ts-workflow` currently has a `.nvmrc` (string-reversal). The other 5 do not. The planner should decide whether to (a) add `.nvmrc` to all `ts-workflow` dirs for consistency, (b) update just the one that exists, or (c) standardise on a single root `.nvmrc` only. Recommend at least the root `.nvmrc` plus updating the existing one to match.

### 1e. Documentation files (prose mentioning a Node version)

| File | Current text (line) | Change to | Why |
|------|---------------------|-----------|-----|
| `README.md` | L23 `Requires Node.js v22.x (LTS) or higher.` — also L25 (nvm install instructions), L35 (`pnpm ... included in Node.js 22 or higher`). **Also L17–L19 `### Mac OS` section** — see the dedicated row below. | State Node 24 LTS as the default/recommended version and Node 22–24 as supported. Keep nvm guidance; mention the new root `.nvmrc`. | README is the canonical install doc. Must reflect the new default. |
| `README.md` — `### Mac OS` section (L17–L19) | L19: `These instructions have **only** been created for and tested on MacOS 15.5.  Other operating systems haven't yet been tested...` — states the **tested** macOS version, but **no minimum/floor**. | **AUGMENT** (do not replace the "tested on 15.5" statement — keep it). Add a sentence noting that **Node 23/24 official prebuilt binaries require macOS 13.5 or newer** — anyone on macOS older than 13.5 cannot use prebuilt Node and would have to build Node from source. e.g.: *"Node 24's official prebuilt binaries require macOS 13.5 or newer; on older macOS you would need to build Node from source."* | **NEW — added by the Report 1 cross-reference (2026-05-17).** Report 1 item #2 records that Node 23 raised the prebuilt-binary macOS floor from 11 to **13.5** (still 13.5 in Node 24). Report 1's Section 8 explicitly recommends stating this in README/CONTRIBUTING. The current Mac OS section states only the *tested* version (15.5) — it never states a *supported floor*, so a contributor on macOS 12, say, gets no warning. This is a documentation-completeness gap surfaced only by reading Report 1. See Section 6. |
| `docs/dev/npm-commands.md` | No Node-version sentence currently (grep found only `pnpm`/`corepack` mentions). | **ADD** a short Node version note (defaults to Node 24 LTS, supports 22–24; `nvm use` reads root `.nvmrc`). | AHQ-145 Section 7 explicitly asks for a Node version note here. This is an addition, not an edit. |
| `CONTRIBUTING.md` | L70 `**macOS 15.5** (other platforms are untested...)`; L71 `**Node.js v22.x (LTS)** or higher — install via [nvm]...`; L72 `corepack ships with Node 22`. | Update L71–L72 to Node 24 LTS default, Node 22–24 supported. **Also augment L70** to mention the macOS 13.5+ prebuilt-Node floor (consistent with the README change above) — keep the "tested on macOS 15.5" fact. | **CANDIDATE-LIST GAP.** Contributor setup doc states the Node requirement; must stay in sync with README. The macOS-floor augmentation to L70 is **added by the Report 1 cross-reference (2026-05-17)** — see Section 6. |
| `docs/user-docs/troubleshooting-quickstart.md` | L15 `pnpm ships with Node.js 22+`; L25–28 `engines constraint (>=22.0.0 <23.0.0)` and `Install Node v22 LTS ... switch to the v22 line`. | Update the quoted `engines` constraint to `>=22.0.0 <25.0.0` and the remediation text to reference Node 22–24 (default 24). | **CANDIDATE-LIST GAP.** This doc **quotes the exact `engines` string** — if root `package.json` changes and this is not updated, the troubleshooting advice becomes wrong. This is precisely the kind of file AHQ-136 missed. |

---

## 2. `CLAUDE.md` — the optional one-line edit

**Verified:** `grep -ni 'node\b' CLAUDE.md` returned **zero matches**. `CLAUDE.md` currently contains **no Node-version sentence** — the Jira's assumption is correct.

**Recommendation: the optional one-line edit IS worthwhile.** `CLAUDE.md` is loaded into every Claude Code session for this project. A single line ("Agentic HQ defaults to Node 24 LTS; supports Node 22–24") gives the AI an authoritative, always-in-context fact, preventing it from guessing or suggesting an outdated version during future work. It is one line, costs negligible context budget, and aligns with the project's own "Project CLAUDE.md must stand alone" rule. Place it in the existing "Development And Testing Rules" section or near the top "Project Overview".

---

## 3. Files the CANDIDATE LIST (AHQ-145 Section 7) MISSED

The candidate list, verified by grep, is **incomplete**. Gaps found:

| Missed item | Why it matters |
|-------------|----------------|
| **6 of 7 `tsconfig.json` files** — candidate list named only root `tsconfig.json`; grep found the 5 plugin `ts-workflow` tsconfigs + 1 fixture tsconfig also on `"target": "ES2022"`. | Changing only the root leaves the `ts-workflow` builds on a lower target — an inconsistency, and a partial migration. |
| `CONTRIBUTING.md` (L71–72) | States `Node.js v22.x (LTS) or higher` — a Node version requirement not in the candidate list. |
| `docs/user-docs/troubleshooting-quickstart.md` (L15, L25–28) | **Quotes the exact `engines` string `>=22.0.0 <23.0.0`.** Will become factually wrong if not updated alongside root `package.json`. Highest-risk miss. |
| `docs/user-docs/workflow-descriptions/overview-of-workflows.md` (L19) | Mentions "Node.js" as a prerequisite but **only as a link to the README** — no version number. **No change needed**, but listed here so the planner knows it was checked. |
| Existing `.agentic-hq/.../string-reversal/ts-workflow/.nvmrc` (contains `22`) | A pre-existing `.nvmrc` the candidate list did not know about (it only said "create new `.nvmrc` at root"). Needs a conscious decision (see 1d). |
| `scripts/infra/install-dev-agentic-hq.sh` (L62) | Contains the prose `corepack ships with Node.js 22+`. Factually still true for Node 22+, so **not strictly a required change**, but the planner may want to update it to "Node 22+" generic wording or "Node 24" for consistency. Low priority — listed for completeness. |

### Things explicitly checked and confirmed NOT to need changing
- **No GitHub Actions / CI workflows.** `.github/` contains only `ISSUE_TEMPLATE/` and `pull_request_template.md` — **no `workflows/` directory at all**, so there is no `node-version:` CI matrix to update. (The AHQ-136 retrospective's mention of "CI workflow `node-version`" does not apply to this repo today.) **(Confirmed independently by Report 1 Section 8 — "there is currently no `node-version` reference under `.github/` and no `.nvmrc`".)**
- **No source-code (`.ts`) file needs changing for removed/deprecated Node APIs.** Report 1 performed a `grep` sweep of `src/` for every removed/deprecated Node 23/24 API — `shell: true` on `child_process`, `dirent.path`, legacy `url.parse`, the `fs.F_OK`/`R_OK`/`W_OK`/`X_OK` constant getters, `fs.truncate(fd)`, `process.assert`, `async_hooks`/`AsyncLocalStorage`, `node:test`, and TLS server code (`tls.createSecurePair`/`tls.Server`) — and found **none of them in use**. Across Report 1's 33 enumerated breaking changes, **not one requires a `.ts` source edit**. This report's own sweep (Section 1) likewise turned up only `package.json`/`tsconfig.json`/docs/`.nvmrc`, never a source file — the two reports agree. **No `src/**/*.ts` file is in the AHQ-145 change set.** See Section 6.
- **`node-pty` native addon — no change, ABI bump does not bite.** Report 1 Section 5 verifies `node-pty@1.1.0` is a **Node-API (`node-addon-api`) addon** shipping prebuilt `darwin-x64`/`darwin-arm64` binaries, so the Node 24 `NODE_MODULE_VERSION` ABI bump (127→137) does not invalidate it; a 2026-05-16 darwin-x64 smoke test installed it from a prebuilt binary with no `node-gyp` compile and passed 146/146 unit tests. No `node-pty`-related file changes for AHQ-145. See Section 6.
- **The root `package.json` `postinstall` `chmod` hook must be PRESERVED unchanged.** Root `package.json` L14–L15 hold a `// POSTINSTALL` documentation key and the `postinstall` script `chmod +x node_modules/node-pty/prebuilds/darwin-*/spawn-helper 2>/dev/null || true`. Report 1 (Section 5.4, Section 8) states this is a workaround for a **pnpm extraction bug** (pnpm issue #7366 — pnpm extracts the prebuilt `spawn-helper` binary without the execute bit), **not** a Node-version concern, and **must be kept verbatim** through the Node 24 upgrade. It is therefore an explicit **"do NOT change"** item — even though `package.json` *is* an edited file (its `engines.node` and `@types/node` lines change), the `postinstall` lines L14–L15 must be left exactly as they are. See Section 6.
- **No `Dockerfile`** anywhere in scope.
- **No `.tool-versions`** file (asdf) — confirmed by `find`.
- **`.gitignore`** mentions `nodejs.org` URLs only (comments) — not version-relevant.
- **`scripts/infra/install-prod-agentic-hq.sh`** and `scripts/mcp-scripts/*` — no Node-version strings.
- The 6 `ts-workflow/package.json` files do **not** declare `@types/node` — only the root does.

---

## 4. Files that MATCHED the grep but are OUT OF SCOPE (considered and deliberately excluded)

Listed so the reader knows they were seen and intentionally skipped per the AHQ-145 scope rules.

| Location | Matches | Why excluded |
|----------|---------|--------------|
| `docs/ARCHIVED/mission-docs/**/project-output/package.json` (15 files) | `engines`, `node` | Archived legacy mission output — out of scope per AHQ-145. |
| `docs/project-docs/project-spikes/spike-00-*/**/package.json` (~24 files) and `.../tsconfig.json` (1 file) | `engines`, `node`, `ES2022` | Legacy spike project tree — explicitly out of scope. |
| `docs/project-docs/project-spikes/spike-01-slack/v01-project/package.json` + `tsconfig.json` | `engines`, `node` | Legacy spike — out of scope. |
| `docs/jira-docs/AHQ-42/`, `AHQ-56/`, `AHQ-59/`, `AHQ-136/` (various `.md`) | `.nvmrc`, `engines`, `22.0.0`, Node version prose | Historical Jira docs — informational only, not live config. (AHQ-42/56/59 recommended pinning `.nvmrc` to `22`; superseded by AHQ-145's "default to 24" decision.) |
| `docs/mission-docs/**` | `engines`, `node` | Mission run artifacts — out of scope. |
| `temp/test-files/test-project-roots/demo-quick-jira-workflow/project-root_*/` (10× `package.json`, 9× `tsconfig.json`) | `engines`, `node`, `ES2022` | Generated test-run artifacts under `temp/` — ephemeral, not tracked source. |
| `.agentic-hq/temp/git-diffs/*.txt` | `@types/node`, `engines` | Captured historical git-diff text artifacts — not live files. |
| `pnpm-lock.yaml` (root + per-`ts-workflow`) | `@types/node`, `node` | Lock files — regenerated by `pnpm install`, never hand-edited. |
| `node_modules/**` | everything | Dependencies — never edited. |
| **Noise — "node" as a common word (signal separated out):** `tests/integration/process-control/fixtures/fake-claude-cli.triggers-kill-script.fixture.ts` ("Node.js event loop" in comments), `.agentic-hq/.../02-jira-write-failing-test.md` ("Install `@types/node` if using Node.js APIs" — instructional prose, not a dependency decl), `.claude/commands/.../plan-and-build-throwaway-prototype.md` ("Node.js script"). | `node`, `Node` | These mention "Node" descriptively, not as a version constraint. **No change needed.** |

---

## 5. Summary — authoritative change set

**Code / config (16 file edits + 1 new file):**
1. Root `package.json` — `engines.node` `>=22.0.0 <23.0.0` → `>=22.0.0 <25.0.0`; `@types/node` `^25.0.9` → `^22`.
2–6. Five plugin `ts-workflow/package.json` — `engines.node` `>=22.0.0` → `>=22.0.0 <25.0.0`.
7. One test-fixture `ts-workflow/package.json` — same engines change.
8. Root `tsconfig.json` — `target` `ES2022` → `ES2023`.
9–14. Five plugin + one fixture `ts-workflow/tsconfig.json` — same target change.
15. **NEW** root `.nvmrc` containing `24`.
16. Existing `string-reversal/ts-workflow/.nvmrc` — `22` → `24` (decision required).

**Documentation (4 files):** `README.md`, `docs/dev/npm-commands.md` (add note), `CONTRIBUTING.md`, `docs/user-docs/troubleshooting-quickstart.md`. Two of these — `README.md` (its `### Mac OS` section, L17–L19) and `CONTRIBUTING.md` (L70) — carry an **additional augmentation surfaced only by the 2026-05-17 Report 1 cross-reference**: a sentence documenting the **macOS 13.5+ minimum for Node 23/24 prebuilt binaries**. No new *file* is added to the documentation set by the cross-reference — the new content lands inside two files already in the set — but the README and CONTRIBUTING edits now have two distinct parts each (the Node-version update **and** the macOS-floor augmentation). See Section 6.

**Optional (1 file):** `CLAUDE.md` — recommended one-line Node-version sentence.

**No source-code (`.ts`) files in the change set** — confirmed by Report 1's `grep` sweep of `src/` for every removed/deprecated Node 23/24 API (zero matches) and by this report's own sweep. AHQ-145 is a config + docs + `.nvmrc` change, not a code change. See Section 6.

**Root `package.json` `postinstall` `chmod` hook (L14–L15) — do NOT change.** It is a pnpm-extraction-bug workaround (pnpm #7366), unrelated to the Node version; it must survive the upgrade verbatim even though other lines of `package.json` are edited. See Section 6.

**Confirmed `ts-workflow/package.json` count:** the Jira's "six" is correct as a raw file count, but **the 7th `engines.node`-bearing `package.json` is the root** — total 7 `package.json` files carry `engines.node`. Of the 6 non-root ones, **5 are plugin skills and 1 is an E2E test fixture** (the candidate list called all six "ts-workflow" without flagging the fixture).

**Biggest candidate-list gaps:** (a) 6 extra `tsconfig.json` files on `ES2022`; (b) `docs/user-docs/troubleshooting-quickstart.md` which **quotes the literal `engines` string**; (c) `CONTRIBUTING.md`; (d) a pre-existing `.nvmrc` (`=22`) the candidate list was unaware of; (e) — added by the Report 1 cross-reference — the **macOS 13.5+ prebuilt-Node floor** missing from the `README.md` Mac OS section and `CONTRIBUTING.md` L70.

**No CI/Docker/`.tool-versions`** to change — confirmed absent (CI absence independently confirmed by Report 1).

---

## 6. Cross-Reference With Report 1 (Node breaking-changes RTFM)

This section was added on **2026-05-17** to repair a process gap: the three AHQ-145 research reports were produced by three agents running **fully in parallel with isolated context**, so this report (Report 2 — the authoritative grep-derived file list) never received **Report 1** (`additional-reports/full-report-on-relevant-node-22-to-24-migration-documentation.md`) as input. Report 1 RTFM'd the official Node v22→v24 migration guide and the Node 23/24 changelogs and enumerated **33 breaking changes and deprecations**. This section cross-references every Report 1 conclusion against Report 2's file list and records what it adds, annotates, or confirms.

### 6.1 What Report 1 ADDS to the change set

| Report 1 finding | Effect on Report 2 | Where folded in |
|---|---|---|
| **macOS 13.5+ prebuilt-binary floor** (Report 1 item #2). Node 23 raised the official prebuilt-Node minimum macOS version from 11 to **13.5**; Node 24 keeps it at 13.5. Report 1 Section 8 explicitly recommends documenting this in README/CONTRIBUTING. | **Adds one documentation item** — verified by grep against the repo: `README.md` L17–L19 has a `### Mac OS` section whose only macOS statement is *"These instructions have **only** been created for and tested on MacOS 15.5."* (the **tested** version), and `CONTRIBUTING.md` L70 is a bullet *"**macOS 15.5** (other platforms are untested...)"*. **Neither states a minimum / supported floor.** A contributor on, say, macOS 12 gets no warning that official prebuilt Node 24 will not install for them. Both should be **augmented** (not have their "tested on 15.5" fact replaced) with a sentence: *"Node 24's official prebuilt binaries require macOS 13.5 or newer; on older macOS you would need to build Node from source."* | Section 1e — `README.md` `### Mac OS` row (new) and `CONTRIBUTING.md` row (augmented); Section 3 gap list item (e); Section 5 summary. No new *file* — both targets were already in the documentation set; each now has a second, distinct edit. |

That is the **only** net addition. Report 1's exhaustive 33-item enumeration produces **no other new file** for Report 2's list — every other item is either "no impact" or it confirms/annotates something already here.

### 6.2 Zero source-code (`.ts`) changes — confirmed by both reports

Report 1's central conclusion is that **across all 33 breaking changes and deprecations, not one requires a source-code change in Agentic HQ.** Report 1 ran a `grep` sweep of `src/` for every removed/deprecated Node 23/24 API and found none in use:

- `{ shell: true }` on `child_process.spawn`/`execFile` (DEP0190) — none; the one `child_process` caller, `src/scripts/git-scripts/branching/03-squash-merge-branch/perform-squash-merge-on-branch.ts`, does not pass a shell.
- `dirent.path` (removed, DEP0178) — none.
- legacy `url.parse()` (runtime-deprecated) — none; project uses the WHATWG `URL`.
- `fs.F_OK`/`R_OK`/`W_OK`/`X_OK` constant getters (DEP0176) — none.
- `fs.truncate()` with a file descriptor (DEP0081) — none.
- `process.assert()` (DEP0100) — none.
- `async_hooks` / `AsyncLocalStorage` — none.
- `node:test` — none (the project uses Vitest).
- TLS server code (`tls.createSecurePair()` removed; `tls.Server.prototype.setOptions()` deprecated) — none.

This is fully consistent with Report 2's own sweep, which surfaced only `package.json`, `tsconfig.json`, documentation, and `.nvmrc` files — **never a `.ts` source file**. The two independent sweeps agree: **no `src/**/*.ts` file is in the AHQ-145 change set.** AHQ-145 is configuration + documentation + `.nvmrc` + verification work. This is now also recorded in Section 3's "confirmed NOT to need changing" list and Section 5.

### 6.3 `node-pty` postinstall `chmod` hook — explicit "do NOT change"

Report 1 Section 5 verifies that `node-pty@1.1.0` is a **Node-API (`node-addon-api`) addon** shipping prebuilt `darwin-x64`/`darwin-arm64` binaries, so the Node 24 `NODE_MODULE_VERSION` ABI bump (127→137) does not invalidate it — the 2026-05-16 darwin-x64 smoke test installed it from a prebuilt binary with no `node-gyp` compile.

Crucially, Report 1 (Sections 5.4 and 8) calls out the root `package.json` `postinstall` hook. Grep confirms its exact current text — root `package.json` lines 14–15:

```
"// POSTINSTALL": "FIX: node-pty posix_spawnp failed on macOS. pnpm extracts spawn-helper binary with -rw-r--r-- instead of -rwxr-xr-x. Known pnpm bug: https://github.com/pnpm/pnpm/issues/7366. Mac-only (darwin-*), fails silently on other platforms.",
"postinstall": "chmod +x node_modules/node-pty/prebuilds/darwin-*/spawn-helper 2>/dev/null || true",
```

Report 1 states this is a **pnpm extraction-bug workaround (pnpm #7366), not a Node-version concern**, and **must be preserved verbatim**. So although `package.json` *is* an edited file in this change set (its `engines.node` and `@types/node` lines change — Section 1a/1b), lines 14–15 are an explicit **"do NOT change"** item: removing or altering the `postinstall` hook would silently break macOS PTY spawning on every install. This is recorded in Section 3's "confirmed NOT to need changing" list.

### 6.4 Things Report 1 CONFIRMS that Report 2 already said

- **No GitHub Actions / CI.** Report 2 Section 3 found `.github/` has no `workflows/` directory. Report 1 Section 8 independently states "there is currently no `node-version` reference under `.github/`". **Agreed — no CI file to change.**
- **No `.nvmrc` at the repo root today.** Report 2 Section 1d verified this by `ls`/`find`; Report 1 Section 7 says the same. **Agreed.** (Report 2 additionally found a pre-existing `.nvmrc` containing `22` under `string-reversal/ts-workflow/` — Report 1 did not enumerate per-workflow `.nvmrc` files, so this remains a Report-2-only finding; no conflict.)
- **Corepack must be re-enabled per Node version.** Report 1 Section 7 stresses that Corepack ships inside Node and `corepack enable` must be re-run after switching to Node 24. This is an **operational machine step, not a file edit**, so it does not add a file to Report 2's list — but the planner should carry it into the implementation plan as an explicit step. The `packageManager` field in root `package.json` (`pnpm@11.1.2+sha512…`) is already correct and needs no change — consistent with Report 2 finding no `packageManager`-related edit.
- **`@types/node` should track the Node floor.** Report 2 Section 1b recommends `@types/node` `^25.0.9` → `^22`. Report 1 does not contradict this; it notes detailed dependency-version compatibility is Report 2/3's remit. **No conflict.**

### 6.5 Items in Report 1 that produce NO file change (completeness)

For the record, the following Report 1 findings were reviewed and produce **no** addition or annotation to Report 2's file list: the `engines.node` widening (already Report 2 Section 1a's item #1); the ES language-surface additions from V8 13.6 (`using`/`await using`, `Error.isError()`, `Float16Array`, `RegExp.escape()` — additive, optional, and the `tsconfig` `target` bump in Section 1c is the only related edit); the stable `--permission` model (opt-in, off by default — not used); the `node:test` auto-wait change (project uses Vitest); the Node 23.6 type-stripping default (project runs TS via `tsx`); stricter `fetch`/`undici` spec compliance and stricter `fs.existsSync`/`clearImmediate` type checking (no code change — verified by the passing 146/146 smoke run); and OpenSSL 3.5 / security-level changes (no keygen, no TLS server). None of these touches a file beyond what Sections 1–5 already list.

### 6.6 Net effect of the cross-reference

The cross-reference **does not invalidate any prior Report 2 finding** and **does not remove anything** from the change set. It makes exactly these changes:

1. **One new documentation item** — augment the `README.md` `### Mac OS` section (L17–L19) and `CONTRIBUTING.md` L70 with the **macOS 13.5+ prebuilt-Node floor** (Section 1e, Section 3 gap (e), Section 5).
2. **One explicit "do NOT change" item** — the root `package.json` `postinstall` `chmod` hook, L14–L15 (Section 3, Section 5).
3. **One explicit "no source files" confirmation** — the `src/` grep sweep for removed/deprecated APIs found nothing, recorded with both reports cited (Section 3, Section 5).
4. **Two "(confirmed by Report 1)" annotations** — the no-CI finding and the no-root-`.nvmrc` finding.

The authoritative change set therefore remains **16 file edits + 1 new file** (Section 5), with the clarification that the `README.md` and `CONTRIBUTING.md` edits each now have two parts (Node-version update + macOS-floor augmentation), and that the root `package.json` edit must leave its `postinstall` lines untouched.

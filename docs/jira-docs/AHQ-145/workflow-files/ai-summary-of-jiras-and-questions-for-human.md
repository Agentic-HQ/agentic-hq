# AI Summary: AHQ-145

**Jira**: [AHQ-145](https://agentic-hq.atlassian.net/browse/AHQ-145)
**Title**: Upgrade Agentic HQ And Maintainer Machine To Default To Node 24 LTS (Supporting Node 22–24)
**Status**: Transitioned to In Progress, assigned to Steve Halso
**Generated**: 2026-05-16 18:23

---

## My Understanding of This Task

This Jira moves the project — and the maintainer's machine — to default to **Node 24 LTS**, while still *accepting* Node 22. The crux is a deliberate three-way split that must not be conflated (Section 2 of the Jira):

- **A — what the project _accepts_**: every `package.json` `engines.node` field is **widened** to `">=22.0.0 <25.0.0"` (accepts Node 22 *and* 24). It is explicitly *not* narrowed to 24-only — allowing 22 costs nothing and some future public users will be on Node 22 Maintenance LTS.
- **B — what the project _recommends / defaults to_**: a new `.nvmrc` containing `24`, plus README and `docs/` updated to present Node 24 LTS as the recommended runtime (Node 22 noted as also-supported).
- **C — the maintainer's machine default**: Node 24 becomes the machine-wide `nvm` default. This is delivered as a **manual, line-by-line upgrade script** that the maintainer runs themselves — not an automated runner — because machine/global state (`~/.zshrc`, `nvm` default, Corepack global) is not version-controlled and is the real risk.

The risk that historically blocked this — `node-pty` on Node 24 — has **already been smoke-tested and verified** on the maintainer's `darwin-x64` machine (2026-05-16): clean install via prebuilt binary, 146/146 unit tests pass, `agentic-hq reversal` runs end-to-end. Node 24 (`v24.15.0`) is **already installed** on the machine. So this is a low-risk, mostly-mechanical change. The implementer does not re-run a gating test.

The Jira bakes in the lessons from AHQ-136 (the pnpm 10→11 upgrade that burned ~600k tokens by discovering breaking changes one error at a time). Three **research reports must be produced up front** by separate research agents (each fresh context) before any code is written: (1) a full Node 22→24 migration/breaking-changes RTFM report, (2) an authoritative *grep-derived* file list, (3) a backup-and-rollback plan for machine state. These reports plus the manual upgrade script are required deliverables, committed under `docs/jira-docs/AHQ-145/additional-reports/`.

The repo file edits themselves are small and well-enumerated: root `package.json` engines, six `ts-workflow/package.json` engines, `README.md` line 23, a new `.nvmrc`, and a note in `docs/dev/npm-commands.md` — plus two correctness fixes in the same area, agreed during this read-and-question phase: `@types/node` (wrongly pinned to `^25`, corrected to `^22`) and `tsconfig.json` `target` (`ES2022` → `ES2023`). The test type for this Jira is **`manual`** — there are no automated unit/integration/e2e tests to write; verification is the human running the script and the AC checklist.

## Research Findings

I did not need external (Perplexity/web) research for this *understanding* phase — the Jira is exhaustively detailed and self-contained. However, the Jira **mandates** three formal research reports as deliverables (Section 4). Those will be produced by separate research agents during the implementation phases, not now. What I verified by inspecting the repo:

### Current state confirmed in the repo (2026-05-16)

- **Root `package.json`** (`package.json:56-59`): `engines.node` = `">=22.0.0 <23.0.0"`, `engines.pnpm` = `">=11.0.0"`. Matches the Jira.
- **Six `ts-workflow/package.json` files** — confirmed by `find` (excluding `node_modules`, `ARCHIVED`, `project-spikes`). Each has `engines.node` = `">=22.0.0"`:
  1. `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/ts-workflow/package.json`
  2. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/package.json`
  3. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/ts-workflow/package.json`
  4. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/quick-jira-workflow/ts-workflow/package.json`
  5. `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/full-jira-tdd-story-workflow/ts-workflow/package.json`
  6. `tests/e2e/fixtures/string-reversal-copy-for-test/skills/string-reversal-copy-for-test/ts-workflow/package.json`
- **`.nvmrc`** — does not currently exist at repo root. Will be created with contents `24`.
- **`README.md` line 23** — confirmed: `Requires Node.js v22.x (LTS) or higher.` (under the `### Node.js` heading).
- **`docs/dev/npm-commands.md`** — exists; currently contains **no** node/nvm/version references at all. The note will be a new addition.
- **`@types/node`** — `package.json:66` has `"@types/node": "^25.0.9"` in devDependencies. `@types/node@25` describes Node 25's API surface — newer than any Node version the project supports or runs on — so this value is **wrong**. It is now an explicit in-scope correction in the Jira (Section 7): `^25.0.9` → `^22`, aligned to the lowest supported Node major. Root cause traced during this phase: it was set to `^25` at project setup (AHQ-6) instead of copying the spike template's correct `^22.0.0` — `pnpm add` installed `latest` rather than the template's pinned value. **The change must also add an explanatory comment** — `package.json` is strict JSON, so the project's `"// ..."` pseudo-comment key convention is used — recording *why* the major tracks the lowest supported Node and must not be bumped to the newest Node.
- **`tsconfig.json` `target`** — `compilerOptions.target` = `"ES2022"`, older than the runtime (Node 22–24 all support ES2023). Now an explicit in-scope correction in the Jira (Section 7): `"ES2022"` → `"ES2023"`, so the type-checker recognises Node-supported built-ins (`Array.prototype.findLast`, `toSorted`, etc.). **The change must also add a `//` comment** above the `target` line (`tsconfig.json` is JSONC, so `//` comments are valid) explaining the reasoning.
- **Machine**: `node --version` → `v22.20.0` (current branch checked out on Node 22); `nvm --version` → `0.39.7`. Node 24 (`v24.15.0`) reported by the Jira as already installed.
- **AHQ-42 audit doc** — Finding 6 is at `documentation-thorough-audit-doc.md:97`; Findings 7 & 8 at lines 105 and 114. Findings 7 & 8 statuses confirm they were tracked under AHQ-135 and the README typo/pnpm-version-prose were since fixed.
- **Install scripts** — `scripts/infra/install-dev-agentic-hq.sh` and `scripts/infra/install-prod-agentic-hq.sh` both exist; both must be smoke-tested on Node 24 per the ACs.
- **AHQ-136 retrospective** — exists at the referenced path; its Section 2 lists the 7 generic upgrade lessons, each already mapped to a requirement in Section 5 of this Jira.

## Project Design Requirements

**File**: `docs/dev/project-design-requirements.md`

The design requirements doc is about OO design (class/interface pairs per concept, "tell don't ask", avoid cached state, Concept Tables, Data Dictionaries). **For this Jira it is largely not applicable** — the work is configuration/documentation changes (JSON `engines` fields, a `.nvmrc` file, README/docs prose, a shell upgrade script) and research reports. No new TypeScript classes or interfaces are being designed.

The one place it touches: if any research agent or the upgrade-script deliverable involves new TypeScript code (none is currently anticipated), the OO conventions would apply. Otherwise the "concept → interface/impl" requirement, Concept Table and Data Dictionary sections will be **skipped** in subsequent phases because there are no code concepts to model — this Jira produces config edits, docs and a shell script, not classes.

## Questions for Human

I checked the Jira description (all 11 sections), the acceptance criteria, the AHQ-136 retrospective, and the AHQ-42 audit doc. The spec is unusually complete, so I have only one genuine question — about something the Jira leaves genuinely open.

> *Resolved during this phase (no longer a question): whether to change `@types/node` is settled — it is wrong (`^25`, newer than any supported Node) and is now an explicit in-scope correction to `^22` (the lowest supported Node major). The `tsconfig.json` `target` `ES2022` → `ES2023` fix was likewise agreed and added to scope. Both are recorded in the Jira's Section 7.*

### Question 1: When/how does the machine-side upgrade script get run?

The acceptance criteria include machine-state outcomes — *"Maintainer's machine: Node 24 is the `nvm` default; Corepack enabled; `pnpm` resolves correctly inside and outside the project"* — and *"`pnpm validate` passes on Node 24"* and *"`agentic-hq reversal` runs end-to-end on Node 24"*. The Jira is explicit that the upgrade script is **"for the maintainer to run manually, one line at a time"** — I (the AI) must **not** run it, and per my standing instructions I must never change `nvm` defaults / `~/.zshrc` / machine state myself.

So: the workflow will *produce* the script in a later phase, but the **machine-state ACs can only be satisfied by you running it**. I want to confirm the plan:

- (a) During the `manual` test/VALIDATE phase, I pause and hand you the script; you run it line-by-line on your machine, then tell me the results so I can record AC pass/fail. **(This is my default assumption.)**
- (b) You'd rather run the script *outside* this workflow entirely and just confirm to me afterwards that the machine ACs are met.
- (c) Something else — tell me.

Also: the repo's `pnpm validate` / `agentic-hq reversal` verification commands embedded in the script need to run *on Node 24*. Since this session and the workflow are currently on Node 22, those final verifications happen when you run the script. Please confirm that flow works for you.

**Human's Response**:
> Sounds great. Good job!

**Agreed:** Option (a) — during the `manual` VALIDATE phase the workflow produces the upgrade script and pauses; the maintainer runs it line-by-line on their own machine, then reports the results back so the machine-state acceptance criteria can be recorded as pass/fail. The Node 22→24 verification flow is confirmed: `pnpm validate` and `agentic-hq reversal` are run on Node 24 at the point the maintainer executes the script.

---

## Files I Reviewed

- `package.json` (root) — confirmed `engines.node` = `">=22.0.0 <23.0.0"`, `engines.pnpm` untouched, `@types/node` = `^25.0.9`. The primary edit target.
- The six `ts-workflow/package.json` files — confirmed all six exist and all carry `engines.node` = `">=22.0.0"`. Confirms the Jira's count of six; report 2 will re-confirm by grep.
- `README.md` (lines 20–28) — confirmed line 23 is `Requires Node.js v22.x (LTS) or higher.` under `### Node.js`; the install instructions below it were already corrected (no nvm typo, no hardcoded pnpm version).
- `docs/dev/npm-commands.md` — confirmed it exists and has no node references today, so the "Node 24 recommended / 22 supported" note is a fresh addition.
- `tsconfig.json` — confirmed `compilerOptions.target` = `"ES2022"` (being corrected to `"ES2023"`). `eslint.config.mjs` and the spike template `package.json` (`docs/project-docs/project-spikes/spike-00-.../package.json`) were also reviewed when tracing the `@types/node` mistake — the spike correctly had `@types/node` = `^22.0.0`.
- `docs/dev/project-design-requirements.md` — read in full; concluded the OO design rules mostly don't apply to a config/docs/script Jira.
- `docs/jira-docs/AHQ-136/workflow-files/manual-test-files/03-green-phase-retrospective-and-lessons-learnt.md` — read Section 2 (the 7 generic upgrade lessons). Each is already mapped to a requirement in this Jira's Section 5.
- `docs/jira-docs/AHQ-42/documentation-thorough-audit-doc.md` (Findings 6, 7, 8) — confirmed Finding 6 is the open one to mark resolved; Findings 7 & 8 already resolved in the current README.
- `scripts/infra/install-dev-agentic-hq.sh`, `scripts/infra/install-prod-agentic-hq.sh` — confirmed both exist; both must be smoke-tested on Node 24 per the ACs.

**Most important findings:** the repo state exactly matches what the Jira describes; all six `ts-workflow` package.json files are accounted for; `.nvmrc` does not yet exist; the risky part (`node-pty` on Node 24) is already verified; and two pre-existing version mistakes (`@types/node` `^25`, `tsconfig.json` `target` `ES2022`) were found and folded into scope as correctness fixes. So this is a low-risk, well-bounded change whose biggest deliverable is documentation/research, not code.

## Test Types And Tests We Will Be Implementing

**Test types: `manual`** (the only test type — no automated unit/integration/smoke/e2e tests for this Jira).

This is a configuration + documentation + research Jira. There is no application logic to unit-test. Verification is done by the human running the AC checklist and the manual upgrade script.

**What the AI will implement (in subsequent workflow phases):**

1. **Three research reports** under `docs/jira-docs/AHQ-145/additional-reports/`, each by a separate research agent with fresh context:
   - `full-report-on-relevant-node-22-to-24-migration-documentation.md` — every Node 23/24 breaking change as a numbered list (V8, npm 11, permission model, native-addon ABI, removed/deprecated APIs; impact on `child_process`, `fs`, `fetch`, ESM resolver, `async_hooks`, `tsx`).
   - `full-report-on-code-and-documentation-exploration-relevant-to-node-22-to-24-migration.md` — authoritative grep-derived file list (`engines`, `node`, `Node`, `v22`, `v24`, `22.0.0`, `.nvmrc`, `@types/node`); must cover `.agentic-hq/plugins/**` and `tests/**`; excludes `project-spikes`/`ARCHIVED`. (`@types/node` is no longer a "recommendation" — its correction to `^22` is already decided; the report only confirms grep coverage of it.)
   - `report-on-backup-and-rollback-plan-for-node-22-to-24-migration.md` — exactly what machine state to back up/record, plus a step-by-step rollback procedure.
2. **Repo edits**: root `package.json` engines → `">=22.0.0 <25.0.0"`; all six `ts-workflow/package.json` engines → `">=22.0.0 <25.0.0"`; new `.nvmrc` at repo root containing `24`; `README.md` line 23 reworded (Node 24 recommended, Node 22 supported); `README.md` Node.js section also gains a note that the repo now has a `.nvmrc` (contributors can run `nvm use`) plus a caution to **re-run `corepack enable` after switching Node versions** (else `pnpm` is "command not found"); `docs/dev/npm-commands.md` note added; **root `package.json` `@types/node` corrected `^25.0.9` → `^22`** (lowest supported Node major); **`tsconfig.json` `compilerOptions.target` `ES2022` → `ES2023`**. Both changes **must include an explanatory comment in the file** so the reasoning is never lost — a `"// ..."` pseudo-comment entry in `package.json` (strict JSON), and a `//` JSONC comment above the `target` line in `tsconfig.json`.
3. **Manual upgrade script** (Section 6 deliverable): line-by-line, `#`-commented, backup section first, per-step verification with expected output, rollback section commented at the end, covers `nvm alias default 24` / `corepack enable` / `corepack install -g pnpm@11.1.2` / inside-and-outside `pnpm` checks / `pnpm validate` / `agentic-hq reversal`. Optional commented `nvm uninstall 22` final step.
4. **AHQ-42 audit doc**: mark Finding 6 resolved; confirm Findings 7 & 8 already resolved.

**What the human will manually test/verify:**

1. Run the manual upgrade script line-by-line on their machine, confirming each verification command's expected output before proceeding.
2. Confirm Node 24 is the `nvm` default, Corepack is enabled, and `pnpm` (11.x) resolves both inside and outside the project directory.
3. Confirm `pnpm validate` passes on Node 24.
4. Confirm `agentic-hq reversal -- --string-to-reverse=hello` runs end-to-end on Node 24.
5. Confirm the dev and prod install scripts work on Node 24.
6. Decide the optional `nvm uninstall 22` step (recommendation: keep Node 22).  (HUMAN: I will keep Node 22 - to allow testing on that version if required later.  So ditch this step please.)

## Ready for Next Step

All questions resolved (Question 1 agreed as option (a); the `@types/node` and `tsconfig.json` `target` correctness fixes agreed and folded into scope). Test type confirmed as **`manual`** (specified by `test-type = manual` in the Jira description). This summary is complete.

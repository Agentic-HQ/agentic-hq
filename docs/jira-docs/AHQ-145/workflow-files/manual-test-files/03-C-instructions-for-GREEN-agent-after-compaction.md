# Instructions for the GREEN-phase agent (after compaction #2) — AHQ-145

You are part-way through the **GREEN phase** of the Jira TDD Story Workflow for **AHQ-145**
(Upgrade Agentic HQ to default to Node 24 LTS). This re-orients you after a second context
compaction. **Read it fully, then read the plan file before doing anything.**

This supersedes the earlier `instructions-for-GREEN-agent-after-compaction.md` (compaction #1) —
that one was written before any code was implemented; **the implementation is now done**.

## What command you are running

- Command: `/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation`
- `jira-id` = `AHQ-145`, `test-type` = `manual`
- `command-input-output-files-directory` =
  `/Users/stevepersonal/dev/agentic-hq/agentic-hq/.agentic-hq/temp/command-input-output-files/io-files-2026-05-16_22-25-03_b1be69ab-0e2a-44f2-ac52-808b45900f6d`
- Project root: `/Users/stevepersonal/dev/agentic-hq/agentic-hq`

## The plan — READ THIS FIRST

The full, approved implementation plan is at:

**`/Users/stevepersonal/.claude/plans/structured-hopping-crayon.md`**

It has the numbered Jira requirements, Decisions A–D, the AHQ-136 lessons mapping, the authoritative
file list, and Steps 0–5. **Do not re-plan or re-do research — it is all done.** An approved copy
also lives at `docs/jira-docs/AHQ-145/workflow-files/manual-test-files/03-APPROVED-green-phase-implementation-plan-copy.md`.

## What is already DONE (plan Steps 0–4 — implementation complete)

- **Step 0** — Approved plan copied to the workflow dir.
- **Step 1 — repo edits, all complete:**
  - Root `package.json`: `engines.node` → `"^22.0.0 || ^24.0.0"`; `@types/node` → `"^22"` with a
    top-level `"// @types/node"` pseudo-comment; `postinstall` chmod hook left untouched.
  - All 6 `ts-workflow/package.json`: `engines.node` → `"^22.0.0 || ^24.0.0"`.
  - All 7 `tsconfig.json` (root + 6 ts-workflow): `target` `ES2022` → `ES2023`, each with an
    explanatory `//` comment.
  - Created root `.nvmrc` — exact patch pin `24.15.0` (see Decision E below); deleted the redundant
    `string-reversal/ts-workflow/.nvmrc`.
  - Docs updated: `README.md` (Mac OS + a merged "Node.js & pnpm" section — heavily reviewed with
    the human, now SETTLED), `CONTRIBUTING.md`, `docs/dev/npm-commands.md`,
    `docs/user-docs/troubleshooting-quickstart.md` (incl. new macOS 13.5+ floor entry), `CLAUDE.md`.
- **Step 2** — `pnpm install` synced `pnpm-lock.yaml` (`@types/node` now 22.19.19). On Node 22.20.0:
  `pnpm typecheck` ✅, `pnpm test` ✅ (146/146), `pnpm lint:check` ✅, `pnpm format:check` ✅.
- **Step 3** — Upgrade script created at
  `docs/jira-docs/AHQ-145/manual-node-22-to-24-machine-upgrade-script.sh`.
- **Step 4** — `docs/jira-docs/AHQ-42/documentation-thorough-audit-doc.md`: Finding 6 marked
  resolved under AHQ-145; Findings 7 & 8 re-verified resolved.

## What is NOT done — your remaining work

The implementation is finished. What remains is the **manual acceptance test** and the GREEN
wrap-up:

1. **The human runs the upgrade script** (`manual-node-22-to-24-machine-upgrade-script.sh`)
   line-by-line on their machine to make Node 24 the default. **You must NOT run it yourself** — it
   touches nvm defaults, Corepack, and possibly `~/.zshrc`. Stay engaged: wait for the human's
   progress, help debug any failure, fix the script if a bug is found, and only treat this complete
   once the **human explicitly confirms a successful end-to-end run on Node 24** (Node 24 = nvm
   default, Corepack enabled, `pnpm` resolves in + out of the project, `pnpm validate` +
   `agentic-hq reversal` + the dev/prod install-script smoke tests all pass on Node 24).
2. **Then re-read the command file** `03-jira-minimal-implementation` for its exact Steps 7–12
   (manual test type) — do not rely on memory.
3. Write the GREEN phase summary to
   `docs/jira-docs/AHQ-145/workflow-files/manual-test-files/03-green-phase-summary-of-what-was-implemented.md`.
4. Add the Jira comment to AHQ-145 (tool: `mcp__mcp-atlassian__jira_add_comment`).
5. Write `command-output.json` to the `command-input-output-files-directory` above.
6. Self-terminate (`/agentic-hq-core-plugin:self-termination`).

## Decisions you MUST NOT lose (full detail in the plan)

1. **`engines.node` = `"^22.0.0 || ^24.0.0"`** — a *deliberate, human-approved deviation* from the
   Jira AC's literal `">=22.0.0 <25.0.0"` (Decision D). **Must be called out in the Jira comment
   AND the GREEN phase summary** so the AC checklist's literal mismatch is explained. Research
   recorded in `docs/jira-docs/AHQ-145/additional-reports/perplexity-qa-engines-node-range.md`.
1b. **`.nvmrc` = `24.15.0`** (exact patch pin), NOT the Jira AC's literal `24` — a second
   *deliberate, human-approved deviation* (Decision E), decided mid-upgrade 2026-05-17. **Also must
   be called out in the Jira comment AND the GREEN phase summary.** Research recorded in
   `docs/jira-docs/AHQ-145/additional-reports/perplexity-qa-nvmrc-pin-exact-vs-float-node-line.md`.
   A follow-up Jira (automation to keep the pin fresh + CI matrix) has been raised by the human as
   **AHQ-146**; description at
   `docs/jira-docs/AHQ-145/follow-up-jiras/Renovate-automation-jira-description.md` — out of scope
   for AHQ-145. The upgrade script's `nvm alias default 24` step is NOT changed (the personal
   default alias intentionally need not match `.nvmrc`).
2. The `postinstall` chmod hook is preserved verbatim (pnpm bug #7366 not fixed in pnpm 11 —
   research: `additional-reports/perplexity-qa-pnpm-7366-spawn-helper.md`).
3. `pnpm-lock.yaml` changed because of the `@types/node` edit — that is expected (Decision B), not
   a hand-edit.

## Do NOT

- Do not commit (`git add`/`commit`/`push`) — the human runs `/commit`.
- Do not run the upgrade script yourself — the human runs it.
- Do not modify `~/.zshrc`, `nvm` defaults, or any machine/shell state.
- Do not re-touch `README.md` — its wording was settled through extensive human review.
- Do not re-run research or re-plan — Steps 0–4 are done and validated.

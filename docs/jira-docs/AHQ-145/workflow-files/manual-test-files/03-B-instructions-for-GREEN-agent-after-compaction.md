# Instructions for the GREEN-phase agent (after compaction) — AHQ-145

You are part-way through executing the **GREEN phase** of the Jira TDD Story Workflow for
**AHQ-145** (Upgrade Agentic HQ to default to Node 24 LTS). This note re-orients you after a context
compaction. **Read it fully, then read the plan file before doing anything.**

## What command you are running

- Command: `/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation`
- `jira-id` = `AHQ-145`, `test-type` = `manual`
- `command-input-output-files-directory` =
  `/Users/stevepersonal/dev/agentic-hq/agentic-hq/.agentic-hq/temp/command-input-output-files/io-files-2026-05-16_22-25-03_b1be69ab-0e2a-44f2-ac52-808b45900f6d`
- Project root: `/Users/stevepersonal/dev/agentic-hq/agentic-hq`

## The plan — READ THIS FIRST

The full, agreed implementation plan is at:

**`/Users/stevepersonal/.claude/plans/structured-hopping-crayon.md`**

It contains the numbered Jira requirements, all decisions (A–D), the AHQ-136 lessons mapping, the
authoritative file list, and Steps 0–5. **Do not re-plan or re-do research — it is all done.** The
plan was refined through extensive back-and-forth with the human; every decision in it is settled.

## What is already DONE

- All **3 mandatory research reports** are written under `docs/jira-docs/AHQ-145/additional-reports/`
  (Report 2 was cross-referenced against Report 1).
- Two **Perplexity Q&A docs** are written in the same folder:
  `perplexity-qa-engines-node-range.md` and `perplexity-qa-pnpm-7366-spawn-helper.md`.
- The plan file is complete.

## What is NOT done — your remaining work (plan Steps 0–5)

Follow the plan. In short: Step 0 copy the approved plan to
`03-APPROVED-green-phase-implementation-plan-copy.md` → Step 1 repo edits → Step 2 `pnpm install` +
`pnpm typecheck`/`pnpm test` on Node 22 → Step 3 the manual upgrade script → Step 4 AHQ-42 audit doc
Finding 6 → Step 5 re-read the command file and hand the upgrade script to the human.

## Decisions you MUST NOT lose (full detail in the plan)

1. **`engines.node` = `"^22.0.0 || ^24.0.0"`** — a *deliberate, human-approved deviation* from the
   Jira AC's literal `">=22.0.0 <25.0.0"` (Decision D). Must be flagged in the Jira comment and the
   GREEN phase summary.
2. **`"// @types/node"` pseudo-comment** goes as a **top-level key** in `package.json`, immediately
   before `"devDependencies"` — NOT inside `devDependencies` (pnpm would treat it as a package).
3. **Delete** the redundant `string-reversal/ts-workflow/.nvmrc` (grep for references first); create
   the root `.nvmrc`=24. No `.nvmrc` in any `ts-workflow` dir.
4. **Preserve the `postinstall` `chmod` hook** in root `package.json` (lines 14–15) verbatim.
5. The `pnpm-lock.yaml` change from `pnpm install` (after the `@types/node` edit) is expected, not a
   hand-edit.

## After implementation (command Steps 7–12) — manual test type

Re-read the command file
`/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:03-jira-minimal-implementation` for the exact
wording. For `test-type = manual`: implementation alone does NOT complete GREEN — you must hand the
upgrade script to the **human** to run line-by-line on Node 24, and **wait for their confirmation**
of the machine-state ACs before writing the GREEN phase summary, adding the Jira comment, writing
`command-output.json`, and self-terminating.

## Do NOT

- Do not commit (`git add`/`commit`/`push`) — the human runs `/commit`.
- Do not run the machine upgrade script yourself — the human runs it.
- Do not modify `~/.zshrc`, `nvm` defaults, or any machine/shell state.

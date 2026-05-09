# Plan: AHQ-42 Additional Doc Improvements

## Context

A review pass over the docs (captured in
`docs/jira-docs/AHQ-42/AHQ-42-additional-doc-improvements-Jira-additional-section.md`)
surfaced four concrete issues to bundle into AHQ-42 alongside the README intro
rewrite that depends on AHQ-43/AHQ-44. The user has already triaged those four
items in the file with inline `HUMAN:` directives. Item 4 (`CONTRIBUTING.md`)
moved to AHQ-133 — out of scope here.

This plan covers the remaining three items. None of them depend on
AHQ-43/AHQ-44, so they can land independently of the intro rewrite.

## Items in scope

### Item 1 — Replace stale `how-agentic-hq-works.md`

**Why:** The current doc was written before the plugin restructuring. It tells
readers commands live at `.claude/commands/` (`how-agentic-hq-works.md:47`),
that the executor is `ClaudeCodeTool` at `src/tools/claude-code/ClaudeCodeTool.ts`
(`how-agentic-hq-works.md:17`), and to `cp src/demo/cli/...` to build a new
workflow (`how-agentic-hq-works.md:117`). None of those paths exist today —
plugins now live under `.agentic-hq/plugins/<plugin>/skills/<skill>/...`, and
the executor is `MarshalledCLITool` under `src/tools/marshalled-io-tools/`.

**Approach (per user's HUMAN: comment):**
1. Rename `docs/dev/how-agentic-hq-works.md` → `docs/dev/how-agentic-hq-works-OLD.md`
   (preserves history; user will plan deletion separately after reviewing the
   new doc).
2. Change the H1 inside the OLD file to `# How Agentic HQ Works (OLD - kept for reference, see how-agentic-hq-works.md)`
   so anyone landing on it knows it's stale.
3. Write a fresh `docs/dev/how-agentic-hq-works.md` that matches today's
   architecture.
4. Update `README.md:219` ("Further Documentation" link list) — the link still
   points at `how-agentic-hq-works.md` so it'll resolve correctly to the new
   file, but worth a sanity-check that the surrounding text still makes sense.

**Proposed structure for the new doc** (mirroring the old doc's depth, ~150–200 lines):

- **Core Concept** — thin TS wrapper around Claude Code; chains slash commands
  via fresh Claude sessions; workflows are built from plugins.
- **Plugin Layout** — `.agentic-hq/plugins/<plugin>/{commands,skills}/...` with
  the math-workflow as canonical example. Show real directory tree.
- **The Execution Engine** —
  `src/tools/marshalled-io-tools/marshalled-cli-tool.ts` (the orchestrator),
  `src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.ts` (pre-wired wrapper),
  `src/io/marshalling/json-file-io-marshaller-session.ts` (JSON file I/O still
  uses `command-input.json` / `command-output.json` under
  `.agentic-hq/temp/command-input-output-files/io-files-<ts>_<uuid>/`),
  `src/io/terminal/pty-cli-wrapper.ts` (PTY wrapper). Keep the "Why PTY?"
  section — Claude CLI produces zero output without a TTY.
- **CLI Dispatch** — from `agentic-hq <short-name>` through
  `bin/agentic-hq.cjs` → `src/cli/main.ts` → `src/cli/app.ts` →
  `src/cli/agentic-hq-program.ts` → `src/cli/workflow-registry-impl.ts`, with
  workflow discovery via the
  `src/workflow-discovery/plugin/plugin-directory-impl.ts` glob over
  `skills/*/ahq-workflow.json`.
- **Worked Example: Math Workflow** — full paths-and-files trace of
  `agentic-hq math -- --input-number=11`: the two-call skill resolution
  pattern (first call returns a shell command; second call executes it), then
  the three-step JSON-file chain `× 2 → + 3 → ÷ 5`.
- **Building Your Own Workflow** — point at `agentic-hq create-workflow` (not
  manual `cp` as the old doc suggested) and link to the README's "Create Your
  Own Workflow" section.
- **Key Design Principles** — file-based I/O (debuggable, future resumption),
  fresh context per step, markdown command instructions, thin wrapper.
- **Transitional design notes** — short final section flagging things that
  are *intentionally temporary* with Jira links so readers don't mistake them
  for permanent design:
  - Two-workspace plugin search (`agentic-hq` workspace + cwd workspace) — see
    `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts:95-117`.
  - Static `DEFAULT_ALLOWED_TOOLS` list — slated for per-workflow bundling in
    AHQ-102.
  - Classwitch override pattern (AHQ-124) — `bin/agentic-hq.cjs:15-20`,
    `src/cli/main.ts:3-21`, `src/cli/app.ts:3-34` are deliberately thin to
    let override repos swap implementations.

### Item 2 — README step numbering glitch

**Why:** Quick Start steps go `1, 2, 3, 4, 5, 6, 9` — `README.md:100` is
numbered `9.` instead of `7.`.

**Approach:** Single edit — change `9.` to `7.` at `README.md:100`.

### Item 3 — New `docs/README.md` index

**Why:** `docs/` shows nine folders with no map of what is user-facing vs
internal artifact vs historical. New visitors have no orientation.

**Approach (per user's HUMAN: comment — Internal Artifact + Historical at the bottom):**

Create `docs/README.md` with this structure:

```
# Agentic HQ Documentation

[1-2 sentence intro: where to start, link to top-level README.md]

## User Documentation
- workflow-descriptions/ — How to run shipped workflows; setup guides.
- user-docs/ — Permissions warnings and end-user guidance.

## Developer Documentation
- dev/ — Architecture, design specs, npm-commands reference, how-to guides.
- workflow-creation-docs/ — Per-workflow design + lifecycle docs (specs,
  approvals, refactorings, testing notes).
- project-docs/ — Active technical spikes (fail-fast minimal system, Slack
  integration, dynamic prompt runtime).

## Internal Artifacts (generated by running AHQ — not maintained docs)
- jira-docs/ — Per-Jira-ticket workflow execution records (37 AHQ-N folders).
- mission-docs/ — Per-mission execution outputs from E2E tests and workflow
  runs (29 missions).

## Historical (preserved for reference, not maintained)
- ARCHIVED/ — Old project docs and pre-plugin-era artifacts.
- LATER/ — Parking lot for deferred ideas (NOW/NEXT/LATER prioritization).
```

The key file references for each line come from the catalog in the Phase 1
Explore findings; no further research needed.

## Items explicitly out of scope

- **Item 4 (`CONTRIBUTING.md`)** — Moved to AHQ-133 per user comment.
- **README intro rewrite** — Original AHQ-42 scope; depends on AHQ-43/AHQ-44.
  Not blocked by these three items, but unchanged here.

## Critical files

- `docs/dev/how-agentic-hq-works.md` (rename → `-OLD.md`, edit H1)
- `docs/dev/how-agentic-hq-works.md` (new file, fresh content)
- `README.md` (line 100 numbering fix; sanity-check line 219)
- `docs/README.md` (new file)

## Files to *reference* in the new architecture doc

- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/` (canonical example)
- `src/tools/marshalled-io-tools/marshalled-cli-tool.ts` (executor)
- `src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.ts`
- `src/io/marshalling/json-file-io-marshaller-session.ts` (file-based I/O)
- `src/io/terminal/pty-cli-wrapper.ts` (PTY)
- `src/cli/main.ts`, `src/cli/app.ts`, `src/cli/agentic-hq-program.ts`,
  `src/cli/workflow-registry-impl.ts`
- `src/workflow-discovery/plugin/plugin-directory-impl.ts` (plugin glob)
- `bin/agentic-hq.cjs` (env-var workspace root)

## Verification

These are docs changes — no test harness to run. Verification is read-and-click:

1. **Item 1 (new architecture doc):**
   - Open the new `docs/dev/how-agentic-hq-works.md`, confirm every file path
     it cites resolves (use Cmd-click in the editor or `ls` on the path).
   - Trace the math-workflow example by running
     `agentic-hq math -- --input-number=11` and confirming the steps in the
     doc match what actually happens (temp dir under
     `.agentic-hq/temp/command-input-output-files/`, `command-input.json` /
     `command-output.json` files present, three skill calls).
   - Confirm `how-agentic-hq-works-OLD.md` exists and the H1 makes its
     stale-status obvious.
2. **Item 2 (README numbering):** scroll README Quick Start, confirm steps go
   `1, 2, 3, 4, 5, 6, 7` with no gap.
3. **Item 3 (`docs/README.md`):** open `docs/`, click each folder link in the
   new index, confirm each one resolves and the description fits what's there.
4. **Cross-link sanity:** `README.md:219` link to `how-agentic-hq-works.md`
   still resolves; the new "Further Documentation" target reads naturally.

## Order of work

1. Item 2 (numbering fix — trivial, ~30 seconds).
2. Item 3 (`docs/README.md` — content already mapped; ~10 minutes).
3. Item 1 — split into:
   3a. Rename + edit OLD file's H1.
   3b. Write the new architecture doc (the substantive work; allow time for
       review iteration since user said "after I've reviewed it, you can plan
       to delete the OLD one").

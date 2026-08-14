# AHQ-202 — Implementation Summary

## Summary Of Work Done

Executed the approved verification-first proof: from a clean prefix-global install of
`agentic-hq@0.1.1` (registry `latest`, Node v24.15.0), the interactive add-feature workflow was
launched in a scratch project and proven through its riskiest surfaces — the skill → shared-runner
→ compiled `add-feature-cli.js` chain in `prebuilt` mode, io-files marshalling, the chained
second Claude session (Researcher), help-doc path resolution to the installed package, runtime
writes landing in the user project, and the first interactive stop working correctly. Per the
2026-08-14 UPDATE in `02-implementation-plan.md` (agreed with Steve), the run was deliberately
stopped at that first interactive stop instead of being driven through all four agents — the
remaining end-to-end coverage is anticipated in a future Ubuntu VM Jira. **Zero production-code
changes and zero publishes**, as the happy path planned. During Phase 1 setup an out-of-scope
startup crash was discovered and split out as
[AHQ-205](https://agentic-hq.atlassian.net/browse/AHQ-205) (see follow-ups).

## Files Changed/Added/Deleted

Repo files (no production code touched):

- `docs/tickets/AHQ-202/workflow-files/02-implementation-plan.md` — **changed**: 2026-08-14
  UPDATE recording the agreed stop-at-first-interactive-stop deviation.
- `docs/tickets/AHQ-202/workflow-files/03-implementation-summary.md` — **added** (this file).
- `docs/tickets/AHQ-202/workflow-files/supporting-files/AHQ-205_bug_Jira.md` — **added**: the
  AHQ-205 bug description (filed by Steve at the Jira; discovered during Phase 1).
- `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md` — **changed**: AHQ-205 added as
  Sub-Task list item 8 plus a 2026-08-14 addendum (requested by Steve).

Proof artifacts outside the repo (throwaway, under `/tmp/agentic-hq-test-workspaces/`):
`ahq202-prefix-YbGwSU/` (the prefix-global install), `ahq202-ws-Sz4QyA/scratch-calc/` (the
scratch project), `ahq202-install-before.sha256` / `ahq202-install-after.sha256` (the V4
manifests).

## Tests Added/Updated And Test Results

No automated tests added — the approved plan records why (the interactive surface is not
CI-runnable; artifact shape already covered by AHQ-198/AHQ-204 tests). The deliverable was the
manual proof. Commands and outcomes:

**Phase 0 — preconditions (PASS):** `node --version` → `v24.15.0`; `npm view agentic-hq version`
→ `0.1.1`.

**Phase 1 — clean install (PASS):** `npm install -g --prefix <fresh dir> agentic-hq` (22
packages); `<prefix>/bin/agentic-hq list` from a neutral directory listed exactly `add-feature`
and `math` from the installed package's workspace. Baseline manifest:
`(cd <pkg> && find . -type f -exec shasum -a 256 {} + | sort -k2)` → 672 files.
*(Running the same `list` from inside the dev repo crashed — that is the out-of-scope AHQ-205
bug, see follow-ups; it cannot occur in this proof's planned contexts.)*

**Phase 2 — scratch project (PASS):** `scratch-calc` (zero-dependency `node:test` project)
created under the trusted parent, git-initialised, baseline committed; `node --test` → 1 pass,
0 fail.

**Phase 3 — interactive run (run by Steve in a real Terminal, stopped by agreement at the first
interactive stop):**
`cd <scratch-calc> && <prefix>/bin/agentic-hq add-feature -- --ticket-id=SCRATCH-1`.
Terminal evidence showed, in order: the skill session launched with the three installed-package
`--plugin-dir`s; the skill wrote its `command-output.json` (io-files marshalling) and
self-terminated; the shared runner executed
`node <pkg>/scripts/run-workflow.cjs --ahq-package-root=<pkg> --build-mode=prebuilt
--workflow-js=dist/.../add-feature-cli.js`; the compiled CLI launched the Researcher (command
01) as a second Claude session; the Researcher created
`docs/tickets/SCRATCH-1/workflow-files/01-feature-brief.md` in the scratch project, pointed at
help docs under the installed package root (workspace-root relay correct), and stopped, waiting
for the human — the interactive stop working exactly as designed. The chain was then abandoned
(Ctrl-C). No folder-trust prompt appeared (trusted-parent convention worked).

**Phase 4 — post-run verification:**

| # | Verification | Result |
|---|---|---|
| V1 | Full four-agent completion, exit 0 | **PARTIAL (by approved deviation)** — chain proven through the Researcher and the first interactive stop; agents 02–04 not run |
| V2 | All four workflow files in scratch project | **PARTIAL** — `01-feature-brief.md` present at the correct user-project path; files 02–04 never due (run stopped) |
| V3 | Scratch feature landed, `node --test` passes | **NOT RUN** (no feature implemented); baseline re-run after the abandoned run: 1 pass, 0 fail — project intact |
| V4 | Installed package byte-identical before/after | **PASS** — `diff` of the sorted 672-file SHA-256 manifests is empty; all runtime writes (workflow files, io-files temp dirs) landed inside the scratch project |
| V5 | Zero publishes on happy path; results recorded | **PASS** — no publish, no version bump; this document is the record |

## Approved Deviations From The Plan

One — **Phase 3 stopped at the first interactive stop instead of driving all four agents**,
proposed by Steve on 2026-08-14 and agreed; recorded as the UPDATE at the bottom of
`02-implementation-plan.md`. Rationale: the evidence to that point already exercises the
add-feature-specific risks this ticket exists to retire, and a full interactive add-feature run
is anticipated in an Ubuntu VM in a future Jira (the Linux install-and-run check flagged in the
parent brief's Addendum to Sub-Task 5 / AHQ-199). Consequence: V1/V2 partial, V3 not run, as
tabled above.

## Out Of Plan Follow-up Ideas/Concerns

- **[AHQ-205](https://agentic-hq.atlassian.net/browse/AHQ-205)** (created by Steve 2026-08-14,
  now the last Sub-Task of AHQ-195): the npm-installed CLI crashes at startup
  (`cannot add command 'add-feature' as already have command 'add-feature'`) when run from a
  directory whose local workspace defines a workflow named the same as a shipped one (e.g. the
  agentic-hq repo clone) — no name-collision handling in workflow registration, so every
  invocation from such a directory fails, including `list` and `--help`. Discovered during
  Phase 1; reproduced twice; deliberately **not** fixed here (out of plan scope, and not a
  defect in this proof's contexts). Full description:
  `supporting-files/AHQ-205_bug_Jira.md`.
- **Remaining unproven surface:** the Planner/Implementer/Reviewer stages and their approval
  gates have still never run from a registry install end-to-end. Deliberately accepted; expected
  to be covered by the future Ubuntu VM full-run Jira — whoever writes that ticket should
  include four-agent completion plus the V2/V3-style checks skipped here.
- The plan's pre-existing follow-ups (node-pty expect-style interactive smoke test; dead
  `commands/` dirs of unmigrated workflows; AHQ-199 Quickstart mentioning the folder-trust
  prompt) stand unchanged.

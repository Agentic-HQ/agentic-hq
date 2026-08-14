# AHQ-202 — Feature Brief

## One Sentence Outcome

The full interactive four-agent add-feature workflow is proven to run end-to-end from a
registry-installed `agentic-hq` in a clean directory, with a patch republish only if the proof
surfaces a defect.

## User Story

**As a**: developer who npm-installed agentic-hq  
**I want:** the flagship interactive add-feature workflow to work from that registry install  
**So that:** I can run real multi-agent feature development without cloning or building the repo

## Human Prompt

This is a subtask of AHQ-195, and is detailed in the parent ticket at:
docs/tickets/AHQ-195/workflow-files/01-feature-brief.md
Please be sure to read the details of how this was split in that ticket and be especially 
careful to fully read and understand any relevant Addenda
(NOTE: in order to use the add-feature workflow to implement these Jiras it was
migrated already, so some of this Jira has already been completed).

## My Understanding of This Task

AHQ-202 is Sub-Task 4 of the AHQ-195 npm-publish plan. Its original scope was "migrate
add-feature onto the prebuilt pattern, republish a patch version, and prove the full interactive
four-agent flow from a registry-installed package" — but the migration portion was pulled forward
and completed as AHQ-204 (2026-08-10), *before* the first publish, so the published
`agentic-hq@0.1.1` already ships the migrated add-feature. What remains (per the parent brief's
2026-08-10 addendum and `docs/tickets/AHQ-204/01-work-details.md` "Out of scope") is: **prove the
full interactive four-agent add-feature flow (Researcher → Planner → Implementer → Reviewer) runs
from a registry-installed package in a clean directory**, retiring the add-feature-specific risks
(interactive stops, the four-agent chain, help-doc paths located via the workspace-root relay) —
plus the **republish of a patch version**, now decided **contingent-only** (Question 1): no
shipped-artifact content has changed since the 0.1.1 publish commit, so on the happy path this
ticket is a verification/proof exercise with no code changes and zero publishes; a republish
happens only if the proof surfaces a defect (fix → bump patch → restart checklist, per
`docs/dev/publish-checklist.md` §6). The proof shape is decided by Questions 2 and 3: one full
interactive run from a prefix-global install on Node 24, in a scratch project under the trusted
temp parent, driven end-to-end through all four agents.

## Research Findings

**State of the published artifact (0.1.1, `latest`):**

- `npm view agentic-hq version` → `0.1.1`; local `package.json` is also `0.1.1`. The only repo
  changes since the publish commit (`a2565b4`) are AHQ-198's review summary and the 0.1.0
  deprecation — nothing that affects the shipped artifact.
- AHQ-198 verified 0.1.1 from the real registry on a 4-combo matrix (npx + prefix-global install,
  each on Node 22 and Node 24) — but only `list` and the **non-interactive math workflow**.
  add-feature was verified to *list* (only math + add-feature appear) but has never been *run*
  from a registry install. That run is exactly this ticket's remaining scope.
- The staged release tree (asserted by the AHQ-198 e2e artifact-shape tests) ships everything the
  interactive flow needs: the four command files
  (`release/.agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature/01–04*.md`), all five
  workflow help docs (`skills/add-feature/docs/workflow-help-docs/00–04*.md`), the migrated
  SKILL.md (shared `run-workflow.cjs` runner with `{build-mode}`/`{ahq-package-root}`), and the
  compiled `add-feature-cli.js` under `release/dist/...` (staged-artifact assertion added in
  AHQ-204's build-determinism test).

**What the proof must exercise (the risks AHQ-202 exists to retire):**

- **Interactive stops** — the Researcher (and later gates) stop and wait for the human; every
  prior registry verification was non-interactive math, so this surface is unproven off-repo.
- **The four-agent chain** — four chained Claude sessions driven by the TS CLI
  (`add-feature-cli.js`) via io-files marshalling.
- **Help-doc paths via the workspace-root relay** — in a registry install the workspace root
  resolves to the installed package root (bin wrapper still dual-writes
  `AGENTIC_HQ_WORKSPACE_ROOT` until AHQ-200), so help docs must be found under
  `<installed-package>/.agentic-hq/plugins/...`.
- **Runtime writes land in the user project, not the read-only install** — workflow files go to
  `<project>/docs/tickets/<ticket-id>/workflow-files/` and io-files temp dirs come from the user
  workspace (AHQ-197's composition-root wiring). The parent AC "nothing is written inside the
  installed package directory at runtime" is directly checkable on a prefix-global install.

**Operational gotchas already learned (publish checklist §4/§5 + AHQ-198 publish day):**

- `npm publish` with passkey 2FA cannot run in a non-TTY shell (fails safely with `EOTP`) — any
  republish must be run by the human in a regular macOS Terminal.
- Claude Code's folder-trust prompt hangs workflow runs launched from fresh untrusted temp dirs —
  clean-directory workspaces should live under the already-trusted
  `/tmp/agentic-hq-test-workspaces/` parent (the e2e suite's convention).
- npm registry versions are immutable — if the proof fails, never republish the same version:
  fix, bump patch, restart the checklist from the top (§6).

**Consequence for the republish question:** the "republish a patch version" wording dates from
when the migration was expected to happen *inside* AHQ-202 (i.e. after the first publish, so a
republish would have been needed to get add-feature into the registry). With AHQ-204 having
landed the migration before 0.1.1, an unconditional 0.1.2 would ship no meaningful change, and
the publish process itself has already been exercised twice (0.1.0, 0.1.1).

## Web/Perplexity Research

None required — the parent brief, AHQ-204's work details, AHQ-198's implementation/review
summaries, the publish checklist, and the staged release tree answered everything locally.

## Questions And Answers

### Question 1

**Question:** Is the "republish a patch version" still required unconditionally, or should it be
contingent — i.e. only if the interactive proof surfaces a defect (fix → bump → republish per
checklist §6)?

**AI Recommendation:** Make it contingent. `agentic-hq@0.1.1` already contains the migrated
add-feature and nothing shipped has changed since, so an unconditional 0.1.2 would publish a
substantively identical artifact just to exercise a process already proven twice. Happy path:
AHQ-202 completes with zero publishes; failure path: §6 protocol applies.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 2

**Question:** What matrix does the interactive proof need? AHQ-198 already proved both install
routes (npx, prefix-global) on both Node lines (22, 24) with the non-interactive math workflow —
but each interactive add-feature run costs real human-attended time across four agent sessions.

**AI Recommendation:** One full interactive run: **prefix-global install, Node 24** (the parent
AC frames add-feature via `npm install -g agentic-hq` + `agentic-hq add-feature`; global also
makes the "nothing written inside the installed package" check directly inspectable). Rely on
AHQ-198's matrix for route/Node coverage — the add-feature-specific surfaces (interactive stops,
agent chain, help-doc relay) are route- and Node-version-independent.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

### Question 3

**Question:** What is the proof vehicle — the project and feature the registry-installed
add-feature run implements?

**AI Recommendation:** A tiny scratch project under the trusted
`/tmp/agentic-hq-test-workspaces/` parent (avoids the folder-trust hang) with a deliberately
trivial feature request (e.g. add a small function + test to a minimal Node project), driven
end-to-end through all four agents with the human answering the interactive stops. Proof =
workflow completes through the Reviewer, workflow files appear under the scratch project's
`docs/tickets/<ticket-id>/workflow-files/`, and the installed package directory is byte-unchanged
afterwards. Results recorded in this ticket's implementation summary.

**Human Answer ('Yes' means follow AI Recommendation):** Yes

## Relevant Files Reviewed

Ordered by decreasing relevance (pointers for the Planner):

- `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md` — parent brief; Sub-Task list item 4
  and the 2026-08-10 addendum define AHQ-202's remaining scope.
- `docs/tickets/AHQ-204/01-work-details.md` — records what was pulled forward and completed, and
  states exactly what stays in AHQ-202 (its "Out of scope" section).
- `docs/tickets/AHQ-198/workflow-files/03-implementation-summary.md` — the 0.1.1 publish and the
  4-combo registry verification matrix; defines what is already proven vs not.
- `docs/dev/publish-checklist.md` — the manual publish process; §4/§5 operational gotchas and the
  §6 failure protocol that governs any contingent republish.
- `release/.agentic-hq/plugins/agentic-hq-demos-plugin/` (staged tree) — verified the four
  add-feature command files, all five workflow help docs, and the migrated SKILL.md ship.
- `scripts/build-release.cjs` — staging logic including the `EXCLUDED_UNMIGRATED_SKILLS` filter
  (add-feature is not excluded).
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/SKILL.md` — the migrated
  shared-runner launch command the installed package executes.
- `package.json` — local version `0.1.1`, matching the registry's `latest`.

## Acceptance Criteria

- From a clean prefix-global install of `agentic-hq@latest` (Node 24, workspace under the trusted
  `/tmp/agentic-hq-test-workspaces/` parent), `agentic-hq add-feature` completes the full
  interactive four-agent flow on a trivial scratch-project feature.
- The run's workflow files appear under the scratch project's
  `docs/tickets/<ticket-id>/workflow-files/`, and the installed package directory is unchanged
  after the run.
- No republish on the happy path; if the proof surfaces a defect, it is fixed, republished as a
  patch bump per checklist §6, and the proof re-run to pass.
- The proof run and its results are recorded in this ticket's implementation summary.

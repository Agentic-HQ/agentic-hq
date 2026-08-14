# AHQ-202 — Implementation Plan

## Tests Being Created

**No new automated tests are practical for this feature.** The remaining scope is proving an
*interactive, human-attended* four-agent flow from a registry install — the interactive stops are
themselves the surface under test, so no CI-runnable test can exercise them. The artifact's shape
is already asserted by existing automated tests (AHQ-198's e2e artifact-shape tests + AHQ-204's
staged `add-feature-cli.js` assertion); nothing new to add there.

The deliverable is therefore a **concrete manual validation** — the proof run below. Each
verification maps to an Acceptance Criterion:

| # | Verification | Acceptance Criterion |
|---|---|---|
| V1 | `agentic-hq add-feature` from a prefix-global install of `agentic-hq@latest` (Node 24) completes all four agents (Researcher → Planner → Implementer → Reviewer) on a trivial scratch feature, CLI exits 0 | AC 1 |
| V2 | `docs/tickets/SCRATCH-1/workflow-files/` in the scratch project contains all four workflow files (01-feature-brief … 04-review-summary) | AC 2 |
| V3 | The scratch feature actually landed: `node --test` passes in the scratch project including the new test | AC 1 (flow produced real work) |
| V4 | SHA-256 manifest of the installed package directory is byte-identical before vs after the run (`diff` of sorted checksum manifests is empty — catches changed, added, and deleted files) | AC 2 |
| V5 | Zero publishes on the happy path; results recorded in this ticket's `03-implementation-summary.md` | AC 3, AC 4 |

**Sequencing (verification-first, the analogue of test-first here):** the proof runs **before any
code is written** — like a RED run, it is executed against the unchanged shipped artifact and only
a failure creates implementation work. Happy path: proof passes → zero code, zero publishes →
record results, done. Failure path: proof fails (genuine RED) → TDD the fix (failing automated
test reproducing the defect where feasible, per the AHQ-198 §6 precedent) → CODE → patch bump →
full publish checklist → re-run this proof to pass (GREEN).

> NOTE: No REFACTOR stage as it adds too much complexity for this simple add-feature workflow (do this in your own custom workflow if reqd)

## Implementation Changes

**Happy path: zero production-code changes.** The only repo artifacts are this ticket's
`03-implementation-summary.md` (proof procedure + results, written by the Implementer) and the
Reviewer's `04-review-summary.md`.

### Proof procedure (executed by the Implementer, with one human-driven phase)

**Phase 0 — Preconditions** (Implementer):
`node --version` → `v24.15.0`; `npm view agentic-hq version` → `0.1.1` (registry `latest`
unchanged since AHQ-198).

**Phase 1 — Clean prefix-global install + baseline snapshot** (Implementer):

```bash
PREFIX=$(mktemp -d /tmp/agentic-hq-test-workspaces/ahq202-prefix-XXXXXX)
npm install -g --prefix "$PREFIX" agentic-hq
"$PREFIX/bin/agentic-hq" list        # expect: only math + add-feature listed
PKG="$PREFIX/lib/node_modules/agentic-hq"
(cd "$PKG" && find . -type f -exec shasum -a 256 {} + | sort -k2) > "$PREFIX/../ahq202-install-before.sha256"
```

The `--prefix` form exercises the identical npm global-install code path while leaving the
dev-linked `agentic-hq` binary untouched (publish checklist §5 convention).

**Phase 2 — Scratch project** (Implementer), under the trusted parent (avoids the folder-trust
hang; `/tmp/agentic-hq-test-workspaces/` verified trusted 2026-08-12):

```bash
WS=$(mktemp -d /tmp/agentic-hq-test-workspaces/ahq202-ws-XXXXXX)
mkdir "$WS/scratch-calc" && cd "$WS/scratch-calc" && git init
```

Minimal Node project using the built-in `node:test` runner — **zero npm dependencies**, so the
proof stays about agentic-hq, not about scratch-project install steps:

- `package.json` — `{ "name": "scratch-calc", "version": "1.0.0", "scripts": { "test": "node --test" } }`
- `src/calc.js` — exports `add(a, b)`
- `test/calc.test.js` — tests `add` via `node:test` + `assert`

Feature request for the run: *"Add a `subtract(a, b)` function to `src/calc.js` with a test in
`test/calc.test.js`."* — deliberately trivial; the workflow, not the feature, is under test.

**Phase 3 — The interactive four-agent run** (HUMAN-driven): the Implementer **stops** and hands
Steve the exact command to run in a **separate regular Terminal window** (the interactive stops
need a human at a real TTY; the Implementer's own session cannot host them):

```bash
cd <scratch-calc path> && <prefix path>/bin/agentic-hq add-feature -- --ticket-id=SCRATCH-1
```

Steve drives all four agents end-to-end: answers the Researcher's questions, approves the
Planner's plan, and attends any Implementer/Reviewer stops. (`--ticket-id` help text explicitly
sanctions a made-up id.) Steve tells the Implementer when the run has completed.

**Phase 4 — Post-run verification** (Implementer): execute V1–V4 from the table above (after
manifest → `diff` against before manifest), then write V5 — the full procedure, evidence, and
outcomes — into `docs/tickets/AHQ-202/workflow-files/03-implementation-summary.md`.

### Contingent path (only if the proof surfaces a defect)

1. **STOP the proof; diagnose.** Never republish the same version (checklist §6 — registry is
   immutable).
2. TDD the fix: failing automated test reproducing the defect where feasible (AHQ-198's
   hoisted-postinstall fix is the precedent) → implement → green.
3. Bump patch `0.1.1` → `0.1.2`; restart `docs/dev/publish-checklist.md` **from the top** (§1–§5).
   §4's `npm publish` is run by Steve in a regular macOS Terminal — the passkey 2FA hand-off
   EOTPs in any non-TTY shell.
4. Re-run this proof procedure from Phase 0 against the new version until it passes.

## Risks/Unknowns/Concerns

- **Human-attended cost:** four real chained Claude sessions — likely 30–60+ minutes of Steve's
  attention plus real Claude usage. Accepted by the brief's Q2 answer (one combo only).
- **Folder-trust prompt:** the trusted parent should suppress it; if it appears anyway, Steve is
  at the TTY and can answer Yes — annoying, not fatal (worth recording in the summary if seen).
- **Byte-unchanged check semantics:** the assertion is on the checksum manifests (content), not
  on mtimes/atimes; any *new* runtime files inside the package dir would appear in the after
  manifest and correctly fail V4. io-files temp dirs and workflow files are wired to the user
  workspace (AHQ-197), so they should land under the scratch project — that's the claim V4 tests.
- **Defect-fix scope is unknowable in advance:** the contingent path plans the protocol, not the
  fix; a real defect returns through Planner-level judgment before code if it is non-trivial.

## Follow-up Ideas

- Automating an interactive-flow smoke test (programmatically driving the stops via node-pty
  expect-style scripting) — valuable but well out of this ticket's scope.
- Dead `commands/` directories of unmigrated workflows still ship (recorded in AHQ-198's
  follow-ups; candidate for AHQ-201 or a hygiene ticket) — unchanged by this ticket.
- AHQ-199 Quickstart should mention the folder-trust prompt for first-run users (already tracked
  in AHQ-198's follow-ups).

## Human Approval Confirmation

**Approved by Steve on 2026-08-14** ("approved", no conditions attached). What was approved: the
verification-first proof plan as written above — manual validation V1–V5 in place of automated
tests, zero code changes and zero publishes on the happy path, the Implementer/human split for the
interactive Phase 3 run, and the contingent §6 fix → patch-bump → republish → re-prove path only
if the proof surfaces a defect.

## UPDATE (2026-08-14, agreed with Steve during the Implementer stage): Phase 3 Stopped At The First Interactive Stop

Steve ran Phase 3 and then chose to stop the run at the Researcher's first interactive stop
rather than drive all four agents end-to-end, on the grounds that (a) the evidence to that point
already proves the add-feature-specific surfaces this ticket exists to retire, and (b) a full
interactive add-feature run is anticipated in an Ubuntu VM in a future Jira (the Linux
install-and-run check flagged in the parent brief's Addendum to Sub-Task 5 / AHQ-199), making a
second full human-attended run here poor value. What the partial run proved before it was
abandoned (terminal evidence captured in `03-implementation-summary.md`): the registry-installed
`agentic-hq add-feature` launched the skill session; io-files marshalling worked; the shared
runner ran the compiled `add-feature-cli.js` in `prebuilt` mode; the CLI chained a second Claude
session (Researcher, command 01); the Researcher resolved help-doc paths to the installed
package, wrote `docs/tickets/SCRATCH-1/workflow-files/01-feature-brief.md` into the scratch
project, and stopped correctly at the first interactive stop, waiting for human input. The run
was then abandoned via Ctrl-C.

**Consequences for the verifications:** V1 and V2 are recorded as PARTIAL (chain proven through
agent 01 + first stop; four-file completion not exercised), V3 NOT RUN (no scratch feature was
implemented; the baseline test still passes), V4 and V5 PASS in full. The contingent
fix-and-republish path was not triggered — no defect was surfaced by the proof itself (the
out-of-scope AHQ-205 name-collision bug found during Phase 1 setup is recorded separately in the
summary's follow-ups).

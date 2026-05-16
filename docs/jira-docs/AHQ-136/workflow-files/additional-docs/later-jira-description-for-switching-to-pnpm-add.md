# LATER REFACTOR Jira (draft description)

> **Status:** Created as https://agentic-hq.atlassian.net/browse/AHQ-144 in Jira. Surfaced by AHQ-136 (pnpm 10 → 11 upgrade)
> as a deliberately-deferred follow-up.
>
> **UPDATE 2026-05-16 — completed within AHQ-136.** `pnpm link --global` turned out to be
> *removed* in pnpm 11 (not merely discouraged): `pnpm link` now requires a `<dir>` arg and
> the install script failed with `[ERR_PNPM_LINK_BAD_PARAMS]`. AHQ-136 therefore had to fix
> the install command itself — the switch to `pnpm add -g .` and the live-symlink
> verification (AC1 — confirmed: symlink, not a copy) were both done in AHQ-136. **This Jira
> can be closed as done-by-AHQ-136.** The detail below is retained as the record of the work.
---

## Title

LATER REFACTOR: Switch dev-install script from `pnpm link --global` to `pnpm add -g .` (pnpm 11 recommended mechanism)

## Type

Refactor / Tech debt

## Summary

AHQ-136 upgraded the project from pnpm 10 to pnpm 11. The developer-install script
`scripts/infra/install-dev-agentic-hq.sh` still uses `pnpm link --global` to put the
`agentic-hq` CLI on the user's PATH. Under pnpm 11 that command **still works** — but
pnpm's **recommended** mechanism for exposing a local package's binaries globally is now
`pnpm add -g .`. Both are supported; the new way supersedes the old way.

This Jira switches the script to the pnpm-11-native command — **but only after verifying
that `pnpm add -g .` preserves live-source symlink behaviour**, which is essential for
dev mode and is currently unverified.

## Background / Why this was deferred (not done in AHQ-136)

During AHQ-136's GREEN phase, decision **D1** chose to keep `pnpm link --global` rather
than switch, for three reasons:

1. **GREEN-phase minimality** — TDD GREEN requires the *minimum* change to pass the test.
   `pnpm link --global` still runs under pnpm 11 (the only pnpm-11 failure was the PATH
   pre-check, fixed by `pnpm setup`), so swapping the command was more than the minimum.
2. **Unverified risk** — the install script's whole purpose is a **live-source symlink**:
   `agentic-hq` on PATH must point at the repo checkout so that edits to the source take
   effect immediately (dev mode). `pnpm link --global` is purpose-built for that. Whether
   `pnpm add -g .` produces a *live symlink* or a *copy* of the package is **not verified**.
   If it copies, dev mode silently breaks (repo edits would not be reflected in the global
   CLI). This must be tested before switching.
3. **"Superseded" ≠ "removed"** — `pnpm link` is still documented in pnpm 11. The switch is
   a best-practice improvement, not an urgent fix.

So the switch was correctly deferred to this follow-up Jira, where it can be tested
properly rather than rushed into a config-only upgrade.

## Acceptance Criteria

1. **Verify symlink behaviour first.** From the repo root, run `pnpm add -g .` and confirm
   it produces a **live-source install**: edit a source file (e.g. a `console.log` in the
   CLI entry point), then run the global `agentic-hq` from another directory and confirm the
   change is reflected **without** reinstalling. Document the result.
   - If `pnpm add -g .` **copies** instead of symlinking → do **NOT** switch. Record the
     finding in this Jira and close it as "won't do — `pnpm link --global` retained";
     update `install-dev-agentic-hq.sh` comments to explain why the old command is kept.
2. If (and only if) `pnpm add -g .` gives a live-source symlink: replace
   `pnpm link --global` with `pnpm add -g .` in `scripts/infra/install-dev-agentic-hq.sh`.
3. Update the script's comment block and the README "pnpm 11 one-time setup" note to
   describe the new command.
4. Re-run `scripts/infra/install-dev-agentic-hq.sh` end-to-end, then smoke-test:
   `which agentic-hq`, `agentic-hq list`, and `agentic-hq reversal -- --string-to-reverse="test"`.
5. Confirm the e2e test that exercises the install script still passes (the cross-workspace
   execution test relies on the global `agentic-hq` shim).
6. Verify `pnpm uninstall -g agentic-hq` / re-install round-trips cleanly so the script
   remains idempotent.

## Out of Scope

- The pnpm 10 → 11 upgrade itself (completed in AHQ-136).
- `pnpm setup` / `$PNPM_HOME/bin` PATH handling (covered by AHQ-136).
- Cleaning up orphaned pnpm-10 global shims (AHQ-136 confirmed they are unreachable and
  harmless — see references).

## References

- **pnpm docs — `pnpm link`:** https://pnpm.io/cli/link — documents `pnpm link`; pnpm 11
  positions `pnpm add -g .` as the way to expose a local package's binaries globally.
- **pnpm docs — global packages:** https://pnpm.io/global-packages — pnpm 11 stores global
  binaries under `$PNPM_HOME/bin`.
- **pnpm docs — `pnpm setup`:** https://pnpm.io/cli/setup
- **Perplexity research (AHQ-136):**
  `docs/jira-docs/AHQ-136/workflow-files/additional-docs/perplexity-answer-about-pnpm-link-global-migration.md`
  — section **"6) Better alternative to `pnpm link --global`"** states the pnpm-team-supported
  replacement is `pnpm add -g .`; both commands are supported and the new one supersedes the
  old. See also the doc's "REAL-WORLD OUTCOME" section.
- **AHQ-136 GREEN plan (decision D1):**
  `docs/jira-docs/AHQ-136/workflow-files/manual-test-files/03-APPROVED-green-phase-implementation-plan-copy.md`
  — "Resolution Note", decision D1.
- **AHQ-136 GREEN handoff doc:**
  `docs/jira-docs/AHQ-136/workflow-files/manual-test-files/03-B-green-phase-instructions-for-agent-after-problems-and-compaction.md`
  — section 3b, D1 option (b).
- **Script to change:** `scripts/infra/install-dev-agentic-hq.sh`.

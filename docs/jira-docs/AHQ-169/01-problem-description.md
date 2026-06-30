# install-dev-agentic-hq.sh Installation Script Prints Error

- **Type:** Bug (dev onboarding)
- **Project:** AHQ
- **Priority:** Medium — first-run onboarding friction; not a runtime bug.
- **Components:** Install / dev onboarding, `scripts/infra/install-dev-agentic-hq.sh`
- **Related:** AHQ-79 (install "smell"), AHQ-82 (e2e-test duplication decision),
  AHQ-170 (node-pty Linux build — a **separate** blocker surfaced while verifying
  this change; now fixed & committed in `d2424cc`).

---

## Problem

New users following the README hit a confusing failure at install. The dev
install script (`scripts/infra/install-dev-agentic-hq.sh`) registers the CLI
globally with `pnpm add -g .`, but pnpm 11 stores global binaries in its own
private `$PNPM_HOME/bin`, which is **not on `PATH` by default**. pnpm therefore
refuses to create the `agentic-hq` shim and prints:

```
[ERROR] The configured global bin directory "<home>/.local/share/pnpm/bin" is not in PATH
Run "pnpm setup" to update your shell configuration.
```

The documented fix (`pnpm setup` → restart the shell → re-run the install) is a
fragile, multi-step, machine-mutating dance that confused even the repo owner.

## Root cause

A **pnpm-11 global-bin ergonomics quirk, not our code.** pnpm uses a separate
`$PNPM_HOME/bin` that isn't on `PATH` by default, and its "is it on PATH?" check
doesn't recognise nvm's symlinked bin dir. **npm** has no such problem — under
nvm its global bin *is* the active Node version's `bin`, already on `PATH`.
Confirmed by two independent research passes (see
[`02-perplexity-q-and-a.md`](02-perplexity-q-and-a.md) and
[`03-web-research-q-and-a.md`](03-web-research-q-and-a.md)).

## Chosen fix

Stop using pnpm for the global step. Use **`npm link`**, which exposes
`agentic-hq` on `PATH` via the existing `package.json` `"bin"` field as a live
symlink to the repo — in the common case with no `pnpm setup`, no shell-config
edit, and no restart, and cross-platform (npm generates `.cmd`/`.ps1` shims on
Windows). Owner decisions: **Phase 1 only** (publishing to npm is future work),
and **drop the install script entirely**, documenting `pnpm install && npm link`
in the README.

## Acceptance criteria

- A fresh clone is globally runnable with `pnpm install && npm link` — no
  `pnpm setup`, no shell restart, no global pnpm-state mutation.
- `agentic-hq list` works from any directory (run-from-anywhere preserved).
- The 5 cross-workspace e2e tests pass — on x86_64 Linux too (now unblocked by
  AHQ-170; see status note in [`05-plan.md`](05-plan.md)).
- README, troubleshooting, and glossary updated; the "smelly" warning removed.
- macOS behaviour unchanged.

## Scope

- **In (Phase 1):** swap the dev-install mechanism (`pnpm add -g .` → `npm link`)
  and update docs/tests.
- **Out (Phase 2, future):** npm publishing — compile TS→JS, point `bin` at
  `dist/`, move `tsx` to a devDependency, add `prepublishOnly`. Full write-up in
  [`04-updated-simple-description-and-research-summary-and-proposed-solution.md`](04-updated-simple-description-and-research-summary-and-proposed-solution.md)
  and [`05-plan.md`](05-plan.md).

## References

- Problem / research summary / proposed solution:
  [`04-...`](04-updated-simple-description-and-research-summary-and-proposed-solution.md)
- Research: [`02-perplexity-q-and-a.md`](02-perplexity-q-and-a.md),
  [`03-web-research-q-and-a.md`](03-web-research-q-and-a.md)
- Implementation plan: [`05-plan.md`](05-plan.md)

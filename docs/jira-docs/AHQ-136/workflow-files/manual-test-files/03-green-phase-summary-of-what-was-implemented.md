# GREEN Phase Complete: AHQ-136 (manual test)

**Jira**: [AHQ-136](https://agentic-hq.atlassian.net/browse/AHQ-136)
**Test Type**: manual
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-05-16 15:03

---

## Implementation Created

**Files Created/Modified**: see "Files Created" / "Files Modified" below.

**Test Command**: `manual` test type — no automated test command. Verification is the
manual checklist in the approved plan's Step 8 / Resolution Notes.
**Test Result**: ✅ PASSING — all manual checks confirmed by the maintainer 2026-05-16.

---

## What Was Implemented

AHQ-136 upgrades the package manager from pnpm 10 to pnpm 11 across the agentic-hq repo and
all of its workflow TypeScript sub-projects, and (per the 2026-05-16 scope change) makes
pnpm 11 the corepack **global default** so `pnpm` is v11 from any directory on the machine.
It migrates the one removed config setting (`onlyBuiltDependencies` → `allowBuilds`), gives
each `ts-workflow` sub-project its own `pnpm-workspace.yaml`, fixes the dev-install script
for pnpm 11's removed `pnpm link --global` command, and updates the `create-workflow`
scaffolding so future workflows are born pnpm-11-correct.

### Key implementation decisions:

1. **`--ignore-workspace` dropped entirely.** Under pnpm 11 `--ignore-workspace` makes pnpm
   skip the local `pnpm-workspace.yaml` too, so `allowBuilds` is never read and
   `strictDepBuilds` fails the install. Each sub-project instead gets its own
   `pnpm-workspace.yaml` (`packages: ['.']`); a plain `pnpm install` stops at that nearest
   file and treats the directory as its own isolated workspace root.
2. **`pnpm link --global` → `pnpm add -g .`.** pnpm 11 removed the bare `pnpm link --global`
   form. `pnpm add -g .` is pnpm 11's documented replacement and was verified to produce a
   live-source symlink (dev mode still works). This folded the deferred AHQ-144 into AHQ-136.
3. **Old pnpm-10 global binaries left in place.** After `pnpm --force setup`, the old
   `$PNPM_HOME` PATH entry is replaced by `$PNPM_HOME/bin`, so the pnpm-10 shims are
   orphaned-and-unreachable — harmless. Cleanup is machine state, out of AC scope.
4. **corepack global default change is a human step.** Making pnpm 11 the global default
   mutates machine state, so it was delivered as human-run instructions, not done by the AI.

### Bugs found and fixed during GREEN:

1. **`--ignore-workspace` incompatible with pnpm 11 `allowBuilds`** — sub-project installs
   failed with `[ERR_PNPM_IGNORED_BUILDS]` and pnpm overwrote the hand-written `allowBuilds`
   map. Fixed by dropping `--ignore-workspace` everywhere and giving each sub-project its own
   `pnpm-workspace.yaml`.
2. **A 6th `ts-workflow` the AI summary's "5 sub-projects" list missed** — the e2e fixture
   `tests/e2e/fixtures/string-reversal-copy-for-test/.../ts-workflow/`. Migrated too;
   otherwise the e2e suite would break under pnpm 11.
3. **pnpm 11 moved the global bin dir to `$PNPM_HOME/bin`** — the install script's
   `pnpm link --global` failed the PATH pre-check. Required a one-time `pnpm setup`.
4. **`pnpm setup` needed `pnpm --force setup`** — plain `pnpm setup` refused with
   `[ERR_PNPM_BAD_SHELL_SECTION]` because `~/.zshrc` still held the pnpm-10 `# pnpm` block.
5. **`pnpm link --global` removed in pnpm 11** — re-running the script gave
   `[ERR_PNPM_LINK_BAD_PARAMS]`. Switched to `pnpm add -g .`.
6. **5 e2e tests' PATH fallback was wrong under pnpm 11** — they prepended `$PNPM_HOME`
   (pnpm 10 layout) instead of `$PNPM_HOME/bin`. Fixed in all 5.
7. **corepack's global default was still pnpm 10.33.0** — `cd /tmp; pnpm list -g` errored.
   Scope expanded to make pnpm 11 the corepack global default (`corepack install -g`).

---

## Files Created

- 6 × `ts-workflow/pnpm-workspace.yaml` — one per `ts-workflow` sub-project (`packages: ['.']`
  + `allowBuilds: { agentic-hq, node-pty, esbuild }`).
- `docs/jira-docs/AHQ-136/workflow-files/manual-test-files/03-APPROVED-green-phase-implementation-plan-copy.md`
  (the approved plan, with Replan Note + Resolution Notes 1–3).
- Research / handoff docs under `docs/jira-docs/AHQ-136/workflow-files/additional-docs/` and
  `.../manual-test-files/` (Perplexity answers, Gemini second opinion, AHQ-144 draft,
  `jira-update-for-scope-change.md`, the 03-B / 03-C handoff docs).
- This GREEN phase summary.

## Files Modified

- `pnpm-workspace.yaml` — `onlyBuiltDependencies` list → `allowBuilds` map; doc-comment to
  pnpm 11; `--ignore-workspace` comment reworded.
- `package.json` — `packageManager` → `pnpm@11.1.2`; `engines.pnpm` → `>=11.0.0`; 4
  `demo:plugin-direct:*` scripts drop `--ignore-workspace`.
- 6 × `ts-workflow/package.json` — dead `"pnpm": { "onlyBuiltDependencies": [...] }` block removed.
- 6 × `SKILL.md` — drop `--ignore-workspace` from the install command.
- `.agentic-hq/.../create-workflow/03-run-checks-on-workflow.md` — drop `--ignore-workspace`.
- `.agentic-hq/.../create-workflow/02-confirm-spec-approved-and-build.md` — scaffold
  `pnpm-workspace.yaml` for new workflows; plain `pnpm install`.
- `scripts/infra/install-dev-agentic-hq.sh` — `pnpm link --global` → `pnpm add -g .`; header
  comment + output rewritten for pnpm 11.
- `README.md` — pnpm-11 `[!NOTE]` callout; `pnpm --version` comment `10.33.0` → `11.1.2`.
- 5 × `tests/e2e/demo/*.e2e.test.ts` — PATH fallback fixed to `$PNPM_HOME/bin`; stale
  `pnpm link --global` comments/strings updated.
- `pnpm-lock.yaml` — unchanged (pnpm 11 still uses lockfileVersion 9.0; no dep versions
  changed). Per-sub-project `ts-workflow/pnpm-lock.yaml` files refreshed by their installs.

---

## Manual Verification Results (2026-05-16)

| Check | Result |
|---|---|
| `corepack install -g pnpm@11.1.2`; `cd /tmp; pnpm -version` | `11.1.2` (was `10.33.0`) ✅ |
| `cd /tmp; pnpm list -g` | no PATH error; lists `agentic-hq@0.1.0` ✅ |
| repo `pnpm -version` | still `11.1.2` (project pin) ✅ |
| `scripts/infra/install-dev-agentic-hq.sh` | clean; live symlink registered; only the expected `[WARN]` ✅ |
| `which agentic-hq` | `/Users/stevepersonal/Library/pnpm/bin/agentic-hq` (`$PNPM_HOME/bin`) ✅ |
| `agentic-hq list` | lists all 5 workflows ✅ |
| `agentic-hq reversal -- --string-to-reverse="upgrade smoke test"` | `tset ekoms edargpu`; **no "Update available!" nag** ✅ |
| `pnpm validate` (typecheck + lint + format + 146 unit tests) | passed after every change batch ✅ |

---

## Retrospective — see the dedicated doc

The full retrospective on this upgrade lives in its own document so it can be pasted onto
the Jira and referred back to before future upgrades:

**→ [`03-green-phase-retrospective-and-lessons-learnt.md`](./03-green-phase-retrospective-and-lessons-learnt.md)**
(same directory as this file).

It is structured as **two sections, ready to paste onto AHQ-136 as an addendum**:

- **Section 1 — Problems Hit, Workarounds, and Opinion.** An 8-row table of every
  unexpected issue, its root cause, and the workaround; plus an honest assessment that ~5
  of the 8 surprises were preventable with more thorough up-front preparation.
- **Section 2 — Lessons Learnt For The Next Upgrade.** A 7-item pre-upgrade checklist
  (read the whole migration guide; grep the codebase for every changed string; back up
  global machine state outside the repo; distinguish project-pin vs machine-default; verify
  the install path early; check for *removed* commands; budget context for the
  discover-loop). Written generically so it applies directly to the imminent Node upgrade.

**Headline cost of the journey:** 3 context compactions, ~600,000 tokens, 7 distinct
unexpected issues — most of which were foreseeable. See the dedicated doc for the detail.

---

## Ready for REFACTOR Phase

The manual test is passing. This program should self-terminate, and then (if running the
automated workflow) the following command will be run automatically:

```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-136 manual
```

# GREEN Phase Complete: AHQ-145 (manual test)

**Jira**: [AHQ-145](https://agentic-hq.atlassian.net/browse/AHQ-145)
**Test Type**: manual
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-05-17

---

## Implementation Created

AHQ-145 is a **config + documentation + research** Jira — there is no application logic. The
"implementation" is: config edits (`package.json`, `tsconfig.json`, `.nvmrc`), documentation
updates, a manual machine-upgrade script, and research artefacts.

**Test Command (manual)**: the maintainer ran
`docs/jira-docs/AHQ-145/scripts/manual-node-22-to-24-machine-upgrade-script.sh` line-by-line on
macOS 15.7.5. Captured evidence: `docs/jira-docs/AHQ-145/scripts/script-output.txt`.

**Test Result**: ✅ PASSING — end-to-end on Node 24.15.0.

Manual acceptance — all machine-state ACs confirmed on Node 24:

- Node 24.15.0 is the nvm default (`default -> 24 (-> v24.15.0)`)
- Corepack enabled; `pnpm` resolves under the Node 24 install
- `pnpm` 11.1.2 resolves **both inside and outside** the project
- `pnpm validate` — typecheck / eslint / prettier all clean; **146/146 tests, 32 files** passed
- `agentic-hq reversal -- --string-to-reverse=hello` → `olleh`
- dev install script smoke-tested (`agentic-hq 0.1.0` registered); prod install script
  smoke-tested (it is a placeholder — zero output is the expected result)
- Pre-upgrade machine-state backup captured at `~/ahq-145-backup/20260517-215443/` (outside the
  repo), with the rollback values recorded (previous default Node 22.20.0 / npm 10.9.3)

---

## What Was Implemented

AHQ-145 moves the project — and the maintainer's machine — to default to **Node.js 24 LTS** while
still supporting **Node 22 LTS**. The change set widens the supported-Node config
(`engines.node`, `.nvmrc`, `tsconfig` `target`, `@types/node`), updates every doc that states a
Node version, provides a manual machine-upgrade script with backup + rollback, and closes out the
related AHQ-42 audit findings. **No source code changed.**

### Key implementation decisions

1. **Decision D — `engines.node` = `"^22.0.0 || ^24.0.0"`** (root + 6 `ts-workflow/package.json`).
   A **deliberate, researched deviation** from the Jira AC's literal `">=22.0.0 <25.0.0"`. The
   disjoint range precisely encodes "the two LTS lines 22 and 24" and excludes the EOL,
   Current-only Node 23 that the contiguous range would silently admit. Research:
   `additional-reports/perplexity-qa-engines-node-range.md`.

2. **Decision E — `.nvmrc` = exact patch `24.15.0`**, not the floating major line `24`. A **second
   deliberate, researched deviation** from the Jira AC's literal `24`, decided mid-upgrade. A
   committed `.nvmrc` is treated as a runtime lockfile so every Node version change is an explicit,
   diffable, reviewable commit — serving the project's "no surprise breakage" priority. The
   personal `nvm alias default` is intentionally left as the floating line `24` (it need not match
   `.nvmrc`). Research: `additional-reports/perplexity-qa-nvmrc-pin-exact-vs-float-node-line.md`.

3. **`.nvmrc` left as a bare version file — no explanatory comment.** A `#` comment above the
   version (to document the pin rationale + the AHQ-146 auto-bump follow-up inline) was considered
   and **deliberately not added**. `.nvmrc` comment support only landed in **nvm 0.40**
   ([nvm issue #3336](https://github.com/nvm-sh/nvm/issues/3336)); nvm ≤ 0.39.x reads the first
   line as the version string, so a comment would break `nvm use` / `nvm install` for anyone on an
   older nvm — the maintainer is on **0.39.7**. Keeping `.nvmrc` a bare version file is the safe,
   portable choice. The pin rationale lives in Decision E, the Perplexity Q&A doc, and the
   `.nvmrc` notes added to `README.md` / `CONTRIBUTING.md`.

4. **Decision A — `@types/node` pseudo-comment placement.** `@types/node` pinned to `^22` (tracks
   the *lowest* supported Node major, so `typecheck` reflects that runtime's API surface). The
   explanatory `"// @types/node"` pseudo-comment is a **top-level** key (sibling of
   `devDependencies`), not inside it — pnpm treats every `devDependencies` key as a package.

5. **Decision B — lockfile regeneration.** `pnpm-lock.yaml` changed because `@types/node` moved
   `^25.0.9` → `^22`; `pnpm install` regenerated it. This is the expected side-effect of a real
   dependency change, not a hand-edit.

6. **`tsconfig` `target` ES2022 → ES2023** across all 7 `tsconfig.json` (root + 6 `ts-workflow`),
   each with an explanatory `//` comment — ES2023 is a safe baseline for the lowest supported LTS
   (Node 22).

7. **Redundant `.nvmrc` deleted.** `string-reversal/ts-workflow/.nvmrc` (`22`) was removed — the
   new root `.nvmrc` supersedes it (nvm/fnm walk up the directory tree).

8. **`postinstall` `chmod` hook preserved verbatim** — a pnpm bug #7366 workaround, confirmed
   still needed on pnpm 11.1.2 by research
   (`additional-reports/perplexity-qa-pnpm-7366-spawn-helper.md`).

### Bugs found and fixed during GREEN

None — implementation went as planned. Two notable in-flight events, neither a bug:

1. The README "Node.js & pnpm" section went through extensive maintainer review — wording
   iterations, correcting `nvm install` vs `nvm use`, and merging the separate Node.js and pnpm
   sections into one.
2. Decision E (`.nvmrc` exact-patch pin) was added mid-upgrade after a Perplexity research
   question; follow-up Jira **AHQ-146** was raised for the auto-bump automation.

## Files Created

- `.nvmrc` (repo root) — exact pin `24.15.0` (Decision E)
- `docs/jira-docs/AHQ-145/scripts/manual-node-22-to-24-machine-upgrade-script.sh` — manual machine-upgrade
  script (backup-first, per-step verification with expected output, commented rollback section)
- `docs/jira-docs/AHQ-145/additional-reports/perplexity-qa-nvmrc-pin-exact-vs-float-node-line.md` —
  research underpinning Decision E
- `docs/jira-docs/AHQ-145/follow-up-jiras/Renovate-automation-jira-description.md` — description
  for follow-up Jira **AHQ-146**
- `docs/jira-docs/AHQ-145/workflow-files/manual-test-files/03-APPROVED-green-phase-implementation-plan-copy.md` —
  Step 0 copy of the approved plan

The Jira-mandated research deliverables — three Node 22→24 migration reports and two earlier
Perplexity Q&A docs — were already in place under `additional-reports/` before this implementation
phase.

## Files Modified

- `package.json` (root) — `engines.node` → `"^22.0.0 || ^24.0.0"`; `@types/node` → `^22` with a
  top-level pseudo-comment; `postinstall` hook left untouched
- 6 × `ts-workflow/package.json` — `engines.node` → `"^22.0.0 || ^24.0.0"`
- 7 × `tsconfig.json` (root + 6 `ts-workflow`) — `target` ES2022 → ES2023 + explanatory comment
- `pnpm-lock.yaml` — regenerated (`@types/node` change; Decision B)
- `README.md` — Mac OS section (macOS 15.7.5 + macOS 13.5+ floor); merged "Node.js & pnpm"
  section; `.nvmrc` note showing the exact pinned version
- `CONTRIBUTING.md` — Node-version claim; macOS line; `.nvmrc` exact-version note
- `docs/dev/npm-commands.md` — Node version note
- `docs/user-docs/troubleshooting-quickstart.md` — `engines` string; Node 22-and-24 remediation
  text; new macOS 13.5+ prebuilt-binary floor entry; `.nvmrc` exact-version note
- `CLAUDE.md` — NODE VERSION rule
- `docs/jira-docs/AHQ-42/documentation-thorough-audit-doc.md` — Finding 6 marked resolved under
  AHQ-145; Findings 7 & 8 re-verified already resolved

## Files Deleted

- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/.nvmrc` —
  redundant (`22`), superseded by the new root `.nvmrc`

---

## ⚠️ AC deviations the reviewer must note

There are **two deliberate, maintainer-approved deviations** from the Jira AC's literal text —
both researched, both recorded above as Decisions D and E:

| AC literal | Implemented | Why |
|---|---|---|
| `engines.node` = `">=22.0.0 <25.0.0"` | `"^22.0.0 \|\| ^24.0.0"` | Disjoint range = the two LTS lines 22 and 24; excludes EOL Node 23 |
| `.nvmrc` contains `24` | `.nvmrc` contains `24.15.0` | Exact patch pin → Node version changes are explicit and reviewable |

The AC checklist will therefore show a literal mismatch on these two values. This is intentional
and explained. The maintainer may optionally update the Jira AC text to match.

A follow-up Jira, **AHQ-146**, has been raised: automate keeping the pinned `.nvmrc` current with
Node security releases (+ a CI Node 22/24 matrix). Its description is at
`docs/jira-docs/AHQ-145/follow-up-jiras/Renovate-automation-jira-description.md`.

---

## Ready for REFACTOR Phase

The manual acceptance test passed end-to-end on Node 24. This program should self terminate, and
then (if you are running the automated workflow) the following command will be run automatically:

```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-145 manual
```

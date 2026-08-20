# AHQ-208 — Review Summary

## Review Summary

The two-builds split shipped as approved: every implementation file I read (both wrappers, the
four-option runner, `build-workflow.cjs`, `build-release.cjs`, the full per-workflow `build-mode`
chain in `src/`, `tsconfig.build.json`, root `package.json`) matches the approved plan §1–§8
precisely, the four `SKILL.md` files are verifiably byte-identical, and every suite I re-ran
independently (unit via `pnpm validate`, runner, bin-wrapper, build-determinism) is green. The
findings below are minor: a silent-failure edge in the dev wrapper, two changed files missing from
the implementation summary's file list, and the (plan-sanctioned) deferral of add-feature's own
end-to-end proof.

## Checks Passed

| Area | Evidence | Result |
| --- | --- | --- |
| AC1 — separate builds; runner never builds the framework, never executes from `release/` | Code read: `bin/agentic-hq.cjs` runs incremental tsc then `dist/src/cli/main.js`; `scripts/run-workflow.cjs` has the four required options, rejects absolute `--workflow-js`, `build-first` delegates only to `build-workflow.cjs`, no `release/` reference anywhere; `scripts/build-workflow.cjs` = pnpm install → re-symlink → tsc, writes only inside the workflow dir. Reviewer re-ran the runner integration test (6/6 green) and bin-wrapper test (2/2 green, incl. Framework-Build-from-deleted-`dist/` proof) | Pass |
| AC2 — three workflows on the single template, shipped set incl. string-reversal | `md5 -q` over math/string-reversal/add-feature/fixture `SKILL.md`: all four hashes identical (`185b5403…`). Reviewer re-ran build-determinism: green (all three `ts-workflow/dist/<cli>.js` staged, `.d.ts` shipped, no `.tsbuildinfo`, two builds hash-identical). Tarball e2e source asserts the stripped layout, shipped-skills map incl. string-reversal, and runs reversal end-to-end; Implementer recorded 5/5 green (real Claude runs) | Pass |
| AC3 — user-workspace fixture runs against a tarball install, no clone anywhere | Fixture on disk verified: identical `SKILL.md`, own `.npmrc` + committed `pnpm-lock.yaml`, `REPO_ROOT_PLACEHOLDER` mechanism gone. Test source builds/packs/installs the tarball and runs the **installed** bin, asserting the reversed string, in-workspace `dist/` output and the symlink to the installed package root; Implementer recorded 2/2 green (real Claude run). Not re-run by the Reviewer (real-Claude cost) — source + recorded result accepted as evidence | Pass |
| AC4 — per-workflow `build-mode`, unit-tested | `current-user-workspace-impl.unit.test.ts:88-105` asserts `BUILD_FIRST` always + registered workflows carry it; `ahq-package-impl.unit.test.ts:62-88` asserts the wrapper's mode is inherited for both `BUILD_FIRST` and `PREBUILT`; chain verified in code from `WorkspaceImpl` → `PluginImpl` → `AhqWorkflowImpl` → registry action → `ToolFactory`. All green in the Reviewer's `pnpm validate` run | Pass |
| Test evidence (Reviewer's own runs, 2026-08-20) | `pnpm validate` → typecheck+lint+format green, 190/190 unit tests in 38 files; runner integration test 6/6; bin-wrapper 2/2 + build-determinism 1/1 (serialized run). E2e results (all real-Claude) taken from the Implementer's recorded runs, incl. the flake note (`real-claude-self-termination-skill` timeout, passed standalone, untouched by AHQ-208) | Pass |
| AC5 — no publish | Root `package.json`: `version` still `0.1.1`, `private: true`, root/release `prepack` guards intact; only `bin` key renamed to `agentic-hq-dev` | Pass |
| Regression coverage | Changed areas inspected: build chain (runner + bin-wrapper + build-determinism + publish-guards integration suites, tarball e2e), `src/` mode chain (18 updated unit files, behavioural assertions on both modes), migrated workflows (four distinct real-Claude e2e paths). The new `fileParallelism: false` fixes the genuine shared-`dist/`/`release/` race with a serialization the files already tolerated standalone | Good enough |

## Potential Fixes

| Area | Evidence | Result / Risk | Recommendation | Fix? |
| --- | --- | --- | --- | --- |
| Dev wrapper exits silently when `tsc` itself cannot spawn (RECOMMENDED) | `bin/agentic-hq.cjs:31-34` — the catch assumes "tsc already printed the errors", but on a fresh clone before `pnpm install` the spawn fails with `code: 'ENOENT'`, `status: null` (demonstrated with a node one-liner), so `process.exit(error.status \|\| 1)` exits 1 printing **nothing** | Fail (silent-failure edge; dev-only, first-run UX) | Do now — tiny fix: rethrow (or print a message) when `error.status == null`, keeping the quiet path only for real compile failures | Yes |
| Implementation summary under-reports two changed files | Commit `48f24b9` also changed `commands/add-feature/03-implementer.md` and `skills/add-feature/docs/workflow-help-docs/03-implementer-help-doc.md` (the new `## Human Approval Confirmation` section — matching the commit message but outside the AHQ-208 plan) and neither appears in the summary's `## Files Changed/Added/Deleted` | Weak (transparency gap only; the change itself looks deliberate and benign) | Do now — one added line in `03-implementation-summary.md` naming the two files as in-commit meta-work on the workflow command | Yes |
| Regression gap: add-feature's own end-to-end launch under the new pattern | Only the runner `--help` smoke was run for add-feature (recorded in the summary); the full interactive proof is deferred to the next `agentic-hq-dev add-feature` run per the approved plan and the AHQ-204 precedent (this very run executed add-feature from `release/` via the old runner) | Not validated | Do nothing now — the deferral is explicitly human-approved in the plan; AHQ-209's first run is the proof |  |
| Highest-risk changed area: the byte-identical `SKILL.md`'s runtime `skill-id` derivation | Every workflow launch now depends on the skill-executing agent deriving `skill-id` from `skill-base-dir`'s final path segment and naming `dist/{skill-id}-cli.js` — prompt logic with no type/test at that hop (`SKILL.md` Variables block) | Medium-Low — proven on four distinct real-Claude e2e paths, and a mis-derivation fails loudly (runner: missing file), never silently | Do nothing — accept with the existing e2e coverage; AHQ-209 extends the same template to all eight workflows, which is the real soak test |  |
| Dedupe option parsing across the two shipped scripts (NOT RECOMMENDED) | `run-workflow.cjs:44-95` and `build-workflow.cjs:36-59` duplicate the `--opt=` parse/validate pattern | Not worth it — each script is deliberately a self-contained, dependency-free CJS file (simpler to ship and audit); a shared module means a third shipped file and coupling for ~30 mechanical lines | Do nothing |  |

## Selected Fixes Applied

The human selected the two recommended rows via chat ("pls do recommended fixes", 2026-08-20);
`Fix? = Yes` recorded on both rows above.

1. **Dev wrapper silent-exit fix** — `bin/agentic-hq.cjs`: the catch now rethrows when
   `error.status == null` (tsc never ran, e.g. ENOENT before `pnpm install`) and only exits
   quietly with tsc's own exit code on a real compile failure. Manually verified both branches:
   a scratch package root without `node_modules/.bin/tsc` now fails loudly with a full stack
   trace naming the missing path (was: silent exit 1), and `node bin/agentic-hq.cjs list` still
   runs normally (exit 0).
2. **Implementation summary file list completed** — `03-implementation-summary.md` gained a
   short paragraph under `## Files Changed/Added/Deleted` naming
   `commands/add-feature/03-implementer.md` and the matching
   `03-implementer-help-doc.md` as in-commit meta-work outside the AHQ-208 plan.

**Regression re-run of the Implementer's recorded tests (2026-08-20, after the fixes):**
`pnpm validate` green (typecheck, lint, format, 190/190 unit tests); runner integration 6/6;
bin-wrapper integration 2/2 (the suite directly covering the changed wrapper); build-determinism
1/1. The recorded real-Claude e2e suites (tarball, cross-workspace, fixture) were **not**
re-run: they carry real Claude-run cost, the wrapper change only touches the error branch
(both branches manually proven above), and the second fix is a documentation-only edit — no
executable path they exercise changed.

## Final Human Confirmation

Approved by the human on 2026-08-20 ("approved") at the second gate, after reviewing the two
applied recommended fixes (the dev-wrapper silent-exit fix and the implementation-summary file-list
completion), their manual verification, and the green regression re-run recorded under
`## Selected Fixes Applied`. No further changes were requested and no conditions were attached;
the real-Claude e2e suites were knowingly left un-re-run as presented. The three "do nothing /
defer" rows stand unactioned in the `## Potential Fixes` table by the human's selection.

## Customization Next Step

If this workflow was useful but too minimal, customize it for your own process. Recommended next step: run `agentic-hq create-workflow -- --using=add-feature` to make a copy and add your own stages, rules, and approval gates. To see a worked example of a very detailed personal workflow, inspect or try out `agentic-hq add-feature-detailed-example`.

# AHQ-196 — Review Summary

## Review Summary

All five acceptance criteria are met with evidence: the tarball e2e proves `list` and a full
math-workflow run (`Output number: 5`) from an npm install of the packed tarball with nothing
written inside the installed package, and the resolution mechanism + build determinism are proven
and recorded for the later sub-tasks. I independently re-ran the fast checks (build-determinism
integration test: 1/1 in 3.5s; `pnpm validate`: all four checks green, 146 unit tests) and
cross-checked the summary's file list against the three AHQ-196 WIP commits — it is complete and
accurate, including the parent-brief addenda. The remaining risks are documented interims owned by
later sub-tasks (dev-path dist coupling → AHQ-197; tarball hygiene/privacy leak → AHQ-198); the
one e2e flake (a `div-five` step hang on the first run, never reproduced) is recorded in the
implementation summary's concerns. Findings worth considering are in Potential Fixes below.

## Checks Passed

| Area | Evidence | Result |
| --- | --- | --- |
| AC1: `agentic-hq list` works from a temp-prefix install of the tarball | `tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts` test 2 runs the installed bin from a clean temp workspace and asserts the title line + the math workflow's list entry; passed in both full runs (3/3 in 141s and 117s) | Pass |
| AC2: full math-workflow run from a clean directory prints the correct output — no pnpm, no tsx, no runtime installs | Same e2e, test 3: installed bin `math -- --input-number=11` from a clean workspace asserts `Output number: 5`; the install contains only npm-installed registry deps (commander, node-pty, fast-glob), and the runner launches compiled JS under plain node | Pass |
| AC3: nothing written inside the installed package at runtime | Same e2e, test 3: recursive file listing of the installed package snapshotted before the run and asserted equal after it (see Potential Fixes row 3 for a strengthening nuance) | Pass |
| AC4: resolution mechanism + determinism proven and recorded | Mechanism: artifact-shape e2e asserts the tarball manifest's prebuilt `bin`/`exports` (no `.ts` targets), `dist/package.json` (name/type/exports), no shadowing nested manifest, and executable shipped scripts — recorded as Finding 1 in `03-implementation-summary.md`. Determinism: `tests/integration/build/build-determinism.integration.test.ts` builds twice and compares SHA-256 maps — recorded as Finding 2. Independently re-run in this review: 1/1 passed (3.5s) | Pass |
| AC5: build script, runner and SKILL.md change committed on the feature branch | Commits `d6faf84` and `2aea855` on `feature/ahq-195-publish-to-npm`; `git log --name-only --grep=AHQ-196` matches the summary's `## Files Changed/Added/Deleted` exactly (8 code files, none deleted); working tree clean apart from this review's human-requested command-file edit | Pass |
| Test evidence | Implementer's record: tarball e2e 3/3 twice (141s, 117s), cross-workspace dev-path e2e 1/1 (101s), manual dev-CLI math run → `Output number: 5`, `pnpm validate` green — each approval-gate assertion written RED-first. Independently re-verified in this review: determinism test 1/1 (3.5s) and `pnpm validate` green (typecheck, lint, format, 146 unit tests / 32 files) | Pass |
| Regression coverage | Areas inspected: math-workflow `SKILL.md` is the only skill changed (confirmed via git diff — all other workflows untouched on the symlink+tsx path); `package.json` postinstall addition is a no-op chmod in the dev repo; the dev bin wrapper is untouched. The dev path — the exact class that broke at the approval gate — is covered by the cross-workspace e2e (dev binary exercises the same resolution path) plus the mandated manual CLI run; the installed path by the tarball e2e; the unit suite (146) is unaffected and green | Good enough |

## Potential Fixes

| Area | Evidence | Result / Risk | Recommendation | Fix? |
| --- | --- | --- | --- | --- |
| Highest-risk changed area: math-workflow dev runs now depend on a manually-built `dist/` | `SKILL.md` returns a runner command pointing at `dist/…/math-workflow-demo-cli.js`; nothing checks `dist/` exists or is fresh — a **stale** `dist/` silently runs outdated workflow code, and a **missing** one fails with a node module-not-found error that never mentions `pnpm build` | Medium — dev-only (the installed artifact always matches its own build); silent-stale-code is the nasty half | Defer — AHQ-197's `build-first` mode owns exactly this seam; the interim was explicitly accepted in brief Q2 and the plan |  |
| Tarball content leak (privacy) | The `files` whitelist ships `.agentic-hq` wholesale: the Implementer's tarball inspection found 99 dev-machine io-files under `.agentic-hq/temp/` — I count **117 now** (it grows with every workflow run, including this one); `steve-test-plugin` (15 files) also ships | Medium latent, contained today — `private: true` blocks any registry publish and tarballs stay in the gitignored scratch tree | Defer — AHQ-198 owns hygiene and the finding is recorded there and in the parent-brief addenda; it must land before un-private |  |
| Improvement suggestion 1 (RECOMMENDED): strengthen the read-only assertion to content hashes | The e2e's read-only check compares sorted file **paths** only — an in-place modification of a shipped file during the run would pass undetected; `hashTree()` in the determinism integration test already does hash-based comparison and could be shared | Worth doing — small change that upgrades AC3's evidence from "no files added/removed" to "no bytes changed" | Do now (small) or defer to AHQ-197 when the tests get touched anyway | Yes |
| Improvement suggestion 2 (RECOMMENDED): npm convenience scripts for the two new tests | Repo convention is one npm script per e2e/integration test (see the `test:e2e:*` / `test:integration:*` blocks in `package.json`); the two new tests lack them (the Implementer noted this) | Worth doing — trivial, keeps the convention discoverable | Do now (trivial) | Yes |
| Improvement suggestion 3 (NOT RECOMMENDED): a "run `pnpm build` first" guard in `run-workflow.cjs` or the bin wrapper | Would soften the dev-path failure described in row 1 by detecting a missing `dist/` and printing the fix | Not worth it — AHQ-197 replaces this exact seam with `build-mode`; the guard would be throwaway code within one sub-task, and the failure is loud (just not self-explanatory) | Do nothing |  |

## Selected Fixes Applied

The two RECOMMENDED improvement rows (marked `Yes` above per the human's chat instruction):

1. **Hash-based read-only assertion** — new shared helper
   `tests/helpers/file-tree-helper-functions.ts` (exports `hashTree`);
   `tests/integration/build/build-determinism.integration.test.ts` now imports it (local copy
   removed); the tarball e2e's installed-package snapshot and assertion now compare
   relative-path → SHA-256 maps instead of path listings, so an in-place modification of any
   shipped file would now fail the test.
2. **npm convenience scripts** — `package.json` gains `test:integration:build-determinism` and
   `test:e2e:prebuilt-tarball-math-workflow` (no `pnpm build` prefix needed — the e2e's
   `beforeAll` builds), matching the one-script-per-test repo convention.

**Regression guard — the Implementer's recorded test list re-run after the fixes, all green:**

- `pnpm validate` — typecheck, lint, format, 146 unit tests / 32 files: green.
- `pnpm test:integration:build-determinism` — 1/1 (3.2s), via the new script.
- `pnpm test:e2e:prebuilt-tarball-math-workflow` — 3/3 (120s), via the new script, including the
  strengthened hash assertion.
- `pnpm test:e2e:cross-workspace-demo-math-workflow` — 1/1 (101s).
- Manual dev-binary run from a clean temp workspace: `agentic-hq math -- --input-number=11` →
  `Output number: 5`.

## Final Human Confirmation

The human's decision (2026-08-08, given directly in chat rather than by editing the `Fix?`
column): *"Please just do the recommended fixes (3 and 4)"* — i.e. fix the two RECOMMENDED
improvement rows now; rows 1, 2 and 5 stay unmarked and stand in the table (deferred risks are
owned by AHQ-197/AHQ-198 as recorded). During this review session the human also directed, in
chat: the Reviewer command gained a git-history/uncommitted-changes cross-check step; the
architecture decision was recorded in the AHQ-195 parent brief (staged release tree into
AHQ-197; nested packages deferred to the human-created AHQ-203, whose brief was corrected after
the human caught an overstated claim); and an AHQ-201 addendum records the
user-workflows-against-pure-npm-install acceptance scenario.

## Customization Next Step

If this workflow was useful but too minimal, customize it for your own process. Recommended next step: run `agentic-hq create-workflow -- --using=add-feature` to make a copy and add your own stages, rules, and approval gates. To see a worked example of a very detailed personal workflow, inspect or try out `agentic-hq add-feature-detailed-example`.

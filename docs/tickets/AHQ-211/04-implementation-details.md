# AHQ-211 — Implementation Details

Companion log to [03-implementation-plan.md](03-implementation-plan.md): one section per phase, written at the
end of that phase, before its commit. Records what was actually done, files touched, decisions/deviations, and
test evidence.

## Phase 1 — Unblock install & pnpm scripts (2026-08-26)

**Baseline (red):** `pnpm install` failed on Windows with exit 1 — cmd cannot run the `chmod +x … || true`
postinstall shell string ("'true' is not recognized…"). Worse than expected: pnpm 11's pre-run dependency check
re-runs postinstall before *every* `pnpm <script>`, so the broken string blocked all pnpm scripts on Windows,
not just installs (tests were run via `node node_modules/vitest/vitest.mjs …` until the fix landed).

**What was done (TDD, red-green per script):**

1. `scripts/postinstall.cjs` (new) — node-pty spawn-helper exec-bit repair as a Node script. darwin-only
   (explicit no-op elsewhere); repairs both node-pty layouts (nested `node_modules/node-pty` and hoisted
   sibling `../node-pty`) relative to the package root (`__dirname/..` — no longer cwd-dependent); swallows
   ENOENT only, any other fs error propagates (the old `2>/dev/null || true` swallowed everything). Exports
   `repairSpawnHelperExecBits({ platform, packageDir })` for tests; CLI entry under `require.main`.
2. `scripts/prepack-guard.cjs` (new) — both prepack guards as one script, mode from argv:
   `root` = always refuse (wrong-tree guard, unchanged message); `release` = refuse `win32` first (NTFS has no
   exec bits — new in AHQ-211, enforcing "never publish from Windows"), then refuse non-pnpm packers
   (unchanged executableFiles message). Missing/unknown mode throws. Exports `evaluatePrepackGuard` (pure);
   CLI entry prints to stderr + exit 1.
3. Root `package.json` — `postinstall` → `node scripts/postinstall.cjs`; `prepack` →
   `node scripts/prepack-guard.cjs root`; the two `//`-comment entries shortened to point at the scripts.
4. `scripts/build-release.cjs` — generated release manifest's `postinstall`/`prepack` entries now invoke the
   same two scripts (`prepack-guard.cjs release` mode); both scripts added to the staged `release/scripts/`
   copy list so the entries resolve in the shipped package. This is what fixes the npm/npx install routes at
   the next publish.

**Files touched:** `scripts/postinstall.cjs` (new), `scripts/prepack-guard.cjs` (new),
`tests/unit/scripts/postinstall.unit.test.ts` (new, 6 tests), `tests/unit/scripts/prepack-guard.unit.test.ts`
(new, 8 tests), `package.json`, `scripts/build-release.cjs`.

**Decisions / deviations:**

- The unit tests inject `platform`/`packageDir` as parameters instead of mocking `process.platform` — same
  coverage, no global mutation; the CLI wiring (real `process.platform`) is covered by subprocess tests.
- chmod-mode assertions (`0o755`) are guarded with `process.platform !== 'win32'` — NTFS has no POSIX mode
  bits; the assertion runs for real in Linux CI.
- Guard message substrings are kept byte-compatible with what
  `tests/integration/build/publish-guards.integration.test.ts` asserts; that test still can't run on Windows
  (npm/pnpm `.cmd` spawns — Phase 3 fixes), so the root guard was verified manually instead (below).
- Refactor pass (Steve's review): both scripts rewritten with self-documenting helpers — e.g.
  `platform !== 'darwin'` → `!isMac(platform)`, `error.code === 'ENOENT'` → `isMissingPathError(error)`,
  guard branches → `isRootMode`/`isWindows`/`isPnpmPacker` + `refuse`/`allow`, magic `0o755` →
  `EXECUTABLE_FILE_MODE`. Exported names unchanged; 14/14 tests re-run green after.
- Refactor list: `tmpdirTest` fixture lives under
  `tests/unit/workflow-discovery/test-fixtures/` but is generic (now imported from `tests/unit/scripts/`) —
  candidate to move to `tests/unit/test-fixtures/` some phase-end.

**Test evidence (per changed file, on this Windows machine):**

- `scripts/postinstall.cjs` + its test: `node node_modules/vitest/vitest.mjs run --config vitest.unit.config.ts
  tests/unit/scripts/postinstall.unit.test.ts` — red (module missing) then 6/6 green; also executed for real by
  `pnpm install` (below).
- `scripts/prepack-guard.cjs` + its test: same command pattern — red then 8/8 green; also executed for real by
  `npm pack` (below).
- `package.json` wiring: **`pnpm install` → exit 0** ("postinstall: Done") — the Phase 1 headline;
  **`pnpm typecheck` → exit 0**. Both exit-gate checks green on Windows.
- Root prepack guard end-to-end: `npm pack --pack-destination <temp>` at the repo root → prepack runs
  `node scripts/prepack-guard.cjs root`, prints the exact refusal message, npm aborts with exit 1, no tarball.
- `scripts/build-release.cjs`: **not executed on Windows** — it spawns `node_modules/.bin/tsc`, which fails
  until Phase 3.3; the Phase 1 edit is data-only (staging list + manifest script strings). Verification lands
  with Phase 3's build run + release-tree checkpoint (or earlier if Steve runs
  `pnpm build && pnpm test:integration:publish-guards` on the Mac).
- Full unit suite `pnpm test`: 199 passed / 5 failed — the failures are exactly the 5 pre-existing Windows
  failures the plan assigns to Phase 2 (2× PTY `tsx` spawn, 3× `/tmp` assumptions); none touch Phase 1 files.
  Suite grew 190 → 204 tests (the 14 new ones).
- `pnpm lint:check` → exit 0. `pnpm format:check` fails repo-wide (165 files) on this machine — pre-existing
  CRLF-checkout drift, the exact thing Phase 2's `.gitattributes` + working-tree refresh fixes; the four
  new/edited Phase 1 files pass a targeted `npx prettier --check`.

## Phase 2 — Green `pnpm validate` on Windows (2026-08-26)

**Baseline (red):** 199/204 unit tests on Windows — the 5 failures were 2× PTY
`Cannot create process, error code: 2` (bare `tsx` spawn) and 3× hardcoded-`/tmp` assumptions. The dev
bin wrapper failed on Windows spawning `node_modules/.bin/tsc` (bin-wrapper integration test exit 1),
and `pnpm format:check` failed on 165 files (CRLF checkout drift under `core.autocrlf=true`).

**What was done (TDD — each red confirmed for the right reason before its fix):**

1. `.gitattributes` (new) — `* text=auto eol=lf`, plus explicit `eol=lf` pins for every
   exec-bit-carrying script (`*.sh`, `bin/agentic-hq.cjs`,
   `src/scripts/git-scripts/branching/03-squash-merge-branch/perform-squash-merge-on-branch.ts` — the
   complete 100755 list from `git ls-files -s`). The plan's `git add --renormalize .` check ran once:
   confirmed no-op (`git status --porcelain` empty bar the untracked `.gitattributes`; `git ls-files
   --eol` had already shown 0 `i/crlf` entries — the index was 100% LF).
2. Portable temp in unit tests:
   - `tests/e2e/helpers/cli-test-helper-functions.ts` — `LOG_FILE_DIRECTORY` `'/tmp'` → `os.tmpdir()`.
   - `tests/unit/e2e-helpers/run-cli-and-log-output.unit.test.ts` — log-path expectation from
     `os.tmpdir()`; both commands rebuilt as `"<process.execPath>" -e "…"` strings (nothing
     shell-specific — identical meaning under cmd.exe and /bin/sh); the cwd test passes
     `fs.realpathSync(os.tmpdir())` (macOS tmpdir is a symlink) and asserts the child's reported cwd.
   - `tests/unit/io/marshalling/json-file-io-marshaller-session.unit.test.ts` —
     `'/tmp/test-io-marshaller'` → module-level `mkdtempSync(path.join(os.tmpdir(), …))` (the
     tmpdir-fixture pattern) with `afterAll` cleanup.
3. Unit PTY fixtures (`claude-code-tool-with-injected-io-marshaller.unit.test.ts`,
   `fake-claude-executes-command-using-file-io.unit.test.ts`) — executable `'tsx'` →
   `process.execPath` with `node_modules/tsx/dist/cli.mjs` prepended to the extra args (node-pty does
   no PATH/PATHEXT shim resolution on Windows — CreateProcess error 2). This was the first real ConPTY
   round-trip on Windows: PTY spawn → fake CLI → file I/O → reversed string read back.
4. `bin/agentic-hq.cjs` — tsc spawn `node_modules/.bin/tsc` → `process.execPath` +
   `node_modules/typescript/bin/tsc` (D4); catch comment updated (a missing typescript install now
   surfaces as node's "Cannot find module" with status 1 and propagates like a compile failure).

**Files touched:** `.gitattributes` (new), `tests/e2e/helpers/cli-test-helper-functions.ts`,
`tests/unit/e2e-helpers/run-cli-and-log-output.unit.test.ts`,
`tests/unit/io/marshalling/json-file-io-marshaller-session.unit.test.ts`,
`tests/unit/claude-code-tool/claude-code-tool-with-injected-io-marshaller.unit.test.ts`,
`tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts`,
`bin/agentic-hq.cjs`.

**Decisions / deviations:**

- **Plan deviation (flagged to Steve in-session):** the plan wrote `.gitattributes` line 1 as
  `* text=auto`; implemented as `* text=auto eol=lf`. Under `core.autocrlf=true`, `text=auto` alone
  still checks text files out as CRLF, so even after the working-tree refresh `pnpm format:check`
  (prettier `endOfLine: "lf"`) would keep failing and the phase exit gate would be unreachable.
  `eol=lf` forces LF working trees on every machine regardless of local autocrlf. Verified safe:
  index already 100% LF; no tracked `.bat`/`.cmd`/`.ps1` that would want CRLF.
- The five e2e files hardcoding `/tmp/e2e-….log` banner constants were left alone: every use is
  cosmetic (timeout-banner text, no assertions or file I/O), e2e can't run on this machine, and e2e
  helper portability is Phase 6 — the constants get aligned with the helper there.
- In-place-edited files kept their CRLF checkout endings, so they were converted to LF (node
  one-liner) + prettier-formatted, making the targeted format check meaningful pre-refresh. Git
  stores LF either way under the new attributes.
- Suite count: the plan's exit criterion says 190/190 — written before Phase 1 added 14 tests; the
  actual full suite is 204.

**Test evidence (per changed file, on this Windows machine):**

- Each fix red-then-green via `pnpm exec vitest run --config vitest.unit.config.ts <file>`: run-cli
  1-failed → 2/2; marshaller 2-failed (`:59`, `:133`) → 9/9; both PTY tests failed (error code 2) →
  2/2. All four files re-run green after the EOL/prettier pass (13/13).
- `bin/agentic-hq.cjs`: `pnpm test:integration:bin-wrapper` red (exit 1) → green (1/1, including a
  cold Framework Build into dist/); re-run green after prettier reformat. `node bin/agentic-hq.cjs
  list` renders the full workflow listing — the `agentic-hq-dev list` exit-gate check.
- Gates: `pnpm typecheck` ✓, `pnpm lint:check` ✓, `pnpm test` **204/204** ✓ — the first fully green
  unit suite on Windows. `pnpm format:check`: all six touched code files pass a targeted check;
  repo-wide 159 files remain CRLF-flagged, expected until the 🧑‍💻 working-tree refresh straight after
  this phase's commit — that refresh is what completes `pnpm validate` fully green on Windows.
- `.gitattributes` itself was exercised by the renormalize no-op check above; its checkout effect
  lands at the refresh.

## Phase 3 — Build pipeline & scripts on Windows (2026-08-26)

**Baseline (red):** `pnpm build` failed on Windows at the first spawn (`build-release.cjs` →
`node_modules/.bin/tsc` ENOENT), so the whole build pipeline was unrunnable; fixing each spawn revealed the
next red in pipeline order (pnpm ENOENT with the *wrong* "pnpm not found — see pnpm.io/installation"
diagnosis, then symlink EPERM — dir symlinks confirmed EPERM on this machine, no Developer Mode — then the
workflow-dir `.bin/tsc` ENOENT). `test:integration:publish-guards` failed 3/3 (npm/pnpm spawns never started:
output `undefined\nundefined`); `test:integration:build-determinism` was blocked behind the build. Two silent
wrong-content bugs confirmed live in the first successful Windows-built tree: both `EXCLUDED_DRAFT_COMMAND_DIRS`
shipped, and `publishConfig.executableFiles` came out backslashed.

**What was done (TDD — each red confirmed for the right reason before its fix):**

1. `build-workflow.cjs` `installDependencies` per D4: when `npm_execpath` is set AND is pnpm's JS entry
   (basename contains `pnpm` — covers corepack's `pnpm.mjs` and npm-global `pnpm.cjs`), spawn
   `node <npm_execpath> install` (no shell, no shim, and the same pnpm version that launched the build);
   otherwise `pnpm` off PATH with `shell: true` on win32 only. Misleading-diagnosis fix: "pnpm missing" is
   now only reported when it is TRUE — ENOENT on the shell-less POSIX branch, cmd.exe's command-not-found
   status 9009 on the Windows shell branch; everything else propagates untouched.
2. `build-workflow.cjs` `linkFramework` per D3: `symlinkSync(..., 'junction')` on win32 (`'dir'` elsewhere);
   freshness check replaced with realpath equality (`linkResolvesTo`) — junctions readlink as `\\?\C:\...`
   NT paths that never byte-match, and a dangling link reports stale so it gets recreated. New
   `tests/integration/build/framework-link.integration.test.ts` (5 tests, red as EPERM first): fresh link
   loads `agentic-hq/tools/claude-code` through a real junction, correct link left alone (inode+birthtime),
   wrong-target/dangling links repaired, squatting real dir replaced. The two readlink-equality assertions
   (runner integration test :238-area, new-workspace e2e :157-area) became realpath comparisons (both sides
   wrapped, so macOS tmpdir symlinks stay safe).
3. tsc spawns per D4 in `build-workflow.cjs` (workflow's own `node_modules/typescript/bin/tsc`) and
   `build-release.cjs` (repo's).
4. `build-release.cjs` portability: new `toPosixRelativePath` + the staging filter extracted as exported
   `shouldStagePluginPath` — draft-dir and stripped-file comparisons now POSIX-normalized (the silent
   wrong-content fix); `listStagedShellScripts(stagedReleaseDir)` parameterized and emitting forward
   slashes. New `tests/unit/scripts/build-release-staging.unit.test.ts` (5 tests; the draft-dir and
   forward-slash cases were the Windows reds). Exec-bit note: there was no chmod logic to keep
   platform-gated — `publishConfig.executableFiles` is the whole mechanism, unchanged.
5. Demo scripts: `"$PWD"` dropped — the four `demo:plugin-direct:*` scripts now pass
   `--ahq-package-root=.` and a relative `--workflow-dir`, and `run-workflow.cjs` resolves the two
   directory options via `path.resolve` after validation (new runner integration test proves the workflow
   program receives absolute paths).
6. `publish-guards.integration.test.ts` spawns per D4's shell branch: npm/pnpm through a shell on win32 as
   one quoted command line (also what the "plain maintainer terminal" the helper simulates does; avoids
   DEP0190). Platform split: the npm-wrong-packer test and pnpm positive control are POSIX-only
   (`it.runIf`) because on Windows the release guard refuses the PLATFORM before ever checking the packer;
   a new win32-only test asserts both npm and pnpm are refused with the exec-bit message.
7. Unplanned fix surfaced by the build-determinism gate: `tests/helpers/file-tree-helper-functions.ts`
   `hashTree` keys were native-separator (`dist\src\cli\main.js` on Windows) — now POSIX, making path
   expectations single-sourced and a Windows-built hash map directly comparable with a Mac/Linux one.

**Files touched:** `scripts/build-workflow.cjs`, `scripts/build-release.cjs`, `scripts/run-workflow.cjs`,
`package.json` (4 demo scripts + comment), `tests/integration/build/framework-link.integration.test.ts`
(new), `tests/unit/scripts/build-release-staging.unit.test.ts` (new),
`tests/integration/build/publish-guards.integration.test.ts`,
`tests/integration/runner/run-workflow-validates-and-executes.integration.test.ts`,
`tests/helpers/file-tree-helper-functions.ts`,
`tests/e2e/demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts`,
`docs/tickets/AHQ-211/phase-3-checkpoint-windows-release-hashes.txt` (new checkpoint artifact),
`docs/dev/how-agentic-hq-works.md` (framework-link wording: "symlink" → platform-aware link/junction — the
one doc this phase made factually wrong; the full dev-docs accuracy pass is a named Phase 6 item).

**Decisions / deviations:**

- **Demo-script mechanism (minor deviation, flagged):** the plan offered cwd-defaulting in the runner or a
  new `run-demo.cjs`; implemented a third, smaller option — all four runner options stay REQUIRED (the
  fail-fast contract and its loud-error tests untouched), but the two directory options may be relative and
  are `path.resolve`d against the working directory.
- **D4 pnpm guard tightened:** the plan said use `npm_execpath` "when set"; implemented as "when set and
  it is pnpm's" — under npm/yarn launches it would be npm's/yarn's JS entry, and this install must be pnpm
  (the workflow `.npmrc` speaks pnpm dialect).
- Both build scripts refactored to the Phase-1 script pattern (exported helpers + `require.main` CLI
  entry) so the new tests exercise the REAL functions; spawned callers unaffected.
- The e2e file's assertion change could not execute on Windows (e2e spawns real Claude) — verified via
  typecheck/lint/format only; it runs at the Phase 6 e2e gates. Likewise the demo scripts themselves spawn
  Claude — the mechanism is covered by the runner test; end-to-end is Phase 4's 🧑‍💻 gate.
- Refactor list: `isWindows()`/command-not-found constants now exist in two shipped standalone scripts
  (acceptable — they ship as self-contained files; a shared module would have to be staged too);
  `tmpdirTest` is now imported from `tests/integration/` as well — strengthens the Phase 1 note to move it
  out of `tests/unit/workflow-discovery/`.
- **External review of the junction design (Perplexity, 2026-08-27 — see
  `supporting-files/03-perplexity-question-and-answer-about-symbolic-links.md`): verdict KEEP.** Junction
  on win32 is the ecosystem standard (pnpm's `symlink-dir` defaults to it; npm/Yarn/Nx likewise); our
  lstat→unlink-link/rm-dir deletion idiom and realpath freshness check match the recommended pattern, and
  our dangling-link handling exceeds it. `symlink-dir`'s atomic replace and parent-mkdir extras are
  deliberately not needed here (sequential build step; pnpm install guarantees the parent — fail-fast).
  Empirical safety proof: the runner test's cleanup `rmSync`s a tree containing a junction to the REAL
  repo root without traversing it. **Phase 6 docs follow-ups from the review:** junctions need a local
  NTFS volume (fail on UNC/network paths, FAT32/exFAT), and OneDrive/Dropbox-synced folders can throw
  transient EPERM/EBUSY around junctions — both go in the troubleshooting docs.

**Test evidence (per changed file, on this Windows machine):**

- `build-workflow.cjs` + `build-release.cjs`: `pnpm build` red at each pipeline stage in turn, then
  **completes on Windows** (the phase headline); executed again ×2 by
  `pnpm test:integration:build-determinism` → **byte-identical trees, 1/1 green** (after the hashTree fix
  below); staged tree inspected — draft dirs absent, `executableFiles` forward-slashed.
- `linkFramework`: `pnpm exec vitest run --config vitest.integration.config.ts
  tests/integration/build/framework-link.integration.test.ts` — 5 red (EPERM) → 5/5 green.
- `build-release` staging helpers: `pnpm exec vitest run --config vitest.unit.config.ts
  tests/unit/scripts/build-release-staging.unit.test.ts` — 2 red (draft dir staged; backslashed list) →
  5/5 green.
- `run-workflow.cjs` + its test: runner integration file — new relative-path test red
  (`--ahq-package-root=.` forwarded raw) → **7/7 green** including the build-first happy path (real pnpm
  install + junction + tsc on Windows).
- `publish-guards.integration.test.ts`: `pnpm test:integration:publish-guards` — 3/3 red (spawns never
  started) → green on Windows (root-guard + win32 both-packers-refused pass; 2 POSIX-only tests skip, they
  run in Linux CI).
- `file-tree-helper-functions.ts`: build-determinism red (expected `dist/src/cli/main.js` missing from 340
  backslashed keys) → green after POSIX-normalizing; helper re-executed by the green determinism run.
- Gates: `pnpm build` ✓; `pnpm validate` fully green — typecheck ✓, lint ✓, format ✓ ("All matched files
  use Prettier code style!"), **209/209** unit tests (204 + the 5 new staging tests). Linux CI still
  pending a draft PR (ci.yml triggers only on main push/PR — parked with Steve since Phase 1).
- Checkpoint artifact: `phase-3-checkpoint-windows-release-hashes.txt` — SHA-256 content hashes of the
  Windows-built `release/`, sorted, POSIX paths, for the 🧑‍💻 cross-OS diff (content hashes ignore exec
  bits, so "match modulo exec bits" falls out naturally).

**🧑‍💻 Checkpoint result (2026-08-27, run by Claude on Steve's Mac as the POSIX side — see
`temp/AHQ-211/temp-mac-instructions.md` for its full report):** 339/340 files **byte-identical**, zero
content mismatches — no CRLF drift, no tsc drift, no source-map path leaks, no manifest-ordering
differences. The single diff was a Windows-only file: an untracked self-termination debug log
(`node-kill-result-v2.log`, from the 2026-08-24 D2 validation spikes) sitting in the skill's `scripts/`
dir, swept into staging because `build-release.cjs` cpSyncs plugins from the working tree and `*.log` is
gitignored (so invisible to git but present on disk). Resolved: stray log deleted, rebuilt, checkpoint
hash file regenerated — now 339 lines, matching the Mac exactly. The general hazard (staging sweeps
untracked working-tree files, on every OS) is recorded as a Phase 7 follow-up in the plan. Side
observation while investigating: `git status --ignored` (not plain `git status`) recurses into ignored
node_modules and follows the framework junction into recursive-path warnings — noise, not corruption.

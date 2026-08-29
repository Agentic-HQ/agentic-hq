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
hash file regenerated — now 339 lines, matching the Mac exactly. Root cause closed at source (Steve's
call, no staging-filter follow-up): the log came from a one-off D2 TEST copy of the self-termination
script, and the plan's Phase 5 item 2 now hard-requires the production script to write no files. Side
observation while investigating: `git status --ignored` (not plain `git status`) recurses into ignored
node_modules and follows the framework junction into recursive-path warnings — noise, not corruption.

---

## Phase 4 — Workflow runtime native on Windows (part 1: D1 + D5, one atomic commit)

**Scope of this part:** plan item 1 only — the AHQ-210 skill-hop contract change (D1) with the D5 input
shrink/quoting riding along, both sides (engine + every SKILL.md) together in one commit. Items 2–4 (claude
resolver, PTY tuning, workspace-root normalization) follow as part 2.

**Baseline:** the 7 files touched by the red phase all green first (28/28 across those suites) —
confirming the "run before changing" rule; full unit suite was 216 after, 209 before (+7 net new tests).

**What was done (TDD — 40 tests red first, each for the intended reason: missing methods, changed
constructors, bash removal):**

1. **New launch handshake type + session reads.** `src/interfaces/skill-output.ts` (new): `SkillOutput
   { skillBaseDir }` with the plan's evolution rule in its header. `IOMarshallerSession.readOutput()` →
   `readCommandOutput()`, plus `readSkillOutput(): SkillOutput`;
   `JsonFileIOMarshallerSession` implements both over the one `command-output.json` transport (private
   `readOutputFile()`), fail-fast when `skill-base-dir` is missing/empty/not a string (the "a command-step
   output landed where a handshake was expected" case is an explicit test).
2. **Two typed exits on the tool.** `Tool` gains `executeSkillLaunch(skillCommand): Promise<SkillOutput>`;
   `MarshalledCLITool.execute()` keeps command-step behaviour, `executeSkillLaunch()` reads the handshake,
   both share the private `runSession()` exactly as the plan sketch specified. `UNUSED_INPUT_STRING` moved
   here from the workflow builder (the launch skill takes no input).
3. **Engine builds the launch argv natively.** `ClaudeWorkflowCommandBuilder` now: mints the tool per
   build-mode (AHQ-208 unchanged) → `executeSkillLaunch(skillCommand)` → sanity-checks the reported dir
   (exists + contains `ts-workflow/`, loud error naming the skill) → derives `skill-id` via
   `path.basename` → argv `[<repo>/scripts/run-workflow.cjs, --ahq-package-root=…, --build-mode=…,
   --workflow-dir=…, --workflow-js=dist/<skill-id>-cli.js, ...passthroughArgs]` spawned as
   `process.execPath` + args. `shellEscape` deleted; passthrough args ride raw (argv arrays need no
   quoting). Builder now takes the `AhqPackageRoot` (wired in `CompositionRoot`).
4. **`DefaultWorkflowCommand`: `bash -c` deleted** — constructor is `(executable, args[], wrapper, cwd)`,
   spawned directly on the PTY. No shell of any kind remains in the TS launch chain (grep-verified).
5. **D5 in `ClaudeCommandBuilder`:** the positional arg is now `` `${aiToolCommand} "${marshallingId}"` ``
   — the io-directory is the ONLY value crossing the hop, double-quoted (spaces test included). The
   AHQ-197 relay (`… ${buildMode} ${pkgRoot}`) is deleted, and with it the builder's whole
   `ahqRuntimeParams` constructor param (TS-checked ripple through `DefaultClaudeCodeTool` and 4 test
   files). The unit fake-claude fixture now parses the quoted io-dir (everything after the first space,
   quotes stripped) like real Claude would.
6. **SKILL.md boilerplate rewritten** to the plan's template: set `skill-base-dir` + `$0`, write
   `{"skill-base-dir": "{skill-base-dir}"}`, rewritten INFO-FOR-YOU-ONLY section (plan's verbatim text),
   self-terminate. Distributed **byte-identically to all 8 copies** (7 live workflow skills + the e2e
   fixture copy) — SHA-256 verified identical. steve-test-plugin skills are not workflow skills (no
   ts-workflow contract) — untouched.
7. **Scaffolder + docs to the new contract:** create-workflow `02-confirm-spec-approved-and-build.md`
   (4 spots) and `03-run-checks-on-workflow.md` (check 4 is now "byte-identical to the bundled template" +
   the filename-convention check); `docs/dev/how-agentic-hq-works.md` (mermaid Resolve box, plugin-layout
   tree line, build-mode paragraph, "The shared workflow runner" section, worked-example steps 2–3, math
   per-step relay note); `docs/glossary.md` (Skill, AHQ package root, build-mode, shared workflow runner
   entries).
8. **`DefaultClaudeCodeToolFactory` test re-anchored:** the AHQ-208 per-workflow mode is no longer
   observable via builder-constructor runtime params (relay deleted), so the test now asserts it via the
   AHQ-package workspace the factory wires in (`getBuildMode()`/`getRoot()`).

**Decisions / deviations (flagged):**

- **D5 narrowed on evidence — the plan's "quote `Read(${dir})`/`--plugin-dir=${dir}`" is NOT implemented.**
  A claude-code-guide docs check found the CLI reference SILENT on quote-stripping inside those values,
  and our PTY spawn passes argv with no shell — embedded literal quotes would reach Claude's permission
  matcher / plugin loader verbatim and plausibly break BOTH on every platform (an allowlist that never
  matches = permission prompts mid-workflow). The io-dir quoting IS implemented (its consumer is the AI
  prompt parser, which handles quotes naturally — and it's the value that actually gets re-split today).
  Paths-with-spaces in `--allowedTools`/`--plugin-dir` remain a pre-existing, unchanged limitation; the
  docs-blessed space-safe form (one rule per argv element) has a positional-swallowing risk that needs a
  real-Claude probe → proposed as a Phase 7 follow-up ticket.
- ToolFactory.createTool(buildMode) kept per plan, but noted for the refactor list: with the relay gone,
  the mode's only remaining effect inside a minted tool is the AHQ-package workspace's `getBuildMode()`
  (which nothing in the command path reads). Candidate for later simplification, not touched now.
- `agentic-hq-program` / `workflow-registry` untouched — `builder.build()` signature is unchanged, so the
  CLI dispatch layer never noticed the contract change (the point of the seam).

**Test evidence (per changed file, on this Windows machine):**

- Red: `pnpm vitest run --config vitest.unit.config.ts` over the 9 touched suites — **40 failed**, all for
  the intended reasons (`readOutput is not a function`, `ahqRuntimeParams.getBuildMode is not a function`,
  bash assertions, missing `executeSkillLaunch`). (First red run used no `--config`; that run's
  `workflow-registry-impl` "`it` is not defined" was my harness error — the unit config has
  `globals: true` — re-run correctly before concluding anything.)
- Green: `pnpm validate` fully green — typecheck ✓, lint ✓, format ✓ (3 in-scope files prettier-fixed
  after a scope check listed only them), **216/216** unit tests. Every changed src file is executed by the
  named suites above; the session/tool/builder/command files additionally run through the two PTY-spawning
  fake-claude unit tests (real quoted-io-dir round trip through a real PTY + fixture).
- Integration (no Claude spawns): `vitest run --config vitest.integration.config.ts
  tests/integration/build/ tests/integration/runner/ tests/integration/bin/` — **17 passed, 2 POSIX-only
  skips**, including the runner's real build-first path (pnpm install + junction + tsc).
- Not executable here: the 8 SKILL.md copies and the .md/doc files are prose consumed by real Claude —
  their executable check is Phase 4's 🧑‍💻 string-reversal demo gate on both OSes.

---

## Phase 4 — Workflow runtime native on Windows (part 2: claude resolver, PTY tuning, root normalization)

**Scope of this part:** plan items 2–4. Committed separately from part 1 (which landed as 98a9a95).

**What was done (TDD — each item red first, for the intended reason):**

1. **Claude executable resolution (item 2, D4).** New
   `src/tools/marshalled-io-tools/claude-code/claude-executable-resolver.ts`: `resolveClaudeLaunch()`
   does a which-style PATH walk producing `ClaudeLaunch { executable, argsPrefix }` with an ABSOLUTE
   executable path. On win32 the walk is PATHEXT-aware (PATHEXT order honoured; built-in default
   `.COM;.EXE;.BAT;.CMD` when the env has none; extensions lowercased so candidates match real file
   names on case-sensitive CI filesystems too; quoted/empty PATH entries handled). On POSIX the bare
   name must carry the execute bit (which(1) semantics). Classification: `.exe`/`.com` (winget/native
   installs) → spawn directly, empty prefix. `.cmd`/`.bat` → the **LEGACY-ONLY npm-shim branch**
   (deprecation comment + both evidence links in the code): locate
   `node_modules/@anthropic-ai/claude-code/` beside the shim, read package.json `bin` (object and
   plain-string forms), return `process.execPath` + the absolute JS entry as `argsPrefix` — pty.spawn
   cannot run cmd.exe batch shims. Fail-fast errors carrying winget/native-installer guidance for every
   dead end: nothing on PATH, un-spawnable find (e.g. only a `.ps1`), shim without the package beside
   it, package without a claude `bin` entry, `bin` entry naming a missing file.
2. **Wiring: resolution is lazy and injected.** `ClaudeCommandBuilder`'s ctor is now `(ahqPackage,
   workspace, executable?, extraArgs = [], resolveLaunch = resolveClaudeLaunch)`. `executable`
   undefined (the production default — `DefaultClaudeCodeTool` is unchanged) means "resolve claude when
   `build()` runs"; naming an executable (the fake-claude fixture seam) bypasses resolution entirely.
   Resolution runs per `build()` call, never at construction, so listing/discovery paths and unit tests
   on machines with no claude install never walk PATH — pinned by a "not invoked at construction" test,
   and every builder unit test injects a stub resolver. The resolver's `argsPrefix` lands before all
   other args (before `extraArgs`, plugin flags, allowedTools, positional).
3. **PTY tuning (item 3).** `pty-cli-wrapper.ts`: the SIGTERM cleanup handler is registered on POSIX
   only — Windows never delivers SIGTERM to a JS handler (`process.kill(pid, 'SIGTERM')` terminates
   unconditionally there, which the Phase 5 self-termination design relies on), so the listener was
   dead code. On normal exit the pty is now explicitly `kill()`ed: on Windows the ConPTY agent
   connection otherwise keeps the Node process alive after the child has exited (observed on this
   machine); safe on POSIX since node-pty's kill() swallows ESRCH. `name`/`handleFlowControl` reviewed
   per plan and KEPT, each now documented in place (`name` sets TERM on POSIX, ignored by ConPTY;
   `handleFlowControl` is JS-side XON/XOFF, platform-neutral). New
   `tests/unit/io/terminal/pty-cli-wrapper.unit.test.ts` (node-pty mocked): kill-on-exit, SIGINT
   handler add/remove, win32 no-SIGTERM, POSIX SIGTERM add/remove.
4. **Workspace-root normalization (item 4).** `workspace-impl.ts` `isAhqPackage()` compares
   `path.resolve`d paths, casefolded on win32 (NTFS is case-insensitive and the two values are spelled
   by different parties — cwd vs flag — that can disagree on drive-letter case, trailing separators,
   slash style). AHQ-205's plain-`===` comment replaced with the new rationale; POSIX is pinned by test
   NOT to casefold (`/Foo` ≠ `/foo` there).

**Decisions / deviations:** none against the plan's item 2–4 spec. One placement judgment call: the
resolver is builder-owned and injected rather than living in the PTY wrapper — the wrapper stays
claude-agnostic (its SRP) and "assemble the executable" was already the builder's job.

**Test evidence (per changed file, on this Windows machine; all unit runs via
`pnpm vitest run --config vitest.unit.config.ts`):**

- Resolver: new test file red at import (module absent) → **14 green + 1 POSIX-only skip** (the
  exec-bit test needs a host where the bit exists). Tests build their own PATH from tmpdirs and inject
  env + platform — no dependence on a real claude install, win32 branch testable on POSIX CI and vice
  versa.
- Builder: 3 red (injected resolver ignored — executable stayed the `'claude'` literal) → green across
  the rewritten suite (stub resolver everywhere, new resolution describe block).
- PTY wrapper: 2 red (no kill-on-exit; SIGTERM registered on win32) → 3 green + 1 POSIX-only skip.
  The two real-PTY fake-claude unit suites re-run green with kill-on-exit active — the actual-ConPTY
  regression check for the disposal change.
- Workspace: 3 red (trailing-separator, different-case and forward-slash spellings all compared
  unequal under plain `===`) → green + 1 POSIX-only skip (the no-casefold pin).
- Gates: `pnpm validate` fully green — typecheck ✓, lint ✓, format ✓ (scope check listed exactly the 3
  in-progress files; prettier-fixed only those), **239 unit tests passed + 3 POSIX-only skips** (242
  defined; was 216 — +26 new: 15 resolver, 4 PTY, 4 workspace, 3 builder-resolution).
- Integration (build/runner/bin, no Claude spawns): **17 passed + 2 POSIX-only skips** — identical to
  the part 1 baseline, so no regression in the ported surface.
- **Process mistake, logged honestly:** before the subset run above I ran the FULL integration config
  by accident, which also executed the real-Claude, Jira and POSIX-kill-script files that are e2e/
  Phase-5/credentials-gated and are supposed to be Steve-approved before running (memory rule). Result
  18 passed / 3 failed / 2 skipped, ~8 min. The 3 failures are all in those extra files (the safe
  subset re-ran 17/17 green). Silver lining, with a which-test caveat: session-dir forensics show two
  real-Claude sessions completed the full file-I/O round trip (`command-output.json` written) during
  that run, and the one extra test that PASSED is consistent with
  `claude-executes-command-using-file-io.integration.test.ts` — whose tool is pure production wiring —
  meaning real Claude launched through the new resolver → absolute-path pty.spawn chain on Windows and
  returned the reversed string. The 🧑‍💻 demo gate remains the deliberate proof.

---

## Phase 5 — Self-termination cross-platform (CLAUDE_PID node kill script)

**Scope:** plan items 1–6, in one TDD pass (design pre-validated live on all 3 OSes 2026-08-24, D2).

**What was done (each red first, for the intended reason):**

1. **Ported the process-control integration test + fixture (item 1).** Baseline run first (run-before-
   modify): the OLD test fails on Windows at spawn time — node-pty error 193 (ERROR_BAD_EXE_FORMAT), the
   extensionless `node_modules/.bin/tsx` shell-script shim isn't a Windows executable — the exact D4
   problem. Port: the fixture now runs the kill script as `node <script.cjs>` with `CLAUDE_PID` stamped
   into the child env from its own pid (mimicking Claude Code >= v2.1.214, which stamps its PID into
   every process it spawns); the test spawns the fixture as `node node_modules/tsx/dist/cli.mjs
   <fixture>` per D4; expected exit code is per-platform (130 POSIX via the fixture's SIGINT handler /
   1 win32 via TerminateProcess); internal timeout widened 30 s → 60 s. The fixture's script-exists
   check stays deliberately BEFORE its startup message: on Windows the "killed" exit code (1) equals a
   generic error exit, so the test's startup-message assertion is what distinguishes a kill from an
   early crash — documented in both files. RED: `pnpm test:integration:kill-script` failed with
   "ERROR: Kill script not found at …kill-current-cli-process-node.cjs" — and the red itself proved the
   D4 spawn fix (tsx ran under ConPTY; no more 193).
2. **`kill-current-cli-process-node.cjs` (item 2, the green).** Created in the skill's scripts dir from
   the plan's validated reference logic: CLAUDE_PID validation (missing/non-integer/<=1 → error naming
   the >= v2.1.214 requirement), signal-0 existence probe, then SIGINT on POSIX / SIGTERM
   (TerminateProcess) on win32. Console output only — the "writes NO files, ever" hard requirement is
   stated in the header with the Phase 3 shipped-stray-log incident as the reason. Test green in ~1.7 s
   (Windows: SIGTERM → exit 1 observed in the pty output).
3. **SKILL.md (item 3).** `kill-current-process-script-path` → the `.cjs`; invocation is now
   `node "{kill-current-process-script-path}"` (explicit node, quoted, no argument — CLAUDE_PID comes
   from the environment).
4. **Deleted `kill-current-cli-process.sh` (item 4)** after a Grep sweep — every remaining reference is
   a historical ticket/jira doc. Notable: that was the LAST `.sh` in the shipped plugin tree (the two
   survivors live in the unshipped steve-test-plugin), so the generated manifest's
   `publishConfig.executableFiles` now enumerates to an empty list. Nothing to unlist — the list is
   built dynamically from the staged tree each build — and the machinery + wrong-packer prepack guard
   are deliberately kept (future shell scripts, and the guard's pnpm-only rationale is cheap
   insurance). Flagged as a possible Phase 7 simplification candidate.
5. **`temp/AHQ-211/` deleted (item 5)** — 14 gitignored experiment scripts/logs (including the aborted
   temp-mac-instructions draft, parked at Steve's "don't worry about it").
6. **ConPTY `AttachConsole failed` noise quieted (item 6).** Root cause read straight out of the pinned
   node-pty 1.1.0 source: `WindowsPtyAgent.kill()` on the ConPTY path ALWAYS forks a
   `conpty_console_list_agent` helper to sweep console processes that outlive a live pty
   (Microsoft/vscode#26807) — on an already-exited child the console is gone, AttachConsole fails, and
   the helper crashes to our stderr. New `disposeExitedPty()` in `pty-cli-wrapper.ts`: on win32 +
   ConPTY (+ not the conpty.dll backend) it performs kill()'s remaining cleanup directly on the agent
   internals — sockets unreadable, native handle released, conout worker disposed (the parts that end
   the Phase 4 keep-alive) — skipping the fork; POSIX, winpty and conpty.dll shapes fall back to plain
   `kill()`. Internals access is justified in place by the exact-version pin (supply-chain rule,
   AHQ-170). The live-signal cleanup path (`signalCleanup`) keeps plain `kill()` — its pty is alive, so
   the console sweep works there.

**Decisions / deviations:** none against the plan's spec. Same-session field evidence for the gate's
rationale: a `pnpm demo:agentic-hq-cli:string-reversal` Steve launched before these changes landed sat
hung for ~50 min (spawned session couldn't self-terminate via the old `.sh`) — killed off; post-Phase-5
demo runs are exactly what the 🧑‍💻 gate re-tests.

**Test evidence (per changed file, on this Windows machine):**

- Kill-script integration (`pnpm vitest run --config vitest.integration.config.ts
  tests/integration/process-control/kill-script-terminates-cli-process.integration.test.ts` — runs both
  the test AND the fixture): baseline fail (error 193) → red for the right reason (script missing) →
  **1 passed** (~1.7 s).
- PTY wrapper unit (`…vitest.unit.config.ts tests/unit/io/terminal/pty-cli-wrapper.unit.test.ts`):
  1 red (exit disposal still went through `kill()`) → **5 passed + 1 POSIX-only skip**. Two new win32
  tests: quiet ConPTY disposal, and a winpty-backend plain-kill() fallback pin (the pin was green
  pre-change — logged as a pin, not a red).
- The `.cjs` script itself is executed by the kill-script integration test above (its "Terminating CLI
  process …" line appears in the pty output). SKILL.md's prose + the script under REAL Claude is the
  🧑‍💻 Phase 5 gate (plus the deferred demo gate), per plan.
- Gates: `pnpm validate` fully green — typecheck ✓, lint ✓, format ✓, **241 unit tests passed + 3
  POSIX-only skips** (244 defined; was 242 — +2 new PTY tests). Integration
  build/runner/bin/process-control: **7 files, 18 passed + 2 POSIX-only skips** — the 17+2 part-2
  baseline plus the newly-green kill-script test; the runner files spawn real ptys through the wrapper,
  so this is the actual-ConPTY regression check for the disposal change.

**🧑‍💻 Phase 5 gate — Mac (POSIX) side: PASS (2026-08-29).** All three checks green on Steve's Mac at
`c73bf85`: `pnpm validate` (239 passed + 5 win32-only skips, of the same 244), the deferred Phase 4 demo
gate (`pnpm demo:agentic-hq-cli:string-reversal` — reversed string returned, spawned session
self-terminated via the node kill script, no hang), and the real-Claude self-termination run
(`/agentic-hq-core-plugin:self-termination` on Claude Code v2.1.251 — session killed itself cleanly).
Full evidence, plus a Mac-side suggestion for a Phase 6 docs sub-item ("`pnpm install` is not one-off"),
in [`supporting-files/files-created-by-mac-claude-while-testing/mac-gate-5-results-and-phase-6-doc-suggestion.md`](./supporting-files/files-created-by-mac-claude-while-testing/mac-gate-5-results-and-phase-6-doc-suggestion.md).
The Windows halves of the gate remain with the Windows session.

**Refactor list (Steve, post-Phase-5 review):** `PtyCLIWrapper` has grown hard to read — the private
`WindowsPtyAgentInternals` interface in particular is a bag of options that don't self-document. When it
earns the work, refactor to the project pattern of one interface + self-documenting concrete type per
element (interfaces under `src/interfaces/pty`), pushing behaviour onto those concrete classes so the
wrapper stops accreting pty behaviour and `disposeExitedPty` (a Windows keep-alive/noise workaround)
sits inside a type structure. Deliberately DEFERRED: the class is self-contained and doesn't obscure the
wider project; revisit if AHQ gets heavy use. Recorded as a REFACTOR LATER comment at the top of
`src/io/terminal/pty-cli-wrapper.ts`.

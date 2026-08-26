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

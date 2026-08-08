# AHQ-196 — Implementation Summary

## Summary Of Work Done

Implemented the approved tracer bullet: a minimal deterministic build (`pnpm build` →
`tsc -p tsconfig.build.json`) compiles the CLI graph and the math workflow to `dist/`; `pnpm pack`
produces a tarball whose manifest gets the prebuilt `bin`/`exports` via the pack-time
`publishConfig` overrides; a minimal shared runner (`scripts/run-workflow.cjs`) replaces the
math-workflow SKILL.md's `pnpm install` + `ln -sfn` + tsx launch. The e2e proves an npm install of
that tarball into a temp prefix runs `agentic-hq list` and a full non-interactive math workflow
(`Output number: 5`) from a clean directory — no pnpm, no tsx, no runtime installs, nothing
written inside the installed package. Import resolution via Node package self-reference and build
determinism are both proven (details in Findings below).

## Files Changed/Added/Deleted

- `tsconfig.build.json` — **added**: emit config compiling `src/**` + the math ts-workflow to
  `dist/`, mirroring the repo layout (`rootDir "."`); typecheck-only `paths` mapping for the
  self-referencing import.
- `package.json` — **changed**: `build` script (clean build: `rm -rf dist` first); `files`
  whitelist (`bin`, `dist`, `scripts/run-workflow.cjs`, `.agentic-hq`); `publishConfig` with the
  prebuilt `bin`/`exports`; `test:e2e:cross-workspace-demo-math-workflow` gains a leading
  `pnpm build && ` (interim until AHQ-197's build-first mode).
- `bin/agentic-hq-prebuilt.cjs` — **added**: shipped entry point; sets
  `AGENTIC_HQ_WORKSPACE_ROOT`, dynamic-imports `dist/src/cli/main.js` under plain node.
- `scripts/run-workflow.cjs` — **added**: minimal shared runner; requires
  `--ahq-package-root=` and `--workflow-js=` (loud error if missing), passes remaining args
  through to the workflow program.
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/math-workflow/SKILL.md` — **changed**:
  `command-output-string` now invokes the runner against the compiled workflow JS; info-panel note
  updated (legacy `pnpm install` + `ln -sfn` + tsx command removed).
- `tests/integration/build/build-determinism.integration.test.ts` — **added** (test 1).
- `tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts` — **added**
  (test 2).

No files deleted.

## Tests Added/Updated And Test Results

Sequence ran RED → gate check → CODE → GREEN as planned.

- **RED** — both tests written first and run; both failed for exactly the predicted reason:
  test 1 with `error TS5058: The specified path does not exist: 'tsconfig.build.json'`; test 2's
  `beforeAll` with `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "build" not found`.
- **Gate check** (first CODE action) — dummy package in `temp/AHQ-196/publishconfig-spike-*`:
  `pnpm pack` really rewrites the tarball manifest's `bin`/`exports` from `publishConfig` (and
  strips the `publishConfig` field), leaves the working-tree manifest untouched, and works with
  `"private": true`. Design gate passed.
- **Test 1 (GREEN)** —
  `npx vitest run --config vitest.integration.config.ts tests/integration/build/build-determinism.integration.test.ts`:
  **1 passed** (~3s). Two `tsc` builds into separate temp dirs produced identical relative-path →
  SHA-256 maps; both build surfaces (`src/cli/main.js` + the compiled workflow JS) present.
- **Test 2 (GREEN)** —
  `npx vitest run --config vitest.e2e.config.ts tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts`:
  **3 passed** (141s) — artifact shape (tarball manifest has prebuilt `bin` + dist-JS `exports`,
  no `.ts` targets; no nested `package.json` between the compiled workflow JS and the package
  root), `list` from the installed bin in a clean workspace, and the full math run
  (`Output number: 5`, io-files under the user workspace, installed package file listing
  unchanged).
  - Run history, for honesty: the **first** full run hung in the third Claude step (`div-five`) —
    killed and restarted at the human's request; the step completed normally in both later runs
    (flake, noted in Concerns). The **second** run passed setup + artifact shape + the full math
    run but exposed a bug in the new `list` test: it asserted the literal string `math-workflow`,
    which the list UI never prints (it renders the short command `agentic-hq math` + description).
    Per the broken-test rule the assertion was re-expressed against the real output format
    (command + description, same pattern as the existing cross-workspace-list-workflows e2e) and
    the **whole file re-run green**. No implementation code changed between those runs.
- **Manual validation** — `pnpm build` run by hand: clean compile; verified the compiled workflow
  JS keeps the bare `agentic-hq/tools/claude-code` specifier (the `paths` mapping is
  typecheck-only, as designed). The e2e itself is the real end-to-end run (real tarball, real
  `npm install -g --prefix`, real Claude ×3).
- **`pnpm validate`** — all four checks green (typecheck, lint, format, 146 unit tests / 32 files).

## Approved Deviations From The Plan

None. (The `pnpm pack` vs literal `npm pack` deviation was already approved in the plan itself.)

## Out Of Plan Follow-up Ideas/Concerns

- **Self-termination ran via Bash workaround in every Claude step** (observed live by the human):
  each of the 3 workflow steps could not run the self-termination skill directly and instead ran
  its script via Bash (`…/skills/self-termination/scripts/kill-current-cli-process.sh $PPID`).
  The workaround worked and all steps completed, but why direct skill invocation failed on the
  installed-package path was not investigated (out of scope) — flag for the Reviewer; unknown
  whether it also happens on the dev path.
- **`div-five` step hang (flake)**: the first e2e attempt hung indefinitely in the third Claude
  step; two subsequent runs completed it in seconds. Worth remembering if it recurs.
- **Tarball hygiene ammunition for AHQ-198** (inspected the real tarball, 492 files): the `files`
  whitelist overrides `.gitignore`, so `.agentic-hq/temp/` ships — **99 dev-machine io-files leak
  into the tarball** (privacy-relevant; must be fixed before any real publish);
  `steve-test-plugin` ships (15 files, known AHQ-198 item); 16 pnpm-only files
  (`.npmrc`/`pnpm-lock.yaml`/`pnpm-workspace.yaml`) ship inertly; 7 nested ts-workflow
  `package.json` manifests ship inertly (proven harmless to self-reference — none is an ancestor
  of the compiled JS; the e2e asserts this).
- The repo convention of one npm convenience script per e2e/integration test was not extended to
  the two new tests (not in the plan); trivial to add later if wanted.

## Findings For Later Sub-Tasks

1. **Import resolution mechanism proven: Node package self-reference** (mechanism (c) from the
   brief). The compiled workflow JS under `dist/` keeps the bare `agentic-hq/tools/claude-code`
   specifier; walking up from it, the nearest `package.json` is the root manifest, whose
   pack-time `exports` point at compiled dist JS. Proven live by the full math run from the
   installed tarball. Generalises to every workflow whose compiled JS is emitted under `dist/`
   inside the package.
2. **Build determinism proven**: two `tsc -p tsconfig.build.json` runs produce byte-identical
   trees (SHA-256 per file). Covered permanently by the integration test. Compare extracted
   trees, never tarball bytes (mtimes).
3. **`pnpm pack` + `publishConfig` is the packing mechanism**: it rewrites `bin`/`exports` in the
   tarball manifest only (and strips `publishConfig`); npm's packer does NOT do this — packing
   must stay `pnpm pack` (guard against `npm pack`/`npm publish` on the source tree is an AHQ-198
   addendum in the parent brief).
4. **`files` whitelist slice pre-done from AHQ-198**: `["bin", "dist", "scripts/run-workflow.cjs",
   ".agentic-hq"]` — but see the hygiene gaps above; AHQ-198 still owns hygiene proper.
5. **Interim caveats AHQ-197 must retire**: `test:e2e:cross-workspace-demo-math-workflow` needs
   `pnpm build` first, and a math-workflow dev-mode run now goes via the prebuilt path (accepted
   in brief Q2).
6. **node-pty risk did not materialise**: the npm temp-prefix install on macOS preserved the
   prebuild's executable bit; the full PTY-driven Claude launches worked from the installed copy.

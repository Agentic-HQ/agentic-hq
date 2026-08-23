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
  (test 2; artifact-shape assertions later re-expressed by the Approval Gate fixes below).
- `scripts/dist-package.json` — **added** (Approval Gate fix 1): template the build copies to
  `dist/package.json` so compiled workflow JS self-reference-resolves to compiled JS identically
  in dev-tree and installed runs.

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
- **Approval Gate re-test (after the two consented fixes)** — each new e2e assertion was written
  and seen to fail first against the unfixed artifact (missing `dist/package.json` → ENOENT;
  shipped kill script → exec-bit assert failed), then pass after its fix. Full re-verification,
  all green:
  - `npx vitest run --config vitest.e2e.config.ts tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts`
    — 3/3 (117s).
  - `pnpm test:e2e:cross-workspace-demo-math-workflow` (dev-path binary) — 1/1 (101s). A first
    attempt spuriously ETIMEDOUT because the machine slept mid-run; the clean re-run passed.
  - **Manual CLI run** (now on the standard test list per the human's instruction):
    `agentic-hq math -- --input-number=11` from a clean temp workspace via the dev binary →
    `Output number: 5`. This is the check the tarball e2e cannot cover — it was green while the
    dev CLI was broken.
  - `pnpm validate` — green.

## Approved Deviations From The Plan

Two, both consented at the Approval Gate and recorded as **Update From Human 02** in
`02-implementation-plan.md`:

1. **Build generates `dist/package.json`** (from the new `scripts/dist-package.json` template) —
   the plan's assumption that a dev-mode math run works after `pnpm build` was falsified by the
   human's manual run (`ERR_MODULE_NOT_FOUND`): compiled workflow JS under plain node
   self-referenced the working-tree manifest, whose exports point at `.ts` source. The generated
   dist manifest is the nearest ancestor of the compiled workflow JS, so the
   `agentic-hq/tools/claude-code` specifier resolves to compiled JS identically in dev and
   installed runs. The e2e's "no nested manifest" assertion was re-expressed around the new
   mechanism.
2. **Shipped `postinstall` restores execute bits on plugin `.sh` scripts** — `pnpm pack` records
   non-bin files as 0644, so skills' runtime scripts arrived non-executable in an npm install
   (exit 126 on direct execution). Same idiom as the existing node-pty spawn-helper chmod; no-op
   in the dev repo. New e2e assertion: every shipped `.sh` in the installed plugins tree is
   executable.

(The `pnpm pack` vs literal `npm pack` deviation was already approved in the plan itself.)

## Out Of Plan Follow-up Ideas/Concerns

- **Self-termination "workaround" — RESOLVED, root cause found by the human**: the observed
  `bash <script>` fallback in the e2e's Claude steps was NOT the skill's normal shape — the
  shipped kill script had lost its execute bit (`pnpm pack` records non-bin files as 0644), so
  direct execution failed with exit 126 and the in-step agent improvised. Fixed at the Approval
  Gate (postinstall chmod, see Approved Deviations); the e2e now asserts shipped script
  executability.
- **`div-five` step hang (flake)**: the first e2e attempt hung indefinitely in the third Claude
  step; two subsequent runs completed it in seconds. Possibly related to the (now fixed)
  non-executable kill script; worth remembering if it recurs.
- **Tarball hygiene ammunition for AHQ-198** (inspected the real tarball, 492 files): the `files`
  whitelist overrides `.gitignore`, so `.agentic-hq/temp/` ships — **99 dev-machine io-files leak
  into the tarball** (privacy-relevant; must be fixed before any real publish);
  `steve-test-plugin` ships (15 files, known AHQ-198 item); 16 pnpm-only files
  (`.npmrc`/`pnpm-lock.yaml`/`pnpm-workspace.yaml`) ship inertly; 7 nested ts-workflow
  `package.json` manifests ship inertly (proven harmless to self-reference — none is an ancestor
  of the compiled JS; the e2e asserts this).
- The repo convention of one npm convenience script per e2e/integration test was not extended to
  the two new tests (not in the plan); trivial to add later if wanted.

## Approval Gate Changes

The human reviewed by running the system by hand and found two defects the automated GREEN had
missed; both fixes were discussed, approved, and implemented at the gate (full detail in the
Approved Deviations section above and in `02-implementation-plan.md` Update From Human 02):

- **What was discussed**: (a) the "self-termination via Bash" observation from the e2e run — the
  human recreated it and identified the missing execute bit on the shipped kill script; (b) a
  manual `agentic-hq math` run failing with `ERR_MODULE_NOT_FOUND` on the dev path even though
  the tarball e2e was green.
- **What changed**: `pnpm build` now also copies `scripts/dist-package.json` (new file) to
  `dist/package.json`; the shipped `postinstall` now restores execute bits on
  `.agentic-hq/plugins/**/*.sh`; the e2e artifact-shape test was re-expressed (dist-manifest
  assertions replace the no-nested-manifest walk) and gained a shipped-scripts-are-executable
  assertion — each written RED-first against the unfixed artifact.
- **Why**: make compiled-workflow import resolution identical in dev and installed runs, and make
  shipped runtime scripts actually executable, rather than relying on the in-step agent
  improvising a `bash <script>` fallback.
- **Test-list expansion** (human instruction): a manual `agentic-hq math` CLI run joins the two
  e2es and `pnpm validate` as the standard things to test — the tarball e2e alone stayed green
  while the dev CLI was broken.

## Findings For Later Sub-Tasks

1. **Import resolution mechanism proven: Node package self-reference against a generated
   `dist/package.json`** (mechanism (c) from the brief, amended at the Approval Gate). The
   compiled workflow JS under `dist/` keeps the bare `agentic-hq/tools/claude-code` specifier;
   the nearest `package.json` above it is the build-generated `dist/package.json`
   (`name: agentic-hq`, `type: module`, exports → compiled JS), so resolution lands on compiled
   JS **identically in dev-tree and installed runs**. Proven live by the full math run from the
   installed tarball AND by dev-path runs. Generalises to every workflow whose compiled JS is
   emitted under `dist/` inside the package.
2. **Build determinism proven**: two `tsc -p tsconfig.build.json` runs produce byte-identical
   trees (SHA-256 per file). Covered permanently by the integration test. Compare extracted
   trees, never tarball bytes (mtimes).
3. **`pnpm pack` + `publishConfig` is the packing mechanism**: it rewrites `bin`/`exports` in the
   tarball manifest only (and strips `publishConfig`); npm's packer does NOT do this — packing
   must stay `pnpm pack` (guard against `npm pack`/`npm publish` on the source tree is an AHQ-198
   addendum in the parent brief). **Caveat discovered at the gate**: `pnpm pack` also records
   every non-`bin` file as 0644, silently dropping execute bits — any shipped file that must be
   executable at runtime needs its bit restored by `postinstall` (now done for
   `.agentic-hq/plugins/**/*.sh`).
4. **`files` whitelist slice pre-done from AHQ-198**: `["bin", "dist", "scripts/run-workflow.cjs",
   ".agentic-hq"]` — but see the hygiene gaps above; AHQ-198 still owns hygiene proper.
5. **Interim caveats AHQ-197 must retire**: `test:e2e:cross-workspace-demo-math-workflow` needs
   `pnpm build` first, and a math-workflow dev-mode run now goes via the prebuilt path (accepted
   in brief Q2).
6. **node-pty risk did not materialise**: the npm temp-prefix install on macOS preserved the
   prebuild's executable bit; the full PTY-driven Claude launches worked from the installed copy.
7. **Second Perplexity review of the gate fixes** (Q&A file
   `02-implementation-plan-supporting-docs/perplexity-questions/02-perplexity-q-and-a-about-dist-package-json.md`):
   verdict — the generated `dist/package.json` is "not a canonical pattern, but a defensible
   transitional design", ranked the best non-re-architecture option; the architecturally right
   end-state is **workflows as true nested packages (pnpm workspace)** or a **staged release
   tree with a single generated manifest**. That re-architecture is deliberately deferred — the
   human's decision is to commit the working interim and hold a separate "no behaviour change"
   refactor discussion (recorded as an addendum in the AHQ-195 parent brief). Hygiene notes
   adopted: keep `dist/package.json` minimal (never give it `dependencies`); treat it as a build
   artifact; root `publishConfig` exports must mirror its exports exactly.
8. **Exec-bits alternative, spike-proven for the refactor discussion**: pnpm's
   `publishConfig.executableFiles` IS honored by `pnpm pack` in pnpm 11 — but for **exact paths
   only; globs are silently ignored** (spike in `temp/AHQ-196/executablefiles-spike-*`). It would
   make the tarball itself carry the execute bits (correct under any installer) at the cost of
   enumerating each script; the e2e's every-shipped-script-is-executable assertion would catch a
   forgotten listing. The postinstall chmod stays for now as the working, tested mechanism.

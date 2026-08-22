# AHQ-209 — Implementation Summary

## Summary Of Work Done

Migrated the four remaining workflows (`quick-jira-workflow`, `full-jira-tdd-story-workflow`,
`add-feature-detailed-example`, `create-workflow`) onto the AHQ-208 two-builds pattern, exactly per
the approved plan's five slices:

- **Slice 1** (quick-jira, full-jira): byte-identical `SKILL.md` template copied verbatim (all
  seven skill copies now hash `185b5403…`); CLIs rewritten onto the `DefaultWorkflowRuntime`
  pattern (workflow logic unchanged, legacy `link:`-protocol header claims dropped); standard
  ts-workflow file set (package.json, emitting tsconfig, minimal pnpm-workspace.yaml, `.gitignore`,
  regenerated lockfile — byte-identical to string-reversal's); the two legacy
  `demo:plugin-direct:*` root scripts rewritten to the runner form and the stale comment fixed.
- **Slice 2** (add-feature-detailed-example, create-workflow): everything from Slice 1, plus the
  relay rename `agentic-hq-workspace-root-dir` → `ahq-package-root` — CLIs drop the
  `AGENTIC_HQ_WORKSPACE_ROOT` env-var read/fail-fast and broadcast
  `ahq-package-root=${runtime.getAhqPackageRoot().getPath()}` (passthrough logic untouched); all 12
  command files renamed in lockstep (7 detailed-example + 5 create-workflow) plus the
  detailed-example developer help doc. The create-workflow scaffolder teaching rewritten per the
  parent-brief mapping: Cmd 01 Steps 0c/1/1.5 (env vars leave the four sources — now CLI
  passthrough params, the two runner-relayed framework options, command outputs, and human
  answers)/5 (spec + copy-plan templates: SKILL.md copied verbatim with no substitutions, the
  false AHQ-162 `ln -sfn` teaching removed, copy list gains `.gitignore`, `node_modules/`+`dist/`
  excluded as build products)/output relays `ahq-package-root=`; Cmd 02 Steps 4-COPY/4c
  (`DefaultWorkflowRuntime` pattern)/4d (SKILL.md **copied** verbatim, never authored)/4e (standard
  file set; stale `allowBuilds` teaching dropped); Cmd 03 Step 2A now runs the real **Workflow
  Build (2)** (`node {ahq-package-root}/scripts/build-workflow.cjs …`) instead of the
  `pnpm install` + `pnpm dlx tsc` pair (version-pin teaching gone — TS comes from the workflow's
  own devDeps); Cmds 04/05 mechanical rename only; the two workflow help docs correctness-passed.
  The names **Framework Build (1)** / **Workflow Build (2)** used throughout. Unit fixture tidy
  (Q3) landed here.
- **Slice 3** (single release/hygiene flip): `EXCLUDED_UNMIGRATED_SKILLS` deleted from
  `scripts/build-release.cjs` and replaced (in place) by an exclusion of the two skill-less draft
  command dirs (Q4(b)); tarball e2e expectations flipped to the all-seven end-state (this slice's
  RED — confirmed failing for exactly the expected reasons before the code change); the TEMPORARY
  half of the AHQ-200 bin-wrapper test deleted exactly as its header instructs; grep-clean AC
  verified.
- **Slice 4** (restore-to-working proof): see test results below.
- **Slice 5** (publish 0.2.0, prep done): root `package.json` version bumped to **0.2.0**;
  publish-checklist §3 expected-skills list updated to all seven and §5's stale "currently math and
  add-feature" note fixed; `pnpm build` → `cd release && pnpm pack` produced
  `release/agentic-hq-0.2.0.tgz` (305KB) and **every checklist §3 inspection passed**: 0.2.0
  manifest (no `private`, prebuilt bin, compiled exports + shipped `.d.ts`, non-empty
  `executableFiles`, no devDeps/packageManager/engines.pnpm), all seven skills + self-termination
  and their seven compiled `dist/<skill-id>-cli.js`, no node_modules, no stray ts-workflow install
  files, no draft dirs, exactly the two shipped scripts. The pnpm-shim cleanup, human-run
  `npm publish` (real Terminal), and registry verification matrix are **pending — done with the
  human after the Approval Gate** (see below).

## Files Changed/Added/Deleted

Per workflow (×4: `quick-jira-workflow`, `full-jira-tdd-story-workflow`,
`add-feature-detailed-example` under `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/`,
`create-workflow` under `.agentic-hq/plugins/agentic-hq-core-plugin/skills/`):

- `SKILL.md` — **changed** (replaced with the byte-identical template)
- `ts-workflow/src/<skill-id>-cli.ts` — **changed** (DefaultWorkflowRuntime migration; relay rename in the two Slice 2 CLIs)
- `ts-workflow/package.json` — **changed** (standard file set; add-feature-detailed-example's name fixed to the on-convention `agentic-hq-demo-add-feature-detailed-example`)
- `ts-workflow/tsconfig.json` — **changed** (emitting config)
- `ts-workflow/pnpm-workspace.yaml` — **changed** (minimal: `packages: ['.']` + `minimumReleaseAge`)
- `ts-workflow/pnpm-lock.yaml` — **changed** (regenerated; byte-identical to string-reversal's)
- `ts-workflow/.gitignore` — **added** (`node_modules/`, `dist/`)

Command files & docs:

- `.agentic-hq/plugins/agentic-hq-demos-plugin/commands/add-feature-detailed-example/01…07-*.md` — **changed** (rename)
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature-detailed-example/docs/developer-help-docs/developer-help-doc.md` — **changed** (rename + runtime-pattern description)
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/01…03-*.md` — **changed** (rename + scaffolder teaching rewrite)
- `.agentic-hq/plugins/agentic-hq-core-plugin/commands/create-workflow/04-*.md`, `05-*.md` — **changed** (mechanical rename)
- `.agentic-hq/plugins/agentic-hq-core-plugin/skills/create-workflow/docs/workflow-help-docs/using-existing-workflow-help-doc.md` — **changed** (correctness pass; `00-…-user-help-doc.md` needed no changes)

Release/build, root, tests, docs:

- `scripts/build-release.cjs` — **changed** (exclusion flip)
- `package.json` (root) — **changed** (two `demo:plugin-direct:*` scripts + stale comment; version → 0.2.0)
- `tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts` — **changed** (all-seven expectation flip + draft-dir assertion + absence→presence list assertions)
- `tests/integration/bin/bin-wrapper-supplies-the-package-root-explicitly.integration.test.ts` — **changed** (TEMPORARY half deleted)
- `tests/unit/workflow-runtime/default-workflow-runtime.unit.test.ts` — **changed** (Q3 fixture tidy: `math-workflow-demo-cli.js` → `math-workflow-cli.js`)
- `docs/dev/publish-checklist.md` — **changed** (§3 all-seven list; §5 stale note)

(Also in this branch's diff but **not** this ticket's work: the four
`commands/add-feature/0?-*.md` files — the in-session meta-work recorded in the feature brief's
Human Prompt UPDATE.)

## Tests Added/Updated And Test Results

No new test files (per plan). Results, in RED→GREEN order:

- **Slice 1 RED**: `node scripts/run-workflow.cjs --build-mode=build-first …quick-jira… --help`
  against the legacy file set → Workflow Build failed (exit 1), as expected.
- **Slice 1/2 GREEN — runner `--help` smokes (no Claude), all four**:
  `node scripts/run-workflow.cjs --build-mode=build-first --ahq-package-root=$PWD
  --workflow-dir=…/<wf>/ts-workflow --workflow-js=dist/<skill-id>-cli.js --help` → usage printed,
  exit 0 for `quick-jira-workflow`, `full-jira-tdd-story-workflow`, `add-feature-detailed-example`,
  `create-workflow`.
- **Slice 3 RED**: `pnpm test:e2e:prebuilt-tarball-math-workflow` with expectations flipped but
  `build-release.cjs` unchanged → 2 failed (artifact-shape shipped-skills boundary; list missing
  the four), 3 passed — exactly the expected failures.
- **Slice 3 GREEN**: same command after the `build-release.cjs` flip → **5/5 passed** (210s),
  including the real-Claude math run (`Output number: 5`) and string-reversal run, all-seven
  shipped-set assertion, draft-dir exclusion, and read-only-install hash check.
- **Unit fixture tidy**: `pnpm test tests/unit/workflow-runtime/default-workflow-runtime.unit.test.ts`
  → 6/6 before and after the one-line change.
- **Bin-wrapper**: `pnpm test:integration:bin-wrapper` after deleting the temporary half → 1/1
  (the permanent Framework-Build/explicit-root test).
- **`pnpm validate`** → all four stages green (typecheck, lint, format, **190/190** unit tests).
- **`pnpm test:integration`** (serialized) → **16/16 across 9 files**.
- **`agentic-hq-dev list`** from the clone → all seven workflows render (manual run; output
  verified showing create-workflow + the six demos-plugin workflows).
- **Grep-clean AC**: `grep -rl 'agentic-hq-workspace-root-dir\|AGENTIC_HQ_WORKSPACE_ROOT'`
  (excluding node_modules/release/temp/.git/docs-jira-docs/docs-tickets/LEGACY) → only the exempt
  DRAFT notes file remains (Q4(a)).
- **Cross-workspace quick-jira e2e (Q2, real Claude + real test Jira)**:
  `pnpm test:e2e:cross-workspace-quick-jira-workflow` → **1/1 passed in 601s** (~10 min; well
  inside the 60-min budget, no flake/re-run needed). It created throwaway test Jira **TEST-98**,
  ran the full 5-command workflow from a separate workspace via `agentic-hq-dev`, and asserted the
  workflow output files, the implementation files, and the Jira's Done transition.
- **Manual acceptance walk-through** (fresh dir + tarball install → `agentic-hq create-workflow
  -- --using=add-feature` → scaffold → commit → collaborator run): **pending — run with the human
  after the Approval Gate.**

## Approved Deviations From The Plan

None.

## Out Of Plan Follow-up Ideas/Concerns

- The four newly-shipped workflows now show the template's generic `SKILL.md` description in
  skill-level tooling; their `list` entries still show their own `ahq-workflow.json` descriptions.
  Known and accepted in the plan's risks — noted so nobody reads it as a regression.
- The publish checklist's §5 verification commands still use the math run; the plan's verification
  matrix names string-reversal end-to-end (1 Claude step vs 3). Both are valid; at verification
  time we can run reversal for speed. Left the standing checklist doc's commands unchanged.
- This very add-feature run (Researcher → Reviewer, launched via the byte-identical SKILL.md →
  runner → compiled `dist/add-feature-cli.js`) completes the deferred AHQ-208 proof when the
  Reviewer finishes — no extra action needed.

## Human Approval Confirmation

I'm running a bit low on tokens for this week (nearing the limit) so I'm manually approving this and skipping the Review section for this Jira, and will commit and set it to done.

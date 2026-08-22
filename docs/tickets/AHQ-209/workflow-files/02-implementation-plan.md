# AHQ-209 — Implementation Plan

Migrate the four remaining workflows (`quick-jira-workflow`, `full-jira-tdd-story-workflow`,
`add-feature-detailed-example`, `create-workflow`) and the scaffolder onto the AHQ-208 two-builds
pattern, restore everything to working, and publish `agentic-hq@0.2.0`. All design decisions are
already made in the parent briefs (AHQ-201 Q1–Q6 + the 2026-08-19 addendum, AHQ-209 Q1–Q3); this
plan only sequences them.

The work is sequenced **test-first per slice** (justification: the migrations flip existing suite
expectations — updating the expectation first gives a cheap, honest RED that proves the test would
catch a botched migration; the command-file/scaffolder rewrites have no automated test, so their
proof is the smoke checks and the manual walk-through in Slice 4). Each slice: **RED** (update/run
the gating tests, see them fail for the expected reason) → **CODE** (implement) → **GREEN** (run the
tests + actually run the code).

> NOTE: No REFACTOR stage as it adds too much complexity for this simple add-feature workflow (do this in your own custom workflow if reqd)

## Tests Being Created

No new test files — this is a migration; "restore all to working" means the **existing suite is
green with its expectations flipped to the new end-state**. The test changes:

1. **Tarball e2e** (`tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts`) —
   the publish safety net; maps to AC 1 & 3:
   - `EXPECTED_SHIPPED_SKILLS_BY_PLUGIN` → all seven (`create-workflow` joins core;
     `quick-jira-workflow`, `full-jira-tdd-story-workflow`, `add-feature-detailed-example` join demos).
   - `COMPILED_WORKFLOW_JS_RELATIVE_PATHS` → + the four new `ts-workflow/dist/<skill-id>-cli.js`.
   - The `EXCLUDED_WORKFLOW_LIST_SUBSTRINGS` absence assertions become **presence** assertions in
     the `list` test (each of the four renders in the installed listing).
   - New assertion: the two skill-less draft command dirs (`commands/DRAFT-oo-refactoring-workflow/`,
     `commands/research-plan-implement/`) do **not** appear in the tarball file list (Q4(b)).
2. **Bin-wrapper integration test** — delete the TEMPORARY half exactly as its header instructs:
   the second `it(...)`, `LEGACY_ENV_VAR_NAME`, `BOGUS_LEGACY_ROOT`, the optional parameter of
   `runListThroughDevBinWrapper()`, and the TEMPORARY header paragraph (AC 3).
3. **Cross-workspace quick-jira e2e** — no code change needed (AHQ-208 already updated it to
   `agentic-hq-dev`); it is **executed once for real** in Slice 4 (Q2 — accepts the throwaway test
   Jira it creates). The only end-to-end evidence any Jira-MCP workflow gets.
4. **Unit fixture tidy** (Q3): `tests/unit/workflow-runtime/default-workflow-runtime.unit.test.ts:25`
   `…/math-workflow-demo-cli.js` → `…/math-workflow-cli.js` (fixture argv data; one line).

**Not practical to test automatically:** the 12 command-file relay renames, the scaffolder teaching
rewrite, and the help-doc updates (Markdown read by AI agents, not code). Their concrete manual
validation is Slice 4's runner `--help` smokes + the **manual acceptance walk-through** (fresh dir,
npm/tarball install, `agentic-hq create-workflow -- --using=add-feature`, scaffold, commit,
collaborator runs it — no clone anywhere), per AHQ-201 Q3.

## Implementation Changes

### Slice 1 — quick-jira-workflow + full-jira-tdd-story-workflow (simple migrations)

Per workflow (model: `skills/string-reversal/` after AHQ-208):

- **SKILL.md**: replace with the byte-identical template — **copy** `skills/add-feature/SKILL.md`
  verbatim, then verify all copies hash identical (`shasum` = `185b5403…` set, now 7 files).
- **CLI content** (filenames already renamed by AHQ-208): swap the no-arg `DefaultClaudeCodeTool`
  for the runtime pattern, per `add-feature-cli.ts`:

  ```ts
  import { DefaultWorkflowRuntime } from 'agentic-hq/tools/claude-code';
  const runtime = new DefaultWorkflowRuntime(process.argv);
  const tool = runtime.getClaudeCodeTool();
  …
  program.parse(runtime.getWorkflowArgs());
  ```

  Workflow logic (command constants, loops, broadcast strings) unchanged; header comments updated
  (drop "link: protocol" claims).
- **Standard ts-workflow file set**: `package.json` = `commander` dep + `typescript`/`@types/node`
  devDeps, **no** `agentic-hq`/`tsx` deps, **no** postinstall (copy math-workflow's, fix `name`);
  emitting `tsconfig.json` (`rootDir`/`outDir`/`sourceMap`); minimal `pnpm-workspace.yaml`
  (`packages: ['.']` + `minimumReleaseAge`); `.npmrc` unchanged; add `.gitignore`
  (`node_modules/`, `dist/`); regenerate + commit `pnpm-lock.yaml`.
- **`package.json` (root)**: rewrite `demo:plugin-direct:quick-jira-workflow` and
  `demo:plugin-direct:full-jira-tdd-story-workflow` to the new form (copy the string-reversal/math
  shape: `pnpm build:framework && node scripts/run-workflow.cjs --build-mode=build-first …`), and
  update the now-stale `// demo:plugin-direct` comment.

GREEN check: `node scripts/run-workflow.cjs --build-mode=build-first … --workflow-js=dist/<cli>.js --help`
prints usage for both (the AHQ-204-style no-Claude smoke).

### Slice 2 — add-feature-detailed-example + create-workflow (relay migrations)

Everything in Slice 1, **plus** the relay rename (model: AHQ-200's add-feature rename):

- **CLIs**: drop the `AGENTIC_HQ_WORKSPACE_ROOT` read + fail-fast; broadcast
  `ahq-package-root=${runtime.getAhqPackageRoot().getPath()}` in Command 01's input string
  (`agentic-hq-workspace-root-dir=` → `ahq-package-root=`); keep `--using` / `--verbosity` /
  `--ticket-id` passthrough logic as-is.
- **Command files rename in lockstep** — every parser and derived-path block:
  `agentic-hq-workspace-root-dir` → `ahq-package-root` in the 7
  `commands/add-feature-detailed-example/0?-*.md` + its
  `docs/developer-help-docs/developer-help-doc.md`, and the 5 `commands/create-workflow/0?-*.md`.
- **Scaffolder teaching rewrite** (create-workflow, beyond the mechanical rename — exactly the
  steps mapped in the parent brief):
  - **Cmd 01** Step 0c (`--using` resolution paths via `{ahq-package-root}`); Step 1 (the CLI to
    read as *the* pattern is now the `DefaultWorkflowRuntime` one); Step 1.5 (env vars leave the
    "four sources" — sources are now CLI passthrough params, the two runner-relayed framework
    options, command outputs, and human answers); Step 5 spec template ("Env vars consumed by the
    TS CLI" → framework options handled by `DefaultWorkflowRuntime`; CLI pattern section);
    Step 7 output relays `ahq-package-root=`.
  - **Cmd 02** Step 4-COPY: `SKILL.md` copied **verbatim, no substitutions** (delete the "rewire
    SKILL.md CLI filename" bullet and the false AHQ-162 `ln -sfn` callout — the byte-identical
    template + Workflow Build symlink replace it); copy list gains `.gitignore`; CLI rename bullet
    keeps the `<skill-id>-cli.ts` convention. 4c: `DefaultWorkflowRuntime` pattern (point at
    math-workflow's CLI). 4d: **copy** the template verbatim, never author one. 4e: the standard
    file set as in Slice 1 (drop the stale `allowBuilds` teaching — the minimal
    `pnpm-workspace.yaml` has none).
  - **Cmd 03** Step 2A: replace the `pnpm install` + `pnpm dlx tsc` pair with **one run of the
    Workflow Build (2)**: `node {ahq-package-root}/scripts/build-workflow.cjs
    --workflow-dir={ts-workflow-dir} --ahq-package-root={ahq-package-root}` (install + symlink +
    tsc in one; the TS version now comes from the workflow's own devDeps, so the version-pin
    teaching goes).
  - **Cmds 04/05**: mechanical rename only.
  - **Help docs**: review/update the two `workflow-help-docs/*.md` for the new build/run
    description (no legacy names present — correctness pass only).
- Use the names **Framework Build (1)** / **Workflow Build (2)** in everything written.
- **Unit fixture tidy** (Q3) lands here with the convention work.

### Slice 3 — release + hygiene flip (single flip, after all four migrations)

Done as one slice so the tarball e2e's exact-set assertions change **once** (avoids AHQ-208's
growing-lists scaffold):

- `scripts/build-release.cjs`: delete `EXCLUDED_UNMIGRATED_SKILLS` (list + filter + comment);
  add a small exclusion where it used to be for the two skill-less draft `commands/` dirs (Q4(b)).
- Tarball e2e expectation flips + new draft-dir assertion (see Tests above) — this slice's RED.
- Bin-wrapper test: delete the temporary half.
- Grep-clean AC check: re-run the brief's grep; only the DRAFT notes file (exempt, Q4(a)) and
  `docs/jira-docs`/`docs/tickets`/`LEGACY`/`release`/`node_modules`/`temp` hits remain.

### Slice 4 — restore-to-working proof

- `pnpm validate` green; `pnpm test:integration` green (serialized).
- Tarball e2e green (real Claude runs; proves all-seven ship + list + math/string-reversal runs).
- `agentic-hq-dev list` shows all seven from the clone.
- Runner `--help` smoke for all four migrated workflows (no Claude).
- **Cross-workspace quick-jira e2e run once for real** (Q2): needs `agentic-hq-dev` on PATH and the
  Jira MCP; creates and Done-transitions a throwaway TEST- Jira; ~up to 60 min.
- **Manual acceptance walk-through** (human + Implementer together): fresh dir + tarball install →
  `agentic-hq create-workflow -- --using=add-feature` → scaffold → commit → "collaborator" runs the
  scaffolded workflow from their own install — no clone anywhere (AC 2).

### Slice 5 — publish 0.2.0 (human-gated)

Per `docs/dev/publish-checklist.md` (AHQ-208-extended), AHQ-201 Q5 and AHQ-209 Q1:

1. Root `package.json` `version` → `0.2.0`; checklist §3 expected-skills list → all seven.
2. `pnpm build` → `cd release && pnpm pack` → tarball inspection per checklist.
3. Stale-shim cleanup (**with the human**, before registry verification):
   `pnpm uninstall --global agentic-hq` (it is a **pnpm** shim — see the brief's UPDATE), then
   re-run `npm link` so `agentic-hq-dev` is freshly linked.
4. **The human runs `npm publish` in a real Terminal** (passkey/OTP does not survive non-TTY).
5. Registry verification matrix: npx + prefix-global, Node 22 and 24, all seven list,
   string-reversal end-to-end, and the user-workspace scenario against the registry install.

## Risks/Unknowns/Concerns

- **The quick-jira e2e is a ~60-min real-Claude interactive run** that creates a real test Jira;
  it can flake on timeouts. Treat a timeout like AHQ-208 treated its flake: one standalone re-run,
  never weakened or skipped. It is also the only e2e any Jira workflow gets — full-jira's proof is
  list + `--help` smoke only (decided, AHQ-201 Q3).
- **The scaffolder rewrite has no automated proof** and its real test (the manual walk-through)
  comes late. Mitigation: the Command 03 checks now run the real Workflow Build (2), so a scaffolded
  workflow gets a genuine compile check during creation.
- **Publish is irreversible** (npm allows no re-publish of a version). Everything before
  `npm publish` is rehearsed against the packed tarball; the human runs the publish itself.
- **After the shim cleanup the accidental `agentic-hq` dev alias disappears** — the human's muscle
  memory `agentic-hq …` will then hit the registry install (or nothing) instead of the clone; use
  `agentic-hq-dev` for dev runs from then on.
- The four newly shipped SKILL.md descriptions become the template's generic one in `list` output —
  decided (byte-identical template), noting it so nobody reads it as a regression.

## Follow-up Ideas

- **AHQ-207** (already ticketed): the human's full add-feature run on the Ubuntu VM against a fresh
  npm install of the published 0.2.0.
- **AHQ-199** (already ticketed): the full README/docs naming pass.
- **AHQ-203** (already ticketed): declared registry dependency / runner resolve hook for
  third-party workflow releases.

## Human Approval Confirmation

Approved by the human at the Planner's approval gate on 2026-08-21 ("approved"), with no changes
requested and no conditions attached. What was approved: this plan as written — the five slices
(the four workflow migrations, the relay renames + scaffolder teaching rewrite, the single
release/hygiene flip, the restore-to-working proof including one real cross-workspace quick-jira
e2e run and the manual `create-workflow -- --using=add-feature` walk-through, and the human-gated
0.2.0 publish with the pnpm shim cleanup), the test approach (no new test files; existing-suite
expectation flips as each slice's RED), and the stated risks. The workflow continues to the
Implementer.

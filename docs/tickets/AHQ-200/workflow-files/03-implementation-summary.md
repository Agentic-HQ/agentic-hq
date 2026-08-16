# AHQ-200 — Implementation Summary

## Summary Of Work Done

Eliminated the `AGENTIC_HQ_WORKSPACE_ROOT` environment variable from the working system and
renamed the obsolete "AHQ workspace" concept to "AHQ package", following the approved five-stage
plan.

- **Stage 1 — Core injection.** The three `Workspace` classes now receive the existing
  `AhqPackageRoot` value object by constructor injection instead of reading the env var.
  `WorkspaceImpl` gained a required third parameter and compares `rootDir` against it;
  `AhqWorkspaceImpl` returns the injected root (the env-var read **and** its `?? process.cwd()`
  fallback are gone, per brief Q3) and no longer exports `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR`;
  `CurrentUserWorkspaceImpl` passes the injected root to its delegate. `CompositionRoot`,
  `WorkflowSearchResultsImpl`, and `app.ts` supply the root from the `AhqRuntimeParams` already in
  hand. Every construction site is compiler-enforced — a missing root is a TypeScript error, not a
  silent cwd default.
- **Stage 2 — The workflow-program seam + relay rename.** Added
  `WorkflowRuntime.getAhqPackageRoot()` (implemented by `DefaultWorkflowRuntime` from its parsed
  argv). Migrated `add-feature-cli.ts` off the env var: its env-var constant, read, and fail-fast
  block are deleted (`DefaultAhqCommandLine` already fails fast earlier and louder on a missing
  `--ahq-package-root`), and its broadcast string now says `ahq-package-root=…`. The four
  `commands/add-feature/0?-*.md` files were renamed in lockstep (6 variable occurrences + the
  `# Skill & bundled-docs dirs (derived from the ahq package root)` prose line in each).
- **Stage 3 — Dual-writes deleted.** Removed `process.env.AGENTIC_HQ_WORKSPACE_ROOT = packageRoot`
  from both bin wrappers, together with the now-resolved REFACTOR/UPDATE comment blocks that asked
  for exactly this work (the explicit-params comments above the invocations were kept). Updated the
  four env-var mentions in the two dev docs.
- **Stage 4 — The rename.** `AhqWorkspaceImpl` → **`AhqPackageImpl`** (file renamed to
  `ahq-package-impl.ts`, display-name const → `AHQ_PACKAGE_DISPLAY_NAME = 'Agentic HQ Package'`);
  `isAhqWorkspace()` → **`isAhqPackage()`** across the `Workspace` interface, all three
  implementations, every call site, and every test stub; `CompositionRoot.getAhqWorkspace()` →
  `getAhqPackage()`; remaining `ahqWorkspace` identifiers → `ahqPackage`. Ran the grep-driven
  comment sweep over the whole `AhqWorkspace`/"AHQ workspace"/"Agentic HQ Workspace" family
  (139 hits across 24 files in `src/`+`tests/`+`bin/`), resolving each as a renamed identifier,
  an updated comment, or a deleted line. `AhqPackageImpl` carries the agreed **REFACTOR LATER**
  comment pointing at [AHQ-206](https://agentic-hq.atlassian.net/browse/AHQ-206). Applied the
  dev-docs rename ripple (the four verified stale lines), deliberately leaving the
  `AHQWorkspaceWorkflowSearchResult` pseudocode teaching names at
  `project-design-requirements.md:128/133/139` untouched — they are hypothetical names that never
  existed in code, so the rename does not falsify them.
- **The ticket's one sanctioned observable change** landed in `listing-formatter.ts`: the header
  label is now `Agentic HQ Package:` and the same-directory message is
  `Same as Agentic HQ Package (running from within the AHQ package directory)`.

## Files Changed/Added/Deleted

**Source — `src/` (14)**

| File | State |
| --- | --- |
| `src/workflow-discovery/workspace/ahq-package-impl.ts` | **added** (renamed from `ahq-workspace-impl.ts`) |
| `src/workflow-discovery/workspace/ahq-workspace-impl.ts` | **deleted** (renamed to the above) |
| `src/workflow-discovery/workspace/workspace-impl.ts` | changed |
| `src/workflow-discovery/workspace/current-user-workspace-impl.ts` | changed |
| `src/workflow-discovery/interfaces/workspace.ts` | changed |
| `src/workflow-discovery/interfaces/ahq-file.ts` | changed (comment only) |
| `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts` | changed |
| `src/kernel/composition-root.ts` | changed |
| `src/cli/app.ts` | changed |
| `src/cli/listing/listing-formatter.ts` | changed |
| `src/interfaces/workflow-runtime.ts` | changed |
| `src/workflow-runtime/default-workflow-runtime.ts` | changed |
| `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` | changed |
| `src/tools/marshalled-io-tools/claude-code/default-claude-code-tool.ts` | changed (comment only) |

**Entry points — `bin/` (2)**: `bin/agentic-hq.cjs`, `bin/agentic-hq-prebuilt.cjs` — both **changed**.

**add-feature workflow (5)**: `skills/add-feature/ts-workflow/src/add-feature-cli.ts` and
`commands/add-feature/01-researcher.md`, `02-planner.md`, `03-implementer.md`, `04-reviewer.md`
(all under `.agentic-hq/plugins/agentic-hq-demos-plugin/`) — all **changed**.

**Dev docs (2)**: `docs/dev/how-agentic-hq-works.md`, `docs/dev/project-design-requirements.md` —
both **changed**.

**Tests (17)**

| File | State |
| --- | --- |
| `tests/unit/workflow-discovery/workspace/ahq-package-impl.unit.test.ts` | **added** (renamed from `ahq-workspace-impl.unit.test.ts`) |
| `tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts` | **deleted** (renamed to the above) |
| `tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts` | changed |
| `tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts` | changed |
| `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts` | changed |
| `tests/unit/kernel/composition-root.unit.test.ts` | changed |
| `tests/unit/workflow-runtime/default-workflow-runtime.unit.test.ts` | changed (new test added) |
| `tests/unit/cli/listing/listing-formatter.unit.test.ts` | changed |
| `tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts` | changed |
| `tests/unit/claude-code-tool/claude-code-tool-with-injected-io-marshaller.unit.test.ts` | changed |
| `tests/unit/claude-code-tool/claude-code-tool-with-injected-config.unit.test.ts` | changed (stub rename) |
| `tests/unit/io/marshalling/json-file-io-marshaller-session.unit.test.ts` | changed (stub rename) |
| `tests/unit/tools/claude-code/claude-command-builder.unit.test.ts` | changed (stub rename) |
| `tests/unit/tools/claude-code/default-claude-code-tool.unit.test.ts` | changed (stub rename) |
| `tests/unit/tools/marshalled-cli-tool.unit.test.ts` | changed (stub rename) |
| `tests/unit/workflow/claude/claude-workflow-command-builder.unit.test.ts` | changed (stub rename) |

**User docs (1)**: `docs/glossary.md` — **changed** at the approval gate, at the human's request.
See `## Approval Gate Changes` below for what and why.

## Tests Added/Updated And Test Results

**New test (true RED-first).** `default-workflow-runtime.unit.test.ts` — "exposes the
AhqPackageRoot parsed from the constructor argv via getAhqPackageRoot()". Ran RED first (failed:
method did not exist), then GREEN after implementing the seam.

**Updated tests.** The 7 Stage-1 files were rewritten to construct with an injected
`AhqPackageRoot` instead of stubbing the env var, each existing assertion re-expressed rather than
weakened — including the deliberately *replaced* cwd-fallback test, whose intent ("root comes from
the sanctioned source") is now asserted against injection. Stage 4 then updated the listing-formatter
assertions to the new labels and renamed `isAhqWorkspace` → `isAhqPackage` in every stub/fake.

**RED/GREEN evidence per stage:**

| Stage | RED | GREEN |
| --- | --- | --- |
| 1 | 12 behavioural failures + `TS2554: Expected 0 arguments, but got 1` at every construction site | 7 files / 36 tests pass; `pnpm validate` 4/4 |
| 2 | 1 failure (new `getAhqPackageRoot` test only) | 6 tests pass; `pnpm validate` 4/4 (165 tests) |
| 3 | n/a (bin wrappers are untested `.cjs` shims — nets are the suites + the listing diff) | `pnpm validate` 4/4; listing **byte-identical** to baseline |
| 4 | 12 files / 32 tests failing on the new names | `pnpm validate` 4/4 (165 tests) |

**Final `pnpm validate` (repo root): all four checks pass — typecheck, lint, format, 165 unit
tests (37 files).**

**Manual/real-run testing (commands and outcomes):**

- `./bin/agentic-hq.cjs list` — run after Stage 1 and again after Stages 3 and 4. Real CLI, real
  plugin discovery. Working throughout.
- **Listing diff vs baseline** (baseline captured before Stage 3 into
  `temp/AHQ-200/list-baseline-before-stage3.txt`):
  - after Stage 3 (dual-writes deleted): `diff` reports **no differences** — proving injection had
    already fully replaced the env var.
  - after Stage 4: `diff` reports **exactly two changed lines** — the sanctioned label change
    (`Agentic HQ Workspace:` → `Agentic HQ Package:`, and the "Same as…" message). AC 2 + AC 4.
- `pnpm exec tsx src/add-feature-cli.ts --build-mode=build-first --ahq-package-root=… --help` —
  the migrated add-feature CLI runs correctly with the explicit parameters only (no env var).
- **Grep gate AC 1:** `grep -rn AGENTIC_HQ_WORKSPACE_ROOT` (excluding `docs/jira-docs/`,
  `docs/tickets/`, `dist/`, `release/`, `node_modules/`, `temp/`) returns **only** the
  AHQ-201-scoped files — the 5 unmigrated SKILL.mds/commands, the 2 unmigrated CLIs
  (`create-workflow-cli.ts`, `add-feature-detailed-example-cli.ts`), the create-workflow
  templates, and the DRAFT doc. **Nothing** in `src/`, `tests/`, `bin/`, `docs/dev/`, or the
  add-feature skill.
- **Grep gate AC 3:** case-insensitive grep for `ahqworkspace` / `isAhqWorkspace` / `AHQ workspace`
  / `Agentic HQ Workspace` over `src/`, `tests/`, `bin/`, and the add-feature skill+commands
  returns **nothing**. The same grep over `docs/dev/` returns only the three expected
  `AHQWorkspaceWorkflowSearchResult` pseudocode lines.

**`pnpm test:integration`** — 7 files. One failure:
`tests/integration/build/publish-guards.integration.test.ts`, failing in `beforeAll` when it runs
`scripts/build-release.cjs`. **This is pre-existing and not caused by this ticket** — verified by
stashing all AHQ-200 changes (`git stash -u`) and re-running the suite on the clean pre-ticket
tree, where it fails identically. It also **passes when run on its own** (3/3) on the AHQ-200 tree,
so the cause is suite-level interference: `publish-guards` and `build-determinism` both invoke
`build-release.cjs` against the same `release/` directory. Same pass/fail profile as before the
ticket, as required.

**`pnpm test:e2e:cross-workspace-demo-math-workflow`** — **PASSED** (1 file / 1 test, 102.9s). Real
Claude, run from a fresh temp workspace at `/tmp/agentic-hq-test-workspaces/test-ws-…` (so the user
workspace genuinely differs from the AHQ package — the **U ≠ P** case, where both workspaces list and
register and the dedup guard must *not* fire). This exercises the whole explicit-parameter chain
end-to-end with the env var gone, and the workflow produced its expected output number. See
Approved Deviations below for why this single e2e replaced the full suite.

**The U = P case (added at the human's request during the approval gate).** The e2e above covers
U ≠ P only, so the same workflow was also run **from the repo root**, where the AHQ package, the AHQ
workspace, and the user workspace are all one directory and the dedup guard *must* fire:
`./bin/agentic-hq.cjs math -- --input-number=11` → **`Output number: 5`**, exit 0 (the value the
e2e asserts: 11 ×2 = 22, +3 = 25, ÷5 = 5). Real Claude, three chained steps. This is the only path
that exercises the guard's U = P branch in `ClaudeCommandBuilder.getClaudeCliPluginDirArgs()` —
where a *false* `isAhqPackage()` would have passed Claude duplicate `--plugin-dir` flags — against a
real Claude process rather than a unit assertion.

The rest of the U = P behaviour is covered by unit tests plus the listing runs (the `agentic-hq
list` baseline and both diffs were themselves U = P runs from the repo root, and the surviving
`Same as Agentic HQ Package …` line is the guard firing):

| U = P consequence | Coverage |
| --- | --- |
| No double registration of shipped workflows | `current-user-workspace-impl.unit.test.ts:54` (asserts 0 registrations) |
| No repeated listing block — "Same as…" instead | `workflow-search-results-impl.unit.test.ts:87` + every real `agentic-hq list` run |
| No duplicate `--plugin-dir` flags to Claude | `claude-command-builder.unit.test.ts:116` + the live U = P math run above |
| `isAhqPackage()` true on matching roots | `workspace-impl.unit.test.ts:120`, `current-user-workspace-impl.unit.test.ts:103` |

**The prebuilt wrapper (added at the human's request during the approval gate).** Rather than the
whole tarball e2e (whose slow test allows ~17 min for a real Claude math run), the human asked for a
quicker single test covering the prebuilt path. `prebuilt-tarball-install-runs-math-workflow.e2e.ts`
turns out to contain exactly one: **"should list workflows via the installed bin from a clean
workspace"** — no Claude invocation. Run on its own:

```
pnpm vitest run --config vitest.e2e.config.ts \
  tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts \
  -t "should list workflows via the installed bin from a clean workspace"
```

**PASSED** (1 passed / 3 skipped, 8.7s). Its `beforeAll` really does `pnpm build` → `pnpm pack` →
`npm install -g --prefix …` the tarball, then the test invokes the **installed** bin
(`bin/agentic-hq-prebuilt.cjs` — the wrapper whose env-var dual-write this ticket deleted) from a
clean temp workspace. The captured output proves the prebuilt path resolves its root with no env
var at all:

```
  Agentic HQ Package: …/install-prefix/lib/node_modules/agentic-hq
    Plugin: agentic-hq-demos-plugin
      agentic-hq add-feature …   /   agentic-hq math …
  Local Workspace: /private/tmp/agentic-hq-test-workspaces/test-ws-…
```

The package root points at the **npm install location** (not the repo), the plugins inside the
installed artifact were discovered, and the new label rendered — from a wrapper that now passes
`--ahq-package-root` and nothing else.

## Approved Deviations From The Plan

**One deviation (2026-08-14): the full `pnpm test:e2e` suite was not run.** The human stopped it as
too slow and chose targeted tests instead. `pnpm test:integration` was still run in full. Recorded
as the matching UPDATE in `02-implementation-plan.md` (Stage 5). Three e2e-level tests were run in
its place, covering this ticket's whole risk surface (evidence in the test-results section above):

| Risk covered | Test | Result |
| --- | --- | --- |
| Dev wrapper, full chain, U ≠ P | `test:e2e:cross-workspace-demo-math-workflow` | Pass |
| Dev wrapper, U = P (dedup guard fires) | `agentic-hq math` from the repo root | Pass — `Output number: 5` |
| Prebuilt wrapper, installed tarball | tarball e2e, `-t "should list workflows via the installed bin from a clean workspace"` | Pass |

Still unrun: the other three tarball tests, the quick-jira, string-reversal and user-workspace
listing e2es. `test:e2e:agentic-hq-cli-string-reversal` was expected to stay red regardless (the
recorded AHQ-197 marker, unchanged by this ticket).

## Out Of Plan Follow-up Ideas/Concerns

- **`docs/glossary.md` — now DONE, no longer a Reviewer follow-up.** This was originally listed here
  as Review-stage work (the human's own REFACTOR note in that file asked for it). At the approval
  gate the human asked whether the Implementer was better placed to do it, given full context, and
  directed it to be done now. It is complete — see `## Approval Gate Changes`. The Reviewer should
  review this glossary rewrite as part of the change, **not** treat it as outstanding work.
- **Pre-existing `publish-guards` suite interference** (detailed above): two integration tests race
  on the same `release/` tree via `build-release.cjs`. Unrelated to AHQ-200 but worth its own
  ticket — the fix is likely staging into per-test directories or serialising those two files.
- **AHQ-201** remains the ticket that makes a whole-repo grep clean (the 5 unmigrated SKILL.mds, the
  2 legacy CLIs, and the create-workflow scaffolding templates still carry the env var by design).
- **AHQ-206** (the `Workspace`/`PluginSource` interface split) is recorded as the REFACTOR LATER
  comment on `AhqPackageImpl`, and **AHQ-205** (the name-collision dedup bug) was left strictly
  untouched — `isAhqPackage()` still does plain string equality, exactly as `isAhqWorkspace()` did.

## Approval Gate Changes

**No source code changed at this gate** — the implementation is exactly as described above. Three of
the human's four points were questions answered with evidence (U = P coverage, a quicker prebuilt
e2e, and why the string-reversal e2e is red); the extra tests they prompted are recorded under
Approved Deviations. The fourth produced one file change.

**`docs/glossary.md` (changed).** The human judged the Implementer better placed than the Reviewer
to do this, having the full context, and moved it forward from the Review stage. Its `//REFACTOR:`
note is deleted, as that note instructed. Changes:

- Added `AHQ package` and ``AHQ package root (`ahq-package-root`)`` entries, the latter linked to
  the brief's *Three Root Concepts* section.
- Updated `Local workspace` (now including the overlap case: run from an AHQ clone root, one
  directory is both roles and the CLI searches it once, listing `Same as Agentic HQ Package`),
  `agentic-hq install dir`, and the `Where things live` table row.
- Kept `Agentic HQ workspace` as a human-facing term, with **no Deprecated section** — the phrase is
  still valid English for a contributor's checkout, and such sections rot.
- Per the human's steer, the glossary carries only currently-relevant information in
  term-and-definition form: no old-naming history (the rename left no old identifiers anyway) and no
  narrative prose under the grouping heading.

`pnpm format:check` passes and the links/anchors were verified. Docs-only, so the test results above
are unaffected.

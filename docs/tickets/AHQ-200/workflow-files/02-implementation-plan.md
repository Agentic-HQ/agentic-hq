# AHQ-200 — Implementation Plan

Eliminate `AGENTIC_HQ_WORKSPACE_ROOT` from the working system by constructor-injecting the
existing `AhqPackageRoot` value object, then (distinct final stage) rename the "AHQ workspace"
concept to "AHQ package". Zero functionality change except the one sanctioned listing-label
change (brief Questions 4/5).

**Test-first justification:** every stage below is either (a) a behaviour-preserving refactor of
already-tested code — where the *updated* tests are written first and the initial run fails as a
TypeScript compile error (a valid RED per Uncle Bob), or (b) one genuinely new seam
(`WorkflowRuntime.getAhqPackageRoot()`) — a classic RED-first unit test. Each stage runs
RED → CODE → GREEN, and the full suite is re-run at each stage end so the zero-change contract
is checked continuously, not just at the finish.

> NOTE: No REFACTOR stage as it adds too much complexity for this simple add-feature workflow (do this in your own custom workflow if reqd)

**Key design decision — inject the value object, not a string:** the classes receive the existing
`AhqPackageRoot` value object (`src/interfaces/ahq-package-root.ts`, type-only import), not a raw
`string`. It already models exactly this concept (AHQ-197), and the repo convention is to wrap
stored primitives in value objects. Required parameter, no default (brief Question 3).

---

## Stage 1 — Core injection: env var → injected `AhqPackageRoot` (names unchanged)

One atomic RED → CODE → GREEN: the constructor-signature changes ripple as one compile unit
(`WorkspaceImpl`'s new parameter breaks both delegating classes immediately), so splitting into
per-class cycles would leave non-compiling intermediate states.

### Tests Being Created (Stage 1 — updates to 7 existing unit-test files, RED first)

| Test file | Change |
| --- | --- |
| `tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts` | Construct with 3rd param; `isAhqWorkspace()` asserted against the *injected* root (true when rootDir equals it, false otherwise) — no env stubbing |
| `tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts` | All tests construct with an injected root. The env-var test becomes "getRoot() returns the injected root"; the **cwd-fallback test is replaced** (its intent — "root comes from the sanctioned source" — re-expressed against injection, per brief Q3), not dropped |
| `tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts` | Construct with injected AHQ package root; dedup-guard tests compare cwd to the injected value instead of a stubbed env var |
| `tests/unit/workflow-discovery/workflow-listing/workflow-search-results-impl.unit.test.ts` | Construct with injected root (no env stubbing) |
| `tests/unit/kernel/composition-root.unit.test.ts` | Drop the `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` import and `vi.stubEnv`; assert `getAhqWorkspace().getRoot()` equals the root inside the `AhqRuntimeParams` supplied at construction |
| `tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts` | Supply the root to the two no-arg constructions (lines 36–37) |
| `tests/unit/claude-code-tool/claude-code-tool-with-injected-io-marshaller.unit.test.ts` | Supply the root to the two no-arg constructions (lines 30–31) |

Behavioural intent is preserved test-by-test (per `feedback_preserve_test_behavioural_intent_when_modernising`)
— each existing assertion is re-expressed against injection, never weakened.

### Implementation Changes (Stage 1)

- `src/workflow-discovery/workspace/workspace-impl.ts` — 3rd ctor param
  `private readonly ahqPackageRoot: AhqPackageRoot`; delete the private env-var const;
  `isAhqWorkspace()` becomes `return this.rootDir === this.ahqPackageRoot.getPath();`
- `src/workflow-discovery/workspace/ahq-workspace-impl.ts` — required ctor param
  `private readonly ahqPackageRoot: AhqPackageRoot`; `getRoot()` returns
  `this.ahqPackageRoot.getPath()` (env-var read **and** `?? process.cwd()` fallback gone — brief
  Q3); delete the exported `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` const; delegate passes the param on.
- `src/workflow-discovery/workspace/current-user-workspace-impl.ts` — required ctor param, passed
  into its `WorkspaceImpl` delegate (rootDir stays `process.cwd()` — behaviour identical).
- `src/kernel/composition-root.ts` — `getAhqWorkspace()` / `getCurrentUserWorkspace()` pass
  `this.ahqRuntimeParams.getAhqPackageRoot()`; delete the "Legacy reader… AHQ-200 migrates"
  comment (resolved by this change).
- `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts` — ctor gains
  `ahqPackageRoot: AhqPackageRoot`, passed into both workspace constructions.
- `src/cli/app.ts` — passes it:
  `new WorkflowSearchResultsImpl(ahqCommandLine.getAhqRuntimeParams().getAhqPackageRoot())`.
- **Comment hygiene (Stage 1 scope):** every SRP header and method docstring that describes the
  env-var mechanism is rewritten in the same edit — `ahq-workspace-impl.ts` class header +
  `getRoot()` docstring, `workspace-impl.ts:73` docstring ("iff rootDir equals the
  AGENTIC_HQ_WORKSPACE_ROOT env var"), `workflow-search-results-impl.ts:21` ("Knows Nothing
  About: Where workspace roots are resolved from" — after injection it visibly receives the
  root), and the test files' header comments describing env-var sourcing. No stale env-var prose
  survives Stage 1.

**GREEN gate:** `pnpm validate` in the repo root.

## Stage 2 — Expose the root to workflow programs; migrate `add-feature-cli`; rename the relay variable

### Tests Being Created (Stage 2)

- **New test (true RED-first)** in the existing
  `tests/unit/workflow-runtime/default-workflow-runtime.unit.test.ts`:
  `getAhqPackageRoot()` returns the `AhqPackageRoot` parsed from the constructor argv (assert
  `.getPath()` equals the `--ahq-package-root=` value passed in).
- The four command `.md` files have no unit test — the relay rename is proven by the **live
  add-feature run** in Stage 5 (AC 5).

### Implementation Changes (Stage 2)

- `src/interfaces/workflow-runtime.ts` — add to the interface:

  ```ts
  /** The AhqPackageRoot the framework passed — where the running agentic-hq package lives */
  getAhqPackageRoot(): AhqPackageRoot;
  ```

- `src/workflow-runtime/default-workflow-runtime.ts` — implement:
  `return this.ahqCommandLine.getAhqRuntimeParams().getAhqPackageRoot();`
  (The `AhqPackageRoot` type is already exported from the public barrel
  `src/tools/marshalled-io-tools/claude-code/index.ts` — no barrel change needed. `build-mode`
  is deliberately **not** exposed: the shared runner stays its only consumer.)
- `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature/ts-workflow/src/add-feature-cli.ts`
  — delete the env-var const, read (line 54), and the lines 55–63 fail-fast block
  (`DefaultAhqCommandLine` already fails fast, earlier and louder, when `--ahq-package-root` is
  missing — no silent path is created); broadcast string becomes:

  ```ts
  const allVariables =
    `The variables used in this workflow are: ahq-package-root=${runtime.getAhqPackageRoot().getPath()}` +
    ` and ticket-id=${options.ticketId}`;
  ```

- The four `commands/add-feature/0?-*.md` files — every `agentic-hq-workspace-root-dir` becomes
  `ahq-package-root` (~6–7 occurrences per file: example string, parse instruction, variable
  block, required-validation line), producer and parsers in lockstep (brief Q2). **Plus prose,
  not just the variable string:** each file also has the comment line
  `# Skill & bundled-docs dirs (derived from the workspace root)` (~line 54) →
  `(derived from the ahq package root)`. The sweep is a per-file grep for `workspace`, so no
  prose mention survives.

**GREEN gate:** `pnpm validate`.

## Stage 3 — Delete the dual-writes; update dev docs; grep + listing checks

Before this stage, capture a baseline: `agentic-hq list > /tmp-baseline` (kept in the repo temp
dir `temp/AHQ-200/`).

### Tests Being Created (Stage 3)

None new — the bin wrappers are untested `.cjs` shims. The nets are: the full existing suites,
a **byte-identical `agentic-hq list` diff** against the baseline, and the grep AC below.

### Implementation Changes (Stage 3)

- `bin/agentic-hq.cjs` — delete line 27 (`process.env.AGENTIC_HQ_WORKSPACE_ROOT = packageRoot;`)
  and the now-resolved NOTE-RE-REFACTOR + UPDATE comment block (lines 18–26): the note asked for
  exactly this work and is complete — the explicit-params comment above `execFileSync` stays.
- `bin/agentic-hq-prebuilt.cjs` — delete line 25 and the dual-write halves of its comment
  (lines 21–24); keep the explicit-params explanation.
- `docs/dev/how-agentic-hq-works.md` (3 mentions: mermaid line 31, lines 192, 335) and
  `docs/dev/project-design-requirements.md` (line 165) — replace the env-var descriptions with
  the explicit `--ahq-package-root` parameter (minimal edits only; the doc lines the Stage 4
  *rename* makes stale are handled by Stage 4's dev-docs ripple step; the full docs pass is
  AHQ-199).
- **Grep gate (AC 1):** `grep -rn AGENTIC_HQ_WORKSPACE_ROOT` over the repo (excluding
  `docs/jira-docs/`, `docs/tickets/`, `dist/`, `release/`, `node_modules/`) finds **only** the
  AHQ-201-scoped files: the 5 unmigrated SKILL.mds, the 2 unmigrated CLIs
  (`create-workflow-cli.ts`, `add-feature-detailed-example-cli.ts`), the create-workflow
  command/scaffold templates, and the DRAFT/detailed-example docs. Nothing in `src/`, `tests/`,
  `bin/`, `docs/dev/`, or the add-feature skill.

**GREEN gate:** `pnpm validate`, then `agentic-hq list` byte-identical to the baseline.

## Stage 4 — The rename stage (only after Stages 1–3 are fully green)

### Tests Being Created (Stage 4 — updates, RED first)

- `tests/unit/cli/listing/listing-formatter.unit.test.ts` — label assertions updated to
  `Agentic HQ Package:` and `Same as Agentic HQ Package (running from within the AHQ package directory)`.
- `ahq-workspace-impl.unit.test.ts` → renamed `ahq-package-impl.unit.test.ts` (mirrors src);
  display-name assertion becomes `'Agentic HQ Package'`.
- All test stubs/fakes implementing `Workspace` get `isAhqWorkspace` → `isAhqPackage`
  (mechanical, compiler-enforced): `listing-formatter`, `claude-command-builder`,
  `default-claude-code-tool`, `marshalled-cli-tool`, `claude-workflow-command-builder`,
  `claude-code-tool-with-injected-config`, `json-file-io-marshaller-session`, plus the
  workspace/kernel tests from Stage 1.

### Implementation Changes (Stage 4)

- Class: `AhqWorkspaceImpl` → **`AhqPackageImpl`**; file → `ahq-package-impl.ts` (grep for
  references before the rename, per repo rule); display-name const →
  `AHQ_PACKAGE_DISPLAY_NAME = 'Agentic HQ Package'`.
- Interface + all 3 implementations + every call site: `isAhqWorkspace()` → **`isAhqPackage()`**
  (`workspace.ts`, `workspace-impl.ts`, `ahq-package-impl.ts`, `current-user-workspace-impl.ts`,
  `claude-command-builder.ts:127`, `listing-formatter.ts:91`, `current-user-workspace-impl.ts:40`).
- All remaining `ahqWorkspace`/`AhqWorkspace` identifiers → `ahqPackage`/`AhqPackage`:
  `CompositionRoot.getAhqWorkspace()` → `getAhqPackage()`, fields/params in
  `ClaudeCommandBuilder`, `DefaultClaudeCodeTool`, `WorkflowSearchResultsImpl`, tests.
- **Comment sweep (grep-driven, verified inventory 2026-08-14: ~120 case-insensitive hits for
  the `AhqWorkspace`/"AHQ workspace"/"Agentic HQ Workspace" family across ~25 files in
  `src/`+`tests/`+`bin/`):** every hit is resolved as renamed identifier, updated comment, or
  deleted line. Named comment-only fixes beyond the files already listed:
  `src/workflow-discovery/interfaces/ahq-file.ts:2` ("A file on disk within the AHQ workspace" →
  "…within the AHQ package"); `src/workflow-discovery/interfaces/workspace.ts:31` docstring
  ("equals the AHQ workspace root" → "…the AHQ package root");
  `current-user-workspace-impl.ts:61` docstring (same phrase); `workspace-impl.ts:36`
  display-name example ("e.g. `Agentic HQ Workspace`" → "`Agentic HQ Package`");
  `listing-formatter.ts` header + method comments ("Same as AHQ" wording).
- **Deliberately left alone (generic-workspace language that stays true):** `workspaceRoot`
  fields/params in `plugin-impl.ts` / `plugin-directory-impl.ts` and their tests (plugins live
  in both the package and the user workspace — and `AhqPackageImpl` still implements
  `Workspace`, per the AHQ-206 deferral); "workspace root as the CLI working directory" in
  `marshalled-cli-tool.ts:8` (the *user* workspace — genuinely a workspace);
  `pnpm-workspace.yaml` comments (pnpm's own workspace concept, unrelated).
- `listing-formatter.ts` — `SAME_AS_AHQ_MESSAGE_TEXT` becomes the **exact Q5 wording**:
  `Same as Agentic HQ Package (running from within the AHQ package directory)` — this is the
  ticket's single sanctioned observable change.
- `AhqPackageImpl` gets the agreed **"REFACTOR LATER:"** extended comment: it keeps implementing
  `Workspace` for now; the interface split (`PluginSource` extraction) is deferred to
  [AHQ-206](https://agentic-hq.atlassian.net/browse/AHQ-206) (description in
  `docs/tickets/AHQ-200/workflow-files/supporting-docs/AHQ-206_later_refactor_jira_description.md`).
- **Dev-docs rename ripple** (added at the human's request during plan review): fix the four
  verified doc lines this stage's rename makes stale —
  `docs/dev/how-agentic-hq-works.md:325` ("the AHQ workspace (where the CLI itself lives)" →
  "the AHQ package …"); `docs/dev/project-design-requirements.md:37` ("…or the AHQ workspace" →
  "…or the AHQ package"); `:165` (Concept Table row → "The AHQ package | `Workspace` |
  `AhqPackageImpl` | Root injected via `--ahq-package-root`"); `:177` (style-guide example →
  "The **AhqPackageImpl** creates a **WorkspaceImpl** with the injected package root and
  delegates to it."). **Deliberately untouched:** the lazy-delegation pseudocode at
  `project-design-requirements.md:128/133/139` — `AHQWorkspaceWorkflowSearchResult` is a
  hypothetical teaching name that never existed in the code, so the rename does not falsify it
  (Reviewer: do not flag as a miss). Boundary: AHQ-200 fixes only doc lines its own changes make
  stale; the full docs pass remains AHQ-199.
- **Grep gate (AC 3):** case-insensitive grep for `ahqworkspace`, `isAhqWorkspace`,
  `AHQ workspace` (prose form, catches comments), and `Agentic HQ Workspace` over `src/`,
  `tests/`, `bin/`, and the add-feature skill/commands returns nothing; the same grep over
  `docs/dev/` returns only the pseudocode teaching names above (expected residue).

**GREEN gate:** `pnpm validate`; `agentic-hq list` diff vs baseline shows **only** the two label
lines changed (AC 2 + 4).

## Stage 5 — Final verification

1. `pnpm validate` (root) — all four checks 100%.
2. `pnpm test:integration` and `pnpm test:e2e` — same pass/fail profile as before the ticket;
   `test:e2e:agentic-hq-cli-string-reversal` **stays red** (the recorded AHQ-197 marker —
   unchanged by this ticket, per the brief).

   > **UPDATE 1 (2026-08-14):** the **full** `pnpm test:e2e` suite is **not** run — the human
   > stopped it as too slow. `pnpm test:integration` still runs in full. Three targeted e2e-level
   > tests replace it, all green: `test:e2e:cross-workspace-demo-math-workflow` (whole chain with
   > real Claude, U ≠ P); `agentic-hq math` from the repo root (U = P, so the dedup guard fires);
   > and the tarball e2e's Claude-free `-t "should list workflows via the installed bin from a
   > clean workspace"` (the prebuilt wrapper, whose env-var write this ticket deletes).
   >
   > **UPDATE 2 (2026-08-16):** `docs/glossary.md` moved from Review-stage to Implementer-stage at
   > the human's direction, the Implementer having the full context. Scope: name the AHQ package /
   > package-root concepts with a link to the brief's *Three Root Concepts*, keep "Agentic HQ
   > workspace" as a human-facing term, no Deprecated section, currently-relevant information only.
   > Done; the human's `//REFACTOR:` note in that file is deleted as it instructed.

3. **Manual validation (AC 5):** the human runs a live add-feature workflow
   (`agentic-hq add-feature --ticket-id …`) and confirms the four agents receive and parse
   `ahq-package-root` end-to-end. (Running the *next* ticket's workflow naturally satisfies this.)

## Risks/Unknowns/Concerns

- **AHQ-205 adjacency:** `isAhqPackage()` dedup still does plain string equality — the
  content-collision crash is deliberately untouched (scheduled after this ticket). No
  path-normalisation "improvements" will be made while migrating it.
- **Layering:** `workspace-impl.ts` (workflow-discovery) gains a type-only import of
  `AhqPackageRoot` from `src/interfaces/` — consistent with existing cross-imports
  (e.g. `workflow-search-results-impl.ts` → `cli/listing`), but flagging it for the review.
- **add-feature fail-fast message changes:** deleting the CLI's own env-var check means a missing
  root now fails in `DefaultAhqCommandLine` with its message instead of the old env-var message.
  Same loud-uncaught-throw outcome, different text — technically observable, but only on a
  broken invocation the shared runner can no longer produce.
- **Stage 1 is one large atomic cycle** (~13 files RED at once). Unavoidable: a required
  constructor parameter isn't incrementally adoptable. The compile errors are themselves the
  finite checklist of construction sites (brief Q3's reassurance).

## Follow-up Ideas

- **AHQ-201:** migrate the 5 unmigrated SKILL.mds, 2 legacy CLIs, and create-workflow templates;
  whole-repo grep-clean AC lives there.
- **AHQ-206:** split `Workspace` (`PluginSource` extraction) so the type system stops claiming
  the package is a workspace.
- **AHQ-205:** the name-collision dedup bug (after this ticket).

## Human Approval Confirmation

**Approved by the human on 2026-08-14** ("approved", no conditions attached). What was approved:
the five-stage plan above in its final revised form — Stages 1–3 (constructor injection of
`AhqPackageRoot`, the `WorkflowRuntime.getAhqPackageRoot()` seam + add-feature relay rename to
`ahq-package-root`, deletion of the bin-wrapper dual-writes), Stage 4 (the distinct
`AhqPackageImpl` / `isAhqPackage()` rename with the sanctioned listing-label change), and
Stage 5 (final verification incl. the live add-feature run). The approval followed two rounds of
human-requested revisions, both incorporated before approval: (1) the dev-docs rename-ripple
step in Stage 4 (fix the doc lines this ticket's changes falsify; full docs pass stays AHQ-199),
and (2) the explicit grep-driven comment sweep — verified inventory, named comment-only fixes
(incl. `ahq-file.ts`, the command .md prose line), the deliberately-left-alone list, and the
extended grep gates.

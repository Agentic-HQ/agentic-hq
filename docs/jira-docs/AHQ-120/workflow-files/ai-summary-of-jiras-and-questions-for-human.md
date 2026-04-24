# AI Summary: AHQ-120

**Jira**: [AHQ-120](https://agentic-hq.atlassian.net/browse/AHQ-120)
**Title**: Create New "TEMP Agentic HQ With Colours" Classwitch Override Project
**Status**: Transitioned to In Progress, assigned to Steve Halso
**Generated**: 2026-04-22

---

## My Understanding of This Task

Build a **practice / throw-away** Classwitch Override Project on disk at
`/Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120`
that overrides the current branch's `agentic-hq` (the experiment branch that AHQ-117 turned into a Classwitch Root Project).
The override replaces the `WorkflowSearchResultsImpl` service with a new
`ColourfulWorkflowSearchResultsImpl` — same behaviour, but ANSI-coloured: green header, blue AHQ section, red user section.
Expose a new `temp-agentic-hq-with-colours` CLI that delegates to `agentic-hq`'s shared `app.run()` after side-effect-importing
the override registry. The project is **never** pushed to GitHub — it's a hand-built practice run to inform the automated
`classwitch-override-workflow` in AHQ-121/122.

The Jira specifies a "full-override-repo" final layout and explicitly says:
*"Treat AHQ-117's temp test as a working reference, not a finished deliverable to copy wholesale"*.
AHQ-117's temp test at `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/` already
has functional pieces — `bin/*.cjs`, `main.ts`, `override-registry.ts`, `colourful-workflow-search-results-impl.ts`, a unit test,
the install-dev script, `package.json`, `tsconfig.json`, `vitest.unit.config.ts`, `.gitignore`.
What's **missing** from 001 (and therefore AHQ-120 must design and add):
`README.md`, `eslint.config.js`, a prettier config, `vitest.e2e.config.ts`, the e2e test itself, and a refreshed `package.json`
with e2e scripts + adjusted `file:` dependency paths.

The work is load-bearing on two silent-failure footguns that the Jira and the how-to guide repeatedly call out:
(1) the `main.ts` side-effect import of the override registry **must** come before `import { app } from 'agentic-hq/cli'`;
(2) the bin wrapper **must NOT** set `AGENTIC_HQ_WORKSPACE_ROOT` (AHQ-117 §9 moved that into `app.run()`).
Both get design-intent comments in their files — already done in 001 and must be carried over / adapted.

A secondary deliverable is **reviewing the how-to guide**
(`docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md`) against the reality of actually
building the override from scratch, and either fixing inaccuracies immediately or leaving TODO markers to fix in REFACTOR.

## Research Findings

### AHQ-117 temp test (001) — what we inherit vs what we add

Ran `find` + read every source file in 001. Concrete inventory:

| 001 has (lift as-is, with tweaks)                                                 | 001 missing (AHQ-120 adds)                           |
| --------------------------------------------------------------------------------- | --------------------------------------------------- |
| `bin/temp-agentic-hq-with-colours.cjs` (load-bearing comment block already there) | `README.md`                                         |
| `src/cli/main.ts` (3-line shape)                                                  | `eslint.config.js`                                  |
| `src/classwitch-registry/override-registry.ts`                                    | Prettier config (`.prettierrc` or equivalent)       |
| `src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts` | `vitest.e2e.config.ts`                           |
| `tests/unit/.../colourful-workflow-search-results-impl.unit.test.ts`              | `tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts` |
| `scripts/infra/install-dev-temp-agentic-hq-with-colours.sh` (with AHQ-79 warning) | Updated `package.json` scripts for e2e + lint       |
| `package.json`, `tsconfig.json`, `vitest.unit.config.ts`, `.gitignore`            | —                                                   |

**Tweak needed for 001 → 002 file paths:** 001's `package.json` has
`"agentic-hq": "file:../../agentic-hq"` and `"classwitch": "file:../../classwitch"`.
002 lives at the **same depth** (same `temp-test-workspaces/<proj-dir>/` pattern) so the `file:../../…` paths remain valid —
but double-check when lifting.

**The unit test in 001 is currently using inline structural type aliases** instead of importing real types from `agentic-hq`
(lines 12–30). A comment in the file says: *"Kept self-contained until agentic-hq's exports are widened in a later step of AHQ-117"*.
AHQ-117 has since widened exports (verified: `agentic-hq/src/index.ts` now exports `Workspace`, `WorkflowRegistry`,
`WorkflowSearchResults`, etc.). So when we lift this test into 002, we **should replace the structural aliases with
real imports** — cleaner, more realistic, matches the impl file (which already uses real imports from `agentic-hq`).

### agentic-hq public exports — confirmed sufficient

`agentic-hq/package.json` exports:
```
".":                      "./src/index.ts"
"./cli":                  "./src/cli/app.ts"
"./cli/program":          "./src/cli/agentic-hq-program.ts"
"./classwitch-registry":  "./src/classwitch-registry/root-registry.ts"
"./tools/claude-code":    "./src/tools/marshalled-io-tools/claude-code/index.ts"
```
`src/index.ts` re-exports: 5 service interfaces (`CLICommand`, `Tool`, `WorkflowCommand`, `WorkflowCommandBuilder`,
`WorkflowSearchResults`), 6 default classes (`DefaultClaudeCodeTool`, `DefaultCLICommand`, `MarshalledCLITool`,
`DefaultWorkflowCommand`, `ClaudeWorkflowCommandBuilder`, `WorkflowSearchResultsImpl`), 2 composition-helper interfaces
(`Workspace`, `WorkflowRegistry`), 2 composition-helper classes (`AhqWorkspaceImpl`, `CurrentUserWorkspaceImpl`).
**All symbols the override needs are exported.** No agentic-hq changes required.

### `app.run()` env-var resolution — confirmed live

`agentic-hq/src/cli/app.ts` now resolves `AGENTIC_HQ_WORKSPACE_ROOT` from its own `import.meta.url` if unset (lines 64–67).
The override bin wrapper must not touch this env var — confirmed and commented in 001's bin wrapper.

### E2E test pattern — found a near-identical template

`agentic-hq/tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts` is **the** template. It:
- Runs `install-dev-agentic-hq.sh` via `execSync` to `pnpm link --global` the binary
- Resolves `PNPM_HOME` onto PATH for the test process
- Creates a unique temp workspace under `/tmp/agentic-hq-test-workspaces/test-ws-{uuid}/`
- Runs `agentic-hq list` via `runCliAndLogOutput` helper
- Asserts on `Available workflows:`, `create-workflow`, `What it does: Create`

For AHQ-120 we mirror this exactly but: use the override's install script, use the override's CLI name
(`temp-agentic-hq-with-colours list`), and assert on ANSI escape codes around the header / each section.

**ANSI-stripping consideration:** because the override emits ANSI codes **unconditionally** (no TTY-detection —
it's always colourful by design), `execSync` / `execFile` piped output still contains the `\x1b[…m` sequences.
No `FORCE_COLOR=1` needed. Confirmed this is the Jira's preferred approach (§3 of add-on).

### The `runCliAndLogOutput` helper

Lives at `agentic-hq/tests/e2e/helpers/cli-test-helper-functions.ts`. The override project is a **separate package**
and can't import across package boundaries without a dep. Cleanest option: **re-implement the small helper locally**
in 002's test (or inline the `execSync` call — it's ~5 lines). The Jira doesn't require sharing infrastructure.

### Design requirements — key guidelines that apply

`docs/dev/project-design-requirements.md` + feedback memory files:
- **Tell don't ask**: `ColourfulWorkflowSearchResultsImpl` already does this — asks each `Workspace` to
  `getWorkflowListingString()` rather than querying state.
- **Avoid cached state** (`feedback_avoid_cached_state.md`): 001's impl stores workspaces in the constructor but
  re-derives the listing string on every call — good, no caching.
- **No `instanceof` / structural introspection in tests** (`feedback_no_instanceof_in_tests.md`): the unit test must
  assert observable behaviour (ANSI codes in returned string, mock workspace called with registry), not type identity.
- **Classwitch Root/Override files must comment design intent** (`feedback_classwitch_root_project_comments.md`):
  `main.ts`, `bin/*.cjs`, `override-registry.ts`, `colourful-workflow-search-results-impl.ts` all need design-intent
  comments. 001's files already have these (verified) — lift verbatim.
- **Test file per class** (`feedback_unit_test_file_per_class.md`): one test file, named for the impl class.
- **Constructor injection + optional-with-defaults** (`feedback_constructor_injection_delegation.md` + how-to guide Step 3):
  the no-arg `new Klass()` from classwitch requires optional-with-defaults constructor args. 001's impl follows this.

### The how-to guide — first-pass sanity check

Read `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` in full.
Looks **broadly correct** and matches the 001 temp test. Things to verify during implementation (catch these as we
actually follow it):
- Step 1 `package.json` devDependencies list omits `commander` from devDeps but shows it in dependencies — that's
  because the override inherits `commander` via `agentic-hq`'s exports chain. The 001 project lists `commander`
  under dependencies too. **Worth confirming** whether the override actually *needs* `commander` as a direct dep
  or whether it comes in transitively — this is a minor but real point of potential confusion in the guide.
- No section on lint/prettier configs — might need adding after we design 002's `eslint.config.js`.
- No section on setting up `vitest.e2e.config.ts` — same.

Will note issues as TODO/REFACTOR comments in the guide itself during the REFACTOR phase of each test cycle, per the Jira's
instruction *"either: (1) fix them straight away or (2) Put a TODO / REFACTOR comment"*.

## Project Design Requirements

**File**: `docs/dev/project-design-requirements.md` (found)

Most relevant requirements for this Jira:

1. **Interface / concrete-class pair for every concept** — Satisfied by design: `WorkflowSearchResults` interface +
   `ColourfulWorkflowSearchResultsImpl` class. Naming convention (`Impl` suffix) already followed by 001.
2. **Tell, don't ask** — The impl must *ask* each `Workspace` to `getWorkflowListingString()`, not extract state and
   format it here. 001's impl already does this correctly.
3. **Avoid cached state** — Workspaces are stored in the constructor (constructor injection) but the listing string is
   freshly derived on every call. No field caching of listing output.
4. **Classwitch Root/Override file comments** — `main.ts`, `bin/temp-agentic-hq-with-colours.cjs`, `override-registry.ts`,
   and `colourful-workflow-search-results-impl.ts` must each carry a "why the shape is what it is" comment block.
   001 has these already.
5. **Concept Table / Data Dictionary / English Language Description** — design-requirements ask for these "during
   planning" for new designs. AHQ-120 is a very thin wrapper around an already-established design (AHQ-117 / AHQ-106).
   **No new concepts are introduced** — `WorkflowSearchResults`, `Workspace`, `WorkflowRegistry` all already exist.
   A mini-table for the RED-phase plan might still be useful to cross-check, but no full ELD needed.

None of these requirements look *challenging* for this Jira — 001 already satisfies them, and we're primarily adding
packaging / infra / README / e2e test.

## Resolved Answers (Agreed With Human)

| # | Question | Resolution |
|---|----------|-----------|
| 1 | Header text — `"Available workflows (with colours)"` (no colon, per Jira literal) vs `"Available workflows (with colours):"` (colon, matching AHQ-117 / how-to guide / default pattern)? | **(b) WITH colon** — `"Available workflows (with colours):"`. Matches the established pattern and the already-tested AHQ-117 temp test. |
| 2 | Should the e2e test assert on at least one real workflow name (e.g. `create-workflow`) in addition to ANSI codes, to prove A's workflow discovery still works through the override? | **Yes** — assert ANSI codes **AND** `create-workflow` is in the output. Guards against a silent-regression mode where the override breaks discovery but still "has colours". |
| 3 | Keep `commander` as a direct dependency in 002's `package.json` (matching 001 / the how-to guide) even though the override doesn't import it directly? | **Yes** — keep for consistency with 001 and the guide. Raise a REFACTOR note for a later pass on whether it's actually needed as a direct dep. |

---

## Questions for Human

### Question 1: Header text — with colon or without?

The AHQ-120 Jira description (both the narrative and the code sketch under "More Technical Details") specifies the header text as:

> `Available workflows (with colours)` **(no colon)**

But the **AHQ-117 temp test** — which the Jira tells me to use as a working reference — uses:

> `Available workflows (with colours):` **(with a colon, matching the original `Available workflows:` pattern)**

The how-to guide also uses the colon version. And `agentic-hq`'s default `WorkflowSearchResultsImpl` uses `Available workflows:` (with colon).

Which should AHQ-120 ship?
- **(a)** Follow the Jira description literal → `"Available workflows (with colours)"` **(no colon)**
- **(b)** Follow AHQ-117 / how-to guide / default pattern → `"Available workflows (with colours):"` **(colon)**

My gut: **(b)**, because the colon matches the established pattern and the AHQ-117 temp test is tested and working — but the Jira literal is the authoritative spec and says no colon, so I don't want to silently disregard it.

**Human's Response**:
> b

---

### Question 2: Does the e2e test need to assert on actual workflow names (like `create-workflow`) to prove A is reachable?

The `agentic-hq` template e2e test (`cross-workspace-list-workflows.e2e.test.ts`) asserts on `create-workflow` being in the output — this proves the workflow-discovery pipeline walked A's plugin tree successfully and the override didn't accidentally hide it.

For AHQ-120 I plan to do the same: assert ANSI codes **AND** at least one known workflow name (e.g. `create-workflow`) — otherwise a bug where the override's registry swap silently breaks workflow discovery would pass the "has colours" assertion but have an empty listing.

Happy with that? (Alternative: colours-only, trusting the pattern from AHQ-117 is already verified.)

**Human's Response**:
> Yes

---

### Question 3: Commander as a direct dependency — keep, or drop?

001's `package.json` has `"commander": "^14.0.3"` in `dependencies`. The how-to guide lists it too. But the override project itself doesn't import `commander` directly — `app.run()` (inside `agentic-hq`) uses it via the `createProgram` factory. It's a transitive dep of `agentic-hq`.

Proposed approach: **keep** `commander` in 002's dependencies to match 001 / the how-to guide verbatim, then raise a REFACTOR note in the guide about whether it's actually needed as a direct dep.

Fine with that?

**Human's Response**:
> Yes

---

## Files I Reviewed

### Relevant to the Jira (core references)

- `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/**` — **THE canonical reference.**
  Everything from `bin/*.cjs` to `src/cli/main.ts` to `override-registry.ts` to the impl + its unit test is already
  working here. Most of 002 is "lift from 001, tweak file:// paths, add the missing pieces".
- `agentic-hq/docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` — the user-facing guide
  the Jira requires me to follow, check, and fix. It's detailed and well-structured; I found only minor potential
  improvements (see Research Findings).
- `agentic-hq/src/cli/app.ts` — confirms that `app.run()` now self-resolves `AGENTIC_HQ_WORKSPACE_ROOT` from
  `import.meta.url` (AHQ-117 §9). The override's bin wrapper must NOT set it.
- `agentic-hq/src/index.ts` — confirms all 16 public symbols needed by the override are exported.
- `agentic-hq/package.json` — confirms the `./cli`, `./classwitch-registry`, and `.` subpath exports are in place.
- `agentic-hq/src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts` — the default class the override
  replaces. Confirms `getWorkflowsListingString()` + `registerWorkflowsWith(registry)` are the two interface methods.
- `agentic-hq/tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts` — template for the new e2e test.
  Uses `install-dev-*.sh` + `pnpm link --global` + temp workspace + `runCliAndLogOutput` pattern.
- `agentic-hq/docs/dev/project-design-requirements.md` — OO design, tell-don't-ask, avoid cached state.

### Parent / sibling Jiras (context only)

- **AHQ-113** (parent epic) — "Create And Run classwitch Converter And Override Workflows". 4-stage plan:
  refactor AHQ → temp manual conversion & override → build workflows → run workflows. AHQ-120 is stage 2.
- **AHQ-117** (Done) — converted agentic-hq to a Classwitch Root Project. Its rich add-on sections 1–9 are the
  *source* of the AHQ-120 add-on's design constraints (widened exports, `app.run()` env-var resolution, no-direct-
  -`new DefaultX()` ESLint rule, the temp test at 001).
- **AHQ-121** (Backlog) — fully convert agentic-hq to a Classwitch Root Project on main via the (future)
  classwitch-converter-workflow. Out of scope now.
- **AHQ-122** (Backlog) — build the **real, published** `agentic-hq-with-colours` repo using the (future)
  classwitch-override-workflow. AHQ-120 is the **practice run** for that.

### Most important takeaways

1. **001 has done about 60% of the concrete code already** — the impl, unit test, bin wrapper, main.ts, override
   registry, install script, package.json, tsconfig, vitest unit config, .gitignore. Lift, tweak, add.
2. **Don't fork any behaviour from 001** — keep class / constant / header text identical where possible. This is
   the reference the Jira tells me to trust. Pending Question 1 on the colon.
3. **The bin wrapper must NOT set `AGENTIC_HQ_WORKSPACE_ROOT`**. The `main.ts` **MUST** side-effect-import the
   registry first. These are the two silent-failure modes the Jira and guide repeatedly warn about. Carry the
   design-intent comments verbatim.
4. **ANSI codes are emitted unconditionally** (no TTY detection). This lets the e2e test assert on them via plain
   `execSync` output with no `FORCE_COLOR` env var plumbing.
5. **Missing from 001: README, eslint.config.js, prettier config, vitest.e2e.config.ts, the e2e test itself.**
   These are the design-and-add deliverables for AHQ-120.

## Test Types And Tests We Will Be Implementing

**Test types: `unit, e2e`** (in that order, each with full RED → GREEN → REFACTOR → VALIDATE cycle)

### ⚠️ DIRECTIVE FOR THE UNIT TESTING AGENT (from the human)

**Write BOTH unit tests in the RED phase, and make BOTH pass in the GREEN phase. Ignore any "write one test at a time" instruction.** The two tests may (and arguably should) live in separate files. Both Test 1 and Test 2 below are part of the RED phase; both must be green by the end of the GREEN phase.

### Unit tests

File: `tests/unit/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.unit.test.ts`
*(Or split across two files — the human approves either layout. If split, the second file would be something like `colourful-workflow-search-results-impl-register-workflows.unit.test.ts` alongside the first, or group them under a describe-per-file structure.)*

Lift 001's existing test and modernise it:
- Replace inline structural type aliases with real imports from `'agentic-hq'` (now possible post AHQ-117).

**Test 1: `wraps the header in green, AHQ section in blue, and user section in red ANSI codes`**
- Arrange: two stub `Workspace`s returning fixed listing strings (`STUB_AHQ_SECTION`, `STUB_USER_SECTION`);
  `registerWorkflowsWith` is `vi.fn()`.
- Act: `new ColourfulWorkflowSearchResultsImpl(stubAhq, stubUser).getWorkflowsListingString()`.
- Assert:
  - `output` contains `\x1b[32mAvailable workflows (with colours)…\x1b[0m` (pending Q1 on colon)
  - `output` contains `\x1b[34mSTUB_AHQ_SECTION\x1b[0m`
  - `output` contains `\x1b[31mSTUB_USER_SECTION\x1b[0m`

**Test 2: `registerWorkflowsWith delegates to both workspaces with the registry`**
- Arrange: two stub `Workspace`s with `vi.fn()` for `registerWorkflowsWith`; a minimal stub `WorkflowRegistry`.
- Act: `new ColourfulWorkflowSearchResultsImpl(stubAhq, stubUser).registerWorkflowsWith(stubRegistry)`.
- Assert: each stub's `registerWorkflowsWith` was called once with `stubRegistry` as the only argument.

*(001 currently has only Test 1 — adding Test 2 rounds out coverage of the second public method. This is
in line with the CLAUDE.md rule "unit tests MUST verify main behaviour, not just initialisation".)*

### E2E tests

File: `tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts`
Config: `vitest.e2e.config.ts` (new — mirrors `vitest.unit.config.ts` but pointing at `tests/e2e/**/*.e2e.test.ts`)

**Test 1: `temp-agentic-hq-with-colours list prints colourful listing from a separate workspace`**

Modelled on `agentic-hq/tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts`:

1. **Arrange — install the override globally**
   - `execSync('bash scripts/infra/install-dev-temp-agentic-hq-with-colours.sh', …)` — 30s timeout
   - Ensure `PNPM_HOME` is on the test process's PATH

2. **Arrange — create a unique temp workspace**
   - `/tmp/agentic-hq-test-workspaces/test-ws-{uuid}/` (fresh each run)

3. **Act — run the override from that workspace**
   - `execSync('temp-agentic-hq-with-colours list', { cwd: tempWorkspace, encoding: 'utf8', … })`

4. **Assert — colours AND content**
   - `expect(stdout).toContain('\x1b[32m')` — green somewhere
   - `expect(stdout).toContain('\x1b[34m')` — blue somewhere
   - `expect(stdout).toContain('\x1b[31m')` — red somewhere
   - `expect(stdout).toContain('Available workflows (with colours)')` — new header text (with/without colon per Q1)
   - `expect(stdout).toContain('create-workflow')` — at least one core workflow still visible (proves A reachable —
     pending Q2 confirmation)

Infrastructure notes:
- Will need a **local `runCliAndLogOutput`-style helper** or simply inline `execSync` — can't import across package boundaries.
- Log to `/tmp/e2e-temp-agentic-hq-with-colours-list.log` following the existing pattern.
- Use a 60s timeout per the AHQ-120 template's precedent.
- Emit an AHQ-79 "smelly: this runs `pnpm link --global`" warning banner before the install step.

## Ready for Next Step

Awaiting human responses to the 3 questions above. Once resolved, this summary is complete and the RED-phase
(unit tests first) begins.

# REFACTOR Analysis: AHQ-120 (e2e test)

**Jira**: [AHQ-120](https://agentic-hq.atlassian.net/browse/AHQ-120)
**Test Type**: e2e
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-04-24 19:41

---

## Refactoring Guidance (from Perplexity research)

Refactor in small, safe steps. If more than a few minutes since tests passed, revert and try smaller.

### When TO Refactor

> "The first time you do something, you just do it. The second time, you wince at the duplication, but you do it anyway. The third time, you refactor." — **Don Roberts** (via Martin Fowler)
> So... If you're seeing something that's been copied about and used in 3 places, it's time to tidy that up by refactoring.

> "What's the simplest thing that could possibly work?" - Ward Cunningham
> So... If you're seeing an overly complex solution - or the whole code is starting to look like it's accumulated complexity and messiness, it's time to refactor.

- Magic constants / magic strings — extract to named constants
- Poor variable or function names — rename for clarity
- Duplication within a file — extract to a shared function
- Overly complex conditionals — simplify
- Dead code — delete it
- Long and complex sequences that the system has to go through to achieve something, when you can see a simpler way to do things
- Missing TSDoc — exported classes and public methods should have `/** ... */` comments

### When NOT To Refactor

> "Always implement things when you actually need them, never when you just foresee that you need them." — **Ron Jeffries**
> So...Don't refactor to add things you **think** you'll need later.

> "Over and over, people try to design systems that make tomorrow's work easy. But when tomorrow comes it turns out they didn't quite understand tomorrow's work, and they actually made it harder." — **Ward Cunningham**

> "What's the simplest thing that could possibly work?" - Ward Cunningham
> So... If you're thinking of adding more code/layers to refactor and make the system more generic, ask your self - are you making it simpler or more complex than it needs to be to make it work?

So, avoid refactoring the following things:
- New abstractions or interfaces — unless the pattern appears 3+ times (Rule of Three)
- Extracting to new files/modules — unless the current file is genuinely too large
- Introducing design patterns — unless the problem is already painful without one
- Building "stepping stones" for future features — classic gold-plating
- Making code "more generic" — if only one use case exists, keep it specific

**"Has It Earned It?"** — Before approving, ask: Is this code stable? Is the pattern repeated 3+ times? Will this abstraction actually be used, or is it speculative?

---

## Pre-Refactor Test Status

**Command**: `pnpm test:e2e` (run in `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/`)
**Result**: PASSING (1/1 e2e test, 4.14s)

> NOTE: Running all e2e tests has been skipped to conserve Claude Code plan credits. Only ran the specific e2e test file for this Jira to confirm GREEN. The full `pnpm test:e2e` suite for this override project only contains one test anyway, so this is not a meaningful gap here.

Also confirmed `pnpm validate` (typecheck + 2/2 unit tests) passes.

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, red phase, green phase, and implementation documents for deferred items and opportunities.

A recursive search of `workflow-files/` for "REFACTOR" / "refactor" was performed — findings below (filtered to phase-doc mentions that point to concrete work, not boilerplate).

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | Jira AC — "Documentation: README.md with purpose, CLI usage, test instructions, classwitch override details"; also e2e-GREEN summary §5 *"REFACTOR deferrals: README.md ... deliberately deferred to the REFACTOR phase"* | Deferred (mandatory Jira AC) | Create `README.md` in 002 project covering: purpose of this TEMP practice project, how to run `temp-agentic-hq-with-colours` CLI, how to run unit/e2e tests, brief description of classwitch override pattern linking to the how-to guide. | **RECOMMEND**. Mandatory Jira AC deliverable. No ambiguity — the Jira lists the required sections explicitly. | **Tier 2** (requires human judgement on scope/content, not just mechanical). |
| P.2 | e2e-GREEN summary §5; RED plan "`README.md`, `eslint.config.js`, prettier config — REFACTOR, not GREEN"; AI summary "missing from 001 (and therefore AHQ-120 must design and add): ... `eslint.config.js`" | Deferred | Create `eslint.config.js` in 002 project. Simple flat-config covering TypeScript files and vitest globals, comparable in spirit to agentic-hq's own config (probably lighter since this is a practice project). | **RECOMMEND but with scope caveat**. The Jira's "expected final layout" lists it; it was deferred explicitly. BUT — this is a TEMP practice project that *will not be published*, and the parent Jira says the *real* override project gets built automatically in AHQ-122. Scope: minimal config that would keep a fresh contributor honest, not a full enterprise-grade setup. | **Tier 2** (human should decide scope). |
| P.3 | e2e-GREEN summary §5; RED plan "`README.md`, `eslint.config.js`, prettier config — REFACTOR, not GREEN"; AI summary "missing from 001" | Deferred | Create a prettier config (`.prettierrc` or equivalent) in 002 project. | **UNSURE**. Same reasoning as P.2 but weaker — prettier config adds less safety value than lint config, and 002 is throwaway. The how-to-guide also doesn't prescribe one. Lean towards SKIP if user agrees the practice project doesn't need formatter enforcement. | **Tier 2** (human should decide). |
| P.4 | Jira (core requirement): *"This guide needs following, checking and fixing if there are any incorrect or confusingly worded things. As you discover issues either: (1) fix them straight away or (2) Put a TODO / REFACTOR comment"*; also e2e-GREEN summary §5 *"how-to-guide review/TODOs ... deliberately deferred to the REFACTOR phase"* | Deferred (core Jira AC) | Re-read `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` against the actual 002 experience, and either: (a) fix inaccuracies directly, or (b) add TODO/REFACTOR comments in the guide, or (c) draft a follow-up Jira at `docs/jira-docs/AHQ-120/draft-future-jiras/` (mirroring AHQ-117's pattern) if fixes are substantial. **The guide is generic — it must stay scenario-agnostic** (not about this colours-override specifically). Filter every candidate addition through the test: "would this affect *any* override project, or just one that replaces `WorkflowSearchResults` with colours?" Known *generic* candidate issues already surfaced in the AI summary: (i) commander listed as a direct dep but is really transitive via agentic-hq — worth a note in the guide; (ii) guide has no section on `eslint.config.js` for the override project; (iii) guide has no section on e2e testing setup for an override project (generic scaffolding only — `vitest.e2e.config.ts` shape, how to link the global binary, how to invoke the override from a clean workspace); (iv) `/path/to/…` placeholder wording for `file:` deps — clear enough, but worth double-checking it reads sensibly for any relative depth. (The ANSI-stripping note from the original AI summary is deliberately **not** generic — it only applies to colour-emitting overrides — and should stay out of the guide.) | **RECOMMEND**. The Jira explicitly requires this review; GREEN explicitly deferred it. 002 has *just* been built — reviewer has maximum fresh context on what was unclear. | **Tier 2** (review + fix scope is a judgement call). |
| P.5 | RED plan "Do NOT change `validate` in this RED cycle ... Extending `validate` to include e2e is an e2e-REFACTOR / VALIDATE decision"; GREEN plan Step 10 same note | Deferred (decision, not mandatory) | Decide whether to extend 002's `validate` script to include `test:e2e`. Current: `pnpm validate = pnpm typecheck && pnpm test:unit`. Option: `pnpm validate = pnpm typecheck && pnpm test:unit && pnpm test:e2e`. | **NOT RECOMMENDED** for this practice project. The e2e test mutates global pnpm state (runs `pnpm link --global`), takes ~4s, and is smelly per AHQ-79. Making it part of every `pnpm validate` call pushes that smell into routine developer workflow. For the real published override project in AHQ-122 this is a harder call, but for this throwaway practice project keeping `validate` fast-and-clean matches the existing intent. | **Tier 2 (SKIP)** — decision to not change. Recorded here so the human can override if they disagree. |
| P.6 | AI summary Q3 resolution: *"Raise a REFACTOR note for a later pass on whether commander is actually needed as a direct dep"* | Deferred | Add a REFACTOR note (either in `package.json` via a comment-field convention, or more realistically in the how-to guide, or as part of P.4's guide review) flagging that `commander` may be transitive-only. Don't actually remove it now — that's a separate validated change. | **RECOMMEND merging into P.4** — the guide review is the right home for this note (package.json doesn't really support explanatory comments cleanly). | **Tier 2 (merge into P.4)**. |
| P.7 | RED plan §3 inline comment: *"Duplication of the `runCliAndLogOutputLocal` helper over a cross-package import is deliberate (same justification as AHQ-82 REFACTOR)"* | Observed (explicitly accepted) | None — the duplication is deliberate and documented. | N/A. | **Skip** — by design. |
| P.8 | Unit-GREEN REFACTOR NOTE (carried over to e2e-GREEN as "CONSTRUCTOR SHAPE" comment in impl) | Addressed in e2e-GREEN | Optional-with-defaults constructor was added in e2e-GREEN. The CONSTRUCTOR SHAPE comment preserves the history per the "do not delete existing comments" feedback. | Already done — nothing more to do. | **Skip** — already resolved. |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below.

---

## Magic Constants Audit

Audited all production files touched in the e2e GREEN phase + the e2e test file.

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts` | 46 | `60_000` | EXTRACTED | `TEST_TIMEOUT_MS` |
| `tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts` | 47 | `30_000` | EXTRACTED | `INSTALL_SCRIPT_TIMEOUT_MS` |
| `tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts` | 48 | `'temp-agentic-hq-with-colours-list'` | EXTRACTED | `LOG_FILE_LABEL` |
| `tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts` | 49 | `/tmp/e2e-…log` | EXTRACTED | `LOG_FILE_PATH` |
| `tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts` | 59 | `'/tmp/agentic-hq-test-workspaces'` | EXTRACTED | `TEMP_WORKSPACES_BASE` |
| `tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts` | 61-63 | ANSI `\x1b[1;31m` / `\x1b[0m` / separator string | EXTRACTED | `BOLD_RED` / `RESET` / `SEPARATOR` |
| `tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts` | 76 | `'/tmp'` literal + re-derived `e2e-${logFileLabel}.log` template | DUPLICATION-LITE | helper re-builds a path that matches the pattern of module-level `LOG_FILE_PATH` (inside the helper, built from its `logFileLabel` parameter). See T1.1 below. |
| `tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts` | 130 | `'temp-agentic-hq-with-colours list'` | MAGIC-LITE | Command string. Only appears once. Naming as `LIST_COMMAND` adds noise without real value — leave as-is. |
| `tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts` | 180 | `'create-workflow'` | MAGIC-LITE | Expected workflow name. Only appears once in an assertion — local literal is clearer than a named constant. Leave as-is. |
| `src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts` | 47-52 | ANSI codes + HEADER + SECTION_SEPARATOR | EXTRACTED | `GREEN`/`BLUE`/`RED`/`RESET`/`HEADER`/`SECTION_SEPARATOR` |
| `src/cli/main.ts` | — | none | N/A | 3-line file with no literals beyond imports |
| `src/classwitch-registry/override-registry.ts` | 44 | `'WorkflowSearchResultsImpl'` | DELIBERATELY-INLINE | Service-registry key literal (concrete class name by convention). Extracting into a constant would hide the classwitch protocol contract. Leave as-is. |
| `bin/temp-agentic-hq-with-colours.cjs` | 35, 40 | `'node_modules'`, `'.bin'`, `'tsx'`, `'src'`, `'cli'`, `'main.ts'` | PATH-SEGMENTS | Path fragments inside `path.join(...)`. Extracting each into a constant adds noise with no clarity gain (e.g. a reader understands `path.join(__dirname, '..', 'node_modules', '.bin', 'tsx')` instantly). Leave as-is. |
| `scripts/infra/install-dev-temp-agentic-hq-with-colours.sh` | — | none notable | N/A | Bash script with warning text, cd, corepack check, install + link. Literals are self-explanatory. |

**Any MAGIC entries above are included in Tier 1 refactors below.** The only item that registers as a real (if small) opportunity is the `/tmp` + log file path pattern duplication (see T1.1).

---

## Audit To Confirm Methods Used In Production Code (Not Just Tests)

No new methods were added to any interface/class in the e2e-GREEN phase. The one modified class (`ColourfulWorkflowSearchResultsImpl`) had its constructor signature changed to optional-with-defaults but kept the same two public methods that were already audited clean in the unit-REFACTOR cycle.

**Legend**:
- **✓** = used as intended
- **NOT USED THROUGH INTERFACE ⚠️** / **TEST-ONLY ⚠️** = flagged
- **NOT-YET-WIRED** = deliberate subsystem entry

| Interface / Class | Method | Status | Evidence |
|---|---|---|---|
| `WorkflowSearchResults` | `getWorkflowsListingString()` | ✓ | Called by `agentic-hq/src/cli/workflow-listing-command.ts` via registry-loaded class instance; exercised by unit test + e2e test. |
| `WorkflowSearchResults` | `registerWorkflowsWith(registry)` | ✓ | Called by `agentic-hq/src/cli/app.ts` (workflow registration at startup); exercised by unit test. |
| `ColourfulWorkflowSearchResultsImpl` | `constructor(ahqWorkspace?, currentUserWorkspace?)` | ✓ | Zero-arg form called by classwitch registry inside `app.run()` (the reason optional-with-defaults was added in e2e-GREEN). Two-arg form called by unit tests. |

> No flagged methods. All three public entry points have external production callers going through the interface contract.

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.1 | Remove small duplication | The e2e test module declares `LOG_FILE_PATH = '/tmp/e2e-${LOG_FILE_LABEL}.log'` at the module level (used only for the timeout error message) *and* separately the helper function re-derives `const logFile = path.join('/tmp', e2e-${logFileLabel}.log)` inside itself. Same string pattern, built twice. Make `LOG_FILE_PATH` the single source of truth — either have the helper compute its log path from `LOG_FILE_PATH` (if its `logFileLabel` parameter always matches the module constant), or just inline the one remaining use of `LOG_FILE_PATH` into the error message and drop the module constant. Pick whichever option yields the simpler file. | `tests/e2e/temp-agentic-hq-with-colours-list.e2e.test.ts` Lines: `48-49, 76` |

**Note**: No missing TSDoc — the impl file's public methods were TSDoc'd in unit-REFACTOR (1.1/1.2 of that cycle). The e2e test file is a test, so TSDoc on `runCliAndLogOutputLocal` is a judgement call — it already has a block-comment header explaining why it's duplicated, which is the bit that matters. Naming improvements, dead-code, nested-conditional simplification — none found.

---

## Tier 2: AI-Identified Potential Refactors

### Refactor 2.1: Create `README.md` for the 002 override project

**Type**: Mandatory Jira AC deliverable deferred from GREEN.
**Description**: Add a `README.md` to `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/` covering (per Jira AC):
  - Purpose of the project (TEMP practice override, not for publishing, precursor to AHQ-121/122).
  - How to run the `temp-agentic-hq-with-colours` CLI (after `install-dev-…sh`).
  - How to run `pnpm test:unit` and `pnpm test:e2e`.
  - Brief explanation of the classwitch override pattern with a link to `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` in agentic-hq.
  - The "not for publishing" / AHQ-79 smelly-install-script caveats.
**AI Recommendation**: **RECOMMEND** — Jira AC explicitly requires it. Low risk: adding a README cannot break anything. Roughly 60–100 lines of prose is enough given the scope.
**Risk**: None to the code. Minor risk of over-writing (making it too long / duplicating how-to guide content) — mitigation: keep it concise and link out to the how-to guide rather than duplicate.
**Files affected**: `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/README.md` (new)

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.2: Create minimal `eslint.config.js` for the 002 override project

**Type**: Deferred from GREEN — not in Jira AC but in the Jira's "expected final layout" and flagged as a REFACTOR deliverable across multiple phase docs.
**Description**: Add a minimal flat-config ESLint setup to `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/`. Scope: TypeScript-aware rules, vitest globals for test files. Likely a ~20–40 line file. Add `"lint": "eslint ."` (or similar) script to `package.json`.
**AI Recommendation**: **UNSURE**. Arguments for: listed in the expected layout; lint is a cheap safety net; if we ship it we can include the classwitch `no-restricted-imports` rule pattern from AHQ-117 Add-On §8 as a teaching reference. Arguments against: this is a TEMP project that is explicitly not for publishing; the *real* version gets built automatically in AHQ-122; adding lint also means deciding which devDependencies (eslint, plugins) to add — each adds install/maintenance weight. If we're going to have it, keep it minimal.
**Risk**: Over-engineering — rule choices now may influence what AHQ-122's automated workflow produces. If scope creeps (adding plugins, strictness, import/order rules), cost quickly outweighs benefit for a throwaway project.
**Files affected**: `eslint.config.js` (new), `package.json` (new `lint` script + devDependencies)

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.3: Create prettier config for the 002 override project

**Type**: Deferred from GREEN — not in Jira AC; in the Jira's expected layout.
**Description**: Add `.prettierrc` (or `prettier.config.js`) to `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/`. Simplest option: copy agentic-hq's own prettier config verbatim so style rules are consistent across repos. Could also add a `format:check` / `format:fix` script pair to `package.json`.
**AI Recommendation**: **NOT RECOMMENDED** (lean). For a throwaway practice project with 5 source files, prettier enforcement is mostly ceremonial. agentic-hq has prettier for *its* codebase; 002 files were lifted from 001 (which doesn't have prettier either and looks fine). If the human disagrees I'm happy to do it — it's cheap — but I'd vote skip.
**Risk**: Tooling scope creep (prettier itself as devDep, plus deciding which Prettier plugins to add, if any).
**Files affected**: `.prettierrc` (new), potentially `package.json` (scripts + devDependency)

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.4: Review the `how-to-create-your-own-classwitch-override-project.md` guide against the 002 experience, and fix or flag issues

**Type**: Core Jira requirement — explicitly stated: *"This guide needs following, checking and fixing if there are any incorrect or confusingly worded things."*
**Description**: Re-read the guide end-to-end from the perspective of "someone building 002 from scratch following it". For each issue found, either (a) fix inline, (b) add a TODO/REFACTOR comment in the guide, or (c) draft a follow-up Jira at `docs/jira-docs/AHQ-120/draft-future-jiras/` (following AHQ-117's pattern).

**The guide is GENERIC — it must stay scenario-agnostic.** Filter every candidate addition through the test: "would this affect *any* override project, or just one that replaces `WorkflowSearchResults` with colours?" Colour-override-specific details (ANSI-stripping, `FORCE_COLOR`, emit-unconditionally-vs-conditional) do **not** belong in the guide — they are particular to AHQ-120's scenario, not to the override pattern.

Concrete **generic** candidate issues already surfaced in earlier phases:

1. **commander dependency confusion** (AI summary Q3): `commander` is listed as a direct dep in Step 1's sample `package.json`, but it is really transitive via agentic-hq's public exports chain. The guide should clarify whether the override actually needs to list it directly, or just note that it works either way and why. *(Generic — affects every override project.)*
2. **No eslint/prettier guidance**: the guide has no section on lint or formatter setup for the override project. Worth adding a brief note (or explicit "not covered — you decide" disclaimer). *(Generic.)*
3. **No e2e testing guidance for an override project**: the guide covers `vitest.unit.config.ts` but not the *generic* scaffolding an override needs for e2e — `vitest.e2e.config.ts` shape, how to globally-link the override's bin during the test, how to invoke the override from a clean workspace. *(Generic — any override might want e2e tests.)* Scenario-specific assertion details (ANSI codes, FORCE_COLOR) stay out.
4. **`/path/to/...` dep paths in sample `package.json`**: Clear enough, but worth double-checking the placeholder wording reads sensibly for any relative depth. *(Generic.)*
5. Anything else surfaced during the re-read that passes the "affects every override" test.

**AI Recommendation**: **RECOMMEND** — this is a Jira core deliverable, not optional. The fresh-context moment to do it is now (right after 002 has been built).
**Risk**: Scope creep if fixes grow into full guide rewrites. Mitigation: if fixes are big, draft a follow-up Jira rather than expanding AHQ-120.
**Files affected**: `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` (potentially), `docs/jira-docs/AHQ-120/draft-future-jiras/` (new — follow-up Jira draft if needed)

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.5: Extend `pnpm validate` in 002 to include `test:e2e`

**Type**: Deferred decision flagged by RED + GREEN plans.
**Description**: Change `validate` script in `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/package.json` from:
```
"validate": "pnpm typecheck && pnpm test:unit"
```
to:
```
"validate": "pnpm typecheck && pnpm test:unit && pnpm test:e2e"
```

**AI Recommendation**: **NOT RECOMMENDED**. The e2e test mutates global pnpm state (runs `pnpm link --global` via the install script), takes ~4s to run, and is smelly per AHQ-79. Promoting it into every `validate` call imposes that smell on everyday developer workflow for a *practice* project. VALIDATE-phase command already runs it explicitly when we actually want e2e verification — that's the right mode. For the real published override project (AHQ-122) this is a harder call, but in 002 I'd leave `validate` scope-narrow.
**Risk**: If approved: every `pnpm validate` call runs `pnpm link --global`, which mutates global pnpm state. Subtle but real side effect. AHQ-79 warning would then fire on every routine validate.
**Files affected**: `package.json` (single-line change)

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None". Everything added here will be discussed with the AI before a decision is made.

Surfaced during this review session (human ran `./bin/temp-agentic-hq-with-colours.cjs reversal -- --string-to-reverse='hello there you'` and hit a `posix_spawnp failed` error). Root cause diagnosed jointly: pnpm extracts `node_modules/.pnpm/node-pty@1.1.0/.../prebuilds/darwin-*/spawn-helper` with mode `-rw-r--r--` instead of `-rwxr-xr-x`, so when `node-pty` tries to `posix_spawnp` its helper, it fails with `EACCES` — surfaced as the unhelpful `posix_spawnp failed` text. The agentic-hq root `package.json` already has a `postinstall` workaround for this (the pnpm bug https://github.com/pnpm/pnpm/issues/7366), but 002 doesn't inherit it — pnpm ≥7 doesn't run a dependency's `postinstall` by default, and even if it did, the root's hook uses the hoisted path `node_modules/node-pty/...` which doesn't match a consumer's `.pnpm/`-store layout.

### Refactor H.1: Add postinstall `chmod +x spawn-helper` hook to 002's `package.json`

**Type**: Bug fix / missing install-time workaround.
**Description**: Add to `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/package.json`:

```jsonc
"// POSTINSTALL": "FIX: node-pty posix_spawnp failed. pnpm extracts spawn-helper without +x. Same fix as main project. See: https://github.com/pnpm/pnpm/issues/7366",
"postinstall": "chmod +x node_modules/.pnpm/node-pty@*/node_modules/node-pty/prebuilds/darwin-*/spawn-helper 2>/dev/null || true"
```

Note: the path shape is the `.pnpm`-qualified form (`.pnpm/node-pty@*/node_modules/node-pty/...`), **not** the hoisted form used in the agentic-hq root's own `package.json`. That's because in the root, node-pty is a direct dep and pnpm hoists it to top-level `node_modules/`; in 002 it's transitive via agentic-hq, so it lives deep in pnpm's content-addressed store. Matches the pattern already used by `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/package.json`.

**AI Recommendation**: **RECOMMEND** — without this, `./bin/temp-agentic-hq-with-colours.cjs <any workflow>` fails silently on any fresh `pnpm install`. One-line fix, proven pattern. Verified in this session: after `chmod +x` on the installed `spawn-helper`, `pty.spawn('claude', ['--version'], …)` returns `2.1.119 (Claude Code)` cleanly.
**Risk**: None meaningful — the `2>/dev/null || true` means non-Mac or already-fixed installs no-op safely.
**Files affected**: `temp-test-workspaces/test-classwitch-override-project-002-for-ahq-120/package.json`

**Human's Decision**: **APPROVE** (confirmed by human — add H.1 and H.2 to doc, execute in 04b).

---

### Refactor H.2: Document the node-pty `spawn-helper` / pnpm `+x` stripping gotcha in the classwitch-override how-to guide

**Type**: Documentation addition, tightly coupled to Refactor 2.4 (how-to-guide review).
**Description**: When reviewing `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md`, add a section covering this specific failure mode. Minimum content:

- **Where**: probably a new "Required install-time fixup" subsection near the existing Step 1 (`package.json` shape), plus a Troubleshooting entry matching the visible error text (`posix_spawnp failed`).
- **What**: the postinstall hook line (the `.pnpm`-qualified form, so it works for any override consuming `agentic-hq` as a file: / npm dep — not the hoisted form used in the agentic-hq root).
- **Why**: one-sentence pointer to https://github.com/pnpm/pnpm/issues/7366; one-sentence note that without this hook, `./bin/<your-override>.cjs <any-workflow>` fails silently with `posix_spawnp failed` on fresh installs.
- **Cross-link** to the follow-up Jira (not yet drafted — the user decided to defer Option B "ship the fix-script from agentic-hq" to a future Jira) if that draft exists by the time the guide gets updated.

This is a specific, concrete finding that belongs inside Refactor 2.4's scope (guide review) but is called out separately here because it was discovered *during* this review session — not just a theoretical "maybe review the guide" item.

**AI Recommendation**: **RECOMMEND** — and merge execution into Refactor 2.4 rather than doing as a separate commit, so the guide review happens end-to-end in one pass with the full list of known issues (commander-transitive, no lint/prettier section, no e2e section, the spawn-helper gotcha, plus anything else found during the re-read).
**Risk**: None — pure documentation.
**Files affected**: `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md`

**Human's Decision**: **APPROVE** (confirmed by human — merge into Refactor 2.4's execution scope).

---

## Project Design Requirements Compliance Audit

**Design Requirements File**: `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/dev/project-design-requirements.md`

Note: AHQ-120 is a thin override project that re-uses existing concepts (`WorkflowSearchResults`, `Workspace`, `WorkflowRegistry` — all established in AHQ-106/AHQ-117). It introduces exactly one new class: `ColourfulWorkflowSearchResultsImpl`. Most design requirements either apply trivially (inherited from 001) or are N/A (no new concepts to table up).

| # | Requirement | Evidence (files, classes, patterns) | Status | Refactoring Proposal (if needed) |
|---|-------------|-------------------------------------|--------|----------------------------------|
| DR.1 | Interface/class pair per concept (`Foo` interface + `FooImpl` class) | `ColourfulWorkflowSearchResultsImpl implements WorkflowSearchResults`. Single new class; re-uses existing interface. Naming follows `Impl`-suffix convention (well — here it is a variant name rather than default `Impl`, which is fine: a third party could equally ship `HyperColourfulWorkflowSearchResultsImpl` alongside this). | MET | — |
| DR.2 | Tell, don't ask — push work into objects | `getWorkflowsListingString()` asks each `Workspace` to `getWorkflowListingString()`, wraps each result in ANSI codes, concatenates. `registerWorkflowsWith(registry)` delegates to both workspaces. No state extraction / manipulation. | MET | — |
| DR.3 | Avoid cached state — store minimal source data, derive dynamically | Constructor stores the two Workspace references only. `getWorkflowsListingString()` freshly re-asks the workspaces every call; no caching of the output string or intermediate listings. | MET | — |
| DR.4 | Switchability — could a third party easily replace any concrete class? | `ColourfulWorkflowSearchResultsImpl` is itself a replacement, registered via classwitch's `rootServiceRegistry.overrideExistingServices(…)`. The workspaces it holds (`AhqWorkspaceImpl`, `CurrentUserWorkspaceImpl`) are optional-with-defaults, so a downstream "override of this override" could pass its own Workspace implementations via the constructor. The ANSI colour codes are module-level constants (`GREEN`/`BLUE`/`RED`) — arguably a candidate for further switchability (see DR.6 below). | MET | — (DR.6 covers the colour-palette switchability consideration; the unit-REFACTOR cycle already considered and rejected introducing a `ColourScheme` abstraction on "has it earned it" grounds.) |
| DR.5 | Concept Table / Data Dictionary / English Language Description during planning | Planning docs already contain: (i) a Data Dictionary table in the e2e RED plan (`02-red-phase-failing-test-plan-copy.md` §"Data Dictionary (Mini — for e2e RED)"), (ii) an English Language Description paragraph in the same file, (iii) a Concept Table for the unit phase in the unit RED plan. AHQ-120 introduces no new concepts — all concepts inherit from AHQ-106/117 — so the existing tables are appropriate scope. | MET | — |
| DR.6 | Push functionality into the entity / minimal fields — "WorkflowSearchResult just aggregates two workspaces and delegates" | `ColourfulWorkflowSearchResultsImpl` is exactly this shape: two Workspace fields, no accumulator state, each method delegates to the workspaces. The ANSI-wrapping is a thin shell over the workspace responses. | MET | — |
| DR.7 | Extreme-balance caveat — don't fracture into too many classes just to make everything switchable | The unit-REFACTOR cycle explicitly rejected introducing a `ColourScheme` interface (proposed Tier 2 refactor there) on "has it earned it" grounds — the colour palette is used once and doesn't pay for its own abstraction yet. This is the exact judgement call the requirement warns about, and we made the right call. | MET | — |

**Summary**: 7 of 7 requirements MET, 0 PARTIALLY MET, 0 NOT MET, 0 NOT APPLICABLE.

> **Note to human**: No refactoring proposals from this audit. All design requirements are satisfied by the existing code.

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 1 |
| Tier 2 AI-Identified (Pending review) | 5 |
| Tier 2 Human-Identified (Pending review) | 2 |
| Design Requirements Audit (items needing action) | 0 |
| **Total** | 8 |

Most of the Tier 2 volume is **Jira-AC deliverables that were explicitly deferred from GREEN** — they are expected work for this REFACTOR phase, not speculative refactors. Specifically: 2.1 (README.md) is mandatory per Jira AC and 2.4 (how-to-guide review) is a core Jira requirement. The 2 Human-Identified items (H.1, H.2) were surfaced during this review session when the human tried to run a workflow through the override and hit the `posix_spawnp failed` error — both APPROVED, to be executed in 04b.

---

## Agreed Refactors Discussion Notes

No AI-identified item was marked **DISCUSS** — 2.1 and 2.4 were approved cleanly, and 2.2 / 2.3 / 2.5 were rejected cleanly. The Human-Identified items H.1 and H.2 were worked out in real-time during this review session and are summarised below for the record.

### Refactor 2.4: How-to-guide review — scope narrowed during review

**Decision**: EXECUTE (approved as proposed, with a scope refinement).
**Summary**: Mid-review the human pointed out that the original "ANSI-stripping considerations" candidate for the e2e-testing section was not generic — it applies only to colour-emitting overrides, not every override project. The guide must stay scenario-agnostic. Refactor 2.4's description was amended to (a) remove the ANSI-stripping item from the e2e-scaffolding section and (b) explicitly call out the "generic filter" rule — every candidate addition has to pass the test *"would this affect any override project, or just one replacing `WorkflowSearchResults` with colours?"* The 4 remaining candidate issues (commander-transitive, no eslint/prettier section, generic e2e-scaffolding-only guidance, `/path/to/…` placeholder) all pass that filter and stay in scope.

### Refactor H.1: Add postinstall `chmod +x spawn-helper` hook to 002's `package.json`

**Decision**: EXECUTE.
**Summary**: Discovered mid-review when the human ran `./bin/temp-agentic-hq-with-colours.cjs reversal -- --string-to-reverse='hello there you'` and hit `Error: posix_spawnp failed.` Joint diagnosis:
- Traced to `spawn-helper` in `node_modules/.pnpm/node-pty@1.1.0/.../prebuilds/darwin-arm64/spawn-helper` having mode `-rw-r--r--` instead of `-rwxr-xr-x` — pnpm strips the `+x` bit on extraction (https://github.com/pnpm/pnpm/issues/7366).
- Verified in-session: `chmod +x` the installed `spawn-helper` and `pty.spawn('claude', ['--version'], …)` returns `2.1.119 (Claude Code)` cleanly.
- Considered three fix-location options: (A) fix upstream (pnpm or node-pty) — correct but out of scope; (B) agentic-hq ships a fix-script and overrides reference it from their own postinstall — cleanest centralisation, but pnpm ≥7 doesn't run deps' postinstalls by default, so override still has to opt in; (C) each override duplicates the chmod line in its own `package.json` — simple and explicit. For AHQ-120 scope the human chose (C). Option (B) was deferred to a potential follow-up Jira (not drafted as part of this REFACTOR — scope creep avoided).
- The path form used is the `.pnpm`-qualified shape (`node_modules/.pnpm/node-pty@*/node_modules/node-pty/prebuilds/darwin-*/spawn-helper`), not the hoisted form in agentic-hq's root `package.json`, because 002 has node-pty as a transitive dep via agentic-hq — pattern already used by `.agentic-hq/plugins/agentic-hq-demos-plugin/skills/string-reversal/ts-workflow/package.json`.

### Refactor H.2: Document the spawn-helper gotcha in the how-to guide

**Decision**: EXECUTE (merged into Refactor 2.4's execution scope).
**Summary**: The same gotcha diagnosed in H.1 is generic — any override project consuming `agentic-hq` hits it. So the how-to guide must document it. Agreed to do this as part of the 2.4 guide review rather than a separate commit, so the guide update happens end-to-end with the full known-issues list (commander-transitive, no lint/prettier section, no generic e2e section, spawn-helper gotcha, plus whatever else the re-read turns up). Concretely H.2 becomes an extra item in 2.4's checklist, with specific content (where, what, why) already drafted in H.2's description.

### Sidebar: how does the first Skill know what command to return?

Not a refactor — a context question the human asked mid-review, preserved here because the answer (the SKILL.md + `disable-model-invocation: true` + `skill-base-dir` template-filling pattern) is exactly the *kind* of thing the how-to guide could usefully mention for override authors who want to understand what they're plugging into. Not in 2.4's current scope but flagged here for when the real AHQ-122 published override project is created — worth a one-paragraph explanation in its README.

---

## Agreed Refactors Summary Table

> For detail on any discussed item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above.

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 1.1 | AI (Tier 1) | Remove log-file-path duplication in the e2e test file (module-level `LOG_FILE_PATH` + helper re-derives the same pattern). Pick whichever option yields the simpler file (single source of truth, or inline the only remaining use and drop the constant). | EXECUTE | Auto-approved — Tier 1. |
| 2.1 | AI (Tier 2) | Create `README.md` for the 002 override project covering purpose (TEMP practice, not for publishing), CLI usage, unit/e2e test commands, brief classwitch-override explanation linking to the how-to guide, AHQ-79 smelly-install-script caveats. | EXECUTE | Approved by human. Mandatory per Jira AC. |
| 2.2 | AI (Tier 2) | Create minimal `eslint.config.js` for 002. | SKIP | Rejected by human. 002 is throwaway; real published override in AHQ-122 will build this automatically. |
| 2.3 | AI (Tier 2) | Create prettier config for 002. | SKIP | Rejected by human. Same reasoning as 2.2 (plus weaker safety value than lint). |
| 2.4 | AI (Tier 2) | Review `how-to-create-your-own-classwitch-override-project.md` against the 002 experience; fix inline or add TODO/REFACTOR comments; draft follow-up Jira under `docs/jira-docs/AHQ-120/draft-future-jiras/` if fixes are substantial. Scope: stays **generic** (scenario-agnostic), using the filter *"would this affect any override, or just colours-override?"* Includes the H.2 addition (document spawn-helper gotcha). Candidate issues: (i) commander-transitive clarification, (ii) no eslint/prettier section, (iii) no generic e2e-scaffolding section, (iv) `/path/to/…` placeholder wording, (v) spawn-helper postinstall hook (H.2), (vi) anything else surfaced in the re-read that passes the generic filter. | EXECUTE | Approved by human. Scope refined during review (ANSI-stripping bullet removed — not generic). H.2 merged in. |
| 2.5 | AI (Tier 2) | Extend `pnpm validate` in 002 to include `test:e2e`. | SKIP | Rejected by human. e2e mutates global pnpm state (smelly per AHQ-79); keep validate fast-and-clean for a practice project. |
| H.1 | Human | Add the `.pnpm`-qualified `postinstall "chmod +x …/spawn-helper 2>/dev/null || true"` hook (with the `// POSTINSTALL` comment line) to 002's `package.json`, matching the pattern in `ts-workflow/package.json`. | EXECUTE | Approved by human. Required for workflows-through-the-override to work at all. |
| H.2 | Human | Document the spawn-helper gotcha in the how-to guide — `.pnpm`-qualified postinstall line, troubleshooting entry keyed on `posix_spawnp failed`, one-sentence link to the pnpm issue. | EXECUTE (merged into 2.4) | Approved by human. Not a separate commit — executed as part of 2.4's guide review. |

**Totals**: 5 EXECUTE (1.1, 2.1, 2.4+H.2, H.1) + 3 SKIP (2.2, 2.3, 2.5).

---

## Next Steps

1. Review the "Previous Phases" table - if you disagree with any "Skip", add it to Human-Identified Potential Refactors
2. Mark each AI-Identified Tier 2 refactor (2.1 – 2.5) as APPROVE / REJECT / DISCUSS
3. Fill in "Human-Identified Potential Refactors" with your own refactors, or write "None"
4. Tell the AI you've completed your review
5. The AI will discuss: any items you marked DISCUSS + all human-identified items
6. After discussion, the AI fills in "Agreed Refactors Discussion Notes" and "Agreed Refactors Summary Table"
7. The execute phase (04b) runs automatically

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-04-24 19:55.

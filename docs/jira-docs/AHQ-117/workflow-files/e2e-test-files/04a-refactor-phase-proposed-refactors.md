# REFACTOR Analysis: AHQ-117 (e2e test)

**Jira**: [AHQ-117](https://agentic-hq.atlassian.net/browse/AHQ-117)
**Test Type**: e2e
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-04-20 22:15

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

**Primary e2e (manual)**: `cd /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours && node bin/temp-agentic-hq-with-colours.cjs list`
**Result**: PASSING — output contains `\x1b[32m` (green header), `\x1b[34m` (blue AHQ section), `\x1b[31m` (red user section). All three colour wrappers present.

**Regression**: `cd /Users/stevepersonal/dev/agentic-hq/agentic-hq && pnpm test` → **131/131 passing**. No regressions in the unit suite.

Regression e2e suites (`test:e2e:cross-workspace-list-workflows` + `test:e2e:cross-workspace-demo-math-workflow`) are not re-run here — per the command's guidance, running full e2e suites is skipped to conserve Claude Code plan credits. The GREEN-phase summary recorded both as passing at the end of GREEN (3.14s + 75.28s).

---

## Refactoring Opportunities from Previous Phases

Analysis of the AI summary, RED-phase plan, RED-phase summary, GREEN-phase plan, and GREEN-phase summary for deferred items and opportunities.

I searched `{workflow-files}` for `[Rr][Ee][Ff][Aa][Cc][Tt][Oo][Rr]` — all relevant hits (that aren't just boiler-plate phase/command references) are captured below.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | GREEN plan §Jira Requirements #14 (line 58): "ESLint `no-restricted-imports` enforcement of 'no direct `new DefaultX()`' (Add-On §8) → Deferred to REFACTOR". GREEN summary §Deferred Items bullet 1. | Deferred | Add an ESLint rule that forbids `new DefaultClaudeCodeTool(`, `new DefaultCLICommand(`, `new ClaudeWorkflowCommandBuilder(`, `new DefaultWorkflowCommand(`, `new MarshalledCLITool(`, `new WorkflowSearchResultsImpl(` in `src/` production code (outside `src/classwitch-registry/`). Message: "Use `rootServiceRegistry.loadClass('<ServiceName>')` instead — see classwitch how-to §5." Must NOT fire in tests (`tests/**`) or `.agentic-hq/plugins/**/ts-workflow/` — those legitimately `new` the default class. | **RECOMMEND**. This is the enforcement mechanism for the "all `new DefaultX()` must be converted" rule; without it a future edit can silently defeat overrides. Needs careful scoping (src-only, not tests, not ts-workflows). The rule is simple to express with `no-restricted-syntax` or `no-restricted-imports`, but the exact form + exclusions deserve human review. | **Tier 2** — Jira Add-On §8 explicitly requires this; not auto-approved because the exclusion list is a judgement call |
| P.2 | GREEN summary §Deferred Items bullet 2: "`README.md` update with pointer to new how-to guide (Jira AC)". Also AI summary Jira AC. | Deferred | Add a new README section linking to `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md`. | **Promoted to Tier 2** (see Refactor 2.3). VALIDATE is verification-only; Jira AC deliverables must be done in REFACTOR. | **Tier 2** — see 2.3 |
| P.3 | GREEN summary §Deferred Items bullet 3: "`docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` (Jira AC; Add-On §3)". Also Jira AC. | Deferred | Write the new how-to-guide. | **Promoted to Tier 2** (see Refactor 2.2). The guide MUST use service-name = concrete class name (e.g. `DefaultClaudeCodeTool`, not `ClaudeCodeTool`) and MUST show the trailing-comment convention (`// Loads XImpl (default)`) on every `loadClass` code sample. | **Tier 2** — see 2.2 |
| P.4 | GREEN summary §Deferred Items bullet 4: "Improvements to classwitch's own `how-to-convert-project-to-root-classwitch-project.md` (Jira §7)". | Deferred | Fix the classwitch how-to guide to reflect the new service-name convention + trailing-comment convention. | **DONE 2026-04-20 during this analysis session**, before producing this document. Five edits applied to the classwitch guide: Step 4 registry code + rationale paragraph updated to concrete-class-name service keys (with shared-interface example); Step 5 "After" example + explanation updated (trailing comment present); new Step 5 callout paragraph added on the trailing-comment convention; Step 8 README template table + override code example updated; common-pitfalls typo example refreshed. This is a classwitch-side doc change — lands on a separate classwitch commit, NOT in the AHQ-117 agentic-hq commit. | **Skip** — already done (classwitch-side doc change, separate commit) |
| P.5 | GREEN summary §Deferred Items bullet 5: "Draft `docs/jira-docs/AHQ-117/draft-future-jiras/classwitch-jira-draft-for-fixes-and-improvements-to-classwitch-how-to-guide.md` (Jira §7)". AI summary Q4 (human confirmed path). | Deferred | Create a draft Jira doc capturing the classwitch-side fixes discovered during this Jira. | **Promoted to Tier 2** (see Refactor 2.4). Given P.4 (the classwitch guide fix) was already applied directly in this session, the scope of the draft Jira is smaller than originally anticipated — it now covers only: (a) anything still missing from the classwitch guide after the P.4 edits, (b) the 6th-service expansion (P.13), and (c) any wider issues discovered during the AHQ-117 conversion. | **Tier 2** — see 2.4 |
| P.6 | GREEN summary §Deferred Items bullet 6: "Trailing-comment convention update in classwitch how-to guide (Plan Step 4bis)". | Deferred | Add the trailing-comment convention paragraph to the classwitch guide's Step 5. | **DONE 2026-04-20 during this analysis session** as part of P.4's bundle of edits. See P.4. | **Skip** — already done |
| P.7 | AI summary §Question 5 (line 130): "Side effect: `CompositionRoot` becomes a much thinner wrapper, and some of its factory methods — like `getWorkflowCommandBuilder()` — might become redundant. I won't delete anything in this Jira; cleanup can be a later refactor." | Observed (flagged) | Audit whether `CompositionRoot` is still pulling its weight after the classwitch conversion. Post-conversion, `CompositionRoot.getWorkflowCommandBuilder()` does: two `loadClass` lookups, one `this.getCLIWrapper()`, one `this.getCurrentUserWorkspace()`, and one construction — all for a method that's called exactly once (from `app.run()`). | The human explicitly deferred this to a *later* Jira in Q5 ("cleanup can be a later refactor"). Bringing it forward into AHQ-117's REFACTOR would widen scope beyond what's needed to make the e2e test green and pull CompositionRoot redesign into an already-substantial conversion Jira. Also: `CompositionRoot` passes `this` to `DefaultClaudeCodeTool(this)` — it's genuinely a shared context for components that need access to other factory methods, not just a thin wrapper. The "thin wrapper" framing is partly true (two factory methods are now very short) but removing the class would require rewiring `DefaultClaudeCodeTool`'s dependency on `CompositionRoot`. Not trivial. | **Skip** — respect human's explicit "later refactor" instruction; log as a candidate for a future Jira |
| P.8 | GREEN summary §Key implementation decisions #5 (line 40): "`REFACTOR` note preserved (not deleted) when the env-var-setting line moved. ... the env-var-vs-explicit-TS-parameter concern is still valid and was moved to `src/cli/app.ts` alongside the new env-var code." Plus the inline comment in `src/cli/app.ts:55-62`. | Observed (flagged) | The still-valid REFACTOR note in `src/cli/app.ts` says `AGENTIC_HQ_WORKSPACE_ROOT` should perhaps become an explicit TS parameter passed through the system boundary, rather than an env-var-as-global-singleton. Actually act on it now? | This is explicitly a **future REFACTOR** flagged by the human — deliberately NOT AHQ-117's scope. The AI summary Q5 reinforces: the env-var machinery is left as-is. Acting on it now would be huge: touching every place that reads `AGENTIC_HQ_WORKSPACE_ROOT` (grep shows 19+ files), adding a TS parameter through `app.run()` / `CompositionRoot` / `Workspace` constructors. Multi-week refactor disguised as a "small comment". Leave the note; don't act. | **Skip** — out of scope; the REFACTOR comment itself is the correct artefact to preserve |
| P.9 | GREEN summary §Key implementation decisions #6 (line 41): "`allowImportingTsExtensions: true` added to `tsconfig.json`." | Observed | Verify this tsconfig change didn't introduce unintended side effects (e.g. permitting `.ts` extensions across the whole codebase, not just for classwitch deps). | `allowImportingTsExtensions: true` is scoped to the tsconfig; it doesn't force `.ts` extensions, just allows them. The agentic-hq codebase uses `.js` extensions in imports consistently (per Node ESM convention). Running `pnpm validate` → clean; no new warnings. No action needed. | **Skip** — verified clean, no refactor needed |
| P.10 | GREEN summary §Bugs found and fixed #1 (line 47): "Jira was out of date on service naming convention ... `ClaudeCodeTool` interface ditched". | Observed | Ensure the new `DefaultClaudeCodeTool` service is correctly registered under the concrete-class-name convention everywhere. Also ensure no stale `ClaudeCodeTool` interface file remains. | Verified:  (a) `root-registry.ts` uses the 6 concrete-class-name service keys; (b) `src/index.ts` barrel does NOT export a `ClaudeCodeTool` interface (commented explanation at line 17-20); (c) no `src/interfaces/claude-code-tool.ts` file exists (confirmed via Bash ls); (d) `DefaultClaudeCodeTool` is registered under `serviceThatImplements<Tool>()` in `root-registry.ts`. All clean. | **Skip** — verified clean |
| P.11 | GREEN summary §Bugs found and fixed #5 (line 51): "Prettier formatting ... Fixed by running `pnpm exec prettier --write` scoped to just those two files." | Observed | No ongoing refactor — just verification that the scoped-format approach didn't leave residual formatting issues elsewhere. | `pnpm test` passes (which runs `validate` in CI; locally here we ran `pnpm test` → 131/131 green). `format:check` would flag residual issues as part of `pnpm validate` in the commit command later. No action needed at REFACTOR. | **Skip** — verified clean |
| P.12 | GREEN summary §Files Modified (line 62): "bin/agentic-hq.cjs — removed `AGENTIC_HQ_WORKSPACE_ROOT` env-var line; added short comment pointing at app.run()". | Observed | Verify the replacement comment in `bin/agentic-hq.cjs` (lines 23-25) is clear enough for future readers. | Read `bin/agentic-hq.cjs:23-25`: "`AGENTIC_HQ_WORKSPACE_ROOT is now set inside app.run()` (src/cli/app.ts) — see AHQ-117 Add-On §9. Override Projects must NOT set it in their own bin wrappers either; `app.run()` resolves A's own install location." — clear, prescriptive, names the file and Jira reference. No improvement needed. | **Skip** — already clear |
| P.13 | AI summary §Research Findings ("Classwitch How-To Guide Quality"): "it has at least one known gap ... it only covers 5 classes (this Jira is adding `WorkflowSearchResults` as a 6th)." | Observed | Update the classwitch how-to guide to cover `WorkflowSearchResults` as the 6th service. | The P.4 classwitch-guide edit done in this session did NOT expand the 5-class running example to 6 classes. Rationale: the guide is pedagogical (5 classes keeps it readable), and the 6th class's addition belongs logically in the separate classwitch-fixes Jira draft (P.5 / Refactor 2.4). The 2.4 draft will capture this as one of the items to fix. | **Skip** — captured in the classwitch-fixes draft Jira (Refactor 2.4) |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below.

---

## Magic Constants Audit

Files changed or created in the e2e GREEN phase.

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `src/cli/app.ts` | 63, 65 | `'AGENTIC_HQ_WORKSPACE_ROOT'` (env-var name, appears twice) | MAGIC | -> use existing `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` constant (already exported from `src/workflow-discovery/workspace/ahq-workspace-impl.ts`) |
| `src/cli/app.ts` | 65 | `path.resolve(thisFileDir, '..', '..')` — two `'..'` segments walking `src/cli/` up to the repo root | Used once | Borderline. Could extract `SRC_CLI_TO_REPO_ROOT_WALK_UP_SEGMENTS = ['..', '..']` but the walk-up is only one call site and the two dots self-document as "up two levels". Skip. |
| `src/cli/app.ts` | 70 | `'WorkflowSearchResultsImpl'` (service name in `loadClass`) | N/A — service-name string literal is the required ABI (TypeScript validates it at compile time). Extracting would lose type-safety. | Skip — not truly magic |
| `src/classwitch-registry/root-registry.ts` | 41-50 | 6 service-name keys as object-literal keys | N/A — same reasoning as above | Skip |
| `src/kernel/composition-root.ts` | 46, 47-48 | `'DefaultClaudeCodeTool'`, `'ClaudeWorkflowCommandBuilder'` (service names in `loadClass`) | N/A — same reasoning as above | Skip |
| `src/workflow/claude/claude-workflow-command-builder.ts` | 36 | `'DefaultWorkflowCommand'` (service name) | N/A | Skip |
| `src/workflow/workflow-command/default-workflow-command.ts` | 26 | `'DefaultCLICommand'` (service name) | N/A | Skip |
| `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` | 70 | `'DefaultCLICommand'` (service name) | N/A | Skip |
| `src/index.ts` | — | No magic values (barrel file; only re-exports). | Clean | — |
| `bin/agentic-hq.cjs` | — | No new magic values added (pre-existing `'..'` path segments and `.bin/tsx` paths unchanged from AHQ-124). | Clean | — |
| `tsconfig.json` | — | No magic values (config flags only). | Clean | — |
| `package.json` | — | Export subpath strings (`"."`, `"./cli"`, etc.) are part of the public ABI, not magic. | Clean | — |
| Override project: `ColourfulWorkflowSearchResultsImpl` | — | All ANSI codes + header already extracted to `GREEN`/`BLUE`/`RED`/`RESET`/`HEADER`/`SECTION_SEPARATOR` (unit REFACTOR). | Clean | — |
| Override project: `override-registry.ts` | 44 | `'WorkflowSearchResultsImpl'` (service name key) | N/A — same reasoning as service-name literals above | Skip |

**MAGIC entries above are included in Tier 1 refactors below** — only one: the `AGENTIC_HQ_WORKSPACE_ROOT` env-var literal in `src/cli/app.ts` should use the existing exported constant.

---

## Audit To Confirm Methods Used In Production Code (Not Just Tests)

Auditing every method on every interface/class created or modified in this Jira.

**Legend**:
- **✓** = used as intended (interface methods: called through the interface from outside the implementing class; class-only methods: any production caller exists)
- **NOT USED THROUGH INTERFACE ⚠️** = interface method only called by `this.method()` from inside the implementing class (plus possibly tests) — should be made private + removed from the interface
- **TEST-ONLY ⚠️** = zero production callers (not even self-calls); only tests reference it — should be deleted
- **NOT-YET-WIRED** = subsystem entry point, deliberately not yet wired into the CLI (will be wired later) — keep

This Jira creates **no new interfaces or classes on the agentic-hq side** — it only rewires existing ones via the classwitch registry. The two new *artefacts* on the agentic-hq side are:
- `rootServiceRegistry` — a `const` singleton (not a class), from classwitch. No methods owned by agentic-hq.
- `src/index.ts` — a barrel of re-exports. No methods.

Methods to audit: (a) the pre-existing methods whose *call sites* now go through `loadClass`, and (b) the override-project class whose methods were audited in the unit REFACTOR cycle but where "NOT-YET-WIRED" status may now have changed.

| Interface / Class | Method | Status | Evidence |
|---|---|---|---|
| `app` (const, `src/cli/app.ts`) | `run()` | ✓ | Called from `src/cli/main.ts:1-3` (external caller). |
| `CompositionRoot` (`src/kernel/composition-root.ts`) | `getWorkflowCommandBuilder()` | ✓ | Called from `src/cli/app.ts:69` (external caller). |
| `CompositionRoot` | `getAhqWorkspace()`, `getCurrentUserWorkspace()`, `getCLIWrapper()`, `getIOMarshallerSessionFactory()` | ✓ | Not touched by this Jira; pre-existing contract; production callers exist. Noted for completeness. |
| `ClaudeWorkflowCommandBuilder` | `build()` | ✓ | Called through `WorkflowCommandBuilder` interface from external code. |
| `DefaultWorkflowCommand` | `execute()` | ✓ | Called through `WorkflowCommand` interface from external code. |
| `ClaudeCommandBuilder` | `build()` | ✓ | Called through `MarshalledIOCLICommandBuilder` interface. |
| `WorkflowSearchResults` interface (in `agentic-hq`) | `getWorkflowsListingString()` | ✓ | Called through the interface from `src/cli/agentic-hq-program.ts:48`. Override's class now flows into that call at runtime via classwitch. |
| `WorkflowSearchResults` interface | `registerWorkflowsWith(registry)` | ✓ **(status upgraded from NOT-YET-WIRED)** | Called through the interface from `src/cli/agentic-hq-program.ts:52`. Unit REFACTOR marked this NOT-YET-WIRED because the override project had no Classwitch wiring yet. E2e GREEN wired it: the override class is registered in `override-registry.ts:43-47`, its `registerWorkflowsWith` WILL be invoked when `temp-agentic-hq-with-colours <any-non-list-command>` runs — for the primary e2e test (which only runs `list`), `getWorkflowsListingString()` is exercised and the wiring is proven by that. Full exercise of `registerWorkflowsWith` happens when an override-project user invokes a workflow subcommand; tested via regression `pnpm test:e2e:cross-workspace-list-workflows` + existing unit test coverage on the interface method. |
| `ColourfulWorkflowSearchResultsImpl` | `getWorkflowsListingString()` | ✓ | Flowed through via classwitch — proven by the primary e2e test output containing the three colour wrappers. |
| `ColourfulWorkflowSearchResultsImpl` | `registerWorkflowsWith(registry)` | ✓ | Same upgrade path as the interface method. Wired via classwitch; will be invoked on non-`list` override commands. |

**Flagged methods**:
- None — all methods have legitimate external callers through the interfaces.

No class-level API surface was added by this Jira, so no "hidden interface bloat" to flag.

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.1 | Use existing constant | In `src/cli/app.ts`, replace the two `'AGENTIC_HQ_WORKSPACE_ROOT'` string literals (lines 63 and 65, used inside `app.run()`) with the already-exported `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` constant from `../workflow-discovery/workspace/ahq-workspace-impl.js`. Evidence this constant exists and is the canonical name: `tests/unit/kernel/composition-root.unit.test.ts` already imports it. This keeps a single source of truth for the env-var identifier and makes future renames/refactors touch one place. | `src/cli/app.ts` Lines: `63`, `65` |

---

## Tier 2: AI-Identified Potential Refactors

Include ALL potential structural refactors here - both ones I recommend AND ones I'm unsure about or think shouldn't be done. The human decides; my job is to surface them all with honest opinions.

### Refactor 2.1: Add ESLint `no-restricted-imports` / `no-restricted-syntax` rule forbidding direct `new DefaultX()` in `src/`

**Type**: Lint-rule addition (config change in `eslint.config.mjs`)
**Description**: Add an ESLint rule that errors on any occurrence of `new DefaultClaudeCodeTool(`, `new DefaultCLICommand(`, `new ClaudeWorkflowCommandBuilder(`, `new DefaultWorkflowCommand(`, `new MarshalledCLITool(`, or `new WorkflowSearchResultsImpl(` in files under `src/` **except** `src/classwitch-registry/`. Message suggests using `rootServiceRegistry.loadClass('<ServiceName>')` instead, and points to the classwitch how-to guide §5. Scope EXCLUDED: `tests/**`, `.agentic-hq/plugins/**/ts-workflow/**`, `docs/**`.
**AI Recommendation**: **RECOMMEND**. This is the enforcement mechanism the Jira Add-On §8 explicitly calls for — without it, a future edit can silently defeat overrides with zero feedback (the exact footgun the whole conversion is meant to fix). The rule itself is short and simple to express. The main design decision is the exclusion list, which is a judgement call: tests legitimately `new` default classes (it's what they're testing), and ts-workflow scripts run in separate Node processes that don't use the registry.
**Risk**:
  - The rule could false-positive on legitimate registry-internal `new` calls (in `root-registry.ts` itself); mitigated by excluding `src/classwitch-registry/`.
  - Could false-positive on migration edits where a contributor genuinely needs to add a new service and is mid-transition; mitigated by allowing `// eslint-disable-next-line` with a reason comment.
  - Rule syntax: `no-restricted-syntax` with AST selector is the most precise option; `no-restricted-imports` only catches imports, not constructor calls. **Use `no-restricted-syntax`** with a `NewExpression[callee.name=...]` selector.
**Files affected**: `eslint.config.mjs` (one file).

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.2: Write the `how-to-create-your-own-classwitch-override-project.md` how-to guide

**Type**: New documentation deliverable (Jira AC; Add-On §3). **Previously classified as VALIDATE — reclassified as REFACTOR per user memory `feedback_validate_phase_is_verification_only`**: VALIDATE is verification-only, so all AC deliverables must be done here.

**Description**: Create `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md`. Mirrors the **Intro / worked example / Summary / Troubleshooting** structure that the Jira AC calls for. Uses the real override project at `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours` as the worked example (that's what AHQ-117 built; reusing it keeps the guide synced with code that the test suite exercises).

Hard requirements for the content:
- **Service names = concrete default class names** (e.g. `DefaultClaudeCodeTool`, `WorkflowSearchResultsImpl`), NOT interface names. Every `loadClass` / `overrideExistingServices` call in the guide must use the new convention.
- **No trailing-comment convention** on `loadClass` code samples. Do NOT include `// Loads <DefaultClassName> (default)` comments — see Refactor 2.5 for the rationale (the convention is being removed because the service name now *is* the default class name, making the comment redundant). If 2.5 is approved, write 2.2 without the trailing comments; if 2.5 is rejected, add them back.
- **Side-effect-import ordering is load-bearing**: the override-registry module MUST be side-effect-imported *before* `import { app } from 'agentic-hq/cli'` — flipping the order silently defeats the override.
- **The `bin/<override>.cjs` wrapper MUST NOT set `AGENTIC_HQ_WORKSPACE_ROOT`** — `app.run()` resolves A's own install location from `import.meta.url`. Setting the env var in an override wrapper silently points A at the override root and hides A's workflows (the AHQ-117 Add-On §9 footgun).
- **Constructor args on override classes must be optional-with-defaults** so classwitch's no-arg `new Klass()` call path works (mirror what `ColourfulWorkflowSearchResultsImpl` does with `AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl` defaults).
- **tsconfig requires `allowImportingTsExtensions: true`** for override projects (classwitch ships TS source and uses `.ts` imports internally).
- **Pointer to the classwitch how-to guide** at `classwitch/docs/how-to-guides/how-to-convert-project-to-root-classwitch-project.md` for the root-project side; this guide complements it by covering the override side specifically for agentic-hq consumers.
- **Available services table** — lists the 6 agentic-hq services with the columns `Service name | Interface | Default class`, formatted the same way as the classwitch how-to guide's Step 8 template table.

**AI Recommendation**: **RECOMMEND**. This is explicit Jira AC and the override project already built during AHQ-117 makes a perfect worked example. Writing it now means the guide and the code were written against the same mental model, which won't be true if we write it months later.

**Risk**: Guide drifts from the code if either side changes. Mitigate with a short "authoritative source" pointer at the top of the guide ("the canonical example lives at `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours/`; if that project changes, update this guide"). No automated consistency check — future discipline.

**Files affected**:
- NEW: `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md`

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.3: Add `README.md` section pointing at the new how-to guide

**Type**: Documentation update (Jira AC). **Previously classified as VALIDATE — reclassified as REFACTOR per user memory `feedback_validate_phase_is_verification_only`**.

**Description**: Add a new section to the main `README.md` at the repo root, usually near the bottom, pointing contributors at the new how-to guide (2.2). Short section — one or two paragraphs + a bullet list of the 6 services (or a pointer to the table inside the new guide to avoid duplicating the authoritative list in two places). Mirror the style of the "Extending via Classwitch Override Projects" block shown in the classwitch how-to guide's Step 8 template, but tailored to agentic-hq (names, links, concrete-class-name convention).

**AI Recommendation**: **RECOMMEND**. One-screen section, low risk, directly required by the Jira AC. Ideally write it *after* 2.2 is written so the link target exists.

**Risk**: README duplication of the service table — mitigated by having the README link into the guide rather than repeat the table, or by keeping the README pointer terse and leaving authoritative content in the guide.

**Files affected**:
- MODIFY: `README.md` (one new section)

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.4: Write the draft classwitch-fixes future-Jira doc

**Type**: Draft doc for a future classwitch-side Jira (Jira §7; AI summary Q4 confirmed path). **Previously classified as VALIDATE — reclassified as REFACTOR per user memory `feedback_validate_phase_is_verification_only`**.

**Description**: Create `docs/jira-docs/AHQ-117/draft-future-jiras/classwitch-jira-draft-for-fixes-and-improvements-to-classwitch-how-to-guide.md`. This is a *draft for a future classwitch Jira* — it doesn't execute until someone picks it up and turns it into a real classwitch-repo Jira.

Items to capture in the draft (based on what was discovered during this Jira):
1. **6th-service expansion** (P.13) — the classwitch guide's running example still only covers 5 classes; extending it to show `WorkflowSearchResults` as the 6th service would make the guide match the real post-AHQ-117 agentic-hq state.
2. **Any gaps remaining in the classwitch guide after the P.4 edits** — spot-check the updated guide against the AHQ-117 conversion experience and capture anything still missing or unclear.
3. **Suggestions for a "shared interface" worked example** in the classwitch guide — the fact that two services (`DefaultClaudeCodeTool` and `MarshalledCLITool`) share the `Tool` interface is the whole reason the service-name convention had to change to concrete class names. A short worked example in the guide would reinforce the lesson.
4. **Anything else uncovered during AHQ-117 conversion** that the AI picks up on re-read — e.g. the `package.json` `exports` widening (Jira Add-On §1) turned out to need 5 subpaths, not the single line the guide hand-waves about.

**AI Recommendation**: **RECOMMEND**. Cheap to write while the details are fresh. If we wait, the "what was confusing" signal fades.

**Risk**: None material — it's a draft file inside `agentic-hq`, not a real Jira, so no external audience yet.

**Files affected**:
- NEW: `docs/jira-docs/AHQ-117/draft-future-jiras/classwitch-jira-draft-for-fixes-and-improvements-to-classwitch-how-to-guide.md`

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.5: Remove the `// Loads <DefaultClassName> (default)` trailing-comment convention

**Type**: Simplification / remove now-redundant convention (cross-cut: code + docs + memory feedback)

**Description**: The trailing-comment convention was introduced when service names *differed* from concrete class names (e.g. `loadClass('ClaudeCodeTool')` returning `DefaultClaudeCodeTool` — the service-name-as-interface-name convention from the original Jira plan). In that world a trailing `// Loads DefaultClaudeCodeTool (default)` comment earned its keep: it bridged the gap between "service lookup key" and "class that actually runs unoverridden" so a reader didn't need to open the registry.

After the mid-Jira service-name correction (service name = concrete default class name), `loadClass('DefaultClaudeCodeTool')` is self-documenting: the string literal *is* the default class name. The trailing comment now just restates the service-name argument with slightly different wording — pure noise. Even in an override scenario the service-name key still names the default (the override swaps the class behind the key, but the key itself — i.e. the first thing a reader sees — still names the default class that runs unoverridden).

Scope of this refactor:

1. **agentic-hq code** — delete the trailing comment from every `loadClass` call site:
   - `src/cli/app.ts:70` (`// Loads WorkflowSearchResultsImpl (default)`)
   - `src/kernel/composition-root.ts:46` (`// Loads DefaultClaudeCodeTool (default)`)
   - `src/kernel/composition-root.ts:47-49` (`// Loads ClaudeWorkflowCommandBuilder (default)`)
   - `src/workflow/claude/claude-workflow-command-builder.ts:36` (`// Loads DefaultWorkflowCommand (default)`)
   - `src/workflow/workflow-command/default-workflow-command.ts:26` (`// Loads DefaultCLICommand (default)`)
   - `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts:70` (`// Loads DefaultCLICommand (default)`)

2. **classwitch how-to guide** (`classwitch/docs/how-to-guides/how-to-convert-project-to-root-classwitch-project.md`) — separate commit, classwitch-side:
   - Remove the trailing `// Loads DefaultClaudeCodeTool (default)` comment from the Step 5 "After" code block.
   - Remove the "Convention: name the current default in a trailing comment." callout paragraph added during the previous session's classwitch-guide edit (the paragraph directly after the "What changed" bullet list in Step 5).
   - Remove the `// Loads DefaultXxx (default)` reference from the summary checklist line near the end of the guide (restore to just the `loadClass('DefaultXxx')` replacement check).

3. **User-memory feedback** — delete `/Users/stevepersonal/.claude/projects/-Users-stevepersonal-dev-agentic-hq-agentic-hq/memory/feedback_classwitch_loadclass_trailing_comment.md` and remove its pointer line from `MEMORY.md`. The convention is gone; the memory no longer applies. Replace nothing — the service-name convention itself (memory `feedback_classwitch_root_project_comments.md` already covers commenting the *design intent* at file level) carries enough guidance.

4. **Analysis doc self-consistency** — the DR.9 row in §Project Design Requirements Compliance Audit currently asserts the trailing-comment convention is met; after 2.5 executes, that DR will no longer exist (it was never in the formal design-requirements doc, only in memory). The 04b executor should also remove the DR.9 row from the agreed-refactors summary-table notes, since the underlying requirement has been retired.

**AI Recommendation**: **STRONGLY RECOMMEND**. The convention no longer earns its keep. Keeping it adds visual noise to 6 production lines + a ~150-word classwitch-guide paragraph + a ~20-line memory file, all restating what the service-name string already says. Removing it now (before 2.2 writes the new how-to guide) also prevents the new guide from baking the outdated convention in.

**Risk**: Near-zero. The changes are comment deletions only — no runtime behaviour change, no API-surface change, no type-signature change. The only "risk" is if a reader relied on the comment to know the default class; after 2.5, they'll read the service-name literal itself (which they already had to read to understand the `loadClass` call) and get the same information.

**Files affected**:
- 6 `.ts` files in `src/` (agentic-hq commit)
- 1 `.md` file in `classwitch/docs/how-to-guides/` (separate classwitch commit)
- 1 `.md` memory file deletion + 1 line removal from `MEMORY.md` (user-memory)
- 1 hard-requirements edit to Refactor 2.2's description (already done preemptively in this doc, contingent on 2.5 approval)

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None". Everything added here will be discussed with the AI before a decision is made.

> **MANDATORY**: You MUST either add refactors here OR write "None" before the execute phase can proceed.

None

---

## Project Design Requirements Compliance Audit

**Design Requirements File**: `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/dev/project-design-requirements.md`

| # | Requirement | Evidence (files, classes, patterns) | Status | Refactoring Proposal (if needed) |
|---|-------------|-------------------------------------|--------|----------------------------------|
| DR.1 | Class/interface pair for every concept | This Jira introduces no new concepts — it rewires 6 existing concepts through classwitch. Pre-existing class/interface pairs (`CLICommand`/`DefaultCLICommand`, `WorkflowCommand`/`DefaultWorkflowCommand`, `WorkflowCommandBuilder`/`ClaudeWorkflowCommandBuilder`, `Tool`/`MarshalledCLITool`+`DefaultClaudeCodeTool`, `WorkflowSearchResults`/`WorkflowSearchResultsImpl`) are verified present by `src/index.ts:21-25` type exports. `ClaudeCodeTool` as a standalone interface was deliberately dropped (see GREEN summary Decision #2) because `DefaultClaudeCodeTool extends MarshalledCLITool implements Tool` — no separate interface needed. | MET | — |
| DR.2 | Default naming convention (`Default<X>` or `<X>Impl` implementing `<X>` interface, depending on precedent) | All 6 default classes follow pre-existing naming. `DefaultClaudeCodeTool`, `DefaultCLICommand`, `DefaultWorkflowCommand` use `Default` prefix; `ClaudeWorkflowCommandBuilder`, `MarshalledCLITool`, `WorkflowSearchResultsImpl` use existing non-prefixed / `Impl`-suffixed names. Mixed but consistent with prior art. | MET | — |
| DR.3 | Tell, don't ask / push work into objects | `app.run()` asks `rootServiceRegistry` for the class and constructs it (pushes construction-responsibility to the registry). `CompositionRoot.getWorkflowCommandBuilder()` asks the registry for classes and composes them. No "get then manipulate" patterns introduced. | MET | — |
| DR.4 | **Switchability** — could a third party replace any concrete class easily? | **THIS JIRA IS THE DIRECT REALISATION OF THIS REQUIREMENT.** Before AHQ-117: `app.run()` hard-coded `new WorkflowSearchResultsImpl()`; `CompositionRoot` hard-coded `new DefaultClaudeCodeTool()` etc. Third parties could not switch any of these without editing agentic-hq source. After AHQ-117: all 6 services go through `rootServiceRegistry.loadClass(...)`, and an override project can `rootServiceRegistry.overrideExistingServices({ ... })` *before* `app.run()` to swap any of them. Proven by the primary e2e test — the temp override project at `temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours` swaps `WorkflowSearchResultsImpl` and its replacement's ANSI-coloured output appears in the listing. | **MET** | — |
| DR.5 | Minimal state — are fields being used to cache intermediate state unnecessarily? | New code adds zero new fields. `app` is a stateless `const` with a `run()` method. `rootServiceRegistry` holds only the service-map data structure maintained by classwitch itself (required, not caching). `CompositionRoot` fields were not touched. | MET | — |
| DR.6 | Balance caveat — is the implementation appropriately balanced (not fractured to the extreme)? | Two new files added (`src/index.ts`: 42 lines; `src/classwitch-registry/root-registry.ts`: 52 lines). Both are single-purpose (public barrel, service registry). No speculative helper classes, no new abstractions beyond what classwitch itself requires. `CompositionRoot` kept as-is despite being a thin wrapper post-conversion (per human's explicit instruction in AI-summary Q5: "cleanup can be a later refactor"). | MET | — |
| DR.7 | **Concept Table / Data Dictionary / English Language Description** | Explicitly skipped per AI summary Question 6 (Steve approved: "Fine to skip"). No new concepts introduced — this is a conversion Jira. | NOT APPLICABLE | — |
| DR.8 | Classwitch Root Project files must comment the design intent (user-memory `feedback_classwitch_root_project_comments`) | `src/index.ts:1-15` carries a "why this file exists" comment naming the barrel's role in the Classwitch Override surface and citing AHQ-117 Add-On §1. `src/classwitch-registry/root-registry.ts:1-25` carries a detailed header naming the override plug-in point, showing an `overrideExistingServices` example, and documenting the service-name convention + AHQ-117 Add-On §2 reference. `src/cli/app.ts:1-43` carries an extended SRP block explaining why the bootstrap is a standalone `app` const (Classwitch Override reuse surface). `bin/agentic-hq.cjs:15-25` explains the classwitch override pattern for bin-wrapper files and cross-references app.run() + AHQ-117 Add-On §9. Override project's `override-registry.ts:1-35` carries a "WHY THIS FILE EXISTS — the override plug-in point" block. All match the memory feedback. | MET | — |
| DR.9 | Classwitch `loadClass` lines need a trailing `// Loads <DefaultClassName> (default)` comment (user-memory `feedback_classwitch_loadclass_trailing_comment`) | All 6 `loadClass` call sites carry the trailing comment: `src/cli/app.ts:70`, `src/kernel/composition-root.ts:46`, `:47-48` (multi-line), `src/workflow/claude/claude-workflow-command-builder.ts:36`, `src/workflow/workflow-command/default-workflow-command.ts:26`, `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts:70`. | MET | — |
| DR.10 | Preserve existing REFACTOR / design-intent comments when editing (user-memory `feedback_do_not_delete_comments`) | The still-valid half of the `NOTE RE REFACTOR` block previously in `bin/agentic-hq.cjs` was restored in `src/cli/app.ts:55-62` after a mid-GREEN slip that deleted it. GREEN summary §Bugs found #2 documents this (and the memory feedback was created from that incident). REFACTOR note present and clear. | MET | — |

**Summary**: 9 of 10 requirements MET, 0 PARTIALLY MET, 0 NOT MET, 1 NOT APPLICABLE (DR.7, per Steve's approved skip).

> **Note to human**: No PARTIALLY MET items → no refactoring proposals added to Tier 2 from this audit. The design-requirements compliance is clean; the `DR.4 Switchability` requirement — partly met in the unit cycle's REFACTOR analysis — is **now fully met** after this e2e cycle's GREEN landing.

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 1 |
| Tier 2 AI-Identified (Pending review) | 5 |
| Design Requirements Audit (items needing action) | 0 |
| **Total identified by AI** | 6 |

Separately: 2 deferred items were **already addressed during this analysis session** (the classwitch how-to guide fix + the trailing-comment convention update — both on the classwitch side, not part of the AHQ-117 agentic-hq commit).

**Reclassification note**: Three items (new agentic-hq how-to guide, README update, draft classwitch-fixes Jira) were initially classified as "Skip — belongs to VALIDATE". Per user feedback during this analysis session (saved as memory `feedback_validate_phase_is_verification_only`), VALIDATE is verification-only — all Jira AC deliverables must be done in REFACTOR. Those three items are now 2.2, 2.3, 2.4 above.

---

## Agreed Refactors Discussion Notes

No items required discussion. The human marked all 5 AI-identified Tier 2 refactors (2.1 through 2.5) as APPROVE, wrote "None" under Human-Identified Potential Refactors, and did not mark any item DISCUSS. The Tier 1 item is auto-approved per the guidance. All 6 items flow straight into the summary table below without debate.

Of note — 2.5 was added mid-analysis after the human pointed out that the trailing-comment convention (formalised yesterday in the classwitch how-to guide edit and in memory feedback) became redundant once service names switched to being concrete default class names. The human's direction — "no longer need [the trailing comments] ... remove any need for them in any documentation" — is captured verbatim as 2.5's scope. Approving 2.5 means 2.2's new how-to guide will be written without the trailing-comment convention from the start (the hard-requirements list on 2.2 already reflects this).

---

## Agreed Refactors Summary Table

> This is the single source of truth for the execute phase (04b). For detail on any item, see the corresponding Refactor section above (2.1 through 2.5) plus the discussion-notes paragraph.

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 1.1 | AI (Tier 1) | Replace the two `'AGENTIC_HQ_WORKSPACE_ROOT'` string literals in `src/cli/app.ts` (lines 63, 65, inside `app.run()`) with the already-exported `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR` constant from `../workflow-discovery/workspace/ahq-workspace-impl.js`. Keeps a single source of truth for the env-var identifier. | EXECUTE | Auto-approved Tier 1 — use-existing-constant |
| 2.1 | AI (Tier 2) | Add an ESLint `no-restricted-syntax` rule (in `eslint.config.mjs`) forbidding `new DefaultClaudeCodeTool(`, `new DefaultCLICommand(`, `new ClaudeWorkflowCommandBuilder(`, `new DefaultWorkflowCommand(`, `new MarshalledCLITool(`, or `new WorkflowSearchResultsImpl(` in files under `src/` **except** `src/classwitch-registry/`. Message points at `rootServiceRegistry.loadClass('<ServiceName>')` and the classwitch how-to §5. EXCLUDE: `tests/**`, `.agentic-hq/plugins/**/ts-workflow/**`, `docs/**`. Use AST selector `NewExpression[callee.name=...]`. | EXECUTE | Approved by human — Jira Add-On §8 enforcement |
| 2.2 | AI (Tier 2) | Write `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` with Intro / worked example / Summary / Troubleshooting. Use the temp override project as the worked example. **Contingent-on-2.5-approval constraint now active (2.5 = APPROVE)**: write the guide WITHOUT the trailing-comment convention on `loadClass` samples. All other hard requirements from 2.2's description apply (service-name convention, load-bearing import order, env-var footgun, optional-default constructor args, `allowImportingTsExtensions`, pointer to classwitch how-to, services table, authoritative-source pointer at top). | EXECUTE | Approved by human — Jira AC deliverable, now in REFACTOR per VALIDATE-is-verification-only feedback |
| 2.3 | AI (Tier 2) | Add a new `README.md` section near the bottom pointing at the new how-to guide (2.2). One-two paragraphs + a terse pointer or link into the guide's services table (avoid duplicating the authoritative list). Mirror the classwitch how-to guide's Step 8 template style, tailored to agentic-hq. Write AFTER 2.2 so the link target exists. | EXECUTE | Approved by human — Jira AC deliverable |
| 2.4 | AI (Tier 2) | Write `docs/jira-docs/AHQ-117/draft-future-jiras/classwitch-jira-draft-for-fixes-and-improvements-to-classwitch-how-to-guide.md` capturing: (1) 6th-service expansion (P.13); (2) any remaining gaps in the classwitch guide after the P.4 edits; (3) a "shared interface" worked example suggestion; (4) anything else uncovered during AHQ-117. | EXECUTE | Approved by human — draft for future classwitch Jira |
| 2.5 | AI (Tier 2) | Remove the `// Loads <DefaultClassName> (default)` trailing-comment convention: (a) delete trailing comment from all 6 `loadClass` call sites in `src/`; (b) classwitch-side edit (separate commit) to the how-to guide — remove Step 5 trailing-comment paragraph + Step 5 "After" trailing comment + summary-checklist reference; (c) delete `memory/feedback_classwitch_loadclass_trailing_comment.md` and remove its `MEMORY.md` pointer line; (d) 04b executor should drop DR.9 from its summary-table notes since the underlying requirement is retired. | EXECUTE | Approved by human — convention is now redundant because service name = concrete default class name |

---

## Next Steps

1. Review the "Previous Phases" table - if you disagree with any "Skip", add it to Human-Identified Potential Refactors
2. Mark each AI-Identified Tier 2 refactor (2.1 ESLint rule, 2.2 new how-to guide, 2.3 README update, 2.4 draft classwitch-fixes Jira, 2.5 remove trailing-comment convention) as APPROVE / REJECT / DISCUSS
3. Fill in "Human-Identified Potential Refactors" with your own refactors, or write "None"
4. Tell the AI you've completed your review
5. The AI will discuss: any items you marked DISCUSS + all human-identified items
6. After discussion, the AI fills in "Agreed Refactors Discussion Notes" and "Agreed Refactors Summary Table"
7. The execute phase (04b) runs automatically

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-04-22.

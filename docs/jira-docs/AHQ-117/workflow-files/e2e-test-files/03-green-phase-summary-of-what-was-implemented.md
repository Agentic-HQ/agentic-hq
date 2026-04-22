# GREEN Phase Complete: AHQ-117 (e2e test)

**Jira**: [AHQ-117](https://agentic-hq.atlassian.net/browse/AHQ-117)
**Test Type**: e2e
**Phase**: GREEN (Minimal Implementation)
**Generated**: 2026-04-20

---

## Implementation Created

**Test Command (primary e2e, manual)**:

```bash
cd /Users/stevepersonal/dev/agentic-hq/temp-test-workspaces/test-agentic-hq-classwitch-override-project-001-with-colours
node bin/temp-agentic-hq-with-colours.cjs list
```

**Test Result**: ✅ PASSING — output wraps the header in `\x1b[32m` (green), the AHQ section in `\x1b[34m` (blue), and the user section in `\x1b[31m` (red).

Regression suite (also green):

- `pnpm validate` in `agentic-hq` → typecheck + lint + format + 131/131 unit tests pass
- `pnpm typecheck && pnpm test:unit` in the temp override project → 1/1 unit test passes
- `pnpm test:e2e:cross-workspace-list-workflows` → pass (3.14s)
- `pnpm test:e2e:cross-workspace-demo-math-workflow` → pass (75.28s)

---

## What Was Implemented

Converted `agentic-hq` into a Classwitch Root Project by widening its public exports, adding a root service registry, and swapping every direct `new DefaultX()` call site to go through `rootServiceRegistry.loadClass(...)`. The override project at `test-agentic-hq-classwitch-override-project-001-with-colours` can now swap in `ColourfulWorkflowSearchResultsImpl` without further changes to `agentic-hq`.

### Key implementation decisions:

1. **Service names are the concrete default class name** (e.g. `WorkflowSearchResultsImpl`, `DefaultClaudeCodeTool`), not the interface name. Reason: two services (`DefaultClaudeCodeTool` and `MarshalledCLITool`) share the `Tool` interface, so interface names cannot uniquely identify services. Followed the Jira's mid-flight correction.
2. **`ClaudeCodeTool` interface was NOT created.** An earlier Jira dropped it as redundant — `DefaultClaudeCodeTool extends MarshalledCLITool implements Tool`. The barrel exports 15 symbols (5 interfaces + 6 default classes + 4 composition helpers), not 16.
3. **Trailing-comment convention applied at every `loadClass` call site.** Each `rootServiceRegistry.loadClass('X')` line ends with `// Loads XImpl (default)` so readers don't need to open the registry to learn the default class.
4. **`AGENTIC_HQ_WORKSPACE_ROOT` resolution moved into `app.run()`.** Resolved from `import.meta.url`, guarded by `if (!process.env...)` to preserve test injection. Override projects' `bin/*.cjs` wrappers now set NO env vars — the Add-On §9 footgun is gone.
5. **REFACTOR note preserved (not deleted) when the env-var-setting line moved.** The old `NOTE RE REFACTOR` block in `bin/agentic-hq.cjs` raised two concerns; the Classwitch-override one is resolved by §9 and was dropped, but the env-var-vs-explicit-TS-parameter concern is still valid and was moved to `src/cli/app.ts` alongside the new env-var code.
6. **`allowImportingTsExtensions: true` added to `tsconfig.json`.** Classwitch ships TS source only and uses `.ts` in its internal imports. Discovered during Step 9 typecheck; Jira Add-On §4 explicitly required this verification.
7. **`classwitch` added as a dependency of `agentic-hq`** (`"classwitch": "file:../classwitch"`). Pre-existing mention in `package.json` was only in a demo-plugin script command, not a real dep.
8. **Out of GREEN scope, deferred**: ESLint `no-restricted-imports` rule (Jira Add-On §8), README update, `how-to-create-your-own-classwitch-override-project.md`, classwitch how-to-guide improvements, `classwitch-jira-draft` — all tracked for REFACTOR / VALIDATE.

### Bugs found and fixed during GREEN:

1. **Jira was out of date on service naming convention** — the plan was built against "ServiceName = interface name", but mid-implementation the human pointed out the Jira had been updated to "ServiceName = concrete class name" (plus `ClaudeCodeTool` interface ditched). Added a "Post-Approval Amendment" section at the top of the approved plan capturing the deltas, then updated `src/index.ts`, `src/classwitch-registry/root-registry.ts`, all 6 `loadClass` call sites, and the override project's `override-registry.ts` to use the new names. A dangling `src/interfaces/claude-code-tool.ts` file I had created was deleted.
2. **Removed REFACTOR comment by mistake** — initial edit to `bin/agentic-hq.cjs` stripped the entire "NOTE RE REFACTOR" block per Jira Add-On §9 wording. Human flagged the loss; the still-valid half (env-var-as-global-singleton vs explicit TS parameter) was restored in `src/cli/app.ts`. Saved as a memory feedback: `feedback_do_not_delete_comments.md`.
3. **TypeScript `TS5097` errors on classwitch `.ts` import paths** — `tsc --noEmit` failed with "An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled." Fixed by adding `allowImportingTsExtensions: true` to `tsconfig.json` (Add-On §4 had flagged this verification as required).
4. **ESLint `import/order` violations in the new registry** — three type/value import ordering errors. Fixed by reordering imports within `root-registry.ts` (type imports grouped with matching value imports by path).
5. **Prettier formatting** — two files (`root-registry.ts`, `composition-root.ts`) triggered `format:check` warnings. Fixed by running `pnpm exec prettier --write` scoped to just those two files (per project formatting-scope discipline).

## Files Created

- `/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/index.ts` — 15-symbol barrel for override projects
- `/Users/stevepersonal/dev/agentic-hq/agentic-hq/src/classwitch-registry/root-registry.ts` — `rootServiceRegistry` with 6 services (concrete-class service names)

## Files Modified

- `package.json` — widened `exports` to 5 subpaths; added `classwitch: file:../classwitch` dep
- `tsconfig.json` — added `"allowImportingTsExtensions": true`
- `bin/agentic-hq.cjs` — removed `AGENTIC_HQ_WORKSPACE_ROOT` env-var line; added short comment pointing at app.run()
- `src/cli/app.ts` — centralised `AGENTIC_HQ_WORKSPACE_ROOT` resolution via `import.meta.url`; restored REFACTOR note (still-valid half); swapped `new WorkflowSearchResultsImpl()` → `loadClass('WorkflowSearchResultsImpl')`
- `src/kernel/composition-root.ts` — swapped `new DefaultClaudeCodeTool()` + `new ClaudeWorkflowCommandBuilder()` to `loadClass(...)`
- `src/workflow/claude/claude-workflow-command-builder.ts` — swapped `new DefaultWorkflowCommand()` to `loadClass('DefaultWorkflowCommand')`
- `src/workflow/workflow-command/default-workflow-command.ts` — swapped `new DefaultCLICommand()` to `loadClass('DefaultCLICommand')`
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` — swapped `new DefaultCLICommand()` to `loadClass('DefaultCLICommand')`

### Override project (`test-agentic-hq-classwitch-override-project-001-with-colours`)

- `src/workflow-discovery/workflow-listing/colourful-workflow-search-results-impl.ts` — replaced inline structural types with cross-package imports from `agentic-hq`; made constructor args optional-with-defaults
- `src/classwitch-registry/override-registry.ts` — `overrideExistingServices` key changed from `WorkflowSearchResults` → `WorkflowSearchResultsImpl`; doc comment updated for new service-name convention

---

## Deferred Items (belong to REFACTOR or VALIDATE)

- ESLint `no-restricted-imports` rule enforcing "no direct `new DefaultX()`" (Jira Add-On §8)
- `README.md` update with pointer to new how-to guide (Jira AC)
- `docs/dev/how-to-guides/how-to-create-your-own-classwitch-override-project.md` (Jira AC; Add-On §3). **When this new guide is written, it MUST use the new service-name convention from the start: service names = concrete default class name (e.g. `DefaultClaudeCodeTool`, not `ClaudeCodeTool`) — see the 6 services registered in `src/classwitch-registry/root-registry.ts` for the authoritative names. It MUST also show the trailing-comment convention on every `loadClass` code sample (`// Loads XImpl (default)`), matching the updated classwitch how-to guide.**
- ~~Improvements to classwitch's own `how-to-convert-project-to-root-classwitch-project.md` (Jira §7)~~ — **done 2026-04-20** as a classwitch-side edit outside this Jira's commit: Step 4 registry code + rationale paragraph updated to the new service-name convention (class names, not interface names); Step 5 "After" example + "What changed" updated; trailing-comment convention paragraph added after Step 5's "What changed" bullets; Step 8 README template table + override code example updated; common-pitfalls typo example refreshed to the new convention.
- Draft `docs/jira-docs/AHQ-117/draft-future-jiras/classwitch-jira-draft-for-fixes-and-improvements-to-classwitch-how-to-guide.md` (Jira §7)
- ~~Trailing-comment convention update in classwitch how-to guide (Plan Step 4bis)~~ — **done 2026-04-20** as part of the classwitch how-to guide edit above (new paragraph after Step 5's "What changed" bullets). Still a classwitch-side doc change, so stays out of the agentic-hq AHQ-117 commit and will land via its own classwitch commit/Jira.

---

## Ready for REFACTOR Phase

The primary e2e test is green. This program should self terminate, and the automated workflow will next run:

```
/agentic-hq-demos-plugin:full-jira-tdd-story-workflow:04a-jira-refactor-analysis AHQ-117 e2e
```

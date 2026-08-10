# AHQ-197 — Review Summary

## Review Summary

The staged-release-tree build and the explicit `build-mode`/`ahq-package-root` parameter chain
both shipped as specified, with strong evidence: four of the five acceptance criteria pass
outright, and the fifth ("other workflows' behaviour unchanged") was consciously relaxed by an
explicit human decision recorded in plan UPDATE 1 (six legacy workflow CLIs accepted broken until
AHQ-200/201). The Reviewer independently re-ran the fast safety nets today — `pnpm validate`
(typecheck + lint + format + 165/165 unit tests), the runner integration test (3/3), the build
determinism test (byte-identical trees), a dev-binary `list` run, and a direct-invocation
loud-failure probe — all green; the Claude-involving e2es (tarball install, cross-workspace math)
rest on the Implementer's recorded PASS results at both phase ends. The main open item is the
test-construction duplication refactor the human explicitly directed the Reviewer to perform.

## Checks Passed

| Area | Evidence | Result |
| --- | --- | --- |
| AC1: tarball from staged tree, single generated manifest, only intended files | `scripts/build-release.cjs` stages `release/` and generates its manifest from the root `package.json`; root manifest now has no `files` whitelist and no `publishConfig` bin/exports overrides; the tarball e2e asserts the generated manifest's fields, the absence of every retired mechanism, the leak-class boundary (top level exactly 7 entries, exactly 3 shipped plugins, only `run-workflow.cjs` under `scripts/`, no `node_modules`), and the no-nested-`package.json` walk. Implementer recorded PASS 3/3 at both phase ends. | Pass |
| AC2: explicit params flow whole chain, no env vars in new code, required with no defaults, AI relays verbatim | Mode literals baked into each wrapper (`bin/agentic-hq.cjs:38`, `bin/agentic-hq-prebuilt.cjs:30`); `DefaultAhqCommandLine` constructor fail-fasts on missing options; `BuildMode.fromValue()` is the single value-validation point; `ClaudeCommandBuilder.buildArgsList()` appends the two tokens verbatim; SKILL.md reads `$1`/`$2` and substitutes without interpretation; the runner validates and is the only code acting on `build-mode`. Reviewer probe: `pnpm exec tsx src/cli/main.ts list` fails loudly naming `--build-mode` (2026-08-10). | Pass |
| AC3: dev run auto-builds byte-identical JS; stale-dist risk and `pnpm build &&` prefix gone | Runner's `resolveExecutionRoot()` does a full clean build then executes from `release/`; the e2e npm script (`package.json:53`) has no build prefix and the test deletes `release/` first so green proves build-from-nothing; determinism test proves byte-identical trees (Reviewer re-ran: PASS). Implementer recorded the cross-workspace e2e PASS at both phase ends plus manual `agentic-hq math` runs (`Output number: 5`). | Pass |
| AC4 (dual-write half): legacy env-var readers keep working | Both wrappers still set `AGENTIC_HQ_WORKSPACE_ROOT`; `AhqWorkspaceImpl` is untouched (see `composition-root.ts:39-42` comment); Reviewer ran `node bin/agentic-hq.cjs list` (2026-08-10) — plugin discovery (a legacy env-var reader) works through the new chain. | Pass |
| AC5: safety nets re-pointed and green | Reviewer re-ran today: `pnpm validate` PASS (165/165 unit), runner integration 3/3, build determinism 1/1. Implementer recorded: tarball e2e PASS 3/3 at both phase ends, cross-workspace math e2e PASS at both phase ends, manual `agentic-hq math -- --input-number=11` → `Output number: 5` both times. | Pass |
| Test evidence | `pnpm validate`; `pnpm test:integration tests/integration/runner/run-workflow-validates-and-executes.integration.test.ts`; `pnpm test:integration:build-determinism`; `node bin/agentic-hq.cjs list`; `pnpm exec tsx src/cli/main.ts list` (expected loud failure) — all re-run by the Reviewer 2026-08-10, all behaving as specified. Claude-involving e2es not re-run (cost); relied on Implementer's recorded PASS results. | Pass |
| Regression coverage | Changed areas inspected: build pipeline (determinism test + tarball e2e's shape/leak/exec-bit assertions), param chain (unit tests for every new class, runner integration test, two live e2es), SKILL.md relay (proven live by both e2es), retired mechanisms (each has an explicit tarball-e2e absence assertion). Summary's file list cross-checked against `git log --name-status` — exact match, nothing under-reported. The one uncovered class — six broken legacy CLIs — is a deliberate accepted break, listed under Potential Fixes. | Good enough |

## Potential Fixes

| Area | Evidence | Result / Risk | Recommendation | Fix? |
| --- | --- | --- | --- | --- |
| Test-construction duplication refactor (RECOMMENDED — human-directed) | The 8-line `new DefaultClaudeCodeTool(new CompositionRoot(new DefaultAhqRuntimeParams(BuildMode.BUILD_FIRST, new DefaultAhqPackageRoot(process.cwd()))))` construction is duplicated verbatim in 4 test files (grep-verified): `real-claude-self-termination-skill.integration.test.ts:46`, `claude-executes-command-using-file-io.integration.test.ts:33`, `custom-commands-create-and-get-status-of-test-jira.integration.test.ts:41`, `cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts:105`. In-code REFACTOR note at `real-claude-self-termination-skill.integration.test.ts:45`. The human approved the implementation **subject to** this being recorded for the Reviewer to perform. | Worth doing — the human explicitly directed it at final approval; extract as a shared Type/Interface/Class (test object or prod+test). The unit test's mock-root construction and the legacy string-reversal fixture are excluded per the summary's note. | Do now | Yes |
| AC4 (unchanged-behaviour half) not met: six legacy workflow CLIs crash at tool construction | Plan UPDATE 1 (human chose "Proceed as planned", AskUserQuestion 2026-08-10); grep shows `new DefaultClaudeCodeTool()` (no args) in six workflow CLIs + the string-reversal e2e fixture; `pnpm test:e2e:agentic-hq-cli-string-reversal` recorded RED with the predicted TypeError; the failing e2e left in place, not weakened. | Fail — by explicit, recorded human decision | Do nothing — deferred to AHQ-200/201 by design; fixing now would re-litigate a decision the human already made. The red e2e stands as the honest marker. | |
| Highest-risk changed area: the AI relay hop (SKILL.md `$1`/`$2` + `claude-command-builder.ts:93` positional string) | The chain's only nondeterministic link: the AI must relay two whitespace-separated tokens verbatim; a mis-relay breaks every workflow run, and the relay cannot carry space-containing paths (limitation recorded in plan Risks — inherited, not new). Mitigated: proven live by the tarball e2e and cross-workspace e2e at both phase ends, and the runner/`DefaultAhqCommandLine` fail loudly on any malformed relay. | Medium, with reason: nondeterministic component, but loud failure modes and two live e2e proofs | Do nothing now — coverage is adequate; AHQ-201's universal funnel is the structural revisit. | |
| Stale wrapper header comment (RECOMMENDED) | `bin/agentic-hq-prebuilt.cjs:5-6` still says the shipped bin points here "via the pack-time publishConfig override in package.json" — a mechanism this very ticket retired (the generated release manifest now writes `bin` directly). Same tidy-up: the implementation summary's Docs bullet says "UPDATEs 1–3 recorded" though the plan holds four UPDATEs. | Worth doing, with reason: two-line doc fix; this repo explicitly bans stale build-stage commentary in shipped files, and this wrapper ships in the tarball | Do now | Yes |
| Unify runner/TS option parsing (NOT RECOMMENDED) | The `--build-mode=`/`--ahq-package-root=` prefix parsing exists twice: `scripts/run-workflow.cjs` (`parseCommandLine`) and `src/runtime-params/default-ahq-command-line.ts`. | Not worth it, with reason: the runner must stay a dependency-free plain-CJS script that runs before any build exists, so it cannot import the TS class; both sides are independently tested (runner integration 3/3, unit 165/165); coupling them would add real complexity to remove ~20 duplicated lines | Do nothing | |

## Selected Fixes Applied

The human selected both `(RECOMMENDED)` rows in chat ("pls do the recommended fixes", 2026-08-10)
and approved the fix plan via AskUserQuestion (shape: test-helper class; regression scope: fast
nets + one real-Claude test).

**Fix 1 — test-construction duplication refactor (human-directed):**

- `tests/helpers/repo-checkout-claude-code-tool.ts` — **added**: `RepoCheckoutClaudeCodeTool
  extends DefaultClaudeCodeTool`; its no-arg constructor bakes the wiring the four sites
  duplicated (`BuildMode.BUILD_FIRST` + `DefaultAhqPackageRoot(process.cwd())` via
  `DefaultAhqRuntimeParams`/`CompositionRoot`).
- The four duplication sites now construct `new RepoCheckoutClaudeCodeTool()` (imports trimmed to
  the one helper import):
  `tests/integration/claude-code-tool/real-claude-self-termination-skill.integration.test.ts`,
  `tests/integration/claude-code-tool/claude-executes-command-using-file-io.integration.test.ts`,
  `tests/integration/jira/custom-commands-create-and-get-status-of-test-jira.integration.test.ts`,
  `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts`.
- The in-code REFACTOR note at `real-claude-self-termination-skill.integration.test.ts:45` was
  removed as fulfilled (same precedent as the runner note in plan UPDATE 4). The unit test's
  mock-root construction and the legacy string-reversal e2e fixture were left untouched, per the
  implementation summary's scoping note.

**Fix 2 — stale shipped-wrapper comment + doc nit:**

- `bin/agentic-hq-prebuilt.cjs` header — now says the shipped `bin` is written directly into the
  generated release manifest by `scripts/build-release.cjs` (was: the retired pack-time
  `publishConfig` override).
- `docs/tickets/AHQ-197/workflow-files/03-implementation-summary.md` — Docs bullet corrected to
  "UPDATEs 1–4 recorded" (was "1–3"; the plan holds four UPDATEs).

**Regression guard results (the human-agreed scope):**

| Check | Result |
| --- | --- |
| `node --check` on both bin wrappers | OK |
| `pnpm validate` (typecheck + lint + format + unit) | PASS — 165/165 unit tests |
| Runner integration test | PASS 3/3 |
| Build determinism | PASS — byte-identical `release/` trees |
| `pnpm test:integration:real-claude-self-termination-skill` (real Claude, exercises the new helper) | PASS in 24s. Two earlier runs timed out at 120s; diagnosis: `command-input.json` was marshalled correctly but the Claude session hung (transient). Proof it was not the fix: the PRE-fix committed version of the test, run as a baseline minutes before the fixed version under identical conditions, behaved identically (both PASS ~24s). |
| Jira-creating tests and the two big e2es | Deliberately not re-run, per the human-approved scope: no executable production code changed (the wrapper change is comment-only, syntax-checked, and re-staged by the determinism runs). |

## Final Human Confirmation

The human's decision (chat, 2026-08-10): **"pls do the recommended fixes"** — selecting the two
`(RECOMMENDED)` Potential Fixes rows (duplication refactor + stale wrapper comment). The fix plan
details were then approved via AskUserQuestion: test-helper-class shape ("Test-helper class
(Recommended)") and fast-nets + one real-Claude test regression scope. The remaining rows were not
selected and stand as recorded (the accepted legacy break defers to AHQ-200/201; the relay-hop
risk and the runner/TS parsing duplication are "do nothing" by recommendation).

**Post-fix approval (second gate):** after the fixes were applied and the regression guard re-run,
the human explicitly approved the applied refactors in chat — **"refactors are approved"**
(2026-08-10).

## Customization Next Step

If this workflow was useful but too minimal, customize it for your own process. Recommended next step: run `agentic-hq create-workflow -- --using=add-feature` to make a copy and add your own stages, rules, and approval gates. To see a worked example of a very detailed personal workflow, inspect or try out `agentic-hq add-feature-detailed-example`.

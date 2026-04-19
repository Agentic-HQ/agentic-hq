# REFACTOR Analysis: AHQ-91 (e2e test)

**Jira**: [AHQ-91](https://agentic-hq.atlassian.net/browse/AHQ-91)
**Test Type**: e2e
**Phase**: REFACTOR (Analysis)
**Generated**: 2026-04-19

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

**Command**: `pnpm test:e2e:cross-workspace-list-workflows`
**Result**: PASSING (1 test / 1 test file, 2.94s)

> NOTE: Running all e2e tests was skipped to conserve Claude Code plan credits (the other 4 cross-workspace tests invoke Claude and take several minutes each). Please run `pnpm test:e2e` manually if you want a full-suite check.

---

## Refactoring Opportunities from Previous Phases

This table is the **single most important input** for this REFACTOR phase. The AI summary's "**IMPORTANT: Scope Handoff — What Belongs to the e2e REFACTOR Phase**" section explicitly lists the bulk of this phase's work. Each line item from that Scope Handoff is captured as its own row here so nothing gets lost.

| # | Source | Deferred or Observed? | Opportunity | AI Opinion | Recommendation |
|---|--------|-----------------------|-------------|------------|----------------|
| P.1 | ai-summary.md §Scope Handoff: "Delete interface files" | Deferred | Delete `src/interfaces/git-workspace.ts`, `src/interfaces/agentic-hq-installation.ts`, `src/interfaces/user-project-workspace.ts` | Must do — these interfaces are what the Jira is fundamentally about (ditching `GitWorkspace` + consolidating the other two into `Workspace`). They will have zero production callers after the consumer migration (P.5). | Tier 1 |
| P.2 | ai-summary.md §Scope Handoff: "Delete impl class files" | Deferred | Delete `src/workspace/default-git-workspace.ts`, `src/workspace/default-agentic-hq-installation.ts`, `src/workspace/default-user-project-workspace.ts`, `src/workspace/not-in-git-workspace-error.ts` | Must do — these are the impls of P.1 plus the error class that should no longer exist (the whole "must be in a git repo" rule is gone). | Tier 1 |
| P.3 | ai-summary.md §Scope Handoff: "Delete legacy test files" + "delete the now-empty `tests/unit/workspace/` directory" | Deferred | Delete `tests/unit/workspace/default-git-workspace.unit.test.ts`, `tests/unit/workspace/default-agentic-hq-installation.unit.test.ts`, `tests/unit/workspace/default-user-project-workspace.unit.test.ts`, then delete the now-empty `tests/unit/workspace/` directory | Must do — these tests target classes that will no longer exist. Leaving them breaks typecheck. | Tier 1 |
| P.4 | ai-summary.md §Scope Handoff: "Remove re-exports from `src/interfaces/index.ts`" | Deferred | Remove the three lines re-exporting `AgenticHqInstallation`, `UserProjectWorkspace`, `GitWorkspace` from `src/interfaces/index.ts:21-23` | Must do — those re-exports point at deleted files. Leaving them breaks typecheck. | Tier 1 |
| P.5 | ai-summary.md §Scope Handoff: "Migrate consumers" | Deferred | Migrate 5 consumer production files to depend on the expanded `Workspace` interface (with `AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl` as concrete classes) instead of the legacy types. Files: `src/kernel/composition-root.ts` (drop `getGitWorkspace()`/`getAgenticHqInstallation()`/`getUserProjectWorkspace()`, inject `AhqWorkspaceImpl` + `CurrentUserWorkspaceImpl` directly both typed as `Workspace`), `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` (swap `getConfigDir()` → `getDotAgenticHqDir()`), `src/tools/marshalled-io-tools/marshalled-cli-tool.ts` (typed as `Workspace`), `src/io/marshalling/json-file-io-marshaller-session-factory.ts` (`workspace.getTempDir()` unchanged), `src/workflow/claude/claude-workflow-command-builder.ts` (`workspace.getRoot()` unchanged) | Must do — this is the heart of the refactor. Without this, the Workspace methods added in the unit cycle are dead API. Each consumer swap is mechanical (same method names in most cases) except for `ClaudeCommandBuilder`, which also needs the dedup swap documented in P.7 below. | Tier 1 (mechanical swaps) + Tier 2 (P.7 dedup) |
| P.6 | ai-summary.md §Scope Handoff: "Update consumer tests" | Deferred | Update the consumer unit tests that currently construct legacy types directly: `tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts`, `tests/unit/claude-code-tool/claude-code-tool-with-injected-io-marshaller.unit.test.ts`, `tests/unit/claude-code-tool/claude-code-tool-with-injected-config.unit.test.ts`, `tests/unit/tools/claude-code/claude-command-builder.unit.test.ts`, `tests/unit/io/marshalling/json-file-io-marshaller-session.unit.test.ts`, `tests/unit/tools/marshalled-cli-tool.unit.test.ts`, `tests/unit/workflow/claude/claude-workflow-command-builder.unit.test.ts` | Must do (those that are actually affected) — grep will determine which of these files construct legacy types directly vs just reference them in an unrelated way. The AI summary lists three confirmed; the other four are "if affected, fix" candidates the REFACTOR executor will sweep. | Tier 1 |
| P.7 | ai-summary.md §Research Findings, Risk 3: "There's a special case in `CurrentUserWorkspaceImpl` where if cwd equals AHQ root, it skips listing (to avoid duplicates). In the Workflow command paths (e.g. `getPluginDirFlags()`) there's equivalent dedup by string comparison. Post-refactor we need the same dedup to exist in one place." | Deferred | Replace the string-equality dedup in `ClaudeCommandBuilder.getPluginDirFlags()` (`src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts:112` — `if (userPluginsDir !== ahqPluginsDir)`) with `!currentUserWorkspace.isAhqWorkspace()`. This is the production use case that `isAhqWorkspace()` (the unit phase's NOT-YET-WIRED method) was built for. | Recommend. This is the main payoff of having `isAhqWorkspace()` on the interface. Keeping the bare-string comparison after the refactor would leave the unit work half-wired and perpetuate the duplication risk #3 flags. However, classifying as Tier 2 because it's a semantically-different dedup (before: "same absolute path"; after: "cwd is the env-var root") — human should confirm the swap is the intended behaviour change. | Tier 2 (human approval) |
| P.8 | ai-summary.md Q6 Human Response: "Both is fine - with a note to consider REFACTOR later in case we can eliminate duplication easily" | Deferred | `AhqWorkspaceImpl.getTempDir()` and `CurrentUserWorkspaceImpl.getTempDir()` return identical strings when cwd equals the AHQ root. The human explicitly asked this be captured as a "later REFACTOR" note. | The human already said "do both impls, note for later" — which means intentionally **not** doing this now. Keeping the duplication is the agreed minimum-implementation decision. Re-flagging now would just waste a cycle. | Skip (already decided not to do; capture in REFACTOR notes so it doesn't get forgotten) |
| P.9 | ai-summary.md §Acceptance Criteria: "Git-based test setup for workspace-root detection is fully removed from tests" | Observed | The 5 e2e test files still have TSDoc header comments like `* 3. Setup: Run git init in the temp workspace` on lines 7–11 of each file. The RED-phase `execSync('git init', ...)` line was removed, but the docstring that describes it wasn't. The RED plan flagged this as a refactor candidate. | Recommend. Trivially cheap (5 one-line TSDoc edits), literally misleading documentation if left in (says the test does `git init` when it doesn't), and the AC literally says "fully removed". Should also remove from `string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts:11` (slightly different wording). | Tier 1 |
| P.10 | composition-root.ts:31-39 + GREEN summary §"Comment in the shim points forward at REFACTOR": "makes the half-migrated state explicit so the REFACTOR agent knows to delete the whole `getGitWorkspace()` method" | Observed | Delete the `private getGitWorkspace()` method entirely (the GREEN shim) along with the `import type { GitWorkspace }` at `composition-root.ts:16`. This is a subset of P.5 but it's listed separately because the GREEN summary specifically calls it out. | Must do — the shim is dead weight once `getAgenticHqInstallation()` and `getUserProjectWorkspace()` also go (P.5). It can't be deleted in isolation (`getAgenticHqInstallation()` + `getUserProjectWorkspace()` both call it); it gets deleted as part of the P.5 migration. Rolled into P.5. | Merged into P.5 |
| P.11 | `src/interfaces/git-workspace.ts:2,10`, `default-git-workspace.ts:3,22`, `default-agentic-hq-installation.ts:15`, `default-user-project-workspace.ts:16`, `not-in-git-workspace-error.ts:3,10`, `agentic-hq-installation.ts:9` | Observed | Inline `// Refactor:` / `//REFACTOR` comments inside the legacy files pointing at this very Jira. They become moot when the files are deleted in P.1/P.2. | Skip — automatic consequence of deleting the files. No action needed on the comments themselves. | Skip (absorbed by P.1/P.2) |
| P.12 | composition-root.ts top-of-file comment (lines 2-12): "SRP Does: Provide factory methods (get*) that instantiate and wire the default concrete classes behind each interface." | Observed | The SRP header of `CompositionRoot` doesn't need changes — it already describes "wire default concrete classes". But after P.5, the sentence "Callers get fully-wired components without knowing which classes are involved" still holds; just the underlying list of classes has shrunk. | No action — the header is still accurate post-refactor. | Skip |
| P.13 | ahq-workspace-impl.ts:6 + workspace-impl.ts:11 | Observed | Both files now declare `AGENTIC_HQ_WORKSPACE_ROOT_ENV_VAR = 'AGENTIC_HQ_WORKSPACE_ROOT'` independently (ahq-workspace-impl exports it, workspace-impl keeps it local). The unit REFACTOR table (04b) explicitly agreed to this duplication as the "EXECUTE (modified)" version of 2.1. | This was an explicit human decision in the unit REFACTOR ("ahq-workspace-impl.ts left untouched"). Re-opening it at e2e REFACTOR without new information would second-guess a decision that was made deliberately. | Skip (already decided in unit REFACTOR) |
| P.14 | claude-command-builder.ts:97-105 inline REFACTOR comment | Observed | Long block comment inside `ClaudeCommandBuilder.getPluginDirFlags()` musing about whether to simplify the 2-workspace plugin-dir scan in future. Not scoped to AHQ-91 — the comment itself says "leave for now". | Skip — explicitly out of scope per the comment's own text ("leave for now"). Not this Jira's work. | Skip |
| P.15 | ai-summary.md §Acceptance Criteria: "`pnpm test` (all unit tests) — green" + "`pnpm test:e2e` (all e2e tests…) — green" + "`pnpm typecheck` — zero errors" + "`pnpm lint:check` / `pnpm format:check` — green" | Deferred | After every deletion / migration step in the REFACTOR executor, re-run the full test gate. The Scope Handoff says: "If anything breaks, the migration is incomplete. Fix before marking REFACTOR done." | Not a refactor per se — it's the validation gate that binds 04b. Mentioned here for completeness so the 04b executor doesn't skip it. | Not a refactor (gate) |

> **Note to human**: The AI's recommendations are opinions. If you disagree with a "Skip", add it to the Human-Identified Refactors section below.

---

## Magic Constants Audit

Only **one production code file** was modified during the e2e GREEN phase: `src/kernel/composition-root.ts`. The shim added was `{ getRoot: () => process.cwd() }` — zero literal values.

The 5 e2e test files had lines **deleted** in RED; no new code was added there.

| File | Line | Magic Value | Status | Constant Name |
|------|------|-------------|--------|---------------|
| `src/kernel/composition-root.ts` | 38 | `{ getRoot: () => process.cwd() }` | No magic values — shim object literal, no strings/numbers | — |

> All code added in the e2e phase (production + test) uses zero magic values. No MAGIC entries to feed into Tier 1.

**Separately** — the legacy files about to be deleted (`default-git-workspace.ts`, `default-agentic-hq-installation.ts`, `default-user-project-workspace.ts`) still contain magic strings (`'.agentic-hq'`, `'temp'`, `'git rev-parse --show-toplevel'`). Auditing them is **moot** — P.1/P.2/P.3 delete the files outright.

---

## Audit To Confirm Methods Used In Production Code (Not Just Tests)

Auditing every method on every interface/class created or modified in this Jira.

The unit-phase 04a already did this audit for the NEW `Workspace` methods and flagged them as **NOT-YET-WIRED** because the wiring belongs to **this** e2e REFACTOR phase. The audit is re-done here with the current (post-GREEN, pre-REFACTOR) view, so we can verify that the REFACTOR (04b) execution actually does the wiring.

**Legend**:
- **✓** = used as intended (interface methods: called through the interface from outside the implementing class; class-only methods: any production caller exists)
- **NOT USED THROUGH INTERFACE ⚠️** = interface method only called by `this.method()` from inside the implementing class (plus possibly tests) — should be made private + removed from the interface
- **TEST-ONLY ⚠️** = zero production callers (not even self-calls); only tests reference it — should be deleted
- **NOT-YET-WIRED** = subsystem entry point, deliberately not yet wired into the CLI (will be wired later) — keep

| Interface / Class | Method | Status | Evidence |
|---|---|---|---|
| `Workspace` | `getWorkflowListingString()` | ✓ | Called through `Workspace` interface by `WorkflowSearchResultsImpl.getWorkflowsListingString()` at `workflow-search-results-impl.ts:36-37` |
| `Workspace` | `registerWorkflowsWith()` | ✓ | Called through `Workspace` interface by `WorkflowSearchResultsImpl.registerWorkflowsWith()` at `workflow-search-results-impl.ts:42-43` |
| `Workspace` | `getRoot()` | NOT-YET-WIRED | Will replace the existing `userWorkspace.getRoot()` calls in `marshalled-cli-tool.ts:46`, `claude-workflow-command-builder.ts:36`, `claude-command-builder.ts:108` (part of P.5 consumer migration). Currently called only by `CurrentUserWorkspaceImpl.getRoot()` internally (line 44). |
| `Workspace` | `getTempDir()` | NOT-YET-WIRED | Will replace the existing `workspace.getTempDir()` call in `json-file-io-marshaller-session-factory.ts:21` (P.5 migration). Currently no external callers. |
| `Workspace` | `getDotAgenticHqDir()` | NOT-YET-WIRED | Will replace the existing `agenticHqInstallation.getConfigDir()` calls in `claude-command-builder.ts:93,107` (P.5 migration — Q3's agreed rename `getConfigDir` → `getDotAgenticHqDir`). Currently no external callers. |
| `Workspace` | `isAhqWorkspace()` | NOT-YET-WIRED (plus one internal self-call) | Will replace the string-comparison dedup at `claude-command-builder.ts:112` (`if (userPluginsDir !== ahqPluginsDir)`) — see P.7. Currently has one external-style call inside `CurrentUserWorkspaceImpl.getWorkflowListingString():28` and `.registerWorkflowsWith():36`, both of which are `this.isAhqWorkspace()` self-calls. Post-refactor will also be called externally from `ClaudeCommandBuilder.getPluginDirFlags()`. |
| `AhqWorkspaceImpl` | all 6 `Workspace` methods | ✓ (via Workspace interface) | Currently instantiated by `WorkflowSearchResultsImpl` only; post-P.5 will also be instantiated by `CompositionRoot`. All method calls go through the `Workspace` interface. |
| `CurrentUserWorkspaceImpl` | all 6 `Workspace` methods | ✓ (via Workspace interface) | Same as above. |

**Flagged methods**:
- None flagged for deletion / privatisation — all four NOT-YET-WIRED methods have documented production call sites that the **consumer migration in P.5/P.7 (this REFACTOR phase)** will activate. If P.5/P.7 are not executed, the methods remain NOT-YET-WIRED and the refactor is incomplete.

> **No new flagged-methods refactors are added from this audit.** The audit confirms that the P.5 migration is both necessary AND sufficient to bring the four NEW methods into production use.

---

## Tier 1: Auto-Approved Refactors

These will be executed automatically (low risk, high value):

| # | Type | Description | File(s) & Line Num |
|---|------|-------------|---------------------|
| 1.1 | Delete dead files | Delete 3 legacy interface files (P.1) | `src/interfaces/git-workspace.ts`, `src/interfaces/agentic-hq-installation.ts`, `src/interfaces/user-project-workspace.ts` |
| 1.2 | Delete dead files | Delete 4 legacy impl/error class files (P.2) | `src/workspace/default-git-workspace.ts`, `src/workspace/default-agentic-hq-installation.ts`, `src/workspace/default-user-project-workspace.ts`, `src/workspace/not-in-git-workspace-error.ts` |
| 1.3 | Delete dead tests | Delete 3 legacy test files (P.3), then delete the now-empty `tests/unit/workspace/` directory | `tests/unit/workspace/default-git-workspace.unit.test.ts`, `tests/unit/workspace/default-agentic-hq-installation.unit.test.ts`, `tests/unit/workspace/default-user-project-workspace.unit.test.ts`, `tests/unit/workspace/` (rmdir after deletes) |
| 1.4 | Remove dead re-exports | Remove the three `export type` re-export lines for the deleted legacy interfaces (P.4) | `src/interfaces/index.ts` Line: `21-23` |
| 1.5 | Migrate consumer | Migrate `CompositionRoot`: drop `getGitWorkspace()` / `getAgenticHqInstallation()` / `getUserProjectWorkspace()`; inject fresh `AhqWorkspaceImpl` and `CurrentUserWorkspaceImpl` (both typed as `Workspace`) directly into the tool/session/builder wiring. Also drops the legacy type imports at lines 14, 16, 19 and the DefaultAgenticHqInstallation + DefaultUserProjectWorkspace imports at lines 26-27. Subsumes the GREEN shim deletion (P.10). (P.5) | `src/kernel/composition-root.ts` Line: `14-27, 31-73` (most of file) |
| 1.6 | Migrate consumer | Migrate `ClaudeCommandBuilder`: constructor takes an AHQ `Workspace` + a user `Workspace` instead of `AgenticHqInstallation` + `UserProjectWorkspace`. Swap `agenticHqInstallation.getConfigDir()` → `ahqWorkspace.getDotAgenticHqDir()` at lines 93 and 107. (P.5 — excluding the dedup which is P.7/Tier 2.) | `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` Line: `18, 21, 51-67, 93, 107` |
| 1.7 | Migrate consumer | Migrate `MarshalledCLITool`: field type `UserProjectWorkspace` → `Workspace`. `workspace.getRoot()` call at line 46 is unchanged (method still exists on new type). (P.5) | `src/tools/marshalled-io-tools/marshalled-cli-tool.ts` Line: `19, 26` |
| 1.8 | Migrate consumer | Migrate `JsonFileIOMarshallerSessionFactory`: constructor parameter type `UserProjectWorkspace` → `Workspace`. `workspace.getTempDir()` call at line 21 is unchanged. (P.5) | `src/io/marshalling/json-file-io-marshaller-session-factory.ts` Line: `13, 20-22` |
| 1.9 | Migrate consumer | Migrate `ClaudeWorkflowCommandBuilder`: field type `UserProjectWorkspace` → `Workspace`. `workspace.getRoot()` call at line 36 is unchanged. (P.5) | `src/workflow/claude/claude-workflow-command-builder.ts` Line: `16, 27, 36` |
| 1.10 | Update consumer tests | For each of the 7 consumer unit test files listed in P.6, swap legacy-type construction to the new types. Tests that only touch `MarshalledCLITool`/`ClaudeCommandBuilder`/etc. without constructing the legacy classes directly need no change — grep will decide. The executor runs `pnpm test` after each file to catch regressions. (P.6) | `tests/unit/claude-code-tool/{claude-code-tool-with-injected-config,claude-code-tool-with-injected-io-marshaller,fake-claude-executes-command-using-file-io}.unit.test.ts`, plus (if affected) `tests/unit/tools/claude-code/claude-command-builder.unit.test.ts`, `tests/unit/io/marshalling/json-file-io-marshaller-session.unit.test.ts`, `tests/unit/tools/marshalled-cli-tool.unit.test.ts`, `tests/unit/workflow/claude/claude-workflow-command-builder.unit.test.ts` |
| 1.11 | Docs cleanup | Remove the `* 3. Setup: Run git init in the temp workspace` / `* 3. git init in the temp workspace` TSDoc lines from the 5 cross-workspace e2e test files. Pure documentation delete; production behaviour unchanged. (P.9) | `tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts:9`, `cross-workspace-string-reversal.e2e.test.ts:7`, `cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts:8`, `cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts:7`, `string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts:11` |

---

## Tier 2: AI-Identified Potential Refactors

Include ALL potential structural refactors here - both ones you recommend AND ones you're unsure about or even think shouldn't be done. The human decides; your job is to surface them all with honest opinions.

### Refactor 2.1: Replace string-equality dedup in `ClaudeCommandBuilder.getPluginDirFlags()` with `currentUserWorkspace.isAhqWorkspace()`

**Type**: Replace duplicated logic with new interface method (wire up a NOT-YET-WIRED interface method).
**Description**: In `claude-command-builder.ts:112`, change `if (userPluginsDir !== ahqPluginsDir)` (which dedups two `.agentic-hq/plugins` paths by string comparison) to `if (!this.currentUserWorkspace.isAhqWorkspace())` using the new `Workspace.isAhqWorkspace()` method. This is the principal payoff of adding `isAhqWorkspace()` to the interface during the unit cycle — it consolidates the cwd-equals-AHQ-root check into one place (`WorkspaceImpl.isAhqWorkspace`) instead of two (string-compare-derived-paths here + env-var-compare-cwd there).
**AI Recommendation**: RECOMMEND. Directly fulfils the ai-summary's stated goal ("Post-refactor we need the same dedup to exist in one place"). Without this, `isAhqWorkspace()` is genuinely NOT-WIRED and the Jira's AC "All consumers migrated" is only partially met. The behavioural equivalence is strong (both mechanisms fire iff the user's cwd is the AHQ root), but technically the new check is semantically tighter ("cwd IS the env var" vs "derived path strings happen to match") — hence flagging for human confirmation.
**Risk**: Medium-low. Behavioural difference exists at the edges: if `process.env.AGENTIC_HQ_WORKSPACE_ROOT` is trailing-slashed but `process.cwd()` isn't (or vice versa), the old string-compare would see equal computed paths `{both}/.agentic-hq/plugins` but `isAhqWorkspace()` would return `false` (per Q5, no normalisation). Realistically never happens in the CLI path since `bin/agentic-hq.cjs` sets the env var to an absolute `path.join(__dirname, '..')`, which doesn't have a trailing slash. Test coverage on the 5 e2e tests validates the happy path.
**Files affected**: `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts`

**Your Decision**:
- [x] **APPROVE** - Yes, do this refactor
- [ ] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.2: Unify the two `getTempDir()` implementations behind a shared helper (NOT RECOMMENDED)

**Type**: Eliminate cross-class duplication.
**Description**: `AhqWorkspaceImpl.getTempDir()` (line 43) and `CurrentUserWorkspaceImpl.getTempDir()` (line 49) both return `{root}/.agentic-hq/temp`, differing only in what `getRoot()` returns. Both delegate to `WorkspaceImpl.getTempDir()` via `createDelegate()` — so the *impl* is already shared. The "duplication" is just that both outer impls have a pass-through method declaration. Q6 flagged this as a potential REFACTOR candidate "if we can eliminate duplication easily".
**AI Recommendation**: NOT RECOMMENDED. The human explicitly said in Q6: "Both is fine - with a note to consider REFACTOR later in case we can eliminate duplication easily." The duplication is just interface plumbing (pass-through delegates) — eliminating it would require either (a) adding a shared abstract base class, which violates "class/interface pair per concept" design requirement, or (b) making `Workspace` methods default to the delegate, which is not how TypeScript interfaces work. So the "easy" elimination doesn't exist; attempting it requires structural gymnastics. Keeping it as-is matches the human's explicit instruction.
**Risk**: Complicating `Workspace` inheritance hierarchy for near-zero value. Violates "Has It Earned It?" (the pattern isn't painful today).
**Files affected**: `src/workflow-discovery/workspace/ahq-workspace-impl.ts`, `src/workflow-discovery/workspace/current-user-workspace-impl.ts`

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.3: Rename `userWorkspace` variables to `currentUserWorkspace` (AI-proposed consistency cleanup)

**Type**: Variable renaming for consistency.
**Description**: After P.5, the `userWorkspace: UserProjectWorkspace` field in `ClaudeCommandBuilder`, `MarshalledCLITool`, `ClaudeWorkflowCommandBuilder`, and `CompositionRoot` becomes `workspace: Workspace` or similar. The concrete class we're injecting is `CurrentUserWorkspaceImpl` — the codebase's canonical name for "where the user is now". Renaming the parameter / field from `userWorkspace` → `currentUserWorkspace` makes the naming match the concept.
**AI Recommendation**: UNSURE. On the plus side, "currentUserWorkspace" matches the class name and the ai-summary's preferred wording. On the minus side, it's a 4-file rename that touches 20+ spots, mostly just for naming aesthetics. The parameter's type is `Workspace` (abstract), so the caller can't assume it's the "current user" workspace anyway — `AhqWorkspaceImpl` also satisfies `Workspace`. Arguably the most accurate name is just `workspace` (since the type now enforces no more). Could also be deferred to a later "naming polish" pass.
**Risk**: Low (mechanical rename), but low-value and expands the REFACTOR diff size. Could hide the real P.5 migration in review noise.
**Files affected**: `src/kernel/composition-root.ts`, `src/tools/marshalled-io-tools/marshalled-cli-tool.ts`, `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts`, `src/workflow/claude/claude-workflow-command-builder.ts` (plus any tests).

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

### Refactor 2.4: Extract the `WorkflowSearchResultsImpl` constructor wiring into a `CompositionRoot` factory method (NOT RECOMMENDED)

**Type**: Move direct instantiation into the composition root.
**Description**: `WorkflowSearchResultsImpl`'s constructor (line 30-33) directly news up `AhqWorkspaceImpl` and `CurrentUserWorkspaceImpl`. After P.5, `CompositionRoot` also news up both — twice. The fully "correct" composition-root pattern would have `WorkflowSearchResultsImpl` accept both as constructor parameters and have `CompositionRoot.getWorkflowSearchResults()` wire them.
**AI Recommendation**: NOT RECOMMENDED. Classic gold-plating — the class is already small, each instance is cheap, and the "duplication" is across two levels of the composition tree (kernel vs workflow-listing subsystem). Trying to merge them would mean cross-subsystem coupling (the `WorkflowSearchResultsImpl` in `src/workflow-discovery/` suddenly imports from `src/kernel/`). The current setup is a deliberate subsystem boundary.
**Risk**: Introduces unwanted kernel↔workflow-discovery coupling.
**Files affected**: `src/workflow-discovery/workflow-listing/workflow-search-results-impl.ts`, `src/kernel/composition-root.ts`.

**Your Decision**:
- [ ] **APPROVE** - Yes, do this refactor
- [x] **REJECT** - No, skip this
- [ ] **DISCUSS** - I want to discuss this with the AI before deciding

**Comments** (optional): _______________

---

## Tier 2: Human-Identified Potential Refactors

**This section is for the human reviewer.** Add any refactors the AI missed, or write "None". Everything added here will be discussed with the AI before a decision is made.

> **MANDATORY**: You MUST either add refactors here OR write "None" before the execute phase can proceed.

### Refactor H.1: Rename `ClaudeCommandBuilder.getPluginDirFlags()` → `getClaudeCliPluginDirArgs()`

**Type**: Method rename for clarity.
**Description**: "Flag" is CLI jargon that's unclear to a reader who isn't already familiar with shell conventions. The method returns a list of `--plugin-dir=…` strings that get spliced into the Claude CLI command line — `getClaudeCliPluginDirArgs()` makes this explicit (Claude CLI, plugin dir, args).
**Scope**: Rename the private method and its one call site (`buildArgsList()` at line 78 within the same file). Private method — no external callers to update.
**Files affected**: `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts`

---

## Project Design Requirements Compliance Audit

**Design Requirements File**: `/Users/stevepersonal/dev/agentic-hq/agentic-hq/docs/dev/project-design-requirements.md`

The audit below assumes the **post-REFACTOR state** (i.e. assumes P.1–P.7 are executed). Where a requirement is MET only contingent on those refactors running, that is made explicit.

| # | Requirement | Evidence (files, classes, patterns) | Status | Refactoring Proposal (if needed) |
|---|-------------|-------------------------------------|--------|----------------------------------|
| DR.1 | Class/interface pair per concept — every concept in the spec gets an `X` interface and `XImpl` class | Pre-REFACTOR: legacy `GitWorkspace`/`DefaultGitWorkspace`, `AgenticHqInstallation`/`DefaultAgenticHqInstallation`, `UserProjectWorkspace`/`DefaultUserProjectWorkspace` each have their pair — but they represent **two** concepts split across **three** interface pairs. Post-REFACTOR: two concepts ("the AHQ workspace", "the current user's workspace") map to one `Workspace` interface with two impl classes (`AhqWorkspaceImpl`, `CurrentUserWorkspaceImpl`). Cleaner mapping. | MET (post-REFACTOR — contingent on P.1–P.5) | — (covered by P.1–P.5 in Tier 1) |
| DR.2 | Default naming convention (`DefaultFoo` implementing `Foo`) | Unit phase deliberately used the `XImpl` suffix (e.g. `AhqWorkspaceImpl`) instead of `DefaultX`. This matches the existing workflow-discovery subsystem naming (`WorkspaceImpl`, `PluginImpl`, `WorkflowSearchResultsImpl`), which is the target naming for AHQ-91's consolidation. The design doc §Concept Table uses both styles in its example (`AhqWorkspaceImpl`, `PluginImpl`, `WorkflowSearchResultsImpl`) so both are acceptable. | MET | — |
| DR.3 | Tell, don't ask — push work into objects | Pre-REFACTOR: `ClaudeCommandBuilder.getPluginDirFlags()` asks `getConfigDir()` and does string math on the result. Post-REFACTOR: still asks the workspace for paths to walk — this is acceptable because walking a filesystem isn't something a workspace *does*, it's what the builder does. The `isAhqWorkspace()` swap in P.7 is a direct "tell don't ask" improvement — instead of the builder asking for two paths and comparing them itself, it asks the workspace "are you the AHQ workspace?" | MET (contingent on P.7) | Ensure P.7 is approved & executed (already in Tier 2 as 2.1). |
| DR.4 | Switchable concrete classes (classwitch pattern) — could a third party easily replace any concrete class? | Post-REFACTOR: `CompositionRoot` has zero `Default*` references for workspace concerns; any third party can supply their own `Workspace` impl by editing the root. The new impls (`AhqWorkspaceImpl`, `CurrentUserWorkspaceImpl`, `WorkspaceImpl`) all conform cleanly to a narrow interface. | MET (post-REFACTOR) | — |
| DR.5 | Minimal state — avoid fields used to cache intermediate state | `AhqWorkspaceImpl` and `CurrentUserWorkspaceImpl` carry no fields. They compute everything fresh per call. `WorkspaceImpl` stores only `displayName` and `rootDir` (both genuinely intrinsic to identity, not cached computation). Contrast with the legacy `DefaultAgenticHqInstallation`/`DefaultUserProjectWorkspace` which cached `root` in a frozen field — about to be deleted. | MET | — |
| DR.6 | No "er" suffix classes | No new `Parser` / `Detector` / `Discoverer` etc. All new classes are entity-named (`AhqWorkspaceImpl`, `CurrentUserWorkspaceImpl`). | MET | — |
| DR.7 | Directory structure by entity | All new workspace code lives in `src/workflow-discovery/workspace/` — organised by entity. Post-REFACTOR, `src/workspace/` (the old home of `DefaultGitWorkspace` et al.) is gone entirely. | MET (post-REFACTOR) | — |
| DR.8 | Balance caveat — not fractured to the extreme | The `Workspace` interface has 6 methods serving two concrete concepts. Not fractured — the class count is proportional to the conceptual count. | MET | — |
| DR.9 | Collection names: plural not List | Not directly relevant to this Jira (no collections being named or renamed). | NOT APPLICABLE | — |
| DR.10 | One test file per class | `tests/unit/workflow-discovery/workspace/` has one test file per new class (`workspace-impl`, `ahq-workspace-impl`, `current-user-workspace-impl`). Post-REFACTOR, the legacy three-test-file structure in `tests/unit/workspace/` is deleted (P.3), so this stays clean. | MET (post-REFACTOR) | — |
| DR.11 | Class/interface header doc (SRP comment) | `WorkspaceImpl`, `AhqWorkspaceImpl`, `CurrentUserWorkspaceImpl`, `Workspace` all have the standard `SRP Does / SRP Knows About / SRP Knows Nothing About` header comment. | MET | — |
| DR.12 | Concept Table / Data Dictionary / ELD | These are planning-phase artifacts. The unit-phase plan contains them (per the human's confirmation in the unit REFACTOR). The e2e planning-phase docs are scoped to deletions and didn't re-produce them, which is consistent with "already produced in unit phase". | MET (produced in unit phase; re-use for e2e is appropriate) | — |

**Summary**: 11 of 12 applicable requirements **MET** (9 outright, 2 MET post-REFACTOR contingent on P.1–P.5 + P.7 executing), 1 NOT APPLICABLE (DR.9). **Zero NOT MET or PARTIALLY MET** items — but four of the "MET" statuses are contingent on the Tier 1 / Tier 2 refactors above actually running. If the human rejects Tier 1 items or Refactor 2.1 (P.7), the affected requirements slip to PARTIALLY MET.

> **Note to human**: No *new* refactors are surfaced by the compliance audit — every design-requirement gap is already captured by the Tier 1 / Tier 2 proposals above (P.1–P.7 + Refactor 2.1). The audit's purpose is to document traceability from requirements to refactoring actions.

---

## Summary

| Category | Count |
|----------|-------|
| Tier 1 (Auto-approved) | 11 |
| Tier 2 AI-Identified (Pending review) | 4 |
| Design Requirements Audit (items needing action) | 0 new items (all already in Tier 1 / Tier 2) |
| **Total identified by AI** | 15 |

Note: The Tier 1 count looks high, but most of those items (1.1–1.10) are the **mandatory Scope-Handoff work** for this REFACTOR phase — they're not discretionary. Only 1.11 (TSDoc cleanup) is a discretionary-but-recommended item. The Tier 2 list contains the genuinely opt-in decisions.

---

## Agreed Refactors Discussion Notes

### Refactor H.1: Rename `ClaudeCommandBuilder.getPluginDirFlags()` → `getClaudeCliPluginDirArgs()`
**Decision**: EXECUTE
**Summary**: Human flagged that "flag" is opaque CLI jargon and proposed the explicit name `getClaudeCliPluginDirArgs()`. AI agreed — "Claude CLI plugin-dir args" reads clearly without CLI background: "Claude CLI" scopes it to the `claude` executable, "plugin-dir" says what kind of args, "args" is the plain-English term. Scope is trivially small (private method + its one internal call site in `buildArgsList()`; no external callers). Zero behavioural risk.

---

## Agreed Refactors Summary Table

> For detail on any discussed item, see the corresponding subsection in "Agreed Refactors Discussion Notes" above.

| # | Source | Description | Decision | Notes |
|---|--------|-------------|----------|-------|
| 1.1 | AI (Tier 1) | Delete 3 legacy interface files (`git-workspace.ts`, `agentic-hq-installation.ts`, `user-project-workspace.ts` under `src/interfaces/`) | EXECUTE | Auto-approved |
| 1.2 | AI (Tier 1) | Delete 4 legacy impl/error files (`default-git-workspace.ts`, `default-agentic-hq-installation.ts`, `default-user-project-workspace.ts`, `not-in-git-workspace-error.ts` under `src/workspace/`) | EXECUTE | Auto-approved |
| 1.3 | AI (Tier 1) | Delete 3 legacy test files under `tests/unit/workspace/`, then rmdir the now-empty directory | EXECUTE | Auto-approved |
| 1.4 | AI (Tier 1) | Remove 3 re-export lines for deleted legacy interfaces from `src/interfaces/index.ts` | EXECUTE | Auto-approved |
| 1.5 | AI (Tier 1) | Migrate `CompositionRoot`: drop `getGitWorkspace()` / `getAgenticHqInstallation()` / `getUserProjectWorkspace()`; inject `AhqWorkspaceImpl` + `CurrentUserWorkspaceImpl` (typed as `Workspace`) directly. Subsumes GREEN shim deletion. | EXECUTE | Auto-approved |
| 1.6 | AI (Tier 1) | Migrate `ClaudeCommandBuilder`: constructor takes AHQ `Workspace` + user `Workspace` instead of legacy types. Swap `agenticHqInstallation.getConfigDir()` → `ahqWorkspace.getDotAgenticHqDir()`. | EXECUTE | Auto-approved |
| 1.7 | AI (Tier 1) | Migrate `MarshalledCLITool`: field type `UserProjectWorkspace` → `Workspace` | EXECUTE | Auto-approved |
| 1.8 | AI (Tier 1) | Migrate `JsonFileIOMarshallerSessionFactory`: parameter type `UserProjectWorkspace` → `Workspace` | EXECUTE | Auto-approved |
| 1.9 | AI (Tier 1) | Migrate `ClaudeWorkflowCommandBuilder`: field type `UserProjectWorkspace` → `Workspace` | EXECUTE | Auto-approved |
| 1.10 | AI (Tier 1) | Update consumer unit test files that construct legacy types directly — sweep 7 candidate files, fix the ones actually affected | EXECUTE | Auto-approved |
| 1.11 | AI (Tier 1) | Remove `* 3. Setup: Run git init in the temp workspace` / `* 3. git init in the temp workspace` TSDoc lines from the 5 cross-workspace e2e test files | EXECUTE | Auto-approved |
| 2.1 | AI (Tier 2) | Replace `if (userPluginsDir !== ahqPluginsDir)` in `ClaudeCommandBuilder.getPluginDirFlags()` with `if (!this.currentUserWorkspace.isAhqWorkspace())` | EXECUTE | Approved by human |
| 2.2 | AI (Tier 2) | Unify `getTempDir()` impls behind a shared helper | SKIP | Rejected by human |
| 2.3 | AI (Tier 2) | Rename `userWorkspace` → `currentUserWorkspace` across 4 files | SKIP | Rejected by human |
| 2.4 | AI (Tier 2) | Move `WorkflowSearchResultsImpl` wiring into `CompositionRoot` factory | SKIP | Rejected by human |
| H.1 | Human | Rename `ClaudeCommandBuilder.getPluginDirFlags()` → `getClaudeCliPluginDirArgs()` (plus its internal call site) | EXECUTE | Discussed — see notes above |

---

## Next Steps

1. Review the "Previous Phases" table - if you disagree with any "Skip", add it to Human-Identified Potential Refactors
2. Mark each AI-Identified Tier 2 refactor as APPROVE / REJECT / DISCUSS
3. Fill in "Human-Identified Potential Refactors" with your own refactors, or write "None"
4. Tell the AI you've completed your review
5. The AI will discuss: any items you marked DISCUSS + all human-identified items
6. After discussion, the AI fills in "Agreed Refactors Discussion Notes" and "Agreed Refactors Summary Table"
7. The execute phase (04b) runs automatically

---

## Review Status: COMPLETE

Human review and discussion completed on 2026-04-19.

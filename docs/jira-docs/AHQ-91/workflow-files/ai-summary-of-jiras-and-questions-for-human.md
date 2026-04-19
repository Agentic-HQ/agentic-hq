# AI Summary: AHQ-91

**Jira**: [AHQ-91](https://agentic-hq.atlassian.net/browse/AHQ-91)
**Title**: Remove Git Root Directory Checking And Refactor Workspace Classes
**Status**: Transitioned to In Progress (assigned to Steve Halso)
**Generated**: 2026-04-18

---

## How Git Is Used Currently (With Details)

A map of every place the codebase depends on git, labelled **G1–G7** so later sections can point back to specific items.

**Why git was used in the first place.** The CLI needs to know two paths at runtime: (a) where the **AHQ installation** lives (so it can find plugin directories, command `.md` files, etc.) and (b) where the **user's project** lives (so it can write temp files and scan for user-defined plugins). The original author's shortcut was: ask git for the top-level directory of whatever repo the user is inside, and use that as the root. This worked but is over-engineered — AHQ never uses any git functionality beyond "find top-level dir" (no commits, branches, status reads, etc.), and it has the side-effect of forcing `git init` on every scratch directory.

**G1 — `src/interfaces/git-workspace.ts` (interface `GitWorkspace`).** One-method interface: `getRoot(): string`. Comment says it was meant to be extensible with `getStatus()` / `getBranch()` / `getVersion()` later — but in practice only `getRoot()` was ever added or used.

**G2 — `src/workspace/default-git-workspace.ts` (class `DefaultGitWorkspace`).** The only impl of G1. In its constructor it runs `execSync('git rev-parse --show-toplevel')` (Node `child_process`), which asks git itself for the directory containing the `.git` folder of whatever repo the current working directory sits inside. Result is cached on `this.root` and the object is frozen. If the shell command fails (user isn't in a git repo), the constructor throws G3.

**G3 — `src/workspace/not-in-git-workspace-error.ts` (class `NotInGitWorkspaceError`).** Thrown by G2's constructor on failure. Message tells the user to `cd` into a git repo or run `git init`. This is the error the Jira is most eager to make go away.

**G4 — `src/kernel/composition-root.ts` (method `getGitWorkspace()`).** The composition root's factory method that instantiates G2. It gets called from exactly two other factories in the same file — see G5 and G6 below.

**G5 — `src/workspace/default-agentic-hq-installation.ts` (class `DefaultAgenticHqInstallation`) — uses git as a FALLBACK.** Constructor takes a `GitWorkspace` and sets `this.root = process.env.AGENTIC_HQ_WORKSPACE_ROOT ?? gitWorkspace.getRoot()`. In other words: if the env var is set (as the install script does), git's answer is never actually used. Git is just a safety net for when the env var is missing. Exposes `getConfigDir()` returning `{root}/.agentic-hq`.

**G6 — `src/workspace/default-user-project-workspace.ts` (class `DefaultUserProjectWorkspace`) — uses git as the SOLE source.** Constructor takes a `GitWorkspace` and sets `this.root = gitWorkspace.getRoot()` unconditionally — no env var override. So the user's project root literally **is** the git root for that repo. Exposes `getRoot()` and `getTempDir()` returning `{root}/.agentic-hq/temp`.

**G7 — Tests that depend on git.**
- `tests/unit/workspace/default-git-workspace.unit.test.ts` — tests the `git rev-parse` flow directly.
- `tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts` and `tests/unit/claude-code-tool/claude-code-tool-with-injected-io-marshaller.unit.test.ts` — construct a live `new DefaultGitWorkspace()`, which silently requires the test runner to be inside a git repo (fragile).

**What's replacing git post-refactor.** Under the big-bang scope, the two parallel hierarchies collapse to the workflow-discovery hierarchy. After this Jira the two concepts are:
- **"Where does AHQ live?"** handled by `AhqWorkspaceImpl` reading `process.env.AGENTIC_HQ_WORKSPACE_ROOT` — fail-fast if unset (see Q2). The legacy `AgenticHqInstallation` / `DefaultAgenticHqInstallation` classes go away entirely.
- **"Where is the user right now?"** handled by `CurrentUserWorkspaceImpl` reading `process.cwd()`. The legacy `UserProjectWorkspace` / `DefaultUserProjectWorkspace` classes go away entirely.

The `Workspace` interface grows `getRoot()` / `getTempDir()` / `isAhqWorkspace()` methods (or sub-interfaces own them — Q4) so consumers can ask for roots without caring which workspace they were handed.

---

## My Understanding of This Task

AHQ-91 is a refactor-and-simplification Jira. Today the root directory of both the "Agentic HQ installation" and the "user's project workspace" is discovered by shelling out to `git rev-parse --show-toplevel` via `DefaultGitWorkspace`. That means `agentic-hq` only runs inside git-initialised directories (otherwise `NotInGitWorkspaceError` is thrown). You consider the git-detection mechanism over-engineered: the command should just trust `process.cwd()` as the user's current workspace, and trust `process.env.AGENTIC_HQ_WORKSPACE_ROOT` as the AHQ installation root. So step one is ripping out `GitWorkspace` / `DefaultGitWorkspace` / `NotInGitWorkspaceError` plus every call site that depends on them.

Step two — pending our assessment — is deduplicating the workspace concepts. AHQ-103 (done) introduced a cleaner `Workspace` interface plus `AhqWorkspaceImpl` and `CurrentUserWorkspaceImpl` inside `src/workflow-discovery/workspace/` that together scan both locations for plugins. But these sit alongside the older `AgenticHqInstallation` / `DefaultAgenticHqInstallation` and `UserProjectWorkspace` / `DefaultUserProjectWorkspace` classes used by `CompositionRoot`, `MarshalledCLITool`, `ClaudeCommandBuilder`, `JsonFileIOMarshallerSessionFactory`, and `ClaudeWorkflowCommandBuilder`. Two parallel representations of the same two concepts exist, using different root resolution (`gitWorkspace.getRoot()` vs `process.env.AGENTIC_HQ_WORKSPACE_ROOT` / `process.cwd()`), so it is worth collapsing them into one.

The Jira explicitly asks for an **assessment** before committing to the bigger half of the work (Additional Refactoring section) and offers an explicit "postpone this Jira" option if the cost isn't worth the benefit. My assessment below argues that the small half (removing git detection) is both cheap and clearly worth it, and that the large half (collapsing to a single `Workspace` abstraction) is medium-risk but pays off because the parallel sets of classes currently conflict on how the AHQ root is found.

Scope is explicitly NOT about changing `.agentic-hq/plugins/` discovery rules, nor about how env vars are set at install time — that remains as-is; we just rely on `AGENTIC_HQ_WORKSPACE_ROOT` being set (which it is, by AHQ-106's install/link flow).

## IMPORTANT: Scope Handoff — What Belongs to the e2e REFACTOR Phase

**This section is a handoff for the future e2e-phase agent.** Added after the unit GREEN phase (2026-04-18) to make ownership boundaries unambiguous between the unit test cycle and the e2e test cycle.

### Unit test cycle scope (completed)

The unit test cycle (RED → GREEN → REFACTOR → VALIDATE) is scoped **only** to the four new `Workspace` interface methods (`getRoot`, `getTempDir`, `getDotAgenticHqDir`, `isAhqWorkspace`) and their implementations across `WorkspaceImpl`, `AhqWorkspaceImpl`, and `CurrentUserWorkspaceImpl`. It does **not** delete any legacy class, does **not** migrate any consumer, and does **not** touch any test outside `tests/unit/workflow-discovery/workspace/`.

### e2e test cycle scope (owned by the e2e agent)

The e2e test cycle owns ALL of the following. The removals and migrations must happen during the e2e **REFACTOR** phase — not the e2e GREEN phase. The deliberate split:

- **e2e GREEN phase** is minimal: make the 5 cross-workspace e2e tests turn green by removing git-root detection from the production path (i.e. the CLI must run without git init). Nothing else. Ugly, copy-pasted, or half-migrated state is acceptable at this point if the e2e tests pass.
- **e2e REFACTOR phase** does the cleanup: delete the now-dead legacy classes, migrate consumers, delete legacy test files, and confirm that **both** `pnpm test` (all unit tests) **and** `pnpm test:e2e` (all e2e tests) still pass after every change.

#### Items the e2e REFACTOR agent MUST complete

**Delete interface files** (all three become dead after consumer migration):
- `src/interfaces/git-workspace.ts`
- `src/interfaces/agentic-hq-installation.ts`
- `src/interfaces/user-project-workspace.ts`

**Delete impl class files** (all four become dead):
- `src/workspace/default-git-workspace.ts`
- `src/workspace/default-agentic-hq-installation.ts`
- `src/workspace/default-user-project-workspace.ts`
- `src/workspace/not-in-git-workspace-error.ts`

**Delete legacy test files** (their target classes are gone):
- `tests/unit/workspace/default-git-workspace.unit.test.ts`
- `tests/unit/workspace/default-agentic-hq-installation.unit.test.ts`
- `tests/unit/workspace/default-user-project-workspace.unit.test.ts`

Once those three files are gone, also delete the now-empty `tests/unit/workspace/` directory.

**Remove re-exports from `src/interfaces/index.ts`** (for the three legacy interfaces just deleted).

**Migrate consumers** to depend on the expanded `Workspace` interface (typed as `Workspace`, with `AhqWorkspaceImpl` or `CurrentUserWorkspaceImpl` as the concrete class) instead of the legacy types:
- `src/kernel/composition-root.ts` — drop `getGitWorkspace()`, `getAgenticHqInstallation()`, `getUserProjectWorkspace()`; inject `AhqWorkspaceImpl` / `CurrentUserWorkspaceImpl` directly (both typed as `Workspace`).
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` — callers of `getConfigDir()` switch to `getDotAgenticHqDir()`, callers of `userWorkspace.getRoot()` unchanged (`Workspace.getRoot()` now exists).
- `src/tools/marshalled-io-tools/marshalled-cli-tool.ts` — `userWorkspace` becomes a `Workspace`.
- `src/io/marshalling/json-file-io-marshaller-session-factory.ts` — `workspace.getTempDir()` unchanged (`Workspace.getTempDir()` now exists).
- `src/workflow/claude/claude-workflow-command-builder.ts` — `workspace.getRoot()` unchanged (`Workspace.getRoot()` now exists).
- `src/workflow-discovery/workflow-search-results-impl.ts` (or equivalent) — if it references legacy types anywhere, switch to `Workspace`.

**Update consumer tests** currently constructing the legacy types directly:
- `tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts`
- `tests/unit/claude-code-tool/claude-code-tool-with-injected-io-marshaller.unit.test.ts`
- `tests/unit/claude-code-tool/claude-code-tool-with-injected-config.unit.test.ts`
- Any further consumer tests surfaced by typecheck errors the moment the legacy classes are deleted — sweep by grep if needed.

#### Test gate — the e2e REFACTOR phase is not complete until ALL of the following pass

- `pnpm test` (all unit tests) — green.
- `pnpm test:e2e` (all e2e tests, including the 5 cross-workspace tests with no `git init` setup) — green.
- `pnpm typecheck` — zero errors.
- `pnpm lint:check` / `pnpm format:check` — green.

If anything breaks, the migration is incomplete. Fix before marking REFACTOR done.

#### Why this split (REFACTOR, not GREEN)

Per the project's TDD rule (RED → GREEN → REFACTOR → VERIFY) and CLAUDE.md's GREEN-phase guidance ("Write only enough code to make the test pass. No gold-plating. No premature optimization."), the e2e GREEN phase's only job is to turn the 5 e2e tests green. Deleting now-unused legacy classes is cleanup, not test-passing work, so it belongs in REFACTOR. Keeping them strictly separate keeps each phase's intent crystal-clear and makes code review simpler.

## Research Findings

No external research needed — this is an internal refactor with every touchpoint visible in the repo. The code reading below substituted for research.

### Current state of the two parallel workspace subsystems

**Legacy subsystem (`src/workspace/` + `src/interfaces/`):**
- `GitWorkspace` — returns git root via `git rev-parse --show-toplevel` (throws `NotInGitWorkspaceError` on failure).
- `AgenticHqInstallation` — has only `getConfigDir()`, which returns `{root}/.agentic-hq`. Root = `process.env.AGENTIC_HQ_WORKSPACE_ROOT ?? gitWorkspace.getRoot()`. Comment in file says `getConfigDir` is a terrible name.
- `UserProjectWorkspace` — has `getRoot()` and `getTempDir()` (returns `{root}/.agentic-hq/temp`). Root = `gitWorkspace.getRoot()` (no env var override).

Used by: `CompositionRoot`, `MarshalledCLITool`, `ClaudeCommandBuilder`, `JsonFileIOMarshallerSessionFactory`, `ClaudeWorkflowCommandBuilder`.

**Workflow-discovery subsystem (`src/workflow-discovery/workspace/`):**
- `Workspace` interface — only has `getWorkflowListingString()` and `registerWorkflowsWith()`. Does not expose the root.
- `WorkspaceImpl` — generic impl that takes a display name and root dir; scans `.agentic-hq/plugins/`.
- `AhqWorkspaceImpl` — reads `process.env.AGENTIC_HQ_WORKSPACE_ROOT ?? ''`, delegates to `WorkspaceImpl`. `getRoot()` exists but is `private`.
- `CurrentUserWorkspaceImpl` — uses `process.cwd()`; when cwd matches the AHQ env var, returns a "same as" message instead of a listing.

Used by: `WorkflowSearchResultsImpl` (the `agentic-hq list` output).

**Where they conflict / duplicate:**
- Both subsystems need an "AHQ workspace root." Legacy prefers env-var-then-git. New prefers env-var-or-empty-string. Post-refactor there must be exactly one answer.
- Both need a "user's workspace root." Legacy uses `gitWorkspace.getRoot()`. New uses `process.cwd()`. Post-refactor both resolve to `process.cwd()`.
- Plugin directory scanning logic is duplicated (roughly) between `ClaudeCommandBuilder.getPluginDirFlags()` and `WorkspaceImpl.discoverPlugins()` — but each does something different with the result (one builds CLI flags, one builds `PluginImpl`s), so they're probably fine to leave parallel.

### Complexity / risk / value assessment (directly answering your asks in the Jira)

**How complex/risky:**
Low-to-medium. The type system guides the work: remove `GitWorkspace` and every consumer stops compiling, exposing the exact set of call sites to touch. Three concrete classes + one interface to delete (legacy), plus swapping the two consumers (`CompositionRoot` wires it all; `ClaudeCommandBuilder`, `MarshalledCLITool`, `JsonFileIOMarshallerSessionFactory`, `ClaudeWorkflowCommandBuilder` just take the new types). ~6 unit test files to update or delete. No production behaviour changes beyond "no longer require git init" and "cwd is always honoured as user workspace root."

**Main risks:**
1. If `AGENTIC_HQ_WORKSPACE_ROOT` isn't set, the legacy subsystem currently falls back to git root — losing that fallback means AHQ silently misbehaves when the env var is missing. Needs a clear fail-fast error. Q1 below.
2. `DefaultUserProjectWorkspace` currently returns `{root}/.agentic-hq/temp` as temp dir. If the user's cwd is the AHQ workspace, temp writes go inside the checked-out git repo. This is existing behaviour; post-refactor it stays the same (cwd is used), so no regression — but it IS the current behaviour of tests that spy on temp files, so need to verify end-to-end.
3. There's a special case in `CurrentUserWorkspaceImpl` where if cwd equals AHQ root, it skips listing (to avoid duplicates). In the Workflow command paths (e.g. `getPluginDirFlags()`) there's equivalent dedup by string comparison. Post-refactor we need the same dedup to exist in one place.

**How much work:**
Small-to-medium. Probably 1 unit test type + 1 smoke or e2e test type. Concrete steps:
- Delete: `src/interfaces/git-workspace.ts`, `src/workspace/default-git-workspace.ts`, `src/workspace/not-in-git-workspace-error.ts`, and their three legacy test files.
- Delete or replace: `src/interfaces/agentic-hq-installation.ts`, `src/workspace/default-agentic-hq-installation.ts`, `src/interfaces/user-project-workspace.ts`, `src/workspace/default-user-project-workspace.ts` + tests.
- Extend the workflow-discovery `Workspace` interface with `getRoot()`, `getTempDir()`, `isAhqWorkspace()`. Add `AhqWorkspace`/`CurrentUserWorkspace` interfaces if you want nominal typing (the impls already exist).
- Update `CompositionRoot` to wire the new types.
- Update the four consumers (`ClaudeCommandBuilder`, `MarshalledCLITool`, `JsonFileIOMarshallerSessionFactory`, `ClaudeWorkflowCommandBuilder`) to depend on `AhqWorkspace` / `CurrentUserWorkspace` instead of legacy types.
- Fail fast with a clear error when `AGENTIC_HQ_WORKSPACE_ROOT` is unset.
- Update `src/interfaces/index.ts` exports.

**How much would it simplify:**
Substantial for readability. After the refactor there's **one** concept of "workspace" with two implementations, instead of two parallel hierarchies. The "git" verbiage disappears entirely, removing the manual-install friction (no more `git init` in every directory). Design-requirements compliance actually improves because the Concept Table collapses two rows into one.

**Is it worth doing (my recommendation):**
**Yes — do both halves together, in this Jira.** Reasons:
1. The removal-only half is trivially cheap (a few dozen lines + tests).
2. Leaving the two parallel hierarchies in place after deleting git detection would make naming *worse* (you'd have `AgenticHqInstallation` using an env var with no git fallback, sitting alongside `AhqWorkspaceImpl` using the same env var — duplicated for no reason). So the second half is largely a rename + consolidation, not a new design.
3. You stated you're on a pre-launch timeline. Doing this now while the classes have exactly four users in production code is much cheaper than after users start writing plugins that import `AgenticHqInstallation`.

**Reasons I'd consider deferring** (if any of these are true, tell me and we'll scope down):
- You'd rather not add new public methods to `Workspace` (it is a clean, minimal interface today). Expanding it with `getRoot` / `getTempDir` / `isAhqWorkspace` makes it less focused. An alternative is to keep `Workspace` focused on listings, and add a separate `WorkspaceLocation` concept for the root-dir/temp-dir concerns. This would add one more interface but keep each tightly focused.
- You expect a `classwitch`-style swap scenario where third parties might want to replace the AHQ root resolver — in which case keeping `AgenticHqInstallation` as a separate, narrow interface (just `getRoot`) could be a feature, not duplication.

See Q4 below for the related design decision.

## Project Design Requirements

**File**: `docs/dev/project-design-requirements.md` (also pulled in the memory feedback files in `~/.claude/projects/-Users-stevepersonal-dev-agentic-hq-agentic-hq/memory/`).

Relevant requirements for this Jira:

1. **Class/interface per concept** — every concept gets an `X` interface and `XImpl` class. Post-refactor concepts: AhqWorkspace, CurrentUserWorkspace, (maybe) Workspace (as a parent). Plan will need a Concept Table + Data Dictionary + English Language Description section in step 02.
2. **No "er" suffix** (from memory feedback) — existing code already fine; keep it that way (no `WorkspaceResolver` etc.).
3. **Avoid cached state** (from memory feedback) — `DefaultAgenticHqInstallation` and `DefaultUserProjectWorkspace` cache the root in a frozen field. That's fine for genuinely immutable values (env var + cwd don't change at runtime) but should be justified. New impls (`AhqWorkspaceImpl`, `CurrentUserWorkspaceImpl`) already read fresh each call, matching the "avoid cached state" guidance. I plan to keep them that way.
4. **Collection names: plural not List** (from memory feedback) — not directly relevant to this Jira (no collections being renamed).
5. **Tell, don't ask** / push work into the object — relevant when deciding whether `isAhqWorkspace()` lives on `Workspace` or we instead ask callers to compare strings. The Jira already asks for `isAhqWorkspace()` on `Workspace`, which matches this requirement.
6. **One test file per class** (from memory feedback) — already followed by existing test structure; keep it.
7. **Directory structure by entity** (from memory feedback) — keep all the new workspace classes in `src/workflow-discovery/workspace/` alongside existing impls; do not create `src/workspace/` in the legacy location.

**Not directly relevant:**
- Most of the "Concept Table / Data Dictionary / ELD" requirements apply in the *planning* phase (step 02), not this reading phase. Will flag for step 02.

## Questions for Human

### Question 1: Proceed with both halves or small half only?

**RESOLVED**: Big-bang (both halves in one Jira). AHQ-115 was briefly split off and has now been remerged back into AHQ-91. No further input needed for this question.

---

### Question 2: What happens if `AGENTIC_HQ_WORKSPACE_ROOT` is unset?

**Nuanced finding — the env var IS always set in the CLI path:** `bin/agentic-hq.cjs:19` unconditionally runs `process.env.AGENTIC_HQ_WORKSPACE_ROOT = path.join(__dirname, '..')` before invoking the TypeScript CLI. Since `package.json`'s `"bin"` entry routes every `agentic-hq ...` invocation through that wrapper, the env var is always set (and even overwrites whatever the user had in their shell — they can't misconfigure it via the CLI path).

**Non-CLI invocation paths where it's NOT guaranteed:**
- Unit/integration tests that import the workspace classes directly — they have to set the env var themselves, and many existing tests already do.
- `pnpm demo:plugin-direct:*` scripts — invoke skills via `tsx` without going through `bin/agentic-hq.cjs`.
- Direct `tsx src/cli/agentic-hq-cli.ts` calls (none in practice today, but possible).

**What that means for the plan:**

Today, the legacy `DefaultAgenticHqInstallation` falls back to the git root when the env var is unset, and the new `AhqWorkspaceImpl` silently uses `''`. After this refactor neither fallback exists. I plan to throw a clear fail-fast error (per CLAUDE.md "never catch and fall back") with a message explaining how to set the env var.

Framing: this error is **primarily a dev/test ergonomics aid** (turns a silent `''` into a loud explanation) rather than a user-facing failure mode — production CLI users are already protected by the bin wrapper. Sound right?

**Side note (out of scope but flagging):** `bin/agentic-hq.cjs:19` uses `=` (overwrite), not `??=` (set-if-unset). If you ever want users to be able to override `AGENTIC_HQ_WORKSPACE_ROOT` from their shell (e.g. to point at an alternative AHQ checkout), that line needs to change. Not required for AHQ-91.

**Human's Response**:
> If AGENTIC_HQ_WORKSPACE_ROOT is not set, then current pnpm commands and tests default to finding the git root.  As I always run these pnpm commands from the root of the Agentic HQ workspace (only) these commands currently always just return the cwd.  So I would be happier if we explicitely put code in that makes it clear that if if AGENTIC_HQ_WORKSPACE_ROOT is not set, we use cwd and explain why (i.e. we cannot be running inside an "agentic-hq" CLI and so must be running pnpn command or test and so fine to assume the cwd **is** the Agentic HQ workspace root)

---

### Question 3: Rename `getConfigDir()` to `getRoot()`?

`AgenticHqInstallation.getConfigDir()` currently returns `{root}/.agentic-hq` (NOT the workspace root — it appends `.agentic-hq`). The inline comment already flags the name as "terrible". The new `Workspace.getRoot()` would return just `{root}`. That means callers of `getConfigDir()` need to append `.agentic-hq` themselves after the refactor — or we add a `getAhqDir()` method.

Proposal: add `getRoot()` on `Workspace` (returns root) and add `getAhqDir()` on `Workspace` (returns `{root}/.agentic-hq`). Drop `getConfigDir` entirely. OK?

**Human's Response**:
> Approved, but I prefer getDotAgenticHqDir

---

### Question 4: Keep `Workspace` narrow, or add root/tempDir/isAhqWorkspace to it?

The Jira explicitly says "add getRoot and getTempDir to `Workspace`" and "have a new method on Workspace called isAhqWorkspace". Straightforward to do — but it makes `Workspace` less focused (it currently only handles listing/registration).

Alternative: add those methods to the sub-interfaces (`AhqWorkspace` and `CurrentUserWorkspace`) only, leaving `Workspace` focused on listing. Downside: callers that want "the root of whichever workspace they've been handed" would have to cast, or we'd need a new parent concept.

I'll follow the Jira literally (put them on `Workspace`) unless you prefer the alternative.

**Human's Response**:
> Put them on Workspace.

---

### Question 5: `isAhqWorkspace()` — where does it live, what does it compare?

The Jira says `isAhqWorkspace()` returns true if the workspace's root matches the AHQ workspace root. Two implementation questions:

- On `AhqWorkspaceImpl` it can just return `true` (trivial). On `CurrentUserWorkspaceImpl` it compares `process.cwd()` to `process.env.AGENTIC_HQ_WORKSPACE_ROOT`. Fine?
- If `AGENTIC_HQ_WORKSPACE_ROOT` is a relative path or has trailing slash differences vs `process.cwd()`, the equality check can lie. Should I normalise via `path.resolve()` on both sides? (My default: yes.)

**Human's Response**:
> Just keep it simple.  No need to normalise.

---

### Question 6: Temp dir — where does it go for the AHQ workspace?

Currently `UserProjectWorkspace.getTempDir()` returns `{root}/.agentic-hq/temp`. If we put `getTempDir()` on `Workspace`, both `AhqWorkspace` and `CurrentUserWorkspace` have a temp dir. When the user is in the AHQ workspace (cwd == env var), the two are the same directory — fine. But does the AHQ workspace *ever* need a temp dir separate from the current user's workspace? I don't think so today (consumers only ever read the user's temp dir via `JsonFileIOMarshallerSessionFactory`). Plan: implement it on both anyway (they're identical when equal, different when not), but only `CurrentUserWorkspace` is actually consumed.

OK, or should I only put `getTempDir()` on `CurrentUserWorkspace`?

**Human's Response**:
> Both is fine - with a note to consider REFACTOR later in case we can eliminate duplication easily

---

## Files I Reviewed

- `docs/dev/project-design-requirements.md` — current design requirements (class/interface per concept, tell-don't-ask, avoid cached state).
- `~/.claude/projects/.../memory/feedback_plans_no_chain_of_thought.md` — plan style guidance; no-correction-passages.
- `src/interfaces/git-workspace.ts` — the interface to delete.
- `src/interfaces/agentic-hq-installation.ts` — legacy AHQ installation interface (`getConfigDir` only, bad name).
- `src/interfaces/user-project-workspace.ts` — legacy user project interface (`getRoot` + `getTempDir`).
- `src/interfaces/index.ts` — re-exports all three legacy interfaces; will shrink.
- `src/workspace/default-git-workspace.ts` — `execSync('git rev-parse --show-toplevel')` → throws `NotInGitWorkspaceError`. To delete.
- `src/workspace/default-agentic-hq-installation.ts` — reads env var **or** git root. Frozen.
- `src/workspace/default-user-project-workspace.ts` — reads git root only; frozen.
- `src/workspace/not-in-git-workspace-error.ts` — error class. To delete.
- `src/kernel/composition-root.ts` — the **central wiring**: `getGitWorkspace()`, `getAgenticHqInstallation()`, `getUserProjectWorkspace()`, and four consumers. This is the biggest touch point.
- `src/workflow-discovery/interfaces/workspace.ts` — the clean new `Workspace` interface (listing + registration only).
- `src/workflow-discovery/workspace/workspace-impl.ts` — generic WorkspaceImpl taking `displayName` + `rootDir`.
- `src/workflow-discovery/workspace/ahq-workspace-impl.ts` — env-var-based AHQ workspace; has private `getRoot()` already; fallback is empty string.
- `src/workflow-discovery/workspace/current-user-workspace-impl.ts` — cwd-based; "same as AHQ" dedup already present.
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` — consumer: uses `getConfigDir()` and `userWorkspace.getRoot()`. Builds `--plugin-dir` flags.
- `src/tools/marshalled-io-tools/marshalled-cli-tool.ts` — consumer: uses `userWorkspace.getRoot()` as CLI cwd.
- `src/io/marshalling/json-file-io-marshaller-session-factory.ts` — consumer: uses `workspace.getTempDir()`.
- `src/workflow/claude/claude-workflow-command-builder.ts` — consumer: uses `workspace.getRoot()`.
- `tests/unit/workspace/default-git-workspace.unit.test.ts`, `tests/unit/workspace/default-agentic-hq-installation.unit.test.ts`, `tests/unit/workspace/default-user-project-workspace.unit.test.ts` — will be deleted or rewritten.
- `tests/unit/claude-code-tool/claude-code-tool-with-injected-config.unit.test.ts`, `tests/unit/claude-code-tool/claude-code-tool-with-injected-io-marshaller.unit.test.ts`, `tests/unit/claude-code-tool/fake-claude-executes-command-using-file-io.unit.test.ts` — construct the legacy types directly; must be updated.
- `tests/unit/workflow-discovery/workspace/ahq-workspace-impl.unit.test.ts`, `tests/unit/workflow-discovery/workspace/current-user-workspace-impl.unit.test.ts`, `tests/unit/workflow-discovery/workspace/workspace-impl.unit.test.ts` — will expand to cover the new methods (`getRoot`, `getTempDir`, `isAhqWorkspace`).

**Most important things found**:
- Legacy + new subsystems both exist and disagree on how to resolve the AHQ root (env-var-then-git vs env-var-or-empty). Must converge.
- `ClaudeCommandBuilder` embeds the plugin-dir scanning logic; post-refactor this still uses `AhqWorkspace.getRoot()` and `CurrentUserWorkspace.getRoot()` — no behavioural change.
- Seven test files touch the legacy classes directly (construct, assert on). These fix up naturally once `CompositionRoot` is rewired, but each needs a deliberate review.
- `DefaultAgenticHqInstallation` has an inline REFACTOR comment marking `getConfigDir` as a bad name (Q3).
- `NotInGitWorkspaceError` has only two uses (throw site + its own test) — trivial removal.

## Test Types And Tests We Will Be Implementing

**Test types (confirmed)**: `unit, e2e`

Full details — specific test files to create / expand / delete, the 5 cross-workspace e2e tests whose `git init` setup lines will be deleted as the e2e RED step, and the TDD cycles at each level — now live verbatim in the Jira itself. See the **Testing Plan** section added to the AHQ-91 description.

**Headline approach:**
- **unit** — full TDD cycle per class. Expand tests for `AhqWorkspaceImpl`, `CurrentUserWorkspaceImpl`, `WorkspaceImpl` to cover the four new `Workspace` methods (`getRoot`, `getTempDir`, `getDotAgenticHqDir`, `isAhqWorkspace`). Delete the three legacy workspace test files (`default-git-workspace`, `default-agentic-hq-installation`, `default-user-project-workspace`). Update the claude-code-tool tests that currently construct the deleted legacy types.
- **e2e** — no new tests written. Delete the `execSync('git init', …)` setup line (and its comment) from each of the 5 existing cross-workspace e2e tests. This gives a genuine RED (tests fail because `DefaultGitWorkspace` still throws `NotInGitWorkspaceError` against a non-git tmpdir) → GREEN (git detection removed, bin wrapper sets the env var, tests pass).

**Acceptance criteria**: see the **Acceptance Criteria** section added to the AHQ-91 description. Covers TDD adherence, design-requirements adherence, the complete deletion list, the expanded `Workspace` interface, the cwd fallback documentation (per Q2), the 5 e2e tests no longer calling `git init`, the explicit scope statement that unrelated git usage (e.g. `src/scripts/git-scripts/` dev tooling, branching, stashing) is NOT in scope, and the captured REFACTOR note for the `getTempDir` duplication (per Q6).

## Ready for Next Step

Summary complete. All six questions answered. Test types confirmed as `unit, e2e`. Testing Plan and Acceptance Criteria sections added to the Jira. Ready to proceed to step 02 (planning).

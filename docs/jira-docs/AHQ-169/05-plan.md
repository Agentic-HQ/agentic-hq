# Plan — Simplify dev install: replace `pnpm add -g .` with `npm link`

## Context

New users following the README hit a confusing failure at install: the dev
install script (`scripts/infra/install-dev-agentic-hq.sh`) runs `pnpm add -g .`,
but pnpm 11 stores global binaries in its own private `$PNPM_HOME/bin`, which is
not on `PATH` by default. pnpm therefore refuses to create the `agentic-hq` shim
and prints `… global bin directory … is not in PATH / Run "pnpm setup"`. The
documented fix (`pnpm setup` → restart shell → re-run) is a fragile, multi-step,
machine-mutating dance that confused even the repo owner.

**Root cause** (confirmed by two independent research passes — see
`/tmp/web-research-q-and-a.md` and `/tmp/perplexity-q-and-a.md`): a pnpm-11
global-bin ergonomics quirk, not our code. **npm** does not have this problem — its
global bin directory (especially under nvm, which this project uses) is already on
`PATH`. The canonical Node way to run a local clone globally is **`npm link`**,
which uses the existing `package.json` "bin" field, works in the same terminal with
no shell restart, needs no shell-config edit, and is cross-platform.

**Decisions made by the owner:**
1. **Scope = Phase 1 only.** Just fix dev onboarding now. Publishing to npmjs.org
   (compile-to-JS build step, etc.) is explicitly **future work**, not in this change.
2. **Drop the install script entirely** and document `pnpm install && npm link` in
   the README.

**Intended outcome:** a fresh clone is globally runnable with two ordinary commands
(`pnpm install && npm link`), no `pnpm setup`, no shell restart, no "smelly" global
pnpm-state mutation — and the existing cross-workspace behaviour is preserved.

## How `npm link` works (and why it works for our setup)

`npm link`, run once from the repo root, does two things — both driven by the
existing `package.json` "bin" field, so **no code change is required**:

1. **Registers the package globally** — creates a symlink in npm's global
   `node_modules` pointing at this repo:
   `<npm global node_modules>/agentic-hq → <repo>`.
   On this machine:
   `/home/steve-personal/.nvm/versions/node/v24.18.0/lib/node_modules/agentic-hq → <repo>`.

2. **Creates the command shim on PATH** — because the package declares
   `"bin": { "agentic-hq": "bin/agentic-hq.cjs" }`, npm drops a matching entry in
   npm's global **bin** directory that resolves to the repo's wrapper:
   `<npm global bin>/agentic-hq → …/agentic-hq/bin/agentic-hq.cjs`.
   On this machine: `/home/steve-personal/.nvm/versions/node/v24.18.0/bin/agentic-hq`.
   (Unix → a symlink; on Windows npm would generate `.cmd`/`.ps1` wrappers instead.)

**Why it lands on PATH with no setup/restart.** npm's global bin dir is
`$(npm prefix -g)/bin`. Under nvm that prefix is the *active Node version's own
directory*, whose `bin` is already on PATH (it's the same dir `node`/`npm` live in).
Verified on this machine just now:
- `npm prefix -g` → `/home/steve-personal/.nvm/versions/node/v24.18.0`
- global bin → `/home/steve-personal/.nvm/versions/node/v24.18.0/bin` → **already on PATH ✓**
- `node`/`npm` resolve to that same dir, confirming nvm keeps it on PATH.

This is the exact contrast with pnpm, which uses a *separate* `$PNPM_HOME/bin` that
is NOT on PATH by default — the whole original problem.

**Why our entry point still works.** `bin/agentic-hq.cjs` locates the repo and the
repo-local `tsx` from its own `__dirname`. Invoked through the symlinked shim, Node
resolves the symlink to its real path, so `__dirname` is the *real* repo's `bin/`
dir → `AGENTIC_HQ_WORKSPACE_ROOT` = the repo. Plugin resolution and
run-from-any-directory are unaffected (verified empirically earlier).

**Other properties.**
- **Live, like before** — the links point at repo source, so edits take effect
  immediately (same benefit the old `pnpm add -g .` symlink gave).
- **No package-manager conflict** — `npm link` only touches npm's *global*
  node_modules + bin; it never installs into or manages the repo's `node_modules`,
  which pnpm keeps owning.
- **Reversible** — undo with `npm unlink -g agentic-hq`.

**Execution chain** when a user types `agentic-hq` from any directory:
```
type "agentic-hq"
  → shell searches PATH
  → finds shim in <npm global bin>      (already on PATH, esp. under nvm)
  → shim resolves to <repo>/bin/agentic-hq.cjs
  → node runs it; __dirname = <repo>/bin  →  AGENTIC_HQ_WORKSPACE_ROOT = <repo>
  → execs the repo's tsx on src/cli/main.ts
```

## What does NOT change

- `bin/agentic-hq.cjs` — unchanged. It stays the `bin` target, still runs the TS CLI
  via the repo-local `tsx`, and still derives `AGENTIC_HQ_WORKSPACE_ROOT` from
  `__dirname`. Run-from-any-directory + workspace resolution are preserved (verified
  empirically earlier: a linked symlink resolves `__dirname` back to the repo).
- `package.json` "bin" field (`{ "agentic-hq": "bin/agentic-hq.cjs" }`) — unchanged;
  `npm link` consumes it as-is.

## Changes

### 1. Delete the dev install script
- Delete `scripts/infra/install-dev-agentic-hq.sh`. (The entire "smelly" banner and
  `PNPM_HOME`/pnpm-11 caveat block die with it — nothing references it except tests
  and docs, updated below. There is **no CI** to update.)
- `scripts/infra/install-prod-agentic-hq.sh:21` — update the stale commented line
  `"… run: scripts/infra/install-dev-agentic-hq.sh"` to reference `npm link`
  (file is an all-commented placeholder; low priority but keep it accurate).

### 2. Update the 5 cross-workspace e2e tests (inline, NOT via a shared helper)
Per the **AHQ-82** decision, these tests are intentionally kept self-contained — the
owner explicitly rejected extracting their setup into a shared helper, and each file
carries an in-code NOTE saying so. **Honour that: edit the identical block inline in
all 5 files; do not centralize.** Preserve/keep each file's existing "intentionally
duplicated" NOTE.

Files:
- `tests/e2e/demo/cross-workspace-string-reversal.e2e.test.ts`
- `tests/e2e/demo/cross-workspace-list-workflows.e2e.test.ts`
- `tests/e2e/demo/cross-workspace-demo-math-workflow-gives-expected-output-number.e2e.test.ts`
- `tests/e2e/demo/cross-workspace-quick-jira-workflow-produces-expected-files.e2e.test.ts`
- `tests/e2e/demo/string-reversal-workflow-in-new-workspace-lists-and-executes.e2e.test.ts`

In each: remove the `INSTALL_SCRIPT` constant and the pnpm-specific Arrange block,
and replace with an `npm link` + npm-global-bin derivation. Replacement pattern
(the bare `agentic-hq <workflow>` invocation in each test is unchanged):

```ts
// constants
const NPM_LINK_TIMEOUT_MS = 60_000; // npm link (first run can be slow)
// (delete INSTALL_SCRIPT / INSTALL_SCRIPT_TIMEOUT_MS)

// Arrange — register agentic-hq on PATH via `npm link` (uses package.json "bin").
// Replaces the old install-dev-agentic-hq.sh / pnpm add -g . flow. node_modules
// already exists (tests run from the installed repo), so `npm link` alone exposes
// the CLI globally.
execSync('npm link', { cwd: REPO_ROOT, stdio: 'pipe', timeout: NPM_LINK_TIMEOUT_MS });

// Ensure npm's global bin dir is on PATH for this process so the linked
// 'agentic-hq' command resolves (usually already on PATH under nvm).
const npmGlobalBin = path.join(execSync('npm prefix -g').toString().trim(), 'bin');
if (!process.env.PATH?.includes(npmGlobalBin)) {
  process.env.PATH = `${npmGlobalBin}:${process.env.PATH}`;
}
```
Also remove each file's now-inaccurate "smelly" warning comment block.

### 3. README — Quick Start step 5 (`README.md:41-47`)
Replace the script invocation + `pnpm add -g .` explanation with `npm link`:
- Command becomes `npm link` (step 4 already runs `pnpm install`; note the combined
  one-liner `pnpm install && npm link`).
- Explain it puts `agentic-hq` on `PATH` via the package's `bin` field as a live
  symlink to the repo — no `sudo`, no `pnpm setup`, no shell restart.
- Add a one-line verify: `agentic-hq list`.

### 4. Troubleshooting (`docs/user-docs/troubleshooting-quickstart.md`)
- Rewrite the install-failure section (currently `:57-90`, keyed to the script name
  and `pnpm link --global`/`PNPM_HOME`). Drop the `pnpm setup`/`PNPM_HOME` items.
- Add an `npm link`-oriented entry: "`agentic-hq: command not found` after
  `npm link`" → check that npm's global bin is on PATH via
  `npm prefix -g` (the bin dir is `<that>/bin`); open a new terminal if PATH was
  just changed. Keep the corepack / Node-version / `node-pty` items as-is.
- Replace `pnpm bin --global` references (`:88`, `:112`) with `npm prefix -g`.

### 5. Glossary (`docs/glossary.md:92`)
- Update "After running `scripts/infra/install-dev-agentic-hq.sh`…" to "After running
  `npm link`…" (definition of the repo-root path / dev-mode live symlink is otherwise
  still accurate — `npm link` is also a live symlink).

## Implementation order (TDD-aligned)
This is a mechanism swap; the asserted behaviour (cross-workspace `agentic-hq` runs)
is unchanged, so the e2e tests are the safety net.

**Reality on a fresh / un-set-up machine (including this one): the cross-workspace
e2e tests currently FAIL.** Their Arrange runs `install-dev-agentic-hq.sh` →
`pnpm add -g .` → the `… global bin directory … is not in PATH` error, so `execSync`
throws before the assertion. There is **no green baseline to capture — the failing
test _is_ the bug.** So the cycle is:

1. **RED (current state):** run `pnpm test:e2e:cross-workspace-list-workflows` (fast,
   no Claude launch). It fails in Arrange with the pnpm global-bin PATH error. This
   reproduces the bug *and* proves the test exercises the install path. (Per the repo
   rule "confirm tests fail first" — here they already do.)
2. **GREEN (one test):** switch `cross-workspace-list-workflows.e2e.test.ts` to the
   `npm link` pattern and delete `install-dev-agentic-hq.sh`; re-run → it passes
   (npm's global bin is already on PATH under nvm — verified on this machine:
   `/home/steve-personal/.nvm/versions/node/v24.18.0/bin`).
3. Roll the same edit out to the other 4 e2e files; run them.
4. Update README, troubleshooting, glossary, and the install-prod comment.
5. Run `pnpm validate` (typecheck + lint:check + format:check + unit tests; note e2e
   is separate from `validate`). Use `format:fix`/`lint:fix` only if `*:check` shows
   changes are confined to files touched here (per repo formatter rule).

## Verification
- **Manual, the documented path:** from a clean clone state, `pnpm install && npm link`,
  then `cd /tmp && agentic-hq list` (shows shipped workflows) — proves run-from-anywhere
  with no shell restart. If Claude Code is available:
  `agentic-hq reversal -- --string-to-reverse="hello"`.
- **Automated:** `pnpm test:e2e:cross-workspace-list-workflows` (primary, no Claude).
  Then the fuller `pnpm test:e2e` set if Claude Code + time allow (reversal/math/quick-jira
  launch real Claude and are slower).
- **`pnpm validate`** must pass 100%.
- **Cleanup note:** `npm link` leaves a global symlink; undo with
  `npm unlink -g agentic-hq` if needed (mirrors the persistence of the old
  `pnpm add -g .`).

## Risks / edge cases
- **npm global bin not on PATH** on a non-nvm/system-Node setup (rare). Mitigated by
  the new troubleshooting entry (`npm prefix -g`). Far less likely than the pnpm case.
- **`npm link` in a pnpm repo** may print a benign warning (packageManager pinned to
  pnpm); it still links via the `bin` field. pnpm keeps owning `node_modules`. Verify
  no error during step 3.
- **`private: true`** does not block `npm link` (only blocks publish). Fine.

## Out of scope (future)
- **Phase 2 / npm publishing**: compile TS→JS build (tsup/tsc), point `bin` at
  compiled `dist/`, `tsx` → devDependency only, `prepublishOnly`, ship the
  `.agentic-hq` plugins inside the package, decide ESM/CJS. Captured for a future
  ticket; full write-up in
  `/tmp/updated-simple-description-and-research-summary-and-proposed-solution.md`.
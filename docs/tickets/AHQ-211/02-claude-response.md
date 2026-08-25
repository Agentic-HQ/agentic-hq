# AHQ-211 — Windows Support Investigation

Claude's research report, produced on the Windows 11 machine described in
[DRAFT - Windows Installation Of Agentic HQ](https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/120979458/DRAFT+-+Windows+Installation+Of+Agentic+HQ).
This is research + a work list, **not** an implementation plan (planning happens next, per the prompt).

## TL;DR

- The `pnpm install` failure is exactly what it looks like: the root `postinstall` in `package.json:18` is a POSIX
  one-liner (`chmod … 2>/dev/null || true`) that Windows runs through `cmd.exe`, where every part of it fails.
  Worse, pnpm 11 re-runs `pnpm install` before **every** script, so this one line currently blocks *all* `pnpm <script>`
  commands on Windows, not just installation.
- Native Windows support is **not a nightmare**. Verified on this machine: `tsc --noEmit` passes untouched,
  **185 of 190 unit tests pass** (all 5 failures are understood, small, and listed below), node-pty's ConPTY backend
  works, and the winget-installed `claude.exe` spawns cleanly from Node. The `src/` path handling is already
  disciplined (`path.join` throughout, no `HOME`/`TMPDIR` reads, `pathToFileURL` used correctly).
- Most of the work is **mechanical** and falls into ~6 repeating categories (postinstall, `.cmd`-shim spawns, `/tmp`
  in tests, symlink→junction, quoting of path-bearing args, CRLF/`.gitattributes`).
- Exactly **one item was design-level**: every workflow executes through `bash -c`
  (`src/workflow/workflow-command/default-workflow-command.ts:26`). **Decided** (plan D1, incorporating AHQ-210):
  delete the command string outright — SKILL.md returns only `skill-base-dir` and the engine builds the argv
  itself, so no shell is involved on any platform. The other candidate — self-termination — is
  **solved**: a single cross-platform Node script keyed on the officially documented `CLAUDE_PID` env
  var, validated live on Windows, macOS and Linux; lands production-clean in plan Phase 5 (see §3D).
- The "just require Git Bash" shortcut buys less than it appears (see [§7](#7-native-vs-git-bash-vs-wsl)) — it would
  rescue item (1) only, with new fragility, and none of the Node-level fixes go away. WSL rescues everything but is
  effectively "not Windows support". Recommendation: native is tractable; keep Git Bash/WSL as fallback options for
  the one remaining design-level item only.

---

## 1. Why the install error happened

`package.json:18`:

```
"postinstall": "chmod +x node_modules/node-pty/prebuilds/darwin-*/spawn-helper ../node-pty/prebuilds/darwin-*/spawn-helper 2>/dev/null || true"
```

On Windows, npm/pnpm run lifecycle scripts through `cmd.exe`, where:

1. `chmod` doesn't exist,
2. `2>/dev/null` tries to redirect to a file literally named `\dev\null` → *"The system cannot find the path specified"*,
3. `|| true` fails because `true` isn't a cmd command → *"'true' is not recognized…"* — so the safety net that makes
   this a silent no-op on Linux is itself the thing that returns exit code 1 on Windows.

The script's only purpose is repairing the exec bit on node-pty's **macOS** spawn-helper (AHQ-198) — it has no job to
do on Windows at all. The same string is also baked into the **published npm package** by
`scripts/build-release.cjs:243`, so `npm install -g agentic-hq` and `npx agentic-hq` fail on Windows for the same
reason, independently of the repo-dev path.

**Second-order effect (verified):** pnpm 11's deps-check re-runs `pnpm install` before every script, so on Windows even
`pnpm typecheck` currently dies at the postinstall before running anything.

## 2. What was verified empirically on this machine

| Experiment | Result |
|---|---|
| `pnpm install` | Fails at root postinstall (as documented in the Confluence page); all 298 packages *do* install first, including node-pty with `win32-x64`/`win32-arm64` prebuilds and `conpty` — so the lockfile's platform-specific optional deps are fine |
| `pnpm typecheck` (any pnpm script) | Blocked by the postinstall re-run (see above) |
| `tsc --noEmit` run directly via node | **Passes clean** |
| Unit suite run directly via vitest | **185 passed / 5 failed** (~4 s); all 5 failures root-caused below |
| `node bin/agentic-hq.cjs list` (the `agentic-hq-dev` wrapper) | Fails at startup: `execFileSync` ENOENT on `node_modules/.bin/tsc` (`bin/agentic-hq.cjs:26`) — the extensionless `.bin/tsc` is a POSIX sh script; the Windows shims are `tsc.CMD`/`tsc.ps1` |
| node-pty ConPTY smoke test (`pty.spawn('cmd.exe', …)`) | **Works** — spawn, output capture, exit code all correct. One caveat: the conpty connection keeps the Node event loop alive after child exit, so the shutdown path must call `kill()`/dispose explicitly |
| Spawning `claude` and `claude.exe` from Node (`--version` only) | **Both work** — the winget install is a native `.exe`, resolvable from PATH |
| `.sh` line endings in this checkout | **CRLF** (e.g. the self-termination kill script) — `core.autocrlf=true` (Git for Windows default) converted them; there is no `.gitattributes` preventing it. This breaks the scripts even under Git Bash/WSL (`bad interpreter: /bin/bash\r`) |
| Self-termination experiments (2 days, full trail in `supporting-files/`) | **Final: a single Node script keyed on the officially documented `CLAUDE_PID` env var kills the live session on Windows, macOS and Linux in <1 s** — validated at skill level on Windows. Ditched en route: `$PPID` (=`1` under Git Bash), parent-chain walks (racy), MSYS `kill` (fails), soft `taskkill` (silent no-op), `GenerateConsoleCtrlEvent` broadcasts (fakes pass, real `claude.exe` ignores them), per-OS `.ps1`/`.sh` `taskkill` pair (worked, superseded) |

The 5 unit-test failures, all Windows-portability and nothing else:

1–2. `tests/unit/claude-code-tool/*.unit.test.ts` — the fixtures spawn bare `tsx` through node-pty; on Windows `tsx`
is a `.cmd` shim that node-pty's `WindowsPtyAgent` can't resolve ("File not found").
3. `tests/unit/e2e-helpers/run-cli-and-log-output.unit.test.ts` — hardcoded `/tmp` working dir plus a POSIX shell
string (`echo '…'; pwd`) run through `execSync` (= `cmd.exe` on Windows).
4–5. `tests/unit/io/marshalling/json-file-io-marshaller-session.unit.test.ts` — `TEST_TEMP_DIR = '/tmp/…'`; the
session resolves it to `C:\tmp\…` so `startsWith('/tmp/…')` fails.

## 3. Full inventory of what breaks (by area)

### A. Install-time
- Root `postinstall` (`package.json:18`) and the generated release-manifest `postinstall`
  (`scripts/build-release.cjs:243`) — hard install failure, both repo-dev and npm/npx paths (§1).
- `prepack` guards (`package.json:20`, `build-release.cjs:230`) — `node -e "…'…'…"` nested-quote strings are fragile
  under `cmd.exe`.

### B. Dev CLI and build pipeline
- `bin/agentic-hq.cjs:26` — `execFileSync` on extensionless `node_modules/.bin/tsc` → ENOENT at every
  `agentic-hq-dev` launch (verified). Same pattern at `scripts/build-release.cjs:77` and `scripts/build-workflow.cjs:95`.
- `scripts/build-workflow.cjs:64` — `execFileSync('pnpm', …)` without `shell: true` → ENOENT (`pnpm` is a `.cmd`/`.ps1`
  shim; `CreateProcess` doesn't do PATHEXT). The ENOENT handler then prints a *wrong* diagnosis ("pnpm not found —
  see pnpm.io/installation"). Same bug in `tests/integration/build/publish-guards.integration.test.ts:55` for both
  `npm` and `pnpm`. Note: Node ≥20.12 additionally throws EINVAL on `.bat`/`.cmd` spawns without a shell (CVE-2024-27980
  mitigation), so the fix must be `shell: true` or spawning `process.execPath` with the tool's JS entry — not just
  appending `.cmd`.
- `scripts/build-workflow.cjs:90` — `fs.symlinkSync(…, 'dir')` for `node_modules/agentic-hq` → EPERM on Windows without
  Developer Mode/admin. Junctions work unprivileged but change `readlink` output, which breaks the exact-string
  comparison at `:81` and the assertions in `string-reversal-workflow-in-new-workspace…e2e.test.ts:157` and
  `run-workflow-validates-and-executes.integration.test.ts:238`. Since **every `build-first` workflow launch runs
  `pnpm install` + symlink + `tsc`** (via `run-workflow.cjs` → `build-workflow.cjs`), these three bugs are runtime
  blockers, not just build-time ones.
- `scripts/build-release.cjs:167` — draft-dir exclusion compares `path.sep`-joined paths against `/`-joined constants;
  on Windows the filter silently never matches, so **dev-only draft command dirs would ship in a Windows-built release**.
- `scripts/build-release.cjs:251` — `executableFiles` entries built with `path.relative` → backslash paths in a
  Windows-produced manifest, violating the tarball contract the e2e test asserts (`/^\.agentic-hq\/plugins\/.+\.sh$/`).
- `package.json:38-41` — `demo:plugin-direct:*` scripts use `"$PWD"`, which `cmd.exe` doesn't expand.

### C. Workflow runtime (`src/`)
- **`src/workflow/workflow-command/default-workflow-command.ts:26`** — `new DefaultCLICommand('bash', ['-c', commandString])`:
  every workflow execution goes through `bash`, which doesn't exist on native Windows. (Extra footgun: on machines
  with WSL installed, `bash` on PATH resolves to the System32 WSL launcher — spawning it would silently jump into WSL.)
- `src/workflow/claude/claude-workflow-command-builder.ts:46-49` — `shellEscape` uses POSIX single-quote escaping
  (`'\''`), meaningless in `cmd.exe` and wrong in PowerShell.
- `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts:25` — spawns `claude` via node-pty. The winget
  `claude.exe` resolves fine (verified), but an npm-installed claude is a `.cmd` shim that ConPTY can't launch — the
  executable should be resolved to an absolute path (PATHEXT-aware) before `pty.spawn`.
- `claude-command-builder.ts:93,106,143` — absolute paths (marshalling dir, package root, plugin dirs) are interpolated
  **unquoted and space-joined** into argument strings that downstream code re-splits on spaces. Any Windows path with a
  space (`C:\Program Files`, `C:\Users\First Last`, OneDrive dirs) corrupts them. This machine's paths happen to be
  space-free, which is why the marshalling unit tests otherwise pass.
- `src/io/terminal/pty-cli-wrapper.ts` — `SIGTERM` handler (`:137`) never fires on Windows (not a real signal there);
  `ptyProcess.kill()` on the ConPTY backend is a hard terminate, not graceful; `handleFlowControl`/`name: 'xterm-256color'`
  are POSIX concepts ConPTY ignores; and (observed in the smoke test) the conpty connection keeps the process alive
  after child exit unless explicitly killed/disposed.
- `src/workflow-discovery/workspace/workspace-impl.ts:94` — workspace dedup by raw string equality of roots; on Windows
  drive-letter case (`C:\` vs `c:\`) or 8.3 short names can make the same dir compare unequal → AHQ package registered
  twice, every workflow shown DISABLED.

### D. Self-termination / process control (SOLVED — validated live on Windows, macOS and Linux; lands in plan Phase 5)

How it works (validated 2026-08-24 with a temporary live test copy, since reverted — plan Phase 5 re-lands it
production-clean, replacing the *nix-only bash script): the self-termination skill runs a single
cross-platform Node script, `skills/self-termination/scripts/kill-current-cli-process-node.cjs`. It reads the target
PID from **`CLAUDE_PID`** — an officially documented env var (code.claude.com/docs/en/env-vars): Claude Code
≥ v2.1.214 stamps its own PID into every Bash/PowerShell tool and hook subprocess, re-stamped correctly across
resumes and nested sessions — sanity-probes it, then calls `process.kill(pid, 'SIGINT')` on POSIX (byte-identical to
the old `kill -INT`; claude exits 130) or `'SIGTERM'` on win32 (Node maps it to `TerminateProcess`; exit code 1).
The command line is argument-free and identical in every shell, and needs no Git Bash. Claude exiting completes the
claude task the workflow engine is blocked awaiting — control returns to the engine, which reads the marshalled
output and continues with the next workflow step.

Validated live: the **actual skill invocation** (`/agentic-hq-core-plugin:self-termination`) killed a real Windows
session end-to-end; the script alone killed real sessions on macOS and Linux (evidence: the Confluence draft page
and `supporting-files/02-self-termination-real-claude-test-results.md`). Measured Windows kill latency ~0.6 s from
script start to the user's prompt returning.

Alternatives investigated and ditched (full research trail in `supporting-files/01-…` and `02-…`):

- `$PPID` from Git Bash — returns `1` for native parents (MSYS PID namespace).
- Walking the Win32 parent chain for a `claude.exe` ancestor — races on dangling PIDs left by short-lived Git Bash
  shim processes; dead-ended in every logged run.
- MSYS `kill -INT <winpid>` — fails outright; `taskkill` without `/F` — reports SUCCESS and does nothing.
- Graceful console broadcasts (`GenerateConsoleCtrlEvent` Ctrl+C/Ctrl+Break via PowerShell P/Invoke) — passed every
  fake-claude experiment and a Perplexity double-check, but the real `claude.exe` ignores them.
- Targeted `taskkill /PID $CLAUDE_PID /F` via per-OS `.ps1`/`.sh` (and cmd/batch variants) — worked (multiple live
  kills), but superseded: cmd is never one of Claude's tool shells (PowerShell always; Bash only with Git for
  Windows), and the single Node script removes the per-OS pair entirely.

Landing work (plan Phase 5): recreate the script + SKILL.md change production-clean, port the process-control
fixture/test off `bash`/`$PPID`/exit-130-only (`fake-claude-cli.triggers-kill-script.fixture.ts:124`), then delete
the replaced `kill-current-cli-process.sh`.

### E. Shell scripts, exec bits, line endings
- Nine `.sh` files total: the self-termination script (shipped, hot path), four dev git-scripts under
  `src/scripts/git-scripts/` (plus `perform-squash-merge-on-branch.ts`, whose `exec`-based `gh`/`git` strings use
  POSIX quoting that `cmd.exe` mangles), the mcp-atlassian installer, two `steve-test-plugin` scripts (no shebangs at
  all), one docs-only script.
- The whole exec-bit machinery (`publishConfig.executableFiles`, git mode bits, the tarball exec-bit e2e assertions)
  is meaningless on NTFS; Windows checkouts drop the bits entirely.
- **No `.gitattributes`** → with Git for Windows' default `core.autocrlf=true`, all `.sh` files check out with CRLF
  (verified on this machine). This must be fixed for *any* support route, including Git Bash and WSL.

### F. Tests
- `tests/e2e/helpers/cli-test-helper-functions.ts:14` — `LOG_FILE_DIRECTORY = '/tmp'` gates **every e2e test**;
  `TEMP_WORKSPACES_BASE = '/tmp/agentic-hq-test-workspaces'` is hardcoded in 6+ e2e/integration files; two unit-test
  files hardcode `/tmp` (the 5 current failures). The portable pattern already exists in the repo
  (`tmpdir-fixture.ts:9` uses `os.tmpdir()` + `mkdtempSync`) — this is find-and-replace work.
- `npm install -g --prefix` layout differs on Windows (`<prefix>\agentic-hq.cmd` + `<prefix>\node_modules\…`, not
  `lib/node_modules` + `bin/`), breaking the hardcoded paths in the tarball-install helpers.
- Platform-conditional assertions needed: exec bits, `darwin-*` prebuild presence (fails by construction on Windows —
  only `win32-*` installs), symlink/readlink equality, `bash` as expected executable
  (`default-workflow-command.unit.test.ts:34` etc.), exit code 130.
- Timeouts tuned for POSIX spawn speed will be tight under Windows process creation + Defender scanning of
  `node_modules`.

### G. CI and lint coverage
- `.github/workflows/ci.yml:43` — `ubuntu-latest` only; nothing verifies Windows and nothing will catch regressions.
- `eslint.config.mjs:36` ignores `scripts/**` — the build scripts with the worst spawn bugs are unlinted.

### H. Docs
- README ("Windows … likely to break", Linux-toolchain prerequisites), CONTRIBUTING ("Windows is unsupported"),
  troubleshooting (macOS chmod/symlink advice), and the utilities-plugin Jira-extractor agent instructions
  (`jq … > /tmp/…`) all need Windows treatment once support lands.

## 4. What already works (don't break it)

- `path.join` discipline throughout `src/`; no `path.posix`, no `split('/')`, no `':'` PATH-list handling; no
  `process.env.HOME`/`TMPDIR`/`SHELL` reads; temp storage is workspace-relative, not `/tmp`.
- `bin/agentic-hq.cjs:51` and `bin/agentic-hq-prebuilt.cjs:30` already use `url.pathToFileURL` for the dynamic import —
  exactly right on Windows.
- `scripts/run-workflow.cjs` spawns via `process.execPath` — the pattern the other spawns should copy.
- node-pty 1.1.0 ships working `win32-x64`/`win32-arm64` prebuilds + conpty (verified working); no compiler toolchain
  needed on Windows, unlike Linux.
- The marshalling session already strips `:` from timestamps for NTFS-safe dir names; fast-glob usage, tsconfig/vitest/
  eslint globs, and pnpm-workspace patterns are all separator-safe.
- winget's `claude.exe` is directly spawnable — no shim problem for the default Claude install route on Windows.

## 5. What needs doing (work list for planning — not a plan)

Sizes: S = mechanical/localized, M = several files or a contract touch, L = design decision needed.

**Install & build tooling**
1. (S) Replace both postinstalls (`package.json:18`, `build-release.cjs:243`) with a cross-platform Node script that
   no-ops on win32 — unblocks *everything* else on Windows (installs **and** all pnpm scripts), and fixes the npm/npx
   install path in the next release.
2. (S–M) Fix `.cmd`-shim spawns everywhere: `bin/agentic-hq.cjs:26`, `build-release.cjs:77`, `build-workflow.cjs:64,95`,
   `publish-guards.integration.test.ts:55`, unit-fixture `tsx` spawns. Preferred pattern: `process.execPath` + the
   tool's JS entry (as `run-workflow.cjs` already does); `shell: true` where that's impractical.
3. (M) Symlink → junction (or copy) strategy on win32 in `build-workflow.cjs:90` + fix the readlink comparison and the
   two tests asserting readlink equality; verify the `agentic-hq/tools/claude-code` self-import resolves through a
   junction.
4. (S) `build-release.cjs` Windows correctness: forward-slash `executableFiles`, the `path.sep`-vs-`/` draft-dir filter
   bug (ships wrong content from a Windows build today), `prepack` quoting.
5. (S) Replace `$PWD` in the `demo:plugin-direct:*` scripts.

**Workflow runtime**
6. (M) **Replace `bash -c` as the workflow launcher** (`default-workflow-command.ts:26`) — **DECIDED** (plan D1,
   incorporating AHQ-210): delete the command string entirely. SKILL.md shrinks to returning only `skill-base-dir`
   (the one fact Claude contributes); the engine constructs `process.execPath` + `run-workflow.cjs` + args natively
   and spawns shell-free on every platform. Also deletes the POSIX-only `shellEscape` and most of item 8, and
   eliminates the shell-quoting bug class on macOS/Linux too.
7. (M) Resolve the `claude` executable to an absolute, PATHEXT-aware path before `pty.spawn` (winget = `.exe` works
   bare; npm-installed = `.cmd` shim doesn't).
8. (S) Quote the path-bearing arguments (`claude-command-builder.ts:93,106,143`) — spaces in Windows paths corrupt
   them today. Shrinks under the item-6 decision: only the io-directory still crosses the skill hop (quote it, plus
   the `--allowedTools` paths); the skills' split-on-space contract disappears with the command string.
9. (S–M) PTY/signal tuning: skip `SIGTERM` registration on win32, explicit `kill()`/dispose on shutdown (conpty
   keep-alive), review `handleFlowControl`/`name` options, case-insensitive workspace-root comparison on win32
   (`workspace-impl.ts:94`).

**Self-termination**
10. (S — solved, see §3D) Self-termination becomes a single cross-platform Node script keyed on
    `CLAUDE_PID` (validated live on all three OSes via a temporary test copy, since reverted). Plan Phase 5 lands
    it production-clean: recreate script + SKILL.md, port the process-control fixture/integration test off
    `bash`/`$PPID` (exit-code expectation per-platform: 130 POSIX / 1 Windows), then delete the replaced
    `kill-current-cli-process.sh`.

**Tests**
11. (S–M) `/tmp` → `os.tmpdir()`/`mkdtempSync` across the e2e helper, the two unit-test files, and the
    `TEMP_WORKSPACES_BASE` constants (the repo already has the right fixture pattern to copy).
12. (M) Platform-aware assertions and helpers: exec-bit and `darwin-*` prebuild checks, symlink/readlink, `bash`
    executable expectations, exit-code 130, `npm -g --prefix` layout, POSIX shell strings in `execSync` calls,
    timeout headroom.

**Hygiene, CI, docs**
13. (S) Add `.gitattributes` (`*.sh text eol=lf` at minimum) — required for every support route; this checkout is
    already CRLF-contaminated.
14. (M) Add a `windows-latest` CI job (install + typecheck + unit at minimum) so Windows can't silently regress; stop
    ignoring `scripts/**` in eslint.
15. (S–M) Docs: README/CONTRIBUTING Windows sections (winget Claude + nvm-windows path, execution-policy guidance —
    see §6), troubleshooting entries, publish-checklist note that releases must be built on POSIX until item 4 lands.

**Dev-only / optional (doesn't block user-facing Windows support)**
16. The four git-scripts `.sh` files + the `cmd.exe`-unsafe `gh`/`git` exec strings in
    `perform-squash-merge-on-branch.ts`; the mcp-atlassian install `.sh`; the `steve-test-plugin` scripts; the
    utilities-plugin `/tmp`+`jq` agent instructions. Decide per item: port to Node, or mark POSIX-only.

## 6. The PowerShell execution-policy question (from the Confluence page)

The `npm.ps1 cannot be loaded` error is because nvm-windows/corepack install `.ps1` shims and PowerShell's default
policy (`Restricted`) blocks all scripts. Alternatives to `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`:

- **Do nothing repo-side**: none of Agentic HQ's own code needs it once item 2 above is fixed — Node-level spawns
  bypass PowerShell entirely. It only affects what the *human* types interactively.
- Users can type `npm.cmd`/`pnpm.cmd` (the `.cmd` shims exist alongside the `.ps1` ones and are never blocked), or use
  Command Prompt / Git Bash instead of PowerShell.
- `RemoteSigned -Scope CurrentUser` is the setting npm's own docs and most Windows dev guides recommend, and is the
  default on Windows Server — reasonable to document as the smoothest option, with the `.cmd`-suffix workaround listed
  for people who don't want to change policy.

## 7. Native vs Git Bash vs WSL

Asked mid-investigation: if native is a nightmare, how much simpler would it be to insist on Git Bash or WSL?

**Native (recommended): moderate, not a nightmare.** The evidence is the strongest argument: typecheck clean, 97% of
unit tests already pass, ConPTY works, `claude.exe` spawns, and the codebase's path discipline is already good. The
work list above is long but ~80% of it is mechanical and pattern-repetitive; the two design-level items are settled
(6 decided via the plan's D1/AHQ-210 no-command-string design; 10 solved and validated — §3D).
Several of the fixes (no-shell spawning, quoted path args, Node postinstall) also remove latent bug classes on
macOS/Linux.

**Require Git Bash: saves less than it appears.** Git Bash changes *which terminal the user types in* — it does not
change how Node's `child_process`/node-pty resolve executables, how `cmd.exe` runs lifecycle scripts (unless
`script-shell` is reconfigured per-user), or what `/tmp` means to a Node process. Concretely it would rescue only:
item 6 (keep `bash -c`, resolving Git's `bash.exe` explicitly — never bare `bash`, which on WSL-equipped machines
resolves to the System32 WSL launcher) and parts of item 16 (the `.sh` scripts). It does **not** rescue items 1–5,
7–9, 11–15 (all Node-level), and item 10 is already solved without it. And it adds a real
new hazard: MSYS path conversion mangling `C:\…` arguments inside `bash -c` strings. Verdict: a reasonable *fallback
for item 6 only* if the no-shell redesign proves harder than expected — not a strategy that shrinks the project much.

**Require WSL: everything works, but it isn't Windows support.** Inside WSL the product runs as Linux — near-zero code
change (item 13 still needed, docs only otherwise). Cost: users must install WSL, then install Node *and Claude Code*
inside it, keep projects on the WSL filesystem for performance, and live in a Linux environment anyway — a lighter
version of the current "VMware + Ubuntu" recommendation rather than an alternative to it. Worth keeping as the
documented escape hatch (and it becomes *more* attractive after item 13 fixes the CRLF checkout problem, which
currently breaks WSL usage of the repo too).

**Suggested sequencing thought for the planning step** (not a plan): items 1, 2, 11, 13 are small and unblock
install + dev CLI + a green unit suite on Windows; item 14 locks that in; item 6 is the one remaining focused design
piece (item 10 is solved and validated); everything else can trail behind them.

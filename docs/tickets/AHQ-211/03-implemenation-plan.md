# AHQ-211 — Implementation Plan: Add Windows Support

Builds on the research in [02-claude-response.md](02-claude-response.md). Numbers like "(item N)" refer to that
report's work list. Strategy: **native Windows** (PowerShell + nvm-windows, no WSL), per the Jira's first-choice
option, with Git Bash/WSL held as fallbacks for individual items only. This plan **incorporates
[AHQ-210](https://agentic-hq.atlassian.net/browse/AHQ-210)** (SKILL.md simplification) as design decision D1 — it
removes the shell dependency that was the hardest Windows problem, and simplifies every platform as a side effect.

## Goals (acceptance criteria, from the Jira)

On a native Windows 11 machine (winget Claude Code, nvm-windows Node 24, PowerShell):

1. **Repo dev route:** `git clone` → `corepack enable` → `pnpm install` → `pnpm validate` all succeed, and
   `agentic-hq-dev list` + the string-reversal demo work.
2. **npm route:** `npm install -g agentic-hq` succeeds and `agentic-hq list` + string-reversal work from PowerShell.
3. **npx route:** `npx -y agentic-hq list` works without installing.
4. macOS/Linux behaviour unchanged (existing CI stays green throughout).
5. A `windows-latest` CI job protects all of the above from regressing.

## Key design decisions

**D1 — Delete the workflow command string entirely (incorporates AHQ-210).** Post-AHQ-201, every workflow SKILL.md
is byte-identical boilerplate: the engine hands the skill the io-directory, build-mode and package-root, and the
skill echoes them straight back inside a shell command string, which `DefaultWorkflowCommand` then runs via
`bash -c` (`default-workflow-command.ts:26`). The **only** fact Claude actually contributes is `skill-base-dir` —
where the skill is installed (what makes marketplace-installed plugins discoverable). So SKILL.md shrinks to
writing just the skill-base-dir path as the marshalled output value (`{"command-output-string": "{skill-base-dir}"}`
— the key is the universal marshalling contract shared by every command step, so it stays unchanged; only the
workflow-launch *value* changes from a command line to a path), and the engine constructs the launch command itself, natively
as an argv array — `process.execPath` + `scripts/run-workflow.cjs` + flags (deriving `skill-id` via
`path.basename(skillBaseDir)`) + passthrough args — spawned directly on the PTY. No command string ever exists, so
this deletes in one move: the `bash -c` shell dependency (the Windows blocker), the POSIX-only `shellEscape`
(`claude-workflow-command-builder.ts:46-49`), all command-string quoting/parsing, and the bare-`node`-on-PATH
assumption. The Claude hop itself is unchanged (skill discovery + self-termination still work as today). Deliberate
contract narrowing: every workflow launches via `run-workflow.cjs`; a custom launcher would be a framework feature,
not SKILL.md content — post-AHQ-201 that flexibility was already unused.

**D2 — Self-termination: SOLVED — design validated live on Windows, macOS and Linux (2026-08-24); Phase 5 lands
it.** The skill runs a single cross-platform Node script, `scripts/kill-current-cli-process-node.cjs`: PID
from **`CLAUDE_PID`** — officially documented (code.claude.com/docs/en/env-vars; Claude Code ≥ v2.1.214 stamps its
own PID into every Bash/PowerShell tool and hook subprocess) — existence-probed, then `process.kill(pid, 'SIGINT')`
on POSIX (byte-identical to the old `kill -INT`; exit 130) or `'SIGTERM'` → `TerminateProcess` on win32 (exit 1).
Argument-free, shell-agnostic, no PID discovery, no Git Bash dependency. Validated end-to-end: the real skill
invocation killed a live Windows session; the script killed live macOS and Linux sessions. Alternatives tried and
ditched (trail in `supporting-files/`): `$PPID` (=`1` under Git Bash), Win32 parent-chain walking (racy),
MSYS `kill` (fails), soft `taskkill` (silent no-op), `GenerateConsoleCtrlEvent` broadcasts (fakes pass, real
`claude.exe` ignores them), cmd/batch artifacts (cmd is never one of Claude's tool shells), and the per-OS
`.ps1`/`.sh` `taskkill` pair (worked, superseded by the single script).

**D3 — `node_modules/agentic-hq` link: junction on win32.** `build-workflow.cjs:90` uses a dir symlink (EPERM on
Windows without Developer Mode). Use `type: 'junction'` on win32 (unprivileged, absolute target), and replace the
exact-string `readlinkSync` comparison at `:81` with a `fs.realpathSync`-based equality check (junctions readlink as
`\\?\C:\…`). *Fallback:* copy instead of link on win32 (slower, but zero privilege questions).

**D4 — Spawn pattern for `.cmd`-shim tools.** Prefer `process.execPath` + the tool's JS entry
(`node_modules/typescript/bin/tsc`, `tsx/dist/cli.mjs`) — no shell, no shim, identical on all platforms (verified
working on this machine). For pnpm (not in local node_modules): use `process.env.npm_execpath` via `process.execPath`
when set (covers all invocations *from* pnpm scripts), else spawn `pnpm` with `shell: process.platform === 'win32'`
(plain `execFileSync('pnpm')` on POSIX as today). Note: Node ≥20.12 throws EINVAL on `.cmd` spawns without a shell,
so "just append `.cmd`" is not an option.

**D5 — Shrink and quote the skill-hop input contract.** `claude-command-builder.ts:93` space-joins
`<marshallingId> <buildMode> <pkgRoot>` (two absolute paths) into one positional string that skills re-split on
spaces. Under D1 the skill needs only `$0` — the io-directory it writes `command-output.json` into; build-mode and
package-root no longer cross the hop at all. Pass that single value double-quoted (Windows paths contain spaces),
and quote the `Read(${dir})`/`--plugin-dir=${dir}` paths inside `--allowedTools` (`:106,143`). Cross-plugin
contract change — land in the same commit as D1, with the SKILL.md boilerplate and fake-claude fixtures updated
together.

## Phasing

Ordering rationale: Phase 1 unblocks *everything* (installs and all pnpm scripts); Phase 2 gets `pnpm validate` green
on Windows so TDD is possible at all; each later phase has a runnable exit test. Every phase ends with
`pnpm validate` on Windows **and** confirmation that existing Linux CI passes. Per CLAUDE.md: TDD (red-green-refactor)
for every code change; run the failing state first; for each changed file, name the command that executed it.

---

### Phase 1 — Unblock install & pnpm scripts (S)

*(items 1, 4-prepack; report §3A)*

1. New `scripts/postinstall.cjs`: no-op unless `process.platform === 'darwin'`; on darwin, glob the two
   `node-pty/prebuilds/darwin-*/spawn-helper` locations and `fs.chmodSync(0o755)`, swallowing ENOENT only (the
   existing "fails silently on other layouts" semantics, now explicit). Root `package.json` `postinstall` becomes
   `node scripts/postinstall.cjs`.
2. Same replacement in the **generated release manifest** (`build-release.cjs:243`) + ensure `scripts/postinstall.cjs`
   is staged into the release tree. (This is what fixes the npm/npx routes at the next publish.)
3. Rewrite both `prepack` guards (`package.json:20`, `build-release.cjs:230`) as `node scripts/prepack-guard.cjs`
   (avoids `node -e` quoting under cmd entirely).
4. Tests: a unit test for the postinstall script's platform behaviour (mock `process.platform`); the existing
   `test:integration:publish-guards` covers prepack once Phase 3's spawn fix lands — until then verify manually.

**Exit:** `pnpm install` and `pnpm typecheck` succeed on this Windows machine; `pnpm validate` still green on Linux CI.

### Phase 2 — Green `pnpm validate` on Windows (S–M)

*(items 2-partial, 11, 13; report §2, §3F; fixes all 5 current unit failures)*

1. `.gitattributes`: `* text=auto`, `*.sh text eol=lf`, plus explicit `eol=lf` for any other exec-bit-carrying
   scripts. Run `git add --renormalize .` once as a safety check — the repo's stored content should already be LF
   (the CRLF seen on this machine is checkout-time `autocrlf=true` conversion), so expect a no-op. No migration
   concern: there are no existing user checkouts (per Steve, 2026-08-23) — this only has to land before future
   clones. The one CRLF-contaminated working tree is this dev machine's; give it a one-off refresh after the
   commit (`git rm -r --cached . && git reset --hard`, or re-clone). Required for every support route — a CRLF
   `.sh` fails with "bad interpreter" under Git Bash and WSL, not just native Windows.
2. `/tmp` → portable temp in unit tests: `run-cli-and-log-output.unit.test.ts` (also replace the
   `echo '…'; pwd` POSIX shell string with a `process.execPath`-based command so `execSync` has nothing
   shell-specific), `json-file-io-marshaller-session.unit.test.ts` (`os.tmpdir()` + `mkdtempSync`, copying the
   existing `tmpdir-fixture.ts:9` pattern).
3. Unit PTY fixtures: spawn `process.execPath` + `node_modules/tsx/dist/cli.mjs` + fixture path instead of bare
   `tsx` (fixes the two `WindowsPtyAgent: File not found` failures; same change later reused in integration tests).
4. `bin/agentic-hq.cjs:26`: `execFileSync(process.execPath, [path.join(packageRoot,'node_modules','typescript','bin','tsc'), '-p', 'tsconfig.build.json'])`
   (D4). Covered by `test:integration:bin-wrapper`.

**Exit:** `pnpm validate` fully green on Windows (190/190) and on Linux CI. `agentic-hq-dev list` runs (build step
now works; `list` doesn't need workflows to be executable yet).

### Phase 3 — Build pipeline & scripts on Windows (M)

*(items 2-rest, 3, 4, 5; report §3B)*

1. `build-workflow.cjs:64` pnpm spawn per D4; correct the misleading ENOENT message while there.
2. `build-workflow.cjs:90` junction per D3 + realpath-based link-freshness check replacing `:81`; update the two
   readlink-equality tests (`string-reversal-workflow-in-new-workspace…e2e.test.ts:157`,
   `run-workflow-validates-and-executes.integration.test.ts:238`) to realpath comparison; verify the
   `agentic-hq/tools/claude-code` self-import resolves through a junction (add an integration test).
3. `build-workflow.cjs:95` + `build-release.cjs:77` tsc spawns per D4.
4. `build-release.cjs` portability: draft-dir filter compares POSIX-normalized rel paths (fixes the
   silent-wrong-content bug at `:167` — add a regression unit/integration test); `executableFiles` entries emitted
   with forward slashes (`:251`); keep exec-bit logic darwin/linux-only.
5. `package.json` demo scripts: drop `"$PWD"` — `run-workflow.cjs` can default `--ahq-package-root`/`--workflow-dir`
   from `process.cwd()` when omitted, or compute them in a tiny `scripts/run-demo.cjs`.
6. `tests/integration/build/publish-guards.integration.test.ts:55` npm/pnpm spawns per D4.

**Exit:** `pnpm build` completes on Windows; `test:integration:build-determinism` and
`test:integration:publish-guards` pass on Windows (neither spawns Claude); Linux CI green. **Checkpoint with Steve:**
diff a Windows-built `release/` tree against a Linux-built one (should now match modulo exec bits).

### Phase 4 — Workflow runtime native on Windows (M–L)

*(items 6, 7, 8, 9; report §3C; decisions D1, D4, D5)*

1. **D1 (AHQ-210) contract change**, one commit, both sides together:
   - SKILL.md boilerplate (every workflow skill + the create-workflow scaffolder template that stamps new ones)
     shrinks to: set `skill-base-dir` and `command-input-output-files-directory = $0`, write
     `{"command-output-string": "{skill-base-dir}"}`, then self-terminate. The `$1`/`$2` inputs, the command-string
     template, and the "INFO FOR YOU ONLY" relay instructions all go away. Update create-workflow's checks doc
     (`03-run-checks-on-workflow.md`) to the new contract.
   - Engine side: the marshaller is untouched (`command-output-string` stays the universal key — every command
     step inside workflows uses it too); `ClaudeWorkflowCommandBuilder` treats the returned string as the
     skill-base-dir path, derives `skill-id`
     (`path.basename`) and builds the argv array (`process.execPath`, `run-workflow.cjs`, `--ahq-package-root`,
     `--build-mode`, `--workflow-dir`, `--workflow-js`, then passthrough args); `DefaultWorkflowCommand` takes
     `executable + args[]` and spawns via the PTY — `bash` gone, `shellEscape` deleted. Update
     `default-workflow-command.unit.test.ts` / `claude-workflow-command-builder.unit.test.ts` (currently assert
     `'bash'`) and the fake-claude fixtures to the new output JSON.
   - **D5** rides along in the same commit: only the quoted io-directory crosses the hop; quote the
     `--allowedTools` paths.
2. **Claude executable resolution**: small resolver (which-style PATH walk, PATHEXT-aware on win32) producing an
   absolute path before `pty.spawn`. winget/native installs resolve to a real `claude.exe` — spawned directly. If
   the walk finds only npm's `claude.cmd` shim, do NOT run it via cmd.exe — apply D4: locate
   `node_modules/@anthropic-ai/claude-code/` beside the shim, read its package.json `bin` entry, and spawn
   `process.execPath` + that JS entry directly (clear error if the package can't be found: "install via
   winget/native installer"). Result: no shell — bash, cmd or otherwise — anywhere in the launch chain. **The
   `.cmd` branch is legacy-only**: npm installation of Claude Code is deprecated since v2.1.15 (the CLI nags npm
   installs to migrate via `claude install`) — put a comment above this code stating it exists only for **old**
   npm installs and can be deleted once no-one uses npm-installed claude (evidence:
   https://github.com/anthropics/claude-code/releases/tag/v2.1.15 and
   https://vibecodemoonlighter.com/posts/claude-code-npm-to-native-installer).
3. PTY/platform tuning (`pty-cli-wrapper.ts`): register SIGTERM handler only when `process.platform !== 'win32'`;
   always `ptyProcess.kill()`/dispose on normal exit (conpty keep-alive observed on this machine); review
   `handleFlowControl`/`name` options on win32.
4. `workspace-impl.ts:94`: normalize roots (`path.resolve` + casefold on win32) before equality.

**Exit:** `pnpm validate` green both OSes; **Steve runs** `pnpm demo:agentic-hq-cli:string-reversal` (spawns real
Claude — ~20 s) on Windows and on a POSIX machine. This is the "it actually works" gate for route 1.

### Phase 5 — Self-termination cross-platform (S — design VALIDATED live on all 3 OSes, see D2; this phase lands it)

The mechanism was proven by putting a test copy of the script + SKILL.md change live temporarily: it killed real
Claude Code sessions on Windows, macOS and Linux, including via the actual skill invocation on Windows (evidence:
`supporting-files/02`). The test copy — full of test-harness comments and file logging — was then reverted; this
phase re-lands it production-clean in one TDD commit:

1. Port `tests/integration/process-control/` to the new mechanism FIRST (the red): the fake-claude fixture stops
   spawning `bash -c "… $PPID"` and instead runs the skill script via `node` with `CLAUDE_PID=<its own pid>` set in
   the child's env (mimicking Claude Code); the exit-code assertion becomes per-platform (130 POSIX / 1 Windows);
   the `.bin/tsx` spawn is fixed per D4; widen the 30 s timeout for Windows spawn speed.
2. Recreate `skills/self-termination/scripts/kill-current-cli-process-node.cjs` from the validated reference logic
   below (the green) — production comments only: no test-harness header, no log-file side effect (console output
   suffices).
3. SKILL.md: point `kill-current-process-script-path` at the `.cjs` and invoke it as
   `node "{kill-current-process-script-path}"` — explicit `node`, deterministic on every platform (the old form,
   `{path} $PPID`, was shebang-reliant and POSIX-only).
4. Delete the now-dead `kill-current-cli-process.sh` after a Grep-for-references pass (the fixture and older docs
   reference it), and remove it from the `executableFiles` machinery if listed.
5. Clean up the `temp/AHQ-211/` experiment scripts (gitignored).

Validated reference logic (exactly this ran live on Windows, macOS and Linux, 2026-08-24):

```js
const pid = Number(process.env.CLAUDE_PID); // officially documented: Claude Code >= v2.1.214 stamps its own PID
if (!process.env.CLAUDE_PID || !Number.isInteger(pid) || pid <= 1) {
  console.error(`ERROR: CLAUDE_PID not set or invalid ('${process.env.CLAUDE_PID ?? ''}') — Agentic HQ requires Claude Code >= v2.1.214`);
  process.exit(1);
}
try { process.kill(pid, 0); } // existence/permission probe only
catch { console.error(`ERROR: pid ${pid} (via env:CLAUDE_PID) is not running or not accessible`); process.exit(1); }
const signal = process.platform === 'win32' ? 'SIGTERM' : 'SIGINT'; // POSIX: == kill -INT (exit 130); win32: TerminateProcess (exit 1)
process.kill(pid, signal);
```

**Exit:** `test:integration:kill-script` (fake Claude — fast) passes on Windows and Linux CI;
`test:integration:real-claude-self-termination*` run by **Steve** once per OS (informally already proven by the
live kills on all three).

### Phase 6 — Test-suite portability, CI, docs (M)

1. e2e helpers: `LOG_FILE_DIRECTORY`/`TEMP_WORKSPACES_BASE` → `os.tmpdir()`-based; `npm -g --prefix` layout branch
   for win32 (`<prefix>\agentic-hq.cmd`, `<prefix>\node_modules\…`); platform-conditional assertions (exec bits,
   `darwin-*` vs `win32-*` prebuilds, `tar` usage via bsdtar-safe flags); timeout headroom. (Full e2e runs stay a
   **Steve-triggered** validation on each OS — they spawn real Claude.)
2. CI: add `windows-latest` job — `corepack enable`, `pnpm install`, `pnpm validate`, plus the non-Claude
   integration tests (`build-determinism`, `publish-guards`, `bin-wrapper`, `kill-script`). Un-ignore `scripts/**`
   in `eslint.config.mjs:36` and fix fallout.
3. Docs: README OS-support + Windows prerequisites section (winget Claude + auto-update warning, nvm-windows,
   execution-policy guidance per report §6); CONTRIBUTING; troubleshooting entries (junction/Developer Mode,
   Defender slowness, `npm.cmd` workaround); publish-checklist note that releases may be built on either OS once
   Phase 3 lands (or POSIX-only until then).

**Exit:** CI green on ubuntu + windows; docs reviewed by Steve; DRAFT Confluence page can be finalized from the
README section.

### Phase 7 — Deferred / out of scope for AHQ-211 (propose follow-up tickets)

- Dev git-scripts (`src/scripts/git-scripts/**`: four `.sh` + the `cmd.exe`-unsafe `gh`/`git` exec strings in
  `perform-squash-merge-on-branch.ts`) — port to Node or mark POSIX-only. Dev-only; doesn't block user-facing support.
- `scripts/mcp-scripts/install-or-update-sooperset-mcp-atlassian.sh` — PowerShell twin or Node port.
- `steve-test-plugin` shebang-less scripts; utilities-plugin Jira-extractor `/tmp`+`jq` instructions.
- WSL smoke-test + short doc section (nearly free after the `.gitattributes` fix).
- Marketplace-installed workflow validation: D1 deliberately preserves the capability (the skill hop still reports
  where an installed skill lives), but running a workflow from a marketplace-installed plugin has never been tested
  on any platform — needs its own ticket.

## Risks & mitigations

- **D1 touches every workflow SKILL.md, the scaffolder and the fixtures at once**: mitigated by landing it as one
  atomic commit (Phase 4.1) with the string-reversal demo as the immediate end-to-end gate.
- **ConPTY behavioural differences** (interactive keystroke translation, resize, flow control) only surface in real
  interactive runs: mitigate via Steve-run demo gates at Phases 4–6, on real hardware, before publish.
- **Claude Code's own Bash tool on Windows** executes skills' ```bash blocks (e.g. `node run-workflow.cjs …` inside
  the workflow's Claude session) under Git Bash — keep paths in SKILL.md templates double-quoted (backslashes
  survive bash double quotes); verified grammar in Phase 4.2. If a skill needs a genuinely POSIX command, that's a
  skill bug to fix, not a framework one.
- **Git for Windows is NOT installed or bundled by Claude Code** (verified 2026-08-23: the winget package is a lone
  `claude.exe`; docs call Git for Windows "optional but recommended", and without it Claude Code falls back to a
  PowerShell tool instead of the Bash tool). On this machine Claude's Bash tool is
  `C:\Program Files\Git\usr\bin\bash.exe` from the separate `winget install Git.Git`. Decision: make **Git for
  Windows an explicit, documented Agentic HQ prerequisite on Windows** (Phase 6 docs; it's already in Steve's
  install guide, and workflows need `git`/`gh` anyway) rather than supporting Claude's PowerShell-tool mode, which
  would need `.cmd`/`.ps1` twins of every remaining `.sh` (self-termination no longer counts — its Node script is
  shell-agnostic). Document `CLAUDE_CODE_GIT_BASH_PATH` (settings.json `env`) for non-standard Git locations.
- **Publishing from Windows** produces no exec bits in the tarball: keep "publish from POSIX" in the checklist until
  a Windows-publish story is wanted (Phase 3 checkpoint decides).
- **Node 22 vs 24 on Windows**: CI matrix uses the same Node versions as the ubuntu job to keep the support claim
  honest.

## Estimate of shape (not a schedule)

Phases 1–2 are small and immediately unblock daily Windows dev. Phase 3 is mechanical but touches the release
contract (checkpoint). Phase 4 is the largest single piece (the D1/AHQ-210 contract change + the claude resolver).
Phase 5 is small (the design is validated; it re-lands the script + SKILL.md alongside the ported tests). Phase 6 is breadth, not depth.
Delivery shape (decided 2026-08-25): **one branch (`feature/ahq-211-add-windows-support`), one PR**, with phases as
commit boundaries — each phase's commits keep both OSes green, in the order above (no phase depends on a later one).

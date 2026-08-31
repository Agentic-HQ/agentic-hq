# AHQ-211 — Implementation Plan: Add Windows Support

Builds on the research in [02-claude-response.md](02-claude-response.md). Numbers like "(item N)" refer to that
report's work list. Strategy: **native Windows** (PowerShell + nvm-windows, no WSL), per the Jira's first-choice
option. Normal-user prerequisites on Windows are the same as Mac/Linux: **Node and Claude Code only** — Git is NOT
required (Git + `gh` are dev-only prerequisites, in `docs/dev/setting-up-agentic-hq-for-development.md`), and no
shell of any kind — bash, cmd or otherwise — remains in the workflow launch chain. Incorporates
[AHQ-210](https://agentic-hq.atlassian.net/browse/AHQ-210) (SKILL.md simplification) as design decision D1 — it
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

**D1 — Delete the workflow command string entirely (incorporates AHQ-210).** Today the engine hands the workflow
skill the io-directory, build-mode and package-root, and the byte-identical SKILL.md boilerplate echoes them back
inside a shell command string, which `DefaultWorkflowCommand` runs via `bash -c`
(`default-workflow-command.ts:26`). The only fact Claude actually contributes is `skill-base-dir` — where the
skill is installed (what makes marketplace-installed plugins discoverable). Change: SKILL.md writes
`{"skill-base-dir": "{skill-base-dir}"}` — a semantically named key for the launch handshake, deliberately NOT
command steps' `command-output-string` (that contract is untouched; the marshaller gains `readSkillOutput()` for
the launch handshake, and the existing `readOutput()` is renamed `readCommandOutput()` for symmetry — both read
the shared `command-output.json` transport file), and the engine builds the launch
command natively as an argv array — `process.execPath` + `scripts/run-workflow.cjs` + flags (`skill-id` =
`path.basename(skillBaseDir)`) + passthrough args — spawned directly on the PTY. No command string ever exists,
which deletes: the `bash -c` dependency (the Windows blocker), the POSIX-only `shellEscape`
(`claude-workflow-command-builder.ts:46-49`), all command-string quoting/parsing, and the bare-`node`-on-PATH
assumption. The Claude hop itself is unchanged (skill discovery + self-termination as today). Deliberate contract
narrowing: every workflow launches via `run-workflow.cjs`; a custom launcher would be a framework feature, not
SKILL.md content. Format decision: the value is the **bare path** — no `skill-base-dir:` prefix or other
delimited mini-format (delimiters like `:`/`,` occur inside Windows paths; invented string grammars are the bug
class this ticket deletes). The engine sanity-checks the returned value instead (path exists + contains
`ts-workflow/` — stronger than any prefix, clear error naming the skill). If the hop ever needs more values, add
more named JSON keys beside `skill-base-dir` — never a mini-format inside a string. Evolution rule:
`skill-base-dir` stays required with frozen meaning; all future keys are optional with engine defaults — so older
workflows (only the one key) and newer engines coexist with no version negotiation.

**D2 — Self-termination: SOLVED — design validated live on Windows, macOS and Linux (2026-08-24); Phase 5 lands
it.** The skill runs a single cross-platform Node script, `scripts/kill-current-cli-process-node.cjs`: PID
from **`CLAUDE_PID`** — officially documented (code.claude.com/docs/en/env-vars; Claude Code ≥ v2.1.214 stamps its
own PID into every Bash/PowerShell tool and hook subprocess) — existence-probed, then `process.kill(pid, 'SIGINT')`
on POSIX (identical to the old `kill -INT`; exit 130) or `'SIGTERM'` → `TerminateProcess` on win32 (exit 1).
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
   (avoids `node -e` quoting under cmd entirely). The guard also refuses to pack on
   `process.platform === 'win32'` — fail fast instead of shipping an exec-bit-less tarball (see "Publishing:
   from Mac now, from CI soon").
4. Tests: a unit test for the postinstall script's platform behaviour (mock `process.platform`); the existing
   `test:integration:publish-guards` covers prepack once Phase 3's spawn fix lands — until then verify manually.

**Exit:** `pnpm install` and `pnpm typecheck` succeed on this Windows machine; `pnpm validate` still green on Linux CI.

### Phase 2 — Green `pnpm validate` on Windows (S–M)

*(items 2-partial, 11, 13; report §2, §3F; fixes all 5 current unit failures)*

1. `.gitattributes`: `* text=auto`, `*.sh text eol=lf`, plus explicit `eol=lf` for any other exec-bit-carrying
   scripts. Run `git add --renormalize .` once as a check — stored content is already LF (the CRLF on this machine
   is checkout-time `autocrlf=true` conversion), so expect a no-op; then refresh this machine's working tree
   (`git rm -r --cached . && git reset --hard`, or re-clone). No other checkouts exist to migrate. Required for
   every support route — a CRLF `.sh` fails with "bad interpreter" under Git Bash and WSL too.
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
     `{"skill-base-dir": "{skill-base-dir}"}`, then self-terminate. The `$1`/`$2` inputs, the command-string
     template, and the old verbatim-relay instructions all go away — but each SKILL.md RETAINS an
     "INFO FOR YOU ONLY (Don't tell user)" section explaining what the skill does and why, rewritten for the new
     contract along these lines:

     > INFO FOR YOU ONLY (Don't tell user): This skill exists so the Agentic HQ engine can discover where this
     > workflow skill is installed. You report `{skill-base-dir}` — the one fact only you know — and the engine
     > itself constructs and runs the command for this workflow's linked TypeScript program (in
     > `{skill-base-dir}/ts-workflow/`). This is what will make workflows in marketplace-installed plugins
     > discoverable and runnable: wherever a plugin gets installed, you tell the engine where it landed.
     > (Marketplace-installed plugin support is not yet completed/tested.)

     Update create-workflow's checks doc (`03-run-checks-on-workflow.md`) to the new contract.
   - Engine side: command steps' `command-output-string` contract is untouched; the marshaller gains
     `readSkillOutput()` (returns the typed handshake, currently `{ skillBaseDir }`, fail-fast if the key is
     missing) and the existing `readOutput()` is renamed `readCommandOutput()` (mechanical, TS-checked; both still
     read `command-output.json`). Which read runs is decided statically by the caller, via two typed exits on
     `MarshalledCLITool` sharing one private orchestration:

     ```typescript
     async execute(command: string, input: string): Promise<string> {
       const session = await this.runSession(command, input);
       return session.readCommandOutput();          // command steps — unchanged behaviour
     }

     async executeSkillLaunch(skillPath: string): Promise<SkillOutput> {   // { skillBaseDir: string }
       const session = await this.runSession(skillPath, UNUSED_INPUT_STRING);
       return session.readSkillOutput();            // workflow-launch hop only
     }

     private async runSession(command: string, input: string): Promise<IOMarshallerSession> {
       const session = this.sessionFactory.create();
       session.write(input);
       await this.runMarshalledIOCLICommand(command, session);
       return session;
     }
     ```

     `ClaudeWorkflowCommandBuilder` — the only code that runs a workflow SKILL.md — is the sole
     `executeSkillLaunch()` caller (`const { skillBaseDir } = await tool.executeSkillLaunch(skillPath)`); every
     command-step caller keeps `execute()`. Wrong method = wrong return type = compile error, plus the runtime
     fail-fast. (Refactor option, only if it earns it: promote `executeSkillLaunch` to a separate
     `WorkflowLaunchTool` minted by the ToolFactory.) The builder then validates the path (exists +
     contains `ts-workflow/`, else fail fast naming the skill), derives `skill-id`
     (`path.basename`), and builds the argv array (`process.execPath`, `run-workflow.cjs`, `--ahq-package-root`,
     `--build-mode`, `--workflow-dir`, `--workflow-js`, then passthrough args); `DefaultWorkflowCommand` takes
     `executable + args[]` and spawns via the PTY — `bash` gone, `shellEscape` deleted. Update
     `default-workflow-command.unit.test.ts` / `claude-workflow-command-builder.unit.test.ts` (currently assert
     `'bash'`) and the fake-claude fixtures to the new output JSON.
   - **D5** rides along in the same commit: only the quoted io-directory crosses the hop; quote the
     `--allowedTools` paths.
2. **Claude executable resolution**: which-style PATH walk, PATHEXT-aware on win32, producing an absolute path
   before `pty.spawn`. winget/native installs resolve to a real `claude.exe` — spawn directly. If only npm's
   `claude.cmd` shim is found, don't run it via cmd.exe — apply D4: locate `node_modules/@anthropic-ai/claude-code/`
   beside the shim, read its package.json `bin` entry, and spawn `process.execPath` + that JS entry directly (clear
   error if the package can't be found: "install via winget/native installer"). **Legacy-only branch**: npm
   installation of Claude Code is deprecated since v2.1.15 — put a comment above this code stating it exists only
   for **old** npm installs and can be deleted once no-one uses npm-installed claude (evidence:
   https://github.com/anthropics/claude-code/releases/tag/v2.1.15 and
   https://vibecodemoonlighter.com/posts/claude-code-npm-to-native-installer).
3. PTY/platform tuning (`pty-cli-wrapper.ts`): register SIGTERM handler only when `process.platform !== 'win32'`;
   always `ptyProcess.kill()`/dispose on normal exit (conpty keep-alive observed on this machine); review
   `handleFlowControl`/`name` options on win32.
4. `workspace-impl.ts:94`: normalize roots (`path.resolve` + casefold on win32) before equality.

**Exit (RESEQUENCED 2026-08-27):** `pnpm validate` green both OSes; **Steve runs**
`pnpm demo:agentic-hq-cli:string-reversal` (spawns real Claude) on Windows and on a POSIX machine — the
"it actually works" gate for route 1. The demo half is **deferred into the Phase 5 gate**: every spawned session
ends by self-terminating, and on Windows the old `.sh` kill script cannot work (under Git Bash `$PPID` sees
MSYS's fake process tree — the CLI parent shows as PID 1), so the demo can only complete cleanly once Phase 5's
node kill script lands. The 2026-08-27 Windows attempt proved everything up to that link end-to-end — resolver →
absolute `claude.exe` → PTY → D1 handshake → engine-built argv → runner → workflow executed and printed the
reversed string, exit 0 — with two extra findings: (a) the demo script itself had rotted since AHQ-106 (it still
passed the removed `--workflow-command-supplier` flag) — fixed to `node bin/agentic-hq.cjs reversal`; (b)
node-pty prints a harmless-but-ugly ConPTY `AttachConsole failed` stderr trace when the AHQ-211 kill-on-exit
pokes an already-exited pty → added as a Phase 5 item.

### Phase 5 — Self-termination cross-platform (S — design validated live on all 3 OSes, see D2)

Land the validated design production-clean in one TDD commit (evidence, including the actual skill invocation
killing a live Windows session: `supporting-files/02`):

1. Port `tests/integration/process-control/` to the new mechanism FIRST (the red): the fake-claude fixture stops
   spawning `bash -c "… $PPID"` and instead runs the skill script via `node` with `CLAUDE_PID=<its own pid>` set in
   the child's env (mimicking Claude Code); the exit-code assertion becomes per-platform (130 POSIX / 1 Windows);
   the `.bin/tsx` spawn is fixed per D4; widen the 30 s timeout for Windows spawn speed.
2. Create `skills/self-termination/scripts/kill-current-cli-process-node.cjs` from the validated reference logic
   below (the green) — production comments only, **writes NO files, ever** (console output suffices, like the
   `.sh` it replaces). Hard requirement, proven by incident: a D2 TEST copy of this script, temporarily placed
   in this very scripts dir, appended a `__dirname`-relative log that later shipped in the Windows-built
   release tree (caught by the Phase 3 checkpoint — the only diff in an otherwise byte-identical cross-OS
   build).
3. SKILL.md: point `kill-current-process-script-path` at the `.cjs` and invoke it as
   `node "{kill-current-process-script-path}"` (explicit `node` — deterministic on every platform; no shebang
   reliance).
4. Delete the now-dead `kill-current-cli-process.sh` after a Grep-for-references pass (the fixture and older docs
   reference it), and remove it from the `executableFiles` machinery if listed.
5. Clean up the `temp/AHQ-211/` experiment scripts (gitignored).
6. Quiet the node-pty ConPTY `AttachConsole failed` stderr noise: the AHQ-211 kill-on-exit in
   `pty-cli-wrapper.ts` kills a pty whose child has already exited, and node-pty's
   `conpty_console_list_agent` helper then crashes noisily (observed at the end of the otherwise-clean
   2026-08-27 Windows demo attempt; exit code unaffected). Find a disposal that keeps the ConPTY
   keep-alive fix without the noise.

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
live kills on all three); **plus the deferred Phase 4 gate: `pnpm demo:agentic-hq-cli:string-reversal` on
Windows AND a POSIX machine, and `pnpm validate` green on both.**

### Phase 6 — Test-suite portability, CI, docs (M)

1. e2e helpers: `LOG_FILE_DIRECTORY`/`TEMP_WORKSPACES_BASE` → `os.tmpdir()`-based; `npm -g --prefix` layout branch
   for win32 (`<prefix>\agentic-hq.cmd`, `<prefix>\node_modules\…`); platform-conditional assertions (exec bits,
   `darwin-*` vs `win32-*` prebuilds, `tar` usage via bsdtar-safe flags); timeout headroom. (Full e2e runs stay a
   **Steve-triggered** validation — they spawn real Claude.)
   **DONE 2026-08-29, with one plan change (Steve-approved via side conversation):** the two tarball-packing
   e2e suites (`prebuilt-tarball…`, `user-workspace…`) are **skipped on win32 by policy** instead of ported —
   their setup packs the release tree, which the prepack guard refuses on Windows (publish-from-Mac), so
   porting them was Windows-packaging work we'll never use. The win32 `npm -g --prefix` layout branch and
   win32 prebuild assertions were therefore NOT shipped (layout verified empirically and recorded in
   04-implementation-details.md); the tarball-install helper instead fails fast on win32. Everything else in
   this item landed: `os.tmpdir()` everywhere (the old `/tmp` literals silently created `C:\tmp` on Windows),
   `.cmd`-aware PATH preconditions, `tar` flags verified already bsdtar-safe (no change needed), timeout
   headroom (600→900 s on build/pack/install paths), plus two Phase-5-staleness fixes to the tarball test's
   `executableFiles`/shipped-`.sh` assertions that would fail on the next MAC run. Details + verification
   evidence in the Phase 6 section of 04-implementation-details.md.
   **Validation slimmed (Steve, 2026-08-29 — token budget):** the porting work is verified with unit tests
   and non-Claude checks only; Steve runs JUST `test:e2e:agentic-hq-cli-string-reversal` on Windows this
   phase (~2 short spawned sessions, same cost as the demo, and it exercises the edited helper paths). The
   Jira/math/prebuilt-tarball e2e tests spawn several real-Claude sessions each (and Jira creates real
   issues) but add only platform-independent layers (MCP/HTTP) on top of the Windows-proven chain — moved
   to the DEFERRED full-suite run in the checklist below.
2. CI: add `windows-latest` job — `corepack enable`, `pnpm install`, `pnpm validate`, plus the non-Claude
   integration tests (`build-determinism`, `publish-guards`, `bin-wrapper`, `kill-script`). Un-ignore `scripts/**`
   in `eslint.config.mjs:36` and fix fallout.
   **DONE 2026-08-29 (Windows session).** `validate-windows` job added mirroring the ubuntu job's
   contributor steps (same `.nvmrc` Node — no matrix on either job) + the four suites as separate
   steps (pwsh only propagates the last exit code of a multi-line run block); un-ignore landed with a
   new `**/*.cjs` config block (`@eslint/js` recommended + node globals — without a block the
   un-ignore was a zero-rule no-op) covering all 8 `.cjs` files; fallout: none (verified live via
   print-config + a failing canary, not just the clean run). Every CI step run locally on Windows:
   validate 241+3, the four suites all pass, `npm link` + `agentic-hq-dev list` green. CI first
   actually runs the job when the PR opens (triggers are push-to-main + PR only). Evidence in
   04-implementation-details.md Phase 6 Item 2.
   **2b. DISCOVERED during item 2 (2026-08-29, Steve-confirmed direction): restore the dead AHQ-152
   frozen-lockfile guard.** The AHQ-136 pnpm 10→11 upgrade (2026-05-16) silently killed
   `frozen-lockfile=true` in every `.npmrc`: pnpm 11 reads ONLY auth/registry settings from `.npmrc`
   (v11 migration guide), all other settings moved to `pnpm-workspace.yaml` in camelCase. Proven
   empirically under the corepack-pinned 11.1.2 with repo-verbatim config files: install with no
   lockfile SUCCEEDS today (guard dead); with `frozenLockfile: true` in `pnpm-workspace.yaml` it
   hard-refuses with `ERR_PNPM_NO_LOCKFILE` (guard restored). CI was never exposed (pnpm forces
   frozen-lockfile on when `CI=true`). The npm warning Steve remembered (`npm warn Unknown project
   config "frozen-lockfile"…`) is npm's, printed on every `npm link`, and disappears with the fix.
   Fix (own commit, after the item 2 commit): add `frozenLockfile: true` to `pnpm-workspace.yaml` and
   DELETE `.npmrc` (nothing else in it) — ×9: repo root + the 7 shipped ts-workflow dirs + the e2e
   fixture ts-workflow (each already has its own `pnpm-workspace.yaml`; `build-release.cjs` only
   strips `.npmrc` at staging — verify the strip tolerates absence). Touch up `build-workflow.cjs`
   comments ("its own .npmrc makes it frozen") and the create-workflow scaffold's `.npmrc` in
   `agentic-hq-core-plugin` (skill template + command doc) so NEW workflows get the workspace-yaml
   form. Verify (non-Claude): rename `pnpm-lock.yaml` → `pnpm install` must refuse → restore; then
   `pnpm validate` + `test:integration:build-determinism` + `test:integration:publish-guards`.
   Dev-docs mentions of `.npmrc` fold into the item 3 docs pass.
   **2b DONE 2026-08-29 (same session).** `frozenLockfile: true` + explanatory comment (Steve-mandated:
   why THIS pnpm-only file and never `.npmrc`) in all 9 `pnpm-workspace.yaml`s; all 9 `.npmrc`s deleted;
   `.npmrc` kept in both strip lists defensively (pre-fix user workflows); `build-workflow.cjs`/
   `build-release.cjs` comments + both create-workflow scaffold docs updated (4e drops `.npmrc`,
   workspace yaml now copied verbatim). Verified by REFUSAL, root AND math-workflow dir:
   `ERR_PNPM_OUTDATED_LOCKFILE` on a spec mismatch (the actual AHQ-152 threat), reverted clean. NB the
   planned rename-lockfile probe was a WEAK test — with node_modules intact pnpm's "Already up to date"
   short-circuit exits 0 before any lockfile logic (scratch-characterised; a real install path refuses:
   "Headless installation requires a pnpm-lock.yaml"). npm's Unknown-project-config warning: gone.
   `pnpm validate` 241+3; build-determinism + publish-guards green under the new config. Evidence in
   04-implementation-details.md Phase 6 Item 2b.
3. Docs: README OS-support + Windows Quick Start (prerequisites: Node + Claude Code only — winget Claude +
   auto-update warning, nvm-windows, execution-policy guidance per report §6; state explicitly that Git is NOT
   required for normal use — Git + `gh` stay dev-only in `docs/dev/setting-up-agentic-hq-for-development.md`);
   CONTRIBUTING; troubleshooting entries (junction/Developer Mode, Defender slowness, `npm.cmd` workaround;
   **nvm-windows version switch silently wipes global installs** (Steve-raised 2026-08-29: each Node
   version keeps its own globals under its own prefix, so switching Node drops `npm install -g agentic-hq`
   for users AND `npm link` for devs — symptom `'agentic-hq-dev' is not recognized`; fix = re-run the
   install/link after any version switch. NB nvm-windows never switches by itself — no auto-upgrade
   exists; the item-2 missing-shim incident turned out to be a link that had never been run, NOT a wipe —
   see 04 Item 2. The warning stands on nvm-windows's documented per-version-globals behaviour. Warn in
   THREE places: the README Windows install/Quick Start section, the Windows troubleshooting entries, and
   the dev-setup doc's Windows contributor path alongside the "`pnpm install` is not one-off" note);
   from the Phase 3 junction review — see supporting-files/03-perplexity…symbolic-links.md: workspace must be
   on a local NTFS volume, junctions fail on UNC/network paths and FAT32/exFAT; OneDrive/Dropbox-synced
   folders can throw transient EPERM/EBUSY around junctions);
   publish-checklist: publish from Mac until CI publishing lands — never from Windows (the prepack guard
   enforces this).
   **Dev-docs accuracy pass** — check every `docs/dev/` doc against the 04-implementation-details log for
   Phases 1–5 (the Windows work changed structure, not just behaviour), specifically:
   - `how-agentic-hq-works.md`: framework link is a symlink ONLY on POSIX — junction on Windows, realpath
     freshness check (~7 "symlink" mentions, incl. the Workflow Build diagrams at ~:42/:226/:415); Phase 4's
     D1 rewrites the skill-hop contract this doc centres on (`SKILL.md` runner-command template + `$1`
     verbatim relay at ~:38/:110/:256-273 → the `skill-base-dir` handshake with the engine building the
     argv, no shell); D4 spawn pattern (`node <tool JS entry>`, no `.bin` shims); Phase 5 self-termination
     mechanism if it appears by then.
   - `ci-configuration.md`: currently describes the single ubuntu job end-to-end — add the `windows-latest`
     job from item 2 (what runs there and why, the setup-step table, hardening, "Reproducing CI Locally" on
     Windows/PowerShell).
   - `setting-up-agentic-hq-for-development.md`: add the Windows contributor path (nvm-windows,
     corepack/pnpm, PowerShell execution policy, repo on a local NTFS volume, no WSL needed; note Git + `gh`
     ARE required for dev — the opposite of the end-user story) alongside the existing POSIX path.
     ALSO (Steve-raised via the Mac Gate-5 session, 2026-08-29): a "`pnpm install` is not one-off" note
     right after the install step — re-run after any pull/branch switch that changed `pnpm-lock.yaml`
     (`.npmrc` already pins frozen-lockfile, so the plain command is safe). Suggested wording in
     `supporting-files/files-created-by-mac-claude-while-testing/mac-gate-5-results-and-phase-6-doc-suggestion.md`.
   - `npm-commands.md` + `publish-checklist.md`: verify-only sweep (demo scripts now use relative dirs
     resolved by the runner; both prepack guards are Node scripts since Phase 1) — expected already accurate.
   **DONE 2026-08-29 (Windows session) — pending Steve's docs review (the item's gate).** All four
   parts landed: README (Windows supported + Windows-notes subsection; installer-neutral wording after
   Steve's mid-session switch away from recommending winget — the planned "winget auto-update warning"
   was DROPPED, no substance existed for it and the recommendation changed; PowerShell twin for the
   `/tmp` example), troubleshooting (6 new/rewritten Windows entries incl. both nvm-windows-wipe
   variants and `CLAUDE_CODE_GIT_BASH_PATH`), CONTRIBUTING, dev docs (setup doc Windows path + the Mac
   session's "`pnpm install` is not one-off" note; ci-configuration Windows-job section incl.
   why-no-Set-ExecutionPolicy — windows-latest is Windows Server = RemoteSigned default;
   publish-checklist publish-from-Mac rule + an INVERTED-stale `executableFiles` §3 check that would
   have failed the next publish; glossary file-set fix). `how-agentic-hq-works.md` was already
   accurate from Phases 3–5 upkeep except session-end — added the Phase 5 self-termination block.
   Shipped-docs shell-neutrality audit clean except the Phase-7-deferred utilities Jira extractor;
   quoted the create-workflow check command's path args. Evidence in 04-implementation-details.md
   Phase 6 Item 3.
4. **Git-free validation**: on a Windows environment with no Git installed (e.g. Windows Sandbox or a clean VM),
   install Claude Code + Node only and run `agentic-hq list` + the string-reversal demo. This proves the
   normal-user story AND Claude's PowerShell-tool mode (without Git Bash, Claude has no Bash tool) — currently
   untested end-to-end, since this dev machine has Git Bash.
   **RESEQUENCED to post-publish 2026-08-30 (Steve's decision):** no clean machine available (dev box is
   Windows 11 Home — no Windows Sandbox) — the dev machine itself will be wiped and revalidated AFTER
   merge + publish, against the REAL registry package. Full instructions in
   [Post-publish validation on the dev machine](#post-publish-validation-on-the-dev-machine-phase-6-item-4-resequenced-2026-08-30) below.

**Exit:** CI green on ubuntu + windows; docs reviewed by Steve; DRAFT Confluence page can be finalized from the
README section. (Item 4 exits post-publish — see the resequencing note above.)

### Phase 7 — Deferred / out of scope for AHQ-211 (propose follow-up tickets)

- Dev git-scripts (`src/scripts/git-scripts/**`) — **DOWNGRADED 2026-08-31 (Steve's evidence):** no port needed.
  The `.sh` scripts run under Claude's Bash tool, which exists on Windows via Git Bash — included in the standard
  Git for Windows install the contributor docs already require — and Steve has run `/git:03` on Windows many
  times successfully (the earlier "`cmd.exe`-unsafe exec strings" concern was static analysis; empirically the
  exercised paths work). All that remained was one doc line — DONE 2026-08-31: Windows prerequisites in
  `setting-up-agentic-hq-for-development.md` now say to use the standard Git for Windows installer because
  the git skills need Git Bash (minimal installs like MinGit omit it). No follow-up ticket.
- `scripts/mcp-scripts/install-or-update-sooperset-mcp-atlassian.sh` — PowerShell twin or Node port.
- `steve-test-plugin` shebang-less scripts; utilities-plugin Jira-extractor `/tmp`+`jq` instructions.
  **NO TICKET for either of the above two bullets — decision 2026-08-31 (Steve):** the Jira/Confluence
  workflows, the Sooperset MCP setup, and steve-test-plugin are documented as macOS/Linux-only for now
  (Sooperset tested on Mac only; not often used). Docs updated same day; Windows support on demand via
  GitHub issue.
- WSL smoke-test + short doc section (nearly free after the `.gitattributes` fix). **NO TICKET — decision
  2026-08-31 (Steve):** the README already documents WSL honestly ("untested — tell us on Discord"), and
  native Windows support shrinks WSL's audience; bug/report-driven.
- Marketplace-installed workflow validation: D1 deliberately preserves the capability (the skill hop still reports
  where an installed skill lives), but running a workflow from a marketplace-installed plugin has never been tested
  on any platform. **NO TICKET — decision 2026-08-31 (Steve):** the SKILL.md already documents exactly this
  (probably won't work), and that caveat is where it stays; revisit only if there is user demand.
- `--allowedTools`/`--plugin-dir` values containing spaces (from Phase 4's D5 narrowing): the CLI docs are silent
  on quote-stripping inside these flags and the PTY spawn passes raw argv, so embedded quotes were NOT shipped —
  they would plausibly break the permission allowlist / plugin loading on every platform. The docs-blessed
  space-safe form (one rule per argv element) carries a positional-swallowing risk that needs a real-Claude probe
  before adopting. Until then, paths with spaces in those flags remain a pre-existing, unchanged limitation.
  **PROBED 2026-08-31 (Windows, real Claude) — PASS for the user-workspace case.** New e2e
  `tests/e2e/demo/user-workspace-on-path-with-spaces-string-reversal.e2e.test.ts`
  (`pnpm test:e2e:user-workspace-path-with-spaces`; Windows-runnable — no tarball) puts the fixture plugin in a
  workspace named `test ws with spaces <uuid>`: `--plugin-dir=<spaced path>` (on BOTH Claude spawns — skill hop
  and workflow step), spaced CWD, spaced marshalling-ID positional, and the in-workspace Workflow Build (pnpm
  install + framework junction + tsc) all worked — 2/2 passed in 116s. **Still unprobed = the narrowed ticket:**
  the AHQ *install root* containing spaces, which lands as `Read(<root>\.agentic-hq)` inside the
  SPACE-SEPARATED `--allowedTools` string (plus a `--plugin-dir` per shipped plugin). Realistic on Windows: a
  user profile with a space (`C:\Users\John Smith`) + the standard npm prefix `%APPDATA%\npm`. Probe = install
  the package under a spaced path and run the same test (it's the reusable harness); also run it once on Mac.
  One-time precondition discovered: the e2e temp base `<os.tmpdir()>\agentic-hq-test-workspaces` must be
  trusted in Claude Code once per machine (nobody can answer the trust prompt under the PTY) — done on the
  Windows dev box 2026-08-31.
  **NO TICKET for the remaining corner — decision 2026-08-31 (Steve):** bug-driven, not probe-driven. The
  recommended install route (nvm-windows 1.2.x → `C:\nvm4w`) has a space-free install root regardless of
  username, and the common spaced-username exposure (the user's own project paths) is the case the probe
  PASSED. The uncovered combo (spaced install root: npx cache / MSI `%APPDATA%\npm` prefix under a spaced
  profile, or an old `C:\Program Files\nodejs` symlink) is unlikely; predicted failure mode if it ever hits =
  the `Read(<root>\.agentic-hq)` rule splits inside the space-separated `--allowedTools` → workflow hangs at
  a permission prompt. This paragraph is the diagnosis; the new e2e is the harness; AHQ-102 (bundle resources
  with skills, delete the Read rule) dissolves it entirely.

### Publish from the Mac (post-merge) — Claude does the driving

Run this on the Mac AFTER `/git:03` lands the squash-merge. Open a Claude Code session in the Mac repo
clone and hand it this section — every step is Claude-runnable, with you approving as usual.

1. 🤖 Sync: `git checkout main && git pull` — confirm HEAD is the AHQ-211 squash-merge commit and the
   working tree is clean.
2. 🤖 OPTIONAL (recommended) — the deferred Mac e2e staleness run (see the DEFERRED bullet in the To Do
   list). Full version: `pnpm test:e2e` (slow; the quick-jira suite needs the Sooperset MCP and creates
   real test issues — expected; run `export ANTHROPIC_MODEL=sonnet` first to cut token burn). Minimum
   version if time/usage is short: `pnpm test:e2e:prebuilt-tarball-math-workflow` and
   `pnpm test:e2e:user-workspace-workflows` — the two tarball-packing suites that CANNOT run on Windows
   (skipped by policy) and haven't run anywhere in months (Phase 6 already fixed two known-stale
   assertions in the first). A failure here is a staleness finding to judge, not automatically a publish
   blocker.
3. 🤖 Follow [`docs/dev/publish-checklist.md`](../../dev/publish-checklist.md) top to bottom — Claude
   walks §1–§3 (preconditions incl. "you are on the Mac", build & pack, tarball-manifest inspection —
   note §3 expects `executableFiles` to be exactly `[]`), you run §4 (`npm publish`), then Claude runs
   §5's registry verification matrix — now proving the REAL registry package carries Windows support.
4. Move to the Windows dev machine for the next section.

### Post-publish validation on the dev machine (Phase 6 item 4, resequenced 2026-08-30)

**Why resequenced:** the gate needs pristine client-Windows defaults, and the only candidates were Windows
Sandbox (unavailable — the dev machine is Windows 11 Home), a VM (extra setup), or the dev machine itself.
Decision (Steve, 2026-08-30): wipe and revalidate the dev machine — but only AFTER merge + publish, because
(a) the cleanup removes Git/Node/Claude, which would kill the dev tooling and the working session mid-ticket,
and (b) done post-publish, Round 1 installs the REAL published `agentic-hq` package from the npm registry,
exactly as an end user would — stronger evidence than a tarball stand-in. Accepted risk: item 4's unique
coverage (no-Git PowerShell-tool mode + Restricted-policy defaults) lands after merge; everything else
Windows-related is already covered by CI plus the Phase 5/6 gates. This also folds in the still-pending
"switch Claude Code to Anthropic's native PowerShell installer" test. Run BOTH rounds after publish and
BEFORE announcing Windows support.

**Who does what:** 🤖 = drive it with Claude; 🧑 = you at the keyboard. The 🧑 steps are unavoidable —
during the cleans Claude Code is literally uninstalled, and the follow-the-docs parts are 🧑 even after
Claude comes back mid-round, because the thing under test is the docs' new-user experience: type the
steps yourself, exactly as written.

#### Round 1 — clean, then follow the README Quick Start as a brand-new user

Goal: the published-package normal-user story on pristine defaults — **no Git** (Claude Code gets no Bash
tool → PowerShell tool mode), **Restricted** execution policy, no Node, no caches.

0. 🤖 **Pre-wipe prep — do this WITH Claude before uninstalling it:** confirm the branch is merged and
   the Mac publish is done; confirm nothing on this machine is unpushed (`git status` in the repo);
   have Claude print this section's clean list and the README Quick Start URL somewhere you can see
   them from a phone/second screen once Claude is gone.

Clean 🧑 (Claude Code goes first, so the rest is you; prefer RENAMING config dirs over deleting —
keeps this reversible):

1. **Claude Code** — uninstall via Settings → Apps (or `winget uninstall` if it was winget-installed; if the
   native installer was ever used, also check `%USERPROFILE%\.local\bin\claude*`). Then rename
   `%USERPROFILE%\.claude` → `.claude.backup` and `%USERPROFILE%\.claude.json` → `.claude.json.backup`
   (sessions/memory/settings — restorable at the end).
2. **nvm-windows + all Node/npm state** — uninstall "NVM for Windows" via Settings → Apps, then remove
   leftovers: `%APPDATA%\nvm`, `C:\nvm4w` (this also takes the global npm packages and the old
   `agentic-hq-dev` link with it), `%APPDATA%\npm` if present, and the npm cache `%LocalAppData%\npm-cache`.
3. **Git for Windows and `gh`** — uninstall both via Settings → Apps. If the `CLAUDE_CODE_GIT_BASH_PATH`
   user env var exists, remove it.
4. **Execution policy back to factory default** — `Set-ExecutionPolicy Undefined -Scope CurrentUser`, then
   confirm `Get-ExecutionPolicy -List` shows Undefined in every scope (effective policy on client Windows
   is then Restricted — the true out-of-box state).
5. **PATH sweep** — in the env-vars dialog, remove any stale user-PATH entries the uninstalls left behind
   (nvm, npm, Git).
6. Reboot; open a fresh PowerShell window; sanity-check `node`, `npm`, `git`, `claude` all report
   "not recognized".

Validate 🧑 — follow the README Quick Start **exactly as written, top to bottom**, as a new user would
(Claude Code comes back at the prerequisites step, but keep typing the steps yourself — the docs UX is
what's under test):
prerequisites (Claude Code via the native PowerShell installer linked from the quickstart), step 1 Windows
bullet (nvm-windows → `nvm install 24` → `nvm use 24`), step 2 **only if the symptom appears** — RECORD
whether `npm.ps1 cannot be loaded` actually shows up before applying the fix (on true defaults it should;
this is the whole point of the symptom-conditioned wording), step 3 `npm install -g
--allow-scripts=agentic-hq,node-pty agentic-hq` (the real registry package) + `agentic-hq list`, step 4 the
string-reversal demo from a fresh folder (trust prompt → Yes).

Record 🤖 — Claude Code is installed again by now: open a session, dictate your observations for each
step (was the doc sufficient as written? did anything undocumented bite — SmartScreen, Defender delays,
nvm quirks, unexpected prompts? did the reversal output appear?) and have Claude write them up and
draft doc fixes for anything that bit.

#### Round 2 — clean again, then follow the Windows contributor setup

Goal: prove `docs/dev/setting-up-agentic-hq-for-development.md`'s Windows path end-to-end. Bonus: finishing
this round IS rebuilding the dev machine — the end state is a working dev setup again.

1. 🧑 Clean again per Round 1 steps 1–6, with two differences: skip the `.claude` renames (the backups from
   Round 1 already exist — just delete the fresh ones Round 1's run created), and note that Git/`gh` get
   REINSTALLED this round as part of the contributor prerequisites.
2. 🧑 Follow the contributor setup doc **top to bottom** as a new Windows contributor: prerequisites
   (including Git + `gh` — the opposite of Round 1), a FRESH clone to a new path (don't reuse the old
   working copy — it still exists untouched as a safety net), `corepack enable`, `pnpm install`,
   `npm link`, `agentic-hq-dev list`, `pnpm validate`, and the step-8 smoke workflow if desired.
3. 🤖 Record doc gaps the same way as Round 1 — a Claude session in the fresh clone writes up the
   observations and drafts any doc fixes (which also smoke-tests Claude Code + Git Bash in the rebuilt
   dev setup).
4. 🤖 Wrap-up — Claude can script the reversible parts, you approve: restore `%USERPROFILE%\.claude.backup`
   / `.claude.json.backup` if the old sessions/memory are wanted (or keep the fresh config and delete the
   backups once nothing is missed); retire the old working copy whenever convenient.

## Risks & mitigations

- **D1 touches every workflow SKILL.md, the scaffolder and the fixtures at once**: mitigated by landing it as one
  atomic commit (Phase 4.1) with the string-reversal demo as the immediate end-to-end gate.
- **ConPTY behavioural differences** (interactive keystroke translation, resize, flow control) only surface in real
  interactive runs: mitigate via Steve-run demo gates at Phases 4–6, on real hardware, before publish.
- **Skills must not assume Claude's Bash tool exists.** Claude Code treats Git for Windows as optional (neither
  installs nor bundles it); with it, Claude runs ```bash blocks under Git Bash — without it, Claude has only a
  PowerShell tool. Since Git is not a user prerequisite, shipped skill/command docs must work in both modes:
  prefer shell-neutral instructions (`node …`, MCP tools, Claude's Write tool), keep paths double-quoted
  (backslashes survive bash double quotes). Audit shipped docs in Phase 6; the Git-free validation (Phase 6.4) is
  the proof. A workflow that genuinely needs `git`/`gh`/POSIX commands (e.g. the TDD demos) declares that as its
  own requirement — not a framework prerequisite. Document `CLAUDE_CODE_GIT_BASH_PATH` (settings.json `env`) in
  troubleshooting for non-standard Git locations.
- **Publishing from Windows** produces no exec bits in the tarball: never supported — publish from Mac now, from
  CI soon (see "Publishing: from Mac now, from CI soon" below).
- **Node 22 vs 24 on Windows**: CI matrix uses the same Node versions as the ubuntu job to keep the support claim
  honest.

## Publishing: from Mac now, from CI soon — never from Windows

Publishing packs the release tree into the npm tarball, which records each file's exec bit. NTFS has no exec
bits, so a tarball packed on Windows ships without them and Mac/Linux consumers get non-executable files. (The
reverse direction — Mac-packed, Windows-installed — is safe: bits present, NTFS harmlessly ignores them.)

The plan: keep publishing from the Mac for now, then move the whole release process into CI (a GitHub Actions
ubuntu job packing and publishing on tag/release — the standard practice; releases shouldn't come from anyone's
laptop). Once that lands, the publishing machine's OS is fixed and this question disappears. Windows publishing
is never supported; the Phase 1 prepack guard enforces it by refusing to pack on
`process.platform === 'win32'` — fail fast instead of shipping a broken tarball.

## Estimate of shape (not a schedule)

Phases 1–2 are small and immediately unblock daily Windows dev. Phase 3 is mechanical but touches the release
contract (checkpoint). Phase 4 is the largest single piece (the D1/AHQ-210 contract change + the claude resolver).
Phase 5 is small (the design is validated; it lands the script + SKILL.md alongside the ported tests). Phase 6 is
breadth, not depth. Delivery shape: **one branch (`feature/ahq-211-add-windows-support`), one PR**, with phases as
commit boundaries — each phase's commits keep both OSes green, in the order above (no phase depends on a later one).

## Approval

**APPROVED by Steve, 2026-08-26** — plan is final; execution may begin. Any material deviation discovered during
implementation gets raised back to Steve, not silently absorbed.

## To Do List (tick off as we go)

💾 = good context-compaction point (start the next chunk fresh from this plan file).
🧑‍💻 = manual step for Steve (real Claude / real hardware — the AI cannot run these).
**Rule: always commit (`/git:02`) BEFORE every 💾 — never compact with uncommitted work in the tree.**
**The agent drives**: the executing agent guides Steve through this list step by step — it announces each next
step, hands Steve the exact commands/instructions for 🧑‍💻 gates, and prompts him for `/git:02` and 💾 at the
right moments. Steve should never have to work out what comes next.
**Implementation log**: at the end of every phase — BEFORE that phase's commit/💾 — the agent appends that
phase's section to `04-implementation-details.md` (what was done, files touched, decisions/deviations, test
evidence), so each phase commit carries its own log entry.

- [x] 💾 **Commit this plan (`/git:02`), then compact before starting** — this plan file is the handoff; the
      executing session re-reads it (and report sections it cites) rather than relying on conversation history.
- [x] **Phase 1** — postinstall/prepack as Node scripts (incl. win32 pack refusal) → commit.
      Exit: `pnpm install` + `pnpm typecheck` succeed on Windows; Linux CI green.
      *(Done 2026-08-26 — see 04-implementation-details.md. NB: ci.yml triggers only on push/PR to main, so
      "Linux CI green" per phase needs a draft PR for this branch — Steve's call when to open it.)*
- [x] **Phase 2** — `.gitattributes` + unit-test/fixture portability → commit.
      Exit: `pnpm validate` fully green on both OSes (190/190).
      *(Done 2026-08-26 — see 04-implementation-details.md. Suite is 204 tests since Phase 1, all green
      on Windows. Deviation: `.gitattributes` line 1 is `* text=auto eol=lf`, not `* text=auto` — under
      autocrlf=true `text=auto` alone still checks out CRLF and format:check could never pass.
      format:check goes green at the 🧑‍💻 refresh below.)*
- [x] 🧑‍💻 One-off working-tree refresh on this machine after the `.gitattributes` commit
      (`git rm -r --cached . && git reset --hard` — Steve runs or explicitly approves).
      *(Done 2026-08-26, run by Steve. Working tree now all-LF; `pnpm validate` fully green on Windows
      afterwards — typecheck ✓ lint ✓ format ✓ 204/204 ✓.)*
- [x] 💾 Compact — Phases 1–2 detail no longer needed in context. *(Done 2026-08-26.)*
- [x] **Phase 3** — build pipeline: junction (D3), pnpm/tsc spawns (D4), build-release portability → commit.
      *(Done 2026-08-26 — see 04-implementation-details.md. `pnpm build` completes on Windows;
      build-determinism 1/1 + publish-guards green on Windows (2 POSIX-only tests skip there);
      `pnpm validate` fully green, 209/209. Deviations flagged: demo scripts fixed via relative dirs +
      `path.resolve` in the runner (options stay required); `npm_execpath` used only when it is pnpm's;
      unplanned hashTree POSIX-key fix. Checkpoint artifact committed:
      phase-3-checkpoint-windows-release-hashes.txt.)*
- [x] 🧑‍💻 **Phase 3 checkpoint**: diff a Windows-built `release/` tree against a Linux-built one.
      *(Done 2026-08-27 via Steve's Mac (POSIX stand-in): 339/340 files byte-identical, zero content
      mismatches. The one extra Windows file was an untracked debug log left by a D2 TEST copy of the
      self-termination script once placed in the skill's scripts dir — deleted, rebuilt, checkpoint hash
      file regenerated (339 lines, exact match). Root cause closed at source: Phase 5 item 2 now hard-
      requires the production script to write no files, ever. No staging-filter follow-up — Steve's call.)*
- [x] 💾 Compact — recommended before the largest phase. *(Done — plus a second mid-Phase-4 compact.)*
- [x] **Phase 4** — D1/AHQ-210 contract change + D5 (one atomic commit), claude resolver, PTY tuning,
      workspace-root normalization → commits.
      *(Done 2026-08-27 in two commits — part 1: D1+D5 skill-hop handshake, shell fully removed from the TS
      launch chain (98a9a95); part 2: claude executable resolver (D4 — PATHEXT-aware which-walk, legacy
      npm-shim branch, lazy/injected at build() time), PTY tuning (SIGTERM handler POSIX-only, explicit
      pty kill on exit for the ConPTY keep-alive), isAhqPackage root normalization (resolve + win32
      casefold). D5 narrowed on evidence: only the io-dir is quoted; allowedTools/plugin-dir quoting
      deliberately skipped → real-Claude probe raised as a Phase 7 follow-up bullet. Windows `pnpm
      validate` + build/runner/bin integration green; the both-OS validate + demo ride the gate below.)*
- [x] 🧑‍💻 **Phase 4 gate** — RESEQUENCED into the Phase 5 gate (2026-08-27): the demo's spawned sessions end
      in self-termination, which on Windows needs Phase 5's node kill script — the old `.sh` sees $PPID = 1
      under Git Bash. The Windows attempt proved the whole Phase 4 chain end-to-end regardless (resolver →
      absolute claude.exe → PTY → handshake → engine argv → runner → reversed string printed, exit 0), and
      caught two things: the demo script had used the AHQ-106-removed `--workflow-command-supplier` flag
      since then (fixed to `node bin/agentic-hq.cjs reversal`), and the kill-on-exit ConPTY stderr noise
      (now Phase 5 item 6).
- [x] **Phase 5** — self-termination: ported tests first (red), script + SKILL.md (green), delete old `.sh`,
      clean `temp/AHQ-211/`, quiet the ConPTY kill-on-exit noise → commit.
      *(Done 2026-08-28, all 6 items TDD. Kill-script integration test green on Windows (fixture killed
      via CLAUDE_PID + SIGTERM, exit 1); ConPTY noise fixed by disposing agent internals instead of
      kill()'s console-list fork on an exited pty. Deleting the `.sh` left ZERO shell scripts in the
      shipped tree → `executableFiles` enumerates to [] — machinery/guards kept, noted as a Phase 7
      simplification candidate. Validate 241+3; integration build/runner/bin/process-control 18+2.)*
- [x] 🧑‍💻 **Phase 5 gate**: real-claude self-termination run once per OS (kills that session — expected),
      PLUS the deferred Phase 4 demo gate — `pnpm demo:agentic-hq-cli:string-reversal` on Windows AND a
      POSIX machine (spawns real Claude, ~20 s each) — and `pnpm validate` green on both OSes.
      *(PASS on both OSes 2026-08-29. Mac: all three checks — evidence file linked from the gate note at
      the end of the Phase 5 section in 04-implementation-details.md. Windows: demo PASS — BOTH spawned
      real-Claude sessions self-terminated via the node kill script, reversed string returned, clean
      exit, and NO ConPTY AttachConsole noise (item 6 verified in production) — AND
      `test:integration:real-claude-self-termination-skill` PASS (1 passed, 24.2 s); Windows validate
      241+3 (Phase 5 section).)*
- [ ] 💾 Compact — before the breadth work.
- [x] **Phase 6** — e2e helper portability, `windows-latest` CI job, README/CONTRIBUTING/troubleshooting docs →
      commits. *(Items 1–3 all DONE 2026-08-29; first real `validate-windows` CI run went green same day —
      run 33264887964, triggered via a temporary draft PR (#5, since closed), all 15 steps executed: 43 unit
      test files + all four integration suites passed, npm-link policy NOTE echoed as designed.)*
- [x] 🧑‍💻 **Phase 6 gates** (slimmed 2026-08-29 — token budget): `test:e2e:agentic-hq-cli-string-reversal`
      on Windows only (full suite → deferred task below) *(PASS 2026-08-29: 1 passed in 63s, real Claude
      session, incl. fresh frozen ts-workflow install)*; docs review *(PASS 2026-08-29 — Steve's review
      edits landed in commit c916e02)*; **Git-free validation** RESEQUENCED to post-publish 2026-08-30
      (no clean machine available — dev box is Win11 Home, no Sandbox): moved to its own bullet below,
      full instructions in the "Post-publish validation on the dev machine" section above.
- [ ] 🧑‍💻 **DEFERRED: full e2e suite on Windows** (`pnpm test:e2e`) — after Steve's usage reset (or before,
      if there's spare capacity to soak up), and **with the spawned sessions temporarily on Sonnet** to cut
      token burn: set `$env:ANTHROPIC_MODEL = 'sonnet'` in the PowerShell session running the tests (the
      wrapper passes its env through to every spawned Claude; scoped to that shell, auto-reverts on close).
      Doubles as a staleness check — these tests haven't been run in months on ANY OS, so this is also
      "do they still pass at all", not just "do they pass on Windows". Jira e2e creates real test issues —
      expected. Note (2026-08-29): the two tarball-packing suites will show as SKIPPED on Windows by policy
      (their setup packs the release tree, refused on win32 — see Phase 6 item 1); their staleness check
      therefore needs a MAC `pnpm test:e2e` (or at least the prebuilt-tarball test, which Phase 6 already
      fixed two known-stale assertions in) — fold that into the next Mac e2e/pre-publish run. Not a merge
      blocker: PR/merge can proceed on the slimmed Phase 6 gate.
- [x] **Phase 7** — CLOSED WITH ZERO TICKETS (2026-08-31, all Steve-decided). Every candidate was either
      resolved in-branch, documented as a platform limitation, or made bug-driven: WSL smoke test (no
      ticket — README already says "untested, tell us", audience shrunk by native support);
      executableFiles remove-or-bless (no ticket — the docs pass already blessed it: publish checklist
      asserts exactly `[]`, how-agentic-hq-works records the `.sh`→`.cjs` history);
      git-scripts port (downgraded — doc line DONE, see Phase 7 section);
      marketplace-installed workflow validation (no ticket — SKILL.md caveat stands, revisit on demand);
      space-path probe (user-workspace case PASSED via the new e2e; the spaced-install-root corner is
      bug-driven — see the D5 bullet's NO TICKET decision); POSIX-isms cleanup (NO TICKET — decision
      2026-08-31: Jira/Confluence workflows + the Sooperset MCP setup are documented as macOS/Linux-only
      for now — README catalogue bullet + Windows notes, overview-of-workflows both Jira entries,
      setting-up-jira-mcp-server top note, troubleshooting Jira entry — and steve-test-plugin marked
      macOS/Linux-only in the catalogue; fix on demand via GitHub issue).
- [ ] PR review → squash-merge to main (`/git:03`); then publish from the Mac — follow the
      "Publish from the Mac (post-merge)" section above (Claude-driven; optional e2e staleness run folded
      in as its step 2) — delivering the npm/npx routes.
- [ ] 🧑‍💻 **POST-PUBLISH: item 4 validation on the dev machine** (resequenced 2026-08-30) — Round 1:
      wipe (Claude/Node/nvm/Git/gh, policy to default) then README Quick Start as a brand-new user against
      the real registry package (proves no-Git PowerShell-tool mode + Restricted-policy story); Round 2:
      wipe again, then the Windows contributor setup doc end-to-end (endpoint = dev machine rebuilt). Both
      BEFORE announcing Windows support. Full instructions: "Post-publish validation on the dev machine"
      section above.

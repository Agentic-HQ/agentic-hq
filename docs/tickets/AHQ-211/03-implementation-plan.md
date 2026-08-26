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

**Exit:** `pnpm validate` green both OSes; **Steve runs** `pnpm demo:agentic-hq-cli:string-reversal` (spawns real
Claude — ~20 s) on Windows and on a POSIX machine. This is the "it actually works" gate for route 1.

### Phase 5 — Self-termination cross-platform (S — design validated live on all 3 OSes, see D2)

Land the validated design production-clean in one TDD commit (evidence, including the actual skill invocation
killing a live Windows session: `supporting-files/02`):

1. Port `tests/integration/process-control/` to the new mechanism FIRST (the red): the fake-claude fixture stops
   spawning `bash -c "… $PPID"` and instead runs the skill script via `node` with `CLAUDE_PID=<its own pid>` set in
   the child's env (mimicking Claude Code); the exit-code assertion becomes per-platform (130 POSIX / 1 Windows);
   the `.bin/tsx` spawn is fixed per D4; widen the 30 s timeout for Windows spawn speed.
2. Create `skills/self-termination/scripts/kill-current-cli-process-node.cjs` from the validated reference logic
   below (the green) — production comments only, no log-file side effect (console output suffices).
3. SKILL.md: point `kill-current-process-script-path` at the `.cjs` and invoke it as
   `node "{kill-current-process-script-path}"` (explicit `node` — deterministic on every platform; no shebang
   reliance).
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
3. Docs: README OS-support + Windows Quick Start (prerequisites: Node + Claude Code only — winget Claude +
   auto-update warning, nvm-windows, execution-policy guidance per report §6; state explicitly that Git is NOT
   required for normal use — Git + `gh` stay dev-only in `docs/dev/setting-up-agentic-hq-for-development.md`);
   CONTRIBUTING; troubleshooting entries (junction/Developer Mode, Defender slowness, `npm.cmd` workaround);
   publish-checklist: publish from Mac until CI publishing lands — never from Windows (the prepack guard
   enforces this).
4. **Git-free validation**: on a Windows environment with no Git installed (e.g. Windows Sandbox or a clean VM),
   install Claude Code + Node only and run `agentic-hq list` + the string-reversal demo. This proves the
   normal-user story AND Claude's PowerShell-tool mode (without Git Bash, Claude has no Bash tool) — currently
   untested end-to-end, since this dev machine has Git Bash.

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
- [ ] 🧑‍💻 One-off working-tree refresh on this machine after the `.gitattributes` commit
      (`git rm -r --cached . && git reset --hard` — Steve runs or explicitly approves).
- [ ] 💾 Compact — Phases 1–2 detail no longer needed in context.
- [ ] **Phase 3** — build pipeline: junction (D3), pnpm/tsc spawns (D4), build-release portability → commit.
- [ ] 🧑‍💻 **Phase 3 checkpoint**: diff a Windows-built `release/` tree against a Linux-built one.
- [ ] 💾 Compact — recommended before the largest phase.
- [ ] **Phase 4** — D1/AHQ-210 contract change + D5 (one atomic commit), claude resolver, PTY tuning,
      workspace-root normalization → commits.
- [ ] 🧑‍💻 **Phase 4 gate**: `pnpm demo:agentic-hq-cli:string-reversal` on Windows AND a POSIX machine
      (spawns real Claude, ~20 s each).
- [ ] **Phase 5** — self-termination: ported tests first (red), script + SKILL.md (green), delete old `.sh`,
      clean `temp/AHQ-211/` → commit.
- [ ] 🧑‍💻 **Phase 5 gate**: real-claude self-termination run once per OS (kills that session — expected).
- [ ] 💾 Compact — before the breadth work.
- [ ] **Phase 6** — e2e helper portability, `windows-latest` CI job, README/CONTRIBUTING/troubleshooting docs →
      commits.
- [ ] 🧑‍💻 **Phase 6 gates**: e2e runs per OS; **Git-free validation** (Windows Sandbox / clean VM with only
      Claude + Node: `agentic-hq list` + string-reversal); docs review.
- [ ] **Phase 7** — raise follow-up tickets (git-scripts port, mcp-installer script, marketplace-installed
      workflow validation, WSL smoke test).
- [ ] PR review → squash-merge to main (`/git:03`); next publish (from Mac) delivers the npm/npx routes.

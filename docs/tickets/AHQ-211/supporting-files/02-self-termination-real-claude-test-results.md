# AHQ-211 — Self-termination on Windows: results against the REAL `claude.exe`

Date: 2026-08-23. Machine: Steve's Windows 11 box (winget Claude Code 2.1.240, Git Bash from Git for Windows,
nvm-windows Node 24). Tests were run **from inside live Claude Code sessions** (a separate session from the one
doing the AHQ-211 research), invoked through Claude's Bash tool exactly as the production self-termination skill
would be. Scripts and logs live in `temp/AHQ-211/` (gitignored).

## FINAL OUTCOME (2026-08-24) — solved and validated; lands via AHQ-211 plan Phase 5

The investigation below concluded, after consolidation, in a **single cross-platform Node script**:
`.agentic-hq/plugins/agentic-hq-core-plugin/skills/self-termination/scripts/kill-current-cli-process-node.cjs`.
A test copy of the script + SKILL.md change was put live temporarily to validate it, then reverted (its header and
logging were test-harness content, not production content). Plan Phase 5 re-lands it production-clean alongside the
ported tests; the plan records the validated core logic verbatim. Key facts:

- **PID source: `CLAUDE_PID` only** — officially documented (code.claude.com/docs/en/env-vars): Claude Code
  ≥ v2.1.214 stamps its own PID into every Bash/PowerShell tool and hook subprocess. Argument-free, identical
  command line in every shell, no Git Bash dependency, no PID discovery.
- **Kill:** `process.kill(pid, 'SIGINT')` on POSIX (identical to the old `kill -INT`; exit 130); `'SIGTERM'` →
  `TerminateProcess` on win32 (exit 1).
- **Validated live:** the V2 script killed real Claude Code sessions on macOS, Linux and Windows; the **actual
  skill invocation** (`/agentic-hq-core-plugin:self-termination`) killed a Windows session end-to-end.
- Everything below is the research trail: the "plan C targeted taskkill" and per-OS `.ps1`/`.sh` designs WORKED but
  are **superseded** by the Node script; the broadcast (`GenerateConsoleCtrlEvent`) designs FAILED against the real
  `claude.exe` despite passing every fake-claude experiment.

Exact content as validated: the script was byte-identical to `temp/AHQ-211/kill-current-cli-process-node-V2.cjs`
(verified by `diff` before the live test; the plan's Phase 5 quotes its core logic verbatim), and the SKILL.md as
validated read (note: bare-path invocation — the `node "{…}"` prefix is a post-validation Phase 5 improvement,
not yet live-tested):

```markdown
## Variables
Set:
skill-base-dir = the skill base directory you were provided with when you ran this skill.
kill-current-process-script-path = {skill-base-dir}/scripts/kill-current-cli-process-node.cjs

## Self-Terminate
Run this command immediately which should terminate Claude Code and return control to the Agentic HQ wrapper script:

{kill-current-process-script-path}
```

## Verdict

| Plan | Mechanism | Fake-claude experiments (node-pty/ConPTY) | Real `claude.exe` | Decision |
|---|---|---|---|---|
| A | Broadcast `GenerateConsoleCtrlEvent(CTRL_C_EVENT, 0)` via PowerShell P/Invoke | PASS — handler fires, exit 130, engine untouched | **FAIL** (reported: claude ignores it; console disrupted) | rejected |
| B | Broadcast `CTRL_BREAK_EVENT` | PASS — delivered as SIGBREAK, exit 131 | **FAIL** (reported, as A) | rejected |
| C | Targeted `taskkill /PID "$CLAUDE_PID" /F` | (equivalent `taskkill /F` run: exit 1, engine untouched) | **PASS** — `VERDICT: PASS`, session died in ~1 s | **adopted** |

**Plan C is the Windows mechanism.** It is also the simplest of the three: one `taskkill` line, no PowerShell, no
P/Invoke, no PID discovery, no broadcast, no collateral.

## The two discoveries that decided it

### 1. Claude Code exports `CLAUDE_PID` into every tool's environment

Every command Claude runs (Bash tool) sees, among others:

```
CLAUDE_PID=16548                  # the live claude.exe for THIS session
CLAUDE_CODE_EXECPATH=C:\...\claude.exe
CLAUDE_CODE_SESSION_ID=...
CLAUDECODE=1
```

Verified in **two** separate sessions (the test session saw `CLAUDE_PID=16548`; the research session sees
`CLAUDE_PID=15416`; in both, `Get-Process -Id $CLAUDE_PID` is a live `claude` process). This removes the whole
"how do we find the parent PID on Windows" problem — the answer is handed to us. (At the time we believed this was
an undocumented implementation detail; it was later found to be officially documented — see Final Outcome — which
retired the engine-written-PID-file fallback mentioned below.)

### 2. Walking the Windows parent chain for a `claude.exe` ancestor is a race — don't

Git Bash spawns short-lived shim `bash.exe` processes that exit almost immediately, leaving a dangling
`ParentProcessId`. A `Get-CimInstance Win32_Process` walk then hits a dead PID and dead-ends before reaching
`claude.exe`. This happened in **every** logged run against the real binary (three times), e.g.:

```
23:29:13.565 HELPER: ancestor[0] pid=25688 name=powershell.exe
23:29:13.684 HELPER: ancestor[1] pid=27212 name=bash.exe
23:29:13.829 HELPER: ancestor[2] pid=30288 name=bash.exe
23:29:13.956 HELPER: no claude.exe ancestor found -- refusing to act
```

(The earlier fake-claude experiment in the research session happened to see a complete chain — lucky timing, not a
reliable one.) Combined with `$PPID` being `1` under Git Bash for native parents, there is no robust *discovery*
route; `CLAUDE_PID` (or an engine-provided PID) is the only sound source.

## Timeline and evidence

All from `temp/AHQ-211/*.log` (times local, 2026-08-23):

| Time | What | Outcome |
|---|---|---|
| 23:22:03 | Plan A diagnostic script (`temp-test-self-terminate-on-windows.sh`, Ctrl+C) | Log ends after `ancestor[2]` — walk dead-ended; no broadcast recorded as sent by this script |
| 23:25:02 | Same script, `break` argument (plan B) | Same — walk dead-ended, log ends after `ancestor[2]` |
| 23:29:13 | Plan C script, dry run, ancestor walk only | Walk dead-ended; refused to act (correct safety behaviour) |
| 23:30:39 | Plan C dry run, `-ClaudePid` from `$CLAUDE_PID` | `resolved target claude.exe pid=16548 … confirmed alive` — correct PID, nothing killed |
| 23:31:16 | Plan C **kill** mode | Helper launched a detached watcher; session ended |
| 23:31:18 | Watcher | `taskkill /PID 16548 /F` → `SUCCESS: The process with PID 16548 has been terminated.` |
| 23:31:20 | Watcher | `VERDICT: PASS -- claude.exe (pid 16548) was terminated by targeted taskkill /PID /F.` |

The terminal transcript confirms the user was back at the PowerShell prompt immediately after the kill and the
shell was healthy (`echo hello` → `hello`).

### Evidence note on plans A/B (honesty about what the logs show)

The plan A/B diagnostic helper refused to broadcast unless it found a `claude.exe` ancestor — and the walk never
found one, so **the two logged runs never sent a console event**. The conclusion that the real `claude.exe`
*ignores* broadcast Ctrl+C/Ctrl+Break and that the broadcast "trashes the console" comes from the test session's
own observations while iterating, and is not captured in a log here. It is consistent with Claude Code handling
interactive Ctrl+C itself (cancel current input / "press again to exit" rather than terminating) and with the
manual test's console being shared with the user's shell. It was not re-run with `CLAUDE_PID`-based targeting
because plan C had already succeeded and is preferable regardless (simpler, no broadcast semantics to reason
about). If a graceful exit is ever wanted again, that re-test is the starting point.

## How the test worked (the other session's design)

- `temp-test-targeted-taskkill-on-windows.sh` — entry point run by Claude's Bash tool. Dry-run by default; `kill`
  argument fires for real. Passes `$CLAUDE_PID` to the helper.
- `temp-test-targeted-taskkill-on-windows.ps1` — resolves the target (param → `$env:CLAUDE_PID` → last-resort
  ancestor walk), sanity-checks it is a live `claude` process (refuses otherwise), then in kill mode launches a
  **detached** watcher (`Start-Process … -WindowStyle Hidden`) so something outlives the dying session.
- `temp-test-targeted-taskkill-watcher.ps1` — waits 800 ms (lets Claude return the tool output), confirms the target
  is alive, runs `taskkill /PID <pid> /F` (deliberately no `/T` — proves killing the one PID suffices), waits 2 s,
  writes `VERDICT: PASS/FAIL` to `targeted-taskkill-test-result.log`.

The detached watcher exists only so the *test* can record a verdict after its own session dies. Production needs
none of it — the workflow engine observes the exit directly.

## What production looked like at plan time (SUPERSEDED — see Final Outcome above; kept as trail)

Windows branch at the top of `kill-current-cli-process.sh` (with Git for Windows installed — optional for Claude
Code itself, which otherwise falls back to a PowerShell tool, but a documented Agentic HQ prerequisite — Claude's
Bash tool runs Git Bash, so the `.sh` stays the single entry point and `SKILL.md` is unchanged):

```bash
if [[ "$(uname -s)" == MINGW* || "$(uname -s)" == MSYS* ]]; then
  CLI_PID="${CLAUDE_PID:-}"                                  # primary: exported by Claude Code
  if [ -z "$CLI_PID" ] && [ -f "${AHQ_CLI_PID_FILE:-}" ]; then
    CLI_PID="$(cat "$AHQ_CLI_PID_FILE")"                     # fallback: written by the workflow engine
  fi
  [ -n "$CLI_PID" ] || { echo "ERROR: cannot determine CLI pid (CLAUDE_PID unset, no AHQ_CLI_PID_FILE)"; exit 1; }
  MSYS_NO_PATHCONV=1 taskkill.exe /PID "$CLI_PID" /F         # path-conversion off so /PID is not mangled (or use //PID)
  exit $?
fi
# POSIX branch below: unchanged ($PPID + kill -INT)
```

Consequences:
- The PTY child exits with code **1** on Windows (TerminateProcess) versus 130 on POSIX. The engine never inspects
  it; the integration test's assertion becomes per-platform.
- Hard kill skips Claude's own session cleanup. Acceptable: self-termination runs after the workflow output is
  already marshalled to disk. Watch for stale-state side effects during Phase 5 testing.
- Tests have no real Claude, so the fake-claude fixture must export `CLAUDE_PID=<its own pid>` to the bash it
  spawns (mimicking Claude Code) — or rely on the engine-written PID file.
- `ptyProcess.pid` was verified equal to the ConPTY child's real PID in the research session, so the engine-written
  PID-file fallback is deterministic.
- POSIX stays untouched. `$CLAUDE_PID` very likely exists on macOS/Linux too and could later replace `$PPID` for a
  single cross-platform branch — verify on a Mac (`echo $CLAUDE_PID` from Claude's Bash tool) before touching it.

## Addendum (2026-08-24): pure-PowerShell validation and timings — no Git Bash needed

Plan C was re-proven three more times against a live Claude Code session (the AHQ-211 research session itself,
resumed after each kill), with no Git Bash anywhere in the chain:

1. `temp/AHQ-211/kill-claude-session-pure-powershell.ps1` — env read → live-`claude`-process sanity check →
   `taskkill /PID $env:CLAUDE_PID /F`, with millisecond logging. Killed the session.
2. The bare PowerShell one-liner `taskkill /PID $env:CLAUDE_PID /F`. Killed the session.
3. The cmd-expanded form `cmd /c "taskkill /PID %CLAUDE_PID% /F"` (proving the batch syntax — cmd, not PowerShell,
   expanded the variable). Killed the session.

Measured timing (run 3 of the script, minimal-turn): script start → taskkill fired **174 ms** (mostly PowerShell
startup; the sanity check was ~35 ms); taskkill fired → the user's shell had already regained the prompt and
printed a millisecond timestamp **413 ms** later. **Total ≈ 590 ms**, comfortably inside the integration test's
~1 s window. (Terminal spinners showing minutes are the Claude turn timer — model latency before the tool call —
plus the UI freezing on its last frame once claude dies; not the kill.)

Consequences adopted into the plan: **batch/cmd is dropped as an artifact** (Claude Code's Windows shell tools are
only PowerShell — always — and Bash — only with Git for Windows; cmd is never one of them), and the recommended
production shape is a `kill-current-cli-process.ps1` dispatched per-OS from SKILL.md, which works in both Windows
shell modes and removes the MSYS quirks from the earlier in-`.sh` branch sketch above.

## Superseded material

- `01-perplexity-question-about-killing-script.md`: the first answer recommended `taskkill /F` (right mechanism,
  wrong exit-code claim and a PID script that resolved the wrong process); the follow-up endorsed the graceful
  broadcast, which the real binary then defeated. Both remain as the research trail.
- Research-session fake-claude experiments (rounds 1 and 2) remain valid as *mechanism* tests — they proved the
  console-event API works and characterised `taskkill`, `process.kill`, MSYS `kill` and exit codes — but their
  graceful-path conclusion does not transfer to the real `claude.exe`.

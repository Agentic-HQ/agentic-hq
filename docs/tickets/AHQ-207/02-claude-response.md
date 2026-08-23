# AHQ-207 — The npm `allow-scripts` Warning On Ubuntu: Analysis, Research And Next Steps

**Date:** 2026-08-23
**Author:** Claude (Opus 5), in response to `01-steve-prompt-about-problem-while-testing-npm-on-Linux-VM.md`
**Context read:** AHQ-207 (Jira), `docs/tickets/AHQ-195/workflow-files/01-feature-brief.md`, the AHQ-207
Confluence run log, `supporting-docs/01-surprising-success-running-reversal-workflow-on-linux.md`,
`supporting-docs/02-experiment-output.txt`, plus verification commands run live on the Ubuntu VM.

**Status:** the Linux npm-12 failure mode has been **reproduced on the VM against real npm 12.0.2**,
and the proposed one-line fix **verified working** — see §5.1. The macOS failure mode is confirmed at
its root cause too (§5.1e). Nothing in this report now rests on inference.

**The fix, for anyone who only reads this far — needed on macOS *and* Linux:**

```bash
npm install -g --allow-scripts=agentic-hq,node-pty agentic-hq
```

---

## 1. Executive Summary

**Nothing is broken today, and no extra install commands are needed.** The premise in the run log —
that the warning means AHQ's scripts were blocked and something must be approved — is not what
happened. On **npm 11.16.0** the `allowScripts` mechanism is **advisory only**: npm prints the list of
unreviewed install scripts and then *runs them anyway*. Both `node-pty`'s compile and AHQ's own
`chmod` postinstall executed normally. That is why the `reversal` workflow ran perfectly.

**But there is a real defect underneath it, and it is live now — not pending.** npm 12 flips
`allowScripts` to *blocking* by default. **npm 12.0.0 shipped 8 July 2026 and `latest` on the
registry is 12.0.2 today**, so `npm install -g npm@latest` already puts a user in the blocking world.
When a user on npm 12 runs `npm install -g agentic-hq`:

- **On Linux** — `node-pty` never compiles (it ships **no Linux prebuild**), so there is no
  `pty.node` anywhere, and *every* `agentic-hq` command dies at startup.
- **On macOS** — `node-pty` loads from its darwin prebuild, but AHQ's `chmod` postinstall never runs,
  so `spawn-helper` stays non-executable and workflows fail at runtime with `posix_spawnp failed` —
  **the exact bug that got `agentic-hq@0.1.0` deprecated.**

And the obvious mitigation does not work for our primary install route: `npm approve-scripts` writes
to a *project* `package.json`, so it **errors with `EGLOBAL` on `npm install -g`**.

**Are we safe on npm 11?** Yes — but that safety is borrowed and partial. We are structurally safe as
a project (the repo installs with **pnpm**, which is untouched by this; npm is **not** pinned
anywhere, and would not help if it were). Most *users* are safe today only because no released Node
bundles npm 12 yet (Node 24 → npm 11.x, Node 26 → 11.18.0). But anyone who keeps their npm current is
**already broken**, and the majority's safety expires whenever Node bumps its bundled npm — npm 12
already supports `^24.15.0`, our exact pinned Node. Full breakdown in §5.4.

**Recommendation:** treat this as two separate pieces of work — a small docs correction now
(AHQ-199), and a packaging change to remove AHQ's dependency on install scripts entirely. Given npm 12
is already shipping, the second is more urgent than "before npm 12 becomes the common case" implies.
Details in §7–§8.

**For AHQ-207 itself:** this is *not* a blocker. The run should continue.

---

## 1a. DECISION (Steve, 2026-08-23) — fix the install command, defer the packaging work

**Decided: change the documented install command; do not raise a Jira for the `node-pty` swap.**

> *"This sounds very, very complex and difficult. I'm not even going to raise a future Jira for this —
> if allowing these scripts becomes a problem we'll investigate that later. For now everything works
> by just changing our install."*

**Rationale (and this reasoning holds up — see §7 for the options it was weighed against):**

- The one-line install change is **verified working on every npm generation tested** — 11.12.1,
  11.16.0 and 12.0.2 — on **both** macOS and Linux (§5.1d, §5.1f). It is a real fix, not a stopgap.
- The alternative (Option B, swapping `node-pty`) is genuinely expensive for the benefit: the only
  viable candidate is on a **beta** version line, its macOS exec-bit behaviour is **unverified**, and
  it puts a **non-Microsoft package in the process-spawning slot** — against AHQ-170's explicit
  pinning policy. That is a lot of supply-chain risk to absorb for a problem that already has a
  working one-line answer.
- Deferring is cheap **because the workaround is stable**: `--allow-scripts` is npm's own sanctioned
  mechanism, not a hack, and npm 12's own error message points users at it independently of our docs.

**Accepted residual risk:** the docs fix only protects people who *follow the docs*. Anyone installing
with the plain `npm install -g agentic-hq` from muscle memory, a bookmark or a stale blog post will
still get a broken install on npm 12. Partially covered by the troubleshooting entry (§8 item 5) and
by npm 12's own message naming the right fix.

**Revisit if any of these happen** — this is the trigger list, so the decision can be re-taken on
evidence rather than by memory:

1. Node starts bundling npm 12 (today: Node 24 → npm 11.x, Node 26 → 11.18.0), making blocked scripts
   the default experience rather than an opt-in minority.
2. Users start reporting the `Failed to load native module: pty.node` or `posix_spawnp failed` errors
   — i.e. the residual risk above becomes observed rather than theoretical.
3. `@lydell/node-pty` (or upstream `node-pty` 1.2.0) reaches a **stable** release, which removes the
   main objection to Option B.
4. npm removes the `--allow-scripts` escape hatch, or narrows it further in npm 13.

**Two small items folded in NOW rather than deferred** (minutes each, not tickets) — see §8 items 5a
and 6.

---

## 2. What Actually Happened — The Evidence

### 2.1 The warning

```
npm warn allow-scripts 2 packages have install scripts not yet covered by allowScripts:
npm warn allow-scripts   agentic-hq@0.2.0 (postinstall: chmod +x node_modules/node-pty/prebuilds/darwin-*/spawn-helper …)
npm warn allow-scripts   node-pty@1.1.0 (install: node scripts/prebuild.js || node-gyp rebuild; postinstall: node scripts/post-install.js)
npm warn allow-scripts Run `npm approve-scripts --allow-scripts-pending` to review, or `npm approve-scripts <pkg>` to allow.
```

Note the wording: *"not yet covered by allowScripts"* — a statement about your **allowlist**, not about
what npm did. It is a nag, not a refusal.

### 2.2 The verification run on the VM

| Check | Result | What it proves |
| --- | --- | --- |
| `npm -v` | `11.16.0` | The advisory-warning version, not the blocking one |
| `ls node-pty/build/Release/` | `-rwxrwxr-x … 75728 … pty.node`, timestamped `14:13` (install time) | **node-gyp actually compiled it** — the `install` script ran |
| `ls node-pty/prebuilds/` | `darwin-arm64  darwin-x64  win32-arm64  win32-x64` | **No Linux prebuild** — Linux depends entirely on that compile |
| `find … -name spawn-helper` | `darwin-arm64/spawn-helper` and `darwin-x64/spawn-helper` are `-rwxrwxr-x` | **AHQ's own `chmod` postinstall ran too** |
| `agentic-hq reversal` | Full four-stage run completed, Claude Code TUI rendered, string reversed | The PTY works end-to-end |

Every install script ran. The install is complete and correct. There is nothing to approve.

### 2.3 Two incidental corrections

Worth recording because both appear in current docs and in the run-log reasoning:

1. **There is no Linux `spawn-helper` at all.** `build/Release/` contains only `pty.node`.
   `spawn-helper` is a macOS-specific shim (it works around Darwin's `posix_spawn` behaviour); on
   Linux `node-pty` never needs it. So the question "is the thing we need to `chmod +x` actually
   executable?" has a cleaner answer on Linux than expected: **the file that would need it does not
   exist, and is not wanted.**

2. **The `darwin-*` glob is not a no-op on Linux.** `docs/user-docs/troubleshooting.md:206` says the
   glob "matches nothing, so it's a no-op". It *does* match — `node-pty`'s tarball ships the
   `prebuilds/darwin-arm64/` and `darwin-x64/` directories on **every** platform, which is exactly
   why those two `spawn-helper` files showed up as `-rwxrwxr-x` on the VM. The chmod runs on Linux
   and marks binaries Linux never loads. Harmless — but the doc's *conclusion* ("ignore it") is
   currently right for the **wrong reason**, and a wrong reason in a troubleshooting doc will mislead
   the next person who reasons from it.

---

## 3. Research: Why It Worked — npm 11 vs npm 12

This is a phased ecosystem change, driven by the June 2026 "Miasma" supply-chain attack (32 packages
compromised in Red Hat's namespace, then 57 more within two hours).

| | npm 11.16.0+ (**the VM today**) | npm 12 |
| --- | --- | --- |
| Unreviewed install scripts | **Run normally**, with a warning listing them | **Blocked by default** |
| `allowScripts` field | Advisory | Enforced |
| Implicit `node-gyp` builds | Run | **Do not run** |
| Non-registry sources (git, remote URL) | Allowed | Opt-in only |

The intent of the npm 11 warning is explicitly to let people **audit before npm 12 lands** — which is
precisely the service this AHQ-207 run has just performed for us.

### 3.1 Release status — verified against the registry, not inferred

**npm 12 is released and is already the default `latest`.** Registry state as of 2026-08-23:

```console
$ npm view npm dist-tags
{ …, "latest": "12.0.2", "next-11": "11.19.0", "next-12": "12.0.2" }

$ npm view npm versions   # 12.x line
12.0.0-pre.0.0, 12.0.0-pre.1, 12.0.0-pre.2, 12.0.0-pre.3, 12.0.0, 12.0.1, 12.0.2
```

- **npm 12.0.0 shipped 8 July 2026**; the line is already three patches deep (12.0.2).
- **`npm install -g npm@latest` today gives you npm 12** — i.e. blocking behaviour.
- npm 12 declares support for `^22.22.2 || ^24.15.0 || >=26.0.0` — note that includes **our exact
  pinned Node**, `.nvmrc` = 24.15.0. There is no Node-version barrier holding it back.
- The **npm 11 line is still maintained** (`next-11` = 11.19.0, i.e. releases continued past the
  11.16.0 on the VM), so staying on 11 is a supported position for now, not an abandoned one.

**But no released Node version bundles npm 12 yet:** Node 24 ships npm 11.x (the VM's 24.18.0 has
11.16.0), and even Node 26 ships 11.18.0. So the *default* path — install Node, use the npm that came
with it — is still on npm 11 today.

That distinction is the whole answer to "are we safe?", and it is worked through in §5.4.

**Sources:**
- [npm-approve-scripts (npm docs v11)](https://docs.npmjs.com/cli/v11/commands/npm-approve-scripts/)
- [Preparing for npm v12: install scripts and non-registry sources become opt-in](https://github.com/orgs/community/discussions/198547)
- [npm 12 disables install scripts by default (The Hacker News)](https://thehackernews.com/2026/07/npm-12-disables-install-scripts-by.html)
- [npm/cli#9463 — allow-scripts warning suggests `npm approve-scripts`, which errors EGLOBAL](https://github.com/npm/cli/issues/9463)
- [npm/cli#9457 — unreviewed-scripts warning during global installs, where it can't work](https://github.com/npm/cli/issues/9457)

---

## 4. Why agentic-hq Depends On Install Scripts At All

Two independent dependencies on install-time script execution, one per platform.

### 4.1 Linux — `node-pty` must compile from source

`node-pty@1.1.0`'s prebuild matrix, verified on both the Mac clone and the VM:

```
prebuilds/darwin-arm64   prebuilds/darwin-x64   prebuilds/win32-arm64   prebuilds/win32-x64
```

No `linux-x64`. No `linux-arm64`. Its `install` script is:

```json
"install": "node scripts/prebuild.js || node-gyp rebuild"
```

`prebuild.js` checks for `prebuilds/${process.platform}-${process.arch}` and **exits 1** when absent —
deliberately falling through to `node-gyp rebuild`. On Linux that fallthrough *is* the install. Block
the script and nothing gets built.

This confirms the `// node-pty` comment in `package.json:73` (AHQ-170) and **contradicts**
`docs/jira-docs/AHQ-152/DRAFT-AHQ-152-Jira-Description.md:68`, which claims "All-platform prebuilds
bundled inside its npm tarball" and that `install` "just **checks** a prebuild exists → exits 0".
That AHQ-152 statement is wrong for Linux. It is a historical Jira draft so probably not worth
editing, but it should not be used as a source again.

### 4.2 macOS — AHQ's own `postinstall` repairs an exec bit

```json
"postinstall": "chmod +x node_modules/node-pty/prebuilds/darwin-*/spawn-helper ../node-pty/prebuilds/darwin-*/spawn-helper 2>/dev/null || true"
```

Both npm and pnpm extract `spawn-helper` as `-rw-r--r--` instead of `-rwxr-xr-x`. Without the chmod,
macOS runs hit `Error: posix_spawnp failed` the moment a workflow launches Claude Code. This is
already documented as the cause of the deprecated `agentic-hq@0.1.0`
(`docs/user-docs/troubleshooting.md`, "Old or broken versions on the registry").

### 4.3 The failure is loud, not silent — the import chain

I checked whether a missing binary would be caught by the README's verification step
(`agentic-hq list`) or slip through to first workflow run. It is caught, because the import is
**static and eager** all the way down:

```
bin/agentic-hq-prebuilt.cjs
  → src/cli/main.ts
    → src/cli/app.ts:11              import { CompositionRoot }
      → src/kernel/composition-root.ts:24   import { PtyCLIWrapper }
        → src/io/terminal/pty-cli-wrapper.ts:18   import { spawn } from 'node-pty'
          → node-pty/lib/index.js → lib/unixTerminal.js:27
            → var native = utils_1.loadNativeModule('pty');   // TOP-LEVEL — throws
```

`loadNativeModule` tries `build/Release`, `build/Debug`, then `prebuilds/<platform>-<arch>` and
throws if all miss:

```
Error: Failed to load native module: pty.node, checked: build/Release, build/Debug, prebuilds/linux-x64: …
```

Because ESM static imports are hoisted and evaluated before any module body runs, this fires on
**every** `agentic-hq` invocation — including `agentic-hq list`, which never spawns a PTY. So the
README's "verify it's on your PATH: `agentic-hq list`" step **does** catch an npm-12 breakage
immediately. Good news for detectability: this is a loud install-time failure, not a silent time bomb
that waits for the first workflow.

---

## 5. What Breaks Under npm 12

| Platform | What is blocked | Symptom |
| --- | --- | --- |
| **Linux** | `node-pty` `install` → no node-gyp → no `pty.node` | `agentic-hq list` fails instantly: `Failed to load native module: pty.node` |
| **macOS** | AHQ `postinstall` → `spawn-helper` stays `-rw-r--r--` | `list` works; **workflows** fail with `Error: posix_spawnp failed` (the deprecated-0.1.0 bug returns) |
| Windows | n/a | Unsupported |

macOS is the nastier of the two: the advertised verification step passes, and the failure only
appears later when a workflow launches Claude Code.

**Both rows are now evidence-backed** — Linux in §5.1, macOS in §5.1e.

#### 5.1e macOS — the blocked chmod confirmed (tested on the Mac, non-destructively)

The macOS row rested on one unobserved claim: that npm's tarball extraction drops `spawn-helper`'s
executable bit, making AHQ's `chmod` postinstall load-bearing. Tested by installing into a throwaway
prefix with scripts disabled — no global install touched, nothing executed:

```console
$ npm install --prefix temp/AHQ-207/npm12-check --ignore-scripts agentic-hq
added 22 packages in 3s

$ find … -name spawn-helper -exec ls -la {} \;
-rw-r--r--  …  9248  …/prebuilds/darwin-x64/spawn-helper
-rw-r--r--  … 50480  …/prebuilds/darwin-arm64/spawn-helper

$ find … -path "*darwin*" -name pty.node -exec ls -la {} \;
-rw-r--r--  … 52864  …/prebuilds/darwin-x64/pty.node
-rw-r--r--  … 85496  …/prebuilds/darwin-arm64/pty.node
```

Contrast with the same file in a normal install where the chmod ran:

```console
$ ls -la node_modules/.pnpm/node-pty@1.1.0/node_modules/node-pty/prebuilds/darwin-arm64/spawn-helper
-rwxr-xr-x  … 50480  …/spawn-helper
```

**Confirmed:** with scripts blocked, `spawn-helper` ships **non-executable** (`-rw-r--r--`), while
`pty.node` **is** present. So on macOS under npm 12 the module loads, the CLI starts, and
`agentic-hq list` passes — then the first workflow hits a non-executable `spawn-helper`. That the
resulting error is `posix_spawnp failed` is not re-observed here, but it is the documented cause of
the deprecated `agentic-hq@0.1.0` (`docs/user-docs/troubleshooting.md`, "Old or broken versions on
the registry"), so the chain is complete: **cause observed, symptom already on record.**

This is why the README fix should be **one instruction for both platforms**, not a Linux-only note.

#### 5.1f Is the flag safe on *older* npm? — tested on npm 11.12.1

If the README carries one universal command, it must not break users on npm versions that predate the
feature. Tested on the Mac (npm **11.12.1** — older than the 11.16.0 that introduced the warning),
again into a throwaway prefix:

```console
$ npm install --prefix temp/AHQ-207/flagcheck --allow-scripts=agentic-hq,node-pty agentic-hq
npm warn Unknown cli config "--allow-scripts". This will stop working in the next major version of npm.
added 22 packages in 2s
--- exit: 0 ---

$ find … -name spawn-helper -exec ls -la {} \;
-rwxr-xr-x  …  9248  …/prebuilds/darwin-x64/spawn-helper
-rwxr-xr-x  … 50480  …/prebuilds/darwin-arm64/spawn-helper
```

**Verdict: safe.** The flag is unrecognised on npm < 11.16, but npm only *warns* — the install exits 0
and the scripts still run (`spawn-helper` executable, as it should be). Verified working across all
three npm generations:

| npm version | Flag recognised? | Install result |
| --- | --- | --- |
| 11.12.1 (Mac) | No — `Unknown cli config` warning | ✅ exits 0, scripts ran |
| 11.16.0 (VM) | Yes — suppresses the advisory nag | ✅ exits 0, scripts ran |
| 12.0.2 (VM) | Yes — **required**, or scripts are blocked | ✅ exits 0, scripts ran |

**The one cost** of going universal: users on npm < 11.16 see a spurious `Unknown cli config` line —
made more confusing by npm's own wording, *"This will stop working in the next major version of npm"*,
which is the opposite of the truth (it starts working in the next major). Node 24.15.0 ships npm
11.12.1, so this is not a rare population today.

**DECIDED (Steve, 2026-08-23): accept that cost, and cover it with a short note in the docs.** One
cosmetic warning line on older npm is a far better trade than a silently broken install on npm 12, and
a single unconditional command avoids version-branching the Quick Start. The README gets a brief note
under the install step saying that older npm versions may report
`Unknown cli config "--allow-scripts"` and that this can be safely ignored.

### 5.1 CONFIRMED BY EXPERIMENT — the Linux failure reproduced on the VM

The Linux row above is **no longer inference**. Reproduced on the VM on 2026-08-23 using
`npm_config_ignore_scripts=true` as a faithful proxy for npm 12's default (it blocks exactly the pair
npm gates — `node-pty`'s `install` and AHQ's `postinstall`). Full transcript:
`supporting-docs/02-experiment-output.txt`.

**1. The install reports clean success.**

```console
$ npm_config_ignore_scripts=true npm install -g agentic-hq
added 22 packages in 3s
3 packages are looking for funding
=== EXIT CODE: 0 ===
```

Note what is **absent**: no `allow-scripts` warning at all. The install is silent, fast, and exits 0 —
there is nothing in this output to suggest anything is wrong.

**2. No Linux binary exists anywhere.**

```console
$ ls -la .../node-pty/build/Release/
ls: cannot access '.../node-pty/build/Release/': No such file or directory

$ ls .../node-pty/prebuilds/
darwin-arm64  darwin-x64  win32-arm64  win32-x64
```

`build/Release/` was not merely empty — it was **never created**, because node-gyp never ran. The only
`pty.node` files present are the darwin and win32 prebuilds, none loadable on Linux.

**3. Every command dies at startup — including `agentic-hq list`.**

```
Error: Failed to load native module: pty.node, checked: build/Release, build/Debug, prebuilds/linux-x64: Error: Cannot find module './prebuilds/linux-x64//pty.node'
Require stack:
- .../node_modules/agentic-hq/node_modules/node-pty/lib/utils.js
- .../node_modules/agentic-hq/node_modules/node-pty/lib/index.js
    at Object.loadNativeModule (.../node-pty/src/utils.ts:28:9)
    at Object.<anonymous> (.../node-pty/src/unixTerminal.ts:15:16)
    …
Node.js v24.18.0
```

Identical crash from both `agentic-hq list` and `agentic-hq reversal`, exactly as the import-chain
analysis in §4.3 predicted. This is the verbatim text to put in the troubleshooting doc.

**4. Restoring works cleanly.** A plain `npm install -g agentic-hq` brought the warning back, rebuilt
`pty.node`, and `agentic-hq list` printed the workflow list again — so the damage is fully reversible
without touching the VM snapshot.

*(An earlier draft flagged the crash's exit code as unverified, because a pipe in the test command
masked it. That is now settled below: it is **1**.)*

#### Re-run against real npm 12.0.2 — proxy confirmed, and the fix verified

The proxy was then replaced with the real thing on the VM (`npm install -g npm@12` → **12.0.2**).
Everything the proxy showed held, and two new facts emerged.

**a. npm 12 blocks, and says so in different words.** The message changes from npm 11's
`allow-scripts … not yet covered` to:

```
npm warn install-scripts 2 packages had install scripts blocked because they are not covered by allowScripts:
npm warn install-scripts   agentic-hq@0.2.0 (postinstall: chmod +x …)
npm warn install-scripts   node-pty@1.1.0 (install: node scripts/prebuild.js || node-gyp rebuild; …)
npm warn install-scripts Run `npm install -g --allow-scripts=agentic-hq,node-pty` to allow these scripts once,
  or `npm config set allow-scripts=agentic-hq,node-pty --location=user` to allow them for all global installs.
```

Both the warning prefix (`install-scripts`, not `allow-scripts`) and the verb (**blocked**, not "not
yet covered") differ — worth knowing, because a troubleshooting doc that only matches the npm 11
wording will not help an npm 12 user.

**b. The install still exits 0; the crash exits 1.** Measured without a pipe this time:

```
--- install exit: 0 ---
--- agentic-hq list REAL exit code: 1 ---
```

Good news, and it closes the open question: the crash **does** signal failure properly. AHQ-207's
AC 2 (*"`agentic-hq list` exits 0"*) is therefore a valid detector — CI and scripts will catch this.
There is no second, hidden defect.

**c. Critically — npm 12's own message gives the *correct* fix.** This materially softens §5.2:
npm 11 recommends `npm approve-scripts`, which cannot work for a global install (`EGLOBAL`). npm 12
does **not** repeat that mistake — it names the `--allow-scripts=` flag and the `npm config set`
form, both of which do work globally. So the misleading-guidance problem is **npm 11 messaging only**.

**d. The proposed fix is verified working.**

```console
$ npm install -g --allow-scripts=node-pty,agentic-hq agentic-hq
--- install exit: 0 ---
$ ls …/node-pty/build/Release/
pty.node
$ agentic-hq list
Available workflows
  Agentic HQ Package: /home/…/lib/node_modules/agentic-hq
    Plugin: agentic-hq-core-plugin
      agentic-hq create-workflow …
```

node-gyp compiled, `pty.node` exists, the CLI works. (Package order in the list is irrelevant — npm
suggests `agentic-hq,node-pty`, the test used `node-pty,agentic-hq`; both work.)

**What this settles:** on npm 12, a Linux user gets a **successful-looking install (exit 0)** followed
by an **immediate crash on the first command the README tells them to run**. The install warning does
point at the right fix, but the *crash* does not — its error names `node-pty` and `linux-x64` with no
hint that npm's script policy is the cause. The one-line install fix is now **known-good, not
assumed**.

### 5.2 Why the easy fix does not apply to our main install route

`npm approve-scripts` manages the `allowScripts` field **in a project's `package.json`**. A global
install has no project `package.json`, so `npm approve-scripts -g` fails with **`EGLOBAL`**
([npm/cli#9463](https://github.com/npm/cli/issues/9463),
[#9457](https://github.com/npm/cli/issues/9457)). The npm warning our users see literally recommends
a command that **cannot work for the way we tell them to install**.

For `npm install -g` the only routes are (**both verified working on npm 12.0.2** — §5.1d):

```bash
npm install -g --allow-scripts=agentic-hq,node-pty agentic-hq
# or persist it for all global installs:
npm config set allow-scripts=agentic-hq,node-pty --location=user
```

`npx --yes agentic-hq …` has the same problem — a one-off execution with no project manifest.

**Scope correction (§5.1c):** this misleading-guidance problem is **npm 11 only**. npm 12's own
blocked-scripts message names the two commands above rather than `npm approve-scripts`, so an npm 12
user is pointed at a fix that actually works. The `EGLOBAL` trap bites only someone following npm 11's
advice.

### 5.3 We cannot fix this from our own `package.json`

Worth stating explicitly, since it is the first thing anyone will reach for: **`allowScripts` is a
consumer-side field.** A package cannot grant itself, or its dependencies, permission to run install
scripts — that would defeat the entire threat model the feature exists for. There is no version of
this where we ship a `package.json` change that makes the warning go away for our users.

That leaves only two real strategies: **tell users what to type** (§7 A), or **stop needing install
scripts at all** (§7 B/C/D).

### 5.4 Who is exposed, and when — "are we safe on npm 11?"

Short answer: **we are safe; a minority of our users already are not.** The exposure is not ours, it
is theirs, and our own npm version has almost nothing to do with it.

Two corrections to the premise first:

1. **npm is not pinned for this project.** We pin Node (`.nvmrc` = 24.15.0, `engines.node` =
   `^22 || ^24`) and pnpm (`packageManager` = `pnpm@11.1.2`, `engines.pnpm` = `>=11.0.0`). There is
   **no npm pin anywhere** — `engines` has no `npm` key, and the `.npmrc` files contain a *pnpm*
   setting (`frozen-lockfile=true`), not npm config.
2. **It would not help if there were.** We install this repo's dependencies with **pnpm**, which has
   its own separate build-approval mechanism (`allowBuilds`, already configured across the repo per
   AHQ-152/AHQ-136). npm 12's change does not touch our development workflow at all. The risk lands
   entirely on people running `npm install -g agentic-hq`, whose npm version we do not control.

| Population | Safe today? | Why |
| --- | --- | --- |
| **Us / contributors** (repo dev) | **Yes** — and structurally, not by luck | pnpm, not npm. `allowBuilds` already configured. Unaffected by npm 12 entirely. |
| **Users on Node's bundled npm** (the documented path) | **Yes, today** | No released Node bundles npm 12: Node 24 → npm 11.x, Node 26 → npm 11.18.0 |
| **Users who ran `npm install -g npm@latest`** | **No — broken right now** | `latest` has been 12.x since 8 July 2026 |
| **Everyone, once Node bumps its bundled npm** | **No** | npm 12 already supports `^24.15.0`; this is a *when*, not an *if* |

So the honest position: the majority of users are fine today because Node has not yet moved, but
that is a **borrowed** safety that expires on someone else's schedule, and there is already a live
minority — anyone who keeps their npm current, which is exactly the security-conscious user — for whom
`npm install -g agentic-hq` produces a broken install **today**.

### 5.5 Our own early-warning canary (and its limits)

`tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts` installs the packed
tarball using the **dev machine's npm** (`npm install -g --prefix …` at line 211, `npm install
"${tarballPath}"` at line 419). So when CI or a contributor's npm reaches 12, that test will start
failing — a genuine canary.

Two limits worth noting:

- It fires as a **confusing red test**, not a clear product signal. Whoever hits it first will spend
  time working out that the toolchain changed rather than that our code broke.
- It fires **late** — only when *our* machines move, which may well be after users have moved.

This Mac is currently on **npm 11.12.1** (Node 24.15.0) — older than the 11.16.0 that introduced the
warning, which is why this has never been seen on macOS. The VM was the first machine in the project
new enough to print it at all.

---

## 6. Impact On AHQ-207 And AHQ-195

- **AHQ-207 is not blocked.** AC 2 ("`npm install -g` succeeds; `agentic-hq list` exits 0 and shows
  the shipped workflows") **passed** — node-pty compiled, the CLI runs. Continue with the full
  four-agent `add-feature` run.
- The warning is exactly the kind of thing AC 1 asks you to capture: *"Any step the README does not
  cover that was needed is a docs defect → file/feed into AHQ-199."* Strictly, no step was *needed* —
  so the docs defect is narrower than first thought: the README should tell users the warning is
  expected and harmless, rather than adding approval commands that are not currently required.
- **Does this hold up AHQ-195?** My view: **no, but it is closer than I first thought and it is your
  call.** The argument against blocking: what is published today works for everyone on the documented
  install path (Node's bundled npm, which is still 11.x everywhere). The argument for taking it
  seriously now: AHQ-195's stated purpose is *"a stranger can `npm install -g agentic-hq` and run
  `add-feature`"* — and a stranger who keeps their npm up to date **cannot do that today**. That is a
  direct hit on the parent's premise, not a hypothetical.
  A reasonable middle path is to ship the §8 docs items (which cost ~30 minutes and cover the
  interim with the `--allow-scripts` form) as part of AHQ-199, and let the packaging fix land on its
  own schedule rather than gating the publish.

---

## 7. Options

### Option A — Docs only (do this now, cheap)

Make `npm install -g --allow-scripts=agentic-hq,node-pty agentic-hq` the documented install command
for everyone, on every platform and every npm version (§8 item 3).

- **Pros:** ~30 minutes, zero risk, verified working on npm 11.12.1 / 11.16.0 / 12.0.2. Fixes the
  breakage for anyone who follows the README, on both macOS and Linux.
- **Cons:** Only helps people who *read* the README — anyone with the plain command in muscle memory,
  a bookmark, or a blog post still gets a broken install on npm 12. Adds a spurious
  `Unknown cli config` warning for users on npm < 11.16 (§5.1f). And it is a long command to put in
  a Quick Start whose whole appeal is `npm install -g agentic-hq`.

### Option B — Switch to a prebuilt-only `node-pty` (**recommended structural fix**)

[`@lydell/node-pty`](https://www.npmjs.com/package/@lydell/node-pty) ships prebuilt binaries for all
supported platforms and **never calls `node-gyp`**. Multi-arch forks exist too
([homebridge/node-pty-prebuilt-multiarch](https://github.com/homebridge/node-pty-prebuilt-multiarch)
covers macOS, Windows, and Linux glibc **and** musl).

- **Pros:** Removes the Linux compile *and* the `build-essential` + `python3` prerequisite entirely —
  a materially simpler Quick Start. Faster installs. Fully npm-12-proof for the Linux half. Aligns
  with where the ecosystem is being pushed.
- **Cons:** A new third-party dependency to vet (supply-chain review needed — cf. AHQ-170's pinning
  rationale). Does **not** by itself fix the macOS `spawn-helper` chmod, unless the fork already
  ships the exec bit correctly — **that needs verifying before committing to this route.** API
  compatibility also needs checking, though these are drop-in forks by design.

### Option C — Wait for `node-pty` 1.2.0

`node-pty@1.2.0-beta.2` and later **do** ship a Linux prebuild. Current registry state: `latest` is
still `1.1.0`; `beta` is `1.2.0-beta.15`.

- **Pros:** Stays on the Microsoft-maintained upstream — no new supply-chain surface.
- **Cons:** Still beta after 15 iterations, no stable date.
  [microsoft/node-pty#860](https://github.com/microsoft/node-pty/issues/860) reports the
  **linux-arm64 prebuild is actually an x86-64 binary** — so even when it lands, arm64 Linux may
  still fall back to compiling. Pinning a beta contradicts the AHQ-170 exact-pin safety policy.

### Option D — Vendor a Linux prebuild ourselves

Build `pty.node` for linux-x64/arm64 in CI and ship it inside the AHQ release tarball.

- **Pros:** Full control; no new dependency.
- **Cons:** We take on native-binary build and maintenance across Node ABI versions, glibc/musl, and
  architectures. Realistically the worst cost/benefit of the four.

### Option E — Lazy-load `node-pty` (defence in depth, complements any of the above)

Make the `node-pty` import dynamic inside `PtyCLIWrapper` so read-only commands (`list`, `--help`,
`--version`) work even when the native module is missing, and a *missing PTY* produces a targeted,
actionable error instead of a raw `Failed to load native module` stack.

- **Pros:** Much better failure message; `list` keeps working for diagnosis.
- **Cons:** **This is a genuine trade-off, not a free win.** §4.3 established that eager loading makes
  the failure loud at the README's verification step — lazy loading would *hide* an npm-12 breakage
  from `agentic-hq list` and defer it to first workflow run. Only worth doing **with** an explicit
  startup preflight check, never as a silent fallback (and note `CLAUDE.md`'s "never catch errors and
  fall back to defaults" rule applies squarely here).

---

## 8. Recommended Next Steps

**Immediate — inside AHQ-207 (no new work, just recording):**

1. Continue the AHQ-207 run. This finding is a defect to raise, not a blocker.
2. Add the §2.2 verification table to the Confluence run log so the "why did it work?" question is
   answered permanently — and the §5.1 experiment alongside it, since together they are the whole
   story: *scripts ran, so it worked; block them and it dies instantly.*

**Docs — feed into AHQ-199:**

3. `README.md:45` — **change the documented install command itself**, for everyone on every platform:

   ```bash
   npm install -g --allow-scripts=agentic-hq,node-pty agentic-hq
   ```

   Not a Linux-only note, and not an "if you're on npm 12" branch — one command. §5.1f shows it is
   safe on every npm tested (11.12.1, 11.16.0, 12.0.2), and §5.1e shows macOS needs it too.

   Plus a short note directly under that install step (decided, §5.1f):

   > Older versions of npm may report `Unknown cli config "--allow-scripts"`. This can be safely
   > ignored — the install still completes correctly.

   **Do not** also document the `allow-scripts` *warning* as "expected, ignore it" — that was an
   earlier draft of this report and it contradicts the change above. A user following the new command
   never sees that warning: on npm 12 the flag prevents the block, on npm 11.16+ it satisfies the
   allowlist so the nag does not print. (Note this is a **different** message from the
   `Unknown cli config` note above, which *is* needed.) The `allow-scripts` warning text belongs in
   troubleshooting (step 5), for people who arrive with the *old* command from muscle memory or a
   stale copy — not in the README.
4. `docs/user-docs/troubleshooting.md:197–208` — fix the reasoning at line 206 (the `darwin-*` glob
   **does** match on Linux; it is harmless because Linux never loads those binaries, not because it
   matches nothing). Consider promoting this out of the *Contributor* section: it currently only
   appears under `npm link`, but tool users hit it on plain `npm install -g` — which is exactly how
   this was missed.
5. Add a troubleshooting entry for the npm 12 symptoms in §5, with the `--allow-scripts` and
   `npm config set allow-scripts` workarounds, and an explicit note that `npm approve-scripts` does
   **not** work for global installs. Use the **verbatim** error string captured in §5.1
   (`Failed to load native module: pty.node, checked: build/Release, build/Debug, prebuilds/linux-x64`)
   as the entry's heading — that is the exact text a user will paste into a search box, and it
   currently matches nothing in our docs.

5a. **`docs/user-docs/troubleshooting.md:58` — fix a now-misleading entry.** The existing
   *"`node-pty` install fails / `posix_spawnp failed` at runtime (older macOS)"* entry gives exactly
   one cause (macOS older than 13.5) and one fix (**upgrade macOS**). After npm 12, that same error
   has a **second and far more likely cause** — the blocked `chmod` postinstall (§5.1e) — and sending
   that user off to upgrade their operating system is worse than no entry at all. Add the npm 12
   cause **above** the macOS-version one, with the `--allow-scripts` reinstall as the fix.
   *This one matters because macOS fails silently through `agentic-hq list`, so the troubleshooting
   doc is the only thing standing between the user and a wrong diagnosis.*

**Code — one small change now (not a ticket):**

6. **`tests/e2e/npm-package/prebuilt-tarball-install-runs-math-workflow.e2e.test.ts`** (lines 211 and
   419) installs the packed tarball with the **dev machine's npm** and no flag. Two reasons to add
   `--allow-scripts=agentic-hq,node-pty` now:
   - **It stops a mystery red build.** The day CI or a contributor's npm reaches 12, this test starts
     failing for reasons that have nothing to do with the change in front of them (§5.5).
   - **It makes the test honest.** The test should install the way we *document* installing. Once the
     README carries the flag, a test that installs without it is no longer testing the shipped path.

**Deferred by decision (§1a) — no Jira raised:**

7. The `node-pty` packaging swap (Option B) is **not being raised as a ticket**. See §1a for the
   rationale, the accepted residual risk, and the four trigger conditions for revisiting. If it is
   ever picked up, the scope notes are preserved in §7 Option B/C — including that it would let us
   **delete** the `build-essential` + `python3` prerequisite from the README, and that it must be
   reconciled with AHQ-170's node-pty pinning policy.

---

## 9. Open Questions For Steve

1. **Does npm 12 exposure block AHQ-195?** My reading is **no** — the documented install path (Node's
   bundled npm) is still 11.x everywhere. But npm 12 is *already released*, not pending, so the
   people it breaks exist today rather than in the future. Your call whether that is acceptable to go
   public with, given AHQ-195's premise is precisely "a stranger can install and run it". See §6.
2. **Is it worth pinning/short-circuiting anything as an interim guard?** I could not find a way to
   do this from our side — `allowScripts` is consumer-side (§5.3), so there is no `package.json`
   change that helps. If you want interim cover, it has to be documentation telling users the
   `--allow-scripts` form. Flagging in case you can see an angle I have not.
3. **Appetite for swapping `node-pty`?** Option B is the clean fix and removes a prerequisite, but it
   means a non-Microsoft dependency in the most security-sensitive slot we have (a package that spawns
   processes). Given AHQ-170's explicit pinning rationale, I did not want to assume.
4. **Worth confirming the real exit code?** ~~Do you want the npm 12 failure mode tested for real?~~
   **Done for Linux** — reproduced on the VM, §5.1. Two loose ends remain if you want them closed:
   - The **exit code** of the crashed `agentic-hq list` was masked by a pipe in my command block
     (§5.1, caveat). One line settles it; it matters because AC 2 is phrased in terms of exiting 0.
   - The **macOS failure mode** (`spawn-helper` chmod skipped → `posix_spawnp failed`) is still
     predicted rather than observed. It could be checked on this Mac with
     `npm_config_ignore_scripts=true npm install -g agentic-hq` and running a workflow — but that
     would temporarily break your working Mac install, so I would not do it without you saying so.
5. **Should I make the §8 docs edits now**, or do they belong to AHQ-199's own workflow run?

---

## Appendix — Verification Commands

Run on the VM, 2026-08-23, against `agentic-hq@0.2.0` installed via `npm install -g`, Node v24.18.0,
npm 11.16.0:

```bash
AHQ="$(npm prefix -g)/lib/node_modules/agentic-hq"
npm -v
ls -la "$AHQ/node_modules/node-pty/build/Release/"
ls "$AHQ/node_modules/node-pty/prebuilds/"
find "$AHQ" \( -name "*.node" -o -name "spawn-helper" \) -exec ls -la {} \;
```

Key output:

```
11.16.0
-rwxrwxr-x 1 … 75728 Aug 23 14:13 …/node-pty/build/Release/pty.node
darwin-arm64  darwin-x64  win32-arm64  win32-x64
-rwxrwxr-x 1 …  50480 …/node-pty/prebuilds/darwin-arm64/spawn-helper
-rwxrwxr-x 1 …   9248 …/node-pty/prebuilds/darwin-x64/spawn-helper
```

### npm / node-pty release status (read-only registry queries, from the Mac)

```bash
npm view npm dist-tags          # → "latest": "12.0.2", "next-11": "11.19.0"
npm view npm versions           # → 12.0.0, 12.0.1, 12.0.2 published
npm view node-pty dist-tags     # → "latest": "1.1.0", "beta": "1.2.0-beta.15"
```

Machine versions for the record: **VM** = Node v24.18.0 / npm 11.16.0. **Mac** = Node v24.15.0 /
npm 11.12.1 (pre-dates the 11.16.0 warning, hence never seen on macOS).

### Additional sources for §3.1

- [npm 12 Released: Install Scripts off by Default as Registry Moves to Explicit Trust (InfoQ)](https://www.infoq.com/news/2026/08/npm-12-released/)
- [npm/cli Release v12.0.0](https://github.com/npm/cli/releases/tag/v12.0.0)
- [npm/cli Release v12.0.2](https://github.com/npm/cli/releases/tag/v12.0.2)
